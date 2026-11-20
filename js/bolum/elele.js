/* js/bolum/elele.js — El Ele Bankı (V2 Faz 2 · 3)
   İkiniz aynı anda ekrana parmağınızı basılı tutunca iki pixel el ortada birleşir, aradaki kalp dolar.
   Biri bırakırsa eller ayrılır, kalp söner. Anlık kanal: CD.canli.oda('elele') (geçici "bas" mesajı, 1,5 sn'de bir tazelenir).
   Karşı taraf bankta değilse "onu bekle" yazar ve karşıya posta kartı gider (10 dakikada en çok bir kez).
   Bulut yoksa (tek telefon): iki parmakla aynı anda basılı tutmak iki eli birleştirir. */
(() => {
  'use strict';
  const ID = 'elele';
  const DOLUM_MS = 3000, SONME_MS = 700, TAZELE = 1500, ZAMAN_ASIMI = 4000, DAVET_ARA = 10 * 60000;
  const EL = [
    '....KKKK....', '...KTTTTKKK.', '..KTTTTTTTTK', 'KKTTTTTTTTTK', 'SSTTTTTTTKK.', 'SSTTTTTTTTTK', 'SSTTTTTTTK..', 'KKTTTTTTK...', '..KKKKKK....'];
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="var(--seker-kiraz,#FF9DB4)" d="M32 50C19 41 12 33 12 25c0-6 4.6-10 9.6-10 4 0 7.4 2.4 10.4 6.4C35 17.4 38.4 15 42.4 15 47.4 15 52 19 52 25c0 8-7 16-20 25Z"/><path fill="var(--murekkep-2,#5D5566)" opacity=".5" d="M6 54h52v4H6z"/></svg>';

  let ctx = null, kok = null, oda = null;
  const ui = {};
  const cozler = [];
  let isaretciler = new Set(), tus = false;
  let benBas = false, onunBas = false, onunSon = 0, dolum = 0, raf = 0, sonT = 0, tamam = false;
  let tazeleT = 0, kontrolT = 0;

  const V = () => CD.varlik;
  const ben = () => CD.kim();
  const karsi = () => (V() ? V().karsi() : null);
  const aktif = () => !!(V() && V().aktif() && CD.canli);
  const tek = () => !aktif();
  const adi = (k) => CD.kimAdi(k);
  const sonSesli = (a) => (String(a).toLocaleLowerCase('tr').match(/[aeıioöuü](?=[^aeıioöuü]*$)/) || ['e'])[0];
  const yi = (a) => { const u = sonSesli(a); const v = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[u] || 'i'; return a + "'" + (/[aeıioöuü]$/i.test(a) ? 'y' : '') + v; };   // Ahmet'i, Cemre'yi
  const da = (a) => a + ('aıou'.indexOf(sonSesli(a)) >= 0 ? ' da' : ' de');

  function pixel(satirlar, renk) {
    const h = satirlar.length, w = satirlar[0].length; let r = '';
    satirlar.forEach((s, y) => { let x = 0; while (x < w) { const c = s[x]; if (c === '.' || !renk[c]) { x++; continue; } let n = 1; while (x + n < w && s[x + n] === c) n++; r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + renk[c] + '"/>'; x += n; } });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + r + '</svg>';
  }
  function elSvg(kim) {
    const k = (((CD.config || {}).MAHALLE || {}).KISILER || {})[kim] || {};
    return pixel(EL, { K: '#3B2A3A', T: k.TEN || (kim === 'ahmet' ? '#C99A74' : '#F3D2BC'), S: k.UST || '#2E2A30' });
  }

  /* ------------------------------------------------------------ çizim */
  function kur(el) {
    const e = ctx.el;
    ui.elCemre = e('div.elele-el.elele-cemre', { html: elSvg('cemre') });
    ui.elAhmet = e('div.elele-el.elele-ahmet', { html: elSvg('ahmet') });
    ui.kalp = e('div.elele-kalp', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 12 11" shape-rendering="crispEdges"><defs><clipPath id="eleleDolu"><rect class="elele-dolu-rect" x="0" y="11" width="12" height="11"/></clipPath></defs>' +
      '<path class="elele-kalp-bos" d="M2 0h3v1h2V0h3v1h1v1h1v4h-1v1h-1v1H9v1H8v1H7v1H5v-1H4V9H3V8H2V7H1V6H0V2h1V1h1z"/>' +
      '<path class="elele-kalp-dolu" clip-path="url(#eleleDolu)" d="M2 0h3v1h2V0h3v1h1v1h1v4h-1v1h-1v1H9v1H8v1H7v1H5v-1H4V9H3V8H2V7H1V6H0V2h1V1h1z"/></svg>' });
    ui.dolRect = ui.kalp.querySelector('.elele-dolu-rect');
    ui.pad = e('div.elele-pad', { role: 'button', tabindex: '0', 'aria-pressed': 'false', 'aria-describedby': 'eleleDurum',
      'aria-label': 'Basılı tut: elini uzat' }, [
      e('span.elele-ipucu', { 'aria-hidden': 'true' }, 'Parmağını basılı tut')
    ]);
    ui.sahne = e('div.sahne.elele-sahne', [
      e('div.elele-yildizlar', { 'aria-hidden': 'true' }),
      ui.elCemre, ui.kalp, ui.elAhmet,
      e('div.elele-adlar', { 'aria-hidden': 'true' }, [e('span', adi('cemre')), e('span', adi('ahmet'))]),
      ui.pad
    ]);
    ui.durum = e('p.baslik.baslik-lg.elele-durum#eleleDurum', { role: 'status', 'aria-live': 'polite' });
    ui.alt = e('p.sessiz.elele-alt');
    ui.sayac = e('p.sessiz.elele-sayac');
    el.append(ui.sahne, e('div.icerik', [e('div.yama.elele-kart', [ui.durum, ui.alt, ui.sayac])]));

    const p = ui.pad;
    p.addEventListener('pointerdown', (ev) => { ev.preventDefault(); isaretciler.add(ev.pointerId); try { p.setPointerCapture(ev.pointerId); } catch (x) {} basmaGuncelle(); });
    const birak = (ev) => { isaretciler.delete(ev.pointerId); basmaGuncelle(); };
    p.addEventListener('pointerup', birak); p.addEventListener('pointercancel', birak); p.addEventListener('lostpointercapture', birak);
    p.addEventListener('contextmenu', (ev) => ev.preventDefault());
    p.addEventListener('keydown', (ev) => { if ((ev.key === ' ' || ev.key === 'Enter') && !ev.repeat) { ev.preventDefault(); tus = true; basmaGuncelle(); } });
    p.addEventListener('keyup', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); tus = false; basmaGuncelle(); } });
    p.addEventListener('blur', () => { if (tus) { tus = false; basmaGuncelle(); } });
  }

  function sayi() { const k = ben() ? 'elele.' + ben() : 'cihaz.elele.tek'; const v = CD.depo.al(k, null); return { k, sayi: (v && Number(v.sayi)) || 0 }; }

  function ciz() {
    if (!ctx) return;
    const benimTaraf = ben() || 'cemre';
    const bas = { cemre: false, ahmet: false };
    if (tek()) { bas.cemre = isaretciler.size >= 1 || tus; bas.ahmet = isaretciler.size >= 2; }
    else { bas[benimTaraf] = benBas; bas[karsi()] = onunBas; }
    ui.sahne.classList.toggle('cemre-basili', bas.cemre);
    ui.sahne.classList.toggle('ahmet-basili', bas.ahmet);
    ui.sahne.classList.toggle('ikisi', bas.cemre && bas.ahmet);
    ui.pad.setAttribute('aria-pressed', benBas ? 'true' : 'false');
    let d = '', a = '';
    const burada = !tek() && oda && oda.burada();
    if (bas.cemre && bas.ahmet) { d = dolum >= 1 ? 'El ele 💞' : 'Eller birleşiyor…'; a = 'Bırakmayın, kalp dolsun'; }
    else if (tek()) { d = benBas ? 'Öbür eli de bekliyor' : 'Birlikte basılı tutun'; a = V() && V().bulut() && !ben() ? 'Önce bu telefonun kimin olduğunu seç.' : 'Bulut kapalı: bu telefonda iki parmakla aynı anda basılı tutun.'; }
    else if (benBas && !burada) { d = CD.ek.i(adi(karsi())) + ' bekle… 💭'; a = 'Ona posta kartı gitti; o da banka gelince eller birleşir.'; }
    else if (benBas) { d = adi(karsi()) + ' elini uzatsın…'; a = 'O da basılı tutunca eller birleşir.'; }
    else if (onunBas) { d = adi(karsi()) + ' elini uzattı 🤝'; a = 'Sen de basılı tut.'; }
    else if (burada) { d = da(adi(karsi())) + ' bankta'; a = 'İkiniz aynı anda basılı tutun.'; }
    else { d = 'Bank boş'; a = 'Basılı tutarsan ona "seni bekliyorum" postası gider.'; }
    if (ui.durum.textContent !== d) ui.durum.textContent = d;
    ui.alt.textContent = a;
    const s = sayi().sayi;
    ui.sayac.textContent = s ? 'Bugüne kadar ' + s + ' kez el ele tuttunuz 🤍' : '';
    ui.dolRect.setAttribute('y', String(11 - 11 * Math.max(0, Math.min(1, dolum))));
  }

  /* ------------------------------------------------------------ basma durumu */
  function basmaGuncelle() {
    if (!ctx) return;
    const yeni = isaretciler.size > 0 || tus;
    const degisti = yeni !== benBas;
    benBas = yeni;
    if (degisti) {
      if (benBas) { ctx.ses.tik(); try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }
      if (oda) oda.gonder('bas', benBas);
      if (benBas && !tek() && !(oda && oda.burada())) davetEt();
    }
    dongu();
    ciz();
  }
  function davetEt() {
    const son = CD.depo.al('cihaz.elele.davet', 0) || 0;
    if (Date.now() - son < DAVET_ARA) return;
    CD.depo.yaz('cihaz.elele.davet', Date.now());
    V().gonder('eleleBekle', {});
  }

  function dongu() {
    if (raf || !ctx) return;
    sonT = performance.now();
    const adim = (t) => {
      raf = 0; if (!ctx) return;
      const dt = Math.min(100, t - sonT); sonT = t;
      const ikisi = ui.sahne.classList.contains('ikisi');
      dolum = ikisi ? Math.min(1, dolum + dt / (ctx.azHareket ? 600 : DOLUM_MS)) : Math.max(0, dolum - dt / SONME_MS);
      if (ikisi && dolum >= 1 && !tamam) { tamam = true; kutla(); }
      if (!ikisi && dolum <= 0) tamam = false;
      ui.dolRect.setAttribute('y', String(11 - 11 * dolum));
      if (ikisi || dolum > 0) raf = requestAnimationFrame(adim);
      else ciz();
    };
    raf = requestAnimationFrame(adim);
  }
  function kutla() {
    const s = sayi();
    CD.depo.yaz(s.k, { sayi: s.sayi + 1, son: Date.now() });
    const m = ctx.efekt.merkez(ui.kalp);
    ctx.efekt.kalp(m.x, m.y, 18);
    ctx.ses.parilti();
    try { if (navigator.vibrate) navigator.vibrate([30, 60, 30]); } catch (e) {}
    ciz();
  }

  (CD.postaTurleri = CD.postaTurleri || {}).eleleBekle = {
    kart(o, y) { if (CD.aktifBolum && CD.aktifBolum() === ID) return; y.kart({ kim: y.kim, tur: 'eleleBekle', baslik: y.A + ' bankta seni bekliyor 🤝', alt: 'El ele tutmak için gel · ' + y.saat, eylem: { ad: 'Git', fn: () => CD.ac(ID) } }); },
    ozet(l, A) { return '🤝 ' + A + ' bankta seni bekledi'; }
  };

  CD.kaydet({
    id: ID, baslik: 'El Ele Bankı', ikon: IKON, tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el;
      isaretciler = new Set(); tus = false; benBas = onunBas = false; dolum = 0; tamam = false;
      kur(el);
      if (aktif()) {
        oda = CD.canli.oda(ID, (tur, v) => {
          if (!ctx) return;
          if (tur === 'bas') { onunBas = !!v; onunSon = Date.now(); if (onunBas) { ctx.ses.tink(); } dongu(); }
          else if (tur === '_gitti') onunBas = false;
          else if (tur === '_geldi' && benBas) oda.gonder('bas', true);
          ciz();
        });
      }
      tazeleT = setInterval(() => { if (benBas && oda) oda.gonder('bas', true); }, TAZELE);
      kontrolT = setInterval(() => { if (onunBas && Date.now() - onunSon > ZAMAN_ASIMI) { onunBas = false; dongu(); } ciz(); }, 1000);
      const gizle = () => { if (document.hidden) { isaretciler.clear(); tus = false; basmaGuncelle(); } };
      document.addEventListener('visibilitychange', gizle);
      cozler.push(() => document.removeEventListener('visibilitychange', gizle));
      cozler.push(ctx.olay.dinle('kim', () => ciz()));
      ciz();
    },
    unmount() {
      if (oda) { if (benBas) oda.gonder('bas', false); oda.kapat(); oda = null; }
      clearInterval(tazeleT); clearInterval(kontrolT); tazeleT = kontrolT = 0;
      cancelAnimationFrame(raf); raf = 0;
      while (cozler.length) { try { cozler.pop()(); } catch (e) {} }
      if (ctx) ctx.ses.hepsiniDurdur();
      Object.keys(ui).forEach(k => delete ui[k]);
      isaretciler = new Set(); tus = false; benBas = onunBas = false;
      ctx = null; kok = null;
    }
  });
})();
