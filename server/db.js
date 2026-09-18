// IDEALAUNCH — PostgreSQL data layer (Supabase)
// Auto-creates schema and seeds starter ideas on first run.
require("dotenv").config({ path: require("path").join(__dirname, ".env" ) });
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL missing. Set it in server/.env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const SEED_IDEAS = [
  ["AI Study Buddy", "EdTech", "🤖", 124, "An AI-powered personal study assistant that helps students learn faster with custom notes, quizzes and doubt solving.", "Students struggle with managing study materials and getting instant help.", "A personalized AI assistant for notes, quizzes and 24/7 doubt solving.", ["AI based Q&A", "Personalized study plans", "Progress tracking", "Multi-subject support"]],
  ["EcoSwap", "Green Tech", "🌱", 98, "A platform to buy, sell and swap used items locally.", "Useful products are often discarded while others search for affordable alternatives.", "A trusted local marketplace for exchanging reusable products.", ["Local discovery", "Simple listings", "Eco impact tracking", "Secure profiles"]],
  ["MediTrack", "HealthTech", "❤️", 76, "Track health data and get personalized insights.", "People have health information spread across multiple apps and devices.", "One simple dashboard for tracking habits and personal health metrics.", ["Health dashboard", "Reminders", "Trend insights", "Data export"]],
  ["SkillShare", "EdTech", "⭐", 64, "Learn and teach skills with a global community.", "Learners struggle to find practical peer-to-peer learning.", "A community marketplace connecting people who want to learn and teach.", ["Skill profiles", "Peer sessions", "Ratings", "Learning paths"]],
  ["FarmConnect", "AgriTech", "🌾", 59, "Connect farmers directly with buyers.", "Farmers may lose margin through long distribution chains.", "A direct discovery and communication platform for producers and buyers.", ["Direct discovery", "Price visibility", "Buyer profiles", "Order requests"]],
  ["QuickCart", "E-commerce", "🛒", 51, "A hyperlocal delivery platform for daily needs.", "Customers want convenient access to nearby essentials.", "Fast local shopping with neighborhood stores and delivery partners.", ["Nearby stores", "Quick ordering", "Order tracking", "Digital receipts"]],
  ["FinPilot", "FinTech", "💳", 88, "A personal finance planning companion for young professionals.", "Budgeting can feel complex and inconsistent.", "A simple planning workspace for goals, budgets and spending insights.", ["Goal planning", "Budget tools", "Spending insights", "Reminders"]],
  ["CodeGuard", "AI & ML", "🛡️", 91, "An educational code quality assistant for developers.", "Beginners need understandable feedback when learning to code.", "Clear explanations of common code-quality issues and improvements.", ["Code hints", "Readable feedback", "Learning tips", "Project checks"]],
];

const SYSTEM_EMAIL = "system@idealaunch.io";

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         BIGSERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      pass_hash  TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS ideas (
      id           BIGSERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      category     TEXT NOT NULL DEFAULT 'Other',
      icon         TEXT NOT NULL DEFAULT '💡',
      likes        INTEGER NOT NULL DEFAULT 0,
      description  TEXT NOT NULL,
      problem      TEXT NOT NULL,
      solution     TEXT NOT NULL,
      features     JSONB NOT NULL DEFAULT '[]',
      author       TEXT NOT NULL,
      author_email TEXT NOT NULL,
      author_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS saved_ideas (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      idea_id BIGINT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, idea_id)
    );
  `);

  // Seed system user + starter ideas once
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM ideas");
  if (rows[0].n === 0) {
    const u = await pool.query(
      `INSERT INTO users (name, email, pass_hash) VALUES ($1,$2,$3)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      ["IDEALAUNCH", SYSTEM_EMAIL, "seed-no-login"]
    );
    let sysId = u.rows[0]?.id;
    if (!sysId) {
      const ex = await pool.query("SELECT id FROM users WHERE email=$1", [SYSTEM_EMAIL]);
      sysId = ex.rows[0].id;
    }
    for (const [title, category, icon, likes, description, problem, solution, features] of SEED_IDEAS) {
      await pool.query(
        `INSERT INTO ideas (title, category, icon, likes, description, problem, solution, features, author, author_email, author_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [title, category, icon, likes, description, problem, solution, JSON.stringify(features), "IDEALAUNCH", SYSTEM_EMAIL, sysId]
      );
    }
    console.log(`Seeded ${SEED_IDEAS.length} starter ideas.`);
  }
}

// Row -> API shape (camelCase like the frontend expects)
function mapIdea(r) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    icon: r.icon,
    likes: r.likes,
    desc: r.description,
    problem: r.problem,
    solution: r.solution,
    features: r.features || [],
    author: r.author,
    authorEmail: r.author_email,
    authorId: r.author_id,
    createdAt: r.created_at,
  };
}

module.exports = { pool, initDb, mapIdea, SYSTEM_EMAIL };
