// IDEALAUNCH backend — Node.js + Express + PostgreSQL (Supabase)
// Run:  cd server && npm run dev
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { pool, initDb, mapIdea } = require("./db");

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/*
 * JWT_SECRET: fail fast in production when unset/weak instead of silently
 * falling back to a publicly known dev secret (tokens would be forgeable).
 */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || String(JWT_SECRET).length < 32) {
  console.error(
    "JWT_SECRET missing or too short (<32 chars). Set a long random value in server/.env\n" +
      'Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL.split(",").map((s) => s.trim()).filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);
app.use(express.json({ limit: "32kb" }));

/* Brute-force protection on auth endpoints */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again in 15 minutes." },
});
/* General API limiter */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Slow down." },
});

const cap = (s) => String(s).replace(/\b\w/g, (c) => c.toUpperCase());
const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ""));
/* Wrap async handlers so rejections hit the error handler instead of crashing */
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
/* Numeric path id guard (avoids pg driver type errors / 500s) */
const numId = (req, res) => {
  const n = Number(req.params.id);
  if (!Number.isInteger(n) || n <= 0) {
    res.status(400).json({ message: "Invalid id." });
    return null;
  }
  return n;
};

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
}
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return res.status(401).json({ message: "Login required." });
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Session expired. Sign in again." }); }
}
const pubUser = (u) => ({ id: u.id, name: u.name, email: u.email });

app.get("/", apiLimiter, (req, res) => res.json({ name: "IDEALAUNCH API", status: "ok", db: "postgres" }));
app.get("/api/health", apiLimiter, (req, res) => res.json({ ok: true, db: "postgres" }));

/* ---------- AUTH ---------- */
app.post("/api/auth/signup", apiLimiter, authLimiter, ah(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || String(name).trim().length < 2 || String(name).trim().length > 60)
    return res.status(400).json({ message: "Enter your name." });
  if (!isEmail(email)) return res.status(400).json({ message: "Enter a valid email." });
  if (!password || String(password).length < 6 || String(password).length > 128)
    return res.status(400).json({ message: "Min 6 characters." });
  const e = String(email).trim().toLowerCase();
  const ex = await pool.query("SELECT id FROM users WHERE email=$1", [e]);
  if (ex.rows.length) return res.status(409).json({ message: "Account exists. Sign in." });
  const hash = await bcrypt.hash(String(password), 10);
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, pass_hash) VALUES ($1,$2,$3) RETURNING id, name, email",
    [cap(String(name).trim()), e, hash]
  );
  res.status(201).json({ token: signToken(rows[0]), user: pubUser(rows[0]) });
}));

app.post("/api/auth/signin", apiLimiter, authLimiter, ah(async (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ message: "Enter a valid email." });
  if (!password || String(password).length < 6 || String(password).length > 128)
    return res.status(400).json({ message: "Min 6 characters." });
  const e = String(email).trim().toLowerCase();
  const found = await pool.query("SELECT * FROM users WHERE email=$1", [e]);
  if (!found.rows.length) {
    // No auto-registration: an account must be created via sign-up first.
    return res.status(401).json({ message: "Account not found. Sign up first." });
  }
  const user = found.rows[0];
  const ok = await bcrypt.compare(String(password), user.pass_hash);
  if (!ok) return res.status(401).json({ message: "Incorrect password." });
  res.json({ token: signToken(user), user: pubUser(user) });
}));

app.get("/api/auth/me", ah(auth), ah(async (req, res) => {
  const { rows } = await pool.query("SELECT id, name, email FROM users WHERE id=$1", [req.user.id]);
  if (!rows.length) return res.status(404).json({ message: "Not found." });
  res.json({ user: pubUser(rows[0]) });
}));

app.put("/api/auth/profile", ah(auth), ah(async (req, res) => {
  const { name, email } = req.body || {};
  if (name && (String(name).trim().length < 2 || String(name).trim().length > 60))
    return res.status(400).json({ message: "Name too short." });
  if (email && !isEmail(email)) return res.status(400).json({ message: "Enter a valid email." });
  const cur = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
  if (!cur.rows.length) return res.status(404).json({ message: "Not found." });
  const newName = name ? cap(String(name).trim()) : cur.rows[0].name;
  let newEmail = cur.rows[0].email;
  if (email) {
    const e = String(email).trim().toLowerCase();
    const dup = await pool.query("SELECT id FROM users WHERE email=$1 AND id<>$2", [e, req.user.id]);
    if (dup.rows.length) return res.status(409).json({ message: "Email already in use." });
    newEmail = e;
  }
  const { rows } = await pool.query(
    "UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING id, name, email",
    [newName, newEmail, req.user.id]
  );
  res.json({ token: signToken(rows[0]), user: pubUser(rows[0]) });
}));

/* ---------- IDEAS ---------- */
app.get("/api/ideas", apiLimiter, ah(async (req, res) => {
  const q = String(req.query.q || "").toLowerCase().trim().slice(0, 100);
  const category = req.query.category;
  const sort = req.query.sort === "likes" ? "likes DESC" : "title ASC";
  const params = [];
  let where = "TRUE";
  if (q) { params.push(`%${q}%`); where += ` AND LOWER(title || ' ' || category || ' ' || description) LIKE $${params.length}`; }
  if (category && category !== "All") { params.push(String(category).slice(0, 50)); where += ` AND category = $${params.length}`; }
  const { rows } = await pool.query(`SELECT * FROM ideas WHERE ${where} ORDER BY ${sort}`, params);
  res.json({ ideas: rows.map(mapIdea) });
}));

app.get("/api/ideas/:id", apiLimiter, ah(async (req, res) => {
  const id = numId(req, res);
  if (id === null) return;
  const { rows } = await pool.query("SELECT * FROM ideas WHERE id=$1", [id]);
  if (!rows.length) return res.status(404).json({ message: "Idea not found." });
  res.json({ idea: mapIdea(rows[0]) });
}));


app.post("/api/ideas", ah(auth), ah(async (req, res) => {
  const { title, category, icon, desc, problem, solution, features } = req.body || {};
  if (!title || String(title).trim().length < 3 || String(title).trim().length > 120)
    return res.status(400).json({ message: "Title min 3 chars." });
  if (!desc || String(desc).trim().length < 10 || String(desc).trim().length > 500)
    return res.status(400).json({ message: "Desc min 10 chars." });
  if (!problem || !solution || String(problem).trim().length > 1000 || String(solution).trim().length > 1000)
    return res.status(400).json({ message: "Problem and solution required." });
  const feats = Array.isArray(features) && features.length ? features.map(String).slice(0, 6) : ["MVP ready", "User focused", "Scalable"];
  const { rows } = await pool.query(
    `INSERT INTO ideas (title, category, icon, description, problem, solution, features, author, author_email, author_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [String(title).trim(), String(category || "Other").slice(0, 50), String(icon || "💡").slice(0, 16), String(desc).trim(),
     String(problem).trim(), String(solution).trim(), JSON.stringify(feats.map((f) => f.slice(0, 80))),
     req.user.name, req.user.email, req.user.id]
  );
  res.status(201).json({ idea: mapIdea(rows[0]) });
}));

app.delete("/api/ideas/:id", ah(auth), ah(async (req, res) => {
  const id = numId(req, res);
  if (id === null) return;
  const found = await pool.query("SELECT * FROM ideas WHERE id=$1", [id]);
  if (!found.rows.length) return res.status(404).json({ message: "Idea not found." });
  const idea = found.rows[0];
  if (idea.author_id && idea.author_id !== req.user.id) return res.status(403).json({ message: "Only owner can delete." });
  await pool.query("DELETE FROM saved_ideas WHERE idea_id=$1", [idea.id]);
  await pool.query("DELETE FROM ideas WHERE id=$1", [idea.id]);
  res.json({ ok: true });
}));

app.post("/api/ideas/:id/like", apiLimiter, ah(async (req, res) => {
  const id = numId(req, res);
  if (id === null) return;
  const { rows } = await pool.query("UPDATE ideas SET likes = likes + 1 WHERE id=$1 RETURNING *", [id]);
  if (!rows.length) return res.status(404).json({ message: "Not found." });
  res.json({ idea: mapIdea(rows[0]) });
}));


/* ---------- SAVED ---------- */
app.get("/api/saved", ah(auth), ah(async (req, res) => {
  const ids = await pool.query("SELECT idea_id FROM saved_ideas WHERE user_id=$1 ORDER BY idea_id", [req.user.id]);
  const ideas = await pool.query(
    "SELECT i.* FROM saved_ideas s JOIN ideas i ON i.id = s.idea_id WHERE s.user_id=$1 ORDER BY s.idea_id",
    [req.user.id]
  );
  res.json({ saved: ids.rows.map((r) => r.idea_id), ids: ids.rows.map((r) => r.idea_id), ideas: ideas.rows.map(mapIdea) });
}));

app.post("/api/saved/:id", ah(auth), ah(async (req, res) => {
  const ideaId = Number(req.params.id);
  if (!Number.isFinite(ideaId)) return res.status(400).json({ message: "Invalid id." });
  const ex = await pool.query("SELECT 1 FROM saved_ideas WHERE user_id=$1 AND idea_id=$2", [req.user.id, ideaId]);
  let saved;
  if (ex.rows.length) {
    await pool.query("DELETE FROM saved_ideas WHERE user_id=$1 AND idea_id=$2", [req.user.id, ideaId]);
    saved = false;
  } else {
    const ideaExists = await pool.query("SELECT 1 FROM ideas WHERE id=$1", [ideaId]);
    if (!ideaExists.rows.length) return res.status(404).json({ message: "Idea not found." });
    await pool.query("INSERT INTO saved_ideas (user_id, idea_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [req.user.id, ideaId]);
    saved = true;
  }
  const ids = await pool.query("SELECT idea_id FROM saved_ideas WHERE user_id=$1", [req.user.id]);
  res.json({ saved, ids: ids.rows.map((r) => r.idea_id) });
}));

app.use("/api", (req, res) => res.status(404).json({ message: "Endpoint not found." }));
app.use((err, req, res, next) => {
  console.error("API error:", err.message);
  if (!res.headersSent) res.status(500).json({ message: "Server error." });
});

initDb()
  .then(() => app.listen(PORT, () => console.log(`IDEALAUNCH API (Postgres) on http://localhost:${PORT}`)))
  .catch((err) => { console.error("DB init failed:", err.message); process.exit(1); });
