
import { calculateAge, hashPassword, json, normalizeEmail, randomToken, sha256Hex, validPassword } from "../../lib/auth.js";

const ALLOWED_ROLES = new Set(["Find work", "Hire people", "Both"]);

function error(message, status) {
  return json({ ok: false, error: message }, status || 400);
}

async function sendVerificationEmail(env, to, name, token) {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
  const verifyUrl = "https://cinderburn.dewify.shop/api/verify?token=" + encodeURIComponent(token);
  const emailHtml =
    '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#080808;color:#111;margin:0;padding:32px">' +
    '<div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:32px">' +
    "<h1 style=\"margin-top:0\">Welcome to CinderBurn, " + name + ".</h1>" +
    "<p>Confirm your email address to activate your account.</p>" +
    '<p><a href="' + verifyUrl + '" style="display:inline-block;background:#ef4e24;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Verify email</a></p>' +
    '<p style="color:#666;font-size:13px">This verification link expires in 24 hours.</p>' +
    '<p style="color:#777;font-size:12px">If you did not create this account, you can ignore this email.</p>' +
    "</div></body></html>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "CinderBurn <cinderburn@cinderburn.dewify.shop>",
      to: [to],
      subject: "Verify your CinderBurn email",
      html: emailHtml,
      text: "Welcome to CinderBurn, " + name + ". Verify your email: " + verifyUrl
    })
  });
  if (!response.ok) throw new Error("Resend rejected the email.");
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return error("CinderBurn database is not configured yet.", 503);

  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const displayName = String(form.get("display_name") || "").trim();
    const dob = String(form.get("dob") || "");
    const email = normalizeEmail(form.get("email"));
    const password = String(form.get("password") || "");
    const role = String(form.get("role") || "");
    const city = String(form.get("city") || "").trim();
    const skills = String(form.get("skills") || "").trim();
    const bio = String(form.get("bio") || "").trim();
    const termsAccepted = form.get("terms") === "on";
    const privacyAccepted = form.get("privacy") === "on";
    const safetyAccepted = form.get("safety") === "on";
    const truthAccepted = form.get("truth") === "on";
    const picture = form.get("profile_picture");

    if (name.length < 2 || name.length > 80) return error("Enter a valid full name.");
    if (displayName.length < 2 || displayName.length > 40) return error("Enter a valid display name.");
    if (calculateAge(dob) < 18) return error("CinderBurn accounts are currently limited to adults 18 and over.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return error("Enter a valid email address.");
    if (!validPassword(password)) return error("Password must be at least 10 characters and include letters and numbers.");
    if (!ALLOWED_ROLES.has(role)) return error("Choose how you will use CinderBurn.");
    if (city.length > 80 || skills.length > 500 || bio.length > 1200) return error("One of your fields is too long.");
    if (!termsAccepted || !privacyAccepted || !safetyAccepted || !truthAccepted) {
      return error("You must accept the Terms, Privacy Policy, Safety Rules and accuracy declaration.");
    }

    const existing = await env.DB.prepare("SELECT id, email_verified FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return error(existing.email_verified ? "An account with this email already exists." : "An account already exists. Check your email for verification.", 409);
    }

    const passwordData = await hashPassword(password);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO users (id, name, display_name, email, password_salt, password_hash, date_of_birth, country_code, city, bio, skills_text, avatar_url, email_verified, terms_accepted_at, privacy_accepted_at, safety_accepted_at, accuracy_accepted_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'IN', ?, ?, ?, NULL, 0, ?, ?, ?, ?, ?)"
    ).bind(
      userId, name, displayName, email, passwordData.salt, passwordData.hash, dob,
      city, bio, skills, now, now, now, now, now
    ).run();

    if (picture && typeof picture === "object" && picture.size) {
      const contentType = String(picture.type || "");
      if (!contentType.startsWith("image/") || picture.size > 5 * 1024 * 1024) {
        await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
        return error("Profile picture must be an image smaller than 5 MB.");
      }
      if (env.AVATARS) {
        const extension = (contentType.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 6) || "jpg";
        const key = "avatars/" + userId + "." + extension;
        await env.AVATARS.put(key, picture.stream(), { httpMetadata: { contentType: contentType } });
        await env.DB.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").bind(key, userId).run();
      }
    }

    const rawToken = randomToken(32);
    const tokenHash = await sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare("INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind(tokenHash, userId, expiresAt, now).run();

    try {
      await sendVerificationEmail(env, email, displayName, rawToken);
    } catch (mailError) {
      await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").bind(userId).run();
      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
      return error(mailError && mailError.message ? mailError.message : "Unable to send the verification email.", 502);
    }

    return json({ ok: true, message: "Account created. Check your email to verify your account before signing in." }, 201);
  } catch (err) {
    return error(err && err.message ? err.message : "Unable to create the account.", 500);
  }
}
