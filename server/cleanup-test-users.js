// One-off: inspect counts and remove smoke-test users from Supabase
const { pool } = require("./db");
(async () => {
  const q = async (sql, p = []) => (await pool.query(sql, p)).rows[0].n;
  console.log("users:", await q("SELECT COUNT(*)::int AS n FROM users"));
  console.log("ideas:", await q("SELECT COUNT(*)::int AS n FROM ideas"));
  console.log("saved:", await q("SELECT COUNT(*)::int AS n FROM saved_ideas"));
  const del = await pool.query(
    "DELETE FROM users WHERE email LIKE $1 OR email LIKE $2 OR email LIKE $3 OR email = $4 RETURNING email",
    ["smoke%", "auto%", "probe%", "testrunner@demo.io"]
  );
  console.log("cleaned test users:", del.rows.length);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });