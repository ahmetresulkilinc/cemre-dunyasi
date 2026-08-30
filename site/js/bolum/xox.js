/* js/bolum/xox.js — XOX (sıra tabanlı, iki telefon arası)
   Cemre 🎀 fiyonkla, Ahmet 💙 kalple oynar. Tek anahtar: cd.xox.durum → bulut senkronu
   hamleyi karşı telefona taşır. Bulut kapalıysa (ya da kim olduğu seçilmediyse) aynı
   telefonda sırayla oynanır. Cihaza özel notlar cd.cihaz.xox.* altında (buluta gitmez). */
(() => {
  'use strict';
  const ID = 'xox';

  /* ------------------------------------------------------------ sabitler */
  const KAZANAN_UCLU = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  const MESAJLAR = ['iyi şanslar 💗', 'bunu göremedin 😌', 'hadi ama!', 'sıra sende 🎀', 'düşün bakalım 🤔', 'affettim bu seferlik 😇'];
  const GECMIS_SAYI = 5;
  const SENK_ARA = 15000;

  const IKON = [
    '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">',
    '<g stroke="var(--murekkep-2, #5D5566)" stroke-width="3.6" stroke-linecap="round" opacity=".6">',
    '<path d="M25 9V55"/><path d="M43 9V55"/><path d="M9 25H55"/><path d="M9 43H55"/>',
    '</g>',
    '<path fill="var(--seker-kiraz, #FF9DB4)" d="M16.5 22.6c-4.9-3.3-6.9-6-6.9-8.3 0-2.5 1.9-4.2 4-4.2 1.6 0 2.5.9 2.9 1.8.4-.9 1.3-1.8 2.9-1.8 2.1 0 4 1.7 4 4.2 0 2.3-2 5-6.9 8.3Z"/>',
    '<g fill="var(--goz, #6F97AC)">',
    '<ellipse cx="34" cy="39.5" rx="6.4" ry="5.1"/>',
    '<ellipse cx="28.3" cy="31.2" rx="2.4" ry="3.1"/>',
    '<ellipse cx="34" cy="29.8" rx="2.4" ry="3.1"/>',
    '<ellipse cx="39.7" cy="31.2" rx="2.4" ry="3.1"/>',
    '</g></svg>'
  ].join('');

  const FIYONK = [
    '<svg class="xox-isaret xox-fiyonk" viewBox="0 0 64 64" aria-hidden="true" focusable="false">',
    '<path class="xox-kuyruk" d="M28 35.5C25 44 23.4 50 22.3 56"/>',
    '<path class="xox-kuyruk" d="M36 35.5C39 44 40.6 50 41.7 56"/>',
    '<path class="xox-dolgu" d="M32 32C24.4 19.8 11 16.8 7.2 25.2 3.5 33.5 12.2 42.6 32 32Z"/>',
    '<path class="xox-dolgu" d="M32 32C39.6 19.8 53 16.8 56.8 25.2 60.5 33.5 51.8 42.6 32 32Z"/>',
    '<ellipse class="xox-dolgu" cx="32" cy="32.4" rx="6.4" ry="6"/>',
    '</svg>'
  ].join('');

  const KALP = [
    '<svg class="xox-isaret xox-kalp" viewBox="0 0 64 64" aria-hidden="true" focusable="false">',
    '<path class="xox-dolgu" d="M32 55.4C13.6 43.2 7.2 32.5 7.2 23.8 7.2 15.6 13.5 10.2 20 10.2c5 0 9.2 3 12 7.5 2.8-4.5 7-7.5 12-7.5 6.5 0 12.8 5.4 12.8 13.6 0 8.7-6.4 19.4-24.8 31.6Z"/>',
    '</svg>'
  ].join('');

  const IZGARA = [
    '<svg class="xox-izgara" viewBox="0 0 300 300" fill="none" aria-hidden="true" focusable="false">',
    '<path style="--g:1" d="M100.5 14C99.2 78 101.4 150 100 286"/>',
    '<path style="--g:2" d="M200 15C201.4 79 199 151 200.6 285"/>',
    '<path style="--g:3" d="M14 99.6C78 101 150 98.8 286 100.4"/>',
    '<path style="--g:4" d="M15 200.2C79 198.8 151 201.2 285 199.6"/>',
    '</svg>'
  ].join('');

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null;
  const ui = {};
  let senkT = 0, notT = 0, yeniT = 0, sayacT = 0;
  const cozler = [];                       // CD.olay.dinle geri alma fonksiyonları

  /* ÖNEMLİ: senk.js yalnızca kök CD.depo.yaz'ı sarmalayıp zaman damgası basıyor.
     ctx.depo.yaz (CD.depo.alan('xox')) ayrı bir nesne, damgalanmıyor → damgasız yazılan
     hamle birleştirmede kaybolur. Bu yüzden oyun durumu kök depoya tam anahtarla yazılır;
     yer aynı: cd.xox.durum. Cihaza özel notlar cd.cihaz.xox.* (senk ATLA listesinde). */
  const ANAHTAR = ID + '.durum';
  const IPUCU = ID + '.ipucu';
  const cihazAl = (k, v) => CD.depo.al('cihaz.' + ID + '.' + k, v);
  const cihazYaz = (k, v) => CD.depo.yaz('cihaz.' + ID + '.' + k, v);

  const adi = (k) => (CD.kimAdi ? CD.kimAdi(k) : (k === 'ahmet' ? 'Ahmet' : 'Cemre'));
  const rakip = (k) => (k === 'ahmet' ? 'cemre' : 'ahmet');
  const ben = () => (CD.kim ? CD.kim() : null);
  const bulutVar = () => !!(CD.senk && CD.senk.acik);
  const ayniTelefon = () => !bulutVar() || !ben();     // sırayla tek telefonda oynama modu
  const oynayabilirMi = (kim) => ayniTelefon() || kim === ben();

  function varsayilan() {
    return {
      s: 1,
      tahta: ['', '', '', '', '', '', '', '', ''],
      sira: 'cemre',
      baslayan: 'cemre',
      kazanan: null,
      cizgi: null,
      skor: { cemre: 0, ahmet: 0, berabere: 0 },
      sonHamle: null,
      oyunNo: 1,
      gecmis: []
    };
  }

  function oku() {
    const g = Object.assign(varsayilan(), CD.depo.al(ANAHTAR, {}) || {});
    if (!Array.isArray(g.tahta) || g.tahta.length !== 9) g.tahta = varsayilan().tahta;
    g.tahta = g.tahta.map(h => (h === 'cemre' || h === 'ahmet') ? h : '');
    if (g.sira !== 'cemre' && g.sira !== 'ahmet') g.sira = 'cemre';
    if (g.baslayan !== 'cemre' && g.baslayan !== 'ahmet') g.baslayan = 'cemre';
    if (g.kazanan !== 'cemre' && g.kazanan !== 'ahmet' && g.kazanan !== 'berabere') g.kazanan = null;
    if (!Array.isArray(g.cizgi) || g.cizgi.length !== 3) g.cizgi = null;
    g.skor = Object.assign({ cemre: 0, ahmet: 0, berabere: 0 }, g.skor || {});
    g.oyunNo = Number(g.oyunNo) || 1;
    if (!Array.isArray(g.gecmis)) g.gecmis = [];
    g.gecmis = g.gecmis.slice(0, GECMIS_SAYI);
    if (g.sonHamle && typeof g.sonHamle !== 'object') g.sonHamle = null;
    return g;
  }

  function yazDurum(g) {
    CD.depo.yaz(ANAHTAR, g);       // damgalanır → bulut birleştirmesinde yeni olan kazanır
    ipucuYaz(g);
  }

  function ipucuYaz(g) {
    let m = '';
    if (g.kazanan === 'berabere') m = 'Berabere bitti 🤝';
    else if (g.kazanan) m = adi(g.kazanan) + ' kazandı ' + (g.kazanan === 'cemre' ? '🎀' : '💙');
    else m = 'Sıra ' + (g.sira === 'cemre' ? adi('cemre') + '\'de 🎀' : adi('ahmet') + '\'te 💙');
    CD.depo.yaz(IPUCU, m);
  }

  function kazananBul(tahta) {
    for (let i = 0; i < KAZANAN_UCLU.length; i++) {
      const [a, b, c] = KAZANAN_UCLU[i];
      if (tahta[a] && tahta[a] === tahta[b] && tahta[a] === tahta[c]) return { kim: tahta[a], cizgi: KAZANAN_UCLU[i] };
    }
    return null;
  }

  function once(zaman) {
    if (!zaman) return '';
    const f = Math.max(0, Date.now() - zaman);
    if (f < 45000) return 'az önce';
    const dk = Math.round(f / 60000);
    if (dk < 60) return dk + ' dakika önce';
    const st = Math.round(dk / 60);
    if (st < 24) return st + ' saat önce';
    return Math.round(st / 24) + ' gün önce';
  }

  /* ------------------------------------------------------------ DOM kurulumu */
  function kur(el) {
    const e = ctx.el;

    /* kimlik şeridi */
    ui.kimAd = e('span.xox-kim-ad');
    ui.kimDegis = e('button.dugme-hayalet.xox-kim-dugme', { type: 'button', onclick: kimDegistir }, 'değiştir');
    ui.bulutNot = e('p.sessiz.xox-bulut-not', { role: 'status' });
    const kimlik = e('div.yama.siki.xox-kimlik', [
      e('div.satir.arasi.xox-kimlik-satir', [
        e('span.xox-kim', [e('span.sessiz', 'Sen:'), ui.kimAd]),
        ui.kimDegis
      ]),
      ui.bulutNot
    ]);

    /* durum kartı */
    ui.siraCemre = e('span.xox-sira-yuz.xox-sira-cemre', { html: FIYONK, 'aria-hidden': 'true' });
    ui.siraAhmet = e('span.xox-sira-yuz.xox-sira-ahmet', { html: KALP, 'aria-hidden': 'true' });
    ui.siraCizgi = e('span.xox-sira-cizgi', { 'aria-hidden': 'true' });
    ui.durumMetin = e('p.baslik.baslik-lg.xox-durum-metin');
    ui.durumAlt = e('p.sessiz.xox-durum-alt');
    const durum = e('div.yama.xox-durum', { role: 'status', 'aria-live': 'polite' }, [
      e('div.xox-sira-serit', [ui.siraCemre, ui.siraCizgi, ui.siraAhmet]),
      ui.durumMetin,
      ui.durumAlt
    ]);

    /* tahta */
    ui.hucreler = [];
    const izgara = ctx.svg(IZGARA);
    ui.kazancCizgi = ctx.svg('<svg class="xox-kazanc" viewBox="0 0 300 300" fill="none" aria-hidden="true" focusable="false"><line x1="0" y1="0" x2="0" y2="0"/></svg>');
    ui.kazancLine = ui.kazancCizgi.querySelector('line');
    ui.tahta = e('div.xox-tahta', { role: 'group', 'aria-label': 'XOX tahtası' });
    for (let i = 0; i < 9; i++) {
      const b = e('button.xox-hucre', { type: 'button', data: { indeks: String(i) } }, [
        e('span.xox-hucre-ic', { 'aria-hidden': 'true' })
      ]);
      b.addEventListener('click', () => hucreTikla(i, b));
      ui.hucreler.push(b);
      ui.tahta.appendChild(b);
    }
    ui.tahta.appendChild(izgara);
    ui.tahta.appendChild(ui.kazancCizgi);
    ui.tahta.addEventListener('keydown', tahtaKlavye);
    ui.balon = e('div.balon.xox-balon', { 'aria-hidden': 'true' });
    ui.tahta.appendChild(ui.balon);

    ui.defter = e('div.xox-defter', [ui.tahta]);

    /* hamle sonrası not seçimi */
    ui.notCipler = e('div.cipler.xox-not-cipler');
    MESAJLAR.forEach(m => {
      ui.notCipler.appendChild(e('button.cip.xox-not-cip', { type: 'button', onclick: () => notEkle(m) }, m));
    });
    ui.not = e('div.yama.siki.xox-not', { hidden: true }, [
      e('div.satir.arasi', [
        e('span.kalin.xox-not-baslik', 'Yanına bir not bırak?'),
        e('button.dugme-ikon.xox-not-kapat', { type: 'button', 'aria-label': 'Notu geç', onclick: () => notPaneliKapat() }, '✕')
      ]),
      ui.notCipler
    ]);

    ui.alan = e('div.xox-alan', [ui.defter, ui.not]);

    /* skor */
    ui.skorCemre = e('span.xox-skor-sayi');
    ui.skorAhmet = e('span.xox-skor-sayi');
    ui.skorBerabere = e('span.xox-skor-sayi');
    const skor = e('div.yama.xox-skor', [
      e('h2.baslik.baslik-lg', 'Skor'),
      e('div.xox-skor-satir', [
        e('div.xox-skor-kutu.xox-skor-cemre', [
          e('span.xox-skor-yuz', { html: FIYONK, 'aria-hidden': 'true' }),
          ui.skorCemre,
          e('span.sessiz.xox-skor-ad', adi('cemre'))
        ]),
        e('div.xox-skor-kutu.xox-skor-berabere', [
          e('span.xox-skor-yuz.xox-skor-emoji', { 'aria-hidden': 'true' }, '🤝'),
          ui.skorBerabere,
          e('span.sessiz.xox-skor-ad', 'Berabere')
        ]),
        e('div.xox-skor-kutu.xox-skor-ahmet', [
          e('span.xox-skor-yuz', { html: KALP, 'aria-hidden': 'true' }),
          ui.skorAhmet,
          e('span.sessiz.xox-skor-ad', adi('ahmet'))
        ])
      ])
    ]);

    /* geçmiş */
    ui.gecmisListe = e('ul.xox-gecmis-liste');
    ui.gecmis = e('div.yama.xox-gecmis', [
      e('h2.baslik.baslik-lg', 'Son oyunlar'),
      ui.gecmisListe
    ]);

    el.appendChild(e('div.icerik.xox-icerik', [kimlik, durum, ui.alan, skor, ui.gecmis]));
  }

  /* ------------------------------------------------------------ çizim */
  function ciz() {
    if (!ctx || !d) return;
    const b = ben(), tek = ayniTelefon();

    /* kimlik */
    ui.kimAd.textContent = b ? ((b === 'cemre' ? '🎀 ' : '💙 ') + adi(b)) : 'seçilmedi';
    ui.kimAd.classList.toggle('xox-kim-bos', !b);
    ui.kimDegis.textContent = b ? 'değiştir' : 'seç';
    ui.bulutNot.textContent = bulutVar()
      ? (b ? '' : 'Kim olduğunu seçince hamleler ayrılır.')
      : 'Bulut kapalı — bu telefonda sırayla oynayın.';
    ui.bulutNot.hidden = !ui.bulutNot.textContent;

    /* tahta */
    for (let i = 0; i < 9; i++) {
      const h = ui.hucreler[i], sahip = d.tahta[i], ic = h.firstElementChild;
      const eskiSahip = h.dataset.sahip || '';
      if (eskiSahip !== sahip) {
        ic.innerHTML = sahip === 'cemre' ? FIYONK : sahip === 'ahmet' ? KALP : '';
        h.dataset.sahip = sahip;
        if (sahip && !ctx.azHareket) { h.classList.remove('xox-kondu'); void h.offsetWidth; h.classList.add('xox-kondu'); }
      }
      const kilit = !!sahip || !!d.kazanan || !oynayabilirMi(d.sira);
      h.setAttribute('aria-disabled', kilit ? 'true' : 'false');
      h.classList.toggle('xox-kilit', kilit);
      h.classList.toggle('xox-vurgu', !!(d.cizgi && d.cizgi.indexOf(i) >= 0));
      const yer = (Math.floor(i / 3) + 1) + '. satır ' + ((i % 3) + 1) + '. sütun';
      h.setAttribute('aria-label', yer + ', ' + (sahip ? adi(sahip) : 'boş'));
    }
    if (d.cizgi) {
      const k = cizgiKoordinat(d.cizgi);
      ui.kazancLine.setAttribute('x1', k.x1); ui.kazancLine.setAttribute('y1', k.y1);
      ui.kazancLine.setAttribute('x2', k.x2); ui.kazancLine.setAttribute('y2', k.y2);
      ui.kazancCizgi.classList.add('xox-kazanc-acik');
      ui.kazancCizgi.dataset.kim = d.kazanan || '';
    } else {
      ui.kazancCizgi.classList.remove('xox-kazanc-acik');
    }
    ui.tahta.classList.toggle('xox-tahta-bitti', !!d.kazanan);

    /* sıra göstergesi */
    const siradaki = d.kazanan ? null : d.sira;
    ui.siraCemre.classList.toggle('xox-sira-aktif', siradaki === 'cemre');
    ui.siraAhmet.classList.toggle('xox-sira-aktif', siradaki === 'ahmet');
    ui.siraCizgi.dataset.yon = siradaki || 'yok';

    /* durum metni */
    let baslikMetin = '', altMetin = '';
    if (d.kazanan === 'berabere') {
      baslikMetin = 'Berabere 🤝';
      altMetin = 'Kimse kaybetmedi. Yeni oyun?';
    } else if (d.kazanan) {
      if (tek) { baslikMetin = adi(d.kazanan) + ' kazandı! 🎉'; altMetin = 'Rövanş için yeni oyuna bas.'; }
      else if (d.kazanan === b) { baslikMetin = 'Kazandın! 🎉'; altMetin = adi(rakip(b)) + ' bunu görünce ne der acaba.'; }
      else { baslikMetin = adi(d.kazanan) + ' kazandı 💫'; altMetin = 'Rövanş için yeni oyuna bas.'; }
    } else if (tek) {
      baslikMetin = 'Sıra ' + (d.sira === 'cemre' ? adi('cemre') + '\'de' : adi('ahmet') + '\'te') + ' ' + (d.sira === 'cemre' ? '🎀' : '💙');
      altMetin = 'Telefonu uzat, hamlesini yapsın.';
    } else if (d.sira === b) {
      baslikMetin = 'Sıra sende!';
      altMetin = d.sonHamle ? adi(d.sonHamle.kim) + ' ' + once(d.sonHamle.zaman) + ' oynadı.' : 'İlk hamle senin.';
    } else {
      baslikMetin = 'Sıra ' + adi(d.sira) + '\'' + (d.sira === 'ahmet' ? 'te' : 'de');
      altMetin = 'O oynayınca burada belirir 💫';
    }
    ui.durumMetin.textContent = baslikMetin;
    ui.durumAlt.textContent = altMetin;
    ui.durumAlt.hidden = !altMetin;

    /* son hamlenin notu */
    balonCiz();

    /* skor + geçmiş */
    ui.skorCemre.textContent = d.skor.cemre;
    ui.skorAhmet.textContent = d.skor.ahmet;
    ui.skorBerabere.textContent = d.skor.berabere;
    gecmisCiz();
  }

  function cizgiKoordinat(cizgi) {
    const p = (i) => ({ x: 50 + (i % 3) * 100, y: 50 + Math.floor(i / 3) * 100 });
    const a = p(cizgi[0]), c = p(cizgi[2]);
    const dx = c.x - a.x, dy = c.y - a.y, u = Math.sqrt(dx * dx + dy * dy) || 1, pay = 30;
    return { x1: a.x - dx / u * pay, y1: a.y - dy / u * pay, x2: c.x + dx / u * pay, y2: c.y + dy / u * pay };
  }

  function balonCiz() {
    const s = d.sonHamle;
    if (!s || !s.mesaj || s.indeks == null || !d.tahta[s.indeks]) { ui.balon.classList.remove('goster'); return; }
    const sut = s.indeks % 3, sat = Math.floor(s.indeks / 3);
    ui.balon.textContent = adi(s.kim) + ': ' + s.mesaj;
    ui.balon.dataset.sutun = String(sut);
    ui.balon.dataset.satir = String(sat);
    ui.balon.classList.add('goster');
  }

  function gecmisCiz() {
    ui.gecmisListe.innerHTML = '';
    if (!d.gecmis.length) {
      ui.gecmisListe.appendChild(ctx.el('li.sessiz.xox-gecmis-bos', 'Henüz bitmiş oyun yok. İlkini birlikte bitirin.'));
      return;
    }
    d.gecmis.forEach(g => {
      const isaret = g.kazanan === 'berabere' ? '🤝' : (g.kazanan === 'cemre' ? '🎀' : '💙');
      const metin = g.kazanan === 'berabere' ? 'Berabere' : adi(g.kazanan) + ' kazandı';
      ui.gecmisListe.appendChild(ctx.el('li.xox-gecmis-oge', [
        ctx.el('span.xox-gecmis-isaret', { 'aria-hidden': 'true' }, isaret),
        ctx.el('span.xox-gecmis-metin', metin),
        ctx.el('span.sessiz.xox-gecmis-zaman', once(g.zaman))
      ]));
    });
  }

  /* ------------------------------------------------------------ hamle */
  function hucreTikla(i, dugme) {
    if (!ctx || !d) return;
    const g = oku();                       // bulut arada güncellemiş olabilir
    if (g.oyunNo !== d.oyunNo || JSON.stringify(g.tahta) !== JSON.stringify(d.tahta)) {
      d = g; ciz();
      ctx.toast('Tahta yenilendi, bir daha bak 💫');
      return;
    }
    if (g.kazanan) { ctx.ses.uf(); ctx.toast('Bu oyun bitti. Yeni oyuna basalım mı?'); return; }
    if (g.tahta[i]) { ctx.ses.uf(); dugme.classList.remove('salla'); void dugme.offsetWidth; dugme.classList.add('salla'); ctx.toast('Burası dolu, başka kare seç'); return; }
    if (!oynayabilirMi(g.sira)) {
      ctx.ses.uf();
      ctx.toast('Sıra ' + adi(g.sira) + '\'' + (g.sira === 'ahmet' ? 'te' : 'de') + ' — o oynayınca burada belirir 💫', 2600);
      return;
    }

    const oynayan = g.sira;
    g.tahta[i] = oynayan;
    g.sonHamle = { kim: oynayan, indeks: i, zaman: Date.now(), mesaj: '' };
    const sonuc = kazananBul(g.tahta);
    if (sonuc) {
      g.kazanan = sonuc.kim; g.cizgi = sonuc.cizgi;
      g.skor[sonuc.kim] = (g.skor[sonuc.kim] || 0) + 1;
      g.gecmis = [{ no: g.oyunNo, kazanan: sonuc.kim, zaman: Date.now() }].concat(g.gecmis).slice(0, GECMIS_SAYI);
    } else if (g.tahta.every(h => h)) {
      g.kazanan = 'berabere'; g.cizgi = null;
      g.skor.berabere = (g.skor.berabere || 0) + 1;
      g.gecmis = [{ no: g.oyunNo, kazanan: 'berabere', zaman: Date.now() }].concat(g.gecmis).slice(0, GECMIS_SAYI);
    } else {
      g.sira = rakip(oynayan);
    }

    d = g;
    cihazYaz('gorulen', d.sonHamle.zaman);
    yazDurum(d);
    ciz();

    ctx.ses.pit();
    const m = ctx.efekt.merkez(dugme);
    if (oynayan === 'cemre') ctx.efekt.kalp(m.x, m.y, 3); else ctx.efekt.yildiz(m.x, m.y, 4);
    kutlamaKontrol();
    notPaneliAc(i, d.oyunNo, oynayan);
    if (bulutVar()) CD.senk.simdi();
  }

  function tahtaKlavye(e) {
    const yon = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 }[e.key];
    if (!yon) return;
    const su = ui.hucreler.indexOf(document.activeElement);
    if (su < 0) return;
    let hedef = su + yon;
    if ((e.key === 'ArrowRight' && su % 3 === 2) || (e.key === 'ArrowLeft' && su % 3 === 0)) return;
    if (hedef < 0 || hedef > 8) return;
    e.preventDefault();
    ui.hucreler[hedef].focus();
  }

  /* ------------------------------------------------------------ not paneli */
  function notPaneliAc(indeks, oyunNo, kim) {
    if (!ui.not) return;
    ui.not.hidden = false;
    ui.not.dataset.indeks = String(indeks);
    ui.not.dataset.oyun = String(oyunNo);
    ui.not.dataset.kim = kim;
    clearTimeout(notT);
    notT = setTimeout(notPaneliKapat, 14000);
  }
  function notPaneliKapat() {
    clearTimeout(notT); notT = 0;
    if (ui.not) ui.not.hidden = true;
  }
  function notEkle(metin) {
    if (!ctx || !ui.not || ui.not.hidden) return;
    const i = Number(ui.not.dataset.indeks), no = Number(ui.not.dataset.oyun), kim = ui.not.dataset.kim;
    const g = oku();
    if (!g.sonHamle || g.oyunNo !== no || g.sonHamle.indeks !== i || g.sonHamle.kim !== kim) {
      notPaneliKapat();
      d = g; ciz();
      ctx.toast('O hamle geçti, not iliştiremedik');
      return;
    }
    g.sonHamle.mesaj = metin;
    d = g;
    yazDurum(d);
    ciz();
    notPaneliKapat();
    ctx.ses.tink();
    ctx.toast('Not hamlenin yanında 💌');
    if (bulutVar()) CD.senk.simdi();
  }

  /* ------------------------------------------------------------ oyun yönetimi */
  async function yeniOyun() {
    if (!ctx) return;
    const g = oku();
    const suruyor = !g.kazanan && g.tahta.some(h => h);
    if (suruyor) {
      const evet = await ctx.onayla('Oyun sürüyor. Sıfırdan başlansın mı?', 'Yeni oyun', 'Devam edeyim');
      if (!evet || !ctx) return;
    }
    const taze = oku();
    const baslayan = rakip(taze.baslayan);
    const yeni = Object.assign({}, taze, {
      tahta: ['', '', '', '', '', '', '', '', ''],
      sira: baslayan,
      baslayan: baslayan,
      kazanan: null,
      cizgi: null,
      sonHamle: null,
      oyunNo: (taze.oyunNo || 1) + 1
    });
    d = yeni;
    cihazYaz('kutlandi', 0);
    cihazYaz('gorulen', Date.now());
    notPaneliKapat();
    yazDurum(d);
    ciz();
    ctx.ses.pop();
    ctx.toast(adi(baslayan) + ' başlıyor ' + (baslayan === 'cemre' ? '🎀' : '💙'));
    if (bulutVar()) CD.senk.simdi();
  }

  async function skorSifirla() {
    if (!ctx) return;
    const evet = await ctx.onayla('Skor ve son oyunlar sıfırlansın mı?', 'Sıfırla', 'Vazgeç');
    if (!evet || !ctx) return;
    const g = oku();
    g.skor = { cemre: 0, ahmet: 0, berabere: 0 };
    g.gecmis = [];
    d = g;
    yazDurum(d);
    ciz();
    ctx.ses.tik();
    ctx.toast('Skor sıfır, baştan 🤍');
    if (bulutVar()) CD.senk.simdi();
  }

  function kimDegistir() {
    if (!ctx || !CD.kimSec) return;
    CD.kimSec(false).then(() => { if (ctx) ciz(); });
  }

  /* ------------------------------------------------------------ kutlama & gelen hamle */
  function kutlamaKontrol() {
    if (!ctx || !d || !d.kazanan) return;
    if (cihazAl('kutlandi', 0) === d.oyunNo) return;
    cihazYaz('kutlandi', d.oyunNo);
    const b = ben(), tek = ayniTelefon();
    if (d.kazanan === 'berabere') { ctx.ses.can(); return; }
    if (tek || d.kazanan === b) {
      ctx.ses.zafer();
      ctx.efekt.konfeti(undefined, undefined, 18);
    } else {
      ctx.ses.uf();
    }
  }

  function gelenHamle(oncekiOyunNo) {
    if (!ctx || !d) return;
    const b = ben();
    const s = d.sonHamle;
    if (!s || !s.zaman) return;
    if (b && s.kim === b) { cihazYaz('gorulen', s.zaman); return; }
    if (s.zaman <= (cihazAl('gorulen', 0) || 0)) return;
    cihazYaz('gorulen', s.zaman);
    const h = ui.hucreler[s.indeks];
    if (h) {
      h.classList.add('xox-geldi');
      clearTimeout(yeniT);
      yeniT = setTimeout(() => { if (h) h.classList.remove('xox-geldi'); }, 5000);
    }
    if (!d.kazanan && oncekiOyunNo === d.oyunNo) {
      ctx.ses.pop();
      ctx.toast(adi(s.kim) + ' oynadı — sıra sende 💫');
    }
  }

  function tazele() {
    if (!ctx || !d) return;
    const yeni = oku();
    if (JSON.stringify(yeni) === JSON.stringify(d)) return;
    const onceki = d.oyunNo;
    d = yeni;
    ciz();
    gelenHamle(onceki);
    kutlamaKontrol();
  }

  function gorunurluk() {
    if (document.hidden || !ctx) return;
    if (bulutVar()) CD.senk.simdi();
    tazele();
  }

  /* ------------------------------------------------------------ kayıt */
  CD.kaydet({
    id: ID,
    baslik: 'XOX',
    ikon: IKON,
    tamEkran: false,
    mount(el, baglam) {
      ctx = baglam; kok = el;
      d = oku();
      kur(el);
      ciz();
      gelenHamle(d.oyunNo);
      kutlamaKontrol();
      ipucuYaz(d);

      ctx.altbar([
        { id: 'yeni', ad: 'Yeni oyun', ikon: '🔄', birincil: true, tikla() { yeniOyun(); } },
        {
          id: 'esitle', ad: 'Eşitle', ikon: '☁️', tikla() {
            if (bulutVar()) { CD.senk.simdi(); ctx.toast('Eşitleniyor… ☁️'); }
            else ctx.toast('Bulut kapalı — bu telefonda sırayla oynayın 📱', 2600);
          }
        },
        { id: 'sifirla', ad: 'Skoru sıfırla', ikon: '🧼', tikla() { skorSifirla(); } }
      ]);

      cozler.push(ctx.olay.dinle('senk:yenilendi', tazele));
      cozler.push(ctx.olay.dinle('senk', tazele));
      cozler.push(ctx.olay.dinle('kim', () => { if (ctx) ciz(); }));
      document.addEventListener('visibilitychange', gorunurluk);

      if (bulutVar()) {
        CD.senk.simdi();
        senkT = setInterval(() => { if (!document.hidden && bulutVar()) CD.senk.simdi(); }, SENK_ARA);
      }
      sayacT = setInterval(() => { if (ctx && d) { ciz(); } }, 60000);   // "3 dakika önce" tazelensin

      if (!ben() && CD.kimSec) {
        setTimeout(() => { if (ctx && !ben()) CD.kimSec(true).then(() => { if (ctx) ciz(); }); }, 500);
      }
    },
    unmount() {
      clearInterval(senkT); senkT = 0;
      clearInterval(sayacT); sayacT = 0;
      clearTimeout(notT); notT = 0;
      clearTimeout(yeniT); yeniT = 0;
      document.removeEventListener('visibilitychange', gorunurluk);
      while (cozler.length) { const c = cozler.pop(); try { c(); } catch (e) {} }
      if (ctx && d) ipucuYaz(d);
      if (ctx) ctx.ses.hepsiniDurdur();
      ui.hucreler = null;
      for (const k in ui) delete ui[k];
      ctx = null; kok = null; d = null;
    }
  });
})();
