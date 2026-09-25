const data = {
  jobs: [
    {title:'Frontend Developer', company:'Nova Labs', location:'Bengaluru', type:'Remote', category:'Technology', exp:'2-5', pay:'₹8–14 LPA', tags:['React','JavaScript','CSS'], description:'Build and improve customer-facing web products with a modern frontend stack.'},
    {title:'Product Designer', company:'Orbit Commerce', location:'Mumbai', type:'Hybrid', category:'Design', exp:'2-5', pay:'₹7–12 LPA', tags:['Figma','UX','Research'], description:'Own product flows, prototypes and design systems for a growing commerce product.'},
    {title:'Growth Marketing Associate', company:'VibeWorks', location:'Delhi', type:'On-site', category:'Marketing', exp:'0-2', pay:'₹4–7 LPA', tags:['SEO','Content','Growth'], description:'Run experiments across content, search and acquisition channels.'},
    {title:'Video Editor', company:'Northstar Media', location:'Pune', type:'Remote', category:'Content', exp:'2-5', pay:'₹35k–60k/mo', tags:['Premiere','Shorts','Reels'], description:'Edit short-form and long-form content for social and creator brands.'},
    {title:'Sales Development Rep', company:'Vertex Systems', location:'Hyderabad', type:'Hybrid', category:'Sales', exp:'0-2', pay:'₹4–8 LPA', tags:['B2B','SaaS','Sales'], description:'Build qualified B2B conversations and help grow the sales pipeline.'},
    {title:'React Native Engineer', company:'ForgePay', location:'Bengaluru', type:'Remote', category:'Technology', exp:'5+', pay:'₹18–26 LPA', tags:['React Native','TypeScript','APIs'], description:'Ship reliable mobile experiences for a fast-moving fintech product.'}
  ],
  talent: [
    {title:'Aarav Kulkarni', company:'Frontend Developer', location:'Pune', type:'Remote', category:'Technology', exp:'2-5', pay:'Available', tags:['React','JavaScript','Next.js'], description:'Frontend developer focused on fast, accessible web products.'},
    {title:'Meera Shah', company:'Product Designer', location:'Mumbai', type:'Hybrid', category:'Design', exp:'2-5', pay:'Available', tags:['Figma','UX','Design Systems'], description:'Product designer specialising in clear UX and scalable design systems.'},
    {title:'Rohan Verma', company:'React Engineer', location:'Bengaluru', type:'Remote', category:'Technology', exp:'5+', pay:'Available', tags:['React','TypeScript','Node'], description:'Senior React engineer building production web applications.'},
    {title:'Ishita Rao', company:'Growth Marketer', location:'Delhi', type:'Remote', category:'Marketing', exp:'0-2', pay:'Available', tags:['SEO','Content','Ads'], description:'Growth marketer focused on content, SEO and acquisition experiments.'},
    {title:'Kabir Jain', company:'Video Editor', location:'Pune', type:'Remote', category:'Content', exp:'2-5', pay:'Available', tags:['Premiere','CapCut','Reels'], description:'Video editor specialising in short-form social content.'},
    {title:'Zoya Khan', company:'B2B Sales', location:'Hyderabad', type:'Hybrid', category:'Sales', exp:'5+', pay:'Available', tags:['SaaS','Outbound','CRM'], description:'B2B sales specialist experienced in outbound and SaaS pipelines.'}
  ],
  companies: [
    {title:'Nova Labs', company:'Technology', location:'Bengaluru', type:'Remote', category:'Technology', exp:'', pay:'18 open roles', tags:['Software','SaaS','Hiring'], description:'Software company hiring across engineering and product.'},
    {title:'Orbit Commerce', company:'Retail Technology', location:'Mumbai', type:'Hybrid', category:'Technology', exp:'', pay:'11 open roles', tags:['Commerce','Design','Product'], description:'Commerce technology company building tools for modern retailers.'},
    {title:'VibeWorks', company:'Consumer Brand', location:'Delhi', type:'On-site', category:'Marketing', exp:'', pay:'7 open roles', tags:['Marketing','Content','Growth'], description:'Consumer brand with a focus on growth and digital content.'},
    {title:'Northstar Media', company:'Media & Content', location:'Pune', type:'Remote', category:'Content', exp:'', pay:'5 open roles', tags:['Video','Creative','Social'], description:'Media studio producing digital-first content.'},
    {title:'Vertex Systems', company:'B2B SaaS', location:'Hyderabad', type:'Hybrid', category:'Sales', exp:'', pay:'9 open roles', tags:['SaaS','Sales','Support'], description:'B2B software company serving growing businesses.'},
    {title:'ForgePay', company:'Fintech', location:'Bengaluru', type:'Remote', category:'Technology', exp:'', pay:'13 open roles', tags:['Fintech','Engineering','Product'], description:'Fintech company building modern payment products.'}
  ]
};

let mode = 'jobs';
const $ = id => document.getElementById(id);
const results = $('results');
const resultCount = $('resultCount');
const backdrop = $('modalBackdrop');
const modalForm = $('signupForm');

backdrop.hidden = true;
backdrop.style.display = 'none';

function getFilters(){
  return {
    q: $('marketSearch').value.trim().toLowerCase(),
    location: $('locationFilter').value,
    category: $('categoryFilter').value,
    exp: $('experienceFilter').value,
    work: [...document.querySelectorAll('[data-filter="work"]:checked')].map(x => x.value)
  };
}

function getVisibleItems(){
  const f = getFilters();
  return data[mode].filter(item => {
    const hay = [item.title,item.company,item.location,item.type,item.category,item.description,...item.tags].join(' ').toLowerCase();
    return (!f.q || hay.includes(f.q)) && (!f.location || item.location === f.location) && (!f.category || item.category === f.category) && (!f.exp || item.exp === f.exp) && (!f.work.length || f.work.includes(item.type));
  });
}

function render(){
  const filtered = getVisibleItems();
  resultCount.textContent = `Showing ${filtered.length} result${filtered.length===1?'':'s'}`;
  results.innerHTML = filtered.map((item, index) => {
    const action = mode === 'jobs' ? 'View job' : mode === 'talent' ? 'View profile' : 'View company';
    return `<article class="result-card"><div class="result-main"><div class="result-top"><span>${item.company}</span><span>•</span><span>${item.location}</span><span>•</span><span>${item.type}</span></div><div class="result-title">${item.title}</div><div class="result-meta">${mode === 'companies' ? 'Company profile' : item.category}</div><div class="tag-row">${item.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div></div><div class="result-side"><div class="result-pay">${item.pay}</div><button class="apply-btn" data-result-index="${index}" data-demo-action="${action}">${action}</button></div></article>`;
  }).join('') || `<div class="result-card"><div><div class="result-title">No matches yet.</div><div class="result-meta">Try a broader keyword or clear a filter.</div></div></div>`;
}

document.querySelectorAll('.seg').forEach(btn => btn.addEventListener('click', () => {
  mode = btn.dataset.mode;
  document.querySelectorAll('.seg').forEach(b => b.classList.toggle('active', b === btn));
  render();
}));

document.querySelectorAll('.search-chips button').forEach(btn => btn.addEventListener('click', () => {
  $('heroSearch').value = btn.dataset.query;
  $('marketSearch').value = btn.dataset.query;
  $('jobs').scrollIntoView({behavior:'smooth'});
  render();
}));

$('heroSearchBtn').addEventListener('click', () => {
  $('marketSearch').value = $('heroSearch').value;
  $('jobs').scrollIntoView({behavior:'smooth'});
  render();
});
$('heroSearch').addEventListener('keydown', e => { if(e.key === 'Enter') $('heroSearchBtn').click(); });
$('marketSearchBtn').addEventListener('click', render);
$('marketSearch').addEventListener('keydown', e => { if(e.key === 'Enter') render(); });
['locationFilter','categoryFilter','experienceFilter'].forEach(id => $(id).addEventListener('change', render));
document.querySelectorAll('[data-filter="work"]').forEach(el => el.addEventListener('change', render));
$('clearFilters').addEventListener('click', () => {
  $('marketSearch').value=''; $('locationFilter').value=''; $('categoryFilter').value=''; $('experienceFilter').value='';
  document.querySelectorAll('[data-filter="work"]').forEach(el => el.checked=false);
  render();
});

document.querySelectorAll('[data-tab-target]').forEach(btn => btn.addEventListener('click', () => {
  const target = btn.dataset.tabTarget;
  mode = target === 'talent' ? 'talent' : 'jobs';
  document.querySelectorAll('.seg').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  $(target).scrollIntoView({behavior:'smooth'});
  render();
}));

function closeModal(){
  backdrop.hidden = true;
  backdrop.style.display = 'none';
  modalForm.innerHTML = '';
}

function showMessage(title, text, buttonText='Close'){
  $('modalTitle').textContent = title;
  $('modalText').textContent = text;
  modalForm.innerHTML = `<button type="button" class="btn btn-primary" id="modalDone">${buttonText}</button>`;
  $('modalDone').addEventListener('click', closeModal);
}

function ageFromDob(dob){
  const birth = new Date(`${dob}T00:00:00`);
  if(Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if(month < 0 || (month === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function profileForm(kind){
  if(kind === 'signin') return `<div class="form-section"><div class="form-label">Account</div><input required type="email" id="accountEmail" autocomplete="email" placeholder="Email address" /><input required type="password" id="accountPassword" autocomplete="current-password" placeholder="Password" /><label class="check-row"><input type="checkbox" id="rememberMe" /> Remember me on this device</label></div><button class="btn btn-primary" type="submit">Sign in</button><div class="form-footnote">By signing in, you agree to follow CinderBurn's rules and use the platform honestly.</div>`;
  return `<div class="profile-photo-block"><div class="profile-preview" id="profilePreview">+</div><div><label class="upload-btn" for="profilePhoto">Add profile picture</label><input id="profilePhoto" type="file" accept="image/png,image/jpeg,image/webp" hidden /><div class="form-footnote">Use a photo you have the right to use. Max 2 MB in this demo.</div></div></div><div class="form-section"><div class="form-label">Identity</div><input required type="text" id="fullName" autocomplete="name" placeholder="Full name" /><input required type="text" id="displayName" placeholder="Display name" /><label class="field-label" for="dateOfBirth">Date of birth</label><input required type="date" id="dateOfBirth" max="${new Date().toISOString().slice(0,10)}" /><div class="age-note" id="ageNote">CinderBurn is currently 18+.</div></div><div class="form-section"><div class="form-label">Account</div><input required type="email" id="accountEmail" autocomplete="email" placeholder="Email address" /><input required type="password" id="accountPassword" autocomplete="new-password" minlength="8" placeholder="Password (8+ characters)" /><select required id="accountRole"><option value="">I want to…</option><option value="worker">Find work</option><option value="employer">Hire people</option><option value="both">Both</option></select></div><div class="form-section"><div class="form-label">Profile</div><input required type="text" id="profileLocation" placeholder="City, e.g. Bengaluru" /><input type="text" id="profileSkills" placeholder="Skills, separated by commas" /><textarea id="profileBio" maxlength="500" placeholder="Short bio — what do you do or what are you hiring for?"></textarea></div><label class="check-row required-check"><input required type="checkbox" id="truthConfirm" /> <span>I confirm that the information I provide is accurate and I will update it if it changes.</span></label><label class="check-row required-check"><input required type="checkbox" id="termsConfirm" /> <span>I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms of Service</a>, <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>, and <a href="safety.html" target="_blank" rel="noopener">Safety Rules</a>.</span></label><div class="legal-warning"><strong>Important:</strong> CinderBurn is a marketplace connecting users; it does not guarantee a job, hire, payment, identity, skill level, or outcome. False, misleading, impersonated, or fraudulent information may lead to removal of the account. Users are responsible for their own decisions, verification, communications, and transactions. CinderBurn is not responsible for losses, injuries, fraud, or disputes arising from a user's false information or interactions with another user, except where liability cannot lawfully be excluded.</div><button class="btn btn-primary" type="submit">Create CinderBurn account</button><div class="form-footnote">We will never ask you to share your password publicly. This prototype stores the demo profile locally; production authentication and secure file storage will be handled by the backend.</div>`;
}

function openModal(kind){
  $('modalTitle').textContent = kind === 'signin' ? 'Sign in to CinderBurn' : 'Create your CinderBurn profile';
  $('modalText').textContent = kind === 'signin' ? 'Use your account email and password.' : 'Build a real profile so employers and talent can understand who they are dealing with.';
  modalForm.innerHTML = profileForm(kind);
  backdrop.hidden = false;
  backdrop.style.display = 'grid';
  if(kind !== 'signin') bindSignupForm();
}

function bindSignupForm(){
  const photo = $('profilePhoto');
  photo.addEventListener('change', () => {
    const file = photo.files?.[0];
    if(!file) return;
    if(file.size > 2 * 1024 * 1024){ photo.value=''; showInlineError('Profile picture must be 2 MB or smaller.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      $('profilePreview').innerHTML = `<img src="${e.target.result}" alt="Profile preview" />`;
      $('profilePreview').dataset.image = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  $('dateOfBirth').addEventListener('change', () => {
    const age = ageFromDob($('dateOfBirth').value);
    $('ageNote').textContent = age === null ? 'Enter your date of birth.' : `Age: ${age}. CinderBurn is currently 18+.`;
    $('ageNote').classList.toggle('bad', age !== null && age < 18);
  });
}

function showInlineError(message){
  const old = $('formError');
  if(old) old.remove();
  const box = document.createElement('div');
  box.id='formError'; box.className='form-error'; box.textContent=message;
  modalForm.prepend(box);
}

document.querySelectorAll('[data-modal]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.modal)));
$('modalClose').addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if(e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

modalForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = $('accountEmail')?.value || '';
  if($('dateOfBirth')){
    const age = ageFromDob($('dateOfBirth').value);
    if(age === null || age < 18){ showInlineError('You must be 18 or older to create a CinderBurn account.'); return; }
    if(!$('truthConfirm').checked || !$('termsConfirm').checked){ showInlineError('Please confirm your information and accept the Terms, Privacy Policy, and Safety Rules.'); return; }
    const profile = {
      fullName: $('fullName').value.trim(), displayName: $('displayName').value.trim(), age,
      email, role: $('accountRole').value, location: $('profileLocation').value.trim(),
      skills: $('profileSkills').value.split(',').map(s=>s.trim()).filter(Boolean),
      bio: $('profileBio').value.trim(), photo: $('profilePreview')?.dataset.image || null,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('cinderburn_demo_profile', JSON.stringify(profile));
    localStorage.setItem('cinderburn_demo_user', email);
    showMessage('Profile created', `Welcome, ${profile.displayName}. Your demo profile is saved on this device. Production signup will send this data to the secure backend.`, 'Continue');
    return;
  }
  localStorage.setItem('cinderburn_demo_user', email);
  showMessage('Signed in', 'Your demo session is active on this device. Production authentication will be connected to the secure backend.', 'Continue');
});

function openResult(item, action){
  $('modalTitle').textContent = item.title;
  $('modalText').textContent = `${item.description} ${item.location} · ${item.type} · ${item.pay}`;
  modalForm.innerHTML = `<div class="tag-row">${item.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><button type="button" class="btn btn-primary" id="resultAction">${action === 'View job' ? 'Apply for this job' : action === 'View profile' ? 'Contact this person' : 'View open roles'}</button>`;
  backdrop.hidden = false;
  backdrop.style.display = 'grid';
  $('resultAction').addEventListener('click', () => showMessage('Action saved', `${action} is working in demo mode. The next version can send the application, message, or company request to the backend.`));
}

document.addEventListener('click', e => {
  const button = e.target.closest('[data-demo-action]');
  if(!button) return;
  const item = getVisibleItems()[Number(button.dataset.resultIndex)];
  if(item) openResult(item, button.dataset.demoAction);
});

function addLegalLinks(){
  const footer = document.querySelector('.footer');
  if(!footer || document.getElementById('legalLinks')) return;
  const links = document.createElement('div');
  links.id='legalLinks';
  links.className='legal-links';
  links.innerHTML='<a href="terms.html">Terms</a><a href="privacy.html">Privacy</a><a href="safety.html">Safety</a><a href="verification.html">Verification</a>';
  footer.appendChild(links);
}

addLegalLinks();
render();
