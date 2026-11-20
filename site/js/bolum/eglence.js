/* js/bolum/eglence.js — Eğlence Köşesi (V2 Faz 3 · 4)
   #/eglence          seçim ekranı
   #/eglence/kavanoz  Buluşma kavanozu: ikisi de fikir atar, telefon sallanınca (DeviceMotion; iOS'ta izin düğmesi) ya da "Salla" ile biri çıkar
   #/eglence/test     "Beni ne kadar tanıyorsun?": biri 10 soruluk test hazırlar, öbürü çözer; puan pixel aşk ölçerde
   #/eglence/soru     Özel gün soru sahnesi: "Hayır" dokunulmaya çalışıldıkça küçülüp kaçar; "Evet" → havai fişek + posta
   Veriler (kişi kendi anahtarına yazar):
     cd.eglence.fikir.<kim>   [{ id, metin, t }]                         kavanoza atılan fikirler
     cd.eglence.test.<kim>    { id, t, sorular:[{ s, sec:[4], d }] }     hazırladığı test (cevaplar çözene GÖSTERİLMEZ)
     cd.eglence.cozum.<kim>   [{ id:testId, cevap:[…], puan, t }]        çözdüğü testler
     cd.eglence.soru.<kim>    { id, metin, t }                           sorduğu özel soru
     cd.eglence.evet.<kim>    [{ id:soruId, t }]                         "Evet" dedikleri
   Cihaza özel: cihaz.eglence.taslak (yarım test), cihaz.eglence.son (son çekilen fikir). */
(() => {
  'use strict';
  const ID = 'eglence';
  const A = () => CD.ani;
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8L8 30h48z" fill="var(--seker-kiraz,#FF9DB4)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3" stroke-linejoin="round"/><path d="M20 30L32 8l12 22" fill="var(--kagit,#FFFDF9)"/><rect x="12" y="30" width="40" height="24" fill="var(--seker-limon,#FFE28A)" stroke="var(--murekkep-2,#5D5566)" stroke-width="3"/><rect x="27" y="40" width="10" height="14" fill="var(--murekkep-2,#5D5566)"/></svg>';
  const FIKIRLER = ['Sahilde gün batımı yürüyüşü', 'Evde pizza ve film gecesi', 'Müzeye gidip en sevdiğimiz eseri seçmek', 'Yeni bir kahvaltı yeri keşfetmek', 'Piknik sepeti hazırlayıp parka gitmek',
    'Evde yemek yarışması', 'Kitapçıda birbirimize kitap seçmek', 'Yıldız izleme gecesi', 'Bowling oynamak', 'Seramik atölyesine gitmek', 'Sokak lezzetleri turu', 'Lunaparka gitmek',
    'Kahve ve tatlı molası', 'Bisiklet turu', 'Karaoke gecesi', 'Akvaryum ya da hayvanat bahçesi', 'Birbirimizin fotoğrafını çektiğimiz yürüyüş', 'Masa oyunu gecesi',
    'Hiç gitmediğimiz bir semti gezmek', 'Üç ayrı dükkânda dondurma tadımı', 'Sinemada en arka sıra', 'Doğada kısa bir yürüyüş', 'Evde spa günü', 'Bir günlük kısa kaçamak', 'Birlikte kek pişirmek'];
  const SORU_ORNEK = ['En sevdiğim yemek hangisi?', 'En sevdiğim renk?', 'Hangi hayvanı en çok severim?', 'Canım sıkılınca ne yaparım?', 'En sevdiğim mevsim?', 'Hangi tatlıya hayır diyemem?', 'Hayalimdeki tatil nerede?', 'Sabahları ilk ne yaparım?', 'En çok hangi şarkıyı dinlerim?', 'Beni en çok ne güldürür?'];
  const K = { fikir: 'eglence.fikir', test: 'eglence.test', cozum: 'eglence.cozum', soru: 'eglence.soru', evet: 'eglence.evet' };
  let ctx = null, kok = null, govde = null, nesil = 0, cozucu = [], temizlik = [];
  const ad = (k) => CD.kimAdi(k);
  const yol = () => A().altYol()[0] || '';
  function temizle() { temizlik.splice(0).forEach(f => { try { f(); } catch (e) {} }); }

  /* ================================================================ seçim ekranı */
  function menu() {
    ctx.baslik('Eğlence Köşesi');
    const karsi = A().karsi();
    const s = karsi ? CD.depo.al(K.soru + '.' + karsi, null) : null;
    const soruBekliyor = !!(s && s.id && !evetMi(s.id));
    const onunTest = karsi ? testAl(karsi) : null;
    const testBekliyor = !!(onunTest && !cozumAl(A().ben(), onunTest.id));
    const kart = (href, em, ad_, acik, rozet) => ctx.el('a.yama.eg-kart', { href, onclick: () => ctx.ses.pop() }, [ctx.el('span.eg-kart-em', { 'aria-hidden': 'true' }, em), ctx.el('span.eg-kart-metin', [ctx.el('strong', ad_), ctx.el('span.sessiz', acik)]), rozet ? ctx.el('span.rozet', rozet) : null]);
    govde.append(ctx.el('div.eg-menu', [
      kart('#/eglence/kavanoz', '🫙', 'Buluşma kavanozu', 'Fikir atın, sallayın, biri çıksın.'),
      kart('#/eglence/test', '💘', 'Beni ne kadar tanıyorsun?', '10 soruluk test hazırla ya da çöz.', testBekliyor ? 'Çözülecek test var' : ''),
      kart('#/eglence/soru', '🎆', 'Özel gün sorusu', 'Bir soru sor; "Hayır" düğmesi kaçar.', soruBekliyor ? 'Sana bir soru var' : '')
    ]));
  }

  /* ================================================================ KAVANOZ */
  const havuz = () => FIKIRLER.map(m => ({ metin: m, hazir: true })).concat(A().ikisi(K.fikir).map(f => ({ metin: A().kirp(f.metin, 80), kim: f.kim })));
  function kavanozSvg(adet) {
    const n = Math.min(12, adet);
    const kagit = ['P', 'Y', 'M', 'G'];
    const s = ['....KKKKKKKK....', '....KCCCCCCK....', '...KKKKKKKKKK...', '..K..........K..', '.K............K.', '.K............K.', '.K............K.', '.K............K.', '.K............K.', '.K............K.', '.K............K.', '..K..........K..', '...KKKKKKKKKK...'].map(r => r.split(''));
    for (let i = 0; i < n; i++) { const y = 10 - Math.floor(i / 4) * 2, x = 3 + (i % 4) * 3 - (Math.floor(i / 4) % 2); if (s[y] && s[y][x] === '.' && s[y][x + 1] === '.') { s[y][x] = kagit[i % 4]; s[y][x + 1] = kagit[i % 4]; } }
    return A().pixel(s.map(r => r.join('')), { K: '#6F5468', C: '#E08A6A', P: '#FF9DB4', Y: '#FFE28A', M: '#A9D6F2', G: '#9FE3C4' }, 'eg-kavanoz-svg');
  }
  function kavanoz() {
    ctx.baslik('Buluşma kavanozu');
    const h = havuz();
    const kav = ctx.el('div.eg-kavanoz', { html: kavanozSvg(h.length) });
    const sonuc = ctx.el('div.eg-cikan', { role: 'status', 'aria-live': 'polite' });
    const son = CD.depo.al('cihaz.eglence.son', null);
    const goster = (f) => {
      sonuc.innerHTML = '';
      sonuc.append(ctx.el('div.eg-kagit', [ctx.el('span.eg-kagit-metin', f.metin), f.kim ? ctx.el('span.eg-kagit-kim', [A().kisiIkon(f.kim, 14), ' attı']) : null]),
        ctx.el('button.dugme.tam', { type: 'button', onclick: () => {
          A().posta('kavanoz', { metin: A().kirp(f.metin, 80) }); A().pul('kavanoz', A().kirp(f.metin, 80));
          ctx.ses.parilti(); ctx.toast(A().aktif() ? 'Ona da haber gitti 💗' : 'Bu buluşma seçildi 💗');
        } }, '💗 Bunu yapalım'));
    };
    let sonCek = 0;
    const cek = () => {
      if (Date.now() - sonCek < 1200) return; sonCek = Date.now();
      const l = havuz(); const once = (CD.depo.al('cihaz.eglence.son', null) || {}).metin;
      let f = l[Math.floor(Math.random() * l.length)];
      if (l.length > 1 && f.metin === once) f = l[(l.indexOf(f) + 1) % l.length];
      CD.depo.yaz('cihaz.eglence.son', { metin: f.metin, kim: f.kim || null });
      ctx.ses.hop && ctx.ses.hop();
      if (!ctx.azHareket) { kav.classList.remove('salla'); void kav.offsetWidth; kav.classList.add('salla'); }
      setTimeout(() => { if (ctx && sonuc.isConnected) { goster(f); ctx.ses.tink(); } }, ctx.azHareket ? 0 : 650);
    };
    // sallama (DeviceMotion)
    let dinliyor = false;
    const hareket = (e) => { const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return; const g = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0); if (g > 32) cek(); };
    const dinle = () => { if (dinliyor) return; dinliyor = true; window.addEventListener('devicemotion', hareket); temizlik.push(() => window.removeEventListener('devicemotion', hareket)); };
    const izinGerek = typeof window.DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function';
    const izinD = izinGerek ? ctx.el('button.dugme-ikincil.tam', { type: 'button' }, '📱 Sallamayı aç') : null;
    if (izinD) izinD.addEventListener('click', async () => {
      try { const r = await DeviceMotionEvent.requestPermission(); if (r === 'granted') { dinle(); izinD.remove(); ctx.toast('Şimdi telefonu salla 🫙'); } else ctx.toast('İzin verilmedi; "Salla" düğmesi de iş görür'); }
      catch (e) { ctx.toast('İzin verilmedi; "Salla" düğmesi de iş görür'); }
    });
    else if (typeof window.DeviceMotionEvent !== 'undefined' && CD.dokunmatik) dinle();
    const fikir = ctx.el('input.girdi', { type: 'text', maxlength: '80', placeholder: 'Bir buluşma fikri…', 'aria-label': 'Kavanoza fikir at' });
    const at = ctx.el('button.dugme-ikincil', { type: 'button' }, 'At');
    const fikirAt = () => A().kimIste(() => {
      const v = A().kirp(fikir.value, 80); if (!v) { fikir.focus(); return; }
      A().benimEkle(K.fikir, { id: CD.kimlik(), metin: v, t: Date.now() }, 60);
      A().posta('fikir', {}); fikir.value = ''; ctx.ses.blop && ctx.ses.blop(); ctx.toast('Kavanoza atıldı 🫙'); yenidenCiz();
    });
    at.addEventListener('click', fikirAt);
    fikir.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fikirAt(); } });
    const benim = A().liste(K.fikir, A().ben());
    govde.append(...[ctx.el('div.eg-kavanoz-sahne', [kav, ctx.el('p.sessiz', h.length + ' fikir kavanozda · ' + (izinGerek ? 'sallamak için önce izin ver' : 'telefonu salla ya da düğmeye bas'))]),
      ctx.el('button.dugme.tam.eg-salla', { type: 'button', onclick: cek }, '🫙 Salla'), izinD, sonuc,
      ctx.el('h2.eg-baslik', 'Fikir at'), ctx.el('div.eg-fikir-satir', [fikir, at]),
      benim.length ? ctx.el('ul.eg-fikir-liste', benim.slice().reverse().map(f => ctx.el('li', [ctx.el('span', A().kirp(f.metin, 80)), ctx.el('button.dugme-ikon', { type: 'button', 'aria-label': 'Bu fikri kavanozdan çıkar', onclick: () => { A().benimSil(K.fikir, f.id); yenidenCiz(); } }, '✕')]))) : null].filter(Boolean));
    if (son && son.metin) goster(son);
  }

  /* ================================================================ TEST */
  function testAl(kim) { const t = kim ? CD.depo.al(K.test + '.' + kim, null) : null; return (t && t.id && Array.isArray(t.sorular) && t.sorular.length === 10) ? t : null; }
  function cozumAl(kim, testId) { return kim ? A().liste(K.cozum, kim).find(x => x.id === testId) || null : null; }
  function olcer(puan, buyuk) {
    const dolu = Math.max(0, Math.min(10, puan | 0));
    const hucreler = []; for (let i = 0; i < 10; i++) hucreler.push(ctx.el('span.eg-olcer-hucre' + (i < dolu ? '.dolu' : ''), { style: '--i:' + i }));
    const mesaj = dolu >= 9 ? 'Ruh ikizi! 💞' : dolu >= 7 ? 'Çok iyi tanıyor 💗' : dolu >= 4 ? 'Fena değil, biraz daha sohbet 💬' : 'Tanışma vakti! ☕';
    return ctx.el('div.eg-olcer' + (buyuk ? '.buyuk' : '') + (ctx.azHareket ? '' : '.canli'), { role: 'img', 'aria-label': 'Aşk ölçer: 10 üzerinden ' + dolu + '. ' + mesaj }, [
      ctx.el('span.eg-olcer-kalp', { 'aria-hidden': 'true', html: A().pixel(['.KK.KK.', 'KRRKRRK', 'KRRRRRK', '.KRRRK.', '..KRK..', '...K...'], { K: '#6F5468', R: dolu >= 7 ? '#E8557A' : '#FF9DB4' }, 'eg-olcer-svg') }),
      ctx.el('span.eg-olcer-tup', { 'aria-hidden': 'true' }, hucreler),
      ctx.el('span.eg-olcer-puan', { 'aria-hidden': 'true' }, dolu + '/10'),
      ctx.el('span.eg-olcer-mesaj', { 'aria-hidden': 'true' }, mesaj)
    ]);
  }
  let testMod = 'liste', cozAdim = 0, cozCevap = [];
  function test() {
    ctx.baslik('Ne kadar tanıyorsun?');
    if (testMod === 'hazirla') { testHazirla(); return; }
    if (testMod === 'coz') { testCoz(); return; }
    const ben = A().ben(), karsi = A().karsi();
    const onun = testAl(karsi), benim = testAl(ben);
    govde.appendChild(ctx.el('h2.eg-baslik', karsi ? CD.ek.nin(ad(karsi)) + ' testi' : 'Onun testi'));
    if (!ben) govde.appendChild(ctx.el('div.yama.eg-bilgi', [ctx.el('p', 'Önce bu telefonun kimin olduğunu seç.'), ctx.el('button.dugme', { type: 'button', onclick: () => CD.kimSec(false).then(() => yenidenCiz()) }, 'Seç')]));
    else if (!onun) govde.appendChild(ctx.el('p.sessiz', A().aktif() ? ad(karsi) + ' henüz test hazırlamadı.' : 'Bulut açık olunca onun testi buraya gelir.'));
    else {
      const c = cozumAl(ben, onun.id);
      if (c) govde.append(ctx.el('div.yama.eg-sonuc', [ctx.el('p', 'Bu testi çözdün. Puanın:'), olcer(c.puan, true), ctx.el('p.sessiz', 'Doğru cevaplar ' + ad(karsi) + ' tarafında saklı 🤫')]));
      else govde.appendChild(ctx.el('div.yama.eg-bilgi', [ctx.el('p', ad(karsi) + ' kendisi hakkında 10 soru hazırladı. Bakalım ne kadar tanıyorsun?'), ctx.el('button.dugme.tam', { type: 'button', onclick: () => { testMod = 'coz'; cozAdim = 0; cozCevap = []; yenidenCiz(); } }, '💘 Testi çöz')]));
    }
    govde.appendChild(ctx.el('h2.eg-baslik', 'Senin testin'));
    if (benim) {
      const c = karsi ? cozumAl(karsi, benim.id) : null;
      if (c) {
        govde.appendChild(ctx.el('div.yama.eg-sonuc', [ctx.el('p', ad(karsi) + ' testini çözdü:'), olcer(c.puan, false)]));
        const ol = ctx.el('ol.eg-karsilastir');
        benim.sorular.forEach((s, i) => { const v = c.cevap[i], dogru = v === s.d; ol.appendChild(ctx.el('li' + (dogru ? '.dogru' : '.yanlis'), [ctx.el('strong', A().kirp(s.s, 80)), ctx.el('span', (dogru ? '✓ ' : '✗ ') + A().kirp((s.sec || [])[v] || '—', 40) + (dogru ? '' : ' · doğrusu: ' + A().kirp((s.sec || [])[s.d], 40)))])); });
        govde.appendChild(ol);
      } else govde.appendChild(ctx.el('p.sessiz', karsi ? ad(karsi) + ' henüz çözmedi.' : 'Hazır.'));
    }
    if (ben) govde.appendChild(ctx.el('button.dugme' + (benim ? '-ikincil' : '') + '.tam', { type: 'button', onclick: () => { testMod = 'hazirla'; yenidenCiz(); } }, benim ? '✏️ Yeni test hazırla' : '✏️ Kendi testini hazırla'));
  }
  function testHazirla() {
    const taslak = CD.depo.al('cihaz.eglence.taslak', null);
    const veri = (taslak && Array.isArray(taslak.sorular) && taslak.sorular.length === 10) ? taslak.sorular : Array.from({ length: 10 }, () => ({ s: '', sec: ['', '', '', ''], d: -1 }));
    const kaydetTaslak = () => CD.depo.yaz('cihaz.eglence.taslak', { sorular: veri });
    const form = ctx.el('div.eg-form');
    veri.forEach((q, i) => {
      const s = ctx.el('input.girdi', { type: 'text', maxlength: '90', placeholder: SORU_ORNEK[i], 'aria-label': (i + 1) + '. soru', value: q.s || '' });
      s.addEventListener('input', () => { q.s = s.value; kaydetTaslak(); });
      const secenekler = ctx.el('div.eg-secenekler', { role: 'radiogroup', 'aria-label': (i + 1) + '. sorunun doğru cevabı' });
      for (let j = 0; j < 4; j++) {
        const r = ctx.el('input', { type: 'radio', name: 'egd' + i, 'aria-label': (j + 1) + '. seçenek doğru', checked: q.d === j });
        r.addEventListener('change', () => { q.d = j; kaydetTaslak(); });
        const g = ctx.el('input.girdi', { type: 'text', maxlength: '40', placeholder: (j + 1) + '. seçenek', 'aria-label': (i + 1) + '. soru, ' + (j + 1) + '. seçenek', value: (q.sec || [])[j] || '' });
        g.addEventListener('input', () => { q.sec[j] = g.value; kaydetTaslak(); });
        secenekler.appendChild(ctx.el('label.eg-secenek', [r, g]));
      }
      form.appendChild(ctx.el('fieldset.yama.siki.eg-soru-kutu', [ctx.el('legend', 'Soru ' + (i + 1)), s, secenekler, ctx.el('span.sessiz', 'Doğru olanın yanındaki yuvarlağı seç')]));
    });
    const kaydet = ctx.el('button.dugme.tam', { type: 'button' }, '💘 Testi gönder');
    kaydet.addEventListener('click', () => {
      for (let i = 0; i < 10; i++) {
        const q = veri[i];
        if (!A().kirp(q.s, 90) || q.sec.some(x => !A().kirp(x, 40))) { ctx.toast((i + 1) + '. soruda boş yer var ✏️'); form.querySelectorAll('fieldset')[i].scrollIntoView({ block: 'center' }); return; }
        if (!(q.d >= 0 && q.d < 4)) { ctx.toast((i + 1) + '. sorunun doğru cevabını seç'); form.querySelectorAll('fieldset')[i].scrollIntoView({ block: 'center' }); return; }
      }
      A().kimIste(() => {
        const t = { id: CD.kimlik(), t: Date.now(), sorular: veri.map(q => ({ s: A().kirp(q.s, 90), sec: q.sec.map(x => A().kirp(x, 40)), d: q.d })) };
        CD.depo.yaz(K.test + '.' + A().ben(), t);
        CD.depo.sil('cihaz.eglence.taslak');
        A().posta('test', { id: t.id });
        testMod = 'liste'; ctx.ses.parilti(); ctx.toast(A().aktif() ? 'Test yola çıktı 💘' : 'Test hazır 💘'); yenidenCiz();
      });
    });
    govde.append(ctx.el('p.sessiz', 'Kendin hakkında 10 soru yaz, her birine 4 seçenek. Doğru cevaplar karşı tarafa gösterilmez; yalnız puan görünür.'), form, kaydet,
      ctx.el('button.dugme-hayalet.tam', { type: 'button', onclick: () => { testMod = 'liste'; yenidenCiz(); } }, 'Vazgeç (taslak kalır)'));
  }
  function testCoz() {
    const karsi = A().karsi(), t = testAl(karsi);
    if (!t || cozumAl(A().ben(), t.id)) { testMod = 'liste'; yenidenCiz(); return; }
    if (cozAdim >= 10) {
      // puan bu telefonda hesaplanır; doğru cevaplar hiçbir zaman ekrana basılmaz
      const puan = t.sorular.reduce((p, q, i) => p + (cozCevap[i] === q.d ? 1 : 0), 0);
      const l = A().liste(K.cozum, A().ben()).filter(x => x.id !== t.id).concat([{ id: t.id, cevap: cozCevap.slice(), puan, t: Date.now() }]);
      A().benimYaz(K.cozum, l, 10);
      A().posta('testSonuc', { id: t.id, puan });
      A().pul('test', CD.ek.nin(ad(karsi)) + ' testi: ' + puan + '/10');
      testMod = 'liste';
      govde.append(ctx.el('div.yama.eg-sonuc', [ctx.el('p.kalin', 'Bitti! İşte aşk ölçer:'), olcer(puan, true)]), ctx.el('button.dugme.tam', { type: 'button', onclick: () => yenidenCiz() }, 'Tamam'));
      if (puan >= 7 && !ctx.azHareket) ctx.efekt.konfeti(undefined, undefined, 18);
      ctx.ses.zafer && ctx.ses.zafer();
      return;
    }
    const q = t.sorular[cozAdim];
    const ilerleme = ctx.el('div.eg-adim', { 'aria-hidden': 'true' }, Array.from({ length: 10 }, (_, i) => ctx.el('span' + (i < cozAdim ? '.gecti' : (i === cozAdim ? '.simdi' : '')))));
    const baslik = ctx.el('h2.eg-coz-soru', { tabindex: '-1' }, [ctx.el('span.sessiz', (cozAdim + 1) + '/10 · '), A().kirp(q.s, 90)]);
    govde.append(ilerleme, baslik, ctx.el('div.eg-coz-secenekler', (q.sec || []).slice(0, 4).map((s, j) => ctx.el('button.dugme-ikincil.tam', { type: 'button', onclick: () => { cozCevap[cozAdim] = j; cozAdim++; ctx.ses.tik(); yenidenCiz(); setTimeout(() => { const h = govde && govde.querySelector('.eg-coz-soru'); if (h) h.focus({ preventScroll: true }); }, 30); } }, A().kirp(s, 40)))),
      ctx.el('button.dugme-hayalet.tam', { type: 'button', onclick: () => { testMod = 'liste'; yenidenCiz(); } }, 'Sonra devam et'));
  }

  /* ================================================================ SORU SAHNESİ */
  function evetMi(soruId) { const k = A().ben(); return !!(k && A().liste(K.evet, k).some(x => x.id === soruId)); }
  function soru() {
    ctx.baslik('Özel gün sorusu');
    const ben = A().ben(), karsi = A().karsi();
    const onun = karsi ? CD.depo.al(K.soru + '.' + karsi, null) : null;
    const benim = ben ? CD.depo.al(K.soru + '.' + ben, null) : null;
    if (onun && onun.id && A().kirp(onun.metin)) sahne(onun, karsi, false);
    else govde.appendChild(ctx.el('p.sessiz.eg-giris', karsi && A().aktif() ? ad(karsi) + ' henüz bir soru sormadı.' : 'Bulut açık olunca onun sorusu burada sahneye çıkar.'));
    govde.appendChild(ctx.el('h2.eg-baslik', 'Senin sorun'));
    if (benim && benim.id) {
      const evetDedi = karsi && A().liste(K.evet, karsi).some(x => x.id === benim.id);
      govde.appendChild(ctx.el('div.yama.siki.eg-bilgi', [ctx.el('p.kalin', '"' + A().kirp(benim.metin, 120) + '"'), ctx.el('p.sessiz', evetDedi ? ad(karsi) + ' EVET dedi 🎆' : 'Cevap bekleniyor…'),
        ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { const g = ctx.el('div.eg-onizleme'); ctx.sheet(g, { baslik: 'Önizleme', odak: false }); sahne(benim, ben, true, g); } }, 'Önizle')]));
    }
    const kutu = ctx.el('input.girdi', { type: 'text', maxlength: '120', placeholder: 'Benimle … gelir misin?', 'aria-label': 'Sorun' });
    const gonder = ctx.el('button.dugme.tam', { type: 'button' }, '🎆 Soruyu sahneye koy');
    gonder.addEventListener('click', () => A().kimIste((k) => {
      const v = A().kirp(kutu.value, 120); if (!v) { ctx.toast('Bir soru yaz 💭'); kutu.focus(); return; }
      const s = { id: CD.kimlik(), metin: v, t: Date.now() };
      CD.depo.yaz(K.soru + '.' + k, s);
      A().posta('soruSahne', { id: s.id });
      ctx.ses.parilti(); ctx.toast(A().aktif() ? 'Soru sahneye kondu; onun ekranında açılacak 🎆' : 'Soru hazır 🎆'); yenidenCiz();
    }));
    govde.append(kutu, gonder);
  }
  function sahne(s, soran, onizleme, hedef) {
    const evet = !onizleme && evetMi(s.id);
    const canvas = ctx.el('canvas.eg-fisek', { 'aria-hidden': 'true' });
    const hayir = ctx.el('button.eg-hayir', { type: 'button' }, 'Hayır');
    const evetD = ctx.el('button.dugme.eg-evet', { type: 'button' }, 'Evet 💗');
    const mesaj = ctx.el('p.eg-sahne-mesaj', { role: 'status', 'aria-live': 'polite' }, evet ? 'Evet dedin 💗' : '');
    const dugmeler = ctx.el('div.eg-sahne-dugmeler', evet ? [] : [evetD, hayir]);
    const sahneEl = ctx.el('div.eg-sahne', [ctx.el('div.eg-perde.sol', { 'aria-hidden': 'true' }), ctx.el('div.eg-perde.sag', { 'aria-hidden': 'true' }), canvas,
      ctx.el('div.eg-sahne-ic', [ctx.el('p.eg-sahne-kim', CD.ek.den(ad(soran)) + ' bir soru'), ctx.el('h2.eg-sahne-soru', A().kirp(s.metin, 120)), dugmeler, mesaj])]);
    (hedef || govde).appendChild(sahneEl);
    if (evet) return;
    let kacis = 0, olcek = 1;
    const kac = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      kacis++; olcek = Math.max(0.35, olcek * 0.82);
      if (kacis >= 7) { hayir.remove(); mesaj.textContent = 'Hayır düğmesi kaçtı gitti 🏃'; evetD.focus(); return; }
      const r = sahneEl.getBoundingClientRect(), b = hayir.getBoundingClientRect();
      const x = Math.random() * Math.max(10, r.width - b.width - 16) + 8, y = Math.random() * Math.max(10, r.height - b.height - 16) + 8;
      hayir.classList.add('kacan');
      hayir.style.left = x + 'px'; hayir.style.top = y + 'px'; hayir.style.transform = 'scale(' + olcek.toFixed(2) + ')';
      ctx.ses.pit();
      mesaj.textContent = ['Emin misin? 🥺', 'Bir daha düşün…', 'Hayır kaçıyor 🙈', 'Yakalayamazsın!', 'Son şans: Evet?', 'Hâlâ mı? 😄'][Math.min(5, kacis - 1)];
    };
    ['pointerenter', 'pointerdown', 'touchstart'].forEach(t => hayir.addEventListener(t, kac, { passive: false }));
    hayir.addEventListener('click', kac);
    hayir.addEventListener('focus', () => { if (kacis) kac(); });
    evetD.addEventListener('click', () => {
      dugmeler.innerHTML = ''; mesaj.textContent = onizleme ? 'Önizleme: Evet denince böyle olur 🎆' : 'EVET! 🎆';
      havaiFisek(canvas, sahneEl);
      if (onizleme) return;
      const k = A().ben(); if (!k) return;
      A().benimEkle(K.evet, { id: s.id, t: Date.now() }, 30);
      A().posta('soruEvet', { id: s.id, metin: A().kirp(s.metin, 80) });
      A().pul('soru-evet', '"' + A().kirp(s.metin, 80) + '" → Evet');
      ctx.ses.zafer && ctx.ses.zafer();
    });
  }
  function havaiFisek(canvas, kap) {
    if (ctx.azHareket) { ctx.efekt.kalp(innerWidth / 2, innerHeight / 2, 8); return; }
    const r = kap.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    const g = canvas.getContext('2d'); g.scale(dpr, dpr);
    const RENK = ['#FF9DB4', '#FFE28A', '#A9D6F2', '#9FE3C4', '#CDBDF6', '#FFC3A3'];
    let parca = [], basla = performance.now(), raf = 0, son = 0;
    const patla = () => { const x = r.width * (0.2 + Math.random() * 0.6), y = r.height * (0.15 + Math.random() * 0.35), c = RENK[Math.floor(Math.random() * RENK.length)]; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, h = 1.4 + Math.random() * 2.2; parca.push({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h, o: 1, c }); } };
    const kare = (t) => {
      if (!canvas.isConnected) return;
      if (t - son > 380 && t - basla < 2600) { patla(); son = t; }
      g.clearRect(0, 0, r.width, r.height);
      parca = parca.filter(p => p.o > 0.05);
      parca.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.o *= 0.965; g.globalAlpha = p.o; g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 4, 4); });
      g.globalAlpha = 1;
      if (t - basla < 4200) raf = requestAnimationFrame(kare); else g.clearRect(0, 0, r.width, r.height);
    };
    raf = requestAnimationFrame(kare);
    temizlik.push(() => cancelAnimationFrame(raf));
    ctx.efekt.konfeti(undefined, undefined, 14);
  }

  /* ================================================================ çizim / bölüm */
  function yenidenCiz() {
    if (!ctx || !govde) return;
    temizle();
    govde.innerHTML = '';
    const y = yol();
    if (y !== 'test') { testMod = 'liste'; }
    try { ({ kavanoz, test, soru })[y] ? ({ kavanoz, test, soru })[y]() : menu(); }
    catch (e) { console.warn('[eglence]', e); }
    if (y) govde.appendChild(ctx.el('a.dugme-hayalet.tam.eg-geri', { href: '#/eglence' }, '‹ Eğlence Köşesi'));
  }
  const T = (CD.postaTurleri = CD.postaTurleri || {});
  const burada = (alt) => CD.aktifBolum && CD.aktifBolum() === ID && yol() === alt;
  T.kavanoz = { kart(o, y) { y.kart({ kim: y.kim, tur: 'kavanoz', baslik: 'Kavanozdan çıktı: ' + A().kirp(o.v && o.v.metin, 60) + ' 🫙', alt: y.A + ' bunu yapalım diyor · ' + y.saat }); }, ozet(l, A_) { return '🫙 ' + A_ + ' kavanozdan bir buluşma seçti'; } };
  T.fikir = { kart(o, y) { if (burada('kavanoz')) { setTimeout(yenidenCiz, 1500); return; } y.kart({ kim: y.kim, tur: 'fikir', baslik: y.A + ' kavanoza bir fikir attı 🫙', alt: 'Sallayınca çıkabilir · ' + y.saat }); }, ozet() { return ''; } };
  T.test = { kart(o, y) { y.kart({ kim: y.kim, tur: 'test', baslik: y.A + ' kendisi hakkında bir test hazırladı 💘', alt: 'Ne kadar tanıyorsun?', eylem: { ad: 'Çöz', fn: () => CD.ac(ID + '/test') } }); if (burada('test') && testMod === 'liste') setTimeout(yenidenCiz, 1500); }, ozet(l, A_) { return '💘 ' + A_ + ' sana bir test hazırladı'; } };
  T.testSonuc = { kart(o, y) { const p = Math.max(0, Math.min(10, (o.v && o.v.puan) | 0)); y.kart({ kim: y.kim, tur: 'testSonuc', baslik: y.A + ' testini çözdü: ' + p + '/10 💘', alt: p >= 7 ? 'Seni çok iyi tanıyor!' : 'Biraz daha sohbet 💬', eylem: { ad: 'Bak', fn: () => CD.ac(ID + '/test') } }); if (burada('test') && testMod === 'liste') setTimeout(yenidenCiz, 1500); }, ozet(l, A_) { return '💘 ' + A_ + ' testini çözdü'; } };
  T.soruSahne = { kart(o, y) { y.kart({ kim: y.kim, tur: 'soruSahne', baslik: CD.ek.nin(y.A) + ' sana bir sorusu var 💌', alt: 'Sahne hazır', eylem: { ad: 'Aç', fn: () => CD.ac(ID + '/soru') } }); if (burada('soru')) setTimeout(yenidenCiz, 1500); }, ozet(l, A_) { return '💌 ' + CD.ek.nin(A_) + ' sana bir sorusu var'; } };
  T.soruEvet = { kart(o, y) { y.kart({ kim: y.kim, tur: 'soruEvet', baslik: y.A + ' EVET dedi! 🎆', alt: '"' + A().kirp(o.v && o.v.metin, 70) + '"' }); if (!CD.azHareket) CD.efekt.konfeti(undefined, undefined, 22); if (CD.ses.zafer) CD.ses.zafer(); }, ozet(l, A_) { return '🎆 ' + A_ + ' sorunuza EVET dedi'; } };
  CD.mhIpucu[ID] = () => {
    const k = A().karsi(); if (!k || !A().aktif()) return '';
    const s = CD.depo.al(K.soru + '.' + k, null); if (s && s.id && !evetMi(s.id)) return 'Sana bir soru var 💌';
    const t = testAl(k); if (t && !cozumAl(A().ben(), t.id)) return 'Çözülecek test var 💘';
    return '';
  };

  CD.kaydet({
    id: ID, baslik: 'Eğlence Köşesi', ikon: IKON,
    mount(el, c) {
      ctx = c; kok = el; nesil++; testMod = 'liste';
      govde = ctx.el('div.eg-govde');
      el.appendChild(ctx.el('div.icerik.eg-icerik', [govde]));
      yenidenCiz();
      cozucu = [CD.olay.dinle('senk:yenilendi', () => { if (!ctx) return; if (testMod !== 'liste') return; if (document.querySelector('.eg-govde input:focus')) return; if (yol() === 'kavanoz' && govde.querySelector('.eg-kagit')) return; yenidenCiz(); })];
    },
    unmount() { nesil++; temizle(); cozucu.forEach(f => { try { f(); } catch (e) {} }); cozucu = []; testMod = 'liste'; ctx = null; kok = null; govde = null; }
  });
})();
