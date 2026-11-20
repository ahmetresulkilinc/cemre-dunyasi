/* js/bolum/tirnak-3d.js — Tırnak Salonu 3D sahnesi (three.js r158, js/vendor/three.min.js).
   Tembel yüklenir: tirnak.js salon 3D açılırken önce three.min.js'i, sonra bu dosyayı bir kez ekler.
   Harici model, doku ya da istek YOK: el, tırnak, masa, şişeler, UV lamba ve stüdyo ortamı kodla üretilir.
   2D boyama motoru yeniden kullanılır: her tırnağın deseni tirnak.js'in tirnakCiz'iyle bir 2D tuvale çizilir,
   bu tuval tırnak yüzeyinin CanvasTexture'ı olur (UV = tırnak yerel koordinatı). Dokunma ışınla tırnak UV'sine çevrilir.
   Birim: 2D sahne pikseli × K. Tırnak yerel ekseni: X = 2D x (yan), Z = 2D y (uç -Z yönünde), Y = yükseklik. */
(() => {
  'use strict';
  const K = 0.01;
  const SURUM = 1;

  function destek() {
    try {
      if (!window.WebGLRenderingContext) return false;
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return false;
      const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
      return true;
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------ küçük yardımcılar */
  const sinir = (v, a, b) => Math.max(a, Math.min(b, v));
  const kolay = (p) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  function tohumla(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16); return ((h >>> 0) % 100000) / 100000; }
  function deger(x, y, per, s) {   // sarmal (tile edilebilir) değer gürültüsü
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const h = (a, b) => hash2(((a % per) + per) % per, ((b % per) + per) % per, s);
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
  }

  function kur(kap, o) {
    const THREE = window.THREE;
    if (!THREE) throw new Error('three yok');
    const V3 = THREE.Vector3, V2 = THREE.Vector2;
    /* ------------------------------------------------------------ kaynak takibi (unmount'ta hepsi temizlenir) */
    const geolar = new Set(), malzemeler = new Set(), dokular = new Set();
    const G = (g) => { geolar.add(g); return g; };
    const MT = (m) => { malzemeler.add(m); return m; };
    const TX = (t) => { dokular.add(t); return t; };
    function geoBirak(g) { if (g && geolar.has(g)) { g.dispose(); geolar.delete(g); } }
    function mtBirak(m) { if (m && malzemeler.has(m)) { m.dispose(); malzemeler.delete(m); } }
    function txBirak(t) { if (t && dokular.has(t)) { t.dispose(); dokular.delete(t); } }

    /* ------------------------------------------------------------ kalite */
    const mobil = !!(window.CD && CD.dokunmatik) || Math.min(innerWidth, innerHeight) < 700;
    let kaliteMod = o.kalite == null ? 'oto' : o.kalite;
    let kalite = kaliteMod === 'oto' ? (mobil ? 1 : 2) : sinir(Number(kaliteMod) || 0, 0, 2);
    const dprAl = () => [1, Math.min(1.5, window.devicePixelRatio || 1), Math.min(2, window.devicePixelRatio || 1)][kalite];
    const DOKU_GEN = () => [150, 200, 256][kalite];

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .82;
    renderer.shadowMap.enabled = kalite > 0;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(dprAl());
    const tuval = renderer.domElement;
    tuval.className = 'tirnak-katman tirnak-3d tirnak-dokunma';
    tuval.setAttribute('role', 'img');
    tuval.setAttribute('aria-label', 'Üç boyutlu tırnak masası: tırnağa dokunup seç, araçla üstüne çiz. Boş yeri sürükleyince masa döner, iki parmakla yakınlaşır.');
    kap.appendChild(tuval);

    const sahne = new THREE.Scene();
    const kamera = new THREE.PerspectiveCamera(34, 1, 0.05, 60);
    const raycaster = new THREE.Raycaster();

    /* ------------------------------------------------------------ prosedürel dokular */
    function normalDoku(boy, hFn, guc, tekrar) {
      const h = new Float32Array(boy * boy);
      for (let y = 0; y < boy; y++) for (let x = 0; x < boy; x++) h[y * boy + x] = hFn(x, y, boy);
      const c = document.createElement('canvas'); c.width = c.height = boy; const g = c.getContext('2d'); const im = g.createImageData(boy, boy), a = im.data;
      const al = (x, y) => h[((y + boy) % boy) * boy + ((x + boy) % boy)];
      for (let y = 0; y < boy; y++) for (let x = 0; x < boy; x++) {
        const dx = (al(x + 1, y) - al(x - 1, y)) * guc, dy = (al(x, y + 1) - al(x, y - 1)) * guc;
        const l = Math.hypot(dx, dy, 1), i = (y * boy + x) * 4;
        a[i] = (-dx / l * .5 + .5) * 255; a[i + 1] = (dy / l * .5 + .5) * 255; a[i + 2] = (1 / l * .5 + .5) * 255; a[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      const t = TX(new THREE.CanvasTexture(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace;
      if (tekrar) t.repeat.set(tekrar[0], tekrar[1]);
      return t;
    }
    // pul (glitter) normal haritası: her pul rastgele eğik bir ayna
    function pulDoku(boy, hucre, seed, tekrar) {
      const c = document.createElement('canvas'); c.width = c.height = boy; const g = c.getContext('2d'); const im = g.createImageData(boy, boy), a = im.data;
      const n = Math.ceil(boy / hucre), r = tohumla(seed), noktalar = [];
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const eg = .25 + r() * .75, aci = r() * Math.PI * 2;
        noktalar.push({ x: (i + r()) * hucre, y: (j + r()) * hucre, nx: Math.cos(aci) * eg, ny: Math.sin(aci) * eg, k: r() < .12 });
      }
      for (let y = 0; y < boy; y++) for (let x = 0; x < boy; x++) {
        const ci = Math.floor(x / hucre), cj = Math.floor(y / hucre); let en = 1e9, p = null;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ii = (ci + di + n) % n, jj = (cj + dj + n) % n, q = noktalar[jj * n + ii];
          let dx = x - q.x, dy = y - q.y; if (dx > boy / 2) dx -= boy; if (dx < -boy / 2) dx += boy; if (dy > boy / 2) dy -= boy; if (dy < -boy / 2) dy += boy;
          const m = dx * dx + dy * dy; if (m < en) { en = m; p = q; }
        }
        const nx = p.k ? 0 : p.nx, ny = p.k ? 0 : p.ny, nz = Math.sqrt(Math.max(.05, 1 - nx * nx - ny * ny)), i = (y * boy + x) * 4;
        a[i] = (nx * .5 + .5) * 255; a[i + 1] = (ny * .5 + .5) * 255; a[i + 2] = (nz * .5 + .5) * 255; a[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      const t = TX(new THREE.CanvasTexture(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.repeat.set(tekrar[0], tekrar[1]);
      return t;
    }
    const harita = {};
    function haritaAl(ad) {
      if (harita[ad]) return harita[ad];
      const B = kalite === 0 ? 128 : 256;
      if (ad === 'pulInce') harita[ad] = pulDoku(B, B / 42, 11, [2, 4]);
      else if (ad === 'pulIri') harita[ad] = pulDoku(B, B / 16, 23, [1.5, 3]);
      else if (ad === 'yansitici') harita[ad] = pulDoku(B, B / 64, 31, [2.5, 5]);
      else if (ad === 'kazak') harita[ad] = normalDoku(B, (x, y, b) => { const W = b / 8, H = b / 12; const u = (x % W) / W, hx = Math.abs(u - .5) * 2; const v = ((y / H + (u < .5 ? u : 1 - u) * 1.1) % 1); return Math.sin(v * Math.PI) * (1 - hx * .35) + (hx > .9 ? -.4 : 0); }, 2.2, [2, 4]);
      else if (ad === 'seker') harita[ad] = normalDoku(B, (x, y, b) => { const s = b / 26; const ci = Math.floor(x / s), cj = Math.floor(y / s); let m = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = ci + di, jj = cj + dj, cx = (ii + .2 + hash2(ii, jj, 3) * .6) * s, cy = (jj + .2 + hash2(ii, jj, 4) * .6) * s, r = s * (.3 + hash2(ii, jj, 5) * .35), dd = Math.hypot(x - cx, y - cy); if (dd < r) m = Math.max(m, Math.sqrt(1 - (dd / r) * (dd / r))); } return m; }, 3.2, [2, 4]);
      else if (ad === 'kum') harita[ad] = normalDoku(B, (x, y, b) => deger(x / 2.2, y / 2.2, b / 2.2, 7) * .8 + deger(x / 6, y / 6, b / 6, 8) * .4, 2.4, [2, 4]);
      else if (ad === 'catlak') harita[ad] = normalDoku(B, (x, y, b) => { const s = b / 7; const ci = Math.floor(x / s), cj = Math.floor(y / s); let f1 = 1e9, f2 = 1e9; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = ci + di, jj = cj + dj, pp = 7, px = (ii + hash2(((ii % pp) + pp) % pp, ((jj % pp) + pp) % pp, 9)) * s, py = (jj + hash2(((ii % pp) + pp) % pp, ((jj % pp) + pp) % pp, 10)) * s, dd = Math.hypot(x - px, y - py); if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd; } return Math.min(1, (f2 - f1) / 3); }, 2.6, [1.5, 3]);
      else if (ad === 'ten') harita[ad] = normalDoku(B, (x, y, b) => deger(x / 1.6, y / 1.6, b / 1.6, 12) * .5 + deger(x / 5, y / 5, b / 5, 13) * .5, .9, [6, 6]);
      else if (ad === 'havlu') harita[ad] = normalDoku(B, (x, y, b) => { const s = b / 40; const ci = Math.floor(x / s), cj = Math.floor(y / s); const cx = (ci + .5) * s + (hash2(ci, cj, 2) - .5) * s * .5, cy = (cj + .5) * s + (hash2(ci, cj, 6) - .5) * s * .5; const dd = Math.hypot(x - cx, y - cy) / (s * .62); return Math.max(0, 1 - dd); }, 3, [6, 6]);
      else if (ad === 'orgu') harita[ad] = normalDoku(B, (x, y, b) => { const W = b / 14; const u = (x % W) / W; return Math.pow(Math.sin(u * Math.PI), .6) * (.8 + .2 * Math.sin(y / b * Math.PI * 24 + (Math.floor(x / W) % 2) * 2)); }, 2.4, [3, 2]);
      else if (ad === 'puruz') harita[ad] = normalDoku(B, (x, y, b) => deger(x, y, b, 21), 2, [6, 1]);
      return harita[ad];
    }
    function isiltiDoku() {
      if (harita.isilti) return harita.isilti;
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      const rg = g.createRadialGradient(32, 32, 0, 32, 32, 30); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.2, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(32, 32, 62, 32); g.quadraticCurveTo(32, 32, 32, 62); g.quadraticCurveTo(32, 32, 2, 32); g.quadraticCurveTo(32, 32, 32, 2); g.fill();
      const t = TX(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; harita.isilti = t; return t;
    }

    /* ------------------------------------------------------------ stüdyo ortamı (PMREM, prosedürel) */
    let pmrem = new THREE.PMREMGenerator(renderer), ortamRT = null;
    const ISIK = {
      gun: { arka: '#E9D3D8', sis: '#E6CED4', anahtar: '#FFE1C4', aG: 2.0, kG: 1.6, kenar: '#FFF1E6', gok: '#FFF3EA', yer: '#C9939F', hG: .38, dolgu: '#D6E2FF', dG: .35, ortam: 1.0, kutu: 3.2 },
      studyo: { arka: '#DADDE7', sis: '#D6DAE4', anahtar: '#F6F8FF', aG: 2.4, kG: 1.9, kenar: '#F4F8FF', gok: '#F4F7FF', yer: '#B9BCC8', hG: .4, dolgu: '#FFE1EA', dG: .45, ortam: 1.2, kutu: 4.2 },
      los: { arka: '#241730', sis: '#211529', anahtar: '#B9A8FF', aG: .55, kG: .5, kenar: '#C9A8FF', gok: '#5A4A8A', yer: '#2A1B33', hG: .22, dolgu: '#FF8FC6', dG: .25, ortam: .28, kutu: 1.4 }
    };
    function ortamKur(isikId) {
      const I = ISIK[isikId] || ISIK.gun;
      const es = new THREE.Scene();
      const kure = new THREE.SphereGeometry(20, 32, 16);
      const renk = [], ust = new THREE.Color(I.gok), alt = new THREE.Color(I.yer), p = kure.attributes.position;
      for (let k = 0; k < p.count; k++) { const t = sinir(p.getY(k) / 20 * .5 + .5, 0, 1); const c = alt.clone().lerp(ust, t).multiplyScalar(.32); renk.push(c.r, c.g, c.b); }
      kure.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3));
      const km = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
      es.add(new THREE.Mesh(kure, km));
      const panel = (w, h, x, y, z, guc, r) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(r || '#FFFFFF').multiplyScalar(guc), side: THREE.DoubleSide }); const g = new THREE.PlaneGeometry(w, h); const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.lookAt(0, 0, 0); es.add(me); return me; };
      panel(10, 6, 0, 12, 2, I.kutu);                        // tepe softbox
      panel(4, 9, -11, 5, -3, I.kutu * .7, '#FFF3E8');        // pencere
      panel(3, 7, 10, 4, 4, I.kutu * .45, '#FFE3EC');         // pembe dolgu
      const halka = new THREE.Mesh(new THREE.TorusGeometry(2.2, .18, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFFFFF').multiplyScalar(I.kutu * 1.3) }));
      halka.position.set(3, 9, 8); halka.lookAt(0, 0, 0); es.add(halka);      // halka ışık: parlak tırnakta yuvarlak yansıma
      const rt = pmrem.fromScene(es, .035);
      es.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) n.material.dispose(); });
      if (ortamRT) ortamRT.dispose();
      ortamRT = rt; sahne.environment = rt.texture;
    }

    /* ------------------------------------------------------------ ışıklar */
    const hemi = new THREE.HemisphereLight('#FFF6EE', '#E9B9C4', .75); sahne.add(hemi);
    const anahtar = new THREE.DirectionalLight('#FFF0E2', 2.7);
    anahtar.castShadow = true; anahtar.shadow.mapSize.set(1024, 1024); anahtar.shadow.bias = -0.0004; anahtar.shadow.normalBias = 0.015;
    Object.assign(anahtar.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: .5, far: 16 });
    sahne.add(anahtar); sahne.add(anahtar.target);
    const dolgu = new THREE.DirectionalLight('#DDE8FF', .55); dolgu.position.set(-4, 3, 3); sahne.add(dolgu);
    // kenar (arka) ışık: tırnak parlamalarını ve parmak kenarlarını öne çıkarır
    const kenarIsik = new THREE.DirectionalLight('#FFF4EC', 1.5); kenarIsik.position.set(-1.2, 3.4, -6); sahne.add(kenarIsik);
    const uvIsik = new THREE.PointLight('#A57BFF', 0, 3, 1.6); sahne.add(uvIsik);
    const gezenIsik = new THREE.PointLight('#FFFFFF', 0, 5, 1.4); sahne.add(gezenIsik);
    let isikAci = .8, isikTur = 'gun';
    function anahtarKonum(ek) { const a = isikAci + (ek || 0); anahtar.position.set(Math.cos(a) * 4.2, 6.2, Math.sin(a) * 2.4 + 3.4); anahtar.target.position.set(0, 0, -.3); }
    function golgeKalite() {
      renderer.shadowMap.enabled = kalite > 0;
      anahtar.castShadow = kalite > 0;
      const b = kalite === 2 ? 1024 : 512;
      if (anahtar.shadow.mapSize.x !== b) { anahtar.shadow.mapSize.set(b, b); if (anahtar.shadow.map) { anahtar.shadow.map.dispose(); anahtar.shadow.map = null; } }
    }

    /* ------------------------------------------------------------ masa, havlu, ürünler, UV lamba */
    const dunya = new THREE.Group(); sahne.add(dunya);
    const masaTuval = document.createElement('canvas'); masaTuval.width = masaTuval.height = kalite === 0 ? 512 : 1024;
    const masaDoku = TX(new THREE.CanvasTexture(masaTuval)); masaDoku.colorSpace = THREE.SRGBColorSpace; masaDoku.wrapS = masaDoku.wrapT = THREE.MirroredRepeatWrapping; masaDoku.repeat.set(2.4, 2.4);
    masaDoku.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const masaMt = MT(new THREE.MeshPhysicalMaterial({ map: masaDoku, roughness: .3, clearcoat: .5, clearcoatRoughness: .2 }));
    const masa = new THREE.Mesh(G(new THREE.PlaneGeometry(16, 16)), masaMt); masa.rotation.x = -Math.PI / 2; masa.receiveShadow = true; dunya.add(masa);
    function yuvarlakKutu(w, d, h, r, bev) {
      const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 6 });
      g.rotateX(-Math.PI / 2); g.translate(0, bev, 0);
      return G(g);
    }
    // havlu
    const havluTuval = document.createElement('canvas'); havluTuval.width = havluTuval.height = 256;
    (() => { const g = havluTuval.getContext('2d'); const lg = g.createLinearGradient(0, 0, 0, 256); lg.addColorStop(0, '#FBE3E8'); lg.addColorStop(1, '#F2C9D2'); g.fillStyle = lg; g.fillRect(0, 0, 256, 256); const r = tohumla(5); for (let k = 0; k < 900; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(170,110,125,.10)'; g.beginPath(); g.arc(r() * 256, r() * 256, .6 + r() * 1.4, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 22, 256, 10); g.fillStyle = 'rgba(214,150,166,.5)'; g.fillRect(0, 36, 256, 4); })();
    const havluDoku = TX(new THREE.CanvasTexture(havluTuval)); havluDoku.colorSpace = THREE.SRGBColorSpace;
    const havlu = new THREE.Mesh(yuvarlakKutu(3.3, 3.1, .03, .25, .05), MT(new THREE.MeshPhysicalMaterial({ map: havluDoku, roughness: .96, sheen: 1, sheenColor: new THREE.Color('#FFE6EC'), sheenRoughness: .8, normalMap: haritaAl('havlu'), normalScale: new V2(.8, .8) })));
    havlu.receiveShadow = true; havlu.castShadow = false; dunya.add(havlu);
    // oje şişeleri (cam + içinde renkli oje + kapak)
    const urunler = new THREE.Group(); dunya.add(urunler);
    const camMt = () => MT(new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .04, metalness: 0, transmission: kalite > 0 ? 1 : 0, transparent: kalite === 0, opacity: kalite === 0 ? .35 : 1, thickness: .25, ior: 1.5, clearcoat: 1, envMapIntensity: 1.3 }));
    const siseler = [];
    function sise(x, z, s, kapakRenk) {
      const gr = new THREE.Group(); gr.position.set(x, 0, z); gr.scale.setScalar(s);
      const profil = [[0, 0], [.27, 0], [.31, .03], [.32, .1], [.32, .42], [.3, .5], [.12, .55], [.1, .6], [0, .6]].map(p => new V2(p[0], p[1]));
      const cam = new THREE.Mesh(G(new THREE.LatheGeometry(profil, 28)), camMt()); cam.castShadow = true; gr.add(cam);
      const sivi = [[0, .03], [.26, .03], [.28, .08], [.28, .4], [.25, .45], [0, .45]].map(p => new V2(p[0], p[1]));
      const svm = MT(new THREE.MeshPhysicalMaterial({ color: '#F4CFD8', roughness: .2, clearcoat: .6 }));
      const sv = new THREE.Mesh(G(new THREE.LatheGeometry(sivi, 24)), svm); gr.add(sv);
      const kapak = new THREE.Mesh(G(new THREE.CylinderGeometry(.13, .14, .62, 24)), MT(new THREE.MeshPhysicalMaterial({ color: kapakRenk, roughness: .18, metalness: kapakRenk === '#D9B24A' ? 1 : 0, clearcoat: 1 })));
      kapak.position.y = .9; kapak.castShadow = true; gr.add(kapak);
      urunler.add(gr); siseler.push(svm); return gr;
    }
    sise(-3.0, -3.6, .95, '#2A2530'); sise(-2.2, -4.1, .78, '#D9B24A'); sise(-3.7, -2.9, .7, '#F2EDF0');
    // kütikül yağı (kehribar damlalık şişe)
    (() => {
      const gr = new THREE.Group(); gr.position.set(3.4, 0, -3.6);
      const p = [[0, 0], [.2, 0], [.22, .04], [.22, .46], [.12, .52], [.08, .58], [0, .58]].map(q => new V2(q[0], q[1]));
      const g = new THREE.Mesh(G(new THREE.LatheGeometry(p, 24)), MT(new THREE.MeshPhysicalMaterial({ color: '#C77A22', roughness: .08, transmission: kalite > 0 ? .8 : 0, thickness: .3, ior: 1.5, attenuationColor: new THREE.Color('#9A5212'), attenuationDistance: .5, clearcoat: 1 })));
      g.castShadow = true; gr.add(g);
      const b = new THREE.Mesh(G(new THREE.SphereGeometry(.12, 16, 12)), MT(new THREE.MeshPhysicalMaterial({ color: '#2A2530', roughness: .45, sheen: .5 }))); b.scale.set(1, 1.5, 1); b.position.y = .78; b.castShadow = true; gr.add(b);
      const e = new THREE.Mesh(G(new THREE.CylinderGeometry(.1, .1, .1, 16)), MT(new THREE.MeshPhysicalMaterial({ color: '#D9B24A', metalness: 1, roughness: .2 }))); e.position.y = .6; gr.add(e);
      urunler.add(gr);
    })();
    // pamuk ve törpü
    const pamukMt = MT(new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 1, sheen: 1, sheenColor: new THREE.Color('#FFFFFF'), sheenRoughness: 1, normalMap: haritaAl('kum'), normalScale: new V2(.6, .6) }));
    const pamuklar = [];
    [[-3.0, 2.4, .34], [-2.5, 2.8, .28]].forEach(([x, z, r]) => { const m = new THREE.Mesh(G(new THREE.SphereGeometry(r, 20, 12)), pamukMt); m.scale.set(1, .38, 1); m.position.set(x, r * .34, z); m.castShadow = true; m.receiveShadow = true; urunler.add(m); pamuklar.push(m); });
    const torpu = new THREE.Mesh(yuvarlakKutu(1.7, .2, .025, .09, .02), MT(new THREE.MeshPhysicalMaterial({ color: '#EFA8BA', roughness: .95, normalMap: haritaAl('puruz'), normalScale: new V2(1, 1) })));
    torpu.position.set(3.2, 0, 2.2); torpu.rotation.y = .9; torpu.castShadow = true; urunler.add(torpu);
    // fincan (fincan pozunda)
    const fincan = new THREE.Group(); fincan.visible = false; dunya.add(fincan);
    (() => {
      const p = [[0, 0], [.5, 0], [.55, .04], [.72, .5], [.78, .95], [.74, .97], [.68, .52], [.5, .1], [0, .1]].map(q => new V2(q[0], q[1]));
      const por = MT(new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .15, clearcoat: 1, sheen: .3 }));
      const g = new THREE.Mesh(G(new THREE.LatheGeometry(p, 40)), por); g.castShadow = true; g.receiveShadow = true; fincan.add(g);
      const kahve = new THREE.Mesh(G(new THREE.CircleGeometry(.7, 32)), MT(new THREE.MeshPhysicalMaterial({ color: '#7A4A2E', roughness: .15, clearcoat: 1 }))); kahve.rotation.x = -Math.PI / 2; kahve.position.y = .82; fincan.add(kahve);
      const kulp = new THREE.Mesh(G(new THREE.TorusGeometry(.22, .06, 10, 24, Math.PI * 1.3)), por); kulp.position.set(.82, .55, 0); kulp.rotation.z = -Math.PI * .65; kulp.castShadow = true; fincan.add(kulp);
      const tabak = new THREE.Mesh(G(new THREE.CylinderGeometry(1.2, 1.0, .06, 48)), por); tabak.position.y = .03; tabak.receiveShadow = true; fincan.add(tabak);
    })();
    // UV/LED lamba: kemer biçimli kabuk, içinde mor LED şeridi
    const lamba = new THREE.Group(); dunya.add(lamba);
    const lambaLed = MT(new THREE.MeshStandardMaterial({ color: '#2A2340', emissive: new THREE.Color('#9B6BFF'), emissiveIntensity: 0 }));
    (() => {
      const kabukMt = MT(new THREE.MeshPhysicalMaterial({ color: '#F7F3FA', roughness: .25, clearcoat: 1, side: THREE.DoubleSide }));
      const kabuk = new THREE.Mesh(G(new THREE.CylinderGeometry(1.2, 1.2, 1.9, 40, 1, true, -Math.PI / 2, Math.PI)), kabukMt);
      kabuk.rotation.x = Math.PI / 2; kabuk.rotation.y = 0; kabuk.position.y = 0; kabuk.castShadow = true;
      const kemer = new THREE.Group(); kemer.add(kabuk); kemer.rotation.z = 0;
      kabuk.rotation.set(Math.PI / 2, 0, 0); kabuk.rotateY(Math.PI / 2);
      lamba.add(kemer);
      const taban = new THREE.Mesh(yuvarlakKutu(2.55, 2.1, .04, .2, .03), kabukMt); lamba.add(taban);
      for (let k = 0; k < 9; k++) { const a = Math.PI * (.15 + k * .7 / 8); const led = new THREE.Mesh(G(new THREE.BoxGeometry(.08, .04, .08)), lambaLed); led.position.set(Math.cos(a) * 1.12, Math.sin(a) * 1.12, -.6 + (k % 3) * .6); lamba.add(led); }
      const ekran = new THREE.Mesh(G(new THREE.BoxGeometry(.5, .02, .22)), MT(new THREE.MeshStandardMaterial({ color: '#1C1726', emissive: new THREE.Color('#B98CFF'), emissiveIntensity: .4 }))); ekran.position.set(0, 1.21, .5); lamba.add(ekran);
    })();
    const LAMBA_PARK = { x: 3.9, y: 0, z: -1.6, s: .5, r: -.5 };
    lamba.position.set(LAMBA_PARK.x, 0, LAMBA_PARK.z); lamba.scale.setScalar(LAMBA_PARK.s); lamba.rotation.y = LAMBA_PARK.r;
    // ılık su kâsesi (hazırlık)
    const kase = new THREE.Group(); kase.visible = false; dunya.add(kase);
    const suMt = MT(new THREE.MeshPhysicalMaterial({ color: '#BFE6F5', roughness: .05, transmission: 0, transparent: true, opacity: .5, clearcoat: 1, normalMap: haritaAl('kum'), normalScale: new V2(.15, .15), depthWrite: false }));
    (() => {
      const su = new THREE.Mesh(G(new THREE.CircleGeometry(1.25, 40)), suMt); su.rotation.x = -Math.PI / 2; su.name = 'su'; kase.add(su);
      const kenar = new THREE.Mesh(G(new THREE.TorusGeometry(1.3, .07, 12, 56)), MT(new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .1, clearcoat: 1 }))); kenar.rotation.x = Math.PI / 2; kase.add(kenar);
    })();

    /* ------------------------------------------------------------ ten malzemesi (sheen + sınırda sıcak yarı saydamlık) */
    const tenMt = MT(new THREE.MeshPhysicalMaterial({ color: '#F6D7C6', vertexColors: true, roughness: .56, sheen: .9, sheenRoughness: .42, sheenColor: new THREE.Color('#FFB8A8'), clearcoat: .06, clearcoatRoughness: .5, normalMap: haritaAl('ten'), normalScale: new V2(.22, .22), envMapIntensity: .45 }));
    const tenU = { uAlt: { value: new THREE.Color('#E5786C') } };
    tenMt.onBeforeCompile = (sh) => {
      sh.uniforms.uAlt = tenU.uAlt;
      sh.fragmentShader = 'uniform vec3 uAlt;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  { float fr = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.5); totalEmissiveRadiance += uAlt * fr * 0.16; }');
    };
    tenMt.customProgramCacheKey = () => 'tirnakTen';
    const kolMt = MT(new THREE.MeshPhysicalMaterial({ color: '#D9CCF0', roughness: .92, sheen: 1, sheenColor: new THREE.Color('#F4ECFF'), sheenRoughness: .7, normalMap: haritaAl('orgu'), normalScale: new V2(1.2, 1.2) }));

    /* ------------------------------------------------------------ el modeli */
    let eller = [];          // { taraf, kok, parmaklar:[{...}], tirnaklar:[nail] }
    let tirnaklar = new Map();   // 'sag2' → nail
    const yukari = new V3(0, 1, 0);
    function tenRengiAyarla(hex) {
      tenMt.color.set(hex).lerp(new THREE.Color('#E0957A'), .2);     // sıcak alt ton
      const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl);
      tenMt.sheenColor.setHSL(.02, .7, Math.min(.85, hsl.l + .12));
      tenU.uAlt.value.setHSL(.01, .65, sinir(hsl.l * .75, .2, .6));
    }
    function kapsul(r, uz, renkUc, renkKok) {
      const g = new THREE.CapsuleGeometry(r, Math.max(.001, uz), 6, 16);
      const p = g.attributes.position, renk = [], top = uz / 2 + r;
      for (let k = 0; k < p.count; k++) {
        const t = sinir((p.getY(k) + top) / (2 * top), 0, 1);       // 0 kök, 1 uç
        const kiz = Math.max(renkKok * Math.pow(1 - t, 6), renkUc * Math.pow(t, 5));
        renk.push(1, 1 - kiz * .32, 1 - kiz * .3);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3));
      return G(g);
    }
    /* parmak tüpü: kökten (avucun içinden) uca CatmullRom eğrisi; kesit üstte biraz yassı elips; eklemlerde şişkinlik;
       renk: uçta ve eklemlerde pembelik, eklem üstünde ince kırışık çizgileri (köşe rengi, geometri halkası yok) */
    function parmakTupu(P, gen, basParmak) {
      const geri = new V3().subVectors(P[0], P[1]).normalize();
      const kok = P[0].clone().addScaledVector(geri, gen[0] * .9).add(new V3(0, -.04, 0));
      const egri = new THREE.CatmullRomCurve3([kok, P[0], P[1], P[2], P[3]], false, 'centripetal');
      const L = egri.getLength();
      // eklemlerin eğri üstündeki uzaklıkları
      const nokta = [kok, P[0], P[1], P[2], P[3]]; const mesafe = [0]; for (let k = 1; k < 5; k++) mesafe.push(mesafe[k - 1] + nokta[k].distanceTo(nokta[k - 1]));
      const olc = L / mesafe[4]; for (let k = 0; k < 5; k++) mesafe[k] *= olc;
      const ucR = gen[3] / 2;
      // örnekleme: düzgün + eklem çevresinde sık (kırışık çizgileri için)
      const S = new Set(); for (let k = 0; k <= 60; k++) S.add(+(k / 60 * L).toFixed(4));
      [2, 3].forEach(j => { for (let q = -8; q <= 8; q++) S.add(+(mesafe[j] + q * .006).toFixed(4)); });
      for (let q = 1; q <= 10; q++) S.add(+(L - ucR + ucR * q / 10).toFixed(4));
      const sl = [...S].filter(x => x >= 0 && x <= L).sort((a, b) => a - b);
      const genAt = (s) => {   // kök/eklem genişlikleri arasında yumuşak geçiş + eklem şişkinliği
        let w;
        if (s <= mesafe[1]) w = gen[0] * (1.08 - .08 * s / Math.max(1e-6, mesafe[1]));
        else { let j = 1; while (j < 4 && s > mesafe[j + 1]) j++; const t = (s - mesafe[j]) / Math.max(1e-6, mesafe[j + 1] - mesafe[j]), e = t * t * (3 - 2 * t); w = gen[j - 1] + (gen[j] - gen[j - 1]) * e; }
        [[1, basParmak ? .05 : .08], [2, .06], [3, .045]].forEach(([j, a]) => { const dd = (s - mesafe[j]) / (gen[0] * .45); w *= 1 + a * Math.exp(-dd * dd); });
        return w;
      };
      const M = 20, pos = [], renk = [], idx = [];
      const yuk = new V3(0, 1, 0);
      sl.forEach((s, ri) => {
        const t = s / L, c = egri.getPointAt(t), T = egri.getTangentAt(t).normalize();
        let sx = new V3().crossVectors(T, yuk); if (sx.lengthSq() < 1e-6) sx.set(1, 0, 0); sx.normalize();
        const ux = new V3().crossVectors(sx, T).normalize();
        let w = genAt(s) / 2;
        if (s > L - ucR) { const q = (s - (L - ucR)) / ucR; w *= Math.sqrt(Math.max(0, 1 - q * q)); }
        // renk: uç pembeliği, eklem pembeliği, kırışıklar (yalnız sırtta)
        const ucPembe = Math.pow(sinir((s - (L - ucR * 2.4)) / (ucR * 2.4), 0, 1), 1.5) * .55;
        let eklemPembe = 0, kirisik = 0;
        [1, 2, 3].forEach(j => { const dd = (s - mesafe[j]) / (gen[0] * .5); eklemPembe = Math.max(eklemPembe, Math.exp(-dd * dd) * (j === 1 ? .35 : .28)); });
        [2, 3].forEach(j => { [-1, 0, 1].forEach(q => { const dd = (s - mesafe[j] - q * .016) / .0045; kirisik = Math.max(kirisik, Math.exp(-dd * dd) * (q ? .55 : .8)); }); });
        for (let k = 0; k < M; k++) {
          const a = k / M * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
          const ry = w * (sa > 0 ? .74 : .86);
          const p = c.clone().addScaledVector(sx, ca * w).addScaledVector(ux, sa * ry);
          pos.push(p.x, p.y, p.z);
          const sirt = Math.max(0, sa), kz = Math.max(ucPembe, eklemPembe * sirt) , kr = kirisik * sirt * (1 - Math.abs(ca) * .6) * .16;
          renk.push(1 - kr, 1 - kz * .2 - kr * 1.15, 1 - kz * .2 - kr * 1.1);
        }
        if (ri > 0) { const b0 = (ri - 1) * M, b1 = ri * M; for (let k = 0; k < M; k++) { const k2 = (k + 1) % M; idx.push(b0 + k, b1 + k, b0 + k2, b0 + k2, b1 + k, b1 + k2); } }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    function yon3(a, egim) { return new V3(Math.sin(a) * Math.cos(egim), -Math.sin(egim), -Math.cos(a) * Math.cos(egim)).normalize(); }
    function taban3(f) { const s = new V3().crossVectors(f, yukari); if (s.lengthSq() < 1e-6) s.set(1, 0, 0); s.normalize(); const u = new V3().crossVectors(s, f).normalize(); return { s, u }; }
    const POZ_EGIM = {
      duz: [[.03, .03, .03], [.06, .08, .06], [.06, .08, .06], [.06, .08, .06], [.07, .09, .06]],
      kalp: [[.05, .05, .05], [.18, .2, .12], [.05, .04, .03], [.05, .04, .03], [.05, .04, .03]],
      fincan: [[.05, .04, .03], [.28, .32, .22], [.3, .34, .24], [.3, .34, .24], [.28, .3, .22]]
    };
    function elKur(orn, poz, avucNoktalar) {
      const kok = new THREE.Group();
      const m = orn.m, s = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
      const M4 = new THREE.Matrix4().set(m[0], 0, m[2], (m[4] - 180) * K, 0, s, 0, 0, m[1], 0, m[3], (m[5] - 300) * K, 0, 0, 0, 1);
      kok.matrixAutoUpdate = false; kok.matrix.copy(M4);
      const ic = new THREE.Group(); kok.add(ic);       // vitrinde dönen iç grup
      const el = { taraf: orn.taraf, kok, ic, parmaklar: [], olcek: s };
      // avuç: yuvarlatılmış yassı kütle
      const sekil = new THREE.Shape(); const pts = avucNoktalar.map(p => new V2(p[0] * K, p[1] * K));
      sekil.moveTo(pts[0].x, pts[0].y); sekil.splineThru(pts.slice(1).concat([pts[0]]));
      const avucG = new THREE.ExtrudeGeometry(sekil, { depth: .16, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 5, curveSegments: 28 });
      avucG.rotateX(Math.PI / 2); avucG.translate(0, .3, 0);
      // kubbe: el sırtı ortada ve eklemlere doğru yüksek, kenarlara ve bileğe doğru alçalır
      { const ap0 = avucG.attributes.position; for (let k = 0; k < ap0.count; k++) { const x = ap0.getX(k), y = ap0.getY(k), z = ap0.getZ(k); if (y < .06) continue; const nx = (x - 1.98) / 1.15, nz = sinir((z - 3.0) / 2.4, 0, 1), f = Math.max(.25, (1 - .42 * nx * nx) * (1 - .3 * nz)); ap0.setY(k, .04 + (y - .04) * f); } avucG.computeVertexNormals(); }
      const ac = []; const ap = avucG.attributes.position; for (let k = 0; k < ap.count; k++) ac.push(1, 1, 1); avucG.setAttribute('color', new THREE.Float32BufferAttribute(ac, 3));
      const avuc = new THREE.Mesh(G(avucG), tenMt); avuc.castShadow = true; avuc.receiveShadow = true; avuc.userData.el = orn.taraf; ic.add(avuc);
      // bilek + örgü kol
      const bilek = new THREE.Mesh(kapsul(.62, 1.6, 0, 0), tenMt); bilek.rotation.x = Math.PI / 2; bilek.scale.set(1, 1, .42); bilek.position.set(1.98, .2, 5.1); bilek.castShadow = true; bilek.userData.el = orn.taraf; ic.add(bilek);
      const kol = new THREE.Mesh(G(new THREE.CylinderGeometry(.92, .98, 2.6, 36, 1, false)), kolMt); kol.rotation.x = Math.PI / 2; kol.scale.set(1, 1, .5); kol.position.set(2.02, .26, 6.1); kol.castShadow = true; ic.add(kol);
      const kolAgiz = new THREE.Mesh(G(new THREE.TorusGeometry(.93, .1, 10, 36)), kolMt); kolAgiz.scale.set(1, .52, 1); kolAgiz.position.set(2.02, .26, 4.82); ic.add(kolAgiz);
      // parmaklar: her parmak tek parça pürüzsüz tüp (eklemlerde yumuşak şişkinlik, uca doğru incelen yassı kesit)
      const egim = POZ_EGIM[poz] || POZ_EGIM.duz;
      const ACIK = poz === 'duz' ? [1, 1.32, 1, 1.32, 1.3] : [1, 1, 1, 1, 1];     // parmaklar doğal aralıklı dursun
      orn.parmaklar.forEach((p, i) => {
        const yuk = i === 0 ? .24 : .3;
        const P = [new V3(p.k[0] * K, yuk, p.k[1] * K)];
        const gen = (i === 0 ? [p.w, p.w * .9, p.w * .84, p.w * .8] : [p.w * .98, p.w * .9, p.w * .84, p.w * .78]).map(w => w * K);
        let topEgim = 0; const yonler = [];
        for (let j = 0; j < 3; j++) { topEgim += egim[i][j]; const f = yon3(p.a[j] * ACIK[i] + (i === 2 ? 0 : 0), topEgim); yonler.push(f); P.push(P[j].clone().addScaledVector(f, p.l[j] * K)); }
        const tup = parmakTupu(P, gen, i === 0);
        const me = new THREE.Mesh(G(tup), tenMt); me.castShadow = true; me.receiveShadow = true; me.userData.el = orn.taraf; ic.add(me);
        const segmanlar = yonler.map((f, j) => { const { s: sx, u } = taban3(f); return { f, s: sx, u, r: (gen[j] + gen[j + 1]) / 4 }; });
        el.parmaklar.push({ P, segmanlar, gen });
      });
      dunya.add(kok);
      kok.updateMatrixWorld(true);
      return el;
    }

    /* ------------------------------------------------------------ tırnak geometrisi (C eğrisi, kalınlık, serbest kenar) */
    const tarama = document.createElement('canvas').getContext('2d');
    function yuzeyY(x, y, P) {         // piksel cinsinden yükseklik (üst yüzey)
      const nx = sinir(x / P.hw, -1.2, 1.2);
      let h = P.th + .35 - P.cc * nx * nx * P.hw * .3;
      const sv = -y;
      if (sv > P.yatak) { const k = (sv - P.yatak) / P.nw; h -= k * k * P.nw * .05; }
      if (y > 0) h -= (y / P.c) * (P.th + .4);
      if (P.apex) h += P.apex * Math.exp(-Math.pow((sv - P.L * .45) / (P.L * .38), 2)) * Math.max(0, 1 - nx * nx);
      return h;
    }
    function tirnakGeo(P) {
      const yol = o.yol(P.sekil, P.nw, P.L), hw = P.nw / 2, R = kalite === 0 ? 26 : 36, C = kalite === 0 ? 10 : 14;
      const yUst = -P.L - .6, yAlt = P.c - .25, satir = [];
      const N = 44, X0 = -hw * 1.12, X1 = hw * 1.12, st = (X1 - X0) / N;
      const ince = (ic, dis, y) => { for (let s = 0; s < 7; s++) { const m = (ic + dis) / 2; if (tarama.isPointInPath(yol, m, y)) ic = m; else dis = m; } return ic; };
      for (let j = 0; j <= R * 2; j++) {
        const tt = j / (R * 2), w = tt < .3 ? Math.pow(tt / .3, 1.6) * .3 : tt;
        const y = yUst + (yAlt - yUst) * w;
        let a = null, b = null;
        for (let k = 0; k <= N; k++) { const x = X0 + st * k; if (tarama.isPointInPath(yol, x, y)) { if (a === null) a = x; b = x; } }
        if (a === null) continue;
        satir.push([ince(a, a - st, y), ince(b, b + st, y), y]);
      }
      // satırları R+1'e indir (eşit aralık değil, sıra korunur)
      const sat = []; for (let j = 0; j <= R; j++) sat.push(satir[Math.round(j / R * (satir.length - 1))]);
      const pos = [], uv = [], idx = [];
      const bx = P.kutu.bx, by = P.kutu.by, bw = P.kutu.bw, bh = P.kutu.bh;
      const ekle = (x, y, h) => { pos.push(x * K, h * K, y * K); uv.push((x - bx) / bw, 1 - (y - by) / bh); return pos.length / 3 - 1; };
      const ust = [], alt = [];
      sat.forEach((r, j) => { ust.push([]); alt.push([]); for (let k = 0; k <= C; k++) { const x = r[0] + (r[1] - r[0]) * k / C; const h = yuzeyY(x, r[2], P); ust[j].push(ekle(x, r[2], h)); } });
      sat.forEach((r, j) => { for (let k = 0; k <= C; k++) { const x = r[0] + (r[1] - r[0]) * k / C; const h = yuzeyY(x, r[2], P) - P.th; alt[j].push(ekle(x, r[2], h)); } });
      for (let j = 0; j < R; j++) for (let k = 0; k < C; k++) {
        const a = ust[j][k], b = ust[j][k + 1], c = ust[j + 1][k], d2 = ust[j + 1][k + 1];
        idx.push(a, c, b, b, c, d2);
        const a2 = alt[j][k], b2 = alt[j][k + 1], c2 = alt[j + 1][k], e2 = alt[j + 1][k + 1];
        idx.push(a2, b2, c2, b2, e2, c2);
      }
      // yan duvarlar (serbest kenar kalınlığı): ayrı köşeler, keskin gölge
      const halka = [];
      for (let k = 0; k <= C; k++) halka.push([0, k]);
      for (let j = 1; j <= R; j++) halka.push([j, C]);
      for (let k = C - 1; k >= 0; k--) halka.push([R, k]);
      for (let j = R - 1; j >= 1; j--) halka.push([j, 0]);
      for (let q = 0; q < halka.length; q++) {
        const [j1, k1] = halka[q], [j2, k2] = halka[(q + 1) % halka.length];
        const r1 = sat[j1], r2 = sat[j2], x1 = r1[0] + (r1[1] - r1[0]) * k1 / C, x2 = r2[0] + (r2[1] - r2[0]) * k2 / C;
        const h1 = yuzeyY(x1, r1[2], P), h2 = yuzeyY(x2, r2[2], P);
        const A = ekle(x1, r1[2], h1), B = ekle(x2, r2[2], h2), A2 = ekle(x1, r1[2], h1 - P.th), B2 = ekle(x2, r2[2], h2 - P.th);
        idx.push(A, B, A2, B, B2, A2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
      return G(g);
    }

    /* ------------------------------------------------------------ tırnak malzemesi (kedi gözü gölgelendiricisi dahil) */
    function tirnakMalzemesi() {
      const m = MT(new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: .35, metalness: 0, clearcoat: .3, clearcoatRoughness: .1, ior: 1.5, thickness: .02, envMapIntensity: 1 }));
      const u = { uKedi: { value: new THREE.Vector4(0, .5, -.5, .5) }, uKediG: { value: 0 }, uKediRenk: { value: new THREE.Color('#FFFFFF') }, uHL: { value: new V2(.14, .3) }, uZaman: { value: 0 } };
      m.userData.u = u;
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = 'varying vec2 vYerel;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vYerel = position.xz;');
        sh.fragmentShader = 'varying vec2 vYerel;\nuniform vec4 uKedi;\nuniform float uKediG;\nuniform vec3 uKediRenk;\nuniform vec2 uHL;\nuniform float uZaman;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', [
          '#include <emissivemap_fragment>',
          '  if (uKediG > 0.0) {',
          '    vec2 q = vYerel - vec2(uKedi.x * uHL.x, -uKedi.y * uHL.y);',
          '    float perp = dot(q, vec2(cos(uKedi.z), sin(uKedi.z))) / uHL.x;',
          '    vec3 vn = normalize(vNormal);',
          '    perp += vn.x * 0.9 + vn.y * 0.25;',
          '    float w = max(0.06, uKedi.w * 0.34);',
          '    float band = exp(-perp * perp / (w * w));',
          '    vec2 hc = floor(vYerel * 900.0);',
          '    float tane = step(0.93, fract(sin(dot(hc, vec2(12.9898, 78.233))) * 43758.5453));',
          '    totalEmissiveRadiance += uKediRenk * (band * 1.5 + band * tane * 2.0 + tane * 0.12) * uKediG;',
          '  }'
        ].join('\n'));
      };
      m.customProgramCacheKey = () => 'tirnakTirnak';
      return m;
    }
    function malzemeUygula(n, m3, simdi) {
      const mt = n.mt, u = mt.userData.u;
      let islakK = 0;
      if (n.islakBas) { islakK = 1 - (simdi - n.islakBas) / 5200; if (islakK <= 0) { islakK = 0; n.islakBas = 0; } }
      if (m3.islak) islakK = Math.max(islakK, .7);
      const pul = m3.pul;
      const normal = m3.doku ? haritaAl(m3.doku) : pul === 'ince' ? haritaAl('pulInce') : pul === 'iri' ? haritaAl('pulIri') : pul === 'yansitici' ? haritaAl('yansitici') : null;
      if (mt.normalMap !== normal) { mt.normalMap = normal; mt.needsUpdate = true; }
      const ns = m3.doku === 'kazak' ? .9 : m3.doku === 'seker' ? .8 : m3.doku === 'kum' ? .6 : m3.doku === 'catlak' ? .5 : pul === 'iri' ? .75 : pul ? .55 : 0;
      mt.normalScale.set(ns, ns);
      let rough = m3.rough, cc = m3.cc, ccR = m3.ccR;
      if (islakK > 0) { rough = rough + (.03 - rough) * islakK; cc = Math.max(cc, islakK); ccR = ccR * (1 - islakK); }
      mt.roughness = rough; mt.metalness = m3.metal;
      mt.clearcoat = cc; mt.clearcoatRoughness = ccR;
      mt.iridescence = m3.irid; mt.iridescenceIOR = 1.6; mt.iridescenceThicknessRange = m3.iridAralik || [180, 620];
      mt.sheen = m3.sheen || 0; if (m3.sheenRenk) mt.sheenColor.set(m3.sheenRenk); mt.sheenRoughness = .45;
      const tr = kalite > 0 ? (m3.tr || 0) : 0;
      mt.transmission = tr; mt.thickness = (m3.kal || .02); if (m3.zayifRenk) { mt.attenuationColor.set(m3.zayifRenk); mt.attenuationDistance = .25; } else mt.attenuationDistance = Infinity;
      mt.envMapIntensity = m3.metal > .8 ? 1.6 : 1.05;
      if (m3.glow) { mt.emissiveMap = mt.map; mt.emissive.set(m3.glowRenk || '#FFFFFF'); mt.emissiveIntensity = isikTur === 'los' ? 1.9 : .18; }
      else { if (mt.emissiveMap) { mt.emissiveMap = null; mt.needsUpdate = true; } mt.emissive.set('#000000'); mt.emissiveIntensity = 1; }
      if (m3.kedi) { u.uKediG.value = isikTur === 'los' ? 1.4 : 1; u.uKedi.value.set(m3.kedi.x || 0, m3.kedi.y == null ? .5 : m3.kedi.y, m3.kedi.aci || 0, m3.kedi.gen || .5); u.uKediRenk.value.set(m3.kediRenk || '#E6ECFF'); }
      else u.uKediG.value = 0;
      return islakK > 0;
    }

    /* ------------------------------------------------------------ 3D süsler (taş, inci, charm, jel heykel) */
    const susGeoOnbellek = new Map(), susMtOnbellek = new Map();
    function sekil2(fn) { const s = new THREE.Shape(); fn(s); return s; }
    const KALP = () => sekil2(s => { s.moveTo(0, -.5); s.bezierCurveTo(-.62, -.05, -.48, .48, 0, .2); s.bezierCurveTo(.48, .48, .62, -.05, 0, -.5); });
    const DAMLA = () => sekil2(s => { s.moveTo(0, .55); s.bezierCurveTo(.45, .1, .42, -.5, 0, -.5); s.bezierCurveTo(-.42, -.5, -.45, .1, 0, .55); });
    const YILDIZ = () => sekil2(s => { for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? .22 : .5; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (k) s.lineTo(x, y); else s.moveTo(x, y); } s.closePath(); });
    const AY = () => sekil2(s => { s.absarc(0, 0, .5, Math.PI * .3, Math.PI * 1.7, false); s.absarc(.18, 0, .4, Math.PI * 1.62, Math.PI * .38, true); });
    const KELEBEK = () => sekil2(s => { s.moveTo(0, .05); s.bezierCurveTo(-.15, .5, -.6, .45, -.5, .05); s.bezierCurveTo(-.55, -.3, -.15, -.45, 0, -.05); s.bezierCurveTo(.15, -.45, .55, -.3, .5, .05); s.bezierCurveTo(.6, .45, .15, .5, 0, .05); });
    const FIYONK = () => sekil2(s => { s.moveTo(0, 0); s.bezierCurveTo(-.2, .3, -.55, .3, -.5, 0); s.bezierCurveTo(-.55, -.3, -.2, -.3, 0, 0); s.bezierCurveTo(.2, -.3, .55, -.3, .5, 0); s.bezierCurveTo(.55, .3, .2, .3, 0, 0); });
    const MEKIK = () => sekil2(s => { s.moveTo(0, .5); s.quadraticCurveTo(.32, 0, 0, -.5); s.quadraticCurveTo(-.32, 0, 0, .5); });
    function yatayExtrude(sh, derin, bev, bs, seg) { const g = new THREE.ExtrudeGeometry(sh, { depth: derin, bevelEnabled: true, bevelThickness: bev, bevelSize: bs, bevelSegments: seg || 2, curveSegments: 10 }); g.rotateX(-Math.PI / 2); g.translate(0, bev, 0); return g; }
    function tasLathe(seg) { const p = [[0, -.3], [.5, 0], [.5, .035], [.31, .17], [0, .17]].map(q => new V2(q[0], q[1])); const g = new THREE.LatheGeometry(p, seg); g.translate(0, .3, 0); return g; }
    function birlestir(list) {   // basit geometri birleştirme (aynı öznitelikler)
      const pos = [], nor = [], idx = []; let ofs = 0;
      list.forEach(g => { const gg = g.index ? g : g; const p = gg.attributes.position, n = gg.attributes.normal; for (let k = 0; k < p.count; k++) { pos.push(p.getX(k), p.getY(k), p.getZ(k)); nor.push(n.getX(k), n.getY(k), n.getZ(k)); } if (gg.index) for (let k = 0; k < gg.index.count; k++) idx.push(gg.index.getX(k) + ofs); else for (let k = 0; k < p.count; k++) idx.push(k + ofs); ofs += p.count; g.dispose(); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
    }
    function susGeo(id) {
      if (susGeoOnbellek.has(id)) return susGeoOnbellek.get(id);
      let g;
      const kure = (r, w, h) => new THREE.SphereGeometry(r, w || 18, h || 12);
      switch (id) {
        case 'tasS': case 'tasM': case 'tasL': case 'tasMini': g = tasLathe(10); break;
        case 'tasOpal': g = kure(.5, 20, 12); g.scale(1, .55, 1); g.translate(0, .22, 0); break;
        case 'tasOval': g = tasLathe(12); g.scale(.78, 1, 1.12); break;
        case 'tasMekik': g = yatayExtrude(MEKIK(), .1, .12, .06, 1); break;
        case 'tasKare': g = tasLathe(4); g.rotateY(Math.PI / 4); g.scale(1.2, 1, 1.2); break;
        case 'tasUcgen': g = tasLathe(3); g.scale(1.15, 1, 1.15); break;
        case 'kristalDamla': g = yatayExtrude(DAMLA(), .08, .14, .07, 1); break;
        case 'kristalKalp': g = yatayExtrude(KALP(), .08, .14, .07, 1); break;
        case 'inci': case 'inciMini': g = kure(.5, 24, 16); g.translate(0, .32, 0); break;
        case 'inciYarim': g = new THREE.SphereGeometry(.5, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, .8, 1); break;
        case 'inciDamla': { const p = []; for (let k = 0; k <= 12; k++) { const t = k / 12, a = t * Math.PI; p.push(new V2(Math.sin(a) * .42 * (1 - t * .45), -Math.cos(a) * .5)); } g = new THREE.LatheGeometry(p, 20); g.rotateX(Math.PI / 2); g.translate(0, .28, 0); break; }
        case 'inciSira': { const l = []; for (let k = 0; k < 5; k++) { const s = kure(.1, 14, 10); s.translate(-.4 + k * .2, .08, 0); l.push(s); } g = birlestir(l); break; }
        case 'kalp3d': g = yatayExtrude(KALP(), .12, .18, .12, 5); break;
        case 'heykelDamla': g = kure(.5, 24, 16); g.scale(1, .55, 1); g.translate(0, .14, 0); break;
        case 'fiyonk3d': { const a = kure(.25, 16, 10); a.scale(1.1, .55, .7); a.translate(-.26, .1, 0); const b = kure(.25, 16, 10); b.scale(1.1, .55, .7); b.translate(.26, .1, 0); const c = kure(.11, 12, 8); c.translate(0, .12, 0); const t1 = new THREE.BoxGeometry(.12, .05, .32); t1.rotateY(.5); t1.translate(-.1, .04, .2); const t2 = new THREE.BoxGeometry(.12, .05, .32); t2.rotateY(-.5); t2.translate(.1, .04, .2); g = birlestir([a, b, c, t1.toNonIndexed(), t2.toNonIndexed()]); break; }
        case 'cicek3d': { const l = []; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; const p = kure(.2, 14, 8); p.scale(.9, .38, 1.35); p.rotateY(-a); p.translate(Math.sin(a) * .24, .06, Math.cos(a) * .24); l.push(p); } g = birlestir(l); break; }
        case 'heykelGul': { const l = []; for (let k = 0; k < 9; k++) { const a = k * 2.4, r = .06 + k * .045; const p = new THREE.TorusGeometry(r, .045 + k * .004, 6, 14, Math.PI * 1.25); p.rotateX(-Math.PI / 2 + .25); p.rotateY(a); p.translate(0, .16 - k * .012, 0); l.push(p); } g = birlestir(l); break; }
        case 'charmYildiz': g = yatayExtrude(YILDIZ(), .06, .04, .03, 2); break;
        case 'charmKalp': g = yatayExtrude(KALP(), .06, .04, .03, 2); break;
        case 'charmAy': g = yatayExtrude(AY(), .06, .04, .03, 2); break;
        case 'charmKelebek': g = yatayExtrude(KELEBEK(), .05, .04, .03, 2); break;
        case 'charmFiyonk': g = yatayExtrude(FIYONK(), .06, .05, .04, 2); break;
        case 'charmPati': { const l = []; const a = kure(.2, 14, 8); a.scale(1.2, .4, 1); a.translate(0, .06, .1); l.push(a); [[-.27, -.08], [-.1, -.27], [.1, -.27], [.27, -.08]].forEach(([x, z]) => { const s = kure(.09, 12, 8); s.scale(1, .5, 1); s.translate(x, .05, z); l.push(s); }); g = birlestir(l); break; }
        case 'halka': g = new THREE.TorusGeometry(.38, .07, 10, 32); g.rotateX(Math.PI / 2); g.translate(0, .05, 0); break;
        case 'civi': g = new THREE.SphereGeometry(.5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, .5, 1); break;
        case 'zincir': { const l = []; for (let k = 0; k < 7; k++) { const t = new THREE.TorusGeometry(.065, .022, 6, 14); t.scale(1.5, 1, 1); if (k % 2) t.rotateX(Math.PI / 2); t.translate(-.43 + k * .143, .05, 0); l.push(t); } g = birlestir(l); break; }
        default: g = tasLathe(8);
      }
      G(g); susGeoOnbellek.set(id, g); return g;
    }
    const METAL = ['charmYildiz', 'charmKalp', 'charmAy', 'charmKelebek', 'charmFiyonk', 'charmPati', 'halka', 'civi', 'zincir'];
    const INCI = ['inci', 'inciMini', 'inciYarim', 'inciDamla', 'inciSira'];
    const JEL = ['kalp3d', 'fiyonk3d', 'cicek3d', 'heykelGul', 'heykelDamla'];
    function parlakMi(hex) { const c = new THREE.Color(hex); return (c.r + c.g + c.b) / 3 > .86; }
    function susMt(id, renk, opak) {
      const tur = METAL.includes(id) ? 'metal' : INCI.includes(id) ? 'inci' : JEL.includes(id) ? 'jel' : id === 'tasOpal' ? 'opal' : 'tas';
      const key = tur + renk + (opak < 1 ? opak.toFixed(2) : '') + kalite;
      if (susMtOnbellek.has(key)) return susMtOnbellek.get(key);
      let m;
      const ek = opak < 1 ? { transparent: true, opacity: opak } : {};
      if (tur === 'metal') m = new THREE.MeshPhysicalMaterial(Object.assign({ color: parlakMi(renk) ? '#E3BE5C' : renk, metalness: 1, roughness: .16, clearcoat: .4 }, ek));
      else if (tur === 'inci') m = new THREE.MeshPhysicalMaterial(Object.assign({ color: parlakMi(renk) ? '#FBF1F2' : new THREE.Color(renk).lerp(new THREE.Color('#FFFFFF'), .45), roughness: .22, clearcoat: 1, clearcoatRoughness: .1, iridescence: .55, iridescenceIOR: 1.5, sheen: .6, sheenColor: new THREE.Color('#FFE3EE') }, ek));
      else if (tur === 'jel') m = new THREE.MeshPhysicalMaterial(Object.assign({ color: renk, roughness: .12, clearcoat: 1, clearcoatRoughness: .03, transmission: kalite > 0 ? (id === 'heykelDamla' ? 1 : .25) : 0, thickness: .4, ior: id === 'heykelDamla' ? 1.33 : 1.45, sheen: .3 }, ek));
      else if (tur === 'opal') m = new THREE.MeshPhysicalMaterial(Object.assign({ color: renk, roughness: .08, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [200, 900], transmission: kalite > 0 ? .4 : 0, thickness: .3 }, ek));
      else {
        const kristal = parlakMi(renk);
        m = new THREE.MeshPhysicalMaterial(Object.assign({ color: kristal ? '#FFFFFF' : renk, metalness: 0, roughness: 0, flatShading: true, ior: 2.2, envMapIntensity: kalite > 0 ? 2.2 : 3.2, transmission: kalite > 0 ? 1 : 0, thickness: .45, specularIntensity: 1, iridescence: kristal ? .35 : .12, iridescenceIOR: 2.0, attenuationColor: new THREE.Color(kristal ? '#FFFFFF' : renk), attenuationDistance: kristal ? Infinity : .35 }, ek));
        if (kalite === 0) { m.metalness = .25; m.roughness = .05; }
      }
      MT(m); susMtOnbellek.set(key, m); return m;
    }

    /* ------------------------------------------------------------ tırnak nesnesi */
    function tirnakKutu(nw, L) { const m = nw * .22, hw = nw / 2; return { bx: -hw - m, by: -L - m, bw: nw + 2 * m, bh: L + m + nw * .45 }; }
    function tirnakOlustur(el, i, taraf) {
      const pr = el.parmaklar[i], seg = pr.segmanlar[2];
      const grup = new THREE.Group();
      const bil = o.bilgi(taraf, i);
      const nw = bil.nw, yatak = nw * 1.28, geri = yatak - nw * .1;
      const merkez = pr.P[3].clone().addScaledVector(seg.f, -geri * K).addScaledVector(seg.u, seg.r * .78 * .985);
      const mm = new THREE.Matrix4().makeBasis(seg.s, seg.u, seg.f.clone().negate()); mm.setPosition(merkez);
      grup.matrixAutoUpdate = false; grup.matrix.copy(mm);
      el.ic.add(grup);
      const c = document.createElement('canvas'); c.width = 8; c.height = 8;
      const doku = TX(new THREE.CanvasTexture(c)); doku.colorSpace = THREE.SRGBColorSpace; doku.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      const mt = tirnakMalzemesi(); mt.map = doku;
      const n = { taraf, i, el, grup, c, g: c.getContext('2d'), doku, mt, mesh: null, geoKey: '', P: null, kutu: null, susGrup: new THREE.Group(), kivrim: null, hale: null, susKey: '', islakBas: 0, nw };
      grup.add(n.susGrup);
      const kivrimGrup = new THREE.Group(); grup.add(kivrimGrup); n.kivrim = kivrimGrup;
      tirnaklar.set(taraf + i, n);
      tirnakYenile(n, true);
      return n;
    }
    function kivrimKur(n) {
      n.kivrim.children.slice().forEach(ch => { n.kivrim.remove(ch); geoBirak(ch.geometry); });
      const P = n.P, hw = P.hw, c = P.c, pts = [];
      for (let k = 0; k <= 14; k++) { const t = -1.08 + 2.16 * k / 14, x = t * hw, y = c * Math.max(0, 1 - t * t) + P.nw * .05; pts.push(new V3(x * K, (yuzeyY(x, Math.min(y, c * .9), P) - P.th * .4) * K, y * K)); }
      const tup = new THREE.Mesh(G(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, P.nw * .06 * K, 8, false)), tenMt);
      tup.scale.set(1, .6, 1); n.kivrim.add(tup);
      [-1, 1].forEach(sx => {
        const yp = []; for (let k = 0; k <= 8; k++) { const y = c * .4 - (P.yatak * .5 + c * .4) * k / 8; const x = sx * (hw + P.nw * .045); yp.push(new V3(x * K, (yuzeyY(sx * hw, y, P) - P.th * 1.4 - P.nw * .05 * (k / 8)) * K, y * K)); }
        const yan = new THREE.Mesh(G(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(yp), 12, P.nw * .045 * K, 6, false)), tenMt); yan.scale.set(1, .7, 1); n.kivrim.add(yan);
      });
      n.kivrim.children.forEach(ch => { ch.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(ch.geometry.attributes.position.count * 3).fill(1).map((v, k) => k % 3 ? .9 : 1), 3)); ch.castShadow = false; ch.receiveShadow = true; });
    }
    function tirnakYenile(n, ilk) {
      const bil = o.bilgi(n.taraf, n.i); if (!bil) return;
      const t = bil.t, nw = bil.nw, L = bil.L, m3 = bil.m3 || {};
      const P = { sekil: t.sekil, nw, hw: nw / 2, L, yatak: nw * 1.28, c: nw * .2, th: (t.protez ? 2.3 : 1.55) + (m3.kapsul ? 1 : 0) + (t.top ? .3 : 0), cc: 1.15, apex: (t.protez && t.protez !== 'tips') || m3.kapsul ? nw * .055 : 0 };
      P.kutu = tirnakKutu(nw, L);
      const key = [t.sekil, nw.toFixed(2), L.toFixed(2), P.th.toFixed(2), P.apex.toFixed(2), kalite].join('|');
      if (key !== n.geoKey) {
        n.P = P; n.kutu = P.kutu; n.geoKey = key;
        const g = tirnakGeo(P);
        if (n.mesh) { geoBirak(n.mesh.geometry); n.mesh.geometry = g; if (n.hale) n.hale.geometry = g; }
        else {
          n.mesh = new THREE.Mesh(g, n.mt); n.mesh.castShadow = true; n.mesh.receiveShadow = true; n.mesh.userData.tirnak = n; n.grup.add(n.mesh);
          n.hale = new THREE.Mesh(g, haleMt); n.hale.scale.set(1.05, 1.5, 1.03); n.hale.position.y = -P.th * K * .9; n.hale.visible = false; n.hale.renderOrder = -1; n.grup.add(n.hale);
        }
        kivrimKur(n);
        // doku tuvali boyutu
        const w = DOKU_GEN(), h = Math.min(768, Math.round(w * P.kutu.bh / P.kutu.bw));
        if (n.c.width !== w || n.c.height !== h) { n.c.width = w; n.c.height = h; n.doku.dispose(); }
      }
      dokuCiz(n);
      const islak = malzemeUygula(n, m3, performance.now());
      susKur(n, bil);
      if (islak) iste(5400);
      iste();
    }
    function dokuCiz(n) {
      const g = n.g, k = n.kutu, S = n.c.width / k.bw;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, n.c.width, n.c.height);
      g.setTransform(S, 0, 0, n.c.height / k.bh, -k.bx * S, -k.by * (n.c.height / k.bh));
      try { o.dokuCiz(n.taraf, n.i, g, S); } catch (e) { console.warn('[tirnak3d] doku', e); }
      n.doku.needsUpdate = true;
    }
    function susKur(n, bil) {
      const liste = bil.gizliSus ? [] : (bil.t.susler || []), opak = bil.susOpak == null ? 1 : bil.susOpak;
      const key = JSON.stringify(liste) + '|' + opak + '|' + n.geoKey;
      if (key === n.susKey) return; n.susKey = key;
      n.susGrup.children.slice().forEach(ch => n.susGrup.remove(ch));
      const P = n.P, hw = P.hw, L = P.L;
      liste.forEach(s => {
        const boy = (s.olcek || .3) * P.nw, x = (s.x || 0) * hw, y = -(s.y == null ? .5 : s.y) * L;
        const me = new THREE.Mesh(susGeo(s.id), susMt(s.id, s.renk || '#FFFFFF', opak));
        const h = yuzeyY(x, y, P), e = 1.2, eg = (yuzeyY(x + e, y, P) - yuzeyY(x - e, y, P)) / (2 * e);
        me.position.set(x * K, (h - boy * .1) * K, y * K);
        me.rotation.set(0, -(s.don || 0), 0); me.rotateOnWorldAxis(new V3(0, 0, 1), Math.atan(eg));
        const sk = s.id === 'zincir' || s.id === 'inciSira' ? boy * K : boy * K;
        me.scale.setScalar(sk);
        me.castShadow = true; n.susGrup.add(me);
      });
    }
    const haleMt = MT(new THREE.MeshBasicMaterial({ color: '#FF7FAA', transparent: true, opacity: .75, side: THREE.BackSide, depthWrite: false }));
    const parcaHalka = new THREE.Mesh(G(new THREE.TorusGeometry(.5, .04, 6, 36)), MT(new THREE.MeshBasicMaterial({ color: '#FF5C93', transparent: true, opacity: .9, depthTest: false })));
    parcaHalka.rotation.x = Math.PI / 2; parcaHalka.visible = false; parcaHalka.renderOrder = 10;

    /* ------------------------------------------------------------ parıltı parçacıkları */
    const PARCA_MAKS = 420;
    const pGeo = G(new THREE.BufferGeometry());
    const pPos = new Float32Array(PARCA_MAKS * 3), pRenk = new Float32Array(PARCA_MAKS * 3);
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pRenk, 3));
    const pMt = MT(new THREE.PointsMaterial({ size: .07, map: isiltiDoku(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    const noktalar = new THREE.Points(pGeo, pMt); noktalar.frustumCulled = false; sahne.add(noktalar);
    const parcalar = [];
    function parcaSinir() { return [80, 220, PARCA_MAKS][kalite]; }
    function parcaAt(p, n, renk, hiz, omur, yukari2) {
      if (o.azHareket()) return;
      const c = new THREE.Color(renk || '#FFFFFF');
      for (let k = 0; k < n && parcalar.length < parcaSinir(); k++) {
        const a = Math.random() * Math.PI * 2, v = (hiz || .5) * (.3 + Math.random() * .7);
        parcalar.push({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * v, vy: (yukari2 == null ? .6 : yukari2) * (.4 + Math.random()), vz: Math.sin(a) * v, o: 0, om: (omur || .9) * (.6 + Math.random() * .6), c: c.clone().lerp(new THREE.Color('#FFFFFF'), Math.random() * .6), tw: Math.random() * 6 });
      }
      iste(1500);
    }
    function parcaGuncelle(dt) {
      let n = 0;
      for (let k = parcalar.length - 1; k >= 0; k--) {
        const p = parcalar[k]; p.o += dt; if (p.o >= p.om) { parcalar.splice(k, 1); continue; }
        p.vy -= dt * .9; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx *= .97; p.vz *= .97;
        if (p.y < .02) { p.y = .02; p.vy *= -.3; }
      }
      parcalar.forEach(p => { const life = 1 - p.o / p.om, tw = .55 + .45 * Math.sin(p.o * 30 + p.tw); pPos[n * 3] = p.x; pPos[n * 3 + 1] = p.y; pPos[n * 3 + 2] = p.z; pRenk[n * 3] = p.c.r * life * tw; pRenk[n * 3 + 1] = p.c.g * life * tw; pRenk[n * 3 + 2] = p.c.b * life * tw; n++; });
      pGeo.setDrawRange(0, n); pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
      return parcalar.length > 0;
    }
    function tirnakDunya(n, x, y, yuk) { const P = n.P; const v = new V3(x * K, ((yuk == null ? yuzeyY(x, y, P) : yuk) + .5) * K, y * K); n.grup.updateMatrixWorld(true); return v.applyMatrix4(n.grup.matrixWorld); }

    /* ------------------------------------------------------------ kamera (yörünge, sınırlı) */
    const kam = { th: 0, ph: .7, r: 5, hedef: new V3(0, .2, -.4) };
    let tween = null, temel = { th: 0, ph: .7, r: 5, hedef: new V3(0, .2, -.4) }, kamOdak = null, kamAdim = 'renk';
    const SINIR = { phMin: .18, phMax: 1.28, thMax: 1.05, rMin: .55, rMax: 9 };
    function kameraUygula() {
      kam.ph = sinir(kam.ph, SINIR.phMin, SINIR.phMax); kam.th = sinir(kam.th, -SINIR.thMax, SINIR.thMax); kam.r = sinir(kam.r, SINIR.rMin, SINIR.rMax);
      const sp = Math.sin(kam.ph);
      kamera.position.set(kam.hedef.x + kam.r * sp * Math.sin(kam.th), kam.hedef.y + kam.r * Math.cos(kam.ph), kam.hedef.z + kam.r * sp * Math.cos(kam.th));
      kamera.lookAt(kam.hedef);
    }
    function temelHesapla() {
      const kutu = new THREE.Box3();
      // kadraj tırnaklara göre: bütün tırnaklar (baş parmak dahil) görünür, el ortada, avuç alt kenara doğru
      tirnaklar.forEach(n => { kutu.expandByPoint(tirnakDunya(n, -n.P.hw * 1.6, -n.P.L * 1.05)); kutu.expandByPoint(tirnakDunya(n, n.P.hw * 1.6, -n.P.L * 1.05)); kutu.expandByPoint(tirnakDunya(n, 0, n.P.nw * 1.4)); });
      eller.forEach(e => { kutu.expandByPoint(new V3(1.98, .3, 3.2).applyMatrix4(e.kok.matrixWorld)); });
      if (kutu.isEmpty()) kutu.set(new V3(-1.5, 0, -2.4), new V3(1.5, .4, 2));
      const m = kutu.getCenter(new V3()), boy = kutu.getSize(new V3());
      const yarim = Math.max(boy.z * .5 * .82, boy.x * .5 / Math.max(.4, kamera.aspect)) * 1.24;
      temel = { th: 0, ph: .62, r: sinir(yarim / Math.tan(kamera.fov * Math.PI / 360), 2.2, 9), hedef: new V3(m.x, .25, m.z - boy.z * .08) };
    }
    const ADIM_KAMERA = {
      hazirlik: { ph: .52, th: 0, r: 1.02, dz: 0 }, sekil: { ph: .95, th: .38, r: .96, dz: -.15 }, taban: { ph: .42, th: -.06, r: .97, dz: -.05 },
      renk: { ph: .62, th: 0, r: 1, dz: 0 }, sanat: { ph: .38, th: 0, r: .9, dz: -.1 }, ust: { ph: .98, th: -.36, r: .96, dz: -.15 }, final: { ph: .7, th: .1, r: 1.15, dz: 0 }
    };
    function hedefAdim(adim) { const a = ADIM_KAMERA[adim] || ADIM_KAMERA.renk; return { th: a.th, ph: a.ph, r: temel.r * a.r, hedef: temel.hedef.clone().add(new V3(0, 0, a.dz)) }; }
    function hedefTirnak(n) {
      const m = tirnakDunya(n, 0, -n.P.L * .42), boy = (n.P.L + n.P.nw * 1.6) * K * (n.el.olcek || 1);
      return { th: sinir(kam.th * .6 + (n.taraf === 'sol' ? .12 : -.12) * 0, -.6, .6), ph: .5, r: sinir(boy / Math.tan(kamera.fov * Math.PI / 360) * .72, .55, 3), hedef: m };
    }
    function kameraGit(h, sure) {
      if (!h) return;
      if (o.azHareket() || sure === 0) { tween = null; Object.assign(kam, { th: h.th, ph: h.ph, r: h.r }); kam.hedef.copy(h.hedef); kameraUygula(); iste(); return; }
      tween = { bas: performance.now(), sure: sure || 950, a: { th: kam.th, ph: kam.ph, r: kam.r, hedef: kam.hedef.clone() }, b: h };
      iste(sure || 950);
    }

    /* ------------------------------------------------------------ sahne kurulumu */
    let ornekler = [], poz = 'duz';
    function elleriTemizle() {
      tirnaklar.forEach(n => { n.grup.traverse(ch => { if (ch.isMesh && ch.geometry && !susGeoOnbellek.has(ch.geometry) && ch.geometry !== pGeo) { if (ch !== n.hale) geoBirak(ch.geometry); } }); mtBirak(n.mt); txBirak(n.doku); });
      tirnaklar.clear();
      eller.forEach(e => { e.kok.traverse(ch => { if (ch.isMesh && geolar.has(ch.geometry) && !susGeoOnbellek.has(ch.geometry)) geoBirak(ch.geometry); }); dunya.remove(e.kok); });
      eller = [];
    }
    function sahneKur(v) {
      ornekler = v.ornekler; poz = v.poz;
      elleriTemizle();
      ornekler.forEach(orn => { const e = elKur(orn, poz, v.avuc); eller.push(e); });
      eller.forEach(e => e.parmaklar.forEach((p, i) => tirnakOlustur(e, i, e.taraf)));
      // ürünlerin yeri: fincan pozunda fincan, düz pozda havlu
      const fv = poz === 'fincan'; fincan.visible = fv; havlu.visible = poz === 'duz';
      if (fv) {
        // fincan parmak uçlarının arkasında: parmaklar fincanın gövdesini kavrar gibi durur
        const v = new V3(); let k = 0; tirnaklar.forEach(n => { if (n.i > 0) { v.add(tirnakDunya(n, 0, -n.P.L * .5)); k++; } }); if (k) v.multiplyScalar(1 / k);
        fincan.scale.setScalar(.62); fincan.position.set(v.x + .05, 0, v.z - .78);
      }
      havlu.position.set(.06, 0, .6); havlu.rotation.y = -.06;
      torpu.visible = !fv; pamuklar.forEach(p => { p.visible = !fv; });
      temelHesapla();
      kameraGit(kamOdak && tirnaklar.get(kamOdak) ? hedefTirnak(tirnaklar.get(kamOdak)) : hedefAdim(kamAdim), 0);
      iste();
    }
    function ortam(v) {
      if (v.ten) tenRengiAyarla(v.ten);
      if (v.isik && v.isik !== isikTur || !ortamRT) { isikTur = v.isik || isikTur; ortamKur(isikTur); }
      const I = ISIK[isikTur];
      sahne.background = new THREE.Color(I.arka); sahne.fog = new THREE.Fog(I.sis, 6.5, 15);
      kenarIsik.intensity = I.kG; kenarIsik.color.set(I.kenar);
      hemi.color.set(I.gok); hemi.groundColor.set(I.yer); hemi.intensity = I.hG;
      anahtar.color.set(I.anahtar); anahtar.intensity = I.aG; dolgu.color.set(I.dolgu); dolgu.intensity = I.dG;
      if (v.isikAci != null) isikAci = v.isikAci;
      anahtarKonum();
      if (v.zemin && v.zemin !== ortam.zemin) {
        ortam.zemin = v.zemin;
        const g = masaTuval.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); const s = masaTuval.width / 480; g.setTransform(s, 0, 0, s, 0, 0);
        try { o.zeminCiz(g, v.zemin); } catch (e) { g.fillStyle = '#F6E8E8'; g.fillRect(0, 0, 600, 600); }
        masaDoku.needsUpdate = true;
        masaMt.roughness = v.zemin === 'mermer' ? .22 : v.zemin === 'saten' ? .45 : v.zemin === 'ahsap' ? .55 : .95;
        masaMt.clearcoat = v.zemin === 'mermer' ? .8 : v.zemin === 'ahsap' ? .35 : 0;
        masaMt.sheen = v.zemin === 'saten' || v.zemin === 'havlu' ? 1 : 0; masaMt.sheenColor.set('#FFE8F0'); masaMt.sheenRoughness = .5;
        masaMt.normalMap = v.zemin === 'havlu' ? haritaAl('havlu') : null; masaMt.needsUpdate = true;
      }
      if (v.renkler) siseler.forEach((m, k) => m.color.set(v.renkler[k % Math.max(1, v.renkler.length)] || ['#F4CFD8', '#B3122E', '#F7F1EE'][k]));
      tirnaklar.forEach(n => { const b = o.bilgi(n.taraf, n.i); if (b) malzemeUygula(n, b.m3 || {}, performance.now()); });
      iste();
    }

    /* ------------------------------------------------------------ animasyonlar: lamba, kâse, parlama, vitrin */
    const anim = { lamba: null, kase: null, parlama: null, vitrin: null };
    function parmakUcMerkez() { const v = new V3(); let k = 0; tirnaklar.forEach(n => { if (n.taraf === (ornekler[ornekler.length - 1] || {}).taraf || ornekler.length > 1) { v.add(tirnakDunya(n, 0, -n.P.L * .3)); k++; } }); return k ? v.multiplyScalar(1 / k) : new V3(0, 0, -1.4); }
    function lambaBaslat(ms) { anim.lamba = { bas: performance.now(), sure: ms, hedef: parmakUcMerkez() }; iste(ms + 200); }
    function kaseBaslat(ms) { anim.kase = { bas: performance.now(), sure: ms, hedef: parmakUcMerkez() }; kase.visible = true; iste(ms + 200); }
    function guncelle(simdi, dt) {
      let devam = false;
      if (tween) {
        const p = sinir((simdi - tween.bas) / tween.sure, 0, 1), e = kolay(p);
        kam.th = tween.a.th + (tween.b.th - tween.a.th) * e; kam.ph = tween.a.ph + (tween.b.ph - tween.a.ph) * e; kam.r = tween.a.r + (tween.b.r - tween.a.r) * e;
        kam.hedef.lerpVectors(tween.a.hedef, tween.b.hedef, e); kameraUygula();
        if (p >= 1) tween = null; else devam = true;
      }
      if (anim.lamba) {
        const a = anim.lamba, p = sinir((simdi - a.bas) / a.sure, 0, 1), gir = p < .16 ? kolay(p / .16) : p > .86 ? kolay((1 - p) / .14) : 1;
        lamba.position.set(LAMBA_PARK.x + (a.hedef.x - LAMBA_PARK.x) * gir, 0, LAMBA_PARK.z + (a.hedef.z + .2 - LAMBA_PARK.z) * gir);
        lamba.scale.setScalar(LAMBA_PARK.s + (1 - LAMBA_PARK.s) * gir); lamba.rotation.y = LAMBA_PARK.r * (1 - gir);
        const nab = gir * (.75 + .25 * Math.sin(simdi / 120));
        lambaLed.emissiveIntensity = nab * 3; uvIsik.intensity = nab * 6; uvIsik.position.set(lamba.position.x, .9, lamba.position.z);
        if (Math.random() < .3 * gir) parcaAt(new V3(a.hedef.x + (Math.random() - .5) * 1.4, .5, a.hedef.z + (Math.random() - .5) * 1), 1, '#B48CFF', .1, .8, .1);
        if (p >= 1) { anim.lamba = null; lambaLed.emissiveIntensity = 0; uvIsik.intensity = 0; lamba.position.set(LAMBA_PARK.x, 0, LAMBA_PARK.z); lamba.scale.setScalar(LAMBA_PARK.s); lamba.rotation.y = LAMBA_PARK.r; } else devam = true;
      }
      if (anim.kase) {
        const a = anim.kase, p = sinir((simdi - a.bas) / a.sure, 0, 1), gir = p < .15 ? kolay(p / .15) : p > .85 ? kolay((1 - p) / .15) : 1;
        kase.position.set(a.hedef.x, .02 + gir * .3, a.hedef.z - .1); kase.scale.setScalar(.4 + gir * .6);
        suMt.opacity = .5 * gir; if (suMt.normalMap) suMt.normalMap.offset.set(simdi / 9000, simdi / 7000);
        if (Math.random() < .5 * gir) parcaAt(new V3(a.hedef.x + (Math.random() - .5) * 1.6, .34, a.hedef.z + (Math.random() - .5) * 1.2), 1, '#DDF4FF', .05, .7, .25);
        if (p >= 1) { anim.kase = null; kase.visible = false; } else devam = true;
      }
      if (anim.parlama) {
        const a = anim.parlama, p = sinir((simdi - a.bas) / a.sure, 0, 1);
        const m = parmakUcMerkez(); gezenIsik.position.set(m.x - 1.6 + 3.2 * p, .9, m.z + .3); gezenIsik.intensity = Math.sin(p * Math.PI) * 5;
        if (p >= 1) { anim.parlama = null; gezenIsik.intensity = 0; } else devam = true;
      }
      if (anim.vitrin) {
        const t = (simdi - anim.vitrin.bas) / 1000, yavas = o.azHareket();
        eller.forEach(e => { e.ic.rotation.y = yavas ? 0 : Math.sin(t * .45) * .3; e.ic.position.y = Math.min(1, t * .8) * .06; e.ic.updateMatrixWorld(true); });
        anahtarKonum(yavas ? 0 : Math.sin(t * .7) * .9);
        gezenIsik.intensity = 1.1; const m = parmakUcMerkez(); gezenIsik.position.set(m.x + Math.cos(t * 1.3) * 1.4, 1.1, m.z + Math.sin(t * 1.3) * .8);
        if (!yavas && simdi - (anim.vitrin.son || 0) > 900) { anim.vitrin.son = simdi; const ns = [...tirnaklar.values()]; const n = ns[Math.floor(Math.random() * ns.length)]; if (n) parcaAt(tirnakDunya(n, (Math.random() - .5) * n.P.hw, -n.P.L * Math.random()), 10, '#FFE9F3', .35, 1, .5); }
        devam = true;
      }
      // ıslak → kuru geçişi
      tirnaklar.forEach(n => { if (n.islakBas) { const b = o.bilgi(n.taraf, n.i); if (b) { malzemeUygula(n, b.m3 || {}, simdi); devam = true; } } });
      tirnaklar.forEach(n => { n.mt.userData.u.uZaman.value = simdi / 1000; });
      if (parcaGuncelle(dt)) devam = true;
      return devam;
    }

    /* ------------------------------------------------------------ çizim döngüsü, FPS ve kalite */
    let raf = 0, surekliBitis = 0, aktif = true, sonKare = 0;
    const fps = { kare: 0, sure: 0, son: 0, dusuk: 0, olculen: 0, ilk: performance.now() };
    function iste(ms) { if (ms) surekliBitis = Math.max(surekliBitis, performance.now() + ms); if (!raf && aktif && document.visibilityState !== 'hidden') raf = requestAnimationFrame(kare); }
    function kare(ts) {
      raf = 0; if (!aktif) return;
      const simdi = performance.now(), dt = sonKare ? Math.min(.05, (simdi - sonKare) / 1000) : .016;
      const devam = guncelle(simdi, dt) || simdi < surekliBitis;
      renderer.render(sahne, kamera);
      if (sonKare && simdi - sonKare < 250) { fps.kare++; fps.sure += simdi - sonKare; }
      sonKare = devam ? simdi : 0;
      if (fps.sure > 1200) { const f = fps.kare * 1000 / fps.sure; fps.olculen = f; fps.kare = 0; fps.sure = 0; fpsKontrol(f); }
      if (devam) raf = requestAnimationFrame(kare);
    }
    function fpsKontrol(f) {
      if (kaliteMod !== 'oto') return;
      if (f < 30 && kalite > 0) { kalite--; kaliteUygula(); o.olay('kalite', kalite); }
      else if (f < 18 && kalite === 0) { fps.dusuk++; if (fps.dusuk >= 2 && performance.now() - fps.ilk < 20000) o.olay('zayif', f); }
    }
    function kaliteUygula() {
      renderer.setPixelRatio(dprAl()); golgeKalite();
      boyutla();
      malzemeler.forEach(m => { m.needsUpdate = true; });
      susMtOnbellek.forEach(m => mtBirak(m)); susMtOnbellek.clear();
      tirnaklar.forEach(n => { n.susKey = ''; n.geoKey = ''; tirnakYenile(n); });
      iste();
    }
    function boyutla() {
      const r = kap.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      renderer.setSize(w, h, true); kamera.aspect = w / h; kamera.updateProjectionMatrix();
      const eskiTemel = temel; temelHesapla();
      if (!tween && !kamOdak) { const hd = hedefAdim(kamAdim); Object.assign(kam, { th: kam.th, ph: kam.ph, r: hd.r }); kam.hedef.copy(hd.hedef); }
      void eskiTemel; kameraUygula(); iste();
    }
    const gorunurCb = () => { if (document.visibilityState === 'hidden') { if (raf) cancelAnimationFrame(raf); raf = 0; } else iste(300); };
    document.addEventListener('visibilitychange', gorunurCb);
    const kayipCb = (e) => { e.preventDefault(); aktif = false; if (raf) cancelAnimationFrame(raf); raf = 0; o.olay('kayip'); };
    tuval.addEventListener('webglcontextlost', kayipCb, false);

    /* ------------------------------------------------------------ dokunma: ışın → tırnak yerel koordinatı */
    function isin(cx, cy) { const r = tuval.getBoundingClientRect(); raycaster.setFromCamera(new V2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), kamera); return raycaster; }
    function vur(cx, cy) {
      const rc = isin(cx, cy);
      const tm = []; tirnaklar.forEach(n => { if (n.mesh) tm.push(n.mesh); });
      const h = rc.intersectObjects(tm, false)[0];
      if (h) { const n = h.object.userData.tirnak; const l = n.mesh.worldToLocal(h.point.clone()); return { taraf: n.taraf, i: n.i, x: l.x / K, y: l.z / K }; }
      const em = []; eller.forEach(e => e.ic.traverse(ch => { if (ch.isMesh && ch.userData.el) em.push(ch); }));
      const he = rc.intersectObjects(em, false)[0];
      if (he) {
        // ele dokunuldu: en yakın tırnak (seçim kolaylığı)
        let en = null, enM = 1e9; tirnaklar.forEach(n => { if (n.taraf !== he.object.userData.el) return; const d = tirnakDunya(n, 0, -n.P.L * .3).distanceTo(he.point); if (d < enM) { enM = d; en = n; } });
        return { el: he.object.userData.el, yakin: en && enM < .55 ? { taraf: en.taraf, i: en.i } : null };
      }
      return null;
    }
    function duzlem(cx, cy, taraf, i) {
      const n = tirnaklar.get(taraf + i); if (!n) return null;
      const rc = isin(cx, cy); n.grup.updateMatrixWorld(true);
      const ters = new THREE.Matrix4().copy(n.mesh.matrixWorld).invert();
      const r = rc.ray.clone().applyMatrix4(ters);
      const yuk = (n.P.th + .35) * K, dy = r.direction.y; if (Math.abs(dy) < 1e-5) return null;
      const t = (yuk - r.origin.y) / dy; if (t < 0) return null;
      const p = r.origin.clone().addScaledVector(r.direction, t);
      return { x: p.x / K, y: p.z / K };
    }
    function ekran(taraf, i, ny) {
      const n = tirnaklar.get(taraf + i), r = tuval.getBoundingClientRect(); if (!n) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const v = tirnakDunya(n, 0, -n.P.L * (ny == null ? .5 : ny)).project(kamera);
      return { x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height };
    }

    /* ------------------------------------------------------------ fotoğraf: render → tuval (JPEG'e tirnak.js çevirir) */
    function foto(w, h) {
      const eski = new V2(); renderer.getSize(eski); const pr = renderer.getPixelRatio(), eskiFov = kamera.fov, eskiAsp = kamera.aspect;
      const haleler = []; tirnaklar.forEach(n => { if (n.hale.visible) { haleler.push(n.hale); n.hale.visible = false; } }); const phv = parcaHalka.visible; parcaHalka.visible = false;
      const yeniAsp = w / h;
      if (yeniAsp < eskiAsp) kamera.fov = 2 * Math.atan(Math.tan(eskiFov * Math.PI / 360) * eskiAsp / yeniAsp) * 180 / Math.PI;
      renderer.setPixelRatio(1); renderer.setSize(w, h, false); kamera.aspect = yeniAsp; kamera.updateProjectionMatrix();
      renderer.render(sahne, kamera);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(tuval, 0, 0, w, h);
      haleler.forEach(x => { x.visible = true; }); parcaHalka.visible = phv;
      kamera.fov = eskiFov; renderer.setPixelRatio(pr); renderer.setSize(eski.x, eski.y, true); kamera.aspect = eskiAsp; kamera.updateProjectionMatrix();
      renderer.render(sahne, kamera);
      return c;
    }

    /* ------------------------------------------------------------ başlangıç */
    golgeKalite(); anahtarKonum(); tenRengiAyarla('#F6D7C6');
    kameraUygula();

    const api = {
      tuval, surum: SURUM,
      sahne: sahneKur, ortam,
      tirnak(taraf, i) { const n = tirnaklar.get(taraf + i); if (n) tirnakYenile(n); },
      dokuTuval(taraf, i) { const n = tirnaklar.get(taraf + i); if (!n) return null; const k = n.kutu, S = n.c.width / k.bw; n.g.setTransform(S, 0, 0, n.c.height / k.bh, -k.bx * S, -k.by * (n.c.height / k.bh)); return { g: n.g, S }; },
      dokuBitti(taraf, i) { const n = tirnaklar.get(taraf + i); if (n) { n.doku.needsUpdate = true; iste(); } },
      vur, duzlem, ekran,
      secim(liste, parca) {
        const s = new Set(liste.map(x => x.taraf + x.i));
        tirnaklar.forEach((n, k) => { n.hale.visible = s.has(k); n.hale.material = haleMt; });
        haleMt.opacity = liste.length > 1 ? .45 : .8;
        if (parca && tirnaklar.get(parca.taraf + parca.i)) {
          const n = tirnaklar.get(parca.taraf + parca.i); if (parcaHalka.parent !== n.grup) { if (parcaHalka.parent) parcaHalka.parent.remove(parcaHalka); n.grup.add(parcaHalka); }
          const x = parca.x * n.P.hw, y = -parca.y * n.P.L; parcaHalka.position.set(x * K, (yuzeyY(x, y, n.P) + .6) * K, y * K); parcaHalka.scale.setScalar(Math.max(.05, parca.r * K * 2)); parcaHalka.visible = true;
        } else parcaHalka.visible = false;
        iste();
      },
      kamera(h, sure) {
        if (typeof h === 'string') { kamAdim = h; kamOdak = null; kameraGit(hedefAdim(h), sure); }
        else if (h && tirnaklar.get(h.taraf + h.i)) { kamOdak = h.taraf + h.i; kameraGit(hedefTirnak(tirnaklar.get(kamOdak)), sure == null ? 1100 : sure); }
        else { kamOdak = null; kameraGit(hedefAdim(kamAdim), sure); }
      },
      odakta: () => !!kamOdak,
      giris() { const h = hedefAdim(kamAdim); Object.assign(kam, { th: h.th + .9, ph: Math.min(SINIR.phMax, h.ph + .35), r: h.r * 1.7 }); kam.hedef.copy(h.hedef); kameraUygula(); kameraGit(h, 1600); },
      dondur(dx, dy) { tween = null; kam.th -= dx * .006; kam.ph -= dy * .005; kameraUygula(); iste(); },
      yakinlas(k) { tween = null; kam.r *= k; kameraUygula(); iste(); },
      kaydir(dx, dy) { tween = null; const sag = new V3().setFromMatrixColumn(kamera.matrixWorld, 0), ileri = new V3().setFromMatrixColumn(kamera.matrixWorld, 1); const s = kam.r * .0016; kam.hedef.addScaledVector(sag, -dx * s).addScaledVector(ileri, dy * s); kam.hedef.y = sinir(kam.hedef.y, 0, 1); kam.hedef.x = sinir(kam.hedef.x, -3, 3); kam.hedef.z = sinir(kam.hedef.z, -4, 3); kameraUygula(); iste(); },
      islak(taraf, i) { const n = tirnaklar.get(taraf + i); if (n) { n.islakBas = performance.now(); iste(5400); } },
      parilti(taraf, i, adet, renk) { const n = tirnaklar.get(taraf + i); if (!n) return; for (let k = 0; k < 3; k++) parcaAt(tirnakDunya(n, (Math.random() - .5) * n.P.nw * .8, -n.P.L * Math.random()), Math.ceil((adet || 12) / 3), renk || '#FFFFFF', .35, 1.1, .45); },
      toz(taraf, i, x, y, renk) { const n = tirnaklar.get(taraf + i); if (n) parcaAt(tirnakDunya(n, x, y), 3, renk || '#FFFFFF', .25, .7, .25); },
      lamba: lambaBaslat, kase: kaseBaslat,
      parlama(ms) { anim.parlama = { bas: performance.now(), sure: ms || 1100 }; iste((ms || 1100) + 100); },
      vitrin(acik) {
        if (acik) { anim.vitrin = { bas: performance.now() }; iste(); }
        else { anim.vitrin = null; gezenIsik.intensity = 0; eller.forEach(e => { e.ic.rotation.y = 0; e.ic.position.y = 0; e.ic.updateMatrixWorld(true); }); anahtarKonum(); iste(); }
      },
      vitrinde: () => !!anim.vitrin,
      foto, boyutla, iste,
      kaliteAyarla(q) { kaliteMod = q == null ? 'oto' : q; const yeni = kaliteMod === 'oto' ? (mobil ? 1 : 2) : sinir(Number(q) || 0, 0, 2); if (yeni !== kalite) { kalite = yeni; kaliteUygula(); } },
      bilgi() { const mem = renderer.info.memory; return { fps: Math.round(fps.olculen), kalite, kaliteMod, kam: { th: +kam.th.toFixed(3), ph: +kam.ph.toFixed(3), r: +kam.r.toFixed(3) }, vitrin: !!anim.vitrin, lamba: !!anim.lamba, geometri: mem.geometries, doku: mem.textures, program: (renderer.info.programs || []).length, izlenen: { geo: geolar.size, malzeme: malzemeler.size, doku: dokular.size }, ciz: renderer.info.render.calls, ucgen: renderer.info.render.triangles }; },
      yokEt() {
        aktif = false; if (raf) cancelAnimationFrame(raf); raf = 0;
        document.removeEventListener('visibilitychange', gorunurCb);
        tuval.removeEventListener('webglcontextlost', kayipCb, false);
        elleriTemizle();
        sahne.traverse(ch => { if (ch.geometry && !geolar.has(ch.geometry)) ch.geometry.dispose(); });
        geolar.forEach(g => g.dispose()); geolar.clear();
        malzemeler.forEach(m => m.dispose()); malzemeler.clear();
        dokular.forEach(t => t.dispose()); dokular.clear();
        susGeoOnbellek.clear(); susMtOnbellek.clear();
        if (anahtar.shadow.map) { anahtar.shadow.map.dispose(); anahtar.shadow.map = null; }
        if (ortamRT) { ortamRT.dispose(); ortamRT = null; }
        if (pmrem) { pmrem.dispose(); pmrem = null; }
        sahne.environment = null; sahne.background = null; sahne.clear();
        renderer.renderLists.dispose(); renderer.dispose();
        try { const gl = renderer.getContext(); if (gl && !gl.isContextLost()) renderer.forceContextLoss(); } catch (e) {}
        if (tuval.parentNode) tuval.parentNode.removeChild(tuval);
      }
    };
    return api;
  }

  (window.CD = window.CD || {}).tirnak3d = { destek, kur, surum: SURUM };
})();
