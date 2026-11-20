/* js/oyun/ciz.js — Çiz ve Tahmin Et (Oyun Salonu alt modülü · V2 Faz 2 · 5)
   Biri çizer, öbürü tahmin eder; çizgiler CD.canli.oda('ciz') ile anlık gider (CD.tuval). Kelime YALNIZ çizenin telefonunda durur;
   tahmin edene yalnız harf sayısı gider, doğru/yanlış kararını çizenin telefonu verir.
   Kelimeler aşağıda (130+); config.js → OYUN_KELIMELERI: ["…"] ile genişletilir. Birlikte bilinen kelime sayısı kişinin kendi
   anahtarında (cd.oyun.ciz.<kim>). Bulut yoksa aynı telefonda: çizen kelimeye gizlice bakar, öbürü sesli tahmin eder. */
(() => {
  'use strict';
  const OID = 'ciz', SURE = 90;
  const KELIMELER = [
    'kedi', 'köpek', 'tavşan', 'kaplumbağa', 'penguen', 'ayıcık', 'tilki', 'baykuş', 'kirpi', 'balina', 'ahtapot', 'denizanası', 'kelebek', 'uğur böceği', 'arı',
    'salyangoz', 'zürafa', 'fil', 'panda', 'koala', 'flamingo', 'ördek', 'civciv', 'yunus', 'balık', 'kuzu', 'sincap', 'hamster', 'papağan', 'kuğu',
    'çilek', 'kiraz', 'karpuz', 'muz', 'elma', 'armut', 'ananas', 'limon', 'üzüm', 'avokado', 'havuç', 'mantar', 'mısır', 'patlıcan', 'domates',
    'pasta', 'kurabiye', 'dondurma', 'kek', 'şeker', 'lolipop', 'çikolata', 'pizza', 'hamburger', 'simit', 'mantı', 'çay', 'kahve', 'süt', 'bal',
    'gökkuşağı', 'bulut', 'güneş', 'ay', 'yıldız', 'şimşek', 'kar tanesi', 'yağmur', 'şemsiye', 'kardan adam', 'çiçek', 'lale', 'gül', 'lilyum', 'papatya',
    'ağaç', 'kaktüs', 'yaprak', 'deniz kabuğu', 'dağ', 'ev', 'kale', 'köprü', 'deniz feneri', 'çadır', 'balon', 'uçurtma', 'gemi', 'uçak', 'roket',
    'bisiklet', 'araba', 'tren', 'otobüs', 'kaykay', 'kalp', 'fiyonk', 'taç', 'yüzük', 'gözlük', 'şapka', 'çorap', 'eldiven', 'atkı', 'elbise',
    'terlik', 'çanta', 'ruj', 'oje', 'ayna', 'tarak', 'diş fırçası', 'yastık', 'battaniye', 'mum', 'saat', 'anahtar', 'kilit', 'mektup', 'zarf',
    'hediye', 'kitap', 'kalem', 'makas', 'gitar', 'piyano', 'davul', 'mikrofon', 'kulaklık', 'telefon', 'kamera', 'televizyon', 'lamba', 'yumak',
    'top', 'oyuncak ayı', 'robot', 'hayalet', 'ejderha', 'deniz kızı', 'peri', 'sihirli değnek', 'korsan', 'hazine sandığı', 'uzaylı', 'gezegen', 'palyaço', 'bebek arabası', 'salıncak'
  ];
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="10" width="40" height="40" rx="4" fill="var(--kagit,#FFFDF9)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3"/><path d="M16 38c4-10 8-14 12-6s8 2 12-8" fill="none" stroke="var(--seker-kiraz,#FF9DB4)" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="44" r="10" fill="var(--seker-limon,#FFE28A)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3"/><text x="50" y="49" text-anchor="middle" font-size="13" font-weight="800" fill="#3B2A3A">?</text></svg>';
  const A = () => CD.oyunAg;
  let ctx = null, kok = null, oda = null, tv = null;
  const ui = {}, cozler = [];
  let tur = null;          // { no, cizen, kelime (yalnız çizende), uzunluk, bas, bitti, tahminler:[] }
  let sayT = 0, gizleT = 0;

  function liste() {
    const ek = ((CD.config || {}).OYUN_KELIMELERI || []).map(x => String(x || '').trim()).filter(x => x && x.length <= 30);
    return [...new Set(KELIMELER.concat(ek))];
  }
  function kelimeSec() {
    const l = liste(); const son = CD.depo.al('cihaz.ciz.son', []); const kullanilan = new Set(Array.isArray(son) ? son : []);
    let aday = l.filter(k => !kullanilan.has(k)); if (!aday.length) aday = l;
    const k = aday[Math.floor(Math.random() * aday.length)];
    CD.depo.yaz('cihaz.ciz.son', [...kullanilan, k].slice(-Math.min(60, Math.floor(l.length * 0.6))));
    return k;
  }
  const norm = (s) => String(s || '').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const bosluksuz = (s) => norm(s).replace(/ /g, '');
  const kalipUz = (u) => (Array.isArray(u) ? u : [u]).map(n => Array(n).fill('_').join(' ')).join('   ');
  const parcaUz = (k) => String(k).split(' ').map(p => p.length);
  const puanAnahtar = () => 'oyun.ciz.' + (A().ben() || 'tek');
  const puan = () => { const v = CD.depo.al(A().ben() ? puanAnahtar() : 'cihaz.ciz.tek', null); return (v && Number(v.puan)) || 0; };
  function puanEkle() { const k = A().ben() ? puanAnahtar() : 'cihaz.ciz.tek'; CD.depo.yaz(k, { puan: puan() + 1, t: Date.now() }); }
  const cevrim = () => !!(!A().tek() && CD.canli && CD.canli.bagli);
  const benCizer = () => !!(tur && !tur.bitti && (A().tek() || tur.cizen === A().ben()));

  /* ------------------------------------------------------------ arayüz */
  function kur(el) {
    const e = ctx.el;
    ui.durum = e('p.baslik.baslik-lg.oyun-durum', { role: 'status', 'aria-live': 'polite' });
    ui.alt = e('p.sessiz.oyun-durum-alt');
    ui.kelime = e('p.ciz-kelime', { 'aria-live': 'polite' });
    ui.sure = e('span.rozet.ciz-sure', { hidden: true });
    ui.goster = e('button.dugme-hayalet.kucuk', { type: 'button', hidden: true, onclick: () => { ui.kelime.classList.toggle('gizli'); ui.goster.textContent = ui.kelime.classList.contains('gizli') ? '👀 Kelimeyi göster' : '🙈 Gizle'; } }, '🙈 Gizle');
    ui.canvas = e('canvas.tahta-tuval.ciz-tuval', { role: 'img', 'aria-label': 'Çizim alanı' });
    ui.renk = e('div.ornekler.ciz-renkler', { role: 'radiogroup', 'aria-label': 'Kalem rengi' }, [['#3B2A3A', 'Mürekkep'], ['#FF7A9A', 'Pembe'], ['#6F97AC', 'Gök'], ['#7CCB9A', 'Yaprak'], ['#F5B54A', 'Bal'], ['#FFFDF9', 'Silgi']].map(([r, ad], i) =>
      e('button.ornek' + (i === 0 ? '.secili' : ''), { type: 'button', role: 'radio', 'aria-checked': i === 0 ? 'true' : 'false', 'aria-label': ad, style: '--renk:' + r, onclick: (ev) => { tv.renk = r; tv.kalin = r === '#FFFDF9' ? 34 : 12; ui.renk.querySelectorAll('.ornek').forEach(b => { const s = b === ev.currentTarget; b.classList.toggle('secili', s); b.setAttribute('aria-checked', s ? 'true' : 'false'); }); } })));
    ui.tahminKutu = e('input.girdi.ciz-girdi', { type: 'text', maxlength: '40', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'send', placeholder: 'Tahminin…', 'aria-label': 'Tahminin' });
    ui.tahminD = e('button.dugme', { type: 'button' }, 'Tahmin et');
    ui.tahminForm = e('form.satir.ciz-tahmin', { hidden: true }, [ui.tahminKutu, ui.tahminD]);
    ui.tahminForm.addEventListener('submit', (ev) => { ev.preventDefault(); tahminEt(); });
    ui.tahminD.addEventListener('click', (ev) => { ev.preventDefault(); tahminEt(); });
    ui.tahminler = e('ul.ciz-tahminler', { 'aria-label': 'Tahminler' });
    ui.eylem = e('div.satir.ciz-eylem');
    ui.skor = e('p.oyun-skor');
    el.appendChild(e('div.icerik.oyun-icerik.ciz-icerik', [
      e('div.yama.oyun-durum-kart', [e('div.satir.arasi', [ui.durum, ui.sure]), ui.alt, e('div.satir.ciz-kelime-satir', [ui.kelime, ui.goster])]),
      ui.renk,
      e('div.tahta-cerceve.ciz-cerceve', [ui.canvas]),
      ui.tahminForm, ui.eylem, ui.tahminler,
      e('div.yama.siki.oyun-skor-kart', [ui.skor])
    ]));
    tv = CD.tuval(ui.canvas, { boyut: 600, zemin: '#FFFDF9', izin: benCizer, gonder: (p) => { if (oda) oda.gonder('c', p); } });
  }
  function dugmeler(list) {
    const imza = list.filter(Boolean).map(x => x[0]).join('|'); if (ui.eylem.dataset.k === imza) return; ui.eylem.dataset.k = imza;   // her saniye yeniden kurulup odak kaybolmasın
    ui.eylem.innerHTML = ''; list.filter(Boolean).forEach(([ad, fn, birincil]) => ui.eylem.appendChild(ctx.el(birincil ? 'button.dugme' : 'button.dugme-ikincil', { type: 'button', onclick: fn }, ad))); }

  function ciz() {
    if (!ctx) return;
    const tek = A().tek(), ben = A().ben(), k = A().karsi();
    const burada = cevrim() && oda && oda.burada();
    const cizer = benCizer();
    ui.renk.hidden = !cizer;
    ui.canvas.classList.toggle('kilitli', !cizer);
    ui.tahminForm.hidden = !(tur && !tur.bitti && !tek && !cizer);
    ui.goster.hidden = !(cizer && tur && tur.kelime);
    ui.sure.hidden = !(tur && !tur.bitti);
    ui.skor.textContent = 'Birlikte bildiğiniz kelime: ' + puan() + ' ✨';
    let m = '', a = '', kel = '';
    if (!tur || tur.bitti) {
      if (tur && tur.bitti) { m = tur.dogru ? 'Bildi! 🎉' : 'Kelime: ' + (tur.kelime || ''); kel = tur.kelime ? '"' + tur.kelime + '"' : ''; }
      else m = 'Çiz ve Tahmin Et 🎨';
      if (tek) { a = 'Bulut kapalı: biri gizlice kelimeye bakıp çizer, öbürü sesli tahmin eder.'; dugmeler([['✏️ Yeni kelime çiz', () => turBaslat(), true]]); }
      else if (!cevrim()) { a = 'Bu oyun için ikinizin de şu an bağlı olması gerek; bağlantı bekleniyor…'; dugmeler([]); }
      else if (!burada) { a = k ? CD.ek.i(A().adi(k)) + ' bekliyorsun; o da Oyun Salonu’nda bu oyunu açınca başlarsınız.' : ''; dugmeler([['📮 Onu çağır', () => { A().posta(OID, 'seni çizmeye çağırıyor'); ctx.toast('Çağrı gitti 📮'); }, false]]); }
      else { a = (tur && tur.bitti ? 'Sıra değişti. ' : '') + 'Kim çizecek?'; dugmeler([['✏️ Ben çizeyim', () => turBaslat(), true]]); }
    } else if (cizer) {
      m = 'Sen çiziyorsun ✏️'; kel = tur.kelime;
      a = tek ? 'O sesli tahmin etsin; bilince "Bildi" de.' : CD.ek.nin(A().adi(k)) + ' tahminleri aşağıda belirir.';
      dugmeler([tek ? ['✅ Bildi', () => turBitir(true, A().ben() || 'tek'), true] : null, ['🧽 Temizle', () => { tv.temizle(); if (oda) oda.gonder('temizle', null); }, false], ['⏭ Pas', () => turBitir(false, null), false]]);
    } else {
      m = A().adi(tur.cizen) + ' çiziyor…'; kel = kalipUz(tur.uzunluk); a = 'Tahminini yaz; harf sayısı ipucu.';
      dugmeler([]);
    }
    ui.durum.textContent = m; ui.alt.textContent = a;
    if (ui.kelime.dataset.k !== kel) { ui.kelime.dataset.k = kel; ui.kelime.textContent = kel; }
    tahminCiz();
    sureCiz();
  }
  function tahminCiz() {
    ui.tahminler.innerHTML = '';
    ((tur && tur.tahminler) || []).slice(-8).reverse().forEach(t => ui.tahminler.appendChild(ctx.el('li.ciz-tahmin-oge' + (t.dogru ? '.dogru' : ''), (t.dogru ? '✅ ' : '💭 ') + t.metin)));
  }
  function kalan() { return tur && !tur.bitti ? Math.max(0, SURE - Math.floor((Date.now() - tur.bas) / 1000)) : 0; }
  function sureCiz() {
    if (!tur || tur.bitti) return;
    const s = kalan(); ui.sure.textContent = '⏱ ' + s + ' sn';
    if (s <= 0 && benCizer()) turBitir(false, null, 'sure');
  }

  /* ------------------------------------------------------------ tur akışı */
  function turBaslat() {
    const kelime = kelimeSec();
    tur = { no: ((tur && tur.no) || 0) + 1, cizen: A().ben() || 'tek', kelime, uzunluk: parcaUz(kelime), bas: Date.now(), bitti: false, tahminler: [] };
    tv.temizle();
    if (oda) { oda.gonder('temizle', null); oda.gonder('tur', { no: tur.no, cizen: tur.cizen, uzunluk: tur.uzunluk, bas: tur.bas }); }
    ctx.ses.pop();
    ui.kelime.classList.remove('gizli'); ui.goster.textContent = '🙈 Gizle';
    if (A().tek()) { clearTimeout(gizleT); gizleT = setTimeout(() => { if (ui.kelime) { ui.kelime.classList.add('gizli'); ui.goster.textContent = '👀 Kelimeyi göster'; } }, 4000); }
    ciz();
  }
  function turBitir(dogru, bilen, neden) {
    if (!tur || tur.bitti) return;
    tur.bitti = true; tur.dogru = !!dogru;
    CD.pul && CD.pul('oyun', { kisa: 'ciz', kazanan: dogru ? 'birlikte' : null });
    if (dogru) { puanEkle(); ctx.ses.zafer(); ctx.efekt.konfeti(undefined, undefined, 16); }
    else ctx.ses.uf();
    if (oda) oda.gonder('bitti', { no: tur.no, kelime: tur.kelime, dogru: !!dogru, neden: neden || (dogru ? 'bildi' : 'pas') });
    if (!dogru) ctx.toast(neden === 'sure' ? 'Süre doldu ⏱ Kelime: ' + tur.kelime : 'Pas geçildi. Kelime: ' + tur.kelime, 2600);
    ciz();
  }
  function tahminEt() {
    const v = String(ui.tahminKutu.value || '').trim().slice(0, 40);
    if (!v || !tur || tur.bitti || !oda) return;
    ui.tahminKutu.value = '';
    oda.gonder('tahmin', { no: tur.no, metin: v });
    tur.tahminler.push({ metin: v, dogru: false }); tahminCiz();
    ctx.ses.tik();
  }
  function gelen(t, v) {
    if (!ctx) return;
    if (t === 'c') { if (tur && !tur.bitti && tur.cizen !== A().ben()) tv.uygula(v); return; }
    if (t === 'temizle') { if (!benCizer()) tv.temizle(); return; }
    if (t === 'kopya') { if (!benCizer() && v) tv.resim(v); return; }
    if (t === 'tur' && v) { tur = { no: Number(v.no) || 1, cizen: v.cizen === 'ahmet' ? 'ahmet' : 'cemre', kelime: null, uzunluk: (Array.isArray(v.uzunluk) ? v.uzunluk : [Number(v.uzunluk) || 0]).map(n => Math.max(0, Math.min(30, Number(n) || 0))).slice(0, 6), bas: Number(v.bas) || Date.now(), bitti: false, tahminler: [] }; tv.temizle(); ctx.ses.pop(); ciz(); return; }
    if (t === 'tahmin' && v && benCizer() && tur && v.no === tur.no) {
      const dogru = bosluksuz(v.metin) === bosluksuz(tur.kelime);
      const metin = String(v.metin || '').slice(0, 40);
      tur.tahminler.push({ metin, dogru });
      oda.gonder('sonuc', { no: tur.no, metin, dogru });
      if (dogru) turBitir(true, A().karsi()); else { tahminCiz(); ctx.ses.tik(); }
      return;
    }
    if (t === 'sonuc' && v && tur && v.no === tur.no) { const s = tur.tahminler.find(x => x.metin === v.metin && !x.isaret); if (s) { s.dogru = !!v.dogru; s.isaret = true; } tahminCiz(); if (!v.dogru) ctx.ses.uf(); return; }
    if (t === 'bitti' && v && tur && v.no === tur.no && !tur.bitti) {
      tur.bitti = true; tur.dogru = !!v.dogru; tur.kelime = String(v.kelime || '').slice(0, 30);
      if (v.dogru) { puanEkle(); ctx.ses.zafer(); ctx.efekt.konfeti(undefined, undefined, 16); ctx.toast('Bildin! Kelime: ' + tur.kelime + ' 🎉', 2600); }
      else ctx.toast((v.neden === 'sure' ? 'Süre doldu. ' : 'Pas geçildi. ') + 'Kelime: ' + tur.kelime, 2600);
      ciz(); return;
    }
    if (t === '_geldi') {
      // sonradan gelen: süren turu ve çizimin kopyasını yolla
      if (benCizer() && !A().tek()) { oda.gonder('tur', { no: tur.no, cizen: tur.cizen, uzunluk: tur.uzunluk, bas: tur.bas }); const d = tv.dataUrl(400, 120000); if (d && tv.kirli) setTimeout(() => oda && oda.gonder('kopya', d), 200); }
      ciz(); return;
    }
    if (t === '_gitti') { if (tur && !tur.bitti && !benCizer()) { tur.bitti = true; tur.dogru = false; ctx.toast('Bağlantı koptu; tur bitti'); } ciz(); }
  }

  (CD.oyunlar = CD.oyunlar || {})[OID] = {
    id: OID, ad: 'Çiz ve Tahmin Et', aciklama: 'Biri çizer, öbürü bilmeye çalışır.', sira: 4, ikon: IKON,
    durum() { const p = puan(); return p ? 'Birlikte ' + p + ' kelime bildiniz' : ''; },
    mount(el, c) {
      ctx = c; kok = el; tur = null;
      kur(el);
      if (!A().tek() && CD.canli) oda = CD.canli.oda(OID, gelen);
      sayT = setInterval(() => { sureCiz(); if (!tur || tur.bitti) ciz(); }, 1000);
      cozler.push(ctx.olay.dinle('canli:baglanti', () => ciz()));
      cozler.push(ctx.olay.dinle('kim', () => ciz()));
      ciz();
    },
    unmount() {
      clearInterval(sayT); clearTimeout(gizleT); sayT = gizleT = 0;
      if (oda) { if (tur && !tur.bitti && benCizer()) oda.gonder('bitti', { no: tur.no, kelime: tur.kelime, dogru: false, neden: 'pas' }); oda.kapat(); oda = null; }
      if (tv) { tv.yokEt(); tv = null; }
      while (cozler.length) { try { cozler.pop()(); } catch (e) {} }
      Object.keys(ui).forEach(k => delete ui[k]);
      tur = null; ctx = null; kok = null;
    }
  };
})();
