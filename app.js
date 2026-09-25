const data = {
  jobs: [],
  talent: [],
  companies: []
};

let mode = "jobs";
const $ = id => document.getElementById(id);
const results = $("results");
const resultCount = $("resultCount");
const backdrop = $("modalBackdrop");
let modalMode = null;
let currentUser = null;
let editingJobId = null;
let jobsLoading = true;
let jobsLoaded = false;

backdrop.hidden = true;
backdrop.style.display = "none";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatSalary(min, max) {
  if (min == null && max == null) return "Salary not listed";
  if (min != null && max != null) return "₹" + Number(min).toLocaleString("en-IN") + "–₹" + Number(max).toLocaleString("en-IN");
  if (min != null) return "From ₹" + Number(min).toLocaleString("en-IN");
  return "Up to ₹" + Number(max).toLocaleString("en-IN");
}

function getFilters() {
  return {
    q: $("marketSearch").value.trim().toLowerCase(),
    location: $("locationFilter").value,
    category: $("categoryFilter").value,
    exp: $("experienceFilter").value,
    work: [...document.querySelectorAll('[data-filter="work"]:checked')].map(x => x.value)
  };
}

function getVisibleItems() {
  const f = getFilters();
  return data[mode].filter(item => {
    const hay = [item.title, item.company, item.location, item.type, item.category, item.description, ...(item.tags || [])].join(" ").toLowerCase();
    return (!f.q || hay.includes(f.q))
      && (!f.location || item.location === f.location)
      && (!f.category || item.category === f.category)
      && (!f.exp || !item.exp || item.exp === f.exp)
      && (!f.work.length || f.work.includes(item.type));
  });
}


function updateWorkspaceVisibility() {
  const section = $("accountWorkspace");
  if (!section) return;
  section.hidden = !currentUser;
  if (currentUser) renderManageWorkspace();
}

function renderManageWorkspace() {
  const section = $("accountWorkspace");
  if (!section || !currentUser) return;
  const list = $("myJobsList");
  const profile = $("myProfileCard");
  if (!list || !profile) return;

  const mine = data.jobs.filter(job => job.can_edit);
  list.innerHTML = mine.length
    ? mine.map(job => '<article class="manage-job">' +
        '<div class="manage-job-thumb">' + (job.thumbnail_url ? '<img src="' + escapeHtml(job.thumbnail_url) + '" alt="">' : '<span>CB</span>') + '</div>' +
        '<div class="manage-job-main"><strong>' + escapeHtml(job.title) + '</strong><span>' + escapeHtml(job.company) + ' · ' + escapeHtml(job.location || "Location not listed") + '</span><small>' + escapeHtml(job.type || "") + ' · ' + escapeHtml(job.pay || "Salary not listed") + '</small></div>' +
        '<div class="manage-job-actions"><button class="btn btn-secondary" data-manage-edit-job="' + escapeHtml(job.id) + '" type="button">Edit</button><button class="btn btn-danger" data-manage-delete-job="' + escapeHtml(job.id) + '" type="button">Delete</button></div>' +
      '</article>').join("")
    : '<div class="manage-empty">You have not posted any jobs yet.</div>';

  profile.innerHTML = '<div class="manage-profile-top">' + avatarMarkup(currentUser, true) +
    '<div><strong>' + escapeHtml(currentUser.displayName || currentUser.name) + '</strong><span>' + escapeHtml(currentUser.email) + '</span></div></div>' +
    '<div class="manage-profile-fields"><div><span>City</span><strong>' + escapeHtml(currentUser.city || "Not added") + '</strong></div><div><span>Skills</span><strong>' + escapeHtml(currentUser.skills || "Not added") + '</strong></div><div><span>Bio</span><strong>' + escapeHtml(currentUser.bio || "Not added") + '</strong></div></div>';
}

async function deleteManagedJob(jobId, button) {
  if (!confirm("Delete this job? This cannot be undone.")) return;
  button.disabled = true;
  button.textContent = "Deleting";
  try {
    const response = await fetch("/api/jobs?id=" + encodeURIComponent(jobId), { method: "DELETE", credentials: "same-origin", cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to delete the job.");
    data.jobs = data.jobs.filter(job => job.id !== jobId);
    render();
    renderManageWorkspace();
  } catch (err) {
    button.disabled = false;
    button.textContent = "Delete";
    alert(err.message || "Unable to delete the job.");
  }
}

async function deleteOwnProfile() {
  if (!confirm("Delete your DEWIFY profile? Your account, jobs and applications will be permanently removed.")) return;
  const response = await fetch("/api/profile", { method: "DELETE", credentials: "same-origin", cache: "no-store" });
  const body = await response.json();
  if (!response.ok) {
    alert(body.error || "Unable to delete the profile.");
    return;
  }
  currentUser = null;
  editingJobId = null;
  data.jobs = [];
  data.talent = [];
  data.companies = [];
  try {
    localStorage.removeItem("cinderburn_user");
    localStorage.removeItem("cinderburn_profile_picture");
  } catch {}
  renderAuthActions();
  updateWorkspaceVisibility();
  render();
  alert("Your DEWIFY profile has been deleted.");
}

function updateLiveStats() {
  const jobsEl = $("liveJobsCount");
  const peopleEl = $("livePeopleCount");
  const companiesEl = $("liveCompaniesCount");
  if (jobsEl) jobsEl.textContent = String(data.jobs.length);
  if (peopleEl) peopleEl.textContent = String(data.talent.length);
  if (companiesEl) companiesEl.textContent = String(data.companies.length);
}

function render() {
  updateLiveStats();
  if (mode === "jobs" && jobsLoading) {
    resultCount.textContent = "Loading jobs";
    results.innerHTML = '<div class="result-card"><div><div class="result-title">Loading jobs</div><div class="result-meta">Fetching current DEWIFY jobs.</div></div></div>';
    return;
  }

  if (mode === "jobs" && !jobsLoaded) {
    resultCount.textContent = "Showing 0 results";
    results.innerHTML = '<div class="result-card"><div><div class="result-title">Jobs could not be loaded.</div><div class="result-meta">Refresh the page and try again.</div></div></div>';
    return;
  }

  const filtered = getVisibleItems();
  resultCount.textContent = "Showing " + filtered.length + " result" + (filtered.length === 1 ? "" : "s");

  if (!filtered.length) {
    const emptyTitle = mode === "jobs" ? "No jobs posted yet." : mode === "talent" ? "No public profiles yet." : "No companies listed yet.";
    const emptyText = mode === "jobs" ? "Published jobs will appear here." : mode === "talent" ? "Verified member profiles will appear here." : "Companies created through DEWIFY will appear here.";
    results.innerHTML = '<div class="result-card"><div><div class="result-title">' + emptyTitle + '</div><div class="result-meta">' + emptyText + '</div></div></div>';
    return;
  }

  results.innerHTML = filtered.map((item, index) => {
    const action = mode === "jobs" ? "View job" : mode === "talent" ? "View profile" : "View company";
    const tags = (item.tags || []).map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join("");
    const thumbnail = mode === "jobs"
      ? '<div class="job-thumb">' +
          (item.thumbnail_url
            ? '<img src="' + escapeHtml(item.thumbnail_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
            : '<span>CB</span>') +
        '</div>'
      : "";
    return '<article class="result-card' + (mode === "jobs" ? ' job-result-card' : '') + '">' +
      thumbnail +
      '<div class="result-main">' +
      '<div class="result-top"><span>' + escapeHtml(item.company) + '</span><span>•</span><span>' + escapeHtml(item.location || "Location not listed") + '</span><span>•</span><span>' + escapeHtml(item.type) + '</span></div>' +
      '<div class="result-title">' + escapeHtml(item.title) + '</div>' +
      '<div class="result-meta">' + escapeHtml(mode === "companies" ? "Company profile" : item.category) + '</div>' +
      '<div class="tag-row">' + tags + '</div>' +
      '</div>' +
      '<div class="result-side"><div class="result-pay">' + escapeHtml(item.pay || "Salary not listed") + '</div>' +
      '<button class="apply-btn" data-result-index="' + index + '" data-result-action="' + action + '">' + action + '</button>' +
      (mode === "jobs" && item.can_delete ? '<button class="delete-job-btn" data-job-delete="' + escapeHtml(item.id) + '" type="button">Delete job</button>' : '') +
      '</div>' +
      '</article>';
  }).join("");
}

async function loadJobs() {
  jobsLoading = true;
  render();
  try {
    const response = await fetch("/api/jobs", { credentials: "same-origin", cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load jobs.");
    data.jobs = Array.isArray(body.jobs) ? body.jobs : [];
    jobsLoaded = true;
  } catch {
    data.jobs = [];
    jobsLoaded = true;
  } finally {
    jobsLoading = false;
    render();
  }
}

async function loadPeople() {
  try {
    const response = await fetch("/api/people", { credentials: "same-origin", cache: "no-store" });
    const body = await response.json();
    data.talent = response.ok && Array.isArray(body.people) ? body.people : [];
  } catch {
    data.talent = [];
  }
  render();
}

async function loadCompanies() {
  try {
    const response = await fetch("/api/companies", { credentials: "same-origin", cache: "no-store" });
    const body = await response.json();
    data.companies = response.ok && Array.isArray(body.companies) ? body.companies : [];
  } catch {
    data.companies = [];
  }
  render();
}

function closeModal() {
  backdrop.hidden = true;
  backdrop.style.display = "none";
  modalMode = null;
}

function setModal(title, text, formHtml) {
  $("modalTitle").textContent = title;
  $("modalText").textContent = text;
  $("signupForm").innerHTML = formHtml || "";
  backdrop.hidden = false;
  backdrop.style.display = "grid";
}


const imageEditors = new Map();

function imageEditorHtml(prefix, label, aspectText) {
  return '<div class="image-editor-block">' +
    '<label class="field-label">' + escapeHtml(label) + '</label>' +
    '<div class="image-dropzone" id="' + prefix + 'Drop" tabindex="0">' +
      '<div class="image-drop-icon">+</div>' +
      '<strong>Drag & drop an image here</strong>' +
      '<span>or click to choose a file</span>' +
      '<small>JPG, PNG or WebP • max 5 MB • ' + escapeHtml(aspectText) + '</small>' +
      '<input id="' + prefix + 'Input" type="file" accept="image/*" hidden>' +
    '</div>' +
    '<div class="image-editor" id="' + prefix + 'Editor" hidden>' +
      '<canvas id="' + prefix + 'Canvas"></canvas>' +
      '<div class="image-adjustments">' +
        '<label>Zoom<input id="' + prefix + 'Zoom" type="range" min="1" max="3" step="0.01" value="1"></label>' +
        '<label>Horizontal<input id="' + prefix + 'X" type="range" min="-100" max="100" step="1" value="0"></label>' +
        '<label>Vertical<input id="' + prefix + 'Y" type="range" min="-100" max="100" step="1" value="0"></label>' +
      '</div>' +
      '<button type="button" class="btn btn-secondary image-reset" id="' + prefix + 'Reset">Reset crop</button>' +
    '</div>' +
    '<input id="' + prefix + 'Output" type="hidden">' +
  '</div>';
}

function initImageEditor(prefix, aspectRatio, outputWidth, existingSrc) {
  const drop = $(prefix + "Drop");
  const input = $(prefix + "Input");
  const editor = $(prefix + "Editor");
  const canvas = $(prefix + "Canvas");
  const zoom = $(prefix + "Zoom");
  const xRange = $(prefix + "X");
  const yRange = $(prefix + "Y");
  const reset = $(prefix + "Reset");
  const output = $(prefix + "Output");
  if (!drop || !input || !editor || !canvas || !zoom || !xRange || !yRange || !reset || !output) return;

  const ctx = canvas.getContext("2d");
  const state = { image: null, zoom: 1, x: 0, y: 0, aspect: aspectRatio, outputWidth };

  const draw = () => {
    if (!state.image) return;
    const frameW = outputWidth;
    const frameH = Math.round(outputWidth / aspectRatio);
    canvas.width = frameW;
    canvas.height = frameH;
    ctx.clearRect(0, 0, frameW, frameH);

    const coverScale = Math.max(frameW / state.image.naturalWidth, frameH / state.image.naturalHeight) * state.zoom;
    const drawW = state.image.naturalWidth * coverScale;
    const drawH = state.image.naturalHeight * coverScale;
    const maxX = Math.max(0, (drawW - frameW) / 2);
    const maxY = Math.max(0, (drawH - frameH) / 2);
    const dx = (frameW - drawW) / 2 + (state.x / 100) * maxX;
    const dy = (frameH - drawH) / 2 + (state.y / 100) * maxY;

    ctx.drawImage(state.image, dx, dy, drawW, drawH);
    output.value = canvas.toDataURL("image/webp", 0.78);

    const preview = $(prefix + "Preview");
    if (preview) preview.innerHTML = '<img src="' + escapeHtml(output.value) + '" alt="">';
  };

  const loadFile = file => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setFormStatus("formStatus", "Choose an image smaller than 5 MB.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        state.image = img;
        state.zoom = 1;
        state.x = 0;
        state.y = 0;
        zoom.value = "1";
        xRange.value = "0";
        yRange.value = "0";
        editor.hidden = false;
        draw();
      };
      img.src = String(e.target.result || "");
    };
    reader.readAsDataURL(file);
  };

  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
  });
  input.addEventListener("change", () => loadFile(input.files?.[0]));
  if (existingSrc) {
    const img = new Image();
    img.onload = () => {
      state.image = img;
      state.zoom = 1;
      state.x = 0;
      state.y = 0;
      zoom.value = "1";
      xRange.value = "0";
      yRange.value = "0";
      editor.hidden = false;
      draw();
    };
    img.src = existingSrc;
  }

  ["dragenter", "dragover"].forEach(type => drop.addEventListener(type, e => {
    e.preventDefault();
    drop.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach(type => drop.addEventListener(type, e => {
    e.preventDefault();
    drop.classList.remove("dragging");
  }));
  drop.addEventListener("drop", e => loadFile(e.dataTransfer?.files?.[0]));

  zoom.addEventListener("input", () => { state.zoom = Number(zoom.value); draw(); });
  xRange.addEventListener("input", () => { state.x = Number(xRange.value); draw(); });
  yRange.addEventListener("input", () => { state.y = Number(yRange.value); draw(); });
  reset.addEventListener("click", () => {
    state.zoom = 1; state.x = 0; state.y = 0;
    zoom.value = "1"; xRange.value = "0"; yRange.value = "0";
    draw();
  });

  imageEditors.set(prefix, { getDataUrl: () => output.value });
}

function signupFormHtml() {
  return imageEditorHtml("profile", "Profile picture", "square crop") +
    '<div class="form-grid-two">' +
    '<input required name="name" type="text" placeholder="Full legal name">' +
    '<input required name="display_name" type="text" placeholder="Display name">' +
    '</div>' +
    '<div class="form-grid-two">' +
    '<div><label class="field-label">Date of birth</label><input required id="dobField" name="dob" type="date"></div>' +
    '<div><label class="field-label">Age</label><input id="agePreview" type="text" placeholder="Auto-calculated" readonly></div>' +
    '</div>' +
    '<div class="form-grid-two">' +
    '<input required name="email" type="email" placeholder="Email address">' +
    '<input required name="password" type="password" placeholder="Password (10+ chars, letters + numbers)">' +
    '</div>' +
    '<select required name="role"><option value="">I want to…</option><option value="Find work">Find work</option><option value="Hire people">Hire people</option><option value="Both">Both</option></select>' +
    '<input name="city" type="text" maxlength="80" placeholder="City (India)">' +
    '<input name="skills" type="text" maxlength="500" placeholder="Skills (e.g. React, Sales, Design)">' +
    '<textarea name="bio" maxlength="1200" rows="4" placeholder="Short bio"></textarea>' +
    '<label class="legal-check"><input required name="truth" type="checkbox"> I confirm that the information I provide is truthful and belongs to me.</label>' +
    '<label class="legal-check"><input required name="terms" type="checkbox"> I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms of Service</a>.</label>' +
    '<label class="legal-check"><input required name="privacy" type="checkbox"> I have read the <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</label>' +
    '<label class="legal-check"><input required name="safety" type="checkbox"> I agree to the <a href="safety.html" target="_blank" rel="noopener">Safety Rules</a>.</label>' +
    '<div class="signup-disclaimer"><strong>Important:</strong> DEWIFY is a marketplace connecting users. Verify identities, offers and arrangements independently. DEWIFY does not guarantee a user, employer, job, payment or outcome, and is not responsible for losses or harm caused by false information, misrepresentation, scams or users\' actions, except where applicable law provides otherwise. See our <a href="verification.html" target="_blank" rel="noopener">Verification & Trust</a> guidance.</div>' +
    '<button class="btn btn-primary" type="submit">Create account</button>' +
    '<div class="form-status" id="formStatus" aria-live="polite"></div>';
}
function loginFormHtml() {
  return '<input required id="loginEmail" type="email" placeholder="Email address">' +
    '<input required id="loginPassword" type="password" placeholder="Password">' +
    '<label class="legal-check"><input id="rememberDevice" type="checkbox"> Remember this device</label>' +
    '<button class="btn btn-primary" type="submit">Sign in</button>' +
    '<div class="form-status" id="formStatus" aria-live="polite"></div>';
}

function editJobFormHtml(item) {
  return imageEditorHtml("editJobImage", "Job thumbnail", "16:9 crop") +
    '<input required id="editJobTitle" type="text" maxlength="120" value="' + escapeHtml(item.title || "") + '" placeholder="Job title">' +
    '<input required id="editCompanyName" type="text" maxlength="100" value="' + escapeHtml(item.company || "") + '" placeholder="Company name">' +
    '<input id="editJobLocation" type="text" maxlength="100" value="' + escapeHtml(item.location || "") + '" placeholder="Location">' +
    '<select required id="editJobWorkType"><option value="">Work type</option><option' + (item.type === "Remote" ? " selected" : "") + '>Remote</option><option' + (item.type === "Hybrid" ? " selected" : "") + '>Hybrid</option><option' + (item.type === "On-site" ? " selected" : "") + '>On-site</option></select>' +
    '<select required id="editJobCategory"><option value="">Category</option><option' + (item.category === "Technology" ? " selected" : "") + '>Technology</option><option' + (item.category === "Design" ? " selected" : "") + '>Design</option><option' + (item.category === "Marketing" ? " selected" : "") + '>Marketing</option><option' + (item.category === "Sales" ? " selected" : "") + '>Sales</option><option' + (item.category === "Content" ? " selected" : "") + '>Content</option></select>' +
    '<div class="form-grid-two"><input id="editSalaryMin" type="number" min="0" value="' + escapeHtml(item.salary_min ?? "") + '" placeholder="Minimum salary (₹)"><input id="editSalaryMax" type="number" min="0" value="' + escapeHtml(item.salary_max ?? "") + '" placeholder="Maximum salary (₹)"></div>' +
    '<textarea required id="editJobDescription" maxlength="4000" rows="6" placeholder="Job description">' + escapeHtml(item.description || "") + '</textarea>' +
    '<div class="form-grid-two"><input required id="editJobContactPhone" type="tel" maxlength="40" value="' + escapeHtml(item.contact_phone || "") + '" placeholder="Contact phone number"><input required id="editJobContactEmail" type="email" maxlength="160" value="' + escapeHtml(item.contact_email || "") + '" placeholder="Contact email address"></div>' +
    '<div class="field-help">Drop a new image to replace the existing thumbnail. Leave it untouched to keep the current image.</div>' +
    '<button class="btn btn-primary" type="submit">Save job</button>' +
    '<button class="btn btn-secondary" type="button" id="cancelEditJob">Cancel</button>' +
    '<div class="form-status" id="formStatus" aria-live="polite"></div>';
}

function postJobFormHtml() {
  return imageEditorHtml("jobImage", "Job thumbnail", "16:9 crop") +
    '<input required id="jobTitle" type="text" maxlength="120" placeholder="Job title">' +
    '<input required id="companyName" type="text" maxlength="100" placeholder="Company name">' +
    '<input id="jobLocation" type="text" maxlength="100" placeholder="Location (e.g. Mumbai or Remote)">' +
    '<select required id="jobWorkType"><option value="">Work type</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select>' +
    '<select required id="jobCategory"><option value="">Category</option><option>Technology</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Content</option></select>' +
    '<div class="form-grid-two"><input id="salaryMin" type="number" min="0" placeholder="Minimum salary (₹)"><input id="salaryMax" type="number" min="0" placeholder="Maximum salary (₹)"></div>' +
    '<textarea required id="jobDescription" maxlength="4000" rows="6" placeholder="Describe the role, responsibilities and what you are looking for."></textarea>' +
    '<div class="form-grid-two">' +
      '<input required id="jobContactPhone" type="tel" maxlength="40" placeholder="Contact phone number">' +
      '<input required id="jobContactEmail" type="email" maxlength="160" placeholder="Contact email address">' +
    '</div>' +
    '<div class="field-help">These contact details will be shown to people who open the job.</div>' +
    '<button class="btn btn-primary" type="submit">Publish job</button>' +
    '<div class="form-status" id="formStatus" aria-live="polite"></div>';
}
function showSignup() {
  modalMode = "signup";
  setModal("Create your DEWIFY account", "Use accurate information. Your email must be verified before you can sign in.", signupFormHtml());
  const dob = $("dobField");
  const age = $("agePreview");
  const today = new Date();
  dob.max = today.toISOString().slice(0, 10);
  dob.addEventListener("change", () => {
    if (!dob.value) { age.value = ""; return; }
    const birth = new Date(dob.value + "T00:00:00");
    let years = today.getFullYear() - birth.getFullYear();
    const diff = today.getMonth() - birth.getMonth();
    if (diff < 0 || (diff === 0 && today.getDate() < birth.getDate())) years--;
    age.value = String(years);
    age.style.color = years >= 18 ? "#9de6af" : "#ff8f8f";
  });
  initImageEditor("profile", 1, 512);
}

function setFormStatus(id, message, bad) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("bad", Boolean(bad));
  el.classList.toggle("good", !bad);
}

function avatarMarkup(user, large) {
  const fallback = String(user?.displayName || user?.name || "?").trim().slice(0, 1).toUpperCase() || "?";
  const localPicture = (() => {
    try { return localStorage.getItem("cinderburn_profile_picture"); } catch { return null; }
  })();
  const src = user?.avatarUrl || localPicture;
  const className = large ? "profile-avatar large" : "profile-avatar";
  return src
    ? '<div class="' + className + '"><img src="' + escapeHtml(src) + '" alt=""></div>'
    : '<div class="' + className + '">' + escapeHtml(fallback) + '</div>';
}

function publicAvatarMarkup(user, large) {
  const raw = user?.avatarUrl || user?.avatar_url || "";
  const fallback = String(user?.displayName || user?.display_name || user?.name || "?").trim().slice(0, 1).toUpperCase() || "?";
  const className = large ? "profile-avatar public large" : "profile-avatar public";
  return raw
    ? '<div class="' + className + '"><img src="' + escapeHtml(raw) + '" alt=""></div>'
    : '<div class="' + className + '">' + escapeHtml(fallback) + '</div>';
}

function normalizeWhatsAppPhone(value) {
  const raw = String(value || "").trim();
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  return digits;
}

function contactActionsHtml(item) {
  const phone = String(item?.contact_phone || "").trim();
  const email = String(item?.contact_email || "").trim();
  const wa = normalizeWhatsAppPhone(phone);
  const emailAction = email
    ? '<a class="contact-action" href="mailto:' + encodeURIComponent(email) + '"><span>EMAIL</span><strong>' + escapeHtml(email) + '</strong></a>'
    : '<div class="contact-action disabled"><span>EMAIL</span><strong>Not provided</strong></div>';
  const callAction = phone
    ? '<a class="contact-action" href="tel:' + encodeURIComponent(phone) + '"><span>CALL</span><strong>' + escapeHtml(phone) + '</strong></a>'
    : '<div class="contact-action disabled"><span>CALL</span><strong>Not provided</strong></div>';
  const whatsappAction = wa
    ? '<a class="contact-action" href="https://wa.me/' + wa + '" target="_blank" rel="noopener"><span>WHATSAPP</span><strong>Open chat</strong></a>'
    : '<div class="contact-action disabled"><span>WHATSAPP</span><strong>Not provided</strong></div>';
  return '<div class="contact-actions">' + emailAction + callAction + whatsappAction + '</div>';
}

let activeJobContext = null;

function showPublicUser(user, returnToJob) {
  const displayName = user?.displayName || user?.display_name || user?.name || "DEWIFY member";
  const fullName = user?.name || "";
  const city = user?.city || user?.location || "Location not listed";
  const country = user?.country || user?.country_code || "IN";
  const skills = Array.isArray(user?.tags) ? user.tags : String(user?.skills || user?.skills_text || "").split(",").map(x => x.trim()).filter(Boolean);
  const bio = user?.bio || user?.description || "No public bio added.";
  const tags = skills.slice(0, 10).map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join("");
  const back = returnToJob
    ? '<button type="button" class="btn btn-secondary" id="backToJob">Back to job</button>'
    : '<button type="button" class="btn btn-secondary" id="modalDone">Close</button>';

  setModal(
    "Public profile",
    "Public information shared by this DEWIFY member.",
    '<div class="public-profile-card">' +
      '<div class="public-profile-head">' +
        publicAvatarMarkup({avatarUrl: user?.avatarUrl || user?.avatar_url, displayName, name: fullName}, true) +
        '<div><div class="public-profile-name">' + escapeHtml(displayName) + '</div>' +
        (fullName && fullName !== displayName ? '<div class="public-profile-full-name">' + escapeHtml(fullName) + '</div>' : '') +
        '<div class="public-profile-location">' + escapeHtml(city) + ' · ' + escapeHtml(country) + '</div></div>' +
      '</div>' +
      '<div class="profile-grid public-profile-grid">' +
        '<div><span>CITY</span><strong>' + escapeHtml(city) + '</strong></div>' +
        '<div><span>COUNTRY</span><strong>' + escapeHtml(country) + '</strong></div>' +
      '</div>' +
      '<div class="public-profile-section"><span>SKILLS</span><div class="tag-row">' + (tags || '<span class="public-empty">No skills listed.</span>') + '</div></div>' +
      '<div class="public-profile-section"><span>BIO</span><p>' + escapeHtml(bio) + '</p></div>' +
      '</div>' + back
  );

  if (returnToJob) {
    $("backToJob").addEventListener("click", () => showJobDetail(returnToJob));
  } else {
    $("modalDone").addEventListener("click", closeModal);
  }
}

function showJobDetail(item) {
  activeJobContext = item;
  const thumbnail = item.thumbnail_url
    ? '<div class="job-detail-image"><img src="' + escapeHtml(item.thumbnail_url) + '" alt=""></div>'
    : "";
  const posterName = item.poster_display_name || item.poster_name || "DEWIFY member";
  const posterAvatar = item.poster_avatar_url || "";
  const posterBlock =
    '<button type="button" class="poster-profile-trigger" id="posterProfileButton">' +
      publicAvatarMarkup({avatarUrl: posterAvatar, displayName: posterName, name: item.poster_name || posterName}, false) +
      '<span><small>POSTED BY</small><strong>' + escapeHtml(posterName) + '</strong></span>' +
      '<b>VIEW PROFILE</b>' +
    '</button>';

  setModal(
    item.title,
    "Job details, poster profile and direct contact options.",
    thumbnail +
    posterBlock +
    '<div class="job-detail-grid">' +
      '<div><span>COMPANY</span><strong>' + escapeHtml(item.company) + '</strong></div>' +
      '<div><span>LOCATION</span><strong>' + escapeHtml(item.location || "Not listed") + '</strong></div>' +
      '<div><span>WORK TYPE</span><strong>' + escapeHtml(item.type || "Not listed") + '</strong></div>' +
      '<div><span>CATEGORY</span><strong>' + escapeHtml(item.category || "Not listed") + '</strong></div>' +
      '<div><span>SALARY</span><strong>' + escapeHtml(item.pay || "Not listed") + '</strong></div>' +
    '</div>' +
    '<div class="job-detail-description">' + escapeHtml(item.description || "No description provided.") + '</div>' +
    contactActionsHtml(item) +
    '<button type="button" class="btn btn-secondary" id="modalDone">Close</button>'
  );
  $("posterProfileButton").addEventListener("click", () => showPublicUser({
    displayName: posterName,
    name: item.poster_name || posterName,
    city: item.poster_city,
    country: item.poster_country,
    skills: item.poster_skills,
    bio: item.poster_bio,
    avatarUrl: posterAvatar
  }, item));
  $("modalDone").addEventListener("click", closeModal);
}

function renderAuthActions() {
  const host = $("authActions");
  if (!host) return;
  if (!currentUser) {
    host.innerHTML = '<button class="btn btn-ghost" data-modal="signin">Sign in</button><button class="btn btn-primary" data-modal="signup">Join DEWIFY</button>';
    bindAuthButtons();
    return;
  }
  host.innerHTML = '<button class="btn btn-secondary edit-profile-top" id="editProfileTop" type="button">Edit profile</button>' +
    '<button class="account-chip" id="accountButton" type="button">' + avatarMarkup(currentUser, false) + '<span class="account-name">' + escapeHtml(currentUser.displayName || currentUser.name) + '</span></button>';
  $("editProfileTop").addEventListener("click", showEditProfile);
  $("accountButton").addEventListener("click", showProfile);
}

function bindAuthButtons() {
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.modal === "signup") showSignup();
      else {
        modalMode = "signin";
        setModal("Welcome back", "Sign in with your verified DEWIFY email.", loginFormHtml());
      }
    };
  });
}

function profileFormHtml() {
  return '<div class="profile-account-card">' +
    avatarMarkup(currentUser, true) +
    '<div><div class="profile-name">' + escapeHtml(currentUser.displayName || currentUser.name) + '</div>' +
    '<div class="profile-email">' + escapeHtml(currentUser.email) + '</div></div></div>' +
    '<div class="profile-grid">' +
      '<div><span>Name</span><strong>' + escapeHtml(currentUser.name || "—") + '</strong></div>' +
      '<div><span>City</span><strong>' + escapeHtml(currentUser.city || "Not added") + '</strong></div>' +
      '<div><span>Country</span><strong>' + escapeHtml(currentUser.country || "IN") + '</strong></div>' +
      '<div><span>Status</span><strong>Verified account</strong></div>' +
    '</div>' +
    '<button type="button" class="btn btn-primary" id="editProfileButton">Edit profile</button>' +
    '<button type="button" class="btn btn-secondary" id="signOutButton">Sign out</button>';
}

function editProfileFormHtml() {
  return imageEditorHtml("editProfileImage", "Profile picture", "square crop") +
    '<div class="image-current-note">' + (currentUser.avatarUrl ? "Choose a new image to replace your current picture." : "Add a profile picture so people can recognize your profile.") + '</div>' +
    '<input required id="editDisplayName" type="text" maxlength="40" value="' + escapeHtml(currentUser.displayName || "") + '" placeholder="Display name">' +
    '<input id="editCity" type="text" maxlength="80" value="' + escapeHtml(currentUser.city || "") + '" placeholder="City">' +
    '<input id="editSkills" type="text" maxlength="500" value="' + escapeHtml(currentUser.skills || "") + '" placeholder="Skills">' +
    '<textarea id="editBio" maxlength="1200" rows="5" placeholder="Short bio">' + escapeHtml(currentUser.bio || "") + '</textarea>' +
    '<button type="submit" class="btn btn-primary">Save changes</button>' +
    '<button type="button" class="btn btn-secondary" id="cancelEditProfile">Cancel</button>' +
    '<div class="form-status" id="formStatus" aria-live="polite"></div>';
}

function showProfile() {
  modalMode = "profile";
  setModal("Your DEWIFY profile", "This is the account currently connected to this browser.", profileFormHtml());
  $("editProfileButton").addEventListener("click", showEditProfile);
  $("signOutButton").addEventListener("click", signOut);
}

function showEditProfile() {
  modalMode = "edit-profile";
  setModal("Edit your profile", "Update the profile information that other DEWIFY users can see.", editProfileFormHtml());
  $("cancelEditProfile").addEventListener("click", showProfile);
  initImageEditor("editProfileImage", 1, 512);
}

function showEditJob(item) {
  editingJobId = item.id;
  modalMode = "edit-job";
  setModal("Edit your job", "Only you can edit this job listing.", editJobFormHtml(item));
  initImageEditor("editJobImage", 16 / 9, 960, item.thumbnail_url || "");
  $("cancelEditJob").addEventListener("click", closeModal);
}

function showPostJob() {
  modalMode = "post-job";
  setModal("Post a job", "Publish a role directly from your DEWIFY account.", postJobFormHtml());
  initImageEditor("jobImage", 16 / 9, 960);
}

async function submitSignup(form) {
  const fd = new FormData(form);
  fd.set("avatar_data_url", imageEditors.get("profile")?.getDataUrl() || "");
  setFormStatus("formStatus", "Creating your account");
  try {
    const response = await fetch("/api/signup", { method: "POST", body: fd, credentials: "same-origin" });
    const body = await response.json();
    if (!response.ok) {
      setFormStatus("formStatus", body.error || "Unable to create your account.", true);
      return;
    }
    const profileImage = imageEditors.get("profile")?.getDataUrl() || "";
    if (profileImage) {
      try { localStorage.setItem("cinderburn_profile_picture", profileImage); } catch {}
    }
    showInfo("Check your email", body.message + " The message will come from cinderburn@cinderburn.dewify.shop.");
  } catch {
    setFormStatus("formStatus", "Network error. Please try again.", true);
  }
}

async function submitLogin(form) {
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  setFormStatus("formStatus", "Signing you in");
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password })
    });
    const body = await response.json();
    if (!response.ok) {
      setFormStatus("formStatus", body.error || "Unable to sign in.", true);
      return;
    }
    currentUser = body.user;
    try { localStorage.setItem("cinderburn_user", JSON.stringify(body.user)); } catch {}
    renderAuthActions();
    updateWorkspaceVisibility();
    await loadJobs();
    closeModal();
    showProfile();
  } catch {
    setFormStatus("formStatus", "Network error. Please try again.", true);
  }
}

async function submitPostJob() {
  const payload = {
    title: $("jobTitle").value.trim(),
    company: $("companyName").value.trim(),
    location: $("jobLocation").value.trim(),
    workType: $("jobWorkType").value,
    category: $("jobCategory").value,
    salaryMin: $("salaryMin").value ? Number($("salaryMin").value) : null,
    salaryMax: $("salaryMax").value ? Number($("salaryMax").value) : null,
    description: $("jobDescription").value.trim(),
    contactPhone: $("jobContactPhone").value.trim(),
    contactEmail: $("jobContactEmail").value.trim(),
    thumbnailUrl: imageEditors.get("jobImage")?.getDataUrl() || ""
  };
  setFormStatus("formStatus", "Publishing job");
  try {
    const response = await fetch("/api/jobs", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    if (!response.ok) {
      setFormStatus("formStatus", body.error || "Unable to publish the job.", true);
      return;
    }
    data.jobs = [];
    await loadJobs();
    mode = "jobs";
    document.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b.dataset.mode === "jobs"));
    closeModal();
    renderManageWorkspace();
    document.getElementById("jobs").scrollIntoView({behavior:"auto"});
  } catch {
    setFormStatus("formStatus", "Network error. Please try again.", true);
  }
}


async function submitEditJob() {
  const item = data.jobs.find(job => job.id === editingJobId);
  const existingImage = item?.thumbnail_url || "";
  const payload = {
    title: $("editJobTitle").value.trim(),
    company: $("editCompanyName").value.trim(),
    location: $("editJobLocation").value.trim(),
    workType: $("editJobWorkType").value,
    category: $("editJobCategory").value,
    salaryMin: $("editSalaryMin").value ? Number($("editSalaryMin").value) : null,
    salaryMax: $("editSalaryMax").value ? Number($("editSalaryMax").value) : null,
    description: $("editJobDescription").value.trim(),
    contactPhone: $("editJobContactPhone").value.trim(),
    contactEmail: $("editJobContactEmail").value.trim(),
    thumbnailUrl: imageEditors.get("editJobImage")?.getDataUrl() || existingImage
  };
  setFormStatus("formStatus", "Saving job");
  try {
    const response = await fetch("/api/jobs?id=" + encodeURIComponent(editingJobId), {
      method: "PUT",
      credentials: "same-origin",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    if (!response.ok) {
      setFormStatus("formStatus", body.error || "Unable to edit the job.", true);
      return;
    }
    editingJobId = null;
    closeModal();
    await loadJobs();
    renderManageWorkspace();
  } catch {
    setFormStatus("formStatus", "Network error. Please try again.", true);
  }
}

async function submitEditProfile() {
  const payload = {
    displayName: $("editDisplayName").value.trim(),
    city: $("editCity").value.trim(),
    skills: $("editSkills").value.trim(),
    bio: $("editBio").value.trim(),
    avatarDataUrl: imageEditors.get("editProfileImage")?.getDataUrl() || ""
  };
  setFormStatus("formStatus", "Saving changes");
  try {
    const response = await fetch("/api/profile", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    if (!response.ok) {
      setFormStatus("formStatus", body.error || "Unable to save your profile.", true);
      return;
    }
    currentUser = body.user;
    try { localStorage.setItem("cinderburn_user", JSON.stringify(body.user)); } catch {}
    renderAuthActions();
    updateWorkspaceVisibility();
    showProfile();
  } catch {
    setFormStatus("formStatus", "Network error. Please try again.", true);
  }
}

function showInfo(title, text, actionText) {
  setModal(title, text, '<button type="button" class="btn btn-primary" id="modalDone">' + (actionText || "Continue") + '</button>');
  $("modalDone").addEventListener("click", closeModal);
}

async function loadSession() {
  try {
    const response = await fetch("/api/login", { credentials: "same-origin", cache: "no-store" });
    const body = await response.json();
    currentUser = body.ok ? body.user : null;
  } catch {
    currentUser = null;
  }
  renderAuthActions();
  updateWorkspaceVisibility();
  if (currentUser) await loadJobs();
}

function signOut() {
  fetch("/api/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
  currentUser = null;
  try {
    localStorage.removeItem("cinderburn_user");
    localStorage.removeItem("cinderburn_profile_picture");
  } catch {}
  closeModal();
  renderAuthActions();
  updateWorkspaceVisibility();
}

document.querySelectorAll(".seg").forEach(btn => btn.addEventListener("click", () => {
  mode = btn.dataset.mode;
  document.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b === btn));
  render();
}));

document.querySelectorAll(".search-chips button").forEach(btn => btn.addEventListener("click", () => {
  $("heroSearch").value = btn.dataset.query;
  $("marketSearch").value = btn.dataset.query;
  $("jobs").scrollIntoView({behavior:"auto"});
  mode = "jobs";
  document.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b.dataset.mode === "jobs"));
  render();
}));

$("heroSearchBtn").addEventListener("click", () => {
  $("marketSearch").value = $("heroSearch").value;
  $("jobs").scrollIntoView({behavior:"auto"});
  mode = "jobs";
  document.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b.dataset.mode === "jobs"));
  render();
});
$("heroSearch").addEventListener("keydown", e => { if (e.key === "Enter") $("heroSearchBtn").click(); });
$("marketSearchBtn").addEventListener("click", render);
$("marketSearch").addEventListener("keydown", e => { if (e.key === "Enter") render(); });
["locationFilter","categoryFilter","experienceFilter"].forEach(id => $(id).addEventListener("change", render));
document.querySelectorAll('[data-filter="work"]').forEach(el => el.addEventListener("change", render));

$("clearFilters").addEventListener("click", () => {
  $("marketSearch").value = "";
  $("locationFilter").value = "";
  $("categoryFilter").value = "";
  $("experienceFilter").value = "";
  document.querySelectorAll('[data-filter="work"]').forEach(el => el.checked = false);
  render();
});

document.querySelectorAll("[data-tab-target]").forEach(btn => btn.addEventListener("click", () => {
  mode = btn.dataset.tabTarget === "talent" ? "talent" : "jobs";
  document.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  $(btn.dataset.tabTarget).scrollIntoView({behavior:"auto"});
  render();
}));

$("postJobButton").addEventListener("click", () => {
  if (!currentUser) {
    modalMode = "signin";
    setModal("Sign in to post a job", "Create or sign in to your DEWIFY account before posting a role.", loginFormHtml());
    return;
  }
  showPostJob();
});

$("modalClose").addEventListener("click", closeModal);
backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

$("signupForm").addEventListener("submit", e => {
  e.preventDefault();
  if (modalMode === "signup") submitSignup(e.target);
  else if (modalMode === "signin") submitLogin(e.target);
  else if (modalMode === "post-job") submitPostJob(e.target);
  else if (modalMode === "edit-job") submitEditJob();
  else if (modalMode === "edit-profile") submitEditProfile();
});

document.addEventListener("click", async e => {
  const manageEditButton = e.target.closest("[data-manage-edit-job]");
  if (manageEditButton) {
    const job = data.jobs.find(item => item.id === manageEditButton.dataset.manageEditJob);
    if (job && job.can_edit) showEditJob(job);
    return;
  }
  const manageDeleteButton = e.target.closest("[data-manage-delete-job]");
  if (manageDeleteButton) {
    const job = data.jobs.find(item => item.id === manageDeleteButton.dataset.manageDeleteJob);
    if (job && job.can_delete) await deleteManagedJob(job.id, manageDeleteButton);
    return;
  }
  const managePost = e.target.closest("#managePostJobButton");
  if (managePost) {
    if (!currentUser) return;
    showPostJob();
    return;
  }
  const manageEditProfile = e.target.closest("#manageEditProfileButton");
  if (manageEditProfile) {
    if (currentUser) showEditProfile();
    return;
  }
  const manageDeleteProfile = e.target.closest("#manageDeleteProfileButton");
  if (manageDeleteProfile) {
    if (currentUser) await deleteOwnProfile();
    return;
  }

  const deleteButton = e.target.closest("[data-job-delete]");
  if (deleteButton) {
    const jobId = deleteButton.dataset.jobDelete;
    if (!jobId) return;
    if (!confirm("Delete this job? This cannot be undone.")) return;
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting";
    try {
      const response = await fetch("/api/jobs?id=" + encodeURIComponent(jobId), {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to delete the job.");
      data.jobs = data.jobs.filter(job => job.id !== jobId);
      render();
    } catch (err) {
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete job";
      alert(err.message || "Unable to delete the job.");
    }
    return;
  }

  const button = e.target.closest("[data-result-action]");
  if (!button) return;
  const item = getVisibleItems()[Number(button.dataset.resultIndex)];
  if (!item) return;
  const action = button.dataset.resultAction;
  if (action === "View job") {
    showJobDetail(item);
    return;
  }
  if (action === "View profile") {
    showPublicUser({
      displayName: item.title,
      name: item.full_name || item.title,
      city: item.location,
      country: item.country || "IN",
      skills: item.tags || [],
      bio: item.description,
      avatarUrl: item.avatar_url || ""
    }, null);
    return;
  }
  setModal(
    item.title,
    item.description + " " + (item.location || "Location not listed") + " · " + item.type + " · " + (item.pay || "Not listed"),
    '<div class="tag-row">' + (item.tags || []).map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join("") + '</div>' +
    '<button type="button" class="btn btn-secondary" id="resultAction">Close</button>'
  );
  $("resultAction").addEventListener("click", closeModal);
});

bindAuthButtons();
render();
loadJobs();
loadPeople();
loadCompanies();
loadSession();
