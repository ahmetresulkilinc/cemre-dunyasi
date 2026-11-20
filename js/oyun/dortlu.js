/* js/oyun/dortlu.js — 4'lü Dizme (Oyun Salonu alt modülü · V2 Faz 2 · 5)
   7 sütun × 6 satır; taşlar yukarıdan düşer; yatay, dikey ya da çapraz 4 taş dizen kazanır.
   XOX ile aynı altyapı: tek ortak anahtar cd.oyun.dortlu (sıra tabanlı olduğu için ikisi aynı anda yazmaz; en yeni kazanır)
   + CD.oyunAg.durt ile anlık dürtme. Bulut kapalıysa aynı telefonda sırayla. */
(() => {
  'use strict';
  const OID = 'dortlu', ANAHTAR = 'oyun.dortlu', SUT = 7, SAT = 6;
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="10" width="52" height="44" rx="6" fill="var(--seker-gok,#A9D6F2)"/><g fill="var(--kagit,#FFFDF9)"><circle cx="17" cy="21" r="5"/><circle cx="32" cy="21" r="5"/><circle cx="47" cy="21" r="5"/><circle cx="17" cy="43" r="5"/></g><g fill="var(--seker-kiraz,#FF9DB4)"><circle cx="17" cy="32" r="5"/><circle cx="32" cy="43" r="5"/></g><g fill="var(--goz,#6F97AC)"><circle cx="32" cy="32" r="5"/><circle cx="47" cy="32" r="5"/><circle cx="47" cy="43" r="5"/></g></svg>';
  const A = () => CD.oyunAg;
  let ctx = null, kok = null, d = null;
  const ui = {}, cozler = [];

  const bos = () => Array(SUT * SAT).fill('');
  function varsayilan() { return { s: 1, tahta: bos(), sira: 'cemre', baslayan: 'cemre', kazanan: null, cizgi: null, skor: { cemre: 0, ahmet: 0, berabere: 0 }, no: 1, hamle: 0, son: null, t: 0 }; }
  function temizle(g) {
    const v = Object.assign(varsayilan(), g && typeof g === 'object' ? g : {});
    if (!Array.isArray(v.tahta) || v.tahta.length !== SUT * SAT) v.tahta = bos();
    v.tahta = v.tahta.map(h => (h === 'cemre' || h === 'ahmet') ? h : '');
    if (v.sira !== 'ahmet') v.sira = 'cemre';
    if (v.baslayan !== 'ahmet') v.baslayan = 'cemre';
    if (['cemre', 'ahmet', 'berabere'].indexOf(v.kazanan) < 0) v.kazanan = null;
    v.skor = Object.assign({ cemre: 0, ahmet: 0, berabere: 0 }, v.skor || {});
    v.no = Number(v.no) || 1; v.hamle = v.tahta.filter(Boolean).length;
    if (!Array.isArray(v.cizgi)) v.cizgi = null;
    return v;
  }
  const oku = () => temizle(CD.depo.al(ANAHTAR, null));
  const yeniMi = (a, b) => a.no > b.no || (a.no === b.no && a.hamle > b.hamle) || (a.no === b.no && a.hamle === b.hamle && (a.t || 0) > (b.t || 0));
  function kazananBul(t) {
    const yon = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let y = 0; y < SAT; y++) for (let x = 0; x < SUT; x++) {
      const k = t[y * SUT + x]; if (!k) continue;
      for (const [dx, dy] of yon) {
        const c = [y * SUT + x]; let i = 1;
        for (; i < 4; i++) { const nx = x + dx * i, ny = y + dy * i; if (nx < 0 || nx >= SUT || ny < 0 || ny >= SAT || t[ny * SUT + nx] !== k) break; c.push(ny * SUT + nx); }
        if (i === 4) return { kim: k, cizgi: c };
      }
    }
    return null;
  }
  const tas = (kim) => '<span class="oyun-tas oyun-tas-' + kim + '" aria-hidden="true">' + (kim === 'cemre' ? '🎀' : '💙') + '</span>';

  function kur(el) {
    const e = ctx.el;
    ui.durum = e('p.baslik.baslik-lg.oyun-durum', { role: 'status', 'aria-live': 'polite' });
    ui.alt = e('p.sessiz.oyun-durum-alt');
    ui.izgara = e('div.dortlu-izgara', { 'aria-hidden': 'true' });
    ui.hucre = [];
    for (let i = 0; i < SUT * SAT; i++) { const h = e('span.dortlu-hucre'); ui.hucre.push(h); ui.izgara.appendChild(h); }
    ui.sutunlar = e('div.dortlu-sutunlar', { role: 'group', 'aria-label': "4'lü dizme sütunları" });
    ui.sutun = [];
    for (let x = 0; x < SUT; x++) {
      const b = e('button.dortlu-sutun', { type: 'button', onclick: () => at(x) });
      b.addEventListener('keydown', (ev) => { const n = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (n) { ev.preventDefault(); const h = ui.sutun[(x + n + SUT) % SUT]; if (h) h.focus(); } });
      ui.sutun.push(b); ui.sutunlar.appendChild(b);
    }
    ui.skor = e('p.oyun-skor');
    el.appendChild(e('div.icerik.oyun-icerik', [
      e('div.yama.oyun-durum-kart', [ui.durum, ui.alt]),
      e('div.dortlu-tahta', [ui.izgara, ui.sutunlar]),
      e('div.yama.siki.oyun-skor-kart', [ui.skor])
    ]));
  }
  function satirBul(t, x) { for (let y = SAT - 1; y >= 0; y--) if (!t[y * SUT + x]) return y; return -1; }

  function ciz(yeniIndeks) {
    if (!ctx || !d) return;
    const b = A().ben(), tek = A().tek();
    d.tahta.forEach((k, i) => {
      const h = ui.hucre[i];
      if ((h.dataset.k || '') !== k) {
        h.dataset.k = k; h.innerHTML = k ? tas(k) : '';
        if (k && i === yeniIndeks && !ctx.azHareket) { h.style.setProperty('--dus', (Math.floor(i / SUT) + 1)); h.classList.remove('dusuyor'); void h.offsetWidth; h.classList.add('dusuyor'); }
      }
      h.classList.toggle('vurgu', !!(d.cizgi && d.cizgi.indexOf(i) >= 0));
      h.classList.toggle('son', !!(d.son && d.son.i === i && !d.kazanan));
    });
    const kilit = !!d.kazanan || !A().oynayabilir(d.sira);
    ui.sutun.forEach((s, x) => {
      const dolu = satirBul(d.tahta, x) < 0;
      s.setAttribute('aria-disabled', kilit || dolu ? 'true' : 'false');
      s.setAttribute('aria-label', (x + 1) + '. sütuna taş at' + (dolu ? ' (dolu)' : ''));
    });
    let m = '', a = '';
    if (d.kazanan === 'berabere') { m = 'Berabere 🤝'; a = 'Tahta doldu. Yeni oyun?'; }
    else if (d.kazanan) { m = tek ? A().adi(d.kazanan) + ' kazandı! 🎉' : (d.kazanan === b ? 'Kazandın! 🎉' : A().adi(d.kazanan) + ' kazandı 💫'); a = 'Rövanş için yeni oyuna bas.'; }
    else if (tek) { m = 'Sıra ' + A().adi(d.sira) + A().ek(d.sira) + ' ' + (d.sira === 'cemre' ? '🎀' : '💙'); a = 'Bir sütuna dokun, taş düşsün.'; }
    else if (d.sira === b) { m = 'Sıra sende!'; a = d.son ? A().adi(d.son.kim) + ' ' + (d.son.x + 1) + '. sütuna attı.' : 'İlk taş senin.'; }
    else { m = 'Sıra ' + A().adi(d.sira) + A().ek(d.sira); a = 'O atınca burada belirir 💫'; }
    ui.durum.textContent = m; ui.alt.textContent = a;
    ui.skor.textContent = '🎀 ' + A().adi('cemre') + ' ' + d.skor.cemre + ' · 🤝 ' + d.skor.berabere + ' · 💙 ' + A().adi('ahmet') + ' ' + d.skor.ahmet;
  }
  function at(x) {
    if (!ctx) return;
    const g = oku(); if (yeniMi(g, d)) d = g;
    if (d.kazanan) { ctx.ses.uf(); ctx.toast('Bu oyun bitti. Yeni oyuna basalım mı?'); return; }
    if (!A().oynayabilir(d.sira)) { ctx.ses.uf(); ctx.toast('Sıra ' + A().adi(d.sira) + A().ek(d.sira) + '; o atınca burada belirir 💫', 2400); return; }
    const y = satirBul(d.tahta, x);
    if (y < 0) { ctx.ses.uf(); ctx.toast('Bu sütun dolu, başkasını seç'); return; }
    const i = y * SUT + x, kim = d.sira;
    d.tahta[i] = kim; d.hamle++; d.son = { kim, x, i, t: Date.now() }; d.t = Date.now();
    const s = kazananBul(d.tahta);
    if (s) { d.kazanan = s.kim; d.cizgi = s.cizgi; d.skor[s.kim]++; }
    else if (d.tahta.every(Boolean)) { d.kazanan = 'berabere'; d.skor.berabere++; }
    else d.sira = A().rakip(kim);
    if (d.kazanan) CD.pul && CD.pul('oyun', { kisa: 'dortlu', kazanan: d.kazanan });
    CD.depo.yaz(ANAHTAR, d);
    CD.depo.yaz('cihaz.dortlu.gorulen', d.hamle + ':' + d.no);
    ciz(i);
    ctx.ses.blop();
    const m = ctx.efekt.merkez(ui.hucre[i]);
    if (d.kazanan && d.kazanan !== 'berabere') { ctx.ses.zafer(); ctx.efekt.konfeti(m.x, m.y, 16); }
    else ctx.efekt.toz(m.x, m.y + 10, 3);
    A().durt(OID, d);
    if (!A().tek()) A().posta(OID, d.kazanan ? (d.kazanan === 'berabere' ? 'berabere bitti' : A().adi(d.kazanan) + ' kazandı') : 'sıra sende');
  }
  async function yeniOyun() {
    const g = oku(); if (yeniMi(g, d)) d = g;
    if (!d.kazanan && d.hamle && !(await ctx.onayla('Oyun sürüyor. Sıfırdan başlansın mı?', 'Yeni oyun', 'Devam edeyim'))) return;
    if (!ctx) return;
    const bas = A().rakip(d.baslayan);
    d = Object.assign(temizle(d), { tahta: bos(), sira: bas, baslayan: bas, kazanan: null, cizgi: null, son: null, no: d.no + 1, hamle: 0, t: Date.now() });
    CD.depo.yaz(ANAHTAR, d); ciz();
    ctx.ses.pop(); ctx.toast(A().adi(bas) + ' başlıyor ' + (bas === 'cemre' ? '🎀' : '💙'));
    A().durt(OID, d);
  }
  function gelen(g) {
    if (!ctx || !g) return;
    g = temizle(g);
    if (!yeniMi(g, d)) return;
    const oncekiNo = d.no; d = g;
    ciz(d.son && d.son.kim !== A().ben() ? d.son.i : -1);
    if (d.son && d.son.kim !== A().ben() && oncekiNo === d.no) {
      const izi = d.hamle + ':' + d.no;
      if (CD.depo.al('cihaz.dortlu.gorulen', '') !== izi) { CD.depo.yaz('cihaz.dortlu.gorulen', izi); ctx.ses.pop(); if (!d.kazanan) ctx.toast(A().adi(d.son.kim) + ' attı; sıra sende 💫'); else if (d.kazanan !== 'berabere') ctx.toast(A().adi(d.kazanan) + ' kazandı 💫'); }
    }
  }

  (CD.oyunlar = CD.oyunlar || {})[OID] = {
    id: OID, ad: "4'lü Dizme", aciklama: 'Taşları düşür, dördünü yan yana getir.', sira: 2, ikon: IKON,
    siraSende() { const g = oku(); return !!(g.hamle || g.no > 1) && !g.kazanan && g.sira === A().ben(); },
    durum() { const g = oku(); if (g.kazanan === 'berabere') return 'Son oyun berabere'; if (g.kazanan) return 'Son oyunu ' + A().adi(g.kazanan) + ' kazandı'; return g.hamle ? 'Sıra ' + A().adi(g.sira) + A().ek(g.sira) : ''; },
    mount(el, c) {
      ctx = c; kok = el; d = oku();
      kur(el); ciz();
      ctx.altbar([{ id: 'yeni', ad: 'Yeni oyun', ikon: '🔄', birincil: true, tikla() { yeniOyun(); } }]);
      cozler.push(A().dinle(OID, gelen));
      cozler.push(ctx.olay.dinle('senk:yenilendi', () => gelen(oku())));
      cozler.push(ctx.olay.dinle('kim', () => ciz()));
      const t = setInterval(() => { if (!document.hidden && A().bulut()) CD.senk.simdi(); }, 15000); cozler.push(() => clearInterval(t));
    },
    unmount() {
      while (cozler.length) { try { cozler.pop()(); } catch (e) {} }
      Object.keys(ui).forEach(k => delete ui[k]);
      ctx = null; kok = null; d = null;
    }
  };
})();
