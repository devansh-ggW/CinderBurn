import { getCookie, sha256Hex, json } from "../../lib/auth.js";

function error(message, status) {
  return json({ ok: false, error: message }, status || 400);
}

async function getSessionUser(env, request) {
  const rawSession = getCookie(request, "cinderburn_session");
  if (!rawSession) return null;
  const hash = await sha256Hex(rawSession);
  return env.DB.prepare(
    "SELECT u.id, u.email_verified FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.email_verified = 1"
  ).bind(hash, new Date().toISOString()).first();
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return error("CinderBurn database is not configured yet.", 503);
  const user = await getSessionUser(env, request);
  if (!user) return error("Please sign in before posting a job.", 401);

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const company = String(body.company || "").trim();
    const location = String(body.location || "").trim();
    const workType = String(body.workType || "");
    const category = String(body.category || "");
    const description = String(body.description || "").trim();
    const salaryMin = body.salaryMin == null || body.salaryMin === "" ? null : Number(body.salaryMin);
    const salaryMax = body.salaryMax == null || body.salaryMax === "" ? null : Number(body.salaryMax);

    if (title.length < 2 || title.length > 120) return error("Enter a valid job title.");
    if (company.length < 2 || company.length > 100) return error("Enter a valid company name.");
    if (location.length > 100) return error("Location is too long.");
    if (!["Remote", "Hybrid", "On-site"].includes(workType)) return error("Choose a valid work type.");
    if (!["Technology", "Design", "Marketing", "Sales", "Content"].includes(category)) return error("Choose a valid category.");
    if (description.length < 20 || description.length > 4000) return error("Add a more detailed job description.");
    if (salaryMin != null && (!Number.isFinite(salaryMin) || salaryMin < 0)) return error("Enter a valid minimum salary.");
    if (salaryMax != null && (!Number.isFinite(salaryMax) || salaryMax < 0)) return error("Enter a valid maximum salary.");
    if (salaryMin != null && salaryMax != null && salaryMax < salaryMin) return error("Maximum salary cannot be lower than minimum salary.");

    let companyRow = await env.DB.prepare(
      "SELECT id FROM companies WHERE owner_user_id = ? AND name = ? LIMIT 1"
    ).bind(user.id, company).first();

    if (!companyRow) {
      const companyId = crypto.randomUUID();
      const slugBase = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "company";
      const slug = slugBase + "-" + companyId.slice(0, 8);
      await env.DB.prepare(
        "INSERT INTO companies (id, owner_user_id, name, slug, country_code, city, industry, description) VALUES (?, ?, ?, ?, 'IN', ?, ?, ?)"
      ).bind(companyId, user.id, company, slug, location || null, category, "").run();
      companyRow = { id: companyId };
    }

    const jobId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO jobs (id, company_id, title, description, country_code, location, work_type, category, salary_min, salary_max, status) VALUES (?, ?, ?, ?, 'IN', ?, ?, ?, ?, ?, 'open')"
    ).bind(jobId, companyRow.id, title, description, location || null, workType, category, salaryMin, salaryMax).run();

    return json({ ok: true, message: "Your job has been published." }, 201);
  } catch (err) {
    return error(err && err.message ? err.message : "Unable to publish the job.", 500);
  }
}
