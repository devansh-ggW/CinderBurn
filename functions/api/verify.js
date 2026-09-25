
import { sha256Hex } from "../../lib/auth.js";

function page(title, message, action) {
  const button = action || "Go to CinderBurn";
  return new Response(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' — CinderBurn</title><style>body{font-family:system-ui;background:#080808;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;padding:20px}.card{max-width:520px;width:100%;background:#121214;border:1px solid #2b2b2f;border-radius:20px;padding:34px;text-align:center}.icon{font-size:46px}.btn{display:inline-block;background:#ef4e24;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;margin-top:16px}</style></head><body><main class="card"><h1>' + title + '</h1><p>' + message + '</p><a class="btn" href="https://cinderburn.dewify.shop">' + button + '</a></main></body></html>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return page("Database not configured", "CinderBurn's account database has not been connected yet.");

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return page("Invalid verification link", "This verification link is missing its token.", "Return home");

  const tokenHash = await sha256Hex(token);
  const record = await env.DB.prepare("SELECT user_id, expires_at FROM email_verification_tokens WHERE token_hash = ?").bind(tokenHash).first();

  if (!record) return page("Link not found", "This verification link has already been used or is not valid.", "Return home");

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM email_verification_tokens WHERE token_hash = ?").bind(tokenHash).run();
    return page("Link expired", "Your verification link has expired. Request a new one from CinderBurn.", "Return home");
  }

  await env.DB.batch([
    env.DB.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").bind(record.user_id),
    env.DB.prepare("DELETE FROM email_verification_tokens WHERE token_hash = ?").bind(tokenHash)
  ]);

  return page("Email verified", "Your CinderBurn email is verified. You can now sign in.", "Sign in");
}
