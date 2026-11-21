/* js/bolum/tirnak-tasarim.js — Tırnak Salonu PRO tasarım kütüphanesi (tembel yüklenir).
   - Yeni renk koleksiyonları (Türkçe adlarla)
   - Özgün, sevimli karakter ve figür çıkartmaları (elle boyanmış gibi; telifli karakter YOK) + 3D jel heykellerin 2D çizimleri
   - 45 yeni hazır tasarım: Cadılar Bayramı, meyve, 3D güller, altın liquid metal, kırmızı kedi gözü, beyaz French + altın çizgi,
     aura, stiletto taşlı, karakterler, palyaço, 8 top, zincir ve taş şerit (Cemre'nin setinden esinlenerek)
   - "Cemre'nin tırnakları" vitrini: çerçeveli, plaketli, büyütülebilir; "Bu eserden ilham al" ve "Galeride gör"
   Kayıt: tirnak.js açılışta kaydet(ic) çağırır; listelere bir kez eklenir. */
(() => {
  'use strict';
  const CIZGI = '#3B3444';

  /* ------------------------------------------------------------ çizim yardımcıları (yerel merkez 0,0; s = çap) */
  function gozler(g, s, x, y, ara, boy) {
    const r = s * (boy || .06);
    [-1, 1].forEach(k => {
      g.fillStyle = '#1E1A22'; g.beginPath(); g.ellipse(x + k * ara * s, y, r, r * 1.2, 0, 0, 7); g.fill();
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x + k * ara * s - r * .3, y - r * .45, r * .38, 0, 7); g.fill();
    });
  }
  function yanak(g, s, x, y, ara) { g.fillStyle = 'rgba(255,120,150,.55)'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(x + k * ara * s, y, s * .07, s * .04, 0, 0, 7); g.fill(); }); }
  function gulus(g, s, x, y, gen) { g.strokeStyle = '#1E1A22'; g.lineWidth = Math.max(.25, s * .03); g.lineCap = 'round'; g.beginPath(); g.arc(x, y - s * gen * .3, s * gen * .5, .25 * Math.PI, .75 * Math.PI); g.stroke(); }
  function cizgili(g, s, yol, dolgu) { g.fillStyle = dolgu; g.fill(yol); g.strokeStyle = CIZGI; g.lineWidth = Math.max(.25, s * .035); g.stroke(yol); }
  function parlak(g, s, x, y) { g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(x, y, s * .08, s * .04, -.6, 0, 7); g.fill(); }

  /* ------------------------------------------------------------ karakter ve figür çıkartmaları (özgün) */
  const KARAKTER = {
    hayalet(g, s) { const p = new Path2D(); const r = s * .38; p.moveTo(-r, s * .35); p.lineTo(-r, -s * .05); p.arc(0, -s * .05, r, Math.PI, 0); p.lineTo(r, s * .35); for (let k = 0; k < 4; k++) { const x = r - (k + .5) * r / 2; p.quadraticCurveTo(x + r * .12, s * .45, x - r * .25 + r * .25, s * .35 - (k % 2 ? 0 : s * .02)); } p.closePath(); cizgili(g, s, p, '#FFFFFF'); gozler(g, s, 0, -s * .06, .12, .055); yanak(g, s, 0, s * .06, .2); g.fillStyle = '#1E1A22'; g.beginPath(); g.ellipse(0, s * .12, s * .04, s * .055, 0, 0, 7); g.fill(); },
    kabak(g, s) { const p = new Path2D(); p.ellipse(0, s * .06, s * .44, s * .34, 0, 0, 7); cizgili(g, s, p, '#FF8A2A'); g.strokeStyle = 'rgba(160,70,10,.5)'; g.lineWidth = s * .025; [-.18, 0, .18].forEach(x => { g.beginPath(); g.ellipse(x * s, s * .06, s * .1, s * .32, 0, 0, 7); g.stroke(); }); g.fillStyle = '#4C8A3A'; g.fillRect(-s * .04, -s * .38, s * .08, s * .12); g.fillStyle = '#3A2010'; [-1, 1].forEach(k => { g.beginPath(); g.moveTo(k * s * .2, -s * .02); g.lineTo(k * s * .1, -s * .02); g.lineTo(k * s * .15, -s * .12); g.closePath(); g.fill(); }); g.beginPath(); g.moveTo(-s * .2, s * .12); g.quadraticCurveTo(0, s * .3, s * .2, s * .12); g.quadraticCurveTo(0, s * .2, -s * .2, s * .12); g.fill(); },
    yarasa(g, s) { const p = new Path2D(); p.moveTo(0, -s * .05); [-1, 1].forEach(k => { }); p.moveTo(0, -s * .1); p.bezierCurveTo(s * .2, -s * .3, s * .4, -s * .2, s * .48, -s * .12); p.quadraticCurveTo(s * .4, 0, s * .36, s * .08); p.quadraticCurveTo(s * .3, 0, s * .22, s * .08); p.quadraticCurveTo(s * .15, 0, 0, s * .14); p.quadraticCurveTo(-s * .15, 0, -s * .22, s * .08); p.quadraticCurveTo(-s * .3, 0, -s * .36, s * .08); p.quadraticCurveTo(-s * .4, 0, -s * .48, -s * .12); p.bezierCurveTo(-s * .4, -s * .2, -s * .2, -s * .3, 0, -s * .1); cizgili(g, s, p, '#2E2238'); g.fillStyle = '#2E2238'; g.beginPath(); g.arc(0, -s * .06, s * .12, 0, 7); g.fill(); g.fillStyle = '#FFD86B'; [-1, 1].forEach(k => { g.beginPath(); g.arc(k * s * .045, -s * .08, s * .025, 0, 7); g.fill(); }); },
    orumcek(g, s) { g.strokeStyle = '#1E1A22'; g.lineWidth = s * .02; g.beginPath(); g.moveTo(0, -s * .5); g.lineTo(0, -s * .1); g.stroke(); g.lineWidth = s * .035; for (let k = 0; k < 4; k++) [-1, 1].forEach(z => { g.beginPath(); g.moveTo(0, s * .05); g.quadraticCurveTo(z * s * .25, -s * .05 + k * s * .07, z * s * .32, s * .08 + k * s * .08); g.stroke(); }); g.fillStyle = '#1E1A22'; g.beginPath(); g.ellipse(0, s * .08, s * .14, s * .16, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -s * .07, s * .08, 0, 7); g.fill(); gozler(g, s, 0, -s * .08, .04, .025); },
    agKosesi(g, s) { g.strokeStyle = '#FFFFFF'; g.lineWidth = Math.max(.2, s * .015); const o = -s * .5; for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2; g.beginPath(); g.moveTo(o, o); g.lineTo(o + Math.cos(a) * s, o + Math.sin(a) * s); g.stroke(); } for (let r = 1; r <= 4; r++) { g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2, rr = r * s * .23; const x = o + Math.cos(a) * rr, y = o + Math.sin(a) * rr; if (k) g.quadraticCurveTo(o + Math.cos(a - Math.PI / 12) * rr * .85, o + Math.sin(a - Math.PI / 12) * rr * .85, x, y); else g.moveTo(x, y); } g.stroke(); } },
    misirSekeri(g, s) { const p = new Path2D(); p.moveTo(0, -s * .45); p.quadraticCurveTo(s * .3, s * .2, s * .26, s * .4); p.quadraticCurveTo(0, s * .48, -s * .26, s * .4); p.quadraticCurveTo(-s * .3, s * .2, 0, -s * .45); g.save(); g.clip(p); g.fillStyle = '#FFF7EA'; g.fillRect(-s, -s, s * 2, s * 2); g.fillStyle = '#FF9A2E'; g.fillRect(-s, -s * .05, s * 2, s * .25); g.fillStyle = '#FFD84A'; g.fillRect(-s, s * .2, s * 2, s * .4); g.restore(); g.strokeStyle = CIZGI; g.lineWidth = s * .03; g.stroke(p); },
    karaKedi(g, s) { const p = new Path2D(); p.ellipse(0, s * .08, s * .32, s * .28, 0, 0, 7); p.moveTo(-s * .28, -s * .05); p.lineTo(-s * .3, -s * .38); p.lineTo(-s * .08, -s * .17); p.moveTo(s * .28, -s * .05); p.lineTo(s * .3, -s * .38); p.lineTo(s * .08, -s * .17); g.fillStyle = '#211C26'; g.fill(p); g.fillStyle = '#B8F06A'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * s * .12, s * .04, s * .07, s * .05, 0, 0, 7); g.fill(); }); g.fillStyle = '#1E1A22'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * s * .12, s * .04, s * .018, s * .045, 0, 0, 7); g.fill(); }); g.fillStyle = '#FF8FB0'; g.beginPath(); g.moveTo(-s * .03, s * .13); g.lineTo(s * .03, s * .13); g.lineTo(0, s * .17); g.fill(); },
    kurukafa(g, s) { const p = new Path2D(); p.arc(0, -s * .04, s * .34, Math.PI * .85, Math.PI * .15, false); p.lineTo(s * .18, s * .36); p.lineTo(-s * .18, s * .36); p.closePath(); cizgili(g, s, p, '#FFF6F0'); g.fillStyle = '#2B2530'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * s * .13, s * .0, s * .09, s * .1, 0, 0, 7); g.fill(); }); g.fillStyle = '#FF7FAA'; [-1, 1].forEach(k => { g.beginPath(); g.arc(k * s * .13, s * .0, s * .035, 0, 7); g.fill(); }); g.fillStyle = '#2B2530'; g.beginPath(); g.moveTo(0, s * .12); g.lineTo(-s * .04, s * .19); g.lineTo(s * .04, s * .19); g.fill(); },
    palyaco(g, s, renk) { const p = new Path2D(); p.ellipse(0, s * .02, s * .34, s * .4, 0, 0, 7); cizgili(g, s, p, '#FFFFFF'); g.fillStyle = renk && renk !== '#FFFFFF' ? renk : '#E8342E'; [-1, 1].forEach(k => { g.beginPath(); g.arc(k * s * .36, -s * .2, s * .14, 0, 7); g.fill(); }); g.strokeStyle = '#2A2E6E'; g.lineWidth = s * .03; [-1, 1].forEach(k => { g.beginPath(); g.moveTo(k * s * .13, -s * .18); g.lineTo(k * s * .13, -s * .02); g.stroke(); }); gozler(g, s, 0, -s * .06, .13, .07); g.fillStyle = '#E8342E'; g.beginPath(); g.arc(0, s * .1, s * .08, 0, 7); g.fill(); parlak(g, s, -s * .02, s * .07); g.strokeStyle = '#E8342E'; g.lineWidth = s * .05; g.lineCap = 'round'; g.beginPath(); g.arc(0, s * .1, s * .2, .2 * Math.PI, .8 * Math.PI); g.stroke(); },
    sekizTop(g, s) { const r = s * .42; const rg = g.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r); rg.addColorStop(0, '#5A5560'); rg.addColorStop(.5, '#1E1A22'); rg.addColorStop(1, '#0E0C10'); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(-r * .1, -r * .1, r * .42, 0, 7); g.fill(); g.fillStyle = '#1E1A22'; g.font = 'bold ' + (r * .55) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('8', -r * .1, -r * .07); parlak(g, s, -r * .5, -r * .55); },
    portakal(g, s) { const r = s * .44; g.fillStyle = '#FF8A1E'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = '#FFF3D6'; g.beginPath(); g.arc(0, 0, r * .9, 0, 7); g.fill(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.fillStyle = '#FFA43A'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * .82, a + .06, a + Math.PI / 5 - .06); g.closePath(); g.fill(); } g.fillStyle = '#FFF3D6'; g.beginPath(); g.arc(0, 0, r * .1, 0, 7); g.fill(); },
    kivi(g, s) { const r = s * .44; g.fillStyle = '#8A6A3A'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = '#7CC24A'; g.beginPath(); g.arc(0, 0, r * .9, 0, 7); g.fill(); g.fillStyle = '#E8F5C8'; g.beginPath(); g.arc(0, 0, r * .3, 0, 7); g.fill(); g.fillStyle = '#1E1A22'; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; g.beginPath(); g.ellipse(Math.cos(a) * r * .42, Math.sin(a) * r * .42, r * .04, r * .07, a, 0, 7); g.fill(); } },
    cilekYuz(g, s) { const p = new Path2D(); p.moveTo(0, s * .42); p.bezierCurveTo(-s * .45, s * .1, -s * .4, -s * .3, 0, -s * .25); p.bezierCurveTo(s * .4, -s * .3, s * .45, s * .1, 0, s * .42); cizgili(g, s, p, '#F2405A'); g.fillStyle = '#FFE9A8'; for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(((k * 37) % 7 - 3) * s * .08, ((k * 53) % 5 - 1) * s * .09 + s * .05, s * .015, s * .025, 0, 0, 7); g.fill(); } g.fillStyle = '#4CA34A'; g.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .55; g.ellipse(Math.cos(a) * s * .1, -s * .28 + Math.sin(a) * s * .04, s * .1, s * .04, a, 0, 7); } g.fill(); gozler(g, s, 0, s * .02, .1, .05); yanak(g, s, 0, s * .1, .17); },
    seftali(g, s) { const p = new Path2D(); p.arc(-s * .1, s * .04, s * .3, 0, 7); p.arc(s * .1, s * .04, s * .3, 0, 7); g.fillStyle = '#FFB38A'; g.fill(p); const rg = g.createRadialGradient(s * .1, s * .1, 0, s * .1, s * .1, s * .35); rg.addColorStop(0, 'rgba(255,110,120,.5)'); rg.addColorStop(1, 'rgba(255,110,120,0)'); g.fillStyle = rg; g.fill(p); g.fillStyle = '#5BAF5B'; g.beginPath(); g.ellipse(s * .1, -s * .3, s * .14, s * .06, -.5, 0, 7); g.fill(); gozler(g, s, 0, s * .02, .1, .045); },
    tavsan(g, s) { const p = new Path2D(); p.ellipse(-s * .12, -s * .26, s * .07, s * .2, -.15, 0, 7); p.ellipse(s * .12, -s * .26, s * .07, s * .2, .15, 0, 7); p.ellipse(0, s * .1, s * .3, s * .26, 0, 0, 7); cizgili(g, s, p, '#FFFFFF'); g.fillStyle = '#FFC2D2'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * s * .12, -s * .26, s * .03, s * .12, k * .15, 0, 7); g.fill(); }); gozler(g, s, 0, s * .06, .1, .045); yanak(g, s, 0, s * .15, .17); g.fillStyle = '#FF8FB0'; g.beginPath(); g.arc(0, s * .13, s * .025, 0, 7); g.fill(); },
    kurbaga(g, s) { const p = new Path2D(); p.ellipse(0, s * .1, s * .38, s * .26, 0, 0, 7); p.arc(-s * .17, -s * .14, s * .12, 0, 7); p.arc(s * .17, -s * .14, s * .12, 0, 7); cizgili(g, s, p, '#7CCB6A'); g.fillStyle = '#FFFFFF'; [-1, 1].forEach(k => { g.beginPath(); g.arc(k * s * .17, -s * .14, s * .08, 0, 7); g.fill(); }); gozler(g, s, 0, -s * .14, .17, .045); gulus(g, s, 0, s * .2, .3); yanak(g, s, 0, s * .12, .24); },
    penguen(g, s) { const p = new Path2D(); p.ellipse(0, s * .05, s * .3, s * .4, 0, 0, 7); cizgili(g, s, p, '#2A2E3E'); g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(0, s * .12, s * .21, s * .3, 0, 0, 7); g.fill(); gozler(g, s, 0, -s * .1, .09, .045); g.fillStyle = '#FFB13A'; g.beginPath(); g.moveTo(-s * .05, -s * .02); g.lineTo(s * .05, -s * .02); g.lineTo(0, s * .05); g.fill(); yanak(g, s, 0, s * .02, .16); },
    civciv(g, s) { const p = new Path2D(); p.arc(0, s * .05, s * .36, 0, 7); cizgili(g, s, p, '#FFE04A'); g.strokeStyle = '#F2B81A'; g.lineWidth = s * .03; g.beginPath(); g.moveTo(-s * .02, -s * .31); g.quadraticCurveTo(-s * .08, -s * .45, s * .05, -s * .42); g.stroke(); gozler(g, s, 0, 0, .12, .05); g.fillStyle = '#FF8A2A'; g.beginPath(); g.moveTo(-s * .06, s * .08); g.lineTo(s * .06, s * .08); g.lineTo(0, s * .15); g.fill(); yanak(g, s, 0, s * .1, .2); },
    ahtapot(g, s) { const p = new Path2D(); p.arc(0, -s * .08, s * .3, Math.PI, 0); p.lineTo(s * .3, s * .1); for (let k = 0; k < 5; k++) { const x = s * .3 - (k + 1) * s * .12; p.quadraticCurveTo(x + s * .06, s * .42, x, s * .12); } p.closePath(); cizgili(g, s, p, '#FF8FB8'); gozler(g, s, 0, -s * .06, .1, .05); yanak(g, s, 0, s * .03, .18); },
    dinozor(g, s) { const p = new Path2D(); p.ellipse(0, s * .1, s * .32, s * .26, 0, 0, 7); p.ellipse(s * .2, -s * .18, s * .16, s * .14, 0, 0, 7); cizgili(g, s, p, '#8FD48A'); g.fillStyle = '#FF9FC0'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-s * .25 + k * s * .12, -s * .12 + k * .01); g.lineTo(-s * .2 + k * s * .12, -s * .24); g.lineTo(-s * .15 + k * s * .12, -s * .12); g.fill(); } gozler(g, s, s * .2, -s * .2, .05, .035); yanak(g, s, s * .2, -s * .12, .09); },
    bulutYuz(g, s) { const p = new Path2D(); [[-.2, .05, .2], [0, -.08, .25], [.22, .04, .2], [0, .12, .22]].forEach(([x, y, r]) => p.arc(x * s, y * s, r * s, 0, 7)); g.fillStyle = '#FFFFFF'; g.fill(p); g.strokeStyle = 'rgba(59,52,68,.35)'; g.lineWidth = s * .02; g.stroke(p); gozler(g, s, 0, s * .02, .1, .04); yanak(g, s, 0, s * .1, .18); gulus(g, s, 0, s * .14, .14); },
    yildizYuz(g, s) { const p = new Path2D(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? s * .22 : s * .46; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (k) p.lineTo(x, y); else p.moveTo(x, y); } p.closePath(); g.lineJoin = 'round'; cizgili(g, s, p, '#FFD84A'); gozler(g, s, 0, s * .02, .08, .04); yanak(g, s, 0, s * .1, .15); },
    gulBoyama(g, s, renk) { const r = renk && renk !== '#FFFFFF' ? renk : '#D81E3C'; for (let k = 5; k >= 0; k--) { const rr = s * (.12 + k * .055); g.fillStyle = k % 2 ? r : '#FFFFFF'; g.globalAlpha = k % 2 ? 1 : .35; g.beginPath(); g.arc(Math.cos(k * 2.4) * s * .02, Math.sin(k * 2.4) * s * .02, rr, 0, 7); g.fill(); } g.globalAlpha = 1; g.strokeStyle = 'rgba(80,0,20,.5)'; g.lineWidth = s * .02; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(0, 0, s * (.08 + k * .07), k * 1.3, k * 1.3 + 3.6); g.stroke(); } g.fillStyle = '#3F8A3A'; [-1, 1].forEach(z => { g.beginPath(); g.ellipse(z * s * .3, s * .3, s * .14, s * .06, z * .7, 0, 7); g.fill(); }); },
    kalpYuz(g, s) { const p = new Path2D(); const r = s / 2; p.moveTo(0, r * .9); p.bezierCurveTo(-r * 1.25, r * .1, -r * .95, -r * .95, 0, -r * .35); p.bezierCurveTo(r * .95, -r * .95, r * 1.25, r * .1, 0, r * .9); cizgili(g, s, p, '#FF6F96'); gozler(g, s, 0, -s * .02, .1, .045); yanak(g, s, 0, s * .07, .17); gulus(g, s, 0, s * .12, .12); },
    mantarYuz(g, s) { const p = new Path2D(); p.arc(0, 0, s * .4, Math.PI, 0); p.closePath(); cizgili(g, s, p, '#E8342E'); g.fillStyle = '#FFFFFF'; [[-.2, -.15, .07], [.1, -.25, .06], [.25, -.08, .05]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x * s, y * s, r * s, 0, 7); g.fill(); }); const b = new Path2D(); b.rect(-s * .16, 0, s * .32, s * .3); cizgili(g, s, b, '#FFF3E6'); gozler(g, s, 0, s * .12, .07, .035); },
    zincirSerit(g, s, renk) { const r = renk && renk !== '#FFFFFF' ? renk : '#E2B74A'; g.save(); g.rotate(-.5); for (let k = -3; k <= 3; k++) { g.strokeStyle = r; g.lineWidth = s * .05; g.beginPath(); g.ellipse(k * s * .14, 0, s * .09, s * .05, 0, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = s * .015; g.beginPath(); g.ellipse(k * s * .14, -s * .01, s * .07, s * .03, 0, 3.4, 5.8); g.stroke(); } g.restore(); },
    tasSerit(g, s) { g.save(); g.rotate(-.5); for (let k = -4; k <= 4; k++) { const x = k * s * .1, rg = g.createRadialGradient(x - s * .015, -s * .015, 0, x, 0, s * .045); rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(.6, '#D7DCE6'); rg.addColorStop(1, '#8A93A6'); g.fillStyle = rg; g.beginPath(); g.arc(x, 0, s * .045, 0, 7); g.fill(); } g.restore(); },
    altinKivrim(g, s) { g.lineCap = 'round'; const yol = (o) => { g.beginPath(); g.moveTo(-s * .4, s * .3 + o); g.bezierCurveTo(-s * .1, s * .3 + o, -s * .3, -s * .1 + o, 0, -s * .05 + o); g.bezierCurveTo(s * .3, 0 + o, s * .1, -s * .4 + o, s * .4, -s * .35 + o); g.stroke(); }; g.strokeStyle = '#8A6A1A'; g.lineWidth = s * .07; yol(s * .01); g.strokeStyle = '#E2B74A'; g.lineWidth = s * .055; yol(0); g.strokeStyle = 'rgba(255,248,210,.85)'; g.lineWidth = s * .015; yol(-s * .012); }
  };
  const KARAKTER_LISTE = [
    ['hayalet', 'Hayalet Pofuduk', '#FFFFFF'], ['kabak', 'Kabak Fener', '#FF8A2A'], ['yarasa', 'Minik Yarasa', '#2E2238'], ['orumcek', 'Örümcek Ponpon', '#1E1A22'], ['agKosesi', 'Örümcek ağı', '#FFFFFF'],
    ['misirSekeri', 'Mısır şekeri', '#FFD84A'], ['karaKedi', 'Kara Kedi Gece', '#211C26'], ['kurukafa', 'Şeker Kafatası', '#FFF6F0'], ['palyaco', 'Palyaço Gıdık', '#E8342E'], ['sekizTop', 'Sekiz top', '#1E1A22'],
    ['portakal', 'Portakal dilimi', '#FF8A1E'], ['kivi', 'Kivi dilimi', '#7CC24A'], ['cilekYuz', 'Çilek Çilli', '#F2405A'], ['seftali', 'Şeftali Pamuk', '#FFB38A'], ['tavsan', 'Tavşan Pıtpıt', '#FFFFFF'],
    ['kurbaga', 'Kurbağa Vırak', '#7CCB6A'], ['penguen', 'Penguen Paytak', '#2A2E3E'], ['civciv', 'Civciv Cik', '#FFE04A'], ['ahtapot', 'Ahtapot Sekiz', '#FF8FB8'], ['dinozor', 'Dino Pembiş', '#8FD48A'],
    ['bulutYuz', 'Bulut Uykucu', '#FFFFFF'], ['yildizYuz', 'Yıldız Işıl', '#FFD84A'], ['gulBoyama', 'Elde boyalı gül', '#D81E3C'], ['kalpYuz', 'Kalp Tatlış', '#FF6F96'], ['mantarYuz', 'Mantar Benekli', '#E8342E'],
    ['zincirSerit', 'Altın zincir şerit', '#E2B74A'], ['tasSerit', 'Taş şerit', '#FFFFFF'], ['altinKivrim', 'Altın kıvrım', '#E2B74A']
  ];
  // 3D jel heykellerin 2D çizimi (2D salon ve küçük resimler için)
  function heykel2D(govde) { return (g, s, renk) => { g.save(); g.shadowColor = 'rgba(50,24,40,.4)'; g.shadowBlur = s * .1; g.shadowOffsetY = s * .05; govde(g, s, renk); g.restore(); parlak(g, s, -s * .15, -s * .15); }; }
  const HEYKEL_2D = {
    heykelHayalet: heykel2D((g, s) => KARAKTER.hayalet(g, s)), heykelKabak: heykel2D((g, s) => KARAKTER.kabak(g, s)),
    heykelAyicik: heykel2D((g, s, r) => { const p = new Path2D(); p.arc(0, s * .05, s * .36, 0, 7); p.arc(-s * .28, -s * .25, s * .13, 0, 7); p.arc(s * .28, -s * .25, s * .13, 0, 7); cizgili(g, s, p, r && r !== '#FFFFFF' ? r : '#C99A6A'); g.fillStyle = '#F3D9BE'; g.beginPath(); g.ellipse(0, s * .15, s * .14, s * .1, 0, 0, 7); g.fill(); gozler(g, s, 0, -s * .02, .12, .045); g.fillStyle = '#1E1A22'; g.beginPath(); g.ellipse(0, s * .11, s * .04, s * .03, 0, 0, 7); g.fill(); }),
    heykelPalyaco: heykel2D((g, s, r) => KARAKTER.palyaco(g, s, r)),
    heykelKiraz: heykel2D((g, s) => { g.strokeStyle = '#4C8A3A'; g.lineWidth = s * .04; g.beginPath(); g.moveTo(-s * .15, 0); g.quadraticCurveTo(0, -s * .45, s * .15, 0); g.stroke(); [-.15, .15].forEach(x => { g.fillStyle = '#C8102E'; g.beginPath(); g.arc(x * s, s * .12, s * .17, 0, 7); g.fill(); }); }),
    heykelYildiz: heykel2D((g, s, r) => { const p = new Path2D(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? s * .22 : s * .46; if (k) p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else p.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } p.closePath(); g.fillStyle = r || '#FFD84A'; g.fill(p); }),
    heykelSekiz: heykel2D((g, s) => KARAKTER.sekizTop(g, s)),
    heykelMantar: heykel2D((g, s) => KARAKTER.mantarYuz(g, s))
  };
  const HEYKEL_LISTE = [['heykelHayalet', '3D hayalet', .5], ['heykelKabak', '3D kabak', .5], ['heykelAyicik', '3D ayıcık', .5], ['heykelPalyaco', '3D palyaço', .55], ['heykelKiraz', '3D kiraz', .45], ['heykelYildiz', '3D yıldız', .45], ['heykelSekiz', '3D sekiz top', .5], ['heykelMantar', '3D mantar', .5]];

  /* ------------------------------------------------------------ yeni renk koleksiyonları (Türkçe adlar) */
  const YENI_PALET = [
    { id: 'buz', ad: 'Buzlu & ombre', renkler: [['Buz Mavisi', '#D3E6F3'], ['Cemre Mavisi', '#C6DDF0'], ['Süt Beyazı', '#F6F4F2'], ['Kar Tanesi', '#EEF4FA'], ['Sis Pembesi', '#F3DEE0'], ['Opal Mavi', '#BFD8EC'], ['Bulut Lilası', '#DCD6EE'], ['Nane Buzu', '#CFEDE4']] },
    { id: 'cadilar', ad: 'Cadılar Bayramı', renkler: [['Balkabağı', '#FF7A1A'], ['Gece Siyahı', '#16141A'], ['İksir Moru', '#5B2A86'], ['Zehir Yeşili', '#7EE04A'], ['Hayalet Beyazı', '#F7F4EE'], ['Mısır Şekeri Sarısı', '#FFD84A'], ['Vampir Kırmızısı', '#7A0A1A'], ['Örümcek Grisi', '#4A4650']] },
    { id: 'meyve', ad: 'Meyve sepeti', renkler: [['Portakal Kabuğu', '#FF8A1E'], ['Kivi Yeşili', '#7CC24A'], ['Çilek Kırmızısı', '#F2405A'], ['Şeftali Tüyü', '#FFB38A'], ['Limon Kabuğu', '#FFE45A'], ['Karpuz İçi', '#FF5A6E'], ['Böğürtlen', '#4A1A4E'], ['Avokado', '#7A9A3A']] },
    { id: 'mucevher', ad: 'Mücevher tonları', renkler: [['Yakut', '#9B0F2E'], ['Zümrüt', '#0F6B4A'], ['Safir', '#1A3A8A'], ['Ametist', '#7A3AA8'], ['Topaz', '#E8A23A'], ['Turmalin', '#E85A8A'], ['Akuamarin', '#6AC6D6'], ['Oniks', '#121014']], tur: 'jelly' },
    { id: 'sonbahar', ad: 'Sonbahar', renkler: [['Tarçın Çubuğu', '#9A4A2A'], ['Hardal', '#C8961E'], ['Kızıl Yaprak', '#B8361E'], ['Kestane', '#5A2E1E'], ['Sütlü Kakao', '#9A7058'], ['Zeytin Yeşili', '#5A6A2E'], ['Bordo Şarap', '#5A0F22'], ['Bal Rengi', '#D89A3A']] },
    { id: 'kirmiziKedi', ad: 'Kırmızı kedi gözü', renkler: [['Kızıl Kedi Gözü', '#9E0F1E', 'kediGozu'], ['Yakut Mıknatıs', '#7A0A1A', 'kediGozu'], ['Gül Kedi', '#C2185B', 'kediGozu'], ['Altın Kedi', '#8A6A1A', 'kediGozu']] }
  ];

  /* ------------------------------------------------------------ 45 yeni hazır tasarım */
  function tasarimlar(st, ek) {
    const sus = (id, x, y, olcek, renk, don) => ({ id, x, y, olcek, don: don || 0, renk: renk || '#FFFFFF' });
    const cik = (id, x, y, olcek, renk, don) => ({ id, x, y, olcek, don: don || 0, renk: renk || '#FFFFFF' });
    const metal = (renk, k, n) => ({ renk, k, n });
    const KIVRIM = [[-.6, .25], [-.2, .42], [.25, .3], [.5, .55], [.15, .75], [-.3, .82]];
    const DALGA = [[-.9, .35], [-.4, .48], [0, .4], [.4, .55], [.85, .5]];
    return [
      // Cadılar Bayramı
      { id: 'hHayalet', ad: 'Hayalet gecesi', aciklama: 'Siyah zemin, işaret ve yüzükte sevimli hayaletler.', yap: i => st({ sekil: 'badem', uzunluk: .7, renk: i % 2 ? '#F7F4EE' : '#16141A', cikartmalar: i % 2 ? [cik('hayalet', 0, .5, .7)] : [cik('agKosesi', -.3, .25, .8)] }) },
      { id: 'hKabak', ad: 'Kabak fener', aciklama: 'Turuncu jöle, orta parmakta gülen kabak.', yap: i => st({ sekil: 'stiletto', uzunluk: .75, renk: '#FF7A1A', ojeTur: i === 2 ? 'krem' : 'jelly', kat: 3, cikartmalar: i === 2 ? [cik('kabak', 0, .5, .72)] : [] }) },
      { id: 'hYarasa', ad: 'Mavi yarasalar', aciklama: 'Gece mavisi airbrush, yarasa siluetleri.', yap: i => st({ sekil: 'badem', uzunluk: .65, renk: '#12244A', firca: [{ tur: 'sprey', renk: '#2D9CFF', n: [[0, .55, .55, .7], [.1, .45, .5, .6]] }], cikartmalar: [cik('yarasa', (i % 2 ? .2 : -.2), .55, .55)] }) },
      { id: 'hOrumcek', ad: 'Örümcek ağı', aciklama: 'Holo zemin üstünde beyaz ağ ve minik örümcek.', yap: i => st({ sekil: 'stiletto', uzunluk: .78, renk: '#2A2346', efekt: 'holo', cikartmalar: [cik('agKosesi', -.2, .3, .9)].concat(i === 3 ? [cik('orumcek', .3, .65, .45)] : []) }) },
      { id: 'hMisir', ad: 'Mısır şekeri', aciklama: 'Beyaz-turuncu-sarı şeritler, serçede kara kedi.', yap: i => st({ sekil: 'stiletto', uzunluk: .75, renk: '#FFF7EA', teknik: { id: 'ombre', renk2: '#FFD84A', kalinlik: .4 }, cikartmalar: i === 4 ? [cik('karaKedi', 0, .5, .7)] : i === 1 ? [cik('misirSekeri', 0, .5, .7)] : [] }) },
      { id: 'hKedi', ad: 'Kara kedi ve kafatası', aciklama: 'Mat siyah, yeşil gözlü kedi, şeker kafatası.', yap: i => st({ sekil: 'coffin', uzunluk: .7, renk: '#16141A', ust: 'mat', cikartmalar: i === 1 ? [cik('karaKedi', 0, .5, .7)] : i === 3 ? [cik('kurukafa', 0, .5, .65)] : [] }) },
      // meyve
      { id: 'mPortakal', ad: 'Portakal dilimleri', aciklama: 'Kırmızı simli + portakal dilimleri.', yap: i => st({ sekil: 'badem', uzunluk: .5, renk: i % 2 ? '#FFF3D6' : '#C8102E', ojeTur: i % 2 ? 'krem' : 'simIri', kat: 3, cikartmalar: i % 2 ? [cik('portakal', 0, .6, .85)] : [] }) },
      { id: 'mKivi', ad: 'Kivi tazeliği', aciklama: 'Nane yeşili, yüzükte kivi dilimi.', yap: i => st({ sekil: 'oval', uzunluk: .45, renk: '#CFEDE4', cikartmalar: i === 3 ? [cik('kivi', 0, .5, .8)] : [] }) },
      { id: 'mCilek', ad: 'Çilekli süt', aciklama: 'Sütlü pembe, minik çilek karakterler.', yap: i => st({ sekil: 'yuvarlak', uzunluk: .38, renk: '#FBE4EA', ojeTur: 'sheer', kat: 3, cikartmalar: i % 2 ? [cik('cilekYuz', 0, .5, .65)] : [] }) },
      { id: 'mKarpuz', ad: 'Karpuz yazı', aciklama: 'Karpuz kırmızısı, yeşil uç, siyah çekirdek.', yap: () => st({ sekil: 'squoval', uzunluk: .4, renk: '#FF5A6E', teknik: { id: 'french', renk2: '#3FA34D', kalinlik: .2, stil: 'renkli' }, firca: [{ tur: 'pro', f: { sk: 'n', g: .07 }, renk: '#19161C', n: [[-.3, .55, 1, 1], [.25, .45, 1, 1], [0, .7, 1, 1]] }] }) },
      { id: 'mSeftali', ad: 'Şeftali pamuk', aciklama: 'Şeftali aura, işarette şeftali karakter.', yap: i => st({ sekil: 'badem', uzunluk: .55, renk: '#FFE3D2', teknik: { id: 'aura', renk2: '#FF9A8A', kalinlik: .35, x: 0, y: .5 }, cikartmalar: i === 1 ? [cik('seftali', 0, .5, .7)] : [] }) },
      { id: 'mLimon', ad: 'Limon kabuğu', aciklama: 'Limon sarısı jöle, beyaz mikro French.', yap: () => st({ sekil: 'oval', uzunluk: .45, renk: '#FFE45A', ojeTur: 'jelly', kat: 3, teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .1, stil: 'mikro' } }) },
      // 3D güller
      { id: 'gKirmizi', ad: 'Kırmızı 3D güller', aciklama: 'Vişne jöle, iki parmakta kabarık jel gül.', yap: i => st({ sekil: 'badem', uzunluk: .62, renk: '#8C0F26', ojeTur: 'jelly', kat: 3, susler: i === 1 || i === 3 ? [sus('heykelGul', 0, .45, .62, '#D81E3C')] : [] }) },
      { id: 'gPembe', ad: 'Pembe gül bahçesi', aciklama: 'Sütlü pembe, gül, kalp ve inci.', yap: i => st({ sekil: 'oval', uzunluk: .52, renk: '#FBE4EA', ojeTur: 'sheer', kat: 2, susler: i === 3 ? [sus('heykelGul', -.1, .45, .55, '#F48FB1'), sus('kalp3d', .35, .75, .25, '#EE8AAA'), sus('inciMini', .4, .25, .14)] : i === 1 ? [sus('kalp3d', 0, .5, .4, '#F48FB1')] : [] }) },
      { id: 'gGelin', ad: 'Beyaz gelin gülü', aciklama: 'Süt beyazı, beyaz jel gül, inci dizisi.', yap: i => st({ sekil: 'coffin', uzunluk: .6, renk: '#F7F1EE', ojeTur: 'sheer', kat: 3, efekt: 'inci', susler: i === 2 ? [sus('heykelGul', 0, .5, .6, '#FFFFFF')] : [sus('inciSira', 0, .16, .8)] }) },
      { id: 'gElde', ad: 'Elde boyalı güller', aciklama: 'Nude zemin, ince fırçayla boyanmış güller.', yap: i => st({ sekil: 'badem', uzunluk: .55, renk: '#F2DCD2', ojeTur: 'sheer', cikartmalar: [cik('gulBoyama', i % 2 ? .2 : -.2, .5, .7, '#C8102E')] }) },
      // altın liquid metal
      { id: 'lmBeyaz', ad: 'Beyaz + altın kıvrım', aciklama: 'Sütlü beyaz, kabarık altın liquid metal kıvrım.', yap: i => st({ sekil: 'badem', uzunluk: .65, renk: '#F7F4F0', metal: [metal('#D4AF37', .07, KIVRIM.map(p => [p[0] * (i % 2 ? -1 : 1), p[1]]))] }) },
      { id: 'lmSiyah', ad: 'Siyah altın', aciklama: 'Mat siyah üstünde altın damarlar.', yap: () => st({ sekil: 'stiletto', uzunluk: .75, renk: '#16141A', ust: 'mat', metal: [metal('#D4AF37', .06, DALGA), metal('#D4AF37', .04, [[-.5, .7], [0, .82], [.4, .75]])] }) },
      { id: 'lmNude', ad: 'Nude altın damar', aciklama: 'Şeffaf nude, ince altın çizgi ve minik taş.', yap: i => st({ sekil: 'badem', uzunluk: .58, renk: '#EAD3C3', ojeTur: 'sheer', metal: [metal('#E2B74A', .045, [[-.7, .9], [-.1, .6], [.3, .4], [.6, .1]])], susler: i === 3 ? [sus('tasS', .35, .3, .16)] : [] }) },
      { id: 'lmGumus', ad: 'Gümüş dalga', aciklama: 'Lavanta krom, gümüş liquid metal dalgası.', yap: () => st({ sekil: 'coffin', uzunluk: .66, renk: '#DCD6EE', efekt: 'holo', metal: [metal('#C9CED6', .06, DALGA)] }) },
      // kırmızı kedi gözü
      { id: 'kkKizil', ad: 'Kızıl kedi gözü', aciklama: 'Derin kırmızı kedi gözü, gümüş krom çizgiler.', yap: i => st({ sekil: 'badem', uzunluk: .62, renk: '#9E0F1E', ojeTur: 'kediGozu', kat: 2, kedi: { x: 0, y: .5, aci: -.3, gen: .5 }, metal: i % 2 ? [metal('#C9CED6', .035, [[-.6, .2], [-.2, .5], [-.3, .8]]), metal('#C9CED6', .03, [[.5, .3], [.2, .6]])] : [] }) },
      { id: 'kkBordo', ad: 'Bordo kadife göz', aciklama: 'Geniş ışık bandı, siyah kenar.', yap: () => st({ sekil: 'stiletto', uzunluk: .76, renk: '#7A0A1A', ojeTur: 'kediGozu', kat: 2, kedi: { x: 0, y: .55, aci: 0, gen: .9 }, firca: [{ tur: 'sprey', renk: '#16141A', n: [[-1, .5, .3, .7], [1, .5, .3, .7]] }] }) },
      { id: 'kkKrom', ad: 'Kırmızı krom çizgi', aciklama: 'Kırmızı-siyah geçiş, krom yıldırım çizgileri.', yap: () => st({ sekil: 'badem', uzunluk: .66, renk: '#C8102E', teknik: { id: 'ombre', renk2: '#16141A', kalinlik: .4 }, metal: [metal('#E6E9EE', .03, [[-.4, .3], [-.1, .45], [-.25, .6], [.1, .8]])] }) },
      // beyaz French + altın çizgi
      { id: 'frAltin', ad: 'Beyaz French + altın çizgi', aciklama: 'Pembe nude, beyaz uç, ince altın sınır.', yap: () => st({ sekil: 'badem', uzunluk: .66, renk: '#F6D8DF', ojeTur: 'sheer', kat: 2, teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .28, stil: 'klasik' }, metal: [metal('#D4AF37', .03, [[-.95, .66], [-.5, .74], [0, .78], [.5, .74], [.95, .66]])] }) },
      { id: 'frVAltin', ad: 'V French altın', aciklama: 'Sivri V beyaz uç, altın kenar, minik taş.', yap: i => st({ sekil: 'stiletto', uzunluk: .76, renk: '#F6D8DF', ojeTur: 'sheer', teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .32, stil: 'v' }, metal: [metal('#D4AF37', .03, [[-.95, .55], [0, .8], [.95, .55]])], susler: i === 3 ? [sus('tasS', 0, .4, .16)] : [] }) },
      { id: 'frDalga', ad: 'Dalgalı beyaz uç', aciklama: 'Beyaz yan uç ve altın kıvrım çizgi.', yap: () => st({ sekil: 'coffin', uzunluk: .7, renk: '#F3DEE0', ojeTur: 'sheer', teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .34, stil: 'asimetrik' }, metal: [metal('#D4AF37', .035, [[-.9, .45], [-.3, .58], [.2, .5], [.8, .75]])] }) },
      // aura
      { id: 'auPembe', ad: 'Pembe aura', aciklama: 'Ortada yumuşak pembe hale, airbrush.', yap: () => st({ sekil: 'badem', uzunluk: .6, renk: '#FFF2F6', teknik: { id: 'aura', renk2: '#FF5C93', kalinlik: .38, x: 0, y: .5 } }) },
      { id: 'auMor', ad: 'Mor aura krom', aciklama: 'Mor hale ve kuzey ışığı tozu.', yap: () => st({ sekil: 'coffin', uzunluk: .66, renk: '#EDE6FF', teknik: { id: 'aura', renk2: '#8E44D8', kalinlik: .36, x: 0, y: .5 }, efekt: 'aurora', efektG: .6 }) },
      { id: 'auGunes', ad: 'Gün batımı aura', aciklama: 'Turuncu-pembe sprey geçiş.', yap: () => st({ sekil: 'stiletto', uzunluk: .72, renk: '#FFD1A6', firca: [{ tur: 'sprey', renk: '#FF4F7A', n: [[0, .5, .45, .9], [0, .45, .35, .8]] }] }) },
      // stiletto taşlı
      { id: 'stKristal', ad: 'Kristal stiletto', aciklama: 'Pembe şeffaf stiletto, kristal kümeleri.', yap: i => st({ sekil: 'stiletto', uzunluk: .86, protez: 'polygel', renk: '#F6D3DC', ojeTur: 'sheer', kat: 3, efekt: 'aurora', efektG: .5, susler: [sus('tasL', 0, .32, .34), sus('tasS', -.3, .5, .14), sus('tasMini', .25, .55, .1), sus('kristalDamla', 0, .62, .22)].slice(0, i % 2 ? 4 : 2) }) },
      { id: 'stInci', ad: 'İncili stiletto', aciklama: 'Krom sedef, inci ve gümüş liquid metal.', yap: () => st({ sekil: 'stiletto', uzunluk: .84, protez: 'polygel', renk: '#F7EFEA', efekt: 'inci', metal: [metal('#C9CED6', .05, [[-.5, .2], [0, .45], [.3, .7]])], susler: [sus('inciMini', -.2, .3, .14), sus('inci', .1, .5, .2)] }) },
      { id: 'stKral', ad: 'Kraliyet stiletto', aciklama: 'Siyah krom, altın zincir ve taş şerit.', yap: i => st({ sekil: 'stiletto', uzunluk: .86, protez: 'polygel', renk: '#16141A', efekt: 'kromAyna', efektG: .4, cikartmalar: [cik(i % 2 ? 'tasSerit' : 'zincirSerit', 0, .5, .9)] }) },
      // özgün karakterler
      { id: 'kTavsan', ad: 'Tavşan bahçesi', aciklama: 'Pastel yeşil, tavşan ve papatyalar.', yap: i => st({ sekil: 'yuvarlak', uzunluk: .4, renk: '#D4EDC9', cikartmalar: i % 2 ? [cik('tavsan', 0, .5, .7)] : [cik('papatya', 0, .5, .45)] }) },
      { id: 'kKurbaga', ad: 'Göl kenarı', aciklama: 'Su yeşili, kurbağa ve nokta deseni.', yap: i => st({ sekil: 'oval', uzunluk: .45, renk: '#CDEFEA', cikartmalar: i === 1 || i === 3 ? [cik('kurbaga', 0, .5, .72)] : [], firca: i % 2 ? [] : [{ tur: 'pro', f: { sk: 'n', g: .08 }, renk: '#7CCB6A', n: [[-.3, .3, 1, 1], [.3, .5, 1, 1], [-.1, .75, 1, 1]] }] }) },
      { id: 'kPenguen', ad: 'Kış penguenleri', aciklama: 'Buz mavisi, penguen ve kar noktaları.', yap: i => st({ sekil: 'squoval', uzunluk: .42, renk: '#D3E6F3', cikartmalar: i === 2 ? [cik('penguen', 0, .5, .72)] : [cik('bulutYuz', 0, .55, .55)] }) },
      { id: 'kCivciv', ad: 'Bahar civcivi', aciklama: 'Limonata sarısı, civciv ve kalp.', yap: i => st({ sekil: 'yuvarlak', uzunluk: .38, renk: '#FFF5BA', cikartmalar: i === 3 ? [cik('civciv', 0, .5, .7)] : [cik('kalpYuz', 0, .5, .5)] }) },
      { id: 'kAhtapot', ad: 'Deniz altı', aciklama: 'Mavi aura, sevimli ahtapot ve yıldız.', yap: i => st({ sekil: 'badem', uzunluk: .58, renk: '#BDE3F5', teknik: { id: 'aura', renk2: '#2D9CFF', kalinlik: .3, x: 0, y: .3 }, cikartmalar: i === 1 ? [cik('ahtapot', 0, .55, .7)] : i === 3 ? [cik('yildizYuz', 0, .5, .6)] : [] }) },
      { id: 'kDino', ad: 'Pembiş dino', aciklama: 'Pembe zemin, dinozor ve mantar.', yap: i => st({ sekil: 'squoval', uzunluk: .4, renk: '#FFD6E4', cikartmalar: i === 2 ? [cik('dinozor', 0, .5, .72)] : i === 4 ? [cik('mantarYuz', 0, .5, .6)] : [] }) },
      // Cemre'nin setinden esinlenen: palyaço, 8 top, zincir, taş şerit, kırmızı glitter, 3D figür
      { id: 'cemreEser1', ad: "Cemre'nin sirki", aciklama: 'Cemre\'nin ilk eserinden esinlenerek: palyaço yüzleri, siyah 8 top, kırmızı sim, altın zincir şeritler, 3D heykel.', yap: i => st([
        { sekil: 'badem', uzunluk: .7, protez: 'polygel', renk: '#16141A', cikartmalar: [cik('sekizTop', 0, .55, .62)] },
        { sekil: 'badem', uzunluk: .7, protez: 'polygel', renk: '#FBEFF1', cikartmalar: [cik('palyaco', 0, .5, .78)] },
        { sekil: 'badem', uzunluk: .7, protez: 'polygel', renk: '#F6D8DF', ojeTur: 'sheer', kat: 2, susler: [sus('heykelPalyaco', 0, .45, .6, '#FFFFFF')] },
        { sekil: 'badem', uzunluk: .7, protez: 'polygel', renk: '#5A0F22', cikartmalar: [cik('zincirSerit', 0, .45, .95), cik('tasSerit', 0, .72, .85)] },
        { sekil: 'badem', uzunluk: .7, protez: 'polygel', renk: '#C8102E', ojeTur: 'simIri', kat: 3, teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .3, stil: 'klasik' } }
      ][i]) },
      { id: 'cPalyaco', ad: 'Palyaço gülüşü', aciklama: 'Beyaz zemin, renkli palyaço yüzleri.', yap: i => st({ sekil: 'badem', uzunluk: .66, renk: '#FFFFFF', cikartmalar: [cik('palyaco', 0, .5, .78, ['#E8342E', '#FF8A2A', '#7A3AA8', '#2D9CFF', '#E8342E'][i])] }) },
      { id: 'cSekiz', ad: 'Sekiz top', aciklama: 'Parlak siyah, her parmakta 8 top.', yap: i => st({ sekil: 'coffin', uzunluk: .64, renk: i % 2 ? '#C8102E' : '#16141A', ojeTur: i % 2 ? 'simIri' : 'krem', kat: 3, cikartmalar: i % 2 ? [] : [cik('sekizTop', 0, .5, .62)] }) },
      { id: 'cZincir', ad: 'Zincir ve taş şerit', aciklama: 'Bordo zemin, çapraz altın zincir ve taş şeritler.', yap: i => st({ sekil: 'badem', uzunluk: .68, renk: '#5A0F22', cikartmalar: [cik('zincirSerit', 0, .35, .9), cik('tasSerit', 0, .58, .85), cik('zincirSerit', 0, .8, .9)].slice(0, i % 2 ? 3 : 2) }) },
      // efekt tasarımları
      { id: 'efKalp', ad: 'Airbrush kalp', aciklama: 'Şablonla püskürtülmüş kalpler.', yap: () => st({ sekil: 'badem', uzunluk: .55, renk: '#FFF2F6', firca: [{ tur: 'sprey', renk: '#FF2E93', sb: 'kalp', sx: 0, sy: .5, ss: .45, n: [[0, .5, .4, 1], [0, .45, .4, 1]] }] }) },
      { id: 'efBloom', ad: 'Lila blooming', aciklama: 'Beyaz blooming jelde açan lila lekeler.', yap: i => st({ sekil: 'oval', uzunluk: .5, renk: '#F7F4F0', bloom: [{ x: -.2 + i * .08, y: .45, r: .22, renk: '#B48CFF' }, { x: .3, y: .7, r: .14, renk: '#F48FB1' }] }) },
      { id: 'efJelHeykel', ad: 'Jel heykel kalpler', aciklama: 'Tül pembe üstünde elle şekillendirilmiş jel kalpler.', yap: i => st({ sekil: 'badem', uzunluk: .58, renk: '#F6C9D3', ojeTur: 'sheer', susler: i % 2 ? [sus('kalp3d', 0, .5, .45, '#D81E3C')] : [sus('heykelDamla', .2, .6, .22), sus('kalp3d', -.15, .35, .25, '#F48FB1')] }) }
    ];
  }

  /* ------------------------------------------------------------ kayıt (bir kez) */
  let kayitli = false;
  function kaydet(ic) {
    if (kayitli) return; kayitli = true;
    const S = ic.sabit;
    KARAKTER_LISTE.forEach(([id, ad, renk]) => { if (!S.CIKARTMA_CIZ[id]) { S.CIKARTMA_CIZ[id] = KARAKTER[id]; S.CIKARTMALAR.push({ id, ad, renk, olcek: .7, karakter: true }); } });
    HEYKEL_LISTE.forEach(([id, ad, olcek]) => { if (!S.SUS_CIZ[id]) { S.SUS_CIZ[id] = HEYKEL_2D[id]; S.SUSLER.push({ id, ad, olcek }); } });
    YENI_PALET.forEach(k => { if (!S.PALET.some(p => p.id === k.id)) S.PALET.splice(Math.max(1, S.PALET.length - 1), 0, { id: k.id, ad: k.ad, renkler: k.renkler.map(r => r.length > 2 ? r : (k.tur ? r.concat([k.tur]) : r)) }); });
    const st = (o) => Object.assign({ top: true, ust: 'parlak', kat: 2, ojeTur: 'krem' }, o);
    const yeni = tasarimlar(st);
    yeni.forEach(t => { if (!S.TRENDLER.some(x => x.id === t.id)) S.TRENDLER.push(t); });
  }

  /* ------------------------------------------------------------ "Cemre'nin tırnakları": sanatçının eserleri vitrini */
  const ESER_ILHAM = ['cemreEser1'];
  function vitrin(ic, foto) {
    const ctx = ic.ctx, S = ic.sabit;
    const kap = ctx.el('div.tirnak-vitrin');
    kap.appendChild(ctx.el('p.sessiz.tirnak-not', 'Cemre\'nin kendi elinden çıkan setler. Büyütmek için esere dokun; beğendiğinden ilham alıp benzer bir başlangıç tasarımı açabilirsin.'));
    foto.forEach((f, k) => {
      const src = window.GIZLI && typeof window.GIZLI.url === 'function' ? window.GIZLI.url(f.yol) : f.yol;
      const baslik = f.baslik || f.alt || "Cemre'nin eseri";
      const tarih = f.tarih ? (CD.tarihYaz ? CD.tarihYaz(f.tarih) : f.tarih) : 'Tarih eklenecek';
      const img = ctx.el('img.tirnak-vitrinResim', { src, alt: f.alt || baslik, loading: 'lazy' });
      img.addEventListener('error', () => { img.replaceWith(ctx.el('div.tirnak-fotoYok', 'Fotoğraf bu telefonda henüz açılmadı')); });
      const ilhamId = ESER_ILHAM[k] || 'cemreKlasik';
      const ilham = () => { const set = S.TRENDLER.find(t => t.id === ilhamId) || S.TRENDLER[0]; ctx.sheetKapat(); setTimeout(() => ic.setUygula(set), 320); };
      const buyut = () => ctx.sheet(ctx.el('div.dikey.tirnak-vitrinBuyuk', [
        ctx.el('div.tirnak-vitrinCerceve.buyuk', [ctx.el('img.tirnak-vitrinResim', { src, alt: f.alt || baslik })]),
        ctx.el('div.tirnak-plaket', [ctx.el('strong', baslik), ctx.el('span', 'Cemre · ' + tarih)]),
        ctx.el('button.dugme.tam', { type: 'button', onclick: ilham }, '✨ Bu eserden ilham al'),
        ctx.el('div.izgara-2', [
          ctx.el('a.dugme-ikincil', { href: '#/galeri', onclick: () => ctx.sheetKapat() }, '🖼️ Galeride gör'),
          ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => ic.galeriSheet('cemre') }, 'Vitrine dön')
        ])
      ]), { baslik, sessiz: true });
      kap.appendChild(ctx.el('figure.tirnak-vitrinEser', [
        ctx.el('button.tirnak-vitrinCerceve', { type: 'button', 'aria-label': 'Büyüt: ' + baslik, onclick: buyut }, [img]),
        ctx.el('figcaption.tirnak-plaket', [ctx.el('strong', baslik), ctx.el('span', 'Cemre · ' + tarih)]),
        ctx.el('div.izgara-2', [
          ctx.el('button.dugme.kucuk', { type: 'button', onclick: ilham }, '✨ Bu eserden ilham al'),
          ctx.el('a.dugme-ikincil.kucuk', { href: '#/galeri', onclick: () => ctx.sheetKapat() }, 'Galeride gör')
        ])
      ]));
    });
    return kap;
  }

  (window.CD = window.CD || {}).tirnakTasarim = { kaydet, vitrin, KARAKTER, KARAKTER_LISTE, HEYKEL_LISTE, sayi: () => ({ karakter: KARAKTER_LISTE.length, heykel: HEYKEL_LISTE.length, tasarim: tasarimlar(o => o).length }) };
})();
