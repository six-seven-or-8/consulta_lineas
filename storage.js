/**
 * storage.js - Consulta Lineas CRT
 * Autor: Six-Seven | MIT
 * Almacenamiento local con TTL de 24 horas.
 */
'use strict';

const _P   = 'crt67_';
const _TTL = 86400000;
const K = {
  USER:'crt67_user', USER_TS:'crt67_uts',
  RESULTS:'crt67_res', SESS_TS:'crt67_sts',
  LAST_IDX:'crt67_idx', SESS_ON:'crt67_on',
};

const _g = k => new Promise((r,e) => chrome.storage.local.get(k, d => chrome.runtime.lastError ? e() : r(d)));
const _s = o => new Promise((r,e) => chrome.storage.local.set(o, () => chrome.runtime.lastError ? e() : r()));
const _d = k => new Promise((r,e) => chrome.storage.local.remove(k, () => chrome.runtime.lastError ? e() : r()));
const _exp = ts => !ts || Date.now()-ts > _TTL;

const Storage = {
  async saveUserData(d)  { await _s({[K.USER]:d,[K.USER_TS]:Date.now()}); },
  async clearUserData()  { await _d([K.USER,K.USER_TS]); },
  async loadUserData()   {
    const r=await _g([K.USER,K.USER_TS]);
    if(!r[K.USER]||_exp(r[K.USER_TS])){ await _d([K.USER,K.USER_TS]); return null; }
    return r[K.USER];
  },
  async startSession()   { await _s({[K.RESULTS]:{},[K.SESS_TS]:Date.now(),[K.LAST_IDX]:0,[K.SESS_ON]:true}); },
  async checkSession()   {
    const r=await _g([K.SESS_ON,K.SESS_TS,K.LAST_IDX,K.RESULTS]);
    const on=r[K.SESS_ON]===true, ts=r[K.SESS_TS], idx=r[K.LAST_IDX]||0;
    const count=Object.keys(r[K.RESULTS]||{}).length;
    if(!on||_exp(ts)){ if(on)await this.clearSession(); return{exists:false,lastIndex:0,count}; }
    return{exists:true,lastIndex:idx,count};
  },
  async saveResult(id, name, phones, url, status, errorMsg) {
    const r   = await _g([K.RESULTS]);
    const res = r[K.RESULTS] || {};
    res[id]   = {
      id, name,
      phones:   phones   || [],
      found:    phones && phones.length > 0,
      url:      url      || '',
      status:   status   || 'ok',
      errorMsg: errorMsg || '',
      ts:       Date.now(),
      date:     new Date().toLocaleString('es-MX'),
    };
    await _s({ [K.RESULTS]: res });
  },
  async setIndex(i)      { await _s({[K.LAST_IDX]:i}); },
  async doneSession()    { await _s({[K.SESS_ON]:false}); },
  async loadResults()    {
    const r=await _g([K.RESULTS,K.SESS_TS]);
    if(_exp(r[K.SESS_TS])){ await this.clearSession(); return{}; }
    return r[K.RESULTS]||{};
  },
  async clearSession()   { await _d([K.RESULTS,K.SESS_TS,K.LAST_IDX,K.SESS_ON]); },
  async clearAll()       { await _d(Object.values(K)); },
  async expire()         {
    const r=await _g([K.USER_TS,K.SESS_TS]);
    if(_exp(r[K.USER_TS])) await _d([K.USER,K.USER_TS]);
    if(_exp(r[K.SESS_TS])) await this.clearSession();
  },
  async ttl()            {
    const r=await _g([K.USER_TS]);
    if(!r[K.USER_TS]) return 0;
    const rem=_TTL-(Date.now()-r[K.USER_TS]);
    return rem>0?rem:0;
  },
};
