/* posta.js — Çekirdek katmanı arayüzü (V2 Faz 1 · FAZ1-TASARIM.md §3, §6, §7, §11, §12.2).
   - CD.kisi: Cemre ve Ahmet pixel karakterleri (12×14 kare dizisi; saç/ten config.js → MAHALLE.KISILER).
   - #kalpDugme: "Seni düşünüyorum" (dokun = kalp, 450ms basılı tut / ↓ / Shift+Enter = emoji yağmuru seçicisi).
   - #posta: üstten inen posta kartları (karşıdan gelen her şey), "Sen yokken…" özet kartı.
   - Sahne anları: büyük pixel kalp, emoji yağmuru, mühür kırılması, saklı notun "pat" diye düşmesi.
   Bölüm modüllerine dokunmaz; her şey body'nin doğrudan çocuklarında yaşar. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const $ = (s, k) => (k || document).querySelector(s);
  const V = () => CD.varlik;
  const MAH = () => (CD.config && CD.config.MAHALLE) || {};
  const az = () => CD.azHareket;
  const adi = (k) => CD.kimAdi(k);

  /* ================================================================ karakterler (pixel) */
  // Cemre: uzun, dalgalı koyu kahve saç omuzların altına iner; siyah üst + mavi kot.
  // Ahmet: kısa siyah saç, dolu siyah sakal; siyah ceket + kot. (Tarifler fotoğraflardan alındı; renkler config.js → MAHALLE.KISILER)
  const CEMRE = [
    '....SSSS....', '...SSSSSS.F.', '..SSTTTTSSF.', '..STeTTeTS..', '..STTTTTTS..', '..SSTppTSS..', '..SS.TT.SS..',
    '..SEEEEEES..', '..SEEEEEES..', '..TEEEEEET..', '...EEEEEE...', '...JJJJJJ...', '...JJ..JJ...', '...ZZ..ZZ...'];
  const AHMET = [
    '....SSSS....', '...SSSSSS...', '...STTTTS...', '...TeTTeT...', '...TTTTTT...', '...SSmmSS...', '....SSSS....',
    '...HHHHHH...', '..HHHHHHHH..', '..THHHHHHT..', '...HHHHHH...', '...JJJJJJ...', '...JJ..JJ...', '...ZZ..ZZ...'];
  const ayarla = (k, i, j, c) => { const r = k[i].split(''); r[j] = c; k[i] = r.join(''); };
  function kareler(idle, govde) {
    const kirp = idle.map(r => r.replace(/e/g, 'T'));
    const yuru1 = idle.slice(); yuru1[12] = '..JJ....JJ..'; yuru1[13] = '..ZZ....ZZ..';
    const yuru2 = idle.slice(); yuru2[12] = '....JJJJ....'; yuru2[13] = '....ZZZZ....';
    const salla = idle.slice();
    ayarla(salla, 6, 10, 'T'); ayarla(salla, 7, 10, 'T'); ayarla(salla, 8, 10, 'T'); ayarla(salla, 9, 9, govde);
    // uyku: yatay (90° döndürülmüş), gözler kapalı, üstünde z (CSS)
    const yatay = []; for (let x = 0; x < 12; x++) { let r = ''; for (let y = 13; y >= 0; y--) r += kirp[y][x]; yatay.push(r); }
    return [idle, kirp, yuru1, yuru2, salla, yatay];
  }
  const KARE = { cemre: kareler(CEMRE, 'E'), ahmet: kareler(AHMET, 'H') };
  const tok = (ad, yedek) => { const v = getComputedStyle(document.documentElement).getPropertyValue(ad).trim(); return v || yedek; };
  function palet(kim) {
    const k = ((MAH().KISILER || {})[kim]) || {};
    const ust = k.UST || tok('--kisi-' + kim, '#2E2A30');
    return {
      S: k.SAC || tok('--kisi-' + kim + '-sac', '#3E2A22'), T: k.TEN || tok('--kisi-' + kim + '-ten', '#F2CBB0'),
      e: tok('--pixel-cizgi', '#3B2A3A'), F: tok('--marka-fiyonk', '#FFB3C7'), p: '#F2B8C6', m: kim === 'ahmet' ? '#B9786A' : '#F2B8C6',
      E: ust, H: ust, J: k.ALT || tok('--kisi-alt', '#4A6C93'), Z: '#3B2A3A'
    };
  }
  CD.kisi = {
    ROL: { idle: 0, blink: 1, walk: [2, 3], wave: 4, sleep: 5 },
    // canvas'a kare çiz; css boyutu ölçeğe göre
    ciz(canvas, kim, kare, olcek) {
      const f = (KARE[kim] || KARE.cemre)[kare || 0]; const pal = palet(kim);
      const w = f[0].length, h = f.length;
      if (canvas.width !== w) canvas.width = w; if (canvas.height !== h) canvas.height = h;
      const c = canvas.getContext('2d'); c.clearRect(0, 0, w, h);
      f.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch === '.') continue; c.fillStyle = pal[ch] || '#000'; c.fillRect(x, y, 1, 1); } });
      if (olcek) { canvas.style.width = (w * olcek) + 'px'; canvas.style.height = (h * olcek) + 'px'; }
      return canvas;
    },
    // kafa (ilk 7 satır) — şerit ve posta kartı için
    kafa(kim, px, uyuyor) {
      const c = document.createElement('canvas'); c.className = 'kisi-kafa'; c.setAttribute('aria-hidden', 'true');
      const f = (KARE[kim] || KARE.cemre)[uyuyor ? 1 : 0].slice(0, 7); const pal = palet(kim);
      c.width = 12; c.height = 7; const g = c.getContext('2d');
      f.forEach((r, y) => { for (let x = 0; x < 12; x++) { const ch = r[x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#000'; g.fillRect(x, y, 1, 1); } });
      if (px) { c.style.width = px + 'px'; c.style.height = Math.round(px * 7 / 12) + 'px'; }
      return c;
    }
  };

  /* ================================================================ küçük pixel çizimler */
  const KALP = ['..XXX..XXX..', '.XXXXXXXXXX.', 'XWXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXS', '.XXXXXXXXXS.', '..XXXXXXXS..', '...XXXXXS...', '....XXXS....', '.....SS.....'];
  const MUHUR = ['...MMMM...', '.MMMMMMMM.', '.MMKMMKMM.', 'MMKKKKKKMM', 'MMKKKKKKMM', 'MMMKKKKMMM', 'MMMMKKMMMM', '.MMMMMMMM.', '.MMMMMMMM.', '...MMMM...'];
  function pixelSvg(satirlar, renk, sinif) {
    const h = satirlar.length, w = satirlar[0].length; let r = '';
    satirlar.forEach((s, y) => { let x = 0; while (x < w) { const c = s[x]; if (c === '.') { x++; continue; } let n = 1; while (x + n < w && s[x + n] === c) n++; r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + renk[c] + '"/>'; x += n; } });
    return '<svg class="' + (sinif || '') + '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + r + '</svg>';
  }
  const kalpSvg = (s) => pixelSvg(KALP, { X: 'var(--seker-kiraz)', S: 'var(--burun-metin)', W: '#FFFFFF' }, s);
  const muhurSvg = () => pixelSvg(MUHUR, { M: 'var(--muhur)', K: 'var(--muhur-koyu)' }, 'muhur-svg');
  CD.kalpSvg = kalpSvg;

  /* ================================================================ kullanıcı dokundu mu (ses/titreşim kuralı) */
  let dokundu = false;
  ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => { dokundu = true; }, { once: true, passive: true }));
  const sesUygun = () => dokundu && document.visibilityState === 'visible';
  const titret = (d) => { if (!sesUygun()) return; try { if (navigator.vibrate) navigator.vibrate(d); } catch (e) {} };

  /* ================================================================ kalp düğmesi */
  let kalp = null, secici = null;
  let birikenKalp = 0, kalpT = 0, sonGonderim = 0;
  function kalpGorunur() {
    if (!kalp) return;
    const goster = !!(V() && V().bulut()) && !document.body.classList.contains('giris-acik');
    kalp.hidden = !goster;
    kalp.inert = document.body.classList.contains('sheet-acik');
    const o = V() && V().onun();
    kalp.classList.toggle('cevrimici', !!(o && o.cevrimici));
  }
  function kalpBas() {
    if (!V().ben()) { CD.kimSec(false).then(k => { if (k) CD.toast('Tamam ' + adi(k) + ', şimdi kalbi gönderebilirsin 💗'); }); return; }
    birikenKalp++;
    CD.ses.kalpGonder();
    const r = kalp.getBoundingClientRect(); CD.efekt.kalp(r.left + r.width / 2, r.top + r.height / 2, 3);
    kalp.classList.remove('basildi'); void kalp.offsetWidth; kalp.classList.add('basildi');
    if (kalpT) return;
    // 3 sn içindeki dokunuşlar tek gönderide birleşir; en fazla 1 gönderi / 3 sn
    const bekle = Math.max(1200, sonGonderim + 3000 - Date.now());
    kalpT = setTimeout(() => {
      const adet = birikenKalp; birikenKalp = 0; kalpT = 0; sonGonderim = Date.now();
      V().gonder('kalp', { adet });
      CD.pul && CD.pul('kalp', { say: adet, kisa: adet > 1 ? adet + ' kalp' : '' });
      CD.toast(adet > 1 ? adet + ' kalp birden 💗' : 'Kalbin yola çıktı 💗');
    }, bekle);
  }
  function kalpKur() {
    kalp = $('#kalpDugme'); if (!kalp) return;
    kalp.innerHTML = kalpSvg('kalp-svg') + '<span class="kalp-nokta" aria-hidden="true"></span>';
    let basT = 0, uzunOldu = false, aktifPointer = null;
    kalp.addEventListener('contextmenu', e => e.preventDefault());
    kalp.addEventListener('pointerdown', e => {
      if (e.button) return;
      aktifPointer = e.pointerId; uzunOldu = false;
      clearTimeout(basT); basT = setTimeout(() => { uzunOldu = true; seciciAc(); }, 450);
    });
    const birak = (e, iptal) => {
      if (aktifPointer == null || (e && e.pointerId !== aktifPointer)) return;
      aktifPointer = null; clearTimeout(basT);
      if (!iptal && !uzunOldu) kalpBas();
    };
    kalp.addEventListener('pointerup', e => birak(e, false));
    kalp.addEventListener('pointercancel', e => birak(e, true));
    kalp.addEventListener('pointerleave', e => { if (aktifPointer != null && e.pointerType === 'mouse') birak(e, true); });
    kalp.addEventListener('click', e => { if (e.detail === 0) kalpBas(); });        // klavye (Enter / Boşluk)
    kalp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || (e.key === 'Enter' && e.shiftKey)) { e.preventDefault(); seciciAc(); }
    });
    new MutationObserver(kalpGorunur).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    kalpGorunur();
  }

  /* ---------------------------------------------------------------- emoji yağmuru seçicisi */
  const EMOJILER = ['💗', '🌼', '🐾', '⭐', '😘'];
  function seciciAc() {
    if (!V().ben()) { CD.kimSec(false); return; }
    if (secici) return;
    CD.ses.pop();
    secici = CD.el('div.secici', { role: 'dialog', 'aria-label': 'Ne yağdıralım?' }, [
      CD.el('span.gorsel-gizli', 'Ne yağdıralım?'),
      ...EMOJILER.map(em => CD.el('button.secici-emoji', { type: 'button', 'aria-label': em + ' yağmuru gönder', onclick: () => yagmurGonder(em) }, em))
    ]);
    document.body.appendChild(secici);
    const dugmeler = [...secici.querySelectorAll('button')];
    secici.addEventListener('keydown', e => {
      const i = dugmeler.indexOf(document.activeElement);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + dugmeler.length) % dugmeler.length; dugmeler[n].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); seciciKapat(true); }
      else if (e.key === 'Tab') { e.preventDefault(); const n = (i + (e.shiftKey ? -1 : 1) + dugmeler.length) % dugmeler.length; dugmeler[n].focus(); }
    });
    requestAnimationFrame(() => { if (secici) secici.classList.add('acik'); });
    setTimeout(() => { if (dugmeler[0]) dugmeler[0].focus({ preventScroll: true }); }, 30);
    setTimeout(() => document.addEventListener('pointerdown', disari, true), 0);
  }
  function disari(e) { if (secici && !secici.contains(e.target) && e.target !== kalp && !kalp.contains(e.target)) seciciKapat(false); }
  function seciciKapat(odakGeri) {
    if (!secici) return;
    document.removeEventListener('pointerdown', disari, true);
    const s = secici; secici = null; s.classList.remove('acik');
    setTimeout(() => s.remove(), 200);
    if (odakGeri && kalp) kalp.focus({ preventScroll: true });
  }
  function yagmurGonder(em) {
    seciciKapat(true);
    V().gonder('yagmur', { emoji: em });
    CD.pul && CD.pul('yagmur', { kisa: em });
    CD.efekt.yagmur(em, 1000, 6); CD.ses.yagmurSerp();
    CD.toast(em + ' yağmuru gönderildi');
  }

  /* ================================================================ posta kartları */
  let kap = null, kuyruk = [], gosterilen = null, kartT = 0, durduruldu = false, kalanSure = 0, kartBasladi = 0;
  function kapKur() {
    kap = $('#posta'); if (!kap) return;
    kap.addEventListener('pointerenter', () => durdur(true));
    kap.addEventListener('pointerleave', () => durdur(false));
    kap.addEventListener('focusin', () => durdur(true));
    kap.addEventListener('focusout', () => durdur(false));
    let y0 = null;
    kap.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
    kap.addEventListener('touchmove', e => { if (y0 != null && e.touches[0].clientY - y0 < -24) { y0 = null; kartKapat(); } }, { passive: true });
  }
  function durdur(v) {
    if (!gosterilen || gosterilen.kalici) return;
    if (v && !durduruldu) { durduruldu = true; clearTimeout(kartT); kalanSure = Math.max(1200, kalanSure - (Date.now() - kartBasladi)); }
    else if (!v && durduruldu) { durduruldu = false; kartBasladi = Date.now(); kartT = setTimeout(kartKapat, kalanSure); }
  }
  /* kart({ kim, baslik, alt, eylem:{ad, fn}, muhur:true, kalici:false, satirlar:[] }) */
  function kart(k) {
    if (!kap) return;
    kuyruk.push(k);
    // kuyruk 3'ü geçerse tek karta birleşir
    const bekleyen = kuyruk.filter(x => !x.kalici);
    if (bekleyen.length > 3) {
      const kim = bekleyen[0].kim;
      kuyruk = kuyruk.filter(x => x.kalici).concat([{ kim, baslik: CD.ek.den(adi(kim)) + ' ' + bekleyen.length + ' yeni şey 💌', alt: 'Mahallede seni bekliyorlar', birlesik: true }]);
    }
    if (!gosterilen) sonraki();
  }
  function sonraki() {
    const k = kuyruk.shift(); if (!k) { gosterilen = null; return; }
    gosterilen = k; durduruldu = false;
    const govde = CD.el('div.posta-metin', [
      CD.el('strong.posta-baslik', k.baslik),
      k.alt ? CD.el('span.posta-alt', k.alt) : null,
      k.satirlar ? CD.el('ul.posta-satirlar', k.satirlar.map(s => CD.el('li', s))) : null
    ]);
    const eylemler = [];
    if (k.eylem) eylemler.push(CD.el('button.dugme.kucuk.posta-eylem', { type: 'button', onclick: () => { const fn = k.eylem.fn; kartKapat(); if (fn) fn(); } }, k.eylem.ad));
    if (k.kalici) eylemler.push(CD.el('button.dugme.kucuk.posta-eylem', { type: 'button', onclick: () => { kartKapat(); if (k.tamam) k.tamam(); } }, 'Tamam 💗'));
    const el = CD.el('div.yama.posta-kart' + (k.kalici ? '.kalici' : ''), { 'data-tur': k.tur || '' }, [
      k.muhur !== false ? CD.el('span.posta-muhur', { 'aria-hidden': 'true', html: '<span class="muhur-yari sol">' + muhurSvg() + '</span><span class="muhur-yari sag">' + muhurSvg() + '</span>' }) : null,
      k.kim ? CD.el('span.posta-kafa', [CD.kisi.kafa(k.kim, 32)]) : null,
      govde,
      eylemler.length ? CD.el('div.posta-eylemler', eylemler) : null
    ]);
    kap.innerHTML = ''; kap.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('goster')));
    if (k.muhurKir) setTimeout(() => muhurKir(el), 360);
    if (k.kalici) { const b = el.querySelector('.posta-eylem:last-child'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 360); return; }
    kalanSure = parseInt(tok('--sure-posta', '5000')) || 5000; kartBasladi = Date.now();
    clearTimeout(kartT); kartT = setTimeout(kartKapat, kalanSure);
  }
  function kartKapat() {
    clearTimeout(kartT);
    const el = kap && kap.firstElementChild;
    if (el) { el.classList.remove('goster'); el.classList.add('cik'); setTimeout(() => { if (el.parentNode) el.remove(); }, 220); }
    gosterilen = null; durduruldu = false;
    setTimeout(sonraki, 260);
  }
  function muhurKir(el) {
    const m = el.querySelector('.posta-muhur'); if (!m) return;
    m.classList.add('kirik');
    const r = m.getBoundingClientRect(); CD.efekt.yildiz(r.left + r.width / 2, r.top + r.height / 2, 5);
  }

  /* ================================================================ sahne anları */
  function buyukKalp() {
    if (az()) { kalpParla(); return; }
    const s = CD.el('div.sahne-kalp', { 'aria-hidden': 'true', html: kalpSvg() });
    document.body.appendChild(s);
    setTimeout(() => { const r = s.getBoundingClientRect(); CD.efekt.kalp(r.left + r.width / 2, r.top + r.height / 2, 18); s.remove(); }, 650);
    kalpAt();
  }
  function kalpAt() { if (!kalp || az()) { kalpParla(); return; } kalp.classList.remove('atiyor'); void kalp.offsetWidth; kalp.classList.add('atiyor'); setTimeout(() => kalp.classList.remove('atiyor'), 2100); }
  function kalpParla() { if (!kalp) return; kalp.classList.add('parla'); setTimeout(() => kalp.classList.remove('parla'), 2000); }

  /* ================================================================ gelen olaylar → kart + sahne */
  const HAYVAN = { pittiksu: { ad: () => ((CD.config.PITTIKSU || {}).AD || 'Pıttıksu'), em: '🐱' }, barbie: { ad: () => ((CD.config.BARBIE || {}).AD || 'Barbie'), em: '🐶' } };
  const hayvanAdi = (h) => (HAYVAN[h] || HAYVAN.barbie).ad();
  const hayvanEm = (h) => (HAYVAN[h] || HAYVAN.barbie).em;
  const mahalledeMi = () => !(CD.aktifBolum && CD.aktifBolum());
  function saatYaz(t) { return CD.saatYaz(new Date(t || Date.now())); }

  function geldi(d) {
    const o = d.o, kim = V().karsi(); if (!o || !kim) return;
    const A = adi(kim), v = o.v || {}, saat = saatYaz(o.t);
    const ses = (fn) => { if (sesUygun()) { try { fn(); } catch (e) {} } };
    switch (o.tur) {
      case 'kalp': {
        const n = Math.max(1, Math.min(99, Number(v.adet) || 1));
        kart({ kim, tur: 'kalp', baslik: A + ' seni düşünüyor 💗', alt: (n > 1 ? n + ' kez · ' : '') + saat });
        buyukKalp(); ses(() => CD.ses.kalpGeldi()); titret([30, 60, 30]);
        break;
      }
      case 'yagmur': {
        const em = EMOJILER.indexOf(v.emoji) >= 0 ? v.emoji : '💗';
        kart({ kim, tur: 'yagmur', baslik: A + ' sana ' + (az() ? em.repeat(5) : em) + ' yağdırdı', alt: saat });
        CD.efekt.yagmur(em, parseInt(tok('--sure-yagmur', '3000')) || 3000); ses(() => CD.ses.yagmurSerp());
        break;
      }
      case 'elci':
        if (!mahalledeMi()) kart({ kim, tur: 'elci', baslik: hayvanAdi(v.hayvan) + ' kapında bekliyor ' + hayvanEm(v.hayvan), alt: CD.ek.den(A) + ' · ' + saat, eylem: { ad: 'Git', fn: () => { CD.ac(''); setTimeout(() => CD.mahalle && CD.mahalle.evineKay && CD.mahalle.evineKay(V().ben()), 120); } } });
        break;
      case 'elciAlindi':
        kart({ kim, tur: 'elciAlindi', baslik: v.hediye === 'isirik' ? A + ' şakacı ısırığını aldı 🦷' : A + ' öpücüğünü aldı 💋', alt: hayvanAdi(v.hayvan) + ' eve döndü · ' + saat });
        break;
      case 'muhur':
        kart({ kim, tur: 'muhur', baslik: 'Mühür kırıldı 💌', alt: A + (v.neyi === 'mektup' ? ' mektubunu okudu · ' : ' notunu okudu · ') + saat, muhurKir: !az() });
        ses(() => CD.ses.muhurKirildi()); titret([10, 40, 10]);
        break;
      case 'soru':
        kart({ kim, tur: 'soru', baslik: A + ' günün sorusunu cevapladı 📮', alt: saat, eylem: { ad: 'Bak', fn: () => { CD.ac(''); setTimeout(() => CD.mahalle && CD.mahalle.soruAc(), 120); } } });
        break;
      case 'ruh':
        if (v.tur === 'firtina') kart({ kim, tur: 'ruh', baslik: CD.ek.nin(A) + ' havası fırtınalı ⛈', alt: 'Bir kalp iyi gelebilir', eylem: { ad: 'Kalp gönder', fn: () => kalpBas() } });
        break;
      case 'uyku':
        kart({ kim, tur: 'uyku', baslik: v.uyuyor ? A + ' uyudu 🌙' : A + ' uyandı ☀', alt: v.uyuyor ? 'İyi geceler · ' + saat : 'Günaydın · ' + saat });
        break;
      case 'not':
        kart({ kim, tur: 'not', baslik: A + ' bir binaya not sakladı 📌', alt: 'Hangisi acaba? Çatılarda pırıltı ara' });
        break;      default: {
        // Faz 2 türleri (gece mührü, bakım, kaset, foto, şarkı…): modüller CD.postaTurleri[tur] = { kart(o, y), ozet(liste, A) } ile ekler
        const t = (CD.postaTurleri || {})[o.tur];
        if (t && t.kart) { try { t.kart(o, { kim, A, v, saat, kart, ses, titret, sesUygun, mahalledeMi }); } catch (e) { console.warn('[posta]', o.tur, e); } }
      }
    }
  }

  /* ---------------------------------------------------------------- "Sen yokken…" özet kartı */
  let birikenBekleyen = null;
  function senYokken(liste) {
    const kim = V().karsi(); if (!kim) return;
    const A = adi(kim), satir = [];
    const say = (t) => liste.filter(o => o.tur === t);
    const kalpler = say('kalp').reduce((a, o) => a + Math.max(1, Number((o.v || {}).adet) || 1), 0);
    if (kalpler) satir.push('💗 ' + A + ' ' + kalpler + ' kez seni düşündü');
    const elciler = V().bekleyenElciler();
    if (elciler.length) { const h = (elciler[elciler.length - 1].v || {}).hayvan; satir.push(hayvanEm(h) + ' ' + hayvanAdi(h) + ' kapında bekliyor' + (elciler.length > 1 ? ' ×' + elciler.length : '')); }
    if (V().banaNotlar().length) satir.push('📌 Bir binada sana not var');
    if (say('muhur').length) satir.push('💌 Mührün kırıldı: ' + (say('muhur').some(o => (o.v || {}).neyi === 'mektup') ? 'mektubunu okudu' : 'notunu okudu'));
    if (say('soru').some(o => (o.v || {}).gun === CD.bugun())) satir.push('📮 ' + A + ' günün sorusunu cevapladı');
    const y = say('yagmur'); if (y.length) satir.push(((y[y.length - 1].v || {}).emoji || '🌼') + ' ' + A + ' sana yağmur yağdırdı');
    if (say('elciAlindi').length) satir.push('💋 ' + A + ' hediyeni aldı');
    Object.keys(CD.postaTurleri || {}).forEach(tur => { const t = CD.postaTurleri[tur]; if (!t || !t.ozet) return; const l = say(tur); if (!l.length) return; try { const m = t.ozet(l, A); if (m) satir.push(m); } catch (e) {} });
    if (!satir.length) return;
    const goster = () => kart({ kim, kalici: true, baslik: 'Sen yokken…', satirlar: satir.slice(0, 4), muhur: true,
      tamam: () => { const n = Math.min(18, Math.max(kalpler, 4)); CD.efekt.kalp(innerWidth / 2, innerHeight * 0.3, n); } });
    birikenBekleyen = goster;
    hazirsaGoster();
  }
  function hazirsaGoster() {
    if (!birikenBekleyen) return;
    if (document.body.classList.contains('giris-acik') || $('#kilit')) return;      // giriş bitince (giris:bitti)
    const fn = birikenBekleyen; birikenBekleyen = null;
    setTimeout(fn, 800);
  }

  /* ================================================================ saklı not düşüşü ("pat") */
  let notAcik = null;
  function notDusur(n) {
    if (notAcik || !n) return;
    const kim = V().karsi(); const A = adi(kim);
    const onceki = document.activeElement;
    const dugme = CD.el('button.dugme.not-okudum', { type: 'button' }, 'Okudum 💌');
    const kagit = CD.el('div.not-kagit', { role: 'dialog', 'aria-modal': 'true', 'aria-label': CD.ek.den(A) + ' saklı not' }, [
      CD.el('span.not-bant', { 'aria-hidden': 'true' }),
      CD.el('p.not-metin', n.metin),                    // metin ancak açılma koşulu sağlanınca DOM'a girer
      CD.el('p.not-imza', '— ' + A),
      dugme
    ]);
    const katman = CD.el('div.not-katman', [kagit]);
    document.body.appendChild(katman);
    notAcik = { katman, n };
    requestAnimationFrame(() => requestAnimationFrame(() => katman.classList.add('dus')));
    setTimeout(() => {
      if (!notAcik) return;
      kagit.classList.add('ez');
      const r = kagit.getBoundingClientRect(); CD.efekt.toz(r.left + r.width / 2, r.bottom, 6);
      if (sesUygun()) CD.ses.pat();
      setTimeout(() => kagit.classList.remove('ez'), 140);
    }, az() ? 20 : 500);
    setTimeout(() => dugme.focus({ preventScroll: true }), az() ? 60 : 640);
    const kapat = () => {
      if (!notAcik) return;
      notAcik = null;
      document.removeEventListener('keydown', tus, true);
      V().notOkundu(n);
      if (kalp && !kalp.hidden && !az()) {
        const k = kalp.getBoundingClientRect(), r = kagit.getBoundingClientRect();
        kagit.style.setProperty('--ucus-x', (k.left + k.width / 2 - (r.left + r.width / 2)) + 'px');
        kagit.style.setProperty('--ucus-y', (k.top + k.height / 2 - (r.top + r.height / 2)) + 'px');
      }
      kagit.classList.add('burus'); katman.classList.add('kapan');
      CD.ses.pop();
      setTimeout(() => { katman.remove(); if (onceki && onceki.isConnected) try { onceki.focus({ preventScroll: true }); } catch (e) {} }, 420);
      setTimeout(kalpParla, 380);
    };
    const tus = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); kapat(); } };
    document.addEventListener('keydown', tus, true);
    dugme.addEventListener('click', kapat);
  }
  function notKontrol(id) {
    if (!id || !V() || !V().aktif()) return;
    setTimeout(() => {
      if (CD.aktifBolum() !== id) return;
      const n = V().banaNotlar().find(x => x.bina === id);
      if (n) notDusur(n);
    }, 700);
  }

  /* ================================================================ mektup okundu mührü (bir kez) */
  let mektupBekliyor = false;
  function metinIzi(s) { let h = 2166136261; s = String(s || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function mektupMuhur() {
    if (!mektupBekliyor || !V() || !V().aktif()) return;
    const ben = V().ben(), yazar = MAH().MEKTUP_YAZARI || 'ahmet';
    mektupBekliyor = false;
    if (ben === yazar) return;                        // kendi yazdığını okuyan mühür göndermez
    const iz = metinIzi((CD.config || {}).NOT);
    const anahtar = 'mektupMuhur.' + ben;
    if (CD.depo.al(anahtar, '') === iz) return;
    CD.depo.yaz(anahtar, iz);
    V().gonder('muhur', { neyi: 'mektup' });
    CD.pul && CD.pul('muhur', { kisa: 'mektup okundu' });
  }

  /* ================================================================ kur */
  CD.posta = { kart, kalpGonder: () => kalpBas(), seciciAc, notDusur, buyukKalp };
  CD.hazir(() => {
    kalpKur(); kapKur();
    CD.olay.dinle('posta:geldi', geldi);
    CD.olay.dinle('posta:biriken', senYokken);
    CD.olay.dinle('giris:bitti', () => { hazirsaGoster(); kalpGorunur(); });
    CD.olay.dinle('bolum:acildi', (id) => { seciciKapat(false); notKontrol(id); });
    CD.olay.dinle('hub:acildi', () => seciciKapat(false));
    CD.olay.dinle('varlik:degisti', kalpGorunur);
    CD.olay.dinle('senk:acildi', () => { kalpGorunur(); mektupMuhur(); });
    CD.olay.dinle('kim', () => { kalpGorunur(); mektupMuhur(); });
    CD.olay.dinle('mektup:acildi', () => { mektupBekliyor = true; mektupMuhur(); });
  });
})();
