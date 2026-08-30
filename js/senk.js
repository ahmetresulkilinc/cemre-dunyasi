/* senk.js — Bulut senkronu (Supabase / PostgREST, kütüphane yok).
   - Oda anahtarı sihirli kelimeden türetilir (kilit.js) → aynı kelimeyi bilen aynı odayı görür.
   - localStorage cd.* anahtarları buluta gider; her anahtarın son yazılma zamanı saklanır,
     birleştirmede yeni olan kazanır. Fotoğraflar (IndexedDB) buluta GİTMEZ — onlar yedek dosyasıyla taşınır.
   - İLK eşitlemede körlemesine birleştirme yok: iki tarafta da veri varsa Cemre'ye sorulur.
   Gerekli: config.js → SENK { URL, ANON } + Supabase'de tools/supabase-kurulum.sql çalıştırılmış olmalı. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const AYAR = (CD.config && CD.config.SENK) || {};
  const TABLO = 'cemre_durum';
  const ZAMAN = 'senk.zaman';        // { "bahce.durum": 1788… }
  const ILK = 'senk.ilkYapildi';
  const ATLA = /^(kilit\.|senk\.|ipucu\.|cihaz\.)/;   // buluta gitmeyecek anahtarlar
  const ARA = 4 * 60 * 1000;

  let oda = null, acik = false, bekleyen = 0, sonSenk = 0, calisiyor = false, durum = 'kapalı';

  const baslik = () => ({
    'apikey': AYAR.ANON, 'Authorization': 'Bearer ' + AYAR.ANON,
    'x-oda-anahtari': oda, 'Content-Type': 'application/json'
  });
  const kok = () => String(AYAR.URL || '').replace(/\/+$/, '') + '/rest/v1/' + TABLO;

  const zamanlar = () => CD.depo.al(ZAMAN, {}) || {};
  function zamanYaz(k, t) { const z = zamanlar(); z[k] = t || Date.now(); CD.depo.yaz(ZAMAN, z); }

  /* yerel yazmaları damgala — CD.depo.yaz sarmalanır */
  function damgala() {
    if (CD.depo.__senkli) return;
    const asil = CD.depo.yaz.bind(CD.depo);
    CD.depo.yaz = function (k, v) {
      const s = asil(k, v);
      if (!ATLA.test(k)) { zamanYaz(k); planla(); }
      return s;
    };
    CD.depo.__senkli = true;
  }

  function yerelPaket() {
    const z = zamanlar(), o = {};
    CD.depo.anahtarlar().forEach(k => { if (!ATLA.test(k)) o[k] = { v: CD.depo.al(k), t: z[k] || 0 }; });
    return o;
  }
  const doluMu = (paket) => Object.keys(paket || {}).some(k => !/^(ses|hava|giris\.)/.test(k));

  async function bulutAl() {
    const r = await fetch(kok() + '?oda=eq.' + encodeURIComponent(oda) + '&select=veri', { headers: baslik(), cache: 'no-store' });
    if (!r.ok) throw new Error('okuma ' + r.status);
    const d = await r.json();
    return (d && d[0] && d[0].veri) || null;
  }
  async function bulutYaz(veri) {
    const r = await fetch(kok() + '?on_conflict=oda', {
      method: 'POST',
      headers: Object.assign(baslik(), { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({ oda, veri })
    });
    if (!r.ok) throw new Error('yazma ' + r.status);
  }

  function birlestir(yerel, bulut) {
    const sonuc = {}, hepsi = new Set([].concat(Object.keys(yerel), Object.keys(bulut)));
    let degisti = false;
    hepsi.forEach(k => {
      const y = yerel[k], b = bulut[k];
      if (y && (!b || (y.t || 0) >= (b.t || 0))) sonuc[k] = y;
      else if (b) { sonuc[k] = b; CD.depo.yaz(k, b.v); zamanYaz(k, b.t); degisti = true; }
    });
    return { sonuc, degisti };
  }

  function ilkSecim(bulut) {
    return new Promise(coz => {
      const sec = (n) => { CD.sheetKapat(); coz(n); };
      CD.sheet(CD.el('div.dikey', [
        CD.el('p', 'Bu telefonda da, bulutta da kayıt var. Hangisi kalsın?'),
        CD.el('p.sessiz', 'Seçtiğin taraf ana kayıt olur; bundan sonra ikisi tek başına birleşir.'),
        CD.el('button.dugme.tam', { type: 'button', onclick: () => sec('bulut') }, '☁️ Buluttakini getir'),
        CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => sec('yerel') }, '📱 Bu telefondakini gönder'),
        CD.el('button.dugme-hayalet.tam', { type: 'button', onclick: () => sec('sonra') }, 'Şimdilik kalsın')
      ]), { baslik: 'İlk eşitleme' });
    });
  }

  async function senkEt(sebep) {
    if (!acik || !oda || calisiyor || !navigator.onLine) return;
    calisiyor = true;
    try {
      const bulut = await bulutAl();
      const yerel = yerelPaket();
      let paket;
      if (!CD.depo.al(ILK, false)) {                       // ilk eşitleme: körlemesine birleştirme yok
        if (!bulut || !doluMu(bulut)) paket = yerel;        // bulut boş → yükle
        else if (!doluMu(yerel)) { paket = bulut; Object.keys(bulut).forEach(k => { CD.depo.yaz(k, bulut[k].v); zamanYaz(k, bulut[k].t); }); }
        else {
          const secim = await ilkSecim(bulut);
          if (secim === 'sonra') { calisiyor = false; return; }
          if (secim === 'bulut') { paket = bulut; Object.keys(bulut).forEach(k => { CD.depo.yaz(k, bulut[k].v); zamanYaz(k, bulut[k].t); }); CD.toast('Buluttan geldi 💫'); setTimeout(() => location.reload(), 1200); }
          else { paket = yerel; CD.toast('Bu telefondaki gönderildi ☁️'); }
        }
        CD.depo.yaz(ILK, true);
      } else {
        const { sonuc, degisti } = birlestir(yerel, bulut || {});
        paket = sonuc;
        if (degisti) { CD.toast('Yeni kayıtlar geldi 💫'); CD.olay.yay('senk:yenilendi'); }
      }
      await bulutYaz(paket);
      sonSenk = Date.now(); durum = 'açık';
      CD.depo.yaz('senk.sonSenk', sonSenk);
      CD.olay.yay('senk', { durum: 'tamam', sebep });
    } catch (e) {
      durum = /okuma 40[14]|yazma 40[14]/.test(e.message) ? 'kurulmadı' : 'hata';
      CD.olay.yay('senk', { durum: 'hata', mesaj: e.message });
    } finally { calisiyor = false; }
  }
  function planla() { clearTimeout(bekleyen); bekleyen = setTimeout(() => senkEt('değişiklik'), 2500); }

  CD.senk = {
    get acik() { return acik; },
    get durum() { return durum; },
    get sonSenk() { return sonSenk || CD.depo.al('senk.sonSenk', 0); },
    kurulu: () => !!(AYAR.URL && AYAR.ANON),
    async baslat(odaAnahtari) {
      if (!AYAR.URL || !AYAR.ANON || !odaAnahtari) { durum = 'kapalı'; return false; }
      oda = odaAnahtari; acik = true; durum = 'bağlanıyor';
      damgala();
      await senkEt('açılış');
      document.addEventListener('visibilitychange', () => { if (!document.hidden) senkEt('dönüş'); });
      window.addEventListener('online', () => senkEt('çevrimiçi'));
      setInterval(() => senkEt('periyodik'), ARA);
      return true;
    },
    simdi: () => senkEt('elle')
  };
})();
