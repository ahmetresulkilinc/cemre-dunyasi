/* js/bolum/panda.js — Obur Panda
   Yiyeceği tut, ağzına götür (ya da dokun, kendi uçar) → çiğner → karnı şişer (ince → tombul → yuvarlak → balon)
   → doyunca sarılır ("Cemre'yi çok seviyorum") → uyur, sindirir, sıfırlanır. İlerleme cd.panda.durum'da. */
(() => {
  'use strict';
  const ID = 'panda';
  const DOYMA = 100, SEVGI_SURE = 4200, UYKU_SURE = 12000, BOS_DURUS = 26000;
  const SIYAH = '#2B2733';

  /* ------------------------------------------------------------ içerik */
  const YEMEKLER = [
    { id: 'bambu', ad: 'Bambu', emoji: '🎋', deger: 8, soz: ['Bambu! Ruhumun gıdası.', 'Çıtır çıtır… Cemre, bir tane daha?', 'Bambu yemeden panda olunmaz.'] },
    { id: 'manti', ad: 'Mantı', emoji: '🥟', deger: 14, soz: ['Mantı! Yoğurtlu olsun, sarımsağı bol olsun.', 'Cemre bu mantıyı sen mi yaptın? Dükkândan da olsa yerim.', 'Bir tabak daha yer miyim? Ne saçma soru.'] },
    { id: 'pasta', ad: 'Pasta', emoji: '🍰', deger: 14, soz: ['Kremayı kaşıkla yemek kanunen serbest.', 'Doğum günüm mü? Değil ama yerim.', 'Bu pastanın hakkını verdim bence.'] },
    { id: 'boba', ad: 'Boba', emoji: '🧋', deger: 10, soz: ['Topları çiğnemek en sevdiğim spor.', 'Pipeti geniş olsun, ben acele ederim.', 'Tapioka topları karnımda zıplıyor.'] },
    { id: 'cilek', ad: 'Çilek', emoji: '🍓', deger: 6, soz: ['Çilek! Minik ama içten.', 'Kırmızı, tatlı… senin gibi Cemre.', 'On tane daha versen hayır demem.'] },
    { id: 'susi', ad: 'Suşi', emoji: '🍣', deger: 11, soz: ['Suşi! Wasabi yok değil mi? …Neyse, yedim bile.', 'Balık mı yedim? Sınırlarımı aşıyorum.', 'Soya sosu az olsun, ben doğal tatlıyım.'] },
    { id: 'mochi', ad: 'Mochi', emoji: '🍡', deger: 9, soz: ['Mochi… yumuşacık, tıpkı karnım gibi.', 'Bu çiğnenir mi yutulur mu? İkisini de yaptım.', 'Mochinin çıtırı yok ama sevgisi var.'] },
    { id: 'dondurma', ad: 'Dondurma', emoji: '🍦', deger: 10, soz: ['Beynim dondu ama değdi.', 'Külahını da yedim, çöp üretmem.', 'Erimeden yetiştim, gurur duyabilirsin.'] },
    { id: 'ramen', ad: 'Ramen', emoji: '🍜', deger: 16, soz: ['Ramen! Çorbasına kadar bitti.', 'Şap şup sesim için özür dilemiyorum.', 'Yumurtası yarım pişmişti, tam bana göre.'] },
    { id: 'donut', ad: 'Donut', emoji: '🍩', deger: 12, soz: ['Donutun deliğini kim yedi? Ben.', 'Şeker taneleri burnumda kaldı.', 'Bir donut daha olsa devriliyorum.'] },
    { id: 'karpuz', ad: 'Karpuz', emoji: '🍉', deger: 9, soz: ['Karpuz! Çekirdeklerini tükürmedim, hepsi içimde.', 'Karnımda yaz geldi.', 'Bu seçilmiş bir karpuz, belli.'] },
    { id: 'cikolata', ad: 'Çikolata', emoji: '🍫', deger: 11, soz: ['Çikolata bir yemek değil, bir duygu.', 'Pandalara çikolata verilir mi? Verildi bile.', 'Kakao oranı ne? Umurumda değil.'] }
  ];
  const ASAMALAR = [
    { id: 'ince', ad: 'İncecik', esik: 0 },
    { id: 'tombul', ad: 'Tombul', esik: 25 },
    { id: 'yuvarlak', ad: 'Yuvarlak', esik: 50 },
    { id: 'balon', ad: 'Balon', esik: 78 }
  ];
  const SOZ = {
    asama: {
      tombul: ['Karnım biraz büyüdü galiba?', 'Tombul mu oldum? Aşkla besleniyorum sadece.'],
      yuvarlak: ['Artık yuvarlanabilirim, itersen giderim.', 'Cemre bak, karnım masa oldu.'],
      balon: ['BALON OLDUM! Beni uçurma sakın.', 'Bir lokma daha ve patlarım… şaka, patlamam. Belki.']
    },
    dokun: ['Gıdıklama! Hihi.', 'Ne var? Yemek mi getirdin?', 'Cemre! Selam!', 'Dokundun, mutlu oldum.', 'Bir bambu versen hiç fena olmaz.', 'Burnuma dokunma, hapşırırım.'],
    karin: ['Gurr… guruldadı ama yerim yine.', 'Karnım davul gibi, çal bakalım.', 'Dikkat, balon patlamasın.', 'Karnımı okşama, utanıyorum.'],
    sev: ['Ben de seni, Cemre.', 'Yemekten sonra sarılmak en güzeli.', 'Panda kucağı en yumuşak kucaktır.', 'Kalbim de karnım gibi doldu.'],
    uyku: ['zZz… rüyamda mantı var', 'hırr… pşşş… sindiriyorum', 'zZz… beş dakika daha', 'hmm… mochi… zZz'],
    uykudaDokun: ['…zZz… (uykuda gülümsedi)', 'şşş… sindirim saati', 'zZz… Cemre… zZz'],
    bos: ['Cemre? Acıktım.', 'Bir bambu?', 'Tepsideki mantı bana bakıyor.', 'Karnım çok sessiz, duyuyor musun?'],
    kacti: ['Buraya değil, ağzıma!', 'Ağzım şurada, kaçırdın.', 'Havada kaldı, yakalayamadım.'],
    uyan: ['Sindirdim! Tertemiz karın, yeni tur? 🎋', 'Günaydın… yine açım.', 'Uyudum, sindirdim, hazırım. Ver!'],
    hik: ['…hık! Pardon, balon konuştu.', 'Hık! Şey… ben değildim.', 'Hıkk… karnımdan ses geldi, ayıp oldu.'],
    selam: ['Cemre! Geldin! Karnım seni bekliyordu.', 'Selam. Tepsiye bakıyordum, sen geldin.', 'Hoş geldin! Bugün ne yiyoruz?'],
    ozledim: ['Sen yokken hepsini sindirdim, yine açım.', 'Uzun zaman oldu… karnım guruldadı.']
  };
  const ROZETLER = [
    { id: 'ilk', ad: 'İlk lokma', emoji: '🍡', sart: 'İlk yiyeceği ver', kontrol: d => d.toplam >= 1 },
    { id: 'on', ad: 'Tatlı tombiş', emoji: '🐼', sart: '10 lokma', kontrol: d => d.toplam >= 10 },
    { id: 'elli', ad: 'Obur', emoji: '🍜', sart: '50 lokma', kontrol: d => d.toplam >= 50 },
    { id: 'yuz', ad: 'Efsane obur', emoji: '👑', sart: '100 lokma', kontrol: d => d.toplam >= 100 },
    { id: 'doydu', ad: 'Mutlu son', emoji: '💛', sart: 'Bir kez tam doyur', kontrol: d => d.doyma >= 1 },
    { id: 'bes', ad: 'Uyku ustası', emoji: '🌙', sart: '5 kez doyur', kontrol: d => d.doyma >= 5 },
    { id: 'hepsi', ad: 'Gurme', emoji: '🍽️', sart: 'Tepsideki her şeyi tattır', kontrol: d => YEMEKLER.every(y => d.yenen[y.id] > 0) },
    { id: 'bambu', ad: 'Bambu aşığı', emoji: '🎋', sart: '10 bambu', kontrol: d => (d.yenen.bambu || 0) >= 10 },
    { id: 'manti', ad: 'Mantı canavarı', emoji: '🥟', sart: '10 mantı', kontrol: d => (d.yenen.manti || 0) >= 10 },
    { id: 'kucak', ad: 'Kucak dolusu', emoji: '🤗', sart: '20 kez sev', kontrol: d => d.sevgi >= 20 }
  ];

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null;
  const ui = {};
  const zamanlar = new Set();
  let raf = 0, sozT = 0, kirpT = 0, bosT = 0, zzzT = 0, uykuT = 0, bakinT = 0;
  let gorunen = 0, hiz = 0, hedef = 0, animAktif = false;
  let surukle = null, sonSurukleZaman = 0, sonYemekZaman = 0;

  function varsayilan() {
    return { tokluk: 0, mod: 'ac', uykuBas: 0, toplam: 0, doyma: 0, sevgi: 0, yenen: {}, gun: { tarih: CD.bugun(), sayi: 0 }, rozetler: [], ipucuGoruldu: false, sonGorulme: Date.now() };
  }
  function yukle() {
    const v = Object.assign(varsayilan(), ctx.depo.al('durum', {}));
    if (!v.yenen || typeof v.yenen !== 'object') v.yenen = {};
    if (!Array.isArray(v.rozetler)) v.rozetler = [];
    if (!v.gun || v.gun.tarih !== CD.bugun()) v.gun = { tarih: CD.bugun(), sayi: 0 };
    return v;
  }
  function kaydet() {
    if (!ctx || !d) return;
    d.sonGorulme = Date.now();
    ctx.depo.yaz('durum', d);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function ipucuMetni() {
    if (d.mod === 'uyku') return 'Uyuyor, sindiriyor 💤';
    if (d.gun.sayi > 0) return 'Bugün ' + d.gun.sayi + ' lokma yedi 🍡';
    if (d.toplam > 0) return 'Karnı guruldadı 🎋';
    return '';
  }
  function asama(t) { let a = ASAMALAR[0]; ASAMALAR.forEach(x => { if (t >= x.esik) a = x; }); return a; }
  const rastgele = a => CD.rastgele(a);

  function sonra(fn, ms) {
    const t = setTimeout(() => { zamanlar.delete(t); if (ctx) fn(); }, ms);
    zamanlar.add(t); return t;
  }
  function iptal(t) { clearTimeout(t); zamanlar.delete(t); }
  function hepsiniIptal() { zamanlar.forEach(clearTimeout); zamanlar.clear(); }

  /* ------------------------------------------------------------ SVG */
  const IKON = '<svg viewBox="0 0 64 64"><circle cx="14" cy="16" r="8" fill="' + SIYAH + '"/><circle cx="50" cy="16" r="8" fill="' + SIYAH + '"/><circle cx="32" cy="32" r="22" fill="#fff" stroke="#E4D8E2" stroke-width="1.5"/><ellipse cx="23" cy="30" rx="6.5" ry="7.5" fill="' + SIYAH + '" transform="rotate(-14 23 30)"/><ellipse cx="41" cy="30" rx="6.5" ry="7.5" fill="' + SIYAH + '" transform="rotate(14 41 30)"/><circle cx="24" cy="30.5" r="2.4" fill="#fff"/><circle cx="40" cy="30.5" r="2.4" fill="#fff"/><ellipse cx="32" cy="40" rx="4" ry="2.6" fill="' + SIYAH + '"/><path d="M32 42.6v2.4m0 0c-2 2.6-5 2.6-6 1m6-1c2 2.6 5 2.6 6 1" stroke="' + SIYAH + '" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="17" cy="42" r="3.2" fill="#F8B4C4" opacity=".8"/><circle cx="47" cy="42" r="3.2" fill="#F8B4C4" opacity=".8"/></svg>';

  function pandaSvg() {
    return '<svg class="panda-svg" viewBox="0 0 240 250" aria-hidden="true" focusable="false">' +
      '<ellipse class="panda-golge" cx="120" cy="238" rx="72" ry="8"/>' +
      '<g class="panda-bacak-yer panda-bacak-sol"><ellipse cx="78" cy="214" rx="27" ry="17" class="panda-siyah"/><ellipse cx="74" cy="218" rx="9" ry="6" class="panda-pati"/><circle cx="62" cy="211" r="3.2" class="panda-pati"/><circle cx="70" cy="207" r="3.2" class="panda-pati"/><circle cx="79" cy="207" r="3.2" class="panda-pati"/></g>' +
      '<g class="panda-bacak-yer panda-bacak-sag"><ellipse cx="162" cy="214" rx="27" ry="17" class="panda-siyah"/><ellipse cx="166" cy="218" rx="9" ry="6" class="panda-pati"/><circle cx="178" cy="211" r="3.2" class="panda-pati"/><circle cx="170" cy="207" r="3.2" class="panda-pati"/><circle cx="161" cy="207" r="3.2" class="panda-pati"/></g>' +
      '<g class="panda-govde-g">' +
        '<ellipse class="panda-govde" cx="120" cy="162" rx="60" ry="56"/>' +
        '<path class="panda-omuz panda-siyah" d="M62 140C80 118 160 118 178 140L178 160C160 142 80 142 62 160Z"/>' +
        '<ellipse class="panda-karin" cx="120" cy="172" rx="38" ry="32"/>' +
        '<ellipse class="panda-karin-isik" cx="106" cy="160" rx="9" ry="5"/>' +
      '</g>' +
      '<g class="panda-kol-yer panda-kol-sol"><g class="panda-kol"><ellipse cx="50" cy="168" rx="17" ry="32" transform="rotate(20 50 168)" class="panda-siyah"/></g></g>' +
      '<g class="panda-kol-yer panda-kol-sag"><g class="panda-kol"><ellipse cx="190" cy="168" rx="17" ry="32" transform="rotate(-20 190 168)" class="panda-siyah"/></g></g>' +
      '<g class="panda-kafa-g">' +
        '<circle cx="58" cy="42" r="22" class="panda-siyah"/><circle cx="182" cy="42" r="22" class="panda-siyah"/>' +
        '<circle cx="58" cy="42" r="10" class="panda-kulak-ic"/><circle cx="182" cy="42" r="10" class="panda-kulak-ic"/>' +
        '<circle class="panda-kafa" cx="120" cy="84" r="62"/>' +
        '<ellipse cx="92" cy="84" rx="17" ry="21" transform="rotate(-14 92 84)" class="panda-siyah"/>' +
        '<ellipse cx="148" cy="84" rx="17" ry="21" transform="rotate(14 148 84)" class="panda-siyah"/>' +
        '<g class="panda-gozler">' +
          '<g class="panda-goz"><ellipse cx="94" cy="86" rx="7.5" ry="9" fill="#fff"/><g class="panda-bebek-g"><circle class="panda-bebek" cx="95" cy="87" r="4.4"/><circle cx="93.2" cy="84.6" r="1.9" fill="#fff"/></g></g>' +
          '<g class="panda-goz"><ellipse cx="146" cy="86" rx="7.5" ry="9" fill="#fff"/><g class="panda-bebek-g"><circle class="panda-bebek" cx="145" cy="87" r="4.4"/><circle cx="143.2" cy="84.6" r="1.9" fill="#fff"/></g></g>' +
        '</g>' +
        '<g class="panda-goz-kapali"><path d="M86 88q8 6 16 0"/><path d="M138 88q8 6 16 0"/></g>' +
        '<g class="panda-goz-mutlu"><path d="M86 90q8-10 16 0"/><path d="M138 90q8-10 16 0"/></g>' +
        '<g class="panda-yanaklar"><ellipse class="panda-yanak" cx="70" cy="108" rx="8" ry="5.5"/><ellipse class="panda-yanak" cx="170" cy="108" rx="8" ry="5.5"/></g>' +
        '<ellipse class="panda-burun panda-siyah" cx="120" cy="106" rx="7.5" ry="5.2"/>' +
        '<path class="panda-agiz-kapali" d="M120 111v4m0 0c-3 4-8 4-10 1m10-1c3 4 8 4 10 1"/>' +
        '<path class="panda-agiz-gulus" d="M104 113q16 16 32 0"/>' +
        '<g class="panda-agiz-acik"><ellipse cx="120" cy="121" rx="12" ry="10" class="panda-agiz-ic"/><ellipse cx="120" cy="127" rx="7" ry="4" class="panda-dil"/></g>' +
      '</g>' +
    '</svg>';
  }
  function bambuSvg(sinif) {
    return '<svg class="panda-bambu ' + sinif + '" viewBox="0 0 60 320" aria-hidden="true" focusable="false">' +
      '<rect x="22" y="0" width="16" height="320" rx="8" class="panda-bambu-govde"/>' +
      '<rect x="20" y="70" width="20" height="5" rx="2.5" class="panda-bambu-bogum"/><rect x="20" y="150" width="20" height="5" rx="2.5" class="panda-bambu-bogum"/><rect x="20" y="230" width="20" height="5" rx="2.5" class="panda-bambu-bogum"/>' +
      '<path class="panda-bambu-yaprak" d="M30 74c-14-16-30-18-30-8s16 20 30 8z"/><path class="panda-bambu-yaprak" d="M30 154c14-16 30-18 30-8s-16 20-30 8z"/><path class="panda-bambu-yaprak" d="M30 234c-14-16-30-18-30-8s16 20 30 8z"/><path class="panda-bambu-yaprak acik" d="M30 100c12-12 26-12 26-4s-14 16-26 4z"/>' +
    '</svg>';
  }

  /* ------------------------------------------------------------ kurulum */
  function kur(el) {
    const sahne = ctx.el('div.sahne.panda-sahne', { 'aria-label': 'Obur Panda sahnesi' });
    sahne.insertAdjacentHTML('beforeend', bambuSvg('panda-bambu-sol') + bambuSvg('panda-bambu-sag'));
    const balonYer = ctx.el('div.panda-balon-yer', [ctx.el('div.balon.panda-balon', { role: 'status', 'aria-live': 'polite' })]);
    const ipucu = ctx.el('div.panda-ipucu', { 'aria-hidden': 'true' }, [ctx.el('span', '🎋'), ctx.el('span', 'Yemeği tut, ağzına götür — ya da dokun')]);
    const karakter = ctx.el('div.panda-karakter', { 'data-pati': '', role: 'button', tabindex: '0', 'aria-label': 'Pandaya dokun' });
    karakter.insertAdjacentHTML('beforeend', pandaSvg());
    const zzz = ctx.el('div.panda-zzz', { 'aria-hidden': 'true' });
    const cimen = ctx.el('div.panda-cimen', { 'aria-hidden': 'true' });
    const tepsi = ctx.el('div.panda-tepsi', { role: 'group', 'aria-label': 'Yiyecek tepsisi' });
    const tepsiIc = ctx.el('div.panda-tepsi-ic');
    YEMEKLER.forEach(y => {
      const b = ctx.el('button.panda-yemek', { type: 'button', 'aria-label': y.ad + ' ver', data: { yemek: y.id }, draggable: 'false' }, [
        ctx.el('span.panda-yemek-tabak', { 'aria-hidden': 'true' }, [ctx.el('span.panda-yemek-emoji', y.emoji)]),
        ctx.el('span.panda-yemek-ad', y.ad)
      ]);
      tepsiIc.appendChild(b);
    });
    tepsi.appendChild(tepsiIc);
    sahne.append(balonYer, ipucu, karakter, zzz, cimen, tepsi);

    /* karne */
    const karne = ctx.el('div.yama.panda-karne', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Pandanın karnesi'), ctx.el('span.rozet.panda-asama')]),
      ctx.el('div.bar.panda-bar', { style: '--bar-renk: var(--seker-bal)' }, [
        ctx.el('span.bar-ikon', { 'aria-hidden': 'true' }, '🍚'), ctx.el('div.bar-yol', [ctx.el('div.bar-dolu.panda-bar-dolu')]), ctx.el('span.bar-yuzde.panda-bar-yuzde', '0%')
      ]),
      ctx.el('div.panda-sayilar', [
        ctx.el('div.panda-sayi', [ctx.el('div.panda-sayi-deger.sayi', { data: { sayi: 'gun' } }, '0'), ctx.el('div.panda-sayi-ad', 'bugün')]),
        ctx.el('div.panda-sayi', [ctx.el('div.panda-sayi-deger.sayi', { data: { sayi: 'toplam' } }, '0'), ctx.el('div.panda-sayi-ad', 'toplam lokma')]),
        ctx.el('div.panda-sayi', [ctx.el('div.panda-sayi-deger.sayi', { data: { sayi: 'doyma' } }, '0'), ctx.el('div.panda-sayi-ad', 'kez doydu')])
      ]),
      ctx.el('p.sessiz.panda-favori')
    ]);
    /* rozetler */
    const rozetKap = ctx.el('div.satir.sar.panda-rozet-liste');
    ROZETLER.forEach(r => {
      rozetKap.appendChild(ctx.el('button.rozet.panda-rozet', { type: 'button', data: { rozet: r.id }, 'aria-label': r.ad + ': ' + r.sart, onclick: () => { ctx.ses.tik(); const acik = d.rozetler.includes(r.id); ctx.toast((acik ? '✓ ' : '') + r.ad + ' — ' + r.sart); } }, [ctx.el('span', { 'aria-hidden': 'true' }, r.emoji), ctx.el('span', r.ad)]));
    });
    const rozetler = ctx.el('div.yama.panda-rozetler', [ctx.el('h2.baslik.baslik-lg', 'Rozetler'), rozetKap]);
    const icerik = ctx.el('div.icerik', [karne, rozetler, ctx.el('p.sessiz.orta', 'Panda hiç kızmaz, hiç ölmez; en fazla "acıktım" der.')]);
    el.append(sahne, icerik);

    Object.assign(ui, {
      sahne, balon: balonYer.firstChild, ipucu, karakter, zzz, tepsi, tepsiIc, karne,
      svg: karakter.querySelector('.panda-svg'),
      asamaRozet: karne.querySelector('.panda-asama'), bar: karne.querySelector('.panda-bar'), barDolu: karne.querySelector('.panda-bar-dolu'), barYuzde: karne.querySelector('.panda-bar-yuzde'), favori: karne.querySelector('.panda-favori'),
      rozetKap
    });
    const q = s => ui.svg.querySelector(s), qa = s => Array.from(ui.svg.querySelectorAll(s));
    Object.assign(ui, {
      golge: q('.panda-golge'), govde: q('.panda-govde'), omuz: q('.panda-omuz'), karin: q('.panda-karin'), karinIsik: q('.panda-karin-isik'),
      kolSol: q('.panda-kol-sol'), kolSag: q('.panda-kol-sag'), bacakSol: q('.panda-bacak-sol'), bacakSag: q('.panda-bacak-sag'),
      kafa: q('.panda-kafa'), burun: q('.panda-burun'), yanaklar: qa('.panda-yanak'), bebekler: qa('.panda-bebek-g'), gozler: q('.panda-gozler')
    });
  }

  /* ------------------------------------------------------------ karın fiziği (yay) */
  function karinCiz(t100) {
    const t = Math.max(0, t100 / 100);
    const oz = (e, o) => { for (const k in o) e.setAttribute(k, o[k].toFixed(2)); };
    oz(ui.govde, { rx: 60 + 26 * t, ry: 56 + 18 * t });
    oz(ui.karin, { rx: 38 + 34 * t, ry: 32 + 26 * t, cy: 172 + 4 * t });
    oz(ui.karinIsik, { cx: 106 - 9 * t, cy: 160 - 3 * t, rx: 9 + 7 * t, ry: 5 + 4 * t });
    oz(ui.golge, { rx: 72 + 22 * t });
    ui.yanaklar.forEach(y => oz(y, { rx: 8 + 5 * t, ry: 5.5 + 3 * t }));
    const s = 1 + 0.32 * t;
    ui.omuz.setAttribute('transform', 'translate(' + (120 - 120 * s).toFixed(2) + ' 0) scale(' + s.toFixed(3) + ' 1)');
    ui.kolSol.setAttribute('transform', 'translate(' + (-24 * t).toFixed(2) + ' ' + (6 * t).toFixed(2) + ')');
    ui.kolSag.setAttribute('transform', 'translate(' + (24 * t).toFixed(2) + ' ' + (6 * t).toFixed(2) + ')');
    ui.bacakSol.setAttribute('transform', 'translate(' + (-18 * t).toFixed(2) + ' ' + (3 * t).toFixed(2) + ')');
    ui.bacakSag.setAttribute('transform', 'translate(' + (18 * t).toFixed(2) + ' ' + (3 * t).toFixed(2) + ')');
  }
  function karinHedefle(t, zipla) {
    hedef = t;
    if (zipla && !ctx.azHareket) hiz += 2.2;
    if (!animAktif) { animAktif = true; raf = requestAnimationFrame(adim); }
  }
  function adim() {
    if (!ctx) { animAktif = false; return; }
    if (ctx.azHareket) { gorunen = hedef; hiz = 0; }
    else { hiz += (hedef - gorunen) * 0.085; hiz *= 0.8; gorunen += hiz; }
    karinCiz(gorunen);
    if (Math.abs(hedef - gorunen) < 0.03 && Math.abs(hiz) < 0.03) { gorunen = hedef; karinCiz(gorunen); animAktif = false; raf = 0; return; }
    raf = requestAnimationFrame(adim);
  }

  /* ------------------------------------------------------------ küçük yardımcılar */
  function soyle(metin, ms) {
    if (!ui.balon) return;
    ui.balon.textContent = metin; ui.balon.classList.add('goster');
    if (sozT) iptal(sozT);
    sozT = sonra(() => { ui.balon.classList.remove('goster'); sozT = 0; }, ms || 2600);
  }
  function agizMerkez() {
    const r = ui.burun.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 + 14 };
  }
  function agizaYakin(x, y) {
    const r = ui.kafa.getBoundingClientRect();
    const pay = 18;
    return x >= r.left - pay && x <= r.right + pay && y >= r.top - pay && y <= r.bottom + pay + 10;
  }
  function bak(x, y) {
    // göz bebekleri işaretçiye doğru kayar
    const r = ui.kafa.getBoundingClientRect();
    if (!r.width) return;
    const dx = CD.sinirla((x - (r.left + r.width / 2)) / r.width, -0.5, 0.5) * 5;
    const dy = CD.sinirla((y - (r.top + r.height / 2)) / r.height, -0.5, 0.5) * 4;
    ui.bebekler.forEach(b => b.setAttribute('transform', 'translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')'));
  }
  function bakmaBirak() { ui.bebekler.forEach(b => b.removeAttribute('transform')); }
  function agiz(acik) { ui.svg.classList.toggle('panda-acik', !!acik); }
  function tepsiKilit(kapali) {
    ui.tepsi.setAttribute('aria-disabled', kapali ? 'true' : 'false');
    // disabled DEĞİL: kilitliyken dokununca "şşş… uyuyor" diyebilsin (disabled düğme olay üretmez)
    ui.tepsiIc.querySelectorAll('.panda-yemek').forEach(b => { b.setAttribute('aria-disabled', kapali ? 'true' : 'false'); b.classList.toggle('kilitli', !!kapali); });
  }
  function bosDurusSifirla() {
    if (bosT) iptal(bosT);
    bosT = sonra(() => { bosT = 0; if (d.mod === 'ac' && !surukle) { soyle(rastgele(SOZ.bos)); zipla(); bosDurusSifirla(); } }, BOS_DURUS);
  }
  function zipla() {
    if (ctx.azHareket) return;
    ui.svg.classList.remove('panda-zipla'); void ui.svg.getBoundingClientRect(); ui.svg.classList.add('panda-zipla');
    sonra(() => ui.svg.classList.remove('panda-zipla'), 700);
  }
  function kirpDongu() {
    if (kirpT) iptal(kirpT);
    kirpT = sonra(() => {
      kirpT = 0;
      if (d.mod !== 'uyku' && !ctx.azHareket) {
        ui.gozler.classList.add('panda-kirp');
        sonra(() => ui.gozler.classList.remove('panda-kirp'), 140);
      }
      kirpDongu();
    }, 2600 + Math.random() * 3200);
  }

  function bakinDongu() {
    // boşta ara sıra göz bebekleri gezinir (canlılık); sürüklerken bak() zaten yönetiyor
    if (bakinT) iptal(bakinT);
    bakinT = sonra(() => {
      bakinT = 0;
      if (d.mod === 'ac' && !surukle && !ctx.azHareket) {
        const dx = (Math.random() * 8 - 4).toFixed(1), dy = (Math.random() * 3 - 1).toFixed(1);
        ui.bebekler.forEach(b => b.setAttribute('transform', 'translate(' + dx + ' ' + dy + ')'));
        sonra(() => { if (!surukle) bakmaBirak(); }, 700 + Math.random() * 600);
      }
      bakinDongu();
    }, 4000 + Math.random() * 5000);
  }

  /* ------------------------------------------------------------ karne & rozet */
  function barCiz(t, uykuda) {
    // t: gösterilecek tokluk (uykuda sindirimle iner); uykuda: bar lavantaya döner
    const a = asama(t);
    ui.asamaRozet.textContent = a.ad;
    ui.asamaRozet.className = 'rozet panda-asama' + (uykuda ? ' goz' : a.id === 'balon' ? ' inci' : a.id === 'ince' ? ' gri' : '');
    ui.svg.setAttribute('data-asama', a.id);
    ui.bar.style.setProperty('--bar-renk', uykuda ? 'var(--seker-lavanta)' : 'var(--seker-bal)');
    ui.barDolu.style.width = t + '%';
    ui.barYuzde.textContent = t + '%';
  }
  function karneGuncelle() {
    barCiz(d.tokluk, d.mod === 'uyku');
    ui.karne.querySelector('[data-sayi="gun"]').textContent = d.gun.sayi;
    ui.karne.querySelector('[data-sayi="toplam"]').textContent = d.toplam;
    ui.karne.querySelector('[data-sayi="doyma"]').textContent = d.doyma;
    let enCok = null;
    YEMEKLER.forEach(y => { const n = d.yenen[y.id] || 0; if (n > 0 && (!enCok || n > enCok.n)) enCok = { y, n }; });
    ui.favori.textContent = enCok ? 'En sevdiği: ' + enCok.y.emoji + ' ' + enCok.y.ad + ' (' + enCok.n + ' kez)' : 'Henüz bir şey yemedi; ilk lokmayı sen ver.';
    ui.rozetKap.querySelectorAll('.panda-rozet').forEach(b => {
      const acik = d.rozetler.includes(b.dataset.rozet);
      b.classList.toggle('kapali', !acik); b.classList.toggle('basari', acik);
    });
  }
  function rozetKontrol() {
    const yeni = ROZETLER.filter(r => !d.rozetler.includes(r.id) && r.kontrol(d));
    if (!yeni.length) return;
    yeni.forEach((r, i) => {
      d.rozetler.push(r.id);
      sonra(() => { ctx.ses.zafer(); ctx.toast('Rozet kazandın: ' + r.emoji + ' ' + r.ad, 3200); ctx.efekt.konfeti(undefined, undefined, 16); }, 900 + i * 1800);
    });
  }

  /* ------------------------------------------------------------ yeme döngüsü */
  function isir(yemek) {
    if (!ctx || d.mod !== 'ac') return;
    sonYemekZaman = Date.now();
    if (!d.ipucuGoruldu) { d.ipucuGoruldu = true; ui.ipucu.classList.add('gitti'); }
    ui.svg.classList.remove('panda-cigniyor'); void ui.svg.getBoundingClientRect();
    ui.svg.classList.add('panda-cigniyor', 'panda-acik');
    ctx.ses.cigne(); sonra(() => { if (d.mod === 'ac') ctx.ses.cigne(); }, 360);
    const m = agizMerkez();
    ctx.efekt.toz(m.x, m.y + 6, 4);
    sonra(() => {
      if (d.mod !== 'ac') return;
      if (Date.now() - sonYemekZaman >= 700) ui.svg.classList.remove('panda-cigniyor', 'panda-acik');
      ctx.ses.yut();
      const onceki = asama(d.tokluk);
      d.tokluk = Math.min(DOYMA, d.tokluk + yemek.deger);
      d.toplam++; d.gun.sayi++; d.yenen[yemek.id] = (d.yenen[yemek.id] || 0) + 1;
      karinHedefle(d.tokluk, true);
      const simdiki = asama(d.tokluk);
      const k = ctx.efekt.merkez(ui.karin);
      if (simdiki.id !== onceki.id && SOZ.asama[simdiki.id]) {
        soyle(rastgele(SOZ.asama[simdiki.id]), 3000);
        ctx.ses.hop(); ctx.efekt.yildiz(k.x, k.y, 6);
        if (simdiki.id === 'balon') {
          ctx.efekt.sarsinti(ui.sahne, 1);
          sonra(() => { if (d.mod === 'ac' && !surukle && Date.now() - sonYemekZaman > 1500) { ctx.ses.uf(); ctx.ses.hmpf(); soyle(rastgele(SOZ.hik), 1800); zipla(); } }, 3200);
        }
      } else {
        soyle(rastgele(yemek.soz));
        ctx.efekt.emoji(k.x, k.y - 10, yemek.emoji, 2);
      }
      rozetKontrol(); kaydet(); karneGuncelle(); bosDurusSifirla();
      if (d.tokluk >= DOYMA) sonra(doydu, 800);
    }, 740);
  }
  function doydu() {
    if (!ctx || d.mod !== 'ac') return;
    d.mod = 'sevgi'; d.doyma++; kaydet();
    tepsiKilit(true); bakmaBirak();
    ui.svg.classList.remove('panda-cigniyor', 'panda-acik'); ui.svg.classList.add('panda-sevgi');
    ui.sahne.classList.add('panda-sevgi-sahne');
    soyle('Doydum… Cemre, seni çok seviyorum 💛', SEVGI_SURE - 200);
    ctx.ses.parilti(); sonra(() => ctx.ses.zafer(), 500);
    const m = ctx.efekt.merkez(ui.kafa);
    ctx.efekt.konfeti(m.x, m.y, 18);
    for (let i = 0; i < 7; i++) sonra(() => { const k = ctx.efekt.merkez(ui.karin); ctx.efekt.kalp(k.x, k.y - 30, 4); }, 300 + i * 480);
    rozetKontrol(); karneGuncelle();
    sonra(() => { if (d.mod === 'sevgi') uyu(); }, SEVGI_SURE);
  }
  function uyu(kalan) {
    if (!ctx || d.mod === 'uyku') return;
    d.mod = 'uyku'; d.uykuBas = kalan != null ? Date.now() - (UYKU_SURE - kalan) : Date.now(); kaydet();
    const sure = kalan != null ? kalan : UYKU_SURE;
    tepsiKilit(true); bakmaBirak();
    ui.svg.classList.remove('panda-sevgi', 'panda-cigniyor', 'panda-acik'); ui.sahne.classList.remove('panda-sevgi-sahne');
    ui.svg.classList.add('panda-uyuyor'); ui.sahne.classList.add('panda-uyku'); ui.karne.classList.add('panda-karne-uyku');
    if (bakinT) { iptal(bakinT); bakinT = 0; }
    ui.zzz.innerHTML = '<span>z</span><span>z</span><span>Z</span>';
    soyle(rastgele(SOZ.uyku), 3000);
    ctx.ses.blop();
    const baslangicTokluk = d.tokluk;
    // sindirim: karın yavaşça iner
    if (uykuT) iptal(uykuT);
    const sindir = () => {
      const kalanMs = Math.max(0, d.uykuBas + UYKU_SURE - Date.now());
      const oran = kalanMs / UYKU_SURE;
      karinHedefle(baslangicTokluk * oran);
      barCiz(Math.round(baslangicTokluk * oran), true);
      if (kalanMs > 0 && d.mod === 'uyku') uykuT = sonra(sindir, 400); else uykuT = 0;
    };
    sindir();
    if (zzzT) iptal(zzzT);
    const zzzSoz = () => { zzzT = sonra(() => { if (d.mod === 'uyku') { soyle(rastgele(SOZ.uyku), 2400); zzzSoz(); } }, 4200); };
    zzzSoz();
    sonra(() => { if (d.mod === 'uyku') uyan(); }, sure + 80);
    karneGuncelle();
  }
  function uyan() {
    if (!ctx || d.mod !== 'uyku') return;
    d.mod = 'ac'; d.tokluk = 0; d.uykuBas = 0; kaydet();
    if (uykuT) { iptal(uykuT); uykuT = 0; }
    if (zzzT) { iptal(zzzT); zzzT = 0; }
    ui.svg.classList.remove('panda-uyuyor'); ui.sahne.classList.remove('panda-uyku'); ui.karne.classList.remove('panda-karne-uyku'); ui.zzz.innerHTML = '';
    karinHedefle(0);
    tepsiKilit(false);
    ctx.ses.pop(); soyle(rastgele(SOZ.uyan), 3200); zipla();
    karneGuncelle(); bosDurusSifirla(); kirpDongu(); bakinDongu();
  }
  function sarilma() {
    if (!ctx) return;
    if (d.mod === 'uyku') { soyle(rastgele(SOZ.uykudaDokun), 2200); const k = ctx.efekt.merkez(ui.kafa); ctx.efekt.kalp(k.x, k.y, 2); return; }
    d.sevgi++;
    const k = ctx.efekt.merkez(ui.karin);
    ctx.efekt.kalp(k.x, k.y - 30, 6); ctx.ses.parilti();
    soyle(rastgele(SOZ.sev), 2600);
    if (d.mod === 'ac') {
      ui.svg.classList.add('panda-sevgi');
      sonra(() => { if (d.mod === 'ac') ui.svg.classList.remove('panda-sevgi'); }, 1500);
    }
    rozetKontrol(); kaydet(); karneGuncelle(); bosDurusSifirla();
  }
  function dokun(e) {
    // pandaya dokunma (yemek sürüklenmiyorken)
    if (!ctx || surukle) return;
    bosDurusSifirla();
    if (d.mod === 'uyku') { ctx.ses.pit(); soyle(rastgele(SOZ.uykudaDokun), 2000); return; }
    if (d.mod === 'sevgi') { ctx.efekt.kalp(e.clientX, e.clientY, 3); ctx.ses.pit(); return; }
    const karinR = ui.karin.getBoundingClientRect();
    const karinaDokundu = e.clientY >= karinR.top && e.clientY <= karinR.bottom && e.clientX >= karinR.left && e.clientX <= karinR.right;
    if (karinaDokundu && d.tokluk >= 40) {
      ctx.ses.blop(); soyle(rastgele(SOZ.karin));
      if (!ctx.azHareket) { hiz += 1.6; karinHedefle(d.tokluk); }
    } else {
      ctx.ses.hop(); soyle(rastgele(SOZ.dokun)); zipla();
      ctx.efekt.kalp(e.clientX, e.clientY, 2);
    }
  }

  /* ------------------------------------------------------------ sürükle-bırak & dokunarak besleme */
  function hayaletYap(yemek, x, y) {
    const h = ctx.el('div.panda-surukle', { 'aria-hidden': 'true' }, [ctx.el('span', yemek.emoji)]);
    h.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
    document.body.appendChild(h);
    return h;
  }
  function hayaletTasi(h, x, y, olcek) {
    h.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) scale(' + (olcek || 1) + ')';
  }
  function ucur(yemek, kaynak) {
    // dokunarak: yemek tepsiden ağza uçar
    if (d.mod !== 'ac') { uyariMesgul(); return; }
    ctx.ses.pit();
    const r = kaynak.getBoundingClientRect();
    const bas = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const m = agizMerkez();
    if (ctx.azHareket) { isir(yemek); return; }
    const h = hayaletYap(yemek, bas.x, bas.y);
    agiz(true); bak(bas.x, bas.y);
    void h.getBoundingClientRect();
    h.classList.add('uc');
    hayaletTasi(h, m.x, m.y, 0.9);
    sonra(() => { h.classList.add('yut'); hayaletTasi(h, m.x, m.y + 6, 0.2); }, 460);
    sonra(() => { h.remove(); bakmaBirak(); isir(yemek); }, 620);
  }
  function uyariMesgul() {
    if (d.mod === 'uyku') { ctx.toast('Şşş… uyuyor, sindiriyor 💤'); ctx.ses.uf(); }
    else if (d.mod === 'sevgi') { ctx.toast('Şu an sarılıyor, bir saniye 💛'); }
  }
  function sonlandirSurukle(e, iptalMi) {
    const s = surukle; if (!s) return;
    surukle = null;
    window.removeEventListener('pointermove', suruklemeHareket);
    window.removeEventListener('pointerup', suruklemeBirak);
    window.removeEventListener('pointercancel', suruklemeIptal);
    try { s.kaynak.releasePointerCapture(s.id); } catch (err) {}
    s.kaynak.classList.remove('tutuldu');
    sonSurukleZaman = s.basladi ? Date.now() : 0;
    if (!s.hayalet) return;
    const h = s.hayalet;
    if (!iptalMi && d.mod === 'ac' && agizaYakin(e.clientX, e.clientY)) {
      const m = agizMerkez();
      h.classList.add('uc'); hayaletTasi(h, m.x, m.y + 4, 0.25); h.classList.add('yut');
      sonra(() => h.remove(), 220);
      isir(s.yemek);
    } else {
      // geri dön
      const r = s.kaynak.getBoundingClientRect();
      h.classList.remove('yakin'); h.classList.add('geri');
      hayaletTasi(h, r.left + r.width / 2, r.top + r.height / 2, 0.8);
      sonra(() => h.remove(), 340);
      agiz(false); bakmaBirak();
      if (!iptalMi && d.mod === 'ac') { ctx.ses.uf(); soyle(rastgele(SOZ.kacti), 1800); }
    }
  }
  function suruklemeHareket(e) {
    const s = surukle; if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x0, dy = e.clientY - s.y0;
    if (!s.basladi) {
      const esik = e.pointerType === 'mouse' ? 4 : 7;
      if (Math.abs(dx) < esik && Math.abs(dy) < esik) return;
      if (e.pointerType !== 'mouse' && Math.abs(dx) > Math.abs(dy) * 1.2) { sonlandirSurukle(e, true); return; } // yatay: tepsi kayar
      if (d.mod !== 'ac') { sonlandirSurukle(e, true); uyariMesgul(); return; }
      s.basladi = true;
      try { s.kaynak.setPointerCapture(s.id); } catch (err) {}
      s.kaynak.classList.add('tutuldu');
      s.hayalet = hayaletYap(s.yemek, e.clientX, e.clientY);
      ctx.ses.pit();
      bosDurusSifirla();
    }
    const yakin = agizaYakin(e.clientX, e.clientY);
    hayaletTasi(s.hayalet, e.clientX, e.clientY, yakin ? 1.18 : 1.05);
    s.hayalet.classList.toggle('yakin', yakin);
    if (yakin !== s.yakindi) { s.yakindi = yakin; agiz(yakin); if (yakin) ctx.ses.pop(); }
    bak(e.clientX, e.clientY);
  }
  function suruklemeBirak(e) { if (surukle && e.pointerId === surukle.id) sonlandirSurukle(e, false); }
  function suruklemeIptal(e) { if (surukle && e.pointerId === surukle.id) sonlandirSurukle(e, true); }
  function yemekBasildi(e) {
    const b = e.target.closest('.panda-yemek'); if (!b || surukle) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const yemek = YEMEKLER.find(y => y.id === b.dataset.yemek); if (!yemek) return;
    surukle = { id: e.pointerId, kaynak: b, yemek, x0: e.clientX, y0: e.clientY, basladi: false, hayalet: null, yakindi: false };
    window.addEventListener('pointermove', suruklemeHareket);
    window.addEventListener('pointerup', suruklemeBirak);
    window.addEventListener('pointercancel', suruklemeIptal);
  }
  function yemekTiklandi(e) {
    const b = e.target.closest('.panda-yemek'); if (!b) return;
    if (Date.now() - sonSurukleZaman < 500) return; // sürükleme sonrası tıklama değil
    const yemek = YEMEKLER.find(y => y.id === b.dataset.yemek); if (!yemek) return;
    bosDurusSifirla();
    ucur(yemek, b);
  }
  function tekerlek(e) {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const t = ui.tepsiIc, sonda = t.scrollLeft + t.clientWidth >= t.scrollWidth - 1, basta = t.scrollLeft <= 0;
    if ((e.deltaY > 0 && sonda) || (e.deltaY < 0 && basta)) return; // tepsi bitti: sayfa kendisi kaysın
    t.scrollLeft += e.deltaY; e.preventDefault();
  }
  function tepsiKenar() {
    // kenar solgunlukları: sağda devamı varsa sağ, kaydırıldıysa sol görünür ("tepside daha var" işareti)
    const t = ui.tepsiIc; if (!t || !ui.tepsi) return;
    ui.tepsi.classList.toggle('panda-tepsi-son', t.scrollLeft + t.clientWidth >= t.scrollWidth - 1);
    ui.tepsi.classList.toggle('panda-tepsi-kaydi', t.scrollLeft > 0);
  }
  function gorunurluk() {
    if (!ctx || document.visibilityState !== 'visible') return;
    if (d.mod === 'uyku') {
      const kalan = d.uykuBas + UYKU_SURE - Date.now();
      if (kalan <= 0) uyan();
    }
  }

  /* ------------------------------------------------------------ açılış */
  function acilis() {
    const simdi = Date.now();
    let selam = rastgele(SOZ.selam);
    if (d.mod === 'sevgi') { d.mod = 'ac'; d.tokluk = DOYMA; }
    if (d.mod === 'uyku') {
      const kalan = d.uykuBas + UYKU_SURE - simdi;
      if (kalan <= 0) { d.mod = 'ac'; d.tokluk = 0; d.uykuBas = 0; selam = rastgele(SOZ.uyan); }
      else { const t = d.tokluk; gorunen = t; hiz = 0; karinCiz(t); d.mod = 'ac'; uyu(kalan); return; }
    } else if (d.tokluk > 0) {
      const dk = (simdi - (d.sonGorulme || simdi)) / 60000;
      if (dk > 30) { const yeni = Math.max(0, d.tokluk - Math.floor(dk / 10) * 4); if (yeni !== d.tokluk) { d.tokluk = yeni; selam = rastgele(SOZ.ozledim); } }
    }
    if (d.tokluk >= DOYMA) { gorunen = d.tokluk; karinCiz(gorunen); kaydet(); karneGuncelle(); sonra(doydu, 900); return; }
    gorunen = d.tokluk; hiz = 0; hedef = d.tokluk; karinCiz(gorunen);
    kaydet(); karneGuncelle();
    sonra(() => { soyle(selam, 3000); zipla(); }, 500);
    bosDurusSifirla(); kirpDongu(); bakinDongu();
  }

  /* ------------------------------------------------------------ kayıt */
  CD.kaydet({
    id: ID, baslik: 'Obur Panda', ikon: IKON, tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el;
      d = yukle();
      kur(el);
      if (d.ipucuGoruldu) ui.ipucu.classList.add('gitti');
      ui.tepsiIc.addEventListener('pointerdown', yemekBasildi);
      ui.tepsiIc.addEventListener('click', yemekTiklandi);
      ui.tepsiIc.addEventListener('wheel', tekerlek, { passive: false });
      ui.tepsiIc.addEventListener('scroll', tepsiKenar, { passive: true });
      sonra(tepsiKenar, 0);
      ui.karakter.addEventListener('pointerdown', dokun);
      ui.karakter.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const m = ctx.efekt.merkez(ui.kafa);
        dokun({ clientX: m.x, clientY: m.y });
      });
      document.addEventListener('visibilitychange', gorunurluk);
      ctx.altbar([
        { id: 'rastgele', ad: 'Rastgele ver', ikon: '🎲', birincil: true, tikla() {
          if (d.mod !== 'ac') { uyariMesgul(); return; }
          const yemek = rastgele(YEMEKLER);
          const b = ui.tepsiIc.querySelector('[data-yemek="' + yemek.id + '"]');
          // tepsiyi yatay kaydır (scrollIntoView DEĞİL: sayfayı dikey kaydırabiliyor)
          if (b) { const sol = b.offsetLeft - (ui.tepsiIc.clientWidth - b.offsetWidth) / 2; try { ui.tepsiIc.scrollTo({ left: sol, behavior: ctx.azHareket ? 'auto' : 'smooth' }); } catch (e) { ui.tepsiIc.scrollLeft = sol; } }
          bosDurusSifirla();
          sonra(() => ucur(yemek, b || ui.tepsiIc), 160);
        } },
        { id: 'sev', ad: 'Sev', ikon: '💛', tikla() { sarilma(); } },
        { id: 'uyut', ad: 'Uyut', ikon: '💤', tikla() {
          if (d.mod === 'uyku') { ctx.toast('Zaten uyuyor, sindiriyor 💤'); return; }
          if (d.mod === 'sevgi') { ctx.toast('Sarılması bitsin, sonra uyur 💛'); return; }
          if (d.tokluk <= 0) { soyle('Karnım boş, uyku tutmaz. Önce bir lokma?', 2600); ctx.ses.uf(); return; }
          uyu();
        } }
      ]);
      acilis();
    },
    unmount() {
      if (surukle) { try { surukle.kaynak.releasePointerCapture(surukle.id); } catch (e) {} if (surukle.hayalet) surukle.hayalet.remove(); surukle = null; }
      window.removeEventListener('pointermove', suruklemeHareket);
      window.removeEventListener('pointerup', suruklemeBirak);
      window.removeEventListener('pointercancel', suruklemeIptal);
      document.removeEventListener('visibilitychange', gorunurluk);
      document.querySelectorAll('.panda-surukle').forEach(h => h.remove());
      hepsiniIptal();
      cancelAnimationFrame(raf); raf = 0; animAktif = false;
      sozT = kirpT = bosT = zzzT = uykuT = bakinT = 0;
      if (d && ctx) { if (d.mod === 'sevgi') { d.mod = 'uyku'; d.uykuBas = Date.now(); } kaydet(); }
      ctx.ses.hepsiniDurdur();
      for (const k in ui) delete ui[k];
      ctx = null; kok = null; d = null;
    }
  });
})();
