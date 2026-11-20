/* js/bolum/defter.js — Hatıra Defteri bölümü (V2 Faz 3).
   Veri ve kilitler js/defter.js'te (CD.pul, CD.defter). Burada: kapak, sayfa çevrilen defter, ödüller, "Bizim Ayımız" hikâye kartları,
   yokken gelen hediyeler koleksiyonu ve hediye açma sahnesi.
   Hikâye kartları ve hediye sahnesi bölüm dışından da açılır (açılışta): CD.defter.hikayeAc(ay, sec) · CD.defter.hediyeSahnesi(). */
(() => {
  'use strict';
  const ID = 'defter';
  let ctx = null, kok = null, gorunum = 'kapak', sayfaNo = -1, cozler = [];
  const D = () => CD.defter;
  const adi = (k) => k === 'tek' ? 'Sen' : CD.kimAdi(k);
  const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="8" width="40" height="48" rx="4" fill="#C8456C"/><rect x="16" y="12" width="34" height="40" rx="2" fill="#FFF6EA"/><rect x="12" y="8" width="7" height="48" fill="#9C2F55"/><rect x="40" y="8" width="5" height="22" fill="#F5C84A"/><path d="M40 30l2.5-3 2.5 3z" fill="#F5C84A"/><path d="M27 26c0-3 4-4 5-1 1-3 5-2 5 1 0 3-5 6-5 6s-5-3-5-6z" fill="#E8577A"/></svg>';
  const az = () => !!CD.azHareket;
  function el(t, o, c) { return CD.el(t, o, c); }
  function karisik(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
  function gunBaslik(iso) {
    const [y, m, g] = iso.split('-').map(Number); const d = new Date(y, m - 1, g);
    const fark = CD.gunFarki(iso);
    const on = fark === 0 ? 'Bugün' : fark === 1 ? 'Dün' : GUNLER[d.getDay()];
    return { ust: on, alt: g + ' ' + D().ayAdi(y + '-' + String(m).padStart(2, '0')).replace(/ \d+$/, '') + ' ' + y };
  }

  /* ================================================================ pul görseli */
  function pulEl(p, i, gun) {
    const T = D().TURLER[p.tur] || D().TURLER.diger;
    const kim = p.kim === 'ahmet' ? 'ahmet' : p.kim === 'cemre' ? 'cemre' : 'tek';
    const etiket = T.ad + ' · ' + adi(p.kim) + (p.kisa ? ' · ' + p.kisa : '');
    const don = Math.round((karisik(gun + i + p.kod) - 0.5) * 10);
    return el('li.defter-pul', { data: { kim, tur: p.tur }, style: '--defter-don:' + don + 'deg', title: etiket, 'aria-label': etiket }, [
      el('span.defter-pul-kagit', { html: D().piksel(T.cizim, 'defter-pul-svg') }),
      el('span.defter-pul-isaret', { 'aria-hidden': 'true' }, kim === 'ahmet' ? 'A' : kim === 'cemre' ? 'C' : '•')
    ]);
  }

  /* ================================================================ kapak */
  function kapak() {
    const t = D().toplam(), s = D().seviye(t);
    const yuzde = s.sonraki ? Math.round((t - s.onceki) / (s.sonraki - s.onceki) * 100) : 100;
    const kisiler = D().kisiler().filter(k => D().kisiToplam(k) > 0);
    const kapi = D().kapidakiler();
    const kap = el('div.defter-kapak-sahne', [
      el('div.defter-kapak', { role: 'img', 'aria-label': 'Hatıra Defteri kapağı: ' + t + ' pul, seviye ' + s.no + ', ' + s.ad }, [
        el('span.defter-kapak-sirt', { 'aria-hidden': 'true' }),
        el('span.defter-kapak-kurdele', { 'aria-hidden': 'true' }),
        el('div.defter-kapak-etiket', [
          el('span.defter-kapak-ust', 'Bizim'),
          el('strong.defter-kapak-ad', 'Hatıra Defteri'),
          el('span.defter-kapak-pul', { html: D().piksel('kalp', 'defter-kapak-kalp') })
        ]),
        el('div.defter-kapak-sayilar', [
          el('div', [el('strong.defter-kapak-sayi.sayi', String(t)), el('span', 'pul')]),
          el('div', [el('strong.defter-kapak-sayi.sayi', String(s.no)), el('span', 'seviye')])
        ])
      ])
    ]);
    const ic = el('div.icerik.dikey.defter-ic', [
      kap,
      el('div.yama.siki.defter-seviye', [
        el('div.satir.arasi', [el('strong', s.ad), el('span.sessiz.sayi', s.sonraki ? (s.sonraki - t) + ' pul sonra yeni sürpriz' : 'bütün sürprizler açık 🎉')]),
        el('div.defter-ilerleme', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(yuzde), 'aria-label': 'Bir sonraki ödüle ilerleme' }, [el('span', { style: 'width:' + yuzde + '%' })]),
        kisiler.length > 1 ? el('p.sessiz.defter-kisiler', kisiler.map(k => adi(k) + ' ' + D().kisiToplam(k)).join(' · ')) : null,
        el('p.sessiz', 'Sitede birlikte yaptığınız her şey buraya pul olarak yapışır. Kaçan gün yok; defter sadece dolar.')
      ]),
      kapi.length ? el('button.yama.dokun.siki.defter-kapi-dugme', { type: 'button', onclick: () => hediyeSahnesi() }, [
        el('strong', 'Kapıda ' + kapi.length + ' hediye var 🍂'), el('span.sessiz', ' Aç bakalım ne getirmişler')]) : null,
      el('div.izgara-2.defter-kisayol', [
        el('button.dugme.tam', { type: 'button', onclick: () => goster('sayfa') }, '📖 Sayfaları aç'),
        el('button.dugme-ikincil.tam', { type: 'button', onclick: () => goster('odul') }, '🎁 Sürprizler')
      ]),
      t === 0 ? el('div.bos-durum', [el('div.buyuk', { html: D().piksel('kutu', 'defter-bos-svg') }), el('p', 'Defter henüz boş. Bir kalp gönder ya da günün sorusunu cevapla; ilk pul hemen yapışır.')]) : null
    ]);
    return ic;
  }

  /* ================================================================ sayfalar (sayfa çevirme) */
  let sayfaListe = [];
  function sayfaIcerik(s) {
    const b = gunBaslik(s.gun);
    const say = {}; s.pullar.forEach(p => { say[p.kim] = (say[p.kim] || 0) + 1; });
    return el('article.defter-sayfa', { 'aria-label': b.ust + ', ' + b.alt + ': ' + s.pullar.length + ' pul' }, [
      el('header.defter-sayfa-bas', [el('span.defter-sayfa-gun', b.ust), el('span.defter-sayfa-tarih', b.alt)]),
      el('ul.defter-pullar', { role: 'list' }, s.pullar.map((p, i) => pulEl(p, i, s.gun))),
      el('footer.defter-sayfa-alt', [
        el('span.sessiz', Object.keys(say).map(k => adi(k) + ' ' + say[k]).join(' · ')),
        el('span.defter-sayfa-no.sayi', (sayfaListe.indexOf(s) + 1) + ' / ' + sayfaListe.length)
      ])
    ]);
  }
  function bosSayfa() {
    return el('article.defter-sayfa.defter-sayfa-bos', [
      el('header.defter-sayfa-bas', [el('span.defter-sayfa-gun', 'İlk sayfa')]),
      el('div.bos-durum', [el('div.buyuk', { html: D().piksel('kalp', 'defter-bos-svg') }), el('p', 'Bu sayfa seni bekliyor. Bugün birlikte yaptığınız ilk şey buraya pul olur.')])
    ]);
  }
  let kitap = null, cevriliyor = false;
  function sayfalarGorunum() {
    sayfaListe = D().sayfalar();
    if (sayfaNo < 0 || sayfaNo >= sayfaListe.length) sayfaNo = sayfaListe.length - 1;
    kitap = el('div.defter-kitap', { tabindex: '0', role: 'region', 'aria-label': 'Defter sayfaları. Sağ ve sol ok tuşlarıyla sayfa çevir.', 'aria-roledescription': 'defter' }, [
      el('div.defter-kitap-sirt', { 'aria-hidden': 'true' }),
      sayfaListe.length ? sayfaIcerik(sayfaListe[sayfaNo]) : bosSayfa()
    ]);
    const geri = el('button.dugme-ikincil.defter-cevir-geri', { type: 'button', 'aria-label': 'Önceki sayfa', onclick: () => cevir(-1) }, '‹ Önceki');
    const ileri = el('button.dugme-ikincil.defter-cevir-ileri', { type: 'button', 'aria-label': 'Sonraki sayfa', onclick: () => cevir(1) }, 'Sonraki ›');
    const durum = el('p.gorsel-gizli.defter-durum', { role: 'status', 'aria-live': 'polite' });
    const dugmeler = () => { geri.disabled = sayfaNo <= 0; ileri.disabled = sayfaNo >= sayfaListe.length - 1; };
    dugmeler();
    kitap.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); cevir(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); cevir(-1); } });
    let x0 = null, y0 = 0;
    kitap.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
    kitap.addEventListener('pointerup', (e) => { if (x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) cevir(dx < 0 ? 1 : -1); });
    kitap.addEventListener('pointercancel', () => { x0 = null; });
    function cevir(yon) {
      const hedef = sayfaNo + yon;
      if (cevriliyor || hedef < 0 || hedef >= sayfaListe.length) { if (ctx) ctx.ses.tik(); return; }
      cevriliyor = true;
      const eski = kitap.querySelector('.defter-sayfa');
      const yeni = sayfaIcerik(sayfaListe[hedef]);
      sayfaNo = hedef; dugmeler();
      if (ctx) ctx.ses.tik();
      const bitir = () => { cevriliyor = false; [...kitap.querySelectorAll('.defter-sayfa')].forEach(s => { if (s !== yeni) s.remove(); }); yeni.className = 'defter-sayfa'; durum.textContent = 'Sayfa ' + (sayfaNo + 1) + ' / ' + sayfaListe.length; };
      if (az()) {
        yeni.classList.add(yon > 0 ? 'defter-kay-sag' : 'defter-kay-sol');
        kitap.appendChild(yeni);
        eski.classList.add(yon > 0 ? 'defter-kay-cik-sol' : 'defter-kay-cik-sag');
        requestAnimationFrame(() => requestAnimationFrame(() => { yeni.classList.add('defter-kay-gir'); }));
        setTimeout(bitir, 320);
      } else if (yon > 0) {
        yeni.classList.add('defter-alttaki'); kitap.insertBefore(yeni, eski);
        eski.classList.add('defter-cevir-ileri-anim');
        setTimeout(bitir, 720);
      } else {
        yeni.classList.add('defter-cevir-geri-anim'); kitap.appendChild(yeni);
        eski.classList.add('defter-alttaki');
        setTimeout(bitir, 720);
      }
    }
    return el('div.icerik.dikey.defter-ic', [
      kitap,
      el('div.satir.arasi.defter-cevir-satir', [geri, el('button.dugme-hayalet', { type: 'button', onclick: () => { if (sayfaNo !== sayfaListe.length - 1 && sayfaListe.length) { sayfaNo = sayfaListe.length - 1; goster('sayfa'); } } }, 'Bugüne git'), ileri]),
      durum,
      el('details.yama.siki.defter-anahtar', [
        el('summary', 'Pul anahtarı'),
        el('p.sessiz', 'Pulun köşesindeki harf kimin pulu olduğunu gösterir: C Cemre, A Ahmet.'),
        el('ul.defter-anahtar-liste', Object.keys(D().TURLER).filter(t => t !== 'diger').map(t => el('li', [el('span', { html: D().piksel(D().TURLER[t].cizim, 'defter-anahtar-svg') }), el('span', D().TURLER[t].ad + ' · günde ' + D().TURLER[t].sinir)])))
      ])
    ]);
  }

  /* ================================================================ ödüller */
  const TUR_AD = { dekor: 'Mahalle süsü', karakter: 'Karakter aksesuarı', hayvan: 'Hayvan aksesuarı', mektup: 'Gizli mektup' };
  function mektupAc(o) {
    const m = D().mektup(o.no);
    ctx.sheet(el('div.dikey.defter-mektup', [
      el('div.defter-mektup-kagit', m ? m.split(/\n\s*\n/).map(p => el('p', p)) : [el('p.defter-mektup-yakinda', 'Ahmet\'in sürprizi yakında 💌'), el('p.sessiz', 'Bu mektup açıldı ama içi henüz yazılmadı. Yazılınca burada belirecek.')]),
      el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Kapat')
    ]), { baslik: o.ad });
  }
  function odulGorunum() {
    const t = D().toplam();
    const gruplar = D().ESIKLER.map(e => {
      const acik = t >= e;
      const liste = D().ODULLER.filter(o => o.esik === e);
      return el('section.yama.siki.defter-odul-grup' + (acik ? '.acik' : ''), { 'aria-label': e + ' pul: ' + (acik ? 'açık' : 'kilitli') }, [
        el('div.satir.arasi', [el('strong.defter-odul-esik.sayi', e + ' pul'), el('span.rozet' + (acik ? '.basari' : '.gri'), acik ? 'açıldı' : (e - t) + ' pul kaldı')]),
        el('ul.defter-odul-liste', liste.map(o => {
          const mektupMu = o.tur === 'mektup';
          const ic = [
            el('span.defter-odul-resim', { html: acik ? D().piksel(o.cizim, 'defter-odul-svg') : D().piksel('kutu', 'defter-odul-svg defter-kilitli') }),
            el('span.defter-odul-yazi', [el('strong', acik || !mektupMu ? o.ad : 'Gizli mektup'), el('span.sessiz', TUR_AD[o.tur] + (o.alt && acik ? ' · ' + o.alt : ''))])
          ];
          if (mektupMu && acik) return el('li', [el('button.defter-odul.dokun', { type: 'button', onclick: () => mektupAc(o), 'aria-label': o.ad + '. Oku' }, ic.concat([el('span.defter-odul-oku', D().mektup(o.no) ? 'Oku' : 'Yakında 💌')]))]);
          return el('li', [el('div.defter-odul', ic)]);
        }))
      ]);
    });
    return el('div.icerik.dikey.defter-ic', [
      el('p.sessiz', 'Süsler mahallede kendiliğinden belirir; aksesuarlar karakterlere ve hayvanlara takılır. Kilitler hiç geri kapanmaz.'),
      ...gruplar
    ]);
  }

  /* ================================================================ Bizim Ayımız listesi */
  function ayGorunum() {
    const simdiki = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })();
    const aylar = D().aylar();
    const liste = aylar.map(a => {
      const o = D().ayOzeti(a);
      const devam = a === simdiki;
      return el('li', [el('button.yama.dokun.siki.defter-ay', { type: 'button', onclick: () => hikayeAc(a, {}) }, [
        el('strong', o.ad + (devam ? ' (sürüyor)' : '')),
        el('span.sessiz', o.pul + ' pul · ' + o.kalp + ' kalp' + (o.yildiz ? ' · ' + o.yildiz + ' yıldızlı gece' : ''))
      ])]);
    });
    return el('div.icerik.dikey.defter-ic', [
      el('p.sessiz', 'Her ayın ilk açılışında geçen ayın hikâyesi kendiliğinden gelir. Burada istediğin zaman yeniden bakabilirsin.'),
      liste.length ? el('ul.dikey.defter-ay-liste', liste) : el('div.bos-durum', [el('div.buyuk', '🗓️'), el('p', 'İlk ayınız birikiyor. Ay bitince hikâyesi burada olacak.')])
    ]);
  }

  /* ================================================================ koleksiyon (yokken gelen hediyeler) */
  function koleksiyonGorunum() {
    const k = D().koleksiyon(), kapi = D().kapidakiler();
    const P = (CD.config.PITTIKSU || {}).AD || 'Pıttıksu', B = (CD.config.BARBIE || {}).AD || 'Barbie';
    const bulunan = D().ESYALAR.filter(e => k.sayilar[e.id]).length;
    const parca = [
      el('p.sessiz', 'Cemre birkaç saat uğramayınca ' + P + ' ve ' + B + ' gezmeye çıkar; dönünce kapıya küçük bir şey bırakırlar.'),
      kapi.length ? el('button.dugme.tam', { type: 'button', onclick: () => hediyeSahnesi() }, '🍂 Kapıdaki ' + kapi.length + ' hediyeyi aç') : null,
      el('div.satir.arasi', [el('strong', 'Koleksiyon'), el('span.sessiz.sayi', bulunan + ' / ' + D().ESYALAR.length)]),
      el('ul.defter-koleksiyon', { role: 'list' }, D().ESYALAR.map(e => {
        const n = Number(k.sayilar[e.id]) || 0;
        return el('li.defter-esya' + (n ? '' : '.yok') + (e.nadir ? '.nadir' + e.nadir : ''), { 'aria-label': n ? e.ad + ', ' + n + ' tane' + (e.nadir ? ', ' + D().NADIR_AD[e.nadir] : '') : 'Henüz bulunmadı' + (e.nadir ? ' (' + D().NADIR_AD[e.nadir] + ')' : '') }, [
          el('span.defter-esya-em', { 'aria-hidden': 'true' }, n ? e.em : '?'),
          el('span.defter-esya-ad', n ? e.ad : '…'),
          n > 1 ? el('span.defter-esya-say.sayi', '×' + n) : null
        ]);
      }))
    ];
    const notlu = k.son.filter(x => x.not).reverse();
    if (notlu.length) parca.push(el('div.dikey', [el('strong', 'Hediyelerden çıkan notlar'), ...notlu.slice(0, 6).map(x => el('figure.defter-hnot', [el('blockquote', x.not), el('figcaption.sessiz', x.esya.em + ' ' + x.esya.ad + ' · ' + CD.tarihYaz(new Date(x.t).toISOString().slice(0, 10)))]))]));
    if (CD.kim() === 'ahmet') {
      const n = D().ahmetNotu(), bulundu = D().notBulundu();
      const kutu = el('textarea.girdi', { rows: '3', maxlength: '160', placeholder: 'Bir sonraki hediyenin içine gizli bir not…', 'aria-label': 'Bir sonraki hediyeye eklenecek not' });
      if (n && !bulundu) kutu.value = n.metin;
      parca.push(el('section.yama.siki.dikey.defter-ahmet-not', [
        el('strong', 'Bir sonraki hediyeye notumu ekle'),
        el('p.sessiz', n ? (bulundu ? 'Cemre son notunu buldu 💌 Yenisini yazabilirsin.' : 'Notun bekliyor; Cemre bir sonraki hediyeyi açınca görecek.') : 'Cemre görmez; yalnız hediyeyi açınca içinden çıkar.'),
        kutu,
        el('button.dugme.tam', { type: 'button', onclick: () => { D().notBirak(kutu.value); ctx.ses.parilti(); ctx.toast(kutu.value.trim() ? 'Not hediyenin içine kondu 💌' : 'Not kaldırıldı'); goster('koleksiyon'); } }, 'Notu sakla')
      ]));
    }
    return el('div.icerik.dikey.defter-ic', parca);
  }

  /* ================================================================ hediye açma sahnesi (bölüm dışından da açılır) */
  function hediyeSahnesi() {
    const kapi = D().kapidakiler();
    const P = (CD.config.PITTIKSU || {}).AD || 'Pıttıksu', B = (CD.config.BARBIE || {}).AD || 'Barbie';
    const hy = (h) => h === 'barbie' ? B : P;
    if (!kapi.length) { CD.toast('Kapı boş; onlar evde uyukluyor 💤'); return; }
    const sahne = el('div.dikey.defter-hediye-sahne');
    const durum = el('p.gorsel-gizli', { role: 'status', 'aria-live': 'polite' });
    function ciz() {
      sahne.innerHTML = '';
      const kalan = D().kapidakiler();
      if (!kalan.length) {
        sahne.append(el('p', 'Hepsini açtın. Koleksiyonuna girdiler 🍂'), el('button.dugme.tam', { type: 'button', onclick: () => { CD.sheetKapat(); if (ctx && kok && kok.isConnected) goster('koleksiyon'); else CD.ac('defter'); } }, 'Koleksiyona bak'));
        return;
      }
      sahne.append(
        el('p', hy(kalan[0].hayvan) + ' kapıya bir şey bırakmış. Dokun, aç.'),
        el('ul.defter-kutular', kalan.map((x, i) => el('li', [el('button.defter-kutu', { type: 'button', 'aria-label': (i + 1) + '. hediyeyi aç', onclick: (e) => ac(e.currentTarget) }, [el('span', { html: D().piksel('kutu', 'defter-kutu-svg') })])])))
      );
    }
    function ac(b) {
      const r = D().hediyeAc(); if (!r) { ciz(); return; }
      CD.ses.parilti();
      const m = CD.efekt.merkez(b); CD.efekt.yildiz(m.x, m.y, r.esya.nadir ? 10 : 5);
      sahne.innerHTML = '';
      sahne.append(
        el('div.defter-acilan' + (r.esya.nadir ? '.nadir' + r.esya.nadir : ''), [
          el('span.defter-acilan-em', { 'aria-hidden': 'true' }, r.esya.em),
          el('strong', r.esya.ad),
          el('span.sessiz', hy(r.hayvan) + ' getirdi' + (r.esya.nadir ? ' · ' + D().NADIR_AD[r.esya.nadir] + ' ✨' : ''))
        ]),
        r.not ? el('figure.defter-hnot.yeni', [el('blockquote', r.not), el('figcaption.sessiz', 'İçinden bir not çıktı 💌')]) : '',
        el('button.dugme.tam', { type: 'button', onclick: ciz }, D().kapidakiler().length ? 'Sıradakini aç' : 'Tamam')
      );
      durum.textContent = r.esya.ad + ' çıktı' + (r.not ? '. İçinden bir not da çıktı: ' + r.not : '');
      const d = sahne.querySelector('.dugme'); if (d) setTimeout(() => d.focus({ preventScroll: true }), 60);
    }
    ciz();
    CD.sheet(el('div.dikey', [sahne, durum]), { baslik: 'Kapıda hediyeler var 🍂', kapaninca: () => { if (ctx && kok && kok.isConnected && gorunum === 'kapak') goster('kapak'); } });
  }

  /* ================================================================ Bizim Ayımız — hikâye kartları */
  function kartlar(o) {
    const C = CD.kimAdi('cemre'), A = CD.kimAdi('ahmet');
    const l = [{ ust: 'Bizim Ayımız', buyuk: o.ad.split(' ')[0], alt: o.ad.split(' ')[1] + ' · ' + o.pul + ' pul', em: '📖', renk: 'kiraz' }];
    if (o.kalp || o.yagmur) l.push({ ust: 'Bu ay birbirimizi', buyuk: String(o.kalp), alt: 'kez düşündük 💗' + (o.yagmur ? ' · ' + o.yagmur + ' emoji yağmuru' : ''), em: '💗', renk: 'seftali' });
    if (o.enRuh) l.push({ ust: 'En çok seçilen hava', buyuk: o.enRuh.em, alt: o.enRuh.ad + ' · ' + o.enRuh.kez + ' kez', em: '', renk: 'gok' });
    if (o.enOyun) {
      const kz = o.enOyun.kazanan ? (o.enOyun.kazanan === 'cemre' ? C : A) + ' önde 🏆' : 'berabere gibi 🤝';
      l.push({ ust: 'En çok oynadığımız', buyuk: o.enOyun.ad, alt: o.enOyun.kez + ' oyun · ' + kz + (o.enOyun.cemre + o.enOyun.ahmet ? ' (' + C + ' ' + o.enOyun.cemre + ', ' + A + ' ' + o.enOyun.ahmet + ')' : ''), em: '🎮', renk: 'lavanta' });
    }
    if (o.yildiz) l.push({ ust: 'İkimiz de iyi geceler dedik', buyuk: String(o.yildiz), alt: 'yıldızlı gece ⭐', em: '🌙', renk: 'gece' });
    const P = (CD.config.PITTIKSU || {}).AD || 'Pıttıksu', B = (CD.config.BARBIE || {}).AD || 'Barbie';
    const bp = o.bakim.pittiksu || 0, bb = o.bakim.barbie || 0;
    if (bp || bb || o.kilo.pittiksu || o.kilo.barbie) {
      const k = [];
      if (o.kilo.pittiksu) k.push(P + ' ' + o.kilo.pittiksu.son + ' g' + (o.kilo.pittiksu.adet > 1 ? ' (' + (o.kilo.pittiksu.son - o.kilo.pittiksu.ilk >= 0 ? '+' : '') + (o.kilo.pittiksu.son - o.kilo.pittiksu.ilk) + ' g)' : ''));
      if (o.kilo.barbie) k.push(B + ' ' + (o.kilo.barbie.son / 1000).toFixed(2).replace('.', ',') + ' kg');
      l.push({ ust: P + ' ve ' + B, buyuk: String(bp + bb), alt: 'kez sevgi gördüler 🐾 (' + P + ' ' + bp + ', ' + B + ' ' + bb + ')' + (k.length ? ' · ' + k.join(' · ') : ''), em: '🐾', renk: 'nane' });
    }
    if (o.enGun) { const b = gunBaslik(o.enGun.gun); l.push({ ust: 'En dolu sayfamız', buyuk: b.alt.replace(/ \d{4}$/, ''), alt: b.ust + ' · ' + o.enGun.pul + ' pul yapıştı', em: '📄', renk: 'limon' }); }
    const kapanis = o.pul >= 100 ? 'Defter bu ay taştı. İyi ki varsın.' : o.pul >= 30 ? 'Küçük şeyler birikti, kocaman oldu.' : 'Az da olsa her pul bir “aklımdasın”.';
    l.push({ ust: 'Ve bir şey daha', buyuk: '💌', alt: kapanis + ' Gelecek ay da buradayız.', em: '', renk: 'kiraz', son: true });
    return l;
  }
  let hikaye = null;
  function hikayeAc(a, sec) {
    sec = sec || {};
    if (hikaye) hikayeKapat();
    const o = D().ayOzeti(a), l = kartlar(o);
    if (sec.ilk) D().ayGoruldu(a);
    let i = 0, oto = 0;
    const odakGeri = document.activeElement;
    const bar = el('div.defter-h-cubuk', { 'aria-hidden': 'true' }, l.map(() => el('span', [el('i')])));
    const kart = el('div.defter-h-kart', { 'aria-live': 'polite' });
    const kapat = el('button.defter-h-kapat', { type: 'button', 'aria-label': 'Kapat' }, '✕');
    const paylas = el('button.dugme.kucuk.defter-h-paylas', { type: 'button' }, 'Paylaş 📤');
    const geri = el('button.defter-h-alan.defter-h-geri', { type: 'button', 'aria-label': 'Önceki kart' });
    const ileri = el('button.defter-h-alan.defter-h-ileri', { type: 'button', 'aria-label': 'Sonraki kart' });
    const perde = el('div.defter-h-perde', { tabindex: '-1', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Bizim Ayımız: ' + o.ad }, [bar, kart, geri, ileri, el('div.defter-h-ust', [kapat]), el('div.defter-h-alt', [paylas])]);
    function ciz() {
      const k = l[i];
      perde.dataset.renk = k.renk;
      kart.innerHTML = '';
      kart.append(...[el('span.defter-h-ust-yazi', k.ust), k.em ? el('span.defter-h-em', { 'aria-hidden': 'true' }, k.em) : null, el('strong.defter-h-buyuk', k.buyuk), el('span.defter-h-alt-yazi', k.alt),
        el('span.gorsel-gizli', (i + 1) + ' / ' + l.length)].filter(Boolean));
      [...bar.children].forEach((s, j) => { s.className = j < i ? 'dolu' : j === i ? 'simdi' : ''; });
      kart.classList.remove('gir'); void kart.offsetWidth; if (!az()) kart.classList.add('gir');
      clearTimeout(oto);
      if (!az()) oto = setTimeout(() => git(1), 6000);
    }
    function git(y) { const h = i + y; if (h < 0) { i = 0; ciz(); return; } if (h >= l.length) { hikayeKapat(); return; } i = h; try { CD.ses.tik(); } catch (e) {} ciz(); }
    const tus = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); hikayeKapat(); }
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); git(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); git(-1); }
      else if (e.key === 'Tab') {   // odak perdede kalsın
        const f = [kapat, paylas, geri, ileri]; const n = Math.max(-1, f.indexOf(document.activeElement));
        e.preventDefault(); f[(n + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    };
    geri.addEventListener('click', () => git(-1));
    ileri.addEventListener('click', () => git(1));
    kapat.addEventListener('click', () => hikayeKapat());
    paylas.addEventListener('click', () => resimPaylas(o, l[i], i, l.length));
    document.addEventListener('keydown', tus, true);
    document.body.appendChild(perde);
    document.body.classList.add('defter-h-acik');
    requestAnimationFrame(() => perde.classList.add('acik'));
    hikaye = { perde, tus, oto: () => clearTimeout(oto), odakGeri, kapaninca: sec.kapaninca };
    ciz();
    setTimeout(() => perde.focus({ preventScroll: true }), 60);
    try { CD.ses.pop(); } catch (e) {}
  }
  function hikayeKapat() {
    if (!hikaye) return;
    const h = hikaye; hikaye = null;
    h.oto(); document.removeEventListener('keydown', h.tus, true);
    document.body.classList.remove('defter-h-acik');
    h.perde.classList.remove('acik'); setTimeout(() => h.perde.remove(), 240);
    if (h.odakGeri && h.odakGeri.isConnected) { try { h.odakGeri.focus({ preventScroll: true }); } catch (e) {} }
    if (h.kapaninca) { try { h.kapaninca(); } catch (e) {} }
  }
  /* kartı resim olarak paylaş (canvas → JPEG); Web Share yoksa indir */
  const RENK = { kiraz: ['#FFB3C6', '#E8577A'], seftali: ['#FFE0CC', '#F29B5B'], gok: ['#CFE8F5', '#6FA8DC'], lavanta: ['#E5DBFA', '#7E62C4'], gece: ['#3A3358', '#8E7BA8'], nane: ['#D3F1E0', '#3E8B62'], limon: ['#FFF2C2', '#D9A520'] };
  function sar(c, metin, x, y, gen, satir) {
    const k = String(metin).split(' '); let s = '', yy = y;
    k.forEach(w => { const d = s ? s + ' ' + w : w; if (c.measureText(d).width > gen && s) { c.fillText(s, x, yy); s = w; yy += satir; } else s = d; });
    if (s) c.fillText(s, x, yy);
    return yy;
  }
  async function resimPaylas(o, k, i, n) {
    const W = 1080, H = 1920;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const [r1, r2] = RENK[k.renk] || RENK.kiraz;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, r1); g.addColorStop(1, r2);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // pul kenarı (zımbalı çerçeve)
    c.fillStyle = 'rgba(255,253,247,.92)'; c.fillRect(90, 360, W - 180, 1100);
    c.fillStyle = r2; for (let x = 90; x <= W - 90; x += 44) { c.beginPath(); c.arc(x, 360, 14, 0, 7); c.arc(x, 1460, 14, 0, 7); c.fill(); }
    for (let y = 360; y <= 1460; y += 44) { c.beginPath(); c.arc(90, y, 14, 0, 7); c.arc(W - 90, y, 14, 0, 7); c.fill(); }
    const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
    c.textAlign = 'center'; c.fillStyle = '#3B2A3A';
    c.font = '600 54px ' + font; c.fillText(k.ust, W / 2, 520);
    if (k.em) { c.font = '150px ' + font; c.fillText(k.em, W / 2, 760); }
    c.font = '800 ' + (String(k.buyuk).length > 8 ? 110 : 190) + 'px ' + font; c.fillText(k.buyuk, W / 2, k.em ? 1000 : 900);
    c.font = '500 50px ' + font; sar(c, k.alt, W / 2, k.em ? 1120 : 1060, W - 300, 66);
    c.fillStyle = 'rgba(59,42,58,.75)'; c.font = '600 44px ' + font; c.fillText('Bizim Ayımız · ' + o.ad, W / 2, 1640);
    c.font = '400 36px ' + font; c.fillText((i + 1) + ' / ' + n + ' · Hatıra Defteri', W / 2, 1710);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.88));
    if (!blob) { CD.toast('Resim hazırlanamadı 🙈'); return; }
    const ad = 'bizim-ayimiz-' + o.ay + '-' + (i + 1) + '.jpg';
    try {
      const f = new File([blob], ad, { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Bizim Ayımız' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const u = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = u; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
    CD.toast('Resim indirildi 📷');
  }
  if (CD.defter) { CD.defter.hikayeAc = hikayeAc; CD.defter.hikayeKapat = hikayeKapat; CD.defter.hediyeSahnesi = hediyeSahnesi; }

  /* ================================================================ bölüm */
  const GORUNUMLER = { kapak, sayfa: sayfalarGorunum, odul: odulGorunum, ay: ayGorunum, koleksiyon: koleksiyonGorunum };
  function goster(g) {
    if (!kok || !GORUNUMLER[g]) return;
    gorunum = g;
    kok.innerHTML = '';
    kok.appendChild(GORUNUMLER[g]());
    if (ctx) ctx.altbar(eylemler());
    window.scrollTo(0, 0);
  }
  function eylemler() {
    const e = (id, ad, ikon) => ({ id, ad, ikon, basili: gorunum === id, birincil: gorunum === id, tikla() { if (ctx) ctx.ses.tik(); goster(id); } });
    return [e('kapak', 'Kapak', '📕'), e('sayfa', 'Sayfalar', '📖'), e('odul', 'Sürprizler', '🎁'), e('ay', 'Ayımız', '🗓️'), e('koleksiyon', 'Hediyeler', '🍂')];
  }

  CD.kaydet({
    id: ID, baslik: 'Hatıra Defteri', ikon: IKON,
    mount(el_, c) {
      ctx = c; kok = el_; sayfaNo = -1;
      if (!CD.defter) { el_.appendChild(CD.el('div.icerik', [CD.el('div.bos-durum', [CD.el('p', 'Defter hazırlanıyor, az kaldı 🧶')])])); return; }
      goster(D().kapidakiler().length ? 'kapak' : 'kapak');
      let t = 0;
      const tazele = () => { clearTimeout(t); t = setTimeout(() => { if (!kok || cevriliyor) return; if (gorunum === 'sayfa') { const n = sayfaNo, uzun = sayfaListe.length; sayfaListe = D().sayfalar(); if (n === uzun - 1) sayfaNo = sayfaListe.length - 1; goster('sayfa'); } else if (!document.body.classList.contains('sheet-acik')) goster(gorunum); }, 500); };
      cozler.push(c.olay.dinle('defter:degisti', tazele), c.olay.dinle('defter:hediye', tazele));
      if (D().kapidakiler().length) setTimeout(() => { if (kok && !document.body.classList.contains('sheet-acik')) hediyeSahnesi(); }, 700);
    },
    unmount() {
      while (cozler.length) { try { cozler.pop()(); } catch (e) {} }
      cevriliyor = false; kitap = null;
      ctx = null; kok = null;
    }
  });
})();
