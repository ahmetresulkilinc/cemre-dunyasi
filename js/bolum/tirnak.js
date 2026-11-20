/* js/bolum/tirnak.js — Tırnak Salonu (V2: gerçekçi nail art stüdyosu)
   Akış: Hazırlık (aseton → ılık su → kütikül itici → kütikül yağı → törpü → parlatıcı → toz fırçası)
         → Şekil & uzunluk (+ protez) → Taban (klasik oje / jel + UV-LED kür) → Renk (1–3 kat)
         → Sanat (fırçalar, sünger, french, mermer, aura, kedi gözü, folyo, damga, çıkartma, 3D süs) → Üst kat.
   Çizim: üç canvas katmanı — arka (stüdyo + el; sadece poz/ten/yakınlık değişince), tırnak (her tırnak kendi
   önbellek tuvalinde; yalnız değişen tırnak yeniden çizilir), üst (araç imleci, seçim, canlı fırça izi, lamba).
   Kayıt anahtarları (değişmedi): cd.tirnak.durum, cd.tirnak.galeri, cd.tirnak.ipucu. Yeni: cd.tirnak.renklerim.
   Fotoğraflar (PNG) IndexedDB 'tirnak' mağazasında ('tirnak:<kimlik>'); galeri kaydı onu 'foto' alanıyla gösterir.
   Göç: v1 tırnak kaydı (finish/teknik/desen/cikartmalar/susler/firca) → v2 (efekt/ust/ojeTur/kat/kur …).
   v2 kayıt, eski sürüm okusa da bozulmasın diye 'finish' alanını da uyumlu değerle yazar. */
(() => {
  'use strict';
  const ID = 'tirnak';
  const SURUM = 2;
  const W = 360, H = 480;                         // mantıksal sahne
  const VARSAYILAN_TEN = '#F6D7C6';               // açık ten
  const ADIMLAR = [
    { id: 'hazirlik', ad: 'Hazırlık', ipucu: 'Önce eller: eski oje, su, kütikül, törpü.' },
    { id: 'sekil', ad: 'Şekil', ipucu: 'Şekli ve boyu seç; istersen protez uzat.' },
    { id: 'taban', ad: 'Taban', ipucu: 'Taban kat; oje daha uzun dayanır.' },
    { id: 'renk', ad: 'Renk', ipucu: 'Bir renk seç; kat kat sür.' },
    { id: 'sanat', ad: 'Sanat', ipucu: 'Parmağınla tırnağın üstüne çiz.' },
    { id: 'ust', ad: 'Üst kat', ipucu: 'Parlak, mat ya da saten bitir.' }
  ];
  const HAZIRLIK = [
    { id: 'aseton', kisa: 'Aseton', ad: 'Aseton', ikon: '🧴', ipucu: 'Pamukla eski ojenin üstünden sürükle.' },
    { id: 'su', kisa: 'Su', ad: 'Ilık su', ikon: '💧', ipucu: 'Parmakları ılık suda biraz beklet.' },
    { id: 'itici', kisa: 'İtici', ad: 'Kütikül itici', ikon: '🥢', ipucu: 'Tırnak dibinde yukarıdan aşağı it.' },
    { id: 'yag', kisa: 'Yağ', ad: 'Kütikül yağı', ikon: '💛', ipucu: 'Her tırnağın dibine bir damla.' },
    { id: 'torpu', kisa: 'Törpü', ad: 'Törpü', ikon: '🪵', ipucu: 'Uçta sağa sola sürükle. Yön şekli belirler.' },
    { id: 'parlatici', kisa: 'Parlat', ad: 'Parlatıcı blok', ikon: '✨', ipucu: 'Tırnağın üstünü ov; ışıl ışıl olsun.' },
    { id: 'tozf', kisa: 'Toz', ad: 'Toz fırçası', ikon: '🖌️', ipucu: 'Törpü tozunu fırçayla süpür.' }
  ];
  const KUMLAR = [
    { id: 100, ad: '100', not: 'Kaba: protez kısaltmak için. Doğal tırnağa sert.', hiz: 1.7, puruz: .5 },
    { id: 180, ad: '180', not: 'Orta: şekil vermek için ideal.', hiz: 1.15, puruz: .15 },
    { id: 240, ad: '240', not: 'İnce: kenarı pürüzsüz bitirir.', hiz: .75, puruz: 0 }
  ];
  const SEKILLER = [
    { id: 'kare', ad: 'Square', tr: 'Kare', not: 'Net, düz uç. En dayanıklısı.' },
    { id: 'squoval', ad: 'Squoval', tr: 'Yumuşak kare', not: 'Kare ama köşeleri yumuşak.' },
    { id: 'yuvarlak', ad: 'Round', tr: 'Yuvarlak', not: 'Doğal ve rahat.' },
    { id: 'oval', ad: 'Oval', tr: 'Oval', not: 'Parmağı uzun gösterir.' },
    { id: 'badem', ad: 'Almond', tr: 'Badem', not: 'Zarif; aurora ile harika.' },
    { id: 'stiletto', ad: 'Stiletto', tr: 'Stiletto', not: 'En dramatik olanı. Senin gibi.' },
    { id: 'coffin', ad: 'Ballerina', tr: 'Balerin', not: 'Uca doğru daralır, uç düz.' },
    { id: 'lipstick', ad: 'Lipstick', tr: 'Ruj', not: 'Ruj gibi eğik kesik uç.' },
    { id: 'edge', ad: 'Edge', tr: 'Keskin', not: 'Ortasında sırt olan sivri uç.' }
  ];
  const UZUNLUKLAR = [{ id: 'kisa', ad: 'Kısa', v: .18 }, { id: 'orta', ad: 'Orta', v: .46 }, { id: 'uzun', ad: 'Uzun', v: .8 }];
  const PROTEZLER = [
    { id: null, ad: 'Doğal', not: 'Kendi tırnağın.' },
    { id: 'tips', ad: 'Tips', not: 'Hazır uç yapıştırılır, sonra şekil verilir.' },
    { id: 'polygel', ad: 'Poly gel', not: 'Hafif ve sağlam; kalıpla uzatılır.' },
    { id: 'builder', ad: 'Builder jel', not: 'Doğal tırnağı güçlendirir, tepe noktası verir.' }
  ];
  const TENLER = [
    ['Porselen', '#FBE6DA'], ['Açık', '#F6D7C6'], ['Pembe açık', '#F3CDBD'], ['Bal', '#EDC1A4'], ['Buğday', '#E3B08E'],
    ['Zeytin', '#D2A07A'], ['Karamel', '#BF8661'], ['Tarçın', '#A9714F'], ['Kahve', '#8E5A3D'], ['Kakao', '#6F4430'], ['Espresso', '#523223'], ['Ebon', '#3C241A']
  ];
  const BAZLAR = [
    { id: 'seffaf', ad: 'Şeffaf', renk: null, not: 'Görünmez, tırnağı korur.' },
    { id: 'sutlu', ad: 'Sütlü', renk: 'rgba(255,250,246,.72)', not: 'Hafif beyaz, yumuşak.' },
    { id: 'pembe', ad: 'Pembe baz', renk: 'rgba(255,214,224,.7)', not: 'Bebek pembesi altlık.' },
    { id: 'seftali', ad: 'Şeftali', renk: 'rgba(255,220,200,.7)', not: 'Sıcak nude altlık.' },
    { id: 'guc', ad: 'Güçlendirici', renk: 'rgba(240,236,255,.5)', not: 'Kırılmasın diye. Şaka değil.' },
    { id: 'kauçuk', ad: 'Kauçuk baz', renk: 'rgba(250,214,214,.62)', not: 'Jel için esnek, kalın taban.' }
  ];
  // Palet: [ad, hex, tur, ek] — tur: krem | jelly | sheer | neon | metalik | simInce | simIri | simHolo | kediGozu | termal | glow
  const PALET = [
    { id: 'favori', ad: "Cemre'nin favorileri", renkler: [['Balerin Pembesi', '#F4CFD8'], ['Pamuk Bulut', '#F7D9DF'], ['Gül Yaprağı', '#EFC3CF'], ['Lila Fısıltı', '#E8D3F2'], ['Şeker Kâğıdı', '#FBE4EA'], ['Mırr Pembe', '#F1D8E8'], ['Lavanta Uykusu', '#DCC8F0'], ['Fiyonk', '#FFD9E1']] },
    { id: 'nude', ad: 'Nude & ten', renkler: [['Sütlü Kahve', '#D9B49B'], ['Kurabiye', '#C99A80'], ['Badem Sütü', '#EAD3C3'], ['Kum Saati', '#D8B8A0'], ['Pudra Kutusu', '#E9C9B6'], ['Karamel Öpücük', '#B98A72'], ['Bal Köpüğü', '#E3C1A4'], ['Tarçınlı Latte', '#A97B64'], ['Çıplak Gül', '#D9A8A0'], ['İpek Ten', '#F0D6C6'], ['Fındık Kreması', '#C8A086'], ['Kakao Tozu', '#8E6450'], ['Vanilya Bulutu', '#F3E4D6'], ['Mocha Mırr', '#7A5242']] },
    { id: 'kirmizi', ad: 'Kırmızılar', renkler: [['Vişne Reçeli', '#8C0F26'], ['Kiraz Dudak', '#B3122E'], ['Klasik Ruj', '#C8102E'], ['Gelincik', '#E03C31'], ['Çilek Şekeri', '#E63950'], ['Nar Tanesi', '#A31633'], ['Bordo Kadife', '#5B1A2A'], ['Domates Kırmızısı', '#D7263D'], ['Şarap Damlası', '#6E0B1D'], ['Mercan Öpücük', '#F2545B'], ['Kırmızı Elma', '#C21F30'], ['Kızıl Kedi', '#9E2A2B']] },
    { id: 'pembe', ad: 'Pembeler', renkler: [['Pamuk Şeker', '#FBC4D4'], ['Gül Kurusu', '#C98B95'], ['Flamingo', '#F48FB1'], ['Şeker Pembe', '#F06292'], ['Fuşya Fırtına', '#D81B60'], ['Gül Bahçesi', '#E8A0B4'], ['Sakız', '#FF9EC4'], ['Pembe Bulut', '#FFD6E4'], ['Bebek Yanağı', '#F7C6C7'], ['Ahududu', '#C2185B'], ['Pıttıksu Burnu', '#EE8AAA'], ['Blush', '#EBB3B8']] },
    { id: 'pastel', ad: 'Pasteller', renkler: [['Lavanta Rüyası', '#DDD1F7'], ['Nane Şekeri', '#C7F2D8'], ['Bebek Mavisi', '#BDE3F5'], ['Limonata', '#FFF5BA'], ['Şeftali Tozu', '#FFD9C2'], ['Leylak', '#E3C8F2'], ['Fıstık Dondurma', '#D4EDC9'], ['Bulut Grisi', '#DCDDE5'], ['Kayısı Reçeli', '#FFD1A6'], ['Mercan Köpüğü', '#FFC9C2'], ['Su Yeşili', '#CDEFEA'], ['Menekşe Sütü', '#D7C4EC']] },
    { id: 'koyu', ad: 'Koyular', renkler: [['Gece Yarısı', '#12244A'], ['Patlıcan', '#3A1C2E'], ['Orman', '#14361F'], ['Mürekkep', '#1E1B2B'], ['Kuzgun', '#19161C'], ['Kahve Çekirdeği', '#3B2420'], ['Gece Moru', '#2E1A47'], ['Petrol', '#0F2E3B'], ['Antrasit', '#2E2E33'], ['Bordo Gece', '#4A0F1F'], ['Zeytin Dalı', '#3D4A2A'], ['Fırtına', '#34414E']] },
    { id: 'neon', ad: 'Neonlar', renkler: [['Limon Neon', '#E6FF2E', 'neon'], ['Neon Pembe', '#FF2E93', 'neon'], ['Neon Turuncu', '#FF6A13', 'neon'], ['Neon Yeşil', '#39FF6A', 'neon'], ['Elektrik Mavi', '#1FB5FF', 'neon'], ['Neon Mor', '#B43CFF', 'neon'], ['Neon Mercan', '#FF4F5E', 'neon'], ['Fosforlu Sarı', '#FFE600', 'neon']] },
    { id: 'metalik', ad: 'Metalikler', renkler: [['Altın Varak', '#D4AF37', 'metalik'], ['Gümüş Ay', '#C0C7D1', 'metalik'], ['Rose Gold', '#E8B4A8', 'metalik'], ['Bakır Kalp', '#B87333', 'metalik'], ['Şampanya', '#E9D3A9', 'metalik'], ['Bronz', '#9C6B30', 'metalik'], ['Platin', '#DCDDE0', 'metalik'], ['Metalik Bordo', '#7A1F3D', 'metalik'], ['Metalik Lila', '#A895C9', 'metalik'], ['Gece Mavisi Metal', '#2B3F73', 'metalik']] },
    { id: 'sim', ad: 'Glitter', renkler: [['Yıldız Tozu', '#F3E6FF', 'simInce'], ['Peri Tozu', '#FFD6EA', 'simInce'], ['Altın Sim', '#E7C15A', 'simInce'], ['Şampanya Köpüğü', '#F5E2C0', 'simInce'], ['Gümüş Pul', '#D7DCE3', 'simIri'], ['Pembe Konfeti', '#FF8FC0', 'simIri'], ['Gece Galaksi', '#1E2350', 'simIri'], ['Bakır Pul', '#C27A4A', 'simIri'], ['Disko Topu', '#E8E8F0', 'simHolo'], ['Holo Unicorn', '#F2DFFF', 'simHolo'], ['Holo Gece', '#2A2346', 'simHolo']] },
    { id: 'jelly', ad: 'Jelly & sheer', renkler: [['Jelibon Kiraz', '#D81E3C', 'jelly'], ['Ahududu Jöle', '#E0457B', 'jelly'], ['Yaban Mersini', '#4B5FD6', 'jelly'], ['Lime Jöle', '#8FD14F', 'jelly'], ['Portakal Şurubu', '#FF8A3D', 'jelly'], ['Mor Lolipop', '#8E44D8', 'jelly'], ['Bal Şurubu', '#D99A2B', 'jelly'], ['Kola Şekeri', '#5A2A1A', 'jelly'], ['Sütlü Pembe', '#F6C9D3', 'sheer'], ['Sütlü Beyaz', '#F7F1EE', 'sheer'], ['Şeftali Sheer', '#F9CDB5', 'sheer'], ['Kristal Şeker', '#EFE8FF', 'sheer']] },
    { id: 'kedi', ad: 'Kedi gözü', renkler: [['Gece Kedisi', '#2E1A47', 'kediGozu'], ['Kadife Bordo', '#4A0F1F', 'kediGozu'], ['Galaksi Mavi', '#12244A', 'kediGozu'], ['Zümrüt Göz', '#0F3B2E', 'kediGozu'], ['Pembe Pati', '#B0175A', 'kediGozu'], ['Sütlü Ay', '#D9D2DE', 'kediGozu'], ['Kahve Kedisi', '#4A2E22', 'kediGozu'], ['Lila Mırr', '#6F57A8', 'kediGozu']] },
    { id: 'termal', ad: 'Termal', renkler: [['Gün Batımı', '#FF5C8A', 'termal', '#FFD166'], ['Yaz Esintisi', '#5B8DEF', 'termal', '#B8F0D6'], ['Böğürtlen Buz', '#5B1A5E', 'termal', '#F5A3D0'], ['Çay Çiçeği', '#B3122E', 'termal', '#FFC2CF'], ['Leylak Sis', '#6F57A8', 'termal', '#E6DAFF'], ['Sütlü Kahve Isısı', '#5A3A2C', 'termal', '#E9C9B6']] },
    { id: 'glow', ad: 'Parlayan', renkler: [['Ateş Böceği', '#C6FF8A', 'glow'], ['Ay Işığı', '#A8ECFF', 'glow'], ['Gece Pembesi', '#FFB0DC', 'glow'], ['Fosfor Sarısı', '#FFF6A8', 'glow'], ['Lila Işık', '#D9C2FF', 'glow']] },
    { id: 'krom', ad: 'Krom tozlar', krom: true, renkler: [['Ayna Gümüş', '#DDE1E8', 'kromAyna'], ['Altın Krom', '#E6C35C', 'kromAltin'], ['Rose Krom', '#EAB2A6', 'kromRose'], ['Aurora', '#F6D3DC', 'aurora'], ['İnci', '#F7EFEA', 'inci'], ['Holografik', '#E0E4FF', 'holo']] }
  ];
  const TUR_AD = { krem: 'Krem', jelly: 'Jelly', sheer: 'Sheer', neon: 'Neon', metalik: 'Metalik', simInce: 'İnce sim', simIri: 'İri sim', simHolo: 'Holo sim', kediGozu: 'Kedi gözü', termal: 'Termal', glow: 'Parlayan' };
  const OJE_TURLERI = Object.keys(TUR_AD);
  // Efekt (krom tozu / eski finish): rengin üstüne ovulan katman
  const EFEKTLER = [
    { id: 'yok', ad: 'Yok' }, { id: 'kromAyna', ad: 'Ayna gümüş' }, { id: 'kromAltin', ad: 'Altın krom' }, { id: 'kromRose', ad: 'Rose krom' },
    { id: 'aurora', ad: 'Aurora' }, { id: 'inci', ad: 'İnci' }, { id: 'holo', ad: 'Holografik' },
    { id: 'krom', ad: 'Renkli krom' }, { id: 'glitter', ad: 'Sim yağmuru' }, { id: 'shimmer', ad: 'Şimmer' }
  ];
  const USTLER = [
    { id: 'parlak', ad: 'Parlak', not: 'Cam gibi, ayna yansımalı.' },
    { id: 'saten', ad: 'Saten', not: 'Yumuşak ipek ışıltısı.' },
    { id: 'mat', ad: 'Mat', not: 'Kadife gibi, ışıksız.' }
  ];
  const ARACLAR = [
    { id: 'nokta', grup: 'firca', ad: 'Dotting', ikon: '●' },
    { id: 'liner', grup: 'firca', ad: 'Liner', ikon: '╱' },
    { id: 'striping', grup: 'firca', ad: 'Striping', ikon: '│' },
    { id: 'detay', grup: 'firca', ad: 'Detay', ikon: '✎' },
    { id: 'silgi', grup: 'firca', ad: 'Silgi', ikon: '⌫' },
    { id: 'sunger', grup: 'gecis', ad: 'Sünger ombré', ikon: '▒' },
    { id: 'boomer', grup: 'gecis', ad: 'Baby boomer', ikon: '◐' },
    { id: 'aura', grup: 'gecis', ad: 'Aura', ikon: '◉' },
    { id: 'french', grup: 'french', ad: 'French', ikon: '◠' },
    { id: 'yarimAy', grup: 'french', ad: 'Yarım ay', ikon: '◡' },
    { id: 'mermer', grup: 'mermer', ad: 'Su mermeri', ikon: '◎' },
    { id: 'miknatis', grup: 'mermer', ad: 'Kedi gözü', ikon: '🧲' },
    { id: 'folyo', grup: 'folyo', ad: 'Folyo', ikon: '▦' },
    { id: 'damga', grup: 'folyo', ad: 'Damga', ikon: '❀' },
    { id: 'cikartma', grup: 'sus', ad: 'Çıkartma', ikon: '♥' },
    { id: 'sus', grup: 'sus', ad: '3D süs', ikon: '◆' }
  ];
  const ARAC_GRUPLARI = [['firca', 'Fırçalar'], ['gecis', 'Geçişler'], ['french', 'French'], ['mermer', 'Mermer & mıknatıs'], ['folyo', 'Folyo & damga'], ['sus', 'Süsler']];
  const NOKTA_BOYLARI = [{ id: 's', ad: 'Küçük', r: .05 }, { id: 'm', ad: 'Orta', r: .085 }, { id: 'l', ad: 'Büyük', r: .13 }];
  const FRENCH_STILLER = [{ id: 'klasik', ad: 'Klasik' }, { id: 'renkli', ad: 'Renkli' }, { id: 'mikro', ad: 'Mikro' }, { id: 'v', ad: 'V French' }];
  const FOLYOLAR = [{ id: 'altin', ad: 'Altın', renk: '#E2B74A' }, { id: 'gumus', ad: 'Gümüş', renk: '#D5DAE2' }, { id: 'rose', ad: 'Rose', renk: '#E9A99B' }, { id: 'holo', ad: 'Holo', renk: '#D9D2FF' }, { id: 'yesil', ad: 'Zümrüt', renk: '#3FB58A' }];
  const DAMGALAR = [
    { id: 'cicek', ad: 'Çiçek' }, { id: 'kalp', ad: 'Kalp' }, { id: 'leopar', ad: 'Leopar' }, { id: 'dantel', ad: 'Dantel' },
    { id: 'yildiz', ad: 'Yıldız' }, { id: 'damla', ad: 'Damla' }, { id: 'geometrik', ad: 'Geometrik' }, { id: 'kelebek', ad: 'Kelebek' },
    { id: 'zebra', ad: 'Zebra' }, { id: 'kareli', ad: 'Kareli' }
  ];
  // tam kaplayan desenler (eski: puantiye/cizgi/ekose korunur)
  const DESENLER = [
    { id: 'puantiye', ad: 'Puantiye' }, { id: 'cizgi', ad: 'Çizgi' }, { id: 'ekose', ad: 'Ekose' },
    { id: 'kaplumbaga', ad: 'Kaplumbağa' }, { id: 'cilek', ad: 'Çilek' }, { id: 'leoparDesen', ad: 'Leopar' }
  ];
  const CIKARTMALAR = [
    { id: 'kalp', ad: 'Kalp' }, { id: 'yildiz', ad: 'Yıldız' }, { id: 'cicek', ad: 'Çiçek' }, { id: 'kelebek', ad: 'Kelebek' },
    { id: 'kiraz', ad: 'Kiraz' }, { id: 'fiyonk', ad: 'Fiyonk' }, { id: 'gulen', ad: 'Gülen yüz' }, { id: 'ayYildiz', ad: 'Ay-yıldız' },
    { id: 'pati', ad: 'Kedi patisi' }, { id: 'papatya', ad: 'Papatya' }, { id: 'cilekK', ad: 'Çilek' }, { id: 'goz', ad: 'Nazar' }
  ];
  const SUSLER = [
    { id: 'tasS', ad: 'Taş S', olcek: .2 }, { id: 'tasM', ad: 'Taş M', olcek: .3 }, { id: 'tasL', ad: 'Taş L', olcek: .42 },
    { id: 'kristalDamla', ad: 'Damla kristal', olcek: .34 }, { id: 'kristalKalp', ad: 'Kalp kristal', olcek: .36 },
    { id: 'inci', ad: 'İnci', olcek: .26 }, { id: 'inciMini', ad: 'Mini inci', olcek: .14 },
    { id: 'kalp3d', ad: '3D kalp', olcek: .38 }, { id: 'fiyonk3d', ad: '3D fiyonk', olcek: .55 }, { id: 'cicek3d', ad: '3D çiçek', olcek: .55 },
    { id: 'charmYildiz', ad: 'Yıldız charm', olcek: .36 }, { id: 'charmKalp', ad: 'Kalp charm', olcek: .36 }, { id: 'charmAy', ad: 'Ay charm', olcek: .36 },
    { id: 'zincir', ad: 'Zincir', olcek: .9 }
  ];
  const TAS_RENKLERI = ['#FFFFFF', '#FFB3C7', '#E8546F', '#B48CFF', '#7EC8FF', '#7CE0B4', '#FFD86B', '#2B2B33', '#F2A65A'];
  const SANAT_RENKLERI = ['#FFFFFF', '#F7F1EE', '#3B3444', '#16141A', '#FFD1DC', '#EE8AAA', '#D81E3C', '#8C0F26', '#D4AF37', '#C0C7D1', '#8E7CC3', '#2D9CFF', '#7CCB9A', '#FFE28A', '#FF7A00', '#8E6450'];
  const PARMAK_AD = ['Baş', 'İşaret', 'Orta', 'Yüzük', 'Serçe'];
  const POZLAR = [{ id: 'duz', ad: 'Düz' }, { id: 'kalp', ad: 'Kalp' }, { id: 'fincan', ad: 'Fincan' }];
  const ZEMINLER = [{ id: 'mermer', ad: 'Pembe mermer' }, { id: 'havlu', ad: 'Havlu' }, { id: 'ahsap', ad: 'Açık ahşap' }, { id: 'saten', ad: 'Saten' }];
  const ISIKLAR = [{ id: 'gun', ad: 'Gün ışığı' }, { id: 'studyo', ad: 'Stüdyo' }, { id: 'los', ad: 'Loş' }];
  const ISIM_SIFAT = ['Bulutlu', 'İncili', 'Şeftalili', 'Gece', 'Sütlü', 'Vişneli', 'Lavantalı', 'Parıltılı', 'Minik', 'Kedili', 'Tatlı', 'Yıldızlı'];
  const ISIM_AD = ['Rüya', 'Buket', 'Şeker', 'Mırr', 'Aurora', 'Pati', 'Fiyonk', 'Yıldız', 'Işıltı', 'Kelebek', 'Bulut', 'Sabah'];
  const PITTIKSU_SOZ = ['mırr… çok güzel olmuş', 'bu renk battaniyeme yakışır', 'patimi de yapar mısın?', 'ışıl ışıl, gözüm kamaştı', 'onayladım, mırr', 'tırnakların benim bıyıklarım kadar zarif'];
  const GECMIS_SINIR = 60;
  const CIHAZ_DURUM = 'cihaz.tirnak.durum', CIHAZ_YEDEK = 'cihaz.tirnak.galeriV1Yedek';
  // Betik yüklenir yüklenmez (bulut eşitlemesi daha veri getirmeden) eski ortak durum cihaz anahtarına kopyalanır.
  try { if (localStorage.getItem('cd.' + CIHAZ_DURUM) == null) { const h = localStorage.getItem('cd.tirnak.durum'); if (h != null) localStorage.setItem('cd.' + CIHAZ_DURUM, h); } } catch (e) {}

  /* ------------------------------------------------------------ hazır trend tasarımlar (i = parmak 0–4) */
  const st = (o) => Object.assign({ top: true, ust: 'parlak', kat: 2, ojeTur: 'krem' }, o);
  const TRENDLER = [
    { id: 'cemre', ad: "Cemre'nin imzası", inci: true, aciklama: 'Uzun stiletto, sütlü pembe, aurora inci krom.', yap: () => st({ sekil: 'stiletto', uzunluk: .86, protez: 'polygel', baz: 'sutlu', renk: '#F6D3DC', ojeTur: 'sheer', kat: 3, efekt: 'aurora' }) },
    { id: 'glazed', ad: 'Glazed donut', aciklama: 'Sütlü nude + inci krom; şekerli donut gibi parlak.', yap: () => st({ sekil: 'badem', uzunluk: .5, baz: 'sutlu', renk: '#F2E6DE', ojeTur: 'sheer', kat: 2, efekt: 'inci' }) },
    { id: 'milkyFrench', ad: 'Milky white French', aciklama: 'Sütlü beyaz zemin, ince beyaz uç.', yap: () => st({ sekil: 'oval', uzunluk: .5, baz: 'pembe', renk: '#F7F1EE', ojeTur: 'sheer', kat: 2, teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .24, stil: 'klasik' } }) },
    { id: 'cherryChrome', ad: 'Cherry red chrome', aciklama: 'Vişne jöle üstüne renkli krom.', yap: () => st({ sekil: 'badem', uzunluk: .55, renk: '#8C0F26', ojeTur: 'jelly', kat: 3, efekt: 'krom' }) },
    { id: 'aura', ad: 'Aura nails', aciklama: 'Ortada mor ışık halesi, kenarlar pembe.', yap: () => st({ sekil: 'badem', uzunluk: .62, renk: '#FFC2D6', teknik: { id: 'aura', renk2: '#9F7BE8', kalinlik: .34, x: 0, y: .52 } }) },
    { id: 'tortoise', ad: 'Tortoise', aciklama: 'Bal jöle, kahve lekeler: kaplumbağa kabuğu.', yap: () => st({ sekil: 'oval', uzunluk: .5, renk: '#C9862B', ojeTur: 'jelly', kat: 2, desen: { id: 'kaplumbaga', renk: '#3B2014' } }) },
    { id: 'strawberry', ad: 'Strawberry', aciklama: 'Çilek kırmızısı, minik çekirdekler, yaprak uç.', yap: i => st({ sekil: 'yuvarlak', uzunluk: .35, renk: i === 3 ? '#FBE4EA' : '#E63950', desen: i === 3 ? null : { id: 'cilek', renk: '#FFE9A8' }, cikartmalar: i === 3 ? [{ id: 'cilekK', x: 0, y: .5, olcek: .62, don: -.15, renk: '#E63950' }] : [] }) },
    { id: 'catVelvet', ad: 'Cat-eye velvet', aciklama: 'Kadife kedi gözü: geniş, yumuşak ışık.', yap: () => st({ sekil: 'coffin', uzunluk: .62, renk: '#4A0F1F', ojeTur: 'kediGozu', kat: 2, kedi: { x: 0, y: .5, aci: 0, gen: .9 } }) },
    { id: 'cicek3d', ad: '3D çiçek', aciklama: 'Sütlü pembe, yüzükte jel çiçek ve inci.', yap: i => st({ sekil: 'oval', uzunluk: .48, renk: '#F6C9D3', ojeTur: 'sheer', kat: 2, susler: i === 3 || i === 1 ? [{ id: 'cicek3d', x: 0, y: .5, olcek: .62, don: .2, renk: '#FFFFFF' }, { id: 'inciMini', x: .5, y: .78, olcek: .14, don: 0, renk: '#FFFFFF' }] : [] }) },
    { id: 'blush', ad: 'Blush nails', aciklama: 'Ortada yanak pembesi, sheer zemin.', yap: () => st({ sekil: 'squoval', uzunluk: .4, renk: '#F7EDEA', ojeTur: 'sheer', teknik: { id: 'aura', renk2: '#F2A0B0', kalinlik: .4, x: 0, y: .45 } }) },
    { id: 'chromeFrench', ad: 'Chrome French', aciklama: 'Nude zemin, ayna gümüş uç.', yap: () => st({ sekil: 'badem', uzunluk: .58, renk: '#EBD2C4', ojeTur: 'sheer', kat: 2, teknik: { id: 'kromUc', renk2: '#C0C7D1', kalinlik: .3 } }) },
    { id: 'leopardNude', ad: 'Leopard nude', aciklama: 'Nude üstüne leopar damgası, iki parmakta.', yap: i => st({ sekil: 'badem', uzunluk: .52, renk: '#D9B49B', damgalar: i === 1 || i === 3 ? [{ desen: 'leopar', renk: '#3B2420', x: 0, y: .5, aci: .2, olcek: 1 }] : [] }) },
    { id: 'cherry', ad: 'Klasik kırmızı', aciklama: 'Kısa kare, vişne kırmızısı, cam parlaklığı.', yap: () => st({ sekil: 'kare', uzunluk: .22, renk: '#B3122E', kat: 2 }) },
    { id: 'babyBoomer', ad: 'Baby boomer', aciklama: 'Pembeden beyaza sünger geçişi.', yap: () => st({ sekil: 'badem', uzunluk: .6, renk: '#F5CFD5', teknik: { id: 'ombre', renk2: '#FFFFFF', kalinlik: .3 } }) },
    { id: 'mermerAltin', ad: 'Mermer & altın', aciklama: 'Beyaz mermer, altın damar, yüzükte taş.', yap: i => st({ sekil: 'coffin', uzunluk: .6, renk: '#FBF8F5', teknik: { id: 'mermer', renk2: '#D4AF37', kalinlik: .3 }, susler: i === 3 ? [{ id: 'tasM', x: 0, y: .42, olcek: .32, don: 0, renk: '#FFFFFF' }] : [] }) },
    { id: 'suMermer', ad: 'Su mermeri', aciklama: 'Pembe, beyaz, lila halkalar suda çekildi.', yap: i => st({ sekil: 'oval', uzunluk: .5, renk: '#FFFFFF', suMermer: { damlalar: [{ x: (i % 2 ? .3 : -.2), y: .5, renkler: ['#F48FB1', '#FFFFFF', '#C9A7F5', '#FFFFFF', '#F48FB1'] }], cizgiler: [[-1, .2 + i * .05, 1, .85 - i * .04], [.6, -.05, -.6, 1.05]] } }) },
    { id: 'neonYaz', ad: 'Neon yaz', aciklama: 'Her parmak başka neon, kısa yuvarlak.', yap: i => st({ sekil: 'yuvarlak', uzunluk: .3, renk: ['#FF2E93', '#FF6A13', '#E6FF2E', '#39FF6A', '#1FB5FF'][i], ojeTur: 'neon' }) },
    { id: 'altinFolyo', ad: 'Altın folyo', aciklama: 'Gece mavisi, rastgele altın folyo parçaları.', yap: i => st({ sekil: 'squoval', uzunluk: .45, renk: '#12244A', firca: [{ tur: 'folyo', renk: '#E2B74A', boy: .28, n: [[-.6, .7 - i * .03, 1], [-.1, .6, 1], [.4, .75, 1], [.7, .45, 1]] }] }) },
    { id: 'yarimAy', ad: 'Retro yarım ay', aciklama: 'Bordo zemin, dipte çıplak yarım ay.', yap: () => st({ sekil: 'oval', uzunluk: .45, renk: '#7A1F3D', teknik: { id: 'yarimAy', renk2: '#F3E4D6', kalinlik: .28 } }) },
    { id: 'vFrench', ad: 'V French', aciklama: 'Sivri V uç, siyah çizgi, nude zemin.', yap: () => st({ sekil: 'badem', uzunluk: .62, renk: '#EAD3C3', ojeTur: 'sheer', teknik: { id: 'french', renk2: '#19161C', kalinlik: .3, stil: 'v' } }) },
    { id: 'dantel', ad: 'Gelin danteli', aciklama: 'Sütlü beyaz, beyaz dantel damga, inciler.', yap: i => st({ sekil: 'oval', uzunluk: .55, renk: '#F7F1EE', ojeTur: 'sheer', kat: 3, damgalar: [{ desen: 'dantel', renk: '#FFFFFF', x: 0, y: .6, aci: 0, olcek: 1 }], susler: i === 2 ? [{ id: 'inciMini', x: -.3, y: .2, olcek: .14, don: 0, renk: '#FFFFFF' }, { id: 'inciMini', x: 0, y: .16, olcek: .14, don: 0, renk: '#FFFFFF' }, { id: 'inciMini', x: .3, y: .2, olcek: .14, don: 0, renk: '#FFFFFF' }] : [], ust: 'saten' }) },
    { id: 'glowGece', ad: 'Gece parlayanı', aciklama: 'Loş ışıkta parlayan pastel uçlar.', yap: () => st({ sekil: 'coffin', uzunluk: .6, renk: '#FFB0DC', ojeTur: 'glow' }) },
    { id: 'termal', ad: 'Gün batımı termal', aciklama: 'Dokununca rengi değişir.', yap: () => st({ sekil: 'badem', uzunluk: .55, renk: '#FF5C8A', renk2: '#FFD166', ojeTur: 'termal' }) },
    { id: 'kiraz', ad: 'Kirazlı French', aciklama: 'Beyaz uç, yüzük parmağında kiraz.', yap: i => st({ sekil: 'oval', uzunluk: .5, renk: '#FBEDEF', ojeTur: 'sheer', teknik: { id: 'french', renk2: '#FFFFFF', kalinlik: .24, stil: 'klasik' }, cikartmalar: i === 3 ? [{ id: 'kiraz', x: 0, y: .5, olcek: .6, don: -.2, renk: '#D81E3C' }] : [] }) },
    { id: 'pati', ad: 'Kedi patisi', aciklama: 'Pıttıksu onaylı: gri zemin, pembe patiler.', yap: i => st({ sekil: 'yuvarlak', uzunluk: .3, renk: '#E9EBEF', cikartmalar: [{ id: 'pati', x: i % 2 ? .2 : -.2, y: .5, olcek: .5, don: i % 2 ? .3 : -.3, renk: '#EE8AAA' }] }) },
    { id: 'holoPastel', ad: 'Holo pastel', aciklama: 'Lila zemin, gökkuşağı tozu.', yap: () => st({ sekil: 'squoval', uzunluk: .42, renk: '#DDD1F7', efekt: 'holo' }) },
    { id: 'galaksi', ad: 'Galaksi sim', aciklama: 'Lacivert iri sim, yüzükte yıldız charm.', yap: i => st({ sekil: 'stiletto', uzunluk: .75, renk: '#1E2350', ojeTur: 'simIri', kat: 3, susler: i === 3 ? [{ id: 'charmYildiz', x: 0, y: .4, olcek: .36, don: 0, renk: '#E6C35C' }] : [] }) },
    { id: 'kelebek', ad: 'Kelebekli gök', aciklama: 'Açık mavi, kelebek ve yıldızlar.', yap: i => st({ sekil: 'badem', uzunluk: .55, renk: '#BDE3F5', efekt: 'shimmer', cikartmalar: i === 1 || i === 3 ? [{ id: 'kelebek', x: 0, y: .5, olcek: .62, don: .15, renk: '#8E7CC3' }] : [{ id: 'yildiz', x: -.3, y: .35, olcek: .3, don: 0, renk: '#FFFFFF' }, { id: 'yildiz', x: .35, y: .65, olcek: .22, don: .4, renk: '#FFFFFF' }] }) }
  ];

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null;
  const ui = {};
  const gecmis = [], gelecek = [];
  const zamanlar = new Set();
  let kaydetT = 0, balonT = 0, olayIptal = [], gorunurCb = null, boyutCb = null, boyutGozlem = null;
  // geçici arayüz durumu (kayıt dışı)
  const arac = { id: 'nokta', boy: 4, nokta: 'm', renk: '#FFFFFF', renk2: '#FFFFFF', frenchStil: 'klasik', folyo: 'altin', damga: 'cicek', cikartma: 'kalp', sus: 'tasM', tasRenk: '#FFFFFF', grup: 'firca', mermerRenkler: ['#F48FB1', '#FFFFFF', '#C9A7F5'] };
  let koleksiyon = 'favori', kum = 180, seciliParca = null;
  const karistir = { mod: 'hsl', h: 340, s: 70, l: 82, a: '#F48FB1', b: '#FFFFFF', oran: 50 };

  const sinir = (v, a, b) => Math.max(a, Math.min(b, v));
  const kopya = (o) => JSON.parse(JSON.stringify(o));
  const yeniTohum = () => Math.floor(Math.random() * 1e6);
  const HEX = /^#[0-9a-f]{6}$/i;
  const hexMi = (h) => typeof h === 'string' && HEX.test(h);

  function tirnakVarsayilan() {
    return {
      v: SURUM, sekil: 'yuvarlak', uzunluk: .2, protez: null,
      baz: 'seffaf', renk: null, ojeTur: 'krem', kat: 0, renk2: null, kedi: null,
      teknik: { id: 'yok', renk2: '#FFFFFF', kalinlik: .3 }, efekt: 'yok', ust: 'parlak', top: false,
      desen: null, damgalar: [], suMermer: null, cikartmalar: [], susler: [], firca: [],
      kur: { baz: true, renk: true, top: true }, tohum: yeniTohum(), finish: 'parlak'
    };
  }
  const ESKI_EFEKT = ['krom', 'aurora', 'glitter', 'shimmer', 'holo'];
  /* v1 → v2 tek tırnak göçü. Hiçbir eski alan atılmaz; 'finish' anlamı efekt/ust/ojeTur'a dağıtılır. */
  function tirnakGoc(t) {
    const v = Object.assign({}, t || {});
    if (v.v === SURUM) return v;
    const f = v.finish || 'parlak';
    v.efekt = ESKI_EFEKT.includes(f) ? f : 'yok';
    v.ust = f === 'mat' ? 'mat' : 'parlak';
    v.ojeTur = f === 'catEye' ? 'kediGozu' : 'krem';
    if (f === 'catEye') v.kedi = { x: 0, y: .5, aci: -.5, gen: .5 };
    v.kat = v.renk ? 3 : 0;                 // eski oje tam örtücüydü → 3 kat
    v.protez = null; v.damgalar = []; v.suMermer = null; v.renk2 = null;
    v.kur = { baz: true, renk: true, top: true };
    if (Array.isArray(v.firca)) v.firca = v.firca.map(s => Object.assign({ tur: s && s.silgi ? 'silgi' : 'eski' }, s));
    v.v = SURUM;
    return v;
  }
  function finishUyum(t) {
    if (t.ojeTur === 'kediGozu') return 'catEye';
    if (ESKI_EFEKT.includes(t.efekt)) return t.efekt;
    if (/^krom/.test(t.efekt)) return 'krom';
    if (t.efekt === 'inci') return 'aurora';
    if (t.ust === 'mat') return 'mat';
    return 'parlak';
  }
  function tirnakDuzelt(t) {
    const v = Object.assign(tirnakVarsayilan(), tirnakGoc(t));
    v.teknik = Object.assign({ id: 'yok', renk2: '#FFFFFF', kalinlik: .3 }, (v.teknik && typeof v.teknik === 'object') ? v.teknik : {});
    ['cikartmalar', 'susler', 'firca', 'damgalar'].forEach(k => { if (!Array.isArray(v[k])) v[k] = []; });
    if (!SEKILLER.some(s => s.id === v.sekil)) v.sekil = 'badem';
    if (!BAZLAR.some(b => b.id === v.baz)) v.baz = 'seffaf';
    if (!OJE_TURLERI.includes(v.ojeTur)) v.ojeTur = 'krem';
    if (!EFEKTLER.some(e => e.id === v.efekt)) v.efekt = 'yok';
    if (!USTLER.some(u => u.id === v.ust)) v.ust = 'parlak';
    if (!PROTEZLER.some(p => p.id === v.protez)) v.protez = null;
    if (v.renk != null && !hexMi(v.renk)) v.renk = null;
    v.kat = v.renk ? sinir(Math.round(Number(v.kat) || 1), 1, 3) : 0;
    v.uzunluk = sinir(Number(v.uzunluk) || 0, 0, 1);
    if (!v.kur || typeof v.kur !== 'object') v.kur = { baz: true, renk: true, top: true };
    if (v.ojeTur === 'kediGozu' && !v.kedi) v.kedi = { x: 0, y: .5, aci: -.5, gen: .5 };
    v.finish = finishUyum(v);
    return v;
  }
  function elDuzelt(a) { const l = Array.isArray(a) ? a : []; const s = []; for (let i = 0; i < 5; i++) s.push(tirnakDuzelt(l[i])); return s; }
  function ellerDuzelt(e) { return { sol: elDuzelt(e && e.sol), sag: elDuzelt(e && e.sag) }; }

  const ESKI_OJELER = ['#B3122E', '#C98B95', '#7A1F3D', '#E8A0B4', '#2E1A47', '#D9A8A0'];
  function hazirlikYeni(tamam) {
    const rnd = Math.random;
    return {
      adim: tamam ? HAZIRLIK.length : 0,
      eski: { renk: CD.rastgele(ESKI_OJELER), kalan: [1, 1, 1, 1, 1].map(() => tamam ? 0 : .86 + rnd() * .14) },
      su: tamam ? 1 : 0,
      kutikul: [0, 0, 0, 0, 0].map(() => tamam ? 1 : 0), yag: [0, 0, 0, 0, 0].map(() => tamam ? 1 : 0),
      torpu: [0, 0, 0, 0, 0].map(() => tamam ? 1 : 0), parlak: [0, 0, 0, 0, 0].map(() => tamam ? 1 : 0),
      toz: [0, 0, 0, 0, 0], ilkUz: [0, 0, 0, 0, 0].map(() => .16 + rnd() * .2), yon: null
    };
  }
  function hazirlikDuzelt(h, tamam) {
    const v = Object.assign(hazirlikYeni(tamam), h && typeof h === 'object' ? h : {});
    v.adim = sinir(Math.round(Number(v.adim) || 0), 0, HAZIRLIK.length);
    ['kutikul', 'yag', 'torpu', 'parlak', 'toz', 'ilkUz'].forEach(k => { if (!Array.isArray(v[k]) || v[k].length !== 5) v[k] = hazirlikYeni(tamam)[k]; });
    if (!v.eski || !Array.isArray(v.eski.kalan)) v.eski = hazirlikYeni(tamam).eski;
    return v;
  }
  const hazirMi = (taraf) => d.hazirlik[taraf].adim >= HAZIRLIK.length;

  const ESKI_ADIM = { baz: 'taban', art: 'sanat', top: 'ust' };
  function varsayilan() {
    return {
      v: SURUM, ten: null, el: 'sag', poz: 'duz', zemin: 'mermer', isik: 'gun', isikAci: .8, adim: 'hazirlik',
      secim: { hepsi: true, parmak: 2 }, eller: ellerDuzelt(), hazirlik: null, sistem: 'klasik', lambaSure: 30,
      sonRenkler: [], kayitSayisi: 0, sonGorulme: Date.now()
    };
  }
  /* durum göçü: v1 { ten, el, adim, secim, eller, sonRenkler, kayitSayisi } → v2 */
  function durumGoc(ham) {
    const eski = ham && typeof ham === 'object' ? ham : {};
    const v = Object.assign(varsayilan(), eski);
    const v1 = eski.v !== SURUM;
    v.eller = ellerDuzelt(eski.eller);
    if (v1 && ESKI_ADIM[v.adim]) v.adim = ESKI_ADIM[v.adim];
    if (!ADIMLAR.some(a => a.id === v.adim)) v.adim = 'hazirlik';
    if (v.el !== 'sol' && v.el !== 'sag') v.el = 'sag';
    if (v.ten && !hexMi(v.ten)) v.ten = null;
    if (!POZLAR.some(p => p.id === v.poz)) v.poz = 'duz';
    if (!ZEMINLER.some(p => p.id === v.zemin)) v.zemin = 'mermer';
    if (!ISIKLAR.some(p => p.id === v.isik)) v.isik = 'gun';
    if (v.sistem !== 'jel') v.sistem = 'klasik';
    v.lambaSure = v.lambaSure === 60 ? 60 : 30;
    v.isikAci = sinir(Number(v.isikAci), 0, 6.3) || .8;
    if (!v.secim || typeof v.secim !== 'object') v.secim = { hepsi: true, parmak: 2 };
    v.secim.parmak = sinir(Number(v.secim.parmak) || 0, 0, 4); v.secim.hepsi = !!v.secim.hepsi;
    if (!Array.isArray(v.sonRenkler)) v.sonRenkler = [];
    // eski kullanıcı: elleri zaten yapılmış sayılır (hazırlık tamam); yeni kullanıcı: eski ojeyle başlar
    const doluMu = (el) => el.some(t => t.renk);
    const hz = eski.hazirlik && typeof eski.hazirlik === 'object' ? eski.hazirlik : {};
    v.hazirlik = {
      sol: hazirlikDuzelt(hz.sol, v1 && (eski.eller ? true : false) || doluMu(v.eller.sol)),
      sag: hazirlikDuzelt(hz.sag, v1 && (eski.eller ? true : false) || doluMu(v.eller.sag))
    };
    if (v1 && eski.eller) v.adim = v.adim === 'hazirlik' ? 'sekil' : v.adim;
    v.v = SURUM;
    return v;
  }
  /* galeri göçü: her kaydın elleri v2'ye çevrilir; eski alanlar (id, ad, tarih, ten, el) aynen kalır. */
  function galeriKaydiGoc(k) {
    if (!k || typeof k !== 'object') return null;
    const v = Object.assign({}, k);
    v.eller = ellerDuzelt(k.eller);
    if (!v.id) v.id = CD.kimlik();
    if (!v.ad) v.ad = 'Adsız tasarım';
    v.v = SURUM;
    return v;
  }
  /* Galeri (senk'e giden ortak liste) yalnız hafif başlık tutar: { id, v:3, ad, tarih, kayit }.
     Ağır tasarım verisi ve küçük JPEG, IndexedDB 'tirnak' mağazasında aynı kayıtta durur (kayit = 'tirnak:<id>').
     Eski (v1/v2) kayıtlar galeriGoc() ile taşınır; IndexedDB yazılamazsa ağır kayıt yerinde kalır (kayıp yok). */
  const KAYIT_ONEK = 'tirnak:';
  function galeriAl() {
    const ham = ctx.depo.al('galeri', []);
    return (Array.isArray(ham) ? ham : []).filter(k => k && typeof k === 'object').map(k => (k.eller ? galeriKaydiGoc(k) : k));
  }
  function galeriYaz(g) { ctx.depo.yaz('galeri', g); }
  const tasarimAl = (k) => ({ eller: k.eller, ten: k.ten || null, el: k.el || 'sag', poz: k.poz || 'duz', zemin: k.zemin || 'mermer', isik: k.isik || 'gun' });
  const hafifKayit = (k, kid) => ({ id: k.id, v: 3, ad: k.ad, tarih: k.tarih, kayit: kid });
  let gocSurer = false;
  async function galeriGoc() {
    const alan = CD.depo.alan(ID);
    // eski v1 yedeği cihaza özel anahtara taşınır (buluta gitmesin)
    const eskiYedek = alan.al('galeriV1Yedek', null);
    if (eskiYedek != null) { if (CD.depo.al(CIHAZ_YEDEK, null) == null) CD.depo.yaz(CIHAZ_YEDEK, eskiYedek); alan.sil('galeriV1Yedek'); }
    const ham = alan.al('galeri', []);
    if (!Array.isArray(ham) || !ham.some(k => k && k.eller) || gocSurer) return;
    if (ham.some(k => k && k.eller && k.v !== SURUM && k.v !== 3) && CD.depo.al(CIHAZ_YEDEK, null) == null) CD.depo.yaz(CIHAZ_YEDEK, ham);
    gocSurer = true;
    const tasindi = new Map();
    try {
      for (const k of ham) {
        if (!k || !k.eller) continue;
        const g = galeriKaydiGoc(k), kid = k.foto || (KAYIT_ONEK + g.id);
        try {
          const eski = await CD.idb.al('tirnak', kid).catch(() => null);
          await CD.idb.koy('tirnak', Object.assign({}, eski || {}, { id: kid, ad: g.ad, tarih: g.tarih, tasarim: tasarimAl(g) }));
          const geri = await CD.idb.al('tirnak', kid);
          if (geri && geri.tasarim) tasindi.set(g.id, hafifKayit(g, kid));
        } catch (e) { /* bu kayıt ağır hâliyle kalır */ }
      }
    } finally { gocSurer = false; }
    if (!tasindi.size) return;
    // bu arada eklenen/silinen kayıtlar ezilmesin: güncel listeye id ile uygula
    const simdi = alan.al('galeri', []);
    alan.yaz('galeri', (Array.isArray(simdi) ? simdi : []).map(k => (k && k.eller && tasindi.has(k.id)) ? tasindi.get(k.id) : k));
  }
  async function galeriVeri(k) {
    if (k.eller) return Object.assign({}, k, { eller: ellerDuzelt(k.eller) });
    const r = k.kayit ? await CD.idb.al('tirnak', k.kayit).catch(() => null) : null;
    if (!r || !r.tasarim) return null;
    return Object.assign({ id: k.id, ad: k.ad, tarih: k.tarih }, r.tasarim, { eller: ellerDuzelt(r.tasarim.eller) });
  }
  function renklerimAl() { const r = ctx.depo.al('renklerim', []); return Array.isArray(r) ? r.filter(x => x && hexMi(x.hex)) : []; }

  /* çalışma durumu cihaza özel (cd.cihaz.tirnak.durum → senk'e gitmez; iki telefon birbirini ezmez) */
  function yukle() { const c = CD.depo.al(CIHAZ_DURUM, null); return durumGoc(c != null ? c : ctx.depo.al('durum', null)); }
  function kaydetDurum() {
    if (!ctx || !d) return;
    d.sonGorulme = Date.now();
    ['sol', 'sag'].forEach(k => d.eller[k].forEach(t => { t.finish = finishUyum(t); }));
    CD.depo.yaz(CIHAZ_DURUM, d);
    const ip = ipucuMetni(); if (ctx.depo.al('ipucu', '') !== ip) ctx.depo.yaz('ipucu', ip);
  }
  function kaydetGec() { clearTimeout(kaydetT); kaydetT = setTimeout(kaydetDurum, 450); }
  function ipucuMetni() {
    const g = ctx.depo.al('galeri', []);
    if (Array.isArray(g) && g.length) return 'Galeride ' + g.length + ' tasarım 💅';
    const t = d.eller[d.el][2];
    if (t.renk) return (SEKILLER.find(s => s.id === t.sekil) || {}).tr + ' · ' + (TUR_AD[t.ojeTur] || '') + ' 💅';
    if (!hazirMi(d.el)) return 'Manikür masası hazır 💅';
    return '';
  }
  function sonra(fn, ms) { const t = setTimeout(() => { zamanlar.delete(t); if (ctx) fn(); }, ms); zamanlar.add(t); return t; }
  function hepsiniIptal() { zamanlar.forEach(clearTimeout); zamanlar.clear(); }

  /* ------------------------------------------------------------ renk yardımcıları */
  function hexRgb(h) { h = String(h || '#000000').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => sinir(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase(); }
  function rgba(hex, a) { const c = hexRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function karis(h1, h2, t) { const a = hexRgb(h1), b = hexRgb(h2); return rgbHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); }
  const acik = (h, t) => karis(h, '#FFFFFF', t), koyu = (h, t) => karis(h, '#000000', t);
  function hslHex(h, s, l) {
    s /= 100; l /= 100; const k = n => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return rgbHex(f(0) * 255, f(8) * 255, f(4) * 255);
  }
  function hexHsl(hex) {
    const [r, g, b] = hexRgb(hex).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const dd = mx - mn; s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h *= 60; }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  function parlaklik(hex) { const c = hexRgb(hex); return (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000; }
  function doygun(hex, k) { const [h, s, l] = hexHsl(hex); return hslHex(h, sinir(s * k, 0, 100), l); }
  function tohumla(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function renkAdi(hex) {
    for (const k of PALET) for (const r of k.renkler) if (r[1].toUpperCase() === String(hex).toUpperCase()) return r[0];
    const m = renklerimAl().find(x => x.hex.toUpperCase() === String(hex).toUpperCase()); if (m) return m.ad;
    return null;
  }

  /* ------------------------------------------------------------ 2B dönüşüm (canvas sırası: a b c d e f) */
  const M = {
    bir: () => [1, 0, 0, 1, 0, 0],
    carp: (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]],
    oteleme: (x, y) => [1, 0, 0, 1, x, y],
    dondur: (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; },
    olcek: (x, y) => [x, 0, 0, y == null ? x : y, 0, 0],
    ters: (m) => { const det = m[0] * m[3] - m[1] * m[2] || 1e-9; return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det]; },
    uygula: (m, x, y) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] }),
    zincir: (...l) => l.reduce((a, b) => M.carp(a, b))
  };
  const uygulaG = (g, m) => g.transform(m[0], m[1], m[2], m[3], m[4], m[5]);

  /* ------------------------------------------------------------ el modeli (sağ el, el sırtı, parmaklar yukarı, baş parmak solda) */
  const yon = (a) => ({ x: Math.sin(a), y: -Math.cos(a) });
  const PARMAK_DUZ = [
    { k: [118, 396], a: [-0.98, -0.74, -0.6], l: [50, 38, 50], w: 46 },
    { k: [150, 292], a: [-0.11, -0.065, -0.045], l: [64, 40, 48], w: 40 },
    { k: [190, 284], a: [0, 0, 0.005], l: [72, 44, 50], w: 41.5 },
    { k: [229, 292], a: [0.095, 0.065, 0.045], l: [66, 41, 47], w: 39 },
    { k: [264, 310], a: [0.25, 0.18, 0.14], l: [50, 33, 40], w: 33 }
  ];
  const AVUC = [[126, 304], [150, 279], [190, 271], [229, 279], [262, 297], [284, 330], [289, 384], [282, 438], [274, 520], [146, 520], [130, 458], [108, 414], [114, 352]];
  const tirnakGen = (w) => w * 0.86 * 0.8;
  const tirnakBoyu = (t, nw) => nw * 1.28 + t.uzunluk * nw * 1.9 * (t.protez ? 1.12 : 1);
  function parmakEklemleri(p) {
    const n = [{ x: p.k[0], y: p.k[1] }];
    for (let i = 0; i < 3; i++) { const v = yon(p.a[i]); const o = n[i]; n.push({ x: o.x + v.x * p.l[i], y: o.y + v.y * p.l[i] }); }
    return n;
  }
  // tırnağın el-yerel konumu: kütikül merkezi + yön
  function tirnakCapa(p) {
    const n = parmakEklemleri(p), a = p.a[2], v = yon(a), nw = tirnakGen(p.w), yatak = nw * 1.28;
    const geri = yatak - nw * .1;
    return { x: n[3].x - v.x * geri, y: n[3].y - v.y * geri, a, nw };
  }

  /* pozlar: her biri el örnekleri listesi döndürür { taraf, m (el→sahne), parmaklar, avuc, kol } */
  function parmakKopya(liste, fn) { return liste.map((p, i) => { const q = { k: p.k.slice(), a: p.a.slice(), l: p.l.slice(), w: p.w }; if (fn) fn(q, i); return q; }); }
  function ayna(taraf, m) { return taraf === 'sol' ? M.carp(M.carp(M.oteleme(W, 0), M.olcek(-1, 1)), m) : m; }
  function pozKur(poz, el) {
    if (poz === 'kalp') {
      // iki el: işaret parmakları üstte kıvrılıp buluşur, baş parmaklar altta buluşur
      const parmak = parmakKopya(PARMAK_DUZ, (q, i) => {
        if (i === 0) { q.a = [-2.3, -2.75, -3.0]; }
        if (i === 1) { q.a = [-0.35, -0.55, -0.75]; }
        if (i === 2) { q.a = [-0.06, -0.03, -0.01]; }
        if (i === 3) { q.a = [0.1, 0.08, 0.06]; }
        if (i === 4) { q.a = [0.3, 0.24, 0.2]; }
      });
      const sag = M.zincir(M.oteleme(258, 290), M.olcek(.55), M.oteleme(-200, -380));
      const sol = M.carp(M.carp(M.oteleme(W, 0), M.olcek(-1, 1)), sag);
      return [
        { taraf: 'sol', m: sol, parmaklar: parmak, avuc: true, kol: true },
        { taraf: 'sag', m: sag, parmaklar: parmak, avuc: true, kol: true }
      ];
    }
    if (poz === 'fincan') {
      // fincanı sağdan kavrayan el: parmaklar sola, baş parmak kulpun üstünde
      const parmak = parmakKopya(PARMAK_DUZ, (q, i) => {
        if (i === 0) { q.a = [-1.15, -0.55, -0.25]; q.l = [50, 38, 50]; }
        else { q.l = q.l.map((x, k) => x * (k === 0 ? .9 : .95)); q.a = q.a.map((x, k) => x * .6 + (k === 2 ? -0.12 : 0)); }
      });
      const m = M.zincir(M.oteleme(300, 262), M.dondur(-Math.PI / 2 + .1), M.olcek(-.72, .72), M.oteleme(-200, -400));
      return [{ taraf: el, m: ayna(el, m), parmaklar: parmak, avuc: true, kol: true, fincan: true }];
    }
    return [{ taraf: el, m: ayna(el, M.bir()), parmaklar: PARMAK_DUZ, avuc: true, kol: true }];
  }
  /* sahnedeki her tırnak: { taraf, i, m (tırnak yerel → sahne), ters, nw } */
  function tirnakYerlesimi(ornekler) {
    const l = [];
    ornekler.forEach(o => o.parmaklar.forEach((p, i) => {
      const c = tirnakCapa(p);
      const m = M.zincir(o.m, M.oteleme(c.x, c.y), M.dondur(c.a));
      const olc = Math.hypot(m[0], m[1]);
      l.push({ taraf: o.taraf, i, m, ters: M.ters(m), nw: c.nw, olc, ayna: (m[0] * m[3] - m[1] * m[2]) < 0 });
    }));
    return l;
  }

  /* ------------------------------------------------------------ tırnak yolu (yerel: kütikül merkezi 0,0; uç -L) */
  function tirnakYolu(p, sekil, nw, L) {
    const hw = nw / 2, c = nw * .2;
    p.moveTo(-hw, 0);
    switch (sekil) {
      case 'kare': case 'squoval': {
        const r = sekil === 'kare' ? nw * .08 : nw * .32;
        p.lineTo(-hw, -L + r); p.quadraticCurveTo(-hw, -L, -hw + r, -L); p.lineTo(hw - r, -L); p.quadraticCurveTo(hw, -L, hw, -L + r); p.lineTo(hw, 0); break;
      }
      case 'yuvarlak': p.lineTo(-hw, -L + hw); p.arc(0, -L + hw, hw, Math.PI, Math.PI * 2); p.lineTo(hw, 0); break;
      case 'oval': { const th = nw * .85; p.lineTo(-hw, -L + th); p.bezierCurveTo(-hw, -L + th - th * 1.34, hw, -L + th - th * 1.34, hw, -L + th); p.lineTo(hw, 0); break; }
      case 'coffin': { const tw = hw * .52, r = nw * .07; p.lineTo(-hw, -L * .38); p.lineTo(-tw - r * .3, -L + r); p.quadraticCurveTo(-tw, -L, -tw + r, -L); p.lineTo(tw - r, -L); p.quadraticCurveTo(tw, -L, tw + r * .3, -L + r); p.lineTo(hw, -L * .38); p.lineTo(hw, 0); break; }
      case 'stiletto': p.lineTo(-hw, -L * .3); p.bezierCurveTo(-hw * .9, -L * .62, -hw * .3, -L * .9, 0, -L); p.bezierCurveTo(hw * .3, -L * .9, hw * .9, -L * .62, hw, -L * .3); p.lineTo(hw, 0); break;
      case 'lipstick': { const ust = -L, alt = -L + nw * .9; p.lineTo(-hw, alt + nw * .1); p.quadraticCurveTo(-hw, alt - nw * .05, -hw * .7, alt - nw * .12); p.lineTo(hw * .55, ust + nw * .06); p.quadraticCurveTo(hw, ust, hw, ust + nw * .3); p.lineTo(hw, 0); break; }
      case 'edge': p.lineTo(-hw, -L * .42); p.lineTo(-hw * .2, -L * .93); p.quadraticCurveTo(0, -L * 1.01, hw * .2, -L * .93); p.lineTo(hw, -L * .42); p.lineTo(hw, 0); break;
      default: p.lineTo(-hw, -L * .42); p.bezierCurveTo(-hw, -L * .78, -hw * .38, -L, 0, -L); p.bezierCurveTo(hw * .38, -L, hw, -L * .78, hw, -L * .42); p.lineTo(hw, 0);
    }
    p.quadraticCurveTo(0, c * 2, -hw, 0);
    p.closePath();
  }
  const yolOnbellek = new Map();
  function tirnakYol2D(sekil, nw, L) {
    const k = sekil + '|' + nw.toFixed(2) + '|' + L.toFixed(2);
    let p = yolOnbellek.get(k); if (p) return p;
    p = new Path2D(); tirnakYolu(p, sekil, nw, L);
    if (yolOnbellek.size > 300) yolOnbellek.clear();
    yolOnbellek.set(k, p); return p;
  }
  /* yakalama: sahne noktası → tırnak yerel normalize (x: -1..1 yarım genişliğe göre, y: 0 dip, 1 uç) */
  function yereleCevir(y, x, s) { const q = M.uygula(y.ters, x, s); return q; }
  function tirnakBul(sx, sy, pay) {
    pay = pay == null ? 6 : pay;
    let en = null, enM = 1e9;
    for (const y of yerlesim) {
      const t = d.eller[y.taraf][y.i], L = tirnakBoyu(t, y.nw), q = yereleCevir(y, sx, sy), hw = y.nw / 2;
      const p = pay / y.olc;
      if (Math.abs(q.x) <= hw + p && q.y <= hw * .5 + p && q.y >= -L - p) {
        const m = Math.abs(q.x) / hw + Math.abs(q.y + L / 2) / L;
        if (m < enM) { enM = m; en = y; }
      }
    }
    return en;
  }
  function normalNokta(y, sx, sy) {
    const t = d.eller[y.taraf][y.i], L = tirnakBoyu(t, y.nw), q = yereleCevir(y, sx, sy);
    return { x: q.x / (y.nw / 2), y: -q.y / L, L };
  }
  // Catmull-Rom → bezier. bas: 'tasi' (moveTo) | 'cizgi' (lineTo) | 'yok'
  function egriCiz(p, n, kapali, bas) {
    const k = n.length; if (k < 2) return;
    const al = i => kapali ? n[(i + k) % k] : n[sinir(i, 0, k - 1)];
    bas = bas || 'tasi';
    if (bas === 'tasi') p.moveTo(n[0].x, n[0].y); else if (bas === 'cizgi') p.lineTo(n[0].x, n[0].y);
    const son = kapali ? k : k - 1;
    for (let i = 0; i < son; i++) {
      const p0 = al(i - 1), p1 = al(i), p2 = al(i + 1), p3 = al(i + 2);
      p.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
    }
    if (kapali) p.closePath();
  }

  /* ------------------------------------------------------------ dokular (bir kez üretilir) */
  const doku = {};
  function gurultuTuvali(boy, fn) {
    const c = document.createElement('canvas'); c.width = c.height = boy; const g = c.getContext('2d');
    const im = g.createImageData(boy, boy); fn(im.data, boy); g.putImageData(im, 0, 0); return c;
  }
  function dokulariKur() {
    if (doku.hazir) return;
    const r = tohumla(77);
    doku.cilt = gurultuTuvali(96, (a) => { for (let i = 0; i < a.length; i += 4) { const v = r(); const k = v < .5 ? 90 : 255; a[i] = a[i + 1] = a[i + 2] = k; a[i + 3] = v < .5 ? 4 + r() * 9 : 3 + r() * 7; } });
    doku.mat = gurultuTuvali(48, (a) => { for (let i = 0; i < a.length; i += 4) { const v = 120 + r() * 135; a[i] = a[i + 1] = a[i + 2] = v; a[i + 3] = 16 + r() * 18; } });
    doku.havlu = (() => { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); for (let k = 0; k < 70; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(150,110,120,.12)'; g.beginPath(); g.arc(r() * 24, r() * 24, .7 + r() * 1.3, 0, Math.PI * 2); g.fill(); } return c; })();
    doku.sunger = gurultuTuvali(64, (a, b) => { for (let y = 0; y < b; y++) for (let x = 0; x < b; x++) { const i = (y * b + x) * 4; const v = r(); a[i] = a[i + 1] = a[i + 2] = 255; a[i + 3] = v > .58 ? 255 * (v - .58) / .42 : 0; } });
    doku.hazir = true;
  }

  /* ------------------------------------------------------------ stüdyo arka planı (sahne koordinatı) */
  function zeminCiz(g, zemin, rnd) {
    if (zemin === 'ahsap') {
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#F1DFCB'); gr.addColorStop(1, '#E2C6A8'); g.fillStyle = gr; g.fillRect(-400, -400, W + 800, H + 800);
      for (let y = -40; y < H + 40; y += 3 + rnd() * 5) { g.strokeStyle = 'rgba(150,100,60,' + (.04 + rnd() * .08) + ')'; g.lineWidth = .6 + rnd() * 1.4; g.beginPath(); g.moveTo(-40, y); g.bezierCurveTo(W * .3, y + (rnd() - .5) * 14, W * .7, y + (rnd() - .5) * 14, W + 40, y + (rnd() - .5) * 8); g.stroke(); }
      for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(140,90,50,.08)'; g.lineWidth = 1; const x = rnd() * W, y = rnd() * H; for (let q = 1; q < 5; q++) { g.beginPath(); g.ellipse(x, y, 10 * q, 3.5 * q, 0, 0, Math.PI * 2); g.stroke(); } }
      return;
    }
    if (zemin === 'saten') {
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#F7D8E2'); gr.addColorStop(.5, '#EFC0D0'); gr.addColorStop(1, '#F6D2DE'); g.fillStyle = gr; g.fillRect(-400, -400, W + 800, H + 800);
      for (let k = 0; k < 9; k++) { const x = -60 + k * 55 + rnd() * 20; const lg = g.createLinearGradient(x - 30, 0, x + 30, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,' + (.18 + rnd() * .2) + ')'); lg.addColorStop(1, 'rgba(160,80,110,.10)'); g.fillStyle = lg; g.save(); g.translate(x, H / 2); g.rotate(.35 + rnd() * .2); g.fillRect(-30, -H, 60, H * 2); g.restore(); }
      return;
    }
    if (zemin === 'havlu') {
      g.fillStyle = '#F4DCE0'; g.fillRect(-400, -400, W + 800, H + 800);
      g.fillStyle = g.createPattern(doku.havlu, 'repeat'); g.fillRect(-400, -400, W + 800, H + 800);
      return;
    }
    // pembe mermer
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#FBF1F0'); gr.addColorStop(1, '#F3E1E1'); g.fillStyle = gr; g.fillRect(-400, -400, W + 800, H + 800);
    for (let k = 0; k < 14; k++) {
      g.strokeStyle = k % 3 ? 'rgba(190,150,160,' + (.06 + rnd() * .1) + ')' : 'rgba(205,170,120,' + (.08 + rnd() * .08) + ')';
      g.lineWidth = .4 + rnd() * 1.6; g.beginPath(); let x = rnd() * W, y = -20; g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { const nx = x + (rnd() - .4) * 120, ny = y + 60 + rnd() * 70; g.quadraticCurveTo(x + (rnd() - .5) * 80, (y + ny) / 2, nx, ny); x = nx; y = ny; }
      g.stroke();
    }
  }
  function sisheCiz(g, x, y, s, renk, don, kapak) {
    g.save(); g.translate(x, y); g.rotate(don); g.scale(s, s);
    // gölge
    g.fillStyle = 'rgba(90,50,60,.18)'; g.beginPath(); g.ellipse(6, 30, 26, 8, 0, 0, Math.PI * 2); g.fill();
    // cam gövde
    const cam = new Path2D(); cam.moveTo(-20, -6); cam.quadraticCurveTo(-24, -6, -24, 0); cam.lineTo(-24, 24); cam.quadraticCurveTo(-24, 32, -16, 32); cam.lineTo(16, 32); cam.quadraticCurveTo(24, 32, 24, 24); cam.lineTo(24, 0); cam.quadraticCurveTo(24, -6, 20, -6); cam.closePath();
    const lg = g.createLinearGradient(-24, 0, 24, 0); lg.addColorStop(0, koyu(renk, .25)); lg.addColorStop(.35, renk); lg.addColorStop(.7, acik(renk, .12)); lg.addColorStop(1, koyu(renk, .3));
    g.fillStyle = lg; g.fill(cam);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-24, -6, 48, 7);       // ojenin üstündeki hava boşluğu
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2; g.stroke(cam);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.roundRect ? g.roundRect(-19, 0, 5, 26, 3) : g.rect(-19, 0, 5, 26); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(12, 2, 3, 24);
    // boyun + kapak
    g.fillStyle = '#E9E2E6'; g.fillRect(-8, -12, 16, 7);
    const kg = g.createLinearGradient(-10, 0, 10, 0);
    const kr = kapak || '#2A2530'; kg.addColorStop(0, koyu(kr, .2)); kg.addColorStop(.35, acik(kr, .35)); kg.addColorStop(.6, kr); kg.addColorStop(1, koyu(kr, .4));
    g.fillStyle = kg; g.beginPath(); g.roundRect ? g.roundRect(-10, -54, 20, 43, 4) : g.rect(-10, -54, 20, 43); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-6, -51, 2.5, 36);
    g.restore();
  }
  function damlaliksCiz(g, x, y, s, don) {
    g.save(); g.translate(x, y); g.rotate(don); g.scale(s, s);
    g.fillStyle = 'rgba(90,50,60,.16)'; g.beginPath(); g.ellipse(5, 34, 20, 7, 0, 0, Math.PI * 2); g.fill();
    const lg = g.createLinearGradient(-16, 0, 16, 0); lg.addColorStop(0, '#B57A2E'); lg.addColorStop(.4, '#F2C46A'); lg.addColorStop(.75, '#E0A548'); lg.addColorStop(1, '#9A6224');
    g.fillStyle = lg; g.beginPath(); g.roundRect ? g.roundRect(-16, -4, 32, 38, 7) : g.rect(-16, -4, 32, 38); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(-11, 8, 22, 12); g.fillStyle = '#C98B95'; g.font = '700 7px sans-serif'; g.textAlign = 'center'; g.fillText('yağ', 0, 17);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-13, 0, 3, 28);
    g.fillStyle = '#F4F0F2'; g.fillRect(-7, -10, 14, 7);
    const pg = g.createRadialGradient(-3, -22, 1, 0, -18, 11); pg.addColorStop(0, '#FFFFFF'); pg.addColorStop(1, '#2A2530');
    g.fillStyle = pg; g.beginPath(); g.ellipse(0, -19, 8, 11, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function torpuNesnesi(g, x, y, s, don) {
    g.save(); g.translate(x, y); g.rotate(don); g.scale(s, s);
    g.fillStyle = 'rgba(90,50,60,.15)'; g.beginPath(); g.roundRect ? g.roundRect(-58, -4, 120, 16, 8) : g.rect(-58, -4, 120, 16); g.fill();
    const lg = g.createLinearGradient(0, -8, 0, 8); lg.addColorStop(0, '#F7C7D3'); lg.addColorStop(1, '#E59AAF');
    g.fillStyle = lg; g.beginPath(); g.roundRect ? g.roundRect(-60, -8, 120, 15, 7) : g.rect(-60, -8, 120, 15); g.fill();
    g.fillStyle = g.createPattern(doku.mat, 'repeat'); g.globalAlpha = .9; g.fill(); g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-56, -6, 112, 2);
    g.restore();
  }
  function pamukCiz(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(90,50,60,.14)'; g.beginPath(); g.ellipse(3, 6, 20, 9, 0, 0, Math.PI * 2); g.fill();
    const rg = g.createRadialGradient(-5, -5, 2, 0, 0, 20); rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(1, '#ECE3E8');
    g.fillStyle = rg; g.beginPath(); g.ellipse(0, 0, 19, 17, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(200,180,190,.5)'; g.lineWidth = .6; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(0, 0, 15 - k * 4, 13 - k * 4, 0, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
  function fincanCiz(g, taraf) {
    g.save(); if (taraf === 'sol') { g.translate(W, 0); g.scale(-1, 1); }
    const x = 170, y = 260;
    g.fillStyle = 'rgba(90,50,60,.22)'; g.beginPath(); g.ellipse(x + 12, y + 118, 110, 22, 0, 0, Math.PI * 2); g.fill();
    // tabak
    const tg = g.createRadialGradient(x - 20, y + 104, 10, x, y + 110, 120); tg.addColorStop(0, '#FFFFFF'); tg.addColorStop(1, '#E9DDE3');
    g.fillStyle = tg; g.beginPath(); g.ellipse(x, y + 110, 118, 24, 0, 0, Math.PI * 2); g.fill();
    // gövde
    const gv = new Path2D(); gv.moveTo(x - 78, y - 60); gv.lineTo(x + 78, y - 60); gv.bezierCurveTo(x + 78, y + 40, x + 60, y + 104, x, y + 104); gv.bezierCurveTo(x - 60, y + 104, x - 78, y + 40, x - 78, y - 60); gv.closePath();
    const lg = g.createLinearGradient(x - 78, 0, x + 78, 0); lg.addColorStop(0, '#E4D5DC'); lg.addColorStop(.3, '#FFFFFF'); lg.addColorStop(.7, '#F7EEF1'); lg.addColorStop(1, '#D7C3CC');
    g.fillStyle = lg; g.fill(gv);
    g.save(); g.clip(gv); g.fillStyle = 'rgba(238,138,170,.35)'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(x - 60 + k * 20, y + 10 + (k % 2) * 16, 4, 0, Math.PI * 2); g.fill(); } g.restore();
    // ağız + kahve
    g.fillStyle = '#F2E9EC'; g.beginPath(); g.ellipse(x, y - 60, 78, 16, 0, 0, Math.PI * 2); g.fill();
    const kg = g.createRadialGradient(x - 16, y - 62, 2, x, y - 58, 70); kg.addColorStop(0, '#D9B08C'); kg.addColorStop(.6, '#A66E48'); kg.addColorStop(1, '#6E4128');
    g.fillStyle = kg; g.beginPath(); g.ellipse(x, y - 58, 70, 12, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,240,225,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 12, y - 58); g.bezierCurveTo(x - 4, y - 66, x + 6, y - 50, x + 14, y - 58); g.stroke();
    // buhar
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.lineCap = 'round';
    [[-24, 0], [10, 8]].forEach(([dx, dy]) => { g.beginPath(); g.moveTo(x + dx, y - 82 - dy); g.bezierCurveTo(x + dx - 14, y - 106 - dy, x + dx + 14, y - 122 - dy, x + dx, y - 146 - dy); g.stroke(); });
    g.restore();
  }
  function stdyoCiz(g, o) {
    const rnd = tohumla(o.zemin === 'mermer' ? 11 : 23);
    zeminCiz(g, o.zemin, rnd);
    // küçük havlu (el altında)
    if (o.zemin !== 'havlu' && o.poz === 'duz') {
      g.save(); g.translate(W / 2 + 6, 410); g.rotate(-.06);
      g.fillStyle = 'rgba(90,50,60,.16)'; g.beginPath(); g.roundRect ? g.roundRect(-150, -132, 306, 300, 22) : g.rect(-150, -132, 306, 300); g.fill();
      const hg = g.createLinearGradient(0, -130, 0, 170); hg.addColorStop(0, '#FBE7EA'); hg.addColorStop(1, '#F2CDD4');
      g.fillStyle = hg; g.beginPath(); g.roundRect ? g.roundRect(-154, -138, 304, 300, 22) : g.rect(-154, -138, 304, 300); g.fill();
      g.fillStyle = g.createPattern(doku.havlu, 'repeat'); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-154, -116, 304, 7); g.fillStyle = 'rgba(214,150,166,.45)'; g.fillRect(-154, -106, 304, 3);
      g.restore();
    }
    // ürünler
    const r1 = o.renkler[0] || '#F4CFD8', r2 = o.renkler[1] || '#B3122E';
    sisheCiz(g, 34, 66, .9, r1, -.08);
    sisheCiz(g, 82, 42, .7, r2, .1, '#E9D3A9');
    damlaliksCiz(g, 326, 80, .9, .12);
    if (o.poz !== 'fincan') { torpuNesnesi(g, 318, 448, .9, -1.1); pamukCiz(g, 40, 446, 1); pamukCiz(g, 58, 470, .8); }
    if (o.poz === 'fincan') fincanCiz(g, o.el);
  }
  function isikCiz(g, isik) {
    // vinyet + ışık rengi
    const vg = g.createRadialGradient(W * .42, H * .38, 40, W / 2, H / 2, W * .95);
    vg.addColorStop(0, isik === 'gun' ? 'rgba(255,244,226,.18)' : 'rgba(255,255,255,.12)'); vg.addColorStop(1, isik === 'los' ? 'rgba(30,14,40,.55)' : 'rgba(120,70,90,.18)');
    g.fillStyle = vg; g.fillRect(-400, -400, W + 800, H + 800);
    if (isik === 'los') { g.fillStyle = 'rgba(22,12,36,.42)'; g.fillRect(-400, -400, W + 800, H + 800); }
    if (isik === 'studyo') { const sg = g.createLinearGradient(0, 0, W, 0); sg.addColorStop(0, 'rgba(235,245,255,.14)'); sg.addColorStop(1, 'rgba(235,245,255,0)'); g.fillStyle = sg; g.fillRect(-400, -400, W + 800, H + 800); }
  }

  /* ------------------------------------------------------------ el çizimi */
  function parmakYolu(p) {
    const n = parmakEklemleri(p), gen = [p.w, p.w * .95, p.w * .9, p.w * .86];
    const nor = (k) => { const a = k === 0 ? p.a[0] : k === 3 ? p.a[2] : (p.a[k - 1] + p.a[k]) / 2; return { x: -Math.cos(a), y: -Math.sin(a) }; };
    const v0 = yon(p.a[0]), v3 = yon(p.a[2]);
    const taban = { x: n[0].x - v0.x * p.w * .7, y: n[0].y - v0.y * p.w * .7 };
    const r = gen[3] / 2, uc = { x: n[3].x - v3.x * r, y: n[3].y - v3.y * r };
    const sol = [], sag = [];
    const nokta = (o, nn, w) => ({ x: o.x + nn.x * w / 2, y: o.y + nn.y * w / 2 });
    const n0 = nor(0);
    sol.push(nokta(taban, n0, gen[0] * 1.02)); sag.push(nokta(taban, { x: -n0.x, y: -n0.y }, gen[0] * 1.02));
    for (let k = 0; k < 3; k++) { const nn = nor(k), w = gen[k] * (k ? 1.035 : 1); sol.push(nokta(n[k], nn, w)); sag.push(nokta(n[k], { x: -nn.x, y: -nn.y }, w)); }
    const n3 = nor(3); sol.push(nokta(uc, n3, gen[3])); sag.push(nokta(uc, { x: -n3.x, y: -n3.y }, gen[3]));
    const yol = new Path2D(), kenar = new Path2D();
    egriCiz(yol, sol, false, 'tasi'); egriCiz(kenar, sol.slice(1), false, 'tasi');
    const a0 = p.a[2] + Math.PI, a1 = p.a[2] + Math.PI * 2;
    yol.arc(uc.x, uc.y, r, a0, a1); kenar.arc(uc.x, uc.y, r, a0, a1);
    egriCiz(yol, sag.slice().reverse(), false, 'cizgi'); egriCiz(kenar, sag.slice(1).reverse(), false, 'cizgi');
    yol.closePath();
    return { yol, kenar, n, gen, uc, r };
  }
  function elCiz(g, o, ten, V) {
    // el önce ayrı katmana çizilir (gölge + 'source-atop' gölgelendirme için). V: sahne → piksel dönüşümü
    const S = Math.hypot(V[0], V[1]);
    const c = tuvalHavuz('el', g.canvas.width, g.canvas.height), h = c.getContext('2d');
    h.setTransform(1, 0, 0, 1, 0, 0); h.globalCompositeOperation = 'source-over'; h.clearRect(0, 0, c.width, c.height); h.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]);
    uygulaG(h, o.m);
    const ps = o.parmaklar.map(parmakYolu);
    const avuc = new Path2D(); egriCiz(avuc, AVUC.map(a => ({ x: a[0], y: a[1] })), true);
    // 1) siluet
    h.fillStyle = ten;
    for (let i = 1; i < 5; i++) h.fill(ps[i].yol);
    h.fill(avuc); h.fill(ps[0].yol);
    // 2) gölgelendirme (yalnız ten piksellerine)
    h.globalCompositeOperation = 'source-atop';
    const kz = koyu(ten, .38), ak = acik(ten, .4), kirmizi = karis(ten, '#E0707A', .45);
    const rg = h.createRadialGradient(175, 360, 10, 195, 380, 190); rg.addColorStop(0, rgba(ak, .32)); rg.addColorStop(.55, rgba(ten, 0)); rg.addColorStop(1, rgba(kz, .28));
    h.fillStyle = rg; h.fillRect(-200, -200, 800, 900);
    // tendonlar ve damarlar
    h.lineCap = 'round';
    [[150, 292], [190, 284], [229, 292], [264, 310]].forEach(([x, y], k) => {
      h.strokeStyle = rgba(ak, .1); h.lineWidth = 7; h.beginPath(); h.moveTo(182 + k * 12, 470); h.quadraticCurveTo((x + 190) / 2, 400, x, y + 14); h.stroke();
      h.strokeStyle = rgba(kz, .035); h.lineWidth = 3; h.beginPath(); h.moveTo(186 + k * 12, 470); h.quadraticCurveTo((x + 196) / 2, 400, x + 4, y + 16); h.stroke();
    });
    h.strokeStyle = 'rgba(110,120,170,.04)'; h.lineWidth = 4;
    h.beginPath(); h.moveTo(160, 470); h.bezierCurveTo(176, 420, 214, 400, 236, 340); h.stroke();
    h.beginPath(); h.moveTo(250, 470); h.bezierCurveTo(240, 420, 246, 380, 258, 350); h.stroke();
    // eklem tümsekleri (MCP)
    [[150, 296], [190, 288], [229, 296], [264, 314]].forEach(([x, y]) => {
      const kg = h.createRadialGradient(x - 3, y - 2, 1, x, y, 16); kg.addColorStop(0, rgba(ak, .5)); kg.addColorStop(1, rgba(ak, 0));
      h.fillStyle = kg; h.beginPath(); h.ellipse(x, y, 16, 11, 0, 0, Math.PI * 2); h.fill();
      h.strokeStyle = rgba(kz, .18); h.lineWidth = .9; h.beginPath(); h.arc(x, y + 8, 7, Math.PI * 1.15, Math.PI * 1.85); h.stroke();
    });
    // parmaklar: silindir ışığı, kenar gölgesi, boğum kırışıkları, kırmızımsı uç
    ps.forEach((q, i) => {
      const p = o.parmaklar[i], n = q.n;
      [[.55, .07], [.32, .08], [.14, .1]].forEach(([k, a]) => {
        h.strokeStyle = rgba(ak, a); h.lineWidth = p.w * k; h.beginPath();
        for (let j = 0; j < 4; j++) { const aa = p.a[Math.min(2, j)], ox = -Math.cos(aa) * p.w * .14, oy = -Math.sin(aa) * p.w * .14; if (j) h.lineTo(n[j].x + ox, n[j].y + oy); else h.moveTo(n[j].x + ox, n[j].y + oy); }
        h.stroke();
      });
      [[.5, .06], [.3, .08], [.14, .1], [.05, .14]].forEach(([k, a]) => { h.strokeStyle = rgba(kz, a); h.lineWidth = p.w * k; h.stroke(q.kenar); });
      [1, 2].forEach(j => {
        const aa = (p.a[j - 1] + p.a[j]) / 2, nx = -Math.cos(aa), ny = -Math.sin(aa), vx = Math.sin(aa), vy = -Math.cos(aa), w = q.gen[j];
        h.fillStyle = rgba(kirmizi, .14); h.beginPath(); h.ellipse(n[j].x, n[j].y, w * .4, w * .26, aa, 0, Math.PI * 2); h.fill();
        h.strokeStyle = rgba(kz, j === 1 ? .26 : .2); h.lineWidth = .8;
        for (let s = -1; s <= 1; s++) {
          const cx = n[j].x + vx * s * 2.6, cy = n[j].y + vy * s * 2.6, ww = w * (.32 - Math.abs(s) * .07);
          h.beginPath(); h.moveTo(cx + nx * ww, cy + ny * ww); h.quadraticCurveTo(cx + vx * 1.6, cy + vy * 1.6, cx - nx * ww, cy - ny * ww); h.stroke();
        }
      });
      const ug = h.createRadialGradient(q.uc.x, q.uc.y, 1, q.uc.x, q.uc.y, q.r * 1.8); ug.addColorStop(0, rgba(kirmizi, .3)); ug.addColorStop(1, rgba(kirmizi, 0));
      h.fillStyle = ug; h.beginPath(); h.arc(q.uc.x, q.uc.y, q.r * 1.8, 0, Math.PI * 2); h.fill();
    });
    // avuç kenarı ve baş parmak teması
    [[26, .05], [14, .06], [6, .08], [2, .12]].forEach(([w, a]) => { h.strokeStyle = rgba(kz, a); h.lineWidth = w; h.stroke(avuc); });
    // cilt dokusu
    h.globalCompositeOperation = 'source-atop';
    h.fillStyle = h.createPattern(doku.cilt, 'repeat'); h.save(); h.setTransform(S * .5, 0, 0, S * .5, 0, 0); h.fillRect(0, 0, c.width / (S * .5), c.height / (S * .5)); h.restore();
    h.globalCompositeOperation = 'source-over';
    // örgü kol ağzı
    if (o.kol) {
      h.save(); uygulaG(h, [1, 0, 0, 1, 0, 0]);
      const kol = new Path2D(); kol.moveTo(116, 452); kol.quadraticCurveTo(200, 440, 300, 452); kol.lineTo(312, 560); kol.lineTo(104, 560); kol.closePath();
      h.fillStyle = 'rgba(70,40,60,.22)'; h.save(); h.translate(0, -5); h.fill(kol); h.restore();
      const kg = h.createLinearGradient(110, 0, 310, 0); kg.addColorStop(0, '#CDBDE8'); kg.addColorStop(.45, '#E6DBF7'); kg.addColorStop(1, '#BBA8DE');
      h.fillStyle = kg; h.fill(kol);
      h.save(); h.clip(kol); h.strokeStyle = 'rgba(120,90,160,.22)'; h.lineWidth = 3;
      for (let x = 112; x < 312; x += 9) { h.beginPath(); h.moveTo(x, 440); h.lineTo(x + 2, 560); h.stroke(); }
      h.strokeStyle = 'rgba(255,255,255,.35)'; h.lineWidth = 1.2; for (let x = 116; x < 312; x += 9) { h.beginPath(); h.moveTo(x, 444); h.lineTo(x + 2, 560); h.stroke(); }
      h.restore(); h.restore();
    }
    // sahneye: yumuşak gölgeyle
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.shadowColor = 'rgba(80,36,52,.30)'; g.shadowBlur = 16 * S; g.shadowOffsetX = 3 * S; g.shadowOffsetY = 9 * S;
    g.drawImage(c, 0, 0); g.restore();
  }
  /* geçici tuval havuzu (her boyut/anahtar için tek tuval) */
  const havuz = new Map();
  function tuvalHavuz(ad, w, h) {
    let c = havuz.get(ad);
    if (!c) { c = document.createElement('canvas'); havuz.set(ad, c); }
    if (c.width !== w || c.height !== h) { c.width = Math.max(1, w); c.height = Math.max(1, h); }
    return c;
  }

  /* ------------------------------------------------------------ tırnak katmanları
     g: dönüşümü kütikül merkezine kurulmuş bağlam (birim: sahne; o.S: piksel/birim)
     o: { S, ten, hz (hazırlık dilimi | null), isikAci, los, anim, sicak, secim } */
  const KAT_ALFA = { krem: [0, .8, .95, 1], neon: [0, .82, .96, 1], metalik: [0, .85, .97, 1], kediGozu: [0, .9, .98, 1], termal: [0, .8, .95, 1], glow: [0, .78, .93, 1], jelly: [0, .42, .62, .8], sheer: [0, .3, .45, .6], simInce: [0, .3, .45, .62], simIri: [0, .3, .48, .66], simHolo: [0, .28, .44, .6] };
  function puruzluYol(nw, L, puruz, seed) {
    const p = new Path2D(), hw = nw / 2, rnd = tohumla(seed), r = hw;
    p.moveTo(-hw, 0); p.lineTo(-hw, -L + r);
    const n = 14;
    for (let k = 0; k <= n; k++) { const a = Math.PI + Math.PI * k / n, j = (rnd() - .5) * puruz * nw * .22 + (k % 3 === 0 ? -puruz * nw * .08 : 0); p.lineTo(Math.cos(a) * (r + j * .3), -L + r + Math.sin(a) * (r + j)); }
    p.lineTo(hw, 0); p.quadraticCurveTo(0, nw * .4, -hw, 0); p.closePath();
    return p;
  }
  function tirnakCiz(g, t, nw, o) {
    const S = o.S || 1, hw = nw / 2, yatak = nw * 1.28, L = tirnakBoyu(t, nw), seed = (t.tohum || 1) + (o.i || 0) * 131;
    const hz = o.hz, ten = o.ten || VARSAYILAN_TEN, ph = o.isikAci == null ? .8 : o.isikAci;
    const yol = (hz && hz.torpu < .999) ? puruzluYol(nw, L, (1 - hz.torpu) * (hz.puruz == null ? 1 : hz.puruz), seed) : tirnakYol2D(t.sekil, nw, L);
    const kutu = () => g.fillRect(-hw - 2, -L - 2, nw + 4, L + nw);
    const yatakRenk = karis(ten, '#E99AA6', .48);
    // 0) serbest kenarın gölgesi / parlayan oje ışıması
    g.save();
    const parlayan = t.renk && t.ojeTur === 'glow' && o.los;
    g.shadowColor = parlayan ? rgba(t.renk, .95) : 'rgba(70,24,44,.32)'; g.shadowBlur = (parlayan ? 14 : 3) * S; g.shadowOffsetY = parlayan ? 0 : 1.6 * S;
    g.fillStyle = yatakRenk; g.fill(yol); g.restore();
    if (t.renk && t.ojeTur === 'neon') { g.save(); g.shadowColor = rgba(t.renk, .45); g.shadowBlur = 6 * S; g.fillStyle = rgba(t.renk, .01); g.fill(yol); g.restore(); }
    g.save(); g.clip(yol);
    // 1) doğal tırnak: yatak, yarım ay (lunula), serbest kenar beyazı, uzunlamasına çizgiler
    const yg = g.createLinearGradient(0, nw * .3, 0, -yatak); yg.addColorStop(0, koyu(yatakRenk, .06)); yg.addColorStop(.6, yatakRenk); yg.addColorStop(1, acik(yatakRenk, .14));
    g.fillStyle = yg; kutu();
    const lg = g.createRadialGradient(0, nw * .14, 1, 0, nw * .14, hw * .78); lg.addColorStop(0, 'rgba(255,248,246,.5)'); lg.addColorStop(.75, 'rgba(255,248,246,.32)'); lg.addColorStop(1, 'rgba(255,248,246,0)');
    g.fillStyle = lg; g.beginPath(); g.ellipse(0, nw * .14, hw * .72, nw * .34, 0, 0, Math.PI * 2); g.fill();
    // serbest kenar (gülümseme çizgisi üstü)
    const gy = -yatak + nw * .06;
    g.beginPath(); g.moveTo(-hw - 2, gy + nw * .24); g.quadraticCurveTo(0, gy - nw * .2, hw + 2, gy + nw * .24); g.lineTo(hw + 2, -L - 2); g.lineTo(-hw - 2, -L - 2); g.closePath();
    g.fillStyle = t.protez === 'tips' ? 'rgba(255,246,242,.62)' : t.protez === 'polygel' ? 'rgba(255,232,236,.82)' : t.protez === 'builder' ? 'rgba(255,248,250,.55)' : 'rgba(255,250,245,.8)'; g.fill();
    g.strokeStyle = rgba(koyu(yatakRenk, .12), .5); g.lineWidth = nw * .035; g.beginPath(); g.moveTo(-hw - 2, gy + nw * .27); g.quadraticCurveTo(0, gy - nw * .17, hw + 2, gy + nw * .27); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = .5;
    for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(k * hw * .27, nw * .2); g.lineTo(k * hw * .3, -L); g.stroke(); }
    // 2) hazırlık izleri
    if (hz) hazirlikKatmani(g, t, nw, L, hz, seed);
    // 3) taban
    const baz = BAZLAR.find(b => b.id === t.baz);
    if (baz && baz.renk) { g.fillStyle = baz.renk; kutu(); }
    // 4) renk
    if (t.renk && t.kat > 0) ojeKatmani(g, t, nw, L, o, seed, ph);
    // 5) teknik, su mermeri, desen, damga
    teknikCiz(g, t, nw, L, seed, ph, o);
    if (t.suMermer) suMermerCiz(g, t, nw, L, S);
    if (t.desen) desenCiz(g, t.desen, nw, L, seed);
    t.damgalar.forEach(dm => damgaCiz(g, dm, nw, L));
    // 6) fırça/sünger/folyo/nokta katmanı
    if (t.firca.length) sanatKatmani(g, t, nw, L, S, seed);
    // 7) çıkartmalar
    t.cikartmalar.forEach(c => { g.save(); g.translate(c.x * hw, -c.y * L); g.rotate(c.don || 0); const f = CIKARTMA_CIZ[c.id]; if (f) f(g, (c.olcek || .5) * nw, c.renk || '#FFFFFF'); g.restore(); });
    // 8) krom tozu / efekt
    efektCiz(g, t, nw, L, ph, seed);
    // 9) hacim: yan duvarlar (C eğrisi) ve dip gölgesi
    const vg = g.createLinearGradient(-hw, 0, hw, 0);
    vg.addColorStop(0, 'rgba(70,30,50,.26)'); vg.addColorStop(.2, 'rgba(70,30,50,0)'); vg.addColorStop(.74, 'rgba(70,30,50,0)'); vg.addColorStop(1, 'rgba(70,30,50,.32)');
    g.fillStyle = vg; kutu();
    const cg = g.createLinearGradient(0, nw * .3, 0, -nw * .25); cg.addColorStop(0, 'rgba(70,30,50,.24)'); cg.addColorStop(1, 'rgba(70,30,50,0)');
    g.fillStyle = cg; g.fillRect(-hw - 2, -nw * .25, nw + 4, nw * .6);
    // 10) üst kat / doğal parlaklık
    ustKatmani(g, t, nw, L, hz, ph, o);
    if (o.los && t.ojeTur !== 'glow') { g.fillStyle = 'rgba(22,12,36,.36)'; kutu(); }
    // 11) kürlenmemiş jel: yapışkan ıslak görünüm
    if (yapiskanMi(t)) {
      g.globalAlpha = .55; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = nw * .05; const r = tohumla(seed + 5);
      for (let k = 0; k < 5; k++) { g.beginPath(); const x = (r() * 2 - 1) * hw * .7, y = -r() * L; g.moveTo(x, y); g.bezierCurveTo(x + hw * .3, y - L * .08, x - hw * .3, y - L * .14, x + (r() - .5) * hw * .4, y - L * .22); g.stroke(); }
      g.globalAlpha = 1;
    }
    // 12) oje sürme animasyonu: fırça
    g.restore();
    // kenar ve serbest kenar kalınlığı
    g.strokeStyle = 'rgba(80,40,60,.22)'; g.lineWidth = .7; g.stroke(yol);
    g.save(); g.clip(yol); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = nw * .05; g.translate(0, nw * .04); g.stroke(yol); g.restore();
    // 13) deri kıvrımları: kütikül + yan kıvrımlar (tırnağın dibini ve yanlarını hafifçe örter)
    kivrimCiz(g, nw, o.los ? karis(ten, '#2A1B33', .45) : ten, hz, t, S);
    // 14) 3D süsler (kırpma yok)
    t.susler.forEach(s => { g.save(); g.translate(s.x * hw, -s.y * L); g.rotate(s.don || 0); const f = SUS_CIZ[s.id]; if (f) f(g, (s.olcek || .3) * nw, s.renk || '#FFFFFF', S); g.restore(); });
    if (o.anim && o.anim.tur === 'oje' && t.renk) {
      const p = o.anim.p, kul = [[0, 0], [-2 / 3, .18], [2 / 3, .36]];
      for (const [kx, bas] of kul) { const lp = (p - bas) / .58; if (lp > 0 && lp < 1) { fircaSprite(g, kx * hw, -L * lp, t.renk, hw); break; } }
    }
  }
  function yapiskanMi(t) { return !!(t.kur && (t.kur.baz === false || t.kur.renk === false || t.kur.top === false)); }
  function kivrimCiz(g, nw, ten, hz, t, S) {
    const hw = nw / 2, yatak = nw * 1.28;
    const deri = karis(ten, '#E6A0A0', .12);
    // yan kıvrımlar
    [-1, 1].forEach(s => {
      const yg = g.createLinearGradient(0, 0, 0, -yatak * .9); yg.addColorStop(0, rgba(deri, .95)); yg.addColorStop(.8, rgba(deri, .5)); yg.addColorStop(1, rgba(deri, 0));
      g.strokeStyle = yg; g.lineWidth = nw * .09; g.lineCap = 'round';
      g.beginPath(); g.moveTo(s * (hw + nw * .03), nw * .05); g.quadraticCurveTo(s * (hw + nw * .05), -yatak * .5, s * (hw + nw * .02), -yatak * .88); g.stroke();
      g.strokeStyle = 'rgba(90,40,55,.16)'; g.lineWidth = nw * .025;
      g.beginPath(); g.moveTo(s * (hw - nw * .02), 0); g.quadraticCurveTo(s * (hw - nw * .01), -yatak * .5, s * (hw - nw * .03), -yatak * .82); g.stroke();
    });
    // proksimal kıvrım (kütikül derisi)
    const kv = new Path2D();
    kv.moveTo(-hw - nw * .12, -nw * .06); kv.quadraticCurveTo(0, nw * .34, hw + nw * .12, -nw * .06); kv.lineTo(hw + nw * .14, nw * .55); kv.lineTo(-hw - nw * .14, nw * .55); kv.closePath();
    const kg = g.createLinearGradient(0, nw * .06, 0, nw * .55); kg.addColorStop(0, deri); kg.addColorStop(.55, rgba(ten, .85)); kg.addColorStop(1, rgba(ten, 0));
    g.save(); g.shadowColor = 'rgba(80,30,50,.35)'; g.shadowBlur = 2.2 * S; g.shadowOffsetY = -.8 * S; g.fillStyle = kg; g.fill(kv); g.restore();
    // kütikül çizgisi: itilmemişse kalın ve beyazımsı, itilmiş + yağlıysa ince ve parlak
    const itildi = !hz || hz.kutikul > .95;
    g.strokeStyle = itildi ? 'rgba(255,236,236,.65)' : 'rgba(248,226,220,.9)'; g.lineWidth = itildi ? nw * .03 : nw * .07;
    g.beginPath(); g.moveTo(-hw * .92, -nw * .02); g.quadraticCurveTo(0, nw * .37, hw * .92, -nw * .02); g.stroke();
    if (hz && hz.yag > 0) {
      g.strokeStyle = 'rgba(255,214,120,' + (.35 * hz.yag) + ')'; g.lineWidth = nw * .1; g.beginPath(); g.moveTo(-hw * .8, nw * .03); g.quadraticCurveTo(0, nw * .42, hw * .8, nw * .03); g.stroke();
      g.fillStyle = 'rgba(255,255,255,' + (.6 * hz.yag) + ')'; g.beginPath(); g.ellipse(-hw * .35, nw * .14, nw * .08, nw * .03, -.3, 0, Math.PI * 2); g.fill();
    }
  }
  function hazirlikKatmani(g, t, nw, L, hz, seed) {
    const hw = nw / 2, rnd = tohumla(seed + 41);
    // eski oje (yıpranmış uçlar, silindikçe lekelenir)
    if (hz.eskiKalan > .01) {
      const a = Math.pow(hz.eskiKalan, .75);
      g.save(); g.globalAlpha = a; g.fillStyle = hz.eskiRenk; g.fillRect(-hw - 2, -L - 2, nw + 4, L + nw);
      g.globalAlpha = a * .5; g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-hw * .7, -L * .85, hw * .25, L * .6);
      g.restore();
      // uçta kopmuş parçalar (tırnak görünür)
      g.fillStyle = karis(o_ten(), '#F4D9D6', .6);
      for (let k = 0; k < 3; k++) { const x = (rnd() < .5 ? -1 : 1) * hw * (.5 + rnd() * .5), y = -L + rnd() * nw * .12, r = nw * (.05 + rnd() * .07); g.beginPath(); g.ellipse(x, y, r, r * .6, rnd() * 3, 0, Math.PI * 2); g.fill(); }
      if (hz.eskiKalan < .75) { g.globalAlpha = (1 - hz.eskiKalan) * .5; g.strokeStyle = hz.eskiRenk; g.lineWidth = nw * .1; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo((rnd() - .5) * nw, 0); g.lineTo((rnd() - .5) * nw, -L); g.stroke(); } g.globalAlpha = 1; }
      // dipte uzama payı: oje kütikülden uzaklaşmış
      g.fillStyle = karis(o_ten(), '#EBA9B2', .5); g.beginPath(); g.moveTo(-hw - 2, nw * .3); g.lineTo(-hw - 2, -nw * .1); g.quadraticCurveTo(0, nw * .14, hw + 2, -nw * .1); g.lineTo(hw + 2, nw * .3); g.closePath(); g.fill();
    }
    // kütikül zarı
    if (hz.kutikul < .99) {
      const y0 = -nw * (.04 + .2 * (1 - hz.kutikul));
      g.fillStyle = 'rgba(250,234,232,' + (.42 * (1 - hz.kutikul) + .06) + ')'; g.beginPath(); g.moveTo(-hw - 2, nw * .4);
      for (let k = 0; k <= 10; k++) { const x = -hw + nw * k / 10; g.lineTo(x, y0 + Math.sin(k * 1.7 + seed) * nw * .03 + Math.abs(x / hw) * nw * .16); }
      g.lineTo(hw + 2, nw * .4); g.closePath(); g.fill();
    }
    // matlık (parlatıcı öncesi)
    if (hz.parlak < .99 && doku.mat) { g.save(); g.globalAlpha = (1 - hz.parlak) * .9; g.fillStyle = g.createPattern(doku.mat, 'repeat'); g.fillRect(-hw - 2, -L - 2, nw + 4, L + nw); g.restore(); }
    // törpü tozu
    if (hz.toz > .02) { const n = Math.round(hz.toz * 46); for (let k = 0; k < n; k++) { g.fillStyle = 'rgba(255,255,255,' + (.5 + rnd() * .4) + ')'; g.beginPath(); g.arc((rnd() * 2 - 1) * hw, -L + rnd() * L * .7, nw * (.015 + rnd() * .03), 0, Math.PI * 2); g.fill(); } }
  }
  let tenSimdi = VARSAYILAN_TEN;
  const o_ten = () => tenSimdi;

  function ojeKatmani(g, t, nw, L, o, seed, ph) {
    const hw = nw / 2, tur = t.ojeTur, alfa = (KAT_ALFA[tur] || KAT_ALFA.krem)[t.kat] || 1;
    let renk = t.renk;
    if (tur === 'neon') renk = doygun(renk, 1.15);
    if (tur === 'glow' && o.los) renk = doygun(renk, 1.5);
    g.save();
    g.translate(0, -nw * .04);                       // kütikülde kıl payı boşluk: profesyonel sürüm
    // oje sürme animasyonu (üç şerit)
    if (o.anim && o.anim.tur === 'oje') {
      const p = o.anim.p, kul = [[-1 / 3, 1 / 3, 0], [-1, -1 / 3, .18], [1 / 3, 1, .36]];
      const kap = new Path2D(); kul.forEach(([a, b, bas]) => { const lp = sinir((p - bas) / .58, 0, 1); if (lp > 0) kap.rect(a * hw - 1, -L * lp - 2, (b - a) * hw + 2, L * lp + nw); });
      g.clip(kap);
    }
    const kutu = () => g.fillRect(-hw - 2, -L - 2, nw + 4, L + nw);
    if (tur === 'termal') {
      const sic = sinir(o.sicak || 0, 0, 1), r2 = t.renk2 || acik(t.renk, .55);
      const tg = g.createLinearGradient(0, 0, 0, -L); tg.addColorStop(0, renk); tg.addColorStop(sinir(.35 + sic * .55, 0, .98), renk); tg.addColorStop(sinir(.62 + sic * .37, .02, 1), r2); tg.addColorStop(1, r2);
      g.globalAlpha = alfa; g.fillStyle = tg; kutu();
    } else if (tur === 'metalik') {
      g.globalAlpha = alfa; metalik(g, hw, L, -.4, ph, renk);
      g.globalAlpha = alfa * .25; g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .4; const r = tohumla(seed + 9);
      for (let k = 0; k < 26; k++) { const x = (r() * 2 - 1) * hw; g.beginPath(); g.moveTo(x, nw * .2); g.lineTo(x + (r() - .5) * 2, -L); g.stroke(); }
    } else {
      g.globalAlpha = alfa; g.fillStyle = renk; kutu();
    }
    g.globalAlpha = 1;
    if (tur === 'jelly' || tur === 'sheer') {
      // jöle derinliği: kenarlar koyu, orta aydınlık; sheer sütlü
      const jg = g.createLinearGradient(-hw, 0, hw, 0); jg.addColorStop(0, rgba(koyu(renk, .35), tur === 'jelly' ? .4 : .12)); jg.addColorStop(.45, rgba(acik(renk, .3), tur === 'jelly' ? .25 : .2)); jg.addColorStop(1, rgba(koyu(renk, .4), tur === 'jelly' ? .45 : .14));
      g.fillStyle = jg; kutu();
      if (tur === 'sheer') { g.fillStyle = 'rgba(255,255,255,' + (.06 * t.kat) + ')'; kutu(); }
    }
    if (tur === 'krem' && t.kat === 1) {
      // tek katta fırça izleri görünür
      const r = tohumla(seed + 2); g.strokeStyle = rgba(koyu(renk, .2), .14); g.lineWidth = nw * .06;
      for (let k = 0; k < 6; k++) { const x = (r() * 2 - 1) * hw * .9; g.beginPath(); g.moveTo(x, nw * .2); g.quadraticCurveTo(x + (r() - .5) * hw * .3, -L * .5, x + (r() - .5) * hw * .2, -L); g.stroke(); }
    }
    if (tur === 'neon') { const ng = g.createRadialGradient(0, -L * .45, 0, 0, -L * .45, L * .7); ng.addColorStop(0, 'rgba(255,255,255,.18)'); ng.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = ng; kutu(); }
    if (tur === 'glow' && o.los) { g.globalCompositeOperation = 'lighter'; const gg = g.createRadialGradient(0, -L * .5, 0, 0, -L * .5, L * .8); gg.addColorStop(0, rgba(renk, .32)); gg.addColorStop(1, rgba(renk, 0)); g.fillStyle = gg; kutu(); g.globalCompositeOperation = 'source-over'; }
    if (tur === 'simInce' || tur === 'simIri' || tur === 'simHolo') simKatmani(g, hw, L, tohumla(seed + 17), ph, tur, renk, t.kat);
    if (tur === 'kediGozu') kediBandi(g, hw, L, t.kedi || { x: 0, y: .5, aci: -.5, gen: .5 }, renk, seed);
    g.restore();
  }
  function simKatmani(g, hw, L, rnd, ph, tur, renk, kat) {
    const iri = tur === 'simIri', holo = tur === 'simHolo', n = (iri ? 46 : holo ? 70 : 220) * kat;
    for (let k = 0; k < n; k++) {
      const x = (rnd() * 2 - 1) * hw * 1.05, y = -rnd() * L * 1.02 + hw * .1;
      if (iri || holo) {
        const r = hw * (iri ? .07 + rnd() * .08 : .045 + rnd() * .05), a = rnd() * Math.PI;
        const isik = .5 + .5 * Math.cos(a * 2 + ph * 2 + x * .2);
        g.fillStyle = holo ? 'hsl(' + Math.round((a * 115 + ph * 60 + y * 2) % 360) + ',90%,' + (60 + isik * 25) + '%)' : (isik > .78 ? '#FFFFFF' : isik > .45 ? acik(renk, .45) : koyu(renk, .2));
        g.globalAlpha = .65 + rnd() * .35;
        g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); for (let s = 0; s < 6; s++) { const aa = s * Math.PI / 3; g.lineTo(Math.cos(aa) * r, Math.sin(aa) * r); } g.closePath(); g.fill(); g.restore();
      } else {
        g.globalAlpha = .35 + rnd() * .6; g.fillStyle = k % 4 === 0 ? '#FFFFFF' : acik(renk, .25 + rnd() * .4);
        g.fillRect(x, y, .55 + rnd() * .5, .55 + rnd() * .5);
      }
    }
    if (!iri) for (let k = 0; k < 6; k++) { const x = (rnd() * 2 - 1) * hw * .8, y = -rnd() * L; g.globalAlpha = .35 + .65 * Math.abs(Math.sin(ph * 2.2 + k * 1.7)); yildiz4(g, x, y, hw * (.1 + rnd() * .1)); }
    g.globalAlpha = 1;
  }
  function kediBandi(g, hw, L, k, renk, seed) {
    const acikZemin = parlaklik(renk) > 150;
    g.fillStyle = acikZemin ? 'rgba(90,80,100,.12)' : 'rgba(0,0,0,.28)'; g.fillRect(-hw - 2, -L - 2, hw * 2 + 4, L + hw * 3);
    g.save(); g.translate(k.x * hw, -k.y * L); g.rotate(k.aci || 0);
    const gen = hw * (k.gen || .5) * 1.3;
    const bg = g.createLinearGradient(-gen, 0, gen, 0);
    const parl = acikZemin ? '255,255,255' : '235,240,255';
    bg.addColorStop(0, 'rgba(' + parl + ',0)'); bg.addColorStop(.4, 'rgba(' + parl + ',.35)'); bg.addColorStop(.5, 'rgba(' + parl + ',.9)'); bg.addColorStop(.6, 'rgba(' + parl + ',.35)'); bg.addColorStop(1, 'rgba(' + parl + ',0)');
    g.fillStyle = bg; g.fillRect(-gen, -L * 2, gen * 2, L * 4);
    const r = tohumla(seed + 23);
    for (let s = 0; s < 90; s++) { const x = (r() + r() - 1) * gen * .8, y = (r() * 2 - 1) * L * 1.2; g.globalAlpha = (1 - Math.abs(x) / gen) * (.5 + r() * .5); g.fillStyle = '#FFFFFF'; g.fillRect(x, y, .5, .5); }
    g.globalAlpha = 1; g.restore();
  }
  function fircaSprite(g, x, y, renk, hw) {
    g.save(); g.translate(x, y); g.rotate(.35);
    g.strokeStyle = '#3B3444'; g.lineWidth = hw * .22; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -hw * .4); g.lineTo(0, -hw * 2.8); g.stroke();
    g.fillStyle = renk; g.strokeStyle = 'rgba(59,52,68,.3)'; g.lineWidth = .6; g.beginPath(); g.ellipse(0, -hw * .1, hw * .24, hw * .5, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-hw * .06, -hw * .26, hw * .07, hw * .18, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function gulumseme(g, hw, L, k, stil) {
    const y = -L + L * k;
    g.beginPath();
    if (stil === 'v') { g.moveTo(-hw - 2, y + L * .02); g.lineTo(0, y - L * .14); g.lineTo(hw + 2, y + L * .02); }
    else { g.moveTo(-hw - 2, y + L * .12); g.quadraticCurveTo(0, y - L * .14, hw + 2, y + L * .12); }
    g.lineTo(hw + 2, -L - 4); g.lineTo(-hw - 2, -L - 4); g.closePath();
  }
  function teknikCiz(g, t, nw, L, seed, ph, o) {
    const tk = t.teknik; if (!tk || tk.id === 'yok') return;
    const hw = nw / 2, r2 = tk.renk2 || '#FFFFFF';
    switch (tk.id) {
      case 'french': {
        const stil = tk.stil || 'klasik', k = sinir(stil === 'mikro' ? Math.min(tk.kalinlik, .12) : tk.kalinlik, .06, .6);
        g.save(); gulumseme(g, hw, L, k, stil); g.fillStyle = r2; g.fill();
        if (stil === 'v') { g.strokeStyle = koyu(r2, .15); g.lineWidth = nw * .03; g.stroke(); }
        g.globalAlpha = .25; g.fillStyle = '#FFFFFF'; g.fillRect(-hw, -L, nw * .25, L * k * .8); g.restore(); break;
      }
      case 'yarimAy': {
        const k = sinir(tk.kalinlik, .1, .5);
        g.save(); g.fillStyle = r2; g.beginPath(); g.ellipse(0, nw * .18, hw * .82, nw * (.1 + k * 1.1), 0, 0, Math.PI * 2); g.fill(); g.restore(); break;
      }
      case 'ombre': { const grd = g.createLinearGradient(0, 0, 0, -L); grd.addColorStop(.12, rgba(r2, 0)); grd.addColorStop(.82, rgba(r2, 1)); g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); break; }
      case 'mermer': {
        const rnd = tohumla(seed + 7); g.strokeStyle = r2; g.lineCap = 'round';
        for (let k = 0; k < 6; k++) {
          g.globalAlpha = .35 + rnd() * .5; g.lineWidth = .5 + rnd() * 1.5; g.beginPath();
          let x = (rnd() * 2 - 1) * hw, y = -rnd() * L; g.moveTo(x, y);
          for (let s = 0; s < 4; s++) { const nx = x + (rnd() * 2 - 1) * hw, ny = y - rnd() * L * .3; g.quadraticCurveTo(x + (rnd() * 2 - 1) * hw * .8, y - rnd() * L * .25, nx, ny); x = nx; y = ny; }
          g.stroke();
        }
        for (let k = 0; k < 3; k++) { g.globalAlpha = .1 + rnd() * .12; g.fillStyle = r2; g.beginPath(); g.ellipse((rnd() * 2 - 1) * hw * .6, -rnd() * L, hw * .5, L * .12, rnd() * 3, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1; break;
      }
      case 'aura': {
        const cx = (tk.x || 0) * hw, cy = -(tk.y == null ? .5 : tk.y) * L, R = hw * (.6 + sinir(tk.kalinlik, .1, .9) * 1.6);
        const grd = g.createRadialGradient(cx, cy, 0, cx, cy, R); grd.addColorStop(0, rgba(r2, .95)); grd.addColorStop(.45, rgba(r2, .65)); grd.addColorStop(1, rgba(r2, 0));
        g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); break;
      }
      case 'glitter': { const rnd = tohumla(seed + 3); for (let k = 0; k < 120; k++) { const y = -L + rnd() * rnd() * L * 1.05, x = (rnd() * 2 - 1) * hw; g.globalAlpha = .4 + rnd() * .6; g.fillStyle = k % 3 ? r2 : '#FFFFFF'; g.beginPath(); g.arc(x, y, (.4 + rnd() * 1.2) * nw / 26, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; break; }
      case 'kromUc': { g.save(); gulumseme(g, hw, L, .36); g.clip(); g.fillStyle = r2; g.fillRect(-hw - 1, -L - 4, nw + 2, L + hw); metalik(g, hw, L, -.35, ph, r2); g.restore(); break; }
      case 'kromToz': { g.save(); g.globalAlpha = .62; metalik(g, hw, L, -.4, ph, karis(t.renk || '#E8E8EE', r2, .45)); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .5; const tg = g.createLinearGradient(-hw, -L, hw, 0); tg.addColorStop(0, 'rgba(255,255,255,0)'); tg.addColorStop(sinir(.5 + Math.sin(ph * .9) * .15, .1, .9), 'rgba(255,255,255,.9)'); tg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = tg; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); g.restore(); break; }
    }
  }
  /* su mermeri: damlalar eş merkezli halkalar; iğne çizgileri halkaları sürükler (piksel bazında ters bükme) */
  const mermerOnbellek = new Map();
  function suMermerCiz(g, t, nw, L, S) {
    const sm = t.suMermer; if (!sm || !Array.isArray(sm.damlalar) || !sm.damlalar.length) return;
    const hw = nw / 2, olc = Math.min(7, S), pw = Math.ceil((nw + 4) * olc), ph = Math.ceil((L + nw * .5 + 4) * olc);
    const anahtar = JSON.stringify(sm) + '|' + pw + 'x' + ph + '|' + nw.toFixed(1) + '|' + L.toFixed(1);
    let c = mermerOnbellek.get(anahtar);
    if (!c) {
      c = document.createElement('canvas'); c.width = pw; c.height = ph; const h = c.getContext('2d'); const im = h.createImageData(pw, ph), a = im.data;
      const halka = hw * .3;
      const damla = sm.damlalar.map(dm => ({ x: dm.x * hw, y: -dm.y * L, r: (dm.renkler || []).map(hexRgb) }));
      const cizgi = (sm.cizgiler || []).map(z => { const x1 = z[0] * hw, y1 = -z[1] * L, x2 = z[2] * hw, y2 = -z[3] * L, dx = x2 - x1, dy = y2 - y1, u = Math.hypot(dx, dy) || 1; return { x1, y1, ux: dx / u, uy: dy / u, u }; });
      for (let py = 0; py < ph; py++) for (let px = 0; px < pw; px++) {
        let x = px / olc - hw - 2, y = py / olc - L - 2;
        for (let k = cizgi.length - 1; k >= 0; k--) {
          const z = cizgi[k], rx = x - z.x1, ry = y - z.y1, boy = rx * z.ux + ry * z.uy, dik = Math.abs(rx * -z.uy + ry * z.ux);
          if (boy < -nw || boy > z.u + nw) continue;
          const kuvvet = hw * 1.1 * Math.exp(-dik / (hw * .35));
          x -= z.ux * kuvvet; y -= z.uy * kuvvet;
        }
        let renk = null;
        for (let k = damla.length - 1; k >= 0 && !renk; k--) { const dm = damla[k]; if (!dm.r.length) continue; const r = Math.hypot(x - dm.x, y - dm.y), idx = Math.floor(r / halka); if (idx < dm.r.length) renk = dm.r[idx]; }
        if (renk) { const i = (py * pw + px) * 4; a[i] = renk[0]; a[i + 1] = renk[1]; a[i + 2] = renk[2]; a[i + 3] = 245; }
      }
      h.putImageData(im, 0, 0);
      if (mermerOnbellek.size > 40) mermerOnbellek.clear();
      mermerOnbellek.set(anahtar, c);
    }
    g.drawImage(c, -hw - 2, -L - 2, pw / olc, ph / olc);
  }
  function desenCiz(g, ds, nw, L, seed) {
    const hw = nw / 2, renk = ds.renk || '#FFFFFF', rnd = tohumla(seed + 61);
    g.save(); g.fillStyle = renk; g.strokeStyle = renk;
    if (ds.id === 'puantiye') {
      const ad = nw * .3, r = nw * .07; let satir = 0;
      for (let y = nw * .2; y > -L - ad; y -= ad, satir++) for (let x = -hw + (satir % 2 ? ad / 2 : 0); x <= hw + ad; x += ad) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    } else if (ds.id === 'cizgi') {
      g.lineWidth = nw * .09; g.rotate(-.5);
      for (let y = -L * 1.6; y < L; y += nw * .3) { g.beginPath(); g.moveTo(-L, y); g.lineTo(L, y); g.stroke(); }
    } else if (ds.id === 'ekose') {
      g.globalAlpha = .55; g.lineWidth = nw * .14;
      for (let y = nw * .2; y > -L - nw; y -= nw * .42) { g.beginPath(); g.moveTo(-hw - 2, y); g.lineTo(hw + 2, y); g.stroke(); }
      for (let x = -hw + nw * .2; x <= hw; x += nw * .42) { g.beginPath(); g.moveTo(x, nw); g.lineTo(x, -L - 2); g.stroke(); }
      g.globalAlpha = .35; g.lineWidth = nw * .04;
      for (let y = nw * .2 - nw * .21; y > -L - nw; y -= nw * .42) { g.beginPath(); g.moveTo(-hw - 2, y); g.lineTo(hw + 2, y); g.stroke(); }
    } else if (ds.id === 'kaplumbaga') {
      for (let k = 0; k < 16; k++) { const x = (rnd() * 2 - 1) * hw, y = -rnd() * L, r = nw * (.1 + rnd() * .2); const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(renk, .85)); rg.addColorStop(.6, rgba(renk, .45)); rg.addColorStop(1, rgba(renk, 0)); g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, r, r * (.6 + rnd() * .6), rnd() * 3, 0, Math.PI * 2); g.fill(); }
      for (let k = 0; k < 8; k++) { const x = (rnd() * 2 - 1) * hw, y = -rnd() * L; g.fillStyle = 'rgba(40,18,8,.55)'; g.beginPath(); g.ellipse(x, y, nw * .05, nw * .035, rnd() * 3, 0, Math.PI * 2); g.fill(); }
    } else if (ds.id === 'cilek') {
      for (let y = nw * .1; y > -L; y -= nw * .22) for (let x = -hw + (Math.round(y) % 2 ? nw * .11 : 0); x < hw; x += nw * .22) { g.save(); g.translate(x + (rnd() - .5) * nw * .05, y); g.rotate(rnd() - .5); g.beginPath(); g.ellipse(0, 0, nw * .018, nw * .035, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
    } else if (ds.id === 'leoparDesen') {
      leoparCiz(g, nw * 1.2, L * 1.1, renk, rnd, -hw, -L);
    }
    g.restore();
  }
  function leoparCiz(g, w, h, renk, rnd, x0, y0) {
    const n = Math.round(w * h / 90);
    for (let k = 0; k < n; k++) {
      const x = x0 + rnd() * w, y = y0 + rnd() * h, r = 2.2 + rnd() * 2.2;
      g.fillStyle = rgba(karis(renk, '#C8935B', .55), .55); g.beginPath(); g.ellipse(x, y, r * .8, r * .6, rnd() * 3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = renk; g.lineWidth = r * .38; g.lineCap = 'round';
      for (let s = 0; s < 3; s++) { const a = rnd() * Math.PI * 2; g.beginPath(); g.arc(x, y, r, a, a + .7 + rnd() * .8); g.stroke(); }
    }
  }

  /* ------------------------------------------------------------ sanat katmanı (fırça, nokta, sünger, folyo, silgi) */
  const boyaliOnbellek = new Map();
  function boyaliSunger(renk) {
    let c = boyaliOnbellek.get('s' + renk); if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 64; const h = c.getContext('2d');
    h.drawImage(doku.sunger, 0, 0); h.globalCompositeOperation = 'source-in'; h.fillStyle = renk; h.fillRect(0, 0, 64, 64);
    boyaliOnbellek.set('s' + renk, c); return c;
  }
  function folyoDoku(renk) {
    let c = boyaliOnbellek.get('f' + renk); if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 48; const h = c.getContext('2d'); const r = tohumla(hexRgb(renk)[0] * 7 + 3);
    const holo = renk === '#D9D2FF';
    h.fillStyle = renk; h.fillRect(0, 0, 48, 48);
    for (let k = 0; k < 70; k++) {
      const x = r() * 48, y = r() * 48, s = 4 + r() * 10, a = r() * 6;
      h.fillStyle = holo ? 'hsla(' + Math.round(r() * 360) + ',90%,75%,.7)' : (r() < .5 ? rgba(acik(renk, .7), .7) : rgba(koyu(renk, .35), .55));
      h.beginPath(); h.moveTo(x, y); h.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); h.lineTo(x + Math.cos(a + 2) * s * .7, y + Math.sin(a + 2) * s * .7); h.closePath(); h.fill();
    }
    h.strokeStyle = 'rgba(255,255,255,.5)'; h.lineWidth = .5; for (let k = 0; k < 12; k++) { h.beginPath(); h.moveTo(r() * 48, r() * 48); h.lineTo(r() * 48, r() * 48); h.stroke(); }
    boyaliOnbellek.set('f' + renk, c); return c;
  }
  function sanatKatmani(g, t, nw, L, S, seed) {
    const T = g.getTransform();
    const c = tuvalHavuz('sanat', g.canvas.width, g.canvas.height), h = c.getContext('2d');
    h.setTransform(1, 0, 0, 1, 0, 0); h.globalCompositeOperation = 'source-over'; h.clearRect(0, 0, c.width, c.height);
    h.setTransform(T.a, T.b, T.c, T.d, T.e, T.f);
    const hw = nw / 2;
    t.firca.forEach((s, k) => cizgiCiz(h, s, hw, L, nw, seed + k * 17, T));
    h.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, 0, 0); g.restore();
  }
  function cizgiNoktalari(s, hw, L) { return (s.n || []).map(p => ({ x: p[0] * hw, y: -p[1] * L, w: p[2] == null ? 1 : p[2] })); }
  function cizgiCiz(h, s, hw, L, nw, seed, T) {
    const n = cizgiNoktalari(s, hw, L); if (!n.length) return;
    const tur = s.tur || 'eski', renk = s.renk || '#FFFFFF', boy = Math.max(.4, (s.boy || .1) * nw);
    h.globalCompositeOperation = (tur === 'silgi' || s.silgi) ? 'destination-out' : 'source-over';
    h.lineCap = 'round'; h.lineJoin = 'round';
    if (tur === 'nokta') {
      n.forEach(p => {
        const r = boy * p.w;
        h.fillStyle = 'rgba(60,30,40,.18)'; h.beginPath(); h.arc(p.x + r * .12, p.y + r * .18, r, 0, Math.PI * 2); h.fill();
        const rg = h.createRadialGradient(p.x - r * .3, p.y - r * .35, r * .1, p.x, p.y, r); rg.addColorStop(0, acik(renk, .35)); rg.addColorStop(.7, renk); rg.addColorStop(1, koyu(renk, .15));
        h.fillStyle = rg; h.beginPath(); h.arc(p.x, p.y, r, 0, Math.PI * 2); h.fill();
        h.fillStyle = 'rgba(255,255,255,.7)'; h.beginPath(); h.ellipse(p.x - r * .32, p.y - r * .36, r * .22, r * .14, -.6, 0, Math.PI * 2); h.fill();
      });
      return;
    }
    if (tur === 'sunger') {
      const r = tohumla(seed), r2 = s.renk2 || renk;
      n.forEach(p => {
        const boyut = boy * 2.2, kr = karis(renk, r2, sinir(-p.y / L, 0, 1));
        h.save(); h.translate(p.x, p.y); h.rotate(r() * 6.28); h.globalAlpha = .42; h.drawImage(boyaliSunger(kr), -boyut / 2, -boyut / 2, boyut, boyut); h.restore();
      });
      h.globalAlpha = 1; return;
    }
    if (tur === 'folyo') {
      const fc = tuvalHavuz('folyo', h.canvas.width, h.canvas.height), f = fc.getContext('2d');
      f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, fc.width, fc.height); f.setTransform(T.a, T.b, T.c, T.d, T.e, T.f);
      f.lineCap = 'round'; f.lineJoin = 'round'; f.strokeStyle = '#000'; f.lineWidth = boy;
      const r = tohumla(seed);
      f.beginPath(); f.moveTo(n[0].x, n[0].y); n.forEach(p => f.lineTo(p.x + (r() - .5) * boy * .3, p.y + (r() - .5) * boy * .3)); if (n.length === 1) f.lineTo(n[0].x + .1, n[0].y); f.stroke();
      f.globalCompositeOperation = 'source-in';
      const pat = f.createPattern(folyoDoku(renk), 'repeat'); f.fillStyle = pat; f.save(); f.scale(.35, .35); f.fillRect(-hw * 8, -L * 4, hw * 16, L * 8); f.restore();
      h.save(); h.setTransform(1, 0, 0, 1, 0, 0); h.drawImage(fc, 0, 0); h.restore();
      return;
    }
    h.strokeStyle = (tur === 'silgi' || s.silgi) ? '#000' : renk; h.fillStyle = h.strokeStyle;
    if (n.length === 1) { h.beginPath(); h.arc(n[0].x, n[0].y, boy * n[0].w / 2, 0, Math.PI * 2); h.fill(); return; }
    if (tur === 'eski' || tur === 'silgi' || tur === 'striping') {
      h.lineWidth = boy; h.beginPath(); h.moveTo(n[0].x, n[0].y);
      for (let k = 1; k < n.length - 1; k++) { const mx = (n[k].x + n[k + 1].x) / 2, my = (n[k].y + n[k + 1].y) / 2; h.quadraticCurveTo(n[k].x, n[k].y, mx, my); }
      h.lineTo(n[n.length - 1].x, n[n.length - 1].y); h.stroke(); return;
    }
    // liner / detay: değişken kalınlık (basınç benzeri), parça parça
    for (let k = 1; k < n.length; k++) {
      const a = n[k - 1], b = n[k];
      h.lineWidth = boy * (a.w + b.w) / 2; h.beginPath(); h.moveTo(a.x, a.y); h.lineTo(b.x, b.y); h.stroke();
    }
  }

  /* ------------------------------------------------------------ damga plakası desenleri */
  const DAMGA_CIZ = {
    cicek(g, w, h, r, nw) { for (let k = 0; k < 9; k++) { const x = (r() * 2 - 1) * w, y = (r() * 2 - 1) * h, s = nw * (.14 + r() * .14); g.save(); g.translate(x, y); g.rotate(r() * 3); for (let p = 0; p < 5; p++) { g.rotate(Math.PI * 2 / 5); g.beginPath(); g.ellipse(0, -s * .55, s * .3, s * .5, 0, 0, Math.PI * 2); g.stroke(); } g.beginPath(); g.arc(0, 0, s * .16, 0, Math.PI * 2); g.fill(); g.restore(); } },
    kalp(g, w, h, r, nw) { const s = nw * .2; for (let y = -h; y < h; y += s * 1.4) for (let x = -w + ((y / s) % 2 ? s * .7 : 0); x < w; x += s * 1.4) { g.save(); g.translate(x, y); g.beginPath(); g.moveTo(0, s * .45); g.bezierCurveTo(-s * .6, 0, -s * .45, -s * .45, 0, -s * .15); g.bezierCurveTo(s * .45, -s * .45, s * .6, 0, 0, s * .45); g.fill(); g.restore(); } },
    leopar(g, w, h, r, nw, renk) { leoparCiz(g, w * 2, h * 2, renk, r, -w, -h); },
    dantel(g, w, h, r, nw) {
      const s = nw * .26;
      g.globalAlpha = .9; for (let y = -h; y < h; y += s) { g.beginPath(); for (let x = -w; x < w; x += s) g.arc(x + s / 2, y, s / 2, Math.PI, 0); g.stroke(); }
      g.globalAlpha = .5; g.lineWidth *= .6; for (let x = -w; x < w; x += s * .5) { g.beginPath(); g.moveTo(x, -h); g.lineTo(x + h * .5, h); g.moveTo(x, -h); g.lineTo(x - h * .5, h); g.stroke(); }
      g.globalAlpha = 1; for (let y = -h; y < h; y += s) for (let x = -w; x < w; x += s) { g.beginPath(); g.arc(x + s / 2, y - s * .2, s * .07, 0, Math.PI * 2); g.fill(); }
    },
    yildiz(g, w, h, r, nw) { for (let k = 0; k < 14; k++) { const x = (r() * 2 - 1) * w, y = (r() * 2 - 1) * h, R = nw * (.05 + r() * .12); g.beginPath(); for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * Math.PI / 5, rr = q % 2 ? R * .45 : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); if (k % 3) g.fill(); else g.stroke(); } },
    damla(g, w, h, r, nw) { const s = nw * .16; for (let y = -h; y < h; y += s * 1.5) for (let x = -w + ((y / s) % 2 ? s * .8 : 0); x < w; x += s * 1.6) { g.beginPath(); g.moveTo(x, y - s * .6); g.quadraticCurveTo(x + s * .45, y + s * .05, x, y + s * .4); g.quadraticCurveTo(x - s * .45, y + s * .05, x, y - s * .6); g.fill(); } },
    geometrik(g, w, h, r, nw) { const s = nw * .34; for (let y = -h; y < h; y += s) for (let x = -w; x < w; x += s) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y); g.lineTo(x + s / 2, y + s * .86); g.closePath(); g.stroke(); } },
    kelebek(g, w, h, r, nw) { for (let k = 0; k < 5; k++) { const x = (r() * 2 - 1) * w * .8, y = (r() * 2 - 1) * h * .8, s = nw * (.28 + r() * .18); g.save(); g.translate(x, y); g.rotate((r() - .5) * 1.2); [[-1, -.12, .27, .22, -.5], [1, -.12, .27, .22, .5], [-1, .18, .19, .15, .4], [1, .18, .19, .15, -.4]].forEach(q => { g.beginPath(); g.ellipse(q[0] * s * .22, q[1] * s, s * q[2], s * q[3], q[4], 0, Math.PI * 2); g.stroke(); }); g.beginPath(); g.ellipse(0, 0, s * .04, s * .26, 0, 0, Math.PI * 2); g.fill(); g.restore(); } },
    zebra(g, w, h, r, nw) { for (let y = -h; y < h; y += nw * .24) { g.beginPath(); g.moveTo(-w, y); for (let x = -w; x <= w; x += nw * .2) g.lineTo(x, y + Math.sin(x * .5 + y) * nw * .06); g.lineWidth = nw * (.05 + r() * .06); g.stroke(); } },
    kareli(g, w, h, r, nw) { const s = nw * .22; for (let y = -h, i = 0; y < h; y += s, i++) for (let x = -w, j = 0; x < w; x += s, j++) if ((i + j) % 2) g.fillRect(x, y, s, s); }
  };
  function damgaCiz(g, dm, nw, L) {
    const f = DAMGA_CIZ[dm.desen]; if (!f) return;
    const hw = nw / 2, r = tohumla(dm.tohum || 99);
    g.save(); g.translate((dm.x || 0) * hw, -(dm.y == null ? .5 : dm.y) * L); g.rotate(dm.aci || 0); g.scale(dm.olcek || 1, dm.olcek || 1);
    g.fillStyle = dm.renk || '#FFFFFF'; g.strokeStyle = dm.renk || '#FFFFFF'; g.lineWidth = nw * .035; g.lineCap = 'round'; g.globalAlpha = .95;
    f(g, nw * 1.1, L * .9, r, nw, dm.renk || '#FFFFFF');
    g.restore();
  }

  /* ------------------------------------------------------------ efektler (krom tozu, eski finish'ler) */
  function metalik(g, hw, L, aci, ph, base) {
    const R = Math.hypot(hw, L), a = aci + Math.sin(ph * .7) * .14, dx = Math.cos(a) * R, dy = Math.sin(a) * R;
    const grd = g.createLinearGradient(-dx, -L / 2 - dy, dx, -L / 2 + dy);
    const k = koyu(base, .45), l = acik(base, .75), l2 = acik(base, .92);
    [[0, k], [.18, l], [.35, base], [.5, l2], [.62, koyu(base, .25)], [.8, l], [1, k]].forEach(s => grd.addColorStop(s[0], s[1]));
    g.save(); g.globalAlpha = .92 * g.globalAlpha; g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2); g.restore();
  }
  function aynaKrom(g, hw, L, ph, base) {
    // ayna gibi: yüksek kontrastlı yansıma bantları + ortam (stüdyo) yansıması
    const a = -1.2 + Math.sin(ph * .6) * .25, R = Math.hypot(hw, L);
    const grd = g.createLinearGradient(-Math.cos(a) * R, -L / 2 - Math.sin(a) * R, Math.cos(a) * R, -L / 2 + Math.sin(a) * R);
    const k = koyu(base, .62), m = koyu(base, .25), l = acik(base, .85);
    [[0, m], [.12, l], [.22, '#FFFFFF'], [.3, base], [.42, k], [.5, m], [.6, l], [.66, '#FFFFFF'], [.74, base], [.88, k], [1, m]].forEach(s => grd.addColorStop(s[0], s[1]));
    g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2);
  }
  function auroraCiz(g, hw, L, ph, base) {
    const acikMi = parlaklik(base || '#F4CFD8') > 150;
    const a = ph * .5 - .7, R = Math.hypot(hw, L) * 1.15, dx = Math.cos(a) * R, dy = Math.sin(a) * R;
    const grd = g.createLinearGradient(-dx, -L / 2 - dy, dx, -L / 2 + dy);
    const bant = acikMi ? ['#FF9BCB', '#D3A9FF', '#8FD0FF', '#FFD9EC', '#FFE9A8', '#A6E8FF', '#FFB0D6', '#C9B3FF'] : ['#FF7FB8', '#B98CFF', '#6EC6FF', '#FFE58A', '#7FF0C8', '#FF8FC6', '#A48CFF'];
    bant.forEach((c, i, arr) => grd.addColorStop(i / (arr.length - 1), c));
    const kutu = () => g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2);
    g.save();
    if (acikMi) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = .3; g.fillStyle = grd; kutu(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .34; g.fillStyle = grd; kutu(); }
    else { g.globalCompositeOperation = 'screen'; g.globalAlpha = .58; g.fillStyle = grd; kutu(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .4; g.fillStyle = grd; kutu(); }
    g.globalCompositeOperation = acikMi ? 'soft-light' : 'overlay'; g.globalAlpha = acikMi ? .9 : .55;
    const pg = g.createLinearGradient(-hw, -L, hw, 0); const m = sinir(.45 + Math.sin(ph) * .16, .08, .92);
    pg.addColorStop(Math.max(0, m - .22), 'rgba(255,255,255,0)'); pg.addColorStop(m, 'rgba(255,255,255,1)'); pg.addColorStop(Math.min(1, m + .22), 'rgba(255,255,255,0)');
    g.fillStyle = pg; kutu();
    g.globalCompositeOperation = 'screen'; g.globalAlpha = acikMi ? .35 : .3;
    const rg = g.createRadialGradient(hw * .15, -L * .42, 0, hw * .15, -L * .42, hw * 1.2); rg.addColorStop(0, '#FFF6FA'); rg.addColorStop(1, 'rgba(255,246,250,0)');
    g.fillStyle = rg; kutu();
    g.restore();
  }
  function inciCiz(g, hw, L, ph) {
    const kutu = () => g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2);
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .32;
    const pg = g.createLinearGradient(-hw, 0, hw, -L); const m = sinir(.5 + Math.sin(ph) * .2, .1, .9);
    pg.addColorStop(0, 'rgba(255,230,240,0)'); pg.addColorStop(m - .1, 'rgba(255,236,246,.6)'); pg.addColorStop(m, 'rgba(255,255,255,.95)'); pg.addColorStop(m + .12, 'rgba(230,240,255,.55)'); pg.addColorStop(1, 'rgba(255,240,230,0)');
    g.fillStyle = pg; kutu();
    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = .28; g.fillStyle = '#FFFFFF'; kutu();
    g.restore();
  }
  function holoCiz(g, hw, L, ph) {
    const R = Math.hypot(hw, L), a = -.9 + Math.sin(ph * .5) * .25, dx = Math.cos(a) * R, dy = Math.sin(a) * R;
    const grd = g.createLinearGradient(-dx, -L / 2 - dy, dx, -L / 2 + dy);
    for (let i = 0; i <= 6; i++) grd.addColorStop(i / 6, 'hsl(' + ((i * 60 + ph * 40) % 360) + ',100%,72%)');
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .45; g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, hw * 2 + 2, L + hw + 2);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = .35; g.strokeStyle = '#FFFFFF'; g.lineWidth = hw * .06;
    for (let y = -L * 1.4; y < L; y += hw * .3) { g.beginPath(); g.moveTo(-hw - 2, y); g.lineTo(hw + 2, y - hw * .9); g.stroke(); }
    g.restore();
  }
  function simCiz(g, hw, L, rnd, ph, n, buyuk) {
    const renkler = ['#FFFFFF', '#FFE9A8', '#FFD1DC', '#E2F1FF', '#FFF7D9'], o = hw / 13;
    for (let k = 0; k < n; k++) {
      const x = (rnd() * 2 - 1) * hw, y = -rnd() * L * 1.05 + hw * .15, r = (buyuk ? .5 + rnd() * 1.3 : .3 + rnd() * .6) * o;
      g.globalAlpha = (buyuk ? .5 : .22) + rnd() * .5; g.fillStyle = renkler[k % 5]; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    if (buyuk) for (let k = 0; k < 7; k++) { const x = (rnd() * 2 - 1) * hw * .85, y = -rnd() * L; g.globalAlpha = .35 + .65 * Math.abs(Math.sin(ph * 2.2 + k * 1.7)); yildiz4(g, x, y, (1.6 + rnd() * 1.8) * o); }
    g.globalAlpha = 1;
  }
  function yildiz4(g, x, y, r) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); }
  function efektCiz(g, t, nw, L, ph, seed) {
    const hw = nw / 2, f = t.efekt;
    if (!f || f === 'yok') return;
    if (f === 'krom') metalik(g, hw, L, -.35, ph, t.renk || '#E8E8EE');
    else if (f === 'kromAyna') aynaKrom(g, hw, L, ph, '#D9DEE6');
    else if (f === 'kromAltin') aynaKrom(g, hw, L, ph, '#D9AE45');
    else if (f === 'kromRose') aynaKrom(g, hw, L, ph, '#E2A090');
    else if (f === 'aurora') auroraCiz(g, hw, L, ph, t.renk);
    else if (f === 'inci') inciCiz(g, hw, L, ph);
    else if (f === 'holo') holoCiz(g, hw, L, ph);
    else if (f === 'glitter') simCiz(g, hw, L, tohumla(seed + 11), ph, 90, true);
    else if (f === 'shimmer') { simCiz(g, hw, L, tohumla(seed + 13), ph, 220, false); const sg = g.createLinearGradient(-hw, 0, hw, -L); sg.addColorStop(.3, 'rgba(255,255,255,0)'); sg.addColorStop(.5 + Math.sin(ph) * .08, 'rgba(255,255,255,.35)'); sg.addColorStop(.7, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2); }
  }

  /* ------------------------------------------------------------ üst kat ve ışık yansımaları */
  function spekular(g, hw, L, nw, guc, cam, dx, apex) {
    const grd = g.createRadialGradient(-hw * .3 + dx, -L * .6, 0, -hw * .3 + dx, -L * .6, hw * 1.05);
    grd.addColorStop(0, 'rgba(255,255,255,' + (.34 * guc) + ')'); grd.addColorStop(.6, 'rgba(255,255,255,' + (.08 * guc) + ')'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(-hw - 1, -L - 1, nw + 2, L + hw + 2);
    g.lineCap = 'round';
    // uzun softbox yansıması (tırnağın kavisini izler)
    g.strokeStyle = 'rgba(255,255,255,' + (.36 * guc) + ')'; g.lineWidth = hw * .22;
    g.beginPath(); g.moveTo(-hw * .58 + dx, -L * .1); g.quadraticCurveTo(-hw * .7 + dx, -L * .5, -hw * .42 + dx, -L * .86); g.stroke();
    if (cam) {
      g.strokeStyle = 'rgba(255,255,255,' + (.85 * guc) + ')'; g.lineWidth = hw * .07;
      g.beginPath(); g.moveTo(-hw * .58 + dx, -L * .16); g.quadraticCurveTo(-hw * .7 + dx, -L * .5, -hw * .44 + dx, -L * .8); g.stroke();
      // pencere yansıması + küçük nokta
      g.fillStyle = 'rgba(255,255,255,' + (.5 * guc) + ')'; g.beginPath(); g.ellipse(hw * .32 + dx * .5, -L * .3, hw * .1, L * .07, -.15, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,' + (.9 * guc) + ')'; g.beginPath(); g.arc(-hw * .2 + dx, -L * .12, hw * .05, 0, Math.PI * 2); g.fill();
    }
    if (apex) { const ag = g.createLinearGradient(0, -L * .3, 0, -L * .55); ag.addColorStop(0, 'rgba(255,255,255,0)'); ag.addColorStop(.5, 'rgba(255,255,255,' + (.28 * guc) + ')'); ag.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = ag; g.fillRect(-hw, -L * .55, nw, L * .25); }
    // sağ kenar ışığı ve uç parlaması
    g.strokeStyle = 'rgba(255,255,255,' + (.2 * guc) + ')'; g.lineWidth = hw * .08; g.beginPath(); g.moveTo(hw * .82, -L * .1); g.quadraticCurveTo(hw * .9, -L * .5, hw * .7, -L * .85); g.stroke();
    const tg = g.createLinearGradient(0, -L, 0, -L + hw * .5); tg.addColorStop(0, 'rgba(255,255,255,' + (.4 * guc) + ')'); tg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = tg; g.fillRect(-hw - 1, -L - 1, nw + 2, hw * .6);
  }
  function ustKatmani(g, t, nw, L, hz, ph, o) {
    const hw = nw / 2, dx = Math.sin(ph) * hw * .18, apex = !!t.protez && t.protez !== 'tips' || t.protez === 'tips' && t.top;
    const metal = /krom|aurora|inci|holo/.test(t.efekt);
    if (t.top && t.ust === 'mat') { g.save(); g.globalAlpha = .95; g.fillStyle = g.createPattern(doku.mat, 'repeat'); g.fillRect(-hw - 2, -L - 2, nw + 4, L + nw); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(-hw - 2, -L - 2, nw + 4, L + nw); g.restore(); return; }
    if (t.top && t.ust === 'saten') { const sg = g.createLinearGradient(-hw, 0, hw, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.32 + dx / nw, 'rgba(255,255,255,.26)'); sg.addColorStop(.6, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(-hw - 2, -L - 2, nw + 4, L + nw); g.save(); g.globalAlpha = .3; g.fillStyle = g.createPattern(doku.mat, 'repeat'); g.fillRect(-hw - 2, -L - 2, nw + 4, L + nw); g.restore(); return; }
    if (t.top) { spekular(g, hw, L, nw, metal ? 1.15 : 1, true, dx, apex); return; }
    if (t.renk) { spekular(g, hw, L, nw, .62, false, dx, apex); return; }
    const p = hz ? hz.parlak : 1;
    spekular(g, hw, L, nw, .3 + p * .45, p > .9, dx, apex);
  }
  /* ------------------------------------------------------------ çıkartma & süs çizimleri (yerel, merkez 0,0; s = çap) */
  const CIKARTMA_CIZ = {
    kalp(g, s, renk) { const r = s / 2; g.fillStyle = renk; g.beginPath(); g.moveTo(0, r * .95); g.bezierCurveTo(-r * 1.25, r * .1, -r * .95, -r * .95, 0, -r * .35); g.bezierCurveTo(r * .95, -r * .95, r * 1.25, r * .1, 0, r * .95); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-r * .35, -r * .4, r * .18, r * .12, -.6, 0, Math.PI * 2); g.fill(); },
    yildiz(g, s, renk) { const R = s / 2, r = R * .45; g.fillStyle = renk; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); },
    cicek(g, s, renk) { const r = s * .2; g.fillStyle = renk; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 - Math.PI / 2; g.beginPath(); g.ellipse(Math.cos(a) * s * .27, Math.sin(a) * s * .27, r, r * .78, a, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#FFD966'; g.beginPath(); g.arc(0, 0, s * .14, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-s * .04, -s * .04, s * .05, 0, Math.PI * 2); g.fill(); },
    kelebek(g, s, renk) {
      g.fillStyle = renk;
      [[-1, -.12, .27, .22, -.5], [1, -.12, .27, .22, .5], [-1, .18, .19, .15, .4], [1, .18, .19, .15, -.4]].forEach(w => { g.beginPath(); g.ellipse(w[0] * s * .22, w[1] * s, s * w[2], s * w[3], w[4], 0, Math.PI * 2); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.55)'; [[-.26, -.16], [.26, -.16]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .06, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#3B3444'; g.beginPath(); g.ellipse(0, .02 * s, s * .05, s * .3, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#3B3444'; g.lineWidth = Math.max(.6, s * .03); g.beginPath(); g.moveTo(0, -s * .26); g.quadraticCurveTo(-s * .12, -s * .42, -s * .18, -s * .44); g.moveTo(0, -s * .26); g.quadraticCurveTo(s * .12, -s * .42, s * .18, -s * .44); g.stroke();
    },
    kiraz(g, s, renk) {
      g.strokeStyle = '#6E8B3D'; g.lineWidth = Math.max(.8, s * .06); g.lineCap = 'round'; g.beginPath(); g.moveTo(-s * .18, s * .1); g.quadraticCurveTo(-s * .05, -s * .2, s * .06, -s * .38); g.moveTo(s * .2, s * .14); g.quadraticCurveTo(s * .14, -s * .15, s * .06, -s * .38); g.stroke();
      g.fillStyle = '#7CCB9A'; g.beginPath(); g.ellipse(s * .16, -s * .36, s * .14, s * .07, -.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = renk; [[-.18, .14], [.2, .18]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .18, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.55)'; [[-.24, .07], [.14, .11]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .05, 0, Math.PI * 2); g.fill(); });
    },
    fiyonk(g, s, renk) {
      g.fillStyle = renk; [[-.26, 0], [.26, 0]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .26, s * .17, 0, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = koyu(renk, .18); [[-.18, .24], [.18, .24]].forEach((p, k) => { g.beginPath(); g.moveTo(0, s * .06); g.lineTo(p[0] * s, p[1] * s); g.lineTo(p[0] * s * 1.5, p[1] * s * .7); g.closePath(); g.fill(); });
      g.fillStyle = koyu(renk, .1); g.beginPath(); g.arc(0, 0, s * .1, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; [[-.3, -.07], [.22, -.07]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .08, s * .04, 0, 0, Math.PI * 2); g.fill(); });
    },
    gulen(g, s, renk) {
      g.fillStyle = renk; g.beginPath(); g.arc(0, 0, s / 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3B3444'; [[-.18, -.1], [.18, -.1]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .06, s * .09, 0, 0, Math.PI * 2); g.fill(); });
      g.strokeStyle = '#3B3444'; g.lineWidth = Math.max(.8, s * .06); g.lineCap = 'round'; g.beginPath(); g.arc(0, s * .05, s * .24, .25 * Math.PI, .75 * Math.PI); g.stroke();
      g.fillStyle = 'rgba(238,138,170,.65)'; [[-.3, .12], [.3, .12]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .08, 0, Math.PI * 2); g.fill(); });
    },
    ayYildiz(g, s, renk) {
      const R = s * .42; g.fillStyle = renk; g.beginPath(); g.moveTo(0, -R); g.bezierCurveTo(-R * 1.35, -R * .6, -R * 1.35, R * .6, 0, R); g.bezierCurveTo(-R * .4, R * .6, -R * .4, -R * .6, 0, -R); g.fill();
      g.save(); g.translate(s * .22, 0); CIKARTMA_CIZ.yildiz(g, s * .34, renk); g.restore();
    },
    pati(g, s, renk) {
      g.fillStyle = renk; g.beginPath(); g.ellipse(0, s * .14, s * .26, s * .2, 0, 0, Math.PI * 2); g.fill();
      [[-.3, -.06], [-.11, -.26], [.11, -.26], [.3, -.06]].forEach(p => { g.beginPath(); g.arc(p[0] * s, p[1] * s, s * .1, 0, Math.PI * 2); g.fill(); });
    }
    ,
    papatya(g, s, renk) {
      g.fillStyle = renk; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.ellipse(Math.cos(a) * s * .26, Math.sin(a) * s * .26, s * .17, s * .07, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 + .1; g.beginPath(); g.ellipse(Math.cos(a) * s * .3, Math.sin(a) * s * .3, s * .1, s * .02, a, 0, Math.PI * 2); g.fill(); }
      const rg = g.createRadialGradient(-s * .03, -s * .03, 0, 0, 0, s * .13); rg.addColorStop(0, '#FFE58A'); rg.addColorStop(1, '#E6A817'); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, s * .12, 0, Math.PI * 2); g.fill();
    },
    cilekK(g, s, renk) {
      g.fillStyle = renk; g.beginPath(); g.moveTo(0, s * .42); g.bezierCurveTo(-s * .42, s * .1, -s * .36, -s * .3, 0, -s * .26); g.bezierCurveTo(s * .36, -s * .3, s * .42, s * .1, 0, s * .42); g.fill();
      g.fillStyle = '#FFE9A8'; for (let k = 0; k < 9; k++) { const x = ((k % 3) - 1) * s * .16, y = (Math.floor(k / 3) - .6) * s * .17; g.beginPath(); g.ellipse(x, y, s * .02, s * .035, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#5BAF5B'; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .5; g.beginPath(); g.ellipse(Math.cos(a) * s * .12, -s * .27 + Math.sin(a) * s * .05, s * .1, s * .04, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(-s * .14, -s * .06, s * .05, s * .1, .4, 0, Math.PI * 2); g.fill();
    },
    goz(g, s) {
      [['#1C4FA0', .5], ['#FFFFFF', .34], ['#6EC6FF', .22], ['#151820', .1]].forEach(([c, r]) => { g.fillStyle = c; g.beginPath(); g.arc(0, 0, s * r, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-s * .16, -s * .18, s * .1, s * .06, -.6, 0, Math.PI * 2); g.fill();
    }
  };
  /* 3D süsler: hepsi gölge + ışık yansımalı (s = çap, yerel merkez 0,0; ışık sol üstten) */
  function golgeli(g, S, fn, guc) { g.save(); g.shadowColor = 'rgba(50,24,40,' + (guc || .42) + ')'; g.shadowBlur = 2.6 * (S || 2); g.shadowOffsetX = .6 * (S || 2); g.shadowOffsetY = 1.4 * (S || 2); fn(); g.restore(); }
  function tasCiz(g, s, renk, S) {
    const r = s / 2, kristal = parlaklik(renk) > 235;
    golgeli(g, S, () => { g.fillStyle = koyu(renk, .3); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); });
    // taç faseteleri: 8 parça, ışığa bakanlar açık
    for (let k = 0; k < 8; k++) {
      const a0 = k * Math.PI / 4 - Math.PI / 8, a1 = a0 + Math.PI / 4, isik = .5 + .5 * Math.cos((a0 + a1) / 2 + 2.4);
      g.fillStyle = kristal ? ['#FFFFFF', '#FFE3EE', '#E2F1FF', '#FFF7D9', '#EADFFF', '#FFFFFF', '#DDEBFF', '#FFE9F3'][k] : karis(koyu(renk, .35), acik(renk, .6), isik);
      g.beginPath(); g.moveTo(Math.cos(a0) * r * .55, Math.sin(a0) * r * .55); g.lineTo(Math.cos(a0) * r, Math.sin(a0) * r); g.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); g.lineTo(Math.cos(a1) * r * .55, Math.sin(a1) * r * .55); g.closePath(); g.fill();
    }
    const tg = g.createLinearGradient(-r * .5, -r * .5, r * .5, r * .5); tg.addColorStop(0, kristal ? '#FFFFFF' : acik(renk, .55)); tg.addColorStop(1, kristal ? '#D9E4F2' : renk);
    g.fillStyle = tg; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 8; g.lineTo(Math.cos(a) * r * .55, Math.sin(a) * r * .55); } g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(.25, r * .05); g.stroke();
    g.strokeStyle = rgba(koyu(renk, .5), .5); g.lineWidth = Math.max(.3, r * .08); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(-r * .3, -r * .32, r * .2, r * .12, -.7, 0, Math.PI * 2); g.fill();
    yildiz4(g, -r * .32, -r * .34, r * .55);
  }
  function damlaKristal(g, s, renk, S) {
    const r = s / 2, yol = new Path2D(); yol.moveTo(0, -r * 1.1); yol.bezierCurveTo(r * .9, -r * .2, r * .85, r, 0, r); yol.bezierCurveTo(-r * .85, r, -r * .9, -r * .2, 0, -r * 1.1); yol.closePath();
    golgeli(g, S, () => { g.fillStyle = renk; g.fill(yol); });
    g.save(); g.clip(yol);
    const lg = g.createLinearGradient(-r, -r, r, r); lg.addColorStop(0, acik(renk, .8)); lg.addColorStop(.45, renk); lg.addColorStop(1, koyu(renk, .4)); g.fillStyle = lg; g.fill(yol);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = Math.max(.25, r * .05); for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, -r * 1.1); g.lineTo(k * r * .4, r); g.stroke(); }
    g.restore(); yildiz4(g, -r * .28, -r * .2, r * .5);
  }
  function kalpYolu(r) { const p = new Path2D(); p.moveTo(0, r * .95); p.bezierCurveTo(-r * 1.25, r * .1, -r * .95, -r * .95, 0, -r * .35); p.bezierCurveTo(r * .95, -r * .95, r * 1.25, r * .1, 0, r * .95); p.closePath(); return p; }
  function kalpKristal(g, s, renk, S) {
    const r = s / 2, yol = kalpYolu(r);
    golgeli(g, S, () => { g.fillStyle = renk; g.fill(yol); });
    g.save(); g.clip(yol);
    const lg = g.createLinearGradient(-r, -r, r, r); lg.addColorStop(0, acik(renk, .75)); lg.addColorStop(.5, renk); lg.addColorStop(1, koyu(renk, .45)); g.fillStyle = lg; g.fill(yol);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = Math.max(.25, r * .05); [[-1, -.4], [1, -.4], [0, -.35]].forEach(([x, y]) => { g.beginPath(); g.moveTo(0, r * .2); g.lineTo(x * r, y * r); g.stroke(); });
    g.restore(); yildiz4(g, -r * .42, -r * .38, r * .45);
  }
  function inciCiz3(g, s, renk, S) {
    const r = s / 2;
    golgeli(g, S, () => { g.fillStyle = '#EBDCE2'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); }, .36);
    const grd = g.createRadialGradient(-r * .3, -r * .35, 0, 0, 0, r);
    const taban = parlaklik(renk) > 235 ? '#FBEFF3' : acik(renk, .55);
    grd.addColorStop(0, '#FFFFFF'); grd.addColorStop(.35, taban); grd.addColorStop(.75, koyu(taban, .1)); grd.addColorStop(1, koyu(taban, .25));
    g.fillStyle = grd; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(226,241,255,.45)'; g.beginPath(); g.arc(r * .3, r * .3, r * .34, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,220,235,.35)'; g.beginPath(); g.arc(-r * .2, r * .35, r * .25, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(-r * .32, -r * .36, r * .2, r * .13, -.7, 0, Math.PI * 2); g.fill();
  }
  function metalRenk(renk) { return parlaklik(renk) > 235 ? '#D9B24A' : renk; }
  function metalDolgu(g, r, renk) { const m = metalRenk(renk); const lg = g.createLinearGradient(-r, -r, r, r); lg.addColorStop(0, acik(m, .7)); lg.addColorStop(.35, m); lg.addColorStop(.55, acik(m, .45)); lg.addColorStop(.8, koyu(m, .35)); lg.addColorStop(1, koyu(m, .5)); return lg; }
  const SUS_CIZ = {
    tasS: tasCiz, tasM: tasCiz, tasL: tasCiz,
    kristalDamla: damlaKristal, kristalKalp: kalpKristal,
    inci: inciCiz3, inciMini: inciCiz3,
    kalp3d(g, s, renk, S) {
      const r = s / 2, yol = kalpYolu(r);
      golgeli(g, S, () => { g.fillStyle = renk; g.fill(yol); });
      const rg = g.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r * 1.2); rg.addColorStop(0, acik(renk, .55)); rg.addColorStop(.6, renk); rg.addColorStop(1, koyu(renk, .35));
      g.fillStyle = rg; g.fill(yol);
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-r * .42, -r * .38, r * .2, r * .11, -.7, 0, Math.PI * 2); g.fill();
    },
    fiyonk3d(g, s, renk, S) {
      golgeli(g, S, () => { g.fillStyle = renk; [[-.27, 0], [.27, 0]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .27, s * .18, 0, 0, Math.PI * 2); g.fill(); }); }, .35);
      const lg = g.createLinearGradient(0, -s * .2, 0, s * .2); lg.addColorStop(0, acik(renk, .35)); lg.addColorStop(1, koyu(renk, .12));
      g.fillStyle = lg; [[-.27, 0], [.27, 0]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .27, s * .18, 0, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = koyu(renk, .3); [[-.27, 0], [.27, 0]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s + s * .02, s * .13, s * .07, 0, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = koyu(renk, .15); [[-1, 1], [1, 1]].forEach(p => { g.beginPath(); g.moveTo(0, s * .08); g.lineTo(p[0] * s * .2, s * .3); g.lineTo(p[0] * s * .3, s * .22); g.lineTo(p[0] * s * .08, s * .06); g.closePath(); g.fill(); });
      const kg = g.createRadialGradient(-s * .03, -s * .03, 0, 0, 0, s * .12); kg.addColorStop(0, acik(renk, .5)); kg.addColorStop(1, koyu(renk, .25));
      g.fillStyle = kg; g.beginPath(); g.arc(0, 0, s * .11, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)'; [[-.33, -.08], [.2, -.08]].forEach(p => { g.beginPath(); g.ellipse(p[0] * s, p[1] * s, s * .08, s * .04, -.2, 0, Math.PI * 2); g.fill(); });
    },
    cicek3d(g, s, renk, S) {
      for (let k = 0; k < 5; k++) {
        const a = k * Math.PI * 2 / 5 - Math.PI / 2, x = Math.cos(a) * s * .24, y = Math.sin(a) * s * .24;
        g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
        golgeli(g, S, () => { g.fillStyle = rgba(renk, .92); g.beginPath(); g.ellipse(0, 0, s * .17, s * .24, 0, 0, Math.PI * 2); g.fill(); }, .25);
        const pg = g.createLinearGradient(0, -s * .24, 0, s * .24); pg.addColorStop(0, 'rgba(255,255,255,.85)'); pg.addColorStop(1, rgba(koyu(renk, .12), .6));
        g.fillStyle = pg; g.beginPath(); g.ellipse(0, 0, s * .17, s * .24, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = s * .015; g.beginPath(); g.moveTo(0, s * .18); g.lineTo(0, -s * .12); g.stroke();
        g.restore();
      }
      tasCiz(g, s * .26, '#E6C35C', S);
    },
    charmYildiz(g, s, renk, S) {
      const R = s / 2, yol = new Path2D(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * .46 : R; yol.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } yol.closePath();
      golgeli(g, S, () => { g.fillStyle = metalRenk(renk); g.fill(yol); });
      g.fillStyle = metalDolgu(g, R, renk); g.fill(yol);
      g.strokeStyle = rgba(koyu(metalRenk(renk), .45), .7); g.lineWidth = Math.max(.3, R * .06); g.stroke(yol);
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(.3, R * .05); g.beginPath(); g.moveTo(-R * .1, -R * .7); g.lineTo(-R * .25, -R * .2); g.stroke();
    },
    charmKalp(g, s, renk, S) {
      const r = s / 2, yol = kalpYolu(r);
      golgeli(g, S, () => { g.fillStyle = metalRenk(renk); g.fill(yol); });
      g.fillStyle = metalDolgu(g, r, renk); g.fill(yol);
      g.strokeStyle = rgba(koyu(metalRenk(renk), .45), .7); g.lineWidth = Math.max(.3, r * .06); g.stroke(yol);
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(.3, r * .08); g.beginPath(); g.arc(-r * .35, -r * .3, r * .25, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
    },
    charmAy(g, s, renk, S) {
      const R = s / 2, yol = new Path2D(); yol.arc(0, 0, R, Math.PI * .3, Math.PI * 1.7); yol.arc(R * .35, 0, R * .78, Math.PI * 1.62, Math.PI * .38, true); yol.closePath();
      golgeli(g, S, () => { g.fillStyle = metalRenk(renk); g.fill(yol); });
      g.fillStyle = metalDolgu(g, R, renk); g.fill(yol);
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(.3, R * .07); g.beginPath(); g.arc(0, 0, R * .82, Math.PI * .9, Math.PI * 1.4); g.stroke();
      tasCiz(g, s * .22, '#FFFFFF', S);
    },
    zincir(g, s, renk, S) {
      const altin = metalRenk(renk), n = 7, adim = s / n;
      g.save(); g.shadowColor = 'rgba(59,52,68,.35)'; g.shadowBlur = 1.2 * (S || 2); g.shadowOffsetY = .6 * (S || 2);
      g.lineWidth = Math.max(.6, adim * .22); g.strokeStyle = altin;
      for (let k = 0; k < n; k++) { const x = -s / 2 + adim * (k + .5); g.beginPath(); g.ellipse(x, 0, adim * .55, adim * .3, 0, 0, Math.PI * 2); g.stroke(); }
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(.4, adim * .1);
      for (let k = 0; k < n; k++) { const x = -s / 2 + adim * (k + .5); g.beginPath(); g.ellipse(x - adim * .1, -adim * .08, adim * .32, adim * .15, 0, Math.PI * 1.1, Math.PI * 1.8); g.stroke(); }
    }
  };

  /* ------------------------------------------------------------ sahne: katmanlar, görünüm, önbellek, döngü */
  let tuvalA = null, tuvalT = null, tuvalU = null, gA = null, gT = null, gU = null;
  let dpr = 1, cssW = 0, cssH = 0, raf = 0;
  let ornekler = [], yerlesim = [];
  const gorunum = { z: 1, x: W / 2, y: H / 2, odak: false };
  const POZ_GORUNUM = { duz: { z: 1.14, x: 174, y: 268, gen: 400 }, kalp: { z: 1.3, x: 180, y: 262, gen: 340 }, fincan: { z: 1.12, x: 196, y: 246, gen: 360 } };
  /* el, sahnenin genişliğine her zaman sığar (dar masaüstü sütununda baş parmak kesilmesin) */
  function pozGorunum() {
    const pv = Object.assign({}, POZ_GORUNUM[d.poz] || POZ_GORUNUM.duz);
    const s0 = Math.min(cssW / W, cssH / H) || 1;
    if (cssW > 0) pv.z = Math.max(.6, Math.min(pv.z, cssW / (s0 * pv.gen)));
    return pv;
  }
  function gorunumSifirla() { const pv = pozGorunum(); Object.assign(gorunum, { z: pv.z, x: pv.x, y: pv.y, odak: false }); }
  const kirli = { arka: true, tirnak: true, ust: true };
  const onbellek = new Map();       // 'sag2' → { c, anahtar, bx, by, bw, bh }
  const animler = new Map();        // ad → { bas, sure, ... }
  const sicaklik = new Map();       // termal: 'sag2' → zaman
  let canliCizim = false;           // fırça çizerken üst katman temizlenmez (artımlı çizim)
  let imlec = null;                 // { tur, x, y } sahne koordinatı
  const olcum = { kareler: [], acik: /[?&]olcum/.test(location.search) };

  function pikselOlcek() { const s0 = Math.min(cssW / W, cssH / H) || 1; return s0 * gorunum.z; }
  function gorunumMatrisi(z, x, y) {
    const s0 = Math.min(cssW / W, cssH / H) || 1, s = s0 * (z == null ? gorunum.z : z);
    const cx = x == null ? gorunum.x : x, cy = y == null ? gorunum.y : y;
    return [s * dpr, 0, 0, s * dpr, (cssW / 2 - cx * s) * dpr, (cssH / 2 - cy * s) * dpr];
  }
  function sahneNokta(e) {
    const r = tuvalU.getBoundingClientRect(), V = gorunumMatrisi(), s = V[0] / dpr;
    return { x: ((e.clientX - r.left) - V[4] / dpr) / s, y: ((e.clientY - r.top) - V[5] / dpr) / s };
  }
  function istemciNokta(x, y) { const r = tuvalU.getBoundingClientRect(), V = gorunumMatrisi(), s = V[0] / dpr; return { x: r.left + V[4] / dpr + x * s, y: r.top + V[5] / dpr + y * s }; }
  function pozYenile() { ornekler = pozKur(d.poz, d.el); yerlesim = tirnakYerlesimi(ornekler); onbellek.clear(); }
  const gorunurTaraflar = () => ornekler.map(o => o.taraf);
  function hepsiniCiz() { kirli.arka = kirli.tirnak = kirli.ust = true; iste(); if (ui.balon && d) { try { balonYeriGuncelle(); } catch (e) {} } }
  function tirnakCizIste() { kirli.tirnak = true; kirli.ust = true; iste(); }
  function ustCizIste() { kirli.ust = true; iste(); }
  function iste() { if (!raf && ctx) raf = requestAnimationFrame(dongu); }

  function hzDilim(taraf, i) {
    const h = d.hazirlik[taraf]; if (!h || h.adim >= HAZIRLIK.length) return null;
    return { eskiKalan: h.eski.kalan[i], eskiRenk: h.eski.renk, kutikul: h.kutikul[i], yag: h.yag[i], torpu: h.torpu[i], parlak: h.parlak[i], toz: h.toz[i], puruz: h.puruz == null ? 1 : h.puruz };
  }
  function tirnakSecenek(taraf, i, P) {
    const anim = animler.get('oje' + taraf + i);
    let sicak = 0; const st = sicaklik.get(taraf + i); if (st) { const g = (performance.now() - st) / 1000; sicak = g < .6 ? g / .6 : Math.max(0, 1 - (g - .6) / 2.4); if (sicak <= 0) sicaklik.delete(taraf + i); }
    return { S: P, ten: d.ten || VARSAYILAN_TEN, hz: hzDilim(taraf, i), isikAci: d.isikAci, los: d.isik === 'los', i, sicak,
      anim: anim ? { tur: 'oje', p: sinir((performance.now() - anim.bas) / anim.sure, 0, 1) } : null };
  }
  function tirnakOnbellek(y, P) {
    const t = d.eller[y.taraf][y.i], o = tirnakSecenek(y.taraf, y.i, P);
    const nw = y.nw, L = tirnakBoyu(t, nw), m = nw * .75;
    const bx = -nw / 2 - m, by = -L - m, bw = nw + m * 2, bh = L + nw * .6 + m * 2;
    const anahtar = JSON.stringify(t) + JSON.stringify(o.hz) + o.ten + P.toFixed(3) + o.isikAci.toFixed(2) + o.los + (o.anim ? o.anim.p.toFixed(3) : '') + o.sicak.toFixed(2);
    let k = onbellek.get(y.taraf + y.i);
    if (k && k.anahtar === anahtar) return k;
    if (!k) { k = { c: document.createElement('canvas') }; onbellek.set(y.taraf + y.i, k); }
    const pw = Math.max(1, Math.ceil(bw * P)), ph = Math.max(1, Math.ceil(bh * P));
    if (k.c.width !== pw || k.c.height !== ph) { k.c.width = pw; k.c.height = ph; }
    const g = k.c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pw, ph);
    g.setTransform(P, 0, 0, P, -bx * P, -by * P);
    tenSimdi = o.ten;
    tirnakCiz(g, t, nw, o);
    Object.assign(k, { anahtar, bx, by, bw, bh });
    return k;
  }
  function arkaCiz() {
    const V = gorunumMatrisi();
    gA.setTransform(1, 0, 0, 1, 0, 0); gA.clearRect(0, 0, tuvalA.width, tuvalA.height);
    gA.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]);
    const renkler = []; ['sag', 'sol'].forEach(k => d.eller[k].forEach(t => { if (t.renk && !renkler.includes(t.renk)) renkler.push(t.renk); }));
    stdyoCiz(gA, { zemin: d.zemin, poz: d.poz, el: d.el, renkler });
    ornekler.forEach(o => elCiz(gA, o, d.ten || VARSAYILAN_TEN, V));
    gA.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]);
    isikCiz(gA, d.isik);
  }
  function tirnaklariCiz() {
    const V = gorunumMatrisi(), s = V[0];
    gT.setTransform(1, 0, 0, 1, 0, 0); gT.clearRect(0, 0, tuvalT.width, tuvalT.height);
    yerlesim.forEach(y => {
      const P = s * y.olc, k = tirnakOnbellek(y, P);
      gT.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]); uygulaG(gT, y.m);
      gT.drawImage(k.c, k.bx, k.by, k.bw, k.bh);
    });
  }
  function hedefYerlesim() { return yerlesim.filter(y => y.taraf === d.el && (d.secim.hepsi || y.i === d.secim.parmak)); }
  function ustCiz(simdi) {
    const V = gorunumMatrisi();
    gU.setTransform(1, 0, 0, 1, 0, 0); gU.clearRect(0, 0, tuvalU.width, tuvalU.height);
    // seçim halkası
    hedefYerlesim().forEach(y => {
      const t = d.eller[y.taraf][y.i], L = tirnakBoyu(t, y.nw);
      gU.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]); uygulaG(gU, y.m);
      gU.save(); gU.setLineDash([3, 2.5]); 
      gU.lineWidth = (d.secim.hepsi ? 1 : 1.6) / y.olc; gU.strokeStyle = 'rgba(238,110,150,.9)';
      const hal = new Path2D(); tirnakYolu(hal, t.sekil, y.nw + 5 / y.olc, L + 4 / y.olc); gU.translate(0, 1.5 / y.olc); gU.stroke(hal); gU.restore();
      // seçili parça
      if (seciliParca && seciliParca.taraf === y.taraf && seciliParca.parmak === y.i) {
        const pr = (t[seciliParca.liste] || [])[seciliParca.i];
        if (pr) { const hw = y.nw / 2, x = (pr.x || 0) * hw, yy = -(pr.y == null ? .5 : pr.y) * L, r = ((pr.olcek || .4) * y.nw * .62 + 2) * (seciliParca.liste === 'damgalar' ? 1.4 : 1); gU.save(); gU.setLineDash([2, 2]); gU.strokeStyle = '#EE6E96'; gU.lineWidth = 1 / y.olc; gU.beginPath(); gU.arc(x, yy, r, 0, Math.PI * 2); gU.stroke(); gU.restore(); }
      }
    });
    gU.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]);
    animKatmani(gU, simdi);
    if (imlec) aracImleci(gU, imlec);
  }
  function dongu(ts) {
    raf = 0; if (!ctx || !tuvalA) return;
    const t0 = performance.now();
    const hareket = !ctx.azHareket && document.visibilityState !== 'hidden';
    // animasyonlar
    let anim = false;
    animler.forEach((a, k) => {
      const p = (ts - a.bas) / a.sure;
      if (p >= 1) { animler.delete(k); if (a.bitti) a.bitti(); if (a.tirnak) kirli.tirnak = true; kirli.ust = true; if (a.arka) kirli.arka = true; }
      else { anim = true; if (a.tirnak) kirli.tirnak = true; if (a.arka) kirli.arka = true; kirli.ust = true; if (a.adim) a.adim(sinir(p, 0, 1)); }
    });
    if (sicaklik.size) { kirli.tirnak = true; anim = true; }
    if (kirli.arka) { kirli.arka = false; arkaCiz(); }
    if (kirli.tirnak) { kirli.tirnak = false; tirnaklariCiz(); }
    if (kirli.ust && !canliCizim) { kirli.ust = false; ustCiz(ts); }
    if (olcum.acik || window.__tirnakOlcum) { (window.__tirnakOlcum = window.__tirnakOlcum || []).push(performance.now() - t0); if (window.__tirnakOlcum.length > 600) window.__tirnakOlcum.shift(); }
    if (anim && !hareket && !animler.has('zoom')) { /* az hareket / gizli sekme: animasyonlar yine biter ama kare kare koşmaz */ }
    if (anim || kirli.arka || kirli.tirnak || (kirli.ust && !canliCizim)) raf = requestAnimationFrame(dongu);
  }
  function boyutla() {
    if (!ui.katman || !tuvalA) return;
    const r = ui.katman.getBoundingClientRect();
    cssW = Math.max(1, Math.round(r.width)); cssH = Math.max(1, Math.round(r.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    [tuvalA, tuvalT, tuvalU].forEach(c => { c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr); c.style.width = cssW + 'px'; c.style.height = cssH + 'px'; });
    if (!gorunum.odak && d) gorunumSifirla();
    onbellek.clear(); hepsiniCiz();
  }
  /* yakınlaştırma: tek tırnağa odak ya da genel görünüm */
  function odakla(y) {
    let hedef;
    if (y) {
      const t = d.eller[y.taraf][y.i], L = tirnakBoyu(t, y.nw), mid = M.uygula(y.m, 0, -L * .38);
      const s0 = Math.min(cssW / W, cssH / H) || 1, boy = (L + y.nw * 1.4) * y.olc, z = sinir((cssH - 60) / s0 / (boy * 1.25), 1.6, 4.2);
      hedef = { z, x: mid.x, y: mid.y };
    } else { const pv = pozGorunum(); hedef = { z: pv.z, x: pv.x, y: pv.y }; }
    gorunum.odak = !!y;
    const bas = { z: gorunum.z, x: gorunum.x, y: gorunum.y };
    if (ctx.azHareket) { Object.assign(gorunum, hedef); onbellek.clear(); hepsiniCiz(); odakDugmesi(); return; }
    animler.set('zoom', { bas: performance.now(), sure: 320, arka: true, tirnak: true,
      adim: p => { const e = 1 - Math.pow(1 - p, 3); gorunum.z = bas.z + (hedef.z - bas.z) * e; gorunum.x = bas.x + (hedef.x - bas.x) * e; gorunum.y = bas.y + (hedef.y - bas.y) * e; },
      bitti: () => { Object.assign(gorunum, hedef); onbellek.clear(); hepsiniCiz(); } });
    iste(); odakDugmesi();
  }
  function odakDugmesi() { if (ui.odakDugme) ui.odakDugme.setAttribute('aria-pressed', String(gorunum.odak)); }

  /* ------------------------------------------------------------ üst katman: animasyonlar ve araç imleçleri */
  function animKatmani(g, simdi) {
    const lamba = animler.get('lamba'), kase = animler.get('kase'), top = animler.get('topParilti');
    if (kase) {
      const p = sinir((simdi - kase.bas) / kase.sure, 0, 1), cik = p < .15 ? p / .15 : p > .85 ? (1 - p) / .15 : 1;
      const ust = yerlesim.filter(y => y.taraf === d.el).reduce((m, y) => Math.min(m, M.uygula(y.m, 0, -tirnakBoyu(d.eller[y.taraf][y.i], y.nw)).y), H);
      const y0 = H - (H - ust + 30) * cik;
      g.save(); g.globalAlpha = .9;
      const kg = g.createLinearGradient(0, y0, 0, H); kg.addColorStop(0, 'rgba(190,230,245,.55)'); kg.addColorStop(1, 'rgba(150,205,230,.75)');
      g.fillStyle = kg; g.beginPath(); g.moveTo(20, y0); g.quadraticCurveTo(W / 2, y0 - 10, W - 20, y0); g.lineTo(W - 10, H + 10); g.lineTo(10, H + 10); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); for (let x = 20; x <= W - 20; x += 6) g.lineTo(x, y0 + Math.sin(x * .08 + simdi / 160) * 2.2); g.stroke();
      const r = tohumla(Math.floor(simdi / 400)); g.fillStyle = 'rgba(255,255,255,.7)';
      for (let k = 0; k < 18; k++) { const bx = 30 + r() * (W - 60), by = y0 + 20 + ((simdi / 9 + k * 37) % (H - y0)); g.beginPath(); g.arc(bx, H - (by - y0), 1.5 + r() * 2.5, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
    if (lamba) {
      const p = sinir((simdi - lamba.bas) / lamba.sure, 0, 1), cik = p < .12 ? p / .12 : p > .9 ? (1 - p) / .1 : 1;
      const yy = -170 + 190 * cik;
      g.save(); g.translate(0, yy);
      const kubbe = new Path2D(); kubbe.moveTo(30, 300); kubbe.bezierCurveTo(30, 90, 330, 90, 330, 300); kubbe.lineTo(300, 300); kubbe.bezierCurveTo(300, 130, 60, 130, 60, 300); kubbe.closePath();
      g.globalAlpha = .9 * cik; const ig = g.createRadialGradient(180, 240, 20, 180, 240, 200); ig.addColorStop(0, 'rgba(170,120,255,.32)'); ig.addColorStop(1, 'rgba(120,80,255,0)');
      g.fillStyle = ig; g.fillRect(0, 60, W, 300);
      const lg = g.createLinearGradient(30, 0, 330, 0); lg.addColorStop(0, '#E9E3F2'); lg.addColorStop(.5, '#FFFFFF'); lg.addColorStop(1, '#D8CFE6');
      g.globalAlpha = .96; g.fillStyle = lg; g.fill(kubbe); g.strokeStyle = 'rgba(120,100,150,.35)'; g.lineWidth = 1.2; g.stroke(kubbe);
      for (let k = 0; k < 9; k++) { const a = Math.PI + k * Math.PI / 8, x = 180 + Math.cos(a) * 132, y = 290 + Math.sin(a) * 175; g.fillStyle = 'rgba(190,150,255,' + (.6 + .4 * Math.sin(simdi / 90 + k)) + ')'; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
      const kalan = Math.ceil(d.lambaSure * (1 - p));
      g.fillStyle = '#5B4A7A'; g.font = '800 22px ' + yaziAile(); g.textAlign = 'center'; g.fillText(kalan + ' sn', 180, 154);
      g.font = '700 10px ' + yaziAile(); g.fillText('UV/LED', 180, 168);
      g.restore();
    }
    if (top) {
      const p = sinir((simdi - top.bas) / top.sure, 0, 1);
      top.yer.forEach(y => {
        const t = d.eller[y.taraf][y.i], L = tirnakBoyu(t, y.nw), hw = y.nw / 2, V = gorunumMatrisi();
        g.save(); g.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]); uygulaG(g, y.m); g.clip(tirnakYol2D(t.sekil, y.nw, L));
        const yy = -L * 1.1 + L * 1.6 * p; const bg = g.createLinearGradient(0, yy - hw, 0, yy + hw);
        bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(.5, 'rgba(255,255,255,.85)'); bg.addColorStop(1, 'rgba(255,255,255,0)');
        g.rotate(-.4); g.fillStyle = bg; g.fillRect(-L, yy - hw, L * 2, hw * 2); g.restore();
      });
    }
  }
  function yaziAile() { return '"Nunito", "Sour Gummy", system-ui, sans-serif'; }
  function aracImleci(g, im) {
    g.save(); g.translate(im.x, im.y);
    const tur = im.tur;
    if (tur === 'aseton') { g.rotate(-.3); pamukCiz(g, 0, 0, .8); const h = d.hazirlik[d.el]; g.fillStyle = rgba(h.eski.renk, .35); g.beginPath(); g.ellipse(0, 2, 9, 5, 0, 0, Math.PI * 2); g.fill(); }
    else if (tur === 'itici') { g.rotate(-.5); g.fillStyle = '#C9CED8'; g.fillRect(-2, 0, 4, 46); const lg = g.createLinearGradient(-6, 0, 6, 0); lg.addColorStop(0, '#9AA2AF'); lg.addColorStop(.5, '#F3F5F8'); lg.addColorStop(1, '#8D95A3'); g.fillStyle = lg; g.beginPath(); g.moveTo(-6, 0); g.quadraticCurveTo(0, -8, 6, 0); g.lineTo(2, 6); g.lineTo(-2, 6); g.closePath(); g.fill(); }
    else if (tur === 'torpu') { torpuNesnesi(g, 0, 0, .5, -.05); }
    else if (tur === 'parlatici') { g.rotate(-.2); const lg = g.createLinearGradient(-20, 0, 20, 0); lg.addColorStop(0, '#F9F3FF'); lg.addColorStop(.5, '#E9DDFB'); lg.addColorStop(1, '#C8B7E8'); g.fillStyle = lg; g.beginPath(); g.roundRect ? g.roundRect(-20, -9, 40, 18, 4) : g.rect(-20, -9, 40, 18); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-18, -7, 36, 3); }
    else if (tur === 'tozf') { g.rotate(-.6); g.fillStyle = '#E8B4C4'; g.fillRect(-3, -42, 6, 30); g.fillStyle = '#FBF6F3'; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(k * .9, -12); g.lineTo(k * 1.4, 8); g.lineWidth = 1.2; g.strokeStyle = '#F5EEE9'; g.stroke(); } }
    else if (tur === 'miknatis') { g.fillStyle = '#E04A5A'; g.beginPath(); g.arc(0, 0, 10, Math.PI, 0); g.lineTo(10, 14); g.lineTo(5, 14); g.lineTo(5, 0); g.arc(0, 0, 5, 0, Math.PI, true); g.lineTo(-5, 14); g.lineTo(-10, 14); g.closePath(); g.fill(); g.fillStyle = '#D5DAE2'; g.fillRect(-10, 12, 5, 5); g.fillRect(5, 12, 5, 5); }
    else if (tur === 'yag') { damlaliksCiz(g, 0, -26, .6, 0); }
    g.restore();
  }

  /* ------------------------------------------------------------ düzenleme yardımcıları ve geçmiş (60 adım) */
  const aktifTirnak = () => d.eller[d.el][d.secim.parmak];
  function hedefler() { return d.secim.hepsi ? [0, 1, 2, 3, 4] : [d.secim.parmak]; }
  function anlik() { return JSON.stringify({ e: d.eller, h: d.hazirlik }); }
  function gecmisKaydet() { gecmis.push(anlik()); if (gecmis.length > GECMIS_SINIR) gecmis.shift(); gelecek.length = 0; altbarGuncelle(); }
  function anlikYukle(s) { const o = JSON.parse(s); d.eller = ellerDuzelt(o.e); d.hazirlik = { sol: hazirlikDuzelt(o.h && o.h.sol, true), sag: hazirlikDuzelt(o.h && o.h.sag, true) }; }
  function uygula(fn, sessiz) { if (!sessiz) gecmisKaydet(); hedefler().forEach(i => fn(d.eller[d.el][i], i)); tirnakCizIste(); kaydetGec(); }
  function geriAl() {
    if (!gecmis.length) { ctx.toast('Geri alınacak bir şey yok'); return; }
    gelecek.push(anlik()); anlikYukle(gecmis.pop());
    seciliParca = null; ctx.ses.pit(); hepsiniCiz(); kaydetGec(); panelYenile(); altbarGuncelle(); ctx.toast('Geri alındı');
  }
  function yinele() {
    if (!gelecek.length) { ctx.toast('Yinelenecek bir şey yok'); return; }
    gecmis.push(anlik()); anlikYukle(gelecek.pop());
    seciliParca = null; ctx.ses.pit(); hepsiniCiz(); kaydetGec(); panelYenile(); altbarGuncelle();
  }
  function altbarGuncelle() {
    const nav = document.querySelector('#bolum > .altbar'); if (!nav) return;
    const g = nav.querySelector('[data-eylem="geri"]'), y = nav.querySelector('[data-eylem="yinele"]');
    if (g) g.setAttribute('aria-disabled', String(!gecmis.length));
    if (y) y.setAttribute('aria-disabled', String(!gelecek.length));
  }
  function balon(metin, ms) {
    if (!ui.balon) return; clearTimeout(balonT);
    ui.balon.textContent = metin;
    const yer = balonYeriGuncelle();
    ui.balon.classList.add('goster');
    balonT = setTimeout(() => { if (ui.balon) ui.balon.classList.remove('goster'); }, yer === 'dar' ? Math.min(ms || 2600, 1400) : (ms || 2600));
  }
  function balonYeriGuncelle() { const yer = balonYeri(); if (ui.balon) { ui.balon.classList.toggle('tirnak-balon-ust', yer === 'ust'); ui.balon.classList.toggle('tirnak-balon-serit', yer === 'dar'); } return yer; }
  /* balonu tırnaklardan uzak kenara koy: alt şerit ya da üst şerit; ikisi de doluysa kısa göster */
  function balonYeri() {
    if (!tuvalU || !ui.masa || !yerlesim.length) return 'alt';
    const r = ui.masa.getBoundingClientRect(), bh = Math.max(100, ui.balon.offsetHeight || 0);   // en uzun ipucu (3 satır) payı
    const alt = [r.bottom - 52 - 8 - bh - 6, r.bottom - 52], ust = [r.top + 8 + 44 + 6, r.top + 8 + 44 + 6 + bh + 6];
    let altSay = 0, ustSay = 0;
    yerlesim.forEach(y => {
      const t = d.eller[y.taraf][y.i], L = tirnakBoyu(t, y.nw);
      [-.1, 0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1].forEach(k => {
        const s = M.uygula(y.m, 0, -L * k), c = istemciNokta(s.x, s.y);
        if (c.x < r.left || c.x > r.right) return;
        if (c.y > alt[0] && c.y < alt[1]) altSay++;
        if (c.y > ust[0] && c.y < ust[1]) ustSay++;
      });
    });
    if (!altSay) return 'alt';
    if (!ustSay) return 'ust';
    return 'dar';
  }
  function konumIstemci(taraf, i, ny) {
    const y = yerlesim.find(q => q.taraf === taraf && q.i === i); if (!y) return { x: innerWidth / 2, y: innerHeight / 2 };
    const t = d.eller[taraf][i], p = M.uygula(y.m, 0, -tirnakBoyu(t, y.nw) * (ny == null ? .5 : ny));
    return istemciNokta(p.x, p.y);
  }
  function kurBozuldu(t, katman) { if (d.sistem === 'jel') t.kur[katman] = false; }
  function yapiskanUyar() {
    if (d.sistem !== 'jel') return false;
    const var_ = hedefler().some(i => yapiskanMi(d.eller[d.el][i]));
    if (var_) { balon('Önceki kat kürlenmedi; yapış yapış kalır. Önce lambaya koy.', 3000); ctx.ses.hmpf && ctx.ses.hmpf(); }
    return var_;
  }

  /* ------------------------------------------------------------ hazırlık adımları */
  function hz() { return d.hazirlik[d.el]; }
  const hzAdim = () => HAZIRLIK[Math.min(hz().adim, HAZIRLIK.length - 1)].id;
  function hzTamamMi(id, h) {
    h = h || hz();
    if (id === 'aseton') return h.eski.kalan.every(v => v < .04);
    if (id === 'su') return h.su >= 1;
    if (id === 'itici') return h.kutikul.every(v => v >= .97);
    if (id === 'yag') return h.yag.every(v => v >= 1);
    if (id === 'torpu') return h.torpu.every(v => v >= .99) && (h.puruz == null || h.puruz <= .15);
    if (id === 'parlatici') return h.parlak.every(v => v >= .97);
    if (id === 'tozf') return h.toz.every(v => v <= .04);
    return false;
  }
  function hzIlerle() {
    const h = hz(); if (h.adim >= HAZIRLIK.length) return;
    const id = HAZIRLIK[h.adim].id;
    if (!hzTamamMi(id, h)) return;
    if (id === 'aseton') h.eski.kalan = [0, 0, 0, 0, 0];
    if (id === 'tozf') h.toz = [0, 0, 0, 0, 0];
    h.adim++;
    ctx.ses.parilti();
    const m = ctx.efekt.merkez(ui.masa); ctx.efekt.yildiz(m.x, m.y, 6);
    if (h.adim >= HAZIRLIK.length) {
      balon('Eller hazır. Şimdi şekil zamanı 💅', 3000); ctx.efekt.konfeti(undefined, undefined, 10);
      sonra(() => { if (d.adim === 'hazirlik') adimaGit('sekil'); }, 1400);
    } else balon(HAZIRLIK[h.adim].ipucu, 2800);
    tirnakCizIste(); kaydetGec(); panelYenile();
  }
  function hizliMod() {
    gecmisKaydet();
    const h = hz();
    h.eski.kalan = [0, 0, 0, 0, 0]; h.su = 1; h.kutikul = [1, 1, 1, 1, 1]; h.yag = [1, 1, 1, 1, 1]; h.torpu = [1, 1, 1, 1, 1]; h.parlak = [1, 1, 1, 1, 1]; h.toz = [0, 0, 0, 0, 0]; h.puruz = 0;
    h.adim = HAZIRLIK.length;
    d.eller[d.el].forEach(t => { if (!t.renk && t.uzunluk > .3) t.uzunluk = .2; });
    ctx.ses.parilti(); balon('Hızlı mod: eller hazır.', 2200);
    tirnakCizIste(); kaydetGec(); panelYenile();
    sonra(() => adimaGit('sekil'), 900);
  }
  function yeniManikur() {
    gecmisKaydet();
    d.hazirlik[d.el] = hazirlikYeni(false);
    const h = d.hazirlik[d.el];
    // önceki tasarım "eski oje" olur: rengi korunur, tırnaklar doğal kalır
    const onceki = d.eller[d.el].find(t => t.renk); if (onceki) h.eski.renk = onceki.renk;
    d.eller[d.el] = d.eller[d.el].map((t, i) => Object.assign(tirnakVarsayilan(), { sekil: 'yuvarlak', uzunluk: h.ilkUz[i] }));
    seciliParca = null; ctx.ses.pop(); balon(HAZIRLIK[0].ipucu, 2800);
    hepsiniCiz(); kaydetGec(); panelYenile();
  }
  function suyaDaldir() {
    const h = hz(); if (hzAdim() !== 'su' || animler.has('kase')) return;
    ctx.ses.su && ctx.ses.su(); sonra(() => ctx.ses.kopuk && ctx.ses.kopuk(), 900);
    balon('Ilık su… 3 dakika (hızlandırılmış)', 2600);
    const sure = ctx.azHareket ? 500 : 3600;
    animler.set('kase', { bas: performance.now(), sure, adim: p => { h.su = Math.min(1, p * 1.05); }, bitti: () => { h.su = 1; tirnakCizIste(); kaydetGec(); hzIlerle(); } });
    iste();
  }
  let sesT = 0;
  function sesAralikli(fn, ms) { const t = performance.now(); if (t - sesT > (ms || 140)) { sesT = t; fn(); } }
  function hazirlikSurukle(y, n, dx, dy, e, ilk) {
    const h = hz(), id = hzAdim(), i = y.i, uz = Math.hypot(dx, dy);
    if (y.taraf !== d.el) return;
    if (id === 'aseton') {
      if (h.eski.kalan[i] <= 0) return;
      h.eski.kalan[i] = Math.max(0, h.eski.kalan[i] - uz * .011);
      sesAralikli(() => ctx.ses.slip(), 160); tirnakCizIste();
      if (h.eski.kalan[i] < .04) { h.eski.kalan[i] = 0; ctx.efekt.toz(e.clientX, e.clientY, 2); hzIlerle(); }
    } else if (id === 'itici') {
      if (n.y > .55) return;
      h.kutikul[i] = Math.min(1, h.kutikul[i] + uz * (dy > 0 ? .02 : .008));
      sesAralikli(() => ctx.ses.tik(), 220); tirnakCizIste();
      if (h.kutikul[i] >= .97) { h.kutikul[i] = 1; hzIlerle(); }
    } else if (id === 'torpu') {
      if (n.y < .6) return;
      const kumT = KUMLAR.find(k => k.id === kum) || KUMLAR[1];
      h.torpu[i] = Math.min(1, h.torpu[i] + uz * .006 * kumT.hiz);
      h.toz[i] = Math.min(1, h.toz[i] + uz * .004 * kumT.hiz);
      h.puruz = kumT.puruz;
      const yer = Math.abs(dx) > Math.abs(dy) * 1.6 ? 'yatay' : 'capraz';
      h.yonSay = h.yonSay || { yatay: 0, capraz: 0 }; h.yonSay[yer] += uz;
      const t = d.eller[d.el][i];
      if (!t.renk) { t.uzunluk = h.ilkUz[i] + (.12 - h.ilkUz[i]) * h.torpu[i]; t.sekil = h.yonSay.yatay > h.yonSay.capraz * 1.4 ? 'squoval' : h.yonSay.capraz > h.yonSay.yatay * 1.4 ? 'oval' : 'yuvarlak'; }
      sesAralikli(() => ctx.ses.torpu(), 260); if (Math.random() < .25) ctx.efekt.toz(e.clientX, e.clientY, 1); tirnakCizIste();
      if (h.torpu.every(v => v >= .99)) {
        if (h.puruz > .15) { if (!h.puruzUyari) { h.puruzUyari = true; balon('Kenar pürüzlü kaldı; 240 kum ile bir kez geç.', 3200); panelYenile(); } }
        else hzIlerle();
      }
    } else if (id === 'parlatici') {
      if (n.y < -.05 || n.y > 1) return;
      h.parlak[i] = Math.min(1, h.parlak[i] + uz * .009);
      sesAralikli(() => ctx.ses.slip(), 200); tirnakCizIste();
      if (h.parlak[i] >= .97) { h.parlak[i] = 1; ctx.efekt.yildiz(e.clientX, e.clientY, 2); hzIlerle(); }
    } else if (id === 'tozf') {
      if (h.toz[i] <= 0) return;
      h.toz[i] = Math.max(0, h.toz[i] - uz * .012);
      sesAralikli(() => ctx.ses.uf(), 240); tirnakCizIste();
      if (h.toz.every(v => v <= .04)) hzIlerle();
    }
  }
  function hazirlikDokun(y, e) {
    const h = hz(), id = hzAdim();
    if (id === 'su') { suyaDaldir(); return true; }
    if (id === 'yag' && y && y.taraf === d.el) {
      if (h.yag[y.i] >= 1) return true;
      gecmisKaydet(); h.yag[y.i] = 1; ctx.ses.blop(); const c = konumIstemci(y.taraf, y.i, .02); ctx.efekt.emoji(c.x, c.y, '💧', 1);
      tirnakCizIste(); kaydetGec(); hzIlerle(); return true;
    }
    if (id === 'tozf' && y && h.toz[y.i] <= 0 && h.toz.some(v => v > 0)) balon('Tozlu tırnakları süpür.', 1400);
    return false;
  }

  /* ------------------------------------------------------------ tuval etkileşimi */
  let surukle = null;
  function noktaKaydet(n) { return [Math.round(n.x * 1000) / 1000, Math.round(n.y * 1000) / 1000]; }
  function tuvalBas(e) {
    if (e.button != null && e.button !== 0) return;
    if (surukle && surukle.pid !== e.pointerId) return;       // ikinci parmak yok sayılır
    e.preventDefault(); ctx.ses.uyandir();
    if (ui.balon) { clearTimeout(balonT); ui.balon.classList.remove('goster'); }   // dokununca balon çekilir
    try { tuvalU.setPointerCapture(e.pointerId); } catch (err) {}
    const p = sahneNokta(e), y = tirnakBul(p.x, p.y, 8);
    surukle = { pid: e.pointerId, tur: 'bos', x: p.x, y: p.y, sx: p.x, sy: p.y, bx: p.x, by: p.y, t: performance.now(), t0: performance.now(), y0: y, w: 1, gecmis: false };
    // çift dokunuş: tırnağa odaklan / geri çık
    const simdi = performance.now();
    if (tuvalBas.son && simdi - tuvalBas.son.t < 320 && Math.hypot(tuvalBas.son.x - p.x, tuvalBas.son.y - p.y) < 14) { tuvalBas.son = null; surukle = null; if (gorunum.odak) odakla(null); else if (y) { secTirnak(y); odakla(y); } return; }
    tuvalBas.son = null;
    // bir tırnağa dokunulduysa ve el farklıysa (kalp pozu) o ele geç
    if (y && y.taraf !== d.el) { d.el = y.taraf; seciliParca = null; panelYenile(); }
    if (d.adim === 'hazirlik') {
      if (!hazirMi(d.el)) {
        if (hazirlikDokun(y, e)) { surukle.tur = 'bitti'; return; }
        surukle.tur = 'hazirlik'; imlec = { tur: hzAdim(), x: p.x, y: p.y }; ustCizIste(); return;
      }
    }
    if (d.adim === 'sanat' && y) { sanatBas(e, p, y); return; }
    if (y) {
      surukle.tur = 'sec';
      const t = d.eller[y.taraf][y.i];
      if (t.ojeTur === 'termal') { sicaklik.set(y.taraf + y.i, performance.now()); iste(); }
      if (d.secim.hepsi || d.secim.parmak !== y.i) secTirnak(y);
    }
  }
  function secTirnak(y) {
    d.secim.hepsi = false; d.secim.parmak = y.i; d.el = y.taraf; seciliParca = null;
    ctx.ses.pit(); ustCizIste(); kaydetGec(); panelYenile(); secimYaz();
  }
  function tuvalTasi(e) {
    if (!surukle) { if (d.adim === 'hazirlik' && !hazirMi(d.el) && e.pointerType === 'mouse') { const p = sahneNokta(e); imlec = { tur: hzAdim(), x: p.x, y: p.y }; ustCizIste(); } return; }
    if (e.pointerId !== surukle.pid) return;
    e.preventDefault();
    const t0 = performance.now();
    const olaylar = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    for (const ev of olaylar) tasiTek(ev);
    if (window.__tirnakOlay) window.__tirnakOlay.push(performance.now() - t0);
    if (surukle && surukle.tur === 'hazirlik') { imlec = { tur: hzAdim(), x: surukle.x, y: surukle.y }; ustCizIste(); }
  }
  function tasiTek(e) {
    const s = surukle; if (!s) return;
    const ham = sahneNokta(e);
    // yumuşatma: üstel ortalama (titreme süzgeci) + hız → kalınlık (basınç benzeri)
    const a = s.tur === 'firca' && (s.arac === 'striping') ? .28 : .5;
    const px = s.x + (ham.x - s.x) * a, py = s.y + (ham.y - s.y) * a;
    const dx = px - s.x, dy = py - s.y, simdi = performance.now(), dt = Math.max(1, simdi - s.t);
    const hiz = Math.hypot(dx, dy) / dt;
    let w = sinir(1.22 - hiz * 1.6, .42, 1.22);
    if (e.pointerType === 'pen' && e.pressure > 0) w = .3 + e.pressure * 1.1;
    s.w = s.w * .65 + w * .35;
    s.x = px; s.y = py; s.t = simdi;
    if (s.tur === 'hazirlik') {
      const y = tirnakBul(px, py, 10); if (!y) return;
      if (!s.gecmis) { gecmisKaydet(); s.gecmis = true; }
      const n = normalNokta(y, px, py), q0 = M.uygula(y.ters, px - dx, py - dy), q1 = M.uygula(y.ters, px, py);
      hazirlikSurukle(y, n, q1.x - q0.x, q1.y - q0.y, e);
    } else if (s.tur === 'firca') fircaTasi(px, py);
    else if (s.tur === 'sanatAyar') sanatAyarTasi(px, py, e);
    else if (s.tur === 'parca') parcaTasi(px, py);
    else if (s.tur === 'sec' && d.adim === 'sekil') {
      if (Math.hypot(px - s.sx, py - s.sy) > 6) { sesAralikli(() => { ctx.ses.torpu(); ctx.efekt.toz(e.clientX, e.clientY, 1); }, 280); s.sx = px; s.sy = py; }
    }
  }
  function tuvalBirak(e) {
    if (!surukle || (e && e.pointerId !== surukle.pid)) return;
    const s = surukle; surukle = null;
    try { if (e && e.pointerId != null) tuvalU.releasePointerCapture(e.pointerId); } catch (err) {}
    // yalnız kısa ve kıpırdamadan yapılan dokunuş çift dokunuşa sayılır
    const kisa = performance.now() - s.t0 < 280 && Math.hypot(s.x - s.bx, s.y - s.by) < 4 && !['firca', 'hazirlik', 'parca', 'sanatAyar', 'mermerBas'].includes(s.tur);
    tuvalBas.son = kisa ? { t: performance.now(), x: s.bx, y: s.by } : null;
    if (s.tur === 'hazirlik') { imlec = null; ustCizIste(); kaydetGec(); panelYenile(); }
    if (s.tur === 'firca') { canliCizim = false; tirnakCizIste(); kaydetGec(); }
    if (s.tur === 'sanatAyar') { tirnakCizIste(); kaydetGec(); panelYenile(); }
    if (s.tur === 'mermerBas') mermerBirak(s);
    if (s.tur === 'parca') { tirnakCizIste(); kaydetGec(); panelYenile(); }
  }
  function tuvalCik() { if (!surukle && imlec) { imlec = null; ustCizIste(); } }

  /* ------------------------------------------------------------ sanat araçları (parmakla çizim) */
  const CIZIM_ARACLARI = ['nokta', 'liner', 'striping', 'detay', 'silgi', 'sunger', 'boomer', 'folyo'];
  function fircaBoyu(id) {
    const b = arac.boy;                  // 1–10
    if (id === 'nokta') return (NOKTA_BOYLARI.find(x => x.id === arac.nokta) || NOKTA_BOYLARI[1]).r;
    if (id === 'liner') return .02 + b * .009;
    if (id === 'striping') return .016 + b * .006;
    if (id === 'detay') return .04 + b * .016;
    if (id === 'silgi') return .08 + b * .03;
    if (id === 'sunger' || id === 'boomer') return .22 + b * .03;
    if (id === 'folyo') return .14 + b * .03;
    return .1;
  }
  function hedefTirnaklar(y) { return d.secim.hepsi && y.taraf === d.el ? yerlesim.filter(q => q.taraf === y.taraf) : [y]; }
  function sanatBas(e, p, y) {
    const s = surukle, id = arac.id, t = d.eller[y.taraf][y.i], n = normalNokta(y, p.x, p.y);
    if (!d.secim.hepsi && d.secim.parmak !== y.i) { d.secim.parmak = y.i; secimYaz(); panelYenile(); }
    if (CIZIM_ARACLARI.includes(id)) {
      gecmisKaydet();
      const tur = id === 'boomer' ? 'sunger' : id;
      const yeni = { tur, renk: id === 'boomer' ? '#F5CFD5' : id === 'folyo' ? (FOLYOLAR.find(f => f.id === arac.folyo) || FOLYOLAR[0]).renk : arac.renk, boy: Math.round(fircaBoyu(id) * 1000) / 1000, n: [] };
      if (tur === 'sunger') yeni.renk2 = id === 'boomer' ? '#FFFFFF' : arac.renk2;
      const hedef = hedefTirnaklar(y);
      s.vuruslar = hedef.map(q => { const v = kopya(yeni); const l = d.eller[q.taraf][q.i].firca; if (l.length >= 120) l.shift(); l.push(v); return { y: q, v }; });
      s.tur = 'firca'; s.arac = id; s.yAna = y; s.sonN = null;
      canliCizim = true; imlec = null; ustCiz(performance.now());
      fircaEkle(n, 1);
      if (id === 'silgi') ctx.ses.pit(); else ctx.ses.slip();
      return;
    }
    if (id === 'miknatis') {
      gecmisKaydet();
      hedefTirnaklar(y).forEach(q => { const tt = d.eller[q.taraf][q.i]; if (tt.ojeTur !== 'kediGozu') { tt.ojeTur = 'kediGozu'; if (!tt.renk) tt.renk = '#2E1A47'; tt.kat = Math.max(2, tt.kat || 2); kurBozuldu(tt, 'renk'); } if (!tt.kedi) tt.kedi = { x: 0, y: .5, aci: -.5, gen: .5 }; });
      s.tur = 'sanatAyar'; s.arac = id; s.yAna = y; s.n0 = n; imlec = { tur: 'miknatis', x: p.x, y: p.y };
      sanatAyarTasi(p.x, p.y, e); ctx.ses.tink(); return;
    }
    if (id === 'aura' || id === 'french' || id === 'yarimAy') {
      gecmisKaydet(); s.tur = 'sanatAyar'; s.arac = id; s.yAna = y; s.n0 = n;
      hedefTirnaklar(y).forEach(q => { const tt = d.eller[q.taraf][q.i]; if (!tt.renk) { tt.renk = '#F4CFD8'; tt.kat = 2; } tt.teknik = Object.assign({}, tt.teknik, { id, renk2: arac.renk2 || '#FFFFFF', stil: arac.frenchStil }); if (id === 'aura') { tt.teknik.x = sinir(n.x, -1, 1); tt.teknik.y = sinir(n.y, 0, 1); tt.teknik.kalinlik = .25; } });
      sanatAyarTasi(p.x, p.y, e); ctx.ses.slip(); return;
    }
    if (id === 'mermer') { gecmisKaydet(); s.tur = 'mermerBas'; s.yAna = y; s.n0 = n; s.sx = p.x; s.sy = p.y; return; }
    if (id === 'damga' || id === 'cikartma' || id === 'sus') {
      const liste = id === 'damga' ? 'damgalar' : id === 'sus' ? 'susler' : 'cikartmalar';
      const nw = y.nw, L = tirnakBoyu(t, nw);
      let en = -1, enM = 1e9;
      t[liste].forEach((c, k) => { const dx = ((c.x || 0) - n.x) * nw / 2, dy = ((c.y == null ? .5 : c.y) - n.y) * L; const m = Math.hypot(dx, dy); const r = Math.max((c.olcek || .4) * nw * .6, 8); if (m < r && m < enM) { en = k; enM = m; } });
      if (en >= 0) {
        const c = t[liste][en]; seciliParca = { taraf: y.taraf, parmak: y.i, liste, i: en };
        s.tur = 'parca'; s.yAna = y; s.liste = liste; s.i = en; s.dx = (c.x || 0) - n.x; s.dy = (c.y == null ? .5 : c.y) - n.y; s.gecmis = false;
        ctx.ses.pit(); ustCizIste(); panelYenile(); return;
      }
      gecmisKaydet();
      let yeni;
      if (id === 'damga') yeni = { desen: arac.damga, renk: arac.renk, x: sinir(n.x, -1, 1), y: sinir(n.y, 0, 1), aci: 0, olcek: 1, tohum: yeniTohum() };
      else if (id === 'sus') { const tanim = SUSLER.find(x => x.id === arac.sus) || SUSLER[1]; yeni = { id: tanim.id, x: sinir(n.x, -.9, .9), y: sinir(n.y, .05, .95), olcek: tanim.olcek, don: 0, renk: arac.tasRenk }; }
      else yeni = { id: arac.cikartma, x: sinir(n.x, -.9, .9), y: sinir(n.y, .05, .95), olcek: .5, don: 0, renk: arac.renk };
      hedefTirnaklar(y).forEach(q => { const l = d.eller[q.taraf][q.i][liste]; if (l.length >= 14) l.shift(); l.push(kopya(yeni)); });
      seciliParca = { taraf: y.taraf, parmak: y.i, liste, i: t[liste].length - 1 };
      s.tur = 'parca'; s.yAna = y; s.liste = liste; s.i = t[liste].length - 1; s.dx = 0; s.dy = 0; s.gecmis = true;
      if (id === 'sus') ctx.ses.tink(); else ctx.ses.pop();
      ctx.efekt.yildiz(e.clientX, e.clientY, 3);
      tirnakCizIste(); kaydetGec(); panelYenile();
    }
  }
  function fircaEkle(n, w) {
    const s = surukle, k = [Math.round(n.x * 1000) / 1000, Math.round(n.y * 1000) / 1000, Math.round(w * 100) / 100];
    const ilk = s.vuruslar[0].v, son = ilk.n[ilk.n.length - 1];
    if (son) {
      const L = tirnakBoyu(d.eller[s.yAna.taraf][s.yAna.i], s.yAna.nw), hw = s.yAna.nw / 2, mes = Math.hypot((son[0] - k[0]) * hw, (son[1] - k[1]) * L);
      const esik = s.arac === 'nokta' ? hw * ilk.boy * 4.6 : s.arac === 'sunger' || s.arac === 'boomer' ? hw * ilk.boy * .9 : .55;
      if (mes < esik) return;
      if (ilk.n.length >= 500) return;
    }
    s.vuruslar.forEach(({ y, v }) => { v.n.push(k); canliParca(y, v, v.n.length - 1); });
  }
  function fircaTasi(px, py) { const s = surukle; const n = normalNokta(s.yAna, px, py); fircaEkle({ x: sinir(n.x, -1.3, 1.3), y: sinir(n.y, -.2, 1.2) }, s.w); if (s.arac === 'silgi') { sesAralikli(() => {}, 0); throttleTirnak(); } }
  let tirnakT = 0;
  function throttleTirnak() { const t = performance.now(); if (t - tirnakT > 60) { tirnakT = t; kirli.tirnak = true; iste(); } }
  /* canlı fırça izi: sadece yeni parçayı üst katmana çizer (tam yeniden çizim yok) */
  function canliParca(y, v, k) {
    if (v.tur === 'silgi') return;
    const t = d.eller[y.taraf][y.i], L = tirnakBoyu(t, y.nw), hw = y.nw / 2, V = gorunumMatrisi();
    gU.save(); gU.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]); uygulaG(gU, y.m); gU.clip(tirnakYol2D(t.sekil, y.nw, L));
    const tek = { tur: v.tur, renk: v.renk, renk2: v.renk2, boy: v.boy, n: v.n.slice(Math.max(0, k - 1), k + 1) };
    if (v.tur === 'folyo') { gU.strokeStyle = v.renk; gU.lineWidth = v.boy * y.nw; gU.lineCap = 'round'; const a = tek.n[0], b = tek.n[tek.n.length - 1]; gU.beginPath(); gU.moveTo(a[0] * hw, -a[1] * L); gU.lineTo(b[0] * hw + .01, -b[1] * L); gU.stroke(); }
    else if (v.tur === 'nokta' || v.tur === 'sunger') { tek.n = [v.n[k]]; cizgiCiz(gU, tek, hw, L, y.nw, (t.tohum || 1) + k, gU.getTransform()); }
    else cizgiCiz(gU, tek, hw, L, y.nw, 1, gU.getTransform());
    gU.restore();
  }
  function sanatAyarTasi(px, py, e) {
    const s = surukle, y = s.yAna, n = normalNokta(y, px, py), id = s.arac;
    hedefTirnaklar(y).forEach(q => {
      const t = d.eller[q.taraf][q.i];
      if (id === 'miknatis') {
        const dx = n.x - (s.n0 ? s.n0.x : n.x), dy = n.y - (s.n0 ? s.n0.y : n.y);
        t.kedi = { x: sinir(n.x, -1.2, 1.2), y: sinir(n.y, -.1, 1.1), aci: (Math.abs(dx) + Math.abs(dy) > .08) ? Math.atan2(dx, dy * 2) : (t.kedi ? t.kedi.aci : -.5), gen: arac.kediGen || .5 };
      } else if (id === 'aura') {
        const R = Math.hypot((n.x - s.n0.x) * .5, n.y - s.n0.y);
        t.teknik.kalinlik = sinir(.15 + R * 1.4, .1, .9);
      } else if (id === 'french') t.teknik.kalinlik = sinir(1 - n.y, .06, .6);
      else if (id === 'yarimAy') t.teknik.kalinlik = sinir(n.y, .1, .5);
    });
    if (id === 'miknatis') { imlec = { tur: 'miknatis', x: px, y: py }; sesAralikli(() => ctx.ses.tink(), 300); }
    kirli.tirnak = true; kirli.ust = true; iste();
  }
  function mermerBirak(s) {
    const y = s.yAna, uz = Math.hypot(s.x - s.sx, s.y - s.sy);
    hedefTirnaklar(y).forEach(q => {
      const t = d.eller[q.taraf][q.i];
      if (!t.renk) { t.renk = '#FFFFFF'; t.kat = 2; }
      if (!t.suMermer) t.suMermer = { damlalar: [], cizgiler: [] };
      const sm = t.suMermer;
      if (uz < 5) { if (sm.damlalar.length >= 6) sm.damlalar.shift(); sm.damlalar.push({ x: Math.round(s.n0.x * 100) / 100, y: Math.round(s.n0.y * 100) / 100, renkler: arac.mermerRenkler.concat(arac.mermerRenkler).slice(0, 6) }); }
      else { const n1 = normalNokta(y, s.x, s.y); if (sm.cizgiler.length >= 10) sm.cizgiler.shift(); sm.cizgiler.push([s.n0.x, s.n0.y, n1.x, n1.y].map(v => Math.round(v * 100) / 100)); }
    });
    ctx.ses.blop(); tirnakCizIste(); kaydetGec(); panelYenile();
    if (uz < 5) balon('Damla düştü. Şimdi iğneyle sürükleyip çek.', 2200);
  }
  function parcaTasi(px, py) {
    const s = surukle, y = s.yAna, n = normalNokta(y, px, py);
    const l = d.eller[y.taraf][y.i][s.liste], c = l && l[s.i]; if (!c) return;
    if (!s.gecmis) { gecmisKaydet(); s.gecmis = true; }
    c.x = sinir(n.x + s.dx, -1, 1); c.y = sinir(n.y + s.dy, -.05, 1.02);
    if (d.secim.hepsi) d.eller[y.taraf].forEach((t, k) => { if (k === y.i) return; const e2 = t[s.liste][s.i]; if (e2 && (e2.id || e2.desen) === (c.id || c.desen)) { e2.x = c.x; e2.y = c.y; } });
    kirli.tirnak = true; kirli.ust = true; iste();
  }
  function seciliParcaAl() { if (!seciliParca) return null; const l = d.eller[seciliParca.taraf][seciliParca.parmak][seciliParca.liste]; return (l && l[seciliParca.i]) || null; }
  function seciliParcaDegistir(fn) { const p = seciliParcaAl(); if (!p) return; fn(p); tirnakCizIste(); kaydetGec(); }
  function seciliParcaSil() { if (!seciliParca) return; gecmisKaydet(); const l = d.eller[seciliParca.taraf][seciliParca.parmak][seciliParca.liste]; l.splice(seciliParca.i, 1); seciliParca = null; ctx.ses.pit(); tirnakCizIste(); kaydetGec(); panelYenile(); }

  /* ------------------------------------------------------------ salon eylemleri */
  function sekilUygula(id) {
    uygula(t => { t.sekil = id; });
    const s = SEKILLER.find(x => x.id === id); ctx.ses.torpu();
    hedefler().forEach((i, k) => sonra(() => { const c = konumIstemci(d.el, i, 1); ctx.efekt.toz(c.x, c.y, 2); }, 100 + k * 60));
    balon(s ? s.tr + ': ' + s.not : 'Törpülendi.'); panelYenile();
  }
  function uzunlukUygula(v) { uygula(t => { t.uzunluk = v; }); ctx.ses.torpu(); panelYenile(); }
  function protezUygula(id) {
    uygula(t => { t.protez = id; if (id && t.uzunluk < .4) t.uzunluk = .55; });
    const p = PROTEZLER.find(x => x.id === id); ctx.ses.pop(); balon(p ? p.not : ''); panelYenile();
  }
  function bazUygula(id) {
    if (yapiskanUyar()) return;
    uygula(t => { t.baz = id; kurBozuldu(t, 'baz'); }); ctx.ses.slip();
    const b = BAZLAR.find(x => x.id === id); balon((b ? b.not : 'Taban sürüldü.') + (d.sistem === 'jel' ? ' Şimdi lambaya koy.' : ''), 2600); panelYenile();
  }
  function renkUygula(r, tur, renk2) {
    if (yapiskanUyar()) return;
    const ayniMi = hedefler().every(i => { const t = d.eller[d.el][i]; return t.renk === r && t.ojeTur === (tur || 'krem'); });
    uygula((t, i) => {
      if (ayniMi && t.kat < 3) t.kat++;
      else if (!ayniMi) { t.renk = r; t.ojeTur = tur || 'krem'; t.kat = 1; t.renk2 = renk2 || null; if (t.ojeTur === 'kediGozu' && !t.kedi) t.kedi = { x: 0, y: .5, aci: -.5, gen: .5 }; t.tohum = yeniTohum(); }
      kurBozuldu(t, 'renk');
      if (!ctx.azHareket) animler.set('oje' + d.el + i, { bas: performance.now() + i * 90, sure: 780, tirnak: true });
    });
    d.sonRenkler = [r].concat(d.sonRenkler.filter(x => x !== r)).slice(0, 10);
    [0, 150, 300].forEach(ms => sonra(() => ctx.ses.slip(), ms));
    const t = aktifTirnak(), ad = renkAdi(r);
    balon((ad ? ad + ' · ' : '') + t.kat + '. kat' + (t.kat < 3 && (KAT_ALFA[t.ojeTur] || [])[t.kat] < .95 ? ' — bir kat daha örtücü olur' : '') + (d.sistem === 'jel' ? ' · lambaya koy' : ''), 2400);
    panelYenile(); iste();
  }
  function katAyarla(k) { if (yapiskanUyar() && k > aktifTirnak().kat) return; uygula(t => { if (t.renk) { t.kat = k; kurBozuldu(t, 'renk'); } }); ctx.ses.slip(); panelYenile(); }
  function ojeSil() { uygula(t => { t.renk = null; t.kat = 0; t.kedi = null; t.efekt = 'yok'; t.kur.renk = true; }); balon('Oje silindi, tırnak nefes alıyor.'); panelYenile(); }
  function efektUygula(id) { uygula(t => { t.efekt = id; t.tohum = yeniTohum(); if (!t.renk) { t.renk = '#F4CFD8'; t.kat = 2; } }); ctx.ses.tink(); const e = EFEKTLER.find(x => x.id === id); balon(e ? e.ad + ' tozu ovuldu.' : ''); panelYenile(); }
  function ustUygula(id) {
    if (yapiskanMi(aktifTirnak()) && aktifTirnak().kur.renk === false) { yapiskanUyar(); return; }
    uygula((t, i) => { t.top = true; t.ust = id; kurBozuldu(t, 'top'); });
    const yer = hedefYerlesim();
    if (!ctx.azHareket) animler.set('topParilti', { bas: performance.now(), sure: 900, yer });
    ctx.ses.tink(); sonra(() => ctx.ses.parilti(), 350);
    hedefler().forEach((i, k) => sonra(() => { const c = konumIstemci(d.el, i, .6); ctx.efekt.yildiz(c.x, c.y, 3); }, 120 + k * 80));
    const u = USTLER.find(x => x.id === id);
    balon((u ? u.not : '') + (d.sistem === 'jel' ? ' Lambaya koymayı unutma.' : ' Pıttıksu\'ya göster.'), 2600); panelYenile(); iste();
  }
  function ustSil() { uygula(t => { t.top = false; t.kur.top = true; }); ctx.ses.pit(); panelYenile(); }
  function lambayaKoy() {
    if (animler.has('lamba')) return;
    const bekleyen = d.eller[d.el].some(yapiskanMi);
    ctx.ses.tik();
    const bitir = () => { d.eller[d.el].forEach(t => { t.kur = { baz: true, renk: true, top: true }; }); tirnakCizIste(); kaydetGec(); panelYenile(); ctx.ses.can(); balon(bekleyen ? 'Kürlendi; artık yapışmıyor ✨' : 'Kürlendi. Zaten sertti ama olsun ✨', 2400); };
    if (ctx.azHareket) { bitir(); return; }
    animler.set('lamba', { bas: performance.now(), sure: d.lambaSure === 60 ? 4200 : 2800, bitti: bitir });
    balon(d.lambaSure + ' saniye (hızlandırılmış)…', 1800); iste();
  }
  function sistemDegistir(s) { d.sistem = s; ctx.ses.tik(); kaydetGec(); panelYenile(); balon(s === 'jel' ? 'Jel sistem: her kattan sonra UV/LED lamba.' : 'Klasik oje: lamba gerekmez, kendiliğinden kurur.', 2600); }
  function parcalariTemizle(liste) { uygula(t => { t[liste] = []; }); seciliParca = null; ctx.ses.pit(); panelYenile(); }
  function sanatTemizle() { uygula(t => { t.firca = []; t.damgalar = []; t.suMermer = null; t.cikartmalar = []; t.susler = []; t.teknik = { id: 'yok', renk2: '#FFFFFF', kalinlik: .3 }; t.desen = null; }); seciliParca = null; ctx.ses.pit(); panelYenile(); }
  function desenUygula(id) { uygula(t => { t.desen = id ? { id, renk: arac.renk } : null; if (id && !t.renk) { t.renk = '#F4CFD8'; t.kat = 2; } }); ctx.ses.pop(); panelYenile(); }
  function aynala() {
    const kaynak = d.el, hedef = kaynak === 'sol' ? 'sag' : 'sol';
    gecmisKaydet(); d.eller[hedef] = elDuzelt(kopya(d.eller[kaynak])); d.eller[hedef].forEach(t => { t.tohum = yeniTohum(); });
    d.hazirlik[hedef] = kopya(d.hazirlik[kaynak]);
    ctx.ses.parilti(); tirnakCizIste(); kaydetGec();
    ctx.toast((hedef === 'sol' ? 'Sol' : 'Sağ') + ' ele de uygulandı ✨');
  }
  function elDegistir(el) {
    d.el = el || (d.el === 'sol' ? 'sag' : 'sol'); seciliParca = null; ctx.ses.pop();
    pozYenile(); gorunumSifirla(); odakDugmesi();
    if (ui.katman && !ctx.azHareket) { ui.katman.classList.remove('cevir'); void ui.katman.offsetWidth; ui.katman.classList.add('cevir'); }
    hepsiniCiz(); kaydetGec(); panelYenile(); secimYaz();
  }
  function pozDegistir(id) { d.poz = id; pozYenile(); gorunumSifirla(); ctx.ses.pop(); hepsiniCiz(); kaydetGec(); odakDugmesi(); }
  function setUygula(set) {
    gecmisKaydet();
    ['sol', 'sag'].forEach(taraf => {
      d.eller[taraf] = d.eller[taraf].map((t, i) => tirnakDuzelt(Object.assign(tirnakVarsayilan(), kopya(set.yap(i)), { v: SURUM })));
      d.hazirlik[taraf] = hazirlikYeni(true);
    });
    seciliParca = null; ctx.ses.parilti(); ctx.efekt.konfeti(undefined, undefined, set.inci ? 18 : 10);
    hepsiniCiz(); kaydetGec(); if (d.adim === 'hazirlik') d.adim = 'renk'; panelYenile(); ctx.sheetKapat();
    ctx.toast(set.ad + ' hazır; istediğini değiştir 💅');
  }
  function rastgeleIlham() { setUygula(Object.assign({}, CD.rastgele(TRENDLER), { inci: false })); }
  function pittiksuyaGoster() { ctx.ses.minikMiyav(); const m = ctx.efekt.merkez(ui.masa); ctx.efekt.kalp(m.x, m.y, 6); balon('Pıttıksu: ' + CD.rastgele(PITTIKSU_SOZ) + ' 🐾', 3200); }

  /* ------------------------------------------------------------ fotoğraf (PNG) ve küçük önizlemeler */
  function veriSimdi() { return { eller: d.eller, ten: d.ten, poz: d.poz, el: d.el, zemin: d.zemin, isik: d.isik, isikAci: d.isikAci, hazirlik: d.hazirlik }; }
  function fotografCiz(w, h, v, o) {
    o = o || {};
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const bant = o.cerceve ? Math.round(h * .12) : 0, sh = h - bant;
    const pv = POZ_GORUNUM[v.poz] || POZ_GORUNUM.duz;
    const s = Math.max(w / W, sh / H) * pv.z * .9 * (o.yakin || 1);
    const V = [s, 0, 0, s, w / 2 - (pv.x - 4) * s, sh / 2 - (pv.y - 22) * s];
    const orn = pozKur(v.poz || 'duz', v.el || 'sag'), yer = tirnakYerlesimi(orn), ten = v.ten || VARSAYILAN_TEN;
    const eller = ellerDuzelt(v.eller);
    const renkler = []; ['sag', 'sol'].forEach(k => eller[k].forEach(t => { if (t.renk && !renkler.includes(t.renk)) renkler.push(t.renk); }));
    g.save(); g.beginPath(); g.rect(0, 0, w, sh); g.clip();
    g.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]);
    stdyoCiz(g, { zemin: v.zemin || 'mermer', poz: v.poz || 'duz', el: v.el || 'sag', renkler });
    orn.forEach(oo => elCiz(g, oo, ten, V));
    g.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]); isikCiz(g, v.isik || 'gun');
    tenSimdi = ten;
    yer.forEach(y => {
      const t = eller[y.taraf][y.i], hzv = v.hazirlik && v.hazirlik[y.taraf];
      const hzd = hzv && hzv.adim < HAZIRLIK.length ? { eskiKalan: hzv.eski.kalan[y.i], eskiRenk: hzv.eski.renk, kutikul: hzv.kutikul[y.i], yag: hzv.yag[y.i], torpu: hzv.torpu[y.i], parlak: hzv.parlak[y.i], toz: hzv.toz[y.i], puruz: hzv.puruz == null ? 1 : hzv.puruz } : null;
      g.setTransform(V[0], V[1], V[2], V[3], V[4], V[5]); uygulaG(g, y.m);
      tirnakCiz(g, t, y.nw, { S: s * y.olc, ten, hz: hzd, isikAci: v.isikAci == null ? .8 : v.isikAci, los: v.isik === 'los', i: y.i, sicak: 0 });
    });
    g.restore();
    if (bant) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#FFF7F4'; g.fillRect(0, sh, w, bant);
      g.fillStyle = '#F1C9D3'; g.fillRect(0, sh, w, Math.max(2, h * .004));
      g.textAlign = 'center'; g.fillStyle = '#3B3444'; g.font = '800 ' + Math.round(bant * .3) + 'px "Sour Gummy", "Nunito", sans-serif';
      g.fillText(o.ad || "Cemre'nin tırnakları", w / 2, sh + bant * .45);
      g.font = '600 ' + Math.round(bant * .17) + 'px "Nunito", sans-serif'; g.fillStyle = '#8A7F8E';
      g.fillText("Cemre'nin Tırnak Salonu, " + CD.tarihYaz(CD.bugun()), w / 2, sh + bant * .78);
    }
    return c;
  }
  /* fotoğraflar JPEG (kalite .85): PNG'nin yaklaşık onda biri */
  const dosyaAdi = (ad) => (ad || 'cemre-tirnak').replace(/[^\wğüşöçıİĞÜŞÖÇ -]/g, '').trim().replace(/\s+/g, '-') + '.jpg';
  const blobAl = (c) => new Promise(r => c.toBlob(r, 'image/jpeg', .85));
  async function indir(c, ad) {
    const b = await blobAl(c);
    if (!b) { if (ctx) ctx.toast('Görsel hazırlanamadı; bir daha dener misin?'); return; }
    const url = URL.createObjectURL(b), a = document.createElement('a'); a.href = url; a.download = dosyaAdi(ad); a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    if (ctx) ctx.toast('İndirildi 📷');
  }
  async function paylas(c, ad) {
    const b = await blobAl(c); if (!b) throw new Error('blob yok');
    try {
      const f = new File([b], dosyaAdi(ad), { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f] }); return; }
    } catch (err) { if (err && err.name === 'AbortError') return; }
    await indir(c, ad);
  }
  const miniOnbellek = new Map();
  /* parmak ucu + tırnak minyatürü (seçenek düğmeleri için) */
  function miniTirnak(anahtar, tirnak, o) {
    o = o || {};
    const key = anahtar + '|' + (d.ten || '');
    if (miniOnbellek.has(key)) return miniOnbellek.get(key).cloneNode ? kopyaTuval(miniOnbellek.get(key)) : miniOnbellek.get(key);
    const mw = o.w || 44, mh = o.h || 62, k = Math.min(2, window.devicePixelRatio || 1);
    const c = document.createElement('canvas'); c.width = mw * k; c.height = mh * k; c.className = 'tirnak-mini'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
    const ten = d.ten || VARSAYILAN_TEN, nw = o.nw || 22, t = tirnakDuzelt(Object.assign({ v: SURUM, sekil: 'badem', uzunluk: .5 }, tirnak));
    const L = tirnakBoyu(t, nw);
    const ox = mw / 2, oy = Math.min(mh - 4, 4 + L + nw * .3 + 8);
    // parmak ucu
    const pw = nw * 1.36, pg = g.createLinearGradient(ox - pw / 2, 0, ox + pw / 2, 0); pg.addColorStop(0, koyu(ten, .12)); pg.addColorStop(.4, acik(ten, .12)); pg.addColorStop(1, koyu(ten, .2));
    g.fillStyle = pg; g.beginPath(); g.moveTo(ox - pw / 2, mh + 4); g.lineTo(ox - pw / 2, oy - nw * .95); g.arc(ox, oy - nw * .95, pw / 2, Math.PI, 0); g.lineTo(ox + pw / 2, mh + 4); g.closePath(); g.fill();
    g.save(); g.translate(ox, oy); tenSimdi = ten;
    tirnakCiz(g, t, nw, { S: k, ten, hz: null, isikAci: .8, los: false, i: 2, sicak: 0 });
    g.restore();
    miniOnbellek.set(key, c); return kopyaTuval(c);
  }
  function kopyaTuval(c) { const y = document.createElement('canvas'); y.width = c.width; y.height = c.height; y.className = c.className; y.setAttribute('aria-hidden', 'true'); y.getContext('2d').drawImage(c, 0, 0); return y; }
  function parcaTuval(anahtar, cizFn, renk, olcek) {
    const key = 'p' + anahtar + renk; if (miniOnbellek.has(key)) return kopyaTuval(miniOnbellek.get(key));
    const s = 40, k = Math.min(2, window.devicePixelRatio || 1), c = document.createElement('canvas');
    c.width = s * k; c.height = s * k; c.className = 'tirnak-mini tirnak-mini-parca'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); g.translate(s / 2, s / 2); cizFn(g, s * (olcek || .7), renk, k);
    miniOnbellek.set(key, c); return kopyaTuval(c);
  }
  function damgaMini(id) {
    const key = 'd' + id; if (miniOnbellek.has(key)) return kopyaTuval(miniOnbellek.get(key));
    const s = 40, k = Math.min(2, window.devicePixelRatio || 1), c = document.createElement('canvas');
    c.width = s * k; c.height = s * k; c.className = 'tirnak-mini tirnak-mini-parca tirnak-plaka'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
    const rg = g.createRadialGradient(14, 12, 2, 20, 20, 22); rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(1, '#B9C0CB'); g.fillStyle = rg; g.beginPath(); g.arc(20, 20, 19, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(20, 20, 16, 0, Math.PI * 2); g.clip(); g.translate(20, 20);
    g.fillStyle = '#4A4452'; g.strokeStyle = '#4A4452'; g.lineWidth = 1.1; g.lineCap = 'round';
    DAMGA_CIZ[id](g, 18, 18, tohumla(5), 26, '#4A4452'); g.restore();
    miniOnbellek.set(key, c); return kopyaTuval(c);
  }
  function trendMini(set) {
    const key = 'tr' + set.id; if (miniOnbellek.has(key + (d.ten || ''))) return kopyaTuval(miniOnbellek.get(key + (d.ten || '')));
    const mw = 96, mh = 72, k = Math.min(2, window.devicePixelRatio || 1), c = document.createElement('canvas');
    c.width = mw * k; c.height = mh * k; c.className = 'tirnak-mini tirnak-trendMini'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
    const ten = d.ten || VARSAYILAN_TEN; tenSimdi = ten;
    [[1, -26, .1], [2, 0, 0], [3, 26, -.1]].forEach(([i, dx, a]) => {
      const t = tirnakDuzelt(Object.assign(tirnakVarsayilan(), kopya(set.yap(i)), { v: SURUM })), nw = 18, L = tirnakBoyu(t, nw), sc = Math.min(1, 52 / (L + nw * .9));
      g.save(); g.translate(mw / 2 + dx, mh - 4); g.rotate(a); g.scale(sc, sc);
      const pw = nw * 1.36, pg = g.createLinearGradient(-pw / 2, 0, pw / 2, 0); pg.addColorStop(0, koyu(ten, .12)); pg.addColorStop(.4, acik(ten, .12)); pg.addColorStop(1, koyu(ten, .2));
      g.fillStyle = pg; g.beginPath(); g.moveTo(-pw / 2, 20); g.lineTo(-pw / 2, -nw * 1.2); g.arc(0, -nw * 1.2, pw / 2, Math.PI, 0); g.lineTo(pw / 2, 20); g.closePath(); g.fill();
      g.translate(0, -nw * .25);
      tirnakCiz(g, t, nw, { S: k * sc, ten, hz: null, isikAci: .8, los: false, i, sicak: 0 });
      g.restore();
    });
    miniOnbellek.set(key + (d.ten || ''), c); return kopyaTuval(c);
  }

  /* ------------------------------------------------------------ fotoğraf / kaydet sayfası */
  function fotografSheet() {
    ctx.ses.tink();
    if (ui.masa && !ctx.azHareket) { ui.masa.classList.remove('tirnak-flas'); void ui.masa.offsetWidth; ui.masa.classList.add('tirnak-flas'); }
    const oneri = CD.rastgele(ISIM_SIFAT) + ' ' + CD.rastgele(ISIM_AD);
    let onizleme;
    try { onizleme = fotografCiz(540, 675, veriSimdi(), { cerceve: true, ad: oneri }); } catch (e) { console.warn('[tirnak] önizleme', e); ctx.toast('Fotoğraf hazırlanamadı; bir daha dener misin?'); return; }
    onizleme.className = 'tirnak-fotoOnizleme'; onizleme.setAttribute('role', 'img'); onizleme.setAttribute('aria-label', 'Tasarımın fotoğrafı');
    const girdi = ctx.el('input.girdi', { type: 'text', maxlength: '40', placeholder: oneri, 'aria-label': 'Tasarım adı', autocomplete: 'off' });
    const ad = () => girdi.value.trim() || oneri;
    const buyuk = () => fotografCiz(1080, 1350, veriSimdi(), { cerceve: true, ad: ad() });
    const kutu = ctx.el('div.dikey.tirnak-fotoKutu', [
      onizleme,
      ctx.el('label.tirnak-etiket', ['Adı', girdi]),
      ctx.el('button.dugme.tam', { type: 'button', onclick: async (e) => { e.currentTarget.disabled = true; await galeriyeKaydet(ad()); } }, 'Galeriye kaydet'),
      ctx.el('div.izgara-2', [
        ctx.el('button.dugme-ikincil', { type: 'button', onclick: async () => { try { await paylas(buyuk(), ad()); } catch (e) { ctx.toast('Paylaşılamadı; İndir\'i dene.'); } } }, 'Paylaş'),
        ctx.el('button.dugme-ikincil', { type: 'button', onclick: async () => { try { await indir(buyuk(), ad()); } catch (e) { ctx.toast('İndirilemedi; bir daha dener misin?'); } } }, 'İndir')
      ])
    ]);
    ctx.sheet(kutu, { baslik: 'Fotoğraf çek', odak: false });
  }
  async function galeriyeKaydet(ad) {
    const id = CD.kimlik(), kid = KAYIT_ONEK + id;
    const tam = { id, v: SURUM, ad, tarih: CD.bugun(), ten: d.ten, el: d.el, poz: d.poz, zemin: d.zemin, isik: d.isik, eller: kopya(d.eller) };
    let kayit = tam;
    try {
      const b = await blobAl(fotografCiz(480, 600, veriSimdi(), { cerceve: true, ad }));
      await ctx.idb.koy('tirnak', { id: kid, ad, tarih: tam.tarih, blob: b || null, tasarim: tasarimAl(tam) });
      kayit = hafifKayit(tam, kid);          // ortak listeye yalnız başlık gider
    } catch (err) { /* IndexedDB yoksa tasarım listede tam hâliyle durur */ }
    if (!ctx) return;
    const g = galeriAl(); g.unshift(kayit);
    if (g.length > 40) { const atilan = g.splice(40); atilan.forEach(k => { const x = k.kayit || k.foto; if (x) ctx.idb.sil('tirnak', x).catch(() => {}); }); }
    galeriYaz(g); d.kayitSayisi = (d.kayitSayisi || 0) + 1; kaydetDurum();
    ctx.sheetKapat(); ctx.ses.parilti(); ctx.efekt.konfeti(undefined, undefined, 12); ctx.toast('Galeriye kaydedildi: ' + ad);
    if (d.kayitSayisi === 1) sonra(() => ctx.toast('Galeriden istediğin zaman açıp düzenleyebilirsin 🖼️'), 2600);
  }

  /* ------------------------------------------------------------ galeri ve ilham */
  let galeriUrller = [];
  function urlleriBirak() { galeriUrller.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); galeriUrller = []; }
  function galeriSheet(sekme) {
    urlleriBirak();
    const foto = ((ctx.config.TIRNAK || {}).FOTO_ILHAM || []).filter(f => f && f.yol);
    sekme = sekme || 'kayit';
    const sekmeler = [['kayit', 'Kayıtlarım'], ['trend', 'Trendler']].concat(foto.length ? [['cemre', "Cemre'nin tırnakları"]] : []);
    const ust = ctx.el('div.cipler.tirnak-cipler', { role: 'tablist', 'aria-label': 'Galeri sekmeleri' }, sekmeler.map(s => ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(s[0] === sekme), onclick: () => { ctx.ses.tik(); galeriSheet(s[0]); } }, s[1])));
    const kap = ctx.el('div.dikey', [ust]);
    if (sekme === 'trend') kap.appendChild(trendListesi());
    else if (sekme === 'cemre') kap.appendChild(fotoIlham(foto));
    else kap.appendChild(kayitListesi());
    ctx.sheet(kap, { baslik: sekme === 'trend' ? 'İlham: trend tasarımlar' : 'Galeri', odak: false, kapaninca: urlleriBirak, sessiz: true });
  }
  function kayitListesi() {
    const galeri = galeriAl();
    if (!galeri.length) return ctx.el('div.bos-durum', [ctx.el('div.buyuk', '💅'), ctx.el('p', 'Galeri henüz boş. Fotoğraf çek ile ilk tasarımını kaydet.'), ctx.el('button.dugme', { type: 'button', onclick: () => { ctx.sheetKapat(); sonra(fotografSheet, 340); } }, 'Fotoğraf çek')]);
    const liste = ctx.el('div.tirnak-galeri');
    galeri.forEach(k => {
      const resimKap = ctx.el('div.tirnak-galeriResimKap');
      const ciz = (v) => { try { const c = fotografCiz(240, 300, v, { cerceve: false }); c.className = 'tirnak-galeriResim'; c.setAttribute('aria-hidden', 'true'); resimKap.appendChild(c); } catch (err) {} };
      const kid = k.kayit || k.foto;
      (kid ? CD.idb.al('tirnak', kid).catch(() => null) : Promise.resolve(null)).then(r => {
        if (!resimKap.isConnected) return;
        if (r && r.blob) { const u = URL.createObjectURL(r.blob); galeriUrller.push(u); resimKap.appendChild(ctx.el('img.tirnak-galeriResim', { src: u, alt: '' })); }
        else if (r && r.tasarim) ciz(Object.assign({}, r.tasarim));
        else if (k.eller) ciz(k);
        else resimKap.appendChild(ctx.el('div.tirnak-fotoYok', 'Bu telefona henüz gelmedi'));
      });
      const veriyle = async (fn) => { const v = await galeriVeri(k); if (!ctx) return; if (!v) { ctx.toast('Bu tasarım bu telefona henüz gelmedi; biraz sonra dene.'); return; } fn(v); };
      liste.appendChild(ctx.el('div.yama.siki.tirnak-galeriKart', [
        resimKap,
        ctx.el('div.tirnak-galeriBilgi', [ctx.el('div.kalin', k.ad), ctx.el('div.sessiz', CD.tarihYaz(k.tarih))]),
        ctx.el('div.satir.sar', [
          ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => veriyle(galeriAc) }, 'Aç'),
          ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => veriyle(async (v) => { try { await paylas(fotografCiz(1080, 1350, v, { cerceve: true, ad: k.ad }), k.ad); } catch (err) { ctx.toast('Paylaşılamadı; bir daha dener misin?'); } }) }, 'Paylaş'),
          ctx.el('button.dugme-hayalet', { type: 'button', onclick: async () => { ctx.sheetKapat(); const ok = await ctx.onayla('"' + k.ad + '" galeriden silinsin mi?', 'Sil', 'Kalsın'); if (!ctx) return; if (ok) { galeriYaz(galeriAl().filter(x => x.id !== k.id)); if (kid) ctx.idb.sil('tirnak', kid).catch(() => {}); kaydetDurum(); ctx.toast('Silindi'); } galeriSheet('kayit'); } }, 'Sil')
        ])
      ]));
    });
    return liste;
  }
  function galeriAc(k) {
    gecmisKaydet();
    d.eller = ellerDuzelt(k.eller); if (k.ten) d.ten = k.ten; if (k.poz) d.poz = k.poz; if (k.zemin) d.zemin = k.zemin;
    if (k.el === 'sol' || k.el === 'sag') d.el = k.el;
    d.hazirlik = { sol: hazirlikYeni(true), sag: hazirlikYeni(true) };
    if (d.adim === 'hazirlik') d.adim = 'renk';
    seciliParca = null; miniOnbellek.clear(); pozYenile(); gorunumSifirla(); ctx.sheetKapat(); ctx.ses.parilti(); hepsiniCiz(); kaydetGec(); panelYenile(); ctx.toast(k.ad + ' açıldı; düzenleyebilirsin');
  }
  function trendListesi() {
    const liste = ctx.el('div.tirnak-trendler', [
      ctx.el('button.dugme-ikincil.tam.tirnak-tamSatir', { type: 'button', onclick: () => { ctx.sheetKapat(); rastgeleIlham(); } }, '🎲 Rastgele bir tane seç')
    ]);
    TRENDLER.forEach(s => liste.appendChild(ctx.el('button.yama.siki.dokun.tirnak-set' + (s.inci ? '.tirnak-set-inci' : ''), { type: 'button', onclick: () => setUygula(s) }, [
      trendMini(s), ctx.el('div.tirnak-setBilgi', [ctx.el('div.kalin', s.ad), ctx.el('div.sessiz', s.aciklama)])
    ])));
    return liste;
  }
  function fotoIlham(foto) {
    const liste = ctx.el('div.tirnak-fotoIzgara');
    foto.forEach(f => {
      const src = window.GIZLI && typeof window.GIZLI.url === 'function' ? window.GIZLI.url(f.yol) : f.yol;
      const img = ctx.el('img.tirnak-fotoIlham', { src, alt: f.alt || "Cemre'nin tırnakları", loading: 'lazy' });
      img.addEventListener('error', () => { img.replaceWith(ctx.el('div.tirnak-fotoYok', 'Fotoğraf açılamadı')); });
      liste.appendChild(ctx.el('button.tirnak-fotoKart', { type: 'button', 'aria-label': 'Büyüt: ' + (f.alt || 'tırnak fotoğrafı'), onclick: () => ctx.sheet(ctx.el('div.dikey', [ctx.el('img.tirnak-fotoBuyuk', { src, alt: f.alt || "Cemre'nin tırnakları" }), ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => galeriSheet('cemre') }, 'Geri')]), { baslik: f.alt || "Cemre'nin tırnakları", sessiz: true }) }, [img]));
    });
    return liste;
  }

  /* ------------------------------------------------------------ görünüm ayarları */
  function gorunumSheet() {
    const tenler = ctx.el('div.ornekler.tirnak-tenler', TENLER.map(([ad, t]) => ornek(t, t === (d.ten || VARSAYILAN_TEN), (r, e) => {
      d.ten = t; tenler.querySelectorAll('.ornek').forEach(o => { o.classList.toggle('secili', o === e.currentTarget); o.setAttribute('aria-pressed', String(o === e.currentTarget)); });
      miniOnbellek.clear(); onbellek.clear(); ctx.ses.tik(); hepsiniCiz(); kaydetGec();
    }, 'Ten tonu: ' + ad)));
    const secim = (liste, deger, fn) => ctx.el('div.tirnak-segment', { role: 'group' }, liste.map(x => ctx.el('button.tirnak-segmentDugme', { type: 'button', 'aria-pressed': String(x.id === deger), onclick: (e) => { e.currentTarget.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); fn(x.id); } }, x.ad)));
    const kutu = ctx.el('div.dikey', [
      ctx.el('div.kalin', 'Ten tonu'), tenler,
      ctx.el('div.kalin', 'El'), secim([{ id: 'sol', ad: 'Sol el' }, { id: 'sag', ad: 'Sağ el' }], d.el, (v) => elDegistir(v)),
      ctx.el('div.kalin', 'Poz'), secim(POZLAR, d.poz, pozDegistir),
      ctx.el('div.kalin', 'Masa'), secim(ZEMINLER, d.zemin, (v) => { d.zemin = v; ctx.ses.tik(); hepsiniCiz(); kaydetGec(); }),
      ctx.el('div.kalin', 'Işık'), secim(ISIKLAR, d.isik, (v) => { d.isik = v; ctx.ses.tik(); onbellek.clear(); hepsiniCiz(); kaydetGec(); if (v === 'los') balon('Loş ışıkta parlayan ojeler yanar ✨', 2400); }),
      kaydirici('Işık açısı (yansımalar)', 0, 628, Math.round(d.isikAci * 100), 1, null, v => { d.isikAci = v / 100; tirnakCizIste(); }, () => kaydetGec()),
      ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { aynala(); } }, '⇄ Bu eli diğer ele de uygula'),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Tamam')
    ]);
    ctx.sheet(kutu, { baslik: 'Görünüm', odak: false });
  }

  /* ------------------------------------------------------------ arayüz parçaları */
  function secenek(anahtar, etiket, secili, tikla, onizleme, ekSinif, aciklama) {
    return ctx.el('button.tirnak-secenek' + (ekSinif ? '.' + ekSinif : ''), { type: 'button', 'aria-pressed': String(!!secili), 'aria-label': aciklama ? etiket + ': ' + aciklama : null, data: { id: String(anahtar) }, onclick: tikla }, [onizleme || null, ctx.el('span.tirnak-secenekAd', etiket)]);
  }
  function kaydirici(etiket, min, max, deger, adim, yaz, degis, birak, basla) {
    const cikti = ctx.el('span.tirnak-kaydiriciDeger.sayi', yaz ? yaz(deger) : '');
    const inp = ctx.el('input.kaydirici', { type: 'range', min: String(min), max: String(max), step: String(adim), value: String(deger), 'aria-label': etiket });
    const yuzde = () => inp.style.setProperty('--yuzde', ((inp.value - min) / (max - min) * 100) + '%');
    let basladi = false; yuzde();
    inp.addEventListener('input', () => { if (!basladi) { basladi = true; if (basla) basla(); } yuzde(); if (yaz) cikti.textContent = yaz(Number(inp.value)); degis(Number(inp.value)); });
    inp.addEventListener('change', () => { basladi = false; if (birak) birak(Number(inp.value)); });
    return ctx.el('label.tirnak-kaydirici', [ctx.el('span.tirnak-kaydiriciEtiket', [etiket, cikti]), inp]);
  }
  function ornek(renk, secili, tikla, etiket) {
    const b = ctx.el('button.ornek' + (secili ? '.secili' : ''), { type: 'button', 'aria-label': etiket || ('Renk ' + renk), 'aria-pressed': String(!!secili), onclick: e => tikla(renk, e) });
    b.style.setProperty('--renk', renk); return b;
  }
  function renkSatiri(renkler, secili, tikla, etiket) { return ctx.el('div.ornekler.tirnak-ornekler', renkler.map(r => ornek(r, r === secili, tikla, (etiket || 'Renk') + ' ' + (renkAdi(r) || r)))); }
  function segment(liste, deger, fn, etiket) {
    return ctx.el('div.tirnak-segment', { role: 'group', 'aria-label': etiket || null }, liste.map(x => ctx.el('button.tirnak-segmentDugme', { type: 'button', 'aria-pressed': String(x.id === deger), onclick: () => fn(x.id) }, x.ad)));
  }
  const not = (m) => ctx.el('p.sessiz.tirnak-not', m);
  const altBaslik = (m) => ctx.el('div.tirnak-altBaslik', m);

  /* ------------------------------------------------------------ adım panelleri */
  function panelHazirlik() {
    const h = hz(), tamam = h.adim >= HAZIRLIK.length, aktif = tamam ? null : HAZIRLIK[h.adim];
    const adimlar = ctx.el('ol.tirnak-hzListe', HAZIRLIK.map((a, k) => ctx.el('li.tirnak-hzAdim' + (k < h.adim ? '.bitti' : k === h.adim ? '.simdi' : '.kilitli'), { 'aria-current': k === h.adim ? 'step' : null }, [
      ctx.el('span.tirnak-hzIkon', { 'aria-hidden': 'true' }, k < h.adim ? '✓' : a.ikon), ctx.el('span', a.kisa || a.ad), k > h.adim ? ctx.el('span.gorsel-gizli', ' (kilitli)') : null
    ])));
    const p = [adimlar];
    if (tamam) {
      p.push(ctx.el('div.yama.siki.tirnak-hzBitti', [ctx.el('div.kalin', 'Eller hazır ✨'), not('Kütikül temiz, kenar pürüzsüz, yüzey ışıl ışıl.')]));
      p.push(ctx.el('button.dugme.tam', { type: 'button', onclick: () => adimaGit('sekil') }, 'Şekle geç'));
    } else {
      const ilerleme = hzIlerleme(aktif.id, h);
      p.push(ctx.el('div.yama.siki.tirnak-hzKart', [
        ctx.el('div.kalin', aktif.ikon + ' ' + aktif.ad),
        not(aktif.ipucu),
        ctx.el('div.bar', [ctx.el('span.bar-ikon', { 'aria-hidden': 'true' }, aktif.ikon), ctx.el('div.bar-yol', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(ilerleme * 100)), 'aria-label': aktif.ad + ' ilerlemesi' }, [ctx.el('div.bar-dolu', { stil: { width: Math.round(ilerleme * 100) + '%' } })]), ctx.el('span.bar-yuzde.sayi', '%' + Math.round(ilerleme * 100))])
      ]));
      if (aktif.id === 'su') p.push(ctx.el('button.dugme.tam', { type: 'button', onclick: suyaDaldir }, '💧 Parmakları suya daldır'));
      if (aktif.id === 'torpu') {
        p.push(altBaslik('Törpü kumu'), segment(KUMLAR.map(k => ({ id: k.id, ad: k.ad })), kum, (v) => { kum = v; ctx.ses.tik(); panelYenile(); }, 'Törpü kumu'));
        p.push(not((KUMLAR.find(k => k.id === kum) || KUMLAR[1]).not + ' Yatay sürükleme kare, çapraz sürükleme oval verir.'));
      }
      if (aktif.id === 'yag') p.push(not('Her tırnağa dokun: dibine bir damla.'));
    }
    p.push(ctx.el('div.satir.sar', [
      tamam ? null : ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: hizliMod }, '⏩ Hızlı mod'),
      ctx.el('button.dugme-hayalet', { type: 'button', onclick: async () => { const ok = await ctx.onayla('Bu eldeki tasarım silinip yeni bir manikür başlasın mı? (Geri al ile dönebilirsin.)', 'Başlat', 'Vazgeç'); if (ok && ctx) yeniManikur(); } }, 'Yeni manikür başlat')
    ]));
    return p;
  }
  function hzIlerleme(id, h) {
    const ort = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    if (id === 'aseton') return 1 - ort(h.eski.kalan);
    if (id === 'su') return h.su;
    if (id === 'itici') return ort(h.kutikul);
    if (id === 'yag') return ort(h.yag);
    if (id === 'torpu') return ort(h.torpu) * (h.puruz > .15 ? .9 : 1);
    if (id === 'parlatici') return ort(h.parlak);
    if (id === 'tozf') { const ilk = h.tozIlk || Math.max(.01, ...h.toz); h.tozIlk = ilk; return sinir(1 - ort(h.toz) / ilk, 0, 1); }
    return 0;
  }
  function panelSekil() {
    const t = aktifTirnak();
    return [
      ctx.el('div.tirnak-secenekler', SEKILLER.map(s => secenek(s.id, s.ad, t.sekil === s.id, () => sekilUygula(s.id), miniTirnak('sekil:' + s.id, { sekil: s.id, uzunluk: .62, renk: '#F6D8DF', kat: 2, top: true }), null, s.tr))),
      not((SEKILLER.find(s => s.id === t.sekil) || SEKILLER[0]).tr + ': ' + (SEKILLER.find(s => s.id === t.sekil) || SEKILLER[0]).not),
      altBaslik('Uzunluk'),
      segment(UZUNLUKLAR, (UZUNLUKLAR.slice().sort((a, b) => Math.abs(a.v - t.uzunluk) - Math.abs(b.v - t.uzunluk))[0] || {}).id, (id) => uzunlukUygula(UZUNLUKLAR.find(u => u.id === id).v), 'Uzunluk'),
      kaydirici('İnce ayar', 0, 100, Math.round(t.uzunluk * 100), 1, v => v + '%', v => { hedefler().forEach(i => { d.eller[d.el][i].uzunluk = v / 100; }); tirnakCizIste(); }, () => { kaydetGec(); ctx.ses.torpu(); }, gecmisKaydet),
      altBaslik('Uzatma (protez)'),
      ctx.el('div.tirnak-secenekler.tirnak-secenekler-genis', PROTEZLER.map(p => secenek(p.id || 'dogal', p.ad, t.protez === p.id, () => protezUygula(p.id), null, 'tirnak-secenek-yazi', p.not))),
      not((PROTEZLER.find(p => p.id === t.protez) || PROTEZLER[0]).not)
    ];
  }
  function lambaSatiri() {
    const bekleyen = d.eller[d.el].filter(yapiskanMi).length;
    return ctx.el('div.yama.siki.tirnak-lamba' + (bekleyen ? '.bekliyor' : ''), [
      ctx.el('div.satir', [ctx.el('span.kalin', '💡 UV/LED lamba'), ctx.el('span.bosluk'), segment([{ id: 30, ad: '30 sn' }, { id: 60, ad: '60 sn' }], d.lambaSure, (v) => { d.lambaSure = v; ctx.ses.tik(); kaydetGec(); panelYenile(); }, 'Kür süresi')]),
      not(bekleyen ? bekleyen + ' tırnak kürlenmedi: yapış yapış. Lambaya koy.' : 'Hepsi kürlendi.'),
      ctx.el('button.dugme.tam' + (bekleyen ? '.inci' : ''), { type: 'button', onclick: lambayaKoy }, 'Lambaya koy')
    ]);
  }
  function panelTaban() {
    const t = aktifTirnak();
    const p = [
      altBaslik('Sistem'),
      segment([{ id: 'klasik', ad: 'Klasik oje' }, { id: 'jel', ad: 'Jel (lambalı)' }], d.sistem, sistemDegistir, 'Sistem'),
      ctx.el('div.tirnak-secenekler', BAZLAR.map(b => secenek(b.id, b.ad, t.baz === b.id, () => bazUygula(b.id), miniTirnak('baz:' + b.id, { baz: b.id, uzunluk: .45 }), null, b.not))),
      not((BAZLAR.find(b => b.id === t.baz) || BAZLAR[0]).not)
    ];
    if (d.sistem === 'jel') p.push(lambaSatiri());
    p.push(ctx.el('button.dugme.tam', { type: 'button', onclick: () => adimaGit('renk') }, 'Renge geç'));
    return p;
  }
  function panelRenk() {
    const t = aktifTirnak(), benim = renklerimAl();
    const kolListe = (benim.length ? [{ id: 'benim', ad: 'Benim renklerim', renkler: benim.map(b => [b.ad, b.hex, b.tur || 'krem']) }] : []).concat(PALET);
    if (!kolListe.some(k => k.id === koleksiyon)) koleksiyon = 'favori';
    const kol = kolListe.find(k => k.id === koleksiyon);
    const p = [ctx.el('div.cipler.tirnak-cipler', { role: 'tablist', 'aria-label': 'Renk koleksiyonları' }, kolListe.map(k => ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(k.id === koleksiyon), onclick: () => { koleksiyon = k.id; ctx.ses.tik(); panelYenile(); } }, k.ad)))];
    if (kol.krom) {
      p.push(not('Krom tozu, rengin üstüne ovulur. Önce bir renk sür.'));
      p.push(ctx.el('div.tirnak-secenekler', kol.renkler.map(r => secenek(r[2], r[0], t.efekt === r[2], () => efektUygula(r[2]), miniTirnak('efekt:' + r[2], { renk: r[2] === 'aurora' || r[2] === 'inci' ? '#F6D3DC' : '#E9E2EC', kat: 2, efekt: r[2], top: true, uzunluk: .5 }), r[2] === 'aurora' ? 'tirnak-secenek-inci' : ''))));
      if (t.efekt !== 'yok') p.push(ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => efektUygula('yok') }, 'Krom tozunu kaldır'));
    } else {
      p.push(ctx.el('div.tirnak-palet', kol.renkler.map(r => {
        const sec = t.renk === r[1] && t.ojeTur === (r[2] || 'krem');
        const b = ctx.el('button.tirnak-sise' + (sec ? '.secili' : ''), { type: 'button', 'aria-pressed': String(sec), 'aria-label': r[0] + ' (' + (TUR_AD[r[2] || 'krem'] || '') + ')', onclick: () => renkUygula(r[1], r[2] || 'krem', r[3]) }, [ctx.el('span.tirnak-siseRenk', { 'aria-hidden': 'true' }), ctx.el('span.tirnak-siseAd', r[0])]);
        b.style.setProperty('--renk', r[1]); b.style.setProperty('--renk2', r[3] || r[1]); b.dataset.tur = r[2] || 'krem'; return b;
      })));
    }
    if (t.renk) {
      p.push(ctx.el('div.tirnak-katSatir', [
        ctx.el('span.tirnak-katAd', [ctx.el('span.kalin', renkAdi(t.renk) || t.renk), ' · ' + (TUR_AD[t.ojeTur] || '')]),
        segment([{ id: 1, ad: '1 kat' }, { id: 2, ad: '2 kat' }, { id: 3, ad: '3 kat' }], t.kat, katAyarla, 'Kat sayısı')
      ]));
      if (t.ojeTur === 'kediGozu') p.push(not('Kedi gözü: Sanat > Mermer & mıknatıs > Kedi gözü ile mıknatısı tırnağın üstünde gezdir.'));
      if (t.ojeTur === 'termal') p.push(not('Termal: tırnağa dokun, ısınınca rengi değişir.'));
      if (t.ojeTur === 'glow') p.push(not('Parlayan: Görünüm > Işık > Loş seçince yanar.'));
    }
    if (d.sistem === 'jel') p.push(lambaSatiri());
    if (d.sonRenkler.length) p.push(altBaslik('Son kullandıkların'), renkSatiri(d.sonRenkler, t.renk, r => renkUygula(r, 'krem'), 'Son renk'));
    p.push(karistiriciPanel());
    p.push(ctx.el('div.satir.sar', [ctx.el('button.dugme-hayalet', { type: 'button', onclick: ojeSil }, 'Ojeyi sil'), ctx.el('span.bosluk'), ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => adimaGit('sanat') }, 'Sanata geç')]));
    return p;
  }
  function karistiriciPanel() {
    const onizle = ctx.el('span.tirnak-ozelOnizle', { 'aria-hidden': 'true' });
    const renk = () => karistir.mod === 'hsl' ? hslHex(karistir.h, karistir.s, karistir.l) : karis(karistir.a, karistir.b, karistir.oran / 100);
    const guncel = () => { onizle.style.background = renk(); ad.textContent = sevimliAd(renk()); };
    const ad = ctx.el('span.tirnak-ozelAd');
    const icerik = ctx.el('div.dikey');
    const kur = () => {
      icerik.innerHTML = '';
      icerik.appendChild(segment([{ id: 'hsl', ad: 'Ton-doygunluk' }, { id: 'iki', ad: 'İki rengi karıştır' }], karistir.mod, (m) => { karistir.mod = m; ctx.ses.tik(); kur(); }, 'Karıştırma yolu'));
      if (karistir.mod === 'hsl') {
        const ton = kaydirici('Ton', 0, 360, karistir.h, 1, null, v => { karistir.h = v; guncel(); });
        const tg = ton.querySelector('input'); tg.classList.add('tirnak-ton'); tg.style.setProperty('--tirnak-tonYol', 'linear-gradient(90deg,' + [0, 60, 120, 180, 240, 300, 360].map(h => hslHex(h, 80, 70)).join(',') + ')');
        icerik.append(ton, kaydirici('Doygunluk', 0, 100, karistir.s, 1, null, v => { karistir.s = v; guncel(); }), kaydirici('Açıklık', 5, 97, karistir.l, 1, null, v => { karistir.l = v; guncel(); }));
      } else {
        const secici = (k, et) => ctx.el('label.tirnak-renkSecici', [ctx.el('span', et), ctx.el('input', { type: 'color', value: karistir[k].toLowerCase(), 'aria-label': et, oninput: e => { karistir[k] = e.target.value.toUpperCase(); guncel(); } })]);
        icerik.append(ctx.el('div.izgara-2', [secici('a', '1. renk'), secici('b', '2. renk')]), kaydirici('Oran', 0, 100, karistir.oran, 1, v => '%' + (100 - v) + ' / %' + v, v => { karistir.oran = v; guncel(); }));
      }
      icerik.append(ctx.el('div.satir.sar', [onizle, ad]),
        ctx.el('div.izgara-2', [
          ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => renkUygula(renk(), 'krem') }, 'Bu rengi sür'),
          ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => { const r = renk(), l = renklerimAl(); if (l.some(x => x.hex === r)) { ctx.toast('Bu renk zaten listende'); return; } l.unshift({ ad: sevimliAd(r), hex: r, tur: 'krem' }); ctx.depo.yaz('renklerim', l.slice(0, 30)); koleksiyon = 'benim'; ctx.ses.parilti(); ctx.toast('Benim renklerime eklendi: ' + sevimliAd(r)); panelYenile(); } }, 'Renklerime ekle')
        ]));
      const benim = renklerimAl();
      if (benim.length) icerik.append(altBaslik('Benim renklerim'), ctx.el('div.tirnak-benimListe', benim.map((b, k) => ctx.el('span.tirnak-benim', [ornek(b.hex, false, () => renkUygula(b.hex, b.tur || 'krem'), b.ad), ctx.el('button.tirnak-benimSil', { type: 'button', 'aria-label': b.ad + ' rengini sil', onclick: () => { const l = renklerimAl(); l.splice(k, 1); ctx.depo.yaz('renklerim', l); ctx.ses.pit(); kur(); } }, '×')]))));
      guncel();
    };
    kur();
    const det = ctx.el('details.tirnak-ozel', [ctx.el('summary', 'Renk karıştırıcı'), icerik]);
    if (karistiriciPanel.acik) det.open = true;
    det.addEventListener('toggle', () => { karistiriciPanel.acik = det.open; });
    return det;
  }
  function sevimliAd(hex) {
    const [h, s, l] = hexHsl(hex);
    const ton = s < 12 ? (l > 80 ? 'Bulut' : l < 25 ? 'Gece' : 'Duman') : h < 15 || h >= 345 ? 'Kiraz' : h < 40 ? 'Şeftali' : h < 65 ? 'Bal' : h < 160 ? 'Nane' : h < 200 ? 'Deniz' : h < 255 ? 'Gökyüzü' : h < 290 ? 'Lavanta' : 'Pembiş';
    const sifat = l > 82 ? 'Sütlü' : l > 65 ? 'Pastel' : l < 30 ? 'Gece' : s > 75 ? 'Cıvıl' : 'Tatlı';
    return sifat + ' ' + ton;
  }
  function panelSanat() {
    const t = aktifTirnak();
    const grupAraclari = ARACLAR.filter(a => a.grup === arac.grup);
    if (!grupAraclari.some(a => a.id === arac.id)) arac.id = grupAraclari[0].id;
    const p = [
      ctx.el('div.cipler.tirnak-cipler', { role: 'tablist', 'aria-label': 'Araç grupları' }, ARAC_GRUPLARI.map(([id, ad]) => ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(id === arac.grup), onclick: () => { arac.grup = id; seciliParca = null; ctx.ses.tik(); ustCizIste(); panelYenile(); } }, ad))),
      ctx.el('div.tirnak-araclar', grupAraclari.map(a => ctx.el('button.tirnak-arac', { type: 'button', 'aria-pressed': String(a.id === arac.id), onclick: () => { arac.id = a.id; seciliParca = null; ctx.ses.tik(); ustCizIste(); panelYenile(); } }, [ctx.el('span.tirnak-aracIkon', { 'aria-hidden': 'true' }, a.ikon), ctx.el('span', a.ad)])))
    ];
    const renkSec = (etiket, anahtar) => [altBaslik(etiket), renkSatiri(SANAT_RENKLERI.concat(t.renk && !SANAT_RENKLERI.includes(t.renk) ? [t.renk] : []), arac[anahtar], r => { arac[anahtar] = r; ctx.ses.tik(); const sp = seciliParcaAl(); if (sp && anahtar === 'renk' && seciliParca.liste !== 'susler') seciliParcaDegistir(x => { x.renk = r; }); panelYenile(); }, etiket)];
    const id = arac.id;
    if (['nokta', 'liner', 'striping', 'detay'].includes(id)) {
      p.push(not({ nokta: 'Dokun: nokta. Sürükle: sıra sıra nokta.', liner: 'İnce çizgiler; yavaş çizersen kalınlaşır.', striping: 'Uzun, düz, eşit çizgiler.', detay: 'Serbest fırça; hız kalınlığı değiştirir.' }[id]));
      if (id === 'nokta') p.push(segment(NOKTA_BOYLARI, arac.nokta, (v) => { arac.nokta = v; ctx.ses.tik(); panelYenile(); }, 'Nokta boyu'));
      else p.push(kaydirici('Fırça kalınlığı', 1, 10, arac.boy, 1, v => String(v), v => { arac.boy = v; }));
      p.push(...renkSec('Renk', 'renk'));
    } else if (id === 'silgi') {
      p.push(not('Sanat izlerini sil (oje ve taban kalır).'), kaydirici('Silgi boyu', 1, 10, arac.boy, 1, v => String(v), v => { arac.boy = v; }));
    } else if (id === 'sunger' || id === 'boomer') {
      p.push(not(id === 'boomer' ? 'Pembe-beyaz baby boomer: uca doğru sünger bas.' : 'Süngeri tırnağa bastır: dipte 1. renk, uçta 2. renk.'));
      if (id === 'sunger') { p.push(...renkSec('Dip rengi', 'renk')); p.push(...renkSec('Uç rengi', 'renk2')); }
      p.push(kaydirici('Sünger boyu', 1, 10, arac.boy, 1, v => String(v), v => { arac.boy = v; }));
    } else if (id === 'aura') {
      p.push(not('Merkeze dokun, dışarı sürükle: hale büyür.'), ...renkSec('Aura rengi', 'renk2'));
    } else if (id === 'french' || id === 'yarimAy') {
      if (id === 'french') p.push(segment(FRENCH_STILLER, arac.frenchStil, (v) => { arac.frenchStil = v; ctx.ses.tik(); if (v === 'klasik') arac.renk2 = '#FFFFFF'; panelYenile(); }, 'French türü'));
      p.push(not(id === 'french' ? 'Tırnağın üstünde parmağını yukarı-aşağı kaydır: uç çizgisi parmağını izler.' : 'Dipte yarım ay: parmağınla boyunu ayarla.'));
      p.push(...renkSec(id === 'french' ? 'Uç rengi' : 'Yarım ay rengi', 'renk2'));
    } else if (id === 'mermer') {
      p.push(not('Dokun: renk damlası düşer (halka halka). Sürükle: iğneyle çekip mermerleştir.'));
      p.push(altBaslik('Damla renkleri'), ctx.el('div.satir.sar', arac.mermerRenkler.map((r, k) => ctx.el('label.tirnak-renkSecici.kucuk', [ctx.el('span', (k + 1) + '.'), ctx.el('input', { type: 'color', value: r.toLowerCase(), 'aria-label': (k + 1) + '. damla rengi', oninput: e => { arac.mermerRenkler[k] = e.target.value.toUpperCase(); } })]))));
      if (t.suMermer) p.push(ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => uygula(x => { x.suMermer = null; }) || panelYenile() }, 'Mermeri temizle'));
    } else if (id === 'miknatis') {
      p.push(not('Mıknatısı tırnağın üstünde gezdir: ışık bandı peşinden gelir. Kedi gözü oje yoksa otomatik sürülür.'));
      p.push(segment([{ id: .35, ad: 'İnce' }, { id: .55, ad: 'Klasik' }, { id: .95, ad: 'Kadife' }], arac.kediGen || .5, (v) => { arac.kediGen = v; uygula(x => { if (x.kedi) x.kedi.gen = v; }); panelYenile(); }, 'Bant genişliği'));
    } else if (id === 'folyo') {
      p.push(not('Folyoyu tırnağa sürt: parça parça yapışır.'), segment(FOLYOLAR.map(f => ({ id: f.id, ad: f.ad })), arac.folyo, (v) => { arac.folyo = v; ctx.ses.tik(); panelYenile(); }, 'Folyo'), kaydirici('Folyo boyu', 1, 10, arac.boy, 1, v => String(v), v => { arac.boy = v; }));
    } else if (id === 'damga') {
      p.push(not('Plakayı seç, tırnağa dokun; sürükleyerek yerleştir.'));
      p.push(ctx.el('div.tirnak-secenekler.tirnak-parcalar', DAMGALAR.map(dm => secenek(dm.id, dm.ad, arac.damga === dm.id, () => { arac.damga = dm.id; ctx.ses.tik(); panelYenile(); }, damgaMini(dm.id)))));
      p.push(...renkSec('Damga rengi', 'renk'));
      p.push(altBaslik('Tam kaplama desen'), ctx.el('div.tirnak-secenekler.tirnak-parcalar', [secenek('yok', 'Yok', !t.desen, () => desenUygula(null))].concat(DESENLER.map(ds => secenek(ds.id, ds.ad, t.desen && t.desen.id === ds.id, () => desenUygula(ds.id), miniTirnak('desen:' + ds.id, { renk: '#F4CFD8', kat: 2, desen: { id: ds.id, renk: ds.id === 'kaplumbaga' ? '#3B2014' : '#FFFFFF' }, uzunluk: .45 }))))));
    } else if (id === 'cikartma') {
      p.push(not('Çıkartmayı seç, tırnağa dokun; parmağınla kaydır.'));
      p.push(ctx.el('div.tirnak-secenekler.tirnak-parcalar', CIKARTMALAR.map(c => secenek(c.id, c.ad, arac.cikartma === c.id, () => { arac.cikartma = c.id; ctx.ses.tik(); panelYenile(); }, parcaTuval('cik:' + c.id, CIKARTMA_CIZ[c.id], arac.renk === '#FFFFFF' ? '#EE8AAA' : arac.renk, .7)))));
      p.push(...renkSec('Renk', 'renk'));
    } else if (id === 'sus') {
      p.push(not('Süsü seç, tırnağa dokun; kaydır, boyutla, döndür.'));
      p.push(ctx.el('div.tirnak-secenekler.tirnak-parcalar', SUSLER.map(s => secenek(s.id, s.ad, arac.sus === s.id, () => { arac.sus = s.id; ctx.ses.tik(); panelYenile(); }, parcaTuval('sus:' + s.id, SUS_CIZ[s.id], arac.tasRenk, s.id === 'zincir' ? .9 : s.olcek < .2 ? .35 : .6)))));
      p.push(altBaslik('Taş / süs rengi'), renkSatiri(TAS_RENKLERI, arac.tasRenk, r => { arac.tasRenk = r; ctx.ses.tik(); const sp = seciliParcaAl(); if (sp && seciliParca.liste === 'susler') seciliParcaDegistir(x => { x.renk = r; }); panelYenile(); }, 'Taş rengi'));
    }
    const sp = seciliParcaAl();
    if (sp && ['damga', 'cikartma', 'sus'].includes(id)) {
      const ad = seciliParca.liste === 'damgalar' ? (DAMGALAR.find(x => x.id === sp.desen) || {}).ad : ((seciliParca.liste === 'susler' ? SUSLER : CIKARTMALAR).find(x => x.id === sp.id) || {}).ad;
      const donAnahtar = seciliParca.liste === 'damgalar' ? 'aci' : 'don';
      p.push(ctx.el('div.yama.siki.tirnak-parcaAyar', [
        ctx.el('div.kalin', 'Seçili: ' + (ad || '')),
        kaydirici('Boyut', 10, seciliParca.liste === 'damgalar' ? 200 : 100, Math.round((sp.olcek || .5) * 100), 1, v => v + '%', v => seciliParcaDegistir(x => { x.olcek = v / 100; }), null, gecmisKaydet),
        kaydirici('Döndür', -180, 180, Math.round((sp[donAnahtar] || 0) * 180 / Math.PI), 1, v => v + '°', v => seciliParcaDegistir(x => { x[donAnahtar] = v * Math.PI / 180; }), null, gecmisKaydet),
        ctx.el('div.satir', [ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: seciliParcaSil }, 'Kaldır'), ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => parcalariTemizle(seciliParca.liste) }, 'Hepsini temizle')])
      ]));
    }
    p.push(ctx.el('div.satir.sar', [ctx.el('button.dugme-hayalet', { type: 'button', onclick: async () => { const ok = await ctx.onayla('Seçili tırnaklardaki tüm sanat silinsin mi?', 'Sil', 'Kalsın'); if (ok && ctx) sanatTemizle(); } }, 'Sanatı temizle'), ctx.el('span.bosluk'), ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => adimaGit('ust') }, 'Üst kata geç')]));
    return p;
  }
  function panelUst() {
    const t = aktifTirnak();
    const p = [
      ctx.el('div.tirnak-secenekler', USTLER.map(u => secenek(u.id, u.ad, t.top && t.ust === u.id, () => ustUygula(u.id), miniTirnak('ust:' + u.id, { renk: '#B3122E', kat: 3, top: true, ust: u.id, uzunluk: .5 }), null, u.not))),
      not(t.top ? (USTLER.find(u => u.id === t.ust) || USTLER[0]).not : 'Üst kat sür: parlaklık ve dayanıklılık.'),
      altBaslik('Krom tozu'),
      ctx.el('div.tirnak-secenekler', EFEKTLER.map(e => secenek(e.id, e.ad, t.efekt === e.id, () => efektUygula(e.id), miniTirnak('efekt2:' + e.id, { renk: '#E9C9D3', kat: 2, efekt: e.id, top: true, uzunluk: .45 }), e.id === 'aurora' ? 'tirnak-secenek-inci' : '')))
    ];
    if (d.sistem === 'jel') p.push(lambaSatiri());
    p.push(ctx.el('div.izgara-2', [
      ctx.el('button.dugme', { type: 'button', onclick: fotografSheet }, '📷 Fotoğraf çek'),
      ctx.el('button.dugme-ikincil', { type: 'button', onclick: pittiksuyaGoster }, '🐾 Pıttıksu\'ya göster')
    ]));
    if (t.top) p.push(ctx.el('button.dugme-hayalet', { type: 'button', onclick: ustSil }, 'Üst katı kaldır'));
    return p;
  }
  function panelYenile() {
    if (!ui.panel || !d) return;
    const kayma = ui.panel.scrollTop;
    ui.panel.innerHTML = '';
    const adim = ADIMLAR.find(a => a.id === d.adim) || ADIMLAR[0];
    ui.panel.appendChild(ctx.el('div.tirnak-panelBaslik', [ctx.el('h2.baslik.baslik-lg', adim.ad), ctx.el('span.sessiz', d.secim.hepsi ? 'Bütün tırnaklar' : PARMAK_AD[d.secim.parmak] + ' parmak')]));
    let icerik = [];
    try { icerik = { hazirlik: panelHazirlik, sekil: panelSekil, taban: panelTaban, renk: panelRenk, sanat: panelSanat, ust: panelUst }[adim.id](); }
    catch (e) { console.warn('[tirnak] panel', e); icerik = [not('Bu panel açılamadı; başka bir adıma geçip dönebilirsin.')]; }
    icerik.forEach(e => e && ui.panel.appendChild(e));
    ui.panel.scrollTop = kayma;
    if (ui.adimlar) ui.adimlar.querySelectorAll('.tirnak-adim').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.adim === d.adim)); b.classList.toggle('uyari', b.dataset.adim === 'hazirlik' && !hazirMi(d.el)); });
    secimYaz();
  }
  function secimYaz() {
    if (!ui.secim) return;
    ui.secim.querySelectorAll('button[data-parmak]').forEach(b => { const v = b.dataset.parmak; b.setAttribute('aria-pressed', String(v === 'hepsi' ? d.secim.hepsi : (!d.secim.hepsi && Number(v) === d.secim.parmak))); });
    if (ui.elDugme) ui.elDugme.textContent = d.el === 'sol' ? 'Sol el' : 'Sağ el';
  }
  function adimaGit(id) {
    if (!d || d.adim === id) return;
    d.adim = id; seciliParca = null; imlec = null; ctx.ses.tik();
    const a = ADIMLAR.find(x => x.id === id);
    if (id !== 'hazirlik' && d.adim !== 'hazirlik' && !hazirMi(d.el) && id === 'sekil') balon('Hazırlık yarım kaldı; istersen sonra dönersin.', 2400);
    else if (a) balon(a.ipucu);
    ustCizIste(); kaydetGec(); panelYenile();
    if (ui.panel && ui.panel.scrollIntoView && innerWidth < 900) { try { ui.adimlar.scrollIntoView({ block: 'nearest', behavior: ctx.azHareket ? 'auto' : 'smooth' }); } catch (e) {} }
  }

  /* ------------------------------------------------------------ salon kurulumu */
  function salonKur(el) {
    el.innerHTML = '';
    dokulariKur();
    tuvalA = ctx.el('canvas.tirnak-katman', { 'aria-hidden': 'true' });
    tuvalT = ctx.el('canvas.tirnak-katman', { 'aria-hidden': 'true' });
    tuvalU = ctx.el('canvas.tirnak-katman.tirnak-dokunma', { role: 'img', 'aria-label': 'Tırnak masası: bir tırnağa dokunup seç, araçla üstüne çiz. Çift dokunuş yakınlaştırır.' });
    gA = tuvalA.getContext('2d'); gT = tuvalT.getContext('2d'); gU = tuvalU.getContext('2d');
    ui.katman = ctx.el('div.tirnak-katmanlar', [tuvalA, tuvalT, tuvalU]);
    ui.balon = ctx.el('div.balon.tirnak-balon', { role: 'status', 'aria-live': 'polite' });
    ui.elDugme = ctx.el('button.tirnak-ustDugme', { type: 'button', 'aria-label': 'Eli değiştir', onclick: () => elDegistir() }, 'Sağ el');
    ui.odakDugme = ctx.el('button.tirnak-ustDugme.tirnak-ikonDugme', { type: 'button', 'aria-label': 'Seçili tırnağa yakınlaş', 'aria-pressed': 'false', onclick: () => { if (gorunum.odak) odakla(null); else { const y = yerlesim.find(q => q.taraf === d.el && q.i === (d.secim.hepsi ? 2 : d.secim.parmak)); odakla(y); } } }, '🔍');
    ui.secim = ctx.el('div.tirnak-secim', { role: 'group', 'aria-label': 'Hangi tırnak' }, [
      ctx.el('button.tirnak-parmak', { type: 'button', data: { parmak: 'hepsi' }, onclick: () => { d.secim.hepsi = true; seciliParca = null; ctx.ses.tik(); secimYaz(); ustCizIste(); kaydetGec(); panelYenile(); } }, 'Hepsi')
    ].concat(PARMAK_AD.map((ad, i) => ctx.el('button.tirnak-parmak', { type: 'button', 'aria-label': ad + ' tırnağı', data: { parmak: String(i) }, onclick: () => { d.secim.hepsi = false; d.secim.parmak = i; seciliParca = null; ctx.ses.tik(); secimYaz(); ustCizIste(); kaydetGec(); panelYenile(); } }, ['Baş', 'İşaret', 'Orta', 'Yüzük', 'Serçe'][i]))));
    ui.masa = ctx.el('div.sahne.tirnak-masa', [
      ui.katman,
      ctx.el('div.tirnak-masaUst', [ui.elDugme, ctx.el('span.bosluk'), ui.odakDugme,
        ctx.el('button.tirnak-ustDugme.tirnak-ikonDugme', { type: 'button', 'aria-label': 'Görünüm: ten, poz, masa, ışık', onclick: gorunumSheet }, '🎨'),
        ctx.el('button.tirnak-ustDugme.tirnak-ikonDugme', { type: 'button', 'aria-label': 'Fotoğraf çek', onclick: fotografSheet }, '📷')]),
      ui.balon,
      ui.secim
    ]);
    ui.adimlar = ctx.el('nav.tirnak-adimlar', { role: 'tablist', 'aria-label': 'Salon adımları' }, ADIMLAR.map((a, i) => ctx.el('button.tirnak-adim', { type: 'button', role: 'tab', 'aria-selected': String(a.id === d.adim), data: { adim: a.id }, onclick: () => adimaGit(a.id) }, [ctx.el('span.tirnak-adimNo', String(i + 1)), ctx.el('span.tirnak-adimAd', a.ad)])));
    ui.panel = ctx.el('div.yama.tirnak-panel');
    el.appendChild(ctx.el('div.tirnak-salon', [ui.masa, ui.adimlar, ctx.el('div.icerik.tirnak-icerik', [ui.panel])]));
    tuvalU.addEventListener('pointerdown', tuvalBas);
    tuvalU.addEventListener('pointermove', tuvalTasi);
    tuvalU.addEventListener('pointerup', tuvalBirak);
    tuvalU.addEventListener('pointercancel', tuvalBirak);
    tuvalU.addEventListener('pointerleave', tuvalCik);
    tuvalU.addEventListener('contextmenu', e => e.preventDefault());
    tuvalU.addEventListener('touchstart', e => { if (e.touches.length === 1) e.preventDefault(); }, { passive: false });   // iOS: uzun basma menüsü / büyüteç yok
    ctx.altbar([
      { id: 'geri', ad: 'Geri al', ikon: '↶', tikla: geriAl },
      { id: 'yinele', ad: 'Yinele', ikon: '↷', tikla: yinele },
      { id: 'foto', ad: 'Fotoğraf', ikon: '📷', birincil: true, tikla: fotografSheet },
      { id: 'galeri', ad: 'Galeri', ikon: '🖼️', tikla: () => galeriSheet('kayit') },
      { id: 'ilham', ad: 'İlham', ikon: '✨', tikla: () => galeriSheet('trend') }
    ]);
    pozYenile(); gorunumSifirla();
    altbarGuncelle(); secimYaz(); panelYenile();
    if (window.ResizeObserver) { boyutGozlem = new ResizeObserver(() => boyutla()); boyutGozlem.observe(ui.katman); }
    boyutla();
    sonra(boyutla, 60);
  }

  /* ------------------------------------------------------------ kayıt */
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="tirnakInci" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD6E4"/><stop offset=".4" stop-color="#E2F1FF"/><stop offset=".7" stop-color="#FFF7D9"/><stop offset="1" stop-color="#EADFFF"/></linearGradient></defs><path d="M32 6c9 0 15 10 15 26 0 14-6 26-15 26S17 46 17 32C17 16 23 6 32 6z" fill="#F5C6AC"/><path d="M32 4c8 0 13 8 13 20 0 9-5 18-13 18s-13-9-13-18C19 12 24 4 32 4z" fill="url(#tirnakInci)" stroke="#3B3444" stroke-width="1.5"/><path d="M25 14c1-4 4-6 6-6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="46" cy="50" r="6" fill="#EE8AAA" stroke="#3B3444" stroke-width="1.5"/><path d="M46 44v12M40 50h12" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';

  CD.kaydet({
    id: ID, baslik: 'Tırnak Salonu', ikon: IKON, tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el;
      try {
        d = yukle();
        galeriGoc().catch(err => console.warn('[tirnak] galeri göçü', err));   // ağır kayıtlar IndexedDB'ye (bir kez)
        seciliParca = null; surukle = null; imlec = null; canliCizim = false;
        gecmis.length = 0; gelecek.length = 0; animler.clear(); onbellek.clear(); miniOnbellek.clear(); sicaklik.clear();
        salonKur(el);
        boyutCb = () => boyutla(); window.addEventListener('resize', boyutCb);
        gorunurCb = () => { if (document.visibilityState === 'visible') hepsiniCiz(); }; document.addEventListener('visibilitychange', gorunurCb);
        olayIptal.push(ctx.olay.dinle('azHareket', () => hepsiniCiz()));
        const a = ADIMLAR.find(x => x.id === d.adim);
        sonra(() => balon(!hazirMi(d.el) && d.adim === 'hazirlik' ? 'Manikür masası hazır. ' + HAZIRLIK[hz().adim].ipucu : d.eller[d.el].some(t => t.renk) ? 'Tırnakların seni bekliyordu.' : (a ? a.ipucu : ''), 3200), 500);
        kaydetDurum();
        if (ctx.depo.al('durum', null) != null) ctx.depo.sil('durum');   // eski ortak durum buluttan kalkar (cihaza taşındı)
      } catch (e) {
        console.error('[tirnak] açılamadı', e);
        el.innerHTML = '';
        el.appendChild(ctx.el('div.icerik', [ctx.el('div.yama.bos-durum', [ctx.el('div.buyuk', '💅'), ctx.el('p', 'Salon şu an açılamadı. Eve dönüp tekrar dener misin?')])]));
      }
    },
    unmount() {
      clearTimeout(kaydetT); clearTimeout(balonT); hepsiniIptal();
      if (raf) cancelAnimationFrame(raf); raf = 0;
      if (boyutCb) window.removeEventListener('resize', boyutCb); boyutCb = null;
      if (gorunurCb) document.removeEventListener('visibilitychange', gorunurCb); gorunurCb = null;
      if (boyutGozlem) { try { boyutGozlem.disconnect(); } catch (e) {} boyutGozlem = null; }
      olayIptal.forEach(f => { try { f(); } catch (e) {} }); olayIptal = [];
      if (d && ctx) kaydetDurum();
      urlleriBirak();
      if (ctx) ctx.ses.hepsiniDurdur();
      animler.clear(); sicaklik.clear(); onbellek.clear(); miniOnbellek.clear(); havuz.clear(); mermerOnbellek.clear(); boyaliOnbellek.clear(); yolOnbellek.clear();
      surukle = null; seciliParca = null; imlec = null; canliCizim = false;
      Object.keys(ui).forEach(k => { ui[k] = null; });
      tuvalA = tuvalT = tuvalU = null; gA = gT = gU = null; ornekler = []; yerlesim = [];
      gecmis.length = 0; gelecek.length = 0;
      ctx = null; kok = null; d = null;
    }
  });
  // test/QA kancası: yalnız okuma (göç ve çizim ölçümü için)
  CD.tirnakTest = {
    durumGoc, galeriKaydiGoc, tirnakGoc, ellerDuzelt, surum: SURUM,
    konum: (taraf, i, ny) => ctx ? konumIstemci(taraf, i, ny) : null,
    durum: () => d ? kopya(d) : null
  };
})();
