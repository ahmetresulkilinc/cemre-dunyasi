/* sehir.js — İki şehir: saat + hava (V2 Faz 2 · 8).
   - config.js → MAHALLE.SEHIR = { cemre: '', ahmet: '' }. İkisinden biri boşsa özellik tamamen gizlenir.
   - Koordinat: MAHALLE.SEHIR_KOORD = { cemre: [enlem, boylam], ahmet: [...] }; boşsa aşağıdaki küçük şehir tablosundan bulunur.
   - Hava: Open-Meteo (anahtar gerektirmez, konum izni İSTENMEZ). İki şehir tek istekte; günde EN ÇOK 6 istek
     (4 saatte bir tazelenir; sayaç ve son sonuç cihaz.sehir.hava'da, buluta gitmez). İstek başarısızsa da sayılır.
   - Bu, sitedeki TEK dış istektir ve bölümlerde değil bu katmanda yapılır (MODUL-SOZLESMESI §1 notu).
   Olay: 'sehir:degisti'. */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const ONBELLEK = 'cihaz.sehir.hava';
  const GUNLUK_MAKS = 6, TAZE = 4 * 3600000;
  const TABLO = {
    'adana': [37.00, 35.32], 'ankara': [39.93, 32.86], 'antalya': [36.90, 30.70], 'bursa': [40.19, 29.06], 'diyarbakır': [37.91, 40.24],
    'eskişehir': [39.78, 30.52], 'gaziantep': [37.07, 37.38], 'istanbul': [41.01, 28.98], 'izmir': [38.42, 27.14], 'kayseri': [38.73, 35.49],
    'kocaeli': [40.77, 29.94], 'konya': [37.87, 32.48], 'malatya': [38.35, 38.31], 'mersin': [36.80, 34.63], 'samsun': [41.29, 36.33],
    'şanlıurfa': [37.16, 38.80], 'trabzon': [41.00, 39.72], 'hatay': [36.20, 36.16], 'kahramanmaraş': [37.58, 36.94], 'adıyaman': [37.76, 38.28],
    'denizli': [37.78, 29.09], 'sakarya': [40.78, 30.40], 'tekirdağ': [40.98, 27.51], 'muğla': [37.22, 28.36], 'erzurum': [39.90, 41.27],
    'van': [38.50, 43.38], 'edirne': [41.68, 26.56], 'çanakkale': [40.15, 26.41], 'balıkesir': [39.65, 27.88], 'manisa': [38.61, 27.43]
  };
  const MAH = () => (CD.config && CD.config.MAHALLE) || {};
  const ad = (kim) => String(((MAH().SEHIR || {})[kim]) || '').trim();
  function koord(kim) {
    const k = (MAH().SEHIR_KOORD || {})[kim];
    if (Array.isArray(k) && k.length === 2 && isFinite(k[0]) && isFinite(k[1])) return [Number(k[0]), Number(k[1])];
    const t = TABLO[ad(kim).toLocaleLowerCase('tr')]; return t || null;
  }
  const aktif = () => !!(ad('cemre') && ad('ahmet') && koord('cemre') && koord('ahmet'));

  function onbellek() { const v = CD.depo.al(ONBELLEK, null); return v && typeof v === 'object' ? v : null; }
  let istekte = false;
  async function tazele(zorla) {
    if (!aktif() || istekte || !window.fetch || navigator.onLine === false) return;
    const o = onbellek() || {};
    const bugun = CD.bugun();
    const sayac = o.gun === bugun ? (o.sayac || 0) : 0;
    const anahtar = koord('cemre').join(',') + '|' + koord('ahmet').join(',');
    if (sayac >= GUNLUK_MAKS) return;
    if (!zorla && o.anahtar === anahtar && o.t && Date.now() - o.t < TAZE) return;
    istekte = true;
    const yeni = Object.assign({}, o, { gun: bugun, sayac: sayac + 1, deneme: Date.now() });
    CD.depo.yaz(ONBELLEK, yeni);                         // önce sayılır: sayfa kapansa da sınır aşılmaz
    try {
      const [a, b] = [koord('cemre'), koord('ahmet')];
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + a[0] + ',' + b[0] + '&longitude=' + a[1] + ',' + b[1] +
        '&current=temperature_2m,weather_code,is_day&timezone=auto';
      const r = await fetch(url, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!r.ok) throw new Error('hava ' + r.status);
      let d = await r.json();
      if (!Array.isArray(d)) d = [d];
      const oku = (x) => { const c = (x && x.current) || {}; return { derece: Math.round(Number(c.temperature_2m)), kod: Number(c.weather_code), gunduz: c.is_day !== 0, fark: Number(x && x.utc_offset_seconds) || 0 }; };
      yeni.liste = { cemre: oku(d[0]), ahmet: oku(d[1] || d[0]) };
      yeni.t = Date.now(); yeni.anahtar = anahtar;
      CD.depo.yaz(ONBELLEK, yeni);
      CD.olay.yay('sehir:degisti');
    } catch (e) { /* sessiz: saat yine görünür, hava son bilinenle kalır */ }
    finally { istekte = false; }
  }
  /* WMO kodu → simge türü */
  function tur(kod, gunduz) {
    if (!isFinite(kod)) return '';
    if (kod >= 95) return 'firtina';
    if ((kod >= 71 && kod <= 77) || kod === 85 || kod === 86) return 'kar';
    if ((kod >= 51 && kod <= 67) || (kod >= 80 && kod <= 82)) return 'yagmur';
    if (kod === 45 || kod === 48 || kod === 3) return 'bulutlu';
    if (kod === 2) return gunduz ? 'parcali' : 'ay';
    return gunduz ? 'gunes' : 'ay';
  }
  const TUR_AD = { gunes: 'güneşli', parcali: 'parçalı bulutlu', bulutlu: 'bulutlu', yagmur: 'yağmurlu', kar: 'karlı', firtina: 'fırtınalı', ay: 'açık gece' };
  /* [{ kim, ad, saat, derece, tur, turAd }] — hava yoksa yalnız saat (Türkiye saati varsayılır) */
  function durum() {
    if (!aktif()) return [];
    const o = onbellek(); const l = (o && o.liste) || {};
    const taze = o && o.t && Date.now() - o.t < 12 * 3600000;
    return ['cemre', 'ahmet'].map(kim => {
      const h = taze ? l[kim] : null;
      const fark = h ? h.fark : 3 * 3600;
      const d = new Date(Date.now() + fark * 1000);
      const saat = String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
      const t = h ? tur(h.kod, h.gunduz) : '';
      return { kim, ad: ad(kim), saat, derece: h && isFinite(h.derece) ? h.derece : null, tur: t, turAd: TUR_AD[t] || '' };
    });
  }

  CD.sehir = { aktif, durum, tazele, koord, tur };
  CD.hazir(() => {
    if (!aktif()) return;
    setTimeout(() => tazele(false), 2500);
    setInterval(() => { if (!document.hidden) tazele(false); }, 30 * 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tazele(false); });
  });
})();
