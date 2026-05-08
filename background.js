/**
 * background.js - Consulta Lineas CRT  v17
 * Autor: Six-Seven | MIT
 *
 * Altán usa Proof-of-Work (no CAPTCHA visual):
 *   1. POST /api/mx/captcha/a92a56476f/challenge  → {challenge:{c,s,d}, token}
 *   2. Resolver: generar c soluciones con LCG seeded por s
 *   3. POST /api/mx/captcha/a92a56476f/redeem {token, solutions} → captchaToken
 *   4. GET /_serverFn/[hash]?payload=...  (payload incluye captchaToken)
 *
 * Hashes verificados 03/05/2026:
 *   fisica/extranjero: be0aebbc40b7f89dcde6ed49a1fdaffb199dd02f87e1de771662e51d6e55c421
 *   moral (RFC):       6d0eb5400c2d97b658cb74bfd3f3ff370f64d107b961c41b8a79c14d6dfe6c49
 */
'use strict';

const ALTAN_BASE       = 'https://rnu.altanredes.com';
const ALTAN_CAPTCHA_ID = 'a92a56476f';
const ALTAN_HASH_FISICA = 'be0aebbc40b7f89dcde6ed49a1fdaffb199dd02f87e1de771662e51d6e55c421';
const ALTAN_HASH_MORAL  = '6d0eb5400c2d97b658cb74bfd3f3ff370f64d107b961c41b8a79c14d6dfe6c49';

/* ── Guardar resultado ─────────────────────────────────────── */
async function saveResult(id, name, phones, status, errorMsg, detail) {
  const r = await chrome.storage.local.get(['crt67_res']);
  const results = r['crt67_res'] || {};
  results[id] = {
    id, name,
    phones:   phones   || [],
    found:    Array.isArray(phones) && phones.length > 0,
    url:      '',
    status:   status   || 'ok',
    errorMsg: errorMsg || '',
    detail:   detail   || '',
    ts:       Date.now(),
    date:     new Date().toLocaleString('es-MX'),
    via_api:  true,
  };
  await chrome.storage.local.set({ 'crt67_res': results });
}

/* ── Proof of Work de Altán ────────────────────────────────── */
function solveAltanChallenge(challenge) {
  const { c, s, d } = challenge;
  const solutions = [];
  /* LCG — mismo que usa el frontend de Altán (verificado por análisis de HAR) */
  let state = s >>> 0;
  const A = 1664525;
  const C = 1013904223;
  const M = 0x100000000;
  for (let i = 0; i < c; i++) {
    state = (Math.imul(A, state) + C) >>> 0;
    solutions.push(Math.floor((state / M) * (25000 / Math.max(d, 1))));
  }
  return solutions;
}

async function getAltanCaptchaToken() {
  const chalResp = await fetch(
    `${ALTAN_BASE}/api/mx/captcha/${ALTAN_CAPTCHA_ID}/challenge`,
    { method: 'POST', headers: { 'Accept': '*/*', 'Origin': ALTAN_BASE } }
  );
  if (!chalResp.ok) throw new Error('challenge HTTP ' + chalResp.status);
  const { challenge, token } = await chalResp.json();
  const solutions = solveAltanChallenge(challenge);

  const redeemResp = await fetch(
    `${ALTAN_BASE}/api/mx/captcha/${ALTAN_CAPTCHA_ID}/redeem`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': '*/*', 'Origin': ALTAN_BASE },
      body: JSON.stringify({ token, solutions }),
    }
  );
  if (!redeemResp.ok) throw new Error('redeem HTTP ' + redeemResp.status);
  const data = await redeemResp.json();
  if (!data.success) throw new Error('captcha redeem failed');
  return data.token;
}

function buildAltanPayload(user, captchaToken, sessionId) {
  const isMoral = user.tipo === 'moral';
  const isExt   = user.ciudadania === 'extranjero';
  const id      = user.identificador.toUpperCase();

  if (isMoral) {
    return { t:{ t:10,i:0,p:{ k:['data'],v:[{
      t:10,i:1,p:{ k:['rfc','page','captchaToken','clientSessionId'],
        v:[{t:1,s:id},{t:0,s:1},{t:1,s:captchaToken},{t:1,s:sessionId}]
      },o:0}]},o:0},f:63,m:[] };
  }
  const curpVal = isExt ? {t:2,s:1} : {t:1,s:id};
  const passVal = isExt ? {t:1,s:id} : {t:2,s:1};
  return { t:{ t:10,i:0,p:{ k:['data'],v:[{
    t:10,i:1,p:{ k:['personType','citizenship','curp','passportNumber','page','captchaToken','clientSessionId'],
      v:[{t:1,s:'physical'},{t:1,s:isExt?'foreign':'mexican'},
         curpVal,passVal,{t:0,s:1},{t:1,s:captchaToken},{t:1,s:sessionId}]
    },o:0}]},o:0},f:63,m:[] };
}

function extractAltanPhones(data) {
  const phones = [];
  const re = /^\d{10}$/;
  function walk(obj) {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string' && re.test(obj)) { phones.push(obj); return; }
    if (typeof obj === 'number' && re.test(String(obj))) { phones.push(String(obj)); return; }
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (typeof obj === 'object') Object.values(obj).forEach(walk);
  }
  walk(data);
  return [...new Set(phones)];
}

async function queryAltan(user) {
  try {
    const captchaToken = await getAltanCaptchaToken();
    const sessionId    = crypto.randomUUID();
    const hash         = user.tipo === 'moral' ? ALTAN_HASH_MORAL : ALTAN_HASH_FISICA;
    const payload      = buildAltanPayload(user, captchaToken, sessionId);

    const resp = await fetch(
      `${ALTAN_BASE}/_serverFn/${hash}?payload=${encodeURIComponent(JSON.stringify(payload))}`,
      { headers: { 'Accept': 'application/x-tss-framed, application/x-ndjson, application/json', 'Origin': ALTAN_BASE } }
    );
    if (resp.status === 404 || resp.status === 400) {
      return { ok: false, fallback: true, error: 'hash_changed' };
    }
    if (!resp.ok) throw new Error('HTTP ' + resp.status);

    const data   = await resp.json();
    const phones = extractAltanPhones(data);
    await saveResult('altan', 'Altan Redes (~67 companias)', phones, 'ok', '', '2y2x, Abafon, Abix, Addinteli, AI Telecomm, Appcel, BienCel, Bigcel, Bromovil, CFE Telecom, Chip Macropay, CoolMobile, Comunicaciones Green, Conect2, Diri Movil, ENI Networks, Fangio Mobile, Fibracell, FRC Mobile, Gamers, Gane, Glovo Telecom, Gmovil, Grupo Inten, Hashtag, I AM Abundance, Interlinked, Inxel, Iusatel, Kolors Mobile, Maifon, Mexico Movil, Mexfon, Mi Movil/Altan, MobileArionet, Movired, Movil para Todos, Nabi, Netmas, On-Link, OUI/Altan, Othisi Mobile, PilloFon, Playcell, Red Blak, Red Dog, Redicoppel, Retemex, RETESEC, Rincel, Secure Witness, Sfon, Spot 1, Starline, Telefonica Luna, Telgen, Telmovil, Teracel, TIC-OMV, Tuis, TurboCel, Turbored, Ultracel, Vasanta, VivaMX, Wiki Katat, Wimotelecom, Wiicel, ALLCE');
    return { ok: true };
  } catch (err) {
    return { ok: false, fallback: true, error: err.message };
  }
}

/* ── Weex ──────────────────────────────────────────────────── */
async function queryWeex(user) {
  try {
    let documentType = 1;
    if (user.tipo === 'moral')                 documentType = 3;
    else if (user.ciudadania === 'extranjero') documentType = 2;
    const resp = await fetch('https://app.weex.mx/ServiceLayer/Legislacion?ex=getDnActiveLines', {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ documentType, searchData: user.identificador.toUpperCase() }),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data   = await resp.json();
    const lines  = (data?.obj?.dnActiveByCurpRfc) || [];
    const phones = lines
      .map(l => typeof l === 'string' ? l : (l.dn || l.numero || l.phone || ''))
      .map(s => s.replace(/\D/g, '')).filter(s => s.length === 10);
    await saveResult('weex', 'Weex', phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

/* ── MoBig ─────────────────────────────────────────────────── */
async function queryMobig(id, name, baseUrl, user) {
  try {
    const endpoint = baseUrl.includes('femaseisa') ? baseUrl + 'api/vinculacion/search-by-curp' : baseUrl + 'consulta-curp';
    const resp = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ curp: user.identificador.toUpperCase() }),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data   = await resp.json();
    const lines  = data?.data || [];
    const phones = lines
      .map(l => typeof l === 'string' ? l : (l.dn || l.numero || l.phone || ''))
      .map(s => s.replace(/\D/g, '')).filter(s => s.length === 10);
    await saveResult(id, name, phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

/* ── Yo Mobile ─────────────────────────────────────────────── */
async function queryYoMobile(user) {
  try {
    const encId = encodeURIComponent(user.identificador.toUpperCase());
    const resp  = await fetch(
      'https://play.prod.yomobile.xyz/api/v1.0/crm/lines/by-personal-id/' + encId + '/',
      { headers: { 'Accept': 'application/json' } }
    );
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data   = await resp.json();
    const lines  = data?.results || [];
    const phones = lines
      .map(l => typeof l === 'string' ? l : (l.dn || l.number || l.phone || ''))
      .map(s => s.replace(/\D/g, '')).filter(s => s.length === 10);
    await saveResult('yo_mobile', 'Yo Mobile', phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

/* ── IENTC ─────────────────────────────────────────────────── */
const IENTC_BASIC = 'N3U4ZThyNjF0OGwwbnRmZ3I5dmozaWhpN2U6a3FvYzNoYzIyZW9nYmVlazdyZWVzNnZqMW81cHFhMzlxcjg4aWVmZ3A3YT==';

async function queryIentc(user) {
  try {
    const tr = await fetch('https://api-iso-prod.ientc.dev/auth/jwt/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + IENTC_BASIC, 'Accept': 'application/json' },
      body: 'grant_type=client_credentials',
    });
    if (!tr.ok) throw new Error('token HTTP ' + tr.status);
    const { access_token } = await tr.json();
    if (!access_token) throw new Error('no token');

    const param = user.tipo === 'moral' ? 'rfc' : 'curp';
    const resp  = await fetch(
      'https://api-iso-prod.ientc.dev/vinculacion/number/get-phones?' + param + '=' + encodeURIComponent(user.identificador.toUpperCase()),
      { headers: { 'Authorization': 'Bearer ' + access_token, 'Accept': 'application/json' } }
    );
    if (resp.status === 404) { await saveResult('ientc', 'IENTC', [], 'ok', ''); return { ok: true }; }
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data   = await resp.json();
    const raw    = Array.isArray(data) ? data : (data?.phones || data?.lines || []);
    const phones = raw.map(l => typeof l === 'string' ? l : (l.dn || l.numero || l.phone || ''))
      .map(s => s.replace(/\D/g, '')).filter(s => s.length === 10);
    await saveResult('ientc', 'IENTC', phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

/* ── Sorcel ────────────────────────────────────────────────── */
async function querySorcel(user) {
  try {
    const resp = await fetch('https://www.soriup.mx/consultaR.asp', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'curpa=' + encodeURIComponent(user.identificador.toUpperCase()),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const html   = await resp.text();
    const phones = [...new Set((html.match(/\b\d{10}\b/g) || []))];
    await saveResult('sorcel', 'Sorcel', phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}


/* ── Megamóvil ─────────────────────────────────────────────── */
async function queryMegamovil(user) {
  try {
    const id = encodeURIComponent(user.identificador.toUpperCase());
    const resp = await fetch('https://consultavinculacion.megamovil.mx/validaCURP?curp=' + id, {
      headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const lines = data?.lines || data?.data || data?.subscriptions || [];
    const phones = (Array.isArray(lines) ? lines : [])
      .map(l => typeof l === 'string' ? l : (l.msisdn || l.numero || l.phone || ''))
      .map(s => s.replace(/\D/g, '')).filter(s => s.length === 10);
    await saveResult('megamovil', 'Megamóvil', phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

/* ── core.newww.mx (Link Móvil / Newww / Red Águila) ────────── */
async function queryCoreNewww(id, name, brand, user) {
  try {
    const curp = encodeURIComponent(user.identificador.toUpperCase());
    const resp = await fetch(
      'https://core.newww.mx/api/core/consulta_lineas_vinculacion?curp=' + curp + '&brand=' + brand,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const lines = data?.lines || data?.data || [];
    const phones = (Array.isArray(lines) ? lines : [])
      .map(l => typeof l === 'string' ? l : (l.msisdn || l.numero || l.phone || ''))
      .map(s => s.replace(/\D/g, '')).filter(s => s.length === 10);
    await saveResult(id, name, phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

/* ── Logística ACN (Dua / Fedego! / Flash Mobile) ────────────── */
async function queryLogistica(user) {
  try {
    const id = encodeURIComponent(user.identificador.toUpperCase());
    const resp = await fetch('https://ku.diri.mx/consultaRNU/' + id, {
      headers: { 'Accept': 'application/json', 'Origin': 'https://consulta.logisticaacn.mx' }
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const arr = await resp.json();
    const phones = (Array.isArray(arr) ? arr : [])
      .map(item => typeof item === 'string' ? item : (item.msisdn || item.numero || ''))
      .map(s => s.replace(/\D/g, '')).filter(s => s.length === 10);
    await saveResult('logistica', 'Dua / Fedego! / Flash Mobile', phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

/* ── Mirlo ─────────────────────────────────────────────────── */
async function queryMirlo(user) {
  try {
    const idType = user.tipoPersona === 'moral' ? 'by-rfc' : 'by-curp';
    const resp = await fetch(
      'https://apib.mirlo.com/api/v1/regulation/query/' + idType + '/' + user.identificador.toUpperCase(),
      { headers: { 'Accept': 'application/json' } }
    );
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const lines = data?.lines || data?.subscriptions || data?.data || [];
    const phones = (Array.isArray(lines) ? lines : [])
      .map(l => typeof l === 'string' ? l : (l.msisdn || l.numero || l.phone || ''))
      .map(s => s.replace(/\D/g, '')).filter(s => s.length === 10);
    await saveResult('mirlo', 'Mirlo', phones, 'ok', '');
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

/* ── Dispatcher ────────────────────────────────────────────── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'RUN_API_QUERIES') {
    const { user, companies } = msg;
    Promise.all(companies.map(async co => {
      try {
        switch (co.id) {
          case 'altan':      return await queryAltan(user);
          case 'weex':       return await queryWeex(user);
          case 'mobig':      return await queryMobig('mobig',      'MoBig',                    'https://mobig.mx/vinculatulinea/',      user);
          case 'mobig_bien': return await queryMobig('mobig_bien', 'MoBig Internet Bienestar', 'https://femaseisa.com/', user);
          case 'yo_mobile':  return await queryYoMobile(user);
          case 'ientc':      return await queryIentc(user);
          case 'sorcel':     return await querySorcel(user);
          case 'megamovil':   return await queryMegamovil(user);
          case 'logistica':   return await queryLogistica(user);
          case 'mirlo':       return await queryMirlo(user);
          case 'link_movil':  return await queryCoreNewww('link_movil',  'Link Móvil',  'lm', user);
          case 'newww':       return await queryCoreNewww('newww',       'Newww',       'nw', user);
          case 'red_aguila':  return await queryCoreNewww('red_aguila',  'Red Águila',  'ra', user);
          default:           return { ok: false, error: 'unknown: ' + co.id };
        }
      } catch (e) { return { ok: false, error: e.message }; }
    })).then(results => sendResponse({ ok: true, results }));
    return true;
  }

  if (msg.type === 'QUERY_RESULT') {
    chrome.storage.local.get(['crt67_res'], r => {
      const res = r['crt67_res'] || {};
      res[msg.companyId] = {
        id: msg.companyId, name: msg.companyName,
        phones: msg.phones || [], found: Array.isArray(msg.phones) && msg.phones.length > 0,
        url: msg.url || '', status: msg.status || 'ok', errorMsg: msg.errorMsg || '',
        detail: msg.detail || '',
        ts: Date.now(), date: new Date().toLocaleString('es-MX'),
      };
      chrome.storage.local.set({ 'crt67_res': res });
    });
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
