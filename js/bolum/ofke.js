/* js/bolum/ofke.js — Öfke Odası
   Beton bir oda, bir raf, kırılacak eşyalar ve bir terlik. Dokun → parçalan (canvas fizik), sarsıntı, seri sayacı,
   öfke ölçer sıfırlanınca battaniye geri gelir ve bir pixel pet ile 4-7-8 nefes egzersizi. İlerleme cd.ofke.durum'da. */
(() => {
  'use strict';
  const ID = 'ofke';
  const YERCEKIMI = 2100, PARCA_MAKS = 240, KALINTI_MAKS = 80, SERI_SURE = 1700, RAF_YER = 3;
  const YAZI_TIPI = '"Nunito", "Segoe UI", sans-serif';

  /* ------------------------------------------------------------ aletler */
  const ALETLER = [
    { id: 'terlik', ad: 'Terlik', emoji: '🩴', hasar: 1, vurus: 'sak', ipucu: 'Terlik elinde. Annelerden öğrendik, hedefi hiç şaşmaz.',
      svg: '<svg viewBox="0 0 64 64"><path d="M23 4c9-2 17 5 19 17 2 11 0 25-6 34-4 6-13 6-17 0C13 46 11 32 13 20 14 12 17 6 23 4z" fill="#F29DBC" stroke="#C9567F" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 26c8-6 18-5 24 3" fill="none" stroke="#C9567F" stroke-width="3" stroke-linecap="round"/><path d="M20 30c6 3 12 3 17 0" fill="none" stroke="#C9567F" stroke-width="2" stroke-linecap="round" opacity=".6"/><path d="M26 42c3 1 6 1 9 0" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>' },
    { id: 'cekic', ad: 'Çekiç', emoji: '🔨', hasar: 2, vurus: 'gum', ipucu: 'Çekiç ağır vurur: televizyon bile tek vuruşta gider.',
      svg: '<svg viewBox="0 0 64 64"><rect x="28" y="20" width="10" height="40" rx="4" fill="#C58B5B" stroke="#8A5A3A" stroke-width="2"/><rect x="12" y="6" width="40" height="18" rx="5" fill="#8E97A6" stroke="#4F5766" stroke-width="2.5"/><rect x="16" y="9" width="12" height="5" rx="2" fill="#fff" opacity=".45"/></svg>' },
    { id: 'sopa', ad: 'Sopa', emoji: '⚾', hasar: 2, vurus: 'vin', ipucu: 'Beyzbol sopası. Sallamadan önce geri çek, sonra vınn.',
      svg: '<svg viewBox="0 0 64 64"><g transform="rotate(35 32 32)"><path d="M32 3c5 0 8 3 8 8l-2 30c0 3-3 5-6 5s-6-2-6-5L24 11c0-5 3-8 8-8z" fill="#E0B27A" stroke="#8A5A3A" stroke-width="2.5"/><rect x="27" y="44" width="10" height="16" rx="4" fill="#5A3A2A"/><circle cx="32" cy="58" r="4.5" fill="#3B2A3A"/></g></svg>' },
    { id: 'el', ad: 'El', emoji: '✋', hasar: 1, vurus: 'pat', ipucu: 'Çıplak el. Tırnaklara dikkat, ojen taze.',
      svg: '<svg viewBox="0 0 64 64"><g fill="#FBD2BF" stroke="#C9866A" stroke-width="2.5" stroke-linejoin="round"><rect x="18" y="26" width="30" height="30" rx="12"/><rect x="18" y="8" width="8" height="24" rx="4"/><rect x="27" y="3" width="8" height="28" rx="4"/><rect x="36" y="5" width="8" height="26" rx="4"/><rect x="45" y="12" width="8" height="22" rx="4"/><rect x="6" y="30" width="16" height="9" rx="4.5" transform="rotate(-35 14 34)"/></g><g fill="#F5C0D4"><rect x="20" y="9" width="4" height="5" rx="2"/><rect x="29" y="4" width="4" height="5" rx="2"/><rect x="38" y="6" width="4" height="5" rx="2"/><rect x="47" y="13" width="4" height="5" rx="2"/></g></svg>' }
  ];

  /* ------------------------------------------------------------ çizim yardımcıları */
  function ydk(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function elips(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); }
  function daire(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); }
  function yildizYolu(g, r, ic) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * ic : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.closePath();
  }
  function catlakCiz(g, n, renk) {
    if (!n.catlak || !n.catlak.length) return;
    g.strokeStyle = renk || 'rgba(255,255,255,.85)'; g.lineWidth = 1.6; g.lineCap = 'round';
    n.catlak.forEach(c => { g.beginPath(); g.moveTo(c[0], c[1]); for (let i = 2; i < c.length; i += 2) g.lineTo(c[i], c[i + 1]); g.stroke(); });
  }
  function catlakUret(n, x, y) {
    n.catlak = n.catlak || [];
    const sayi = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < sayi; i++) {
      const c = [x, y]; let px = x, py = y; const a0 = Math.random() * Math.PI * 2;
      const adim = 2 + Math.floor(Math.random() * 3);
      for (let k = 0; k < adim; k++) { const a = a0 + (Math.random() - .5) * .9, u = 8 + Math.random() * n.w * .18; px += Math.cos(a) * u; py += Math.sin(a) * u; c.push(px, py); }
      n.catlak.push(c);
    }
  }
  const SEKER = ['#FF9DB4', '#FFE28A', '#9FE3C4', '#A9D6F2', '#CDBDF6', '#FFC3A3'];

  /* ------------------------------------------------------------ eşyalar */
  const ESYALAR = [
    { id: 'tabak', ad: 'Tabak', emoji: '🍽️', tur: 'vur', can: 1, guc: 6, w: .95, h: .95, ses: 'kirilma', renk: ['#FFF8F1', '#FCEBEF', '#F29DBC', '#E8D8D0'], parca: 22,
      soz: ['Bu tabak zaten çatlaktı, iyi oldu.', 'Bulaşık da bitti böylece.', 'Tuz buz! Yenisi dolapta.'],
      ciz(g, n) {
        const r = n.w / 2;
        elips(g, 0, 0, r, r * .92); g.fillStyle = '#FFF8F1'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#E8D8D0'; g.stroke();
        elips(g, 0, 0, r * .66, r * .6); g.fillStyle = '#FCEBEF'; g.fill();
        elips(g, 0, 0, r * .8, r * .74); g.strokeStyle = '#F29DBC'; g.lineWidth = 3; g.stroke();
        g.fillStyle = '#F29DBC'; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; daire(g, Math.cos(a) * r * .5, Math.sin(a) * r * .46, 2.4); g.fill(); }
        g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r * .9, Math.PI * 1.12, Math.PI * 1.42); g.stroke();
      } },
    { id: 'vazo', ad: 'Vazo', emoji: '🏺', tur: 'vur', can: 1, guc: 7, w: .62, h: 1.18, ses: 'kirilma', renk: ['#DCEBF5', '#A9CBE0', '#6F97AC', '#FF9DB4', '#7CCB9A'], parca: 24,
      soz: ['Çiçekler kurtuldu, vazo kurtulamadı.', 'Porselen sesi: en tatmin edicisi.', 'Vazo gitti, çiçekler sana kaldı.'],
      ciz(g, n) {
        const hb = n.h * .66, ust = n.h / 2 - hb, hw = n.w / 2;
        // çiçekler
        const saplar = [[-hw * .5, -n.h / 2 + 10, '#FF9DB4'], [0, -n.h / 2 + 4, '#FFE28A'], [hw * .55, -n.h / 2 + 12, '#F29DBC']];
        g.strokeStyle = '#7CCB9A'; g.lineWidth = 2.5; g.lineCap = 'round';
        saplar.forEach(s => { g.beginPath(); g.moveTo(0, ust + 4); g.quadraticCurveTo(s[0] * .4, ust - hb * .1, s[0], s[1] + 6); g.stroke(); });
        saplar.forEach(s => { daire(g, s[0], s[1], hw * .27); g.fillStyle = s[2]; g.fill(); daire(g, s[0], s[1], hw * .1); g.fillStyle = '#FFF7D9'; g.fill(); });
        // gövde
        g.beginPath(); g.moveTo(-hw * .45, ust); g.lineTo(hw * .45, ust);
        g.quadraticCurveTo(hw * .35, ust + hb * .15, hw * .95, ust + hb * .42);
        g.quadraticCurveTo(hw * 1.02, ust + hb * .75, hw * .55, ust + hb * .95);
        g.lineTo(hw * .55, n.h / 2); g.lineTo(-hw * .55, n.h / 2); g.lineTo(-hw * .55, ust + hb * .95);
        g.quadraticCurveTo(-hw * 1.02, ust + hb * .75, -hw * .95, ust + hb * .42);
        g.quadraticCurveTo(-hw * .35, ust + hb * .15, -hw * .45, ust); g.closePath();
        const gr = g.createLinearGradient(-hw, 0, hw, 0); gr.addColorStop(0, '#DCEBF5'); gr.addColorStop(.55, '#C4DDEC'); gr.addColorStop(1, '#A9CBE0');
        g.fillStyle = gr; g.fill(); g.strokeStyle = '#6F97AC'; g.lineWidth = 2; g.stroke();
        g.beginPath(); g.moveTo(-hw * .7, ust + hb * .55); g.bezierCurveTo(-hw * .3, ust + hb * .4, hw * .3, ust + hb * .7, hw * .7, ust + hb * .55); g.strokeStyle = '#6F97AC'; g.lineWidth = 2; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.55)'; elips(g, -hw * .5, ust + hb * .5, hw * .1, hb * .22); g.fill();
      } },
    { id: 'tv', ad: 'Eski TV', emoji: '📺', tur: 'vur', can: 2, guc: 12, w: 1.15, h: .92, ses: 'patlama', renk: ['#8D6B5A', '#5B4235', '#2E3440', '#465066', '#A9D6F2', '#FF9DB4'], parca: 30,
      soz: ['Dizinin sonunu da öğrenemedik.', 'Reklamlar bitti sonunda.', 'Tüplü televizyon, güm diye gider.'],
      ciz(g, n, t) {
        const w = n.w, h = n.h;
        g.strokeStyle = '#3B2A3A'; g.lineWidth = 2.5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-w * .1, -h / 2 + h * .13); g.lineTo(-w * .3, -h / 2 + 2); g.moveTo(w * .1, -h / 2 + h * .13); g.lineTo(w * .3, -h / 2 + 2); g.stroke();
        daire(g, -w * .3, -h / 2 + 2, 3); g.fillStyle = '#3B2A3A'; g.fill(); daire(g, w * .3, -h / 2 + 2, 3); g.fill();
        ydk(g, -w / 2, -h / 2 + h * .12, w, h * .88, 12); g.fillStyle = '#8D6B5A'; g.fill(); g.strokeStyle = '#5B4235'; g.lineWidth = 2.5; g.stroke();
        ydk(g, -w / 2 + w * .07, -h / 2 + h * .2, w * .66, h * .64, 8);
        const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#465066'); gr.addColorStop(1, '#2E3440'); g.fillStyle = gr; g.fill();
        g.save(); g.clip();
        if (n.hasar > 0) { // cızırtı
          g.fillStyle = 'rgba(255,255,255,.35)';
          for (let i = 0; i < 40; i++) g.fillRect(-w / 2 + w * .07 + ((i * 37 + Math.floor(t * 20) * 13) % (w * .66)), -h / 2 + h * .2 + ((i * 53 + Math.floor(t * 20) * 7) % (h * .64)), 3, 2);
        } else {
          const b = ['#FF9DB4', '#FFE28A', '#9FE3C4', '#A9D6F2']; const bw = w * .66 / 4;
          b.forEach((c, i) => { g.fillStyle = c; g.globalAlpha = .38; g.fillRect(-w / 2 + w * .07 + i * bw, -h / 2 + h * .2, bw, h * .64); }); g.globalAlpha = 1;
          g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-w / 2 + w * .1, -h / 2 + h * .23, w * .12, h * .1);
        }
        g.restore(); g.strokeStyle = '#5B4235'; g.lineWidth = 2; g.stroke();
        catlakCiz(g, n);
        g.fillStyle = '#3B2A3A'; daire(g, w / 2 - w * .13, -h * .02, w * .045); g.fill(); daire(g, w / 2 - w * .13, h * .16, w * .045); g.fill();
        g.strokeStyle = '#5B4235'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w / 2 - w * .2, h * .27 + i * 4); g.lineTo(w / 2 - w * .06, h * .27 + i * 4); g.stroke(); }
      } },
    { id: 'telefon', ad: 'Eski telefon', emoji: '📱', tur: 'vur', can: 2, guc: 6, w: .42, h: .9, ses: 'catir', renk: ['#3E4450', '#B8D98B', '#5B6270', '#20242C'], parca: 16,
      soz: ['Kırılmaz derlerdi… derlerdi.', 'Yılan oyunu da gitti, üzgünüm.', 'Şarjı zaten bitmişti.'],
      ciz(g, n) {
        const w = n.w, h = n.h;
        g.fillStyle = '#20242C'; ydk(g, w * .18, -h / 2 - h * .07, w * .12, h * .1, 3); g.fill();
        ydk(g, -w / 2, -h / 2, w, h, w * .2); g.fillStyle = '#3E4450'; g.fill(); g.strokeStyle = '#20242C'; g.lineWidth = 2; g.stroke();
        ydk(g, -w * .34, -h * .4, w * .68, h * .26, 4); g.fillStyle = '#B8D98B'; g.fill();
        g.strokeStyle = '#4E6B3A'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w * .26, -h * .33); g.lineTo(w * .1, -h * .33); g.moveTo(-w * .26, -h * .25); g.lineTo(w * .22, -h * .25); g.stroke();
        g.save(); ydk(g, -w * .34, -h * .4, w * .68, h * .26, 4); g.clip(); catlakCiz(g, n, 'rgba(32,36,44,.7)'); g.restore();
        g.fillStyle = '#5B6270'; daire(g, 0, -h * .04, w * .11); g.fill();
        for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { ydk(g, -w * .3 + c * w * .21, h * .08 + r * h * .09, w * .16, h * .065, 2); g.fill(); }
      } },
    { id: 'klavye', ad: 'Klavye', emoji: '⌨️', tur: 'vur', can: 1, guc: 8, w: 1.15, h: .44, ses: 'catir', renk: ['#D8DCE2', '#F6F8FA', '#9AA3B0'], parca: 12,
      soz: ['Q W E R T… uçtu gitti.', 'Tuşlar özgür kaldı.', 'Caps lock sonsuza dek kapalı.'],
      ek(n, x, y) { const harf = 'QWERTYUİOPASDFGHJKLZXCVBNMÇŞĞ'; for (let i = 0; i < 14; i++) parcaEkle({ tur: 'tus', x: n.cx + (Math.random() - .5) * n.w * .9, y: n.cy + (Math.random() - .5) * n.h * .7, boy: 12 + Math.random() * 5, yazi: harf[Math.floor(Math.random() * harf.length)] }, x, y, 1.1); },
      ciz(g, n) {
        const w = n.w, h = n.h;
        ydk(g, -w / 2, -h / 2, w, h, 8); g.fillStyle = '#D8DCE2'; g.fill(); g.strokeStyle = '#9AA3B0'; g.lineWidth = 2; g.stroke();
        const kols = 12, sat = 4, kw = (w * .92) / kols, kh = (h * .82) / sat, x0 = -w * .46, y0 = -h * .41;
        g.fillStyle = '#F6F8FA'; g.strokeStyle = '#B9C1CC'; g.lineWidth = 1;
        for (let r = 0; r < sat; r++) for (let c = 0; c < kols; c++) {
          if (r === 3 && c >= 3 && c <= 8) { if (c === 3) { ydk(g, x0 + c * kw + 1, y0 + r * kh + 1.5, kw * 6 - 2, kh - 3, 3); g.fill(); g.stroke(); } continue; }
          ydk(g, x0 + c * kw + 1, y0 + r * kh + 1.5, kw - 2, kh - 3, 3); g.fill(); g.stroke();
        }
      } },
    { id: 'karpuz', ad: 'Karpuz', emoji: '🍉', tur: 'vur', can: 1, guc: 9, w: 1.0, h: .8, ses: 'sap', renk: ['#F0546A', '#FF7A8C', '#F0546A', '#3E9C55', '#2C6B3A', '#F8E7D8'], parca: 26, sarsinti: 2,
      soz: ['Şap! Yaz geldi.', 'Çekirdekleri saymadım, sen say.', 'Karpuz kırıldı, kavun kaçtı.'],
      ek(n, x, y) { for (let i = 0; i < 14; i++) parcaEkle({ tur: 'nokta', renk: '#2B2733', r: 2.2, x: n.cx + (Math.random() - .5) * n.w * .6, y: n.cy + (Math.random() - .5) * n.h * .5 }, x, y, 1.3); },
      ciz(g, n) {
        const w = n.w, h = n.h;
        elips(g, 0, 0, w / 2, h / 2); g.fillStyle = '#3E9C55'; g.fill(); g.strokeStyle = '#2C6B3A'; g.lineWidth = 2.5; g.stroke();
        g.save(); elips(g, 0, 0, w / 2 - 1, h / 2 - 1); g.clip();
        g.strokeStyle = '#2C6B3A'; g.lineWidth = 5; g.lineCap = 'round';
        for (let i = -2; i <= 2; i++) { const x = i * w * .17; g.beginPath(); g.moveTo(x - w * .06, -h / 2); g.quadraticCurveTo(x + w * .1, 0, x - w * .04, h / 2); g.stroke(); }
        g.restore();
        g.strokeStyle = '#7A5230'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -h / 2 + 2); g.quadraticCurveTo(w * .04, -h / 2 - 8, w * .1, -h / 2 - 10); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(-w * .18, -h * .2, w * .16, h * .1, -.5, Math.PI, Math.PI * 1.9); g.stroke();
      } },
    { id: 'pinyata', ad: 'Piñata', emoji: '🪅', tur: 'vur', can: 4, guc: 14, w: .85, h: .85, asili: true, salinim: 1, ses: 'pinyata', renk: SEKER, parca: 26, sarsinti: 2,
      soz: ['Şeker yağmuru!', 'Bayram bugünmüş.', 'Piñata patladı, şekerler senin.'],
      vurSoz: ['Sallan bakalım!', 'Bir daha!', 'Az kaldı, dayan piñata!'],
      ek(n, x, y) { const s = ['🍬', '🍭', '🍫', '🧁', '🍓']; for (let i = 0; i < 12; i++) parcaEkle({ tur: 'yazi', yazi: s[i % s.length], boy: 16 + Math.random() * 6, x: n.cx + (Math.random() - .5) * n.w * .6, y: n.cy + (Math.random() - .5) * n.h * .5 }, x, y, 1.15); },
      ciz(g, n, t) {
        const r = n.w / 2;
        g.save(); yildizYolu(g, r, .52); g.clip();
        const bant = Math.max(6, r * .16);
        for (let i = -1; i < 14; i++) { g.fillStyle = SEKER[(i + 20) % SEKER.length]; g.fillRect(-r, -r + i * bant, r * 2, bant); g.fillStyle = 'rgba(255,255,255,.28)'; for (let k = 0; k < 10; k++) g.fillRect(-r + k * r * .2, -r + i * bant + bant - 3, r * .1, 3); }
        g.restore();
        yildizYolu(g, r, .52); g.strokeStyle = '#3B2A3A'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#3B2A3A'; daire(g, -r * .16, -r * .05, r * .07); g.fill(); daire(g, r * .16, -r * .05, r * .07); g.fill();
        g.fillStyle = '#fff'; daire(g, -r * .14, -r * .07, r * .025); g.fill(); daire(g, r * .18, -r * .07, r * .025); g.fill();
        g.strokeStyle = '#3B2A3A'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath();
        if (n.hasar > .6) { g.moveTo(-r * .1, r * .18); g.lineTo(r * .1, r * .18); } else g.arc(0, r * .08, r * .12, Math.PI * .15, Math.PI * .85);
        g.stroke();
        g.fillStyle = 'rgba(255,157,180,.6)'; daire(g, -r * .3, r * .1, r * .07); g.fill(); daire(g, r * .3, r * .1, r * .07); g.fill();
      } },
    { id: 'cam', ad: 'Cam', emoji: '🪟', tur: 'vur', can: 1, guc: 8, w: 1.0, h: .95, ses: 'kirilma', renk: ['#CFE9F5', '#E8F5FB', '#FFFFFF', '#CFE9F5'], parca: 28, kenar: true,
      soz: ['Camlar da hak etmişti.', 'Şangır şungur. Süpürge sonra.', 'Cam kırıldı, hava aldı oda.'],
      ciz(g, n) {
        const w = n.w, h = n.h;
        ydk(g, -w / 2, -h / 2, w, h, 6); g.fillStyle = '#FFFFFF'; g.fill(); g.strokeStyle = '#D9DEE4'; g.lineWidth = 2; g.stroke();
        ydk(g, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 3); g.fillStyle = 'rgba(207,233,245,.9)'; g.fill();
        g.strokeStyle = '#FFFFFF'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -h / 2 + 6); g.lineTo(0, h / 2 - 6); g.moveTo(-w / 2 + 6, 0); g.lineTo(w / 2 - 6, 0); g.stroke();
        g.strokeStyle = '#D9DEE4'; g.lineWidth = 1; g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w * .38, -h * .1); g.lineTo(-w * .18, -h * .38); g.moveTo(-w * .3, h * .02); g.lineTo(-w * .05, -h * .34); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.moveTo(w * .12, h * .38); g.lineTo(w * .36, h * .08); g.stroke();
      } },
    { id: 'saat', ad: 'Çalar saat', emoji: '⏰', tur: 'vur', can: 1, guc: 6, w: .72, h: .82, ses: 'catir', renk: ['#FFFDF8', '#F29DBC', '#F5B54A', '#3B2A3A', '#FFFDF8'], parca: 20, zil: true,
      soz: ['Bir daha zırlayamaz.', 'Sabah yedi kavgası bitti.', 'Erteleyecek bir şey kalmadı.'],
      ek(n, x, y) { for (let i = 0; i < 4; i++) parcaEkle({ tur: 'yazi', yazi: ['12', '3', '6', '9'][i], boy: 13, renk: '#3B2A3A', x: n.cx + (Math.random() - .5) * n.w * .5, y: n.cy + (Math.random() - .5) * n.h * .4 }, x, y, 1); },
      ciz(g, n, t) {
        const w = n.w, h = n.h, cy = h * .1, r = w * .42;
        const sal = n.zilAktif ? Math.sin(t * 60) * .08 : 0;
        g.save(); g.rotate(sal);
        g.fillStyle = '#F5B54A'; g.strokeStyle = '#B37A1F'; g.lineWidth = 2;
        daire(g, -w * .28, -h * .33, w * .17); g.fill(); g.stroke(); daire(g, w * .28, -h * .33, w * .17); g.fill(); g.stroke();
        g.fillStyle = '#B37A1F'; ydk(g, -3, -h * .5, 6, h * .12, 2); g.fill();
        g.strokeStyle = '#B37A1F'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w * .25, cy + r - 2); g.lineTo(-w * .34, h / 2); g.moveTo(w * .25, cy + r - 2); g.lineTo(w * .34, h / 2); g.stroke();
        daire(g, 0, cy, r); g.fillStyle = '#FFFDF8'; g.fill(); g.strokeStyle = '#F29DBC'; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#C9567F'; g.lineWidth = 1.5; g.stroke();
        g.strokeStyle = '#3B2A3A'; g.lineWidth = 1.5; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, u = i % 3 ? .82 : .74; g.beginPath(); g.moveTo(Math.cos(a) * r * u, cy + Math.sin(a) * r * u); g.lineTo(Math.cos(a) * r * .88, cy + Math.sin(a) * r * .88); g.stroke(); }
        g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, cy); g.lineTo(-r * .38, cy - r * .3); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(0, cy); g.lineTo(r * .18, cy - r * .58); g.stroke();
        g.fillStyle = '#F29DBC'; daire(g, 0, cy, 3); g.fill();
        g.restore();
      } },
    { id: 'ayna', ad: 'Ayna', emoji: '🪞', tur: 'vur', can: 1, guc: 8, w: .78, h: 1.05, ses: 'kirilma', renk: ['#E4F2F9', '#F9FCFE', '#E7C36A', '#E4F2F9', '#B8902F'], parca: 26, kenar: true,
      soz: ['Ayna kırıldı, güzelliğin sende kaldı.', 'Yedi yıl değil, yedi saniye konfeti.', 'Ayna da bir şey yansıtamadı senin yanında.'],
      ciz(g, n) {
        const w = n.w, h = n.h;
        elips(g, 0, 0, w / 2, h / 2); g.fillStyle = '#E7C36A'; g.fill(); g.strokeStyle = '#B8902F'; g.lineWidth = 2; g.stroke();
        elips(g, 0, 0, w / 2 - 8, h / 2 - 8); const gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); gr.addColorStop(0, '#E4F2F9'); gr.addColorStop(.5, '#F9FCFE'); gr.addColorStop(1, '#D6EAF4'); g.fillStyle = gr; g.fill();
        g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w * .22, h * .05); g.lineTo(-w * .02, -h * .3); g.moveTo(-w * .1, h * .18); g.lineTo(w * .1, -h * .2); g.stroke();
        g.fillStyle = '#FFF7D9'; [-w * .14, 0, w * .14].forEach(x => { daire(g, x, -h / 2 + 4, 3); g.fill(); });
      } },
    { id: 'laptop', ad: 'Laptop', emoji: '💻', tur: 'vur', can: 2, guc: 12, w: 1.15, h: .82, ses: 'patlama', renk: ['#B8BFC9', '#2E3440', '#C9D0D8', '#6B7482', '#F6F8FA'], parca: 26,
      soz: ['Toplantı iptal.', 'Bilgisayar da dinlensin.', 'Kaydetmemiştin ama olsun.'],
      ek(n, x, y) { for (let i = 0; i < 8; i++) parcaEkle({ tur: 'tus', boy: 10, x: n.cx + (Math.random() - .5) * n.w * .8, y: n.cy + n.h * .3, yazi: 'ASDFGHJK'[i] }, x, y, 1); },
      ciz(g, n) {
        const w = n.w, h = n.h;
        ydk(g, -w * .42, -h / 2, w * .84, h * .62, 8); g.fillStyle = '#B8BFC9'; g.fill(); g.strokeStyle = '#6B7482'; g.lineWidth = 2; g.stroke();
        ydk(g, -w * .38, -h / 2 + 6, w * .76, h * .5, 4); g.fillStyle = '#2E3440'; g.fill();
        g.save(); g.clip();
        if (n.hasar > 0) { g.fillStyle = '#A9D6F2'; g.fillRect(-w * .38, -h / 2 + 6, w * .76, h * .5); g.fillStyle = '#2E3440'; g.font = 'bold 11px ' + YAZI_TIPI; g.textAlign = 'center'; g.fillText(':(', 0, -h * .16); }
        else {
          ['#FF9DB4', '#FFE28A', '#9FE3C4', '#A9D6F2'].forEach((c, i) => { g.fillStyle = c; g.globalAlpha = .8; ydk(g, -w * .32, -h / 2 + 14 + i * 9, w * (.2 + (i % 3) * .12), 4, 2); g.fill(); }); g.globalAlpha = 1;
          g.fillStyle = '#FF9DB4'; g.beginPath(); const hx = w * .22, hy = -h * .12, hr = 6; g.moveTo(hx, hy + hr); g.bezierCurveTo(hx - hr * 2, hy - hr * .5, hx - hr * .6, hy - hr * 1.8, hx, hy - hr * .4); g.bezierCurveTo(hx + hr * .6, hy - hr * 1.8, hx + hr * 2, hy - hr * .5, hx, hy + hr); g.fill();
        }
        g.restore(); catlakCiz(g, n);
        g.beginPath(); g.moveTo(-w * .46, h * .14); g.lineTo(w * .46, h * .14); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.fillStyle = '#C9D0D8'; g.fill(); g.strokeStyle = '#6B7482'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#F6F8FA'; for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) { ydk(g, -w * .36 + c * w * .066, h * .18 + r * h * .07, w * .05, h * .05, 1.5); g.fill(); }
        ydk(g, -w * .1, h * .4, w * .2, h * .07, 2); g.fillStyle = '#DDE2E8'; g.fill();
      } },
    { id: 'balon', ad: 'Balon', emoji: '🎈', tur: 'patlat', can: 1, guc: 4, w: .6, h: 1.0, ses: 'pat', renk: ['#FF9DB4', '#FFC1D1', '#E07A97'], parca: 10,
      soz: ['PAT!', 'Balon da bir gün patlar.', 'Pat dedi, gitti.'],
      ciz(g, n, t) {
        const w = n.w, h = n.h; const bob = azalt() ? 0 : Math.sin(t * 2 + n.cx) * 3;
        g.save(); g.translate(0, bob);
        g.strokeStyle = '#C9567F'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, h * .28); g.bezierCurveTo(w * .2, h * .35, -w * .2, h * .42, 0, h / 2 - bob); g.stroke();
        const gr = g.createRadialGradient(-w * .15, -h * .3, 4, 0, -h * .12, w * .55); gr.addColorStop(0, '#FFC1D1'); gr.addColorStop(1, '#FF9DB4');
        elips(g, 0, -h * .12, w / 2, h * .38); g.fillStyle = gr; g.fill(); g.strokeStyle = '#E07A97'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#E07A97'; g.beginPath(); g.moveTo(-4, h * .25); g.lineTo(4, h * .25); g.lineTo(0, h * .3); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,.7)'; elips(g, -w * .18, -h * .32, w * .08, h * .06); g.fill();
        g.restore();
      } },
    { id: 'patpat', ad: 'Patpat', emoji: '🫧', tur: 'patpat', can: 1, guc: .75, w: 1.15, h: .84, ses: 'pop', renk: ['#E3F1F8', '#FFFFFF'], parca: 8,
      soz: ['Hepsi patladı, dünya güzel.', 'Patpat bitti. Sakinlik: tavan.', 'Son baloncuk da gitti.'],
      hazirla(n) { // baloncuklar oransal (fx, fy = genişlik/yükseklik payı) → yeniden boyutlamada bozulmaz
        n.baloncuk = []; const kol = 5, sat = 4;
        n.fr = Math.min(.9 / kol, .84 * (n.h / n.w) / sat) * .46;
        for (let r = 0; r < sat; r++) for (let c = 0; c < kol; c++) n.baloncuk.push({ fx: -.45 + .9 * (c + .5) / kol, fy: -.42 + .84 * (r + .5) / sat, patladi: false });
      },
      ciz(g, n) {
        const w = n.w, h = n.h, r = n.fr * w;
        ydk(g, -w / 2, -h / 2, w, h, 8); g.fillStyle = 'rgba(227,241,248,.92)'; g.fill(); g.strokeStyle = '#B9D6E6'; g.lineWidth = 2; g.stroke();
        n.baloncuk.forEach(b => {
          const x = b.fx * w, y = b.fy * h;
          if (b.patladi) { g.strokeStyle = 'rgba(156,199,220,.55)'; g.lineWidth = 1.2; g.setLineDash([3, 3]); daire(g, x, y, r * .8); g.stroke(); g.setLineDash([]); return; }
          daire(g, x, y, r); g.fillStyle = 'rgba(255,255,255,.8)'; g.fill(); g.strokeStyle = '#9CC7DC'; g.lineWidth = 1.5; g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * .62, Math.PI * 1.1, Math.PI * 1.5); g.stroke();
        });
      } },
    { id: 'kagit', ad: 'Kâğıt', emoji: '📄', tur: 'yirt', can: 1, guc: 6, w: .8, h: 1.0, ses: 'yirt', renk: ['#FFFDF8', '#FFFDF8', '#C8DDF0'], parca: 10,
      soz: ['Yırt gitsin.', 'Kâğıt gitti, aklın rahat.', 'Parça parça, tam istediğin gibi.'],
      hazirla(n) { n.yirtik = []; n.ilerleme = 0; },
      ek(n, x, y) { for (let i = 0; i < 6; i++) parcaEkle({ tur: 'serit', renk: '#FFFDF8', w: 18 + Math.random() * 16, h: 6 + Math.random() * 4, x: n.cx + (Math.random() - .5) * n.w * .8, y: n.cy + (Math.random() - .5) * n.h * .8 }, x, y, .7); },
      ciz(g, n) {
        const w = n.w, h = n.h;
        ydk(g, -w / 2, -h / 2, w, h, 3); g.fillStyle = '#FFFDF8'; g.fill(); g.strokeStyle = '#E4DAD0'; g.lineWidth = 1.5; g.stroke();
        g.strokeStyle = '#C8DDF0'; g.lineWidth = 1; for (let y = -h / 2 + 22; y < h / 2 - 6; y += 12) { g.beginPath(); g.moveTo(-w / 2 + 6, y); g.lineTo(w / 2 - 6, y); g.stroke(); }
        g.strokeStyle = '#F5B5C2'; g.beginPath(); g.moveTo(-w / 2 + 16, -h / 2 + 4); g.lineTo(-w / 2 + 16, h / 2 - 4); g.stroke();
        g.fillStyle = '#EFE7DD'; g.beginPath(); g.moveTo(w / 2 - 14, -h / 2); g.lineTo(w / 2, -h / 2 + 14); g.lineTo(w / 2 - 14, -h / 2 + 14); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(138,147,166,.75)'; g.lineWidth = 1.6; g.lineCap = 'round';
        for (let i = 0; i < 5; i++) { const y = -h / 2 + 30 + i * 12, uz = w * (.35 + ((i * 7) % 4) * .1); g.beginPath(); g.moveTo(-w / 2 + 22, y); for (let x = 0; x < uz; x += 6) g.lineTo(-w / 2 + 22 + x, y + ((x / 6) % 2 ? -2 : 2)); g.stroke(); }
        if (n.yirtik.length > 1) {
          g.strokeStyle = 'rgba(59,42,58,.55)'; g.lineWidth = 2; g.beginPath(); n.yirtik.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1; g.setLineDash([2, 4]); g.stroke(); g.setLineDash([]);
        }
      } },
    { id: 'strestopu', ad: 'Stres topu', emoji: '🟡', tur: 'sik', can: 1, guc: 2.2, w: .72, h: .72, ses: 'pff', renk: ['#FFE58A', '#F5B54A'], parca: 0,
      soz: ['Sık, bırak, sık.', 'Top yoruldu ama sen daha iyisin.', 'Sekiz sıkma, sıfır dert.'],
      hazirla(n) { n.sik = 0; n.sikHedef = 0; n.sikSayi = 0; },
      ciz(g, n) {
        const r = n.w / 2, s = n.sik;
        g.save(); g.translate(0, r * .3 * s); g.scale(1 + s * .32, 1 - s * .3);
        const gr = g.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); gr.addColorStop(0, '#FFE58A'); gr.addColorStop(1, '#F5B54A');
        daire(g, 0, 0, r); g.fillStyle = gr; g.fill(); g.strokeStyle = '#C98A1F'; g.lineWidth = 2; g.stroke();
        g.strokeStyle = '#3B2A3A'; g.lineWidth = 2.2; g.lineCap = 'round'; g.fillStyle = '#3B2A3A';
        if (s > .5) { g.beginPath(); g.moveTo(-r * .38, -r * .22); g.lineTo(-r * .22, -r * .1); g.lineTo(-r * .38, r * .02); g.moveTo(r * .38, -r * .22); g.lineTo(r * .22, -r * .1); g.lineTo(r * .38, r * .02); g.stroke(); }
        else { daire(g, -r * .3, -r * .12, r * .07); g.fill(); daire(g, r * .3, -r * .12, r * .07); g.fill(); }
        g.beginPath(); if (s > .5) { g.ellipse(0, r * .22, r * .12, r * .16, 0, 0, Math.PI * 2); g.stroke(); } else { g.arc(0, r * .12, r * .22, Math.PI * .15, Math.PI * .85); g.stroke(); }
        g.fillStyle = 'rgba(255,157,180,.55)'; daire(g, -r * .5, r * .12, r * .1); g.fill(); daire(g, r * .5, r * .12, r * .1); g.fill();
        g.restore();
      } },
    { id: 'kumtorbasi', ad: 'Kum torbası', emoji: '🥊', tur: 'vur', can: 8, guc: 10, w: .62, h: 1.3, asili: true, salinim: .6, ses: 'kum', renk: ['#E06666', '#B83E3E', '#3B2A3A'], parca: 14, sarsinti: 2,
      soz: ['Kum torbası da pes etti.', 'Kum saçıldı, öfke uçtu.', 'Sekiz yumruk, bir torba.'],
      vurSoz: ['Güm!', 'Sallanıyor!', 'Bir daha, Cemre!', 'Torba dayanıyor… şimdilik.'],
      ek(n, x, y) { for (let i = 0; i < 40; i++) parcaEkle({ tur: 'nokta', renk: i % 3 ? '#E9D5A8' : '#D9B978', r: 1.4 + Math.random() * 1.6, x: n.cx + (Math.random() - .5) * n.w * .8, y: n.cy + (Math.random() - .5) * n.h * .8 }, x, y, .9); },
      ciz(g, n) {
        const w = n.w, h = n.h;
        ydk(g, -w / 2, -h / 2, w, h, w * .32); const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#E06666'); gr.addColorStop(.6, '#C94848'); gr.addColorStop(1, '#B83E3E'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#7A2626'; g.lineWidth = 2.5; g.stroke();
        g.fillStyle = '#3B2A3A'; ydk(g, -w / 2, -h / 2, w, h * .13, w * .32); g.fill(); ydk(g, -w / 2, h / 2 - h * .11, w, h * .11, w * .32); g.fill();
        g.fillStyle = 'rgba(255,255,255,.18)'; ydk(g, -w * .36, -h * .3, w * .12, h * .55, 4); g.fill();
        g.fillStyle = '#FFF7D9'; elips(g, 0, h * .05, w * .3, h * .11); g.fill();
        g.fillStyle = '#3B2A3A'; g.strokeStyle = '#3B2A3A'; g.lineWidth = 1.8; g.lineCap = 'round';
        if (n.hasar > .7) { g.beginPath(); g.moveTo(-w * .16, 0); g.lineTo(-w * .08, h * .06); g.moveTo(-w * .08, 0); g.lineTo(-w * .16, h * .06); g.moveTo(w * .08, 0); g.lineTo(w * .16, h * .06); g.moveTo(w * .16, 0); g.lineTo(w * .08, h * .06); g.stroke(); }
        else { daire(g, -w * .12, h * .03, 2.2); g.fill(); daire(g, w * .12, h * .03, 2.2); g.fill(); }
        g.beginPath(); if (n.hasar > .4) g.arc(0, h * .11, w * .07, Math.PI * 1.15, Math.PI * 1.85); else g.arc(0, h * .06, w * .08, Math.PI * .2, Math.PI * .8); g.stroke();
        if (n.hasar > .3) { g.fillStyle = '#E9D5A8'; const t = Math.floor(n.hasar * 4); for (let i = 0; i < t; i++) { g.beginPath(); g.moveTo(-w * .3 + i * w * .2, h * .25 + i * 6); g.lineTo(-w * .22 + i * w * .2, h * .18 + i * 6); g.lineTo(-w * .18 + i * w * .2, h * .3 + i * 6); g.closePath(); g.fill(); } }
      } }
  ];
  const ESYA = {}; ESYALAR.forEach(e => { ESYA[e.id] = e; });

  /* ------------------------------------------------------------ mikro-metin */
  const VURUS_YAZI = ['Şak!', 'Çat!', 'Tuz buz!', 'Güm!', 'Oh be!', 'Hah!', 'Paramparça!', 'Pat!'];
  const SERI_YAZI = { 3: 'Seri başladı!', 5: 'Terlik fırtınası!', 8: 'Durdurulamıyorsun!', 12: 'Paramparça ustası!', 20: 'Efsane seri!', 30: 'Oda tanımıyor seni!' };
  const IPUCULAR = ['Rafta ne varsa dokun, gerisi terliğin işi.', 'Alttaki tepsiden istediğin eşyayı rafa getir.', 'Öfke ölçer sıfırlanınca battaniye geri geliyor.', 'Piñata dört vuruş ister, şekerleri sen kap.', 'Kâğıdı parmağınla çekerek yırtabilirsin.', 'Stres topunu basılı tut, sonra bırak.'];
  const OLCER_SOZ = { 60: 'Öfke ölçer düşüyor, böyle devam.', 30: 'Az kaldı Cemre, sonra nefes.', 10: 'Son birkaç parça, sonra battaniye.' };
  const NEFES_SOZ = { al: ['İçine çek…', 'Yavaşça al…', 'Burnundan, sessizce…'], tut: ['Tut, tut…', 'Şimdi dur…', 'Havayı sakla…'], ver: ['Yavaşça bırak…', 'Fuuu…', 'Hepsini ver…'] };
  const ROZETLER = [
    { id: 'ilk', ad: 'İlk kırık', emoji: '🍽️', sart: 'İlk eşyayı kır', kontrol: d => d.toplam >= 1 },
    { id: 'terlik', ad: 'Terlik ustası', emoji: '🩴', sart: 'Terlikle 20 eşya', kontrol: d => (d.aletSayi.terlik || 0) >= 20 },
    { id: 'seri5', ad: 'Beşli seri', emoji: '🔥', sart: '5 seri yap', kontrol: d => d.enIyiSeri >= 5 },
    { id: 'seri12', ad: 'Fırtına', emoji: '🌪️', sart: '12 seri yap', kontrol: d => d.enIyiSeri >= 12 },
    { id: 'yuz', ad: 'Yüz parça', emoji: '💯', sart: 'Toplam 100 eşya', kontrol: d => d.toplam >= 100 },
    { id: 'patpat', ad: 'Patpat bitirici', emoji: '🫧', sart: 'Bir patpatı bitir', kontrol: d => (d.kirilan.patpat || 0) >= 1 },
    { id: 'pinyata', ad: 'Şeker yağmuru', emoji: '🪅', sart: 'Piñatayı patlat', kontrol: d => (d.kirilan.pinyata || 0) >= 1 },
    { id: 'karpuz', ad: 'Karpuz festivali', emoji: '🍉', sart: '5 karpuz', kontrol: d => (d.kirilan.karpuz || 0) >= 5 },
    { id: 'kum', ad: 'Torba pes etti', emoji: '🥊', sart: 'Kum torbasını yır', kontrol: d => (d.kirilan.kumtorbasi || 0) >= 1 },
    { id: 'nefes', ad: 'Nefes ustası', emoji: '🌬️', sart: '3 kez sakinleş', kontrol: d => d.seans >= 3 },
    { id: 'hepsi', ad: 'Her şeyi denedi', emoji: '🏆', sart: 'Her eşyadan birini kır', kontrol: d => ESYALAR.every(e => (d.kirilan[e.id] || 0) >= 1) }
  ];

  const IKON = '<svg viewBox="0 0 64 64"><path d="M23 6c9-2 17 5 19 17 2 11 0 25-6 34-4 6-13 6-17 0C13 48 11 34 13 22 14 14 17 8 23 6z" fill="#F29DBC" stroke="#C9567F" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 28c8-6 18-5 24 3" fill="none" stroke="#C9567F" stroke-width="3" stroke-linecap="round"/><path d="M48 8l3 8M54 14l-6 4M56 24h-8" stroke="var(--ofke)" stroke-width="2.6" stroke-linecap="round"/><path d="M6 12l4 4M4 22h6" stroke="var(--ofke)" stroke-width="2.4" stroke-linecap="round"/></svg>';

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null;
  const ui = {};
  const zamanlar = new Set();
  const abonelikler = [];
  let raf = 0, sonTs = 0, sure = 0, duraklat = false;
  let canvas = null, g = null, W = 0, H = 0, DPR = 1, U = 90, rafY = 0, zeminY = 0;
  let nesneler = [], parcalar = [], kalintilar = [], benekler = [];
  let alet = ALETLER[0];
  let seri = 0, sonVurus = 0, olcerSozVerildi = {};
  let surukle = null, sonPopZaman = 0, sonYirtSes = 0, ilkVurus = false;
  let pal = {};
  let gozlemci = null;
  let sakinMod = false, nefes = null;
  let yaziSayisi = 0, ipucuT = 0, ipucuSira = 0;

  const azalt = () => !!(ctx && ctx.azHareket);
  const rastgele = a => CD.rastgele(a);
  function sonra(fn, ms) { const t = setTimeout(() => { zamanlar.delete(t); if (ctx) fn(); }, ms); zamanlar.add(t); return t; }
  function iptal(t) { clearTimeout(t); zamanlar.delete(t); }
  function hepsiniIptal() { zamanlar.forEach(clearTimeout); zamanlar.clear(); }

  function varsayilan() {
    return { ofke: 100, toplam: 0, bugun: { tarih: CD.bugun(), sayi: 0 }, enIyiSeri: 0, kirilan: {}, aletSayi: {}, alet: 'terlik', seans: 0, nefesTur: 0, rozetler: [], sonGorulme: Date.now() };
  }
  function yukle() {
    const v = Object.assign(varsayilan(), ctx.depo.al('durum', {}));
    if (!v.kirilan || typeof v.kirilan !== 'object') v.kirilan = {};
    if (!v.aletSayi || typeof v.aletSayi !== 'object') v.aletSayi = {};
    if (!Array.isArray(v.rozetler)) v.rozetler = [];
    if (!v.bugun || v.bugun.tarih !== CD.bugun()) v.bugun = { tarih: CD.bugun(), sayi: 0 };
    if (typeof v.ofke !== 'number' || isNaN(v.ofke)) v.ofke = 100;
    v.ofke = CD.sinirla(v.ofke, 0, 100);
    if (!ALETLER.some(a => a.id === v.alet)) v.alet = 'terlik';
    return v;
  }
  function kaydet() {
    if (!ctx || !d) return;
    d.sonGorulme = Date.now();
    ctx.depo.yaz('durum', d);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function ipucuMetni() {
    if (d.bugun.sayi > 0) return 'Bugün ' + d.bugun.sayi + ' eşya kırdın 🩴';
    if (d.enIyiSeri >= 5) return 'En iyi seri: ' + d.enIyiSeri + ' 🔥';
    if (d.seans > 0) return d.seans + ' kez sakinleştin 🌬️';
    return '';
  }

  /* ------------------------------------------------------------ renk paleti (tokens → canvas) */
  function hexOku(ad) {
    const v = getComputedStyle(kok).getPropertyValue(ad).trim();
    const m = v.match(/^#([0-9a-f]{6})$/i); if (!m) return null;
    const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function karis(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
  const rgb = (c, a) => a == null ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + a + ')';
  function paletOku() {
    const griZemin = hexOku('--gri-zemin') || [233, 235, 239], gri = hexOku('--gri') || [122, 128, 144], kagit = hexOku('--kagit') || [255, 249, 243], murekkep = hexOku('--murekkep') || [59, 52, 68];
    pal = {
      duvar: karis(griZemin, gri, .12), duvarAcik: karis(griZemin, kagit, .3), zemin: karis(griZemin, gri, .42), zeminKoyu: karis(griZemin, gri, .6),
      benek: rgb(kagit, .35), benekKoyu: rgb(gri, .16), murekkep, golge: rgb(murekkep, .16), raf: '#C8A27A', rafKoyu: '#9C7551', ip: '#8A7158'
    };
  }

  /* ------------------------------------------------------------ sahne ölçüsü */
  function boyutla() {
    if (!canvas || !ui.sahneKap) return;
    const r = ui.sahneKap.getBoundingClientRect();
    W = Math.max(240, Math.round(r.width)); H = Math.max(200, Math.round(r.height));
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    g = canvas.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    U = CD.sinirla(Math.min(W * .23, H * .4), 60, 120);
    rafY = Math.round(H * .68); zeminY = H - 6;
    // benekler oransal ve sabit tohumlu: adres çubuğu açılıp kapanınca (resize) duvar "titremesin"
    if (!benekler.length) { let t = 20260829; const r = () => { t = (t * 1664525 + 1013904223) % 4294967296; return t / 4294967296; }; for (let i = 0; i < 90; i++) benekler.push([r(), r(), 1 + r() * 1.6, i % 3 === 0]); }
    nesneler.forEach(yerlestir);
    ciz(); // hemen çiz (döngü duraklamışsa bile)
  }
  const yerX = i => W * (RAF_YER === 1 ? .5 : (.22 + i * (.56 / (RAF_YER - 1))));
  function yerlestir(n) {
    n.w = n.tanim.w * U; n.h = n.tanim.h * U; n.cx = yerX(n.yer);
    if (n.tanim.asili) { n.L = Math.max(30, H * .42 - n.h / 2 - 8); n.cy = 8 + n.L + n.h / 2; }
    else n.cy = rafY - n.h / 2;
    if (n.tanim.hazirla && !n.hazir) { n.tanim.hazirla(n); n.hazir = true; }
  }

  /* ------------------------------------------------------------ eşya yaşam döngüsü */
  function nesneYap(id, yer, dus) {
    const tanim = ESYA[id]; if (!tanim) return null;
    const n = { id, tanim, yer, can: tanim.can, hasar: 0, sq: 0, olu: false, aci: 0, hiz: 0, dy: 0, vy: 0, dusuyor: false, dogum: sure, catlak: null, hazir: false, zilT: 3 + Math.random() * 4 };
    yerlestir(n);
    if (dus) {
      if (tanim.asili) n.hiz = (Math.random() < .5 ? -1 : 1) * 1.3 * (tanim.salinim || 1);   // asılı eşya hafif sallanarak gelir
      else if (!azalt()) { n.dusuyor = true; n.dy = -(H * .9); n.vy = 0; }    // raftaki eşya yukarıdan düşer
    }
    return n;
  }
  function bosYer() { for (let i = 0; i < RAF_YER; i++) if (!nesneler.some(n => n.yer === i && !n.olu)) return i; return -1; }
  function rastgeleId(haric) {
    const rafta = new Set(nesneler.filter(n => !n.olu).map(n => n.id)); if (haric) rafta.add(haric);
    let aday = ESYALAR.filter(e => !rafta.has(e.id)); if (!aday.length) aday = ESYALAR;
    return rastgele(aday).id;
  }
  function getir(id, zorla) {
    let yer = bosYer();
    if (yer < 0) {
      if (!zorla) return false;
      const eski = nesneler.filter(n => !n.olu).sort((a, b) => a.dogum - b.dogum)[0];
      if (!eski) return false;
      yer = eski.yer; eski.olu = true; eski.kayb = 1;
    }
    nesneler = nesneler.filter(n => !n.olu || n.kayb);
    const n = nesneYap(id, yer, true); if (!n) return false;
    nesneler.push(n);
    ctx.ses.hop();
    return true;
  }
  function otomatikDoldur() { while (bosYer() >= 0) { const y = bosYer(); nesneler.push(nesneYap(rastgeleId(), y, true)); } }
  function ilkKurulum() {
    nesneler = [];
    const ilk = ['tabak', 'karpuz', 'vazo'];
    for (let i = 0; i < RAF_YER; i++) nesneler.push(nesneYap(ilk[i] || rastgeleId(), i, true));
  }

  /* ------------------------------------------------------------ parçacıklar */
  function parcaEkle(p, vx0, vy0, hizCarpan) {
    if (parcalar.length >= PARCA_MAKS) return;
    const dx = p.x - vx0, dy = p.y - vy0, uz = Math.max(8, Math.hypot(dx, dy));
    const hiz = (180 + Math.random() * 360) * (hizCarpan || 1);
    p.vx = dx / uz * hiz + (Math.random() - .5) * 160;
    p.vy = dy / uz * hiz - 160 - Math.random() * 260;
    p.rot = Math.random() * Math.PI * 2; p.vr = (Math.random() - .5) * 14;
    p.alpha = 1; p.durgun = 0; p.omur = 0;
    if (p.tur === 'poli' && !p.pts) {
      const k = 3 + Math.floor(Math.random() * 3), r = p.r || 8; p.pts = [];
      for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2, rr = r * (.55 + Math.random() * .6); p.pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    }
    parcalar.push(p);
  }
  function parcala(n, x, y, sayi) {
    const t = n.tanim; sayi = sayi == null ? t.parca : sayi;
    if (azalt()) sayi = Math.min(sayi, 6);
    for (let i = 0; i < sayi; i++) {
      parcaEkle({ tur: 'poli', renk: rastgele(t.renk), kenar: !!t.kenar, r: 5 + Math.random() * (n.w * .12), x: n.cx + (Math.random() - .5) * n.w * .9, y: n.cy + n.dy + (Math.random() - .5) * n.h * .9 }, x, y, 1);
    }
    if (t.ek && !azalt()) t.ek(n, x, y);
  }
  function parcaGuncelle(dt) {
    const yeni = [];
    for (let i = 0; i < parcalar.length; i++) {
      const p = parcalar[i];
      p.vy += YERCEKIMI * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.omur += dt;
      const r = p.r || p.boy || p.w || 8;
      if (p.y > zeminY - r * .4) { p.y = zeminY - r * .4; if (Math.abs(p.vy) > 60) { p.vy = -p.vy * .32; p.vx *= .72; p.vr *= .5; } else { p.vy = 0; p.vx *= .8; p.vr *= .6; p.durgun += dt; } }
      if (p.x < 4) { p.x = 4; p.vx = Math.abs(p.vx) * .5; } else if (p.x > W - 4) { p.x = W - 4; p.vx = -Math.abs(p.vx) * .5; }
      if (p.durgun > 1.2 || p.omur > 4.5) { p.alpha -= dt * 2; }
      if (p.alpha <= 0) { // yere inen parça soluk bir kalıntı olarak kalır (oda "kullanılmış" görünsün)
        if (p.tur === 'poli' && p.durgun > 0) { if (kalintilar.length >= KALINTI_MAKS) kalintilar.shift(); kalintilar.push({ x: p.x, y: p.y, rot: p.rot, pts: p.pts, renk: p.renk }); }
        continue;
      }
      yeni.push(p);
    }
    parcalar = yeni;
  }
  function parcaCiz(p) {
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    if (p.tur === 'poli') { g.fillStyle = p.renk; g.beginPath(); p.pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); if (p.kenar) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.stroke(); } }
    else if (p.tur === 'nokta') { g.fillStyle = p.renk; daire(g, 0, 0, p.r); g.fill(); }
    else if (p.tur === 'serit') { g.fillStyle = p.renk; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.strokeStyle = 'rgba(200,221,240,.9)'; g.lineWidth = 1; g.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); }
    else if (p.tur === 'tus') { ydk(g, -p.boy * .6, -p.boy * .6, p.boy * 1.2, p.boy * 1.2, 3); g.fillStyle = '#F6F8FA'; g.fill(); g.strokeStyle = '#9AA3B0'; g.lineWidth = 1; g.stroke(); g.fillStyle = '#3B3444'; g.font = 'bold ' + Math.round(p.boy * .8) + 'px ' + YAZI_TIPI; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.yazi, 0, 1); }
    else if (p.tur === 'yazi') { g.font = (p.renk ? 'bold ' : '') + Math.round(p.boy) + 'px ' + YAZI_TIPI; g.textAlign = 'center'; g.textBaseline = 'middle'; if (p.renk) g.fillStyle = p.renk; g.fillText(p.yazi, 0, 0); }
    g.restore();
  }

  /* ------------------------------------------------------------ çizim */
  function odaCiz() {
    g.fillStyle = rgb(pal.duvar); g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H * .74); gr.addColorStop(0, rgb(pal.duvarAcik, .55)); gr.addColorStop(1, rgb(pal.duvar, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H * .74);
    for (let i = 0; i < benekler.length; i++) { const b = benekler[i]; g.fillStyle = b[3] ? pal.benekKoyu : pal.benek; g.fillRect(b[0] * W, b[1] * H, b[2], b[2]); }
    // zemin
    const zy = Math.round(H * .74);
    const zg = g.createLinearGradient(0, zy, 0, H); zg.addColorStop(0, rgb(pal.zemin)); zg.addColorStop(1, rgb(pal.zeminKoyu)); g.fillStyle = zg; g.fillRect(0, zy, W, H - zy);
    g.fillStyle = rgb(pal.murekkep, .12); g.fillRect(0, zy - 3, W, 3);
    g.strokeStyle = rgb(pal.murekkep, .07); g.lineWidth = 1; for (let x = 0; x < W; x += 28) { g.beginPath(); g.moveTo(x, zy); g.lineTo(x + (x - W / 2) * .35, H); g.stroke(); }
    // raf
    g.fillStyle = pal.rafKoyu; g.fillRect(W * .08, rafY + 8, W * .84, 5);
    g.fillStyle = pal.raf; g.fillRect(W * .06, rafY - 2, W * .88, 10);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(W * .06, rafY - 2, W * .88, 2);
    g.fillStyle = pal.rafKoyu; [W * .14, W * .5, W * .86].forEach(x => { g.beginPath(); g.moveTo(x - 6, rafY + 8); g.lineTo(x + 6, rafY + 8); g.lineTo(x, rafY + 26); g.closePath(); g.fill(); });
    // tavan askı çubuğu (asılı eşya varsa)
    if (nesneler.some(n => n.tanim.asili && !n.olu)) { g.fillStyle = rgb(pal.murekkep, .35); g.fillRect(W * .08, 4, W * .84, 4); }
    // kalıntılar
    for (let i = 0; i < kalintilar.length; i++) { const k = kalintilar[i]; g.save(); g.translate(k.x, k.y); g.rotate(k.rot); g.globalAlpha = .55; g.fillStyle = k.renk; g.beginPath(); k.pts.forEach((q, j) => j ? g.lineTo(q[0] * .8, q[1] * .8) : g.moveTo(q[0] * .8, q[1] * .8)); g.closePath(); g.fill(); g.restore(); }
  }
  function nesneCiz(n) {
    g.save();
    if (n.tanim.asili) {
      g.translate(n.cx, 8); g.rotate(n.aci);
      g.strokeStyle = pal.ip; g.lineWidth = 3; g.setLineDash(n.id === 'kumtorbasi' ? [6, 4] : []); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, n.L); g.stroke(); g.setLineDash([]);
      g.fillStyle = pal.ip; daire(g, 0, 0, 4); g.fill();
      g.translate(0, n.L + n.h / 2);
    } else {
      g.fillStyle = pal.golge; elips(g, n.cx, rafY + 2, n.w * .48, 5); g.fill();
      g.translate(n.cx, n.cy + n.dy);
    }
    if (n.kayb) g.globalAlpha = Math.max(0, n.kayb);
    const sq = n.sq; if (sq > 0) { g.translate(0, n.h / 2); g.scale(1 + sq * .14, 1 - sq * .16); g.translate(0, -n.h / 2); g.translate((Math.random() - .5) * sq * 4, 0); }
    n.tanim.ciz(g, n, sure);
    g.restore();
  }
  function ciz() {
    if (!g) return;
    g.clearRect(0, 0, W, H);
    odaCiz();
    for (let i = 0; i < nesneler.length; i++) nesneCiz(nesneler[i]);
    for (let i = 0; i < parcalar.length; i++) parcaCiz(parcalar[i]);
  }

  /* ------------------------------------------------------------ güncelleme */
  function guncelle(dt) {
    sure += dt;
    for (let i = nesneler.length - 1; i >= 0; i--) {
      const n = nesneler[i];
      if (n.kayb != null) { n.kayb -= dt * 3; if (n.kayb <= 0) { nesneler.splice(i, 1); continue; } }
      if (n.sq > 0) n.sq = Math.max(0, n.sq - dt * 4.5);
      if (n.dusuyor) { n.vy += YERCEKIMI * dt; n.dy += n.vy * dt; if (n.dy >= 0) { n.dy = 0; if (n.vy > 160 && !azalt()) { n.vy = -n.vy * .28; ctx.ses.uf(); n.sq = .8; } else { n.vy = 0; n.dusuyor = false; n.sq = .5; } } }
      if (n.tanim.asili) {
        const ivme = -(YERCEKIMI / Math.max(40, n.L)) * Math.sin(n.aci) * .5 - n.hiz * 1.15;
        n.hiz += ivme * dt; n.aci += n.hiz * dt;
        if (!azalt() && Math.abs(n.hiz) < .12 && Math.abs(n.aci) < .05) n.hiz += Math.sin(sure * 1.3 + n.yer) * .015 * dt;
      }
      if (n.tanim.tur === 'sik') { n.sik += (n.sikHedef - n.sik) * Math.min(1, dt * 12); }
      if (n.tanim.zil && !azalt()) { n.zilT -= dt; if (n.zilT <= 0) { n.zilAktif = true; n.zilT = 4 + Math.random() * 5; sonra(() => { n.zilAktif = false; }, 500); } }
    }
    parcaGuncelle(dt);
    if (seri > 0 && performance.now() - sonVurus > SERI_SURE) { seri = 0; seriGoster(); }
    if (ui.seriSure && seri > 0) ui.seriSure.style.transform = 'scaleX(' + Math.max(0, 1 - (performance.now() - sonVurus) / SERI_SURE) + ')';
  }
  function dongu(ts) {
    raf = requestAnimationFrame(dongu);
    if (duraklat) return;
    const dt = Math.min(.034, (ts - sonTs) / 1000 || .016); sonTs = ts;
    guncelle(dt); ciz();
  }

  /* ------------------------------------------------------------ vuruş */
  function sahneNoktasi(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function nesneBul(x, y) {
    for (let i = nesneler.length - 1; i >= 0; i--) {
      const n = nesneler[i]; if (n.olu) continue;
      let cx = n.cx, cy = n.cy + n.dy;
      if (n.tanim.asili) { cx = n.cx + Math.sin(n.aci) * (n.L + n.h / 2); cy = 8 + Math.cos(n.aci) * (n.L + n.h / 2); }
      const pay = n.tanim.asili ? 18 : 12;
      if (x >= cx - n.w / 2 - pay && x <= cx + n.w / 2 + pay && y >= cy - n.h / 2 - pay && y <= cy + n.h / 2 + pay) return n;
    }
    return null;
  }
  function aletSesi() {
    if (alet.vurus === 'sak') sesEk.sak(); else if (alet.vurus === 'gum') ctx.ses.gum(); else if (alet.vurus === 'vin') sesEk.vin(); else sesEk.pat();
  }
  function esyaSesi(ad) {
    switch (ad) {
      case 'kirilma': ctx.ses.kirilma(); break;
      case 'catir': ctx.ses.catir(); break;
      case 'patlama': ctx.ses.gum(); ctx.ses.kirilma(); break;
      case 'sap': sesEk.sap(); break;
      case 'pat': sesEk.patla(); break;
      case 'pop': ctx.ses.pop(); break;
      case 'yirt': ctx.ses.torpu(); break;
      case 'pff': sesEk.pff(); break;
      case 'kum': ctx.ses.gum(); sesEk.kum(); break;
      case 'pinyata': ctx.ses.zafer(); sesEk.kum(); break;
      default: ctx.ses.catir();
    }
  }
  function vurusYazisi(x, y, metin, buyuk) {
    if (!ui.sahneKap || yaziSayisi >= 6) return;   // az hareket: CSS yalnızca soluklaşır, yazı yine görünür (site ölü görünmesin)
    yaziSayisi++;
    const s = ctx.el('span.ofke-vurus-yazi' + (buyuk ? '.buyuk' : ''), { 'aria-hidden': 'true', stil: { left: x + 'px', top: y + 'px', '--don': ((Math.random() - .5) * 24) + 'deg' } }, metin);
    ui.sahneKap.appendChild(s); sonra(() => { s.remove(); yaziSayisi--; }, 800);
  }
  function seriArtir() {
    const simdi = performance.now();
    seri = (simdi - sonVurus < SERI_SURE) ? seri + 1 : 1; sonVurus = simdi;
    if (seri > d.enIyiSeri) d.enIyiSeri = seri;
    seriGoster();
    if (SERI_YAZI[seri]) { vurusYazisi(W / 2, H * .22, SERI_YAZI[seri], true); ctx.ses.parilti(); if (seri >= 8) ctx.efekt.konfeti(undefined, undefined, 12); }
  }
  function seriGoster() {
    if (!ui.seri) return;
    ui.seri.classList.toggle('aktif', seri >= 2);
    ui.seriSayi.textContent = 'x' + Math.max(1, seri);
    if (seri >= 2) { ui.seri.classList.remove('zipla'); void ui.seri.offsetWidth; ui.seri.classList.add('zipla'); }
  }
  function olcerAzalt(miktar) {
    const carpan = 1 + Math.min(.5, seri * .04);
    const eski = d.ofke;
    d.ofke = CD.sinirla(d.ofke - miktar * carpan, 0, 100);
    olcerGoster();
    Object.keys(OLCER_SOZ).forEach(esik => { esik = +esik; if (eski > esik && d.ofke <= esik && !olcerSozVerildi[esik]) { olcerSozVerildi[esik] = true; ipucuYaz(OLCER_SOZ[esik]); } });
    if (d.ofke <= 0 && !sakinMod) { kaydet(); sonra(sakinlesmeyeGec, 1100); }
  }
  function olcerGoster() {
    if (!ui.olcerDolu) return;
    const y = Math.round(d.ofke);
    ui.olcerDolu.style.width = y + '%'; ui.olcerYuzde.textContent = y; ui.olcer.setAttribute('aria-valuenow', String(y));
    ui.olcer.classList.toggle('dusuk', y <= 30);
  }
  function aletGoster(x, y, salla) {
    if (!ui.alet) return;
    ui.alet.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    ui.alet.classList.add('goster');
    if (salla) { ui.aletIc.classList.remove('vur'); void ui.aletIc.offsetWidth; ui.aletIc.classList.add('vur'); }
    if (CD.dokunmatik) { iptal(ui.aletT); ui.aletT = sonra(() => ui.alet.classList.remove('goster'), 700); }
  }
  function sayac(n) {
    d.toplam++; d.bugun.sayi++; d.kirilan[n.id] = (d.kirilan[n.id] || 0) + 1; d.aletSayi[alet.id] = (d.aletSayi[alet.id] || 0) + 1;
  }
  function kir(n, x, y) {
    if (n.olu) return;
    n.olu = true; n.kayb = 0.01;
    esyaSesi(n.tanim.ses);
    parcala(n, x, y);
    // güçlü sarsıntı #bolumIcerik'e (kok): #bolum'a verilirse base.css'teki giriş animasyonu (bolum-gel) yeniden oynar ve ekran bir an kararır
    ctx.efekt.sarsinti(n.tanim.sarsinti > 1 ? kok : ui.sahneKap, n.tanim.sarsinti || 1);
    vurusYazisi(x, y - 20, rastgele(VURUS_YAZI));
    ipucuYaz(rastgele(n.tanim.soz));
    sayac(n); olcerAzalt(n.tanim.guc);
    rozetKontrol(); ozetGoster(); kaydet();
    sonra(() => { if (!sakinMod) otomatikDoldur(); }, 900 + Math.random() * 500);
  }
  function vur(n, x, y) {
    if (!n || n.olu || n.dusuyor) return;
    ilkVurus = true;
    aletSesi(); n.sq = 1;
    const t = n.tanim;
    if (t.asili) n.hiz += (x < n.cx + Math.sin(n.aci) * n.L ? 1 : -1) * (1.1 + Math.random() * .5) * (t.salinim || 1);
    if (t.tur === 'patlat') { seriArtir(); kir(n, x, y); return; }
    if (t.tur === 'patpat') { if (!n.bitiyor) baloncukPatlat(n, x, y, true); return; }
    if (t.tur === 'yirt') { yirt(n, x, y, n.w * .3, true); return; }
    if (t.tur === 'sik') { return; } // basılı tutma ile
    seriArtir();
    n.can -= alet.hasar;
    if (n.can <= 0) { kir(n, x, y); return; }
    // hasar aldı ama duruyor
    n.hasar = 1 - n.can / t.can;
    const yx = x - n.cx, yy = y - (n.cy + n.dy);
    if (!t.asili) catlakUret(n, CD.sinirla(yx, -n.w * .4, n.w * .4), CD.sinirla(yy, -n.h * .4, n.h * .4));
    ctx.ses.catir(); ctx.efekt.sarsinti(ui.sahneKap, 1);
    parcala(n, x, y, 4);
    vurusYazisi(x, y - 20, t.vurSoz ? rastgele(t.vurSoz) : rastgele(['Çat!', 'Bir daha!', 'Çatladı!']));
    olcerAzalt(t.tur === 'vur' && t.can > 2 ? 2 : 1.5);
  }
  function baloncukPatlat(n, x, y, tik) {
    // dokunma: en yakın baloncuk (geniş pay); sürükleme: parmağın altındaki hepsi (parmak ~ 14px)
    const lx = x - n.cx, ly = y - (n.cy + n.dy), r = n.fr * n.w;
    const esik = tik ? Math.max(r * 2.4, 18) : Math.max(r * 1.7, 14);
    let hedefler = [];
    if (tik) {
      let hedef = null, enYakin = Infinity;
      n.baloncuk.forEach(b => { if (b.patladi) return; const u = Math.hypot(b.fx * n.w - lx, b.fy * n.h - ly); if (u < enYakin) { enYakin = u; hedef = b; } });
      if (hedef && enYakin <= esik) hedefler.push(hedef);
    } else hedefler = n.baloncuk.filter(b => !b.patladi && Math.hypot(b.fx * n.w - lx, b.fy * n.h - ly) <= esik);
    if (!hedefler.length) return;
    hedefler.forEach((hedef, i) => {
      hedef.patladi = true;
      seriArtir(); olcerAzalt(n.tanim.guc);
      if (!azalt() && i < 3) parcaEkle({ tur: 'poli', renk: 'rgba(255,255,255,.9)', r: 4, x: n.cx + hedef.fx * n.w, y: n.cy + n.dy + hedef.fy * n.h }, x, y + 30, .5);
    });
    const simdi = performance.now(); if (simdi - sonPopZaman > 45) { ctx.ses.pop(); sonPopZaman = simdi; }
    if (tik) vurusYazisi(x, y - 16, 'pıt');
    if (n.baloncuk.every(b => b.patladi)) { n.bitiyor = true; sonra(() => { ctx.ses.parilti(); kir(n, x, y); }, 200); }
  }
  function yirt(n, x, y, miktar, tik) {
    n.ilerleme += miktar;
    const lx = CD.sinirla(x - n.cx, -n.w / 2, n.w / 2), ly = CD.sinirla(y - (n.cy + n.dy), -n.h / 2, n.h / 2);
    const son = n.yirtik[n.yirtik.length - 1];
    if (!son || Math.hypot(son[0] - lx, son[1] - ly) > 6) { n.yirtik.push([lx + (Math.random() - .5) * 5, ly + (Math.random() - .5) * 5]); if (n.yirtik.length > 60) n.yirtik.shift(); }
    const simdi = performance.now(); if (simdi - sonYirtSes > 140) { ctx.ses.torpu(); sonYirtSes = simdi; }
    if (tik) { seriArtir(); vurusYazisi(x, y - 16, 'cırt'); if (!azalt()) parcaEkle({ tur: 'serit', renk: '#FFFDF8', w: 10, h: 4, x, y }, x, y + 20, .5); }
    if (n.ilerleme >= n.w * 1.15) { seriArtir(); kir(n, x, y); }
  }
  function sikBaslat(n) { n.sikHedef = 1; n.sikiyor = true; sesEk.pff(); }
  function sikBirak(n, x, y) {
    if (!n.sikiyor) return; n.sikiyor = false; n.sikHedef = 0; n.sikSayi++;
    ctx.ses.blop(); seriArtir(); olcerAzalt(n.tanim.guc);
    vurusYazisi(x, y - 30, rastgele(['pof', 'fış', 'fışş', 'oh']));
    if (n.sikSayi >= 8) { sonra(() => { ipucuYaz(rastgele(n.tanim.soz)); n.olu = true; n.kayb = 1; sayac(n); rozetKontrol(); ozetGoster(); kaydet(); sonra(() => { if (!sakinMod) otomatikDoldur(); }, 600); }, 250); }
  }

  /* ------------------------------------------------------------ pointer */
  function pointerDown(e) {
    if (sakinMod || !canvas) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
    const p = sahneNoktasi(e);
    aletGoster(p.x, p.y, true);
    const n = nesneBul(p.x, p.y);
    surukle = { n, x: p.x, y: p.y, id: e.pointerId };
    if (!n) { ctx.ses.tik(); if (!azalt()) ctx.efekt.toz(e.clientX, e.clientY, 3); vurusYazisi(p.x, p.y - 10, rastgele(['boşa', 'hop', 'ıska'])); return; }
    if (n.tanim.tur === 'sik') { aletSesi(); sikBaslat(n); return; }
    vur(n, p.x, p.y);
  }
  function pointerMove(e) {
    if (sakinMod || !canvas) return;
    const p = sahneNoktasi(e);
    if (!surukle) { if (e.pointerType === 'mouse') aletGoster(p.x, p.y, false); return; }
    if (e.pointerId !== surukle.id) return;
    const n = surukle.n; if (!n || n.olu) return;
    const uz = Math.hypot(p.x - surukle.x, p.y - surukle.y);
    if (n.tanim.tur === 'patpat') { if (!n.bitiyor && nesneBul(p.x, p.y) === n) baloncukPatlat(n, p.x, p.y, false); }
    else if (n.tanim.tur === 'yirt' && uz > 3) { if (nesneBul(p.x, p.y) === n) yirt(n, p.x, p.y, uz * .9, false); }
    surukle.x = p.x; surukle.y = p.y;
    if (e.pointerType === 'mouse') aletGoster(p.x, p.y, false);
  }
  function pointerUp(e) {
    if (!surukle) return;
    if (e.pointerId != null && e.pointerId !== surukle.id) return;
    const n = surukle.n; surukle = null;
    if (n && n.tanim.tur === 'sik' && !n.olu) { const p = canvas ? sahneNoktasi(e) : { x: n.cx, y: n.cy }; sikBirak(n, p.x, p.y); }
  }
  function klavye(e) {
    if (sakinMod) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const canli = nesneler.filter(n => !n.olu && !n.dusuyor); if (!canli.length) return;
      const n = rastgele(canli); const x = n.cx, y = n.cy + n.dy;
      aletGoster(x, y, true);
      if (n.tanim.tur === 'sik') { sikBaslat(n); sonra(() => sikBirak(n, x, y), 350); return; }
      vur(n, x, y);
    }
  }

  /* ------------------------------------------------------------ ek sesler (Web Audio, çekirdek bağlamı üstünden) */
  const sesEk = {
    hazir() { try { const c = ctx && ctx.ses.baglam(); const m = ctx && ctx.ses.master; return (c && m) ? { c, m } : null; } catch (e) { return null; } },
    gurultu(sure, kazanc, tip, f0, f1, q) {
      const h = this.hazir(); if (!h) return; const { c, m } = h;
      const n = Math.floor(c.sampleRate * sure), b = c.createBuffer(1, n, c.sampleRate), veri = b.getChannelData(0);
      for (let i = 0; i < n; i++) veri[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = tip; f.Q.value = q || 1; const t = c.currentTime;
      f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + sure);
      const gg = c.createGain(); gg.gain.setValueAtTime(.0001, t); gg.gain.exponentialRampToValueAtTime(kazanc, t + .006); gg.gain.exponentialRampToValueAtTime(.0001, t + sure);
      s.connect(f); f.connect(gg); gg.connect(m); s.start(t); s.stop(t + sure + .02);
    },
    ton(tip, f0, f1, sure, kazanc, gecik) {
      const h = this.hazir(); if (!h) return; const { c, m } = h;
      const o = c.createOscillator(), gg = c.createGain(); o.type = tip; const t = c.currentTime + (gecik || 0);
      o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + sure);
      gg.gain.setValueAtTime(.0001, t); gg.gain.exponentialRampToValueAtTime(kazanc, t + .008); gg.gain.exponentialRampToValueAtTime(.0001, t + sure);
      o.connect(gg); gg.connect(m); o.start(t); o.stop(t + sure + .02);
    },
    sak() { this.gurultu(.07, .16, 'bandpass', 1500, 700, 1.2); this.ton('sine', 200, 90, .08, .1); },
    vin() { this.gurultu(.18, .07, 'bandpass', 500, 2400, 1.5); },
    pat() { this.ton('triangle', 260, 120, .07, .09); this.gurultu(.05, .06, 'lowpass', 900, 400); },
    patla() { this.gurultu(.06, .22, 'highpass', 800, 3000); this.ton('sine', 900, 80, .09, .14); },
    sap() { this.gurultu(.14, .14, 'lowpass', 900, 200); this.ton('sine', 240, 70, .12, .12); },
    pff() { this.gurultu(.22, .06, 'lowpass', 700, 250); },
    kum() { this.gurultu(.28, .08, 'lowpass', 1400, 500, .8); }
  };

  /* ------------------------------------------------------------ nefes sesi (4-7-8) */
  const nefesSes = {
    dugum: null,
    baslat() {
      this.dur();
      const h = sesEk.hazir(); if (!h) return; const { c, m } = h;
      const o1 = c.createOscillator(), o2 = c.createOscillator(), gg = c.createGain();
      o1.type = 'sine'; o1.frequency.value = 196; o2.type = 'sine'; o2.frequency.value = 294; gg.gain.value = .0001;
      o1.connect(gg); o2.connect(gg); gg.connect(m); o1.start(); o2.start();
      this.dugum = { c, o1, o2, gg };
    },
    faz(ad, sure) {
      const n = this.dugum; if (!n) return;
      try {
        const t = n.c.currentTime; n.gg.gain.cancelScheduledValues(t); n.gg.gain.setValueAtTime(Math.max(.0001, n.gg.gain.value), t);
        if (ad === 'al') n.gg.gain.exponentialRampToValueAtTime(.06, t + sure);
        else if (ad === 'ver') n.gg.gain.exponentialRampToValueAtTime(.0001, t + sure);
      } catch (e) {}
    },
    dur() {
      const n = this.dugum; if (!n) return; this.dugum = null;
      try { const t = n.c.currentTime; n.gg.gain.cancelScheduledValues(t); n.gg.gain.setValueAtTime(Math.max(.0001, n.gg.gain.value), t); n.gg.gain.exponentialRampToValueAtTime(.0001, t + .5); } catch (e) {}
      setTimeout(() => { try { n.o1.stop(); n.o2.stop(); } catch (e) {} }, 600);
    }
  };

  /* ------------------------------------------------------------ sakinleşme (battaniye + pet + 4-7-8) */
  const NEFES = { al: 4, tut: 7, ver: 8, tur: 4 };
  const PET_ADAY = ['ayi', 'kedi', 'tavsan', 'pittiksu', 'hayalet', 'top'];
  function petAdi(id) { const p = ctx.config && ctx.config.PETLER && ctx.config.PETLER[id]; return (p && p.AD) || { ayi: 'Ponçik Ayı', kedi: 'Sırıtan Kedi', tavsan: 'Tavşan', pittiksu: 'Pıttıksu', hayalet: 'Fiyonklu Hayalet', top: 'Pembe Top' }[id] || 'Pet'; }
  function sakinlesmeyeGec() {
    if (sakinMod || !ctx) return;
    sakinMod = true; surukle = null; seri = 0; seriGoster();
    if (ui.alet) ui.alet.classList.remove('goster');
    ctx.altbar(null);
    kok.classList.add('ofke-sakin-mod');
    ui.oda.setAttribute('aria-hidden', 'true'); ui.oda.classList.add('gizleniyor');
    sonra(() => { ui.oda.hidden = true; ui.sakin.hidden = false; requestAnimationFrame(() => ui.sakin.classList.add('goster')); sakinKur(); window.scrollTo({ top: 0, behavior: azalt() ? 'auto' : 'smooth' }); }, 420);
  }
  function sakinKur() {
    const petId = rastgele(PET_ADAY);
    const sprite = (typeof CD.petVeri === 'function') ? CD.petVeri(petId) : null;
    ui.sakinPetAd.textContent = petAdi(petId);
    ui.petKap.innerHTML = '';
    if (sprite && typeof CD.spriteElemani === 'function') { const c = CD.spriteElemani(sprite, sprite.roles ? sprite.roles.idle : 0, 4); ui.petKap.appendChild(c); ui.petCanvas = c; ui.petSprite = sprite; }
    else { ui.petKap.appendChild(ctx.el('span.ofke-pet-emoji', { 'aria-hidden': 'true' }, '🧸')); ui.petCanvas = null; ui.petSprite = null; }
    ui.petBalon = ctx.el('div.balon.ofke-pet-balon', { role: 'status' }); ui.petKap.appendChild(ui.petBalon);
    ui.faz.textContent = 'Hazır olunca başla'; ui.sayi.textContent = ''; ui.tur.textContent = 'Dört tur, on dokuz saniye her biri';
    ui.daire.className = 'ofke-nefes-daire';
    ui.sakinDugmeler.innerHTML = '';
    ui.sakinDugmeler.append(
      ctx.el('button.dugme', { type: 'button', onclick: nefesBaslat }, 'Nefese başla'),
      ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => { ctx.ses.tik(); odayaDon(false); } }, 'Şimdi değil')
    );
    ui.sakinBaslik.textContent = 'Battaniyeye dön';
    ui.sakinAlt.textContent = petAdi(petId) + ' seninle nefes alacak: daire büyürken al, dururken tut, küçülürken ver.';
    petSoyle('Gel, yanıma otur.');
    if (ui.petCanvas) { iptal(ui.kirpT); kirpDongu(); }
  }
  function kirpDongu() {
    if (!ui.petCanvas || !ui.petSprite || azalt()) return;
    ui.kirpT = sonra(() => { if (!ui.petCanvas) return; const r = ui.petSprite.roles || {}; CD.spriteCiz(ui.petCanvas, ui.petSprite, r.blink != null ? r.blink : 0); sonra(() => { if (ui.petCanvas) CD.spriteCiz(ui.petCanvas, ui.petSprite, r.idle || 0); }, 160); kirpDongu(); }, 2200 + Math.random() * 2600);
  }
  function petSoyle(metin) {
    if (!ui.petBalon) return;
    ui.petBalon.textContent = metin; ui.petBalon.classList.add('goster');
    iptal(ui.balonT); ui.balonT = sonra(() => ui.petBalon && ui.petBalon.classList.remove('goster'), 2600);
  }
  function nefesBaslat() {
    if (nefes) return;
    ctx.ses.tik();
    nefes = { tur: 1, faz: 0 };
    nefesSes.baslat();
    ui.sakinDugmeler.innerHTML = '';
    ui.sakinDugmeler.append(ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { ctx.ses.tik(); nefesBitir(false); } }, 'Bu kadar yeter'));
    fazBaslat();
  }
  function fazBaslat() {
    if (!nefes) return;
    const sira = ['al', 'tut', 'ver'], ad = sira[nefes.faz], sn = NEFES[ad];
    const etiket = { al: 'Nefes al', tut: 'Tut', ver: 'Ver' }[ad];
    ui.faz.textContent = etiket; ui.tur.textContent = 'Tur ' + nefes.tur + ' / ' + NEFES.tur;
    ui.daire.style.setProperty('--ofke-nefes-sure', sn + 's');
    ui.daire.className = 'ofke-nefes-daire ' + ad;
    ui.petKap.className = 'ofke-pet ' + ad;
    nefesSes.faz(ad, sn);
    petSoyle(rastgele(NEFES_SOZ[ad]));
    let kalan = sn; ui.sayi.textContent = kalan;
    const tikla = () => { if (!nefes) return; kalan--; if (kalan > 0) { ui.sayi.textContent = kalan; nefes.t = sonra(tikla, 1000); } else { fazBitti(); } };
    nefes.t = sonra(tikla, 1000);
  }
  function fazBitti() {
    if (!nefes) return;
    nefes.faz++;
    if (nefes.faz >= 3) {
      nefes.faz = 0; nefes.tur++; d.nefesTur++;
      if (!azalt()) { const m = ctx.efekt.merkez(ui.daire); ctx.efekt.kalp(m.x, m.y, 3); }
      if (nefes.tur > NEFES.tur) { nefesBitir(true); return; }
    }
    fazBaslat();
  }
  function nefesBitir(tamam) {
    if (!nefes) return;
    iptal(nefes.t); nefes = null; nefesSes.dur();
    ui.daire.className = 'ofke-nefes-daire'; ui.petKap.className = 'ofke-pet';
    ui.sayi.textContent = '';
    d.ofke = 100; olcerSozVerildi = {};
    if (tamam) {
      d.seans++; ctx.ses.isilti(); if (!azalt()) ctx.efekt.konfeti(undefined, undefined, 16);
      ui.faz.textContent = 'Bitti'; ui.tur.textContent = 'Dört tur tamam';
      ui.sakinBaslik.textContent = 'Öfke ölçer sıfır';
      ui.sakinAlt.textContent = 'Bugünlük bu kadar yeter Cemre. İstersen bir tur daha kır, istersen battaniyede kal.';
      petSoyle(rastgele(['Şimdi daha iyisin, hissediyorum.', 'Gördün mü, nefes her şeyi yumuşatır.', 'Sana sarılsam olur mu?']));
      if (ui.petCanvas && ui.petSprite && ui.petSprite.roles && ui.petSprite.roles.held != null) { CD.spriteCiz(ui.petCanvas, ui.petSprite, ui.petSprite.roles.held); sonra(() => { if (ui.petCanvas) CD.spriteCiz(ui.petCanvas, ui.petSprite, ui.petSprite.roles.idle || 0); }, 1500); }
    } else {
      ui.faz.textContent = 'Ara verdik'; ui.tur.textContent = '';
      petSoyle('Olsun, yarım nefes de nefestir.');
    }
    rozetKontrol(); kaydet();
    ui.sakinDugmeler.innerHTML = '';
    ui.sakinDugmeler.append(
      ctx.el('button.dugme', { type: 'button', onclick: () => { ctx.ses.tik(); odayaDon(true); } }, 'Bir tur daha kır'),
      ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => { ctx.ses.tik(); ctx.geri(); } }, 'Eve dön')
    );
  }
  function odayaDon(sifirla) {
    if (nefes) { iptal(nefes.t); nefes = null; nefesSes.dur(); }
    iptal(ui.kirpT); ui.petCanvas = null;
    if (sifirla || d.ofke <= 0) { d.ofke = 100; olcerSozVerildi = {}; kalintilar = []; parcalar = []; }
    kaydet();
    ui.sakin.classList.remove('goster');
    sonra(() => {
      ui.sakin.hidden = true; ui.oda.hidden = false; ui.oda.removeAttribute('aria-hidden'); ui.oda.classList.remove('gizleniyor');
      kok.classList.remove('ofke-sakin-mod'); sakinMod = false;
      altbarKur(); olcerGoster(); ozetGoster();
      nesneler = nesneler.filter(n => !n.olu); otomatikDoldur(); boyutla();
      ipucuYaz(sifirla ? 'Raf yeniden doldu. Terlik hazır.' : 'Kaldığın yerden devam.');
    }, 320);
  }

  /* ------------------------------------------------------------ rozetler & özet */
  function rozetKontrol() {
    ROZETLER.forEach(r => {
      if (d.rozetler.includes(r.id)) return;
      let ok = false; try { ok = r.kontrol(d); } catch (e) {}
      if (!ok) return;
      d.rozetler.push(r.id);
      sonra(() => { ctx.ses.zafer(); if (!azalt()) ctx.efekt.konfeti(undefined, undefined, 14); ctx.toast('Rozet: ' + r.ad + ' ' + r.emoji, 2600); }, 350);
    });
  }
  function ozetGoster() {
    if (!ui.ozetBugun) return;
    ui.ozetBugun.textContent = d.bugun.sayi; ui.ozetToplam.textContent = d.toplam; ui.ozetSeri.textContent = d.enIyiSeri; ui.ozetSeans.textContent = d.seans;
    ui.rozetler.innerHTML = '';
    ROZETLER.forEach(r => { const var_ = d.rozetler.includes(r.id); ui.rozetler.appendChild(ctx.el('span.rozet' + (var_ ? '.basari' : '.gri.kapali'), { title: r.sart }, [r.emoji + ' ' + r.ad])); });
  }
  function rozetSheet() {
    const liste = ctx.el('div.dikey.ofke-rozet-liste', ROZETLER.map(r => {
      const var_ = d.rozetler.includes(r.id);
      return ctx.el('div.satir.ofke-rozet-satir' + (var_ ? '.acik' : ''), [ctx.el('span.ofke-rozet-ikon', { 'aria-hidden': 'true' }, r.emoji), ctx.el('div.dikey.siki', [ctx.el('b', r.ad), ctx.el('span.sessiz', var_ ? 'Kazanıldı' : r.sart)])]);
    }));
    ctx.sheet(liste, { baslik: 'Rozetler · ' + d.rozetler.length + ' / ' + ROZETLER.length });
  }

  /* ------------------------------------------------------------ arayüz */
  function ipucuYaz(metin) {
    if (!ui.ipucu) return;
    ui.ipucu.textContent = metin; ui.ipucu.classList.add('goster');
    iptal(ipucuT); ipucuT = sonra(() => ui.ipucu && ui.ipucu.classList.remove('goster'), 3200);
  }
  function aletSec(id, sessiz) {
    alet = ALETLER.find(a => a.id === id) || ALETLER[0]; d.alet = alet.id;
    ui.aletIc.innerHTML = alet.svg;
    ui.aletCipler.forEach(c => c.setAttribute('aria-selected', String(c.dataset.alet === alet.id)));
    if (!sessiz) { ctx.ses.tik(); ipucuYaz(alet.ipucu); kaydet(); }
  }
  function altbarKur() {
    ctx.altbar([
      { id: 'yeni', ad: 'Yeni eşya', ikon: '🎲', birincil: true, tikla() { if (sakinMod) return; getir(rastgeleId(), true); ipucuYaz(rastgele(['Rafa yeni bir şey geldi.', 'Bunu da kır, üzülmez.', 'Taze hedef.'])); } },
      { id: 'rozet', ad: 'Rozetler', ikon: '🏅', tikla() { rozetSheet(); } },
      { id: 'sakin', ad: 'Sakinleş', ikon: '🌬️', tikla() { if (sakinMod) return; ctx.onayla('Öfke ölçer daha bitmedi. Şimdiden nefese geçelim mi?', 'Nefese geç', 'Kırmaya devam').then(evet => { if (evet && ctx && !sakinMod) sakinlesmeyeGec(); }); } }
    ]);
  }
  function kur(el) {
    // --- oda
    const oda = ctx.el('div.ofke-oda');
    const olcer = ctx.el('div.ofke-olcer', { role: 'progressbar', 'aria-label': 'Öfke ölçer', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(d.ofke)) }, [
      ctx.el('div.ofke-olcer-bas', [ctx.el('span', 'Öfke ölçer'), ctx.el('b.ofke-olcer-yuzde.sayi', String(Math.round(d.ofke)))]),
      ctx.el('div.ofke-olcer-yol', [ui.olcerDolu = ctx.el('div.ofke-olcer-dolu')])
    ]);
    ui.olcer = olcer; ui.olcerYuzde = olcer.querySelector('.ofke-olcer-yuzde');
    ui.seri = ctx.el('div.ofke-seri', { 'aria-live': 'polite' }, [ui.seriSayi = ctx.el('b.ofke-seri-sayi.sayi', 'x1'), ctx.el('span.ofke-seri-etiket', 'seri'), ui.seriSure = ctx.el('i.ofke-seri-sure', { 'aria-hidden': 'true' })]);
    oda.appendChild(ctx.el('div.ofke-ust', [olcer, ui.seri]));

    ui.sahneKap = ctx.el('div.ofke-sahne-kap');
    canvas = ctx.el('canvas.ofke-canvas', { tabindex: '0', role: 'img', 'aria-label': 'Öfke odası rafı: eşyalara dokunarak kır. Klavyede Enter rastgele bir eşyaya vurur.' });
    ui.alet = ctx.el('div.ofke-alet', { 'aria-hidden': 'true' }, [ui.aletIc = ctx.el('div.ofke-alet-ic')]);
    ui.ipucu = ctx.el('div.ofke-ipucu', { role: 'status', 'aria-live': 'polite' });
    ui.sahneKap.append(canvas, ui.alet, ui.ipucu);
    oda.appendChild(ui.sahneKap);

    ui.aletCipler = ALETLER.map(a => ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': 'false', data: { alet: a.id }, onclick: () => aletSec(a.id) }, [ctx.el('span', { 'aria-hidden': 'true' }, a.emoji + ' '), a.ad]));
    oda.appendChild(ctx.el('div.cipler.ofke-aletler', { role: 'tablist', 'aria-label': 'Alet seç' }, ui.aletCipler));

    oda.appendChild(ctx.el('div.ofke-tepsi-bas', [ctx.el('span.kalin', 'Eşya getir'), ctx.el('span.sessiz', 'dokun, rafa gelsin')]));
    oda.appendChild(ctx.el('div.ofke-tepsi', ESYALAR.map(e => ctx.el('button.ofke-esya', { type: 'button', 'aria-label': e.ad + ' getir', onclick: () => { ctx.ses.tik(); if (getir(e.id, true)) ipucuYaz(e.ad + ' rafta. ' + rastgele(['Hadi.', 'Gözünü kırpma.', 'Terlik hazır.'])); } }, [ctx.el('span.ofke-esya-ikon', { 'aria-hidden': 'true' }, e.emoji), ctx.el('span.ofke-esya-ad', e.ad)]))));

    const ozet = ctx.el('div.yama.ofke-ozet', [
      ctx.el('div.ofke-ozet-izgara', [
        ctx.el('div.ofke-ozet-kutu', [ui.ozetBugun = ctx.el('b.sayi', '0'), ctx.el('span', 'bugün')]),
        ctx.el('div.ofke-ozet-kutu', [ui.ozetToplam = ctx.el('b.sayi', '0'), ctx.el('span', 'toplam')]),
        ctx.el('div.ofke-ozet-kutu', [ui.ozetSeri = ctx.el('b.sayi', '0'), ctx.el('span', 'en iyi seri')]),
        ctx.el('div.ofke-ozet-kutu', [ui.ozetSeans = ctx.el('b.sayi', '0'), ctx.el('span', 'nefes seansı')])
      ]),
      ui.rozetler = ctx.el('div.ofke-rozetler', { 'aria-label': 'Rozetler' })
    ]);
    oda.appendChild(ctx.el('div.icerik.ofke-icerik', [ozet, ctx.el('p.sessiz.orta', 'Hiçbir eşya gerçek değil, hiçbir kedi zarar görmedi.')]));
    ui.oda = oda;

    // --- sakinleşme
    ui.sakin = ctx.el('div.ofke-sakin', { hidden: true });
    ui.sakinBaslik = ctx.el('h2.baslik.baslik-xl', 'Battaniyeye dön');
    ui.sakinAlt = ctx.el('p.ofke-sakin-alt');
    ui.daire = ctx.el('div.ofke-nefes-daire', [ui.faz = ctx.el('span.ofke-nefes-faz'), ui.sayi = ctx.el('span.ofke-nefes-sayi.sayi')]);
    ui.petKap = ctx.el('div.ofke-pet', { 'data-pati': '' });
    ui.sakinPetAd = ctx.el('span.ofke-pet-ad');
    ui.tur = ctx.el('div.ofke-nefes-tur.sessiz');
    ui.sakinDugmeler = ctx.el('div.ofke-sakin-dugmeler');
    ui.sakin.appendChild(ctx.el('div.ofke-sakin-ic', [ui.sakinBaslik, ui.sakinAlt, ctx.el('div.ofke-nefes', [ctx.el('div.ofke-nefes-halka', { 'aria-hidden': 'true' }), ui.daire]), ctx.el('div.ofke-pet-satir', [ui.petKap, ui.sakinPetAd]), ui.tur, ui.sakinDugmeler]));

    el.append(oda, ui.sakin);

    // --- dinleyiciler
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);
    canvas.addEventListener('pointerleave', e => { if (!surukle && ui.alet && e.pointerType === 'mouse') ui.alet.classList.remove('goster'); });
    canvas.addEventListener('keydown', klavye);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    ui.petKap.addEventListener('pointerdown', e => { ctx.ses.pit(); if (!azalt()) ctx.efekt.kalp(e.clientX, e.clientY, 4); petSoyle(rastgele(['Hihi.', 'Buradayım.', 'Nefes al, ben sayarım.', 'Sen iyi misin? Ben iyiyim.'])); });
  }

  /* ------------------------------------------------------------ kayıt */
  CD.kaydet({
    id: ID, baslik: 'Öfke Odası', ikon: IKON, tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el; d = yukle();
      nesneler = []; parcalar = []; kalintilar = []; seri = 0; sonVurus = 0; olcerSozVerildi = {}; surukle = null; sakinMod = false; nefes = null; ilkVurus = false; sure = 0; sonTs = 0; duraklat = document.hidden; yaziSayisi = 0; ipucuSira = 0;
      Object.keys(ui).forEach(k => { delete ui[k]; });
      if (d.ofke <= 0) d.ofke = 100;
      kur(el);
      paletOku();
      aletSec(d.alet, true);
      olcerGoster(); ozetGoster(); altbarKur();
      boyutla(); ilkKurulum();
      try { gozlemci = new ResizeObserver(() => boyutla()); gozlemci.observe(ui.sahneKap); } catch (e) { gozlemci = null; window.addEventListener('resize', boyutla); }
      const gorunurluk = () => { duraklat = document.hidden; if (!duraklat) sonTs = performance.now(); };
      document.addEventListener('visibilitychange', gorunurluk); abonelikler.push(() => document.removeEventListener('visibilitychange', gorunurluk));
      const pencereUp = e => pointerUp(e); window.addEventListener('pointerup', pencereUp); abonelikler.push(() => window.removeEventListener('pointerup', pencereUp));
      abonelikler.push(ctx.olay.dinle('hava', () => { paletOku(); }));
      abonelikler.push(ctx.olay.dinle('azHareket', () => { if (ui.daire && !nefes) ui.daire.className = 'ofke-nefes-daire'; }));
      raf = requestAnimationFrame(dongu);
      const gunFarki = Math.floor((Date.now() - (d.sonGorulme || Date.now())) / 86400000);
      sonra(() => ipucuYaz(gunFarki >= 2 ? 'Raf tozlanmıştı, terlik seni bekledi.' : (d.toplam ? 'Hoş geldin Cemre. Raf dolu, terlik hazır.' : 'Terliği kap Cemre. Bugün burada kimse sana karışamaz.')), 500);
      const ipucuDongu = () => { sonra(() => { if (!sakinMod && (!ilkVurus || Math.random() < .5)) ipucuYaz(IPUCULAR[ipucuSira++ % IPUCULAR.length]); ipucuDongu(); }, 14000 + Math.random() * 8000); };
      ipucuDongu();
      kaydet();
    },
    unmount() {
      cancelAnimationFrame(raf); raf = 0;
      hepsiniIptal();
      abonelikler.splice(0).forEach(fn => { try { fn(); } catch (e) {} });
      if (gozlemci) { try { gozlemci.disconnect(); } catch (e) {} gozlemci = null; } else window.removeEventListener('resize', boyutla);
      if (nefes) { nefes = null; }
      nefesSes.dur();
      if (ctx) { kaydet(); ctx.ses.hepsiniDurdur(); }
      if (kok) kok.classList.remove('ofke-sakin-mod');
      nesneler = []; parcalar = []; kalintilar = []; benekler = []; surukle = null; sakinMod = false;
      Object.keys(ui).forEach(k => { delete ui[k]; });
      canvas = null; g = null; ctx = null; kok = null; d = null;
    }
  });
})();
