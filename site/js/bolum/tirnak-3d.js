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
      const tabak = new THREE.Mesh(G(new THREE.CylinderGeometry(1.2, 1.0, .06, 48)), por); tabak.name = 'tabak'; tabak.position.y = .03; tabak.receiveShadow = true; fincan.add(tabak);
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
    const kolMt = MT(new THREE.MeshPhysicalMaterial({ color: '#2B3452', roughness: .9, sheen: 1, sheenColor: new THREE.Color('#6C7AA8'), sheenRoughness: .6, normalMap: haritaAl('orgu'), normalScale: new V2(1.3, 1.3) }));

    /* ------------------------------------------------------------ el modeli: Cemre'nin eli (tirnak-el.js) — tek parça, iskeletli (SkinnedMesh)
       Yüzey uzaklık alanından çıkarılır; kemikler pozlara göre döner, tırnaklar uç kemiğine bağlıdır (eklemle birlikte gider). */
    let eller = [];          // { taraf, kok, ic, mesh, kemikler, parmaklar:[{ p, kemik }] }
    let tirnaklar = new Map();   // 'sag2' → nail
    const yukari = new V3(0, 1, 0);
    const ELM = CD.tirnakEl;
    // el teni: kırışıklar, damarlar, avuç çizgileri ve küçük ben gölgelendiricide (köşe yoğunluğundan bağımsız, keskin)
    const elMt = MT(new THREE.MeshPhysicalMaterial({ color: '#F6D7C6', vertexColors: true, roughness: .5, sheen: 1, sheenRoughness: .38, sheenColor: new THREE.Color('#FFB8A8'), clearcoat: .1, clearcoatRoughness: .42, normalMap: haritaAl('ten'), normalScale: new V2(.16, .16), envMapIntensity: .5, specularIntensity: .55 }));
    elMt.onBeforeCompile = (sh) => {
      sh.uniforms.uAlt = tenU.uAlt;
      sh.vertexShader = 'attribute vec4 kir;\nvarying vec4 vKir;\nvarying vec3 vYer;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKir = kir; vYer = position;');
      sh.fragmentShader = [
        'uniform vec3 uAlt;', 'varying vec4 vKir;', 'varying vec3 vYer;',
        'float segU(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }',
        'float bezU(vec2 p, vec2 a, vec2 c, vec2 b) { float m = 1e3; vec2 o = a; for (int i = 1; i <= 8; i++) { float t = float(i) / 8.0; vec2 q = mix(mix(a, c, t), mix(c, b, t), t); m = min(m, segU(p, o, q)); o = q; } return m; }'
      ].join('\n') + '\n' + sh.fragmentShader
        .replace('#include <color_fragment>', [
          '#include <color_fragment>',
          '  {',
          '    float s = vKir.x, l = vKir.y, dors = vKir.z, tur = vKir.w, kirk = 0.0;',
          '    if (tur > 0.5) {',
          '      float yanS = exp(-l * l * 1.25);',
          '      if (dors > 0.04) {',
          '        float gen = tur < 1.5 ? 0.075 : (tur < 2.5 ? 0.048 : (tur < 3.5 ? 0.06 : 0.065));',
          '        float yay = s + 0.032 * l * l;',
          '        float bolge = 1.0 - smoothstep(gen * 0.35, gen, abs(yay));',
          '        float cizgi = pow(abs(sin(yay * 3.14159 / (tur < 2.5 ? 0.0165 : 0.021) + l * 0.7)), 10.0);',
          '        kirk = bolge * yanS * (0.35 + cizgi) * smoothstep(0.04, 0.45, dors) * (tur > 2.5 && tur < 3.5 ? 0.55 : 0.85);',
          '      } else if (dors < -0.08) {',
          '        float a1 = s - 0.012 + 0.014 * l * l, a2 = s + 0.034 + 0.012 * l * l;',
          '        kirk = (exp(-a1 * a1 / 0.00005) + 0.6 * exp(-a2 * a2 / 0.00004)) * yanS * smoothstep(0.08, 0.45, -dors) * 1.2;',
          '      }',
          '    }',
          '    vec2 xz = vYer.xz;',
          '    if (tur < 0.5 && vYer.y < -0.1 && xz.y < -0.2 && xz.y > -2.2) {',     // avuç içi çizgileri
          '      float d1 = bezU(xz, vec2(0.78, -1.78), vec2(0.18, -1.92), vec2(-0.38, -2.06));',
          '      float d2 = bezU(xz, vec2(-0.7, -1.74), vec2(-0.1, -1.5), vec2(0.52, -1.28));',
          '      float d3 = bezU(xz, vec2(-0.68, -1.76), vec2(-0.08, -1.0), vec2(-0.2, -0.32));',
          '      float c = exp(-d1 * d1 / 0.00012) + exp(-d2 * d2 / 0.0001) + exp(-d3 * d3 / 0.00014);',
          '      kirk = max(kirk, c * smoothstep(0.1, 0.22, -vYer.y) * 0.9);',
          '    }',
          '    float damar = 0.0;',
          '    if (vYer.y > 0.02 && xz.y > -2.05 && xz.y < 0.9) {',                 // el sırtı damarları: çok hafif
          '      float dd = min(min(segU(xz, vec2(-0.05, 0.6), vec2(-0.15, -0.4)), segU(xz, vec2(-0.15, -0.4), vec2(-0.38, -1.4))), segU(xz, vec2(-0.38, -1.4), vec2(-0.42, -1.98)));',
          '      dd = min(dd, min(min(segU(xz, vec2(0.12, 0.6), vec2(0.18, -0.5)), segU(xz, vec2(0.18, -0.5), vec2(0.05, -1.3))), segU(xz, vec2(0.05, -1.3), vec2(0.02, -1.95))));',
          '      dd = min(dd, min(min(segU(xz, vec2(0.3, 0.5), vec2(0.33, -0.6)), segU(xz, vec2(0.33, -0.6), vec2(0.38, -1.5))), segU(xz, vec2(-0.15, -0.4), vec2(0.18, -0.5))));',
          '      damar = exp(-dd * dd / 0.0011) * smoothstep(0.02, 0.18, vYer.y);',
          '    }',
          '    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.9, 1.0), damar * 0.32);',
          '    diffuseColor.rgb *= 1.0 - kirk * 0.2;',
          '    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.96, 0.82, 0.8), clamp(kirk, 0.0, 1.0) * 0.32);',
          '    float ben = length(vec2(xz.x - 0.31, xz.y + 0.12));',                  // bileğin üstünde minik ben
          '    if (vYer.y > 0.1) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.22, 0.18), (1.0 - smoothstep(0.011, 0.017, ben)) * 0.85);',
          '  }'
        ].join('\n'))
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  { float fr = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.4); totalEmissiveRadiance += uAlt * fr * 0.18; }');
    };
    elMt.customProgramCacheKey = () => 'tirnakEl';
    const kolIcMt = MT(new THREE.MeshBasicMaterial({ color: '#141827', side: THREE.DoubleSide }));
    function tenRengiAyarla(hex) {
      [tenMt, elMt].forEach(m => { m.color.set(hex).lerp(new THREE.Color('#EE9C88'), .27); });     // sıcak pembe alt ton
      const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl);
      [tenMt, elMt].forEach(m => m.sheenColor.setHSL(.015, .75, Math.min(.86, hsl.l + .12)));
      tenU.uAlt.value.setHSL(.01, .68, sinir(hsl.l * .78, .2, .62));
    }
    // el geometrisi (kalite başına bir kez üretilir; oturum boyunca saklanır)
    function elGeo() {
      const r = ELM.uret(kalite);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(r.pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(r.nor, 3));
      g.setAttribute('color', new THREE.BufferAttribute(r.renk, 3));
      g.setAttribute('kir', new THREE.BufferAttribute(r.kir, 4));
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(r.skinI, 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(r.skinW, 4));
      g.setIndex(new THREE.BufferAttribute(r.index, 1));
      g.computeBoundingSphere(); g.boundingSphere.radius *= 1.6;    // poz değişince de görünür kalsın
      return G(g);
    }
    const EKSEN = ELM.PARMAK.map(p => ({ yon: new V3(...p.yon), ust: new V3(...p.ust), yan: new V3(...p.yan) }));
    function elKur(taraf) {
      const kok = new THREE.Group();
      const ic = new THREE.Group(); kok.add(ic);       // vitrinde dönen iç grup
      const kemikler = ELM.KEMIK.map(k => { const b = new THREE.Bone(); b.name = k.ad; return b; });
      ELM.KEMIK.forEach((k, j) => { if (k.ebeveyn < 0) b0(j); else { const e = ELM.KEMIK[k.ebeveyn]; kemikler[j].position.set(k.bas[0] - e.bas[0], k.bas[1] - e.bas[1], k.bas[2] - e.bas[2]); kemikler[k.ebeveyn].add(kemikler[j]); } });
      function b0(j) { kemikler[j].position.set(0, 0, 0); }
      const mesh = new THREE.SkinnedMesh(elGeo(), elMt);
      mesh.add(kemikler[0]); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      ic.add(mesh); kok.updateMatrixWorld(true);
      mesh.bind(new THREE.Skeleton(kemikler));
      const el = { taraf, kok, ic, mesh, kemikler, parmaklar: [], olcek: 1, poz: null };
      ELM.PARMAK.forEach((p, f) => el.parmaklar.push({ p, kemik: kemikler[1 + f * 3 + 2], eks: EKSEN[f] }));
      // ışın vekilleri (görünmez, kemiğe bağlı; deri yerine bunlara çarpılır → hızlı)
      const vekilMt = haleMt;
      ELM.KEMIK.forEach((k, j) => {
        if (j === 0) { const v = new THREE.Mesh(G(new THREE.BoxGeometry(1.7, .5, 2.6)), vekilMt); v.position.set(0, -.02, -1.25); v.visible = false; v.userData.el = taraf; kemikler[0].add(v); return; }
        const p = ELM.PARMAK[k.parmak], len = p.uz[k.k], r = p.r[k.k];
        const v = new THREE.Mesh(G(new THREE.CylinderGeometry(r, r, len, 8)), vekilMt);
        v.quaternion.setFromUnitVectors(yukari, EKSEN[k.parmak].yon); v.position.copy(EKSEN[k.parmak].yon).multiplyScalar(len / 2);
        v.visible = false; v.userData.el = taraf; kemikler[j].add(v);
      });
      // bilek ve lacivert fitilli kazak kolu (referanstaki gibi)
      const kol = new THREE.Mesh(G(new THREE.CylinderGeometry(.7, .8, 4.2, 40, 1, true)), kolMt); kol.rotation.x = Math.PI / 2; kol.scale.set(1, 1, .74); kol.position.set(0, -.03, 3.06); kol.castShadow = true; ic.add(kol);
      const kolIc = new THREE.Mesh(G(new THREE.CircleGeometry(.72, 32)), kolIcMt); kolIc.scale.set(1, .74, 1); kolIc.position.set(0, -.03, 1.6); ic.add(kolIc);
      const kolAgiz = new THREE.Mesh(G(new THREE.TorusGeometry(.7, .085, 10, 40)), kolMt); kolAgiz.scale.set(1, .74, 1); kolAgiz.position.set(0, -.03, .96); ic.add(kolAgiz);
      dunya.add(kok);
      return el;
    }
    /* poz: eklem açıları → kemik dönüşleri; kök: elin dünyadaki duruşu */
    const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), qC = new THREE.Quaternion(), eX = new V3(1, 0, 0), eY = new V3(0, 1, 0), eZ = new V3(0, 0, 1);
    function pozVeri(id) { return ELM.POZ[id] || ELM.POZ.duz; }
    function pozKopya(P) { return { bas: P.bas.slice(), p: P.p.map(a => a.slice()), kok: Object.assign({}, P.kok) }; }
    function pozKaris(A, B, t) {
      const l = (a, b) => a + (b - a) * t;
      const k = {}; ['x', 'y', 'z', 'rx', 'ry', 'rz', 'rw'].forEach(a => { k[a] = l(A.kok[a] || 0, B.kok[a] || 0); });
      return { bas: A.bas.map((v, i) => l(v, B.bas[i])), p: A.p.map((r, f) => r.map((v, i) => l(v, B.p[f][i]))), kok: k };
    }
    function pozUygula(el, P, ekKok) {
      const B = el.kemikler;
      EKSEN.forEach((e, f) => {
        if (f === 0) {
          const a = P.bas;
          B[1].quaternion.setFromAxisAngle(e.ust, -a[1]).multiply(qA.setFromAxisAngle(e.yan, -a[0])).multiply(qB.setFromAxisAngle(e.yon, a[2]));
          B[2].quaternion.setFromAxisAngle(e.yan, -a[3]); B[3].quaternion.setFromAxisAngle(e.yan, -a[4]);
        } else {
          const a = P.p[f - 1], b = 1 + f * 3;
          B[b].quaternion.setFromAxisAngle(e.ust, -a[1]).multiply(qA.setFromAxisAngle(e.yan, -a[0]));
          B[b + 1].quaternion.setFromAxisAngle(e.yan, -a[2]); B[b + 2].quaternion.setFromAxisAngle(e.yan, -a[3]);
        }
      });
      const k = P.kok, ay = el.taraf === 'sol' ? -1 : 1, ek = ekKok || {};
      el.kok.position.set((k.x + (ek.x || 0)) * ay, k.y + (ek.y || 0), k.z + (ek.z || 0));
      // duruş: önce elin kendi ekseninde yuvarlanma (rz), sonra eğim (rx), dünya Z'de dönme (rw), en son dünya dikeyinde (ry)
      el.kok.quaternion.setFromAxisAngle(eY, (k.ry + (ek.ry || 0)) * ay).multiply(qA.setFromAxisAngle(eZ, ((k.rw || 0) + (ek.rw || 0)) * ay)).multiply(qB.setFromAxisAngle(eX, k.rx + (ek.rx || 0))).multiply(qC.setFromAxisAngle(eZ, (k.rz + (ek.rz || 0)) * ay));
      el.kok.scale.set(ay, 1, 1);
      el.kok.updateMatrixWorld(true);
      el.poz = P;
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
      const yol = o.yol(P.sekil, P.nw, P.L, P.form), hw = P.nw / 2, R = kalite === 0 ? 26 : 36, C = kalite === 0 ? 10 : 14;
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
        case 'heykelHayalet': { const l = []; const b = kure(.42, 20, 14); b.scale(1, .55, 1.25); b.translate(0, .2, -.05); l.push(b); [-.28, 0, .28].forEach(x => { const t = kure(.15, 12, 8); t.scale(1, .5, 1); t.translate(x, .08, .42); l.push(t); }); g = birlestir(l); break; }
        case 'heykelKabak': { const l = []; for (let k = 0; k < 6; k++) { const s = kure(.24, 16, 10); s.scale(.75, .7, 1.15); s.rotateY(k * Math.PI / 6); s.translate(0, .17, 0); l.push(s); } const sap = new THREE.CylinderGeometry(.04, .06, .18, 8); sap.rotateX(-Math.PI / 2.4); sap.translate(0, .32, -.32); l.push(sap.toNonIndexed()); g = birlestir(l); break; }
        case 'heykelAyicik': { const l = []; const k0 = kure(.38, 20, 14); k0.scale(1, .6, 1); k0.translate(0, .22, 0); l.push(k0); [-.3, .3].forEach(x => { const k = kure(.14, 12, 8); k.scale(1, .6, 1); k.translate(x, .22, -.32); l.push(k); }); const bu = kure(.14, 12, 8); bu.scale(1, .5, .8); bu.translate(0, .33, .14); l.push(bu); g = birlestir(l); break; }
        case 'heykelPalyaco': { const l = []; const y = kure(.4, 20, 14); y.scale(1, .5, 1.15); y.translate(0, .18, 0); l.push(y); const bu = kure(.11, 14, 10); bu.translate(0, .38, .08); l.push(bu); [-.33, .33].forEach(x => { const s = kure(.16, 12, 8); s.scale(1, .7, 1); s.translate(x, .22, -.3); l.push(s); }); g = birlestir(l); break; }
        case 'heykelKiraz': { const l = []; [-.18, .18].forEach(x => { const k = kure(.2, 16, 12); k.translate(x, .2, .12); l.push(k); }); const sap = new THREE.TorusGeometry(.32, .025, 6, 16, Math.PI * .6); sap.rotateX(-Math.PI / 2); sap.translate(0, .32, .25); l.push(sap.toNonIndexed()); g = birlestir(l); break; }
        case 'heykelYildiz': g = yatayExtrude(YILDIZ(), .14, .16, .12, 5); break;
        case 'heykelSekiz': { g = kure(.45, 24, 16); g.scale(1, .6, 1); g.translate(0, .22, 0); break; }
        case 'heykelMantar': { const l = []; const s = new THREE.SphereGeometry(.42, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); s.scale(1, .6, 1); s.translate(0, .22, -.08); l.push(s.toNonIndexed()); const a = kure(.17, 12, 8); a.scale(1, .5, 1.6); a.translate(0, .1, .28); l.push(a); g = birlestir(l); break; }
        case 'zincir': { const l = []; for (let k = 0; k < 7; k++) { const t = new THREE.TorusGeometry(.065, .022, 6, 14); t.scale(1.5, 1, 1); if (k % 2) t.rotateX(Math.PI / 2); t.translate(-.43 + k * .143, .05, 0); l.push(t); } g = birlestir(l); break; }
        default: g = tasLathe(8);
      }
      G(g); susGeoOnbellek.set(id, g); return g;
    }
    const METAL = ['charmYildiz', 'charmKalp', 'charmAy', 'charmKelebek', 'charmFiyonk', 'charmPati', 'halka', 'civi', 'zincir'];
    const INCI = ['inci', 'inciMini', 'inciYarim', 'inciDamla', 'inciSira'];
    const JEL = ['kalp3d', 'fiyonk3d', 'cicek3d', 'heykelGul', 'heykelDamla', 'heykelHayalet', 'heykelKabak', 'heykelAyicik', 'heykelPalyaco', 'heykelKiraz', 'heykelYildiz', 'heykelSekiz', 'heykelMantar'];
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
      const pr = el.parmaklar[i], p = pr.p, e = pr.eks;
      const grup = new THREE.Group();
      const bil = o.bilgi(taraf, i);
      const nw = bil.nw, geri = (nw * 1.28 - nw * .1) * K;
      // kütikül merkezi: parmak ucundan geriye; yükseklik: deri yüzeyine oturur (alan boyunca iniş)
      const J2 = new V3(...p.J[2]), J3 = new V3(...p.J[3]);
      const C = J3.clone().addScaledVector(e.yon, -geri + p.r[3] * .18);
      const bas = C.clone().addScaledVector(e.ust, .6), t = ELM.yuzeyeIn([bas.x, bas.y, bas.z], [e.ust.x, e.ust.y, e.ust.z], 1.2);
      const S = bas.addScaledVector(e.ust, -t - .012);
      const sx = new V3().crossVectors(e.yon, e.ust).normalize();
      const mm = new THREE.Matrix4().makeBasis(sx, e.ust, e.yon.clone().negate()); mm.setPosition(S.sub(J2));
      grup.matrixAutoUpdate = false; grup.matrix.copy(mm);
      pr.kemik.add(grup);
      const c = document.createElement('canvas'); c.width = 8; c.height = 8;
      const doku = TX(new THREE.CanvasTexture(c)); doku.colorSpace = THREE.SRGBColorSpace; doku.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      const mt = tirnakMalzemesi(); mt.map = doku;
      const n = { taraf, i, el, grup, c, g: c.getContext('2d'), doku, mt, mesh: null, geoKey: '', P: null, kutu: null, susGrup: new THREE.Group(), kivrim: null, hale: null, susKey: '', islakBas: 0, nw, ekGrup: new THREE.Group() };
      grup.add(n.susGrup); grup.add(n.ekGrup);
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
      n.kivrim.children.forEach(ch => { ch.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(ch.geometry.attributes.position.count * 3).fill(1).map((v, k) => k % 3 ? .965 : 1), 3)); ch.castShadow = false; ch.receiveShadow = true; });
    }
    function tirnakYenile(n, ilk) {
      const bil = o.bilgi(n.taraf, n.i); if (!bil) return;
      const t = bil.t, nw = bil.nw, L = bil.L, m3 = bil.m3 || {};
      const jel = t.jel || {}, katK = Math.min(3, t.kat || 0) * .12 + (jel.base ? .12 : 0) + (jel.builder ? .35 * jel.builder : 0);
      const P = { sekil: t.sekil, nw, hw: nw / 2, L, yatak: nw * 1.28, c: nw * .2, th: (t.protez ? 2.3 : 1.55) + (m3.kapsul ? 1 : 0) + (t.top ? .3 : 0) + katK, cc: 1.15, apex: Math.max((t.protez && t.protez !== 'tips') || m3.kapsul ? nw * .055 : 0, (jel.builder || 0) * nw * .09), form: t.form && Array.isArray(t.form.k) ? t.form : null };
      P.kutu = tirnakKutu(nw, L);
      const key = [t.sekil, nw.toFixed(2), L.toFixed(2), P.th.toFixed(2), P.apex.toFixed(2), kalite, P.form ? P.form.k.map(v => v.toFixed(3)).join(',') : ''].join('|');
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
      ekKur(n, t);
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
    /* PRO katmanları (3D nesne): taşan oje lekeleri, liquid metal çizgileri, 3D jel heykel yüzeyi */
    const ekMtOnbellek = new Map();
    function ekMt(tur, renk) {
      const key = tur + renk; if (ekMtOnbellek.has(key)) return ekMtOnbellek.get(key);
      let m;
      if (tur === 'metal') m = new THREE.MeshPhysicalMaterial({ color: renk, metalness: 1, roughness: .14, clearcoat: .6, clearcoatRoughness: .08, envMapIntensity: 1.7 });
      else if (tur === 'tasma') m = new THREE.MeshPhysicalMaterial({ color: renk, roughness: .18, clearcoat: 1, clearcoatRoughness: .05 });
      else m = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', vertexColors: true, roughness: .16, clearcoat: 1, clearcoatRoughness: .04, sheen: .3, sheenColor: new THREE.Color('#FFFFFF') });
      MT(m); ekMtOnbellek.set(key, m); return m;
    }
    function ekKur(n, t) {
      const key = JSON.stringify([t.tasma || null, t.metal || null, t.hacim || null]) + n.geoKey;
      if (key === n.ekKey) return; n.ekKey = key;
      n.ekGrup.children.slice().forEach(ch => { n.ekGrup.remove(ch); geoBirak(ch.geometry); });
      const P = n.P, hw = P.hw, L = P.L;
      if (Array.isArray(t.tasma)) t.tasma.forEach(b => {
        if (!b || !/^#[0-9a-f]{6}$/i.test(b.renk)) return;
        const r = Math.max(.3, (b.r || .1) * P.nw), x = b.x * hw, y = -b.y * L;
        const me = new THREE.Mesh(G(new THREE.SphereGeometry(1, 14, 8)), ekMt('tasma', b.renk));
        const h = y > 0 ? -P.th * .2 : yuzeyY(sinir(x, -hw, hw), Math.min(y, -1), P) - P.th;
        me.scale.set(r * 1.25 * K, r * .28 * K, r * .8 * K); me.position.set(x * K, (h + r * .08) * K, y * K); n.ekGrup.add(me);
      });
      if (Array.isArray(t.metal)) t.metal.forEach(sv => {
        const pts = (sv.n || []).map(q => { const x = q[0] * hw, y = -q[1] * L; return new V3(x * K, (yuzeyY(x, y, P) + .15) * K, y * K); });
        if (!pts.length) return; if (pts.length === 1) pts.push(pts[0].clone().add(new V3(.0005, 0, 0)));
        const w = Math.max(.6, (sv.k || .08) * P.nw) * K * .5;
        const egri = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
        const tup = new THREE.Mesh(G(new THREE.TubeGeometry(egri, Math.min(160, pts.length * 4), w, 8, false)), ekMt('metal', /^#[0-9a-f]{6}$/i.test(sv.renk) ? sv.renk : '#D4AF37'));
        tup.scale.set(1, .75, 1); tup.castShadow = true; n.ekGrup.add(tup);
        [pts[0], pts[pts.length - 1]].forEach(u => { const k = new THREE.Mesh(G(new THREE.SphereGeometry(w, 10, 8)), tup.material); k.position.copy(u); k.scale.set(1, .75, 1); n.ekGrup.add(k); });
      });
      const hc = t.hacim;
      if (hc && hc.w && hc.h && typeof hc.d === 'string' && hc.d.length === hc.w * hc.h && /[1-9a-z]/.test(hc.d)) {
        const W = hc.w, H = hc.h, g = new THREE.PlaneGeometry(1, 1, W * 2 - 1, H * 2 - 1), pa = g.attributes.position, renk = [], pal = Array.isArray(hc.p) && hc.p.length ? hc.p : ['#FFFFFF'];
        const deg = (i, j) => { i = sinir(i, 0, W - 1); j = sinir(j, 0, H - 1); return (parseInt(hc.d[j * W + i], 36) || 0) / 35; };
        const yum = (fx, fy) => { const i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j; return (deg(i, j) * (1 - a) + deg(i + 1, j) * a) * (1 - b) + (deg(i, j + 1) * (1 - a) + deg(i + 1, j + 1) * a) * b; };
        const yol = o.yol(P.sekil, P.nw, P.L, P.form), c = new THREE.Color();
        for (let k = 0; k < pa.count; k++) {
          const u = pa.getX(k) + .5, v = .5 - pa.getY(k);
          const x = (-1 + 2 * u) * hw * .96, y = -v * L * .97;
          const hh = yum(u * W - .5, v * H - .5), icinde = tarama.isPointInPath(yol, x, y);
          const yuk = icinde ? hh * P.nw * .55 : 0;
          pa.setXYZ(k, x * K, (yuzeyY(x, y, P) + yuk - (yuk < .02 ? .25 : 0)) * K, y * K);
          const ci = hc.c ? (parseInt(hc.c[sinir(Math.round(v * H - .5), 0, H - 1) * W + sinir(Math.round(u * W - .5), 0, W - 1)], 36) || 0) : 0;
          c.set(/^#[0-9a-f]{6}$/i.test(pal[ci]) ? pal[ci] : pal[0]); renk.push(c.r, c.g, c.b);
        }
        g.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3)); g.computeVertexNormals();
        const me = new THREE.Mesh(G(g), ekMt('hacim', '')); me.castShadow = true; n.ekGrup.add(me);
      }
    }
    const haleMt = MT(new THREE.MeshBasicMaterial({ color: '#FF7FAA', transparent: true, opacity: .75, side: THREE.BackSide, depthWrite: false }));
    const parcaHalka = new THREE.Mesh(G(new THREE.TorusGeometry(.5, .04, 6, 36)), MT(new THREE.MeshBasicMaterial({ color: '#FF5C93', transparent: true, opacity: .9, depthTest: false })));
    parcaHalka.rotation.x = Math.PI / 2; parcaHalka.visible = false; parcaHalka.renderOrder = 10;

    /* ------------------------------------------------------------ PRO araç modelleri: parmağın altında görünür, tırnak yüzeyinde hareketi izler
       Model ucu yerel (0,0,0)'da; gövde +Y yönünde uzanır. Hepsi kodla kurulur; ilk seçimde üretilir ve saklanır. */
    const aracKok = new THREE.Group(); aracKok.visible = false; sahne.add(aracKok);
    const aracModeller = new Map();
    let aracId = null, aracSec = {}, aracDonHiz = 0, aracBit = null, spreyAcik = false, aracPark = true;
    const amt = (o) => MT(new THREE.MeshPhysicalMaterial(o));
    const AM = {
      metal: () => amt({ color: '#D7DCE3', metalness: 1, roughness: .2 }),
      altin: () => amt({ color: '#D9B24A', metalness: 1, roughness: .22 }),
      pembe: () => amt({ color: '#F2A7BE', roughness: .35, clearcoat: .8 }),
      siyah: () => amt({ color: '#2A2530', roughness: .3, clearcoat: .8 }),
      beyaz: () => amt({ color: '#FBF7F5', roughness: .5 }),
      cam: () => amt({ color: '#FFFFFF', roughness: .05, transmission: kalite > 0 ? .9 : 0, transparent: kalite === 0, opacity: kalite === 0 ? .4 : 1, thickness: .1, ior: 1.5 })
    };
    const KUM_RENK = { 80: '#5E5A60', 100: '#2C2A30', 180: '#F2A7BE', 240: '#F7F2EE' };
    function silindir(r1, r2, h, mt, seg) { const m = new THREE.Mesh(G(new THREE.CylinderGeometry(r1, r2, h, seg || 16)), mt); m.position.y = h / 2; m.castShadow = true; return m; }
    function kil(f, renk) {   // fırça kılları: uç şekline göre
      const g = new THREE.Group(), uz = .16 * (f.uz || 1), gen = Math.max(.012, (f.g || .05) * .55), mt = amt({ color: renk || '#E8C9A8', roughness: .55, sheen: .5 });
      let geo;
      if (f.sk === 'd' || f.sk === 'a' || f.sk === 'f') { geo = new THREE.BoxGeometry(f.sk === 'f' ? gen * 2.4 : gen * 1.4, uz, .012); geo.translate(0, uz / 2, 0); if (f.sk === 'a') { const p = geo.attributes.position; for (let k = 0; k < p.count; k++) if (p.getY(k) < .001) p.setY(k, (p.getX(k) + gen) * .35); geo.computeVertexNormals(); } }
      else { geo = new THREE.ConeGeometry(gen * .7, uz, 10, 1); geo.rotateX(Math.PI); geo.translate(0, uz / 2, 0); if (f.sk === 'y') geo.scale(1, 1, 1); }
      g.add(new THREE.Mesh(G(geo), mt));
      return { g, uz, mt };
    }
    function modelKur(id, o) {
      const gr = new THREE.Group(), f = o.firca || { sk: 's', g: .05, uz: 1 };
      const sap = (uz, mt) => { const m = silindir(.035, .045, uz, mt || AM.pembe()); return m; };
      switch (id) {
        case 'torpu': {
          const s = o.sekil || 'duz', renk = KUM_RENK[o.kum] || '#F2A7BE', mt = amt({ color: renk, roughness: .95, normalMap: haritaAl('kum'), normalScale: new V2(1.2, 1.2) });
          if (s === 'blok') { const b = new THREE.Mesh(G(new THREE.BoxGeometry(.32, .9, .22)), mt); b.position.y = .45; gr.add(b); }
          else { const geo = new THREE.BoxGeometry(.2, 1.6, .025, 1, 24, 1); geo.translate(0, .8, 0); if (s === 'muz') { const p = geo.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setX(k, p.getX(k) + Math.sin(y / 1.6 * Math.PI) * .14); } geo.computeVertexNormals(); } const b = new THREE.Mesh(G(geo), mt); gr.add(b); }
          break;
        }
        case 'efile': {
          const govde = silindir(.075, .06, .9, AM.pembe(), 24); govde.position.y = .32; gr.add(govde);
          const kafa = silindir(.05, .03, .14, AM.metal()); kafa.position.y = .18; gr.add(kafa);
          const uc = o.uc || 'karbur', umt = uc === 'seramik' ? AM.beyaz() : uc === 'kum' ? amt({ color: '#8A6A4A', roughness: 1, normalMap: haritaAl('kum') }) : amt({ color: '#C9CED6', metalness: 1, roughness: .3, normalMap: haritaAl('puruz'), normalScale: new V2(2, 2) });
          aracBit = new THREE.Group(); const bit = silindir(.026, .03, .18, umt, 14); bit.position.y = 0; aracBit.add(bit); const mil = silindir(.01, .01, .1, AM.metal(), 8); mil.position.y = .14; aracBit.add(mil); gr.add(aracBit);
          const kablo = new THREE.Mesh(G(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new V3(0, 1.2, 0), new V3(.1, 1.6, .1), new V3(.4, 1.9, .3)]), 16, .015, 6)), AM.siyah()); gr.add(kablo);
          break;
        }
        case 'itici': { const s = silindir(.022, .022, 1.2, AM.metal(), 10); s.position.y = .12; gr.add(s); const uc = new THREE.Mesh(G(new THREE.SphereGeometry(.07, 14, 8)), AM.metal()); uc.scale.set(1, .5, .2); uc.position.y = .05; gr.add(uc); break; }
        case 'makas': { [-1, 1].forEach(k => { const b = new THREE.Mesh(G(new THREE.BoxGeometry(.04, .7, .012)), AM.metal()); b.position.set(k * .05, .38, 0); b.rotation.z = k * .12; gr.add(b); const a = new THREE.Mesh(G(new THREE.BoxGeometry(.025, .12, .01)), AM.metal()); a.position.set(k * .012, .04, 0); a.rotation.z = -k * .25; gr.add(a); }); const yay = new THREE.Mesh(G(new THREE.TorusGeometry(.09, .01, 6, 16, Math.PI)), AM.metal()); yay.position.y = .75; gr.add(yay); break; }
        case 'damlalik': case 'damlalik2': { const cam = silindir(.03, .012, .5, AM.cam(), 12); cam.position.y = .02; gr.add(cam); const sv = silindir(.022, .009, .32, amt({ color: o.renk && id === 'damlalik2' ? o.renk : '#F2C14E', roughness: .1 }), 10); sv.position.y = .03; gr.add(sv); const bas = new THREE.Mesh(G(new THREE.SphereGeometry(.06, 14, 10)), AM.siyah()); bas.scale.set(1, 1.6, 1); bas.position.y = .62; gr.add(bas); break; }
        case 'blok': { const b = new THREE.Mesh(G(new THREE.BoxGeometry(.3, .8, .24)), amt({ color: '#FFFFFF', roughness: .9, normalMap: haritaAl('kum') })); b.position.y = .4; gr.add(b); const s2 = new THREE.Mesh(G(new THREE.BoxGeometry(.31, .2, .245)), AM.pembe()); s2.position.y = .4; gr.add(s2); break; }
        case 'tozFirca': case 'firca': case 'temizle': {
          const fr = id === 'tozFirca' ? { sk: 'f', g: .5, uz: 1.4 } : id === 'temizle' ? { sk: 'd', g: .2, uz: .8 } : f;
          const k = kil(fr, id === 'temizle' ? '#FFFFFF' : o.renk && id === 'firca' ? null : null); gr.add(k.g);
          if (id === 'firca' && o.renk) { const boya = new THREE.Mesh(G(new THREE.SphereGeometry(Math.max(.01, (fr.g || .05) * .45), 10, 8)), amt({ color: o.renk, roughness: .15, clearcoat: 1 })); boya.scale.set(1, 1.6, 1); boya.position.y = .02; gr.add(boya); }
          const yuksuk = silindir(.03, .028, .16, AM.metal()); yuksuk.position.y = k.uz; gr.add(yuksuk);
          const s = sap(1.1, id === 'temizle' ? AM.beyaz() : AM.pembe()); s.position.y = k.uz + .16; gr.add(s);
          break;
        }
        case 'ojeFirca': {
          const yuk = o.yuk == null ? 1 : o.yuk, g = new THREE.BoxGeometry(.11, .16, .02); g.translate(0, .08, 0);
          const k = new THREE.Mesh(G(g), amt({ color: o.renk || '#F4CFD8', roughness: .12, clearcoat: 1 })); k.scale.set(1, 1, .6 + yuk * .9); gr.add(k);
          const mil = silindir(.012, .012, .4, AM.siyah()); mil.position.y = .14; gr.add(mil);
          const kapak = silindir(.07, .075, .5, AM.siyah(), 20); kapak.position.y = .5; gr.add(kapak);
          break;
        }
        case 'noktaKalem': { const s = silindir(.025, .025, 1.1, AM.pembe()); s.position.y = .05; gr.add(s); const t = new THREE.Mesh(G(new THREE.SphereGeometry(Math.max(.012, (o.nokta || .1) * .25), 12, 8)), AM.metal()); t.position.y = .02; gr.add(t); break; }
        case 'sunger': { const s = silindir(.02, .02, 1, AM.beyaz()); s.position.y = .12; gr.add(s); const t = new THREE.Mesh(G(new THREE.SphereGeometry(.09, 14, 10)), amt({ color: o.krom || '#FFFFFF', roughness: 1, sheen: 1, sheenColor: new THREE.Color('#FFFFFF'), normalMap: haritaAl('kum') })); t.scale.set(1, 1.5, 1); t.position.y = .1; gr.add(t); break; }
        case 'miknatis': { const s = silindir(.06, .06, .9, AM.pembe(), 20); s.position.y = .2; gr.add(s); const uc = silindir(.06, .04, .2, AM.metal(), 20); uc.position.y = 0; gr.add(uc); const hal = new THREE.Mesh(G(new THREE.TorusGeometry(.06, .008, 6, 20)), AM.altin()); hal.rotation.x = Math.PI / 2; hal.position.y = .2; gr.add(hal); break; }
        case 'cimbiz': { [-1, 1].forEach(k => { const b = new THREE.Mesh(G(new THREE.BoxGeometry(.03, 1, .012)), AM.altin()); b.position.set(k * .03, .5, 0); b.rotation.z = -k * .04; gr.add(b); }); const tas = new THREE.Mesh(G(new THREE.OctahedronGeometry(.045, 0)), amt({ color: o.tas || '#FFFFFF', roughness: 0, metalness: .2, envMapIntensity: 2.5 })); tas.position.y = .02; gr.add(tas); break; }
        case 'spatula': { const s = silindir(.022, .022, 1, AM.beyaz()); s.position.y = .12; gr.add(s); const t = new THREE.Mesh(G(new THREE.SphereGeometry(.07, 14, 8)), amt({ color: '#BFE6F5', roughness: .3 })); t.scale.set(1, .9, .35); t.position.y = .06; gr.add(t); if (o.renk) { const top = new THREE.Mesh(G(new THREE.SphereGeometry(.05, 12, 8)), amt({ color: o.renk, roughness: .12, clearcoat: 1 })); top.position.set(0, .02, .03); gr.add(top); } break; }
        case 'damga': { const t = new THREE.Mesh(G(new THREE.SphereGeometry(.14, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)), amt({ color: o.dolu ? (o.renk || '#FFFFFF') : '#F7F2F8', roughness: .1, transmission: kalite > 0 ? .7 : 0, thickness: .2 })); t.rotation.x = Math.PI; t.position.y = .14; gr.add(t); const s = silindir(.05, .06, .9, AM.pembe()); s.position.y = .14; gr.add(s); break; }
        case 'airbrush': { const s = silindir(.05, .05, .6, AM.metal(), 16); s.rotation.z = 0; s.position.y = .12; gr.add(s); const n = silindir(.006, .03, .12, AM.metal()); n.position.y = 0; gr.add(n); const kap = silindir(.06, .05, .12, AM.cam()); kap.position.set(0, .55, .08); gr.add(kap); const tet = new THREE.Mesh(G(new THREE.BoxGeometry(.02, .06, .08)), AM.altin()); tet.position.set(0, .45, -.06); gr.add(tet); break; }
        case 'ped': { const p = new THREE.Mesh(G(new THREE.BoxGeometry(.5, .5, .02)), amt({ color: '#FFFFFF', roughness: 1, sheen: 1, sheenColor: new THREE.Color('#FFFFFF'), normalMap: haritaAl('havlu') })); p.position.y = .25; gr.add(p); break; }
        case 'pamuk': { const p = new THREE.Mesh(G(new THREE.SphereGeometry(.16, 16, 12)), pamukMt); p.scale.set(1, .7, 1); p.position.y = .1; gr.add(p); break; }
        case 'form': { const g = new THREE.PlaneGeometry(.6, .5); g.translate(0, .25, 0); const p = new THREE.Mesh(G(g), amt({ color: '#F4C3CF', roughness: .8, side: THREE.DoubleSide })); gr.add(p); break; }
        default: { const s = silindir(.03, .03, 1, AM.pembe()); gr.add(s); }
      }
      gr.traverse(ch => { if (ch.isMesh) { ch.castShadow = true; ch.renderOrder = 2; } });
      return gr;
    }
    function aracAnahtar(id, o) { const f = o.firca || {}; return id + '|' + (o.kum || '') + (o.sekil || '') + (o.uc || '') + (id === 'firca' || id === 'ojeFirca' || id === 'spatula' || id === 'damlalik2' ? o.renk + (o.yuk == null ? '' : (o.yuk > .5 ? 'd' : o.yuk > .05 ? 'y' : 'k')) : '') + (f.id || f.sk || '') + (o.tas || '') + (o.krom || '') + (o.dolu ? 'D' : '') + (o.nokta || ''); }
    function aracKur(id, o) {
      aracSec = Object.assign({}, o || {});
      aracKok.children.slice().forEach(ch => aracKok.remove(ch)); aracBit = null;
      aracId = id; if (!id) { aracKok.visible = false; iste(); return; }
      const k = aracAnahtar(id, aracSec);
      let m = aracModeller.get(k); if (!m) { m = modelKur(id, aracSec); aracModeller.set(k, m); if (aracModeller.size > 30) { const ilk = aracModeller.keys().next().value; aracModeller.delete(ilk); } }
      if (id === 'efile') { aracBit = null; m.traverse(ch => { if (ch.isGroup && ch.parent === m && ch.children.length === 2) aracBit = ch; }); }
      aracKok.add(m); aracKok.visible = true; aracPark = true; aracParkKonum(); iste();
    }
    function aracParkKonum() {   // seçili araç kullanılmıyorken elin sağında, havada bekler
      if (!aracId || !tirnaklar.size) return;
      const n = tirnaklar.get(elTaraf + 3) || [...tirnaklar.values()][0]; const p = tirnakDunya(n, n.P.hw * 2.6, -n.P.L * .3);
      aracKok.position.copy(p).add(new V3(.35, .45, .2)); aracKok.quaternion.setFromUnitVectors(yukari, new V3(.35, .9, .25).normalize()); aracKok.scale.setScalar(.85);
    }
    const kSag = new V3(), kUst = new V3(), vN = new V3();
    function aracKonumla(taraf, i, x, y, ek) {
      if (!aracId) return;
      if (taraf == null) { aracPark = true; aracParkKonum(); spreyAcik = false; iste(); return; }
      const n = tirnaklar.get(taraf + i); if (!n) return;
      aracPark = false;
      const P = n.P, yuk = yuzeyY(sinir(x, -P.hw * 1.2, P.hw * 1.2), sinir(y, -P.L, P.nw * .4), P) + (ek && ek.basili ? .1 : 1.5);
      const tip = tirnakDunya(n, x, y, yuk);
      n.grup.updateMatrixWorld(true); vN.set(0, 1, 0).transformDirection(n.grup.matrixWorld);
      kSag.setFromMatrixColumn(kamera.matrixWorld, 0); kUst.setFromMatrixColumn(kamera.matrixWorld, 1);
      const egik = aracId === 'torpu' || aracId === 'blok' || aracId === 'ped' ? .25 : aracId === 'airbrush' ? .5 : .7;
      const govde = vN.clone().multiplyScalar(egik).addScaledVector(kSag, .62).addScaledVector(kUst, .32).normalize();
      if (aracId === 'airbrush') tip.addScaledVector(vN, .45);
      aracKok.position.copy(tip); aracKok.quaternion.setFromUnitVectors(yukari, govde);
      if (ek && ek.aci != null && (aracId === 'torpu' || aracId === 'blok')) aracKok.rotateY(ek.aci * .25);
      aracKok.scale.setScalar(.85);
      if (spreyAcik && Math.random() < .7) parcaAt(tirnakDunya(n, x, y, yuzeyY(x, y, P) + 1), 2, aracSec.renk || '#FF7FB0', .08, .35, -.2);
      iste();
    }
    function aracAnim(dt) {
      if (aracBit && aracDonHiz > 0) { aracBit.rotation.y += dt * aracDonHiz / 60 * Math.PI * 2 * .02; return true; }
      return false;
    }
    // yağ / tutkal / mürekkep damlası: damlalıktan düşer
    const damlalar = [];
    function damlaAt(taraf, i, x, y, renk) {
      const n = tirnaklar.get(taraf + i); if (!n) return;
      const hedef = tirnakDunya(n, x, y, yuzeyY(x, y, n.P) + .3), m = new THREE.Mesh(G(new THREE.SphereGeometry(.035, 12, 8)), amt({ color: renk || '#F2C14E', roughness: .05, transmission: kalite > 0 ? .5 : 0, thickness: .05, clearcoat: 1 }));
      m.position.copy(hedef).add(new V3(0, .5, 0)); m.scale.set(1, 1.3, 1); sahne.add(m);
      damlalar.push({ m, hedef, bas: performance.now() }); iste(900);
    }
    function damlaGuncelle(simdi) {
      for (let k = damlalar.length - 1; k >= 0; k--) {
        const d = damlalar[k], p = (simdi - d.bas) / 650;
        if (p >= 1) { sahne.remove(d.m); geoBirak(d.m.geometry); damlalar.splice(k, 1); continue; }
        if (p < .6) d.m.position.y = d.hedef.y + .5 * (1 - (p / .6) * (p / .6));
        else { const q = (p - .6) / .4; d.m.position.y = d.hedef.y; d.m.scale.set(1 + q * 1.6, Math.max(.15, 1.3 - q * 1.2), 1 + q * 1.6); }
      }
      return damlalar.length > 0;
    }
    // damlalık: dokudan renk oku
    function renkOku(taraf, i, x, y) {
      const n = tirnaklar.get(taraf + i); if (!n) return null;
      const k = n.kutu, px = Math.round((x - k.bx) / k.bw * n.c.width), py = Math.round((y - k.by) / k.bh * n.c.height);
      try { const v = n.g.getImageData(sinir(px, 0, n.c.width - 1), sinir(py, 0, n.c.height - 1), 1, 1).data; if (v[3] < 10) return null; return '#' + [v[0], v[1], v[2]].map(q => q.toString(16).padStart(2, '0')).join('').toUpperCase(); } catch (e) { return null; }
    }

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

    /* ------------------------------------------------------------ kamera: serbest (her açı) / sabit (kilit), hazır açılar */
    const kam = { th: 0, ph: .7, r: 5, hedef: new V3(0, .2, -.4) };
    let tween = null, temel = { th: 0, ph: .7, r: 5, hedef: new V3(0, .2, -.4) }, kamOdak = null, kamAdim = 'renk', kilit = false;
    const SINIR = { phMin: .06, phMax: 3.06, rMin: .32, rMax: 10 };
    function kameraUygula() {
      kam.ph = sinir(kam.ph, SINIR.phMin, SINIR.phMax); kam.r = sinir(kam.r, SINIR.rMin, SINIR.rMax);
      if (kam.th > Math.PI) kam.th -= Math.PI * 2; else if (kam.th < -Math.PI) kam.th += Math.PI * 2;
      const sp = Math.sin(kam.ph);
      kamera.position.set(kam.hedef.x + kam.r * sp * Math.sin(kam.th), kam.hedef.y + kam.r * Math.cos(kam.ph), kam.hedef.z + kam.r * sp * Math.cos(kam.th));
      kamera.lookAt(kam.hedef);
      // kamera masanın altına inince (avuç tarafı) masa ve ürünler gizlenir
      const alt = kamera.position.y < .04;
      masa.visible = !alt; urunler.visible = !alt; havlu.visible = !alt && poz === 'duz';
    }
    const vT = new V3();
    function temelHesapla() {
      const kutu = new THREE.Box3(), pv = pozVeri(poz), pk = pv.kam || {};
      tirnaklar.forEach(n => { kutu.expandByPoint(tirnakDunya(n, -n.P.hw * 1.5, -n.P.L * 1.05)); kutu.expandByPoint(tirnakDunya(n, n.P.hw * 1.5, -n.P.L * 1.05)); kutu.expandByPoint(tirnakDunya(n, 0, n.P.nw * 1.3)); });
      if (!pk.hedefParmak) eller.forEach(e => { e.kemikler.forEach((b, j) => { if (j === 0 || (j - 1) % 3 === 0) kutu.expandByPoint(b.getWorldPosition(vT)); }); });
      if (kutu.isEmpty()) kutu.set(new V3(-1.5, 0, -2.4), new V3(1.5, .4, 2));
      const m = kutu.getCenter(new V3()), boy = kutu.getSize(new V3());
      const tf = Math.tan(kamera.fov * Math.PI / 360);
      if (poz === 'duz') {
        const yarim = Math.max(boy.z * .5 * .82, boy.x * .5 / Math.max(.4, kamera.aspect)) * 1.22;
        temel = { th: 0, ph: .62, r: sinir(yarim / tf, 2.2, 9), hedef: new V3(m.x, .3, m.z - boy.z * .06) };
      } else {
        const dikey = Math.max(boy.y, boy.z * Math.abs(Math.cos(pk.ph || 1.2)) + boy.y * .3), yarim = Math.max(dikey * .5, boy.x * .5 / Math.max(.4, kamera.aspect)) * 1.25;
        temel = { th: pk.th || 0, ph: pk.ph || 1.2, r: sinir(yarim / tf, 1.4, 9), hedef: m.clone() };
      }
    }
    const ADIM_KAMERA = {
      hazirlik: { ph: .52, th: 0, r: 1.02, dz: 0 }, sekil: { ph: .95, th: .38, r: .96, dz: -.15 }, taban: { ph: .42, th: -.06, r: .97, dz: -.05 },
      renk: { ph: .62, th: 0, r: 1, dz: 0 }, sanat: { ph: .38, th: 0, r: .9, dz: -.1 }, sus: { ph: .5, th: .12, r: .9, dz: -.1 }, efekt: { ph: .45, th: -.1, r: .92, dz: -.1 }, ust: { ph: .98, th: -.36, r: .96, dz: -.15 }, final: { ph: .7, th: .1, r: 1.15, dz: 0 }
    };
    function hedefAdim(adim) {
      if (poz !== 'duz') return { th: temel.th, ph: temel.ph, r: temel.r, hedef: temel.hedef.clone() };
      const a = ADIM_KAMERA[adim] || ADIM_KAMERA.renk; return { th: a.th, ph: a.ph, r: temel.r * a.r, hedef: temel.hedef.clone().add(new V3(0, 0, a.dz)) };
    }
    function hedefTirnak(n, ph) {
      const m = tirnakDunya(n, 0, -n.P.L * .42), boy = (n.P.L + n.P.nw * 1.6) * K;
      // tırnağın yüzey normaline bakan açı
      n.grup.updateMatrixWorld(true);
      const nrm = new V3(0, 1, 0).transformDirection(n.grup.matrixWorld), ileri = new V3(0, 0, -1).transformDirection(n.grup.matrixWorld);
      const yon = nrm.clone().multiplyScalar(.9).addScaledVector(ileri, -.45).normalize();
      let th = Math.atan2(yon.x, yon.z), p2 = Math.acos(sinir(yon.y, -1, 1));
      if (ph != null) p2 = ph;
      return { th, ph: sinir(p2, .12, 2.9), r: sinir(boy / Math.tan(kamera.fov * Math.PI / 360) * .72, .38, 3), hedef: m };
    }
    function kameraGit(h, sure) {
      if (!h) return;
      if (o.azHareket() || sure === 0) { tween = null; Object.assign(kam, { th: h.th, ph: h.ph, r: h.r }); kam.hedef.copy(h.hedef); kameraUygula(); iste(); return; }
      let th = h.th; while (th - kam.th > Math.PI) th -= Math.PI * 2; while (th - kam.th < -Math.PI) th += Math.PI * 2;
      tween = { bas: performance.now(), sure: sure || 950, a: { th: kam.th, ph: kam.ph, r: kam.r, hedef: kam.hedef.clone() }, b: Object.assign({}, h, { th }) };
      iste(sure || 950);
    }
    const HAZIR_ACI = { ust: { th: 0, ph: .08, r: 1.05 }, yan: { th: 1.45, ph: 1.32, r: .95 }, on: { th: 0, ph: 1.25, r: 1 }, avuc: { th: 0, ph: 2.78, r: 1.05 } };

    /* ------------------------------------------------------------ sahne kurulumu + poz geçişleri */
    let ornekler = [], poz = 'duz', elTaraf = 'sag';
    let pozAnim = null, sallaBas = 0;
    function elleriTemizle() {
      tirnaklar.forEach(n => { n.grup.traverse(ch => { if (ch.isMesh && ch.geometry && !susGeoOnbellek.has(ch.geometry) && ch.geometry !== pGeo) { if (ch !== n.hale) geoBirak(ch.geometry); } }); mtBirak(n.mt); txBirak(n.doku); });
      tirnaklar.clear();
      eller.forEach(e => { e.kok.traverse(ch => { if (ch.isMesh && geolar.has(ch.geometry) && !susGeoOnbellek.has(ch.geometry)) geoBirak(ch.geometry); }); if (e.mesh.skeleton) e.mesh.skeleton.dispose(); dunya.remove(e.kok); });
      eller = [];
    }
    function fincanYerlestir() {
      const fv = poz === 'fincan' && eller.length;
      fincan.visible = !!fv;
      if (!fv) return;
      // fincan avucun içinde: orta boğumların avuç tarafında, ağzı yukarı
      const e = eller[0], m = new V3(); [4, 7, 10].forEach(j => m.add(e.kemikler[j].getWorldPosition(new V3()))); m.multiplyScalar(1 / 3);
      const avucYon = new V3(0, -1, 0).transformDirection(e.kok.matrixWorld);
      m.addScaledVector(avucYon, .62);
      fincan.scale.setScalar(.85); fincan.position.set(m.x, m.y - .45, m.z); fincan.rotation.set(0, .6, 0); const tb = fincan.getObjectByName('tabak'); if (tb) tb.visible = false;
    }
    function sahneKur(v) {
      ornekler = v.ornekler; elTaraf = v.el || 'sag';
      const yeniPoz = ELM.POZ[v.poz] ? v.poz : (v.poz === 'kalp' ? 'kalp' : 'duz');
      elleriTemizle();
      const e = elKur(elTaraf); eller.push(e);
      poz = yeniPoz; pozUygula(e, pozVeri(poz));
      e.parmaklar.forEach((p, i) => tirnakOlustur(e, i, e.taraf));
      havlu.position.set(.06, 0, .6); havlu.rotation.y = -.06;
      fincanYerlestir();
      temelHesapla();
      kameraGit(kamOdak && tirnaklar.get(kamOdak) ? hedefTirnak(tirnaklar.get(kamOdak)) : hedefAdim(kamAdim), 0);
      iste();
    }
    function pozGit(id, sure) {
      if (!ELM.POZ[id] || !eller.length) return;
      const e = eller[0], bas = pozKopya(e.poz || pozVeri(poz)), hedef = pozVeri(id);
      poz = id; kamOdak = null;
      if (o.azHareket() || sure === 0) { pozAnim = null; pozUygula(e, hedef); pozBitti(0); return; }
      pozAnim = { bas: performance.now(), sure: sure || 900, a: bas, b: hedef };
      // kamera: yeni pozun son hâline göre (kilit açıksa)
      if (!kilit) { const s0 = pozKopya(e.poz); pozUygula(e, hedef); fincanYerlestir(); temelHesapla(); const h = hedefAdim(kamAdim); pozUygula(e, s0); kameraGit(h, sure || 900); }
      iste((sure || 900) + 100);
    }
    function pozBitti(kamSure) {
      fincanYerlestir(); temelHesapla();
      if (!kilit && kamSure != null) kameraGit(hedefAdim(kamAdim), kamSure);
      if (pozVeri(poz).salla && !o.azHareket()) sallaBas = performance.now();
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
    function lambaBaslat(ms) { if (poz !== 'duz') { pozGit('duz', 0); kameraGit(hedefAdim(kamAdim), 0); } anim.lamba = { bas: performance.now(), sure: ms, hedef: parmakUcMerkez() }; iste(ms + 200); }
    function kaseBaslat(ms) { anim.kase = { bas: performance.now(), sure: ms, hedef: parmakUcMerkez() }; kase.visible = true; iste(ms + 200); }
    function guncelle(simdi, dt) {
      let devam = false;
      if (tween) {
        const p = sinir((simdi - tween.bas) / tween.sure, 0, 1), e = kolay(p);
        kam.th = tween.a.th + (tween.b.th - tween.a.th) * e; kam.ph = tween.a.ph + (tween.b.ph - tween.a.ph) * e; kam.r = tween.a.r + (tween.b.r - tween.a.r) * e;
        kam.hedef.lerpVectors(tween.a.hedef, tween.b.hedef, e); kameraUygula();
        if (p >= 1) tween = null; else devam = true;
      }
      if (pozAnim && eller.length) {
        const a = pozAnim, p = sinir((simdi - a.bas) / a.sure, 0, 1);
        pozUygula(eller[0], pozKaris(a.a, a.b, kolay(p)));
        if (p >= 1) { pozAnim = null; pozBitti(); } else devam = true;
      }
      if (sallaBas && eller.length && !anim.lamba) {
        const t = (simdi - sallaBas) / 1000;
        if (t > 2.6 || poz !== 'selam') { sallaBas = 0; pozUygula(eller[0], pozVeri(poz)); }
        else { pozUygula(eller[0], pozVeri(poz), { rw: Math.sin(t * Math.PI * 2 * 1.6) * .16 * Math.sin(Math.min(1, t / 2.6) * Math.PI) }); devam = true; }
      }
      if (anim.lamba) {
        // lamba elin önüne gelir, el lambanın içine kayar, mor ışık nabız atar; sonra el çıkar, lamba yerine döner
        const a = anim.lamba, p = sinir((simdi - a.bas) / a.sure, 0, 1);
        const lg = p < .12 ? kolay(p / .12) : p > .9 ? kolay((1 - p) / .1) : 1;
        const eg = p < .12 ? 0 : p < .24 ? kolay((p - .12) / .12) : p > .78 ? (p > .9 ? 0 : kolay((.9 - p) / .12)) : 1;
        lamba.position.set(LAMBA_PARK.x + (a.hedef.x - LAMBA_PARK.x) * lg, 0, LAMBA_PARK.z + (a.hedef.z - .9 - LAMBA_PARK.z) * lg);
        lamba.scale.setScalar(LAMBA_PARK.s + (1.18 - LAMBA_PARK.s) * lg); lamba.rotation.y = LAMBA_PARK.r * (1 - lg);
        if (eller.length) { const e = eller[0]; pozUygula(e, e.poz || pozVeri(poz), { z: -1.15 * eg }); }
        const nab = eg * (.75 + .25 * Math.sin(simdi / 120));
        lambaLed.emissiveIntensity = nab * 3.4; uvIsik.intensity = nab * 7; uvIsik.position.set(lamba.position.x, .95, lamba.position.z);
        if (Math.random() < .3 * eg) parcaAt(new V3(lamba.position.x + (Math.random() - .5) * 1.4, .5, lamba.position.z + (Math.random() - .5) * 1), 1, '#B48CFF', .1, .8, .1);
        if (p >= 1) { anim.lamba = null; lambaLed.emissiveIntensity = 0; uvIsik.intensity = 0; lamba.position.set(LAMBA_PARK.x, 0, LAMBA_PARK.z); lamba.scale.setScalar(LAMBA_PARK.s); lamba.rotation.y = LAMBA_PARK.r; if (eller.length) pozUygula(eller[0], pozVeri(poz)); } else devam = true;
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
      if (aracAnim(dt)) devam = true;
      if (damlaGuncelle(simdi)) devam = true;
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
    function vur(cx, cy, hafif) {
      const rc = isin(cx, cy);
      const tm = []; tirnaklar.forEach(n => { if (n.mesh) tm.push(n.mesh); });
      const h = rc.intersectObjects(tm, false)[0];
      if (h) { const n = h.object.userData.tirnak; const l = n.mesh.worldToLocal(h.point.clone()); return { taraf: n.taraf, i: n.i, x: l.x / K, y: l.z / K }; }
      if (hafif) return null;
      const em = []; eller.forEach(e => e.kok.traverse(ch => { if (ch.isMesh && ch.userData.el) em.push(ch); }));
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
    function ekran(taraf, i, ny, nx) {
      const n = tirnaklar.get(taraf + i), r = tuval.getBoundingClientRect(); if (!n) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const v = tirnakDunya(n, (nx || 0) * n.P.hw, -n.P.L * (ny == null ? .5 : ny)).project(kamera);
      return { x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height };
    }

    /* ------------------------------------------------------------ fotoğraf: render → tuval (JPEG'e tirnak.js çevirir) */
    function foto(w, h) {
      const eski = new V2(); renderer.getSize(eski); const pr = renderer.getPixelRatio(), eskiFov = kamera.fov, eskiAsp = kamera.aspect;
      const haleler = []; tirnaklar.forEach(n => { if (n.hale.visible) { haleler.push(n.hale); n.hale.visible = false; } }); const phv = parcaHalka.visible; parcaHalka.visible = false; const akv = aracKok.visible; aracKok.visible = false;
      const yeniAsp = w / h;
      if (yeniAsp < eskiAsp) kamera.fov = 2 * Math.atan(Math.tan(eskiFov * Math.PI / 360) * eskiAsp / yeniAsp) * 180 / Math.PI;
      renderer.setPixelRatio(1); renderer.setSize(w, h, false); kamera.aspect = yeniAsp; kamera.updateProjectionMatrix();
      renderer.render(sahne, kamera);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(tuval, 0, 0, w, h);
      haleler.forEach(x => { x.visible = true; }); parcaHalka.visible = phv; aracKok.visible = akv;
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
        if (typeof h === 'string') { kamAdim = h; if (kilit) return; kamOdak = null; kameraGit(hedefAdim(h), sure); }
        else if (h && tirnaklar.get(h.taraf + h.i)) { if (kilit) return; kamOdak = h.taraf + h.i; kameraGit(hedefTirnak(tirnaklar.get(kamOdak)), sure == null ? 1100 : sure); }
        else { if (kilit) return; kamOdak = null; kameraGit(hedefAdim(kamAdim), sure); }
      },
      odakta: () => !!kamOdak,
      giris() { const h = hedefAdim(kamAdim); Object.assign(kam, { th: h.th + .9, ph: Math.min(SINIR.phMax, h.ph + .35), r: h.r * 1.7 }); kam.hedef.copy(h.hedef); kameraUygula(); kameraGit(h, 1600); },
      dondur(dx, dy) { if (kilit) return; tween = null; kam.th -= dx * .006; kam.ph -= dy * .005; kameraUygula(); iste(); },
      yakinlas(k) { if (kilit) return; tween = null; kam.r *= k; kameraUygula(); iste(); },
      kaydir(dx, dy) { if (kilit) return; tween = null; const sag = new V3().setFromMatrixColumn(kamera.matrixWorld, 0), ileri = new V3().setFromMatrixColumn(kamera.matrixWorld, 1); const s = kam.r * .0016; kam.hedef.addScaledVector(sag, -dx * s).addScaledVector(ileri, dy * s); kam.hedef.y = sinir(kam.hedef.y, -1, 3); kam.hedef.x = sinir(kam.hedef.x, -4, 4); kam.hedef.z = sinir(kam.hedef.z, -5, 4); kameraUygula(); iste(); },
      /* kamera modları: kilit (sabit), hazır açılar, sıfırla */
      kilit(v) { kilit = !!v; if (kilit) tween = null; return kilit; },
      kilitli: () => kilit,
      aci(ad, sec) {
        const eski = kilit; kilit = false;
        if (ad === 'yakin') { const n = (sec && tirnaklar.get(sec.taraf + sec.i)) || tirnaklar.get(elTaraf + 2); if (n) { kamOdak = n.taraf + n.i; kameraGit(hedefTirnak(n), 900); } }
        else if (ad === 'sifirla') { kamOdak = null; temelHesapla(); kameraGit(hedefAdim(kamAdim), 900); }
        else { const a = HAZIR_ACI[ad]; if (a) { kamOdak = null; temelHesapla(); kameraGit({ th: a.th, ph: a.ph, r: temel.r * a.r, hedef: temel.hedef.clone() }, 1000); } }
        kilit = eski; iste(1100);
      },
      /* pozlar */
      poz(id, sure) { pozGit(id, sure); },
      pozAd: () => poz,
      pozHazir: () => !pozAnim,
      pozOzel(P) { if (!eller.length) return; pozUygula(eller[0], P); fincanYerlestir(); temelHesapla(); kameraGit(hedefAdim(kamAdim), 0); iste(); },
      // tırnak kontrol pozu: el kıvrılır, kamera tırnaklara yaklaşır, ışık güzelleşir
      kontrolPozu(acik) {
        if (acik) { renderer.toneMappingExposure = .95; gezenIsik.intensity = 2.2; const m = parmakUcMerkez(); gezenIsik.position.set(m.x + 1, m.y + 1.6, m.z + 1.4); anahtarKonum(.6); iste(1200); }
        else { renderer.toneMappingExposure = .82; gezenIsik.intensity = 0; anahtarKonum(); iste(); }
      },
      kontrolKamera() { const ns = [...tirnaklar.values()].filter(n => n.i > 0); if (!ns.length) return; const kutu = new THREE.Box3(); ns.forEach(n => { kutu.expandByPoint(tirnakDunya(n, 0, -n.P.L)); kutu.expandByPoint(tirnakDunya(n, 0, 0)); }); const m = kutu.getCenter(new V3()), b = kutu.getSize(new V3()); const n = ns[1]; const h = hedefTirnak(n); kameraGit({ th: h.th, ph: h.ph, r: sinir(Math.max(b.x, b.y, b.z) * .75 / Math.tan(kamera.fov * Math.PI / 360), .7, 4), hedef: m }, 900); },
      islak(taraf, i) { const n = tirnaklar.get(taraf + i); if (n) { n.islakBas = performance.now(); iste(5400); } },
      parilti(taraf, i, adet, renk) { const n = tirnaklar.get(taraf + i); if (!n) return; for (let k = 0; k < 3; k++) parcaAt(tirnakDunya(n, (Math.random() - .5) * n.P.nw * .8, -n.P.L * Math.random()), Math.ceil((adet || 12) / 3), renk || '#FFFFFF', .35, 1.1, .45); },
      toz(taraf, i, x, y, renk) { const n = tirnaklar.get(taraf + i); if (n) parcaAt(tirnakDunya(n, x, y), 3, renk || '#FFFFFF', .25, .7, .25); },
      lamba: lambaBaslat, kase: kaseBaslat,
      /* PRO araçları */
      arac(id, sec) { aracKur(id, sec); },
      aracGuncelle(sec) { if (aracId && aracAnahtar(aracId, Object.assign({}, aracSec, sec)) !== aracAnahtar(aracId, aracSec)) { const p = aracKok.position.clone(), q = aracKok.quaternion.clone(), park = aracPark; aracKur(aracId, Object.assign({}, aracSec, sec)); if (!park) { aracKok.position.copy(p); aracKok.quaternion.copy(q); aracPark = false; } } },
      aracKonum(taraf, i, x, y, ek) { aracKonumla(taraf, i, x, y, ek); },
      aracDon(rpm) { aracDonHiz = rpm || 0; if (rpm) iste(60000); else iste(); },
      aracBilgi: () => ({ id: aracId, gorunur: aracKok.visible, park: aracPark, konum: aracKok.position.toArray().map(v => +v.toFixed(3)) }),
      damla: damlaAt, renkOku, sprey(v) { spreyAcik = !!v; },
      parlama(ms) { anim.parlama = { bas: performance.now(), sure: ms || 1100 }; iste((ms || 1100) + 100); },
      vitrin(acik) {
        if (acik) { anim.vitrin = { bas: performance.now() }; iste(); }
        else { anim.vitrin = null; gezenIsik.intensity = 0; eller.forEach(e => { e.ic.rotation.y = 0; e.ic.position.y = 0; e.ic.updateMatrixWorld(true); }); anahtarKonum(); iste(); }
      },
      vitrinde: () => !!anim.vitrin,
      foto, boyutla, iste,
      kaliteAyarla(q) { kaliteMod = q == null ? 'oto' : q; const yeni = kaliteMod === 'oto' ? (mobil ? 1 : 2) : sinir(Number(q) || 0, 0, 2); if (yeni !== kalite) { kalite = yeni; kaliteUygula(); } },
      bilgi() { const mem = renderer.info.memory; return { fps: Math.round(fps.olculen), kalite, kaliteMod, kam: { th: +kam.th.toFixed(3), ph: +kam.ph.toFixed(3), r: +kam.r.toFixed(3) }, vitrin: !!anim.vitrin, lamba: !!anim.lamba, poz, kilit, pozAnim: !!pozAnim, elKose: eller.length ? eller[0].mesh.geometry.attributes.position.count : 0, geometri: mem.geometries, doku: mem.textures, program: (renderer.info.programs || []).length, izlenen: { geo: geolar.size, malzeme: malzemeler.size, doku: dokular.size }, ciz: renderer.info.render.calls, ucgen: renderer.info.render.triangles }; },
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
