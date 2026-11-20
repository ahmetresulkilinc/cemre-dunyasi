/* js/bolum/guzellik.js — Güzellik Salonu
   Özgün bir "makeover" oyunu: müşteri kartı → Temizlik → Bakım → Makyaj → Saç → Giydirme → Final (fotoğraf).
   Tamamı kodla çizilir (canvas 2D, gradyan + gölge + ışık). Dış kaynak, font, görsel YOK.
   Katmanlar (yüz koordinatı 360×480, ekran dışı tuvaller): cilt · film · kir · köpük · bakım parıltısı · kil maske ·
   krem · makyaj (+ canlı fırça tamponu) · saç arka/ön. Tam boy görünüm (giydirme/final) aynı yüzü ölçekleyerek çizer.
   Kayıt: cd.guzellik.durum (JSON) + idb genel/guzellik:makyaj (PNG) + idb genel/guzellik:foto:* (albüm, en çok 40). */
(() => {
  'use strict';
  const ID = 'guzellik';
  const FW = 360, FH = 480;              // mantıksal sahne (yüz ve tam boy aynı ölçü)
  const RY = 2, RD = 1;                   // ekran dışı tuval çözünürlüğü: yüksek (cilt/makyaj/saç) · düşük (kir/köpük/maske)
  const HS = 8, GX = FW / HS, GY = FH / HS;  // ilerleme ızgarası (8 birimlik hücreler)
  const ALBUM_MAKS = 40;

  /* ================================================================ yardımcılar */
  const sinir = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const yumus = t => t * t * (3 - 2 * t);
  const uzak = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  function rng(tohum) { let s = (tohum >>> 0) || 0x9e3779b9; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const sec = (r, dizi) => dizi[Math.floor(r() * dizi.length) % dizi.length];
  function hexRgb(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  const rgbHex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(sinir(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  function karis(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex(lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)); }
  const ton = (h, m) => m >= 0 ? karis(h, '#ffffff', m) : karis(h, '#000000', -m);
  const sicakKoyu = (h, m) => karis(h, '#5b2c22', m);
  function rgba(h, a) { const x = hexRgb(h); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')'; }
  const parlaklik = h => { const x = hexRgb(h); return (x[0] * 0.299 + x[1] * 0.587 + x[2] * 0.114) / 255; };
  function tuval(w, h, r) {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * r)); c.height = Math.max(1, Math.round(h * r));
    const x = c.getContext('2d'); x.setTransform(r, 0, 0, r, 0, 0); c._r = r; c._x = x; return c;
  }
  function tuvalTemizle(c) { const x = c._x; x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.restore(); }
  function elips(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2); }
  function yumusakNokta(c, x, y, r, renk, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(renk, a)); g.addColorStop(1, rgba(renk, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  // düzgün eğri: noktalar dizisinden kapalı/açık yol (orta noktalı karesel)
  function egri(c, nk, kapali) {
    if (nk.length < 2) return;
    c.moveTo(nk[0][0], nk[0][1]);
    for (let i = 1; i < nk.length - 1; i++) { const mx = (nk[i][0] + nk[i + 1][0]) / 2, my = (nk[i][1] + nk[i + 1][1]) / 2; c.quadraticCurveTo(nk[i][0], nk[i][1], mx, my); }
    const s = nk[nk.length - 1]; c.lineTo(s[0], s[1]);
    if (kapali) c.closePath();
  }
  function yildizYol(c, x, y, r1, r2, n, don) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = (don || -Math.PI / 2) + i * Math.PI / n, r = i % 2 ? r2 : r1; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.closePath();
  }
  function kalpYol(c, x, y, s) {
    c.beginPath(); c.moveTo(x, y + s * 0.35);
    c.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.4);
    c.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35); c.closePath();
  }
  function kapsul(c, ax, ay, bx, by, ra, rb) {   // konik kapsül (kol/bacak)
    const a = Math.atan2(by - ay, bx - ax), n = a + Math.PI / 2;
    c.moveTo(ax + Math.cos(n) * ra, ay + Math.sin(n) * ra);
    c.lineTo(bx + Math.cos(n) * rb, by + Math.sin(n) * rb);
    c.arc(bx, by, rb, n, n - Math.PI, true);
    c.lineTo(ax - Math.cos(n) * ra, ay - Math.sin(n) * ra);
    c.arc(ax, ay, ra, n + Math.PI, n, true);
    c.closePath();
  }
  // kumaş ışığı: yanlar koyu, orta açık (soldan gelen ışık)
  function kumas(c, renk, x0, x1, guc) {
    const g = c.createLinearGradient(x0, 0, x1, 0), k = guc == null ? 1 : guc;
    g.addColorStop(0, ton(renk, -0.28 * k)); g.addColorStop(0.32, ton(renk, 0.1 * k)); g.addColorStop(0.55, renk); g.addColorStop(1, ton(renk, -0.32 * k));
    return g;
  }

  /* ================================================================ veri: karakter */
  const TENLER = ['#FBE6DA', '#F6D9C7', '#F3D2BC', '#ECC4A8', '#E2B394', '#D6A07D', '#C38862', '#A86E4B', '#8A553A', '#6B402C'];
  const GOZLER = [
    { ad: 'Koyu kahve', r: '#3A2317' }, { ad: 'Kahve', r: '#6A4127' }, { ad: 'Ela', r: '#8E6C33' }, { ad: 'Bal', r: '#B07A2E' },
    { ad: 'Yeşil', r: '#4E7A48' }, { ad: 'Mavi', r: '#4479B2' }, { ad: 'Gri', r: '#7A8794' }, { ad: 'Siyah', r: '#1C1412' }, { ad: 'Mor', r: '#6A589E' }
  ];
  const SAC_RENK = [
    { ad: 'Koyu kahve', r: '#3E2A22' }, { ad: 'Siyah', r: '#1D1716' }, { ad: 'Kahve', r: '#5A3826' }, { ad: 'Açık kahve', r: '#83573A' },
    { ad: 'Karamel', r: '#A9743F' }, { ad: 'Bal sarısı', r: '#D2A764' }, { ad: 'Platin', r: '#E8D7B0' }, { ad: 'Kızıl', r: '#A2452A' },
    { ad: 'Bordo', r: '#6E2633' }, { ad: 'Pembe', r: '#E59AB6' }, { ad: 'Lila', r: '#A592DA' }, { ad: 'Buz mavisi', r: '#79AEDC' }, { ad: 'Gümüş', r: '#CFCBD6' }
  ];
  const SAC_MODEL = [
    { id: 'dalgali', ad: 'Uzun dalgalı' }, { id: 'duz', ad: 'Düz' }, { id: 'kivircik', ad: 'Kıvırcık' }, { id: 'atkuyrugu', ad: 'At kuyruğu' },
    { id: 'topuz', ad: 'Topuz' }, { id: 'orgu', ad: 'Örgü' }, { id: 'ikiorgu', ad: 'İki örgü' }, { id: 'kakul', ad: 'Kâküllü' },
    { id: 'bob', ad: 'Kısa bob' }, { id: 'yarim', ad: 'Yarım toplu' }, { id: 'perde', ad: 'Perde kâkül' }, { id: 'lob', ad: 'Omuz boyu' }
  ];
  const SAC_AKS = [
    { id: 'yok', ad: 'Yok', renkler: ['#000000'] },
    { id: 'toka', ad: 'Toka', renkler: ['#E2B95A', '#F6F0E6', '#2B2B30', '#F29AB4'] },
    { id: 'tac', ad: 'Taç', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#B9A6F0'] },
    { id: 'fiyonk', ad: 'Fiyonk', renkler: ['#F07FA5', '#1F1B24', '#FFFFFF', '#C8102E', '#A9C9F0'] },
    { id: 'cicek', ad: 'Çiçek', renkler: ['#FFFFFF', '#F7A8C0', '#FFD36E', '#C9B4F2'] },
    { id: 'inci', ad: 'İnci tokalar', renkler: ['#F6F0E6', '#F7D8E0', '#E2B95A', '#D6D9E0'] },
    { id: 'bant', ad: 'Saç bandı', renkler: ['#1F1B24', '#F07FA5', '#FFF4EC', '#7FB6E8', '#C8102E'] },
    { id: 'kelebek', ad: 'Kelebek tokalar', renkler: ['#F29AB4', '#B9A6F0', '#8FD3C2', '#FFD36E'] }
  ];
  const ISIMLER = ['Defne', 'Ela', 'Zeynep', 'Mira', 'Lina', 'Nil', 'Asya', 'Duru', 'Ada', 'Leyla', 'Yaren', 'Su', 'Elif', 'Nehir', 'Ece', 'Melis', 'Derin', 'Lara'];
  const ISTEKLER = [
    'Bu akşam mezuniyetim var!', 'Bir düğüne davetliyim, şık olsun.', 'Sahilde gün batımı fotoğrafı çekilecek.', 'Bugün sadece doğal görünmek istiyorum.',
    'Gece kulübüne gidiyoruz, parıltı şart.', 'Kış tatili için sıcacık bir kombin lazım.', 'Spor salonundan sonra kahve buluşması.', 'Paris temalı bir fotoğraf çekimi var.',
    'Y2K partisine gidiyorum!', 'İlk randevum, biraz heyecanlıyım.'
  ];

  /* ================================================================ veri: makyaj */
  const P = (r, f) => ({ r, f: f || 'mat' });
  const FAR_PALET = [
    { ad: 'Gül kurusu', renkler: [P('#F3D6CF'), P('#E8B6AE'), P('#D7948D'), P('#B9746E'), P('#8E5450'), P('#F6E1D8', 'sim'), P('#E9A9B6', 'sim'), P('#C98A94', 'glitter'), P('#5E3A3A')] },
    { ad: 'Gün batımı', renkler: [P('#F8D9B5'), P('#F2B07A'), P('#E5844F'), P('#C9603A'), P('#8E3E2A'), P('#F5C77A', 'sim'), P('#E7965E', 'sim'), P('#D9A441', 'glitter'), P('#4E2A22')] },
    { ad: 'Duman', renkler: [P('#E8E4E6'), P('#BFB8BE'), P('#8F8790'), P('#5F5862'), P('#2C272F'), P('#D9D6DE', 'sim'), P('#9A93A6', 'sim'), P('#C7C2D6', 'glitter'), P('#161319')] },
    { ad: 'Pastel şeker', renkler: [P('#F9D6E5'), P('#E2D2F7'), P('#CDE9F7'), P('#D3F1E1'), P('#FFF1C2'), P('#F4C4DE', 'sim'), P('#C8B8F2', 'sim'), P('#B8E6F2', 'glitter'), P('#FFD1B8', 'glitter')] },
    { ad: 'Gece mücevheri', renkler: [P('#2B3A78'), P('#4A2A6E'), P('#1F5A5A'), P('#7A1F3D'), P('#B78A2E'), P('#6E86D8', 'sim'), P('#A779D9', 'sim'), P('#E6C35C', 'glitter'), P('#D95C9A', 'glitter')] },
    { ad: 'Y2K neon', renkler: [P('#FF7AC6'), P('#7AD7FF'), P('#C3FF7A'), P('#FFE45C'), P('#B57AFF'), P('#FFB3E6', 'sim'), P('#A8F0FF', 'sim'), P('#FFFFFF', 'glitter'), P('#FF9AD5', 'glitter')] }
  ];
  const URUNLER = {
    primer:     { ad: 'Primer', ikon: '🫙', bolge: 'yuz', renkler: [P('#FFF6F0')], boy: 34, yog: 0.18, sert: 0.1, ipucu: 'Yüzün her yerine ince bir kat; makyaj daha pürüzsüz durur.' },
    fondoten:   { ad: 'Fondöten', ikon: '🧴', bolge: 'yuz', renkler: ['#FBE3D3', '#F5D4BF', '#F0C9AE', '#E8BB9B', '#DDAA86', '#CF9873', '#BC845F', '#A36D4C', '#86553A', '#673F2C'].map(r => P(r)), boy: 30, yog: 0.3, sert: 0.15, tumu: true, ipucu: 'Ton seç ve yay. "Tüm yüze" ile tek seferde sürebilirsin.' },
    kapatici:   { ad: 'Kapatıcı', ikon: '🖌️', bolge: 'yuz', renkler: [P('#FFF0E4'), P('#F8E0CC'), P('#F0CFB4'), P('#E2B996'), P('#F4B59A'), P('#CFE0BC')], boy: 10, yog: 0.45, sert: 0.3, ipucu: 'Göz altına ve kızarıklıklara minik dokunuşlar. Yeşil ton kızarıklığı yatıştırır.' },
    pudra:      { ad: 'Pudra', ikon: '🌫️', bolge: 'yuz', renkler: [P('#FFFFFF'), P('#F5E2D2'), P('#E8CBB2'), P('#CDA88A')], boy: 36, yog: 0.12, sert: 0.05, ipucu: 'Parlamayı alır, makyajı sabitler.' },
    kontur:     { ad: 'Kontür', ikon: '🤎', bolge: 'yuz', renkler: [P('#A9806A'), P('#8D6653'), P('#6F4E40'), P('#B89080'), P('#5A3D33')], boy: 14, yog: 0.22, sert: 0.1, ipucu: 'Elmacık kemiğinin altına, çene hattına ve burnun yanlarına.' },
    bronzer:    { ad: 'Bronzer', ikon: '☀️', bolge: 'yuz', renkler: [P('#C98A5E'), P('#B87545'), P('#DBA373'), P('#A3613B')], boy: 24, yog: 0.2, sert: 0.08, ipucu: 'Güneşin değeceği yerlere: alın, burun, elmacıklar.' },
    allik:      { ad: 'Allık', ikon: '🌸', bolge: 'yuz', renkler: [P('#F29AA8'), P('#F4A6A0'), P('#FF8FA3'), P('#E57A8C'), P('#F5B3C6'), P('#E8927C'), P('#D9738B'), P('#FFB199'), P('#C76B86')], boy: 22, yog: 0.25, sert: 0.05, ipucu: 'Gülümse ve yanakların tepesine dairesel sür.' },
    aydinlatici:{ ad: 'Aydınlatıcı', ikon: '✨', bolge: 'yuz', renkler: [P('#FFF6E8', 'sim'), P('#FDE7C7', 'sim'), P('#F9D7E3', 'sim'), P('#E6E0FF', 'sim'), P('#FFE9A8', 'glitter')], boy: 10, yog: 0.4, sert: 0.15, ipucu: 'Elmacık tepesi, burun kemeri, kaş altı ve dudak kavsi.' },
    kaskalem:   { ad: 'Kaş kalemi', ikon: '✏️', bolge: 'kas', renkler: [P('#3B2A22'), P('#5A4030'), P('#211B19'), P('#7A5A42'), P('#A07A5A'), P('#6B4A3A')], boy: 4, yog: 0.55, sert: 0.5, ipucu: 'Kaşın boşluklarını kıl kıl doldur.' },
    kasjel:     { ad: 'Kaş jeli', ikon: '🪮', ozel: 'kasjel', ipucu: 'Kaşları yukarı doğru tara; kıllar havalanır ve parlar.' },
    far:        { ad: 'Göz farı', ikon: '🎨', bolge: 'goz', palet: true, boy: 9, yog: 0.45, sert: 0.15, ipucu: 'Göz kapağına sür; koyu tonu dış köşeye, simi ortaya.' },
    eyeliner:   { ad: 'Eyeliner', ikon: '🖋️', ozel: 'liner', ipucu: 'Bir stil seç, sonra parmağını kirpik dibinde içten dışa kaydır.' },
    rimel:      { ad: 'Rimel', ikon: '🪄', ozel: 'rimel', ipucu: 'Kirpiklerin üstünde yukarı doğru kaydır; her geçişte uzarlar.' },
    kirpik:     { ad: 'Takma kirpik', ikon: '👁️', ozel: 'kirpik', ipucu: 'Bir model seç; kirpik dibine yapışır.' },
    dkalem:     { ad: 'Dudak kalemi', ikon: '🖍️', bolge: 'dudakHat', renkler: [P('#B5655F'), P('#9A4A4A'), P('#C77B7B'), P('#7A2E3A'), P('#D98C8C'), P('#8E5A4A'), P('#5E2230')], boy: 3, yog: 0.7, sert: 0.6, ipucu: 'Dudak çizgisini takip et; rujun taşmasın.' },
    ruj:        { ad: 'Ruj', ikon: '💄', bolge: 'dudak', renkler: [P('#C98C7E'), P('#D77A8A'), P('#F0739A'), P('#F2715E'), P('#C8102E'), P('#A1122A'), P('#6E1A2A'), P('#7A2D55'), P('#F4A08A'), P('#E0218A'), P('#8A4B3C'), P('#6A3A8A')], boy: 7, yog: 0.6, sert: 0.45, bitis: true, ipucu: 'Önce bitişi seç (mat, parlak, likit), sonra dudağa sür.' },
    parlatici:  { ad: 'Parlatıcı', ikon: '💧', ozel: 'parlatici', ipucu: 'Dudağın üstünde gezdir; ışıl ışıl olsun.' },
    sus:        { ad: 'Süsler', ikon: '💎', ozel: 'sus', ipucu: 'Çil ve glitteri sürükleyerek serp; taş ve kalbi dokunarak koy. Dokunduğunu kaldırırsın.' },
    silgi:      { ad: 'Silgi', ikon: '🧽', bolge: 'yuz', silgi: true, boy: 14, yog: 0.6, sert: 0.3, ipucu: 'Fazla gelen yeri nazikçe sil.' }
  };
  const MAKYAJ_SIRA = ['hazir', 'primer', 'fondoten', 'kapatici', 'pudra', 'kontur', 'bronzer', 'allik', 'aydinlatici', 'kaskalem', 'kasjel', 'far', 'eyeliner', 'rimel', 'kirpik', 'dkalem', 'ruj', 'parlatici', 'sus', 'silgi'];
  const MAKYAJ_GRUP = { ten: ['primer', 'fondoten', 'kapatici', 'pudra'], yanak: ['kontur', 'bronzer', 'allik', 'aydinlatici'], kas: ['kaskalem', 'kasjel'], goz: ['far', 'eyeliner', 'rimel', 'kirpik'], dudak: ['dkalem', 'ruj', 'parlatici'], sus: ['sus'] };
  const LINER = [{ id: 'yok', ad: 'Yok' }, { id: 'ince', ad: 'İnce' }, { id: 'kanat', ad: 'Kanatlı' }, { id: 'kedi', ad: 'Kedi gözü' }, { id: 'grafik', ad: 'Grafik' }, { id: 'duman', ad: 'Dumanlı' }];
  const LINER_RENK = ['#141014', '#4A2E22', '#1E2A5A', '#FFFFFF', '#6A3A9A', '#1F7A6A', '#C9A13A', '#E0218A'];
  const RIMEL_RENK = ['#141014', '#4A2E22', '#1E2A6A', '#5E1A2A'];
  const KIRPIK = [{ id: 'yok', ad: 'Yok' }, { id: 'dogal', ad: 'Doğal' }, { id: 'yogun', ad: 'Yoğun' }, { id: 'kedi', ad: 'Kedi' }, { id: 'tuy', ad: 'Tüy tüy' }, { id: 'alt', ad: 'Alt kirpikli' }];
  const PARLATICI = [{ ad: 'Şeffaf', r: '#FFFFFF' }, { ad: 'Pembe', r: '#FF8FB8' }, { ad: 'Şampanya', r: '#F3D19A' }, { ad: 'Kiraz', r: '#D8264A' }, { ad: 'Holografik', r: '#C9B8FF' }];
  const SUSLER = [
    { id: 'cil', ad: 'Çil', ikon: '🟤', serp: true },
    { id: 'glitter', ad: 'Glitter', ikon: '✨', serp: true },
    { id: 'tas', ad: 'Taş', ikon: '💎', renkler: ['#FFFFFF', '#9FD8FF', '#FF9AD0', '#C9A6FF', '#FFD86E'] },
    { id: 'kalp', ad: 'Kalp', ikon: '❤️', renkler: ['#FF5C8A', '#C8102E', '#FFB3CC', '#B57AFF'] },
    { id: 'yildiz', ad: 'Yıldız', ikon: '⭐', renkler: ['#FFD86E', '#FFFFFF', '#9FD8FF', '#FF9AD0'] },
    { id: 'inci', ad: 'İnci', ikon: '⚪', renkler: ['#F6F0E6', '#F7D8E0', '#E7E0F5'] }
  ];
  // hazır görünümler: uygula() içinde boyanır, sonra düzenlenebilir
  const HAZIR = [
    { id: 'natural', ad: 'Natural', not: 'Temiz, ışıltılı, "makyajsız makyaj".' },
    { id: 'soft', ad: 'Soft glam', not: 'Sıcak tonlar, kanatlı eyeliner.' },
    { id: 'gece', ad: 'Gece', not: 'Dumanlı göz, koyu dudak.' },
    { id: 'y2k', ad: 'Y2K', not: 'Pastel far, parlatıcı, yıldızlar.' },
    { id: 'glass', ad: 'Glass skin', not: 'Kore tarzı cam cilt, gradyan dudak.' },
    { id: 'kirmizi', ad: 'Kırmızı ruj', not: 'Klasik kedi gözü ve kırmızı dudak.' }
  ];

  /* ================================================================ veri: gardırop (her parça ≥4 renk) */
  const KOT = ['#4A6C93', '#2F4A6E', '#7FA3C8', '#1F2A3A', '#E9E4DA', '#2A2A2E'];
  const NOTR = ['#FFFFFF', '#1F1B24', '#E8DCCB', '#B9A08A', '#8C93A0'];
  const GARDIROP = {
    ust: { ad: 'Üst', ikon: '👚', parcalar: [
      { id: 'tisort', ad: 'Basic tişört', yaka: 'yuvarlak', kol: 'kisa', boy: 252, bol: 0.4, renkler: ['#FFFFFF', '#1F1B24', '#F4B8C8', '#A9C9F0', '#F7E3A1', '#9DC9A8'] },
      { id: 'crop', ad: 'Crop top', yaka: 'yuvarlak', kol: 'kisa', boy: 218, bol: 0.1, renkler: ['#F7A8C4', '#FFFFFF', '#1F1B24', '#B9A6F0', '#9FE3C4'] },
      { id: 'aski', ad: 'Saten askılı', yaka: 'aski', kol: 'yok', boy: 246, bol: 0.25, desen: 'saten', renkler: ['#F3D7C6', '#1F1B24', '#C9184A', '#E8E0F7', '#5E7A9A'] },
      { id: 'gomlek', ad: 'Gömlek', yaka: 'gomlek', kol: 'uzun', boy: 262, bol: 0.55, ekstra: 'dugme', renkler: ['#FFFFFF', '#CFE0F2', '#F4D3DC', '#1F1B24', '#E8DCCB'] },
      { id: 'kazak', ad: 'Örgü kazak', yaka: 'yuvarlak', kol: 'uzun', boy: 256, bol: 0.8, desen: 'orgu', renkler: ['#F1E6D6', '#C9A6A0', '#7A2E3A', '#5F6E5A', '#F4B8C8', '#2E2A30'] },
      { id: 'balikci', ad: 'Balıkçı yaka', yaka: 'bogazli', kol: 'uzun', boy: 250, bol: 0.15, renkler: ['#1F1B24', '#FFFFFF', '#B9A08A', '#7A2E3A', '#8C93A0'] },
      { id: 'firfir', ad: 'Fırfırlı bluz', yaka: 'kare', kol: 'balon', boy: 240, bol: 0.35, ekstra: 'firfir', renkler: ['#FFFFFF', '#F7D6E0', '#FFF1C2', '#CDE9F7', '#E2D2F7'] },
      { id: 'bustiyer', ad: 'Spor büstiyer', yaka: 'yuvarlak', kol: 'kalinAski', boy: 212, bol: 0, ekstra: 'spor', renkler: ['#1F1B24', '#F07FA5', '#7FB6E8', '#9FE3C4', '#FFFFFF'] },
      { id: 'korse', ad: 'Straplez korse', yaka: 'straplez', kol: 'yok', boy: 236, bol: 0, ekstra: 'korse', renkler: ['#FFFFFF', '#1F1B24', '#F4B8C8', '#C8102E', '#D9C2A6'] },
      { id: 'kalpli', ad: 'Kalpli tişört', yaka: 'yuvarlak', kol: 'kisa', boy: 248, bol: 0.35, desen: 'kalp', renkler: ['#FFFFFF', '#F4B8C8', '#1F1B24', '#E2D2F7'] },
      { id: 'cizgili', ad: 'Çizgili bluz', yaka: 'kayik', kol: 'uzun', boy: 250, bol: 0.3, desen: 'cizgi', renkler: ['#1E2A5A', '#C8102E', '#1F1B24', '#F07FA5'] }
    ] },
    alt: { ad: 'Alt', ikon: '👖', parcalar: [
      { id: 'skinny', ad: 'Dar kot', tip: 'pantolon', paca: 'dar', kot: true, renkler: KOT },
      { id: 'genis', ad: 'Geniş paça kot', tip: 'pantolon', paca: 'genis', kot: true, renkler: KOT },
      { id: 'ispanyol', ad: 'İspanyol paça', tip: 'pantolon', paca: 'ispanyol', kot: true, renkler: KOT },
      { id: 'kumas', ad: 'Kumaş pantolon', tip: 'pantolon', paca: 'duz', renkler: ['#1F1B24', '#E8DCCB', '#B9A08A', '#8C93A0', '#FFFFFF', '#6E2633'] },
      { id: 'kargo', ad: 'Kargo pantolon', tip: 'pantolon', paca: 'kargo', renkler: ['#6B6E4E', '#E8DCCB', '#1F1B24', '#8C93A0', '#B9A08A'] },
      { id: 'tayt', ad: 'Tayt', tip: 'pantolon', paca: 'tayt', renkler: ['#1F1B24', '#5E4A6E', '#F07FA5', '#7FB6E8', '#8C93A0'] },
      { id: 'mini', ad: 'Mini etek', tip: 'etek', boy: 'mini', sekil: 'a', renkler: ['#1F1B24', '#F4B8C8', '#FFFFFF', '#C8102E', '#4A6C93', '#E8DCCB'] },
      { id: 'pileli', ad: 'Pileli etek', tip: 'etek', boy: 'diz', sekil: 'pileli', renkler: ['#2E3A5E', '#F4B8C8', '#E8DCCB', '#5F6E5A', '#1F1B24'] },
      { id: 'saten', ad: 'Saten midi etek', tip: 'etek', boy: 'midi', sekil: 'saten', renkler: ['#F3D7C6', '#1F1B24', '#6E2633', '#B9C9A6', '#C9B8F2'] },
      { id: 'sort', ad: 'Kot şort', tip: 'sort', kot: true, renkler: KOT },
      { id: 'kalem', ad: 'Kalem etek', tip: 'etek', boy: 'diz', sekil: 'kalem', renkler: ['#1F1B24', '#B9A08A', '#6E2633', '#8C93A0'] }
    ] },
    elbise: { ad: 'Elbise', ikon: '👗', parcalar: [
      { id: 'mini', ad: 'Askılı mini', yaka: 'aski', kol: 'yok', etek: 'mini', hacim: 0.3, renkler: ['#1F1B24', '#F4B8C8', '#FFFFFF', '#C8102E', '#9FC3E8'] },
      { id: 'slip', ad: 'Saten midi', yaka: 'aski', kol: 'yok', etek: 'midi', hacim: 0.15, desen: 'saten', renkler: ['#F3D7C6', '#6E2633', '#1F1B24', '#B9C9A6', '#C9B8F2'] },
      { id: 'abiye', ad: 'Uzun abiye', yaka: 'straplez', kol: 'yok', etek: 'uzun', hacim: 0.45, desen: 'saten', renkler: ['#1E2A5A', '#6E2633', '#1F1B24', '#E9C9D3', '#2F5E4E'] },
      { id: 'prenses', ad: 'Mezuniyet tülü', yaka: 'kalp', kol: 'yok', etek: 'uzun', hacim: 1, desen: 'tul', renkler: ['#F7C6D6', '#C9D9F7', '#F6F0E6', '#E2D2F7', '#F2D7A6'] },
      { id: 'cicekli', ad: 'Çiçekli yazlık', yaka: 'kare', kol: 'balon', etek: 'midi', hacim: 0.55, desen: 'cicek', renkler: ['#FFF4E4', '#CDE9F7', '#F7D6E0', '#FFE7A8'] },
      { id: 'payet', ad: 'Payetli gece', yaka: 'v', kol: 'yok', etek: 'mini', hacim: 0.1, desen: 'payet', renkler: ['#C9C4D6', '#E2B95A', '#1F1B24', '#E5679A', '#5A7AD8'] },
      { id: 'kokteyl', ad: 'Kokteyl', yaka: 'v', kol: 'kisa', etek: 'diz', hacim: 0.05, renkler: ['#C8102E', '#1F1B24', '#2F5E4E', '#E8DCCB', '#5E4A8E'] },
      { id: 'gomlek', ad: 'Gömlek elbise', yaka: 'gomlek', kol: 'uzun', etek: 'diz', hacim: 0.3, kemer: true, renkler: ['#E8DCCB', '#CFE0F2', '#FFFFFF', '#6B6E4E', '#1F1B24'] },
      { id: 'davet', ad: 'Davetli pileli', yaka: 'kayik', kol: 'kisa', etek: 'midi', hacim: 0.5, desen: 'pile', kemer: true, renkler: ['#C9D9F7', '#F7C6D6', '#B9C9A6', '#F2D7A6', '#E2D2F7'] }
    ] },
    dis: { ad: 'Dış giyim', ikon: '🧥', parcalar: [
      { id: 'deri', ad: 'Siyah deri ceket', tip: 'biker', boy: 238, renkler: ['#1B181C', '#5A3A2A', '#7A2233', '#E8DCCB'], favori: true },
      { id: 'kotceket', ad: 'Kot ceket', tip: 'kot', boy: 240, renkler: ['#7FA3C8', '#4A6C93', '#1F2A3A', '#E9E4DA'] },
      { id: 'blazer', ad: 'Blazer', tip: 'blazer', boy: 262, renkler: ['#1F1B24', '#E8DCCB', '#F4B8C8', '#8C93A0', '#6E2633'] },
      { id: 'trenc', ad: 'Trençkot', tip: 'trenc', boy: 380, renkler: ['#C9A97A', '#1F1B24', '#8C93A0', '#E8DCCB'] },
      { id: 'sisme', ad: 'Şişme mont', tip: 'sisme', boy: 250, renkler: ['#FFFFFF', '#1F1B24', '#F4B8C8', '#9FC3E8', '#C8102E'] },
      { id: 'hirka', ad: 'Örgü hırka', tip: 'hirka', boy: 258, renkler: ['#F1E6D6', '#C9A6A0', '#9FB59A', '#F4B8C8', '#5E4A6E'] },
      { id: 'pelus', ad: 'Peluş ceket', tip: 'pelus', boy: 252, renkler: ['#F6EFE6', '#E8C9B0', '#F7C6D6', '#2E2A30'] },
      { id: 'bomber', ad: 'Bomber', tip: 'bomber', boy: 240, renkler: ['#4E5A3E', '#1F1B24', '#F7C6D6', '#1E2A5A'] },
      { id: 'palto', ad: 'Uzun palto', tip: 'palto', boy: 410, renkler: ['#B9A08A', '#1F1B24', '#7A2E3A', '#8C93A0', '#F1E6D6'] }
    ] },
    ayakkabi: { ad: 'Ayakkabı', ikon: '👠', parcalar: [
      { id: 'spor', ad: 'Spor ayakkabı', tip: 'spor', renkler: ['#FFFFFF', '#1F1B24', '#F4B8C8', '#9FC3E8'] },
      { id: 'stiletto', ad: 'Stiletto', tip: 'stiletto', renkler: ['#1F1B24', '#C8102E', '#E8C9B0', '#E2B95A', '#F4B8C8'] },
      { id: 'bot', ad: 'Kısa deri bot', tip: 'bot', renkler: ['#1B181C', '#5A3A2A', '#B9A08A', '#FFFFFF'] },
      { id: 'cizme', ad: 'Uzun çizme', tip: 'cizme', renkler: ['#1B181C', '#6A4A36', '#E8DCCB', '#7A2233'] },
      { id: 'babet', ad: 'Babet', tip: 'babet', renkler: ['#F4B8C8', '#1F1B24', '#E8DCCB', '#C8102E', '#FFFFFF'] },
      { id: 'sandalet', ad: 'Topuklu sandalet', tip: 'sandalet', renkler: ['#E2B95A', '#1F1B24', '#FFFFFF', '#E8C9B0'] },
      { id: 'platform', ad: 'Platform', tip: 'platform', renkler: ['#FFFFFF', '#F4B8C8', '#1F1B24', '#B9A6F0'] },
      { id: 'loafer', ad: 'Loafer', tip: 'loafer', renkler: ['#1B181C', '#6A4A36', '#7A2233', '#E8DCCB'] },
      { id: 'karbot', ad: 'Kar botu', tip: 'karbot', renkler: ['#E8DCCB', '#1F1B24', '#F4B8C8', '#8C93A0'] }
    ] },
    canta: { ad: 'Çanta', ikon: '👜', parcalar: [
      { id: 'omuz', ad: 'Omuz çantası', tip: 'omuz', renkler: ['#1F1B24', '#B9A08A', '#F4B8C8', '#7A2233', '#FFFFFF'] },
      { id: 'el', ad: 'El çantası', tip: 'el', renkler: ['#1F1B24', '#E8DCCB', '#C8102E', '#9FC3E8'] },
      { id: 'clutch', ad: 'Zarf clutch', tip: 'clutch', renkler: ['#E2B95A', '#1F1B24', '#F6F0E6', '#E5679A'] },
      { id: 'sirt', ad: 'Sırt çantası', tip: 'sirt', renkler: ['#F4B8C8', '#1F1B24', '#9FC3E8', '#E8DCCB'] },
      { id: 'tote', ad: 'Bez çanta', tip: 'tote', renkler: ['#F1E6D6', '#1F1B24', '#9FB59A', '#F4B8C8'] },
      { id: 'zincir', ad: 'Zincirli mini', tip: 'zincir', renkler: ['#1F1B24', '#FFFFFF', '#F4B8C8', '#C8102E'] },
      { id: 'bel', ad: 'Göğüs çantası', tip: 'bel', renkler: ['#1F1B24', '#8C93A0', '#F07FA5', '#6B6E4E'] },
      { id: 'hasir', ad: 'Hasır sepet', tip: 'hasir', renkler: ['#D9B77A', '#F1E6D6', '#C9A06A', '#E8C9B0'] },
      { id: 'kalp', ad: 'Kalp çanta', tip: 'kalp', renkler: ['#F07FA5', '#C8102E', '#FFFFFF', '#1F1B24'] }
    ] },
    kupe: { ad: 'Küpe', ikon: '💫', parcalar: [
      { id: 'halkak', ad: 'Mini halka', tip: 'halkaK', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#1F1B24'] },
      { id: 'halkab', ad: 'Büyük halka', tip: 'halkaB', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#F07FA5'] },
      { id: 'inci', ad: 'İnci', tip: 'inci', renkler: ['#F6F0E6', '#F7D8E0', '#E7E0F5', '#2E2A30'] },
      { id: 'damla', ad: 'Damla taş', tip: 'damla', renkler: ['#9FD8FF', '#FF9AD0', '#C8102E', '#2F8E5E', '#FFFFFF'] },
      { id: 'yildiz', ad: 'Yıldız sallantı', tip: 'yildiz', renkler: ['#E2B95A', '#D6D9E0', '#FFD86E', '#F07FA5'] },
      { id: 'kalp', ad: 'Kalp', tip: 'kalp', renkler: ['#F07FA5', '#C8102E', '#E2B95A', '#D6D9E0'] },
      { id: 'zincir', ad: 'Uzun zincir', tip: 'zincir', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#1F1B24'] },
      { id: 'cicek', ad: 'Çiçek', tip: 'cicek', renkler: ['#FFFFFF', '#F7A8C0', '#FFD36E', '#9FD8FF'] }
    ] },
    kolye: { ad: 'Kolye', ikon: '📿', parcalar: [
      { id: 'zincir', ad: 'İnce zincir', tip: 'zincir', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#1F1B24'] },
      { id: 'inci', ad: 'İnci dizisi', tip: 'inci', renkler: ['#F6F0E6', '#F7D8E0', '#E7E0F5', '#2E2A30'] },
      { id: 'kalp', ad: 'Kalp kolye', tip: 'kalp', renkler: ['#F07FA5', '#C8102E', '#E2B95A', '#D6D9E0'] },
      { id: 'choker', ad: 'Kadife choker', tip: 'choker', renkler: ['#1F1B24', '#6E2633', '#F4B8C8', '#FFFFFF'] },
      { id: 'nazar', ad: 'Nazar boncuklu', tip: 'nazar', renkler: ['#E2B95A', '#D6D9E0', '#1F1B24', '#E8B4A0'] },
      { id: 'katman', ad: 'Katmanlı zincir', tip: 'katman', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#1F1B24'] },
      { id: 'yildiz', ad: 'Yıldız', tip: 'yildiz', renkler: ['#E2B95A', '#D6D9E0', '#FFD86E', '#9FD8FF'] },
      { id: 'tasli', ad: 'Taşlı gerdanlık', tip: 'tasli', renkler: ['#FFFFFF', '#9FD8FF', '#FF9AD0', '#C8102E', '#2F8E5E'] }
    ] },
    bileklik: { ad: 'Bileklik', ikon: '⌚', parcalar: [
      { id: 'zincir', ad: 'İnce zincir', tip: 'zincir', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#1F1B24'] },
      { id: 'boncuk', ad: 'Boncuk', tip: 'boncuk', renkler: ['#F07FA5', '#9FD8FF', '#FFD86E', '#B9A6F0', '#FFFFFF'] },
      { id: 'kelepce', ad: 'Kelepçe', tip: 'kelepce', renkler: ['#E2B95A', '#D6D9E0', '#1F1B24', '#E8B4A0'] },
      { id: 'inci', ad: 'İnci', tip: 'inci', renkler: ['#F6F0E6', '#F7D8E0', '#E7E0F5', '#2E2A30'] },
      { id: 'saat', ad: 'Saat', tip: 'saat', renkler: ['#E2B95A', '#D6D9E0', '#1F1B24', '#F4B8C8'] },
      { id: 'tasli', ad: 'Su yolu', tip: 'tasli', renkler: ['#FFFFFF', '#9FD8FF', '#FF9AD0', '#2F8E5E'] },
      { id: 'ip', ad: 'Örgü ip', tip: 'ip', renkler: ['#C8102E', '#F07FA5', '#1F1B24', '#7FB6E8'] },
      { id: 'charm', ad: 'Charm', tip: 'charm', renkler: ['#D6D9E0', '#E2B95A', '#E8B4A0', '#F07FA5'] }
    ] },
    yuzuk: { ad: 'Yüzük', ikon: '💍', parcalar: [
      { id: 'tektas', ad: 'Tek taş', tip: 'tektas', renkler: ['#D6D9E0', '#E2B95A', '#E8B4A0', '#9FD8FF'] },
      { id: 'ince', ad: 'İnce halka', tip: 'ince', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#1F1B24'] },
      { id: 'cift', ad: 'Çift halka', tip: 'cift', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#1F1B24'] },
      { id: 'kalp', ad: 'Kalp', tip: 'kalp', renkler: ['#F07FA5', '#C8102E', '#E2B95A', '#D6D9E0'] },
      { id: 'inci', ad: 'İnci', tip: 'inci', renkler: ['#F6F0E6', '#F7D8E0', '#E7E0F5', '#2E2A30'] },
      { id: 'kokteyl', ad: 'Kokteyl taşı', tip: 'kokteyl', renkler: ['#2F8E5E', '#C8102E', '#5A7AD8', '#B57AFF', '#FFD86E'] },
      { id: 'yilan', ad: 'Sarmal', tip: 'yilan', renkler: ['#E2B95A', '#D6D9E0', '#E8B4A0', '#1F1B24'] },
      { id: 'yildiz', ad: 'Yıldız', tip: 'yildiz', renkler: ['#E2B95A', '#D6D9E0', '#FFD86E', '#F07FA5'] }
    ] },
    gozluk: { ad: 'Gözlük', ikon: '🕶️', parcalar: [
      { id: 'yuvarlak', ad: 'Yuvarlak', tip: 'yuvarlak', renkler: ['#2B2B30', '#E2B95A', '#B07A4A', '#F4B8C8'] },
      { id: 'kedi', ad: 'Kedi gözü', tip: 'kedi', renkler: ['#1F1B24', '#C8102E', '#F4B8C8', '#FFFFFF', '#7A4A2A'] },
      { id: 'aviator', ad: 'Pilot', tip: 'aviator', renkler: ['#E2B95A', '#D6D9E0', '#2B2B30', '#E8B4A0'] },
      { id: 'kare', ad: 'Kalın kare', tip: 'kare', renkler: ['#1F1B24', '#7A4A2A', '#E8DCCB', '#5A7AD8'] },
      { id: 'kalp', ad: 'Kalp', tip: 'kalp', renkler: ['#F07FA5', '#C8102E', '#FFFFFF', '#B57AFF'] },
      { id: 'mini', ad: 'Mini oval', tip: 'mini', renkler: ['#1F1B24', '#E2B95A', '#F07FA5', '#9FD8FF'] },
      { id: 'buyuk', ad: 'Büyük güneş', tip: 'buyuk', renkler: ['#1F1B24', '#7A4A2A', '#FFFFFF', '#E8C9B0'] },
      { id: 'kalkan', ad: 'Kalkan', tip: 'kalkan', renkler: ['#C9B8FF', '#FF9AD0', '#9FD8FF', '#2B2B30'] }
    ] },
    sapka: { ad: 'Şapka', ikon: '👒', parcalar: [
      { id: 'bere', ad: 'Örgü bere', tip: 'bere', renkler: ['#F1E6D6', '#1F1B24', '#C8102E', '#F4B8C8', '#8C93A0'] },
      { id: 'kova', ad: 'Kova şapka', tip: 'kova', renkler: ['#F1E6D6', '#1F1B24', '#9FC3E8', '#F4B8C8'] },
      { id: 'hasir', ad: 'Hasır şapka', tip: 'hasir', renkler: ['#E2C68A', '#F1E6D6', '#C9A06A', '#F7D6E0'] },
      { id: 'fotr', ad: 'Fötr', tip: 'fotr', renkler: ['#1F1B24', '#B9A08A', '#7A2E3A', '#E8DCCB'] },
      { id: 'kep', ad: 'Beyzbol kep', tip: 'kep', renkler: ['#FFFFFF', '#1F1B24', '#F4B8C8', '#1E2A5A'] },
      { id: 'fransiz', ad: 'Fransız beresi', tip: 'fransiz', renkler: ['#C8102E', '#1F1B24', '#F4B8C8', '#E8DCCB'] },
      { id: 'ponpon', ad: 'Ponponlu bere', tip: 'ponpon', renkler: ['#F7C6D6', '#FFFFFF', '#9FC3E8', '#1F1B24'] },
      { id: 'bandana', ad: 'Bandana', tip: 'bandana', renkler: ['#C8102E', '#1E2A5A', '#F07FA5', '#1F1B24'] }
    ] }
  };
  const KATEGORI_SIRA = ['stil', 'ust', 'alt', 'elbise', 'dis', 'ayakkabi', 'canta', 'kupe', 'kolye', 'bileklik', 'yuzuk', 'gozluk', 'sapka'];
  const k = (id, r) => ({ id, r: r || 0 });
  const STILLER = [
    { id: 'bizim', ad: 'Bizim kombin', not: 'Siyah deri ceket + kot. Ahmet\'le senin favoriniz.', kiy: { ust: k('tisort', 0), alt: k('skinny', 0), dis: k('deri', 0), ayakkabi: k('bot', 0), canta: k('zincir', 0), kolye: k('nazar', 0), kupe: k('halkak', 0), yuzuk: k('ince', 0) } },
    { id: 'gunluk', ad: 'Günlük', not: 'Rahat ama tatlı.', kiy: { ust: k('kalpli', 1), alt: k('genis', 2), ayakkabi: k('spor', 0), canta: k('tote', 0), kupe: k('halkak', 0), bileklik: k('boncuk', 0) } },
    { id: 'aksam', ad: 'Şık akşam', not: 'Saten ve inci.', kiy: { elbise: k('slip', 1), dis: k('blazer', 0), ayakkabi: k('stiletto', 0), canta: k('clutch', 1), kupe: k('inci', 0), kolye: k('inci', 0), yuzuk: k('tektas', 0) } },
    { id: 'spor', ad: 'Spor', not: 'Salondan kahveye.', kiy: { ust: k('bustiyer', 2), alt: k('tayt', 0), dis: k('bomber', 2), ayakkabi: k('spor', 0), canta: k('bel', 0), sapka: k('kep', 0), bileklik: k('saat', 1) } },
    { id: 'kis', ad: 'Kış', not: 'Sıcacık ve kar beyazı.', kiy: { ust: k('kazak', 0), alt: k('skinny', 3), dis: k('sisme', 0), ayakkabi: k('karbot', 0), sapka: k('ponpon', 0), canta: k('omuz', 1) } },
    { id: 'yaz', ad: 'Yaz', not: 'Çiçekler ve hasır.', kiy: { elbise: k('cicekli', 0), ayakkabi: k('sandalet', 0), canta: k('hasir', 0), sapka: k('hasir', 0), gozluk: k('buyuk', 1), kupe: k('cicek', 0) } },
    { id: 'gece', ad: 'Gece kulübü', not: 'Payet, ışık, ritim.', kiy: { elbise: k('payet', 0), ayakkabi: k('platform', 2), canta: k('zincir', 0), kupe: k('halkab', 0), kolye: k('choker', 0), bileklik: k('tasli', 0) } },
    { id: 'mezuniyet', ad: 'Mezuniyet', not: 'Tül, taç ve kocaman bir gülüş.', kiy: { elbise: k('prenses', 0), ayakkabi: k('stiletto', 2), canta: k('clutch', 2), kupe: k('damla', 4), kolye: k('tasli', 0), bileklik: k('inci', 0) } },
    { id: 'dugun', ad: 'Düğün davetlisi', not: 'Pastel, zarif, beyaz değil.', kiy: { elbise: k('davet', 0), ayakkabi: k('sandalet', 3), canta: k('el', 1), kupe: k('inci', 1), kolye: k('zincir', 0), yuzuk: k('kokteyl', 2) } }
  ];
  const FONLAR = [{ id: 'studyo', ad: 'Stüdyo' }, { id: 'mahalle', ad: 'Pixel mahalle' }, { id: 'gunbatimi', ad: 'Gün batımı' }, { id: 'paris', ad: 'Paris' }, { id: 'sahil', ad: 'Sahil' }];
  const POZLAR = [{ id: 'duz', ad: 'Dik duruş' }, { id: 'bel', ad: 'Eller belde' }, { id: 'model', ad: 'Model' }, { id: 'selam', ad: 'El salla' }, { id: 'kalp', ad: 'Kalp' }];

  /* aşamalar ve adımlar */
  const ASAMALAR = [
    { id: 'musteri', ad: 'Müşteri', ikon: '🪪' },
    { id: 'temizlik', ad: 'Temizlik', ikon: '🫧' },
    { id: 'bakim', ad: 'Bakım', ikon: '🧖‍♀️' },
    { id: 'makyaj', ad: 'Makyaj', ikon: '💄' },
    { id: 'sac', ad: 'Saç', ikon: '💇‍♀️' },
    { id: 'giydir', ad: 'Giydirme', ikon: '👗' },
    { id: 'final', ad: 'Final', ikon: '📸' }
  ];
  const ADIMLAR = {
    temizlik: [
      { id: 'pamuk', ad: 'Makyaj temizleme', ikon: '☁️', ipucu: 'Pamukla eski rimel ve ruj izlerini sil.' },
      { id: 'kopuk', ad: 'Köpük', ikon: '🫧', ipucu: 'Daire çizerek köpürt, sonra suyla durula.' },
      { id: 'siyah', ad: 'Siyah nokta bandı', ikon: '🩹', ipucu: 'Bandı buruna koy, bastır, sonra çekip kopar.' },
      { id: 'sivilce', ad: 'Sivilceler', ikon: '🔴', ipucu: 'Bant yapıştır ya da cımbızla basılı tut; sonra pamukla sil.' },
      { id: 'kas', ad: 'Kaş alma', ikon: '🤏', ipucu: 'Fazla kılları cımbızla tek tek al.' }
    ],
    bakim: [
      { id: 'tonik', ad: 'Tonik', ikon: '💦', ipucu: 'Pamuğu yüzünde gezdir; cilt ferahlasın.' },
      { id: 'serum', ad: 'Serum', ikon: '💧', ipucu: 'Üç damla damlat, sonra parmak uçlarınla yedir.' },
      { id: 'kil', ad: 'Kil maske', ikon: '🟢', ipucu: 'Maskeyi sür, kurumasını bekle, çatlayınca süngerle sil.' },
      { id: 'ped', ad: 'Göz altı pedi', ikon: '🩷', ipucu: 'Gözlerin altına dokun; biraz beklesin, sonra çıkar.' },
      { id: 'buz', ad: 'Buz rulosu', ikon: '🧊', ipucu: 'Ruloyu yüzünde yuvarla; şişlik ve kızarıklık insin.' },
      { id: 'nem', ad: 'Nemlendirici', ikon: '🧴', ipucu: 'Krem noktaları koy, sonra yay ve yedir.' },
      { id: 'balm', ad: 'Dudak balmı', ikon: '🫦', ipucu: 'Dudakların üstünde gezdir; kuruluk gitsin.' },
      { id: 'sacmaske', ad: 'Saç maskesi', ikon: '🌿', ipucu: 'İsteğe bağlı: saçlara sür, ışıl ışıl olsun.', istege: true }
    ]
  };

  /* ================================================================ durum */
  let ctx = null, kok = null, el = {}, d = null, S = null, T = null, G = null;
  let raf = 0, ro = null, zam = [], kayitZam = 0, mkKayitZam = 0, gozKirpZam = 0, gorunurDinleyici = null, olayKapat = [];

  /* ---------------------------------------------------------------- cihaza özel kayıt
     Yarım müşteri, makyaj tuvali ve albüm tek kişilik oyun çıktısı: senk ile karşı telefona GİTMEZ.
     Durum: localStorage 'cd.cihaz.guzellik.durum' (senk 'cihaz.' önekini atlar).
     Görseller: bölümün kendi IndexedDB'si 'cd-guzellik-cihaz' (senk yalnız 'cd-album' mağazalarını eşitler). */
  const DURUM_ANAHTAR = 'cihaz.guzellik.durum', GOC_ANAHTAR = 'cihaz.guzellik.idbGoc';
  let ydbSoz = null;
  function ydb() {
    if (ydbSoz) return ydbSoz;
    ydbSoz = new Promise((ok, red) => {
      if (!('indexedDB' in window)) { red(new Error('IndexedDB yok')); return; }
      let r; try { r = indexedDB.open('cd-guzellik-cihaz', 1); } catch (e) { red(e); return; }
      r.onupgradeneeded = () => { const x = r.result; if (!x.objectStoreNames.contains('kayit')) x.createObjectStore('kayit', { keyPath: 'id' }); };
      r.onsuccess = () => { const x = r.result; x.onversionchange = () => { x.close(); ydbSoz = null; }; ok(x); };
      r.onerror = () => red(r.error); r.onblocked = () => red(new Error('IndexedDB kilitli'));
    });
    ydbSoz.catch(() => { ydbSoz = null; });
    return ydbSoz;
  }
  function yIslem(mod, fn) {
    return ydb().then(x => new Promise((ok, red) => {
      const t = x.transaction('kayit', mod), r = fn(t.objectStore('kayit')); let v;
      if (r) r.onsuccess = () => { v = r.result; };
      t.oncomplete = () => ok(v); t.onerror = () => red(t.error); t.onabort = () => red(t.error);
    }));
  }
  const yerel = { koy: o => yIslem('readwrite', s => s.put(o)), al: id => yIslem('readonly', s => s.get(id)), hepsi: () => yIslem('readonly', s => s.getAll()), sil: id => yIslem('readwrite', s => s.delete(id)) };
  async function idbGoc() {   // bir kerelik: eski 'genel' mağazasındaki guzellik:* kayıtları cihaza taşınır, ortak mağazadan (ve buluttan) silinir
    if (CD.depo.al(GOC_ANAHTAR, false)) return;
    let l = []; try { l = (await ctx.idb.hepsi('genel')) || []; } catch (e) { return; }
    for (const k of l.filter(x => x && typeof x.id === 'string' && x.id.startsWith(ID + ':'))) {
      try { await yerel.koy(k); if (ctx) await ctx.idb.sil('genel', k.id); } catch (e) { return; }
    }
    CD.depo.yaz(GOC_ANAHTAR, true);
  }
  function musteriVarsayilan() {
    return {
      ad: 'Cemre', cemre: true, ten: '#F3D2BC', goz: '#3A2317',
      sac: { model: 'dalgali', renk: '#3E2A22', ombre: null, aks: null },
      yuz: { en: 1, cene: 1, goz: 1.06, aci: 2.5, dudak: 1, dudakDol: 1.05, kas: 1 },
      tohum: 20240611, istek: 'Kendime bir güzellik günü hediye ediyorum.', kimlik: 'cemre-' + Date.now().toString(36)
    };
  }
  function mkVarsayilan() {
    return { liner: { tip: 'yok', renk: '#141014', ilerleme: [0, 0] }, rimel: 0, rimelRenk: '#141014', kirpik: 'yok', kasJel: 0,
      rujBitis: 'mat', rujVar: false, parlatici: 0, parlaticiRenk: '#FFFFFF', susler: [], cil: [], glit: [], kullanildi: {} };
  }
  function durumVarsayilan() {
    return {
      surum: 1, asama: 'musteri', k: musteriVarsayilan(), bitti: {}, mk: mkVarsayilan(),
      bakim: { yorgun: 1, kizarik: 1, kuru: 1, sacParlak: 0, parlak: 0 },
      kiy: { ust: { id: 'tisort', r: 0 }, alt: { id: 'skinny', r: 0 } }, fon: 'studyo', poz: 'duz', kutlandi: {}, makyajVar: false, foto: 0
    };
  }
  function yukle() {
    let v = null; try { v = CD.depo.al(DURUM_ANAHTAR, null); } catch (e) { v = null; }
    if (!v) {   // bir kerelik göç: eski ortak (senkronlu) kayıt → bu cihaza özel anahtar
      try { const eski = ctx.depo.al('durum', null); if (eski) { CD.depo.yaz(DURUM_ANAHTAR, eski); ctx.depo.sil('durum'); v = eski; } } catch (e) {}
    }
    const t = durumVarsayilan();
    if (!v || v.surum !== 1) return t;
    const o = Object.assign(t, v);
    o.k = Object.assign(musteriVarsayilan(), v.k || {}); o.k.sac = Object.assign(musteriVarsayilan().sac, (v.k || {}).sac || {}); o.k.yuz = Object.assign(musteriVarsayilan().yuz, (v.k || {}).yuz || {});
    o.mk = Object.assign(mkVarsayilan(), v.mk || {}); o.mk.liner = Object.assign(mkVarsayilan().liner, (v.mk || {}).liner || {});
    o.bakim = Object.assign(t.bakim, v.bakim || {});
    if (!ASAMALAR.some(a => a.id === o.asama)) o.asama = 'musteri';
    return o;
  }
  function kaydetGec() { clearTimeout(kayitZam); kayitZam = setTimeout(kaydetSimdi, 600); }
  function kaydetSimdi() {
    clearTimeout(kayitZam); if (!ctx || !d) return;
    try { CD.depo.yaz(DURUM_ANAHTAR, d); } catch (e) {}
    try { const ip = d.asama === 'musteri' ? '' : (d.k.ad + ': ' + (ASAMALAR.find(a => a.id === d.asama) || {}).ad + ' aşamasında'); if (ctx.depo.al('ipucu', '') !== ip) ctx.depo.yaz('ipucu', ip); } catch (e) {}
  }

  /* ================================================================ yüz geometrisi */
  function geoYap(k) {
    const y = k.yuz, e = y.en, cx = 180;
    const cene = 352 + (y.cene - 1) * 44;
    const yuz = new Path2D();
    yuz.moveTo(cx, 90);
    yuz.bezierCurveTo(cx + 64 * e, 88, cx + 97 * e, 128, cx + 98 * e, 192);
    yuz.bezierCurveTo(cx + 99 * e, 236, cx + 93 * e, 268, cx + 76 * e, cene - 52);
    yuz.bezierCurveTo(cx + 58 * e, cene - 22, cx + 28 * e, cene, cx, cene);
    yuz.bezierCurveTo(cx - 28 * e, cene, cx - 58 * e, cene - 22, cx - 76 * e, cene - 52);
    yuz.bezierCurveTo(cx - 93 * e, 268, cx - 99 * e, 236, cx - 98 * e, 192);
    yuz.bezierCurveTo(cx - 97 * e, 128, cx - 64 * e, 88, cx, 90);
    yuz.closePath();
    const gozler = [-1, 1].map(s => {
      const gx = cx + s * 51 * e, gy = 236, W = 60 * y.goz, H = 31 * y.goz;
      return { s, x: gx, y: gy, W, H, ic: [gx - s * W * 0.48, gy + 3], dis: [gx + s * W * 0.5, gy - 2 - y.aci] };
    });
    const kaslar = [-1, 1].map(s => ({ s, ic: [cx + s * 21 * e, 198], tepe: [cx + s * 57 * e, 180], dis: [cx + s * 86 * e, 194], k: y.kas }));
    const dw = 31 * y.dudak, dd = y.dudakDol, dy = 322 + (y.cene - 1) * 12;
    const g = { e, cx, cene, yuz, gozler, kaslar, dudak: { x: cx, y: dy, w: dw, d: dd }, burun: { x: cx, y: 284 }, yanaklar: [[cx - 64 * e, 288], [cx + 64 * e, 288]] };
    g.dudakYol = dudakYolu(g.dudak, 1); g.dudakHat = dudakYolu(g.dudak, 1.14);
    // göz farı bölgesi: göz kapağı + kaş altı + dış köşe (sonra göz üstüne çizilir)
    g.gozBolge = new Path2D();
    gozler.forEach(o => {
      const s = o.s; g.gozBolge.moveTo(o.ic[0] + s * 2, o.ic[1] + 6);
      g.gozBolge.bezierCurveTo(o.ic[0] - s * 6, o.y - 30, o.x + s * 6, o.y - 46, o.dis[0] + s * 16, o.dis[1] - 18);
      g.gozBolge.quadraticCurveTo(o.dis[0] + s * 24, o.dis[1] + 2, o.dis[0] + s * 8, o.dis[1] + 14);
      g.gozBolge.bezierCurveTo(o.x + s * 10, o.y + 26, o.x - s * 18, o.y + 24, o.ic[0] + s * 2, o.ic[1] + 6);
      g.gozBolge.closePath();
    });
    g.kasBolge = new Path2D();
    kaslar.forEach(b => {
      const s = b.s; g.kasBolge.moveTo(b.ic[0] - s * 6, b.ic[1] + 8);
      g.kasBolge.quadraticCurveTo(b.ic[0] + s * 4, b.ic[1] - 16, b.tepe[0], b.tepe[1] - 9);
      g.kasBolge.quadraticCurveTo(b.dis[0] + s * 4, b.dis[1] - 8, b.dis[0] + s * 8, b.dis[1] + 4);
      g.kasBolge.quadraticCurveTo(b.tepe[0], b.tepe[1] + 10, b.ic[0] - s * 6, b.ic[1] + 8); g.kasBolge.closePath();
    });
    return g;
  }
  function dudakYolu(m, b) {
    const { x: cx, y: cy } = m, w = m.w * b, df = m.d * (b > 1 ? 1.15 : 1), sol = [cx - w, cy - 1], sag = [cx + w, cy - 1];
    const ust = new Path2D();
    ust.moveTo(sol[0], sol[1]);
    ust.bezierCurveTo(cx - w * 0.72, cy - 5 * df, cx - w * 0.52, cy - 13 * df, cx - w * 0.3, cy - 13 * df);
    ust.bezierCurveTo(cx - w * 0.14, cy - 13 * df, cx - 4, cy - 9.5 * df, cx, cy - 8.5 * df);
    ust.bezierCurveTo(cx + 4, cy - 9.5 * df, cx + w * 0.14, cy - 13 * df, cx + w * 0.3, cy - 13 * df);
    ust.bezierCurveTo(cx + w * 0.52, cy - 13 * df, cx + w * 0.72, cy - 5 * df, sag[0], sag[1]);
    ust.bezierCurveTo(cx + w * 0.5, cy + 1.5, cx + w * 0.2, cy + 1, cx, cy + 2);
    ust.bezierCurveTo(cx - w * 0.2, cy + 1, cx - w * 0.5, cy + 1.5, sol[0], sol[1]); ust.closePath();
    const alt = new Path2D();
    alt.moveTo(sol[0], sol[1]);
    alt.bezierCurveTo(cx - w * 0.5, cy + 1.5, cx - w * 0.2, cy + 1, cx, cy + 2);
    alt.bezierCurveTo(cx + w * 0.2, cy + 1, cx + w * 0.5, cy + 1.5, sag[0], sag[1]);
    alt.bezierCurveTo(cx + w * 0.82, cy + 14 * df, cx + w * 0.38, cy + 19 * df, cx, cy + 19 * df);
    alt.bezierCurveTo(cx - w * 0.38, cy + 19 * df, cx - w * 0.82, cy + 14 * df, sol[0], sol[1]); alt.closePath();
    const tum = new Path2D(); tum.addPath(ust); tum.addPath(alt);
    return { ust, alt, tum };
  }
  // gözün açık hâli (kapak açıklığı a: 0..1)
  function gozYolu(o, a) {
    const s = o.s, p = new Path2D(), H = o.H * a, cy = o.y;
    p.moveTo(o.ic[0], o.ic[1]);
    p.bezierCurveTo(o.ic[0] + s * o.W * 0.16, cy - H * 0.62, o.dis[0] - s * o.W * 0.3, cy - H * 0.74, o.dis[0], o.dis[1]);
    p.bezierCurveTo(o.dis[0] - s * o.W * 0.22, cy + H * 0.4 + (1 - a) * 2, o.ic[0] + s * o.W * 0.26, cy + H * 0.46, o.ic[0], o.ic[1]);
    p.closePath(); return p;
  }
  function ustKapakNokta(o, a, t) {   // üst kapak eğrisi üzerinde nokta (t: 0 iç → 1 dış)
    const s = o.s, H = o.H * a, cy = o.y;
    const p0 = o.ic, p1 = [o.ic[0] + s * o.W * 0.16, cy - H * 0.62], p2 = [o.dis[0] - s * o.W * 0.3, cy - H * 0.74], p3 = o.dis, u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  function altKapakNokta(o, a, t) {
    const s = o.s, H = o.H * a, cy = o.y;
    const p0 = o.ic, p1 = [o.ic[0] + s * o.W * 0.26, cy + H * 0.46], p2 = [o.dis[0] - s * o.W * 0.22, cy + H * 0.4], p3 = o.dis, u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  function kasNokta(b, t) {   // kaş eğrisi (iç → tepe → dış), kalınlık
    let x, y;
    if (t < 0.62) { const u = t / 0.62; x = lerp(b.ic[0], b.tepe[0], u); y = lerp(b.ic[1], b.tepe[1], Math.sin(u * Math.PI / 2)); }
    else { const u = (t - 0.62) / 0.38; x = lerp(b.tepe[0], b.dis[0], u); y = lerp(b.tepe[1], b.dis[1], u * u); }
    const kal = (t < 0.15 ? lerp(5.5, 7.2, t / 0.15) : t < 0.62 ? lerp(7.2, 5.2, (t - 0.15) / 0.47) : lerp(5.2, 1.6, (t - 0.62) / 0.38)) * b.k;
    return [x, y, kal];
  }

  /* ================================================================ ızgara (ilerleme ölçümü) */
  const hucreYeni = () => new Float32Array(GX * GY);
  let olcC = null;
  function olcCtx() { if (!olcC) olcC = document.createElement('canvas').getContext('2d'); return olcC; }
  function yolHucre(yol, kural) {
    const a = new Uint8Array(GX * GY), c = olcCtx();
    for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) if (c.isPointInPath(yol, i * HS + HS / 2, j * HS + HS / 2, kural || 'nonzero')) a[j * GX + i] = 1;
    return a;
  }
  function hucreEkle(arr, x, y, r, m, maske) {
    const i0 = Math.max(0, Math.floor((x - r) / HS)), i1 = Math.min(GX - 1, Math.floor((x + r) / HS));
    const j0 = Math.max(0, Math.floor((y - r) / HS)), j1 = Math.min(GY - 1, Math.floor((y + r) / HS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const cx = i * HS + HS / 2, cy = j * HS + HS / 2, dd = uzak(cx, cy, x, y);
      if (dd > r + HS * 0.5) continue; const n = j * GX + i; if (maske && !maske[n]) continue;
      arr[n] = Math.min(9, arr[n] + m * (1 - Math.min(1, dd / (r + HS))));
    }
  }
  function kapsama(arr, maske, esik) {
    let top = 0, dolu = 0; const e = esik || 1;
    for (let n = 0; n < arr.length; n++) { if (maske && !maske[n]) continue; top++; if (arr[n] >= e) dolu++; }
    return top ? dolu / top : 1;
  }
  function agirlikliTemiz(kir, ovma) {   // kirli hücrelerin ne kadarı ovuldu
    let top = 0, t = 0;
    for (let n = 0; n < kir.length; n++) if (kir[n] > 0.05) { top += kir[n]; t += kir[n] * Math.min(1, ovma[n]); }
    return top ? t / top : 1;
  }

  /* ================================================================ tuvaller */
  function tuvalleriKur() {
    T = {
      cilt: tuval(FW, FH, RY), film: tuval(FW, FH, RD), kir: tuval(FW, FH, RD), kopuk: tuval(FW, FH, RD), isilti: tuval(FW, FH, RD),
      maske: tuval(FW, FH, RD), krem: tuval(FW, FH, RD), makyaj: tuval(FW, FH, RY), firca: tuval(FW, FH, RY),
      sacArka: tuval(SAC_W, SAC_H, RY), sacOn: tuval(SAC_W, SAC_H, RY)
    };
  }
  function tuvalleriBirak(t) { if (!t) return; Object.keys(t).forEach(k => { try { t[k].width = 1; t[k].height = 1; } catch (e) {} }); }

  /* ================================================================ cilt (bir kez çizilir; karakter değişince yeniden) */
  function ciltCiz() {
    const c = T.cilt._x, r = T.cilt._r, k = d.k, g = G, ten = k.ten, e = g.e, cx = 180;
    tuvalTemizle(T.cilt);
    const koyu = sicakKoyu(ten, 0.2), cokKoyu = sicakKoyu(ten, 0.42), acik = ton(ten, 0.22);
    // boyun + omuzlar
    const boyun = new Path2D();
    boyun.moveTo(cx - 30 * e, 290); boyun.lineTo(cx - 33 * e, 398);
    boyun.bezierCurveTo(cx - 60, 424, cx - 130, 432, cx - 168, 452); boyun.lineTo(-20, 520); boyun.lineTo(380, 520); boyun.lineTo(cx + 168, 452);
    boyun.bezierCurveTo(cx + 130, 432, cx + 60, 424, cx + 33 * e, 398); boyun.lineTo(cx + 30 * e, 290); boyun.closePath();
    let gr = c.createLinearGradient(0, 300, 0, 480); gr.addColorStop(0, sicakKoyu(ten, 0.3)); gr.addColorStop(0.35, sicakKoyu(ten, 0.08)); gr.addColorStop(1, ton(ten, 0.06));
    c.fillStyle = gr; c.fill(boyun);
    c.save(); c.clip(boyun);
    yumusakNokta(c, cx - 70, 470, 60, acik, 0.25); yumusakNokta(c, cx + 70, 470, 60, acik, 0.18);
    c.strokeStyle = rgba(cokKoyu, 0.18); c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 24, 448); c.quadraticCurveTo(cx - 60, 438, cx - 96, 442); c.moveTo(cx + 24, 448); c.quadraticCurveTo(cx + 60, 438, cx + 96, 442); c.stroke();
    c.restore();
    // kulaklar
    [-1, 1].forEach(s => {
      const kx = cx + s * 96 * e, ky = 252;
      c.save(); c.translate(kx, ky); c.rotate(s * 0.12);
      gr = c.createRadialGradient(-s * 3, -4, 2, 0, 0, 24); gr.addColorStop(0, ten); gr.addColorStop(1, koyu);
      c.fillStyle = gr; elips(c, 0, 0, 12, 23); c.fill();
      c.strokeStyle = rgba(cokKoyu, 0.35); c.lineWidth = 1.6; c.beginPath(); c.arc(s * 1, -2, 7, s > 0 ? -1.4 : Math.PI - 1.7, s > 0 ? 1.7 : Math.PI + 1.4); c.stroke();
      c.restore();
    });
    // çene altı gölgesi + yüz
    c.save(); c.shadowColor = rgba(cokKoyu, 0.55); c.shadowBlur = 22 * r; c.shadowOffsetY = 10 * r; c.fillStyle = ten; c.fill(g.yuz); c.restore();
    gr = c.createRadialGradient(cx - 18, 205, 10, cx, 232, 205); gr.addColorStop(0, acik); gr.addColorStop(0.5, ten); gr.addColorStop(1, koyu);
    c.fillStyle = gr; c.fill(g.yuz);
    c.save(); c.clip(g.yuz);
    c.save(); c.shadowColor = rgba(cokKoyu, 0.5); c.shadowBlur = 26 * r; c.strokeStyle = rgba(koyu, 0.4); c.lineWidth = 30; c.stroke(g.yuz); c.restore();
    g.gozler.forEach(o => { yumusakNokta(c, o.x, o.y - 6, 44, koyu, 0.16); yumusakNokta(c, o.x + o.s * 6, o.y + 20, 22, koyu, 0.1); });
    g.yanaklar.forEach(([x, y]) => { yumusakNokta(c, x, y, 40, '#F07F86', 0.13); yumusakNokta(c, x + (x < cx ? -14 : 14), y + 20, 34, koyu, 0.1); });
    yumusakNokta(c, cx - 10, 150, 64, '#FFFFFF', 0.16);
    yumusakNokta(c, cx, g.cene - 14, 20, '#FFFFFF', 0.13);
    // burun
    c.save(); c.translate(cx - 9, 262); c.scale(0.32, 1); yumusakNokta(c, 0, 0, 42, cokKoyu, 0.2); c.restore();
    c.save(); c.translate(cx + 9, 262); c.scale(0.3, 1); yumusakNokta(c, 0, 0, 40, cokKoyu, 0.1); c.restore();
    c.save(); c.translate(cx, 247); c.scale(0.25, 1); yumusakNokta(c, 0, 0, 34, '#FFFFFF', 0.22); c.restore();
    c.save(); c.translate(cx, 295); c.scale(1, 0.32); yumusakNokta(c, 0, 0, 22, cokKoyu, 0.34); c.restore();
    yumusakNokta(c, cx + 2, 280, 8, '#FFFFFF', 0.4);
    c.strokeStyle = rgba(cokKoyu, 0.42); c.lineWidth = 1.7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - 13, 287); c.quadraticCurveTo(cx - 10, 292, cx - 4, 291); c.moveTo(cx + 13, 287); c.quadraticCurveTo(cx + 10, 292, cx + 4, 291); c.stroke();
    c.strokeStyle = rgba(cokKoyu, 0.18); c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - 16, 281); c.quadraticCurveTo(cx - 19, 288, cx - 13, 291); c.moveTo(cx + 16, 281); c.quadraticCurveTo(cx + 19, 288, cx + 13, 291); c.stroke();
    // dudak üstü kanal + alt dudak gölgesi
    c.save(); c.translate(cx, 306); c.scale(0.35, 1); yumusakNokta(c, 0, 0, 12, cokKoyu, 0.12); c.restore();
    c.save(); c.translate(cx, g.dudak.y + 26 * g.dudak.d); c.scale(1, 0.4); yumusakNokta(c, 0, 0, 20, cokKoyu, 0.22); c.restore();
    c.restore();
    // dudaklar (taban)
    const dm = g.dudak, dt = karis(ten, '#C9606F', 0.55);
    gr = c.createLinearGradient(0, dm.y - 14, 0, dm.y + 2); gr.addColorStop(0, ton(dt, -0.04)); gr.addColorStop(1, ton(dt, -0.2));
    c.fillStyle = gr; c.fill(g.dudakYol.ust);
    gr = c.createLinearGradient(0, dm.y, 0, dm.y + 20); gr.addColorStop(0, ton(dt, -0.12)); gr.addColorStop(0.5, dt); gr.addColorStop(1, ton(dt, -0.06));
    c.fillStyle = gr; c.fill(g.dudakYol.alt);
    c.save(); c.clip(g.dudakYol.tum);
    yumusakNokta(c, dm.x - 6, dm.y + 9, 11, '#FFFFFF', 0.25);
    c.strokeStyle = rgba(sicakKoyu(dt, 0.4), 0.7); c.lineWidth = 1.4; c.beginPath(); c.moveTo(dm.x - dm.w, dm.y - 1); c.bezierCurveTo(dm.x - dm.w * 0.5, dm.y + 1.5, dm.x - dm.w * 0.2, dm.y + 1, dm.x, dm.y + 2); c.bezierCurveTo(dm.x + dm.w * 0.2, dm.y + 1, dm.x + dm.w * 0.5, dm.y + 1.5, dm.x + dm.w, dm.y - 1); c.stroke();
    c.restore();
    c.fillStyle = rgba(cokKoyu, 0.35); [-1, 1].forEach(s => { elips(c, dm.x + s * (dm.w + 1), dm.y - 1, 2, 1.4); c.fill(); });
  }

  /* ================================================================ kir, sivilce, kıl üretimi (tohumlu) */
  function kirUret() {
    const r = rng(d.k.tohum), g = G, bit = d.bitti;
    S.yuzH = yolHucre(g.yuz);
    S.dudakH = yolHucre(g.dudakHat.tum);
    S.kirH = hucreYeni(); S.ovma = hucreYeni();
    tuvalTemizle(T.kir); tuvalTemizle(T.film); tuvalTemizle(T.kopuk); tuvalTemizle(T.isilti); tuvalTemizle(T.maske); tuvalTemizle(T.krem);
    // eski makyaj: rimel akıntısı, far, ruj
    const c = T.kir._x;
    if (!bit.pamuk) {
      g.gozler.forEach(o => {
        for (let i = 0; i < 9; i++) { const x = o.x + (r() - 0.5) * 44, y = o.y + 13 + r() * 9, rr = 7 + r() * 8; yumusakNokta(c, x, y, rr, '#2A2226', 0.32); hucreEkle(S.kirH, x, y, rr * 0.7, 1); }
        for (let i = 0; i < 5; i++) { const x = o.dis[0] - o.s * 4, y = o.y + 16 + i * 5, rr = 6; yumusakNokta(c, x + (r() - 0.5) * 4, y, rr, '#2A2226', 0.28); hucreEkle(S.kirH, x, y, rr, 1); }
        for (let i = 0; i < 7; i++) { const x = o.x + (r() - 0.4) * 40, y = o.y - 16 - r() * 8, rr = 9 + r() * 6; yumusakNokta(c, x, y, rr, '#8A5A9A', 0.22); hucreEkle(S.kirH, x, y, rr * 0.7, 1); }
      });
      const m = g.dudak, yon = r() < 0.5 ? -1 : 1;
      for (let i = 0; i < 16; i++) { const t = i / 15, x = m.x + (t - 0.5) * m.w * 2.3, y = m.y + 4 + Math.sin(t * Math.PI) * 8 * (r() - 0.3), rr = 6 + r() * 6; yumusakNokta(c, x, y, rr, '#C2344F', 0.34); hucreEkle(S.kirH, x, y, rr * 0.7, 1); }
      for (let i = 0; i < 6; i++) { const x = m.x + yon * (m.w + 4 + i * 5), y = m.y + 6 + i * 2.5, rr = 5 + r() * 3; yumusakNokta(c, x, y, rr, '#C2344F', 0.3); hucreEkle(S.kirH, x, y, rr, 1); }
    }
    // donuk film + gözenek lekeleri (köpükle gider)
    if (!bit.kopuk) {
      const f = T.film._x; f.save(); f.clip(g.yuz); f.fillStyle = 'rgba(132,120,98,0.17)'; f.fillRect(0, 0, FW, FH);
      for (let i = 0; i < 160; i++) { f.fillStyle = 'rgba(120,96,80,' + (0.06 + r() * 0.1) + ')'; f.beginPath(); f.arc(90 + r() * 180, 110 + r() * 240, 0.6 + r() * 1.4, 0, Math.PI * 2); f.fill(); }
      [[180, 140], [180, 270]].forEach(([x, y]) => yumusakNokta(f, x, y, 34, '#FFF8E0', 0.14));
      f.restore();
    }
    S.kopukH = hucreYeni(); S.durulaH = hucreYeni(); S.kopukFaz = 'kopur';
    // siyah noktalar (burun)
    S.siyah = [];
    if (!bit.siyah) for (let i = 0; i < 26; i++) { const yy = 258 + r() * 34, gen = 6 + (yy - 258) * 0.38; S.siyah.push({ x: 180 + (r() - 0.5) * 2 * gen, y: yy, r: 0.7 + r() * 0.8 }); }
    S.bant = null;
    // sivilceler
    S.sivilce = [];
    if (!bit.sivilce) {
      const adaylar = [[150, 140], [205, 132], [178, 156], [112, 280], [96, 300], [250, 276], [262, 300], [236, 312], [170, 346], [196, 340], [128, 318], [228, 150]];
      const n = 3 + Math.floor(r() * 4), kul = new Set();
      while (S.sivilce.length < n) { const i = Math.floor(r() * adaylar.length); if (kul.has(i)) continue; kul.add(i); const a = adaylar[i]; S.sivilce.push({ x: a[0] + (r() - 0.5) * 10, y: a[1] + (r() - 0.5) * 8, r: 3.6 + r() * 2, d: 'var', p: 0, iz: 1, bant: 0 }); }
    }
    // kaş kılları (fazlalar)
    S.kil = [];
    if (!bit.kas) {
      g.kaslar.forEach(b => {
        const n = 5 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) { const t = 0.1 + r() * 0.75, p = kasNokta(b, t); S.kil.push({ x: p[0] + (r() - 0.5) * 4, y: p[1] + p[2] * 0.6 + 4 + r() * 7, a: -Math.PI / 2 + b.s * (0.3 + r() * 0.5), l: 4 + r() * 3, al: 0 }); }
        for (let i = 0; i < 2; i++) { const t = 0.3 + r() * 0.4, p = kasNokta(b, t); S.kil.push({ x: p[0] + (r() - 0.5) * 6, y: p[1] - p[2] - 5 - r() * 4, a: -Math.PI / 2 + b.s * 0.6, l: 3.5 + r() * 2, al: 0 }); }
      });
      for (let i = 0; i < 3; i++) S.kil.push({ x: 174 + r() * 12, y: 196 + r() * 12, a: -Math.PI / 2 + (r() - 0.5) * 0.6, l: 3.5 + r() * 2.5, al: 0 });
    }
    S.kizarik = [];
    for (let i = 0; i < 7; i++) S.kizarik.push([sec(r, [112, 248, 180, 130, 230]) + (r() - 0.5) * 20, sec(r, [282, 290, 276, 300]) + (r() - 0.5) * 16, 14 + r() * 14]);
    S.kuru = [];
    for (let i = 0; i < 14; i++) { const m = g.dudak; S.kuru.push([m.x + (r() - 0.5) * m.w * 1.6, m.y + (r() < 0.5 ? -7 : 8) + (r() - 0.5) * 5, (r() - 0.5) * 0.8]); }
    // çatlak deseni (kil maske)
    S.catlak = [];
    for (let i = 0; i < 26; i++) {
      let x = 90 + r() * 180, y = 110 + r() * 230; const yol = [[x, y]]; let a = r() * Math.PI * 2;
      for (let j = 0; j < 5; j++) { a += (r() - 0.5) * 1.3; x += Math.cos(a) * (6 + r() * 9); y += Math.sin(a) * (6 + r() * 9); yol.push([x, y]); }
      S.catlak.push(yol);
    }
    // bakımdan sonra kalanlar: yeniden açılışta ışıltıyı geri ver
    if (bit.tonik || bit.serum || bit.nem) { const s = T.isilti._x; s.save(); s.clip(g.yuz); yumusakNokta(s, 175, 220, 160, '#FFF4EE', 0.16 * ((bit.tonik ? 1 : 0) + (bit.serum ? 1 : 0) + (bit.nem ? 1 : 0))); s.restore(); }
  }

  /* ================================================================ saç */
  const SAC_X0 = -40, SAC_Y0 = -40, SAC_W = 440, SAC_H = 700;
  function sacRenkleri(s) {
    const b = s.renk, koyu = ton(b, -0.28), acik = karis(b, '#FFE9D2', parlaklik(b) > 0.6 ? 0.25 : 0.2);
    return { b, koyu, acik, cokKoyu: ton(b, -0.5), ombre: s.ombre };
  }
  function sacGradyan(c, rk, arka) {
    const g = c.createLinearGradient(0, 40, 0, 600), b = arka ? ton(rk.b, -0.16) : rk.b;
    g.addColorStop(0, ton(b, -0.18)); g.addColorStop(0.14, b); g.addColorStop(0.24, karis(b, rk.acik, 0.55)); g.addColorStop(0.34, b);
    if (rk.ombre) { g.addColorStop(0.5, b); g.addColorStop(0.72, karis(b, rk.ombre, 0.7)); g.addColorStop(1, rk.ombre); }
    else { g.addColorStop(0.7, ton(b, 0.04)); g.addColorStop(1, ton(b, -0.06)); }
    return g;
  }
  // tek tutam: kökten uca dalgalı şerit + teller
  function tutam(c, p, rk, dolgu) {
    const N = 26, sol = [], sag = [], om = [];
    const dx = Math.sin(p.a || 0), dy = Math.cos(p.a || 0), nx = dy, ny = -dx;
    for (let i = 0; i <= N; i++) {
      const t = i / N, dal = (p.dal || 0) * Math.sin(t * (p.fr || 1) * Math.PI * 2 + (p.faz || 0)) * Math.min(1, t * 2.4), bk = (p.bk || 0) * t * t;
      const ox = p.x + dx * p.L * t + nx * (dal + bk), oy = p.y + dy * p.L * t + ny * (dal + bk);
      let w = lerp(p.w0, p.w1, t);
      if (!p.kut && t > 0.78) w *= Math.pow(Math.cos((t - 0.78) / 0.22 * Math.PI / 2), 0.7);
      if (p.kiv) w += Math.sin(t * 34 + (p.faz || 0) * 3) * p.kiv * 2.6;
      w = Math.max(0.3, w);
      om.push([ox, oy, w]); sol.push([ox - nx * w, oy - ny * w]); sag.push([ox + nx * w, oy + ny * w]);
    }
    c.beginPath(); egri(c, sol.concat(sag.reverse()), true); c.fillStyle = dolgu; c.fill();
    const n = p.tel == null ? 7 : p.tel;
    c.lineCap = 'round';
    for (let kk = 0; kk < n; kk++) {
      const o = -0.82 + 1.64 * (kk + 0.5) / n, ac = kk % 3 === 1;
      c.beginPath(); egri(c, om.slice(0, Math.round(N * (0.7 + 0.3 * ((kk * 7) % 5) / 4)) + 1).map(q => [q[0] + nx * q[2] * o, q[1] + ny * q[2] * o]), false);
      c.strokeStyle = ac ? rgba(rk.acik, 0.34) : rgba(rk.cokKoyu, 0.22); c.lineWidth = ac ? 1 : 1.3; c.stroke();
    }
    return om;
  }
  function orguCiz(c, x0, y0, x1, y1, w, rk, dolgu) {
    const n = 13, a = Math.atan2(y1 - y0, x1 - x0);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = lerp(x0, x1, t), y = lerp(y0, y1, t), ww = w * (1 - t * 0.35), yan = (i % 2 ? 1 : -1) * ww * 0.28;
      const px = x + Math.cos(a + Math.PI / 2) * yan, py = y + Math.sin(a + Math.PI / 2) * yan;
      c.save(); c.translate(px, py); c.rotate(a - Math.PI / 2 + (i % 2 ? 0.5 : -0.5));
      elips(c, 0, 0, ww * 0.62, ww * 0.95); c.fillStyle = dolgu; c.fill();
      c.strokeStyle = rgba(rk.cokKoyu, 0.45); c.lineWidth = 1.4; c.stroke();
      c.strokeStyle = rgba(rk.acik, 0.4); c.lineWidth = 1; c.beginPath(); c.ellipse(-ww * 0.1, -ww * 0.2, ww * 0.35, ww * 0.6, 0, -2.2, -0.6); c.stroke();
      c.restore();
    }
    c.fillStyle = rgba(rk.cokKoyu, 0.9); elips(c, x1, y1 + 4, w * 0.36, 4); c.fill();
    tutam(c, { x: x1, y: y1 + 6, L: 34, a: 0, w0: w * 0.32, w1: w * 0.42, dal: 2, fr: 1.4, tel: 4 }, rk, dolgu);
  }
  function kafaCiz(c, g, rk, dolgu, ayr, hacim) {
    const e = g.e, cx = 180, h = hacim || 0, px = cx + ayr;
    const p = new Path2D();
    p.moveTo(cx - (104 + h) * e, 262);
    p.bezierCurveTo(cx - (116 + h) * e, 170, cx - (100 + h) * e, 40 - h, cx, 36 - h);
    p.bezierCurveTo(cx + (100 + h) * e, 40 - h, cx + (116 + h) * e, 170, cx + (104 + h) * e, 262);
    p.lineTo(cx + 95 * e, 258); p.bezierCurveTo(cx + 96 * e, 205, cx + 92 * e, 150, cx + 70 * e, 122);
    p.bezierCurveTo(cx + 46 * e, 102, px + 18, 100, px, 104);
    p.bezierCurveTo(px - 18, 100, cx - 46 * e, 102, cx - 70 * e, 122);
    p.bezierCurveTo(cx - 92 * e, 150, cx - 96 * e, 205, cx - 95 * e, 258); p.closePath();
    c.fillStyle = dolgu; c.fill(p);
    c.save(); c.clip(p);
    c.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const t = i / 45, sol = t < 0.5, u = sol ? t * 2 : (t - 0.5) * 2;
      const hx = sol ? lerp(cx - 100 * e, px - 6, u) : lerp(px + 6, cx + 100 * e, u), hy = sol ? lerp(262, 112, Math.pow(u, 0.6)) : lerp(112, 262, Math.pow(u, 1.6));
      c.beginPath(); c.moveTo(px + (sol ? -2 : 2), 60 - h * 0.6); c.quadraticCurveTo(lerp(px, hx, 0.75), lerp(70, hy, 0.3), hx, hy);
      c.strokeStyle = i % 3 ? rgba(rk.cokKoyu, 0.2) : rgba(rk.acik, 0.3); c.lineWidth = i % 3 ? 1.4 : 1; c.stroke();
    }
    for (let i = 0; i < 16; i++) { const rr = 104 + i * 1.6 + h, a0 = -Math.PI / 2 - 0.75 + (i % 4) * 0.06, a1 = -Math.PI / 2 + 0.35 - (i % 3) * 0.08;
      c.strokeStyle = rgba(rk.acik, 0.1 + (i % 5) * 0.035); c.lineWidth = 1; c.beginPath(); c.ellipse(cx, 196, rr * e, rr * 1.32, 0, a0, a1); c.stroke(); }
    c.strokeStyle = rgba(rk.cokKoyu, 0.5); c.lineWidth = 1.6; c.beginPath(); c.moveTo(px, 104); c.lineTo(px + (ayr ? 2 : 0), 56 - h * 0.5); c.stroke();
    c.restore();
    c.strokeStyle = rgba(rk.cokKoyu, 0.25); c.lineWidth = 1; c.stroke(p);
  }
  function sacCiz(bantli) {
    const k = d.k, s = k.sac, g = G, e = g.e, cx = 180, rk = sacRenkleri(s);
    const A = T.sacArka._x, O = T.sacOn._x; tuvalTemizle(T.sacArka); tuvalTemizle(T.sacOn);
    [A, O].forEach(c => { c.save(); c.translate(-SAC_X0, -SAC_Y0); });
    const dA = sacGradyan(A, rk, true), dO = sacGradyan(O, rk, false);
    const r = rng(k.tohum + 7), m = s.model;
    const uzun = { dalgali: 440, duz: 430, kivircik: 360, kakul: 430, yarim: 440, perde: 420, lob: 300, bob: 230 }[m] || 0;
    const dalga = { dalgali: [9, 2.1], duz: [0.6, 1], kivircik: [6, 5], kakul: [0.8, 1], yarim: [9, 2.1], perde: [5, 1.6], lob: [6, 1.8], bob: [1, 1] }[m] || [1, 1];
    const kiv = m === 'kivircik' ? 1 : 0, hacim = m === 'kivircik' ? 14 : 0;
    const ayr = { dalgali: -20, duz: 0, kivircik: -6, kakul: 0, yarim: -16, perde: 0, lob: 18, bob: -22, atkuyrugu: 0, topuz: 0, orgu: -14, ikiorgu: 0 }[m] || 0;
    // --- arka katman
    if (uzun) {
      const genis = m === 'bob' ? 64 : m === 'kivircik' ? 78 : 56;
      [-1, 1].forEach(sx => tutam(A, { x: cx + sx * 62 * e, y: 120, L: uzun, a: sx * (m === 'bob' ? 0.2 : 0.1), w0: genis, w1: m === 'bob' ? genis - 4 : genis - 8, dal: dalga[0], fr: dalga[1], faz: sx * 1.3, kiv, kut: m === 'bob', tel: 9 }, rk, dA));
      tutam(A, { x: cx, y: 140, L: uzun - 10, a: 0, w0: 70, w1: 62, dal: dalga[0] * 0.6, fr: dalga[1], faz: 2, kiv, kut: m === 'bob', tel: 9 }, rk, dA);
      if (m === 'kivircik') for (let i = 0; i < 18; i++) { const sx = r() < 0.5 ? -1 : 1; A.fillStyle = dA; elips(A, cx + sx * (70 + r() * 70), 160 + r() * 230, 16 + r() * 10, 16 + r() * 10); A.fill(); }
    } else {
      tutam(A, { x: cx, y: 150, L: 170, a: 0, w0: 76, w1: 40, dal: 0, fr: 1, tel: 6 }, rk, dA);
    }
    if (m === 'atkuyrugu') {
      tutam(A, { x: cx + 40, y: 74, L: 330, a: 0.32, w0: 20, w1: 14, dal: 7, fr: 2, bk: -40, faz: 0.5, tel: 9 }, rk, dA);
      tutam(A, { x: cx + 34, y: 78, L: 300, a: 0.18, w0: 16, w1: 10, dal: 6, fr: 2.3, bk: -30, faz: 2.1, tel: 6 }, rk, dO);
    }
    if (m === 'yarim') { A.fillStyle = dA; elips(A, cx, 54, 26, 20); A.fill(); }
    // --- ön katman: kafa, yan tutamlar, kâkül
    kafaCiz(O, g, rk, dO, ayr, hacim);
    if (m === 'topuz') {
      O.save(); O.fillStyle = dO; elips(O, cx, 34, 44, 38); O.fill(); O.clip();
      for (let i = 0; i < 9; i++) { O.strokeStyle = i % 2 ? rgba(rk.acik, 0.35) : rgba(rk.cokKoyu, 0.3); O.lineWidth = 1.4; O.beginPath(); O.ellipse(cx, 34, 40 - i * 4, 34 - i * 3.4, 0.3 * i, 0, Math.PI * 1.6); O.stroke(); }
      O.restore();
      O.fillStyle = rgba(rk.cokKoyu, 0.4); elips(O, cx, 70, 30, 6); O.fill();
    }
    if (m === 'atkuyrugu') { O.fillStyle = '#2B2530'; elips(O, cx + 42, 76, 9, 6, 0.4); O.fill(); }
    if (uzun && m !== 'bob') {
      [-1, 1].forEach(sx => {
        const L = Math.max(150, uzun - 150);
        tutam(O, { x: cx + sx * 94 * e, y: 168, L, a: sx * 0.2, w0: 20, w1: 26, dal: dalga[0], fr: dalga[1] * 0.85, faz: sx * 2, kiv, tel: 6, bk: sx * -6 }, rk, dO);
        tutam(O, { x: cx + sx * 84 * e, y: 150, L: L - 30, a: sx * 0.1, w0: 12, w1: 15, dal: dalga[0] * 0.8, fr: dalga[1], faz: sx * 0.7 + 1, kiv, tel: 4 }, rk, dO);
      });
    }
    if (m === 'bob') [-1, 1].forEach(sx => tutam(O, { x: cx + sx * 92 * e, y: 140, L: 200, a: sx * 0.06, w0: 22, w1: 26, dal: 0.8, fr: 1, bk: -sx * 10, kut: true, tel: 6 }, rk, dO));
    if (m === 'orgu') { tutam(A, { x: cx, y: 150, L: 130, a: 0, w0: 80, w1: 50, tel: 5 }, rk, dA); orguCiz(O, cx - 88 * e, 236, cx - 64, 470, 30, rk, dO); }
    if (m === 'ikiorgu') [-1, 1].forEach(sx => orguCiz(O, cx + sx * 90 * e, 236, cx + sx * 76, 440, 26, rk, dO));
    if (['atkuyrugu', 'topuz', 'orgu', 'ikiorgu'].includes(m)) [-1, 1].forEach(sx => tutam(O, { x: cx + sx * 86 * e, y: 150, L: 120, a: sx * 0.08, w0: 3, w1: 2, dal: 4, fr: 1.6, faz: sx, tel: 1 }, rk, dO));
    if (!bantli && (m === 'kakul')) {
      for (let i = 0; i < 13; i++) { const t = i / 12, x = lerp(cx - 88 * e, cx + 88 * e, t), yy = 96 + Math.pow(Math.abs(t - 0.5) * 2, 2) * 46; tutam(O, { x, y: yy - 6, L: 74 - Math.abs(t - 0.5) * 40, a: (t - 0.5) * 0.5, w0: 10, w1: 4, dal: 1, fr: 0.6, faz: i, tel: 2 }, rk, dO); }
    }
    if (!bantli && (m === 'perde' || m === 'kivircik')) {
      [-1, 1].forEach(sx => tutam(O, { x: cx + sx * 8, y: 100, L: 112, a: sx * 0.5, w0: 14, w1: 10, dal: 1.5, fr: 0.5, bk: sx * 16, tel: 4, kiv: kiv * 0.6 }, rk, dO));
    }
    [A, O].forEach(c => c.restore());
  }
  function sacAksCiz(c, aks, model, olcek) {
    if (!aks || aks.tip === 'yok') return;
    const r = aks.renk, cx = 180;
    c.save();
    const parla = (x, y, rr) => yumusakNokta(c, x, y, rr, '#FFFFFF', 0.7);
    if (aks.tip === 'toka') {
      c.translate(236, 116); c.rotate(-0.5); c.fillStyle = kumas(c, r, -16, 16, 0.6); dik(c, -18, -4, 36, 8, 4); c.fill(); parla(-6, -1, 5);
      c.strokeStyle = rgba(ton(r, -0.4), 0.5); c.lineWidth = 0.8; c.stroke();
    } else if (aks.tip === 'tac') {
      c.translate(cx, model === 'topuz' ? 72 : 76);
      c.fillStyle = r; c.strokeStyle = ton(r, -0.35); c.lineWidth = 1;
      c.beginPath(); c.moveTo(-62, 22); c.quadraticCurveTo(0, -8, 62, 22); c.lineTo(58, 26); c.quadraticCurveTo(0, -2, -58, 26); c.closePath(); c.fill(); c.stroke();
      for (let i = -3; i <= 3; i++) { const x = i * 17, y = 6 + Math.abs(i) * 3.5, h = 16 - Math.abs(i) * 3; c.beginPath(); c.moveTo(x - 6, y + 4); c.lineTo(x, y - h); c.lineTo(x + 6, y + 4); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = i ? '#BFE7FF' : '#FF9AD0'; c.beginPath(); c.arc(x, y - h + 4, i ? 2.2 : 3.4, 0, Math.PI * 2); c.fill(); parla(x - 1, y - h + 3, 2.2); c.fillStyle = r; }
    } else if (aks.tip === 'fiyonk') {
      const bx = model === 'topuz' ? 180 : model === 'atkuyrugu' ? 222 : 232, by = model === 'topuz' ? 70 : model === 'atkuyrugu' ? 76 : 92;
      c.translate(bx, by); c.rotate(0.12);
      [-1, 1].forEach(sx => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(sx * 18, -22, sx * 40, -14, sx * 36, 4); c.bezierCurveTo(sx * 32, 18, sx * 14, 10, 0, 0); c.fillStyle = kumas(c, r, -36, 36, 0.8); c.fill();
        c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(sx * 10, 20, sx * 14, 34); c.lineTo(sx * 6, 34); c.quadraticCurveTo(sx * 4, 18, 0, 4); c.fill(); });
      c.fillStyle = ton(r, -0.15); elips(c, 0, 1, 6, 7); c.fill(); parla(-14, -8, 6); parla(14, -8, 5);
    } else if (aks.tip === 'cicek') {
      c.translate(124, 118);
      for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * Math.PI / 3); c.fillStyle = kumas(c, r, -6, 6, 0.4); elips(c, 0, -9, 6, 10); c.fill(); c.restore(); }
      c.fillStyle = '#F5C542'; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill(); parla(-2, -2, 3);
    } else if (aks.tip === 'inci') {
      [[128, 120], [140, 108], [154, 100]].forEach(([x, y], i) => { const g2 = c.createRadialGradient(x - 2, y - 2, 0.5, x, y, 6); g2.addColorStop(0, '#FFFFFF'); g2.addColorStop(1, ton(r, -0.12)); c.fillStyle = g2; c.beginPath(); c.arc(x, y, 5.2 - i * 0.4, 0, Math.PI * 2); c.fill(); });
    } else if (aks.tip === 'bant') {
      c.strokeStyle = kumas(c, r, 70, 290, 0.6); c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(82, 170); c.bezierCurveTo(96, 70, 264, 70, 278, 170); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(96, 140); c.bezierCurveTo(116, 84, 210, 74, 244, 100); c.stroke();
    } else if (aks.tip === 'kelebek') {
      [[118, 140, -0.4], [238, 118, 0.4], [252, 146, 0.6]].forEach(([x, y, a]) => { c.save(); c.translate(x, y); c.rotate(a);
        [-1, 1].forEach(sx => { c.fillStyle = rgba(r, 0.92); elips(c, sx * 6, -3, 6, 7, sx * 0.4); c.fill(); elips(c, sx * 5, 5, 4, 4.5); c.fill(); });
        c.fillStyle = ton(r, -0.4); elips(c, 0, 0, 1.4, 6); c.fill(); parla(-5, -4, 3); c.restore(); });
    }
    c.restore();
  }

  /* ================================================================ yüz çizimi (her kare) */
  function dik(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function kasRengi() { const h = d.k.sac.renk; return parlaklik(h) > 0.55 || /^#(E5|A5|79|CF)/i.test(h) ? karis(h, '#5A4030', 0.6) : karis(h, '#1E1512', 0.35); }
  function kasTelleriUret() {
    const r = rng(d.k.tohum + 3); S.kasTel = [];
    G.kaslar.forEach(b => {
      for (let i = 0; i < 58; i++) {
        const t = Math.pow(r(), 0.9), p = kasNokta(b, t), o = (r() - 0.5) * p[2] * 1.5;
        const a = t < 0.18 ? -Math.PI / 2 + b.s * 0.25 : -Math.PI / 2 + b.s * (0.95 + t * 0.55);
        S.kasTel.push({ s: b.s, x: p[0], y: p[1] + o, a: a + (r() - 0.5) * 0.25, l: 5 + r() * 4 * (1 - t * 0.5), t });
      }
    });
  }
  function kaslarCiz(c) {
    const renk = kasRengi(), jel = d.mk.kasJel || 0;
    c.save(); c.lineCap = 'round';
    c.fillStyle = rgba(renk, 0.34);
    G.kaslar.forEach(b => { c.beginPath(); for (let i = 0; i <= 20; i++) { const p = kasNokta(b, i / 20); i ? c.lineTo(p[0], p[1] - p[2] * 0.45) : c.moveTo(p[0], p[1] - p[2] * 0.45); } for (let i = 20; i >= 0; i--) { const p = kasNokta(b, i / 20); c.lineTo(p[0], p[1] + p[2] * 0.45); } c.closePath(); c.fill(); });
    for (const h of S.kasTel) {
      const a = lerp(h.a, -Math.PI / 2 + h.s * (0.2 + h.t * 0.6), jel * 0.65), l = h.l * (1 + jel * 0.15);
      c.strokeStyle = rgba(renk, 0.3 + (1 - h.t) * 0.15); c.lineWidth = 0.85;
      c.beginPath(); c.moveTo(h.x - Math.cos(a) * l * 0.4, h.y - Math.sin(a) * l * 0.4); c.lineTo(h.x + Math.cos(a) * l * 0.6, h.y + Math.sin(a) * l * 0.6); c.stroke();
    }
    if (jel > 0.3) G.kaslar.forEach(b => { const p = kasNokta(b, 0.4); yumusakNokta(c, p[0], p[1] - 1, 7, '#FFFFFF', 0.18 * jel); });
    for (const h of S.kil) {
      if (h.al >= 1) continue;
      const kalk = h.al > 0 ? h.al : 0;
      c.strokeStyle = rgba(renk, 0.85 * (1 - kalk)); c.lineWidth = 1.1;
      const ox = 0, oy = -kalk * 26;
      c.beginPath(); c.moveTo(h.x + ox, h.y + oy); c.lineTo(h.x + ox + Math.cos(h.a) * h.l, h.y + oy + Math.sin(h.a) * h.l); c.stroke();
    }
    c.restore();
  }
  function gozCiz(c, o, acik) {
    const k = d.k, mk = d.mk, s = o.s, renk = k.goz;
    if (acik < 0.16) {   // kapalı göz: alçak yay + aşağı kirpik
      c.save(); c.strokeStyle = '#2A1C1E'; c.lineWidth = 2.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(o.ic[0], o.ic[1]); c.quadraticCurveTo(o.x, o.y + 9, o.dis[0], o.dis[1] + 1); c.stroke();
      c.lineWidth = 1.3; for (let i = 0; i < 7; i++) { const t = 0.35 + i * 0.1, x = lerp(o.ic[0], o.dis[0], t), y = lerp(o.ic[1], o.dis[1], t) + Math.sin(t * Math.PI) * 4.5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 2, y + 5, x + s * 4, y + 6 + (mk.rimel || 0) * 4); c.stroke(); }
      linerCiz(c, o, 0.12); c.restore(); return;
    }
    const yol = gozYolu(o, acik);
    c.save(); c.clip(yol);
    let gr = c.createLinearGradient(0, o.y - o.H * 0.6, 0, o.y + o.H * 0.5); gr.addColorStop(0, '#D8CACC'); gr.addColorStop(0.35, '#FAF6F4'); gr.addColorStop(1, '#EEE6E6');
    c.fillStyle = gr; c.fillRect(o.x - o.W, o.y - o.H, o.W * 2, o.H * 2);
    yumusakNokta(c, o.ic[0] + s * 4, o.ic[1], 7, '#E8A0A6', 0.5);
    const ir = o.H * 0.56, ix = o.x + s * 1 + S.bak.x * 4, iy = o.y + 1 + S.bak.y * 2.5;
    gr = c.createRadialGradient(ix, iy + ir * 0.35, ir * 0.1, ix, iy, ir); gr.addColorStop(0, ton(renk, 0.45)); gr.addColorStop(0.55, renk); gr.addColorStop(0.9, ton(renk, -0.45)); gr.addColorStop(1, ton(renk, -0.7));
    c.fillStyle = gr; c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(ton(renk, 0.4), 0.25); c.lineWidth = 0.7;
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; c.beginPath(); c.moveTo(ix + Math.cos(a) * ir * 0.42, iy + Math.sin(a) * ir * 0.42); c.lineTo(ix + Math.cos(a) * ir * 0.86, iy + Math.sin(a) * ir * 0.86); c.stroke(); }
    c.fillStyle = '#0E0A0B'; c.beginPath(); c.arc(ix, iy, ir * 0.42, 0, Math.PI * 2); c.fill();
    gr = c.createLinearGradient(0, o.y - o.H * 0.7, 0, o.y); gr.addColorStop(0, 'rgba(40,20,24,0.55)'); gr.addColorStop(1, 'rgba(40,20,24,0)');
    c.fillStyle = gr; c.fillRect(o.x - o.W, o.y - o.H, o.W * 2, o.H);
    c.fillStyle = 'rgba(255,255,255,0.95)'; elips(c, ix - ir * 0.34, iy - ir * 0.36, ir * 0.27, ir * 0.24); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(ix + ir * 0.36, iy + ir * 0.32, ir * 0.11, 0, Math.PI * 2); c.fill();
    c.restore();
    // üst kapak çizgisi (doğal kirpik dibi)
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#2A1C1E';
    for (let i = 0; i < 12; i++) { const p0 = ustKapakNokta(o, acik, i / 12), p1 = ustKapakNokta(o, acik, (i + 1) / 12); c.lineWidth = 1.6 + Math.pow((i + 1) / 12, 1.3) * 2.6; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
    c.strokeStyle = 'rgba(60,40,44,0.3)'; c.lineWidth = 1; c.beginPath();
    for (let i = 3; i <= 12; i++) { const p = altKapakNokta(o, acik, i / 12); i === 3 ? c.moveTo(p[0], p[1] + 1) : c.lineTo(p[0], p[1] + 1); } c.stroke();
    // kapak kıvrımı
    const tenK = sicakKoyu(k.ten, 0.35);
    c.strokeStyle = rgba(tenK, 0.35); c.lineWidth = 1.3; c.beginPath();
    for (let i = 1; i <= 11; i++) { const p = ustKapakNokta(o, 1, i / 12); const y = p[1] - 9 - Math.sin(i / 12 * Math.PI) * 3; i === 1 ? c.moveTo(p[0], y) : c.lineTo(p[0], y); } c.stroke();
    linerCiz(c, o, acik);
    kirpikCiz(c, o, acik);
    c.restore();
  }
  function linerCiz(c, o, acik) {
    const L = d.mk.liner; if (!L || L.tip === 'yok') return;
    const s = o.s, ilr = L.ilerleme[s < 0 ? 0 : 1] || 0; if (ilr <= 0.01) return;
    const renk = L.renk, kal = { ince: 1.6, kanat: 2.6, kedi: 3.6, grafik: 1.8, duman: 3 }[L.tip] || 2;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    if (L.tip === 'duman') {
      for (let pass = 0; pass < 3; pass++) { c.strokeStyle = rgba(renk, 0.18); c.lineWidth = 8 - pass * 2; c.beginPath(); for (let i = 0; i <= 20 * ilr; i++) { const p = ustKapakNokta(o, acik, i / 20); i ? c.lineTo(p[0], p[1] - 1) : c.moveTo(p[0], p[1] - 1); } c.stroke(); }
      c.strokeStyle = rgba(renk, 0.25); c.lineWidth = 3; c.beginPath(); for (let i = 6; i <= 20 * ilr; i++) { const p = altKapakNokta(o, acik, i / 20); i === 6 ? c.moveTo(p[0], p[1] + 1.5) : c.lineTo(p[0], p[1] + 1.5); } c.stroke();
      c.restore(); return;
    }
    c.fillStyle = renk; c.strokeStyle = renk;
    const n = 24, ust = [], alt = [];
    for (let i = 0; i <= n * ilr; i++) { const t = i / n, p = ustKapakNokta(o, acik, t), w = kal * (0.35 + t * 0.9); ust.push([p[0], p[1] - w]); alt.push([p[0], p[1] + 0.6]); }
    if (ust.length > 1) { c.beginPath(); c.moveTo(alt[0][0], alt[0][1]); ust.forEach(p => c.lineTo(p[0], p[1])); for (let i = alt.length - 1; i >= 0; i--) c.lineTo(alt[i][0], alt[i][1]); c.closePath(); c.fill(); }
    if (ilr > 0.92 && L.tip !== 'ince') {
      const u = (ilr - 0.92) / 0.08, ds = o.dis, uz = { kanat: 13, kedi: 20, grafik: 12 }[L.tip] || 12, yk = { kanat: 8, kedi: 13, grafik: 7 }[L.tip] || 8;
      const ux = ds[0] + s * uz * u, uy = ds[1] - yk * u, p = ustKapakNokta(o, acik, 0.8);
      c.beginPath(); c.moveTo(p[0], p[1] - kal); c.quadraticCurveTo(ds[0] + s * 3, ds[1] - kal * 1.4, ux, uy); c.quadraticCurveTo(ds[0] + s * 1, ds[1] + 1, p[0], p[1] + 0.6); c.closePath(); c.fill();
      if (L.tip === 'kedi') { c.beginPath(); c.moveTo(o.ic[0], o.ic[1]); c.lineTo(o.ic[0] - s * 5, o.ic[1] + 2); c.lineTo(o.ic[0] + s * 4, o.ic[1] - 1.5); c.closePath(); c.fill(); }
      if (L.tip === 'grafik') { c.lineWidth = 1.8; c.beginPath(); for (let i = 3; i <= 12; i++) { const q = ustKapakNokta(o, 1, i / 12); const y = q[1] - 12 - Math.sin(i / 12 * Math.PI) * 4; i === 3 ? c.moveTo(q[0], y) : c.lineTo(q[0], y); } c.lineTo(ux + s * 2, uy - 2); c.stroke(); }
    }
    c.restore();
  }
  function kirpikCiz(c, o, acik) {
    const mk = d.mk, s = o.s, rm = mk.rimel || 0, tip = mk.kirpik || 'yok', renk = rm > 0.05 ? mk.rimelRenk : '#2A1C1E';
    const ek = { yok: 0, dogal: 2.5, yogun: 4.5, kedi: 3, tuy: 4, alt: 3 }[tip];
    const n = { yok: 8, dogal: 13, yogun: 20, kedi: 15, tuy: 16, alt: 13 }[tip];
    c.strokeStyle = renk; c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const t = 0.28 + 0.72 * (i / (n - 1)), p = ustKapakNokta(o, acik, t), q = ustKapakNokta(o, acik, Math.min(1, t + 0.02));
      let L = (4.2 + t * 6.5) * (1 + rm * 0.9) + ek * (tip === 'kedi' ? t * t * 2.2 : 1);
      if (tip === 'tuy') L *= (i % 3 === 0 ? 1.35 : 0.8);
      const ta = Math.atan2(q[1] - p[1], q[0] - p[0]), na = ta - s * Math.PI / 2;  // dışa-yukarı
      const a = na + s * (0.25 + t * 0.35);
      c.lineWidth = 1 + rm * 0.7 + (tip === 'yogun' ? 0.4 : 0);
      c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[0] + Math.cos(a) * L * 0.6, p[1] + Math.sin(a) * L * 0.6 - 1, p[0] + Math.cos(a + s * 0.45) * L, p[1] + Math.sin(a + s * 0.45) * L); c.stroke();
    }
    const an = tip === 'alt' ? 8 : 5;
    c.lineWidth = tip === 'alt' ? 1.1 : 0.8; c.strokeStyle = rgba(renk, tip === 'alt' ? 0.9 : 0.5);
    for (let i = 0; i < an; i++) { const t = 0.45 + 0.5 * i / (an - 1), p = altKapakNokta(o, acik, t), L = (tip === 'alt' ? 5 : 2.5) + rm * 1.5; c.beginPath(); c.moveTo(p[0], p[1] + 1); c.lineTo(p[0] + s * 1.2, p[1] + 1 + L); c.stroke(); }
  }
  function sivilceCiz(c) {
    for (const p of S.sivilce) {
      if (p.d === 'temiz') continue;
      if (p.d === 'iz') { yumusakNokta(c, p.x, p.y, p.r * 2.2, '#E9858C', 0.34 * p.iz); continue; }
      yumusakNokta(c, p.x, p.y, p.r * 2.8, '#E2626A', 0.32);
      const g = c.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.4, 0.3, p.x, p.y, p.r);
      g.addColorStop(0, '#F7B3AE'); g.addColorStop(0.6, '#E77F81'); g.addColorStop(1, 'rgba(214,96,104,0.2)');
      c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + p.p * 0.2), 0, Math.PI * 2); c.fill();
      if (p.p > 0) { const g2 = c.createRadialGradient(p.x, p.y - 0.5, 0, p.x, p.y, p.r * 0.6 * p.p + 0.4); g2.addColorStop(0, '#FFFDF2'); g2.addColorStop(1, 'rgba(255,248,226,0.1)'); c.fillStyle = g2; c.beginPath(); c.arc(p.x, p.y - 0.5, p.r * 0.6 * p.p + 0.4, 0, Math.PI * 2); c.fill(); }
      yumusakNokta(c, p.x - p.r * 0.35, p.y - p.r * 0.45, p.r * 0.4, '#FFFFFF', 0.6);
      if (p.bant > 0) {
        c.save(); c.globalAlpha = Math.min(1, p.bant * 3);
        c.fillStyle = 'rgba(244,226,210,0.72)'; c.beginPath(); c.arc(p.x, p.y, 9, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(200,170,150,0.7)'; c.lineWidth = 0.8; c.stroke();
        if (p.bant > 0.5) yumusakNokta(c, p.x, p.y, 4.2, '#FFFFFF', Math.min(0.85, (p.bant - 0.5) * 2));
        yumusakNokta(c, p.x - 3, p.y - 4, 3, '#FFFFFF', 0.6);
        c.restore();
      }
    }
  }
  function bantYolu(b) {
    const p = new Path2D(), cx = 180, cy = 272;
    p.moveTo(cx - 12, cy - 16); p.quadraticCurveTo(cx, cy - 20, cx + 12, cy - 16); p.quadraticCurveTo(cx + 34, cy - 18, cx + 32, cy + 4); p.quadraticCurveTo(cx + 30, cy + 20, cx + 12, cy + 14);
    p.quadraticCurveTo(cx, cy + 18, cx - 12, cy + 14); p.quadraticCurveTo(cx - 30, cy + 20, cx - 32, cy + 4); p.quadraticCurveTo(cx - 34, cy - 18, cx - 12, cy - 16); p.closePath();
    return p;
  }
  function siyahNoktaCiz(c) {
    const b = S.bant, kalk = b && b.faz === 'cek' ? b.cek : 0;
    c.fillStyle = 'rgba(40,30,30,' + (0.62 * (1 - kalk)) + ')';
    for (const n of S.siyah) { c.beginPath(); c.arc(n.x, n.y, n.r, 0, Math.PI * 2); c.fill(); }
    if (!b) return;
    c.save();
    if (b.faz === 'cek') { c.translate(180 - 32, 272 + 16); c.rotate(-b.cek * 0.9 * b.yon); c.translate(-(180 - 32) + b.dx * b.cek * 0.4, -(272 + 16) + b.dy * b.cek * 0.4); }
    const yol = bantYolu(b);
    c.globalAlpha = b.gir;
    c.fillStyle = b.faz === 'cek' ? 'rgba(250,246,240,0.96)' : 'rgba(248,242,236,' + (0.92 - b.p * 0.3) + ')'; c.fill(yol);
    c.strokeStyle = 'rgba(190,170,160,0.7)'; c.lineWidth = 1; c.stroke(yol);
    c.save(); c.clip(yol); c.fillStyle = 'rgba(210,190,180,0.25)'; for (let i = 0; i < 9; i++) c.fillRect(140 + i * 9, 250, 1, 46); c.restore();
    if (b.faz === 'cek') { c.fillStyle = 'rgba(40,30,30,0.7)'; for (const n of S.siyah) { c.beginPath(); c.arc(n.x, n.y, n.r * 1.1, 0, Math.PI * 2); c.fill(); } }
    else if (b.p < 1) { c.fillStyle = 'rgba(150,130,120,0.55)'; c.font = '600 7px sans-serif'; c.textAlign = 'center'; c.fillText(Math.round(b.p * 100) + '%', 180, 300); }
    c.restore();
  }
  function bornozCiz(c, renk) {
    const r = renk || '#F6D8E2';
    c.save();
    [-1, 1].forEach(s => {
      const p = new Path2D(); p.moveTo(180 + s * 6, 486); p.lineTo(180 - s * 28, 410); p.quadraticCurveTo(180 - s * 8, 396, 180 + s * 40, 398);
      p.quadraticCurveTo(180 + s * 120, 404, 180 + s * 196, 450); p.lineTo(180 + s * 200, 500); p.closePath();
      c.fillStyle = kumas(c, r, s < 0 ? 0 : 360, s < 0 ? 360 : 0, 0.5); c.fill(p);
      c.save(); c.clip(p); c.strokeStyle = rgba(ton(r, -0.2), 0.25); c.lineWidth = 1;
      for (let i = 0; i < 26; i++) { c.beginPath(); c.moveTo(i * 15 - 10, 395); c.lineTo(i * 15 + 30, 490); c.moveTo(i * 15 + 30, 395); c.lineTo(i * 15 - 10, 490); c.stroke(); }
      c.restore();
      c.strokeStyle = ton(r, -0.15); c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(180 + s * 6, 486); c.lineTo(180 - s * 24, 412); c.quadraticCurveTo(180 - s * 6, 400, 180 + s * 40, 401); c.stroke();
      c.strokeStyle = rgba('#FFFFFF', 0.35); c.lineWidth = 3; c.stroke();
    });
    c.restore();
  }
  function spaBandiCiz(c) {
    const e = G.e;
    c.save(); c.lineCap = 'round';
    const yol = () => { c.beginPath(); c.moveTo(180 - 104 * e, 196); c.bezierCurveTo(180 - 98 * e, 98, 180 + 98 * e, 98, 180 + 104 * e, 196); };
    yol(); c.strokeStyle = '#F2A9C0'; c.lineWidth = 26; c.stroke();
    yol(); c.strokeStyle = '#F8C6D6'; c.lineWidth = 19; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 40; i++) { const t = i / 39, x = lerp(180 - 100 * e, 180 + 100 * e, t), y = 196 - Math.sin(t * Math.PI) * 74 + ((i * 7) % 5 - 2) * 2.5; c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); }
    c.translate(180 + 46 * e, 112); c.rotate(0.3);
    [-1, 1].forEach(s => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(s * 14, -18, s * 32, -10, s * 28, 4); c.bezierCurveTo(s * 24, 16, s * 10, 8, 0, 0); c.fillStyle = '#F5B3C8'; c.fill(); c.strokeStyle = 'rgba(220,130,160,0.6)'; c.lineWidth = 1; c.stroke(); });
    c.fillStyle = '#EE9AB4'; elips(c, 0, 1, 5, 6); c.fill();
    c.restore();
  }
  function susCiz(c, s) {
    const parla = (x, y, r) => yumusakNokta(c, x, y, r, '#FFFFFF', 0.85);
    c.save(); c.translate(s.x, s.y);
    if (s.t === 'tas') {
      c.fillStyle = s.renk; yildizYol(c, 0, 0, 4.6, 3.3, 8, 0); c.fill();
      const g = c.createLinearGradient(-4, -4, 4, 4); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, rgba(s.renk, 0.2)); g.addColorStop(1, 'rgba(255,255,255,0.6)');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -3.5); c.lineTo(3.5, 0); c.lineTo(0, 3.5); c.lineTo(-3.5, 0); c.closePath(); c.fill(); parla(-1.5, -1.5, 2);
    } else if (s.t === 'kalp') { c.fillStyle = s.renk; kalpYol(c, 0, 1, 5); c.fill(); parla(-2, -2, 2); }
    else if (s.t === 'yildiz') { c.fillStyle = s.renk; yildizYol(c, 0, 0, 5.5, 2.4, 5); c.fill(); parla(-1, -1.5, 2); }
    else if (s.t === 'inci') { const g = c.createRadialGradient(-1, -1.2, 0.3, 0, 0, 3.4); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, ton(s.renk, -0.12)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 3.2, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function parlakIsik(c, guc, zaman) {
    if (guc <= 0) return;
    const g = G;
    c.save(); c.globalCompositeOperation = 'lighter';
    g.yanaklar.forEach(([x, y]) => { c.save(); c.translate(x + (x < 180 ? -6 : 6), y - 22); c.rotate(x < 180 ? -0.5 : 0.5); c.scale(1, 0.45); yumusakNokta(c, 0, 0, 24, '#FFF3EA', 0.12 * guc); c.restore(); });
    c.save(); c.translate(180, 252); c.scale(0.16, 1); yumusakNokta(c, 0, 0, 24, '#FFF6F0', 0.12 * guc); c.restore();
    yumusakNokta(c, 182, 280, 5, '#FFFFFF', 0.18 * guc); yumusakNokta(c, 172, 152, 26, '#FFF6EE', 0.05 * guc); yumusakNokta(c, 180, g.cene - 14, 10, '#FFF6EE', 0.08 * guc);
    c.restore();
    if (guc > 0.9 && zaman != null && !ctx.azHareket) {
      const pts = [[118, 262], [244, 262], [182, 246], [162, 148], [204, 160]];
      pts.forEach(([x, y], i) => { const f = (Math.sin(zaman / 600 + i * 1.7) + 1) / 2; if (f < 0.55) return; const a = (f - 0.55) / 0.45; c.save(); c.globalAlpha = a; c.fillStyle = '#FFFFFF'; yildizYol(c, x, y, 4.5 * a + 1, 0.9, 4, 0); c.fill(); c.restore(); });
    }
  }
  function dudakUstCiz(c) {
    const mk = d.mk, dm = G.dudak, yol = G.dudakYol;
    c.save(); c.clip(yol.tum);
    const kuru = d.bakim.kuru;
    if (kuru > 0.02) { c.strokeStyle = 'rgba(255,236,232,' + (0.3 * kuru) + ')'; c.lineWidth = 0.6; S.kuru.forEach(([x, y, a]) => { c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x + a * 2, y + 2); c.stroke(); }); }
    const parlak = (mk.rujVar ? ({ mat: 0, parlak: 0.6, likit: 0.3 }[mk.rujBitis] || 0) : 0) + (d.bitti.balm ? 0.18 : 0);
    if (parlak > 0) { yumusakNokta(c, dm.x - 6, dm.y + 9, 12, '#FFFFFF', parlak * 0.6); yumusakNokta(c, dm.x + dm.w * 0.3, dm.y - 7, 6, '#FFFFFF', parlak * 0.4); }
    if (mk.parlatici > 0) {
      c.fillStyle = rgba(mk.parlaticiRenk, 0.22 * mk.parlatici); c.fill(yol.tum);
      c.save(); c.translate(dm.x - 4, dm.y + 9); c.scale(1.6, 0.6); yumusakNokta(c, 0, 0, 10, '#FFFFFF', 0.75 * mk.parlatici); c.restore();
      yumusakNokta(c, dm.x + dm.w * 0.32, dm.y - 7, 5, '#FFFFFF', 0.6 * mk.parlatici);
      if (mk.parlaticiRenk === '#C9B8FF' || mk.parlaticiRenk === '#F3D19A') { c.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 14; i++) { const x = dm.x + ((i * 37) % 50 - 25) * dm.w / 30, y = dm.y + ((i * 23) % 26 - 12); c.fillRect(x, y, 0.9, 0.9); } }
    }
    c.restore();
  }
  // ana yüz çizimi: mantıksal koordinatlarda (çağıran dönüşümü kurar)
  function yuzCiz(c, o) {
    o = o || {}; const b = d.bakim, simdi = o.zaman;
    c.drawImage(T.sacArka, SAC_X0, SAC_Y0, SAC_W, SAC_H);
    c.drawImage(T.cilt, 0, 0, FW, FH);
    if (o.bornoz) bornozCiz(c);
    // yorgunluk + kızarıklık
    if (b.yorgun > 0.02) G.gozler.forEach(g => { c.save(); c.translate(g.x + g.s * 3, g.y + 18); c.scale(1.4, 0.55); yumusakNokta(c, 0, 0, 20, '#6E4656', 0.2 * b.yorgun); c.restore(); });
    if (b.kizarik > 0.02) S.kizarik.forEach(([x, y, r]) => yumusakNokta(c, x, y, r, '#E8706E', 0.11 * b.kizarik));
    c.drawImage(T.film, 0, 0, FW, FH);
    c.drawImage(T.kir, 0, 0, FW, FH);
    siyahNoktaCiz(c);
    sivilceCiz(c);
    c.drawImage(T.isilti, 0, 0, FW, FH);
    c.drawImage(T.maske, 0, 0, FW, FH);
    c.drawImage(T.krem, 0, 0, FW, FH);
    c.drawImage(T.makyaj, 0, 0, FW, FH);
    if (S.firca && S.firca.aktif && !S.firca.silgi) { c.save(); c.globalAlpha = S.firca.yog; c.drawImage(T.firca, 0, 0, FW, FH); c.restore(); }
    c.drawImage(T.kopuk, 0, 0, FW, FH);
    d.mk.cil.forEach(([x, y, r]) => { c.fillStyle = 'rgba(122,74,52,0.42)'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
    kaslarCiz(c);
    const ac = o.gozAcik == null ? 1 : o.gozAcik;
    G.gozler.forEach(g => gozCiz(c, g, ac));
    dudakUstCiz(c);
    parlakIsik(c, b.parlak, simdi);
    d.mk.glit.forEach(([x, y, r, h]) => { c.fillStyle = h; yildizYol(c, x, y, r, r * 0.3, 4, 0); c.fill(); });
    d.mk.susler.forEach(s => susCiz(c, s));
    if (S.pedler) pedCiz(c, S.pedler);
    c.drawImage(T.sacOn, SAC_X0, SAC_Y0, SAC_W, SAC_H);
    if (b.sacParlak > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,' + 0.12 * b.sacParlak + ')'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(102, 112); c.quadraticCurveTo(170, 64, 250, 96); c.stroke(); c.restore(); }
    if (o.spaBandi) spaBandiCiz(c);
    else sacAksCiz(c, d.k.sac.aks, d.k.sac.model);
  }
  function pedCiz(c, p) {
    G.gozler.forEach((g, i) => {
      if (!p[i]) return;
      c.save(); c.translate(g.x + g.s * 4, g.y + 22); c.rotate(g.s * -0.18);
      c.beginPath(); c.moveTo(-g.s * 26, -6); c.quadraticCurveTo(0, 6, g.s * 28, -10); c.quadraticCurveTo(g.s * 24, 14, 0, 16); c.quadraticCurveTo(-g.s * 22, 14, -g.s * 26, -6); c.closePath();
      const gr = c.createLinearGradient(0, -8, 0, 16); gr.addColorStop(0, 'rgba(255,180,210,0.75)'); gr.addColorStop(1, 'rgba(240,130,175,0.75)'); c.fillStyle = gr; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1; c.stroke();
      c.fillStyle = 'rgba(255,240,250,0.6)'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-g.s * 14 + g.s * k * 6, 4 + (k % 2) * 3, 1.2, 0, Math.PI * 2); c.fill(); }
      yumusakNokta(c, -g.s * 8, 0, 7, '#FFFFFF', 0.5);
      c.restore();
    });
  }

  /* ================================================================ tam boy (giydirme + final) */
  const KB = 0.34, BAS_Y = 92;            // yüz → gövde ölçeği; yüz (180,215) → gövde (180,92)
  const PROFIL = [[150, 14], [160, 34], [166, 40], [182, 35], [196, 36], [208, 31], [230, 24.5], [248, 31], [266, 38], [284, 38.5], [300, 37.5]];
  function yanX(y) {
    if (y <= PROFIL[0][0]) return PROFIL[0][1];
    for (let i = 1; i < PROFIL.length; i++) if (y <= PROFIL[i][0]) { const a = PROFIL[i - 1], b = PROFIL[i], t = (y - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], (1 - Math.cos(t * Math.PI)) / 2); }
    return PROFIL[PROFIL.length - 1][1];
  }
  const POZ_ACI = {   // [üst kol, ön kol] (aşağı = 0, dışa +), sol(-1) / sağ(+1)
    duz: { '-1': [0.13, 0.06], '1': [0.13, 0.06], egim: 0 },
    bel: { '-1': [0.66, -0.78], '1': [0.66, -0.78], egim: 0 },
    model: { '-1': [0.66, -0.78], '1': [0.1, 0.2], egim: 0.07 },
    selam: { '-1': [0.13, 0.06], '1': [2.45, 2.92], egim: -0.05 },
    kalp: { '-1': [0.24, -2.32], '1': [0.24, -2.32], egim: 0.04 }
  };
  function govdeGeo(poz) {
    const pa = POZ_ACI[poz] || POZ_ACI.duz, kollar = {};
    [-1, 1].forEach(s => {
      const [a1, a2] = pa[String(s)], Sx = 180 + s * 36, Sy = 167;
      const Ex = Sx + s * Math.sin(a1) * 64, Ey = Sy + Math.cos(a1) * 64;
      const Wx = Ex + s * Math.sin(a2) * 58, Wy = Ey + Math.cos(a2) * 58;
      const yon = Math.atan2(Wy - Ey, Wx - Ex);
      kollar[s] = { S: [Sx, Sy], E: [Ex, Ey], W: [Wx, Wy], H: [Wx + Math.cos(yon) * 8, Wy + Math.sin(yon) * 8], yon, a1, a2 };
    });
    return { poz, kollar, egim: pa.egim };
  }
  function bacakYolu(c, s, e) {
    e = e || 0;
    const dis = [[266, 38], [300, 37], [340, 30], [366, 23.5], [396, 25], [420, 20], [444, 16]], ic = [[444, 7.5], [420, 6], [396, 5.5], [366, 5], [330, 4], [292, 1.5]];
    const nk = dis.map(([y, x]) => [180 + s * (x + e), y]).concat(ic.map(([y, x]) => [180 + s * Math.max(0, x - e * 0.5), y]));
    egri(c, nk, true);
  }
  function tenDolgu(c, ten, x0, x1) { return kumas(c, ten, x0, x1, 0.55); }
  function govdeCiz(c, gv, o) {
    o = o || {}; const ten = d.k.ten, kiy = o.kiy || d.kiy, tk = sicakKoyu(ten, 0.3);
    const parca = (kat) => { const v = kiy[kat]; if (!v) return null; const p = (GARDIROP[kat].parcalar.find(x => x.id === v.id)); if (!p) return null; return { p, renk: p.renkler[v.r % p.renkler.length] }; };
    const ust = parca('ust'), alt = parca('alt'), elb = parca('elbise'), dis = parca('dis'), ayk = parca('ayakkabi'), cnt = parca('canta');
    // çanta (sırt) arkada
    if (cnt && cnt.p.tip === 'sirt') cantaCiz(c, gv, cnt.p, cnt.renk, 'arka');
    // saç arka
    if (!o.mankenMi) basDonusum(c, gv, () => c.drawImage(T.sacArka, SAC_X0, SAC_Y0, SAC_W, SAC_H));
    // bacaklar
    [-1, 1].forEach(s => { c.beginPath(); bacakYolu(c, s); c.fillStyle = tenDolgu(c, ten, 180 + s * 40, 180); c.fill(); });
    [-1, 1].forEach(s => { yumusakNokta(c, 180 + s * 14, 366, 7, '#FFFFFF', 0.18); });
    // gövde + boyun
    c.fillStyle = tenDolgu(c, ten, 140, 220); c.beginPath(); c.rect(168, 136, 24, 30); c.fill();
    c.fillStyle = rgba(tk, 0.35); elips(c, 180, 142, 13, 6); c.fill();
    const gov = new Path2D(); const sol = [], sag = [];
    for (let y = 160; y <= 292; y += 4) { sol.push([180 - yanX(y), y]); sag.push([180 + yanX(y), y]); }
    gov.moveTo(180 - 12, 156); sol.forEach(p => gov.lineTo(p[0], p[1])); for (let i = sag.length - 1; i >= 0; i--) gov.lineTo(sag[i][0], sag[i][1]); gov.lineTo(180 + 12, 156); gov.closePath();
    c.fillStyle = tenDolgu(c, ten, 140, 220); c.fill(gov);
    c.save(); c.clip(gov); yumusakNokta(c, 166, 176, 18, '#FFFFFF', 0.15); c.restore();
    // ayakkabı (paça altında kalsın diye önce bot/çizme değil; sonra çizilir)
    const uzunPaca = alt && alt.p.tip === 'pantolon' && !elb;
    if (ayk && !uzunPaca) ayakkabiCiz(c, ayk.p, ayk.renk);
    else if (!ayk) [-1, 1].forEach(s => { c.fillStyle = tenDolgu(c, ten, 180 + s * 20, 180); elips(c, 180 + s * 13, 452, 6.5, 9, s * 0.25); c.fill(); });
    // temel iç katman (eksik kategoriler) — hiçbir zaman çıplak kalmaz
    if (!elb && !ust) ustCiz(c, { yaka: 'yuvarlak', kol: 'yok', boy: 240, bol: 0.1 }, '#ECE6EF', gv, true);
    if (!elb && !alt) altCiz(c, { tip: 'sort' }, '#D9D2E0');
    if (!elb && alt) altCiz(c, alt.p, alt.renk);
    if (ayk && uzunPaca) ayakkabiCiz(c, ayk.p, ayk.renk, alt.p.paca);
    if (!elb && ust) ustCiz(c, ust.p, ust.renk, gv);
    if (elb) elbiseCiz(c, elb.p, elb.renk, gv);
    if (cnt && cnt.p.tip === 'bel') cantaCiz(c, gv, cnt.p, cnt.renk, 'on');
    const kly = parca('kolye'); if (kly) kolyeCiz(c, kly.p, kly.renk);
    if (dis) disCiz(c, dis.p, dis.renk, gv);
    // baş
    if (!o.mankenMi) basDonusum(c, gv, () => {
      c.save(); c.beginPath(); c.rect(-100, -100, 560, 495); c.clip();
      c.drawImage(T.cilt, 0, 0, T.cilt.width, Math.round(395 * RY), 0, 0, FW, 395);
      yuzCizGovde(c);
      c.restore();
      c.drawImage(T.sacOn, SAC_X0, SAC_Y0, SAC_W, SAC_H);
      sacAksCiz(c, d.k.sac.aks, d.k.sac.model);
      const kp = parca('kupe'); if (kp) kupeCiz(c, kp.p, kp.renk);
      const gz = parca('gozluk'); if (gz) gozlukCiz(c, gz.p, gz.renk);
      const sp = parca('sapka'); if (sp) sapkaCiz(c, sp.p, sp.renk);
    });
    else mankenBas(c);
    // kollar + kollar üstü giysi
    [-1, 1].forEach(s => {
      const k = gv.kollar[s];
      c.fillStyle = tenDolgu(c, ten, k.S[0] - 8, k.S[0] + 8);
      c.beginPath(); kapsul(c, k.S[0], k.S[1], k.E[0], k.E[1], 7.6, 5.8); c.fill();
      c.beginPath(); kapsul(c, k.E[0], k.E[1], k.W[0], k.W[1], 5.8, 4.3); c.fill();
      elCiz(c, k, ten);
      const kolTip = elb ? elb.p.kol : ust ? ust.p.kol : 'yok', kolRenk = elb ? elb.renk : ust ? ust.renk : null;
      if (kolRenk) kolCiz(c, k, kolTip, kolRenk, 0, (elb || ust).p);
      if (dis) kolCiz(c, k, 'uzun', dis.renk, dis.p.tip === 'sisme' ? 4 : 1.6, dis.p);
    });
    if (gv.poz === 'kalp') { c.fillStyle = '#FF6F9A'; kalpYol(c, 180, 186, 6); c.fill(); yumusakNokta(c, 178, 183, 3, '#FFFFFF', 0.7); }
    const bl = parca('bileklik'); if (bl) bileklikCiz(c, gv.kollar[-1], bl.p, bl.renk);
    const yz = parca('yuzuk'); if (yz) yuzukCiz(c, gv.kollar[1], yz.p, yz.renk);
    if (cnt && cnt.p.tip !== 'sirt' && cnt.p.tip !== 'bel') cantaCiz(c, gv, cnt.p, cnt.renk, 'on');
    if (cnt && cnt.p.tip === 'sirt') cantaCiz(c, gv, cnt.p, cnt.renk, 'askilar');
  }
  function basDonusum(c, gv, fn) {
    c.save(); c.translate(180, BAS_Y); c.rotate(gv.egim || 0); c.scale(KB, KB); c.translate(-180, -215); fn(); c.restore();
  }
  function yuzCizGovde(c) {
    const b = d.bakim;
    if (b.yorgun > 0.02) G.gozler.forEach(g => { c.save(); c.translate(g.x, g.y + 18); c.scale(1.4, 0.55); yumusakNokta(c, 0, 0, 20, '#6E4656', 0.2 * b.yorgun); c.restore(); });
    c.drawImage(T.kir, 0, 0, FW, FH); siyahNoktaCiz(c); sivilceCiz(c);
    c.drawImage(T.isilti, 0, 0, FW, FH); c.drawImage(T.makyaj, 0, 0, FW, FH);
    d.mk.cil.forEach(([x, y, r]) => { c.fillStyle = 'rgba(122,74,52,0.42)'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
    kaslarCiz(c); G.gozler.forEach(g => gozCiz(c, g, 1)); dudakUstCiz(c); parlakIsik(c, b.parlak, null);
    d.mk.glit.forEach(([x, y, r, h]) => { c.fillStyle = h; yildizYol(c, x, y, r, r * 0.3, 4, 0); c.fill(); });
    d.mk.susler.forEach(s => susCiz(c, s));
  }
  function mankenBas(c) {
    c.fillStyle = '#E9E2EA'; elips(c, 180, 92, 32, 42); c.fill();
  }
  function elCiz(c, k, ten) {
    c.save(); c.translate(k.H[0], k.H[1]); c.rotate(k.yon - Math.PI / 2);
    c.fillStyle = tenDolgu(c, ten, -6, 6); elips(c, 0, 0, 5, 7.4); c.fill();
    elips(c, 3.6, -2.5, 2, 3.6, -0.5); c.fill();
    c.strokeStyle = rgba(sicakKoyu(ten, 0.4), 0.25); c.lineWidth = 0.6; c.beginPath(); c.moveTo(-2, 3); c.lineTo(-2, 7); c.moveTo(0, 3.5); c.lineTo(0, 7.4); c.moveTo(2, 3); c.lineTo(2, 7); c.stroke();
    c.restore();
  }
  function kolCiz(c, k, tip, renk, ek, p) {
    if (!tip || tip === 'yok' || tip === 'kalinAski') return;
    const r0 = 8.6 + ek, r1 = 6.8 + ek, r2 = 5.4 + ek * 0.8;
    c.fillStyle = kumas(c, renk, k.S[0] - 10, k.S[0] + 10, 0.6);
    if (tip === 'kisa') { const t = 0.42, mx = lerp(k.S[0], k.E[0], t), my = lerp(k.S[1], k.E[1], t); c.beginPath(); kapsul(c, k.S[0], k.S[1] - 2, mx, my, r0, lerp(r0, r1, t) + 0.6); c.fill(); }
    else if (tip === 'balon') {
      const t = 0.45, mx = lerp(k.S[0], k.E[0], t), my = lerp(k.S[1], k.E[1], t);
      c.beginPath(); elips(c, lerp(k.S[0], mx, 0.45), lerp(k.S[1], my, 0.45), 12, 15, Math.atan2(my - k.S[1], mx - k.S[0]) - Math.PI / 2); c.fill();
      c.strokeStyle = rgba(ton(renk, -0.3), 0.5); c.lineWidth = 0.8; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(k.S[0] + i * 4, k.S[1] - 6); c.quadraticCurveTo(lerp(k.S[0], mx, 0.5) + i * 7, lerp(k.S[1], my, 0.5), mx + i * 3, my); c.stroke(); }
    } else {
      c.beginPath(); kapsul(c, k.S[0], k.S[1] - 2, k.E[0], k.E[1], r0, r1); c.fill();
      c.beginPath(); kapsul(c, k.E[0], k.E[1], lerp(k.E[0], k.W[0], 0.92), lerp(k.E[1], k.W[1], 0.92), r1, r2); c.fill();
      c.strokeStyle = rgba(ton(renk, -0.35), 0.35); c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(k.E[0] - 4, k.E[1] - 2); c.quadraticCurveTo(k.E[0], k.E[1] + 3, k.E[0] + 4, k.E[1] - 1); c.stroke();
      if (p && (p.tip === 'bomber' || p.tip === 'sisme' || p.desen === 'orgu' || p.tip === 'hirka')) { const wx = lerp(k.E[0], k.W[0], 0.85), wy = lerp(k.E[1], k.W[1], 0.85); c.fillStyle = ton(renk, -0.12); c.beginPath(); kapsul(c, wx, wy, lerp(k.E[0], k.W[0], 0.95), lerp(k.E[1], k.W[1], 0.95), r2 + 0.5, r2 + 0.3); c.fill(); }
      if (p && p.tip === 'biker') { c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(k.S[0] - 3, k.S[1] + 6); c.lineTo(k.E[0] - 3, k.E[1]); c.stroke(); c.strokeStyle = '#C9CCD4'; c.lineWidth = 1; c.setLineDash([1.2, 1]); c.beginPath(); c.moveTo(lerp(k.E[0], k.W[0], 0.6) + 3, lerp(k.E[1], k.W[1], 0.6)); c.lineTo(lerp(k.E[0], k.W[0], 0.9) + 3, lerp(k.E[1], k.W[1], 0.9)); c.stroke(); c.setLineDash([]); }
      if (p && p.tip === 'sisme') { c.strokeStyle = rgba(ton(renk, -0.3), 0.4); c.lineWidth = 1; for (let i = 1; i < 5; i++) { const t = i / 5, x = lerp(k.S[0], k.W[0], t), y = lerp(k.S[1], k.W[1], t); c.beginPath(); c.arc(x, y, r1 + 1, k.yon + Math.PI * 0.6, k.yon + Math.PI * 1.4); c.stroke(); } }
      if (p && p.tip === 'pelus') { c.fillStyle = ton(renk, 0.1); for (let i = 0; i < 14; i++) { const t = i / 13, x = lerp(k.S[0], k.W[0], t), y = lerp(k.S[1], k.W[1], t); c.beginPath(); c.arc(x + Math.sin(i * 2.1) * 4, y, 2.6, 0, Math.PI * 2); c.fill(); } }
    }
  }
  // gövdeyi saran giysi yolu: üst kenar (yaka) → yanlar → etek ucu
  function ustYol(p, e, bit, gv) {
    const yol = new Path2D(), y0 = { aski: 190, straplez: 193, kalp: 190 }[p.yaka], yuk = bit, ust = y0 || 163;
    const kenar = y => yanX(y) + e + (p.bol || 0) * Math.max(0, 33 - yanX(y)) * 0.75;
    const sol = [], sag = [];
    for (let y = ust + 3; y <= yuk; y += 4) { sol.push([180 - kenar(y), y]); sag.push([180 + kenar(y), y]); }
    if (y0) {
      if (p.yaka === 'kalp') { yol.moveTo(180 - kenar(y0), y0 + 2); yol.quadraticCurveTo(180 - 22, y0 - 8, 180, y0 + 6); yol.quadraticCurveTo(180 + 22, y0 - 8, 180 + kenar(y0), y0 + 2); }
      else { yol.moveTo(180 - kenar(y0), y0); yol.quadraticCurveTo(180, y0 + (p.yaka === 'aski' ? 6 : 2), 180 + kenar(y0), y0); }
      sag.forEach(q => yol.lineTo(q[0], q[1]));
    } else {
      const nk = { yuvarlak: [14, 158], v: [14, 158], kare: [17, 160], bogazli: [13, 142], gomlek: [13, 156], kayik: [30, 163] }[p.yaka] || [14, 158];
      yol.moveTo(180 + nk[0], nk[1]); yol.quadraticCurveTo(180 + 30, 158, 180 + 41 + e, 166);
      sag.forEach(q => yol.lineTo(q[0], q[1]));
    }
    const hx = kenar(yuk);
    yol.lineTo(180 + hx, yuk); yol.quadraticCurveTo(180, yuk + 5, 180 - hx, yuk);
    for (let i = sol.length - 1; i >= 0; i--) yol.lineTo(sol[i][0], sol[i][1]);
    if (y0) { yol.closePath(); return yol; }
    yol.lineTo(180 - 41 - e, 166);
    const nk = { yuvarlak: [14, 158], v: [14, 158], kare: [17, 160], bogazli: [13, 142], gomlek: [13, 156], kayik: [30, 163] }[p.yaka] || [14, 158];
    yol.quadraticCurveTo(180 - 30, 158, 180 - nk[0], nk[1]);
    if (p.yaka === 'v') yol.lineTo(180, 192);
    else if (p.yaka === 'kare') { yol.lineTo(180 - 17, 184); yol.lineTo(180 + 17, 184); }
    else if (p.yaka === 'gomlek') yol.lineTo(180, 180);
    else if (p.yaka === 'bogazli') yol.lineTo(180 + 13, 142);
    else if (p.yaka === 'kayik') yol.quadraticCurveTo(180, 172, 180 + 30, 163);
    else yol.quadraticCurveTo(180, 178, 180 + 14, 158);
    yol.closePath(); return yol;
  }
  function desenCiz(c, yol, desen, renk, x0, y0, x1, y1) {
    if (!desen) return;
    c.save(); c.clip(yol);
    const ac = parlaklik(renk) > 0.6, kar = ac ? ton(renk, -0.25) : ton(renk, 0.55);
    if (desen === 'cizgi') { c.fillStyle = rgba('#FFFFFF', 0.9); for (let y = y0; y < y1; y += 9) c.fillRect(x0, y, x1 - x0, 3.6); }
    else if (desen === 'saten') { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0.25, 'rgba(255,255,255,0)'); g.addColorStop(0.42, 'rgba(255,255,255,0.32)'); g.addColorStop(0.5, 'rgba(255,255,255,0.05)'); g.addColorStop(0.62, 'rgba(255,255,255,0.22)'); g.addColorStop(0.8, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    else if (desen === 'orgu') { c.strokeStyle = rgba(ton(renk, -0.3), 0.35); c.lineWidth = 1; for (let x = x0; x < x1; x += 7) { for (let y = y0; y < y1; y += 6) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3.5, y + 3); c.lineTo(x + 7, y); c.stroke(); } } }
    else if (desen === 'kalp') { c.fillStyle = ac ? '#F05A86' : '#FFFFFF'; kalpYol(c, 180, 204, 10); c.fill(); }
    else if (desen === 'cicek') { const r = rng(5); for (let i = 0; i < 70; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), f = sec(r, ['#F28AB0', '#F5C542', '#8FC9A0', '#9AB8F0']); c.fillStyle = f; for (let j = 0; j < 5; j++) { const a = j * 1.256; c.beginPath(); c.arc(x + Math.cos(a) * 2, y + Math.sin(a) * 2, 1.5, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#FFF4C0'; c.beginPath(); c.arc(x, y, 1, 0, Math.PI * 2); c.fill(); } }
    else if (desen === 'payet') { for (let y = y0; y < y1; y += 4) for (let x = x0 + (y % 8 ? 2 : 0); x < x1; x += 4) { const f = (Math.sin(x * 0.7 + y * 1.3) + 1) / 2; c.fillStyle = f > 0.75 ? 'rgba(255,255,255,0.85)' : f < 0.2 ? rgba(ton(renk, -0.4), 0.6) : rgba(ton(renk, 0.25), 0.5); c.beginPath(); c.arc(x, y, 1.5, 0, Math.PI * 2); c.fill(); } }
    else if (desen === 'tul') { const r = rng(9); c.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 120; i++) { c.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 1, 1); } }
    else if (desen === 'pile') { c.strokeStyle = rgba(ton(renk, -0.28), 0.4); c.lineWidth = 1; for (let x = x0; x < x1; x += 6) { c.beginPath(); c.moveTo(180 + (x - 180) * 0.5, y0); c.lineTo(x, y1); c.stroke(); } }
    c.restore();
    void kar;
  }
  function ustCiz(c, p, renk, gv, temel) {
    const e = 2 + (p.bol || 0) * 2, yol = ustYol(p, e, p.boy || 250, gv);
    c.fillStyle = kumas(c, renk, 136, 224, 0.7); c.fill(yol);
    c.save(); c.clip(yol);
    yumusakNokta(c, 180, 214, 30, ton(renk, -0.35), 0.22);
    [-1, 1].forEach(s => yumusakNokta(c, 180 + s * 24, 196, 16, '#FFFFFF', 0.14));
    c.restore();
    desenCiz(c, yol, p.desen, renk, 130, 140, 230, p.boy || 250);
    c.strokeStyle = rgba(ton(renk, -0.45), 0.3); c.lineWidth = 0.8; c.stroke(yol);
    if (p.yaka === 'aski' || p.kol === 'kalinAski') { c.strokeStyle = ton(renk, -0.08); c.lineWidth = p.kol === 'kalinAski' ? 6 : 1.8; c.lineCap = 'round'; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * 22, 192); c.lineTo(180 + s * (p.kol === 'kalinAski' ? 22 : 25), 160); c.stroke(); }); }
    if (p.kol === 'kalinAski') { c.save(); c.clip(ustYol({ yaka: 'yuvarlak', bol: 0 }, 3, 260, gv)); c.fillStyle = kumas(c, renk, 136, 224, 0.7); c.beginPath(); c.moveTo(180 - 22, 160); c.lineTo(180 - 33, 190); c.lineTo(180 + 33, 190); c.lineTo(180 + 22, 160); c.quadraticCurveTo(180, 182, 180 - 22, 160); c.fill(); c.restore(); c.fillStyle = ton(renk, -0.2); c.fillRect(180 - 31, 206, 62, 5); }
    if (p.yaka === 'bogazli') { c.fillStyle = kumas(c, renk, 166, 194, 0.6); dik(c, 166, 138, 28, 22, 4); c.fill(); c.strokeStyle = rgba(ton(renk, -0.4), 0.3); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(167, 144 + i * 5); c.quadraticCurveTo(180, 147 + i * 5, 193, 144 + i * 5); c.stroke(); } }
    if (p.yaka === 'gomlek') { c.fillStyle = ton(renk, 0.08); [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * 13, 154); c.lineTo(180 + s * 2, 180); c.lineTo(180 + s * 22, 172); c.closePath(); c.fill(); c.strokeStyle = rgba(ton(renk, -0.4), 0.4); c.stroke(); }); }
    if (p.ekstra === 'dugme' || p.yaka === 'gomlek') { c.fillStyle = ton(renk, -0.3); for (let y = 186; y < (p.boy || 250) - 4; y += 13) { c.beginPath(); c.arc(180, y, 1.5, 0, Math.PI * 2); c.fill(); } }
    if (p.ekstra === 'firfir') { c.fillStyle = ton(renk, 0.1); for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(180 - 17 + i * 4.25, 185, 3, 0, Math.PI); c.fill(); } }
    if (p.ekstra === 'korse') { c.strokeStyle = rgba(ton(renk, -0.4), 0.4); c.lineWidth = 0.8; [-16, -6, 6, 16].forEach(x => { c.beginPath(); c.moveTo(180 + x, 196); c.lineTo(180 + x * 0.8, p.boy - 2); c.stroke(); }); }
    if (p.desen === 'orgu') { c.fillStyle = ton(renk, -0.12); const hx = yanX(p.boy) + e + (p.bol || 0) * Math.max(0, 33 - yanX(p.boy)) * 0.75; c.fillRect(180 - hx, p.boy - 6, hx * 2, 6); }
    if (temel) { c.strokeStyle = 'rgba(180,170,190,0.5)'; c.stroke(yol); }
  }
  function altCiz(c, p, renk) {
    const yol = new Path2D();
    if (p.tip === 'etek') {
      const hem = { mini: 300, diz: 352, midi: 398, uzun: 450 }[p.boy] || 330, ust = 230;
      const yayil = { a: 0.34, pileli: 0.4, saten: 0.22, kalem: -0.05 }[p.sekil] || 0.3;
      const hx = Math.max(30, yanX(266) + 3 + (hem - 266) * yayil);
      yol.moveTo(180 - yanX(ust) - 2, ust); yol.quadraticCurveTo(180 - yanX(266) - 4, 262, 180 - hx, hem);
      yol.quadraticCurveTo(180, hem + 6, 180 + hx, hem); yol.quadraticCurveTo(180 + yanX(266) + 4, 262, 180 + yanX(ust) + 2, ust); yol.closePath();
      c.fillStyle = kumas(c, renk, 180 - hx, 180 + hx, 0.7); c.fill(yol);
      desenCiz(c, yol, p.sekil === 'pileli' ? 'pile' : p.sekil === 'saten' ? 'saten' : null, renk, 180 - hx, ust, 180 + hx, hem);
      c.fillStyle = ton(renk, -0.12); c.fillRect(180 - yanX(ust) - 2, ust, (yanX(ust) + 2) * 2, 5);
      c.strokeStyle = rgba(ton(renk, -0.45), 0.3); c.lineWidth = 0.8; c.stroke(yol);
      return;
    }
    const ust = 234, kenar = y => yanX(y) + 2.2;
    const paca = p.tip === 'sort' ? 'sort' : p.paca;
    const alt = paca === 'sort' ? 304 : paca === 'tayt' ? 440 : 448;
    const disX = (y) => {
      if (y <= 290) return kenar(y);
      const t = (y - 290) / (alt - 290);
      if (paca === 'genis') return lerp(kenar(290), 34, t);
      if (paca === 'kargo') return lerp(kenar(290), 29, t) + 3;
      if (paca === 'duz') return lerp(kenar(290), 27, t);
      if (paca === 'sort') return kenar(290) + t * 3;
      const bac = [[300, 37], [340, 30], [366, 23.5], [396, 25], [420, 20], [448, 16.5]];
      let x = 37; for (let i = 1; i < bac.length; i++) if (y <= bac[i][0]) { const a = bac[i - 1], b = bac[i]; x = lerp(a[1], b[1], (y - a[0]) / (b[0] - a[0])); break; }
      if (y > bac[bac.length - 1][0]) x = 16.5;
      if (paca === 'ispanyol' && y > 366) x = lerp(23.5, 30, (y - 366) / (alt - 366));
      return x + (paca === 'tayt' ? 0.6 : 2);
    };
    const icX = (y) => { const t = (y - 292) / (alt - 292); if (paca === 'genis') return lerp(2, 2, t); if (paca === 'ispanyol' && y > 366) return lerp(4, 1, (y - 366) / (alt - 366)); if (paca === 'sort') return 2; return lerp(1.5, paca === 'tayt' ? 7 : 5, t); };
    [-1, 1].forEach(s => {
      yol.moveTo(180, ust);
      yol.lineTo(180 + s * kenar(ust), ust);
      for (let y = ust + 4; y <= alt; y += 4) yol.lineTo(180 + s * disX(y), y);
      yol.lineTo(180 + s * icX(alt), alt + (paca === 'genis' ? 1 : 0));
      for (let y = alt - 4; y >= 292; y -= 4) yol.lineTo(180 + s * icX(y), y);
      yol.lineTo(180, 290); yol.closePath();
    });
    c.fillStyle = kumas(c, renk, 138, 222, 0.6); c.fill(yol);
    c.save(); c.clip(yol);
    if (p.kot) { [-1, 1].forEach(s => { yumusakNokta(c, 180 + s * 18, 320, 16, '#FFFFFF', 0.2); yumusakNokta(c, 180 + s * 15, 370, 10, '#FFFFFF', 0.16); }); }
    yumusakNokta(c, 180, 292, 12, ton(renk, -0.5), 0.25);
    c.restore();
    c.strokeStyle = rgba(ton(renk, -0.45), 0.35); c.lineWidth = 0.8; c.stroke(yol);
    c.fillStyle = ton(renk, -0.1); c.fillRect(180 - kenar(ust), ust, kenar(ust) * 2, 6);
    if (p.kot) {
      c.strokeStyle = rgba('#F3C77A', 0.75); c.lineWidth = 0.6; c.setLineDash([1.6, 1.2]);
      c.beginPath(); c.moveTo(180 - kenar(ust) + 1, ust + 7.5); c.lineTo(180 + kenar(ust) - 1, ust + 7.5); c.stroke();
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * (kenar(ust) - 2), ust + 9); c.quadraticCurveTo(180 + s * 20, ust + 14, 180 + s * 14, ust + 8); c.stroke(); });
      c.beginPath(); c.moveTo(183, ust + 7); c.quadraticCurveTo(184, 270, 180, 280); c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#C9CCD4'; c.beginPath(); c.arc(180, ust + 3, 1.6, 0, Math.PI * 2); c.fill();
      if (paca !== 'sort') { c.strokeStyle = rgba(ton(renk, 0.3), 0.6); [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * (disX(alt) - 1), alt - 1); c.lineTo(180 + s * (icX(alt) + 1), alt - 1); c.stroke(); }); }
    }
    if (paca === 'kargo') { c.fillStyle = ton(renk, -0.08); c.strokeStyle = rgba(ton(renk, -0.4), 0.4); [-1, 1].forEach(s => { dik(c, 180 + s * 30 - 7, 318, 14, 18, 2); c.fill(); c.stroke(); }); }
    if (paca === 'tayt') { c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.2; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * 34, 270); c.lineTo(180 + s * 17, 438); c.stroke(); }); }
  }
  function elbiseCiz(c, p, renk, gv) {
    const ustp = { yaka: p.yaka, kol: p.kol, boy: 232, bol: 0 };
    const govdeY = ustYol(ustp, 2, 232, gv);
    const hem = { mini: 304, diz: 352, midi: 400, uzun: 452 }[p.etek] || 350, hx = yanX(266) + 4 + (hem - 260) * (0.12 + p.hacim * 0.6);
    const etek = new Path2D();
    etek.moveTo(180 - yanX(228) - 2, 228); etek.bezierCurveTo(180 - yanX(250) - 8 - p.hacim * 14, 250, 180 - hx + 6, hem - 40, 180 - hx, hem);
    const dal = p.desen === 'tul' ? 6 : 2;
    for (let i = 1; i <= 10; i++) { const x = lerp(180 - hx, 180 + hx, i / 10); etek.quadraticCurveTo(lerp(180 - hx, 180 + hx, (i - 0.5) / 10), hem + dal + 3, x, hem); }
    etek.bezierCurveTo(180 + hx - 6, hem - 40, 180 + yanX(250) + 8 + p.hacim * 14, 250, 180 + yanX(228) + 2, 228); etek.closePath();
    const dolgu = kumas(c, renk, 180 - hx, 180 + hx, 0.7);
    if (p.desen === 'tul') { for (let k = 2; k >= 0; k--) { c.save(); c.translate(180, 228); c.scale(1 + k * 0.05, 1 + k * 0.012); c.translate(-180, -228); c.fillStyle = rgba(ton(renk, 0.1 - k * 0.06), 0.5 + k * 0.1); c.fill(etek); c.restore(); } }
    c.fillStyle = dolgu; c.fill(etek); c.fill(govdeY);
    c.save(); c.clip(govdeY); yumusakNokta(c, 180, 214, 26, ton(renk, -0.35), 0.2); [-1, 1].forEach(s => yumusakNokta(c, 180 + s * 22, 198, 14, '#FFFFFF', 0.14)); c.restore();
    c.save(); c.clip(etek); c.strokeStyle = rgba(ton(renk, -0.3), 0.3); c.lineWidth = 1.2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(180 + i * 6, 236); c.quadraticCurveTo(180 + i * 9, (236 + hem) / 2, 180 + i * hx / 3.4, hem); c.stroke(); } c.restore();
    desenCiz(c, govdeY, p.desen, renk, 130, 150, 230, 236);
    desenCiz(c, etek, p.desen, renk, 180 - hx - 10, 226, 180 + hx + 10, hem + 10);
    c.strokeStyle = rgba(ton(renk, -0.45), 0.3); c.lineWidth = 0.8; c.stroke(govdeY); c.stroke(etek);
    if (p.yaka === 'aski') { c.strokeStyle = ton(renk, -0.08); c.lineWidth = 1.8; c.lineCap = 'round'; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * 22, 192); c.lineTo(180 + s * 25, 160); c.stroke(); }); }
    if (p.yaka === 'gomlek') { c.fillStyle = ton(renk, 0.08); [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * 13, 154); c.lineTo(180 + s * 2, 180); c.lineTo(180 + s * 22, 172); c.closePath(); c.fill(); }); c.fillStyle = ton(renk, -0.3); for (let y = 186; y < hem - 6; y += 14) { c.beginPath(); c.arc(180, y, 1.4, 0, Math.PI * 2); c.fill(); } }
    if (p.kemer) { c.fillStyle = ton(renk, -0.25); c.fillRect(180 - yanX(230) - 2, 226, (yanX(230) + 2) * 2, 6); c.fillStyle = ton(renk, -0.1); [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + 2, 229); c.quadraticCurveTo(180 + s * 9, 221, 180 + s * 10, 230); c.quadraticCurveTo(180 + s * 8, 236, 180, 229); c.fill(); }); }
    if (p.desen === 'tul' || p.desen === 'payet') { c.fillStyle = 'rgba(255,255,255,0.9)'; const r = rng(11); for (let i = 0; i < 24; i++) { yildizYol(c, 180 + (r() - 0.5) * hx * 1.7, 240 + r() * (hem - 240), 2.2, 0.6, 4, 0); c.fill(); } }
  }
  function disCiz(c, p, renk, gv) {
    const e = p.tip === 'sisme' ? 8 : p.tip === 'pelus' ? 6 : 4.5, bit = p.boy;
    const kenar = y => (y > 266 ? yanX(266) + (y - 266) * 0.1 : Math.max(yanX(y), 31)) + e;
    const yol = new Path2D();
    yol.moveTo(180 - 14, 154); yol.quadraticCurveTo(180 - 30, 156, 180 - 42 - e, 165);
    for (let y = 172; y <= bit; y += 4) yol.lineTo(180 - kenar(y), y);
    yol.lineTo(180 + kenar(bit), bit);
    for (let y = bit; y >= 172; y -= 4) yol.lineTo(180 + kenar(y), y);
    yol.lineTo(180 + 42 + e, 165); yol.quadraticCurveTo(180 + 30, 156, 180 + 14, 154); yol.closePath();
    const acik = p.tip === 'biker' ? [[-8, 158], [-18, 196], [-22, bit], [20, bit], [16, 196], [10, 158]] : p.tip === 'sisme' || p.tip === 'bomber' ? [[-9, 154], [-14, 200], [-16, bit], [16, bit], [14, 200], [9, 154]] : [[-11, 156], [-15, 220], [-18, bit], [18, bit], [15, 220], [11, 156]];
    const ac = new Path2D(); acik.forEach(([x, y], i) => i ? ac.lineTo(180 + x, y) : ac.moveTo(180 + x, y)); ac.closePath();
    const tum = new Path2D(); tum.addPath(yol); tum.addPath(ac);
    c.fillStyle = kumas(c, renk, 130, 230, p.tip === 'biker' ? 1.1 : 0.7); c.fill(tum, 'evenodd');
    c.save(); c.clip(tum, 'evenodd');
    if (p.tip === 'biker') { c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * 34, 172); c.quadraticCurveTo(180 + s * 28, 200, 180 + s * 32, 232); c.stroke(); }); c.lineWidth = 0.8; c.strokeStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.moveTo(150, 210); c.lineTo(164, 200); c.moveTo(196, 200); c.lineTo(210, 210); c.stroke(); }
    if (p.tip === 'sisme') { c.strokeStyle = rgba(ton(renk, -0.3), 0.45); c.lineWidth = 1.1; for (let y = 180; y < bit; y += 14) { c.beginPath(); c.moveTo(130, y); c.quadraticCurveTo(180, y + 4, 230, y); c.stroke(); } c.fillStyle = 'rgba(255,255,255,0.2)'; for (let y = 172; y < bit; y += 14) { c.fillRect(140, y, 80, 3); } }
    if (p.tip === 'hirka' || p.tip === 'kot') desenCiz(c, tum, p.tip === 'hirka' ? 'orgu' : null, renk, 130, 150, 230, bit);
    if (p.tip === 'kot') { c.strokeStyle = rgba('#F3C77A', 0.7); c.lineWidth = 0.6; c.setLineDash([1.6, 1.2]); [-1, 1].forEach(s => { dik(c, 180 + s * 26 - 8, 186, 16, 13, 2); c.stroke(); c.beginPath(); c.moveTo(180 + s * 14, 158); c.lineTo(180 + s * 18, bit); c.stroke(); }); c.setLineDash([]); c.fillStyle = '#C9A13A'; [-1, 1].forEach(s => { c.beginPath(); c.arc(180 + s * 26, 192, 1.4, 0, Math.PI * 2); c.fill(); }); c.fillStyle = ton(renk, -0.1); c.fillRect(130, bit - 7, 100, 7); }
    if (p.tip === 'pelus') { c.fillStyle = 'rgba(255,255,255,0.22)'; const r = rng(4); for (let i = 0; i < 160; i++) { c.beginPath(); c.arc(130 + r() * 100, 156 + r() * (bit - 156), 1.6, 0, Math.PI * 2); c.fill(); } }
    if (p.tip === 'bomber') { c.fillStyle = ton(renk, -0.15); c.fillRect(130, bit - 9, 100, 9); c.strokeStyle = rgba(ton(renk, 0.3), 0.5); for (let x = 132; x < 230; x += 3) { c.beginPath(); c.moveTo(x, bit - 9); c.lineTo(x, bit); c.stroke(); } }
    c.restore();
    c.strokeStyle = rgba(ton(renk, -0.5), 0.4); c.lineWidth = 0.8; c.stroke(tum);
    // yaka / klapa
    const klapa = { biker: true, blazer: true, trenc: true, palto: true, kot: true };
    if (klapa[p.tip]) {
      [-1, 1].forEach(s => {
        const ky = p.tip === 'biker' ? (s < 0 ? 0 : 6) : 0;
        c.beginPath(); c.moveTo(180 + s * 12, 155); c.lineTo(180 + s * (p.tip === 'biker' ? 34 : 26), 170 + ky); c.lineTo(180 + s * (p.tip === 'biker' ? 24 : 20), 182 + ky); c.lineTo(180 + s * (p.tip === 'biker' ? 18 : 15), 206 + ky); c.lineTo(180 + s * 11, 160); c.closePath();
        c.fillStyle = ton(renk, p.tip === 'biker' ? 0.1 : -0.08); c.fill(); c.strokeStyle = rgba(ton(renk, -0.5), 0.5); c.stroke();
      });
    }
    if (p.tip === 'biker') { c.strokeStyle = '#D6D9E0'; c.lineWidth = 1.2; c.setLineDash([1.4, 1]); c.beginPath(); acik.slice(0, 3).forEach(([x, y], i) => i ? c.lineTo(180 + x, y) : c.moveTo(180 + x, y)); c.stroke(); c.beginPath(); c.moveTo(162, 222); c.lineTo(150, 236); c.moveTo(198, 222); c.lineTo(210, 236); c.stroke(); c.setLineDash([]); c.fillStyle = ton(renk, 0.08); c.fillRect(180 - kenar(bit) , bit - 7, kenar(bit) * 2, 7); c.fillStyle = '#D6D9E0'; dik(c, 150, bit - 7, 7, 7, 1); c.fill(); }
    if (p.tip === 'trenc' || p.tip === 'palto') { c.fillStyle = ton(renk, -0.15); c.fillRect(180 - kenar(232), 228, kenar(232) * 2, 6); c.fillStyle = ton(renk, -0.35); [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(180 + s * 24, 200 + i * 22, 1.8, 0, Math.PI * 2); c.fill(); } }); if (p.tip === 'trenc') { c.fillStyle = ton(renk, -0.15); c.beginPath(); c.moveTo(196, 232); c.lineTo(202, 262); c.lineTo(206, 261); c.lineTo(200, 232); c.fill(); } }
    if (p.tip === 'blazer') { c.fillStyle = ton(renk, -0.35); c.beginPath(); c.arc(180 - 14, 236, 1.8, 0, Math.PI * 2); c.fill(); c.strokeStyle = rgba(ton(renk, -0.5), 0.4); [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * 22, 248); c.lineTo(180 + s * 36, 248); c.stroke(); }); }
    if (p.tip === 'sisme' || p.tip === 'bomber') { c.fillStyle = ton(renk, -0.12); c.beginPath(); c.moveTo(180 - 16, 150); c.quadraticCurveTo(180, 162, 180 + 16, 150); c.lineTo(180 + 18, 160); c.quadraticCurveTo(180, 172, 180 - 18, 160); c.closePath(); c.fill(); }
    if (p.tip === 'pelus') { c.fillStyle = ton(renk, 0.08); acik.forEach(([x, y]) => { c.beginPath(); c.arc(180 + x, y, 4, 0, Math.PI * 2); c.fill(); }); for (let y = 158; y < bit; y += 6) { [-1, 1].forEach(s => { const t = (y - 156) / (bit - 156), x = lerp(s * 11, s * 18, t); c.beginPath(); c.arc(180 + x, y, 3.2, 0, Math.PI * 2); c.fill(); }); } }
  }
  function ayakkabiCiz(c, p, renk, paca) {
    const t = p.tip, gr = (x0, x1) => kumas(c, renk, x0, x1, 0.8);
    [-1, 1].forEach(s => {
      const fx = 180 + s * 13, fy = 453;
      c.save(); c.translate(fx, fy); c.rotate(s * 0.22);
      const parla = () => yumusakNokta(c, -2, -3, 4, '#FFFFFF', 0.4);
      if (t === 'cizme' || t === 'bot' || t === 'karbot') {
        const ust = t === 'cizme' ? -96 : t === 'bot' ? -24 : -28;
        c.fillStyle = gr(-10, 10); c.beginPath(); c.moveTo(-7.5, ust); c.lineTo(7.5, ust); c.lineTo(8.6, -2); c.quadraticCurveTo(10, 10, 0, 12); c.quadraticCurveTo(-10, 10, -8.6, -2); c.closePath(); c.fill();
        c.fillStyle = ton(renk, -0.4); c.fillRect(-8.6, 9, 17.2, 3.2);
        if (t === 'karbot') { c.fillStyle = '#FFFFFF'; for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(i * 2.6, ust, 3, 0, Math.PI * 2); c.fill(); } }
        if (t === 'bot') { c.fillStyle = '#D6D9E0'; c.fillRect(-8, -14, 16, 2); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(-5, ust + 2, 2, 20); }
        if (t === 'cizme') { c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(-4, ust + 6, 2, 80); }
        parla();
      } else {
        c.fillStyle = gr(-8, 8);
        if (t === 'spor' || t === 'platform') { c.beginPath(); c.moveTo(-7, -6); c.quadraticCurveTo(0, -10, 7, -6); c.lineTo(8, 6); c.quadraticCurveTo(0, 13, -8, 6); c.closePath(); c.fill(); c.fillStyle = t === 'platform' ? ton(renk, -0.1) : '#FFFFFF'; c.fillRect(-8.4, 6, 16.8, t === 'platform' ? 6 : 3.4); c.strokeStyle = rgba(ton(renk, -0.5), 0.5); c.lineWidth = 0.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-3, -4 + i * 3); c.lineTo(3, -4 + i * 3); c.stroke(); } }
        else if (t === 'stiletto' || t === 'babet' || t === 'loafer') { c.beginPath(); c.moveTo(-6, -1); c.quadraticCurveTo(0, -4, 6, -1); c.lineTo(6.6, 6); c.quadraticCurveTo(0, 13, -6.6, 6); c.closePath(); c.fill(); if (t === 'stiletto') { c.fillStyle = ton(renk, -0.3); c.fillRect(-1, -6, 2, 6); } if (t === 'babet') { c.fillStyle = ton(renk, -0.15); elips(c, 0, 0, 2.6, 1.6); c.fill(); } if (t === 'loafer') { c.fillStyle = '#E2B95A'; c.fillRect(-3.5, 1, 7, 1.4); } }
        else if (t === 'sandalet') { c.strokeStyle = renk; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 2); c.moveTo(-6, 5); c.lineTo(6, 6); c.moveTo(-5, -8); c.lineTo(5, -8); c.stroke(); c.fillStyle = ton(renk, -0.3); c.fillRect(-6.5, 10, 13, 1.6); }
        parla();
      }
      c.restore();
    });
    void paca;
  }
  function cantaCiz(c, gv, p, renk, kat) {
    const t = p.tip, gr = (x0, x1) => kumas(c, renk, x0, x1, 0.7), parla = (x, y, r) => yumusakNokta(c, x, y, r, '#FFFFFF', 0.35);
    c.save(); c.lineCap = 'round';
    if (t === 'sirt') {
      if (kat === 'arka') { c.fillStyle = gr(140, 220); dik(c, 146, 176, 68, 76, 14); c.fill(); }
      if (kat === 'askilar') { c.strokeStyle = ton(renk, -0.15); c.lineWidth = 5; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(180 + s * 22, 160); c.quadraticCurveTo(180 + s * 30, 190, 180 + s * 31, 230); c.stroke(); }); }
      c.restore(); return;
    }
    if (t === 'bel') {
      c.strokeStyle = ton(renk, -0.2); c.lineWidth = 2.6; c.beginPath(); c.moveTo(180 - 30, 162); c.lineTo(180 + 34, 232); c.stroke();
      c.fillStyle = gr(166, 206); dik(c, 166, 192, 34, 18, 8); c.fill(); c.strokeStyle = '#D6D9E0'; c.lineWidth = 1; c.beginPath(); c.moveTo(170, 197); c.lineTo(202, 197); c.stroke(); parla(176, 196, 5);
      c.restore(); return;
    }
    if (['omuz', 'zincir', 'tote', 'hasir'].includes(t)) {
      const bx = 180 + 48, by = t === 'tote' || t === 'hasir' ? 262 : 250;
      c.strokeStyle = t === 'zincir' ? '#E2B95A' : ton(renk, -0.2); c.lineWidth = t === 'zincir' ? 1.6 : 2.6; if (t === 'zincir') c.setLineDash([2, 1.2]);
      c.beginPath(); c.moveTo(180 + 26, 161); c.quadraticCurveTo(180 + 46, 200, bx - 6, by - 10); c.moveTo(180 + 32, 162); c.quadraticCurveTo(180 + 54, 196, bx + 8, by - 10); c.stroke(); c.setLineDash([]);
      if (t === 'tote') { c.fillStyle = gr(bx - 16, bx + 16); c.beginPath(); c.moveTo(bx - 14, by - 10); c.lineTo(bx + 14, by - 10); c.lineTo(bx + 17, by + 26); c.lineTo(bx - 17, by + 26); c.closePath(); c.fill(); c.fillStyle = rgba(ton(renk, -0.4), 0.5); kalpYol(c, bx, by + 8, 5); c.fill(); }
      else if (t === 'hasir') { c.fillStyle = gr(bx - 16, bx + 16); c.beginPath(); c.moveTo(bx - 16, by - 8); c.lineTo(bx + 16, by - 8); c.quadraticCurveTo(bx + 18, by + 24, bx, by + 24); c.quadraticCurveTo(bx - 18, by + 24, bx - 16, by - 8); c.fill(); c.strokeStyle = rgba(ton(renk, -0.35), 0.5); c.lineWidth = 0.7; for (let y = by - 4; y < by + 22; y += 4) { c.beginPath(); c.moveTo(bx - 16, y); c.lineTo(bx + 16, y); c.stroke(); } }
      else { c.fillStyle = gr(bx - 14, bx + 14); dik(c, bx - 14, by - 10, 28, t === 'zincir' ? 16 : 22, 5); c.fill(); c.fillStyle = ton(renk, -0.12); c.beginPath(); c.moveTo(bx - 14, by - 8); c.lineTo(bx + 14, by - 8); c.lineTo(bx, by + 2); c.closePath(); c.fill(); c.fillStyle = '#E2B95A'; c.beginPath(); c.arc(bx, by + 1, 1.8, 0, Math.PI * 2); c.fill(); }
      parla(bx - 6, by - 4, 6);
      c.restore(); return;
    }
    // elde taşınan
    const elSec = gv.poz === 'selam' ? gv.kollar[-1] : gv.kollar[1], hx = elSec.H[0], hy = elSec.H[1];
    const k = gv.poz === 'kalp' ? { x: gv.kollar[1].E[0] + 6, y: gv.kollar[1].E[1] + 4 } : { x: hx, y: hy + 4 };
    if (t === 'clutch') { c.translate(k.x, k.y - 2); c.rotate(-0.25); c.fillStyle = gr(-14, 14); dik(c, -14, -6, 28, 13, 3); c.fill(); c.fillStyle = ton(renk, -0.12); c.beginPath(); c.moveTo(-14, -6); c.lineTo(14, -6); c.lineTo(0, 3); c.closePath(); c.fill(); parla(-6, -3, 5); }
    else if (t === 'kalp') { c.strokeStyle = ton(renk, -0.3); c.lineWidth = 1.4; c.beginPath(); c.moveTo(k.x - 5, k.y); c.lineTo(k.x, k.y - 3); c.lineTo(k.x + 5, k.y); c.stroke(); c.fillStyle = gr(k.x - 14, k.x + 14); kalpYol(c, k.x, k.y + 16, 14); c.fill(); parla(k.x - 6, k.y + 6, 5); }
    else { c.strokeStyle = ton(renk, -0.3); c.lineWidth = 1.8; c.beginPath(); c.arc(k.x, k.y + 4, 7, Math.PI, 0); c.stroke(); c.fillStyle = gr(k.x - 15, k.x + 15); c.beginPath(); c.moveTo(k.x - 12, k.y + 4); c.lineTo(k.x + 12, k.y + 4); c.lineTo(k.x + 15, k.y + 26); c.lineTo(k.x - 15, k.y + 26); c.closePath(); c.fill(); c.fillStyle = '#E2B95A'; c.fillRect(k.x - 2.5, k.y + 8, 5, 3); parla(k.x - 6, k.y + 10, 6); }
    c.restore();
  }
  function metal(c, renk, x, y, r) { const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.2, x, y, r); g.addColorStop(0, ton(renk, 0.6)); g.addColorStop(0.6, renk); g.addColorStop(1, ton(renk, -0.35)); return g; }
  function kolyeCiz(c, p, renk) {
    const t = p.tip; c.save(); c.lineCap = 'round';
    const zincir = (y, w, kal) => { c.strokeStyle = renk; c.lineWidth = kal || 0.9; c.beginPath(); c.moveTo(180 - w, 150); c.quadraticCurveTo(180, y + 6, 180 + w, 150); c.stroke(); };
    if (t === 'zincir') { zincir(176, 13); c.fillStyle = metal(c, renk, 180, 180, 2.2); c.beginPath(); c.arc(180, 180, 2, 0, Math.PI * 2); c.fill(); }
    else if (t === 'inci') { for (let i = 0; i <= 14; i++) { const u = i / 14, x = lerp(180 - 14, 180 + 14, u), y = 150 + Math.sin(u * Math.PI) * 24; const g = c.createRadialGradient(x - 0.6, y - 0.6, 0.2, x, y, 2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, ton(renk, -0.12)); c.fillStyle = g; c.beginPath(); c.arc(x, y, 1.9, 0, Math.PI * 2); c.fill(); } }
    else if (t === 'kalp') { zincir(176, 13, 0.7); c.fillStyle = metal(c, renk, 180, 183, 4); kalpYol(c, 180, 184, 4.6); c.fill(); }
    else if (t === 'choker') { c.strokeStyle = renk; c.lineWidth = 3.4; c.beginPath(); c.moveTo(168, 148); c.quadraticCurveTo(180, 153, 192, 148); c.stroke(); c.fillStyle = '#D6D9E0'; c.beginPath(); c.arc(180, 152, 1.6, 0, Math.PI * 2); c.fill(); }
    else if (t === 'nazar') { zincir(178, 13, 0.8); const x = 180, y = 183; [['#1E4FA8', 4.2], ['#FFFFFF', 2.8], ['#79B8E8', 2], ['#141418', 1]].forEach(([r, rr]) => { c.fillStyle = r; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); }); yumusakNokta(c, x - 1.5, y - 1.5, 1.6, '#FFFFFF', 0.9); }
    else if (t === 'katman') { zincir(166, 12, 0.7); zincir(178, 14, 0.7); zincir(192, 16, 0.8); c.fillStyle = metal(c, renk, 180, 196, 2); c.beginPath(); c.arc(180, 196, 2, 0, Math.PI * 2); c.fill(); }
    else if (t === 'yildiz') { zincir(176, 13, 0.7); c.fillStyle = metal(c, renk, 180, 184, 4); yildizYol(c, 180, 184, 4.6, 2, 5); c.fill(); }
    else if (t === 'tasli') { c.strokeStyle = '#D6D9E0'; c.lineWidth = 1; c.beginPath(); c.moveTo(166, 150); c.quadraticCurveTo(180, 172, 194, 150); c.stroke(); for (let i = 0; i <= 8; i++) { const u = i / 8, x = lerp(167, 193, u), y = 150 + Math.sin(u * Math.PI) * 10.5; c.fillStyle = renk; yildizYol(c, x, y, 2.2, 1.5, 6, 0); c.fill(); yumusakNokta(c, x - 0.5, y - 0.5, 1.2, '#FFFFFF', 0.9); } c.fillStyle = renk; c.beginPath(); c.moveTo(180, 162); c.lineTo(183, 168); c.lineTo(180, 175); c.lineTo(177, 168); c.closePath(); c.fill(); }
    c.restore();
  }
  function bileklikCiz(c, k, p, renk) {
    const x = lerp(k.E[0], k.W[0], 0.88), y = lerp(k.E[1], k.W[1], 0.88), a = k.yon;
    c.save(); c.translate(x, y); c.rotate(a - Math.PI / 2);
    const t = p.tip;
    if (t === 'boncuk' || t === 'inci') { for (let i = -2; i <= 2; i++) { c.fillStyle = t === 'inci' ? metal(c, renk, i * 2, 0, 1.6) : (i % 2 ? renk : ton(renk, 0.4)); c.beginPath(); c.arc(i * 2.1, 0, 1.4, 0, Math.PI * 2); c.fill(); } }
    else if (t === 'saat') { c.fillStyle = ton(renk, -0.2); c.fillRect(-5, -1.4, 10, 2.8); c.fillStyle = metal(c, renk, 0, 0, 3); c.beginPath(); c.arc(0, 0, 2.6, 0, Math.PI * 2); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, 1.7, 0, Math.PI * 2); c.fill(); }
    else { c.strokeStyle = t === 'tasli' ? '#D6D9E0' : renk; c.lineWidth = t === 'kelepce' ? 2.6 : t === 'ip' ? 1.8 : 1; c.beginPath(); c.moveTo(-5.4, 0); c.quadraticCurveTo(0, 1.6, 5.4, 0); c.stroke(); if (t === 'tasli' || t === 'charm') { c.fillStyle = renk; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 2, 1 + (t === 'charm' && i % 2 ? 1.5 : 0), 0.9, 0, Math.PI * 2); c.fill(); } } }
    c.restore();
  }
  function yuzukCiz(c, k, p, renk) {
    c.save(); c.translate(k.H[0], k.H[1]); c.rotate(k.yon - Math.PI / 2);
    c.strokeStyle = renk; c.lineWidth = p.tip === 'cift' ? 1.6 : 1; c.beginPath(); c.moveTo(-2.6, 4.4); c.lineTo(0.6, 4.6); c.stroke();
    const tas = { tektas: '#E8F6FF', kokteyl: renk, kalp: renk, yildiz: renk, inci: '#FFFFFF' }[p.tip];
    if (tas) { c.fillStyle = tas; if (p.tip === 'kalp') { kalpYol(c, -1, 4.4, 1.6); c.fill(); } else if (p.tip === 'yildiz') { yildizYol(c, -1, 4.2, 1.8, 0.8, 5); c.fill(); } else { c.beginPath(); c.arc(-1, 4, p.tip === 'kokteyl' ? 1.8 : 1.2, 0, Math.PI * 2); c.fill(); } yumusakNokta(c, -1.4, 3.6, 0.9, '#FFFFFF', 0.9); }
    c.restore();
  }
  // baş koordinatında (yüz 360×480)
  function kupeCiz(c, p, renk) {
    const t = p.tip;
    [-1, 1].forEach(s => {
      const x = 180 + s * 97 * G.e, y = 272;
      c.save(); c.translate(x, y); c.lineCap = 'round';
      if (t === 'halkaK' || t === 'halkaB') { const r = t === 'halkaK' ? 7 : 16; c.strokeStyle = metal(c, renk, 0, r, r); c.lineWidth = t === 'halkaK' ? 2.6 : 2.4; c.beginPath(); c.arc(0, r, r, 0, Math.PI * 2); c.stroke(); }
      else if (t === 'inci') { c.fillStyle = metal(c, '#FFFFFF', -1, 3, 6); const g = c.createRadialGradient(-2, 2, 0.5, 0, 4, 6); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, ton(renk, -0.15)); c.fillStyle = g; c.beginPath(); c.arc(0, 4, 5.4, 0, Math.PI * 2); c.fill(); }
      else if (t === 'damla') { c.strokeStyle = '#D6D9E0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 8); c.stroke(); c.fillStyle = renk; c.beginPath(); c.moveTo(0, 8); c.quadraticCurveTo(8, 18, 0, 24); c.quadraticCurveTo(-8, 18, 0, 8); c.fill(); yumusakNokta(c, -2, 15, 3, '#FFFFFF', 0.8); }
      else if (t === 'yildiz') { c.strokeStyle = renk; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 12); c.stroke(); c.fillStyle = metal(c, renk, 0, 18, 7); yildizYol(c, 0, 18, 7.5, 3.2, 5); c.fill(); }
      else if (t === 'kalp') { c.fillStyle = metal(c, renk, 0, 6, 7); kalpYol(c, 0, 7, 6.5); c.fill(); }
      else if (t === 'zincir') { c.strokeStyle = renk; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 36); c.stroke(); c.fillStyle = metal(c, renk, 0, 38, 3); c.beginPath(); c.arc(0, 38, 2.6, 0, Math.PI * 2); c.fill(); }
      else if (t === 'cicek') { for (let i = 0; i < 5; i++) { const a = i * 1.256; c.fillStyle = renk; c.beginPath(); c.arc(Math.cos(a) * 3.6, 3 + Math.sin(a) * 3.6, 3, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#F5C542'; c.beginPath(); c.arc(0, 3, 2.2, 0, Math.PI * 2); c.fill(); }
      c.restore();
    });
  }
  function gozlukCiz(c, p, renk) {
    const t = p.tip, gz = G.gozler, cam = t === 'yuvarlak' || t === 'kare' || t === 'mini' ? 'rgba(220,235,255,0.18)' : t === 'kalkan' ? rgba(renk, 0.45) : 'rgba(30,20,30,0.62)';
    c.save(); c.lineJoin = 'round';
    const cer = t === 'aviator' || t === 'mini' ? 2 : t === 'kare' || t === 'buyuk' ? 5 : 3.5;
    const sekil = (o) => {
      const x = o.x, y = o.y + 2, s = o.s; c.beginPath();
      if (t === 'yuvarlak') c.arc(x, y, 30, 0, Math.PI * 2);
      else if (t === 'mini') c.ellipse(x, y, 30, 18, 0, 0, Math.PI * 2);
      else if (t === 'kare' || t === 'buyuk') dik(c, x - (t === 'buyuk' ? 40 : 34), y - (t === 'buyuk' ? 30 : 24), t === 'buyuk' ? 80 : 68, t === 'buyuk' ? 60 : 46, 12);
      else if (t === 'kalp') kalpYol(c, x, y + 12, 30);
      else if (t === 'kedi') { c.moveTo(x - s * 30, y - 6); c.quadraticCurveTo(x, y - 26, x + s * 40, y - 22); c.quadraticCurveTo(x + s * 32, y + 26, x, y + 24); c.quadraticCurveTo(x - s * 34, y + 22, x - s * 30, y - 6); c.closePath(); }
      else if (t === 'aviator') { c.moveTo(x - s * 32, y - 18); c.lineTo(x + s * 34, y - 18); c.quadraticCurveTo(x + s * 36, y + 30, x + s * 4, y + 28); c.quadraticCurveTo(x - s * 30, y + 24, x - s * 32, y - 18); c.closePath(); }
      else if (t === 'kalkan') { dik(c, x - 40, y - 22, 80, 42, 18); }
    };
    if (t === 'kalkan') { c.beginPath(); dik(c, 96, 212, 168, 46, 20); const g = c.createLinearGradient(96, 212, 264, 258); g.addColorStop(0, rgba(renk, 0.55)); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, rgba(ton(renk, 0.2), 0.55)); c.fillStyle = g; c.fill(); c.strokeStyle = ton(renk, -0.3); c.lineWidth = 3; c.stroke(); c.restore(); return; }
    gz.forEach(o => { sekil(o); c.fillStyle = cam; c.fill(); c.strokeStyle = renk; c.lineWidth = cer; c.stroke(); c.save(); sekil(o); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 5; c.beginPath(); c.moveTo(o.x - 22, o.y - 6); c.lineTo(o.x - 6, o.y - 22); c.stroke(); c.restore(); });
    c.strokeStyle = renk; c.lineWidth = cer; c.beginPath(); c.moveTo(gz[0].x + 28, gz[0].y - 4); c.quadraticCurveTo(180, gz[0].y - 14, gz[1].x - 28, gz[1].y - 4); c.stroke();
    c.lineWidth = cer * 0.8; [-1, 1].forEach(s => { const o = gz[s < 0 ? 0 : 1]; c.beginPath(); c.moveTo(o.x + s * 33, o.y - 6); c.lineTo(180 + s * 98 * G.e, o.y + 4); c.stroke(); });
    c.restore();
  }
  function sapkaCiz(c, p, renk) {
    const t = p.tip, gr = (x0, x1) => kumas(c, renk, x0, x1, 0.6);
    c.save(); c.lineCap = 'round';
    if (t === 'bere' || t === 'ponpon') {
      c.fillStyle = gr(70, 290); c.beginPath(); c.moveTo(70, 150); c.bezierCurveTo(60, 20, 300, 20, 290, 150); c.closePath(); c.fill();
      c.strokeStyle = rgba(ton(renk, -0.3), 0.35); c.lineWidth = 2; for (let x = 84; x < 290; x += 10) { c.beginPath(); c.moveTo(x, 146); c.quadraticCurveTo(180 + (x - 180) * 0.55, 60, 180 + (x - 180) * 0.2, 36); c.stroke(); }
      c.fillStyle = ton(renk, -0.1); dik(c, 64, 126, 232, 34, 14); c.fill(); c.strokeStyle = rgba(ton(renk, -0.35), 0.4); for (let x = 70; x < 292; x += 6) { c.beginPath(); c.moveTo(x, 128); c.lineTo(x, 158); c.stroke(); }
      if (t === 'ponpon') { const r = rng(2); c.fillStyle = ton(renk, 0.25); for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, rr = r() * 26; c.beginPath(); c.arc(180 + Math.cos(a) * rr, 26 + Math.sin(a) * rr, 7, 0, Math.PI * 2); c.fill(); } }
    } else if (t === 'kova') {
      c.fillStyle = gr(80, 280); c.beginPath(); c.moveTo(92, 132); c.bezierCurveTo(92, 30, 268, 30, 268, 132); c.closePath(); c.fill();
      c.fillStyle = ton(renk, -0.06); c.beginPath(); c.moveTo(92, 124); c.lineTo(268, 124); c.lineTo(306, 172); c.quadraticCurveTo(180, 186, 54, 172); c.closePath(); c.fill();
      c.strokeStyle = rgba(ton(renk, -0.35), 0.45); c.lineWidth = 1.4; c.setLineDash([3, 2]); c.beginPath(); c.moveTo(62, 168); c.quadraticCurveTo(180, 180, 298, 168); c.stroke(); c.setLineDash([]);
    } else if (t === 'hasir' || t === 'fotr') {
      const genis = t === 'hasir' ? 150 : 124;
      c.fillStyle = gr(180 - genis, 180 + genis); c.beginPath(); c.ellipse(180, 120, genis, t === 'hasir' ? 30 : 22, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = gr(100, 260); c.beginPath(); c.moveTo(104, 122); c.bezierCurveTo(100, 28, 260, 28, 256, 122); c.quadraticCurveTo(180, 132, 104, 122); c.fill();
      if (t === 'fotr') { c.strokeStyle = rgba(ton(renk, -0.35), 0.6); c.lineWidth = 2; c.beginPath(); c.moveTo(180, 44); c.lineTo(180, 80); c.stroke(); }
      c.fillStyle = t === 'hasir' ? '#F07FA5' : ton(renk, -0.4); c.beginPath(); c.moveTo(104, 104); c.quadraticCurveTo(180, 116, 256, 104); c.lineTo(256, 120); c.quadraticCurveTo(180, 132, 104, 120); c.closePath(); c.fill();
      if (t === 'hasir') { c.strokeStyle = rgba(ton(renk, -0.3), 0.35); c.lineWidth = 1; for (let i = 1; i < 6; i++) { c.beginPath(); c.ellipse(180, 120, genis * (0.55 + i * 0.09), 30 * (0.55 + i * 0.09), 0, 0, Math.PI); c.stroke(); } }
    } else if (t === 'kep') {
      c.fillStyle = gr(84, 276); c.beginPath(); c.moveTo(84, 134); c.bezierCurveTo(80, 26, 280, 26, 276, 134); c.closePath(); c.fill();
      c.fillStyle = ton(renk, -0.15); c.beginPath(); c.ellipse(180, 136, 106, 22, 0, 0, Math.PI); c.fill();
      c.strokeStyle = rgba(ton(renk, -0.3), 0.45); c.lineWidth = 1.4; c.beginPath(); c.moveTo(180, 40); c.lineTo(180, 132); c.stroke();
      c.fillStyle = ton(renk, -0.2); c.beginPath(); c.arc(180, 40, 5, 0, Math.PI * 2); c.fill();
    } else if (t === 'fransiz') {
      c.save(); c.translate(196, 76); c.rotate(0.22); c.fillStyle = gr(-120, 120); c.beginPath(); c.ellipse(0, 0, 112, 40, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = ton(renk, -0.15); c.fillRect(-2, -48, 4, 12); c.restore();
      c.fillStyle = ton(renk, -0.1); c.beginPath(); c.ellipse(180, 106, 92, 14, 0.05, 0, Math.PI * 2); c.fill();
    } else if (t === 'bandana') {
      c.fillStyle = gr(80, 280); c.beginPath(); c.moveTo(78, 140); c.bezierCurveTo(70, 40, 290, 40, 282, 140); c.quadraticCurveTo(180, 112, 78, 140); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)'; const r = rng(3); for (let i = 0; i < 26; i++) { const x = 100 + r() * 160, y = 70 + r() * 50; c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = ton(renk, -0.1); c.beginPath(); c.moveTo(270, 130); c.lineTo(300, 120); c.lineTo(296, 150); c.closePath(); c.fill();
    }
    c.restore();
  }
  /* ---------------------------------------------------------------- fonlar */
  function fonCiz(c, id, zaman) {
    let g;
    if (id === 'mahalle') {
      g = c.createLinearGradient(0, 0, 0, FH); g.addColorStop(0, '#9FD2F2'); g.addColorStop(0.7, '#FCE3EC'); g.addColorStop(1, '#F7D3DE'); c.fillStyle = g; c.fillRect(0, 0, FW, FH);
      const u = 6; c.fillStyle = '#FFFFFF'; [[40, 60, 8], [230, 40, 10], [300, 90, 6]].forEach(([x, y, n]) => { for (let i = 0; i < n; i++) c.fillRect(x + i * u, y + (i % 3 === 0 ? -u : 0), u, u * 2); });
      const evler = [[-6, 10, 26, '#F4B8C8'], [54, 8, 30, '#CDBDF6'], [108, 12, 22, '#FFE28A'], [174, 9, 34, '#9FE3C4'], [234, 11, 26, '#FFC3A3'], [300, 10, 30, '#A9D6F2']];
      evler.forEach(([x, w, h, r]) => { const yy = 360 - h * u * 0.55; c.fillStyle = r; c.fillRect(x, yy, w * u, FH - yy); c.fillStyle = ton(r, -0.25); for (let i = 0; i < w / 2; i++) c.fillRect(x + i * u, yy - (i + 1) * u, (w - i * 2) * u, u); c.fillStyle = '#FFF6C2'; for (let wy = yy + 12; wy < 340; wy += 24) for (let wx = x + 10; wx < x + w * u - 14; wx += 20) c.fillRect(wx, wy, 8, 10); });
      c.fillStyle = '#C9B3A8'; c.fillRect(0, 384, FW, FH - 384); c.fillStyle = '#B49A8F'; for (let x = 0; x < FW; x += 24) c.fillRect(x, 384, 12, 6);
    } else if (id === 'gunbatimi') {
      g = c.createLinearGradient(0, 0, 0, FH); g.addColorStop(0, '#3A2E6E'); g.addColorStop(0.35, '#C25B9A'); g.addColorStop(0.58, '#F69A6E'); g.addColorStop(0.7, '#FFD28A'); g.addColorStop(0.71, '#E28A7A'); g.addColorStop(1, '#6E4A7E'); c.fillStyle = g; c.fillRect(0, 0, FW, FH);
      yumusakNokta(c, 180, 334, 120, '#FFE6A8', 0.5); c.fillStyle = '#FFE9B0'; c.beginPath(); c.arc(180, 334, 34, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(255,233,176,0.55)'; for (let i = 0; i < 9; i++) c.fillRect(180 - 30 + i * 2, 344 + i * 9, 60 - i * 4, 3);
      c.fillStyle = '#5A3E6E'; c.beginPath(); c.moveTo(0, 340); c.quadraticCurveTo(60, 300, 120, 336); c.lineTo(0, 340); c.fill(); c.beginPath(); c.moveTo(250, 338); c.quadraticCurveTo(310, 296, 360, 330); c.lineTo(360, 340); c.fill();
    } else if (id === 'paris') {
      g = c.createLinearGradient(0, 0, 0, FH); g.addColorStop(0, '#2E3C7E'); g.addColorStop(0.55, '#B884C6'); g.addColorStop(0.85, '#F7B9A6'); g.addColorStop(1, '#E7A2A0'); c.fillStyle = g; c.fillRect(0, 0, FW, FH);
      c.fillStyle = 'rgba(255,255,255,0.8)'; const r = rng(8); for (let i = 0; i < 30; i++) c.fillRect(r() * FW, r() * 180, 1.4, 1.4);
      c.save(); c.translate(282, 400); c.fillStyle = '#3B2E5A'; c.beginPath(); c.moveTo(-44, 0); c.quadraticCurveTo(-14, -90, -6, -280); c.lineTo(6, -280); c.quadraticCurveTo(14, -90, 44, 0); c.lineTo(28, 0); c.quadraticCurveTo(0, -46, -28, 0); c.closePath(); c.fill();
      c.fillRect(-26, -96, 52, 6); c.fillRect(-16, -176, 32, 5); c.fillRect(-1.5, -300, 3, 24);
      c.strokeStyle = 'rgba(255,214,150,0.5)'; c.lineWidth = 0.6; for (let y = -270; y < -10; y += 10) { const w = 6 + Math.pow((y + 280) / 280, 2.2) * 36; c.beginPath(); c.moveTo(-w, y); c.lineTo(w, y + 10); c.moveTo(w, y); c.lineTo(-w, y + 10); c.stroke(); }
      c.restore();
      c.fillStyle = '#4A3A6A'; [[0, 330, 70], [64, 350, 60], [120, 336, 54], [168, 356, 70]].forEach(([x, y, w]) => { c.fillRect(x, y, w, FH - y); c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + w / 2, y - 22); c.lineTo(x + w + 4, y); c.fill(); c.fillRect(x + 10, y - 26, 6, 14); });
      c.fillStyle = '#FFE2A0'; for (let x = 8; x < 230; x += 16) for (let y = 360; y < 420; y += 18) if ((x * y) % 7 < 3) c.fillRect(x, y, 6, 8);
      c.fillStyle = '#C9A8B8'; c.fillRect(0, 420, FW, 60);
    } else if (id === 'sahil') {
      g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#7CC4EE'); g.addColorStop(1, '#D4F0FA'); c.fillStyle = g; c.fillRect(0, 0, FW, 300);
      yumusakNokta(c, 70, 70, 60, '#FFF6C0', 0.8); c.fillStyle = '#FFF3A8'; c.beginPath(); c.arc(70, 70, 22, 0, Math.PI * 2); c.fill();
      g = c.createLinearGradient(0, 296, 0, 372); g.addColorStop(0, '#3FA6CF'); g.addColorStop(1, '#7FD3E6'); c.fillStyle = g; c.fillRect(0, 296, FW, 80);
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.4; for (let i = 0; i < 7; i++) { const y = 306 + i * 10, o = ((zaman || 0) / 90 + i * 20) % 40; c.beginPath(); for (let x = -40 + o; x < FW; x += 40) { c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - 3, x + 20, y); } c.stroke(); }
      g = c.createLinearGradient(0, 368, 0, FH); g.addColorStop(0, '#F7E3B8'); g.addColorStop(1, '#EBCB94'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 372); c.quadraticCurveTo(180, 360, 360, 376); c.lineTo(360, 480); c.lineTo(0, 480); c.fill();
      c.strokeStyle = '#7A5A3A'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(36, 440); c.quadraticCurveTo(30, 330, 58, 250); c.stroke();
      c.fillStyle = '#3E9A6A'; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55; c.beginPath(); c.moveTo(58, 250); c.quadraticCurveTo(58 + Math.cos(a) * 40, 250 + Math.sin(a) * 30 - 10, 58 + Math.cos(a) * 66, 250 + Math.sin(a) * 30 + 26); c.quadraticCurveTo(58 + Math.cos(a) * 36, 250 + Math.sin(a) * 20, 58, 254); c.fill(); }
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(286, 300); c.lineTo(300, 262); c.lineTo(300, 300); c.fill(); c.fillStyle = '#E86A6A'; c.fillRect(280, 300, 30, 4);
    } else {
      g = c.createRadialGradient(180, 200, 20, 180, 240, 360); g.addColorStop(0, '#FFF3F6'); g.addColorStop(0.6, '#F6D8E4'); g.addColorStop(1, '#D9C4E6'); c.fillStyle = g; c.fillRect(0, 0, FW, FH);
      [[48, 90], [312, 90]].forEach(([x, y]) => { yumusakNokta(c, x, y, 70, '#FFFFFF', 0.7); c.fillStyle = 'rgba(255,255,255,0.85)'; dik(c, x - 22, y - 30, 44, 60, 6); c.fill(); c.strokeStyle = 'rgba(150,130,160,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 30); c.lineTo(x, 440); c.stroke(); });
      g = c.createLinearGradient(0, 400, 0, FH); g.addColorStop(0, '#EBD3E0'); g.addColorStop(1, '#DCC0D3'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 410); c.quadraticCurveTo(180, 396, 360, 410); c.lineTo(360, 480); c.lineTo(0, 480); c.fill();
    }
    c.fillStyle = 'rgba(40,20,40,0.22)'; elips(c, 180, 463, 58, 8); c.fill();
  }

  /* ================================================================ ses yardımcıları */
  const sesSon = {};
  function sesSeyrek(ad, ms, fn) { const t = performance.now(); if (sesSon[ad] && t - sesSon[ad] < ms) return; sesSon[ad] = t; try { fn(); } catch (e) {} }
  function sesGurultu(sure, filtre, frek, guc, zarf) {
    try {
      if (!CD.ses || CD.ses.acik === false) return;
      const ac = ctx && ctx.ses.baglam && ctx.ses.baglam(); if (!ac) return;
      if (ac.state === 'suspended' && ac.resume) ac.resume();
      const n = Math.floor(ac.sampleRate * sure), buf = ac.createBuffer(1, n, ac.sampleRate), v = buf.getChannelData(0);
      for (let i = 0; i < n; i++) v[i] = (Math.random() * 2 - 1) * zarf(i / n);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = filtre; f.frequency.value = frek;
      const g = ac.createGain(); g.gain.value = guc;
      src.connect(f); f.connect(g); g.connect(ac.destination); src.start();
    } catch (e) {}
  }
  const sesDeklansor = () => { sesGurultu(0.06, 'bandpass', 2600, 0.5, u => Math.pow(1 - u, 3)); setTimeout(() => sesGurultu(0.09, 'bandpass', 1500, 0.4, u => Math.pow(1 - u, 2)), 90); };
  const sesCirt = () => sesGurultu(0.28, 'highpass', 1800, 0.35, u => (Math.random() < 0.35 ? 1 : 0.25) * (1 - u));
  const ses = (ad) => { try { if (ctx && ctx.ses[ad]) ctx.ses[ad](); } catch (e) {} };

  /* ================================================================ fırça ucu önbelleği */
  const uclar = new Map();
  function uc(renk, sert) {
    const key = renk + '|' + sert.toFixed(2); let t = uclar.get(key); if (t) return t;
    if (uclar.size > 40) uclar.clear();
    t = document.createElement('canvas'); t.width = t.height = 64; const c = t.getContext('2d');
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, rgba(renk, 1)); g.addColorStop(Math.max(0.01, sert), rgba(renk, 1)); g.addColorStop(1, rgba(renk, 0));
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); uclar.set(key, t); return t;
  }
  function adimla(a, b, aralik, fn) {
    const L = uzak(a.x, a.y, b.x, b.y), n = Math.max(1, Math.ceil(L / aralik));
    for (let i = 1; i <= n; i++) fn(lerp(a.x, b.x, i / n), lerp(a.y, b.y, i / n), L / n);
  }
  const icinde = (yol, x, y) => olcCtx().isPointInPath(yol, x, y);
  function silNokta(t, x, y, r, a) { const c = t._x; c.save(); c.globalCompositeOperation = 'destination-out'; yumusakNokta(c, x, y, r, '#000000', a); c.restore(); }
  function izgara(ad) { if (!S.izg[ad]) S.izg[ad] = hucreYeni(); return S.izg[ad]; }
  function animEkle(o) { o.t0 = performance.now(); S.anim.push(o); iste(); }

  /* ================================================================ araçlar */
  // her araç: { ilerleme(), basla(p,e), surukle(p,e,onceki), bitir(p,e), imlec(c,p), panel(kap) }
  const A = {};
  // ---------- TEMİZLİK
  A.pamuk = {
    imlec: 'pamuk',
    ilerleme: () => d.bitti.pamuk ? 1 : agirlikliTemiz(S.kirH, S.ovma),
    surukle(p, e, o) {
      adimla(o, p, 4, (x, y) => { silNokta(T.kir, x, y, 17, 0.32); hucreEkle(S.ovma, x, y, 15, 0.24); });
      S.pamukKir = Math.min(1, (S.pamukKir || 0) + 0.004);
      sesSeyrek('pamuk', 160, () => ses('slip'));
      if (this.ilerleme() > 0.96) { tuvalTemizle(T.kir); adimBitir('pamuk', 'Pırıl pırıl! Eski makyaj gitti.'); }
    }
  };
  A.kopuk = {
    imlec: () => S.kopukFaz === 'durula' ? 'su' : 'kopuk',
    ilerleme() {
      if (d.bitti.kopuk) return 1;
      const k = Math.min(1, kapsama(S.kopukH, S.yuzH, 1) / 0.85);
      return S.kopukFaz === 'kopur' ? k * 0.5 : 0.5 + 0.5 * Math.min(1, kapsama(S.durulaH, S.yuzH, 1) / 0.85);
    },
    panel(kap) {
      kap.append(cipSatiri([{ id: 'kopur', ad: '🫧 Köpürt' }, { id: 'durula', ad: '💧 Durula' }], S.kopukFaz, id => { if (id === 'durula' && kapsama(S.kopukH, S.yuzH, 1) < 0.5) { ctx.toast('Önce biraz daha köpürt 🫧'); return; } S.kopukFaz = id; panelYenile(); }));
    },
    basla(p) { S.donus = 0; S.sonYon = null; },
    surukle(p, e, o) {
      if (S.kopukFaz === 'kopur') {
        const yon = Math.atan2(p.y - o.y, p.x - o.x), L = uzak(p.x, p.y, o.x, o.y);
        if (L < 0.5) return;
        let df = 0; if (S.sonYon != null) { df = Math.abs(Math.atan2(Math.sin(yon - S.sonYon), Math.cos(yon - S.sonYon))); }
        S.sonYon = yon;
        const m = L * 0.03 + df * 0.55;
        const c = T.kopuk._x;
        adimla(o, p, 5, (x, y) => {
          if (!icinde(G.yuz, x, y)) return;
          for (let i = 0; i < 2; i++) {
            const bx = x + (Math.random() - 0.5) * 18, by = y + (Math.random() - 0.5) * 18, r = 2.5 + Math.random() * 5.5 * (0.5 + Math.min(1, m));
            const g = c.createRadialGradient(bx - r * 0.3, by - r * 0.3, 0.2, bx, by, r); g.addColorStop(0, 'rgba(255,255,255,0.98)'); g.addColorStop(0.75, 'rgba(244,247,255,0.95)'); g.addColorStop(1, 'rgba(200,214,236,0.85)');
            c.fillStyle = g; c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'rgba(255,255,255,1)'; c.beginPath(); c.arc(bx - r * 0.35, by - r * 0.35, r * 0.22, 0, Math.PI * 2); c.fill();
          }
          hucreEkle(S.kopukH, x, y, 13, 0.12 + m * 0.5, S.yuzH);
        });
        sesSeyrek('kopuk', 280, () => ses('kopuk'));
        if (df > 0.25) sesSeyrek('kopukEf', 500, () => { const q = ekrana(p); ctx.efekt.kopuk(q.x, q.y, 2); });
        if (kapsama(S.kopukH, S.yuzH, 1) >= 0.85) { S.kopukFaz = 'durula'; panelYenile(); ctx.toast('Köpük tamam! Şimdi suyla durula 💧'); }
      } else {
        adimla(o, p, 4, (x, y) => { silNokta(T.kopuk, x, y, 22, 0.42); silNokta(T.film, x, y, 22, 0.42); hucreEkle(S.durulaH, x, y, 18, 0.34, S.yuzH); });
        if (Math.random() < 0.5) animEkle({ tur: 'su', x: p.x + (Math.random() - 0.5) * 20, y: p.y, sure: 500 });
        sesSeyrek('su', 340, () => ses('su'));
        if (this.ilerleme() >= 0.995) { tuvalTemizle(T.kopuk); tuvalTemizle(T.film); adimBitir('kopuk', 'Tertemiz ve ferah!'); }
      }
    }
  };
  A.siyah = {
    imlec: 'parmak',
    ilerleme() { if (d.bitti.siyah) return 1; const b = S.bant; if (!b) return 0; return b.faz === 'cek' ? 0.6 + 0.4 * b.cek : 0.1 + b.p * 0.5; },
    basla(p) {
      const b = S.bant;
      if (!b) { S.bant = { faz: 'yapis', p: 0, gir: 0, cek: 0, yon: 1, dx: 0, dy: 0 }; animEkle({ tur: 'bantGir', sure: 260 }); ses('pop'); ctx.toast('Şimdi bandın üstünü ovarak bastır'); return; }
      if (b.faz === 'hazir' && uzak(p.x, p.y, 180, 272) < 48) { b.faz = 'cek'; b.bx = p.x; b.by = p.y; b.cek = 0; }
    },
    surukle(p, e, o) {
      const b = S.bant; if (!b) return;
      if (b.faz === 'yapis') {
        if (icinde(bantYolu(b), p.x, p.y)) b.p = Math.min(1, b.p + uzak(p.x, p.y, o.x, o.y) * 0.006);
        sesSeyrek('bastir', 200, () => ses('tik'));
        if (b.p >= 1) { b.faz = 'hazir'; ses('tink'); ctx.toast('Yapıştı! Şimdi bir ucundan tutup çek'); }
      } else if (b.faz === 'cek') {
        b.dx = p.x - b.bx; b.dy = p.y - b.by; b.yon = b.dx < 0 ? -1 : 1;
        b.cek = sinir(Math.hypot(b.dx, b.dy) / 80, 0, 1);
        sesSeyrek('cekgeril', 140, () => ses('tik'));
        if (b.cek >= 1) {
          const noktalar = S.siyah.map(n => [n.x, n.y, n.r]);
          S.siyah = []; S.bant = null; sesCirt(); ses('pit');
          animEkle({ tur: 'bantUcus', sure: 1700, noktalar, yon: b.yon });
          S.sik = performance.now() + 380;
          const q = ekrana({ x: 180, y: 272 }); ctx.efekt.yildiz(q.x, q.y, 6);
          adimBitir('siyah', 'Şuna bak, bütün siyah noktalar bantta!');
        }
      }
    },
    bitir() { const b = S.bant; if (b && b.faz === 'cek' && b.cek < 1) { b.faz = 'hazir'; animEkle({ tur: 'bantGeri', sure: 220, bas: b.cek }); } }
  };
  A.sivilce = {
    imlec: () => S.sivAlt === 'pamuk' ? 'pamuk' : S.sivAlt === 'bant' ? 'parmak' : 'cimbiz',
    ilerleme() {
      if (d.bitti.sivilce || !S.sivilce.length) return 1;
      const t = S.sivilce.reduce((a, p) => a + (p.d === 'temiz' ? 1 : p.d === 'iz' ? 0.6 + 0.4 * (1 - p.iz) : 0.3 * p.bant), 0);
      return t / S.sivilce.length;
    },
    panel(kap) { kap.append(cipSatiri([{ id: 'cimbiz', ad: '🤏 Cımbız' }, { id: 'bant', ad: '🩹 Sivilce bandı' }, { id: 'pamuk', ad: '☁️ Pamuk' }], S.sivAlt, id => { S.sivAlt = id; panelYenile(); })); },
    basla(p) {
      const yakin = S.sivilce.filter(q => q.d !== 'temiz').sort((a, b) => uzak(a.x, a.y, p.x, p.y) - uzak(b.x, b.y, p.x, p.y))[0];
      if (!yakin || uzak(yakin.x, yakin.y, p.x, p.y) > 18) return;
      if (S.sivAlt === 'cimbiz' && yakin.d === 'var' && !yakin.bant) { S.sikilan = yakin; iste(); }
      else if (S.sivAlt === 'bant' && yakin.d === 'var') {
        if (!yakin.bant) { yakin.bant = 0.02; ses('pop'); }
        else if (yakin.bant >= 1) { yakin.d = 'temiz'; yakin.bant = 0; sesCirt(); ses('tink'); animEkle({ tur: 'bantSoy', x: yakin.x, y: yakin.y, sure: 700 }); this.kontrol(); }
        else ctx.toast('Biraz daha beklesin, bant işini yapıyor');
      } else if (S.sivAlt === 'cimbiz' && yakin.d === 'iz') { S.sivAlt = 'pamuk'; panelYenile(); ctx.toast('Şimdi pamukla nazikçe sil'); }
    },
    surukle(p, e, o) {
      if (S.sivAlt !== 'pamuk') return;
      adimla(o, p, 4, (x, y) => S.sivilce.forEach(q => { if (q.d === 'iz' && uzak(q.x, q.y, x, y) < 14) { q.iz -= 0.05; if (q.iz <= 0) { q.d = 'temiz'; ses('tink'); this.kontrol(); } } }));
      sesSeyrek('pamuk', 180, () => ses('slip'));
    },
    bitir() { if (S.sikilan && S.sikilan.d === 'var') S.sikilan.geri = true; S.sikilan = null; },
    pit(q) {
      q.d = 'iz'; q.p = 0; q.iz = 1; ses('pit'); setTimeout(() => ses('pop'), 40);
      S.sik = performance.now() + 320;
      animEkle({ tur: 'pit', x: q.x, y: q.y, sure: 600 });
      const z = ekrana(q); ctx.efekt.yildiz(z.x, z.y, 3);
      if (S.sivilce.every(v => v.d !== 'var')) { S.sivAlt = 'pamuk'; panelYenile(); ctx.toast('Hepsi pıt dedi! Şimdi pamukla izleri sil'); }
      this.kontrol();
    },
    kontrol() { if (S.sivilce.every(v => v.d === 'temiz')) adimBitir('sivilce', 'Cilt rahatladı, iz bile kalmadı.'); }
  };
  A.kas = {
    imlec: 'cimbiz',
    ilerleme: () => d.bitti.kas || !S.kil.length ? 1 : S.kil.filter(h => h.al > 0).length / S.kil.length,
    basla(p) { this.cek(p); },
    surukle(p) { this.cek(p); },
    cek(p) {
      let en = null, ed = 13;
      S.kil.forEach(h => { if (h.al > 0) return; const dd = uzak(h.x + Math.cos(h.a) * h.l * 0.5, h.y + Math.sin(h.a) * h.l * 0.5, p.x, p.y); if (dd < ed) { ed = dd; en = h; } });
      if (!en) return;
      en.al = 0.001; ses('tik'); setTimeout(() => ses('pit'), 30);
      if (S.kil.every(h => h.al > 0)) setTimeout(() => adimBitir('kas', 'Kaşlar kusursuz bir çerçeve oldu.'), 300);
    }
  };
  // ---------- BAKIM
  function yuzBoyaAdim(ad, p, o, r, renk, a, esik) {
    const g = izgara(ad);
    adimla(o, p, 4, (x, y) => { if (!icinde(G.yuz, x, y)) return; hucreEkle(g, x, y, r * 0.8, 0.3, S.yuzH); });
    if (renk && Math.random() < 0.18) animEkle({ tur: 'yildizcik', x: p.x + (Math.random() - 0.5) * 16, y: p.y + (Math.random() - 0.5) * 12, sure: 520 });
    return Math.min(1, kapsama(g, S.yuzH, 1) / esik);
  }
  A.tonik = {
    imlec: 'pamukPembe',
    ilerleme: () => d.bitti.tonik ? 1 : Math.min(1, kapsama(izgara('tonik'), S.yuzH, 1) / 0.78),
    surukle(p, e, o) {
      const v = yuzBoyaAdim('tonik', p, o, 18, '#FFF6F2', 0.035, 0.78);
      sesSeyrek('tonik', 300, () => ses('su'));
      if (v >= 1) adimBitir('tonik', 'Cilt ferahladı, gözenekler sıkılaştı.');
    }
  };
  A.serum = {
    imlec: 'damlalik',
    ilerleme() { if (d.bitti.serum) return 1; return 0.3 * Math.min(3, S.serumDamla) / 3 + 0.7 * Math.min(1, kapsama(izgara('serum'), S.yuzH, 1) / 0.7); },
    basla(p) {
      if (S.serumDamla < 3 && icinde(G.yuz, p.x, p.y)) {
        S.serumDamla++; animEkle({ tur: 'damla', x: p.x, y: p.y, sure: 420 });
        setTimeout(() => { if (!T) return; yumusakNokta(T.isilti._x, p.x, p.y, 15, '#FFE2A8', 0.4); ses('blop'); iste(); }, ctx.azHareket ? 0 : 400);
        if (S.serumDamla === 3) setTimeout(() => ctx && ctx.toast('Şimdi parmak uçlarınla yedir'), 500);
        S.damlaBasti = true;
      } else S.damlaBasti = false;
    },
    surukle(p, e, o) {
      if (S.serumDamla < 3) return;
      const v = yuzBoyaAdim('serum', p, o, 20, '#FFF0D4', 0.03, 0.7);
      sesSeyrek('serum', 320, () => ses('slip'));
      if (v >= 1) adimBitir('serum', 'Serum içine işledi, cilt ipek gibi.');
    }
  };
  const KIL = [{ ad: 'Yeşil kil', r: '#9DB89A' }, { ad: 'Pembe kil', r: '#E8B4B8' }, { ad: 'Beyaz kil', r: '#E6DED0' }, { ad: 'Kömür', r: '#5E5B60' }];
  A.kil = {
    imlec: () => S.kilFaz === 'sil' ? 'sunger' : 'firca',
    ilerleme() {
      if (d.bitti.kil) return 1;
      if (S.kilFaz === 'sur') return 0.4 * Math.min(1, kapsama(izgara('kil'), S.yuzH, 1) / 0.82);
      if (S.kilFaz === 'kuru') return 0.4 + 0.2 * Math.min(1, (performance.now() - S.kilT0) / 6000);
      return 0.6 + 0.4 * Math.min(1, kapsama(izgara('kilSil'), S.kilMaske, 1) / 0.85);
    },
    panel(kap) {
      if (S.kilFaz !== 'sur') { kap.append(ctx.el('p.guzellik-ipucu', S.kilFaz === 'kuru' ? 'Maske kuruyor… biraz rahatla 😌' : 'Kuruyup çatladı! Süngerle sil.')); return; }
      kap.append(renkSatiri(KIL.map(k => k.r), S.kilRenk, r => { S.kilRenk = r; panelYenile(); }, KIL.map(k => k.ad)));
    },
    surukle(p, e, o) {
      if (S.kilFaz === 'sur') {
        const c = T.maske._x, g = izgara('kil');
        adimla(o, p, 3, (x, y) => {
          if (!icinde(G.yuz, x, y)) return;
          c.fillStyle = S.kilRenk; c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.fill();
          c.fillStyle = rgba(ton(S.kilRenk, -0.2), 0.35); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 18, 0.8, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(x - 4, y - 4, 4, 0, Math.PI * 2); c.fill();
          hucreEkle(g, x, y, 10, 0.5, S.yuzH);
        });
        c.save(); c.globalCompositeOperation = 'destination-out'; c.fill(S.maskeHaric); c.restore();
        sesSeyrek('kil', 220, () => ses('slip'));
        if (kapsama(g, S.yuzH, 1) >= 0.82) { S.kilFaz = 'kuru'; S.kilT0 = performance.now(); S.kilAsama = 0; S.kilMaske = new Uint8Array(g.length); g.forEach((v, i) => { S.kilMaske[i] = v >= 1 ? 1 : 0; }); panelYenile(); ctx.toast('Şimdi kurumasını bekle'); }
      } else if (S.kilFaz === 'sil') {
        const g = izgara('kilSil');
        adimla(o, p, 4, (x, y) => { silNokta(T.maske, x, y, 20, 0.45); hucreEkle(g, x, y, 17, 0.32, S.kilMaske); });
        sesSeyrek('sunger', 300, () => ses('su'));
        if (this.ilerleme() >= 0.995) { tuvalTemizle(T.maske); d.bakim.kizarik *= 0.6; const s = T.isilti._x; s.save(); s.clip(G.yuz); yumusakNokta(s, 175, 230, 150, '#FFF6F0', 0.1); s.restore(); adimBitir('kil', 'Gözenekler arındı, cilt pürüzsüz.'); }
      }
    },
    guncelle(t) {
      if (S.kilFaz !== 'kuru') return false;
      const u = (t - S.kilT0) / 6000, a = Math.floor(u * 4);
      if (a > S.kilAsama && a < 4) { S.kilAsama = a; const c = T.maske._x; c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,252,244,0.14)'; c.fillRect(0, 0, FW, FH); c.restore(); }
      if (u >= 1) {
        const c = T.maske._x; c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round';
        S.catlak.forEach(yol => { c.strokeStyle = 'rgba(90,80,70,0.55)'; c.lineWidth = 1.3; c.beginPath(); yol.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 0.6; c.beginPath(); yol.forEach(([x, y], i) => i ? c.lineTo(x + 0.8, y + 0.8) : c.moveTo(x + 0.8, y + 0.8)); c.stroke(); });
        c.restore(); S.kilFaz = 'sil'; ses('catir'); panelYenile(); ctx.toast('Çatladı! Şimdi süngerle sil');
      }
      return true;
    }
  };
  A.ped = {
    imlec: 'parmak',
    ilerleme() { if (d.bitti.ped) return 1; if (!S.pedler) return 0; if (S.pedFaz === 'bekle') return 0.2 + 0.6 * Math.min(1, (performance.now() - S.pedT0) / 4000); return 0.8 + 0.1 * (2 - S.pedler.filter(Boolean).length); },
    basla(p) {
      if (!S.pedler) { if (p.y > 200 && p.y < 320) { S.pedler = [1, 1]; S.pedFaz = 'bekle'; S.pedT0 = performance.now(); ses('blop'); ctx.toast('Pedler serinletiyor… biraz beklesin'); } return; }
      if (S.pedFaz === 'bekle') { ctx.toast('Biraz daha beklesin 😌'); return; }
      G.gozler.forEach((g, i) => { if (S.pedler[i] && uzak(p.x, p.y, g.x, g.y + 22) < 34) { S.pedler[i] = 0; ses('pop'); animEkle({ tur: 'pedUcus', i, sure: 600 }); } });
      if (!S.pedler[0] && !S.pedler[1]) { S.pedler = null; d.bakim.yorgun = 0; adimBitir('ped', 'Göz altları dinlendi, ışıl ışıl bakıyor.'); }
    },
    guncelle(t) { if (S.pedFaz === 'bekle' && t - S.pedT0 > 4000) { S.pedFaz = 'hazir'; ses('tink'); ctx.toast('Şimdi pedlere dokunup çıkar'); panelYenile(); } return S.pedFaz === 'bekle'; }
  };
  A.buz = {
    imlec: 'rulo',
    ilerleme: () => d.bitti.buz ? 1 : Math.min(1, kapsama(izgara('buz'), S.yuzH, 1) / 0.72),
    basla() { if (S.kizBas == null) S.kizBas = d.bakim.kizarik; },
    surukle(p, e, o) {
      yuzBoyaAdim('buz', p, o, 15, null, 0, 0.72);
      const v = this.ilerleme(); d.bakim.kizarik = Math.min(d.bakim.kizarik, (S.kizBas == null ? 1 : S.kizBas) * (1 - v));
      if (Math.random() < 0.35) animEkle({ tur: 'buz', x: p.x + (Math.random() - 0.5) * 24, y: p.y + (Math.random() - 0.5) * 16, sure: 700 });
      sesSeyrek('buz', 420, () => ses('tink'));
      if (v >= 1) { d.bakim.kizarik = 0; adimBitir('buz', 'Serin ve rahat; kızarıklık indi.'); }
    }
  };
  A.nem = {
    imlec: () => S.nemNokta < 5 ? 'krem' : 'parmak',
    ilerleme() { if (d.bitti.nem) return 1; return 0.25 * Math.min(5, S.nemNokta) / 5 + 0.75 * Math.min(1, kapsama(izgara('nem'), S.yuzH, 1) / 0.72); },
    basla(p) {
      if (S.nemNokta < 5 && icinde(G.yuz, p.x, p.y)) {
        S.nemNokta++; const c = T.krem._x;
        const g = c.createRadialGradient(p.x - 2, p.y - 2, 0.5, p.x, p.y, 7); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.8, '#F7F2F4'); g.addColorStop(1, 'rgba(225,215,225,0.9)');
        c.fillStyle = g; c.beginPath(); c.ellipse(p.x, p.y, 7, 6, 0, 0, Math.PI * 2); c.fill(); ses('blop');
        if (S.nemNokta === 5) ctx.toast('Şimdi kremi yay');
      }
    },
    surukle(p, e, o) {
      if (S.nemNokta < 5) return;
      adimla(o, p, 4, (x, y) => silNokta(T.krem, x, y, 16, 0.22));
      const v = yuzBoyaAdim('nem', p, o, 18, '#FFF8F4', 0.02, 0.72);
      sesSeyrek('nem', 300, () => ses('slip'));
      if (v >= 1) { tuvalTemizle(T.krem); adimBitir('nem', 'Nem yerinde, cilt dolgun ve yumuşak.'); }
    }
  };
  A.balm = {
    imlec: 'parmak',
    ilerleme: () => d.bitti.balm ? 1 : Math.min(1, kapsama(izgara('balm'), S.dudakH, 1) / 0.8),
    surukle(p, e, o) {
      const g = izgara('balm');
      adimla(o, p, 3, (x, y) => hucreEkle(g, x, y, 9, 0.35, S.dudakH));
      const v = this.ilerleme(); d.bakim.kuru = Math.min(d.bakim.kuru, 1 - v);
      sesSeyrek('balm', 260, () => ses('slip'));
      if (v >= 1) { d.bakim.kuru = 0; adimBitir('balm', 'Dudaklar yumuşacık oldu.'); }
    }
  };
  A.sacmaske = {
    imlec: 'firca',
    ilerleme: () => d.bitti.sacmaske ? 1 : d.bakim.sacParlak,
    surukle(p, e, o) {
      if (icinde(G.yuz, p.x, p.y)) return;
      d.bakim.sacParlak = Math.min(1, d.bakim.sacParlak + uzak(p.x, p.y, o.x, o.y) * 0.0025);
      if (Math.random() < 0.3) animEkle({ tur: 'yildizcik', x: p.x, y: p.y, sure: 600 });
      sesSeyrek('sacm', 300, () => ses('slip'));
      if (d.bakim.sacParlak >= 1) adimBitir('sacmaske', 'Saçlar ışıl ışıl!');
    }
  };

  /* ---------- MAKYAJ: boyama */
  function bolgeYolu(b) { return b === 'kas' ? G.kasBolge : b === 'goz' ? G.gozBolge : b === 'dudak' ? G.dudakYol.tum : b === 'dudakHat' ? G.dudakHat.tum : G.yuz; }
  function fircaBasla(urunId, renk, bitis) {
    const u = URUNLER[urunId], ay = S.ayar[urunId] || {};
    geriKaydet(true);
    S.firca = { aktif: true, urun: urunId, renk, bitis: bitis || 'mat', r: ay.boy || u.boy, yog: ay.yog || u.yog, sert: u.sert, silgi: !!u.silgi, x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    tuvalTemizle(T.firca);
    const fx = T.firca._x; fx.save(); fx.clip(bolgeYolu(u.bolge));
  }
  function fircaDamga(x, y) {
    const f = S.firca; if (!f) return;
    if (f.silgi) { silNokta(T.makyaj, x, y, f.r, f.yog * 0.6); return; }
    const t = uc(f.renk, f.sert); T.firca._x.drawImage(t, x - f.r, y - f.r, f.r * 2, f.r * 2);
    f.x0 = Math.min(f.x0, x - f.r); f.y0 = Math.min(f.y0, y - f.r); f.x1 = Math.max(f.x1, x + f.r); f.y1 = Math.max(f.y1, y + f.r);
  }
  function fircaBitir() {
    const f = S.firca; if (!f) return;
    T.firca._x.restore();
    if (!f.silgi && f.x1 > f.x0) {
      const m = T.makyaj._x; m.save(); m.globalAlpha = f.yog; m.drawImage(T.firca, 0, 0, FW, FH); m.restore();
      if (f.bitis !== 'mat') isiltiSerp(f);
      grupKullan(f.urun);
      if (f.urun === 'ruj') d.mk.rujVar = true;
    }
    tuvalTemizle(T.firca); f.aktif = false; S.firca = null;
    mkKaydetGec(); kaydetGec(); ilerlemeGuncelle();
  }
  function isiltiSerp(f) {
    const x0 = Math.max(0, Math.floor(f.x0 * RY)), y0 = Math.max(0, Math.floor(f.y0 * RY)), w = Math.min(T.firca.width - x0, Math.ceil((f.x1 - f.x0) * RY)), h = Math.min(T.firca.height - y0, Math.ceil((f.y1 - f.y0) * RY));
    if (w < 2 || h < 2) return;
    let v; try { v = T.firca._x.getImageData(x0, y0, w, h).data; } catch (e) { return; }
    const m = T.makyaj._x, n = Math.min(180, Math.max(20, Math.round(w * h / 900)));
    for (let i = 0; i < n * 3; i++) {
      const px = Math.floor(Math.random() * w), py = Math.floor(Math.random() * h); if (v[(py * w + px) * 4 + 3] < 90) continue;
      const x = (x0 + px) / RY, y = (y0 + py) / RY;
      if (f.bitis === 'glitter') { m.fillStyle = sec(Math.random, ['#FFFFFF', ton(f.renk, 0.5), '#FFE7A8', '#E8DCFF']); yildizYol(m, x, y, 0.8 + Math.random() * 1.6, 0.3, 4, Math.random()); m.fill(); }
      else { m.fillStyle = 'rgba(255,255,255,' + (0.25 + Math.random() * 0.35) + ')'; m.beginPath(); m.arc(x, y, 0.4 + Math.random() * 0.7, 0, Math.PI * 2); m.fill(); }
    }
  }
  function grupKullan(urun) { for (const g in MAKYAJ_GRUP) if (MAKYAJ_GRUP[g].includes(urun)) d.mk.kullanildi[g] = true; }
  function makyajAraci(id) {
    const u = URUNLER[id];
    if (u.ozel) return OZEL[u.ozel];
    return {
      imlec: 'firca', urun: id,
      panel(kap) { makyajPanel(kap, id); },
      basla(p) { const r = this.renk(); fircaBasla(id, r.r, r.f); fircaDamga(p.x, p.y); sesSeyrek('firca', 120, () => ses('slip')); },
      surukle(p, e, o) { if (!S.firca) return; adimla(o, p, Math.max(1, S.firca.r * 0.28), (x, y) => fircaDamga(x, y)); sesSeyrek('firca', 170, () => ses('slip')); },
      bitir() { fircaBitir(); },
      renk() { const ay = S.ayar[id] || {}; if (u.palet) { const pal = FAR_PALET[ay.palet || 0]; return pal.renkler[ay.renk || 0]; } return u.renkler ? u.renkler[sinir(ay.renk || 0, 0, u.renkler.length - 1)] : { r: '#000', f: 'mat' }; }
    };
  }
  const OZEL = {
    kasjel: {
      imlec: 'maskara', panel(kap) { kap.append(ctx.el('p.guzellik-ipucu', URUNLER.kasjel.ipucu)); },
      basla() { geriKaydet(false); },
      surukle(p, e, o) { if (!icinde(G.kasBolge, p.x, p.y) && !G.kaslar.some(b => uzak(p.x, p.y, b.tepe[0], b.tepe[1]) < 36)) return; d.mk.kasJel = Math.min(1, d.mk.kasJel + uzak(p.x, p.y, o.x, o.y) * 0.008); grupKullan('kasjel'); sesSeyrek('jel', 200, () => ses('slip')); },
      bitir() { kaydetGec(); ilerlemeGuncelle(); }
    },
    liner: {
      imlec: 'kalem',
      panel(kap) {
        const L = d.mk.liner;
        kap.append(cipSatiri(LINER, L.tip, id => { geriKaydet(false); if (L.tip === 'yok' || id === 'yok') L.ilerleme = [0, 0]; L.tip = id; kaydetGec(); panelYenile(); iste(); if (id !== 'yok') ctx.toast('Şimdi kirpik dibinde içten dışa kaydır'); }));
        kap.append(renkSatiri(LINER_RENK, L.renk, r => { L.renk = r; kaydetGec(); panelYenile(); iste(); }));
        kap.append(ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => { geriKaydet(false); if (L.tip === 'yok') L.tip = 'kanat'; L.ilerleme = [1, 1]; grupKullan('eyeliner'); ses('tink'); kaydetGec(); panelYenile(); iste(); ilerlemeGuncelle(); } }, 'Tek dokunuşla çek'));
      },
      basla() { geriKaydet(false); if (d.mk.liner.tip === 'yok') { d.mk.liner.tip = 'kanat'; panelYenile(); } },
      surukle(p) {
        const L = d.mk.liner;
        G.gozler.forEach((g, i) => {
          if (Math.abs(p.y - g.y) > 26 || Math.abs(p.x - g.x) > g.W * 0.8) return;
          const t = sinir((p.x - g.ic[0]) / (g.dis[0] - g.ic[0]), 0, 1);
          if (t >= L.ilerleme[i] - 0.2) { L.ilerleme[i] = Math.max(L.ilerleme[i], t > 0.93 ? 1 : t + 0.04); grupKullan('eyeliner'); sesSeyrek('liner', 120, () => ses('slip')); }
        });
      },
      bitir() { kaydetGec(); ilerlemeGuncelle(); }
    },
    rimel: {
      imlec: 'maskara',
      panel(kap) { kap.append(renkSatiri(RIMEL_RENK, d.mk.rimelRenk, r => { d.mk.rimelRenk = r; kaydetGec(); panelYenile(); iste(); }, ['Siyah', 'Kahve', 'Lacivert', 'Bordo'])); kap.append(ctx.el('p.guzellik-ipucu', 'Hacim: %' + Math.round((d.mk.rimel || 0) * 100))); },
      basla() { geriKaydet(false); },
      surukle(p, e, o) {
        const dy = o.y - p.y; if (dy <= 0) return;
        const yakin = G.gozler.some(g => Math.abs(p.x - g.x) < g.W * 0.75 && p.y < g.y + 6 && p.y > g.y - 44);
        if (!yakin) return;
        d.mk.rimel = Math.min(1, (d.mk.rimel || 0) + dy * 0.009); grupKullan('rimel');
        sesSeyrek('rimel', 150, () => ses('slip'));
        if (d.mk.rimel >= 1) sesSeyrek('rimelTam', 3000, () => ses('tink'));
      },
      bitir() { kaydetGec(); panelYenile(); ilerlemeGuncelle(); }
    },
    kirpik: {
      imlec: 'parmak',
      panel(kap) { kap.append(cipSatiri(KIRPIK, d.mk.kirpik, id => { geriKaydet(false); d.mk.kirpik = id; if (id !== 'yok') { grupKullan('kirpik'); ses('tink'); G.gozler.forEach(g => animEkle({ tur: 'yildizcik', x: g.dis[0], y: g.dis[1] - 6, sure: 600 })); } kaydetGec(); panelYenile(); iste(); ilerlemeGuncelle(); })); }
    },
    parlatici: {
      imlec: 'maskara',
      panel(kap) { kap.append(renkSatiri(PARLATICI.map(p => p.r), d.mk.parlaticiRenk, r => { d.mk.parlaticiRenk = r; kaydetGec(); panelYenile(); iste(); }, PARLATICI.map(p => p.ad))); },
      basla() { geriKaydet(false); },
      surukle(p, e, o) { if (!icinde(G.dudakHat.tum, p.x, p.y)) return; d.mk.parlatici = Math.min(1, d.mk.parlatici + uzak(p.x, p.y, o.x, o.y) * 0.012); grupKullan('parlatici'); sesSeyrek('gloss', 200, () => ses('slip')); },
      bitir() { kaydetGec(); ilerlemeGuncelle(); }
    },
    sus: {
      imlec: 'parmak',
      panel(kap) {
        const ay = S.ayar.sus || (S.ayar.sus = { tip: 'cil', renk: 0 });
        kap.append(cipSatiri(SUSLER.map(s => ({ id: s.id, ad: s.ikon + ' ' + s.ad })), ay.tip, id => { ay.tip = id; ay.renk = 0; panelYenile(); }));
        const s = SUSLER.find(x => x.id === ay.tip);
        if (s && s.renkler) kap.append(renkSatiri(s.renkler, s.renkler[ay.renk || 0], r => { ay.renk = s.renkler.indexOf(r); panelYenile(); }));
        else kap.append(ctx.el('p.guzellik-ipucu', 'Parmağını sürükleyerek serp.'));
      },
      basla(p) {
        geriKaydet(false);
        const ay = S.ayar.sus || { tip: 'cil' }, s = SUSLER.find(x => x.id === ay.tip);
        if (s.serp) { this.serp(p); return; }
        const i = d.mk.susler.findIndex(q => uzak(q.x, q.y, p.x, p.y) < 7);
        if (i >= 0) { d.mk.susler.splice(i, 1); ses('pop'); }
        else if (d.mk.susler.length < 40) { d.mk.susler.push({ t: s.id, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, renk: s.renkler[ay.renk || 0] }); ses('tink'); grupKullan('sus'); }
        else ctx.toast('Yüz doldu; biraz yer aç 💎');
        kaydetGec(); ilerlemeGuncelle();
      },
      surukle(p) { const ay = S.ayar.sus || { tip: 'cil' }; if (SUSLER.find(x => x.id === ay.tip).serp) this.serp(p); },
      serp(p) {
        const ay = S.ayar.sus;
        if (S.sonSerp && uzak(S.sonSerp.x, S.sonSerp.y, p.x, p.y) < 5) return; S.sonSerp = { x: p.x, y: p.y };
        if (ay.tip === 'cil' && d.mk.cil.length < 240) for (let i = 0; i < 2; i++) d.mk.cil.push([+(p.x + (Math.random() - 0.5) * 16).toFixed(1), +(p.y + (Math.random() - 0.5) * 12).toFixed(1), +(0.6 + Math.random() * 0.8).toFixed(2)]);
        if (ay.tip === 'glitter' && d.mk.glit.length < 240) for (let i = 0; i < 2; i++) d.mk.glit.push([+(p.x + (Math.random() - 0.5) * 16).toFixed(1), +(p.y + (Math.random() - 0.5) * 12).toFixed(1), +(0.8 + Math.random() * 1.6).toFixed(2), sec(Math.random, ['#FFFFFF', '#FFE7A8', '#FFC2E2', '#C9E8FF', '#E3D2FF'])]);
        grupKullan('sus'); sesSeyrek('serp', 160, () => ses('tink'));
      },
      bitir() { S.sonSerp = null; kaydetGec(); ilerlemeGuncelle(); }
    }
  };
  /* ---------- hazır görünümler */
  function bolgeBoya(yol, fn) { const m = T.makyaj._x; m.save(); m.clip(yol); fn(m); m.restore(); }
  function hazirUygula(id) {
    geriKaydet(true);
    tuvalTemizle(T.makyaj); const eski = d.mk; d.mk = mkVarsayilan(); d.mk.kullanildi = {}; void eski;
    const g = G, ten = d.k.ten, mk = d.mk;
    const fon = (a) => bolgeBoya(g.yuz, m => { m.fillStyle = rgba(karis(ten, '#F2CDB3', 0.25), a); m.fill(g.yuz); });
    const yanak = (renk, a, r) => bolgeBoya(g.yuz, m => g.yanaklar.forEach(([x, y]) => { m.save(); m.translate(x, y - 4); m.scale(1.3, 0.85); yumusakNokta(m, 0, 0, r || 30, renk, a); m.restore(); }));
    const kontur = (a) => bolgeBoya(g.yuz, m => g.yanaklar.forEach(([x, y]) => { const s = x < 180 ? -1 : 1; m.save(); m.translate(x + s * 14, y + 14); m.rotate(s * -0.45); m.scale(1.8, 0.45); yumusakNokta(m, 0, 0, 24, '#7E5A48', a); m.restore(); }));
    const isik = (renk, a) => bolgeBoya(g.yuz, m => { g.yanaklar.forEach(([x, y]) => { const s = x < 180 ? -1 : 1; m.save(); m.translate(x + s * 6, y - 22); m.rotate(s * 0.5); m.scale(1.6, 0.5); yumusakNokta(m, 0, 0, 16, renk, a); m.restore(); }); m.save(); m.translate(180, 256); m.scale(0.16, 1); yumusakNokta(m, 0, 0, 22, renk, a * 0.6); m.restore(); yumusakNokta(m, 180, 304, 4, renk, a * 0.7); });
    const far = (lid, dis, sim, a) => bolgeBoya(g.gozBolge, m => g.gozler.forEach(o => { const s = o.s; if (lid) yumusakNokta(m, o.x, o.y - 12, 26, lid, a); if (dis) { yumusakNokta(m, o.dis[0] - s * 4, o.dis[1] - 9, 16, dis, a * 0.9); yumusakNokta(m, o.dis[0] + s * 4, o.dis[1] - 3, 11, dis, a * 0.7); } if (sim) { yumusakNokta(m, o.x, o.y - 12, 11, sim, 0.6); for (let i = 0; i < 26; i++) { m.fillStyle = 'rgba(255,255,255,0.7)'; m.beginPath(); m.arc(o.x + (Math.random() - 0.5) * 22, o.y - 12 + (Math.random() - 0.5) * 9, 0.6, 0, Math.PI * 2); m.fill(); } } }));
    const ruj = (renk, a, bitis) => { bolgeBoya(g.dudakYol.tum, m => { m.fillStyle = rgba(renk, a); m.fill(g.dudakYol.tum); }); mk.rujVar = true; mk.rujBitis = bitis; };
    const hepsi = (gruplar) => gruplar.forEach(k => { mk.kullanildi[k] = true; });
    if (id === 'natural') { fon(0.16); yanak('#F4A6A0', 0.2); isik('#FFF6E8', 0.25); mk.kasJel = 0.7; mk.rimel = 0.5; ruj('#D98E8E', 0.35, 'likit'); hepsi(['ten', 'yanak', 'kas', 'goz', 'dudak']); }
    else if (id === 'soft') { fon(0.22); kontur(0.2); yanak('#E8927C', 0.28); isik('#FDE7C7', 0.3); far('#E8B6AE', '#9A5E58', '#F6E1D8', 0.5); mk.liner = { tip: 'kanat', renk: '#2A1A16', ilerleme: [1, 1] }; mk.rimel = 0.85; mk.kirpik = 'dogal'; mk.kasJel = 0.6; ruj('#C98C7E', 0.6, 'parlak'); hepsi(['ten', 'yanak', 'kas', 'goz', 'dudak']); }
    else if (id === 'gece') { fon(0.24); kontur(0.3); yanak('#C76B86', 0.18); far('#5F5862', '#1E1A22', null, 0.62); far('#2C272F', null, null, 0.35); mk.liner = { tip: 'duman', renk: '#141014', ilerleme: [1, 1] }; mk.rimel = 1; mk.kirpik = 'yogun'; mk.kasJel = 0.8; ruj('#6E1A2A', 0.78, 'mat'); hepsi(['ten', 'yanak', 'kas', 'goz', 'dudak']); }
    else if (id === 'y2k') { fon(0.15); yanak('#F5B3C6', 0.3); far('#C8B8F2', '#B8E6F2', '#FFFFFF', 0.5); mk.liner = { tip: 'grafik', renk: '#FFFFFF', ilerleme: [1, 1] }; mk.rimel = 0.6; mk.kirpik = 'tuy'; ruj('#F0A0C0', 0.35, 'parlak'); mk.parlatici = 1; mk.parlaticiRenk = '#FF8FB8';
      mk.susler = [{ t: 'yildiz', x: g.gozler[1].dis[0] + 10, y: g.gozler[1].dis[1] + 8, renk: '#FFD86E' }, { t: 'tas', x: g.gozler[0].dis[0] - 8, y: g.gozler[0].dis[1] + 14, renk: '#9FD8FF' }, { t: 'tas', x: g.gozler[0].dis[0] - 2, y: g.gozler[0].dis[1] + 22, renk: '#FF9AD0' }, { t: 'kalp', x: 246, y: 300, renk: '#FF5C8A' }];
      for (let i = 0; i < 40; i++) mk.glit.push([+(g.yanaklar[i % 2][0] + (Math.random() - 0.5) * 30).toFixed(1), +(g.yanaklar[0][1] - 18 + (Math.random() - 0.5) * 14).toFixed(1), +(0.8 + Math.random()).toFixed(2), sec(Math.random, ['#FFFFFF', '#FFC2E2', '#C9E8FF'])]);
      hepsi(['ten', 'yanak', 'goz', 'dudak', 'sus']); }
    else if (id === 'glass') { fon(0.1); isik('#FFFFFF', 0.45); yanak('#F5B3C6', 0.18, 36); bolgeBoya(g.dudakYol.tum, m => { const dm = g.dudak; m.save(); m.translate(dm.x, dm.y + 2); m.scale(1.6, 0.8); yumusakNokta(m, 0, 0, 16, '#E0218A', 0.6); m.restore(); }); mk.rujVar = true; mk.rujBitis = 'likit'; mk.parlatici = 0.8; mk.parlaticiRenk = '#FFFFFF'; mk.rimel = 0.45; mk.kirpik = 'alt'; mk.kasJel = 0.5; d.bakim.parlak = Math.max(d.bakim.parlak, 0.6); hepsi(['ten', 'yanak', 'kas', 'goz', 'dudak']); }
    else if (id === 'kirmizi') { fon(0.24); kontur(0.18); yanak('#E57A8C', 0.18); isik('#FFF6E8', 0.25); far('#E8C9B8', null, null, 0.35); mk.liner = { tip: 'kedi', renk: '#141014', ilerleme: [1, 1] }; mk.rimel = 0.95; mk.kirpik = 'kedi'; mk.kasJel = 0.8; bolgeBoya(g.dudakHat.tum, m => { m.strokeStyle = 'rgba(160,16,40,0.6)'; m.lineWidth = 1.6; m.stroke(g.dudakYol.tum); }); ruj('#C8102E', 0.88, 'mat'); hepsi(['ten', 'yanak', 'kas', 'goz', 'dudak']); }
    ses('parilti'); const q = ekrana({ x: 180, y: 250 }); ctx.efekt.yildiz(q.x, q.y, 8);
    mkKaydetGec(); kaydetGec(); ilerlemeGuncelle(); iste();
  }

  /* ================================================================ geri al */
  function geriKaydet(tuvalDahil) {
    const k = { mk: JSON.stringify(d.mk), kiy: JSON.stringify(d.kiy), sac: JSON.stringify(d.k.sac), parlak: d.bakim.parlak, img: null };
    if (tuvalDahil && T) { const c = document.createElement('canvas'); c.width = T.makyaj.width; c.height = T.makyaj.height; c.getContext('2d').drawImage(T.makyaj, 0, 0); k.img = c; }
    S.geri.push(k); if (S.geri.length > 12) { const at = S.geri.shift(); if (at.img) at.img.width = 1; }
    altbarDurum();
  }
  function geriAl() {
    const k = S.geri.pop(); if (!k) { ctx.toast('Geri alınacak bir şey yok'); return; }
    const sacEski = JSON.stringify(d.k.sac);
    d.mk = JSON.parse(k.mk); d.kiy = JSON.parse(k.kiy); d.k.sac = JSON.parse(k.sac); d.bakim.parlak = k.parlak;
    if (k.img) { tuvalTemizle(T.makyaj); const m = T.makyaj._x; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.drawImage(k.img, 0, 0); m.restore(); k.img.width = 1; mkKaydetGec(); }
    if (sacEski !== k.sac) sacCiz(bantliMi());
    ses('pit'); ctx.toast('Geri alındı'); kaydetGec(); panelYenile(); ilerlemeGuncelle(); altbarDurum(); iste();
  }
  function mkKaydetGec() {
    clearTimeout(mkKayitZam);
    mkKayitZam = setTimeout(() => {
      if (!T || !ctx) return; const kim = d.k.kimlik;
      T.makyaj.toBlob(b => { if (!b || !ctx || !d || d.k.kimlik !== kim) return; yerel.koy({ id: ID + ':makyaj', blob: b, musteri: kim, tarih: Date.now() }).then(() => { if (d) { d.makyajVar = true; kaydetGec(); } }).catch(() => {}); }, 'image/png');
    }, 1200);
  }
  function makyajYukle() {
    if (!d.makyajVar) return;
    const kim = d.k.kimlik;
    yerel.al(ID + ':makyaj').then(r => {
      if (!r || !r.blob || !T || !d || r.musteri !== kim) return;
      const url = URL.createObjectURL(r.blob), im = new Image();
      im.onload = () => { if (T && d && d.k.kimlik === kim) { const m = T.makyaj._x; m.save(); m.setTransform(1, 0, 0, 1, 0, 0); m.drawImage(im, 0, 0, T.makyaj.width, T.makyaj.height); m.restore(); iste(); } URL.revokeObjectURL(url); };
      im.onerror = () => URL.revokeObjectURL(url); im.src = url;
    }).catch(() => {});
  }

  /* ================================================================ aşamalar, ilerleme */
  const yuzAsama = a => ['musteri', 'temizlik', 'bakim', 'makyaj', 'sac'].includes(a);
  const bantliMi = () => d.asama === 'temizlik' || d.asama === 'bakim';
  function asamaAraclari(a) {
    if (a === 'musteri') return [{ id: 'm_ten', ad: 'Ten', ikon: '🎨' }, { id: 'm_goz', ad: 'Göz', ikon: '👁️' }, { id: 'm_sacr', ad: 'Saç rengi', ikon: '🖌️' }, { id: 'm_sacm', ad: 'Saç modeli', ikon: '💇‍♀️' }, { id: 'm_kim', ad: 'Müşteri', ikon: '🪪' }];
    if (a === 'temizlik' || a === 'bakim') return ADIMLAR[a];
    if (a === 'makyaj') return MAKYAJ_SIRA.map(id => id === 'hazir' ? { id: 'hazir', ad: 'Hazır', ikon: '🪄' } : { id, ad: URUNLER[id].ad, ikon: URUNLER[id].ikon });
    if (a === 'sac') return [{ id: 's_model', ad: 'Model', ikon: '💇‍♀️' }, { id: 's_renk', ad: 'Renk', ikon: '🎨' }, { id: 's_ombre', ad: 'Ombre', ikon: '🌅' }, { id: 's_aks', ad: 'Aksesuar', ikon: '🎀' }];
    if (a === 'giydir') return KATEGORI_SIRA.map(id => id === 'stil' ? { id: 'g_stil', ad: 'Stiller', ikon: '✨' } : { id: 'g_' + id, ad: GARDIROP[id].ad, ikon: GARDIROP[id].ikon });
    return [{ id: 'f_fon', ad: 'Fon', ikon: '🏙️' }, { id: 'f_poz', ad: 'Poz', ikon: '💃' }, { id: 'f_foto', ad: 'Fotoğraf', ikon: '📸' }, { id: 'f_album', ad: 'Albüm', ikon: '🖼️' }, { id: 'f_yeni', ad: 'Yeni müşteri', ikon: '🚪' }];
  }
  function asamaIlerleme(a) {
    if (a === 'musteri') return 1;
    if (a === 'temizlik' || a === 'bakim') { const l = ADIMLAR[a].filter(x => !x.istege); return l.filter(x => d.bitti[x.id]).length / l.length; }
    if (a === 'makyaj') return Object.keys(MAKYAJ_GRUP).filter(g => d.mk.kullanildi[g]).length / 6;
    if (a === 'sac') return ['sacModel', 'sacRenk', 'sacAks'].filter(k => d.bitti[k]).length / 3;
    if (a === 'giydir') { const k = d.kiy; return ((k.elbise || (k.ust && k.alt)) ? 1 : 0) / 5 + (k.ayakkabi ? 0.2 : 0) + (k.canta ? 0.2 : 0) + ((k.kupe || k.kolye || k.bileklik || k.yuzuk) ? 0.2 : 0) + ((k.dis || k.gozluk || k.sapka) ? 0.2 : 0); }
    return d.foto > 0 ? 1 : 0.5;
  }
  function aracIlerleme(id) { const a = A[id]; if (a && a.ilerleme) { try { return a.ilerleme(); } catch (e) { return 0; } } return null; }
  function adimBitir(id, mesaj) {
    if (!ctx || d.bitti[id]) return; d.bitti[id] = true;
    if (['tonik', 'serum', 'nem'].includes(id) && T) { const s = T.isilti._x; s.save(); s.clip(G.yuz); yumusakNokta(s, 175, 220, 160, '#FFF4EE', 0.14); s.restore(); }
    ses('parilti'); const q = ekrana({ x: 180, y: 230 }); ctx.efekt.yildiz(q.x, q.y, 6);
    ctx.toast(mesaj || 'Tamam!');
    kaydetGec(); aracSatiriYenile(); ilerlemeGuncelle();
    if (d.asama === 'bakim' && ADIMLAR.bakim.filter(x => !x.istege).every(x => d.bitti[x.id])) { d.bakim.parlak = 1; }
    asamaKontrol();
    const liste = ADIMLAR[d.asama];
    if (liste) {
      const sonraki = liste.find(x => !d.bitti[x.id] && !x.istege);
      if (sonraki) zam.push(setTimeout(() => { if (ctx && S.arac === id) aracSec(sonraki.id); }, 1100));
    }
  }
  function asamaKontrol() {
    const a = d.asama; if (a === 'musteri' || d.kutlandi[a]) return;
    if (asamaIlerleme(a) >= 0.999) {
      d.kutlandi[a] = true; kaydetGec();
      zam.push(setTimeout(() => {
        if (!ctx) return;
        ses('zafer'); ctx.efekt.konfeti();
        const ad = (ASAMALAR.find(x => x.id === a) || {}).ad;
        const k = ctx.el('div.guzellik-kutla', { role: 'status' }, [ctx.el('span.guzellik-kutlaIkon', { 'aria-hidden': 'true' }, '✨'), ad + ' tamam!']);
        el.sahne.append(k); zam.push(setTimeout(() => k.remove(), 2200));
        const nav = document.querySelector('#bolum > .altbar [data-eylem="ileri"]'); if (nav) { nav.classList.add('guzellik-parla'); zam.push(setTimeout(() => nav.classList.remove('guzellik-parla'), 4000)); }
      }, 700));
    }
  }
  function ilerlemeGuncelle() {
    if (!el.bar) return;
    const a = d.asama, tum = asamaIlerleme(a), ad = aracIlerleme(S.arac);
    const tanim = asamaAraclari(a).find(x => x.id === S.arac) || {};
    const v = ad == null ? tum : ad;
    el.barDolu.style.width = Math.round(v * 100) + '%';
    el.barYazi.textContent = Math.round(v * 100) + '%';
    el.bar.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    el.adimAd.textContent = ad == null ? (ASAMALAR.find(x => x.id === a) || {}).ad : tanim.ad || '';
    el.asamaDolu.style.width = Math.round(tum * 100) + '%';
    const btn = el.araclar.querySelector('[data-arac="' + S.arac + '"]');
    if (btn && ad != null) btn.style.setProperty('--guzellik-dolu', Math.round(ad * 100) + '%');
  }

  /* ================================================================ arayüz parçaları */
  function cipSatiri(liste, secili, fn) {
    const sat = ctx.el('div.guzellik-satir', { role: 'group' });
    liste.forEach(o => sat.append(ctx.el('button.guzellik-cip', { type: 'button', 'aria-pressed': String(o.id === secili), onclick: () => { ses('tik'); fn(o.id); } }, o.ad)));
    return sat;
  }
  function renkSatiri(renkler, secili, fn, adlar, sinifEk) {
    const sat = ctx.el('div.guzellik-satir', { role: 'group' });
    renkler.forEach((r, i) => {
      const rr = typeof r === 'string' ? r : r.r, f = typeof r === 'string' ? '' : r.f;
      const b = ctx.el('button.guzellik-renk' + (f && f !== 'mat' ? '.guzellik-' + f : '') + (sinifEk || ''), { type: 'button', 'aria-pressed': String(rr === secili), 'aria-label': (adlar && adlar[i]) || ('Renk ' + (i + 1)) + (f && f !== 'mat' ? (f === 'sim' ? ' (simli)' : ' (glitter)') : ''), onclick: () => { ses('tik'); fn(rr, i); } });
      b.style.setProperty('--guzellik-renk', rr);
      sat.append(b);
    });
    return sat;
  }
  function kaydirici(etiket, deger, min, maks, adim, fn) {
    const id = 'gz-' + Math.random().toString(36).slice(2, 8);
    const inp = ctx.el('input.kaydirici#' + id, { type: 'range', min, max: maks, step: adim, value: deger, oninput: e => fn(parseFloat(e.target.value)) });
    return ctx.el('label.guzellik-kaydir', { for: id }, [ctx.el('span', etiket), inp]);
  }
  function makyajPanel(kap, id) {
    const u = URUNLER[id], ay = S.ayar[id] || (S.ayar[id] = { renk: 0, boy: u.boy, yog: u.yog, palet: 0 });
    if (u.palet) {
      kap.append(cipSatiri(FAR_PALET.map((p, i) => ({ id: i, ad: p.ad })), ay.palet, i => { ay.palet = i; ay.renk = 0; panelYenile(); }));
      const pal = FAR_PALET[ay.palet];
      kap.append(renkSatiri(pal.renkler, pal.renkler[ay.renk].r, (r, i) => { ay.renk = i; panelYenile(); }));
    } else if (u.renkler && !u.silgi) {
      kap.append(renkSatiri(u.renkler, u.renkler[ay.renk].r, (r, i) => { ay.renk = i; panelYenile(); }));
    }
    if (u.bitis) kap.append(cipSatiri([{ id: 'mat', ad: 'Mat' }, { id: 'parlak', ad: 'Parlak' }, { id: 'likit', ad: 'Likit' }], d.mk.rujBitis, b => { geriKaydet(false); d.mk.rujBitis = b; kaydetGec(); panelYenile(); iste(); }));
    const ayarlar = ctx.el('div.guzellik-ayarlar');
    ayarlar.append(kaydirici('Fırça', ay.boy, Math.max(2, Math.round(u.boy * 0.4)), Math.round(u.boy * 2), 1, v => { ay.boy = v; }));
    if (!u.silgi) ayarlar.append(kaydirici('Yoğunluk', ay.yog, 0.05, 1, 0.05, v => { ay.yog = v; }));
    kap.append(ayarlar);
    if (u.tumu) kap.append(ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => { geriKaydet(true); const m = T.makyaj._x; m.save(); m.clip(G.yuz); m.fillStyle = rgba(u.renkler[ay.renk].r, ay.yog * 0.7); m.fill(G.yuz); m.restore(); grupKullan(id); ses('slip'); mkKaydetGec(); kaydetGec(); ilerlemeGuncelle(); iste(); } }, 'Tüm yüze uygula'));
  }
  function aracSatiriYenile() {
    const sat = el.araclar; sat.innerHTML = '';
    asamaAraclari(d.asama).forEach(a => {
      const bitti = !!d.bitti[a.id] || (d.asama === 'makyaj' && a.id !== 'hazir' && a.id !== 'silgi' && Object.keys(MAKYAJ_GRUP).some(g => MAKYAJ_GRUP[g].includes(a.id) && d.mk.kullanildi[g]));
      const b = ctx.el('button.guzellik-arac' + (bitti ? '.guzellik-bitti' : '') + (a.istege ? '.guzellik-istege' : ''), { type: 'button', 'aria-pressed': String(S.arac === a.id), data: { arac: a.id }, onclick: () => { ses('tik'); aracSec(a.id); } }, [
        ctx.el('span.guzellik-aracIkon', { 'aria-hidden': 'true' }, a.ikon), ctx.el('span.guzellik-aracAd', a.ad)
      ]);
      if (bitti) b.setAttribute('aria-label', a.ad + ' (tamam)');
      sat.append(b);
    });
    const sec = sat.querySelector('[aria-pressed="true"]'); if (sec && sec.scrollIntoView) { try { sec.scrollIntoView({ inline: 'center', block: 'nearest', behavior: ctx.azHareket ? 'auto' : 'smooth' }); } catch (e) {} }
  }
  function aracSec(id) {
    if (S.firca) fircaBitir();
    S.arac = id; aracSatiriYenile(); panelYenile(); ilerlemeGuncelle();
    // makyajda göz/dudak ürünlerinde kamerayı yaklaştır
    if (d.asama === 'makyaj') { const u = URUNLER[id]; const hedef = u && (u.bolge === 'goz' || ['eyeliner', 'rimel', 'kirpik'].includes(id)) ? 'goz' : u && (u.bolge === 'dudak' || u.bolge === 'dudakHat' || id === 'parlatici') ? 'dudak' : u && (u.bolge === 'kas' || id === 'kasjel') ? 'kas' : 'yuz'; if (S.yakinOto !== false) kameraAyarla(hedef); }
    iste();
  }
  function panelYenile() {
    const kap = el.panel; if (!kap) return; kap.innerHTML = '';
    const id = S.arac, a = d.asama;
    const ipucu = (t) => kap.append(ctx.el('p.guzellik-ipucu', t));
    if (a === 'temizlik' || a === 'bakim') {
      const t = ADIMLAR[a].find(x => x.id === id);
      if (t) ipucu((d.bitti[id] ? '✓ ' : '') + t.ipucu);
      if (A[id] && A[id].panel && !d.bitti[id]) A[id].panel(kap);
      if (d.bitti[id]) kap.append(ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => adimTekrar(id) }, 'Bu adımı tekrar yap'));
      if (t && t.istege && !d.bitti[id]) kap.append(ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => asamaGit(ASAMALAR[ASAMALAR.findIndex(x => x.id === a) + 1].id) }, 'Atla, sonraki aşamaya geç'));
    } else if (a === 'makyaj') {
      if (id === 'hazir') {
        ipucu('Bir görünüme dokun; sonra her ürünle düzenleyebilirsin.');
        kap.append(cipSatiri(HAZIR.map(h => ({ id: h.id, ad: h.ad })), null, hazirUygula));
        kap.append(ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => { geriKaydet(true); tuvalTemizle(T.makyaj); const kul = d.mk; d.mk = mkVarsayilan(); void kul; mkKaydetGec(); kaydetGec(); ilerlemeGuncelle(); aracSatiriYenile(); ctx.toast('Makyaj silindi; temiz bir sayfa'); iste(); } }, 'Tüm makyajı sil'));
      } else {
        ipucu(URUNLER[id].ipucu);
        const ar = makyajAraci(id); if (ar.panel) ar.panel(kap);
      }
    } else if (a === 'musteri') musteriPanel(kap, id);
    else if (a === 'sac') sacPanel(kap, id);
    else if (a === 'giydir') giydirPanel(kap, id);
    else finalPanel(kap, id);
  }
  function adimTekrar(id) {
    delete d.bitti[id]; d.kutlandi[d.asama] = false;
    if (id === 'pamuk' || id === 'kopuk' || id === 'siyah' || id === 'sivilce' || id === 'kas') { const yedek = Object.assign({}, d.bitti); kirUret(); d.bitti = yedek; }
    if (id === 'kopuk') S.kopukFaz = 'kopur';
    if (id === 'kil') { S.kilFaz = 'sur'; S.izg.kil = null; S.izg.kilSil = null; }
    if (id === 'serum') S.serumDamla = 0;
    if (id === 'nem') S.nemNokta = 0;
    if (id === 'ped') { d.bakim.yorgun = 1; S.pedler = null; S.pedFaz = null; }
    if (id === 'balm') d.bakim.kuru = 1;
    if (id === 'buz') { d.bakim.kizarik = 1; S.kizBas = null; }
    if (id === 'sacmaske') d.bakim.sacParlak = 0;
    S.izg[id] = null;
    kaydetGec(); aracSatiriYenile(); panelYenile(); ilerlemeGuncelle(); iste();
  }
  function musteriPanel(kap, id) {
    const k = d.k, yenile = () => { ciltCiz(); kasTelleriUret(); sacCiz(false); kaydetGec(); panelYenile(); iste(); };
    if (id === 'm_ten') kap.append(renkSatiri(TENLER, k.ten, r => { k.ten = r; k.cemre = false; yenile(); }, TENLER.map((_, i) => 'Ten tonu ' + (i + 1))));
    else if (id === 'm_goz') kap.append(renkSatiri(GOZLER.map(g => g.r), k.goz, r => { k.goz = r; yenile(); }, GOZLER.map(g => g.ad)));
    else if (id === 'm_sacr') kap.append(renkSatiri(SAC_RENK.map(g => g.r), k.sac.renk, r => { k.sac.renk = r; yenile(); }, SAC_RENK.map(g => g.ad)));
    else if (id === 'm_sacm') kap.append(cipSatiri(SAC_MODEL, k.sac.model, m => { k.sac.model = m; yenile(); }));
    else {
      kap.append(ctx.el('p.guzellik-ipucu', '“' + k.istek + '”'));
      kap.append(ctx.el('div.guzellik-satir', [
        ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => yeniMusteri(true) }, '🎲 Rastgele müşteri'),
        ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => yeniMusteri(false) }, '💗 Cemre gibi')
      ]));
    }
    kap.append(ctx.el('button.dugme.guzellik-basla', { type: 'button', onclick: () => asamaGit('temizlik') }, 'Bakıma başla'));
  }
  function sacDegis(fn, bayrak) { geriKaydet(false); fn(d.k.sac); d.bitti[bayrak] = true; sacCiz(false); kaydetGec(); panelYenile(); ilerlemeGuncelle(); aracSatiriYenile(); asamaKontrol(); ses('tink'); iste(); }
  function sacPanel(kap, id) {
    const s = d.k.sac;
    if (id === 's_model') kap.append(cipSatiri(SAC_MODEL, s.model, m => sacDegis(x => { x.model = m; }, 'sacModel')));
    else if (id === 's_renk') kap.append(renkSatiri(SAC_RENK.map(g => g.r), s.renk, r => sacDegis(x => { x.renk = r; }, 'sacRenk'), SAC_RENK.map(g => g.ad)));
    else if (id === 's_ombre') { kap.append(ctx.el('p.guzellik-ipucu', 'Uçlara doğru ikinci bir renk.')); kap.append(cipSatiri([{ id: 'yok', ad: 'Ombre yok' }], s.ombre ? '' : 'yok', () => sacDegis(x => { x.ombre = null; }, 'sacRenk'))); kap.append(renkSatiri(SAC_RENK.map(g => g.r), s.ombre, r => sacDegis(x => { x.ombre = r; }, 'sacRenk'), SAC_RENK.map(g => g.ad))); }
    else {
      const ak = s.aks || { tip: 'yok', renk: '#000000' };
      kap.append(cipSatiri(SAC_AKS, ak.tip, t => sacDegis(x => { const a = SAC_AKS.find(q => q.id === t); x.aks = t === 'yok' ? null : { tip: t, renk: a.renkler[0] }; }, 'sacAks')));
      const tanim = SAC_AKS.find(q => q.id === ak.tip);
      if (tanim && tanim.id !== 'yok') kap.append(renkSatiri(tanim.renkler, ak.renk, r => sacDegis(x => { x.aks = { tip: ak.tip, renk: r }; }, 'sacAks')));
    }
  }
  /* ---------- giydirme paneli + küçük resimler */
  const KESIT = { ust: [118, 136, 124, 136], alt: [112, 222, 136, 236], elbise: [92, 136, 176, 324], dis: [96, 136, 168, 290], ayakkabi: [140, 398, 80, 72], canta: [124, 150, 136, 150], kolye: [148, 132, 64, 72], bileklik: [128, 230, 56, 64], yuzuk: [196, 240, 52, 62], kupe: [112, 24, 136, 160], gozluk: [116, 44, 128, 100], sapka: [104, 0, 152, 120] };
  const kucukOnbellek = new Map();
  function kucukResim(kat, p, ri) {
    const key = kat + ':' + p.id + ':' + ri; let u = kucukOnbellek.get(key); if (u) return u;
    const kes = KESIT[kat], W = 64, H = 72, sc = Math.min(W / kes[2], H / kes[3]);
    const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2; const c = cv.getContext('2d');
    c.setTransform(2 * sc, 0, 0, 2 * sc, 0, 0); c.translate(-kes[0] - (kes[2] - W / sc) / 2, -kes[1] - (kes[3] - H / sc) / 2);
    const gv = govdeGeo('duz'), kiy = {}; kiy[kat] = { id: p.id, r: ri };
    const ten = '#EADDE3';
    try {
      govdeCiz(c, gv, { kiy, mankenMi: true, ten });
      if (kat === 'kupe' || kat === 'gozluk' || kat === 'sapka') basDonusum(c, gv, () => { c.fillStyle = ten; c.fill(G.yuz); c.fillStyle = '#D8C9D3'; [-1, 1].forEach(s => { elips(c, 180 + s * 96, 252, 12, 22); c.fill(); }); const rr = p.renkler[ri % p.renkler.length]; if (kat === 'kupe') kupeCiz(c, p, rr); else if (kat === 'gozluk') gozlukCiz(c, p, rr); else sapkaCiz(c, p, rr); });
    } catch (e) {}
    kucukOnbellek.set(key, cv); return cv;
  }
  function giydirPanel(kap, id) {
    if (id === 'g_stil') {
      kap.append(ctx.el('p.guzellik-ipucu', 'Bir stile dokun; sonra parça parça değiştirebilirsin.'));
      const sat = ctx.el('div.guzellik-satir');
      STILLER.forEach(s => sat.append(ctx.el('button.guzellik-stil' + (s.id === 'bizim' ? '.guzellik-favori' : ''), { type: 'button', onclick: () => { geriKaydet(false); d.kiy = JSON.parse(JSON.stringify(s.kiy)); kaydetGec(); ses('parilti'); const q = ekrana({ x: 180, y: 250 }); ctx.efekt.yildiz(q.x, q.y, 6); ilerlemeGuncelle(); asamaKontrol(); iste(); } }, [ctx.el('strong', (s.id === 'bizim' ? '🖤 ' : '') + s.ad), ctx.el('span', s.not)])));
      kap.append(sat); return;
    }
    const kat = id.slice(2), tanim = GARDIROP[kat], sec = d.kiy[kat];
    const sat = ctx.el('div.guzellik-satir.guzellik-parcalar');
    tanim.parcalar.forEach(p => {
      const ri = sec && sec.id === p.id ? sec.r : 0;
      const b = ctx.el('button.guzellik-parca' + (p.favori ? '.guzellik-favori' : ''), { type: 'button', 'aria-pressed': String(!!(sec && sec.id === p.id)), 'aria-label': p.ad, onclick: () => {
        geriKaydet(false);
        if (sec && sec.id === p.id) { delete d.kiy[kat]; }
        else { d.kiy[kat] = { id: p.id, r: 0 }; if (kat === 'elbise') { delete d.kiy.ust; delete d.kiy.alt; } if (kat === 'ust' || kat === 'alt') delete d.kiy.elbise; }
        ses('pop'); kaydetGec(); panelYenile(); ilerlemeGuncelle(); asamaKontrol(); iste();
      } }, [kucukResim(kat, p, ri), ctx.el('span', p.ad)]);
      sat.append(b);
    });
    kap.append(sat);
    if (sec) {
      const p = tanim.parcalar.find(x => x.id === sec.id);
      if (p) {
        const alt = ctx.el('div.guzellik-satir');
        alt.append(renkSatiri(p.renkler, p.renkler[sec.r % p.renkler.length], (r, i) => { geriKaydet(false); d.kiy[kat] = { id: p.id, r: i }; kaydetGec(); panelYenile(); iste(); }));
        alt.append(ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => { geriKaydet(false); delete d.kiy[kat]; kaydetGec(); panelYenile(); ilerlemeGuncelle(); iste(); } }, 'Çıkar'));
        kap.append(alt);
      }
    }
    const kaydir = kap.querySelector('[aria-pressed="true"]'); if (kaydir && kaydir.scrollIntoView) { try { kaydir.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) {} }
  }
  function finalPanel(kap, id) {
    if (id === 'f_fon') kap.append(cipSatiri(FONLAR, d.fon, f => { d.fon = f; kaydetGec(); panelYenile(); iste(); }));
    else if (id === 'f_poz') kap.append(cipSatiri(POZLAR, d.poz, p => { d.poz = p; kaydetGec(); panelYenile(); iste(); }));
    else if (id === 'f_foto') { kap.append(ctx.el('p.guzellik-ipucu', 'Fon ve pozu seçtiysen hazırsın.')); kap.append(ctx.el('button.dugme.guzellik-basla', { type: 'button', onclick: fotoCek }, '📸 Fotoğraf çek')); }
    else if (id === 'f_album') { kap.append(ctx.el('p.guzellik-ipucu', 'Çektiğin fotoğraflar burada (en çok ' + ALBUM_MAKS + ').')); kap.append(ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: albumAc }, 'Albümü aç')); }
    else {
      kap.append(ctx.el('p.guzellik-ipucu', 'Bu müşteri hazır! Kapıda yeni biri bekliyor.'));
      kap.append(ctx.el('div.guzellik-satir', [ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => yeniMusteri(true) }, '🎲 Rastgele müşteri'), ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => yeniMusteri(false) }, '💗 Cemre gibi')]));
    }
  }

  /* ================================================================ müşteri */
  async function yeniMusteri(rastgele) {
    if (d.asama !== 'musteri' && d.asama !== 'final' && !(await ctx.onayla('Şimdiki müşteri yarım kalacak. Yeni müşteri gelsin mi?', 'Gelsin', 'Vazgeç'))) return;
    if (!ctx) return;
    const t = durumVarsayilan();
    if (rastgele) {
      const r = rng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
      t.k.ad = sec(r, ISIMLER); t.k.cemre = false; t.k.ten = sec(r, TENLER); t.k.goz = sec(r, GOZLER).r;
      t.k.sac = { model: sec(r, SAC_MODEL).id, renk: sec(r, SAC_RENK.slice(0, 9)).r, ombre: null, aks: null };
      t.k.yuz = { en: 0.94 + r() * 0.1, cene: 0.92 + r() * 0.14, goz: 0.94 + r() * 0.14, aci: r() * 5, dudak: 0.9 + r() * 0.18, dudakDol: 0.9 + r() * 0.25, kas: 0.85 + r() * 0.3 };
      t.k.tohum = Math.floor(r() * 1e9); t.k.istek = sec(r, ISTEKLER); t.k.kimlik = 'm-' + Date.now().toString(36);
    }
    d = t; S.geri.forEach(k => { if (k.img) k.img.width = 1; }); S.geri = [];
    tuvalTemizle(T.makyaj); yerel.sil(ID + ':makyaj').catch(() => {});
    karakterKur(); asamaGit('musteri'); ses('can');
    ctx.toast(rastgele ? d.k.ad + ' geldi: “' + d.k.istek + '”' : 'Cemre koltukta, hoş geldin 💗', 3200);
  }
  function karakterKur() {
    G = geoYap(d.k);
    S.izg = {}; S.anim = []; S.bant = null; S.kopukFaz = 'kopur'; S.sivAlt = 'cimbiz'; S.serumDamla = d.bitti.serum ? 3 : 0; S.nemNokta = d.bitti.nem ? 5 : 0;
    S.kilFaz = 'sur'; S.kilRenk = KIL[0].r; S.pedler = null; S.pedFaz = null; S.kizBas = null; S.sikilan = null;
    ciltCiz(); kirUret(); kasTelleriUret();
    S.maskeHaric = new Path2D(); G.gozler.forEach(o => { const p = new Path2D(); p.ellipse(o.x, o.y - 2, o.W * 0.62, o.H * 0.85, 0, 0, Math.PI * 2); S.maskeHaric.addPath(p); }); S.maskeHaric.addPath(G.dudakHat.tum);
    G.kaslar.forEach(b => { const p = new Path2D(); p.ellipse(b.tepe[0], b.tepe[1] + 2, 40, 11, b.s * 0.12, 0, Math.PI * 2); S.maskeHaric.addPath(p); });
    sacCiz(bantliMi());
  }

  /* ================================================================ aşama geçişi + kamera */
  const KAMERA = { yuz: [180, 238, 1.2], goz: [180, 228, 2.1], dudak: [180, 316, 2.6], kas: [180, 206, 2.1], sac: [180, 232, 0.84], musteri: [180, 246, 1.0], govde: [180, 226, 0.92] };
  function kameraAyarla(ad) { const k = KAMERA[ad] || KAMERA.yuz; S.kamHedef = { x: k[0], y: k[1], z: k[2] }; S.kamAd = ad; if (ctx.azHareket || !S.kam) S.kam = Object.assign({}, S.kamHedef); if (el.yakin) { el.yakin.textContent = ad === 'yuz' ? '🔍' : '↩'; el.yakin.setAttribute('aria-label', ad === 'yuz' ? 'Göze yaklaş' : 'Bütün yüze dön'); } iste(); }
  function asamaGit(a) {
    if (S.firca) fircaBitir();
    const onceBant = bantliMi();
    d.asama = a; S.gorunum = yuzAsama(a) ? 'yuz' : 'govde';
    if (bantliMi() !== onceBant) sacCiz(bantliMi());
    const liste = asamaAraclari(a);
    const ilk = (ADIMLAR[a] && liste.find(x => !d.bitti[x.id] && !x.istege)) || liste[0];
    S.arac = ilk.id;
    kameraAyarla(a === 'musteri' ? 'musteri' : a === 'sac' ? 'sac' : yuzAsama(a) ? 'yuz' : 'govde');
    el.kok.dataset.asama = a;
    el.yakin.hidden = a !== 'makyaj';
    el.kart.hidden = a !== 'musteri'; el.bar.hidden = a === 'musteri';
    if (a === 'musteri') el.kart.innerHTML = '<strong>' + ctx.kacir(d.k.ad) + '</strong><span>' + ctx.kacir(d.k.istek) + '</span>';
    aracSatiriYenile(); panelYenile(); ilerlemeGuncelle(); altbarKur(); kaydetGec(); iste();
    if (el.tepsi) el.tepsi.scrollTop = 0;
  }
  function altbarKur() {
    const i = ASAMALAR.findIndex(x => x.id === d.asama), son = i === ASAMALAR.length - 1;
    ctx.altbar([
      { id: 'geri', ad: 'Önceki', ikon: '‹', etiket: 'Önceki aşama', tikla: () => { if (i > 0) asamaGit(ASAMALAR[i - 1].id); else ctx.toast('Buradan başlıyoruz'); } },
      { id: 'asamalar', ad: ASAMALAR[i].ad, ikon: ASAMALAR[i].ikon, etiket: 'Aşamalar listesi', tikla: asamaListesi },
      { id: 'geriAl', ad: 'Geri al', ikon: '↶', tikla: geriAl },
      { id: 'album', ad: 'Albüm', ikon: '🖼️', tikla: albumAc },
      { id: 'ileri', ad: son ? 'Yeni' : 'Sonraki', ikon: son ? '🚪' : '›', birincil: true, etiket: son ? 'Yeni müşteri' : 'Sonraki aşama: ' + ASAMALAR[i + 1].ad, tikla: () => { if (son) yeniMusteri(true); else asamaGit(ASAMALAR[i + 1].id); } }
    ]);
    altbarDurum();
  }
  function altbarDurum() { const b = document.querySelector('#bolum > .altbar [data-eylem="geriAl"]'); if (b) b.classList.toggle('guzellik-soluk', !S.geri.length); }
  function asamaListesi() {
    const kap = ctx.el('div.guzellik-liste');
    ASAMALAR.forEach(a => {
      const v = asamaIlerleme(a.id);
      kap.append(ctx.el('button.guzellik-listeOge', { type: 'button', 'aria-current': a.id === d.asama ? 'step' : null, onclick: () => { ctx.sheetKapat(); asamaGit(a.id); } }, [
        ctx.el('span.guzellik-listeIkon', { 'aria-hidden': 'true' }, a.ikon), ctx.el('span.guzellik-listeAd', a.ad),
        ctx.el('span.guzellik-listeBar', { 'aria-hidden': 'true' }, [ctx.el('span', { style: 'width:' + Math.round(v * 100) + '%' })]),
        ctx.el('span.guzellik-listeYuzde', a.id === 'musteri' ? '' : Math.round(v * 100) + '%')
      ]));
    });
    kap.append(ctx.el('div.guzellik-satir', [ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => { ctx.sheetKapat(); yeniMusteri(true); } }, '🎲 Yeni müşteri'), ctx.el('button.guzellik-kucukDugme', { type: 'button', onclick: () => { ctx.sheetKapat(); yeniMusteri(false); } }, '💗 Cemre gibi')]));
    ctx.sheet(kap, { baslik: d.k.ad + ' · aşamalar' });
  }

  /* ================================================================ fotoğraf + albüm */
  function fotoCiz(olcek) {
    const W = FW * olcek, H = FH * olcek, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.setTransform(olcek, 0, 0, olcek, 0, 0);
    c.save(); fonCiz(c, d.fon, 0); govdeCiz(c, govdeGeo(d.poz)); c.restore();
    const yazi = d.k.ad + ' · Güzellik Salonu · ' + CD.tarihYaz(CD.bugun());
    c.font = '700 11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    const w = c.measureText(yazi).width + 22;
    c.fillStyle = 'rgba(255,255,255,0.82)'; dik(c, 180 - w / 2, 448, w, 22, 11); c.fill();
    c.fillStyle = '#3B3444'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(yazi, 180, 459.5);
    return cv;
  }
  async function fotoCek() {
    if (S.cekiliyor) return; S.cekiliyor = true;
    sesDeklansor();
    const f = ctx.el('div.guzellik-flas'); el.sahne.append(f); zam.push(setTimeout(() => f.remove(), 700));
    try {
      const cv = fotoCiz(2);
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.85));
      if (!blob || !ctx) throw new Error('görsel yok');
      const kayit = { id: ID + ':foto:' + CD.kimlik(), blob, tarih: Date.now(), ad: d.k.ad, tur: 'guzellik-foto' };
      await yerel.koy(kayit);
      const hepsi = (await yerel.hepsi()).filter(x => x && typeof x.id === 'string' && x.id.startsWith(ID + ':foto:')).sort((a, b) => b.tarih - a.tarih);
      for (const x of hepsi.slice(ALBUM_MAKS)) await yerel.sil(x.id);
      if (!ctx) return;
      d.foto = (d.foto || 0) + 1; kaydetGec(); ilerlemeGuncelle(); asamaKontrol();
      ses('parilti'); fotoGoster(kayit, true);
    } catch (e) { if (ctx) ctx.toast('Fotoğraf kaydedilemedi; tarayıcı hafızası dolu olabilir'); }
    S.cekiliyor = false;
  }
  function blobPaylas(blob, ad) {
    try { const f = new File([blob], ad, { type: blob.type || 'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f] }).catch(() => {}); return; } } catch (e) {}
    blobIndir(blob, ad);
  }
  function blobIndir(blob, ad) { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = ad; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 30000); ctx && ctx.toast('İndirildi 📥'); }
  const dosyaAdi = k => ('guzellik-' + (k.ad || 'cemre') + '-' + new Date(k.tarih).toISOString().slice(0, 10) + (k.blob && k.blob.type === 'image/png' ? '.png' : '.jpg')).toLocaleLowerCase('tr').replace(/[^a-z0-9ğüşöçı.-]/g, '-');
  function fotoGoster(k, yeni) {
    const url = URL.createObjectURL(k.blob); S.urller.push(url);
    const kap = ctx.el('div.guzellik-onizleme', [
      ctx.el('img.guzellik-foto', { src: url, alt: k.ad + ' için çekilen salon fotoğrafı' }),
      ctx.el('div.guzellik-satir', [
        ctx.el('button.dugme', { type: 'button', onclick: () => blobPaylas(k.blob, dosyaAdi(k)) }, 'Paylaş'),
        ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => blobIndir(k.blob, dosyaAdi(k)) }, 'İndir'),
        yeni ? ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { ctx.sheetKapat(); albumAc(); } }, 'Albüm') : ctx.el('button.dugme-hayalet', { type: 'button', onclick: async () => { if (await ctx.onayla('Bu fotoğraf silinsin mi?', 'Sil', 'Vazgeç')) { await yerel.sil(k.id).catch(() => {}); ctx.toast('Silindi'); albumAc(); } } }, 'Sil')
      ])
    ]);
    ctx.sheet(kap, { baslik: yeni ? 'Harika bir kare! 📸' : k.ad, kapaninca: urlBirak });
  }
  function urlBirak() { (S.urller || []).forEach(u => URL.revokeObjectURL(u)); S.urller = []; }
  async function albumAc() {
    let l = [];
    try { await idbGoc(); l = (await yerel.hepsi()).filter(x => x && typeof x.id === 'string' && x.id.startsWith(ID + ':foto:')).sort((a, b) => b.tarih - a.tarih); } catch (e) {}
    if (!ctx) return;
    urlBirak();
    if (!l.length) { ctx.sheet(ctx.el('div.bos-durum', [ctx.el('div.buyuk', '📸'), ctx.el('p', 'Albüm boş. Final aşamasında ilk fotoğrafı sen çek!')]), { baslik: 'Salon albümü' }); return; }
    const izg = ctx.el('div.guzellik-album');
    l.forEach(k => { const u = URL.createObjectURL(k.blob); S.urller.push(u); izg.append(ctx.el('button.guzellik-albumOge', { type: 'button', 'aria-label': k.ad + ', ' + new Date(k.tarih).toLocaleDateString('tr-TR'), onclick: () => fotoGoster(k, false) }, [ctx.el('img', { src: u, alt: '' }), ctx.el('span', k.ad)])); });
    ctx.sheet(ctx.el('div', [ctx.el('p.guzellik-ipucu', l.length + ' / ' + ALBUM_MAKS + ' fotoğraf'), izg]), { baslik: 'Salon albümü', kapaninca: urlBirak });
  }

  /* ================================================================ çizim döngüsü */
  function boyutla() {
    if (!el.tuval || !el.sahne) return;
    const r = el.sahne.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    S.w = Math.max(10, r.width); S.h = Math.max(10, r.height); S.dpr = dpr;
    el.tuval.width = Math.round(S.w * dpr); el.tuval.height = Math.round(S.h * dpr);
    el.tuval.style.width = S.w + 'px'; el.tuval.style.height = S.h + 'px';
    S.taban = Math.min(S.w / FW, S.h / FH);
    iste();
  }
  function olcek() { return S.taban * S.kam.z; }
  function mantiksal(e) {
    const r = el.tuval.getBoundingClientRect(), k = olcek();
    return { x: (e.clientX - r.left - S.w / 2) / k + S.kam.x, y: (e.clientY - r.top - S.h / 2) / k + S.kam.y };
  }
  function ekrana(p) {
    const r = el.tuval.getBoundingClientRect(), k = olcek();
    return { x: r.left + S.w / 2 + (p.x - S.kam.x) * k, y: r.top + S.h / 2 + (p.y - S.kam.y) * k };
  }
  function iste() { if (!raf && ctx && !document.hidden) raf = requestAnimationFrame(kare); }
  let sonT = 0;
  function kare(t) {
    raf = 0; if (!ctx || !T) return;
    const dt = Math.min(64, sonT ? t - sonT : 16); sonT = t;
    const devam = guncelle(t, dt);
    const t0 = performance.now(); ciz(t); const sure = performance.now() - t0;
    const pf = S.perf; pf.push(sure); if (pf.length > 240) pf.shift();
    if (devam) iste(); else sonT = 0;
  }
  function guncelle(t, dt) {
    let devam = false;
    // kamera
    const h = S.kamHedef, k = S.kam;
    if (Math.abs(k.z - h.z) > 0.002 || Math.abs(k.x - h.x) > 0.2 || Math.abs(k.y - h.y) > 0.2) { const f = 1 - Math.pow(0.82, dt / 16); k.x = lerp(k.x, h.x, f); k.y = lerp(k.y, h.y, f); k.z = lerp(k.z, h.z, f); devam = true; }
    else { k.x = h.x; k.y = h.y; k.z = h.z; }
    // göz takibi
    const bx = S.bakHedef.x, by = S.bakHedef.y;
    if (Math.abs(S.bak.x - bx) > 0.01 || Math.abs(S.bak.y - by) > 0.01) { S.bak.x = lerp(S.bak.x, bx, 0.2); S.bak.y = lerp(S.bak.y, by, 0.2); devam = true; }
    // sivilce sıkma / bant
    if (S.sikilan && S.sikilan.d === 'var') { const q = S.sikilan; q.p = Math.min(1, q.p + dt / 650); devam = true; sesSeyrek('sik', 220, () => ses('tik')); if (q.p >= 1) { S.sikilan = null; A.sivilce.pit(q); ilerlemeGuncelle(); } }
    S.sivilce.forEach(q => { if (q.geri && q.p > 0) { q.p = Math.max(0, q.p - dt / 300); devam = true; if (!q.p) q.geri = false; } if (q.bant > 0 && q.bant < 1 && q.d === 'var') { q.bant = Math.min(1, q.bant + dt / 1600); devam = true; if (q.bant >= 1) { ses('tink'); ilerlemeGuncelle(); } } });
    S.kil.forEach(q => { if (q.al > 0 && q.al < 1) { q.al = Math.min(1, q.al + dt / 320); devam = true; } });
    if (S.bant && S.bant.gir < 1) { S.bant.gir = Math.min(1, S.bant.gir + dt / 200); devam = true; }
    // araç zamanlayıcıları
    ['kil', 'ped'].forEach(id => { if (A[id].guncelle && A[id].guncelle(t)) { devam = true; if (S.arac === id) ilerlemeGuncelle(); } });
    // animasyonlar
    if (S.anim.length) { const n = performance.now(); S.anim = S.anim.filter(a => n - a.t0 < a.sure); devam = devam || S.anim.length > 0; }
    // göz kırpma
    if (S.kirp && t - S.kirp < 200) devam = true;
    if (S.sik && performance.now() < S.sik) devam = true;
    return devam;
  }
  function gozAcikligi(t) {
    if (d.asama === 'temizlik' && S.arac === 'kopuk' && !d.bitti.kopuk) return 0;
    if (d.asama === 'bakim' && ((S.arac === 'kil' && S.kilFaz !== 'sur' && !d.bitti.kil) || (S.pedler && S.arac === 'ped'))) return 0;
    if (S.sik && performance.now() < S.sik) return 0;
    if (S.kirp) { const u = (t - S.kirp) / 200; if (u < 1) return Math.abs(u - 0.5) * 2; }
    return 1;
  }
  function ciz(t) {
    const c = el.tuval.getContext('2d'), k = olcek();
    c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); c.clearRect(0, 0, S.w, S.h);
    c.save(); c.translate(S.w / 2, S.h / 2); c.scale(k, k); c.translate(-S.kam.x, -S.kam.y);
    c.imageSmoothingQuality = 'high';
    if (S.gorunum === 'yuz') {
      yuzCiz(c, { bornoz: true, spaBandi: bantliMi(), gozAcik: gozAcikligi(t), zaman: t });
    } else {
      c.save(); dik(c, 0, 0, FW, FH, 18); c.clip();
      fonCiz(c, d.asama === 'final' ? d.fon : 'studyo', t);
      govdeCiz(c, govdeGeo(d.asama === 'final' ? d.poz : 'duz'));
      c.restore();
    }
    efektCiz(c);
    imlecCiz(c);
    c.restore();
  }
  function efektCiz(c) {
    const n = performance.now();
    for (const a of S.anim) {
      const u = sinir((n - a.t0) / a.sure, 0, 1);
      if (a.tur === 'damla') {
        if (u < 0.85) { const y = lerp(a.y - 70, a.y, Math.pow(u / 0.85, 2)); c.fillStyle = 'rgba(255,214,140,0.95)'; c.beginPath(); c.moveTo(a.x, y - 7); c.quadraticCurveTo(a.x + 5, y, a.x, y + 3); c.quadraticCurveTo(a.x - 5, y, a.x, y - 7); c.fill(); yumusakNokta(c, a.x - 1.5, y - 1, 2, '#FFFFFF', 0.9); damlalikCiz(c, a.x, a.y - 78); }
        else { const v = (u - 0.85) / 0.15; c.strokeStyle = 'rgba(255,220,150,' + (1 - v) + ')'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(a.x, a.y, 4 + v * 12, 2 + v * 5, 0, 0, Math.PI * 2); c.stroke(); }
      } else if (a.tur === 'pit') {
        c.strokeStyle = 'rgba(255,255,255,' + (1 - u) + ')'; c.lineWidth = 1.4; c.beginPath(); c.arc(a.x, a.y, 4 + u * 14, 0, Math.PI * 2); c.stroke();
        for (let i = 0; i < 6; i++) { const ang = i * 1.047 + 0.4, r = 3 + u * 16; c.fillStyle = 'rgba(255,250,235,' + (1 - u) + ')'; c.beginPath(); c.arc(a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r, 1.4 * (1 - u) + 0.3, 0, Math.PI * 2); c.fill(); }
        c.save(); c.globalAlpha = 1 - u; c.font = '800 13px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif'); c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#FFFFFF'; c.strokeText('pıt!', a.x + 14, a.y - 12 - u * 12); c.fillStyle = '#E2557A'; c.fillText('pıt!', a.x + 14, a.y - 12 - u * 12); c.restore();
      } else if (a.tur === 'su') {
        c.strokeStyle = 'rgba(170,215,245,' + (0.8 * (1 - u)) + ')'; c.lineWidth = 1.4; c.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const x = a.x + (i - 1) * 6, y = a.y + u * 40 + i * 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6); c.stroke(); }
      } else if (a.tur === 'buz' || a.tur === 'yildizcik') {
        c.save(); c.globalAlpha = 1 - u; c.fillStyle = a.tur === 'buz' ? '#DDF3FF' : '#FFFFFF'; yildizYol(c, a.x, a.y - u * 8, 4 * (1 - u * 0.5), 1, 4, u * 2); c.fill(); c.restore();
      } else if (a.tur === 'bantUcus') {
        const g = Math.min(1, u / 0.3), x = lerp(180, 180 + a.yon * 92, yumus(g)), y = lerp(272, 360, yumus(g)), s = lerp(1, 1.5, yumus(g)), aci = lerp(0, a.yon * 0.25, g);
        c.save(); c.globalAlpha = u > 0.8 ? (1 - u) / 0.2 : 1; c.translate(x, y); c.rotate(aci); c.scale(s, s); c.translate(-180, -272);
        c.save(); c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 12; const yol = bantYolu(); c.fillStyle = '#FBF8F3'; c.fill(yol); c.restore();
        c.fillStyle = 'rgba(40,30,30,0.85)'; a.noktalar.forEach(([nx, ny, nr]) => { c.beginPath(); c.arc(nx, ny, nr * 1.2, 0, Math.PI * 2); c.fill(); });
        c.restore();
      } else if (a.tur === 'bantGir') { /* bant.gir ile çiziliyor */ }
      else if (a.tur === 'bantGeri' && S.bant) { S.bant.cek = a.bas * (1 - u); if (u >= 0.99) S.bant.cek = 0; }
      else if (a.tur === 'bantSoy') { c.save(); c.globalAlpha = 1 - u; c.translate(a.x + u * 20, a.y - u * 40); c.rotate(u * 1.5); c.fillStyle = 'rgba(244,226,210,0.9)'; c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); c.fill(); yumusakNokta(c, 0, 0, 4, '#FFFFFF', 0.9); c.restore(); }
      else if (a.tur === 'pedUcus') { const g = G.gozler[a.i]; c.save(); c.globalAlpha = 1 - u; c.translate(0, -u * 50); c.translate(g.x, g.y + 22); c.rotate(u * g.s); c.translate(-g.x, -g.y - 22); const p = [0, 0]; p[a.i] = 1; pedCiz(c, p); c.restore(); }
    }
  }
  function damlalikCiz(c, x, y) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(255,236,200,0.75)'; dik(c, -4, -26, 8, 26, 3); c.fill(); c.strokeStyle = 'rgba(200,170,130,0.8)'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#E9A0B8'; dik(c, -6, -40, 12, 15, 5); c.fill(); c.fillStyle = 'rgba(255,214,140,0.9)'; c.fillRect(-3, -12, 6, 10);
    c.restore();
  }
  function imlecCiz(c) {
    const p = S.isaret; if (!p || !p.gor) return;
    const ar = aktifArac(); if (!ar) return;
    let tip = typeof ar.imlec === 'function' ? ar.imlec() : ar.imlec; if (!tip) return;
    const x = p.x, y = p.y;
    c.save();
    if (tip === 'pamuk' || tip === 'pamukPembe') {
      const kir = tip === 'pamuk' ? Math.min(1, S.pamukKir || 0) : 0;
      c.shadowColor = 'rgba(0,0,0,0.18)'; c.shadowBlur = 6 * S.dpr;
      const g = c.createRadialGradient(x - 4, y - 4, 2, x, y, 16); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, tip === 'pamukPembe' ? '#F7D6E4' : karis('#F1EEF2', '#8A7A86', kir * 0.5));
      c.fillStyle = g; c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = 15 + Math.sin(i * 3.7) * 1.2; i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + r, y); } c.fill();
      c.shadowColor = 'transparent'; c.strokeStyle = 'rgba(200,190,200,0.6)'; c.lineWidth = 0.6; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x, y, 3 + i * 2.4, 0, Math.PI * 2); c.stroke(); }
    } else if (tip === 'kopuk') {
      [[0, 0, 9], [10, -6, 6], [-8, -9, 5], [6, 9, 4]].forEach(([dx, dy, r]) => { c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(160,190,230,0.8)'; c.lineWidth = 0.8; c.stroke(); yumusakNokta(c, x + dx - r * 0.3, y + dy - r * 0.3, r * 0.3, '#FFFFFF', 1); });
    } else if (tip === 'su') {
      c.fillStyle = 'rgba(150,205,240,0.9)'; c.beginPath(); c.moveTo(x, y - 14); c.quadraticCurveTo(x + 10, y, x, y + 6); c.quadraticCurveTo(x - 10, y, x, y - 14); c.fill(); yumusakNokta(c, x - 2, y - 2, 3, '#FFFFFF', 0.9);
    } else if (tip === 'cimbiz') {
      c.translate(x, y); c.rotate(-0.7); c.strokeStyle = '#B8BDC8'; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-1.2, 0); c.lineTo(-4, -38); c.moveTo(1.2, 0); c.lineTo(4, -38); c.stroke(); c.strokeStyle = '#F2F4F8'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3, -10); c.lineTo(-4.5, -34); c.stroke();
      c.fillStyle = '#E9A0B8'; c.fillRect(-5, -44, 10, 7);
    } else if (tip === 'sunger') {
      c.fillStyle = '#F7BFD0'; dik(c, x - 14, y - 9, 28, 18, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.45)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(x - 10 + (i % 4) * 7, y - 4 + Math.floor(i / 4) * 8, 1.4, 0, Math.PI * 2); c.fill(); }
    } else if (tip === 'rulo') {
      c.translate(x, y); c.fillStyle = '#C9E7F7'; dik(c, -14, -6, 28, 12, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(-12, -4, 24, 3);
      c.strokeStyle = '#9FB7C8'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -6); c.lineTo(0, -22); c.stroke(); c.fillStyle = '#E9A0B8'; dik(c, -4, -42, 8, 22, 4); c.fill();
    } else if (tip === 'damlalik') damlalikCiz(c, x, y - 6);
    else if (tip === 'krem') { c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(200,190,200,0.8)'; c.stroke(); }
    else if (tip === 'maskara') { c.translate(x, y); c.rotate(-0.6); c.fillStyle = '#2A2228'; dik(c, -2.5, -10, 5, 20, 2.5); c.fill(); c.fillStyle = '#C8A0B8'; dik(c, -3, -46, 6, 36, 2); c.fill(); }
    else if (tip === 'kalem') { c.translate(x, y); c.rotate(-0.6); c.fillStyle = '#1F1B24'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-2.4, -8); c.lineTo(2.4, -8); c.closePath(); c.fill(); c.fillStyle = '#C8A0B8'; dik(c, -2.4, -44, 4.8, 36, 1.5); c.fill(); }
    else if (tip === 'firca') {
      const ay = S.ayar[S.arac] || {}, u = URUNLER[S.arac], r = ay.boy || (u && u.boy) || 12;
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.4 / S.kam.z; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = 'rgba(60,40,60,0.45)'; c.lineWidth = 0.7 / S.kam.z; c.beginPath(); c.arc(x, y, r + 1 / S.kam.z, 0, Math.PI * 2); c.stroke();
    } else if (tip === 'parmak') { c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke(); }
    c.restore();
  }
  function aktifArac() {
    const a = d.asama, id = S.arac;
    if (a === 'temizlik' || a === 'bakim') return d.bitti[id] ? null : A[id];
    if (a === 'makyaj' && id !== 'hazir') return makyajAraci(id);
    return null;
  }

  /* ================================================================ dokunma */
  function isaretAyarla(e, basili) {
    const p = mantiksal(e);
    S.isaret = { x: p.x, y: p.y, gor: basili || e.pointerType === 'mouse', basili };
    if (S.gorunum === 'yuz') S.bakHedef = { x: sinir((p.x - 180) / 140, -1, 1), y: sinir((p.y - 236) / 160, -1, 1) };
    return p;
  }
  function pDown(e) {
    if (e.button && e.button !== 0) return;
    if (S.basan != null) return;
    S.basan = e.pointerId; try { el.tuval.setPointerCapture(e.pointerId); } catch (x) {}
    const p = isaretAyarla(e, true); S.onceki = p;
    const ar = aktifArac();
    if (ar && ar.basla) ar.basla(p, e);
    else if (!ar) { // aşamaya göre küçük sevimli tepki
      if (d.asama === 'temizlik' || d.asama === 'bakim') { if (d.bitti[S.arac]) ctx.toast('Bu adım tamam; alttan sıradakini seç'); }
      else if (S.gorunum === 'govde' || d.asama === 'musteri' || d.asama === 'sac') { ses('pit'); ctx.efekt.kalp(e.clientX, e.clientY, 3); }
    }
    ilerlemeGuncelle(); iste();
  }
  function pMove(e) {
    if (S.basan != null && e.pointerId !== S.basan) return;
    const basili = S.basan != null;
    const p = isaretAyarla(e, basili);
    if (basili) {
      const ar = aktifArac();
      if (ar && ar.surukle && S.onceki) { ar.surukle(p, e, S.onceki); ilerlemeGuncelleSeyrek(); }
      S.onceki = p;
    }
    iste();
  }
  function pUp(e) {
    if (S.basan == null || e.pointerId !== S.basan) return;
    S.basan = null;
    const ar = aktifArac();
    if (ar && ar.bitir) ar.bitir(mantiksal(e), e);
    if (S.firca) fircaBitir();
    if (e.pointerType !== 'mouse') S.isaret = null; else if (S.isaret) S.isaret.basili = false;
    S.onceki = null; ilerlemeGuncelle(); kaydetGec(); iste();
    if (d.asama === 'makyaj') aracSatiriYenileSeyrek();
  }
  function pLeave(e) { if (e.pointerType === 'mouse' && S.basan == null) { S.isaret = null; iste(); } }
  let ilrZam = 0; function ilerlemeGuncelleSeyrek() { const t = performance.now(); if (t - ilrZam > 90) { ilrZam = t; ilerlemeGuncelle(); } }
  let arsZam = 0; function aracSatiriYenileSeyrek() { clearTimeout(arsZam); arsZam = setTimeout(() => { if (ctx) aracSatiriYenile(); }, 250); }

  /* ================================================================ kayıt (mount/unmount) */
  CD.kaydet({
    id: ID, baslik: 'Güzellik Salonu', tamEkran: true,
    ikon: '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="gzA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3EC"/><stop offset="1" stop-color="#F4B6CA"/></linearGradient></defs><ellipse cx="32" cy="28" rx="20" ry="22" fill="url(#gzA)" stroke="#3B3444" stroke-width="3"/><ellipse cx="32" cy="28" rx="13" ry="15" fill="#FFF8FA" opacity=".8"/><path d="M26 50h12l-2 8h-8z" fill="#E98AA8" stroke="#3B3444" stroke-width="3" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="#FFD86E"/><circle cx="52" cy="10" r="2.4" fill="#FFD86E"/><path d="M27 24c2-3 8-3 10 0" stroke="#E98AA8" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    mount(kokEl, baglam) {
      ctx = baglam; kok = kokEl; el = {}; zam = [];
      try {
        d = yukle();
        S = { izg: {}, anim: [], geri: [], ayar: {}, perf: [], urller: [], bak: { x: 0, y: 0 }, bakHedef: { x: 0, y: 0 }, kam: null, kamHedef: { x: 180, y: 240, z: 1 }, basan: null, isaret: null, sivilce: [], kil: [], siyah: [], kizarik: [], kuru: [], catlak: [], kasTel: [] };
        tuvalleriKur();
        el.kok = ctx.el('div.guzellik-kok', { data: { asama: d.asama } });
        el.sahne = ctx.el('div.guzellik-sahne');
        el.tuval = ctx.el('canvas.guzellik-tuval', { role: 'img', 'aria-label': 'Güzellik salonu: müşterinin yüzü ve araçlar' });
        el.bar = ctx.el('div.guzellik-ilerleme', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Adım ilerlemesi' });
        el.adimAd = ctx.el('span.guzellik-adimAd'); el.barDolu = ctx.el('span.guzellik-barDolu'); el.barYazi = ctx.el('span.guzellik-barYazi');
        el.asamaDolu = ctx.el('span.guzellik-asamaDolu');
        el.bar.append(el.adimAd, ctx.el('span.guzellik-barYol', [el.barDolu]), el.barYazi, ctx.el('span.guzellik-asamaYol', { 'aria-hidden': 'true' }, [el.asamaDolu]));
        el.yakin = ctx.el('button.guzellik-yakin', { type: 'button', 'aria-label': 'Göze yaklaş', onclick: () => { ses('tik'); const sira = ['yuz', 'goz', 'dudak']; const i = sira.indexOf(S.kamAd); S.yakinOto = false; kameraAyarla(sira[(i + 1) % sira.length] || 'yuz'); } }, '🔍');
        el.kart = ctx.el('div.guzellik-kart', { 'aria-live': 'polite' });
        el.sahne.append(el.tuval, el.bar, el.yakin, el.kart);
        el.araclar = ctx.el('div.guzellik-araclar', { role: 'toolbar', 'aria-label': 'Araçlar' });
        el.panel = ctx.el('div.guzellik-panel');
        el.tepsi = ctx.el('div.guzellik-tepsi', [el.araclar, el.panel]);
        el.kok.append(el.sahne, el.tepsi);
        kokEl.append(el.kok);
        karakterKur();
        idbGoc().catch(() => {}).then(() => { if (ctx) makyajYukle(); });
        // dokunma
        el.tuval.addEventListener('pointerdown', pDown);
        el.tuval.addEventListener('pointermove', pMove);
        el.tuval.addEventListener('pointerup', pUp);
        el.tuval.addEventListener('pointercancel', pUp);
        el.tuval.addEventListener('pointerleave', pLeave);
        el.tuval.addEventListener('contextmenu', e => e.preventDefault());
        // boyut
        if ('ResizeObserver' in window) { ro = new ResizeObserver(() => boyutla()); ro.observe(el.sahne); }
        else { window.addEventListener('resize', boyutla); }
        gorunurDinleyici = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; kaydetSimdi(); } else iste(); };
        document.addEventListener('visibilitychange', gorunurDinleyici);
        olayKapat.push(ctx.olay.dinle('azHareket', () => { if (S.kam && S.kamHedef) S.kam = Object.assign({}, S.kamHedef); iste(); }));
        // göz kırpma + ışıltı nabzı
        const kirpPlanla = () => { gozKirpZam = setTimeout(() => { if (!ctx) return; if (!ctx.azHareket && S.gorunum === 'yuz') { S.kirp = performance.now(); iste(); } kirpPlanla(); }, 2600 + Math.random() * 3200); };
        kirpPlanla();
        zam.push(setInterval(() => { if (ctx && !ctx.azHareket && d.bakim.parlak >= 0.9 && S.gorunum === 'yuz') iste(); }, 110));
        if (/[?&]test(=|&|$)/.test(location.search)) window.__gz = { ekrana: p => ekrana(p), asama: id => asamaGit(id), arac: id => aracSec(id), durum: () => d, sivilceler: () => S.sivilce.map(q => ({ x: q.x, y: q.y })), killar: () => S.kil.map(h => ({ x: h.x + Math.cos(h.a) * h.l * 0.5, y: h.y + Math.sin(h.a) * h.l * 0.5 })), perfSifirla: () => { S.perf = []; }, perf: () => { const p = S.perf.slice().sort((a, b) => a - b); return { n: p.length, ort: p.reduce((a, b) => a + b, 0) / (p.length || 1), p95: p[Math.floor(p.length * 0.95)] || 0, maks: p[p.length - 1] || 0 }; } };
        asamaGit(d.asama);
        boyutla();
        if (d.asama === 'musteri' && !ctx.depo.al('tanisti', false)) { ctx.depo.yaz('tanisti', true); zam.push(setTimeout(() => ctx && ctx.toast('Salona hoş geldin ✨', 2600), 500)); }
      } catch (e) {
        console.error('[guzellik] mount', e);
        kokEl.innerHTML = ''; kokEl.append(ctx.el('div.icerik', [ctx.el('div.yama.bos-durum', [ctx.el('div.buyuk', '💄'), ctx.el('p', 'Salon şu an toparlanıyor. Eve dönüp tekrar dener misin?')])]));
      }
    },
    unmount() {
      try { kaydetSimdi(); } catch (e) {}
      cancelAnimationFrame(raf); raf = 0; sonT = 0;
      clearTimeout(kayitZam); clearTimeout(gozKirpZam); clearTimeout(arsZam);
      if (mkKayitZam) { clearTimeout(mkKayitZam); mkKayitZam = 0; try { if (T && d) { const kim = d.k.kimlik, c = ctx; void c; T.makyaj.toBlob(b => { if (b) yerel.koy({ id: ID + ':makyaj', blob: b, musteri: kim, tarih: Date.now() }).catch(() => {}); }, 'image/png'); } } catch (e) {} }
      zam.forEach(z => { clearTimeout(z); clearInterval(z); }); zam = [];
      if (ro) { ro.disconnect(); ro = null; } window.removeEventListener('resize', boyutla);
      if (gorunurDinleyici) document.removeEventListener('visibilitychange', gorunurDinleyici); gorunurDinleyici = null;
      olayKapat.forEach(f => { try { if (typeof f === 'function') f(); } catch (e) {} }); olayKapat = [];
      try { urlBirak(); } catch (e) {}
      if (S) S.geri.forEach(k => { if (k.img) k.img.width = 1; });
      const eskiT = T; T = null; setTimeout(() => tuvalleriBirak(eskiT), 400);
      kucukOnbellek.clear(); uclar.clear();
      try { delete window.__gz; } catch (e) {}
      try { ctx.ses.hepsiniDurdur(); } catch (e) {}
      ctx = null; kok = null; el = {};
    }
  });
})();
