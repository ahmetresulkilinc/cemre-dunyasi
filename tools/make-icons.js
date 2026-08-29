// PWA ikonlarını üretir: Pıttıksu'nun pixel yüzü, battaniye pembesi yuvarlak zemin.
// Bağımlılık yok (node + zlib). Kullanım: node tools/make-icons.js  (site klasöründen ya da herhangi bir yerden)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const KOK = path.join(__dirname, '..', 'icons');

const YUZ = [
  '................',
  '..kk........kk..',
  '.kffk......kffk.',
  '.kfpfk....kfpfk.',
  '.kffffkkkkffffk.',
  'kffffffffffffffk',
  'kffffffffffffffk',
  'kfffkbwkffkbwkfk',
  'kfffkeekffkeekfk',
  'kffffkkffffkkffk',
  'kfpfffffnnfffpfk',
  'kffffffkkffffffk',
  '.kffffffffffffk.',
  '..kkffffffffkk..',
  '....kkkkkkkk....',
  '................'
];
const RENK = { k: [59, 42, 58], f: [132, 141, 154], p: [233, 180, 188], e: [92, 125, 153], b: [31, 42, 54], w: [255, 255, 255], n: [230, 163, 176] };
const ZEMIN = [245, 194, 189];      // --battaniye
const ZEMIN_ACIK = [252, 225, 221]; // --battaniye-acik (ilmek ışığı)

function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
// boyut, yüz oranı (0-1), zemin: 'daire' | 'kare'
function ciz(size, yuzOran, zemin) {
  const buf = Buffer.alloc(size * size * 4);
  const merkez = size / 2, r = size / 2;
  const yuzPx = Math.round(size * yuzOran); const hucre = yuzPx / 16; const x0 = (size - yuzPx) / 2, y0 = (size - yuzPx) / 2 + size * 0.02;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const dx = x + .5 - merkez, dy = y + .5 - merkez, d = Math.hypot(dx, dy);
    let px = null;
    if (zemin === 'kare' || d <= r) {
      // ilmek dokusu: 14 hücrelik örgü hissi (çok hafif)
      const doku = ((Math.floor(x / (size / 14)) + Math.floor(y / (size / 14))) % 2 === 0) ? 0 : 1;
      px = doku ? ZEMIN.slice() : [Math.round((ZEMIN[0] * 3 + ZEMIN_ACIK[0]) / 4), Math.round((ZEMIN[1] * 3 + ZEMIN_ACIK[1]) / 4), Math.round((ZEMIN[2] * 3 + ZEMIN_ACIK[2]) / 4)];
      if (zemin === 'daire' && d > r - 1.2) { const a = Math.max(0, Math.min(1, r - d)); px.push(Math.round(255 * a)); } else px.push(255);
    }
    const cx = Math.floor((x - x0) / hucre), cy = Math.floor((y - y0) / hucre);
    if (cx >= 0 && cx < 16 && cy >= 0 && cy < 16) { const ch = YUZ[cy][cx]; if (ch !== '.' && RENK[ch]) px = RENK[ch].concat([255]); }
    if (!px) px = [0, 0, 0, 0];
    buf[i] = px[0]; buf[i + 1] = px[1]; buf[i + 2] = px[2]; buf[i + 3] = px[3];
  }
  return png(size, size, buf);
}
fs.mkdirSync(KOK, { recursive: true });
fs.writeFileSync(path.join(KOK, 'icon-192.png'), ciz(192, .74, 'daire'));
fs.writeFileSync(path.join(KOK, 'icon-512.png'), ciz(512, .74, 'daire'));
fs.writeFileSync(path.join(KOK, 'icon-maskable-512.png'), ciz(512, .58, 'kare'));
fs.writeFileSync(path.join(KOK, 'apple-touch-icon.png'), ciz(180, .7, 'kare'));
// favicon.svg — aynı pixel yüz
let rects = '';
YUZ.forEach((row, y) => { for (let x = 0; x < 16; x++) { const ch = row[x]; if (ch === '.') continue; const c = RENK[ch]; rects += `<rect x="${x + 2}" y="${y + 2}" width="1" height="1" fill="rgb(${c.join(',')})"/>`; } });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" shape-rendering="crispEdges"><circle cx="10" cy="10" r="10" fill="rgb(${ZEMIN.join(',')})"/>${rects}</svg>`;
fs.writeFileSync(path.join(KOK, 'favicon.svg'), svg);
console.log('ikonlar yazıldı:', fs.readdirSync(KOK).join(', '));
