/* js/bolum/tirnak-pro.js — Tırnak Salonu PRO: hareketle çalışan manuel araçlar, numaralı fırçalar, özel fırça yapıcı,
   renk tekerleği / karıştırma paleti / damlalık, jel sistemi adımları, pozlar, kamera kilidi, tırnak kontrol fotoğrafı.
   Tembel yüklenir (tirnak.js açılınca). tirnak.js'in iç API'si (ic) üzerinden çalışır; kendi verisini tırnak kaydının
   isteğe bağlı alanlarına yazar (form, yeniKat, tasma, metal, hacim, bloom, efektG, jel, firca[].tur 'pro'|'sprey'|'jelIz').
   Sesler Web Audio sentezidir (törpü sürtünmesi, e-file vınlaması, lamba bip, damla). Dış kaynak yok. */
(() => {
  'use strict';
  const AYAR = 'cihaz.tirnak.pro';                 // cihaza özel: mod, görülen ipuçları, son araç
  const FIRCALARIM = 'fircalarim', PALETLERIM = 'paletlerim';   // ortak (küçük): kendi fırçaların ve paletlerin

  /* ------------------------------------------------------------ fırça kütüphanesi
     sk: uç şekli (y yuvarlak, s sivri, d düz, a açılı, f yelpaze, g sünger, n nokta); g: genişlik (tırnak eni oranı);
     u: uç sivriliği (0 küt, 1 iğne); kap: boya taşıma (sürdükçe azalır); k: kıl sayısı; kuru: kuruluk; o: opaklık; uz: kıl boyu (3D model) */
  const FIRCALAR = [
    { id: 'l000', ad: 'Liner 000', grup: 'Liner', sk: 's', g: .018, u: .92, kap: .55, k: 6, uz: .9 },
    { id: 'l00', ad: 'Liner 00', grup: 'Liner', sk: 's', g: .026, u: .88, kap: .6, k: 8, uz: .9 },
    { id: 'l0', ad: 'Liner 0', grup: 'Liner', sk: 's', g: .034, u: .82, kap: .65, k: 9, uz: .95 },
    { id: 'l1', ad: 'Liner 1', grup: 'Liner', sk: 's', g: .045, u: .78, kap: .7, k: 10, uz: 1 },
    { id: 'l2', ad: 'Liner 2', grup: 'Liner', sk: 's', g: .058, u: .72, kap: .75, k: 12, uz: 1 },
    { id: 'lm5', ad: 'Liner 5 mm', grup: 'Uzun liner', sk: 'y', g: .03, u: .55, kap: .9, k: 10, uz: 1.3 },
    { id: 'lm7', ad: 'Liner 7 mm', grup: 'Uzun liner', sk: 'y', g: .032, u: .55, kap: 1, k: 10, uz: 1.55 },
    { id: 'lm9', ad: 'Liner 9 mm', grup: 'Uzun liner', sk: 'y', g: .034, u: .5, kap: 1.1, k: 10, uz: 1.8 },
    { id: 'lm11', ad: 'Liner 11 mm', grup: 'Uzun liner', sk: 'y', g: .036, u: .48, kap: 1.2, k: 11, uz: 2.05 },
    { id: 'lm15', ad: 'Liner 15 mm', grup: 'Uzun liner', sk: 'y', g: .038, u: .45, kap: 1.35, k: 12, uz: 2.5 },
    { id: 'd0000', ad: 'Detay 0000', grup: 'Detay', sk: 's', g: .012, u: .96, kap: .35, k: 4, uz: .55 },
    { id: 'd000', ad: 'Detay 000', grup: 'Detay', sk: 's', g: .018, u: .94, kap: .4, k: 5, uz: .6 },
    { id: 'f4', ad: 'Düz 4', grup: 'Düz', sk: 'd', g: .16, u: .1, kap: .8, k: 22, uz: .8 },
    { id: 'f6', ad: 'Düz 6', grup: 'Düz', sk: 'd', g: .22, u: .1, kap: .9, k: 26, uz: .9 },
    { id: 'f8', ad: 'Düz 8', grup: 'Düz', sk: 'd', g: .3, u: .1, kap: 1, k: 30, uz: 1 },
    { id: 'yelpaze', ad: 'Yelpaze', grup: 'Özel uçlar', sk: 'f', g: .4, u: .2, kap: .6, k: 18, uz: 1, kuru: .3 },
    { id: 'acili', ad: 'Açılı', grup: 'Özel uçlar', sk: 'a', g: .18, u: .3, kap: .8, k: 22, uz: .9 },
    { id: 'gradient', ad: 'Gradient fırçası', grup: 'Özel uçlar', sk: 'd', g: .36, u: .05, kap: 1, k: 34, uz: .9, kuru: .15, o: .55 },
    { id: 'tozF', ad: 'Toz fırçası', grup: 'Özel uçlar', sk: 'f', g: .5, u: .2, kap: .4, k: 26, uz: 1.4, kuru: .55, o: .4 },
    { id: 'ombreS', ad: 'Ombre süngeri', grup: 'Özel uçlar', sk: 'g', g: .5, u: 0, kap: 1, k: 8, uz: .5, o: .8 }
  ];
  const NOKTA_KALEM = [{ id: 1, ad: 'XS', g: .06 }, { id: 2, ad: 'S', g: .09 }, { id: 3, ad: 'M', g: .13 }, { id: 4, ad: 'L', g: .18 }, { id: 5, ad: 'XL', g: .25 }];
  const KUM = [{ id: 80, ad: '80', hiz: 2.3, not: 'En kaba: akrilik/poly jel boyu alır. Doğal tırnağa değmez.' }, { id: 100, ad: '100', hiz: 1.7, not: 'Kaba: uzatmayı kısaltır.' }, { id: 180, ad: '180', hiz: 1.1, not: 'Orta: şekil vermek için ideal.' }, { id: 240, ad: '240', hiz: .7, not: 'İnce: kenarı pürüzsüz bitirir.' }];
  const TORPU_SEKIL = [{ id: 'duz', ad: 'Düz', gen: 2.6, kose: .25 }, { id: 'muz', ad: 'Muz', gen: 3.6, kose: .7 }, { id: 'blok', ad: 'Blok', gen: 5, kose: .1 }];
  const EFILE_UC = [{ id: 'seramik', ad: 'Seramik', guc: .8 }, { id: 'karbur', ad: 'Karbür', guc: 1.3 }, { id: 'kum', ad: 'Kum halkası', guc: 1 }];
  const KROM = [{ id: 'kromAyna', ad: 'Ayna gümüş', renk: '#DDE1E8' }, { id: 'kromAltin', ad: 'Altın', renk: '#E6C35C' }, { id: 'kromRose', ad: 'Gül', renk: '#EAB2A6' }, { id: 'aurora', ad: 'Kuzey ışığı', renk: '#F6D3DC' }, { id: 'inci', ad: 'İnci', renk: '#F7EFEA' }, { id: 'holo', ad: 'Gökkuşağı', renk: '#E0E4FF' }];
  const METAL_RENK = [['Altın', '#D4AF37'], ['Gümüş', '#C9CED6'], ['Gül altını', '#E2A58E'], ['Bakır', '#B87333'], ['Siyah krom', '#3A3A40']];
  const HEYKEL_MOD = [{ id: 'ekle', ad: 'Hacim ekle' }, { id: 'it', ad: 'İt' }, { id: 'cek', ad: 'Çek' }, { id: 'duz', ad: 'Düzleştir' }, { id: 'boya', ad: 'Boya' }];
  const HEYKEL_HAZIR = [['heykelGul', '3D gül'], ['kalp3d', 'Kalp'], ['cicek3d', 'Çiçek'], ['heykelDamla', 'Damla'], ['heykelAyicik', 'Ayıcık'], ['heykelHayalet', 'Hayalet'], ['heykelKabak', 'Kabak'], ['heykelPalyaco', 'Palyaço'], ['heykelKiraz', 'Kiraz'], ['heykelYildiz', 'Yıldız'], ['heykelSekiz', '8 top'], ['heykelMantar', 'Mantar']];
  const SABLON_AD = [['yok', 'Yok'], ['kalp', 'Kalp'], ['yildiz', 'Yıldız'], ['daire', 'Daire'], ['serit', 'Şerit'], ['yarim', 'Yarım']];
  const JEL_SIRA = ['dehidrator', 'primer', 'base'];

  /* ------------------------------------------------------------ araçlar (kategori → araç listesi) */
  const ARAC = {
    aseton: { ad: 'Aseton + pamuk', ikon: '🧴', model: 'pamuk', ipucu: 'Pamuğu eski ojenin üstünde sürt; oje çözülür.', hz: 'aseton' },
    su: { ad: 'Ilık su', ikon: '💧', model: null, ipucu: 'Parmakları ılık suya daldır; kütikül yumuşar.', hz: 'su', dugme: true },
    itici: { ad: 'Kütikül itici', ikon: '🥄', model: 'itici', ipucu: 'Tırnak dibinde uçtan kütiküle doğru it.', hz: 'itici' },
    makas: { ad: 'Kütikül makası', ikon: '✂️', model: 'makas', ipucu: 'Kütikül çizgisi boyunca ufak dokunuşlarla çapakları al.' },
    yag: { ad: 'Kütikül yağı', ikon: '💛', model: 'damlalik', ipucu: 'Dokun: bir damla düşer. Sürt: yağ yayılır.', hz: 'yag' },
    torpu: { ad: 'Törpü', ikon: '🪵', model: 'torpu', ipucu: 'Uç kenarında sürt: hangi yöne törpülersen o taraf aşınır.', hz: 'torpu' },
    efile: { ad: 'Elektrikli törpü', ikon: '🌀', model: 'efile', ipucu: 'Dipte kütikül temizler, yüzeyde inceltir, uçta kısaltır.' },
    parlatici: { ad: 'Parlatıcı blok', ikon: '✨', model: 'blok', ipucu: 'Tırnağın üstünü ov; ışıl ışıl olsun.', hz: 'parlatici' },
    tozFirca: { ad: 'Toz fırçası', ikon: '🖌️', model: 'tozFirca', ipucu: 'Törpü tozunu süpür.', hz: 'tozf' },
    form: { ad: 'Kalıp (form)', ikon: '📐', model: 'form', ipucu: 'Uca dokun: kalıp tırnağın altına yerleşir.' },
    poly: { ad: 'Poly jel', ikon: '🍡', model: 'spatula', ipucu: 'Dipten uca doğru sürükle: jel uzatmayı kurar.' },
    slip: { ad: 'Slip solüsyonu', ikon: '🫧', model: 'firca', ipucu: 'Poly jelin üstünde sürt: düzleşir.' },
    dehidrator: { ad: 'Dehidratör', ikon: '🧪', model: 'firca', ipucu: 'Tırnağın her yerine sür: yağı alır.', jel: true },
    primer: { ad: 'Primer', ikon: '🧴', model: 'firca', ipucu: 'İnce bir kat; jel iyi tutunsun.', jel: true },
    base: { ad: 'Base jel', ikon: '🫙', model: 'ojeFirca', ipucu: 'Base jeli sür, sonra lambaya.', jel: true },
    builder: { ad: 'Builder jel', ikon: '⛰️', model: 'spatula', ipucu: 'Ortaya doğru sürt: tepe noktası (apex) yükselir.', jel: true },
    top: { ad: 'Top jel', ikon: '💎', model: 'ojeFirca', ipucu: 'Üst katı sür; lambadan sonra alkollü pedle sil.', jel: true },
    alkol: { ad: 'Alkollü ped', ikon: '🧻', model: 'ped', ipucu: 'Yapışkan katı sil: cam gibi parlar.' },
    oje: { ad: 'Oje fırçası', ikon: '💅', model: 'ojeFirca', ipucu: 'Önce ortaya, sonra sol ve sağ kenara: üç vuruş.' },
    temizle: { ad: 'Temizleme fırçası', ikon: '🧽', model: 'temizle', ipucu: 'Taşan ojeyi asetonlu fırçayla sil.' },
    damlalik: { ad: 'Damlalık', ikon: '🎯', model: 'damlalik2', ipucu: 'Tırnağa dokun: oradaki rengi al.' },
    firca: { ad: 'Fırçalar', ikon: '🖌️', model: 'firca', ipucu: 'Hızlı çizgi ince ve kuru, yavaş çizgi kalın ve dolgun.' },
    nokta: { ad: 'Nokta kalemi', ikon: '⚫', model: 'noktaKalem', ipucu: 'Dokun: nokta. Boyu seç.' },
    ombre: { ad: 'Ombre süngeri', ikon: '🧽', model: 'sunger', ipucu: 'Süngeri tırnağa bastır; iki renk geçiş yapar.' },
    metal: { ad: 'Liquid metal', ikon: '〰️', model: 'firca', ipucu: 'Kabarık metalik çizgi çek; altın kıvrımlar için.' },
    cimbiz: { ad: 'Cımbız + taş', ikon: '💎', model: 'cimbiz', ipucu: 'Önce jel tutkal, sonra cımbızla taşı yerleştir.' },
    tutkal: { ad: 'Jel tutkal', ikon: '💧', model: 'firca', ipucu: 'Taşın gideceği yere minik bir tutkal damlası.' },
    sticker: { ad: 'Çıkartma & karakter', ikon: '🐰', model: 'cimbiz', ipucu: 'Bir karakter seç, tırnağa dokun.' },
    heykel: { ad: '3D jel heykel', ikon: '🌹', model: 'spatula', ipucu: 'Hacim ekle, it, çek, düzleştir; sonra boya.' },
    krom: { ad: 'Krom tozu', ikon: '🪞', model: 'sunger', ipucu: 'Aplikatörle ov: ovdukça krom açılır.' },
    miknatis: { ad: 'Kedi gözü mıknatısı', ikon: '🧲', model: 'miknatis', ipucu: 'Mıknatısı tırnağın üstünde gezdir: ışık bandı peşinden gelir.' },
    folyo: { ad: 'Folyo', ikon: '🎞️', model: 'firca', ipucu: 'Folyo jeli sür → bastır → hızlıca çek.' },
    damga: { ad: 'Damga', ikon: '🔖', model: 'damga', ipucu: 'Plakaya oje, kazı, tamponla al, tırnağa bas.' },
    airbrush: { ad: 'Airbrush', ikon: '🌫️', model: 'airbrush', ipucu: 'Tırnağın üstünde gezdir; mesafe ve basınç ayarlı.' },
    bloom: { ad: 'Blooming jel', ikon: '🌸', model: 'damlalik', ipucu: 'Dokun: mürekkep damlar ve çiçek gibi açılır.' },
    crackle: { ad: 'Çatlatma (crackle)', ikon: '🕸️', model: 'ojeFirca', ipucu: 'Üstünden sür; bırakınca çatlaklar açılır.' },
    mermer: { ad: 'Su mermeri', ikon: '🌊', model: null, ipucu: 'Damla bırak, iğneyle çek.', vekil: 'mermer' },
    poz: { ad: 'Pozlar', ikon: '🖐️', model: null, ipucu: 'Bir poz seç; el yumuşakça döner.', dugme: true },
    foto: { ad: 'Fotoğraf', ikon: '📸', model: null, ipucu: 'Tek dokunuşla bu pozda fotoğraf.', dugme: true }
  };
  const KATEGORI = {
    hazirlik: ['aseton', 'su', 'itici', 'makas', 'yag', 'torpu', 'efile', 'parlatici', 'tozFirca'],
    sekil: ['torpu', 'efile', 'form', 'poly', 'slip'],
    taban: ['dehidrator', 'primer', 'base', 'builder', 'top', 'alkol'],
    renk: ['oje', 'temizle', 'damlalik'],
    sanat: ['firca', 'nokta', 'ombre', 'metal'],
    sus: ['tutkal', 'cimbiz', 'sticker', 'heykel'],
    efekt: ['krom', 'miknatis', 'folyo', 'damga', 'airbrush', 'bloom', 'crackle', 'mermer'],
    final: ['top', 'alkol', 'poz', 'foto']
  };

  function kur(ic) {
    const ctx = ic.ctx, R = ic.renk, Y = ic.yardim, S = ic.sabit, U = ic.ui2;
    const sinir = Y.sinir;
    const ayar = Object.assign({ mod: 'serbest', gorulen: {}, klasik: false }, CD.depo.al(AYAR, {}) || {});
    const st = {
      arac: null, kategori: null,
      kum: 180, torpuSekil: 'duz', efileUc: 'karbur', devir: 18000,
      ojeYuk: 0, ojeRenk: null, ojeTur: 'krem',
      firca: 'l1', renk: '#FFFFFF', renk2: '#F48FB1', stab: .45, nokta: 3,
      metalRenk: '#D4AF37', metalK: .07,
      tas: 'tasM', tasRenk: '#FFFFFF', tasBoy: .28, tasDon: 0, sticker: null,
      heykelMod: 'ekle', heykelRenk: '#F48FB1',
      krom: 'kromAyna', folyoAsama: 'jel', folyoRenk: '#E2B74A',
      damga: { desen: 'cicek', asama: 0, renk: '#FFFFFF' },
      sprey: { yay: .35, yog: .55, sb: 'yok' },
      sonTas: null
    };
    let surukle = null, sonCiz = 0, efileSes = null, tozSay = 0;
    const iptaller = [];

    /* ------------------------------------------------------------ küçük yardımcılar */
    const aktifMi = () => !!(st.arac && ARAC[st.arac] && !ARAC[st.arac].dugme && !ARAC[st.arac].vekil);
    const api = () => (ic.mod3d ? ic.api3 : null);
    const kaydet = () => CD.depo.yaz(AYAR, ayar);
    function ciz(hemen) { const t = performance.now(); if (hemen || t - sonCiz > 55) { sonCiz = t; ic.tirnakCizIste(); } }
    function toz(v, renk, n) {
      const a = api(); if (a && v.taraf) a.toz(v.taraf, v.i, v.nx * v.nw / 2, -v.ny * v.L, renk);
      else if (Math.random() < .3) ctx.efekt.toz(v.cx, v.cy, n || 1);
    }
    function ipucuBir(id) {
      if (ayar.gorulen[id]) return;
      ayar.gorulen[id] = 1; kaydet();
      ic.balon((ARAC[id] ? ARAC[id].ad + ': ' + ARAC[id].ipucu : id), 3600);
    }
    function proModMu() { return ayar.mod === 'pro'; }

    /* ------------------------------------------------------------ ses (Web Audio sentezi) */
    function ac() { try { return ctx && ctx.ses.baglam(); } catch (e) { return null; } }
    let gurultuBuf = null;
    function gurultu(c) { if (gurultuBuf && gurultuBuf.sampleRate === c.sampleRate) return gurultuBuf; const b = c.createBuffer(1, c.sampleRate, c.sampleRate), v = b.getChannelData(0); for (let k = 0; k < v.length; k++) v[k] = Math.random() * 2 - 1; gurultuBuf = b; return b; }
    function sesTorpu(hiz, kum) {     // törpü sürtünmesi: süzgeçli gürültü, kum inceldikçe tiz
      const c = ac(); if (!c) return;
      const t = c.currentTime, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = gurultu(c); f.type = 'bandpass'; f.frequency.value = 900 + (kum || 180) * 9; f.Q.value = 1.2;
      const v = sinir(.04 + hiz * .5, .04, .22); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + .12);
      src.connect(f); f.connect(g); g.connect(c.destination); src.start(t, Math.random() * .8); src.stop(t + .14);
    }
    function sesEfileBaslat() {     // e-file: devire bağlı vınlama + titreşim
      const c = ac(); if (!c || efileSes) return;
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), n = c.createBufferSource(), ng = c.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; const hz = 60 + st.devir / 120; o.frequency.value = hz; o2.frequency.value = hz * 2.01;
      f.type = 'lowpass'; f.frequency.value = 1400 + st.devir / 20; g.gain.value = .0001; ng.gain.value = .015;
      n.buffer = gurultu(c); n.loop = true;
      o.connect(f); o2.connect(f); n.connect(ng); ng.connect(f); f.connect(g); g.connect(c.destination);
      o.start(); o2.start(); n.start();
      g.gain.exponentialRampToValueAtTime(.05, c.currentTime + .12);
      efileSes = { o, o2, g, n, c };
      if (navigator.vibrate) try { navigator.vibrate([15, 30, 15]); } catch (e) {}
    }
    function sesEfileYuk(yuk) { if (!efileSes) return; const c = efileSes.c, hz = (60 + st.devir / 120) * (1 - yuk * .12); efileSes.o.frequency.setTargetAtTime(hz, c.currentTime, .05); efileSes.o2.frequency.setTargetAtTime(hz * 2.01, c.currentTime, .05); efileSes.g.gain.setTargetAtTime(.04 + yuk * .05, c.currentTime, .05); }
    function sesEfileDur() { if (!efileSes) return; const e = efileSes; efileSes = null; try { e.g.gain.setTargetAtTime(.0001, e.c.currentTime, .05); setTimeout(() => { try { e.o.stop(); e.o2.stop(); e.n.stop(); } catch (er) {} }, 220); } catch (er) {} }
    function sesBip(f, sure, v) { const c = ac(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f || 1760; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v || .08, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + (sure || .12)); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + (sure || .12) + .02); }
    function sesDamla() { const c = ac(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(380, t + .14); g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .2); }

    /* ------------------------------------------------------------ 3D araç modeli (parmağın altında görünür, hareketi izler) */
    function modelGoster() {
      const a = api(); if (!a || !a.arac) return;
      const A = ARAC[st.arac];
      if (!A || !A.model) { a.arac(null); return; }
      a.arac(A.model, modelSecenek());
    }
    function modelSecenek() {
      const f = FIRCALAR.find(x => x.id === st.firca) || FIRCALAR[3];
      return { kum: st.kum, sekil: st.torpuSekil, uc: st.efileUc, renk: st.arac === 'oje' ? (st.ojeRenk || '#F4CFD8') : st.arac === 'metal' ? st.metalRenk : st.arac === 'heykel' ? st.heykelRenk : st.renk, yuk: st.ojeYuk, firca: f, krom: (KROM.find(k => k.id === st.krom) || KROM[0]).renk, tas: st.tasRenk, nokta: (NOKTA_KALEM.find(n => n.id === st.nokta) || NOKTA_KALEM[2]).g };
    }
    function modelKonum(v, ek) {
      const a = api(); if (!a || !a.aracKonum || !v || !v.taraf) return;
      a.aracKonum(v.taraf, v.i, v.nx * v.nw / 2, -v.ny * v.L, Object.assign({ basili: !!surukle }, ek || {}));
    }

    /* ------------------------------------------------------------ pointer akışı (tirnak.js çağırır) */
    function bas(v, e) {
      if (!v || !v.taraf) return;
      const A = ARAC[st.arac]; if (!A) return;
      surukle = { v0: v, son: v, uz: 0, t0: performance.now(), tSon: performance.now(), gecmis: false, sm: { x: v.nx, y: v.ny }, hiz: 0 };
      ipucuBir(st.arac);
      modelKonum(v, { yeni: true });
      const fn = BAS[st.arac]; if (fn) fn(v, e);
    }
    function tasi(v, e, h) {
      if (!surukle || !v || !v.taraf) return;
      const s = surukle, now = performance.now(), dt = Math.max(1, now - s.tSon);
      const dnx = v.nx - s.son.nx, dny = v.ny - s.son.ny, adim = Math.hypot(dnx, dny * (v.L / v.nw));
      s.hiz = s.hiz * .7 + (adim / dt * 16) * .3; s.uz += adim; s.tSon = now;
      const fn = TASI[st.arac]; if (fn) fn(v, s.son, e, adim, dnx, dny);
      s.son = v;
      modelKonum(v, { aci: Math.atan2(-dny, dnx) });
    }
    function birak() {
      const s = surukle; surukle = null; if (!s) return;
      const fn = BIRAK[st.arac]; if (fn) fn(s);
      if (st.arac === 'efile') sesEfileDur();
      const a = api(); if (a && a.aracKonum) a.aracKonum(null);
      ic.tirnakCizIste(); ic.kaydetGec();
    }
    function gecmis() { if (surukle && !surukle.gecmis) { ic.gecmisKaydet(); surukle.gecmis = true; } }

    /* ------------------------------------------------------------ hazırlık araçları: tirnak.js'in sıralı hazırlık mantığına bağlanır */
    function hzAraci(id) {
      const hz = ic.hz(), sira = S.HAZIRLIK.findIndex(x => x.id === id);
      if (hz.adim >= S.HAZIRLIK.length || sira < 0) return true;
      if (hz.adim === sira) return true;
      if (proModMu()) { if (hz.adim < sira) { ic.balon('Profesyonel sıra: önce ' + S.HAZIRLIK[hz.adim].ad.toLocaleLowerCase('tr') + '.', 2400); return false; } return true; }
      // serbest: atlanan adımlar tamam sayılır
      if (hz.adim < sira) { hz.adim = sira; ic.panelYenile(); }
      return true;
    }
    function hzSurukle(v, onceki, e) {
      const dx = (v.nx - onceki.nx) * v.nw / 2, dy = -(v.ny - onceki.ny) * v.L;
      ic.hazirlikSurukle(v.y || v.ref, { x: v.nx, y: v.ny, L: v.L }, dx, dy, e);
    }
    const BAS = {}, TASI = {}, BIRAK = {};
    ['aseton', 'itici', 'parlatici', 'tozFirca'].forEach(id => {
      BAS[id] = () => { gecmis(); };
      TASI[id] = (v, o, e) => { if (!ic.hazirMi(ic.d.el) && hzAraci(ARAC[id].hz) && ic.hzAdim() === ARAC[id].hz) hzSurukle(v, o, e); else if (id === 'aseton') asetonSil(v, o); else if (id === 'parlatici') { sesTorpu(.1, 240); } if (id === 'tozFirca' || id === 'parlatici') toz(v, '#FFFFFF'); };
    });
    function asetonSil(v, o) {   // hazırlık bitince: aseton seçili tırnaktaki ojeyi azar azar çözer
      const t = v.t; if (!t.renk && !t.yeniKat) return;
      gecmis(); t._ase = (t._ase || 0) + Math.hypot(v.nx - o.nx, v.ny - o.ny);
      if (t._ase > 1.6) { delete t._ase; if (t.kat > 1) t.kat--; else { t.renk = null; t.kat = 0; t.efekt = 'yok'; t.ekBitis = null; } t.yeniKat = null; ctx.ses.slip(); ciz(true); }
    }
    BAS.yag = (v) => {
      gecmis(); sesDamla();
      const a = api(); if (a && a.damla) a.damla(v.taraf, v.i, v.nx * v.nw / 2, -v.ny * v.L, '#F2C14E');
      const hz = ic.hz(); if (!ic.hazirMi(ic.d.el) && hzAraci('yag')) { hz.yag[v.i] = Math.min(1, hz.yag[v.i] + .35); if (hz.yag.every(x => x >= .99)) ic.hzIlerle(); }
      ciz(true);
    };
    TASI.yag = (v, o, e) => { const hz = ic.hz(); if (!ic.hazirMi(ic.d.el) && ic.hzAdim() === 'yag') { hz.yag[v.i] = Math.min(1, hz.yag[v.i] + Math.hypot(v.nx - o.nx, v.ny - o.ny) * .5); if (hz.yag[v.i] >= 1 && hz.yag.every(x => x >= .99)) ic.hzIlerle(); ciz(); } };
    BAS.makas = (v) => { gecmis(); makasKes(v); };
    TASI.makas = (v) => makasKes(v);
    function makasKes(v) {
      const hz = ic.d.hazirlik[ic.d.el]; if (!hz.capak || !(hz.capak[v.i] > 0)) { if (v.ny < .25) ic.balon('Bu tırnakta çapak kalmadı ✂️', 1200); return; }
      if (v.ny > .3 || v.ny < -.25) return;
      hz.capak[v.i] = Math.max(0, hz.capak[v.i] - .12); ctx.ses.tik(); if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) {}
      toz(v, '#FFF2EE'); ciz();
    }
    // törpü: serbest şekillendirme (form) + hazırlıkta ilerleme
    BAS.torpu = (v) => { gecmis(); };
    TASI.torpu = (v, o, e, adim, dnx) => {
      if (!ic.hazirMi(ic.d.el) && ic.hzAdim() === 'torpu') { ic.kumSec(st.kum <= 100 ? 100 : st.kum >= 240 ? 240 : 180); hzSurukle(v, o, e); }
      torpule(v, adim, dnx, 1);
    };
    function torpule(v, adim, dnx, guc) {
      const t = v.t, L = v.L, nw = v.nw, uzun = ic.formBoyu(t, nw, L) / L;
      if (v.ny < uzun - .22 || adim <= 0) return false;    // yalnız uç kenarında aşınır
      if (!t.form || !Array.isArray(t.form.k) || t.form.k.length !== S.FORM_N) t.form = { k: new Array(S.FORM_N).fill(0) };
      const ts = TORPU_SEKIL.find(x => x.id === st.torpuSekil) || TORPU_SEKIL[0], kum = KUM.find(k => k.id === st.kum) || KUM[2];
      const miktar = adim * .09 * kum.hiz * (guc || 1), j0 = (sinir(v.nx, -1, 1) + 1) / 2 * (S.FORM_N - 1);
      // yön: yatay sürtme düz keser, köşelerde çapraz sürtme köşeyi yuvarlar
      const yan = Math.abs(dnx) / (adim + 1e-6), kose = Math.abs(v.nx) > .55 ? ts.kose + yan * .4 : 0;
      for (let j = 0; j < S.FORM_N; j++) {
        const d = (j - j0) / ts.gen, w = Math.exp(-d * d), dis = Math.abs(j / (S.FORM_N - 1) * 2 - 1);
        let ek = miktar * w * (1 + kose * Math.pow(dis, 3) * 2.5);
        t.form.k[j] = Math.min(L / nw - 1.12, (t.form.k[j] || 0) + ek);
      }
      t.form.k = t.form.k.map(x => Math.round(x * 1000) / 1000);
      sesTorpu(adim * 4, st.kum); tozSay += adim; if (tozSay > .04) { tozSay = 0; toz(v, '#F7EDE8', 1); }
      ciz(); return true;
    }
    // e-file: dip → kütikül, yüzey → incelt/eski kat al, uç → kısalt
    BAS.efile = (v) => { gecmis(); sesEfileBaslat(); const a = api(); if (a && a.aracDon) a.aracDon(st.devir); };
    TASI.efile = (v, o, e, adim, dnx) => {
      const uc = EFILE_UC.find(u => u.id === st.efileUc) || EFILE_UC[1], g = uc.guc * (st.devir / 18000);
      sesEfileYuk(Math.min(1, adim * 30));
      const hz = ic.d.hazirlik[ic.d.el], t = v.t;
      if (v.ny < .22 && v.ny > -.2) {
        if (hz.kutikul[v.i] < 1) { hz.kutikul[v.i] = Math.min(1, hz.kutikul[v.i] + adim * .9 * g); if (!ic.hazirMi(ic.d.el) && ic.hzAdim() === 'itici' && hz.kutikul.every(x => x >= .97)) ic.hzIlerle(); }
        if (hz.capak && hz.capak[v.i] > 0) hz.capak[v.i] = Math.max(0, hz.capak[v.i] - adim * .8 * g);
        toz(v, '#FFF2EE'); ciz(); return;
      }
      if (torpule(v, adim, dnx, 1.6 * g)) return;
      // yüzey: eski oje / jel katını inceltir
      if (!ic.hazirMi(ic.d.el) && hz.eski.kalan[v.i] > 0) { hz.eski.kalan[v.i] = Math.max(0, hz.eski.kalan[v.i] - adim * .6 * g); if (hz.eski.kalan.every(x => x <= .04) && ic.hzAdim() === 'aseton') ic.hzIlerle(); toz(v, hz.eski.renk); ciz(); return; }
      if (t.renk) { t._ef = (t._ef || 0) + adim * g; if (t._ef > .9) { delete t._ef; if (t.kat > 1) t.kat--; else { t.renk = null; t.kat = 0; t.efekt = 'yok'; } t.top = false; ciz(true); } toz(v, t.renk || '#FFFFFF'); }
      else { hz.parlak[v.i] = Math.min(1, (hz.parlak[v.i] || 0) + adim * .3); toz(v, '#FFFFFF'); ciz(); }
    };
    BIRAK.efile = () => { const a = api(); if (a && a.aracDon) a.aracDon(0); };

    /* ------------------------------------------------------------ şekil: kalıp + poly jel + slip */
    BAS.form = (v) => { gecmis(); const t = v.t; t.jel = Object.assign({}, t.jel || {}, { form: true }); ctx.ses.tik(); ic.balon('Kalıp yerleşti. Şimdi poly jeli dipten uca doğru çek.', 2600); ciz(true); };
    BAS.poly = (v) => {
      gecmis(); const t = v.t;
      if (proModMu() && !(t.jel && t.jel.form) && (t.uzunluk || 0) < .5) { ic.balon('Profesyonel sıra: önce kalıbı (form) yerleştir.', 2400); surukle = null; return; }
      t.protez = 'polygel'; t.kur = Object.assign({}, t.kur, { pro: false }); ctx.ses.blop(); ciz(true);
    };
    TASI.poly = (v, o, e, adim) => {
      if (!surukle) return; const t = v.t;
      if (v.ny > o.ny) t.uzunluk = Math.min(1, (t.uzunluk || 0) + (v.ny - o.ny) * .5);
      if (t.form) delete t.form;
      ciz();
    };
    BAS.slip = (v) => { gecmis(); };
    TASI.slip = (v, o, e, adim) => { const t = v.t; t._slip = (t._slip || 0) + adim; if (t._slip > .8) { delete t._slip; t.jel = Object.assign({}, t.jel || {}, { slip: true }); ctx.ses.tink(); ic.balon('Poly jel düzleşti. Lambaya koy, sonra törpüyle şekil ver.', 2600); } if (Math.random() < .2) ctx.ses.slip(); ciz(); };

    /* ------------------------------------------------------------ jel adımları: sürme hareketi kaplamayı doldurur */
    function jelAdimIzin(id, t) {
      if (!proModMu()) return true;
      const j = t.jel || {};
      if (id === 'primer' && !j.dehidrator) return 'önce dehidratör';
      if (id === 'base' && !j.primer) return 'önce primer';
      if ((id === 'builder' || id === 'top') && !(j.base || t.baz !== 'seffaf')) return 'önce base jel';
      if (ic.yapiskanMi(t) && id !== 'alkol') return 'önce lambaya koy';
      return true;
    }
    ['dehidrator', 'primer', 'base', 'builder', 'top', 'crackle'].forEach(id => {
      BAS[id] = (v) => {
        const izin = id === 'crackle' ? true : jelAdimIzin(id, v.t);
        if (izin !== true) { ic.balon('Profesyonel sıra: ' + izin + '.', 2200); surukle = null; return; }
        gecmis(); surukle.kap = 0; surukle.iz = { tur: 'jelIz', boy: id === 'builder' ? .3 : .22, n: [[+v.nx.toFixed(3), +v.ny.toFixed(3)]] };
      };
      TASI[id] = (v, o, e, adim) => {
        const s = surukle; if (!s || !s.iz) return;
        s.kap += adim; s.iz.n.push([+v.nx.toFixed(3), +v.ny.toFixed(3)]);
        const a = api(); if (a) { const y = v.ref; ic.canliParca(y, s.iz, s.iz.n.length - 1); }
        if (id === 'builder') { const t = v.t; t.jel = Object.assign({}, t.jel || {}); t.jel.builder = Math.min(1, (t.jel.builder || 0) + adim * (Math.abs(v.nx) < .5 && v.ny > .2 && v.ny < .75 ? .55 : .2)); t.kur = Object.assign({}, t.kur, { pro: false }); ciz(); }
        if (Math.random() < .25) ctx.ses.slip();
      };
      BIRAK[id] = (s) => {
        const v = s.v0, t = v.t; if (!s.iz) return;
        if (s.kap < (id === 'builder' ? .15 : .45)) { ic.balon('Biraz daha sür: tırnağın her yeri kaplansın.', 1600); ciz(true); return; }
        const j = t.jel = Object.assign({}, t.jel || {});
        if (id === 'dehidrator') { j.dehidrator = true; ic.balon('Dehidratör: tırnak kurudu, mat göründü.', 1800); }
        else if (id === 'primer') { j.primer = true; ic.balon('Primer sürüldü.', 1400); }
        else if (id === 'base') { j.base = true; if (t.baz === 'seffaf') t.baz = 'kauçuk'; t.kur = Object.assign({}, t.kur, { baz: false }); ic.d.sistem = 'jel'; ic.balon('Base jel: lambaya koy (yapışkan kalır).', 2200); }
        else if (id === 'builder') { t.kur = Object.assign({}, t.kur, { pro: false }); ic.balon('Builder jel: tepe noktası şekillendi. Lambaya koy.', 2200); }
        else if (id === 'top') { t.top = true; t.ust = t.ust || 'parlak'; t.kur = Object.assign({}, t.kur, { top: false }); ic.d.sistem = 'jel'; ic.balon('Top jel: lambadan sonra yapışkan katı alkollü pedle sil.', 2600); }
        else if (id === 'crackle') { crackleBaslat(v); }
        ctx.ses.tink(); ciz(true);
      };
    });
    BAS.alkol = (v) => { gecmis(); surukle.kap = 0; };
    TASI.alkol = (v, o, e, adim) => {
      const t = v.t; surukle.kap += adim;
      if (t.jel && t.jel.inh && surukle.kap > .5) { t.jel = Object.assign({}, t.jel, { inh: false }); ctx.ses.tink(); const a = api(); if (a) { a.parilti(v.taraf, v.i, 10); a.parlama(900); } ic.balon('Yapışkan kat silindi: cam gibi ✨', 1800); ciz(true); }
    };

    /* ------------------------------------------------------------ oje: şişeye daldır, 3 vuruş, kaplama, taşma, kuruma */
    function ojeDaldir() {
      st.ojeYuk = 1; st.ojeRenk = st.ojeRenk || (ic.aktifTirnak().renk || '#E8546F');
      ctx.ses.blop(); const a = api(); if (a && a.aracGuncelle) a.aracGuncelle(modelSecenek());
      yukGoster(); ic.balon('Fırça doldu: ortadan başla, sonra kenarlar.', 1800);
    }
    function yukGoster() { const b = document.querySelector('.tirnak-proYuk'); if (b) { b.style.setProperty('--yuk', String(st.ojeYuk)); b.setAttribute('aria-valuenow', String(Math.round(st.ojeYuk * 100))); } }
    BAS.oje = (v) => {
      if (st.ojeYuk < .04) { ic.balon('Fırça kuru: önce şişeye daldır.', 1600); surukle = null; return; }
      const t = v.t;
      if (ic.yapiskanMi(t) && ic.d.sistem === 'jel' && proModMu()) { ic.balon('Profesyonel sıra: önce lambaya koy.', 2000); surukle = null; return; }
      gecmis();
      if (!t.yeniKat || t.yeniKat.renk !== st.ojeRenk) t.yeniKat = { renk: st.ojeRenk, h: '0'.repeat(S.YK_C * S.YK_R) };
      surukle.izler = 0; ojeSur(v, v, 0);
    };
    TASI.oje = (v, o, e, adim) => ojeSur(v, o, adim);
    function ojeSur(v, o, adim) {
      const t = v.t, yk = t.yeniKat; if (!yk) return;
      const h = yk.h.split('').map(Number), C = S.YK_C, Rr = S.YK_R;
      const yuk = st.ojeYuk, r = .55 + .25 * yuk;   // hücre cinsinden fırça yarıçapı (geniş oje fırçası)
      const adimS = Math.max(1, Math.ceil(adim * 30));
      for (let k = 0; k <= adimS; k++) {
        const tt = k / adimS, x = o.nx + (v.nx - o.nx) * tt, y = o.ny + (v.ny - o.ny) * tt;
        const cx = (x + 1) / 2 * C - .5, cy = (1 - y) * Rr - .5 + Rr * 0;
        const ry = (1 - sinir(y, 0, 1)) * (Rr - 1);
        for (let j = 0; j < Rr; j++) for (let i = 0; i < C; i++) {
          const dx = (i - cx) / (C * .36 * r), dy = (j - ry) / (Rr * .1 * r);
          const w = 1 - (dx * dx + dy * dy); if (w <= 0) continue;
          h[j * C + i] = Math.min(9, h[j * C + i] + w * 2.2 * yuk);
        }
        // taşma: kütikülün altına ya da yanlara fazla oje
        if ((y < -.04 || Math.abs(x) > 1.06) && yuk > .35 && Math.random() < .35) {
          t.tasma = Array.isArray(t.tasma) ? t.tasma : [];
          if (t.tasma.length < 14) t.tasma.push({ x: +sinir(x, -1.35, 1.35).toFixed(3), y: +Math.max(-.16, y).toFixed(3), r: +(.05 + yuk * .05).toFixed(3), renk: st.ojeRenk });
        }
      }
      yk.h = h.map(x => String(Math.round(x))).join('');
      st.ojeYuk = Math.max(0, st.ojeYuk - adim * .1); yukGoster();
      const a = api(); if (a && a.aracGuncelle && Math.random() < .2) a.aracGuncelle(modelSecenek());
      if (Math.random() < .3) ctx.ses.slip();
      ciz();
    }
    BIRAK.oje = (s) => {
      const t = s.v0.t, yk = t.yeniKat; if (!yk) return;
      const ort = yk.h.split('').reduce((a, c) => a + Math.min(1, Number(c) / 5), 0) / yk.h.length;
      if (ort >= .74) {   // kat tamamlandı (oje kenarlara kendiliğinden yayılır)
        if (t.renk && t.renk !== yk.renk) { t.kat = 1; } else t.kat = Math.min(3, (t.kat || 0) + 1);
        t.renk = yk.renk; t.ojeTur = st.ojeTur || 'krem'; t.yeniKat = null;
        if (ic.d.sistem === 'jel') t.kur = Object.assign({}, t.kur, { renk: false });
        const a = api(); if (a) a.islak(s.v0.taraf, s.v0.i);
        ctx.ses.tink(); ic.balon(t.kat + '. kat tamam' + (ic.d.sistem === 'jel' ? '; lambaya koy.' : t.kat < 2 ? '; ikinci kat daha dolgun yapar.' : ' ✨'), 1800);
      } else if (s.uz > .3) ic.balon('Kaplama %' + Math.round(ort * 100) + ': boş kalan yerlere bir vuruş daha.', 1500);
      ciz(true);
    };
    // temizleme fırçası: taşan ojeyi siler
    BAS.temizle = (v) => { gecmis(); temizle(v); };
    TASI.temizle = (v) => temizle(v);
    function temizle(v) {
      const t = v.t; if (!Array.isArray(t.tasma) || !t.tasma.length) return;
      let deg = false;
      t.tasma.forEach(b => { const dd = Math.hypot((b.x - v.nx) * v.nw / 2, (b.y - v.ny) * v.L) / v.nw; if (dd < .3) { b.r = Math.max(0, b.r - .02); deg = true; } });
      if (deg) { t.tasma = t.tasma.filter(b => b.r > .012); if (!t.tasma.length) { delete t.tasma; ic.balon('Kütikül tertemiz ✨', 1400); } ctx.ses.slip(); ciz(); }
    }
    // damlalık: tırnaktan renk al
    BAS.damlalik = (v) => {
      const a = api(); let renk = null;
      if (a && a.renkOku) renk = a.renkOku(v.taraf, v.i, v.nx * v.nw / 2, -v.ny * v.L);
      if (!renk) renk = v.t.renk || (v.t.firca[0] && v.t.firca[0].renk) || '#F4CFD8';
      st.renk = renk; st.ojeRenk = renk; ctx.ses.tink(); ic.balon('Renk alındı: ' + (R.renkAdi(renk) || R.sevimliAd(renk)), 1600);
      ic.panelYenile();
    };

    /* ------------------------------------------------------------ fırçalar (numaralı + özel): hız → kalınlık/kuruluk, yumuşatma */
    function fircaTanim() {
      const ozel = ozelFircalar().find(f => f.id === st.firca);
      return ozel || FIRCALAR.find(f => f.id === st.firca) || FIRCALAR[3];
    }
    function kisaTanim(f) { return { sk: f.sk, g: f.g, u: f.u, k: f.k, kuru: f.kuru || 0, o: f.o == null ? 1 : f.o }; }
    BAS.firca = (v, e) => {
      gecmis(); const f = fircaTanim();
      surukle.yuk = f.kap; surukle.sm = { x: v.nx, y: v.ny };
      const iz = { tur: f.sk === 'g' ? 'sunger' : 'pro', f: kisaTanim(f), renk: st.renk, renk2: st.renk2, boy: f.g, n: [[+v.nx.toFixed(3), +v.ny.toFixed(3), 1, 1]] };
      const t = v.t; t.firca.push(iz); surukle.iz = iz; surukle.t = t;
      ic.canliParca(v.ref, iz, 0);
    };
    TASI.firca = (v, o, e, adim) => {
      const s = surukle; if (!s || !s.iz) return;
      const a = 1 - st.stab * .85;                 // yumuşatma (stabilizer)
      s.sm.x += (v.nx - s.sm.x) * a; s.sm.y += (v.ny - s.sm.y) * a;
      const f = fircaTanim(), hiz = s.hiz;
      const basinc = v.basinc != null ? v.basinc * 1.4 : 1;
      const w = sinir((1.25 - hiz * 3.2) * basinc, .3, 1.5);
      s.yuk = Math.max(0, s.yuk - adim * (.9 / Math.max(.2, f.kap)) * .35);
      const ink = sinir(s.yuk * (1.15 - hiz * 1.4), 0, 1);
      s.iz.n.push([+s.sm.x.toFixed(3), +s.sm.y.toFixed(3), +w.toFixed(2), +ink.toFixed(2)]);
      ic.canliParca(v.ref, s.iz, s.iz.n.length - 1);
    };
    BIRAK.firca = (s) => { if (s.iz && s.iz.n.length > 400) s.iz.n = s.iz.n.filter((p, k) => k % 2 === 0 || k === s.iz.n.length - 1); ciz(true); };
    BAS.nokta = (v) => {
      gecmis(); const g = (NOKTA_KALEM.find(n => n.id === st.nokta) || NOKTA_KALEM[2]).g;
      const iz = { tur: 'pro', f: { sk: 'n', g, u: 0, k: 1, o: 1 }, renk: st.renk, boy: g, n: [[+v.nx.toFixed(3), +v.ny.toFixed(3), 1, 1]] };
      v.t.firca.push(iz); surukle.iz = iz; ctx.ses.pit(); ic.canliParca(v.ref, iz, 0);
    };
    TASI.nokta = (v) => { const s = surukle; if (!s || !s.iz) return; const p = s.iz.n[s.iz.n.length - 1]; if (Math.hypot((v.nx - p[0]) * v.nw / 2, (v.ny - p[1]) * v.L) / v.nw > s.iz.f.g * 1.6) { s.iz.n.push([+v.nx.toFixed(3), +v.ny.toFixed(3), 1, 1]); ctx.ses.pit(); ic.canliParca(v.ref, s.iz, s.iz.n.length - 1); } };
    BAS.ombre = (v) => { gecmis(); const iz = { tur: 'sunger', renk: st.renk, renk2: st.renk2, boy: .16, n: [[+v.nx.toFixed(3), +v.ny.toFixed(3), 1]] }; v.t.firca.push(iz); surukle.iz = iz; ic.canliParca(v.ref, iz, 0); };
    TASI.ombre = (v) => { const s = surukle; if (!s || !s.iz) return; if (Math.random() < .45) { s.iz.n.push([+v.nx.toFixed(3), +v.ny.toFixed(3), 1]); ic.canliParca(v.ref, s.iz, s.iz.n.length - 1); } };
    // liquid metal: kabarık metalik çizgi
    BAS.metal = (v) => { gecmis(); const t = v.t; t.metal = Array.isArray(t.metal) ? t.metal : []; const iz = { renk: st.metalRenk, k: st.metalK, n: [[+v.nx.toFixed(3), +v.ny.toFixed(3)]] }; t.metal.push(iz); surukle.iz = iz; ciz(true); };
    TASI.metal = (v) => { const s = surukle; if (!s || !s.iz) return; const p = s.iz.n[s.iz.n.length - 1]; if (Math.hypot(v.nx - p[0], v.ny - p[1]) > .035) { s.iz.n.push([+v.nx.toFixed(3), +v.ny.toFixed(3)]); ciz(); } };
    BIRAK.metal = (s) => { const a = api(); if (a && s.v0) a.parilti(s.v0.taraf, s.v0.i, 8, st.metalRenk); ctx.ses.tink(); ciz(true); };

    /* ------------------------------------------------------------ süs: tutkal, cımbızla taş, çıkartma, 3D jel heykel */
    BAS.tutkal = (v) => { gecmis(); const t = v.t; t.jel = Object.assign({}, t.jel || {}); t.jel.tutkal = (t.jel.tutkal || []).concat([[+v.nx.toFixed(3), +v.ny.toFixed(3)]]).slice(-24); sesDamla(); const a = api(); if (a && a.damla) a.damla(v.taraf, v.i, v.nx * v.nw / 2, -v.ny * v.L, '#FFFFFF'); ciz(true); };
    BAS.cimbiz = (v) => {
      const t = v.t, tutkal = (t.jel && t.jel.tutkal) || [];
      const yakin = tutkal.some(p => Math.hypot((p[0] - v.nx) * v.nw / 2, (p[1] - v.ny) * v.L) / v.nw < .3);
      if (!yakin && proModMu()) { ic.balon('Taş kayıyor! Önce oraya jel tutkal koy.', 2000); surukle = null; return; }
      gecmis();
      t.susler.push({ id: st.tas, x: +v.nx.toFixed(3), y: +v.ny.toFixed(3), olcek: st.tasBoy, don: st.tasDon, renk: st.tasRenk });
      st.sonTas = { taraf: v.taraf, i: v.i, k: t.susler.length - 1 };
      ic.parcaSec(v.taraf, v.i, 'susler', t.susler.length - 1);
      ctx.ses.tink(); const a = api(); if (a) a.parilti(v.taraf, v.i, 6); ciz(true);
    };
    TASI.cimbiz = (v) => { const sp = st.sonTas; if (!sp || !surukle) return; const t = ic.d.eller[sp.taraf][sp.i], p = t.susler[sp.k]; if (p && sp.i === v.i) { p.x = +v.nx.toFixed(3); p.y = +v.ny.toFixed(3); ciz(); } };
    function sonTasDegistir(fn) { const sp = st.sonTas; if (!sp) return; const p = ic.d.eller[sp.taraf][sp.i].susler[sp.k]; if (p) { fn(p); ic.tirnakCizIste(); ic.kaydetGec(); } }
    BAS.sticker = (v) => {
      const id = st.sticker || (S.CIKARTMALAR[0] && S.CIKARTMALAR[0].id); if (!id) return;
      gecmis(); const c = S.CIKARTMALAR.find(x => x.id === id) || {};
      v.t.cikartmalar.push({ id, x: +v.nx.toFixed(3), y: +v.ny.toFixed(3), olcek: c.olcek || .6, don: 0, renk: c.renk || st.renk });
      ic.parcaSec(v.taraf, v.i, 'cikartmalar', v.t.cikartmalar.length - 1);
      ctx.ses.pop(); ciz(true);
    };
    // 3D jel heykel: yükseklik ızgarası
    function hacimAl(t) {
      const W = S.HACIM_W, H = S.HACIM_H;
      if (!t.hacim || t.hacim.w !== W || t.hacim.h !== H || typeof t.hacim.d !== 'string') t.hacim = { w: W, h: H, d: '0'.repeat(W * H), c: '0'.repeat(W * H), p: [st.heykelRenk] };
      if (!t.hacim.c || t.hacim.c.length !== W * H) t.hacim.c = '0'.repeat(W * H);
      return t.hacim;
    }
    function heykelUygula(v, o) {
      const t = v.t, hc = hacimAl(t), W = hc.w, H = hc.h;
      const d = hc.d.split('').map(c => parseInt(c, 36) || 0), c = hc.c.split('').map(x => parseInt(x, 36) || 0);
      const ci = (v.nx + 1) / 2 * W - .5, cj = v.ny * H - .5, r = 1.6;
      let pk = hc.p.indexOf(st.heykelRenk); if (st.heykelMod === 'boya' && pk < 0) { if (hc.p.length < 10) { hc.p.push(st.heykelRenk); pk = hc.p.length - 1; } else pk = 0; }
      const ocI = o ? (o.nx + 1) / 2 * W - .5 : ci, ocJ = o ? o.ny * H - .5 : cj;
      const kopyaD = d.slice();
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const dd = Math.hypot(i - ci, (j - cj) * .8); if (dd > r * 1.6) continue;
        const w = Math.exp(-dd * dd / (r * r)), k = j * W + i;
        if (st.heykelMod === 'ekle') { d[k] = Math.min(35, d[k] + w * 4); if (d[k] > 0 && c[k] === 0 && pk > 0) c[k] = pk; if (d[k] > 0 && hc.p[0] !== st.heykelRenk && kopyaD[k] === 0) { let q = hc.p.indexOf(st.heykelRenk); if (q < 0 && hc.p.length < 10) { hc.p.push(st.heykelRenk); q = hc.p.length - 1; } if (q >= 0) c[k] = q; } }
        else if (st.heykelMod === 'it') d[k] = Math.max(0, d[k] - w * 4);
        else if (st.heykelMod === 'duz') { let top = 0, say = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < W && jj < H) { top += kopyaD[jj * W + ii]; say++; } } d[k] = d[k] + (top / say - d[k]) * w * .7; }
        else if (st.heykelMod === 'cek') { const si = Math.round(i - (ci - ocI)), sj = Math.round(j - (cj - ocJ)); if (si >= 0 && sj >= 0 && si < W && sj < H) d[k] = Math.max(d[k], kopyaD[sj * W + si] * (.6 + .4 * w)); d[k] = Math.min(35, d[k] + w * 1.2); }
        else if (st.heykelMod === 'boya' && d[k] > 0) c[k] = pk;
      }
      hc.d = d.map(x => Math.round(sinir(x, 0, 35)).toString(36)).join('');
      hc.c = c.map(x => x.toString(36)).join('');
      ciz();
    }
    BAS.heykel = (v) => { gecmis(); heykelUygula(v, null); ctx.ses.blop(); };
    TASI.heykel = (v, o) => { if (Math.random() < .2) ctx.ses.slip(); heykelUygula(v, o); };
    function heykelHazir(id) {
      ic.gecmisKaydet();
      ic.hedefler(false).forEach(i => { const t = ic.d.eller[ic.d.el][i]; t.susler.push({ id, x: 0, y: .45, olcek: .55, don: 0, renk: st.heykelRenk }); });
      ctx.ses.pop(); ic.tirnakCizIste(); ic.kaydetGec(); ic.balon('Heykel yerleşti: cımbız aracıyla yerini değiştirebilirsin.', 2000);
    }

    /* ------------------------------------------------------------ efektler: krom, kedi gözü, folyo, damga, airbrush, blooming, crackle */
    BAS.krom = (v) => {
      gecmis(); const t = v.t;
      if (!t.renk && !t.top) ic.balon('Krom en güzel koyu zemin + üst jel üstünde olur.', 1800);
      if (t.efekt !== st.krom) { t.efekt = st.krom; t.efektG = 0; }
    };
    TASI.krom = (v, o, e, adim) => {
      const t = v.t; t.efektG = Math.min(1, (t.efektG == null ? 1 : t.efektG) + adim * .6);
      if (Math.random() < .3) { const a = api(); if (a) a.parilti(v.taraf, v.i, 3, (KROM.find(k => k.id === st.krom) || KROM[0]).renk); ctx.ses.slip(); }
      ciz();
    };
    BIRAK.krom = (s) => { const t = s.v0.t; if (t.efektG >= .98) { delete t.efektG; ic.balon('Ayna gibi açıldı ✨', 1400); } };
    BAS.miknatis = (v) => {
      const t = v.t;
      if (t.ojeTur !== 'kediGozu') { if (proModMu()) { ic.balon('Kedi gözü için önce Renk > Kedi gözü ojesi sür.', 2200); surukle = null; return; } gecmis(); t.ojeTur = 'kediGozu'; if (!t.renk) { t.renk = '#2E1A47'; t.kat = 2; } }
      else gecmis();
      miknatisla(v, 0);
    };
    TASI.miknatis = (v, o, e, adim, dnx, dny) => miknatisla(v, Math.atan2(dny, dnx));
    function miknatisla(v, aci) { const t = v.t; t.kedi = { x: +sinir(v.nx, -1, 1).toFixed(3), y: +sinir(v.ny, 0, 1).toFixed(3), aci: +(((t.kedi && t.kedi.aci) || 0) * .8 + (aci ? (aci + Math.PI / 2) * .2 : 0)).toFixed(3), gen: (t.kedi && t.kedi.gen) || .5 }; ciz(); }
    // folyo: jel → bastır → çek
    BAS.folyo = (v) => {
      gecmis(); const t = v.t;
      if (st.folyoAsama === 'jel') { const iz = { tur: 'jelIz', boy: .2, n: [[+v.nx.toFixed(3), +v.ny.toFixed(3)]] }; t.firca.push(iz); surukle.iz = iz; ic.canliParca(v.ref, iz, 0); }
      else if (st.folyoAsama === 'bastir') { surukle.basT = performance.now(); }
      else surukle.cekT = performance.now();
    };
    TASI.folyo = (v) => { const s = surukle; if (s && s.iz) { s.iz.n.push([+v.nx.toFixed(3), +v.ny.toFixed(3)]); ic.canliParca(v.ref, s.iz, s.iz.n.length - 1); } };
    BIRAK.folyo = (s) => {
      const t = s.v0.t;
      if (st.folyoAsama === 'jel') { if (t.firca.some(f => f.tur === 'jelIz')) { st.folyoAsama = 'bastir'; ic.balon('Jel sürüldü. Folyoyu tırnağa bastır (basılı tut).', 2200); ic.panelYenile(); } }
      else if (st.folyoAsama === 'bastir') { if (performance.now() - s.basT > 350) { st.folyoAsama = 'cek'; ctx.ses.pit(); ic.balon('Şimdi hızlıca çek!', 1600); ic.panelYenile(); } else ic.balon('Biraz daha bastır (basılı tut).', 1400); }
      else {
        if (s.uz < .25 && performance.now() - s.cekT < 200) { ic.balon('Hızlıca sürükleyerek çek.', 1400); return; }
        const rnd = Y.tohumla(t.tohum || 7);
        t.firca = t.firca.map(f => f.tur === 'jelIz' ? { tur: 'folyo', renk: st.folyoRenk, boy: f.boy, n: f.n.filter(() => rnd() > .12).map(p => [p[0], p[1], 1]) } : f).filter(f => f.tur !== 'folyo' || f.n.length);
        st.folyoAsama = 'jel'; ctx.ses.tink(); const a = api(); if (a) a.parilti(s.v0.taraf, s.v0.i, 10, st.folyoRenk); ic.balon('Folyo aktarıldı ✨', 1400); ic.panelYenile(); ciz(true);
      }
    };
    // damga: plaka → kazı → tampon → bas (kaydırırsan desen kayar)
    BAS.damga = (v) => {
      if (st.damga.asama < 3) { ic.balon(['Önce plakaya oje sür.', 'Kazıyıcıyla fazlasını sıyır.', 'Tamponla deseni al.'][st.damga.asama], 1800); surukle = null; return; }
      gecmis(); surukle.dm = { x: v.nx, y: v.ny };
    };
    BIRAK.damga = (s) => {
      if (!s.dm) return; const t = s.v0.t, son = s.son, kay = [+(son.nx - s.dm.x).toFixed(3) * .6, +(son.ny - s.dm.y).toFixed(3) * .6];
      const kaydi = Math.hypot(kay[0], kay[1]) > .04;
      t.damgalar.push({ desen: st.damga.desen, renk: st.damga.renk, x: +s.dm.x.toFixed(3), y: +s.dm.y.toFixed(3), aci: 0, olcek: 1, kay: kaydi ? kay : null, tohum: Math.floor(Math.random() * 1e5) });
      st.damga.asama = 0; ctx.ses.pop(); ic.balon(kaydi ? 'Desen biraz kaydı; istersen geri al.' : 'Tertemiz bastın ✨', 1600); ic.panelYenile(); ciz(true);
    };
    // airbrush
    BAS.airbrush = (v) => {
      gecmis(); const iz = { tur: 'sprey', renk: st.renk, n: [[+v.nx.toFixed(3), +v.ny.toFixed(3), st.sprey.yay, st.sprey.yog]] };
      if (st.sprey.sb !== 'yok') { iz.sb = st.sprey.sb; iz.sx = +v.nx.toFixed(3); iz.sy = +v.ny.toFixed(3); iz.ss = .45; }
      v.t.firca.push(iz); surukle.iz = iz; ic.canliParca(v.ref, iz, 0);
      const a = api(); if (a && a.sprey) a.sprey(true);
    };
    TASI.airbrush = (v) => { const s = surukle; if (!s || !s.iz) return; s.iz.n.push([+v.nx.toFixed(3), +v.ny.toFixed(3), st.sprey.yay, st.sprey.yog]); if (s.iz.n.length % 2 === 0) ciz(); if (Math.random() < .3) sesTorpu(.02, 240); };
    BIRAK.airbrush = () => { const a = api(); if (a && a.sprey) a.sprey(false); ciz(true); };
    // blooming: damla düşer, yayılır
    BAS.bloom = (v) => {
      gecmis(); const t = v.t; t.bloom = Array.isArray(t.bloom) ? t.bloom : [];
      const b = { x: +v.nx.toFixed(3), y: +v.ny.toFixed(3), r: .02, renk: st.renk }; t.bloom.push(b); sesDamla();
      const hedef = .16 + Math.random() * .1, bas0 = performance.now();
      const adim = () => { if (!ctx || !ic.ctx) return; const p = Math.min(1, (performance.now() - bas0) / 1300); b.r = +(.02 + (hedef - .02) * (1 - Math.pow(1 - p, 3))).toFixed(3); ic.tirnakCizIste(); if (p < 1) ic.sonra(adim, 60); else ic.kaydetGec(); };
      if (ctx.azHareket) { b.r = hedef; ciz(true); } else adim();
    };
    function crackleBaslat(v) {
      const t = v.t; if (!t.ekler.some(e => e.id === 'kirilgan')) t.ekler.push({ u: 'kirilgan', id: 'kirilgan', renk: '#19161C', renk2: t.renk || '#F7F1EE', tohum: Math.floor(Math.random() * 1e5) });
      if (ctx.azHareket) return;
      const bas0 = performance.now();
      const adim = () => { if (!ic.ctx) return; const p = Math.min(1, (performance.now() - bas0) / 1600); ic.katmanOpakAyarla(t, 'ek:kirilgan', p < 1 ? Math.max(.06, p) : 1); ic.tirnakCizIste(); if (p < 1) ic.sonra(adim, 80); else ic.kaydetGec(); };
      adim(); ctx.ses.catir && ctx.ses.catir();
    }

    /* ------------------------------------------------------------ pozlar, kamera, fotoğraf */
    function pozSec(id) { ic.pozDegistir(id); ctx.ses.tik(); }
    async function hizliFoto() {
      if (ic.ui.masa && !ctx.azHareket) { ic.ui.masa.classList.remove('tirnak-flas'); void ic.ui.masa.offsetWidth; ic.ui.masa.classList.add('tirnak-flas'); }
      sesBip(2400, .05, .06);
      const poz = (S.POZLAR.find(p => p.id === ic.d.poz) || {}).ad || 'Poz';
      await ic.galeriyeKaydet(poz + ' · ' + CD.tarihYaz(CD.bugun()));
    }
    let kontrolSurer = false;
    async function kontrolPozuCek() {
      if (kontrolSurer) return; kontrolSurer = true;
      try {
        const a = api();
        if (a) { a.kontrolPozu(true); }
        ic.pozDegistir('bak', 1000);
        ic.balon('Tırnak kontrol pozu: el kıvrılıyor, ışık güzelleşiyor…', 2200);
        await CD.bekle(ctx.azHareket ? 200 : 1150);
        if (!ic.ctx) return;
        if (a) { a.kontrolKamera(); await CD.bekle(ctx.azHareket ? 100 : 950); }
        if (!ic.ctx) return;
        await hizliFoto();
        if (a && ic.ctx) setTimeout(() => { if (ic.ctx && ic.api3) ic.api3.kontrolPozu(false); }, 1200);
      } finally { kontrolSurer = false; }
    }
    function kameraKilit() { const a = api(); if (!a) { ctx.toast('Kamera kilidi 3D salonda çalışır.'); return; } const k = a.kilit(!a.kilitli()); ctx.ses.tik(); ctx.toast(k ? '🔒 Kamera sabit: boyarken kaymaz.' : '🔓 Serbest kamera: sürükle, iki parmakla yakınlaş/kaydır.'); barGuncelle(); }
    function aciGit(ad) { const a = api(); if (!a) return; ctx.ses.tik(); const sec = ic.d.secim.hepsi ? null : { taraf: ic.d.el, i: ic.d.secim.parmak }; a.aci(ad, sec); }

    /* ------------------------------------------------------------ sahne üstü çubuk: kilit, açılar, sıfırla, poz, hızlı foto, kontrol pozu */
    let bar = null;
    function barKur() {
      if (!ic.ui.masa || bar) return;
      const b = (ikon, etiket, fn, sinif) => ctx.el('button.tirnak-proBarDugme' + (sinif || ''), { type: 'button', 'aria-label': etiket, title: etiket, onclick: fn }, ikon);
      bar = ctx.el('div.tirnak-proBar', { role: 'toolbar', 'aria-label': 'Kamera ve poz' }, [
        b('🔓', 'Kamerayı kilitle / aç', kameraKilit, '.tirnak-proKilit'),
        b('🎥', 'Hazır açılar', aciMenu),
        b('↺', 'Kamerayı sıfırla', () => aciGit('sifirla')),
        b('🖐️', 'Poz seç', pozMenu),
        b('📸', 'Tek dokunuşla fotoğraf', hizliFoto),
        b('💅', 'Tırnak kontrol pozu çek', kontrolPozuCek, '.tirnak-proKontrol')
      ]);
      ic.ui.masa.appendChild(bar); barGuncelle();
    }
    function barGuncelle() { if (!bar) return; const a = api(), k = bar.querySelector('.tirnak-proKilit'); if (k) { const kl = !!(a && a.kilitli()); k.textContent = kl ? '🔒' : '🔓'; k.setAttribute('aria-pressed', String(kl)); } bar.classList.toggle('tirnak-proBar-2d', !a); }
    function aciMenu() {
      const l = [['ust', 'Üstten'], ['yan', 'Yandan'], ['yakin', 'Tırnak yakın'], ['avuc', 'Avuç tarafı'], ['sifirla', 'Sıfırla']];
      ctx.sheet(ctx.el('div.izgara-2', l.map(([id, ad]) => ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => { ctx.sheetKapat(); aciGit(id); } }, ad))), { baslik: 'Kamera açısı', sessiz: true });
    }
    function pozMenu() {
      ctx.sheet(ctx.el('div.dikey', [
        ctx.el('div.izgara-2', S.POZLAR.map(p => ctx.el('button.dugme-ikincil' + (p.id === ic.d.poz ? '.secili' : ''), { type: 'button', 'aria-pressed': String(p.id === ic.d.poz), onclick: () => { ctx.sheetKapat(); pozSec(p.id); } }, p.ad))),
        ctx.el('button.dugme.tam', { type: 'button', onclick: () => { ctx.sheetKapat(); kontrolPozuCek(); } }, '💅 Tırnak kontrol pozu çek')
      ]), { baslik: 'El hareketleri', sessiz: true });
    }

    /* ------------------------------------------------------------ özel fırça yapıcı + paletler */
    function ozelFircalar() { const l = ctx.depo.al(FIRCALARIM, []); return Array.isArray(l) ? l.filter(f => f && f.id && f.ad) : []; }
    function fircaYapici() {
      const f = Object.assign({ ad: 'Benim fırçam', sk: 's', uz: 1, sert: .5, k: 12, u: .7, g: .05, akis: .8, o: 1, kuru: 0 }, fircaTanim());
      const onizleme = ctx.el('canvas.tirnak-proFircaOn', { width: 600, height: 150, role: 'img', 'aria-label': 'Fırça önizlemesi' });
      const ciz2 = () => {
        const g = onizleme.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 600, 150); g.fillStyle = '#FBF3F1'; g.fillRect(0, 0, 600, 150);
        const n = []; for (let k = 0; k <= 60; k++) { const t = k / 60, hiz = .5 + .5 * Math.sin(t * 6); n.push([-1 + t * 2, .5 + Math.sin(t * Math.PI * 2) * .25, sinir(1.3 - hiz * .9, .3, 1.4), sinir(1 - t * (1.2 - f.akis), 0, 1)]); }
        g.setTransform(1, 0, 0, 1, 300, 125);
        proOnizleme(g, { tur: 'pro', f: { sk: f.sk, g: f.g * f.uz, u: f.u, k: f.k, kuru: f.kuru, o: f.o }, renk: '#C2185B', n }, 260, 100, 200);
      };
      const sat = (etiket, min, max, adim, anahtar, yaz) => U.kaydirici(etiket, min, max, f[anahtar], adim, yaz || (v => String(v)), v => { f[anahtar] = v; ciz2(); });
      const ad = ctx.el('input.girdi', { type: 'text', maxlength: '24', value: f.ad, 'aria-label': 'Fırça adı' });
      const kutu = ctx.el('div.dikey', [
        onizleme,
        seg2([{ id: 'y', ad: 'Yuvarlak' }, { id: 's', ad: 'Sivri' }, { id: 'd', ad: 'Düz' }, { id: 'a', ad: 'Açılı' }, { id: 'f', ad: 'Yelpaze' }], f.sk, v => { f.sk = v; ctx.ses.tik(); ciz2(); }, 'Uç şekli'),
        sat('Kıl uzunluğu', .4, 2.5, .05, 'uz', v => v.toFixed(2)),
        sat('Genişlik', .008, .5, .002, 'g', v => (v * 100).toFixed(1)),
        sat('Sertlik', 0, 1, .05, 'sert', v => Math.round(v * 100) + '%'),
        sat('Kıl sayısı / doku', 3, 40, 1, 'k'),
        sat('İncelme (uç sivriliği)', 0, 1, .05, 'u', v => Math.round(v * 100) + '%'),
        sat('Akış', .1, 1, .05, 'akis', v => Math.round(v * 100) + '%'),
        sat('Opaklık', .1, 1, .05, 'o', v => Math.round(v * 100) + '%'),
        sat('Kuru fırça ↔ ıslak', 0, 1, .05, 'kuru', v => v < .2 ? 'Islak' : v > .6 ? 'Kuru' : 'Yarı kuru'),
        ctx.el('label.tirnak-etiket', ['Adı', ad]),
        ctx.el('button.dugme.tam', { type: 'button', onclick: () => {
          const l = ozelFircalar(), id = 'oz-' + CD.kimlik().slice(0, 8);
          const kayit = { id, ad: (ad.value.trim() || 'Benim fırçam').slice(0, 24), grup: 'Fırçalarım', sk: f.sk, g: +(f.g * (.6 + f.uz * .4)).toFixed(4), u: +f.u.toFixed(2), kap: +(.4 + f.akis * .8 * (1.2 - f.sert * .4)).toFixed(2), k: Math.round(f.k), kuru: +f.kuru.toFixed(2), o: +f.o.toFixed(2), uz: +f.uz.toFixed(2) };
          l.unshift(kayit); ctx.depo.yaz(FIRCALARIM, l.slice(0, 12)); st.firca = id; ctx.ses.parilti(); ctx.sheetKapat(); ctx.toast('Fırça kaydedildi: ' + kayit.ad); ic.panelYenile(); modelGoster();
        } }, '💾 Kaydet ve kullan')
      ]);
      ctx.sheet(kutu, { baslik: 'Özel fırça yapıcı', sessiz: true });
      ciz2();
    }
    function proOnizleme(g, s, hw, L, nw) {
      // önizleme: tırnak.js'in fırça çizicisini kullanmadan, aynı mantıkla basit damga
      const f = s.f, n = s.n.map(p => ({ x: p[0] * hw, y: -p[1] * L, w: p[2], a: p[3] }));
      g.fillStyle = s.renk; const gen = f.g * nw; const rnd = Y.tohumla(5);
      for (let i = 1; i < n.length; i++) {
        const p = n[i], q = n[i - 1], seg = Math.hypot(p.x - q.x, p.y - q.y), say = Math.max(1, Math.ceil(seg / Math.max(1, gen * .2))), aci = Math.atan2(p.y - q.y, p.x - q.x);
        for (let k = 0; k < say; k++) {
          const t = k / say, x = q.x + (p.x - q.x) * t, y = q.y + (p.y - q.y) * t, w = gen * (q.w + (p.w - q.w) * t) * (f.sk === 's' ? Math.max(.2, Math.min(1, Math.min(i / n.length, 1 - i / n.length) * 4 + (1 - f.u))) : 1), a = q.a + (p.a - q.a) * t;
          g.globalAlpha = f.o * (.35 + .65 * a); g.save(); g.translate(x, y);
          if (f.sk === 'd' || f.sk === 'a' || f.sk === 'f' || f.kuru > .15 || a < .35) { g.rotate(f.sk === 'a' ? -Math.PI / 4 : aci + Math.PI / 2); for (let b = 0; b < f.k; b++) { if (rnd() < (f.kuru + Math.max(0, .45 - a)) * .6 + (f.sk === 'f' ? .25 : 0)) continue; g.fillRect((b / Math.max(1, f.k - 1) - .5) * w * (f.sk === 'f' ? 1.6 : 1), -1.5, Math.max(1, w / f.k * .9), 3); } }
          else { g.beginPath(); g.arc(0, 0, w / 2, 0, 7); g.fill(); }
          g.restore();
        }
      }
      g.globalAlpha = 1;
    }
    // kendini güncelleyen bölmeli düğme (sayfa yenilenmeden)
    function seg2(liste, deger, fn, etiket) {
      const kap = ctx.el('div.tirnak-segment', { role: 'group', 'aria-label': etiket });
      liste.forEach(x => kap.appendChild(ctx.el('button.tirnak-segmentDugme', { type: 'button', 'aria-pressed': String(x.id === deger), data: { id: String(x.id) }, onclick: () => { kap.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === String(x.id)))); fn(x.id); } }, x.ad)));
      return kap;
    }
    function paletlerim() { const l = ctx.depo.al(PALETLERIM, []); return Array.isArray(l) ? l.filter(p => p && Array.isArray(p.renkler)) : []; }

    /* ------------------------------------------------------------ renk stüdyosu: tekerlek, HSL, hex, karıştırma paleti, kayıtlı paletler */
    function renkStudyosu(hedef) {
      let [h, s, l] = R.hexHsl(hedef === 'oje' ? (st.ojeRenk || '#E8546F') : st.renk);
      const tekerlek = ctx.el('canvas.tirnak-proTeker', { width: 240, height: 240, role: 'slider', tabIndex: 0, 'aria-label': 'Renk tekerleği: ton ve doygunluk', 'aria-valuetext': '' });
      const onRenk = ctx.el('div.tirnak-proOnRenk');
      const hexG = ctx.el('input.girdi.tirnak-proHex', { type: 'text', maxlength: '7', 'aria-label': 'Hex renk kodu', autocomplete: 'off' });
      const ad = ctx.el('span.sessiz');
      const sec = (hex, kaynak) => {
        if (!R.hexMi(hex)) return; [h, s, l] = R.hexHsl(hex);
        if (hedef === 'oje') st.ojeRenk = hex; else if (hedef === 'renk2') st.renk2 = hex; else st.renk = hex;
        onRenk.style.background = hex; if (kaynak !== 'hex') hexG.value = hex; ad.textContent = R.renkAdi(hex) || R.sevimliAd(hex);
        tekerlek.setAttribute('aria-valuetext', ad.textContent); tekCiz(); if (kaynak !== 'kay') kayGuncelle();
        const a = api(); if (a && a.aracGuncelle) a.aracGuncelle(modelSecenek());
      };
      const tekCiz = () => {
        const g = tekerlek.getContext('2d'), W = 240, r = 112, im = g.createImageData(W, W);
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          const dx = x - 120, dy = y - 120, dd = Math.hypot(dx, dy), k = (y * W + x) * 4; if (dd > r) { im.data[k + 3] = 0; continue; }
          const c = R.hexRgb(R.hslHex((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, dd / r * 100, l));
          im.data[k] = c[0]; im.data[k + 1] = c[1]; im.data[k + 2] = c[2]; im.data[k + 3] = 255;
        }
        g.putImageData(im, 0, 0);
        const a = h * Math.PI / 180, px = 120 + Math.cos(a) * s / 100 * r, py = 120 + Math.sin(a) * s / 100 * r;
        g.lineWidth = 3; g.strokeStyle = '#FFFFFF'; g.beginPath(); g.arc(px, py, 8, 0, 7); g.stroke(); g.lineWidth = 1.5; g.strokeStyle = '#3B3444'; g.beginPath(); g.arc(px, py, 10, 0, 7); g.stroke();
      };
      const tekerSec = (e) => { const rc = tekerlek.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * 240 - 120, y = (e.clientY - rc.top) / rc.height * 240 - 120; h = Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360); s = Math.round(Math.min(1, Math.hypot(x, y) / 112) * 100); sec(R.hslHex(h, s, l)); };
      tekerlek.addEventListener('pointerdown', e => { e.preventDefault(); tekerlek.setPointerCapture(e.pointerId); tekerSec(e); });
      tekerlek.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') tekerSec(e); });
      tekerlek.addEventListener('keydown', e => { const k = e.key; if (k === 'ArrowLeft') h = (h + 355) % 360; else if (k === 'ArrowRight') h = (h + 5) % 360; else if (k === 'ArrowUp') s = Math.min(100, s + 4); else if (k === 'ArrowDown') s = Math.max(0, s - 4); else return; e.preventDefault(); sec(R.hslHex(h, s, l)); });
      hexG.addEventListener('input', () => { let v = hexG.value.trim(); if (v[0] !== '#') v = '#' + v; if (R.hexMi(v)) sec(v.toUpperCase(), 'hex'); });
      const kayKap = ctx.el('div.dikey');
      const kayGuncelle = () => {
        kayKap.innerHTML = '';
        kayKap.append(
          U.kaydirici('Ton', 0, 359, h, 1, v => v + '°', v => { h = v; sec(R.hslHex(h, s, l), 'kay'); }),
          U.kaydirici('Doygunluk', 0, 100, s, 1, v => v + '%', v => { s = v; sec(R.hslHex(h, s, l), 'kay'); }),
          U.kaydirici('Açıklık', 4, 98, l, 1, v => v + '%', v => { l = v; sec(R.hslHex(h, s, l), 'kay'); })
        );
      };
      // karıştırma paleti: 2–3 rengi damlat, fırçayla karıştır, karışımdan dokunarak al
      const pal = ctx.el('canvas.tirnak-proPalet', { width: 320, height: 160, role: 'img', 'aria-label': 'Karıştırma paleti: renk damlat, sürükleyip karıştır, dokunarak karışımı al' });
      const pg = pal.getContext('2d');
      const paletSifirla = () => { pg.globalCompositeOperation = 'source-over'; pg.fillStyle = '#FFFFFF'; pg.fillRect(0, 0, 320, 160); pg.strokeStyle = '#EADFE2'; pg.lineWidth = 2; for (let k = 0; k < 3; k++) { pg.beginPath(); pg.arc(60 + k * 100, 80, 46, 0, 7); pg.stroke(); } };
      paletSifirla();
      let palMod = 'damlat', palSon = null;
      const palNokta = (e) => { const rc = pal.getBoundingClientRect(); return { x: (e.clientX - rc.left) / rc.width * 320, y: (e.clientY - rc.top) / rc.height * 160 }; };
      const karistir = (a, b) => {   // iki nokta arasındaki pigmentleri birbirine sürükleyerek ortalar
        const r = 14, ia = pg.getImageData(Math.max(0, a.x - r), Math.max(0, a.y - r), r * 2, r * 2), ib = pg.getImageData(Math.max(0, b.x - r), Math.max(0, b.y - r), r * 2, r * 2);
        for (let k = 0; k < ia.data.length; k += 4) { const m = (x, y) => Math.round(x * .55 + y * .45); ib.data[k] = m(ia.data[k], ib.data[k]); ib.data[k + 1] = m(ia.data[k + 1], ib.data[k + 1]); ib.data[k + 2] = m(ia.data[k + 2], ib.data[k + 2]); }
        pg.putImageData(ib, Math.max(0, b.x - r), Math.max(0, b.y - r));
      };
      pal.addEventListener('pointerdown', e => {
        e.preventDefault(); pal.setPointerCapture(e.pointerId); const p = palNokta(e); palSon = p;
        if (palMod === 'damlat') { const hex = hedef === 'oje' ? st.ojeRenk : st.renk; pg.fillStyle = hex || '#F48FB1'; pg.beginPath(); pg.arc(p.x, p.y, 20, 0, 7); pg.fill(); sesDamla(); }
        else if (palMod === 'al') { const c = pg.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data; sec(R.rgbHex(c[0], c[1], c[2])); ctx.ses.tink(); }
      });
      pal.addEventListener('pointermove', e => { if (!palSon || palMod !== 'karistir') return; const p = palNokta(e); karistir(palSon, p); palSon = p; });
      pal.addEventListener('pointerup', () => { palSon = null; });
      const palModSeg = seg2([{ id: 'damlat', ad: 'Damlat' }, { id: 'karistir', ad: 'Karıştır' }, { id: 'al', ad: 'Karışımı al' }], palMod, v => { palMod = v; ctx.ses.tik(); }, 'Palet aracı');
      // kayıtlı paletler
      const paletKap = ctx.el('div.dikey');
      const paletleriCiz = () => {
        paletKap.innerHTML = '';
        const l = paletlerim();
        l.forEach(p => paletKap.appendChild(ctx.el('div.satir.tirnak-proPaletSatir', [ctx.el('span.kalin', p.ad), ctx.el('span.bosluk'), U.renkSatiri(p.renkler, null, r => sec(r), p.ad), ctx.el('button.dugme-hayalet', { type: 'button', 'aria-label': p.ad + ' paletini sil', onclick: () => { ctx.depo.yaz(PALETLERIM, paletlerim().filter(x => x.id !== p.id)); paletleriCiz(); } }, 'Sil')])));
        if (!l.length) paletKap.appendChild(U.not('Henüz kayıtlı palet yok. Son renklerini palet olarak sakla.'));
      };
      paletleriCiz();
      const kutu = ctx.el('div.dikey.tirnak-proRenk', [
        ctx.el('div.satir', [onRenk, ad, ctx.el('span.bosluk'), hexG]),
        tekerlek, kayKap,
        U.altBaslik('Karıştırma paleti'), palModSeg, pal,
        ctx.el('button.dugme-hayalet', { type: 'button', onclick: paletSifirla }, 'Paleti temizle'),
        U.altBaslik('Kayıtlı paletler'), paletKap,
        ctx.el('button.dugme-ikincil', { type: 'button', onclick: () => { const r = [st.renk, st.renk2, st.ojeRenk].concat(ic.d.sonRenkler || []).filter(R.hexMi).filter((x, i, a) => a.indexOf(x) === i).slice(0, 8); const l = paletlerim(); l.unshift({ id: CD.kimlik().slice(0, 8), ad: 'Paletim ' + (l.length + 1), renkler: r }); ctx.depo.yaz(PALETLERIM, l.slice(0, 12)); ctx.ses.parilti(); paletleriCiz(); } }, '💾 Son renkleri palet olarak sakla'),
        ctx.el('button.dugme.tam', { type: 'button', onclick: () => { ctx.sheetKapat(); ic.panelYenile(); } }, 'Tamam')
      ]);
      ctx.sheet(kutu, { baslik: hedef === 'oje' ? 'Oje rengi' : 'Fırça rengi', sessiz: true, kapaninca: () => ic.panelYenile() });
      sec(hedef === 'oje' ? (st.ojeRenk || '#E8546F') : hedef === 'renk2' ? st.renk2 : st.renk);
    }

    /* ------------------------------------------------------------ araç tepsisi (kategori başına) */
    function tepsi(kat) {
      st.kategori = kat;
      const liste = KATEGORI[kat]; if (!liste) return null;
      if (st.arac && !liste.includes(st.arac)) { st.arac = null; const a = api(); if (a && a.arac) a.arac(null); }
      const dugmeler = liste.map(id => {
        const A = ARAC[id], secili = st.arac === id;
        return ctx.el('button.tirnak-proArac', { type: 'button', 'aria-pressed': String(secili), title: A.ipucu, onclick: () => aracSec(id) }, [ctx.el('span.tirnak-proAracIkon', { 'aria-hidden': 'true' }, A.ikon), ctx.el('span.tirnak-proAracAd', A.ad)]);
      });
      const ust = ctx.el('div.tirnak-proUst', [
        ctx.el('span.kalin', 'Araçlar'), ctx.el('span.bosluk'),
        U.segment([{ id: 'pro', ad: 'Profesyonel' }, { id: 'serbest', ad: 'Serbest' }], ayar.mod, v => { ayar.mod = v; kaydet(); ctx.ses.tik(); ctx.toast(v === 'pro' ? 'Profesyonel mod: her adım sırayla ve zorunlu.' : 'Serbest mod: istediğin sırayla çalış.'); ic.panelYenile(); }, 'Çalışma modu')
      ]);
      const kap = ctx.el('div.tirnak-proTepsi', [ust, ctx.el('div.tirnak-proAraclar', { role: 'group', 'aria-label': 'Araç tepsisi' }, dugmeler)]);
      if (st.arac) {
        const A = ARAC[st.arac];
        kap.appendChild(ctx.el('div.tirnak-proSecili', [ctx.el('span.tirnak-proSeciliIkon', { 'aria-hidden': 'true' }, A.ikon), ctx.el('div', [ctx.el('div.kalin', A.ad), ctx.el('p.sessiz.tirnak-not', A.ipucu + (ic.mod3d ? '' : ' (2D salonda araç modeli gizli.)'))])]));
        const ay = aracAyar(st.arac); if (ay && ay.length) kap.appendChild(ctx.el('div.dikey.tirnak-proAyar', ay.filter(Boolean)));
      } else kap.appendChild(U.not(kat === 'final' ? 'Üst kat, poz ve fotoğraf. Bir araç seç ya da aşağıdan devam et.' : 'Bir araç seç: parmağınla tırnağın üstünde gerçekten kullanırsın.'));
      return kap;
    }
    function aracSec(id) {
      const A = ARAC[id]; if (!A) return;
      ctx.ses.tik();
      if (A.dugme) {
        if (id === 'su') ic.suyaDaldir();
        else if (id === 'poz') pozMenu();
        else if (id === 'foto') hizliFoto();
        return;
      }
      if (A.vekil) { st.arac = null; ic.arac.grup = 'mermer'; ic.arac.id = A.vekil; ic.balon(A.ipucu, 1800); ic.panelYenile(); return; }
      st.arac = st.arac === id ? null : id;
      if (st.arac === 'oje' && !st.ojeRenk) st.ojeRenk = ic.aktifTirnak().renk || '#E8546F';
      if (st.arac) ipucuBir(st.arac);
      modelGoster(); ic.panelYenile();
    }
    function aracAyar(id) {
      const seg = (l, v, fn, et) => U.segment(l, v, x => { fn(x); ctx.ses.tik(); ic.panelYenile(); modelGoster(); }, et);
      const renkBtn = (etiket, hedef) => ctx.el('button.dugme-ikincil.kucuk.tirnak-proRenkBtn', { type: 'button', onclick: () => renkStudyosu(hedef) }, [ctx.el('span.tirnak-proRenkNokta', { style: '--renk:' + (hedef === 'oje' ? st.ojeRenk : hedef === 'renk2' ? st.renk2 : st.renk) }), etiket]);
      const hizliRenk = (anahtar) => U.renkSatiri(S.SANAT_RENKLERI, st[anahtar], r => { st[anahtar] = r; ctx.ses.tik(); ic.panelYenile(); modelGoster(); }, 'Renk');
      switch (id) {
        case 'torpu': return [seg(KUM.map(k => ({ id: k.id, ad: k.ad })), st.kum, v => { st.kum = v; }, 'Kum'), U.not((KUM.find(k => k.id === st.kum) || KUM[2]).not), seg(TORPU_SEKIL, st.torpuSekil, v => { st.torpuSekil = v; }, 'Törpü şekli'), ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { ic.gecmisKaydet(); ic.hedefler(false).forEach(i => { delete ic.d.eller[ic.d.el][i].form; }); ic.tirnakCizIste(); ic.kaydetGec(); } }, 'Şekli sıfırla')];
        case 'efile': return [seg(EFILE_UC, st.efileUc, v => { st.efileUc = v; }, 'Uç'), U.kaydirici('Devir', 5000, 30000, st.devir, 1000, v => Math.round(v / 1000) + ' bin/dk', v => { st.devir = v; })];
        case 'oje': return [
          ctx.el('div.tirnak-proYuk', { role: 'meter', 'aria-label': 'Fırçadaki oje', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(st.ojeYuk * 100)), style: '--yuk:' + st.ojeYuk + ';--renk:' + (st.ojeRenk || '#E8546F') }, [ctx.el('span.tirnak-proYukDolu')]),
          ctx.el('div.izgara-2', [ctx.el('button.dugme', { type: 'button', onclick: ojeDaldir }, '🖌️ Şişeye daldır'), renkBtn('Renk', 'oje')]),
          U.renkSatiri(oneriRenkler(), st.ojeRenk, r => { st.ojeRenk = r; ctx.ses.tik(); ic.panelYenile(); modelGoster(); }, 'Oje rengi'),
          seg([{ id: 'krem', ad: 'Krem' }, { id: 'jelly', ad: 'Jöle' }, { id: 'sheer', ad: 'Tül' }, { id: 'metalik', ad: 'Metalik' }, { id: 'kediGozu', ad: 'Kedi gözü' }], st.ojeTur, v => { st.ojeTur = v; }, 'Oje türü'),
          bitisBirlesim()
        ];
        case 'firca': {
          const gruplar = {}; FIRCALAR.concat(ozelFircalar()).forEach(f => { (gruplar[f.grup || 'Fırçalarım'] = gruplar[f.grup || 'Fırçalarım'] || []).push(f); });
          return [
            ctx.el('div.tirnak-proFircalar', Object.keys(gruplar).map(gr => ctx.el('div.tirnak-proFircaGrup', [ctx.el('div.tirnak-altBaslik', gr), ctx.el('div.tirnak-proFircaListe', gruplar[gr].map(f => ctx.el('button.tirnak-proFirca', { type: 'button', 'aria-pressed': String(f.id === st.firca), onclick: () => { st.firca = f.id; ctx.ses.tik(); ic.panelYenile(); modelGoster(); } }, [ctx.el('span.tirnak-proFircaUc', { style: '--g:' + Math.max(2, Math.round(f.g * 60)) + 'px;--u:' + (f.sk === 'd' || f.sk === 'a' ? '2px' : '50%') }), f.ad])))]))),
            ctx.el('div.izgara-2', [renkBtn('Renk', 'renk'), ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: fircaYapici }, '🛠️ Özel fırça yap')]),
            hizliRenk('renk'),
            U.kaydirici('Yumuşatma (titreme süzgeci)', 0, .95, st.stab, .05, v => Math.round(v * 100) + '%', v => { st.stab = v; })
          ];
        }
        case 'nokta': return [seg(NOKTA_KALEM, st.nokta, v => { st.nokta = v; }, 'Nokta boyu'), renkBtn('Renk', 'renk'), hizliRenk('renk')];
        case 'ombre': return [ctx.el('div.izgara-2', [renkBtn('Dip rengi', 'renk'), renkBtn('Uç rengi', 'renk2')])];
        case 'metal': return [U.renkSatiri(METAL_RENK.map(m => m[1]), st.metalRenk, r => { st.metalRenk = r; ctx.ses.tik(); ic.panelYenile(); modelGoster(); }, 'Metal rengi'), U.kaydirici('Çizgi kalınlığı', .03, .16, st.metalK, .01, v => Math.round(v * 100) + '', v => { st.metalK = v; })];
        case 'cimbiz': return [
          ctx.el('div.tirnak-proTaslar', S.SUSLER.filter(s => /^tas|kristal|inci|charm|civi|zincir|halka/.test(s.id)).slice(0, 24).map(s => ctx.el('button.tirnak-proTas', { type: 'button', 'aria-pressed': String(st.tas === s.id), onclick: () => { st.tas = s.id; ctx.ses.tik(); ic.panelYenile(); } }, s.ad))),
          U.renkSatiri(S.TAS_RENKLERI, st.tasRenk, r => { st.tasRenk = r; ctx.ses.tik(); ic.panelYenile(); sonTasDegistir(p => { p.renk = r; }); }, 'Taş rengi'),
          U.kaydirici('Boyut', .08, .8, st.tasBoy, .01, v => Math.round(v * 100) + '', v => { st.tasBoy = v; sonTasDegistir(p => { p.olcek = v; }); }),
          U.kaydirici('Döndür', -3.14, 3.14, st.tasDon, .05, v => Math.round(v * 57.3) + '°', v => { st.tasDon = v; sonTasDegistir(p => { p.don = v; }); })
        ];
        case 'sticker': return [ctx.el('div.tirnak-proStickerlar', S.CIKARTMALAR.map(c => ctx.el('button.tirnak-proSticker', { type: 'button', 'aria-pressed': String(st.sticker === c.id), 'aria-label': c.ad, title: c.ad, onclick: () => { st.sticker = c.id; ctx.ses.tik(); ic.panelYenile(); } }, [stickerMini(c), ctx.el('span', c.ad)])))];
        case 'heykel': return [
          seg(HEYKEL_MOD, st.heykelMod, v => { st.heykelMod = v; }, 'Heykel aracı'),
          U.renkSatiri(['#FFFFFF', '#F48FB1', '#D81E3C', '#8C0F26', '#FFD1DC', '#FFE28A', '#7CCB9A', '#7EC8FF', '#B48CFF', '#19161C', '#F2A65A', '#E9C9B6'], st.heykelRenk, r => { st.heykelRenk = r; ctx.ses.tik(); ic.panelYenile(); modelGoster(); }, 'Jel rengi'),
          U.altBaslik('Hazır heykeller'),
          ctx.el('div.tirnak-proTaslar', HEYKEL_HAZIR.filter(([hid]) => S.SUSLER.some(s => s.id === hid)).map(([hid, ad]) => ctx.el('button.tirnak-proTas', { type: 'button', onclick: () => heykelHazir(hid) }, ad))),
          ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { ic.gecmisKaydet(); ic.hedefler(false).forEach(i => { delete ic.d.eller[ic.d.el][i].hacim; }); ic.tirnakCizIste(); ic.kaydetGec(); } }, 'Hacmi temizle')
        ];
        case 'krom': return [U.renkSatiri(KROM.map(k => k.renk), (KROM.find(k => k.id === st.krom) || KROM[0]).renk, r => { st.krom = (KROM.find(k => k.renk === r) || KROM[0]).id; ctx.ses.tik(); ic.panelYenile(); modelGoster(); }, 'Krom tozu'), U.not((KROM.find(k => k.id === st.krom) || KROM[0]).ad + ': ovdukça açılır.')];
        case 'folyo': return [seg([{ id: 'jel', ad: '1. Jel sür' }, { id: 'bastir', ad: '2. Bastır' }, { id: 'cek', ad: '3. Çek' }], st.folyoAsama, v => { st.folyoAsama = v; }, 'Folyo adımı'), U.renkSatiri(S.FOLYOLAR.map(f => f.renk), st.folyoRenk, r => { st.folyoRenk = r; ctx.ses.tik(); ic.panelYenile(); }, 'Folyo rengi')];
        case 'damga': {
          const plaka = ctx.el('canvas.tirnak-proPlaka', { width: 300, height: 90, role: 'img', 'aria-label': 'Damga plakası: kazıyıcıyla sağa doğru sürükle' });
          const pg = plaka.getContext('2d');
          const plakaCiz = (kazi) => { pg.fillStyle = '#C9CED6'; pg.fillRect(0, 0, 300, 90); pg.fillStyle = '#9EA5B0'; for (let k = 0; k < 5; k++) { pg.beginPath(); pg.arc(30 + k * 60, 45, 18, 0, 7); pg.fill(); } if (st.damga.asama >= 1) { pg.fillStyle = st.damga.renk; pg.globalAlpha = .9; pg.fillRect(0, 0, kazi == null ? 300 : 300 - kazi, 90); pg.globalAlpha = 1; if (kazi != null || st.damga.asama >= 2) { pg.fillStyle = st.damga.renk; for (let k = 0; k < 5; k++) { pg.beginPath(); pg.arc(30 + k * 60, 45, 18, 0, 7); pg.fill(); } } } };
          let kaziX = null;
          plaka.addEventListener('pointerdown', e => { if (st.damga.asama !== 1) return; e.preventDefault(); plaka.setPointerCapture(e.pointerId); kaziX = 0; });
          plaka.addEventListener('pointermove', e => { if (kaziX == null) return; const rc = plaka.getBoundingClientRect(); kaziX = Math.max(kaziX, (e.clientX - rc.left) / rc.width * 300); plakaCiz(kaziX); if (Math.random() < .3) sesTorpu(.05, 240); if (kaziX > 270) { kaziX = null; st.damga.asama = 2; ctx.ses.tink(); ic.balon('Fazlası sıyrıldı. Şimdi tamponla al.', 1600); ic.panelYenile(); } });
          plaka.addEventListener('pointerup', () => { kaziX = null; });
          setTimeout(() => plakaCiz(), 0);
          const asamaAd = ['1. Plakaya oje sür', '2. Kazıyıcıyla sıyır', '3. Tamponla al', '4. Tırnağa bas'][st.damga.asama];
          return [
            U.segment(S.DAMGALAR.map(x => ({ id: x.id, ad: x.ad })), st.damga.desen, v => { st.damga.desen = v; st.damga.asama = 0; ctx.ses.tik(); ic.panelYenile(); }, 'Plaka deseni'),
            plaka, U.not('Sıradaki: ' + asamaAd + (st.damga.asama === 1 ? ' (plakanın üstünde sağa sürükle)' : st.damga.asama === 3 ? ' (basarken kaydırırsan desen kayar)' : '')),
            ctx.el('div.izgara-2', [
              ctx.el('button.dugme' + (st.damga.asama === 0 ? '' : '.dugme-ikincil'), { type: 'button', onclick: () => { st.damga.asama = 1; ctx.ses.slip(); ic.panelYenile(); } }, 'Plakaya oje'),
              ctx.el('button.dugme' + (st.damga.asama === 2 ? '' : '.dugme-ikincil'), { type: 'button', disabled: st.damga.asama !== 2, onclick: () => { st.damga.asama = 3; ctx.ses.pop(); ic.balon('Desen tamponda. Tırnağa bas!', 1600); ic.panelYenile(); const a = api(); if (a && a.aracGuncelle) a.aracGuncelle(Object.assign(modelSecenek(), { dolu: true })); } }, 'Tamponla al')
            ]),
            U.renkSatiri(S.SANAT_RENKLERI, st.damga.renk, r => { st.damga.renk = r; ctx.ses.tik(); ic.panelYenile(); }, 'Damga ojesi')
          ];
        }
        case 'airbrush': return [renkBtn('Renk', 'renk'), hizliRenk('renk'), U.kaydirici('Mesafe (yayılma)', .12, .8, st.sprey.yay, .02, v => Math.round(v * 100) + '', v => { st.sprey.yay = v; }), U.kaydirici('Basınç', .1, 1, st.sprey.yog, .05, v => Math.round(v * 100) + '%', v => { st.sprey.yog = v; }), seg(SABLON_AD.map(([sid, ad]) => ({ id: sid, ad })), st.sprey.sb, v => { st.sprey.sb = v; }, 'Şablon')];
        case 'bloom': return [renkBtn('Mürekkep', 'renk'), hizliRenk('renk')];
        case 'miknatis': return [U.not('Kedi gözü ojesi sürülü tırnakta mıknatısı gezdir. Bandın yönü hareketine göre döner.')];
        case 'taban': return null;
        case 'top': case 'base': case 'builder': case 'dehidrator': case 'primer': case 'alkol':
          return [jelDurum(), lambaKisa()];
        case 'yag': case 'aseton': case 'itici': case 'parlatici': case 'tozFirca': case 'makas': return [hazirlikDurum()];
        case 'poly': case 'form': case 'slip': return [jelDurum(), lambaKisa()];
        case 'temizle': { const n = ic.d.eller[ic.d.el].reduce((a, t) => a + ((t.tasma && t.tasma.length) || 0), 0); return [U.not(n ? n + ' taşma lekesi var.' : 'Taşma yok, tertemiz.')]; }
        case 'damlalik': return [ctx.el('div.satir', [ctx.el('span.tirnak-proRenkNokta', { style: '--renk:' + st.renk }), ctx.el('span', R.renkAdi(st.renk) || R.sevimliAd(st.renk))]), renkBtn('Renk stüdyosu', 'renk')];
        default: return null;
      }
    }
    function oneriRenkler() { const l = []; S.PALET.forEach(k => { if (!k.krom) k.renkler.slice(0, 2).forEach(r => { if (!l.includes(r[1])) l.push(r[1]); }); }); return l.slice(0, 24); }
    function bitisBirlesim() {
      const t = ic.aktifTirnak();
      return ctx.el('details.tirnak-ozel', [ctx.el('summary', 'Bitişleri birleştir'), ctx.el('div.dikey', [
        U.not('Ojenin içine ikinci bir bitiş karıştır (jöle + sim gibi). Mat ya da krom üst kat Final ve Efekt adımında.'),
        U.segment([{ id: 'yok', ad: 'Yok' }, { id: 'simInce', ad: 'İnce sim' }, { id: 'simIri', ad: 'İri sim' }, { id: 'simHolo', ad: 'Holo sim' }], t.ekBitis || 'yok', v => { ic.uygula(tt => { if (v === 'yok') delete tt.ekBitis; else tt.ekBitis = v; }, false, true); ctx.ses.tik(); ic.panelYenile(); }, 'İkinci bitiş')
      ])]);
    }
    function stickerMini(c) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; cv.className = 'tirnak-proStickerMini'; cv.setAttribute('aria-hidden', 'true');
      const g = cv.getContext('2d'), f = S.CIKARTMA_CIZ[c.id]; if (f) { g.translate(32, 32); try { f(g, 50, c.renk || '#F48FB1'); } catch (e) {} }
      return cv;
    }
    function jelDurum() {
      const t = ic.aktifTirnak(), j = t.jel || {};
      const adim = (ad, ok) => ctx.el('li' + (ok ? '.tamam' : ''), (ok ? '✓ ' : '○ ') + ad);
      return ctx.el('ol.tirnak-proJel', { 'aria-label': 'Jel adımları' }, [adim('Dehidratör', j.dehidrator), adim('Primer', j.primer), adim('Base jel', j.base), adim('Renk', t.renk), adim('Builder (isteğe bağlı)', j.builder > .1), adim('Top jel', t.top), adim('Yapışkan kat silindi', t.top && !j.inh && !(t.kur && t.kur.top === false))]);
    }
    function lambaKisa() {
      const bek = ic.d.eller[ic.d.el].filter(ic.yapiskanMi).length;
      return ctx.el('div.yama.siki.tirnak-lamba' + (bek ? '.bekliyor' : ''), [
        ctx.el('div.satir', [ctx.el('span.kalin', '💡 UV/LED lamba'), ctx.el('span.bosluk'), U.segment([{ id: 30, ad: '30 sn' }, { id: 60, ad: '60 sn' }, { id: 90, ad: '90 sn' }], ic.d.lambaSure, v => { ic.d.lambaSure = v; ctx.ses.tik(); ic.kaydetGec(); ic.panelYenile(); }, 'Kür süresi')]),
        U.not(bek ? bek + ' tırnak kürlenmedi: yapış yapış.' : 'Kürlenecek kat yok.'),
        ctx.el('button.dugme.tam' + (bek ? '.inci' : ''), { type: 'button', onclick: ic.lambayaKoy }, 'Eli lambaya sok')
      ]);
    }
    function hazirlikDurum() {
      const hz = ic.d.hazirlik[ic.d.el];
      if (hz.adim >= S.HAZIRLIK.length) return U.not('Hazırlık tamam. Araçları yine kullanabilirsin.');
      return U.not('Sıradaki hazırlık adımı: ' + S.HAZIRLIK[hz.adim].ad + (proModMu() ? ' (profesyonel sıra)' : ''));
    }

    /* ------------------------------------------------------------ profesyonel mod: adım kapısı */
    function adimIzin(id) {
      if (!proModMu()) return true;
      const sira = S.ADIMLAR.map(a => a.id), hedef = sira.indexOf(id), simdi = sira.indexOf(ic.d.adim);
      if (hedef <= simdi) return true;
      const el = ic.d.eller[ic.d.el], eksik = [];
      if (hedef > 0 && !ic.hazirMi(ic.d.el)) eksik.push('hazırlık');
      if (hedef > 2 && !el.every(t => (t.jel && t.jel.base) || t.baz !== 'seffaf')) eksik.push('taban/base');
      if (hedef > 3 && !el.every(t => t.renk && t.kat >= 1)) eksik.push('renk');
      if (hedef > 2 && el.some(ic.yapiskanMi) && hedef !== 7) eksik.push('lamba');
      if (eksik.length) { ic.balon('Profesyonel mod: önce ' + eksik.join(', ') + ' bitsin. (Serbest moda geçebilirsin.)', 2800); ctx.ses.hmpf && ctx.ses.hmpf(); return false; }
      return true;
    }

    /* ------------------------------------------------------------ lamba olayları (bip sesi) */
    let lambaT = [];
    function lambaBasladi(sure) { sesBip(1760, .1, .07); lambaT.forEach(clearTimeout); lambaT = [1, 2, 3].map(k => setTimeout(() => sesBip(1320, .05, .03), sure * k / 4)); }
    function lambaBitti() { lambaT.forEach(clearTimeout); lambaT = []; sesBip(2093, .12, .08); setTimeout(() => sesBip(2637, .16, .08), 140); }

    barKur();
    const api3Bekle = setInterval(() => { if (!ic.ctx) return; barGuncelle(); }, 1500);

    return {
      aktif: aktifMi, bosKabul: () => false,
      bas, tasi, birak, tepsi, adimIzin, lambaBasladi, lambaBitti,
      klasikKapali: () => !!st.arac,
      arac: () => st.arac, sec: (id) => { st.arac = null; aracSec(id); }, durum: () => JSON.parse(JSON.stringify(st)), ayar: (a) => { Object.assign(st, a || {}); modelGoster(); },
      mod: (m) => { if (m) { ayar.mod = m; kaydet(); } return ayar.mod; },
      ojeDaldir, kontrolPozuCek, hizliFoto, renkStudyosu, fircaYapici, heykelHazir, pozSec, aciGit,
      fircalar: () => FIRCALAR.concat(ozelFircalar()), kategoriler: () => KATEGORI,
      yokEt() {
        clearInterval(api3Bekle); sesEfileDur(); lambaT.forEach(clearTimeout); lambaT = [];
        iptaller.forEach(f => { try { f(); } catch (e) {} });
        if (bar && bar.parentNode) bar.parentNode.removeChild(bar); bar = null; surukle = null;
      }
    };
  }

  (window.CD = window.CD || {}).tirnakPro = { kur, FIRCALAR, ARAC, KATEGORI, surum: 1 };
})();
