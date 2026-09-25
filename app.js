
const data = {
  jobs: [
    {title:"Frontend Developer",company:"Nova Labs",location:"Bengaluru",type:"Remote",category:"Technology",exp:"2-5",pay:"₹8–14 LPA",tags:["React","JavaScript","CSS"],description:"Build and improve customer-facing web products with a modern frontend stack."},
    {title:"Product Designer",company:"Orbit Commerce",location:"Mumbai",type:"Hybrid",category:"Design",exp:"2-5",pay:"₹7–12 LPA",tags:["Figma","UX","Research"],description:"Own product flows, prototypes and design systems for a growing commerce product."},
    {title:"Growth Marketing Associate",company:"VibeWorks",location:"Delhi",type:"On-site",category:"Marketing",exp:"0-2",pay:"₹4–7 LPA",tags:["SEO","Content","Growth"],description:"Run experiments across content, search and acquisition channels."},
    {title:"Video Editor",company:"Northstar Media",location:"Pune",type:"Remote",category:"Content",exp:"2-5",pay:"₹35k–60k/mo",tags:["Premiere","Shorts","Reels"],description:"Edit short-form and long-form content for social and creator brands."},
    {title:"Sales Development Rep",company:"Vertex Systems",location:"Hyderabad",type:"Hybrid",category:"Sales",exp:"0-2",pay:"₹4–8 LPA",tags:["B2B","SaaS","Sales"],description:"Build qualified B2B conversations and help grow the sales pipeline."},
    {title:"React Native Engineer",company:"ForgePay",location:"Bengaluru",type:"Remote",category:"Technology",exp:"5+",pay:"₹18–26 LPA",tags:["React Native","TypeScript","APIs"],description:"Ship reliable mobile experiences for a fast-moving fintech product."}
  ],
  talent: [
    {title:"Aarav Kulkarni",company:"Frontend Developer",location:"Pune",type:"Remote",category:"Technology",exp:"2-5",pay:"Available",tags:["React","JavaScript","Next.js"],description:"Frontend developer focused on fast, accessible web products."},
    {title:"Meera Shah",company:"Product Designer",location:"Mumbai",type:"Hybrid",category:"Design",exp:"2-5",pay:"Available",tags:["Figma","UX","Design Systems"],description:"Product designer specialising in clear UX and scalable design systems."},
    {title:"Rohan Verma",company:"React Engineer",location:"Bengaluru",type:"Remote",category:"Technology",exp:"5+",pay:"Available",tags:["React","TypeScript","Node"],description:"Senior React engineer building production web applications."},
    {title:"Ishita Rao",company:"Growth Marketer",location:"Delhi",type:"Remote",category:"Marketing",exp:"0-2",pay:"Available",tags:["SEO","Content","Ads"],description:"Growth marketer focused on content, SEO and acquisition experiments."},
    {title:"Kabir Jain",company:"Video Editor",location:"Pune",type:"Remote",category:"Content",exp:"2-5",pay:"Available",tags:["Premiere","CapCut","Reels"],description:"Video editor specialising in short-form social content."},
    {title:"Zoya Khan",company:"B2B Sales",location:"Hyderabad",type:"Hybrid",category:"Sales",exp:"5+",pay:"Available",tags:["SaaS","Outbound","CRM"],description:"B2B sales specialist experienced in outbound and SaaS pipelines."}
  ],
  companies: [
    {title:"Nova Labs",company:"Technology",location:"Bengaluru",type:"Remote",category:"Technology",exp:"",pay:"18 open roles",tags:["Software","SaaS","Hiring"],description:"Software company hiring across engineering and product."},
    {title:"Orbit Commerce",company:"Retail Technology",location:"Mumbai",type:"Hybrid",category:"Technology",exp:"",pay:"11 open roles",tags:["Commerce","Design","Product"],description:"Commerce technology company building tools for modern retailers."},
    {title:"VibeWorks",company:"Consumer Brand",location:"Delhi",type:"On-site",category:"Marketing",exp:"",pay:"7 open roles",tags:["Marketing","Content","Growth"],description:"Consumer brand with a focus on growth and digital content."},
    {title:"Northstar Media",company:"Media & Content",location:"Pune",type:"Remote",category:"Content",exp:"",pay:"5 open roles",tags:["Video","Creative","Social"],description:"Media studio producing digital-first content."},
    {title:"Vertex Systems",company:"B2B SaaS",location:"Hyderabad",type:"Hybrid",category:"Sales",exp:"",pay:"9 open roles",tags:["SaaS","Sales","Support"],description:"B2B software company serving growing businesses."},
    {title:"ForgePay",company:"Fintech",location:"Bengaluru",type:"Remote",category:"Technology",exp:"",pay:"13 open roles",tags:["Fintech","Engineering","Product"],description:"Fintech company building modern payment products."}
  ]
};

let mode = "jobs";
const $ = id => document.getElementById(id);
const results = $("results");
const resultCount = $("resultCount");
const backdrop = $("modalBackdrop");
let modalMode = null;

backdrop.hidden = true;
backdrop.style.display = "none";

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
    const hay = [item.title,item.company,item.location,item.type,item.category,item.description,...item.tags].join(" ").toLowerCase();
    return (!f.q || hay.includes(f.q))
      && (!f.location || item.location === f.location)
      && (!f.category || item.category === f.category)
      && (!f.exp || item.exp === f.exp)
      && (!f.work.length || f.work.includes(item.type));
  });
}

function render() {
  const filtered = getVisibleItems();
  resultCount.textContent = "Showing " + filtered.length + " result" + (filtered.length === 1 ? "" : "s");
  results.innerHTML = filtered.map((item, index) => {
    const action = mode === "jobs" ? "View job" : mode === "talent" ? "View profile" : "View company";
    return '<article class="result-card"><div class="result-main">' +
      '<div class="result-top"><span>' + item.company + '</span><span>•</span><span>' + item.location + '</span><span>•</span><span>' + item.type + '</span></div>' +
      '<div class="result-title">' + item.title + '</div><div class="result-meta">' + (mode === "companies" ? "Company profile" : item.category) + '</div>' +
      '<div class="tag-row">' + item.tags.map(t => '<span class="tag">' + t + '</span>').join("") + '</div>' +
      '</div><div class="result-side"><div class="result-pay">' + item.pay + '</div>' +
      '<button class="apply-btn" data-result-index="' + index + '" data-result-action="' + action + '">' + action + '</button></div></article>';
  }).join("") || '<div class="result-card"><div><div class="result-title">No matches yet.</div><div class="result-meta">Try a broader keyword or clear a filter.</div></div></div>';
}

function closeModal() {
  backdrop.hidden = true;
  backdrop.style.display = "none";
  modalMode = null;
}

function setModal(title, text, formHtml) {
  $("modalTitle").textContent = title;
  $("modalText").textContent = text;
  const form = $("signupForm");
  form.innerHTML = formHtml || "";
  backdrop.hidden = false;
  backdrop.style.display = "grid";
}

function signupFormHtml() {
  return '<div class="profile-picker">' +
    '<div class="avatar-preview" id="avatarPreview">+</div>' +
    '<div><label class="file-label">Profile picture<input id="profilePicture" name="profile_picture" type="file" accept="image/*"></label><div class="field-help">Optional • PNG/JPG/WebP • max 5 MB • kept on this device for now</div></div>' +
    '</div>' +
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
    '<div class="signup-disclaimer"><strong>Important:</strong> CinderBurn is a marketplace connecting users. Verify identities, offers and arrangements independently. CinderBurn does not guarantee a user, employer, job, payment or outcome, and is not responsible for losses or harm caused by false information, misrepresentation, scams or users\' actions, except where applicable law provides otherwise. See our <a href="verification.html" target="_blank" rel="noopener">Verification & Trust</a> guidance.</div>' +
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

function showSignup() {
  modalMode = "signup";
  setModal("Create your CinderBurn account", "Use accurate information. Your email must be verified before you can sign in.", signupFormHtml());
  const dob = $("dobField");
  const age = $("agePreview");
  const today = new Date();
  dob.max = today.toISOString().slice(0,10);
  function updateAge() {
    if (!dob.value) { age.value = ""; return; }
    const birth = new Date(dob.value + "T00:00:00");
    let years = today.getFullYear() - birth.getFullYear();
    const diff = today.getMonth() - birth.getMonth();
    if (diff < 0 || (diff === 0 && today.getDate() < birth.getDate())) years--;
    age.value = String(years);
    age.style.color = years >= 18 ? "#9de6af" : "#ff8f8f";
  }
  dob.addEventListener("change", updateAge);

  const picker = $("profilePicture");
  picker.addEventListener("change", () => {
    const file = picker.files && picker.files[0];
    if (!file) { $("avatarPreview").textContent = "+"; return; }
    if (file.size > 5 * 1024 * 1024 || !file.type.startsWith("image/")) {
      picker.value = "";
      $("avatarPreview").textContent = "+";
      setFormStatus("formStatus", "Choose an image smaller than 5 MB.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => $("avatarPreview").innerHTML = '<img src="' + e.target.result + '" alt="">';
    reader.readAsDataURL(file);
  });
}

function setFormStatus(id, message, bad) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("bad", Boolean(bad));
  el.classList.toggle("good", !bad);
}


let currentUser = null;

function avatarMarkup(user, large) {
  const fallback = String(user?.displayName || user?.name || "?").trim().slice(0,1).toUpperCase() || "?";
  const localPicture = (() => {
    try { return localStorage.getItem("cinderburn_profile_picture"); } catch { return null; }
  })();
  const src = user?.avatarUrl || localPicture;
  const className = large ? "profile-avatar large" : "profile-avatar";
  return src
    ? '<div class="' + className + '"><img src="' + src + '" alt=""></div>'
    : '<div class="' + className + '">' + fallback + '</div>';
}

function renderAuthActions() {
  const host = $("authActions");
  if (!host) return;
  if (!currentUser) {
    host.innerHTML = '<button class="btn btn-ghost" data-modal="signin">Sign in</button>' +
      '<button class="btn btn-primary" data-modal="signup">Join CinderBurn</button>';
    bindAuthButtons();
    return;
  }
  host.innerHTML =
    '<button class="account-chip" id="accountButton" type="button">' +
      avatarMarkup(currentUser, false) +
      '<span class="account-name">' + (currentUser.displayName || currentUser.name) + '</span>' +
    '</button>';
  $("accountButton").addEventListener("click", showProfile);
}

function bindAuthButtons() {
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.modal === "signup") showSignup();
      else {
        modalMode = "signin";
        setModal("Welcome back", "Sign in with your verified CinderBurn email.", loginFormHtml());
      }
    };
  });
}

function profileFormHtml() {
  return '<div class="profile-account-card">' +
    avatarMarkup(currentUser, true) +
    '<div><div class="profile-name">' + (currentUser.displayName || currentUser.name) + '</div>' +
    '<div class="profile-email">' + currentUser.email + '</div></div></div>' +
    '<div class="profile-grid">' +
      '<div><span>Name</span><strong>' + (currentUser.name || "—") + '</strong></div>' +
      '<div><span>City</span><strong>' + (currentUser.city || "Not added") + '</strong></div>' +
      '<div><span>Country</span><strong>' + (currentUser.country || "IN") + '</strong></div>' +
      '<div><span>Status</span><strong>Verified account</strong></div>' +
    '</div>' +
    '<button type="button" class="btn btn-secondary" id="signOutButton">Sign out</button>';
}


function postJobFormHtml() {
  return '<input required id="jobTitle" type="text" maxlength="120" placeholder="Job title">' +
    '<input required id="companyName" type="text" maxlength="100" placeholder="Company name">' +
    '<input id="jobLocation" type="text" maxlength="100" placeholder="Location (e.g. Mumbai or Remote)">' +
    '<select required id="jobWorkType"><option value="">Work type</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select>' +
    '<select required id="jobCategory"><option value="">Category</option><option>Technology</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Content</option></select>' +
    '<div class="form-grid-two"><input id="salaryMin" type="number" min="0" placeholder="Minimum salary (₹)"><input id="salaryMax" type="number" min="0" placeholder="Maximum salary (₹)"></div>' +
    '<textarea required id="jobDescription" maxlength="4000" rows="6" placeholder="Describe the role, responsibilities and what you are looking for."></textarea>' +
    '<button class="btn btn-primary" type="submit">Publish job</button>' +
    '<div class="form-status" id="formStatus" aria-live="polite"></div>';
}

function showPostJob() {
  modalMode = "post-job";
  setModal("Post a job", "Publish a role directly from your CinderBurn account.", postJobFormHtml());
}

async function submitPostJob(form) {
  const payload = {
    title: $("jobTitle").value.trim(),
    company: $("companyName").value.trim(),
    location: $("jobLocation").value.trim(),
    workType: $("jobWorkType").value,
    category: $("jobCategory").value,
    salaryMin: $("salaryMin").value ? Number($("salaryMin").value) : null,
    salaryMax: $("salaryMax").value ? Number($("salaryMax").value) : null,
    description: $("jobDescription").value.trim()
  };
  setFormStatus("formStatus", "Publishing job…");
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
    showInfo("Job published", body.message || "Your job is now live on CinderBurn.", "Done");
  } catch {
    setFormStatus("formStatus", "Network error. Please try again.", true);
  }
}

function showProfile() {
  modalMode = "profile";
  setModal("Your CinderBurn profile", "This is the account currently connected to this browser.", profileFormHtml());
  $("signOutButton").addEventListener("click", signOut);
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
}

async function signOut() {
  try {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
  } catch {}
  currentUser = null;
  try {
    localStorage.removeItem("cinderburn_user");
    localStorage.removeItem("cinderburn_profile_picture");
  } catch {}
  closeModal();
  renderAuthActions();
}

function showInfo(title, text, actionText) {
  setModal(title, text, '<button type="button" class="btn btn-primary" id="modalDone">' + (actionText || "Continue") + '</button>');
  $("modalDone").addEventListener("click", closeModal);
}

async function submitSignup(form) {
  const fd = new FormData(form);
  setFormStatus("formStatus", "Creating your account…");
  try {
    const response = await fetch("/api/signup", { method: "POST", body: fd, credentials: "same-origin" });
    const body = await response.json();
    if (!response.ok) {
      setFormStatus("formStatus", body.error || "Unable to create your account.", true);
      return;
    }
    const picture = $("profilePicture")?.files?.[0];
    if (picture) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try { localStorage.setItem("cinderburn_profile_picture", String(e.target.result || "")); } catch {}
      };
      reader.readAsDataURL(picture);
    }
    showInfo("Check your email", body.message + " The message will come from cinderburn@cinderburn.dewify.shop.");
  } catch {
    setFormStatus("formStatus", "Network error. Please try again.", true);
  }
}

async function submitLogin(form) {
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  setFormStatus("formStatus", "Signing you in…");
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email, password})
    });
    const body = await response.json();
    if (!response.ok) {
      setFormStatus("formStatus", body.error || "Unable to sign in.", true);
      return;
    }
    currentUser = body.user;
    try { localStorage.setItem("cinderburn_user", JSON.stringify(body.user)); } catch {}
    renderAuthActions();
    showInfo("You're signed in", "Welcome back, " + body.user.displayName + ". Your profile is now active on this device.", "View profile");
    $("modalDone").onclick = () => { closeModal(); showProfile(); };
  } catch {
    setFormStatus("formStatus", "Network error. Please try again.", true);
  }
}

document.querySelectorAll(".seg").forEach(btn => btn.addEventListener("click", () => {
  mode = btn.dataset.mode;
  document.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b === btn));
  render();
loadSession();
}));

document.querySelectorAll(".search-chips button").forEach(btn => btn.addEventListener("click", () => {
  $("heroSearch").value = btn.dataset.query;
  $("marketSearch").value = btn.dataset.query;
  $("jobs").scrollIntoView({behavior:"smooth"});
  render();
}));

$("heroSearchBtn").addEventListener("click", () => {
  $("marketSearch").value = $("heroSearch").value;
  $("jobs").scrollIntoView({behavior:"smooth"});
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
  const target = btn.dataset.tabTarget;
  mode = target === "talent" ? "talent" : "jobs";
  document.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  $(target).scrollIntoView({behavior:"smooth"});
  render();
}));

bindAuthButtons();

$("postJobButton").addEventListener("click", () => {
  if (!currentUser) {
    modalMode = "signin";
    setModal("Sign in to post a job", "Create or sign in to your CinderBurn account before posting a role.", loginFormHtml());
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
});

document.addEventListener("click", e => {
  const button = e.target.closest("[data-result-action]");
  if (!button) return;
  const item = getVisibleItems()[Number(button.dataset.resultIndex)];
  if (!item) return;
  const action = button.dataset.resultAction;
  setModal(item.title, item.description + " " + item.location + " · " + item.type + " · " + item.pay,
    '<div class="tag-row">' + item.tags.map(t => '<span class="tag">' + t + '</span>').join("") + '</div>' +
    '<button type="button" class="btn btn-primary" id="resultAction">' +
    (action === "View job" ? "Apply for this job" : action === "View profile" ? "Contact this person" : "View open roles") +
    '</button>');
  $("resultAction").addEventListener("click", () => showInfo("Demo action", "This action is ready for the real CinderBurn backend. Your account authentication is now separate from the demo marketplace."));
});

render();
