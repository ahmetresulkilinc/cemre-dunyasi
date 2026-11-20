/* canli.js — Anlık bağlantı (Supabase Realtime, ham WebSocket, kütüphane yok · Phoenix protokolü vsn 1.0.0).
   - Kanal: "realtime:cd-" + SHA-256(oda + '|canli') hex'inin ilk 32 karakteri. Oda değeri (RLS anahtarı) kanal adında görünmez.
   - Presence: "kim burada, hangi bölümde" (anahtar = bu telefondaki kişi: 'cemre' | 'ahmet').
   - Broadcast: dokunuş, emoji yağmuru, elçi, okundu, not düştü… (varlik.js her olayı ayrıca kalıcı olarak
     kendi anahtarına yazar; karşı taraf kapalıysa olayı senk ile sonra görür. Tekilleştirme olay id'si ile varlik.js'te).
   - 25 sn'de bir heartbeat; kopunca üstel bekleme ile yeniden bağlanır; sayfa görünür olunca hemen dener.
   - Bulut yoksa (SENK.URL boş), oda yoksa, tarayıcı WebSocket/crypto desteklemiyorsa sessizce kapalı kalır.
   - Faz 2: "anlık" yayın (kalıcı kopyası OLMAYAN geçici mesaj: çizgi, el ele basma, oyun dürtmesi). CD.canli.anlik(oda, tur, v)
     ve CD.canli.oda(ad, fn): küçük bir "oda" (bölüm içi kanal) + karşı taraf burada mı (selam/nabız ile).
   Olaylar (CD.olay): 'canli:baglanti' (true|false), 'canli:varlik' (presence değişti), 'canli:olay' ({ kim, o }), 'canli:anlik' ({ kim, oda, tur, v }). */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  const AYAR = (CD.config && CD.config.SENK) || {};
  const NABIZ = 25000;             // heartbeat aralığı
  const BEKLE_MIN = 1000, BEKLE_MAKS = 30000;

  let ws = null, konu = null, ref = 0, katilRef = null, katildi = false;
  let nabizT = 0, yenidenT = 0, deneme = 0, nabizBekleyen = null;
  let istenen = false;             // bağlı kalmak istiyor muyuz (oda + kim var)
  let durumYuku = null;            // son presence yükü (yeniden bağlanınca tekrar gönderilir)
  let izleniyor = false;           // presence track gönderildi mi
  const varlik = {};               // presence: anahtar → [meta…]

  const destek = () => !!(window.WebSocket && window.crypto && window.crypto.subtle && window.TextEncoder);
  const yay = (ad, v) => { try { CD.olay.yay(ad, v); } catch (e) {} };

  async function kanalAdi(oda) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(oda + '|canli'));
    return 'realtime:cd-' + [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }
  function adres() {
    return String(AYAR.URL || '').replace(/\/+$/, '').replace(/^http/i, 'ws') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(AYAR.ANON) + '&vsn=1.0.0';
  }
  function gonder(topic, event, payload) {
    if (!ws || ws.readyState !== 1) return null;
    const r = String(++ref);
    try { ws.send(JSON.stringify({ topic, event, payload: payload || {}, ref: r, join_ref: topic === 'phoenix' ? null : katilRef })); } catch (e) { return null; }
    return r;
  }

  function temizle() {
    clearInterval(nabizT); nabizT = 0; nabizBekleyen = null;
    katildi = false; izleniyor = false;
    Object.keys(varlik).forEach(k => delete varlik[k]);
    if (ws) { const w = ws; ws = null; w.onopen = w.onmessage = w.onclose = w.onerror = null; try { w.close(); } catch (e) {} }
  }
  function koptu() {
    const vardi = katildi;
    temizle();
    if (vardi) { yay('canli:baglanti', false); yay('canli:varlik', null); }
    if (!istenen) return;
    clearTimeout(yenidenT);
    const ms = Math.min(BEKLE_MAKS, BEKLE_MIN * Math.pow(2, deneme)) * (0.8 + Math.random() * 0.4);
    deneme = Math.min(deneme + 1, 8);
    yenidenT = setTimeout(baglan, ms);
  }

  function izle() {
    if (!katildi || !durumYuku || document.hidden) return;
    if (gonder(konu, 'presence', { type: 'presence', event: 'track', payload: durumYuku })) izleniyor = true;
  }
  function birak() {
    if (!katildi || !izleniyor) return;
    gonder(konu, 'presence', { type: 'presence', event: 'untrack' }); izleniyor = false;
  }

  function presenceUygula(durum, fark) {
    if (durum) { Object.keys(varlik).forEach(k => delete varlik[k]); Object.keys(durum).forEach(k => { varlik[k] = ((durum[k] && durum[k].metas) || []).slice(); }); }
    if (fark) {
      const ref_ = (m) => m && m.phx_ref;
      Object.keys(fark.leaves || {}).forEach(k => {
        const gid = new Set(((fark.leaves[k] && fark.leaves[k].metas) || []).map(ref_));
        varlik[k] = (varlik[k] || []).filter(m => !gid.has(ref_(m)));
        if (!varlik[k].length) delete varlik[k];
      });
      Object.keys(fark.joins || {}).forEach(k => {
        const gelen = (fark.joins[k] && fark.joins[k].metas) || [];
        const var_ = new Set((varlik[k] || []).map(ref_));
        varlik[k] = (varlik[k] || []).concat(gelen.filter(m => !var_.has(ref_(m))));
      });
    }
    yay('canli:varlik', CD.canli.herkes());
  }

  function mesaj(e) {
    let m; try { m = JSON.parse(e.data); } catch (err) { return; }
    if (!m) return;
    if (m.topic === 'phoenix') { if (m.event === 'phx_reply' && m.ref === nabizBekleyen) nabizBekleyen = null; return; }
    if (m.topic !== konu) return;
    switch (m.event) {
      case 'phx_reply':
        if (m.ref === katilRef) {
          if (m.payload && m.payload.status === 'ok') { katildi = true; deneme = 0; yay('canli:baglanti', true); izle(); }
          else koptu();
        }
        break;
      case 'phx_error': case 'phx_close': koptu(); break;
      case 'presence_state': presenceUygula(m.payload || {}, null); break;
      case 'presence_diff': presenceUygula(null, m.payload || {}); break;
      case 'broadcast': {
        const p = m.payload || {};
        if (p.event === 'olay' && p.payload && p.payload.o) yay('canli:olay', p.payload);
        else if (p.event === 'anlik' && p.payload && typeof p.payload.oda === 'string') yay('canli:anlik', p.payload);
        break;
      }
    }
  }

  async function baglan() {
    clearTimeout(yenidenT); yenidenT = 0;
    if (!istenen || (ws && ws.readyState <= 1)) return;
    if (navigator.onLine === false) return;                 // 'online' olayı tekrar dener
    const oda = CD.senk && CD.senk.oda;
    if (!oda) { istenen = false; return; }
    try { konu = await kanalAdi(oda); } catch (e) { istenen = false; return; }
    if (!istenen || (ws && ws.readyState <= 1)) return;
    temizle();
    let s; try { s = new WebSocket(adres()); } catch (e) { koptu(); return; }
    ws = s;
    s.onopen = () => {
      if (ws !== s) return;
      katilRef = String(++ref);
      try {
        s.send(JSON.stringify({ topic: konu, event: 'phx_join', ref: katilRef, join_ref: katilRef,
          payload: { config: { broadcast: { self: false, ack: false }, presence: { key: CD.kim() || ('misafir-' + Math.random().toString(36).slice(2, 7)) }, private: false } } }));
      } catch (e) { koptu(); return; }
      clearInterval(nabizT);
      nabizT = setInterval(() => {
        if (nabizBekleyen) { koptu(); return; }       // önceki nabza cevap gelmedi → bağlantı ölü
        nabizBekleyen = gonder('phoenix', 'heartbeat', {});
      }, NABIZ);
    };
    s.onmessage = (e) => { if (ws === s) mesaj(e); };
    s.onclose = () => { if (ws === s) koptu(); };
    s.onerror = () => {};                                   // onclose ardından gelir
  }

  function basla() {
    if (!destek() || !AYAR.URL || !AYAR.ANON) return;
    if (!(CD.senk && CD.senk.acik && CD.senk.oda)) return;
    istenen = true; deneme = 0;
    baglan();
  }
  function durdur() { istenen = false; clearTimeout(yenidenT); const vardi = katildi; temizle(); if (vardi) { yay('canli:baglanti', false); yay('canli:varlik', null); } }

  CD.canli = {
    get bagli() { return katildi; },
    get acik() { return istenen; },
    /* presence yükü: { kim, yer, uyku, ruh, t } — her değişimde çağrılır, bağlantı gelince de gönderilir */
    durum(yuk) { durumYuku = yuk || null; if (durumYuku) izle(); else birak(); },
    /* anlık olay: true = kanala yazıldı (karşı taraf bağlıysa alır). Kalıcı kopya her zaman ayrıca senk ile gider. */
    yayinla(veri) {
      if (!katildi) return false;
      return !!gonder(konu, 'broadcast', { type: 'broadcast', event: 'olay', payload: veri });
    },
    /* presence: { kim: meta } (aynı kişiden birden çok sekme olursa en yenisi) */
    herkes() {
      const o = {};
      Object.keys(varlik).forEach(k => { const ms = varlik[k] || []; if (ms.length) o[k] = ms[ms.length - 1]; });
      return o;
    },
    burada(kim) { return !!(katildi && varlik[kim] && varlik[kim].length); },
    /* geçici mesaj (kalıcı kopyası yok): bağlı değilse false. Çok büyük yük (≥200 KB) gönderilmez. */
    anlik(oda, tur, v) {
      if (!katildi) return false;
      const yuk = { kim: CD.kim(), oda: String(oda), tur: String(tur), v: v == null ? null : v };
      try { if (JSON.stringify(yuk).length > 200000) return false; } catch (e) { return false; }
      return !!gonder(konu, 'broadcast', { type: 'broadcast', event: 'anlik', payload: yuk });
    },
    /* bölüm içi oda: fn(tur, v) — '_geldi' (karşı odaya girdi), '_gitti' (çıktı/sustu) özel türleri de gelir.
       Karşı 4 sn'de bir nabız atar; 10 sn sessizse "gitti" sayılır. Dönen nesne: { gonder(tur, v), burada(), kapat() } */
    oda(ad, fn) {
      const karsi = () => { const k = CD.kim(); return k === 'ahmet' ? 'cemre' : (k === 'cemre' ? 'ahmet' : null); };
      let son = 0, vardi = false, kapali = false;
      const bildir = (tur, v) => { try { fn(tur, v); } catch (e) { console.warn('[canli.oda]', ad, e); } };
      const durumBak = () => {
        const simdi = !!(son && Date.now() - son < 10000 && katildi);
        if (simdi !== vardi) { vardi = simdi; bildir(simdi ? '_geldi' : '_gitti', null); }
      };
      const cozA = CD.olay.dinle('canli:anlik', (p) => {
        if (kapali || !p || p.oda !== ad || !p.kim || p.kim !== karsi()) return;
        son = Date.now();
        if (p.tur === '_selam') { CD.canli.anlik(ad, '_burada', null); durumBak(); return; }
        if (p.tur === '_ayrildi') { son = 0; durumBak(); return; }
        durumBak();
        if (p.tur === '_burada' || p.tur === '_nabiz') return;
        bildir(p.tur, p.v);
      });
      const cozB = CD.olay.dinle('canli:baglanti', (v) => { if (kapali) return; if (v) CD.canli.anlik(ad, '_selam', null); durumBak(); });
      const t = setInterval(() => { if (kapali) return; if (!document.hidden) CD.canli.anlik(ad, '_nabiz', null); durumBak(); }, 4000);
      CD.canli.anlik(ad, '_selam', null);
      return {
        gonder: (tur, v) => (!kapali && CD.canli.anlik(ad, tur, v)),
        burada: () => { durumBak(); return vardi; },
        kapat() { if (kapali) return; CD.canli.anlik(ad, '_ayrildi', null); kapali = true; clearInterval(t); cozA(); cozB(); }
      };
    },
    durdur
  };

  CD.olay.dinle('senk:acildi', () => setTimeout(basla, 50));
  CD.olay.dinle('kim', () => { if (istenen) { temizle(); deneme = 0; baglan(); } else basla(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { birak(); return; }
    if (!istenen) return;
    if (!ws || ws.readyState > 1) { deneme = 0; clearTimeout(yenidenT); baglan(); } else izle();
  });
  window.addEventListener('online', () => { if (istenen) { deneme = 0; clearTimeout(yenidenT); baglan(); } });
  window.addEventListener('pagehide', () => { birak(); });
})();
