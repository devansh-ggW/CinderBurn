
const encoder = new TextEncoder();

function bytesToBase64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}

function base64urlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, function(c){ return c.charCodeAt(0); });
}

export function randomToken(byteLength) {
  const length = byteLength || 32;
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToBase64url(bytes);
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), function(byte){ return byte.toString(16).padStart(2, "0"); }).join("");
}

export async function hashPassword(password, saltBytes) {
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: 150000, hash: "SHA-256" },
    key,
    256
  );
  return {
    salt: bytesToBase64url(salt),
    hash: bytesToBase64url(new Uint8Array(bits))
  };
}

export async function verifyPassword(password, saltString, expectedHash) {
  const salt = base64urlToBytes(saltString);
  const result = await hashPassword(password, salt);
  return result.hash === expectedHash;
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function calculateAge(dob) {
  const birth = new Date(String(dob || "") + "T00:00:00Z");
  if (Number.isNaN(birth.getTime())) return -1;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

export function validPassword(password) {
  return typeof password === "string" && password.length >= 10 && /[A-Za-z]/.test(password) && /\\d/.test(password);
}

export function cookie(name, value, options) {
  const opts = options || {};
  const parts = [name + "=" + encodeURIComponent(value), "Path=/"];
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  if (opts.secure !== false) parts.push("Secure");
  parts.push("SameSite=Lax");
  if (opts.maxAge != null) parts.push("Max-Age=" + opts.maxAge);
  return parts.join("; ");
}

export function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const pieces = part.trim().split("=");
    const key = pieces.shift();
    if (key === name) return decodeURIComponent(pieces.join("="));
  }
  return null;
}

export function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers || {})
  });
}
