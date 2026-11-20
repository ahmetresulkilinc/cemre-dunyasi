/* js/bolum/sayac.js — Saat Kulesi: geri sayımlar (V2 Faz 3 · 3)
   Kaynaklar (hiçbir tarih uydurulmaz; hepsi boş başlar):
     - config.js → SAYAC: [{ TUR, AD, TARIH:'yyyy-aa-gg', YILLIK }]  (Ahmet doldurur)
     - config.js → BIZIM.BIRLIKTE_TARIH doluysa her yıl tekrar eden "Yıldönümü"
     - arayüzden eklenenler: cd.sayac.<kim> [{ id, tur, ad, tarih, yillik }] (kişi kendi anahtarına yazar)
   CD.sayac.enYakin() → mahalle haber şeridinde küçük yazı. */
(() => {
  'use strict';
  const ID = 'sayac';
  const A = () => CD.ani;
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="20" y="10" width="24" height="46" rx="4" fill="var(--seker-seftali,#FFC3A3)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3"/><circle cx="32" cy="26" r="9" fill="var(--kagit,#FFFDF9)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3"/><path d="M32 21v5h4" stroke="var(--murekkep-2,#5D5566)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
  const TURLER = { bulusma: ['🫶', 'Sonraki buluşma', false], dogum: ['🎂', 'Doğum günü', true], yildonumu: ['💞', 'Yıldönümü', true], tasinma: ['🏡', 'Eve taşınma', false], ozel: ['⭐', 'Özel gün', false] };
  const ANAHTAR = 'sayac';
  let ctx = null, kok = null, govde = null, saniyeT = 0, cozucu = [];

  function sonraki(tarih, yillik) {
    if (!A().tarihGecerli(tarih)) return null;
    if (!yillik) return { tarih, gun: A().gunKaldi(tarih) };
    const [, a, g] = tarih.split('-').map(Number);
    const y = new Date().getFullYear();
    for (let i = 0; i < 3; i++) {
      // 29 Şubat: artık olmayan yılda 28 Şubat
      let gg = g; if (a === 2 && g === 29) { const yy = y + i; if (!((yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0)) gg = 28; }
      const iso = (y + i) + '-' + String(a).padStart(2, '0') + '-' + String(gg).padStart(2, '0');
      const k = A().gunKaldi(iso); if (k >= 0) return { tarih: iso, gun: k, yil: (y + i) - Number(tarih.slice(0, 4)) };
    }
    return null;
  }
  function hepsi() {
    const l = [];
    const cfg = (CD.config && CD.config.SAYAC) || [];
    (Array.isArray(cfg) ? cfg : []).forEach((c, i) => {
      if (!c || !A().tarihGecerli(c.TARIH)) return;
      const tur = TURLER[c.TUR] ? c.TUR : 'ozel';
      l.push({ id: 'cfg' + i, tur, ad: A().kirp(c.AD || TURLER[tur][1], 50), tarih: c.TARIH, yillik: c.YILLIK != null ? !!c.YILLIK : TURLER[tur][2], ayar: true });
    });
    const bt = CD.config && CD.config.BIZIM && CD.config.BIZIM.BIRLIKTE_TARIH;
    if (A().tarihGecerli(bt)) l.push({ id: 'cfg-birlikte', tur: 'yildonumu', ad: 'Yıldönümümüz', tarih: bt, yillik: true, ayar: true });
    A().ikisi(ANAHTAR).forEach(x => { if (A().tarihGecerli(x.tarih)) l.push({ id: x.id, kim: x.kim, tur: TURLER[x.tur] ? x.tur : 'ozel', ad: A().kirp(x.ad, 50), tarih: x.tarih, yillik: !!x.yillik }); });
    return l.map(s => Object.assign(s, { s: sonraki(s.tarih, s.yillik) })).sort((a, b) => {
      const ga = a.s && a.s.gun >= 0 ? a.s.gun : 1e6 - (a.s ? a.s.gun : 0), gb = b.s && b.s.gun >= 0 ? b.s.gun : 1e6 - (b.s ? b.s.gun : 0);
      return ga - gb;
    });
  }
  function enYakin() { const s = hepsi().find(x => x.s && x.s.gun >= 0); return s ? { ad: s.ad, gun: s.s.gun, tarih: s.s.tarih, tur: s.tur, em: TURLER[s.tur][0] } : null; }
  const gunMetni = (g) => g === 0 ? 'bugün!' : (g === 1 ? 'yarın' : g + ' gün');

  /* pixel rakamlar (3×5) */
  const RAKAM = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'],
    5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'] };
  function rakamSvg(s) {
    s = String(s); let r = '';
    [...s].forEach((c, i) => { const d = RAKAM[c]; if (!d) return; d.forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') r += '<rect x="' + (i * 4 + x) + '" y="' + y + '" width="1" height="1"/>'; })); });
    return '<svg class="sy-rakam" viewBox="0 0 ' + (s.length * 4 - 1) + ' 5" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + r + '</svg>';
  }
  function kalanParca(iso) {
    const [y, a, g] = iso.split('-').map(Number);
    let ms = Math.max(0, new Date(y, a - 1, g).getTime() - Date.now());
    const gun = Math.floor(ms / 86400000); ms -= gun * 86400000;
    const saat = Math.floor(ms / 3600000); ms -= saat * 3600000;
    const dk = Math.floor(ms / 60000); const sn = Math.floor((ms - dk * 60000) / 1000);
    return { gun, saat, dk, sn };
  }

  function ciz() {
    if (!ctx || !govde) return;
    clearInterval(saniyeT); saniyeT = 0;
    govde.innerHTML = '';
    const l = hepsi(), yakin = l.find(x => x.s && x.s.gun >= 0);
    if (yakin) {
      const bas = ctx.el('div.sy-kadran-ad', [ctx.el('span', { 'aria-hidden': 'true' }, TURLER[yakin.tur][0] + ' '), yakin.ad]);
      const kutular = ctx.el('div.sy-kadran-kutular', { 'aria-hidden': 'true' });
      const canli = ctx.el('p.gorsel-gizli', { role: 'status' });
      const guncelle = () => {
        const p = kalanParca(yakin.s.tarih);
        kutular.innerHTML = '';
        [[p.gun, 'gün'], [p.saat, 'saat'], [p.dk, 'dakika'], [p.sn, 'saniye']].forEach(([v, ad]) => kutular.appendChild(ctx.el('div.sy-kutu', [ctx.el('span.sy-kutu-sayi', { html: rakamSvg(ad === 'gün' ? v : String(v).padStart(2, '0')) }), ctx.el('span.sy-kutu-ad', ad)])));
        if (!canli.textContent) canli.textContent = yakin.ad + ': ' + (yakin.s.gun === 0 ? 'bugün' : p.gun + ' gün ' + p.saat + ' saat kaldı');
      };
      guncelle();
      govde.appendChild(ctx.el('section.yama.sy-kadran', { 'aria-label': 'En yakın geri sayım' }, [bas, kutular, canli,
        ctx.el('div.sy-kadran-tarih', A().tarihUzun(yakin.s.tarih) + (yakin.s.gun === 0 ? ' · bugün! 🎉' : ''))]));
      if (!ctx.azHareket) saniyeT = setInterval(() => { if (!document.hidden && kutular.isConnected) guncelle(); }, 1000);
      else saniyeT = setInterval(() => { if (!document.hidden && kutular.isConnected) guncelle(); }, 30000);
    } else {
      govde.appendChild(ctx.el('div.bos-durum.sy-bos', [ctx.el('div.buyuk', '🕰️'), ctx.el('p', 'Saat kulesi henüz bir gün saymıyor. Sonraki buluşmanızı, doğum günlerini ya da yıldönümünüzü ekleyin.')]));
    }
    govde.appendChild(ctx.el('button.dugme.tam', { type: 'button', onclick: () => A().kimIste(() => ekle()) }, '⏳ Geri sayım ekle'));
    if (l.length) {
      const ul = ctx.el('ul.sy-liste');
      l.forEach(s => {
        const gecti = !s.s || s.s.gun < 0;
        ul.appendChild(ctx.el('li.sy-satir' + (gecti ? '.gecti' : ''), [
          ctx.el('span.sy-satir-em', { 'aria-hidden': 'true' }, TURLER[s.tur][0]),
          ctx.el('span.sy-satir-metin', [ctx.el('strong', s.ad), ctx.el('span.sessiz', gecti ? A().tarihUzun(s.tarih) + ' · geçti' : A().tarihUzun(s.s.tarih) + (s.yillik ? ' · her yıl' : '') + (s.s.yil ? ' · ' + s.s.yil + '. yıl' : ''))]),
          ctx.el('span.sy-satir-gun', gecti ? '✓' : gunMetni(s.s.gun)),
          s.ayar ? ctx.el('span.rozet.gri', { title: 'config.js içinden' }, 'ayar') : (s.kim ? A().kisiIkon(s.kim, 14) : null),
          s.kim && s.kim === A().ben() ? ctx.el('button.dugme-ikon.sy-sil', { type: 'button', 'aria-label': s.ad + ' sayacını sil', onclick: async () => { if (await ctx.onayla('"' + s.ad + '" silinsin mi?', 'Sil', 'Kalsın')) { A().benimSil(ANAHTAR, s.id); ciz(); } } }, '✕') : null
        ]));
      });
      govde.appendChild(ul);
    }
    govde.appendChild(ctx.el('p.sessiz.sy-not', 'Tarihler boş başlar; burada eklediğiniz ikinizde de görünür. En yakını mahallenin üstünde küçük bir yazıyla durur.'));
  }
  function ekle() {
    let tur = 'bulusma';
    const adG = ctx.el('input.girdi', { type: 'text', maxlength: '50', 'aria-label': 'Adı', value: TURLER.bulusma[1] });
    const tarih = ctx.el('input.girdi', { type: 'date', 'aria-label': 'Tarih' });
    const yillik = ctx.el('input', { type: 'checkbox', id: 'syYillik' });
    const yillikEt = ctx.el('label.sy-yillik', { for: 'syYillik' }, [yillik, ' Her yıl tekrar etsin']);
    const turSec = ctx.el('div.cipler', { role: 'radiogroup', 'aria-label': 'Ne için?' });
    Object.keys(TURLER).forEach(k => {
      const b = ctx.el('button.cip', { type: 'button', role: 'radio', 'aria-checked': k === tur ? 'true' : 'false', 'aria-selected': k === tur ? 'true' : 'false' }, TURLER[k][0] + ' ' + TURLER[k][1]);
      b.addEventListener('click', () => {
        const eskiAd = TURLER[tur][1]; tur = k; ctx.ses.tik();
        turSec.querySelectorAll('.cip').forEach(x => { const s = x === b; x.setAttribute('aria-checked', s); x.setAttribute('aria-selected', s); });
        if (!adG.value.trim() || adG.value === eskiAd || Object.values(TURLER).some(t => t[1] === adG.value)) adG.value = TURLER[k][1];
        yillik.checked = TURLER[k][2];
      });
      turSec.appendChild(b);
    });
    const kaydet = ctx.el('button.dugme.tam', { type: 'button' }, 'Kaydet');
    kaydet.addEventListener('click', () => {
      const a = A().kirp(adG.value, 50);
      if (!a) { ctx.toast('Bir ad yaz ✏️'); adG.focus(); return; }
      if (!A().tarihGecerli(tarih.value)) { ctx.toast('Bir tarih seç 📅'); tarih.focus(); return; }
      if (!yillik.checked && A().gunKaldi(tarih.value) < 0) { ctx.toast('Geçmiş bir gün; her yıl tekrar etsin mi? 🔁'); return; }
      const k = { id: CD.kimlik(), tur, ad: a, tarih: tarih.value, yillik: yillik.checked, t: Date.now() };
      A().benimEkle(ANAHTAR, k, 40);
      A().posta('sayac', { ad: a, tarih: tarih.value });
      ctx.sheetKapat(); ctx.ses.can && ctx.ses.can(); ctx.toast('Saat kulesi saymaya başladı ⏳'); ciz();
      CD.olay.yay('sayac:degisti');
    });
    ctx.sheet(ctx.el('div.dikey', [turSec, adG, ctx.el('label.sy-etiket', ['Tarih', tarih]), yillikEt, kaydet]), { baslik: 'Geri sayım ekle', odak: false });
  }

  (CD.postaTurleri = CD.postaTurleri || {}).sayac = {
    kart(o, y) { y.kart({ kim: y.kim, tur: 'sayac', baslik: y.A + ' yeni bir geri sayım kurdu ⏳', alt: A().kirp(o.v && o.v.ad, 40) + ' · ' + A().tarihUzun(o.v && o.v.tarih), eylem: { ad: 'Bak', fn: () => CD.ac(ID) } }); CD.olay.yay('sayac:degisti'); },
    ozet(l, A_) { return '⏳ ' + A_ + ' yeni bir geri sayım kurdu'; }
  };
  CD.sayac = { hepsi, enYakin, gunMetni };
  CD.mhIpucu[ID] = () => { const s = enYakin(); return s ? s.ad + ': ' + gunMetni(s.gun) : ''; };

  CD.kaydet({
    id: ID, baslik: 'Saat Kulesi', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el;
      govde = ctx.el('div.sy-govde');
      el.appendChild(ctx.el('div.icerik.sy-icerik', [govde]));
      ciz();
      cozucu = [CD.olay.dinle('senk:yenilendi', () => ctx && ciz())];
    },
    unmount() { clearInterval(saniyeT); saniyeT = 0; cozucu.forEach(f => { try { f(); } catch (e) {} }); cozucu = []; ctx = null; kok = null; govde = null; }
  });
})();
