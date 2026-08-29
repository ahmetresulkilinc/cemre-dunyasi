/* js/bolum/bizim.js — Bizim Köşemiz
   İkimizin albümü (başlangıçta dolu) · Birlikte sayacı · Seni sevmemin sebepleri · Şarkımız · Evet/Hayır · Aşk ölçer · Anı zaman çizelgesi
   Kişisel içerik config.js → CD_CONFIG.BIZIM'den gelir; boş alan "yakında" görünür, uydurulmaz.
   Albüm: config.js → BIZIM_FOTOLAR (assets/bizim/*.jpg) + Cemre'nin telefondan eklediği kareler (IndexedDB).
   Sözleşme: site/MODUL-SOZLESMESI.md · klasik <script>, modül yok, fetch yok. */
(() => {
  'use strict';
  const ID = 'bizim';
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const SEKMELER = [
    { id: 'album', ad: 'Albüm', ikon: '📷' },
    { id: 'sebepler', ad: 'Sebepler', ikon: '💌' },
    { id: 'sarki', ad: 'Şarkımız', ikon: '🎵' },
    { id: 'soru', ad: 'Soru', ikon: '💭' },
    { id: 'olcer', ad: 'Aşk ölçer', ikon: '💘' },
    { id: 'anilar', ad: 'Anılar', ikon: '🧵' }
  ];
  const FOTO_YOL = 'assets/bizim/';
  const G = p => (window.GIZLI ? window.GIZLI.url(p) : p); // şifreli fotoğraf → blob adresi (kilit.js)
  // Ahmet'in eklediği başlangıç kareleri (site/assets/bizim/). config.js → BIZIM_FOTOLAR varsa o kazanır; bu liste sadece yedek.
  const VARSAYILAN_FOTOLAR = [
    { dosya: 'ikimiz.jpg', altyazi: 'İkimiz 🤍' },
    { dosya: 'cemre-1.jpg', altyazi: 'Dünyanın en güzel insanı 💋' },
    { dosya: 'cemre-2.jpg', altyazi: 'Işık sana yakışıyor ☀️' },
    { dosya: 'buket.jpg', altyazi: 'Lilyumlu buket 💐' },
    { dosya: 'patrick.jpg', altyazi: 'Patrick 🍬' },
    { dosya: 'melody.jpg', altyazi: 'My Melody 🎀' },
    { dosya: 'kopek.jpg', altyazi: '🐶' }
  ];

  let ctx = null, kok = null, nesil = 0;
  let panel = null, sekmeAktif = 'album', cipKap = null;
  let zamanlayicilar = [], araliklar = [], rafId = 0;
  let urlHavuzu = [];
  let fotolar = [], fotolarYuklendi = false, idbUyariVerildi = false;
  let dosyaGirdisi = null;
  let sebepIdx = 0;

  /* ------------------------------------------------------------ küçük yardımcılar */
  const zt = (fn, ms) => { const t = setTimeout(fn, ms); zamanlayicilar.push(t); return t; };
  const ar = (fn, ms) => { const t = setInterval(fn, ms); araliklar.push(t); return t; };
  const temiz = (v) => (v == null ? '' : String(v)).trim();
  const canli = (n) => ctx && n === nesil;

  function ayar() {
    const b = (ctx.config && ctx.config.BIZIM && typeof ctx.config.BIZIM === 'object') ? ctx.config.BIZIM : {};
    const sarki = (b.SARKI && typeof b.SARKI === 'object') ? b.SARKI : {};
    let link = temiz(sarki.LINK);
    if (link && !/^https?:\/\//i.test(link)) link = '';
    return {
      tarih: temiz(b.BIRLIKTE_TARIH),
      sebepler: Array.isArray(b.SEBEPLER) ? b.SEBEPLER.map(temiz).filter(Boolean) : [],
      sarki: { ad: temiz(sarki.AD), link },
      soru: temiz(b.SORU),
      anilar: Array.isArray(b.ANILAR) ? b.ANILAR.map(a => ({ tarih: temiz(a && a.TARIH), metin: temiz(a && a.METIN), kaynak: 'ahmet' })).filter(a => a.metin) : []
    };
  }
  function tarihCoz(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
    const [y, a, g] = iso.split('-').map(Number);
    const d = new Date(y, a - 1, g);
    if (isNaN(d.getTime()) || d.getMonth() !== a - 1) return null;
    return d;
  }
  function tarihUzun(iso) {
    const d = tarihCoz(iso); if (!d) return '';
    return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear();
  }
  function isoYap(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  const sayiYaz = (n) => Number(n).toLocaleString('tr-TR');
  function merkez(el) { return ctx.efekt.merkez(el); }
  function kalpAt(el, n) { const m = merkez(el); ctx.efekt.kalp(m.x, m.y, n || 4); }
  function salla(dugme) { dugme.classList.remove('salla'); void dugme.offsetWidth; dugme.classList.add('salla'); }

  function yakindaKarti(baslik, aciklama, ahmetIpucu) {
    return ctx.el('div.yama.bizim-yakinda', [
      ctx.el('div.satir', [ctx.el('span.rozet.gri', 'yakında'), ctx.el('strong.bizim-yakinda-baslik', baslik)]),
      ctx.el('p.ikincil', aciklama),
      ahmetIpucu ? ctx.el('p.sessiz.bizim-ahmet-notu', 'Ahmet için: site/config.js içinde ' + ahmetIpucu + ' satırını doldurman yeter.') : null
    ]);
  }

  /* ------------------------------------------------------------ hub ipucu */
  function ipucuGuncelle() {
    if (!ctx) return;
    const a = ayar();
    let m = '';
    const gun = a.tarih ? CD.gunFarki(a.tarih) : null;
    const kare = albumListesi().length;
    if (gun != null && gun >= 0) m = sayiYaz(gun) + ' gündür birlikte ❤';
    else if (kare) m = 'Albümde ' + kare + ' kare';
    else if (a.sebepler.length) m = a.sebepler.length + ' sebep seni bekliyor';
    ctx.depo.yaz('ipucu', m.slice(0, 40));
  }

  /* ------------------------------------------------------------ 1) BİRLİKTE SAYACI */
  function sureParcala(bas) {
    const s = new Date();
    let y = s.getFullYear() - bas.getFullYear(), a = s.getMonth() - bas.getMonth(), g = s.getDate() - bas.getDate();
    if (g < 0) { a--; g += new Date(s.getFullYear(), s.getMonth(), 0).getDate(); }
    if (a < 0) { y--; a += 12; }
    return { y, a, g };
  }
  function ayDonumu(bas) {
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const gun = bas.getDate();
    const yap = (yy, mm) => { const son = new Date(yy, mm + 1, 0).getDate(); return new Date(yy, mm, Math.min(gun, son)); };
    let y = bugun.getFullYear(), m = bugun.getMonth();
    let aday = yap(y, m);
    if (aday < bugun) { if (m === 11) { y++; m = 0; } else m++; aday = yap(y, m); }
    const fark = Math.round((aday - bugun) / 86400000);
    const kacinci = (aday.getFullYear() - bas.getFullYear()) * 12 + (aday.getMonth() - bas.getMonth());
    return { fark, kacinci, yilDonumu: aday.getMonth() === bas.getMonth() && kacinci > 0, tarih: aday };
  }
  function sayacKur() {
    const a = ayar();
    const bas = tarihCoz(a.tarih);
    // Kompakt kart: bölümün üst şeridi; asıl sahne (albüm, sebepler…) ilk ekranda görünsün diye alçak tutulur.
    const kart = ctx.el('section.yama.siki.bizim-sayac', { 'aria-label': 'Birlikte sayacı' });
    if (!a.tarih || !bas) {
      kart.append(
        ctx.el('div.bizim-sayac-ust', 'Birlikte'),
        ctx.el('div.bizim-sayac-bekle', [ctx.el('span.bizim-sayac-kalp', { 'aria-hidden': 'true', html: KALP_SVG }), ctx.el('span', 'Sayaç yakında başlıyor')]),
        ctx.el('p.ikincil.bizim-sayac-aciklama', 'Ahmet ilk günümüzü yazınca burada gün gün, saat saat sayacağız.'),
        ctx.el('p.sessiz.bizim-ahmet-notu', a.tarih && !bas ? 'Ahmet için: BIRLIKTE_TARIH "yıl-ay-gün" biçiminde olmalı, örnek "2025-02-14".' : 'Ahmet için: site/config.js içinde BIRLIKTE_TARIH satırına ilk gününüzü yaz (örnek "2025-02-14").')
      );
      return kart;
    }
    const gun = CD.gunFarki(a.tarih);
    if (gun < 0) {
      kart.append(ctx.el('div.bizim-sayac-ust', 'Birlikte'), ctx.el('p.ikincil.bizim-sayac-aciklama', 'Bu tarih ileride görünüyor; sayaç o gün gelince başlayacak.'), ctx.el('p.sessiz.bizim-ahmet-notu', 'Ahmet için: BIRLIKTE_TARIH bugünden önce bir gün olmalı.'));
      return kart;
    }
    const sayi = ctx.el('button.bizim-sayac-sayi.sayi', { type: 'button', 'aria-label': gun + ' gündür birlikteyiz; dokununca kalp çıkar' }, sayiYaz(gun));
    const p = sureParcala(bas);
    const parca = [];
    if (p.y) parca.push(p.y + ' yıl'); if (p.a) parca.push(p.a + ' ay'); if (p.g || !parca.length) parca.push(p.g + ' gün');
    const canliYazi = ctx.el('div.bizim-sayac-canli.sayi', { 'aria-live': 'off' });
    const ad = ayDonumu(bas);
    let notMetin = '';
    if (ad.kacinci > 0) {
      const adi = ad.yilDonumu ? (Math.round(ad.kacinci / 12) + '. yıl dönümümüz') : (ad.kacinci + '. ay dönümümüz');
      notMetin = ad.fark === 0 ? 'Bugün ' + adi + ' 🎉' : (ad.fark === 1 ? 'Yarın ' + adi : adi + 'e ' + ad.fark + ' gün var');
    }
    kart.append(
      ctx.el('div.bizim-sayac-ust', 'Birlikte'),
      ctx.el('div.bizim-sayac-orta', [sayi, ctx.el('span.bizim-sayac-etiket', gun === 0 ? 'bugün ilk günümüz' : 'gündür birlikteyiz')]),
      ctx.el('div.bizim-sayac-alt', [ctx.el('span.bizim-sayac-tarih', tarihUzun(a.tarih) + ' · ' + parca.join(' ')), canliYazi]),
      notMetin ? ctx.el('div.bizim-sayac-not', [ctx.el('span', { 'aria-hidden': 'true' }, '♥'), ctx.el('span', notMetin)]) : null
    );
    const canliGuncelle = () => {
      const ms = Date.now() - bas.getTime();
      const saat = Math.floor(ms / 3600000), dk = Math.floor(ms / 60000) % 60, sn = Math.floor(ms / 1000) % 60;
      canliYazi.textContent = 'yani ' + sayiYaz(saat) + ' saat ' + String(dk).padStart(2, '0') + ' dakika ' + String(sn).padStart(2, '0') + ' saniye';
    };
    canliGuncelle();
    ar(canliGuncelle, 1000);
    sayi.addEventListener('click', e => { ctx.ses.pit(); ctx.efekt.kalp(e.clientX || merkez(sayi).x, e.clientY || merkez(sayi).y, 6); sayi.classList.remove('zip'); void sayi.offsetWidth; sayi.classList.add('zip'); });
    if (ad.kacinci > 0 && ad.fark === 0 && ctx.depo.al('kutlama', '') !== CD.bugun()) {
      ctx.depo.yaz('kutlama', CD.bugun());
      zt(() => { if (!ctx) return; ctx.efekt.konfeti(); ctx.ses.zafer(); ctx.toast('Bugün özel bir gün ❤'); }, 700);
    }
    return kart;
  }

  /* ------------------------------------------------------------ 2) İKİMİZİN ALBÜMÜ */
  // Yerleşik kareler: config.js BIZIM_FOTOLAR (yoksa CEMRE_CONFIG.BIZIM_FOTOLAR, o da yoksa VARSAYILAN_FOTOLAR).
  // Cemre altyazı/tarih değiştirirse depo'ya (yerlesik), gizlerse depo'ya (gizliFotolar) yazılır; dosyalar hiç silinmez.
  function yerlesikHam() {
    const c = ctx.config || {};
    let l = c.BIZIM_FOTOLAR;
    if (!Array.isArray(l) && c.BIZIM && Array.isArray(c.BIZIM.FOTOLAR)) l = c.BIZIM.FOTOLAR;
    if (!Array.isArray(l) && window.CEMRE_CONFIG && Array.isArray(window.CEMRE_CONFIG.BIZIM_FOTOLAR)) l = window.CEMRE_CONFIG.BIZIM_FOTOLAR;
    if (!Array.isArray(l)) l = VARSAYILAN_FOTOLAR;
    return l;
  }
  function yerlesikler() {
    let ov = ctx.depo.al('yerlesik', {}); if (!ov || typeof ov !== 'object') ov = {};
    let gizli = ctx.depo.al('gizliFotolar', []); if (!Array.isArray(gizli)) gizli = [];
    const gorulen = {};
    return yerlesikHam().map(f => {
      if (!f || typeof f !== 'object') return null;
      const dosya = temiz(f.dosya || f.DOSYA);
      if (!dosya || !/^[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(dosya) || gorulen[dosya]) return null;
      gorulen[dosya] = true;
      const ad = dosya.replace(/\.[^.]+$/, '');
      const o = (ov[dosya] && typeof ov[dosya] === 'object') ? ov[dosya] : {};
      const oneCikan = f.oneCikan != null || f.ONE_CIKAN != null ? !!(f.oneCikan || f.ONE_CIKAN) : /^ikimiz\./i.test(dosya);
      return {
        id: 'yerlesik:' + dosya, yerlesik: true, dosya,
        yol: G(FOTO_YOL + dosya), kucuk: G(FOTO_YOL + ad + '-thumb.jpg'),
        altyazi: o.altyazi != null ? temiz(o.altyazi) : temiz(f.altyazi || f.ALTYAZI),
        tarih: tarihCoz(o.tarih != null ? o.tarih : temiz(f.tarih || f.TARIH)) ? (o.tarih != null ? o.tarih : temiz(f.tarih || f.TARIH)) : '',
        oneCikan, gizli: gizli.indexOf(dosya) >= 0
      };
    }).filter(Boolean);
  }
  // Duvar sırası: öne çıkan (ikimiz) → Cemre'nin eklediği kareler (yeniden eskiye) → Ahmet'in diğer kareleri (config sırası)
  function albumListesi() {
    const y = yerlesikler().filter(f => !f.gizli);
    const one = y.filter(f => f.oneCikan), kalan = y.filter(f => !f.oneCikan);
    return one.concat(fotolar, kalan);
  }
  function fotoUrl(f) {
    if (f.yerlesik) return f.yol;
    if (f._url) return f._url;
    try { f._url = URL.createObjectURL(f.blob); urlHavuzu.push(f._url); } catch (e) { f._url = ''; }
    return f._url;
  }
  function fotolariYukle(n) {
    if (fotolarYuklendi) return Promise.resolve(fotolar);
    return ctx.idb.hepsi('fotolar').then(liste => {
      if (!canli(n)) return fotolar;
      fotolar = (liste || []).filter(f => f && typeof f.id === 'string' && f.id.indexOf('bizim:') === 0 && f.blob).sort((a, b) => (b.olusturma || 0) - (a.olusturma || 0));
      fotolarYuklendi = true;
      return fotolar;
    }).catch(() => {
      if (!canli(n)) return fotolar;
      fotolarYuklendi = true;
      if (!idbUyariVerildi) { idbUyariVerildi = true; ctx.toast('Bu tarayıcı fotoğrafı kalıcı saklayamıyor; eklediklerin bu ziyarette kalır.'); }
      return fotolar;
    });
  }
  function albumKur(n) {
    const kap = ctx.el('div.dikey.bizim-album-kap');
    if (fotolarYuklendi) { albumCiz(kap); return kap; }
    // yerleşik kareler hemen görünsün; Cemre'nin kareleri IndexedDB'den gelince duvar tazelenir
    albumCiz(kap, true);
    fotolariYukle(n).then(() => { if (canli(n) && kap.isConnected) albumCiz(kap); });
    return kap;
  }
  const PIN_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27S5 20 5 12c0-4 3-7 7-7 2 0 3.5 1 4 2.5C16.5 6 18 5 20 5c4 0 7 3 7 7 0 8-11 15-11 15z" fill="var(--seker-kiraz)"/><path d="M9 11c-1 .6-1.6 1.8-1.6 3" stroke="var(--kagit)" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".9"/></svg>';
  function albumCiz(kap, yukleniyor) {
    kap.innerHTML = '';
    const liste = albumListesi();
    const gizliSayi = yerlesikler().filter(f => f.gizli).length;
    ipucuGuncelle();
    const geriGetir = gizliSayi ? ctx.el('button.dugme-hayalet.bizim-gizli-geri', { type: 'button', onclick: () => {
      ctx.depo.sil('gizliFotolar'); ctx.ses.parilti(); albumCiz(kap); ctx.toast('Kareler duvara geri döndü');
    } }, 'Kaldırdığın ' + gizliSayi + ' kareyi geri getir') : null;
    if (!liste.length) {
      kap.append(ctx.el('div.yama.bos-durum.bizim-bos', [
        ctx.el('div.bizim-bos-polaroid', { 'aria-hidden': 'true' }, [ctx.el('span.bizim-bant'), ctx.el('span.bizim-bos-ic', '📷')]),
        ctx.el('p', 'Duvar boş; ilk karemiz seni bekliyor.'),
        ctx.el('button.dugme', { type: 'button', onclick: fotoSec }, 'Fotoğraf ekle'),
        geriGetir
      ]));
      return;
    }
    kap.append(ctx.el('div.satir.arasi', [
      ctx.el('span.sessiz', yukleniyor ? 'Duvar asılıyor…' : liste.length + ' kare · dokununca büyür'),
      ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: fotoSec }, '+ Ekle')
    ]));
    const izgara = ctx.el('div.bizim-album', { role: 'list' });
    liste.forEach((f, i) => {
      const img = ctx.el('img', { src: f.yerlesik ? (f.oneCikan ? f.yol : f.kucuk) : fotoUrl(f), alt: f.altyazi || 'İkimizin fotoğrafı', loading: i < 4 ? 'eager' : 'lazy', decoding: 'async', draggable: 'false' });
      if (f.yerlesik) img.addEventListener('error', () => { if (img.dataset.yedek) return; img.dataset.yedek = '1'; img.src = f.yol; }, { once: true });
      const tarih = f.tarih ? tarihUzun(f.tarih) : (!f.yerlesik && f.olusturma ? tarihUzun(isoYap(new Date(f.olusturma))) : '');
      const p = ctx.el('figure.bizim-polaroid' + (f.oneCikan ? '.bizim-one-cikan' : ''), { role: 'listitem', tabindex: '0', 'aria-label': (f.altyazi || 'Fotoğraf') + (tarih ? ', ' + tarih : '') }, [
        ctx.el('span.bizim-bant', { 'aria-hidden': 'true' }),
        f.oneCikan ? ctx.el('span.bizim-pin', { 'aria-hidden': 'true', html: PIN_SVG }) : null,
        ctx.el('div.bizim-foto', [img]),
        ctx.el('figcaption.bizim-altyazi', [ctx.el('span.bizim-altyazi-metin', f.altyazi || (f.yerlesik ? '♥' : '…')), tarih ? ctx.el('span.bizim-tarih', tarih) : null])
      ]);
      p.style.setProperty('--i', Math.min(i, 10));
      const ac = () => { ctx.ses.tik(); fotoSheet(f); };
      p.addEventListener('click', ac);
      p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ac(); } });
      izgara.appendChild(p);
    });
    kap.appendChild(izgara);
    if (geriGetir) kap.appendChild(geriGetir);
  }
  function albumTazele() { const kap = panel && panel.querySelector('.bizim-album-kap'); if (kap) albumCiz(kap); else ipucuGuncelle(); }
  function fotoSec() { if (dosyaGirdisi) { dosyaGirdisi.value = ''; dosyaGirdisi.click(); } }
  async function dosyalarGeldi(e) {
    const n = nesil;
    const dosyalar = Array.from((e.target && e.target.files) || []).filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|gif)$/i.test(f.name));
    if (!dosyalar.length) { ctx.toast('Fotoğraf seçilmedi; istediğin zaman yine dene.'); return; }
    ctx.toast(dosyalar.length > 1 ? dosyalar.length + ' fotoğraf küçültülüyor…' : 'Fotoğraf küçültülüyor…', 1600);
    if (!fotolarYuklendi) { await fotolariYukle(n); if (!canli(n)) return; }
    let eklenen = null, hata = 0;
    for (const dosya of dosyalar) {
      try {
        const blob = await CD.fotoKucult(dosya, 1280, 0.82);
        if (!canli(n)) return;
        if (!blob) throw new Error('boş');
        const kayit = { id: 'bizim:' + CD.kimlik(), blob, altyazi: '', tarih: '', olusturma: Date.now() };
        try { await ctx.idb.koy('fotolar', kayit); } catch (err) { if (!idbUyariVerildi) { idbUyariVerildi = true; ctx.toast('Bu tarayıcı fotoğrafı kalıcı saklayamıyor; bu ziyarette albümde kalır.'); } }
        if (!canli(n)) return;
        fotolar.unshift(kayit); eklenen = kayit;
      } catch (err) { hata++; }
    }
    if (!canli(n)) return;
    albumTazele();
    if (eklenen) {
      ctx.ses.parilti();
      const yeniKart = panel && panel.querySelector('.bizim-polaroid:not(.bizim-one-cikan)');
      if (yeniKart) kalpAt(yeniKart, 5); else ctx.efekt.kalp(innerWidth / 2, innerHeight / 2, 5);
      if (dosyalar.length === 1) zt(() => { if (canli(n)) fotoSheet(eklenen, true); }, 350);
      else ctx.toast('Mırr ~ ' + (dosyalar.length - hata) + ' kare duvara asıldı');
    }
    if (hata) ctx.toast(hata === dosyalar.length ? 'Fotoğraf okunamadı; başka bir tane dener misin?' : hata + ' fotoğraf okunamadı, diğerleri eklendi.');
  }
  function fotoSheet(f, yeni) {
    const n = nesil;
    const img = ctx.el('img.bizim-buyuk-foto', { src: fotoUrl(f), alt: f.altyazi || 'İkimizin fotoğrafı', draggable: 'false' });
    const alt = ctx.el('input.girdi', { type: 'text', value: f.altyazi || '', placeholder: 'Altına bir şey yaz…', maxlength: '90', autocomplete: 'off' });
    const tarih = ctx.el('input.girdi', { type: 'date', value: f.tarih || '' });
    const kaydet = ctx.el('button.dugme', { type: 'button' }, 'Kaydet');
    const kaldir = ctx.el('button.dugme-ikincil', { type: 'button' }, f.yerlesik ? 'Duvardan kaldır' : 'Sil');
    kaydet.addEventListener('click', async () => {
      const yeniAlt = temiz(alt.value).slice(0, 90), yeniTarih = tarihCoz(tarih.value) ? tarih.value : '';
      f.altyazi = yeniAlt; f.tarih = yeniTarih;
      if (f.yerlesik) {
        let ov = ctx.depo.al('yerlesik', {}); if (!ov || typeof ov !== 'object') ov = {};
        ov[f.dosya] = { altyazi: yeniAlt, tarih: yeniTarih }; ctx.depo.yaz('yerlesik', ov);
      } else {
        try { await ctx.idb.koy('fotolar', { id: f.id, blob: f.blob, altyazi: yeniAlt, tarih: yeniTarih, olusturma: f.olusturma }); } catch (e) {}
      }
      if (!canli(n)) return;
      ctx.ses.parilti(); kalpAt(kaydet, 3);
      ctx.sheetKapat();
      albumTazele();
      ctx.toast('Mırr ~ kaydedildi');
    });
    kaldir.addEventListener('click', async () => {
      ctx.sheetKapat();
      await CD.bekle(340); if (!canli(n)) return;
      const evet = await ctx.onayla(f.yerlesik ? 'Bu kare duvardan insin mi? İstersen sonra geri getirebilirsin.' : 'Bu kare albümden çıksın mı?', f.yerlesik ? 'İnsin' : 'Çıkar', 'Kalsın');
      if (!evet || !canli(n)) return;
      if (f.yerlesik) {
        let gizli = ctx.depo.al('gizliFotolar', []); if (!Array.isArray(gizli)) gizli = [];
        if (gizli.indexOf(f.dosya) < 0) gizli.push(f.dosya);
        ctx.depo.yaz('gizliFotolar', gizli);
      } else {
        try { await ctx.idb.sil('fotolar', f.id); } catch (e) {}
        if (!canli(n)) return;
        fotolar = fotolar.filter(x => x.id !== f.id);
        if (f._url) { try { URL.revokeObjectURL(f._url); } catch (e) {} urlHavuzu = urlHavuzu.filter(u => u !== f._url); }
      }
      ctx.ses.blop();
      albumTazele();
      ctx.toast(f.yerlesik ? 'Kare duvardan indi' : 'Kare albümden çıktı');
    });
    const kaynak = ctx.el('span.rozet' + (f.yerlesik ? '.inci' : ''), f.yerlesik ? 'Ahmet ekledi' : 'Sen ekledin');
    const kutu = ctx.el('div.dikey.bizim-foto-sheet', [
      ctx.el('div.bizim-buyuk-kap', [img]),
      ctx.el('div.satir.sar', [kaynak, f.oneCikan ? ctx.el('span.rozet', 'öne çıkan ♥') : null]),
      ctx.el('label.etiket', ['Altyazı', alt]),
      ctx.el('label.etiket', ['Tarih', tarih]),
      ctx.el('div.satir.bizim-sheet-dugmeler', [kaldir, ctx.el('span.bosluk'), kaydet])
    ]);
    ctx.sheet(kutu, { baslik: yeni ? 'Duvara asıldı ✨' : 'Bu kare', odak: false });
    if (yeni) zt(() => { try { alt.focus({ preventScroll: true }); } catch (e) {} }, 420);
  }

  /* ------------------------------------------------------------ 3) SENİ SEVMEMİN SEBEPLERİ (çevrilen kartlar) */
  const KALP_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 54S8 40 8 24c0-7 5-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 7 0 12 5 12 12 0 16-24 30-24 30z" fill="var(--seker-kiraz)"/><path d="M18 20c-3 1-5 4-5 7" stroke="var(--kagit)" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".85"/></svg>';
  function sebeplerKur() {
    const a = ayar();
    const kap = ctx.el('div.dikey.bizim-sebepler');
    if (!a.sebepler.length) {
      kap.append(yakindaKarti('Sebepler yazılıyor', 'Ahmet seni sevme sebeplerini teker teker buraya yazacak; sen de kart kart çevirip okuyacaksın.', 'SEBEPLER'));
      return kap;
    }
    const N = a.sebepler.length;
    let okunan = ctx.depo.al('sebepOkunan', []); if (!Array.isArray(okunan)) okunan = [];
    okunan = okunan.filter(i => Number.isInteger(i) && i >= 0 && i < N);
    sebepIdx = CD.sinirla(ctx.depo.al('sebepIdx', 0) | 0, 0, N - 1);
    let cevrik = false;

    const on = ctx.el('div.bizim-yuz.bizim-on', [ctx.el('span.bizim-on-kalp', { html: KALP_SVG }), ctx.el('span.bizim-on-yazi', 'Seni sevmemin sebebi'), ctx.el('span.bizim-on-no.sayi'), ctx.el('span.bizim-on-ipucu', 'çevirmek için dokun')]);
    const arka = ctx.el('div.bizim-yuz.bizim-arka', [ctx.el('p.bizim-sebep-metin'), ctx.el('span.bizim-arka-imza', '— Ahmet')]);
    const kart = ctx.el('div.bizim-kart3d', { role: 'button', tabindex: '0', 'aria-pressed': 'false' }, [on, arka]);
    const deste = ctx.el('div.bizim-deste', [kart]);
    const sayac = ctx.el('span.bizim-deste-sayac.sayi');
    const geriD = ctx.el('button.dugme-ikon', { type: 'button', 'aria-label': 'Önceki sebep' }, '‹');
    const ileriD = ctx.el('button.dugme-ikon', { type: 'button', 'aria-label': 'Sonraki sebep' }, '›');
    const bar = ctx.el('div.bar.bizim-sebep-bar', [ctx.el('span.bar-ikon', '💌'), ctx.el('span.bar-yol', [ctx.el('span.bar-dolu')]), ctx.el('span.bar-yuzde')]);
    const rozetKap = ctx.el('div.bizim-sebep-rozet');

    function guncelle() {
      on.querySelector('.bizim-on-no').textContent = (sebepIdx + 1) + ' / ' + N;
      arka.querySelector('.bizim-sebep-metin').textContent = a.sebepler[sebepIdx];
      sayac.textContent = (sebepIdx + 1) + ' / ' + N;
      kart.setAttribute('aria-label', 'Sebep ' + (sebepIdx + 1) + ' / ' + N + (cevrik ? ': ' + a.sebepler[sebepIdx] : ', çevirmek için dokun'));
      bar.querySelector('.bar-dolu').style.width = Math.round(okunan.length / N * 100) + '%';
      bar.querySelector('.bar-yuzde').textContent = okunan.length + '/' + N;
      rozetKap.innerHTML = '';
      if (okunan.length >= N) rozetKap.appendChild(ctx.el('span.rozet.inci', 'Hepsini okudun ♥'));
      else rozetKap.appendChild(ctx.el('span.sessiz', okunan.length ? (N - okunan.length) + ' sebep daha var' : 'Kartı çevir, ilk sebebi oku'));
    }
    function cevir(zorla) {
      cevrik = zorla == null ? !cevrik : !!zorla;
      kart.classList.toggle('cevrik', cevrik); kart.setAttribute('aria-pressed', String(cevrik));
      if (cevrik) {
        ctx.ses.pop(); kalpAt(kart, 4);
        if (okunan.indexOf(sebepIdx) < 0) {
          okunan.push(sebepIdx); ctx.depo.yaz('sebepOkunan', okunan);
          if (okunan.length >= N && !ctx.depo.al('sebepTamam', false)) {
            ctx.depo.yaz('sebepTamam', true);
            zt(() => { if (!ctx) return; ctx.efekt.konfeti(); ctx.ses.zafer(); ctx.toast('Hepsini okudun; hepsi de gerçek ❤'); }, 500);
          }
        }
      } else ctx.ses.tik();
      guncelle();
    }
    function git(yon) {
      const yeni = (sebepIdx + yon + N) % N;
      if (cevrik) { cevir(false); }
      deste.classList.remove('kay-sol', 'kay-sag'); void deste.offsetWidth; deste.classList.add(yon > 0 ? 'kay-sol' : 'kay-sag');
      const bekle = ctx.azHareket ? 0 : 170;
      zt(() => { if (!ctx) return; sebepIdx = yeni; ctx.depo.yaz('sebepIdx', sebepIdx); guncelle(); }, bekle);
      zt(() => { if (ctx) deste.classList.remove('kay-sol', 'kay-sag'); }, bekle * 2 + 60);
      ctx.ses.tik();
    }
    kart.addEventListener('click', () => cevir());
    kart.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cevir(); } else if (e.key === 'ArrowRight') git(1); else if (e.key === 'ArrowLeft') git(-1); });
    geriD.addEventListener('click', () => git(-1)); ileriD.addEventListener('click', () => git(1));
    // kaydırma (swipe)
    let x0 = null, y0 = null, sur = false;
    deste.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; sur = false; }, { passive: true });
    deste.addEventListener('pointermove', e => { if (x0 == null) return; if (Math.abs(e.clientX - x0) > 12 && Math.abs(e.clientX - x0) > Math.abs(e.clientY - y0)) sur = true; }, { passive: true });
    deste.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = y0 = null; if (sur && Math.abs(dx) > 40) { git(dx < 0 ? 1 : -1); kart.dataset.kaydirildi = '1'; zt(() => { delete kart.dataset.kaydirildi; }, 50); } }, { passive: true });
    deste.addEventListener('pointercancel', () => { x0 = y0 = null; }, { passive: true });
    kart.addEventListener('click', e => { if (kart.dataset.kaydirildi) e.stopImmediatePropagation(); }, true);
    // dışarıdan (altbar) rastgele sebep
    kap._rastgele = () => {
      const kalan = []; for (let i = 0; i < N; i++) if (okunan.indexOf(i) < 0) kalan.push(i);
      const hedef = kalan.length ? CD.rastgele(kalan) : Math.floor(Math.random() * N);
      if (cevrik) cevir(false);
      sebepIdx = hedef; ctx.depo.yaz('sebepIdx', sebepIdx); guncelle();
      zt(() => { if (ctx) cevir(true); }, ctx.azHareket ? 50 : 380);
    };
    guncelle();
    kap.append(deste, ctx.el('div.satir.bizim-deste-nav', [geriD, ctx.el('span.bosluk'), sayac, ctx.el('span.bosluk'), ileriD]), ctx.el('div.yama.siki.dikey.bizim-sebep-ilerleme', [bar, rozetKap]));
    return kap;
  }

  /* ------------------------------------------------------------ 4) ŞARKIMIZ */
  const PLAK_SVG = '<svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="76" fill="#2B2733"/><circle cx="80" cy="80" r="66" fill="none" stroke="#FFFFFF" stroke-opacity=".12" stroke-width="1"/><circle cx="80" cy="80" r="58" fill="none" stroke="#FFFFFF" stroke-opacity=".10" stroke-width="1"/><circle cx="80" cy="80" r="50" fill="none" stroke="#FFFFFF" stroke-opacity=".12" stroke-width="1"/><circle cx="80" cy="80" r="42" fill="none" stroke="#FFFFFF" stroke-opacity=".10" stroke-width="1"/><path d="M28 60a56 56 0 0 1 24-30" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="80" cy="80" r="26" fill="var(--burun)"/><path d="M80 66c-4-5-12-3-12 4 0 6 12 14 12 14s12-8 12-14c0-7-8-9-12-4z" fill="#FFF9F3"/><circle cx="80" cy="80" r="3.5" fill="#2B2733"/></svg>';
  function sarkiKur() {
    const a = ayar();
    const kap = ctx.el('div.dikey');
    if (!a.sarki.ad) {
      kap.append(yakindaKarti('Şarkımız seçiliyor', 'Ahmet şarkımızın adını yazınca burada plak gibi dönecek; bağlantı varsa tek dokunuşla açılır.', 'SARKI'));
      return kap;
    }
    const plak = ctx.el('button.bizim-plak', { type: 'button', 'aria-label': 'Plağı döndür', 'aria-pressed': 'false', html: PLAK_SVG });
    const kol = ctx.el('span.bizim-plak-kol', { 'aria-hidden': 'true' });
    let donuyor = false, notaT = 0;
    plak.addEventListener('click', e => {
      donuyor = !donuyor; plak.classList.toggle('donuyor', donuyor); plak.setAttribute('aria-pressed', String(donuyor));
      ctx.ses.tink(); ctx.efekt.emoji(e.clientX || merkez(plak).x, e.clientY || merkez(plak).y, '♪', 3);
      clearInterval(notaT);
      if (donuyor && !ctx.azHareket) { notaT = ar(() => { const m = merkez(plak); ctx.efekt.emoji(m.x + (Math.random() * 60 - 30), m.y - 40, CD.rastgele(['♪', '♫', '♡']), 1); }, 1400); }
    });
    let host = '';
    try { host = a.sarki.link ? new URL(a.sarki.link).hostname.replace(/^www\./, '') : ''; } catch (e) { host = ''; }
    kap.append(ctx.el('div.yama.bizim-sarki', [
      ctx.el('div.bizim-plak-kap', [plak, kol]),
      ctx.el('div.bizim-sarki-metin', [
        ctx.el('span.bizim-sarki-ust', 'Şarkımız'),
        ctx.el('h2.bizim-sarki-ad', a.sarki.ad),
        a.sarki.link ? ctx.el('a.dugme', { href: a.sarki.link, target: '_blank', rel: 'noopener noreferrer', onclick: () => ctx.ses.pop() }, 'Şarkıyı aç ↗') : ctx.el('p.sessiz', 'Bağlantı yok; sen mırıldan, biz dinleriz.'),
        host ? ctx.el('p.sessiz', host + ' yeni sekmede açılır') : null
      ])
    ]));
    return kap;
  }

  /* ------------------------------------------------------------ 5) EVET / HAYIR */
  const HAYIR_SOZLERI = ['Hayır', 'Emin misin?', 'Bir daha düşün', 'Yakalayamazsın', 'Kaçıyorum!', 'Pes ediyorum', 'Evet de artık'];
  function soruKur() {
    const a = ayar();
    const kap = ctx.el('div.dikey');
    if (!a.soru) {
      kap.append(yakindaKarti('Bir soru geliyor', 'Ahmet sana tek bir soru soracak. İpucu: "Hayır" düğmesi biraz utangaç.', 'SORU'));
      return kap;
    }
    let kayit = ctx.depo.al('soru', null); if (!kayit || typeof kayit !== 'object') kayit = null;
    const kart = ctx.el('div.yama.bizim-soru');
    function kayitYaz(k) { kayit = Object.assign(kayit || {}, k); ctx.depo.yaz('soru', kayit); }
    function sorulmusCiz() {
      kart.innerHTML = '';
      const detay = [];
      if (kayit && kayit.tarih) detay.push(tarihUzun(kayit.tarih));
      if (kayit && kayit.kacis) detay.push('"Hayır" ' + kayit.kacis + ' kez kaçtı');
      if (kayit && kayit.sayi > 1) detay.push(kayit.sayi + '. kez');
      kart.append(
        ctx.el('div.bizim-soru-balon', a.soru),
        ctx.el('div.bizim-soru-cevap', [ctx.el('span.bizim-soru-kalp', { html: KALP_SVG, 'aria-hidden': 'true' }), ctx.el('div', [ctx.el('strong', 'Evet dedin ❤'), ctx.el('div.sessiz', detay.join(' · '))])]),
        ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { ctx.ses.tik(); soruCiz(); } }, 'Tekrar sor')
      );
    }
    function soruCiz() {
      kart.innerHTML = '';
      let kacis = 0;
      const alan = ctx.el('div.bizim-soru-alan');
      const evet = ctx.el('button.dugme.bizim-evet', { type: 'button' }, 'Evet');
      const hayir = ctx.el('button.dugme-ikincil.bizim-hayir', { type: 'button', 'aria-label': 'Hayır (bu düğme kaçıyor)' }, 'Hayır');
      let sonKacis = 0;
      function kac(e) {
        const simdi = Date.now(); if (simdi - sonKacis < 120) return; sonKacis = simdi;
        kacis++;
        const r = alan.getBoundingClientRect(), hr = hayir.getBoundingClientRect(), er = evet.getBoundingClientRect();
        let x, y, deneme = 0;
        do {
          x = 8 + Math.random() * Math.max(8, r.width - hr.width - 16);
          y = 8 + Math.random() * Math.max(8, r.height - hr.height - 16);
          deneme++;
        } while (deneme < 12 && Math.abs((r.left + x + hr.width / 2) - (er.left + er.width / 2)) < er.width * 0.9 && Math.abs((r.top + y + hr.height / 2) - (er.top + er.height / 2)) < er.height * 1.4);
        hayir.style.left = x + 'px'; hayir.style.top = y + 'px';
        hayir.classList.add('kacti');
        hayir.textContent = HAYIR_SOZLERI[Math.min(kacis, HAYIR_SOZLERI.length - 1)];
        const olcek = Math.max(0.55, 1 - kacis * 0.07); hayir.style.setProperty('--olcek', olcek);
        evet.style.setProperty('--olcek', Math.min(1.35, 1 + kacis * 0.05));
        ctx.ses.hop();
        if (e && e.type === 'click') ctx.toast('Düğme utandı, kaçtı 🙈', 1200);
        if (kacis === 4) ctx.toast('Hayır demek zor iş…', 1400);
        if (kacis === 8) ctx.toast('Pıttıksu bile Evet diyor', 1400);
      }
      ['pointerdown', 'pointerenter', 'touchstart', 'focus'].forEach(t => hayir.addEventListener(t, kac, { passive: true }));
      hayir.addEventListener('click', e => { e.preventDefault(); kac(e); });
      evet.addEventListener('click', e => {
        kayitYaz({ cevap: 'evet', tarih: CD.bugun(), kacis, sayi: ((kayit && kayit.sayi) || 0) + 1 });
        ctx.ses.zafer(); zt(() => { if (ctx) ctx.ses.can(); }, 350);
        ctx.efekt.konfeti(e.clientX || merkez(evet).x, e.clientY || merkez(evet).y, 18);
        ctx.efekt.kalp(e.clientX || merkez(evet).x, e.clientY || merkez(evet).y, 8);
        evet.classList.add('sevindi'); hayir.hidden = true;
        zt(() => { if (ctx) sorulmusCiz(); }, 900);
      });
      alan.append(evet, hayir);
      kart.append(ctx.el('div.bizim-soru-balon', a.soru), alan, ctx.el('p.sessiz.orta', 'Not: "Hayır" düğmesi biraz utangaç.'));
      // hayır'ı evet'in yanına koy
      requestAnimationFrame(() => { if (!ctx) return; const r = alan.getBoundingClientRect(), er = evet.getBoundingClientRect(), hr = hayir.getBoundingClientRect(); const x = Math.max(er.right - r.left + 12, r.width - hr.width - 12); hayir.style.left = Math.max(8, x) + 'px'; hayir.style.top = Math.max(8, er.top - r.top + (er.height - hr.height) / 2) + 'px'; });
    }
    if (kayit && kayit.cevap === 'evet') sorulmusCiz(); else soruCiz();
    kap.append(kart);
    return kap;
  }

  /* ------------------------------------------------------------ 6) AŞK ÖLÇER */
  function adNormalle(s) { return temiz(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/[^a-zçğöşüi ]/g, '').replace(/\s+/g, ' ').trim(); }
  function karma(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function olc(a, b) {
    const x = adNormalle(a), y = adNormalle(b);
    const cift = [x, y];
    const var_ = (k) => cift.some(v => v.indexOf(k) >= 0);
    if (var_('cemre') && var_('ahmet') && x !== y) return { yuzde: 100, yorum: 'Ölçer bile bunu biliyor: %100. Sürpriz değil, gerçek.', ozel: true };
    if (var_('cemre') && var_('pittiksu')) return { yuzde: 99, yorum: 'Kedi-insan bağı: sonsuz. Kalan %1 tırmalama payı.', ozel: true };
    if (var_('ahmet') && var_('pittiksu')) return { yuzde: 97, yorum: 'Pıttıksu onayladı; ama önce Cemre.', ozel: false };
    if (x === y) return { yuzde: 100, yorum: 'Kendini sevmek her şeyin başı 🌷', ozel: false };
    const yuzde = 30 + (karma(cift.slice().sort().join('+')) % 70);
    let yorum;
    if (yuzde >= 95) yorum = 'Evren onaylıyor, düğün pastası seçin.';
    else if (yuzde >= 80) yorum = 'Çok tatlı bir ikili; kıskandım.';
    else if (yuzde >= 65) yorum = 'Umut var; bir kahve daha içsinler.';
    else if (yuzde >= 50) yorum = 'İyi arkadaş, iyi çay. Bu da bir şey.';
    else yorum = 'Pıttıksu bile ikna olmadı; iki ayrı yumak.';
    return { yuzde, yorum, ozel: false };
  }
  function olcerKur() {
    const kap = ctx.el('div.dikey');
    const son = ctx.depo.al('olcerSon', null);
    const ad1 = ctx.el('input.girdi', { type: 'text', value: (son && son.a) || 'Cemre', placeholder: 'Bir isim', maxlength: '30', autocomplete: 'off', 'aria-label': 'Birinci isim' });
    const ad2 = ctx.el('input.girdi', { type: 'text', value: (son && son.b) || '', placeholder: 'Bir isim daha', maxlength: '30', autocomplete: 'off', 'aria-label': 'İkinci isim' });
    const olcD = ctx.el('button.dugme.tam', { type: 'button' }, 'Ölç');
    const yuzdeYazi = ctx.el('span.bizim-olcer-yuzde.sayi', '%?');
    const kalp = ctx.el('div.bizim-olcer-kalp', [ctx.el('span.bizim-olcer-kalp-svg', { html: KALP_SVG, 'aria-hidden': 'true' }), yuzdeYazi]);
    const bar = ctx.el('div.bar.bizim-olcer-bar', [ctx.el('span.bar-ikon', '💘'), ctx.el('span.bar-yol', [ctx.el('span.bar-dolu', { stil: { width: '0%' } })]), ctx.el('span.bar-yuzde', '0%')]);
    const yorum = ctx.el('p.bizim-olcer-yorum', { 'aria-live': 'polite' }, 'İki isim yaz, kalbi dinleyelim.');
    const gecmisKap = ctx.el('div.bizim-olcer-gecmis');
    function gecmisCiz() {
      const g = ctx.depo.al('olcumler', []);
      gecmisKap.innerHTML = '';
      if (!Array.isArray(g) || !g.length) return;
      gecmisKap.append(ctx.el('div.sessiz', 'Son ölçümler'), ctx.el('ul.bizim-olcer-liste', g.slice(0, 5).map(o => ctx.el('li', [ctx.el('span', o.a + ' + ' + o.b), ctx.el('span.rozet' + (o.y >= 95 ? '.inci' : ''), '%' + o.y)]))));
    }
    let calisiyor = false;
    function calistir() {
      if (calisiyor) return;
      const a = temiz(ad1.value), b = temiz(ad2.value);
      if (!a || !b) { salla(olcD); ctx.ses.hmpf(); ctx.toast('İki isim yaz, ölçer öyle çalışıyor.'); (a ? ad2 : ad1).focus(); return; }
      calisiyor = true; olcD.disabled = true;
      const s = olc(a, b);
      kalp.classList.remove('sonuc', 'ozel'); kalp.classList.add('olcuyor');
      yorum.textContent = 'Kalp atışı sayılıyor…';
      const bitir = () => {
        if (!ctx) return;
        calisiyor = false; olcD.disabled = false;
        kalp.classList.remove('olcuyor'); kalp.classList.add('sonuc'); if (s.ozel) kalp.classList.add('ozel');
        yuzdeYazi.textContent = '%' + s.yuzde; bar.querySelector('.bar-dolu').style.width = s.yuzde + '%'; bar.querySelector('.bar-yuzde').textContent = s.yuzde + '%';
        yorum.textContent = s.yorum;
        const m = merkez(kalp);
        if (s.yuzde >= 95) { ctx.ses.zafer(); zt(() => { if (ctx) ctx.ses.can(); }, 300); ctx.efekt.konfeti(m.x, m.y, 18); ctx.efekt.kalp(m.x, m.y, 8); }
        else if (s.yuzde >= 65) { ctx.ses.parilti(); ctx.efekt.kalp(m.x, m.y, 5); }
        else { ctx.ses.blop(); ctx.efekt.toz(m.x, m.y + 30, 5); }
        ctx.depo.yaz('olcerSon', { a, b, y: s.yuzde });
        let g = ctx.depo.al('olcumler', []); if (!Array.isArray(g)) g = [];
        g = [{ a, b, y: s.yuzde }].concat(g.filter(o => !(o.a === a && o.b === b))).slice(0, 8);
        ctx.depo.yaz('olcumler', g); gecmisCiz();
      };
      if (ctx.azHareket) { yuzdeYazi.textContent = '%' + s.yuzde; zt(bitir, 200); return; }
      const t0 = performance.now(), sure = 1500 + (s.ozel ? 500 : 0); let sonTik = -1;
      const adim = (t) => {
        if (!ctx) return;
        const k = Math.min(1, (t - t0) / sure), e = 1 - Math.pow(1 - k, 3);
        const v = Math.round(s.yuzde * e);
        yuzdeYazi.textContent = '%' + v; bar.querySelector('.bar-dolu').style.width = v + '%'; bar.querySelector('.bar-yuzde').textContent = v + '%';
        if (Math.floor(v / 10) !== sonTik) { sonTik = Math.floor(v / 10); ctx.ses.tik(); }
        if (k < 1) rafId = requestAnimationFrame(adim); else bitir();
      };
      rafId = requestAnimationFrame(adim);
    }
    olcD.addEventListener('click', calistir);
    [ad1, ad2].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); calistir(); } }));
    const takas = ctx.el('button.dugme-ikon.bizim-takas', { type: 'button', 'aria-label': 'İsimleri değiştir', onclick: () => { const t = ad1.value; ad1.value = ad2.value; ad2.value = t; ctx.ses.tik(); } }, '⇅');
    gecmisCiz();
    kap.append(ctx.el('div.yama.dikey.bizim-olcer', [
      kalp,
      ctx.el('div.bizim-olcer-form', [ad1, takas, ad2]),
      olcD, bar, yorum, gecmisKap
    ]));
    return kap;
  }

  /* ------------------------------------------------------------ 7) ANI ZAMAN ÇİZELGESİ */
  function notlariAl() { const n = ctx.depo.al('notlar', []); return Array.isArray(n) ? n.filter(x => x && x.metin) : []; }
  function anilarKur() {
    const kap = ctx.el('div.dikey.bizim-anilar-kap');
    anilarCiz(kap);
    return kap;
  }
  function anilarCiz(kap) {
    kap.innerHTML = '';
    const a = ayar();
    const kendi = notlariAl().map(x => ({ id: x.id, tarih: temiz(x.tarih), metin: temiz(x.metin), kaynak: 'cemre' }));
    const hepsi = a.anilar.concat(kendi).sort((p, q) => { if (!p.tarih && !q.tarih) return 0; if (!p.tarih) return 1; if (!q.tarih) return -1; return p.tarih < q.tarih ? -1 : (p.tarih > q.tarih ? 1 : 0); });
    const ust = ctx.el('div.satir.arasi', [ctx.el('span.sessiz', hepsi.length ? hepsi.length + ' anı, ipe dizili' : 'İp boş; ilk anıyı sen as'), ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: aniEkleSheet }, '+ Anı ekle')]);
    kap.appendChild(ust);
    if (!a.anilar.length) kap.appendChild(yakindaKarti('Ahmet\'in anıları yazılıyor', 'Ahmet ilk anılarımızı tarih tarih yazacak; sen de kendi anılarını ekleyebilirsin, hepsi aynı ipe dizilir.', 'ANILAR'));
    if (!hepsi.length) return;
    const liste = ctx.el('ol.bizim-zaman', { 'aria-label': 'Anı zaman çizelgesi' });
    hepsi.forEach((x, i) => {
      const li = ctx.el('li.bizim-ani', [
        ctx.el('span.bizim-ani-nokta', { 'aria-hidden': 'true' }),
        ctx.el('div.yama.siki.bizim-ani-kart', [
          ctx.el('div.satir.sar.bizim-ani-ust', [x.tarih ? ctx.el('span.rozet.goz', tarihUzun(x.tarih) || x.tarih) : ctx.el('span.rozet.gri', 'tarihsiz'), ctx.el('span.rozet' + (x.kaynak === 'cemre' ? '' : '.inci'), x.kaynak === 'cemre' ? 'Cemre yazdı' : 'Ahmet yazdı')]),
          ctx.el('p.bizim-ani-metin', x.metin),
          x.kaynak === 'cemre' ? ctx.el('button.dugme-hayalet.bizim-ani-sil', { type: 'button', onclick: () => aniSil(x.id, kap) }, 'Sil') : null
        ])
      ]);
      li.style.setProperty('--i', Math.min(i, 10));
      li.addEventListener('pointerdown', e => { ctx.ses.pit(); ctx.efekt.kalp(e.clientX, e.clientY, 2); }, { passive: true });
      liste.appendChild(li);
    });
    kap.appendChild(liste);
  }
  async function aniSil(id, kap) {
    const n = nesil;
    const evet = await ctx.onayla('Bu anı ipten insin mi?', 'İnsin', 'Kalsın');
    if (!evet || !canli(n)) return;
    ctx.depo.yaz('notlar', notlariAl().filter(x => x.id !== id));
    ctx.ses.blop(); anilarCiz(kap); ctx.toast('Anı ipten indi');
  }
  function aniEkleSheet() {
    const n = nesil;
    const tarih = ctx.el('input.girdi', { type: 'date', value: CD.bugun() });
    const metin = ctx.el('textarea.girdi', { placeholder: 'Ne oldu, ne hissettin?', maxlength: '240', rows: '3' });
    const kaydet = ctx.el('button.dugme', { type: 'button' }, 'İpe as');
    kaydet.addEventListener('click', () => {
      const m = temiz(metin.value).slice(0, 240);
      if (!m) { metin.focus(); salla(kaydet); ctx.ses.hmpf(); return; }
      const liste = notlariAl(); liste.push({ id: CD.kimlik(), tarih: tarihCoz(tarih.value) ? tarih.value : '', metin: m, olusturma: Date.now() });
      ctx.depo.yaz('notlar', liste);
      ctx.ses.parilti(); kalpAt(kaydet, 4);
      ctx.sheetKapat();
      if (!canli(n)) return;
      if (sekmeAktif !== 'anilar') sekmeAc('anilar'); else { const kap = panel && panel.querySelector('.bizim-anilar-kap'); if (kap) anilarCiz(kap); }
      ctx.toast('Mırr ~ anı ipe asıldı');
    });
    ctx.sheet(ctx.el('div.dikey', [ctx.el('label.etiket', ['Tarih', tarih]), ctx.el('label.etiket', ['Anı', metin]), kaydet]), { baslik: 'Bir anı as', odak: false });
    zt(() => { try { metin.focus({ preventScroll: true }); } catch (e) {} }, 420);
  }

  /* ------------------------------------------------------------ sekmeler */
  function sekmeAc(id) {
    if (!ctx || !panel) return;
    const s = SEKMELER.find(x => x.id === id) || SEKMELER[0];
    sekmeAktif = s.id; ctx.depo.yaz('sekme', s.id);
    if (cipKap) cipKap.querySelectorAll('.cip').forEach(c => {
      const on = c.dataset.sekme === s.id; c.setAttribute('aria-selected', String(on)); c.tabIndex = on ? 0 : -1;
      if (!on) return;
      // seçili çipi şeridin ortasına getir — yalnız yatay kaydırma (scrollIntoView sayfayı dikey de oynatabiliyor)
      const kr = cipKap.getBoundingClientRect(), cr = c.getBoundingClientRect();
      const sol = Math.max(0, cipKap.scrollLeft + (cr.left - kr.left) - (kr.width - cr.width) / 2);
      try { cipKap.scrollTo({ left: sol, behavior: ctx.azHareket ? 'auto' : 'smooth' }); } catch (e) { cipKap.scrollLeft = sol; }
    });
    panel.innerHTML = '';
    const n = nesil;
    let ic;
    try {
      ic = s.id === 'album' ? albumKur(n) : s.id === 'sebepler' ? sebeplerKur() : s.id === 'sarki' ? sarkiKur() : s.id === 'soru' ? soruKur() : s.id === 'olcer' ? olcerKur() : anilarKur();
    } catch (e) { console.warn('[bizim] sekme', s.id, e); ic = ctx.el('div.yama.bos-durum', [ctx.el('div.buyuk', '🧶'), ctx.el('p', 'Bu köşe biraz karıştı; başka bir sekmeye geçip geri gelir misin?')]); }
    ic.classList.add('bizim-panel-ic'); ic.id = 'bizimPanel-' + s.id; ic.setAttribute('role', 'tabpanel'); ic.setAttribute('aria-labelledby', 'bizimSekme-' + s.id);
    panel.appendChild(ic);
  }
  function ciplerKur() {
    const kap = ctx.el('div.cipler.bizim-sekmeler', { role: 'tablist', 'aria-label': 'Bizim köşemiz bölümleri' });
    SEKMELER.forEach(s => {
      const c = ctx.el('button.cip', { type: 'button', role: 'tab', id: 'bizimSekme-' + s.id, 'aria-selected': 'false', 'aria-controls': 'bizimPanel-' + s.id, data: { sekme: s.id } }, [ctx.el('span', { 'aria-hidden': 'true' }, s.ikon), ctx.el('span', s.ad)]);
      c.addEventListener('click', () => { if (sekmeAktif !== s.id) { ctx.ses.tik(); sekmeAc(s.id); } });
      kap.appendChild(c);
    });
    kap.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = SEKMELER.findIndex(s => s.id === sekmeAktif); const y = (i + (e.key === 'ArrowRight' ? 1 : -1) + SEKMELER.length) % SEKMELER.length;
      sekmeAc(SEKMELER[y].id); const c = kap.querySelector('[data-sekme="' + SEKMELER[y].id + '"]'); if (c) c.focus();
    });
    return kap;
  }

  /* ------------------------------------------------------------ kayıt */
  CD.kaydet({
    id: ID,
    baslik: 'Bizim Köşemiz',
    ikon: '<svg viewBox="0 0 64 64"><path d="M32 54S8 40 8 24c0-7 5-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 7 0 12 5 12 12 0 16-24 30-24 30z" fill="var(--seker-kiraz)"/><path d="M32 47S15 37 15 25" fill="none" stroke="var(--kagit)" stroke-width="2" stroke-dasharray="3 3" stroke-linecap="round" opacity=".9"/></svg>',
    tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el; nesil++;
      fotolar = []; fotolarYuklendi = false; urlHavuzu = []; zamanlayicilar = []; araliklar = []; rafId = 0;
      dosyaGirdisi = ctx.el('input.gorsel-gizli', { type: 'file', accept: 'image/*', multiple: true, tabindex: '-1', 'aria-hidden': 'true' });
      dosyaGirdisi.addEventListener('change', e => { dosyalarGeldi(e).catch(err => { console.warn('[bizim] foto', err); if (ctx) ctx.toast('Fotoğraf eklenemedi; bir daha dener misin?'); }); });
      cipKap = ciplerKur();
      panel = ctx.el('div.icerik.bizim-panel');
      el.append(
        ctx.el('div.icerik.bizim-ust', [sayacKur()]),
        cipKap,
        panel,
        dosyaGirdisi
      );
      const istenen = ctx.depo.al('sekme', 'album');
      sekmeAc(SEKMELER.some(s => s.id === istenen) ? istenen : 'album');
      ctx.altbar([
        { id: 'foto', ad: 'Fotoğraf ekle', ikon: '📷', birincil: true, tikla() { fotoSec(); } },
        { id: 'sebep', ad: 'Bir sebep', ikon: '💌', tikla() { if (sekmeAktif !== 'sebepler') sekmeAc('sebepler'); const ic = panel.querySelector('.bizim-sebepler'); if (ic && ic._rastgele) ic._rastgele(); else ctx.toast('Sebepler yazılınca burada çıkacak 💌'); } },
        { id: 'olcer', ad: 'Aşk ölçer', ikon: '💘', tikla() { sekmeAc('olcer'); } },
        { id: 'ani', ad: 'Anı ekle', ikon: '🧵', tikla() { aniEkleSheet(); } }
      ]);
      ipucuGuncelle();
      // Cemre'nin karelerini arka planda öğren (ipucu için); albüm açıksa duvarı da tazeler
      const n = nesil; fotolariYukle(n).then(() => { if (canli(n)) ipucuGuncelle(); });
    },
    unmount() {
      nesil++;
      zamanlayicilar.forEach(clearTimeout); araliklar.forEach(clearInterval); zamanlayicilar = []; araliklar = [];
      if (rafId) cancelAnimationFrame(rafId); rafId = 0;
      urlHavuzu.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); urlHavuzu = [];
      fotolar.forEach(f => { delete f._url; });
      if (ctx) ctx.ses.hepsiniDurdur();
      fotolar = []; fotolarYuklendi = false; dosyaGirdisi = null; panel = null; cipKap = null;
      ctx = null; kok = null;
    }
  });
})();
