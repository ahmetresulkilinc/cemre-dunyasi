/* kaset.js — Sesli not (pixel kaset arşivi) + paylaşılan medya yolu (V2 Faz 2 · 6, 7, 4).
   Yükleme yolu, fotoğraflarla AYNI: kayıt IndexedDB 'genel' mağazasına konur, senk.js onu cemre_foto tablosuna
   (aynı x-oda-anahtari başlığıyla, RLS) yollar; karşı telefon eksik kayıtları indirir. Silinenler foto.silinen mezar
   taşıyla iki tarafta da silinir. Bulut yoksa kayıt yalnız bu telefonda kalır.
     kaset:<kim>:<id>    { id, tur:'kaset', kim, t, sure, blob }            (kişi başına en çok 20)
     sonfoto:<kim>:<id>  { id, tur:'sonfoto', kim, t, not, blob }           (kişi başına 1; yenisi eskisini siler) → paylas.js
     tahta:<kim>:<id>    { id, tur:'tahta', kim, t, veri:'data:image/…' }   (toplam en çok 30) → bolum/tahta.js
   MediaRecorder: en çok 30 sn; iOS Safari 'audio/mp4' verir (desteklenir); getUserMedia izinleri sheet kapanınca bırakılır. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const MAGAZA = 'genel';
  const KASET_MAKS = 20, SURE_MAKS = 30, BIT_HIZI = 32000;
  const V = () => CD.varlik;
  const ben = () => CD.kim();
  const karsi = () => (V() ? V().karsi() : null);
  const bulut = () => !!(V() && V().aktif());

  /* ================================================================ ortak medya yolu */
  const medya = {
    async liste(onek) {
      try { return ((await CD.depo.idb.hepsi(MAGAZA)) || []).filter(k => k && typeof k.id === 'string' && k.id.indexOf(onek + ':') === 0).sort((a, b) => (a.t || 0) - (b.t || 0)); }
      catch (e) { return []; }
    },
    async koy(kayit) { await CD.depo.idb.koy(MAGAZA, kayit); if (CD.senk && CD.senk.acik) setTimeout(() => CD.senk.fotolar(true), 300); return kayit; },
    async sil(id) { try { await CD.depo.idb.sil(MAGAZA, id); } catch (e) {} },
    /* karşı bir medya gönderdi: bulut kaydını hemen çek; gelmediyse birkaç kez daha dene */
    cek(id, bitince) {
      if (!(CD.senk && CD.senk.acik)) return;
      let n = 0;
      const dene = async () => {
        n++;
        try { await CD.senk.fotolar(true); } catch (e) {}
        let var_ = false; try { var_ = !!(await CD.depo.idb.al(MAGAZA, id)); } catch (e) {}
        if (var_) { CD.olay.yay('medya:geldi', id); if (bitince) bitince(); return; }
        if (n < 5) setTimeout(dene, 2500 * n);
      };
      setTimeout(dene, 600);
    }
  };
  CD.medya = medya;
  CD.olay.dinle('senk:fotograf', () => CD.olay.yay('medya:geldi', null));

  /* ================================================================ pixel kaset */
  function pixel(satirlar, renk, sinif) {
    const h = satirlar.length, w = satirlar[0].length; let r = '';
    satirlar.forEach((s, y) => { let x = 0; while (x < w) { const c = s[x]; if (c === '.' || !renk[c]) { x++; continue; } let n = 1; while (x + n < w && s[x + n] === c) n++; r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + renk[c] + '"/>'; x += n; } });
    return '<svg class="' + (sinif || '') + '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + r + '</svg>';
  }
  const KASET = [
    'KKKKKKKKKKKKKKKKKKKK', 'KGGGGGGGGGGGGGGGGGGK', 'KGEEEEEEEEEEEEEEEEGK', 'KGEEEEEEEEEEEEEEEEGK', 'KGGGGGGGGGGGGGGGGGGK',
    'KGGKKKKGGGGGGKKKKGGK', 'KGKWWWWKPPPPKWWWWKGK', 'KGKWKKWKPPPPKWKKWKGK', 'KGKWWWWKPPPPKWWWWKGK', 'KGGKKKKGGGGGGKKKKGGK',
    'KGGGGGKKKKKKKKGGGGGK', 'KGGGGKGGGGGGGGKGGGGK', 'KKKKKKKKKKKKKKKKKKKK'];
  CD.kasetSvg = (govde, etiket, sinif) => pixel(KASET, { K: '#3B2A3A', G: govde || '#A995D6', E: etiket || '#FFF9F3', W: '#FFFDF9', P: '#6F5468' }, sinif || 'kaset-svg');
  const RENK = { cemre: ['#FF9DB4', '#FFF1E6'], ahmet: ['#A9D6F2', '#FFF9F3'] };

  /* ================================================================ kayıt */
  function mimeSec() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    // önce AAC/mp4: iki telefonun da (eski iPhone dahil) çalabildiği biçim; tarayıcı yapamıyorsa webm/opus
    const adaylar = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    return adaylar.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || '';
  }
  const destek = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const sureYaz = (s) => '0:' + String(Math.max(0, Math.round(s))).padStart(2, '0');

  let akis = null, kayitci = null, parcalar = [], basT = 0, sayT = 0, durT = 0, onizURL = '';
  function temizle() {
    clearInterval(sayT); clearTimeout(durT); sayT = durT = 0;
    try { if (kayitci && kayitci.state !== 'inactive') kayitci.stop(); } catch (e) {}
    kayitci = null;
    if (akis) { akis.getTracks().forEach(t => { try { t.stop(); } catch (e) {} }); akis = null; }
    if (onizURL) { try { URL.revokeObjectURL(onizURL); } catch (e) {} onizURL = ''; }
  }

  function kaydetSayfasi() {
    if (!ben()) { CD.kimSec(false).then(k => { if (k) kaydetSayfasi(); }); return; }
    temizle();
    let blob = null, sure = 0;
    const kaset = CD.el('div.kaset-buyuk', { 'aria-hidden': 'true', html: CD.kasetSvg(RENK[ben()][0], RENK[ben()][1], 'kaset-svg') });
    const sayac = CD.el('div.kaset-sayac', { role: 'timer', 'aria-live': 'off' }, '0:00 / 0:30');
    const bar = CD.el('div.kaset-bar', [CD.el('span')]);
    const durumY = CD.el('p.sessiz.kaset-durum', { role: 'status' }, destek() ? 'Kaydet\'e bas, 30 saniyeye kadar konuş.' : 'Bu tarayıcı ses kaydını desteklemiyor; Safari ya da Chrome ile dene.');
    const kaydetD = CD.el('button.dugme.tam.kaset-kaydet', { type: 'button', disabled: !destek() }, '⏺ Kaydet');
    const dinleD = CD.el('button.dugme-ikincil', { type: 'button', hidden: true }, '▶ Dinle');
    const gonderD = CD.el('button.dugme', { type: 'button', hidden: true }, bulut() ? '📮 Gönder' : '📼 Rafa koy');
    const silD = CD.el('button.dugme-hayalet', { type: 'button', hidden: true }, 'Yeniden kaydet');
    const ses = CD.el('audio', { preload: 'auto' });
    const sonrasi = CD.el('div.satir.kaset-sonra', [dinleD, gonderD, silD]);

    const bitir = () => {
      clearInterval(sayT); clearTimeout(durT); sayT = durT = 0;
      try { if (kayitci && kayitci.state !== 'inactive') kayitci.stop(); } catch (e) {}
    };
    kaydetD.addEventListener('click', async () => {
      if (kayitci && kayitci.state === 'recording') { bitir(); return; }
      try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (e) { durumY.textContent = 'Mikrofon izni gerekli. Ayarlardan bu siteye mikrofon izni verip tekrar dene.'; return; }
      const mime = mimeSec();
      // konuşma için 32 kbit/sn yeter: 30 sn ≈ 120 KB (ayarsız ~116 kbit/sn idi)
      try { kayitci = new MediaRecorder(akis, mime ? { mimeType: mime, audioBitsPerSecond: BIT_HIZI } : { audioBitsPerSecond: BIT_HIZI }); }
      catch (e) { try { kayitci = new MediaRecorder(akis, { audioBitsPerSecond: BIT_HIZI }); } catch (e1) { kayitci = null; } }
      if (!kayitci) { try { kayitci = new MediaRecorder(akis); } catch (e2) { durumY.textContent = 'Kayıt başlatılamadı; sayfayı yenileyip tekrar dene.'; temizle(); return; } }
      parcalar = [];
      kayitci.ondataavailable = (e) => { if (e.data && e.data.size) parcalar.push(e.data); };
      kayitci.onstop = () => {
        const tur = (kayitci && kayitci.mimeType) || (parcalar[0] && parcalar[0].type) || 'audio/mp4';   // iOS: audio/mp4
        sure = Math.min(SURE_MAKS, (Date.now() - basT) / 1000);
        blob = new Blob(parcalar, { type: tur.split(';')[0] === 'audio/webm' ? 'audio/webm' : tur.split(';')[0] });
        if (akis) { akis.getTracks().forEach(t => { try { t.stop(); } catch (e) {} }); akis = null; }
        kayitci = null;
        kaset.classList.remove('donuyor');
        kaydetD.textContent = '⏺ Kaydet'; kaydetD.hidden = true;
        if (onizURL) URL.revokeObjectURL(onizURL);
        onizURL = URL.createObjectURL(blob); ses.src = onizURL;
        dinleD.hidden = gonderD.hidden = silD.hidden = false;
        durumY.textContent = sure < 1 ? 'Çok kısa oldu; bir daha dener misin?' : sureYaz(sure) + ' kaydedildi. Dinle ya da gönder.';
        if (sure < 1) { gonderD.hidden = true; }
      };
      basT = Date.now(); kayitci.start(250);
      kaset.classList.add('donuyor');
      kaydetD.textContent = '⏹ Bitir';
      durumY.textContent = 'Kaydediyorum… 🎙';
      sayT = setInterval(() => { const s = (Date.now() - basT) / 1000; sayac.textContent = sureYaz(s) + ' / 0:30'; bar.firstChild.style.width = Math.min(100, s / SURE_MAKS * 100) + '%'; }, 200);
      durT = setTimeout(bitir, SURE_MAKS * 1000);
    });
    dinleD.addEventListener('click', () => { try { ses.currentTime = 0; ses.play().catch(() => {}); } catch (e) {} });
    silD.addEventListener('click', () => { blob = null; ses.removeAttribute('src'); dinleD.hidden = gonderD.hidden = silD.hidden = true; kaydetD.hidden = false; sayac.textContent = '0:00 / 0:30'; bar.firstChild.style.width = '0'; durumY.textContent = 'Kaydet\'e bas, 30 saniyeye kadar konuş.'; });
    gonderD.addEventListener('click', async () => {
      if (!blob) return;
      gonderD.disabled = true;
      const k = ben();
      const kayit = { id: 'kaset:' + k + ':' + CD.kimlik(), tur: 'kaset', kim: k, t: Date.now(), sure: Math.round(sure), blob };
      try { await medya.koy(kayit); } catch (e) { CD.toast('Kaset kaydedilemedi; telefonda yer var mı bakar mısın?'); gonderD.disabled = false; return; }
      // kişi başına en çok 20 kaset: en eskiler silinir
      const benim = (await medya.liste('kaset:' + k));
      for (const x of benim.slice(0, Math.max(0, benim.length - KASET_MAKS))) await medya.sil(x.id);
      if (bulut()) V().gonder('kaset', { id: kayit.id, sure: kayit.sure });
      CD.ses.parilti();
      CD.sheetKapat();
      CD.toast(bulut() ? 'Kaset yola çıktı 📼' : 'Bulut kapalı; kaset bu telefonda rafta 📼');
      CD.olay.yay('medya:geldi', kayit.id);
    });

    CD.sheet(CD.el('div.dikey.kaset-kayit', [kaset, sayac, bar, durumY, kaydetD, sonrasi, ses,
      CD.el('button.dugme-hayalet.tam', { type: 'button', onclick: () => { temizle(); arsiv(); } }, '📼 Kaset rafını aç')]),
      { baslik: 'Sesli not', kapaninca: temizle });
  }

  /* ================================================================ arşiv (pixel kaset rafı) */
  let calan = null, calanURL = '';
  function durdur() { if (calan) { try { calan.pause(); } catch (e) {} calan = null; } if (calanURL) { try { URL.revokeObjectURL(calanURL); } catch (e) {} calanURL = ''; } document.querySelectorAll('.kaset-oge.caliyor').forEach(x => x.classList.remove('caliyor')); }
  async function arsiv() {
    durdur(); temizle();
    const liste = (await medya.liste('kaset')).reverse();
    const raf = CD.el('div.kaset-raf', { role: 'list' });
    if (!liste.length) raf.appendChild(CD.el('div.bos-durum', [CD.el('div.buyuk', '📼'), CD.el('p', 'Raf boş. İlk kaseti sen doldur, sesin onda kalsın.')]));
    liste.forEach(k => {
      const kim = k.kim === 'ahmet' ? 'ahmet' : 'cemre';
      const tarih = new Date(k.t || Date.now());
      const etiket = CD.ek.den(CD.kimAdi(kim)) + ' kaset, ' + CD.tarihYaz(tarihIso(tarih)) + ' ' + CD.saatYaz(tarih);
      const oge = CD.el('div.kaset-oge', { role: 'listitem', data: { kim } });
      const cal = CD.el('button.kaset-cal', { type: 'button', 'aria-label': etiket + ', ' + (k.sure || 0) + ' saniye. Çal' }, [
        CD.el('span.kaset-mini', { 'aria-hidden': 'true', html: CD.kasetSvg(RENK[kim][0], RENK[kim][1], 'kaset-svg') }),
        CD.el('span.kaset-etiket', [CD.el('strong', CD.ek.den(CD.kimAdi(kim))), CD.el('span.sessiz', CD.tarihYaz(tarihIso(tarih)) + ' ' + CD.saatYaz(tarih) + ' · ' + sureYaz(k.sure || 0))])
      ]);
      cal.addEventListener('click', () => {
        const caliyordu = oge.classList.contains('caliyor');
        durdur(); if (caliyordu) return;
        if (!(k.blob instanceof Blob)) { CD.toast('Bu kaset henüz inmedi; birazdan tekrar dene'); return; }
        calanURL = URL.createObjectURL(k.blob); calan = new Audio(calanURL);
        calan.onended = durdur;
        calan.play().then(() => oge.classList.add('caliyor')).catch(() => { CD.toast('Çalınamadı; sesi açıp tekrar dene'); durdur(); });
      });
      oge.appendChild(cal);
      if (k.kim === ben()) oge.appendChild(CD.el('button.dugme-ikon.kaset-sil', { type: 'button', 'aria-label': 'Bu kaseti sil', onclick: async () => {
        if (!(await CD.onayla('Bu kaset silinsin mi?', 'Sil', 'Kalsın'))) { arsiv(); return; }
        await medya.sil(k.id); arsiv();
      } }, '✕'));
      raf.appendChild(oge);
    });
    CD.sheet(CD.el('div.dikey', [raf, CD.el('button.dugme.tam', { type: 'button', onclick: () => { durdur(); kaydetSayfasi(); } }, '🎙 Yeni sesli not')]), { baslik: 'Kaset rafı', kapaninca: durdur, odak: false });
  }
  function tarihIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  (CD.postaTurleri = CD.postaTurleri || {}).kaset = {
    kart(o, y) {
      if (o.v && o.v.id) medya.cek(String(o.v.id));
      y.kart({ kim: y.kim, tur: 'kaset', baslik: y.A + ' sana sesli not bıraktı 📼', alt: (o.v && o.v.sure ? sureYaz(o.v.sure) + ' · ' : '') + y.saat, eylem: { ad: 'Dinle', fn: () => arsiv() } });
    },
    ozet(l, A) { return '📼 ' + A + ' ' + (l.length > 1 ? l.length + ' sesli not' : 'sesli not') + ' bıraktı'; }
  };

  CD.kaset = { kaydet: kaydetSayfasi, arsiv, destek, mimeSec, liste: () => medya.liste('kaset') };
  document.addEventListener('visibilitychange', () => { if (document.hidden && kayitci && kayitci.state === 'recording') { try { kayitci.stop(); } catch (e) {} } });
})();
