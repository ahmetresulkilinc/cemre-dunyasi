/* js/oyun/amiral.js — Amiral Battı (Oyun Salonu alt modülü · V2 Faz 2 · 5)
   8×8 deniz, gemiler 4-3-3-2. GEMİ YERLEŞİMİ KARŞIYA HİÇ GİTMEZ:
     cihaz.amiral.gemi = { mac, gemiler }      ← yalnız bu telefonda (senk "cihaz." anahtarlarını buluta göndermez)
     cd.oyun.amiral.<kim> = { mac, hazir, atis:[…], cevap:{ hücre: 'v'|'i'|'b' }, batan:[[…]], yenildi, baslayan, galibiyet, t }   (kişi yalnız kendi anahtarına yazar)
   Atış yapan yalnız hücreyi yazar; sonucu (vurdu/ıska/battı) gemilerin sahibi olan telefon hesaplayıp KENDİ anahtarına yazar.
   Sıra atış sayısıyla belirlenir (dönüşümlü). Bulut kapalıysa aynı telefonda, aradaki "telefonu ver" perdesiyle oynanır. */
(() => {
  'use strict';
  const OID = 'amiral', N = 8, GEMILER = [4, 3, 3, 2];
  const GEMI = 'cihaz.amiral.gemi', TEK = 'cihaz.amiral.tek', KUTLANAN = 'cihaz.amiral.kutlanan';
  const HARF = 'ABCDEFGH';
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M4 46c6 4 10 4 14 0s10-4 14 0 10 4 14 0 10-4 14 0v10H4Z" fill="var(--goz,#6F97AC)"/><path d="M12 40h40l-6 8H18Z" fill="var(--murekkep-2,#5D5566)"/><rect x="22" y="28" width="18" height="12" rx="2" fill="var(--kagit,#FFFDF9)"/><path d="M31 10v18" stroke="var(--murekkep-2,#5D5566)" stroke-width="3"/><path d="M31 11l12 6-12 5Z" fill="var(--seker-kiraz,#FF9DB4)"/></svg>';
  const A = () => CD.oyunAg;
  let ctx = null, kok = null;
  const ui = {}, cozler = [];
  let perdeT = 0;

  const anahtar = (k) => 'oyun.amiral.' + k;
  function temizS(v) {
    v = v && typeof v === 'object' ? v : {};
    const atis = Array.isArray(v.atis) ? v.atis.map(Number).filter(i => i >= 0 && i < N * N) : [];
    const cevap = {}; if (v.cevap && typeof v.cevap === 'object') Object.keys(v.cevap).forEach(i => { if (['v', 'i', 'b'].indexOf(v.cevap[i]) >= 0) cevap[i] = v.cevap[i]; });
    return { mac: typeof v.mac === 'string' ? v.mac : '', hazir: !!v.hazir, atis: [...new Set(atis)], cevap, batan: Array.isArray(v.batan) ? v.batan.filter(Array.isArray) : [], yenildi: !!v.yenildi,
      baslayan: v.baslayan === 'ahmet' ? 'ahmet' : 'cemre', galibiyet: Number(v.galibiyet) || 0, t: Number(v.t) || 0 };
  }
  const benim = () => temizS(CD.depo.al(anahtar(A().ben()), null));
  let canliO = null;            // kanaldan gelen karşı durumu (senk gelene kadar; gemi bilgisi İÇERMEZ)
  const onun = () => { const s = temizS(A().karsi() ? CD.depo.al(anahtar(A().karsi()), null) : null); return canliO && canliO.t > s.t ? canliO : s; };
  function yaz(s) { s.t = Date.now(); CD.depo.yaz(anahtar(A().ben()), s); }

  function rastgeleGemiler() {
    for (let deneme = 0; deneme < 200; deneme++) {
      const dolu = new Set(), sonuc = [];
      let tamam = true;
      for (const uz of GEMILER) {
        let kondu = false;
        for (let k = 0; k < 100 && !kondu; k++) {
          const yatay = Math.random() < 0.5;
          const x = Math.floor(Math.random() * (yatay ? N - uz + 1 : N)), y = Math.floor(Math.random() * (yatay ? N : N - uz + 1));
          const h = []; for (let i = 0; i < uz; i++) h.push((y + (yatay ? 0 : i)) * N + x + (yatay ? i : 0));
          // gemiler birbirine değmesin (köşe dahil): okunması kolay deniz
          const yakin = h.some(c => { const cx = c % N, cy = Math.floor(c / N); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N && dolu.has(ny * N + nx)) return true; } return false; });
          if (!yakin) { h.forEach(c => dolu.add(c)); sonuc.push(h); kondu = true; }
        }
        if (!kondu) { tamam = false; break; }
      }
      if (tamam) return sonuc;
    }
    return [[0, 1, 2, 3], [16, 17, 18], [32, 33, 34], [48, 49]];
  }
  function gemiAl(mac) { const v = CD.depo.al(GEMI, null); return v && v.mac === mac && Array.isArray(v.gemiler) ? v.gemiler : null; }

  /* ------------------------------------------------------------ iki telefon akışı */
  function esitle() {
    if (A().tek()) return false;
    let b = benim(); const o = onun();
    if (o.mac && o.mac > b.mac) {           // karşı yeni bir maç başlattı → katıl
      b = temizS({ mac: o.mac, baslayan: o.baslayan, galibiyet: b.galibiyet }); yaz(b);
      if (!gemiAl(o.mac)) CD.depo.yaz(GEMI, { mac: o.mac, gemiler: rastgeleGemiler() });
    }
    return cevapla();
  }
  /* karşının atışlarını kendi gemilerime göre cevapla (sonuç yalnız benim anahtarıma yazılır) */
  function cevapla() {
    const b = benim(), o = onun();
    if (!b.mac || b.mac !== o.mac) return false;
    const gm = gemiAl(b.mac); if (!gm) return false;
    let degisti = false;
    const atis = new Set(o.atis);
    o.atis.forEach(i => {
      if (b.cevap[i]) return;
      const gemi = gm.find(g => g.indexOf(i) >= 0);
      if (!gemi) b.cevap[i] = 'i';
      else if (gemi.every(c => atis.has(c))) { gemi.forEach(c => { b.cevap[c] = 'b'; }); if (!b.batan.some(x => x[0] === gemi[0])) b.batan.push(gemi.slice()); }
      else b.cevap[i] = 'v';
      degisti = true;
    });
    if (degisti) {
      if (gm.every(g => g.every(c => b.cevap[c] === 'b'))) b.yenildi = true;
      yaz(b); A().durt(OID, benim());
    }
    return degisti;
  }
  function oyunda(b, o) { return !!(b.mac && b.mac === o.mac && b.hazir && o.hazir); }
  function siraBende(b, o) {
    if (!oyunda(b, o) || b.yenildi || o.yenildi) return false;
    const n1 = b.atis.length, n2 = o.atis.length;
    return b.baslayan === A().ben() ? n1 === n2 : n1 < n2;
  }
  function atis(i) {
    if (A().tek()) { tekAtis(i); return; }
    esitle();
    const b = benim(), o = onun();
    if (!siraBende(b, o)) { ctx.ses.uf(); ctx.toast(oyunda(b, o) ? 'Sıra ' + A().adi(A().karsi()) + A().ek(A().karsi()) + '; o atınca sıra sana geçer' : 'Önce ikiniz de gemileri yerleştirin ⚓', 2400); return; }
    if (b.atis.indexOf(i) >= 0) { ctx.toast('Buraya zaten attın'); return; }
    b.atis.push(i); yaz(b);
    ctx.ses.blop();
    const m = ctx.efekt.merkez(ui.hedef.children[i]); ctx.efekt.kopuk(m.x, m.y, 4);
    A().durt(OID, benim()); A().posta(OID, 'sıra sende');
    ciz();
  }
  function yeniOyun() {
    const once = benim();
    const mac = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const bas = once.mac ? A().rakip(once.baslayan) : A().ben();
    if (A().tek()) { tekYeni(); return; }
    yaz(temizS({ mac, baslayan: bas, galibiyet: once.galibiyet }));
    CD.depo.yaz(GEMI, { mac, gemiler: rastgeleGemiler() });
    A().durt(OID, benim());
    ctx.ses.pop(); ctx.toast('Yeni deniz! Gemilerini yerleştir ⚓');
    ciz();
  }
  async function yeniSor() {
    const b = benim(), o = onun();
    if (!A().tek() && oyunda(b, o) && !b.yenildi && !o.yenildi && !(await ctx.onayla('Oyun sürüyor. Yeni deniz açılsın mı?', 'Yeni oyun', 'Devam edeyim'))) return;
    if (A().tek()) { const t = tekOku(); if (t && t.faz === 'oyun' && !(await ctx.onayla('Oyun sürüyor. Yeni deniz açılsın mı?', 'Yeni oyun', 'Devam edeyim'))) return; }
    if (ctx) yeniOyun();
  }

  /* ------------------------------------------------------------ tek telefon (perdeli) */
  function tekOku() { const v = CD.depo.al(TEK, null); return v && v.gemiler ? v : null; }
  function tekYaz(t) { CD.depo.yaz(TEK, t); }
  function tekYeni() {
    const o = tekOku();
    const bas = o ? A().rakip(o.baslayan || 'ahmet') : 'cemre';
    tekYaz({ gemiler: { cemre: rastgeleGemiler(), ahmet: rastgeleGemiler() }, atis: { cemre: [], ahmet: [] }, baslayan: bas, sira: bas, faz: 'yerlestir', yerlestiren: 'cemre', kazanan: null, perde: true, skor: (o && o.skor) || { cemre: 0, ahmet: 0 } });
    ciz();
  }
  function tekAtis(i) {
    const t = tekOku(); if (!t || t.faz !== 'oyun' || t.perde) return;
    const ben = t.sira, rakip = A().rakip(ben);
    if (t.atis[ben].indexOf(i) >= 0) { ctx.toast('Buraya zaten attın'); return; }
    t.atis[ben].push(i);
    const gemi = t.gemiler[rakip].find(g => g.indexOf(i) >= 0);
    const atilan = new Set(t.atis[ben]);
    let sonuc = 'Iska 🌊';
    if (gemi) sonuc = gemi.every(c => atilan.has(c)) ? 'Battı! 💥' : 'Vurdun! 🔥';
    if (t.gemiler[rakip].every(g => g.every(c => atilan.has(c)))) { t.faz = 'bitti'; t.kazanan = ben; t.skor[ben] = (t.skor[ben] || 0) + 1; }
    tekYaz(t); ciz();
    ctx.toast(sonuc, 1200); if (gemi) ctx.ses.gum(); else ctx.ses.blop();
    if (t.faz === 'bitti') { ctx.ses.zafer(); ctx.efekt.konfeti(undefined, undefined, 18); return; }
    clearTimeout(perdeT);
    perdeT = setTimeout(() => { const u = tekOku(); if (!u || !ctx) return; u.sira = rakip; u.perde = true; tekYaz(u); ciz(); }, 1300);
  }

  /* ------------------------------------------------------------ çizim */
  function tahtaKur(sinif, tiklanir) {
    const t = ctx.el('div.amiral-tahta.' + sinif, { role: tiklanir ? 'grid' : 'img' });
    for (let i = 0; i < N * N; i++) {
      const etiket = HARF[i % N] + (Math.floor(i / N) + 1);
      t.appendChild(tiklanir ? ctx.el('button.amiral-hucre', { type: 'button', 'aria-label': etiket, onclick: () => atis(i), data: { i: String(i) } }) : ctx.el('span.amiral-hucre'));
    }
    if (tiklanir) t.addEventListener('keydown', (e) => {
      const i = [...t.children].indexOf(document.activeElement); if (i < 0) return;
      const n = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: N, ArrowUp: -N }[e.key]; if (!n) return;
      const h = i + n; if (h < 0 || h >= N * N || (n === 1 && i % N === N - 1) || (n === -1 && i % N === 0)) return;
      e.preventDefault(); t.children[h].focus();
    });
    return t;
  }
  function kur(el) {
    const e = ctx.el;
    ui.durum = e('p.baslik.baslik-lg.oyun-durum', { role: 'status', 'aria-live': 'polite' });
    ui.alt = e('p.sessiz.oyun-durum-alt');
    ui.hedef = tahtaKur('amiral-hedef', true);
    ui.benim = tahtaKur('amiral-benim', false);
    ui.hedefBaslik = e('h2.baslik.amiral-baslik', 'Onun denizi');
    ui.benimBaslik = e('h2.baslik.amiral-baslik', 'Senin denizin');
    ui.yerlesim = e('div.satir.amiral-yerlesim', [
      e('button.dugme-ikincil', { type: 'button', onclick: karistir }, '🔀 Karıştır'),
      e('button.dugme', { type: 'button', onclick: hazirim }, '⚓ Hazırım')
    ]);
    ui.perde = e('div.amiral-perde', { hidden: true }, [e('p.baslik.baslik-lg.amiral-perde-metin'), e('p.sessiz', 'Ekrana bakmasın 🙈'), e('button.dugme', { type: 'button', onclick: perdeAc }, 'Hazırım, göster')]);
    ui.skor = e('p.oyun-skor');
    el.appendChild(e('div.icerik.oyun-icerik.amiral-icerik', [
      e('div.yama.oyun-durum-kart', [ui.durum, ui.alt]),
      e('div.amiral-denizler', [
        e('div.amiral-deniz', [ui.hedefBaslik, ui.hedef]),
        e('div.amiral-deniz.kucuk', [ui.benimBaslik, ui.benim, ui.yerlesim])
      ]),
      e('div.yama.siki.oyun-skor-kart', [ui.skor]),
      ui.perde
    ]));
  }
  function hucreBoya(tahta, durumlar, gemiSet) {
    [...tahta.children].forEach((h, i) => {
      const s = durumlar[i] || '';
      h.dataset.s = s; h.classList.toggle('gemi', !!(gemiSet && gemiSet.has(i)));
      h.textContent = s === 'i' ? '·' : s === 'v' ? '✕' : s === 'b' ? '✕' : s === 'bekle' ? '…' : '';
      if (h.tagName === 'BUTTON') {
        const ad = HARF[i % N] + (Math.floor(i / N) + 1);
        h.setAttribute('aria-label', ad + ({ i: ', ıska', v: ', isabet', b: ', batan gemi', bekle: ', cevap bekleniyor' }[s] || ''));
      }
    });
  }
  function karistir() {
    ctx.ses.tik();
    if (A().tek()) { const t = tekOku(); if (!t || t.faz !== 'yerlestir') return; t.gemiler[t.yerlestiren] = rastgeleGemiler(); tekYaz(t); ciz(); return; }
    const b = benim(); if (!b.mac || b.hazir) return;
    CD.depo.yaz(GEMI, { mac: b.mac, gemiler: rastgeleGemiler() }); ciz();
  }
  function hazirim() {
    ctx.ses.pop();
    if (A().tek()) {
      const t = tekOku(); if (!t || t.faz !== 'yerlestir') return;
      if (t.yerlestiren === 'cemre') t.yerlestiren = 'ahmet'; else { t.faz = 'oyun'; t.sira = t.baslayan; }
      t.perde = true; tekYaz(t); ciz(); return;
    }
    const b = benim(); if (!b.mac) return;
    if (!gemiAl(b.mac)) CD.depo.yaz(GEMI, { mac: b.mac, gemiler: rastgeleGemiler() });
    b.hazir = true; yaz(b);
    A().durt(OID, benim()); A().posta(OID, 'gemiler hazır, sıra kimde bak');
    ctx.toast('Gemiler denizde ⚓'); ciz();
  }
  function perdeAc() { const t = tekOku(); if (!t) return; t.perde = false; tekYaz(t); ctx.ses.tik(); ciz(); }

  function ciz() {
    if (!ctx) return;
    clearTimeout(ui.cizT);
    if (A().tek()) { tekCiz(); return; }
    ui.perde.hidden = true;
    const ben = A().ben(), k = A().karsi();
    const b = benim(), o = onun();
    const gm = b.mac ? gemiAl(b.mac) : null;
    const gemiSet = new Set((gm || []).flat());
    // benim denizim: gemilerim + onun atışları (benim cevabımla)
    const bd = {}; o.mac === b.mac && o.atis.forEach(i => { bd[i] = b.cevap[i] || 'bekle'; });
    hucreBoya(ui.benim, bd, gemiSet);
    // onun denizi: benim atışlarım + onun cevapları
    const hd = {}; b.atis.forEach(i => { hd[i] = (o.mac === b.mac && o.cevap[i]) || 'bekle'; });
    hucreBoya(ui.hedef, hd, null);
    const sira = siraBende(b, o);
    ui.hedef.classList.toggle('kilitli', !sira);
    ui.yerlesim.hidden = !(b.mac && !b.hazir);
    ui.hedefBaslik.textContent = CD.ek.nin(A().adi(k)) + ' denizi';
    let m = '', a = '';
    if (!b.mac && !o.mac) { m = 'Deniz sakin 🌊'; a = 'Alttan "Yeni oyun"a bas; gemilerin yalnız sende görünür.'; }
    else if (!b.hazir) { m = 'Gemilerini yerleştir ⚓'; a = 'Beğenmezsen karıştır; bu yerleşim ' + CD.ek.ye(A().adi(k)) + ' gitmez.'; }
    else if (o.mac !== b.mac || !o.hazir) { m = A().adi(k) + ' gemilerini yerleştiriyor…'; a = 'Hazır olunca atışlar başlar.'; }
    else if (o.yenildi) { m = 'Kazandın! 🎉'; a = CD.ek.nin(A().adi(k)) + ' bütün gemileri battı.'; }
    else if (b.yenildi) { m = A().adi(k) + ' kazandı 💫'; a = 'Rövanş için yeni oyuna bas.'; }
    else if (sira) { m = 'Sıra sende!'; a = CD.ek.nin(A().adi(k)) + ' denizinde bir kareye dokun.'; }
    else { m = 'Sıra ' + A().adi(k) + A().ek(k); a = b.atis.length && !o.cevap[b.atis[b.atis.length - 1]] ? 'Son atışının sonucu o açınca gelir.' : 'O atınca sıra sana geçer.'; }
    ui.durum.textContent = m; ui.alt.textContent = a;
    // kazanma kutlaması (maç başına bir kez)
    if (o.yenildi && b.mac === o.mac && CD.depo.al(KUTLANAN, '') !== b.mac) {
      CD.depo.yaz(KUTLANAN, b.mac); b.galibiyet++; yaz(b);
      ctx.ses.zafer(); ctx.efekt.konfeti(undefined, undefined, 18);
    }
    ui.skor.textContent = 'Kazandığın deniz savaşı: ' + benim().galibiyet + ' · ' + A().adi(k) + ': ' + o.galibiyet;
  }
  function tekCiz() {
    let t = tekOku(); if (!t) { tekYeni(); return; }
    const ben = t.faz === 'yerlestir' ? t.yerlestiren : t.sira, rakip = A().rakip(ben);
    ui.perde.hidden = !t.perde || t.faz === 'bitti';
    ui.perde.querySelector('.amiral-perde-metin').textContent = 'Telefonu ' + CD.ek.ye(A().adi(ben)) + ' ver';
    const gizli = t.perde && t.faz !== 'bitti';
    const benimGemi = new Set(gizli ? [] : t.gemiler[ben].flat());
    const bd = {}; const rakipAtis = new Set(t.atis[rakip]);
    t.atis[rakip].forEach(i => { const g = t.gemiler[ben].find(x => x.indexOf(i) >= 0); bd[i] = !g ? 'i' : (g.every(c => rakipAtis.has(c)) ? 'b' : 'v'); });
    hucreBoya(ui.benim, gizli ? {} : bd, benimGemi);
    const hd = {}; const benAtis = new Set(t.atis[ben]);
    t.atis[ben].forEach(i => { const g = t.gemiler[rakip].find(x => x.indexOf(i) >= 0); hd[i] = !g ? 'i' : (g.every(c => benAtis.has(c)) ? 'b' : 'v'); });
    hucreBoya(ui.hedef, gizli ? {} : hd, t.faz === 'bitti' ? new Set(t.gemiler[rakip].flat()) : null);
    ui.hedef.classList.toggle('kilitli', t.faz !== 'oyun' || t.perde);
    ui.yerlesim.hidden = t.faz !== 'yerlestir' || t.perde;
    ui.hedefBaslik.textContent = CD.ek.nin(A().adi(rakip)) + ' denizi';
    ui.benimBaslik.textContent = CD.ek.nin(A().adi(ben)) + ' denizi';
    let m, a;
    if (t.faz === 'yerlestir') { m = A().adi(ben) + ', gemilerini yerleştir ⚓'; a = 'Bulut kapalı: aynı telefonda sırayla. Bitince "Hazırım".'; }
    else if (t.faz === 'bitti') { m = A().adi(t.kazanan) + ' kazandı! 🎉'; a = 'Rövanş için yeni oyuna bas.'; }
    else { m = 'Sıra ' + A().adi(ben) + A().ek(ben); a = CD.ek.nin(A().adi(rakip)) + ' denizinde bir kareye dokun.'; }
    ui.durum.textContent = m; ui.alt.textContent = a;
    ui.skor.textContent = '🎀 ' + A().adi('cemre') + ' ' + ((t.skor || {}).cemre || 0) + ' · 💙 ' + A().adi('ahmet') + ' ' + ((t.skor || {}).ahmet || 0);
  }
  function tazele() { if (!ctx) return; if (!A().tek()) esitle(); ciz(); }

  (CD.oyunlar = CD.oyunlar || {})[OID] = {
    id: OID, ad: 'Amiral Battı', aciklama: 'Gemilerini sakla, onunkileri bul.', sira: 3, ikon: IKON,
    siraSende() { if (A().tek()) return false; const b = benim(), o = onun(); if (o.mac && o.mac > b.mac) return true; if (b.mac && !b.hazir && o.mac === b.mac) return true; return siraBende(b, o); },
    durum() { if (A().tek()) return ''; const b = benim(), o = onun(); if (o.mac && o.mac > b.mac) return A().adi(A().karsi()) + ' yeni deniz açtı'; if (oyunda(b, o)) return o.yenildi ? 'Son savaşı kazandın' : b.yenildi ? 'Son savaşı ' + A().adi(A().karsi()) + ' kazandı' : 'Savaş sürüyor'; return ''; },
    mount(el, c) {
      ctx = c; kok = el;
      kur(el);
      ctx.altbar([{ id: 'yeni', ad: 'Yeni oyun', ikon: '🌊', birincil: true, tikla() { yeniSor(); } }]);
      tazele();
      cozler.push(A().dinle(OID, (d) => { if (d && typeof d === 'object') { const g = temizS(d); if (!canliO || g.t > canliO.t) canliO = g; } tazele(); }));
      cozler.push(ctx.olay.dinle('senk:yenilendi', tazele));
      cozler.push(ctx.olay.dinle('senk', (d) => { if (d && d.durum === 'tamam') tazele(); }));
      cozler.push(ctx.olay.dinle('kim', tazele));
      const t = setInterval(() => { if (!document.hidden && A().bulut()) CD.senk.simdi(); }, 15000); cozler.push(() => clearInterval(t));
    },
    unmount() {
      clearTimeout(perdeT); perdeT = 0; canliO = null;
      while (cozler.length) { try { cozler.pop()(); } catch (e) {} }
      Object.keys(ui).forEach(k => delete ui[k]);
      ctx = null; kok = null;
    }
  };
})();
