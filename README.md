# Consulta Lineas CRT

Extension de navegador para verificar si existen lineas telefonicas registradas
a tu nombre en los portales oficiales del CRT (Consejo de Regulacion de
Telecomunicaciones) de Mexico.

Browser extension to verify whether phone lines are registered under your name
in the official CRT (Telecommunications Regulation Council) portals in Mexico.

**Autor / Author:** Six-Seven  
**Licencia / License:** MIT  
**Version:** 1.0.0  
**Donaciones / Donations:** [ko-fi.com/sixseven8](https://ko-fi.com/sixseven8)

---

## Por que existe esta extension / Why this extension exists

El CRT obliga a las companias telefonicas a publicar portales donde cualquier
ciudadano puede verificar si alguien registro lineas a su nombre sin su
consentimiento. El problema: hay mas de 40 portales activos y cada uno requiere
ingresar los mismos datos (CURP, tipo de persona, aceptar terminos) una y otra vez.

Esta extension permite hacer todas las consultas con los datos ingresados una sola vez.


The CRT requires telecom companies to publish portals where any citizen can verify
if someone registered phone lines in their name without consent. The problem: there
are over 40 active portals and each requires entering the same data (CURP, person
type, accepting terms) over and over.

This extension allows doing all queries with data entered just once.

---

## Lo que esta extension te ahorra / What this extension saves you

Sin esta extension, el proceso manual de consulta implica:

- Visitar el portal del CRT: [portal.crt.gob.mx/plataformas-de-consulta-de-las-companias-telefonicas](https://portal.crt.gob.mx/plataformas-de-consulta-de-las-companias-telefonicas)
- Revisar mas de **100 enlaces** listados
- Determinar manualmente cuales estan activos y cuales tienen errores
- Identificar cuales aceptan CURP, cuales RFC, cuales numero de pasaporte
- Ingresar tus datos en cada portal individualmente
- Resolver un CAPTCHA diferente en cada uno
- Registrar manualmente los resultados de cada consulta

**Con esta extension:**

- Ingresas tus datos **una sola vez**
- La extension consulta automaticamente todos los portales compatibles con tu tipo de persona
- Varios portales son consultados via API directa, **sin abrir ninguna pestaña** y sin CAPTCHA
- Los resultados se consolidan en una sola pantalla con exportacion a CSV
- Los portales con error conocido se muestran claramente con instrucciones para consultarlos manualmente
- Los portales que requieren credenciales adicionales estan documentados en la pestana Manuales

Without this extension, the manual query process involves:

- Visiting the CRT portal with over **100 links** listed
- Manually determining which are active and which have errors
- Identifying which accept CURP, RFC, or passport number
- Entering your data individually in each portal
- Solving a different CAPTCHA in each one
- Manually recording each result

**With this extension:** enter your data once, get all results automatically.

---

## Portales cubiertos / Covered portals

### Consulta via API directa (sin abrir pestana, sin CAPTCHA)
Estos portales son consultados directamente desde la extension sin intervencion del usuario:

| Portal | Tipos aceptados |
|---|---|
| Altan Redes (~67 OMVs) | CURP / RFC / Pasaporte |
| Weex | CURP / RFC / Pasaporte |
| MoBig / MoBig Bienestar | CURP |
| Yo Mobile | CURP |
| IENTC | CURP / RFC |
| Sorcel | CURP |

> **Nota tecnica:** `rnu.altanredes.com/consulta` cubre ~67 companias OMV de la red Altan
> en una sola consulta. Confirmado por analisis de payload de red: el request no contiene
> campo de compania, el servidor devuelve resultados de todas las OMVs asociadas.

### Consulta con CAPTCHA (el usuario resuelve el CAPTCHA, la extension rellena los datos)

| Portal | Tipos aceptados |
|---|---|
| Dalefon | CURP / RFC / Pasaporte |
| Dalefon Internet Bienestar | CURP / RFC / Pasaporte |
| Logistica ACN (Dua/Fedego/Flash) | CURP / Pasaporte |
| Redphone | CURP / RFC / Pasaporte |
| Mi Movil | CURP / RFC / Pasaporte |
| Mosi | CURP / RFC / Pasaporte |
| Mirlo | CURP / RFC |
| Oxio | CURP |
| AT&T / Unefon / WIM | CURP |
| Bait | CURP |
| Virgin Mobile | CURP |

### Portales manuales (requieren credenciales adicionales)
Ver pestana **Manuales** en la extension para instrucciones de cada uno.

### Portales con error conocido (desde 28/04/2026)
Se muestran en la pestana Resultados con fecha del error y enlace para verificar
manualmente cuando esten operativos. Six-Seven los monitorea constantemente.

---

## Instalacion / Installation

### Google Chrome — instalacion manual (modo desarrollador)

**Opcion A — desde el ZIP pre-compilado:**

1. Descarga `crt-lineas-chrome.zip` y descomprimelo en una carpeta
2. Abre Chrome y ve a `chrome://extensions`
3. Activa **Modo desarrollador** (esquina superior derecha)
4. Haz clic en **Cargar extension descomprimida**
5. Selecciona la carpeta descomprimida
6. El icono 6-7 aparecera en la barra de herramientas

**Opcion B — desde el codigo fuente (`crt-lineas-source.zip`):**

1. Descarga y descomprime `crt-lineas-source.zip`
2. Dentro encontraras `manifest-chrome.json` y `manifest-firefox.json`
3. **Renombra `manifest-chrome.json` a `manifest.json`** (elimina o ignora el de Firefox)
4. Abre Chrome → `chrome://extensions` → Modo desarrollador → Cargar extension descomprimida
5. Selecciona la carpeta

### Mozilla Firefox — instalacion manual (temporal)

**Opcion A — desde el ZIP pre-compilado:**

1. Descarga `crt-lineas-firefox.zip`
2. Abre Firefox y ve a `about:debugging#/runtime/this-firefox`
3. Haz clic en **Cargar complemento temporal**
4. Selecciona el archivo `manifest.json` dentro del ZIP descomprimido

**Opcion B — desde el codigo fuente (`crt-lineas-source.zip`):**

1. Descarga y descomprime `crt-lineas-source.zip`
2. **Renombra `manifest-firefox.json` a `manifest.json`** (elimina o ignora el de Chrome)
3. Abre Firefox → `about:debugging#/runtime/this-firefox` → Cargar complemento temporal
4. Selecciona el archivo `manifest.json` dentro de la carpeta

> La instalacion temporal en Firefox se elimina al cerrar el navegador.
> Para instalacion permanente usa Firefox Add-ons (AMO) cuando este disponible.

---

## Uso / Usage

### Paso 1 — Ingresa tus datos

Haz clic en el icono 6-7 en la barra de herramientas. En la pestana **Inicio**:

- **Tipo de persona:** Fisica o Moral
- **Ciudadania:** Mexicano o Extranjero (solo para fisicas)
- **Identificador:**
  - Persona fisica mexicana → **CURP** (18 caracteres)
  - Persona fisica extranjera → **Numero de Pasaporte**
  - Persona moral → **RFC** (12-13 caracteres)
- Acepta Terminos y Aviso de Privacidad
- Haz clic en **Comenzar consulta**

La extension filtra automaticamente los portales compatibles con tu tipo de persona.

### Paso 2 — Consultas automaticas via API

Inmediatamente al iniciar, la extension consulta en segundo plano (sin abrir pestanas)
los portales que tienen API directa. Los resultados aparecen solos en la pestana
**Resultados** en segundos.

### Paso 3 — Portales con CAPTCHA

La extension abre los portales restantes en grupos de 5 pestanas con los datos
ya prellenados. Solo tienes que:

1. Resolver el CAPTCHA en cada pestana
2. Hacer clic en **Buscar** o **Consultar**
3. Los portales sin CAPTCHA se cierran solos al terminar
4. Cuando termines con un grupo, pulsa **Continuar** en el popup

### Paso 4 — Revisa los resultados

Ve a la pestana **Resultados**. Los resultados estan divididos en:

- **Con numeros registrados** — portales donde se encontraron lineas
- **Sin numeros registrados** — portales sin resultados
- **Portales con error** — errores detectados en tiempo real
- **Portales con error conocido** — errores confirmados previamente, categorizados por tipo de persona

Haz clic en **Descargar CSV** para exportar.

### Paso 5 — Portales manuales

Ve a la pestana **Manuales** para los portales que requieren datos adicionales
(usuario, contrasena, correo, identificacion oficial). Cada tarjeta incluye
instrucciones y enlace directo.

---

## Mejoras tecnicas / Technical improvements

Esta extension utiliza llamadas directas a las APIs de los portales cuando estas
estan disponibles, eliminando la necesidad de abrir pestanas y resolver CAPTCHAs:

| Portal | Endpoint API | Metodo |
|---|---|---|
| Altan (~67 OMVs) | `rnu.altanredes.com/_serverFn/[hash]` | POST JSON |
| Weex | `app.weex.mx/ServiceLayer/Legislacion?ex=getDnActiveLines` | POST JSON |
| MoBig | `mobig.mx/api/vinculacion/search-by-curp` | POST JSON |
| Yo Mobile | `play.prod.yomobile.xyz/api/v1.0/crm/lines/by-personal-id/[ID]/` | GET |
| IENTC | `api-iso-prod.ientc.dev/vinculacion/number/get-phones` | GET + Bearer |
| Sorcel | `soriup.mx/consultaR.asp` | POST form |

---

## Sesion y privacidad / Session and privacy

- Datos guardados **solo en tu dispositivo** via `chrome.storage.local`
- **Expiran automaticamente a las 24 horas**
- Sin servidores externos, sin telemetria, sin anuncios
- Al desinstalar, el navegador elimina todos los datos automaticamente
- Codigo abierto — cualquiera puede auditar cada linea

### Permisos solicitados

| Permiso | Razon |
|---|---|
| `storage` | Guardar CURP/RFC/Pasaporte y resultados localmente con TTL de 24h |
| `host_permissions` | Hacer llamadas API directas y ejecutar content scripts solo en los portales listados |

No se solicitan permisos de `history`, `cookies`, `webRequest`, camara, microfono ni geolocalizacion.

---

## Estructura del codigo / Code structure

```
manifest.json        Configuracion (diferente para Chrome y Firefox)
popup.html           Interfaz: 4 pestanas (Inicio, Resultados, Manuales, Acerca)
popup.css            Estilos: paleta azul #1E3A8A, naranja #F97316
popup.js             Logica del popup: formulario, progreso, resultados
storage.js           Almacenamiento seguro con TTL de 24h
companies.js         Lista de portales clasificados por tipo de persona
content.js           Script inyectado: rellena formularios y extrae resultados
background.js        Service worker: llamadas API directas y guardado de resultados
icons/               Pixel art "6-7" en azul, naranja y blanco (16/32/48/128px)
```

---

## Instalacion desde GitHub / Installing from GitHub

```bash
git clone https://github.com/six-seven/crt-lineas.git
cd crt-lineas
```

**Para Chrome:**
```bash
cp manifest-chrome.json manifest.json
# Cargar la carpeta en chrome://extensions
```

**Para Firefox:**
```bash
cp manifest-firefox.json manifest.json
# Cargar manifest.json en about:debugging
```

---

## Desinstalacion / Uninstall

**Chrome:** `chrome://extensions` → Consulta Lineas CRT → Eliminar

**Firefox:** Menu → Complementos → Consulta Lineas CRT → Eliminar

Al desinstalar, el navegador elimina automaticamente todos los datos locales.

---

## Donaciones / Donations

Esta extension es gratuita y de codigo abierto. Si te fue util puedes apoyar
su desarrollo:

**Ko-fi:** [ko-fi.com/sixseven8](https://ko-fi.com/sixseven8)

**Criptomonedas via Bitso:**

**XRP (Ripple)**
- Red: Ripple
- Direccion: `rLSn6Z3T8uCxbcd1oxwfGQN1Fdn5CyGujK`
- Destination Tag: `11550963`

**ADA (Cardano)**
- Red: Cardano
- Direccion: `addr1q9q48dvqwgfvrw6dhwhydushnd4qnfdsqxr2gxe93wkwk09sve5ted8m0wl99677rdgqrdhslk0g2l7skx2nrklpgdeqnhsyyr`

**XLM (Stellar Lumens)**
- Red: Stellar
- Direccion: `GA22MHPWUODDYFSQMQ3I6BJAHEJCDLEPOIYG5RP47LLIO3YV3KPSIVXV`
- Destination Tag: `11550963`

> Envia solo la cripto correspondiente a cada red. Si depositas otra cripto puedes perder los fondos.

---

## Contribuciones / Contributions

Las URLs de los portales cambian con el tiempo. Si encuentras una URL
desactualizada o un nuevo portal del CRT, abre un issue o pull request.

Portal URLs change over time. If you find an outdated URL or a new CRT portal,
open an issue or pull request.

---

## Licencia / License

MIT License — Copyright (c) 2025 Six-Seven

Se permite el uso, copia, modificacion y distribucion con o sin restricciones,
siempre que se incluya el aviso de copyright original.
