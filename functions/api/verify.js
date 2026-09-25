import { sha256Hex } from "../../lib/auth.js";

function page(title, message, action) {
  const button = action || "Go to CinderBurn";
  return new Response(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><title>' + title + ' — CinderBurn</title><style>' +
    '*{box-sizing:border-box}body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7f9;color:#15171a;display:grid;place-items:center;min-height:100vh;margin:0;padding:20px}.card{max-width:560px;width:100%;background:#fff;border:1px solid #e3e6ea;border-radius:22px;padding:38px;box-shadow:0 20px 60px rgba(20,30,40,.10)}.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;margin-bottom:34px}.mark{width:36px;height:36px;border-radius:10px;background:#111318;display:grid;place-items:center;overflow:hidden}.mark img{width:75%;height:75%;object-fit:contain}.eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a9098;font-weight:800;margin-bottom:10px}.card h1{font-size:36px;line-height:1.05;letter-spacing:-.04em;margin:0 0 14px}.card p{font-size:15px;line-height:1.65;color:#626a74;margin:0}.btn{display:inline-block;background:#ef4e24;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:750;margin-top:26px}.foot{margin-top:28px;padding-top:18px;border-top:1px solid #eceef1;color:#9aa0a8;font-size:11px;line-height:1.5}@media(max-width:600px){body{padding:12px}.card{padding:26px 20px;border-radius:18px}.card h1{font-size:30px}.brand{margin-bottom:26px}}' +
    '</style></head><body><main class="card"><div class="brand"><span class="mark"><img src="https://cinderburn.dewify.shop/icon.ico" alt=""></span><span>CinderBurn</span></div><div class="eyebrow">Account verification</div><h1>' + title + '</h1><p>' + message + '</p><a class="btn" href="https://cinderburn.dewify.shop">' + button + '</a><div class="foot">CinderBurn connects users in a marketplace. Verify identities, offers and arrangements independently.</div></main></body></html>',
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
