/* js/bolum/pittiksu.js — Pıttıksu Köşesi (Cemre'nin gerçek yavru kedisi; 1–2 haftalık yenidoğan)
   Sahne: SVG Pıttıksu battaniyede — okşa (mırr), dokun (bölgeye göre tepki), kucak, uyku, esneme, patisiyle yumak.
   Sekmeler: Oyna (rüya oyunları: lazer, tüy, fare, yumak) · Albüm (fotoğraflar + telefondan ekleme, IndexedDB)
   · Günlük (yaş, mama saatleri, kilo grafiği, hatırlatıcılar, tuvalet/uyku, bugün ne yaptı) · İpuçları (yenidoğan bakımı)
   · Sözler (konuşma balonu koleksiyonu; arada bir BITCH!). Her şey cd.pittiksu.* ve IndexedDB'de kalır. */
(() => {
  'use strict';
  const ID = 'pittiksu';
  const GUN = 86400000;

  /* ------------------------------------------------------------ içerik: gelişim aşamaları (ARASTIRMA.md §5; günler doğumdan itibaren) */
  const ASAMALAR = [
    { id: 'h0', ad: '0–1 hafta', bas: 0, bit: 7, kilo: '75–150 g', kiloAlt: 75, kiloUst: 150, goz: 'kapalı, kulaklar katlı', hareket: 'sadece sürünür', mama: '2 saatte bir (gece dahil)', mamaSaat: 2, sicak: '29–32 °C ısı kaynağı', tuvalet: 'her mamada uyarma', ozet: 'Gözleri kapalı, sadece uyur ve süt içer. Sıcak yuva her şeyden önemli.' },
    { id: 'h1', ad: '1–2 hafta', bas: 7, bit: 14, kilo: '150–250 g', kiloAlt: 150, kiloUst: 250, goz: '8–12. günde açılır', hareket: 'henüz yürüyemez', mama: '2–3 saatte bir', mamaSaat: 3, sicak: '~29 °C', tuvalet: 'her mamada uyarma', ozet: 'Gözler bu hafta açılıyor. Hâlâ kendi ısısını koruyamaz; mama ve tuvalet sende.' },
    { id: 'h2', ad: '2–3 hafta', bas: 14, bit: 21, kilo: '250–350 g', kiloAlt: 250, kiloUst: 350, goz: 'açık, bebek mavisi; kulaklar açılıyor', hareket: 'sallantılı ilk adımlar', mama: '3–4 saatte bir', mamaSaat: 4, sicak: '~27 °C', tuvalet: 'uyarma → kuma alıştırma', ozet: 'Kulaklar açılıyor, ilk sallantılı adımlar. Kum kabıyla tanışma başlayabilir.' },
    { id: 'h3', ad: '3–4 hafta', bas: 21, bit: 28, kilo: '350–450 g', kiloAlt: 350, kiloUst: 450, goz: 'mavi; kulaklar dik', hareket: 'yürür, keşfeder', mama: '4–5 saatte bir', mamaSaat: 5, sicak: '21–24 °C', tuvalet: 'kum kabını kullanmaya başlar', ozet: 'Artık yürüyor ve her şeyi keşfediyor. Isı kaynağı yavaş yavaş azalabilir.' },
    { id: 'h4', ad: '4–5 hafta', bas: 28, bit: 35, kilo: '450–550 g', kiloAlt: 450, kiloUst: 550, goz: 'mavi', hareket: 'koşar, oynar', mama: '5–6 saatte bir + sütten kesme başlar', mamaSaat: 6, sicak: 'kritik değil, yine de sıcak tut', tuvalet: 'kum kabı', ozet: 'Sütten kesme başlıyor: tabakta lapa. Oyun zamanı da başladı.' },
    { id: 'h5', ad: '5–6 hafta', bas: 35, bit: 42, kilo: '550–750 g', kiloAlt: 550, kiloUst: 750, goz: 'mavi', hareket: 'çok aktif', mama: 'lapa → ıslak mama, su hep önünde', mamaSaat: 6, sicak: 'oda sıcaklığı', tuvalet: 'kum kabı', ozet: 'Islak mamaya geçiş, su hep önünde. Enerjisi taşıyor.' },
    { id: 'h6', ad: '6–8 hafta', bas: 42, bit: 56, kilo: '650–950 g', kiloAlt: 650, kiloUst: 950, goz: 'yetişkin rengi başlıyor', hareket: 'koordineli oyun', mama: 'kendi yer; mama + su sürekli', mamaSaat: 0, sicak: 'oda sıcaklığı', tuvalet: 'bağımsız', ozet: 'Kendi yiyor, kendi tuvaletini yapıyor. Veterinerle aşı takvimini konuşma zamanı.' },
    { id: 'h7', ad: '8 hafta ve sonrası', bas: 56, bit: 1e9, kilo: '~900 g ve üzeri', kiloAlt: 900, kiloUst: 3000, goz: 'kendi rengi', hareket: 'tam bir kedi', mama: 'yavru maması, günde birkaç öğün', mamaSaat: 0, sicak: 'oda sıcaklığı', tuvalet: 'bağımsız', ozet: 'Minik bir kedi oldu. Kontroller, aşılar ve bol oyun.' }
  ];

  /* ------------------------------------------------------------ içerik: bakım ipuçları (marka/miktar yok; veterinere yönlendirir) */
  const IPUCLARI = [
    { id: 'sicak', emoji: '🌡️', ad: 'Sıcak tutmak', gun: [0, 28], metin: 'Pıttıksu 3–4 haftalık olana kadar kendi ısısını koruyamaz. Isı pedini ya da sıcak su şişesini 2–3 kat havluya sar; yuvasının bir köşesi serin kalsın ki ısındığında uzaklaşabilsin. İlk hafta 29–32 °C, sonra her hafta biraz daha az.' },
    { id: 'biberon', emoji: '🍼', ad: 'Biberon ve mama', gun: [0, 35], metin: 'Anne yoksa yavru kediye özel süt ikamesi verilir; inek sütü karnını bozar. Karnı aşağıda, sanki anneden emiyormuş gibi tut (sırt üstü asla). Mama bittikten sonra sırtını nazikçe ov, geğirsin. Hangi ürün ve ne kadar? Bunu veterinerin Pıttıksu\'nun kilosuna göre söyler.' },
    { id: 'tuvalet', emoji: '🚼', ad: 'Tuvalet uyarımı', gun: [0, 21], metin: '3 haftadan küçük yavrular tuvaletini tek başına yapamaz. Her mamadan önce ya da sonra ılık, nemli bir pamukla karnının altını nazikçe ov; bir dakika içinde çişini yapar. Kaka her seferinde olmayabilir, günde bir kez normaldir.' },
    { id: 'kilo', emoji: '⚖️', ad: 'Günlük kilo', gun: [0, 56], metin: 'Her gün aynı saatte mutfak terazisiyle tart ve Günlük\'e yaz. Yavrular ilk haftalarda her gün biraz alır. 24 saat boyunca almıyorsa ya da düşüyorsa beklemeden veterinere git; küçük bedende her gram önemli.' },
    { id: 'goz', emoji: '👀', ad: 'Gözler ve kulaklar', gun: [0, 21], metin: 'Gözler 8–12. günde açılır, kulaklar 2–3. haftada dikleşir. Yeni açılan gözler hassastır: parlak ışıktan koru, gözünü asla zorla açma. Akıntı ya da yapışma görürsen veterinere göster.' },
    { id: 'uyku', emoji: '😴', ad: 'Uyku', gun: [0, 56], metin: 'Yenidoğan yavrular günün neredeyse tamamını uyuyarak geçirir; büyüme uykuda olur. Yuvası sessiz, loş ve sıcak olsun. Uyurken kımıldanması, seğirmesi normaldir: rüya görüyor.' },
    { id: 'sutten', emoji: '🥣', ad: 'Sütten kesme', gun: [21, 49], metin: '3,5–4 haftada başlar: önce alçak bir tabakta süt ikamesi, sonra içine biraz ıslak yavru maması karıştırılıp lapa yapılır, yavaş yavaş katıya geçilir. Günde 3–4 küçük öğün. Acele etme; biberonu birden kesme.' },
    { id: 'kum', emoji: '🪣', ad: 'Kum kabı', gun: [14, 42], metin: '3–4 haftalık olunca alçak kenarlı bir kap ve topaklanmayan kum yeter. Mamadan sonra kaba koy, patisiyle kumu eşelesin; öğrenmesi birkaç gün sürer. Kızmak yok, ödül olarak okşamak var.' },
    { id: 'asi', emoji: '💉', ad: 'Aşı ve veteriner', gun: [28, 200], metin: 'Aşı takvimini veterinerin belirler; ilk karma aşı genelde 6–8 haftada başlar, tekrarları ve kuduz sonra gelir. İç-dış parazit koruması da onun önerisiyle. Tarihleri Günlük\'teki hatırlatıcılara yaz, ben sana haber vereyim.' },
    { id: 'sosyal', emoji: '🫶', ad: 'Alışma ve sevgi', gun: [10, 56], metin: '2–7 hafta arası "alışma penceresi": yumuşak sesle konuş, kısa kısa kucağına al, evin seslerini yavaş yavaş duysun. Şimdi aldığı sevgi, ömür boyu sakin ve cana yakın bir kedi demek.' },
    { id: 'rus', emoji: '🩶', ad: 'Gri tüy, mavi göz', gun: [0, 400], metin: 'Pıttıksu bir Russian Blue gibi görünüyor: gümüş grisi kısa tüy, mavi-gri bebek gözleri. Bu cinsin yavrularında göz rengi 4. aydan sonra yeşile dönebilir. Şaşırma; hâlâ aynı Pıttıksu.' },
    { id: 'acil', emoji: '🩺', ad: 'Hemen veterinere', gun: [0, 400], metin: 'Mama içmiyorsa, sürekli ağlıyorsa, ishalse, dokununca soğuksa, burnundan-gözünden akıntı varsa ya da 24 saat kilo almadıysa bekleme. Yavru kedilerde durum hızlı değişir; erken gitmek en iyi bakım.' },
    { id: 'ellemek', emoji: '🐾', ad: 'Tutuş', gun: [0, 42], metin: 'Kucağına alırken bir elin göğsünün altında, diğeri poposunu taşısın; enseden asla kaldırma. Elini önce ısıt; soğuk el yenidoğanı ürkütür. Kısa tut, sonra sıcak yuvasına geri koy.' }
  ];

  /* ------------------------------------------------------------ içerik: sözler */
  const SOZLER = [
    'Cemre benim insanım.', 'Bugün 3 kere esnedim, rekor.', 'Pembe battaniye = benim krallığım.', 'Patim minik ama kalbim kocaman.',
    'Mırr… bu okşama 10/10.', 'Gözlerimi daha yeni açtım; ilk gördüğüm şey sendin.', 'Kulaklarım bugün biraz daha dikleşti, fark ettin mi?',
    'Rüyamda kocaman bir yumak gördüm, kovaladım.', 'Ellerin sıcacık, buradan ayrılmıyorum.', 'Miyavlamayı öğreniyorum: mi… ıı… olmadı, yarın.',
    'Kilo mu aldım? Sevgiden.', 'Battaniyenin altı benim mağaram, sen de gelebilirsin.', 'Gözlerim mavi-gri; ileride yeşile dönebilirmiş, şaşırma.',
    'Beni kucağına al, dünyayı sonra düşünürüz.', 'Bugün ilk kez patimi yaladım, çok yorucuymuş.', 'Tuvalet işini sen hallediyorsun, sağ ol; ben daha çözemedim.',
    'Sana bakınca mırlamaya başlıyorum, elimde değil.', 'Büyüyünce seni ben koruyacağım. Şimdilik sen beni koru.', 'Sıcak bir yer + sen = mükemmel gün.',
    'Bir daha okşa? Sadece bir daha. Tamam, bir daha.', 'Biberon saati mi geldi? Sordum sadece.', 'Avucuna sığıyorum; bu geçici, tadını çıkar.',
    'Burnum pembe, kalbim pembe, battaniyem pembe.', 'Uyudum, uyandım, yedim, uyudum. Verimli bir gün.', 'Dünyada {gun} gündür varım ve en sevdiğim şey sensin.',
    'Bugün {gun} günlük oldum, kutlama yok mu?', 'Gece nöbetçisi benim; sen uyu, ben esneyeyim.', 'Kuyruğumu yeni fark ettim. Benimmiş.',
    'Mırr mırr mırr. Çeviri: seni seviyorum.', 'Sesin dünyanın en güzel sesi. Mama kabından sonra.', 'Bir gün kanepenin üstüne çıkacağım. Bir gün.',
    'Ufak ufak kedi olmayı öğreniyorum, sabır.', 'Hapşırdım; hapşırık bana çok büyük geldi.', 'Patilerimde mini yastıklar var, baksana.',
    'Bugün göz kırpmayı denedim, iki gözle birden oldu.', 'Sen bir dakika gidince bile özlüyorum.', 'Bir şey söyleyeyim mi? Sen harikasın. Mırr.',
    'Tırnakların çok güzel; benimkiler minicik, kıskandım.', 'Kucak = ısıtıcı + sevgi. Onaylandı.', 'Ben minik bir gri buluttum, senin evine yağdım.'
  ];
  const BAGIR = 'BITCH!';
  const SELAM = ['Cemre! Geldin, mırr.', 'Selam, ben buradayım, battaniyede.', 'Bekliyordum. Esneyerek ama bekliyordum.', 'Gel gel, kucak boş.'];
  const OZLEDIM = ['Seni özledim… neredeydin?', 'Uzun zaman oldu; ben biraz büyüdüm bile.', 'Geldin! Battaniye sensiz soğuktu.'];
  const TEPKI = {
    kafa: ['mırr…', 'kafamı okşa, evet, orası', 'hmm, güzel', 'mırr mırr'],
    'kulak-sol': ['kulağım gıdıklandı', 'o kulak benim!', 'tık tık, duydum'],
    'kulak-sag': ['diğer kulağıma da', 'kulak oynatabiliyorum bak', 'hı?'],
    burun: ['…boop?', 'burnuma dokundun, tarihe geçti', 'pembe burun, dikkatli ol'],
    karin: ['gıdıklama! hihi', 'karnım süt dolu, dikkat', 'oradan okşama, uyuya kalırım'],
    'pati-sol': ['pati beşlik!', 'patim minik, belli mi?', 'çak bakalım'],
    'pati-sag': ['diğer pati de burada', 'pati sayısı: hâlâ dört', 'pat pat'],
    kuyruk: ['kuyruğum! o benim', 'kuyruğuma dokunulmaz, şaka, dokun', 'salla salla'],
    uyku: ['zZz… (uykuda mırıldandı)', 'şşş… rüyada yumak var', 'mırr… beş dakika daha'],
    kucak: ['burası dünyanın en sıcak yeri', 'kucakta mırlamak bedava', 'kalbin çok yakın, duyuyorum'],
    oksama: ['mırr…', 'evet, tam orası', 'mırr mırr', 'devam, ben durdurmam', 'gözlerim kapanıyor']
  };

  /* ------------------------------------------------------------ içerik: rüya oyunları */
  const OYUNLAR = {
    lazer: { ad: 'Lazer noktası', emoji: '🔴', aciklama: 'Parmağını gezdir; kırmızı noktayı kovalasın.', hiz: 260, yakala: ['Yakaladım! …yakaladım mı?', 'Nokta kaçtı yine.', 'Pati vurdum, ışık kaçtı.'], ipucu: 'Basılı tutup gezdir' },
    tuy: { ad: 'Tüy', emoji: '🪶', aciklama: 'Tüyü salla; yukarı kaldırırsan zıplar.', hiz: 230, yakala: ['Tüy! Tuttum!', 'Kıtır kıtır… bu tüymüş.', 'Bir daha salla!'], ipucu: 'Tüyü parmağınla gezdir' },
    fare: { ad: 'Oyuncak fare', emoji: '🐭', aciklama: 'Fare kaçıyor; üstüne dokunursan şaşırıp durur.', hiz: 215, yakala: ['Fare yakalandı, ünvan benim.', 'Avcı kedi, rapor: bir fare.', 'Kaçamazsın fare!'], ipucu: 'Fareye dokun, dursun' },
    yumak: { ad: 'Yumak', emoji: '🧶', aciklama: 'Yumağı fırlat; patisiyle geri vursun.', hiz: 250, yakala: ['Pat! Yumak gitti.', 'Bir daha at, bir daha!', 'Yumak benim, ip senin.'], ipucu: 'Yumağı tut ve fırlat' }
  };

  const RUH = [['😻', 'çok mutlu'], ['😽', 'sevgi dolu'], ['🥱', 'uykulu'], ['😴', 'uyudu durdu'], ['🍼', 'obur'], ['🐾', 'hareketli'], ['🙀', 'şaşkın']];
  const OLAYLAR = [['uyari', '🚼', 'Tuvalet uyardım'], ['cis', '💧', 'Çiş yaptı'], ['kaka', '💩', 'Kaka yaptı'], ['uyudu', '😴', 'Uyudu'], ['uyandi', '👀', 'Uyandı'], ['gegirdi', '🫧', 'Geğirdi']];
  const HATIRLATICI_TURLERI = [['veteriner', '🩺', 'Veteriner kontrolü'], ['asi', '💉', 'Aşı'], ['parazit', '💊', 'Parazit koruması'], ['tarti', '⚖️', 'Kilo ölçümü'], ['diger', '📌', 'Başka bir şey']];

  const SABIT_FOTOLAR = [
    { id: 'sabit:1', kucuk: (window.GIZLI ? window.GIZLI.url('assets/pittiksu/pittiksu-1-thumb.jpg') : 'assets/pittiksu/pittiksu-1-thumb.jpg'), buyuk: (window.GIZLI ? window.GIZLI.url('assets/pittiksu/pittiksu-1.jpg') : 'assets/pittiksu/pittiksu-1.jpg'), varsayilan: 'Avuç içi kadar 🤍', sabit: true },
    { id: 'sabit:2', kucuk: (window.GIZLI ? window.GIZLI.url('assets/pittiksu/pittiksu-2-thumb.jpg') : 'assets/pittiksu/pittiksu-2-thumb.jpg'), buyuk: (window.GIZLI ? window.GIZLI.url('assets/pittiksu/pittiksu-2.jpg') : 'assets/pittiksu/pittiksu-2.jpg'), varsayilan: 'Esneme şampiyonu', sabit: true }
  ];

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null, g = null;
  const ui = {};
  const zamanlar = new Set();
  const dinleyiciler = [];
  let raf = 0, canliTik = 0, sekme = 'oyna', basili = null, oksuyor = false, sonKalp = 0, balonT = 0, kirpT = 0, bosT = 0, mesgul = false, uykuDokunus = [];
  let oy = null;
  let fotolar = null, urlHavuzu = [];
  let sonTepki = '';

  const rastgele = a => CD.rastgele(a);
  function sonra(fn, ms) { const t = setTimeout(() => { zamanlar.delete(t); if (ctx) fn(); }, ms); zamanlar.add(t); return t; }
  function iptal(t) { clearTimeout(t); zamanlar.delete(t); }
  function hepsiniIptal() { zamanlar.forEach(clearTimeout); zamanlar.clear(); }
  function dinle(hedef, ad, fn, sec) { hedef.addEventListener(ad, fn, sec); dinleyiciler.push([hedef, ad, fn, sec]); }
  function isoYaz(t) { return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
  function saat(ts) { return CD.saatYaz(new Date(ts)); }
  function gunBasi(ts) { const t = new Date(ts); t.setHours(0, 0, 0, 0); return t.getTime(); }
  function bugunMu(ts) { return gunBasi(ts) === gunBasi(Date.now()); }

  function varsayilanDurum() {
    return { sevgi: 0, uyuyor: false, kucakta: false, duyulan: [], oyun: {}, bugun: { tarih: CD.bugun(), oksama: 0 }, sonGorulme: 0, selamGunu: '', mamaUyari: 0, kutlananHafta: -1 };
  }
  function varsayilanGunluk() {
    return { mamalar: [], mamaAralik: 0, kilolar: [], hatirlatici: [], olaylar: [], notlar: [], albumNot: {} };
  }
  function yukle() {
    d = Object.assign(varsayilanDurum(), ctx.depo.al('durum', {}));
    if (!Array.isArray(d.duyulan)) d.duyulan = [];
    if (!d.oyun || typeof d.oyun !== 'object') d.oyun = {};
    if (!d.bugun || d.bugun.tarih !== CD.bugun()) d.bugun = { tarih: CD.bugun(), oksama: 0 };
    g = Object.assign(varsayilanGunluk(), ctx.depo.al('gunluk', {}));
    ['mamalar', 'kilolar', 'hatirlatici', 'olaylar', 'notlar'].forEach(k => { if (!Array.isArray(g[k])) g[k] = []; });
    if (!g.albumNot || typeof g.albumNot !== 'object') g.albumNot = {};
  }
  function kaydet() {
    if (!ctx) return;
    d.sonGorulme = Date.now();
    ctx.depo.yaz('durum', d);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function gunlukKaydet() {
    if (!ctx) return;
    g.mamalar = g.mamalar.slice(-240); g.olaylar = g.olaylar.slice(-400); g.notlar = g.notlar.slice(0, 200); g.kilolar = g.kilolar.slice(-150);
    ctx.depo.yaz('gunluk', g);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function ipucuMetni() {
    if (d.uyuyor) return 'Uyuyor, şşş 💤';
    const sm = sonrakiMama();
    if (sm && sm.gecikti) return 'Mama saati geldi 🍼';
    const n = g.mamalar.filter(bugunMu).length;
    if (n > 0) return 'Bugün ' + n + ' kez mama yedi 🍼';
    if (d.sonGorulme && Date.now() - d.sonGorulme > 6 * 3600000) return 'Seni özledi 🐾';
    return yasGun() >= 0 ? yasGun() + ' günlük, mırlıyor 🐾' : '';
  }

  /* ------------------------------------------------------------ yaş */
  function dogumTarihi() {
    const cfg = (ctx.config.PITTIKSU && ctx.config.PITTIKSU.DOGUM_TARIHI) || '';
    const ok = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
    const kayit = ctx.depo.al('dogumTarihi', '');
    const varsayilan = ctx.depo.al('dogumVarsayilan', false);
    if (ok(kayit) && !varsayilan) return kayit;
    if (ok(cfg)) return cfg;
    if (ok(kayit)) return kayit;
    const t = new Date(); t.setDate(t.getDate() - 10);
    const iso = isoYaz(t);
    ctx.depo.yaz('dogumTarihi', iso); ctx.depo.yaz('dogumVarsayilan', true);
    return iso;
  }
  function dogumVarsayilanMi() {
    const cfg = (ctx.config.PITTIKSU && ctx.config.PITTIKSU.DOGUM_TARIHI) || '';
    return !!ctx.depo.al('dogumVarsayilan', false) && !/^\d{4}-\d{2}-\d{2}$/.test(cfg);
  }
  function yasGun() { const f = CD.gunFarki(dogumTarihi()); return f == null ? 10 : Math.max(0, f); }
  function asama(gun) { gun = gun == null ? yasGun() : gun; return ASAMALAR.find(a => gun >= a.bas && gun < a.bit) || ASAMALAR[ASAMALAR.length - 1]; }
  function yasMetni() {
    const gn = yasGun(), h = Math.floor(gn / 7), k = gn % 7;
    if (gn < 7) return gn + ' günlük';
    return h + ' hafta' + (k ? ' ' + k + ' gün' : '') + 'lük';
  }
  function mamaAralik() { return g.mamaAralik || asama().mamaSaat || 0; }
  function sonrakiMama() {
    const ar = mamaAralik(); if (!ar || !g.mamalar.length) return null;
    const son = Math.max.apply(null, g.mamalar), sonraki = son + ar * 3600000;
    return { son, sonraki, gecikti: Date.now() > sonraki, kalanDk: Math.round((sonraki - Date.now()) / 60000) };
  }

  /* ------------------------------------------------------------ SVG */
  const IKON = '<svg viewBox="0 0 64 64"><path d="M12 30 8 8l16 12zM52 30l4-22-16 12z" fill="var(--pittiksu-tuy)"/><path d="M14 26 12 15l9 7zM50 26l2-11-9 7z" fill="var(--pittiksu-kulak)"/><circle cx="32" cy="36" r="24" fill="var(--pittiksu-tuy)"/><ellipse cx="23" cy="36" rx="5.2" ry="6" fill="var(--pittiksu-goz)"/><ellipse cx="41" cy="36" rx="5.2" ry="6" fill="var(--pittiksu-goz)"/><ellipse cx="23" cy="37" rx="2.2" ry="4" fill="var(--pittiksu-goz-koyu)"/><ellipse cx="41" cy="37" rx="2.2" ry="4" fill="var(--pittiksu-goz-koyu)"/><circle cx="21.5" cy="33.5" r="1.6" fill="#fff"/><circle cx="39.5" cy="33.5" r="1.6" fill="#fff"/><path d="M29.5 45h5L32 47.6z" fill="var(--pittiksu-burun)"/><path d="M32 47.6v2.4m0 0c-1.6 2.4-4 2.4-5 .8m5-.8c1.6 2.4 4 2.4 5 .8" stroke="var(--pixel-cizgi)" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>';

  function kediSvg() {
    return '<svg class="pittiksu-svg" viewBox="0 0 260 244" aria-hidden="true" focusable="false">' +
      '<ellipse class="pk-golge" cx="130" cy="230" rx="86" ry="10"/>' +
      '<g class="pk-kucak pk-kucak-arka"><path d="M18 152c-12 40-4 82 46 86h132c50-4 58-46 46-86-30-26-70-34-112-34S48 126 18 152z"/></g>' +
      '<g class="pk-govde-g">' +
        '<g class="pk-kuyruk"><path class="pk-kuyruk-cizgi" d="M186 190c30-6 46-30 32-52-6-9-16-9-21-3"/></g>' +
        '<ellipse class="pk-tuy" cx="130" cy="178" rx="66" ry="42"/>' +
        '<ellipse class="pk-tuy-acik" cx="130" cy="190" rx="38" ry="24" opacity=".55"/>' +
        '<g class="pk-pati pk-pati-sol"><ellipse class="pk-tuy" cx="98" cy="214" rx="22" ry="12"/><path class="pk-pati-cizgi" d="M84 218v-6M92 221v-8M100 221v-8M108 218v-6"/></g>' +
        '<g class="pk-pati pk-pati-sag"><ellipse class="pk-tuy" cx="162" cy="214" rx="22" ry="12"/><path class="pk-pati-cizgi" d="M148 218v-6M156 221v-8M164 221v-8M172 218v-6"/></g>' +
        '<g class="pk-yumak"><circle class="pk-yumak-top" cx="52" cy="214" r="13"/><path class="pk-yumak-ip" d="M42 208c6 8 14 8 20-2M40 216c8 6 18 4 24-4M46 224c6 2 12 0 16-4"/></g>' +
      '</g>' +
      '<g class="pk-kafa-g">' +
        '<g class="pk-kulak pk-kulak-sol"><path class="pk-tuy" d="M64 80L48 20l60 36z"/><path class="pk-kulak-ic" d="M68 71l-10-36 38 27z"/></g>' +
        '<g class="pk-kulak pk-kulak-sag"><path class="pk-tuy" d="M196 80l16-60-60 36z"/><path class="pk-kulak-ic" d="M192 71l10-36-38 27z"/></g>' +
        '<ellipse class="pk-tuy" cx="130" cy="108" rx="78" ry="64"/>' +
        '<ellipse class="pk-tuy-acik" cx="130" cy="134" rx="38" ry="20" opacity=".45"/>' +
        '<g class="pk-goz pk-goz-sol"><g class="pk-goz-acik"><ellipse class="pk-iris" cx="100" cy="110" rx="14" ry="16"/><ellipse class="pk-bebek" cx="101" cy="112" rx="6.5" ry="11"/><circle class="pk-parilti" cx="95" cy="103" r="4"/><circle class="pk-parilti" cx="106" cy="118" r="1.8"/></g><path class="pk-goz-kapali" d="M86 110q14-9 28 0"/><path class="pk-goz-mutlu" d="M86 113q14-14 28 0"/></g>' +
        '<g class="pk-goz pk-goz-sag"><g class="pk-goz-acik"><ellipse class="pk-iris" cx="160" cy="110" rx="14" ry="16"/><ellipse class="pk-bebek" cx="161" cy="112" rx="6.5" ry="11"/><circle class="pk-parilti" cx="155" cy="103" r="4"/><circle class="pk-parilti" cx="166" cy="118" r="1.8"/></g><path class="pk-goz-kapali" d="M146 110q14-9 28 0"/><path class="pk-goz-mutlu" d="M146 113q14-14 28 0"/></g>' +
        '<circle class="pk-yanak" cx="78" cy="134" r="9"/><circle class="pk-yanak" cx="182" cy="134" r="9"/>' +
        '<g class="pk-burun-g"><path class="pk-burun" d="M123 130h14l-7 7z"/></g>' +
        '<path class="pk-agiz" d="M130 137v4m0 0c-2 4-7 4-9 1m9-1c2 4 7 4 9 1"/>' +
        '<g class="pk-agiz-acik"><ellipse class="pk-agiz-ic" cx="130" cy="148" rx="10" ry="11"/><ellipse class="pk-dil" cx="130" cy="154" rx="6" ry="4"/></g>' +
        '<g class="pk-biyik"><path d="M56 126h26M54 134h28M178 126h26M178 134h28"/></g>' +
      '</g>' +
      '<g class="pk-kucak pk-kucak-on"><path d="M28 176c-10 34 4 62 48 64h108c44-2 58-30 48-64-30 22-66 30-102 30s-72-8-102-30z"/><path class="pk-kucak-ilmek" d="M52 214c14 6 30 8 50 8M72 226c16 4 36 6 60 4M148 220c16 0 30-2 44-8"/></g>' +
      '<g class="pk-biberon"><g class="pk-biberon-ic" transform="rotate(-42 132 142)"><path class="pk-biberon-emzik" d="M126 153l6-11 6 11z"/><rect class="pk-biberon-halka" x="120" y="152" width="24" height="7" rx="3"/><rect class="pk-biberon-govde" x="122" y="158" width="20" height="46" rx="8"/><rect class="pk-biberon-sut" x="125" y="180" width="14" height="21" rx="5"/></g></g>' +
      '<g class="pk-vurlar">' +
        '<path class="pk-vur" data-bolge="kulak-sol" d="M42 12l24 70 46-30z"/><path class="pk-vur" data-bolge="kulak-sag" d="M218 12l-24 70-46-30z"/>' +
        '<ellipse class="pk-vur" data-bolge="kafa" cx="130" cy="104" rx="78" ry="62"/>' +
        '<circle class="pk-vur" data-bolge="burun" cx="130" cy="136" r="17"/>' +
        '<ellipse class="pk-vur" data-bolge="karin" cx="130" cy="186" rx="60" ry="32"/>' +
        '<ellipse class="pk-vur" data-bolge="pati-sol" cx="98" cy="214" rx="24" ry="14"/><ellipse class="pk-vur" data-bolge="pati-sag" cx="162" cy="214" rx="24" ry="14"/>' +
        '<path class="pk-vur pk-vur-kuyruk" data-bolge="kuyruk" d="M186 190c30-6 46-30 32-52-6-9-16-9-21-3"/>' +
      '</g>' +
    '</svg>';
  }

  /* ------------------------------------------------------------ sahne kurulumu */
  function sahneKur() {
    const sahne = ctx.el('div.sahne.battaniye-zemin.pittiksu-sahne', { 'aria-label': 'Pıttıksu battaniyede' });
    const balonYer = ctx.el('div.pittiksu-balon-yer', [ctx.el('div.balon.pittiksu-balon', { role: 'status', 'aria-live': 'polite' })]);
    const alt = ctx.el('div.pittiksu-alt', [ctx.el('span.rozet.goz.pittiksu-yas'), ctx.el('span.rozet.pittiksu-hal', { hidden: true }), ctx.el('span.pittiksu-ipucu', { 'aria-hidden': 'true' }, 'Okşamak için dokun ve gezdir')]);
    const kediYer = ctx.el('div.pittiksu-kedi-yer', { role: 'img', tabindex: '0', 'aria-label': 'Pıttıksu; okşamak için dokun ve gezdir' });
    kediYer.insertAdjacentHTML('beforeend', kediSvg());
    const zzz = ctx.el('div.pittiksu-zzz', { 'aria-hidden': 'true' }, [ctx.el('span', 'z'), ctx.el('span', 'z'), ctx.el('span', 'z')]);
    const hedef = ctx.el('div.pittiksu-hedef', { 'aria-hidden': 'true', hidden: true });
    const ip = ctx.svg('<svg class="pittiksu-ip" aria-hidden="true"><path/></svg>');
    const hud = ctx.el('div.pittiksu-hud', { hidden: true }, [
      ctx.el('span.pittiksu-hud-ad'), ctx.el('span.pittiksu-hud-skor.sayi', '0'),
      ctx.el('button.dugme-ikincil.kucuk.pittiksu-hud-bitir', { type: 'button', onclick: () => oyunBitir(true) }, 'Bitir')
    ]);
    const bagir = ctx.el('div.pittiksu-bagir', { 'aria-hidden': 'true' });
    sahne.append(balonYer, ip, kediYer, zzz, alt, hedef, hud, bagir);
    ctx.pati(sahne);
    Object.assign(ui, {
      sahne, balon: balonYer.firstChild, alt, yas: alt.querySelector('.pittiksu-yas'), hal: alt.querySelector('.pittiksu-hal'), ipucu: alt.querySelector('.pittiksu-ipucu'), kediYer, svg: kediYer.querySelector('.pittiksu-svg'),
      zzz, hedef, ip, ipYol: ip.querySelector('path'), hud, hudAd: hud.querySelector('.pittiksu-hud-ad'), hudSkor: hud.querySelector('.pittiksu-hud-skor'), bagir
    });
    ui.kulakSol = ui.svg.querySelector('.pk-kulak-sol'); ui.kulakSag = ui.svg.querySelector('.pk-kulak-sag');
    ui.patiSol = ui.svg.querySelector('.pk-pati-sol'); ui.patiSag = ui.svg.querySelector('.pk-pati-sag');
    ui.kuyruk = ui.svg.querySelector('.pk-kuyruk'); ui.burun = ui.svg.querySelector('.pk-burun-g'); ui.yumak = ui.svg.querySelector('.pk-yumak');

    // dokunma
    ui.svg.addEventListener('pointerdown', dokunBasla);
    ui.svg.addEventListener('pointermove', dokunHareket);
    ui.svg.addEventListener('pointerup', dokunBitir);
    ui.svg.addEventListener('pointercancel', dokunBitir);
    ui.svg.addEventListener('lostpointercapture', dokunBitir);
    kediYer.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const m = ctx.efekt.merkez(kediYer); tepki('kafa', m.x, m.y); } });
    // oyun dokunuşları (sahne)
    sahne.addEventListener('pointerdown', oyunBas);
    sahne.addEventListener('pointermove', oyunHareket);
    sahne.addEventListener('pointerup', oyunBirak);
    sahne.addEventListener('pointercancel', oyunBirak);
    durumGuncelle();
    return sahne;
  }

  function durumGuncelle() {
    if (!ui.yas) return;
    ui.yas.textContent = yasMetni();
    const s = ui.svg.classList;
    s.toggle('uyuyor', !!d.uyuyor); s.toggle('kucakta', !!d.kucakta);
    ui.sahne.classList.toggle('pittiksu-gece', !!d.uyuyor);
    ui.zzz.classList.toggle('goster', !!d.uyuyor && !oy);
    let hal = '';
    if (oy) hal = OYUNLAR[oy.tur].emoji + ' rüya oyunu';
    else if (d.uyuyor) hal = '💤 uyuyor';
    else if (d.kucakta) hal = '🤲 kucakta';
    ui.hal.textContent = hal; ui.hal.hidden = !hal;
    ui.ipucu.textContent = oy ? OYUNLAR[oy.tur].ipucu : d.uyuyor ? 'Şşş… uyuyor. Uyandırmak için alttan "Uyandır"' : d.kucakta ? 'Sallanıyor; okşamaya devam' : 'Okşamak için dokun ve gezdir';
  }

  /* ------------------------------------------------------------ konuşma balonu */
  function soyle(metin, sure) {
    if (!ui.balon) return;
    metin = String(metin).replace('{gun}', yasGun());
    ui.balon.textContent = metin; ui.balon.classList.add('goster');
    iptal(balonT); balonT = sonra(() => ui.balon.classList.remove('goster'), sure || 2600);
  }
  function bagir() {
    if (!ui.bagir) return;
    ui.balon.classList.remove('goster');
    ui.bagir.textContent = BAGIR; ui.bagir.classList.remove('goster'); void ui.bagir.offsetWidth; ui.bagir.classList.add('goster');
    ui.svg.classList.add('bagiriyor');
    ctx.ses.miyav(); ctx.ses.gum();
    ctx.efekt.sarsinti(ui.sahne, 2);
    const m = ctx.efekt.merkez(ui.kediYer);
    ctx.efekt.emoji(m.x, m.y - 40, '❗', 4); ctx.efekt.yildiz(m.x, m.y - 30, 6);
    sonra(() => { ui.bagir.classList.remove('goster'); ui.svg.classList.remove('bagiriyor'); soyle('…pardon, içimden geldi.', 2200); }, 1500);
  }
  function sozSoyle(indeks) {
    if (oy) return;
    let i = indeks;
    if (i == null) {
      const bagirsin = Math.random() < 0.14 && sonTepki !== 'bagir';
      if (bagirsin) { sonTepki = 'bagir'; bagir(); d.duyulan.indexOf(-1) < 0 && d.duyulan.push(-1); kaydet(); sozlerListesiYenile(); return; }
      const duyulmamis = SOZLER.map((s, k) => k).filter(k => d.duyulan.indexOf(k) < 0);
      i = duyulmamis.length && Math.random() < 0.7 ? rastgele(duyulmamis) : Math.floor(Math.random() * SOZLER.length);
    }
    sonTepki = 'soz';
    if (d.duyulan.indexOf(i) < 0) { d.duyulan.push(i); kaydet(); sozlerListesiYenile(); }
    if (d.uyuyor) { uykudaKipirda(); return; }
    ctx.ses.minikMiyav();
    ui.svg.classList.add('konusuyor'); sonra(() => ui.svg.classList.remove('konusuyor'), 500);
    soyle(SOZLER[i], 3200);
  }

  /* ------------------------------------------------------------ dokunma / okşama */
  function bolgeBul(e) { const t = e.target && e.target.closest ? e.target.closest('.pk-vur') : null; return t ? t.dataset.bolge : 'kafa'; }
  function dokunBasla(e) {
    if (oy || mesgul) return;
    e.preventDefault();
    try { ui.svg.setPointerCapture(e.pointerId); } catch (err) {}
    basili = { id: e.pointerId, bolge: bolgeBul(e), t: Date.now(), x: e.clientX, y: e.clientY, yol: 0 };
    ctx.ses.pit();
    if (d.uyuyor) return;
    if (basili.bolge === 'kafa' || basili.bolge === 'karin') oksamaBasla(e);
  }
  function dokunHareket(e) {
    if (!basili || basili.id !== e.pointerId) return;
    const dx = e.clientX - basili.x, dy = e.clientY - basili.y;
    basili.yol += Math.hypot(dx, dy); basili.x = e.clientX; basili.y = e.clientY;
    if (!oksuyor && !d.uyuyor && basili.yol > 14) oksamaBasla(e);
    if (oksuyor && Date.now() - sonKalp > 280 && basili.yol > 6) { sonKalp = Date.now(); ctx.efekt.kalp(e.clientX, e.clientY, 2); }
  }
  function dokunBitir(e) {
    if (!basili || (e.pointerId != null && basili.id !== e.pointerId)) return;
    const b = basili; basili = null;
    const kisa = Date.now() - b.t < 260 && b.yol < 10;
    if (oksuyor) oksamaBitir(b.yol > 40);
    if (kisa) tepki(b.bolge, b.x, b.y);
  }
  function oksamaBasla(e) {
    if (oksuyor) return;
    oksuyor = true;
    ui.svg.classList.add('mutlu');
    ctx.ses.mirrBaslat(d.kucakta ? 1 : 0.7);
    sonKalp = Date.now(); ctx.efekt.kalp(e.clientX, e.clientY, 3);
    if (Math.random() < 0.5) soyle(rastgele(TEPKI.oksama), 1800);
  }
  function oksamaBitir(uzun) {
    oksuyor = false;
    sonra(() => { if (!oksuyor) ui.svg.classList.remove('mutlu'); }, 500);
    ctx.ses.mirrDur();
    if (uzun) { d.sevgi++; d.bugun.oksama++; kaydet(); sevgiYenile(); }
  }
  function tepki(bolge, x, y) {
    if (mesgul) return;
    if (d.uyuyor) { uykudaKipirda(x, y); return; }
    const s = ui.svg.classList;
    const yeniden = (el, sinif, ms) => { el.classList.remove(sinif); void el.getBoundingClientRect(); el.classList.add(sinif); sonra(() => el.classList.remove(sinif), ms); };
    switch (bolge) {
      case 'kulak-sol': yeniden(ui.kulakSol, 'oynat', 700); ctx.ses.tik(); break;
      case 'kulak-sag': yeniden(ui.kulakSag, 'oynat', 700); ctx.ses.tik(); break;
      case 'burun': yeniden(ui.burun, 'boop', 500); yeniden(ui.svg, 'kirp', 220); ctx.ses.minikMiyav(); ctx.efekt.yildiz(x, y, 3); break;
      case 'karin': yeniden(ui.svg, 'gidik', 900); ctx.ses.minikMiyav(); ctx.efekt.kalp(x, y, 3); break;
      case 'pati-sol': yeniden(ui.patiSol, 'kaldir', 700); ctx.ses.hop(); ctx.efekt.pati(x, y); break;
      case 'pati-sag': yeniden(ui.patiSag, 'kaldir', 700); ctx.ses.hop(); ctx.efekt.pati(x, y); break;
      case 'kuyruk': yeniden(ui.kuyruk, 'hizli', 1200); ctx.ses.tik(); break;
      default: s.add('mutlu'); sonra(() => { if (!oksuyor) s.remove('mutlu'); }, 900); ctx.ses.mirrKisa(900); ctx.efekt.kalp(x, y, 4); d.sevgi++; d.bugun.oksama++; kaydet(); sevgiYenile();
    }
    const liste = d.kucakta && Math.random() < 0.4 ? TEPKI.kucak : (TEPKI[bolge] || TEPKI.kafa);
    soyle(rastgele(liste), 2000);
  }
  function uykudaKipirda(x, y) {
    ui.kulakSol.classList.add('oynat'); sonra(() => ui.kulakSol.classList.remove('oynat'), 700);
    ctx.ses.mirrKisa(700);
    soyle(rastgele(TEPKI.uyku), 1800);
    const t = Date.now(); uykuDokunus = uykuDokunus.filter(z => t - z < 2500); uykuDokunus.push(t);
    if (uykuDokunus.length >= 4) { uykuDokunus = []; uyandir(); }
  }

  /* ------------------------------------------------------------ kucak / uyku / mama */
  function kucakDegistir() {
    if (oy) return;
    d.kucakta = !d.kucakta;
    if (d.kucakta && d.uyuyor) { d.uyuyor = false; }
    kaydet(); durumGuncelle(); altbarKur();
    ctx.ses.hop();
    const m = ctx.efekt.merkez(ui.kediYer);
    if (d.kucakta) { ctx.efekt.kalp(m.x, m.y - 30, 6); ctx.ses.mirrKisa(1400); soyle(rastgele(TEPKI.kucak), 2400); }
    else { ctx.efekt.toz(m.x, m.y + 60, 4); soyle('Battaniye de iyi ama kucak daha iyiydi.', 2200); }
  }
  function uyut() {
    if (oy || d.uyuyor) return;
    d.uyuyor = true; d.kucakta = false; kaydet(); durumGuncelle(); altbarKur();
    ctx.ses.blop(); soyle('esne… iyi geceler Cemre', 2200);
    g.olaylar.push({ t: Date.now(), tur: 'uyudu' }); gunlukKaydet();
    if (sekme === 'gunluk') sekmeYenile();
  }
  function uykuSuresi() {
    const son = g.olaylar.slice().reverse().find(o => o.tur === 'uyudu');
    if (!son) return '';
    const dk = Math.round((Date.now() - son.t) / 60000);
    if (dk < 1) return '';
    return dk >= 60 ? Math.floor(dk / 60) + ' saat' + (dk % 60 ? ' ' + (dk % 60) + ' dakika' : '') : dk + ' dakika';
  }
  function uyandir() {
    if (!d.uyuyor) return;
    const sure = uykuSuresi();
    d.uyuyor = false; kaydet();
    esne(() => { durumGuncelle(); altbarKur(); soyle(sure ? 'Günaydın… ' + sure + ' uyumuşum.' : 'Günaydın… kaç saat uyudum?', 2600); });
    g.olaylar.push({ t: Date.now(), tur: 'uyandi' }); gunlukKaydet();
    if (sekme === 'gunluk') sekmeYenile();
  }
  function esne(bitince) {
    if (mesgul) { if (bitince) bitince(); return; }
    mesgul = true;
    ui.svg.classList.remove('uyuyor'); ui.svg.classList.add('esniyor');
    ctx.ses.minikMiyav();
    sonra(() => { ui.svg.classList.remove('esniyor'); mesgul = false; if (bitince) bitince(); }, ctx.azHareket ? 300 : 1500);
  }
  function mamaVer(e) {
    if (oy) return;
    if (mesgul) {
      if (ui.svg.classList.contains('emiyor')) { ctx.toast('Bir saniye, ağzı dolu.'); return; }
      // esniyor/uyanıyor: animasyonsuz ama kayıt düşer (Günlük'teki düğme her zaman çalışsın)
      g.mamalar.push(Date.now()); gunlukKaydet(); ctx.ses.yut(); ctx.toast('Mama saati kaydedildi 🍼');
      if (sekme === 'gunluk') sekmeYenile();
      return;
    }
    const ts = Date.now();
    g.mamalar.push(ts); gunlukKaydet();
    const uyuyordu = d.uyuyor;
    d.uyuyor = false; kaydet(); durumGuncelle();
    mesgul = true;
    ui.svg.classList.add('emiyor');
    ctx.ses.yut();
    const m = ctx.efekt.merkez(ui.kediYer);
    let sayac = 0;
    const emme = () => { if (!ctx) return; sayac++; ctx.ses.yut(); ctx.efekt.kalp(m.x + 30, m.y - 20, 1); if (sayac < 4) sonra(emme, 520); };
    sonra(emme, 520);
    sonra(() => {
      ui.svg.classList.remove('emiyor'); mesgul = false;
      d.uyuyor = uyuyordu; durumGuncelle(); altbarKur();
      soyle(rastgele(['Mırr, karnım doldu.', 'Bu biberonu seviyorum.', 'Geğirt beni, sonra uyuyacağım.', 'Süt bıyığım oldu mu?']), 2400);
      ctx.toast('Mama saati kaydedildi 🍼');
      if (yasGun() < 21) sonra(() => { if (ctx) ctx.toast('Mamadan sonra tuvalet uyarımını unutma 🚼', 3200); }, 2800);
      if (sekme === 'gunluk') sekmeYenile();
    }, ctx.azHareket ? 600 : 2600);
  }

  /* ------------------------------------------------------------ boş zaman (idle) döngüsü */
  function kirpDongu() {
    iptal(kirpT);
    kirpT = sonra(() => {
      if (!d.uyuyor && !oksuyor && !mesgul && !ui.svg.classList.contains('mutlu')) {
        ui.svg.classList.add('kirp'); sonra(() => ui.svg.classList.remove('kirp'), 170);
        if (Math.random() < 0.25) sonra(() => { ui.svg.classList.add('kirp'); sonra(() => ui.svg.classList.remove('kirp'), 150); }, 260);
      }
      kirpDongu();
    }, 2200 + Math.random() * 3200);
  }
  function bosDongu() {
    iptal(bosT);
    bosT = sonra(() => {
      if (!ctx.azHareket && !oy && !oksuyor && !mesgul && !basili && document.visibilityState === 'visible') {
        if (d.uyuyor) {
          if (Math.random() < 0.5) { ui.kulakSag.classList.add('oynat'); sonra(() => ui.kulakSag.classList.remove('oynat'), 700); }
        } else {
          const r = Math.random();
          if (r < 0.25) { ui.kulakSol.classList.add('oynat'); sonra(() => ui.kulakSol.classList.remove('oynat'), 700); }
          else if (r < 0.45) { ui.kuyruk.classList.add('hizli'); sonra(() => ui.kuyruk.classList.remove('hizli'), 1400); }
          else if (r < 0.65) esne();
          else if (r < 0.85 && !d.kucakta) { ui.yumak.classList.add('goster'); ui.patiSol.classList.add('oynuyor'); ctx.ses.tik(); sonra(() => { ui.patiSol.classList.remove('oynuyor'); sonra(() => ui.yumak.classList.remove('goster'), 1200); }, 2200); }
          else if (Math.random() < 0.6) soyle(rastgele(['…', 'mırr?', 'Cemre?', 'kucak?', 'esne…']), 1600);
        }
      }
      bosDongu();
    }, 8000 + Math.random() * 9000);
  }

  /* ------------------------------------------------------------ alt çubuk */
  function altbarKur() {
    if (!ctx) return;
    if (oy) { ctx.altbar([{ id: 'bitir', ad: 'Oyunu bitir', ikon: '🛏️', birincil: true, tikla() { oyunBitir(true); } }]); return; }
    ctx.altbar([
      { id: 'mama', ad: 'Mama ver', ikon: '🍼', birincil: true, tikla: mamaVer },
      { id: 'kucak', ad: d.kucakta ? 'Bırak' : 'Kucak', ikon: '🤲', basili: d.kucakta, tikla: kucakDegistir },
      { id: 'uyku', ad: d.uyuyor ? 'Uyandır' : 'Uyut', ikon: d.uyuyor ? '☀️' : '💤', basili: d.uyuyor, tikla() { d.uyuyor ? uyandir() : uyut(); } },
      { id: 'soz', ad: 'Söyle', ikon: '💬', tikla() { sozSoyle(); } },
      { id: 'oyna', ad: 'Oyna', ikon: '🧶', tikla() { sekmeSec('oyna'); ui.sekmeler.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' }); } }
    ]);
  }

  /* ------------------------------------------------------------ sekmeler */
  const SEKMELER = [['oyna', '🧶', 'Oyna'], ['album', '📷', 'Albüm'], ['gunluk', '📔', 'Günlük'], ['ipuclari', '🌡️', 'İpuçları'], ['sozler', '💬', 'Sözler']];
  function sekmelerKur() {
    const kap = ctx.el('div.cipler.pittiksu-sekmeler', { role: 'tablist', 'aria-label': 'Pıttıksu bölümleri' });
    SEKMELER.forEach(([id, ikon, ad]) => {
      kap.appendChild(ctx.el('button.cip', { type: 'button', role: 'tab', id: 'pittiksuSekme-' + id, 'aria-selected': 'false', 'aria-controls': 'pittiksuPanel', data: { sekme: id }, onclick: () => { ctx.ses.tik(); sekmeSec(id); } }, [ctx.el('span', { 'aria-hidden': 'true' }, ikon), ctx.el('span', ad)]));
    });
    ui.sekmeler = kap;
    ui.panel = ctx.el('div.icerik.pittiksu-panel#pittiksuPanel', { role: 'tabpanel' });
    return kap;
  }
  function sekmeSec(id) {
    sekme = id; ctx.depo.yaz('sekme', id);
    Array.from(ui.sekmeler.children).forEach(c => c.setAttribute('aria-selected', c.dataset.sekme === id ? 'true' : 'false'));
    const aktif = ui.sekmeler.querySelector('[data-sekme="' + id + '"]'); if (aktif && aktif.scrollIntoView) { try { aktif.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' }); } catch (e) {} }
    sekmeYenile();
  }
  function sekmeYenile() {
    if (!ui.panel) return;
    ui.panel.innerHTML = '';
    const kur = { oyna: oynaKur, album: albumKur, gunluk: gunlukKur, ipuclari: ipuclariKur, sozler: sozlerKur }[sekme] || oynaKur;
    const icerik = kur();
    if (icerik) ui.panel.append(icerik);
    sevgiYenile(); sozlerListesiYenile();
  }

  /* ============================================================ OYNA */
  function oynaKur() {
    const kap = ctx.el('div.dikey');
    const giris = ctx.el('div.yama.pittiksu-oyun-giris', [
      ctx.el('h2.baslik.baslik-lg', 'Rüya oyunları'),
      ctx.el('p.ikincil', 'Pıttıksu daha yürüyemiyor ama rüyasında koşuyor. Bir oyun seç; battaniye rüyaya dönsün.')
    ]);
    const izgara = ctx.el('div.izgara-2.pittiksu-oyunlar');
    Object.keys(OYUNLAR).forEach(id => {
      const o = OYUNLAR[id], rekor = d.oyun[id] || 0;
      izgara.appendChild(ctx.el('button.yama.dokun.pittiksu-oyun-kart', { type: 'button', 'aria-label': o.ad + ' oyununu başlat', onclick: () => oyunBaslat(id) }, [
        ctx.el('span.pittiksu-oyun-emoji', { 'aria-hidden': 'true' }, o.emoji),
        ctx.el('span.pittiksu-oyun-ad', o.ad),
        ctx.el('span.sessiz', o.aciklama),
        rekor ? ctx.el('span.rozet.inci', 'rekor ' + rekor) : ctx.el('span.rozet.gri', 'henüz oynanmadı')
      ]));
    });
    const sevgi = sevgiKarti();
    kap.append(giris, izgara, sevgi);
    return kap;
  }
  function sevgiKarti() {
    const kart = ctx.el('div.yama.pittiksu-sevgi', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Sevgi sayacı'), ctx.el('span.rozet.pittiksu-sevgi-rozet')]),
      ctx.el('div.pittiksu-kalpler', { 'aria-hidden': 'true' }),
      ctx.el('p.sessiz.pittiksu-sevgi-metin')
    ]);
    ui.sevgiKart = kart; sevgiYenile();
    return kart;
  }
  function sevgiYenile() {
    if (!ui.sevgiKart || !ui.sevgiKart.isConnected) return;
    const seviye = Math.min(5, Math.floor(d.sevgi / 10));
    const kalpler = ui.sevgiKart.querySelector('.pittiksu-kalpler'); kalpler.innerHTML = '';
    for (let i = 0; i < 5; i++) kalpler.appendChild(ctx.el('span.pittiksu-kalp' + (i < seviye ? '.dolu' : ''), '♥'));
    ui.sevgiKart.querySelector('.pittiksu-sevgi-rozet').textContent = 'bugün ' + d.bugun.oksama + ' okşama';
    const adlar = ['yeni tanıştınız', 'ısınıyor', 'mırlıyor', 'senin kedin', 'ayrılmaz ikili', 'ömür boyu'];
    ui.sevgiKart.querySelector('.pittiksu-sevgi-metin').textContent = 'Toplam ' + d.sevgi + ' okşama · ' + adlar[seviye] + (seviye < 5 ? ' · sonraki kalbe ' + (10 - d.sevgi % 10) + ' okşama' : '');
  }

  /* ------------------------------------------------------------ oyun motoru (sahne üstünde DOM, rAF) */
  function oyunBaslat(tur) {
    if (oy || !OYUNLAR[tur]) return;
    if (d.uyuyor) { d.uyuyor = false; }
    if (d.kucakta) { d.kucakta = false; }
    kaydet();
    ui.balon.classList.remove('goster'); ui.yumak.classList.remove('goster');
    const r = ui.sahne.getBoundingClientRect();
    const W = r.width, H = r.height;
    oy = { tur, skor: 0, W, H, kediH: H * 0.42, kedi: { x: W / 2, y: H - 8, yon: 1, atla: 0, hiz: OYUNLAR[tur].hiz }, hedef: { x: W * 0.7, y: H * 0.45, vx: 0, vy: 0, hedefX: W * 0.7, hedefY: H * 0.45, sersem: 0, gizli: 0, sallan: 0 }, isaret: { x: 0, y: 0, basili: false, tut: false, gecmis: [] }, sonYakala: 0, sonZaman: 0, gezT: 0, bas: performance.now(), sonKarar: 0 };
    ui.sahne.classList.add('oyunda'); ui.sahne.dataset.oyun = tur;
    ui.hedef.dataset.tur = tur; ui.hedef.hidden = false; ui.hedef.textContent = tur === 'lazer' ? '' : OYUNLAR[tur].emoji;
    ui.hud.hidden = false; ui.hudAd.textContent = OYUNLAR[tur].emoji + ' ' + OYUNLAR[tur].ad; ui.hudSkor.textContent = '0';
    ui.ip.classList.toggle('goster', tur === 'yumak');
    ui.svg.classList.remove('uyuyor', 'kucakta');
    durumGuncelle(); altbarKur();
    ctx.ses.parilti();
    soyle(rastgele(['Rüyada koşabiliyorum!', 'Hazırım!', 'Bacaklarım rüyada çalışıyor.']) + ' ' + OYUNLAR[tur].ipucu + '.', 3400);
    if (tur === 'fare') { oy.hedef.x = -30; oy.hedef.y = H * 0.5; oy.hedef.vx = 120; }
    if (tur === 'yumak') { oy.hedef.x = W * 0.25; oy.hedef.y = H * 0.6; }
    kediCiz(); hedefCiz();
    oy.sonZaman = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(oyunAdim);
    ui.sahne.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' });
  }
  function oyunBitir(kullanici) {
    if (!oy) return;
    const o = oy; oy = null;
    cancelAnimationFrame(raf); raf = 0;
    ui.sahne.classList.remove('oyunda'); delete ui.sahne.dataset.oyun;
    ui.hedef.hidden = true; ui.hud.hidden = true; ui.ip.classList.remove('goster');
    ui.kediYer.style.transform = ''; ui.svg.classList.remove('kosuyor', 'atla');
    if (o.skor > (d.oyun[o.tur] || 0)) { d.oyun[o.tur] = o.skor; if (o.skor > 0) { ctx.ses.zafer(); ctx.efekt.konfeti(); ctx.toast('Yeni rekor: ' + o.skor + ' 🏆'); } }
    d.sevgi += Math.min(3, Math.ceil(o.skor / 5)); kaydet();
    durumGuncelle(); altbarKur();
    if (kullanici) soyle(o.skor ? 'Yoruldum ama çok eğlendim. Skor: ' + o.skor : 'Bir dahakine yakalarım.', 2600);
    if (sekme === 'oyna') sekmeYenile();
  }
  function yerel(e) { const r = ui.sahne.getBoundingClientRect(); return { x: CD.sinirla(e.clientX - r.left, 0, r.width), y: CD.sinirla(e.clientY - r.top, 0, r.height) }; }
  function oyunBas(e) {
    if (!oy) return;
    if (e.target && e.target.closest && e.target.closest('.pittiksu-hud')) return;
    e.preventDefault();
    try { ui.sahne.setPointerCapture(e.pointerId); } catch (err) {}
    const p = yerel(e), h = oy.hedef, is = oy.isaret;
    is.basili = true; is.x = p.x; is.y = p.y; is.gecmis = [{ x: p.x, y: p.y, t: performance.now() }];
    if (oy.tur === 'lazer' || oy.tur === 'tuy') { h.hedefX = p.x; h.hedefY = p.y; if (oy.tur === 'lazer') { h.x = p.x; h.y = p.y; } }
    else if (oy.tur === 'fare') { if (Math.hypot(p.x - h.x, p.y - h.y) < 44 && !h.sersem) { h.sersem = 1400; ctx.ses.blop(); ctx.efekt.yildiz(e.clientX, e.clientY, 4); } else ctx.ses.tik(); }
    else if (oy.tur === 'yumak') { is.tut = Math.hypot(p.x - h.x, p.y - h.y) < 52; if (is.tut) { h.vx = h.vy = 0; ctx.ses.pit(); } }
  }
  function oyunHareket(e) {
    if (!oy || !oy.isaret.basili) return;
    const p = yerel(e), h = oy.hedef, is = oy.isaret;
    is.x = p.x; is.y = p.y; is.gecmis.push({ x: p.x, y: p.y, t: performance.now() }); if (is.gecmis.length > 6) is.gecmis.shift();
    if (oy.tur === 'lazer' || oy.tur === 'tuy') { h.hedefX = p.x; h.hedefY = p.y; }
    else if (oy.tur === 'yumak' && is.tut) { h.x = p.x; h.y = p.y; }
  }
  function oyunBirak(e) {
    if (!oy || !oy.isaret.basili) return;
    const is = oy.isaret, h = oy.hedef;
    is.basili = false;
    if (oy.tur === 'yumak') {
      const g0 = is.gecmis[0], g1 = is.gecmis[is.gecmis.length - 1];
      if (g0 && g1 && g1.t > g0.t) {
        const dt = (g1.t - g0.t) / 1000, vx = (g1.x - g0.x) / dt, vy = (g1.y - g0.y) / dt;
        const hz = Math.hypot(vx, vy);
        if (hz > 80) { const k = Math.min(1, 900 / hz); h.vx = vx * k; h.vy = vy * k; ctx.ses.hop(); }
      }
      is.tut = false;
    }
  }
  function oyunAdim(t) {
    if (!oy) return;
    raf = requestAnimationFrame(oyunAdim);
    const dt = Math.min(0.05, (t - oy.sonZaman) / 1000); oy.sonZaman = t;
    const o = oy, h = o.hedef, k = o.kedi, W = o.W, H = o.H;
    // --- hedef davranışı
    if (o.tur === 'lazer') {
      if (!o.isaret.basili) { o.gezT -= dt; if (o.gezT <= 0) { o.gezT = 1.2 + Math.random() * 1.6; h.hedefX = 30 + Math.random() * (W - 60); h.hedefY = lazerY(o); } }
      h.x += (h.hedefX - h.x) * Math.min(1, dt * (o.isaret.basili ? 18 : 4)); h.y += (h.hedefY - h.y) * Math.min(1, dt * (o.isaret.basili ? 18 : 4));
    } else if (o.tur === 'tuy') {
      h.sallan += dt * 3;
      h.x += (h.hedefX + Math.sin(h.sallan) * 10 - h.x) * Math.min(1, dt * 10); h.y += (h.hedefY + Math.cos(h.sallan * 0.7) * 6 - h.y) * Math.min(1, dt * 10);
    } else if (o.tur === 'fare') {
      if (h.sersem > 0) { h.sersem -= dt * 1000; h.sallan += dt * 20; }
      else {
        h.gizli = Math.max(0, h.gizli - dt * 1000);
        if (!h.gizli) {
          h.sallan += dt * 8;
          h.x += h.vx * dt; h.y += Math.sin(h.sallan) * 18 * dt;
          // kediden kaç: kedi yakınsa hızlan / yön değiştir
          const dx = h.x - k.x, dy = h.y - k.y, uz = Math.hypot(dx, dy);
          if (uz < 110 && Math.random() < dt * 3) { h.vx = (dx >= 0 ? 1 : -1) * (150 + Math.random() * 80); }
          if (Math.random() < dt * 0.4) h.vx *= -1;
          if (h.x < -40) { h.x = -40; h.vx = Math.abs(h.vx); h.gizli = 400 + Math.random() * 800; }
          if (h.x > W + 40) { h.x = W + 40; h.vx = -Math.abs(h.vx); h.gizli = 400 + Math.random() * 800; }
          h.y = CD.sinirla(h.y, 60, H - o.kediH * 0.62 + 10);
        }
      }
    } else if (o.tur === 'yumak') {
      if (!o.isaret.tut) {
        const R = 22, zemin = H - R - 56;                  // zemin HUD'un üstünde: dinlenen yumak dokunulabilir kalır
        h.vy += 560 * dt;                                   // rüya yerçekimi: yumak yere iner, kedi patisiyle geri vurur
        h.x += h.vx * dt; h.y += h.vy * dt;
        const s = Math.pow(0.55, dt); h.vx *= s; h.vy *= s;
        if (h.x < R) { h.x = R; h.vx = Math.abs(h.vx) * 0.75; ctx.ses.tik(); } if (h.x > W - R) { h.x = W - R; h.vx = -Math.abs(h.vx) * 0.75; ctx.ses.tik(); }
        if (h.y < R) { h.y = R; h.vy = Math.abs(h.vy) * 0.6; }
        if (h.y >= zemin) { h.y = zemin; h.vy = Math.abs(h.vy) > 90 ? -Math.abs(h.vy) * 0.42 : 0; h.vx *= Math.pow(0.12, dt); }
        h.sallan += h.vx * dt * 0.03;
      }
    }
    // --- kedi takibi: k = ayak noktası; yüz k.y - kediH*0.62. Hedef, yüz–pati dikey çizgisine yaklaşınca yakalanır; kedi sahneden taşmaz.
    const kH = o.kediH || H * 0.42;
    const gorunur = !(o.tur === 'fare' && h.gizli);
    const hedefY = CD.sinirla(h.y + kH * (o.tur === 'tuy' ? 0.7 : 0.4), kH + 2, H - 6);
    let dx = h.x - k.x, dy = hedefY - k.y, uz = Math.hypot(dx, dy);
    if (gorunur && uz > 6) {
      const hz = Math.min(k.hiz, uz * 4) * (h.sersem ? 1.3 : 1);
      k.x += dx / uz * hz * dt; k.y += dy / uz * hz * dt;
      if (Math.abs(dx) > 8) k.yon = dx > 0 ? 1 : -1;
      k.x = CD.sinirla(k.x, kH * 0.32, W - kH * 0.32); k.y = CD.sinirla(k.y, kH + 2, H - 6);
    }
    const kosuyor = gorunur && uz > 14;
    ui.svg.classList.toggle('kosuyor', kosuyor);
    if (k.atla > 0) k.atla -= dt * 1000;
    const z = k.atla > 0 ? -22 : 0;
    const enYakinY = CD.sinirla(h.y, k.y - kH * 0.62 + z, k.y + z);
    const yuzUz = Math.hypot(h.x - k.x, h.y - enYakinY);
    const yakalaR = (o.tur === 'tuy' ? 50 : 40) + (k.atla > 0 ? 14 : 0);
    if (gorunur && o.tur === 'tuy' && k.atla <= 0 && Math.abs(dx) < 36 && h.y < k.y - kH * 0.62 - 10 && Math.random() < dt * 2.2) zipla(380);
    if (gorunur && yuzUz < yakalaR && t - o.sonYakala > 900) yakala(t);
    kediCiz(); hedefCiz();
  }
  function lazerY(o) { return 50 + Math.random() * Math.max(40, o.H - o.kediH * 0.62 - 30); }
  function zipla(ms) {
    if (!oy) return;
    oy.kedi.atla = ms;
    ui.svg.classList.remove('atla'); void ui.svg.getBoundingClientRect(); ui.svg.classList.add('atla');
    sonra(() => ui.svg.classList.remove('atla'), ms);
    ctx.ses.hop();
  }
  function yakala(t) {
    const o = oy, h = o.hedef, k = o.kedi;
    o.sonYakala = t; o.skor++;
    ui.hudSkor.textContent = String(o.skor);
    zipla(320);
    const r = ui.sahne.getBoundingClientRect();
    if (o.skor % 3 === 0) ctx.ses.minikMiyav();
    ctx.efekt.yildiz(r.left + h.x, r.top + h.y, 5); ctx.efekt.pati(r.left + h.x, r.top + h.y);
    if (o.skor % 4 === 0) soyle(rastgele(OYUNLAR[o.tur].yakala), 1600);
    if (o.tur === 'lazer' && !o.isaret.basili) { h.hedefX = 30 + Math.random() * (o.W - 60); h.hedefY = lazerY(o); o.gezT = 1.5; }
    else if (o.tur === 'lazer') { h.x += (Math.random() - 0.5) * 60; h.y -= 30; }
    else if (o.tur === 'tuy') { h.hedefY = Math.max(30, h.hedefY - 50); if (!o.isaret.basili) h.hedefX = CD.sinirla(h.hedefX + (Math.random() - 0.5) * 120, 30, o.W - 30); }
    else if (o.tur === 'fare') { h.sersem = 0; h.gizli = 900; h.x = Math.random() < 0.5 ? -40 : o.W + 40; h.vx = h.x < 0 ? 130 + Math.random() * 60 : -(130 + Math.random() * 60); h.y = 60 + Math.random() * Math.max(40, o.H - o.kediH * 0.62 - 50); ui.hedef.classList.remove('kacti'); void ui.hedef.offsetWidth; ui.hedef.classList.add('kacti'); }
    else if (o.tur === 'yumak') { const dx = (h.x - k.x) || (k.yon || 1) * 8, dy = h.y - (k.y - o.kediH * 0.4), u = Math.hypot(dx, dy) || 1; h.vx = dx / u * 460 + (Math.random() - 0.5) * 160; h.vy = Math.min(dy / u * 300, 0) - 260; }
  }
  function kediCiz() {
    if (!oy) return;
    const k = oy.kedi;
    const z = k.atla > 0 ? -22 : 0;
    ui.kediYer.style.transform = 'translate(' + k.x.toFixed(1) + 'px,' + (k.y + z).toFixed(1) + 'px) translate(-50%,-100%) scale(' + (0.5 * k.yon) + ',0.5)';
  }
  function hedefCiz() {
    if (!oy) return;
    const h = oy.hedef;
    let ek = '';
    if (oy.tur === 'tuy') ek = ' rotate(' + (Math.sin(h.sallan) * 18 - 20).toFixed(1) + 'deg)';
    if (oy.tur === 'fare') ek = ' scaleX(' + (h.vx < 0 ? 1 : -1) + ')' + (h.sersem ? ' rotate(' + (Math.sin(h.sallan) * 14).toFixed(1) + 'deg)' : '');
    if (oy.tur === 'yumak') ek = ' rotate(' + (h.sallan * 57).toFixed(0) + 'deg)';
    ui.hedef.style.transform = 'translate(' + h.x.toFixed(1) + 'px,' + h.y.toFixed(1) + 'px) translate(-50%,-50%)' + ek;
    ui.hedef.style.opacity = oy.tur === 'fare' && h.gizli ? '0' : '1';
    if (oy.tur === 'yumak') ui.ipYol.setAttribute('d', 'M14 ' + (oy.H - 56) + ' Q ' + ((14 + h.x) / 2).toFixed(0) + ' ' + (Math.max(h.y, oy.H - 56) + 30).toFixed(0) + ' ' + h.x.toFixed(0) + ' ' + h.y.toFixed(0));
  }
  function oyunBoyut() {
    if (!oy) return;
    const r = ui.sahne.getBoundingClientRect();
    const kx = oy.W ? oy.kedi.x / oy.W : 0.5, ky = oy.H ? oy.kedi.y / oy.H : 1, hx = oy.W ? oy.hedef.x / oy.W : 0.5, hy = oy.H ? oy.hedef.y / oy.H : 0.5;
    oy.W = r.width; oy.H = r.height; oy.kediH = oy.H * 0.42; oy.kedi.x = kx * oy.W; oy.kedi.y = ky * oy.H; oy.hedef.x = hx * oy.W; oy.hedef.y = hy * oy.H;
  }

  /* ============================================================ ALBÜM */
  function fotoUrl(f) {
    if (f.sabit) return f.kucuk;
    if (f._url) return f._url;
    try { f._url = URL.createObjectURL(f.blob); urlHavuzu.push(f._url); } catch (e) { f._url = ''; }
    return f._url;
  }
  function fotoBuyuk(f) { return f.sabit ? f.buyuk : fotoUrl(f); }
  function fotoNot(f) { const n = g.albumNot[f.id] || {}; return { not: n.not != null ? n.not : (f.sabit ? f.varsayilan : (f.not || '')), tarih: n.tarih != null ? n.tarih : (f.tarih || '') }; }
  function fotolariYukle() {
    if (fotolar) return Promise.resolve(fotolar);
    return ctx.idb.hepsi('fotolar').then(liste => {
      fotolar = (liste || []).filter(f => f && typeof f.id === 'string' && f.id.indexOf('pittiksu:') === 0 && f.blob).sort((a, b) => (b.olusturma || 0) - (a.olusturma || 0));
      return fotolar;
    }).catch(() => { fotolar = fotolar || []; return fotolar; });
  }
  function albumKur() {
    const kap = ctx.el('div.dikey.pittiksu-album');
    const ust = ctx.el('div.yama.siki.satir.arasi.pittiksu-album-ust', [
      ctx.el('div', [ctx.el('h2.baslik.baslik-lg', 'Pıttıksu albümü'), ctx.el('p.sessiz', 'Fotoğraflar bu telefonda kalır.')]),
      ctx.el('button.dugme', { type: 'button', onclick: () => { ctx.ses.tik(); girdi.click(); } }, ['📷 ', 'Fotoğraf ekle'])
    ]);
    const girdi = ctx.el('input', { type: 'file', accept: 'image/*', multiple: true, class: 'gorsel-gizli', 'aria-label': 'Fotoğraf seç', tabindex: '-1' });
    girdi.addEventListener('change', () => { const dosyalar = Array.from(girdi.files || []); girdi.value = ''; fotoEkle(dosyalar); });
    const izgara = ctx.el('div.pittiksu-polaroidler', [ctx.el('p.sessiz.orta', 'Albüm açılıyor…')]);
    kap.append(ust, girdi, izgara);
    ui.albumIzgara = izgara;
    fotolariYukle().then(() => { if (ctx && izgara.isConnected) albumCiz(); });
    return kap;
  }
  function albumCiz() {
    const izgara = ui.albumIzgara; if (!izgara || !izgara.isConnected) return;
    izgara.innerHTML = '';
    const hepsi = (fotolar || []).concat(SABIT_FOTOLAR);
    hepsi.forEach((f, i) => {
      const bilgi = fotoNot(f);
      const kart = ctx.el('button.pittiksu-polaroid', { type: 'button', 'aria-label': (bilgi.not || 'Pıttıksu fotoğrafı') + (bilgi.tarih ? ', ' + CD.tarihYaz(bilgi.tarih) : ''), style: '--don:' + ((i % 3) - 1) * 1.6 + 'deg', onclick: () => fotoAc(f) }, [
        ctx.el('span.pittiksu-polaroid-cerceve', [ctx.el('img', { src: fotoUrl(f), alt: '', loading: 'lazy', decoding: 'async' })]),
        ctx.el('span.pittiksu-polaroid-not', bilgi.not || (bilgi.tarih ? CD.tarihYaz(bilgi.tarih) : 'not ekle')),
        bilgi.tarih && bilgi.not ? ctx.el('span.pittiksu-polaroid-tarih.sayi', CD.tarihYaz(bilgi.tarih)) : null
      ]);
      izgara.appendChild(kart);
    });
    if (!hepsi.length) izgara.appendChild(ctx.el('div.yama.bos-durum', [ctx.el('div.buyuk', '📸'), ctx.el('p', 'Henüz fotoğraf yok. Pıttıksu poz vermeye hazır.')]));
  }
  async function fotoEkle(dosyalar) {
    if (!dosyalar.length) return;
    let eklenen = 0, uyari = false;
    for (const dosya of dosyalar.slice(0, 12)) {
      if (!/^image\//.test(dosya.type)) continue;
      try {
        const blob = await CD.fotoKucult(dosya, 1280, 0.82);
        if (!ctx) return;
        const kayit = { id: 'pittiksu:' + CD.kimlik(), blob, not: '', tarih: CD.bugun(), olusturma: Date.now() };
        try { await ctx.idb.koy('fotolar', kayit); } catch (e) { uyari = true; }
        if (!ctx) return;
        fotolar = fotolar || []; fotolar.unshift(kayit); eklenen++;
      } catch (e) { ctx.toast('Bu fotoğraf açılamadı; başka birini dener misin?'); }
    }
    if (!ctx) return;
    if (eklenen) { ctx.ses.parilti(); ctx.toast(eklenen === 1 ? 'Fotoğraf albümde 📷' : eklenen + ' fotoğraf albümde 📷'); albumCiz(); }
    if (uyari) ctx.toast('Bu tarayıcı fotoğrafı kalıcı saklayamıyor; bu ziyarette albümde kalır.', 3200);
  }
  function fotoAc(f) {
    const bilgi = fotoNot(f);
    const img = ctx.el('img.pittiksu-buyuk-foto', { src: fotoBuyuk(f), alt: bilgi.not || 'Pıttıksu' });
    const not = ctx.el('textarea.girdi', { rows: '2', placeholder: 'Altına küçük bir not…', maxlength: '140' }, bilgi.not);
    const tarih = ctx.el('input.girdi', { type: 'date', value: bilgi.tarih || '' });
    const kaydetD = ctx.el('button.dugme', { type: 'button', onclick: () => {
      g.albumNot[f.id] = { not: not.value.trim().slice(0, 140), tarih: tarih.value || '' }; gunlukKaydet();
      if (!f.sabit) { f.not = g.albumNot[f.id].not; f.tarih = g.albumNot[f.id].tarih; ctx.idb.koy('fotolar', { id: f.id, blob: f.blob, not: f.not, tarih: f.tarih, olusturma: f.olusturma }).catch(() => {}); }
      ctx.ses.parilti(); ctx.sheetKapat(); albumCiz(); ctx.toast('Mırr ~ kaydedildi');
    } }, 'Kaydet');
    const silD = f.sabit ? null : ctx.el('button.dugme-ikincil', { type: 'button', onclick: async () => {
      const ok = await ctx.onayla('Bu fotoğraf albümden silinsin mi?', 'Sil', 'Kalsın'); if (!ok || !ctx) return;
      try { await ctx.idb.sil('fotolar', f.id); } catch (e) {}
      if (f._url) { try { URL.revokeObjectURL(f._url); } catch (e) {} urlHavuzu = urlHavuzu.filter(u => u !== f._url); }
      fotolar = (fotolar || []).filter(x => x.id !== f.id); delete g.albumNot[f.id]; gunlukKaydet();
      ctx.ses.blop(); albumCiz(); ctx.toast('Fotoğraf silindi');
    } }, 'Sil');
    const ic = ctx.el('div.dikey.pittiksu-foto-sheet', [
      img,
      ctx.el('label.etiket', 'Not'), not,
      ctx.el('label.etiket', 'Tarih'), tarih,
      ctx.el('div.satir', [silD, ctx.el('span.bosluk'), ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Kapat'), kaydetD])
    ]);
    ctx.sheet(ic, { baslik: f.sabit ? 'Pıttıksu' : 'Fotoğraf', odak: false });
  }

  /* ============================================================ GÜNLÜK */
  function gunlukKur() {
    const kap = ctx.el('div.dikey.pittiksu-gunluk');
    kap.append(yasKarti(), hatirlatmaUyarisi(), mamaKarti(), kiloKarti(), hatirlaticiKarti(), olayKarti(), notKarti());
    ui.gunlukKap = kap;
    return kap;
  }
  function yasKarti() {
    const a = asama(), gn = yasGun();
    const tarihGirdi = ctx.el('input.girdi', { type: 'date', value: dogumTarihi(), max: CD.bugun(), 'aria-label': 'Doğum tarihi' });
    const kart = ctx.el('div.yama.pittiksu-yas-kart', [
      ctx.el('div.pittiksu-yas-buyuk', [ctx.el('span.pittiksu-yas-sayi.sayi', String(gn)), ctx.el('span.pittiksu-yas-birim', gn === 1 ? 'günlük' : 'günlük')]),
      ctx.el('h2.baslik.baslik-lg', 'Pıttıksu ' + yasMetni()),
      ctx.el('p.ikincil', a.ad + ' · ' + a.ozet),
      ctx.el('div.satir.sar.pittiksu-asama-cipler', [
        ctx.el('span.rozet.goz', '⚖️ ' + a.kilo), ctx.el('span.rozet.goz', '🍼 ' + a.mama), ctx.el('span.rozet.goz', '🌡️ ' + a.sicak), ctx.el('span.rozet.goz', '👀 ' + a.goz)
      ]),
      ctx.el('details.pittiksu-dogum', [
        ctx.el('summary', dogumVarsayilanMi() ? 'Doğum tarihini yaz (şimdilik tahmini)' : 'Doğum tarihi: ' + CD.tarihYaz(dogumTarihi())),
        ctx.el('p.sessiz', 'Tam günü bilmiyorsan tahminini yaz; sonradan düzeltebilirsin. Hafta sayacı ve ipuçları buna göre değişir.'),
        ctx.el('div.satir', [tarihGirdi, ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => {
          const v = tarihGirdi.value; if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { ctx.toast('Tarihi yıl-ay-gün olarak seç.'); return; }
          if (CD.gunFarki(v) < 0) { ctx.toast('O gün daha gelmedi; bugünü ya da öncesini seç.'); return; }
          ctx.depo.yaz('dogumTarihi', v); ctx.depo.yaz('dogumVarsayilan', false); d.kutlananHafta = Math.floor(yasGun() / 7); kaydet(); ctx.ses.parilti(); ctx.toast('Doğum günü kaydedildi 🎂');
          durumGuncelle(); sekmeYenile();
        } }, 'Kaydet')])
      ])
    ]);
    return kart;
  }
  function hatirlatmaUyarisi() {
    const yakin = g.hatirlatici.filter(h => { const f = CD.gunFarki(h.tarih); return f != null && f >= -2 && f <= 0; }).sort((a, b) => a.tarih < b.tarih ? -1 : 1);
    if (!yakin.length) return null;
    return ctx.el('div.yama.siki.pittiksu-uyari', yakin.map(h => {
      const kalan = -CD.gunFarki(h.tarih);
      const tur = HATIRLATICI_TURLERI.find(t => t[0] === h.tur) || HATIRLATICI_TURLERI[4];
      return ctx.el('div.satir', [ctx.el('span', { 'aria-hidden': 'true' }, tur[1]), ctx.el('span.kalin', h.ad), ctx.el('span.bosluk'), ctx.el('span.rozet' + (kalan === 0 ? '' : '.goz'), kalan === 0 ? 'bugün' : kalan === 1 ? 'yarın' : kalan + ' gün kaldı')]);
    }));
  }
  function mamaKarti() {
    const bugunkuler = g.mamalar.filter(bugunMu).sort((a, b) => a - b);
    const sm = sonrakiMama(), ar = mamaAralik();
    const durumMetni = ctx.el('p.pittiksu-mama-sonraki');
    const durumYaz = () => {
      const s = sonrakiMama();
      if (!ar) durumMetni.textContent = 'Bu yaşta kendi yiyor; istersen yine de saatleri kaydet.';
      else if (!s) durumMetni.textContent = 'Henüz mama kaydı yok. İlk biberondan sonra saymaya başlarım.';
      else if (s.gecikti) durumMetni.textContent = 'Mama saati geldi galiba 🍼 (son mama ' + saat(s.son) + ')';
      else durumMetni.textContent = 'Sonraki mama ~' + saat(s.sonraki) + ' · ' + (s.kalanDk >= 60 ? Math.floor(s.kalanDk / 60) + ' sa ' + (s.kalanDk % 60) + ' dk' : s.kalanDk + ' dk') + ' kaldı';
      durumMetni.classList.toggle('gecikti', !!(s && s.gecikti));
    };
    durumYaz(); ui.mamaDurumYaz = durumYaz;
    const cipler = ctx.el('div.satir.sar', [2, 3, 4, 5, 6].map(h => ctx.el('button.cip', { type: 'button', 'aria-pressed': String(ar === h), onclick: () => { g.mamaAralik = h; gunlukKaydet(); ctx.ses.tik(); sekmeYenile(); } }, h + ' saat' + (asama().mamaSaat === h ? ' ✓' : ''))));
    const liste = ctx.el('div.satir.sar.pittiksu-mama-liste', bugunkuler.length ? bugunkuler.map(ts => ctx.el('span.rozet.pittiksu-mama-cip', [ctx.el('span.sayi', saat(ts)), ctx.el('button.pittiksu-sil', { type: 'button', 'aria-label': saat(ts) + ' mama kaydını sil', onclick: () => { g.mamalar = g.mamalar.filter(x => x !== ts); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')])) : [ctx.el('span.sessiz', 'Bugün henüz kayıt yok.')]);
    return ctx.el('div.yama.pittiksu-mama', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Mama saatleri'), ctx.el('span.rozet', 'bugün ' + bugunkuler.length)]),
      durumMetni,
      ctx.el('button.dugme.tam', { type: 'button', onclick: e => { mamaVer(e); } }, ['🍼 ', 'Mama verdim (şimdi)']),
      liste,
      ctx.el('p.sessiz', 'Mama aralığı: ' + (ar ? 'her ' + ar + ' saatte bir' : 'serbest') + (asama().mamaSaat ? ' · bu hafta için önerilen ' + asama().mamaSaat + ' saat' : '')),
      cipler,
      ctx.el('p.sessiz', 'Miktarı ve mamayı veterinerin Pıttıksu\'nun kilosuna göre söyler; ben sadece saati tutarım.')
    ]);
  }
  function kiloKarti() {
    const kilolar = g.kilolar.slice().sort((a, b) => a.t < b.t ? -1 : a.t > b.t ? 1 : 0);
    const son = kilolar[kilolar.length - 1], onceki = kilolar[kilolar.length - 2];
    const a = asama();
    const girdi = ctx.el('input.girdi', { type: 'number', inputmode: 'numeric', min: '20', max: '9000', step: '1', placeholder: 'gram', 'aria-label': 'Kilo (gram)' });
    const tarih = ctx.el('input.girdi', { type: 'date', value: CD.bugun(), max: CD.bugun(), 'aria-label': 'Tartı tarihi' });
    const ekle = () => {
      const v = Math.round(Number(girdi.value));
      if (!v || v < 20 || v > 9000) { ctx.toast('Gram cinsinden bir sayı yaz (örn. 210).'); girdi.focus(); return; }
      const t = /^\d{4}-\d{2}-\d{2}$/.test(tarih.value) ? tarih.value : CD.bugun();
      g.kilolar = g.kilolar.filter(k => k.t !== t); g.kilolar.push({ t, g: v }); gunlukKaydet();
      ctx.ses.parilti(); ctx.toast('Kilo kaydedildi: ' + v + ' g');
      sekmeYenile();
    };
    girdi.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ekle(); } });
    const ozet = son ? ctx.el('div.pittiksu-kilo-ozet', [
      ctx.el('span.pittiksu-kilo-son.sayi', son.g + ' g'),
      onceki ? ctx.el('span.rozet' + (son.g - onceki.g >= 0 ? '.basari' : '') , (son.g - onceki.g >= 0 ? '+' : '') + (son.g - onceki.g) + ' g') : null,
      ctx.el('span.sessiz', CD.tarihYaz(son.t))
    ]) : ctx.el('p.sessiz', 'Henüz tartılmadı. Her gün aynı saatte tart; ben çizgiyi çizerim.');
    const liste = ctx.el('div.satir.sar.pittiksu-kilo-liste', kilolar.slice(-7).reverse().map(k => ctx.el('span.rozet.gri.pittiksu-mama-cip', [ctx.el('span.sayi', CD.tarihYaz(k.t) + ' · ' + k.g + ' g'), ctx.el('button.pittiksu-sil', { type: 'button', 'aria-label': CD.tarihYaz(k.t) + ' kilo kaydını sil', onclick: () => { g.kilolar = g.kilolar.filter(x => x.t !== k.t); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')])));
    return ctx.el('div.yama.pittiksu-kilo', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Kilo takibi'), ctx.el('span.rozet.goz', 'beklenen ~' + a.kilo)]),
      ozet,
      ctx.el('div.pittiksu-grafik', { html: kiloGrafik(kilolar, a) }),
      ctx.el('div.pittiksu-kilo-form', [girdi, tarih, ctx.el('button.dugme', { type: 'button', onclick: ekle }, 'Kaydet')]),
      liste,
      ctx.el('p.sessiz', 'Aralıklar yaklaşıktır; asıl ölçüt her gün biraz artması. 24 saat artmazsa ya da düşerse veterinere.')
    ]);
  }
  function kiloGrafik(kilolar, a) {
    const W = 320, H = 130, sol = 34, sag = 10, ust = 12, alt = 26;
    const veri = kilolar.slice(-14);
    if (veri.length < 2) return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pittiksu-grafik-svg" role="img" aria-label="Kilo grafiği için en az iki ölçüm gerek"><text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" class="pittiksu-grafik-yazi">İki ölçümden sonra çizgi burada çıkar</text></svg>';
    let min = Math.min.apply(null, veri.map(k => k.g)), maks = Math.max.apply(null, veri.map(k => k.g));
    const bant = a.kiloUst < 1000 ? [a.kiloAlt, a.kiloUst] : null;
    if (bant) { min = Math.min(min, bant[0]); maks = Math.max(maks, bant[1]); }
    const pay = Math.max(20, (maks - min) * 0.15); min -= pay; maks += pay;
    const x = i => sol + i * (W - sol - sag) / (veri.length - 1);
    const y = v => ust + (H - ust - alt) * (1 - (v - min) / (maks - min));
    const nokta = veri.map((k, i) => x(i).toFixed(1) + ',' + y(k.g).toFixed(1)).join(' ');
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pittiksu-grafik-svg" role="img" aria-label="Son ' + veri.length + ' ölçümün kilo grafiği">';
    if (bant) s += '<rect class="pittiksu-grafik-bant" x="' + sol + '" y="' + y(bant[1]).toFixed(1) + '" width="' + (W - sol - sag) + '" height="' + (y(bant[0]) - y(bant[1])).toFixed(1) + '" rx="4"/>';
    [0, 0.5, 1].forEach(k => { const v = min + (maks - min) * k, yy = y(v); s += '<line class="pittiksu-grafik-cizgi" x1="' + sol + '" x2="' + (W - sag) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/><text class="pittiksu-grafik-yazi" x="' + (sol - 4) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + Math.round(v) + '</text>'; });
    s += '<polygon class="pittiksu-grafik-alan" points="' + x(0).toFixed(1) + ',' + (H - alt) + ' ' + nokta + ' ' + x(veri.length - 1).toFixed(1) + ',' + (H - alt) + '"/>';
    s += '<polyline class="pittiksu-grafik-yol" points="' + nokta + '"/>';
    veri.forEach((k, i) => { s += '<circle class="pittiksu-grafik-nokta" cx="' + x(i).toFixed(1) + '" cy="' + y(k.g).toFixed(1) + '" r="4"/>'; });
    s += '<text class="pittiksu-grafik-yazi" x="' + sol + '" y="' + (H - 8) + '">' + CD.tarihYaz(veri[0].t) + '</text><text class="pittiksu-grafik-yazi" x="' + (W - sag) + '" y="' + (H - 8) + '" text-anchor="end">' + CD.tarihYaz(veri[veri.length - 1].t) + '</text>';
    s += '</svg>';
    return s;
  }
  function hatirlaticiKarti() {
    const liste = g.hatirlatici.slice().sort((a, b) => a.tarih < b.tarih ? -1 : 1);
    const ad = ctx.el('input.girdi', { type: 'text', placeholder: 'Ne için? (örn. ilk kontrol)', maxlength: '60', 'aria-label': 'Hatırlatıcı adı' });
    const tarih = ctx.el('input.girdi', { type: 'date', value: CD.bugun(), 'aria-label': 'Hatırlatıcı tarihi' });
    let tur = 'veteriner';
    const turCipler = ctx.el('div.satir.sar', HATIRLATICI_TURLERI.map(t => ctx.el('button.cip', { type: 'button', 'aria-pressed': String(t[0] === tur), data: { tur: t[0] }, onclick: (e) => { tur = t[0]; ctx.ses.tik(); Array.from(turCipler.children).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.tur === tur))); if (!ad.value) ad.placeholder = t[2]; } }, [ctx.el('span', { 'aria-hidden': 'true' }, t[1]), ctx.el('span', t[2])])));
    const ekle = () => {
      const t = tarih.value; if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) { ctx.toast('Bir tarih seç.'); return; }
      const turBilgi = HATIRLATICI_TURLERI.find(x => x[0] === tur);
      g.hatirlatici.push({ id: CD.kimlik(), ad: (ad.value.trim() || turBilgi[2]).slice(0, 60), tarih: t, tur }); gunlukKaydet();
      ctx.ses.parilti(); ctx.toast('Hatırlatıcı eklendi 📌'); sekmeYenile();
    };
    const satirlar = liste.length ? liste.map(h => {
      const f = CD.gunFarki(h.tarih), kalan = -f;
      const turBilgi = HATIRLATICI_TURLERI.find(t => t[0] === h.tur) || HATIRLATICI_TURLERI[4];
      const roz = f > 0 ? ctx.el('span.rozet.gri', f === 1 ? 'dün' : f + ' gün önce') : kalan === 0 ? ctx.el('span.rozet', 'bugün') : ctx.el('span.rozet.goz', kalan === 1 ? 'yarın' : kalan + ' gün kaldı');
      return ctx.el('div.pittiksu-hatirlatici' + (f > 0 ? '.gecti' : ''), [
        ctx.el('span.pittiksu-hatirlatici-ikon', { 'aria-hidden': 'true' }, turBilgi[1]),
        ctx.el('div.pittiksu-hatirlatici-metin', [ctx.el('div.kalin', h.ad), ctx.el('div.sessiz.sayi', CD.tarihYaz(h.tarih))]),
        roz,
        ctx.el('button.dugme-ikon.pittiksu-hatirlatici-sil', { type: 'button', 'aria-label': h.ad + ' hatırlatıcısını sil', onclick: async () => { const ok = await ctx.onayla('"' + h.ad + '" silinsin mi?', 'Sil', 'Kalsın'); if (!ok || !ctx) return; g.hatirlatici = g.hatirlatici.filter(x => x.id !== h.id); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')
      ]);
    }) : [ctx.el('p.sessiz', 'Henüz hatırlatıcı yok. Veteriner ne dediyse tarihini buraya yaz; günü gelince haber veririm.')];
    return ctx.el('div.yama.pittiksu-hatirlaticilar', [
      ctx.el('h2.baslik.baslik-lg', 'Veteriner ve aşı hatırlatıcıları'),
      ctx.el('div.dikey.pittiksu-hatirlatici-liste', satirlar),
      ctx.el('details.pittiksu-ekle', [
        ctx.el('summary', '+ Hatırlatıcı ekle'),
        ctx.el('div.dikey', [turCipler, ad, tarih, ctx.el('button.dugme', { type: 'button', onclick: ekle }, 'Ekle')])
      ]),
      ctx.el('p.sessiz', 'Aşı takvimini veteriner belirler (ilk karma aşı genelde 6–8 haftada). Tarihleri o söyler, ben hatırlatırım.')
    ]);
  }
  function olayKarti() {
    const bugunkuler = g.olaylar.filter(o => bugunMu(o.t)).sort((a, b) => b.t - a.t);
    const dugmeler = ctx.el('div.pittiksu-olay-dugmeler', OLAYLAR.map(o => ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: e => {
      g.olaylar.push({ t: Date.now(), tur: o[0] }); gunlukKaydet();
      ctx.ses.pop(); ctx.efekt.emoji(e.clientX || 0, e.clientY || 0, o[1], 2);
      if (o[0] === 'uyudu' && !d.uyuyor) { uyut(); return; }
      if (o[0] === 'uyandi' && d.uyuyor) { uyandir(); return; }
      sekmeYenile();
    } }, [ctx.el('span', { 'aria-hidden': 'true' }, o[1]), ctx.el('span', o[2])])));
    const liste = ctx.el('div.pittiksu-olay-liste', bugunkuler.length ? bugunkuler.map(o => {
      const b = OLAYLAR.find(x => x[0] === o.tur) || ['?', '📝', o.tur];
      return ctx.el('div.pittiksu-olay', [ctx.el('span.sayi.sessiz', saat(o.t)), ctx.el('span', { 'aria-hidden': 'true' }, b[1]), ctx.el('span', b[2]), ctx.el('span.bosluk'), ctx.el('button.pittiksu-sil', { type: 'button', 'aria-label': 'Kaydı sil', onclick: () => { g.olaylar = g.olaylar.filter(x => x.t !== o.t); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')]);
    }) : [ctx.el('p.sessiz', 'Bugün henüz not yok. Tuvalet uyarımı her mamadan sonra; bir dokunuşla kaydet.')]);
    return ctx.el('div.yama.pittiksu-olaylar', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Tuvalet ve uyku'), ctx.el('span.rozet.gri', 'bugün ' + bugunkuler.length)]),
      dugmeler, liste
    ]);
  }
  function notKarti() {
    let ruh = RUH[0][0];
    const ruhCipler = ctx.el('div.satir.sar.pittiksu-ruh', RUH.map(r => ctx.el('button.pittiksu-ruh-dugme', { type: 'button', 'aria-label': r[1], 'aria-pressed': String(r[0] === ruh), data: { ruh: r[0] }, onclick: () => { ruh = r[0]; ctx.ses.tik(); Array.from(ruhCipler.children).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.ruh === ruh))); } }, r[0])));
    const metin = ctx.el('textarea.girdi', { rows: '3', placeholder: 'Bugün ne yaptı? (ilk kez gözünü açtı, patisini yaladı, çok esnedi…)', maxlength: '400' });
    const ekle = () => {
      const m = metin.value.trim(); if (!m) { ctx.toast('Bir iki kelime yeter; Pıttıksu bekliyor.'); metin.focus(); return; }
      g.notlar.unshift({ id: CD.kimlik(), t: CD.bugun(), ts: Date.now(), metin: m.slice(0, 400), ruh }); gunlukKaydet();
      ctx.ses.parilti(); ctx.toast('Günlüğe yazıldı 📔'); sekmeYenile();
    };
    const gruplar = {};
    g.notlar.forEach(n => { (gruplar[n.t] = gruplar[n.t] || []).push(n); });
    const gunler = Object.keys(gruplar).sort().reverse().slice(0, 30);
    const liste = ctx.el('div.dikey.pittiksu-not-liste', gunler.length ? gunler.map(t => ctx.el('div.pittiksu-not-gun', [
      ctx.el('div.pittiksu-not-tarih.sayi', t === CD.bugun() ? 'Bugün' : CD.tarihYaz(t)),
      ctx.el('div.dikey', gruplar[t].map(n => ctx.el('div.pittiksu-not', [
        ctx.el('span.pittiksu-not-ruh', { 'aria-hidden': 'true' }, n.ruh || '🐾'),
        ctx.el('p.pittiksu-not-metin', n.metin),
        ctx.el('button.pittiksu-sil', { type: 'button', 'aria-label': 'Notu sil', onclick: async () => { const ok = await ctx.onayla('Bu not silinsin mi?', 'Sil', 'Kalsın'); if (!ok || !ctx) return; g.notlar = g.notlar.filter(x => x.id !== n.id); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')
      ])))
    ])) : [ctx.el('p.sessiz', 'İlk notu sen yaz; yıllar sonra "ilk haftası" burada dursun.')]);
    return ctx.el('div.yama.pittiksu-notlar', [
      ctx.el('h2.baslik.baslik-lg', 'Bugün ne yaptı?'),
      ruhCipler, metin,
      ctx.el('button.dugme.tam', { type: 'button', onclick: ekle }, 'Günlüğe yaz'),
      liste
    ]);
  }

  /* ============================================================ İPUÇLARI */
  function ipuclariKur() {
    const gn = yasGun(), a = asama();
    const kap = ctx.el('div.dikey.pittiksu-ipuclari');
    const takvim = ctx.el('div.yama.pittiksu-takvim', [
      ctx.el('h2.baslik.baslik-lg', 'Gelişim takvimi'),
      ctx.el('p.sessiz', 'Pıttıksu şu an ' + yasMetni() + '. Vurgulu satır bu haftası.'),
      ctx.el('div.pittiksu-takvim-liste', ASAMALAR.map(s => ctx.el('div.pittiksu-takvim-satir' + (s.id === a.id ? '.simdi' : gn >= s.bit ? '.gecti' : ''), [
        ctx.el('div.pittiksu-takvim-hafta', [ctx.el('span.kalin', s.ad), s.id === a.id ? ctx.el('span.rozet', 'şu an') : null]),
        ctx.el('div.pittiksu-takvim-detay', [
          ctx.el('span', '⚖️ ' + s.kilo), ctx.el('span', '👀 ' + s.goz), ctx.el('span', '🐾 ' + s.hareket), ctx.el('span', '🍼 ' + s.mama), ctx.el('span', '🌡️ ' + s.sicak), ctx.el('span', '🚼 ' + s.tuvalet)
        ])
      ])))
    ]);
    const simdi = IPUCLARI.filter(i => gn >= i.gun[0] && gn < i.gun[1]);
    const sonra_ = IPUCLARI.filter(i => gn < i.gun[0]);
    const gecmis = IPUCLARI.filter(i => gn >= i.gun[1]);
    const kartlar = (liste, etiket) => liste.map(i => ctx.el('div.yama.pittiksu-ipucu-kart', [
      ctx.el('div.satir.arasi', [ctx.el('div.satir', [ctx.el('span.pittiksu-ipucu-emoji', { 'aria-hidden': 'true' }, i.emoji), ctx.el('h3.baslik.baslik-lg', i.ad)]), etiket ? ctx.el('span.rozet' + (etiket === 'şimdi önemli' ? '' : '.gri'), etiket) : null]),
      ctx.el('p', i.metin)
    ]));
    kap.append(takvim);
    kartlar(simdi, 'şimdi önemli').forEach(k => kap.appendChild(k));
    if (sonra_.length) { kap.appendChild(ctx.el('h2.baslik.baslik-lg.pittiksu-ara-baslik', 'Biraz sonra lazım olacak')); kartlar(sonra_, 'yakında').forEach(k => kap.appendChild(k)); }
    if (gecmis.length) { kap.appendChild(ctx.el('h2.baslik.baslik-lg.pittiksu-ara-baslik', 'Geride kalanlar')); kartlar(gecmis, 'geçti').forEach(k => kap.appendChild(k)); }
    kap.appendChild(ctx.el('p.sessiz.orta', 'Bu kartlar genel bilgi; Pıttıksu\'nun kendi doktoru her zaman haklı.'));
    return kap;
  }

  /* ============================================================ SÖZLER */
  function sozlerKur() {
    const kap = ctx.el('div.dikey.pittiksu-sozler');
    const ust = ctx.el('div.yama', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Pıttıksu\'nun sözleri'), ctx.el('span.rozet.inci.pittiksu-soz-sayac')]),
      ctx.el('p.ikincil', 'Dokun, bir şey söylesin. Her yeni söz koleksiyona eklenir. Arada bir bağırabilir; alınma.'),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => { sozSoyle(); ui.sahne.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' }); } }, ['💬 ', 'Bir şey söyle'])
    ]);
    const liste = ctx.el('div.pittiksu-soz-liste');
    kap.append(ust, liste);
    ui.sozListe = liste; ui.sozSayac = ust.querySelector('.pittiksu-soz-sayac');
    sozlerListesiYenile();
    return kap;
  }
  function sozlerListesiYenile() {
    if (!ui.sozListe || !ui.sozListe.isConnected) return;
    const liste = ui.sozListe; liste.innerHTML = '';
    const toplam = SOZLER.length + 1;
    ui.sozSayac.textContent = d.duyulan.length + ' / ' + toplam + ' söz';
    SOZLER.forEach((s, i) => {
      const duyuldu = d.duyulan.indexOf(i) >= 0;
      liste.appendChild(duyuldu
        ? ctx.el('button.pittiksu-soz.duyuldu', { type: 'button', onclick: () => { sozSoyle(i); ui.sahne.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' }); } }, s.replace('{gun}', yasGun()))
        : ctx.el('span.pittiksu-soz.kilitli', { 'aria-label': 'Henüz duyulmadı' }, '···'));
    });
    const bagirdi = d.duyulan.indexOf(-1) >= 0;
    liste.appendChild(bagirdi ? ctx.el('button.pittiksu-soz.duyuldu.bagir', { type: 'button', onclick: () => { if (!oy && !d.uyuyor) { bagir(); ui.sahne.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' }); } } }, BAGIR) : ctx.el('span.pittiksu-soz.kilitli', { 'aria-label': 'Henüz duyulmadı' }, '!!!'));
  }

  /* ------------------------------------------------------------ canlı sayaçlar, hatırlatma */
  function canliGuncelle() {
    if (!ctx) return;
    if (ui.mamaDurumYaz && sekme === 'gunluk' && ui.gunlukKap && ui.gunlukKap.isConnected) ui.mamaDurumYaz();
    if (d.bugun.tarih !== CD.bugun()) { d.bugun = { tarih: CD.bugun(), oksama: 0 }; kaydet(); }
    const sm = sonrakiMama();
    if (sm && sm.gecikti && !oy && !mesgul && document.visibilityState === 'visible' && (d.mamaUyari || 0) < sm.sonraki) {
      d.mamaUyari = Date.now(); kaydet();
      ctx.ses.minikMiyav();
      if (!d.uyuyor) { ui.svg.classList.add('konusuyor'); sonra(() => ui.svg.classList.remove('konusuyor'), 500); }
      soyle(d.uyuyor ? 'zZz… karnım guruldadı, mama? 🍼' : 'Karnım guruldadı… mama saati geldi galiba 🍼', 3400);
      ctx.toast('Mama saati geldi 🍼', 3000);
    }
  }
  /* ------------------------------------------------------------ haftalık kutlama (yeni haftaya girince bir kez) */
  function haftaKutla() {
    const h = Math.floor(yasGun() / 7);
    if (d.kutlananHafta == null || d.kutlananHafta < 0 || !d.sonGorulme) { d.kutlananHafta = h; return; }
    if (h <= d.kutlananHafta) return;
    d.kutlananHafta = h;
    sonra(() => {
      if (!ctx || oy) return;
      ctx.ses.zafer(); ctx.efekt.konfeti();
      ctx.toast('Pıttıksu ' + h + ' haftalık oldu 🎂', 3400);
      if (!d.uyuyor) { ui.svg.classList.add('mutlu'); sonra(() => { if (!oksuyor) ui.svg.classList.remove('mutlu'); }, 1600); }
      soyle(h + ' haftalık oldum! Büyüdüm mü, fark ettin mi?', 3200);
    }, 3400);
  }
  function acilisSelami() {
    const uzunZaman = d.sonGorulme && Date.now() - d.sonGorulme > 6 * 3600000;
    sonra(() => {
      if (!ctx) return;
      if (d.uyuyor) { soyle('zZz…', 1600); return; }
      const sm = sonrakiMama();
      if (sm && sm.gecikti) { soyle('Mama saati geldi galiba? 🍼', 3000); return; }
      soyle(rastgele(uzunZaman ? OZLEDIM : SELAM), 2600);
      if (uzunZaman) ctx.ses.minikMiyav();
    }, 700);
    const bugun = CD.bugun();
    if (d.selamGunu !== bugun) {
      d.selamGunu = bugun; kaydet();
      const yakin = g.hatirlatici.filter(h => { const f = CD.gunFarki(h.tarih); return f != null && f >= -1 && f <= 0; });
      if (yakin.length) sonra(() => { if (ctx) ctx.toast((CD.gunFarki(yakin[0].tarih) === 0 ? 'Bugün: ' : 'Yarın: ') + yakin[0].ad + ' 📌', 3200); }, 1800);
    }
  }

  /* ============================================================ KAYIT */
  CD.kaydet({
    id: ID, baslik: 'Pıttıksu', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el;
      yukle();
      const sahne = sahneKur();
      const sekmeler = sekmelerKur();
      el.append(sahne, sekmeler, ui.panel);
      const kayitli = ctx.depo.al('sekme', 'oyna');
      sekmeSec(SEKMELER.some(s => s[0] === kayitli) ? kayitli : 'oyna');
      altbarKur();
      kirpDongu(); bosDongu();
      canliTik = setInterval(canliGuncelle, 30000);
      dinle(document, 'visibilitychange', () => {
        if (document.visibilityState !== 'visible') { if (oy) { cancelAnimationFrame(raf); raf = 0; } if (oksuyor) oksamaBitir(false); basili = null; }
        else if (oy && !raf) { oy.sonZaman = performance.now(); raf = requestAnimationFrame(oyunAdim); }
      });
      dinle(window, 'resize', oyunBoyut);
      haftaKutla();
      acilisSelami();
      kaydet();
    },
    unmount() {
      if (oy) { oy = null; }
      cancelAnimationFrame(raf); raf = 0;
      clearInterval(canliTik); canliTik = 0;
      hepsiniIptal();
      dinleyiciler.splice(0).forEach(([h, a, f, s]) => h.removeEventListener(a, f, s));
      if (ctx) { ctx.ses.mirrDur(); ctx.ses.hepsiniDurdur(); if (d) { d.kucakta = false; kaydet(); } }
      urlHavuzu.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); urlHavuzu = [];
      if (fotolar) fotolar.forEach(f => { f._url = ''; });
      fotolar = null; oksuyor = false; basili = null; mesgul = false; uykuDokunus = [];
      Object.keys(ui).forEach(k => { delete ui[k]; });
      ctx = null; kok = null; d = null; g = null;
    }
  });
})();
