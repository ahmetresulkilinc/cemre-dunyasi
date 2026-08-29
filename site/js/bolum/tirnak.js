/* js/bolum/tirnak.js — Tırnak Salonu
   Gerçek salon akışı: Şekil → Baz → Renk → Nail art → Top coat. Canvas üstünde iki el (5'er tırnak),
   tırnak tek tek ya da hep birlikte; ten tonunu ve başlangıç elini Cemre seçer.
   Katmanlar (tırnak başına): doğal tırnak → baz → renk → teknik (french/ombre/mermer/aura/sim/krom uç) → desen
   → çıkartma → serbest fırça → hacim gölgesi → finish (parlak/mat/krom/aurora/sim/şimmer/holo/kedi gözü) → top coat → 3D süs.
   Geri al / yinele: durum anlık görüntüsü. Kayıt: cd.tirnak.durum, cd.tirnak.galeri (parametre JSON, PNG değil). */
(() => {
  'use strict';
  const ID = 'tirnak';
  const W = 360, H = 450;                       // mantıksal sahne (bir el)
  const ADIMLAR = [
    { id: 'sekil', ad: 'Şekil', ikon: '💅', ipucu: 'Bir şekil seç, törpü gerisini halleder.' },
    { id: 'baz', ad: 'Baz', ikon: '🫧', ipucu: 'Baz kat; oje daha uzun dayanır.' },
    { id: 'renk', ad: 'Renk', ikon: '🎨', ipucu: 'Bir renk seç, fırça hazır.' },
    { id: 'art', ad: 'Nail art', ikon: '✨', ipucu: 'Şimdi eğlence kısmı.' },
    { id: 'top', ad: 'Top coat', ikon: '💎', ipucu: 'Son dokunuş: parlat.' }
  ];
  const SEKILLER = [
    { id: 'kare', ad: 'Kare', not: 'En dayanıklısı, en net olanı.' },
    { id: 'squoval', ad: 'Squoval', not: 'Kare ama köşeleri yumuşak.' },
    { id: 'yuvarlak', ad: 'Yuvarlak', not: 'Doğal ve rahat.' },
    { id: 'oval', ad: 'Oval', not: 'Parmağı uzun gösterir.' },
    { id: 'badem', ad: 'Badem', not: 'Zarif; aurora ile harika.' },
    { id: 'coffin', ad: 'Balerin', not: 'Uca doğru daralır, uç düz.' },
    { id: 'stiletto', ad: 'Stiletto', not: 'En dramatik olanı. Senin gibi.' }
  ];
  const TENLER = ['#FFE7DA', '#FDDCCB', '#F9D1BC', '#F5C6AC', '#F0BA9B', '#E8AD8C', '#DE9F7C', '#D0906C', '#C1805E', '#AF6F50', '#9C5F43', '#864F38', '#6E402D', '#563224', '#3F251B', '#2C1912'];
  const BAZLAR = [
    { id: 'seffaf', ad: 'Şeffaf', renk: null, not: 'Görünmez, tırnağı korur.' },
    { id: 'sutlu', ad: 'Sütlü', renk: 'rgba(255,250,246,.72)', not: 'Hafif beyaz, yumuşak.' },
    { id: 'pembe', ad: 'Pembe baz', renk: 'rgba(255,214,224,.7)', not: 'Bebek pembesi altlık.' },
    { id: 'seftali', ad: 'Şeftali', renk: 'rgba(255,220,200,.7)', not: 'Sıcak nude altlık.' },
    { id: 'guc', ad: 'Güçlendirici', renk: 'rgba(240,236,255,.5)', not: 'Kırılmasın diye. Şaka değil.' }
  ];
  const KOLEKSIYONLAR = [
    { id: 'cemre', ad: "Cemre'nin favorileri", renkler: ['#F4CFD8', '#F7D9DF', '#EFC3CF', '#E8D3F2', '#FBE4EA', '#F1D8E8', '#DCC8F0', '#FFD9E1'] },
    { id: 'milky', ad: 'Milky white', renkler: ['#FBF8F5', '#F8F1EC', '#F6EBE6', '#F3E4DD', '#FFFFFF', '#F1E9E2'] },
    { id: 'glazed', ad: 'Glazed donut', renkler: ['#EAD7C9', '#E6CFBF', '#F0DCCB', '#DEC3B3', '#F3E1D4', '#D8B9A6'] },
    { id: 'kirmizi', ad: 'Cherry red', renkler: ['#B3122E', '#D81E3C', '#8C0F26', '#E63950', '#6E0B1D', '#5B1A2A', '#FF2D55', '#A31633'] },
    { id: 'aura', ad: 'Aura', renkler: ['#FFB5C9', '#FF8FB1', '#C9A7F5', '#9FD8F0', '#FFD3A8', '#B8F0D6', '#FF9EDC', '#A8C8FF'] },
    { id: 'nude', ad: 'Nude', renkler: ['#E9C9B6', '#D9B49B', '#C79A80', '#F0D6C6', '#B98A72', '#EFD9CF', '#D4A58C', '#A97B64'] },
    { id: 'pastel', ad: 'Pastel', renkler: ['#FFD1DC', '#FFE5B4', '#FFF5BA', '#C7F2D8', '#BDE3F5', '#DDD1F7', '#F6C9F0', '#CDEFEA'] },
    { id: 'koyu', ad: 'Koyu tonlar', renkler: ['#1E1B2B', '#2E1A47', '#0F2E3B', '#3A1C2E', '#14361F', '#4A0F1F', '#2B2B2B', '#12244A'] },
    { id: 'canli', ad: 'Canlı', renkler: ['#FF3E7F', '#FF7A00', '#FFE600', '#00C48C', '#2D9CFF', '#7B4DFF', '#FF57D3', '#00D1D1'] },
    { id: 'metal', ad: 'Metalik & klasik', renkler: ['#D4AF37', '#C0C7D1', '#E8B4A8', '#FFFFFF', '#000000', '#3B3B3B', '#8E7CC3', '#B76E79'] }
  ];
  const FINISHLER = [
    { id: 'parlak', ad: 'Parlak', not: 'Klasik cam parlaklığı.' },
    { id: 'mat', ad: 'Mat', not: 'Kadife gibi, ışıksız.' },
    { id: 'krom', ad: 'Krom', not: 'Ayna gibi metal.' },
    { id: 'aurora', ad: 'Aurora inci', not: 'Işığa göre pembe-mavi-altın. Senin finish\'in.' },
    { id: 'glitter', ad: 'Sim', not: 'Bol bol pırıltı.' },
    { id: 'shimmer', ad: 'Şimmer', not: 'İnce, ipeksi ışıltı.' },
    { id: 'holo', ad: 'Holografik', not: 'Gökkuşağı yansıması.' },
    { id: 'catEye', ad: 'Kedi gözü', not: 'Mıknatıslı ışık şeridi.' }
  ];
  const TEKNIKLER = [
    { id: 'yok', ad: 'Sade', not: 'Tek renk, temiz.' },
    { id: 'french', ad: 'French', not: 'Uçta ikinci renk, gülümseme çizgisi.' },
    { id: 'ombre', ad: 'Ombre', not: 'Dipten uca yumuşak geçiş.' },
    { id: 'mermer', ad: 'Mermer', not: 'İnce damarlar.' },
    { id: 'aura', ad: 'Aura', not: 'Ortada ışık halesi.' },
    { id: 'glitter', ad: 'Sim ucu', not: 'Uca doğru yoğunlaşan sim.' },
    { id: 'kromUc', ad: 'Krom uç', not: 'Sadece uçta metal.' },
    { id: 'kromToz', ad: 'Krom toz', not: 'Rengin üstüne ovulan metalik toz; ayna gibi ama renk kalır.' }
  ];
  // Desen/çıkartma: kapla=true → tüm tırnağı kaplayan doku; diğerleri sürüklenebilir çıkartma
  const DESENLER = [
    { id: 'puantiye', ad: 'Puantiye', kapla: true },
    { id: 'cizgi', ad: 'Çizgi', kapla: true },
    { id: 'ekose', ad: 'Ekose', kapla: true }
  ];
  const CIKARTMALAR = [
    { id: 'kalp', ad: 'Kalp' }, { id: 'yildiz', ad: 'Yıldız' }, { id: 'cicek', ad: 'Çiçek' }, { id: 'kelebek', ad: 'Kelebek' },
    { id: 'kiraz', ad: 'Kiraz' }, { id: 'fiyonk', ad: 'Fiyonk' }, { id: 'gulen', ad: 'Gülen yüz' }, { id: 'ayYildiz', ad: 'Ay-yıldız' }, { id: 'pati', ad: 'Kedi patisi' }
  ];
  const SUSLER = [
    { id: 'fiyonk3d', ad: '3D fiyonk', olcek: .55 },
    { id: 'tasS', ad: 'Küçük taş', olcek: .22 },
    { id: 'tasM', ad: 'Orta taş', olcek: .32 },
    { id: 'tasL', ad: 'Büyük taş', olcek: .44 },
    { id: 'inci', ad: 'İnci', olcek: .26 },
    { id: 'zincir', ad: 'Zincir', olcek: .9 }
  ];
  const DESEN_RENKLERI = ['#FFFFFF', '#3B3444', '#FFD1DC', '#EE8AAA', '#D4AF37', '#C0C7D1', '#D81E3C', '#8E7CC3', '#7CCB9A', '#2D9CFF', '#FFE28A', '#FF7A00'];
  const PARMAK_AD = ['baş parmak', 'işaret parmağı', 'orta parmak', 'yüzük parmağı', 'serçe parmak'];
  // Sağ el geometrisi (üstten, el sırtı; baş parmak solda). Sol el = aynalanır.
  const PARMAKLAR = [
    { x: 120, y: 342, w: 46, len: 118, aci: -0.62 },
    { x: 134, y: 262, w: 41, len: 130, aci: -0.07 },
    { x: 178, y: 258, w: 43, len: 146, aci: 0 },
    { x: 222, y: 262, w: 40, len: 136, aci: 0.06 },
    { x: 262, y: 274, w: 34, len: 104, aci: 0.14 }
  ];
  const TRENDLER = [
    { id: 'cemre', ad: "Cemre'nin tırnakları", inci: true, aciklama: 'Uzun stiletto, sütlü pembe, aurora inci krom. Fotoğraftaki gerçek tırnakların.', yap: () => ({ sekil: 'stiletto', uzunluk: .86, baz: 'sutlu', renk: '#F6D3DC', finish: 'aurora', top: true }) },
    { id: 'glazed', ad: 'Glazed donut', aciklama: 'Sütlü nude + inci krom. Yumuşacık.', yap: () => ({ sekil: 'badem', uzunluk: .5, baz: 'sutlu', renk: '#E9D4C6', finish: 'aurora', top: true }) },
    { id: 'milkyFrench', ad: 'Sütlü french', aciklama: 'Klasik beyaz uç, sütlü pembe zemin.', yap: () => ({ sekil: 'oval', uzunluk: .5, baz: 'pembe', renk: '#F8E6E8', teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .26 }, finish: 'parlak', top: true }) },
    { id: 'cherry', ad: 'Cherry red', aciklama: 'Kısa kare, vişne kırmızısı, cam parlaklığı.', yap: () => ({ sekil: 'kare', uzunluk: .28, renk: '#B3122E', finish: 'parlak', top: true }) },
    { id: 'aura', ad: 'Aura pembe-mor', aciklama: 'Ortada mor ışık, kenarda pembe.', yap: () => ({ sekil: 'badem', uzunluk: .62, renk: '#FFC2D6', teknik: { id: 'aura', renk2: '#9F7BE8', kalinlik: .3 }, finish: 'parlak', top: true }) },
    { id: 'catEye', ad: 'Gece kedi gözü', aciklama: 'Koyu mor, mıknatıslı ışık şeridi.', yap: () => ({ sekil: 'coffin', uzunluk: .62, renk: '#2E1A47', finish: 'catEye', top: true }) },
    { id: 'holo', ad: 'Holo pastel', aciklama: 'Lila zemin, gökkuşağı yansıma.', yap: () => ({ sekil: 'squoval', uzunluk: .42, renk: '#DDD1F7', finish: 'holo', top: true }) },
    { id: 'kiraz', ad: 'Kirazlı french', aciklama: 'Beyaz french, yüzük parmağında kiraz.', yap: i => ({ sekil: 'oval', uzunluk: .5, renk: '#FBEDEF', teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .24 }, cikartmalar: i === 3 ? [{ id: 'kiraz', x: 0, y: .5, olcek: .6, don: -.2, renk: '#D81E3C' }] : [], finish: 'parlak', top: true }) },
    { id: 'pati', ad: 'Kedi patisi', aciklama: 'Pıttıksu onaylı: gri zemin, pembe patiler.', yap: i => ({ sekil: 'yuvarlak', uzunluk: .3, renk: '#E9EBEF', cikartmalar: [{ id: 'pati', x: i % 2 ? .2 : -.2, y: .5, olcek: .5, don: i % 2 ? .3 : -.3, renk: '#EE8AAA' }], finish: 'parlak', top: true }) },
    { id: 'boomer', ad: 'Baby boomer', aciklama: 'Pembeden beyaza yumuşak geçiş.', yap: () => ({ sekil: 'badem', uzunluk: .6, renk: '#F5CFD5', teknik: { id: 'ombre', renk2: '#FFFFFF', kalinlik: .3 }, finish: 'parlak', top: true }) },
    { id: 'mermer', ad: 'Mermer & altın', aciklama: 'Beyaz mermer, altın damarlar, yüzükte taş.', yap: i => ({ sekil: 'coffin', uzunluk: .6, renk: '#FBF8F5', teknik: { id: 'mermer', renk2: '#D4AF37', kalinlik: .3 }, susler: i === 3 ? [{ id: 'tasM', x: 0, y: .45, olcek: .32, don: 0, renk: '#FFFFFF' }] : [], finish: 'parlak', top: true }) },
    { id: 'fiyonk', ad: 'Fiyonklu bebek pembesi', aciklama: 'Puantiye, 3D fiyonk, inci.', yap: i => ({ sekil: 'oval', uzunluk: .45, renk: '#FFD1DC', desen: i % 2 ? { id: 'puantiye', renk: '#FFFFFF' } : null, susler: i === 2 ? [{ id: 'fiyonk3d', x: 0, y: .42, olcek: .6, don: 0, renk: '#FFB3C7' }] : (i === 0 || i === 4 ? [{ id: 'inci', x: 0, y: .35, olcek: .26, don: 0, renk: '#FFFFFF' }] : []), finish: 'parlak', top: true }) },
    { id: 'sim', ad: 'Sim uçlu gece', aciklama: 'Lacivert, uçta yıldız tozu.', yap: () => ({ sekil: 'stiletto', uzunluk: .75, renk: '#12244A', teknik: { id: 'glitter', renk2: '#FFE28A', kalinlik: .3 }, finish: 'shimmer', top: true }) },
    { id: 'kromUc', ad: 'Krom uçlu nude', aciklama: 'Nude zemin, gümüş krom uç.', yap: () => ({ sekil: 'badem', uzunluk: .55, renk: '#E9C9B6', teknik: { id: 'kromUc', renk2: '#C0C7D1', kalinlik: .3 }, finish: 'parlak', top: true }) },
    { id: 'kelebek', ad: 'Kelebekli gök', aciklama: 'Açık mavi, kelebek ve yıldızlar.', yap: i => ({ sekil: 'badem', uzunluk: .55, renk: '#BDE3F5', cikartmalar: i === 1 || i === 3 ? [{ id: 'kelebek', x: 0, y: .5, olcek: .62, don: .15, renk: '#8E7CC3' }] : [{ id: 'yildiz', x: -.3, y: .35, olcek: .3, don: 0, renk: '#FFFFFF' }, { id: 'yildiz', x: .35, y: .65, olcek: .22, don: .4, renk: '#FFFFFF' }], finish: 'shimmer', top: true }) }
  ];
  const ISIM_SIFAT = ['Bulutlu', 'İncili', 'Şeftalili', 'Gece', 'Sütlü', 'Vişneli', 'Lavantalı', 'Parıltılı', 'Minik', 'Kedili', 'Tatlı', 'Yıldızlı'];
  const ISIM_AD = ['Rüya', 'Buket', 'Şeker', 'Mırr', 'Aurora', 'Pati', 'Fiyonk', 'Yıldız', 'Işıltı', 'Kelebek', 'Bulut', 'Sabah'];
  const PITTIKSU_SOZ = ['mırr… çok güzel olmuş', 'bu renk battaniyeme yakışır', 'patimi de yapar mısın?', 'ışıl ışıl, gözüm kamaştı', 'onayladım, mırr', 'tırnakların benim bıyıklarım kadar zarif'];

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null;
  const ui = {};
  let tuval = null, g2 = null, dpr = 1, raf = 0, kirli = true, isik = 0.8, sonKare = 0;
  let fircaTuval = null, fircaG = null, matDoku = null;
  const gecmis = [], gelecek = [];
  const zamanlar = new Set();
  const animler = new Map();          // key → {tur, bas, sure, ...}
  let surukle = null, kaydetT = 0, balonT = 0, torpuT = 0;
  let altSekme = 'teknik', koleksiyon = 'cemre', aktifCikartma = 'kalp', aktifSus = 'tasM', sanatRenk = '#FFFFFF';
  let seciliParca = null;             // {parmak, liste:'cikartmalar'|'susler', i}
  const firca = { renk: '#FFFFFF', boy: 4, silgi: false };
  const ozel = { h: 340, s: 70, l: 82 };
  const miniOnbellek = new Map();
  let gorunurCb = null, boyutCb = null, olayIptal = [];

  const sinir = (v, a, b) => Math.max(a, Math.min(b, v));
  function tirnakVarsayilan() {
    return { sekil: 'badem', uzunluk: .45, baz: 'seffaf', renk: null, teknik: { id: 'yok', renk2: '#FFFFFF', kalinlik: .3 }, finish: 'parlak', top: false, desen: null, cikartmalar: [], susler: [], firca: [], tohum: Math.floor(Math.random() * 1e6) };
  }
  function tirnakDuzelt(t) {
    const v = Object.assign(tirnakVarsayilan(), t || {});
    v.teknik = Object.assign({ id: 'yok', renk2: '#FFFFFF', kalinlik: .3 }, (t && t.teknik) || {});
    ['cikartmalar', 'susler', 'firca'].forEach(k => { if (!Array.isArray(v[k])) v[k] = []; });
    if (!SEKILLER.some(s => s.id === v.sekil)) v.sekil = 'badem';
    if (!FINISHLER.some(f => f.id === v.finish)) v.finish = 'parlak';
    if (!BAZLAR.some(b => b.id === v.baz)) v.baz = 'seffaf';
    v.uzunluk = sinir(Number(v.uzunluk) || 0, 0, 1);
    return v;
  }
  function elDuzelt(a) { const l = Array.isArray(a) ? a : []; const s = []; for (let i = 0; i < 5; i++) s.push(tirnakDuzelt(l[i])); return s; }
  function varsayilan() {
    return { ten: null, el: null, adim: 'sekil', secim: { hepsi: true, parmak: 2 }, eller: { sol: elDuzelt(), sag: elDuzelt() }, sonRenkler: [], kayitSayisi: 0, sonGorulme: Date.now() };
  }
  function yukle() {
    const v = Object.assign(varsayilan(), ctx.depo.al('durum', {}));
    v.eller = { sol: elDuzelt(v.eller && v.eller.sol), sag: elDuzelt(v.eller && v.eller.sag) };
    if (!v.secim || typeof v.secim !== 'object') v.secim = { hepsi: true, parmak: 2 };
    v.secim.parmak = sinir(Number(v.secim.parmak) || 0, 0, 4);
    if (!ADIMLAR.some(a => a.id === v.adim)) v.adim = 'sekil';
    if (v.el !== 'sol' && v.el !== 'sag') v.el = null;
    if (v.ten && !/^#[0-9a-f]{6}$/i.test(v.ten)) v.ten = null;
    if (!Array.isArray(v.sonRenkler)) v.sonRenkler = [];
    return v;
  }
  function kaydetDurum() {
    if (!ctx || !d) return;
    d.sonGorulme = Date.now();
    ctx.depo.yaz('durum', d);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function kaydetGec() { clearTimeout(kaydetT); kaydetT = setTimeout(kaydetDurum, 400); }
  function ipucuMetni() {
    const g = ctx.depo.al('galeri', []);
    if (g.length) return 'Galeride ' + g.length + ' tasarım 💅';
    const t = d.eller[d.el || 'sag'][2];
    if (t.renk) return (SEKILLER.find(s => s.id === t.sekil) || {}).ad + ' + ' + (FINISHLER.find(f => f.id === t.finish) || {}).ad + ' 💅';
    return '';
  }
  function sonra(fn, ms) { const t = setTimeout(() => { zamanlar.delete(t); if (ctx) fn(); }, ms); zamanlar.add(t); return t; }
  function hepsiniIptal() { zamanlar.forEach(clearTimeout); zamanlar.clear(); }

  /* ------------------------------------------------------------ renk yardımcıları */
  function hexRgb(h) { h = String(h || '#000000').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => sinir(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase(); }
  function rgba(hex, a) { const c = hexRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function karis(h1, h2, t) { const a = hexRgb(h1), b = hexRgb(h2); return rgbHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); }
  const acik = (h, t) => karis(h, '#FFFFFF', t), koyu = (h, t) => karis(h, '#000000', t);
  function hslHex(h, s, l) {
    s /= 100; l /= 100; const k = n => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return rgbHex(f(0) * 255, f(8) * 255, f(4) * 255);
  }
  function parlaklik(hex) { const c = hexRgb(hex); return (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000; }
  function tohumla(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ------------------------------------------------------------ geometri */
  const tirnakGen = p => p.w * 0.74;
  const tirnakBoyu = (t, nw) => nw * 1.28 + t.uzunluk * nw * 1.9;
  function tirnakYolu(p, sekil, nw, L) {
    const hw = nw / 2, c = nw * 0.2;
    p.moveTo(-hw, 0);
    switch (sekil) {
      case 'kare': case 'squoval': {
        const r = sekil === 'kare' ? nw * .1 : nw * .34;
        p.lineTo(-hw, -L + r); p.quadraticCurveTo(-hw, -L, -hw + r, -L); p.lineTo(hw - r, -L); p.quadraticCurveTo(hw, -L, hw, -L + r); p.lineTo(hw, 0); break;
      }
      case 'yuvarlak': p.lineTo(-hw, -L + hw); p.arc(0, -L + hw, hw, Math.PI, Math.PI * 2); p.lineTo(hw, 0); break;
      case 'oval': { const th = nw * .85; p.lineTo(-hw, -L + th); p.bezierCurveTo(-hw, -L + th - th * 1.34, hw, -L + th - th * 1.34, hw, -L + th); p.lineTo(hw, 0); break; }
      case 'coffin': { const tw = hw * .52, r = nw * .07; p.lineTo(-hw, -L * .38); p.lineTo(-tw - r * .3, -L + r); p.quadraticCurveTo(-tw, -L, -tw + r, -L); p.lineTo(tw - r, -L); p.quadraticCurveTo(tw, -L, tw + r * .3, -L + r); p.lineTo(hw, -L * .38); p.lineTo(hw, 0); break; }
      case 'stiletto': p.lineTo(-hw, -L * .3); p.bezierCurveTo(-hw * .9, -L * .62, -hw * .3, -L * .9, 0, -L); p.bezierCurveTo(hw * .3, -L * .9, hw * .9, -L * .62, hw, -L * .3); p.lineTo(hw, 0); break;
      default: p.lineTo(-hw, -L * .42); p.bezierCurveTo(-hw, -L * .78, -hw * .38, -L, 0, -L); p.bezierCurveTo(hw * .38, -L, hw, -L * .78, hw, -L * .42); p.lineTo(hw, 0);
    }
    p.quadraticCurveTo(0, c * 2, -hw, 0);
    p.closePath();
  }
  // tırnak yerel → sahne (mantıksal) koordinat
  function tirnakNokta(taraf, i, lx, ly) {
    const p = PARMAKLAR[i]; const oy = ly - (p.len - .95 * p.w);
    const c = Math.cos(p.aci), s = Math.sin(p.aci);
    let x = p.x + lx * c - oy * s, y = p.y + lx * s + oy * c;
    if (taraf === 'sol') x = W - x;
    return { x, y };
  }
  // sahne → tırnak yerel
  function yerelNokta(taraf, i, x, y) {
    const p = PARMAKLAR[i]; if (taraf === 'sol') x = W - x;
    const dx = x - p.x, dy = y - p.y, c = Math.cos(p.aci), s = Math.sin(p.aci);
    return { x: dx * c + dy * s, y: -dx * s + dy * c + (p.len - .95 * p.w) };
  }
  function parmakBul(x, y) {
    const taraf = d.el;
    for (let i = 4; i >= 0; i--) {
      const p = PARMAKLAR[i], t = d.eller[taraf][i], nw = tirnakGen(p), L = tirnakBoyu(t, nw);
      const q = yerelNokta(taraf, i, x, y);
      if (Math.abs(q.x) <= p.w / 2 + 7 && q.y <= p.w * .3 && q.y >= -L - 12) return i;
    }
    return -1;
  }
  function yerelNormal(taraf, i, x, y) {
    const p = PARMAKLAR[i], t = d.eller[taraf][i], nw = tirnakGen(p), L = tirnakBoyu(t, nw);
    const q = yerelNokta(taraf, i, x, y);
    return { x: sinir(q.x / (nw / 2), -1.1, 1.1), y: sinir(-q.y / L, -.1, 1.08) };
  }
  function sahneNokta(e) {
    const r = tuval.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }
  function istemciNokta(x, y) {
    const r = tuval.getBoundingClientRect();
    return { x: r.left + x * (r.width / W), y: r.top + y * (r.height / H) };
  }

  /* ------------------------------------------------------------ çizim: el */
  function elCiz(g, taraf, tirnaklar, o) {
    const ten = o.ten || '#F5C6AC';
    g.save();
    if (taraf === 'sol') { g.translate(W, 0); g.scale(-1, 1); }
    // parmaklar (baş parmak hariç) önce, avuç üstüne, baş parmak en son
    for (let i = 1; i < 5; i++) parmakCiz(g, PARMAKLAR[i], ten);
    avucCiz(g, ten);
    parmakCiz(g, PARMAKLAR[0], ten);
    for (let i = 0; i < 5; i++) {
      const p = PARMAKLAR[i];
      g.save(); g.translate(p.x, p.y); g.rotate(p.aci); g.translate(0, -(p.len - .95 * p.w));
      tirnakCiz(g, tirnaklar[i], tirnakGen(p), o, i, taraf);
      g.restore();
    }
    // törpü animasyonu (sahne koordinatında)
    if (o.canli) torpuCiz(g, taraf, tirnaklar);
    g.restore();
  }
  function parmakCiz(g, p, ten) {
    g.save(); g.translate(p.x, p.y); g.rotate(p.aci);
    const hw = p.w / 2;
    const grd = g.createLinearGradient(-hw, 0, hw, 0);
    grd.addColorStop(0, acik(ten, .1)); grd.addColorStop(.4, ten); grd.addColorStop(1, koyu(ten, .16));
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(-hw, hw * .4); g.lineTo(-hw, -p.len + hw); g.arc(0, -p.len + hw, hw, Math.PI, 0); g.lineTo(hw, hw * .4); g.arc(0, hw * .4, hw, 0, Math.PI); g.closePath(); g.fill();
    // eklem çizgileri
    g.strokeStyle = rgba(koyu(ten, .35), .28); g.lineWidth = 1.2; g.lineCap = 'round';
    [.42, .72].forEach(k => { g.beginPath(); g.moveTo(-hw * .55, -p.len * k + 1.5); g.quadraticCurveTo(0, -p.len * k - 2, hw * .55, -p.len * k + 1.5); g.stroke(); });
    // uç altı yumuşak gölge (tırnak yatağı)
    const ug = g.createLinearGradient(0, -p.len, 0, -p.len + p.w);
    ug.addColorStop(0, rgba(koyu(ten, .3), .18)); ug.addColorStop(1, rgba(koyu(ten, .3), 0));
    g.fillStyle = ug; g.fillRect(-hw, -p.len, p.w, p.w);
    g.restore();
  }
  function avucCiz(g, ten) {
    g.save();
    const yol = new Path2D();
    yol.moveTo(108, 268); yol.quadraticCurveTo(98, 340, 104, 400); yol.quadraticCurveTo(108, 452, 132, 478);
    yol.lineTo(262, 478); yol.quadraticCurveTo(286, 432, 284, 380); yol.quadraticCurveTo(287, 322, 280, 288);
    yol.quadraticCurveTo(200, 300, 108, 268); yol.closePath();
    const grd = g.createRadialGradient(178, 350, 10, 190, 360, 170);
    grd.addColorStop(0, acik(ten, .08)); grd.addColorStop(.6, ten); grd.addColorStop(1, koyu(ten, .14));
    g.fillStyle = grd; g.fill(yol);
    g.clip(yol);
    g.strokeStyle = rgba(koyu(ten, .4), .16); g.lineWidth = 8; g.stroke(yol);
    // boğum çukurları
    g.strokeStyle = rgba(koyu(ten, .35), .16); g.lineWidth = 1.4;
    [156, 200, 242].forEach(x => { g.beginPath(); g.moveTo(x - 6, 286); g.quadraticCurveTo(x, 294, x + 6, 286); g.stroke(); });
    g.restore();
  }

  /* ------------------------------------------------------------ çizim: tırnak katmanları */
  function tirnakCiz(g, t, nw, o, i, taraf) {
    const L = tirnakBoyu(t, nw), hw = nw / 2, seed = (t.tohum || 1) + i * 131;
    const yol = new Path2D(); tirnakYolu(yol, t.sekil, nw, L);
    const ten = o.ten || '#F5C6AC';
    const simdi = o.simdi || 0;
    g.save(); g.clip(yol);
    // 1. doğal tırnak
    g.fillStyle = karis(ten, '#F3BFC8', .5); g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2);
    // serbest uç (parmak ucundan sonrası) daha açık
    g.fillStyle = 'rgba(255,255,255,.42)'; g.fillRect(-hw - 1, -L - 1, nw + 2, L - nw * 1.28 + 1);
    // lunula
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(0, nw * .05, hw * .62, nw * .26, 0, 0, Math.PI * 2); g.fill();
    // 2. baz
    const baz = BAZLAR.find(b => b.id === t.baz);
    if (baz && baz.renk) { g.fillStyle = baz.renk; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); }
    // 3. renk (+ oje sürme animasyonu)
    const an = o.canli ? animler.get(taraf + i) : null;
    if (t.renk) {
      if (an && an.tur === 'oje') {
        const p = sinir((simdi - an.bas) / an.sure, 0, 1);
        const kulvar = [[-1 / 3, 1 / 3, 0], [-1, -1 / 3, .18], [1 / 3, 1, .36]];
        kulvar.forEach(([a, b, bas]) => {
          const lp = sinir((p - bas) / .58, 0, 1); if (lp <= 0) return;
          g.save(); g.beginPath(); g.rect(a * hw - 1, -L * lp - 2, (b - a) * hw + 2, L * lp + hw + 4); g.clip();
          g.fillStyle = t.renk; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); g.restore();
        });
        if (p >= 1) animler.delete(taraf + i);
      } else { g.fillStyle = t.renk; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); }
    }
    // 4. teknik
    teknikCiz(g, t, nw, L, seed, o);
    // 5. desen
    if (t.desen) desenCiz(g, t.desen, nw, L);
    // 6. çıkartmalar
    t.cikartmalar.forEach(c => { g.save(); g.translate(c.x * hw, -c.y * L); g.rotate(c.don || 0); const f = CIKARTMA_CIZ[c.id]; if (f) f(g, (c.olcek || .5) * nw, c.renk || '#FFFFFF'); g.restore(); });
    // 7. fırça
    if (t.firca.length && o.canli !== false) fircaKatmani(g, t, nw, L, i, taraf, o);
    // 8. hacim gölgesi
    const vg = g.createLinearGradient(-hw, 0, hw, 0);
    vg.addColorStop(0, 'rgba(70,30,50,.22)'); vg.addColorStop(.22, 'rgba(70,30,50,0)'); vg.addColorStop(.72, 'rgba(70,30,50,0)'); vg.addColorStop(1, 'rgba(70,30,50,.28)');
    g.fillStyle = vg; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2);
    const cg = g.createLinearGradient(0, nw * .35, 0, -nw * .3);
    cg.addColorStop(0, 'rgba(70,30,50,.22)'); cg.addColorStop(1, 'rgba(70,30,50,0)');
    g.fillStyle = cg; g.fillRect(-hw - 1, -nw * .3, nw + 2, nw * .7);
    // 9. finish
    finishCiz(g, t, nw, L, o, seed);
    // 10. top coat parıltı animasyonu
    if (an && an.tur === 'top') {
      const p = sinir((simdi - an.bas) / an.sure, 0, 1);
      g.save(); g.translate(0, -L / 2); g.rotate(-.5);
      const y = -L * 1.1 + L * 2.2 * p;
      const bg = g.createLinearGradient(0, y - hw * .9, 0, y + hw * .9);
      bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(.5, 'rgba(255,255,255,.85)'); bg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = bg; g.fillRect(-L, y - hw, L * 2, hw * 2); g.restore();
      if (p >= 1) animler.delete(taraf + i);
    }
    g.restore();
    // kenar
    g.strokeStyle = 'rgba(59,52,68,.25)'; g.lineWidth = .8; g.stroke(yol);
    // 11. 3D süsler (kırpma yok)
    t.susler.forEach(s => { g.save(); g.translate(s.x * hw, -s.y * L); g.rotate(s.don || 0); const f = SUS_CIZ[s.id]; if (f) f(g, (s.olcek || .3) * nw, s.renk || '#FFFFFF'); g.restore(); });
    // seçili parça vurgusu
    if (o.canli && seciliParca && seciliParca.parmak === i) {
      const liste = t[seciliParca.liste], pr = liste && liste[seciliParca.i];
      if (pr) { g.save(); g.translate(pr.x * hw, -pr.y * L); g.setLineDash([3, 2]); g.strokeStyle = '#EE8AAA'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, (pr.olcek || .4) * nw * .62 + 3, 0, Math.PI * 2); g.stroke(); g.restore(); }
    }
    // 12. seçim halkası
    if (o.secim && o.canli) {
      const sec = o.secim.hepsi || o.secim.parmak === i;
      if (sec) {
        g.save(); g.setLineDash([4, 3]); g.lineDashOffset = -(o.isik || 0) * 8;
        g.lineWidth = o.secim.hepsi ? 1.6 : 2.4; g.strokeStyle = o.secim.hepsi ? 'rgba(238,138,170,.8)' : '#EE8AAA';
        g.shadowColor = 'rgba(238,138,170,.9)'; g.shadowBlur = o.secim.hepsi ? 4 : 10;
        const halka = new Path2D(); tirnakYolu(halka, t.sekil, nw + 6, L + 4); g.translate(0, 2); g.stroke(halka); g.restore();
      }
    }
    // oje fırçası (animasyon)
    if (an && an.tur === 'oje' && t.renk) {
      const p = sinir((simdi - an.bas) / an.sure, 0, 1);
      const kulvar = [[0, 0], [-2 / 3, .18], [2 / 3, .36]];
      for (const [kx, bas] of kulvar) { const lp = (p - bas) / .58; if (lp > 0 && lp < 1) { fircaSprite(g, kx * hw, -L * lp, t.renk, hw); break; } }
    }
  }
  function fircaSprite(g, x, y, renk, hw) {
    g.save(); g.translate(x, y); g.rotate(.35);
    g.strokeStyle = '#3B3444'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -6); g.lineTo(0, -hw * 2.6); g.stroke();
    g.fillStyle = renk; g.strokeStyle = 'rgba(59,52,68,.3)'; g.lineWidth = .8; g.beginPath(); g.ellipse(0, -2, 3, 6.5, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-1, -4, 1, 2.5, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function torpuCiz(g, taraf, tirnaklar) {
    const an = animler.get(taraf + 'torpu'); if (!an) return;
    const p = sinir((performance.now() - an.bas) / an.sure, 0, 1);
    if (p >= 1) { animler.delete(taraf + 'torpu'); return; }
    an.parmaklar.forEach(i => {
      const pr = PARMAKLAR[i], t = tirnaklar[i], nw = tirnakGen(pr), L = tirnakBoyu(t, nw);
      const s = Math.sin(p * Math.PI * 4) * nw * .7;
      g.save(); g.translate(pr.x, pr.y); g.rotate(pr.aci); g.translate(s, -(pr.len - .95 * pr.w) - L - 5);
      g.fillStyle = '#F2A7B8'; g.strokeStyle = 'rgba(59,52,68,.35)'; g.lineWidth = .8;
      g.beginPath(); g.roundRect ? g.roundRect(-nw * .75, -4, nw * 1.5, 8, 3) : g.rect(-nw * .75, -4, nw * 1.5, 8); g.fill(); g.stroke();
      g.fillStyle = 'rgba(59,52,68,.25)'; for (let k = -3; k <= 3; k++) { g.fillRect(k * nw * .2 - .5, -2.5, 1, 5); }
      g.restore();
    });
  }
  function teknikCiz(g, t, nw, L, seed, o) {
    const tk = t.teknik; if (!tk || tk.id === 'yok') return;
    const ph = (o && o.isik) || 0;
    const hw = nw / 2, r2 = tk.renk2 || '#FFFFFF';
    const gulumseme = k => { const y = -L + L * k; g.beginPath(); g.moveTo(-hw - 2, y + L * .12); g.quadraticCurveTo(0, y - L * .14, hw + 2, y + L * .12); g.lineTo(hw + 2, -L - 4); g.lineTo(-hw - 2, -L - 4); g.closePath(); };
    switch (tk.id) {
      case 'french': gulumseme(sinir(tk.kalinlik, .1, .6)); g.fillStyle = r2; g.fill(); break;
      case 'ombre': { const grd = g.createLinearGradient(0, 0, 0, -L); grd.addColorStop(.12, rgba(r2, 0)); grd.addColorStop(.82, rgba(r2, 1)); g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); break; }
      case 'mermer': {
        const rnd = tohumla(seed + 7); g.strokeStyle = r2; g.lineCap = 'round';
        for (let k = 0; k < 6; k++) {
          g.globalAlpha = .35 + rnd() * .5; g.lineWidth = .5 + rnd() * 1.5; g.beginPath();
          let x = (rnd() * 2 - 1) * hw, y = -rnd() * L; g.moveTo(x, y);
          for (let s = 0; s < 4; s++) { const nx = x + (rnd() * 2 - 1) * hw, ny = y - rnd() * L * .3; g.quadraticCurveTo(x + (rnd() * 2 - 1) * hw * .8, y - rnd() * L * .25, nx, ny); x = nx; y = ny; }
          g.stroke();
        }
        for (let k = 0; k < 3; k++) { g.globalAlpha = .1 + rnd() * .12; g.fillStyle = r2; g.beginPath(); g.ellipse((rnd() * 2 - 1) * hw * .6, -rnd() * L, hw * .5, L * .12, rnd() * 3, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1; break;
      }
      case 'aura': { const grd = g.createRadialGradient(0, -L * .5, 0, 0, -L * .5, hw * 1.05); grd.addColorStop(0, rgba(r2, .95)); grd.addColorStop(.45, rgba(r2, .7)); grd.addColorStop(1, rgba(r2, 0)); g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); break; }
      case 'glitter': { const rnd = tohumla(seed + 3); for (let k = 0; k < 120; k++) { const y = -L + rnd() * rnd() * L * 1.05, x = (rnd() * 2 - 1) * hw; g.globalAlpha = .4 + rnd() * .6; g.fillStyle = k % 3 ? r2 : '#FFFFFF'; g.beginPath(); g.arc(x, y, .4 + rnd() * 1.2, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; break; }
      case 'kromUc': { g.save(); gulumseme(.36); g.clip(); g.fillStyle = r2; g.fillRect(-hw - 1, -L - 4, nw + 2, L + hw); metalik(g, hw, L, -.35, ph, r2); g.restore(); break; }
      case 'kromToz': { g.save(); g.globalAlpha = .62; metalik(g, hw, L, -.4, ph, karis(t.renk || '#E8E8EE', r2, .45)); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .5; const tg = g.createLinearGradient(-hw, -L, hw, 0); tg.addColorStop(0, 'rgba(255,255,255,0)'); tg.addColorStop(sinir(.5 + Math.sin(ph * .9) * .15, .1, .9), 'rgba(255,255,255,.9)'); tg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = tg; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); g.restore(); break; }
    }
  }
  function desenCiz(g, ds, nw, L) {
    const hw = nw / 2, renk = ds.renk || '#FFFFFF';
    g.save(); g.fillStyle = renk; g.strokeStyle = renk;
    if (ds.id === 'puantiye') {
      const ad = nw * .3, r = nw * .07; let satir = 0;
      for (let y = nw * .2; y > -L - ad; y -= ad, satir++) for (let x = -hw + (satir % 2 ? ad / 2 : 0); x <= hw + ad; x += ad) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    } else if (ds.id === 'cizgi') {
      g.lineWidth = nw * .09; g.rotate(-.5);
      for (let y = -L * 1.6; y < L; y += nw * .3) { g.beginPath(); g.moveTo(-L, y); g.lineTo(L, y); g.stroke(); }
    } else if (ds.id === 'ekose') {
      g.globalAlpha = .55; g.lineWidth = nw * .14;
      for (let y = nw * .2; y > -L - nw; y -= nw * .42) { g.beginPath(); g.moveTo(-hw - 2, y); g.lineTo(hw + 2, y); g.stroke(); }
      for (let x = -hw + nw * .2; x <= hw; x += nw * .42) { g.beginPath(); g.moveTo(x, nw); g.lineTo(x, -L - 2); g.stroke(); }
      g.globalAlpha = .35; g.lineWidth = nw * .04;
      for (let y = nw * .2 - nw * .21; y > -L - nw; y -= nw * .42) { g.beginPath(); g.moveTo(-hw - 2, y); g.lineTo(hw + 2, y); g.stroke(); }
    }
    g.restore();
  }
  function fircaKatmani(g, t, nw, L, i, taraf, o) {
    if (!fircaTuval) return;
    const hw = nw / 2, fg = fircaG;
    fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, fircaTuval.width, fircaTuval.height);
    fg.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (taraf === 'sol') { fg.translate(W, 0); fg.scale(-1, 1); }
    const p = PARMAKLAR[i]; fg.translate(p.x, p.y); fg.rotate(p.aci); fg.translate(0, -(p.len - .95 * p.w));
    fg.lineCap = 'round'; fg.lineJoin = 'round';
    t.firca.forEach(v => {
      if (!v.n || v.n.length < 1) return;
      fg.globalCompositeOperation = v.silgi ? 'destination-out' : 'source-over';
      fg.strokeStyle = v.silgi ? '#000' : (v.renk || '#FFFFFF'); fg.lineWidth = Math.max(.6, (v.boy || .12) * nw);
      fg.beginPath();
      const a = v.n[0]; fg.moveTo(a[0] * hw, -a[1] * L);
      if (v.n.length === 1) fg.lineTo(a[0] * hw + .1, -a[1] * L);
      for (let k = 1; k < v.n.length; k++) fg.lineTo(v.n[k][0] * hw, -v.n[k][1] * L);
      fg.stroke();
    });
    fg.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(o.olcek || dpr, 0, 0, o.olcek || dpr, o.ox || 0, o.oy || 0); g.drawImage(fircaTuval, 0, 0, W, H); g.restore();
  }
  function finishCiz(g, t, nw, L, o, seed) {
    const hw = nw / 2, f = t.finish, ph = o.isik || 0;
    const kutu = () => g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2);
    if (f === 'mat') { if (matDoku) { g.save(); g.globalAlpha = .9; g.fillStyle = matDoku; kutu(); g.restore(); } return; }
    if (f === 'krom') metalik(g, hw, L, -.35, ph, t.renk || '#E8E8EE');
    if (f === 'aurora') auroraCiz(g, hw, L, ph, t.renk);
    if (f === 'holo') holoCiz(g, hw, L, ph);
    if (f === 'glitter') simCiz(g, hw, L, tohumla(seed + 11), ph, 90, true);
    if (f === 'shimmer') { simCiz(g, hw, L, tohumla(seed + 13), ph, 220, false); const sg = g.createLinearGradient(-hw, 0, hw, -L); sg.addColorStop(.3, 'rgba(255,255,255,0)'); sg.addColorStop(.5 + Math.sin(ph) * .08, 'rgba(255,255,255,.35)'); sg.addColorStop(.7, 'rgba(255,255,255,0)'); g.fillStyle = sg; kutu(); }
    if (f === 'catEye') kediGozu(g, hw, L, ph);
    spekular(g, hw, L, nw, (f === 'krom' || f === 'aurora') ? 1.1 : .8, t.top);
  }
  function spekular(g, hw, L, nw, guc, top) {
    const grd = g.createRadialGradient(-hw * .35, -L * .62, 0, -hw * .35, -L * .62, hw * .95);
    grd.addColorStop(0, 'rgba(255,255,255,' + (.5 * guc) + ')'); grd.addColorStop(.6, 'rgba(255,255,255,' + (.1 * guc) + ')'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2);
    g.strokeStyle = 'rgba(255,255,255,' + (.45 * guc) + ')'; g.lineWidth = hw * .12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-hw * .78, -L * .15); g.quadraticCurveTo(-hw * .86, -L * .5, -hw * .55, -L * .86); g.stroke();
    if (top) {
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-hw * .42, -L * .7, hw * .16, L * .13, -.25, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-hw * .36, -L * .45, hw * .09, L * .05, -.25, 0, Math.PI * 2); g.fill();
      const tg = g.createLinearGradient(0, -L, 0, -L + hw * .5); tg.addColorStop(0, 'rgba(255,255,255,.5)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = tg; g.fillRect(-hw - 1, -L - 1, nw + 2, hw * .6);
    }
  }
  function metalik(g, hw, L, aci, ph, base) {
    const R = Math.hypot(hw, L), a = aci + Math.sin(ph * .7) * .1, dx = Math.cos(a) * R, dy = Math.sin(a) * R;
    const grd = g.createLinearGradient(-dx, -L / 2 - dy, dx, -L / 2 + dy);
    const k = koyu(base, .45), l = acik(base, .75), l2 = acik(base, .92);
    [[0, k], [.18, l], [.35, base], [.5, l2], [.62, koyu(base, .25)], [.8, l], [1, k]].forEach(s => grd.addColorStop(s[0], s[1]));
    g.save(); g.globalAlpha = .92 * g.globalAlpha; g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2); g.restore();
  }
  function auroraCiz(g, hw, L, ph, base) {
    // Aurora / inci krom: ince film yanardönerliği. Açık zeminde bantlar rengi boyar (multiply), koyu zeminde ışır (screen);
    // üstüne açıyla kayan inci parlaması. Işık fazı (ph) ile bantlar yavaşça döner.
    const acikMi = parlaklik(base || '#F4CFD8') > 150;
    const a = ph * .5 - .7, R = Math.hypot(hw, L) * 1.15, dx = Math.cos(a) * R, dy = Math.sin(a) * R;
    const grd = g.createLinearGradient(-dx, -L / 2 - dy, dx, -L / 2 + dy);
    const bant = acikMi ? ['#FF9BCB', '#D3A9FF', '#8FD0FF', '#FFD9EC', '#FFE9A8', '#A6E8FF', '#FFB0D6', '#C9B3FF'] : ['#FF7FB8', '#B98CFF', '#6EC6FF', '#FFE58A', '#7FF0C8', '#FF8FC6', '#A48CFF'];
    bant.forEach((c, i, arr) => grd.addColorStop(i / (arr.length - 1), c));
    const kutu = () => g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2);
    g.save();
    if (acikMi) {
      g.globalCompositeOperation = 'multiply'; g.globalAlpha = .3; g.fillStyle = grd; kutu();
      g.globalCompositeOperation = 'screen'; g.globalAlpha = .34; g.fillStyle = grd; kutu();
    } else {
      g.globalCompositeOperation = 'screen'; g.globalAlpha = .58; g.fillStyle = grd; kutu();
      g.globalCompositeOperation = 'overlay'; g.globalAlpha = .4; g.fillStyle = grd; kutu();
    }
    // inci parlaması: çapraz beyaz bant, fazla kayar
    g.globalCompositeOperation = acikMi ? 'soft-light' : 'overlay'; g.globalAlpha = acikMi ? .9 : .55;
    const pg = g.createLinearGradient(-hw, -L, hw, 0); const m = sinir(.45 + Math.sin(ph) * .16, .08, .92);
    pg.addColorStop(Math.max(0, m - .22), 'rgba(255,255,255,0)'); pg.addColorStop(m, 'rgba(255,255,255,1)'); pg.addColorStop(Math.min(1, m + .22), 'rgba(255,255,255,0)');
    g.fillStyle = pg; kutu();
    // sedef noktası: ortada yumuşak inci ışığı
    g.globalCompositeOperation = 'screen'; g.globalAlpha = acikMi ? .35 : .3;
    const rg = g.createRadialGradient(hw * .15, -L * .42, 0, hw * .15, -L * .42, hw * 1.2); rg.addColorStop(0, '#FFF6FA'); rg.addColorStop(1, 'rgba(255,246,250,0)');
    g.fillStyle = rg; kutu();
    g.restore();
  }
  function holoCiz(g, hw, L, ph) {
    const R = Math.hypot(hw, L), a = -.9 + Math.sin(ph * .5) * .15, dx = Math.cos(a) * R, dy = Math.sin(a) * R;
    const grd = g.createLinearGradient(-dx, -L / 2 - dy, dx, -L / 2 + dy);
    for (let i = 0; i <= 6; i++) grd.addColorStop(i / 6, 'hsl(' + ((i * 60 + ph * 40) % 360) + ',100%,72%)');
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .42; g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = .35; g.strokeStyle = '#FFFFFF'; g.lineWidth = 1.2;
    for (let y = -L * 1.4; y < L; y += 5) { g.beginPath(); g.moveTo(-hw - 2, y); g.lineTo(hw + 2, y - hw * .9); g.stroke(); }
    g.restore();
  }
  function kediGozu(g, hw, L, ph) {
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2);
    g.save(); g.translate(Math.sin(ph * .8) * hw * .15, -L / 2); g.rotate(-.5);
    const grd = g.createLinearGradient(-hw * .55, 0, hw * .55, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(.5, 'rgba(255,255,255,.8)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(-hw * .55, -L * 1.5, hw * 1.1, L * 3);
    const g2_ = g.createLinearGradient(hw * .7, 0, hw * 1.1, 0); g2_.addColorStop(0, 'rgba(255,255,255,0)'); g2_.addColorStop(.5, 'rgba(255,255,255,.35)'); g2_.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = g2_; g.fillRect(hw * .7, -L * 1.5, hw * .4, L * 3);
    g.restore();
  }
  function simCiz(g, hw, L, rnd, ph, n, buyuk) {
    const renkler = ['#FFFFFF', '#FFE9A8', '#FFD1DC', '#E2F1FF', '#FFF7D9'];
    for (let k = 0; k < n; k++) {
      const x = (rnd() * 2 - 1) * hw, y = -rnd() * L * 1.05 + hw * .15, r = buyuk ? .5 + rnd() * 1.3 : .3 + rnd() * .6;
      g.globalAlpha = (buyuk ? .5 : .22) + rnd() * .5; g.fillStyle = renkler[k % 5]; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    if (buyuk) for (let k = 0; k < 7; k++) { const x = (rnd() * 2 - 1) * hw * .85, y = -rnd() * L; g.globalAlpha = .35 + .65 * Math.abs(Math.sin(ph * 2.2 + k * 1.7)); yildiz4(g, x, y, 1.6 + rnd() * 1.8); }
    g.globalAlpha = 1;
  }
  function yildiz4(g, x, y, r) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); }
  function matDokuYap() {
    const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d');
    const im = g.createImageData(48, 48); for (let i = 0; i < im.data.length; i += 4) { const v = 120 + Math.random() * 135; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 14 + Math.random() * 14; }
    g.putImageData(im, 0, 0); return c;
  }

  /* ------------------------------------------------------------ çıkartma & süs çizimleri (yerel, merkez 0,0; s = çap) */
  const CIKARTMA_CIZ = {
    kalp(g, s, renk) { const r = s / 2; g.fillStyle = renk; g.beginPath(); g.moveTo(0, r * .95); g.bezierCurveTo(-r * 1.25, r * .1, -r * .95, -r * .95, 0, -r * .35); g.bezierCurveTo(r * .95, -r * .95, r * 1.25, r * .1, 0, r * .95); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-r * .35, -r * .4, r * .18, r * .12, -.6, 0, Math.PI * 2); g.fill(); },
    yildiz(g, s, renk) { const R = s / 2, r = R * .45; g.fillStyle = renk; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); },
    cicek(g, s, renk) { const r = s * .2; g.fillStyle = renk; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 - Math.PI / 2; g.beginPath(); g.ellipse(Math.cos(a) * s * .27, Math.sin(a) * s * .27, r, r * .78, a, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#FFD966'; g.beginPath(); g.arc(0, 0, s * .14, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-s * .04, -s * .04, s * .05, 0, Math.PI * 2); g.fill(); },
    kelebek(g, s, renk) {
      g.fillStyle = renk;
      [[-1, -.12, .27, .22, -.5], [1, -.12, .27, .22, .5], [-1, .18, .19, .15, .4], [1, .18, .19, .15, -.4]].forEach(w => { g.beginPath(); g.ellipse(w[0] * s * .22, w[1] * s, s * w[2], s * w[3], w[4], 0, Math.PI * 2); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.55)'; [[-.26, -.16], [.26, -.16]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .06, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#3B3444'; g.beginPath(); g.ellipse(0, .02 * s, s * .05, s * .3, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#3B3444'; g.lineWidth = Math.max(.6, s * .03); g.beginPath(); g.moveTo(0, -s * .26); g.quadraticCurveTo(-s * .12, -s * .42, -s * .18, -s * .44); g.moveTo(0, -s * .26); g.quadraticCurveTo(s * .12, -s * .42, s * .18, -s * .44); g.stroke();
    },
    kiraz(g, s, renk) {
      g.strokeStyle = '#6E8B3D'; g.lineWidth = Math.max(.8, s * .06); g.lineCap = 'round'; g.beginPath(); g.moveTo(-s * .18, s * .1); g.quadraticCurveTo(-s * .05, -s * .2, s * .06, -s * .38); g.moveTo(s * .2, s * .14); g.quadraticCurveTo(s * .14, -s * .15, s * .06, -s * .38); g.stroke();
      g.fillStyle = '#7CCB9A'; g.beginPath(); g.ellipse(s * .16, -s * .36, s * .14, s * .07, -.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = renk; [[-.18, .14], [.2, .18]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .18, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.55)'; [[-.24, .07], [.14, .11]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .05, 0, Math.PI * 2); g.fill(); });
    },
    fiyonk(g, s, renk) {
      g.fillStyle = renk; [[-.26, 0], [.26, 0]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .26, s * .17, 0, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = koyu(renk, .18); [[-.18, .24], [.18, .24]].forEach((p, k) => { g.beginPath(); g.moveTo(0, s * .06); g.lineTo(p[0] * s, p[1] * s); g.lineTo(p[0] * s * 1.5, p[1] * s * .7); g.closePath(); g.fill(); });
      g.fillStyle = koyu(renk, .1); g.beginPath(); g.arc(0, 0, s * .1, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; [[-.3, -.07], [.22, -.07]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .08, s * .04, 0, 0, Math.PI * 2); g.fill(); });
    },
    gulen(g, s, renk) {
      g.fillStyle = renk; g.beginPath(); g.arc(0, 0, s / 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3B3444'; [[-.18, -.1], [.18, -.1]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .06, s * .09, 0, 0, Math.PI * 2); g.fill(); });
      g.strokeStyle = '#3B3444'; g.lineWidth = Math.max(.8, s * .06); g.lineCap = 'round'; g.beginPath(); g.arc(0, s * .05, s * .24, .25 * Math.PI, .75 * Math.PI); g.stroke();
      g.fillStyle = 'rgba(238,138,170,.65)'; [[-.3, .12], [.3, .12]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .08, 0, Math.PI * 2); g.fill(); });
    },
    ayYildiz(g, s, renk) {
      const R = s * .42; g.fillStyle = renk; g.beginPath(); g.moveTo(0, -R); g.bezierCurveTo(-R * 1.35, -R * .6, -R * 1.35, R * .6, 0, R); g.bezierCurveTo(-R * .4, R * .6, -R * .4, -R * .6, 0, -R); g.fill();
      g.save(); g.translate(s * .22, 0); CIKARTMA_CIZ.yildiz(g, s * .34, renk); g.restore();
    },
    pati(g, s, renk) {
      g.fillStyle = renk; g.beginPath(); g.ellipse(0, s * .14, s * .26, s * .2, 0, 0, Math.PI * 2); g.fill();
      [[-.3, -.06], [-.11, -.26], [.11, -.26], [.3, -.06]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .1, 0, Math.PI * 2); g.fill(); });
    }
  };
  function tasCiz(g, s, renk) {
    const r = s / 2, kristal = parlaklik(renk) > 235;
    g.save(); g.shadowColor = 'rgba(59,52,68,.45)'; g.shadowBlur = r * .6; g.shadowOffsetY = r * .25;
    const grd = g.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r);
    grd.addColorStop(0, acik(renk, .7)); grd.addColorStop(.6, renk); grd.addColorStop(1, koyu(renk, .35));
    g.fillStyle = grd; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.restore();
    if (kristal) { ['#FFD6E4', '#E2F1FF', '#FFF7D9', '#EADFFF'].forEach((c, k) => { g.fillStyle = rgba(c, .55); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, k * Math.PI / 2, (k + 1) * Math.PI / 2); g.closePath(); g.fill(); }); }
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(.5, r * .08);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
    g.beginPath(); g.arc(0, 0, r * .55, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = rgba(koyu(renk, .5), .6); g.lineWidth = Math.max(.5, r * .1); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(-r * .35, -r * .38, r * .22, r * .14, -.7, 0, Math.PI * 2); g.fill();
  }
  const SUS_CIZ = {
    tasS: tasCiz, tasM: tasCiz, tasL: tasCiz,
    inci(g, s) {
      const r = s / 2; g.save(); g.shadowColor = 'rgba(59,52,68,.4)'; g.shadowBlur = r * .6; g.shadowOffsetY = r * .25;
      const grd = g.createRadialGradient(-r * .3, -r * .35, 0, 0, 0, r);
      grd.addColorStop(0, '#FFFFFF'); grd.addColorStop(.35, '#FBEFF3'); grd.addColorStop(.75, '#EBD6DE'); grd.addColorStop(1, '#C9AEB9');
      g.fillStyle = grd; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.restore();
      g.fillStyle = 'rgba(226,241,255,.5)'; g.beginPath(); g.arc(r * .3, r * .3, r * .32, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(-r * .32, -r * .36, r * .2, r * .13, -.7, 0, Math.PI * 2); g.fill();
    },
    fiyonk3d(g, s, renk) {
      g.save(); g.shadowColor = 'rgba(59,52,68,.35)'; g.shadowBlur = s * .12; g.shadowOffsetY = s * .06;
      const lg = g.createLinearGradient(0, -s * .2, 0, s * .2); lg.addColorStop(0, acik(renk, .35)); lg.addColorStop(1, koyu(renk, .12));
      g.fillStyle = lg; [[-.27, 0], [.27, 0]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .27, s * .18, 0, 0, Math.PI * 2); g.fill(); });
      g.restore();
      g.fillStyle = koyu(renk, .3); [[-.27, 0], [.27, 0]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s + s * .02, s * .13, s * .07, 0, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = koyu(renk, .15); [[-1, 1], [1, 1]].forEach(p => { g.beginPath(); g.moveTo(0, s * .08); g.lineTo(p[0] * s * .2, s * .3); g.lineTo(p[0] * s * .3, s * .22); g.lineTo(p[0] * s * .08, s * .06); g.closePath(); g.fill(); });
      const kg = g.createRadialGradient(-s * .03, -s * .03, 0, 0, 0, s * .12); kg.addColorStop(0, acik(renk, .5)); kg.addColorStop(1, koyu(renk, .25));
      g.fillStyle = kg; g.beginPath(); g.arc(0, 0, s * .11, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)'; [[-.33, -.08], [.2, -.08]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .08, s * .04, -.2, 0, Math.PI * 2); g.fill(); });
    },
    zincir(g, s, renk) {
      const altin = parlaklik(renk) > 235 ? '#D4AF37' : renk, n = 7, adim = s / n;
      g.save(); g.shadowColor = 'rgba(59,52,68,.35)'; g.shadowBlur = 2; g.shadowOffsetY = 1;
      g.lineWidth = Math.max(.9, adim * .22); g.strokeStyle = altin;
      for (let k = 0; k < n; k++) { const x = -s / 2 + adim * (k + .5); g.beginPath(); g.ellipse(x, 0, adim * .55, adim * .3, k % 2 ? 0 : Math.PI / 2 * .001, 0, Math.PI * 2); g.stroke(); }
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(.5, adim * .1);
      for (let k = 0; k < n; k++) { const x = -s / 2 + adim * (k + .5); g.beginPath(); g.ellipse(x - adim * .1, -adim * .08, adim * .32, adim * .15, 0, Math.PI * 1.1, Math.PI * 1.8); g.stroke(); }
    }
  };

  /* ------------------------------------------------------------ sahne döngüsü */
  function canliFinishVar() {
    if (ctx.azHareket) return false;
    return d.eller[d.el].some(t => ['aurora', 'holo', 'krom', 'catEye', 'glitter', 'shimmer'].includes(t.finish) || (t.teknik && (t.teknik.id === 'kromUc' || t.teknik.id === 'kromToz')));
  }
  function sahneCiz(simdi) {
    if (!g2 || !d || !d.el) return;
    kirli = false;
    g2.setTransform(dpr, 0, 0, dpr, 0, 0); g2.clearRect(0, 0, W, H);
    elCiz(g2, d.el, d.eller[d.el], { ten: d.ten, isik, secim: d.secim, canli: true, simdi: simdi || performance.now(), olcek: dpr });
  }
  function dongu(ts) {
    raf = 0; if (!ctx || !tuval) return;
    const hareket = !ctx.azHareket && document.visibilityState !== 'hidden';
    animler.forEach((a, k) => { if (ts > a.bas + a.sure + 60) animler.delete(k); });
    const canli = hareket && (animler.size > 0 || canliFinishVar());
    if (kirli || (canli && ts - sonKare >= 33)) { sonKare = ts; if (hareket) isik += 0.022; sahneCiz(ts); }
    if (canli || kirli || animler.size) raf = requestAnimationFrame(dongu);
  }
  function ciz() { kirli = true; if (!raf && ctx) raf = requestAnimationFrame(dongu); }
  function tuvalKur() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    tuval.width = W * dpr; tuval.height = H * dpr;
    g2 = tuval.getContext('2d');
    fircaTuval = document.createElement('canvas'); fircaTuval.width = W * dpr; fircaTuval.height = H * dpr; fircaG = fircaTuval.getContext('2d');
    if (!matDoku) { try { matDoku = g2.createPattern(matDokuYap(), 'repeat'); } catch (e) { matDoku = null; } }
    tuvalBoyutla();
  }
  function tuvalBoyutla() {
    if (!ui.masa || !tuval) return;
    const kap = ui.tuvalKap; const h = kap.clientHeight, w = kap.clientWidth;
    let ch = h, cw = h * (W / H); if (cw > w) { cw = w; ch = w * (H / W); }
    tuval.style.width = Math.floor(cw) + 'px'; tuval.style.height = Math.floor(ch) + 'px';
    ciz();
  }

  /* ------------------------------------------------------------ mini önizleme tuvalleri */
  function miniTuval(anahtar, tirnak, o) {
    if (miniOnbellek.has(anahtar)) return miniOnbellek.get(anahtar);
    const c = document.createElement('canvas'); const mw = 44, mh = 58, k = Math.min(2, window.devicePixelRatio || 1);
    c.width = mw * k; c.height = mh * k; c.className = 'tirnak-mini'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
    const nw = 24, t = tirnakDuzelt(Object.assign({ uzunluk: .55, renk: '#F4CFD8' }, tirnak));
    g.translate(mw / 2, mh - 6);
    tirnakCiz(g, t, nw, Object.assign({ ten: (d && d.ten) || '#F5C6AC', isik: .8, canli: false, olcek: k, ox: 0, oy: 0 }, o || {}), 2, 'sag');
    miniOnbellek.set(anahtar, c); return c;
  }
  function parcaTuval(anahtar, cizFn, renk, olcek) {
    const key = anahtar + renk; if (miniOnbellek.has(key)) return miniOnbellek.get(key);
    const c = document.createElement('canvas'); const s = 40, k = Math.min(2, window.devicePixelRatio || 1);
    c.width = s * k; c.height = s * k; c.className = 'tirnak-mini tirnak-mini-parca'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); g.translate(s / 2, s / 2); cizFn(g, s * (olcek || .7), renk);
    miniOnbellek.set(key, c); return c;
  }

  /* ------------------------------------------------------------ düzenleme yardımcıları */
  function hedefler() { return d.secim.hepsi ? [0, 1, 2, 3, 4] : [d.secim.parmak]; }
  function gecmisKaydet() { gecmis.push(JSON.stringify(d.eller)); if (gecmis.length > 40) gecmis.shift(); gelecek.length = 0; altbarGuncelle(); }
  function uygula(fn) { gecmisKaydet(); hedefler().forEach(i => fn(d.eller[d.el][i], i)); ciz(); kaydetGec(); }
  function geriAl() {
    if (!gecmis.length) { ctx.toast('Geri alınacak bir şey yok'); return; }
    gelecek.push(JSON.stringify(d.eller)); d.eller = JSON.parse(gecmis.pop());
    d.eller = { sol: elDuzelt(d.eller.sol), sag: elDuzelt(d.eller.sag) };
    seciliParca = null; ctx.ses.pit(); ciz(); kaydetGec(); panelYenile(); altbarGuncelle(); ctx.toast('Geri alındı');
  }
  function yinele() {
    if (!gelecek.length) { ctx.toast('Yinelenecek bir şey yok'); return; }
    gecmis.push(JSON.stringify(d.eller)); d.eller = JSON.parse(gelecek.pop());
    d.eller = { sol: elDuzelt(d.eller.sol), sag: elDuzelt(d.eller.sag) };
    seciliParca = null; ctx.ses.pit(); ciz(); kaydetGec(); panelYenile(); altbarGuncelle();
  }
  function altbarGuncelle() {
    const nav = document.querySelector('#bolum > .altbar'); if (!nav) return;
    const g = nav.querySelector('[data-eylem="geri"]'), y = nav.querySelector('[data-eylem="yinele"]');
    if (g) g.setAttribute('aria-disabled', String(!gecmis.length));
    if (y) y.setAttribute('aria-disabled', String(!gelecek.length));
  }
  const aktifTirnak = () => d.eller[d.el][d.secim.parmak];
  function secimYaz() {
    if (!ui.secimYazi) return;
    ui.secimYazi.textContent = d.secim.hepsi ? 'Bütün tırnaklar' : PARMAK_AD[d.secim.parmak].replace(/^./, c => c.toLocaleUpperCase('tr'));
    ui.hepsiDugme.setAttribute('aria-selected', String(d.secim.hepsi));
    ui.elDugme.textContent = (d.el === 'sol' ? '🤚 Sol el' : '✋ Sağ el');
  }
  function balon(metin, ms) {
    if (!ui.balon) return; clearTimeout(balonT);
    ui.balon.textContent = metin; ui.balon.classList.add('goster');
    balonT = setTimeout(() => { if (ui.balon) ui.balon.classList.remove('goster'); }, ms || 2600);
  }
  function sonRenkEkle(r) { d.sonRenkler = [r].concat(d.sonRenkler.filter(x => x !== r)).slice(0, 8); }
  function elDegistir() {
    d.el = d.el === 'sol' ? 'sag' : 'sol'; seciliParca = null; ctx.ses.pop();
    if (tuval && !ctx.azHareket) { tuval.classList.remove('cevir'); void tuval.offsetWidth; tuval.classList.add('cevir'); }
    secimYaz(); ciz(); kaydetGec(); panelYenile();
  }
  function aynala() {
    const kaynak = d.el, hedef = kaynak === 'sol' ? 'sag' : 'sol';
    gecmisKaydet(); d.eller[hedef] = elDuzelt(JSON.parse(JSON.stringify(d.eller[kaynak])));
    d.eller[hedef].forEach(t => { t.tohum = Math.floor(Math.random() * 1e6); });
    ctx.ses.parilti(); ciz(); kaydetGec();
    ctx.toast((hedef === 'sol' ? 'Sol' : 'Sağ') + ' ele aynalandı ✨');
  }
  function hepsiDegistir() { d.secim.hepsi = !d.secim.hepsi; seciliParca = null; ctx.ses.tik(); secimYaz(); ciz(); kaydetGec(); panelYenile(); balon(d.secim.hepsi ? 'Artık hepsine birden sürüyoruz.' : 'Sadece ' + PARMAK_AD[d.secim.parmak] + '.'); }

  /* ------------------------------------------------------------ eylemler */
  function sekilUygula(id) {
    uygula(t => { t.sekil = id; });
    const s = SEKILLER.find(x => x.id === id); ctx.ses.torpu();
    if (!ctx.azHareket) animler.set(d.el + 'torpu', { tur: 'torpu', bas: performance.now(), sure: 650, parmaklar: hedefler() });
    hedefler().forEach((i, k) => sonra(() => { const t = d.eller[d.el][i], nw = tirnakGen(PARMAKLAR[i]); const p = tirnakNokta(d.el, i, 0, -tirnakBoyu(t, nw)); const c = istemciNokta(p.x, p.y); ctx.efekt.toz(c.x, c.y, 3); }, 120 + k * 60));
    ciz(); balon(s ? s.not : 'Törpülendi.');
  }
  function bazUygula(id) { uygula(t => { t.baz = id; }); ctx.ses.slip(); const b = BAZLAR.find(x => x.id === id); balon(b ? b.not : 'Baz sürüldü.'); }
  function renkUygula(renk) {
    uygula((t, i) => { t.renk = renk; t.tohum = Math.floor(Math.random() * 1e6); if (renk && !ctx.azHareket) animler.set(d.el + i, { tur: 'oje', bas: performance.now() + i * 90, sure: 780 }); });
    if (renk) { sonRenkEkle(renk); [0, 150, 300].forEach(ms => sonra(() => ctx.ses.slip(), ms)); }
    ciz(); panelYenile();
  }
  function teknikUygula(id) { uygula(t => { t.teknik.id = id; if (id !== 'yok' && !t.renk) t.renk = '#F4CFD8'; t.tohum = Math.floor(Math.random() * 1e6); }); ctx.ses.slip(); panelYenile(); }
  function teknikRenk2(r) { uygula(t => { t.teknik.renk2 = r; }); ctx.ses.slip(); panelYenile(); }
  function desenUygula(id) { uygula(t => { t.desen = id ? { id, renk: sanatRenk } : null; }); ctx.ses.pop(); panelYenile(); }
  function finishUygula(id) { uygula(t => { t.finish = id; t.tohum = Math.floor(Math.random() * 1e6); }); const f = FINISHLER.find(x => x.id === id); ctx.ses.tink(); balon(f ? f.not : ''); panelYenile(); }
  function topCoatSur() {
    uygula((t, i) => { t.top = true; if (!ctx.azHareket) animler.set(d.el + i, { tur: 'top', bas: performance.now() + i * 70, sure: 900 }); });
    ctx.ses.tink(); sonra(() => ctx.ses.parilti(), 350);
    hedefler().forEach((i, k) => sonra(() => { const t = d.eller[d.el][i], nw = tirnakGen(PARMAKLAR[i]); const p = tirnakNokta(d.el, i, 0, -tirnakBoyu(t, nw) * .6); const c = istemciNokta(p.x, p.y); ctx.efekt.yildiz(c.x, c.y, 4); }, 120 + k * 80));
    balon('Parladı. Şimdi Pıttıksu\'ya göster.'); ciz(); panelYenile();
  }
  function parcaEkle(liste, id, nx, ny, parmak) {
    const tanim = liste === 'susler' ? SUSLER.find(s => s.id === id) : null;
    const yeni = { id, x: nx, y: ny, olcek: tanim ? tanim.olcek : .5, don: 0, renk: sanatRenk };
    gecmisKaydet();
    const parmaklar = d.secim.hepsi ? [0, 1, 2, 3, 4] : [parmak];
    parmaklar.forEach(i => { const l = d.eller[d.el][i][liste]; if (l.length >= 12) l.shift(); l.push(JSON.parse(JSON.stringify(yeni))); });
    seciliParca = { parmak, liste, i: d.eller[d.el][parmak][liste].length - 1 };
    if (liste === 'susler') ctx.ses.tink(); else ctx.ses.pop();
    ciz(); kaydetGec(); panelYenile();
  }
  function seciliParcaAl() { if (!seciliParca) return null; const l = d.eller[d.el][seciliParca.parmak][seciliParca.liste]; return l[seciliParca.i] || null; }
  function seciliParcaDegistir(fn) { const p = seciliParcaAl(); if (!p) return; fn(p); ciz(); kaydetGec(); }
  function seciliParcaSil() { if (!seciliParca) return; gecmisKaydet(); const l = d.eller[d.el][seciliParca.parmak][seciliParca.liste]; l.splice(seciliParca.i, 1); seciliParca = null; ctx.ses.pit(); ciz(); kaydetGec(); panelYenile(); }
  function parcalariTemizle(liste) { uygula(t => { t[liste] = []; }); seciliParca = null; ctx.ses.pit(); panelYenile(); }
  function fircaTemizle() { uygula(t => { t.firca = []; }); ctx.ses.pit(); panelYenile(); }

  /* ------------------------------------------------------------ rastgele & setler */
  function rastgeleIlham() {
    const kol = CD.rastgele(KOLEKSIYONLAR), renk = CD.rastgele(kol.renkler), sekil = CD.rastgele(SEKILLER).id;
    const uz = .25 + Math.random() * .65, baz = CD.rastgele(BAZLAR).id;
    const finishAgirlik = ['parlak', 'parlak', 'parlak', 'aurora', 'aurora', 'krom', 'glitter', 'shimmer', 'holo', 'catEye', 'mat'];
    const finish = CD.rastgele(finishAgirlik);
    const teknikId = Math.random() < .45 ? CD.rastgele(['french', 'ombre', 'aura', 'mermer', 'glitter', 'kromUc', 'kromToz']) : 'yok';
    const renk2 = CD.rastgele(['#FFFFFF', '#FFFFFF', '#D4AF37', '#FFD1DC', '#9F7BE8', '#3B3444', '#C0C7D1']);
    const desen = Math.random() < .2 ? { id: CD.rastgele(DESENLER).id, renk: parlaklik(renk) > 150 ? '#FFFFFF' : '#FFD1DC' } : null;
    const aksan = Math.floor(Math.random() * 5);
    gecmisKaydet();
    ['sol', 'sag'].forEach(taraf => d.eller[taraf].forEach((t, i) => {
      Object.assign(t, tirnakVarsayilan(), { sekil, uzunluk: uz, baz, renk, finish, top: true, teknik: { id: teknikId, renk2, kalinlik: .22 + Math.random() * .2 }, desen: i % 2 ? desen : null });
      if (i === aksan && Math.random() < .6) { t.finish = 'glitter'; t.teknik.id = 'yok'; }
      if (i === aksan && Math.random() < .35) t.cikartmalar.push({ id: CD.rastgele(CIKARTMALAR).id, x: 0, y: .5, olcek: .55, don: (Math.random() - .5) * .8, renk: parlaklik(renk) > 150 ? CD.rastgele(['#EE8AAA', '#3B3444', '#D81E3C', '#8E7CC3']) : '#FFFFFF' });
      if (i === aksan && Math.random() < .3) t.susler.push({ id: CD.rastgele(['tasS', 'tasM', 'inci']), x: 0, y: .4, olcek: .28, don: 0, renk: '#FFFFFF' });
    }));
    const ad = CD.rastgele(ISIM_SIFAT) + ' ' + CD.rastgele(ISIM_AD);
    ctx.ses.pop(); sonra(() => ctx.ses.parilti(), 200);
    ctx.efekt.konfeti(undefined, undefined, 10);
    ciz(); kaydetGec(); panelYenile(); ctx.toast('İlham: ' + ad + ' ✨');
  }
  function setUygula(set) {
    gecmisKaydet();
    ['sol', 'sag'].forEach(taraf => d.eller[taraf].forEach((t, i) => { Object.assign(t, tirnakVarsayilan(), JSON.parse(JSON.stringify(set.yap(i)))); t.teknik = Object.assign({ id: 'yok', renk2: '#FFFFFF', kalinlik: .3 }, t.teknik); }));
    seciliParca = null; ctx.ses.parilti(); ctx.efekt.konfeti(undefined, undefined, set.inci ? 18 : 8);
    ciz(); kaydetGec(); panelYenile(); ctx.sheetKapat();
    ctx.toast(set.inci ? 'Senin tırnakların, birebir 💅' : set.ad + ' hazır');
  }

  /* ------------------------------------------------------------ dışa aktarma & galeri */
  function disaAktar(ad, eller, ten) {
    eller = eller || d.eller; ten = ten || d.ten;
    const S = 2, cw = W * 2 + 60, ch = H + 100;
    const c = document.createElement('canvas'); c.width = cw * S; c.height = ch * S; const g = c.getContext('2d'); g.scale(S, S);
    const grd = g.createLinearGradient(0, 0, 0, ch); grd.addColorStop(0, '#FFF3F5'); grd.addColorStop(1, '#F9D6DF'); g.fillStyle = grd; g.fillRect(0, 0, cw, ch);
    g.fillStyle = 'rgba(255,255,255,.55)'; for (let y = 8; y < ch; y += 14) for (let x = 8 + (y / 14 % 2) * 7; x < cw; x += 14) { g.beginPath(); g.arc(x, y, 1.2, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#3B3444'; g.textAlign = 'center'; g.font = '800 26px "Sour Gummy", "Nunito", sans-serif';
    g.fillText(ad || "Cemre'nin tırnakları", cw / 2, 44);
    g.font = '600 14px "Nunito", sans-serif'; g.fillStyle = '#736C7E'; g.fillText("Cemre'nin Tırnak Salonu · " + CD.tarihYaz(CD.bugun()), cw / 2, 68);
    g.save(); g.beginPath(); g.rect(0, 80, cw, ch - 80); g.clip();
    g.save(); g.translate(20, 90); elCiz(g, 'sol', elDuzelt(eller.sol), { ten, isik: .8, olcek: S, ox: 20 * S, oy: 90 * S }); g.restore();
    g.translate(W + 40, 90); elCiz(g, 'sag', elDuzelt(eller.sag), { ten, isik: .8, olcek: S, ox: (W + 40) * S, oy: 90 * S });
    g.restore();
    return c;
  }
  async function paylas(ad, eller, ten) {
    try { ctx.ses.tink(); const c = disaAktar(ad, eller, ten); await CD.pngPaylas(c, (ad || 'cemre-tirnak').replace(/[^\wğüşöçıİĞÜŞÖÇ -]/g, '').trim().replace(/\s+/g, '-') + '.png'); }
    catch (e) { ctx.toast('Görsel hazırlanamadı; bir daha dener misin?'); }
  }
  function kucukResim(kayit) {
    const c = document.createElement('canvas'); const k = Math.min(2, window.devicePixelRatio || 1), cw = 200, ch = 118;
    c.width = cw * k; c.height = ch * k; c.className = 'tirnak-galeriResim'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
    const o = .24;
    g.save(); g.translate(6, 4); g.scale(o, o); elCiz(g, 'sol', elDuzelt(kayit.eller.sol), { ten: kayit.ten, isik: .8, olcek: k * o, ox: 6 * k, oy: 4 * k }); g.restore();
    g.save(); g.translate(104, 4); g.scale(o, o); elCiz(g, 'sag', elDuzelt(kayit.eller.sag), { ten: kayit.ten, isik: .8, olcek: k * o, ox: 104 * k, oy: 4 * k }); g.restore();
    return c;
  }
  function kaydetSheet() {
    const oneri = CD.rastgele(ISIM_SIFAT) + ' ' + CD.rastgele(ISIM_AD);
    const girdi = ctx.el('input.girdi', { type: 'text', maxlength: '40', placeholder: oneri, 'aria-label': 'Tasarım adı', autocomplete: 'off' });
    const kutu = ctx.el('div.dikey', [
      ctx.el('p.sessiz', 'Bir isim ver; galeride bu isimle dursun.'),
      girdi,
      ctx.el('div.satir', [
        ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => paylas(girdi.value.trim() || oneri) }, '📤 Paylaş / indir'),
        ctx.el('button.dugme.bosluk', { type: 'button', onclick: () => {
          const ad = girdi.value.trim() || oneri; const galeri = ctx.depo.al('galeri', []);
          galeri.unshift({ id: CD.kimlik(), ad, tarih: CD.bugun(), ten: d.ten, el: d.el, eller: JSON.parse(JSON.stringify(d.eller)) });
          if (galeri.length > 40) galeri.length = 40;
          ctx.depo.yaz('galeri', galeri); d.kayitSayisi = (d.kayitSayisi || 0) + 1; kaydetDurum();
          ctx.sheetKapat(); ctx.ses.parilti(); ctx.efekt.konfeti(undefined, undefined, 12); ctx.toast('Mırr ~ kaydedildi: ' + ad);
          if (d.kayitSayisi === 1) sonra(() => ctx.toast('Galeriden istediğin zaman geri açabilirsin 🖼️'), 2600);
        } }, 'Kaydet')
      ])
    ]);
    ctx.sheet(kutu, { baslik: 'Tasarımı kaydet' });
  }
  function galeriSheet() {
    const galeri = ctx.depo.al('galeri', []);
    if (!galeri.length) { ctx.sheet(ctx.el('div.bos-durum', [ctx.el('div.buyuk', '💅'), ctx.el('p', 'Galeri henüz boş. İlk tasarımını kaydet, burada dursun.'), ctx.el('button.dugme', { type: 'button', onclick: () => { ctx.sheetKapat(); kaydetSheet(); } }, 'Kaydet')]), { baslik: 'Galeri' }); return; }
    const liste = ctx.el('div.tirnak-galeri');
    galeri.forEach(k => {
      const kart = ctx.el('div.yama.siki.tirnak-galeriKart', [
        kucukResim(k),
        ctx.el('div.tirnak-galeriBilgi', [ctx.el('div.kalin', k.ad), ctx.el('div.sessiz', CD.tarihYaz(k.tarih))]),
        ctx.el('div.satir.sar', [
          ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => { gecmisKaydet(); d.eller = { sol: elDuzelt(k.eller.sol), sag: elDuzelt(k.eller.sag) }; if (k.ten) d.ten = k.ten; seciliParca = null; ctx.sheetKapat(); ctx.ses.parilti(); ciz(); kaydetGec(); panelYenile(); ctx.toast(k.ad + ' açıldı'); } }, 'Aç'),
          ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => paylas(k.ad, k.eller, k.ten || d.ten) }, 'Paylaş'),
          ctx.el('button.dugme-hayalet', { type: 'button', onclick: async () => { ctx.sheetKapat(); const ok = await ctx.onayla('"' + k.ad + '" galeriden silinsin mi?', 'Sil', 'Kalsın'); if (ok) { ctx.depo.yaz('galeri', ctx.depo.al('galeri', []).filter(x => x.id !== k.id)); kaydetDurum(); ctx.toast('Silindi'); } galeriSheet(); } }, 'Sil')
        ])
      ]);
      liste.appendChild(kart);
    });
    ctx.sheet(liste, { baslik: 'Galeri · ' + galeri.length + ' tasarım' });
  }
  function setlerSheet() {
    const liste = ctx.el('div.dikey', [
      ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { ctx.sheetKapat(); rastgeleIlham(); } }, '🎲 Rastgele ilham ver'),
      ctx.el('p.sessiz', 'Hazır setler iki ele birden uygulanır; sonra istediğini değiştir.')
    ]);
    TRENDLER.forEach(s => {
      const ornek = s.yap(2);
      liste.appendChild(ctx.el('button.yama.siki.dokun.tirnak-set' + (s.inci ? '.tirnak-set-inci' : ''), { type: 'button', onclick: () => setUygula(s) }, [
        miniTuval('set:' + s.id, ornek),
        ctx.el('div.tirnak-setBilgi', [ctx.el('div.kalin', s.ad), ctx.el('div.sessiz', s.aciklama)])
      ]));
    });
    ctx.sheet(liste, { baslik: 'Hazır setler' });
  }
  function tenElSheet() {
    const tenler = ctx.el('div.ornekler.tirnak-tenler', TENLER.map(t => ornek(t, t === d.ten, (r, e) => { d.ten = t; tenler.querySelectorAll('.ornek').forEach(o => o.classList.toggle('secili', o === e.currentTarget)); miniOnbellek.clear(); ctx.ses.tik(); ciz(); kaydetGec(); }, 'Ten tonu')));
    const kutu = ctx.el('div.dikey', [
      ctx.el('div.kalin', 'Ten tonu'), tenler,
      ctx.el('div.kalin', 'Hangi el?'),
      ctx.el('div.izgara-2', ['sol', 'sag'].map(el => ctx.el('button.dugme-ikincil' + (d.el === el ? '.tirnak-secili' : ''), { type: 'button', 'aria-pressed': String(d.el === el), onclick: () => { if (d.el !== el) elDegistir(); ctx.sheetKapat(); } }, el === 'sol' ? '🤚 Sol el' : '✋ Sağ el'))),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => { ctx.sheetKapat(); panelYenile(); } }, 'Tamam')
    ]);
    ctx.sheet(kutu, { baslik: 'Ten ve el' });
  }
  function pittiksuyaGoster() {
    ctx.ses.minikMiyav(); const m = ctx.efekt.merkez(ui.masa); ctx.efekt.kalp(m.x, m.y, 6);
    balon('Pıttıksu: ' + CD.rastgele(PITTIKSU_SOZ) + ' 🐾', 3200);
  }

  /* ------------------------------------------------------------ paneller */
  function secenek(anahtar, etiket, secili, tikla, onizleme, ekSinif) {
    return ctx.el('button.tirnak-secenek' + (ekSinif ? '.' + ekSinif : ''), { type: 'button', 'aria-selected': String(!!secili), data: { id: anahtar }, onclick: tikla }, [onizleme || null, ctx.el('span.tirnak-secenekAd', etiket)]);
  }
  // kaydırıcı: basla → ilk dokunuşta bir kez (geri al kaydı), degis → canlı, birak → bırakınca
  function kaydirici(etiket, min, max, deger, adim, yaz, degis, birak, basla) {
    const cikti = ctx.el('span.tirnak-kaydiriciDeger.sayi', yaz ? yaz(deger) : String(deger));
    const inp = ctx.el('input.kaydirici', { type: 'range', min: String(min), max: String(max), step: String(adim), value: String(deger), 'aria-label': etiket });
    const yuzde = () => inp.style.setProperty('--yuzde', ((inp.value - min) / (max - min) * 100) + '%');
    let basladi = false; yuzde();
    inp.addEventListener('input', () => { if (!basladi) { basladi = true; if (basla) basla(); } yuzde(); if (yaz) cikti.textContent = yaz(Number(inp.value)); degis(Number(inp.value)); });
    inp.addEventListener('change', () => { basladi = false; if (birak) birak(Number(inp.value)); });
    return ctx.el('label.tirnak-kaydirici', [ctx.el('span.tirnak-kaydiriciEtiket', [etiket, cikti]), inp]);
  }
  function ornek(renk, secili, tikla, etiket) {
    const b = ctx.el('button.ornek' + (secili ? '.secili' : ''), { type: 'button', 'aria-label': (etiket || 'Renk') + ' ' + renk, 'aria-pressed': String(!!secili), onclick: e => tikla(renk, e) });
    b.style.setProperty('--renk', renk); return b;
  }
  function renkOrnekleri(renkler, secili, tikla, etiket) {
    return ctx.el('div.ornekler.tirnak-ornekler', renkler.map(r => ornek(r, r === secili, tikla, etiket)));
  }
  const uzunlukYaz = v => v < .25 ? 'kısa' : v < .5 ? 'orta' : v < .75 ? 'uzun' : 'çok uzun';

  function panelSekil() {
    const t = aktifTirnak();
    return [
      ctx.el('div.tirnak-secenekler', SEKILLER.map(s => secenek(s.id, s.ad, t.sekil === s.id, () => sekilUygula(s.id), miniTuval('sekil:' + s.id, { sekil: s.id, uzunluk: .6, renk: '#F6D8DF', finish: 'parlak' })))),
      kaydirici('Uzunluk', 0, 100, Math.round(t.uzunluk * 100), 1, v => uzunlukYaz(v / 100), v => { hedefler().forEach(i => { d.eller[d.el][i].uzunluk = v / 100; }); ciz(); }, () => { kaydetGec(); ctx.ses.torpu(); }, gecmisKaydet),
      ctx.el('p.sessiz', 'Dayanıklılık sırası: kare > squoval > yuvarlak > balerin > oval > badem > stiletto. Stiletto en kırılgan ama en havalı.')
    ];
  }
  function panelBaz() {
    const t = aktifTirnak();
    return [
      ctx.el('div.tirnak-secenekler', BAZLAR.map(b => secenek(b.id, b.ad, t.baz === b.id, () => bazUygula(b.id), miniTuval('baz:' + b.id, { baz: b.id, renk: null, uzunluk: .5 })))),
      ctx.el('p.sessiz', (BAZLAR.find(b => b.id === t.baz) || BAZLAR[0]).not)
    ];
  }
  function panelRenk() {
    const t = aktifTirnak();
    const kol = KOLEKSIYONLAR.find(k => k.id === koleksiyon) || KOLEKSIYONLAR[0];
    const onizle = ctx.el('span.tirnak-ozelOnizle', { stil: { background: hslHex(ozel.h, ozel.s, ozel.l) } });
    const ozelGuncelle = () => { onizle.style.background = hslHex(ozel.h, ozel.s, ozel.l); };
    const tonInp = kaydirici('Ton', 0, 360, ozel.h, 1, null, v => { ozel.h = v; ozelGuncelle(); });
    const tonGirdi = tonInp.querySelector('input'); tonGirdi.classList.add('tirnak-ton');
    tonGirdi.style.setProperty('--tirnak-tonYol', 'linear-gradient(90deg,' + [0, 60, 120, 180, 240, 300, 360].map(h => hslHex(h, 80, 70)).join(',') + ')');
    const parcalar = [
      ctx.el('div.cipler.tirnak-cipler', KOLEKSIYONLAR.map(k => ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(k.id === koleksiyon), onclick: () => { koleksiyon = k.id; ctx.ses.tik(); panelYenile(); } }, k.ad))),
      renkOrnekleri(kol.renkler, t.renk, r => renkUygula(r), 'Oje')
    ];
    if (d.sonRenkler.length) parcalar.push(ctx.el('div.tirnak-altBaslik', 'Son kullandıkların'), renkOrnekleri(d.sonRenkler, t.renk, r => renkUygula(r), 'Son renk'));
    parcalar.push(ctx.el('details.tirnak-ozel', [
      ctx.el('summary', 'Kendi rengini karıştır'),
      ctx.el('div.dikey', [
        tonInp,
        kaydirici('Doygunluk', 0, 100, ozel.s, 1, null, v => { ozel.s = v; ozelGuncelle(); }),
        kaydirici('Açıklık', 5, 97, ozel.l, 1, null, v => { ozel.l = v; ozelGuncelle(); }),
        ctx.el('div.satir', [onizle, ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => renkUygula(hslHex(ozel.h, ozel.s, ozel.l)) }, 'Bu rengi sür'),
          ctx.el('label.dugme-ikincil.kucuk.tirnak-renkSecici', ['🎯 Tam seçici', ctx.el('input', { type: 'color', value: hslHex(ozel.h, ozel.s, ozel.l), 'aria-label': 'Renk seçici', onchange: e => renkUygula(e.target.value.toUpperCase()) })])])
      ])
    ]));
    parcalar.push(ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { renkUygula(null); balon('Oje silindi, tırnak nefes alıyor.'); } }, 'Ojeyi sil'));
    return parcalar;
  }
  function panelArt() {
    const t = aktifTirnak();
    const sekmeler = [['teknik', 'Teknik'], ['desen', 'Desen'], ['cikartma', 'Çıkartma'], ['sus', '3D süs'], ['firca', 'Fırça']];
    const parcalar = [ctx.el('div.cipler.tirnak-cipler.tirnak-altSekmeler', sekmeler.map(s => ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(altSekme === s[0]), onclick: () => { altSekme = s[0]; seciliParca = null; ctx.ses.tik(); ciz(); panelYenile(); } }, s[1])))];
    const sanatRenkSatiri = (secili, tikla) => renkOrnekleri(DESEN_RENKLERI, secili, tikla, 'Sanat rengi');
    if (altSekme === 'teknik') {
      parcalar.push(ctx.el('div.tirnak-secenekler', TEKNIKLER.map(tk => secenek(tk.id, tk.ad, t.teknik.id === tk.id, () => teknikUygula(tk.id), miniTuval('teknik:' + tk.id, { renk: '#F4CFD8', teknik: { id: tk.id, renk2: (tk.id === 'kromUc' || tk.id === 'kromToz') ? '#C0C7D1' : tk.id === 'aura' ? '#9F7BE8' : tk.id === 'mermer' ? '#D4AF37' : '#FFFFFF', kalinlik: .3 } })))));
      if (t.teknik.id !== 'yok') {
        parcalar.push(ctx.el('div.tirnak-altBaslik', t.teknik.id === 'french' ? 'Uç rengi' : 'İkinci renk'), sanatRenkSatiri(t.teknik.renk2, r => teknikRenk2(r)));
        if (t.teknik.id === 'french') parcalar.push(kaydirici('Uç kalınlığı', 10, 60, Math.round(t.teknik.kalinlik * 100), 1, v => v + '%', v => { hedefler().forEach(i => { d.eller[d.el][i].teknik.kalinlik = v / 100; }); ciz(); }, () => kaydetGec(), gecmisKaydet));
      }
      parcalar.push(ctx.el('p.sessiz', (TEKNIKLER.find(x => x.id === t.teknik.id) || TEKNIKLER[0]).not));
    } else if (altSekme === 'desen') {
      parcalar.push(ctx.el('div.tirnak-secenekler', [secenek('yok', 'Desensiz', !t.desen, () => desenUygula(null), miniTuval('desen:yok', { renk: '#F4CFD8' }))].concat(DESENLER.map(ds => secenek(ds.id, ds.ad, t.desen && t.desen.id === ds.id, () => desenUygula(ds.id), miniTuval('desen:' + ds.id, { renk: '#F4CFD8', desen: { id: ds.id, renk: '#FFFFFF' } }))))));
      parcalar.push(ctx.el('div.tirnak-altBaslik', 'Desen rengi'), sanatRenkSatiri(t.desen ? t.desen.renk : sanatRenk, r => { sanatRenk = r; if (t.desen) uygula(x => { if (x.desen) x.desen.renk = r; }); ctx.ses.tik(); panelYenile(); }));
    } else if (altSekme === 'cikartma' || altSekme === 'sus') {
      const sus = altSekme === 'sus'; const liste = sus ? SUSLER : CIKARTMALAR; const aktif = sus ? aktifSus : aktifCikartma;
      parcalar.push(ctx.el('p.sessiz', sus ? 'Bir süs seç, tırnağa dokun; parmağınla kaydır.' : 'Bir çıkartma seç, tırnağa dokun; parmağınla kaydır.'));
      parcalar.push(ctx.el('div.tirnak-secenekler.tirnak-parcalar', liste.map(p => secenek(p.id, p.ad, aktif === p.id, () => { if (sus) aktifSus = p.id; else aktifCikartma = p.id; ctx.ses.tik(); panelYenile(); }, parcaTuval((sus ? 'sus:' : 'cik:') + p.id, sus ? SUS_CIZ[p.id] : CIKARTMA_CIZ[p.id], sanatRenk, sus ? (p.id === 'zincir' ? .9 : .5) : .7)))));
      parcalar.push(ctx.el('div.tirnak-altBaslik', 'Renk'), sanatRenkSatiri(sanatRenk, r => { sanatRenk = r; const p = seciliParcaAl(); if (p) seciliParcaDegistir(x => { x.renk = r; }); ctx.ses.tik(); panelYenile(); }));
      const p = seciliParcaAl();
      if (p && seciliParca.liste === (sus ? 'susler' : 'cikartmalar')) {
        parcalar.push(ctx.el('div.tirnak-parcaAyar.yama.siki', [
          ctx.el('div.kalin', 'Seçili: ' + ((liste.find(x => x.id === p.id) || {}).ad || '')),
          kaydirici('Boyut', 10, 100, Math.round(p.olcek * 100), 1, null, v => seciliParcaDegistir(x => { x.olcek = v / 100; }), null, gecmisKaydet),
          kaydirici('Döndür', -180, 180, Math.round((p.don || 0) * 180 / Math.PI), 1, v => v + '°', v => seciliParcaDegistir(x => { x.don = v * Math.PI / 180; }), null, gecmisKaydet),
          ctx.el('div.satir', [ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: seciliParcaSil }, 'Kaldır'), ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => parcalariTemizle(sus ? 'susler' : 'cikartmalar') }, 'Hepsini temizle')])
        ]));
      } else if (t[sus ? 'susler' : 'cikartmalar'].length) parcalar.push(ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => parcalariTemizle(sus ? 'susler' : 'cikartmalar') }, sus ? 'Bu tırnaktaki süsleri temizle' : 'Bu tırnaktaki çıkartmaları temizle'));
    } else if (altSekme === 'firca') {
      parcalar.push(ctx.el('p.sessiz', 'Tırnağın üstüne parmağınla çiz. Fırça sadece tırnakta boyar.'));
      parcalar.push(sanatRenkSatiri(firca.silgi ? null : firca.renk, r => { firca.renk = r; firca.silgi = false; ctx.ses.tik(); panelYenile(); }));
      parcalar.push(ctx.el('div.satir.sar', [
        ctx.el('button.cip', { type: 'button', 'aria-selected': String(firca.silgi), onclick: () => { firca.silgi = !firca.silgi; ctx.ses.tik(); panelYenile(); } }, '🧽 Silgi'),
        ctx.el('button.dugme-hayalet', { type: 'button', onclick: fircaTemizle }, 'Fırça izlerini temizle')
      ]));
      parcalar.push(kaydirici('Fırça boyu', 1, 10, firca.boy, 1, null, v => { firca.boy = v; }));
    }
    return parcalar;
  }
  function panelTop() {
    const t = aktifTirnak();
    return [
      ctx.el('div.tirnak-secenekler', FINISHLER.map(f => secenek(f.id, f.ad, t.finish === f.id, () => finishUygula(f.id), miniTuval('finish:' + f.id, { renk: '#F4CFD8', finish: f.id, top: true }), f.id === 'aurora' ? 'tirnak-secenek-inci' : ''))),
      ctx.el('p.sessiz', (FINISHLER.find(f => f.id === t.finish) || FINISHLER[0]).not),
      ctx.el('button.dugme.tam' + (t.top ? '' : '.inci'), { type: 'button', onclick: topCoatSur }, t.top ? '💎 Top coat sürüldü · tekrar parlat' : '💎 Top coat sür'),
      ctx.el('div.izgara-2', [
        ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => paylas() }, '📤 Paylaş / indir'),
        ctx.el('button.dugme-ikincil', { type: 'button', onclick: pittiksuyaGoster }, '🐾 Pıttıksu\'ya göster')
      ])
    ];
  }
  function panelYenile() {
    if (!ui.panel || !d.el) return;
    ui.panel.innerHTML = '';
    const adim = ADIMLAR.find(a => a.id === d.adim) || ADIMLAR[0];
    ui.panel.appendChild(ctx.el('div.tirnak-panelBaslik', [ctx.el('span.baslik.baslik-lg', adim.ad), ctx.el('span.sessiz', d.secim.hepsi ? 'bütün tırnaklar' : PARMAK_AD[d.secim.parmak])]));
    const icerik = { sekil: panelSekil, baz: panelBaz, renk: panelRenk, art: panelArt, top: panelTop }[adim.id]();
    icerik.forEach(e => e && ui.panel.appendChild(e));
    ui.adimlar.querySelectorAll('.tirnak-adim').forEach(b => b.setAttribute('aria-selected', String(b.dataset.adim === d.adim)));
    secimYaz();
  }
  function adimaGit(id) { if (d.adim === id) return; d.adim = id; seciliParca = null; ctx.ses.tik(); const a = ADIMLAR.find(x => x.id === id); if (a) balon(a.ipucu); ciz(); kaydetGec(); panelYenile(); }

  /* ------------------------------------------------------------ tuval etkileşimi */
  function tuvalBas(e) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault(); ctx.ses.uyandir();
    const p = sahneNokta(e); const i = parmakBul(p.x, p.y);
    if (i < 0) { surukle = { tur: 'bos' }; return; }
    try { tuval.setPointerCapture(e.pointerId); } catch (err) {}
    const t = d.eller[d.el][i];
    if (d.adim === 'art' && (altSekme === 'cikartma' || altSekme === 'sus')) {
      const liste = altSekme === 'sus' ? 'susler' : 'cikartmalar';
      const n = yerelNormal(d.el, i, p.x, p.y), nw = tirnakGen(PARMAKLAR[i]), L = tirnakBoyu(t, nw);
      let en = -1, enUzak = 1e9;
      t[liste].forEach((c, k) => { const dx = (c.x - n.x) * nw / 2, dy = (c.y - n.y) * L; const m = Math.hypot(dx, dy); const r = Math.max((c.olcek || .4) * nw * .6, 9); if (m < r && m < enUzak) { en = k; enUzak = m; } });
      if (en >= 0) { seciliParca = { parmak: i, liste, i: en }; const c = t[liste][en]; surukle = { tur: 'parca', parmak: i, liste, i: en, dx: c.x - n.x, dy: c.y - n.y, tasindi: false }; ctx.ses.pit(); ciz(); panelYenile(); return; }
      const id = altSekme === 'sus' ? aktifSus : aktifCikartma;
      if (id) { parcaEkle(liste, id, sinir(n.x, -.9, .9), sinir(n.y, .05, .95), i); const c = t[liste][t[liste].length - 1]; surukle = { tur: 'parca', parmak: i, liste, i: t[liste].length - 1, dx: 0, dy: 0, tasindi: false }; if (c) ctx.efekt.yildiz(e.clientX, e.clientY, 3); return; }
    }
    if (d.adim === 'art' && altSekme === 'firca') {
      const n = yerelNormal(d.el, i, p.x, p.y);
      gecmisKaydet();
      const vurus = { renk: firca.renk, boy: .03 + firca.boy * .028, silgi: firca.silgi, n: [[n.x, n.y]] };
      const parmaklar = d.secim.hepsi ? [0, 1, 2, 3, 4] : [i];
      const vuruslar = parmaklar.map(k => { const v = JSON.parse(JSON.stringify(vurus)); const l = d.eller[d.el][k].firca; if (l.length >= 60) l.shift(); l.push(v); return v; });
      surukle = { tur: 'firca', parmak: i, vuruslar }; ctx.ses.slip(); ciz(); return;
    }
    // seçim
    surukle = { tur: 'sec', parmak: i, x: p.x, y: p.y };
    if (d.secim.hepsi || d.secim.parmak !== i) { d.secim.hepsi = false; d.secim.parmak = i; seciliParca = null; ctx.ses.pit(); secimYaz(); ciz(); kaydetGec(); panelYenile(); balon(PARMAK_AD[i].replace(/^./, c => c.toLocaleUpperCase('tr')) + ' seçildi.', 1600); }
  }
  function tuvalTasi(e) {
    if (!surukle) return; e.preventDefault();
    const p = sahneNokta(e);
    if (surukle.tur === 'parca') {
      const n = yerelNormal(d.el, surukle.parmak, p.x, p.y); const c = d.eller[d.el][surukle.parmak][surukle.liste][surukle.i]; if (!c) return;
      c.x = sinir(n.x + surukle.dx, -1, 1); c.y = sinir(n.y + surukle.dy, -.05, 1.02); surukle.tasindi = true;
      if (d.secim.hepsi) d.eller[d.el].forEach((t, k) => { if (k === surukle.parmak) return; const e2 = t[surukle.liste][surukle.i]; if (e2 && e2.id === c.id) { e2.x = c.x; e2.y = c.y; } });
      ciz();
    } else if (surukle.tur === 'firca') {
      const n = yerelNormal(d.el, surukle.parmak, p.x, p.y);
      surukle.vuruslar.forEach(v => { const son = v.n[v.n.length - 1]; if (Math.hypot(son[0] - n.x, (son[1] - n.y) * 2) > .02) v.n.push([n.x, n.y]); });
      ciz();
    } else if (surukle.tur === 'sec' && d.adim === 'sekil') {
      const simdi = performance.now();
      if (simdi - torpuT > 260 && Math.hypot(p.x - surukle.x, p.y - surukle.y) > 6) { torpuT = simdi; ctx.ses.torpu(); ctx.efekt.toz(e.clientX, e.clientY, 2); surukle.x = p.x; surukle.y = p.y; }
    }
  }
  function tuvalBirak(e) {
    if (!surukle) return;
    const s = surukle; surukle = null;
    try { if (e && e.pointerId != null) tuval.releasePointerCapture(e.pointerId); } catch (err) {}
    if (s.tur === 'parca') { if (s.tasindi) gecmisKaydet(); kaydetGec(); panelYenile(); }
    if (s.tur === 'firca') { kaydetGec(); }
  }

  /* ------------------------------------------------------------ ilk kurulum (ten & el) */
  function kurulumKur(el) {
    let ten = null, elSec = null;
    const onizle = ctx.el('canvas.tirnak-onizleme', { 'aria-hidden': 'true' });
    const k = Math.min(2, window.devicePixelRatio || 1), ow = 200, oh = 250; onizle.width = ow * k; onizle.height = oh * k;
    const og = onizle.getContext('2d');
    const onizleCiz = () => { og.setTransform(k, 0, 0, k, 0, 0); og.clearRect(0, 0, ow, oh); og.save(); og.scale(ow / W, oh / H); elCiz(og, elSec || 'sag', elDuzelt(), { ten: ten || '#F5C6AC', isik: .8, canli: false, olcek: k * ow / W, ox: 0, oy: 0 }); og.restore(); if (!ten) { og.fillStyle = 'rgba(255,249,243,.55)'; og.fillRect(0, 0, ow, oh); } };
    onizleCiz();
    const gec = ctx.el('button.dugme.tam', { type: 'button', disabled: true, onclick: () => {
      d.ten = ten; d.el = elSec; kaydetDurum(); ctx.ses.parilti(); ctx.efekt.konfeti(undefined, undefined, 10);
      salonKur(el); sonra(() => balon('Hoş geldin. Önce şekil seçelim.'), 400);
    } }, 'Salona geç');
    const kontrol = () => { gec.disabled = !(ten && elSec); };
    const tenler = ctx.el('div.ornekler.tirnak-tenler', TENLER.map(t => ornek(t, false, (r, e) => { ten = t; tenler.querySelectorAll('.ornek').forEach(o => o.classList.toggle('secili', o === e.currentTarget)); ctx.ses.tik(); onizleCiz(); kontrol(); }, 'Ten tonu')));
    const elDugmeler = ctx.el('div.izgara-2.tirnak-elSec', ['sol', 'sag'].map(x => ctx.el('button.dugme-ikincil', { type: 'button', 'aria-pressed': 'false', onclick: e => { elSec = x; elDugmeler.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); ctx.ses.tik(); onizleCiz(); kontrol(); } }, x === 'sol' ? '🤚 Sol el' : '✋ Sağ el')));
    el.innerHTML = '';
    el.appendChild(ctx.el('div.icerik', [ctx.el('div.yama.tirnak-kurulum', [
      ctx.el('h2.baslik.baslik-xl', 'Önce eline bakalım'),
      ctx.el('p', 'Ten tonunu sen seç; sonra istediğin zaman değiştirebilirsin.'),
      onizle, tenler,
      ctx.el('h3.baslik.baslik-lg', 'Hangi elden başlıyoruz?'),
      elDugmeler, gec
    ])]));
    ctx.altbar(null);
  }

  /* ------------------------------------------------------------ salon kurulumu */
  function salonKur(el) {
    el.innerHTML = '';
    tuval = ctx.el('canvas.tirnak-tuval', { 'aria-label': 'Tırnak tuvali: bir tırnağa dokunup seç', role: 'img' });
    ui.tuvalKap = ctx.el('div.tirnak-tuvalKap', [tuval]);
    ui.balon = ctx.el('div.balon.tirnak-balon', { role: 'status', 'aria-live': 'polite' });
    ui.elDugme = ctx.el('button.dugme-ikincil.kucuk.tirnak-elDugme', { type: 'button', 'aria-label': 'Eli değiştir', onclick: elDegistir }, '✋ Sağ el');
    ui.secimYazi = ctx.el('span.tirnak-secimYazi', 'Bütün tırnaklar');
    ui.hepsiDugme = ctx.el('button.cip', { type: 'button', 'aria-selected': 'true', onclick: hepsiDegistir }, '🖐 Hepsi');
    ui.masa = ctx.el('div.sahne.tirnak-masa', [
      ui.tuvalKap,
      ctx.el('div.tirnak-masaUst', [ui.elDugme, ctx.el('button.dugme-ikon', { type: 'button', 'aria-label': 'Ten tonu ve el ayarı', onclick: tenElSheet }, '🎨')]),
      ui.balon,
      ctx.el('div.tirnak-secim', [ui.secimYazi, ctx.el('div.satir', [ui.hepsiDugme, ctx.el('button.cip', { type: 'button', onclick: aynala }, '⇄ Diğer ele aynala')])])
    ]);
    ui.adimlar = ctx.el('nav.tirnak-adimlar', { role: 'tablist', 'aria-label': 'Salon adımları' }, ADIMLAR.map((a, i) => ctx.el('button.tirnak-adim', { type: 'button', role: 'tab', 'aria-selected': String(a.id === d.adim), data: { adim: a.id }, onclick: () => adimaGit(a.id) }, [ctx.el('span.tirnak-adimNo', String(i + 1)), ctx.el('span.tirnak-adimAd', a.ad)])));
    ui.panel = ctx.el('div.yama.tirnak-panel');
    el.appendChild(ctx.el('div.tirnak-salon', [ui.masa, ui.adimlar, ctx.el('div.icerik.tirnak-icerik', [ui.panel])]));
    tuvalKur();
    tuval.addEventListener('pointerdown', tuvalBas);
    tuval.addEventListener('pointermove', tuvalTasi);
    tuval.addEventListener('pointerup', tuvalBirak);
    tuval.addEventListener('pointercancel', tuvalBirak);
    tuval.addEventListener('contextmenu', e => e.preventDefault());
    ctx.altbar([
      { id: 'geri', ad: 'Geri al', ikon: '↶', tikla: geriAl },
      { id: 'yinele', ad: 'Yinele', ikon: '↷', tikla: yinele },
      { id: 'setler', ad: 'Setler', ikon: '✨', tikla: setlerSheet },
      { id: 'kaydet', ad: 'Kaydet', ikon: '💾', birincil: true, tikla: kaydetSheet },
      { id: 'galeri', ad: 'Galeri', ikon: '🖼️', tikla: galeriSheet }
    ]);
    altbarGuncelle(); secimYaz(); panelYenile();
    sonra(tuvalBoyutla, 50); sonra(tuvalBoyutla, 400);
  }

  /* ------------------------------------------------------------ kayıt */
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="tirnakInci" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD6E4"/><stop offset=".4" stop-color="#E2F1FF"/><stop offset=".7" stop-color="#FFF7D9"/><stop offset="1" stop-color="#EADFFF"/></linearGradient></defs><path d="M32 6c9 0 15 10 15 26 0 14-6 26-15 26S17 46 17 32C17 16 23 6 32 6z" fill="#F5C6AC"/><path d="M32 4c8 0 13 8 13 20 0 9-5 18-13 18s-13-9-13-18C19 12 24 4 32 4z" fill="url(#tirnakInci)" stroke="#3B3444" stroke-width="1.5"/><path d="M25 14c1-4 4-6 6-6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="46" cy="50" r="6" fill="#EE8AAA" stroke="#3B3444" stroke-width="1.5"/><path d="M46 44v12M40 50h12" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';

  CD.kaydet({
    id: ID, baslik: 'Tırnak Salonu', ikon: IKON, tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el; d = yukle(); isik = .8; seciliParca = null; surukle = null; gecmis.length = 0; gelecek.length = 0; animler.clear(); miniOnbellek.clear();
      if (d.ten && d.el) salonKur(el); else kurulumKur(el);
      boyutCb = () => tuvalBoyutla(); window.addEventListener('resize', boyutCb);
      gorunurCb = () => { if (document.visibilityState === 'visible') ciz(); }; document.addEventListener('visibilitychange', gorunurCb);
      olayIptal.push(ctx.olay.dinle('azHareket', () => ciz()));
      if (d.ten && d.el) { const a = ADIMLAR.find(x => x.id === d.adim); sonra(() => balon(d.eller[d.el].some(t => t.renk) ? 'Tırnakların seni bekliyordu.' : (a ? a.ipucu : '')), 500); }
    },
    unmount() {
      clearTimeout(kaydetT); clearTimeout(balonT); hepsiniIptal();
      if (raf) cancelAnimationFrame(raf); raf = 0;
      if (boyutCb) window.removeEventListener('resize', boyutCb); boyutCb = null;
      if (gorunurCb) document.removeEventListener('visibilitychange', gorunurCb); gorunurCb = null;
      olayIptal.forEach(f => { try { f(); } catch (e) {} }); olayIptal = [];
      if (d && ctx) kaydetDurum();
      ctx.ses.hepsiniDurdur();
      animler.clear(); surukle = null; seciliParca = null;
      Object.keys(ui).forEach(k => { ui[k] = null; });
      tuval = null; g2 = null; fircaTuval = null; fircaG = null; ctx = null; kok = null; d = null;
    }
  });
})();
