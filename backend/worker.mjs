import { maxAnswerLength, questions } from "../docs/content.js";

const maxBodyBytes = questions.length * maxAnswerLength * 6 + 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();

async function authorized(request, secret) {
  if (!secret || secret.length < 32) return false;
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ") || header.length > 512) return false;
  const hashes = await Promise.all([header.slice(7), secret].map((value) =>
    crypto.subtle.digest("SHA-256", encoder.encode(value))
  ));
  return crypto.subtle.timingSafeEqual(hashes[0], hashes[1]);
}

async function boundedJson(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBodyBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}

function validate(data) {
  if (typeof data?.id !== "string" || !uuid.test(data.id)) return null;
  const answers = questions.map(({ key }) => data.answers?.[key]);
  if (answers.some((answer) => typeof answer !== "string" || !answer.trim() || answer.length > maxAnswerLength)) return null;
  return [data.id, new Date().toISOString(), ...answers.map((answer) => answer.trim())];
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const route = new URL(request.url).pathname;
    const submit = route === "/api/responses";
    const results = route === "/api/results";
    const headers = new Headers({ "Cache-Control": "private, no-store", Vary: "Origin" });
    if (origin === env.WORKSHOP_ORIGIN) headers.set("Access-Control-Allow-Origin", origin);
    const reply = (status, body = null) => new Response(body, { status, headers });

    if (!submit && !results) return reply(404);
    if (origin && origin !== env.WORKSHOP_ORIGIN) return reply(403);

    if (request.method === "OPTIONS") {
      if (!origin) return reply(403);
      headers.set("Access-Control-Allow-Methods", submit ? "POST" : "GET");
      headers.set("Access-Control-Allow-Headers", submit ? "Content-Type" : "Authorization");
      return reply(204);
    }

    if (submit && request.method === "POST") {
      if (!origin) return reply(403);
      if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") return reply(415);
      let values;
      try {
        values = validate(await boundedJson(request));
      } catch {
        return reply(400);
      }
      if (!values) return reply(400);

      await env.DB.prepare(`
        INSERT INTO responses (id, submitted_at, corpus, tokenization, embeddings, loss_function, trained_model)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING
      `).bind(...values).run();
      return reply(204);
    }

    if (results && request.method === "GET") {
      if (!await authorized(request, env.FACILITATOR_KEY)) return reply(401);
      const { results: rows } = await env.DB.prepare(`
        SELECT id, submitted_at AS submittedAt, corpus, tokenization, embeddings,
               loss_function AS lossFunction, trained_model AS trainedModel
        FROM responses
        ORDER BY submitted_at DESC, id DESC
      `).all();
      headers.set("Content-Type", "application/json; charset=utf-8");
      return reply(200, JSON.stringify(rows));
    }

    headers.set("Allow", submit ? "POST, OPTIONS" : "GET, OPTIONS");
    return reply(405);
  },
};
