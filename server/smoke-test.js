// IDEALAUNCH API smoke test — run: node server/smoke-test.js (server must be running on :5000)
const BASE = "http://localhost:5000/api";
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

async function main() {
  const email = `smoke${Date.now()}@demo.io`;
  // 1. health
  let r = await fetch(`${BASE}/health`);
  ok("GET /health", r.status === 200 && (await r.json()).ok === true);

  // 2. signup
  r = await fetch(`${BASE}/auth/signup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Smoke Tester", email, password: "secret123" }),
  });
  let d = await r.json();
  ok("POST /auth/signup", r.status === 201 && d.token && d.user.email === email);
  const token = d.token;
  const auth = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // 3. duplicate signup
  r = await fetch(`${BASE}/auth/signup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Smoke Tester", email, password: "secret123" }),
  });
  ok("duplicate signup -> 409", r.status === 409);

  // 4. signin wrong password
  r = await fetch(`${BASE}/auth/signin`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "wrongpass" }),
  });
  ok("signin wrong pass -> 401", r.status === 401);

  // 5. signin correct (existing account)
  r = await fetch(`${BASE}/auth/signin`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "secret123" }),
  });
  d = await r.json();
  ok("signin correct", r.status === 200 && !!d.token);

  // 6. signin unknown email -> rejected (must sign up first)
  r = await fetch(`${BASE}/auth/signin`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `auto${Date.now()}@demo.io`, password: "secret123" }),
  });
  d = await r.json();
  ok("signin unknown -> 401 (sign up first)", r.status === 401 && !d.token);

  // 7. list ideas (seeded)
  r = await fetch(`${BASE}/ideas`);
  d = await r.json();
  ok("GET /ideas (8 seeded)", r.status === 200 && d.ideas.length >= 8);
  const seededCount = d.ideas.length;

  // 8. search + filter + sort
  r = await fetch(`${BASE}/ideas?q=ai&sort=likes`);
  d = await r.json();
  ok("GET /ideas?q=ai&sort=likes", r.status === 200 && d.ideas.every((i) => `${i.title} ${i.category} ${i.desc}`.toLowerCase().includes("ai")));

  // 9. create idea (auth)
  r = await fetch(`${BASE}/ideas`, {
    method: "POST", headers: auth,
    body: JSON.stringify({ title: "Smoke Test Idea", category: "Other", icon: "🧪", desc: "Created by the automated smoke test.", problem: "Testing.", solution: "Passing.", features: ["one", "two"] }),
  });
  d = await r.json();
  ok("POST /ideas", r.status === 201 && d.idea.author === "Smoke Tester");
  const ideaId = d.idea.id;

  // 10. create without auth -> 401
  r = await fetch(`${BASE}/ideas`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "No Auth Idea", desc: "should fail 401", problem: "p", solution: "s" }),
  });
  ok("POST /ideas no token -> 401", r.status === 401);

  // 11. validation error
  r = await fetch(`${BASE}/ideas`, {
    method: "POST", headers: auth,
    body: JSON.stringify({ title: "ab", desc: "too short", problem: "p", solution: "s" }),
  });
  ok("POST /ideas invalid -> 400", r.status === 400);

  // 12. toggle save
  r = await fetch(`${BASE}/saved/${ideaId}`, { method: "POST", headers: auth });
  d = await r.json();
  ok("POST /saved/:id (save)", d.saved === true);

  // 13. saved list contains it
  r = await fetch(`${BASE}/saved`, { headers: auth });
  d = await r.json();
  ok("GET /saved contains idea", d.ids.map(String).includes(String(ideaId)));

  // 14. unsave
  r = await fetch(`${BASE}/saved/${ideaId}`, { method: "POST", headers: auth });
  d = await r.json();
  ok("POST /saved/:id (unsave)", d.saved === false);

  // 15. like
  r = await fetch(`${BASE}/ideas/${ideaId}/like`, { method: "POST" });
  d = await r.json();
  ok("POST /ideas/:id/like", d.idea.likes === 1);

  // 16. profile update
  r = await fetch(`${BASE}/auth/profile`, {
    method: "PUT", headers: auth,
    body: JSON.stringify({ name: "Renamed Tester" }),
  });
  d = await r.json();
  ok("PUT /auth/profile", r.status === 200 && d.user.name === "Renamed Tester");

  // 17. delete idea
  r = await fetch(`${BASE}/ideas/${ideaId}`, { method: "DELETE", headers: auth });
  ok("DELETE /ideas/:id", r.status === 200);

  // 18. count back to seeded
  r = await fetch(`${BASE}/ideas`);
  d = await r.json();
  ok("ideas count restored", d.ideas.length === seededCount);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error("SMOKE CRASH:", e.message); process.exit(1); });