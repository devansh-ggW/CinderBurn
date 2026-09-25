PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'IN',
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'IN',
  city TEXT,
  industry TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT 'IN',
  location TEXT,
  work_type TEXT NOT NULL DEFAULT 'Remote',
  category TEXT NOT NULL DEFAULT 'Technology',
  salary_min INTEGER,
  salary_max INTEGER,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS job_skills (
  job_id TEXT NOT NULL,
  skill_id INTEGER NOT NULL,
  required INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(job_id, skill_id),
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id TEXT NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY(user_id, skill_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  cover_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(job_id, user_id),
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_country_status ON jobs(country_code, status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
