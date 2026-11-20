/* js/bolum/plak.js — Plak Dükkanı: ortak çalma listesi + "şu an dinliyorum" (V2 Faz 3 · 5)
   - "Şu an dinliyorum" Faz 2'deki CD.dinliyor (paylas.js) ile aynı: burada onun son paylaştığı görünür, kendi paylaşımın buradan da açılır.
   - Ortak liste: cd.plak.<kim> [{ id, ad, link, t }] (kişi kendi anahtarına yazar, en çok 100). Yalnız https Spotify/YouTube linki
     (CD.dinliyor.linkDenetle). Kimin eklediği küçük pixel kafa ikonuyla görünür; satıra tek dokunuş linki açar. */
(() => {
  'use strict';
  const ID = 'plak';
  const A = () => CD.ani;
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="var(--murekkep-2,#5D5566)"/><circle cx="32" cy="32" r="16" fill="none" stroke="var(--kagit-3,#EDE3DC)" stroke-width="2" opacity=".5"/><circle cx="32" cy="32" r="8" fill="var(--seker-kiraz,#FF9DB4)"/><circle cx="32" cy="32" r="2.5" fill="var(--kagit,#FFFDF9)"/></svg>';
  const ANAHTAR = 'plak';
  let ctx = null, kok = null, govde = null, cozucu = [];
  const ad = (k) => CD.kimAdi(k);
  const denetle = (l) => (CD.dinliyor && CD.dinliyor.linkDenetle) ? CD.dinliyor.linkDenetle(l) : null;
  const kaynak = (l) => /spotify/i.test(l) ? 'Spotify' : 'YouTube';
  const kaynakSvg = (l) => /spotify/i.test(l)
    ? A().pixel(['.GGGG.', 'GKKKKG', 'GGGGGG', 'GKKKGG', 'GGGGGG', '.GGGG.'], { G: '#1DB954', K: '#0B3D1E' }, 'pk-kaynak-svg')
    : A().pixel(['RRRRRR', 'RRWRRR', 'RRWWRR', 'RRWRRR', 'RRRRRR'], { R: '#E8453C', W: '#FFFFFF' }, 'pk-kaynak-svg');
  function ac(link) {
    const l = denetle(link); if (!l) return;
    try { const w = window.open(l, '_blank', 'noopener,noreferrer'); if (w) w.opener = null; } catch (e) {}
  }

  function ciz() {
    if (!ctx || !govde) return;
    govde.innerHTML = '';
    // şu an
    const dn = CD.dinliyor ? CD.dinliyor.onun() : null, karsi = A().karsi();
    const simdi = ctx.el('section.yama.pk-simdi', { 'aria-label': 'Şu an dinleniyor' }, [
      ctx.el('div.pk-plak' + (dn && !ctx.azHareket ? '.donuyor' : ''), { 'aria-hidden': 'true', html: IKON }),
      ctx.el('div.pk-simdi-metin', dn
        ? [ctx.el('span.sessiz', ad(karsi) + ' şu an dinliyor'), ctx.el('strong', A().kirp(dn.not, 80) || kaynak(dn.link))]
        : [ctx.el('span.sessiz', 'Şu an'), ctx.el('strong', karsi && A().aktif() ? ad(karsi) + ' bir şey paylaşmadı' : 'Sessiz')]),
      dn ? ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => { ctx.ses.tik(); CD.dinliyor.ac(dn); } }, 'Aç') : null
    ]);
    govde.append(simdi,
      ctx.el('div.izgara-2.pk-eylemler', [
        ctx.el('button.dugme-ikincil', { type: 'button', disabled: !A().aktif(), onclick: () => CD.dinliyor && CD.dinliyor.sayfa() }, '🎧 Şu an dinliyorum'),
        ctx.el('button.dugme', { type: 'button', onclick: () => A().kimIste(ekle) }, '➕ Listeye şarkı')
      ]));
    const l = A().ikisi(ANAHTAR).filter(s => denetle(s.link)).sort((a, b) => b.t - a.t);
    govde.appendChild(ctx.el('h2.pk-baslik', 'Bizim listemiz' + (l.length ? ' · ' + l.length + ' şarkı' : '')));
    if (!l.length) { govde.appendChild(ctx.el('div.bos-durum.pk-bos', [ctx.el('div.buyuk', '💿'), ctx.el('p', 'Liste boş. İlk şarkıyı sen ekle; o da kendi favorisini koysun.')])); return; }
    const ul = ctx.el('ul.pk-liste');
    l.forEach(s => ul.appendChild(ctx.el('li.pk-satir', { data: { kim: s.kim } }, [
      ctx.el('button.pk-sarki', { type: 'button', 'aria-label': A().kirp(s.ad, 60) + ', ' + ad(s.kim) + ' ekledi. ' + kaynak(s.link) + ' ile aç', onclick: () => { ctx.ses.tik(); ac(s.link); } }, [
        A().kisiIkon(s.kim, 18),
        ctx.el('span.pk-sarki-ad', A().kirp(s.ad, 60)),
        ctx.el('span.pk-kaynak', { 'aria-hidden': 'true', html: kaynakSvg(s.link) })
      ]),
      s.kim === A().ben() ? ctx.el('button.dugme-ikon.pk-sil', { type: 'button', 'aria-label': A().kirp(s.ad, 40) + ' şarkısını listeden çıkar', onclick: async () => { if (await ctx.onayla('"' + A().kirp(s.ad, 40) + '" listeden çıksın mı?', 'Çıkar', 'Kalsın')) { A().benimSil(ANAHTAR, s.id); ciz(); } } }, '✕') : null
    ])));
    govde.appendChild(ul);
  }
  function ekle() {
    const adG = ctx.el('input.girdi', { type: 'text', maxlength: '60', placeholder: 'Şarkının adı', 'aria-label': 'Şarkının adı' });
    const link = ctx.el('input.girdi', { type: 'url', inputmode: 'url', autocomplete: 'off', placeholder: 'https://open.spotify.com/… ya da YouTube', 'aria-label': 'Spotify ya da YouTube linki' });
    const hata = ctx.el('p.sessiz', { role: 'status' }, 'Spotify ya da YouTube linkini yapıştır.');
    const k = ctx.el('button.dugme.tam', { type: 'button' }, '💿 Listeye ekle');
    k.addEventListener('click', () => {
      const a = A().kirp(adG.value, 60), l = denetle(link.value);
      if (!a) { hata.textContent = 'Şarkının adını yaz.'; adG.focus(); return; }
      if (!l) { hata.textContent = 'Yalnız https ile başlayan Spotify ya da YouTube linki olur.'; link.focus(); return; }
      A().benimEkle(ANAHTAR, { id: CD.kimlik(), ad: a, link: l, t: Date.now() }, 100);
      A().posta('sarki', { ad: a });
      A().pul('sarki', a);
      ctx.sheetKapat(); ctx.ses.parilti(); ctx.toast('Listeye eklendi 💿'); ciz();
    });
    ctx.sheet(ctx.el('div.dikey', [adG, link, hata, k]), { baslik: 'Listeye şarkı ekle', odak: false });
  }

  (CD.postaTurleri = CD.postaTurleri || {}).sarki = {
    kart(o, y) { y.kart({ kim: y.kim, tur: 'sarki', baslik: y.A + ' listemize bir şarkı ekledi 💿', alt: A().kirp(o.v && o.v.ad, 60), eylem: { ad: 'Liste', fn: () => CD.ac(ID) } }); if (CD.aktifBolum && CD.aktifBolum() === ID) setTimeout(ciz, 1500); },
    ozet(l, A_) { return '💿 ' + A_ + ' listemize ' + (l.length > 1 ? l.length + ' şarkı' : 'bir şarkı') + ' ekledi'; }
  };
  CD.mhIpucu[ID] = () => { const n = A().ikisi(ANAHTAR).length; return n ? n + ' şarkılık listemiz 💿' : ''; };

  CD.kaydet({
    id: ID, baslik: 'Plak Dükkanı', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el;
      govde = ctx.el('div.pk-govde');
      el.appendChild(ctx.el('div.icerik.pk-icerik', [govde]));
      ciz();
      cozucu = [CD.olay.dinle('senk:yenilendi', () => ctx && ciz()), CD.olay.dinle('dinliyor:degisti', () => ctx && ciz())];
    },
    unmount() { cozucu.forEach(f => { try { f(); } catch (e) {} }); cozucu = []; ctx = null; kok = null; govde = null; }
  });
})();
