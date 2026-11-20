/* qr.js — Bağımlılıksız QR kodlayıcı (bayt kipi, hata düzeltme M, sürüm 1–10 → en çok 213 bayt).
   ISO/IEC 18004 adımları: veri bitleri → Reed-Solomon (GF(256), 0x11D) → blok serpiştirme → işlev desenleri
   (bulucu, zamanlama, hizalama, biçim/sürüm bilgisi) → zikzak yerleşim → 8 maskeden ceza puanı en düşük olanı.
   CD.qr.matris(metin) → { boyut, m:[[bool]] }   CD.qr.svg(metin, { kenar:4, etiket }) → '<svg …>'   CD.qr.png(metin, px) → dataURL */
window.CD = window.CD || {};
(() => {
  'use strict';
  // [blok başına EC kodsözcüğü, grup1 blok, grup1 veri, grup2 blok, grup2 veri] — seviye M
  const EC_M = [null, [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]];
  const HIZA = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  function gfCarp(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function bolen(derece) {
    const r = new Array(derece).fill(0); r[derece - 1] = 1; let kok = 1;
    for (let i = 0; i < derece; i++) {
      for (let j = 0; j < r.length; j++) { r[j] = gfCarp(r[j], kok); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      kok = gfCarp(kok, 0x02);
    }
    return r;
  }
  function kalan(veri, b) {
    const r = new Array(b.length).fill(0);
    veri.forEach(x => { const f = x ^ r.shift(); r.push(0); b.forEach((c, i) => { r[i] ^= gfCarp(c, f); }); });
    return r;
  }

  function kodla(metin) {
    const bayt = Array.from(new TextEncoder().encode(String(metin)));
    let v = 1;
    for (; v <= 10; v++) {
      const e = EC_M[v], veriKS = e[1] * e[2] + e[3] * e[4];
      const bit = 4 + (v <= 9 ? 8 : 16) + bayt.length * 8;
      if (bit <= veriKS * 8) break;
    }
    if (v > 10) throw new Error('QR için metin çok uzun');
    const e = EC_M[v], veriKS = e[1] * e[2] + e[3] * e[4];
    // bit dizisi
    const bb = [];
    const ekle = (deger, n) => { for (let i = n - 1; i >= 0; i--) bb.push((deger >>> i) & 1); };
    ekle(4, 4); ekle(bayt.length, v <= 9 ? 8 : 16); bayt.forEach(x => ekle(x, 8));
    ekle(0, Math.min(4, veriKS * 8 - bb.length));
    while (bb.length % 8) bb.push(0);
    const ks = []; for (let i = 0; i < bb.length; i += 8) { let x = 0; for (let j = 0; j < 8; j++) x = (x << 1) | bb[i + j]; ks.push(x); }
    for (let p = 0; ks.length < veriKS; p++) ks.push(p % 2 ? 0x11 : 0xEC);
    // bloklar + EC
    const bloklar = [], ecler = [], b = bolen(e[0]);
    let k = 0;
    [[e[1], e[2]], [e[3], e[4]]].forEach(([adet, uz]) => { for (let i = 0; i < adet; i++) { const bl = ks.slice(k, k + uz); k += uz; bloklar.push(bl); ecler.push(kalan(bl, b)); } });
    const son = [];
    const enUzun = Math.max(...bloklar.map(x => x.length));
    for (let i = 0; i < enUzun; i++) bloklar.forEach(bl => { if (i < bl.length) son.push(bl[i]); });
    for (let i = 0; i < e[0]; i++) ecler.forEach(ec => son.push(ec[i]));
    return { v, kodlar: son };
  }

  function matris(metin) {
    const { v, kodlar } = kodla(metin);
    const n = v * 4 + 17;
    const m = Array.from({ length: n }, () => new Array(n).fill(false));
    const islev = Array.from({ length: n }, () => new Array(n).fill(false));
    const koy = (x, y, d) => { m[y][x] = !!d; islev[y][x] = true; };
    // zamanlama
    for (let i = 0; i < n; i++) { koy(6, i, i % 2 === 0); koy(i, 6, i % 2 === 0); }
    // bulucular (ayırıcılarıyla)
    const bulucu = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy; if (x >= 0 && x < n && y >= 0 && y < n) koy(x, y, d !== 2 && d !== 4); } };
    bulucu(3, 3); bulucu(n - 4, 3); bulucu(3, n - 4);
    // hizalama
    const hz = HIZA[v], s = hz.length;
    for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === s - 1) || (i === s - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) koy(hz[i] + dx, hz[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    const bicim = (maske) => {
      const veri = (0 << 3) | maske;            // M seviyesi biçim bitleri = 00
      let r = veri; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const bit = ((veri << 10) | r) ^ 0x5412;
      const g = (i) => ((bit >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) koy(8, i, g(i));
      koy(8, 7, g(6)); koy(8, 8, g(7)); koy(7, 8, g(8));
      for (let i = 9; i < 15; i++) koy(14 - i, 8, g(i));
      for (let i = 0; i < 8; i++) koy(n - 1 - i, 8, g(i));
      for (let i = 8; i < 15; i++) koy(8, n - 15 + i, g(i));
      koy(8, n - 8, true);
    };
    bicim(0);
    if (v >= 7) {
      let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const bit = (v << 12) | r;
      for (let i = 0; i < 18; i++) { const d = ((bit >>> i) & 1) !== 0, a = n - 11 + i % 3, b = Math.floor(i / 3); koy(a, b, d); koy(b, a, d); }
    }
    // veri yerleşimi (zikzak)
    let i = 0;
    for (let sag = n - 1; sag >= 1; sag -= 2) {
      if (sag === 6) sag = 5;
      for (let dik = 0; dik < n; dik++) for (let j = 0; j < 2; j++) {
        const x = sag - j, yukari = ((sag + 1) & 2) === 0, y = yukari ? n - 1 - dik : dik;
        if (!islev[y][x] && i < kodlar.length * 8) { m[y][x] = ((kodlar[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    // maske seçimi
    const MASKE = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
      (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0];
    const uygula = (k) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!islev[y][x] && MASKE[k](x, y)) m[y][x] = !m[y][x]; };
    const ceza = () => {
      let p = 0;
      for (let y = 0; y < n; y++) { let say = 1; for (let x = 1; x <= n; x++) { if (x < n && m[y][x] === m[y][x - 1]) say++; else { if (say >= 5) p += say - 2; say = 1; } } }
      for (let x = 0; x < n; x++) { let say = 1; for (let y = 1; y <= n; y++) { if (y < n && m[y][x] === m[y - 1][x]) say++; else { if (say >= 5) p += say - 2; say = 1; } } }
      for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
      const desen = (a) => a.join('') === '10111010000' || a.join('') === '00001011101';
      for (let y = 0; y < n; y++) for (let x = 0; x + 11 <= n; x++) { if (desen(m[y].slice(x, x + 11).map(b => b ? 1 : 0))) p += 40; }
      for (let x = 0; x < n; x++) for (let y = 0; y + 11 <= n; y++) { const a = []; for (let k = 0; k < 11; k++) a.push(m[y + k][x] ? 1 : 0); if (desen(a)) p += 40; }
      let koyu = 0; m.forEach(r => r.forEach(b => { if (b) koyu++; }));
      p += Math.floor(Math.abs(koyu * 20 - n * n * 10) / (n * n)) * 10;
      return p;
    };
    let enIyi = 0, enAz = Infinity;
    for (let k = 0; k < 8; k++) { uygula(k); bicim(k); const p = ceza(); if (p < enAz) { enAz = p; enIyi = k; } uygula(k); }
    uygula(enIyi); bicim(enIyi);
    return { boyut: n, surum: v, maske: enIyi, m };
  }

  function svg(metin, s) {
    s = s || {};
    const { boyut, m } = matris(metin), k = s.kenar == null ? 4 : s.kenar, T = boyut + k * 2;
    let yol = '';
    m.forEach((r, y) => { let x = 0; while (x < boyut) { if (!r[x]) { x++; continue; } let w = 1; while (x + w < boyut && r[x + w]) w++; yol += 'M' + (x + k) + ' ' + (y + k) + 'h' + w + 'v1h-' + w + 'z'; x += w; } });
    const et = String(s.etiket || 'QR kod').replace(/[<>&"]/g, '');
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + (s.sinif || 'qr-svg') + '" viewBox="0 0 ' + T + ' ' + T + '" shape-rendering="crispEdges" role="img" aria-label="' + et + '">'
      + '<rect width="' + T + '" height="' + T + '" fill="#FFFFFF"/><path d="' + yol + '" fill="#000000"/></svg>';
  }
  function png(metin, px) {
    const { boyut, m } = matris(metin), k = 4, T = boyut + k * 2, o = Math.max(2, Math.floor((px || 720) / T));
    const c = document.createElement('canvas'); c.width = c.height = T * o;
    const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000000';
    m.forEach((r, y) => r.forEach((b, x) => { if (b) g.fillRect((x + k) * o, (y + k) * o, o, o); }));
    return c.toDataURL('image/png');
  }
  CD.qr = { matris, svg, png };
})();
