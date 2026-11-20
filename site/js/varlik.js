/* varlik.js — "Kim burada?" + Mahalle Postası veri katmanı (V2 Faz 1 · FAZ1-TASARIM.md §14).
   Her kişi YALNIZ kendi anahtarına yazar (senk "anahtar bazında en yeni kazanır" → çakışma yok):
     cd.varlik.<kim>   { yer, t, uyku:{uyuyor,t}, ruh:{tur,t}, sonBina }
     cd.posta.<kim>    son 40 olay [{ id, tur, v, t }]   (gönderen yazar)
     cd.saklinot.<kim> [{ id, bina, metin, t }]          (gönderen yazar; okunanlar alıcının cd.okunan.<kim> listesinde)
     cd.okunan.<kim>   [notId…]                          (okuyan yazar)
     cd.soru.<kim>     { 'yyyy-aa-gg': 'cevap' }
     cihaz.posta.islenen  işlenmiş olay id'leri (senklenmez → kalpler iki kez patlamaz)
   Olay iki yoldan gelebilir: canli.js (anlık kanal) ve senk (kalıcı). Aynı id bir kez işlenir.
   Yayılan olaylar: 'varlik:degisti', 'posta:geldi' ({ o, canli }), 'posta:biriken' ([o…]). */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const NABIZ_ARA = 60000;          // görünürken 60 sn'de bir nabız (senk trafiği: daha sık değil)
  const CEVRIMICI = 90000;          // çevrimiçi eşiği (canlı kanal açıkken; presence zaten anında söyler)
  const CEVRIMICI_SENK = 180000;    // canlı kanal yokken: karşının saatine göre yazılan damga → saat farkına daha geniş pay
  const SORU_GUN = 120;             // cevap listesi son 120 gün tutulur (satır sınırsız büyümesin)
  const BASLANGIC = 'cihaz.posta.baslangic';   // bu telefonda posta ilk kez ne zaman tarandı (öncesi "görüldü" sayılır)
  const UYKU_GECERLI = 14 * 3600000;
  const POSTA_MAKS = 40;
  const BIRIKEN_ESIK = 72 * 3600000;   // "sen yokken" en çok 3 gün geriye bakar
  const ISLENEN = 'cihaz.posta.islenen';
  const ELCI_ALINAN = 'cihaz.elci.alinan';
  const RUHLAR = ['gunes', 'parcali', 'bulutlu', 'yagmur', 'firtina', 'gokkusagi'];

  const ben = () => CD.kim();
  const karsi = () => { const k = ben(); return k === 'ahmet' ? 'cemre' : (k === 'cemre' ? 'ahmet' : null); };
  const bulut = () => !!(CD.senk && CD.senk.acik);
  const aktif = () => !!(bulut() && ben());
  const al = (k, d) => CD.depo.al(k, d);
  const yaz = (k, v) => CD.depo.yaz(k, v);
  const dizi = (v) => Array.isArray(v) ? v : [];
  const yay = (ad, v) => CD.olay.yay(ad, v);

  /* ---------------------------------------------------------------- kendi varlığım */
  function benim() {
    const k = ben(); if (!k) return null;
    const v = al('varlik.' + k, null);
    return Object.assign({ yer: 'mahalle', t: 0, uyku: null, ruh: null, sonBina: null }, (v && typeof v === 'object') ? v : {});
  }
  let sonNabiz = 0;
  function varlikYaz(degisim, nabizMi) {
    const k = ben(); if (!k) return;
    const v = Object.assign(benim(), { gizli: false }, degisim || {}, { t: Date.now() });
    yaz('varlik.' + k, v); sonNabiz = v.t;
    if (CD.canli) CD.canli.durum({ kim: k, yer: v.yer, uyku: v.uyku, ruh: v.ruh, t: v.t });
    if (!nabizMi) yay('varlik:degisti', 'ben');
  }
  // sessiz yerler: karşı telefonda "… şu an X'te" diye görünmez (Safir'in Yeri yalnız içine girene görünür)
  const SESSIZ_YER = { safir: true };
  const yerim = () => { const a = CD.aktifBolum ? CD.aktifBolum() : ''; return (a && !SESSIZ_YER[a]) ? a : 'mahalle'; };

  /* ---------------------------------------------------------------- karşı kişinin görünümü (senk + canlı birleşimi) */
  let canliOnun = {};               // anlık gelen uyku/ruh (senk gelene kadar)
  let sonGorulme = 0;               // presence'tan ayrıldığı an (yerel saat)
  function onun() {
    const k = karsi(); if (!k || !bulut()) return null;
    const s = al('varlik.' + k, null) || {};
    const p = (CD.canli && CD.canli.herkes()[k]) || null;
    const yeni = (a, b) => { if (!a) return b || null; if (!b) return a; return (b.t || 0) > (a.t || 0) ? b : a; };
    let uyku = yeni(yeni(s.uyku, p && p.uyku), canliOnun.uyku);
    let ruh = yeni(yeni(s.ruh, p && p.ruh), canliOnun.ruh);
    if (ruh && RUHLAR.indexOf(ruh.tur) < 0) ruh = null;
    const t = Math.max(Number(s.t) || 0, (p && Number(p.t)) || 0);
    const burada = !!(CD.canli && CD.canli.burada(k));
    const esik = (CD.canli && CD.canli.bagli) ? CEVRIMICI : CEVRIMICI_SENK;
    const cevrimici = burada || (t > 0 && !s.gizli && Date.now() - t <= esik);
    const uyuyor = !!(uyku && uyku.uyuyor && Date.now() - (uyku.t || 0) < UYKU_GECERLI);
    return {
      kim: k, ad: CD.kimAdi(k), yer: (p && p.yer) || s.yer || 'mahalle', t, sonGorulme: Math.max(t, sonGorulme),
      cevrimici, uyuyor, uyku, ruh: ruh ? ruh.tur : null, ruhT: ruh ? ruh.t : 0, sonBina: s.sonBina || null, hicYok: !t && !p
    };
  }

  /* ---------------------------------------------------------------- posta: gönder */
  function gonder(tur, v) {
    const k = ben(); if (!k) return null;
    const o = { id: CD.kimlik(), tur, v: v || {}, t: Date.now() };
    const liste = dizi(al('posta.' + k, [])).concat([o]).slice(-POSTA_MAKS);
    yaz('posta.' + k, liste);                                   // kalıcı kopya (senk ile karşıya gider)
    if (aktif() && CD.canli) CD.canli.yayinla({ kim: k, o });   // anlık kopya (kanal açıksa)
    return o;
  }

  /* ---------------------------------------------------------------- posta: al + tekilleştir */
  let islenen = new Set(dizi(al(ISLENEN, [])));
  // damga HEMEN yazılır (olay gösterilmeden önce): sayfa hemen kapansa da olay ikinci kez gösterilmez
  function islendi(id) {
    islenen.add(id);
    const a = [...islenen].slice(-300); islenen = new Set(a); yaz(ISLENEN, a);
  }
  // yeni ya da sıfırlanmış telefon: ilk eşitlemeye kadar gelen eski olaylar sessizce "görüldü" sayılır
  let ilkGorus = !al(BASLANGIC, 0);
  function ilkGorusBitir() {
    if (!ilkGorus || !karsi() || !bulut()) return;
    tara(); ilkGorus = false; yaz(BASLANGIC, Date.now());
  }
  let birikmeEvresi = true, biriken = [], birikmeT = 0;
  function birikmeBitir() {
    if (!birikmeEvresi) return;
    birikmeEvresi = false; clearTimeout(birikmeT);
    const b = biriken.splice(0);
    if (b.length) yay('posta:biriken', b);
  }
  function birikmeBasla(ms) { birikmeEvresi = true; clearTimeout(birikmeT); birikmeT = setTimeout(birikmeBitir, ms || 12000); }

  function durumOlayi(o) {
    if (o.tur === 'ruh' && o.v && RUHLAR.indexOf(o.v.tur) >= 0) canliOnun.ruh = { tur: o.v.tur, t: o.t };
    if (o.tur === 'uyku' && o.v) canliOnun.uyku = { uyuyor: !!o.v.uyuyor, t: o.t };
  }
  let canliGelen = [];              // kanaldan gelen olaylar (senk karşının postasını getirene kadar elçi vb. için)
  function isle(o, canli) {
    if (!o || !o.id || islenen.has(o.id)) return;
    islendi(o.id);
    if (!canli && ilkGorus) {            // eski olay: oynatma; eski elçi kapıda yeniden beklemesin
      if (o.tur === 'elci') { const a = dizi(al(ELCI_ALINAN, [])); if (a.indexOf(o.id) < 0) { a.push(o.id); yaz(ELCI_ALINAN, a.slice(-60)); } }
      durumOlayi(o);
      return;
    }
    if (canli) canliGelen = canliGelen.concat([o]).slice(-POSTA_MAKS);
    durumOlayi(o);
    // kendi saklı notum okunduysa listemden çıkar (yalnız ben yazarım)
    if (o.tur === 'muhur' && o.v && o.v.neyi === 'not' && o.v.notId) notSil(o.v.notId, true);
    if (!canli && birikmeEvresi) {
      if (Date.now() - (o.t || 0) < BIRIKEN_ESIK) biriken.push(o);
      yay('varlik:degisti', 'karsi');
      return;
    }
    yay('posta:geldi', { o, canli: !!canli });
    yay('varlik:degisti', 'karsi');
  }
  function tara() {
    const k = karsi(); if (!k || !bulut()) return;
    dizi(al('posta.' + k, [])).forEach(o => isle(o, false));
  }

  /* ---------------------------------------------------------------- ruh / uyku */
  function ruhSec(tur) {
    if (RUHLAR.indexOf(tur) < 0 || !ben()) return;
    varlikYaz({ ruh: { tur, t: Date.now() } });
    gonder('ruh', { tur });
  }
  function uyku(uyuyor) {
    if (!ben()) return;
    varlikYaz({ uyku: { uyuyor: !!uyuyor, t: Date.now() } });
    gonder('uyku', { uyuyor: !!uyuyor });
  }
  function benUyuyor() { const v = benim(); return !!(v && v.uyku && v.uyku.uyuyor && Date.now() - (v.uyku.t || 0) < UYKU_GECERLI); }
  function benimRuh() { const v = benim(); return (v && v.ruh && RUHLAR.indexOf(v.ruh.tur) >= 0) ? v.ruh.tur : null; }

  /* ---------------------------------------------------------------- elçi */
  function bekleyenElciler() {
    const k = karsi(); if (!k || !aktif()) return [];
    const alinan = new Set(dizi(al(ELCI_ALINAN, [])));
    // kendi postamdaki "elciAlindi" olayları da alınmış sayılır (bu telefon sıfırlanmış olsa bile)
    dizi(al('posta.' + ben(), [])).forEach(o => { if (o && o.tur === 'elciAlindi' && o.v && o.v.elciId) alinan.add(o.v.elciId); });
    const liste = dizi(al('posta.' + k, [])); const idler = new Set(liste.map(o => o && o.id));
    return liste.concat(canliGelen.filter(o => !idler.has(o.id))).filter(o => o && o.tur === 'elci' && !alinan.has(o.id) && Date.now() - (o.t || 0) < BIRIKEN_ESIK);
  }
  function elciAl(o) {
    if (!o) return;
    const a = dizi(al(ELCI_ALINAN, [])); if (a.indexOf(o.id) < 0) { a.push(o.id); yaz(ELCI_ALINAN, a.slice(-60)); }
    gonder('elciAlindi', { elciId: o.id, hediye: (o.v || {}).hediye, hayvan: (o.v || {}).hayvan });
  }

  /* ---------------------------------------------------------------- saklı not */
  function notlarim() { const k = ben(); return k ? dizi(al('saklinot.' + k, [])) : []; }
  function okunanlar(k) { return new Set(dizi(al('okunan.' + k, []))); }
  function bekleyenNotlarim() {                 // benim sakladığım, karşının henüz okumadığı
    const k = karsi(); const ok = k ? okunanlar(k) : new Set();
    return notlarim().filter(n => n && !ok.has(n.id));
  }
  function banaNotlar() {                       // karşının bana sakladığı, okumadığım
    const k = karsi(), b = ben(); if (!k || !b || !aktif()) return [];
    const ok = okunanlar(b);
    return dizi(al('saklinot.' + k, [])).filter(n => n && n.id && !ok.has(n.id));
  }
  function notSakla(bina, metin) {
    const k = ben(); if (!k) return null;
    metin = String(metin || '').trim().slice(0, 140); if (!metin) return null;
    const n = { id: CD.kimlik(), bina, metin, t: Date.now() };
    const liste = notlarim().filter(x => x.bina !== bina).concat([n]);   // bina başına 1 bekleyen not
    yaz('saklinot.' + k, liste.slice(-12));
    gonder('not', { bina, notId: n.id });
    return n;
  }
  function notSil(id, sessizce) {
    const k = ben(); if (!k) return;
    const liste = notlarim(); const yeni = liste.filter(x => x.id !== id);
    if (yeni.length !== liste.length) { yaz('saklinot.' + k, yeni); if (!sessizce) yay('varlik:degisti', 'ben'); }
  }
  function notOkundu(n) {
    const b = ben(); if (!b || !n) return;
    const a = dizi(al('okunan.' + b, [])); if (a.indexOf(n.id) < 0) { a.push(n.id); yaz('okunan.' + b, a.slice(-60)); }
    gonder('muhur', { neyi: 'not', notId: n.id, bina: n.bina });
    yay('varlik:degisti', 'ben');
  }

  /* ---------------------------------------------------------------- günün sorusu */
  function gunNo(iso) { const [y, a, g] = String(iso || CD.bugun()).split('-').map(Number); return Math.round(Date.UTC(y, a - 1, g) / 86400000); }
  function sorular() {
    const c = (CD.config && CD.config.GUNUN_SORULARI) || [];
    const ozel = dizi(c).map(x => String(x || '').trim()).filter(Boolean);
    return ozel.length ? ozel : dizi(CD.SORULAR);
  }
  function soru(iso) { const s = sorular(); if (!s.length) return 'Bugün seni en çok ne güldürdü?'; const n = gunNo(iso); return s[((n % s.length) + s.length) % s.length]; }
  function cevaplar(k) { const v = k ? al('soru.' + k, {}) : {}; return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
  function cevap(k, iso) { const c = cevaplar(k)[iso || CD.bugun()]; return typeof c === 'string' ? c : ''; }
  function cevapYaz(iso, metin) {
    const k = ben(); if (!k) return;
    const c = cevaplar(k); metin = String(metin || '').trim().slice(0, 280);
    const ilk = !c[iso];
    if (metin) c[iso] = metin; else delete c[iso];
    const sinir = gunNo(CD.bugun()) - SORU_GUN;
    Object.keys(c).forEach(g => { if (!/^\d{4}-\d{2}-\d{2}$/.test(g) || gunNo(g) < sinir) delete c[g]; });
    yaz('soru.' + k, c);
    if (metin && ilk) gonder('soru', { gun: iso });
    yay('varlik:degisti', 'ben');
  }

  /* ---------------------------------------------------------------- göreli zaman */
  function gorelizaman(t) {
    if (!t) return '';
    const fark = Date.now() - t;
    if (fark < 2 * 60000) return 'az önce';
    if (fark < 3600000) return Math.round(fark / 60000) + ' dk önce';
    if (fark < 86400000) {
      const d = new Date(t), dun = new Date(); dun.setDate(dun.getDate() - 1);
      if (d.toDateString() === dun.toDateString() && fark > 6 * 3600000) return 'dün';
      return Math.round(fark / 3600000) + ' saat önce';
    }
    const gun = Math.floor(fark / 86400000);
    return gun <= 1 ? 'dün' : gun + ' gün önce';
  }

  /* ---------------------------------------------------------------- Türkçe ekler (isimler şifreli ayardan geldiği için sabit yazılamaz) */
  const SONSESLI = (ad) => { const m = String(ad || '').toLocaleLowerCase('tr').match(/[aeıioöuü](?=[^aeıioöuü]*$)/); return m ? m[0] : 'e'; };
  const KALIN = (u) => 'aıou'.indexOf(u) >= 0;
  const SERT = (ad) => /[fstkçşhp]$/i.test(String(ad || ''));
  const SESLI_BITER = (ad) => /[aeıioöuü]$/i.test(String(ad || ''));
  CD.ek = {
    den: (ad) => ad + "'" + (SERT(ad) ? 't' : 'd') + (KALIN(SONSESLI(ad)) ? 'an' : 'en'),          // Cemre'den, Ahmet'ten
    nin: (ad) => { const u = SONSESLI(ad); const v = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[u] || 'i'; return ad + "'" + (SESLI_BITER(ad) ? 'n' : '') + v + 'n'; },   // Cemre'nin, Ahmet'in
    // Faz 2: bulunma / yönelme / belirtme hâlleri
    de: (ad) => ad + "'" + (SERT(ad) ? 't' : 'd') + (KALIN(SONSESLI(ad)) ? 'a' : 'e'),                                            // Cemre'de, Ahmet'te
    ye: (ad) => ad + "'" + (SESLI_BITER(ad) ? 'y' : '') + (KALIN(SONSESLI(ad)) ? 'a' : 'e'),                                       // Cemre'ye, Ahmet'e
    i: (ad) => { const v = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[SONSESLI(ad)] || 'i'; return ad + "'" + (SESLI_BITER(ad) ? 'y' : '') + v; }   // Cemre'yi, Ahmet'i
  };
  /* yer adları (şerit metni için hazır hâl ekleriyle) */
  const YERLER = {
    pittiksu: { ad: 'Pıttıksu Evi', de: "Pıttıksu Evi'nde", em: '🐱' }, barbie: { ad: 'Barbie Kulübesi', de: "Barbie Kulübesi'nde", em: '🐶' },
    tirnak: { ad: 'Tırnak Salonu', de: "Tırnak Salonu'nda", em: '💅' }, petevi: { ad: 'Pet Evi', de: "Pet Evi'nde", em: '🧸' },
    angela: { ad: "Angela'nın Evi", de: "Angela'nın Evi'nde", em: '⭐' }, panda: { ad: 'Panda Lokantası', de: "Panda Lokantası'nda", em: '🍜' },
    bahce: { ad: 'Bahçe', de: "Bahçe'de", em: '🌷' }, ofke: { ad: 'Öfke Odası', de: "Öfke Odası'nda", em: '🍽️' },
    xox: { ad: 'Oyun Salonu', de: "Oyun Salonu'nda", em: '❌' }, bizim: { ad: 'Bizim Köşemiz', de: "Bizim Köşemiz'de", em: '💗' },
    safir: { ad: "Safir'in Yeri", de: "Safir'in Yeri'nde", em: '🤍' },
    elele: { ad: 'El Ele Bankı', de: "El Ele Bankı'nda", em: '🤝' }, tahta: { ad: 'Çizim Atölyesi', de: "Çizim Atölyesi'nde", em: '🎨' },
    guzellik: { ad: 'Güzellik Salonu', de: "Güzellik Salonu'nda", em: '💄' },
    mahalle: { ad: 'Mahalle', de: 'mahallede', em: '👋' }
  };

  CD.varlik = {
    YERLER,
    RUHLAR, ben, karsi, aktif, bulut, benim, onun, gonder, ruhSec, uyku, benUyuyor, benimRuh,
    bekleyenElciler, elciAl, notlarim, bekleyenNotlarim, banaNotlar, notSakla, notSil, notOkundu,
    SORU_GUN, soru, gunNo, cevap, cevaplar, cevapYaz, gorelizaman,
    get birikmede() { return birikmeEvresi; },
    nabiz: () => varlikYaz({ yer: yerim() }, true)
  };

  /* ---------------------------------------------------------------- bağlantılar */
  CD.hazir(() => {
    // yer değişince hemen nabız (bölüm adı için modüllere dokunmaya gerek yok)
    CD.olay.dinle('bolum:acildi', (id) => { if (ben()) varlikYaz(SESSIZ_YER[id] ? { yer: 'mahalle' } : { yer: id, sonBina: id }); });
    CD.olay.dinle('hub:acildi', () => { if (ben()) varlikYaz({ yer: 'mahalle' }); });
    CD.olay.dinle('kim', () => { islenen = new Set(dizi(al(ISLENEN, []))); canliOnun = {}; canliGelen = []; if (ben()) varlikYaz({ yer: yerim() }); tara(); if (CD.senk && CD.senk.sonSenk) ilkGorusBitir(); yay('varlik:degisti', 'kim'); });
    // senk: karşının postası/varlığı değişmiş olabilir
    CD.olay.dinle('senk:yenilendi', () => { tara(); yay('varlik:degisti', 'karsi'); });
    CD.olay.dinle('senk', (d) => {
      if (!d || d.durum !== 'tamam') return;
      tara(); ilkGorusBitir();
      if (birikmeEvresi) setTimeout(birikmeBitir, 300);
    });
    CD.olay.dinle('senk:acildi', () => { if (birikmeEvresi) birikmeBasla(12000); if (ben()) varlikYaz({ yer: yerim() }, true); });
    // canlı kanal
    CD.olay.dinle('canli:olay', (p) => { if (p && p.kim && p.kim === karsi()) isle(p.o, true); });
    CD.olay.dinle('canli:varlik', () => {
      const k = karsi(); if (k && CD.canli && !CD.canli.burada(k) && sonGorulme < Date.now() - 1000) {
        const s = al('varlik.' + k, null); if (s && s.t) sonGorulme = Math.max(sonGorulme, s.t);
      }
      yay('varlik:degisti', 'karsi');
    });
    CD.olay.dinle('canli:baglanti', (v) => { if (v && ben()) CD.canli.durum({ kim: ben(), yer: yerim(), uyku: benim().uyku, ruh: benim().ruh, t: Date.now() }); yay('varlik:degisti', 'karsi'); });
    // nabız: görünürken 60 sn'de bir; gizlenince son bir yazma
    setInterval(() => { if (!document.hidden && ben() && bulut() && Date.now() - sonNabiz >= NABIZ_ARA - 2000) varlikYaz({ yer: yerim() }, true); }, 15000);
    let gizlendi = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { gizlendi = Date.now(); if (ben() && bulut()) varlikYaz({ yer: yerim(), gizli: true }, true); return; }
      if (gizlendi && Date.now() - gizlendi > 5 * 60000) birikmeBasla(10000);   // uzun aradan sonra gelenler tek özet kartta
      if (ben() && bulut()) varlikYaz({ yer: yerim(), gizli: false }, true);
      yay('varlik:degisti', 'zaman');
    });
    // zaman yazıları (… dk önce) ve çevrimiçi eşiği için hafif tazeleme
    setInterval(() => { if (!document.hidden) yay('varlik:degisti', 'zaman'); }, 30000);
    birikmeBasla(15000);
    tara();                                   // yerelde duran ama işlenmemiş olaylar (önceki oturumdan)
  });
})();
