/* sw.js — sadece kabuk önbelleği. Site çevrimdışı da açılır; hatalar sessizce yutulur.
   Sürümü değiştirince (SURUM) eski önbellek silinir. Veri hep cihazda (localStorage/IndexedDB), ağ yok. */
const SURUM = 'cd-v9';
const KABUK = [
  './', './index.html', './config.js', './tokens.css', './base.css', './manifest.webmanifest',
  './css/giris.css', './css/hub.css', './css/pittiksu.css', './css/tirnak.css', './css/petevi.css', './css/angela.css', './css/panda.css', './css/bahce.css', './css/ofke.css', './css/bizim.css',
  './js/cekirdek.js', './js/petler-miras.js', './js/giris.js', './js/hub.js',
  './js/bolum/pittiksu.js', './js/bolum/tirnak.js', './js/bolum/petevi.js', './js/bolum/angela.js', './js/bolum/panda.js', './js/bolum/bahce.js', './js/bolum/ofke.js', './js/bolum/bizim.js',
  './fonts/Nunito-latin.woff2', './fonts/Nunito-latin-ext.woff2', './fonts/SourGummy-latin.woff2', './fonts/SourGummy-latin-ext.woff2', './fonts/Caveat-latin.woff2', './fonts/Caveat-latin-ext.woff2',
  './js/kilit.js', './js/senk.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/favicon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SURUM).then(c => Promise.all(KABUK.map(u => fetch(u, { cache: 'no-cache' }).then(r => { if (r && r.ok) return c.put(u, r); }).catch(() => {}))))
      .then(() => self.skipWaiting()).catch(() => {})
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SURUM).map(k => caches.delete(k)))).then(() => self.clients.claim()).catch(() => {}));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url; try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  // aynı kaynak: önce ağ (güncellemeler hemen gelsin), olmazsa önbellek, o da yoksa index.html (gezinme)
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const kopya = res.clone(); caches.open(SURUM).then(c => c.put(req, kopya)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)).then(r => r || new Response('', { status: 504, statusText: 'çevrimdışı' })))
  );
});
