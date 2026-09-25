import { json } from "../../lib/auth.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok: false, error: "Database is not configured." }, 503);
  try {
    const result = await env.DB.prepare(
      "SELECT id, display_name, city, country_code, skills_text, bio, avatar_url FROM users WHERE email_verified = 1 ORDER BY created_at DESC"
    ).all();

    return json({
      ok: true,
      people: (result.results || []).map(row => ({
        id: row.id,
        title: row.display_name,
        full_name: row.name,
        company: "DEWIFY member",
        location: row.city || "Location not listed",
        country: row.country_code || "IN",
        type: "Member",
        category: "People",
        exp: "",
        pay: "Profile",
        tags: String(row.skills_text || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 6),
        description: row.bio || "DEWIFY member.",
        avatar_url: row.avatar_url || null
      }))
    });
  } catch (err) {
    return json({ ok: false, error: err && err.message ? err.message : "Unable to load people." }, 500);
  }
}
