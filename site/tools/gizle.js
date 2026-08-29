/* gizle.js — Kişisel dosyaları (fotoğraflar + mektup) sihirli kelimeyle şifreler.
   Kullanım (proje kökünde):  node site/tools/gizle.js <sihirli-kelime>
   Kaynak:  gizli-kaynak/bizim/*.jpg, gizli-kaynak/pittiksu/*.jpg, gizli-kaynak/not.txt   (depoya GİRMEZ)
   Çıktı:   site/gizli/*.enc + site/gizli/manifest.json                                   (depoya girer, şifreli)
   Şifre: PBKDF2-SHA256 (120k tur) → AES-256-GCM. Tarayıcı tarafı: site/js/kilit.js */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KOK = path.resolve(__dirname, '..', '..');
const KAYNAK = path.join(KOK, 'gizli-kaynak');
const HEDEF = path.join(KOK, 'site', 'gizli');
const ITER = 120000;

const sifre = (process.argv[2] || process.env.SIFRE || '').trim().toLowerCase();
if (!sifre) { console.error('Kullanım: node site/tools/gizle.js <sihirli-kelime>'); process.exit(1); }
if (!fs.existsSync(KAYNAK)) { console.error('gizli-kaynak/ klasörü yok: ' + KAYNAK); process.exit(1); }

const salt = crypto.randomBytes(16);
const key = crypto.pbkdf2Sync(Buffer.from(sifre, 'utf8'), salt, ITER, 32, 'sha256');

function sifrele(buf) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([iv, enc, c.getAuthTag()]); // iv(12) + ciphertext + tag(16)  → WebCrypto uyumlu
}
const ad = (mantiksal) => crypto.createHash('sha256').update(mantiksal).digest('hex').slice(0, 16) + '.enc';

fs.rmSync(HEDEF, { recursive: true, force: true });
fs.mkdirSync(HEDEF, { recursive: true });

const manifest = { surum: 1, salt: salt.toString('base64'), iter: ITER, kontrol: 'kontrol.enc', not: null, dosyalar: {} };
fs.writeFileSync(path.join(HEDEF, 'kontrol.enc'), sifrele(Buffer.from('cemre-dunyasi-ok', 'utf8')));

let toplam = 0;
for (const klasor of ['bizim', 'pittiksu']) {
  const d = path.join(KAYNAK, klasor);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).sort()) {
    if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
    const mantiksal = `assets/${klasor}/${f}`;
    const out = ad(mantiksal);
    fs.writeFileSync(path.join(HEDEF, out), sifrele(fs.readFileSync(path.join(d, f))));
    manifest.dosyalar[mantiksal] = { enc: out, tur: /\.png$/i.test(f) ? 'image/png' : (/\.webp$/i.test(f) ? 'image/webp' : 'image/jpeg') };
    toplam++;
  }
}
const notYolu = path.join(KAYNAK, 'not.txt');
if (fs.existsSync(notYolu)) {
  const out = ad('not');
  fs.writeFileSync(path.join(HEDEF, out), sifrele(fs.readFileSync(notYolu)));
  manifest.not = out;
}
fs.writeFileSync(path.join(HEDEF, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`Şifrelendi: ${toplam} görsel${manifest.not ? ' + mektup' : ''} → ${HEDEF}`);
