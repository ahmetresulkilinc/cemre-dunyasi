/* js/bolum/bahce.js — Botanik Bahçe
   Saksılar, katalog (lilyum + gül şart), tohum→filiz→tomurcuk→çiçek SVG aşamaları,
   bakım (sula, güneş, gübre, buda, konuş), gerçek zamanlı ihtiyaçlar (cd.bahce.durum),
   açınca kutlama + kelebek/arı ziyareti, vazo + buket (PNG paylaş), rozetler, çiçek rehberi.
   Sözleşme: site/MODUL-SOZLESMESI.md · klasik <script>, modül yok, fetch yok. */
(() => {
  'use strict';
  const ID = 'bahce';

  /* ------------------------------------------------------------------ ayarlanabilir sabitler */
  const AYAR = {
    BUYUME_SAAT: 36,            // çarpan 1 iken tohum→çiçek toplam saat (ideal bakımla ~24 sa, ihmalle ~3 gün)
    ESIK: [0, 6, 45, 100],      // aşama eşikleri (%): tohum, filiz, tomurcuk, çiçek
    SEVGI_SAAT: 48,             // sevgi barının 100→0 süresi (saat)
    BASLANGIC_SAKSI: 6,
    MAKS_SAKSI: 12,
    GUBRE_BEKLE_SAAT: 6,        // aynı bitkiye tekrar gübre
    BUDAMA_BEKLE_SAAT: 3,
    KONUSMA_BEKLE_DK: 3,        // sevgi kazanmak için (konuşmak her zaman serbest)
    BONUS: { sula: 2, gunes: 1.2, gubre: 5, buda: 3, konus: 0.6 },   // anında büyüme (%)
    VAZO_MAKS: 40,
    BUKET_MIN: 3, BUKET_MAX: 7,
    TIK_MS: 1000, KAYDET_MS: 2500,
    ZIYARET_MIN_S: 22, ZIYARET_MAKS_S: 60
  };

  /* ------------------------------------------------------------------ sanat renkleri (SVG içi; serbest) */
  const YAPRAK = '#6DB877', YAPRAK_KOYU = '#3F7A4A', SAP = '#4F9A5C';
  const TOPRAK = '#7A4E33', TOPRAK_ACIK = '#96684A';
  const SAKSI = '#D98B6A', SAKSI_KOYU = '#B8674A', SAKSI_ACIK = '#EBA88A';
  const KURDELE = '#F2A5C2', KURDELE_KOYU = '#C96B92';
  const KAGIT = {
    pembe:   { ad: 'Pembe',   ana: '#FBD3DF', koyu: '#F0AFC4' },
    krem:    { ad: 'Krem',    ana: '#FBF1E0', koyu: '#E9D6B8' },
    lavanta: { ad: 'Lavanta', ana: '#E6DCF8', koyu: '#C9B8EC' },
    kraft:   { ad: 'Kraft',   ana: '#DDB98F', koyu: '#BC9668' },
    nane:    { ad: 'Nane',    ana: '#D7F2E3', koyu: '#A7DCC0' }
  };

  /* ------------------------------------------------------------------ çiçek kataloğu */
  const R = (ad, ana, koyu, acik, merkez, ek) => Object.assign({ ad, ana, koyu, acik, merkez: merkez || acik }, ek || {});
  const TUR = {
    lilyum: { ad: 'Lilyum', aile: 'lilyum', emoji: '🌸', hiz: 0.9, ihtiyac: { su: 48, gunes: 48, gubre: 72 }, isik: 'dolayli',
      sever: 'serin köşe, dolaylı ışık, iki günde bir su', sevmez: 'öğle güneşinin tam altı',
      bilgi: 'Stargazer en kokulu olanı; siyah lilyum aslında çok koyu bordo, adı da yaklaşık olarak "Landini".',
      renkler: {
        pembe: R('Pembe', '#F5A3C7', '#D9699C', '#FBD5E6'),
        kirmizi: R('Kırmızı', '#DB3B54', '#A11F34', '#F0728A'),
        siyah: R('Siyah', '#4B1A2C', '#24070F', '#7B3552'),
        beyaz: R('Beyaz', '#FFFDFB', '#DCC9C0', '#FFFFFF'),
        stargazer: R('Stargazer', '#E8618F', '#B83A6C', '#FFF2F7', null, { stargazer: true, benek: '#8A1F49' })
      } },
    gul: { ad: 'Gül', aile: 'gul', emoji: '🌹', hiz: 1, ihtiyac: { su: 40, gunes: 30, gubre: 72 }, isik: 'bol',
      sever: 'bol güneş, iki günde bir su, arada gübre', sevmez: 'kupkuru toprak',
      bilgi: 'Siyah gül gerçekte kadife bordodur ("Black Baccara"). Mavi gül doğada yok, çiçekçidekiler boyalıdır; burada büyülü.',
      renkler: {
        kirmizi: R('Kırmızı', '#E0435C', '#A81E3A', '#F07A8E'),
        pembe: R('Pembe', '#F4A0BE', '#D46A93', '#FBCADB'),
        beyaz: R('Beyaz', '#FFF7F9', '#D9B4C1', '#FFFFFF'),
        siyah: R('Siyah', '#4A1C2E', '#22080F', '#7A3552'),
        sari: R('Sarı', '#FFD65C', '#E0A62A', '#FFE99A'),
        mavi: R('Mavi', '#7FA8E8', '#4C74C4', '#B3CCF5')
      } },
    lale: { ad: 'Lale', aile: 'lale', emoji: '🌷', hiz: 1.2, ihtiyac: { su: 36, gunes: 36, gubre: 96 }, isik: 'bol',
      sever: 'serin sabahlar, düzenli su', sevmez: 'sıcak ve kuru hava',
      bilgi: 'Lale İstanbul\'dan Hollanda\'ya gitti; adı sarıktan gelir.',
      renkler: {
        pembe: R('Pembe', '#F7A6C4', '#D66A95', '#FCD3E2'),
        kirmizi: R('Kırmızı', '#E2434F', '#A9202C', '#F2808A'),
        sari: R('Sarı', '#FFD54F', '#DFA21E', '#FFE998'),
        mor: R('Mor', '#A97BD8', '#7A4FB0', '#CDB2EC')
      } },
    sakayik: { ad: 'Şakayık', aile: 'sakayik', emoji: '🌺', hiz: 0.8, ihtiyac: { su: 30, gunes: 40, gubre: 60 }, isik: 'bol',
      sever: 'bol su, sabah güneşi', sevmez: 'sık sık yer değiştirmek',
      bilgi: 'Şakayık gelinlerin çiçeği; bir kere köklendi mi yıllarca açar.',
      renkler: {
        pembe: R('Pembe', '#F7B3CB', '#D9749B', '#FCE0EA'),
        beyaz: R('Beyaz', '#FFF9FA', '#E2C7D1', '#FFFFFF'),
        mercan: R('Mercan', '#FF9E86', '#D45E48', '#FFC9BA')
      } },
    orkide: { ad: 'Orkide', aile: 'orkide', emoji: '🪷', hiz: 0.7, ihtiyac: { su: 72, gunes: 60, gubre: 120 }, isik: 'dolayli',
      sever: 'parlak ama dolaylı ışık, haftada bir su', sevmez: 'kökünün suda beklemesi',
      bilgi: 'Orkide köklerini görmek ister; şeffaf saksı en mutlu evi.',
      renkler: {
        beyaz: R('Beyaz', '#FFFBFD', '#D9BFD0', '#FFFFFF', '#E24C8C'),
        pembe: R('Pembe', '#F6A9CC', '#D56A9E', '#FBD6E6', '#B8306E'),
        mor: R('Mor', '#B98BE0', '#8759B8', '#D9C2F0', '#5E2C8E')
      } },
    papatya: { ad: 'Papatya', aile: 'papatya', emoji: '🌼', hiz: 1.4, ihtiyac: { su: 36, gunes: 30, gubre: 96 }, isik: 'bol',
      sever: 'güneş, güneş, biraz daha güneş', sevmez: 'gölge',
      bilgi: 'Seviyor, sevmiyor… papatya her zaman "seviyor" der.',
      renkler: { beyaz: R('Beyaz', '#FFFFFF', '#DCD3CF', '#FFFFFF') } },
    aycicegi: { ad: 'Ayçiçeği', aile: 'aycicegi', emoji: '🌻', hiz: 1.1, ihtiyac: { su: 30, gunes: 20, gubre: 60 }, isik: 'bol',
      sever: 'tam güneş, sık su', sevmez: 'karanlık köşe',
      bilgi: 'Gençken kafasını güneşle çevirir; büyüyünce hep doğuya bakar.',
      renkler: { sari: R('Sarı', '#FFCB3D', '#E39B14', '#FFE27A', '#6B3F1D') } },
    lavanta: { ad: 'Lavanta', aile: 'lavanta', emoji: '💜', hiz: 0.9, ihtiyac: { su: 96, gunes: 24, gubre: 120 }, isik: 'bol',
      sever: 'kuru toprak, bol güneş, az su', sevmez: 'sırılsıklam kök',
      bilgi: 'Kokusu uykuyu getirir; yastığının yanına bir dal koy.',
      renkler: { mor: R('Mor', '#9B7BD6', '#6E4FB0', '#C6B2EE') } },
    ortanca: { ad: 'Ortanca', aile: 'ortanca', emoji: '💙', hiz: 0.9, ihtiyac: { su: 20, gunes: 48, gubre: 72 }, isik: 'dolayli',
      sever: 'çok su, yarı gölge', sevmez: 'susuz öğlenler',
      bilgi: 'Toprak asidik olunca mavi, değilse pembe açar; rengi toprak seçer.',
      renkler: {
        mavi: R('Mavi', '#9DBBEF', '#6484C9', '#C9DAF7', '#F4F7FF'),
        pembe: R('Pembe', '#F5B1CB', '#D6779C', '#FBD8E5', '#FFF6F9'),
        lila: R('Lila', '#C9B4EA', '#9A7BCB', '#E3D6F5', '#FBF8FF')
      } },
    sakura: { ad: 'Sakura', aile: 'sakura', emoji: '🌸', hiz: 0.8, ihtiyac: { su: 48, gunes: 36, gubre: 96 }, isik: 'bol',
      sever: 'ılık bahar, düzenli su', sevmez: 'rüzgârlı balkon',
      bilgi: 'Japonya\'da açtığı hafta herkes ağacın altında piknik yapar.',
      renkler: { pembe: R('Pembe', '#F9B8D0', '#D77A9E', '#FDE1EB') } },
    kaktus: { ad: 'Kaktüs', aile: 'kaktus', emoji: '🌵', hiz: 0.6, ihtiyac: { su: 168, gunes: 24, gubre: 240 }, isik: 'bol',
      sever: 'direkt güneş, haftada bir yudum su', sevmez: 'fazla su',
      bilgi: 'Sabırlı olana pembe bir sürprizi var.',
      renkler: { pembe: R('Pembe', '#F78FB3', '#C9557F', '#FCC7DA') } }
  };
  const TUR_SIRA = ['lilyum', 'gul', 'lale', 'sakayik', 'orkide', 'papatya', 'aycicegi', 'lavanta', 'ortanca', 'sakura', 'kaktus'];
  const ASAMA_AD = ['Tohum', 'Filiz', 'Tomurcuk', 'Çiçek'];
  const ASAMA_EMOJI = ['🌰', '🌱', '🪴', '🌸'];

  /* ------------------------------------------------------------------ mikro-metin */
  const SOZ = {
    genel: ['Merhaba Cemre', 'Bugün biraz daha büyüdüm.', 'Güneş yüzüme vurdu, ne güzel.', 'Sen gelince yaprağım titriyor.', 'Kökümü sıkı tutuyorum.', 'Bana bir şey söyle?', 'Kelebek geçti, selam söyledi.', 'Toprak sıcacık.', 'Beni de seviyorsun, değil mi?', 'Bir gün buket olacağım.'],
    susuz: ['Biraz susadım Cemre…', 'Bir yudum su?', 'Dilim damağım kurudu.'],
    acti: ['Bak, açtım!', 'Bugün en güzel günüm.', 'Kokumu duyuyor musun?', 'Kelebekler beni buldu.'],
    sula: ['Kana kana içtim', 'Ohh, serinledim.', 'Susamıştım, sağ ol Cemre.', 'Kökler dans ediyor.'],
    sulaDolu: ['Doydum; toprağı boğmayalım.', 'Şimdilik yeter, teşekkürler.'],
    gunes: ['Güneşe döndüm, mm.', 'Işık = mutluluk.', 'Yapraklarım ısındı.'],
    gunesDolayli: ['Ben gölgeyi de severim ama sağ ol.', 'Az ışık bana yeter.'],
    gubre: ['Mmm, mineral!', 'Toprağım güçlendi.', 'Büyüme modu açık.'],
    buda: ['Kuru yaprak gitti, hafifledim.', 'Şimdi daha şık oldum.', 'Ellerin ne hafif.'],
    kes: ['Vazoya gittim; yeni tomurcuğum yolda.', 'Beni yanında taşı.'],
    ek: ['Toprağa girdim, ışığı bekliyorum.', 'Merhaba dünya!', 'Çok minik ama umutluyum.'],
    aile: {
      gul: ['Dikenlerim var ama kalbim yumuşak.', 'En klasik aşk benim.'],
      lilyum: ['Kokum uzaktan gelir.', 'Zarif durmayı severim.'],
      lale: ['Sabah açar, akşam kapanırım.', 'Boynum uzun, bakışım kısa.'],
      sakayik: ['Kabarık ve gururluyum.', 'Yüz kat elbisem var.'],
      orkide: ['Bana nazik davran, ben zarifim.', 'Köklerimi görmeyi severim.'],
      papatya: ['Seviyor… seviyor… seviyor.', 'Basit ama neşeliyim.'],
      aycicegi: ['Güneş nerede, ben oradayım.', 'Boyum seni geçecek.'],
      lavanta: ['Beni koklayınca uykun gelir.', 'Arılar bana bayılır.'],
      ortanca: ['Rengimi toprak seçer.', 'Çok su isterim, kusura bakma.'],
      sakura: ['Bir hafta açar, bir yıl hatırlanırım.', 'Piknik zamanı.'],
      kaktus: ['Az su, çok sevgi.', 'Dikenim var ama sana değil.']
    },
    konus: [
      { m: 'Günaydın çiçeğim', c: ['Günaydın Cemre, ışık geldi mi?', 'Uyandım, seni bekliyordum.'] },
      { m: 'Çok güzelsin', c: ['Sen bana bakınca oluyorum.', 'Yapraklarım kızardı.'] },
      { m: 'Bugün nasılsın?', c: ['Toprak sıcak, sen buradasın; iyiyim.', 'Biraz büyüdüm, fark ettin mi?'] },
      { m: 'Seni seviyorum', c: ['Ben de seni Cemre, köküme kadar.', 'Kalbim bir tomurcuk, senin için açıyor.'] },
      { m: 'Sana şarkı söyleyeyim mi?', c: ['Lütfen; ritimle sallanırım.', 'Lalalaa… duydum, güzeldi.'] },
      { m: 'Büyü büyü!', c: ['Çalışıyorum!', 'Sen söyleyince kolay.'] }
    ]
  };

  /* ------------------------------------------------------------------ SVG yardımcıları */
  const n1 = (v) => Number(v).toFixed(1).replace(/\.0$/, '');
  const P = (d, fill, stroke, sw, ek) => '<path d="' + d + '" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="' + (sw == null ? 1.4 : sw) + '" stroke-linejoin="round" stroke-linecap="round"' + (ek ? ' ' + ek : '') + '/>';
  const E = (cx, cy, rx, ry, fill, stroke, sw, ek) => '<ellipse cx="' + n1(cx) + '" cy="' + n1(cy) + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="' + (sw == null ? 1 : sw) + '"' + (ek ? ' ' + ek : '') + '/>';
  const C = (cx, cy, r, fill, stroke, sw) => '<circle cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="' + r + '" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="' + (sw == null ? 1 : sw) + '"/>';
  const G = (tr, ic) => '<g transform="' + tr + '">' + ic + '</g>';

  function sap(x1, y1, x2, y2, w) {
    return '<path d="M' + n1(x1) + ',' + n1(y1) + ' C' + n1(x1) + ',' + n1(y1 - 18) + ' ' + n1(x2 + (x1 - x2) * 0.3) + ',' + n1(y2 + 16) + ' ' + n1(x2) + ',' + n1(y2) + '" fill="none" stroke="' + SAP + '" stroke-width="' + (w || 4) + '" stroke-linecap="round"/>';
  }
  function yaprak(x, y, yon, sc) {
    const m = yon === 'sol' ? -1 : 1; sc = sc || 1;
    return G('translate(' + n1(x) + ',' + n1(y) + ') scale(' + (m * sc) + ',' + sc + ') rotate(-22)',
      P('M0,0 C4,-8 14,-11 21,-4 C14,4 4,6 0,0Z', YAPRAK, YAPRAK_KOYU, 1.2) + '<path d="M2,0 L17,-3.5" stroke="' + YAPRAK_KOYU + '" stroke-width=".8" opacity=".55"/>');
  }
  function darYaprak(x, y, aci, uz) {
    return G('translate(' + n1(x) + ',' + n1(y) + ') rotate(' + aci + ')', P('M0,0 C-3,-' + (uz * 0.5) + ' -2,-' + uz + ' 0,-' + (uz + 2) + ' C2,-' + uz + ' 3,-' + (uz * 0.5) + ' 0,0Z', '#9DBBA0', '#5E8A66', 1));
  }

  /* --- çiçek başları (merkez 0,0; yarıçap ~28) --- */
  const TAC = 'M0,0 C-10,-4 -15,-15 -7,-22 C-3,-25 3,-25 7,-22 C15,-15 10,-4 0,0Z';
  const BAS = {
    gul(r) {
      let s = '';
      for (let i = 0; i < 7; i++) s += G('rotate(' + (i * 360 / 7) + ') scale(1.25)', P(TAC, r.ana, r.koyu, 1.1));
      for (let i = 0; i < 6; i++) s += G('rotate(' + (i * 60 + 25) + ') scale(.95)', P(TAC, r.acik, r.koyu, 1.1));
      for (let i = 0; i < 5; i++) s += G('rotate(' + (i * 72 + 50) + ') scale(.62)', P(TAC, r.ana, r.koyu, 1.3));
      s += C(0, 0, 5.5, r.koyu) + '<path d="M-2.6,-1 A2.8,2.8 0 1 1 1.8,2 A1.4,1.4 0 1 0 0,-0.8" fill="none" stroke="' + r.acik + '" stroke-width="1.2" stroke-linecap="round"/>';
      return s;
    },
    lilyum(r) {
      let s = '';
      const T = 'M0,0 C-9,-9 -11,-25 0,-36 C11,-25 9,-9 0,0Z';
      for (let i = 0; i < 6; i++) {
        const sc = i % 2 ? .9 : 1;
        let ic;
        if (r.stargazer) ic = P(T, r.acik, r.koyu, 1.2) + P('M0,-3 C-5,-10 -6,-22 0,-31 C6,-22 5,-10 0,-3Z', r.ana, 'none', 0) + C(-1.5, -14, 1, r.benek) + C(2, -19, 1, r.benek) + C(1, -9, .9, r.benek) + C(-2, -24, .8, r.benek) + C(-3, -18, .7, r.benek);
        else ic = P(T, r.ana, r.koyu, 1.2) + '<path d="M0,-6 L0,-28" stroke="' + r.acik + '" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>';
        s += G('rotate(' + (i * 60) + ') scale(' + sc + ')', ic);
      }
      for (let i = 0; i < 6; i++) s += G('rotate(' + (i * 60 + 30) + ')', '<path d="M0,0 L0,-13" stroke="#C99A5B" stroke-width="1.2"/>' + E(0, -14, 1.6, 3, '#C4652A'));
      s += C(0, 0, 3.2, '#F1D9A0', '#C99A5B', .8);
      return s;
    },
    lale(r) {
      return P('M-14,-22 C-24,-31 -27,-13 -17,-1 L-8,4Z', r.koyu, r.koyu, 1.2)
        + P('M14,-22 C24,-31 27,-13 17,-1 L8,4Z', r.koyu, r.koyu, 1.2)
        + P('M-17,-6 C-19,-26 -9,-36 0,-31 C9,-36 19,-26 17,-6 C14,10 -14,10 -17,-6Z', r.ana, r.koyu, 1.3)
        + '<path d="M-1,-31 C-8,-24 -9,-8 -5,8" fill="none" stroke="' + r.koyu + '" stroke-width="1" opacity=".8"/><path d="M1,-31 C8,-24 9,-8 5,8" fill="none" stroke="' + r.koyu + '" stroke-width="1" opacity=".8"/>'
        + '<path d="M-11,-22 C-13,-15 -13,-6 -11,-1" stroke="' + r.acik + '" stroke-width="2.2" fill="none" opacity=".75" stroke-linecap="round"/>';
    },
    aycicegi(r) {
      let s = '';
      for (let i = 0; i < 14; i++) s += E(0, -23, 5.5, 11, r.koyu, r.koyu, 1, 'transform="rotate(' + n1(i * 360 / 14 + 12.9) + ')"');
      for (let i = 0; i < 14; i++) s += E(0, -24, 5.5, 11.5, r.ana, r.koyu, 1, 'transform="rotate(' + n1(i * 360 / 14) + ')"');
      s += C(0, 0, 14, r.merkez, '#4A2A12', 1.2);
      for (let i = 0; i < 18; i++) { const a = i * 137.5 * Math.PI / 180, rr = 2.5 + Math.sqrt(i) * 2.6; s += C(Math.cos(a) * rr, Math.sin(a) * rr, 1.3, '#9A6634'); }
      return s;
    },
    lavanta(r) {
      let s = '';
      for (let j = 0; j < 7; j++) s += E(j % 2 ? -3.2 : 3.2, -j * 5.5 + 8, 4.2, 3.2, j % 3 === 1 ? r.acik : r.ana, r.koyu, .8);
      s += E(0, -31, 3, 3.6, r.acik, r.koyu, .8);
      return s;
    },
    sakayik(r) {
      let s = ''; const T = 'M0,0 C-12,-5 -20,-19 -9,-27 C-4,-31 4,-31 9,-27 C20,-19 12,-5 0,0Z';
      for (let i = 0; i < 8; i++) s += G('rotate(' + (i * 45) + ')', P(T, r.ana, r.koyu, 1.1));
      for (let i = 0; i < 7; i++) s += G('rotate(' + n1(i * 360 / 7 + 22) + ') scale(.74)', P(T, r.acik, r.koyu, 1.2));
      for (let i = 0; i < 6; i++) s += G('rotate(' + (i * 60 + 8) + ') scale(.48)', P(T, r.ana, r.koyu, 1.5));
      for (let i = 0; i < 7; i++) { const a = i * 2 * Math.PI / 7; s += C(Math.cos(a) * 3.2, Math.sin(a) * 3.2, 1.5, '#F4D35E'); }
      return s;
    },
    orkide(r) {
      return E(0, -15, 7, 14, r.ana, r.koyu, 1.1)
        + E(0, -14, 6, 12, r.ana, r.koyu, 1.1, 'transform="rotate(-52)"') + E(0, -14, 6, 12, r.ana, r.koyu, 1.1, 'transform="rotate(52)"')
        + E(-14, -3, 13, 9.5, r.acik, r.koyu, 1.1) + E(14, -3, 13, 9.5, r.acik, r.koyu, 1.1)
        + P('M0,-1 C-8,1 -10,12 -4,15 C-1,16.5 1,16.5 4,15 C10,12 8,1 0,-1Z', r.merkez, r.koyu, 1)
        + C(-2, 7, 1, r.koyu) + C(2.5, 9.5, 1, r.koyu) + C(0, 4, .8, r.koyu)
        + C(0, 0, 3, '#F4D35E', r.koyu, .8);
    },
    papatya(r) {
      let s = '';
      for (let i = 0; i < 14; i++) s += E(0, -15, 4, 12, r.ana, r.koyu, .9, 'transform="rotate(' + n1(i * 360 / 14) + ')"');
      s += C(0, 0, 7.5, '#F9C846', '#D9A024', 1) + C(-2, -2, 1.2, '#D9A024') + C(2.5, 1, 1.2, '#D9A024') + C(-1, 3, 1.2, '#D9A024');
      return s;
    },
    ortanca(r) {
      const nk = [[0, 0]];
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; nk.push([Math.cos(a) * 11.5, Math.sin(a) * 11.5]); }
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; nk.push([Math.cos(a) * 21, Math.sin(a) * 21]); }
      let s = C(0, 0, 26, r.koyu, 'none', 0).replace('fill="', 'opacity=".35" fill="');
      nk.forEach((p, i) => {
        const f = i % 3 === 0 ? r.acik : r.ana; let ic = '';
        [[-3.6, 0], [3.6, 0], [0, -3.6], [0, 3.6]].forEach(q => { ic += C(q[0], q[1], 3.4, f, r.koyu, .7); });
        ic += C(0, 0, 1.6, r.merkez);
        s += G('translate(' + n1(p[0]) + ',' + n1(p[1]) + ') rotate(' + ((i * 23) % 90) + ')', ic);
      });
      return s;
    },
    sakura(r) {
      let s = '<path d="M-24,18 C-10,6 8,-2 26,-16" stroke="#6B4A33" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M-2,2 C4,-8 6,-14 4,-22" stroke="#6B4A33" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      s += G('translate(-16,12) rotate(-10) scale(.7)', darYaprakSakura());
      [[-14, 8, 1], [2, -3, 1.1], [18, -13, 1], [4, -21, .85]].forEach(p => { s += G('translate(' + p[0] + ',' + p[1] + ')', sakuraCicek(r, p[2])); });
      s += C(-6, 4, 3, r.koyu) + C(12, -9, 2.6, r.koyu) + C(24, -18, 2.2, r.koyu);
      return s;
    },
    kaktus(r) {
      let s = '';
      for (let i = 0; i < 8; i++) s += E(0, -8, 3.4, 8, r.ana, r.koyu, .9, 'transform="rotate(' + (i * 45) + ')"');
      for (let i = 0; i < 8; i++) s += E(0, -5, 2.2, 5, r.acik, r.koyu, .8, 'transform="rotate(' + (i * 45 + 22.5) + ')"');
      s += C(0, 0, 3.2, '#F4D35E', '#D9A024', .8);
      return s;
    }
  };
  function sakuraCicek(r, sc) {
    let s = '';
    for (let i = 0; i < 5; i++) s += E(0, -6, 3.6, 5.6, r.ana, r.koyu, .8, 'transform="rotate(' + (i * 72) + ')"');
    s += C(0, 0, 2, '#F4D35E');
    return G('scale(' + (sc || 1) + ')', s);
  }
  function darYaprakSakura() { return P('M0,0 C4,-8 12,-10 18,-4 C12,3 4,5 0,0Z', '#7FBF7A', '#4E8A55', 1); }

  /* --- tomurcuklar (merkez 0,0; altı sapa oturur) --- */
  const TOMURCUK = {
    gul(r) {
      return P('M0,-21 C9,-15 9,2 0,8 C-9,2 -9,-15 0,-21Z', r.ana, r.koyu, 1.2) + '<path d="M-3,-15 C-1,-9 -1,-1 -2,6" fill="none" stroke="' + r.koyu + '" stroke-width="1" opacity=".8"/>'
        + P('M0,9 C-7,3 -10,-7 -7,-13 C-4,-6 -3,0 0,9Z', YAPRAK, YAPRAK_KOYU, 1) + P('M0,9 C7,3 10,-7 7,-13 C4,-6 3,0 0,9Z', YAPRAK, YAPRAK_KOYU, 1) + P('M-6,4 C-4,11 4,11 6,4Z', YAPRAK, YAPRAK_KOYU, 1);
    },
    lilyum(r) {
      return G('rotate(18)', P('M0,-27 C7,-19 7,1 0,7 C-7,1 -7,-19 0,-27Z', r.stargazer ? r.ana : r.ana, r.koyu, 1.2) + P('M0,7 C-6,1 -6.5,-9 -4,-13 L4,-13 C6.5,-9 6,1 0,7Z', '#7DBA83', YAPRAK_KOYU, 1) + '<path d="M0,-22 L0,-14" stroke="' + r.acik + '" stroke-width="1.6" opacity=".7"/>');
    },
    lale(r) {
      return P('M-10,-4 C-12,-22 -4,-31 0,-28 C4,-31 12,-22 10,-4 C8,8 -8,8 -10,-4Z', r.ana, r.koyu, 1.2) + P('M-10,-4 C-12,-22 -4,-31 0,-28 C-4,-24 -6,-10 -4,6 C-8,6 -10,2 -10,-4Z', '#8CC48F', 'none', 0).replace('fill="', 'opacity=".55" fill="') + '<path d="M0,-28 C2,-18 2,-6 1,6" fill="none" stroke="' + r.koyu + '" stroke-width="1" opacity=".7"/>';
    },
    aycicegi(r) {
      let s = '';
      for (let i = 0; i < 10; i++) s += P('M0,0 L-4,-14 L0,-18 L4,-14Z', '#6FAF6F', YAPRAK_KOYU, .9, 'transform="rotate(' + (i * 36) + ')"');
      s += C(0, 0, 11, '#7FBF7A', YAPRAK_KOYU, 1.2);
      for (let i = 0; i < 6; i++) s += E(0, -6, 2, 3.5, r.ana, r.koyu, .6, 'transform="rotate(' + (i * 60) + ')"');
      return s;
    },
    lavanta(r) {
      let s = '';
      for (let j = 0; j < 5; j++) s += E(j % 2 ? -2.6 : 2.6, -j * 5 + 6, 3.4, 2.8, '#B7A6DC', r.koyu, .7);
      s += E(0, -20, 2.4, 3, '#9DBBA0', YAPRAK_KOYU, .7);
      return s;
    },
    sakayik(r) {
      return C(0, -2, 11, '#8CC48F', YAPRAK_KOYU, 1.2) + P('M-8,-6 C-6,-16 6,-16 8,-6 C4,-10 -4,-10 -8,-6Z', r.ana, r.koyu, 1) + P('M-4,-1 C-2,-8 2,-8 4,-1Z', r.acik, r.koyu, .8);
    },
    orkide(r) {
      return E(-6, -8, 5, 8, r.ana, r.koyu, 1, 'transform="rotate(-20 -6 -8)"') + E(6, -2, 4, 6.5, r.acik, r.koyu, 1, 'transform="rotate(15 6 -2)"') + '<path d="M-6,0 C-6,6 -2,8 0,8 M6,4 C6,8 2,9 0,8" fill="none" stroke="' + SAP + '" stroke-width="2"/>';
    },
    papatya(r) {
      let s = C(0, 0, 8, '#8CC48F', YAPRAK_KOYU, 1.1);
      for (let i = 0; i < 8; i++) s += '<path d="M0,-4 L0,-9" stroke="' + r.ana + '" stroke-width="2.2" stroke-linecap="round" transform="rotate(' + (i * 45) + ')"/>';
      return s;
    },
    ortanca(r) {
      let s = C(0, 0, 13, '#8CC48F', YAPRAK_KOYU, 1.1);
      [[0, -5], [-6, 2], [6, 2], [0, 6], [-3, -2], [4, -3]].forEach((p, i) => { s += C(p[0], p[1], 3, i % 2 ? r.acik : '#A9D3B0', r.koyu, .6); });
      return s;
    },
    sakura(r) { return ''; },
    kaktus(r) { return ''; }
  };

  /* --- bitki (saksı içinde; viewBox 0 0 120 162; toprak y=118) --- */
  const COKLU = {
    lavanta: [{ x: -18, y: 74, sc: .9 }, { x: 0, y: 56, sc: 1 }, { x: 18, y: 74, sc: .9 }],
    papatya: [{ x: -20, y: 76, sc: .78 }, { x: 0, y: 56, sc: .95 }, { x: 20, y: 78, sc: .78 }],
    orkide: [{ x: -8, y: 52, sc: .95 }, { x: 18, y: 82, sc: .8 }]
  };
  function saksiSvg() {
    return P('M20,118 L100,118 L91,155 Q60,161 29,155Z', SAKSI, SAKSI_KOYU, 1.5)
      + '<path d="M33,126 L35,150" stroke="' + SAKSI_ACIK + '" stroke-width="3" stroke-linecap="round" opacity=".55"/>'
      + '<rect x="16" y="110" width="88" height="13" rx="5" fill="' + SAKSI_ACIK + '" stroke="' + SAKSI_KOYU + '" stroke-width="1.5"/>'
      + E(60, 117, 38, 5, TOPRAK);
  }
  function tohumSvg(r) {
    return E(60, 116, 22, 6, TOPRAK_ACIK) + E(60, 113, 4.5, 3, '#B08560', '#7A4E33', 1, 'transform="rotate(-20 60 113)"')
      + '<path d="M50,104 l1.5,3 M70,102 l-1.5,3 M60,100 v3" stroke="#F4D35E" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>'
      + '<rect x="82" y="90" width="3" height="28" rx="1" fill="#A9825E"/>' + P('M85,91 L99,95 L85,99Z', r.ana, r.koyu, 1);
  }
  function filizSvg(T) {
    if (T.aile === 'kaktus') return G('translate(60,0)', P('M-8,118 L-8,110 A8,8 0 0 1 8,110 L8,118Z', '#6FBF73', YAPRAK_KOYU, 1.4) + '<path d="M-3,112 v4 M3,112 v4" stroke="#4F9A5C" stroke-width="1"/>');
    if (T.aile === 'sakura') return '<path d="M60,118 C60,108 62,100 65,93" stroke="#6B4A33" stroke-width="3" fill="none" stroke-linecap="round"/>' + G('translate(63,100) scale(.7)', darYaprakSakura()) + G('translate(61,106) scale(-.6,.6)', darYaprakSakura());
    if (T.aile === 'lavanta') return darYaprak(60, 118, -22, 16) + darYaprak(60, 118, 20, 15) + darYaprak(60, 118, -5, 20) + darYaprak(60, 118, 8, 18);
    return sap(60, 118, 60, 100, 3) + yaprak(60, 107, 'sol', .8) + yaprak(60, 103, 'sag', .8) + E(60, 97, 3, 5, YAPRAK, YAPRAK_KOYU, 1.2);
  }
  function kaktusSvg(asama, r) {
    const h = [0, 18, 40, 52][asama]; const ust = 118 - h;
    let s = P('M-13,118 L-13,' + (ust + 13) + ' A13,13 0 0 1 13,' + (ust + 13) + ' L13,118Z', '#6FBF73', YAPRAK_KOYU, 1.5);
    s += '<path d="M-5,116 L-5,' + (ust + 6) + ' M5,116 L5,' + (ust + 6) + '" stroke="#4F9A5C" stroke-width="1.2" opacity=".8"/>';
    for (let y = ust + 12; y < 114; y += 9) s += '<path d="M-14,' + y + ' l-3,-2 M-14,' + y + ' l-3,2 M14,' + y + ' l3,-2 M14,' + y + ' l3,2 M0,' + (y + 4) + ' l-2,-2 M0,' + (y + 4) + ' l2,-2" stroke="#F7F3E4" stroke-width="1.2" stroke-linecap="round"/>';
    if (asama >= 2) s += '<rect x="-27" y="' + (ust + 14) + '" width="10" height="20" rx="5" fill="#6FBF73" stroke="' + YAPRAK_KOYU + '" stroke-width="1.5"/><rect x="-26" y="' + (ust + 28) + '" width="15" height="9" rx="4.5" fill="#6FBF73" stroke="' + YAPRAK_KOYU + '" stroke-width="1.5"/><rect x="-24" y="' + (ust + 29) + '" width="12" height="6" fill="#6FBF73"/>';
    if (asama === 2) s += E(0, ust - 1, 4, 6.5, r.ana, r.koyu, 1) + '<path d="M0,-4 v8" stroke="' + r.koyu + '" stroke-width=".8" transform="translate(0,' + (ust - 1) + ')"/>';
    if (asama === 3) s += G('translate(0,' + (ust - 4) + ')', BAS.kaktus(r));
    return G('translate(60,0)', s);
  }
  function sakuraSvg(asama, r) {
    let s = '<path d="M60,118 C58,98 52,86 40,72" stroke="#6B4A33" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60,118 C62,96 70,82 84,66" stroke="#6B4A33" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M57,100 C50,94 44,92 36,92" stroke="#6B4A33" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    s += G('translate(70,84) rotate(-30) scale(.8)', darYaprakSakura()) + G('translate(48,96) rotate(20) scale(-.7,.7)', darYaprakSakura());
    const noktalar = [[40, 72, 1], [84, 66, 1.05], [36, 92, .8], [66, 90, .9], [52, 84, .75]];
    if (asama === 2) noktalar.forEach(p => { s += C(p[0], p[1], 3.2 * p[2], r.koyu, r.koyu, 1) + C(p[0] + 4 * p[2], p[1] + 3, 2.2 * p[2], r.ana); });
    else { noktalar.forEach(p => { s += G('translate(' + p[0] + ',' + p[1] + ')', sakuraCicek(r, p[2])); }); s += C(46, 80, 2.6, r.koyu) + C(76, 78, 2.4, r.koyu); }
    return s;
  }
  function bitkiSvg(turId, renkId, asama) {
    const T = TUR[turId], r = T.renkler[renkId];
    let ic;
    if (asama === 0) ic = tohumSvg(r);
    else if (asama === 1) ic = filizSvg(T);
    else if (T.aile === 'kaktus') ic = kaktusSvg(asama, r);
    else if (T.aile === 'sakura') ic = sakuraSvg(asama, r);
    else if (asama === 2) ic = sap(60, 118, 60, 70) + yaprak(60, 104, 'sol') + yaprak(60, 93, 'sag') + G('translate(60,68)', TOMURCUK[T.aile](r));
    else if (COKLU[T.aile]) {
      ic = '';
      COKLU[T.aile].forEach(k => { ic += sap(60, 118, 60 + k.x, k.y, 3.2); });
      if (T.aile === 'lavanta') ic += darYaprak(60, 118, -28, 22) + darYaprak(60, 118, 26, 20) + darYaprak(60, 118, -8, 24) + darYaprak(60, 118, 10, 26);
      else ic += yaprak(60, 106, 'sol') + yaprak(60, 100, 'sag');
      COKLU[T.aile].forEach(k => { ic += G('translate(' + (60 + k.x) + ',' + k.y + ') scale(' + k.sc + ')', BAS[T.aile](r)); });
    } else ic = sap(60, 118, 60, 54) + yaprak(60, 104, 'sol') + yaprak(60, 92, 'sag') + G('translate(60,54)', BAS[T.aile](r));
    return ic;
  }
  function saksiTamSvg(turId, renkId, asama, gecikme) {
    const ic = turId ? bitkiSvg(turId, renkId, asama) : '';
    const bos = !turId ? C(60, 78, 17, 'rgba(255,255,255,.55)', '#FFFFFF', 1.5).replace('stroke-width="1.5"', 'stroke-width="1.5" stroke-dasharray="4 3"') + '<path d="M60,70 v16 M52,78 h16" stroke="' + TOPRAK + '" stroke-width="3" stroke-linecap="round"/>' : '';
    return '<svg class="bahce-svg" viewBox="0 0 120 162" aria-hidden="true">' + saksiSvg() + '<g class="bahce-salla" style="animation-delay:' + (gecikme || 0) + 's">' + ic + '</g>' + bos + '</svg>';
  }
  function basSvg(turId, renkId, boy) {
    const T = TUR[turId], r = T.renkler[renkId]; boy = boy || 48;
    return '<svg viewBox="-34 -38 68 68" width="' + boy + '" height="' + boy + '" aria-hidden="true">' + BAS[T.aile](r) + '</svg>';
  }

  /* --- buket SVG (vazo çiçeklerinden) --- */
  function buketSvg(cicekler, kagitId, olcek) {
    const W = 320, tx = 160, ty = 334; const kg = KAGIT[kagitId] || KAGIT.pembe; const n = cicekler.length;
    const VY = 128, VH = 262;   // görünür pencere: yeşillik tepesi (~150) ile kâğıt dibi (~340) arası; üstte boşluk kalmaz
    const sc = n > 5 ? 1.0 : 1.15;
    const k = cicekler.map((c, i) => { const t = n === 1 ? .5 : i / (n - 1); const acid = -44 + 88 * t; const a = acid * Math.PI / 180; const rr = 152 + (i % 2 ? -30 : 0) + (n > 5 && i % 3 === 1 ? -10 : 0); return { x: tx + Math.sin(a) * rr, y: ty - Math.cos(a) * rr, aci: acid, c }; });
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ' + VY + ' ' + W + ' ' + VH + '" width="' + (W * (olcek || 1)) + '" height="' + (VH * (olcek || 1)) + '">';
    s += P('M38,198 L' + tx + ',' + (ty + 4) + ' L282,198 C252,148 204,132 160,136 C116,132 68,148 38,198Z', kg.koyu, 'none', 0);
    // yeşillik (okaliptüs)
    const ys = n === 1 ? [-30, 30] : k.map((p, i) => i < n - 1 ? (p.aci + k[i + 1].aci) / 2 : null).filter(v => v != null).concat([k[0].aci - 14, k[n - 1].aci + 14]);
    ys.forEach(acid => {
      const a = acid * Math.PI / 180, rr = 176; const ex = tx + Math.sin(a) * rr, ey = ty - Math.cos(a) * rr;
      s += '<path d="M' + tx + ',' + ty + ' L' + n1(ex) + ',' + n1(ey) + '" stroke="#7FAF8C" stroke-width="2.5" stroke-linecap="round"/>';
      for (let j = 0; j < 4; j++) { const t = .55 + j * .13; const px = tx + (ex - tx) * t, py = ty + (ey - ty) * t; s += C(px + (j % 2 ? 7 : -7), py, 5.5, '#A9CFB3', '#6F9C7D', .8); }
      s += C(ex, ey, 5, '#A9CFB3', '#6F9C7D', .8);
    });
    k.forEach(p => { s += '<path d="M' + tx + ',' + ty + ' C' + tx + ',' + (ty - 40) + ' ' + n1(p.x) + ',' + n1(p.y + 40) + ' ' + n1(p.x) + ',' + n1(p.y) + '" stroke="' + SAP + '" stroke-width="4.5" fill="none" stroke-linecap="round"/>'; });
    k.slice().sort((a, b) => a.y - b.y).forEach(p => {
      const T = TUR[p.c.tur], r = T.renkler[p.c.renk] || Object.values(T.renkler)[0];
      s += G('translate(' + n1(p.x) + ',' + n1(p.y) + ') rotate(' + n1(p.aci * .35) + ') scale(' + sc + ')', BAS[T.aile](r));
    });
    s += P('M66,244 L' + tx + ',' + (ty + 2) + ' L254,244 C220,262 100,262 66,244Z', kg.ana, kg.koyu, 1.5);
    s += '<path d="M112,252 L' + tx + ',' + ty + '" stroke="' + kg.koyu + '" stroke-width="1.5" opacity=".6"/>';
    s += G('translate(' + tx + ',' + (ty - 4) + ')', E(-15, -4, 14, 8, KURDELE, KURDELE_KOYU, 1.2, 'transform="rotate(-22)"') + E(15, -4, 14, 8, KURDELE, KURDELE_KOYU, 1.2, 'transform="rotate(22)"') + P('M-7,4 L-18,34 L-5,26Z', KURDELE, KURDELE_KOYU, 1.2) + P('M7,4 L18,34 L5,26Z', KURDELE, KURDELE_KOYU, 1.2) + C(0, 0, 5.5, KURDELE_KOYU));
    s += '</svg>';
    return s;
  }

  /* --- ziyaretçiler --- */
  function kelebekSvg(renk, koyu) {
    return '<svg viewBox="-18 -14 36 28" aria-hidden="true"><g class="bahce-kanat bahce-kanat-sol">' + P('M0,-1 C-7,-14 -18,-12 -16,-3 C-18,6 -9,12 0,3Z', renk, koyu, 1) + C(-9, -4, 2, '#FFFFFF') + '</g><g class="bahce-kanat bahce-kanat-sag">' + P('M0,-1 C7,-14 18,-12 16,-3 C18,6 9,12 0,3Z', renk, koyu, 1) + C(9, -4, 2, '#FFFFFF') + '</g>' + E(0, 0, 1.8, 7, '#5A3A4A') + '<path d="M-1,-6 C-3,-10 -5,-11 -6,-12 M1,-6 C3,-10 5,-11 6,-12" stroke="#5A3A4A" stroke-width="1" fill="none"/></svg>';
  }
  function ariSvg() {
    return '<svg viewBox="-16 -14 32 28" aria-hidden="true"><g class="bahce-kanat bahce-kanat-sol">' + E(-6, -7, 6, 4, 'rgba(255,255,255,.85)', '#9AB0C4', .8) + '</g><g class="bahce-kanat bahce-kanat-sag">' + E(6, -7, 6, 4, 'rgba(255,255,255,.85)', '#9AB0C4', .8) + '</g>' + E(0, 1, 10, 7, '#F5C542', '#5A3A2A', 1.2) + '<path d="M-3,-5.5 v13 M3,-5.5 v13" stroke="#5A3A2A" stroke-width="2.4"/>' + C(-7, -1, 1.2, '#2B1B14') + '<path d="M10,1 l4,0" stroke="#5A3A2A" stroke-width="1.2"/></svg>';
  }

  /* ------------------------------------------------------------------ durum */
  let ctx = null, kok = null, durum = null, secili = null, sekme = 'bahce';
  let aralik = 0, kaydetT = 0, kirli = false;
  const zamanlar = new Set(); const abonelikler = [];
  let ui = {};
  let buketSecim = [], buketKagit = 'pembe', buketAd = '';

  const bekle = (fn, ms) => { const t = setTimeout(() => { zamanlar.delete(t); if (ctx) fn(); }, ms); zamanlar.add(t); return t; };
  const rast = (a) => CD.rastgele(a);

  function varsayilan() {
    const s = { surum: 1, saksilar: [], vazo: [], buketler: [], sayac: { ekilen: 0, filiz: 0, acan: 0, buket: 0, kelebek: 0, konusma: 0, sulama: 0, acanRenk: {} }, rozetler: [], sonGorulme: Date.now() };
    for (let i = 0; i < AYAR.BASLANGIC_SAKSI; i++) s.saksilar.push({ id: 's' + i, bitki: null });
    return s;
  }
  function yukle() {
    const d = ctx.depo.al('durum', null);
    if (!d || !Array.isArray(d.saksilar)) return varsayilan();
    const v = varsayilan();
    d.sayac = Object.assign(v.sayac, d.sayac || {}); d.vazo = d.vazo || []; d.buketler = d.buketler || []; d.rozetler = d.rozetler || [];
    return d;
  }
  function kaydet(hemen) {
    kirli = true;
    if (hemen) { yazDepo(); return; }
    if (!kaydetT) kaydetT = setTimeout(() => { kaydetT = 0; yazDepo(); }, AYAR.KAYDET_MS);
  }
  function yazDepo() {
    if (!durum || !ctx) return;
    kirli = false; durum.sonGorulme = Date.now();
    ctx.depo.yaz('durum', durum);
    ctx.depo.yaz('ipucu', ipucu());
  }
  function ipucu() {
    const b = durum.saksilar.map(s => s.bitki).filter(Boolean);
    if (!b.length) return 'Bahçe boş; ilk tohumu sen at 🌱';
    const acan = b.filter(x => x.asama === 3).length, susuz = b.filter(x => x.su < 20 && x.asama < 3).length, tom = b.filter(x => x.asama === 2).length;
    if (acan) return acan + ' çiçek açtı 🌸';
    if (susuz) return susuz + ' çiçek su bekliyor 💧';
    if (tom) return tom + ' tomurcuk yolda ✨';
    return b.length + ' bitki büyüyor 🌱';
  }

  /* --- büyüme motoru --- */
  function carpan(b) { return .5 + .5 * (b.gunes / 100) + .35 * (b.gubre / 100) + .15 * (b.sevgi / 100); }
  function hizSaat(b) { return 100 / AYAR.BUYUME_SAAT * TUR[b.tur].hiz * carpan(b); }
  function simule(b, simdi) {
    const T = TUR[b.tur]; let dt = (simdi - (b.guncel || simdi)) / 3600000; const olaylar = [];
    if (dt < 0) dt = 0;
    let adimSayisi = 0;
    while (dt > 0 && adimSayisi < 2000) {
      const adim = Math.min(dt, .5); dt -= adim; adimSayisi++;
      const suHiz = 100 / T.ihtiyac.su; const suSure = suHiz > 0 ? b.su / suHiz : adim;
      const buyumeSure = Math.min(adim, Math.max(0, suSure));
      if (b.asama < 3 && buyumeSure > 0) b.buyume = Math.min(100, b.buyume + hizSaat(b) * buyumeSure);
      b.su = Math.max(0, b.su - suHiz * adim);
      b.gunes = Math.max(0, b.gunes - 100 / T.ihtiyac.gunes * adim);
      b.gubre = Math.max(0, b.gubre - 100 / T.ihtiyac.gubre * adim);
      b.sevgi = Math.max(0, b.sevgi - 100 / AYAR.SEVGI_SAAT * adim);
    }
    b.guncel = simdi;
    asamaGuncelle(b, olaylar);
    return olaylar;
  }
  function asamaGuncelle(b, olaylar) {
    let yeni = b.asama;
    for (let i = 3; i > b.asama; i--) if (b.buyume >= AYAR.ESIK[i]) { yeni = i; break; }
    if (yeni > b.asama) {
      for (let a = b.asama + 1; a <= yeni; a++) olaylar.push(a);
      b.asama = yeni;
      if (yeni === 3) { b.acildi = b.acildi || Date.now(); b.kutlandi = false; }
    }
  }
  function kalanSaat(b) { if (b.asama >= 3) return 0; const h = hizSaat(b); return h > 0 ? (AYAR.ESIK[b.asama + 1] - b.buyume) / h : Infinity; }
  function sureYaz(saat) {
    if (!isFinite(saat)) return 'su bekliyor';
    if (saat < 1 / 60) return 'az kaldı';
    const dk = Math.round(saat * 60); if (dk < 60) return '~' + dk + ' dk';
    if (saat >= 48) return '~' + Math.round(saat / 24) + ' gün';
    const s = Math.floor(saat), d = Math.round((saat - s) * 60);
    return '~' + s + ' sa' + (d && s < 6 ? ' ' + d + ' dk' : '');
  }
  function bitkiAdi(b) { const T = TUR[b.tur]; const r = T.renkler[b.renk]; return (Object.keys(T.renkler).length > 1 && r ? r.ad + ' ' : '') + T.ad; }

  /* ------------------------------------------------------------------ DOM kurulumu */
  function kur() {
    const el = ctx.el;
    ui = {};
    ui.sahne = el('div.bahce-sahne', { 'data-pati': '' }, [
      el('div.bahce-gok', { 'aria-hidden': 'true' }, [
        el('span.bahce-gunes'), el('span.bahce-ay'),
        el('span.bahce-yildiz', { stil: { left: '18%', top: '18%' } }), el('span.bahce-yildiz', { stil: { left: '62%', top: '10%', animationDelay: '1.1s' } }), el('span.bahce-yildiz', { stil: { left: '84%', top: '30%', animationDelay: '.5s' } }), el('span.bahce-yildiz', { stil: { left: '40%', top: '34%', animationDelay: '1.8s' } }),
        el('span.bahce-bulut.b1'), el('span.bahce-bulut.b2'), el('span.bahce-bulut.b3')
      ]),
      el('div.bahce-cit', { 'aria-hidden': 'true' }),
      el('div.bahce-tarh', [ui.saksilar = el('div.bahce-saksilar', { role: 'list', 'aria-label': 'Saksılar' })]),
      ui.ziyaret = el('div.bahce-ziyaretciler', { 'aria-hidden': 'true' })
    ]);
    ui.sekmeler = el('div.cipler.bahce-sekmeler', { role: 'tablist', 'aria-label': 'Bahçe sekmeleri' }, [
      ['bahce', '🪴 Bahçem'], ['buket', '💐 Vazo & Buket'], ['defter', '📒 Defter']
    ].map(([id, ad]) => el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(sekme === id), data: { sekme: id }, onclick: () => sekmeAc(id) }, ad)));
    ui.govde = el('div.icerik.bahce-govde');
    kok.append(ui.sahne, ui.sekmeler, ui.govde);
    saksilariCiz();
    sekmeAc(sekme, true);
  }

  function saksilariCiz() {
    ui.saksilar.innerHTML = '';
    durum.saksilar.forEach((s, i) => {
      const b = s.bitki;
      const d = ctx.el('button.bahce-saksi', { type: 'button', role: 'listitem', data: { id: s.id }, 'aria-label': b ? bitkiAdi(b) + ', ' + ASAMA_AD[b.asama] : 'Boş saksı, çiçek ek', 'aria-pressed': String(secili === s.id) });
      d.style.setProperty('--gecikme', (-(i * 0.7) % 4).toFixed(1) + 's');
      d.append(
        ctx.el('span.bahce-bitki', { html: saksiTamSvg(b && b.tur, b && b.renk, b ? b.asama : 0, -(i * .7) % 4) }),
        ctx.el('span.bahce-isaret', { 'aria-hidden': 'true' }),
        ctx.el('span.bahce-etiket', b ? bitkiAdi(b) : 'Ek'),
        ctx.el('span.balon.bahce-balon', { 'aria-hidden': 'true' })
      );
      d.dataset.asama = b ? b.asama : '';
      d.addEventListener('click', e => saksiTikla(s, e));
      if (secili === s.id) d.classList.add('secili');
      ui.saksilar.appendChild(d);
    });
    isaretleriGuncelle();
  }
  function saksiEl(id) { return ui.saksilar ? ui.saksilar.querySelector('.bahce-saksi[data-id="' + id + '"]') : null; }
  function saksiYenile(s) {
    const d = saksiEl(s.id); if (!d) return;
    const b = s.bitki; const i = durum.saksilar.indexOf(s);
    d.querySelector('.bahce-bitki').innerHTML = saksiTamSvg(b && b.tur, b && b.renk, b ? b.asama : 0, -(i * .7) % 4);
    d.querySelector('.bahce-etiket').textContent = b ? bitkiAdi(b) : 'Ek';
    d.setAttribute('aria-label', b ? bitkiAdi(b) + ', ' + ASAMA_AD[b.asama] : 'Boş saksı, çiçek ek');
    d.dataset.asama = b ? b.asama : '';
  }
  function isaretleriGuncelle() {
    durum.saksilar.forEach(s => {
      const d = saksiEl(s.id); if (!d) return; const b = s.bitki; const is = d.querySelector('.bahce-isaret');
      let m = '';
      if (b) { if (b.asama === 3 && !b.kesildi) m = '✨'; else if (b.su < 20) m = '💧'; else if (b.gunes < 15) m = '☀️'; }
      if (is.textContent !== m) is.textContent = m;
      d.classList.toggle('susuz', !!(b && b.su <= 0 && b.asama < 3));
    });
  }
  function balon(id, metin, ms) {
    const d = saksiEl(id); if (!d) return; const bl = d.querySelector('.bahce-balon'); if (!bl) return;
    bl.textContent = metin; bl.classList.add('goster');
    clearTimeout(bl._t); bl._t = setTimeout(() => bl.classList.remove('goster'), ms || 2600);
  }

  /* --- sekmeler --- */
  function sekmeAc(id, ilk) {
    sekme = id;
    ui.sekmeler.querySelectorAll('.cip').forEach(c => c.setAttribute('aria-selected', String(c.dataset.sekme === id)));
    ui.govde.innerHTML = '';
    ui.sahne.hidden = id !== 'bahce';
    if (!ilk) ctx.ses.tik();
    if (id === 'bahce') { kartCiz(); altbarKur(); }
    else if (id === 'buket') { buketCiz(); }
    else { defterCiz(); ctx.altbar(null); }
  }

  /* --- seçili bitki kartı --- */
  function kartCiz() {
    const el = ctx.el; ui.govde.innerHTML = '';
    const s = durum.saksilar.find(x => x.id === secili);
    const b = s && s.bitki;
    const ozet = durum.saksilar.filter(x => x.bitki).length;
    if (!s) {
      ui.govde.appendChild(el('div.yama.bos-durum.bahce-kart', [el('div.buyuk', ozet ? '🌷' : '🌱'), el('p', ozet ? 'Bir saksıya dokun; birlikte bakalım.' : 'Bahçe boş; ilk tohumu sen at. Boş bir saksıya dokun.')]));
      return;
    }
    if (!b) {
      ui.govde.appendChild(el('div.yama.bos-durum.bahce-kart', [el('div.buyuk', '🪴'), el('p', 'Bu saksı boş. Hangi çiçeği ekelim?'), el('button.dugme', { type: 'button', onclick: () => katalogAc(s) }, '🌱 Çiçek seç')]));
      return;
    }
    const T = TUR[b.tur];
    const kart = el('div.yama.bahce-kart', [
      el('div.satir.arasi.bahce-kart-ust', [
        el('div.satir', [el('span.bahce-kart-ikon', { html: b.asama === 3 ? basSvg(b.tur, b.renk, 44) : '<span class="bahce-kart-emoji">' + ASAMA_EMOJI[b.asama] + '</span>' }), el('div', [el('h2.baslik.baslik-lg', bitkiAdi(b)), el('div.sessiz', T.sever)])]),
        el('span.rozet' + (b.asama === 3 ? '.inci' : b.asama === 2 ? '' : '.goz'), ASAMA_AD[b.asama])
      ]),
      ui.kartBalon = el('p.bahce-kart-soz', { 'aria-live': 'polite' }, ''),
      ui.barlar = el('div.dikey.bahce-barlar'),
      el('div.satir.arasi.bahce-kart-alt', [
        ui.kalan = el('span.sessiz.sayi', ''),
        el('div.satir.bahce-kart-eylemler', [
          susuzlar().length >= 2 ? el('button.dugme-ikincil.kucuk', { type: 'button', onclick: hepsiniSula }, '💧 Hepsini sula') : null,
          el('button.dugme-hayalet.kucuk', { type: 'button', onclick: () => sok(s) }, 'Saksıyı boşalt')
        ])
      ])
    ]);
    ui.govde.appendChild(kart);
    barlariGuncelle();
  }
  function barYap(ikon, ad, deger, renk) {
    const yuzde = Math.round(deger);
    const bar = ctx.el('div.bar', { 'aria-label': ad + ' %' + yuzde }, [ctx.el('span.bar-ikon', ikon), ctx.el('span.bar-yol', [ctx.el('span.bar-dolu', { stil: { width: yuzde + '%', display: 'block' } })]), ctx.el('span.bar-yuzde', yuzde + '%')]);
    bar.querySelector('.bar-dolu').style.setProperty('--bar-renk', renk);
    return bar;
  }
  function barlariGuncelle() {
    if (!ui.barlar) return;
    const s = durum.saksilar.find(x => x.id === secili); const b = s && s.bitki; if (!b) return;
    ui.barlar.innerHTML = '';
    ui.barlar.append(
      barYap('🌸', 'Büyüme', b.buyume, 'var(--seker-kiraz)'),
      barYap('💧', 'Su', b.su, 'var(--seker-gok)'),
      barYap('☀️', 'Güneş', b.gunes, 'var(--seker-limon)'),
      barYap('🌱', 'Gübre', b.gubre, 'var(--seker-yaprak)'),
      barYap('💗', 'Sevgi', b.sevgi, 'var(--burun)')
    );
    if (ui.kalan) {
      if (b.asama === 3) ui.kalan.textContent = b.acildi ? 'Açtı: ' + CD.tarihYaz(new Date(b.acildi).toISOString().slice(0, 10)) : 'Açtı';
      else if (b.su <= 0) ui.kalan.textContent = 'Büyüme durdu: su bekliyor 💧';
      else ui.kalan.textContent = ASAMA_AD[b.asama + 1] + ' için ' + sureYaz(kalanSaat(b));
    }
  }
  function kartSoz(metin) { if (ui.kartBalon) ui.kartBalon.textContent = metin; }

  /* --- alt çubuk --- */
  function altbarKur() {
    const s = durum.saksilar.find(x => x.id === secili); const b = s && s.bitki;
    if (!s) { ctx.altbar([{ id: 'ilk', ad: 'Boş saksı', ikon: '🪴', birincil: true, tikla() { const bos = durum.saksilar.find(x => !x.bitki); if (bos) { sec(bos.id); katalogAc(bos); } else ctx.toast('Tüm saksılar dolu; bir çiçek açınca yenisi gelir.'); } }]); return; }
    if (!b) { ctx.altbar([{ id: 'ek', ad: 'Çiçek ek', ikon: '🌱', birincil: true, tikla() { katalogAc(s); } }]); return; }
    const acti = b.asama === 3;
    ctx.altbar([
      { id: 'sula', ad: 'Sula', ikon: '💧', birincil: true, tikla(e) { bakim('sula', s, e); } },
      { id: 'gunes', ad: 'Güneş', ikon: '☀️', tikla(e) { bakim('gunes', s, e); } },
      { id: 'gubre', ad: 'Gübre', ikon: '🌱', tikla(e) { bakim('gubre', s, e); } },
      { id: 'buda', ad: acti ? 'Kes' : 'Buda', ikon: '✂️', tikla(e) { bakim(acti ? 'kes' : 'buda', s, e); } },
      { id: 'konus', ad: 'Konuş', ikon: '💬', tikla(e) { konusAc(s); } }
    ]);
  }

  /* --- seçim / dokunma --- */
  function sec(id) {
    secili = id;
    ui.saksilar.querySelectorAll('.bahce-saksi').forEach(d => { const a = d.dataset.id === id; d.classList.toggle('secili', a); d.setAttribute('aria-pressed', String(a)); });
    if (sekme === 'bahce') { kartCiz(); altbarKur(); }
  }
  function saksiTikla(s, e) {
    const b = s.bitki;
    ctx.ses.pit();
    if (secili !== s.id) { sec(s.id); if (!b) { katalogAc(s); return; } }
    else if (!b) { katalogAc(s); return; }
    // dokunuş tepkisi
    const m = ctx.efekt.merkez(e.currentTarget);
    if (b) {
      let havuz = SOZ.genel.concat(SOZ.aile[TUR[b.tur].aile] || []);
      if (b.asama === 3) havuz = SOZ.acti.concat(havuz);
      if (b.su < 20 && b.asama < 3) havuz = SOZ.susuz;
      const soz = rast(havuz);
      balon(s.id, soz); kartSoz(soz);
      ctx.efekt.kalp(m.x, m.y - 20, 2);
      b.sevgi = Math.min(100, b.sevgi + 2); kaydet();
      e.currentTarget.classList.remove('zipla'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('zipla');
    }
  }

  /* --- bakım eylemleri --- */
  function bakim(tip, s, e) {
    const b = s.bitki; if (!b) return; const T = TUR[b.tur]; const simdi = Date.now();
    simule(b, simdi);
    const d = saksiEl(s.id); const m = d ? ctx.efekt.merkez(d) : { x: innerWidth / 2, y: innerHeight / 2 };
    let soz = '';
    if (tip === 'sula') {
      if (b.su >= 88) { ctx.ses.blop(); soz = rast(SOZ.sulaDolu); if (T.aile === 'kaktus') soz = 'Kaktüsüm haftada bir yudum ister.'; }
      else {
        ctx.ses.su(); ctx.efekt.emoji(m.x, m.y - 30, '💧', 4);
        b.su = Math.min(100, b.su + (T.aile === 'kaktus' ? 60 : 55)); b.buyume = Math.min(100, b.buyume + AYAR.BONUS.sula); b.sonSulama = simdi;
        durum.sayac.sulama++; soz = rast(SOZ.sula);
        if (d) { d.classList.remove('sallan'); void d.offsetWidth; d.classList.add('sallan'); }
      }
    } else if (tip === 'gunes') {
      ctx.ses.tink(); ctx.efekt.emoji(m.x, m.y - 40, '☀️', 2); ctx.efekt.yildiz(m.x, m.y - 30, 4);
      b.gunes = Math.min(100, b.gunes + 60); b.buyume = Math.min(100, b.buyume + AYAR.BONUS.gunes);
      soz = rast(T.isik === 'dolayli' ? SOZ.gunesDolayli : SOZ.gunes);
    } else if (tip === 'gubre') {
      const kalan = b.sonGubre ? AYAR.GUBRE_BEKLE_SAAT - (simdi - b.sonGubre) / 3600000 : 0;
      if (kalan > 0) { ctx.ses.hmpf(); soz = 'Toprağı dinlendirelim; ' + sureYaz(kalan).replace('~', '') + ' sonra yine.'; }
      else { ctx.ses.blop(); ctx.efekt.toz(m.x, m.y + 20, 5); b.gubre = 100; b.buyume = Math.min(100, b.buyume + AYAR.BONUS.gubre); b.sonGubre = simdi; soz = rast(SOZ.gubre); }
    } else if (tip === 'buda') {
      const kalan = b.sonBudama ? AYAR.BUDAMA_BEKLE_SAAT - (simdi - b.sonBudama) / 3600000 : 0;
      if (b.asama === 0) { ctx.ses.hmpf(); soz = 'Daha filiz yok; önce sabır.'; }
      else if (kalan > 0) { ctx.ses.hmpf(); soz = 'Şimdilik kuru yaprak yok; ' + sureYaz(kalan).replace('~', '') + ' sonra bak.'; }
      else { ctx.ses.slip(); ctx.efekt.emoji(m.x, m.y - 10, '🍃', 3); b.buyume = Math.min(100, b.buyume + AYAR.BONUS.buda); b.sevgi = Math.min(100, b.sevgi + 8); b.sonBudama = simdi; soz = rast(SOZ.buda); }
    } else if (tip === 'kes') {
      if (b.asama < 3) return;
      ctx.ses.slip(); bekle(() => ctx.ses.parilti(), 160); ctx.efekt.emoji(m.x, m.y - 30, '🌸', 3);
      durum.vazo.unshift({ id: CD.kimlik(), tur: b.tur, renk: b.renk, tarih: CD.bugun() });
      if (durum.vazo.length > AYAR.VAZO_MAKS) durum.vazo.length = AYAR.VAZO_MAKS;
      b.asama = 1; b.buyume = AYAR.ESIK[1] + 6; b.acildi = null; b.kutlandi = false; b.kesildi = false; b.kesim = (b.kesim || 0) + 1;
      soz = rast(SOZ.kes); saksiYenile(s); ctx.toast('Vazoya kondu; buket için hazır 💐');
      if (d) { d.classList.remove('sallan'); void d.offsetWidth; d.classList.add('sallan'); }
    }
    const olaylar = []; asamaGuncelle(b, olaylar);
    balon(s.id, soz); kartSoz(soz);
    olaylariIsle(s, olaylar);
    if (tip === 'kes' && sekme === 'bahce' && secili === s.id) { kartCiz(); kartSoz(soz); }
    barlariGuncelle(); isaretleriGuncelle(); altbarKur(); rozetKontrol(); kaydet(tip === 'kes');
  }
  function susuzlar() { return durum.saksilar.filter(x => x.bitki && x.bitki.asama < 3 && x.bitki.su < 60); }
  function hepsiniSula() {
    const liste = susuzlar();
    if (!liste.length) { ctx.ses.blop(); ctx.toast('Herkes doymuş; şimdilik su gerekmiyor.'); return; }
    const simdi = Date.now(); ctx.ses.su();
    liste.forEach((s, i) => {
      const b = s.bitki; simule(b, simdi); const T = TUR[b.tur];
      b.su = Math.min(100, b.su + (T.aile === 'kaktus' ? 60 : 55)); b.buyume = Math.min(100, b.buyume + AYAR.BONUS.sula); b.sonSulama = simdi; durum.sayac.sulama++;
      const d = saksiEl(s.id);
      if (d) { const m = ctx.efekt.merkez(d); bekle(() => { ctx.efekt.emoji(m.x, m.y - 30, '💧', 3); d.classList.remove('sallan'); void d.offsetWidth; d.classList.add('sallan'); }, i * 140); }
      const olaylar = []; asamaGuncelle(b, olaylar); olaylariIsle(s, olaylar);
    });
    ctx.toast(liste.length + ' çiçek kana kana içti 💧');
    if (sekme === 'bahce') { kartCiz(); altbarKur(); }
    isaretleriGuncelle(); rozetKontrol(); kaydet(true);
  }
  function konusAc(s) {
    const b = s.bitki; if (!b) return;
    const el = ctx.el; const T = TUR[b.tur];
    const kutu = el('div.dikey.bahce-konus', [
      el('p.sessiz', bitkiAdi(b) + ' seni dinliyor. Ne söylemek istersin?'),
      el('div.bahce-konus-liste', SOZ.konus.map(k => el('button.dugme-ikincil.tam', { type: 'button', onclick: () => konus(s, k) }, k.m))),
      el('div.satir', [
        ui.konusGirdi = el('input.girdi', { type: 'text', maxlength: '60', placeholder: 'Kendi cümlen…', 'aria-label': 'Kendi cümlen' }),
        el('button.dugme.kucuk', { type: 'button', onclick: () => { const v = ui.konusGirdi.value.trim(); if (!v) { ui.konusGirdi.focus(); return; } konus(s, { m: v, c: SOZ.aile[T.aile].concat(['Bunu duymak çok güzel.', 'Sen söyleyince inanıyorum.', 'Yaprağım titredi.']) }); } }, 'Söyle')
      ])
    ]);
    ctx.sheet(kutu, { baslik: '💬 ' + bitkiAdi(b) + ' ile konuş', odak: false });
  }
  function konus(s, k) {
    const b = s.bitki; if (!b) return; const simdi = Date.now();
    ctx.sheetKapat(); ctx.ses.pop();
    const d = saksiEl(s.id); if (d) { const m = ctx.efekt.merkez(d); ctx.efekt.kalp(m.x, m.y - 30, 5); }
    const gecti = !b.sonKonusma || (simdi - b.sonKonusma) > AYAR.KONUSMA_BEKLE_DK * 60000;
    if (gecti) { b.sevgi = Math.min(100, b.sevgi + 35); b.buyume = Math.min(100, b.buyume + AYAR.BONUS.konus); b.sonKonusma = simdi; }
    else b.sevgi = Math.min(100, b.sevgi + 4);
    durum.sayac.konusma++;
    const cevap = rast(k.c);
    balon(s.id, cevap, 3200); kartSoz('Sen: "' + k.m + '" — ' + cevap);
    const olaylar = []; asamaGuncelle(b, olaylar); olaylariIsle(s, olaylar);
    barlariGuncelle(); rozetKontrol(); kaydet();
  }
  async function sok(s) {
    const b = s.bitki; if (!b) return;
    const ok = await ctx.onayla(bitkiAdi(b) + ' saksıdan çıksın mı? Tohumu yeniden ekebilirsin.', 'Boşalt', 'Kalsın');
    if (!ok) return;
    ctx.ses.uf(); s.bitki = null; saksiYenile(s); isaretleriGuncelle(); kartCiz(); altbarKur(); kaydet(true);
    ctx.toast('Saksı boşaldı; yeni bir tohum bekliyor.');
  }

  /* --- katalog --- */
  function katalogAc(s) {
    const el = ctx.el; let secTur = 'lilyum', secRenk = 'pembe';
    const onizle = el('div.bahce-katalog-onizle', { 'aria-hidden': 'true' });
    const renkKutu = el('div.ornekler.bahce-katalog-renkler', { role: 'radiogroup', 'aria-label': 'Renk' });
    const bilgi = el('p.sessiz.bahce-katalog-bilgi');
    const ad = el('div.baslik.baslik-lg');
    const ekDugme = el('button.dugme.tam', { type: 'button', onclick: () => { ek(s, secTur, secRenk); } }, '🌱 Ek');
    function guncelle() {
      const T = TUR[secTur]; if (!T.renkler[secRenk]) secRenk = Object.keys(T.renkler)[0];
      onizle.innerHTML = saksiTamSvg(secTur, secRenk, 3, 0);
      ad.textContent = (Object.keys(T.renkler).length > 1 ? T.renkler[secRenk].ad + ' ' : '') + T.ad;
      bilgi.textContent = 'Sever: ' + T.sever + '. Sevmez: ' + T.sevmez + '. ' + T.bilgi;
      renkKutu.innerHTML = '';
      Object.keys(T.renkler).forEach(rid => {
        const r = T.renkler[rid];
        const o = el('button.ornek' + (rid === secRenk ? '.secili' : ''), { type: 'button', role: 'radio', 'aria-checked': String(rid === secRenk), 'aria-label': r.ad, onclick: () => { secRenk = rid; ctx.ses.tik(); guncelle(); } });
        o.style.setProperty('--renk', r.stargazer ? 'linear-gradient(135deg,' + r.acik + ',' + r.ana + ')' : r.ana);
        renkKutu.appendChild(o);
      });
      liste.querySelectorAll('.bahce-katalog-tur').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tur === secTur)));
      ekDugme.textContent = '🌱 ' + ad.textContent + ' ek';
    }
    const liste = el('div.bahce-katalog-liste', TUR_SIRA.map(tid => {
      const T = TUR[tid]; const ilk = Object.keys(T.renkler)[0];
      return el('button.bahce-katalog-tur', { type: 'button', data: { tur: tid }, 'aria-selected': 'false', onclick: () => { secTur = tid; ctx.ses.tik(); guncelle(); } }, [el('span.bahce-katalog-tur-ikon', { html: basSvg(tid, ilk, 40) }), el('span', T.ad)]);
    }));
    const kutu = el('div.dikey.bahce-katalog', [
      liste,
      el('div.bahce-katalog-sec', [onizle, el('div.dikey.bahce-katalog-sag', [ad, renkKutu, bilgi])]),
      el('div.satir', [el('button.dugme-ikincil', { type: 'button', onclick: () => { secTur = rast(TUR_SIRA); const rl = Object.keys(TUR[secTur].renkler); secRenk = rast(rl); ctx.ses.pop(); guncelle(); } }, '🎲 Sürpriz'), ekDugme])
    ]);
    guncelle();
    ctx.sheet(kutu, { baslik: '🌷 Hangi çiçeği ekelim?', odak: false });
  }
  function ek(s, tur, renk) {
    if (s.bitki) return;
    const simdi = Date.now();
    s.bitki = { tur, renk, ekim: simdi, guncel: simdi, buyume: 0, asama: 0, su: 45, gunes: 50, gubre: 30, sevgi: 40, acildi: null, kutlandi: false, kesim: 0 };
    durum.sayac.ekilen++;
    ctx.sheetKapat(); ctx.ses.blop();
    saksiYenile(s); sec(s.id);
    const d = saksiEl(s.id); if (d) { const m = ctx.efekt.merkez(d); ctx.efekt.toz(m.x, m.y + 10, 6); bekle(() => ctx.efekt.yildiz(m.x, m.y - 10, 4), 200); }
    const soz = rast(SOZ.ek); balon(s.id, soz); kartSoz(soz);
    ctx.toast(bitkiAdi(s.bitki) + ' ekildi. Şimdi biraz su ister 💧');
    rozetKontrol(); kaydet(true);
  }

  /* --- aşama olayları / kutlama --- */
  function olaylariIsle(s, olaylar) {
    if (!olaylar.length) return;
    const b = s.bitki; if (!b) return;
    saksiYenile(s);
    const d = saksiEl(s.id); const m = d ? ctx.efekt.merkez(d) : null;
    olaylar.forEach((a, i) => bekle(() => {
      if (!ctx || !s.bitki) return;
      if (a === 1) { durum.sayac.filiz++; ctx.ses.hop(); if (m) ctx.efekt.toz(m.x, m.y + 6, 5); balon(s.id, 'Filiz verdim! 🌱'); ctx.toast(bitkiAdi(b) + ' filiz verdi 🌱'); }
      else if (a === 2) { ctx.ses.parilti(); if (m) ctx.efekt.yildiz(m.x, m.y - 10, 6); balon(s.id, 'Tomurcuğum çıktı ✨'); ctx.toast(bitkiAdi(b) + ' tomurcuklandı ✨'); }
      else if (a === 3) kutla(s);
      if (secili === s.id && sekme === 'bahce') { kartCiz(); altbarKur(); }
      rozetKontrol(); kaydet();
    }, i * 700));
  }
  function kutla(s) {
    const b = s.bitki; if (!b || b.kutlandi) return;
    b.kutlandi = true;
    durum.sayac.acan++; durum.sayac.acanRenk[b.tur + ':' + b.renk] = (durum.sayac.acanRenk[b.tur + ':' + b.renk] || 0) + 1;
    const d = saksiEl(s.id);
    ctx.ses.isilti();
    if (d) {
      const m = ctx.efekt.merkez(d);
      d.classList.remove('acti'); void d.offsetWidth; d.classList.add('acti');
      ctx.efekt.konfeti(m.x, m.y - 20, 16); bekle(() => ctx.efekt.yildiz(m.x, m.y - 30, 8), 250);
      bekle(() => ziyaretci(s), 900);
    }
    balon(s.id, rast(SOZ.acti), 3600);
    ctx.toast('🌸 ' + bitkiAdi(b) + ' açtı! Bak ne güzel, Cemre.', 3200);
    // yeni saksı
    if (durum.saksilar.length < AYAR.MAKS_SAKSI && durum.saksilar.length < AYAR.BASLANGIC_SAKSI + durum.sayac.acan) {
      durum.saksilar.push({ id: 's' + CD.kimlik(), bitki: null });
      bekle(() => { if (!ctx) return; saksilariCiz(); ctx.toast('Yeni bir saksı geldi 🪴'); ctx.ses.pop(); }, 1800);
    }
    kaydet(true);
  }

  /* --- kelebek / arı ziyareti --- */
  let ziyaretT = 0;
  function ziyaretPlanla() {
    clearTimeout(ziyaretT); zamanlar.delete(ziyaretT);
    const sn = AYAR.ZIYARET_MIN_S + Math.random() * (AYAR.ZIYARET_MAKS_S - AYAR.ZIYARET_MIN_S);
    ziyaretT = bekle(() => { const acanlar = durum.saksilar.filter(x => x.bitki && x.bitki.asama === 3); if (acanlar.length && sekme === 'bahce' && document.visibilityState === 'visible') ziyaretci(rast(acanlar)); ziyaretPlanla(); }, sn * 1000);
  }
  function ziyaretci(s) {
    if (ctx.azHareket || !ui.ziyaret || ui.sahne.hidden) return;
    if (ui.ziyaret.children.length >= 2) return;
    const d = saksiEl(s.id); if (!d) return;
    const T = TUR[s.bitki.tur];
    const ari = ['aycicegi', 'lavanta', 'papatya'].indexOf(T.aile) >= 0 && Math.random() < .6;
    const renkler = [['#F7A1C4', '#B85C86'], ['#A9D6F2', '#5E86A6'], ['#FFD98A', '#C9962E'], ['#CDBDF6', '#7A5CC4'], ['#FFB3C7', '#C55A84']];
    const rk = rast(renkler);
    const z = ctx.el('button.bahce-ziyaretci' + (ari ? '.ari' : ''), { type: 'button', 'aria-label': ari ? 'Arı' : 'Kelebek', html: ari ? ariSvg() : kelebekSvg(rk[0], rk[1]) });
    const sr = ui.sahne.getBoundingClientRect(), dr = d.querySelector('.bahce-bitki').getBoundingClientRect();
    const soldan = Math.random() < .5;
    const hedefX = dr.left - sr.left + dr.width / 2 - 18, hedefY = dr.top - sr.top + dr.height * .22;
    z.style.left = (soldan ? -50 : sr.width + 20) + 'px'; z.style.top = (30 + Math.random() * 60) + 'px';
    z.addEventListener('click', e => {
      ctx.ses.tink(); ctx.efekt.yildiz(e.clientX, e.clientY, 6);
      durum.sayac.kelebek++; rozetKontrol(); kaydet(true);
      ctx.toast(ari ? 'Arı vızıldadı: "güzel bahçe!" 🐝' : 'Kelebek kanadını salladı 🦋');
      z.classList.add('ucuyor'); z.style.left = (soldan ? sr.width + 40 : -60) + 'px'; z.style.top = '-30px';
      bekle(() => z.remove(), 2600);
    });
    ui.ziyaret.appendChild(z);
    if (ari) ctx.ses.vizilti();
    requestAnimationFrame(() => requestAnimationFrame(() => { z.classList.add('ucuyor'); z.style.left = hedefX + 'px'; z.style.top = hedefY + 'px'; }));
    bekle(() => { if (z.isConnected) { z.classList.add('kondu'); } }, 2900);
    bekle(() => { if (!z.isConnected) return; z.classList.remove('kondu'); z.style.left = (soldan ? sr.width + 40 : -60) + 'px'; z.style.top = (10 + Math.random() * 40) + 'px'; bekle(() => z.remove(), 2800); }, 7400);
  }

  /* --- rozetler --- */
  const ROZETLER = [
    { id: 'ilkTohum', ad: 'İlk tohum', ikon: '🌱', aciklama: 'Bir tohum ektin', kosul: c => c.ekilen >= 1 },
    { id: 'ilkFiliz', ad: 'İlk filiz', ikon: '🌿', aciklama: 'Bir tohum filiz verdi', kosul: c => c.filiz >= 1 },
    { id: 'ilkCicek', ad: 'İlk çiçek', ikon: '🌸', aciklama: 'İlk çiçeğin açtı', kosul: c => c.acan >= 1 },
    { id: 'besCicek', ad: 'Beş çiçek', ikon: '💐', aciklama: 'Beş çiçek açtırdın', kosul: c => c.acan >= 5 },
    { id: 'onCicek', ad: 'Çiçekçi', ikon: '🏡', aciklama: 'On çiçek açtırdın', kosul: c => c.acan >= 10 },
    { id: 'lilyum', ad: 'Lilyum ustası', ikon: '🌺', aciklama: 'Beş lilyum rengi de açtı', kosul: c => Object.keys(TUR.lilyum.renkler).every(r => c.acanRenk['lilyum:' + r]) },
    { id: 'gul', ad: 'Gül bahçesi', ikon: '🌹', aciklama: 'Altı gül rengi de açtı', kosul: c => Object.keys(TUR.gul.renkler).every(r => c.acanRenk['gul:' + r]) },
    { id: 'buket', ad: 'İlk buket', ikon: '🎀', aciklama: 'Bir buket bağladın', kosul: c => c.buket >= 1 },
    { id: 'kelebek', ad: 'Kelebek dostu', ikon: '🦋', aciklama: 'Beş ziyaretçiye dokundun', kosul: c => c.kelebek >= 5 },
    { id: 'sohbet', ad: 'Çiçek fısıltısı', ikon: '💬', aciklama: 'Çiçeklerle 20 kez konuştun', kosul: c => c.konusma >= 20 },
    { id: 'su', ad: 'Su perisi', ikon: '💧', aciklama: '30 kez suladın', kosul: c => c.sulama >= 30 },
    { id: 'kaktus', ad: 'Sabır taşı', ikon: '🌵', aciklama: 'Kaktüsün çiçek açtı', kosul: c => !!c.acanRenk['kaktus:pembe'] }
  ];
  function rozetKontrol() {
    ROZETLER.forEach((r, i) => {
      if (durum.rozetler.indexOf(r.id) >= 0) return;
      let ok = false; try { ok = r.kosul(durum.sayac); } catch (e) { ok = false; }
      if (!ok) return;
      durum.rozetler.push(r.id);
      bekle(() => { if (!ctx) return; ctx.ses.zafer(); ctx.efekt.konfeti(null, null, 12); ctx.toast('Rozet kazandın: ' + r.ikon + ' ' + r.ad, 3000); }, 600 + i * 200);
    });
  }

  /* --- vazo & buket --- */
  function buketCiz() {
    const el = ctx.el; ui.govde.innerHTML = '';
    buketSecim = buketSecim.filter(id => durum.vazo.some(v => v.id === id));
    const vazoKart = el('div.yama.bahce-vazo', [el('h2.baslik.baslik-lg', '🏺 Vazo'), el('p.sessiz', 'Açan bir çiçeği ✂️ Kes ile buraya alırsın. Bukete koymak için dokun (' + AYAR.BUKET_MIN + '–' + AYAR.BUKET_MAX + ' çiçek).')]);
    if (!durum.vazo.length) vazoKart.appendChild(el('div.bos-durum', [el('div.buyuk', '🏺'), el('p', 'Vazo şimdilik boş. Bahçende bir çiçek açınca burası dolar.')]));
    else {
      ui.vazoListe = el('div.bahce-vazo-liste', { role: 'list' });
      durum.vazo.forEach(v => {
        const b = { tur: v.tur, renk: v.renk };
        const secildi = buketSecim.indexOf(v.id) >= 0;
        const d = el('button.bahce-vazo-cicek', { type: 'button', role: 'listitem', 'aria-pressed': String(secildi), 'aria-label': bitkiAdi(b), onclick: () => vazoSec(v.id) }, [el('span', { html: basSvg(v.tur, v.renk, 44) }), el('span.bahce-vazo-ad', bitkiAdi(b))]);
        if (secildi) d.classList.add('secili');
        ui.vazoListe.appendChild(d);
      });
      vazoKart.appendChild(ui.vazoListe);
    }
    const kagitKutu = el('div.ornekler', { role: 'radiogroup', 'aria-label': 'Kâğıt rengi' });
    Object.keys(KAGIT).forEach(kid => {
      const o = el('button.ornek' + (kid === buketKagit ? '.secili' : ''), { type: 'button', role: 'radio', 'aria-checked': String(kid === buketKagit), 'aria-label': KAGIT[kid].ad, onclick: () => { buketKagit = kid; ctx.ses.tik(); buketCiz(); } });
      o.style.setProperty('--renk', KAGIT[kid].ana); kagitKutu.appendChild(o);
    });
    ui.buketOnizle = el('div.bahce-buket-onizle', { 'aria-label': 'Buket önizleme' });
    const buketKart = el('div.yama.bahce-buket', [
      el('h2.baslik.baslik-lg', '💐 Buket'),
      ui.buketOnizle,
      el('label.etiket', { for: 'bahceBuketAd' }, 'Buketin adı'),
      ui.buketAd = el('input.girdi#bahceBuketAd', { type: 'text', maxlength: '40', placeholder: 'Örn. Pazar sabahı', value: buketAd, oninput: e => { buketAd = e.target.value; } }),
      el('label.etiket', 'Kâğıt'), kagitKutu
    ]);
    ui.govde.append(vazoKart, buketKart);
    if (durum.buketler.length) {
      const liste = el('div.bahce-buket-liste');
      durum.buketler.forEach(bk => {
        liste.appendChild(el('div.bahce-buket-kayit', [
          el('div.bahce-buket-kucuk', { html: buketSvg(bk.cicekler, bk.kagit), 'aria-hidden': 'true' }),
          el('div.dikey.bahce-buket-kayit-metin', [el('div.kalin', bk.ad || 'Buket'), el('div.sessiz', bk.cicekler.length + ' çiçek · ' + CD.tarihYaz(bk.tarih)),
            el('div.satir', [el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => pngPaylas(bk.cicekler, bk.kagit, bk.ad) }, '📷 Paylaş'), el('button.dugme-hayalet.kucuk', { type: 'button', onclick: async () => { if (await ctx.onayla('Bu buket silinsin mi?', 'Sil', 'Kalsın')) { durum.buketler = durum.buketler.filter(x => x.id !== bk.id); kaydet(true); buketCiz(); } } }, 'Sil')])])
        ]));
      });
      ui.govde.appendChild(el('div.yama.bahce-buketler', [el('h2.baslik.baslik-lg', '🎀 Bağladığın buketler'), liste]));
    }
    buketOnizleGuncelle();
    ctx.altbar([
      { id: 'kaydet', ad: 'Kaydet', ikon: '🎀', birincil: true, tikla() { buketKaydet(); } },
      { id: 'paylas', ad: 'Paylaş', ikon: '📷', tikla() { const c = secimCicekler(); if (c.length < AYAR.BUKET_MIN) { ctx.toast('Önce vazodan en az ' + AYAR.BUKET_MIN + ' çiçek seç.'); return; } pngPaylas(c, buketKagit, buketAd); } },
      { id: 'temizle', ad: 'Boşalt', ikon: '🧹', tikla() { buketSecim = []; ctx.ses.tik(); buketCiz(); } }
    ]);
  }
  function secimCicekler() { return buketSecim.map(id => durum.vazo.find(v => v.id === id)).filter(Boolean).map(v => ({ tur: v.tur, renk: v.renk })); }
  function vazoSec(id) {
    const i = buketSecim.indexOf(id);
    if (i >= 0) { buketSecim.splice(i, 1); ctx.ses.tik(); }
    else { if (buketSecim.length >= AYAR.BUKET_MAX) { ctx.toast('Buket doldu; en fazla ' + AYAR.BUKET_MAX + ' çiçek.'); ctx.ses.hmpf(); return; } buketSecim.push(id); ctx.ses.pop(); }
    ui.vazoListe.querySelectorAll('.bahce-vazo-cicek').forEach((d, j) => { const v = durum.vazo[j]; const s = v && buketSecim.indexOf(v.id) >= 0; d.classList.toggle('secili', s); d.setAttribute('aria-pressed', String(s)); });
    buketOnizleGuncelle();
  }
  function buketOnizleGuncelle() {
    if (!ui.buketOnizle) return;
    const c = secimCicekler();
    if (!c.length) { ui.buketOnizle.innerHTML = '<div class="bos-durum"><div class="buyuk">🎀</div><p>Vazodan çiçek seç; buket burada bağlanır.</p></div>'; return; }
    ui.buketOnizle.innerHTML = buketSvg(c, buketKagit);
    if (c.length < AYAR.BUKET_MIN) ui.buketOnizle.insertAdjacentHTML('beforeend', '<p class="sessiz orta">' + (AYAR.BUKET_MIN - c.length) + ' çiçek daha seçince bağlayabilirsin.</p>');
  }
  function buketKaydet() {
    const c = secimCicekler();
    if (c.length < AYAR.BUKET_MIN) { ctx.toast('En az ' + AYAR.BUKET_MIN + ' çiçek seç; buket öyle tutar.'); ctx.ses.hmpf(); return; }
    const ad = (buketAd || '').trim() || ('Buket ' + (durum.buketler.length + 1));
    durum.buketler.unshift({ id: CD.kimlik(), ad, kagit: buketKagit, cicekler: c, tarih: CD.bugun() });
    if (durum.buketler.length > 20) durum.buketler.length = 20;
    durum.sayac.buket++; ctx.ses.parilti(); ctx.efekt.konfeti(null, null, 14);
    ctx.toast('"' + ad + '" bağlandı 🎀');
    buketSecim = []; buketAd = ''; rozetKontrol(); kaydet(true); buketCiz();
  }
  function pngPaylas(cicekler, kagitId, ad) {
    ctx.ses.tink();
    const W = 960, H = 1000; const kanvas = document.createElement('canvas'); kanvas.width = W; kanvas.height = H;
    const g = kanvas.getContext('2d');
    const stil = getComputedStyle(document.documentElement);
    const kagit = (stil.getPropertyValue('--kagit') || '#FFF9F3').trim(), murekkep = (stil.getPropertyValue('--murekkep') || '#3B3444').trim(), sessiz = (stil.getPropertyValue('--sessiz') || '#736C7E').trim();
    g.fillStyle = kagit; g.fillRect(0, 0, W, H);
    g.fillStyle = (KAGIT[kagitId] || KAGIT.pembe).ana; g.globalAlpha = .35; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 173) % W, (i * 251) % H, 18 + (i % 4) * 8, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1;
    const img = new Image();
    img.onload = () => {
      const iw = 780, ih = 780 * 262 / 320; g.drawImage(img, (W - iw) / 2, 170, iw, ih);
      g.fillStyle = murekkep; g.textAlign = 'center';
      g.font = '800 58px "Sour Gummy", "Nunito", "Segoe UI", sans-serif'; g.fillText((ad || 'Buket').slice(0, 30), W / 2, 110);
      g.fillStyle = sessiz; g.font = '600 30px "Nunito", "Segoe UI", sans-serif'; g.fillText('Cemre\'nin bahçesinden · ' + CD.tarihYaz(CD.bugun()), W / 2, H - 70);
      CD.pngPaylas(kanvas, 'buket-' + (ad || 'cemre').replace(/[^\wğüşöçıİĞÜŞÖÇ-]+/g, '-').toLowerCase() + '.png').catch(() => ctx.toast('Görsel şu an oluşmadı; bir daha dener misin?'));
    };
    img.onerror = () => ctx.toast('Görsel şu an oluşmadı; bir daha dener misin?');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buketSvg(cicekler, kagitId, 3));
  }

  /* --- defter: rozetler, sayılar, rehber --- */
  function defterCiz() {
    const el = ctx.el; ui.govde.innerHTML = '';
    const c = durum.sayac;
    const rozetler = el('div.bahce-rozetler', ROZETLER.map(r => {
      const var_ = durum.rozetler.indexOf(r.id) >= 0;
      return el('div.bahce-rozet' + (var_ ? '.kazanildi' : ''), { title: r.aciklama }, [el('span.bahce-rozet-ikon', r.ikon), el('span.bahce-rozet-ad', r.ad), el('span.sessiz', var_ ? 'kazanıldı' : r.aciklama)]);
    }));
    const sayilar = el('div.izgara-3.bahce-sayilar', [['🌱', c.ekilen, 'ekilen'], ['🌸', c.acan, 'açan'], ['💧', c.sulama, 'sulama'], ['💬', c.konusma, 'sohbet'], ['🦋', c.kelebek, 'ziyaretçi'], ['🎀', c.buket, 'buket']].map(x => el('div.bahce-sayi', [el('span.bahce-sayi-ikon', x[0]), el('span.baslik.baslik-xl.sayi', String(x[1])), el('span.sessiz', x[2])])));
    const rehber = el('div.dikey.bahce-rehber', TUR_SIRA.map(tid => {
      const T = TUR[tid]; const ilk = Object.keys(T.renkler)[0];
      return el('details.bahce-rehber-madde', [
        el('summary', [el('span', { html: basSvg(tid, ilk, 32), 'aria-hidden': 'true' }), el('span.kalin', T.ad), el('span.sessiz', Object.keys(T.renkler).length > 1 ? Object.keys(T.renkler).length + ' renk' : '')]),
        el('div.dikey.bahce-rehber-ic', [
          el('p', [el('span.kalin', 'Sever: '), T.sever + '.']), el('p', [el('span.kalin', 'Sevmez: '), T.sevmez + '.']), el('p.sessiz', T.bilgi),
          el('div.satir.sar', Object.keys(T.renkler).map(rid => el('span.rozet' + (c.acanRenk[tid + ':' + rid] ? '.inci' : '.gri'), (c.acanRenk[tid + ':' + rid] ? '✓ ' : '') + T.renkler[rid].ad)))
        ])
      ]);
    }));
    ui.govde.append(
      el('div.yama', [el('h2.baslik.baslik-lg', '🏅 Rozetler'), el('p.sessiz', durum.rozetler.length + ' / ' + ROZETLER.length + ' kazanıldı'), rozetler]),
      el('div.yama', [el('h2.baslik.baslik-lg', '🔢 Sayılar'), sayilar]),
      el('div.yama', [el('h2.baslik.baslik-lg', '📖 Çiçek rehberi'), el('p.sessiz', 'Her çiçeğin huyu ayrı; açtırdığın renkler işaretlenir.'), rehber]),
      el('p.sessiz.orta', 'Büyüme gerçek zamanla ilerler: iyi bakımla bir günde açar, ihmalde sadece bekler. Kimse solmaz.')
    );
  }

  /* --- döngü --- */
  function tik() {
    if (!ctx || !durum) return;
    const simdi = Date.now(); let degisti = false;
    durum.saksilar.forEach(s => {
      const b = s.bitki; if (!b) return;
      const olaylar = simule(b, simdi);
      if (olaylar.length) { degisti = true; olaylariIsle(s, olaylar); }
    });
    isaretleriGuncelle();
    if (sekme === 'bahce' && secili && (simdi % 5000 < AYAR.TIK_MS || degisti)) barlariGuncelle();
    if (degisti) kaydet(); else if (kirli === false && simdi % 30000 < AYAR.TIK_MS) kaydet();
  }
  function gorunurluk() { if (document.visibilityState === 'hidden') yazDepo(); else tik(); }

  /* ------------------------------------------------------------------ kayıt */
  CD.kaydet({
    id: ID, baslik: 'Botanik Bahçe',
    ikon: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 40h28l-4 18H22z" fill="#D98B6A" stroke="#B8674A" stroke-width="2" stroke-linejoin="round"/><rect x="14" y="34" width="36" height="8" rx="3" fill="#EBA88A" stroke="#B8674A" stroke-width="2"/><path d="M32 36V18" stroke="#4F9A5C" stroke-width="3" stroke-linecap="round"/><path d="M32 28c-6 0-10-4-10-8 6 0 10 3 10 8zM32 24c6 0 10-4 10-8-6 0-10 3-10 8z" fill="#6DB877"/><circle cx="32" cy="14" r="7" fill="#F5A3C7" stroke="#D9699C" stroke-width="2"/><circle cx="32" cy="14" r="2.5" fill="#F4D35E"/></svg>',
    tamEkran: false,
    mount(el, baglam) {
      ctx = baglam; kok = el; ui = {}; secili = null; sekme = 'bahce'; buketSecim = []; buketAd = '';
      durum = yukle();
      // uzaktayken olanlar
      const simdi = Date.now(); const bekleyen = [];
      durum.saksilar.forEach(s => { if (!s.bitki) return; const ol = simule(s.bitki, simdi); if (ol.length) bekleyen.push([s, ol]); else if (s.bitki.asama === 3 && !s.bitki.kutlandi) bekleyen.push([s, [3]]); });
      kur();
      const dolu = durum.saksilar.filter(s => s.bitki);
      if (dolu.length && !secili) sec(dolu[0].id);
      bekleyen.forEach((x, i) => bekle(() => olaylariIsle(x[0], x[1]), 600 + i * 900));
      if (!bekleyen.length) {
        const susuz = dolu.filter(s => s.bitki.su <= 0 && s.bitki.asama < 3).length;
        const uzun = simdi - (durum.sonGorulme || simdi) > 36 * 3600000;
        if (susuz) bekle(() => ctx && ctx.toast(susuz + ' çiçek seni bekliyordu; bir yudum su iyi gelir 💧'), 700);
        else if (uzun && dolu.length) bekle(() => ctx && ctx.toast('Çiçekler seni özlemiş; bir bakış at, hepsi seni bekliyor 🌷'), 700);
      }
      aralik = setInterval(tik, AYAR.TIK_MS);
      document.addEventListener('visibilitychange', gorunurluk);
      window.addEventListener('pagehide', yazDepo);
      abonelikler.push(ctx.olay.dinle('azHareket', () => { if (ui.ziyaret) ui.ziyaret.innerHTML = ''; }));
      ziyaretPlanla();
      kaydet(true);
    },
    unmount() {
      clearInterval(aralik); aralik = 0;
      clearTimeout(kaydetT); kaydetT = 0;
      zamanlar.forEach(t => clearTimeout(t)); zamanlar.clear(); ziyaretT = 0;
      document.removeEventListener('visibilitychange', gorunurluk);
      window.removeEventListener('pagehide', yazDepo);
      abonelikler.splice(0).forEach(fn => { try { fn(); } catch (e) {} });
      if (durum && ctx) yazDepo();
      ctx.ses.hepsiniDurdur();
      ui = {}; durum = null; secili = null; ctx = null; kok = null;
    }
  });
})();
