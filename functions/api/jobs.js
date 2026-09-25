import { getCookie, sha256Hex, json } from "../../lib/auth.js";

function error(message, status) {
  return json({ ok: false, error: message }, status || 400);
}

async function ensureJobContactColumns(env) {
  const info = await env.DB.prepare("PRAGMA table_info(jobs)").all();
  const names = new Set((info.results || []).map(row => row.name));
  if (!names.has("thumbnail_url")) {
    await env.DB.prepare("ALTER TABLE jobs ADD COLUMN thumbnail_url TEXT").run();
  }
  if (!names.has("contact_phone")) {
    await env.DB.prepare("ALTER TABLE jobs ADD COLUMN contact_phone TEXT").run();
  }
  if (!names.has("contact_email")) {
    await env.DB.prepare("ALTER TABLE jobs ADD COLUMN contact_email TEXT").run();
  }
}

async function getSessionUser(env, request) {
  const rawSession = getCookie(request, "cinderburn_session");
  if (!rawSession) return null;
  const hash = await sha256Hex(rawSession);
  return env.DB.prepare(
    "SELECT u.id, u.email_verified FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.email_verified = 1"
  ).bind(hash, new Date().toISOString()).first();
}

export async function onRequestGet({ env, request }) {
  if (!env.DB) return error("DEWIFY database is not configured yet.", 503);
  try {
    await ensureJobContactColumns(env);
    const viewer = await getSessionUser(env, request);
    const mine = new URL(request.url).searchParams.get("mine") === "1";
    if (mine && !viewer) return error("Please sign in to view your jobs.", 401);
    const sql = mine
      ? "SELECT j.id, j.title, c.name AS company, c.owner_user_id, j.location, j.work_type, j.category, j.salary_min, j.salary_max, j.description, j.thumbnail_url, j.contact_phone, j.contact_email, u.name AS poster_name, u.display_name AS poster_display_name, u.city AS poster_city, u.country_code AS poster_country, u.skills_text AS poster_skills, u.bio AS poster_bio, u.avatar_url AS poster_avatar_url FROM jobs j JOIN companies c ON c.id = j.company_id JOIN users u ON u.id = c.owner_user_id WHERE j.status = 'open' AND c.owner_user_id = ? ORDER BY j.created_at DESC"
      : "SELECT j.id, j.title, c.name AS company, c.owner_user_id, j.location, j.work_type, j.category, j.salary_min, j.salary_max, j.description, j.thumbnail_url, j.contact_phone, j.contact_email, u.name AS poster_name, u.display_name AS poster_display_name, u.city AS poster_city, u.country_code AS poster_country, u.skills_text AS poster_skills, u.bio AS poster_bio, u.avatar_url AS poster_avatar_url FROM jobs j JOIN companies c ON c.id = j.company_id JOIN users u ON u.id = c.owner_user_id WHERE j.status = 'open' ORDER BY j.created_at DESC";
    const result = mine
      ? await env.DB.prepare(sql).bind(viewer.id).all()
      : await env.DB.prepare(sql).all();

    return json({
      ok: true,
      jobs: (result.results || []).map(row => ({
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        type: row.work_type,
        category: row.category,
        exp: "",
        pay: row.salary_min != null || row.salary_max != null ? formatSalary(row.salary_min, row.salary_max) : "Salary not listed",
        salary_min: row.salary_min ?? null,
        salary_max: row.salary_max ?? null,
        tags: [],
        description: row.description || "",
        thumbnail_url: row.thumbnail_url || null,
        contact_phone: row.contact_phone || null,
        contact_email: row.contact_email || null,
        poster_user_id: row.owner_user_id,
        poster_name: row.poster_name || null,
        poster_display_name: row.poster_display_name || null,
        poster_city: row.poster_city || null,
        poster_country: row.poster_country || "IN",
        poster_skills: row.poster_skills || "",
        poster_bio: row.poster_bio || "",
        poster_avatar_url: row.poster_avatar_url || null,
        can_delete: Boolean(viewer && viewer.id === row.owner_user_id),
        can_edit: Boolean(viewer && viewer.id === row.owner_user_id)
      }))
    });
  } catch (err) {
    return error(err && err.message ? err.message : "Unable to load jobs.", 500);
  }
}

function formatSalary(min, max) {
  if (min == null && max == null) return "Salary not listed";
  if (min != null && max != null) return "₹" + Number(min).toLocaleString("en-IN") + "–₹" + Number(max).toLocaleString("en-IN");
  if (min != null) return "From ₹" + Number(min).toLocaleString("en-IN");
  return "Up to ₹" + Number(max).toLocaleString("en-IN");
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return error("DEWIFY database is not configured yet.", 503);
  const user = await getSessionUser(env, request);
  if (!user) return error("Please sign in before posting a job.", 401);

  try {
    await ensureJobContactColumns(env);
    const body = await request.json();
    const title = String(body.title || "").trim();
    const company = String(body.company || "").trim();
    const location = String(body.location || "").trim();
    const workType = String(body.workType || "");
    const category = String(body.category || "");
    const description = String(body.description || "").trim();
    const thumbnailUrl = String(body.thumbnailUrl || "").trim();
    const contactPhone = String(body.contactPhone || "").trim();
    const contactEmail = String(body.contactEmail || "").trim();
    const salaryMin = body.salaryMin == null || body.salaryMin === "" ? null : Number(body.salaryMin);
    const salaryMax = body.salaryMax == null || body.salaryMax === "" ? null : Number(body.salaryMax);

    if (title.length < 2 || title.length > 120) return error("Enter a valid job title.");
    if (company.length < 2 || company.length > 100) return error("Enter a valid company name.");
    if (location.length > 100) return error("Location is too long.");
    if (thumbnailUrl.length > 300000) return error("Thumbnail image is too large. Please choose a smaller image.");
    if (thumbnailUrl && !/^data:image\/(webp|jpeg|png);base64,/i.test(thumbnailUrl)) return error("Thumbnail must be a processed image.");
    if (contactPhone.length < 5 || contactPhone.length > 40) return error("Enter a valid contact phone number.");
    if (!/^\+?[0-9().\-\s]{5,40}$/.test(contactPhone)) return error("Enter a valid contact phone number.");
    if (contactEmail.length < 5 || contactEmail.length > 160 || !/^\S+@\S+\.\S+$/.test(contactEmail)) return error("Enter a valid contact email address.");
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
      "INSERT INTO jobs (id, company_id, title, description, country_code, location, work_type, category, salary_min, salary_max, thumbnail_url, contact_phone, contact_email, status) VALUES (?, ?, ?, ?, 'IN', ?, ?, ?, ?, ?, ?, ?, ?, 'open')"
    ).bind(jobId, companyRow.id, title, description, location || null, workType, category, salaryMin, salaryMax, thumbnailUrl || null, contactPhone, contactEmail).run();

    return json({ ok: true, message: "Your job has been published." }, 201);
  } catch (err) {
    return error(err && err.message ? err.message : "Unable to publish the job.", 500);
  }
}



export async function onRequestPut({ request, env }) {
  if (!env.DB) return error("DEWIFY database is not configured yet.", 503);
  const user = await getSessionUser(env, request);
  if (!user) return error("Please sign in before editing a job.", 401);

  try {
    await ensureJobContactColumns(env);
    const url = new URL(request.url);
    const jobId = String(url.searchParams.get("id") || "").trim();
    if (!jobId) return error("Job id is required.");

    const ownership = await env.DB.prepare(
      "SELECT j.id, j.company_id, c.name AS company FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.id = ? AND c.owner_user_id = ? LIMIT 1"
    ).bind(jobId, user.id).first();
    if (!ownership) return error("You can only edit jobs that you posted.", 403);

    const body = await request.json();
    const title = String(body.title || "").trim();
    const company = String(body.company || "").trim();
    const location = String(body.location || "").trim();
    const workType = String(body.workType || "");
    const category = String(body.category || "");
    const description = String(body.description || "").trim();
    const thumbnailUrl = String(body.thumbnailUrl || "").trim();
    const contactPhone = String(body.contactPhone || "").trim();
    const contactEmail = String(body.contactEmail || "").trim();
    const salaryMin = body.salaryMin == null || body.salaryMin === "" ? null : Number(body.salaryMin);
    const salaryMax = body.salaryMax == null || body.salaryMax === "" ? null : Number(body.salaryMax);

    if (title.length < 2 || title.length > 120) return error("Enter a valid job title.");
    if (company.length < 2 || company.length > 100) return error("Enter a valid company name.");
    if (location.length > 100) return error("Location is too long.");
    if (thumbnailUrl.length > 300000) return error("Thumbnail image is too large. Please choose a smaller image.");
    if (thumbnailUrl && !/^data:image\/(webp|jpeg|png);base64,/i.test(thumbnailUrl)) return error("Thumbnail must be a processed image.");
    if (contactPhone.length < 5 || contactPhone.length > 40 || !/^\+?[0-9().\-\s]{5,40}$/.test(contactPhone)) return error("Enter a valid contact phone number.");
    if (contactEmail.length < 5 || contactEmail.length > 160 || !/^\S+@\S+\.\S+$/.test(contactEmail)) return error("Enter a valid contact email address.");
    if (!["Remote", "Hybrid", "On-site"].includes(workType)) return error("Choose a valid work type.");
    if (!["Technology", "Design", "Marketing", "Sales", "Content"].includes(category)) return error("Choose a valid category.");
    if (description.length < 20 || description.length > 4000) return error("Add a more detailed job description.");
    if (salaryMin != null && (!Number.isFinite(salaryMin) || salaryMin < 0)) return error("Enter a valid minimum salary.");
    if (salaryMax != null && (!Number.isFinite(salaryMax) || salaryMax < 0)) return error("Enter a valid maximum salary.");
    if (salaryMin != null && salaryMax != null && salaryMax < salaryMin) return error("Maximum salary cannot be lower than minimum salary.");

    const slugBase = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "company";
    const slug = slugBase + "-" + ownership.company_id.slice(0, 8);
    await env.DB.prepare(
      "UPDATE companies SET name = ?, slug = ?, city = ?, industry = ? WHERE id = ? AND owner_user_id = ?"
    ).bind(company, slug, location || null, category, ownership.company_id, user.id).run();

    await env.DB.prepare(
      "UPDATE jobs SET title = ?, location = ?, work_type = ?, category = ?, salary_min = ?, salary_max = ?, description = ?, thumbnail_url = ?, contact_phone = ?, contact_email = ? WHERE id = ?"
    ).bind(title, location || null, workType, category, salaryMin, salaryMax, description, thumbnailUrl || null, contactPhone, contactEmail, jobId).run();

    return json({ ok: true, message: "Job updated." });
  } catch (err) {
    return error(err && err.message ? err.message : "Unable to edit the job.", 500);
  }
}

export async function onRequestDelete({ request, env }) {
  if (!env.DB) return error("DEWIFY database is not configured yet.", 503);
  const user = await getSessionUser(env, request);
  if (!user) return error("Please sign in before deleting a job.", 401);

  try {
    const url = new URL(request.url);
    const jobId = String(url.searchParams.get("id") || "").trim();
    if (!jobId) return error("Job id is required.");

    const row = await env.DB.prepare(
      "SELECT j.id FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.id = ? AND c.owner_user_id = ? LIMIT 1"
    ).bind(jobId, user.id).first();

    if (!row) return error("You can only delete jobs that you posted.", 403);

    await env.DB.prepare("DELETE FROM applications WHERE job_id = ?").bind(jobId).run();
    await env.DB.prepare("DELETE FROM jobs WHERE id = ?").bind(jobId).run();

    return json({ ok: true, message: "Job deleted." });
  } catch (err) {
    return error(err && err.message ? err.message : "Unable to delete the job.", 500);
  }
}
