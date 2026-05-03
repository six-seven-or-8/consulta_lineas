/**
 * companies.js - Consulta Lineas CRT
 * Autor: Six-Seven | MIT
 */
'use strict';

const API_COMPANIES = [
  { id: 'weex',       name: 'Weex',                     type_query: 'api_direct', personas: 'todos' },
  { id: 'mobig',      name: 'MoBig',                    type_query: 'api_direct', personas: 'fisica_mx' },
  { id: 'mobig_bien', name: 'MoBig Internet Bienestar', type_query: 'api_direct', personas: 'fisica_mx' },
  { id: 'yo_mobile',  name: 'Yo Mobile',                type_query: 'api_direct', personas: 'fisica_mx' },
  { id: 'ientc',      name: 'IENTC',                    type_query: 'api_direct', personas: 'fisica_mx_moral' },
  { id: 'sorcel',     name: 'Sorcel',                   type_query: 'api_direct', personas: 'fisica_mx_moral' },
];

const WEBVIEW_COMPANIES = [
  {
    id: 'altan', name: 'Altan Redes (~67 companias)',
    type_query: 'webview', personas: 'todos',
    url: 'https://rnu.altanredes.com/consulta',
    detail: '2y2x, Abafon, Abix, Addinteli, AI Telecomm, Appcel, BienCel, Bigcel, Bromovil, CFE Telecom, Chip Macropay, CoolMobile, Comunicaciones Green, Conect2, Diri Movil, ENI Networks, Fangio Mobile, Fibracell, FRC Mobile, Gamers, Gane, Glovo Telecom, Gmovil, Grupo Inten, Hashtag, I AM Abundance, Interlinked, Inxel, Iusatel, Kolors Mobile, Maifon, Mexico Movil, Mexfon, Mi Movil/Altan, MobileArionet, Movired, Movil para Todos, Nabi, Netmas, On-Link, OUI/Altan, Othisi Mobile, PilloFon, Playcell, Red Blak, Red Dog, Redicoppel, Retemex, RETESEC, Rincel, Secure Witness, Sfon, Spot 1, Starline, Telefonica Luna, Telgen, Telmovil, Teracel, TIC-OMV, Tuis, TurboCel, Turbored, Ultracel, Vasanta, VivaMX, Wiki Katat, Wimotelecom, Wiicel, ALLCE',
  },
  { id: 'logistica',    name: 'Dua / Fedego! / Flash Mobile',  type_query: 'webview', personas: 'todos',           url: 'https://consulta.logisticaacn.mx/' },
  { id: 'dalefon',      name: 'Dalefon',                        type_query: 'webview', personas: 'todos',           url: 'https://www.dalefon.mx/vinculatulinea/' },
  { id: 'dalefon_bien', name: 'Dalefon Internet Bienestar',     type_query: 'webview', personas: 'todos',           url: 'https://www.internetbienestarmex.com/vinculatulinea/' },
  { id: 'redphone',     name: 'Redphone',                       type_query: 'webview', personas: 'fisica_mx_moral', url: 'https://vinculacion.redphone.com.mx/consulta' },
  { id: 'virgin',       name: 'Virgin Mobile',                  type_query: 'webview', personas: 'fisica_mx',       url: 'https://virginmobile.mx/v1/consultatulinea' },
  { id: 'mi_movil',     name: 'Mi Movil',                       type_query: 'webview', personas: 'fisica_mx_moral', url: 'https://vinculacion.mimovil.com.mx/consulta' },
  { id: 'mirlo',        name: 'Mirlo',                          type_query: 'webview', personas: 'fisica_mx_moral', url: 'https://mirlo.com/vinculatulinea' },
  { id: 'mosi',         name: 'Mosi',                           type_query: 'webview', personas: 'fisica_mx_moral', url: 'https://vinculacion.mosi.mx/consulta' },
  { id: 'oxio',         name: 'Oxio',                           type_query: 'webview', personas: 'fisica_mx',       url: 'https://verificar.oxiomobile.com/consultatuslineas' },
  { id: 'bait',         name: 'Bait',                           type_query: 'webview', personas: 'fisica_mx',       url: 'https://btz.mx/consultaregistro' },
];

const ACTIVE_COMPANIES = [...API_COMPANIES, ...WEBVIEW_COMPANIES];

function filterCompaniesByUser(tipo, ciudadania) {
  const seen = new Set();
  return ACTIVE_COMPANIES.filter(co => {
    let ok = false;
    if (co.personas === 'todos') ok = true;
    else if (co.personas === 'fisica_mx')       ok = (tipo === 'fisica' && ciudadania === 'mexicano');
    else if (co.personas === 'fisica_mx_moral') ok = (tipo === 'fisica' && ciudadania === 'mexicano') || tipo === 'moral';
    if (!ok) return false;
    const key = co.url || co.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const SPECIAL_COMPANIES = [
  { id: 'att',       name: 'AT&T / Unefon / WIM',    url: 'https://att.com.mx/controlpersonal/',
    noteKey: 'man.note.webcomp',
    credKey: 'man.cred.curp_slider' },
  { id: 'abib',      name: 'Abib',                    url: 'https://abib.com.mx/#/consultatuslineas',
    noteKey: 'man.note.phone_abib', credKey: 'man.cred.phone_abib' },
  { id: 'abib_b',    name: 'Abib Internet Bienestar', url: 'https://www.abibinternetdelbienestar.mx/consultatulinea',
    noteKey: 'man.note.phone_abib_bien', credKey: 'man.cred.phone_abib_bien' },
  { id: 'bestel',    name: 'Bestel / Cablecom',       url: 'https://facturacion.bestel.com.mx/',
    noteKey: 'man.note.user_pass', credKey: 'man.cred.user_pass_bestel' },
  { id: 'dialo',     name: 'Dialo',                   url: 'https://dialo.mx/vinculatulinea/consulta.html',
    noteKey: 'man.note.email_curp', credKey: 'man.cred.curp_email' },
  { id: 'izzi',      name: 'Izzi',                    url: 'https://www.izzi.mx/login',
    noteKey: 'man.note.user_pass', credKey: 'man.cred.user_pass_izzi' },
  { id: 'movistar',  name: 'Telefonica Movistar',     url: 'https://www.movistar.com.mx/consulta-tu-linea',
    noteKey: 'man.note.id_oficial', credKey: 'man.cred.id_oficial' },
  { id: 'rdph_k',    name: 'Redphone Koonol',         url: 'https://redphone.vinculacion.koonolmexico.com/session/new',
    noteKey: 'man.note.user_pass', credKey: 'man.cred.user_pass_redphone' },
  { id: 'sky',       name: 'Sky',                     url: 'https://micuenta.sky.com.mx/login',
    noteKey: 'man.note.user_pass', credKey: 'man.cred.user_pass_sky' },
  { id: 'telcel',    name: 'Telcel',                  url: 'https://registro.telcel.com/vinculatulinea',
    noteKey: 'man.note.biometrico', credKey: 'man.cred.biometrico' },
  { id: 'tokamovil', name: 'Tokamovil',               url: 'https://tokamovil.mx/cumplimiento/consulta-vinculacion/',
    noteKey: 'man.note.email_vinc', credKey: 'man.cred.email_vinc' },
  { id: 'yu_movil',  name: 'Yu Movil',                url: 'https://www.yumovil.com.mx/login',
    noteKey: 'man.note.user_pass', credKey: 'man.cred.user_pass_yumovil' },
];

const ERROR_COMPANIES = [
  { id: 'beneleit',       name: 'Beneleit Movil',               personas: 'fisica_mx', url: 'https://beneleit.mx/consultalineas/',                      errKey: 'err.proximamente',  knownSince: '28/04/2026' },
  { id: 'link_movil',     name: 'Link Movil',                   personas: 'fisica_mx', url: 'https://movil.linkteconectamos.com/consultar-vinculacion/', errKey: 'err.timeout',                        knownSince: '28/04/2026' },
  { id: 'mega_movil',     name: 'Mega Movil',                   personas: 'fisica_mx', url: 'https://consultavinculacion.megamovil.mx/',                 errKey: 'err.403',                            knownSince: '28/04/2026' },
  { id: 'newww',          name: 'Newww',                        personas: 'fisica_mx', url: 'https://consultavinculacion.newww.mx/',                     errKey: 'err.timeout',                        knownSince: '28/04/2026' },
  { id: 'nextor',         name: 'Nextor Movil',                 personas: 'fisica_mx', url: 'https://vinculacion.nextormovil.mx/',                       errKey: 'err.timeout',                        knownSince: '28/04/2026' },
  { id: 'red_aguila',     name: 'Red Aguila',                   personas: 'fisica_mx', url: 'https://consultavinculacion.redaguila.com.mx/',             errKey: 'err.timeout',                        knownSince: '28/04/2026' },
  { id: 'viralcel',       name: 'Viral Cel',                    personas: 'fisica_mx', url: 'https://www.viralcel.com/mi-linea',                         errKey: 'err.403',                            knownSince: '28/04/2026' },
  { id: 'wiicel_ind',     name: 'Wiicel (portal propio)',       personas: 'fisica_mx', url: 'https://wiicel.com/',                                       errKey: 'err.522',        knownSince: '28/04/2026' },
  { id: 'v_ahorrocel',    name: 'AhorroCel (VinculaTuLinea)',   personas: 'fisica_mx', url: 'https://vinculatulinea.com/Ahorrocel',                      errKey: 'err.403_vtl',               knownSince: '28/04/2026' },
  { id: 'v_chedraui',     name: 'Chedraui Movil (VinculaTuLinea)', personas: 'fisica_mx', url: 'https://vinculatulinea.com/Chedrauimovil',              errKey: 'err.403_vtl',               knownSince: '28/04/2026' },
  { id: 'v_freedompop',   name: 'Freedompop (VinculaTuLinea)', personas: 'fisica_mx', url: 'https://vinculatulinea.com/Freedompop',                      errKey: 'err.403_vtl',               knownSince: '28/04/2026' },
  { id: 'v_oxxocel',      name: 'OXXO CEL (VinculaTuLinea)',   personas: 'fisica_mx', url: 'https://vinculatulinea.com/Oxxocel',                        errKey: 'err.403_vtl',               knownSince: '28/04/2026' },
  { id: 'v_oui',          name: 'OUI (VinculaTuLinea)',         personas: 'fisica_mx', url: 'https://vinculatulinea.com/oui/welcome',                    errKey: 'err.403_vtl',               knownSince: '28/04/2026' },
  { id: 'v_ubercel',      name: 'Uber Cel (VinculaTuLinea)',    personas: 'fisica_mx', url: 'https://vinculatulinea.com/Ubercel',                        errKey: 'err.403_vtl',               knownSince: '28/04/2026' },
  { id: 'v_yobi',         name: 'Yobi Telecom (VinculaTuLinea)', personas: 'fisica_mx', url: 'https://vinculatulinea.com/YobiTelecom',                  errKey: 'err.403_vtl',               knownSince: '28/04/2026' },
];
