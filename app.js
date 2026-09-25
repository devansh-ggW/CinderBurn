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

function openModal(kind){
  $('modalTitle').textContent = kind === 'signin' ? 'Welcome back' : 'Join CinderBurn';
  $('modalText').textContent = kind === 'signin' ? 'Sign in to your CinderBurn account.' : 'Create your account and choose whether you are here to hire, get hired, or both.';
  modalForm.innerHTML = kind === 'signin'
    ? `<input required type="email" id="accountEmail" placeholder="Email address" /><input required type="password" id="accountPassword" placeholder="Password" /><button class="btn btn-primary" type="submit">Sign in</button>`
    : `<input required type="text" id="accountName" placeholder="Your name" /><input required type="email" id="accountEmail" placeholder="Email address" /><select required id="accountRole"><option value="">I want to…</option><option>Find work</option><option>Hire people</option><option>Both</option></select><button class="btn btn-primary" type="submit">Create account</button>`;
  backdrop.hidden = false;
  backdrop.style.display = 'grid';
}

document.querySelectorAll('[data-modal]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.modal)));
$('modalClose').addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if(e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

modalForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = $('accountEmail')?.value || '';
  localStorage.setItem('cinderburn_demo_user', email);
  showMessage('You are in.', 'Your CinderBurn demo session is saved locally on this device.', 'Continue');
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

render();
