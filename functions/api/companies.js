import { json } from "../../lib/auth.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok: false, error: "Database is not configured." }, 503);
  try {
    const result = await env.DB.prepare(
      "SELECT c.id, c.name, c.city, c.country_code, c.industry, c.description, c.logo_url, COUNT(j.id) AS open_roles FROM companies c LEFT JOIN jobs j ON j.company_id = c.id AND j.status = 'open' GROUP BY c.id ORDER BY c.created_at DESC"
    ).all();

    return json({
      ok: true,
      companies: (result.results || []).map(row => ({
        id: row.id,
        title: row.name,
        company: row.industry || "Company",
        location: row.city || "Location not listed",
        type: "Company",
        category: row.industry || "Company",
        exp: "",
        pay: String(row.open_roles) + " open roles",
        tags: [row.industry || "Company", "CinderBurn"],
        description: row.description || "CinderBurn company profile."
      }))
    });
  } catch (err) {
    return json({ ok: false, error: err && err.message ? err.message : "Unable to load companies." }, 500);
  }
}
