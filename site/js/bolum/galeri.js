/* js/bolum/galeri.js — Cemre Sanat Galerisi
   Lobi (tabela + giriş bileti + üç salon kapısı) → yürünebilir salon: yatay kayan duvar, eserler sırayla spot ışığının altına gelir.
   Salonlar: cemre (portreler, fotoğraflar) · tirnak (tırnak eserleri) · bizim (anılarımız).
   Eser kaynakları (ikisi birlikte):
     1) Sabit liste (config.js → GALERI.CEMRE / GALERI.ESERLER / GALERI.BIZIM; ESERLER'e TIRNAK.FOTO_ILHAM da eklenir, tekrar etmeden).
        Her öğe { yol, baslik, tarih, aciklama, cerceve }; fotoğraf şifreli → window.GIZLI.url(yol).
     2) Site içinden eklenenler (kişi bazlı, senk ile iki telefona):
        cd.galeri.eser.<kim>   [{ id, salon, medya, baslik, tarih, aciklama, cerceve, sira, t }]
        medya: 'galeri:<kim|yerel>:<id>' → CD.medya (IndexedDB 'genel' → senk → cemre_foto), 1600 px JPEG.
        "Bu telefon kimin?" seçilmemişse kayıt bu telefonda kalır: cd.cihaz.galeri.eser (senklenmez); kişi seçilince kendi anahtarına taşınır.
        cd.galeri.cerceve.<kim> { '<anahtar>': '<çerçeve>' }  sabit eserler için kendi çerçeve seçimin.
   Herkes yalnız kendi eserini düzenler/siler/sıralar. Sıralama: her kayıt 'sira' taşır; taşınan eserin yeni sırası komşularının arasına düşer
   (başkasının kaydına dokunulmaz). Kullanıcı metinleri her yerde textContent ile basılır. */
(() => {
  'use strict';
  const ID = 'galeri';
  const A = () => CD.ani;
  const KISILER = ['cemre', 'ahmet'];
  const K_ESER = 'galeri.eser';
  const K_YEREL = 'cihaz.galeri.eser';
  const K_CERCEVE = 'galeri.cerceve';
  const K_CERCEVE_YEREL = 'cihaz.galeri.cerceve';
  const K_SALON = 'cihaz.galeri.salon';
  const K_ZIYARET = 'cihaz.galeri.ziyaret';
  const MAKS = 120;
  const FOTO_EN = 1600, FOTO_SINIR = 1150 * 1024;   // senk satırı ~1.6 MB (base64 dahil) → blob en çok ~1.1 MB
  const SALONLAR = [
    { id: 'cemre', ad: 'Cemre', alt: 'Portreler ve fotoğraflar', duvar: 'bordo' },
    { id: 'tirnak', ad: 'Tırnak Eserleri', alt: 'Cemre\'nin kendi elinden tırnak tasarımları', duvar: 'krem' },
    { id: 'bizim', ad: 'Bizim Anılarımız', alt: 'İkimizden kareler', duvar: 'gul' }
  ];
  const CERCEVELER = [['barok', 'Altın barok'], ['minimal', 'İnce siyah'], ['paspartu', 'Beyaz paspartu'], ['oval', 'Vintage oval'], ['ahsap', 'Ahşap'],
    ['polaroid', 'Polaroid'], ['kalp', 'Pastel kalpli'], ['neon', 'Neon'], ['pixel', 'Pixel']];
  const CER_ID = CERCEVELER.map(c => c[0]);
  const VARSAYILAN = { cemre: ['barok', 'paspartu', 'oval', 'minimal', 'ahsap'], tirnak: ['paspartu', 'neon', 'kalp', 'minimal', 'polaroid'], bizim: ['polaroid', 'ahsap', 'kalp', 'paspartu', 'pixel'] };
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 24L32 8l26 16z" fill="#7A2639" stroke="#4A1622" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="26" width="5" height="24" fill="#FFF6E6"/><rect x="49" y="26" width="5" height="24" fill="#FFF6E6"/><rect x="20" y="28" width="24" height="18" fill="#D9A93E"/><rect x="24" y="32" width="16" height="10" fill="#FF9DB4"/><rect x="6" y="50" width="52" height="6" rx="2" fill="#4A1622"/></svg>';

  let ctx = null, kok = null, nesil = 0, salon = 'cemre';
  let cozucu = [], raf = 0, gozlem = null, liste = [], olculer = [], genislik = 0, merkezI = -1, istenen = new Set();
  const ui = {};
  const dizi = (v) => Array.isArray(v) ? v : [];
  const ben = () => (CD.kim ? CD.kim() : null);
  const adi = (k) => (CD.kimAdi ? CD.kimAdi(k) : (k === 'ahmet' ? 'Ahmet' : 'Cemre'));
  const kirp = (s, n) => String(s == null ? '' : s).trim().slice(0, n || 200);
  const az = () => !!(ctx ? ctx.azHareket : (CD.azHareket && CD.azHareket()));
  const salonTanim = (id) => SALONLAR.find(s => s.id === id) || SALONLAR[0];
  const salonVar = (id) => SALONLAR.some(s => s.id === id);
  const gecerliC = (c) => CER_ID.indexOf(c) >= 0 ? c : '';

  /* ================================================================ pixel parçalar */
  const px = (satir, renk, sinif) => (CD.ani && CD.ani.pixel) ? CD.ani.pixel(satir, renk, sinif) : '';
  const LOGO = () => px(['GGGGGGGGGGGG', 'GwwwwwwwwwwG', 'GwwRRwwRRwwG', 'GwRRRRRRRRwG', 'GwRRRRRRRRwG', 'GwwRRRRRRwwG', 'GwwwRRRRwwwG', 'GwwwwRRwwwwG', 'GwwwwwwwwwwG', 'GGGGGGGGGGGG'],
    { G: '#D9A93E', w: '#FFF6E6', R: '#E8557A' }, 'galeri-logo-svg');
  const SPOT = () => px(['...KKKK...', '....KK....', '....KK....', '...KBBK...', '..KBbbBK..', '.KBbbbbBK.', 'KBbbbbbbBK', 'KYYYYYYYYK'], { K: '#2B1C1F', B: '#D9B45A', b: '#9C7A30', Y: '#FFE9B0' }, 'galeri-spot-svg');
  const BANK = () => px(['.VVVVVVVVVVVVVVVVVVVVVV.', 'VvvvvvvvvvvvvvvvvvvvvvvV', 'VVVVVVVVVVVVVVVVVVVVVVVV', 'WWWWWWWWWWWWWWWWWWWWWWWW', '.Ww..................wW.', '.Ww..................wW.', '.ww..................ww.'],
    { V: '#7E1D32', v: '#A3324B', W: '#6B4226', w: '#4A2C18' }, 'galeri-bank-svg');

  /* ================================================================ veri */
  function ilhamBaslik(alt) {
    let s = kirp(alt, 80).replace(/^cemre['’]nin eseri\s*:\s*/i, '');
    if (!s) return 'Tırnak eseri';
    return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
  }
  function sabitler(sid) {
    const G = (CD.config && CD.config.GALERI) || {};
    let l = [];
    if (sid === 'cemre') l = dizi(G.CEMRE).slice();
    else if (sid === 'bizim') l = dizi(G.BIZIM).slice();
    else {
      l = dizi(G.ESERLER).slice();
      const yollar = new Set(l.map(x => x && x.yol));
      dizi(((CD.config || {}).TIRNAK || {}).FOTO_ILHAM).forEach(x => {
        if (x && typeof x.yol === 'string' && x.yol && !yollar.has(x.yol)) { yollar.add(x.yol); l.push({ yol: x.yol, baslik: ilhamBaslik(x.alt) }); }
      });
    }
    const sec = benimCerceveler();
    return l.filter(x => x && typeof x.yol === 'string' && x.yol).map(x => {
      const anahtar = 's:' + x.yol;
      return { anahtar, sabit: true, salon: sid, yol: x.yol, baslik: kirp(x.baslik, 80), tarih: kirp(x.tarih, 40), aciklama: kirp(x.aciklama, 400),
        cerceve: gecerliC(sec[anahtar]) || gecerliC(x.cerceve), benim: false, kim: null };
    });
  }
  const gecerliKayit = (x) => !!(x && typeof x === 'object' && typeof x.id === 'string' && x.id && typeof x.medya === 'string' && x.medya.indexOf('galeri:') === 0 && salonVar(x.salon));
  function kullanicilar() {
    const k = ben(), l = [];
    KISILER.forEach(kim => dizi(CD.depo.al(K_ESER + '.' + kim, [])).forEach(x => { if (gecerliKayit(x)) l.push(Object.assign({}, x, { kim, benim: kim === k })); }));
    dizi(CD.depo.al(K_YEREL, [])).forEach(x => { if (gecerliKayit(x)) l.push(Object.assign({}, x, { kim: null, yerel: true, benim: true })); });
    return l.map(x => Object.assign(x, { anahtar: 'k:' + x.id, sabit: false, baslik: kirp(x.baslik, 80), tarih: kirp(x.tarih, 40), aciklama: kirp(x.aciklama, 400),
      cerceve: gecerliC(x.cerceve), sira: Number.isFinite(Number(x.sira)) ? Number(x.sira) : (Number(x.t) || 0) }));
  }
  const siraKarsilastir = (a, b) => (a.sira - b.sira) || ((Number(a.t) || 0) - (Number(b.t) || 0)) || (a.id < b.id ? -1 : 1);
  function salonEserleri(sid) {
    const k = kullanicilar().filter(x => x.salon === sid).sort(siraKarsilastir);
    return sabitler(sid).concat(k);
  }
  const toplamEser = () => SALONLAR.reduce((n, s) => n + salonEserleri(s.id).length, 0);
  function benimAnahtar() { const k = ben(); return k ? K_ESER + '.' + k : K_YEREL; }
  function benimListe() { return dizi(CD.depo.al(benimAnahtar(), [])).filter(gecerliKayit); }
  function benimYaz(l) { const a = benimAnahtar(); l = dizi(l).slice(-MAKS); if (l.length) CD.depo.yaz(a, l); else CD.depo.sil(a); }
  function benimGuncelle(id, degisim) { benimYaz(benimListe().map(x => x.id === id ? Object.assign({}, x, degisim) : x)); }
  function benimCerceveler() { const k = ben(); const v = CD.depo.al(k ? K_CERCEVE + '.' + k : K_CERCEVE_YEREL, {}); return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
  function sabitCerceveYaz(anahtar, c) { const k = ben(); const m = benimCerceveler(); m[anahtar] = c; CD.depo.yaz(k ? K_CERCEVE + '.' + k : K_CERCEVE_YEREL, m); }
  /* kişi seçilince bu telefonda bekleyen eserler kişinin kendi anahtarına geçer */
  function yereliTasi() {
    const k = ben(); if (!k) return;
    const y = dizi(CD.depo.al(K_YEREL, [])).filter(gecerliKayit);
    if (y.length) {
      const a = K_ESER + '.' + k, l = dizi(CD.depo.al(a, [])), var_ = new Set(l.map(x => x && x.id));
      y.forEach(x => { if (!var_.has(x.id)) l.push(x); });
      CD.depo.yaz(a, l.slice(-MAKS));
    }
    CD.depo.sil(K_YEREL);
    const c = CD.depo.al(K_CERCEVE_YEREL, null);
    if (c && typeof c === 'object' && Object.keys(c).length) { CD.depo.yaz(K_CERCEVE + '.' + k, Object.assign({}, c, benimCerceveler())); }
    CD.depo.sil(K_CERCEVE_YEREL);
  }
  const cerceveOf = (e, i) => e.cerceve || VARSAYILAN[e.salon || salon][i % 5];
  function tarihMetni(t) { t = kirp(t, 40); return (A() && A().tarihGecerli(t)) ? A().tarihUzun(t) : t; }
  const sanatci = (e) => (e.salon === 'bizim' ? 'Sanatçılar: ' + adi('cemre') + ' ve ' + adi('ahmet') : 'Sanatçı: ' + adi('cemre'));
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const buAy = () => { const d = new Date(); return AYLAR[d.getMonth()] + ' ' + d.getFullYear(); };

  /* ================================================================ fotoğraflar */
  const urlOn = {};
  async function medyaUrl(id, gelince) {
    if (urlOn[id]) return urlOn[id];
    let k = null; try { k = await CD.depo.idb.al('genel', id); } catch (e) {}
    if (k && k.blob instanceof Blob) { urlOn[id] = URL.createObjectURL(k.blob); return urlOn[id]; }
    if (gelince && !istenen.has(id) && A() && A().aktif() && CD.medya) { istenen.add(id); CD.medya.cek(id, gelince); }
    return '';
  }
  function resimBagla(img, e) {
    const mat = img.parentNode;
    img.addEventListener('error', () => { if (mat) mat.classList.add('kayip'); img.hidden = true; });
    img.addEventListener('load', () => { if (mat) mat.classList.remove('kayip', 'bekliyor'); img.hidden = false; });
    if (e.sabit) { img.src = (window.GIZLI && GIZLI.url) ? GIZLI.url(e.yol) : e.yol; return; }
    img.dataset.medya = e.medya;
    if (mat) mat.classList.add('bekliyor');
    const n = nesil;
    const doldur = () => medyaUrl(e.medya, doldur).then(u => { if (u && n === nesil && img.isConnected) img.src = u; });
    doldur();
  }
  function bekleyenleriDoldur() {
    if (!kok) return;
    document.querySelectorAll('img[data-medya]').forEach(img => {
      if (img.getAttribute('src')) return;
      const id = img.dataset.medya;
      medyaUrl(id, null).then(u => { if (u && img.isConnected) img.src = u; });
    });
  }
  async function fotoHazirla(file) {
    let b = await CD.fotoKucult(file, FOTO_EN, 0.82);
    if (b && b.size > FOTO_SINIR) b = await CD.fotoKucult(b, FOTO_EN, 0.68);
    if (b && b.size > FOTO_SINIR) b = await CD.fotoKucult(b, 1280, 0.7);
    return b;
  }

  /* ================================================================ lobi */
  function lobiKur() {
    const ziyaret = (Number(CD.depo.al(K_ZIYARET, 0)) || 0) + 1; CD.depo.yaz(K_ZIYARET, ziyaret);
    const tabela = ctx.el('div.galeri-tabela', [
      ctx.el('span.galeri-zincir', { 'aria-hidden': 'true' }),
      ctx.el('div.galeri-tabela-plaka', [
        ctx.el('span.galeri-logo', { 'aria-hidden': 'true', html: LOGO() }),
        ctx.el('h2.galeri-tabela-ad', [ctx.el('span.galeri-tabela-isim', adi('cemre')), ctx.el('span.galeri-tabela-alt', 'Sanat Galerisi')])
      ])
    ]);
    ui.biletSayi = ctx.el('span');
    ui.biletZiyaretci = ctx.el('span');
    const bilet = ctx.el('div.galeri-bilet', { role: 'group', 'aria-label': 'Giriş bileti' }, [
      ctx.el('div.galeri-bilet-govde', [
        ctx.el('span.galeri-bilet-baslik', 'Giriş bileti'),
        ctx.el('strong.galeri-bilet-sergi', 'Kalıcı koleksiyon'),
        ui.biletZiyaretci, ui.biletSayi
      ]),
      ctx.el('div.galeri-bilet-kocan', [ctx.el('span', 'No.'), ctx.el('strong', String(ziyaret).padStart(4, '0')), ctx.el('span', 'süresiz geçerli')])
    ]);
    ui.kapilar = ctx.el('div.galeri-kapilar', { role: 'tablist', 'aria-label': 'Salonlar' });
    ui.kapiDugme = SALONLAR.map(s => {
      const say = ctx.el('span.galeri-kapi-say');
      const b = ctx.el('button.galeri-kapi', { type: 'button', role: 'tab', id: 'galeri-kapi-' + s.id, 'aria-controls': 'galeriOda', data: { duvar: s.duvar } },
        [ctx.el('span.galeri-kapi-kemer', { 'aria-hidden': 'true' }), ctx.el('span.galeri-kapi-ad', s.ad), say]);
      b._say = say;
      b.addEventListener('click', () => { if (salon === s.id) return; ctx.ses.tik(); salonSec(s.id); });
      return b;
    });
    ui.kapilar.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = ui.kapiDugme.indexOf(document.activeElement); if (i < 0) return;
      const n = ui.kapiDugme[(i + (e.key === 'ArrowRight' ? 1 : ui.kapiDugme.length - 1)) % ui.kapiDugme.length];
      n.focus(); n.click(); e.preventDefault();
    });
    ui.kapiDugme.forEach(b => ui.kapilar.appendChild(b));
    return ctx.el('section.galeri-lobi', { 'aria-label': 'Galeri girişi' }, [ctx.el('div.galeri-lobi-ust', [tabela, bilet]), ui.kapilar]);
  }
  function lobiGuncelle() {
    const n = toplamEser();
    ui.biletSayi.textContent = n ? n + ' eser, 3 salon' : '3 salon, ilk eserlerini bekliyor';
    ui.biletZiyaretci.textContent = 'Ziyaretçi: ' + (ben() ? adi(ben()) : 'sevgili misafir');
    ui.kapiDugme.forEach((b, i) => {
      const s = SALONLAR[i], sec = s.id === salon, m = salonEserleri(s.id).length;
      b.setAttribute('aria-selected', sec ? 'true' : 'false'); b.tabIndex = sec ? 0 : -1;
      b._say.textContent = m ? m + ' eser' : 'boş duvar';
    });
  }

  /* ================================================================ salon (yürünen duvar) */
  function odaKur() {
    ui.duvar = ctx.el('div.galeri-duvar', { tabindex: '0', role: 'region', 'aria-roledescription': 'kayan duvar', 'aria-label': 'Salon duvarı. Sağa sola kaydır ya da ok tuşlarını kullan.' });
    ui.ray = ctx.el('div.galeri-ray');
    ui.duvar.appendChild(ui.ray);
    ui.parke = ctx.el('div.galeri-parke');
    ui.sol = ctx.el('button.galeri-ok.sol', { type: 'button', 'aria-label': 'Önceki eser', onclick: () => adim(-1) }, '‹');
    ui.sag = ctx.el('button.galeri-ok.sag', { type: 'button', 'aria-label': 'Sonraki eser', onclick: () => adim(1) }, '›');
    ui.oda = ctx.el('div.galeri-oda#galeriOda', { role: 'tabpanel' }, [
      ctx.el('div.galeri-tavan', { 'aria-hidden': 'true' }),
      ctx.el('div.galeri-zemin', { 'aria-hidden': 'true' }, [ctx.el('div.galeri-zemin-duz', [ui.parke])]),
      ui.duvar,
      ctx.el('div.galeri-vinyet', { 'aria-hidden': 'true' }),
      ui.sol, ui.sag
    ]);
    ui.sayac = ctx.el('p.galeri-sayac', { 'aria-live': 'polite' });
    ui.duvar.addEventListener('scroll', planla, { passive: true });
    ui.duvar.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { adim(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { adim(-1); e.preventDefault(); }
    });
    if (window.ResizeObserver) { gozlem = new ResizeObserver(() => { olc(); kare(); }); gozlem.observe(ui.duvar); }
    return ctx.el('section.galeri-salon', { 'aria-label': 'Salon' }, [ui.oda, ui.sayac]);
  }
  function duvarYazisi(s, n) {
    const ic = [ctx.el('h3.galeri-duvar-ad', s.ad), ctx.el('p.galeri-duvar-alt', s.alt)];
    if (n) ic.push(ctx.el('p.galeri-duvar-not', n + ' eser. Kaydırarak dolaş, esere dokununca yakından bak.'));
    else ic.push(ctx.el('p.galeri-duvar-bekliyor', 'Bu duvar ' + adi('cemre') + '\'nin eserlerini bekliyor ✨'),
      ctx.el('button.dugme.galeri-duvar-ekle', { type: 'button', onclick: () => ekleAc() }, 'Eser ekle'));
    return ctx.el('div.galeri-yer.galeri-yazi', [ctx.el('div.galeri-yazi-ic', ic), ip()]);
  }
  function ip() { return ctx.el('span.galeri-ip', { 'aria-hidden': 'true' }, [ctx.el('span.galeri-direk'), ctx.el('span.galeri-kadife')]); }
  function plaketKur(e, uzun) {
    const p = ctx.el(uzun ? 'div.galeri-plaket.uzun' : 'figcaption.galeri-plaket');
    p.append(ctx.el('strong.galeri-plaket-ad', e.baslik || 'Adsız eser'), ctx.el('span.galeri-plaket-sanatci', sanatci(e)));
    const t = tarihMetni(e.tarih); if (t) p.append(ctx.el('span.galeri-plaket-tarih', t));
    if (e.aciklama) p.append(ctx.el('span.galeri-plaket-aciklama', e.aciklama));
    if (uzun && !e.sabit && e.kim && e.kim !== 'cemre') p.append(ctx.el('span.galeri-plaket-asan', adi(e.kim) + ' astı'));
    return p;
  }
  function cerceveEl(c, ic) { return ctx.el('div.galeri-cerceve', { data: { c } }, [ctx.el('div.galeri-mat', ic ? [ic] : [])]); }
  function yerKur(e, i) {
    const c = cerceveOf(e, i);
    const img = ctx.el('img.galeri-resim', { alt: e.baslik || 'Adsız eser', loading: i < 3 ? 'eager' : 'lazy', decoding: 'async', draggable: 'false' });
    const cer = cerceveEl(c, img);
    resimBagla(img, e);
    const dug = ctx.el('button.galeri-eser', { type: 'button', 'aria-label': (e.baslik || 'Adsız eser') + '. ' + sanatci(e) + '. Yakından bakmak için dokun.', onclick: () => bakisAc(i) }, [cer]);
    const yer = ctx.el('div.galeri-yer', { data: { i: String(i), anahtar: e.anahtar } }, [
      ctx.el('span.galeri-spot', { 'aria-hidden': 'true', html: SPOT() }), ctx.el('span.galeri-isik', { 'aria-hidden': 'true' }),
      ctx.el('figure.galeri-yer-ic', [dug, plaketKur(e)]), ip()
    ]);
    if (i % 4 === 2) yer.appendChild(ctx.el('span.galeri-bank', { 'aria-hidden': 'true', html: BANK() }));
    return yer;
  }
  function bosYer(i) {
    const cer = cerceveEl(['paspartu', 'barok', 'oval'][i]);
    cer.classList.add('bos');
    return ctx.el('div.galeri-yer.bos', { data: { i: String(i) } }, [
      ctx.el('span.galeri-spot', { 'aria-hidden': 'true', html: SPOT() }), ctx.el('span.galeri-isik', { 'aria-hidden': 'true' }),
      ctx.el('figure.galeri-yer-ic', [ctx.el('button.galeri-eser', { type: 'button', 'aria-label': 'Boş çerçeve. Eser ekle.', onclick: () => ekleAc() }, [cer]),
        ctx.el('figcaption.galeri-plaket.bos', [ctx.el('strong.galeri-plaket-ad', 'Yakında'), ctx.el('span.galeri-plaket-sanatci', 'Sanatçı: ' + adi('cemre'))])]), ip()
    ]);
  }
  function sonPanel() {
    return ctx.el('div.galeri-yer.galeri-son', [
      ctx.el('figure.galeri-yer-ic', [ctx.el('button.galeri-eser.galeri-ekle-cerceve', { type: 'button', onclick: () => ekleAc() }, [ctx.el('span.galeri-arti', { 'aria-hidden': 'true' }, '+'), ctx.el('span', 'Yeni eser as')])]),
      ip(), ctx.el('span.galeri-direk.son', { 'aria-hidden': 'true' })
    ]);
  }
  function salonCiz(korunacak) {
    if (!ui.ray) return;
    const s = salonTanim(salon);
    liste = salonEserleri(salon);
    ui.oda.dataset.duvar = s.duvar;
    ui.oda.setAttribute('aria-labelledby', 'galeri-kapi-' + s.id);
    ui.ray.innerHTML = '';
    ui.ray.appendChild(duvarYazisi(s, liste.length));
    (liste.length ? liste.map(yerKur) : [0, 1, 2].map(bosYer)).forEach(y => ui.ray.appendChild(y));
    if (liste.length) ui.ray.appendChild(sonPanel());
    olc();
    let hedef = 0;
    if (korunacak) { const j = [...ui.ray.children].findIndex(y => y.dataset.anahtar === korunacak); if (j >= 0) hedef = j; }
    yereKay(hedef, true);
    kare();
  }
  function salonSec(id) {
    salon = id; CD.depo.yaz(K_SALON, id);
    lobiGuncelle(); salonCiz();
  }
  function yenile() {
    if (!kok) return;
    const y = merkezYer(); const k = y ? y.dataset.anahtar : '';
    lobiGuncelle(); salonCiz(k);
  }

  /* --- yürüme efekti: merkeze yakın eser spot ışığının altında, uzaklar loş ve hafif dönük; parke duvarla birlikte akar */
  function olc() {
    if (!ui.duvar) return;
    genislik = ui.duvar.clientWidth; merkezI = -1;
    ui.ray.querySelectorAll('.merkez').forEach(x => x.classList.remove('merkez'));
    olculer = [...ui.ray.children].map(el => ({ el, m: el.offsetLeft + el.offsetWidth / 2, w: el.offsetWidth || 1, uzak: false }));
  }
  function planla() { if (!raf) raf = requestAnimationFrame(kare); }
  function kare() {
    raf = 0;
    if (!ui.duvar || !olculer.length) return;
    const sl = ui.duvar.scrollLeft, orta = sl + genislik / 2;
    ui.parke.style.transform = 'translate3d(' + (-(sl % 96)).toFixed(1) + 'px,0,0)';
    let en = 0, enD = 1e9;
    olculer.forEach((o, i) => {
      const d = (o.m - orta) / o.w, ad = Math.abs(d);
      if (ad < enD) { enD = ad; en = i; }
      if (ad > 2.5) { if (!o.uzak) { o.el.style.setProperty('--d', d > 0 ? '2.5' : '-2.5'); o.el.style.setProperty('--ad', '1'); o.uzak = true; } return; }
      o.uzak = false;
      o.el.style.setProperty('--d', d.toFixed(3));
      o.el.style.setProperty('--ad', Math.min(1, ad).toFixed(3));
    });
    if (en !== merkezI) {
      if (olculer[merkezI]) olculer[merkezI].el.classList.remove('merkez');
      merkezI = en; olculer[en].el.classList.add('merkez');
      sayacYaz();
    }
    ui.sol.disabled = sl < 4;
    ui.sag.disabled = sl > ui.duvar.scrollWidth - genislik - 4;
  }
  function merkezYer() { return olculer[merkezI] ? olculer[merkezI].el : null; }
  function sayacYaz() {
    const y = merkezYer(); if (!y) return;
    if (y.classList.contains('galeri-yazi')) ui.sayac.textContent = liste.length ? 'Salon girişi' : 'Boş salon';
    else if (y.classList.contains('galeri-son')) ui.sayac.textContent = 'Duvarın sonu';
    else if (y.classList.contains('bos')) ui.sayac.textContent = 'Boş çerçeve';
    else { const i = Number(y.dataset.i); ui.sayac.textContent = 'Eser ' + (i + 1) + ' / ' + liste.length + ': ' + (liste[i] ? (liste[i].baslik || 'Adsız eser') : ''); }
  }
  function yereKay(j, aninda) {
    const o = olculer[Math.max(0, Math.min(olculer.length - 1, j))]; if (!o) return;
    const sol = o.m - genislik / 2;
    if (aninda || az()) ui.duvar.scrollLeft = sol; else ui.duvar.scrollTo({ left: sol, behavior: 'smooth' });
  }
  function adim(n) { ctx.ses.tik(); yereKay((merkezI < 0 ? 0 : merkezI) + n); }
  function eserYerineKay(i, aninda) { const j = [...ui.ray.children].findIndex(y => y.dataset.i === String(i) && !y.classList.contains('bos')); if (j >= 0) yereKay(j, aninda); }

  /* ================================================================ tam ekran bakış */
  let bk = null;
  function bakisAc(i) {
    if (!liste.length) return;
    bakisKapat(true);
    ctx.ses.pop();
    const onceki = document.activeElement;
    const kap = ctx.el('div.galeri-bakis', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Eser yakından' });
    const sayac = ctx.el('span.galeri-bakis-sayac');
    const kapat = ctx.el('button.galeri-bakis-dugme.kapat', { type: 'button', 'aria-label': 'Kapat', onclick: () => bakisKapat() }, '✕');
    const serit = ctx.el('div.galeri-bakis-serit');
    const kareler = liste.map((e, j) => {
      const img = ctx.el('img.galeri-bakis-resim', { alt: e.baslik || 'Adsız eser', draggable: 'false', decoding: 'async' });
      const zoom = ctx.el('div.galeri-bakis-zoom', [img]);
      const k = ctx.el('div.galeri-bakis-kare', { data: { i: String(j) } }, [zoom]);
      k._img = img; k._zoom = zoom; k._e = e; k._yuklendi = false;
      serit.appendChild(k);
      return k;
    });
    const plaketYer = ctx.el('div.galeri-bakis-plaket');
    const geri = ctx.el('button.galeri-bakis-dugme', { type: 'button', 'aria-label': 'Önceki eser', onclick: () => git(bk.i - 1) }, '‹');
    const ileri = ctx.el('button.galeri-bakis-dugme', { type: 'button', 'aria-label': 'Sonraki eser', onclick: () => git(bk.i + 1) }, '›');
    const buyut = ctx.el('button.galeri-bakis-dugme', { type: 'button', 'aria-label': 'Yakınlaştır', onclick: () => zoomDegis() }, '🔍');
    const cerDug = ctx.el('button.dugme-ikincil.galeri-bakis-yazi', { type: 'button', onclick: () => cerceveSor(bk.liste[bk.i]) }, 'Çerçeve');
    const duzDug = ctx.el('button.dugme-ikincil.galeri-bakis-yazi', { type: 'button', onclick: () => { const e = bk.liste[bk.i]; bakisKapat(); duzenleAc(e); } }, 'Düzenle');
    kap.append(
      ctx.el('div.galeri-bakis-ust', [sayac, kapat]),
      serit,
      ctx.el('div.galeri-bakis-alt', [plaketYer, ctx.el('div.galeri-bakis-eylem', [geri, buyut, cerDug, duzDug, ileri])])
    );
    document.body.appendChild(kap);
    document.documentElement.classList.add('galeri-bakis-acik');
    bk = { kap, serit, kareler, liste: liste.slice(), i: -1, z: { s: 1, x: 0, y: 0 }, onceki, sayac, plaketYer, cerDug, duzDug, geri, ileri, raf: 0, ptr: new Map(), pinch: null, pan: null, sonTap: 0 };
    const genis = () => serit.clientWidth || innerWidth;
    serit.addEventListener('scroll', () => {
      if (bk.raf) return;
      bk.raf = requestAnimationFrame(() => { bk.raf = 0; const j = Math.round(serit.scrollLeft / genis()); if (j !== bk.i) sec(j); });
    }, { passive: true });
    function yukle(j) {
      const k = kareler[j]; if (!k || k._yuklendi) return; k._yuklendi = true;
      const e = k._e;
      if (e.sabit) k._img.src = (window.GIZLI && GIZLI.url) ? GIZLI.url(e.yol) : e.yol;
      else medyaUrl(e.medya, null).then(u => { if (u) k._img.src = u; else k._yuklendi = false; });
    }
    function sec(j) {
      j = Math.max(0, Math.min(kareler.length - 1, j));
      if (bk.i >= 0 && bk.i !== j) zoomSifirla();
      bk.i = j;
      [j - 1, j, j + 1].forEach(yukle);
      const e = bk.liste[j];
      sayac.textContent = (j + 1) + ' / ' + kareler.length;
      plaketYer.innerHTML = ''; plaketYer.appendChild(plaketKur(e, true));
      cerDug.hidden = !(e.sabit || e.benim);
      duzDug.hidden = !e.benim;
      geri.disabled = j === 0; ileri.disabled = j === kareler.length - 1;
    }
    function git(j) {
      j = Math.max(0, Math.min(kareler.length - 1, j)); if (j === bk.i) return;
      ctx.ses.tik();
      serit.scrollTo({ left: j * genis(), behavior: az() ? 'auto' : 'smooth' });
      sec(j);
    }
    bk.git = git; bk.sec = sec;
    // yakınlaştırma (çift dokunma, iki parmak, tekerlek, + / -)
    const uygula = () => {
      const k = kareler[bk.i]; if (!k) return;
      k._img.style.transform = bk.z.s > 1 ? 'translate(' + bk.z.x.toFixed(1) + 'px,' + bk.z.y.toFixed(1) + 'px) scale(' + bk.z.s.toFixed(3) + ')' : '';
      kap.classList.toggle('zoomlu', bk.z.s > 1);
    };
    function sinirla() {
      const k = kareler[bk.i]; if (!k) return;
      const r = k._zoom.getBoundingClientRect(), mx = r.width * (bk.z.s - 1) / 2, my = r.height * (bk.z.s - 1) / 2;
      bk.z.x = Math.max(-mx, Math.min(mx, bk.z.x)); bk.z.y = Math.max(-my, Math.min(my, bk.z.y));
    }
    function zoomSifirla() { bk.z = { s: 1, x: 0, y: 0 }; kareler.forEach(k => { k._img.style.transform = ''; }); kap.classList.remove('zoomlu'); }
    function zoomDegis(s, cx, cy) {
      const k = kareler[bk.i]; if (!k) return;
      const hedef = s != null ? s : (bk.z.s > 1 ? 1 : 2.4);
      if (hedef <= 1.01) { zoomSifirla(); return; }
      const r = k._zoom.getBoundingClientRect();
      const ox = (cx != null ? cx : r.left + r.width / 2) - (r.left + r.width / 2), oy = (cy != null ? cy : r.top + r.height / 2) - (r.top + r.height / 2);
      const oran = hedef / bk.z.s;
      bk.z.x = (bk.z.x - ox) * oran + ox; bk.z.y = (bk.z.y - oy) * oran + oy; bk.z.s = hedef;
      sinirla(); uygula();
    }
    bk.zoomDegis = zoomDegis;
    serit.addEventListener('dblclick', e => { zoomDegis(null, e.clientX, e.clientY); });
    serit.addEventListener('wheel', e => { if (!e.ctrlKey && bk.z.s <= 1 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; if (!e.ctrlKey && bk.z.s <= 1) return; e.preventDefault(); zoomDegis(Math.max(1, Math.min(4, bk.z.s * (e.deltaY < 0 ? 1.15 : 0.87))), e.clientX, e.clientY); }, { passive: false });
    serit.addEventListener('pointerdown', e => {
      bk.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (bk.ptr.size === 2) {
        const [p, q] = [...bk.ptr.values()];
        bk.pinch = { d: Math.hypot(p.x - q.x, p.y - q.y) || 1, s: bk.z.s, cx: (p.x + q.x) / 2, cy: (p.y + q.y) / 2 }; bk.pan = null;
      } else if (bk.z.s > 1) { bk.pan = { x: e.clientX, y: e.clientY, zx: bk.z.x, zy: bk.z.y }; try { serit.setPointerCapture(e.pointerId); } catch (x) {} }
      if (e.pointerType !== 'mouse' && bk.ptr.size === 1) {
        const t = Date.now();
        if (t - bk.sonTap < 300 && bk.sonNok && Math.hypot(e.clientX - bk.sonNok.x, e.clientY - bk.sonNok.y) < 40) { zoomDegis(null, e.clientX, e.clientY); bk.sonTap = 0; }
        else { bk.sonTap = t; bk.sonNok = { x: e.clientX, y: e.clientY }; }
      }
    });
    serit.addEventListener('pointermove', e => {
      if (!bk.ptr.has(e.pointerId)) return;
      bk.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (bk.pinch && bk.ptr.size === 2) {
        const [p, q] = [...bk.ptr.values()];
        const s = Math.max(1, Math.min(4, bk.pinch.s * Math.hypot(p.x - q.x, p.y - q.y) / bk.pinch.d));
        zoomDegis(s, bk.pinch.cx, bk.pinch.cy);
      } else if (bk.pan && bk.z.s > 1) {
        bk.z.x = bk.pan.zx + (e.clientX - bk.pan.x); bk.z.y = bk.pan.zy + (e.clientY - bk.pan.y); sinirla(); uygula();
      }
    });
    const birak = e => { bk.ptr.delete(e.pointerId); if (bk.ptr.size < 2) bk.pinch = null; if (!bk.ptr.size) bk.pan = null; };
    serit.addEventListener('pointerup', birak); serit.addEventListener('pointercancel', birak);
    kap.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); bakisKapat(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); git(bk.i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); git(bk.i - 1); }
      else if (e.key === '+' || e.key === '=') zoomDegis(Math.min(4, bk.z.s * 1.4));
      else if (e.key === '-') zoomDegis(Math.max(1, bk.z.s / 1.4));
      else if (e.key === 'Tab') {
        const o = [...kap.querySelectorAll('button')].filter(b => !b.hidden && !b.disabled);
        if (!o.length) return;
        if (e.shiftKey && document.activeElement === o[0]) { o[o.length - 1].focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === o[o.length - 1]) { o[0].focus(); e.preventDefault(); }
      }
    });
    i = Math.max(0, Math.min(kareler.length - 1, i));
    requestAnimationFrame(() => { if (!bk) return; serit.scrollLeft = i * genis(); sec(i); kap.classList.add('acik'); kapat.focus({ preventScroll: true }); });
  }
  function bakisKapat(sessiz) {
    if (!bk) return;
    const b = bk; bk = null;
    cancelAnimationFrame(b.raf);
    b.kap.remove();
    document.documentElement.classList.remove('galeri-bakis-acik');
    if (!sessiz && kok) {
      eserYerineKay(b.i, true);
      const hedef = ui.ray && ui.ray.querySelector('.galeri-yer[data-i="' + b.i + '"] .galeri-eser');
      (hedef || b.onceki || ui.duvar).focus && (hedef || b.onceki || ui.duvar).focus({ preventScroll: true });
    }
  }

  /* ================================================================ çerçeve seçici */
  function cerceveSecici(secili, degisince) {
    const kap = ctx.el('div.galeri-cs-liste', { role: 'radiogroup', 'aria-label': 'Çerçeve' });
    const dugmeler = CERCEVELER.map(([id, ad]) => {
      const b = ctx.el('button.galeri-cs', { type: 'button', role: 'radio', 'aria-checked': id === secili ? 'true' : 'false', tabindex: id === secili ? '0' : '-1', data: { c: id } },
        [ctx.el('span.galeri-cs-ornek', [ctx.el('span.galeri-cerceve.mini', { data: { c: id } }, [ctx.el('span.galeri-mat', [ctx.el('span.galeri-cs-resim')])])]), ctx.el('span.galeri-cs-ad', ad)]);
      b.addEventListener('click', () => sec(id, true));
      return b;
    });
    function sec(id, ses) {
      secili = id;
      dugmeler.forEach(b => { const s = b.dataset.c === id; b.setAttribute('aria-checked', s ? 'true' : 'false'); b.tabIndex = s ? 0 : -1; });
      if (ses) ctx.ses.tik();
      if (degisince) degisince(id);
    }
    kap.addEventListener('keydown', e => {
      const yon = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!yon) return;
      const i = CER_ID.indexOf(secili); const n = CER_ID[(i + yon + CER_ID.length) % CER_ID.length];
      sec(n, true); dugmeler[CER_ID.indexOf(n)].focus(); e.preventDefault();
    });
    dugmeler.forEach(b => kap.appendChild(b));
    return { el: kap, deger: () => secili };
  }
  function cerceveSor(e) {
    if (!e) return;
    const i = liste.findIndex(x => x.anahtar === e.anahtar);
    const ilk = cerceveOf(e, Math.max(0, i));
    const cs = cerceveSecici(ilk, (c) => {
      if (e.sabit) sabitCerceveYaz(e.anahtar, c);
      else if (e.benim) benimGuncelle(e.id, { cerceve: c });
      e.cerceve = c;
      yenile();
    });
    bakisKapat(true);
    ctx.sheet(ctx.el('div.dikey', [ctx.el('p.sessiz', e.sabit ? 'Bu çerçeve senin görünümünde kalır.' : 'Çerçeve ikinizde de değişir.'), cs.el,
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Tamam')]), { baslik: 'Çerçeve seç', odak: false });
  }

  /* ================================================================ eser ekle / düzenle */
  function salonCipleri(secili, degisince) {
    const kap = ctx.el('div.cipler.galeri-salon-sec', { role: 'radiogroup', 'aria-label': 'Salon' });
    const dg = SALONLAR.map(s => {
      const b = ctx.el('button.cip', { type: 'button', role: 'radio', 'aria-checked': s.id === secili ? 'true' : 'false', 'aria-selected': s.id === secili ? 'true' : 'false' }, s.ad);
      b.addEventListener('click', () => { secili = s.id; dg.forEach((x, i) => { const v = SALONLAR[i].id === secili ? 'true' : 'false'; x.setAttribute('aria-checked', v); x.setAttribute('aria-selected', v); }); ctx.ses.tik(); if (degisince) degisince(secili); });
      return b;
    });
    dg.forEach(b => kap.appendChild(b));
    return { el: kap, deger: () => secili };
  }
  function metinAlanlari(e) {
    const baslik = ctx.el('input.girdi', { type: 'text', maxlength: '80', placeholder: 'ör. Pembe sabah', 'aria-label': 'Eserin adı' });
    const tarih = ctx.el('input.girdi', { type: 'text', maxlength: '40', placeholder: 'ör. ' + buAy(), 'aria-label': 'Tarih' });
    const aciklama = ctx.el('textarea.girdi.galeri-aciklama-girdi', { maxlength: '300', rows: '3', placeholder: 'Kısa bir not (isteğe bağlı)', 'aria-label': 'Açıklama' });
    baslik.value = e ? e.baslik || '' : ''; tarih.value = e ? e.tarih || '' : buAy(); aciklama.value = e ? e.aciklama || '' : '';
    const et = (ad, el) => ctx.el('label.galeri-etiket', [ctx.el('span', ad), el]);
    return { baslik, tarih, aciklama, el: [et('Eserin adı', baslik), et('Tarih', tarih), et('Açıklama', aciklama)] };
  }
  function ekleAc() {
    if (!ctx) return;
    bakisKapat(true);
    let blob = null, onizURL = '', calisiyor = false;
    const dosya = ctx.el('input.gorsel-gizli', { type: 'file', accept: 'image/*', tabindex: '-1', 'aria-hidden': 'true' });
    const oniz = ctx.el('img.galeri-oniz-resim', { alt: 'Seçtiğin fotoğrafın önizlemesi', hidden: true });
    const onizCer = ctx.el('div.galeri-cerceve.galeri-oniz', { data: { c: VARSAYILAN[salon][salonEserleri(salon).length % 5] } }, [ctx.el('div.galeri-mat', [oniz, ctx.el('span.galeri-oniz-bos', 'Fotoğraf seçince burada asılı görünür')])]);
    const sec = ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => dosya.click() }, '📷 Fotoğraf seç');
    const durum = ctx.el('p.sessiz.galeri-durum', { role: 'status' }, '');
    dosya.addEventListener('change', async () => {
      const f = dosya.files && dosya.files[0]; if (!f) return;
      durum.textContent = 'Hazırlıyorum…';
      try { blob = await fotoHazirla(f); } catch (e) { blob = null; }
      if (!blob) { durum.textContent = 'Bu fotoğraf açılamadı; başka birini dener misin?'; return; }
      if (onizURL) URL.revokeObjectURL(onizURL);
      onizURL = URL.createObjectURL(blob); oniz.src = onizURL; oniz.hidden = false; onizCer.classList.add('dolu');
      sec.textContent = '📷 Başka fotoğraf seç';
      durum.textContent = Math.round(blob.size / 1024) + ' KB, duvara hazır.';
    });
    const sc = salonCipleri(salon);
    const m = metinAlanlari(null);
    const cs = cerceveSecici(onizCer.dataset.c, (c) => { onizCer.dataset.c = c; });
    const kimNot = ben() ? null : ctx.el('div.galeri-kim-not', [
      ctx.el('p.sessiz', 'Bu telefonun kime ait olduğu seçilmedi. Eser şimdilik bu telefonda kalır; seçince kendi koleksiyonuna geçer ve ' + 'karşı tarafa da gider.'),
      ctx.el('button.dugme-hayalet.kucuk', { type: 'button', onclick: () => { if (CD.kimSec) CD.kimSec(false); } }, 'Bu telefon kimin? Seç')
    ]);
    const kaydet = ctx.el('button.dugme.tam', { type: 'button' }, 'Duvara as');
    kaydet.addEventListener('click', async () => {
      if (calisiyor) return;
      if (!blob) { durum.textContent = 'Önce bir fotoğraf seç 📷'; sec.focus(); return; }
      if (!CD.medya) { durum.textContent = 'Fotoğraf yolu hazır değil; sayfayı yenileyip tekrar dene.'; return; }
      calisiyor = true; kaydet.disabled = true; durum.textContent = 'Duvara asıyorum…';
      const k = ben(), id = CD.kimlik(), t = Date.now(), medyaId = 'galeri:' + (k || 'yerel') + ':' + id;
      try { await CD.medya.koy({ id: medyaId, tur: 'galeri', kim: k, t, blob }); }
      catch (e) { durum.textContent = 'Fotoğraf kaydedilemedi; telefonda yer var mı bakar mısın?'; kaydet.disabled = false; calisiyor = false; return; }
      const salonId = sc.deger();
      const sonSira = kullanicilar().filter(x => x.salon === salonId).reduce((a, x) => Math.max(a, x.sira), 0);
      const kayit = { id, salon: salonId, medya: medyaId, baslik: kirp(m.baslik.value, 80) || 'Adsız eser', tarih: kirp(m.tarih.value, 40), aciklama: kirp(m.aciklama.value, 300),
        cerceve: gecerliC(cs.deger()) || 'paspartu', sira: Math.max(t, sonSira + 1000), t };
      const l = benimListe(); l.push(kayit); benimYaz(l);
      urlOn[medyaId] = onizURL; onizURL = '';
      if (k) A().posta('galeri', { baslik: kayit.baslik, salon: salonId });
      if (CD.pul) { try { CD.pul('galeri', { kisa: kayit.baslik.slice(0, 120) }); } catch (e) {} }
      ctx.sheetKapat();
      ctx.ses.parilti();
      ctx.toast('Eser duvara asıldı 🖼️');
      salon = salonId; CD.depo.yaz(K_SALON, salon);
      lobiGuncelle(); salonCiz('k:' + id);
      setTimeout(() => { const y = merkezYer(); if (y && ctx) { const r = y.getBoundingClientRect(); ctx.efekt.yildiz(r.left + r.width / 2, r.top + r.height * 0.35, 8); } }, 120);
    });
    ctx.sheet(ctx.el('div.dikey.galeri-form', [dosya, onizCer, sec, durum, ctx.el('p.galeri-form-baslik', 'Hangi salona?'), sc.el].concat(m.el,
      [ctx.el('p.galeri-form-baslik', 'Çerçeve'), cs.el, kimNot, kaydet])), { baslik: 'Eser ekle', odak: false, kapaninca: () => { if (onizURL) URL.revokeObjectURL(onizURL); } });
  }
  function duzenleAc(e) {
    if (!e || !e.benim) return;
    const sc = salonCipleri(e.salon);
    const m = metinAlanlari(e);
    const i = liste.findIndex(x => x.anahtar === e.anahtar);
    const cs = cerceveSecici(cerceveOf(e, Math.max(0, i)));
    const kaydet = ctx.el('button.dugme.tam', { type: 'button', onclick: () => {
      const degisim = { baslik: kirp(m.baslik.value, 80) || 'Adsız eser', tarih: kirp(m.tarih.value, 40), aciklama: kirp(m.aciklama.value, 300), cerceve: cs.deger() };
      if (sc.deger() !== e.salon) {
        degisim.salon = sc.deger();
        degisim.sira = kullanicilar().filter(x => x.salon === sc.deger()).reduce((a, x) => Math.max(a, x.sira), 0) + 1000;
      }
      benimGuncelle(e.id, degisim);
      ctx.sheetKapat(); ctx.ses.parilti(); ctx.toast('Kaydedildi ✨');
      if (degisim.salon) { salon = degisim.salon; CD.depo.yaz(K_SALON, salon); lobiGuncelle(); salonCiz('k:' + e.id); } else yenile();
    } }, 'Kaydet');
    const sil = ctx.el('button.dugme-hayalet.tam', { type: 'button', onclick: async () => {
      ctx.sheetKapat();
      await CD.bekle(320);
      if (!ctx) return;
      if (!(await ctx.onayla('Bu eseri duvardan indireyim mi? Fotoğrafı iki telefondan da silinir.', 'Duvardan indir', 'Vazgeç'))) return;
      eserSil(e);
    } }, 'Eseri duvardan indir');
    ctx.sheet(ctx.el('div.dikey.galeri-form', [ctx.el('p.galeri-form-baslik', 'Salon'), sc.el].concat(m.el, [ctx.el('p.galeri-form-baslik', 'Çerçeve'), cs.el, kaydet, sil])), { baslik: 'Eseri düzenle', odak: false });
  }
  async function eserSil(e) {
    const l = benimListe(); const k = l.find(x => x.id === e.id);
    if (!k) { ctx.toast('Bu eser senin koleksiyonunda değil.'); return; }
    benimYaz(l.filter(x => x.id !== e.id));
    if (k.medya && CD.medya) { try { await CD.medya.sil(k.medya); } catch (x) {} }
    if (urlOn[k.medya]) { try { URL.revokeObjectURL(urlOn[k.medya]); } catch (x) {} delete urlOn[k.medya]; }
    if (!ctx) return;
    ctx.ses.uf(); ctx.toast('Eser duvardan indirildi');
    yenile();
  }

  /* ================================================================ sıralama (sürükle ya da oklarla; yalnız kendi eserlerin) */
  function siralaAc() {
    const kul = kullanicilar().filter(x => x.salon === salon).sort(siraKarsilastir);
    const sab = sabitler(salon).length;
    if (!kul.length) { ctx.toast(sab ? 'Bu salondaki eserler sabit koleksiyon; sıraları değişmez.' : 'Önce bu salona bir eser as 🖼️'); return; }
    let sira = kul.slice();
    const ul = ctx.el('ul.galeri-sira-liste', { 'aria-label': 'Eser sırası' });
    const canli = ctx.el('p.gorsel-gizli', { role: 'status', 'aria-live': 'polite' });
    function satir(x) {
      const kucuk = ctx.el('img.galeri-sira-resim', { alt: '', draggable: 'false' });
      medyaUrl(x.medya, null).then(u => { if (u) kucuk.src = u; });
      const li = ctx.el('li.galeri-sira-satir' + (x.benim ? '' : '.kilitli'), { data: { id: x.id } });
      const ad = ctx.el('span.galeri-sira-ad', [ctx.el('strong', x.baslik || 'Adsız eser'), ctx.el('span.sessiz', x.benim ? 'Senin eserin' : (x.kim ? adi(x.kim) + ' astı' : ''))]);
      li.append(kucuk, ad);
      if (x.benim) {
        const tut = ctx.el('span.galeri-sira-tutamac', { 'aria-hidden': 'true', title: 'Sürükle' }, '⠿');
        const yuk = ctx.el('button.dugme-ikon.galeri-sira-ok', { type: 'button', 'aria-label': (x.baslik || 'Eser') + ': öne al', onclick: () => tasi(x.id, -1) }, '↑');
        const as = ctx.el('button.dugme-ikon.galeri-sira-ok', { type: 'button', 'aria-label': (x.baslik || 'Eser') + ': geriye al', onclick: () => tasi(x.id, 1) }, '↓');
        li.append(yuk, as, tut);
        surukle(li, tut);
      } else li.append(ctx.el('span.galeri-sira-kilit', { 'aria-hidden': 'true' }, '🔒'));
      return li;
    }
    function ciz(odakId, yon) {
      ul.innerHTML = '';
      sira.forEach(x => ul.appendChild(satir(x)));
      if (odakId) { const li = ul.querySelector('[data-id="' + odakId + '"]'); const b = li && li.querySelectorAll('.galeri-sira-ok')[yon < 0 ? 0 : 1]; if (b) b.focus(); }
    }
    function kaydet(id) {
      // yalnız taşınan kendi kaydının 'sira' değeri değişir: yeni komşularının arasına düşer
      const j = sira.findIndex(x => x.id === id); const x = sira[j];
      const once = sira[j - 1], sonra = sira[j + 1];
      let s;
      if (!once && !sonra) s = x.sira;
      else if (!once) s = sonra.sira - 1000;
      else if (!sonra) s = once.sira + 1000;
      else s = (once.sira + sonra.sira) / 2;
      if (once && sonra && !(s > once.sira && s < sonra.sira)) s = once.sira + 0.001;
      x.sira = s;
      benimGuncelle(id, { sira: s });
      canli.textContent = (x.baslik || 'Eser') + ', ' + (j + 1) + '. sıraya geçti';
      yenile();
    }
    function tasi(id, yon) {
      const j = sira.findIndex(x => x.id === id), n = j + yon;
      if (j < 0 || n < 0 || n >= sira.length) return;
      const [x] = sira.splice(j, 1); sira.splice(n, 0, x);
      ctx.ses.tik(); ciz(id, yon); kaydet(id);
    }
    function surukle(li, tut) {
      let aktif = null;
      tut.addEventListener('pointerdown', e => {
        e.preventDefault();
        aktif = { id: li.dataset.id, y0: e.clientY };
        li.classList.add('suruklen');
        try { tut.setPointerCapture(e.pointerId); } catch (x) {}
      });
      tut.addEventListener('pointermove', e => {
        if (!aktif) return;
        li.style.transform = 'translateY(' + (e.clientY - aktif.y0) + 'px)';
        const kardes = [...ul.children].filter(c => c !== li);
        const r = li.getBoundingClientRect(), orta = r.top + r.height / 2;
        let once = null;
        for (const c of kardes) { const cr = c.getBoundingClientRect(); if (orta < cr.top + cr.height / 2) { once = c; break; } }
        const eskiTop = li.getBoundingClientRect().top;
        if (once !== li.nextElementSibling) {
          ul.insertBefore(li, once);
          const fark = li.getBoundingClientRect().top - eskiTop;
          aktif.y0 += fark; li.style.transform = 'translateY(' + (e.clientY - aktif.y0) + 'px)';
        }
      });
      const bit = () => {
        if (!aktif) return;
        const id = aktif.id; aktif = null;
        li.classList.remove('suruklen'); li.style.transform = '';
        const yeni = [...ul.children].map(c => c.dataset.id);
        const eski = sira.map(x => x.id);
        if (yeni.join() === eski.join()) return;
        sira = yeni.map(i => sira.find(x => x.id === i));
        ctx.ses.tik(); kaydet(id);
      };
      tut.addEventListener('pointerup', bit); tut.addEventListener('pointercancel', bit);
    }
    ciz();
    ctx.sheet(ctx.el('div.dikey', [
      ctx.el('p.sessiz', (sab ? 'Sabit koleksiyondaki ' + sab + ' eser hep başta durur. ' : '') + 'Kendi eserlerini tutamaktan sürükle ya da oklarla taşı.'),
      ul, canli, ctx.el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Tamam')
    ]), { baslik: salonTanim(salon).ad + ' salonu sırası', odak: false });
  }

  /* ================================================================ posta + mahalle ipucu + kişi seçimi */
  const T = (CD.postaTurleri = CD.postaTurleri || {});
  T.galeri = {
    kart(o, y) {
      const v = o.v || {};
      const s = salonVar(v.salon) ? salonTanim(v.salon).ad : '';
      y.kart({ kim: y.kim, tur: 'galeri', baslik: 'Galeriye yeni bir eser asıldı 🖼️', alt: kirp(v.baslik, 60) + (s ? ', ' + s + ' salonu' : ''),
        eylem: { ad: 'Galeriye git', fn: () => { if (salonVar(v.salon)) CD.depo.yaz(K_SALON, v.salon); CD.ac(ID); } } });
      if (CD.aktifBolum && CD.aktifBolum() === ID) setTimeout(() => yenile(), 1500);
    },
    ozet(l, A_) { return '🖼️ ' + A_ + ' galeriye ' + (l.length > 1 ? l.length + ' eser' : 'bir eser') + ' astı'; }
  };
  CD.mhIpucu = CD.mhIpucu || {};
  CD.mhIpucu[ID] = () => { const n = toplamEser(); return n ? n + ' eser sergide 🖼️' : 'Duvarlar eser bekliyor'; };
  let senkT = 0;
  CD.hazir(() => {
    yereliTasi();
    CD.olay.dinle('kim', () => { yereliTasi(); if (kok) yenile(); });
    // posta canlı kanaldan anında gelir; kayıt senk ile gelir → beklemeden bir eşitleme iste
    CD.olay.dinle('posta:geldi', (d) => {
      if (!d || !d.canli || !d.o || d.o.tur !== 'galeri' || !(CD.senk && CD.senk.acik)) return;
      clearTimeout(senkT); senkT = setTimeout(() => { try { CD.senk.simdi(); } catch (e) {} }, 400);
    });
    const Y = CD.varlik && CD.varlik.YERLER;
    if (Y && !Y.galeri) Y.galeri = { ad: 'Sanat Galerisi', de: "Sanat Galerisi'nde", em: '🖼️' };
  });

  /* ================================================================ kayıt */
  CD.kaydet({
    id: ID, baslik: 'Sanat Galerisi', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el; nesil++; istenen = new Set(); merkezI = -1;
      const s = CD.depo.al(K_SALON, 'cemre'); salon = salonVar(s) ? s : 'cemre';
      el.appendChild(ctx.el('div.galeri-kok', [lobiKur(), odaKur()]));
      ctx.altbar([
        { id: 'ekle', ad: 'Eser ekle', ikon: '🖼️', birincil: true, tikla() { ctx.ses.pop(); ekleAc(); } },
        { id: 'sirala', ad: 'Sırala', ikon: '↕️', tikla() { ctx.ses.tik(); siralaAc(); } },
        { id: 'bak', ad: 'Yakından bak', ikon: '🔍', tikla() {
          const y = merkezYer(); const i = y && y.dataset.i != null && !y.classList.contains('bos') ? Number(y.dataset.i) : 0;
          if (!liste.length) { ctx.toast('Önce duvara bir eser as 🖼️'); return; }
          bakisAc(i);
        } }
      ]);
      lobiGuncelle();
      salonCiz();
      requestAnimationFrame(() => { if (ctx) { olc(); kare(); } });
      const yen = () => { if (ctx) yenile(); };
      cozucu = [CD.olay.dinle('senk:yenilendi', yen), CD.olay.dinle('medya:geldi', () => { if (ctx) bekleyenleriDoldur(); })];
    },
    unmount() {
      nesil++;
      bakisKapat(true);
      cancelAnimationFrame(raf); raf = 0;
      if (gozlem) { gozlem.disconnect(); gozlem = null; }
      cozucu.forEach(f => { try { f(); } catch (e) {} }); cozucu = [];
      Object.keys(ui).forEach(k => { delete ui[k]; });
      olculer = []; liste = [];
      if (ctx) ctx.ses.hepsiniDurdur();
      ctx = null; kok = null;
    }
  });
})();
