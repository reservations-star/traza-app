/* TRAZA · funciona sin internet. Generado por build-sw.py (no editar sw.js a mano). */
const VERSION = '__VERSION__';
const APP = 'traza-app-' + VERSION, MEDIA = 'traza-media', FONTS = 'traza-fonts';
const CORE = __CORE__;   // pantalla, ilustraciones y logos: se guardan al instalar
const REST = __REST__;   // fotos de galerías, audios y video: se guardan después, sin bloquear

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('traza-app-') && k !== APP) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Descarga en segundo plano de fotos, audios y video (la página lo pide al abrirse)
let filling = null;
async function fillRest(client) {
  const c = await caches.open(MEDIA); let done = 0;
  const keys = new Set((await c.keys()).map(r => new URL(r.url).pathname));
  for (const p of REST) {
    const url = new URL(p, self.registration.scope);
    if (!keys.has(url.pathname)) {
      try { const r = await fetch(url, { cache: 'reload' }); if (r.ok && r.status === 200) await c.put(url, r); } catch (e) { }
    }
    done++;
    if (client && done % 8 === 0) client.postMessage({ t: 'progress', done, total: REST.length });
  }
  // quitar archivos que ya no existen en la app
  const want = new Set(REST.map(p => new URL(p, self.registration.scope).pathname));
  for (const r of await c.keys()) if (!want.has(new URL(r.url).pathname)) await c.delete(r);
  const all = await self.clients.matchAll();
  all.forEach(cl => cl.postMessage({ t: 'ready', version: VERSION, total: REST.length }));
}
self.addEventListener('message', e => {
  if (e.data === 'precache') { if (!filling) filling = fillRest(e.source).finally(() => { filling = null; }); e.waitUntil(filling); }
});

// Audio y video piden "rangos" de bytes: se cortan del archivo guardado
async function rangeResponse(req, res) {
  const range = req.headers.get('range'); if (!range) return res;
  const buf = await res.arrayBuffer(); const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range); let start = m && m[1] ? +m[1] : 0; let end = m && m[2] ? +m[2] : size - 1;
  if (!m || !m[1] && m[2]) { start = Math.max(0, size - (+m[2] || size)); end = size - 1; }
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': res.headers.get('Content-Type') || '', 'Content-Range': `bytes ${start}-${end}/${size}`,
    'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}
async function fromCache(req) {
  const u = new URL(req.url); const key = u.origin + u.pathname;
  return (await caches.match(key, { ignoreSearch: true })) || null;
}

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // Tipografías de Google: se guardan la primera vez y luego se usan sin internet
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (u.origin !== self.location.origin) return;   // correo, mapas, WhatsApp: siempre por internet
  // La app (index.html): primero internet para tener la última versión; sin señal, la guardada
  if (req.mode === 'navigate' || u.pathname.endsWith('/index.html') || u.pathname === new URL(self.registration.scope).pathname) {
    e.respondWith((async () => {
      try {
        const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 4000);
        const r = await fetch(req, { signal: ctl.signal }); clearTimeout(tm);
        if (r.ok) { const c = await caches.open(APP); c.put(new URL('index.html', self.registration.scope), r.clone()); }
        return r;
      } catch (err) {
        return (await caches.match(new URL('index.html', self.registration.scope))) || (await caches.match(new URL('./', self.registration.scope))) || Response.error();
      }
    })());
    return;
  }
  // Fotos, audios, video, logos: primero lo guardado; si no está, de internet y se guarda
  e.respondWith((async () => {
    const hit = await fromCache(req);
    if (hit) return rangeResponse(req, hit);
    if (req.headers.get('range')) { try { return await fetch(req); } catch (err) { return new Response('', { status: 504, statusText: 'Sin conexión' }); } }
    try {
      const r = await fetch(req);
      if (r.ok && r.status === 200) {
        const c = await caches.open(/\/(img|audio|video)\/gal|\/(audio|video)\//.test(u.pathname) ? MEDIA : APP);
        await c.put(u.origin + u.pathname, r.clone());
        return rangeResponse(req, r);
      }
      return r;
    } catch (err) { return new Response('', { status: 504, statusText: 'Sin conexión' }); }
  })());
});
