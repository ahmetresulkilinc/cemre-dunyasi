/* senk.js — Bulut senkronu (Supabase / PostgREST, kütüphane yok).
   - Oda anahtarı sihirli kelimeden türetilir (kilit.js) → aynı kelimeyi bilen aynı odayı görür.
   - localStorage cd.* anahtarları buluta gider; her anahtarın son yazılma/silinme zamanı saklanır,
     birleştirme ANAHTAR BAZINDA yapılır: her anahtarda en yeni damga kazanır.
   - Silinen anahtarlar "mezar taşı" ({ v:null, t, sil:1 }) bırakır → karşı telefonda da silinir, geri gelmez.
   - Yazma "iyimser kilit" ile yapılır: PATCH ?guncellendi=eq.<okunan>. Arada karşı telefon yazdıysa
     0 satır döner → yeniden okunur, yeniden birleştirilir, tekrar denenir (hiçbir anahtar ezilmez).
   - Birleşmiş sonuç buluttakiyle aynıysa hiç yazılmaz; yazınca sunucunun yeni damgası saklanır (döngü yok).
   - Fotoğraflar (IndexedDB) ayrı tabloda (cemre_foto) eşitlenir: eksikler gider/gelir; silinenler
     "foto.silinen" listesine (ortak, senkronlu) yazılır → bulut satırı ve karşı telefondaki kopya da silinir.
   - Eski biçimli bulut satırı (damgasız alanlar) kayıpsız okunur: damgasız alan t=0 sayılır.
   - İLK eşitlemede körlemesine birleştirme yok: iki tarafta da veri varsa Cemre'ye sorulur.
   - "Sadece bu telefonu sıfırla" sonrası bu telefonda senkron durur (senk.durdu); Ayarlar'dan yeniden bağlanılır.
   Gerekli: config.js → SENK { URL, ANON } + Supabase'de tools/supabase-kurulum.sql ve tools/supabase-foto.sql çalıştırılmış olmalı. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const AYAR = (CD.config && CD.config.SENK) || {};
  const TABLO = 'cemre_durum';
  const ZAMAN = 'senk.zaman';        // { "bahce.durum": 1788… } — yazma VE silme zamanları
  const ILK = 'senk.ilkYapildi';
  const DURDU = 'senk.durdu';        // "sadece bu telefonu sıfırla" → bu cihazda senkron kapalı
  const SIFIRLA_ANAHTAR = '__sifirla';       // buluta düşen sıfırlama damgası (karşı telefona da geçer)
  const SIFIRLA_GORULDU = 'senk.sifirlaGoruldu';
  const FOTO_SILINEN = 'foto.silinen';       // { "fotolar bizim:abc": t } — ortak, senkronlu mezar taşı listesi
  const ATLA = /^(kilit\.|senk\.|ipucu\.|cihaz\.|hava$)/;   // hava: eski sürümün ortak gece/gündüz seçimi artık cihaza özel   // buluta gitmeyecek anahtarlar
  const ARA = 4 * 60 * 1000;
  const CANLI_ARA = 3000;      // ön planda canlı yoklama (sadece damga okunur, çok hafif)
  const DENEME = 4;            // iyimser kilit çakışmasında en fazla deneme
  // mahalle varlığı/postası sık değişir; bunlar gelince "Yeni kayıtlar geldi" fısıltısı çıkmaz (posta kartı zaten söyler)
  // safir.*: Safir'in Yeri'ndeki çiçek/anı da fısıltısız gelir (Cemre'yi hiçbir şey hazırlıksız yakalamasın)
  // Faz 2: gece mührü, ortak bakım, el ele sayacı, "dinliyorum", oyun durumları da posta kartı/ekranla söylenir → fısıltısız
  // Faz 3: postane/müze/saat kulesi/eğlence/plak kayıtları da posta kartıyla söylenir → fısıltısız (Sanat Galerisi de: 'galeri' postası)
  const SESSIZ_ANAHTAR = /^(varlik|posta|saklinot|okunan|soru|mektupMuhur|safir|gece|bakim|elele|dinliyor|oyun|postane|muze|sayac|eglence|plak|defter|galeri)\./;
  const MEDYA_ONEK = /^(kaset|sonfoto|tahta|ani|galeri):/;   // genel mağazadaki Faz 2 medyası: kendi posta kartı var, "fotoğraf geldi" denmez

  let oda = null, acik = false, bekleyen = 0, sonSenk = 0, calisiyor = false, tekrar = false, durum = 'kapalı';
  let sessiz = false;          // true iken yerel yazmalar damgalanmaz (buluttan gelen değer yazılırken)

  const baslik = () => ({
    'apikey': AYAR.ANON, 'Authorization': 'Bearer ' + AYAR.ANON,
    'x-oda-anahtari': oda, 'Content-Type': 'application/json'
  });
  const kok = () => String(AYAR.URL || '').replace(/\/+$/, '') + '/rest/v1/' + TABLO;
  const odaFiltre = () => '?oda=eq.' + encodeURIComponent(oda);

  const zamanlar = () => { const z = CD.depo.al(ZAMAN, {}); return (z && typeof z === 'object') ? z : {}; };
  function zamanYaz(k, t) { const z = zamanlar(); z[k] = t; CD.depo.yaz(ZAMAN, z); }
  /* yerel değişiklik damgası: telefon saati geri kalsa bile, bu anahtarın bu telefonda görülen son
     damgasından büyük olur → yeni yazma her zaman kendi eski hâlini (ve gördüğü bulut hâlini) geçer. */
  function yerelDamga(k) { const z = zamanlar(); const t = Math.max(Date.now(), (Number(z[k]) || 0) + 1); z[k] = t; CD.depo.yaz(ZAMAN, z); return t; }

  /* ham yerel yaz/sil: kancayı tetiklemez (buluttan gelen değerler için) */
  function hamYaz(k, v) { sessiz = true; try { CD.depo.yaz(k, v); } finally { sessiz = false; } }
  function hamSil(k) { sessiz = true; try { CD.depo.sil(k); } finally { sessiz = false; } }

  /* ---------------------------------------------------------------- kancalar
     çekirdekteki "yazildi"/"silindi" kancaları TÜM depolar için çalışır
     (kök CD.depo ve modüllerin kullandığı CD.depo.alan('xox') gibi isim alanlı depolar dahil). */
  function damgala() {
    if (CD.depo.__senkli) return;
    CD.depo.yazildi = function (tamAnahtar) {
      if (sessiz || !tamAnahtar || ATLA.test(tamAnahtar)) return;
      yerelDamga(tamAnahtar); planla();
    };
    CD.depo.silindi = function (tamAnahtar) {
      if (sessiz || !tamAnahtar || ATLA.test(tamAnahtar)) return;
      yerelDamga(tamAnahtar); planla();          // anahtar yok + damga var = mezar taşı
    };
    // fotoğraf silme → ortak mezar taşı; aynı kimlikle yeniden koyma → taşı kaldır
    const idb = CD.depo.idb, asilSil = idb.sil, asilKoy = idb.koy;
    idb.__asilSil = asilSil; idb.__asilKoy = asilKoy;
    idb.sil = function (m, id) {
      return asilSil(m, id).then(r => { fotoMezar(m, id, true); return r; });
    };
    idb.koy = function (m, obj) {
      return asilKoy(m, obj).then(r => { if (obj && obj.id != null) fotoMezar(m, obj.id, false); return r; });
    };
    CD.depo.__senkli = true;
  }
  const fotoAnahtar = (m, id) => m + ' ' + String(id);
  function silinenler() { const s = CD.depo.al(FOTO_SILINEN, {}); return (s && typeof s === 'object' && !Array.isArray(s)) ? s : {}; }
  /* mezar taşı listesi budanır: en çok 200 kayıt ve 90 günden yeni (liste senk satırında sınırsız büyümesin).
     İki telefon aynı kuralla budadığı için birleşim yine aynı sonuca varır. */
  const SILINEN_MAKS = 200, SILINEN_GUN = 90;
  function silinenBuda(s) {
    const sinir = Date.now() - SILINEN_GUN * 86400000;
    const l = Object.keys(s || {}).map(k => [k, Number(s[k]) || 0]).filter(x => x[1] >= sinir).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, SILINEN_MAKS);
    const o = {}; l.forEach(([k, t]) => { o[k] = t; }); return o;
  }
  function fotoMezar(m, id, koy) {
    const s = silinenler(), a = fotoAnahtar(m, id);
    if (koy) { s[a] = Date.now(); CD.depo.yaz(FOTO_SILINEN, silinenBuda(s)); fotoSon = 0; setTimeout(() => fotoSenk(true), 1500); }
    else if (s[a]) { delete s[a]; CD.depo.yaz(FOTO_SILINEN, s); }
  }

  /* ---------------------------------------------------------------- paketler */
  const mezarMi = (x) => !!(x && x.sil);
  function yerelPaket() {
    const z = zamanlar(), o = {};
    const var_ = new Set(CD.depo.anahtarlar());
    var_.forEach(k => { if (!ATLA.test(k)) o[k] = { v: CD.depo.al(k), t: Number(z[k]) || 0 }; });
    // damgası olup kendisi olmayan anahtar = bu telefonda silinmiş → mezar taşı
    Object.keys(z).forEach(k => { if (!var_.has(k) && !ATLA.test(k) && k !== SIFIRLA_ANAHTAR) o[k] = { v: null, t: Number(z[k]) || 0, sil: 1 }; });
    return o;
  }
  /* bulut verisini (eski biçim dahil) { anahtar: {v,t[,sil]} } biçimine getirir — hiçbir alan atılmaz */
  function normalize(veri) {
    const o = {};
    if (!veri || typeof veri !== 'object' || Array.isArray(veri)) return o;
    Object.keys(veri).forEach(k => {
      const x = veri[k];
      if (x && typeof x === 'object' && !Array.isArray(x) && Object.prototype.hasOwnProperty.call(x, 'v')) {
        const e = { v: x.v, t: Number(x.t) || 0 }; if (x.sil) e.sil = 1; o[k] = e;
      } else o[k] = { v: x === undefined ? null : x, t: 0 };     // damgasız eski alan
    });
    return o;
  }
  const doluMu = (paket) => Object.keys(paket || {}).some(k => k !== SIFIRLA_ANAHTAR && !mezarMi(paket[k]) && !/^(ses|hava|giris\.)/.test(k) && !SESSIZ_ANAHTAR.test(k));   // mahalle nabzı "dolu" sayılmaz (ilk eşitlemede gereksiz soru çıkmasın)
  function sirali(v) {
    if (Array.isArray(v)) return v.map(sirali);
    if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach(k => { o[k] = sirali(v[k]); }); return o; }
    return v;
  }
  const ayni = (a, b) => JSON.stringify(sirali(a)) === JSON.stringify(sirali(b));

  /* ---------------------------------------------------------------- bulut uçları */
  let bulutDamga = null;                                  // sunucudaki son güncelleme zamanı (son okunan/yazılan)
  async function bulutAl() {
    const r = await fetch(kok() + odaFiltre() + '&select=veri,guncellendi', { headers: baslik(), cache: 'no-store' });
    if (!r.ok) throw new Error('okuma ' + r.status);
    const d = await r.json();
    if (!d || !d[0]) { bulutDamga = null; return { var: false, ham: null, veri: {} }; }
    bulutDamga = d[0].guncellendi || null;
    return { var: true, ham: d[0].veri, veri: normalize(d[0].veri), damga: d[0].guncellendi || null };
  }
  /* çok hafif yoklama: sadece "değişti mi?" — tam eşitleme ancak değiştiyse yapılır */
  async function degistiMi() {
    const r = await fetch(kok() + odaFiltre() + '&select=guncellendi', { headers: baslik(), cache: 'no-store' });
    if (!r.ok) return false;
    const d = await r.json();
    const yeni = d && d[0] && d[0].guncellendi;
    if (!yeni) return false;
    return yeni !== bulutDamga;
  }
  /* iyimser kilitli yazma: true = yazıldı, false = arada başkası yazdı (yeniden oku) */
  async function bulutYaz(veri, okunan) {
    let r;
    if (okunan.var) {
      const f = okunan.damga ? '&guncellendi=eq.' + encodeURIComponent(okunan.damga) : '';
      r = await fetch(kok() + odaFiltre() + f + '&select=guncellendi', {
        method: 'PATCH', headers: Object.assign(baslik(), { 'Prefer': 'return=representation' }), body: JSON.stringify({ veri })
      });
    } else {
      // satır yok: oluştur; aynı anda karşı telefon oluşturduysa dokunma (boş döner → yeniden oku)
      r = await fetch(kok() + '?on_conflict=oda&select=guncellendi', {
        method: 'POST', headers: Object.assign(baslik(), { 'Prefer': 'resolution=ignore-duplicates,return=representation' }), body: JSON.stringify({ oda, veri })
      });
    }
    if (!r.ok) throw new Error('yazma ' + r.status);
    let d = null; try { d = await r.json(); } catch (e) {}
    if (!d || !d[0]) return false;
    bulutDamga = d[0].guncellendi || bulutDamga;
    return true;
  }

  /* ---------------------------------------------------------------- anahtar bazında birleştirme */
  function yereleUygula(k, e) {
    if (mezarMi(e)) hamSil(k); else hamYaz(k, e.v);
    zamanYaz(k, e.t);
  }
  function silinenBirlestir(y, b) {
    const a = (y && !mezarMi(y) && y.v && typeof y.v === 'object') ? y.v : {};
    const c = (b && !mezarMi(b) && b.v && typeof b.v === 'object') ? b.v : {};
    const v = Object.assign({}, a);
    Object.keys(c).forEach(k => { v[k] = Math.max(Number(v[k]) || 0, Number(c[k]) || 0); });
    return { v: silinenBuda(v), t: Math.max((y && y.t) || 0, (b && b.t) || 0) };
  }
  function birlestir(yerel, bulut) {
    const sonuc = {}, hepsi = new Set([].concat(Object.keys(yerel), Object.keys(bulut)));
    let degisti = false, fotoDegisti = false, gorunur = false;   // gorunur: mahalle/posta dışı bir kayıt değişti (fısıltı gösterilir)
    hepsi.forEach(k => {
      if (k === SIFIRLA_ANAHTAR || ATLA.test(k)) { if (bulut[k]) sonuc[k] = bulut[k]; return; }
      const y = yerel[k], b = bulut[k];
      if (k === FOTO_SILINEN) {                       // liste: iki tarafın birleşimi (hiçbir silme kaybolmaz)
        const s = silinenBirlestir(y, b); sonuc[k] = s;
        if (!y || mezarMi(y) || !ayni(y.v, s.v)) { yereleUygula(k, s); degisti = true; fotoDegisti = true; }
        return;
      }
      if (y && b) {
        if ((y.t || 0) > (b.t || 0)) { sonuc[k] = y; return; }
        // bulut daha yeni ya da damgalar eşit → bulut (ortak dünya) esas
        sonuc[k] = b;
        const farkli = !ayni({ v: y.v, sil: !!y.sil }, { v: b.v, sil: !!b.sil });
        if (farkli || (y.t || 0) !== (b.t || 0)) yereleUygula(k, b);
        if (farkli) { degisti = true; if (!SESSIZ_ANAHTAR.test(k)) gorunur = true; }
      } else if (y) sonuc[k] = y;
      else if (b) { sonuc[k] = b; if (!mezarMi(b)) { yereleUygula(k, b); degisti = true; if (!SESSIZ_ANAHTAR.test(k)) gorunur = true; } else zamanYaz(k, b.t); }
    });
    return { sonuc, degisti, fotoDegisti, gorunur };
  }

  function ilkSecim() {
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
  function buluttanAl(bulut) { Object.keys(bulut).forEach(k => { if (k !== SIFIRLA_ANAHTAR && !ATLA.test(k)) yereleUygula(k, bulut[k]); }); }

  async function senkEt(sebep) {
    if (!acik || !oda || !navigator.onLine) return;
    if (calisiyor) { tekrar = true; return; }      // bitince bir tur daha (yerel değişiklik kaybolmasın)
    calisiyor = true; tekrar = false;
    let fotoZorla = sebep === 'elle' || sebep === 'açılış';
    try {
      for (let deneme = 0; deneme < DENEME; deneme++) {
        const okunan = await bulutAl();
        const bulut = okunan.veri;
        // karşı telefon "her şeyi sıfırla" dediyse burada da temizle
        const sif = bulut[SIFIRLA_ANAHTAR];
        // hiç eşitlenmemiş (yeni / yeniden bağlanan) telefon eski bir sıfırlamayı "görmüş" sayılır: kendini silip yenilemez
        if (sif && sif.v && !CD.depo.al(ILK, false) && sif.v > (CD.depo.al(SIFIRLA_GORULDU, 0) || 0)) CD.depo.yaz(SIFIRLA_GORULDU, sif.v);
        if (sif && sif.v && sif.v > (CD.depo.al(SIFIRLA_GORULDU, 0) || 0)) {
          acik = false;                                    // sayfa yenilenene kadar başka tur yok
          await CD.depo.sifirla();
          CD.depo.yaz(SIFIRLA_GORULDU, sif.v);
          CD.depo.yaz(ILK, true);
          CD.toast('Her şey sıfırlandı 🧹');
          setTimeout(() => { location.hash = ''; location.reload(); }, 900);
          return;
        }
        let paket, yeniGeldi = false;
        if (!CD.depo.al(ILK, false)) {                       // ilk eşitleme: körlemesine birleştirme yok
          const yerel = yerelPaket();
          if (!doluMu(bulut)) {
            // bulutta oyun kaydı yok (en çok mahalle anahtarları var) → anahtar bazında birleştir: bu telefonun kayıtları gider,
            // karşının mahalle anahtarları (varlik/posta…) bu telefona gelir
            const b = birlestir(yerel, bulut); paket = b.sonuc; if (b.degisti) yeniGeldi = true;
          }
          else if (!doluMu(yerel)) {
            // bulut esas; bu telefonun yeni yazdığı kendi mahalle anahtarları (cd.varlik.<kim> …) da eklenir
            const kendi = {}; Object.keys(yerel).forEach(k => { if (SESSIZ_ANAHTAR.test(k) && !mezarMi(yerel[k]) && (!bulut[k] || (yerel[k].t || 0) > (bulut[k].t || 0))) kendi[k] = yerel[k]; });
            buluttanAl(bulut); paket = Object.assign({}, bulut, kendi); Object.keys(kendi).forEach(k => yereleUygula(k, kendi[k])); yeniGeldi = true;
          }
          else {
            const secim = await ilkSecim();
            if (secim === 'sonra') return;
            if (secim === 'bulut') { paket = bulut; buluttanAl(bulut); CD.toast('Buluttan geldi 💫'); setTimeout(() => location.reload(), 1200); }
            else { paket = Object.assign({}, yerel); CD.toast('Bu telefondaki gönderildi ☁️'); }
          }
          if (bulut[SIFIRLA_ANAHTAR]) paket[SIFIRLA_ANAHTAR] = bulut[SIFIRLA_ANAHTAR];
          if (!okunan.var || !ayni(paket, okunan.ham)) {
            if (!(await bulutYaz(paket, okunan))) continue;   // arada değişti → yeniden oku
          }
          CD.depo.yaz(ILK, true);
          if (yeniGeldi) { CD.olay.yay('senk:yenilendi'); }
        } else {
          const { sonuc, degisti, fotoDegisti, gorunur } = birlestir(yerelPaket(), bulut);
          if (fotoDegisti) fotoZorla = true;
          if (degisti) { if (gorunur) CD.toast('Yeni kayıtlar geldi 💫'); CD.olay.yay('senk:yenilendi'); }
          // sonuç buluttakiyle aynıysa YAZMA (döngü ve gereksiz trafik yok)
          if (!okunan.var || !ayni(sonuc, okunan.ham)) {
            if (!(await bulutYaz(sonuc, okunan))) continue;   // iyimser kilit tutmadı → yeniden oku, yeniden birleştir
          }
        }
        sonSenk = Date.now(); durum = 'açık';
        CD.depo.yaz('senk.sonSenk', sonSenk);
        fotoSenk(fotoZorla);
        CD.olay.yay('senk', { durum: 'tamam', sebep });
        return;
      }
      throw new Error('çakışma');
    } catch (e) {
      durum = /okuma 40[14]|yazma 40[14]/.test(e.message) ? 'kurulmadı' : 'hata';
      CD.olay.yay('senk', { durum: 'hata', mesaj: e.message });
    } finally {
      calisiyor = false;
      if (tekrar) { tekrar = false; planla(); }
    }
  }
  function planla() { if (!acik) return; clearTimeout(bekleyen); bekleyen = setTimeout(() => senkEt('değişiklik'), 700); }

  /* ---------------------------------------------------------------- fotoğraflar (IndexedDB → cemre_foto tablosu)
     Her kayıt tek satır; eksikler gider/gelir. Silinenler (foto.silinen) bulutta da, karşı telefonda da silinir. */
  const FOTO_TABLO = 'cemre_foto';
  const FOTO_SINIR = 1.6 * 1024 * 1024;      // tek kayıt için üst sınır (base64 dahil)
  let fotoSon = 0, fotoCalisiyor = false;
  const fotoKok = () => String(AYAR.URL || '').replace(/\/+$/, '') + '/rest/v1/' + FOTO_TABLO;

  async function fotoSenk(zorla) {
    if (!acik || !oda || fotoCalisiyor) return;
    if (!zorla && Date.now() - fotoSon < 60000) return;
    fotoCalisiyor = true;
    try {
      const r = await fetch(fotoKok() + odaFiltre() + '&select=magaza,kayit_id', { headers: baslik(), cache: 'no-store' });
      if (!r.ok) { if (r.status === 404) durum = durum === 'açık' ? 'foto kurulmadı' : durum; throw new Error('foto liste ' + r.status); }
      const bulutListe = (await r.json()) || [];
      const bulutta = new Set(bulutListe.map(x => fotoAnahtar(x.magaza, x.kayit_id)));
      const silinen = silinenler();
      const asilSil = CD.depo.idb.__asilSil || CD.depo.idb.sil;

      // 1) silinmiş kayıtların bulut satırlarını sil
      for (const x of bulutListe) {
        if (!silinen[fotoAnahtar(x.magaza, x.kayit_id)]) continue;
        try {
          await fetch(fotoKok() + odaFiltre() + '&magaza=eq.' + encodeURIComponent(x.magaza) + '&kayit_id=eq.' + encodeURIComponent(x.kayit_id),
            { method: 'DELETE', headers: Object.assign(baslik(), { 'Prefer': 'return=minimal' }) });
        } catch (e) {}
      }

      let yollanan = 0, gelen = 0, silinenSay = 0, gelenFoto = 0;
      for (const magaza of (CD.depo.magazalar ? CD.depo.magazalar() : ['fotolar'])) {
        let kayitlar = [];
        try { kayitlar = (await CD.depo.idb.hepsi(magaza)) || []; } catch (e) { continue; }
        const yerelde = new Set();
        for (const kayit of kayitlar) {
          if (!kayit || kayit.id == null) continue;
          const id = String(kayit.id);
          // 2) karşı telefonda silinmiş → burada da sil
          if (silinen[fotoAnahtar(magaza, id)]) { try { await asilSil(magaza, kayit.id); silinenSay++; } catch (e) {} continue; }
          yerelde.add(id);
          if (bulutta.has(fotoAnahtar(magaza, id))) continue;
          let govde;
          try { govde = JSON.stringify(await CD.depo.kayitDisa(kayit)); } catch (e) { continue; }
          if (!govde || govde.length > FOTO_SINIR) continue;                 // çok büyük: yerelde kalsın
          const y = await fetch(fotoKok() + '?on_conflict=oda,magaza,kayit_id', {
            method: 'POST',
            headers: Object.assign(baslik(), { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
            body: JSON.stringify({ oda, magaza, kayit_id: id, veri: govde })
          });
          if (y.ok) yollanan++;
        }
        // 3) buluttaki eksik kayıtları indir (silinmişler hariç)
        for (const x of bulutListe.filter(x => x.magaza === magaza && !yerelde.has(String(x.kayit_id)) && !silinen[fotoAnahtar(x.magaza, x.kayit_id)])) {
          const g = await fetch(fotoKok() + odaFiltre() + '&magaza=eq.' + encodeURIComponent(magaza) + '&kayit_id=eq.' + encodeURIComponent(x.kayit_id) + '&select=veri', { headers: baslik(), cache: 'no-store' });
          if (!g.ok) continue;
          const d = await g.json();
          if (!d || !d[0] || !d[0].veri) continue;
          try { await (CD.depo.idb.__asilKoy || CD.depo.idb.koy)(magaza, CD.depo.kayitIce(JSON.parse(d[0].veri))); gelen++; if (!MEDYA_ONEK.test(String(x.kayit_id))) gelenFoto++; } catch (e) {}
        }
      }
      fotoSon = Date.now();
      if (gelenFoto) CD.toast(gelenFoto + ' yeni fotoğraf geldi 📷');
      if (gelen || silinenSay) CD.olay.yay('senk:fotograf', { gelen, yollanan, silinen: silinenSay });
      if (yollanan || gelen || silinenSay) CD.olay.yay('senk', { durum: 'foto', yollanan, gelen, silinen: silinenSay });
    } catch (e) {
      CD.olay.yay('senk', { durum: 'foto-hata', mesaj: e.message });
    } finally { fotoCalisiyor = false; }
  }

  const durduMu = () => !!CD.depo.al(DURDU, false);
  // kancaları HEMEN kur (bulut ayarlı + oda var + durdurulmamışsa): açılışta yapılan yazmalar da damgalansın
  try {
    let odaVar = false; try { odaVar = !!localStorage.getItem('cd.senk.oda'); } catch (e) {}
    if (AYAR.URL && AYAR.ANON && odaVar && !durduMu()) { damgala(); }
  } catch (e) {}

  let dinleyicilerKuruldu = false;
  CD.senk = {
    get acik() { return acik; },
    get oda() { return acik ? oda : null; },      // canli.js kanal adını bundan türetir (kanal adında oda görünmez)
    get durum() { return durum; },
    get durdu() { return durduMu(); },
    get sonSenk() { return sonSenk || CD.depo.al('senk.sonSenk', 0); },
    kurulu: () => !!(AYAR.URL && AYAR.ANON),
    async baslat(odaAnahtari) {
      if (!AYAR.URL || !AYAR.ANON || !odaAnahtari) { durum = 'kapalı'; return false; }
      if (durduMu()) { durum = 'bu telefonda kapalı'; return false; }
      oda = odaAnahtari; acik = true; durum = 'bağlanıyor';
      damgala();
      CD.olay.yay('senk:acildi');
      await senkEt('açılış');
      if (dinleyicilerKuruldu) return true;
      dinleyicilerKuruldu = true;
      document.addEventListener('visibilitychange', () => { if (!document.hidden) senkEt('dönüş'); });
      window.addEventListener('online', () => senkEt('çevrimiçi'));
      setInterval(() => senkEt('periyodik'), ARA);
      // CANLI: uygulama ön plandayken 3 sn'de bir "değişti mi?" sorulur; değiştiyse hemen eşitlenir
      setInterval(async () => {
        if (!acik || calisiyor || document.hidden || !navigator.onLine) return;
        try { if (await degistiMi()) senkEt('canlı'); } catch (e) {}
      }, CANLI_ARA);
      return true;
    },
    /* "Her şeyi sıfırla (ikimizde de)": true = bulut sıfırlandı; false = olmadı (hiçbir şey silinmemeli) */
    async bulutuSifirla() {
      if (!acik || !oda) return false;
      // önce fotoğraflar: silinemezse hiçbir şeye dokunma (yoksa sıfırlamadan sonra fotoğraflar geri iner)
      let f = null;
      try { f = await fetch(fotoKok() + odaFiltre(), { method: 'DELETE', headers: Object.assign(baslik(), { 'Prefer': 'return=minimal' }) }); } catch (e) { return false; }
      if (!f || !(f.ok || f.status === 404)) return false;
      fotoSon = 0;
      const damga = Date.now();
      const govde = {}; govde[SIFIRLA_ANAHTAR] = { v: damga, t: damga };
      let r;
      try {
        r = await fetch(kok() + odaFiltre() + '&select=guncellendi', {
          method: 'PATCH', headers: Object.assign(baslik(), { 'Prefer': 'return=representation' }), body: JSON.stringify({ veri: govde })
        });
      } catch (e) { return false; }
      if (!r.ok) return false;
      let d = null; try { d = await r.json(); } catch (e) {}
      if (d && d[0]) bulutDamga = d[0].guncellendi || bulutDamga;
      CD.depo.yaz(SIFIRLA_GORULDU, damga);
      return true;
    },
    /* "Sadece bu telefonu sıfırla": bu telefonda senkron durur, buluttan geri dolmaz */
    durdur() { acik = false; durum = 'bu telefonda kapalı'; clearTimeout(bekleyen); CD.depo.yaz(DURDU, true); },
    /* Ayarlar → "buluta yeniden bağlan": ilk eşitleme akışıyla (gerekirse sorarak) yeniden başlar */
    yenidenBagla() { CD.depo.sil(DURDU); CD.depo.sil(ILK); },
    simdi: () => senkEt('elle'),
    fotolar: (zorla) => fotoSenk(zorla !== false)
  };
})();
