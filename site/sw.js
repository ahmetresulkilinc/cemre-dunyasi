/* sw.js — kabuk önbelleği. Site çevrimdışı da açılır; hatalar sessizce yutulur.
   Sürümü değiştirince (SURUM) eski önbellek silinir.
   - Kurulumda kabuğun TAMAMI (tüm bölümler, fontlar, simgeler, gizli/manifest.json + içindeki tüm .enc dosyaları; Safir'in 4 fotoğrafı dahil — manifest 'dosyalar' listesinden) önbelleğe alınır;
     böylece ilk açılıştan hemen sonra çevrimdışı olunsa bile kapı, mektup, fotoğraflar ve bütün bölümler gelir.
   - Aynı kaynak istekleri: önce ağ (güncellemeler hemen gelsin) ama en fazla AG_SURE ms beklenir; ağ yavaşsa önbellekten açılır
     (ağ cevabı yine de arkadan gelip önbelleği tazeler). Önbellekte yoksa ağ beklenir.
   - Bulut (Supabase) ve hava (Open-Meteo) istekleri farklı kaynak olduğu için hiç dokunulmaz.
   - Listede olup henüz var olmayan dosya (ör. başka ekibin guzellik.js/css'i) kurulumu BOZMAZ: onbellegeAl 404'ü ve ağ hatasını null sayar. */
const SURUM = 'cd-v18';
const AG_SURE = 3500;
const KABUK = [
  './', './index.html', './config.js', './tokens.css', './base.css', './manifest.webmanifest',
  './css/giris.css', './css/mahalle.css', './css/posta.css', './css/pittiksu.css', './css/barbie.css', './css/tirnak.css', './css/petevi.css', './css/angela.css', './css/panda.css', './css/bahce.css', './css/ofke.css', './css/xox.css', './css/bizim.css', './css/safir.css',
  './css/elele.css', './css/tahta.css', './css/oyun.css', './css/guzellik.css',
  './js/kilit.js', './js/cekirdek.js', './js/senk.js', './js/canli.js', './js/varlik.js', './js/petler-miras.js', './js/giris.js', './js/sorular.js', './js/posta.js', './js/mahalle.js',
  './js/tuval.js', './js/bakim.js', './js/gece.js', './js/kaset.js', './js/paylas.js', './js/sehir.js',
  './js/bolum/pittiksu.js', './js/bolum/barbie.js', './js/bolum/tirnak.js', './js/bolum/petevi.js', './js/bolum/angela.js', './js/bolum/panda.js', './js/bolum/bahce.js', './js/bolum/ofke.js', './js/bolum/xox.js', './js/bolum/bizim.js', './js/bolum/safir.js',
  './js/bolum/elele.js', './js/bolum/tahta.js', './js/bolum/guzellik.js', './js/oyun/salon.js', './js/oyun/dortlu.js', './js/oyun/amiral.js', './js/oyun/ciz.js',
  './fonts/Nunito-latin.woff2', './fonts/Nunito-latin-ext.woff2', './fonts/SourGummy-latin.woff2', './fonts/SourGummy-latin-ext.woff2', './fonts/Caveat-latin.woff2', './fonts/Caveat-latin-ext.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon.svg',
  './gizli/manifest.json'
];

function onbellegeAl(c, u) {
  return fetch(u, { cache: 'no-cache' }).then(r => { if (r && r.ok) return c.put(u, r.clone()).then(() => r); return null; }).catch(() => null);
}
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SURUM).then(c => Promise.all(KABUK.map(u => onbellegeAl(c, u))).then(async (sonuclar) => {
      // şifreli dosyalar: manifest'teki listeden (yeniden şifrelenince ad değişse de doğru dosyalar alınır)
      try {
        const mr = sonuclar[KABUK.indexOf('./gizli/manifest.json')];
        if (!mr) return;
        const m = await mr.json();
        const adlar = new Set();
        if (m.kontrol) adlar.add(m.kontrol);
        if (m.not) adlar.add(m.not);
        if (m.kisisel) adlar.add(m.kisisel);
        Object.values(m.dosyalar || {}).forEach(b => { if (b && b.enc) adlar.add(b.enc); });
        await Promise.all([...adlar].map(ad => onbellegeAl(c, './gizli/' + ad)));
      } catch (err) {}
    }))
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
  const ag = fetch(req).then(res => {
    if (res && res.ok) { const kopya = res.clone(); caches.open(SURUM).then(c => c.put(req, kopya)).catch(() => {}); }
    return res;
  });
  e.waitUntil(ag.catch(() => {}));       // önbellekten erken dönülse de ağ cevabı önbelleği tazelesin
  const yedek = () => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
  e.respondWith(new Promise(coz => {
    let bitti = false;
    const ver = (r) => { if (!bitti && r) { bitti = true; coz(r); } };
    // ağ AG_SURE içinde gelmezse önbellekteki kopya verilir (varsa)
    const t = setTimeout(() => { yedek().then(ver).catch(() => {}); }, AG_SURE);
    ag.then(r => { clearTimeout(t); ver(r); })
      .catch(() => { clearTimeout(t); yedek().then(r => ver(r || new Response('', { status: 504, statusText: 'çevrimdışı' }))).catch(() => ver(new Response('', { status: 504, statusText: 'çevrimdışı' }))); });
  }));
});
