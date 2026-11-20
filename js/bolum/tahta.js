/* js/bolum/tahta.js — Çizim Atölyesi: ortak karalama tahtası (V2 Faz 2 · 4)
   - İkiniz aynı tuvale aynı anda çizersiniz; çizgiler CD.canli.oda('tahta') ile anlık gider (kalıcı kopya yok).
   - Kalem rengi, kalınlık, silgi, temizle. Sonradan gelen taraf, çizilmiş tuvalin küçük bir kopyasını alır.
   - "Albüme kaydet": ≤60 KB küçük PNG/JPEG dataURL, medya yoluyla (CD.medya → IndexedDB 'genel' → senk → cemre_foto) karşıya gider.
     Albüm en çok 30 çizim tutar (en eskiler silinir). Albüm bu bölümün içinde.
   - Bulut yoksa tek başına çizilir; albüm bu telefonda kalır. */
(() => {
  'use strict';
  const ID = 'tahta';
  const ALBUM_MAKS = 30, BOYUT = 800;
  const RENKLER = [['#3B2A3A', 'Mürekkep'], ['#FF7A9A', 'Pembe'], ['#F5B54A', 'Bal'], ['#7CCB9A', 'Yaprak'], ['#6F97AC', 'Gök'], ['#A995D6', 'Lavanta']];
  const KALINLIK = [[6, 'İnce'], [14, 'Orta'], [30, 'Kalın']];
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="8" width="44" height="34" rx="3" fill="var(--kagit,#FFFDF9)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3"/><path d="M18 32c6-10 10 2 16-8s10 4 12-2" fill="none" stroke="var(--seker-kiraz,#FF9DB4)" stroke-width="4" stroke-linecap="round"/><path d="M20 42l-6 14M44 42l6 14" stroke="var(--murekkep-2,#5D5566)" stroke-width="3" stroke-linecap="round"/></svg>';
  let taslak = null;              // bölümden çıkıp dönünce tuval kaybolmasın (yalnız bu oturum)

  let ctx = null, kok = null, oda = null, tv = null;
  const ui = {};
  const cozler = [];
  const V = () => CD.varlik;
  const ben = () => CD.kim();
  const karsi = () => (V() ? V().karsi() : null);
  const aktif = () => !!(V() && V().aktif() && CD.canli);
  const adi = (k) => CD.kimAdi(k);

  function kur(el) {
    const e = ctx.el;
    ui.renkler = e('div.ornekler.tahta-renkler', { role: 'radiogroup', 'aria-label': 'Kalem rengi' }, RENKLER.map(([r, ad], i) =>
      e('button.ornek' + (i === 0 ? '.secili' : ''), { type: 'button', role: 'radio', 'aria-checked': i === 0 ? 'true' : 'false', 'aria-label': ad, style: '--renk:' + r, onclick: (ev) => renkSec(r, ev.currentTarget) })));
    ui.kalin = e('div.cipler.tahta-kalin', { role: 'radiogroup', 'aria-label': 'Kalınlık' }, KALINLIK.map(([k, ad]) =>
      e('button.cip', { type: 'button', role: 'radio', 'aria-checked': k === 14 ? 'true' : 'false', 'aria-selected': k === 14 ? 'true' : 'false', onclick: (ev) => kalinSec(k, ev.currentTarget) }, [e('span.tahta-kalin-nokta', { 'aria-hidden': 'true', style: '--k:' + Math.round(k / 2.2) + 'px' }), ad])));
    ui.silgi = e('button.cip.tahta-silgi', { type: 'button', 'aria-pressed': 'false', onclick: silgiDegis }, '🧽 Silgi');
    ui.canvas = e('canvas.tahta-tuval', { role: 'img', 'aria-label': 'Ortak çizim tahtası' });
    ui.durum = e('p.sessiz.tahta-durum', { role: 'status', 'aria-live': 'polite' });
    ui.album = e('div.tahta-album', { role: 'list', 'aria-label': 'Albüm' });
    ui.albumBaslik = e('h2.baslik.baslik-lg', 'Albüm');
    el.append(e('div.icerik.tahta-icerik', [
      e('div.yama.siki.tahta-araclar', [ui.renkler, e('div.satir.tahta-satir', [ui.kalin, ui.silgi])]),
      e('div.tahta-cerceve', [ui.canvas]),
      ui.durum,
      e('div.yama.tahta-album-kart', [e('div.satir.arasi', [ui.albumBaslik, e('span.sessiz.tahta-album-sayi')]), ui.album])
    ]));
    tv = CD.tuval(ui.canvas, { boyut: BOYUT, zemin: '#FFFDF9', gonder: (p) => { if (oda) oda.gonder('c', p); }, bitti: () => { taslakSakla(); } });
  }
  function radyoSec(kap, dugme) { kap.querySelectorAll('[role="radio"]').forEach(b => { const s = b === dugme; b.setAttribute('aria-checked', s ? 'true' : 'false'); if (b.classList.contains('cip')) b.setAttribute('aria-selected', s ? 'true' : 'false'); b.classList.toggle('secili', s && b.classList.contains('ornek')); }); }
  function renkSec(r, b) { ctx.ses.tik(); tv.renk = r; radyoSec(ui.renkler, b); ui.silgi.setAttribute('aria-pressed', 'false'); }
  function kalinSec(k, b) { ctx.ses.tik(); tv.kalin = k; radyoSec(ui.kalin, b); }
  function silgiDegis() { ctx.ses.tik(); tv.silgi = !tv.silgi; ui.silgi.setAttribute('aria-pressed', tv.silgi ? 'true' : 'false'); }
  function taslakSakla() { clearTimeout(ui.taslakT); ui.taslakT = setTimeout(() => { if (tv) taslak = tv.kirli ? tv.dataUrl(BOYUT, 900000) : null; }, 600); }

  function durumYaz() {
    if (!ctx) return;
    let m;
    if (!aktif()) m = V() && V().bulut() && !ben() ? 'Önce bu telefonun kimin olduğunu seç; sonra birlikte çizersiniz.' : 'Bulut kapalı: bu telefonda çiziyorsun.';
    else if (oda && oda.burada()) m = adi(karsi()) + ' de burada; çizgileri anlık görüyor ✏️';
    else m = 'Şimdilik yalnızsın. ' + adi(karsi()) + ' gelince çizdiklerini görür.';
    ui.durum.textContent = m;
  }

  async function temizle() {
    if (!(await ctx.onayla('Tahta temizlensin mi? ' + (aktif() && oda && oda.burada() ? 'Onun ekranında da silinir.' : ''), 'Temizle', 'Vazgeç'))) return;
    if (!ctx) return;
    tv.temizle(); taslak = null;
    if (oda) oda.gonder('temizle', null);
    ctx.ses.uf(); ctx.toast('Tahta tertemiz 🧽');
  }

  async function albumeKaydet() {
    if (!tv.kirli) { ctx.toast('Önce bir şey çiz ✏️'); return; }
    const veri = tv.dataUrl(480, 60000);       // ≤60 KB
    if (!veri) { ctx.toast('Çizim çok kalabalık oldu; biraz sadeleştirip tekrar dene'); return; }
    const k = ben() || 'tek';
    const kayit = { id: 'tahta:' + k + ':' + CD.kimlik(), tur: 'tahta', kim: k, t: Date.now(), veri };
    try { await CD.medya.koy(kayit); } catch (e) { ctx.toast('Kaydedilemedi; telefonda yer var mı bakar mısın?'); return; }
    const hepsi = await CD.medya.liste('tahta');
    for (const x of hepsi.slice(0, Math.max(0, hepsi.length - ALBUM_MAKS))) await CD.medya.sil(x.id);
    if (aktif()) V().gonder('tahta', { id: kayit.id });
    if (!ctx) return;
    ctx.ses.parilti(); ctx.toast('Albüme kondu 🎨 (' + Math.round(veri.length / 1024) + ' KB)');
    albumCiz();
  }

  async function albumCiz() {
    if (!ctx || !ui.album) return;
    const liste = (await CD.medya.liste('tahta')).filter(x => typeof x.veri === 'string' && /^data:image\/(png|jpeg);base64,/.test(x.veri)).reverse();
    if (!ctx || !ui.album) return;
    ui.album.innerHTML = '';
    kok.querySelector('.tahta-album-sayi').textContent = liste.length + ' / ' + ALBUM_MAKS;
    if (!liste.length) { ui.album.appendChild(ctx.el('p.sessiz', { role: 'listitem' }, 'Albüm boş. Bir çizim bitince "Albüme kaydet"e bas.')); return; }
    liste.forEach(x => {
      const kim = x.kim === 'ahmet' || x.kim === 'cemre' ? adi(x.kim) : 'Sen';
      const t = new Date(x.t || Date.now());
      const etiket = kim + ', ' + t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      ui.album.appendChild(ctx.el('button.tahta-album-oge', { type: 'button', role: 'listitem', 'aria-label': etiket + '. Büyüt', onclick: () => buyut(x, etiket) }, [ctx.el('img', { src: x.veri, alt: '' })]));
    });
  }
  function buyut(x, etiket) {
    const kendi = x.kim === (ben() || 'tek');
    ctx.sheet(ctx.el('div.dikey', [
      ctx.el('img.tahta-buyuk', { src: x.veri, alt: 'Çizim: ' + etiket }),
      ctx.el('p.sessiz', etiket),
      ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: async () => { ctx.sheetKapat(); await tv.resim(x.veri); if (oda) oda.gonder('resim', x.veri.length < 150000 ? x.veri : null); taslakSakla(); ctx.toast('Tahtaya açıldı; üstüne çizebilirsin'); } }, '✏️ Tahtaya aç'),
      kendi ? ctx.el('button.dugme-hayalet.tam', { type: 'button', onclick: async () => { ctx.sheetKapat(); await CD.medya.sil(x.id); albumCiz(); ctx.toast('Albümden çıkarıldı'); } }, 'Albümden çıkar') : null
    ]), { baslik: 'Çizim', odak: false });
  }

  (CD.postaTurleri = CD.postaTurleri || {}).tahta = {
    kart(o, y) {
      if (o.v && o.v.id) CD.medya.cek(String(o.v.id));
      if (CD.aktifBolum && CD.aktifBolum() === ID) return;
      y.kart({ kim: y.kim, tur: 'tahta', baslik: y.A + ' albüme bir çizim kaydetti 🎨', alt: y.saat, eylem: { ad: 'Bak', fn: () => CD.ac(ID) } });
    },
    ozet(l, A) { return '🎨 ' + A + ' albüme çizim kaydetti'; }
  };

  CD.kaydet({
    id: ID, baslik: 'Çizim Atölyesi', ikon: IKON, tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el;
      kur(el);
      if (taslak) tv.resim(taslak);
      ctx.altbar([
        { id: 'kaydet', ad: 'Albüme kaydet', ikon: '🖼️', birincil: true, tikla() { albumeKaydet(); } },
        { id: 'temizle', ad: 'Temizle', ikon: '🧹', tikla() { temizle(); } }
      ]);
      if (aktif()) {
        oda = CD.canli.oda(ID, (tur, v) => {
          if (!ctx || !tv) return;
          if (tur === 'c') tv.uygula(v);
          else if (tur === 'temizle') { tv.temizle(); taslak = null; ctx.toast(adi(karsi()) + ' tahtayı temizledi 🧽'); }
          else if (tur === 'resim') { if (v) tv.resim(v); }
          else if (tur === 'kopya') { if (!tv.kirli && v) tv.resim(v); }   // sonradan gelen: boş tuvale kopyayı al
          else if (tur === '_geldi') { if (tv.kirli) { const d = tv.dataUrl(512, 140000); if (d) oda.gonder('kopya', d); } }
          if (tur === 'c' || tur === 'resim' || tur === 'kopya' || tur === 'temizle') taslakSakla();
          durumYaz();
        });
      }
      const dt = setInterval(durumYaz, 3000); cozler.push(() => clearInterval(dt));
      cozler.push(ctx.olay.dinle('medya:geldi', () => albumCiz()));
      cozler.push(ctx.olay.dinle('kim', () => durumYaz()));
      durumYaz(); albumCiz();
    },
    unmount() {
      if (tv) { taslak = tv.kirli ? tv.dataUrl(BOYUT, 900000) : null; tv.yokEt(); tv = null; }
      clearTimeout(ui.taslakT);
      if (oda) { oda.kapat(); oda = null; }
      while (cozler.length) { try { cozler.pop()(); } catch (e) {} }
      if (ctx) ctx.ses.hepsiniDurdur();
      Object.keys(ui).forEach(k => delete ui[k]);
      ctx = null; kok = null;
    }
  });
})();
