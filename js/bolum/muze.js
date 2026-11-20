/* js/bolum/muze.js — Anı Müzesi (V2 Faz 3 · 2)
   Sekmeler: İlklerimiz (yatay kayan pixel çizelge) · Anı haritası (pixel Türkiye, 81 ilin yaklaşık konumu) · Birlikte yapacaklarımız (50 şey).
   Veriler (kişi bazlı, senk ile iki telefona):
     cd.muze.ilk.<kim>    [{ id, baslik, tarih, not, foto }]
     cd.muze.yer.<kim>    [{ id, il, tur:'gittik'|'gidecegiz', not, tarih, foto }]
     cd.muze.liste.<kim>  [{ id, tur:'ozel', metin, t } | { id, tur:'yapildi', madde, tarih, not, foto, t }]
   Fotoğraflar: CD.ani.fotoKoy → 'ani:<kim>:<id>' (mevcut medya yolu, cemre_foto). Yapılan madde çizelgede anı olarak görünür. */
(() => {
  'use strict';
  const ID = 'muze';
  const A = () => CD.ani;
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 24L32 10l24 14z" fill="var(--seker-lavanta,#CDBDF6)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3" stroke-linejoin="round"/><rect x="12" y="26" width="6" height="22" fill="var(--kagit,#FFFDF9)"/><rect x="29" y="26" width="6" height="22" fill="var(--kagit,#FFFDF9)"/><rect x="46" y="26" width="6" height="22" fill="var(--kagit,#FFFDF9)"/><rect x="8" y="48" width="48" height="6" rx="2" fill="var(--murekkep-2,#5D5566)"/></svg>';
  const K = { ilk: 'muze.ilk', yer: 'muze.yer', liste: 'muze.liste' };
  const ILK_ORNEK = ['İlk mesaj', 'İlk buluşma', 'İlk tatil', 'İlk fotoğrafımız', 'İlk hediye', 'İlk "seni seviyorum"', 'İlk film', 'İlk yemek'];
  const ONERI = ['Gün doğumunu birlikte izlemek', "Kapadokya'da balonları görmek", 'Birlikte kek yapmak (ve yakmamak)', 'Pijamalarla film maratonu', 'Kayan yıldıza birlikte dilek tutmak',
    'Aynı kitabı okuyup konuşmak', 'Deniz kenarında kumdan kale yapmak', 'Birlikte bir bitki büyütmek', 'Lunaparkta dönme dolaba binmek', 'Kar topu savaşı yapmak',
    'Piknikte karpuz kesmek', 'Birbirimize gerçek mektup postalamak', 'Bir konserde bağıra bağıra şarkı söylemek', 'Yağmurda şemsiyesiz yürümek', 'Birlikte bir resim yapmak',
    'Kahvaltıyı yatağa götürmek', 'Hiç gitmediğimiz bir şehre gitmek', 'Fotoğraflarımızla bir duvar yapmak', 'Birlikte dans dersi almak', 'Kamp ateşinde marshmallow kızartmak',
    'Gece yarısı sahilde yürümek', 'Bir hayvan barınağında gönüllü olmak', 'Eşleşen pijama almak', '1000 parçalık yapbozu bitirmek', 'Bir günü telefonsuz geçirmek',
    'Balık tutmayı denemek', 'Birlikte bisiklet turu yapmak', 'Sabaha kadar sohbet etmek', 'Kendi pizzamızı yapmak', 'Bir ağacın dibine anı kutusu gömmek'];
  const MADDE_MAKS = 50;

  /* ---------------------------------------------------------------- 81 il (plaka: [ad, enlem, boylam]) — yaklaşık il merkezleri */
  const IL = { '01': ['Adana', 37.0, 35.32], '02': ['Adıyaman', 37.76, 38.28], '03': ['Afyonkarahisar', 38.76, 30.54], '04': ['Ağrı', 39.72, 43.05], '05': ['Amasya', 40.65, 35.83], '06': ['Ankara', 39.93, 32.86],
    '07': ['Antalya', 36.89, 30.71], '08': ['Artvin', 41.18, 41.82], '09': ['Aydın', 37.85, 27.85], '10': ['Balıkesir', 39.65, 27.88], '11': ['Bilecik', 40.14, 29.98], '12': ['Bingöl', 38.88, 40.5],
    '13': ['Bitlis', 38.4, 42.11], '14': ['Bolu', 40.73, 31.61], '15': ['Burdur', 37.72, 30.29], '16': ['Bursa', 40.19, 29.06], '17': ['Çanakkale', 40.15, 26.41], '18': ['Çankırı', 40.6, 33.62],
    '19': ['Çorum', 40.55, 34.95], '20': ['Denizli', 37.78, 29.09], '21': ['Diyarbakır', 37.91, 40.24], '22': ['Edirne', 41.68, 26.56], '23': ['Elazığ', 38.68, 39.22], '24': ['Erzincan', 39.75, 39.49],
    '25': ['Erzurum', 39.9, 41.27], '26': ['Eskişehir', 39.78, 30.52], '27': ['Gaziantep', 37.07, 37.38], '28': ['Giresun', 40.91, 38.39], '29': ['Gümüşhane', 40.46, 39.48], '30': ['Hakkari', 37.58, 43.74],
    '31': ['Hatay', 36.2, 36.16], '32': ['Isparta', 37.76, 30.55], '33': ['Mersin', 36.81, 34.64], '34': ['İstanbul', 41.01, 28.98], '35': ['İzmir', 38.42, 27.14], '36': ['Kars', 40.6, 43.1],
    '37': ['Kastamonu', 41.38, 33.78], '38': ['Kayseri', 38.73, 35.48], '39': ['Kırklareli', 41.73, 27.22], '40': ['Kırşehir', 39.15, 34.16], '41': ['Kocaeli', 40.77, 29.92], '42': ['Konya', 37.87, 32.48],
    '43': ['Kütahya', 39.42, 29.98], '44': ['Malatya', 38.35, 38.31], '45': ['Manisa', 38.61, 27.43], '46': ['Kahramanmaraş', 37.58, 36.94], '47': ['Mardin', 37.31, 40.74], '48': ['Muğla', 37.22, 28.36],
    '49': ['Muş', 38.74, 41.49], '50': ['Nevşehir', 38.62, 34.71], '51': ['Niğde', 37.97, 34.68], '52': ['Ordu', 40.98, 37.88], '53': ['Rize', 41.02, 40.52], '54': ['Sakarya', 40.69, 30.44],
    '55': ['Samsun', 41.29, 36.33], '56': ['Siirt', 37.93, 41.94], '57': ['Sinop', 42.03, 35.15], '58': ['Sivas', 39.75, 37.02], '59': ['Tekirdağ', 40.98, 27.51], '60': ['Tokat', 40.31, 36.55],
    '61': ['Trabzon', 41.0, 39.72], '62': ['Tunceli', 39.11, 39.55], '63': ['Şanlıurfa', 37.16, 38.79], '64': ['Uşak', 38.68, 29.41], '65': ['Van', 38.49, 43.38], '66': ['Yozgat', 39.82, 34.81],
    '67': ['Zonguldak', 41.45, 31.79], '68': ['Aksaray', 38.37, 34.03], '69': ['Bayburt', 40.26, 40.23], '70': ['Karaman', 37.18, 33.22], '71': ['Kırıkkale', 39.85, 33.51], '72': ['Batman', 37.88, 41.13],
    '73': ['Şırnak', 37.52, 42.46], '74': ['Bartın', 41.63, 32.34], '75': ['Ardahan', 41.11, 42.7], '76': ['Iğdır', 39.92, 44.04], '77': ['Yalova', 40.65, 29.27], '78': ['Karabük', 41.2, 32.62],
    '79': ['Kilis', 36.72, 37.12], '80': ['Osmaniye', 37.07, 36.25], '81': ['Düzce', 40.84, 31.16] };
  // sadeleştirilmiş kıyı/sınır çizgisi (boylam, enlem) — Anadolu + Trakya
  const ANADOLU = [[29.1, 41.22], [30.3, 41.2], [31.4, 41.3], [32.3, 41.72], [33.3, 42.0], [34.9, 42.05], [35.2, 42.1], [36.0, 41.72], [36.4, 41.3], [37.0, 41.2], [38.0, 41.0], [39.7, 41.05], [40.5, 41.08],
    [41.5, 41.55], [42.5, 41.55], [43.5, 41.15], [43.65, 40.5], [44.1, 40.0], [44.85, 39.7], [44.45, 39.0], [44.25, 38.3], [44.45, 37.8], [44.8, 37.2], [44.0, 37.15], [42.4, 37.1], [41.2, 37.08],
    [40.0, 36.9], [38.0, 36.84], [36.65, 36.8], [36.62, 36.3], [36.2, 35.8], [35.9, 35.9], [35.95, 36.6], [35.5, 36.62], [34.6, 36.8], [33.9, 36.3], [32.8, 36.02], [32.0, 36.5], [30.6, 36.85], [30.45, 36.25],
    [29.6, 36.15], [29.05, 36.6], [28.2, 36.7], [27.4, 37.0], [27.2, 37.6], [26.3, 38.3], [26.9, 38.5], [26.7, 39.0], [26.1, 39.5], [26.2, 40.05], [26.7, 40.4], [27.3, 40.42], [28.0, 40.38],
    [29.0, 40.4], [29.95, 40.75], [29.1, 40.9]];
  const TRAKYA = [[26.05, 40.75], [26.6, 40.62], [26.2, 40.05], [26.75, 40.45], [27.5, 40.95], [28.6, 41.0], [29.05, 41.05], [29.1, 41.22], [28.05, 41.6], [27.95, 41.98], [26.6, 41.75], [26.35, 41.7], [26.6, 41.35], [26.3, 41.0]];
  const HARITA = { bas: 25.6, son: 45.1, ust: 42.3, alt: 35.7, adimX: 0.25, adimY: 0.2 };
  const SUTUN = Math.round((HARITA.son - HARITA.bas) / HARITA.adimX), SATIR = Math.round((HARITA.ust - HARITA.alt) / HARITA.adimY);
  const icinde = (x, y, p) => { let ic = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ic = !ic; } return ic; };
  let haritaSvg = '';
  function haritaCiz() {
    if (haritaSvg) return haritaSvg;
    let r = '';
    for (let sy = 0; sy < SATIR; sy++) {
      const lat = HARITA.ust - (sy + 0.5) * HARITA.adimY; let x = 0;
      while (x < SUTUN) {
        const ic = (c) => { const lon = HARITA.bas + (c + 0.5) * HARITA.adimX; return icinde(lon, lat, ANADOLU) || icinde(lon, lat, TRAKYA); };
        if (!ic(x)) { x++; continue; }
        let n = 1; while (x + n < SUTUN && ic(x + n)) n++;
        r += '<rect x="' + x + '" y="' + sy + '" width="' + n + '" height="1"/>'; x += n;
      }
    }
    haritaSvg = '<svg class="mz-harita-svg" viewBox="0 0 ' + SUTUN + ' ' + SATIR + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><g class="mz-kara">' + r + '</g></svg>';
    return haritaSvg;
  }
  const konum = (il) => { const v = IL[il]; return v ? { x: (v[2] - HARITA.bas) / (HARITA.son - HARITA.bas) * 100, y: (HARITA.ust - v[1]) / (HARITA.ust - HARITA.alt) * 100 } : null; };
  const ilAd = (il) => (IL[il] || ['?'])[0];
  const ilSirali = () => Object.keys(IL).sort((a, b) => IL[a][0].localeCompare(IL[b][0], 'tr'));

  let ctx = null, kok = null, govde = null, sekme = 'ilk', cozucu = [], nesil = 0;
  const ad = (k) => CD.kimAdi(k);

  /* ================================================================ ortak: anı kaydet sheet'i */
  function aniFormu(o) {
    // o: { baslik, alanlar:[el], kaydet(degerler, fotoId) }
    const foto = o.foto === false ? null : A().fotoAlani();
    const tarih = ctx.el('input.girdi', { type: 'date', 'aria-label': 'Tarih', value: o.tarih || '' });
    const not = ctx.el('textarea.girdi', { maxlength: '240', rows: '3', 'aria-label': 'Kısa not', placeholder: o.notYer || 'Kısa bir not (isteğe bağlı)' });
    const kaydet = ctx.el('button.dugme.tam', { type: 'button' }, o.dugme || 'Müzeye koy');
    kaydet.addEventListener('click', async () => {
      const d = { tarih: A().tarihGecerli(tarih.value) ? tarih.value : '', not: A().kirp(not.value, 240) };
      if (o.tarihZorunlu && !d.tarih) { ctx.toast('Bir tarih seç 📅'); tarih.focus(); return; }
      if (o.gecerli && !o.gecerli(d)) return;
      kaydet.disabled = true;
      let fotoId = '';
      const b = foto && foto.blob();
      if (b) { try { fotoId = await A().fotoKoy(b); } catch (e) { ctx.toast('Fotoğraf kaydedilemedi; telefonda yer var mı bakar mısın?'); kaydet.disabled = false; return; } }
      if (foto) foto.temizle();
      o.kaydet(d, fotoId);
    });
    ctx.sheet(ctx.el('div.dikey', [].concat(o.alanlar || [], [ctx.el('label.mz-etiket', [o.tarihAd || 'Tarih', tarih]), not, foto ? foto.el : null, kaydet])), { baslik: o.baslik, odak: false, kapaninca: () => foto && foto.temizle() });
  }
  function aniDetay(a) {
    const kendi = a.kim === A().ben();
    const govde_ = [
      a.foto ? A().fotoImg(a.foto, a.baslik + ' fotoğrafı', 'mz-detay-foto') : null,
      ctx.el('div.satir.mz-detay-ust', [A().kisiIkon(a.kim, 20), ctx.el('span.sessiz', a.tarih ? A().tarihUzun(a.tarih) : 'tarih yok')]),
      a.not ? ctx.el('p.mz-detay-not', a.not) : null
    ];
    if (kendi && a.sil) govde_.push(ctx.el('button.dugme-hayalet.tam', { type: 'button', onclick: async () => { if (await ctx.onayla(a.silSoru || 'Bu anı silinsin mi?', 'Sil', 'Kalsın')) { await a.sil(); ciz(); } } }, a.silAd || 'Sil'));
    govde_.push(ctx.el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Kapat'));
    ctx.sheet(ctx.el('div.dikey', govde_), { baslik: a.baslik, odak: false });
  }

  /* ================================================================ İLKLERİMİZ — çizelge */
  function maddeler() {
    const ozel = A().ikisi(K.liste).filter(x => x.tur === 'ozel');
    const l = ONERI.map((m, i) => ({ id: 'h' + (i + 1), metin: m, hazir: true }));
    ozel.sort((a, b) => a.t - b.t).forEach(o => l.push({ id: 'o-' + o.id, metin: o.metin, kim: o.kim, kayitId: o.id }));
    return l.slice(0, MADDE_MAKS);
  }
  const yapilanlar = () => A().ikisi(K.liste).filter(x => x.tur === 'yapildi');
  function cizelgeOgeleri() {
    const ilk = A().ikisi(K.ilk).map(x => ({ id: x.id, kim: x.kim, baslik: A().kirp(x.baslik, 60), tarih: x.tarih, not: A().kirp(x.not, 240), foto: x.foto, tur: 'ilk',
      sil: async () => { await A().fotoSil(x.foto); A().benimSil(K.ilk, x.id); } }));
    const md = {}; maddeler().forEach(m => { md[m.id] = m; });
    const yap = yapilanlar().filter(y => md[y.madde]).map(y => ({ id: y.id, kim: y.kim, baslik: '✓ ' + A().kirp(md[y.madde].metin, 60), tarih: y.tarih, not: A().kirp(y.not, 240), foto: y.foto, tur: 'yapildi',
      silAd: 'Yapılmadı olarak geri al', silSoru: 'Bu madde yapılmadı olarak geri alınsın mı?', sil: async () => { await A().fotoSil(y.foto); A().benimSil(K.liste, y.id); } }));
    return ilk.concat(yap).sort((a, b) => (a.tarih || '0000') < (b.tarih || '0000') ? -1 : ((a.tarih || '') > (b.tarih || '') ? 1 : 0));
  }
  function ilkCiz(el) {
    const ogeler = cizelgeOgeleri();
    el.append(ctx.el('p.sessiz.mz-giris', 'İlklerinizi ve birlikte yaptıklarınızı tarih sırasıyla dizin. Sağa kaydırdıkça bugüne gelirsin.'),
      ctx.el('div.cipler.mz-ornek', { role: 'group', 'aria-label': 'Hızlı başlık' }, ILK_ORNEK.map(b => ctx.el('button.cip', { type: 'button', onclick: () => A().kimIste(() => ilkEkle(b)) }, '+ ' + b))),
      ctx.el('button.dugme.tam', { type: 'button', onclick: () => A().kimIste(() => ilkEkle('')) }, '🖼️ Bir ilk ekle'));
    if (!ogeler.length) { el.appendChild(ctx.el('div.bos-durum.mz-bos', [ctx.el('div.buyuk', '🖼️'), ctx.el('p', 'Müze henüz boş. İlk mesajınızla başlamaya ne dersin?')])); return; }
    const serit = ctx.el('ol.mz-cizelge', { 'aria-label': 'İlklerimiz zaman çizelgesi', tabindex: '0' });
    let yil = '';
    ogeler.forEach(a => {
      const y = a.tarih ? a.tarih.slice(0, 4) : '';
      const li = ctx.el('li.mz-durak' + (a.tur === 'yapildi' ? '.yapildi' : ''), { data: { kim: a.kim } });
      if (y && y !== yil) { yil = y; li.appendChild(ctx.el('span.mz-yil', { 'aria-hidden': 'true' }, y)); }
      li.appendChild(ctx.el('span.mz-nokta', { 'aria-hidden': 'true' }));
      li.appendChild(ctx.el('button.mz-kart', { type: 'button', 'aria-label': a.baslik + (a.tarih ? ', ' + A().tarihUzun(a.tarih) : '') + '. Ayrıntı', onclick: () => aniDetay(a) }, [
        a.foto ? A().fotoImg(a.foto, '', 'mz-kart-foto') : ctx.el('span.mz-kart-cerceve', { 'aria-hidden': 'true' }, a.tur === 'yapildi' ? '✓' : '♥'),
        ctx.el('span.mz-kart-tarih', a.tarih ? CD.tarihYaz(a.tarih) + (a.tarih.slice(0, 4) === String(new Date().getFullYear()) ? '' : '') : 'tarih yok'),
        ctx.el('strong.mz-kart-ad', a.baslik),
        ctx.el('span.mz-kart-kim', [A().kisiIkon(a.kim, 14)])
      ]));
      serit.appendChild(li);
    });
    el.appendChild(ctx.el('div.mz-cizelge-kap', [serit]));
    requestAnimationFrame(() => { if (serit.isConnected) serit.scrollLeft = serit.scrollWidth; });
  }
  function ilkEkle(baslik0) {
    const baslik = ctx.el('input.girdi', { type: 'text', maxlength: '60', 'aria-label': 'Başlık', placeholder: 'İlk …', value: baslik0 || '' });
    aniFormu({ baslik: 'Bir ilk ekle', alanlar: [baslik], tarihZorunlu: true,
      gecerli: () => { if (!A().kirp(baslik.value, 60)) { ctx.toast('Bir başlık yaz ✏️'); baslik.focus(); return false; } return true; },
      kaydet(d, foto) {
        const b = A().kirp(baslik.value, 60);
        A().benimEkle(K.ilk, { id: CD.kimlik(), baslik: b, tarih: d.tarih, not: d.not, foto, t: Date.now() }, 200);
        A().posta('muze', { ne: 'ilk', baslik: b });
        A().pul('ilk', b + ' · ' + A().tarihUzun(d.tarih));
        ctx.sheetKapat(); ctx.ses.parilti(); ctx.toast('Müzeye kondu 🖼️'); ciz();
      } });
  }

  /* ================================================================ ANI HARİTASI */
  function haritaSekme(el) {
    const yerler = A().ikisi(K.yer).filter(x => IL[x.il]);
    const ilGrup = {}; yerler.forEach(y => { (ilGrup[y.il] = ilGrup[y.il] || []).push(y); });
    const gittik = Object.keys(ilGrup).filter(il => ilGrup[il].some(y => y.tur === 'gittik'));
    const gidecek = Object.keys(ilGrup).filter(il => gittik.indexOf(il) < 0);
    el.append(ctx.el('p.sessiz.mz-giris', 'Gittiğiniz yerlere pembe, gideceklerinize mavi iğne koyun. İğneye dokununca not ve fotoğraf açılır.'),
      ctx.el('div.mz-lejant', [ctx.el('span.mz-lejant-oge.gittik', gittik.length + ' gittik'), ctx.el('span.mz-lejant-oge.gidecek', gidecek.length + ' gideceğiz')]));
    const kat = ctx.el('div.mz-harita', { html: haritaCiz() });
    kat.addEventListener('click', (e) => {
      if (e.target.closest('.mz-igne')) return;
      const r = kat.getBoundingClientRect();
      const lon = HARITA.bas + (e.clientX - r.left) / r.width * (HARITA.son - HARITA.bas), lat = HARITA.ust - (e.clientY - r.top) / r.height * (HARITA.ust - HARITA.alt);
      let en = null, d0 = Infinity;
      Object.keys(IL).forEach(il => { const d = Math.hypot((IL[il][2] - lon) * 0.78, IL[il][1] - lat); if (d < d0) { d0 = d; en = il; } });
      if (en && d0 < 1.2) A().kimIste(() => yerEkle(en));
    });
    Object.keys(ilGrup).forEach(il => {
      const p = konum(il); const g = gittik.indexOf(il) >= 0;
      const b = ctx.el('button.mz-igne' + (g ? '.gittik' : '.gidecek'), { type: 'button', 'aria-label': ilAd(il) + (g ? ': gittik' : ': gideceğiz') + '. ' + ilGrup[il].length + ' not', onclick: () => yerDetay(il) }, [ctx.el('span', { 'aria-hidden': 'true' })]);
      b.style.left = p.x + '%'; b.style.top = p.y + '%';
      kat.appendChild(b);
    });
    el.appendChild(ctx.el('div.mz-harita-kap', [kat]));
    el.appendChild(ctx.el('button.dugme.tam', { type: 'button', onclick: () => A().kimIste(() => yerEkle('')) }, '📍 Yer ekle'));
    if (Object.keys(ilGrup).length) {
      const l = ctx.el('ul.mz-yer-liste');
      Object.keys(ilGrup).sort((a, b) => ilAd(a).localeCompare(ilAd(b), 'tr')).forEach(il => {
        const g = gittik.indexOf(il) >= 0;
        l.appendChild(ctx.el('li', [ctx.el('button.mz-yer-satir', { type: 'button', onclick: () => yerDetay(il) }, [ctx.el('span.mz-yer-nokta' + (g ? '.gittik' : '.gidecek'), { 'aria-hidden': 'true' }), ctx.el('span', ilAd(il)), ctx.el('span.sessiz', g ? 'gittik' : 'gideceğiz')])]));
      });
      el.appendChild(l);
    }
  }
  function yerEkle(il0) {
    let tur = 'gittik';
    const sec = ctx.el('select.girdi', { 'aria-label': 'İl' }, [ctx.el('option', { value: '' }, 'İl seç…')].concat(ilSirali().map(il => ctx.el('option', { value: il }, ilAd(il)))));
    sec.value = il0 || '';
    const turSec = ctx.el('div.cipler', { role: 'radiogroup', 'aria-label': 'Gittik mi, gideceğiz mi?' });
    [['gittik', '📍 Gittik'], ['gidecegiz', '✈️ Gideceğiz']].forEach(([k, a]) => {
      const b = ctx.el('button.cip', { type: 'button', role: 'radio', 'aria-checked': k === tur ? 'true' : 'false', 'aria-selected': k === tur ? 'true' : 'false' }, a);
      b.addEventListener('click', () => { tur = k; ctx.ses.tik(); turSec.querySelectorAll('.cip').forEach(x => { const s = x === b; x.setAttribute('aria-checked', s); x.setAttribute('aria-selected', s); }); });
      turSec.appendChild(b);
    });
    aniFormu({ baslik: 'Haritaya iğne koy', alanlar: [ctx.el('label.mz-etiket', ['Nereye?', sec]), turSec], tarihAd: 'Tarih (isteğe bağlı)', dugme: '📍 İğneyi koy',
      gecerli: () => { if (!IL[sec.value]) { ctx.toast('Bir il seç 📍'); sec.focus(); return false; } return true; },
      kaydet(d, foto) {
        const il = sec.value;
        A().benimEkle(K.yer, { id: CD.kimlik(), il, tur, not: d.not, tarih: d.tarih, foto, t: Date.now() }, 200);
        A().posta('muze', { ne: 'yer', il: ilAd(il), tur });
        A().pul('ani-harita', ilAd(il) + (tur === 'gittik' ? ' · gittik' : ' · gideceğiz'));
        ctx.sheetKapat(); ctx.ses.parilti(); ctx.toast(ilAd(il) + ' haritada 📍'); ciz();
      } });
  }
  function yerDetay(il) {
    const kayit = A().ikisi(K.yer).filter(x => x.il === il).sort((a, b) => (a.tarih || '').localeCompare(b.tarih || ''));
    const l = ctx.el('div.dikey.mz-yer-detay', kayit.map(y => ctx.el('div.yama.siki.mz-yer-kart', [
      ctx.el('div.satir.mz-detay-ust', [A().kisiIkon(y.kim, 18), ctx.el('span.rozet' + (y.tur === 'gittik' ? '' : '.goz'), y.tur === 'gittik' ? 'gittik' : 'gideceğiz'), ctx.el('span.sessiz', y.tarih ? A().tarihUzun(y.tarih) : '')]),
      y.foto ? A().fotoImg(y.foto, ilAd(il) + ' fotoğrafı', 'mz-detay-foto') : null,
      y.not ? ctx.el('p.mz-detay-not', A().kirp(y.not, 240)) : null,
      y.kim === A().ben() ? ctx.el('button.dugme-hayalet.kucuk', { type: 'button', onclick: async () => { if (await ctx.onayla('Bu iğne kaldırılsın mı?', 'Kaldır', 'Kalsın')) { await A().fotoSil(y.foto); A().benimSil(K.yer, y.id); ciz(); } } }, 'Kaldır') : null
    ])));
    ctx.sheet(ctx.el('div.dikey', [l, ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => A().kimIste(() => yerEkle(il)) }, '+ Buraya not ekle'), ctx.el('button.dugme.tam', { type: 'button', onclick: () => ctx.sheetKapat() }, 'Kapat')]), { baslik: '📍 ' + ilAd(il), odak: false });
  }

  /* ================================================================ BİRLİKTE YAPACAKLARIMIZ */
  function listeCiz(el) {
    const md = maddeler(), yap = {}; yapilanlar().forEach(y => { if (!yap[y.madde]) yap[y.madde] = y; });
    const yapilan = md.filter(m => yap[m.id]).length;
    el.append(ctx.el('p.sessiz.mz-giris', 'Birlikte yapacağımız 50 şey. Yaptığınızda işaretleyin; fotoğraf eklerseniz madde müze çizelgesinde bir anıya dönüşür.'),
      ctx.el('div.bar.mz-ilerleme', [ctx.el('span.bar-ikon', { 'aria-hidden': 'true' }, '💗'), ctx.el('div.bar-yol', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(MADDE_MAKS), 'aria-valuenow': String(yapilan), 'aria-label': yapilan + ' / ' + MADDE_MAKS + ' yapıldı' }, [ctx.el('div.bar-dolu', { style: 'width:' + Math.round(yapilan / MADDE_MAKS * 100) + '%' })]), ctx.el('span.bar-yuzde', yapilan + '/' + MADDE_MAKS)]));
    const ol = ctx.el('ol.mz-madde-liste');
    md.forEach((m, i) => {
      const y = yap[m.id];
      ol.appendChild(ctx.el('li.mz-madde' + (y ? '.yapildi' : ''), [
        ctx.el('button.mz-madde-dugme', { type: 'button', 'aria-label': (i + 1) + '. ' + m.metin + (y ? '. Yapıldı, ayrıntı' : '. Yaptık diye işaretle'), onclick: () => y ? yapildiDetay(m, y) : A().kimIste(() => yapildiIsaretle(m)) }, [
          ctx.el('span.mz-kutu', { 'aria-hidden': 'true' }, y ? '✓' : ''),
          ctx.el('span.mz-madde-no', { 'aria-hidden': 'true' }, String(i + 1)),
          ctx.el('span.mz-madde-metin', m.metin),
          m.kim ? A().kisiIkon(m.kim, 14) : null,
          y && y.foto ? A().fotoImg(y.foto, '', 'mz-madde-foto') : null
        ]),
        !y && m.kayitId && m.kim === A().ben() ? ctx.el('button.dugme-ikon.mz-madde-sil', { type: 'button', 'aria-label': 'Bu maddeyi sil', onclick: async () => { if (await ctx.onayla('Bu madde silinsin mi?', 'Sil', 'Kalsın')) { A().benimSil(K.liste, m.kayitId); ciz(); } } }, '✕') : null
      ]));
    });
    for (let i = md.length; i < MADDE_MAKS; i++) {
      ol.appendChild(ctx.el('li.mz-madde.bos', [ctx.el('button.mz-madde-dugme', { type: 'button', 'aria-label': (i + 1) + '. Boş madde. Kendi maddeni yaz', onclick: () => A().kimIste(maddeYaz) }, [ctx.el('span.mz-kutu', { 'aria-hidden': 'true' }, '+'), ctx.el('span.mz-madde-no', { 'aria-hidden': 'true' }, String(i + 1)), ctx.el('span.mz-madde-metin.sessiz', 'Kendi maddeni yaz…')])]));
    }
    el.appendChild(ol);
  }
  function maddeYaz() {
    if (maddeler().length >= MADDE_MAKS) { ctx.toast('Liste dolu: 50 madde 💗'); return; }
    const m = ctx.el('input.girdi', { type: 'text', maxlength: '70', 'aria-label': 'Yeni madde', placeholder: 'Birlikte …' });
    const k = ctx.el('button.dugme.tam', { type: 'button' }, 'Listeye ekle');
    k.addEventListener('click', () => {
      const v = A().kirp(m.value, 70); if (!v) { ctx.toast('Bir şey yaz ✏️'); m.focus(); return; }
      A().benimEkle(K.liste, { id: CD.kimlik(), tur: 'ozel', metin: v, t: Date.now() }, 300);
      ctx.sheetKapat(); ctx.toast('Listeye eklendi 💗'); ciz();
    });
    ctx.sheet(ctx.el('div.dikey', [m, k]), { baslik: 'Kendi maddeni yaz' });
  }
  function yapildiIsaretle(m) {
    aniFormu({ baslik: 'Yaptık! 🎉', alanlar: [ctx.el('p.kalin', m.metin)], tarih: CD.bugun(), dugme: '✓ Yapıldı', notYer: 'Nasıldı? (isteğe bağlı)',
      kaydet(d, foto) {
        A().benimEkle(K.liste, { id: CD.kimlik(), tur: 'yapildi', madde: m.id, tarih: d.tarih || CD.bugun(), not: d.not, foto, t: Date.now() }, 300);
        A().posta('muze', { ne: 'yapildi', baslik: A().kirp(m.metin, 60) });
        A().pul('yapildi', A().kirp(m.metin, 80));
        ctx.sheetKapat(); ctx.ses.zafer && ctx.ses.zafer(); if (!ctx.azHareket) ctx.efekt.konfeti(undefined, undefined, 16); ctx.toast('Bir madde daha ✓'); ciz();
      } });
  }
  function yapildiDetay(m, y) {
    aniDetay({ baslik: '✓ ' + m.metin, kim: y.kim, tarih: y.tarih, not: y.not, foto: y.foto, silAd: 'Yapılmadı olarak geri al', silSoru: 'Bu madde yapılmadı olarak geri alınsın mı?',
      sil: async () => { await A().fotoSil(y.foto); A().benimSil(K.liste, y.id); } });
  }

  /* ================================================================ bölüm */
  const SEKMELER = [['ilk', '🖼️ İlklerimiz'], ['harita', '🗺️ Harita'], ['liste', '💗 50 şey']];
  function ciz() {
    if (!ctx || !govde) return;
    const kayma = govde.querySelector('.mz-cizelge');
    govde.innerHTML = '';
    const ic = ctx.el('div.mz-sekme-ic', { role: 'tabpanel', 'aria-labelledby': 'ao-sekme-muze-' + sekme });
    ({ ilk: ilkCiz, harita: haritaSekme, liste: listeCiz })[sekme](ic);
    govde.appendChild(ic);
    if (kayma) void kayma;
  }
  const T = (CD.postaTurleri = CD.postaTurleri || {});
  T.muze = {
    kart(o, y) {
      const v = o.v || {};
      const baslik = v.ne === 'yer' ? y.A + ' haritaya iğne koydu 📍' : (v.ne === 'yapildi' ? y.A + ' bir maddeyi işaretledi ✓' : y.A + ' müzeye bir anı ekledi 🖼️');
      const alt = v.ne === 'yer' ? A().kirp(v.il, 30) + (v.tur === 'gittik' ? ' · gittik' : ' · gideceğiz') : A().kirp(v.baslik, 60);
      y.kart({ kim: y.kim, tur: 'muze', baslik, alt, eylem: { ad: 'Müzeye git', fn: () => { CD.depo.yaz('cihaz.muze.sekme', v.ne === 'yer' ? 'harita' : (v.ne === 'yapildi' ? 'liste' : 'ilk')); CD.ac(ID); } } });
      if (CD.aktifBolum && CD.aktifBolum() === ID) setTimeout(ciz, 1500);
    },
    ozet(l, A_) { return '🖼️ ' + A_ + ' Anı Müzesi\'ne ' + (l.length > 1 ? l.length + ' şey' : 'bir şey') + ' ekledi'; }
  };
  CD.mhIpucu[ID] = () => { const n = A().ikisi(K.ilk).length + yapilanlar().length; return n ? n + ' anı sergide 🖼️' : ''; };
  CD.muzeVeri = { IL, ilAd };

  CD.kaydet({
    id: ID, baslik: 'Anı Müzesi', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el; nesil++;
      sekme = A().sekmeOku(ID, SEKMELER.map(s => s[0]), 'ilk');
      govde = ctx.el('div.mz-govde');
      el.appendChild(ctx.el('div.icerik.mz-icerik', [A().sekmeler(ID, SEKMELER, sekme, (s) => { sekme = s; ciz(); }), govde]));
      ciz();
      const yen = () => { if (ctx) ciz(); };
      cozucu = [CD.olay.dinle('senk:yenilendi', yen), CD.olay.dinle('kim', yen)];
    },
    unmount() { nesil++; cozucu.forEach(f => { try { f(); } catch (e) {} }); cozucu = []; ctx = null; kok = null; govde = null; }
  });
})();
