/* js/bolum/tirnak-el.js — Cemre'nin eli: prosedürel, tek parça, iskeletli 3D el (three.js'e bağımlı değil).
   Tembel yüklenir (tirnak.js, three.min.js'ten sonra). Harici model/doku YOK.
   Yöntem: el, yuvarlak koni + elipsoit ilkellerinden kurulan bir işaretli uzaklık alanı (SDF) olarak tanımlanır.
   Parmaklar avuca yumuşak birleşir (ağ derisi, tenar kası, bilek kemiği çıkıntısı). Yüzey "surface nets" ile
   çıkarılır, her köşe bir Newton adımıyla yüzeye oturtulur, normaller alanın eğiminden gelir. Her köşeye kemik
   ağırlığı verilir (SkinnedMesh), eklem kırışıkları ve damarlar için gölgelendiriciye öznitelik yazılır.
   Birim: sahne birimi (≈ 4 mm). El yerel ekseni: X sağa (serçe tarafı, sağ el), Y el sırtı yukarı, -Z parmak ucu yönü,
   +Z bilek/dirsek. Kök (bilek) 0,0,0. Kalite: 0 kaba, 1 orta, 2 ince ızgara. Üretilen veri oturum boyunca saklanır. */
(() => {
  'use strict';
  const sinir = (v, a, b) => Math.max(a, Math.min(b, v));
  const v3 = (x, y, z) => [x, y, z];
  const ekle = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const cikar = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const carp = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const nokta = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const capraz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const uzun = (a) => Math.hypot(a[0], a[1], a[2]);
  const birim = (a) => { const l = uzun(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  /* ------------------------------------------------------------ iskelet (dinlenme pozu: parmaklar düz, hafif aralıklı)
     Ölçüler Cemre'nin referans fotoğraflarına göre: ince, uzun parmaklar; dar avuç; zarif bilek. */
  const PARMAK = [
    // baş parmak: kök = CMC (bilek tarafında), kemikler: tarak (meta), birinci, uç
    { ad: 'bas', kok: v3(-0.47, -0.07, -0.62), yon: birim(v3(-0.6, 0.0, -0.79)), uz: [0.98, 0.66, 0.58], r: [0.25, 0.212, 0.198, 0.186], ys: 0.86 },
    { ad: 'isaret', kok: v3(-0.6, 0.03, -2.28), yon: birim(v3(Math.sin(-0.1), 0, -Math.cos(-0.1))), uz: [0.98, 0.58, 0.5], r: [0.2, 0.177, 0.162, 0.152], ys: 0.84 },
    { ad: 'orta', kok: v3(-0.2, 0.05, -2.4), yon: birim(v3(Math.sin(-0.01), 0, -Math.cos(-0.01))), uz: [1.08, 0.66, 0.54], r: [0.205, 0.182, 0.168, 0.158], ys: 0.84 },
    { ad: 'yuzuk', kok: v3(0.2, 0.03, -2.32), yon: birim(v3(Math.sin(0.08), 0, -Math.cos(0.08))), uz: [1.0, 0.62, 0.52], r: [0.195, 0.172, 0.158, 0.148], ys: 0.84 },
    { ad: 'serce', kok: v3(0.56, -0.01, -2.1), yon: birim(v3(Math.sin(0.19), 0, -Math.cos(0.19))), uz: [0.78, 0.45, 0.44], r: [0.17, 0.148, 0.136, 0.128], ys: 0.84 }
  ];
  // tarak kemiği tabanları (avuç içinde, bileğe yakın)
  const TARAK_TABAN = [null, v3(-0.36, 0.0, -0.4), v3(-0.12, 0.02, -0.32), v3(0.14, 0.0, -0.36), v3(0.36, -0.02, -0.46)];
  // her parmağın eklemleri: J[0]=kök, J[1], J[2], J[3]=uç
  PARMAK.forEach(p => {
    p.J = [p.kok]; for (let k = 0; k < 3; k++) p.J.push(ekle(p.J[k], carp(p.yon, p.uz[k])));
    const yuk = p.ad === 'bas' ? birim([-0.62, 1, 0]) : [0, 1, 0]; p.yan = birim(capraz(p.yon, yuk)); p.ust = birim(capraz(p.yan, p.yon));
  });

  /* kemikler: 0 kök (bilek/avuç); parmak f için 1 + f*3 + k (k: 0 ilk kemik, 1 orta, 2 uç) */
  const KEMIK = [{ ad: 'kok', ebeveyn: -1, bas: v3(0, 0, 0) }];
  PARMAK.forEach((p, f) => { for (let k = 0; k < 3; k++) KEMIK.push({ ad: p.ad + k, ebeveyn: k === 0 ? 0 : KEMIK.length - 1, bas: p.J[k], son: p.J[k + 1], parmak: f, k }); });

  /* ------------------------------------------------------------ uzaklık alanı (SDF) */
  function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
  // yuvarlak koni: A→B, r1→r2, enine kesit eliptik (ust ekseni ys ile basık)
  function koniKur(A, B, r1, r2, ys, ustIpucu) {
    const ax = cikar(B, A), h = uzun(ax), a = birim(ax);
    let u = ustIpucu || [0, 1, 0]; u = birim(cikar(u, carp(a, nokta(u, a)))); const s = capraz(a, u);
    const bb = (r1 - r2) / h, aa = Math.sqrt(Math.max(1e-6, 1 - bb * bb));
    const m = Math.max(r1, r2) + 0.02;
    return { tur: 0, A, a, u, s, h, r1, r2, ys, bb, aa, kutu: [Math.min(A[0], B[0]) - m, Math.min(A[1], B[1]) - m, Math.min(A[2], B[2]) - m, Math.max(A[0], B[0]) + m, Math.max(A[1], B[1]) + m, Math.max(A[2], B[2]) + m] };
  }
  function koniD(c, x, y, z) {
    const px = x - c.A[0], py = y - c.A[1], pz = z - c.A[2];
    const ax = px * c.a[0] + py * c.a[1] + pz * c.a[2];
    const up = (px * c.u[0] + py * c.u[1] + pz * c.u[2]) / c.ys;
    const sd = px * c.s[0] + py * c.s[1] + pz * c.s[2];
    const q0 = Math.sqrt(sd * sd + up * up), q1 = ax;
    const k = -c.bb * q0 + c.aa * q1;
    if (k < 0) return Math.hypot(q0, q1) - c.r1;
    if (k > c.aa * c.h) return Math.hypot(q0, q1 - c.h) - c.r2;
    return q0 * c.aa + q1 * c.bb - c.r1;
  }
  // elipsoit (Y ekseni etrafında döndürülebilir)
  function elipsKur(M, R, don) { const c = Math.cos(don || 0), s = Math.sin(don || 0); const m = Math.max(R[0], R[1], R[2]) + 0.02; return { tur: 1, M, R, c, s, kutu: [M[0] - m, M[1] - m, M[2] - m, M[0] + m, M[1] + m, M[2] + m] }; }
  function elipsD(e, x, y, z) {
    let px = x - e.M[0], py = y - e.M[1], pz = z - e.M[2];
    const rx = px * e.c - pz * e.s, rz = px * e.s + pz * e.c; px = rx; pz = rz;
    const a = px / e.R[0], b = py / e.R[1], cc = pz / e.R[2];
    const k0 = Math.sqrt(a * a + b * b + cc * cc), k1 = Math.sqrt(a * a / (e.R[0] * e.R[0]) + b * b / (e.R[1] * e.R[1]) + cc * cc / (e.R[2] * e.R[2])) || 1e-6;
    return k0 * (k0 - 1) / k1;
  }
  const ilkD = (p, x, y, z) => p.tur ? elipsD(p, x, y, z) : koniD(p, x, y, z);

  // avuç parçaları
  const AVUC = [];
  for (let f = 1; f <= 4; f++) { const p = PARMAK[f]; AVUC.push(koniKur(TARAK_TABAN[f], ekle(p.kok, carp(p.yon, -0.02)), 0.2, p.r[0] * 1.02, 0.92)); }
  AVUC.push(elipsKur(v3(0.0, -0.03, -1.32), v3(0.8, 0.255, 1.02), 0));            // avuç gövdesi
  AVUC.push(elipsKur(v3(-0.5, -0.13, -0.86), v3(0.33, 0.25, 0.56), 0.55));         // tenar (baş parmak kası)
  AVUC.push(elipsKur(v3(0.5, -0.09, -1.02), v3(0.25, 0.21, 0.68), -0.08));         // hipotenar
  AVUC.push(koniKur(v3(0, -0.03, -0.18), v3(0, -0.05, 2.3), 0.56, 0.66, 0.66));    // bilek + ön kol
  AVUC.push(elipsKur(v3(0.53, 0.07, 0.04), v3(0.12, 0.11, 0.13), 0));               // dirsek kemiği çıkıntısı (bilekte)
  const BASP = PARMAK[0];
  const BAS_TARAK = koniKur(BASP.J[0], BASP.J[1], BASP.r[0], BASP.r[1] * 1.05, 0.9, [-0.62, 1, 0]);
  // parmak zincirleri
  const ZINCIR = PARMAK.map((p, f) => {
    const l = [];
    const bas = f === 0 ? 1 : 0;   // baş parmağın tarağı avuca ait
    for (let k = bas; k < 3; k++) l.push(koniKur(p.J[k], p.J[k + 1], p.r[k] * (k ? 0.985 : 1), p.r[k + 1], p.ys, f === 0 ? [-0.62, 1, 0] : null));
    // eklem tümsekleri (sırtta hafif)
    const tum = [];
    for (let k = 1; k <= 1; k++) tum.push(elipsKur(ekle(p.J[k], carp(p.ust, p.r[k] * 0.16)), [p.r[k] * 0.9, p.r[k] * p.ys * 0.78, p.r[k] * 1.25], Math.atan2(p.yon[0], -p.yon[2])));
    // parmak ucu yastığı (avuç tarafı, dolgun)
    const uc = ekle(ekle(p.J[3], carp(p.yon, -p.r[3] * 0.85)), carp(p.ust, -p.r[3] * 0.22));
    tum.push(elipsKur(uc, [p.r[3] * 0.98, p.r[3] * 0.78, p.r[3] * 1.15], Math.atan2(p.yon[0], -p.yon[2])));
    const kutu = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
    l.concat(tum).forEach(q => { for (let k = 0; k < 3; k++) { kutu[k] = Math.min(kutu[k], q.kutu[k]); kutu[k + 3] = Math.max(kutu[k + 3], q.kutu[k + 3]); } });
    return { l, tum, kutu };
  });
  const TUM = AVUC.concat([BAS_TARAK], ...ZINCIR.map(z => z.l.concat(z.tum)));
  const KUTU = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  TUM.forEach(p => { for (let k = 0; k < 3; k++) { KUTU[k] = Math.min(KUTU[k], p.kutu[k]); KUTU[k + 3] = Math.max(KUTU[k + 3], p.kutu[k + 3]); } });
  KUTU[5] = Math.min(KUTU[5], 1.75);   // ön kol kolun içinde biter
  KUTU[1] = Math.max(KUTU[1], -0.62); KUTU[4] = Math.min(KUTU[4], 0.52);
  function kutuD(b, x, y, z) { const dx = Math.max(b[0] - x, 0, x - b[3]), dy = Math.max(b[1] - y, 0, y - b[4]), dz = Math.max(b[2] - z, 0, z - b[5]); return Math.sqrt(dx * dx + dy * dy + dz * dz); }

  function parmakD(z, x, y, zz) {
    const kb = kutuD(z.kutu, x, y, zz); if (kb > 0.22) return kb;
    const l = z.l, t = z.tum;
    let d = koniD(l[0], x, y, zz);
    for (let k = 1; k < l.length; k++) d = smin(d, koniD(l[k], x, y, zz), 0.07);
    for (let k = 0; k < t.length; k++) d = smin(d, elipsD(t[k], x, y, zz), 0.07);
    return d;
  }
  function avucAlan(x, y, z) {
    let a = koniD(AVUC[0], x, y, z);
    for (let k = 1; k < 4; k++) a = smin(a, koniD(AVUC[k], x, y, z), 0.32);
    a = smin(a, elipsD(AVUC[4], x, y, z), 0.3);
    a = smin(a, elipsD(AVUC[5], x, y, z), 0.22);
    a = smin(a, elipsD(AVUC[6], x, y, z), 0.22);
    a = smin(a, koniD(AVUC[7], x, y, z), 0.42);
    return smin(a, elipsD(AVUC[8], x, y, z), 0.12);
  }
  function alan(x, y, z) {
    let a = koniD(AVUC[0], x, y, z);
    for (let k = 1; k < 4; k++) a = smin(a, koniD(AVUC[k], x, y, z), 0.32);
    a = smin(a, elipsD(AVUC[4], x, y, z), 0.3);
    a = smin(a, elipsD(AVUC[5], x, y, z), 0.22);
    a = smin(a, elipsD(AVUC[6], x, y, z), 0.22);
    a = smin(a, koniD(AVUC[7], x, y, z), 0.42);
    a = smin(a, elipsD(AVUC[8], x, y, z), 0.12);
    a = smin(a, koniD(BAS_TARAK, x, y, z), 0.3);
    let f = parmakD(ZINCIR[0], x, y, z);
    for (let k = 1; k < 5; k++) f = Math.min(f, parmakD(ZINCIR[k], x, y, z));
    let d = smin(a, f, 0.15);
    // ön kolun dirsek tarafı açık kalır (kol içinde)
    d = Math.max(d, z - 1.75);
    return d;
  }

  /* ------------------------------------------------------------ yüzey çıkarma: kaba→ince dar bant + surface nets */
  const onbellek = {};
  function uret(kalite) {
    kalite = sinir(Math.round(kalite == null ? 1 : kalite), 0, 2);
    if (onbellek[kalite]) return onbellek[kalite];
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const h = [0.05, 0.036, 0.027][kalite];
    const x0 = KUTU[0] - h * 2, y0 = KUTU[1] - h * 2, z0 = KUTU[2] - h * 2;
    const nx = Math.ceil((KUTU[3] - x0) / h) + 3, ny = Math.ceil((KUTU[4] - y0) / h) + 3, nz = Math.ceil((KUTU[5] - z0) / h) + 3;
    // kaba ızgara
    const K = 4, cx = Math.ceil(nx / K) + 1, cy = Math.ceil(ny / K) + 1, cz = Math.ceil(nz / K) + 1, H = h * K;
    const kaba = new Float32Array(cx * cy * cz);
    for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) kaba[(k * cy + j) * cx + i] = alan(x0 + i * H, y0 + j * H, z0 + k * H);
    const esik = H * 1.25;
    const F = new Float32Array(nx * ny * nz);
    for (let k = 0; k < nz; k++) {
      const kz = k / K, k0 = Math.min(cz - 2, Math.floor(kz)), fz = kz - k0;
      for (let j = 0; j < ny; j++) {
        const jy = j / K, j0 = Math.min(cy - 2, Math.floor(jy)), fy = jy - j0;
        for (let i = 0; i < nx; i++) {
          const ix = i / K, i0 = Math.min(cx - 2, Math.floor(ix)), fx = ix - i0;
          const c = (a, b, e) => kaba[((k0 + e) * cy + j0 + b) * cx + i0 + a];
          const v = ((c(0, 0, 0) * (1 - fx) + c(1, 0, 0) * fx) * (1 - fy) + (c(0, 1, 0) * (1 - fx) + c(1, 1, 0) * fx) * fy) * (1 - fz) + ((c(0, 0, 1) * (1 - fx) + c(1, 0, 1) * fx) * (1 - fy) + (c(0, 1, 1) * (1 - fx) + c(1, 1, 1) * fx) * fy) * fz;
          F[(k * ny + j) * nx + i] = Math.abs(v) > esik ? v : alan(x0 + i * h, y0 + j * h, z0 + k * h);
        }
      }
    }
    // surface nets: işaret değişen her hücreye bir köşe
    const idx = new Int32Array(nx * ny * nz).fill(-1);
    const pos = [];
    const KENAR = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    const KO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    const deg = new Float32Array(8);
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      let m = 0;
      for (let q = 0; q < 8; q++) { const o = KO[q]; const v = F[((k + o[2]) * ny + j + o[1]) * nx + i + o[0]]; deg[q] = v; if (v < 0) m |= 1 << q; }
      if (m === 0 || m === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [a, b] of KENAR) {
        const va = deg[a], vb = deg[b]; if ((va < 0) === (vb < 0)) continue;
        const t = va / (va - vb), A = KO[a], B = KO[b];
        sx += A[0] + (B[0] - A[0]) * t; sy += A[1] + (B[1] - A[1]) * t; sz += A[2] + (B[2] - A[2]) * t; n++;
      }
      idx[(k * ny + j) * nx + i] = pos.length / 3;
      pos.push(x0 + (i + sx / n) * h, y0 + (j + sy / n) * h, z0 + (k + sz / n) * h);
    }
    // yüzler: işaret değiştiren her ızgara kenarı için dörtgen
    const yuz = [];
    const al = (i, j, k) => idx[(k * ny + j) * nx + i];
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const v0 = F[(k * ny + j) * nx + i];
      // x kenarı
      const vx = F[(k * ny + j) * nx + i + 1];
      if ((v0 < 0) !== (vx < 0)) { const a = al(i, j - 1, k - 1), b = al(i, j, k - 1), c = al(i, j, k), e = al(i, j - 1, k); if (a >= 0 && b >= 0 && c >= 0 && e >= 0) { if (v0 < 0) yuz.push(a, b, c, a, c, e); else yuz.push(a, c, b, a, e, c); } }
      const vy = F[(k * ny + j + 1) * nx + i];
      if ((v0 < 0) !== (vy < 0)) { const a = al(i - 1, j, k - 1), b = al(i, j, k - 1), c = al(i, j, k), e = al(i - 1, j, k); if (a >= 0 && b >= 0 && c >= 0 && e >= 0) { if (v0 < 0) yuz.push(a, c, b, a, e, c); else yuz.push(a, b, c, a, c, e); } }
      const vz = F[((k + 1) * ny + j) * nx + i];
      if ((v0 < 0) !== (vz < 0)) { const a = al(i - 1, j - 1, k), b = al(i, j - 1, k), c = al(i, j, k), e = al(i - 1, j, k); if (a >= 0 && b >= 0 && c >= 0 && e >= 0) { if (v0 < 0) yuz.push(a, b, c, a, c, e); else yuz.push(a, c, b, a, e, c); } }
    }
    // köşeleri yüzeye oturt (Newton) ve normal = alanın eğimi
    const N = pos.length / 3, P = new Float32Array(pos), NOR = new Float32Array(N * 3), e = h * 0.25;
    for (let v = 0; v < N; v++) {
      let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      for (let it = 0; it < 2; it++) {
        const f = alan(x, y, z), gx = (alan(x + e, y, z) - f) / e, gy = (alan(x, y + e, z) - f) / e, gz = (alan(x, y, z + e) - f) / e;
        const g2 = gx * gx + gy * gy + gz * gz || 1;
        const adim = sinir(f / g2, -h * 0.6, h * 0.6); x -= gx * adim; y -= gy * adim; z -= gz * adim;
        if (it === 1) { const l = Math.sqrt(g2) || 1; NOR[v * 3] = gx / l; NOR[v * 3 + 1] = gy / l; NOR[v * 3 + 2] = gz / l; }
      }
      P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z;
    }
    const sonuc = Object.assign({ pos: P, nor: NOR, index: N > 65535 ? new Uint32Array(yuz) : new Uint16Array(yuz), h, kalite }, oznitelikler(P, NOR));
    sonuc.sure = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
    onbellek[kalite] = sonuc;
    return sonuc;
  }

  /* ------------------------------------------------------------ kemik ağırlıkları + gölgelendirici öznitelikleri
     kir (vec4): x = en yakın eklemden eksen boyunca uzaklık, y = yanal (-1..1), z = sırtlık (normal·üst), w = eklem türü
     (0 yok, 1 orta eklem, 2 uç eklem, 3 kök eklem/boğum, 4 baş parmak). renk: uç/boğum pembeliği. */
  function segUzak(v, A, B) { const ab = cikar(B, A), t = sinir(nokta(cikar(v, A), ab) / nokta(ab, ab), 0, 1); return { d: uzun(cikar(v, ekle(A, carp(ab, t)))), t }; }
  function oznitelikler(P, NOR) {
    const N = P.length / 3;
    const skinI = new Uint16Array(N * 4), skinW = new Float32Array(N * 4), renk = new Float32Array(N * 3), kir = new Float32Array(N * 4);
    const avucA = v3(0, 0, 0.6), avucB = v3(0, 0, -2.0);
    for (let n = 0; n < N; n++) {
      const v = [P[n * 3], P[n * 3 + 1], P[n * 3 + 2]], nr = [NOR[n * 3], NOR[n * 3 + 1], NOR[n * 3 + 2]];
      // yumuşak ağırlık: her kemik parçasının GERÇEK yüzeyine uzaklık (avuç: avuç alanı) → 1/(d+ε)^4, en güçlü 4 kemik
      const ad = [];
      ad.push([0, Math.max(0, avucAlan(v[0], v[1], v[2]))]);
      ad.push([1, Math.max(0, koniD(BAS_TARAK, v[0], v[1], v[2]))]);
      PARMAK.forEach((p, f) => { ZINCIR[f].l.forEach((c, q) => { const k = f === 0 ? q + 1 : q; ad.push([1 + f * 3 + k, Math.max(0, koniD(c, v[0], v[1], v[2]))]); }); });
      const EPS = 0.035;
      let ag = ad.map(([j, dd]) => [j, 1 / Math.pow(dd + EPS, 4)]);
      ag.sort((x, y) => y[1] - x[1]); ag = ag.slice(0, 4);
      // en yakın parmak (kırışık ve renk için)
      let en = null, enD = 1e9;
      ad.forEach(([j, dd]) => { if (j > 0 && dd < enD) { enD = dd; const K = KEMIK[j]; en = { f: K.parmak, k: K.k }; } });
      const avD = ad[0][1];
      if (en && enD < avD + 0.02) {
        const p = PARMAK[en.f];
        // kırışık öznitelikleri: parmağın eklemleri (k=0 boğum, 1 orta, 2 uç)
        let enE = 1e9, tur = 0, yanal = 0, sirt = 0;
        const eklemler = en.f === 0 ? [[1, 4], [2, 4]] : [[0, 3], [1, 1], [2, 2]];
        eklemler.forEach(([j, tt]) => {
          const Jj = p.J[j], s = nokta(cikar(v, Jj), p.yon);
          if (Math.abs(s) < Math.abs(enE)) { enE = s; tur = tt; const r = p.r[j]; yanal = nokta(cikar(v, Jj), p.yan) / r; sirt = nokta(nr, p.ust); }
        });
        kir[n * 4] = sinir(enE, -1, 1); kir[n * 4 + 1] = sinir(yanal, -2, 2); kir[n * 4 + 2] = sirt; kir[n * 4 + 3] = tur;
        // renk: parmak ucu pembeliği, boğum/eklem kızarıklığı
        const ucUz = uzun(cikar(v, p.J[3])), ucP = Math.pow(sinir(1 - ucUz / (p.uz[2] * 0.95), 0, 1), 1.4);
        let eklemP = 0; [1, 2].forEach(j => { const dd = uzun(cikar(v, p.J[j])) / (p.r[j] * 1.5); eklemP = Math.max(eklemP, Math.exp(-dd * dd) * Math.max(0, sirt)); });
        const bogum = en.f > 0 ? Math.exp(-Math.pow(uzun(cikar(v, p.J[0])) / (p.r[0] * 1.3), 2)) * Math.max(0, nr[1]) : 0;
        const kz = Math.max(ucP * 0.8, eklemP * 0.55, bogum * 0.42);
        renk[n * 3] = 1; renk[n * 3 + 1] = 1 - kz * 0.17; renk[n * 3 + 2] = 1 - kz * 0.15;
      } else {
        kir[n * 4 + 3] = 0; kir[n * 4 + 2] = nr[1];
        // avuç içi daha pembe, bilek sırtı biraz daha açık
        const avucIci = Math.max(0, -nr[1]), kz = avucIci * 0.32;
        renk[n * 3] = 1; renk[n * 3 + 1] = 1 - kz * 0.17; renk[n * 3 + 2] = 1 - kz * 0.13;
      }
      ag.sort((a, b) => b[1] - a[1]);
      for (let q = 0; q < 4; q++) { skinI[n * 4 + q] = ag[q] ? ag[q][0] : 0; skinW[n * 4 + q] = ag[q] ? ag[q][1] : 0; }
      const top = skinW[n * 4] + skinW[n * 4 + 1] + skinW[n * 4 + 2] + skinW[n * 4 + 3] || 1;
      for (let q = 0; q < 4; q++) skinW[n * 4 + q] /= top;
    }
    return { skinI, skinW, renk, kir };
  }

  /* yüzey yüksekliği: p noktasından -yon doğrultusunda inince yüzeye kaç birimde varılır (tırnak yerleşimi için) */
  function yuzeyeIn(p, yon, maks) {
    let t = 0; const m = maks || 1;
    for (let k = 0; k < 64 && t < m; k++) { const q = ekle(p, carp(yon, -t)); const d = alan(q[0], q[1], q[2]); if (d < 0.0008) return t; t += Math.max(0.002, d * 0.8); }
    return t;
  }

  /* ------------------------------------------------------------ pozlar (eklem açıları, radyan)
     parmak: [kök bükme, kök açılma, orta bükme, uç bükme]; baş parmak: [tarak bükme, tarak açılma, tarak dönme, kök bükme, uç bükme]
     kok: elin dünyadaki duruşu { x,y,z (konum), rx, ry, rz (Euler XYZ) }; kam: önerilen kamera { th, ph, r (oran) } */
  const POZ = {
    duz: { ad: 'Düz el', bas: [-0.05, 0.08, -0.25, 0.08, 0.06], p: [[0.06, 0.02, 0.1, 0.05], [0.06, 0, 0.1, 0.05], [0.06, 0, 0.1, 0.05], [0.08, -0.03, 0.1, 0.06]], kok: { x: 0, y: 0.33, z: 1.6, rx: -0.02, ry: 0, rz: 0, rw: 0 }, kam: { th: 0, ph: 0.62, r: 1 } },
    bak: { ad: 'Tırnaklara bak', bas: [0.55, 0.35, 0.5, 0.35, 0.25], p: [[1.2, -0.04, 1.45, 0.3], [1.25, 0, 1.48, 0.3], [1.28, 0.04, 1.46, 0.3], [1.24, 0.08, 1.4, 0.3]], kok: { x: 0.2, y: 0.6, z: 0.9, rx: 0.55, ry: 0.15, rz: 3.14, rw: 0 }, kam: { th: 0.05, ph: 0.75, r: 0.7, hedefParmak: true } },
    yana: { ad: 'Yana eğik', bas: [0.3, 0.15, 0.4, 0.25, 0.18], p: [[0.08, 0.04, 0.12, 0.06], [0.08, 0.01, 0.12, 0.06], [0.1, -0.02, 0.12, 0.06], [0.12, -0.06, 0.12, 0.06]], kok: { x: 0.2, y: 0.55, z: 0.8, rx: 1.22, ry: 0.25, rz: 0, rw: -0.38 }, kam: { th: 0, ph: 1.28, r: 1.05 } },
    kalp: { ad: 'Parmak kalbi', bas: [0.15, 0.75, 0.35, 0.05, 0.0], p: [[0.6, 0.05, 1.1, 0.5], [1.5, 0, 1.6, 0.5], [1.5, 0.05, 1.6, 0.48], [1.45, 0.1, 1.55, 0.45]], kok: { x: 0, y: 0.55, z: 0.8, rx: 1.3, ry: 0.85, rz: 0, rw: 0 }, kam: { th: 0, ph: 1.25, r: 0.85 } },
    fincan: { ad: 'Fincan tutma', bas: [0.2, 0.1, 0.2, 0.25, 0.15], p: [[0.75, 0.0, 1.05, 0.45], [0.8, 0, 1.1, 0.45], [0.82, 0.03, 1.05, 0.42], [0.35, 0.12, 0.6, 0.25]], kok: { x: 1.3, y: 1.0, z: 0.2, rx: -1.5708, ry: 0.3, rz: 0, rw: -1.5708 }, kam: { th: 0, ph: 1.2, r: 1.0 }, fincan: true },
    selam: { ad: 'Selam', bas: [0.15, -0.15, 0.1, 0.1, 0.1], p: [[0.04, 0.06, 0.06, 0.04], [0.03, 0, 0.06, 0.04], [0.04, -0.05, 0.06, 0.04], [0.05, -0.12, 0.06, 0.05]], kok: { x: 0, y: 0.5, z: 0.8, rx: 1.42, ry: 0, rz: 0, rw: 0.05 }, kam: { th: 0, ph: 1.32, r: 1.1 }, salla: true }
  };
  const POZ_SIRA = ['duz', 'bak', 'yana', 'kalp', 'fincan', 'selam'];

  window.CD = window.CD || {};
  CD.tirnakEl = { uret, PARMAK, KEMIK, POZ, POZ_SIRA, KUTU, alan, yuzeyeIn, surum: 1 };
})();
