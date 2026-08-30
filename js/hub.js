/* hub.js — Giriş ekranı (hub): selam, battaniyede uyuyan Pıttıksu, 8 bölüm kartı (kendi SVG logosu + adı),
   dolaşan pixel petler, gündüz/gece, "Buketi tekrar gör / Notu oku", ana ekrana ekle kartı.
   Kayıtlı olmayan bölümün kartı "yakında" görünür; CD.kaydet sonradan gelirse kart canlanır. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const $ = (s, k) => (k || document).querySelector(s);

  /* ---------------------------------------------------------------- bölüm kartları: ad, açıklama, kendi renginde SVG logo */
  const KART = {
    pittiksu: { ad: 'Pıttıksu', aciklama: 'Okşa, oyna, fotoğraf ekle; mama ve kilo takibi.', renk: '--goz', genis: true,
      ikon: '<svg viewBox="0 0 64 64"><path d="M12 30 8 8l16 12zM52 30l4-22-16 12z" fill="var(--pittiksu-tuy)"/><path d="M14 26 12 15l9 7zM50 26l2-11-9 7z" fill="var(--pittiksu-kulak)"/><circle cx="32" cy="36" r="24" fill="var(--pittiksu-tuy)"/><ellipse cx="23" cy="36" rx="5.2" ry="6" fill="var(--pittiksu-goz)"/><ellipse cx="41" cy="36" rx="5.2" ry="6" fill="var(--pittiksu-goz)"/><ellipse cx="23" cy="37" rx="2.2" ry="4" fill="var(--pittiksu-goz-koyu)"/><ellipse cx="41" cy="37" rx="2.2" ry="4" fill="var(--pittiksu-goz-koyu)"/><circle cx="21.5" cy="33.5" r="1.6" fill="#fff"/><circle cx="39.5" cy="33.5" r="1.6" fill="#fff"/><path d="M29.5 45h5L32 47.6z" fill="var(--pittiksu-burun)"/><path d="M32 47.6v2.4m0 0c-1.6 2.4-4 2.4-5 .8m5-.8c1.6 2.4 4 2.4 5 .8" stroke="var(--pixel-cizgi)" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M6 42h11M5 47h12M47 42h11M47 47h12" stroke="var(--pittiksu-tuy-koyu)" stroke-width="1.2" stroke-linecap="round" opacity=".7"/><circle cx="15" cy="44" r="3.5" fill="var(--pittiksu-kulak)" opacity=".6"/><circle cx="49" cy="44" r="3.5" fill="var(--pittiksu-kulak)" opacity=".6"/></svg>' },
    barbie: { ad: 'Barbie', aciklama: 'Okşa, top at, fotoğraf ekle; mama ve tımar takibi.', renk: '--seker-bal',
      ikon: '<svg viewBox="0 0 64 64"><path d="M12 28 10 8l14 10zM52 28l2-20-14 10z" fill="var(--barbie-tuy,#F3DFBC)" stroke="#3B2A3A" stroke-width="2" stroke-linejoin="round"/><path d="M14 24l-1-9 7 5zM50 24l1-9-7 5z" fill="#F2B8C6"/><circle cx="32" cy="34" r="23" fill="var(--barbie-tuy,#F3DFBC)" stroke="#3B2A3A" stroke-width="2"/><ellipse cx="23" cy="32" rx="4.6" ry="5.4" fill="#231C18"/><ellipse cx="41" cy="32" rx="4.6" ry="5.4" fill="#231C18"/><circle cx="21.4" cy="29.8" r="1.7" fill="#fff"/><circle cx="39.4" cy="29.8" r="1.7" fill="#fff"/><ellipse cx="32" cy="41" rx="5" ry="3.6" fill="#4A3630"/><path d="M32 44.6v2.6m0 0c-2 2.6-5 2.6-6.2 1m6.2-1c2 2.6 5 2.6 6.2 1" stroke="#3B2A3A" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M28 48h8c0 3-1.8 5-4 5s-4-2-4-5z" fill="#F2B8C6"/><circle cx="15" cy="40" r="4" fill="#F2B8C6" opacity=".55"/><circle cx="49" cy="40" r="4" fill="#F2B8C6" opacity=".55"/><circle cx="54" cy="48" r="7" fill="var(--barbie-tuy,#F3DFBC)" stroke="#3B2A3A" stroke-width="2"/></svg>' },
    tirnak: { ad: 'Tırnak Salonu', aciklama: 'Şekil, renk, aurora krom, nail art.', renk: '--seker-kiraz',
      ikon: '<svg viewBox="0 0 64 64"><defs><linearGradient id="hubInci" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD6E4"/><stop offset=".35" stop-color="#E2F1FF"/><stop offset=".65" stop-color="#FFF7D9"/><stop offset="1" stop-color="#EADFFF"/></linearGradient></defs><path d="M20 58c-6-14-8-28-2-42 3-7 9-11 14-14 5 3 11 7 14 14 6 14 4 28-2 42z" fill="url(#hubInci)" stroke="var(--burun)" stroke-width="2" stroke-linejoin="round"/><path d="M24 30c2-7 5-11 8-15" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M46 14l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="var(--seker-bal)"/><path d="M12 22l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="var(--burun)"/></svg>' },
    petevi: { ad: 'Pet Evi', aciklama: 'Ayı, hayalet, tavşan ve arkadaşları tek evde.', renk: '--seker-seftali',
      ikon: '<svg viewBox="0 0 64 64" shape-rendering="crispEdges"><path d="M10 30 32 10l22 20v26H10z" fill="var(--kagit)" stroke="var(--pixel-cizgi)" stroke-width="2"/><path d="M4 32 32 6l28 26" fill="none" stroke="var(--burun)" stroke-width="6" stroke-linecap="square"/><rect x="26" y="38" width="12" height="18" fill="var(--marka-fiyonk)" stroke="var(--pixel-cizgi)" stroke-width="2"/><rect x="14" y="36" width="8" height="8" fill="var(--seker-gok)" stroke="var(--pixel-cizgi)" stroke-width="2"/><rect x="42" y="36" width="8" height="8" fill="var(--seker-gok)" stroke="var(--pixel-cizgi)" stroke-width="2"/><rect x="42" y="10" width="6" height="10" fill="var(--burun)" stroke="var(--pixel-cizgi)" stroke-width="2"/><path d="M30 48h4v2h-4z" fill="var(--pixel-cizgi)"/><path d="M18 24l2-2 2 2v2h-4z" fill="var(--seker-kiraz)"/></svg>' },
    angela: { ad: 'Angela', aciklama: 'Konuş, tiz sesle tekrar etsin; giydir, besle, uyut.', renk: '--seker-lavanta',
      ikon: '<svg viewBox="0 0 64 64"><path d="M12 30 9 8l16 10zM52 30l3-22-16 10z" fill="#fff" stroke="#E4D8E2" stroke-width="1.5"/><path d="M14 26l-1.5-11 9 6zM50 26l1.5-11-9 6z" fill="#F5C6D2"/><circle cx="32" cy="36" r="23" fill="#fff" stroke="#E4D8E2" stroke-width="1.5"/><ellipse cx="23" cy="36" rx="5.4" ry="6.2" fill="#63B7A5"/><ellipse cx="41" cy="36" rx="5.4" ry="6.2" fill="#63B7A5"/><ellipse cx="23" cy="37" rx="2.4" ry="4.2" fill="#1F2A36"/><ellipse cx="41" cy="37" rx="2.4" ry="4.2" fill="#1F2A36"/><circle cx="21.3" cy="33.6" r="1.7" fill="#fff"/><circle cx="39.3" cy="33.6" r="1.7" fill="#fff"/><path d="M16 30l3-2.4M18.5 28.6l2-3.2M47 30l-3-2.4M45.5 28.6l-2-3.2" stroke="#3B2A3A" stroke-width="1.4" stroke-linecap="round"/><path d="M29.5 45h5L32 47.5z" fill="#F0A5B8"/><path d="M32 47.5v2m0 0c-1.6 2.2-4 2.2-5 .8m5-.8c1.6 2.2 4 2.2 5 .8" stroke="#3B2A3A" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M8 12c5-5 9 1 6 5-3 3-8 0-6-5zm12 1c-5-5-9 1-6 5 3 3 8 0 6-5z" fill="var(--marka-fiyonk)" stroke="#E07EA0" stroke-width="1.2"/><circle cx="14" cy="14.5" r="2.4" fill="#E07EA0"/></svg>' },
    bahce: { ad: 'Bahçe', aciklama: 'Lilyum ve gül ek, sula, açmasını bekle.', renk: '--seker-yaprak',
      ikon: '<svg viewBox="0 0 64 64"><path d="M18 58c-3-10 0-18 5-18h18c5 0 8 8 5 18z" fill="#D9825E" stroke="#B5653F" stroke-width="1.5"/><path d="M16 40h32l-2 6H18z" fill="#C97050"/><path d="M32 40V22" stroke="var(--seker-yaprak)" stroke-width="3.5" stroke-linecap="round"/><path d="M32 34c-8 0-11-5-11-8 5 0 11 3 11 8zm0-6c8 0 11-5 11-8-5 0-11 3-11 8z" fill="var(--seker-yaprak)"/><g transform="translate(32 16)"><path d="M0 0C-4-4-7-11-3-16c2-3 5-2 3 1 2-3 5-2 3 1 3-3 6-1 3 3-1 4-4 8-6 11z" fill="#F29DBC" stroke="#DE4E88" stroke-width="1"/><path d="M0 0C4-4 7-11 3-16c-2-3-5-2-3 1-2-3-5-2-3 1-3-3-6-1-3 3 1 4 4 8 6 11z" fill="#FBD3E0" stroke="#DE4E88" stroke-width="1"/><circle r="2.2" fill="#B85C2B"/></g></svg>' },
    panda: { ad: 'Obur Panda', aciklama: 'Mantı, boba, mochi… karnı şişene kadar.', renk: '--seker-bal',
      ikon: '<svg viewBox="0 0 64 64"><circle cx="14" cy="16" r="8" fill="#2B2733"/><circle cx="50" cy="16" r="8" fill="#2B2733"/><circle cx="32" cy="32" r="22" fill="#fff" stroke="#E4D8E2" stroke-width="1.5"/><ellipse cx="23" cy="30" rx="6.5" ry="7.5" fill="#2B2733" transform="rotate(-14 23 30)"/><ellipse cx="41" cy="30" rx="6.5" ry="7.5" fill="#2B2733" transform="rotate(14 41 30)"/><circle cx="24" cy="30.5" r="2.4" fill="#fff"/><circle cx="40" cy="30.5" r="2.4" fill="#fff"/><ellipse cx="32" cy="40" rx="4" ry="2.6" fill="#2B2733"/><path d="M32 42.6v2.4m0 0c-2 2.6-5 2.6-6 1m6-1c2 2.6 5 2.6 6 1" stroke="#2B2733" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M50 44l6-12M52 40h6M48 48h6" stroke="var(--seker-yaprak)" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="42" r="3.2" fill="#F8B4C4" opacity=".8"/><circle cx="47" cy="42" r="3.2" fill="#F8B4C4" opacity=".8"/></svg>' },
    ofke: { ad: 'Öfke Odası', aciklama: 'Terliği kap, tabakları kır, sonra nefes al.', renk: '--ofke',
      ikon: '<svg viewBox="0 0 64 64"><path d="M16 50c-6-10-4-28 6-34 8-5 16 0 20 10 3 8 8 14 14 18 4 3 3 8-2 9H24c-4 0-6-1-8-3z" fill="#F29DBC" stroke="#C9567F" stroke-width="2" stroke-linejoin="round"/><path d="M20 24c6-4 12-2 16 4" fill="none" stroke="#C9567F" stroke-width="2" stroke-linecap="round"/><path d="M14 36c6 4 14 6 22 4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M46 8l3 8M52 12l-6 6M56 20l-8 0" stroke="var(--ofke)" stroke-width="2.6" stroke-linecap="round"/><path d="M6 14l4 4M4 24h6" stroke="var(--ofke)" stroke-width="2.4" stroke-linecap="round"/></svg>' },
    xox: { ad: 'XOX', aciklama: 'İkimiz sırayla oynayalım; hamleni yap, sırası ona geçsin.', renk: '--seker-gok',
      ikon: '<svg viewBox="0 0 64 64"><rect x="6" y="6" width="52" height="52" rx="12" fill="var(--kagit)" stroke="var(--pixel-cizgi,#3B2A3A)" stroke-width="2.5"/><path d="M24 8v48M40 8v48M8 24h48M8 40h48" stroke="var(--pixel-cizgi,#3B2A3A)" stroke-width="2.5" stroke-linecap="round" opacity=".5"/><path d="M16 20s-4-3-4-6 5-4 4 0c-1-4 4-3 4 0s-4 6-4 6z" fill="var(--seker-kiraz)"/><circle cx="48" cy="16" r="6.5" fill="none" stroke="var(--seker-gok,#8FCDFF)" stroke-width="4"/><path d="M32 36s-5-3.6-5-7.2 6-4.8 5 0c-1-4.8 5-3.6 5 0S32 36 32 36z" fill="var(--seker-kiraz)"/><circle cx="16" cy="48" r="6.5" fill="none" stroke="var(--seker-gok,#8FCDFF)" stroke-width="4"/><path d="M48 52s-5-3.6-5-7.2 6-4.8 5 0c-1-4.8 5-3.6 5 0S48 52 48 52z" fill="var(--seker-kiraz)"/></svg>' },
    bizim: { ad: 'Bizim Köşemiz', aciklama: 'İkimize dair küçük şeyler.', renk: '--seker-kiraz', genis: true,
      ikon: '<svg viewBox="0 0 64 64"><path d="M32 54S8 40 8 24c0-7 5-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 7 0 12 5 12 12 0 16-24 30-24 30z" fill="var(--seker-kiraz)" stroke="#C9567F" stroke-width="2" stroke-linejoin="round"/><path d="M18 20c-3 1-5 4-5 7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/><path d="M42 8l1.5 3.6 3.6 1.5-3.6 1.5L42 18.2l-1.5-3.6-3.6-1.5 3.6-1.5z" fill="var(--seker-bal)"/><path d="M54 30l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="var(--seker-bal)"/></svg>' }
  };
  const SIRA = CD.BOLUM_SIRASI || ['pittiksu', 'barbie', 'tirnak', 'petevi', 'angela', 'bahce', 'panda', 'ofke', 'xox', 'bizim'];

  function kartYap(id, i) {
    const k = KART[id]; if (!k) return null;
    // config.js YAPIM_ASAMASINDA listesi kartı kapatır; test için adrese ?hepsi=1 eklenince kilit kalkar
    const yapimda = !/[?&]hepsi/.test(location.search) && ((CD.config || {}).YAPIM_ASAMASINDA || []).includes(id);
    const hazir = !!CD.bolumler[id] && !yapimda;
    const kok = hazir ? CD.el('a.yama.dokun.hub-kart', { href: '#/' + id }) : CD.el('div.yama.hub-kart.yakinda', { 'aria-disabled': 'true' });
    kok.dataset.bolum = id; kok.style.setProperty('--i', i); kok.style.setProperty('--kart-renk', 'var(' + k.renk + ')');
    if (k.genis) kok.classList.add('genis');
    kok.append(
      CD.el('span.hub-kart-ikon', { 'aria-hidden': 'true', html: k.ikon }),
      CD.el('span.hub-kart-metin', [
        CD.el('h2.hub-kart-ad', k.ad),
        CD.el('p.hub-kart-aciklama', hazir ? k.aciklama : 'Bu oda yapım aşamasında; çok yakında açılıyor.'),
        hazir ? CD.el('span.hub-kart-ipucu', { data: { ipucu: id } }) : CD.el('span.rozet.gri.hub-kart-rozet', 'yapım aşamasında')
      ])
    );
    // Bizim Köşemiz: köşede küçük, hafif eğik bir polaroid (ikimiz)
    if (id === 'bizim') {
      const img = CD.el('img', { src: (window.GIZLI ? window.GIZLI.url('assets/bizim/ikimiz-thumb.jpg') : 'assets/bizim/ikimiz-thumb.jpg'), alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' });
      img.addEventListener('error', () => { const p = img.closest('.hub-kart-polaroid'); if (p) p.remove(); });
      kok.appendChild(CD.el('span.hub-kart-polaroid', { 'aria-hidden': 'true' }, [CD.el('span.hub-kart-bant'), CD.el('span.hub-kart-foto', [img])]));
    }
    if (hazir) kok.addEventListener('click', () => CD.ses.pop());
    else kok.addEventListener('click', () => CD.toast(k.ad + ' hazırlanıyor, az kaldı 🧶'));
    return kok;
  }
  function kartlariKur() {
    const kap = $('#hubKartlar'); if (!kap) return;
    kap.innerHTML = '';
    SIRA.forEach((id, i) => { const k = kartYap(id, i); if (k) kap.appendChild(k); });
    ipuclari();
  }
  function ipuclari() {
    SIRA.forEach(id => {
      const e = $('.hub-kart-ipucu[data-ipucu="' + id + '"]'); if (!e) return;
      let m = CD.depo.alan(id).al('ipucu', '');
      if (typeof m !== 'string') m = '';
      e.textContent = m; e.hidden = !m;
    });
  }
  function canlandir() {
    const hub = $('#hub'); if (!hub || CD.azHareket) return;
    hub.classList.remove('canlandi'); void hub.offsetWidth; hub.classList.add('canlandi');
  }

  /* ---------------------------------------------------------------- selam */
  const SELAMLAR = [[6, 12, 'Günaydın Cemre', 'Pıttıksu erkenden uyanmış, seni bekliyor.'], [12, 18, 'İyi günler Cemre', 'Bugün ne oynuyoruz?'], [18, 23, 'İyi akşamlar Cemre', 'Battaniye hazır, Pıttıksu kucakta.'], [23, 24, 'Hâlâ uyumadın mı Cemre?', 'Pıttıksu da uyumuyor, iyi ki varsın.'], [0, 6, 'Hâlâ uyumadın mı Cemre?', 'Pıttıksu da uyumuyor, iyi ki varsın.']];
  function selam() {
    const s = new Date().getHours();
    const sec = SELAMLAR.find(a => s >= a[0] && s < a[1]) || SELAMLAR[0];
    const h = $('#hubSelam'), p = $('#hubAltSelam'); if (h) h.textContent = sec[2]; if (p) p.textContent = sec[3];
  }

  /* ---------------------------------------------------------------- battaniyede uyuyan Pıttıksu (küçük SVG; tam sürüm Pıttıksu bölümünde) */
  const SOZLER = ['mırr… bugün 3 kere esnedim', 'Cemre benim insanım', 'pembe battaniye = krallığım', 'patim minik, kalbim kocaman', 'bir daha okşa?', 'rüyamda yumak gördüm', 'mırr… seni bekledim', 'kucak vakti mi?', 'gözlerim mavi-gri, fark ettin mi?', 'BITCH!', 'mırr… bu okşama 10/10'];
  const KEDI_SVG = '<svg class="hub-kedi-svg" viewBox="0 0 220 120" role="img" aria-label="Pıttıksu battaniyede uyuyor; dokununca bir şey söyler" tabindex="0">' +
    '<ellipse cx="110" cy="104" rx="96" ry="12" fill="var(--battaniye-koyu)" opacity=".55"/>' +
    '<g class="hub-kedi-govde"><path d="M40 98c-10-22 4-52 40-56 24-3 44 8 60 6 22-3 40 10 40 30 0 14-10 22-26 22H58c-8 0-14-2-18-2z" fill="var(--pittiksu-tuy)"/>' +
    '<path d="M58 96c-8-14 0-30 18-34" stroke="var(--pittiksu-tuy-acik)" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>' +
    '<path d="M176 92c14-2 22-14 14-26-4-6-12-6-16-2" stroke="var(--pittiksu-tuy-koyu)" stroke-width="12" stroke-linecap="round" fill="none"/>' +
    '<g class="hub-kedi-kafa"><path d="M62 52 50 22l26 14zM128 52l14-30-28 14z" fill="var(--pittiksu-tuy)"/><path d="M64 46l-7-16 15 9zM126 46l7-16-15 9z" fill="var(--pittiksu-kulak)"/>' +
    '<ellipse cx="95" cy="66" rx="40" ry="32" fill="var(--pittiksu-tuy)"/><ellipse cx="95" cy="80" rx="22" ry="12" fill="var(--pittiksu-tuy-acik)" opacity=".5"/>' +
    '<g class="hub-kedi-goz-kapali"><path d="M72 66c4-4 10-4 14 0M104 66c4-4 10-4 14 0" stroke="var(--pixel-cizgi)" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>' +
    '<g class="hub-kedi-goz-acik" opacity="0"><ellipse cx="79" cy="66" rx="6" ry="7" fill="var(--pittiksu-goz)"/><ellipse cx="111" cy="66" rx="6" ry="7" fill="var(--pittiksu-goz)"/><ellipse cx="79" cy="67" rx="2.6" ry="4.8" fill="var(--pittiksu-goz-koyu)"/><ellipse cx="111" cy="67" rx="2.6" ry="4.8" fill="var(--pittiksu-goz-koyu)"/><circle cx="77" cy="63" r="1.8" fill="#fff"/><circle cx="109" cy="63" r="1.8" fill="#fff"/></g>' +
    '<path d="M91 76h8l-4 3.6z" fill="var(--pittiksu-burun)"/><path d="M95 79.6v3m0 0c-2 2.6-5 2.6-6 1m6-1c2 2.6 5 2.6 6 1" stroke="var(--pixel-cizgi)" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M56 74h16M54 80h17M118 74h16M119 80h17" stroke="var(--pittiksu-tuy-koyu)" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>' +
    '<circle cx="66" cy="76" r="5" fill="var(--pittiksu-kulak)" opacity=".55"/><circle cx="124" cy="76" r="5" fill="var(--pittiksu-kulak)" opacity=".55"/></g>' +
    '<path d="M60 98h96c6 0 10 2 10 6H50c0-4 4-6 10-6z" fill="var(--battaniye-acik)" opacity=".9"/><path d="M52 104h114" stroke="var(--battaniye-koyu)" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/></g>' +
    '<g class="hub-kedi-zzz" aria-hidden="true"><text x="150" y="40" font-family="var(--yazi-baslik)" font-size="16" font-weight="800" fill="var(--murekkep-2)">z</text><text x="162" y="26" font-family="var(--yazi-baslik)" font-size="12" font-weight="800" fill="var(--murekkep-2)">z</text></g></svg>';
  function kediKur() {
    const kap = $('#hubKedi'); if (!kap) return;
    const svg = CD.svg(KEDI_SVG);
    kap.insertBefore(svg, kap.firstChild);
    let uyanikT = null, kalpT = 0;
    const soyle = (e) => {
      const b = $('#hubBalon'); if (!b) return;
      b.textContent = CD.rastgele(SOZLER); b.classList.add('goster');
      svg.classList.add('uyanik'); CD.ses.minikMiyav(); CD.ses.mirrKisa(1200);
      const r = svg.getBoundingClientRect();
      CD.efekt.kalp(e && e.clientX ? e.clientX : r.left + r.width / 2, e && e.clientY ? e.clientY : r.top + r.height / 2, 4);
      clearTimeout(uyanikT); uyanikT = setTimeout(() => { b.classList.remove('goster'); svg.classList.remove('uyanik'); }, 2800);
      kalpT++;
    };
    svg.addEventListener('pointerdown', soyle);
    svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); soyle(); } });
  }
  function yildizlar() {
    const k = $('.hub-yildizlar'); if (!k || k.children.length) return;
    const R = (n) => Math.random() * n;
    for (let i = 0; i < 10; i++) { const s = document.createElement('i'); s.style.left = (3 + R(94)) + '%'; s.style.top = R(100) + '%'; s.style.opacity = (.5 + R(.5)).toFixed(2); k.appendChild(s); }
  }

  /* ---------------------------------------------------------------- ses / hava düğmeleri */
  function dugmeler() {
    const ses = $('#sesDugme'), hava = $('#havaDugme');
    const sesG = () => { if (!ses) return; ses.textContent = CD.ses.acik ? '🔈' : '🔇'; ses.setAttribute('aria-pressed', CD.ses.acik ? 'true' : 'false'); ses.setAttribute('aria-label', CD.ses.acik ? 'Sesi kapat' : 'Sesi aç'); };
    const havaG = () => { if (!hava) return; const g = CD.hava === 'gece'; hava.textContent = g ? '☀️' : '🌙'; hava.setAttribute('aria-pressed', g ? 'true' : 'false'); hava.setAttribute('aria-label', g ? 'Gündüze geç' : 'Geceye geç'); };
    if (ses) ses.addEventListener('click', () => { CD.ses.ac(!CD.ses.acik); sesG(); if (CD.ses.acik) CD.ses.pop(); });
    if (hava) hava.addEventListener('click', CD.havaDegistir);
    CD.olay.dinle('ses', sesG); CD.olay.dinle('hava', havaG);
    sesG(); havaG();
  }

  /* ---------------------------------------------------------------- ana ekrana ekle */
  function kurulum() {
    const k = $('#kurulumKarti'); if (!k) return;
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (standalone || CD.depo.al('kurulum.kapali', false) || location.protocol === 'file:') return;
    const ios = /apple/i.test(navigator.vendor || '') && ('ontouchend' in document);
    const m = $('#kurulumMetin');
    if (m) m.textContent = ios ? 'Safari\'de Paylaş düğmesi → "Ana Ekrana Ekle" dersen Pıttıksu hep bir dokunuş uzakta olur.' : 'Tarayıcı menüsünden "Ana ekrana ekle" dersen Pıttıksu hep bir dokunuş uzakta olur.';
    k.hidden = false;
    const kapat = $('#kurulumKapat'); if (kapat) kapat.addEventListener('click', () => { k.hidden = true; CD.depo.yaz('kurulum.kapali', true); });
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); CD.kurulumIstegi = e;
      if (m) m.textContent = 'Dokun: Pıttıksu ana ekranına yerleşsin.'; k.style.cursor = 'pointer';
      k.addEventListener('click', ev => { if (ev.target.id === 'kurulumKapat') return; try { e.prompt(); } catch (err) {} });
    });
  }

  /* ---------------------------------------------------------------- dolaşan petler */
  let motor = null;
  function petler() {
    if (!CD.PetMotor || !window.CD_PETLER_MIRAS) return;
    motor = CD.PetMotor({ sabit: true, tunekSecici: '#hubKartlar .hub-kart', sozler: ['♥', 'ponçik!', 'hehe', 'Cemre ♥', 'zıp!', 'beni fırlat!', 'yumuşacık', 'gezmece!', 'burası güzelmiş', 'mırr', 'battaniye!', 'hangi odaya gidiyoruz?'] });
    motor.katman.id = 'hubPetKatmani';
    const w = innerWidth; const say = w < 600 ? 4 : (w < 900 ? 5 : 7);
    const cfg = (CD.config && CD.config.PETLER) || {};
    const gun = Math.floor(Date.now() / 86400000);
    const hepsi = CD.petListesi().filter(p => p.id !== 'pittiksu');
    const liste = [hepsi[0]].concat(hepsi.slice(1).map((p, i, a) => a[(gun + i) % a.length])).filter((p, i, a) => a.indexOf(p) === i).slice(0, say);
    liste.forEach((s, i) => motor.ekle(s, { x: 20 + (w - 100) * (liste.length > 1 ? i / (liste.length - 1) : .5), ad: cfg[s.id] && cfg[s.id].AD }));
    CD.hubMotor = motor;
    const hubdaMi = () => !$('#hub').hidden && !document.body.classList.contains('giris-acik');
    const guncelle = () => motor.goster(hubdaMi());
    CD.olay.dinle('hub:acildi', guncelle); CD.olay.dinle('bolum:acildi', guncelle);
    CD.olay.dinle('giris:basladi', guncelle); CD.olay.dinle('giris:bitti', () => { guncelle(); setTimeout(() => motor.sevin(), 500); });
    guncelle();
  }

  /* ---------------------------------------------------------------- kur */
  CD.hazir(() => {
    selam(); kartlariKur(); yildizlar(); kediKur(); dugmeler(); kurulum(); petler();
    const buket = $('#buketDugme'), not = $('#notDugme');
    if (buket) buket.addEventListener('click', () => { CD.ses.pop(); if (CD.giris) CD.giris.buketGoster(); });
    if (not) not.addEventListener('click', () => { CD.ses.pop(); if (CD.giris) CD.giris.notGoster(); });
    CD.olay.dinle('kaydet', () => { kartlariKur(); });
    CD.olay.dinle('hub:acildi', () => { selam(); ipuclari(); if (!document.body.classList.contains('giris-acik')) canlandir(); });
    CD.olay.dinle('giris:bitti', () => { selam(); ipuclari(); canlandir(); });
    setInterval(selam, 60000);
    if (!document.body.classList.contains('giris-acik')) canlandir();
  });
})();
