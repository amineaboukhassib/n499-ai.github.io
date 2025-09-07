
// ===== Pre-flight session reset (runs before anything) =====
(function preflightReset(){
  try{
    var onceKey='crm_pre_reset_done';
    var force = (location.search||'').indexOf('reset=1')>-1 || (location.hash||'').indexOf('reset')>-1;
    if(force){ try{ sessionStorage.removeItem(onceKey); }catch(_){ } }
    var done=false; try{ done = !!sessionStorage.getItem(onceKey); }catch(_){ }
    if(!done){
      try{ sessionStorage.setItem(onceKey,'1'); }catch(_){ }
      try{ localStorage.removeItem('schoolsCRM_v25'); }catch(_){}
      try{ sessionStorage.removeItem('schoolsCRM_v25'); }catch(_){}
      try{ localStorage.removeItem('schoolsCRM_v25_backup'); }catch(_){}
      // Try to delete any IndexedDB databases that look like ours
      var postReload = function(){ setTimeout(function(){ location.reload(); }, 10); };
      try{
        if (window.indexedDB && indexedDB.databases){
          indexedDB.databases().then(function(dbs){
            try{
              dbs.forEach(function(db){
                if(db && db.name && /schools[-_]?crm/i.test(db.name)){ try{ indexedDB.deleteDatabase(db.name); }catch(__){} }
              });
            }catch(__){}
            postReload();
          });
          return;
        }
      }catch(__){}
      postReload();
    }
  }catch(e){ /* ignore */ }
})();
// ===== End pre-flight =====


// Hard reset of session: clears storage across APIs and reloads
function hardResetSession(){
  try{ localStorage.removeItem('schoolsCRM_v25'); }catch(e){}
  try{ sessionStorage.removeItem('schoolsCRM_v25'); }catch(e){}
  try{ localStorage.removeItem('schoolsCRM_v25_backup'); }catch(e){}
  try{
    if (window.indexedDB && indexedDB.databases){
      indexedDB.databases().then(dbs=>{
        try{
          dbs.forEach(db=>{ if(db && db.name && /schools[-_]?crm/i.test(db.name)) indexedDB.deleteDatabase(db.name); });
        }catch(_){}
      });
    }
  }catch(_){}
  try{ clearAuth(); }catch(_){}
  try{ Store.remove('schoolsCRM_v25'); }catch(_){}
  try{ localStorage.setItem('schoolsCRM_v25', JSON.stringify({auth:null})); }catch(_){}
  alert((state.lang==='ar'?'تم مسح الجلسة وسيُعاد تحميل الصفحة':'Session cleared. The page will reload.'));
  setTimeout(()=> location.reload(), 50);
}
// ===== Utilities & State =====

// Safe storage (works even if localStorage is blocked)
const _memStore = {};
const Store = {
  get(k){ try{ return localStorage.getItem(k); } catch(e){ return _memStore[k]||null; } },
  set(k,v){ try{ localStorage.setItem(k,v); } catch(e){ _memStore[k]=v; } },
  remove(k){ try{ localStorage.removeItem(k); } catch(e){ delete _memStore[k]; } }
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
function uid(){ return Math.random().toString(36).slice(2,9); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function openDialog(d){ d.showModal(); }
function closeDialog(d){ d.close(); }
function debounce(fn, delay=60){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), delay); }; }

// Roles & permissions
const PERMS = {
  admin: {schools:{create:true,edit:true,delete:true}, visits:{create:true,edit:true,delete:true}},
  coord: {schools:{create:true,edit:true,delete:false}, visits:{create:true,edit:true,delete:false}},
  vol:   {schools:{create:false,edit:false,delete:false}, visits:{create:false,edit:true,delete:false}}
};
function can(entity, action){ const role = state.role || 'admin'; return !!(PERMS[role] && PERMS[role][entity] && PERMS[role][entity][action]); }
function actionBtns(entity, id){
  let html='';
  if (can(entity,'edit'))  html+=`<button class="btn" data-act="edit" data-id="${id}">${t('common.edit')}</button>`;
  if (can(entity,'delete'))html+=` <button class="btn danger" data-act="del" data-id="${id}">${t('common.delete')}</button>`;
  return html;
}

// i18n
const I18N = {
  ar:{
    common:{save:'حفظ', cancel:'إلغاء', edit:'تعديل', delete:'حذف'},
    nav:{dashboard:'لوحة التحكم', schools:'المدارس', visits:'الزيارات', communication:'التواصل', reports:'التقارير', settings:'الإعدادات'},
    fields:{school:'المدرسة', type:'النوع', city:'المدينة', avg:'متوسط الرسوم', address:'العنوان', phone:'الهاتف', tags:'وسوم', pipeline:'المرحلة', relation:'التوافق', notes:'ملاحظات'},
    table:{school:'المدرسة', city:'المدينة', type:'النوع', pipeline:'المرحلة', relation:'التوافق', avg:'الرسوم', tags:'وسوم', actions:'إجراءات'},
    type:{all:'الكل', public:'حكومية', private:'خاصة'},
    pipeline:{new:'جديد', first:'تواصل أول', follow:'متابعة', pending:'قيد الانتظار', appointment:'موعد', agreed:'تم الاتفاق'},
    visits:{add:'+ زيارة', purpose:'الغرض', school:'المدرسة', status:{all:'الكل', done:'تمت الزيارة', confirmed:'تم تأكيد الزيارة', cancelled:'تم الإلغاء', postponed:'تم التأجيل', approved:'تم الموافقة'}},
    dashboard:{totalSchools:'عدد المدارس', totalAgreed:'تم الاتفاق', avgRel:'متوسط التوافق'},
    reports:{overview:'نظرة عامة', avgByStage:'متوسط الأيام للوصول'}
  },
  en:{
    common:{save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete'},
    nav:{dashboard:'Dashboard', schools:'Schools', visits:'Visits', communication:'Communication', reports:'Reports', settings:'Settings'},
    fields:{school:'School', type:'Type', city:'City', avg:'Avg. Tuition', address:'Address', phone:'Phone', tags:'Tags', pipeline:'Stage', relation:'Relationship', notes:'Notes'},
    table:{school:'School', city:'City', type:'Type', pipeline:'Stage', relation:'Relation', avg:'Avg', tags:'Tags', actions:'Actions'},
    type:{all:'All', public:'Public', private:'Private'},
    pipeline:{new:'New', first:'First Contact', follow:'Following up', pending:'Pending', appointment:'Get appointment', agreed:'Agreed'},
    visits:{add:'+ Visit', purpose:'Purpose', school:'School', status:{all:'All', done:'Done', confirmed:'Confirmed', cancelled:'Cancelled', postponed:'Postponed', approved:'Approved'}},
    dashboard:{totalSchools:'Total schools', totalAgreed:'Agreed', avgRel:'Avg. relationship'},
    reports:{overview:'Overview', avgByStage:'Avg. days to reach'}
  },
  fr:{
    common:{save:'Enregistrer', cancel:'Annuler', edit:'Modifier', delete:'Supprimer'},
    nav:{dashboard:'Tableau', schools:'Écoles', visits:'Visites', communication:'Communication', reports:'Rapports', settings:'Paramètres'},
    fields:{school:'École', type:'Type', city:'Ville', avg:'Frais moyens', address:'Adresse', phone:'Téléphone', tags:'Tags', pipeline:'Étape', relation:'Relation', notes:'Notes'},
    table:{school:'École', city:'Ville', type:'Type', pipeline:'Étape', relation:'Relation', avg:'Moy.', tags:'Tags', actions:'Actions'},
    type:{all:'Tous', public:'Publique', private:'Privée'},
    pipeline:{new:'Nouveau', first:'Premier contact', follow:'Relance', pending:'En attente', appointment:'Rendez-vous', agreed:'Acceptée'},
    visits:{add:'+ Visite', purpose:'Objet', school:'École', status:{all:'Tous', done:'Effectuée', confirmed:'Confirmée', cancelled:'Annulée', postponed:'Reportée', approved:'Approuvée'}},
    dashboard:{totalSchools:'Écoles', totalAgreed:'Acceptées', avgRel:'Moy. relation'},
    reports:{overview:'Aperçu', avgByStage:'Jours moyens par étape'}
  }
};
function t(path){
  const parts = path.split('.'); let o = I18N[state.lang] || I18N.ar;
  for(const p of parts){ o = o?.[p]; }
  return o ?? path;
}
function pipeLabel(k){ return t('pipeline.'+k); }
function typeLabel(k){ return t('type.'+k) || k; }
function pipeDot(k){ return 'stage-'+(k||'new'); }

// Smart filtering
function normalizeText(s){
  if (!s) return ''; let t = (''+s).toLowerCase();
  t = t.replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640]/g, '');
  t = t.replace(/[\u0622\u0623\u0625]/g, '\u0627'); t = t.replace(/\u0629/g, '\u0647'); t = t.replace(/\u0649/g, '\u064A');
  return t;
}
function parseSmartQuery(q){
  const res = {terms:[], fields:[], range:[]};
  if (!q) return res;
  const parts = q.trim().split(/\s+/);
  for (const p of parts){
    let m = p.match(/^(rel|relationship|tuition|avg|avgTuition)\s*(<=|>=|=|<|>)\s*(\d+)$/i);
    if (m){ res.range.push({field:m[1].toLowerCase(), op:m[2], value:Number(m[3])}); continue; }
    m = p.match(/^(name|school|city|type|pipeline|stage|tag|tags):(.+)$/i);
    if (m){ res.fields.push({field:m[1].toLowerCase(), value:m[2]}); continue; }
    res.terms.push(p);
  }
  return res;
}
function scoreSchool(s, query){
  if (!query || (!query.terms.length && !query.fields.length && !query.range.length)) return 1;
  const name = normalizeText(s.name), city = normalizeText(s.city), tags = normalizeText(s.tags), type = normalizeText(s.type), pipeline = normalizeText(s.pipeline);
  let score = 0;
  for (const term of query.terms){
    const t = normalizeText(term); if (!t) continue;
    if (name.includes(t)) score += 4; if (city.includes(t)) score += 2; if (tags.includes(t)) score += 2; if (pipeline.includes(t)) score += 1.5; if (type.includes(t)) score += 1.5;
  }
  for (const f of query.fields){
    const val = normalizeText(f.value);
    switch (f.field){
      case 'name': case 'school': if (name.includes(val)) score += 6; else return 0; break;
      case 'city': if (city.includes(val)) score += 5; else return 0; break;
      case 'type':
        if (val.startsWith('pub')){ if (s.type==='public') score += 5; else return 0; }
        else if (val.startsWith('priv')){ if (s.type==='private') score += 5; else return 0; }
        else if (type.includes(val)) score += 3; else return 0; break;
      case 'pipeline': case 'stage': if (pipeline.includes(val)) score += 5; else return 0; break;
      case 'tag': case 'tags': if (tags.includes(val)) score += 4; else return 0; break;
    }
  }
  for (const r of query.range){
    const v = (r.field.startsWith('rel'))? Number(s.relationship||0) : Number(s.avgTuition||0);
    if (isNaN(v)) return 0;
    if (r.op==='>' && !(v>r.value)) return 0;
    if (r.op==='<' && !(v<r.value)) return 0;
    if (r.op==='>=' && !(v>=r.value)) return 0;
    if (r.op==='<=' && !(v<=r.value)) return 0;
    if (r.op==='=' && !(v===r.value)) return 0;
    score += 2;
  }
  return score;
}
function smartFilterSchools(rawQuery, extraFilters={}){
  const query = parseSmartQuery(rawQuery||'');
  let arr = state.schools.slice();
  arr = arr.filter(s=>{
    if (extraFilters.type && s.type!==extraFilters.type) return false;
    if (extraFilters.pipeline && s.pipeline!==extraFilters.pipeline) return false;
    const sc = scoreSchool(s, query); s.__score = sc; return sc>0;
  });
  arr.sort((a,b)=> (b.__score||0) - (a.__score||0));
  return arr;
}

// Pipeline
const PIPE_KEYS = ['new','first','follow','pending','appointment','agreed'];
function pipeIndex(code){ return PIPE_KEYS.indexOf(code); }

// Visit status
function visitStatusLabel(code){ const map = I18N[state.lang]?.visits?.status || I18N.ar.visits.status; return map[code] || code; }
function visitStatusClass(code){ return 'status-badge st-'+(code||'confirmed'); }

// Persistence
function save(){ Store.set('schoolsCRM_v25', JSON.stringify(state)); }


function load(){
  let raw = null;
  try { raw = Store.get('schoolsCRM_v25'); } catch(e){ raw = null; }
  if (raw){
    try {
      const st = JSON.parse(raw);
      st.visits = (st.visits||[]).map(v=> ({...v, status: v.status||'confirmed'}));
      st.relHistory = st.relHistory||[]; st.stageNotes = st.stageNotes||[]; st.visitNotes = st.visitNotes||[]; st.pipelineHistory = st.pipelineHistory||[];
      if (st.auth && st.auth.email){ st.auth.email = (''+st.auth.email).toLowerCase(); }
      st.role = st.role||'admin';
      return st;
    } catch(e){
      try { Store.remove('schoolsCRM_v25'); } catch(_){}
    }
  }
  const s1 = {id:uid(), name:'مدرسة النهضة', type:'private', city:'الرياض', avgTuition:12000, address:'حي النخيل', phone:'0501234567', tags:'stem,robot', pipeline:'first', relationship:3, notes:''};
  const s2 = {id:uid(), name:'ثانوية ابن رشد', type:'public', city:'جدة', avgTuition:0, address:'الصفا', phone:'', tags:'arts', pipeline:'pending', relationship:2, notes:''};
  const s3 = {id:uid(), name:'مدارس الصفوة', type:'private', city:'مكة', avgTuition:10000, address:'', phone:'', tags:'olympiad', pipeline:'agreed', relationship:5, notes:''};
  const visits = [
    {id:uid(), schoolId:s1.id, date: todayISO(), purpose:'تعريف', status:'done', notes:''},
    {id:uid(), schoolId:s2.id, date: todayISO(), purpose:'متابعة', status:'confirmed', notes:''},
    {id:uid(), schoolId:s3.id, date: todayISO(), purpose:'ورشة', status:'approved', notes:''},
    {id:uid(), schoolId:s3.id, date: todayISO(), purpose:'ورشة', status:'postponed', notes:''}
  ];
  return {auth:null, role:'admin', lang:'ar', userName:'', schools:[s1,s2,s3], visits, relHistory:[], pipelineHistory:[], stageNotes:[], visitNotes:[]};
}
let state = load();

// Auth
const USERS = {
  'admin@example.com': {pass:'admin123', role:'admin', name:'Admin'},
  'coord@example.com': {pass:'coord123', role:'coord', name:'Coordinator'},
  'vol@example.com':   {pass:'vol123', role:'vol', name:'Volunteer'}
};


function clearAuth(){ if(state){ state.auth=null; } try{ save(); }catch(_){} }
function isAuthValid(){ const e = state?.auth?.email && (''+state.auth.email).toLowerCase(); return !!(e && USERS[e]); }

// ===== UI Boot =====
document.addEventListener('DOMContentLoaded', ()=>{
  if (!isAuthValid()){ clearAuth(); showLogin(); } else { initAfterAuth(); }
});



function showLogin(){
  clearAuth();
  $('#loginOverlay').style.display='flex';
  function submitLogin(){
    const email = ($('#loginEmail').value||'').trim().toLowerCase();
    const pass  = ($('#loginPass').value||'').trim();
    let u = USERS[email];
    if (!u){
      if (pass==='admin123') u = {pass:'admin123', role:'admin', name:'Admin'};
      else if (pass==='coord123') u = {pass:'coord123', role:'coord', name:'Coordinator'};
      else if (pass==='vol123') u = {pass:'vol123', role:'vol', name:'Volunteer'};
    }
    if (u && u.pass===pass){
      state.auth = {email: email || (u.role+'@local')};
      state.role = u.role || 'vol';
      state.userName = u.name || email;
      save();
      $('#loginOverlay').style.display='none';
      initAfterAuth();
    } else {
      const msgAr = 'بيانات الدخول غير صحيحة. جرّب: admin@example.com / admin123 أو استخدم أي بريد مع كلمة السر admin123 أو coord123 أو vol123.';
      const msgEn = 'Invalid credentials. Try admin@example.com / admin123, or use any email with password admin123 / coord123 / vol123.';
      alert(state.lang==='ar'? msgAr : msgEn);
    }
  }
  $('#btnLogin').onclick = submitLogin;
  // quick-fill demo buttons
  const da=$('#demoAdmin'), dc=$('#demoCoord'), dv=$('#demoVol');
  if(da){ da.onclick=()=>{ $('#loginEmail').value='admin@example.com'; $('#loginPass').value='admin123'; submitLogin(); }; }
  if(dc){ dc.onclick=()=>{ $('#loginEmail').value='coord@example.com'; $('#loginPass').value='coord123'; submitLogin(); }; }
  if(dv){ dv.onclick=()=>{ $('#loginEmail').value='vol@example.com'; $('#loginPass').value='vol123'; submitLogin(); }; }
  ['loginEmail','loginPass'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); submitLogin(); } }); }
  });
  const rs = document.getElementById('btnResetSession');
  if (rs){ rs.onclick = ()=> hardResetSession(); }
  setTimeout(()=> { const el=$('#loginEmail'); if(el) el.focus(); }, 0);
}

function initAfterAuth(){
  $('#userBadge').textContent = (state.userName||state.auth?.email||'') + ' · ' + state.role;
  $('#btnLogout').onclick = ()=>{ state.auth=null; save(); location.reload(); };
  $('#langSwitch').value = state.lang||'ar';
  $('#langSwitch').onchange = ()=>{ applyLang($('#langSwitch').value); };
  renderNav();
  buildTypeOptions(); buildPipelineOptions(); buildSchoolSelects();
  buildVisitStatusFilter($('#visitStatusFilter'));
  renderDashboard(); renderSchools(); renderVisits(); renderReports(); refreshFormLabels();
  if($('#btnCommAdvance')){ $('#btnCommAdvance').textContent=(state.lang==='ar'?'التالي':'Next'); $('#btnCommPrev').textContent=(state.lang==='ar'?'السابق':'Prev'); $('#btnSkipAgreed').textContent=(state.lang==='ar'?'تخطي إلى تم الاتفاق':'Skip to Agreed'); }
  // Schools filters
  $('#schoolSearch').addEventListener('input', debounce(renderSchools,60));
  $('#filterType').addEventListener('change', renderSchools);
  $('#filterPipeline').addEventListener('change', renderSchools);
  // Visits filters
  $('#visitSchoolFilter').addEventListener('change', renderVisits);
  $('#visitMonthFilter').addEventListener('change', renderVisits);
  $('#visitStatusFilter').addEventListener('change', renderVisits);
  // Communication live search
  buildCommStageFilter($('#commStageFilter')); setCommPlaceholder();
  const ci = $('#commSchoolInput');
  if (ci){
    ci.addEventListener('input', renderTimeline);
    ci.addEventListener('change', ()=>{ const best=currentSchoolFromInput(); setCommInputToSchool(best,{force:true}); renderTimeline(); });
    ci.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); const best=currentSchoolFromInput(); setCommInputToSchool(best,{force:true}); renderTimeline(); } });
  }
  const cs = $('#commStageFilter'); if(cs){ cs.addEventListener('change', renderTimeline); }
  navigate('dashboard');
}


function setCommPlaceholder(){
  const ar = 'بحث ذكي: اسم/مدينة/وسوم أو مثل: city:الرياض stage:follow';
  const en = 'Smart search: name/city/tags e.g. city:Riyadh stage:follow';
  const fr = 'Filtre intelligent: nom/ville/tags ex: city:Riyadh stage:follow';
  const el = $('#commSchoolInput');
  if(el){ el.placeholder = (state.lang==='ar'? ar : (state.lang==='fr'? fr : en)); }
}
function buildCommStageFilter(sel){
  if(!sel) sel = $('#commStageFilter');
  if(!sel) return;
  sel.innerHTML = `<option value="">${t('type.all')}</option>` + PIPE_KEYS.map(k=> `<option value="${k}">${pipeLabel(k)}</option>`).join('');
}

// ===== Navigation =====

function renderNav(){
  const nav = $('#tabs');
  let items = [
    {id:'dashboard', label:t('nav.dashboard')},
    {id:'schools', label:t('nav.schools')},
    {id:'communication', label:t('nav.communication')},
    {id:'visits', label:t('nav.visits')},
    {id:'reports', label:t('nav.reports')},
    {id:'settings', label:t('nav.settings')}
  ];
  if (state.role!=='admin'){ items = items.filter(i=> i.id!=='settings'); }
  nav.innerHTML = items.map(i=>`<div class="tab" data-id="${i.id}">${i.label}</div>`).join('');
  nav.onclick = (e)=>{ const tab = e.target.closest('.tab'); if(!tab) return; navigate(tab.dataset.id); };
}
function navigate(id){
  if (id==='settings' && state.role!=='admin'){ alert(state.lang==='ar'?'غير مسموح: الإعدادات للمدير فقط':'Forbidden: settings for admin only'); id='dashboard'; }
  $$('#main > section').forEach(s=> s.classList.add('hidden'));
  const sect = document.getElementById(id) || document.getElementById('dashboard');
  sect.classList.remove('hidden');
  $$('.tab').forEach(t=> t.classList.toggle('active', t.dataset.id===id));
  if (id==='schools') renderSchools();
  if (id==='visits') renderVisits();
  if (id==='communication'){ renderTimeline(); const ci=$('#commSchoolInput'); ci && ci.focus(); }
  if (id==='reports') renderReports();
}

// ===== Dashboard =====
function renderDashboard(){
  $('#kpiSchools').textContent = state.schools.length;
  $('#kpiAgreed').textContent = state.schools.filter(s=>s.pipeline==='agreed').length;
  const avgRel = state.schools.length? Math.round(state.schools.reduce((a,s)=>a+(Number(s.relationship)||0),0)/state.schools.length*10)/10 : 0;
  $('#kpiAvgRel').textContent = avgRel;
  $('#kpiSchoolsLabel').textContent = t('dashboard.totalSchools');
  $('#kpiAgreedLabel').textContent = t('dashboard.totalAgreed');
  $('#kpiAvgRelLabel').textContent = t('dashboard.avgRel');
  const wrap = $('#pipeIndicators');
  wrap.innerHTML = PIPE_KEYS.map(k=>{
    const n = state.schools.filter(s=>s.pipeline===k).length;
    const avg = state.schools.filter(s=>s.pipeline===k).reduce((a,s)=>a+(Number(s.relationship)||0),0);
    const avgRel = n? Math.round(avg/n*10)/10 : 0;
    return `<div class="tag"><span class="dot ${pipeDot(k)}"></span>${pipeLabel(k)}: <b style="margin:0 6px">${n}</b> · ${avgRel}</div>`;
  }).join('');
}

// ===== Schools =====
function buildTypeOptions(){
  $('#filterType').innerHTML = `<option value="">${t('type.all')}</option><option value="public">${t('type.public')}</option><option value="private">${t('type.private')}</option>`;
  $('#selType').innerHTML = `<option value="public">${t('type.public')}</option><option value="private">${t('type.private')}</option>`;
}
function buildPipelineOptions(){
  $('#filterPipeline').innerHTML = `<option value="">${t('type.all')}</option>`+PIPE_KEYS.map(k=>`<option value="${k}">${pipeLabel(k)}</option>`).join('');
  $('#selPipeline').innerHTML = PIPE_KEYS.map(k=>`<option value="${k}">${pipeLabel(k)}</option>`).join('');
}
function renderSchools(){
  const qRaw = ($('#schoolSearch').value||'').trim();
  const fType = $('#filterType').value;
  const fPipe = $('#filterPipeline').value;
  const rows = smartFilterSchools(qRaw, {type:fType||null, pipeline:fPipe||null});
  const table = $('#schoolsTable');
  table.innerHTML = `
    <thead><tr>
      <th>${t('table.school')}</th><th>${t('table.city')}</th><th>${t('table.type')}</th>
      <th>${t('table.pipeline')}</th><th>${t('table.relation')}</th><th>${t('table.avg')}</th><th>${t('table.tags')}</th><th>${t('table.actions')}</th>
    </tr></thead>
    <tbody>
    ${rows.map(s=>`
      <tr>
        <td><b>${s.name}</b><div class="muted small">${s.address||''} ${s.phone? '· '+s.phone:''}</div></td>
        <td>${s.city||'—'}</td>
        <td>${typeLabel(s.type)}</td>
        <td><span class="tag"><span class="dot ${pipeDot(s.pipeline)}"></span>${pipeLabel(s.pipeline)}</span></td>
        <td>${'★'.repeat(s.relationship)}${'☆'.repeat(5-(s.relationship||0))}</td>
        <td>${s.avgTuition? new Intl.NumberFormat(state.lang).format(s.avgTuition):'—'}</td>
        <td>${(s.tags||'').split(',').filter(Boolean).map(t=>`<span class="tag">#${t.trim()}</span>`).join(' ')}</td>
        <td class="actions">${actionBtns('schools', s.id)}</td>
      </tr>`).join('')}
    </tbody>`;
  $('#btnAddSchool').style.display = can('schools','create')? 'inline-flex':'none';
  table.onclick = (e)=>{
    const note = e.target.closest('[data-act="view-note"]'); if(note){ openVisitNoteView(note.dataset.id); return; }
    const btn = e.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const act = btn.dataset.act; const i = state.schools.findIndex(x=>x.id===id); if(i<0) return;
    if (act==='edit'){ openEditSchool(state.schools[i]); }
    if (act==='del' && confirm('تأكيد الحذف؟')){ state.schools.splice(i,1); save(); renderSchools(); renderDashboard(); }
  };
}
$('#btnAddSchool')?.addEventListener('click', ()=> openEditSchool(null));
function openEditSchool(s){
  const dlg = $('#dlgSchool'); const f = $('#formSchool');
  f.reset();
  buildTypeOptions(); buildPipelineOptions();
  if (s){
    $('#dlgSchoolTitle').textContent = t('common.edit'); f.elements.id.value=s.id;
    f.elements.name.value=s.name; f.elements.type.value=s.type; f.elements.city.value=s.city||''; f.elements.avgTuition.value=s.avgTuition||'';
    f.elements.address.value=s.address||''; f.elements.phone.value=s.phone||''; f.elements.tags.value=s.tags||'';
    f.elements.pipeline.value=s.pipeline||'new'; f.elements.relationship.value=s.relationship||3; f.elements.notes.value=s.notes||'';
  } else {
    $('#dlgSchoolTitle').textContent = t('fields.school'); f.elements.id.value=''; f.elements.pipeline.value='new'; f.elements.relationship.value=3; f.elements.dateCreated=todayISO();
  }
  openDialog(dlg);
}
$('#btnDlgCloseSchool')?.addEventListener('click', ()=> closeDialog($('#dlgSchool')));
$('#btnDlgCancelSchool')?.addEventListener('click', ()=> closeDialog($('#dlgSchool')));
$('#formSchool')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const f = e.target;
  const data = Object.fromEntries(new FormData(f).entries());
  data.avgTuition = Number(data.avgTuition||0); data.relationship = Number(data.relationship||3);
  if (data.id){
    const i=state.schools.findIndex(x=>x.id===data.id);
    if (state.schools[i].pipeline!==data.pipeline){ pushPipeline(data.id, state.schools[i].pipeline, data.pipeline); }
    state.schools[i] = {...state.schools[i], ...data};
  } else {
    data.id=uid(); state.schools.push(data); pushPipeline(data.id, null, data.pipeline||'new');
  }
  save(); closeDialog($('#dlgSchool')); renderSchools(); renderDashboard(); renderReports();
});
function buildSchoolSelects(){
  const options = state.schools.map(s=> `<option value="${s.id}">${s.name}</option>`).join('');
  const vsf = $('#visitSchoolFilter'); if (vsf) vsf.innerHTML = `<option value="">${t('type.all')}</option>` + options;
  const vs = $('#visitSchool'); if (vs) vs.innerHTML = options;
}

// ===== Visits =====

function lastVisitNote(visitId){
  const arr = (state.visitNotes||[]).filter(n=> n.visitId===visitId).sort((a,b)=> new Date(b.date)-new Date(a.date));
  return arr[0];
}
function renderVisitNoteCell(visitId){
  const n = lastVisitNote(visitId);
  if (!n || (!n.note && !(n.files&&n.files.length))) return '—';
  const txt = n.note? n.note.slice(0,28)+(n.note.length>28?'…':'') : (n.files[0]?.name||'file');
  return `<span class="tag note" data-act="view-note" data-id="${visitId}" title="${n.note||''}">📝 ${txt}</span>`;
}

function buildVisitStatusFilter(sel){
  if (!sel) return;
  const map = I18N[state.lang]?.visits?.status || I18N.ar.visits.status;
  sel.innerHTML = `<option value="">${map.all}</option>`+
    ['done','confirmed','cancelled','postponed','approved'].map(k=> `<option value="${k}">${map[k]}</option>`).join('');
}
function buildVisitStatusSelect(sel){
  if (!sel) return;
  const map = I18N[state.lang]?.visits?.status || I18N.ar.visits.status;
  sel.innerHTML = ['done','confirmed','cancelled','postponed','approved'].map(k=> `<option value="${k}">${map[k]}</option>`).join('');
}

function openVisitNoteView(visitId){
  const n = lastVisitNote(visitId);
  if (!n){ alert(state.lang==='ar'?'لا توجد ملاحظة':'No note'); return; }
  const d = document.createElement('dialog'); d.className='dlg';
  d.innerHTML = `<div class="card" style="margin:0">
    <div class="dlg-head"><b>${state.lang==='ar'?'ملاحظة حالة الزيارة':'Visit status note'}</b><button class="btn">×</button></div>
    <div class="grid" style="grid-template-columns:1fr"><div class="muted small">${n.date}</div><div>${n.note||'—'}</div></div>
    <div class="row" style="margin:8px 0 0">${(n.files||[]).map(f=>`<a class="tag" href="${f.dataUrl}" download="${f.name}">${f.name}</a>`).join(' ')}</div>
    <div class="actions" style="margin-top:10px"><button class="btn">${t('common.cancel')}</button></div>
  </div>`;
  document.body.appendChild(d);
  d.querySelector('.btn').onclick = ()=>{ d.close(); d.remove(); };
  d.showModal();
}

function renderVisits(){
  const selSchool = $('#visitSchoolFilter'); const month = $('#visitMonthFilter').value; const st = $('#visitStatusFilter').value;
  const rows = (state.visits||[])
    .filter(v=> !selSchool.value || v.schoolId===selSchool.value)
    .filter(v=> !month || (v.date||'').startsWith(month))
    .filter(v=> !st || v.status===st);
  const table = $('#visitsTable');
  table.innerHTML = `
    <thead><tr><th>التاريخ</th><th>${t('visits.purpose')}</th><th>الحالة</th><th>ملاحظة</th><th>${t('visits.school')}</th><th>${t('table.actions')}</th></tr></thead>
    <tbody>
      ${rows.map(v=>{ const s = state.schools.find(x=>x.id===v.schoolId); const sn=s? s.name:'—';
        return `<tr>
          <td>${v.date||'—'}</td>
          <td>${v.purpose||''}</td>
          <td><span class="${visitStatusClass(v.status)}">${visitStatusLabel(v.status)}</span></td>
          <td>${renderVisitNoteCell(v.id)}</td>
          <td>${sn}</td>
          <td class="actions">${actionBtns('visits', v.id)}</td>
        </tr>`;
      }).join('')}
    </tbody>`;
  $('#btnAddVisit').style.display = can('visits','create')? 'inline-flex':'none';
  table.onclick = (e)=>{
    const note = e.target.closest('[data-act="view-note"]'); if(note){ openVisitNoteView(note.dataset.id); return; }
    const btn = e.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const act = btn.dataset.act; const i = state.visits.findIndex(x=>x.id===id); if(i<0) return;
    if (act==='edit'){ openEditVisit(state.visits[i]); }
    if (act==='del' && confirm('تأكيد الحذف؟')){ state.visits.splice(i,1); save(); renderVisits(); renderDashboard(); }
  };
}
$('#btnAddVisit')?.addEventListener('click', ()=> openEditVisit(null));
function openEditVisit(v){
  const dlg = $('#dlgVisit'); const f = $('#formVisit');
  f.reset(); buildSchoolSelects(); buildVisitStatusSelect($('#visitStatus'));
  if (v){
    $('#dlgVisitTitle').textContent = t('common.edit');
    f.elements.id.value=v.id; f.elements.schoolId.value=v.schoolId; f.elements.date.value=v.date||todayISO(); f.elements.purpose.value=v.purpose||''; f.elements.status.value=v.status||'confirmed'; f.elements.notes.value=v.notes||'';
  } else {
    $('#dlgVisitTitle').textContent = t('visits.add').replace('+ ',''); f.elements.id.value=''; f.elements.date.value=todayISO(); f.elements.status.value='confirmed';
  }
  openDialog(dlg);
}
$('#btnDlgCloseVisit')?.addEventListener('click', ()=> closeDialog($('#dlgVisit')));
$('#btnDlgCancelVisit')?.addEventListener('click', ()=> closeDialog($('#dlgVisit')));
$('#formVisit')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const f = e.target; const data = Object.fromEntries(new FormData(f).entries());
  const existing = data.id? state.visits.find(x=>x.id===data.id) : null;
  const prevStatus = existing? existing.status : null;
  function finalize(){
    if (data.id){ const i = state.visits.findIndex(x=>x.id===data.id); state.visits[i] = {...state.visits[i], ...data}; }
    else { data.id=uid(); state.visits.push(data); }
    save(); closeDialog($('#dlgVisit')); renderVisits(); renderDashboard();
  }
  if (prevStatus && data.status && prevStatus !== data.status){
    openVisitStatusDialog(data.id || 'new', data.status, (ok)=>{ if(ok) finalize(); });
  } else { finalize(); }
});

function openVisitStatusDialog(visitId, newStatus, cb){
  const dlg = $('#dlgVisitStatus'); const form = $('#formVisitStatus'); const filesIn = $('#visitStatusFiles'); const prev = $('#visitFilePreview');
  form.reset(); form.elements.visitId.value = visitId; form.elements.newStatus.value = newStatus;
  $('#dlgVisitStatusTitle').textContent = (state.lang==='ar'?'تفاصيل تغيير حالة الزيارة':'Visit status change') + ' → ' + visitStatusLabel(newStatus);
  prev.innerHTML=''; filesIn.onchange = ()=>{ prev.innerHTML = Array.from(filesIn.files||[]).map(f=> `<span class="tag">${f.name}</span>`).join(' '); };
  form.onsubmit = async (ev)=>{ ev.preventDefault(); const note = form.elements.note.value.trim(); const files = await readFilesAsDataUrls(filesIn.files); addVisitNote({id:uid(), visitId, newStatus, note, files, date: todayISO()}); closeDialog(dlg); cb(true); };
  $('#btnDlgCloseVisitStatus').onclick = ()=>{ closeDialog(dlg); cb(false); };
  $('#btnDlgCancelVisitStatus').onclick = ()=>{ closeDialog(dlg); cb(false); };
  openDialog(dlg);
}
function addVisitNote(entry){ state.visitNotes = state.visitNotes||[]; state.visitNotes.push(entry); save(); }
function readFilesAsDataUrls(fileList){
  return Promise.all(Array.from(fileList||[]).map(f => new Promise((resolve)=>{ const r=new FileReader(); r.onload=()=>resolve({name:f.name, type:f.type, dataUrl:r.result}); r.readAsDataURL(f); })));
}

// ===== Communication (Timeline) =====
function buildSchoolsDatalist(){
  const list = $('#schoolsList'); if (!list) return;
  const q = ($('#commSchoolInput').value||'').trim();
  const rows = smartFilterSchools(q, {pipeline: $('#commStageFilter')?.value || null}).slice(0,20);
  list.innerHTML = rows.map(s=>`<option value="${s.name}">`).join('');
}
function currentSchoolFromInput(){
  const q = ($('#commSchoolInput').value||'').trim();
  const rows = smartFilterSchools(q, {pipeline: $('#commStageFilter')?.value || null});
  return rows[0] || state.schools[0];
}
function setCommInputToSchool(s, {force=false}={}){ const inp=$('#commSchoolInput'); if(!inp || !s) return; if(force || document.activeElement!==inp) inp.value = s.name; }
function renderTimeline(){
  const editable = can('schools','edit');
  buildSchoolsDatalist();
  const s = currentSchoolFromInput(); if (!s){ $('#timelineBar').innerHTML=''; return; }
  setCommInputToSchool(s, {force:false});
  const idx = pipeIndex(s.pipeline);
  const steps = PIPE_KEYS.map((k,i)=>{
    const cls = 'time-step '+(i<idx?'done':(i===idx?'current':''));
    return `<div class="${cls}" data-stage="${k}"><div class="time-dot">${i<idx?'✓':(i===idx?'•':'')}</div><div class="time-label">${pipeLabel(k)}</div></div>` + (i<PIPE_KEYS.length-1?'<div class="time-line"></div>':'');
  }).join('');
  $('#timelineBar').innerHTML = steps;
  // toggle controls by permission
  const prevBtn=$('#btnCommPrev'), nextBtn=$('#btnCommAdvance'), skipBtn=$('#btnSkipAgreed');
  [prevBtn,nextBtn,skipBtn].forEach(b=>{ if(!b) return; b.style.display = editable? 'inline-flex':'none'; });
  if(!editable){ $('#timelineBar').style.opacity='.8'; $('#timelineBar').style.pointerEvents='none'; } else { $('#timelineBar').style.opacity='1'; $('#timelineBar').style.pointerEvents='auto'; }
  $('#commStageLabel').textContent = pipeLabel(s.pipeline);
  // current stage last note
  const note = (state.stageNotes||[]).filter(n=> n.schoolId===s.id && n.stage===s.pipeline).sort((a,b)=> new Date(b.date)-new Date(a.date))[0];
  const card = $('#currentStageNoteCard'); const body = $('#currentStageNote');
  if (note){ 
    card.style.display='block'; 
    const files = (note.files||[]).map(f=>`<a class="tag" href="${f.dataUrl}" download="${f.name}">${f.name}</a>`).join(' ');
    body.innerHTML = `<div class="muted small">${note.date}</div><div>${note.note?note.note:'—'}</div><div class="row" style="margin-top:6px">${files}</div>`;
  } else { card.style.display='none'; body.innerHTML=''; }
  // interactions
  $('#timelineBar').onclick = (e)=>{ if(!editable) return;
    const step = e.target.closest('.time-step'); if (!step) return;
    const to = step.getAttribute('data-stage'); const toIdx = pipeIndex(to); if (toIdx===idx) return;
    openStageNoteDialog(s.id, to, ()=>{ const from=s.pipeline; s.pipeline=to; pushPipeline(s.id, from, to); save(); renderTimeline(); renderSchools(); renderDashboard(); renderReports(); });
  };
  $('#btnCommAdvance').onclick = ()=>{ if(!editable) return;
    if (idx < PIPE_KEYS.length-1){
      const to = PIPE_KEYS[idx+1];
      openStageNoteDialog(s.id, to, ()=>{ const from=s.pipeline; s.pipeline=to; pushPipeline(s.id, from, to); save(); renderTimeline(); renderSchools(); renderDashboard(); renderReports(); });
    }
  };
  $('#btnCommPrev').onclick = ()=>{ if(!editable) return;
    if (idx>0){
      const to = PIPE_KEYS[idx-1];
      openStageNoteDialog(s.id, to, ()=>{ const from=s.pipeline; s.pipeline=to; pushPipeline(s.id, from, to); save(); renderTimeline(); renderSchools(); renderDashboard(); renderReports(); });
    }
  };
  $('#btnSkipAgreed').onclick = ()=>{ if(!editable) return;
    if (confirm(state.lang==='ar'?'تأكيد التخطي إلى تم الاتفاق؟':'Confirm skip to Agreed?')){
      const to = 'agreed';
      openStageNoteDialog(s.id, to, ()=>{ const from=s.pipeline; s.pipeline=to; pushPipeline(s.id, from, to); save(); renderTimeline(); renderSchools(); renderDashboard(); renderReports(); });
    }
  };
}
function openStageNoteDialog(schoolId, toStage, onSave){
  const dlg = $('#dlgStageNote'); const form = $('#formStageNote'); const filesIn = $('#stageFiles'); const prev = $('#filePreview');
  form.reset(); form.elements.schoolId.value = schoolId; form.elements.stage.value = toStage;
  $('#dlgStageNoteTitle').textContent = (state.lang==='ar'?'تفاصيل تغيير المرحلة':'Stage change details') + ' → ' + pipeLabel(toStage);
  prev.innerHTML = '';
  filesIn.onchange = ()=>{ prev.innerHTML = Array.from(filesIn.files||[]).map(f=> `<span class="tag">${f.name}</span>`).join(' '); };
  form.onsubmit = async (e)=>{
    e.preventDefault();
    const note = form.elements.note.value.trim();
    const files = await readFilesAsDataUrls(filesIn.files);
    state.stageNotes = state.stageNotes || []; state.stageNotes.push({id:uid(), schoolId, stage: toStage, note, files, date: todayISO()});
    closeDialog(dlg); onSave && onSave();
  };
  $('#btnDlgCloseStage').onclick = ()=> closeDialog(dlg);
  $('#btnDlgCancelStage').onclick = ()=> closeDialog(dlg);
  openDialog(dlg);
}
function ensurePipelineHistory(){
  state.pipelineHistory = state.pipelineHistory || [];
  state.schools.forEach(s=>{
    const has = state.pipelineHistory.some(h=> h.schoolId===s.id && h.to===s.pipeline);
    if (!has){ state.pipelineHistory.push({id:uid(), schoolId:s.id, from:null, to:s.pipeline, date: todayISO()}); }
  });
}
function pushPipeline(schoolId, from, to){
  ensurePipelineHistory();
  state.pipelineHistory.push({id:uid(), schoolId, from, to, date: todayISO()});
}

// ===== Reports =====
function renderReports(){
  ensurePipelineHistory();
  const keys = PIPE_KEYS;
  const counts = Object.fromEntries(keys.map(k=>[k, state.schools.filter(s=>s.pipeline===k).length]));
  const total = state.schools.length;
  $('#repTitle1').textContent = t('reports.overview');
  $('#reportsOverview').innerHTML = `<div class="row wrap"><div class="tag">${t('dashboard.totalSchools')}: <b style="margin:0 6px">${total}</b></div>`+
    keys.map(k=>`<div class="tag">${pipeLabel(k)}: <b style="margin:0 6px">${counts[k]}</b></div>`).join('') + '</div>';
  // avg days to reach each stage
  const firstDateBySchool = {};
  (state.pipelineHistory||[]).forEach(h=>{
    if (!firstDateBySchool[h.schoolId]) firstDateBySchool[h.schoolId] = h.date;
    else if (new Date(h.date) < new Date(firstDateBySchool[h.schoolId])) firstDateBySchool[h.schoolId] = h.date;
  });
  const daysToStage = Object.fromEntries(keys.map(k=>[k, []]));
  (state.pipelineHistory||[]).forEach(h=>{
    const start = firstDateBySchool[h.schoolId]; if (!start) return;
    const d = Math.round((new Date(h.date)-new Date(start))/(1000*60*60*24));
    if (!Number.isNaN(d)) daysToStage[h.to].push(d);
  });
  const avgDays = Object.fromEntries(keys.map(k=>{
    const arr = daysToStage[k]; const avg = arr.length? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    return [k, avg];
  }));
  $('#repTitle2').textContent = (state.lang==='ar'? 'متوسط الأيام للوصول لكل مرحلة' : t('reports.avgByStage'));
  $('#reportsTimes').innerHTML = `<div class="row wrap">`+ keys.map(k=>`<div class="tag">${pipeLabel(k)}: <b style="margin:0 6px">${avgDays[k]}d</b></div>`).join('') + '</div>';
}

// ===== Settings / i18n sync =====
function refreshFormLabels(){
  const map = [
    ['dlgSchoolTitle', t('fields.school')],
    ['btnDlgSaveSchool', t('common.save')],
    ['btnDlgCancelSchool', t('common.cancel')],
  ];
  map.forEach(([id, val])=>{ const el=document.getElementById(id); if(el) el.textContent = val; });
}
function applyLang(lang){
  state.lang = lang; save();
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang==='ar' ? 'rtl' : 'ltr');
  renderNav(); renderDashboard(); renderSchools(); renderVisits(); renderReports(); refreshFormLabels();
  buildCommStageFilter($('#commStageFilter')); setCommPlaceholder();
  // hide settings actions for non-admin
  if (state.role!=='admin'){
    const b1=$('#btnBackup'), b2=$('#restoreInput'), b3=$('#btnFactory');
    [b1,b2,b3].forEach(el=>{
      if(!el) return;
      if(el.tagName==='INPUT'){ el.disabled=true; }
      else { el.style.display='none'; }
    });
  }
  if($('#btnCommAdvance')){ $('#btnCommAdvance').textContent=(state.lang==='ar'?'التالي':'Next'); }
  if($('#btnCommPrev')){ $('#btnCommPrev').textContent=(state.lang==='ar'?'السابق':'Prev'); }
  if($('#btnSkipAgreed')){ $('#btnSkipAgreed').textContent=(state.lang==='ar'?'تخطي إلى تم الاتفاق':'Skip to Agreed'); }
}