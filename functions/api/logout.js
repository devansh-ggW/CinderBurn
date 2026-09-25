import { cookie, getCookie, sha256Hex, json } from "../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "Database is not configured." }, 503);
  const rawSession = getCookie(request, "cinderburn_session");
  if (rawSession) {
    const hash = await sha256Hex(rawSession);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
  }
  return json({ ok: true }, 200, {
    "Set-Cookie": cookie("cinderburn_session", "", { maxAge: 0 }),
    "Cache-Control": "no-store"
  });
}
