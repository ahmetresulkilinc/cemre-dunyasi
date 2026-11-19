/* js/bolum/safir.js — Safir'in Yeri (sakin anı köşesi)
   - Safir YALNIZ bu bölümün içinde görünür: posta/bildirim/"sen yokken" kaydı göndermez, ipucu yazmaz.
   - Kalıcı veriler kişi bazlı (her kişi yalnız kendi anahtarına yazar, senk ile iki telefona gider):
       cd.safir.cicek.<kim>  [{ id, t, tur }]     bırakılan çiçekler (en çok 60)
       cd.safir.ani.<kim>    [{ id, t, metin }]   anı defteri (≤280 karakter)
   - Bu cihaza özel: cd.cihaz.safir.karsilama (ilk açılış kartı; senklenmez). */
(() => {
  'use strict';
  const ID = 'safir';
  const KISILER = ['cemre', 'ahmet'];
  const CICEK_MAKS = 60;
  const ANI_MAKS = 280;
  const KARSILAMA = 'cihaz.safir.karsilama';

  let ctx = null, kok = null, nesil = 0;
  let zamanlar = [], dinleyiciler = [];
  let sahne = null, kedi = null, cicekKat = null, hapEl = null, defterKap = null;
  let oyunda = false;

  const zt = (fn, ms) => { const t = setTimeout(fn, ms); zamanlar.push(t); return t; };
  const dizi = (v) => Array.isArray(v) ? v : [];
  const temiz = (v) => (v == null ? '' : String(v)).replace(/\s+$/g, '').replace(/^\s+/g, '');

  /* ------------------------------------------------------------ pixel çizim */
  function pixel(satirlar, renk, sinif, etiket) {
    const w = Math.max(...satirlar.map(s => s.length)), h = satirlar.length;
    let r = '';
    satirlar.forEach((s, y) => {
      s = s.padEnd(w, '.');
      let x = 0;
      while (x < w) {
        const c = s[x]; if (c === '.' || !renk[c]) { x++; continue; }
        let n = 1; while (x + n < w && s[x + n] === c) n++;
        r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + renk[c] + '"/>';
        x += n;
      }
    });
    return '<svg class="' + (sinif || '') + '" viewBox="0 0 ' + w + ' ' + h + '" style="--w:' + w + ';--h:' + h + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + r + '</svg>';
  }

  // tekir yavru: gri zemin, koyu çizgiler, beyaz ağız/göğüs, yeşilimsi gözler
  const KEDI_RENK = { K: '#3B3444', G: '#A3A2AA', g: '#8C8B94', D: '#55525E', W: '#F6F2F1', P: '#E9A5B5', E: '#9CC98A', e: '#2F3B2C' };
  const KEDI_UYKU = [
    '..K....K................',
    '.KGK..KGK...............',
    '.KGGKKGGK......KKKKKK...',
    'KGDGDGDGGK...KKGDGGDGKK.',
    'KGGGGGGGGK.KKGGGGGGGGGGK',
    'KGDDGGDDGKKGDGGDGGDGGGGK',
    'KGGWWPWWGGKGGGGGGGGGGDGK',
    '.KWWWWWWWKGgDGGDGGDGGGGK',
    '.KWWWWWWKGGGGGGGGGGGGDGK',
    'KWWWWWWWGGgGGGGGGGGGGGK.',
    'KWKWWKWKDDGDDGDDGDDGGK..',
    '.KKKKKKKKKKKKKKKKKKKKK..'
  ];
  const KEDI_UYANIK = [
    '.K.........K............',
    'KGK.......KGK...........',
    'KGGK.....KGGK...........',
    'KGDGKKKKKGDGK...........',
    'KGGDGDGDGDGGK...........',
    'KGGGGGGGGGGGK...........',
    'KGEEGGGGGEEGK...........',
    'KGEeGGGGGEeGK.......KK..',
    'KGGGWWPWWGGGK......KGK..',
    '.KGWWKWKWWGK.......KDK..',
    '..KWWWWWWWKKKKKKKKKGGK..',
    '.KGGWWWWWGDGGDGGDGGGK...',
    'KGDGWWWWWGGGGGGGGDGK....',
    'KGGGWWWWGGDGGDGGGGGK....',
    'KWKWKGGKWKWKKGGKWKWK....',
    '.KKKK..KKKK..KK.KKKK....'
  ];
  const AGAC = pixel([
    '.......LLLLLL.......',
    '.....LLGGGGGGLL.....',
    '...LLGGGGgGGGGGL....',
    '..LGGGgGGGGGGgGGL...',
    '.LGGGGGGGGLGGGGGGL..',
    '.LGgGGGGGGGGGGgGGGL.',
    'LGGGGGLGGGGGgGGGGGGL',
    'LGGgGGGGGGGGGGGGLGGL',
    'LGGGGGGGgGGGGGGGGGgL',
    '.GGGGgGGGGGGLGGgGGG.',
    '.gGGGGGGGgGGGGGGGGg.',
    '..gGGGGGGGGGGgGGGg..',
    '...ggGGgBBGGGGGgg...',
    '.....gggBBgBggg.....',
    '........BBb.........',
    '........BBb.........',
    '........BBb.........',
    '........BBb.........',
    '.......BBBbb........',
    '......BBB.bbb.......'
  ], { L: '#B8DDB9', G: '#8FC7A0', g: '#6BAF86', B: '#9C6B4E', b: '#7A5240' }, 'safir-agac-svg');
  const YILDIZ = pixel(['..Y..', '..Y..', 'YYWYY', '..Y..', '..Y..'], { Y: '#FFE9A8', W: '#FFFDF4' }, 'safir-yildiz-svg');

  // çiçek türleri (yaprak, orta)
  const CICEKLER = [
    { P: '#FFF9F3', C: '#FFD86B' },   // papatya
    { P: '#C9B6F2', C: '#FFF1B8' },   // lavanta
    { P: '#FFB7C8', C: '#FFE9A8' },   // pembe
    { P: '#FFE28A', C: '#F5B54A' },   // sarı
    { P: '#A9D6F2', C: '#FFF9F3' }    // unutma beni
  ];
  const CICEK_SATIR = ['.P.P.', 'PPCPP', '.PPP.', '..S..', '.LS..', '..SL.', '..S..'];
  const cicekSvg = (tur) => pixel(CICEK_SATIR, Object.assign({ S: '#5E9E6E', L: '#7CCB9A' }, CICEKLER[tur % CICEKLER.length]), 'safir-cicek-svg');

  // deterministik sayı (id → 0..1)
  function hash(s) { let h = 2166136261; s = String(s || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const oran = (s, tuz) => (hash(s + '|' + tuz) % 10000) / 10000;

  /* ------------------------------------------------------------ veri */
  const kimim = () => (CD.kim ? CD.kim() : null);
  const adi = (k) => (CD.kimAdi ? CD.kimAdi(k) : (k === 'ahmet' ? 'Ahmet' : 'Cemre'));
  function cicekler() {
    const hepsi = [];
    KISILER.forEach(k => dizi(ctx.depo.al('cicek.' + k, [])).forEach(c => { if (c && c.id) hepsi.push({ id: String(c.id), t: Number(c.t) || 0, tur: Number(c.tur) || 0, kim: k }); }));
    return hepsi.sort((a, b) => a.t - b.t).slice(-CICEK_MAKS);
  }
  function anilar() {
    const hepsi = [];
    KISILER.forEach(k => dizi(ctx.depo.al('ani.' + k, [])).forEach(a => { const m = temiz(a && a.metin); if (a && a.id && m) hepsi.push({ id: String(a.id), t: Number(a.t) || 0, metin: m.slice(0, ANI_MAKS), kim: k }); }));
    return hepsi.sort((a, b) => b.t - a.t);
  }
  function goreli(t) {
    if (CD.varlik && CD.varlik.gorelizaman) return CD.varlik.gorelizaman(t);
    const fark = Date.now() - t;
    if (fark < 120000) return 'az önce';
    if (fark < 3600000) return Math.round(fark / 60000) + ' dk önce';
    if (fark < 86400000) return Math.round(fark / 3600000) + ' saat önce';
    return Math.round(fark / 86400000) + ' gün önce';
  }
  // bu telefon kimin? seçilmemişse sor (çiçek/anı kime ait yazılsın)
  async function kimGerek() {
    let k = kimim();
    if (k) return k;
    if (!CD.kimSec) return null;
    const n = nesil;
    k = await CD.kimSec(false);
    return (n === nesil && ctx) ? (k || null) : null;
  }

  /* ------------------------------------------------------------ sahne */
  function sahneKur() {
    sahne = ctx.el('div.safir-sahne');
    const gok = ctx.el('div.safir-gok', { 'aria-hidden': 'true' });
    const yildiz = ctx.el('span.safir-yildiz', { 'aria-hidden': 'true', html: YILDIZ });
    const agac = ctx.el('div.safir-agac', { 'aria-hidden': 'true', html: AGAC });
    const cimen = ctx.el('div.safir-cimen', { 'aria-hidden': 'true' });
    cicekKat = ctx.el('div.safir-cicekler', { 'aria-hidden': 'true' });
    kedi = ctx.el('button.safir-kedi', { type: 'button', 'aria-label': 'Uyuyan Safir. Dokun', html: '<span class="safir-kedi-uyku">' + pixel(KEDI_UYKU, KEDI_RENK, 'safir-kedi-svg') + '</span><span class="safir-kedi-uyanik">' + pixel(KEDI_UYANIK, KEDI_RENK, 'safir-kedi-svg') + '</span><span class="safir-zzz" aria-hidden="true">z</span>' });
    kedi.addEventListener('click', oyna);
    hapEl = ctx.el('span.safir-hap', { 'aria-hidden': 'true' }, 'hap! 🐾');
    sahne.append(gok, yildiz, agac, cimen, cicekKat, kedi, hapEl);
    return sahne;
  }

  function cicekCiz(yeniId) {
    if (!cicekKat) return;
    cicekKat.innerHTML = '';
    cicekler().forEach(c => {
      // ağacın çevresindeki çimen: sol ve sağ şerit (gövdenin önü boş kalsın)
      const sol = oran(c.id, 'yan') < 0.5;
      const x = sol ? 4 + oran(c.id, 'x') * 36 : 58 + oran(c.id, 'x') * 38;
      const y = 3 + oran(c.id, 'y') * 17;
      const el = ctx.el('span.safir-cicek' + (c.id === yeniId ? '.safir-yeni' : ''), { html: cicekSvg(c.tur) });
      el.appendChild(ctx.el('span.safir-nokta.safir-nokta-' + c.kim));
      el.style.left = x.toFixed(2) + '%';
      el.style.bottom = y.toFixed(2) + '%';
      el.style.zIndex = String(100 - Math.round(y));
      cicekKat.appendChild(el);
    });
  }

  function cicekBirak() {
    kimGerek().then(k => {
      if (!k || !ctx) return;
      const c = { id: CD.kimlik(), t: Date.now(), tur: 0 };
      c.tur = hash(c.id) % CICEKLER.length;
      const liste = dizi(ctx.depo.al('cicek.' + k, [])).concat([c]).slice(-CICEK_MAKS);
      ctx.depo.yaz('cicek.' + k, liste);
      ctx.ses.pit();
      cicekCiz(c.id);
      const el = cicekKat && cicekKat.lastElementChild;
      if (el && !ctx.azHareket) { const r = el.getBoundingClientRect(); ctx.efekt.emoji(r.left + r.width / 2, r.top, '🌼', 1); }
    });
  }

  function oyna() {
    if (!ctx || oyunda) return;
    oyunda = true;
    ctx.ses.pit();
    sahne.classList.add('safir-uyandi');
    zt(() => {
      if (!ctx) return;
      sahne.classList.add('safir-isir');
      const r = hapEl.getBoundingClientRect();
      ctx.efekt.pati(r.left + r.width / 2, r.bottom + 6);
    }, ctx.azHareket ? 150 : 420);
    zt(() => { if (ctx) sahne.classList.remove('safir-isir'); }, 1700);
    zt(() => { if (ctx) sahne.classList.remove('safir-uyandi'); }, 2100);
    zt(() => { oyunda = false; }, 2500);
  }

  /* ------------------------------------------------------------ fotoğraflar */
  function fotoKur() {
    const liste = dizi(((ctx.config || {}).SAFIR || {}).FOTOLAR)
      .filter(f => f && f.yol && window.GIZLI && window.GIZLI._url && window.GIZLI._url[f.yol]);
    if (!liste.length) return null;    // manifest yok (yerel) → alan sessizce gizli
    const kap = ctx.el('div.safir-fotolar', { role: 'list', 'aria-label': 'Safir\'in fotoğrafları' });
    liste.forEach((f, i) => {
      const alt = temiz(f.alt) || 'Safir';
      const src = window.GIZLI.url(f.yol);
      const p = ctx.el('button.safir-polaroid', { type: 'button', role: 'listitem', 'aria-label': alt + ', büyüt' }, [ctx.el('img', { src, alt, loading: 'lazy', draggable: 'false' })]);
      p.style.setProperty('--egim', ((i % 2 ? 1 : -1) * (1.2 + (i % 3) * 0.6)).toFixed(1) + 'deg');
      p.addEventListener('click', () => {
        ctx.ses.tik();
        ctx.sheet(ctx.el('div.safir-buyuk', [ctx.el('img', { src, alt, draggable: 'false' })]), { baslik: 'Safir' });
      });
      kap.appendChild(p);
    });
    return kap;
  }

  /* ------------------------------------------------------------ anı defteri */
  function defterCiz() {
    if (!defterKap || !ctx) return;
    defterKap.innerHTML = '';
    const liste = anilar(), ben = kimim();
    if (!liste.length) { defterKap.appendChild(ctx.el('p.safir-bos', 'İstediğin zaman buraya bir anı bırakabilirsin 🤍')); return; }
    const ol = ctx.el('ul.safir-defter-liste');
    liste.forEach(a => {
      const ust = ctx.el('div.safir-ani-ust', [
        ctx.el('span.safir-nokta.safir-nokta-' + a.kim, { 'aria-hidden': 'true' }),
        ctx.el('span.safir-ani-ad', adi(a.kim)),
        ctx.el('span.safir-ani-zaman', goreli(a.t))
      ]);
      if (a.kim === ben) ust.appendChild(ctx.el('button.dugme-hayalet.safir-ani-sil', { type: 'button', 'aria-label': 'Bu anıyı sil', onclick: () => aniSil(a.id) }, 'Sil'));
      ol.appendChild(ctx.el('li.safir-ani', [ust, ctx.el('p.safir-ani-metin', a.metin)]));
    });
    defterKap.appendChild(ol);
  }
  async function aniSil(id) {
    const n = nesil, k = kimim(); if (!k) return;
    ctx.sheetKapat();
    await CD.bekle(340); if (n !== nesil || !ctx) return;
    const evet = await ctx.onayla('Bu anı defterden silinsin mi?', 'Sil', 'Kalsın');
    if (!evet || n !== nesil || !ctx) return;
    const yeni = dizi(ctx.depo.al('ani.' + k, [])).filter(a => a && String(a.id) !== id);
    if (yeni.length) ctx.depo.yaz('ani.' + k, yeni); else ctx.depo.sil('ani.' + k);   // boşsa anahtar silinir (mezar taşı karşıya da gider)
    defterAc();
  }
  function defterAc() {
    if (!ctx) return;
    const metin = ctx.el('textarea.girdi.safir-girdi', { maxlength: String(ANI_MAKS), rows: '3', placeholder: 'Aklına gelen bir anı…', 'aria-label': 'Anı' });
    const sayac = ctx.el('span.safir-sayac', { 'aria-live': 'off' }, '0 / ' + ANI_MAKS);
    const yaz = ctx.el('button.dugme', { type: 'button' }, 'Deftere yaz');
    metin.addEventListener('input', () => { sayac.textContent = metin.value.length + ' / ' + ANI_MAKS; });
    yaz.addEventListener('click', async () => {
      const m = temiz(metin.value).slice(0, ANI_MAKS);
      if (!m) { metin.focus(); return; }
      const k = await kimGerek(); if (!k || !ctx) return;
      const liste = dizi(ctx.depo.al('ani.' + k, [])).concat([{ id: CD.kimlik(), t: Date.now(), metin: m }]);
      ctx.depo.yaz('ani.' + k, liste);
      ctx.ses.pit();
      metin.value = ''; sayac.textContent = '0 / ' + ANI_MAKS;
      defterCiz();
    });
    defterKap = ctx.el('div.safir-defter');
    const kutu = ctx.el('div.dikey.safir-defter-sayfa', [
      ctx.el('div.safir-yaz', [metin, ctx.el('div.satir.safir-yaz-alt', [sayac, yaz])]),
      defterKap
    ]);
    defterCiz();
    ctx.sheet(kutu, { baslik: 'Defter 📖', odak: false, kapaninca: () => { defterKap = null; } });
  }

  /* ------------------------------------------------------------ ilk giriş (yalnız bu cihazda bir kez) */
  function karsilamaKur() {
    if (CD.depo.al(KARSILAMA, false)) return null;
    const kart = ctx.el('button.safir-karsilama', { type: 'button', 'aria-label': 'Bu küçük köşe Safir için. Kapatmak için dokun' }, 'Bu küçük köşe Safir için 🤍');
    kart.addEventListener('click', () => {
      CD.depo.yaz(KARSILAMA, Date.now());
      kart.classList.add('safir-gidiyor');
      zt(() => kart.remove(), ctx && ctx.azHareket ? 0 : 420);
    });
    return kart;
  }

  /* ------------------------------------------------------------ kayıt */
  CD.kaydet({
    id: ID,
    baslik: 'Safir',
    ikon: pixel(['.K..........K.', 'KGK........KGK', 'KGGK.KKKK.KGGK', 'KGDGKGDDGKGDGK', 'KGGGGGGGGGGGGK', 'KGEEGGGGGGEEGK', 'KGEeGGGGGGEeGK', 'KDGGGWWPWWGGDK', '.KGGWWWWWWGGK.', '..KKWWWWWWKK..', '....KKKKKK....'], KEDI_RENK, 'safir-ikon'),
    tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el; nesil++; oyunda = false; zamanlar = []; dinleyiciler = []; defterKap = null;
      try {
        const icerik = ctx.el('div.icerik.safir-icerik');
        const kart = karsilamaKur();
        const s = sahneKur();
        if (kart) s.appendChild(kart);
        icerik.appendChild(s);
        const foto = fotoKur();
        if (foto) icerik.appendChild(foto);
        el.appendChild(icerik);
        cicekCiz(null);
        ctx.altbar([
          { id: 'cicek', ad: 'Çiçek bırak', ikon: '🌼', birincil: true, tikla() { cicekBirak(); } },
          { id: 'defter', ad: 'Defter', ikon: '📖', tikla() { ctx.ses.tik(); defterAc(); } }
        ]);
        // karşı telefondan gelen çiçek/anı: sessizce yerine konur (bildirim yok)
        dinleyiciler.push(ctx.olay.dinle('senk:yenilendi', () => { if (!ctx) return; cicekCiz(null); defterCiz(); }));
      } catch (e) {
        console.warn('[safir]', e);
      }
    },
    unmount() {
      nesil++;
      zamanlar.forEach(clearTimeout); zamanlar = [];
      dinleyiciler.forEach(f => { try { f(); } catch (e) {} }); dinleyiciler = [];
      if (ctx) ctx.ses.hepsiniDurdur();
      sahne = null; kedi = null; cicekKat = null; hapEl = null; defterKap = null; oyunda = false;
      ctx = null; kok = null;
    }
  });
})();
