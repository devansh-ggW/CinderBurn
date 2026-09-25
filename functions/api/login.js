
import { cookie, getCookie, json, normalizeEmail, randomToken, sha256Hex, verifyPassword } from "../../lib/auth.js";

function error(message, status) {
  return json({ ok: false, error: message }, status || 400);
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return error("CinderBurn database is not configured yet.", 503);

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    const user = await env.DB.prepare(
      "SELECT id, name, display_name, email, password_salt, password_hash, email_verified, country_code, city, bio, skills_text, avatar_url FROM users WHERE email = ?"
    ).bind(email).first();

    if (!user || !user.password_hash || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
      return error("Email or password is incorrect.", 401);
    }

    if (!user.email_verified) return error("Verify your email before signing in.", 403);

    const rawSession = randomToken(32);
    const sessionHash = await sha256Hex(rawSession);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).bind(sessionHash, user.id, expiresAt).run();

    return json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        displayName: user.display_name,
        email: user.email,
        city: user.city,
        country: user.country_code,
        avatarUrl: user.avatar_url,
        skills: user.skills_text || "",
        bio: user.bio || ""
      }
    }, 200, {
      "Set-Cookie": cookie("cinderburn_session", rawSession, { maxAge: 30 * 24 * 60 * 60 }),
      "Cache-Control": "no-store"
    });
  } catch {
    return error("Unable to sign in right now.", 500);
  }
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return error("CinderBurn database is not configured yet.", 503);

  const rawSession = getCookie(request, "cinderburn_session");
  if (!rawSession) return json({ ok: false, user: null });

  const hash = await sha256Hex(rawSession);
  const row = await env.DB.prepare(
    "SELECT u.id, u.name, u.display_name, u.email, u.city, u.country_code, u.avatar_url, u.bio, u.skills_text FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.email_verified = 1"
  ).bind(hash, new Date().toISOString()).first();

  return row ? json({ ok: true, user: {
    id: row.id, name: row.name, displayName: row.display_name, email: row.email, city: row.city, country: row.country_code, avatarUrl: row.avatar_url, skills: row.skills_text || "", bio: row.bio || ""
  }}) : json({ ok: false, user: null });
}
