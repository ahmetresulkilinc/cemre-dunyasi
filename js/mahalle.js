/* mahalle.js — "Yokuş Mahalle" ana ekranı (V2 Faz 1 · FAZ1-TASARIM.md §1–§5, §8–§10, §12). Eski hub.js'in yerine.
   - #hub kimliği korunur (hub:acildi ve yönlendirme aynı); bölümler #/<id> ile açılır.
   - Teraslar yukarıdan aşağı: Gökyüzü (karşının ruh hali) · Meydan (Bizim Köşemiz + Mahalle Panosu) · evler · … · Öfke Odası en dipte.
   - Her terasın kaldırımı ayrı pet katmanı (yazının üstüne pet binmez). Karakterler, elçi, saklı not ipuçları burada.
   - Kayıtlı olmayan ya da YAPIM_ASAMASINDA listesindeki bölüm "iskeleli" görünür ve açılmaz. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const $ = (s, k) => (k || document).querySelector(s);
  const V = () => CD.varlik;
  const MAH = () => (CD.config && CD.config.MAHALLE) || {};
  const az = () => CD.azHareket;
  const adi = (k) => CD.kimAdi(k);

  /* ================================================================ binalar: açıklama + pixel çizim
     Izgara: her karakter = 2×2 mahalle pikseli (m-px). "." boş. Renk adları css/mahalle.css içinde --bd-<ad>.
     "@" ile başlayan adlar özel sınıftır (pencere gece yanar, kenar, topuz, buhar, duman, ampul, bayrak…). */
  const ACIKLAMA = {
    pittiksu: 'Okşa, oyna, fotoğraf ekle; mama ve kilo takibi.', barbie: 'Okşa, top at, fotoğraf ekle; mama ve tımar takibi.',
    tirnak: 'Şekil, renk, aurora krom, nail art.', petevi: 'Ayı, hayalet, tavşan ve arkadaşları tek evde.',
    angela: 'Konuş, tiz sesle tekrar etsin; giydir, besle, uyut.', panda: 'Mantı, boba, mochi… karnı şişene kadar.',
    bahce: 'Lilyum ve gül ek, sula, açmasını bekle.', ofke: 'Terliği kap, tabakları kır, sonra nefes al.',
    xox: 'İkimiz sırayla oynayalım; hamleni yap, sırası ona geçsin.', bizim: 'İkimize dair küçük şeyler.',
    safir: 'Safir için küçük, sakin bir köşe.'
  };
  const ORTAK = { P: '@pencere', o: '@topuz', Z: '@kenar' };
  const BINA = {
    pittiksu: { ad: 'Pıttıksu Evi', renk: { K: 'pt-kulak-dis', q: 'pt-kulak', C: 'pt-cati', D: 'pt-duvar', R: 'pt-kapi', k: 'pt-kedi' }, satir: [
      '...KK......KK...', '..KqqK....KqqK..', '..CCCCCCCCCCCC..', '.CCCCCCCCCCCCCC.', 'CCCCCCCCCCCCCCCC', '.DDDDDDDDDDDDDD.', '.DPPPPDDDDPPPPD.',
      '.DPkkPDDDDPPPPD.', '.DPPPPDDDDPPPPD.', '.DDDDDDRRDDDDDD.', '.DDDDDRRRRDDDDD.', '.DDDDDRRoRDDDDD.', '.DDDDDRRRRDDDDD.', 'ZZZZZZZZZZZZZZZZ'] },
    barbie: { ad: 'Barbie Kulübesi', renk: { C: 'bb-cati', D: 'bb-duvar', B: 'bb-kemik', K: 'bb-delik', y: '@goz', m: 'bb-kap' }, satir: [
      '.......CC.......', '......CCCC......', '.....CCCCCC.....', '....CCCCCCCC....', '...CCCCCCCCCC...', '..CCCCCCCCCCCC..', '...DDDDDDDDDD...',
      '...DDDBBBBDDD...', '...DDDDDDDDDD...', '...DDDKKKKDDD...', '...DDKyKKyKDD...', '...DDKKKKKKDD.mm', '...DDKKKKKKDD.mm', 'ZZZZZZZZZZZZZZZZ'] },
    tirnak: { ad: 'Tırnak Salonu', renk: { S: '@inci', q: 'tr-kapak', O: 'tr-oje', T: 'tr-tente', W: 'tr-serit', D: 'tr-duvar', R: 'tr-kapi', n: 'tr-tirnak' }, satir: [
      '..SSSqqSSSSSSS..', '..SSSOOSSSSSSS..', '.TWTWTWTWTWTWTW.', '.TTTTTTTTTTTTTT.', '.DDDDDDDDDDDDDD.', '.DPPPPPPDRRRRDD.', '.DPPPPPPDRRRRDD.',
      '.DPnnPPPDRRRRDD.', '.DPPPPPPDRRoRDD.', '.DPPPPPPDRRRRDD.', '.DDDDDDDDRRRRDD.', '.DDDDDDDDRRRRDD.', '.DDDDDDDDRRRRDD.', 'ZZZZZZZZZZZZZZZZ'] },
    petevi: { ad: 'Pet Evi', renk: { F: 'pe-bayrak', I: 'pe-direk', C: 'pe-cati', D: 'pe-duvar', a: 'pe-ayi', h: 'pe-hayalet', t: 'pe-tavsan', f: 'pe-flork', R: 'pe-kapi' }, satir: [
      '.......FF.......', '.......I........', '....CCCCCCCC....', '..CCCCCCCCCCCC..', '.CCCCCCCCCCCCCC.', '.DDDDDDDDDDDDDD.', '.DPPDPPDPPDPPDD.',
      '.DPaDPhDPtDPfDD.', '.DDDDDDDDDDDDDD.', '.DDDDDRRRRDDDDD.', '.DDDDRRRRRRDDDD.', '.DDDDRRRRRRDDDD.', '.DDDDRRoRRRDDDD.', 'ZZZZZZZZZZZZZZZZ'] },
    angela: { ad: "Angela'nın Evi", renk: { Y: 'an-yildiz', C: 'an-cati', D: 'an-duvar', B: 'an-balkon', R: 'an-kapi', g: 'an-saksi' }, satir: [
      '.......YY.......', '......YYYY......', '.......CC.......', '.....CCCCCC.....', '...CCCCCCCCCC...', '..CCCCCCCCCCCC..', '..DDDDDDDDDDDD..',
      '..DDDPPDDPPDDD..', '..DDDPPPPPPDgD..', '..BBBBBBBBBBBB..', '..DDDDDRRDDDDD..', '..DDDDRRRRDDDD..', '..DDDDRRoRDDDD..', 'ZZZZZZZZZZZZZZZZ'] },
    panda: { ad: 'Panda Lokantası', renk: { '~': '@buhar', S: 'pd-tabela', p: 'pd-goz', C: 'pd-cati', L: '@fener', D: 'pd-duvar', b: 'pd-kase', R: 'pd-kapi', J: 'pd-bambu' }, satir: [
      '.....~...~......', '...SSSSSSSSSS...', '...SSpSSSSpSS...', '.CCCCCCCCCCCCCC.', 'CCCCCCCCCCCCCCCC', '.LDDDDDDDDDDDDL.', '.LDPPPPDDRRRRDL.',
      '..DPPPPDDRRRRD..', '..DPbbPDDRRRRD..', '..DPPPPDDRRoRD..', '..DDDDDDDRRRRD..', '..JDJDJDJRRRRD..', '..JDJDJDJRRRRD..', 'ZZZZZZZZZZZZZZZZ'] },
    bahce: { ad: 'Bahçe', renk: { f: 'bh-yaprak', L: 'bh-lilyum', A: 'bh-kemer', r: 'bh-gul', G: 'bh-kova', g: 'bh-kova-koyu', '|': 'bh-sap', C: 'bh-cit', T: 'bh-toprak' }, satir: [
      '....fff.................GGGG........', '...fLLLf...............GgggG........', '....fff..........ArrA..GgggG..fff...', '.....|..........A....A..GG...fLLLf..',
      '.....|.........A......A..|....fff...', '.CCCCCCCCCCCCCA......ACCCCCCCC|CC..', '.C.C.C.C.C.C.CA........AC.C.C.C.C.C.', '.CCCCCCCCCCCCCA........ACCCCCCCCCCC.',
      '.TTTTTTTTTTTTT..........TTTTTTTTTTT.', 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'] },
    xox: { ad: 'Oyun Salonu', renk: { L: '@ampul', S: 'xo-tabela', X: 'xo-x', O: 'xo-o', D: 'xo-duvar', E: 'xo-cerceve', s: 'xo-ekran', x: 'xo-ekran-koyu', R: 'xo-kapi' }, satir: [
      '.LLLLLLLLLLLLLL.', '.LSSSSSSSSSSSSL.', '.LSSXSSOSSXSSSL.', '.LSSSSSSSSSSSSL.', '.LLLLLLLLLLLLLL.', '.DDDDDDDDDDDDDD.', '.DEEEEEDDRRRRDD.',
      '.DExsxEDDRRRRDD.', '.DEsxsEDDRRRRDD.', '.DExsxEDDRRoRDD.', '.DEEEEEDDRRRRDD.', '.DDDDDDDDRRRRDD.', '.DDDDDDDDRRRRDD.', 'ZZZZZZZZZZZZZZZZ'],
      ek: '<g class="mh-unlem"><rect x="8" y="14" width="2" height="3"/><rect x="8" y="18" width="2" height="1"/></g>' },
    ofke: { ad: 'Öfke Odası', renk: { '~': '@duman', S: 'of-tabela', K: 'of-catlak', C: 'of-cati', D: 'of-duvar', o: 'of-lamba', G: 'of-panjur', g: 'of-panjur-koyu', c: 'of-catlak' }, satir: [
      '.........~~.....', '........~~~~....', '..SSSSSSSSSS....', '..SSSSKSSSSS....', '.CCCCCCCCCCCCCC.', '.DDDDDDDDDDDDDD.', '.DDoDDDDDDDDDDD.',
      '.DGGGGGGGGGGGGD.', '.DGGGGGGGGGGGGD.', '.DggggggggggggD.', '.DGGGGGGcGGGGGD.', '.DGGGGGGGGGGGGD.', '.DGGGGGGGGGGGGD.', 'ZZZZZZZZZZZZZZZZ'] },
    bizim: { ad: 'Bizim Köşemiz', renk: { l: '@lamba', '|': 'bz-direk', H: 'bz-kalp', T: 'bz-tente', W: 'bz-serit', D: 'bz-duvar', p: 'bz-polaroid', R: 'bz-kapi', B: 'bz-bank' }, satir: [
      '..l.................', '.lll...HH.HH........', '..|...HHHHHHH.......', '..|....HHHHH........', '..|.....HHH.........', '..|..TWTWTWTWTWTWT..', '..|..DDDDDDDDDDDDD..',
      '..|..DppDDDDRRRRDD..', '..|..DppDDDDRRRRDD..', '..|..DDDDDDDRRRRDD..', '..|..DDDDDDDRRoRDD..', '..|.BBBBB...RRRRDD..', '..|.B...B...RRRRDD..', 'ZZZZZZZZZZZZZZZZZZZZ'] },
    // Safir'in Yeri: Ahmet ile Cemre'nin kedisi Safir için sakin anı köşesi (bölüm: js/bolum/safir.js).
    // Bölüm kayıtlıysa bina bağlantı olur; değilse eski sakin "yakında" hâli kalır.
    safir: { ad: "Safir'in Yeri", sakin: true, renk: { G: 'sf-yaprak', g: 'sf-yaprak-koyu', B: 'sf-govde', c: 'sf-cimen', t: 'sf-toprak', w: 'sf-cicek' }, satir: [
      '......GGGG......', '....GGGGGGGG....', '...GGgGGGGgGG...', '..GGGGGGgGGGGG..', '..GgGGGGGGGGgG..', '...GGGGgGGGGG...', '....GGGGGGGG....',
      '.......BB.......', '.......BB.......', '.......BB.......', '......BBBB......', '.w.cc.......cc.w', '.ttttttttttttttt', 'ZZZZZZZZZZZZZZZZ'] },
    pano: { ad: 'Mahalle Panosu', renk: { W: 'pn-cerceve', k: 'pn-kagit', q: 'pn-cizgi', '|': 'pn-direk', b: '@bayrak', m: 'pn-kutu' }, satir: [
      '.WWWWWWWW.', '.WkkkkkkW.', '.WkqqqqkW.', '.WkkkkkkW.', '.WWWWWWWW.', '....||....', '....||....', '....||.bm.', '....||.mm.', '....||.mm.', '....||....', '....||....', '....||....', 'ZZZZZZZZZZ'],
      ek: '<g class="mh-raptiye"><rect x="12" y="3" width="1" height="1"/><rect x="14" y="3" width="1" height="1"/><rect x="12" y="4" width="3" height="1"/><rect x="13" y="5" width="1" height="1"/></g>' }
  };
  const AYRI = { '@ampul': true };           // her hücre ayrı (sırayla yanan ampuller)
  function binaSvg(id) {
    const b = BINA[id]; const renk = Object.assign({}, ORTAK, b.renk);
    const w = Math.max(...b.satir.map(s => s.length));
    const h = b.satir.length;
    let r = '', ampul = 0;
    b.satir.forEach((s, y) => {
      s = s.padEnd(w, '.');
      let x = 0;
      while (x < w) {
        const c = s[x]; if (c === '.' || !renk[c]) { x++; continue; }
        const ad = renk[c]; let n = 1;
        if (!AYRI[ad]) while (x + n < w && s[x + n] === c) n++;
        const ozel = ad[0] === '@';
        const nit = ozel ? ' class="mh-r-' + ad.slice(1) + '"' + (ad === '@ampul' ? ' style="--sira:' + (ampul++ % 6) + '"' : '') + (ad === '@inci' ? ' fill="url(#mhInci)"' : '')
          : ' class="mh-r" style="--r:var(--bd-' + ad + ')"';
        r += '<rect x="' + (x * 2) + '" y="' + (y * 2) + '" width="' + (n * 2) + '" height="2"' + nit + '/>';
        x += n;
      }
    });
    return '<svg class="mh-bina-svg" viewBox="0 0 ' + (w * 2) + ' ' + (h * 2) + '" style="--w:' + (w * 2) + ';--h:' + (h * 2) + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><g class="mh-govde">' + r + '</g>' + (b.ek || '') + '</svg>';
  }
  function pixel(satirlar, renk, sinif) {
    const h = satirlar.length, w = satirlar[0].length; let r = '';
    satirlar.forEach((s, y) => { let x = 0; while (x < w) { const c = s[x]; if (c === '.' || !renk[c]) { x++; continue; } let n = 1; while (x + n < w && s[x + n] === c) n++; r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + renk[c] + '"/>'; x += n; } });
    return '<svg class="' + (sinif || '') + '" viewBox="0 0 ' + w + ' ' + h + '" style="--w:' + w + ';--h:' + h + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + r + '</svg>';
  }
  const GUNES = pixel(['.....YY.....', '.Y...YY...Y.', '..Y......Y..', '....YYYY....', '...YYYYYY...', 'YY.YYYYYY.YY', 'YY.YYYYYY.YY', '...YYYYYY...', '....YYYY....', '..Y......Y..', '.Y...YY...Y.', '.....YY.....'], { Y: 'var(--seker-limon)' }, 'mh-gunes-svg');
  const HILAL = pixel(['....MMMM....', '..MMMMM.....', '.MMMMM......', '.MMMM.......', 'MMMM........', 'MMMM........', 'MMMM........', 'MMMM........', '.MMMM.......', '.MMMMM......', '..MMMMM.....', '....MMMM....'], { M: '#FFE9A8' }, 'mh-hilal-svg');
  const AY_KUCUK = pixel(['..MMMM..', '.MMM....', 'MMM.....', 'MMM.....', 'MMM.....', 'MMM.....', '.MMM....', '..MMMM..'], { M: '#FFE9A8' }, 'mh-ay-svg');
  const GUNES_KUCUK = pixel(['...YY...', '.Y.YY.Y.', '..YYYY..', 'YYYYYYYY', 'YYYYYYYY', '..YYYY..', '.Y.YY.Y.', '...YY...'], { Y: 'var(--seker-limon)' }, 'mh-ay-svg');
  const BULUT = pixel(['....WWWW........', '..WWWWWWWW.WW...', '.WWWWWWWWWWWWWW.', 'WWWWWWWWWWWWWWWW', '.GGGGGGGGGGGGGG.'], { W: 'var(--bulut)', G: 'var(--bulut-golge)' }, 'mh-bulut-svg');
  const KARA_BULUT = pixel(['....WWWW........', '..WWWWWWWW.WW...', '.WWWWWWWWWWWWWW.', 'WWWWWWWWWWWWWWWW', '.GGGGGGGGGGGGGG.'], { W: '#7C7898', G: '#5E5A78' }, 'mh-bulut-svg');
  const RUH_SIMGE = {
    gunes: ['...YYYY...', '..YYYYYY..', '.YYYYYYYY.', '.YYYYYYYY.', '..YYYYYY..', '...YYYY...'],
    parcali: ['.YYY......', 'YYYYWWW...', 'YYYWWWWW..', '.YWWWWWWW.', '..WWWWWWWW', '...GGGGGG.'],
    bulutlu: ['...WWW....', '..WWWWWW..', '.WWWWWWWW.', 'WWWWWWWWWW', '.GGGGGGGG.', '..........'],
    yagmur: ['..WWWW....', '.WWWWWWW..', 'WWWWWWWWW.', '.GGGGGGG..', '.B..B..B..', 'B..B..B...'],
    firtina: ['..KKKK....', '.KKKKKKK..', 'KKKKKKKKK.', '.KKKYKKK..', '....YY....', '...Y......'],
    gokkusagi: ['..RRRRRR..', '.ROOOOOOR.', 'ROYYYYYYOR', 'OYG....GYO', 'YG......GY', 'G........G']
  };
  const RUH_RENK = { Y: 'var(--seker-limon)', W: 'var(--bulut)', G: 'var(--bulut-golge)', B: 'var(--goz)', K: '#5E5A78', R: 'var(--seker-kiraz)', O: 'var(--seker-seftali)' };
  const ruhSimge = (tur) => pixel(RUH_SIMGE[tur] || RUH_SIMGE.gunes, Object.assign({}, RUH_RENK, tur === 'gokkusagi' ? { G: 'var(--seker-yaprak)', Y: 'var(--seker-limon)' } : (tur === 'firtina' ? { Y: 'var(--simsek)' } : {})), 'mh-ruh-svg');
  const RUH_AD = { gunes: 'Güneşli', parcali: 'Parçalı', bulutlu: 'Bulutlu', yagmur: 'Yağmurlu', firtina: 'Fırtına', gokkusagi: 'Gökkuşağı' };
  const RUH_SIFAT = { gunes: 'güneşli', parcali: 'parçalı bulutlu', bulutlu: 'bulutlu', yagmur: 'yağmurlu', firtina: 'fırtınalı', gokkusagi: 'gökkuşaklı' };
  function gokkusagiSvg() {
    const W = 44, H = 15, renk = ['var(--seker-kiraz)', 'var(--seker-seftali)', 'var(--seker-limon)', 'var(--seker-yaprak)', 'var(--seker-gok)', 'var(--seker-lavanta)'];
    let r = '';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x + 0.5 - W / 2, y + 0.5 - H); const i = Math.floor(d - 8.5); if (i >= 0 && i < 6) r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + renk[i] + '"/>'; }
    return '<svg class="mh-gokkusagi-svg" viewBox="0 0 ' + W + ' ' + H + '" style="--w:' + W + ';--h:' + H + '" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
  }

  /* ================================================================ yerleşim */
  // bahçenin yanında, oyun binalarından ayrı sakin bir teras: Safir'in Yeri
  const TERASLAR = [['bizim', 'pano'], ['pittiksu', 'barbie'], ['tirnak', 'petevi'], ['angela', 'panda'], ['bahce'], ['safir'], ['xox', 'ofke']];
  const terasNo = (id) => TERASLAR.findIndex(t => t.indexOf(id) >= 0);
  const BOLUMLER = ['pittiksu', 'barbie', 'tirnak', 'petevi', 'angela', 'panda', 'bahce', 'ofke', 'xox', 'bizim'];
  const evi = (kim) => { const e = (MAH().EV || {})[kim]; return BINA[e] && e !== 'pano' ? e : 'bizim'; };
  const yapimda = (id) => !/[?&]hepsi/.test(location.search) && ((CD.config || {}).YAPIM_ASAMASINDA || []).includes(id);
  const acik = (id) => !!CD.bolumler[id] && !yapimda(id);

  let kok = null, kuruldu = false;
  const hucre = {};          // id → { hucre, bina, svg, ipucu }
  const teras = [];          // n → { sec, kaldirim, petAlan, kisiler, motor }
  const ui = {};

  function binaKur(id) {
    const b = BINA[id];
    const h = CD.el('div.mh-hucre', { data: { bina: id } });
    let el;
    if (id === 'pano') {
      el = CD.el('button.mh-bina.mh-pano', { type: 'button', 'aria-label': 'Mahalle Panosu. Günün sorusu', onclick: () => { CD.ses.pop(); soruAc(); } });
    } else if (b.sakin && !acik(id)) {
      // anı köşesi: iskele yok, soluk değil; dokununca yalnız "yakında"
      el = CD.el('button.mh-bina.mh-sakin', { type: 'button', 'aria-label': b.ad + '. Yakında', onclick: () => CD.toast(b.ad + ' yakında 🤍') });
    } else if (acik(id)) {
      el = CD.el('a.mh-bina', { href: '#/' + id, 'aria-label': b.ad + '. ' + ACIKLAMA[id], onclick: () => CD.ses.pop() });
    } else {
      el = CD.el('button.mh-bina.yapimda', { type: 'button', 'aria-disabled': 'true', 'aria-label': b.ad + '. Yapım aşamasında', onclick: () => CD.toast(b.ad + ' hazırlanıyor, az kaldı 🧶') });
    }
    el.dataset.bolum = id;
    const ipucu = CD.el('span.mh-ipucu', { hidden: true });
    el.append(CD.el('span.mh-tabela', b.ad), ipucu, CD.el('span.mh-bina-cizim', { html: binaSvg(id) + (el.classList.contains('yapimda') ? '<span class="mh-iskele" aria-hidden="true"></span>' : '') }));
    h.appendChild(el);
    hucre[id] = { hucre: h, bina: el, ipucu, svg: el.querySelector('svg') };
    if (id === 'bahce') h.appendChild(CD.el('span.mh-ari', { 'aria-hidden': 'true' }));
    return h;
  }
  function merdiven(sag) {
    return CD.el('span.mh-merdiven' + (sag ? '.sag' : '.sol'), { 'aria-hidden': 'true', html: pixel(['......SS', '....SSSS', '..SSSSSS', 'SSSSSSSS'], { S: 'var(--kaldirim-cizgi)' }) });
  }
  function kur() {
    kok = $('#hub'); if (!kok || kuruldu) return;
    kuruldu = true;
    kok.innerHTML = '';
    kok.classList.add('mahalle');
    // tanımlar (inci gradyanı yalnız Tırnak Salonu tabelasında)
    kok.appendChild(CD.el('div', { 'aria-hidden': 'true', html: '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="mhInci" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD6E4"/><stop offset=".35" stop-color="#E2F1FF"/><stop offset=".65" stop-color="#FFF7D9"/><stop offset="1" stop-color="#EADFFF"/></linearGradient></defs></svg>' }));
    // durum şeridi
    ui.seritKafa = CD.el('button.mh-serit-kafa', { type: 'button', 'aria-label': 'Kim burada?', onclick: seritDokun });
    ui.seritMetin = CD.el('button.mh-serit-metin', { type: 'button', onclick: seritDokun });
    ui.seritCanli = CD.el('span.gorsel-gizli', { 'aria-live': 'polite', role: 'status' });
    ui.menu = CD.el('button.dugme-ikon#mahalleMenu', { type: 'button', 'aria-label': 'Ses, gece ve ayarlar', onclick: () => CD.ayarlarAc && CD.ayarlarAc() }, '⋯');
    kok.appendChild(CD.el('header.ustbar.mh-serit', [ui.seritKafa, ui.seritMetin, CD.el('span.ustbar-kalp-yeri', { 'aria-hidden': 'true' }), ui.menu, ui.seritCanli]));
    // gökyüzü
    ui.gok = CD.el('section.mh-gok', { 'aria-label': 'Gökyüzü', data: { ruh: 'gunes' } });
    ui.gokA = CD.el('div.mh-gok-katman.a'); ui.gokB = CD.el('div.mh-gok-katman.b');
    ui.gokHareket = CD.el('div.mh-gok-hareket', { 'aria-hidden': 'true' });
    ui.yildizlar = CD.el('div.mh-yildizlar', { 'aria-hidden': 'true' });
    for (let i = 0; i < 10; i++) { const s = CD.el('i'); s.style.left = (4 + Math.random() * 88) + '%'; s.style.top = (8 + Math.random() * 60) + '%'; ui.yildizlar.appendChild(s); }
    ui.selam = CD.el('h1.mh-selam#hubSelam', 'Hoş geldin');
    ui.gokNot = CD.el('p.gorsel-gizli');
    ui.gunes = CD.el('button.mh-gunes-dugme', { type: 'button', onclick: () => { CD.havaDegistir(); } });
    ui.gok.append(ui.gokA, ui.gokB, ui.yildizlar, ui.gokHareket, CD.el('div.mh-gok-los', { 'aria-hidden': 'true' }), CD.el('div.mh-simsek', { 'aria-hidden': 'true' }),
      CD.el('div.mh-sutun.mh-gok-ic', [ui.gunes, ui.selam, ui.gokNot]));
    kok.appendChild(ui.gok);
    // teraslar
    const nav = CD.el('nav.mh-teraslar#mhTeraslar', { 'aria-label': 'Mahalle' });
    TERASLAR.forEach((ids, n) => {
      const binalar = CD.el('div.mh-binalar', { data: { adet: String(ids.length) } }, ids.map(binaKur));
      const petAlan = CD.el('div.mh-pet-alan');
      const kisiler = CD.el('div.mh-kisiler');
      const kaldirimIc = CD.el('div.mh-sutun.mh-kaldirim-ic', [petAlan, kisiler, merdiven(n % 2 === 0)]);
      const kaldirim = CD.el('div.mh-kaldirim', [kaldirimIc]);
      const sec = CD.el('section.mh-teras', { data: { teras: String(n + 1) } }, [CD.el('div.mh-sutun', [binalar]), kaldirim]);
      if (n === 0) kaldirimIc.append(CD.el('span.mh-birikinti.b1', { 'aria-hidden': 'true' }), CD.el('span.mh-birikinti.b2', { 'aria-hidden': 'true' }));
      teras[n] = { sec, kaldirim: kaldirimIc, petAlan, kisiler, motor: null };
      nav.appendChild(sec);
    });
    kok.appendChild(nav);
    // alt: buket / not / ana ekrana ekle / gizlilik
    ui.gizlilik = CD.el('p.sessiz#hubGizlilik', 'Her şey bu telefonda kalır; hiçbir yere gönderilmez.');
    ui.kurulum = CD.el('div.yama.siki.kurulum#kurulumKarti', { hidden: true }, [
      CD.el('span.ikon', { 'aria-hidden': 'true' }, '📱'),
      CD.el('div', [CD.el('div.kalin', 'Ana ekrana ekle'), CD.el('div.sessiz#kurulumMetin', 'Paylaş düğmesi → "Ana Ekrana Ekle" dersen, Pıttıksu her zaman bir dokunuş uzakta olur.')]),
      CD.el('button.dugme-ikon#kurulumKapat', { type: 'button', 'aria-label': 'Kapat' }, '✕')
    ]);
    kok.appendChild(CD.el('footer.mh-alt', [CD.el('div.mh-sutun', [
      CD.el('div.mh-baglar', [
        CD.el('button.dugme-hayalet', { type: 'button', onclick: () => { CD.ses.pop(); if (CD.giris) CD.giris.buketGoster(); } }, '🌹 Buketi tekrar gör'),
        CD.el('button.dugme-hayalet', { type: 'button', onclick: () => { CD.ses.pop(); if (CD.giris) CD.giris.notGoster(); } }, '💌 Notu oku')
      ]),
      ui.kurulum, ui.gizlilik
    ])]));
    // "Bölümlere atla": hash yönlendirmesini bozmadan ilk binaya odak
    const atla = $('.atla'); if (atla) atla.addEventListener('click', e => { e.preventDefault(); const ilk = kok.querySelector('.mh-bina'); if (ilk) ilk.focus(); });
    kisileriKur();
    kurulum();
    addEventListener('resize', () => { clearTimeout(ui.boyT); ui.boyT = setTimeout(() => { kisilerYerlestir(true); elcileriYerlestir(); }, 150); });
  }

  /* ================================================================ selam */
  // selam ve gökyüzü aynı kaynaktan: CD.gunVakti (cekirdek.js)
  function selam() {
    if (!ui.selam) return;
    const gv = CD.gunVakti();
    const ad = CD.kim() ? adi(CD.kim()) : CD.isimler().o;
    ui.selam.textContent = gv.selam + ' ' + ad + (gv.soru ? '?' : '');
  }

  /* ================================================================ gökyüzü (karşının ruh hali) */
  let gokRuh = null, gokKatman = 'a', simsekT = 0;
  function gokGuncelle() {
    if (!ui.gok) return;
    const o = V().onun();
    const tur = (o && o.ruh) || (o ? 'gunes' : (V().benimRuh() || 'gunes'));
    const gece = CD.hava === 'gece';
    const anahtar = tur + '|' + gece;
    ui.gunes.innerHTML = gece ? HILAL : GUNES;
    ui.gunes.setAttribute('aria-label', gece ? 'Gündüze geç' : 'Geceye geç');
    ui.gunes.setAttribute('aria-pressed', gece ? 'true' : 'false');
    const kimin = o ? CD.ek.nin(o.ad) : 'Senin';
    ui.gokNot.textContent = kimin + ' havası: ' + RUH_SIFAT[tur];
    ui.gok.setAttribute('aria-label', 'Gökyüzü. ' + kimin + ' havası: ' + RUH_SIFAT[tur]);
    kok.classList.toggle('ben-uyuyor', V().benUyuyor());
    if (anahtar === gokRuh) return;
    const ilk = gokRuh == null; gokRuh = anahtar;
    // iki katmanla 600ms çapraz geçiş
    const yeni = gokKatman === 'a' ? ui.gokB : ui.gokA, eski = gokKatman === 'a' ? ui.gokA : ui.gokB;
    gokKatman = gokKatman === 'a' ? 'b' : 'a';
    yeni.dataset.ruh = tur; yeni.classList.add('gorunur'); eski.classList.remove('gorunur');
    if (ilk) { eski.dataset.ruh = tur; }
    ui.gok.dataset.ruh = tur;
    kok.dataset.gokRuh = tur;
    hareketKur(tur);
  }
  function hareketKur(tur) {
    const h = ui.gokHareket; h.innerHTML = ''; clearInterval(simsekT); simsekT = 0;
    const bulut = (n, kara) => { for (let i = 0; i < n; i++) { const b = CD.el('span.mh-bulut', { html: kara ? KARA_BULUT : BULUT }); b.style.setProperty('--i', i); b.style.top = (10 + (i * 23) % 52) + '%'; b.style.left = (8 + (i * 37) % 70) + '%'; h.appendChild(b); } };
    const yagmur = () => { const k = CD.el('span.mh-yagmur'); for (let i = 0; i < 24; i++) { const d = CD.el('i'); d.style.left = ((i * 41) % 100) + '%'; d.style.animationDelay = (-((i * 137) % 900)) + 'ms'; k.appendChild(d); } h.appendChild(k); };
    if (tur === 'parcali') bulut(2);
    else if (tur === 'bulutlu') bulut(4);
    else if (tur === 'yagmur') { bulut(3); yagmur(); }
    else if (tur === 'firtina') {
      bulut(3, true); yagmur();
      simsekT = setInterval(() => {
        if (document.hidden || kok.hidden || az()) return;
        ui.gok.classList.add('simsek'); setTimeout(() => ui.gok && ui.gok.classList.remove('simsek'), 80);
        if (CD.ses.acik && CD.ses.baglam()) CD.ses.gokGurultu();
      }, 7000);
    } else if (tur === 'gokkusagi') { h.appendChild(CD.el('span.mh-gokkusagi', { html: gokkusagiSvg() })); bulut(2); }
  }

  /* ================================================================ durum şeridi "Kim burada?" */
  let sonOkunan = 0, okunacak = '';
  function seritMetni() {
    if (!V().bulut()) return { metin: 'Bulut kapalı, ikiniz ayrı mahallelerdesiniz', kafa: 'gri' };
    if (!CD.kim()) return { metin: 'Bu telefon kimin? Seçmek için dokun', kafa: '?' };
    const o = V().onun(); if (!o) return { metin: '', kafa: '?' };
    const Y = V().YERLER;
    if (o.uyuyor) return { metin: o.ad + ' uyuyor 🌙', kafa: 'uyku', o };
    if (o.cevrimici) {
      if (o.yer === 'mahalle' || !Y[o.yer]) return { metin: o.ad + ' mahallede geziyor 👋', kafa: 'canli', o };
      return { metin: o.ad + ' şu an ' + Y[o.yer].de + ' ' + Y[o.yer].em, kafa: 'canli', o };
    }
    if (o.hicYok || Date.now() - o.sonGorulme > 14 * 86400000) return { metin: o.ad + ' bir süredir uğramadı', kafa: 'soluk', o };
    return { metin: o.ad + ' ' + V().gorelizaman(o.sonGorulme) + ' buradaydı', kafa: 'soluk', o };
  }
  function seritGuncelle() {
    if (!ui.seritMetin) return;
    const s = seritMetni();
    ui.seritMetin.textContent = s.metin;
    ui.seritMetin.setAttribute('aria-label', s.metin + (s.o ? '. Dokun, onu göster' : ''));
    const kafaAnahtar = s.kafa + (s.o ? s.o.kim : '');
    if (ui.seritKafa.dataset.k !== kafaAnahtar) {
      ui.seritKafa.dataset.k = kafaAnahtar; ui.seritKafa.innerHTML = '';
      ui.seritKafa.dataset.durum = s.kafa;
      if (s.o) ui.seritKafa.appendChild(CD.kisi.kafa(s.o.kim, 24, s.kafa === 'uyku'));
      else ui.seritKafa.appendChild(CD.el('span.mh-soru-isaret', { 'aria-hidden': 'true' }, s.kafa === 'gri' ? '☁' : '?'));
      ui.seritKafa.appendChild(CD.el('span.mh-nokta', { 'aria-hidden': 'true' }));
    }
    ui.seritKafa.setAttribute('aria-label', s.metin);
    // ekran okuyucu: en fazla 30 sn'de bir
    if (s.metin !== okunacak) {
      okunacak = s.metin;
      const yaz = () => { if (ui.seritCanli) ui.seritCanli.textContent = okunacak; sonOkunan = Date.now(); };
      clearTimeout(ui.okuT);
      if (Date.now() - sonOkunan > 30000) yaz(); else ui.okuT = setTimeout(yaz, 30000 - (Date.now() - sonOkunan));
    }
  }
  function seritDokun() {
    CD.ses.tik();
    if (!V().bulut()) { CD.toast('Bulut kapalı; her şey bu telefonda 📱'); return; }
    if (!CD.kim()) { CD.kimSec(false); return; }
    const o = V().onun(); if (!o) return;
    const el = kisiEl[o.kim];
    if (el && el.isConnected && !el.hidden) { el.scrollIntoView({ block: 'center', behavior: az() ? 'auto' : 'smooth' }); return; }
    evineKay(o.kim);
  }
  function binayaKay(id) { const h = hucre[id]; if (h) h.hucre.scrollIntoView({ block: 'center', behavior: az() ? 'auto' : 'smooth' }); }
  function evineKay(kim) { binayaKay(evi(kim)); }

  /* ================================================================ binaların canlı hâli */
  function binalarGuncelle() {
    if (!kuruldu) return;
    BOLUMLER.forEach(id => {
      const h = hucre[id]; if (!h) return;
      let m = CD.depo.alan(id).al('ipucu', ''); if (typeof m !== 'string') m = '';
      if (!acik(id)) m = '';
      h.ipucu.textContent = m; h.ipucu.hidden = !m;
    });
    // açık/kapalı (bölüm sonradan kaydolursa)
    BOLUMLER.concat(['safir']).forEach(id => {
      const h = hucre[id]; if (!h) return;
      const simdi = acik(id), once = h.bina.tagName === 'A';
      if (simdi !== once) { const yeni = binaKur(id); h.hucre.replaceWith(yeni); }
    });
    // Oyun Salonu: sıra sende
    try {
      const d = CD.depo.al('xox.durum', null);
      hucre.xox.hucre.classList.toggle('sira-sende', !!(d && V().aktif() && d.sira === CD.kim() && !d.kazanan && !(d.tahta || []).every(x => x)));
    } catch (e) {}
    // Pano: bayrak (bugün cevaplamadıysan kalkık), raptiye (karşı cevapladıysa)
    const bugun = CD.bugun();
    hucre.pano.hucre.classList.toggle('cevapsiz', !(CD.kim() && V().cevap(CD.kim(), bugun)));
    hucre.pano.hucre.classList.toggle('karsi-cevapladi', !!(V().karsi() && V().aktif() && V().cevap(V().karsi(), bugun)));
    // evler: karşı kişi çevrimdışıysa perdeli, uyuyorsa ışıklar sönük + hilal
    const o = V().onun();
    Object.keys(hucre).forEach(id => { hucre[id].hucre.classList.remove('perdeli', 'uyuyor', 'ev-karsi'); });
    if (o) {
      const e = hucre[evi(o.kim)];
      if (e) { e.hucre.classList.add('ev-karsi'); if (o.uyuyor) e.hucre.classList.add('uyuyor'); else if (!o.cevrimici) e.hucre.classList.add('perdeli'); }
    }
    uykuGecis(o);
    // fırtına: Öfke Odası dumanı (biri fırtınadaysa), kısayol balonu (yalnız kendi fırtınanda)
    const benFirtina = V().benimRuh() === 'firtina';
    hucre.ofke.hucre.classList.toggle('dumanli', benFirtina || !!(o && o.ruh === 'firtina'));
    let bal = hucre.ofke.hucre.querySelector('.mh-firtina-balon');
    if (benFirtina && acik('ofke') && !bal) {
      bal = CD.el('button.mh-firtina-balon.balon.goster', { type: 'button', onclick: () => { CD.ses.pop(); CD.ac('ofke'); } }, 'Biraz kır dök? 🍽️');
      hucre.ofke.hucre.appendChild(bal);
    } else if (!benFirtina && bal) bal.remove();
    notIpuclari();
  }
  // karşının uykusu → hilal / uyanınca doğan güneş, T2 petleri uyur/uyanır
  let oncekiUyku = null;
  function uykuGecis(o) {
    const uyuyor = !!(o && o.uyuyor);
    const e = o && hucre[evi(o.kim)];
    kok.querySelectorAll('.mh-hilal').forEach(x => { if (!uyuyor) { x.classList.add('in'); setTimeout(() => x.remove(), 600); } });
    if (uyuyor && e && !e.hucre.querySelector('.mh-hilal')) e.hucre.appendChild(CD.el('span.mh-hilal', { 'aria-hidden': 'true', html: AY_KUCUK }));
    if (oncekiUyku === true && !uyuyor && e && !kok.hidden) {
      const g = CD.el('span.mh-dogan-gunes', { 'aria-hidden': 'true', html: GUNES_KUCUK }); e.hucre.appendChild(g); setTimeout(() => g.remove(), 1500);
      petlerUyku(false, true);
      if (CD.ses.acik) CD.ses.uyandim();
    } else if (uyuyor !== oncekiUyku) petlerUyku(uyuyor || V().benUyuyor(), false);
    oncekiUyku = uyuyor;
  }

  /* ---------------------------------------------------------------- saklı not: alıcıda pırıltı, gönderende 📌 rozet */
  function notIpuclari() {
    kok.querySelectorAll('.mh-piril, .mh-not-rozet').forEach(x => x.remove());
    if (!V().aktif()) return;
    const bana = new Set(V().banaNotlar().map(n => n.bina));
    bana.forEach(id => { const h = hucre[id]; if (h) h.hucre.appendChild(CD.el('span.mh-piril', { 'aria-hidden': 'true' })); });
    V().bekleyenNotlarim().forEach(n => {
      const h = hucre[n.bina]; if (!h) return;
      h.hucre.appendChild(CD.el('button.mh-not-rozet', { type: 'button', 'aria-label': BINA[n.bina].ad + ' binasına sakladığın not. Geri almak için dokun', onclick: () => notGeriAlSor(n) }, '📌'));
    });
    if (bana.size && ui.gokNot) ui.gokNot.textContent += '. Bir binada sana saklanmış not var.';
  }
  function notGeriAlSor(n) {
    CD.ses.tik();
    CD.sheet(CD.el('div.dikey', [
      CD.el('p', BINA[n.bina].ad + ' binasına sakladığın not:'),
      CD.el('p.mh-not-onizleme', n.metin),
      CD.el('p.sessiz', V().karsi() ? adi(V().karsi()) + ' o binaya girince not düşecek.' : ''),
      CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { V().notSil(n.id); CD.sheetKapat(); CD.toast('Not geri alındı 📌'); binalarGuncelle(); } }, 'Notu geri al'),
      CD.el('button.dugme-hayalet.tam', { type: 'button', onclick: () => CD.sheetKapat() }, 'Kalsın')
    ]), { baslik: 'Saklı not' });
  }

  /* ================================================================ karakterler */
  const kisiEl = {}, kisiDurum = {};
  let sallaT = 0;
  function kisiYap(kim) {
    const c = document.createElement('canvas');
    const simge = CD.el('span.mh-ruh-simge', { 'aria-hidden': 'true' });
    const b = CD.el('button.mh-kisi', { type: 'button', data: { kim } }, [simge, c]);
    b.addEventListener('click', () => kisiDokun(kim));
    b._c = c; b._simge = simge;
    return b;
  }
  function kisileriKur() {
    ['cemre', 'ahmet'].forEach(k => { kisiEl[k] = kisiYap(k); kisiEl[k].hidden = true; });
    clearInterval(sallaT);
    sallaT = setInterval(() => {               // mahalledeki karşı kişi 3 sn'de bir el sallar
      if (kok.hidden || document.hidden || az()) return;
      Object.keys(kisiDurum).forEach(k => { const d = kisiDurum[k]; if (d && d.salla && !d.uyku && !d.yuruyor) { kareCiz(k, 4); setTimeout(() => { if (!kisiDurum[k].yuruyor) kareCiz(k, kisiDurum[k].uyku ? 5 : 0); }, 700); } });
    }, 3000);
  }
  function kareCiz(kim, kare) { const b = kisiEl[kim]; if (b) CD.kisi.ciz(b._c, kim, kare, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sprite-olcek-kisi')) || 3); }
  // kim nerede durmalı?
  function hedefler() {
    const h = {};
    const ben = CD.kim(); if (!ben) return h;
    const benV = V().benim();
    const benUyku = V().benUyuyor();
    let benBina = benUyku ? evi(ben) : (benV && benV.sonBina && hucre[benV.sonBina] ? benV.sonBina : 'bizim');
    h[ben] = { bina: benBina, uyku: benUyku, salla: false };
    const o = V().onun();
    if (o && (o.cevrimici || o.uyuyor)) {
      const bina = o.uyuyor ? evi(o.kim) : (o.yer === 'mahalle' || !hucre[o.yer] ? 'pano' : o.yer);
      h[o.kim] = { bina, uyku: o.uyuyor, salla: !o.uyuyor && o.yer === 'mahalle' };
    }
    return h;
  }
  function binaX(bina, kisilerEl) {
    const hc = hucre[bina]; if (!hc) return 40;
    const a = hc.hucre.getBoundingClientRect(), k = kisilerEl.getBoundingClientRect();
    return a.left + a.width / 2 - k.left;
  }
  function kisilerYerlestir(anlik) {
    if (!kuruldu) return;
    const h = hedefler();
    const olc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sprite-olcek-kisi')) || 3;
    const mpx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--m-px')) || 4;
    ['cemre', 'ahmet'].forEach(kim => {
      const b = kisiEl[kim], hd = h[kim];
      if (!hd) { if (!b.hidden) { b.classList.add('sonuk'); setTimeout(() => { if (!h[kim]) { b.hidden = true; b.remove(); } }, 200); } kisiDurum[kim] = null; return; }
      const t = teras[terasNo(hd.bina)]; if (!t) return;
      const ayni = ['cemre', 'ahmet'].filter(k => h[k] && h[k].bina === hd.bina);
      const genis = 12 * olc;
      let x = binaX(hd.bina, t.kisiler) - (hd.uyku ? 14 * olc : genis) / 2;
      if (ayni.length === 2) x += (kim === CD.kim() ? -1 : 1) * (genis / 2 + mpx);
      x = Math.max(0, Math.min(t.kisiler.clientWidth - genis, x));
      const once = kisiDurum[kim];
      const ozellik = kim === CD.kim() ? 'Sen (' + adi(kim) + '). Havanı, uykunu, elçini ve saklı notunu buradan seç'
        : adi(kim) + (hd.uyku ? ' uyuyor' : (hd.bina === 'pano' ? ' mahallede' : ' ' + V().YERLER[hd.bina].de)) + '. Dokun';
      b.setAttribute('aria-label', ozellik);
      b.classList.toggle('ben', kim === CD.kim());
      b.classList.toggle('uyuyor', !!hd.uyku);
      // ruh simgesi
      const ruh = kim === CD.kim() ? V().benimRuh() : (V().onun() || {}).ruh;
      b._simge.innerHTML = ruh ? ruhSimge(ruh) : '';
      b._simge.hidden = !ruh;
      kareCiz(kim, hd.uyku ? 5 : 0);
      const yeniYer = !once || once.bina !== hd.bina || b.parentNode !== t.kisiler;
      kisiDurum[kim] = Object.assign({}, hd, { x, yuruyor: false });
      b.hidden = false; b.classList.remove('sonuk');
      if (yeniYer && once && !anlik && !az() && kim !== CD.kim()) {
        // ışınlanmaz: eski yerden solar, yeni terasın kenarından yürüyerek gelir
        b.classList.add('sonuk');
        setTimeout(() => {
          const bas = x > t.kisiler.clientWidth / 2 ? t.kisiler.clientWidth - genis : 0;
          b.style.transition = 'none'; b.style.left = bas + 'px'; t.kisiler.appendChild(b); void b.offsetWidth;
          b.classList.remove('sonuk'); b.style.transition = ''; b.classList.add('yuruyor');
          kisiDurum[kim].yuruyor = true;
          const sure = Math.min(1200, Math.abs(x - bas) * 6 + 300);
          b.style.setProperty('--yuru', sure + 'ms');
          let i = 0; const ad = setInterval(() => kareCiz(kim, 2 + (i++ % 2)), 160);
          b.style.left = x + 'px';
          setTimeout(() => { clearInterval(ad); b.classList.remove('yuruyor'); if (kisiDurum[kim]) { kisiDurum[kim].yuruyor = false; kareCiz(kim, kisiDurum[kim].uyku ? 5 : 0); } }, sure);
        }, 200);
      } else {
        if (b.parentNode !== t.kisiler) t.kisiler.appendChild(b);
        if (anlik || az()) { b.style.transition = 'none'; b.style.left = x + 'px'; void b.offsetWidth; b.style.transition = ''; } else b.style.left = x + 'px';
      }
    });
    // ikisi aynı binada: aralarında küçük kalp (1 kez)
    const k = ['cemre', 'ahmet'].filter(x => h[x]);
    const birlikte = k.length === 2 && h.cemre.bina === h.ahmet.bina;
    if (birlikte && ui.birlikte !== h.cemre.bina) {
      ui.birlikte = h.cemre.bina;
      setTimeout(() => { const a = kisiEl.cemre.getBoundingClientRect(), c = kisiEl.ahmet.getBoundingClientRect(); if (a.width) CD.efekt.kalp((a.left + c.right) / 2, Math.min(a.top, c.top) + 10, 1); }, 650);
    } else if (!birlikte) ui.birlikte = null;
  }
  function kisiDokun(kim) {
    CD.ses.tik();
    if (kim === CD.kim()) { benSayfasi(); return; }
    // karşı karakter: küçük balon + kalp kısayolu
    const b = kisiEl[kim]; const o = V().onun(); if (!b || !o) return;
    const eski = b.parentNode && b.parentNode.querySelector('.mh-kisi-balon'); if (eski) eski.remove();
    const Y = V().YERLER;
    const metin = o.uyuyor ? o.ad + ' uyuyor 🌙' : (o.yer === 'mahalle' || !Y[o.yer] ? o.ad + ' mahallede 👋' : o.ad + ' ' + Y[o.yer].de + ' ' + Y[o.yer].em);
    const bal = CD.el('div.mh-kisi-balon.balon.goster', { role: 'status' }, [CD.el('span', metin), CD.el('button.dugme.kucuk', { type: 'button', onclick: () => { bal.remove(); CD.posta.kalpGonder(); } }, 'Kalp gönder 💗')]);
    bal.style.left = (parseFloat(b.style.left) || 0) + 'px';
    b.parentNode.appendChild(bal);
    setTimeout(() => bal.remove(), 4000);
  }

  /* ================================================================ petler (her terasın kaldırımı ayrı katman) */
  const PITTIKSU_SOZ = ['mırr… bugün 3 kere esnedim', 'Cemre benim insanım', 'pembe battaniye = krallığım', 'patim minik, kalbim kocaman', 'bir daha okşa?', 'rüyamda yumak gördüm', 'mırr… seni bekledim', 'kucak vakti mi?', 'gözlerim mavi-gri, fark ettin mi?', 'BITCH!', 'mırr… bu okşama 10/10'];
  let petlerKuruldu = false;
  function petleriKur() {
    if (petlerKuruldu || !CD.PetMotor || !window.CD_PETLER_MIRAS || kok.hidden) return;
    petlerKuruldu = true;
    const cfg = (CD.config && CD.config.PETLER) || {};
    const olcek = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sprite-olcek-mahalle')) || 2;
    const yap = (n) => CD.PetMotor({ katman: teras[n].petAlan, sabit: false, zeminPay: 2, olcek,
      sozler: ['♥', 'hehe', 'zıp!', 'gezmece!', 'burası güzelmiş', 'mırr', 'Cemre ♥'],
      dokununca(pet) {
        if (pet.id === 'pittiksu') { pet.soyle(CD.rastgele(PITTIKSU_SOZ), 2600); CD.ses.mirrKisa(1200); }
        else if (pet.id === 'barbie') CD.ses.hav();
      } });
    // T2: Pıttıksu (evinin önünde uyur) + Barbie
    const t2 = yap(1); teras[1].motor = t2;
    const w2 = teras[1].petAlan.clientWidth || 300;
    const pit = t2.ekle(CD.petVeri('pittiksu'), { x: w2 * 0.18, ad: (CD.config.PITTIKSU || {}).AD || 'Pıttıksu' }); pit.uyu();
    if (CD.petVeri('barbie')) t2.ekle(CD.petVeri('barbie'), { x: w2 * 0.66, ad: (CD.config.BARBIE || {}).AD || 'Barbie' });
    // T3 + T5: günlük döngüyle miras petler (mobil toplam ≤4, masaüstü ≤6)
    const hepsi = CD.petListesi().filter(p => p.id !== 'pittiksu' && p.id !== 'barbie');
    const gun = Math.floor(Date.now() / 86400000);
    const adet = innerWidth >= 768 ? 2 : 1;
    [2, 4].forEach((n, j) => {
      const m = yap(n); teras[n].motor = m;
      const w = teras[n].petAlan.clientWidth || 300;
      for (let i = 0; i < adet; i++) { const s = hepsi[(gun + j * 2 + i) % hepsi.length]; m.ekle(s, { x: w * (0.2 + 0.5 * i), ad: cfg[s.id] && cfg[s.id].AD }); }
    });
    petlerUyku(V().benUyuyor() || !!(V().onun() && V().onun().uyuyor), false);
  }
  function motorlar() { return teras.map(t => t && t.motor).filter(Boolean); }
  function petlerUyku(uyusun, zipla) {
    const m = teras[1] && teras[1].motor; if (!m) return;
    m.petler.forEach(p => { if (uyusun) p.uyu(); else { if (p.id !== 'pittiksu' || zipla) p.uyan(); if (zipla) setTimeout(() => p.zipla(480), 200); } });
  }

  /* ================================================================ elçi (karşıdan gelen hayvan) */
  const elciEl = {};         // posta id → element
  let yuruyecek = null;      // canlı gelen elçi: kenardan yürüyerek girer
  function elcileriYerlestir(yeniGelen) {
    if (!kuruldu) return;
    yeniGelen = yeniGelen || yuruyecek; yuruyecek = null;
    const t = teras[1]; const liste = V().bekleyenElciler();
    const gorunen = liste.slice(-2);
    Object.keys(elciEl).forEach(id => { if (!gorunen.find(o => o.id === id)) { elciEl[id].remove(); delete elciEl[id]; } });
    const ben = CD.kim(); if (!ben) return;
    const kapi = binaX(evi(ben) === 'pittiksu' || evi(ben) === 'barbie' ? evi(ben) : 'pittiksu', t.kisiler);
    const olc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sprite-olcek-mahalle')) || 2;
    gorunen.forEach((o, i) => {
      const h = (o.v || {}).hayvan === 'pittiksu' ? 'pittiksu' : 'barbie';
      const sprite = CD.petVeri(h); if (!sprite) return;
      let el = elciEl[o.id];
      const hedef = Math.max(0, Math.min(t.kisiler.clientWidth - 25 * olc, kapi + 20 + i * 28 * olc));
      if (!el) {
        const c = CD.spriteCiz(document.createElement('canvas'), sprite, 0);
        c.style.width = (c.width * olc) + 'px'; c.style.height = (c.height * olc) + 'px';
        const gonderen = adi(V().karsi());
        el = CD.el('button.mh-elci', { type: 'button', 'aria-label': CD.ek.den(gonderen) + ' ' + ((o.v || {}).hediye === 'isirik' ? 'şakacı ısırık' : 'öpücük') + ' getiren ' + (h === 'pittiksu' ? 'Pıttıksu' : 'Barbie') + '. Dokun' }, [
          c, CD.el('span.mh-elci-balon', CD.ek.den(gonderen) + ((o.v || {}).hediye === 'isirik' ? ' 🦷' : ' 💋'))
        ]);
        el._c = c; el._s = sprite;
        el.addEventListener('click', () => elciDokun(o, el));
        elciEl[o.id] = el;
        const yurusun = yeniGelen && yeniGelen === o.id && !az();
        el.style.left = (yurusun ? t.kisiler.clientWidth : hedef) + 'px';
        t.kisiler.appendChild(el);
        petGizle(h, true);
        if (yurusun) {
          void el.offsetWidth; el.classList.add('yuruyor');
          let k = 0; const ad = setInterval(() => { CD.spriteCiz(c, sprite, 2 + (k % 2)); if (k < 8 && CD.ses.acik) CD.ses.elciAdim(k); k++; }, 240);
          el.style.left = hedef + 'px';
          setTimeout(() => { clearInterval(ad); el.classList.remove('yuruyor'); CD.spriteCiz(c, sprite, 0); }, 1900);
        } else el.classList.add('belir');
      } else el.style.left = hedef + 'px';
      el.dataset.fazla = liste.length > 2 && i === gorunen.length - 1 ? '×' + liste.length : '';
    });
  }
  function petGizle(h, gizle) {
    const m = teras[1] && teras[1].motor; if (!m) return;
    const p = m.petler.find(x => x.id === h); if (p) p.el.style.visibility = gizle ? 'hidden' : '';
  }
  function elciDokun(o, el) {
    if (el.dataset.alindi) return; el.dataset.alindi = '1';
    const v = o.v || {}, r = el.getBoundingClientRect();
    if (v.hediye === 'isirik') {
      el.classList.add('hamle');
      const k = kisiEl[CD.kim()];
      setTimeout(() => { if (k && !k.hidden) CD.efekt.sarsinti(k, 1); }, 180);
      el.querySelector('.mh-elci-balon').textContent = 'hap! 😝';
      CD.ses.hop();
    } else {
      el.classList.add('zipla');
      CD.efekt.kalp(r.left + r.width / 2, r.top + 10, 6); CD.efekt.emoji(r.left + r.width / 2, r.top, '💋', 1);
      if (v.hayvan === 'pittiksu') CD.ses.minikMiyav(); else CD.ses.hav();
      el.querySelector('.mh-elci-balon').textContent = '💋';
    }
    V().elciAl(o);
    // sonra kendi evine yürür ve kaybolur
    setTimeout(() => {
      const t = teras[1]; const ev = binaX(v.hayvan === 'pittiksu' ? 'pittiksu' : 'barbie', t.kisiler);
      el.classList.remove('hamle', 'zipla'); el.classList.add('yuruyor', 'gidiyor');
      let k = 0; const ad = setInterval(() => CD.spriteCiz(el._c, el._s, 2 + (k++ % 2)), 200);
      el.style.left = ev + 'px';
      setTimeout(() => { clearInterval(ad); el.remove(); delete elciEl[o.id]; if (!Object.values(elciEl).some(e => e._s === el._s)) petGizle(el._s.id, false); }, az() ? 50 : 1300);
    }, 1100);
  }

  /* ================================================================ "Ben" sayfası */
  function benSayfasi() {
    if (!CD.kim()) { CD.kimSec(false).then(() => yenile()); return; }
    const ruh = V().benimRuh();
    const izgara = CD.el('div.mh-ruh-izgara', { role: 'group', 'aria-label': 'Bugün havan nasıl?' }, V().RUHLAR.map(tur =>
      CD.el('button.mh-ruh-sec', { type: 'button', 'aria-pressed': ruh === tur ? 'true' : 'false', onclick: () => ruhSec(tur) }, [CD.el('span.mh-ruh-ikon', { 'aria-hidden': 'true', html: ruhSimge(tur) }), CD.el('span', RUH_AD[tur])])));
    const uyuyor = V().benUyuyor();
    const uykuD = CD.el('button.dugme.tam.mh-uyku-dugme', { type: 'button', onclick: () => uykuSec(!uyuyor) }, uyuyor ? '☀ Uyandım' : '🌙 Uyuyorum');
    const bulut = V().aktif();
    let hediye = 'opucuk';
    const hediyeSec = CD.el('div.cipler.mh-hediye', { role: 'radiogroup', 'aria-label': 'Ne bıraksın?' }, [['opucuk', 'Öpücük 💋'], ['isirik', 'Şakacı ısırık 🦷']].map(([k, ad]) => {
      const c = CD.el('button.cip', { type: 'button', role: 'radio', 'aria-checked': k === hediye ? 'true' : 'false', 'aria-selected': k === hediye ? 'true' : 'false', onclick: () => { hediye = k; hediyeSec.querySelectorAll('.cip').forEach(x => { const s = x === c; x.setAttribute('aria-checked', s); x.setAttribute('aria-selected', s); }); CD.ses.tik(); } }, ad);
      return c;
    }));
    const elciGonder = (hayvan) => {
      V().gonder('elci', { hayvan, hediye });
      CD.sheetKapat(); CD.toast((hayvan === 'pittiksu' ? 'Pıttıksu' : 'Barbie') + ' yola çıktı ' + (hediye === 'isirik' ? '🦷' : '💋'));
      const m = teras[1] && teras[1].motor; const p = m && m.petler.find(x => x.id === hayvan);
      if (p) { p.uyan(); p.zipla(520); setTimeout(() => p.git(teras[1].petAlan.clientWidth), 400); }
    };
    const k = CD.el('div.dikey.mh-ben', [
      izgara,
      CD.el('hr.mh-ayrac'),
      uykuD,
      CD.el('hr.mh-ayrac'),
      CD.el('div.dikey', [
        CD.el('div.kalin', 'Elçi gönder'),
        bulut ? null : CD.el('p.sessiz', 'Bulut açık olunca elçi karşı telefona gidebilir.'),
        CD.el('div.izgara-2', [
          CD.el('button.dugme-ikincil', { type: 'button', disabled: !bulut, onclick: () => elciGonder('pittiksu') }, '🐱 Pıttıksu\'yu gönder'),
          CD.el('button.dugme-ikincil', { type: 'button', disabled: !bulut, onclick: () => elciGonder('barbie') }, '🐶 Barbie\'yi gönder')
        ]),
        CD.el('div.sessiz', 'Ne bıraksın?'), hediyeSec
      ]),
      CD.el('hr.mh-ayrac'),
      CD.el('button.dugme-ikincil.tam', { type: 'button', disabled: !bulut, onclick: () => notSaklaSayfasi() }, '📌 Bir binaya not sakla')
    ]);
    CD.sheet(k, { baslik: 'Bugün havan nasıl?' });
  }
  function ruhSec(tur) {
    CD.ses.ruhSec();
    V().ruhSec(tur);
    yenile();
    if (tur === 'firtina') {
      CD.sheetKapat();
      setTimeout(() => { binayaKay('ofke'); }, 360);
      return;
    }
    // sayfadaki seçimi güncelle
    document.querySelectorAll('.mh-ruh-sec').forEach((b, i) => b.setAttribute('aria-pressed', V().RUHLAR[i] === tur ? 'true' : 'false'));
    CD.toast(RUH_AD[tur] + ' seçildi');
  }
  function uykuSec(uyu) {
    V().uyku(uyu);
    CD.sheetKapat();
    if (uyu) { CD.toast('İyi uykular 🌙'); CD.ses.ninni(); }
    else { CD.toast('Günaydın ☀'); CD.ses.uyandim(); }
    yenile();
  }

  /* ---------------------------------------------------------------- saklı not sakla */
  function notSaklaSayfasi() {
    let secili = null;
    const benim = new Set(V().bekleyenNotlarim().map(n => n.bina));
    const sayac = CD.el('span.sessiz', '0/140');
    const kutu = CD.el('textarea.girdi', { maxlength: '140', rows: '3', 'aria-label': 'Not', placeholder: 'Ona küçük bir not…' });
    const sakla = CD.el('button.dugme.tam', { type: 'button', disabled: true }, 'Sakla');
    const kontrol = () => { sayac.textContent = kutu.value.length + '/140'; sakla.disabled = !(secili && kutu.value.trim()); };
    kutu.addEventListener('input', kontrol);
    const cipler = CD.el('div.cipler.mh-not-cipler', { role: 'radiogroup', 'aria-label': 'Hangi bina?' }, BOLUMLER.map(id => {
      const c = CD.el('button.cip', { type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-selected': 'false', onclick: () => {
        secili = id; cipler.querySelectorAll('.cip').forEach(x => { const s = x === c; x.setAttribute('aria-checked', s); x.setAttribute('aria-selected', s); }); CD.ses.tik(); kontrol();
      } }, (benim.has(id) ? '📌 ' : '') + BINA[id].ad);
      return c;
    }));
    sakla.addEventListener('click', () => {
      if (!secili) return;
      const vardi = benim.has(secili);
      if (V().notSakla(secili, kutu.value)) { CD.sheetKapat(); CD.ses.parilti(); CD.toast(vardi ? 'Eski notun yerine yenisi saklandı 📌' : 'Not saklandı 📌'); yenile(); }
    });
    CD.sheet(CD.el('div.dikey', [
      CD.el('p.sessiz', 'Hangi binaya saklayalım? ' + (V().karsi() ? adi(V().karsi()) + ' o binaya girince not düşer.' : '')),
      cipler, kutu, CD.el('div.satir.arasi', [CD.el('span.sessiz', 'Bina başına bir not'), sayac]), sakla
    ]), { baslik: 'Bir binaya not sakla', odak: false });
  }

  /* ================================================================ günün sorusu */
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const sahte = (s) => String(s || '').replace(/\S/g, '▒');
  function karsiNotu(gun, benimVar) {
    const k = V().karsi();
    if (!k || !V().aktif()) return CD.el('div.mh-not-kart.bos', [CD.el('div.mh-not-kim', 'Karşı taraf'), CD.el('p.sessiz', V().bulut() ? 'Önce "Bu telefon kimin?" seçilmeli.' : 'Bulut açık olunca cevaplar birbirine görünür.')]);
    const c = V().cevap(k, gun), A = adi(k);
    if (!c) return CD.el('div.mh-not-kart.bos', [CD.el('div.mh-not-kim', CD.ek.nin(A) + ' cevabı'), CD.el('p.sessiz', A + ' henüz yazmadı; yazınca posta gelir 📮')]);
    if (!benimVar) {
      // bulanıklık SAHTE metinle: gerçek cevap DOM'a konmaz
      return CD.el('div.mh-not-kart.kilitli', [CD.el('div.mh-not-kim', CD.ek.nin(A) + ' cevabı'), CD.el('p.mh-not-sahte', { 'aria-hidden': 'true' }, sahte(c).slice(0, 120)), CD.el('p.sessiz', 'Önce sen yaz, sonra görürsün 🔒')]);
    }
    return CD.el('div.mh-not-kart', [CD.el('div.mh-not-kim', CD.ek.nin(A) + ' cevabı'), CD.el('p.mh-not-metin', c)]);
  }
  let soruGunT = 0;
  function soruAc(taslak) {
    if (!CD.kim()) { CD.kimSec(false).then(k => { if (k) soruAc(); }); return; }
    const gun = CD.bugun(), ben = CD.kim();
    const benim = V().cevap(ben, gun);
    const kutu = CD.el('textarea.girdi', { maxlength: '280', rows: '3', 'aria-label': 'Senin cevabın' });
    kutu.value = typeof taslak === 'string' && taslak ? taslak : benim;
    // sayfa gece yarısını açık geçerse soru da yenilenir (yazılan taslak korunur)
    clearInterval(soruGunT);
    soruGunT = setInterval(() => {
      if (!kutu.isConnected) { clearInterval(soruGunT); return; }
      if (CD.bugun() !== gun) { clearInterval(soruGunT); const t = kutu.value.trim() !== benim ? kutu.value : ''; soruAc(t); CD.toast('Yeni gün, yeni soru 📮'); }
    }, 20000);
    const karsiKap = CD.el('div.mh-karsi-kap', [karsiNotu(gun, !!benim)]);
    const kaydet = CD.el('button.dugme.kucuk', { type: 'button', onclick: () => {
      const v = kutu.value.trim(); if (!v) { CD.toast('Önce bir şey yaz 💭'); kutu.focus(); return; }
      // cevap, GÖNDERME anındaki günün sorusuna yazılır: gün değiştiyse önce yeni soru gösterilir
      if (CD.bugun() !== gun) { soruAc(kutu.value); CD.toast('Gün değişti; yeni soruya bakıp tekrar kaydet 📮', 3200); return; }
      const ilk = !V().cevap(ben, gun);
      V().cevapYaz(gun, v); CD.ses.soruKaydet();
      karsiKap.innerHTML = ''; const yeni = karsiNotu(gun, true); yeni.classList.add('netles'); karsiKap.appendChild(yeni);
      CD.toast(ilk ? 'Cevabın panoya asıldı 📮' : 'Cevabın güncellendi'); binalarGuncelle();
    } }, 'Kaydet');
    CD.sheet(CD.el('div.dikey.mh-soru', [
      CD.el('p.mh-soru-metin', '"' + V().soru(gun) + '"'),
      CD.el('div.mh-not-kart.benim', [CD.el('label.mh-not-kim', 'Senin cevabın'), kutu, CD.el('div.satir.arasi', [CD.el('span.sessiz', 'Gün bitene kadar düzenleyebilirsin'), kaydet])]),
      karsiKap,
      CD.el('button.dugme-hayalet.tam', { type: 'button', onclick: arsivAc }, 'Geçmiş sorular')
    ]), { baslik: 'Günün sorusu · ' + CD.tarihYaz(gun), odak: false });
  }
  function arsivAc() {
    const ben = CD.kim(), k = V().karsi();
    const a = V().cevaplar(ben), b = k ? V().cevaplar(k) : {};
    const sinir = V().gunNo(CD.bugun()) - V().SORU_GUN;     // arşiv en fazla son 120 gün
    const gunler = [...new Set(Object.keys(a).concat(Object.keys(b)))].filter(g => /^\d{4}-\d{2}-\d{2}$/.test(g) && (a[g] || b[g]) && V().gunNo(g) >= sinir).sort().reverse();
    const liste = CD.el('div.dikey.mh-arsiv');
    let ay = '';
    if (!gunler.length) liste.appendChild(CD.el('div.bos-durum', [CD.el('div.buyuk', '📮'), CD.el('p', 'Henüz cevaplanmış soru yok. Bugünküyle başlayalım mı?')]));
    gunler.forEach(g => {
      const [y, m] = g.split('-').map(Number); const ayAd = AYLAR[m - 1] + ' ' + y;
      if (ayAd !== ay) { ay = ayAd; liste.appendChild(CD.el('h3.mh-arsiv-ay', ayAd)); }
      const benimV = typeof a[g] === 'string' ? a[g] : '';
      const satir = CD.el('div.mh-arsiv-gun', [CD.el('div.mh-arsiv-bas', [CD.el('span.mh-arsiv-tarih', CD.tarihYaz(g)), CD.el('span', '"' + V().soru(g) + '"')])]);
      const notlar = CD.el('div.mh-arsiv-notlar');
      if (benimV) notlar.append(CD.el('div.mh-not-kart', [CD.el('div.mh-not-kim', 'Sen'), CD.el('p.mh-not-metin', benimV)]), karsiNotu(g, true));
      else {
        const yaz = CD.el('button.dugme-hayalet', { type: 'button', onclick: () => {
          const kutu = CD.el('textarea.girdi', { maxlength: '280', rows: '2', 'aria-label': 'Cevabın' });
          const kay = CD.el('button.dugme.kucuk', { type: 'button', onclick: () => { if (!kutu.value.trim()) return; V().cevapYaz(g, kutu.value); CD.ses.soruKaydet(); arsivAc(); } }, 'Kaydet');
          notlar.innerHTML = ''; notlar.append(CD.el('div.mh-not-kart.benim', [kutu, kay]), karsiNotu(g, false)); kutu.focus();
        } }, 'Şimdi cevapla');
        notlar.append(CD.el('p.sessiz', ['Sen cevaplamadın · ', yaz]), karsiNotu(g, false));
      }
      satir.appendChild(notlar);
      liste.appendChild(satir);
    });
    CD.sheet(CD.el('div.dikey', [liste, CD.el('button.dugme-ikincil.tam', { type: 'button', onclick: soruAc }, '‹ Bugünün sorusu')]), { baslik: 'Geçmiş sorular', odak: false });
  }

  /* ================================================================ ana ekrana ekle + gizlilik */
  function kurulum() {
    const k = ui.kurulum; if (!k) return;
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (standalone || CD.depo.al('kurulum.kapali', false) || location.protocol === 'file:') return;
    const ios = /apple/i.test(navigator.vendor || '') && ('ontouchend' in document);
    const m = $('#kurulumMetin');
    if (m) m.textContent = ios ? 'Safari\'de Paylaş düğmesi → "Ana Ekrana Ekle" dersen Pıttıksu hep bir dokunuş uzakta olur.' : 'Tarayıcı menüsünden "Ana ekrana ekle" dersen Pıttıksu hep bir dokunuş uzakta olur.';
    k.hidden = false;
    $('#kurulumKapat').addEventListener('click', () => { k.hidden = true; CD.depo.yaz('kurulum.kapali', true); });
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); CD.kurulumIstegi = e;
      if (m) m.textContent = 'Dokun: Pıttıksu ana ekranına yerleşsin.'; k.style.cursor = 'pointer';
      k.addEventListener('click', ev => { if (ev.target.id === 'kurulumKapat') return; try { e.prompt(); } catch (err) {} });
    });
  }
  function gizlilikYaz() {
    if (!ui.gizlilik) return;
    let odaVar = false; try { odaVar = !!localStorage.getItem('cd.senk.oda'); } catch (e) {}
    const bulut = !!(CD.senk && ((CD.senk.acik) || (CD.senk.kurulu && CD.senk.kurulu() && odaVar && !CD.senk.durdu)));
    ui.gizlilik.textContent = bulut
      ? 'Kayıtların bu telefonda ve ikimizin gizli bulut odasında saklanır; başka hiçbir yere gönderilmez.'
      : 'Her şey bu telefonda kalır; hiçbir yere gönderilmez.';
  }

  /* ================================================================ yenileme */
  let yenileT = 0;
  function yenile() {
    if (!kuruldu) return;
    cancelAnimationFrame(yenileT);
    yenileT = requestAnimationFrame(() => {
      try { selam(); gokGuncelle(); seritGuncelle(); binalarGuncelle(); kisilerYerlestir(false); elcileriYerlestir(); }
      catch (e) { console.warn('[mahalle]', e); }
    });
  }
  function gorunurluk() {
    const gorunur = kuruldu && !kok.hidden && !document.body.classList.contains('giris-acik');
    motorlar().forEach(m => m.goster(gorunur));
    if (gorunur) petleriKur();
  }

  let sonBolum = null;
  CD.mahalle = { yenile, soruAc, evineKay, binayaKay, benSayfasi };
  CD.hazir(() => {
    kur(); selam(); gizlilikYaz();
    yenile();
    CD.olay.dinle('senk:acildi', () => { gizlilikYaz(); yenile(); });
    CD.olay.dinle('kaydet', () => yenile());
    CD.olay.dinle('hava', () => yenile());
    CD.olay.dinle('kim', () => { kisiDurum.cemre = kisiDurum.ahmet = null; yenile(); });
    CD.olay.dinle('varlik:degisti', () => yenile());
    CD.olay.dinle('senk:yenilendi', () => yenile());
    CD.olay.dinle('bolum:kapandi', (id) => { sonBolum = id; });
    CD.olay.dinle('hub:acildi', () => {
      yenile(); gorunurluk();
      // bölümden dönünce o binanın önündesin; oraya kay
      if (sonBolum && hucre[sonBolum]) { const id = sonBolum; requestAnimationFrame(() => requestAnimationFrame(() => { const h = hucre[id]; if (h) h.hucre.scrollIntoView({ block: 'center' }); kisilerYerlestir(true); })); }
      sonBolum = null;
    });
    CD.olay.dinle('bolum:acildi', gorunurluk);
    CD.olay.dinle('giris:basladi', gorunurluk);
    CD.olay.dinle('giris:bitti', () => { gorunurluk(); yenile(); setTimeout(() => motorlar().forEach(m => m.sevin()), 500); });
    CD.olay.dinle('posta:geldi', (d) => {
      if (!d || !d.o) return;
      if (d.o.tur === 'elci' && !kok.hidden) yuruyecek = d.o.id;
      yenile();
    });
    setInterval(selam, 60000);
    gorunurluk();
  });
})();
