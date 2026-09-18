// IDEALAUNCH backend — Node.js + Express + PostgreSQL (Supabase)
// Run:  cd server && npm run dev
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool, initDb, mapIdea } = require("./db");

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "idealaunch-dev-secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

const cap = (s) => String(s).replace(/\b\w/g, (c) => c.toUpperCase());
const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ""));

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

app.get("/", (req, res) => res.json({ name: "IDEALAUNCH API", status: "ok", db: "postgres" }));
app.get("/api/health", (req, res) => res.json({ ok: true, db: "postgres" }));

/* ---------- AUTH ---------- */
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || String(name).trim().length < 2) return res.status(400).json({ message: "Enter your name." });
  if (!isEmail(email)) return res.status(400).json({ message: "Enter a valid email." });
  if (!password || String(password).length < 6) return res.status(400).json({ message: "Min 6 characters." });
  const e = String(email).trim().toLowerCase();
  const ex = await pool.query("SELECT id FROM users WHERE email=$1", [e]);
  if (ex.rows.length) return res.status(409).json({ message: "Account exists. Sign in." });
  const hash = await bcrypt.hash(String(password), 10);
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, pass_hash) VALUES ($1,$2,$3) RETURNING id, name, email",
    [cap(String(name).trim()), e, hash]
  );
  res.status(201).json({ token: signToken(rows[0]), user: pubUser(rows[0]) });
});

app.post("/api/auth/signin", async (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ message: "Enter a valid email." });
  if (!password || String(password).length < 6) return res.status(400).json({ message: "Min 6 characters." });
  const e = String(email).trim().toLowerCase();
  const found = await pool.query("SELECT * FROM users WHERE email=$1", [e]);
  if (!found.rows.length) {
    // auto-register (keeps the original demo flow)
    const hash = await bcrypt.hash(String(password), 10);
    const raw = e.split("@")[0].replace(/[._-]+/g, " ").trim() || "Innovator";
    const { rows } = await pool.query(
      "INSERT INTO users (name, email, pass_hash) VALUES ($1,$2,$3) RETURNING id, name, email",
      [cap(raw), e, hash]
    );
    return res.json({ token: signToken(rows[0]), user: pubUser(rows[0]), autoRegistered: true });
  }
  const user = found.rows[0];
  const ok = await bcrypt.compare(String(password), user.pass_hash);
  if (!ok) return res.status(401).json({ message: "Incorrect password." });
  res.json({ token: signToken(user), user: pubUser(user) });
});

app.get("/api/auth/me", auth, async (req, res) => {
  const { rows } = await pool.query("SELECT id, name, email FROM users WHERE id=$1", [req.user.id]);
  if (!rows.length) return res.status(404).json({ message: "Not found." });
  res.json({ user: pubUser(rows[0]) });
});

app.put("/api/auth/profile", auth, async (req, res) => {
  const { name, email } = req.body || {};
  if (name && String(name).trim().length < 2) return res.status(400).json({ message: "Name too short." });
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
});

/* ---------- IDEAS ---------- */
app.get("/api/ideas", async (req, res) => {
  const q = String(req.query.q || "").toLowerCase().trim();
  const category = req.query.category;
  const sort = req.query.sort || "title";
  const params = [];
  let where = "TRUE";
  if (q) { params.push(`%${q}%`); where += ` AND LOWER(title || ' ' || category || ' ' || description) LIKE $${params.length}`; }
  if (category && category !== "All") { params.push(category); where += ` AND category = $${params.length}`; }
  const order = sort === "likes" ? "likes DESC" : "title ASC";
  const { rows } = await pool.query(`SELECT * FROM ideas WHERE ${where} ORDER BY ${order}`, params);
  res.json({ ideas: rows.map(mapIdea) });
});

app.get("/api/ideas/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM ideas WHERE id=$1", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Idea not found." });
  res.json({ idea: mapIdea(rows[0]) });
});


app.post("/api/ideas", auth, async (req, res) => {
  const { title, category, icon, desc, problem, solution, features } = req.body || {};
  if (!title || String(title).trim().length < 3) return res.status(400).json({ message: "Title min 3 chars." });
  if (!desc || String(desc).trim().length < 10) return res.status(400).json({ message: "Desc min 10 chars." });
  if (!problem || !solution) return res.status(400).json({ message: "Problem and solution required." });
  const feats = Array.isArray(features) && features.length ? features.map(String).slice(0, 6) : ["MVP ready", "User focused", "Scalable"];
  const { rows } = await pool.query(
    `INSERT INTO ideas (title, category, icon, description, problem, solution, features, author, author_email, author_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [String(title).trim(), category || "Other", icon || "💡", String(desc).trim(),
     String(problem).trim(), String(solution).trim(), JSON.stringify(feats),
     req.user.name, req.user.email, req.user.id]
  );
  res.status(201).json({ idea: mapIdea(rows[0]) });
});

app.delete("/api/ideas/:id", auth, async (req, res) => {
  const found = await pool.query("SELECT * FROM ideas WHERE id=$1", [req.params.id]);
  if (!found.rows.length) return res.status(404).json({ message: "Idea not found." });
  const idea = found.rows[0];
  if (idea.author_id && idea.author_id !== req.user.id) return res.status(403).json({ message: "Only owner can delete." });
  await pool.query("DELETE FROM saved_ideas WHERE idea_id=$1", [idea.id]);
  await pool.query("DELETE FROM ideas WHERE id=$1", [idea.id]);
  res.json({ ok: true });
});

app.post("/api/ideas/:id/like", async (req, res) => {
  const { rows } = await pool.query("UPDATE ideas SET likes = likes + 1 WHERE id=$1 RETURNING *", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Not found." });
  res.json({ idea: mapIdea(rows[0]) });
});


/* ---------- SAVED ---------- */
app.get("/api/saved", auth, async (req, res) => {
  const ids = await pool.query("SELECT idea_id FROM saved_ideas WHERE user_id=$1 ORDER BY idea_id", [req.user.id]);
  const ideas = await pool.query(
    "SELECT i.* FROM saved_ideas s JOIN ideas i ON i.id = s.idea_id WHERE s.user_id=$1 ORDER BY s.idea_id",
    [req.user.id]
  );
  res.json({ saved: ids.rows.map((r) => r.idea_id), ids: ids.rows.map((r) => r.idea_id), ideas: ideas.rows.map(mapIdea) });
});

app.post("/api/saved/:id", auth, async (req, res) => {
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
});

app.use("/api", (req, res) => res.status(404).json({ message: "Endpoint not found." }));
app.use((err, req, res, next) => {
  console.error("API error:", err.message);
  res.status(500).json({ message: "Server error." });
});

initDb()
  .then(() => app.listen(PORT, () => console.log(`IDEALAUNCH API (Postgres) on http://localhost:${PORT}`)))
  .catch((err) => { console.error("DB init failed:", err.message); process.exit(1); });
