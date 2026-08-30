/* kilit.js — Sihirli kelime kapısı.
   1) gizli/manifest.json varsa: kayıtlı anahtar var mı? yoksa kelimeyi sor → PBKDF2 → AES-GCM → doğrula.
   2) Mektubu (CD_CONFIG.NOT) ve fotoğrafları tarayıcıda çözer; fotoğraflar blob adresi olur (window.GIZLI.url).
   3) Ancak bundan sonra uygulama betiklerini sırayla yükler. Manifest yoksa (yerel geliştirme) kapı çıkmaz.
   Şifreli dosyalar site/tools/gizle.js ile üretilir. Anahtar (kelime değil) bu cihazda hatırlanır. */
(() => {
  'use strict';
  const SCRIPTLER = ['js/cekirdek.js', 'js/senk.js', 'js/petler-miras.js', 'js/giris.js', 'js/bolum/pittiksu.js', 'js/bolum/barbie.js', 'js/bolum/tirnak.js', 'js/bolum/petevi.js', 'js/bolum/angela.js', 'js/bolum/panda.js', 'js/bolum/bahce.js', 'js/bolum/ofke.js', 'js/bolum/xox.js', 'js/bolum/bizim.js', 'js/hub.js'];
  const SAKLA = 'cd.kilit.anahtar';
  const ODA_SAKLA = 'cd.senk.oda';   // sihirli kelimeden türetilen bulut odası (kelime saklanmaz)
  const G = window.GIZLI = { hazir: false, _url: {}, url(p) { return this._url[p] || p; } };
  const subtle = (window.crypto && window.crypto.subtle) || null;
  const b64 = { e: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))), d: (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0)) };

  function yukle() {
    return SCRIPTLER.reduce((p, src) => p.then(() => new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = res; s.onerror = () => { console.error('[kilit] yüklenemedi:', src); res(); };
      document.body.appendChild(s);
    })), Promise.resolve());
  }

  async function manifestAl() {
    try { const r = await fetch('gizli/manifest.json', { cache: 'no-cache' }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; }
  }
  async function encAl(ad) { const r = await fetch('gizli/' + ad); if (!r.ok) throw new Error('enc yok: ' + ad); return new Uint8Array(await r.arrayBuffer()); }
  async function coz(key, veri) {
    const iv = veri.slice(0, 12), gov = veri.slice(12);
    return subtle.decrypt({ name: 'AES-GCM', iv }, key, gov);
  }
  async function kelimedenAnahtar(kelime, m) {
    const ham = await subtle.importKey('raw', new TextEncoder().encode(kelime), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey({ name: 'PBKDF2', salt: b64.d(m.salt), iterations: m.iter, hash: 'SHA-256' }, ham, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
  }
  async function odaTuret(kelime, m) {
    try {
      const ham = await subtle.importKey('raw', new TextEncoder().encode(kelime + '|oda'), 'PBKDF2', false, ['deriveBits']);
      const bit = await subtle.deriveBits({ name: 'PBKDF2', salt: b64.d(m.salt), iterations: m.iter, hash: 'SHA-256' }, ham, 256);
      const hex = [...new Uint8Array(bit)].map(x => x.toString(16).padStart(2, '0')).join('');
      try { localStorage.setItem(ODA_SAKLA, hex); } catch (e) {}
      return hex;
    } catch (e) { return null; }
  }
  function odaOku() { try { return localStorage.getItem(ODA_SAKLA) || null; } catch (e) { return null; } }

  async function dogrula(key, m) {
    try { const d = await coz(key, await encAl(m.kontrol)); return new TextDecoder().decode(d) === 'cemre-dunyasi-ok'; } catch (e) { return false; }
  }
  async function kayitliAnahtar(m) {
    try {
      const s = localStorage.getItem(SAKLA); if (!s) return null;
      const key = await subtle.importKey('raw', b64.d(s), { name: 'AES-GCM' }, true, ['decrypt']);
      return (await dogrula(key, m)) ? key : null;
    } catch (e) { return null; }
  }
  async function anahtariSakla(key) { try { localStorage.setItem(SAKLA, b64.e(await subtle.exportKey('raw', key))); } catch (e) {} }

  async function hepsiniCoz(key, m) {
    if (m.not) {
      try { const d = await coz(key, await encAl(m.not)); window.CD_CONFIG = window.CD_CONFIG || {}; window.CD_CONFIG.NOT = new TextDecoder().decode(d); } catch (e) { console.error('[kilit] mektup çözülemedi', e); }
    }
    const isler = Object.entries(m.dosyalar || {}).map(async ([yol, bilgi]) => {
      try { const d = await coz(key, await encAl(bilgi.enc)); G._url[yol] = URL.createObjectURL(new Blob([d], { type: bilgi.tur || 'image/jpeg' })); }
      catch (e) { console.error('[kilit] çözülemedi:', yol, e); }
    });
    await Promise.all(isler);
    G.hazir = true;
  }

  /* ---------------------------------------------------------------- kapı arayüzü */
  function kapiKur() {
    const st = document.createElement('style');
    st.textContent = `
#kilit{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(120% 90% at 50% 30%,#2a1f28 0%,#17111a 60%,#0e0a10 100%);color:#3b2a3a;font-family:'Nunito',system-ui,-apple-system,sans-serif}
#kilit[hidden]{display:none}
.kilit-kart{width:min(100%,360px);background:#fff8f3;border:2px solid #f3b8cb;border-radius:26px;padding:26px 22px 22px;box-shadow:0 6px 0 #e58fae,0 24px 60px -20px rgba(0,0,0,.6);text-align:center;animation:kilit-gel .6s cubic-bezier(.2,.8,.2,1)}
.kilit-kart.sallan{animation:kilit-salla .45s ease}
.kilit-ikon{font-size:44px;line-height:1;margin-bottom:8px}
.kilit-baslik{font-family:'Sour Gummy','Nunito',system-ui,sans-serif;font-size:26px;margin:0 0 6px;color:#3b2a3a}
.kilit-metin{margin:0 0 16px;color:#6f5468;font-size:15px;line-height:1.45}
.kilit-form{display:flex;flex-direction:column;gap:10px}
.kilit-giris{width:100%;box-sizing:border-box;font:inherit;font-size:18px;text-align:center;padding:12px 14px;border:2px solid #dcc6d0;border-radius:14px;background:#fff;color:#3b2a3a;outline:none}
.kilit-giris:focus{border-color:#e58fae;box-shadow:0 0 0 4px #ffdbe3}
.kilit-dugme{font:inherit;font-weight:800;font-size:17px;padding:12px 16px;border:0;border-radius:14px;background:#ff7a9a;color:#fff;box-shadow:0 4px 0 #e0688a;cursor:pointer}
.kilit-dugme:active{transform:translateY(3px);box-shadow:0 1px 0 #e0688a}
.kilit-hata{min-height:20px;margin:8px 0 0;color:#c9567f;font-size:14px;font-weight:700}
.kilit-bekle{color:#f3b8cb;font-size:15px;letter-spacing:.06em}
@keyframes kilit-gel{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}
@keyframes kilit-salla{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
@media (prefers-reduced-motion:reduce){.kilit-kart,.kilit-kart.sallan{animation:none}}`;
    document.head.appendChild(st);
    const k = document.createElement('div'); k.id = 'kilit';
    k.innerHTML = `<div class="kilit-kart"><div class="kilit-bekle">✦ ✦ ✦</div></div>`;
    document.body.appendChild(k);
    return k;
  }
  function kapiSor(k, m) {
    return new Promise(resolve => {
      k.innerHTML = `<form class="kilit-kart" autocomplete="off">
        <div class="kilit-ikon" aria-hidden="true">🔒🐾</div>
        <h1 class="kilit-baslik">Cemre'nin Dünyası</h1>
        <p class="kilit-metin">Buraya sadece bir kişi girebilir.<br>Sihirli kelimeyi yaz, kapı açılsın.</p>
        <div class="kilit-form">
          <input class="kilit-giris" type="password" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="sihirli kelime" aria-label="Sihirli kelime" required>
          <button class="kilit-dugme" type="submit">Kapıyı aç 🐾</button>
        </div>
        <p class="kilit-hata" aria-live="polite"></p>
      </form>`;
      const form = k.querySelector('form'), giris = k.querySelector('.kilit-giris'), hata = k.querySelector('.kilit-hata'), dugme = k.querySelector('.kilit-dugme');
      setTimeout(() => giris.focus(), 300);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const kelime = (giris.value || '').trim().toLowerCase();
        if (!kelime) return;
        dugme.disabled = true; hata.textContent = 'Bakıyorum… ✨';
        try {
          const key = await kelimedenAnahtar(kelime, m);
          if (await dogrula(key, m)) { hata.textContent = 'Açıldı 💗'; await anahtariSakla(key); await odaTuret(kelime, m); resolve(key); return; }
        } catch (err) { console.error('[kilit]', err); }
        dugme.disabled = false; hata.textContent = 'Hmm, o değil 🙈 Ahmet’e sor.';
        form.classList.remove('sallan'); void form.offsetWidth; form.classList.add('sallan');
        giris.select();
      });
    });
  }

  /* ---------------------------------------------------------------- akış */
  async function basla() {
    const m = await manifestAl();
    if (!m) { await yukle(); return; }                                 // yerel geliştirme: düz dosyalar
    if (!subtle) {                                                     // çok eski tarayıcı
      const k = kapiKur(); k.innerHTML = '<div class="kilit-kart"><p class="kilit-metin">Bu tarayıcı kapıyı açamıyor; Safari ya da Chrome ile dene 🙏</p></div>'; return;
    }
    const k = kapiKur();
    let key = await kayitliAnahtar(m);
    if (!key) key = await kapiSor(k, m);
    await hepsiniCoz(key, m);
    k.remove();
    await yukle();
    const odaA = odaOku();
    if (odaA && window.CD && CD.senk) { CD.hazir(() => CD.senk.baslat(odaA)); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
