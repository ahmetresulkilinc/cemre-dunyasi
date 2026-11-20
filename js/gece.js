/* gece.js — "İyi geceler" mührü ve ortak gökyüzü (V2 Faz 2 · 1).
   - Her kişi akşam (18:00–04:00) kendi mührünü basar: cd.gece.<kim> = { 'yyyy-aa-gg': damga } (yalnız kendisi yazar).
   - Gece 04:00'te değişir: 20 Kasım 02:30'da basılan mühür "19 Kasım gecesi"dir.
   - İkisinin de mührü aynı geceye düşerse o geceye bir yıldız eklenir (mahallenin gece göğünde birikir).
   - Seri sayacı var ama ceza yok: kaçan gece yalnız "boş yer" olarak kalır.
   - Mühür karşıya posta kartıyla gider (posta türü 'iyiGece'); yıldız anı ('gece:yildiz' olayı) iki telefonda bir kez oynar.
   Bulut yoksa mühür yine basılır (yerelde durur); yıldız için iki mühür gerekir. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const DEGISIM_SAAT = 4, BAS_SAAT = 18, TUT = 400;
  const KUTLANAN = 'cihaz.gece.kutlanan';
  const V = () => CD.varlik;
  const ben = () => CD.kim();
  const karsi = () => (V() ? V().karsi() : null);
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  /* Kayıt biçimi (senk satırı küçük kalsın): { v: 2, g: '20412-20430,20433' } — gün numaraları, ardışık geceler aralık olarak.
     400 gecelik kesintisiz seri bile ~12 bayt; dağınık 400 gece ≈ 2,4 KB. Eski biçim { 'yyyy-aa-gg': damga } de okunur, ilk yazmada sıkıştırılır. */
  function cozKayit(v) {
    const o = {};
    if (!v || typeof v !== 'object' || Array.isArray(v)) return o;
    if (v.v === 2 && typeof v.g === 'string') {
      v.g.split(',').forEach(p => { const [a, b] = p.split('-').map(Number); if (!isFinite(a)) return; const son = isFinite(b) ? Math.min(b, a + 4000) : a; for (let n = a; n <= son; n++) o[gundenIso(n)] = 1; });
      return o;
    }
    Object.keys(v).forEach(g => { if (/^\d{4}-\d{2}-\d{2}$/.test(g) && v[g]) o[g] = 1; });
    return o;
  }
  function sikistir(o) {
    const n = Object.keys(o).filter(g => /^\d{4}-\d{2}-\d{2}$/.test(g)).map(gunNo).sort((a, b) => a - b).slice(-TUT);
    const p = []; let i = 0;
    while (i < n.length) { let j = i; while (j + 1 < n.length && n[j + 1] === n[j] + 1) j++; p.push(i === j ? String(n[i]) : n[i] + '-' + n[j]); i = j + 1; }
    return { v: 2, g: p.join(',') };
  }
  const kayit = (k) => (k ? cozKayit(CD.depo.al('gece.' + k, null)) : {});
  const canliGelen = {};          // kanaldan gelen karşı mühürleri (senk gelene kadar)

  /* bu an hangi gecenin içindeyiz? (04:00'ten önce dünkü gece) */
  function geceNe(t) { const d = new Date(t || Date.now()); d.setHours(d.getHours() - DEGISIM_SAAT); return iso(d); }
  function basilabilir(t) { const h = new Date(t || Date.now()).getHours(); return h >= BAS_SAAT || h < DEGISIM_SAAT; }
  function benim() { return kayit(ben()); }
  function onun() { const k = karsi(); const o = Object.assign({}, kayit(k)); if (k) Object.keys(canliGelen).forEach(g => { if (!o[g]) o[g] = canliGelen[g]; }); return o; }
  function basildiMi(gece) { return !!benim()[gece || geceNe()]; }
  function onunMu(gece) { return !!onun()[gece || geceNe()]; }
  function yildizlar() {
    if (!karsi() || !(V() && V().aktif())) return [];
    const a = benim(), b = onun();
    return Object.keys(a).filter(g => b[g] && /^\d{4}-\d{2}-\d{2}$/.test(g)).sort();
  }
  const gunNo = (g) => { const [y, m, d] = g.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
  const gundenIso = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
  /* seri: bu geceden (yoksa dünden) geriye kesintisiz yıldızlı gece sayısı */
  function seri() {
    const y = new Set(yildizlar()); if (!y.size) return 0;
    let n = gunNo(geceNe()); if (!y.has(gundenIso(n))) n--;
    let s = 0; while (y.has(gundenIso(n))) { s++; n--; }
    return s;
  }
  /* ilk yıldızdan bu geceye kadar her gece: { gece, yildiz } (boş yerler dahil; en çok son `maks` gece) */
  function takvim(maks) {
    const y = yildizlar(); if (!y.length) return [];
    const bas = gunNo(y[0]), son = gunNo(geceNe()), set = new Set(y), o = [];
    for (let n = Math.max(bas, son - (maks || 400) + 1); n <= son; n++) { const g = gundenIso(n); o.push({ gece: g, yildiz: set.has(g), no: n - bas }); }
    return o;
  }

  function kutlandiMi(g) { const a = CD.depo.al(KUTLANAN, []); return Array.isArray(a) && a.indexOf(g) >= 0; }
  function kutla(g) {
    if (kutlandiMi(g)) return;
    const a = CD.depo.al(KUTLANAN, []); const l = Array.isArray(a) ? a : []; l.push(g); CD.depo.yaz(KUTLANAN, l.slice(-60));
    CD.olay.yay('gece:yildiz', g);
    CD.pul && CD.pul('yildiz', { kisa: g });
    const A = karsi() ? CD.kimAdi(karsi()) : '';
    if (CD.posta) CD.posta.kart({ kim: karsi(), tur: 'yildiz', baslik: 'Bu geceye bir yıldız eklendi ⭐', alt: (A ? 'Sen ve ' + A : 'İkiniz') + ' iyi geceler dediniz · seri ' + seri() });
    try { CD.ses.isilti(); } catch (e) {}
    CD.efekt.yildiz(innerWidth / 2, innerHeight * 0.25, 10);
  }
  function kontrol(g) { g = g || geceNe(); if (basildiMi(g) && onunMu(g) && V() && V().aktif()) kutla(g); }

  /* mührü bas → { tamam, yildiz } */
  function bas() {
    const k = ben(); if (!k) return { tamam: false, neden: 'kim' };
    if (!basilabilir()) return { tamam: false, neden: 'saat' };
    const g = geceNe(); const kendi = benim();
    if (kendi[g]) return { tamam: false, neden: 'zaten' };
    kendi[g] = 1;
    CD.depo.yaz('gece.' + k, sikistir(kendi));   // en çok son 400 gece, aralıklarla sıkıştırılmış
    if (V()) V().gonder('iyiGece', { gece: g });
    CD.pul && CD.pul('iyigece', { kisa: g });
    CD.olay.yay('gece:degisti', g);
    const yildiz = onunMu(g) && V() && V().aktif();
    if (yildiz) setTimeout(() => kontrol(g), 900);
    return { tamam: true, yildiz };
  }

  /* posta: karşının mührü */
  (CD.postaTurleri = CD.postaTurleri || {}).iyiGece = {
    kart(o, y) {
      const g = (o.v && o.v.gece) || geceNe(o.t);
      if (/^\d{4}-\d{2}-\d{2}$/.test(g)) canliGelen[g] = o.t || Date.now();
      const benimDe = basildiMi(g);
      y.kart({ kim: y.kim, tur: 'iyiGece', baslik: y.A + ' iyi geceler dedi 🌙', alt: benimDe ? 'Mühürler buluştu · ' + y.saat : 'Mührünü basarsan geceye bir yıldız eklenir',
        eylem: benimDe || !basilabilir() ? null : { ad: 'İyi geceler de', fn: () => { const r = bas(); if (r.tamam) CD.toast('Mührün basıldı 🌙'); } } });
      CD.olay.yay('gece:degisti', g);
      if (benimDe) setTimeout(() => kontrol(g), 900);
    },
    ozet(l, A) { return '🌙 ' + A + ' iyi geceler dedi'; }
  };

  CD.gece = { geceNe, basilabilir, bas, basildiMi, onunMu, yildizlar, seri, takvim, kontrol, BAS_SAAT, DEGISIM_SAAT, bicim: { coz: cozKayit, sikistir } };
  CD.hazir(() => {
    // senk karşının mührünü getirince (kanal kapalıyken) yıldızı yakala; yalnız bu gece ve dün gece
    const bak = () => { const g = geceNe(); kontrol(g); const d = new Date(); d.setHours(d.getHours() - DEGISIM_SAAT - 24); kontrol(iso(d)); CD.olay.yay('gece:degisti', g); };
    CD.olay.dinle('senk:yenilendi', bak);
    CD.olay.dinle('kim', bak);
  });
})();
