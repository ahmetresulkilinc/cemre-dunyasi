/* cekirdek.js — Cemre'nin Dünyası çekirdeği.
   window.CD = { kaydet, ac, git, bolumler, depo, ses, efekt, config, azHareket, hava, havaDegistir,
                 toast, sheet, sheetKapat, onayla, el, svg, kacir, olay, hazir, ... }
   Sözleşme: site/MODUL-SOZLESMESI.md  ·  Build yok, modül yok, klasik <script>. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const $ = (s, k) => (k || document).querySelector(s);
  CD.config = window.CD_CONFIG || {};
  CD.surum = '1.2.0';

  /* ============================================================== olay (mini emitter) */
  const dinleyiciler = {};
  CD.olay = {
    dinle(ad, fn) { (dinleyiciler[ad] = dinleyiciler[ad] || []).push(fn); return () => { dinleyiciler[ad] = (dinleyiciler[ad] || []).filter(f => f !== fn); }; },
    yay(ad, veri) { (dinleyiciler[ad] || []).slice().forEach(fn => { try { fn(veri); } catch (e) { console.warn('[CD.olay]', ad, e); } }); }
  };

  /* ============================================================== depo (localStorage cd.* + IndexedDB) */
  const ON_EK = 'cd.';
  function depoYap(onek) {
    const p = ON_EK + (onek ? onek + '.' : '');
    return {
      al(k, d) { try { const v = localStorage.getItem(p + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      yaz(k, v) { try { localStorage.setItem(p + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
      sil(k) { try { localStorage.removeItem(p + k); } catch (e) {} },
      anahtarlar() { const a = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(p)) a.push(k.slice(p.length)); } } catch (e) {} return a; },
      temizle() { this.anahtarlar().forEach(k => this.sil(k)); }
    };
  }
  CD.depo = depoYap('');
  CD.depo.alan = (onek) => depoYap(onek);

  // IndexedDB — fotoğraflar ve büyük şeyler (Blob). Mağazalar: fotolar, tirnak, buket, genel
  const DB_AD = 'cd-album', DB_SUR = 2, MAGAZALAR = ['fotolar', 'tirnak', 'buket', 'genel'];
  let dbSoz = null;
  function db() {
    if (dbSoz) return dbSoz;
    dbSoz = new Promise((cozul, red) => {
      if (!('indexedDB' in window)) { red(new Error('IndexedDB yok')); return; }
      let ist;
      try { ist = indexedDB.open(DB_AD, DB_SUR); } catch (e) { red(e); return; }
      ist.onupgradeneeded = () => { const d = ist.result; MAGAZALAR.forEach(m => { if (!d.objectStoreNames.contains(m)) d.createObjectStore(m, { keyPath: 'id' }); }); };
      ist.onsuccess = () => cozul(ist.result);
      ist.onerror = () => red(ist.error);
      ist.onblocked = () => red(new Error('IndexedDB kilitli'));
    });
    dbSoz.catch(() => { dbSoz = null; });
    return dbSoz;
  }
  function islem(magaza, mod, fn) {
    return db().then(d => new Promise((cozul, red) => {
      const t = d.transaction(magaza, mod); const s = t.objectStore(magaza);
      const r = fn(s); let sonuc;
      if (r && 'onsuccess' in r) r.onsuccess = () => { sonuc = r.result; };
      t.oncomplete = () => cozul(sonuc); t.onerror = () => red(t.error); t.onabort = () => red(t.error);
    }));
  }
  CD.depo.idb = {
    koy: (m, obj) => islem(m, 'readwrite', s => s.put(obj)),
    al: (m, id) => islem(m, 'readonly', s => s.get(id)),
    hepsi: (m) => islem(m, 'readonly', s => s.getAll()),
    sil: (m, id) => islem(m, 'readwrite', s => s.delete(id)),
    say: (m) => islem(m, 'readonly', s => s.count())
  };
  CD.idb = CD.depo.idb;

  // yedek: tüm cd.* anahtarları tek JSON
  CD.depo.disaAktar = () => { const o = {}; CD.depo.anahtarlar().forEach(k => { o[k] = CD.depo.al(k); }); return JSON.stringify({ surum: CD.surum, tarih: new Date().toISOString(), veri: o }); };
  CD.depo.iceAktar = (json) => { try { const o = typeof json === 'string' ? JSON.parse(json) : json; const v = o && o.veri ? o.veri : o; Object.keys(v).forEach(k => CD.depo.yaz(k, v[k])); return true; } catch (e) { return false; } };

  // sıfırla: oyun ilerlemesi, başarımlar, kayıtlar, eklenen fotoğraflar silinir; KORU listesi (tam anahtar) kalır
  const SIFIRLA_KORU = ['cd.pittiksu.dogumTarihi', 'cd.pittiksu.dogumVarsayilan', 'cd.kilit.anahtar', 'cd.ses', 'cd.hava'];
  CD.depo.sifirla = async function (koru) {
    const kal = new Set([].concat(SIFIRLA_KORU, koru || []));
    const sakla = {}; kal.forEach(k => { try { const v = localStorage.getItem(k); if (v != null) sakla[k] = v; } catch (e) {} });
    try { localStorage.clear(); } catch (e) {}
    Object.keys(sakla).forEach(k => { try { localStorage.setItem(k, sakla[k]); } catch (e) {} });
    try { sessionStorage.clear(); } catch (e) {}
    for (const m of MAGAZALAR) { try { await islem(m, 'readwrite', s => s.clear()); } catch (e) {} }
    return true;
  };

  /* ---- kalıcı depolama isteği (Android/Chrome'da veriyi silinmeye karşı korur) ---- */
  CD.depo.kalici = async function () {
    try {
      if (!navigator.storage || !navigator.storage.persist) return null;
      if (navigator.storage.persisted && await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    } catch (e) { return null; }
  };

  /* ---- tam yedek: localStorage (cd.*) + IndexedDB kayıtları (fotoğraflar dahil) ---- */
  const blobDataUrl = (b) => new Promise((c, r) => { const f = new FileReader(); f.onload = () => c(f.result); f.onerror = () => r(f.error); f.readAsDataURL(b); });
  async function disaCevir(v, derinlik) {
    if (v == null || derinlik > 4) return v;
    if (v instanceof Blob) return { __blob: await blobDataUrl(v), __tur: v.type || '' };
    if (Array.isArray(v)) { const a = []; for (const x of v) a.push(await disaCevir(x, derinlik + 1)); return a; }
    if (typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) { const o = {}; for (const k of Object.keys(v)) o[k] = await disaCevir(v[k], derinlik + 1); return o; }
    return v;
  }
  function iceCevir(v, derinlik) {
    if (v == null || derinlik > 4) return v;
    if (typeof v === 'object' && typeof v.__blob === 'string') {
      const [bas, b64] = v.__blob.split(','); const tur = v.__tur || (bas.match(/:(.*?);/) || [])[1] || 'application/octet-stream';
      const ham = atob(b64); const u = new Uint8Array(ham.length); for (let i = 0; i < ham.length; i++) u[i] = ham.charCodeAt(i);
      return new Blob([u], { type: tur });
    }
    if (Array.isArray(v)) return v.map(x => iceCevir(x, derinlik + 1));
    if (typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) { const o = {}; Object.keys(v).forEach(k => { o[k] = iceCevir(v[k], derinlik + 1); }); return o; }
    return v;
  }
  CD.depo.yedekAl = async function () {
    const ayar = {}; CD.depo.anahtarlar().forEach(k => { if (k !== 'kilit.anahtar') ayar[k] = CD.depo.al(k); });
    const magaza = {};
    for (const m of MAGAZALAR) {
      try { const kayitlar = await islem(m, 'readonly', s => s.getAll()); magaza[m] = await disaCevir(kayitlar || [], 0); }
      catch (e) { magaza[m] = []; }
    }
    return JSON.stringify({ site: 'cemre-dunyasi', surum: CD.surum || 1, tarih: new Date().toISOString(), ayar, magaza });
  };
  CD.depo.yedekYukle = async function (json) {
    const o = typeof json === 'string' ? JSON.parse(json) : json;
    if (!o || (o.site && o.site !== 'cemre-dunyasi')) throw new Error('Bu dosya bu siteye ait değil');
    const ayar = o.ayar || o.veri || {};
    Object.keys(ayar).forEach(k => { if (k !== 'kilit.anahtar') CD.depo.yaz(k, ayar[k]); });
    let kayit = 0;
    for (const m of Object.keys(o.magaza || {})) {
      if (MAGAZALAR.indexOf(m) < 0) continue;
      for (const r of o.magaza[m] || []) { try { await islem(m, 'readwrite', s => s.put(iceCevir(r, 0))); kayit++; } catch (e) {} }
    }
    return { anahtar: Object.keys(ayar).length, kayit };
  };

  /* ---- yedek arayüzü: dosya olarak paylaş/indir, dosyadan geri yükle ---- */
  CD.yedekIndir = async function () {
    CD.toast('Yedeğin hazırlanıyor… 💾');
    let json; try { json = await CD.depo.yedekAl(); } catch (e) { CD.toast('Yedek alınamadı 🙈'); return; }
    const ad = 'cemre-dunyasi-yedek-' + new Date().toISOString().slice(0, 10) + '.json';
    const blob = new Blob([json], { type: 'application/json' });
    try {
      const dosya = new File([blob], ad, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [dosya] })) { await navigator.share({ files: [dosya], title: 'Cemre\'nin Dünyası yedeği' }); CD.toast('Yedeğin kaydedildi 💗'); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try {
      const u = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = u; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 8000); CD.toast('Yedeğin indirildi 💾');
    } catch (e) { CD.toast('Yedek alınamadı 🙈'); }
  };
  CD.yedekYukleAc = function () {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json'; inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      CD.toast('Yükleniyor… 📂');
      try { await CD.depo.yedekYukle(await f.text()); CD.toast('Geri geldi 💗'); setTimeout(() => { location.hash = ''; location.reload(); }, 900); }
      catch (e) { CD.toast('Bu dosya olmadı 🙈'); }
    });
    inp.click();
  };
  CD.yedekYardim = function () {
    CD.sheet(CD.el('div.dikey', [
      CD.el('p', 'Telefonun, Safari ile ana ekrandaki uygulamanın hafızasını ayrı tutuyor. Yani Safari\'de ektiğin çiçekler uygulamada görünmez.'),
      CD.el('p', 'Taşımak için: Safari\'de aç → ⋯ → "Yedeğini al" (dosyayı kaydet) → uygulamayı aç → ⋯ → "Yedeği yükle".'),
      CD.el('p', 'Bundan sonra hep ana ekrandaki simgeden gir; her şey orada birikir. 🐾'),
      CD.el('button.dugme.tam', { type: 'button', onclick: () => CD.sheetKapat() }, 'Anladım')
    ]), { baslik: 'Kayıtlar nerede duruyor?' });
  };

  /* ============================================================== yardımcılar */
  CD.kimlik = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  CD.rastgele = (a) => a[Math.floor(Math.random() * a.length)];
  CD.sinirla = (v, a, b) => Math.max(a, Math.min(b, v));
  CD.bugun = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  CD.tarihYaz = (iso) => { if (!iso) return ''; const [y, a, g] = String(iso).split('-').map(Number); const ay = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']; return g + ' ' + (ay[a - 1] || '') + (y !== new Date().getFullYear() ? ' ' + y : ''); };
  CD.saatYaz = (d) => { d = d || new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  CD.gunFarki = (iso) => { if (!iso) return null; const [y, a, g] = String(iso).split('-').map(Number); const d = new Date(y, a - 1, g); return Math.floor((Date.now() - d.getTime()) / 86400000); };
  CD.kacir = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  CD.azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
  CD.azalt = CD.azHareket;
  try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { CD.azHareket = CD.azalt = e.matches; CD.olay.yay('azHareket', e.matches); }); } catch (e) {}
  CD.dokunmatik = matchMedia('(hover: none)').matches;

  // element kurucu: CD.el('div.sinif#id', {ozellikler}, [cocuklar | metin])
  CD.el = function (tanim, ozellik, cocuklar) {
    if (Array.isArray(ozellik) || typeof ozellik === 'string' || typeof ozellik === 'number' || ozellik instanceof Node) { cocuklar = ozellik; ozellik = null; }
    const m = String(tanim || 'div').match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
    const e = document.createElement((m && m[1]) || 'div');
    if (m && m[2]) m[2].match(/[.#][\w-]+/g).forEach(t => t[0] === '.' ? e.classList.add(t.slice(1)) : (e.id = t.slice(1)));
    if (ozellik) for (const k in ozellik) {
      const v = ozellik[k]; if (v == null || v === false) continue;
      if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'stil') Object.assign(e.style, v);
      else if (k === 'data') for (const d in v) e.dataset[d] = v[d];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    const ekle = c => { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(ekle); else if (c instanceof Node) e.appendChild(c); else e.appendChild(document.createTextNode(String(c))); };
    ekle(cocuklar);
    return e;
  };
  CD.svg = function (html, sinif) { const w = document.createElement('div'); w.innerHTML = String(html).trim(); const s = w.firstElementChild; if (s && sinif) s.classList.add(sinif); return s; };
  CD.bekle = (ms) => new Promise(c => setTimeout(c, ms));

  // fotoğrafı küçült (uzun kenar 1280, jpeg .82) → Blob
  CD.fotoKucult = async function (file, maks, kalite) {
    maks = maks || 1280;
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) { bmp = await new Promise((c, r) => { const i = new Image(); i.onload = () => c(i); i.onerror = r; i.src = URL.createObjectURL(file); }); }
    const w = bmp.width, h = bmp.height, k = Math.min(1, maks / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    return new Promise(cozul => c.toBlob(b => cozul(b), 'image/jpeg', kalite || 0.82));
  };
  CD.depo.fotoKucult = CD.fotoKucult;

  // PNG paylaş / indir (iOS: Web Share dosya; yoksa yeni sekme)
  CD.pngPaylas = async function (canvas, ad) {
    const blob = await new Promise(c => canvas.toBlob(c, 'image/png'));
    if (!blob) return false;
    try {
      const f = new File([blob], ad || 'cemre.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f] }); return true; }
    } catch (e) { if (e && e.name === 'AbortError') return true; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = ad || 'cemre.png'; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    CD.toast('Görsel açıldı; basılı tutup kaydedebilirsin 📷');
    return true;
  };

  /* ============================================================== ses — Web Audio sentez, dosya yok */
  (() => {
    let ctx = null, master = null, acik = CD.depo.al('ses', true);
    let mirrDugumu = null, nefesDugumu = null;
    function baglam() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
        master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
      return ctx;
    }
    // iOS kilidi: ilk kullanıcı dokunuşunda bağlamı aç (ses çalınmaz, sadece açılır)
    const kilitAc = () => { if (acik) baglam(); };
    ['pointerdown', 'touchend', 'keydown'].forEach(t => document.addEventListener(t, kilitAc, { once: true, passive: true }));
    function hazir() { if (!acik) return null; const c = baglam(); if (!c || c.state !== 'running') return null; return c; }
    function osc(tip, f0, f1, sure, kazanc, filtre, gecik) {
      const c = hazir(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = tip; const t = c.currentTime + (gecik || 0);
      o.frequency.setValueAtTime(f0, t);
      if (f1 != null && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + sure);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(kazanc, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
      let son = o;
      if (filtre) { const f = c.createBiquadFilter(); f.type = filtre.tip; f.frequency.value = filtre.f; f.Q.value = filtre.q || 1; o.connect(f); son = f; }
      son.connect(g); g.connect(master);
      o.start(t); o.stop(t + sure + 0.02);
    }
    function gurultu(sure, renk) {
      const c = hazir(); if (!c) return null;
      const n = Math.floor(c.sampleRate * sure), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      let son = 0;
      for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (renk === 'kahve') { son = (son + 0.02 * w) / 1.02; d[i] = son * 3.5; } else d[i] = w; }
      const s = c.createBufferSource(); s.buffer = b; return s;
    }
    function gurultuCal(sure, kazanc, filtre, zarf) {
      const c = hazir(); if (!c) return;
      const s = gurultu(sure, filtre && filtre.renk); if (!s) return;
      const g = c.createGain(); const t = c.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(kazanc, t + (zarf ? zarf.giris : 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
      let son = s;
      if (filtre && filtre.tip) { const f = c.createBiquadFilter(); f.type = filtre.tip; f.Q.value = filtre.q || 1; f.frequency.setValueAtTime(filtre.f, t); if (filtre.f2) f.frequency.exponentialRampToValueAtTime(filtre.f2, t + sure); s.connect(f); son = f; }
      son.connect(g); g.connect(master);
      s.start(t); s.stop(t + sure + 0.02);
    }
    CD.ses = {
      get acik() { return acik; },
      ac(v) { acik = !!v; CD.depo.yaz('ses', acik); if (!acik) { this.mirrDur(); this.nefesDur(); } else baglam(); CD.olay.yay('ses', acik); },
      uyandir() { baglam(); },
      // --- kısa dokunuş sesleri
      pit() { osc('sine', 520, 260, 0.07, 0.12); },
      tik() { osc('sine', 900, 700, 0.04, 0.06); },
      pop() { osc('triangle', 300, 900, 0.09, 0.1); },
      tink() { osc('sine', 2800, 2400, 0.12, 0.05); },
      hop() { osc('sine', 300, 600, 0.09, 0.07); },
      blop() { osc('sine', 320, 140, 0.07, 0.08); },
      uf() { osc('triangle', 200, 120, 0.12, 0.06); },
      hmpf() { osc('square', 180, 150, 0.12, 0.05, { tip: 'lowpass', f: 600 }); },
      // --- ödül / parıltı
      parilti() { [1046.5, 1318.5, 1568].forEach((f, i) => osc('sine', f, f, 0.16, 0.09, null, i * 0.04)); },
      isilti() { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => osc('sine', f, f, 0.5, 0.05, null, i * 0.06)); },
      can() { const t = [0, 0.02, 0.05]; [1046.5, 1568, 2637].forEach((f, i) => osc('sine', f, f * 0.995, 1.4 - i * 0.3, 0.05 - i * 0.012, null, t[i])); },
      zafer() { [523, 659, 784, 1046].forEach((f, i) => osc('triangle', f, f, 0.22, 0.1, null, i * 0.07)); },
      // --- kedi
      miyav() { osc('sawtooth', 620, 420, 0.24, 0.07, { tip: 'bandpass', f: 900, q: 1.5 }); osc('sawtooth', 760, 520, 0.16, 0.05, { tip: 'bandpass', f: 1000, q: 1.5 }, 0.04); },
      minikMiyav() { osc('triangle', 800, 560, 0.18, 0.06, { tip: 'bandpass', f: 1100, q: 1.2 }); },
      // --- malzeme
      slip() { gurultuCal(0.09, 0.05, { tip: 'bandpass', f: 1800, q: 0.8 }); },
      torpu() { for (let i = 0; i < 3; i++) setTimeout(() => gurultuCal(0.08, 0.04, { tip: 'highpass', f: 2500 }), i * 90); },
      catir() { gurultuCal(0.12, 0.14, { tip: 'lowpass', f: 6000, f2: 400 }); osc('square', 1400, 900, 0.02, 0.06, null, 0.02); osc('square', 1100, 700, 0.02, 0.05, null, 0.07); },
      kirilma() { gurultuCal(0.18, 0.16, { tip: 'lowpass', f: 8000, f2: 300 }); for (let i = 0; i < 4; i++) osc('sine', 1800 + Math.random() * 2200, 900, 0.05, 0.04, null, 0.015 + i * 0.03); },
      gum() { osc('sine', 120, 40, 0.18, 0.18); gurultuCal(0.08, 0.08, { tip: 'lowpass', f: 500 }); },
      su() { gurultuCal(0.4, 0.06, { tip: 'bandpass', f: 600, f2: 2400, q: 2 }, { giris: 0.08 }); },
      kopuk() { for (let i = 0; i < 3; i++) osc('sine', 900 + Math.random() * 900, 600, 0.05, 0.03, null, i * 0.06); },
      cigne() { for (let i = 0; i < 3; i++) osc('square', 140, 90, 0.08, 0.05, { tip: 'lowpass', f: 400 }, i * 0.11); },
      yut() { osc('sine', 260, 120, 0.16, 0.06); },
      vizilti() { osc('sawtooth', 220, 240, 0.35, 0.03, { tip: 'lowpass', f: 900 }); },
      // --- mırr: kahverengi gürültü + lowpass 180 + 24 Hz tremolo; okşadıkça sürer
      mirrBaslat(derinlik) {
        const c = hazir(); if (!c) return;
        if (mirrDugumu) { if (derinlik != null) mirrDugumu.lfoG.gain.value = 0.5 * derinlik; return; }
        const s = gurultu(2, 'kahve'); if (!s) return; s.loop = true;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180; f.Q.value = 1.2;
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.2, c.currentTime + 0.25);
        const trem = c.createGain(); trem.gain.value = 0.5;
        const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 24;
        const lfoG = c.createGain(); lfoG.gain.value = 0.5 * (derinlik == null ? 1 : derinlik);
        lfo.connect(lfoG); lfoG.connect(trem.gain);
        const nefes = c.createOscillator(); nefes.frequency.value = 0.9; const nefesG = c.createGain(); nefesG.gain.value = 0.15;
        nefes.connect(nefesG); nefesG.connect(trem.gain);
        s.connect(f); f.connect(trem); trem.connect(g); g.connect(master);
        s.start(); lfo.start(); nefes.start();
        mirrDugumu = { s, lfo, nefes, g, lfoG };
      },
      mirrDur() {
        if (!mirrDugumu || !ctx) return;
        const m = mirrDugumu; mirrDugumu = null;
        try { m.g.gain.cancelScheduledValues(ctx.currentTime); m.g.gain.setValueAtTime(Math.max(0.0001, m.g.gain.value), ctx.currentTime); m.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4); } catch (e) {}
        setTimeout(() => { try { m.s.stop(); m.lfo.stop(); m.nefes.stop(); } catch (e) {} }, 450);
      },
      mirrKisa(ms) { this.mirrBaslat(); clearTimeout(this._mt); this._mt = setTimeout(() => this.mirrDur(), ms || 900); },
      mirr(ms) { this.mirrKisa(ms); },
      // --- nefes: çok yumuşak sinüs, 4 s al / 4 s ver (sakinleşme)
      nefesBaslat(alSure, verSure) {
        const c = hazir(); if (!c) return; this.nefesDur();
        alSure = alSure || 4; verSure = verSure || 4;
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 196;
        const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 294;
        const g = c.createGain(); g.gain.value = 0.0001;
        o.connect(g); o2.connect(g); g.connect(master); o.start(); o2.start();
        nefesDugumu = { o, o2, g };
        const dongu = () => {
          if (!nefesDugumu) return;
          const t = c.currentTime;
          g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
          g.gain.exponentialRampToValueAtTime(0.06, t + alSure);
          g.gain.exponentialRampToValueAtTime(0.0001, t + alSure + verSure);
          nefesDugumu.t = setTimeout(dongu, (alSure + verSure) * 1000);
        };
        dongu();
      },
      nefesDur() { if (!nefesDugumu) return; const n = nefesDugumu; nefesDugumu = null; clearTimeout(n.t); try { n.g.gain.cancelScheduledValues(ctx.currentTime); n.g.gain.setValueAtTime(Math.max(0.0001, n.g.gain.value), ctx.currentTime); n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5); } catch (e) {} setTimeout(() => { try { n.o.stop(); n.o2.stop(); } catch (e) {} }, 600); },
      hepsiniDurdur() { this.mirrDur(); this.nefesDur(); },
      // --- ses kaydını tiz çal (Angela) — playbackRate; Safari'de detune yok
      async tizCal(blob, oran) {
        const c = hazir(); if (!c) return false;
        const ab = await blob.arrayBuffer();
        const buf = await new Promise((cozul, red) => { c.decodeAudioData(ab, cozul, red); });
        const s = c.createBufferSource(); s.buffer = buf; s.playbackRate.value = oran || 1.6;
        const g = c.createGain(); g.gain.value = 0.9; s.connect(g); g.connect(master); s.start();
        return new Promise(cozul => { s.onended = () => cozul(true); });
      },
      // ham erişim (ileri kullanım: bölüm kendi sentezini yapmak isterse)
      baglam() { return hazir(); },
      get master() { return master; }
    };
  })();

  /* ============================================================== efekt — parçacıklar (sayfa geneli, client koordinatı) */
  (() => {
    let parcaSayisi = 0, patiSayisi = 0;
    const maks = () => { const v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--parcacik-maks')); return isNaN(v) ? 18 : v; };
    function parcacik(sinif, x, y, degiskenler, sure, icerik) {
      if (CD.azHareket || parcaSayisi >= maks()) return;
      parcaSayisi++;
      const p = CD.el('i.parcacik.' + sinif, { 'aria-hidden': 'true' }, icerik || null);
      p.style.setProperty('--x', x + 'px'); p.style.setProperty('--y', y + 'px');
      for (const k in degiskenler) p.style.setProperty(k, degiskenler[k]);
      document.body.appendChild(p);
      setTimeout(() => { p.remove(); parcaSayisi--; }, sure);
    }
    const PATI_SVG = '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="6" ry="5"/><circle cx="5" cy="10" r="2.5"/><circle cx="9.5" cy="6" r="2.5"/><circle cx="14.5" cy="6" r="2.5"/><circle cx="19" cy="10" r="2.5"/></svg>';
    const KONFETI_RENK = ['--seker-kiraz', '--seker-limon', '--seker-nane', '--seker-gok', '--seker-lavanta', '--burun', '--seker-seftali'];
    CD.efekt = {
      kalp(x, y, n) { for (let i = 0; i < (n || 4); i++) setTimeout(() => parcacik('kalp', x + (Math.random() * 40 - 20), y + (Math.random() * 10 - 5), { '--dx': (Math.random() * 50 - 25) + 'px' }, 900), i * 50); },
      yildiz(x, y, n) { for (let i = 0; i < (n || 5); i++) parcacik('yildiz', x, y + (Math.random() * 20 - 10), { '--dx': (Math.random() * 60 - 30) + 'px', '--dy': (-10 - Math.random() * 40) + 'px' }, 700); },
      toz(x, y, n) { for (let i = 0; i < (n || 4); i++) parcacik('toz', x + (Math.random() * 30 - 15), y, { '--dx': ((i % 2 ? 1 : -1) * (8 + Math.random() * 18)) + 'px' }, 500); },
      emoji(x, y, e, n) { for (let i = 0; i < (n || 3); i++) setTimeout(() => parcacik('emoji', x + (Math.random() * 40 - 20), y, { '--dx': (Math.random() * 60 - 30) + 'px' }, 900, e), i * 60); },
      kopuk(x, y, n) { for (let i = 0; i < (n || 5); i++) setTimeout(() => parcacik('kopuk', x + (Math.random() * 60 - 30), y, { '--dx': (Math.random() * 40 - 20) + 'px', '--boy': (8 + Math.random() * 14) + 'px' }, 1400), i * 70); },
      konfeti(x, y, n) {
        x = x == null ? innerWidth / 2 : x; y = y == null ? innerHeight * 0.3 : y;
        for (let i = 0; i < (n || 14); i++) setTimeout(() => parcacik('konfeti', x, y, { '--dx': (Math.random() * 240 - 120) + 'px', '--dy': (60 + Math.random() * 160) + 'px', '--don': (Math.random() * 720 - 360) + 'deg', '--renk': 'var(' + CD.rastgele(KONFETI_RENK) + ')' }, 1300), i * 25);
      },
      pati(x, y) {
        if (CD.azHareket || patiSayisi >= 6) return; patiSayisi++;
        const p = CD.el('i.parcacik.pati', { 'aria-hidden': 'true', html: PATI_SVG });
        p.style.setProperty('--x', (x - 9) + 'px'); p.style.setProperty('--y', (y - 9) + 'px');
        document.body.appendChild(p); setTimeout(() => { p.remove(); patiSayisi--; }, 700);
      },
      sarsinti(el, guc) {
        if (CD.azHareket) return;
        el = el || $('#bolum') || document.body;
        el.classList.remove('sarsil', 'sarsil-guclu'); void el.offsetWidth; el.classList.add(guc > 1 ? 'sarsil-guclu' : 'sarsil');
        setTimeout(() => el.classList.remove('sarsil', 'sarsil-guclu'), 260);
        try { if (navigator.vibrate) navigator.vibrate(guc > 1 ? 18 : 8); } catch (e) {}
      },
      // element merkezinden parçacık (kısayol)
      merkez(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    };
    // eski adlar (uyumluluk)
    CD.kalpler = CD.efekt.kalp; CD.yildizlar = CD.efekt.yildiz; CD.toz = CD.efekt.toz; CD.patiIzi = CD.efekt.pati; CD.emojiParca = CD.efekt.emoji; CD.kopukler = CD.efekt.kopuk;
    // canlı alanlarda pati izi: [data-pati] içine her dokunuş
    document.addEventListener('pointerdown', e => { if (e.target && e.target.closest && e.target.closest('[data-pati]')) CD.efekt.pati(e.clientX, e.clientY); }, { passive: true });
  })();

  /* ============================================================== toast & sheet & onay */
  let toastT;
  CD.toast = function (msg, ms) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('goster');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('goster'), ms || 2400);
  };
  let sheetKapatCb = null;
  CD.sheet = function (icerik, secenek) {
    secenek = secenek || {};
    const kap = $('#sheetKaplama'), ic = $('#sheetIcerik'), sh = $('#sheet'); if (!kap) return;
    ic.innerHTML = '';
    if (secenek.baslik) ic.appendChild(CD.el('div.sheet-baslik', secenek.baslik));
    if (typeof icerik === 'string') ic.insertAdjacentHTML('beforeend', icerik); else if (icerik) ic.appendChild(icerik);
    kap.hidden = false; document.body.classList.add('sheet-acik');
    requestAnimationFrame(() => kap.classList.add('acik'));
    sheetKapatCb = secenek.kapaninca || null;
    sh.scrollTop = 0;
    if (secenek.sessiz !== true) CD.ses.pop();
    const ilk = ic.querySelector('button, input, [tabindex]'); if (ilk && secenek.odak !== false) setTimeout(() => ilk.focus({ preventScroll: true }), 80);
    return ic;
  };
  CD.sheetKapat = function () {
    const kap = $('#sheetKaplama'); if (!kap || kap.hidden) return;
    kap.classList.remove('acik'); document.body.classList.remove('sheet-acik');
    setTimeout(() => { kap.hidden = true; $('#sheetIcerik').innerHTML = ''; }, 320);
    if (sheetKapatCb) { const cb = sheetKapatCb; sheetKapatCb = null; cb(); }
  };
  CD.onayla = function (metin, evetMetin, hayirMetin) {
    return new Promise(cozul => {
      let karar = false;
      const kutu = CD.el('div.dikey', [
        CD.el('p', metin),
        CD.el('div.satir', [
          CD.el('button.dugme-ikincil', { type: 'button', onclick: () => { CD.sheetKapat(); } }, hayirMetin || 'Vazgeç'),
          CD.el('button.dugme', { type: 'button', onclick: () => { karar = true; CD.sheetKapat(); } }, evetMetin || 'Evet')
        ])
      ]);
      CD.sheet(kutu, { kapaninca: () => cozul(karar) });
    });
  };

  /* ============================================================== gündüz / gece */
  function otomatikHava() { const s = new Date().getHours(); return (s >= 20 || s < 7) ? 'gece' : 'gunduz'; }
  function havaUygula() {
    const secim = CD.depo.al('hava', null);
    const h = secim || otomatikHava();
    document.documentElement.setAttribute('data-hava', h);
    CD.hava = h;
    const tema = getComputedStyle(document.documentElement).getPropertyValue('--tema-rengi').trim();
    const m = $('meta[name="theme-color"]'); if (m && tema) m.setAttribute('content', tema);
    CD.olay.yay('hava', h);
  }
  CD.havaAyarla = function (h) { if (h) CD.depo.yaz('hava', h); else CD.depo.sil('hava'); havaUygula(); };
  CD.havaDegistir = function () { const h = (document.documentElement.getAttribute('data-hava') === 'gece') ? 'gunduz' : 'gece'; CD.depo.yaz('hava', h); havaUygula(); CD.ses.pop(); };
  CD.gece = () => CD.hava === 'gece';
  setInterval(() => { if (!CD.depo.al('hava', null)) havaUygula(); }, 60000);

  /* ============================================================== bölüm kaydı & yönlendirme */
  CD.bolumler = CD.bolumler || {};
  CD.BOLUM_SIRASI = ['pittiksu', 'barbie', 'tirnak', 'petevi', 'angela', 'bahce', 'panda', 'ofke', 'bizim'];
  CD.kaydet = function (tanim) {
    if (!tanim || !tanim.id) { console.warn('[CD.kaydet] id eksik', tanim); return; }
    if (typeof tanim.mount !== 'function') { console.warn('[CD.kaydet] mount eksik:', tanim.id); return; }
    CD.bolumler[tanim.id] = tanim;
    CD.olay.yay('kaydet', tanim);
    return tanim;
  };
  CD.bolum = (id, tanim) => CD.kaydet(Object.assign({ id }, tanim)); // eski ad
  let aktif = null;
  function yol() { const h = location.hash.replace(/^#\/?/, ''); return h.split('/')[0] || ''; }
  CD.aktifBolum = () => aktif ? aktif.id : '';
  CD.ac = function (id) { const hedef = id && id !== 'hub' ? '#/' + id : '#/'; if (location.hash === hedef) { git(); } else location.hash = hedef; };
  CD.eveDon = () => CD.ac('');

  function baglamOlustur(id, kok) {
    const ctx = {
      id, kok, config: CD.config, depo: CD.depo.alan(id), idb: CD.depo.idb, ses: CD.ses, efekt: CD.efekt,
      toast: CD.toast, sheet: CD.sheet, sheetKapat: CD.sheetKapat, onayla: CD.onayla, el: CD.el, svg: CD.svg, kacir: CD.kacir,
      get hava() { return CD.hava; }, get azHareket() { return CD.azHareket; }, olay: CD.olay,
      geri: () => CD.ac(''), ac: CD.ac,
      baslik(metin) { const b = $('#bolumBaslik'); if (b) b.textContent = metin; },
      altbar(eylemler) {
        const eski = $('#bolum > .altbar'); if (eski) eski.remove();
        if (!eylemler || !eylemler.length) return null;
        const nav = CD.el('nav.altbar', { 'aria-label': 'Bölüm eylemleri' });
        eylemler.forEach(ey => {
          const b = CD.el('button.eylem' + (ey.birincil ? '.birincil' : ''), { type: 'button', 'aria-label': ey.etiket || ey.ad, 'aria-pressed': ey.basili != null ? String(!!ey.basili) : null, data: ey.id ? { eylem: ey.id } : null }, [
            CD.el('span.ikon', { 'aria-hidden': 'true', html: ey.ikon || '' }), CD.el('span', ey.ad)
          ]);
          b.addEventListener('click', e => { CD.ses.tik(); if (ey.tikla) ey.tikla(e, b); });
          nav.appendChild(b);
        });
        $('#bolum').appendChild(nav);
        return nav;
      },
      pati(el) { if (el) el.setAttribute('data-pati', ''); }
    };
    return ctx;
  }
  function hataKarti(ic) {
    ic.innerHTML = '';
    ic.appendChild(CD.el('div.icerik', [CD.el('div.yama.bos-durum', [CD.el('div.buyuk', '🐾'), CD.el('p', 'Bu oda şu an biraz dağınık. Eve dönüp tekrar dener misin?'), CD.el('a.dugme', { href: '#/' }, 'Eve dön')])]));
  }
  function git() {
    const id = yol();
    const hub = $('#hub'), bolum = $('#bolum'), ic = $('#bolumIcerik');
    if (!hub || !bolum) return;
    CD.sheetKapat();
    if (aktif) {
      try { if (aktif.tanim.unmount) aktif.tanim.unmount(); } catch (e) { console.warn('[unmount]', aktif.id, e); }
      CD.olay.yay('bolum:kapandi', aktif.id);
      aktif = null; ic.innerHTML = ''; const ab = $('#bolum > .altbar'); if (ab) ab.remove();
      bolum.classList.remove('bolum-tam');
    }
    CD.ses.hepsiniDurdur();
    const tanim = CD.bolumler[id];
    if (id && !/[?&]hepsi/.test(location.search) && ((CD.config || {}).YAPIM_ASAMASINDA || []).includes(id)) { CD.toast('Bu oda yapım aşamasında 🧶'); location.hash = ''; return; }
    if (!id || !tanim) {
      if (id && !tanim) { CD.toast('Bu oda henüz hazırlanıyor 🧶'); location.hash = ''; return; }
      bolum.hidden = true; hub.hidden = false; document.body.dataset.bolum = 'hub';
      window.scrollTo(0, 0);
      CD.olay.yay('hub:acildi');
      return;
    }
    hub.hidden = true; bolum.hidden = false; document.body.dataset.bolum = id;
    $('#bolumBaslik').textContent = tanim.baslik || id;
    const ik = $('#bolumIkon'); if (ik) { ik.innerHTML = tanim.ikon || ''; ik.hidden = !tanim.ikon; }
    if (tanim.tamEkran) bolum.classList.add('bolum-tam');
    bolum.classList.remove('bolum'); void bolum.offsetWidth; bolum.classList.add('bolum');
    window.scrollTo(0, 0);
    aktif = { id, tanim };
    const ctx = baglamOlustur(id, ic);
    try { tanim.mount(ic, ctx); } catch (e) { console.error('[mount]', id, e); hataKarti(ic); }
    CD.olay.yay('bolum:acildi', id);
  }
  CD.git = git;
  window.addEventListener('hashchange', git);

  /* ============================================================== başlat */
  const hazirKuyruk = []; let basladi = false;
  CD.hazir = (fn) => { if (basladi) fn(); else hazirKuyruk.push(fn); };
  // ana ekrandan ilk açılışta boş hafıza → Safari'deki kayıtları taşıma ipucu (bir kere)
  function ilkKurulumIpucu() {
    try {
      const uygulama = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
      if (!uygulama || CD.depo.al('ipucu.yedek', false)) return;
      const veriVar = CD.depo.anahtarlar().some(k => !/^(kilit\.|ipucu\.|giris\.|ses$|hava$)/.test(k));
      if (veriVar) return;
      CD.depo.yaz('ipucu.yedek', true);
      setTimeout(() => CD.yedekYardim(), 1800);
    } catch (e) {}
  }

  function baslat() {
    havaUygula();
    CD.depo.kalici();
    ilkKurulumIpucu();
    const geri = $('#geriDugme'); if (geri) geri.addEventListener('click', () => { CD.ses.tik(); CD.ac(''); });
    const menu = $('#bolumMenu'); if (menu) menu.addEventListener('click', () => {
      const k = CD.el('div.dikey', [
        CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { CD.ses.ac(!CD.ses.acik); CD.sheetKapat(); CD.toast(CD.ses.acik ? 'Ses açık 🔈' : 'Ses kapalı 🔇'); } }, CD.ses.acik ? '🔇 Sesi kapat' : '🔈 Sesi aç'),
        CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { CD.havaDegistir(); CD.sheetKapat(); } }, CD.hava === 'gece' ? '☀️ Gündüze geç' : '🌙 Geceye geç'),
        CD.el('a.dugme.tam', { href: '#/', onclick: () => CD.sheetKapat() }, '🏠 Eve dön'),
        CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { CD.sheetKapat(); CD.yedekIndir(); } }, '💾 Yedeğini al'),
        CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { CD.sheetKapat(); CD.yedekYukleAc(); } }, '📂 Yedeği yükle'),
        CD.el('button.dugme-hayalet.tam', { type: 'button', onclick: () => CD.yedekYardim() }, 'Kayıtlarım nerede duruyor?'),
        CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => {
          // aynı sheet'in içeriği onay ekranıyla değişir (kapatıp açmak 320ms'lik temizleme zamanlayıcısıyla yarışır)
          const onay = CD.el('div.dikey', [
            CD.el('p', 'Oyun ilerlemesi, başarımlar, bahçe, pet evi, tırnak tasarımları ve eklenen fotoğraflar silinir.'),
            CD.el('p', 'Pıttıksu\'nun doğum tarihi, sihirli kelime ve ses/gece tercihin kalır. 🐾'),
            CD.el('button.dugme.tam', { type: 'button', onclick: async () => { CD.ses.tik(); CD.toast('Sıfırlanıyor… 🧹'); try { await CD.depo.sifirla(); } catch (e) {} location.hash = ''; location.reload(); } }, 'Evet, hepsini sıfırla'),
            CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => CD.sheetKapat() }, 'Vazgeç')
          ]);
          CD.sheet(onay, { baslik: 'Her şeyi sıfırla?', sessiz: true });
        } }, '🧹 Verileri sıfırla')
      ]);
      CD.sheet(k, { baslik: 'Ayarlar' });
    });
    const kap = $('#sheetKaplama');
    if (kap) {
      kap.addEventListener('click', e => { if (e.target.id === 'sheetKaplama') CD.sheetKapat(); });
      const sh = $('#sheet'); let y0 = null, dy = 0;
      sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
      sh.addEventListener('touchmove', e => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
      sh.addEventListener('touchend', () => { if (y0 == null) return; sh.style.transform = ''; if (dy > 90) CD.sheetKapat(); y0 = null; }, { passive: true });
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') CD.sheetKapat(); });
    basladi = true; hazirKuyruk.splice(0).forEach(fn => { try { fn(); } catch (e) { console.warn('[CD.hazir]', e); } });
    git();
    // service worker (sadece http/https; hatada sessiz)
    if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) { try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {} }
    CD.olay.yay('basladi');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat); else baslat();
})();
