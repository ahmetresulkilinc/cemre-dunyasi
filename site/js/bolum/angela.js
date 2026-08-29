/* js/bolum/angela.js — Angela: beyaz kız kedi.
   Basılı tut, konuş → tiz sesle tekrar eder. Okşa, dürt, gıdıkla; besle, içir, yıka, tuvalete götür, uyut;
   dolaptan giydir, makyaj-saç köşesi, mini oyunlar, dans, fal kurabiyesi, açlık/mutluluk/enerji/temizlik barları, seviye + yıldız.
   İlerleme cd.angela.durum'da kalır. Sözleşme: site/MODUL-SOZLESMESI.md */
(() => {
  'use strict';
  const ID = 'angela';
  const rastgele = a => a[Math.floor(Math.random() * a.length)];
  const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));
  const SAAT = 3600000;
  const AZALMA = { tokluk: 7, mutluluk: 5, enerji: 4, temizlik: 3 };   // uyanıkken saatte kaç puan düşer
  const UYKU_ENERJI = 26;   // uyurken saatte kaç puan enerji gelir
  const TABAN = 12;         // çevrimdışı azalma bunun altına inmez: ceza yok, sadece "seni özledim"
  const CIZGI = 'rgba(59,52,68,.28)';

  /* ------------------------------------------------------------ içerik */
  const YEMEKLER = [
    { id: 'cilek', ad: 'Çilek', emoji: '🍓', tokluk: 10, mutluluk: 5, soz: ['Çilek! En sevdiğim.', 'Minik ama içten, tıpkı senin gibi.'] },
    { id: 'balik', ad: 'Balık', emoji: '🐟', tokluk: 24, mutluluk: 3, soz: ['Balık! Bıyıklarım titredi.', 'Kılçığı yok değil mi? …Yok, harika.'] },
    { id: 'kek', ad: 'Kek', emoji: '🧁', tokluk: 14, mutluluk: 7, soz: ['Kremasını burnuma bulaştırdım galiba.', 'Pembe kek, pembe kedi… uyumluyuz.'] },
    { id: 'kurabiye', ad: 'Kurabiye', emoji: '🍪', tokluk: 10, mutluluk: 5, soz: ['Çıtır çıtır! Bir tane daha?', 'Kırıntıları sonra toplarım, söz.'] },
    { id: 'susi', ad: 'Suşi', emoji: '🍣', tokluk: 18, mutluluk: 4, soz: ['Suşi! Zarif bir akşam yemeği.', 'Wasabi yoktu değil mi? …Neyse, yedim.'] },
    { id: 'kruvasan', ad: 'Kruvasan', emoji: '🥐', tokluk: 16, mutluluk: 4, soz: ['Paris sabahı gibi.', 'Tereyağlı… tüylerim parladı.'] },
    { id: 'pasta', ad: 'Pasta', emoji: '🍰', tokluk: 16, mutluluk: 8, soz: ['Doğum günüm değil ama olsun.', 'Pastanın çileğini en sona sakladım.'] },
    { id: 'dondurma', ad: 'Dondurma', emoji: '🍦', tokluk: 10, mutluluk: 7, soz: ['Beynim dondu, kalbim ısındı.', 'Külahını da yedim, çöp bırakmam.'] },
    { id: 'tavuk', ad: 'Tavuk', emoji: '🍗', tokluk: 22, mutluluk: 3, soz: ['Tavuk! Patilerimi yalıyorum.', 'Doyurucu. Şimdi bir kestirsem?'] },
    { id: 'karpuz', ad: 'Karpuz', emoji: '🍉', tokluk: 8, mutluluk: 5, soz: ['Serin ve tatlı. Yaz geldi sanki.', 'Çekirdeklerini bir kenara ayırdım.'] }
  ];
  const ICECEKLER = [
    { id: 'sut', ad: 'Süt', emoji: '🥛', tokluk: 6, enerji: 4, mutluluk: 4, icecek: true, soz: ['Bıyıklarımda süt kaldı mı?', 'Klasik. Kediler süt sever, ben de.'] },
    { id: 'boba', ad: 'Boba', emoji: '🧋', tokluk: 6, enerji: 9, mutluluk: 7, icecek: true, soz: ['Topları çiğnemek en sevdiğim oyun.', 'Pipet geniş olsun, ben acele ederim.'] },
    { id: 'meyve', ad: 'Meyve suyu', emoji: '🧃', tokluk: 4, enerji: 7, mutluluk: 4, icecek: true, soz: ['Vitamin! Tüylerim için.', 'Portakallı mı? Mükemmel.'] },
    { id: 'cay', ad: 'Çay', emoji: '🍵', tokluk: 2, enerji: 6, mutluluk: 5, icecek: true, soz: ['Çay saati. Küçük parmağımı kaldırdım.', 'İki şekerli, sen biliyorsun.'] },
    { id: 'limonata', ad: 'Limonata', emoji: '🍋', tokluk: 3, enerji: 6, mutluluk: 6, icecek: true, soz: ['Ekşi! Yüzüm buruştu ama sevdim.', 'Naneli limonata, yaz kokuyor.'] },
    { id: 'kakao', ad: 'Sıcak kakao', emoji: '☕', tokluk: 6, enerji: 5, mutluluk: 9, icecek: true, soz: ['Marşmelovlu! Kalbim eridi.', 'Sıcak kakao ve sen. Başka ne lazım?'] }
  ];
  const DOLAP = {
    fiyonk: { ad: 'Fiyonk', emoji: '🎀', esyalar: [
      { id: 'pembe', ad: 'Pembe fiyonk', bedel: 0, renk: '#FFB3C7' },
      { id: 'mavi', ad: 'Bebek mavisi', bedel: 15, renk: '#A9D6F2' },
      { id: 'kirmizi', ad: 'Kiraz kırmızısı', bedel: 20, renk: '#E5405E' },
      { id: 'siyah', ad: 'Kadife siyah', bedel: 30, renk: '#3B3444' },
      { id: 'inci', ad: 'İnci fiyonk', bedel: 45, renk: '#F2E6FF', inci: true }
    ] },
    gozluk: { ad: 'Gözlük', emoji: '👓', esyalar: [
      { id: 'kalp', ad: 'Kalp gözlük', bedel: 25, renk: '#FF7A9C' },
      { id: 'yuvarlak', ad: 'Yuvarlak gözlük', bedel: 20, renk: '#C9A24D' },
      { id: 'gunes', ad: 'Güneş gözlüğü', bedel: 35, renk: '#3B3444' }
    ] },
    sapka: { ad: 'Şapka', emoji: '👒', esyalar: [
      { id: 'bere', ad: 'Pembe bere', bedel: 20, renk: '#F7B6C8' },
      { id: 'hasir', ad: 'Hasır şapka', bedel: 30, renk: '#F1D9A0' },
      { id: 'cicek', ad: 'Çiçek tacı', bedel: 40, renk: '#FF9DB4' },
      { id: 'tac', ad: 'Küçük taç', bedel: 60, renk: '#F5B54A' }
    ] },
    elbise: { ad: 'Elbise', emoji: '👗', esyalar: [
      { id: 'tutu', ad: 'Pembe tütü', bedel: 30, renk: '#FFC2D4' },
      { id: 'cizgili', ad: 'Çizgili tişört', bedel: 25, renk: '#A9D6F2' },
      { id: 'lavanta', ad: 'Lavanta elbise', bedel: 35, renk: '#CDBDF6' },
      { id: 'yildizli', ad: 'Yıldızlı elbise', bedel: 55, renk: '#2E3A63' }
    ] },
    kolye: { ad: 'Kolye', emoji: '📿', esyalar: [
      { id: 'kalp', ad: 'Kalp kolye', bedel: 25, renk: '#FF7A9C' },
      { id: 'inci', ad: 'İnci kolye', bedel: 30, renk: '#FFF4F8' },
      { id: 'yildiz', ad: 'Yıldız kolye', bedel: 35, renk: '#F5B54A' }
    ] }
  };
  const GUZELLIK = {
    far: { ad: 'Göz farı', secenek: [{ id: '', ad: 'Yok' }, { id: 'pembe', ad: 'Pembe', renk: '#F9B8CF' }, { id: 'lavanta', ad: 'Lavanta', renk: '#C9B6F0' }, { id: 'altin', ad: 'Altın', renk: '#F3D28A' }, { id: 'mavi', ad: 'Mavi', renk: '#A9D6F2' }, { id: 'mor', ad: 'Mor', renk: '#9B7BD6' }] },
    allik: { ad: 'Allık', secenek: [{ id: '', ad: 'Yok' }, { id: 'hafif', ad: 'Hafif', renk: '#FFC6D3', op: .55 }, { id: 'seftali', ad: 'Şeftali', renk: '#FFB394', op: .7 }, { id: 'pembe', ad: 'Pembe', renk: '#FF9DB4', op: .8 }] },
    ruj: { ad: 'Ruj', secenek: [{ id: '', ad: 'Yok' }, { id: 'pembe', ad: 'Pembe', renk: '#F27A9E' }, { id: 'kirmizi', ad: 'Kırmızı', renk: '#D8384F' }, { id: 'nude', ad: 'Nude', renk: '#E4A692' }, { id: 'mor', ad: 'Mor', renk: '#A55BB0' }, { id: 'parlak', ad: 'Parlatıcı', renk: '#FFB6C9' }] },
    sac: { ad: 'Saç', secenek: [{ id: '', ad: 'Yok' }, { id: 'kahkul', ad: 'Kâkül' }, { id: 'lule', ad: 'Lüle' }, { id: 'kuyruk', ad: 'At kuyruğu' }, { id: 'orgu', ad: 'Örgü' }] },
    sacRenk: { ad: 'Saç rengi', secenek: [{ id: 'sari', ad: 'Sarı', renk: '#F6D67A' }, { id: 'kestane', ad: 'Kestane', renk: '#8B5A3C' }, { id: 'pembe', ad: 'Pembe', renk: '#FF9DB4' }, { id: 'lavanta', ad: 'Lavanta', renk: '#CDBDF6' }, { id: 'beyaz', ad: 'Kar beyazı', renk: '#FFFFFF' }, { id: 'siyah', ad: 'Siyah', renk: '#3B3444' }] }
  };
  const SEVDIKLERI = ['Çilek ve sıcak kakao', 'Pembe fiyonk', 'Kelebek kovalamak', 'Bol köpüklü banyo', 'Başının okşanması', 'Müzik açılınca dans etmek', 'Cemre\'nin sesini duymak'];
  const FALLAR = [
    'Bugün biri sana gülümseyecek; büyük ihtimalle ben.', 'Yakında çok yakışan bir tırnak rengi keşfedeceksin.', 'Pıttıksu bugün sana ekstra sarılacak.',
    'Küçük bir mola, büyük bir keyif getirecek.', 'Aynaya bak: gördüğün kişi bugün de çok güzel.', 'Sıcak bir içecek tam şu an iyi gelir.',
    'Kalbinin bildiği yol doğru yol.', 'Yarın bugünden de tatlı olacak.', 'Bir kelebek görürsen dilek tut; tutuyor.', 'Şanslı rengin: pembe. Şaşırmadım.',
    'Bugün biraz dans et; tüyler dökülmez.', 'Seni düşünen biri var; hem de şu an.', 'Gülüşün bugün birinin gününü kurtaracak.',
    'Küçük bir sürpriz yolda; sabırlı ol, kedi gibi.', 'Bugün kendine bir iyilik yap: sadece dinlen.', 'Fiyonk takanın şansı bol olur. Kural bu.',
    'Bugün mırıldandığın her şarkı doğru notada çıkacak.', 'Şanslı sayın: 7. Şanslı kedin: ben.', 'Bugün bir kediyi okşa; o kedi ben olabilirim.'
  ];
  const SOZ = {
    selam: ['Cemre! Seni bekliyordum.', 'Hoş geldin canım, bugün çok güzelsin.', 'Nihayet! Sana anlatacak çok şeyim var.', 'Merhaba Cemre, patilerimi yeni yıkadım.'],
    ozledim: ['Seni özledim… ama artık buradasın.', 'Neredeydin? Pencereden yolu izledim.', 'Gelmeni bekledim, kirpiklerimi bile taradım.'],
    bos: ['Bugün ne yapsak?', 'Fiyonğum yamuk mu duruyor?', 'Kelebek kovalamak ister misin?', 'Bana bir şey söyle, tekrar edeyim.', 'Cemre, sence tırnaklarıma ne renk yakışır?', 'Pencereden bir kuş geçti, selam verdim.', 'Tüylerimi fırçaladım, bak nasıl parlıyor.', 'Bana bir hikâye anlatsana.', 'Aynaya baktım, yine güzelim.'],
    ac: ['Karnım guruldadı… duydun mu?', 'Küçük bir çilek? Ya da büyük bir balık?', 'Açlıktan kirpiklerim düşecek.'],
    yorgun: ['Esnedim, gördün mü? Uyku vakti.', 'Işığı kapatsan ben de bir kestirsem.', 'Gözlerim kapanıyor Cemre…'],
    kirli: ['Tüylerim biraz tozlandı, banyo?', 'Köpük istiyorum! Bol bol köpük.', 'Pati izlerim belli oluyor, yıkanmam lazım.'],
    mutsuz: ['Biraz can sıkıntısı… oyun oynar mıyız?', 'Bana bir şey anlat, kulaklarım sende.', 'Başımı okşasan her şey düzelir.'],
    tuvalet: ['Cemre… tuvalete gitmem lazım!', 'Küçük bir mola? Mahremiyet lütfen.'],
    yedi: ['Mmm! Bu çok lezzetliydi.', 'Teşekkürler Cemre, eline sağlık.', 'Bıyıklarım bile mutlu.'],
    icti: ['Ahh, serinledim.', 'Pipetle içmek en sevdiğim şey.', 'Bıyıklarımda köpük kaldı mı?'],
    tok: ['Karnım tık tık tok. Biraz sonra?', 'Bir lokma daha girmez, söz.'],
    banyoBasla: ['Köpük zamanı! Beni iyice ov.', 'Suyu ılık yaptın değil mi? …Mükemmel.', 'Kulaklarımın arkasını unutma.'],
    banyoBitti: ['Pırıl pırılım! Tüylerimi kokla.', 'Tertemiz, mis gibi. Şimdi bir fiyonk?', 'Parlıyorum! Aynaya koşmam lazım.'],
    tuvaletBitti: ['Rahatladım, teşekkürler.', 'Kimse bakmadı değil mi? Güzel.'],
    tuvaletYok: ['Şu an gerek yok, ama sağ ol.', 'Tuvalet mi? Hayır, iyiyim.'],
    uyudu: ['İyi geceler Cemre… zZz', 'Rüyamda seni göreceğim.', 'Işığı kapattın, teşekkürler…'],
    uyandi: ['Günaydın! Enerjim yerine geldi.', 'Uyandım! Kirpiklerim bile dinlendi.', 'Rüyamda çilek tarlası vardı.'],
    kafa: ['Mırr… tam oradan.', 'Başımı okşamana bayılıyorum.', 'Biraz daha… mırrr.', 'Kulaklarımın arkası… evet, orası.'],
    karin: ['Karnım hassas ama sen olunca olur.', 'Mırrr… uyku getiriyor.', 'Karnımı sadece sana gösteririm.'],
    gidik: ['Hihihi! Gıdıklama!', 'Dur dur dur, hihihi!', 'Karnım! Hihi, yeter!', 'Hihihi… iyi tamam, biraz daha.'],
    ayak: ['Patilerim gıdıklanıyor!', 'Ayak değil, pati diyoruz.', 'Tırnaklarımı fark ettin mi? Yeni yaptırdım.'],
    kuyruk: ['Kuyruğuma dokunulmaz! …Tamam, biraz olur.', 'Miyav! Kuyruğum benim.', 'Kuyruğum kendi kafasına göre takılıyor.'],
    burun: ['Hapşu! Burnum gıdıklandı.', 'Burnuma dokundun, artık arkadaşız.', 'Pembe, değil mi? Doğal.'],
    uykudaDokun: ['şşş… zZz', 'mırr… beş dakika daha', 'zZz… Cemre…'],
    dinliyor: ['Dinliyorum…', 'Söyle söyle…', 'Kulaklarım sende.'],
    konustu: ['Sesim böyle mi çıkıyor?', 'Hihi, tekrar söyle!', 'Kulağa harika geliyorum.', 'Bir daha! Bir daha!', 'Bunu Pıttıksu duysa güler.'],
    kisa: ['Biraz daha uzun söyle, duyamadım.', 'Sadece bir nefes duydum. Bir daha?'],
    giydi: ['Bu bana çok yakıştı, değil mi?', 'Aynaya bakıp durmam normal mi?', 'Cemre, sen seçince güzel oluyor.', 'Paris\'te böyle giyinirler.'],
    cikardi: ['Rahat da oldu aslında.', 'Doğal halim de fena değil.'],
    makyaj: ['Kirpiklerim zaten uzun ama olsun.', 'Bu renk gözlerimi açtı!', 'Sen yapınca daha güzel oluyor.', 'Selfie çeksek mi?'],
    seviye: ['Seviye atladık! Birlikte büyüyoruz.', 'Yıldızlar bize yağıyor!', 'Bir seviye daha! Sen harikasın.'],
    oyunKazandi: ['Kazandık! Sen benim şanslı insanımsın.', 'Bu oyunda çok iyiyiz.', 'Tekrar oynayalım mı?'],
    mesgul: ['Bir saniye, şu an meşgulüm.', 'Önce bunu bitirelim.'],
    yildizYok: ['Biraz daha yıldız toplayalım, sonra alırız.', 'Yıldızlar yetmedi; oyun oynayalım, birikir.'],
    dansBasla: ['Müzik! Patilerim kendiliğinden oynuyor.', 'Bunu Paris\'te öğrendim, izle!', 'Sen de kalk, birlikte dans edelim!'],
    dansBitti: ['Nefes nefese kaldım ama harikaydım.', 'Bir daha? Bir daha!', 'Dans edince tüylerim bile gülüyor.'],
    fal: ['Bakalım kurabiye ne demiş…', 'Kurabiyeler hep doğru söyler.', 'Ben de merak ettim!', 'Bu falı ben yazmadım, yemin ederim.'],
    esne: ['Haaa… esnedim.', '…hmm, yorgunum galiba.']
  };
  const ROZETLER = [
    { id: 'ilkSes', ad: 'İlk sohbet', emoji: '🎤', sart: 'Bir kez konuş', kontrol: d => d.sayac.konus >= 1 },
    { id: 'geveze', ad: 'Geveze', emoji: '💬', sart: '20 kez konuş', kontrol: d => d.sayac.konus >= 20 },
    { id: 'sef', ad: 'Küçük şef', emoji: '🍓', sart: '10 kez besle', kontrol: d => d.sayac.besle >= 10 },
    { id: 'kopuk', ad: 'Köpük perisi', emoji: '🫧', sart: '5 banyo', kontrol: d => d.sayac.banyo >= 5 },
    { id: 'moda', ad: 'Moda ikonu', emoji: '👗', sart: 'Dolapta 5 parça', kontrol: d => d.dolap.sahip.length >= 5 },
    { id: 'guzellik', ad: 'Güzellik uzmanı', emoji: '💄', sart: 'Makyaj yap', kontrol: d => d.sayac.makyaj >= 1 },
    { id: 'oyuncu', ad: 'Oyun arkadaşı', emoji: '🦋', sart: '5 oyun', kontrol: d => d.sayac.oyun >= 5 },
    { id: 'dans', ad: 'Dans kraliçesi', emoji: '💃', sart: '5 kez dans et', kontrol: d => d.sayac.dans >= 5 },
    { id: 'fal', ad: 'Falcı kedi', emoji: '🥠', sart: '3 kurabiye kır', kontrol: d => d.sayac.fal >= 3 },
    { id: 'uyku', ad: 'Uyku perisi', emoji: '🌙', sart: '5 kez uyut', kontrol: d => d.sayac.uyku >= 5 },
    { id: 'sevgi', ad: 'Sarılmalık', emoji: '💗', sart: '30 kez okşa', kontrol: d => d.sayac.oksama >= 30 },
    { id: 'sv5', ad: 'Beşinci seviye', emoji: '⭐', sart: 'Seviye 5', kontrol: d => d.seviye >= 5 },
    { id: 'sv10', ad: 'Yıldız kedi', emoji: '👑', sart: 'Seviye 10', kontrol: d => d.seviye >= 10 },
    { id: 'tam', ad: 'Tam bakım', emoji: '✨', sart: 'Dört bar da dolu', kontrol: d => d.tokluk >= 90 && d.mutluluk >= 90 && d.enerji >= 90 && d.temizlik >= 90 }
  ];
  const BARLAR = [
    { k: 'tokluk', ad: 'Tokluk', ikon: '🍓', renk: 'var(--seker-seftali)' },
    { k: 'mutluluk', ad: 'Mutluluk', ikon: '💛', renk: 'var(--seker-kiraz)' },
    { k: 'enerji', ad: 'Enerji', ikon: '⚡', renk: 'var(--seker-limon)' },
    { k: 'temizlik', ad: 'Temizlik', ikon: '🫧', renk: 'var(--seker-nane)' }
  ];

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null;
  const ui = {};
  const T = {};              // zamanlayıcılar
  let mod = 'normal';        // normal | yemek | banyo | tuvalet | oyun | kayit | konusma | dans
  let basili = null, sonOksamaOdul = 0, tiklamalar = [], kopuk = 0, kopukTam = false, sonOv = 0, mirrAcik = false;
  let kayitci = null, akis = null, parcalar = [], kayitBas = 0, mikBasili = false, sonKayit = null;
  let oyun = null, hafiza = null, sekme = 'dolap';
  let raf = 0;

  function varsayilan() {
    return {
      ad: '', tokluk: 72, mutluluk: 76, enerji: 80, temizlik: 70, tuvalet: 10,
      yildiz: 20, xp: 0, seviye: 1, uyuyor: false, uykuBas: 0,
      dolap: { sahip: ['fiyonk:pembe'], giyili: { fiyonk: 'pembe', gozluk: '', sapka: '', elbise: '', kolye: '' } },
      guzellik: { far: '', allik: '', ruj: '', sac: '', sacRenk: 'sari' },
      sayac: { besle: 0, icir: 0, banyo: 0, tuvalet: 0, uyku: 0, oksama: 0, konus: 0, oyun: 0, makyaj: 0, giyim: 0, dans: 0, fal: 0 },
      rozetler: [], rekor: { kelebek: 0, hafiza: 0 }, gunluk: '', falGunu: '', ipucuGoruldu: false, sonGorulme: Date.now()
    };
  }
  function yukle() {
    const v = varsayilan(), k = ctx.depo.al('durum', {}) || {};
    const d2 = Object.assign(v, k);
    d2.dolap = Object.assign(v.dolap, k.dolap || {}); d2.dolap.giyili = Object.assign(v.dolap.giyili, (k.dolap || {}).giyili || {});
    d2.guzellik = Object.assign(v.guzellik, k.guzellik || {}); d2.sayac = Object.assign(v.sayac, k.sayac || {}); d2.rekor = Object.assign(v.rekor, k.rekor || {});
    if (!Array.isArray(d2.dolap.sahip)) d2.dolap.sahip = ['fiyonk:pembe'];
    if (!Array.isArray(d2.rozetler)) d2.rozetler = [];
    return d2;
  }
  function kaydet() {
    if (!d || !ctx) return;
    d.sonGorulme = Date.now();
    ctx.depo.yaz('durum', d);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function ipucuMetni() {
    if (d.uyuyor) return 'Mışıl mışıl uyuyor 💤';
    if (d.tokluk < 30) return ad() + ' acıktı 🍓';
    if (d.temizlik < 30) return 'Banyo istiyor 🫧';
    if (d.enerji < 25) return 'Uykusu geldi 💤';
    if (d.mutluluk < 35) return 'Seni özledi 💗';
    return 'Seviye ' + d.seviye + ' · ' + d.yildiz + ' yıldız ⭐';
  }
  function ad() { return (d && d.ad) || (ctx && ctx.config && ctx.config.ANGELA_ADI) || 'Angela'; }

  /* ------------------------------------------------------------ SVG: Angela */
  const YILDIZ_YOL = 'M0 -8 L 2.4 -2.4 L 8 -2 L 3.6 1.8 L 5 8 L 0 4.6 L -5 8 L -3.6 1.8 L -8 -2 L -2.4 -2.4 Z';
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 34 L8 8 L30 20 Z" fill="#FFFFFF" stroke="#E9DFE7" stroke-width="2" stroke-linejoin="round"/><path d="M50 34 L56 8 L34 20 Z" fill="#FFFFFF" stroke="#E9DFE7" stroke-width="2" stroke-linejoin="round"/><path d="M15 30 L12 14 L26 22 Z" fill="#F7B6C8"/><path d="M49 30 L52 14 L38 22 Z" fill="#F7B6C8"/><ellipse cx="32" cy="36" rx="24" ry="22" fill="#FFFFFF" stroke="#E9DFE7" stroke-width="2"/><ellipse cx="23" cy="36" rx="5" ry="6" fill="#4FBFB9"/><ellipse cx="41" cy="36" rx="5" ry="6" fill="#4FBFB9"/><circle cx="23" cy="37" r="2.4" fill="#1F2A36"/><circle cx="41" cy="37" r="2.4" fill="#1F2A36"/><circle cx="21.5" cy="34" r="1.4" fill="#fff"/><circle cx="39.5" cy="34" r="1.4" fill="#fff"/><path d="M16 30 L13 27 M17 27 L15 24 M44 27 L46 24 M48 30 L51 27" stroke="#3B3444" stroke-width="1.6" stroke-linecap="round"/><path d="M32 44 L29.5 41.5 Q32 40 34.5 41.5 Z" fill="#F4A3B8"/><path d="M32 44 Q29 48 26 45 M32 44 Q35 48 38 45" stroke="#3B3444" stroke-width="1.5" fill="none" stroke-linecap="round"/><g transform="translate(50 14) rotate(20) scale(.55)"><path d="M0 0 C -14 -16, -30 -10, -24 2 C -30 14, -14 20, 0 4 Z" fill="#FFB3C7"/><path d="M0 0 C 14 -16, 30 -10, 24 2 C 30 14, 14 20, 0 4 Z" fill="#FFB3C7"/><circle cy="2" r="5" fill="#EE8AAA"/></g></svg>';
  const MIK_IKON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="12" rx="4" fill="currentColor"/><path d="M5 11 a7 7 0 0 0 14 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 18 v3 M9 21 h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

  function goz(cx, sag) {
    const kirpik = sag
      ? 'M' + (cx + 17) + ' 92 L ' + (cx + 26) + ' 84 M' + (cx + 14) + ' 85 L ' + (cx + 21) + ' 76 M' + (cx + 8) + ' 80 L ' + (cx + 12) + ' 70'
      : 'M' + (cx - 17) + ' 92 L ' + (cx - 26) + ' 84 M' + (cx - 14) + ' 85 L ' + (cx - 21) + ' 76 M' + (cx - 8) + ' 80 L ' + (cx - 12) + ' 70';
    const kirp = sag ? 'angGozSag' : 'angGozSol';
    return '<g class="angela-goz">' +
      '<path class="angela-far" d="M' + (cx - 19) + ' 86 Q ' + cx + ' 64 ' + (cx + 19) + ' 86 Q ' + cx + ' 80 ' + (cx - 19) + ' 86 Z"/>' +
      '<g class="angela-goz-acik">' +
        '<ellipse cx="' + cx + '" cy="106" rx="19" ry="23" fill="#FFFFFF" stroke="#E3DAE2" stroke-width="1.2"/>' +
        '<g clip-path="url(#' + kirp + ')">' +
          '<g class="angela-goz-ic"><circle cx="' + cx + '" cy="108" r="14" fill="url(#angIris)"/><circle class="angela-bebek" cx="' + cx + '" cy="108" r="7" fill="#1F2A36"/><circle cx="' + (cx - 5) + '" cy="101" r="4.5" fill="#FFFFFF"/><circle cx="' + (cx + 5) + '" cy="113" r="2" fill="#FFFFFF" opacity=".85"/></g>' +
          '<ellipse class="angela-kapak" cx="' + cx + '" cy="106" rx="20" ry="24" fill="var(--angela-tuy)"/>' +
        '</g>' +
      '</g>' +
      '<path class="angela-goz-mutlu" d="M' + (cx - 16) + ' 110 Q ' + cx + ' 92 ' + (cx + 16) + ' 110" fill="none" stroke="var(--angela-cizgi)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path class="angela-goz-uyku" d="M' + (cx - 16) + ' 104 Q ' + cx + ' 118 ' + (cx + 16) + ' 104" fill="none" stroke="var(--angela-cizgi)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path class="angela-kirpik" d="' + kirpik + '" fill="none" stroke="var(--angela-cizgi)" stroke-width="2.6" stroke-linecap="round"/>' +
    '</g>';
  }
  function kediSvg() {
    const tuy = 'fill="var(--angela-tuy)" stroke="var(--angela-golge)" stroke-width="2.5" stroke-linejoin="round"';
    return '<svg class="angela-kedi" viewBox="0 0 240 300" data-ifade="normal" data-agiz="kapali" role="img" aria-label="Beyaz kedi">' +
      '<defs>' +
        '<radialGradient id="angIris" cx="50%" cy="42%" r="58%"><stop offset="0" stop-color="#9BEBE3"/><stop offset=".55" stop-color="#4FBFB9"/><stop offset="1" stop-color="#2A86A0"/></radialGradient>' +
        '<linearGradient id="angInci" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD6E4"/><stop offset=".4" stop-color="#E2F1FF"/><stop offset=".7" stop-color="#FFF7D9"/><stop offset="1" stop-color="#EADFFF"/></linearGradient>' +
        '<clipPath id="angGozSol"><ellipse cx="94" cy="106" rx="19" ry="23"/></clipPath>' +
        '<clipPath id="angGozSag"><ellipse cx="146" cy="106" rx="19" ry="23"/></clipPath>' +
        '<clipPath id="angTisort"><path d="M96 166 L 144 166 L 152 232 L 88 232 Z"/></clipPath>' +
      '</defs>' +
      '<g class="angela-sac-arka"></g>' +
      '<g class="angela-kuyruk">' +
        '<path d="M166 262 C 200 268, 228 240, 218 198 C 214 182, 202 180, 200 192" fill="none" stroke="var(--angela-golge)" stroke-width="25" stroke-linecap="round"/>' +
        '<path d="M166 262 C 200 268, 228 240, 218 198 C 214 182, 202 180, 200 192" fill="none" stroke="var(--angela-tuy)" stroke-width="19" stroke-linecap="round"/>' +
        '<path d="M166 262 C 200 268, 228 240, 218 198 C 214 182, 202 180, 200 192" fill="none" stroke="transparent" stroke-width="36" stroke-linecap="round" data-bolge="kuyruk"/>' +
      '</g>' +
      '<g class="angela-govde">' +
        '<path d="M120 150 C 84 156, 64 196, 66 240 C 67 272, 88 290, 120 290 C 152 290, 173 272, 174 240 C 176 196, 156 156, 120 150 Z" ' + tuy + '/>' +
        '<ellipse cx="120" cy="232" rx="34" ry="42" fill="var(--angela-karin)"/>' +
        '<g class="angela-kir"><ellipse cx="98" cy="252" rx="9" ry="6"/><ellipse cx="146" cy="214" rx="7" ry="5"/><ellipse cx="124" cy="270" rx="6" ry="4"/><ellipse cx="72" cy="120" rx="6" ry="4"/></g>' +
        '<g class="angela-elbise"></g>' +
        '<path d="M88 184 C 74 210, 74 246, 84 266" fill="none" stroke="var(--angela-golge)" stroke-width="21" stroke-linecap="round"/><path d="M88 184 C 74 210, 74 246, 84 266" fill="none" stroke="var(--angela-tuy)" stroke-width="16" stroke-linecap="round"/>' +
        '<path d="M152 184 C 166 210, 166 246, 156 266" fill="none" stroke="var(--angela-golge)" stroke-width="21" stroke-linecap="round"/><path d="M152 184 C 166 210, 166 246, 156 266" fill="none" stroke="var(--angela-tuy)" stroke-width="16" stroke-linecap="round"/>' +
        '<ellipse cx="86" cy="270" rx="15" ry="9" ' + tuy + '/><ellipse cx="154" cy="270" rx="15" ry="9" ' + tuy + '/>' +
        '<path d="M80 270 v5 M86 269 v6 M92 270 v5 M148 270 v5 M154 269 v6 M160 270 v5" stroke="var(--angela-golge)" stroke-width="1.6" stroke-linecap="round"/>' +
        '<ellipse class="angela-ayak angela-ayak-sol" cx="72" cy="284" rx="20" ry="11" ' + tuy + '/><ellipse class="angela-ayak angela-ayak-sag" cx="168" cy="284" rx="20" ry="11" ' + tuy + '/>' +
        '<path d="M64 284 v6 M72 283 v7 M80 284 v6 M160 284 v6 M168 283 v7 M176 284 v6" stroke="var(--angela-golge)" stroke-width="1.6" stroke-linecap="round"/>' +
        '<g class="angela-kolye"></g>' +
      '</g>' +
      '<g class="angela-kafa">' +
        '<g class="angela-kulak angela-kulak-sol"><path d="M58 70 L 44 14 L 100 46 Z" ' + tuy + '/><path d="M63 62 L 55 28 L 88 48 Z" fill="var(--angela-kulak)"/></g>' +
        '<g class="angela-kulak angela-kulak-sag"><path d="M182 70 L 196 14 L 140 46 Z" ' + tuy + '/><path d="M177 62 L 185 28 L 152 48 Z" fill="var(--angela-kulak)"/></g>' +
        '<path d="M120 32 C 170 32, 200 66, 197 108 C 194 150, 160 172, 120 172 C 80 172, 46 150, 43 108 C 40 66, 70 32, 120 32 Z" ' + tuy + '/>' +
        '<path d="M46 126 l -8 4 l 9 4 l -6 6 l 10 1 M194 126 l 8 4 l -9 4 l 6 6 l -10 1" fill="none" stroke="var(--angela-golge)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M108 34 C 112 24, 122 22, 126 30 C 130 24, 138 26, 136 34" fill="var(--angela-tuy)" stroke="var(--angela-golge)" stroke-width="2"/>' +
        '<g class="angela-sac-on"></g>' +
        goz(94, false) + goz(146, true) +
        '<ellipse class="angela-yanak" cx="70" cy="136" rx="13" ry="7"/><ellipse class="angela-yanak" cx="170" cy="136" rx="13" ry="7"/>' +
        '<path d="M120 138 L 112 129 Q 120 122 128 129 Z" fill="var(--angela-burun)" stroke="rgba(59,52,68,.15)" stroke-width="1"/>' +
        '<path class="angela-ruj" d="M104 143 Q 112 138 120 142 Q 128 138 136 143 Q 128 156 120 154 Q 112 156 104 143 Z"/>' +
        '<g class="angela-agiz-kapali"><path d="M120 138 L 120 143 M120 143 Q 112 151 104 144 M120 143 Q 128 151 136 144" fill="none" stroke="var(--angela-cizgi)" stroke-width="2.4" stroke-linecap="round"/></g>' +
        '<g class="angela-agiz-acik"><ellipse cx="120" cy="150" rx="10" ry="8" fill="#C9556F"/><ellipse cx="120" cy="155" rx="6" ry="4" fill="#F49BB3"/><path d="M111 145 Q 120 141 129 145" fill="none" stroke="var(--angela-cizgi)" stroke-width="2" stroke-linecap="round"/></g>' +
        '<path d="M58 122 L 26 116 M58 130 L 22 132 M60 138 L 30 148 M182 122 L 214 116 M182 130 L 218 132 M180 138 L 210 148" stroke="#CFC6CF" stroke-width="2" stroke-linecap="round"/>' +
        '<g class="angela-gozluk"></g>' +
        '<g class="angela-fiyonk"></g>' +
        '<g class="angela-sapka"></g>' +
      '</g>' +
      '<g class="angela-bolgeler">' +
        '<ellipse cx="120" cy="232" rx="36" ry="44" data-bolge="karin"/>' +
        '<ellipse cx="72" cy="282" rx="24" ry="14" data-bolge="ayak"/><ellipse cx="168" cy="282" rx="24" ry="14" data-bolge="ayak"/>' +
        '<path d="M120 20 C 172 20, 204 60, 200 108 C 196 154, 160 178, 120 178 C 80 178, 44 154, 40 108 C 36 60, 68 20, 120 20 Z" data-bolge="kafa"/>' +
        '<circle cx="120" cy="132" r="11" data-bolge="burun"/>' +
      '</g>' +
    '</svg>';
  }
  function fiyonkSvg(e) {
    const dolgu = e.inci ? 'url(#angInci)' : e.renk;
    return '<g transform="translate(172 44) rotate(18)">' +
      '<path d="M0 0 C -16 -18, -34 -12, -26 2 C -34 16, -16 22, 0 4 Z" fill="' + dolgu + '" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M0 0 C 16 -18, 34 -12, 26 2 C 34 16, 16 22, 0 4 Z" fill="' + dolgu + '" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M-4 6 L -10 24 M4 6 L 10 24" stroke="' + e.renk + '" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="0" cy="2" r="5.5" fill="' + dolgu + '" stroke="' + CIZGI + '" stroke-width="2"/></g>';
  }
  function gozlukSvg(e) {
    if (e.id === 'kalp') {
      const kalp = cx => '<path d="M' + cx + ' 130 C ' + (cx - 34) + ' 110, ' + (cx - 32) + ' 76, ' + cx + ' 92 C ' + (cx + 32) + ' 76, ' + (cx + 34) + ' 110, ' + cx + ' 130 Z" fill="' + e.renk + '" fill-opacity=".16" stroke="' + e.renk + '" stroke-width="3.5" stroke-linejoin="round"/>';
      return kalp(94) + kalp(146) + '<path d="M116 100 L 124 100" stroke="' + e.renk + '" stroke-width="3.5" stroke-linecap="round"/>';
    }
    if (e.id === 'gunes') return '<ellipse cx="94" cy="106" rx="25" ry="21" fill="' + e.renk + '" fill-opacity=".84"/><ellipse cx="146" cy="106" rx="25" ry="21" fill="' + e.renk + '" fill-opacity=".84"/><path d="M118 103 Q 120 98 122 103" stroke="' + e.renk + '" stroke-width="3" fill="none"/><path d="M82 98 L 98 92 M134 98 L 150 92" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M69 104 L 46 100 M171 104 L 194 100" stroke="' + e.renk + '" stroke-width="3" stroke-linecap="round"/>';
    return '<circle cx="94" cy="106" r="26" fill="none" stroke="' + e.renk + '" stroke-width="3.5"/><circle cx="146" cy="106" r="26" fill="none" stroke="' + e.renk + '" stroke-width="3.5"/><path d="M119 103 Q 120 99 121 103" stroke="' + e.renk + '" stroke-width="3" fill="none"/><path d="M68 104 L 46 100 M172 104 L 194 100" stroke="' + e.renk + '" stroke-width="3" stroke-linecap="round"/>';
  }
  function sapkaSvg(e) {
    if (e.id === 'bere') return '<g transform="rotate(-12 110 34)"><ellipse cx="110" cy="34" rx="52" ry="21" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2"/><ellipse cx="110" cy="47" rx="48" ry="9" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2"/><circle cx="104" cy="13" r="7" fill="#FFFFFF" stroke="' + CIZGI + '" stroke-width="2"/></g>';
    if (e.id === 'tac') return '<path d="M92 36 L 98 10 L 110 28 L 120 4 L 130 28 L 142 10 L 148 36 Z" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/><rect x="90" y="32" width="60" height="8" rx="4" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2"/><circle cx="98" cy="10" r="3.5" fill="#FF9DB4"/><circle cx="120" cy="4" r="4" fill="#A9D6F2"/><circle cx="142" cy="10" r="3.5" fill="#FF9DB4"/><circle cx="120" cy="36" r="3" fill="#FFF7D9"/>';
    if (e.id === 'hasir') return '<path d="M76 40 C 76 4, 164 4, 164 40 Z" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2"/><ellipse cx="120" cy="40" rx="88" ry="15" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2"/><path d="M80 33 C 100 42, 140 42, 160 33" stroke="#FF9DB4" stroke-width="8" fill="none"/><g transform="translate(158 30) scale(.6)">' + fiyonkSvg({ renk: '#FF9DB4' }).replace('translate(172 44) rotate(18)', 'translate(0 0) rotate(10)') + '</g>';
    let s = '<path d="M60 58 C 80 36, 160 36, 180 58" stroke="#7CCB9A" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    [[62, 56], [80, 42], [100, 34], [120, 30], [140, 34], [160, 42], [178, 56]].forEach((p, i) => {
      const c = ['#FF9DB4', '#FFE28A', '#CDBDF6', '#FFC3A3'][i % 4];
      s += '<g transform="translate(' + p[0] + ' ' + p[1] + ')">' + [0, 72, 144, 216, 288].map(a => '<ellipse cx="0" cy="-5.5" rx="3.4" ry="5.5" fill="' + c + '" transform="rotate(' + a + ')"/>').join('') + '<circle r="2.8" fill="#FFF7D9"/></g>';
    });
    return s;
  }
  function elbiseSvg(e) {
    if (e.id === 'tutu') return '<path d="M96 196 L 144 196 L 172 262 Q 158 276 146 262 Q 133 276 120 262 Q 107 276 94 262 Q 82 276 68 262 Z" fill="' + e.renk + '" fill-opacity=".94" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/><path d="M98 170 L 142 170 L 144 198 L 96 198 Z" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2"/><path d="M102 196 L 138 196" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".75"/><path d="M104 234 L 136 234 M96 250 L 144 250" stroke="#FFFFFF" stroke-width="2" opacity=".5"/>';
    if (e.id === 'lavanta') return '<path d="M98 168 L 142 168 L 168 268 L 72 268 Z" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/><path d="M100 168 Q 120 188 140 168 Z" fill="#FFFFFF" stroke="' + CIZGI + '" stroke-width="2"/><path d="M84 236 L 156 236" stroke="#FFFFFF" stroke-width="3" opacity=".6"/><circle cx="120" cy="200" r="3" fill="#FFFFFF"/><circle cx="120" cy="214" r="3" fill="#FFFFFF"/>';
    if (e.id === 'cizgili') return '<path d="M96 166 L 144 166 L 152 232 L 88 232 Z" fill="#FFFFFF" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/><g clip-path="url(#angTisort)">' + [176, 190, 204, 218].map(y => '<path d="M84 ' + y + ' L 156 ' + y + '" stroke="' + e.renk + '" stroke-width="7"/>').join('') + '</g>';
    return '<path d="M98 168 L 142 168 L 170 268 L 70 268 Z" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/>' + [[100, 200], [132, 190], [118, 226], [150, 236], [90, 248], [140, 258], [112, 254]].map(p => '<path transform="translate(' + p[0] + ' ' + p[1] + ') scale(.55)" d="' + YILDIZ_YOL + '" fill="#FFE28A"/>').join('') + '<path d="M100 168 Q 120 186 140 168 Z" fill="#FFFFFF" stroke="' + CIZGI + '" stroke-width="2"/>';
  }
  function kolyeSvg(e) {
    const yol = 'M86 176 Q 120 206 154 176';
    if (e.id === 'inci') {
      let s = '<path d="' + yol + '" fill="none" stroke="' + CIZGI + '" stroke-width="1.5"/>';
      for (let i = 0; i <= 9; i++) { const t = i / 9, x = (1 - t) * (1 - t) * 86 + 2 * (1 - t) * t * 120 + t * t * 154, y = (1 - t) * (1 - t) * 176 + 2 * (1 - t) * t * 206 + t * t * 176; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4.2" fill="url(#angInci)" stroke="' + CIZGI + '" stroke-width="1"/>'; }
      return s;
    }
    const zincir = '<path d="' + yol + '" fill="none" stroke="#D9C56A" stroke-width="2.2"/>';
    if (e.id === 'kalp') return zincir + '<path transform="translate(120 194) scale(1.2)" d="M0 8 C -9 2, -8 -6, -3 -6 C -1 -6, 0 -4, 0 -3 C 0 -4, 1 -6, 3 -6 C 8 -6, 9 2, 0 8 Z" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="1.2"/>';
    return zincir + '<path transform="translate(120 196)" d="' + YILDIZ_YOL + '" fill="' + e.renk + '" stroke="' + CIZGI + '" stroke-width="1.2"/>';
  }
  function sacSvg(tur, renk, arka) {
    const kahkul = '<path d="M70 66 C 78 40, 100 32, 120 36 C 140 32, 162 40, 170 66 C 158 54, 146 58, 140 70 C 132 56, 120 54, 110 68 C 102 56, 90 56, 82 72 C 78 64, 74 62, 70 66 Z" fill="' + renk + '" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/>';
    if (tur === 'kahkul') return arka ? '' : kahkul;
    if (tur === 'lule') return arka ? '' : '<path d="M60 84 C 40 88, 34 112, 46 122 C 56 130, 66 118, 58 110 C 52 104, 44 110, 48 116" fill="none" stroke="' + renk + '" stroke-width="9" stroke-linecap="round"/><path d="M180 84 C 200 88, 206 112, 194 122 C 184 130, 174 118, 182 110 C 188 104, 196 110, 192 116" fill="none" stroke="' + renk + '" stroke-width="9" stroke-linecap="round"/>' + kahkul;
    if (tur === 'kuyruk') return arka ? '<path d="M176 40 C 212 50, 218 112, 202 152 C 196 166, 184 162, 187 148 C 198 118, 194 74, 172 58 Z" fill="' + renk + '" stroke="' + CIZGI + '" stroke-width="2" stroke-linejoin="round"/>' : kahkul + '<circle cx="178" cy="48" r="7" fill="#FF9DB4" stroke="' + CIZGI + '" stroke-width="2"/>';
    if (tur === 'orgu') return arka ? '<path d="M56 116 C 40 140, 40 178, 54 208" fill="none" stroke="' + renk + '" stroke-width="17" stroke-linecap="round"/><path d="M50 132 l 10 6 M44 150 l 12 6 M42 168 l 12 6 M44 186 l 12 6" stroke="' + CIZGI + '" stroke-width="2" stroke-linecap="round"/><circle cx="56" cy="210" r="6" fill="#FF9DB4" stroke="' + CIZGI + '" stroke-width="2"/>' : kahkul;
    return '';
  }
  function bul(kat, id) { return (DOLAP[kat].esyalar.find(e => e.id === id)) || null; }
  function secenek(kat, id) { return GUZELLIK[kat].secenek.find(s => s.id === id) || GUZELLIK[kat].secenek[0]; }
  function gorunumGuncelle() {
    if (!ui.kedi) return;
    const g = d.dolap.giyili, s = d.guzellik;
    const koy = (sinif, html) => { const el = ui.kedi.querySelector('.' + sinif); if (el) el.innerHTML = html || ''; };
    const f = bul('fiyonk', g.fiyonk), gz = bul('gozluk', g.gozluk), sp = bul('sapka', g.sapka), el = bul('elbise', g.elbise), ko = bul('kolye', g.kolye);
    koy('angela-fiyonk', f ? fiyonkSvg(f) : '');
    koy('angela-gozluk', gz ? gozlukSvg(gz) : '');
    koy('angela-sapka', sp ? sapkaSvg(sp) : '');
    koy('angela-elbise', el ? elbiseSvg(el) : '');
    koy('angela-kolye', ko ? kolyeSvg(ko) : '');
    const sacRenk = (secenek('sacRenk', s.sacRenk) || {}).renk || '#F6D67A';
    koy('angela-sac-arka', sacSvg(s.sac, sacRenk, true));
    koy('angela-sac-on', sacSvg(s.sac, sacRenk, false));
    const far = secenek('far', s.far), allik = secenek('allik', s.allik), ruj = secenek('ruj', s.ruj);
    ui.kedi.style.setProperty('--far-renk', far.renk || 'transparent');
    ui.kedi.style.setProperty('--far-op', far.renk ? '.75' : '0');
    ui.kedi.style.setProperty('--allik-renk', allik.renk || 'var(--angela-yanak)');
    ui.kedi.style.setProperty('--allik-op', allik.op != null ? String(allik.op) : '.5');
    ui.kedi.style.setProperty('--ruj-renk', ruj.renk || 'transparent');
    ui.kedi.style.setProperty('--ruj-op', ruj.renk ? (ruj.id === 'parlak' ? '.6' : '.9') : '0');
    kirGuncelle();
  }
  function kirGuncelle() { if (ui.kedi) ui.kedi.style.setProperty('--kir', d.temizlik < 40 ? String(sinirla((40 - d.temizlik) / 40, .2, .85)) : '0'); }

  /* ------------------------------------------------------------ arayüz kurulumu */
  function kur(el) {
    el.innerHTML = '';
    const barlar = ctx.el('div.angela-barlar', { role: 'group', 'aria-label': 'İhtiyaçlar' });
    BARLAR.forEach(b => {
      const bar = ctx.el('div.bar.angela-bar', { data: { bar: b.k }, role: 'meter', 'aria-label': b.ad, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, [
        ctx.el('span.bar-ikon', { 'aria-hidden': 'true' }, b.ikon), ctx.el('div.bar-yol', [ctx.el('div.bar-dolu')]), ctx.el('span.bar-yuzde', '0')
      ]);
      bar.style.setProperty('--bar-renk', b.renk);
      barlar.appendChild(bar);
    });
    ui.tuvaletUyari = ctx.el('span.rozet.angela-tuvalet-uyari', { hidden: true, title: 'Tuvalete gitmesi lazım' }, '🚽 !');
    ui.yildiz = ctx.el('span.rozet.angela-yildiz', { 'aria-label': 'Yıldızlar' }, '⭐ 0');
    ui.seviye = ctx.el('span.rozet.goz', { 'aria-label': 'Seviye' }, 'Sv 1');
    ui.xp = ctx.el('div.angela-xp', { role: 'progressbar', 'aria-label': 'Seviye ilerlemesi', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, [ctx.el('div.angela-xp-dolu')]);
    const cuzdan = ctx.el('div.angela-cuzdan', [ui.yildiz, ui.seviye, ui.xp, ui.tuvaletUyari]);
    const ust = ctx.el('div.angela-ust', [barlar, cuzdan]);

    ui.kedi = ctx.svg(kediSvg());
    ui.kediKap = ctx.el('div.angela-kedi-kap', { 'data-pati': '' }, [ui.kedi]);
    ui.balon = ctx.el('div.balon.angela-balon', { role: 'status', 'aria-live': 'polite' });
    ui.kopukler = ctx.el('div.angela-kopuk-katman', { 'aria-hidden': 'true' });
    ui.lokmalar = ctx.el('div.angela-lokma-katman', { 'aria-hidden': 'true' });
    ui.oyunKatman = ctx.el('div.angela-oyun-katman', { hidden: true });
    ui.hud = ctx.el('div.angela-hud', { hidden: true, role: 'status' });
    ui.banyoBar = ctx.el('div.angela-banyo-bar', { hidden: true }, [ctx.el('span', '🫧 Köpük'), ctx.el('div.angela-banyo-yol', [ctx.el('div.angela-banyo-dolu')]), ctx.el('span.angela-banyo-ipucu', 'Üstünde parmağını gezdir')]);
    ui.ipucu = ctx.el('div.angela-ipucu', { 'aria-hidden': 'true' }, 'Okşa, dürt, gıdıkla · mikrofona basılı tut ve konuş');
    ui.mik = ctx.el('button.angela-mik', { type: 'button', 'aria-label': 'Basılı tut ve konuş', html: MIK_IKON });
    ui.mikEtiket = ctx.el('span.angela-mik-etiket', 'Basılı tut, konuş');
    ui.yazDugme = ctx.el('button.angela-yaz', { type: 'button', 'aria-label': 'Yazarak konuş' }, '✍️');
    const mikKap = ctx.el('div.angela-mik-kap', [ui.mik, ui.mikEtiket, ui.yazDugme]);
    const oda = ctx.el('div.angela-oda', { 'aria-hidden': 'true' }, [
      ctx.el('div.angela-pencere', [ctx.el('div.angela-gok', [ctx.el('i.angela-bulut'), ctx.el('i.angela-bulut.iki')]), ctx.el('div.angela-cerceve'), ctx.el('div.angela-perde.sol'), ctx.el('div.angela-perde.sag')]),
      ctx.el('div.angela-raf', [ctx.el('span', '🪞'), ctx.el('span', '🧸'), ctx.el('span', '🌷')]),
      ctx.el('div.angela-lamba'),
      ctx.el('div.angela-zemin'),
      ctx.el('div.angela-hali')
    ]);
    ui.sahne = ctx.el('div.angela-sahne', { 'data-mod': 'normal' }, [
      oda,
      ctx.el('div.angela-kuvet-arka', { 'aria-hidden': 'true' }),
      ui.kediKap,
      ctx.el('div.angela-kuvet-on', { 'aria-hidden': 'true' }, [ctx.el('i.angela-musluk')]),
      ui.kopukler,
      ctx.el('div.angela-yagmur', { 'aria-hidden': 'true' }),
      ctx.el('div.angela-perde-tuvalet', { 'aria-hidden': 'true' }, [ctx.el('span', '🚽'), ctx.el('small', 'Mahremiyet lütfen')]),
      ctx.el('div.angela-karanlik', { 'aria-hidden': 'true' }),
      ctx.el('div.angela-zzz', { 'aria-hidden': 'true' }, [ctx.el('span', 'z'), ctx.el('span', 'z'), ctx.el('span', 'z')]),
      ui.lokmalar, ui.oyunKatman,
      ctx.el('div.angela-balon-yer', [ui.balon]),
      ui.hud, ui.banyoBar, ui.ipucu, mikKap
    ]);

    ui.sekmeler = ctx.el('div.cipler.angela-sekmeler', { role: 'tablist', 'aria-label': 'Köşeler' });
    [['dolap', '👗 Dolap'], ['guzellik', '💄 Güzellik'], ['oyun', '🎮 Oyunlar'], ['profil', '🐱 ' + ad()]].forEach(([id, ad2]) => {
      const b = ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(id === sekme), data: { sekme: id }, onclick: () => { ctx.ses.tik(); sekmeAc(id); } }, ad2);
      ui.sekmeler.appendChild(b);
    });
    ui.panel = ctx.el('div.icerik.angela-panel', { role: 'tabpanel' });
    el.append(ust, ui.sahne, ui.sekmeler, ui.panel);
  }
  function barGuncelle() {
    BARLAR.forEach(b => {
      const el = kok.querySelector('.angela-bar[data-bar="' + b.k + '"]'); if (!el) return;
      const v = Math.round(sinirla(d[b.k], 0, 100));
      el.querySelector('.bar-dolu').style.width = v + '%'; el.querySelector('.bar-yuzde').textContent = v; el.setAttribute('aria-valuenow', v);
      el.classList.toggle('dusuk', v < 30);
    });
    ui.tuvaletUyari.hidden = !(d.tuvalet >= 70 && !d.uyuyor);
    kirGuncelle();
  }
  function cuzdanGuncelle() {
    ui.yildiz.textContent = '⭐ ' + d.yildiz; ui.seviye.textContent = 'Sv ' + d.seviye;
    const alt = 60 * (d.seviye - 1) * (d.seviye - 1), ust = 60 * d.seviye * d.seviye, y = Math.round(sinirla((d.xp - alt) / (ust - alt) * 100, 0, 100));
    ui.xp.firstChild.style.width = y + '%'; ui.xp.setAttribute('aria-valuenow', y); ui.xp.title = 'Seviye ' + (d.seviye + 1) + ' için %' + y;
    const t = ui.sekmeler && ui.sekmeler.querySelector('[data-sekme="profil"]'); if (t) t.textContent = '🐱 ' + ad();
  }

  /* ------------------------------------------------------------ ifade ve söz */
  function sonra(fn, ms) { const t = setTimeout(() => { if (ctx) fn(); }, ms); (T.liste = T.liste || []).push(t); return t; }
  function hepsiniIptal() { (T.liste || []).forEach(clearTimeout); T.liste = []; }
  function ifade(ad2, ms) {
    if (!ui.kedi) return; clearTimeout(T.ifade);
    ui.kedi.dataset.ifade = ad2;
    if (ms) T.ifade = setTimeout(() => { if (ui.kedi) ui.kedi.dataset.ifade = d.uyuyor ? 'uyku' : 'normal'; }, ms);
  }
  function agiz(ad2, ms) {
    if (!ui.kedi) return; clearTimeout(T.agiz);
    ui.kedi.dataset.agiz = ad2;
    if (ms) T.agiz = setTimeout(() => { if (ui.kedi) ui.kedi.dataset.agiz = 'kapali'; }, ms);
  }
  function soyle(metin, ms) {
    if (!ui.balon) return; clearTimeout(T.soz);
    ui.balon.textContent = metin; ui.balon.classList.add('goster');
    T.soz = setTimeout(() => { if (ui.balon) ui.balon.classList.remove('goster'); }, ms || 2600);
  }
  function bakis(x, y, ms) {
    if (!ui.kedi) return; clearTimeout(T.bakis);
    ui.kedi.style.setProperty('--bx', sinirla(x, -6, 6).toFixed(1) + 'px'); ui.kedi.style.setProperty('--by', sinirla(y, -5, 6).toFixed(1) + 'px');
    if (ms) T.bakis = setTimeout(() => bakis(0, 0), ms);
  }
  function zipla() { if (!ui.kedi || ctx.azHareket) return; ui.kedi.classList.remove('zipla'); void ui.kedi.getBoundingClientRect(); ui.kedi.classList.add('zipla'); sonra(() => ui.kedi && ui.kedi.classList.remove('zipla'), 650); }
  function kulakOynat() { if (!ui.kedi) return; const k = ui.kedi.querySelector(Math.random() < .5 ? '.angela-kulak-sol' : '.angela-kulak-sag'); if (!k) return; k.classList.add('oyna'); sonra(() => k.classList.remove('oyna'), 600); }
  function svgNokta(x, y) {
    const r = ui.kedi.getBoundingClientRect(), s = ui.sahne.getBoundingClientRect();
    return { x: r.left - s.left + x / 240 * r.width, y: r.top - s.top + y / 300 * r.height, cx: r.left + x / 240 * r.width, cy: r.top + y / 300 * r.height };
  }
  function mesgul(sessiz) {
    if (mod === 'normal' && !d.uyuyor) return false;
    if (!sessiz) {
      if (d.uyuyor) { ctx.toast('Şşş, uyuyor. Önce ışığı aç 💡'); }
      else if (mod === 'banyo') ctx.toast('Banyo bitince 🫧');
      else if (mod === 'oyun') ctx.toast('Oyun bitince 🦋');
      else if (mod === 'dans') ctx.toast('Dans bitince 💃');
      else ctx.toast(rastgele(SOZ.mesgul));
    }
    return true;
  }

  /* ------------------------------------------------------------ döngüler: kırpma, boş duruş, ihtiyaçlar */
  function kirpDongu() {
    clearTimeout(T.kirp);
    T.kirp = setTimeout(() => {
      if (!ui.kedi) return;
      if (!d.uyuyor && (ui.kedi.dataset.ifade === 'normal' || ui.kedi.dataset.ifade === 'dinliyor' || ui.kedi.dataset.ifade === 'konusuyor') && !ctx.azHareket) {
        ui.kedi.querySelectorAll('.angela-kapak').forEach(k => { k.classList.remove('kirp'); void k.getBoundingClientRect(); k.classList.add('kirp'); });
      }
      kirpDongu();
    }, 2400 + Math.random() * 3600);
  }
  function bosDongu() {
    clearTimeout(T.bos);
    T.bos = setTimeout(() => {
      if (!ui.kedi) return;
      if (mod === 'normal' && !d.uyuyor && !basili) {
        const z = Math.random();
        if (z < .3) kulakOynat();
        else if (z < .6) bakis(Math.random() < .5 ? -5 : 5, Math.random() * 3 - 1, 1400);
        else if (z < .7 && d.enerji < 35) { agiz('acik', 900); soyle(rastgele(SOZ.esne), 1800); }
        else if (z < .78 && !ctx.azHareket) zipla();
      }
      bosDongu();
    }, 5000 + Math.random() * 6000);
  }
  function sozDongu() {
    clearTimeout(T.sozDongu);
    T.sozDongu = setTimeout(() => {
      if (!ui.kedi) return;
      if (mod === 'normal' && !d.uyuyor && !basili) soyle(ihtiyacSozu(), 3000);
      sozDongu();
    }, 22000 + Math.random() * 18000);
  }
  function ihtiyacSozu() {
    if (d.tuvalet >= 80) return rastgele(SOZ.tuvalet);
    if (d.tokluk < 30) return rastgele(SOZ.ac);
    if (d.enerji < 25) return rastgele(SOZ.yorgun);
    if (d.temizlik < 30) return rastgele(SOZ.kirli);
    if (d.mutluluk < 30) return rastgele(SOZ.mutsuz);
    return rastgele(SOZ.bos);
  }
  let sonTik = 0, sonKayitZ = 0;
  function dongu() {
    const simdi = Date.now(), dt = Math.min(simdi - sonTik, 120000); sonTik = simdi;
    if (dt <= 0) return;
    azalt(dt, true);
    if (d.uyuyor && d.enerji >= 100 && simdi - d.uykuBas > 30000 && document.visibilityState === 'visible') uyan(false);
    if (simdi - sonKayitZ > 10000) { sonKayitZ = simdi; barGuncelle(); kaydet(); }
  }
  function azalt(ms, canli) {
    const s = ms / SAAT;
    if (d.uyuyor) { d.enerji = sinirla(d.enerji + UYKU_ENERJI * s, 0, 100); d.tokluk = sinirla(d.tokluk - AZALMA.tokluk * .4 * s, canli ? 0 : TABAN, 100); }
    else { d.tokluk = sinirla(d.tokluk - AZALMA.tokluk * s, canli ? 0 : TABAN, 100); d.enerji = sinirla(d.enerji - AZALMA.enerji * s, canli ? 0 : TABAN, 100); }
    d.mutluluk = sinirla(d.mutluluk - AZALMA.mutluluk * s, canli ? 0 : TABAN, 100);
    d.temizlik = sinirla(d.temizlik - AZALMA.temizlik * s, canli ? 0 : TABAN, 100);
    d.tuvalet = sinirla(d.tuvalet + 3 * s, 0, 100);
  }
  function gorunurluk() {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') { kaydet(); if (basili) { basili = null; oksamaBitir(); } if (mikBasili) kayitBitir(); if (oyun) kelebekBitir(true); if (mod === 'dans') dansBitir(true); }
    else { sonTik = Date.now(); }
  }

  /* ------------------------------------------------------------ dokunma: okşama, dürtme, gıdıklama */
  function kediBasildi(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const hedef = e.target && e.target.closest ? e.target.closest('[data-bolge]') : null;
    const bolge = hedef ? hedef.dataset.bolge : 'govde';
    try { ui.kedi.setPointerCapture(e.pointerId); } catch (err) {}
    basili = { id: e.pointerId, bolge, t0: Date.now(), sx: e.clientX, sy: e.clientY, hareket: 0, oksama: false, say: 0 };
    ctx.ses.pit();
    if (!d.ipucuGoruldu) { d.ipucuGoruldu = true; ui.ipucu.classList.add('gitti'); }
    if (mod === 'banyo') { ov(e); return; }
    if (d.uyuyor) { uykudaDokun(e); return; }
    if (mod !== 'normal') return;
    bakisNoktaya(e.clientX, e.clientY);
    e.preventDefault();
  }
  function kediHareket(e) {
    if (!basili || e.pointerId !== basili.id) return;
    basili.hareket += Math.abs(e.clientX - basili.sx) + Math.abs(e.clientY - basili.sy); basili.sx = e.clientX; basili.sy = e.clientY;
    if (mod === 'banyo') { ov(e); return; }
    if (d.uyuyor) { if (basili.hareket > 40 && !basili.oksama) { basili.oksama = true; ctx.ses.mirrBaslat(.4); mirrAcik = true; } return; }
    if (mod !== 'normal') return;
    if (!basili.oksama && basili.hareket > 22 && (basili.bolge === 'kafa' || basili.bolge === 'karin' || basili.bolge === 'govde' || basili.bolge === 'burun')) { basili.oksama = true; oksamaBasla(basili.bolge); }
    if (basili.oksama) {
      basili.say++;
      if (basili.say % 9 === 0) { ctx.efekt.kalp(e.clientX, e.clientY, 2); d.mutluluk = sinirla(d.mutluluk + .6, 0, 100); }
      if (basili.say % 30 === 0) barGuncelle();
    }
  }
  function kediBirakildi(e) {
    if (!basili || e.pointerId !== basili.id) return;
    const b = basili; basili = null;
    try { ui.kedi.releasePointerCapture(e.pointerId); } catch (err) {}
    if (mod === 'banyo') { if (mirrAcik) { ctx.ses.mirrDur(); mirrAcik = false; } return; }
    if (b.oksama) { oksamaBitir(); return; }
    if (d.uyuyor || mod !== 'normal') return;
    if (Date.now() - b.t0 < 450 && b.hareket < 16) dokunma(b.bolge, e);
    bakis(0, 0);
  }
  function bakisNoktaya(cx, cy) {
    const m = svgNokta(120, 106);
    bakis((cx - m.cx) / 30, (cy - m.cy) / 30);
  }
  function oksamaBasla(bolge) {
    ifade('mutlu'); ctx.ses.mirrBaslat(bolge === 'kafa' ? .9 : .6); mirrAcik = true;
    if (Math.random() < .5) soyle(rastgele(bolge === 'karin' ? SOZ.karin : SOZ.kafa), 2200);
  }
  function oksamaBitir() {
    if (mirrAcik) { ctx.ses.mirrDur(); mirrAcik = false; }
    if (!ui.kedi) return;
    sonra(() => ifade(d.uyuyor ? 'uyku' : 'normal'), 500);
    if (d.uyuyor) return;
    d.sayac.oksama++; d.mutluluk = sinirla(d.mutluluk + 2, 0, 100);
    if (Date.now() - sonOksamaOdul > 8000) { sonOksamaOdul = Date.now(); odul(2, 1); }
    barGuncelle(); rozetKontrol(); kaydet();
  }
  function dokunma(bolge, e) {
    const simdi = Date.now();
    tiklamalar = tiklamalar.filter(t => simdi - t < 900); tiklamalar.push(simdi);
    if ((bolge === 'karin' || bolge === 'govde') && tiklamalar.length >= 3) { tiklamalar = []; gidikla(e); return; }
    switch (bolge) {
      case 'kafa':
        ctx.efekt.kalp(e.clientX, e.clientY, 3); kulakOynat(); ifade('mutlu', 900); soyle(rastgele(SOZ.kafa), 2200); ctx.ses.mirrKisa(700);
        d.mutluluk = sinirla(d.mutluluk + 1, 0, 100); break;
      case 'burun':
        ctx.ses.pop(); ifade('sasirma', 700); agiz('acik', 500); soyle(rastgele(SOZ.burun), 2200); zipla(); break;
      case 'karin': case 'govde':
        ctx.ses.mirrKisa(600); ifade('mutlu', 800); soyle(rastgele(SOZ.karin), 2200); ctx.efekt.kalp(e.clientX, e.clientY, 2); break;
      case 'ayak': {
        ctx.ses.hop(); const a = ui.kedi.querySelector(e.clientX < svgNokta(120, 0).cx ? '.angela-ayak-sol' : '.angela-ayak-sag'); if (a) { a.classList.add('kaldir'); sonra(() => a.classList.remove('kaldir'), 500); }
        ifade('sasirma', 600); soyle(rastgele(SOZ.ayak), 2200); break; }
      case 'kuyruk': {
        ctx.ses.miyav(); const k = ui.kedi.querySelector('.angela-kuyruk'); if (k) { k.classList.add('savur'); sonra(() => k.classList.remove('savur'), 700); }
        ifade('sasirma', 700); agiz('acik', 300); soyle(rastgele(SOZ.kuyruk), 2200); break; }
    }
    d.mutluluk = sinirla(d.mutluluk + .5, 0, 100);
  }
  function gidikla(e) {
    ifade('gidik', 1500); agiz('acik', 1500);
    [0, 120, 240, 360, 480].forEach(ms => sonra(() => ctx.ses.hop(), ms));
    ctx.efekt.kalp(e.clientX, e.clientY, 5); ctx.efekt.yildiz(e.clientX, e.clientY, 3);
    soyle(rastgele(SOZ.gidik), 2000);
    d.mutluluk = sinirla(d.mutluluk + 4, 0, 100); d.sayac.oksama++;
    if (Date.now() - sonOksamaOdul > 8000) { sonOksamaOdul = Date.now(); odul(3, 1); }
    barGuncelle(); kaydet();
  }
  function uykudaDokun() {
    ctx.ses.mirrKisa(700); soyle(rastgele(SOZ.uykudaDokun), 1600);
    const z = ui.sahne.querySelector('.angela-zzz'); if (z) { z.classList.add('sallan'); sonra(() => z.classList.remove('sallan'), 600); }
  }

  /* ------------------------------------------------------------ besleme ve içecek */
  function tepsiAc(liste, baslik, icecek) {
    if (mesgul()) return;
    const izgara = ctx.el('div.angela-tepsi');
    liste.forEach(y => {
      izgara.appendChild(ctx.el('button.angela-tepsi-esya', { type: 'button', onclick: () => { ctx.sheetKapat(); sonra(() => ver(y), 200); } }, [
        ctx.el('span.angela-tepsi-emoji', { 'aria-hidden': 'true' }, y.emoji), ctx.el('span.angela-tepsi-ad', y.ad),
        ctx.el('span.angela-tepsi-etki', icecek ? '+' + y.enerji + ' ⚡' : '+' + y.tokluk + ' 🍓')
      ]));
    });
    ctx.sheet(ctx.el('div.dikey', [ctx.el('p.sessiz', icecek ? 'Pipeti uzat, gerisini ' + ad() + ' halleder.' : ad() + ' bugün ne yesin?'), izgara]), { baslik });
  }
  function ver(y) {
    if (mod !== 'normal' || d.uyuyor) return;
    if (d.tokluk >= 96 && y.tokluk >= 8) { soyle(rastgele(SOZ.tok)); ctx.ses.uf(); return; }
    mod = 'yemek';
    const bas = { x: ui.sahne.clientWidth / 2, y: ui.sahne.clientHeight - 30 }, hedef = svgNokta(120, 146);
    const lokma = ctx.el('span.angela-lokma', { 'aria-hidden': 'true', text: y.emoji });
    lokma.style.setProperty('--x', bas.x + 'px'); lokma.style.setProperty('--y', bas.y + 'px');
    ui.lokmalar.appendChild(lokma);
    bakis(0, 5); ifade('sasirma');
    requestAnimationFrame(() => requestAnimationFrame(() => { lokma.style.setProperty('--x', hedef.x + 'px'); lokma.style.setProperty('--y', hedef.y + 'px'); }));
    sonra(() => {
      lokma.classList.add('kucul'); agiz(y.icecek ? 'acik' : 'cigne');
      if (y.icecek) [0, 220, 440].forEach(ms => sonra(() => ctx.ses.blop(), ms)); else [0, 380].forEach(ms => sonra(() => ctx.ses.cigne(), ms));
    }, 640);
    sonra(() => {
      lokma.remove(); ctx.ses.yut(); agiz('kapali'); ifade('mutlu', 1500); bakis(0, 0);
      d.tokluk = sinirla(d.tokluk + y.tokluk, 0, 100); d.mutluluk = sinirla(d.mutluluk + (y.mutluluk || 0), 0, 100); d.enerji = sinirla(d.enerji + (y.enerji || 0), 0, 100);
      d.tuvalet = sinirla(d.tuvalet + (y.icecek ? 12 : 15), 0, 100);
      d.sayac[y.icecek ? 'icir' : 'besle']++;
      const m = svgNokta(120, 120); ctx.efekt.kalp(m.cx, m.cy, 3);
      mod = 'normal'; odul(y.icecek ? 4 : 6, y.icecek ? 1 : 2);
      soyle(rastgele(y.soz || (y.icecek ? SOZ.icti : SOZ.yedi)));
      barGuncelle(); rozetKontrol(); kaydet();
    }, 1560);
  }

  /* ------------------------------------------------------------ banyo */
  function banyoBaslat() {
    if (mesgul()) return;
    mod = 'banyo'; kopuk = 0; kopukTam = false; ui.sahne.dataset.mod = 'banyo'; ui.banyoBar.hidden = false; banyoBarGuncelle();
    ctx.ses.su(); soyle(rastgele(SOZ.banyoBasla), 3000); ifade('mutlu', 1400);
    ctx.altbar([
      { id: 'durula', ad: 'Durula', ikon: '🚿', birincil: true, tikla: durula },
      { id: 'cik', ad: 'Çık', ikon: '🚪', tikla: () => { banyoBitir(); soyle('Kuruladım kendimi, tamam.', 2000); } }
    ]);
  }
  function ov(e) {
    const simdi = Date.now(); if (simdi - sonOv < 55) return; sonOv = simdi;
    kopuk = sinirla(kopuk + 1.4, 0, 100);
    const s = ui.sahne.getBoundingClientRect();
    kopukEkle(e.clientX - s.left, e.clientY - s.top);
    if (Math.random() < .25) ctx.ses.kopuk();
    if (Math.random() < .12) ctx.efekt.kopuk(e.clientX, e.clientY, 3);
    if (!mirrAcik) { ctx.ses.mirrBaslat(.5); mirrAcik = true; ifade('mutlu'); }
    banyoBarGuncelle();
    if (kopuk >= 100 && !kopukTam) { kopukTam = true; soyle('Köpük tamam! Şimdi durula 🚿', 2600); ctx.ses.parilti(); }
  }
  function kopukEkle(x, y) {
    if (ctx.azHareket || ui.kopukler.childElementCount > 46) return;
    const k = ctx.el('i.angela-kopuk');
    k.style.setProperty('--x', (x + Math.random() * 30 - 15) + 'px'); k.style.setProperty('--y', (y + Math.random() * 20 - 10) + 'px'); k.style.setProperty('--boy', (12 + Math.random() * 22) + 'px');
    ui.kopukler.appendChild(k); sonra(() => k.remove(), 2600);
  }
  function banyoBarGuncelle() { const f = ui.banyoBar.querySelector('.angela-banyo-dolu'); if (f) f.style.width = Math.round(kopuk) + '%'; }
  function durula() {
    if (mod !== 'banyo') return;
    if (kopuk < 35) { soyle('Daha köpük yok ki! Beni biraz daha ov.', 2400); ctx.ses.uf(); return; }
    if (mirrAcik) { ctx.ses.mirrDur(); mirrAcik = false; }
    ui.sahne.classList.add('durulama'); ctx.ses.su(); sonra(() => ctx.ses.su(), 420); ifade('mutlu');
    sonra(() => {
      ui.sahne.classList.remove('durulama');
      d.temizlik = sinirla(d.temizlik + 30 + Math.round(kopuk * .7), 0, 100); d.mutluluk = sinirla(d.mutluluk + 8, 0, 100); d.sayac.banyo++;
      banyoBitir(); ifade('mutlu', 1600); ctx.ses.isilti();
      const m = svgNokta(120, 100); ctx.efekt.yildiz(m.cx, m.cy, 8);
      odul(12, 3); soyle(rastgele(SOZ.banyoBitti)); rozetKontrol();
    }, 1300);
  }
  function banyoBitir() {
    mod = 'normal'; ui.sahne.dataset.mod = 'normal'; ui.banyoBar.hidden = true; ui.kopukler.innerHTML = '';
    if (mirrAcik) { ctx.ses.mirrDur(); mirrAcik = false; }
    altbarNormal(); barGuncelle(); kaydet();
  }

  /* ------------------------------------------------------------ tuvalet, uyku */
  function tuvalet() {
    if (mesgul()) return;
    if (d.tuvalet < 15) { soyle(rastgele(SOZ.tuvaletYok), 2200); return; }
    mod = 'tuvalet'; ui.sahne.dataset.mod = 'tuvalet'; soyle('Mahremiyet lütfen!', 1800); ctx.ses.pop();
    sonra(() => ctx.ses.su(), 1500);
    sonra(() => {
      d.tuvalet = 0; d.mutluluk = sinirla(d.mutluluk + 5, 0, 100); d.sayac.tuvalet++;
      ui.sahne.dataset.mod = 'normal'; mod = 'normal'; ctx.ses.pop(); ifade('mutlu', 1200);
      soyle(rastgele(SOZ.tuvaletBitti)); odul(4, 1); barGuncelle(); kaydet();
    }, 2700);
  }
  function uykuDegistir() {
    if (mod !== 'normal') { mesgul(); return; }
    if (d.uyuyor) uyan(true); else uyut();
  }
  function uyut() {
    if (basili) { basili = null; oksamaBitir(); }
    d.uyuyor = true; d.uykuBas = Date.now(); ui.sahne.dataset.uyku = '1'; ifade('uyku'); agiz('kapali'); bakis(0, 0);
    ctx.ses.pop(); soyle(rastgele(SOZ.uyudu), 2200); d.sayac.uyku++;
    altbarNormal(); barGuncelle(); rozetKontrol(); kaydet();
  }
  function uyan(elle) {
    d.uyuyor = false; delete ui.sahne.dataset.uyku; ifade('normal');
    soyle(rastgele(SOZ.uyandi), 2600); ctx.ses.parilti(); zipla(); kulakOynat();
    if (elle) odul(8, 2); else odul(4, 1);
    altbarNormal(); barGuncelle(); kaydet();
  }

  /* ------------------------------------------------------------ mikrofon: basılı tut, konuş → tiz tekrar */
  function mikDestek() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); }
  function mikBasildi(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (mikBasili) return;
    if (mesgul()) return;
    mikBasili = true;
    try { ui.mik.setPointerCapture(e.pointerId); } catch (err) {}
    if (!mikDestek() || d.mikYok) { mikBasili = false; yazarakKonus(); return; }
    kayitBasla();
  }
  function mikBirakildi(e) {
    if (!mikBasili) return;
    mikBasili = false;
    try { ui.mik.releasePointerCapture(e.pointerId); } catch (err) {}
    kayitBitir();
  }
  async function kayitBasla() {
    mod = 'kayit'; ui.mik.classList.add('bekliyor');
    let yeniAkis = null;
    try { yeniAkis = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (err) {
      ui.mik.classList.remove('bekliyor'); mod = 'normal';
      if (!ctx) return;
      d.mikYok = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      soyle('Mikrofon kapalıysa da seni dinliyorum 🐱', 2600);
      mikBasili = false; yazarakKonus(); return;
    }
    if (!ctx) { yeniAkis.getTracks().forEach(t => t.stop()); return; }
    akis = yeniAkis;
    ui.mik.classList.remove('bekliyor');
    if (!mikBasili) { akisKapat(); mod = 'normal'; ctx.toast('Mikrofon hazır. Şimdi basılı tutup konuş 🎤'); return; }
    const tip = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (err) { return false; } }) || '';
    try { kayitci = tip ? new MediaRecorder(akis, { mimeType: tip }) : new MediaRecorder(akis); }
    catch (err) { akisKapat(); mod = 'normal'; mikBasili = false; yazarakKonus(); return; }
    parcalar = [];
    kayitci.ondataavailable = ev => { if (ev.data && ev.data.size) parcalar.push(ev.data); };
    kayitci.onstop = () => {
      const blob = new Blob(parcalar, { type: kayitci && kayitci.mimeType || tip || 'audio/webm' });
      kayitci = null; akisKapat();
      if (ctx) tekrarEt(blob);
    };
    kayitci.onerror = () => { kayitci = null; akisKapat(); mod = 'normal'; ui.mik.classList.remove('kayit'); if (ctx) soyle('Kayıt olmadı, bir daha dener misin?', 2200); };
    try { kayitci.start(); } catch (err) { kayitci = null; akisKapat(); mod = 'normal'; mikBasili = false; yazarakKonus(); return; }
    kayitBas = Date.now();
    ui.mik.classList.add('kayit'); ui.mikEtiket.textContent = 'Dinliyor…';
    ctx.ses.tik(); ifade('dinliyor'); bakis(0, 4); soyle(rastgele(SOZ.dinliyor), 12000);
    clearTimeout(T.kayitMaks); T.kayitMaks = setTimeout(() => { mikBasili = false; kayitBitir(); }, 12000);
  }
  function kayitBitir() {
    clearTimeout(T.kayitMaks);
    ui.mik.classList.remove('kayit', 'bekliyor'); ui.mikEtiket.textContent = 'Basılı tut, konuş';
    if (kayitci && kayitci.state === 'recording') { try { kayitci.stop(); } catch (err) { kayitci = null; akisKapat(); mod = 'normal'; } }
    else if (!kayitci && mod === 'kayit' && !akis) { /* izin bekleniyor; kayitBasla kendi toparlar */ }
  }
  function akisKapat() { if (akis) { try { akis.getTracks().forEach(t => t.stop()); } catch (err) {} akis = null; } }
  async function tekrarEt(blob) {
    const sure = Date.now() - kayitBas;
    ui.mik.classList.remove('kayit');
    if (sure < 400 || !blob || blob.size < 600) { mod = 'normal'; ifade('normal', 0); bakis(0, 0); soyle(rastgele(SOZ.kisa), 2200); ctx.ses.uf(); return; }
    sonKayit = blob; mod = 'konusma';
    ifade('konusuyor'); agiz('konus'); bakis(0, 0);
    ui.balon.classList.remove('goster');
    let ok = false;
    try { ok = await ctx.ses.tizCal(blob, 1.65); } catch (err) { ok = false; }
    if (!ctx) return;
    agiz('kapali'); ifade('normal'); mod = 'normal';
    if (!ok) { soyle(ctx.ses.acik ? 'Sesini duydum ama tekrar edemedim; bir daha?' : 'Sesim kapalı ama seni duydum 🤫', 2600); return; }
    d.sayac.konus++; odul(5, 2); zipla();
    soyle(rastgele(SOZ.konustu), 2600); rozetKontrol(); kaydet();
  }
  function tekrarCal() {
    if (!sonKayit || mesgul()) return;
    mod = 'konusma'; ifade('konusuyor'); agiz('konus');
    ctx.ses.tizCal(sonKayit, 1.65).catch(() => false).then(() => { if (!ctx) return; agiz('kapali'); ifade('normal'); mod = 'normal'; });
  }
  function yazarakKonus() {
    if (mod !== 'normal' || d.uyuyor) { mesgul(); return; }
    const girdi = ctx.el('input.girdi', { type: 'text', maxlength: '120', placeholder: 'Bana yaz, tekrar edeyim…', autocomplete: 'off', 'aria-label': 'Söylenecek cümle' });
    const gonder = () => {
      const m = girdi.value.trim(); if (!m) { girdi.focus(); return; }
      ctx.sheetKapat(); sonra(() => yaziyiSoyle(m), 220);
    };
    girdi.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); gonder(); } });
    const kutu = ctx.el('div.dikey', [
      ctx.el('p.sessiz', mikDestek() && !d.mikYok ? 'Mikrofon istemiyorsan buradan da konuşabiliriz.' : 'Mikrofon kapalıysa da seni dinliyorum. Buraya yaz, tiz sesimle tekrar edeyim.'),
      girdi,
      ctx.el('div.satir', [ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Vazgeç'), ctx.el('button.dugme', { type: 'button', onclick: gonder }, '🎤 Söyle')])
    ]);
    ctx.sheet(kutu, { baslik: 'Yazarak konuş' });
  }
  function yaziyiSoyle(metin) {
    if (!ctx) return;
    mod = 'konusma'; ifade('konusuyor'); agiz('konus');
    const bitir = () => { if (!ctx) return; agiz('kapali'); ifade('normal'); mod = 'normal'; d.sayac.konus++; odul(4, 1); rozetKontrol(); kaydet(); sonra(() => soyle(rastgele(SOZ.konustu), 2400), 600); };
    soyle('“' + metin + '”', 4000);
    let konustu = false;
    if ('speechSynthesis' in window && ctx.ses.acik) {
      try {
        const u = new SpeechSynthesisUtterance(metin); u.lang = 'tr-TR'; u.pitch = 1.8; u.rate = 1.05; u.volume = 1;
        const sesler = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
        const tr = sesler.find(v => /^tr/i.test(v.lang)); if (tr) u.voice = tr;
        u.onend = () => { clearTimeout(T.konusma); bitir(); }; u.onerror = () => { clearTimeout(T.konusma); bitir(); };
        speechSynthesis.cancel(); speechSynthesis.speak(u); konustu = true;
        T.konusma = setTimeout(bitir, 1500 + metin.length * 120);
      } catch (err) { konustu = false; }
    }
    if (!konustu) { [0, 180, 360, 540].forEach(ms => sonra(() => ctx.ses.minikMiyav(), ms)); T.konusma = setTimeout(bitir, 900 + Math.min(2400, metin.length * 60)); }
  }

  /* ------------------------------------------------------------ sekmeler: dolap, güzellik, oyunlar, profil */
  function sekmeAc(id) {
    sekme = id;
    ui.sekmeler.querySelectorAll('.cip').forEach(c => c.setAttribute('aria-selected', String(c.dataset.sekme === id)));
    if (hafiza && id !== 'oyun') hafiza = null;
    ui.panel.innerHTML = '';
    if (id === 'dolap') dolapCiz(); else if (id === 'guzellik') guzellikCiz(); else if (id === 'oyun') oyunlarCiz(); else profilCiz();
  }
  let dolapKat = 'fiyonk';
  function dolapCiz() {
    ui.panel.innerHTML = '';
    const kats = ctx.el('div.angela-kategoriler', { role: 'tablist', 'aria-label': 'Dolap bölümleri' });
    Object.keys(DOLAP).forEach(k => kats.appendChild(ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(k === dolapKat), onclick: () => { ctx.ses.tik(); dolapKat = k; dolapCiz(); } }, DOLAP[k].emoji + ' ' + DOLAP[k].ad)));
    const kat = DOLAP[dolapKat], izgara = ctx.el('div.angela-esyalar');
    izgara.appendChild(ctx.el('button.angela-esya.angela-esya-yok', { type: 'button', 'aria-pressed': String(!d.dolap.giyili[dolapKat]), onclick: () => giy(dolapKat, '') }, [ctx.el('span.angela-esya-renk', { 'aria-hidden': 'true' }, '✕'), ctx.el('span.angela-esya-ad', 'Hiçbiri')]));
    kat.esyalar.forEach(e => {
      const anahtar = dolapKat + ':' + e.id, sahip = d.dolap.sahip.includes(anahtar), giyili = d.dolap.giyili[dolapKat] === e.id;
      const renkEl = ctx.el('span.angela-esya-renk', { 'aria-hidden': 'true' }, kat.emoji);
      renkEl.style.setProperty('--renk', e.renk); if (e.inci) renkEl.classList.add('inci-yuzey');
      const b = ctx.el('button.angela-esya', { type: 'button', 'aria-pressed': String(giyili), onclick: () => { if (sahip) giy(dolapKat, giyili ? '' : e.id); else kilitAc(dolapKat, e); } }, [
        renkEl,
        ctx.el('span.angela-esya-ad', e.ad),
        ctx.el('span.angela-esya-durum', giyili ? 'Üstünde' : sahip ? 'Giy' : '⭐ ' + e.bedel)
      ]);
      if (!sahip) b.classList.add('kilitli');
      izgara.appendChild(b);
    });
    ui.panel.append(
      ctx.el('div.yama.angela-kart', [ctx.el('div.baslik.baslik-lg', ad() + '\'nın dolabı'), ctx.el('p.sessiz', 'Yıldızlarla yeni parçalar açılır; oyun, bakım ve sohbet yıldız kazandırır.'), kats, izgara]),
      ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { ctx.ses.tik(); dolapRastgele(); } }, '🎲 Rastgele kombin')
    );
  }
  function giy(kat, id) {
    d.dolap.giyili[kat] = id; gorunumGuncelle(); ctx.ses.tink(); dolapCiz();
    if (id) { d.sayac.giyim++; ifade('mutlu', 1200); soyle(rastgele(SOZ.giydi), 2400); const m = svgNokta(120, 90); ctx.efekt.yildiz(m.cx, m.cy, 4); d.mutluluk = sinirla(d.mutluluk + 2, 0, 100); odul(3, 0); }
    else soyle(rastgele(SOZ.cikardi), 2000);
    barGuncelle(); rozetKontrol(); kaydet();
  }
  function kilitAc(kat, e) {
    if (d.yildiz < e.bedel) { ctx.ses.uf(); soyle(rastgele(SOZ.yildizYok), 2600); ctx.toast('Bunun için ' + e.bedel + ' yıldız gerekiyor; sende ' + d.yildiz + ' var ⭐'); return; }
    d.yildiz -= e.bedel; d.dolap.sahip.push(kat + ':' + e.id); ctx.ses.parilti(); cuzdanGuncelle();
    ctx.toast(e.ad + ' dolapta! ✨'); giy(kat, e.id);
  }
  function dolapRastgele() {
    Object.keys(DOLAP).forEach(k => { const sahip = DOLAP[k].esyalar.filter(e => d.dolap.sahip.includes(k + ':' + e.id)); d.dolap.giyili[k] = sahip.length && Math.random() < .75 ? rastgele(sahip).id : ''; });
    gorunumGuncelle(); dolapCiz(); ifade('mutlu', 1200); soyle(rastgele(SOZ.giydi), 2400); ctx.ses.parilti(); kaydet();
  }
  function guzellikCiz() {
    ui.panel.innerHTML = '';
    const kart = ctx.el('div.yama.angela-kart', [ctx.el('div.baslik.baslik-lg', 'Güzellik köşesi'), ctx.el('p.sessiz', 'Göz farı, allık, ruj ve saç. Gözlerinin rengiyle oynayan bir şey seç.')]);
    Object.keys(GUZELLIK).forEach(k => {
      const g = GUZELLIK[k], secili = d.guzellik[k];
      const ornekler = ctx.el('div.ornekler', { role: 'group', 'aria-label': g.ad });
      g.secenek.forEach(s => {
        const b = ctx.el('button.ornek' + (s.id === secili ? '.secili' : '') + (s.renk ? '' : '.metin'), { type: 'button', 'aria-label': s.ad, 'aria-pressed': String(s.id === secili), onclick: () => guzellikSec(k, s.id) }, s.renk ? '' : (s.id === '' ? '✕' : s.ad.slice(0, 1)));
        if (s.renk) b.style.setProperty('--renk', s.renk);
        ornekler.appendChild(b);
      });
      kart.append(ctx.el('div.angela-guzellik-satir', [ctx.el('div.kalin', g.ad), ornekler]));
    });
    kart.append(ctx.el('div.satir.angela-guzellik-alt', [
      ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => { ctx.ses.tik(); d.guzellik = varsayilan().guzellik; gorunumGuncelle(); guzellikCiz(); soyle('Yüzümü yıkadım, doğal halim.', 2000); kaydet(); } }, 'Temizle'),
      ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => { ctx.ses.tik(); if (CD.bolumler && CD.bolumler.tirnak) ctx.ac('tirnak'); else ctx.toast('Tırnak salonu hazırlanıyor 💅'); } }, '💅 Tırnaklarımı yap')
    ]));
    ui.panel.append(kart);
  }
  function guzellikSec(k, id) {
    d.guzellik[k] = id; gorunumGuncelle(); guzellikCiz(); ctx.ses.tink();
    if (id) { d.sayac.makyaj++; ifade('mutlu', 1000); soyle(rastgele(SOZ.makyaj), 2200); d.mutluluk = sinirla(d.mutluluk + 1, 0, 100); odul(2, 0); }
    rozetKontrol(); kaydet();
  }
  function oyunlarCiz() {
    if (hafiza) { hafizaCiz(); return; }
    ui.panel.append(
      ctx.el('div.yama.angela-kart.angela-oyun-kart', [
        ctx.el('div.satir', [ctx.el('span.angela-oyun-ikon', { 'aria-hidden': 'true' }, '🦋'), ctx.el('div', [ctx.el('div.baslik.baslik-lg', 'Kelebek yakala'), ctx.el('p.sessiz', '25 saniye. Odada uçan kelebeklere dokun; her kelebek bir yıldız.'), ctx.el('span.rozet.gri', 'Rekor: ' + d.rekor.kelebek)])]),
        ctx.el('button.dugme.tam', { type: 'button', onclick: () => { ctx.ses.tik(); kelebekBaslat(); } }, 'Başla')
      ]),
      ctx.el('div.yama.angela-kart.angela-oyun-kart', [
        ctx.el('div.satir', [ctx.el('span.angela-oyun-ikon', { 'aria-hidden': 'true' }, '🃏'), ctx.el('div', [ctx.el('div.baslik.baslik-lg', 'Hafıza kartları'), ctx.el('p.sessiz', 'Eşleri bul. Az hamle, çok yıldız.'), ctx.el('span.rozet.gri', d.rekor.hafiza ? 'En iyi: ' + d.rekor.hafiza + ' hamle' : 'Henüz oynanmadı')])]),
        ctx.el('button.dugme.tam', { type: 'button', onclick: () => { ctx.ses.tik(); hafizaBaslat(); } }, 'Başla')
      ]),
      ctx.el('div.yama.angela-kart.angela-oyun-kart', [
        ctx.el('div.satir', [ctx.el('span.angela-oyun-ikon', { 'aria-hidden': 'true' }, '💃'), ctx.el('div', [ctx.el('div.baslik.baslik-lg', 'Dans et'), ctx.el('p.sessiz', 'Müzik açılır, ' + ad() + ' odanın ortasında dans eder.'), ctx.el('span.rozet.gri', d.sayac.dans ? d.sayac.dans + ' kez dans etti' : 'Henüz dans etmedi')])]),
        ctx.el('button.dugme.tam', { type: 'button', onclick: () => { ctx.ses.tik(); dansBaslat(); } }, 'Müziği aç')
      ]),
      ctx.el('div.yama.angela-kart.angela-oyun-kart', [
        ctx.el('div.satir', [ctx.el('span.angela-oyun-ikon', { 'aria-hidden': 'true' }, '🥠'), ctx.el('div', [ctx.el('div.baslik.baslik-lg', 'Fal kurabiyesi'), ctx.el('p.sessiz', 'Kır, içinden bugünün minik notu çıksın. Günün ilk kurabiyesi 3 yıldız.'), ctx.el('span.rozet.gri', d.falGunu === CD.bugun() ? 'Bugünün yıldızı alındı' : 'Bugün henüz açılmadı')])]),
        ctx.el('button.dugme.tam', { type: 'button', onclick: () => { ctx.ses.tik(); falAc(); } }, 'Kurabiyeyi kır')
      ])
    );
  }
  function profilCiz() {
    const girdi = ctx.el('input.girdi', { type: 'text', maxlength: '18', value: ad(), 'aria-label': 'Kedinin adı', autocomplete: 'off' });
    const kaydetAd = () => { const y = girdi.value.trim().slice(0, 18); d.ad = y === (ctx.config.ANGELA_ADI || 'Angela') ? '' : y; ctx.baslik(ad()); cuzdanGuncelle(); ctx.ses.parilti(); soyle('Bana ' + ad() + ' de. Sevdim!', 2400); kaydet(); };
    girdi.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); kaydetAd(); girdi.blur(); } });
    const rozetler = ctx.el('div.angela-rozetler');
    ROZETLER.forEach(r => { const var2 = d.rozetler.includes(r.id); rozetler.appendChild(ctx.el('div.angela-rozet' + (var2 ? '.acik' : ''), { title: r.sart }, [ctx.el('span.angela-rozet-emoji', { 'aria-hidden': 'true' }, var2 ? r.emoji : '🔒'), ctx.el('span.angela-rozet-ad', r.ad), ctx.el('span.angela-rozet-sart', r.sart)])); });
    const s = d.sayac;
    ui.panel.append(
      ctx.el('div.yama.angela-kart', [
        ctx.el('div.baslik.baslik-lg', 'Adı ne olsun?'),
        ctx.el('div.satir', [girdi, ctx.el('button.dugme.kucuk', { type: 'button', onclick: kaydetAd }, 'Kaydet')]),
        ctx.el('p.sessiz', 'Seviye ' + d.seviye + ' · ' + d.xp + ' deneyim · ' + d.yildiz + ' yıldız')
      ]),
      ctx.el('div.yama.angela-kart', [ctx.el('div.baslik.baslik-lg', 'Sevdiği şeyler'), ctx.el('ul.angela-liste', SEVDIKLERI.map(x => ctx.el('li', x)))]),
      ctx.el('div.yama.angela-kart', [ctx.el('div.baslik.baslik-lg', 'Rozetler'), rozetler]),
      ctx.el('div.yama.angela-kart', [ctx.el('div.baslik.baslik-lg', 'Birlikte neler yaptık'), ctx.el('div.angela-sayaclar', [
        ['🍓', s.besle, 'kez besledin'], ['🧋', s.icir, 'içecek verdin'], ['🫧', s.banyo, 'banyo'], ['💤', s.uyku, 'kez uyuttun'], ['💗', s.oksama, 'kez okşadın'], ['🎤', s.konus, 'kez konuştunuz'], ['🎮', s.oyun, 'oyun'], ['👗', s.giyim, 'kombin'], ['💃', s.dans, 'dans'], ['🥠', s.fal, 'kurabiye']
      ].map(x => ctx.el('div.angela-sayac', [ctx.el('span.angela-sayac-sayi.sayi', String(x[1])), ctx.el('span.sessiz', x[0] + ' ' + x[2])])))]),
      sonKayit ? ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { ctx.ses.tik(); tekrarCal(); } }, '🔁 Son kaydı tekrar çal') : null
    );
  }

  /* ------------------------------------------------------------ oyun 1: kelebek yakala (sahnede) */
  function kelebekBaslat() {
    if (mesgul()) return;
    mod = 'oyun'; ui.sahne.dataset.mod = 'oyun'; ui.oyunKatman.hidden = false; ui.oyunKatman.innerHTML = ''; ui.hud.hidden = false;
    oyun = { skor: 0, kalan: 25, kelebekler: [], sonDogum: 0, bas: performance.now() };
    hudGuncelle(); soyle('Kelebekler! Yakala onları!', 2000); ifade('sasirma', 1200); ctx.ses.parilti();
    ctx.altbar([{ id: 'bitir', ad: 'Oyunu bitir', ikon: '🏁', tikla: () => kelebekBitir(true) }]);
    clearInterval(T.oyunSaniye);
    T.oyunSaniye = setInterval(() => { if (!oyun) return; oyun.kalan--; hudGuncelle(); if (oyun.kalan <= 5 && oyun.kalan > 0) ctx.ses.tik(); if (oyun.kalan <= 0) kelebekBitir(false); }, 1000);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(kelebekKare);
    if (window.scrollTo) try { ui.sahne.scrollIntoView({ block: 'start', behavior: ctx.azHareket ? 'auto' : 'smooth' }); } catch (err) {}
  }
  function hudGuncelle() { if (oyun) ui.hud.textContent = '🦋 ' + oyun.skor + '   ⏱ ' + oyun.kalan; }
  function kelebekKare(t) {
    if (!oyun || !ctx) return;
    const W = ui.sahne.clientWidth, H = ui.sahne.clientHeight;
    const gecen = (t - oyun.bas) / 1000, aralik = Math.max(520, 1100 - gecen * 22);
    if (t - oyun.sonDogum > aralik && oyun.kelebekler.length < 6) {
      oyun.sonDogum = t;
      const soldan = Math.random() < .5, y0 = 30 + Math.random() * (H * .55);
      const el = ctx.el('button.angela-kelebek', { type: 'button', 'aria-label': 'Kelebek' }, '🦋');
      el.style.setProperty('--ton', Math.floor(Math.random() * 360) + 'deg');
      const k = { el, x: soldan ? -50 : W + 50, y: y0, y0, vx: (soldan ? 1 : -1) * (70 + Math.random() * 60 + gecen * 3), faz: Math.random() * 6, gen: 14 + Math.random() * 26, dogum: t };
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); kelebekYakala(k, e); }, { passive: false });
      ui.oyunKatman.appendChild(el); oyun.kelebekler.push(k);
    }
    const dtk = 1 / 60;
    let enYakin = null, enYakinMesafe = 1e9;
    const m = svgNokta(120, 106);
    oyun.kelebekler = oyun.kelebekler.filter(k => {
      k.x += k.vx * dtk * (ctx.azHareket ? .5 : 1); k.y = k.y0 + Math.sin((t - k.dogum) / 300 + k.faz) * k.gen;
      k.el.style.transform = 'translate(' + k.x.toFixed(1) + 'px,' + k.y.toFixed(1) + 'px)' + (k.vx < 0 ? ' scaleX(-1)' : '');
      const mes = Math.abs(k.x - (m.x)) + Math.abs(k.y - m.y); if (mes < enYakinMesafe) { enYakinMesafe = mes; enYakin = k; }
      if (k.x < -80 || k.x > W + 80) { k.el.remove(); return false; }
      return true;
    });
    if (enYakin && !basili) bakis((enYakin.x - m.x) / 40, (enYakin.y - m.y) / 40);
    raf = requestAnimationFrame(kelebekKare);
  }
  function kelebekYakala(k, e) {
    if (!oyun) return;
    oyun.skor++; hudGuncelle(); k.el.remove(); oyun.kelebekler = oyun.kelebekler.filter(x => x !== k);
    ctx.ses.pop(); ctx.efekt.yildiz(e.clientX, e.clientY, 4);
    if (oyun.skor % 5 === 0) { ifade('mutlu', 700); soyle(rastgele(['Harika!', 'Yakaladın!', 'Bir tane daha!', 'Süper refleks!']), 1200); }
  }
  function kelebekBitir(erken) {
    if (!oyun) return;
    const o = oyun; oyun = null;
    clearInterval(T.oyunSaniye); cancelAnimationFrame(raf); raf = 0;
    ui.oyunKatman.innerHTML = ''; ui.oyunKatman.hidden = true; ui.hud.hidden = true; ui.sahne.dataset.mod = 'normal'; mod = 'normal';
    bakis(0, 0); altbarNormal();
    d.sayac.oyun++; d.mutluluk = sinirla(d.mutluluk + 6 + o.skor * .4, 0, 100); d.enerji = sinirla(d.enerji - 4, 0, 100);
    if (o.skor > d.rekor.kelebek) { d.rekor.kelebek = o.skor; if (o.skor > 0) ctx.toast('Yeni rekor: ' + o.skor + ' kelebek 🦋'); }
    odul(10 + o.skor, o.skor);
    if (o.skor >= 8) { ctx.ses.zafer(); ctx.efekt.konfeti(); ifade('gidik', 1600); soyle(rastgele(SOZ.oyunKazandi)); }
    else { ctx.ses.parilti(); ifade('mutlu', 1200); soyle(erken ? 'Kelebekler uçtu gitti. Bir daha?' : o.skor + ' kelebek! Az kaldı, bir daha?'); }
    barGuncelle(); rozetKontrol(); kaydet(); if (sekme === 'oyun') sekmeAc('oyun');
  }

  /* ------------------------------------------------------------ oyun 2: hafıza kartları (panelde) */
  function hafizaBaslat() {
    const sem = ['🎀', '🐟', '⭐', '💗', '🥛', '🦋'], kartlar = sem.concat(sem);
    for (let i = kartlar.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [kartlar[i], kartlar[j]] = [kartlar[j], kartlar[i]]; }
    hafiza = { kartlar, acik: [], eslesen: 0, hamle: 0, kilit: false };
    d.sayac.oyun++; kaydet();
    sekme = 'oyun'; ui.panel.innerHTML = ''; hafizaCiz();
    soyle('Eşleri bul! Ben de hatırlamaya çalışıyorum.', 2400); ctx.ses.pop();
  }
  function hafizaCiz() {
    const h = hafiza; if (!h) return;
    const izgara = ctx.el('div.angela-hafiza', { role: 'group', 'aria-label': 'Hafıza kartları' });
    h.kartlar.forEach((s, i) => {
      const acik = h.acik.includes(i), esli = h.esli && h.esli[i];
      const b = ctx.el('button.angela-kart-h' + (acik ? '.acik' : '') + (esli ? '.eslesti' : ''), { type: 'button', 'aria-label': acik || esli ? s : 'Kapalı kart', disabled: esli || acik ? true : null, onclick: () => hafizaAc(i) }, [ctx.el('span.angela-kart-on', { 'aria-hidden': 'true' }, '🐾'), ctx.el('span.angela-kart-arka', { 'aria-hidden': 'true' }, s)]);
      izgara.appendChild(b);
    });
    ui.panel.innerHTML = '';
    ui.panel.append(ctx.el('div.yama.angela-kart', [
      ctx.el('div.satir', [ctx.el('div.baslik.baslik-lg', 'Hafıza kartları'), ctx.el('span.bosluk'), ctx.el('span.rozet.goz.angela-hamle', 'Hamle: ' + h.hamle)]),
      izgara,
      ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { ctx.ses.tik(); hafiza = null; sekmeAc('oyun'); } }, 'Oyundan çık')
    ]));
  }
  function hafizaAc(i) {
    const h = hafiza; if (!h || h.kilit || h.acik.includes(i) || (h.esli && h.esli[i])) return;
    ctx.ses.tik(); h.acik.push(i);
    const kartlar = ui.panel.querySelectorAll('.angela-kart-h'); if (kartlar[i]) { kartlar[i].classList.add('acik'); kartlar[i].disabled = true; kartlar[i].setAttribute('aria-label', h.kartlar[i]); }
    if (h.acik.length < 2) return;
    h.hamle++; const hm = ui.panel.querySelector('.angela-hamle'); if (hm) hm.textContent = 'Hamle: ' + h.hamle;
    const [a, b] = h.acik;
    if (h.kartlar[a] === h.kartlar[b]) {
      h.esli = h.esli || {}; h.esli[a] = h.esli[b] = true; h.eslesen++; h.acik = [];
      ctx.ses.parilti(); [a, b].forEach(x => kartlar[x] && kartlar[x].classList.add('eslesti'));
      const r = kartlar[b] ? ctx.efekt.merkez(kartlar[b]) : null; if (r) ctx.efekt.yildiz(r.x, r.y, 3);
      ifade('mutlu', 800);
      if (h.eslesen === 6) sonra(hafizaBitti, 500);
    } else {
      h.kilit = true; ctx.ses.uf();
      sonra(() => { h.acik = []; h.kilit = false; [a, b].forEach(x => { if (kartlar[x]) { kartlar[x].classList.remove('acik'); kartlar[x].disabled = false; kartlar[x].setAttribute('aria-label', 'Kapalı kart'); } }); }, 750);
    }
  }
  function hafizaBitti() {
    const h = hafiza; if (!h) return;
    const yildiz = Math.max(6, 24 - h.hamle), rekor = !d.rekor.hafiza || h.hamle < d.rekor.hafiza;
    if (rekor) d.rekor.hafiza = h.hamle;
    hafiza = null;
    d.mutluluk = sinirla(d.mutluluk + 8, 0, 100);
    odul(12, yildiz); ctx.ses.zafer(); ctx.efekt.konfeti(); ifade('gidik', 1600);
    soyle(rastgele(SOZ.oyunKazandi)); ctx.toast(h.hamle + ' hamlede bitti · +' + yildiz + ' ⭐' + (rekor ? ' · rekor!' : ''));
    barGuncelle(); rozetKontrol(); kaydet(); sekmeAc('oyun');
  }

  /* ------------------------------------------------------------ dans (kısa melodi + oda ışığı) ve fal kurabiyesi */
  let melodiG = null;
  function melodiBaslat() {
    let c = null; try { c = ctx.ses.acik ? ctx.ses.baglam() : null; } catch (err) { c = null; }
    if (!c) return;
    const notalar = [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 523.25];
    const g = c.createGain(); g.gain.value = 1;
    try { g.connect(ctx.ses.master || c.destination); } catch (err) { return; }
    melodiG = g;
    let i = 0;
    const nota = () => {
      if (!melodiG || !ctx) return;
      try {
        const t = c.currentTime, o = c.createOscillator(), e = c.createGain();
        o.type = 'triangle'; o.frequency.value = notalar[i % notalar.length];
        e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.07, t + 0.02); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
        o.connect(e); e.connect(g); o.start(t); o.stop(t + 0.2);
        if (i % 4 === 0) {
          const b = c.createOscillator(), bg = c.createGain(); b.type = 'sine';
          b.frequency.setValueAtTime(160, t); b.frequency.exponentialRampToValueAtTime(60, t + 0.12);
          bg.gain.setValueAtTime(0.1, t); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
          b.connect(bg); bg.connect(g); b.start(t); b.stop(t + 0.15);
        }
      } catch (err) {}
      i++;
      T.dansNota = setTimeout(nota, 210);
    };
    nota();
  }
  function melodiDur() { clearTimeout(T.dansNota); if (melodiG) { try { melodiG.disconnect(); } catch (err) {} melodiG = null; } }
  function dansBaslat() {
    if (mesgul()) return;
    if (d.enerji < 12) { soyle(rastgele(SOZ.yorgun), 2400); ctx.ses.uf(); return; }
    mod = 'dans'; ui.sahne.dataset.mod = 'dans'; ui.kedi.classList.add('dans');
    ifade('mutlu'); agiz('acik', 600); soyle(rastgele(SOZ.dansBasla), 2400); ctx.ses.parilti();
    melodiBaslat();
    ctx.altbar([{ id: 'dansBitir', ad: 'Müziği kapat', ikon: '⏹', tikla: () => dansBitir(true) }]);
    let adim = 0;
    const efekt = () => {
      if (mod !== 'dans' || !ctx) return;
      adim++;
      const p = svgNokta(adim % 2 ? 36 : 204, 40 + Math.random() * 50);
      ctx.efekt.emoji(p.cx, p.cy, rastgele(['🎵', '🎶', '💗', '✨']), 1);
      if (adim % 3 === 0) agiz('acik', 300);
      T.dansEfekt = setTimeout(efekt, 520);
    };
    efekt();
    clearTimeout(T.dans); T.dans = setTimeout(() => dansBitir(false), 9000);
    try { ui.sahne.scrollIntoView({ block: 'start', behavior: ctx.azHareket ? 'auto' : 'smooth' }); } catch (err) {}
  }
  function dansBitir(erken) {
    if (mod !== 'dans') return;
    clearTimeout(T.dans); clearTimeout(T.dansEfekt); melodiDur();
    mod = 'normal';
    if (!ctx || !ui.sahne) return;
    ui.sahne.dataset.mod = 'normal'; ui.kedi.classList.remove('dans');
    d.sayac.dans++; d.mutluluk = sinirla(d.mutluluk + (erken ? 4 : 8), 0, 100); d.enerji = sinirla(d.enerji - 3, 0, 100);
    altbarNormal(); ifade('gidik', 1200); agiz('kapali'); zipla();
    const m = svgNokta(120, 100); ctx.efekt.kalp(m.cx, m.cy, 4);
    odul(erken ? 4 : 8, erken ? 1 : 3); ctx.ses.zafer();
    soyle(rastgele(SOZ.dansBitti), 2600); barGuncelle(); rozetKontrol(); kaydet();
    if (sekme === 'oyun' && !hafiza) sekmeAc('oyun');
  }
  function falAc() {
    if (mesgul()) return;
    const kurabiye = ctx.el('button.angela-fal-kurabiye', { type: 'button', 'aria-label': 'Kurabiyeyi kır' }, '🥠');
    const metinEl = ctx.el('p.angela-fal-metin');
    const kagit = ctx.el('div.angela-fal-kagit', { hidden: true, role: 'status' }, [ctx.el('span.angela-fal-etiket', ad() + '\'nın falı'), metinEl]);
    const tekrar = ctx.el('button.dugme-ikincil.tam', { type: 'button', hidden: true, onclick: () => { ctx.ses.tik(); ctx.sheetKapat(); sonra(falAc, 260); } }, '🥠 Bir tane daha');
    let kirildi = false;
    kurabiye.addEventListener('click', () => {
      if (kirildi || !ctx) return; kirildi = true;
      ctx.ses.catir(); kurabiye.classList.add('kirik');
      const m = ctx.efekt.merkez(kurabiye); ctx.efekt.yildiz(m.x, m.y, 6);
      sonra(() => {
        if (!ctx) return;
        metinEl.textContent = rastgele(FALLAR); kagit.hidden = false; tekrar.hidden = false; ctx.ses.parilti();
        const bugun = CD.bugun(); let yildiz = 0;
        if (d.falGunu !== bugun) { d.falGunu = bugun; yildiz = 3; }
        d.mutluluk = sinirla(d.mutluluk + 2, 0, 100); d.sayac.fal++; odul(2, yildiz);
        ifade('mutlu', 1500); soyle(rastgele(SOZ.fal), 2600); barGuncelle(); rozetKontrol(); kaydet();
      }, 420);
    });
    ctx.sheet(ctx.el('div.dikey.angela-fal', [ctx.el('p.sessiz', 'Kurabiyeye dokun, içindeki minik notu birlikte okuyalım.'), kurabiye, kagit, tekrar]), {
      baslik: 'Fal kurabiyesi', kapaninca: () => { if (ctx && sekme === 'oyun' && !hafiza) sekmeAc('oyun'); }
    });
  }

  /* ------------------------------------------------------------ ekonomi: yıldız, seviye, rozet */
  function odul(xp, yildiz) {
    d.xp += xp;
    if (yildiz) { d.yildiz += yildiz; const m = ctx.efekt.merkez(ui.yildiz); ctx.efekt.yildiz(m.x, m.y, Math.min(5, yildiz + 1)); ui.yildiz.classList.remove('zipla'); void ui.yildiz.offsetWidth; ui.yildiz.classList.add('zipla'); }
    const yeni = 1 + Math.floor(Math.sqrt(d.xp / 60));
    if (yeni > d.seviye) {
      d.seviye = yeni; d.yildiz += 10;
      sonra(() => { ctx.ses.zafer(); ctx.efekt.konfeti(); ctx.toast('Seviye ' + yeni + '! +10 ⭐', 3000); soyle(rastgele(SOZ.seviye), 3000); zipla(); ifade('gidik', 1400); cuzdanGuncelle(); }, 350);
    }
    cuzdanGuncelle();
  }
  function rozetKontrol() {
    ROZETLER.forEach(r => {
      if (d.rozetler.includes(r.id)) return;
      let ok = false; try { ok = r.kontrol(d); } catch (err) { ok = false; }
      if (!ok) return;
      d.rozetler.push(r.id);
      sonra(() => { ctx.ses.isilti(); ctx.toast(r.emoji + ' Rozet: ' + r.ad, 3200); ctx.efekt.konfeti(undefined, undefined, 10); }, 500);
    });
  }

  /* ------------------------------------------------------------ altbar ve açılış */
  function altbarNormal() {
    ctx.altbar([
      { id: 'besle', ad: 'Besle', ikon: '🍓', birincil: true, tikla: () => tepsiAc(YEMEKLER, ad() + ' ne yesin?', false) },
      { id: 'icir', ad: 'İçir', ikon: '🧋', tikla: () => tepsiAc(ICECEKLER, 'Ne içsin?', true) },
      { id: 'banyo', ad: 'Banyo', ikon: '🫧', tikla: banyoBaslat },
      { id: 'tuvalet', ad: 'Tuvalet', ikon: '🚽', tikla: tuvalet },
      { id: 'uyku', ad: d.uyuyor ? 'Işığı aç' : 'Uyut', ikon: d.uyuyor ? '💡' : '💤', basili: d.uyuyor, tikla: uykuDegistir }
    ]);
  }
  function acilis() {
    const gecen = Date.now() - (d.sonGorulme || Date.now());
    let selam = rastgele(SOZ.selam);
    if (gecen > 60000) {
      azalt(Math.min(gecen, 72 * SAAT), false);
      if (gecen > 3 * SAAT) selam = rastgele(SOZ.ozledim);
    }
    if (d.uyuyor) { ui.sahne.dataset.uyku = '1'; ifade('uyku'); if (d.enerji >= 100) sonra(() => uyan(false), 900); else selam = 'zZz… (uyuyor)'; }
    const bugun = CD.bugun();
    if (d.gunluk !== bugun) { d.gunluk = bugun; d.yildiz += 10; sonra(() => { ctx.toast('Günün yıldızları: +10 ⭐', 2800); cuzdanGuncelle(); }, 1400); }
    gorunumGuncelle(); barGuncelle(); cuzdanGuncelle(); kaydet();
    sonra(() => { if (!d.uyuyor) { zipla(); kulakOynat(); } soyle(selam, 3000); }, 450);
    sonTik = Date.now(); sonKayitZ = Date.now();
    kirpDongu(); bosDongu(); sozDongu();
    if (d.ipucuGoruldu) ui.ipucu.classList.add('gitti');
  }
  function sahneHareket(e) {
    if (basili || oyun || d.uyuyor || mod !== 'normal' || e.pointerType !== 'mouse') return;
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; if (ctx && ui.kedi) bakisNoktaya(e.clientX, e.clientY); });
  }
  function sahneCikti() { if (!basili && !oyun && ui.kedi) bakis(0, 0); }

  /* ------------------------------------------------------------ kayıt */
  CD.kaydet({
    id: ID, baslik: 'Angela', ikon: IKON, tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el; d = yukle();
      mod = 'normal'; basili = null; tiklamalar = []; kopuk = 0; oyun = null; hafiza = null; sonKayit = null; mikBasili = false; mirrAcik = false; sekme = 'dolap'; dolapKat = 'fiyonk';
      ctx.baslik(ad());
      kur(el);
      ui.kedi.addEventListener('pointerdown', kediBasildi);
      ui.kedi.addEventListener('pointermove', kediHareket);
      ui.kedi.addEventListener('pointerup', kediBirakildi);
      ui.kedi.addEventListener('pointercancel', kediBirakildi);
      ui.kedi.addEventListener('contextmenu', e => e.preventDefault());
      ui.sahne.addEventListener('pointermove', sahneHareket);
      ui.sahne.addEventListener('pointerleave', sahneCikti);
      ui.mik.addEventListener('pointerdown', mikBasildi);
      ui.mik.addEventListener('pointerup', mikBirakildi);
      ui.mik.addEventListener('pointercancel', mikBirakildi);
      ui.mik.addEventListener('contextmenu', e => e.preventDefault());
      ui.mik.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); if (!mikBasili) { mikBasili = true; if (mesgul()) { mikBasili = false; return; } if (!mikDestek() || d.mikYok) { mikBasili = false; yazarakKonus(); } else kayitBasla(); } } });
      ui.mik.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { if (mikBasili) { mikBasili = false; kayitBitir(); } } });
      ui.yazDugme.addEventListener('click', () => { ctx.ses.tik(); yazarakKonus(); });
      document.addEventListener('visibilitychange', gorunurluk);
      if ('speechSynthesis' in window && speechSynthesis.getVoices) { try { speechSynthesis.getVoices(); } catch (err) {} }
      altbarNormal();
      sekmeAc('dolap');
      acilis();
      T.dongu = setInterval(dongu, 1000);
    },
    unmount() {
      clearInterval(T.dongu); clearInterval(T.oyunSaniye);
      ['kirp', 'bos', 'sozDongu', 'ifade', 'agiz', 'soz', 'bakis', 'kayitMaks', 'konusma', 'dans', 'dansEfekt', 'dansNota'].forEach(k => clearTimeout(T[k]));
      melodiDur();
      hepsiniIptal(); cancelAnimationFrame(raf); raf = 0;
      document.removeEventListener('visibilitychange', gorunurluk);
      if (kayitci) { try { kayitci.onstop = null; kayitci.stop(); } catch (err) {} kayitci = null; }
      akisKapat(); mikBasili = false;
      if ('speechSynthesis' in window) { try { speechSynthesis.cancel(); } catch (err) {} }
      if (d && ctx) { if (mod === 'banyo' || mod === 'oyun' || mod === 'tuvalet' || mod === 'dans') mod = 'normal'; kaydet(); }
      ctx.ses.hepsiniDurdur(); mirrAcik = false;
      oyun = null; hafiza = null; basili = null; sonKayit = null;
      for (const k in ui) delete ui[k];
      ctx = null; kok = null; d = null;
    }
  });
})();
