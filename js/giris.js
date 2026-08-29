/* giris.js — Giriş akışı (Ahmet'in fikri, birebir):
   karanlık → ışık sızması + ışıltı → BÜYÜK buket belirir (ortada lilyum, pembe gül çemberi, dışa doğru
   kırmızı → koyu kırmızı → bordo → siyah gül halkaları, aralarda şakayık/lale/papatya/lavanta/okaliptüs)
   → "Çiçeği al" → beyaz not kartı 3D ile öne gelir (config.js NOT) → karta dokun → kart çekilir
   → "Hadi biraz eğlenelim" alttan ortaya süzülür, altında "~tıkla~" → hub.
   İlk açılış tam akış; sonraki açılışlar hızlı + "atla". Hub'dan: CD.giris.buketGoster() / CD.giris.notGoster().
   Ses: yalnızca "Çiçeği al"dan sonra (Web Audio çan + ışıltı). prefers-reduced-motion: sade solmalar. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const depo = () => CD.depo.alan('giris');

  /* ---------------------------------------------------------------- deterministik rastgele (buket her açılışta aynı dursun) */
  function Rng(tohum) { let s = tohum >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ---------------------------------------------------------------- buket sanat paleti (SVG sanat renkleri; arayüz değil) */
  const RENK = {
    gulPembe: ['#F7ABC4', '#DF7BA0', '#FBD3E0'],
    gulKirmizi: ['#D8394A', '#A41E2E', '#EC6F7A'],
    gulKoyu: ['#A81D2E', '#761020', '#C7404F'],
    gulBordo: ['#6C0F20', '#470915', '#8A2334'],
    gulSiyah: ['#44101C', '#230710', '#601A2B'],
    sakayik: [['#F9C4C9', '#EC9AA6', '#FDE4E7'], ['#F8B2A4', '#E48A78', '#FCDDD4'], ['#FBD9DE', '#EDAEB8', '#FFF0F2']],
    lale: [['#F9D65C', '#E1B02A'], ['#CBA9EA', '#A57FD0'], ['#FBF7F2', '#E4DACF'], ['#F6A0B8', '#DE6F90']],
    papatya: ['#FFFDF7', '#EAE2D8', '#F4C542', '#D9A520'],
    lavanta: ['#9B87D6', '#7A63BF', '#6E9B6A'],
    okaliptus: ['#A3BBA9', '#7F9C88', '#7A9A80'],
    yaprak: ['#4F8A5B', '#3B6E45', '#6FA37A'],
    cipso: ['#FFFFFF', '#E6E1D6', '#9AB59A'],
    kagit: ['#E9D6C3', '#D9C2AA', '#C7AB8E', '#FFF7F2', '#EFE3DA'],
    kurdele: ['#EE8AAA', '#C9567F'],
    sap: '#5C8F5F'
  };

  /* ---------------------------------------------------------------- semboller */
  function semboller() {
    // gül: geniş, kıvrık kenarlı taç yapraklar (dış 7 açık, orta 6, iç 5) + ortada sarmal tomurcuk; üstte çukur gölgesi
    const disYol = 'M0 0 C -24 -4 -46 -22 -42 -42 C -38 -56 -14 -60 0 -50 C 12 -58 30 -50 28 -34 C 26 -22 14 -8 0 0 Z';
    const gulYaprak = (d, dolgu, rim) => `<path d="${d}" fill="${dolgu}" stroke="var(--r2)" stroke-width=".9" stroke-linejoin="round"/>` + (rim ? `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.2" stroke-linejoin="round"/>` : '');
    let gul = '';
    for (let i = 0; i < 7; i++) gul += `<g transform="rotate(${i * 51.43})">${gulYaprak(disYol, 'var(--r3)', true)}</g>`;
    for (let i = 0; i < 6; i++) gul += `<g transform="rotate(${26 + i * 60}) scale(.7)">${gulYaprak(disYol, 'var(--r1)')}</g>`;
    for (let i = 0; i < 5; i++) gul += `<g transform="rotate(${52 + i * 72}) scale(.45)">${gulYaprak(disYol, 'var(--r1)')}</g>`;
    gul += `<path d="M-16 4 C -18 -12 -2 -22 12 -14 C 20 -8 18 6 8 10" fill="none" stroke="var(--r2)" stroke-width="1.5" stroke-linecap="round"/>`;
    gul += `<path d="M-8 -2 C -8 -12 4 -14 8 -6 C 11 0 6 8 -2 6 C -8 4 -8 -2 -3 -3 C 1 -4 3 0 1 2" fill="var(--r1)" stroke="var(--r2)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    gul += `<circle r="47" fill="url(#cb-cukur)"/>`;

    // lilyum (stargazer): 6 tepal, çiller, orta damar, ercikler
    const tepal = 'M0 0 C -16 -18 -27 -46 -15 -70 C -9 -83 9 -83 15 -70 C 27 -46 16 -18 0 0 Z';
    let lil = '';
    const tepalCiz = (a, arka) => {
      let cil = '';
      for (let j = 0; j < 8; j++) { const y = -18 - j * 4.6, x = (j % 2 ? 1 : -1) * (2 + (j % 3) * 2.4); cil += `<circle cx="${x}" cy="${y}" r="1.35" fill="#B8305F" opacity=".85"/>`; }
      return `<g transform="rotate(${a})"><path d="${tepal}" fill="url(#cb-lilG)" stroke="#F3B9CF" stroke-width=".9" opacity="${arka ? '.92' : '1'}"/><path d="M0 -6 L0 -64" stroke="#FFF7FA" stroke-width="2" stroke-linecap="round" opacity=".75"/>${cil}</g>`;
    };
    [0, 120, 240].forEach(a => { lil += tepalCiz(a, true); });
    [60, 180, 300].forEach(a => { lil += tepalCiz(a, false); });
    for (let i = 0; i < 6; i++) { const a = i * 60 + 30; lil += `<g transform="rotate(${a})"><path d="M0 0 C 2 -14 4 -26 3 -38" stroke="#F1E7C8" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="3" cy="-40" rx="2.4" ry="5" fill="#B85C2B"/></g>`; }
    lil += `<path d="M0 0 L1 -30" stroke="#DCE7B4" stroke-width="2" stroke-linecap="round"/><circle cx="1" cy="-31" r="3.2" fill="#9DB86F"/><circle r="5" fill="#8C2E56"/>`;

    // şakayık: 3 katman kıvrımlı yaprak
    const sakYol = 'M0 0 C -22 -4 -36 -24 -28 -40 C -24 -48 -16 -46 -14 -40 C -10 -50 2 -52 4 -42 C 8 -50 20 -46 18 -34 C 20 -22 12 -6 0 0 Z';
    let sak = '';
    for (let i = 0; i < 8; i++) sak += `<g transform="rotate(${i * 45})"><path d="${sakYol}" fill="var(--p1)" stroke="var(--p2)" stroke-width=".7"/></g>`;
    for (let i = 0; i < 7; i++) sak += `<g transform="rotate(${22 + i * 51.4}) scale(.72)"><path d="${sakYol}" fill="var(--p3)" stroke="var(--p2)" stroke-width=".9"/></g>`;
    for (let i = 0; i < 6; i++) sak += `<g transform="rotate(${8 + i * 60}) scale(.46)"><path d="${sakYol}" fill="var(--p1)" stroke="var(--p2)" stroke-width="1.2"/></g>`;
    sak += `<circle r="42" fill="url(#cb-cukur)" opacity=".7"/>`;

    // lale (yandan; yukarı = dışa doğru)
    const lale = `<path d="M0 2 L0 34" stroke="${RENK.sap}" stroke-width="3" stroke-linecap="round"/><path d="M1 30 C -10 24 -20 10 -16 -4 C -6 6 -1 18 1 30 Z" fill="${RENK.yaprak[2]}" stroke="${RENK.yaprak[1]}" stroke-width=".6"/>` +
      `<path d="M-8 -2 C -10 -30 -4 -50 0 -58 C 4 -50 10 -30 8 -2 Z" fill="var(--t2)"/>` +
      `<path d="M-17 -2 C -24 -24 -18 -46 -8 -54 C 0 -44 2 -20 0 -2 Z" fill="var(--t1)" stroke="var(--t2)" stroke-width=".7"/>` +
      `<path d="M17 -2 C 24 -24 18 -46 8 -54 C 0 -44 -2 -20 0 -2 Z" fill="var(--t1)" stroke="var(--t2)" stroke-width=".7"/>` +
      `<path d="M-17 -2 Q 0 7 17 -2 Q 0 2 -17 -2 Z" fill="var(--t2)"/>`;

    // papatya
    let pap = '';
    for (let i = 0; i < 12; i++) pap += `<ellipse cx="0" cy="-13" rx="4" ry="13" transform="rotate(${i * 30})" fill="${RENK.papatya[0]}" stroke="${RENK.papatya[1]}" stroke-width=".5"/>`;
    pap += `<circle r="7" fill="${RENK.papatya[2]}"/>`;
    for (let i = 0; i < 6; i++) pap += `<circle cx="${(3.2 * Math.cos(i * 1.047)).toFixed(1)}" cy="${(3.2 * Math.sin(i * 1.047)).toFixed(1)}" r="1.1" fill="${RENK.papatya[3]}"/>`;

    // lavanta (yukarı = dışa)
    let lav = `<path d="M0 6 L0 -46" stroke="${RENK.lavanta[2]}" stroke-width="2" stroke-linecap="round"/>`;
    for (let i = 0; i < 7; i++) { const y = -14 - i * 5.6; lav += `<ellipse cx="-4.2" cy="${y}" rx="4.4" ry="3" fill="${RENK.lavanta[0]}" stroke="${RENK.lavanta[1]}" stroke-width=".5"/><ellipse cx="4.2" cy="${y - 2.4}" rx="4.4" ry="3" fill="${RENK.lavanta[0]}" stroke="${RENK.lavanta[1]}" stroke-width=".5"/>`; }
    lav += `<ellipse cx="0" cy="-54" rx="3.2" ry="4.4" fill="${RENK.lavanta[0]}" stroke="${RENK.lavanta[1]}" stroke-width=".5"/>`;

    // okaliptüs
    let oka = `<path d="M0 6 L0 -72" stroke="${RENK.okaliptus[2]}" stroke-width="1.6" stroke-linecap="round"/>`;
    for (let i = 0; i < 5; i++) { const y = -8 - i * 14, r = 8.5 - i * .9; oka += `<circle cx="${-(r + 1.5)}" cy="${y}" r="${r}" fill="${RENK.okaliptus[0]}" stroke="${RENK.okaliptus[1]}" stroke-width=".6"/><circle cx="${r + 1.5}" cy="${y - 6}" r="${r}" fill="${RENK.okaliptus[0]}" stroke="${RENK.okaliptus[1]}" stroke-width=".6"/>`; }
    oka += `<circle cx="0" cy="-78" r="5" fill="${RENK.okaliptus[0]}" stroke="${RENK.okaliptus[1]}" stroke-width=".6"/>`;

    // yaprak
    const yap = `<path d="M0 0 C -22 -18 -24 -50 0 -72 C 24 -50 22 -18 0 0 Z" fill="${RENK.yaprak[0]}" stroke="${RENK.yaprak[1]}" stroke-width=".8"/><path d="M0 -4 L0 -64" stroke="${RENK.yaprak[2]}" stroke-width="1.2" stroke-linecap="round" opacity=".8"/><path d="M0 -20 L-9 -30 M0 -34 L9 -44 M0 -46 L-7 -54" stroke="${RENK.yaprak[2]}" stroke-width=".8" stroke-linecap="round" opacity=".6"/>`;

    // çipso (baby's breath)
    let cip = `<path d="M0 0 L-10 -18 M0 0 L2 -24 M0 0 L12 -14 M-10 -18 L-16 -26 M2 -24 L-4 -32" stroke="${RENK.cipso[2]}" stroke-width="1" stroke-linecap="round" fill="none"/>`;
    [[-10, -18], [2, -24], [12, -14], [-16, -26], [-4, -32], [6, -30], [16, -20]].forEach(p => { cip += `<circle cx="${p[0]}" cy="${p[1]}" r="2.8" fill="${RENK.cipso[0]}" stroke="${RENK.cipso[1]}" stroke-width=".5"/>`; });

    return `<defs>
      <radialGradient id="cb-cukur" cx="0" cy="0" r="47" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset=".38" stop-color="#000" stop-opacity=".08"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".14"/></radialGradient>
      <radialGradient id="cb-lilG" cx="0" cy="0" r="82" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#DE4E88"/><stop offset=".42" stop-color="#F29DBC"/><stop offset=".84" stop-color="#FCE6EE"/><stop offset="1" stop-color="#FFFFFF"/></radialGradient>
      <radialGradient id="cb-hale" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD4E2" stop-opacity=".55"/><stop offset=".55" stop-color="#FFB3C7" stop-opacity=".18"/><stop offset="1" stop-color="#FFB3C7" stop-opacity="0"/></radialGradient>
      <linearGradient id="cb-kagitG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${RENK.kagit[2]}" stop-opacity=".55"/><stop offset=".25" stop-color="${RENK.kagit[0]}" stop-opacity="0"/></linearGradient>
      <symbol id="cb-gul" overflow="visible">${gul}</symbol>
      <symbol id="cb-lilyum" overflow="visible">${lil}</symbol>
      <symbol id="cb-sakayik" overflow="visible">${sak}</symbol>
      <symbol id="cb-lale" overflow="visible">${lale}</symbol>
      <symbol id="cb-papatya" overflow="visible">${pap}</symbol>
      <symbol id="cb-lavanta" overflow="visible">${lav}</symbol>
      <symbol id="cb-okaliptus" overflow="visible">${oka}</symbol>
      <symbol id="cb-yaprak" overflow="visible">${yap}</symbol>
      <symbol id="cb-cipso" overflow="visible">${cip}</symbol>
    </defs>`;
  }

  /* ---------------------------------------------------------------- yerleşim: halkalar (ayarı iyi verilmiş) */
  const CX = 350, CY = 352;
  function yerlesim() {
    const R = Rng(20260828);
    const oge = []; // {sembol, x, y, don, olcek, stil, halka, nefes}
    const ekle = (sembol, r, acDeg, ekOlcek, stil, halka, secenek) => {
      secenek = secenek || {};
      const a = acDeg * Math.PI / 180;
      const rr = r + (secenek.rJit != null ? secenek.rJit : (R() - .5) * 12);
      const x = CX + rr * Math.cos(a), y = CY + rr * Math.sin(a);
      const don = secenek.disaBak ? acDeg + 90 + (R() - .5) * 14 : R() * 360;
      oge.push({ sembol, x, y, don, olcek: ekOlcek, stil, halka, nefes: !!secenek.nefes, y0: y });
    };
    const gulStil = (c) => `--r1:${c[0]};--r2:${c[1]};--r3:${c[2]}`;
    // dış yeşillik ve saplı çiçekler (arkada)
    for (let i = 0; i < 16; i++) ekle('cb-yaprak', 262 + R() * 40, -95 + i * (330 / 15) + (R() - .5) * 10, .78 + R() * .3, '', 7, { disaBak: true });
    for (let i = 0; i < 6; i++) ekle('cb-okaliptus', 268 + R() * 24, -80 + i * 62 + (R() - .5) * 20, .95 + R() * .2, '', 7, { disaBak: true });
    for (let i = 0; i < 7; i++) ekle('cb-lavanta', 276 + R() * 20, -110 + i * 52 + (R() - .5) * 16, 1 + R() * .2, '', 7, { disaBak: true });
    for (let i = 0; i < 5; i++) ekle('cb-cipso', 236 + R() * 40, -60 + i * 66 + (R() - .5) * 20, 1.1 + R() * .3, '', 7, { disaBak: true });
    for (let i = 0; i < 6; i++) { const c = RENK.lale[i % RENK.lale.length]; ekle('cb-lale', 262 + R() * 18, -128 + i * 66 + (R() - .5) * 18, .92 + R() * .15, `--t1:${c[0]};--t2:${c[1]}`, 7, { disaBak: true, nefes: true }); }
    // gül halkaları: dıştan içe (siyah → bordo → koyu kırmızı → kırmızı → pembe)
    const halkalar = [
      { r: 282, n: 21, s: .64, c: RENK.gulSiyah, h: 5 },
      { r: 234, n: 18, s: .66, c: RENK.gulBordo, h: 4 },
      { r: 184, n: 15, s: .66, c: RENK.gulKoyu, h: 3 },
      { r: 132, n: 12, s: .65, c: RENK.gulKirmizi, h: 2 },
      { r: 80, n: 7, s: .62, c: RENK.gulPembe, h: 1 }
    ];
    halkalar.forEach(hk => {
      const bas = hk.h * 17;
      for (let i = 0; i < hk.n; i++) ekle('cb-gul', hk.r, bas + i * 360 / hk.n + (R() - .5) * 5, hk.s + (R() - .5) * .04, gulStil(hk.c), hk.h, { nefes: hk.h <= 2 });
      if (hk.h === 5) for (let i = 0; i < 5; i++) { const c = RENK.sakayik[i % 3]; ekle('cb-sakayik', 252, -70 + i * 74 + (R() - .5) * 14, .84 + R() * .12, `--p1:${c[0]};--p2:${c[1]};--p3:${c[2]}`, 5, { nefes: true }); }
      if (hk.h === 4) for (let i = 0; i < 6; i++) ekle('cb-papatya', 210 + R() * 14, -40 + i * 60 + (R() - .5) * 18, .9 + R() * .2, '', 4, {});
      if (hk.h === 3) for (let i = 0; i < 4; i++) ekle('cb-cipso', 158, 12 + i * 90 + (R() - .5) * 20, .9, '', 3, { disaBak: true });
    });
    // ortadaki lilyumlar: iki küçük arkada, büyük önde
    oge.push({ sembol: 'cb-lilyum', x: CX - 46, y: CY - 26, don: -28, olcek: .58, stil: '', halka: 0, nefes: true, y0: CY - 26 });
    oge.push({ sembol: 'cb-lilyum', x: CX + 48, y: CY - 22, don: 24, olcek: .58, stil: '', halka: 0, nefes: true, y0: CY - 22 });
    oge.push({ sembol: 'cb-lilyum', x: CX, y: CY + 6, don: 8, olcek: .8, stil: '', halka: 0, nefes: true, y0: CY + 6 });
    // çizim sırası: dış halkadan içe; aynı halkada üsttekiler önce (alttakiler üste biner)
    oge.sort((a, b) => (b.halka - a.halka) || (a.y0 - b.y0));
    return oge;
  }

  function buketSVG(hizli) {
    const oge = yerlesim();
    const R = Rng(7);
    let s = `<svg class="giris-buket" viewBox="0 0 700 830" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${semboller()}`;
    s += `<ellipse class="cb-hale" cx="${CX}" cy="${CY}" rx="330" ry="320" fill="url(#cb-hale)"/>`;
    // arka kâğıt + ipek kâğıt
    s += `<g class="cb-sarim-arka"><path d="M100 484 Q350 398 600 484 L404 780 L296 780 Z" fill="${RENK.kagit[1]}"/><path d="M124 508 Q350 428 576 508 L398 770 L302 770 Z" fill="${RENK.kagit[3]}" stroke="${RENK.kagit[4]}" stroke-width="1.2"/></g>`;
    s += `<g class="cb-cicekler">`;
    oge.forEach(o => {
      const gecik = hizli ? 80 + o.halka * 60 + R() * 60 : 520 + (7 - Math.min(o.halka, 7)) * 0 + o.halka * 230 + R() * 170;
      const nefesSure = 3000 + R() * 1400, nefesGecik = -(R() * 3000);
      s += `<g class="cb-c" transform="translate(${o.x.toFixed(1)} ${o.y.toFixed(1)})"><g class="cb-gel" style="--gecik:${Math.round(gecik)}ms"><g class="cb-nefes${o.nefes ? ' aktif' : ''}" style="--nsure:${Math.round(nefesSure)}ms;--ngecik:${Math.round(nefesGecik)}ms"><g transform="rotate(${o.don.toFixed(1)}) scale(${o.olcek.toFixed(3)})"><use href="#${o.sembol}" style="${o.stil}"/></g></g></g></g>`;
    });
    s += `</g>`;
    // ön kâğıt, kurdele, fiyonk, saplar
    s += `<g class="cb-sarim-on">
      <path d="M118 566 Q350 648 582 566 L404 780 L296 780 Z" fill="${RENK.kagit[0]}" stroke="${RENK.kagit[2]}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M118 566 Q350 648 582 566 L560 592 Q350 668 140 592 Z" fill="url(#cb-kagitG)"/>
      <path d="M154 604 L300 776" stroke="${RENK.kagit[2]}" stroke-width="1" opacity=".55"/><path d="M546 604 L400 776" stroke="${RENK.kagit[2]}" stroke-width="1" opacity=".55"/>
      <path d="M296 780 L292 830 M318 782 L318 830 M350 784 L352 830 M382 782 L384 830 M404 780 L410 830" stroke="${RENK.sap}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M203 654 Q350 684 497 654 L491 680 Q350 712 209 680 Z" fill="${RENK.kurdele[0]}" stroke="${RENK.kurdele[1]}" stroke-width="1.2" stroke-linejoin="round"/>
      <g class="cb-fiyonk">
        <path d="M344 676 C 306 640 266 648 274 672 C 282 696 322 692 344 676 Z" fill="${RENK.kurdele[0]}" stroke="${RENK.kurdele[1]}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M356 676 C 394 640 434 648 426 672 C 418 696 378 692 356 676 Z" fill="${RENK.kurdele[0]}" stroke="${RENK.kurdele[1]}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M344 680 C 330 712 322 740 308 764" stroke="${RENK.kurdele[0]}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M344 680 C 330 712 322 740 308 764" stroke="${RENK.kurdele[1]}" stroke-width="1" fill="none" opacity=".6"/>
        <path d="M356 680 C 370 712 378 740 392 764" stroke="${RENK.kurdele[0]}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M356 680 C 370 712 378 740 392 764" stroke="${RENK.kurdele[1]}" stroke-width="1" fill="none" opacity=".6"/>
        <circle cx="350" cy="676" r="9" fill="${RENK.kurdele[1]}"/><circle cx="347" cy="673" r="3" fill="#FFD6E4" opacity=".7"/>
      </g>
    </g></svg>`;
    return s;
  }

  /* ---------------------------------------------------------------- ışıltı parçacıkları (CSS animasyonlu noktalar) */
  function isiltilar(kap, n) {
    const R = Rng(99);
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, r = .2 + R() * .34;
      const x = 50 + Math.cos(a) * r * 100, y = 43 + Math.sin(a) * r * 96;
      const p = document.createElement('i');
      p.style.left = x.toFixed(1) + '%'; p.style.top = y.toFixed(1) + '%';
      p.style.setProperty('--gecik', (R() * 4000).toFixed(0) + 'ms');
      p.style.setProperty('--sure', (2200 + R() * 2600).toFixed(0) + 'ms');
      p.style.setProperty('--boy', (3 + R() * 5).toFixed(1) + 'px');
      if (R() < .35) p.className = 'yildiz';
      kap.appendChild(p);
    }
  }

  /* ---------------------------------------------------------------- akış */
  let kok = null, durum = 'kapali', temizle = [];
  const az = () => CD.azHareket;
  const zaman = (fn, ms) => { const t = setTimeout(fn, az() ? Math.min(ms, 120) : ms); temizle.push(() => clearTimeout(t)); return t; };

  function notMetni() {
    const c = CD.config || {};
    const metin = (typeof c.NOT === 'string' && c.NOT.trim()) ? c.NOT : ((c.not && c.not.metin) || '');
    const baslik = c.NOT_BASLIK != null ? c.NOT_BASLIK : "Ahmet'ten küçük bir not";
    const imza = c.NOT_IMZA != null ? c.NOT_IMZA : '';
    return { metin, baslik, imza };
  }

  function kur(mod) {
    // mod: 'tam' | 'hizli' | 'not'
    yokEt();
    const hizli = mod === 'hizli';
    kok = CD.el('div#giris.giris', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Karşılama', 'data-mod': mod });
    if (hizli) kok.classList.add('hizli');
    if (az()) kok.classList.add('az');
    const n = notMetni();
    kok.innerHTML = `
      <div class="giris-isik" aria-hidden="true"></div>
      <div class="giris-sahne">
        <div class="giris-buket-kap" aria-hidden="true">
          <div class="giris-parcaciklar"></div>
          ${buketSVG(hizli || mod === 'not')}
        </div>
        <button class="giris-al" type="button" hidden>Çiçeği al</button>
      </div>
      <div class="giris-kart-kap" hidden>
        <article class="giris-kart" aria-label="${CD.kacir(n.baslik || 'Not')}">
          ${n.baslik ? `<header class="giris-kart-bas">${CD.kacir(n.baslik)}</header>` : ''}
          <div class="giris-kart-govde" tabindex="0"></div>
          <div class="giris-kart-golge" aria-hidden="true"></div>
        </article>
        <button class="giris-devam" type="button" aria-label="Devam et"><span class="giris-devam-yazi">devam</span><span class="giris-devam-ok" aria-hidden="true">›</span></button>
      </div>
      <button class="giris-eglence" type="button" hidden>
        <span class="giris-hadi">Hadi biraz eğlenelim</span>
        <span class="giris-tikla" aria-hidden="true">~tıkla~</span>
      </button>
      <button class="giris-atla" type="button" hidden>atla ›</button>`;
    // mektup paragrafları
    const govde = kok.querySelector('.giris-kart-govde');
    const paragraflar = String(n.metin || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (!paragraflar.length) paragraflar.push('(Not henüz yazılmamış — config.js dosyasındaki NOT alanına yazılır.)');
    paragraflar.forEach((p, i) => govde.appendChild(CD.el('p' + (i === 0 ? '.giris-hitap' : ''), p)));
    if (n.imza) govde.appendChild(CD.el('p.giris-imza', n.imza));
    isiltilar(kok.querySelector('.giris-parcaciklar'), 30);
    document.body.appendChild(kok);
    document.body.classList.add('giris-acik');
    CD.olay.yay('giris:basladi', mod);
    durum = 'karanlik';
    // atla: ilk açılışta yok (tam akış); sonraki açılışlarda ve hub'dan "Buketi tekrar gör" dendiğinde var
    const atla = kok.querySelector('.giris-atla');
    if (mod !== 'tam' || !CD.giris.ilkAcilis()) { atla.hidden = false; atla.addEventListener('click', () => { CD.ses.tik(); bitir(true); }); }
    if (mod === 'not') { kok.classList.add('goster', 'canli'); zaman(() => kartGoster(), 60); return; }
    // sahne: karanlık → ışık → buket
    zaman(() => { kok.classList.add('isik'); }, hizli ? 40 : 300);
    zaman(() => { kok.classList.add('goster'); durum = 'buket'; }, hizli ? 120 : 650);
    zaman(() => { kok.classList.add('canli'); }, hizli ? 900 : 3600);
    const alDugme = kok.querySelector('.giris-al');
    zaman(() => { alDugme.hidden = false; requestAnimationFrame(() => alDugme.classList.add('goster')); try { alDugme.focus({ preventScroll: true }); } catch (e) {} }, hizli ? 1300 : 4300);
    alDugme.addEventListener('click', () => {
      if (durum !== 'buket') return;
      durum = 'kart';
      CD.ses.uyandir(); CD.ses.can(); setTimeout(() => CD.ses.isilti(), 180);
      alDugme.classList.remove('goster'); alDugme.disabled = true;
      kok.classList.add('patlama');
      const r = alDugme.getBoundingClientRect(); CD.efekt.yildiz(r.left + r.width / 2, r.top, 8);
      zaman(() => kartGoster(), 260);
    });
  }

  function kartGoster() {
    const kap = kok.querySelector('.giris-kart-kap'); const govde = kok.querySelector('.giris-kart-govde');
    const kart = kok.querySelector('.giris-kart'); const devam = kok.querySelector('.giris-devam');
    kap.hidden = false; kok.classList.add('kart-acik');
    requestAnimationFrame(() => requestAnimationFrame(() => kap.classList.add('goster')));
    durum = 'kart';
    zaman(() => { try { govde.focus({ preventScroll: true }); } catch (e) {} }, 700);
    // kaydırma ipucu: dipte değilse "devam" yerine ok aşağı
    const guncelle = () => { const dipte = govde.scrollHeight - govde.scrollTop - govde.clientHeight < 12; kart.classList.toggle('dipte', dipte); kart.classList.toggle('kaydirilir', govde.scrollHeight > govde.clientHeight + 4); };
    govde.addEventListener('scroll', guncelle, { passive: true }); zaman(guncelle, 350); zaman(guncelle, 900);
    addEventListener('resize', guncelle); temizle.push(() => removeEventListener('resize', guncelle));
    const ilerle = () => {
      if (durum !== 'kart') return;
      const dipte = govde.scrollHeight - govde.scrollTop - govde.clientHeight < 12;
      if (!dipte && !az()) { govde.scrollBy({ top: govde.clientHeight * 0.7, behavior: 'smooth' }); CD.ses.tik(); return; }
      kartKapat();
    };
    // karta dokun = sayfa ilerle / bitince devam; sürükleme (kaydırma) dokunma sayılmaz
    let p0 = null;
    kart.addEventListener('pointerdown', e => { p0 = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    kart.addEventListener('pointerup', e => { if (!p0) return; const d = Math.hypot(e.clientX - p0.x, e.clientY - p0.y), dt = performance.now() - p0.t; p0 = null; if (d < 8 && dt < 500) ilerle(); });
    kart.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ilerle(); } });
    devam.addEventListener('click', () => { CD.ses.pop(); kartKapat(); });
  }

  function kartKapat() {
    if (durum !== 'kart') return;
    durum = 'eglence';
    const kap = kok.querySelector('.giris-kart-kap');
    kap.classList.add('cekil'); kok.classList.add('kart-gitti'); kok.classList.remove('kart-acik');
    CD.ses.pop();
    if (kok.dataset.mod === 'not') { zaman(() => bitir(false), 520); return; }
    zaman(() => {
      kap.hidden = true;
      const eg = kok.querySelector('.giris-eglence');
      eg.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => eg.classList.add('goster')));
      zaman(() => { try { eg.focus({ preventScroll: true }); } catch (e) {} }, 1500);
      eg.addEventListener('click', () => { if (durum !== 'eglence') return; CD.ses.parilti(); CD.efekt.konfeti(innerWidth / 2, innerHeight * .45, 16); bitir(false); }, { once: true });
    }, 560);
  }

  function bitir(atlandi) {
    if (!kok || durum === 'bitti') return;
    durum = 'bitti';
    const mod = kok.dataset.mod;
    if (mod !== 'not') depo().yaz('sayac', (depo().al('sayac', 0) || 0) + 1);
    kok.classList.add('kapan');
    document.body.classList.remove('giris-acik');
    CD.olay.yay('giris:bitti', { mod, atlandi });
    zaman(() => yokEt(), az() ? 200 : (mod === 'not' ? 500 : 820));
  }
  function yokEt() {
    temizle.splice(0).forEach(f => { try { f(); } catch (e) {} });
    if (kok) { kok.remove(); kok = null; }
    document.body.classList.remove('giris-acik');
    durum = 'kapali';
  }

  CD.giris = {
    get durum() { return durum; },
    ilkAcilis: () => !(depo().al('sayac', 0) > 0),
    baslat() { kur(this.ilkAcilis() ? 'tam' : 'hizli'); },
    buketGoster() { kur('tam'); },
    notGoster() { kur('not'); },
    atla() { bitir(true); },
    kapat: yokEt
  };

  // otomatik başlat: hub açılışında (hash boşsa) ya da ilk ziyarette her zaman
  CD.hazir(() => {
    const hashVar = !!location.hash.replace(/^#\/?/, '');
    if (!hashVar || CD.giris.ilkAcilis()) CD.giris.baslat();
  });
})();
