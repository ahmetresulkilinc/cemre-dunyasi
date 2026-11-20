/* js/oyun/salon.js — Oyun Salonu (V2 Faz 2 · 5). Bölüm id'si 'xox' olarak kalır (mahalle binası, eski bağlantılar, varlık yeri).
   - #/xox → oyun seçme ekranı; #/xox/<oyun> → o oyun. Her oyun kendi dosyasında, sözleşmeye uygun ALT MODÜL:
       (CD.oyunlar = CD.oyunlar || {})[id] = { id, ad, aciklama, ikon, sira, mount(el, ctx), unmount(), siraSende?(), durum?() }
     Alt modül aynı ctx'i alır (altbar, toast, sheet, depo…) ve unmount'ta HER şeyini temizler.
   - Ortak altyapı CD.oyunAg: XOX ile aynı (tek ortak anahtar ya da kişinin kendi anahtarı + senk) + anlık "dürtme":
     hamle yazılınca CD.canli.anlik('oyun', 'durt', { oyun, d }) → karşı ekran beklemeden güncellenir; kalıcı kopya senk ile gelir.
   - Bulut kapalıysa (ya da "bu telefon kimin?" seçilmediyse) oyunlar aynı telefonda sırayla oynanır. */
(() => {
  'use strict';
  const ID = 'xox';
  const IKON = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="14" width="48" height="34" rx="8" fill="var(--seker-gok,#A9D6F2)"/><rect x="14" y="20" width="22" height="16" rx="3" fill="var(--kagit,#FFFDF9)"/><circle cx="46" cy="26" r="3.4" fill="var(--seker-kiraz,#FF9DB4)"/><circle cx="46" cy="36" r="3.4" fill="var(--seker-bal,#F5B54A)"/><path d="M18 52h28" stroke="var(--murekkep-2,#5D5566)" stroke-width="3" stroke-linecap="round"/></svg>';
  const V = () => CD.varlik;

  /* ------------------------------------------------------------ ortak oyun altyapısı */
  const ag = {
    ben: () => (CD.kim ? CD.kim() : null),
    karsi: () => { const k = CD.kim ? CD.kim() : null; return k === 'ahmet' ? 'cemre' : (k === 'cemre' ? 'ahmet' : null); },
    bulut: () => !!(CD.senk && CD.senk.acik),
    tek: () => !(CD.senk && CD.senk.acik) || !(CD.kim && CD.kim()),
    rakip: (k) => (k === 'ahmet' ? 'cemre' : 'ahmet'),
    adi: (k) => CD.kimAdi(k),
    ek: (k) => { const a = CD.kimAdi(k); return CD.ek && CD.ek.de ? CD.ek.de(a).slice(a.length) : "'de"; },   // Sıra Ahmet'te / Cemre'de
    oynayabilir(kim) { return ag.tek() || kim === ag.ben(); },
    /* hamleden sonra: karşı ekranı dürt (anlık) + senk'i hemen çalıştır (kalıcı) */
    durt(oyun, d) {
      try { if (CD.canli && CD.canli.bagli) CD.canli.anlik('oyun', 'durt', { oyun, d: d == null ? null : d }); } catch (e) {}
      if (ag.bulut()) CD.senk.simdi();
    },
    dinle(oyun, fn) {
      return CD.olay.dinle('canli:anlik', (p) => { if (p && p.oda === 'oyun' && p.tur === 'durt' && p.v && p.v.oyun === oyun && p.kim === ag.karsi()) { try { fn(p.v.d); } catch (e) { console.warn('[oyun]', oyun, e); } } });
    },
    /* durumu karşıya oyun posta kartıyla haber ver (sıra sende / oyun bitti) — mahalledeyken görülür */
    posta(oyun, metin) { if (V() && V().aktif()) V().gonder('oyun', { oyun, metin: String(metin || '').slice(0, 80) }); }
  };
  CD.oyunAg = ag;
  const oyunlar = () => CD.oyunlar || {};
  const sirali = () => Object.values(oyunlar()).filter(o => o && o.id && typeof o.mount === 'function').sort((a, b) => (a.sira || 99) - (b.sira || 99));

  (CD.postaTurleri = CD.postaTurleri || {}).oyun = {
    kart(o, y) {
      const oy = oyunlar()[o.v && o.v.oyun]; if (!oy) return;
      if (CD.aktifBolum && CD.aktifBolum() === ID && altYol() === oy.id) return;      // zaten o oyunda
      y.kart({ kim: y.kim, tur: 'oyun', baslik: oy.ad + ': ' + ((o.v && o.v.metin) || y.A + ' oynadı'), alt: y.saat, eylem: { ad: 'Oyna', fn: () => CD.ac(ID + '/' + oy.id) } });
    },
    ozet(l, A) { return '🎮 ' + A + ' Oyun Salonu\'nda hamle yaptı'; }
  };

  /* xox'un "sıra sende"si (xox.js'e dokunmadan, kendi anahtarından) */
  function xoxSira() {
    try { const d = CD.depo.al('xox.durum', null); return !!(d && d.sira === ag.ben() && !d.kazanan && !(d.tahta || []).every(x => x)); } catch (e) { return false; }
  }
  CD.oyunSalonu = {
    siraSende() { if (ag.tek()) return false; return sirali().some(o => o.id === 'xox' ? xoxSira() : !!(o.siraSende && o.siraSende())); }
  };

  /* ------------------------------------------------------------ bölüm */
  const altYol = () => (location.hash.replace(/^#\/?/, '').split('/')[1] || '').trim();
  let aktif = null, kok = null, ctx = null, cozT = 0;

  function secimKur(el) {
    const e = ctx.el;
    ctx.baslik('Oyun Salonu');
    const liste = e('div.oyun-secim', { role: 'list' });
    sirali().forEach(o => {
      const sira = !ag.tek() && (o.id === 'xox' ? xoxSira() : !!(o.siraSende && o.siraSende()));
      let durum = ''; try { durum = o.durum ? o.durum() : (o.id === 'xox' ? (CD.depo.al('xox.ipucu', '') || '') : ''); } catch (er) {}
      liste.appendChild(e('a.yama.oyun-kart' + (sira ? '.sira' : ''), { href: '#/' + ID + '/' + o.id, role: 'listitem', 'aria-label': o.ad + '. ' + (o.aciklama || '') + (sira ? ' Sıra sende.' : '') + (durum ? ' ' + durum : ''), onclick: () => ctx.ses.pop() }, [
        e('span.oyun-kart-ikon', { 'aria-hidden': 'true', html: o.ikon || '' }),
        e('span.oyun-kart-metin', [e('strong.oyun-kart-ad', o.ad), e('span.sessiz.oyun-kart-aciklama', o.aciklama || ''), durum ? e('span.oyun-kart-durum', durum) : null]),
        sira ? e('span.rozet.oyun-kart-rozet', 'Sıra sende') : null
      ]));
    });
    const not = ag.tek() ? e('p.sessiz.oyun-not', ag.bulut() ? 'Bu telefonun kimin olduğunu seçince oyunlar iki telefon arasında oynanır.' : 'Bulut kapalı: oyunlar bu telefonda sırayla oynanır.') : null;
    el.appendChild(e('div.icerik.oyun-icerik', [liste, not]));
  }

  CD.kaydet({
    id: ID, baslik: 'Oyun Salonu', ikon: IKON, tamEkran: false,
    mount(el, c) {
      ctx = c; kok = el;
      const oy = oyunlar()[altYol()];
      if (!oy) { secimKur(el); return; }
      ctx.baslik(oy.ad);
      const ic = c.el('div.oyun-alan', { data: { oyun: oy.id } });
      el.append(c.el('div.oyun-geri-serit', [c.el('a.dugme-hayalet.kucuk.oyun-geri', { href: '#/' + ID, onclick: () => ctx.ses.tik() }, '‹ Oyunlar')]), ic);
      aktif = oy;
      try { oy.mount(ic, c); } catch (e) { console.error('[oyun]', oy.id, e); ic.innerHTML = ''; ic.appendChild(c.el('div.icerik', [c.el('div.yama.bos-durum', [c.el('p', 'Bu oyun şu an açılamadı. Oyunlara dönüp tekrar dener misin?'), c.el('a.dugme', { href: '#/' + ID }, 'Oyunlar')])])); aktif = null; }
    },
    unmount() {
      clearTimeout(cozT);
      if (aktif && aktif.unmount) { try { aktif.unmount(); } catch (e) { console.warn('[oyun unmount]', aktif.id, e); } }
      aktif = null; ctx = null; kok = null;
    }
  });
})();
