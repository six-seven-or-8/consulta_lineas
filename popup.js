/**
 * popup.js - Consulta Lineas CRT
 * Autor: Six-Seven | MIT
 *
 * v13:
 * - Todas las cadenas de texto usan t() de i18n.js
 * - APIs directas: lanza RUN_API_QUERIES al background antes de abrir pestanas
 * - AT&T movido a Manuales
 */
'use strict';

/* ── Estado ──────────────────────────────────────────────── */
let ui  = { tipo: 'fisica', ciudadania: 'mexicano' };
let idx = 0;
let filteredCompanies   = [];
let filteredWebview     = [];
let filteredApi         = [];
const BATCH  = 5;
const VIEWS  = ['v-form','v-prog','v-resume'];

/* ── Helpers ─────────────────────────────────────────────── */
const g   = id => document.getElementById(id);
function mkEl(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}
function showView(id) {
  VIEWS.forEach(v => { const e=g(v); if(e) e.classList.toggle('hidden', v!==id); });
}

/* ── Campo de identificacion ─────────────────────────────── */

/**
 * Actualiza labels, placeholder y hint del campo de identificacion.
 * clearValue=true: borra el valor (al cambiar tipo de persona/ciudadania)
 * clearValue=false: solo actualiza textos (al cambiar idioma)
 */
function updateIdLabels(clearValue) {
  const label  = g('f-id-label');
  const inp    = g('f-id');
  const hint   = g('f-id-hint');
  const fgCiud = g('fg-ciudadania');

  if (ui.tipo === 'moral') {
    if (label) label.textContent = t('form.rfc.label');
    if (inp)   { inp.placeholder = 'ZVM890515KG3'; inp.maxLength = 13; }
    if (hint)  hint.textContent  = t('form.rfc.hint');
    if (fgCiud) fgCiud.classList.add('hidden');
  } else if (ui.ciudadania === 'extranjero') {
    if (label) label.textContent = t('form.pass.label');
    if (inp)   { inp.placeholder = 'ZAB000022133'; inp.maxLength = 20; }
    if (hint)  hint.textContent  = t('form.pass.hint');
    if (fgCiud) fgCiud.classList.remove('hidden');
  } else {
    if (label) label.textContent = t('form.curp.label');
    if (inp)   { inp.placeholder = 'GOML920314HDFLPS08'; inp.maxLength = 18; }
    if (hint)  hint.textContent  = t('form.curp.hint');
    if (fgCiud) fgCiud.classList.remove('hidden');
  }
  if (clearValue && inp) inp.value = '';
  validate();
}

/** Al cambiar tipo de persona o ciudadania — borra el valor del campo */
function updateIdField() { updateIdLabels(true); }

/** Al cambiar idioma — solo actualiza textos, NO borra el valor */
function updateIdFieldLang() { updateIdLabels(false); }

/* ── Traducciones: sistema unificado ─────────────────────── */
/**
 * Aplica todas las traducciones a la UI.
 * 1. Recorre todos los [data-i18n] en el HTML (elementos estaticos)
 * 2. Actualiza elementos dinamicos que no tienen data-i18n
 * 3. Re-renderiza las pestanas dinamicas si estan activas
 */
function applyStaticTranslations() {
  /* 1. Elementos con data-i18n en el HTML */
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (!val || val === key) return;
    el.textContent = val;
  });

  /* 2. Elementos dinamicos que no pueden tener data-i18n estatico */
  updateIdFieldLang();

  const ibox = document.querySelector('.ibox');
  if (ibox) ibox.innerHTML = t('prog.ibox').split('\n').join('<br>');

  /* Texto "ibox" y campo de progreso */
  const progS = g('prog-s');
  if (progS && progS.textContent === '') progS.textContent = '';

  /* RTL para arabe */
  document.body.dir = (_currentLang === 'ar') ? 'rtl' : 'ltr';

  /* 3. Re-renderizar pestanas dinamicas activas */
  const activePanel = document.querySelector('.panel.active');
  if (activePanel) {
    if (activePanel.id === 't-resultados') {
      renderResults();
      renderKnownErrors();
    }
    if (activePanel.id === 't-especiales') renderSpecials();
    if (activePanel.id === 't-acerca')     renderAcerca();
  }
  /* Los errores conocidos estan siempre visibles en t-resultados */
  renderKnownErrors();
}

/* ── Guardar datos del formulario ────────────────────────── */
function saveFormNow() {
  const val = g('f-id') ? g('f-id').value.trim() : '';
  Storage.saveUserData({
    identificador: val,
    tipo:          ui.tipo,
    ciudadania:    ui.ciudadania,
    tc:            g('f-tc') ? g('f-tc').checked : false,
    av:            g('f-av') ? g('f-av').checked : false,
  }).catch(() => {});
}

/* ── Validacion ──────────────────────────────────────────── */
const CURP_RE  = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
const RFC_RE   = /^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
const PASAP_RE = /^[A-Z0-9]{6,20}$/;

function validate() {
  const val = g('f-id') ? g('f-id').value.trim() : '';
  const tc  = g('f-tc') ? g('f-tc').checked      : false;
  const av  = g('f-av') ? g('f-av').checked      : false;
  const err = g('f-err');
  let ok = false, errMsg = '';

  if (ui.tipo === 'moral') {
    ok = RFC_RE.test(val) || (val.length >= 12 && val.length <= 13);
    if (val.length > 0 && !ok) errMsg = t('form.err.rfc');
  } else if (ui.ciudadania === 'extranjero') {
    ok = PASAP_RE.test(val) && val.length >= 6;
    if (val.length > 0 && !ok) errMsg = t('form.err.pass');
  } else {
    ok = CURP_RE.test(val);
    if (val.length === 18 && !ok) errMsg = t('form.err.curp');
  }

  if (g('btn-start')) g('btn-start').disabled = !(ok && tc && av);
  if (err) err.textContent = errMsg;
}

/* ── Tabs ────────────────────────────────────────────────── */
function initNavTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active'); btn.setAttribute('aria-selected','true');
      const panel = g(btn.dataset.tab);
      if (panel) panel.classList.add('active');
      if (btn.dataset.tab === 't-resultados') { renderResults(); renderKnownErrors(); }
      if (btn.dataset.tab === 't-especiales') renderSpecials();
      if (btn.dataset.tab === 't-acerca')     renderAcerca();
    });
  });
}

/* ── Radios ──────────────────────────────────────────────── */
function initRadios() {
  document.querySelectorAll('.rb').forEach(btn => {
    btn.addEventListener('click', () => {
      const grp = btn.dataset.g;
      document.querySelectorAll(`.rb[data-g="${grp}"]`).forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      ui[grp] = btn.dataset.v;
      updateIdField(); saveFormNow();
    });
  });
}

/* ── Campo ID ────────────────────────────────────────────── */
function initIdField() {
  const inp = g('f-id');
  if (!inp) return;
  inp.addEventListener('input', () => {
    if (ui.tipo !== 'moral' && ui.ciudadania !== 'extranjero') {
      inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    } else if (ui.tipo === 'moral') {
      inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    }
    validate(); saveFormNow();
  });
}

/* ── Checkboxes ──────────────────────────────────────────── */
function initChks() {
  ['f-tc','f-av'].forEach(id => {
    const el = g(id);
    if (el) el.addEventListener('change', () => { validate(); saveFormNow(); });
  });
}

/* ── Cargar datos guardados ──────────────────────────────── */
async function loadForm() {
  const d = await Storage.loadUserData();
  if (!d) return;
  ['tipo','ciudadania'].forEach(grp => {
    if (!d[grp]) return;
    ui[grp] = d[grp];
    document.querySelectorAll(`.rb[data-g="${grp}"]`).forEach(b => {
      const sel = b.dataset.v === d[grp];
      b.classList.toggle('active', sel);
      b.setAttribute('aria-pressed', String(sel));
    });
  });
  updateIdField();
  if (g('f-id') && d.identificador) g('f-id').value = d.identificador;
  if (g('f-tc') && typeof d.tc === 'boolean') g('f-tc').checked = d.tc;
  if (g('f-av') && typeof d.av === 'boolean') g('f-av').checked = d.av;
  validate();
}

/* ── Boton limpiar ───────────────────────────────────────── */
function initClearBtn() {
  const btn = g('btn-clear');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!confirm('Limpiar el formulario y borrar los datos guardados?')) return;
    await Storage.clearUserData();
    if (g('f-id')) g('f-id').value = '';
    ['f-tc','f-av'].forEach(id => { const e=g(id); if(e) e.checked=false; });
    ui.tipo='fisica'; ui.ciudadania='mexicano';
    document.querySelectorAll('.rb[data-g="tipo"]').forEach(b => {
      b.classList.toggle('active', b.dataset.v==='fisica');
      b.setAttribute('aria-pressed', String(b.dataset.v==='fisica'));
    });
    document.querySelectorAll('.rb[data-g="ciudadania"]').forEach(b => {
      b.classList.toggle('active', b.dataset.v==='mexicano');
      b.setAttribute('aria-pressed', String(b.dataset.v==='mexicano'));
    });
    updateIdField();
  });
}

/* ── Filtrar portales ────────────────────────────────────── */
function buildFilteredLists() {
  const all = (typeof filterCompaniesByUser === 'function')
    ? filterCompaniesByUser(ui.tipo, ui.ciudadania)
    : (ACTIVE_COMPANIES || []);

  filteredCompanies = all;
  filteredApi      = all.filter(co => co.type_query === 'api_direct');
  filteredWebview  = all.filter(co => co.type_query === 'webview');

  /* Deduplicar webview por URL */
  const seen = new Set();
  filteredWebview = filteredWebview.filter(co => {
    if (seen.has(co.url)) return false;
    seen.add(co.url); return true;
  });
}

/* ── Sesion ──────────────────────────────────────────────── */
async function initSession() {
  await Storage.expire();
  const { exists, lastIndex, count } = await Storage.checkSession();
  await loadForm();
  buildFilteredLists();

  if (exists && lastIndex > 0) {
    idx = lastIndex;
    showResume(lastIndex, count);
  } else {
    showView('v-form');
  }
}

function showResume(lastIndex, count) {
  const total = filteredWebview.length;
  const info  = g('rsum-info');
  if (info) info.textContent =
    t('resume.title') + ': ' + lastIndex + ' / ' + total + '. ' +
    count + ' resultado(s).';
  showView('v-resume');

  const btnR = g('btn-resume');
  const btnS = g('btn-restart');
  if (btnR) btnR.onclick = () => startProgress(idx);
  if (btnS) btnS.onclick = async () => {
    await Storage.startSession(); idx=0;
    buildFilteredLists(); await loadForm(); showView('v-form');
  };
}

/* ── Boton Comenzar ──────────────────────────────────────── */
function initStartBtn() {
  const btn = g('btn-start');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const val = g('f-id') ? g('f-id').value.trim() : '';
    const user = {
      identificador: val, tipo: ui.tipo, ciudadania: ui.ciudadania,
      tc: g('f-tc') ? g('f-tc').checked : false,
      av: g('f-av') ? g('f-av').checked : false,
    };
    await Storage.saveUserData(user);
    await Storage.startSession();
    await Storage.saveUserData(user); /* post-startSession */
    buildFilteredLists();
    idx = 0;
    await runApiQueriesAndStart(user);
  });
}

/* ── APIs directas + inicio de progreso ──────────────────── */
async function runApiQueriesAndStart(user) {
  showView('v-prog');
  const msgEl  = g('prog-msg');
  const progT  = g('prog-t');
  const nxtBtn = g('btn-next');

  if (progT) progT.textContent = t('prog.title');
  if (nxtBtn) nxtBtn.disabled = true;

  if (filteredApi.length > 0) {
    if (msgEl) msgEl.textContent =
      'Consultando ' + filteredApi.length + ' portales via API directa (sin CAPTCHA)...';

    try {
      const resp = await chrome.runtime.sendMessage({
        type: 'RUN_API_QUERIES',
        user,
        companies: filteredApi,
      });
      if (resp && resp.results) {
        const ok  = resp.results.filter(r => r && r.ok).length;
        const fail= resp.results.filter(r => r && !r.ok).length;
        if (msgEl) msgEl.textContent =
          filteredApi.length + ' APIs consultadas: ' + ok + ' exitosas' +
          (fail > 0 ? ', ' + fail + ' con error.' : '.');
      }
    } catch (e) {
      if (msgEl) msgEl.textContent = 'Error en APIs: ' + e.message;
    }
  }

  /* Ahora abrir las pestanas webview */
  startProgress(0);
}

/* ── Progreso ────────────────────────────────────────────── */
function startProgress(fromIdx) {
  idx = fromIdx;
  showView('v-prog');
  updateProgressUI();
  if (idx < filteredWebview.length) {
    openBatch();
  } else {
    const msgEl = g('prog-msg');
    if (msgEl) msgEl.textContent = t('res.empty').replace('Ve a Inicio y comienza.','Revisa la pestana Resultados.');
    const nxtBtn = g('btn-next');
    if (nxtBtn) nxtBtn.disabled = true;
  }
}

function updateProgressUI() {
  const total = filteredWebview.length;
  const pct   = total > 0 ? Math.round((idx/total)*100) : 100;
  const bar   = g('pbar');
  const lbl   = g('pbar-lbl');
  const sub   = g('prog-s');
  const badge = g('hdr-badge');

  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = idx + ' / ' + total + ' (' + pct + '%)';
  const wrap = bar ? bar.closest('[role="progressbar"]') : null;
  if (wrap) wrap.setAttribute('aria-valuenow', pct);

  if (sub) {
    if (idx < total) {
      const nextEnd = Math.min(idx+BATCH, total);
      sub.textContent = filteredWebview[idx] ? filteredWebview[idx].name +
        (nextEnd > idx+1 ? ' … ' + filteredWebview[nextEnd-1].name : '') : '';
    } else {
      sub.textContent = t('prog.title') + ' — OK';
    }
  }
  if (badge && idx > 0) badge.textContent = idx + '/' + total;
}

async function openBatch() {
  const total  = filteredWebview.length;
  const end    = Math.min(idx+BATCH, total);
  const batch  = filteredWebview.slice(idx, end);
  const msgEl  = g('prog-msg');
  const nxtBtn = g('btn-next');

  if (batch.length === 0) {
    await Storage.doneSession();
    if (msgEl)  msgEl.textContent = t('res.found') + ' — ' + t('res.verify') + '. Revisa Resultados.';
    if (nxtBtn) nxtBtn.disabled   = true;
    return;
  }

  if (nxtBtn) nxtBtn.disabled = true;
  if (msgEl)  msgEl.textContent = 'Abriendo ' + batch.length + ' pestana(s)...';

  for (let i=0; i<batch.length; i++) {
    if (i>0) await new Promise(r=>setTimeout(r,600));
    chrome.tabs.create({ url: batch[i].url, active: false });
  }

  idx = end;
  await Storage.setIndex(idx);
  updateProgressUI();

  if (idx < total) {
    if (nxtBtn) nxtBtn.disabled = false;
    if (msgEl)  msgEl.textContent =
      batch.length + ' pestana(s) abiertas. Resuelve el CAPTCHA. Los portales automaticos se cierran solos.';
  } else {
    await Storage.doneSession();
    if (nxtBtn) nxtBtn.disabled = true;
    if (msgEl)  msgEl.textContent = 'Consulta completada. Revisa Resultados.';
  }
}

function initProgressControls() {
  const nxt = g('btn-next');
  const pau = g('btn-pause');
  if (nxt) nxt.addEventListener('click', openBatch);
  if (pau) pau.addEventListener('click', async () => {
    await Storage.setIndex(idx);
    await loadForm(); showView('v-form');
    const msg = g('prog-msg');
    if (msg) msg.textContent = '';
  });
}

/* ── Render errores conocidos ────────────────────────────── */
function renderKnownErrors() {
  const container = g('known-errors-list');
  if (!container || typeof ERROR_COMPANIES === 'undefined') return;
  while (container.firstChild) container.removeChild(container.firstChild);

  /* Titulo y aviso: ya tienen data-i18n, se traducen en applyStaticTranslations */
  /* Solo actualizar si ya se cargaron */
  const titleEl = document.querySelector('.known-errors-title');
  if (titleEl && t('res.knownerr.title') !== 'res.knownerr.title') titleEl.textContent = t('res.knownerr.title');
  const noticeEl = document.querySelector('.known-errors-notice');
  if (noticeEl && t('res.knownerr.notice') !== 'res.knownerr.notice') noticeEl.textContent = t('res.knownerr.notice');

  const groups = [
    { label: t('res.group.fisica'), tipos: ['fisica_mx','fisica'] },
    { label: t('res.group.moral'),  tipos: ['moral'] },
    { label: t('res.group.ext'),    tipos: ['extranjero'] },
    { label: t('res.group.todos'),  tipos: ['todos'] },
  ];

  groups.forEach(grp => {
    const items = ERROR_COMPANIES.filter(co => grp.tipos.includes(co.personas || 'fisica_mx'));
    if (!items.length) return;
    const hdr = mkEl('div','known-errors-group-hdr', grp.label + ' (' + items.length + ')');
    container.appendChild(hdr);
    items.forEach(co => {
      const row = mkEl('div','rrow-item');
      row.appendChild(mkEl('div','rc', co.name));
      row.appendChild(mkEl('div','rd', (t('res.since') || 'Error conocido desde: ') + co.knownSince));
      const errText = co.errKey ? t(co.errKey) : (co.errorMsg || '');
      row.appendChild(mkEl('div','rerr', errText));
      const link = mkEl('a','rlink', t('res.manually') || t('res.verify') || 'Consultar manualmente');
      link.href=co.url; link.target='_blank'; link.rel='noopener noreferrer';
      row.appendChild(link);
      container.appendChild(row);
    });
  });
}

/* ── Render resultados ───────────────────────────────────── */
async function renderResults() {
  const results  = await Storage.loadResults();
  const entries  = Object.values(results);
  const countEl  = g('r-count');
  const dlBtn    = g('btn-dl');
  const ttlEl    = g('r-ttl');
  const emptyEl  = g('r-empty');
  const secFound = g('sec-found');
  const secOk    = g('sec-ok');
  const secErr   = g('sec-err');

  /* Headers de secciones traducidos */
  const fndHdr = g('sec-found-hdr');
  const okHdr  = g('sec-ok-hdr');
  const errHdr = g('sec-err-hdr');

  [secFound,secOk,secErr].forEach(el => { if(el) while(el.firstChild) el.removeChild(el.firstChild); });

  if (entries.length === 0) {
    if (countEl) countEl.textContent = t('res.empty')||'Sin resultados';
    if (dlBtn)   dlBtn.disabled      = true;
    if (ttlEl)   ttlEl.textContent   = '';
    if (emptyEl) { emptyEl.textContent = t('res.empty')||'Aun no hay resultados.'; emptyEl.style.display='block'; }
    if (fndHdr)  fndHdr.innerHTML = (t('res.found')||'Con numeros registrados')+' <span id="sec-found-n">(0)</span>';
    if (okHdr)   okHdr.innerHTML  = (t('res.ok')||'Sin numeros registrados')+' <span id="sec-ok-n">(0)</span>';
    if (errHdr)  errHdr.innerHTML = (t('res.err')||'Portales con error')+' <span id="sec-err-n">(0)</span>';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const withPhones = entries.filter(r => r.found   && r.status !== 'error');
  const noPhones   = entries.filter(r => !r.found  && r.status !== 'error');
  const withErrors = entries.filter(r => r.status  === 'error');
  const knownN     = typeof ERROR_COMPANIES !== 'undefined' ? ERROR_COMPANIES.length : 0;

  if (countEl) {
    let txt = entries.length + ' ' + (t('res.ok')||'consultados') +
      ' — ' + withPhones.length + ' ' + (t('res.found')||'con numeros');
    if (knownN > 0) txt += ' — ' + knownN + ' ' + (t('res.err')||'con error');
    countEl.textContent = txt;
  }
  if (dlBtn) dlBtn.disabled = entries.length === 0;

  /* Headers con conteos — siempre reconstruir con t() para traduccion correcta */
  if (fndHdr) fndHdr.innerHTML = (t('res.found')||'Con numeros registrados')+' <span id="sec-found-n">('+withPhones.length+')</span>';
  if (okHdr)  okHdr.innerHTML  = (t('res.ok')||'Sin numeros registrados')+' <span id="sec-ok-n">('+noPhones.length+')</span>';
  if (errHdr) errHdr.innerHTML = (t('res.err')||'Portales con error')+' <span id="sec-err-n">('+withErrors.length+')</span>';

  const ttl = await Storage.ttl();
  if (ttlEl) {
    if (ttl > 0) {
      const h=Math.floor(ttl/3600000), m=Math.floor((ttl%3600000)/60000);
      ttlEl.textContent = h + 'h ' + m + 'min';
    } else { ttlEl.textContent = ''; }
  }

  function addRow(container, r, type) {
    const row = mkEl('div','rrow-item'+(type==='found'?' found':''));
    const apiTag = r.via_api ? ' [API]' : '';
    row.appendChild(mkEl('div','rc', r.name + apiTag));
    row.appendChild(mkEl('div','rd', r.date||''));
    if (type==='found')  row.appendChild(mkEl('div','rp', r.phones.join(' — ')));
    else if (type==='error') row.appendChild(mkEl('div','rerr', r.errorMsg||''));
    else row.appendChild(mkEl('div','rn', t('res.ok')));
    if (r.url) {
      const link=mkEl('a','rlink', t('res.verify'));
      link.href=r.url; link.target='_blank'; link.rel='noopener noreferrer';
      row.appendChild(link);
    }
    // Desplegable de compañías incluidas (ej. Altán 67 OMVs)
    if (r.detail) {
      const companies = r.detail.split(', ').filter(Boolean);
      const toggle = mkEl('button','detail-toggle', '▼ Ver ' + companies.length + ' compañías incluidas');
      toggle.style.cssText = 'background:none;border:none;color:#3b82f6;cursor:pointer;font-size:11px;padding:2px 0;text-align:left;';
      const detailDiv = mkEl('div','detail-list', companies.join(' · '));
      detailDiv.style.cssText = 'display:none;font-size:10px;color:#666;margin-top:4px;line-height:1.6;';
      toggle.addEventListener('click', function() {
        const open = detailDiv.style.display !== 'none';
        detailDiv.style.display = open ? 'none' : 'block';
        toggle.textContent = open ? '▼ Ver ' + companies.length + ' compañías incluidas' : '▲ Ocultar compañías';
      });
      row.appendChild(toggle);
      row.appendChild(detailDiv);
    }
    container.appendChild(row);
  }

  withPhones.forEach(r => addRow(secFound,r,'found'));
  noPhones.forEach(r   => addRow(secOk,r,'ok'));
  withErrors.forEach(r => addRow(secErr,r,'error'));
}

/* ── CSV ─────────────────────────────────────────────────── */
async function downloadCSV() {
  const results = await Storage.loadResults();
  const entries = Object.values(results);
  if (!entries.length) return;
  const rows = [['Fecha','Compania','Numeros','Estado','URL'].join(',')];
  entries.forEach(r => {
    const phones = r.found ? r.phones.join(' | ') : '';
    const status = r.status==='error' ? 'Error: '+(r.errorMsg||'') : r.found ? 'Con numeros' : 'Sin numeros';
    rows.push([
      '"'+(r.date||'').replace(/"/g,'""')+'"',
      '"'+(r.name||'').replace(/"/g,'""')+'"',
      '"'+phones.replace(/"/g,'""')+'"',
      '"'+status.replace(/"/g,'""')+'"',
      '"'+(r.url||'').replace(/"/g,'""')+'"',
    ].join(','));
  });
  const blob=new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='crt_lineas_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}

/* ── Manuales ────────────────────────────────────────────── */
function renderSpecials() {
  const container = g('especiales-list');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);
  const manHint = document.querySelector('#t-especiales .hint');
  if (manHint) manHint.textContent = t('man.hint');
  SPECIAL_COMPANIES.forEach(co => {
    const card = mkEl('div','spec-card');
    card.appendChild(mkEl('div','spec-name', co.name));
    /* Usar noteKey para traduccion, fallback a specialNote en ES si no hay clave */
    const noteText = co.noteKey ? t(co.noteKey) : (co.specialNote || '');
    if (noteText) card.appendChild(mkEl('div','spec-note', noteText));
    /* Usar credKey para traduccion */
    const credText = co.credKey ? t(co.credKey) : (co.credentials || '');
    if (credText) {
      const cred = mkEl('div','spec-cred', t('man.needs'));
      cred.appendChild(mkEl('strong','', credText));
      card.appendChild(cred);
    }
    const link=mkEl('a','spec-link', co.url);
    link.href=co.url; link.target='_blank'; link.rel='noopener noreferrer';
    card.appendChild(link);
    container.appendChild(card);
  });
}

/* ── Acerca ──────────────────────────────────────────────── */
function renderAcerca() {
  /* Reconstruir la tabla Acerca completamente con t() */
  const tabla = document.querySelector('.atable');
  if (tabla) {
    tabla.innerHTML = '';
    const rows = [
      [t('about.version') || 'Version',   (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) ? chrome.runtime.getManifest().version : '1.0.4'],
      [t('about.author')  || 'Autor',     'Six-Seven'],
      [t('about.license') || 'Licencia',  t('about.lic.val') || 'MIT — codigo abierto'],
      [t('about.privacy') || 'Privacidad', t('about.priv.val') || 'Sin servidores externos. Todo local. Expira en 24h.'],
      [t('about.code')    || 'Codigo',    null], /* link especial */
    ];
    rows.forEach(([label, val]) => {
      const row = document.createElement('div');
      row.className = 'arow';
      const ak = document.createElement('span');
      ak.className = 'ak';
      ak.textContent = label;
      row.appendChild(ak);
      const av = document.createElement('span');
      av.className = 'av';
      if (val === null) {
        /* Fila Codigo — agregar link */
        const a = document.createElement('a');
        a.href = 'https://github.com/six-seven-or-8/consulta_lineas';
        a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.className = 'alink';
        a.textContent = 'github.com/six-seven-or-8/consulta_lineas';
        av.appendChild(a);
      } else {
        av.textContent = val;
      }
      row.appendChild(av);
      tabla.appendChild(row);
    });
    /* NO agregar fila Nota — fue eliminada por solicitud del usuario */
  }

  /* Labels de donaciones */
  document.querySelectorAll('.dalbl').forEach(el => {
    el.textContent = t('donate.address') || 'Direccion:';
  });
  document.querySelectorAll('.dtrow').forEach(row => {
    const lbl = row.querySelector('.dtlbl');
    const val = row.querySelector('.dtval');
    if (!lbl || !val) return;
    const text = val.textContent.trim();
    /* Determinar tipo por contexto — tag numerico = tag/memo, "No requerido" = memo sin valor */
    if (text === 'No requerido' || text === 'Not required' || text === t('donate.notrequired')) {
      lbl.textContent = t('donate.memo') || 'Memo:';
      val.textContent = t('donate.notrequired') || 'No requerido';
    } else if (lbl.textContent.toLowerCase().includes('memo')) {
      lbl.textContent = t('donate.memoid') || 'Memo ID:';
    } else {
      lbl.textContent = t('donate.tag') || 'Destination Tag:';
    }
  });

  /* Titulos de secciones */
  const titles = document.querySelectorAll('.stitle');
  if (titles[0]) titles[0].textContent = t('about.donate')     || 'Donaciones voluntarias';
  if (titles[1]) titles[1].textContent = t('about.share')      || 'Compartir';
  const subs = document.querySelectorAll('.ssub');
  // Frases rotativas de donación cada 8 segundos
  const donateSub = subs[0];
  if (donateSub) {
    const phrases = t('donation.phrases');
    if (Array.isArray(phrases) && phrases.length > 0) {
      let phraseIdx = Math.floor(Math.random() * phrases.length);
      donateSub.textContent = phrases[phraseIdx];
      if (window._donateInterval) clearInterval(window._donateInterval);
      window._donateInterval = setInterval(function() {
        phraseIdx = (phraseIdx + 1) % phrases.length;
        donateSub.style.opacity = '0';
        setTimeout(function() {
          donateSub.textContent = phrases[phraseIdx];
          donateSub.style.transition = 'opacity 0.5s';
          donateSub.style.opacity = '1';
        }, 300);
      }, 8000);
    } else {
      donateSub.textContent = t('about.donate.sub') || '';
    }
  }
  if (subs[1])   subs[1].textContent   = t('about.share.sub')  || '';

  /* Ko-fi */
  const kofiBtn = document.querySelector('.kofi-btn');
  if (kofiBtn) kofiBtn.textContent = t('about.kofi') || '☕ Apoyar en Ko-fi';

  /* Botones copiar */
  document.querySelectorAll('.bcopy').forEach(btn => {
    btn.textContent = t('about.copy.addr') || 'Copiar direccion';
  });
  document.querySelectorAll('.bctag').forEach((btn, i) => {
    btn.textContent = i === 0
      ? (t('about.copy.tag')  || 'Copiar tag')
      : (t('about.copy.memo') || 'Copiar memo ID');
  });
}

/* ── Resultados controls ─────────────────────────────────── */
function initResultsControls() {
  const dl  = g('btn-dl');
  const clr = g('btn-clrres');
  if (dl)  dl.addEventListener('click', downloadCSV);
  if (clr) clr.addEventListener('click', async () => {
    if (!confirm('Borrar todos los resultados?')) return;
    await Storage.clearSession(); renderResults();
  });
}

/* ── Portapapeles ────────────────────────────────────────── */
function clip(text, msg) {
  const ok = g('copy-ok');
  navigator.clipboard.writeText(text)
    .then(()=>{ if(ok){ok.textContent=msg;setTimeout(()=>{ok.textContent='';},2500);} })
    .catch(()=>{ if(ok){ok.textContent='Selecciona el texto manualmente.';setTimeout(()=>{ok.textContent='';},3000);} });
}
function initCopy() {
  document.querySelectorAll('.bcopy').forEach(btn => {
    btn.addEventListener('click', () => {
      const el=g(btn.dataset.src); if(!el) return;
      clip((el.dataset.a||el.textContent).trim(), t('about.copy.addr')||'Copiado.');
    });
  });
  document.querySelectorAll('.bctag').forEach(btn => {
    btn.addEventListener('click', () => {
      const el=g(btn.dataset.src); if(!el) return;
      const txt=el.textContent.trim(); if(!txt||txt==='No requerido') return;
      clip(txt, t('about.copy.tag')||'Copiado.');
    });
  });
}

/* ── Compartir ───────────────────────────────────────────── */
function initShare() {
  // URL correcta según plataforma
  const isFF = typeof browser !== 'undefined';
  const EXT = isFF
    ? 'https://addons.mozilla.org/en-US/firefox/addon/consulta-lineas-crt/'
    : 'https://chromewebstore.google.com/detail/consulta-lineas-crt/gabgalohhhdicheppchpkdclcfoaieop';
  const RAW = 'Descubre si alguien registro lineas telefonicas a tu nombre sin permiso. ' +
    'Extension gratuita que revisa todos los portales del CRT en Mexico. ' +
    'Protege tu identidad: ' + EXT;
  const MSG = encodeURIComponent(RAW);
  const URL_ = encodeURIComponent(EXT);
  const map = {
    'sh-wa': 'https://api.whatsapp.com/send?text='+MSG,
    'sh-tg': 'https://t.me/share/url?url='+URL_+'&text='+encodeURIComponent(RAW),
    'sh-tw': 'https://twitter.com/intent/tweet?text='+MSG,
    'sh-fb': 'https://www.facebook.com/sharer/sharer.php?u='+URL_,
  };
  Object.entries(map).forEach(([id,href]) => {
    const a=g(id); if(!a) return; a.href=href;
    if(id!=='sh-em'){a.target='_blank';a.rel='noopener noreferrer';}
  });
}

/* ── Idioma ──────────────────────────────────────────────── */
function initLangSelector() {
  const sel = g('lang-sel');
  if (!sel) return;
  try {
    chrome.storage.local.get(['crt67_lang'], r => {
      const saved = r['crt67_lang'] || 'es';
      sel.value = saved;
      if (typeof applyLang === 'function') applyLang(saved);
      /* Esperar a que el DOM este completamente listo antes de aplicar traducciones */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyStaticTranslations();
        });
      });
    });
  } catch(e) {
    requestAnimationFrame(() => applyStaticTranslations());
  }

  sel.addEventListener('change', () => {
    if (typeof applyLang === 'function') applyLang(sel.value);
    /* applyStaticTranslations ya re-renderiza las pestanas activas internamente */
    applyStaticTranslations();
  });
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    initNavTabs();
    initRadios();
    initIdField();
    initChks();
    initClearBtn();
    initStartBtn();
    initProgressControls();
    initResultsControls();
    initCopy();
    initShare();
    initLangSelector(); /* carga idioma y aplica traducciones */
    renderSpecials();
    renderKnownErrors();
    renderAcerca();
    await initSession();
  } catch(err) {
    console.error('[CRT67]', err);
  }
});
