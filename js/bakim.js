/* bakim.js — Hayvanlara ortak bakım (V2 Faz 2 · 2). Pıttıksu ve Barbie bölümleri tek satırla bağlanır.
   - Besleme/sevme eylemi CD.bakim.sevgi('pittiksu') der → bugün kimin sevgi verdiği kişinin KENDİ anahtarına yazılır:
       cd.bakim.<kim> = { pittiksu: 'yyyy-aa-gg', barbie: 'yyyy-aa-gg' }   (bölümlerin kendi kayıtlarına dokunulmaz)
   - Günün ilk sevgisi karşıya posta ('sevgi') olarak gider. İkisi de aynı gün sevdiyse hayvanın "çok mutlu" anı oynar (telefon başına günde bir kez).
   - Bölümde gösterge: "bugün: Ahmet 💗 Cemre 💗" — CD.bakim.bagla(hayvan, { kap, hedef }) → çözücü fonksiyon (unmount'ta çağrılır). */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const HAYVANLAR = { pittiksu: () => ((CD.config.PITTIKSU || {}).AD || 'Pıttıksu'), barbie: () => ((CD.config.BARBIE || {}).AD || 'Barbie') };
  const KUTLANAN = 'cihaz.bakim.kutlanan';
  const V = () => CD.varlik;
  const ben = () => CD.kim();
  const karsi = () => (V() ? V().karsi() : null);
  const anahtar = (k) => k === 'tek' ? 'cihaz.bakim.tek' : 'bakim.' + k;       // kim seçilmemiş telefon: yalnız bu cihazda
  const kayit = (k) => { const v = k ? CD.depo.al(anahtar(k), {}) : {}; return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; };
  // yönelme eki: Pıttıksu'ya, Barbie'ye
  const ye = (ad) => { const s = String(ad || ''); const u = (s.toLocaleLowerCase('tr').match(/[aeıioöuü](?=[^aeıioöuü]*$)/) || ['e'])[0]; const kalin = 'aıou'.indexOf(u) >= 0; return s + "'" + (/[aeıioöuü]$/i.test(s) ? 'y' : '') + (kalin ? 'a' : 'e'); };
  const canliGelen = {};               // { pittiksu: 'gun' } kanaldan gelen karşı sevgisi
  const baglar = new Set();            // açık göstergeler

  function bugun(h) {
    const g = CD.bugun();
    const b = ben(), k = karsi();
    return {
      ben: b ? kayit(b)[h] === g : !!kayit('tek')[h] && kayit('tek')[h] === g,
      karsi: !!(k && V() && V().aktif() && (kayit(k)[h] === g || canliGelen[h] === g))
    };
  }
  function kutlandi(h) { const a = CD.depo.al(KUTLANAN, {}); return !!(a && a[h] === CD.bugun()); }
  function kutlaIsaretle(h) { const a = CD.depo.al(KUTLANAN, {}) || {}; a[h] = CD.bugun(); CD.depo.yaz(KUTLANAN, a); }

  /* sevgi verildi (besleme ya da sevme) */
  function sevgi(h) {
    if (!HAYVANLAR[h]) return;
    const g = CD.bugun(), b = ben() || 'tek';
    const r = kayit(b);
    if (r[h] !== g) {
      r[h] = g; CD.depo.yaz(anahtar(b), r);
      if (ben() && V()) V().gonder('sevgi', { hayvan: h, gun: g });
    }
    guncelle(h);
  }
  function guncelle(h) { baglar.forEach(x => { if (x.h === h) x.ciz(); }); }

  /* "çok mutlu" anı: hedefin üstünde büyük kalp + kalp patlaması + zıplama */
  function cokMutlu(h, hedef) {
    if (kutlandi(h)) return false;
    kutlaIsaretle(h);
    const ad = HAYVANLAR[h]();
    if (hedef && hedef.isConnected) {
      if (!CD.azHareket) { hedef.classList.remove('bakim-cokmutlu'); void hedef.offsetWidth; hedef.classList.add('bakim-cokmutlu'); setTimeout(() => hedef.classList.remove('bakim-cokmutlu'), 2400); }
      const r = hedef.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height * 0.35;
      if (!CD.azHareket && CD.kalpSvg) {
        const k = CD.el('div.bakim-kalp', { 'aria-hidden': 'true', html: CD.kalpSvg() });
        k.style.left = x + 'px'; k.style.top = y + 'px';
        document.body.appendChild(k);
        setTimeout(() => { CD.efekt.kalp(x, y, 18); k.remove(); }, 700);
      } else CD.efekt.kalp(x, y, 8);
      try { CD.ses.zafer(); } catch (e) {}
      CD.toast(ad + ' çok mutlu! İkiniz de sevdiniz 💗', 3200);
    } else if (CD.posta) {
      CD.posta.kart({ kim: karsi(), tur: 'cokMutlu', baslik: ad + ' çok mutlu 💗', alt: 'Bugün ikiniz de sevdiniz', eylem: { ad: 'Git', fn: () => CD.ac(h) } });
    }
    return true;
  }
  function ikisiMi(h) { const d = bugun(h); return d.ben && d.karsi; }

  /* bölüm göstergesi */
  function bagla(h, o) {
    o = o || {};
    const el = CD.el('div.bakim-gosterge', { role: 'status', 'aria-live': 'polite' });
    const x = {
      h, el,
      ciz() {
        const d = bugun(h);
        el.innerHTML = '';
        const parca = (ad, var_) => CD.el('span.bakim-kisi' + (var_ ? '.var' : ''), [ad + ' ', CD.el('span.bakim-kalpcik', { 'aria-hidden': 'true' }, var_ ? '💗' : '🤍')]);
        el.appendChild(CD.el('span.bakim-bugun', 'bugün:'));
        const b = ben(), k = karsi();
        if (b) el.appendChild(parca(CD.kimAdi(b), d.ben)); else el.appendChild(parca('sen', d.ben));
        if (k && V() && V().aktif()) el.appendChild(parca(CD.kimAdi(k), d.karsi));
        const metin = 'Bugün ' + (b ? CD.kimAdi(b) : 'sen') + (d.ben ? ' sevgi verdi' : ' henüz sevmedi') + (k && V() && V().aktif() ? ', ' + CD.kimAdi(k) + (d.karsi ? ' sevgi verdi' : ' henüz sevmedi') : '');
        el.setAttribute('aria-label', metin);
        el.classList.toggle('ikisi', d.ben && d.karsi);
        if (d.ben && d.karsi) setTimeout(() => { if (el.isConnected) cokMutlu(h, o.hedef); }, 500);
      }
    };
    baglar.add(x);
    if (o.kap) o.kap.appendChild(el);
    x.ciz();
    return () => { baglar.delete(x); };
  }

  (CD.postaTurleri = CD.postaTurleri || {}).sevgi = {
    kart(o, y) {
      const h = o.v && o.v.hayvan; if (!HAYVANLAR[h]) return;
      if (o.v.gun) canliGelen[h] = o.v.gun;
      if (o.v.gun !== CD.bugun()) return;
      const acikMi = CD.aktifBolum && CD.aktifBolum() === h;
      if (acikMi) { guncelle(h); return; }                 // bölümdeyse gösterge söyler (ve ikisiyse çok mutlu anı)
      if (ikisiMi(h)) { cokMutlu(h, null); return; }
      y.kart({ kim: y.kim, tur: 'sevgi', baslik: y.A + ' bugün ' + ye(HAYVANLAR[h]()) + ' sevgi verdi 💗', alt: 'Sen de seversen çok mutlu olacak', eylem: { ad: 'Git', fn: () => CD.ac(h) } });
    },
    ozet(l, A) { return '💗 ' + A + ' hayvanlara sevgi verdi'; }
  };

  CD.bakim = { sevgi, bugun, bagla, ikisiMi, HAYVANLAR };
  CD.hazir(() => {
    CD.olay.dinle('senk:yenilendi', () => Object.keys(HAYVANLAR).forEach(guncelle));
    CD.olay.dinle('kim', () => Object.keys(HAYVANLAR).forEach(guncelle));
  });
})();
