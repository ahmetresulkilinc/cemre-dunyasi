/* js/bolum/ozel.js — Ahmet'in unutma sayfası (V2 Faz 3 · 6), bölüm id'si 'ozel'
   - YALNIZ CD.kim()==='ahmet' olan cihazda yüklenir (kilit.js / mahalle.js) ve mahallede görünür; Cemre'nin cihazında hiç yüklenmez.
   - Binanın adı, açıklaması, çizimi ve renkleri de bu dosyada (CD.mhEkBinalar); Cemre'nin yüklediği dosyalarda adı geçmez.
   - Veri YALNIZ bu cihazda: cd.cihaz.ozel.veri (+ isteğe bağlı PIN: cd.cihaz.ozel.pin). 'cihaz.' öneki senk.js ATLA
     listesinde → buluta hiç gitmez; genel yedeğe de girmez. Telefon değişince kaybolmasın diye kendi JSON yedeği var.
   - Bu bölüm açıkken karşı telefona "şu an … içinde" bilgisi gitmez: varlik.js SESSIZ_YER listesinde (yer 'mahalle' görünür).
   - Stiller bu dosyadan basılır (index.html'de ayrı bir css bağlantısı yok). */
(() => {
  'use strict';
  const ID = 'ozel';
  const VERI = 'cihaz.ozel.veri', PIN = 'cihaz.ozel.pin';
  // mahalle binası (El Ele Bankı'nın yanına; yalnız Ahmet'in telefonunda kurulur)
  (window.CD.mhEkBinalar = window.CD.mhEkBinalar || []).push({ id: ID, yalniz: 'ahmet', teras: 'elele', ad: 'Unutma Kulübesi',
    aciklama: 'Sevdikleri, ölçüler, hediye fikirleri. Yalnız bu telefonda.',
    renk: { C: 'un-cati', D: 'un-duvar', Y: 'un-sari', G: 'un-yesil', B: 'un-mavi', R: 'un-kapi' }, satir: [
      '......CCCC......', '....CCCCCCCC....', '..CCCCCCCCCCCC..', '.CCCCCCCCCCCCCC.', '..DDDDDDDDDDDD..', '..DYYDGGDDRRRD..', '..DYYDGGDDRRRD..',
      '..DDDDDDDDRRRD..', '..DBBDDDDDRRoD..', '..DBBDDDDDRRRD..', '..DDDDDDDDRRRD..', '..DDDDDDDDRRRD..', '..DDDDDDDDRRRD..', 'ZZZZZZZZZZZZZZZZ'] });
  (function binaRenkleri() {
    const st = document.createElement('style');
    st.textContent = ':root{--bd-un-cati:#7CCB9A;--bd-un-duvar:#FFF6DA;--bd-un-sari:#FFE28A;--bd-un-yesil:#9FE3C4;--bd-un-mavi:#A9D6F2;--bd-un-kapi:#5FAF7E}';
    document.head.appendChild(st);
  })();
  const BOLUMLER = [
    ['sever', '💗 Sevdikleri', 'Örn. beyaz lilyum, çilekli dondurma'],
    ['olcu', '📏 Ölçüler', ''],
    ['sevmez', '🙅 Sevmedikleri', 'Örn. çok acı yemek'],
    ['hediye', '🎁 Hediye fikirleri', 'Örn. o kitapçıda baktığı kitap']
  ];
  const OLCU_ORNEK = ['Yüzük', 'Ayakkabı', 'Üst beden', 'Alt beden', 'Bilezik'];
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="10" width="40" height="46" rx="4" fill="#FFE9A8" stroke="#5D5566" stroke-width="3"/><path d="M20 24h24M20 32h24M20 40h14" stroke="#5D5566" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="44" r="6" fill="#FF9DB4"/></svg>';
  const STIL = `
.un-icerik{display:flex;flex-direction:column;gap:var(--b-4)}
.un-ust{display:flex;align-items:center;justify-content:space-between;gap:var(--b-2)}
.un-not{margin:0;color:var(--sessiz);font-size:var(--punto-sm)}
.un-kart{display:flex;flex-direction:column;gap:var(--b-2)}
.un-kart h2{margin:0;font-family:var(--yazi-baslik);font-size:var(--punto-lg);color:var(--murekkep)}
.un-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.un-satir{display:flex;align-items:center;gap:var(--b-2);min-height:var(--dokunma-min);padding:4px 4px 4px var(--b-3);border-radius:var(--r-sm);background:var(--kagit-2)}
.un-satir span{flex:1;min-width:0;overflow-wrap:anywhere}
.un-satir strong{flex:none;max-width:45%;overflow-wrap:anywhere}
.un-ekle{display:flex;gap:var(--b-2);flex-wrap:wrap}
.un-ekle .girdi{flex:1 1 100px;min-width:0}
.un-ekle .dugme-ikincil{flex:none}
.un-pin{display:flex;flex-direction:column;align-items:center;gap:var(--b-4);padding:var(--b-6) 0}
.un-pin-noktalar{display:flex;gap:12px}
.un-pin-noktalar i{width:16px;height:16px;border-radius:50%;border:2px solid var(--murekkep-2);display:block}
.un-pin-noktalar i.dolu{background:var(--murekkep-2)}
.un-tus{display:grid;grid-template-columns:repeat(3,64px);gap:10px}
.un-tus button{height:56px;border-radius:var(--r-md);background:var(--kagit);box-shadow:var(--golge-yastik-ic);font-family:var(--yazi-sayi);font-size:var(--punto-xl);color:var(--murekkep)}
.un-tus button:focus-visible{outline:3px solid var(--odak);outline-offset:2px}
.un-hata{min-height:1.4em;margin:0;color:var(--ofke);font-weight:var(--kalin-vurgu)}
@media (prefers-reduced-motion:reduce){.un-pin *{transition:none!important;animation:none!important}}`;
  let ctx = null, kok = null, acikOturum = false, stilEl = null;

  /* ---------------------------------------------------------------- veri */
  const bos = () => ({ sever: [], olcu: [], sevmez: [], hediye: [] });
  function oku() {
    const v = CD.depo.al(VERI, null); const o = bos();
    if (v && typeof v === 'object') Object.keys(o).forEach(k => { if (Array.isArray(v[k])) o[k] = v[k].filter(x => x && x.id && typeof x.metin === 'string').slice(0, 200); });
    return o;
  }
  const yaz = (o) => CD.depo.yaz(VERI, o);
  const kirp = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

  /* ---------------------------------------------------------------- PIN (özet saklanır, PIN değil) */
  async function ozet(pin, tuz) {
    const metin = tuz + '|' + pin + '|unutma';
    try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metin)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } } catch (e) {}
    let h = 2166136261; for (let i = 0; i < metin.length; i++) { h ^= metin.charCodeAt(i); h = Math.imul(h, 16777619); } return 'f' + (h >>> 0).toString(16);
  }
  const pinVar = () => { const p = CD.depo.al(PIN, null); return !!(p && p.ozet && p.tuz); };
  function pinEkrani(amac, bitince) {
    // amac: 'gir' | 'kur' | 'tekrar'
    kok.innerHTML = '';
    let girilen = '', ilk = '';
    const noktalar = ctx.el('div.un-pin-noktalar', { 'aria-hidden': 'true' }, [0, 1, 2, 3].map(() => ctx.el('i')));
    const baslik = ctx.el('p.kalin', amac === 'gir' ? 'PIN\'ini gir' : 'Yeni 4 haneli PIN');
    const hata = ctx.el('p.un-hata', { role: 'status', 'aria-live': 'polite' });
    const canli = ctx.el('span.gorsel-gizli', { 'aria-live': 'polite' });
    const goster = () => { noktalar.querySelectorAll('i').forEach((x, i) => x.classList.toggle('dolu', i < girilen.length)); canli.textContent = girilen.length + ' hane'; };
    const tamam = async () => {
      if (amac === 'gir') {
        const p = CD.depo.al(PIN, null);
        if (p && await ozet(girilen, p.tuz) === p.ozet) { acikOturum = true; bitince(); return; }
        hata.textContent = 'Olmadı, tekrar dene'; girilen = ''; goster(); ctx.efekt.sarsinti(noktalar, 1); return;
      }
      if (!ilk) { ilk = girilen; girilen = ''; baslik.textContent = 'Aynı PIN\'i bir daha gir'; goster(); return; }
      if (ilk !== girilen) { hata.textContent = 'İkisi tutmadı; baştan'; ilk = ''; girilen = ''; baslik.textContent = 'Yeni 4 haneli PIN'; goster(); return; }
      const tuz = CD.kimlik();
      CD.depo.yaz(PIN, { tuz, ozet: await ozet(girilen, tuz) });
      acikOturum = true; ctx.toast('PIN kuruldu 🔒'); bitince();
    };
    const bas = (r) => { ctx.ses.tik(); hata.textContent = ''; if (r === 'sil') girilen = girilen.slice(0, -1); else if (girilen.length < 4) girilen += r; goster(); if (girilen.length === 4) setTimeout(tamam, 120); };
    const tus = ctx.el('div.un-tus', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'sil'].map(r => r ? ctx.el('button', { type: 'button', 'aria-label': r === 'sil' ? 'Son haneyi sil' : r, onclick: () => bas(r) }, r === 'sil' ? '⌫' : r) : ctx.el('span')));
    const klavye = (e) => { if (!kok || !kok.querySelector('.un-pin')) { document.removeEventListener('keydown', klavye); return; } if (/^[0-9]$/.test(e.key)) bas(e.key); else if (e.key === 'Backspace') bas('sil'); };
    document.addEventListener('keydown', klavye);
    kok.appendChild(ctx.el('div.icerik', [ctx.el('div.un-pin', [ctx.el('div.buyuk', { 'aria-hidden': 'true' }, '🔒'), baslik, noktalar, canli, tus, hata,
      amac !== 'gir' ? ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { document.removeEventListener('keydown', klavye); ciz(); } }, 'Vazgeç') : null])]));
    setTimeout(() => { const b = tus.querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 60);
  }

  /* ---------------------------------------------------------------- sayfa */
  function ciz() {
    if (!ctx || !kok) return;
    if (pinVar() && !acikOturum) { pinEkrani('gir', ciz); return; }
    kok.innerHTML = '';
    const v = oku();
    const kartlar = BOLUMLER.map(([k, baslik, yer]) => {
      const ul = ctx.el('ul.un-liste');
      v[k].forEach(x => ul.appendChild(ctx.el('li.un-satir', [
        k === 'olcu' ? ctx.el('strong', kirp(x.ad, 30)) : null,
        ctx.el('span', kirp(x.metin, 200)),
        ctx.el('button.dugme-ikon', { type: 'button', 'aria-label': 'Sil: ' + kirp(x.ad ? x.ad + ' ' + x.metin : x.metin, 60), onclick: () => { const o = oku(); o[k] = o[k].filter(y => y.id !== x.id); yaz(o); ciz(); } }, '✕')
      ])));
      const metin = ctx.el('input.girdi', { type: 'text', maxlength: '200', placeholder: k === 'olcu' ? 'Ölçü (örn. 52)' : yer, 'aria-label': baslik.replace(/^\S+\s/, '') + ' için yeni satır' });
      const olcuAd = k === 'olcu' ? ctx.el('input.girdi', { type: 'text', maxlength: '30', placeholder: 'Ne? (örn. Yüzük)', 'aria-label': 'Ölçünün adı', list: 'unOlcuOneri' }) : null;
      const ekle = () => {
        const m = kirp(metin.value, 200); if (!m) { metin.focus(); return; }
        const o = oku(); const kayit = { id: CD.kimlik(), metin: m, t: Date.now() };
        if (olcuAd) { const a = kirp(olcuAd.value, 30); if (!a) { olcuAd.focus(); return; } kayit.ad = a; }
        o[k].push(kayit); yaz(o); ctx.ses.blop && ctx.ses.blop(); ciz();
        setTimeout(() => { const g = kok && kok.querySelector('[data-un="' + k + '"] .un-ekle .girdi'); if (g) g.focus(); }, 30);
      };
      metin.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ekle(); } });
      return ctx.el('section.yama.un-kart', { data: { un: k } }, [ctx.el('h2', baslik), v[k].length ? ul : ctx.el('p.un-not', 'Henüz boş.'),
        ctx.el('div.un-ekle', [olcuAd, metin, ctx.el('button.dugme-ikincil', { type: 'button', onclick: ekle }, 'Ekle')])]);
    });
    kok.appendChild(ctx.el('div.icerik.un-icerik', [
      ctx.el('div.un-ust', [ctx.el('p.un-not', 'Bu sayfa yalnız bu telefonda durur; buluta ve karşı telefona hiç gitmez.'), ctx.el('button.dugme-ikon', { type: 'button', 'aria-label': 'Unutma sayfası ayarları', onclick: ayarlar }, '⚙️')]),
      ctx.el('datalist#unOlcuOneri', OLCU_ORNEK.map(o => ctx.el('option', { value: o })))
    ].concat(kartlar)));
  }
  function ayarlar() {
    const govde = [
      ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { ctx.sheetKapat(); setTimeout(() => pinEkrani('kur', ciz), 340); } }, pinVar() ? '🔒 PIN\'i değiştir' : '🔒 4 haneli PIN kur'),
      pinVar() ? ctx.el('button.dugme-hayalet.tam', { type: 'button', onclick: async () => { ctx.sheetKapat(); await CD.bekle(340); if (await ctx.onayla('PIN kaldırılsın mı? Sayfa PIN\'siz açılır.', 'Kaldır', 'Kalsın')) { CD.depo.sil(PIN); ctx.toast('PIN kaldırıldı'); } } }, 'PIN\'i kaldır') : null,
      ctx.el('hr.mh-ayrac'),
      ctx.el('p.sessiz', 'Telefon değişince kaybolmasın: yedeği indir, yeni telefonda yükle. Dosyayı kimseyle paylaşma.'),
      ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: yedekIndir }, '💾 Yedeği indir'),
      ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: yedekYukle }, '📂 Yedeği yükle')
    ].filter(Boolean);
    ctx.sheet(ctx.el('div.dikey', govde), { baslik: 'Unutma sayfası ayarları' });
  }
  function yedekIndir() {
    const json = JSON.stringify({ site: 'cemre-dunyasi-unutma', surum: 1, tarih: new Date().toISOString(), veri: oku() }, null, 1);
    const blob = new Blob([json], { type: 'application/json' });
    const u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = 'unutma-yedek-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000);
    ctx.sheetKapat(); ctx.toast('Yedek indirildi 💾');
  }
  function yedekYukle() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json'; inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f || !ctx) return;
      let o = null; try { o = JSON.parse(await f.text()); } catch (e) {}
      if (!o || o.site !== 'cemre-dunyasi-unutma' || !o.veri || typeof o.veri !== 'object') { ctx.toast('Bu dosya unutma yedeği değil'); return; }
      ctx.sheetKapat(); await CD.bekle(340);
      const birlestir = await ctx.onayla('Yedekteki satırlar bu sayfadakilere eklensin mi? (aynı satırlar iki kez yazılmaz)', 'Ekle', 'Vazgeç');
      if (!birlestir || !ctx) return;
      const mevcut = oku();
      Object.keys(mevcut).forEach(k => {
        const gelen = Array.isArray(o.veri[k]) ? o.veri[k] : [];
        const idler = new Set(mevcut[k].map(x => x.id));
        gelen.forEach(x => { if (x && typeof x.metin === 'string' && !idler.has(x.id)) mevcut[k].push({ id: String(x.id || CD.kimlik()).slice(0, 40), metin: kirp(x.metin, 200), ad: x.ad ? kirp(x.ad, 30) : undefined, t: Number(x.t) || Date.now() }); });
      });
      yaz(mevcut); ctx.toast('Yedek yüklendi 💗'); ciz();
    });
    inp.click();
  }

  CD.kaydet({
    id: ID, baslik: 'Unutmalar', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el; acikOturum = false;
      if (CD.kim() !== 'ahmet') { kok.innerHTML = ''; setTimeout(() => CD.ac(''), 0); return; }
      stilEl = document.createElement('style'); stilEl.textContent = STIL; document.head.appendChild(stilEl);
      ciz();
    },
    unmount() { acikOturum = false; if (stilEl) { stilEl.remove(); stilEl = null; } ctx = null; kok = null; }
  });
})();
