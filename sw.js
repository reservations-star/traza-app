/* TRAZA · funciona sin internet. Generado por build-sw.py (no editar sw.js a mano). */
const VERSION = '0199dd8ed6';
const APP = 'traza-app-' + VERSION, MEDIA = 'traza-media', FONTS = 'traza-fonts';
const CORE = ["./", "index.html", "manifest.json", "img/avatar.jpg", "img/cacao.webp", "img/catedral.webp", "img/comer-21gramos.svg", "img/comer-alfiume.svg", "img/comer-brau.svg", "img/comer-scarpetta.svg", "img/foto-malecon.jpg", "img/foto-penas.jpg", "img/historico.webp", "img/icon-192.png", "img/icon-512.png", "img/iguana.webp", "img/logo-21gramos.webp", "img/logo-alfiume.webp", "img/logo-base.webp", "img/logo-brau.webp", "img/logo-flag.webp", "img/logo-scarpetta.webp", "img/logo-word.webp", "img/logo.webp", "img/onb1.webp", "img/onb2.webp", "img/onb3.webp", "img/penas.webp", "img/perla.webp", "img/plaza.webp", "img/puerto.webp", "img/rotonda.webp", "img/sello-cacao.webp", "img/sello-historico.webp", "img/sello-malecon.webp", "img/sello-penas.webp", "img/sello-seminario.webp", "img/skyline.webp", "img/trip-art.webp"];   // pantalla, ilustraciones y logos: se guardan al instalar
const REST = ["audio/cacao.mp3", "audio/historico.mp3", "audio/malecon.mp3", "audio/penas.mp3", "audio/plaza.mp3", "audio/puerto.mp3", "audio/seminario.mp3", "img/gal/cacao-1.webp", "img/gal/cacao-2.webp", "img/gal/cacao-3.webp", "img/gal/cacao-4.webp", "img/gal/cacao-5.webp", "img/gal/cacao-6.webp", "img/gal/cacao-7.webp", "img/gal/cacao-8.webp", "img/gal/cacao-fachada.webp", "img/gal/historico-1.webp", "img/gal/historico-2.webp", "img/gal/historico-3.webp", "img/gal/historico-4.webp", "img/gal/historico-5.webp", "img/gal/historico-6.webp", "img/gal/historico-7.webp", "img/gal/historico-8.webp", "img/gal/historico-portada.webp", "img/gal/malecon-1.webp", "img/gal/malecon-2.webp", "img/gal/malecon-3.webp", "img/gal/malecon-4.webp", "img/gal/malecon-5.webp", "img/gal/malecon-6.webp", "img/gal/malecon-7.webp", "img/gal/malecon-8.webp", "img/gal/malecon-portada.webp", "img/gal/penas-1.webp", "img/gal/penas-2.webp", "img/gal/penas-3.webp", "img/gal/penas-4.webp", "img/gal/penas-5.webp", "img/gal/penas-6.webp", "img/gal/penas-7.webp", "img/gal/penas-8.webp", "img/gal/penas-portada.webp", "img/gal/plaza-1.webp", "img/gal/plaza-2.webp", "img/gal/plaza-3.webp", "img/gal/plaza-4.webp", "img/gal/puerto-1.webp", "img/gal/puerto-2.webp", "img/gal/puerto-3.webp", "img/gal/seminario-1.webp", "img/gal/seminario-2.webp", "img/gal/seminario-3.webp", "img/gal/seminario-4.webp", "img/gal/seminario-5.webp", "img/gal/seminario-6.webp", "img/gal/seminario-7.webp", "img/gal/seminario-portada.webp", "video/malecon-v3.jpg", "video/malecon-v3.mp4"];   // fotos de galerías, audios y video: se guardan después, sin bloquear

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
