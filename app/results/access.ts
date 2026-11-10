import { env } from "cloudflare:workers";

export function isFacilitator(headers: Headers) {
  const allowed = env.FACILITATOR_EMAIL?.trim().toLowerCase();
  const email = headers.get("oai-authenticated-user-email")?.toLowerCase();
  return Boolean(allowed && email === allowed && headers.get("oai-authenticated-user-id"));
}
