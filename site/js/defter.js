/* defter.js — Hatıra Defteri: pul API'si, kilitler/ödüller, ay özeti hesabı, yokken gelen hediyeler (V2 Faz 3).
   PUL: CD.pul(tur, { kisa, say, kazanan }) → true (sayıldı) | false (o türün bugünkü sınırı doldu / tanınmayan durum).
     - Ekleyen CD.kim() (seçilmemişse 'tek'). Kişi YALNIZ kendi anahtarına yazar: cd.defter.pul.<kim>.
     - Tür başına günlük sınır (spam yok). Sınırı aşan pul sayılmaz ama ay özeti sayaçlarına (kalp adedi, ruh hali, oyun) yine işlenir.
     - Sıkıştırılmış kayıt (senk satırı şişmesin):
         { v:1, top:{kod:n}            ← tür başına toplam (hiç budanmaz; seviye ve kilitler bundan)
               d0:gunNo, d:'a3|0b|…'   ← son 120 günün gün gün tür sayıları (gün başına bir parça; iki türün sayısı tek base36 harfte)
               s:[[dakika, kod, kisa]] ← son 24 pulun kısa metni
               ay:{'2026-11':{p,t,r,o,b,eg}} ← son 14 ayın özet sayaçları
               od:'10,25'              ← bu kişinin gördüğü eşik kartları   ag:'2026-10' ← gördüğü son ay özeti }
   CD.pul.iz('bakim', 'pittiksu') → pul değil, yalnız ay özeti sayacı (hayvan bakımı).
   KİLİTLER: iki kişinin pullarının toplamı (her telefonda aynı) eşikleri geçince ödüller açılır; açılış kartı kişi başına bir kez.
   MAHALLE: CD.defter.acik(id) · acikler() · dekorlar() · aksesuarlar(kim) · petAksesuarlar(h) · disarida(h) · svg(id)
     + <html data-defter="cesme fener …" data-defter-disari="pittiksu barbie">; mahalleye kendi katmanını ekler (mahalle.js'e dokunmadan).
   HEDİYELER: Cemre birkaç saat açmazsa Pıttıksu ve Barbie gezmeye çıkar; dönünce kapıda hediye (yalnız açılışta, bildirim yok).
     cd.defter.hediye.cemre = { k:{esya:n}, kapi:[[t,esya,hayvan]], son:[[t,esya,hayvan,not]], nk:'notId,…' }
     cd.defter.hediyeNot.ahmet = { id, metin, t }   ← Ahmet'in bir sonraki hediyeye gizli notu */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const GUN_TUT = 120, SON_TUT = 16, AY_TUT = 13;
  const ESIKLER = [10, 25, 50, 100, 200, 365, 500, 1000];
  const DISARI_SAAT = 3;                       // bu kadar saat açılmazsa hayvanlar gezmeye çıkar
  const SON_ACIK = 'cihaz.defter.sonAcik';     // bu cihazda uygulamanın son görünür olduğu an (senklenmez)

  /* ================================================================ pul türleri (kod tek harf; sınır = günde en çok) */
  const TURLER = {
    kalp:          { k: 'k', ad: 'Kalp', sinir: 5, cizim: 'kalp' },
    yagmur:        { k: 'y', ad: 'Emoji yağmuru', sinir: 3, cizim: 'yagmur' },
    elci:          { k: 'e', ad: 'Elçi', sinir: 2, cizim: 'pati' },
    not:           { k: 'n', ad: 'Saklı not', sinir: 2, cizim: 'not' },
    muhur:         { k: 'm', ad: 'Okundu mührü', sinir: 3, cizim: 'muhur' },
    soru:          { k: 's', ad: 'Günün sorusu', sinir: 1, cizim: 'soru' },
    ruh:           { k: 'r', ad: 'Ruh hali', sinir: 2, cizim: 'gunes' },
    uyku:          { k: 'u', ad: 'Uyku', sinir: 2, cizim: 'uyku' },
    iyigece:       { k: 'g', ad: 'İyi geceler', sinir: 1, cizim: 'ay' },
    yildiz:        { k: 'Y', ad: 'Yıldızlı gece', sinir: 1, cizim: 'yildiz' },
    bakim:         { k: 'B', ad: 'Ortak bakım', sinir: 2, cizim: 'mama' },
    elele:         { k: 'E', ad: 'El ele', sinir: 2, cizim: 'ikikalp' },
    tahta:         { k: 't', ad: 'Çizim', sinir: 3, cizim: 'palet' },
    oyun:          { k: 'o', ad: 'Oyun', sinir: 5, cizim: 'xo' },
    kaset:         { k: 'c', ad: 'Sesli not', sinir: 3, cizim: 'kaset' },
    sonfoto:       { k: 'f', ad: 'Son foto', sinir: 2, cizim: 'foto' },
    'sarki-ikizi': { k: 'i', ad: 'Şarkı ikizi', sinir: 2, cizim: 'notalar' },
    'zarf-acildi': { k: 'z', ad: 'Açılan zarf', sinir: 3, cizim: 'zarf' },
    kapsul:        { k: 'K', ad: 'Zaman kapsülü', sinir: 2, cizim: 'kumsaati' },
    minnet:        { k: 'M', ad: 'Minnet', sinir: 3, cizim: 'lale' },
    ilk:           { k: 'I', ad: 'Bir ilk', sinir: 3, cizim: 'parilti' },
    'ani-harita':  { k: 'h', ad: 'Anı haritası', sinir: 3, cizim: 'igne' },
    yapildi:       { k: 'd', ad: 'Yapıldı', sinir: 3, cizim: 'tik' },
    kavanoz:       { k: 'v', ad: 'Anı kavanozu', sinir: 3, cizim: 'kavanoz' },
    test:          { k: 'T', ad: 'Bizi ne kadar tanıyorsun', sinir: 2, cizim: 'pano' },
    'soru-evet':   { k: 'S', ad: 'Evet dedik', sinir: 2, cizim: 'kalptik' },
    sarki:         { k: 'a', ad: 'Şarkı', sinir: 2, cizim: 'nota' },
    hediye:        { k: 'H', ad: 'Yokken gelen hediye', sinir: 3, cizim: 'kutu' },
    diger:         { k: 'x', ad: 'Hatıra', sinir: 3, cizim: 'yildizmor' }
  };
  const KOD = {}; Object.keys(TURLER).forEach(t => { KOD[TURLER[t].k] = t; });

  /* ================================================================ pixel çizimler (sanat içi renkler serbest; sözleşme §9) */
  const PAL = {
    k: '#E8577A', p: '#FF9DB4', w: '#FFFDF7', y: '#F5C84A', o: '#F29B5B', b: '#6FA8DC', B: '#3F6B82', g: '#7CCB9A', G: '#3E8B62',
    l: '#C7B4F0', L: '#7E62C4', n: '#9C6B4E', N: '#C89B7B', d: '#3B2A3A', s: '#A7ADBB', c: '#A9D6F2', r: '#FF7A7A', m: '#FFE28A'
  };
  const CIZIM = {
    kalp: ['.kk...kk.', 'kwkk.kkkk', 'kpkkkkkkk', 'kkkkkkkkk', '.kkkkkkk.', '..kkkkk..', '...kkk...', '....k....'],
    yagmur: ['..sss....', '.swwws.s.', 'swwwwwsws', 'swwwwwwws', '.sssssss.', '..p..y...', '.p..y..p.', 'y..p..y..'],
    pati: ['..nn.nn..', '..nn.nn..', 'nn.....nn', 'nn.nnn.nn', '..nnnnn..', '.nnnnnnn.', '.nnnnnnn.', '..nnnnn..'],
    not: ['....kk...', '...kkkk..', '.yyykkyy.', '.yyyyyyy.', '.ydddddy.', '.yyyyyyy.', '.ydddyyy.', '.yyyyyyy.'],
    muhur: ['..kkkkk..', '.kkkkkkk.', 'kkpkkkpkk', 'kpppkpppk', 'kpppppppk', 'kkpppppkk', '.kkpppkk.', '..kkkkk..'],
    soru: ['..LLLLL..', '.LL...LL.', '......LL.', '.....LL..', '....LL...', '....LL...', '.........', '....LL...'],
    gunes: ['....y....', '.y..y..y.', '..yyyyy..', '..yoooy..', 'yyyoooyyy', '..yoooy..', '..yyyyy..', '.y..y..y.', '....y....'],
    uyku: ['.....bbbb', '.......b.', '......b..', '.....bbbb', 'BBBB.....', '...B.....', '..B......', '.B.......', 'BBBB.....'],
    ay: ['...yyy...', '..yy...w.', '.yy.....', '.yy..w...', '.yy......', '.yy......', '..yy.....', '...yyy...'],
    yildiz: ['....y....', '...yyy...', 'yyyyyyyyy', '.yyyoyyy.', '..yyyyy..', '..yy.yy..', '.yy...yy.', '.y.....y.'],
    mama: ['..k...k..', '.kkk.kkk.', '..kkkkk..', '....k....', '.NNNNNNN.', 'bbbbbbbbb', '.bbbbbbb.', '..bbbbb..'],
    ikikalp: ['pp.pp.....', 'ppppp.kk.kk', 'ppppppkkkkk', '.pppppkkkk.', '..ppp.kkk..', '...p...k...'],
    palet: ['...NNNN..', '.NNNNNNN.', 'NNkNNbNNN', 'NNNNNNNyN', 'NN..NNNNN', 'NN..NNgNN', '.NNNNNNN.', '..NNNN...'],
    xo: ['k...k....', '.k.k.....', '..k......', '.k.k.....', 'k...k....', '.....BBB.', '....B...B', '....B...B', '.....BBB.'],
    kaset: ['ddddddddd', 'dpppppppd', 'dpdwpwdpd', 'dpwdpdwpd', 'dpppppppd', 'dd.....dd', 'ddddddddd'],
    foto: ['..ddd....', 'ddddddddd', 'dsssssssd', 'dssBBBssd', 'dssBcBssd', 'dssBBBssd', 'dsssssssd', 'ddddddddd'],
    notalar: ['...LLLLLL', '...L....L', '...L....L', '...L....L', '.LLL..LLL', 'LLLL.LLLL', '.LL...LL.'],
    zarf: ['....k....', '...kkk...', '....k....', 'wwwwwwwww', 'wswwwwwsw', 'wwswwwsww', 'wwwswswww', 'wwwwswwww', 'wwwwwwwww'],
    kumsaati: ['NNNNNNN', '.y...y.', '..yyy..', '...y...', '..y.y..', '.yyyyy.', 'NNNNNNN'],
    lale: ['.p.p.p.', '.ppppp.', '.ppypp.', '.ppppp.', '...g...', 'gg.g...', '.ggg.gg', '...ggg.', '...g...'],
    parilti: ['....y....', '....y....', '...yyy...', 'yyyywyyyy', '...yyy...', '....y....', '....y....'],
    igne: ['..kkkkk..', '.kkkkkkk.', '.kkwwwkk.', '.kkwwwkk.', '.kkkkkkk.', '..kkkkk..', '...kkk...', '....k....'],
    tik: ['........G', '.......GG', '......GG.', 'G....GG..', 'GG..GG...', '.GGGG....', '..GG.....'],
    kavanoz: ['..NNNNN..', '..sssss..', '.swwwwws.', '.swywpws.', '.swwywws.', '.swpwyws.', '.swwwwws.', '..sssss..'],
    pano: ['...ddd...', '.NNdNdNN.', '.NwwwwwN.', '.NwkwkwN.', '.NwwwwwN.', '.NwLLLwN.', '.NwwwwwN.', '.NNNNNNN.'],
    kalptik: ['.kk...kk.', 'kkkk.kkkk', 'kkkkkkkwk', 'kkkkkkwkk', '.kwkkwkk.', '..kwwkk..', '...kkk...', '....k....'],
    nota: ['....LL...', '....LLL..', '....L.LL.', '....L..L.', '....L....', '..LLL....', '.LLLL....', '.LLL.....'],
    kutu: ['..k...k..', '...k.k...', 'lllkkklll', 'lllkkklll', '.llkkkll.', '.llkkkll.', '.llkkkll.', '.llkkkll.'],
    yildizmor: ['....l....', '...lll...', 'lllllllll', '.lllLlll.', '..lllll..', '..ll.ll..', '.ll...ll.'],
    /* mahalle dekorları */
    cicek: ['.p...k...y.', 'pyp.kyk.yoy', '.p...k...y.', '.g.g.g.g.g.', 'gggggggggg.', 'NNNNNNNNNNN', 'nnnnnnnnnnn'],
    fener: ['..ddd..', '.ddddd.', '.dmmmd.', '.dmymd.', '.dmmmd.', '.ddddd.', '...d...', '...d...', '...d...', '...d...', '...d...', '..ddd..'],
    bank: ['nnnnnnnnnnnn', 'NNNNNNNNNNNN', 'nnnnnnnnnnnn', 'NNNNNNNNNNNN', '.d........d.', '.d........d.'],
    cesme: ['....c....', '...c.c...', '..c.s.c..', '....s....', '.ssssssss', 'sccccccss', 'ssssssss.', '..ssss...', '..ssss...'],
    ucurtma: ['...k...', '..kpk..', '.kpppk.', 'kpppppk', '.kpppk.', '..kpk..', '...k...', '...d...', '..d....', '...d...', '....y..'],
    kurekure: ['..ccccc..', '.cwcccwc.', 'cccwcccwc', 'ccGGGGccc', 'cwcGGGcwc', '.cccnccc.', '..NNNNN..', '.NNNNNNN.'],
    balon: ['.kk..b.', 'kkkkbbb', 'kkkkbbb', '.kk..b.', '..d.d..', '...d...', '...d...', '...d...'],
    gokkusagi: ['...kkkkkk...', '..kooooook..', '.koyyyyyyok.', 'koyggggggyok', 'koyg....gyok', 'koyg....gyok'],
    /* karakter aksesuarları (karakter sprite'ının üstüne biner) */
    sapka: ['...LLLL...', '..LLLLLL..', '..LkkkkL..', 'LLLLLLLLLL'],
    atki: ['kpkpkpkpkp', 'pkpkpkpkpk', '......kp..', '......pk..'],
    fiyonk: ['kk..kk', 'kkkkkk', 'kk..kk'],
    gozluk: ['dddd.dddd', 'dccd.dccd', 'dddddddd.'],
    /* hayvan aksesuarları */
    zil: ['kkkkkk', '..yy..', '.yyyy.', '..yy..'],
    petfiyonk: ['pp.pp', 'ppkpp', 'pp.pp'],
    tac: ['y.y.y', 'yyyyy', 'ykyby']
  };
  function piksel(ad, sinif, etiket) {
    const g = CIZIM[ad] || CIZIM.yildizmor;
    const w = Math.max.apply(null, g.map(r => r.length)), h = g.length;
    let r = '';
    g.forEach((satir, y) => {
      let x = 0;
      while (x < satir.length) {
        const c = satir[x]; if (c === '.' || !PAL[c]) { x++; continue; }
        let n = 1; while (satir[x + n] === c) n++;
        r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + PAL[c] + '"/>';
        x += n;
      }
    });
    return '<svg class="' + (sinif || 'defter-piksel') + '" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" shape-rendering="crispEdges" ' +
      (etiket ? 'role="img" aria-label="' + CD.kacir(etiket) + '"' : 'aria-hidden="true" focusable="false"') + '>' + r + '</svg>';
  }

  /* ================================================================ ödüller */
  const ODULLER = [
    { id: 'cicek', esik: 10, tur: 'dekor', ad: 'Çiçek tarhı', alt: 'Meydanın kenarına', cizim: 'cicek', teras: 'bizim', yer: { left: '3%' } },
    { id: 'mektup0', esik: 10, tur: 'mektup', ad: 'Gizli mektup 1', cizim: 'zarf', no: 0 },
    { id: 'fener', esik: 25, tur: 'dekor', ad: 'Sokak feneri', alt: 'Postane köşesine', cizim: 'fener', teras: 'postane', yer: { right: '4%' } },
    { id: 'zil', esik: 25, tur: 'hayvan', ad: 'Pıttıksu\'ya zilli tasma', hayvan: 'pittiksu', cizim: 'zil' },
    { id: 'sapka', esik: 50, tur: 'karakter', ad: 'İkinize şapka', cizim: 'sapka' },
    { id: 'bank', esik: 50, tur: 'dekor', ad: 'Bahçe bankı', alt: 'Bahçenin önüne', cizim: 'bank', teras: 'bahce', yer: { left: '30%' } },
    { id: 'mektup1', esik: 50, tur: 'mektup', ad: 'Gizli mektup 2', cizim: 'zarf', no: 1 },
    { id: 'cesme', esik: 100, tur: 'dekor', ad: 'Küçük çeşme', alt: 'Müze meydanına', cizim: 'cesme', teras: 'muze', yer: { left: '46%' } },
    { id: 'petfiyonk', esik: 100, tur: 'hayvan', ad: 'Barbie\'ye fiyonk', hayvan: 'barbie', cizim: 'petfiyonk' },
    { id: 'atki', esik: 200, tur: 'karakter', ad: 'İkinize atkı', cizim: 'atki' },
    { id: 'ucurtma', esik: 200, tur: 'dekor', ad: 'Uçurtma', alt: 'El Ele Bankı\'nın önüne', cizim: 'ucurtma', teras: 'elele', yer: { left: '6%' } },
    { id: 'mektup2', esik: 200, tur: 'mektup', ad: 'Gizli mektup 3', cizim: 'zarf', no: 2 },
    { id: 'kurekure', esik: 365, tur: 'dekor', ad: 'Kar küresi', alt: 'Plak dükkânının vitrinine', cizim: 'kurekure', teras: 'plak', yer: { left: '4%' } },
    { id: 'gozluk', esik: 365, tur: 'karakter', ad: 'İkinize gözlük', cizim: 'gozluk' },
    { id: 'tac', esik: 500, tur: 'hayvan', ad: 'İki minik taç', hayvan: 'ikisi', cizim: 'tac' },
    { id: 'balon', esik: 500, tur: 'dekor', ad: 'Balonlar', alt: 'Güzellik Salonu\'nun önüne', cizim: 'balon', teras: 'guzellik', yer: { left: '26%' } },
    { id: 'mektup3', esik: 500, tur: 'mektup', ad: 'Gizli mektup 4', cizim: 'zarf', no: 3 },
    { id: 'gokkusagi', esik: 1000, tur: 'dekor', ad: 'Gökkuşağı kemeri', alt: 'Oyun Salonu\'nun önüne', cizim: 'gokkusagi', teras: 'xox', yer: { left: '40%' } },
    { id: 'fiyonk', esik: 1000, tur: 'karakter', ad: 'İkinize fiyonk', cizim: 'fiyonk' },
    { id: 'mektup4', esik: 1000, tur: 'mektup', ad: 'Gizli mektup 5', cizim: 'zarf', no: 4 }
  ];
  const SEVIYELER = ['Yeni defter', 'İlk sayfalar', 'Pul meraklısı', 'Dolu sayfalar', 'Hatıra ustası', 'Kalın defter', 'Bir yıllık defter', 'Altın kenarlı defter', 'Efsane defter'];

  /* ================================================================ yardımcılar */
  const ben = () => CD.kim() || 'tek';
  const V = () => CD.varlik;
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const gunNo = (g) => { const [y, m, d] = String(g).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
  const gundenIso = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
  const bugunNo = () => gunNo(CD.bugun());
  const ayAnahtar = (d) => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const nesne = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  const dizi = (v) => Array.isArray(v) ? v : [];
  function adi(k) { return k === 'tek' ? 'Sen' : CD.kimAdi(k); }

  /* ================================================================ kayıt */
  const anahtar = (k) => 'defter.pul.' + k;
  function bos() { return { v: 1, top: {}, d0: 0, d: '', s: [], ay: {}, od: '', ag: '' }; }
  function oku(k) {
    const v = CD.depo.al(anahtar(k), null);
    if (!v || typeof v !== 'object' || v.v !== 1) return bos();
    return { v: 1, top: nesne(v.top), d0: Number(v.d0) || 0, d: typeof v.d === 'string' ? v.d : '', s: dizi(v.s), ay: nesne(v.ay), od: String(v.od || ''), ag: String(v.ag || '') };
  }
  /* gün parçası: türler TURLER sırasıyla ikişer ikişer; (a*6+b) tek base36 harf (günlük sınır ≤5 olduğu için sığar), sondaki '0'lar atılır */
  const SIRA = Object.keys(TURLER).map(t => TURLER[t].k);
  const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  function parcaCoz(p) {
    const o = {}; p = String(p || '');
    for (let i = 0; i < p.length; i++) { const v = B36.indexOf(p[i]); if (v <= 0) continue; const a = Math.floor(v / 6), b = v % 6; if (a && SIRA[i * 2]) o[SIRA[i * 2]] = a; if (b && SIRA[i * 2 + 1]) o[SIRA[i * 2 + 1]] = b; }
    return o;
  }
  function parcaYaz(o) {
    let s = '';
    for (let i = 0; i < SIRA.length; i += 2) { const a = Math.min(5, o[SIRA[i]] || 0), b = Math.min(5, o[SIRA[i + 1]] || 0); s += B36[a * 6 + b]; }
    return s.replace(/0+$/, '');
  }
  /* gün parçaları: { gunNo: {kod:n} } */
  function gunler(r) {
    const o = {}; if (!r.d0) return o;
    r.d.split('|').forEach((p, i) => { if (p) o[r.d0 + i] = parcaCoz(p); });
    return o;
  }
  function yazKayit(k, r) {
    // budama: 120 gün, 24 kısa metin, 14 ay
    const parca = r.d ? r.d.split('|') : [];
    const son = bugunNo();
    if (r.d0 && parca.length && r.d0 + parca.length - 1 > son + 2) { /* saat ileri kaymış: dokunma */ }
    while (parca.length > GUN_TUT) { parca.shift(); r.d0++; }
    while (parca.length && !parca[0]) { parca.shift(); r.d0++; }
    if (!parca.length) r.d0 = 0;
    r.d = parca.join('|');
    r.s = r.s.slice(-SON_TUT);
    const aylar = Object.keys(r.ay).sort();
    aylar.slice(0, Math.max(0, aylar.length - AY_TUT)).forEach(a => delete r.ay[a]);
    CD.depo.yaz(anahtar(k), r);
  }
  function gunEkle(r, gn, kod) {
    let parca = r.d ? r.d.split('|') : [];
    if (!r.d0 || !parca.length) { r.d0 = gn; parca = ['']; }
    if (gn < r.d0) return 0;                                       // saat geri kaymış: ayrıntı yazılmaz
    while (r.d0 + parca.length - 1 < gn) parca.push('');
    const i = gn - r.d0, o = parcaCoz(parca[i]);
    o[kod] = (o[kod] || 0) + 1;
    parca[i] = parcaYaz(o);
    r.d = parca.join('|');
    return o[kod];
  }
  function gunSayisi(r, gn, kod) {
    if (!r.d0 || gn < r.d0) return 0;
    const p = r.d.split('|')[gn - r.d0]; return p ? (parcaCoz(p)[kod] || 0) : 0;
  }
  function ayKayit(r, a) { const m = nesne(r.ay[a]); ['t', 'r', 'o', 'b'].forEach(x => { m[x] = nesne(m[x]); }); m.p = Number(m.p) || 0; r.ay[a] = m; return m; }

  /* ================================================================ CD.pul */
  function pul(tur, sec) {
    try {
      sec = sec || {};
      tur = String(tur || '');
      const T = TURLER[tur] || TURLER.diger, kod = T.k;
      const k = ben(), r = oku(k), gn = bugunNo(), simdi = Date.now();
      const kisa = String(sec.kisa == null ? '' : sec.kisa).replace(/\s+/g, ' ').trim().slice(0, 24);
      const m = ayKayit(r, ayAnahtar());
      // ay özeti sayaçları: kalp adedi, emoji yağmuru, ruh hali ve oyunlar sınırdan bağımsız sayılır (gerçek dokunuş sayısı)
      const say = Math.max(1, Math.min(99, Math.round(Number(sec.say) || 1)));
      if (kod === 'k' || kod === 'y') m.t[kod] = (m.t[kod] || 0) + say;
      if (tur === 'ruh' && kisa) m.r[kisa.slice(0, 12)] = (m.r[kisa.slice(0, 12)] || 0) + 1;
      if (tur === 'oyun' && kisa) {
        const o = dizi(m.o[kisa.slice(0, 10)]).slice(0, 4); while (o.length < 4) o.push(0);
        o[0]++; const kz = sec.kazanan; if (kz === 'cemre') o[1]++; else if (kz === 'ahmet') o[2]++; else if (kz) o[3]++;
        m.o[kisa.slice(0, 10)] = o;
      }
      // günlük sınır
      if (gunSayisi(r, gn, kod) >= T.sinir) { yazKayit(k, r); return false; }
      const bugunku = gunEkle(r, gn, kod);
      r.top[kod] = (Number(r.top[kod]) || 0) + 1;
      if (kod === 'Y') m.t.Y = (m.t.Y || 0) + 1;
      m.p++;
      const gunToplam = Object.values(parcaCoz((r.d.split('|')[gn - r.d0]) || '')).reduce((a, b) => a + b, 0);
      if (!Array.isArray(m.eg) || gunToplam > (m.eg[1] || 0)) m.eg = [gn, gunToplam];
      if (kisa) r.s.push([Math.round(simdi / 60000), kod, kisa]);
      yazKayit(k, r);
      CD.olay.yay('defter:pul', { tur: TURLER[tur] ? tur : 'diger', kim: k, bugunku });
      setTimeout(kilitKontrol, 400);
      return true;
    } catch (e) { console.warn('[defter] pul', e); return false; }
  }
  pul.iz = function (ad, alt) {
    try {
      if (ad !== 'bakim' || !alt) return;
      const k = ben(), r = oku(k), m = ayKayit(r, ayAnahtar());
      const h = String(alt).slice(0, 10); m.b[h] = (m.b[h] || 0) + 1;
      yazKayit(k, r);
    } catch (e) {}
  };
  CD.pul = pul;

  /* ================================================================ okuma: iki kişinin birleşimi */
  function kisiler() {
    return CD.depo.anahtarlar().filter(a => /^defter\.pul\.[a-z]+$/.test(a)).map(a => a.slice(11));
  }
  function toplam() {
    return kisiler().reduce((t, k) => t + Object.values(oku(k).top).reduce((a, b) => a + (Number(b) || 0), 0), 0);
  }
  function kisiToplam(k) { return Object.values(oku(k).top).reduce((a, b) => a + (Number(b) || 0), 0); }
  /* sayfalar: [{ gun:'yyyy-aa-gg', no, pullar:[{tur, kod, kim, kisa}] }] (eski → yeni; yalnız pullu günler) */
  function sayfalar() {
    const o = {};
    kisiler().forEach(k => {
      const r = oku(k), g = gunler(r);
      const kisalar = {};      // gün+kod → kısa metinler
      r.s.forEach(([dk, kod, kisa]) => { if (!kisa) return; const gn = gunNo(iso(new Date(dk * 60000))); (kisalar[gn + kod] = kisalar[gn + kod] || []).push(kisa); });
      Object.keys(g).forEach(gn => {
        const s = (o[gn] = o[gn] || []);
        Object.keys(g[gn]).forEach(kod => {
          const tur = KOD[kod] || 'diger', ks = kisalar[gn + kod] || [];
          for (let i = 0; i < g[gn][kod]; i++) s.push({ tur, kod, kim: k, kisa: ks[i] || '' });
        });
      });
    });
    return Object.keys(o).map(Number).sort((a, b) => a - b).map(n => ({ no: n, gun: gundenIso(n), pullar: o[n].sort((a, b) => (a.kod < b.kod ? -1 : a.kod > b.kod ? 1 : (a.kim < b.kim ? -1 : 1))) }));
  }
  function seviye(t) {
    t = t == null ? toplam() : t;
    let i = 0; while (i < ESIKLER.length && t >= ESIKLER[i]) i++;
    return { no: i + 1, ad: SEVIYELER[i], onceki: i ? ESIKLER[i - 1] : 0, sonraki: ESIKLER[i] || null };
  }

  /* ================================================================ kilitler */
  const acikMi = (o, t) => (t == null ? toplam() : t) >= o.esik;
  function acik(id) { const o = ODULLER.find(x => x.id === id); return !!(o && acikMi(o)); }
  function acikler() { const t = toplam(); return ODULLER.filter(o => acikMi(o, t)).map(o => o.id); }
  function mektup(no) {
    const l = dizi(((CD.config || {}).DEFTER || {}).MEKTUPLAR).map(x => String(x || '').trim());
    return l[no] || '';
  }
  let kontrolT = 0;
  function kilitKontrol() {
    clearTimeout(kontrolT);
    const t = toplam();
    datasetYaz(t);
    const k = ben(), r = oku(k), gorulen = new Set(r.od.split(',').filter(Boolean).map(Number));
    const yeni = ESIKLER.filter(e => t >= e && !gorulen.has(e));
    if (!yeni.length) return;
    yeni.forEach(e => gorulen.add(e));
    r.od = [...gorulen].sort((a, b) => a - b).join(',');
    yazKayit(k, r);
    const oduller = ODULLER.filter(o => yeni.indexOf(o.esik) >= 0);
    const ust = Math.max.apply(null, yeni);
    const parca = oduller.map(o => o.tur === 'mektup' ? 'Gizli mektup' : o.ad).slice(0, 4);
    CD.olay.yay('defter:acildi', { esikler: yeni, oduller: oduller.map(o => o.id) });
    const goster = () => {
      if (CD.posta && CD.posta.kart) CD.posta.kart({ kim: V() && V().aktif() ? V().karsi() : null, tur: 'defter', baslik: 'Defterimiz ' + ust + ' pula ulaştı 📖', alt: 'Açılanlar: ' + parca.join(', '), eylem: { ad: 'Deftere bak', fn: () => CD.ac('defter') } });
      else CD.toast('Defterimiz ' + ust + ' pula ulaştı 📖', 3200);
      try { CD.ses.parilti(); } catch (e) {}
    };
    bosAnda(goster, 1200);
  }

  /* ================================================================ mahalle uygulaması (mahalle.js'e dokunmadan) */
  function datasetYaz(t) {
    const ids = ODULLER.filter(o => acikMi(o, t) && o.tur !== 'mektup').map(o => o.id);
    const s = ids.join(' ');
    if (document.documentElement.dataset.defter !== s) document.documentElement.dataset.defter = s;
    mahalleUygula();
  }
  function dekorlar() { const t = toplam(); return ODULLER.filter(o => o.tur === 'dekor' && acikMi(o, t)).map(o => ({ id: o.id, ad: o.ad, teras: o.teras, yer: o.yer, svg: piksel(o.cizim, 'defter-dekor-svg') })); }
  function aksesuarlar() { const t = toplam(); return ODULLER.filter(o => o.tur === 'karakter' && acikMi(o, t)).map(o => ({ id: o.id, ad: o.ad, svg: piksel(o.cizim, 'defter-aks-svg defter-aks-' + o.id) })); }
  function petAksesuarlar(h) { const t = toplam(); return ODULLER.filter(o => o.tur === 'hayvan' && acikMi(o, t) && (o.hayvan === h || o.hayvan === 'ikisi')).map(o => ({ id: o.id, ad: o.ad, svg: piksel(o.cizim, 'defter-paks-svg defter-paks-' + o.id) })); }
  let mahalleOtomatik = true;
  function mahalleUygula() {
    if (!mahalleOtomatik) return;
    const hub = document.getElementById('hub'); if (!hub || !hub.querySelector('.mh-teras')) return;
    // dekorlar: her terasın kaldırımına bir katman
    const d = dekorlar(), isaret = d.map(x => x.id).join(' ');
    if (hub.dataset.defterDekor !== isaret) {
      hub.querySelectorAll('.defter-dekor-katman').forEach(x => x.remove());
      d.forEach(x => {
        const ic = hub.querySelector('.mh-teras[data-ilk="' + x.teras + '"] .mh-kaldirim-ic') || hub.querySelector('.mh-teras .mh-kaldirim-ic'); if (!ic) return;
        let kat = ic.querySelector(':scope > .defter-dekor-katman');
        if (!kat) { kat = CD.el('div.defter-dekor-katman', { 'aria-hidden': 'true' }); ic.insertBefore(kat, ic.firstChild); }
        const e = CD.el('span.defter-dekor.defter-dekor-' + x.id + (x.yer && x.yer.ust ? '.ust' : ''), { html: x.svg, title: x.ad });
        if (x.yer && x.yer.left) e.style.left = x.yer.left; if (x.yer && x.yer.right) e.style.right = x.yer.right;
        kat.appendChild(e);
      });
      hub.dataset.defterDekor = isaret;
    }
    // karakter aksesuarları
    const a = aksesuarlar(), aIz = a.map(x => x.id).join(' ');
    hub.querySelectorAll('.mh-kisi').forEach(b => {
      if (b.dataset.defterAks === aIz) return;
      const eski = b.querySelector(':scope > .defter-aks'); if (eski) eski.remove();
      if (a.length) b.appendChild(CD.el('span.defter-aks', { 'aria-hidden': 'true', html: a.map(x => x.svg).join('') }));
      b.dataset.defterAks = aIz;
    });
    // hayvan aksesuarları
    hub.querySelectorAll('.pet[data-id="pittiksu"], .pet[data-id="barbie"]').forEach(p => {
      const l = petAksesuarlar(p.dataset.id), iz = l.map(x => x.id).join(' ');
      if (p.dataset.defterAks === iz) return;
      const eski = p.querySelector(':scope > .defter-paks'); if (eski) eski.remove();
      if (l.length) p.appendChild(CD.el('i.defter-paks', { 'aria-hidden': 'true', html: l.map(x => x.svg).join('') }));
      p.dataset.defterAks = iz;
    });
    disariUygula(hub);
  }

  /* ================================================================ hediyeler (yokken gelen) */
  const ESYALAR = [
    ['sariyaprak', '🍂', 'Sarı yaprak', 0], ['akcaagac', '🍁', 'Kırmızı akçaağaç yaprağı', 0], ['ruzgar', '🍃', 'Rüzgârın getirdiği yaprak', 0],
    ['cakil', '🪨', 'Pürüzsüz çakıl', 0], ['papatya', '🌼', 'Papatya', 0], ['kiraz', '🌸', 'Kiraz çiçeği', 0], ['tuy', '🪶', 'Güvercin tüyü', 0],
    ['dugme', '🔘', 'Kayıp düğme', 0], ['dal', '🌿', 'Minik dal', 0], ['kestane', '🌰', 'Parlak kestane', 0], ['kabuk', '🐚', 'Deniz kabuğu', 0],
    ['kurdele', '🎀', 'Kurdele parçası', 0], ['yun', '🧶', 'Yün ucu', 0], ['basak', '🌾', 'Başak', 0], ['mantar', '🍄', 'Minik mantar', 0],
    ['aycicegi', '🌻', 'Ayçiçeği', 0], ['odun', '🪵', 'Küçük odun parçası', 0], ['mersin', '🫐', 'Yaban mersini', 0], ['cilek', '🍓', 'Yaban çileği', 0],
    ['lale', '🌷', 'Lale yaprağı', 0],
    ['para', '🪙', 'Parlak bozuk para', 1], ['anahtar', '🔑', 'Eski minik anahtar', 1], ['igne', '🧷', 'Çengelli iğne', 1], ['kartpostal', '💌', 'Rüzgârın getirdiği kartpostal', 1],
    ['yapboz', '🧩', 'Yapboz parçası', 1], ['pastel', '🖍️', 'Pembe pastel boya', 1], ['balon', '🎈', 'Kaçmış balon', 1], ['kagityildiz', '⭐', 'Kâğıt yıldız', 1],
    ['kelebek', '🦋', 'Kelebek çıkartması', 1],
    ['yonca', '🍀', 'Dört yapraklı yonca', 2], ['denizcami', '💎', 'Deniz camı', 2], ['gokkusagi', '🌈', 'Gökkuşağı taşı', 2], ['yuzuk', '💍', 'Oyuncak yüzük', 2],
    ['aytasi', '🌙', 'Ay taşı', 2], ['ugur', '🐞', 'Uğur böceği (uçup gitmedi!)', 2]
  ].map(([id, em, ad, nadir]) => ({ id, em, ad, nadir }));
  const AGIRLIK = [10, 4, 1];
  const NADIR_AD = ['', 'az bulunur', 'çok nadir'];
  const hediyeAnahtar = 'defter.hediye.cemre';
  const notAnahtar = 'defter.hediyeNot.ahmet';
  function hediyeOku() {
    const v = nesne(CD.depo.al(hediyeAnahtar, null));
    return { k: nesne(v.k), kapi: dizi(v.kapi), son: dizi(v.son), nk: String(v.nk || '') };
  }
  function hediyeYaz(h) {
    h.kapi = h.kapi.slice(-3); h.son = h.son.slice(-20);
    h.nk = h.nk.split(',').filter(Boolean).slice(-10).join(',');
    CD.depo.yaz(hediyeAnahtar, h);
  }
  const hediyeciMi = () => { const k = CD.kim(); return k === 'cemre' || !k; };
  function esyaSec(rnd) {
    const top = ESYALAR.reduce((a, e) => a + AGIRLIK[e.nadir], 0);
    let x = rnd() * top;
    for (const e of ESYALAR) { x -= AGIRLIK[e.nadir]; if (x < 0) return e; }
    return ESYALAR[0];
  }
  /* kaç saat yoktu → kapıya hediye bırak (yalnız açılışta / uzun aradan sonra dönüşte) */
  function donus(simdi) {
    simdi = simdi || Date.now();
    const son = Number(CD.depo.al(SON_ACIK, 0)) || 0;
    CD.depo.yaz(SON_ACIK, simdi);
    if (!hediyeciMi() || !son) return 0;
    const saat = (simdi - son) / 3600000;
    if (saat < DISARI_SAAT) return 0;
    const adet = saat >= 24 ? 3 : saat >= 8 ? 2 : 1;
    const h = hediyeOku();
    const yer = Math.max(0, 3 - h.kapi.length); if (!yer) return 0;
    let tohum = (simdi ^ 0x5bd1e995) >>> 0;
    const rnd = () => { tohum = (Math.imul(tohum ^ (tohum >>> 15), 2246822519) + 0x9e3779b9) >>> 0; return (tohum % 100000) / 100000; };
    const n = Math.min(adet, yer);
    for (let i = 0; i < n; i++) h.kapi.push([Math.round(simdi / 60000) + i, esyaSec(rnd).id, rnd() < 0.5 ? 'pittiksu' : 'barbie']);
    hediyeYaz(h);
    CD.olay.yay('defter:hediye', { adet: n });
    return n;
  }
  function kapidakiler() { return hediyeciMi() ? hediyeOku().kapi.map(([dk, id, hy]) => ({ dk, esya: ESYALAR.find(e => e.id === id) || ESYALAR[0], hayvan: hy })) : []; }
  /* kapıdaki ilk hediyeyi aç → { esya, hayvan, not } */
  function hediyeAc() {
    const h = hediyeOku(); const x = h.kapi.shift(); if (!x) return null;
    const [dk, id, hy] = x;
    const esya = ESYALAR.find(e => e.id === id) || ESYALAR[0];
    h.k[esya.id] = (Number(h.k[esya.id]) || 0) + 1;
    // Ahmet'in gizli notu (henüz bulunmadıysa) bu hediyeye iliştirilir
    let not = '';
    const n = ahmetNotu();
    const kullanilan = new Set(h.nk.split(',').filter(Boolean));
    if (n && n.id && !kullanilan.has(n.id)) { not = n.metin; kullanilan.add(n.id); h.nk = [...kullanilan].join(','); if (V() && V().aktif()) V().gonder('hediyeNot', { notId: n.id }); }
    h.son.push([dk, esya.id, hy, not]);
    hediyeYaz(h);
    pul('hediye', { kisa: esya.ad });
    CD.olay.yay('defter:hediye', { acildi: esya.id });
    return { esya, hayvan: hy, not };
  }
  function koleksiyon() { const h = hediyeOku(); return { sayilar: h.k, son: h.son.map(([dk, id, hy, not]) => ({ t: dk * 60000, esya: ESYALAR.find(e => e.id === id) || ESYALAR[0], hayvan: hy, not: not || '' })) }; }
  function ahmetNotu() { const v = nesne(CD.depo.al(notAnahtar, null)); return v.id && v.metin ? { id: String(v.id), metin: String(v.metin).slice(0, 160), t: Number(v.t) || 0 } : null; }
  function notBirak(metin) {
    if (CD.kim() !== 'ahmet') return false;
    metin = String(metin || '').trim().slice(0, 160);
    if (!metin) { CD.depo.sil(notAnahtar); return true; }
    CD.depo.yaz(notAnahtar, { id: CD.kimlik(), metin, t: Date.now() });
    return true;
  }
  function notBulundu() { const n = ahmetNotu(); if (!n) return false; return hediyeOku().nk.split(',').indexOf(n.id) >= 0; }

  /* hayvanlar dışarıda mı? (Ahmet'in ekranında: Cemre birkaç saattir yoksa; Cemre'nin ekranında: hiç — o buradadır) */
  function disarida(h) {
    if (h && h !== 'pittiksu' && h !== 'barbie') return false;
    if (CD.kim() !== 'ahmet' || !V()) return false;
    const o = V().onun(); if (!o || o.hicYok || o.cevrimici) return false;
    return !!(o.sonGorulme && Date.now() - o.sonGorulme > DISARI_SAAT * 3600000);
  }
  function disariUygula(hub) {
    const d = disarida(), s = d ? 'pittiksu barbie' : '';
    if ((document.documentElement.dataset.defterDisari || '') !== s) { if (s) document.documentElement.dataset.defterDisari = s; else delete document.documentElement.dataset.defterDisari; }
    hub = hub || document.getElementById('hub'); if (!hub) return;
    const ic = hub.querySelector('.mh-teras[data-ilk="pittiksu"] .mh-kaldirim-ic');
    let tab = hub.querySelector('.defter-disari-tabela');
    if (d && ic && !tab) { tab = CD.el('span.defter-disari-tabela', { role: 'note' }, 'Gezmeye çıktık, hediyeyle döneceğiz 🍂'); ic.appendChild(tab); }
    else if (!d && tab) tab.remove();
  }

  /* ================================================================ ay özeti (Bizim Ayımız) */
  const AY_ADI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const RUH_AD = { gunes: ['Güneşli', '☀️'], parcali: ['Parçalı bulutlu', '⛅'], bulutlu: ['Bulutlu', '☁️'], yagmur: ['Yağmurlu', '🌧️'], firtina: ['Fırtınalı', '⛈️'], gokkusagi: ['Gökkuşağı', '🌈'] };
  const OYUN_AD = { xox: 'XOX', dortlu: '4\'lü Dizme', amiral: 'Amiral Battı', ciz: 'Çiz ve Tahmin Et' };
  function ayAdi(a) { const [y, m] = a.split('-').map(Number); return AY_ADI[m - 1] + ' ' + y; }
  function oncekiAy(d) { d = new Date(d || Date.now()); d.setDate(1); d.setMonth(d.getMonth() - 1); return ayAnahtar(d); }
  function aylar() {
    const s = new Set();
    kisiler().forEach(k => Object.keys(oku(k).ay).forEach(a => { if (/^\d{4}-\d{2}$/.test(a)) s.add(a); }));
    return [...s].sort().reverse();
  }
  function kiloBul(bolum, a) {
    try {
      const g = CD.depo.al(bolum + '.gunluk', null); const l = dizi(g && g.kilolar).filter(x => x && String(x.t).slice(0, 7) === a).sort((x, y) => (x.t < y.t ? -1 : 1));
      return l.length ? { ilk: Number(l[0].g) || 0, son: Number(l[l.length - 1].g) || 0, adet: l.length } : null;
    } catch (e) { return null; }
  }
  function ayOzeti(a) {
    const o = { ay: a, ad: ayAdi(a), pul: 0, kalp: 0, yagmur: 0, ruh: {}, oyun: {}, bakim: {}, enGun: null, yildiz: 0, kisiler: {} };
    const gunTop = {};
    let egYedek = null;
    kisiler().forEach(k => {
      const r = oku(k), m = nesne(r.ay[a]);
      const t = nesne(m.t);
      o.pul += Number(m.p) || 0; o.kisiler[k] = Number(m.p) || 0;
      o.kalp += Number(t.k) || 0; o.yagmur += Number(t.y) || 0;
      Object.keys(nesne(m.r)).forEach(x => { o.ruh[x] = (o.ruh[x] || 0) + (Number(m.r[x]) || 0); });
      Object.keys(nesne(m.o)).forEach(x => { const v = dizi(m.o[x]); const h = (o.oyun[x] = o.oyun[x] || [0, 0, 0, 0]); for (let i = 0; i < 4; i++) h[i] += Number(v[i]) || 0; });
      Object.keys(nesne(m.b)).forEach(x => { o.bakim[x] = (o.bakim[x] || 0) + (Number(m.b[x]) || 0); });
      if (!o.yildizPul) o.yildizPul = 0; o.yildizPul = Math.max(o.yildizPul, Number(t.Y) || 0);
      const g = gunler(r);
      Object.keys(g).forEach(gn => { if (gundenIso(Number(gn)).slice(0, 7) !== a) return; gunTop[gn] = (gunTop[gn] || 0) + Object.values(g[gn]).reduce((x, y) => x + y, 0); });
      if (Array.isArray(m.eg) && (!egYedek || m.eg[1] > egYedek[1])) egYedek = m.eg;
    });
    const enG = Object.keys(gunTop).sort((x, y) => gunTop[y] - gunTop[x] || x - y)[0];
    if (enG) o.enGun = { gun: gundenIso(Number(enG)), pul: gunTop[enG] };
    else if (egYedek) o.enGun = { gun: gundenIso(egYedek[0]), pul: egYedek[1] };
    try { o.yildiz = CD.gece && CD.gece.yildizlar ? CD.gece.yildizlar().filter(g => g.slice(0, 7) === a).length : 0; } catch (e) {}
    if (!o.yildiz) o.yildiz = o.yildizPul || 0;
    const ruhEn = Object.keys(o.ruh).sort((x, y) => o.ruh[y] - o.ruh[x])[0];
    o.enRuh = ruhEn ? { tur: ruhEn, ad: (RUH_AD[ruhEn] || [ruhEn])[0], em: (RUH_AD[ruhEn] || ['', '🌤'])[1], kez: o.ruh[ruhEn] } : null;
    const oyunEn = Object.keys(o.oyun).sort((x, y) => o.oyun[y][0] - o.oyun[x][0])[0];
    if (oyunEn) {
      const v = o.oyun[oyunEn];
      const kazanan = v[1] > v[2] ? 'cemre' : v[2] > v[1] ? 'ahmet' : null;
      o.enOyun = { id: oyunEn, ad: OYUN_AD[oyunEn] || oyunEn, kez: v[0], cemre: v[1], ahmet: v[2], diger: v[3], kazanan };
    } else o.enOyun = null;
    o.kilo = { pittiksu: kiloBul('pittiksu', a), barbie: kiloBul('barbie', a) };
    return o;
  }
  function ayGoruldu(a) { const k = ben(), r = oku(k); if (r.ag >= a) return; r.ag = a; yazKayit(k, r); }
  function ayOzetiBekliyor() {
    const a = oncekiAy(); const r = oku(ben());
    if (r.ag >= a) return null;
    const o = ayOzeti(a);
    return o.pul > 0 ? a : null;
  }

  /* ================================================================ açılış akışı (ay özeti + kapıdaki hediyeler) */
  function serbest() {
    const g = CD.giris;
    if (g && g.durum && g.durum !== 'kapali' && g.durum !== 'bitti') return false;
    if (document.hidden || document.body.classList.contains('sheet-acik') || document.querySelector('.defter-h-perde')) return false;
    return true;
  }
  function bosAnda(fn, gecikme, deneme) {
    setTimeout(() => { if (serbest() || (deneme || 0) > 40) { try { fn(); } catch (e) { console.warn('[defter]', e); } } else bosAnda(fn, 1500, (deneme || 0) + 1); }, gecikme || 0);
  }
  function hediyeKarti() {
    const k = kapidakiler(); if (!k.length || !CD.posta || !CD.posta.kart) return;
    const P = (CD.config.PITTIKSU || {}).AD || 'Pıttıksu', B = (CD.config.BARBIE || {}).AD || 'Barbie';
    CD.posta.kart({ kim: null, tur: 'defterHediye', kalici: true, muhur: false, baslik: P + ' ve ' + B + ' gezmeden döndü 🍂', alt: 'Kapıda ' + k.length + ' küçük hediye var',
      eylem: { ad: 'Hediyeleri aç', fn: () => { if (CD.defter.hediyeSahnesi) CD.defter.hediyeSahnesi(); else CD.ac('defter'); } } });
  }
  let acilisYapildi = false;
  function acilis() {
    if (acilisYapildi) return; acilisYapildi = true;
    donus();
    let senkBekle = !!(CD.senk && CD.senk.kurulu && CD.senk.kurulu() && !CD.senk.durdu);
    const devam = () => {
      kilitKontrol();
      const a = ayOzetiBekliyor();
      if (a && CD.defter.hikayeAc) bosAnda(() => { if (ayOzetiBekliyor() === a) CD.defter.hikayeAc(a, { ilk: true, kapaninca: () => bosAnda(hediyeKarti, 600) }); else hediyeKarti(); }, 2500);
      else bosAnda(hediyeKarti, 2500);
    };
    if (!senkBekle) { devam(); return; }
    let bitti = false;
    const coz = CD.olay.dinle('senk', (d) => { if (bitti || !d || (d.durum !== 'tamam' && d.durum !== 'hata')) return; bitti = true; coz(); devam(); });
    setTimeout(() => { if (!bitti) { bitti = true; coz(); devam(); } }, 7000);
  }

  /* ================================================================ posta: Ahmet'in notu bulundu */
  (CD.postaTurleri = CD.postaTurleri || {}).hediyeNot = {
    kart(o, y) { y.kart({ kim: y.kim, tur: 'hediyeNot', baslik: y.A + ' notunu buldu 💌', alt: 'Hediyenin içinden çıktı · ' + y.saat }); },
    ozet(l, A) { return '💌 ' + A + ' hediyedeki notunu buldu'; }
  };

  CD.defter = {
    TURLER, ESIKLER, ODULLER, ESYALAR, NADIR_AD, RUH_AD, OYUN_AD, SEVIYELER, DISARI_SAAT,
    piksel, svg: (id) => { const o = ODULLER.find(x => x.id === id); return piksel(o ? o.cizim : id); }, pulCizim: (tur) => (TURLER[tur] || TURLER.diger).cizim,
    oku, kisiler, toplam, kisiToplam, sayfalar, seviye, acik, acikler, dekorlar, aksesuarlar, petAksesuarlar, mektup, kilitKontrol,
    disarida, kapidakiler, hediyeAc, koleksiyon, ahmetNotu, notBirak, notBulundu, donus,
    aylar, ayOzeti, ayAdi, oncekiAy, ayGoruldu, ayOzetiBekliyor, gunNo, gundenIso,
    mahalleUygula,
    get mahalleOtomatik() { return mahalleOtomatik; },
    set mahalleOtomatik(v) { mahalleOtomatik = !!v; if (!v) { document.querySelectorAll('.defter-dekor-katman,.defter-aks,.defter-paks,.defter-disari-tabela').forEach(x => x.remove()); const h = document.getElementById('hub'); if (h) delete h.dataset.defterDekor; document.querySelectorAll('[data-defter-aks]').forEach(x => { delete x.dataset.defterAks; }); } }
  };

  CD.hazir(() => {
    datasetYaz();
    const tekrar = () => { mahalleUygula(); setTimeout(mahalleUygula, 700); setTimeout(mahalleUygula, 2200); };
    CD.olay.dinle('hub:acildi', tekrar);
    CD.olay.dinle('senk:yenilendi', () => { setTimeout(kilitKontrol, 300); CD.olay.yay('defter:degisti'); });
    CD.olay.dinle('defter:pul', () => CD.olay.yay('defter:degisti'));
    CD.olay.dinle('varlik:degisti', () => disariUygula());
    CD.olay.dinle('kim', () => { datasetYaz(); });
    tekrar();
    // görünürken "son açık" damgası (hediyeler için); uzun aradan dönüş = yeniden açılış sayılır
    setInterval(() => { if (!document.hidden) CD.depo.yaz(SON_ACIK, Date.now()); }, 60000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { CD.depo.yaz(SON_ACIK, Date.now()); return; }
      if (donus()) bosAnda(hediyeKarti, 1500);
    });
    acilis();
  });
})();
