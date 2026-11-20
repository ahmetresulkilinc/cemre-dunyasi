/* paylas.js — Son foto penceresi + "Şu an dinliyorum" (V2 Faz 2 · 7, 9).
   Son foto: seçilen fotoğraf 1280 px'e küçültülüp JPEG olur (CD.fotoKucult), sesli notla aynı yoldan gider (CD.medya → IndexedDB
   'genel' → senk → cemre_foto). Kişi başına tek kayıt tutulur: yenisi gelince eskisi silinir (mezar taşıyla iki tarafta da).
   Karşının mahallesinde Mahalle Panosu'nun yanında Polaroid olarak durur.
   Dinliyorum: yalnız https Spotify/YouTube linki. cd.dinliyor.<kim> = { id, link, not, t } (kendisi yazar) + posta 'dinliyor'.
   Karşı linki 10 dk içinde açarsa iki tarafa da "Şarkı ikizi!" kutlaması ('sarkiIkizi' postası). Metinler hep textContent ile basılır. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const IKIZ_SURE = 10 * 60000, GOSTER_SURE = 3 * 3600000;
  const V = () => CD.varlik;
  const ben = () => CD.kim();
  const karsi = () => (V() ? V().karsi() : null);
  const bulut = () => !!(V() && V().aktif());
  const M = () => CD.medya;

  /* ================================================================ son foto */
  let urlOnbellek = { id: '', url: '' };
  async function sonFoto(kim) {
    if (!kim) return null;
    const l = await M().liste('sonfoto:' + kim);
    return l.length ? l[l.length - 1] : null;
  }
  function fotoUrl(k) {
    if (!k || !(k.blob instanceof Blob)) return '';
    if (urlOnbellek.id === k.id) return urlOnbellek.url;
    if (urlOnbellek.url) { try { URL.revokeObjectURL(urlOnbellek.url); } catch (e) {} }
    urlOnbellek = { id: k.id, url: URL.createObjectURL(k.blob) };
    return urlOnbellek.url;
  }
  function gonderSayfasi() {
    if (!ben()) { CD.kimSec(false).then(k => { if (k) gonderSayfasi(); }); return; }
    let blob = null, onizURL = '';
    const dosya = CD.el('input.gorsel-gizli#sonFotoDosya', { type: 'file', accept: 'image/*' });
    const sec = CD.el('label.dugme-ikincil.tam', { for: 'sonFotoDosya' }, '📷 Fotoğraf seç');
    const oniz = CD.el('div.ps-polaroid.buyuk', { hidden: true }, [CD.el('img', { alt: 'Seçtiğin fotoğrafın önizlemesi' })]);
    const not = CD.el('input.girdi', { type: 'text', maxlength: '60', placeholder: 'Altına bir söz (isteğe bağlı)', 'aria-label': 'Fotoğrafın altına yazı' });
    const gonder = CD.el('button.dugme.tam', { type: 'button', disabled: true }, bulut() ? '📮 Gönder' : 'Bulut kapalı');
    const durum = CD.el('p.sessiz', { role: 'status' }, bulut() ? 'Seçtiğin son fotoğraf onun mahallesinde, panonun yanında durur.' : 'Bulut açık olunca fotoğraf onun mahallesine gider.');
    dosya.addEventListener('change', async () => {
      const f = dosya.files && dosya.files[0]; if (!f) return;
      durum.textContent = 'Hazırlıyorum…';
      try { blob = await CD.fotoKucult(f, 1280, 0.82); } catch (e) { blob = null; }
      if (!blob) { durum.textContent = 'Bu fotoğraf açılamadı; başka birini dener misin?'; return; }
      if (onizURL) URL.revokeObjectURL(onizURL);
      onizURL = URL.createObjectURL(blob);
      oniz.querySelector('img').src = onizURL; oniz.hidden = false;
      gonder.disabled = !bulut();
      durum.textContent = Math.round(blob.size / 1024) + ' KB · gönderince eski fotoğrafın yerine geçer.';
    });
    gonder.addEventListener('click', async () => {
      if (!blob || !bulut()) return;
      gonder.disabled = true;
      const k = ben();
      const kayit = { id: 'sonfoto:' + k + ':' + CD.kimlik(), tur: 'sonfoto', kim: k, t: Date.now(), not: String(not.value || '').trim().slice(0, 60), blob };
      try { await M().koy(kayit); } catch (e) { CD.toast('Fotoğraf kaydedilemedi; telefonda yer var mı bakar mısın?'); gonder.disabled = false; return; }
      for (const x of await M().liste('sonfoto:' + k)) if (x.id !== kayit.id) await M().sil(x.id);
      V().gonder('sonFoto', { id: kayit.id });
      CD.sheetKapat(); CD.ses.parilti(); CD.toast('Fotoğraf yola çıktı 📷');
      CD.olay.yay('medya:geldi', kayit.id);
    });
    CD.sheet(CD.el('div.dikey', [dosya, sec, oniz, not, durum, gonder]), { baslik: 'Son foto gönder', odak: false, kapaninca: () => { if (onizURL) URL.revokeObjectURL(onizURL); } });
  }
  async function bak(kim) {
    const k = await sonFoto(kim || karsi());
    const kendi = !kim || kim === ben();
    const govde = [];
    if (k && fotoUrl(k)) {
      const t = new Date(k.t || Date.now());
      govde.push(CD.el('figure.ps-polaroid.buyuk', [CD.el('img', { src: fotoUrl(k), alt: (k.kim ? CD.ek.den(CD.kimAdi(k.kim)) : '') + ' son fotoğraf' }), CD.el('figcaption', k.not || '')]),
        CD.el('p.sessiz', CD.ek.den(CD.kimAdi(k.kim)) + ' · ' + t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + CD.saatYaz(t)));
    } else govde.push(CD.el('div.bos-durum', [CD.el('div.buyuk', '📷'), CD.el('p', karsi() && !kendi ? CD.kimAdi(karsi()) + ' henüz fotoğraf göndermedi. Sen başla?' : 'Henüz fotoğraf yok.')]));
    govde.push(CD.el('button.dugme.tam', { type: 'button', onclick: () => gonderSayfasi() }, '📷 Sen de bir foto gönder'));
    CD.sheet(CD.el('div.dikey', govde), { baslik: 'Son foto', odak: false });
  }

  /* ================================================================ şu an dinliyorum */
  const IZINLI = /^(open\.spotify\.com|spotify\.link|spotify\.app\.link|(www\.|m\.|music\.)?youtube\.com|youtu\.be)$/i;
  function linkDenetle(ham) {
    let u; try { u = new URL(String(ham || '').trim()); } catch (e) { return null; }
    if (u.protocol !== 'https:' || !IZINLI.test(u.hostname) || u.username || u.password) return null;
    return u.href;
  }
  const kaynak = (link) => /spotify/i.test(link) ? 'Spotify' : 'YouTube';
  function dinliyorKaydi(kim) {
    const v = kim ? CD.depo.al('dinliyor.' + kim, null) : null;
    if (!v || typeof v !== 'object' || !linkDenetle(v.link)) return null;
    return { id: String(v.id || ''), link: linkDenetle(v.link), not: String(v.not || '').slice(0, 80), t: Number(v.t) || 0 };
  }
  let canliDinliyor = null;          // kanaldan gelen (senk gelene kadar)
  function onunDinledigi() {
    const k = karsi(); if (!k || !bulut()) return null;
    const s = dinliyorKaydi(k);
    const c = canliDinliyor && (!s || canliDinliyor.t > s.t) ? canliDinliyor : s;
    return c && Date.now() - c.t < GOSTER_SURE ? c : null;
  }
  function dinliyorSayfasi() {
    if (!ben()) { CD.kimSec(false).then(k => { if (k) dinliyorSayfasi(); }); return; }
    const link = CD.el('input.girdi', { type: 'url', inputmode: 'url', autocomplete: 'off', placeholder: 'https://open.spotify.com/…', 'aria-label': 'Spotify ya da YouTube linki' });
    const not = CD.el('input.girdi', { type: 'text', maxlength: '80', placeholder: 'Ne dinliyorsun? (isteğe bağlı)', 'aria-label': 'Şarkının adı ya da bir not' });
    const hata = CD.el('p.sessiz', { role: 'status' }, bulut() ? 'Linki yapıştır; o da açarsa şarkı ikizi olursunuz.' : 'Bulut açık olunca karşıya gider.');
    const gonder = CD.el('button.dugme.tam', { type: 'button', disabled: !bulut() }, '🎧 Paylaş');
    gonder.addEventListener('click', () => {
      const l = linkDenetle(link.value);
      if (!l) { hata.textContent = 'Yalnız https ile başlayan Spotify ya da YouTube linki olur.'; link.focus(); return; }
      const kayit = { id: CD.kimlik(), link: l, not: String(not.value || '').trim().slice(0, 80), t: Date.now() };
      CD.depo.yaz('dinliyor.' + ben(), kayit);
      V().gonder('dinliyor', { id: kayit.id, link: kayit.link, not: kayit.not });
      CD.sheetKapat(); CD.toast('Paylaşıldı 🎧'); CD.olay.yay('dinliyor:degisti');
    });
    const benim = dinliyorKaydi(ben());
    CD.sheet(CD.el('div.dikey', [link, not, hata, gonder,
      benim && Date.now() - benim.t < GOSTER_SURE ? CD.el('button.dugme-hayalet.tam', { type: 'button', onclick: () => { CD.depo.sil('dinliyor.' + ben()); CD.sheetKapat(); CD.toast('Kaldırıldı'); CD.olay.yay('dinliyor:degisti'); } }, 'Paylaştığımı kaldır') : null
    ]), { baslik: 'Şu an dinliyorum', odak: false });
  }
  const IKIZ = 'cihaz.dinliyor.ikiz';
  function ikizMi(id) { const a = CD.depo.al(IKIZ, []); return Array.isArray(a) && a.indexOf(id) >= 0; }
  function ikizIsaretle(id) { const a = CD.depo.al(IKIZ, []); const l = Array.isArray(a) ? a : []; if (l.indexOf(id) < 0) l.push(id); CD.depo.yaz(IKIZ, l.slice(-40)); }
  function ikizKutla(kim, id) {
    if (ikizMi(id)) return; ikizIsaretle(id);
    CD.efekt.konfeti(undefined, undefined, 18);
    try { CD.ses.zafer(); } catch (e) {}
    if (CD.posta) CD.posta.kart({ kim, tur: 'sarkiIkizi', baslik: 'Şarkı ikizi! 🎶', alt: 'Aynı şarkıyı aynı anda dinliyorsunuz' });
  }
  /* karşının linkini aç: 10 dk içindeyse iki tarafa kutlama */
  function ac(k) {
    if (!k || !linkDenetle(k.link)) return;
    try { const w = window.open(k.link, '_blank', 'noopener,noreferrer'); if (w) w.opener = null; } catch (e) {}
    if (k.id && Date.now() - k.t <= IKIZ_SURE && !ikizMi(k.id) && bulut()) {
      V().gonder('sarkiIkizi', { id: k.id });
      ikizKutla(karsi(), k.id);
    }
  }

  const T = (CD.postaTurleri = CD.postaTurleri || {});
  T.sonFoto = {
    kart(o, y) {
      if (o.v && o.v.id) M().cek(String(o.v.id), () => CD.olay.yay('sonfoto:degisti'));
      y.kart({ kim: y.kim, tur: 'sonFoto', baslik: y.A + ' sana bir fotoğraf gönderdi 📷', alt: 'Panonun yanında duruyor · ' + y.saat, eylem: { ad: 'Bak', fn: () => bak(y.kim) } });
    },
    ozet(l, A) { return '📷 ' + A + ' bir fotoğraf gönderdi'; }
  };
  T.dinliyor = {
    kart(o, y) {
      const l = linkDenetle(o.v && o.v.link); if (!l) return;
      canliDinliyor = { id: String(o.v.id || o.id), link: l, not: String((o.v && o.v.not) || '').slice(0, 80), t: o.t || Date.now() };
      CD.olay.yay('dinliyor:degisti');
      const k = canliDinliyor;
      y.kart({ kim: y.kim, tur: 'dinliyor', baslik: y.A + ' şunu dinliyor 🎧', alt: (k.not ? k.not + ' · ' : '') + kaynak(l), eylem: { ad: 'Aç', fn: () => ac(k) } });
    },
    ozet(l, A) { return '🎧 ' + A + ' bir şarkı paylaştı'; }
  };
  T.sarkiIkizi = {
    kart(o, y) { const id = o.v && o.v.id; if (id) ikizKutla(y.kim, String(id)); },
    ozet() { return '🎶 Şarkı ikizi oldunuz'; }
  };

  CD.sonFoto = { gonder: gonderSayfasi, bak, al: sonFoto, url: fotoUrl };
  CD.dinliyor = { sayfa: dinliyorSayfasi, onun: onunDinledigi, ac, linkDenetle, kaynak, kaydi: dinliyorKaydi };
  CD.hazir(() => { CD.olay.dinle('senk:yenilendi', () => CD.olay.yay('dinliyor:degisti')); });
})();
