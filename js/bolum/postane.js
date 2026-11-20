/* js/bolum/postane.js — Postane (V2 Faz 3 · 1)
   Sekmeler: Zarflar ("şu olunca aç") · Zaman kapsülü · Minnet kutusu · QR hediye.
   Veriler (her kişi YALNIZ kendi anahtarına yazar, senk anahtar bazında birleştirir):
     cd.postane.zarf.<kim>    [{ id, baslik, metin, t }]                 yazdığı zarflar (en çok 40)
     cd.postane.acilan.<kim>  [{ id, t }]                                 açtığı zarf/hediye kimlikleri (okuyan yazar)
     cd.postane.kapsul.<kim>  [{ id, tarih, metin, t, baslatan }]        kapsül mektupları (en çok 12)
     cd.postane.minnet.<kim>  [{ id, metin, t }]                          minnet kartları (en çok 300)
     cd.postane.hediye.<kim>  [{ id, tur:'mektup'|'oda', baslik, metin, tema, sus, t }]  QR hediyeleri (en çok 30)
   Gizlilik: karşının zarf içeriği o açana, kapsül mektubu açılış gününe, hediye içeriği QR okutulana kadar DOM'a hiç girmez
   (yalnız başlık/sayı görünür). QR yalnız #/postane/hediye/<id> taşır; içerik senk ile gelir.
   Posta türleri: zarf, zarfAcildi, kapsul, kapsulKilit, minnet, hediyeBulundu. */
(() => {
  'use strict';
  const ID = 'postane';
  const A = () => CD.ani;
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="16" width="48" height="34" rx="6" fill="var(--kagit,#FFFDF9)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3"/><path d="M10 19l22 17 22-17" fill="none" stroke="var(--murekkep-2,#5D5566)" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="38" r="7" fill="var(--seker-kiraz,#FF9DB4)"/></svg>';
  const ZARF_ORNEK = ['Üzgünsen aç', 'Uyuyamazsan aç', 'Beni özlediysen aç', 'Kızgınsan aç', 'Gülmek istersen aç'];
  const TEMALAR = { bulut: 'Pembe bulut', gece: 'Yıldızlı gece', bahar: 'Bahar bahçesi' };
  const SUSLER = ['💗', '🌷', '⭐', '🎀', '🐱', '🐶', '🍓', '🌙', '🦋', '🧸', '💐', '✨'];
  const K = { zarf: 'postane.zarf', acilan: 'postane.acilan', kapsul: 'postane.kapsul', minnet: 'postane.minnet', hediye: 'postane.hediye' };
  let ctx = null, kok = null, govde = null, sekme = 'zarf', cozucu = [], nesil = 0;

  const ad = (k) => CD.kimAdi(k);
  const acilanlar = (kim) => new Set(A().liste(K.acilan, kim).map(x => String(x.id)));
  function acildiIsaretle(id) {
    const l = A().liste(K.acilan, A().ben());
    if (l.some(x => String(x.id) === String(id))) return false;
    l.push({ id: String(id), t: Date.now() }); A().benimYaz(K.acilan, l, 200); return true;
  }
  const zarfSvg = (acik) => A().pixel(acik
    ? ['..KKKKKKKKKKKK..', '.KWWWWWWWWWWWWK.', 'KWKWWWWWWWWWWKWK', 'KWWKWWWWWWWWKWWK', 'KWWWKWWWWWWKWWWK', 'KWWWWKKKKKKWWWWK', 'KWWWWWWWWWWWWWWK', 'KKKKKKKKKKKKKKKK']
    : ['KKKKKKKKKKKKKKKK', 'KKWWWWWWWWWWWWKK', 'KWKWWWWWWWWWWKWK', 'KWWKWWWWWWWWKWWK', 'KWWWKKWRRWKKWWWK', 'KWWWWWKRRKWWWWWK', 'KWWWWWWWWWWWWWWK', 'KKKKKKKKKKKKKKKK'],
  { K: '#6F5468', W: acik ? '#FFF9F3' : '#FFE2EA', R: '#E8557A' }, 'ps-zarf-svg');

  /* ================================================================ ZARFLAR */
  function zarflarCiz(el) {
    const ben = A().ben(), karsi = A().karsi();
    const gelen = karsi ? A().liste(K.zarf, karsi) : [];
    const benimAcilan = acilanlar(ben);
    const onunAcilan = karsi ? acilanlar(karsi) : new Set();
    const yazdiklarim = ben ? A().liste(K.zarf, ben) : [];
    el.append(
      ctx.el('p.sessiz.ps-giris', 'Biri yazar, öbürü o an gelince açar. Açtığında yazana haber gider.'),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => A().kimIste(zarfYaz) }, '✉️ Zarf yaz'),
      ctx.el('h2.ps-baslik', karsi ? CD.ek.den(ad(karsi)) + ' sana' : 'Sana gelen zarflar'));
    if (!gelen.length) el.appendChild(ctx.el('div.bos-durum.ps-bos', [ctx.el('div.buyuk', '📭'), ctx.el('p', A().aktif() ? 'Henüz zarf yok. İlk zarfı sen yazabilirsin.' : (ben ? 'Bulut açık olunca onun zarfları buraya gelir.' : 'Önce "Bu telefon kimin?" seçilmeli.'))]));
    else {
      const raf = ctx.el('div.ps-zarf-raf', { role: 'list' });
      gelen.slice().reverse().forEach(z => {
        const acik = benimAcilan.has(String(z.id));
        raf.appendChild(ctx.el('button.ps-zarf' + (acik ? '.acik' : ''), { type: 'button', role: 'listitem', 'aria-label': A().kirp(z.baslik, 60) + (acik ? '. Açıldı, tekrar oku' : '. Kapalı zarf, açmak için dokun'), onclick: () => zarfAc(z, karsi) }, [
          ctx.el('span.ps-zarf-cizim', { 'aria-hidden': 'true', html: zarfSvg(acik) }),
          ctx.el('span.ps-zarf-ad', A().kirp(z.baslik, 60)),
          acik ? ctx.el('span.sessiz', 'açıldı') : null
        ]));
      });
      el.appendChild(raf);
    }
    if (yazdiklarim.length) {
      el.appendChild(ctx.el('h2.ps-baslik', 'Senin yazdıkların'));
      const l = ctx.el('ul.ps-liste');
      yazdiklarim.slice().reverse().forEach(z => {
        const acik = onunAcilan.has(String(z.id));
        l.appendChild(ctx.el('li.ps-satir', [
          ctx.el('span.ps-satir-ad', A().kirp(z.baslik, 60)),
          ctx.el('span.rozet' + (acik ? '.basari' : '.gri'), acik ? 'açıldı 💌' : 'bekliyor'),
          ctx.el('button.dugme-ikon.ps-sil', { type: 'button', 'aria-label': 'Bu zarfı sil', onclick: async () => { if (await ctx.onayla('Bu zarf silinsin mi?', 'Sil', 'Kalsın')) { A().benimSil(K.zarf, z.id); ciz(); } } }, '✕')
        ]));
      });
      el.appendChild(l);
    }
  }
  function zarfYaz() {
    let baslik = ZARF_ORNEK[0];
    const ozel = ctx.el('input.girdi', { type: 'text', maxlength: '40', placeholder: 'Kendi başlığın: … olunca aç', 'aria-label': 'Özel zarf başlığı', hidden: true });
    const cipler = ctx.el('div.cipler.ps-cipler', { role: 'radiogroup', 'aria-label': 'Zarfın başlığı' });
    const secim = (deger, b) => { baslik = deger; cipler.querySelectorAll('.cip').forEach(x => { const s = x === b; x.setAttribute('aria-checked', s); x.setAttribute('aria-selected', s); }); ozel.hidden = deger !== null; if (deger === null) ozel.focus(); };
    ZARF_ORNEK.concat([null]).forEach((z, i) => {
      const b = ctx.el('button.cip', { type: 'button', role: 'radio', 'aria-checked': i === 0 ? 'true' : 'false', 'aria-selected': i === 0 ? 'true' : 'false' }, z || '✏️ Özel');
      b.addEventListener('click', () => { ctx.ses.tik(); secim(z, b); });
      cipler.appendChild(b);
    });
    const metin = ctx.el('textarea.girdi', { maxlength: '1000', rows: '6', 'aria-label': 'Zarfın içindeki mektup', placeholder: 'O an geldiğinde okuyacağı şey…' });
    const gonder = ctx.el('button.dugme.tam', { type: 'button' }, '💌 Zarfı mühürle');
    gonder.addEventListener('click', () => {
      const b = A().kirp(baslik === null ? ozel.value : baslik, 40), m = A().kirp(metin.value, 1000);
      if (!b) { ctx.toast('Zarfa bir başlık yaz ✏️'); ozel.focus(); return; }
      if (!m) { ctx.toast('Zarfın içi boş kalmasın 💭'); metin.focus(); return; }
      const z = { id: CD.kimlik(), baslik: b, metin: m, t: Date.now() };
      A().benimEkle(K.zarf, z, 40);
      A().posta('zarf', { id: z.id, baslik: b });
      ctx.sheetKapat(); ctx.ses.parilti(); ctx.toast(A().aktif() ? 'Zarf mühürlendi, yola çıktı 💌' : 'Zarf mühürlendi; bulut açılınca ona gider 💌'); ciz();
    });
    ctx.sheet(ctx.el('div.dikey', [cipler, ozel, metin, gonder]), { baslik: 'Zarf yaz', odak: false });
  }
  function zarfAc(z, yazan) {
    const n = nesil;
    const ilk = acildiIsaretle(z.id);
    const kagit = ctx.el('div.ps-mektup', [ctx.el('div.ps-mektup-bas', A().kirp(z.baslik, 60)), ctx.el('p.ps-mektup-metin', A().kirp(z.metin, 1000)), ctx.el('div.ps-mektup-imza', '— ' + ad(yazan))]);
    const zarf = ctx.el('div.ps-acilis' + (ctx.azHareket ? '.hemen' : ''), { 'aria-hidden': 'true', html: zarfSvg(false) });
    ctx.sheet(ctx.el('div.dikey', [zarf, kagit, ctx.el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Kapat')]), { baslik: 'Zarf', odak: false });
    if (ilk) {
      ctx.ses.muhurKirildi ? ctx.ses.muhurKirildi() : ctx.ses.tink();
      A().posta('zarfAcildi', { id: z.id, baslik: A().kirp(z.baslik, 40) });
      A().pul('zarf-acildi', '"' + A().kirp(z.baslik, 40) + '" zarfı açıldı');
      setTimeout(() => { if (n === nesil) ciz(); }, 400);
    }
  }

  /* ================================================================ ZAMAN KAPSÜLÜ */
  function kapsuller() {
    const ben = A().ben(), karsi = A().karsi();
    const b = ben ? A().liste(K.kapsul, ben) : [], o = karsi ? A().liste(K.kapsul, karsi) : [];
    const idler = [...new Set(b.map(x => x.id).concat(o.map(x => x.id)))];
    return idler.map(id => {
      const benim = b.find(x => x.id === id) || null, onun = o.find(x => x.id === id) || null;
      const baslatan = (benim && benim.baslatan) ? benim : ((onun && onun.baslatan) ? onun : (benim || onun));
      const tarih = baslatan && A().tarihGecerli(baslatan.tarih) ? baslatan.tarih : '';
      const kilitli = !!(benim && onun && A().kirp(benim.metin) && A().kirp(onun.metin));
      const kalan = A().gunKaldi(tarih);
      return { id, benim, onun, tarih, kilitli, acik: kilitli && kalan != null && kalan <= 0, kalan, t: Math.min((benim || onun).t || 0, (onun || benim).t || 0), benBaslattim: !!(benim && benim.baslatan) };
    }).sort((x, y) => y.t - x.t);
  }
  function kapsulCiz(el) {
    const karsi = A().karsi();
    el.append(ctx.el('p.sessiz.ps-giris', 'İkiniz de bir mektup yazarsınız; kapsül mühürlenir ve seçilen gün ikisi aynı anda açılır. O güne kadar onun mektubu bu telefonda görünmez.'),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => A().kimIste(() => kapsulYaz(null)) }, '⏳ Yeni zaman kapsülü'));
    const l = kapsuller();
    if (!l.length) { el.appendChild(ctx.el('div.bos-durum.ps-bos', [ctx.el('div.buyuk', '🕰️'), ctx.el('p', 'Henüz kapsül yok. Bir gün seç, geleceğe bir mektup bırakın.')])); return; }
    const kap = ctx.el('div.ps-kapsul-liste');
    l.forEach(k => {
      const A_ = karsi ? ad(karsi) : 'O';
      let durum, eylem = null;
      if (k.acik) { durum = 'Açıldı! İki mektup da hazır 💌'; eylem = ctx.el('button.dugme', { type: 'button', onclick: () => kapsulAc(k) }, 'Kapsülü aç'); }
      else if (k.kilitli) durum = 'Mühürlü 🔒 · ' + (k.kalan === 1 ? 'yarın açılıyor' : k.kalan + ' gün sonra açılıyor');
      else if (k.benim && !k.onun) { durum = A_ + ' henüz yazmadı. Sen yazdın ✓'; eylem = ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => kapsulYaz(k) }, 'Mektubumu düzenle'); }
      else { durum = A_ + ' yazdı; senin mektubun bekleniyor'; eylem = ctx.el('button.dugme', { type: 'button', onclick: () => A().kimIste(() => kapsulYaz(k)) }, 'Mektubumu yaz'); }
      kap.appendChild(ctx.el('div.yama.ps-kapsul' + (k.kilitli ? '.kilitli' : '') + (k.acik ? '.acik' : ''), [
        ctx.el('div.ps-kapsul-cizim', { 'aria-hidden': 'true', html: A().pixel(['...KKKKKK...', '..KGGGGGGK..', '.KGGWWWWGGK.', '.KGWWKKWWGK.', '.KGWWKWWWGK.', '.KGGWWWWGGK.', '..KGGGGGGK..', '...KKKKKK...', '....KKKK....', '...KKKKKK...'], { K: '#6F5468', G: k.kilitli ? '#F5B54A' : '#CDBDF6', W: '#FFF9F3' }, 'ps-kapsul-svg') }),
        ctx.el('div.ps-kapsul-metin', [ctx.el('strong', k.tarih ? 'Açılış: ' + A().tarihUzun(k.tarih) : 'Tarih seçilmedi'), ctx.el('span.sessiz', durum)]),
        eylem
      ]));
    });
    el.appendChild(kap);
  }
  function kapsulYaz(k) {
    const ben = A().ben(); if (!ben) return;
    const benim = k && k.benim, baslatan = !k || (k.benim && k.benim.baslatan);
    if (k && k.kilitli) { ctx.toast('Kapsül mühürlendi; açılış gününü bekle 🔒'); return; }
    const tarih = ctx.el('input.girdi', { type: 'date', min: A().yarin(), 'aria-label': 'Kapsülün açılacağı gün', value: k ? k.tarih : '' });
    if (!baslatan) tarih.disabled = true;
    const metin = ctx.el('textarea.girdi', { maxlength: '2000', rows: '7', 'aria-label': 'Kapsül mektubun', placeholder: 'O gün okuyacağımız mektup…' });
    metin.value = benim ? benim.metin : '';
    const kaydet = ctx.el('button.dugme.tam', { type: 'button' }, k && !baslatan ? '🔒 Yaz ve kapsülü mühürle' : '⏳ Kapsüle koy');
    kaydet.addEventListener('click', () => {
      const t = baslatan ? tarih.value : k.tarih, m = A().kirp(metin.value, 2000);
      if (!A().tarihGecerli(t) || A().gunKaldi(t) < 1) { ctx.toast('Yarından sonraki bir gün seç 📅'); tarih.focus(); return; }
      if (!m) { ctx.toast('Mektup boş kalmasın 💭'); metin.focus(); return; }
      const id = k ? k.id : CD.kimlik();
      const kayit = { id, tarih: t, metin: m, t: benim ? benim.t : Date.now(), baslatan: !!baslatan };
      const l = A().liste(K.kapsul, ben).filter(x => x.id !== id).concat([kayit]);
      A().benimYaz(K.kapsul, l, 12);
      const kilitlendi = !!(k && k.onun && A().kirp(k.onun.metin));
      if (kilitlendi) {
        A().posta('kapsulKilit', { id, tarih: t });
        A().pul('kapsul', 'Zaman kapsülü mühürlendi · açılış ' + A().tarihUzun(t));
        ctx.toast('Kapsül mühürlendi 🔒 ' + A().tarihUzun(t) + ' günü ikisi birden açılacak', 3600);
      } else if (!benim) { A().posta('kapsul', { id, tarih: t }); ctx.toast(A().aktif() ? 'Mektubun kapsülde; onun mektubu bekleniyor ⏳' : 'Mektubun kapsülde ⏳'); }
      else ctx.toast('Mektubun güncellendi ⏳');
      ctx.sheetKapat(); ctx.ses.parilti(); ciz();
    });
    const govde_ = [baslatan ? ctx.el('label.ps-etiket', ['Açılış günü', tarih]) : ctx.el('p', 'Açılış: ' + A().tarihUzun(k.tarih)), metin, kaydet];
    if (benim) govde_.push(ctx.el('button.dugme-hayalet.tam', { type: 'button', onclick: async () => {
      if (!(await ctx.onayla(baslatan ? 'Kapsül iptal edilsin mi? Mektubun silinir.' : 'Mektubun kapsülden çıkarılsın mı?', 'Evet', 'Kalsın'))) return;
      A().benimSil(K.kapsul, k.id); ciz();
    } }, baslatan ? 'Kapsülü iptal et' : 'Mektubumu çıkar'));
    ctx.sheet(ctx.el('div.dikey', govde_), { baslik: k ? 'Kapsül mektubun' : 'Yeni zaman kapsülü', odak: false });
  }
  function kapsulAc(k) {
    if (!k.acik) return;
    // yalnız açılış günü geldiyse ve ikisi de yazdıysa iki mektup da DOM'a girer
    const kisi = (kim, kayit) => ctx.el('div.ps-mektup', [ctx.el('div.ps-mektup-bas', CD.ek.den(ad(kim)) + ' mektup'), ctx.el('p.ps-mektup-metin', A().kirp(kayit.metin, 2000)), ctx.el('div.ps-mektup-imza', A().tarihUzun(A().isoYap(new Date(kayit.t || Date.now()))) + ' günü yazıldı')]);
    ctx.sheet(ctx.el('div.dikey', [kisi(A().karsi(), k.onun), kisi(A().ben(), k.benim), ctx.el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Kapat')]), { baslik: 'Zaman kapsülü · ' + A().tarihUzun(k.tarih), odak: false });
    if (!ctx.azHareket) ctx.efekt.konfeti(undefined, undefined, 16);
    ctx.ses.isilti && ctx.ses.isilti();
  }

  /* ================================================================ MİNNET KUTUSU */
  function minnetCiz(el) {
    const l = A().ikisi(K.minnet).sort((a, b) => b.t - a.t);
    el.append(ctx.el('p.sessiz.ps-giris', 'Küçük teşekkürler bir kutuda birikir. Yazdığın kart ona posta olarak gider.'),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => A().kimIste(minnetYaz) }, '💐 Minnet kartı yaz'),
      ctx.el('p.ps-kutu-sayi', l.length ? 'Kutuda ' + l.length + ' kart birikti' : ''));
    if (!l.length) { el.appendChild(ctx.el('div.bos-durum.ps-bos', [ctx.el('div.buyuk', '🎁'), ctx.el('p', 'Kutu boş. "Bugün sana minnettarım çünkü…" diye başla.')])); return; }
    const kutu = ctx.el('div.ps-minnet-kutu', { role: 'list' });
    l.forEach(m => kutu.appendChild(ctx.el('div.ps-minnet', { role: 'listitem', data: { kim: m.kim } }, [
      ctx.el('div.ps-minnet-ust', [A().kisiIkon(m.kim, 18), ctx.el('span.sessiz', CD.tarihYaz(A().isoYap(new Date(m.t || Date.now())))),
        m.kim === A().ben() ? ctx.el('button.dugme-ikon.ps-sil', { type: 'button', 'aria-label': 'Bu kartı sil', onclick: async () => { if (await ctx.onayla('Bu minnet kartı silinsin mi?', 'Sil', 'Kalsın')) { A().benimSil(K.minnet, m.id); ciz(); } } }, '✕') : null]),
      ctx.el('p.ps-minnet-metin', [ctx.el('span.ps-minnet-on', 'Bugün sana minnettarım çünkü '), A().kirp(m.metin, 200)])
    ])));
    el.appendChild(kutu);
  }
  function minnetYaz() {
    const metin = ctx.el('textarea.girdi', { maxlength: '200', rows: '3', 'aria-label': 'Minnet nedenin', placeholder: '…bugün beni güldürdün.' });
    const gonder = ctx.el('button.dugme.tam', { type: 'button' }, '💐 Kutuya at');
    gonder.addEventListener('click', () => {
      const m = A().kirp(metin.value, 200); if (!m) { ctx.toast('Bir neden yaz 💭'); metin.focus(); return; }
      const k = { id: CD.kimlik(), metin: m, t: Date.now() };
      A().benimEkle(K.minnet, k, 300);
      A().posta('minnet', { id: k.id, metin: m.slice(0, 90) });
      A().pul('minnet', m.slice(0, 80));
      ctx.sheetKapat(); ctx.ses.parilti(); ctx.toast('Kart kutuya atıldı 💐'); ciz();
    });
    ctx.sheet(ctx.el('div.dikey', [ctx.el('p.kalin', 'Bugün sana minnettarım çünkü…'), metin, gonder]), { baslik: 'Minnet kartı' });
  }

  /* ================================================================ QR HEDİYE */
  function siteAdresi() {
    const c = (CD.config && CD.config.SITE_ADRESI) || '';
    if (/^https:\/\//.test(c)) return c.replace(/#.*$/, '');
    if (/^https?:$/.test(location.protocol)) return location.origin + location.pathname.replace(/index\.html$/, '');
    return '';
  }
  const hediyeLink = (id) => siteAdresi() + '#/postane/hediye/' + encodeURIComponent(id);
  function hediyeCiz(el) {
    const ben = A().ben(), karsi = A().karsi();
    const benim = ben ? A().liste(K.hediye, ben) : [];
    const onun = karsi ? A().liste(K.hediye, karsi) : [];
    const buldugum = acilanlar(ben), buldugu = karsi ? acilanlar(karsi) : new Set();
    const bulunan = onun.filter(h => buldugum.has(String(h.id))), saklanan = onun.length - bulunan.length;
    el.append(ctx.el('p.sessiz.ps-giris', 'Bir mektup ya da sürpriz oda hazırla; site bir QR kod üretir. Yazdırıp gerçek bir yere sakla. Okutulunca hediye açılır.'),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => A().kimIste(hediyeHazirla) }, '🎁 Hediye hazırla'));
    if (karsi) {
      el.appendChild(ctx.el('h2.ps-baslik', 'Sana saklananlar'));
      if (saklanan) el.appendChild(ctx.el('div.yama.ps-ipucu-kart', [ctx.el('span.buyuk', { 'aria-hidden': 'true' }, '🔍'), ctx.el('p', saklanan === 1 ? 'Bir yerde senin için saklı bir hediye var. QR kodu bulunca telefonla okut.' : saklanan + ' saklı hediye seni bekliyor. QR kodları bulunca okut.')]));
      if (bulunan.length) {
        const l = ctx.el('ul.ps-liste');
        bulunan.slice().reverse().forEach(h => l.appendChild(ctx.el('li.ps-satir', [ctx.el('span.ps-satir-ad', A().kirp(h.baslik, 60)), ctx.el('a.dugme-ikincil.kucuk', { href: '#/postane/hediye/' + encodeURIComponent(h.id) }, 'Aç')])));
        el.appendChild(l);
      }
      if (!saklanan && !bulunan.length) el.appendChild(ctx.el('p.sessiz', 'Şimdilik saklı hediye yok.'));
    }
    if (benim.length) {
      el.appendChild(ctx.el('h2.ps-baslik', 'Hazırladıkların'));
      const l = ctx.el('ul.ps-liste');
      benim.slice().reverse().forEach(h => l.appendChild(ctx.el('li.ps-satir', [
        ctx.el('span.ps-satir-ad', (h.tur === 'oda' ? '🏠 ' : '✉️ ') + A().kirp(h.baslik, 60)),
        ctx.el('span.rozet' + (buldugu.has(String(h.id)) ? '.basari' : '.gri'), buldugu.has(String(h.id)) ? 'bulundu 🎉' : 'saklı'),
        ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => qrGoster(h) }, 'QR'),
        ctx.el('button.dugme-ikon.ps-sil', { type: 'button', 'aria-label': 'Bu hediyeyi sil', onclick: async () => { if (await ctx.onayla('Bu hediye silinsin mi? QR kod da çalışmaz olur.', 'Sil', 'Kalsın')) { A().benimSil(K.hediye, h.id); ciz(); } } }, '✕')
      ])));
      el.appendChild(l);
    }
  }
  function hediyeHazirla() {
    let tur = 'mektup', tema = 'bulut'; const sus = new Set(['💗', '🌷']);
    const turSec = ctx.el('div.cipler', { role: 'radiogroup', 'aria-label': 'Hediye türü' });
    const temaKap = ctx.el('div.dikey', { hidden: true });
    [['mektup', '✉️ Mektup'], ['oda', '🏠 Sürpriz oda']].forEach(([k, a]) => {
      const b = ctx.el('button.cip', { type: 'button', role: 'radio', 'aria-checked': k === tur ? 'true' : 'false', 'aria-selected': k === tur ? 'true' : 'false' }, a);
      b.addEventListener('click', () => { tur = k; ctx.ses.tik(); turSec.querySelectorAll('.cip').forEach(x => { const s = x === b; x.setAttribute('aria-checked', s); x.setAttribute('aria-selected', s); }); temaKap.hidden = k !== 'oda'; });
      turSec.appendChild(b);
    });
    const temaSec = ctx.el('div.cipler', { role: 'radiogroup', 'aria-label': 'Odanın teması' });
    Object.entries(TEMALAR).forEach(([k, a]) => {
      const b = ctx.el('button.cip', { type: 'button', role: 'radio', 'aria-checked': k === tema ? 'true' : 'false', 'aria-selected': k === tema ? 'true' : 'false' }, a);
      b.addEventListener('click', () => { tema = k; ctx.ses.tik(); temaSec.querySelectorAll('.cip').forEach(x => { const s = x === b; x.setAttribute('aria-checked', s); x.setAttribute('aria-selected', s); }); });
      temaSec.appendChild(b);
    });
    const susSec = ctx.el('div.ps-sus-sec', { role: 'group', 'aria-label': 'Odaya süs (en çok 5)' }, SUSLER.map(s => {
      const b = ctx.el('button.ps-sus', { type: 'button', 'aria-pressed': sus.has(s) ? 'true' : 'false', 'aria-label': 'Süs ' + s }, s);
      b.addEventListener('click', () => { if (sus.has(s)) sus.delete(s); else if (sus.size < 5) sus.add(s); else { ctx.toast('En çok 5 süs 🎀'); return; } b.setAttribute('aria-pressed', sus.has(s) ? 'true' : 'false'); ctx.ses.pit(); });
      return b;
    }));
    temaKap.append(ctx.el('span.ps-etiket', 'Tema'), temaSec, ctx.el('span.ps-etiket', 'Süsler (en çok 5)'), susSec);
    const baslik = ctx.el('input.girdi', { type: 'text', maxlength: '50', placeholder: 'Başlık (ör. Mutfak dolabına bak)', 'aria-label': 'Hediyenin başlığı' });
    const metin = ctx.el('textarea.girdi', { maxlength: '1500', rows: '6', 'aria-label': 'Hediyenin içindeki yazı', placeholder: 'Bulduğunda okuyacağı şey…' });
    const kaydet = ctx.el('button.dugme.tam', { type: 'button' }, '🎁 Hazırla ve QR üret');
    kaydet.addEventListener('click', () => {
      const b = A().kirp(baslik.value, 50), m = A().kirp(metin.value, 1500);
      if (!b) { ctx.toast('Bir başlık yaz ✏️'); baslik.focus(); return; }
      if (!m) { ctx.toast('İçine bir şey yaz 💭'); metin.focus(); return; }
      const h = { id: CD.kimlik(), tur, baslik: b, metin: m, t: Date.now() };
      if (tur === 'oda') { h.tema = tema; h.sus = [...sus]; }
      A().benimEkle(K.hediye, h, 30);
      ctx.ses.parilti(); ciz(); qrGoster(h);
    });
    ctx.sheet(ctx.el('div.dikey', [turSec, baslik, metin, temaKap, kaydet]), { baslik: 'Hediye hazırla', odak: false });
  }
  function qrGoster(h) {
    const link = hediyeLink(h.id);
    const govde_ = [];
    if (!siteAdresi()) {
      govde_.push(ctx.el('p.ps-uyari', 'Site şu an dosyadan açık; QR kodun çalışması için siteyi internetteki adresinden aç ve QR\'ı orada üret (ya da ayarlara SITE_ADRESI yaz).'));
    } else {
      let svg = '';
      try { svg = CD.qr.svg(link, { etiket: 'Hediye QR kodu: ' + A().kirp(h.baslik, 40).replace(/["<>&]/g, '') }); } catch (e) { svg = ''; }
      govde_.push(ctx.el('div.ps-qr', { html: svg }),
        ctx.el('p.sessiz.ps-qr-link', link),
        ctx.el('p.sessiz', 'Link yalnız hediyenin numarasını taşır; içerik sitenin kapısından geçince açılır.'),
        ctx.el('div.izgara-2', [
          ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => qrIndir(link, h) }, '💾 QR\'ı kaydet'),
          ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => qrYazdir(link, h) }, '🖨️ Yazdır')
        ]));
    }
    govde_.push(ctx.el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Tamam'));
    ctx.sheet(ctx.el('div.dikey', govde_), { baslik: '🎁 ' + A().kirp(h.baslik, 40), odak: false });
  }
  function qrIndir(link) {
    try {
      const a = document.createElement('a'); a.href = CD.qr.png(link, 900); a.download = 'hediye-qr.png';
      document.body.appendChild(a); a.click(); a.remove(); ctx.toast('QR kaydedildi 💾');
    } catch (e) { ctx.toast('Kaydedilemedi; ekran görüntüsü alabilirsin 📸'); }
  }
  function qrYazdir(link) {
    // yalnız QR'ı basan geçici bir kat; yazdırma bitince silinir
    const kat = CD.el('div.ps-yazdir-kat', { html: CD.qr.svg(link, { etiket: 'Hediye QR kodu' }) });
    document.body.appendChild(kat); document.body.classList.add('ps-yazdiriliyor');
    const bitir = () => { document.body.classList.remove('ps-yazdiriliyor'); kat.remove(); window.removeEventListener('afterprint', bitir); };
    window.addEventListener('afterprint', bitir);
    setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(bitir, 1500); }, 60);
  }

  /* ---------------------------------------------------------------- QR okutulunca: #/postane/hediye/<id> */
  let bekleT = 0;
  function hediyeSahnesi(id) {
    clearTimeout(bekleT);
    govde.innerHTML = '';
    if (!/^[a-z0-9]{4,32}$/i.test(id)) { govde.appendChild(ctx.el('div.bos-durum', [ctx.el('div.buyuk', '🤔'), ctx.el('p', 'Bu QR kod bir hediyeye benzemiyor.'), ctx.el('a.dugme', { href: '#/postane' }, 'Postaneye git')])); return; }
    if (!A().ben()) { govde.appendChild(ctx.el('div.bos-durum', [ctx.el('div.buyuk', '🎁'), ctx.el('p', 'Hediyeyi açmak için önce bu telefonun kimin olduğunu seç.'), ctx.el('button.dugme', { type: 'button', onclick: () => CD.kimSec(false).then(k => { if (k && ctx) hediyeSahnesi(id); }) }, 'Seç')])); return; }
    let h = null, yazan = null;
    A().KISILER.forEach(k => { const x = A().liste(K.hediye, k).find(y => String(y.id) === id); if (x && !h) { h = x; yazan = k; } });
    if (!h) {
      const yolda = A().aktif();
      govde.appendChild(ctx.el('div.bos-durum.ps-bekle', [ctx.el('div.buyuk', '📦'), ctx.el('p', { role: 'status' }, yolda ? 'Hediye yolda, birkaç saniye…' : 'Bu hediye bu telefonda yok. Bulut açık olunca gelir.'), ctx.el('a.dugme-ikincil', { href: '#/postane' }, 'Postaneye git')]));
      if (yolda) { try { CD.senk.simdi(); } catch (e) {} const n = nesil; bekleT = setTimeout(() => { if (n === nesil && ctx) hediyeSahnesi(id); }, 4000); }
      return;
    }
    const kendi = yazan === A().ben();
    if (!kendi && acildiIsaretle(h.id)) {
      A().posta('hediyeBulundu', { id: h.id, baslik: A().kirp(h.baslik, 40) });
      A().pul('zarf-acildi', 'QR hediye bulundu: ' + A().kirp(h.baslik, 40));
      if (!ctx.azHareket) setTimeout(() => ctx && ctx.efekt.konfeti(undefined, undefined, 18), 300);
      ctx.ses.isilti && ctx.ses.isilti();
    }
    const tema = h.tur === 'oda' && TEMALAR[h.tema] ? h.tema : '';
    const sus = (Array.isArray(h.sus) ? h.sus : []).filter(s => SUSLER.indexOf(s) >= 0).slice(0, 5);
    const sahne = ctx.el('div.ps-hediye-sahne' + (tema ? '.tema-' + tema : '.mektup'), [
      sus.length ? ctx.el('div.ps-hediye-susler', { 'aria-hidden': 'true' }, sus.map((s, i) => { const x = ctx.el('span', s); x.style.setProperty('--i', i); return x; })) : null,
      ctx.el('div.ps-mektup.ps-hediye-kagit', [
        ctx.el('div.ps-mektup-bas', A().kirp(h.baslik, 50)),
        ctx.el('p.ps-mektup-metin', A().kirp(h.metin, 1500)),
        ctx.el('div.ps-mektup-imza', '— ' + ad(yazan))
      ])
    ]);
    ctx.baslik(kendi ? 'Hediyen (önizleme)' : CD.ek.den(ad(yazan)) + ' hediye');
    govde.append(...[kendi ? ctx.el('p.sessiz.ps-giris', 'Bu senin hazırladığın hediye; o okutunca böyle görecek.') : null, sahne, ctx.el('a.dugme-ikincil.tam', { href: '#/postane' }, 'Postaneye dön')].filter(Boolean));
  }

  /* ================================================================ çizim / bölüm */
  const SEKMELER = [['zarf', '💌 Zarflar'], ['kapsul', '⏳ Kapsül'], ['minnet', '💐 Minnet'], ['hediye', '🎁 Hediye']];
  function ciz() {
    if (!ctx || !govde) return;
    const yol = A().altYol();
    if (yol[0] === 'hediye' && yol[1]) { hediyeSahnesi(String(yol[1])); return; }
    // yazı yazılırken (sheet açık) liste yine güncellenebilir: formlar sheet içinde
    govde.innerHTML = '';
    const ic = ctx.el('div.ps-sekme-ic', { role: 'tabpanel', 'aria-labelledby': 'ao-sekme-postane-' + sekme });
    ({ zarf: zarflarCiz, kapsul: kapsulCiz, minnet: minnetCiz, hediye: hediyeCiz })[sekme](ic);
    govde.appendChild(ic);
  }

  /* ---------------------------------------------------------------- posta kartları */
  const T = (CD.postaTurleri = CD.postaTurleri || {});
  const git = (s) => () => { CD.depo.yaz('cihaz.postane.sekme', s); CD.ac(ID); };
  T.zarf = { kart(o, y) { y.kart({ kim: y.kim, tur: 'zarf', baslik: y.A + ' sana bir zarf bıraktı 💌', alt: '"' + A().kirp(o.v && o.v.baslik, 40) + '" · ' + y.saat, eylem: { ad: 'Postane', fn: git('zarf') } }); if (CD.aktifBolum && CD.aktifBolum() === ID) ciz(); },
    ozet(l, A_) { return '💌 ' + A_ + ' ' + (l.length > 1 ? l.length + ' zarf' : 'bir zarf') + ' bıraktı'; } };
  T.zarfAcildi = { kart(o, y) { y.kart({ kim: y.kim, tur: 'zarfAcildi', baslik: 'Zarf açıldı 💌', alt: y.A + ' "' + A().kirp(o.v && o.v.baslik, 40) + '" zarfını açtı · ' + y.saat, muhurKir: !CD.azHareket }); if (CD.aktifBolum && CD.aktifBolum() === ID) ciz(); },
    ozet(l, A_) { return '💌 ' + A_ + ' zarfını açtı'; } };
  T.kapsul = { kart(o, y) { y.kart({ kim: y.kim, tur: 'kapsul', baslik: y.A + ' bir zaman kapsülü başlattı ⏳', alt: 'Açılış: ' + A().tarihUzun(o.v && o.v.tarih) + ' · senin mektubun bekleniyor', eylem: { ad: 'Yaz', fn: git('kapsul') } }); },
    ozet(l, A_) { return '⏳ ' + A_ + ' bir zaman kapsülü başlattı'; } };
  T.kapsulKilit = { kart(o, y) { y.kart({ kim: y.kim, tur: 'kapsulKilit', baslik: 'Kapsül mühürlendi 🔒', alt: y.A + ' de yazdı · ' + A().tarihUzun(o.v && o.v.tarih) + ' günü açılacak' }); },
    ozet() { return '🔒 Zaman kapsülü mühürlendi'; } };
  T.minnet = { kart(o, y) { y.kart({ kim: y.kim, tur: 'minnet', baslik: y.A + ' sana minnettar 💐', alt: A().kirp(o.v && o.v.metin, 90), eylem: { ad: 'Kutuya bak', fn: git('minnet') } }); },
    ozet(l, A_) { return '💐 ' + A_ + ' ' + (l.length > 1 ? l.length + ' minnet kartı' : 'bir minnet kartı') + ' yazdı'; } };
  T.hediyeBulundu = { kart(o, y) { y.kart({ kim: y.kim, tur: 'hediyeBulundu', baslik: y.A + ' hediyeni buldu 🎁', alt: '"' + A().kirp(o.v && o.v.baslik, 40) + '" · ' + y.saat }); if (!CD.azHareket) CD.efekt.konfeti(undefined, undefined, 12); },
    ozet(l, A_) { return '🎁 ' + A_ + ' saklı hediyeni buldu'; } };

  // mahalle ipucu: okunmamış zarf / bugün açılan kapsül
  CD.mhIpucu[ID] = () => {
    if (!A() || !A().aktif()) return '';
    const k = A().karsi();
    const ac = acilanlar(A().ben());
    if (kapsuller().some(x => x.acik && x.kalan === 0)) return 'Kapsül bugün açılıyor ⏳';
    const z = A().liste(K.zarf, k).filter(x => !ac.has(String(x.id))).length;
    return z ? (z === 1 ? 'Sana bir zarf var 💌' : z + ' zarf seni bekliyor 💌') : '';
  };

  CD.kaydet({
    id: ID, baslik: 'Postane', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el; nesil++;
      sekme = A().sekmeOku(ID, SEKMELER.map(s => s[0]), 'zarf');
      govde = ctx.el('div.ps-govde');
      const yol = A().altYol();
      const ust = yol[0] === 'hediye' ? null : A().sekmeler(ID, SEKMELER, sekme, (s) => { sekme = s; ciz(); });
      el.appendChild(ctx.el('div.icerik.ps-icerik', [ust, govde]));
      ciz();
      const yen = () => { if (!ctx) return; if (document.querySelector('.ps-govde input:focus, .ps-govde textarea:focus')) return; ciz(); };
      cozucu = [CD.olay.dinle('senk:yenilendi', yen), CD.olay.dinle('kim', yen)];
    },
    unmount() { nesil++; clearTimeout(bekleT); cozucu.forEach(f => { try { f(); } catch (e) {} }); cozucu = []; ctx = null; kok = null; govde = null; }
  });
})();
