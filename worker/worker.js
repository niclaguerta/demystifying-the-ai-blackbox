// Cloudflare Worker: stores workshop responses in a D1 database.
//
// Needs two settings in Cloudflare (Worker → Settings):
//   • D1 database binding named  DB
//   • Secret named               ADMIN_KEY   (the facilitator access key)
//
// Routes:
//   POST   /api/submissions   save one participant's answers (open to everyone)
//   GET    /api/results       list all responses (needs the facilitator key)
//   DELETE /api/results       delete one response (needs the facilitator key)

const ALLOWED_ORIGINS = [
  "https://niclaguerta.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
];
const QUESTION_COUNT = 5;
const MAX_ANSWER = 20000;
const MAX_NAME = 120;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COLUMNS = Array.from({ length: QUESTION_COUNT }, (_, i) => "q" + (i + 1));

const SCHEMA = `CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  ${COLUMNS.map(c => c + " TEXT NOT NULL").join(",\n  ")}
)`;

let schemaReady = false;
async function ensureSchema(env) {
  if (!schemaReady) { await env.DB.prepare(SCHEMA).run(); schemaReady = true; }
}

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "";
  const h = { "Cache-Control": "no-store", "Vary": "Origin" };
  if (ALLOWED_ORIGINS.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  }
  return h;
}

function json(req, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...corsHeaders(req) } });
}

async function isFacilitator(req, env) {
  const expected = env.ADMIN_KEY;
  const given = (req.headers.get("Authorization") || "").replace(/^Bearer /, "");
  if (!expected || !given) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([given, expected].map(s => crypto.subtle.digest("SHA-256", enc.encode(s))));
  return crypto.subtle.timingSafeEqual(a, b);
}

async function readJson(req, limit) {
  const raw = await req.text();
  if (raw.length > limit) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function submit(req, env) {
  const origin = req.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json(req, { error: "Invalid origin" }, 403);
  const b = await readJson(req, 150000);
  if (!b || typeof b.id !== "string" || !UUID.test(b.id)) return json(req, { error: "Invalid submission" }, 400);
  if (typeof b.name !== "string" || !b.name.trim() || b.name.length > MAX_NAME) return json(req, { error: "Please enter your name (up to 120 characters)" }, 400);
  if (!Array.isArray(b.answers) || b.answers.length !== QUESTION_COUNT || !b.answers.every(a => typeof a === "string" && a.trim() && a.length <= MAX_ANSWER))
    return json(req, { error: "Please answer all five questions" }, 400);

  await ensureSchema(env);
  // A retry with the same id is ignored, so double-clicks can't create duplicates.
  await env.DB.prepare(`INSERT OR IGNORE INTO submissions (id, created_at, name, ${COLUMNS.join(", ")}) VALUES (?, ?, ?, ${COLUMNS.map(() => "?").join(", ")})`)
    .bind(b.id, new Date().toISOString(), b.name.trim(), ...b.answers.map(a => a.trim()))
    .run();
  return json(req, { ok: true, id: b.id });
}

async function results(req, env) {
  if (!(await isFacilitator(req, env))) return json(req, { error: "Access denied" }, 401);
  await ensureSchema(env);
  const { results } = await env.DB.prepare("SELECT * FROM submissions ORDER BY created_at DESC").all();
  return json(req, results);
}

async function remove(req, env) {
  if (!(await isFacilitator(req, env))) return json(req, { error: "Access denied" }, 401);
  const b = await readJson(req, 1024);
  if (!b || typeof b.id !== "string" || !UUID.test(b.id)) return json(req, { error: "Invalid response ID" }, 400);
  await ensureSchema(env);
  const r = await env.DB.prepare("DELETE FROM submissions WHERE id = ?").bind(b.id).run();
  return r.meta.changes ? json(req, { ok: true }) : json(req, { error: "Response not found" }, 404);
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
    try {
      if (pathname === "/api/submissions" && req.method === "POST") return await submit(req, env);
      if (pathname === "/api/results" && req.method === "GET") return await results(req, env);
      if (pathname === "/api/results" && req.method === "DELETE") return await remove(req, env);
      if (pathname === "/") return new Response("Workshop responses backend is running.", { headers: { "Content-Type": "text/plain" } });
      return json(req, { error: "Not found" }, 404);
    } catch (e) {
      console.error("Request failed", e && e.message);
      return json(req, { error: "Server error" }, 500);
    }
  }
};
