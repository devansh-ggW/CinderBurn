import { cookie, getCookie, json, sha256Hex } from "../../lib/auth.js";

function error(message, status) {
  return json({ ok: false, error: message }, status || 400);
}

async function getUser(env, request) {
  const rawSession = getCookie(request, "cinderburn_session");
  if (!rawSession) return null;
  const hash = await sha256Hex(rawSession);
  return env.DB.prepare(
    "SELECT u.id, u.name, u.display_name, u.email, u.city, u.country_code, u.avatar_url, u.skills_text, u.bio FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.email_verified = 1"
  ).bind(hash, new Date().toISOString()).first();
}

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    email: row.email,
    city: row.city,
    country: row.country_code,
    avatarUrl: row.avatar_url,
    skills: row.skills_text || "",
    bio: row.bio || ""
  };
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return error("DEWIFY database is not configured yet.", 503);
  const row = await getUser(env, request);
  if (!row) return error("Please sign in first.", 401);

  try {
    const body = await request.json();
    const displayName = String(body.displayName || "").trim();
    const city = String(body.city || "").trim();
    const skills = String(body.skills || "").trim();
    const bio = String(body.bio || "").trim();
    const avatarDataUrl = String(body.avatarDataUrl || "").trim();

    if (displayName.length < 2 || displayName.length > 40) return error("Display name must be 2 to 40 characters.");
    if (city.length > 80 || skills.length > 500 || bio.length > 1200) return error("One of your fields is too long.");
    if (avatarDataUrl.length > 120000) return error("Profile image is too large. Please use a smaller crop.");
    if (avatarDataUrl && !/^data:image\/(webp|jpeg|png);base64,/i.test(avatarDataUrl)) return error("Profile image must be a processed image.");

    await env.DB.prepare(
      "UPDATE users SET display_name = ?, city = ?, skills_text = ?, bio = ?, avatar_url = CASE WHEN ? <> '' THEN ? ELSE avatar_url END WHERE id = ?"
    ).bind(displayName, city || null, skills || null, bio || null, avatarDataUrl, avatarDataUrl, row.id).run();

    const updated = await env.DB.prepare(
      "SELECT id, name, display_name, email, city, country_code, avatar_url, skills_text, bio FROM users WHERE id = ?"
    ).bind(row.id).first();

    return json({ ok: true, user: toUser(updated) });
  } catch (err) {
    return error(err && err.message ? err.message : "Unable to update your profile.", 500);
  }
}


export async function onRequestDelete({ request, env }) {
  if (!env.DB) return error("DEWIFY database is not configured yet.", 503);
  const row = await getUser(env, request);
  if (!row) return error("Please sign in first.", 401);

  try {
    await env.DB.prepare("DELETE FROM applications WHERE user_id = ?").bind(row.id).run();
    await env.DB.prepare("DELETE FROM user_skills WHERE user_id = ?").bind(row.id).run();
    await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").bind(row.id).run();
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.id).run();
    await env.DB.prepare("DELETE FROM companies WHERE owner_user_id = ?").bind(row.id).run();
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(row.id).run();

    return json({ ok: true, message: "Profile deleted." }, 200, {
      "Set-Cookie": "cinderburn_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax",
      "Cache-Control": "no-store"
    });
  } catch (err) {
    return error(err && err.message ? err.message : "Unable to delete the profile.", 500);
  }
}
