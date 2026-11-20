/* tuval.js — Ortak çizim tuvali (V2 Faz 2 · Çizim Atölyesi ve "Çiz ve tahmin et" kullanır).
   CD.tuval(canvas, { boyut, zemin, izin(), gonder(paket) }) → { renk, kalin, silgi, temizle(), uygula(paket), resim(url), dataUrl(maks, sinir), kirli, yokEt() }
   - Tuvalin iç çözünürlüğü sabittir (boyut × boyut) → iki telefonda koordinatlar aynı; ekranda CSS ile ölçeklenir.
   - Çizgi paketi: { id, r: renk, k: kalınlık, s: silgi mi, p: [x, y, x, y, …] (tam sayı), b: ilk paket mi }.
     Paketler en çok 100 ms'de bir gönderilir (anlık kanal sınırı ~10 mesaj/sn).
   - Silgi zemin rengiyle boyar (kayıtta saydam delik kalmaz). */
window.CD = window.CD || {};
(() => {
  'use strict';
  const CD = window.CD;
  CD.tuval = function (canvas, o) {
    o = o || {};
    const B = o.boyut || 800, ZEMIN = o.zemin || '#FFFDF9';
    canvas.width = B; canvas.height = B;
    const g = canvas.getContext('2d');
    g.lineCap = 'round'; g.lineJoin = 'round';
    const durum = { renk: '#3B2A3A', kalin: 14, silgi: false };
    let kirli = false, aktifCizgi = null, tampon = [], gonderT = 0, olu = false;
    const uzak = new Map();       // id → son nokta [x, y]

    function zeminBoya() { g.save(); g.globalCompositeOperation = 'source-over'; g.fillStyle = ZEMIN; g.fillRect(0, 0, B, B); g.restore(); }
    zeminBoya();

    function cizgi(r, k, s, x0, y0, x1, y1) {
      g.strokeStyle = s ? ZEMIN : r; g.lineWidth = s ? k * 1.8 : k;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    function nokta(r, k, s, x, y) { g.fillStyle = s ? ZEMIN : r; g.beginPath(); g.arc(x, y, (s ? k * 1.8 : k) / 2, 0, Math.PI * 2); g.fill(); }
    const renkTemiz = (r) => /^#[0-9a-f]{3,8}$/i.test(String(r || '')) ? r : '#3B2A3A';
    const sinir = (v) => Math.max(0, Math.min(B, Math.round(Number(v) || 0)));

    function yerel(e) {
      const r = canvas.getBoundingClientRect();
      return [sinir((e.clientX - r.left) / r.width * B), sinir((e.clientY - r.top) / r.height * B)];
    }
    function gonderPlan(son) {
      if (!o.gonder) { tampon = []; return; }
      const bosalt = () => {
        gonderT = 0;
        if (!aktifCizgi && !tampon.length) return;
        if (!tampon.length && !son) return;
        const c = aktifCizgi || {};
        o.gonder({ id: c.id, r: c.r, k: c.k, s: c.s ? 1 : 0, p: tampon.splice(0), b: c.ilk ? 1 : 0 });
        if (c) c.ilk = false;
      };
      if (son) { clearTimeout(gonderT); bosalt(); return; }
      if (!gonderT) gonderT = setTimeout(bosalt, 100);
    }
    function bas(e) {
      if (olu || (o.izin && !o.izin())) return;
      if (e.button) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
      const [x, y] = yerel(e);
      aktifCizgi = { id: CD.kimlik(), r: durum.renk, k: durum.kalin, s: durum.silgi, son: [x, y], pid: e.pointerId, ilk: true };
      nokta(durum.renk, durum.kalin, durum.silgi, x, y);
      tampon.push(x, y); kirli = true;
      gonderPlan(false);
    }
    function hareket(e) {
      const c = aktifCizgi; if (!c || e.pointerId !== c.pid) return;
      e.preventDefault();
      const liste = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (liste.length ? liste : [e]).forEach(ev => {
        const [x, y] = yerel(ev);
        if (Math.abs(x - c.son[0]) + Math.abs(y - c.son[1]) < 2) return;
        cizgi(c.r, c.k, c.s, c.son[0], c.son[1], x, y);
        c.son = [x, y]; tampon.push(x, y);
      });
      gonderPlan(false);
    }
    function birak(e) {
      const c = aktifCizgi; if (!c || (e && e.pointerId !== c.pid)) return;
      gonderPlan(true);
      aktifCizgi = null;
      if (o.bitti) o.bitti();
    }
    canvas.addEventListener('pointerdown', bas);
    canvas.addEventListener('pointermove', hareket);
    canvas.addEventListener('pointerup', birak);
    canvas.addEventListener('pointercancel', birak);
    canvas.addEventListener('lostpointercapture', birak);

    /* karşıdan gelen paketi çiz */
    function uygula(p) {
      if (olu || !p || !Array.isArray(p.p)) return;
      const r = renkTemiz(p.r), k = Math.max(1, Math.min(80, Number(p.k) || 10)), s = !!p.s;
      const pts = p.p.slice(0, 4000).map(sinir);
      let son = p.id != null ? uzak.get(p.id) : null;
      let i = 0;
      if (!son && pts.length >= 2) { nokta(r, k, s, pts[0], pts[1]); son = [pts[0], pts[1]]; i = 2; }
      for (; i + 1 < pts.length; i += 2) { cizgi(r, k, s, son[0], son[1], pts[i], pts[i + 1]); son = [pts[i], pts[i + 1]]; }
      if (son && p.id != null) { uzak.set(p.id, son); if (uzak.size > 200) uzak.delete(uzak.keys().next().value); }
      kirli = true;
    }
    function temizle() { zeminBoya(); kirli = false; uzak.clear(); }
    function resim(url) {
      return new Promise(coz => {
        if (typeof url !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(url)) { coz(false); return; }
        const im = new Image();
        im.onload = () => { if (olu) { coz(false); return; } g.drawImage(im, 0, 0, B, B); kirli = true; coz(true); };
        im.onerror = () => coz(false);
        im.src = url;
      });
    }
    /* küçük dataURL: önce PNG, büyükse JPEG kalitesi, sonra boyut düşer; `sinir` karakteri geçmez */
    function dataUrl(maks, sinirK) {
      maks = maks || 480; sinirK = sinirK || 60000;
      const c = document.createElement('canvas'); const cg = c.getContext('2d');
      for (const olcu of [maks, Math.round(maks * 0.75), Math.round(maks * 0.58), Math.round(maks * 0.42)]) {
        c.width = c.height = olcu; cg.fillStyle = ZEMIN; cg.fillRect(0, 0, olcu, olcu); cg.drawImage(canvas, 0, 0, olcu, olcu);
        let u = c.toDataURL('image/png'); if (u.length <= sinirK) return u;
        for (const q of [0.85, 0.72, 0.6, 0.48, 0.36]) { u = c.toDataURL('image/jpeg', q); if (u.length <= sinirK) return u; }
      }
      return null;
    }
    return {
      get renk() { return durum.renk; }, set renk(v) { durum.renk = renkTemiz(v); durum.silgi = false; },
      get kalin() { return durum.kalin; }, set kalin(v) { durum.kalin = Math.max(2, Math.min(60, Number(v) || 14)); },
      get silgi() { return durum.silgi; }, set silgi(v) { durum.silgi = !!v; },
      get kirli() { return kirli; },
      uygula, temizle, resim, dataUrl,
      yokEt() {
        olu = true; clearTimeout(gonderT);
        canvas.removeEventListener('pointerdown', bas); canvas.removeEventListener('pointermove', hareket);
        canvas.removeEventListener('pointerup', birak); canvas.removeEventListener('pointercancel', birak); canvas.removeEventListener('lostpointercapture', birak);
      }
    };
  };
})();
