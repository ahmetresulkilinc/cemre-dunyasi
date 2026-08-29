/* js/bolum/barbie.js — Barbie Köşesi (Cemre'nin gerçek köpeği; krem Pomeranian, dili hep dışarıda)
   Sahne: SVG Barbie halının üstünde — okşa (soluma + kuyruk), dokun (bölgeye göre tepki), kucak, uyku, gıdıklama, mama.
   Sekmeler: Oyna (top getir · ip çekme · ödül yakala) · Albüm (gerçek fotoğraflar + telefondan ekleme, IndexedDB)
   · Günlük (mama, yürüyüş, tımar, kilo, hatırlatıcı, bugün ne yaptı) · Bakım (Pomeranian'a özel ipuçları)
   · Sözler (konuşma balonu koleksiyonu). Her şey cd.barbie.* ve IndexedDB'de kalır.
   Sesler Web Audio ile burada sentezlenir (hav / inleme / homurtu / soluma); hazır ses dosyası yok. */
(() => {
  'use strict';
  const ID = 'barbie';

  /* ------------------------------------------------------------ içerik: Pomeranian bakım ipuçları
     Gerçek ve genel geçer bilgi. Marka / ilaç / doz YOK; şüphede veterinere yönlendirir. */
  const IPUCLARI = [
    { id: 'tuy', emoji: '🪮', ad: 'O kabarık tüy', onem: 1, metin: 'Pomeranian\'da iki kat tüy var: altta yumuşak yün, üstte uzun koruyucu kıllar. Haftada 2–3 kez, dökme mevsiminde neredeyse her gün tara. Fırçayı derisine bastırmadan, katman katman geç. Düğüm görürsen çekiştirme; parmakla aç, olmazsa kuaföre bırak.' },
    { id: 'tiras', emoji: '✂️', ad: 'Tıraş etmek yok', onem: 1, metin: 'Yazın serinler diye dibine kadar tıraş etmek Pomeranian\'da ters teper: o tüy güneşten ve sıcaktan da koruyor, üstelik bir daha eskisi gibi çıkmayabilir. Sadece pati altı, popo çevresi ve düzeltme kesimi yapılır. Karar vermeden önce veterinerine ya da ırkı bilen bir kuaföre sor.' },
    { id: 'sicak', emoji: '🌡️', ad: 'Sıcak günler', onem: 1, metin: 'Kalın tüy + minik beden = sıcakta zorlanır. Yazın yürüyüşü sabahın erkenine ve akşam serinine al, asfalt yakıyorsa elinin tersiyle dene. Yanında su taşı, gölgede mola ver. Durmadan soluyor, sendeliyor ya da dili koyulaşıyorsa serinlet ve hemen veterinere.' },
    { id: 'tasma', emoji: '🦮', ad: 'Tasma değil, göğüs kayışı', onem: 1, metin: 'Küçük ırklarda soluk borusu hassastır; boyundan çeken tasma öksürüğe ve nefes sıkıntısına yol açabilir. Yürüyüşlerde göğüs kayışı (harness) daha güvenli. Kaz gibi öten kuru bir öksürük duyarsan not al ve veterinerine anlat.' },
    { id: 'dis', emoji: '🦷', ad: 'Minik ağız, büyük iş', onem: 1, metin: 'Küçük ırkların dişleri sıkışık durur, diş taşı ve diş eti iltihabı erken başlar. Köpeklere özel macunla düzenli fırçalama en iyisi; alıştırmaya parmağınla, birkaç saniyeyle başla. Ağzı kokuyor, yerken çekiniyor ya da diş eti kızarmışsa veteriner kontrolü ister.' },
    { id: 'diz', emoji: '🦵', ad: 'Diz kapağı (patella)', onem: 1, metin: 'Minik ırklarda diz kapağı yerinden oynayabilir. Belirtisi tatlıdır ama önemli: birkaç adım tek bacağını havada sekerek yürür, sonra hiçbir şey olmamış gibi devam eder. Yüksekten atlamasına izin verme, kaygan zemine küçük halı ser, kilosunu ölçülü tut. Sekme görürsen veterinere göster.' },
    { id: 'porsiyon', emoji: '🥣', ad: 'Küçük beden, küçük porsiyon', onem: 1, metin: 'Bir avuç fazla mama Barbie için bizim iki tabağımız gibi. Günü sabit öğünlere böl, ödülleri de günlük hesaba kat. Öğün atlatma; minik ırklarda kan şekeri hızlı düşer. Hangi mama, ne kadar? Bunu kilosunu bilen veterineri söyler; ben sadece saati tutarım.' },
    { id: 'tirnak', emoji: '💅', ad: 'Tırnak kesimi', onem: 2, metin: 'Yürürken zeminde tıkırtı duyuyorsan tırnak uzamıştır; genelde 3–4 haftada bir kesilir. Tırnağın içindeki pembe damarı (canlı kısım) kesmemek için azar azar, uçtan uçtan git. Koyu tırnakta göremiyorsan hiç riske girme, veteriner ya da kuaför beş dakikada halleder.' },
    { id: 'goz', emoji: '👀', ad: 'Göz ve kulak', onem: 2, metin: 'Kara gözlerin çevresinde hafif ıslaklık normal; yumuşak nemli bezle günlük sil ki leke yapmasın. Kulak içi temiz ve kokusuz olmalı. Sürekli kaşıma, koyu akıntı, kızarıklık ya da gözde bulanıklık varsa kendi kendine damla damlatma, veterinere git.' },
    { id: 'yuruyus', emoji: '🐾', ad: 'Enerji ve yürüyüş', onem: 2, metin: 'Minik ama enerjisi büyük: günde iki kısa yürüyüş ve evde birkaç oyun molası çoğuna yeter. Yorulduğunda kucağa gelir, bu normal. Yürüyüş sadece tuvalet değil; koklamak Barbie için gazete okumak gibi, acele ettirme.' },
    { id: 'havlama', emoji: '📣', ad: 'Havlamayı seviyor', onem: 2, metin: 'Pomeranian doğuştan bekçi: kapı, asansör, kuş… hepsine haber verir. Bağırmak işe yaramaz, sesi yükseltir. Sakin bir "tamam" deyip susunca ödüllendir; sustuğu anı yakalamak sırrı. Yeni sesleri, insanları, köpekleri yavaş yavaş tanıtmak da havlamayı azaltır.' },
    { id: 'banyo', emoji: '🛁', ad: 'Banyo', onem: 3, metin: 'Sık banyo tüyün doğal yağını alır; genelde birkaç ayda bir ya da kirlendikçe yeter. Köpeklere özel şampuan kullan, iyice durula, sonra iyice kurut — alt katman ıslak kalırsa deri sorun çıkarır. Kulağına su kaçırmamaya dikkat et.' },
    { id: 'dokum', emoji: '🍂', ad: 'Tüy dökümü mevsimi', onem: 3, metin: 'İlkbahar ve sonbaharda alt tüyünü topluca döker; ev bir hafta krem rengi olur, panik yok. Bu dönemde günlük tarama hem düğümü hem evdeki tüyü azaltır. Ama tüy tutam tutam dökülüp altı açılıyorsa ya da kaşınıyorsa bu mevsim değil, veteriner işi.' },
    { id: 'vet', emoji: '🩺', ad: 'Hemen veterinere', onem: 1, metin: 'Yemiyorsa, kusuyor ya da ishalse, nefes almakta zorlanıyorsa, bacağını basmıyorsa, halsizse ya da bir şey yuttuğundan şüpheleniyorsan bekleme. Minik bedende işler hızlı ilerler; erken gitmek en iyi bakımdır. Aşı ve parazit takvimini de onun doktoru belirler.' }
  ];

  /* ------------------------------------------------------------ içerik: sözler */
  const SOZLER = [
    'Hav! Hav! Seni gördüm.', 'Kucak boş mu? Sadece soruyorum.', 'O mama kimin için? Benim değil mi?', 'Cemre benim insanım.',
    'Kuyruğum durmuyor, elimde değil.', 'Kapıya biri geldi. Ben duydum. Ben söyledim.', 'Dilim dışarıda mı? Hep dışarıda.',
    'Yürüyüşe mi? YÜRÜYÜŞE Mİ? YÜRÜYÜŞE!', 'Ayakkabını giyerken kalbim hızlanıyor, fark ettin mi?', 'Bu koltuk benim. Sen de oturabilirsin tabii.',
    'Bir öpücük daha, sonra bırakırım. Şaka, bırakmam.', 'Bugün üç kez döndüm, sonra yattım. Ritüel.', 'Tüyüm biraz döküldü. Sana hediye bıraktım.',
    'Bacaklarım minik ama kalbim koca köpek.', 'Sen mutfağa gidince ben de gidiyorum. Kural bu.', 'Rüyamda koşuyordum, patilerim oynuyormuş, duydum.',
    'Beni fırçala, sonra kendimi çok yakışıklı hissedeyim.', 'Top nerede? Top nerede? …Ha, ağzımdaydı.', 'Bugün bir kediyle göz göze geldik. Ben kazandım sanırım.',
    'Karnımı okşarsan bacağım kendi kendine oynuyor.', 'Sen gidince kapıda oturuyorum. Bilgin olsun.', 'Ben küçük değilim, kompaktım.',
    'Bu ses neydi? Ben bakayım. Hav.', 'Battaniyenin altına girdim, artık görünmezim.', 'Bir ödül. Sadece bir tane. Tamam iki.',
    'Sana sarıldığımda kalbin duyuluyor, seviyorum onu.', 'Kuyruğum bir fan gibi. Havalandırma bende.', 'Bugün çok yoruldum. Üç metre yürüdüm.',
    'Beni kucağına al da dünyayı orada seyredeyim.', 'Islak burnumu koluna değdirdim, mühürledim seni.', 'Yeni bir koku var. Tam on dakika araştıracağım.',
    'Aynada bir köpek gördüm. Tanışmak istedi, korktum.', 'Kar yağarsa bana kar taneleri yapış diye söyle.', 'Sesin geldiği yere koşuyorum, hep koşacağım.',
    'Uyurken gülümsüyormuşum. Rüyamda sen varsın.', 'Bir kere daha at şu topu. Son. Yemin.', 'Sen yorgunsun, ben yanına kıvrılayım.',
    'Fırçalanınca krem şeker gibi oluyorum.', 'Bugün cesurdum: süpürgeye baktım ve kaçmadım.', 'Ben senin küçük gölgenim, arkanı dön bak.',
    'Beni sevmen için havlamama gerek yok ama yine de havlayacağım.'
  ];
  const HAVLAMA = 'HAV! HAV! HAV!';
  const SELAM = ['Cemre! Geldin! Kuyruğum çıldırdı.', 'Hav! Seni bekliyordum.', 'Geldin geldin geldin!', 'Kapıyı duydum, koştum. Sendin.'];
  const OZLEDIM = ['Neredeydin? Kapıda oturdum.', 'Çok uzun sürdü. Saatim yok ama uzundu.', 'Geldin! Bir daha gitme, tamam mı?'];
  const TEPKI = {
    kafa: ['tam orası, tam orası', 'kafamı okşa, bayılıyorum', 'hmmm 💗', 'daha, daha'],
    'kulak-sol': ['kulağım kaşınıyordu, sağ ol', 'o kulak radar, dikkat', 'tık! duydum'],
    'kulak-sag': ['bu kulağa da sıra geldi', 'kulaklarım oynuyor bak', 'hı? ne dedin?'],
    burun: ['boop! 🐽', 'burnum ıslak, biliyorum', 'burnuma dokundun, mühürlendin'],
    karin: ['gıdıklama! …tamam gıdıkla', 'karnım! bacağım oynuyor!', 'burası özel bölge, ama devam'],
    'pati-sol': ['pati! çak!', 'patim minik ama işini biliyor', 'pat pat'],
    'pati-sag': ['bu pati de burada', 'pati sayım: dört, kontrol ettim', 'çak bakalım'],
    kuyruk: ['kuyruğum ponpon, dokunma… dokun', 'kuyruğuma yetişemezsin', 'salla salla salla'],
    uyku: ['zZz… (rüyada koşuyor)', 'şşş… rüyamda top var', 'mmm… beş dakika daha'],
    kucak: ['dünyanın en iyi yeri burası', 'kalbini duyuyorum', 'beni bir daha bırakma'],
    oksama: ['evet, tam öyle', 'devam et lütfen', 'bu 10/10 bir okşama', 'gözlerim kapanıyor', 'ben eriyorum']
  };

  /* ------------------------------------------------------------ içerik: oyunlar */
  const OYUNLAR = {
    top: { ad: 'Top getir', emoji: '🎾', aciklama: 'Topu tut, savur; koşup geri getirsin.', ipucu: 'Topu tut ve savur', birim: 'getirme',
      yakala: ['Getirdim! Gördün mü?', 'Bir daha at, bir daha!', 'Top bende. Top hep bende.', 'Bunu ben yakaladım, ben.'] },
    ip: { ad: 'İp çekme', emoji: '🪢', aciklama: 'İpin ucunu tut, arka arkaya çek. Direnir.', ipucu: 'İpi tut, kendine doğru çek', birim: 'tur',
      yakala: ['Tamam tamam, senin!', 'Bıraktım, bıraktım!', 'Sen kazandın. Bu sefer.'] },
    odul: { ad: 'Ödül yakala', emoji: '🦴', aciklama: 'Düşen ödülleri ağzıyla yakalasın. 45 saniye.', ipucu: 'Parmağını sağa sola gezdir', birim: 'ödül',
      yakala: ['Hap! Yakaladım.', 'Bu da bende!', 'Ağzım tam yerinde.'] }
  };

  const RUH = [['🐶', 'mutlu'], ['😍', 'sevgi dolu'], ['🥱', 'uykulu'], ['🤪', 'deli enerji'], ['🍖', 'obur'], ['🐾', 'yaramaz'], ['🥺', 'kıskanç']];
  const OLAYLAR = [['tuvalet', '💧', 'Tuvalet'], ['kaka', '💩', 'Kaka'], ['oyun', '🎾', 'Oynadı'], ['uyudu', '😴', 'Uyudu'], ['uyandi', '☀️', 'Uyandı'], ['banyo', '🛁', 'Banyo']];
  const HATIRLATICI_TURLERI = [['veteriner', '🩺', 'Veteriner kontrolü'], ['asi', '💉', 'Aşı'], ['parazit', '💊', 'Parazit koruması'], ['tirnak', '💅', 'Tırnak kesimi'], ['timar', '🪮', 'Kuaför / tımar'], ['diger', '📌', 'Başka bir şey']];

  const gizliUrl = y => (window.GIZLI && window.GIZLI.url ? window.GIZLI.url(y) : y);
  const SABIT_FOTOLAR = [
    { id: 'sabit:barbie-1', kucuk: 'assets/barbie/barbie-1-thumb.jpg', buyuk: 'assets/barbie/barbie-1.jpg', varsayilan: 'Şu gözlere bak 🖤', alt: 'Barbie\'nin yakın çekim yüzü: krem tüy, kapkara parlak gözler, koyu kahve burun', donus: 0 },
    { id: 'sabit:barbie-2', kucuk: 'assets/barbie/barbie-2-thumb.jpg', buyuk: 'assets/barbie/barbie-2.jpg', varsayilan: 'Dili hep dışarıda 🐾', alt: 'Barbie çizgili battaniyede kucakta, dili dışarıda, Cemre\'nin eli çenesinin altında', donus: 0 },
    { id: 'sabit:cemre-barbie', kucuk: 'assets/barbie/cemre-barbie-thumb.jpg', buyuk: 'assets/barbie/cemre-barbie.jpg', varsayilan: 'İkimiz 💗', alt: 'Cemre ve Barbie yan yana, tül perdenin önünde birlikte poz veriyor', donus: 0 }
  ];

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null, g = null;
  const ui = {};
  const zamanlar = new Set();
  const dinleyiciler = [];
  let raf = 0, canliTik = 0, solumaTik = 0;
  let sekme = 'oyna', basili = null, oksuyor = false, sonKalp = 0, balonT = 0, kirpT = 0, bosT = 0, mesgul = false, uykuDokunus = [];
  let oy = null;
  let fotolar = null, urlHavuzu = [];
  let tuslar = null;

  const rastgele = a => CD.rastgele(a);
  function sonra(fn, ms) { const t = setTimeout(() => { zamanlar.delete(t); if (ctx) fn(); }, ms); zamanlar.add(t); return t; }
  function iptal(t) { clearTimeout(t); zamanlar.delete(t); }
  function hepsiniIptal() { zamanlar.forEach(clearTimeout); zamanlar.clear(); }
  function dinle(hedef, ad, fn, sec) { hedef.addEventListener(ad, fn, sec); dinleyiciler.push([hedef, ad, fn, sec]); }
  function isoYaz(t) { return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
  function saat(ts) { return CD.saatYaz(new Date(ts)); }
  function gunBasi(ts) { const t = new Date(ts); t.setHours(0, 0, 0, 0); return t.getTime(); }
  function bugunMu(ts) { return gunBasi(ts) === gunBasi(Date.now()); }
  function gecerliTarih(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }
  function AD() { const c = (ctx && ctx.config && ctx.config.BARBIE) || {}; return (c.AD || '').trim() || 'Barbie'; }
  function TANIM() { const c = (ctx && ctx.config && ctx.config.BARBIE) || {}; return (c.TANIM || '').trim(); }

  function varsayilanDurum() {
    return { sevgi: 0, uyuyor: false, kucakta: false, duyulan: [], oyun: {}, bugun: { tarih: CD.bugun(), oksama: 0 }, sonGorulme: 0, selamGunu: '', mamaUyariGunu: '', kutlananYil: -1 };
  }
  function varsayilanGunluk() {
    return { mamalar: [], mamaHedef: 2, yuruyusler: [], timarlar: [], kilolar: [], hatirlatici: [], olaylar: [], notlar: [], albumNot: {} };
  }
  function yukle() {
    d = Object.assign(varsayilanDurum(), ctx.depo.al('durum', {}));
    if (!Array.isArray(d.duyulan)) d.duyulan = [];
    if (!d.oyun || typeof d.oyun !== 'object') d.oyun = {};
    if (!d.bugun || d.bugun.tarih !== CD.bugun()) d.bugun = { tarih: CD.bugun(), oksama: 0 };
    g = Object.assign(varsayilanGunluk(), ctx.depo.al('gunluk', {}));
    ['mamalar', 'yuruyusler', 'timarlar', 'kilolar', 'hatirlatici', 'olaylar', 'notlar'].forEach(k => { if (!Array.isArray(g[k])) g[k] = []; });
    if (!g.albumNot || typeof g.albumNot !== 'object') g.albumNot = {};
    if (!(g.mamaHedef >= 1 && g.mamaHedef <= 4)) g.mamaHedef = 2;
  }
  function kaydet() {
    if (!ctx) return;
    d.sonGorulme = Date.now();
    ctx.depo.yaz('durum', d);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function gunlukKaydet() {
    if (!ctx) return;
    g.mamalar = g.mamalar.slice(-240); g.olaylar = g.olaylar.slice(-400); g.notlar = g.notlar.slice(0, 200);
    g.kilolar = g.kilolar.slice(-150); g.yuruyusler = g.yuruyusler.slice(-300); g.timarlar = g.timarlar.slice(-120);
    ctx.depo.yaz('gunluk', g);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function ipucuMetni() {
    if (d.uyuyor) return 'Uyuyor, şşş 💤';
    const dk = bugunYuruyus();
    if (dk) return 'Bugün ' + dk + ' dk yürüdü 🦮';
    const n = g.mamalar.filter(bugunMu).length;
    if (n > 0) return 'Bugün ' + n + ' öğün yedi 🍖';
    if (d.sonGorulme && Date.now() - d.sonGorulme > 6 * 3600000) return 'Kapıda seni bekliyor 🐾';
    return 'Kuyruğu duruyor mu? Hayır 🐾';
  }

  /* ------------------------------------------------------------ yaş (doğum tarihi bilinmiyorsa uydurmaz) */
  function dogumTarihi() {
    const cfg = (ctx.config.BARBIE && ctx.config.BARBIE.DOGUM_TARIHI) || '';
    const kayit = ctx.depo.al('dogumTarihi', '');
    if (gecerliTarih(kayit)) return kayit;
    if (gecerliTarih(cfg)) return cfg;
    return '';
  }
  function yasGun() { const t = dogumTarihi(); if (!t) return -1; const f = CD.gunFarki(t); return f == null ? -1 : Math.max(0, f); }
  function yasMetni() {
    const gn = yasGun();
    if (gn < 0) return '';
    const yil = Math.floor(gn / 365), ay = Math.floor((gn % 365) / 30);
    if (gn < 31) return gn + ' günlük';
    if (yil < 1) return Math.max(1, Math.floor(gn / 30)) + ' aylık';
    return yil + ' yaşında' + (ay ? ' ' + ay + ' aylık' : '');
  }
  function dogumGunuKalan() {
    const t = dogumTarihi(); if (!t) return null;
    const p = t.split('-'), simdi = new Date(); simdi.setHours(0, 0, 0, 0);
    let hedef = new Date(simdi.getFullYear(), Number(p[1]) - 1, Number(p[2]));
    if (hedef.getTime() < simdi.getTime()) hedef = new Date(simdi.getFullYear() + 1, Number(p[1]) - 1, Number(p[2]));
    return Math.round((hedef.getTime() - simdi.getTime()) / 86400000);
  }
  function bugunYuruyus() { return g.yuruyusler.filter(y => bugunMu(y.t)).reduce((a, y) => a + (y.dk || 0), 0); }
  function sonTimarGun() { if (!g.timarlar.length) return null; return Math.floor((Date.now() - Math.max.apply(null, g.timarlar)) / 86400000); }

  /* ============================================================ SES (Web Audio; dosya yok) */
  function sesCikis(c) { return CD.ses.master || c.destination; }
  function ton(c, tip, f0, f1, sure, kazanc, filtre, gecik) {
    const o = c.createOscillator(), gn = c.createGain();
    o.type = tip; const t = c.currentTime + (gecik || 0);
    o.frequency.setValueAtTime(f0, t);
    if (f1 != null && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + sure);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(kazanc, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    let son = o;
    if (filtre) { const f = c.createBiquadFilter(); f.type = filtre.tip; f.frequency.setValueAtTime(filtre.f, t); if (filtre.f2) f.frequency.exponentialRampToValueAtTime(filtre.f2, t + sure); f.Q.value = filtre.q || 1; o.connect(f); son = f; }
    son.connect(gn); gn.connect(sesCikis(c));
    o.start(t); o.stop(t + sure + 0.03);
  }
  function hisirti(c, sure, kazanc, f, f2, tip, gecik) {
    const n = Math.max(1, Math.floor(c.sampleRate * sure));
    let b; try { b = c.createBuffer(1, n, c.sampleRate); } catch (e) { return; }
    const dd = b.getChannelData(0);
    for (let i = 0; i < n; i++) dd[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b;
    const gn = c.createGain(); const t = c.currentTime + (gecik || 0);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(kazanc, t + 0.008);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    const flt = c.createBiquadFilter(); flt.type = tip || 'bandpass'; flt.Q.value = 0.9;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + sure);
    s.connect(flt); flt.connect(gn); gn.connect(sesCikis(c));
    s.start(t); s.stop(t + sure + 0.03);
  }
  const ses = {
    baglam() { try { return ctx && ctx.ses ? ctx.ses.baglam() : null; } catch (e) { return null; } },
    /* tek havlama: kısa gürültü patlaması + hızlı düşen testere dalgası */
    hav(tiz, gecik) {
      const c = this.baglam(); if (!c) return;
      const f0 = 560 * (tiz || 1);
      ton(c, 'sawtooth', f0 * 1.35, f0 * 0.42, 0.14, 0.085, { tip: 'bandpass', f: f0 * 2.1, f2: f0 * 0.9, q: 1.1 }, gecik || 0);
      ton(c, 'triangle', f0 * 2.4, f0 * 0.9, 0.09, 0.04, null, (gecik || 0) + 0.006);
      hisirti(c, 0.05, 0.05, 2200, 800, 'bandpass', gecik || 0);
    },
    havlar(n, tiz) { for (let i = 0; i < (n || 2); i++) this.hav((tiz || 1) * (i % 2 ? 1.06 : 1), i * 0.2); },
    /* mutlu inleme: yukarı-aşağı süzülen ince ses */
    inle() {
      const c = this.baglam(); if (!c) return;
      const o = c.createOscillator(), gn = c.createGain(), t = c.currentTime;
      o.type = 'sine';
      o.frequency.setValueAtTime(520, t);
      o.frequency.linearRampToValueAtTime(880, t + 0.16);
      o.frequency.linearRampToValueAtTime(660, t + 0.42);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(gn); gn.connect(sesCikis(c));
      o.start(t); o.stop(t + 0.55);
    },
    /* oyun homurtusu: alçak gürültü + titreşimli testere (kızgın değil, oyuncu) */
    homurtu(sure) {
      const c = this.baglam(); if (!c) return;
      const s = sure || 0.5;
      ton(c, 'sawtooth', 96, 82, s, 0.05, { tip: 'lowpass', f: 380, q: 2 }, 0);
      ton(c, 'square', 62, 56, s, 0.035, { tip: 'lowpass', f: 260 }, 0.01);
      hisirti(c, s, 0.03, 300, 180, 'lowpass', 0);
    },
    /* tek soluk (nefes) */
    soluk() { const c = this.baglam(); if (!c) return; hisirti(c, 0.11, 0.026, 1100, 2400, 'bandpass', 0); },
    yala() { const c = this.baglam(); if (!c) return; hisirti(c, 0.07, 0.035, 1600, 3200, 'bandpass', 0); hisirti(c, 0.06, 0.03, 2400, 1200, 'bandpass', 0.1); },
    /* soluma döngüsü: okşarken / koşarken */
    solumaBaslat() {
      if (solumaTik) return;
      const at = () => { ses.soluk(); };
      at();
      solumaTik = setInterval(() => { if (!ctx) { clearInterval(solumaTik); solumaTik = 0; return; } at(); }, 340);
    },
    solumaDur() { if (solumaTik) { clearInterval(solumaTik); solumaTik = 0; } }
  };

  /* ============================================================ SVG */
  const n1 = v => Math.round(v * 10) / 10;
  /* tüylü kenar: n adet dışa taşan yay ile kabarık siluet */
  function tuylu(cx, cy, rx, ry, n, derinlik) {
    let yol = '';
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      const x0 = cx + Math.cos(a0) * rx, y0 = cy + Math.sin(a0) * ry;
      const x1 = cx + Math.cos(a1) * rx, y1 = cy + Math.sin(a1) * ry;
      const k = 1 + (derinlik == null ? 0.06 : derinlik);
      const xm = cx + Math.cos(am) * rx * k * 1.06, ym = cy + Math.sin(am) * ry * k * 1.06;
      if (i === 0) yol += 'M' + n1(x0) + ' ' + n1(y0);
      yol += 'Q' + n1(xm) + ' ' + n1(ym) + ' ' + n1(x1) + ' ' + n1(y1);
    }
    return yol + 'Z';
  }

  const IKON = '<svg viewBox="0 0 64 64">' +
    '<path d="M20 27 18 9l18 11z" fill="var(--barbie-tuy)"/><path d="M44 27 46 9 28 20z" fill="var(--barbie-tuy)"/>' +
    '<path d="M22.5 24 21.5 14l12 7z" fill="var(--barbie-kulak)"/><path d="M41.5 24 42.5 14 30.5 21z" fill="var(--barbie-kulak)"/>' +
    '<ellipse cx="32" cy="36" rx="24" ry="22" fill="var(--barbie-tuy)"/>' +
    '<ellipse cx="32" cy="43" rx="13.5" ry="11" fill="var(--barbie-tuy-acik)"/>' +
    '<circle cx="23" cy="34" r="4.8" fill="var(--barbie-goz)"/><circle cx="41" cy="34" r="4.8" fill="var(--barbie-goz)"/>' +
    '<circle cx="21.4" cy="32.2" r="1.6" fill="#FFFFFF"/><circle cx="39.4" cy="32.2" r="1.6" fill="#FFFFFF"/>' +
    '<ellipse cx="32" cy="43.5" rx="5.6" ry="4.3" fill="var(--barbie-burun)"/>' +
    '<path d="M29.4 53q2.6-1.5 5.2 0 .8 5-2.6 6-3.4-1-2.6-6z" fill="var(--barbie-dil)"/>' +
    '</svg>';

  function kopekSvg() {
    return '<svg class="barbie-svg" viewBox="0 0 260 244" aria-hidden="true" focusable="false">' +
      '<ellipse class="bb-golge" cx="130" cy="231" rx="80" ry="9"/>' +
      '<g class="bb-kucak bb-kucak-arka"><path d="M18 154c-12 40-4 82 46 86h132c50-4 58-46 46-86-30-26-70-34-112-34S48 128 18 154z"/></g>' +
      '<g class="bb-govde-g">' +
        '<g class="bb-kuyruk"><path class="bb-tuy" d="' + tuylu(198, 166, 31, 22, 13, 0.14) + '"/><path class="bb-tuy-acik" d="' + tuylu(201, 166, 18, 12, 10, 0.12) + '" opacity=".7"/></g>' +
        '<path class="bb-tuy" d="' + tuylu(130, 182, 62, 43, 20, 0.07) + '"/>' +
        '<path class="bb-tuy-acik" d="' + tuylu(130, 194, 41, 27, 15, 0.08) + '" opacity=".75"/>' +
        '<g class="bb-pati bb-pati-sol"><ellipse class="bb-tuy" cx="103" cy="216" rx="20" ry="12"/><path class="bb-pati-cizgi" d="M92 220v-6M99 222v-7M107 222v-7M114 220v-6"/></g>' +
        '<g class="bb-pati bb-pati-sag"><ellipse class="bb-tuy" cx="157" cy="216" rx="20" ry="12"/><path class="bb-pati-cizgi" d="M146 220v-6M153 222v-7M161 222v-7M168 220v-6"/></g>' +
      '</g>' +
      '<g class="bb-kafa-g">' +
        '<g class="bb-kulak bb-kulak-sol"><path class="bb-tuy" d="M90 78 82 22l44 30z"/><path class="bb-kulak-ic" d="M95 70 89 37l28 17z"/></g>' +
        '<g class="bb-kulak bb-kulak-sag"><path class="bb-tuy" d="M170 78 178 22l-44 30z"/><path class="bb-kulak-ic" d="M165 70 171 37l-28 17z"/></g>' +
        '<path class="bb-tuy" d="' + tuylu(130, 106, 71, 61, 22, 0.055) + '"/>' +
        '<path class="bb-tuy-acik" d="' + tuylu(130, 126, 42, 32, 16, 0.05) + '" opacity=".8"/>' +
        '<g class="bb-goz bb-goz-sol">' +
          '<g class="bb-goz-acik"><ellipse class="bb-iris" cx="103" cy="107" rx="13" ry="14"/><circle class="bb-parilti" cx="98.5" cy="101" r="4.4"/><circle class="bb-parilti bb-parilti-kucuk" cx="107" cy="113" r="2"/></g>' +
          '<path class="bb-goz-kapali" d="M90 107q13-9 26 0"/><path class="bb-goz-mutlu" d="M90 111q13-15 26 0"/></g>' +
        '<g class="bb-goz bb-goz-sag">' +
          '<g class="bb-goz-acik"><ellipse class="bb-iris" cx="157" cy="107" rx="13" ry="14"/><circle class="bb-parilti" cx="152.5" cy="101" r="4.4"/><circle class="bb-parilti bb-parilti-kucuk" cx="161" cy="113" r="2"/></g>' +
          '<path class="bb-goz-kapali" d="M144 107q13-9 26 0"/><path class="bb-goz-mutlu" d="M144 111q13-15 26 0"/></g>' +
        '<ellipse class="bb-yanak" cx="80" cy="132" rx="10" ry="7"/><ellipse class="bb-yanak" cx="180" cy="132" rx="10" ry="7"/>' +
        '<g class="bb-burun-g">' +
          '<path class="bb-burun" d="M130 127c8.5 0 14.5 3.6 14.5 8.4 0 5.2-6.4 9.6-14.5 9.6s-14.5-4.4-14.5-9.6c0-4.8 6-8.4 14.5-8.4z"/>' +
          '<ellipse class="bb-burun-isik" cx="124.5" cy="132.5" rx="4" ry="2.4"/>' +
        '</g>' +
        '<path class="bb-agiz" d="M130 145v3.5m0 0c-4.4 6.4-12 6.4-16 1.6m16-1.6c4.4 6.4 12 6.4 16 1.6"/>' +
        '<g class="bb-agiz-acik"><ellipse class="bb-agiz-ic" cx="130" cy="153" rx="11" ry="11.5"/></g>' +
        '<g class="bb-dil"><path class="bb-dil-yol" d="M122 150q8-4 16 0 2.4 13-8 16.5-10.4-3.5-8-16.5z"/><path class="bb-dil-cizgi" d="M130 153v10"/></g>' +
      '</g>' +
      '<g class="bb-kucak bb-kucak-on"><path d="M28 178c-10 34 4 62 48 64h108c44-2 58-30 48-64-30 22-66 30-102 30s-72-8-102-30z"/><path class="bb-kucak-ilmek" d="M52 216c14 6 30 8 50 8M72 228c16 4 36 6 60 4M148 222c16 0 30-2 44-8"/></g>' +
      '<g class="bb-mama"><ellipse class="bb-mama-golge" cx="130" cy="228" rx="34" ry="6"/><path class="bb-mama-kase" d="M100 206h60l-7 20a6 6 0 0 1-6 4h-34a6 6 0 0 1-6-4z"/><ellipse class="bb-mama-ic" cx="130" cy="207" rx="30" ry="7"/><circle class="bb-mama-tane" cx="121" cy="206" r="4"/><circle class="bb-mama-tane" cx="132" cy="209" r="4.5"/><circle class="bb-mama-tane" cx="142" cy="205" r="4"/></g>' +
      '<g class="bb-vurlar">' +
        '<ellipse class="bb-vur" data-bolge="kafa" cx="130" cy="100" rx="71" ry="58"/>' +
        '<ellipse class="bb-vur" data-bolge="karin" cx="130" cy="188" rx="58" ry="34"/>' +
        '<ellipse class="bb-vur bb-vur-kuyruk" data-bolge="kuyruk" cx="203" cy="166" rx="30" ry="22"/>' +
        '<ellipse class="bb-vur" data-bolge="pati-sol" cx="103" cy="216" rx="22" ry="14"/>' +
        '<ellipse class="bb-vur" data-bolge="pati-sag" cx="157" cy="216" rx="22" ry="14"/>' +
        '<path class="bb-vur" data-bolge="kulak-sol" d="M76 16 134 50 88 88z"/>' +
        '<path class="bb-vur" data-bolge="kulak-sag" d="M184 16 126 50l46 38z"/>' +
        '<ellipse class="bb-vur" data-bolge="burun" cx="130" cy="140" rx="20" ry="18"/>' +
      '</g>' +
    '</svg>';
  }

  /* ------------------------------------------------------------ sahne kurulumu */
  function sahneKur() {
    const sahne = ctx.el('div.sahne.barbie-sahne', { 'aria-label': AD() + ' halının üstünde' });
    const balonYer = ctx.el('div.barbie-balon-yer', [ctx.el('div.balon.barbie-balon', { role: 'status', 'aria-live': 'polite' })]);
    const alt = ctx.el('div.barbie-alt', [
      ctx.el('span.rozet.goz.barbie-yas'),
      ctx.el('span.rozet.barbie-hal', { hidden: true }),
      ctx.el('span.barbie-ipucu', { 'aria-hidden': 'true' }, 'Okşamak için dokun ve gezdir')
    ]);
    const kopekYer = ctx.el('div.barbie-kopek-yer', { role: 'img', tabindex: '0', 'aria-label': AD() + '; okşamak için dokun ve gezdir' });
    kopekYer.insertAdjacentHTML('beforeend', kopekSvg());
    const zzz = ctx.el('div.barbie-zzz', { 'aria-hidden': 'true' }, [ctx.el('span', 'z'), ctx.el('span', 'z'), ctx.el('span', 'z')]);
    const oyunKat = ctx.el('div.barbie-oyun-kat', { 'aria-hidden': 'true' });
    const top = ctx.el('div.barbie-top', { hidden: true });
    const ipUc = ctx.el('div.barbie-ip-uc', { hidden: true });
    const ip = ctx.svg('<svg class="barbie-ip" aria-hidden="true"><path/></svg>');
    oyunKat.append(ip, top, ipUc);
    const hud = ctx.el('div.barbie-hud', { hidden: true }, [
      ctx.el('span.barbie-hud-ad'),
      ctx.el('span.barbie-hud-skor.sayi', '0'),
      ctx.el('span.barbie-hud-ek', { hidden: true }),
      ctx.el('button.dugme-ikincil.kucuk.barbie-hud-yardim', { type: 'button', hidden: true, onclick: yardimEylemi }, 'At'),
      ctx.el('button.dugme-ikincil.kucuk.barbie-hud-bitir', { type: 'button', onclick: () => oyunBitir(true) }, 'Bitir')
    ]);
    const havYazi = ctx.el('div.barbie-hav-yazi', { 'aria-hidden': 'true' });
    sahne.append(balonYer, oyunKat, kopekYer, zzz, alt, hud, havYazi);
    ctx.pati(sahne);
    Object.assign(ui, {
      sahne, balon: balonYer.firstChild, alt,
      yas: alt.querySelector('.barbie-yas'), hal: alt.querySelector('.barbie-hal'), ipucu: alt.querySelector('.barbie-ipucu'),
      kopekYer, svg: kopekYer.querySelector('.barbie-svg'), zzz, oyunKat, top, ipUc, ip, ipYol: ip.querySelector('path'),
      hud, hudAd: hud.querySelector('.barbie-hud-ad'), hudSkor: hud.querySelector('.barbie-hud-skor'),
      hudEk: hud.querySelector('.barbie-hud-ek'), hudYardim: hud.querySelector('.barbie-hud-yardim'), havYazi
    });
    ui.kulakSol = ui.svg.querySelector('.bb-kulak-sol'); ui.kulakSag = ui.svg.querySelector('.bb-kulak-sag');
    ui.patiSol = ui.svg.querySelector('.bb-pati-sol'); ui.patiSag = ui.svg.querySelector('.bb-pati-sag');
    ui.kuyruk = ui.svg.querySelector('.bb-kuyruk'); ui.burun = ui.svg.querySelector('.bb-burun-g');

    ui.svg.addEventListener('pointerdown', dokunBasla);
    ui.svg.addEventListener('pointermove', dokunHareket);
    ui.svg.addEventListener('pointerup', dokunBitir);
    ui.svg.addEventListener('pointercancel', dokunBitir);
    ui.svg.addEventListener('lostpointercapture', dokunBitir);
    kopekYer.addEventListener('keydown', e => {
      if (oy) return;                                   // oyun sırasında Enter/Boşluk oyun yardımına gider
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const m = ctx.efekt.merkez(kopekYer); tepki('kafa', m.x, m.y); }
    });
    sahne.addEventListener('pointerdown', oyunBas);
    sahne.addEventListener('pointermove', oyunHareket);
    sahne.addEventListener('pointerup', oyunBirak);
    sahne.addEventListener('pointercancel', oyunBirak);
    durumGuncelle();
    return sahne;
  }

  function durumGuncelle() {
    if (!ui.yas) return;
    const yas = yasMetni();
    ui.yas.textContent = yas || (TANIM() ? 'minik Pomeranian' : AD());
    const s = ui.svg.classList;
    s.toggle('uyuyor', !!d.uyuyor); s.toggle('kucakta', !!d.kucakta);
    ui.sahne.classList.toggle('barbie-gece', !!d.uyuyor);
    ui.zzz.classList.toggle('goster', !!d.uyuyor && !oy);
    let hal = '';
    if (oy) hal = OYUNLAR[oy.tur].emoji + ' ' + OYUNLAR[oy.tur].ad;
    else if (d.uyuyor) hal = '💤 uyuyor';
    else if (d.kucakta) hal = '🤲 kucakta';
    ui.hal.textContent = hal; ui.hal.hidden = !hal;
    ui.ipucu.textContent = oy ? OYUNLAR[oy.tur].ipucu
      : d.uyuyor ? 'Şşş… uyuyor. Uyandırmak için alttan "Uyandır"'
      : d.kucakta ? 'Kucakta kıvrıldı; okşamaya devam'
      : 'Okşamak için dokun ve gezdir';
  }

  /* ------------------------------------------------------------ konuşma balonu */
  function soyle(metin, sure) {
    if (!ui.balon) return;
    metin = String(metin).replace('{ad}', AD());
    ui.balon.textContent = metin; ui.balon.classList.add('goster');
    iptal(balonT); balonT = sonra(() => ui.balon.classList.remove('goster'), sure || 2600);
  }
  function havla() {
    if (!ui.havYazi) return;
    ui.balon.classList.remove('goster');
    ui.havYazi.textContent = HAVLAMA;
    ui.havYazi.classList.remove('goster'); void ui.havYazi.offsetWidth; ui.havYazi.classList.add('goster');
    ui.svg.classList.add('havliyor');
    ses.havlar(3, 1.05);
    ctx.efekt.sarsinti(ui.sahne, 1);
    const m = ctx.efekt.merkez(ui.kopekYer);
    ctx.efekt.emoji(m.x, m.y - 40, '🐾', 3); ctx.efekt.yildiz(m.x, m.y - 30, 5);
    sonra(() => {
      ui.havYazi.classList.remove('goster'); ui.svg.classList.remove('havliyor');
      soyle('Kapıya biri geldi sandım. Ben bakarım hep.', 2400);
    }, 1500);
  }
  function sozSoyle(indeks) {
    if (oy) return;
    let i = indeks;
    if (i == null) {
      if (Math.random() < 0.12) {
        havla();
        if (d.duyulan.indexOf(-1) < 0) { d.duyulan.push(-1); kaydet(); sozlerListesiYenile(); }
        return;
      }
      const duyulmamis = SOZLER.map((s, k) => k).filter(k => d.duyulan.indexOf(k) < 0);
      i = duyulmamis.length && Math.random() < 0.7 ? rastgele(duyulmamis) : Math.floor(Math.random() * SOZLER.length);
    }
    if (d.duyulan.indexOf(i) < 0) { d.duyulan.push(i); kaydet(); sozlerListesiYenile(); }
    if (d.uyuyor) { uykudaKipirda(); return; }
    ses.inle();
    ui.svg.classList.add('konusuyor'); sonra(() => ui.svg.classList.remove('konusuyor'), 520);
    soyle(SOZLER[i], 3200);
  }

  /* ------------------------------------------------------------ dokunma / okşama */
  function bolgeBul(e) { const t = e.target && e.target.closest ? e.target.closest('.bb-vur') : null; return t ? t.dataset.bolge : 'kafa'; }
  function dokunBasla(e) {
    if (oy || mesgul) return;
    e.preventDefault();
    try { ui.svg.setPointerCapture(e.pointerId); } catch (err) {}
    basili = { id: e.pointerId, bolge: bolgeBul(e), t: Date.now(), x: e.clientX, y: e.clientY, yol: 0 };
    ses.baglam();
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
    ui.kuyruk.classList.add('hizli');
    ses.solumaBaslat();
    if (Math.random() < 0.4) ses.inle();
    sonKalp = Date.now(); ctx.efekt.kalp(e.clientX, e.clientY, 3);
    if (Math.random() < 0.5) soyle(rastgele(TEPKI.oksama), 1800);
  }
  function oksamaBitir(uzun) {
    oksuyor = false;
    ses.solumaDur();
    sonra(() => { if (!oksuyor) { ui.svg.classList.remove('mutlu'); ui.kuyruk.classList.remove('hizli'); } }, 600);
    if (uzun) { d.sevgi++; d.bugun.oksama++; kaydet(); sevgiYenile(); }
  }
  function tepki(bolge, x, y) {
    if (mesgul) return;
    if (d.uyuyor) { uykudaKipirda(x, y); return; }
    const s = ui.svg.classList;
    const yeniden = (el, sinif, ms) => { el.classList.remove(sinif); void el.getBoundingClientRect(); el.classList.add(sinif); sonra(() => el.classList.remove(sinif), ms); };
    switch (bolge) {
      case 'kulak-sol': yeniden(ui.kulakSol, 'oynat', 700); ses.soluk(); break;
      case 'kulak-sag': yeniden(ui.kulakSag, 'oynat', 700); ses.soluk(); break;
      case 'burun': yeniden(ui.burun, 'boop', 500); yeniden(ui.svg, 'kirp', 220); ses.yala(); ctx.efekt.yildiz(x, y, 3); break;
      case 'karin': yeniden(ui.svg, 'gidik', 1000); ses.inle(); ses.solumaBaslat(); sonra(() => ses.solumaDur(), 1100); ctx.efekt.kalp(x, y, 4); break;
      case 'pati-sol': yeniden(ui.patiSol, 'kaldir', 700); ctx.ses.hop(); ctx.efekt.pati(x, y); break;
      case 'pati-sag': yeniden(ui.patiSag, 'kaldir', 700); ctx.ses.hop(); ctx.efekt.pati(x, y); break;
      case 'kuyruk': yeniden(ui.kuyruk, 'cilgin', 1400); ses.hav(1.12); break;
      default:
        s.add('mutlu'); ui.kuyruk.classList.add('hizli');
        sonra(() => { if (!oksuyor) { s.remove('mutlu'); ui.kuyruk.classList.remove('hizli'); } }, 1000);
        ses.inle(); ctx.efekt.kalp(x, y, 4);
        d.sevgi++; d.bugun.oksama++; kaydet(); sevgiYenile();
    }
    const liste = d.kucakta && Math.random() < 0.4 ? TEPKI.kucak : (TEPKI[bolge] || TEPKI.kafa);
    soyle(rastgele(liste), 2000);
  }
  function uykudaKipirda(x, y) {
    ui.kulakSol.classList.add('oynat'); sonra(() => ui.kulakSol.classList.remove('oynat'), 700);
    ses.soluk();
    soyle(rastgele(TEPKI.uyku), 1800);
    const t = Date.now(); uykuDokunus = uykuDokunus.filter(z => t - z < 2500); uykuDokunus.push(t);
    if (uykuDokunus.length >= 4) { uykuDokunus = []; uyandir(); }
  }

  /* ------------------------------------------------------------ kucak / uyku / mama */
  function kucakDegistir() {
    if (oy) return;
    d.kucakta = !d.kucakta;
    if (d.kucakta && d.uyuyor) d.uyuyor = false;
    kaydet(); durumGuncelle(); altbarKur();
    ctx.ses.hop();
    const m = ctx.efekt.merkez(ui.kopekYer);
    if (d.kucakta) { ctx.efekt.kalp(m.x, m.y - 30, 6); ses.inle(); soyle(rastgele(TEPKI.kucak), 2400); }
    else { ctx.efekt.toz(m.x, m.y + 60, 4); soyle('Yere indim ama gözüm sende.', 2200); }
  }
  function uyut() {
    if (oy || d.uyuyor) return;
    d.uyuyor = true; d.kucakta = false; kaydet(); durumGuncelle(); altbarKur();
    ses.solumaDur(); ctx.ses.blop();
    soyle('Üç kez döndüm, yattım. İyi geceler Cemre.', 2600);
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
    esne(() => {
      durumGuncelle(); altbarKur();
      ui.kuyruk.classList.add('hizli'); sonra(() => ui.kuyruk.classList.remove('hizli'), 1600);
      soyle(sure ? 'Günaydın! ' + sure + ' uyumuşum.' : 'Günaydın! Bir şey mi oldu?', 2600);
    });
    g.olaylar.push({ t: Date.now(), tur: 'uyandi' }); gunlukKaydet();
    if (sekme === 'gunluk') sekmeYenile();
  }
  function esne(bitince) {
    if (mesgul) { if (bitince) bitince(); return; }
    mesgul = true;
    ui.svg.classList.remove('uyuyor'); ui.svg.classList.add('esniyor');
    ses.inle();
    sonra(() => { ui.svg.classList.remove('esniyor'); mesgul = false; if (bitince) bitince(); }, ctx.azHareket ? 300 : 1500);
  }
  function mamaVer() {
    if (oy) return;
    if (mesgul) {
      if (ui.svg.classList.contains('yiyor')) { ctx.toast('Bir saniye, ağzı dolu.'); return; }
      g.mamalar.push(Date.now()); gunlukKaydet(); ctx.ses.yut(); ctx.toast('Öğün kaydedildi 🍖');
      if (sekme === 'gunluk') sekmeYenile();
      return;
    }
    g.mamalar.push(Date.now()); gunlukKaydet();
    const uyuyordu = d.uyuyor;
    d.uyuyor = false; kaydet(); durumGuncelle();
    mesgul = true;
    ui.svg.classList.add('yiyor');
    ses.havlar(2, 1.1);
    const m = ctx.efekt.merkez(ui.kopekYer);
    let sayac = 0;
    const cigne = () => { if (!ctx) return; sayac++; ctx.ses.cigne(); ctx.efekt.emoji(m.x + 20, m.y + 20, '🍖', 1); if (sayac < 4) sonra(cigne, 480); };
    sonra(cigne, 420);
    sonra(() => {
      ui.svg.classList.remove('yiyor'); mesgul = false;
      d.uyuyor = uyuyordu; durumGuncelle(); altbarKur();
      ctx.ses.yut(); ses.yala();
      const bugunku = g.mamalar.filter(bugunMu).length;
      soyle(rastgele(['Bitti. Kabı yaladım bile.', 'Bu çok lezzetliydi. Biraz daha?', 'Karnım doydu, kalbim doydu.', 'Tabak parlıyor, kontrol ettim.']), 2400);
      ctx.toast(bugunku >= g.mamaHedef ? 'Bugünkü öğünler tamam 🐾' : 'Öğün kaydedildi 🍖 (bugün ' + bugunku + '/' + g.mamaHedef + ')');
      if (sekme === 'gunluk') sekmeYenile();
    }, ctx.azHareket ? 600 : 2600);
  }

  /* ------------------------------------------------------------ boş zaman (idle) */
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
          if (Math.random() < 0.5) { ui.patiSol.classList.add('seyiriyor'); sonra(() => ui.patiSol.classList.remove('seyiriyor'), 1200); }
        } else {
          const r = Math.random();
          if (r < 0.22) { ui.kulakSol.classList.add('oynat'); sonra(() => ui.kulakSol.classList.remove('oynat'), 700); }
          else if (r < 0.42) { ui.kuyruk.classList.add('hizli'); sonra(() => ui.kuyruk.classList.remove('hizli'), 1600); }
          else if (r < 0.58) esne();
          else if (r < 0.72) { ui.svg.classList.add('yalaniyor'); ses.yala(); sonra(() => ui.svg.classList.remove('yalaniyor'), 900); }
          else if (r < 0.82) { ui.svg.classList.add('kafa-egik'); sonra(() => ui.svg.classList.remove('kafa-egik'), 1400); soyle(rastgele(['hı?', 'o ses neydi?', '…', 'ne diyorsun?']), 1600); }
          else if (Math.random() < 0.5) soyle(rastgele(['top?', 'yürüyüş?', 'Cemre?', 'kucak?', 'ödül var mı?']), 1600);
        }
      }
      bosDongu();
    }, 8000 + Math.random() * 9000);
  }

  /* ------------------------------------------------------------ alt çubuk */
  function altbarKur() {
    if (!ctx) return;
    if (oy) { ctx.altbar([{ id: 'bitir', ad: 'Oyunu bitir', ikon: '🛋️', birincil: true, tikla() { oyunBitir(true); } }]); return; }
    ctx.altbar([
      { id: 'mama', ad: 'Mama ver', ikon: '🍖', birincil: true, tikla: mamaVer },
      { id: 'kucak', ad: d.kucakta ? 'Bırak' : 'Kucak', ikon: '🤲', basili: d.kucakta, tikla: kucakDegistir },
      { id: 'uyku', ad: d.uyuyor ? 'Uyandır' : 'Uyut', ikon: d.uyuyor ? '☀️' : '💤', basili: d.uyuyor, tikla() { d.uyuyor ? uyandir() : uyut(); } },
      { id: 'soz', ad: 'Söyle', ikon: '💬', tikla() { sozSoyle(); } },
      { id: 'oyna', ad: 'Oyna', ikon: '🎾', tikla() { sekmeSec('oyna'); ui.sekmeler.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' }); } }
    ]);
  }

  /* ------------------------------------------------------------ sekmeler */
  const SEKMELER = [['oyna', '🎾', 'Oyna'], ['album', '📷', 'Albüm'], ['gunluk', '📔', 'Günlük'], ['bakim', '🪮', 'Bakım'], ['sozler', '💬', 'Sözler']];
  function sekmelerKur() {
    const kap = ctx.el('div.cipler.barbie-sekmeler', { role: 'tablist', 'aria-label': AD() + ' bölümleri' });
    SEKMELER.forEach(([id, ikon, ad]) => {
      kap.appendChild(ctx.el('button.cip', {
        type: 'button', role: 'tab', id: 'barbieSekme-' + id, 'aria-selected': 'false', 'aria-controls': 'barbiePanel',
        data: { sekme: id }, onclick: () => { ctx.ses.tik(); sekmeSec(id); }
      }, [ctx.el('span', { 'aria-hidden': 'true' }, ikon), ctx.el('span', ad)]));
    });
    ui.sekmeler = kap;
    ui.panel = ctx.el('div.icerik.barbie-panel#barbiePanel', { role: 'tabpanel' });
    return kap;
  }
  function sekmeSec(id) {
    sekme = id; ctx.depo.yaz('sekme', id);
    Array.from(ui.sekmeler.children).forEach(c => c.setAttribute('aria-selected', c.dataset.sekme === id ? 'true' : 'false'));
    const aktif = ui.sekmeler.querySelector('[data-sekme="' + id + '"]');
    if (aktif && aktif.scrollIntoView) { try { aktif.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' }); } catch (e) {} }
    sekmeYenile();
  }
  function sekmeYenile() {
    if (!ui.panel) return;
    ui.panel.innerHTML = '';
    const kur = { oyna: oynaKur, album: albumKur, gunluk: gunlukKur, bakim: bakimKur, sozler: sozlerKur }[sekme] || oynaKur;
    const icerik = kur();
    if (icerik) ui.panel.append(icerik);
    sevgiYenile(); sozlerListesiYenile();
  }

  /* ============================================================ OYNA */
  function oynaKur() {
    const kap = ctx.el('div.dikey');
    const giris = ctx.el('div.yama.barbie-oyun-giris', [
      ctx.el('h2.baslik.baslik-lg', 'Oyun zamanı'),
      ctx.el('p.ikincil', AD() + ' minik ama enerjisi büyük. Bir oyun seç; salon oyun alanına dönsün.')
    ]);
    const izgara = ctx.el('div.izgara-2.barbie-oyunlar');
    Object.keys(OYUNLAR).forEach(id => {
      const o = OYUNLAR[id], rekor = d.oyun[id] || 0;
      izgara.appendChild(ctx.el('button.yama.dokun.barbie-oyun-kart', { type: 'button', 'aria-label': o.ad + ' oyununu başlat', onclick: () => oyunBaslat(id) }, [
        ctx.el('span.barbie-oyun-emoji', { 'aria-hidden': 'true' }, o.emoji),
        ctx.el('span.barbie-oyun-ad', o.ad),
        ctx.el('span.sessiz', o.aciklama),
        rekor ? ctx.el('span.rozet.inci', 'rekor ' + rekor + ' ' + o.birim) : ctx.el('span.rozet.gri', 'henüz oynanmadı')
      ]));
    });
    kap.append(giris, izgara, sevgiKarti());
    return kap;
  }
  function sevgiKarti() {
    const kart = ctx.el('div.yama.barbie-sevgi', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Sevgi sayacı'), ctx.el('span.rozet.barbie-sevgi-rozet')]),
      ctx.el('div.barbie-kalpler', { 'aria-hidden': 'true' }),
      ctx.el('p.sessiz.barbie-sevgi-metin')
    ]);
    ui.sevgiKart = kart; sevgiYenile();
    return kart;
  }
  function sevgiYenile() {
    if (!ui.sevgiKart || !ui.sevgiKart.isConnected) return;
    const seviye = Math.min(5, Math.floor(d.sevgi / 10));
    const kalpler = ui.sevgiKart.querySelector('.barbie-kalpler'); kalpler.innerHTML = '';
    for (let i = 0; i < 5; i++) kalpler.appendChild(ctx.el('span.barbie-kalp' + (i < seviye ? '.dolu' : ''), '♥'));
    ui.sevgiKart.querySelector('.barbie-sevgi-rozet').textContent = 'bugün ' + d.bugun.oksama + ' okşama';
    const adlar = ['yeni tanıştınız', 'kuyruk sallıyor', 'peşinden geliyor', 'senin köpeğin', 'ayrılmaz ikili', 'ömür boyu'];
    ui.sevgiKart.querySelector('.barbie-sevgi-metin').textContent =
      'Toplam ' + d.sevgi + ' okşama · ' + adlar[seviye] + (seviye < 5 ? ' · sonraki kalbe ' + (10 - d.sevgi % 10) + ' okşama' : '');
  }

  /* ------------------------------------------------------------ oyun motoru */
  const YERCEKIMI = 950;
  function oyunBaslat(tur) {
    if (oy || !OYUNLAR[tur]) return;
    if (d.uyuyor) d.uyuyor = false;
    if (d.kucakta) d.kucakta = false;
    kaydet();
    ui.balon.classList.remove('goster');
    const r = ui.sahne.getBoundingClientRect();
    const W = r.width, H = r.height;
    const zemin = H - 56;                                // HUD alt çubuğun üstü: top da köpek de görünür kalsın
    oy = {
      tur, skor: 0, onunSkoru: 0, W, H, kopekH: H * 0.42, zemin,
      kopek: { x: W / 2, y: zemin, yon: 1, atla: 0, hiz: tur === 'odul' ? 420 : 330 },
      isaret: { x: W / 2, y: H / 2, basili: false, tut: false, gecmis: [] },
      sonZaman: 0, sonKarar: 0, durakla: 0, mesaj: 0
    };
    ui.sahne.classList.add('oyunda'); ui.sahne.dataset.oyun = tur;
    ui.hud.hidden = false;
    ui.hudAd.textContent = OYUNLAR[tur].emoji + ' ' + OYUNLAR[tur].ad;
    ui.hudSkor.textContent = '0';
    ui.hudEk.hidden = true; ui.hudEk.textContent = '';
    ui.hudYardim.hidden = tur === 'odul';
    ui.hudYardim.textContent = tur === 'top' ? 'At' : 'Çek';
    ui.svg.classList.remove('uyuyor', 'kucakta');
    ui.top.hidden = true; ui.ipUc.hidden = true; ui.ip.classList.remove('goster');

    if (tur === 'top') {
      oy.evX = W / 2;
      oy.top = { x: W / 2, y: oy.zemin - 15, vx: 0, vy: 0, elde: false };
      oy.faz = 'hazir';
      ui.top.hidden = false;
    } else if (tur === 'ip') {
      oy.kopek.x = W * 0.3;
      oy.p = 0; oy.cekis = 0; oy.sonAni = 0; oy.aniBitis = 0;
      ui.ipUc.hidden = false; ui.ip.classList.add('goster');
      ui.hudEk.hidden = false;
    } else if (tur === 'odul') {
      oy.oduller = []; oy.kalan = 45; oy.sonDogum = 0; oy.seri = 0; oy.enSeri = 0;
      ui.hudEk.hidden = false;
    }
    durumGuncelle(); altbarKur();
    ctx.ses.parilti();
    soyle(rastgele(['Hazırım! Hadi!', 'Oyun! Oyun! Oyun!', 'Bunu çok iyi bilirim.']) + ' ' + OYUNLAR[tur].ipucu + '.', 3400);
    kopekCiz(); hedefleriCiz();
    oy.sonZaman = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(oyunAdim);
    ui.sahne.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' });
  }
  function oyunBitir(kullanici) {
    if (!oy) return;
    const o = oy; oy = null;
    cancelAnimationFrame(raf); raf = 0;
    ui.sahne.classList.remove('oyunda'); delete ui.sahne.dataset.oyun;
    ui.hud.hidden = true; ui.top.hidden = true; ui.ipUc.hidden = true; ui.ip.classList.remove('goster');
    ui.hudEk.hidden = true; ui.hudYardim.hidden = true;
    odulleriTemizle();
    ui.kopekYer.style.transform = ''; ui.kopekYer.style.removeProperty('--cek');
    ui.svg.classList.remove('kosuyor', 'atla', 'tasiyor', 'ceker', 'agiz-acik');
    ses.solumaDur();
    if (o.skor > (d.oyun[o.tur] || 0)) {
      d.oyun[o.tur] = o.skor;
      if (o.skor > 0) { ctx.ses.zafer(); ctx.efekt.konfeti(); ctx.toast('Yeni rekor: ' + o.skor + ' ' + OYUNLAR[o.tur].birim + ' 🏆'); }
    }
    d.sevgi += Math.min(3, Math.ceil(o.skor / 4)); kaydet();
    if (o.skor > 0) { g.olaylar.push({ t: Date.now(), tur: 'oyun' }); gunlukKaydet(); }
    durumGuncelle(); altbarKur();
    if (kullanici) soyle(o.skor ? 'Çok eğlendim! Skor: ' + o.skor : 'Bir dahakine daha iyi olacağım.', 2600);
    if (sekme === 'oyna' || sekme === 'gunluk') sekmeYenile();
  }
  function yardimEylemi() {
    if (!oy) return;
    if (oy.tur === 'top' && oy.faz === 'hazir') {
      const hedefX = 40 + Math.random() * (oy.W - 80);
      topFirlat((hedefX - oy.top.x) * 1.5, -420 - Math.random() * 160);
    } else if (oy.tur === 'ip') {
      ipCek(0.22);
    }
  }
  function yerel(e) {
    const r = ui.sahne.getBoundingClientRect();
    return { x: CD.sinirla(e.clientX - r.left, 0, r.width), y: CD.sinirla(e.clientY - r.top, 0, r.height) };
  }
  /* ağız hizası: figürün alt kenarından yukarı ~%40 (SVG'de burun/ağız oraya denk gelir) */
  function agizNoktasi() { const k = oy.kopek; return { x: k.x, y: k.y - oy.kopekH * 0.40 }; }

  function oyunBas(e) {
    if (!oy) return;
    if (e.target && e.target.closest && e.target.closest('.barbie-hud')) return;
    e.preventDefault();
    try { ui.sahne.setPointerCapture(e.pointerId); } catch (err) {}
    const p = yerel(e), is = oy.isaret;
    is.basili = true; is.x = p.x; is.y = p.y; is.gecmis = [{ x: p.x, y: p.y, t: performance.now() }];
    if (oy.tur === 'top') {
      const t = oy.top;
      if (oy.faz === 'hazir' && Math.hypot(p.x - t.x, p.y - t.y) < 58) { is.tut = true; t.vx = t.vy = 0; ctx.ses.pit(); }
      else if (oy.faz === 'hazir') { topFirlat((p.x - t.x) * 1.6, Math.min(-320, (p.y - t.y) * 1.6 - 260)); }
      else ctx.ses.tik();
    } else if (oy.tur === 'ip') {
      const u = ipUcKonum();
      is.tut = Math.hypot(p.x - u.x, p.y - u.y) < 70;
      if (is.tut) { ses.homurtu(0.4); ui.svg.classList.add('ceker'); }
    } else if (oy.tur === 'odul') {
      ctx.ses.tik();
    }
  }
  function oyunHareket(e) {
    if (!oy || !oy.isaret.basili) return;
    const p = yerel(e), is = oy.isaret, once = { x: is.x, y: is.y };
    is.x = p.x; is.y = p.y;
    is.gecmis.push({ x: p.x, y: p.y, t: performance.now() }); if (is.gecmis.length > 6) is.gecmis.shift();
    if (oy.tur === 'top' && is.tut) { oy.top.x = p.x; oy.top.y = p.y; }
    else if (oy.tur === 'ip' && is.tut) {
      const y = ipYonu();
      const ilerleme = (p.x - once.x) * y.x + (p.y - once.y) * y.y;
      if (ilerleme > 0) ipCek(Math.min(ilerleme, 46) * 0.0042);
    }
  }
  function oyunBirak(e) {
    if (!oy || !oy.isaret.basili) return;
    const is = oy.isaret;
    is.basili = false;
    if (oy.tur === 'top' && is.tut) {
      const g0 = is.gecmis[0], g1 = is.gecmis[is.gecmis.length - 1];
      let vx = 0, vy = -260;
      if (g0 && g1 && g1.t > g0.t) {
        const dt = (g1.t - g0.t) / 1000;
        vx = (g1.x - g0.x) / dt; vy = (g1.y - g0.y) / dt;
        const hz = Math.hypot(vx, vy);
        if (hz > 1100) { const k = 1100 / hz; vx *= k; vy *= k; }
        if (hz < 90) { vx = (Math.random() - 0.5) * 300; vy = -380; }
      }
      topFirlat(vx, vy);
    }
    if (oy.tur === 'ip') ui.svg.classList.remove('ceker');
    is.tut = false;
  }
  function topFirlat(vx, vy) {
    if (!oy || oy.tur !== 'top' || oy.faz !== 'hazir') return;
    oy.top.vx = vx; oy.top.vy = Math.min(vy, -120);
    oy.faz = 'ucuyor'; oy.isaret.tut = false;
    ctx.ses.hop(); ses.havlar(2, 1.15);
    soyle(rastgele(['Gidiyorum!', 'Benim! Benim!', 'Hav! Aldım onu!']), 1500);
  }
  function ipYonu() {
    const a = ipYakin(), b = ipUzak();
    const dx = b.x - a.x, dy = b.y - a.y, u = Math.hypot(dx, dy) || 1;
    return { x: dx / u, y: dy / u };
  }
  /* ipin ağızdan çıktığı nokta ve tutamacın iki ucu — tutamaç hiçbir zaman yüzünün üstüne binmesin */
  function ipAgiz() { const m = agizNoktasi(); return { x: m.x + 14, y: m.y + 4 }; }
  function ipYakin() { const m = agizNoktasi(); return { x: m.x + 62, y: m.y + 34 }; }
  function ipUzak() { return { x: oy.W * 0.86, y: oy.zemin - 6 }; }
  function ipUcKonum() {
    const a = ipYakin(), b = ipUzak(), t = (oy.p + 1) / 2;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  function ipCek(miktar) {
    if (!oy || oy.tur !== 'ip' || oy.durakla > 0) return;
    oy.p = Math.min(1.2, oy.p + miktar);
    oy.cekis = Math.min(1, oy.cekis + miktar * 3);
    if (Math.random() < 0.1) ses.homurtu(0.3);
    ipSonuc();                                          // çekiş anında bak: bir sonraki karede Barbie geri çekiyor
  }
  /* turu kim aldı? hem çekiş anında hem her karede kontrol edilir */
  function ipSonuc() {
    const o = oy; if (!o || o.tur !== 'ip' || o.durakla > 0) return;
    if (o.p >= 1) {
      o.skor++; ui.hudSkor.textContent = String(o.skor);
      o.durakla = 1100; o.p = 0.82;
      ses.inle(); ctx.ses.parilti();
      const u = ipUcKonum(), r = ui.sahne.getBoundingClientRect();
      ctx.efekt.yildiz(r.left + u.x, r.top + u.y, 6); ctx.efekt.pati(r.left + u.x, r.top + u.y);
      soyle(rastgele(OYUNLAR.ip.yakala), 2000);
      sonra(() => { if (oy && oy.tur === 'ip') oy.p = 0; }, 1100);
    } else if (o.p <= -1) {
      o.onunSkoru++;
      o.durakla = 1100; o.p = -0.82;
      ses.havlar(2, 1.12);
      ui.kuyruk.classList.add('cilgin'); sonra(() => ui.kuyruk.classList.remove('cilgin'), 1400);
      soyle(rastgele(['Benim! İp benim!', 'Kazandım! Bir daha?', 'Gördün mü? Güçlüyüm.']), 2000);
      sonra(() => { if (oy && oy.tur === 'ip') oy.p = 0; }, 1100);
    }
  }

  function oyunAdim(t) {
    if (!oy) return;
    raf = requestAnimationFrame(oyunAdim);
    const dt = Math.min(0.05, (t - oy.sonZaman) / 1000); oy.sonZaman = t;
    if (oy.durakla > 0) oy.durakla -= dt * 1000;
    if (oy.tur === 'top') topAdim(dt, t);
    else if (oy.tur === 'ip') ipAdim(dt, t);
    else if (oy.tur === 'odul') odulAdim(dt, t);
    kopekCiz(); hedefleriCiz();
  }

  /* ---- oyun: top getir */
  function topAdim(dt, t) {
    const o = oy, h = o.top, k = o.kopek, R = 15;
    if (o.faz === 'hazir') {
      if (!o.isaret.tut) { h.vy += YERCEKIMI * dt; h.y += h.vy * dt; if (h.y > o.zemin - R) { h.y = o.zemin - R; h.vy = 0; } }
      k.hedefX = h.x;
      if (t - o.mesaj > 7000) { o.mesaj = t; if (Math.random() < 0.6) soyle(rastgele(['At hadi! At!', 'Topu görüyorum. Sen de görüyor musun?', 'Bekliyorum. Sabırla. Şöyle böyle.']), 2000); }
    } else if (o.faz === 'ucuyor') {
      h.vy += YERCEKIMI * dt;
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.x < R) { h.x = R; h.vx = Math.abs(h.vx) * 0.68; ctx.ses.tik(); }
      if (h.x > o.W - R) { h.x = o.W - R; h.vx = -Math.abs(h.vx) * 0.68; ctx.ses.tik(); }
      if (h.y < R) { h.y = R; h.vy = Math.abs(h.vy) * 0.5; }
      if (h.y >= o.zemin - R) {
        h.y = o.zemin - R;
        if (Math.abs(h.vy) > 110) { h.vy = -Math.abs(h.vy) * 0.46; ctx.ses.blop(); } else { h.vy = 0; h.vx *= Math.pow(0.08, dt); }
      }
      k.hedefX = h.x;
      // havada yakalama: top inerken ağız hizasına gelirse zıplayıp kapar
      const m0 = agizNoktasi();
      if (h.vy > 0 && Math.abs(h.x - k.x) < 32 && h.y > m0.y - 50 && h.y < m0.y + 34) {
        o.faz = 'getiriyor'; h.elde = true;
        ui.svg.classList.add('tasiyor');
        zipla(340); ctx.ses.pop(); ses.havlar(1, 1.2);
        const r0 = ui.sahne.getBoundingClientRect();
        ctx.efekt.yildiz(r0.left + h.x, r0.top + h.y, 5);
        soyle('Havada yakaladım! Gördün mü?', 1800);
        o.mesaj = t;
      } else if (Math.abs(h.vx) < 26 && h.y >= o.zemin - R - 1) o.faz = 'kovaliyor';
    } else if (o.faz === 'kovaliyor') {
      k.hedefX = h.x;
      if (Math.abs(k.x - h.x) < 34) {
        o.faz = 'getiriyor'; h.elde = true;
        ui.svg.classList.add('tasiyor');
        ctx.ses.pop();
        const r = ui.sahne.getBoundingClientRect();
        ctx.efekt.toz(r.left + h.x, r.top + o.zemin, 4);
      }
    } else if (o.faz === 'getiriyor') {
      k.hedefX = o.evX;
      const m = agizNoktasi();
      h.x = m.x + k.yon * 16; h.y = m.y + 6; h.vx = h.vy = 0;
      if (Math.abs(k.x - o.evX) < 26) {
        o.faz = 'hazir'; h.elde = false;
        ui.svg.classList.remove('tasiyor');
        h.x = o.evX + 30 * (Math.random() < 0.5 ? -1 : 1); h.y = o.zemin - R;
        o.skor++; ui.hudSkor.textContent = String(o.skor);
        ses.havlar(2, 1.05); ctx.ses.parilti();
        const r = ui.sahne.getBoundingClientRect();
        ctx.efekt.kalp(r.left + m.x, r.top + m.y, 4); ctx.efekt.pati(r.left + h.x, r.top + o.zemin - 10);
        zipla(300);
        if (o.skor % 2 === 1) soyle(rastgele(OYUNLAR.top.yakala), 1800);
        o.mesaj = t;
      }
    }
    kopekKos(dt, k.hedefX);
  }

  /* ---- oyun: ip çekme */
  function ipAdim(dt, t) {
    const o = oy;
    o.cekis = Math.max(0, o.cekis - dt * 2.2);
    if (o.durakla > 0) { ui.hudEk.textContent = 'sen ' + o.skor + ' · ' + AD() + ' ' + o.onunSkoru; return; }
    if (t > o.aniBitis && t - o.sonAni > 1600 + Math.random() * 1800) {
      o.sonAni = t; o.aniBitis = t + 420;
      ses.homurtu(0.45);
      if (!ctx.azHareket) ctx.efekt.sarsinti(ui.sahne, 1);
    }
    const ani = t < o.aniBitis;
    const gucu = (ani ? 0.62 : 0.24) + Math.sin(t / 620) * 0.06;
    o.p = CD.sinirla(o.p - gucu * dt, -1.2, 1.2);
    ui.hudEk.textContent = 'sen ' + o.skor + ' · ' + AD() + ' ' + o.onunSkoru;
    ui.svg.classList.toggle('ceker', o.isaret.tut || ani);
    ipSonuc();
    const k = o.kopek;
    k.x = o.W * 0.3 - o.p * 26;
    k.yon = 1;
    ui.kopekYer.style.setProperty('--cek', (o.p * 7).toFixed(2) + 'deg');
  }

  /* ---- oyun: ödül yakala */
  const ODUL_TURLERI = [['🦴', 1], ['🍖', 1], ['🧀', 2], ['🍗', 2]];
  function odulleriTemizle() {
    if (!ui.oyunKat) return;
    Array.from(ui.oyunKat.querySelectorAll('.barbie-odul')).forEach(el => el.remove());
  }
  function odulAdim(dt, t) {
    const o = oy, k = o.kopek;
    if (o.bitiyor) return;
    o.kalan -= dt;
    if (o.kalan <= 0) { o.kalan = 0; o.bitiyor = true; odulBitir(); return; }
    ui.hudEk.textContent = Math.ceil(o.kalan) + ' sn' + (o.seri >= 3 ? ' · seri ' + o.seri : '');
    const zorluk = 1 - o.kalan / 45;
    if (t - o.sonDogum > 700 - zorluk * 240) {
      o.sonDogum = t;
      const tur = rastgele(ODUL_TURLERI);
      const el = ctx.el('span.barbie-odul', { 'aria-hidden': 'true' }, tur[0]);
      ui.oyunKat.appendChild(el);
      o.oduller.push({ x: 30 + Math.random() * Math.max(1, o.W - 60), y: -24, vy: 150 + Math.random() * 90 + zorluk * 90, deger: tur[1], emoji: tur[0], el, bitti: false });
    }
    if (o.isaret.basili) k.hedefX = o.isaret.x;
    if (tuslar) k.hedefX = CD.sinirla((k.hedefX == null ? k.x : k.hedefX) + tuslar * 460 * dt, 20, o.W - 20);
    kopekKos(dt, k.hedefX == null ? k.x : k.hedefX);
    const agizY = k.y - o.kopekH * 0.55;
    const r = ui.sahne.getBoundingClientRect();
    o.oduller.forEach(od => {
      if (od.bitti) return;
      od.y += od.vy * dt;
      if (od.y > agizY - 26 && od.y < agizY + 30 && Math.abs(od.x - k.x) < 42) {
        od.bitti = true; od.el.classList.add('yakalandi');
        o.skor += od.deger; o.seri++; o.enSeri = Math.max(o.enSeri, o.seri);
        ui.hudSkor.textContent = String(o.skor);
        ctx.ses.yut(); ses.yala();
        ui.svg.classList.add('agiz-acik'); sonra(() => ui.svg.classList.remove('agiz-acik'), 260);
        ctx.efekt.yildiz(r.left + od.x, r.top + od.y, 3);
        if (o.seri === 5) { ctx.ses.parilti(); soyle('Beş tane üst üste! Ben bir efsaneyim.', 1800); }
        else if (o.skor % 7 === 0) soyle(rastgele(OYUNLAR.odul.yakala), 1500);
      } else if (od.y > o.zemin) {
        od.bitti = true; od.el.classList.add('dustu');
        o.seri = 0;
        ctx.ses.blop();
        ctx.efekt.toz(r.left + od.x, r.top + o.zemin, 3);
      }
    });
    o.oduller = o.oduller.filter(od => {
      if (od.bitti) { const el = od.el; sonra(() => el.remove(), 320); return false; }
      od.el.style.transform = 'translate(' + od.x.toFixed(1) + 'px,' + od.y.toFixed(1) + 'px) translate(-50%,-50%)';
      return true;
    });
  }
  function odulBitir() {
    const o = oy; if (!o) return;
    ui.hudEk.textContent = 'bitti';
    ctx.ses.zafer();
    soyle(o.skor > 0 ? o.skor + ' ödül! Karnım şişti.' : 'Hiç yakalayamadım ama eğlendim.', 2600);
    ctx.toast('Süre doldu · ' + o.skor + ' ödül' + (o.enSeri >= 3 ? ' · en uzun seri ' + o.enSeri : ''), 3000);
    sonra(() => oyunBitir(false), 900);
  }

  /* ---- ortak: koşma, zıplama, çizim */
  function kopekKos(dt, hedefX) {
    const o = oy, k = o.kopek;
    if (hedefX == null) { ui.svg.classList.remove('kosuyor'); return; }
    const dx = hedefX - k.x, uz = Math.abs(dx);
    if (uz > 6) {
      const hz = Math.min(k.hiz, uz * 5);
      k.x += Math.sign(dx) * hz * dt;
      if (uz > 10) k.yon = dx > 0 ? 1 : -1;
      k.x = CD.sinirla(k.x, o.kopekH * 0.3, o.W - o.kopekH * 0.3);
    }
    const kosuyor = uz > 14;
    ui.svg.classList.toggle('kosuyor', kosuyor);
    if (kosuyor && !solumaTik && !ctx.azHareket) ses.solumaBaslat();
    if (!kosuyor && solumaTik && !oksuyor) ses.solumaDur();
    if (k.atla > 0) k.atla -= dt * 1000;
  }
  function zipla(ms) {
    if (!oy) return;
    oy.kopek.atla = ms;
    ui.svg.classList.remove('atla'); void ui.svg.getBoundingClientRect(); ui.svg.classList.add('atla');
    sonra(() => ui.svg.classList.remove('atla'), ms);
    ctx.ses.hop();
  }
  function kopekCiz() {
    if (!oy) return;
    const k = oy.kopek;
    const z = k.atla > 0 ? -20 : 0;
    ui.kopekYer.style.transform = 'translate(' + k.x.toFixed(1) + 'px,' + (k.y + z).toFixed(1) + 'px) translate(-50%,-100%) rotate(var(--cek,0deg)) scale(' + (0.5 * k.yon) + ',0.5)';
  }
  function hedefleriCiz() {
    if (!oy) return;
    if (oy.tur === 'top') {
      const h = oy.top;
      ui.top.style.transform = 'translate(' + h.x.toFixed(1) + 'px,' + h.y.toFixed(1) + 'px) translate(-50%,-50%)';
      ui.top.classList.toggle('elde', !!h.elde);
    } else if (oy.tur === 'ip') {
      const u = ipUcKonum(), m = ipAgiz();
      ui.ipUc.style.transform = 'translate(' + u.x.toFixed(1) + 'px,' + u.y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + (Math.atan2(u.y - m.y, u.x - m.x) * 57.3).toFixed(1) + 'deg)';
      const sarkma = (1 - Math.abs(oy.cekis)) * 22;
      ui.ipYol.setAttribute('d', 'M' + m.x.toFixed(0) + ' ' + m.y.toFixed(0) + ' Q ' + ((m.x + u.x) / 2).toFixed(0) + ' ' + ((m.y + u.y) / 2 + sarkma).toFixed(0) + ' ' + u.x.toFixed(0) + ' ' + u.y.toFixed(0));
    }
  }
  function oyunBoyut() {
    if (!oy) return;
    const r = ui.sahne.getBoundingClientRect();
    const kx = oy.W ? oy.kopek.x / oy.W : 0.5;
    oy.W = r.width; oy.H = r.height; oy.kopekH = oy.H * 0.42; oy.zemin = oy.H - 56;
    oy.kopek.x = kx * oy.W; oy.kopek.y = oy.zemin;
    if (oy.tur === 'top') { oy.evX = oy.W / 2; oy.top.x = CD.sinirla(oy.top.x, 15, oy.W - 15); oy.top.y = Math.min(oy.top.y, oy.zemin - 15); }
    if (oy.tur === 'odul') oy.oduller.forEach(od => { od.x = CD.sinirla(od.x, 20, oy.W - 20); });
  }
  function oyunTus(e) {
    if (!oy) return;
    if (oy.tur === 'odul') {
      if (e.key === 'ArrowLeft') { tuslar = -1; e.preventDefault(); }
      else if (e.key === 'ArrowRight') { tuslar = 1; e.preventDefault(); }
    }
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === ui.kopekYer) { e.preventDefault(); yardimEylemi(); }
  }
  function oyunTusBirak(e) {
    if ((e.key === 'ArrowLeft' && tuslar === -1) || (e.key === 'ArrowRight' && tuslar === 1)) tuslar = null;
  }

  /* ============================================================ ALBÜM */
  function fotoUrl(f) {
    if (f.sabit || f.kucuk) return gizliUrl(f.kucuk);
    if (f._url) return f._url;
    try { f._url = URL.createObjectURL(f.blob); urlHavuzu.push(f._url); } catch (e) { f._url = ''; }
    return f._url;
  }
  function fotoBuyuk(f) { return f.kucuk ? gizliUrl(f.buyuk) : fotoUrl(f); }
  function fotoNot(f) {
    const n = g.albumNot[f.id] || {};
    return { not: n.not != null ? n.not : (f.kucuk ? f.varsayilan : (f.not || '')), tarih: n.tarih != null ? n.tarih : (f.tarih || '') };
  }
  function fotolariYukle() {
    if (fotolar) return Promise.resolve(fotolar);
    return ctx.idb.hepsi('fotolar').then(liste => {
      fotolar = (liste || []).filter(f => f && typeof f.id === 'string' && f.id.indexOf('barbie:') === 0 && f.blob).sort((a, b) => (b.olusturma || 0) - (a.olusturma || 0));
      return fotolar;
    }).catch(() => { fotolar = fotolar || []; return fotolar; });
  }
  function albumKur() {
    const kap = ctx.el('div.dikey.barbie-album');
    const girdi = ctx.el('input', { type: 'file', accept: 'image/*', multiple: true, class: 'gorsel-gizli', 'aria-label': 'Fotoğraf seç', tabindex: '-1' });
    const ust = ctx.el('div.yama.siki.satir.arasi.barbie-album-ust', [
      ctx.el('div', [ctx.el('h2.baslik.baslik-lg', AD() + ' albümü'), ctx.el('p.sessiz', 'Fotoğraflar bu telefonda kalır.')]),
      ctx.el('button.dugme', { type: 'button', onclick: () => { ctx.ses.tik(); girdi.click(); } }, ['📷 ', 'Fotoğraf ekle'])
    ]);
    girdi.addEventListener('change', () => { const dosyalar = Array.from(girdi.files || []); girdi.value = ''; fotoEkle(dosyalar); });
    const izgara = ctx.el('div.barbie-polaroidler', [ctx.el('p.sessiz.orta', 'Albüm açılıyor…')]);
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
      const img = ctx.el('img', { src: fotoUrl(f), alt: '', loading: 'lazy', decoding: 'async' });
      if (f.donus) img.style.transform = 'rotate(' + f.donus + 'deg)';
      const kart = ctx.el('button.barbie-polaroid', {
        type: 'button',
        'aria-label': (f.alt || bilgi.not || AD() + ' fotoğrafı') + (bilgi.tarih ? ', ' + CD.tarihYaz(bilgi.tarih) : ''),
        style: '--don:' + ((i % 3) - 1) * 1.6 + 'deg',
        onclick: () => fotoAc(f)
      }, [
        ctx.el('span.barbie-polaroid-cerceve', [img]),
        ctx.el('span.barbie-polaroid-not', bilgi.not || (bilgi.tarih ? CD.tarihYaz(bilgi.tarih) : 'not ekle')),
        bilgi.tarih && bilgi.not ? ctx.el('span.barbie-polaroid-tarih.sayi', CD.tarihYaz(bilgi.tarih)) : null
      ]);
      izgara.appendChild(kart);
    });
    if (!hepsi.length) izgara.appendChild(ctx.el('div.yama.bos-durum', [ctx.el('div.buyuk', '📸'), ctx.el('p', 'Henüz fotoğraf yok. ' + AD() + ' poz vermeye hazır.')]));
  }
  async function fotoEkle(dosyalar) {
    if (!dosyalar.length) return;
    let eklenen = 0, uyari = false;
    for (const dosya of dosyalar.slice(0, 12)) {
      if (!/^image\//.test(dosya.type)) continue;
      try {
        const blob = await CD.fotoKucult(dosya, 1280, 0.82);
        if (!ctx) return;
        const kayit = { id: 'barbie:' + CD.kimlik(), blob, not: '', tarih: CD.bugun(), olusturma: Date.now() };
        try { await ctx.idb.koy('fotolar', kayit); } catch (e) { uyari = true; }
        if (!ctx) return;
        fotolar = fotolar || []; fotolar.unshift(kayit); eklenen++;
      } catch (e) { if (ctx) ctx.toast('Bu fotoğraf açılamadı; başka birini dener misin?'); }
    }
    if (!ctx) return;
    if (eklenen) { ctx.ses.parilti(); ctx.toast(eklenen === 1 ? 'Fotoğraf albümde 📷' : eklenen + ' fotoğraf albümde 📷'); albumCiz(); }
    if (uyari) ctx.toast('Bu tarayıcı fotoğrafı kalıcı saklayamıyor; bu ziyarette albümde kalır.', 3200);
  }
  function fotoAc(f) {
    const bilgi = fotoNot(f);
    const img = ctx.el('img.barbie-buyuk-foto', { src: fotoBuyuk(f), alt: f.alt || bilgi.not || AD() });
    if (f.donus) img.style.transform = 'rotate(' + f.donus + 'deg)';
    const not = ctx.el('textarea.girdi', { rows: '2', placeholder: 'Altına küçük bir not…', maxlength: '140' }, bilgi.not);
    const tarih = ctx.el('input.girdi', { type: 'date', value: bilgi.tarih || '' });
    const kaydetD = ctx.el('button.dugme', { type: 'button', onclick: () => {
      g.albumNot[f.id] = { not: not.value.trim().slice(0, 140), tarih: tarih.value || '' }; gunlukKaydet();
      if (!f.kucuk) {
        f.not = g.albumNot[f.id].not; f.tarih = g.albumNot[f.id].tarih;
        ctx.idb.koy('fotolar', { id: f.id, blob: f.blob, not: f.not, tarih: f.tarih, olusturma: f.olusturma }).catch(() => {});
      }
      ctx.ses.parilti(); ctx.sheetKapat(); albumCiz(); ctx.toast('Kaydedildi 🐾');
    } }, 'Kaydet');
    const silD = f.kucuk ? null : ctx.el('button.dugme-ikincil', { type: 'button', onclick: async () => {
      const ok = await ctx.onayla('Bu fotoğraf albümden silinsin mi?', 'Sil', 'Kalsın'); if (!ok || !ctx) return;
      try { await ctx.idb.sil('fotolar', f.id); } catch (e) {}
      if (f._url) { try { URL.revokeObjectURL(f._url); } catch (e) {} urlHavuzu = urlHavuzu.filter(u => u !== f._url); }
      fotolar = (fotolar || []).filter(x => x.id !== f.id); delete g.albumNot[f.id]; gunlukKaydet();
      ctx.ses.blop(); albumCiz(); ctx.toast('Fotoğraf silindi');
    } }, 'Sil');
    const ic = ctx.el('div.dikey.barbie-foto-sheet', [
      img,
      ctx.el('label.etiket', 'Not'), not,
      ctx.el('label.etiket', 'Tarih'), tarih,
      ctx.el('div.satir', [silD, ctx.el('span.bosluk'), ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Kapat'), kaydetD])
    ]);
    ctx.sheet(ic, { baslik: f.kucuk ? AD() : 'Fotoğraf', odak: false });
  }

  /* ============================================================ GÜNLÜK */
  function gunlukKur() {
    const kap = ctx.el('div.dikey.barbie-gunluk');
    // append(null) "null" yazısı basar; boş dönen kartları ele
    [dogumKarti(), hatirlatmaUyarisi(), mamaKarti(), yuruyusKarti(), timarKarti(), kiloKarti(), hatirlaticiKarti(), olayKarti(), notKarti()]
      .forEach(kart => { if (kart) kap.appendChild(kart); });
    ui.gunlukKap = kap;
    return kap;
  }
  function dogumKarti() {
    const t = dogumTarihi();
    const girdi = ctx.el('input.girdi', { type: 'date', value: t || '', max: CD.bugun(), 'aria-label': 'Doğum ya da eve geliş tarihi' });
    const kaydetD = ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => {
      const v = girdi.value;
      if (!gecerliTarih(v)) { ctx.toast('Tarihi yıl-ay-gün olarak seç.'); return; }
      if (CD.gunFarki(v) < 0) { ctx.toast('O gün daha gelmedi; bugünü ya da öncesini seç.'); return; }
      ctx.depo.yaz('dogumTarihi', v); d.kutlananYil = new Date().getFullYear(); kaydet();
      ctx.ses.parilti(); ctx.toast('Kaydedildi 🎂'); durumGuncelle(); sekmeYenile();
    } }, 'Kaydet');
    if (!t) {
      return ctx.el('div.yama.barbie-dogum', [
        ctx.el('h2.baslik.baslik-lg', AD() + ' kaç yaşında?'),
        ctx.el('p.ikincil', 'Doğum gününü (ya da eve geldiği günü) bilmiyorum. Yazarsan yaşını sayar, doğum gününü de unutmam.'),
        ctx.el('div.satir', [girdi, kaydetD])
      ]);
    }
    const kalan = dogumGunuKalan();
    return ctx.el('div.yama.barbie-dogum', [
      ctx.el('div.barbie-yas-buyuk', [ctx.el('span.barbie-yas-sayi.sayi', yasMetni())]),
      ctx.el('div.satir.sar', [
        ctx.el('span.rozet.goz', '🎂 ' + CD.tarihYaz(t)),
        kalan === 0 ? ctx.el('span.rozet', 'bugün doğum günü!') : ctx.el('span.rozet.gri', 'doğum gününe ' + kalan + ' gün')
      ]),
      TANIM() ? ctx.el('p.sessiz', TANIM()) : null,
      ctx.el('details.barbie-ekle', [
        ctx.el('summary', 'Tarihi düzelt'),
        ctx.el('div.satir', [girdi, kaydetD])
      ])
    ]);
  }
  function hatirlatmaUyarisi() {
    const yakin = g.hatirlatici.filter(h => { const f = CD.gunFarki(h.tarih); return f != null && f >= -2 && f <= 0; }).sort((a, b) => a.tarih < b.tarih ? -1 : 1);
    if (!yakin.length) return null;
    return ctx.el('div.yama.siki.barbie-uyari', yakin.map(h => {
      const kalan = -CD.gunFarki(h.tarih);
      const tur = HATIRLATICI_TURLERI.find(t => t[0] === h.tur) || HATIRLATICI_TURLERI[5];
      return ctx.el('div.satir', [
        ctx.el('span', { 'aria-hidden': 'true' }, tur[1]), ctx.el('span.kalin', h.ad), ctx.el('span.bosluk'),
        ctx.el('span.rozet' + (kalan === 0 ? '' : '.goz'), kalan === 0 ? 'bugün' : kalan === 1 ? 'yarın' : kalan + ' gün kaldı')
      ]);
    }));
  }
  function mamaKarti() {
    const bugunkuler = g.mamalar.filter(bugunMu).sort((a, b) => a - b);
    const hedef = g.mamaHedef;
    const yuzde = Math.min(100, Math.round(bugunkuler.length / hedef * 100));
    const cipler = ctx.el('div.satir.sar', [1, 2, 3, 4].map(h => ctx.el('button.cip', {
      type: 'button', 'aria-pressed': String(hedef === h),
      onclick: () => { g.mamaHedef = h; gunlukKaydet(); ctx.ses.tik(); sekmeYenile(); }
    }, h + ' öğün')));
    const liste = ctx.el('div.satir.sar.barbie-cip-liste', bugunkuler.length ? bugunkuler.map(ts => ctx.el('span.rozet.barbie-kayit-cip', [
      ctx.el('span.sayi', saat(ts)),
      ctx.el('button.barbie-sil', { type: 'button', 'aria-label': saat(ts) + ' öğün kaydını sil', onclick: () => { g.mamalar = g.mamalar.filter(x => x !== ts); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')
    ])) : [ctx.el('span.sessiz', 'Bugün henüz kayıt yok.')]);
    return ctx.el('div.yama.barbie-mama', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Mama saatleri'), ctx.el('span.rozet', 'bugün ' + bugunkuler.length + '/' + hedef)]),
      ctx.el('div.bar', [
        ctx.el('span.bar-ikon', { 'aria-hidden': 'true' }, '🍖'),
        ctx.el('span.bar-yol', [ctx.el('span.bar-dolu', { style: 'width:' + yuzde + '%;--bar-renk: var(--seker-seftali)' })]),
        ctx.el('span.bar-yuzde.sayi', yuzde + '%')
      ]),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => mamaVer() }, ['🍖 ', 'Mama verdim (şimdi)']),
      liste,
      ctx.el('p.sessiz', 'Günde kaç öğün?'),
      cipler,
      ctx.el('p.sessiz', 'Ödülleri de günlük hesaba katmayı unutma. Miktarı ve mamayı veterineri kilosuna göre söyler; ben sadece saati tutarım.')
    ]);
  }
  function yuruyusKarti() {
    const bugunDk = bugunYuruyus();
    const son = g.yuruyusler.length ? g.yuruyusler[g.yuruyusler.length - 1] : null;
    const ozel = ctx.el('input.girdi', { type: 'number', inputmode: 'numeric', min: '1', max: '300', step: '5', placeholder: 'dakika', 'aria-label': 'Yürüyüş süresi (dakika)' });
    const ekleDk = dk => {
      g.yuruyusler.push({ t: Date.now(), dk }); gunlukKaydet();
      ctx.ses.parilti();
      ctx.toast(dk + ' dakika yürüyüş kaydedildi 🦮');
      if (ui.svg) { ui.kuyruk.classList.add('cilgin'); sonra(() => ui.kuyruk.classList.remove('cilgin'), 1400); }
      sekmeYenile();
    };
    const hizli = ctx.el('div.barbie-hizli-dugmeler', [10, 20, 30, 45].map(dk => ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => ekleDk(dk) }, dk + ' dk')));
    const gunler = [];
    for (let i = 6; i >= 0; i--) {
      const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - i);
      const bas = t.getTime(), bit = bas + 86400000;
      gunler.push({ iso: isoYaz(t), gun: ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'][t.getDay()], dk: g.yuruyusler.filter(y => y.t >= bas && y.t < bit).reduce((a, y) => a + (y.dk || 0), 0) });
    }
    const maks = Math.max(30, Math.max.apply(null, gunler.map(x => x.dk)));
    const grafik = ctx.el('div.barbie-hafta', { role: 'img', 'aria-label': 'Son yedi günün yürüyüş dakikaları: ' + gunler.map(x => x.gun + ' ' + x.dk).join(', ') },
      gunler.map(x => ctx.el('div.barbie-hafta-sutun' + (x.dk ? '.dolu' : ''), [
        ctx.el('div.barbie-hafta-cubuk', { style: '--y:' + Math.round(x.dk / maks * 100) + '%' }),
        ctx.el('div.barbie-hafta-gun', x.gun)
      ])));
    const liste = ctx.el('div.satir.sar.barbie-cip-liste', g.yuruyusler.filter(y => bugunMu(y.t)).map(y => ctx.el('span.rozet.gri.barbie-kayit-cip', [
      ctx.el('span.sayi', saat(y.t) + ' · ' + y.dk + ' dk'),
      ctx.el('button.barbie-sil', { type: 'button', 'aria-label': 'Yürüyüş kaydını sil', onclick: () => { g.yuruyusler = g.yuruyusler.filter(x => x.t !== y.t); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')
    ])));
    return ctx.el('div.yama.barbie-yuruyus', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Yürüyüş'), ctx.el('span.rozet' + (bugunDk ? '.basari' : '.gri'), bugunDk ? 'bugün ' + bugunDk + ' dk' : 'bugün henüz çıkmadı')]),
      grafik,
      hizli,
      ctx.el('div.barbie-satir-form', [ozel, ctx.el('button.dugme', { type: 'button', onclick: () => {
        const v = Math.round(Number(ozel.value));
        if (!v || v < 1 || v > 300) { ctx.toast('Dakika olarak bir sayı yaz (örn. 25).'); ozel.focus(); return; }
        ozel.value = ''; ekleDk(v);
      } }, 'Ekle')]),
      liste,
      son ? ctx.el('p.sessiz', 'Son yürüyüş: ' + CD.tarihYaz(isoYaz(new Date(son.t))) + ' · ' + saat(son.t) + ' · ' + son.dk + ' dk') : ctx.el('p.sessiz', 'Yürüyüş sadece tuvalet değil; koklamak onun için gazete okumak gibi.')
    ]);
  }
  function timarKarti() {
    const gecen = sonTimarGun();
    const bugunku = g.timarlar.some(bugunMu);
    const durum = gecen == null ? 'Henüz kayıt yok' : gecen === 0 ? 'Bugün fırçalandı' : gecen === 1 ? 'Dün fırçalandı' : gecen + ' gün önce fırçalandı';
    const uyari = gecen != null && gecen >= 5;
    const noktalar = [];
    for (let i = 13; i >= 0; i--) {
      const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - i);
      const bas = t.getTime();
      noktalar.push(ctx.el('span.barbie-nokta' + (g.timarlar.some(x => x >= bas && x < bas + 86400000) ? '.dolu' : '')));
    }
    return ctx.el('div.yama.barbie-timar', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Tımar ve fırçalama'), ctx.el('span.rozet' + (uyari ? '' : bugunku ? '.basari' : '.gri'), durum)]),
      ctx.el('div.barbie-noktalar', { role: 'img', 'aria-label': 'Son on dört günün fırçalama kaydı' }, noktalar),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => {
        g.timarlar.push(Date.now()); gunlukKaydet();
        ctx.ses.parilti(); ctx.toast('Fırçalandı, tüyü ışıl ışıl 🪮');
        if (ui.svg) { ui.svg.classList.add('mutlu'); sonra(() => { if (!oksuyor) ui.svg.classList.remove('mutlu'); }, 1400); }
        sekmeYenile();
      } }, ['🪮 ', 'Bugün fırçaladım']),
      ctx.el('p.sessiz', uyari ? 'Birkaç gün oldu; kabarık tüy düğüm yapmadan taranmayı sever.' : 'Hedef: haftada 2–3 kez, dökme mevsiminde daha sık.')
    ]);
  }
  function kiloKarti() {
    const kilolar = g.kilolar.slice().sort((a, b) => a.t < b.t ? -1 : a.t > b.t ? 1 : 0);
    const son = kilolar[kilolar.length - 1], onceki = kilolar[kilolar.length - 2];
    /* type="text": type="number" Türkçe klavyedeki virgülü boş değere çeviriyor; virgülü kendimiz çözüyoruz */
    const girdi = ctx.el('input.girdi', { type: 'text', inputmode: 'decimal', maxlength: '6', placeholder: 'kg (örn. 2,4)', 'aria-label': 'Kilo (kilogram)' });
    const tarih = ctx.el('input.girdi', { type: 'date', value: CD.bugun(), max: CD.bugun(), 'aria-label': 'Tartı tarihi' });
    const ekle = () => {
      const v = Number(String(girdi.value).trim().replace(',', '.'));
      if (!isFinite(v) || v < 0.3 || v > 40) { ctx.toast('Kilogram olarak yaz (örn. 2,4).'); girdi.focus(); return; }
      const t = gecerliTarih(tarih.value) ? tarih.value : CD.bugun();
      g.kilolar = g.kilolar.filter(k => k.t !== t); g.kilolar.push({ t, g: Math.round(v * 1000) }); gunlukKaydet();
      girdi.value = '';
      ctx.ses.parilti(); ctx.toast('Kilo kaydedildi: ' + kgYaz(Math.round(v * 1000)));
      sekmeYenile();
    };
    girdi.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ekle(); } });
    const fark = son && onceki ? son.g - onceki.g : 0;
    const ozet = son ? ctx.el('div.barbie-kilo-ozet', [
      ctx.el('span.barbie-kilo-son.sayi', kgYaz(son.g)),
      onceki ? ctx.el('span.rozet' + (Math.abs(fark) < 100 ? '.gri' : fark > 0 ? '.basari' : ''), (fark >= 0 ? '+' : '') + (fark / 1000).toFixed(1).replace('.', ',') + ' kg') : null,
      ctx.el('span.sessiz', CD.tarihYaz(son.t))
    ]) : ctx.el('p.sessiz', 'Henüz tartılmadı. Kucağına al, birlikte tartıl, sonra kendi kilonu çıkar; ben çizgiyi çizerim.');
    const liste = ctx.el('div.satir.sar.barbie-cip-liste', kilolar.slice(-7).reverse().map(k => ctx.el('span.rozet.gri.barbie-kayit-cip', [
      ctx.el('span.sayi', CD.tarihYaz(k.t) + ' · ' + kgYaz(k.g)),
      ctx.el('button.barbie-sil', { type: 'button', 'aria-label': CD.tarihYaz(k.t) + ' kilo kaydını sil', onclick: () => { g.kilolar = g.kilolar.filter(x => x.t !== k.t); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')
    ])));
    return ctx.el('div.yama.barbie-kilo', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Kilo takibi'), ctx.el('span.rozet.goz', 'Pomeranian ~1,8–3,5 kg')]),
      ozet,
      ctx.el('div.barbie-grafik', { html: kiloGrafik(kilolar) }),
      ctx.el('div.barbie-kilo-form', [girdi, tarih, ctx.el('button.dugme', { type: 'button', onclick: ekle }, 'Kaydet')]),
      liste,
      ctx.el('p.sessiz', 'Aralık yaklaşıktır; her köpeğin kendi ideali var. Kaburgalarını hafifçe hissedebiliyorsan iyi gidiyorsun. Emin değilsen veterinerine sor.')
    ]);
  }
  function kgYaz(gram) { return (gram / 1000).toFixed(1).replace('.', ',') + ' kg'; }
  function kiloGrafik(kilolar) {
    const W = 320, H = 130, sol = 40, sag = 10, ust = 12, alt = 26;
    const veri = kilolar.slice(-14);
    if (veri.length < 2) {
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="barbie-grafik-svg" role="img" aria-label="Kilo grafiği için en az iki ölçüm gerek">' +
        '<text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" class="barbie-grafik-yazi">İki ölçümden sonra çizgi burada çıkar</text></svg>';
    }
    let min = Math.min.apply(null, veri.map(k => k.g)), maks = Math.max.apply(null, veri.map(k => k.g));
    const bant = [1800, 3500];
    if (min > bant[0] - 900 && maks < bant[1] + 900) { min = Math.min(min, bant[0]); maks = Math.max(maks, bant[1]); }
    const pay = Math.max(120, (maks - min) * 0.15); min -= pay; maks += pay;
    const x = i => sol + i * (W - sol - sag) / (veri.length - 1);
    const y = v => ust + (H - ust - alt) * (1 - (v - min) / (maks - min));
    const nokta = veri.map((k, i) => x(i).toFixed(1) + ',' + y(k.g).toFixed(1)).join(' ');
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="barbie-grafik-svg" role="img" aria-label="Son ' + veri.length + ' ölçümün kilo grafiği">';
    if (bant[1] <= maks && bant[0] >= min) {
      s += '<rect class="barbie-grafik-bant" x="' + sol + '" y="' + y(bant[1]).toFixed(1) + '" width="' + (W - sol - sag) + '" height="' + (y(bant[0]) - y(bant[1])).toFixed(1) + '" rx="4"/>';
    }
    [0, 0.5, 1].forEach(k => {
      const v = min + (maks - min) * k, yy = y(v);
      s += '<line class="barbie-grafik-cizgi" x1="' + sol + '" x2="' + (W - sag) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>' +
        '<text class="barbie-grafik-yazi" x="' + (sol - 4) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + (v / 1000).toFixed(1).replace('.', ',') + '</text>';
    });
    s += '<polygon class="barbie-grafik-alan" points="' + x(0).toFixed(1) + ',' + (H - alt) + ' ' + nokta + ' ' + x(veri.length - 1).toFixed(1) + ',' + (H - alt) + '"/>';
    s += '<polyline class="barbie-grafik-yol" points="' + nokta + '"/>';
    veri.forEach((k, i) => { s += '<circle class="barbie-grafik-nokta" cx="' + x(i).toFixed(1) + '" cy="' + y(k.g).toFixed(1) + '" r="4"/>'; });
    s += '<text class="barbie-grafik-yazi" x="' + sol + '" y="' + (H - 8) + '">' + CD.tarihYaz(veri[0].t) + '</text>' +
      '<text class="barbie-grafik-yazi" x="' + (W - sag) + '" y="' + (H - 8) + '" text-anchor="end">' + CD.tarihYaz(veri[veri.length - 1].t) + '</text></svg>';
    return s;
  }
  function hatirlaticiKarti() {
    const liste = g.hatirlatici.slice().sort((a, b) => a.tarih < b.tarih ? -1 : 1);
    const ad = ctx.el('input.girdi', { type: 'text', placeholder: 'Ne için? (örn. yıllık kontrol)', maxlength: '60', 'aria-label': 'Hatırlatıcı adı' });
    const tarih = ctx.el('input.girdi', { type: 'date', value: CD.bugun(), 'aria-label': 'Hatırlatıcı tarihi' });
    let tur = 'veteriner';
    const turCipler = ctx.el('div.satir.sar', HATIRLATICI_TURLERI.map(t => ctx.el('button.cip', {
      type: 'button', 'aria-pressed': String(t[0] === tur), data: { tur: t[0] },
      onclick: () => { tur = t[0]; ctx.ses.tik(); Array.from(turCipler.children).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.tur === tur))); if (!ad.value) ad.placeholder = t[2]; }
    }, [ctx.el('span', { 'aria-hidden': 'true' }, t[1]), ctx.el('span', t[2])])));
    const ekle = () => {
      const t = tarih.value; if (!gecerliTarih(t)) { ctx.toast('Bir tarih seç.'); return; }
      const turBilgi = HATIRLATICI_TURLERI.find(x => x[0] === tur);
      g.hatirlatici.push({ id: CD.kimlik(), ad: (ad.value.trim() || turBilgi[2]).slice(0, 60), tarih: t, tur }); gunlukKaydet();
      ctx.ses.parilti(); ctx.toast('Hatırlatıcı eklendi 📌'); sekmeYenile();
    };
    const satirlar = liste.length ? liste.map(h => {
      const f = CD.gunFarki(h.tarih), kalan = -f;
      const turBilgi = HATIRLATICI_TURLERI.find(t => t[0] === h.tur) || HATIRLATICI_TURLERI[5];
      const roz = f > 0 ? ctx.el('span.rozet.gri', f === 1 ? 'dün' : f + ' gün önce') : kalan === 0 ? ctx.el('span.rozet', 'bugün') : ctx.el('span.rozet.goz', kalan === 1 ? 'yarın' : kalan + ' gün kaldı');
      return ctx.el('div.barbie-hatirlatici' + (f > 0 ? '.gecti' : ''), [
        ctx.el('span.barbie-hatirlatici-ikon', { 'aria-hidden': 'true' }, turBilgi[1]),
        ctx.el('div.barbie-hatirlatici-metin', [ctx.el('div.kalin', h.ad), ctx.el('div.sessiz.sayi', CD.tarihYaz(h.tarih))]),
        roz,
        ctx.el('button.dugme-ikon.barbie-hatirlatici-sil', { type: 'button', 'aria-label': h.ad + ' hatırlatıcısını sil', onclick: async () => {
          const ok = await ctx.onayla('"' + h.ad + '" silinsin mi?', 'Sil', 'Kalsın'); if (!ok || !ctx) return;
          g.hatirlatici = g.hatirlatici.filter(x => x.id !== h.id); gunlukKaydet(); ctx.ses.blop(); sekmeYenile();
        } }, '×')
      ]);
    }) : [ctx.el('p.sessiz', 'Henüz hatırlatıcı yok. Veteriner ne dediyse tarihini buraya yaz; günü gelince haber veririm.')];
    return ctx.el('div.yama.barbie-hatirlaticilar', [
      ctx.el('h2.baslik.baslik-lg', 'Veteriner, aşı ve bakım hatırlatıcıları'),
      ctx.el('div.dikey.barbie-hatirlatici-liste', satirlar),
      ctx.el('details.barbie-ekle', [
        ctx.el('summary', '+ Hatırlatıcı ekle'),
        ctx.el('div.dikey', [turCipler, ad, tarih, ctx.el('button.dugme', { type: 'button', onclick: ekle }, 'Ekle')])
      ]),
      ctx.el('p.sessiz', 'Aşı ve parazit takvimini veterineri belirler; tarihleri o söyler, ben hatırlatırım.')
    ]);
  }
  function olayKarti() {
    const bugunkuler = g.olaylar.filter(o => bugunMu(o.t)).sort((a, b) => b.t - a.t);
    const dugmeler = ctx.el('div.barbie-olay-dugmeler', OLAYLAR.map(o => ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: e => {
      g.olaylar.push({ t: Date.now(), tur: o[0] }); gunlukKaydet();
      ctx.ses.pop(); ctx.efekt.emoji(e.clientX || 0, e.clientY || 0, o[1], 2);
      if (o[0] === 'uyudu' && !d.uyuyor) { uyut(); return; }
      if (o[0] === 'uyandi' && d.uyuyor) { uyandir(); return; }
      sekmeYenile();
    } }, [ctx.el('span', { 'aria-hidden': 'true' }, o[1]), ctx.el('span', o[2])])));
    const liste = ctx.el('div.barbie-olay-liste', bugunkuler.length ? bugunkuler.map(o => {
      const b = OLAYLAR.find(x => x[0] === o.tur) || ['?', '📝', o.tur];
      return ctx.el('div.barbie-olay', [
        ctx.el('span.sayi.sessiz', saat(o.t)), ctx.el('span', { 'aria-hidden': 'true' }, b[1]), ctx.el('span', b[2]), ctx.el('span.bosluk'),
        ctx.el('button.barbie-sil', { type: 'button', 'aria-label': 'Kaydı sil', onclick: () => { g.olaylar = g.olaylar.filter(x => x.t !== o.t); gunlukKaydet(); ctx.ses.blop(); sekmeYenile(); } }, '×')
      ]);
    }) : [ctx.el('p.sessiz', 'Bugün henüz not yok. Tek dokunuşla kaydet, akşam bakınca gülersin.')]);
    return ctx.el('div.yama.barbie-olaylar', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', 'Bugün neler oldu'), ctx.el('span.rozet.gri', 'bugün ' + bugunkuler.length)]),
      dugmeler, liste
    ]);
  }
  function notKarti() {
    let ruh = RUH[0][0];
    const ruhCipler = ctx.el('div.satir.sar.barbie-ruh', RUH.map(r => ctx.el('button.barbie-ruh-dugme', {
      type: 'button', 'aria-label': r[1], 'aria-pressed': String(r[0] === ruh), data: { ruh: r[0] },
      onclick: () => { ruh = r[0]; ctx.ses.tik(); Array.from(ruhCipler.children).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.ruh === ruh))); }
    }, r[0])));
    const metin = ctx.el('textarea.girdi', { rows: '3', placeholder: 'Bugün ne yaptı? (çorabımı kaçırdı, kapıya havladı, kucakta uyudu…)', maxlength: '400' });
    const ekle = () => {
      const m = metin.value.trim(); if (!m) { ctx.toast('Bir iki kelime yeter; ' + AD() + ' bekliyor.'); metin.focus(); return; }
      g.notlar.unshift({ id: CD.kimlik(), t: CD.bugun(), ts: Date.now(), metin: m.slice(0, 400), ruh }); gunlukKaydet();
      ctx.ses.parilti(); ctx.toast('Günlüğe yazıldı 📔'); sekmeYenile();
    };
    const gruplar = {};
    g.notlar.forEach(n => { (gruplar[n.t] = gruplar[n.t] || []).push(n); });
    const gunler = Object.keys(gruplar).sort().reverse().slice(0, 30);
    const liste = ctx.el('div.dikey.barbie-not-liste', gunler.length ? gunler.map(t => ctx.el('div.barbie-not-gun', [
      ctx.el('div.barbie-not-tarih.sayi', t === CD.bugun() ? 'Bugün' : CD.tarihYaz(t)),
      ctx.el('div.dikey', gruplar[t].map(n => ctx.el('div.barbie-not', [
        ctx.el('span.barbie-not-ruh', { 'aria-hidden': 'true' }, n.ruh || '🐾'),
        ctx.el('p.barbie-not-metin', n.metin),
        ctx.el('button.barbie-sil', { type: 'button', 'aria-label': 'Notu sil', onclick: async () => {
          const ok = await ctx.onayla('Bu not silinsin mi?', 'Sil', 'Kalsın'); if (!ok || !ctx) return;
          g.notlar = g.notlar.filter(x => x.id !== n.id); gunlukKaydet(); ctx.ses.blop(); sekmeYenile();
        } }, '×')
      ])))
    ])) : [ctx.el('p.sessiz', 'İlk notu sen yaz; yıllar sonra bu satırlar çok kıymetli olacak.')]);
    return ctx.el('div.yama.barbie-notlar', [
      ctx.el('h2.baslik.baslik-lg', 'Bugün ne yaptı?'),
      ruhCipler, metin,
      ctx.el('button.dugme.tam', { type: 'button', onclick: ekle }, 'Günlüğe yaz'),
      liste
    ]);
  }

  /* ============================================================ BAKIM */
  function bakimKur() {
    const kap = ctx.el('div.dikey.barbie-bakim');
    kap.append(ctx.el('div.yama.barbie-bakim-giris', [
      ctx.el('h2.baslik.baslik-lg', 'Pomeranian bakımı'),
      ctx.el('p.ikincil', 'Bu kartlar genel bilgi; ilaç, doz ya da marka önermez. ' + AD() + '\'nin kendi doktoru her zaman haklı.')
    ]));
    const onemli = IPUCLARI.filter(i => i.onem === 1);
    const digerleri = IPUCLARI.filter(i => i.onem !== 1);
    const kart = (i, etiket) => ctx.el('div.yama.barbie-ipucu-kart', [
      ctx.el('div.satir.arasi', [
        ctx.el('div.satir', [ctx.el('span.barbie-ipucu-emoji', { 'aria-hidden': 'true' }, i.emoji), ctx.el('h3.baslik.baslik-lg', i.ad)]),
        etiket ? ctx.el('span.rozet' + (etiket === 'önemli' ? '' : '.gri'), etiket) : null
      ]),
      ctx.el('p', i.metin)
    ]);
    onemli.forEach(i => kap.appendChild(kart(i, 'önemli')));
    kap.appendChild(ctx.el('h2.baslik.baslik-lg.barbie-ara-baslik', 'Rutinde iyi gelenler'));
    digerleri.forEach(i => kap.appendChild(kart(i, null)));
    kap.appendChild(ctx.el('div.yama.siki.barbie-uyari', [
      ctx.el('p', ['🩺 ', 'Bir şeyden emin değilsen, tahmin etme: veterinere sor. Beş dakikalık bir telefon, günlerce süren endişeden iyidir.'])
    ]));
    return kap;
  }

  /* ============================================================ SÖZLER */
  function sozlerKur() {
    const kap = ctx.el('div.dikey.barbie-sozler');
    const ust = ctx.el('div.yama', [
      ctx.el('div.satir.arasi', [ctx.el('h2.baslik.baslik-lg', AD() + '\'nin sözleri'), ctx.el('span.rozet.inci.barbie-soz-sayac')]),
      ctx.el('p.ikincil', 'Dokun, bir şey söylesin. Her yeni söz koleksiyona eklenir. Arada bir kapıya havlar; alışırsın.'),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => { sozSoyle(); ui.sahne.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' }); } }, ['💬 ', 'Bir şey söyle'])
    ]);
    const liste = ctx.el('div.barbie-soz-liste');
    kap.append(ust, liste);
    ui.sozListe = liste; ui.sozSayac = ust.querySelector('.barbie-soz-sayac');
    sozlerListesiYenile();
    return kap;
  }
  function sozlerListesiYenile() {
    if (!ui.sozListe || !ui.sozListe.isConnected) return;
    const liste = ui.sozListe; liste.innerHTML = '';
    ui.sozSayac.textContent = d.duyulan.length + ' / ' + (SOZLER.length + 1) + ' söz';
    SOZLER.forEach((s, i) => {
      const duyuldu = d.duyulan.indexOf(i) >= 0;
      liste.appendChild(duyuldu
        ? ctx.el('button.barbie-soz.duyuldu', { type: 'button', onclick: () => { sozSoyle(i); ui.sahne.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' }); } }, s.replace('{ad}', AD()))
        : ctx.el('span.barbie-soz.kilitli', { 'aria-label': 'Henüz duyulmadı' }, '···'));
    });
    const havladi = d.duyulan.indexOf(-1) >= 0;
    liste.appendChild(havladi
      ? ctx.el('button.barbie-soz.duyuldu.havla', { type: 'button', onclick: () => { if (!oy && !d.uyuyor) { havla(); ui.sahne.scrollIntoView({ behavior: ctx.azHareket ? 'auto' : 'smooth', block: 'start' }); } } }, HAVLAMA)
      : ctx.el('span.barbie-soz.kilitli', { 'aria-label': 'Henüz duyulmadı' }, '!!!'));
  }

  /* ------------------------------------------------------------ canlı sayaçlar, kutlama, selam */
  function canliGuncelle() {
    if (!ctx) return;
    if (d.bugun.tarih !== CD.bugun()) { d.bugun = { tarih: CD.bugun(), oksama: 0 }; kaydet(); if (sekme === 'gunluk' || sekme === 'oyna') sekmeYenile(); }
    if (oy || mesgul || document.visibilityState !== 'visible') return;
    const saatSimdi = new Date().getHours();
    const bugunku = g.mamalar.filter(bugunMu).length;
    if (bugunku === 0 && saatSimdi >= 11 && d.mamaUyariGunu !== CD.bugun()) {
      d.mamaUyariGunu = CD.bugun(); kaydet();
      ses.inle();
      soyle('Kabıma baktım, boştu. Tekrar baktım, yine boştu.', 3400);
    }
  }
  function dogumGunuKutla() {
    const t = dogumTarihi(); if (!t) return;
    if (dogumGunuKalan() !== 0) return;
    const yil = new Date().getFullYear();
    if (d.kutlananYil === yil) return;
    d.kutlananYil = yil; kaydet();
    sonra(() => {
      if (!ctx || oy) return;
      ctx.ses.zafer(); ctx.efekt.konfeti();
      ses.havlar(3, 1.1);
      ctx.toast('Bugün ' + AD() + '\'nin doğum günü 🎂', 3400);
      if (!d.uyuyor) { ui.svg.classList.add('mutlu'); ui.kuyruk.classList.add('cilgin'); sonra(() => { if (!oksuyor) { ui.svg.classList.remove('mutlu'); ui.kuyruk.classList.remove('cilgin'); } }, 2400); }
      soyle('Bugün benim günüm! Pasta yok, biliyorum. Ödül?', 3400);
    }, 2600);
  }
  function acilisSelami() {
    const uzunZaman = d.sonGorulme && Date.now() - d.sonGorulme > 6 * 3600000;
    sonra(() => {
      if (!ctx) return;
      if (d.uyuyor) { soyle('zZz…', 1600); return; }
      ui.kuyruk.classList.add('hizli'); sonra(() => ui.kuyruk.classList.remove('hizli'), 2200);
      soyle(rastgele(uzunZaman ? OZLEDIM : SELAM), 2600);
      ses.havlar(uzunZaman ? 3 : 2, 1.08);
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
    id: ID, baslik: 'Barbie', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el;
      yukle();
      const sahne = sahneKur();
      const sekmeler = sekmelerKur();
      el.append(sahne, sekmeler, ui.panel);
      if (AD() !== 'Barbie') ctx.baslik(AD());
      const kayitli = ctx.depo.al('sekme', 'oyna');
      sekmeSec(SEKMELER.some(s => s[0] === kayitli) ? kayitli : 'oyna');
      altbarKur();
      kirpDongu(); bosDongu();
      canliTik = setInterval(canliGuncelle, 30000);
      dinle(document, 'visibilitychange', () => {
        if (document.visibilityState !== 'visible') {
          if (oy) { cancelAnimationFrame(raf); raf = 0; }
          if (oksuyor) oksamaBitir(false);
          ses.solumaDur(); basili = null; tuslar = null;
        } else if (oy && !raf) { oy.sonZaman = performance.now(); raf = requestAnimationFrame(oyunAdim); }
      });
      dinle(window, 'resize', oyunBoyut);
      dinle(document, 'keydown', oyunTus);
      dinle(document, 'keyup', oyunTusBirak);
      dogumGunuKutla();
      acilisSelami();
      kaydet();
    },
    unmount() {
      if (oy) oy = null;
      cancelAnimationFrame(raf); raf = 0;
      clearInterval(canliTik); canliTik = 0;
      ses.solumaDur();
      hepsiniIptal();
      dinleyiciler.splice(0).forEach(([h, a, f, s]) => h.removeEventListener(a, f, s));
      if (ctx) { ctx.ses.hepsiniDurdur(); if (d) { d.kucakta = false; kaydet(); } }
      urlHavuzu.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); urlHavuzu = [];
      if (fotolar) fotolar.forEach(f => { f._url = ''; });
      fotolar = null; oksuyor = false; basili = null; mesgul = false; uykuDokunus = []; tuslar = null;
      Object.keys(ui).forEach(k => { delete ui[k]; });
      ctx = null; kok = null; d = null; g = null;
    }
  });
})();
