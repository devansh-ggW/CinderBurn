const data = {
  jobs: [
    {title:'Frontend Developer', company:'Nova Labs', location:'Bengaluru', type:'Remote', category:'Technology', exp:'2-5', pay:'₹8–14 LPA', tags:['React','JavaScript','CSS']},
    {title:'Product Designer', company:'Orbit Commerce', location:'Mumbai', type:'Hybrid', category:'Design', exp:'2-5', pay:'₹7–12 LPA', tags:['Figma','UX','Research']},
    {title:'Growth Marketing Associate', company:'VibeWorks', location:'Delhi', type:'On-site', category:'Marketing', exp:'0-2', pay:'₹4–7 LPA', tags:['SEO','Content','Growth']},
    {title:'Video Editor', company:'Northstar Media', location:'Pune', type:'Remote', category:'Content', exp:'2-5', pay:'₹35k–60k/mo', tags:['Premiere','Shorts','Reels']},
    {title:'Sales Development Rep', company:'Vertex Systems', location:'Hyderabad', type:'Hybrid', category:'Sales', exp:'0-2', pay:'₹4–8 LPA', tags:['B2B','SaaS','Sales']},
    {title:'React Native Engineer', company:'ForgePay', location:'Bengaluru', type:'Remote', category:'Technology', exp:'5+', pay:'₹18–26 LPA', tags:['React Native','TypeScript','APIs']}
  ],
  talent: [
    {title:'Aarav Kulkarni', company:'Frontend Developer', location:'Pune', type:'Remote', category:'Technology', exp:'2-5', pay:'Available', tags:['React','JavaScript','Next.js']},
    {title:'Meera Shah', company:'Product Designer', location:'Mumbai', type:'Hybrid', category:'Design', exp:'2-5', pay:'Available', tags:['Figma','UX','Design Systems']},
    {title:'Rohan Verma', company:'React Engineer', location:'Bengaluru', type:'Remote', category:'Technology', exp:'5+', pay:'Available', tags:['React','TypeScript','Node']},
    {title:'Ishita Rao', company:'Growth Marketer', location:'Delhi', type:'Remote', category:'Marketing', exp:'0-2', pay:'Available', tags:['SEO','Content','Ads']},
    {title:'Kabir Jain', company:'Video Editor', location:'Pune', type:'Remote', category:'Content', exp:'2-5', pay:'Available', tags:['Premiere','CapCut','Reels']},
    {title:'Zoya Khan', company:'B2B Sales', location:'Hyderabad', type:'Hybrid', category:'Sales', exp:'5+', pay:'Available', tags:['SaaS','Outbound','CRM']}
  ],
  companies: [
    {title:'Nova Labs', company:'Technology', location:'Bengaluru', type:'Remote', category:'Technology', exp:'', pay:'18 open roles', tags:['Software','SaaS','Hiring']},
    {title:'Orbit Commerce', company:'Retail Technology', location:'Mumbai', type:'Hybrid', category:'Technology', exp:'', pay:'11 open roles', tags:['Commerce','Design','Product']},
    {title:'VibeWorks', company:'Consumer Brand', location:'Delhi', type:'On-site', category:'Marketing', exp:'', pay:'7 open roles', tags:['Marketing','Content','Growth']},
    {title:'Northstar Media', company:'Media & Content', location:'Pune', type:'Remote', category:'Content', exp:'', pay:'5 open roles', tags:['Video','Creative','Social']},
    {title:'Vertex Systems', company:'B2B SaaS', location:'Hyderabad', type:'Hybrid', category:'Sales', exp:'', pay:'9 open roles', tags:['SaaS','Sales','Support']},
    {title:'ForgePay', company:'Fintech', location:'Bengaluru', type:'Remote', category:'Technology', exp:'', pay:'13 open roles', tags:['Fintech','Engineering','Product']}
  ]
};

let mode = 'jobs';
const results = document.getElementById('results');
const resultCount = document.getElementById('resultCount');

function getFilters(){
  return {
    q: document.getElementById('marketSearch').value.trim().toLowerCase(),
    location: document.getElementById('locationFilter').value,
    category: document.getElementById('categoryFilter').value,
    exp: document.getElementById('experienceFilter').value,
    work: [...document.querySelectorAll('[data-filter="work"]:checked')].map(x => x.value)
  };
}

function render(){
  const f = getFilters();
  const filtered = data[mode].filter(item => {
    const hay = [item.title,item.company,item.location,item.type,item.category,...item.tags].join(' ').toLowerCase();
    return (!f.q || hay.includes(f.q)) && (!f.location || item.location === f.location) && (!f.category || item.category === f.category) && (!f.exp || item.exp === f.exp) && (!f.work.length || f.work.includes(item.type));
  });
  resultCount.textContent = `Showing ${filtered.length} result${filtered.length===1?'':'s'}`;
  results.innerHTML = filtered.map((item, idx) => {
    const action = mode === 'jobs' ? 'View job' : mode === 'talent' ? 'View profile' : 'View company';
    return `<article class="result-card">
      <div class="result-main">
        <div class="result-top"><span>${item.company}</span><span>•</span><span>${item.location}</span><span>•</span><span>${item.type}</span></div>
        <div class="result-title">${item.title}</div>
        <div class="result-meta">${mode === 'companies' ? 'Company profile' : item.category}</div>
        <div class="tag-row">${item.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      </div>
      <div class="result-side"><div class="result-pay">${item.pay}</div><button class="apply-btn" data-demo-action="${action}">${action}</button></div>
    </article>`;
  }).join('') || `<div class="result-card"><div><div class="result-title">No matches yet.</div><div class="result-meta">Try a broader keyword or clear a filter.</div></div></div>`;
}

document.querySelectorAll('.seg').forEach(btn => btn.addEventListener('click', () => {
  mode = btn.dataset.mode;
  document.querySelectorAll('.seg').forEach(b => b.classList.toggle('active', b === btn));
  render();
}));

document.querySelectorAll('.search-chips button').forEach(btn => btn.addEventListener('click', () => {
  document.getElementById('heroSearch').value = btn.dataset.query;
  document.getElementById('marketSearch').value = btn.dataset.query;
  document.getElementById('jobs').scrollIntoView({behavior:'smooth'});
  render();
}));

document.getElementById('heroSearchBtn').addEventListener('click', () => {
  document.getElementById('marketSearch').value = document.getElementById('heroSearch').value;
  document.getElementById('jobs').scrollIntoView({behavior:'smooth'});
  render();
});

document.getElementById('marketSearchBtn').addEventListener('click', render);
document.getElementById('marketSearch').addEventListener('keydown', e => { if(e.key==='Enter') render(); });
['locationFilter','categoryFilter','experienceFilter'].forEach(id => document.getElementById(id).addEventListener('change', render));
document.querySelectorAll('[data-filter="work"]').forEach(el => el.addEventListener('change', render));
document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('marketSearch').value='';
  document.getElementById('locationFilter').value='';
  document.getElementById('categoryFilter').value='';
  document.getElementById('experienceFilter').value='';
  document.querySelectorAll('[data-filter="work"]').forEach(el => el.checked=false);
  render();
});

document.querySelectorAll('[data-tab-target]').forEach(btn => btn.addEventListener('click', () => {
  const target = btn.dataset.tabTarget;
  mode = target === 'talent' ? 'companies' : 'jobs';
  document.querySelectorAll('.seg').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById(target).scrollIntoView({behavior:'smooth'});
  render();
}));

const backdrop = document.getElementById('modalBackdrop');
function openModal(kind){
  const title = document.getElementById('modalTitle');
  const text = document.getElementById('modalText');
  if(kind==='signin'){ title.textContent='Welcome back'; text.textContent='Sign in to manage jobs, applications and conversations.'; }
  else { title.textContent='Join CinderBurn'; text.textContent='Create your account and choose whether you are here to hire, get hired, or both.'; }
  backdrop.hidden=false;
}

document.querySelectorAll('[data-modal]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.modal)));
document.getElementById('modalClose').addEventListener('click',()=>backdrop.hidden=true);
backdrop.addEventListener('click',e=>{if(e.target===backdrop)backdrop.hidden=true});
document.getElementById('signupForm').addEventListener('submit',e=>{e.preventDefault();document.getElementById('modalText').textContent='Demo submitted. Next step: wire this form to the Cloudflare Worker and D1.';e.target.reset();});

document.addEventListener('click', e=>{ if(e.target.matches('[data-demo-action]')) alert(`${e.target.dataset.demoAction} demo — connect this button to the Cloudflare API.`); });

render();
