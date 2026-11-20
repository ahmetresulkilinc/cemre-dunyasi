/* ani-ortak.js — V2 Faz 3 ortak yardımcıları (Postane, Anı Müzesi, Saat Kulesi, Eğlence Köşesi, Plak Dükkanı).
   Kalıp (FAZ2 ile aynı):
   - Kalıcı veri kişinin KENDİ anahtarına yazılır: cd.<bolum>.<sey>.<kim>. İki kişinin listesi okunurken birleştirilir.
   - Karşıya haber posta kartıyla gider (CD.varlik.gonder → canlı kanal + senk). Kart türleri CD.postaTurleri'ne kaydolur.
   - Fotoğraflar mevcut medya yolundan: CD.medya.koy({ id:'ani:<kim>:<kimlik>', blob }) → IndexedDB 'genel' → senk → cemre_foto.
   - Cihaza özel küçük tercihler 'cihaz.' önekiyle (senklenmez).
   - Kullanıcı metinleri her yerde textContent ile basılır (CD.el çocukları metin düğümüdür).
   - Hatıra Defteri (başka ekip): önemli anlarda CD.pul('<tur>', { kisa }) çağrılır; dosya yoksa sessizce geçilir. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const KISILER = ['cemre', 'ahmet'];
  const dizi = (v) => Array.isArray(v) ? v : [];
  const ben = () => (CD.kim ? CD.kim() : null);
  const karsi = () => { const k = ben(); return k === 'ahmet' ? 'cemre' : (k === 'cemre' ? 'ahmet' : null); };
  const bulut = () => !!(CD.senk && CD.senk.acik);
  const aktif = () => !!(bulut() && ben());

  /* ---------------------------------------------------------------- kişi bazlı listeler */
  function liste(anahtar, kim) { return kim ? dizi(CD.depo.al(anahtar + '.' + kim, [])).filter(x => x && typeof x === 'object' && x.id != null) : []; }
  function ikisi(anahtar) { return KISILER.flatMap(k => liste(anahtar, k).map(x => Object.assign({}, x, { kim: k }))); }
  function benimYaz(anahtar, l, maks) {
    const k = ben(); if (!k) return false;
    l = dizi(l).slice(-(maks || 200));
    if (l.length) CD.depo.yaz(anahtar + '.' + k, l); else CD.depo.sil(anahtar + '.' + k);
    return true;
  }
  function benimEkle(anahtar, kayit, maks) { const l = liste(anahtar, ben()); l.push(kayit); return benimYaz(anahtar, l, maks); }
  function benimSil(anahtar, id) { return benimYaz(anahtar, liste(anahtar, ben()).filter(x => x.id !== id), Infinity); }
  function benimGuncelle(anahtar, id, degisim) { return benimYaz(anahtar, liste(anahtar, ben()).map(x => x.id === id ? Object.assign({}, x, degisim) : x), Infinity); }

  /* "Bu telefon kimin?" seçilmediyse önce sor, sonra işi yap */
  function kimIste(fn) {
    if (ben()) { fn(ben()); return; }
    if (CD.kimSec) CD.kimSec(false).then(k => { if (k) setTimeout(() => fn(k), 340); });
  }
  function posta(tur, v) { try { if (CD.varlik && ben()) return CD.varlik.gonder(tur, v || {}); } catch (e) {} return null; }
  function pul(tur, kisa) { try { if (window.CD && CD.pul) CD.pul(tur, { kisa: String(kisa || '').slice(0, 120) }); } catch (e) {} }

  /* ---------------------------------------------------------------- metin / tarih */
  const kirp = (s, n) => String(s == null ? '' : s).replace(/\s+$/g, '').replace(/^\s+/g, '').slice(0, n || 280);
  const tarihGecerli = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(new Date(String(s) + 'T00:00:00').getTime());
  function gunKaldi(iso) {           // bugünden o güne kaç gün (negatif = geçti)
    if (!tarihGecerli(iso)) return null;
    const [y, a, g] = iso.split('-').map(Number);
    const b = new Date(); const bugun = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((new Date(y, a - 1, g) - bugun) / 86400000);
  }
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function tarihUzun(iso) { if (!tarihGecerli(iso)) return ''; const [y, a, g] = iso.split('-').map(Number); return g + ' ' + AYLAR[a - 1] + ' ' + y; }
  function isoYap(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function yarin() { const d = new Date(); d.setDate(d.getDate() + 1); return isoYap(d); }

  /* ---------------------------------------------------------------- kişi ikonu (kimin eklediği) */
  function kisiIkon(kim, px) {
    const k = kim === 'ahmet' ? 'ahmet' : 'cemre';
    const s = CD.el('span.ao-kisi', { title: CD.kimAdi(k) });
    if (CD.kisi && CD.kisi.kafa) s.appendChild(CD.kisi.kafa(k, px || 18));
    else s.appendChild(CD.el('span', { 'aria-hidden': 'true' }, k === 'ahmet' ? '💙' : '🎀'));
    s.appendChild(CD.el('span.gorsel-gizli', CD.kimAdi(k)));
    return s;
  }

  /* ---------------------------------------------------------------- fotoğraf (mevcut medya yolu) */
  function fotoSec() {
    return new Promise(coz => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.style.position = 'fixed'; inp.style.left = '-9999px';
      document.body.appendChild(inp);
      let bitti = false;
      inp.addEventListener('change', async () => {
        bitti = true; const f = inp.files && inp.files[0]; inp.remove();
        if (!f) { coz(null); return; }
        try { coz(await CD.fotoKucult(f, 1280, 0.82)); } catch (e) { coz(null); }
      });
      // iptal edilirse (çoğu tarayıcı olay vermez) bir süre sonra temizlenir
      setTimeout(() => { if (!bitti) inp.remove(); }, 120000);
      inp.click();
    });
  }
  async function fotoKoy(blob) {
    const k = ben(); if (!k || !blob || !CD.medya) return '';
    const id = 'ani:' + k + ':' + CD.kimlik();
    await CD.medya.koy({ id, tur: 'ani', kim: k, t: Date.now(), blob });
    return id;
  }
  const urlOnbellek = {};
  async function fotoUrl(id, gelince) {
    if (!id || typeof id !== 'string' || id.indexOf('ani:') !== 0) return '';
    if (urlOnbellek[id]) return urlOnbellek[id];
    let k = null; try { k = await CD.depo.idb.al('genel', id); } catch (e) {}
    if (k && k.blob instanceof Blob) { urlOnbellek[id] = URL.createObjectURL(k.blob); return urlOnbellek[id]; }
    if (aktif() && CD.medya && gelince) CD.medya.cek(id, gelince);
    return '';
  }
  async function fotoSil(id) { if (id && CD.medya && id.indexOf('ani:' + ben() + ':') === 0) { try { await CD.medya.sil(id); } catch (e) {} if (urlOnbellek[id]) { try { URL.revokeObjectURL(urlOnbellek[id]); } catch (e) {} delete urlOnbellek[id]; } } }
  /* img elemanı: foto inince kendiliğinden dolar */
  function fotoImg(id, alt, sinif) {
    const img = CD.el('img' + (sinif ? '.' + sinif : ''), { alt: alt || 'Anı fotoğrafı', loading: 'lazy', decoding: 'async', hidden: true });
    const doldur = () => fotoUrl(id, doldur).then(u => { if (u && img.isConnected !== false) { img.src = u; img.hidden = false; } });
    doldur();
    return img;
  }
  /* sheet içinde "fotoğraf ekle" alanı: { el, blob() } */
  function fotoAlani(etiket) {
    let blob = null, onizURL = '';
    const img = CD.el('img.ao-foto-oniz', { alt: 'Seçtiğin fotoğrafın önizlemesi', hidden: true });
    const durum = CD.el('span.sessiz', { role: 'status' }, '');
    const kaldir = CD.el('button.dugme-hayalet.kucuk', { type: 'button', hidden: true }, 'Kaldır');
    const sec = CD.el('button.dugme-ikincil', { type: 'button' }, etiket || '📷 Fotoğraf ekle (isteğe bağlı)');
    sec.addEventListener('click', async () => {
      durum.textContent = 'Hazırlıyorum…';
      const b = await fotoSec();
      if (!b) { durum.textContent = ''; return; }
      blob = b; if (onizURL) URL.revokeObjectURL(onizURL); onizURL = URL.createObjectURL(b);
      img.src = onizURL; img.hidden = false; kaldir.hidden = false;
      durum.textContent = Math.round(b.size / 1024) + ' KB';
    });
    kaldir.addEventListener('click', () => { blob = null; img.hidden = true; kaldir.hidden = true; durum.textContent = ''; });
    return { el: CD.el('div.ao-foto-alan', [CD.el('div.satir', [sec, kaldir, durum]), img]), blob: () => blob, temizle: () => { if (onizURL) URL.revokeObjectURL(onizURL); } };
  }

  /* ---------------------------------------------------------------- sekmeler (cihaza özel hatırlanır) */
  function sekmeler(bolum, liste_, secili, degisince) {
    const kap = CD.el('div.cipler.ao-sekmeler', { role: 'tablist', 'aria-label': 'Bölümler' });
    const dugmeler = liste_.map(([id, ad]) => {
      const b = CD.el('button.cip', { type: 'button', role: 'tab', id: 'ao-sekme-' + bolum + '-' + id, 'aria-selected': id === secili ? 'true' : 'false', tabindex: id === secili ? '0' : '-1' }, ad);
      b.addEventListener('click', () => { if (CD.ses) CD.ses.tik(); sec(id); });
      return b;
    });
    function sec(id) {
      dugmeler.forEach((b, i) => { const s = liste_[i][0] === id; b.setAttribute('aria-selected', s ? 'true' : 'false'); b.tabIndex = s ? 0 : -1; });
      CD.depo.yaz('cihaz.' + bolum + '.sekme', id);
      degisince(id);
    }
    kap.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = dugmeler.indexOf(document.activeElement); if (i < 0) return;
      const n = dugmeler[(i + (e.key === 'ArrowRight' ? 1 : dugmeler.length - 1)) % dugmeler.length];
      n.focus(); n.click(); e.preventDefault();
    });
    dugmeler.forEach(b => kap.appendChild(b));
    return kap;
  }
  const sekmeOku = (bolum, gecerli, varsayilan) => { const s = CD.depo.al('cihaz.' + bolum + '.sekme', varsayilan); return gecerli.indexOf(s) >= 0 ? s : varsayilan; };

  /* ---------------------------------------------------------------- küçük pixel svg */
  function pixel(satirlar, renk, sinif, etiket) {
    const h = satirlar.length, w = Math.max(...satirlar.map(s => s.length)); let r = '';
    satirlar.forEach((s, y) => { let x = 0; while (x < w) { const c = s[x]; if (!c || c === '.' || !renk[c]) { x++; continue; } let n = 1; while (x + n < w && s[x + n] === c) n++; r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + renk[c] + '"/>'; x += n; } });
    return '<svg class="' + (sinif || '') + '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" ' + (etiket ? 'role="img" aria-label="' + etiket + '"' : 'aria-hidden="true" focusable="false"') + '>' + r + '</svg>';
  }

  /* alt yol: #/postane/hediye/abc → ['hediye','abc'] */
  const altYol = () => location.hash.replace(/^#\/?/, '').split('/').slice(1).map(s => { try { return decodeURIComponent(s); } catch (e) { return ''; } });

  CD.ani = { KISILER, ben, karsi, bulut, aktif, liste, ikisi, benimYaz, benimEkle, benimSil, benimGuncelle, kimIste, posta, pul, kirp, tarihGecerli, gunKaldi, tarihUzun, isoYap, yarin,
    kisiIkon, fotoSec, fotoKoy, fotoUrl, fotoSil, fotoImg, fotoAlani, sekmeler, sekmeOku, pixel, altYol };
  // mahallede binanın altında görünen canlı ipuçları (depoya yazmadan, hesaplanarak): CD.mhIpucu[id] = () => 'metin'
  CD.mhIpucu = CD.mhIpucu || {};

  // şerit metni için yer adları (varlik.js'e dokunmadan, nesneye eklenir)
  // Faz 3 postası canlı kanaldan anında gelir; asıl kayıt senk ile gelir → beklemeden bir eşitleme iste
  const FAZ3_POSTA = /^(zarf|zarfAcildi|kapsul|kapsulKilit|minnet|hediyeBulundu|muze|sayac|kavanoz|fikir|test|testSonuc|soruSahne|soruEvet|sarki)$/;
  let senkT = 0;
  CD.hazir(() => {
    CD.olay.dinle('posta:geldi', (d) => {
      if (!d || !d.canli || !d.o || !FAZ3_POSTA.test(d.o.tur) || !bulut()) return;
      clearTimeout(senkT); senkT = setTimeout(() => { try { CD.senk.simdi(); } catch (e) {} }, 400);
    });
    const Y = CD.varlik && CD.varlik.YERLER; if (!Y) return;
    Object.assign(Y, {
      postane: { ad: 'Postane', de: "Postane'de", em: '💌' }, muze: { ad: 'Anı Müzesi', de: "Anı Müzesi'nde", em: '🖼️' },
      sayac: { ad: 'Saat Kulesi', de: "Saat Kulesi'nde", em: '⏳' }, eglence: { ad: 'Eğlence Köşesi', de: "Eğlence Köşesi'nde", em: '🎪' },
      plak: { ad: 'Plak Dükkanı', de: "Plak Dükkanı'nda", em: '🎶' }, defter: { ad: 'Hatıra Defteri', de: "Hatıra Defteri'nde", em: '📖' }
    });
  });
})();
