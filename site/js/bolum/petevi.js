/* js/bolum/petevi.js — Pixel Pet Evi
   Kesit görünümlü ev: salon · mutfak · banyo · yatak odası · balkon (sağa sola kaydırılır).
   8 pixel pet (petler-miras.js sprite'ları) odalarda yaşar; her birinin rolü, kişiliği ve ihtiyaçları ayrı.
   Bakım: besle / yıka / uyut / oyna / sev. İhtiyaçlar gerçek zamanla yavaşça azalır (cd.petevi.durum).
   Kimse ölmez, ceza yok — en kötüsü "seni özledim". */
(() => {
  'use strict';
  const ID = 'petevi';
  const UYKU_SURE = 18000, UYKU_KAZANC = 45, MAKS_SAAT = 48, AZALMA_ARALIK = 20000;
  const GEZ_MIN = 32000, GEZ_MAX = 58000, OLAY_MIN = 20000, OLAY_MAX = 38000;

  /* ------------------------------------------------------------ odalar */
  const ODALAR = [
    { id: 'salon', ad: 'Salon', e: 'salona', ikon: '🛋️', tanim: 'Koltuk, lamba ve dedikodu köşesi.' },
    { id: 'mutfak', ad: 'Mutfak', e: 'mutfağa', ikon: '🍳', tanim: 'Fırın sıcak, kurabiye kokuyor.' },
    { id: 'banyo', ad: 'Banyo', e: 'banyoya', ikon: '🛁', tanim: 'Köpük, ördek ve biraz sessizlik.' },
    { id: 'yatak', ad: 'Yatak odası', e: 'yatak odasına', ikon: '🛏️', tanim: 'Pembe battaniye burada.' },
    { id: 'balkon', ad: 'Balkon', e: 'balkona', ikon: '🌿', tanim: 'Saksılar, havuçlar ve gökyüzü.' }
  ];
  const odaIndeks = (id) => Math.max(0, ODALAR.findIndex(o => o.id === id));
  const odaTanim = (id) => ODALAR[odaIndeks(id)];

  // Mobilyalar: inline SVG, çizgi rengi ortak (--pixel-cizgi), dolgular token (gece kendiliğinden uyar).
  const MOBILYA = {
    salon: `
      <div class="petevi-mobilya petevi-m-tablo" aria-hidden="true"><svg viewBox="0 0 64 54"><rect x="2" y="2" width="60" height="50" rx="6" class="petevi-r-bal"/><rect x="9" y="9" width="46" height="36" rx="3" class="petevi-r-kagit"/><path d="M32 22c-3-6-12-4-12 2 0 6 12 14 12 14s12-8 12-14c0-6-9-8-12-2z" class="petevi-r-kiraz"/></svg></div>
      <div class="petevi-mobilya petevi-m-sus" aria-hidden="true"><svg viewBox="0 0 240 46"><path d="M2 4C62 34 178 34 238 4" class="petevi-ince"/><path d="M12 12h20l-10 18z" class="petevi-r-kiraz"/><path d="M46 21h20l-10 18z" class="petevi-r-limon"/><path d="M84 25h20l-10 18z" class="petevi-r-nane"/><path d="M136 25h20l-10 18z" class="petevi-r-lavanta"/><path d="M174 21h20l-10 18z" class="petevi-r-gok"/><path d="M208 12h20l-10 18z" class="petevi-r-seftali"/></svg></div>
      <div class="petevi-mobilya petevi-m-saat" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" class="petevi-r-seftali"/><circle cx="24" cy="24" r="16" class="petevi-r-limon petevi-ns"/><path d="M24 7v3M24 38v3M7 24h3M38 24h3" class="petevi-ince"/><path d="M24 13v11l7 5" class="petevi-kalin"/><circle cx="24" cy="24" r="2.2" class="petevi-r-ink petevi-ns"/></svg></div>
      <div class="petevi-mobilya petevi-m-pencere" aria-hidden="true"><svg viewBox="0 0 120 96"><rect x="14" y="6" width="92" height="84" rx="8" class="petevi-r-seftali"/><rect x="22" y="14" width="76" height="68" rx="5" class="petevi-r-gok petevi-gok-cam"/><circle cx="76" cy="36" r="11" class="petevi-r-limon petevi-ns petevi-gunes"/><path d="M80 26a12 12 0 1 0 7 20 9 9 0 1 1-7-20z" class="petevi-r-limon petevi-ns petevi-ay"/><path d="M60 14v68M22 48h76" class="petevi-r-seftali"/><path d="M4 4h22v86c-8-5-14-5-22 0z" class="petevi-r-burun"/><path d="M94 4h22v86c-8-5-14-5-22 0z" class="petevi-r-burun"/><path d="M8 52c6-3 12-3 18 0M94 52c6-3 12-3 18 0" class="petevi-ince petevi-s-kiraz"/><rect x="2" y="0" width="116" height="7" rx="3.5" class="petevi-r-ink petevi-ns"/></svg></div>
      <div class="petevi-mobilya petevi-m-lamba" aria-hidden="true"><svg viewBox="0 0 48 150"><path d="M12 2h24l6 34H6z" class="petevi-r-limon"/><rect x="21" y="36" width="6" height="100" rx="2" class="petevi-r-gri"/><ellipse cx="24" cy="140" rx="18" ry="7" class="petevi-r-gri"/><ellipse cx="24" cy="40" rx="4" ry="1.5" class="petevi-r-ink petevi-ns"/></svg><i class="petevi-isik"></i></div>
      <div class="petevi-mobilya petevi-m-koltuk" aria-hidden="true"><svg viewBox="0 0 160 84"><rect x="14" y="8" width="132" height="52" rx="16" class="petevi-r-burun"/><rect x="6" y="40" width="148" height="32" rx="13" class="petevi-r-kiraz"/><rect x="4" y="30" width="24" height="42" rx="11" class="petevi-r-burun"/><rect x="132" y="30" width="24" height="42" rx="11" class="petevi-r-burun"/><rect x="40" y="18" width="34" height="26" rx="9" class="petevi-r-kagit"/><rect x="86" y="18" width="34" height="26" rx="9" class="petevi-r-lavanta"/><rect x="16" y="70" width="12" height="12" rx="4" class="petevi-r-ink petevi-ns"/><rect x="132" y="70" width="12" height="12" rx="4" class="petevi-r-ink petevi-ns"/></svg></div>
      <div class="petevi-mobilya petevi-m-hali" aria-hidden="true"><svg viewBox="0 0 200 26"><ellipse cx="100" cy="13" rx="98" ry="11" class="petevi-r-lavanta"/><ellipse cx="100" cy="13" rx="70" ry="7" class="petevi-r-kagit2 petevi-ns"/></svg></div>
      <div class="petevi-tunek petevi-t-raf" aria-hidden="true"></div>
      <div class="petevi-mobilya petevi-m-raf" aria-hidden="true"><svg viewBox="0 0 120 40"><rect x="2" y="30" width="116" height="8" rx="3" class="petevi-r-seftali"/><rect x="14" y="8" width="16" height="22" rx="3" class="petevi-r-gok"/><rect x="34" y="4" width="14" height="26" rx="3" class="petevi-r-kiraz"/><rect x="52" y="12" width="18" height="18" rx="3" class="petevi-r-nane"/><circle cx="92" cy="20" r="10" class="petevi-r-limon"/></svg></div>`,
    mutfak: `
      <div class="petevi-mobilya petevi-m-aski" aria-hidden="true"><svg viewBox="0 0 100 60"><rect x="2" y="4" width="96" height="6" rx="3" class="petevi-r-gri"/><path d="M22 10v8M50 10v8M78 10v8" class="petevi-ince"/><rect x="19" y="18" width="6" height="16" rx="3" class="petevi-r-bal"/><path d="M12 34h20v6a10 6 0 0 1-20 0z" class="petevi-r-gri"/><rect x="47" y="18" width="6" height="18" rx="3" class="petevi-r-bal"/><path d="M38 36h24a12 10 0 0 1-24 0z" class="petevi-r-gri"/><rect x="75" y="18" width="6" height="12" rx="3" class="petevi-r-bal"/><circle cx="78" cy="43" r="13" class="petevi-r-kiraz"/><circle cx="78" cy="43" r="7" class="petevi-r-seftali petevi-ns"/></svg></div>
      <div class="petevi-mobilya petevi-m-tahta" aria-hidden="true"><svg viewBox="0 0 120 90"><rect x="2" y="2" width="116" height="86" rx="6" class="petevi-r-bal"/><rect x="10" y="10" width="100" height="70" rx="3" class="petevi-r-ink petevi-ns"/><text x="60" y="38" text-anchor="middle" class="petevi-tebesir">Menü</text><path d="M30 48h60" class="petevi-ince petevi-s-tebesir"/><text x="60" y="70" text-anchor="middle" class="petevi-tebesir petevi-tebesir-kucuk">kurabiye ♥</text></svg></div>
      <div class="petevi-mobilya petevi-m-dolap" aria-hidden="true"><svg viewBox="0 0 66 140"><rect x="2" y="2" width="62" height="136" rx="10" class="petevi-r-burun"/><rect x="2" y="54" width="62" height="3" class="petevi-r-ink petevi-ns"/><rect x="50" y="18" width="5" height="26" rx="2.5" class="petevi-r-kagit"/><rect x="50" y="70" width="5" height="40" rx="2.5" class="petevi-r-kagit"/><path d="M20 84c-2-4-8-3-8 1 0 4 8 9 8 9s8-5 8-9c0-4-6-5-8-1z" class="petevi-r-kiraz petevi-ns"/></svg></div>
      <div class="petevi-tunek petevi-t-tezgah" aria-hidden="true"></div>
      <div class="petevi-mobilya petevi-m-tezgah" aria-hidden="true"><svg viewBox="0 0 190 116"><rect x="2" y="24" width="186" height="90" rx="10" class="petevi-r-nane"/><rect x="0" y="16" width="190" height="14" rx="5" class="petevi-r-kagit"/><rect x="18" y="46" width="60" height="58" rx="8" class="petevi-r-kagit2"/><rect x="112" y="46" width="60" height="58" rx="8" class="petevi-r-kagit2"/><circle cx="48" cy="75" r="4" class="petevi-r-ink petevi-ns"/><circle cx="142" cy="75" r="4" class="petevi-r-ink petevi-ns"/><ellipse cx="120" cy="17" rx="14" ry="4" class="petevi-r-ink petevi-ns"/><ellipse cx="60" cy="17" rx="14" ry="4" class="petevi-r-ink petevi-ns"/><path d="M40 16V6a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v10" class="petevi-r-kiraz"/><rect x="36" y="0" width="48" height="6" rx="3" class="petevi-r-ink petevi-ns"/></svg><i class="petevi-buhar"></i></div>
      <div class="petevi-mobilya petevi-m-kavanoz" aria-hidden="true"><svg viewBox="0 0 110 44"><rect x="2" y="36" width="106" height="6" rx="3" class="petevi-r-seftali"/><rect x="10" y="14" width="20" height="22" rx="5" class="petevi-r-bal"/><rect x="12" y="8" width="16" height="8" rx="3" class="petevi-r-kagit"/><rect x="42" y="10" width="22" height="26" rx="5" class="petevi-r-kiraz"/><rect x="44" y="4" width="18" height="8" rx="3" class="petevi-r-kagit"/><rect x="76" y="16" width="18" height="20" rx="5" class="petevi-r-gok"/><rect x="78" y="10" width="14" height="8" rx="3" class="petevi-r-kagit"/></svg></div>`,
    banyo: `
      <div class="petevi-mobilya petevi-m-lombar" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="37" class="petevi-r-gri"/><circle cx="40" cy="40" r="28" class="petevi-r-gok petevi-gok-cam"/><circle cx="50" cy="30" r="6" class="petevi-r-kagit petevi-ns"/><ellipse cx="30" cy="48" rx="9" ry="4" class="petevi-r-kagit petevi-ns"/><path d="M40 12v56M12 40h56" class="petevi-ince"/><circle cx="40" cy="6" r="2" class="petevi-r-ink petevi-ns"/><circle cx="40" cy="74" r="2" class="petevi-r-ink petevi-ns"/><circle cx="6" cy="40" r="2" class="petevi-r-ink petevi-ns"/><circle cx="74" cy="40" r="2" class="petevi-r-ink petevi-ns"/></svg></div>
      <div class="petevi-mobilya petevi-m-havlu-raf" aria-hidden="true"><svg viewBox="0 0 90 50"><rect x="2" y="40" width="86" height="8" rx="3" class="petevi-r-seftali"/><rect x="10" y="22" width="30" height="18" rx="5" class="petevi-r-kiraz"/><rect x="10" y="29" width="30" height="4" class="petevi-r-kagit petevi-ns"/><rect x="48" y="14" width="32" height="26" rx="6" class="petevi-r-lavanta"/><rect x="48" y="24" width="32" height="4" class="petevi-r-kagit petevi-ns"/><rect x="14" y="8" width="22" height="14" rx="4" class="petevi-r-gok"/></svg></div>
      <div class="petevi-mobilya petevi-m-ayna" aria-hidden="true"><svg viewBox="0 0 76 150"><ellipse cx="38" cy="34" rx="28" ry="30" class="petevi-r-gok"/><ellipse cx="30" cy="26" rx="8" ry="10" class="petevi-r-kagit petevi-ns"/><rect x="4" y="96" width="68" height="20" rx="8" class="petevi-r-kagit"/><rect x="10" y="114" width="56" height="34" rx="7" class="petevi-r-burun"/><rect x="34" y="82" width="8" height="16" rx="3" class="petevi-r-gri"/></svg></div>
      <div class="petevi-tunek petevi-t-kuvet" aria-hidden="true"></div>
      <div class="petevi-mobilya petevi-m-kuvet" aria-hidden="true"><svg viewBox="0 0 190 110"><rect x="0" y="30" width="190" height="16" rx="8" class="petevi-r-kagit"/><path d="M12 44h166v34a24 24 0 0 1-24 24H36a24 24 0 0 1-24-24z" class="petevi-r-kagit"/><rect x="24" y="52" width="142" height="14" rx="7" class="petevi-r-gok petevi-ns"/><circle cx="60" cy="34" r="12" class="petevi-r-kagit petevi-ns petevi-kopukcuk"/><circle cx="86" cy="28" r="9" class="petevi-r-kagit petevi-ns petevi-kopukcuk"/><circle cx="118" cy="32" r="13" class="petevi-r-kagit petevi-ns petevi-kopukcuk"/><path d="M140 22c-8 0-12 6-12 11 0 4 3 6 8 6h12c5 0 7-3 7-6 0-4-3-6-6-6-1-3-4-5-9-5z" class="petevi-r-limon"/><circle cx="145" cy="27" r="1.6" class="petevi-r-ink petevi-ns"/><path d="M150 30l5 1-5 2" class="petevi-r-seftali"/><path d="M160 14v14M166 14h-12" class="petevi-r-gri"/><rect x="20" y="100" width="14" height="10" rx="4" class="petevi-r-ink petevi-ns"/><rect x="156" y="100" width="14" height="10" rx="4" class="petevi-r-ink petevi-ns"/></svg></div>
      <div class="petevi-mobilya petevi-m-havlu" aria-hidden="true"><svg viewBox="0 0 40 70"><circle cx="20" cy="6" r="4" class="petevi-r-gri"/><path d="M8 10h24v50a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z" class="petevi-r-kiraz"/><rect x="8" y="30" width="24" height="6" class="petevi-r-kagit petevi-ns"/></svg></div>`,
    yatak: `
      <div class="petevi-mobilya petevi-m-isiklar" aria-hidden="true"><svg viewBox="0 0 300 60"><path d="M0 6C50 40 100 40 150 6C200 40 250 40 300 6" class="petevi-ince"/><rect x="34" y="24" width="6" height="5" class="petevi-r-gri petevi-ns"/><ellipse cx="37" cy="36" rx="5" ry="7" class="petevi-r-limon petevi-ns petevi-ampul"/><rect x="72" y="30" width="6" height="5" class="petevi-r-gri petevi-ns"/><ellipse cx="75" cy="42" rx="5" ry="7" class="petevi-r-kiraz petevi-ns petevi-ampul"/><rect x="110" y="24" width="6" height="5" class="petevi-r-gri petevi-ns"/><ellipse cx="113" cy="36" rx="5" ry="7" class="petevi-r-lavanta petevi-ns petevi-ampul"/><rect x="184" y="24" width="6" height="5" class="petevi-r-gri petevi-ns"/><ellipse cx="187" cy="36" rx="5" ry="7" class="petevi-r-nane petevi-ns petevi-ampul"/><rect x="222" y="30" width="6" height="5" class="petevi-r-gri petevi-ns"/><ellipse cx="225" cy="42" rx="5" ry="7" class="petevi-r-gok petevi-ns petevi-ampul"/><rect x="260" y="24" width="6" height="5" class="petevi-r-gri petevi-ns"/><ellipse cx="263" cy="36" rx="5" ry="7" class="petevi-r-seftali petevi-ns petevi-ampul"/></svg></div>
      <div class="petevi-mobilya petevi-m-cerceve" aria-hidden="true"><svg viewBox="0 0 110 52"><rect x="2" y="6" width="44" height="40" rx="5" class="petevi-r-bal"/><rect x="8" y="12" width="32" height="28" rx="3" class="petevi-r-kagit"/><path d="M24 35c-4-4-10-7-10-12 0-3 2-5 5-5 2 0 4 1 5 3 1-2 3-3 5-3 3 0 5 2 5 5 0 5-6 8-10 12z" class="petevi-r-kiraz petevi-ns"/><rect x="58" y="2" width="50" height="46" rx="5" class="petevi-r-lavanta"/><rect x="64" y="8" width="38" height="34" rx="3" class="petevi-r-kagit"/><circle cx="74" cy="21" r="3" class="petevi-r-gri petevi-ns"/><circle cx="80" cy="16" r="3" class="petevi-r-gri petevi-ns"/><circle cx="87" cy="16" r="3" class="petevi-r-gri petevi-ns"/><circle cx="93" cy="21" r="3" class="petevi-r-gri petevi-ns"/><ellipse cx="83" cy="29" rx="7" ry="5.5" class="petevi-r-gri petevi-ns"/></svg></div>
      <div class="petevi-mobilya petevi-m-pencere" aria-hidden="true"><svg viewBox="0 0 100 88"><rect x="2" y="2" width="96" height="84" rx="10" class="petevi-r-seftali"/><rect x="10" y="10" width="80" height="68" rx="6" class="petevi-r-gok petevi-gok-cam"/><circle cx="66" cy="34" r="12" class="petevi-r-limon petevi-ns petevi-gunes"/><path d="M70 22a13 13 0 1 0 8 22 10 10 0 1 1-8-22z" class="petevi-r-limon petevi-ns petevi-ay"/><path d="M50 10v68M10 44h80" class="petevi-r-seftali"/></svg></div>
      <div class="petevi-tunek petevi-t-basucu" aria-hidden="true"></div>
      <div class="petevi-mobilya petevi-m-yatak" aria-hidden="true"><svg viewBox="0 0 200 112"><rect x="4" y="2" width="44" height="100" rx="12" class="petevi-r-bal"/><rect x="4" y="56" width="192" height="34" rx="10" class="petevi-r-kagit"/><path d="M60 56h134a2 2 0 0 1 2 2v30H60z" class="petevi-r-battaniye"/><path d="M70 62h120M70 70h120M70 78h120" class="petevi-r-battaniye-koyu petevi-ince"/><rect x="18" y="40" width="40" height="22" rx="9" class="petevi-r-kagit"/><rect x="4" y="88" width="192" height="16" rx="6" class="petevi-r-bal"/><rect x="14" y="102" width="12" height="10" rx="4" class="petevi-r-ink petevi-ns"/><rect x="176" y="102" width="12" height="10" rx="4" class="petevi-r-ink petevi-ns"/></svg></div>
      <div class="petevi-mobilya petevi-m-komodin" aria-hidden="true"><svg viewBox="0 0 60 96"><path d="M14 2h32l6 28H8z" class="petevi-r-kiraz"/><rect x="27" y="30" width="6" height="14" class="petevi-r-gri"/><rect x="4" y="44" width="52" height="50" rx="8" class="petevi-r-lavanta"/><rect x="24" y="62" width="12" height="4" rx="2" class="petevi-r-ink petevi-ns"/></svg></div>`,
    balkon: `
      <div class="petevi-mobilya petevi-m-gunes" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="22" class="petevi-r-limon petevi-ns petevi-gunes"/><path d="M48 16a26 26 0 1 0 18 34 20 20 0 1 1-18-34z" class="petevi-r-limon petevi-ns petevi-ay"/></svg></div>
      <div class="petevi-mobilya petevi-m-asili" aria-hidden="true"><svg viewBox="0 0 60 120"><path d="M30 0v14M30 14L16 44M30 14l14 30" class="petevi-ince petevi-s-bal"/><path d="M12 44h36l-4 22H16z" class="petevi-r-burun"/><rect x="9" y="40" width="42" height="8" rx="3" class="petevi-r-burun"/><path d="M16 66c-6 12-4 26 2 40M30 66c0 14 2 28-2 44M44 66c6 12 4 26-2 40" class="petevi-ince petevi-s-yaprak"/><circle cx="13" cy="78" r="3.2" class="petevi-r-yaprak petevi-ns"/><circle cx="15" cy="92" r="3.2" class="petevi-r-yaprak petevi-ns"/><circle cx="18" cy="104" r="3.2" class="petevi-r-yaprak petevi-ns"/><circle cx="30" cy="80" r="3.2" class="petevi-r-yaprak petevi-ns"/><circle cx="31" cy="94" r="3.2" class="petevi-r-yaprak petevi-ns"/><circle cx="29" cy="108" r="3.2" class="petevi-r-yaprak petevi-ns"/><circle cx="47" cy="78" r="3.2" class="petevi-r-yaprak petevi-ns"/><circle cx="45" cy="92" r="3.2" class="petevi-r-yaprak petevi-ns"/><circle cx="42" cy="104" r="3.2" class="petevi-r-yaprak petevi-ns"/></svg></div>
      <div class="petevi-bulut petevi-bulut-1" aria-hidden="true"></div>
      <div class="petevi-bulut petevi-bulut-2" aria-hidden="true"></div>
      <div class="petevi-tunek petevi-t-korkuluk" aria-hidden="true"></div>
      <div class="petevi-korkuluk" aria-hidden="true"></div>
      <div class="petevi-mobilya petevi-m-saksi1" aria-hidden="true"><svg viewBox="0 0 60 80"><path d="M30 44V20" class="petevi-r-yaprak"/><circle cx="30" cy="16" r="10" class="petevi-r-kiraz"/><circle cx="30" cy="16" r="3.5" class="petevi-r-limon petevi-ns"/><path d="M8 44h44l-5 34H13z" class="petevi-r-seftali"/><rect x="4" y="40" width="52" height="8" rx="3" class="petevi-r-seftali"/></svg></div>
      <div class="petevi-mobilya petevi-m-saksi2" aria-hidden="true"><svg viewBox="0 0 60 80"><path d="M18 44l6-22M30 44V18M42 44l-6-22" class="petevi-r-yaprak"/><path d="M14 22l6-8 4 8M26 18l4-8 4 8M38 22l4-8 4 8" class="petevi-r-seftali"/><path d="M8 44h44l-5 34H13z" class="petevi-r-burun"/><rect x="4" y="40" width="52" height="8" rx="3" class="petevi-r-burun"/></svg></div>
      <div class="petevi-mobilya petevi-m-saksi3" aria-hidden="true"><svg viewBox="0 0 60 80"><path d="M30 44V16" class="petevi-r-yaprak"/><path d="M30 20l-10-8M30 26l10-8M30 30l-8-6" class="petevi-r-lavanta"/><path d="M8 44h44l-5 34H13z" class="petevi-r-gok"/><rect x="4" y="40" width="52" height="8" rx="3" class="petevi-r-gok"/></svg></div>`
  };

  /* ------------------------------------------------------------ ihtiyaçlar */
  const IHTIYACLAR = [
    { id: 'aclik', ad: 'Karın', ikon: '🍽️', renk: 'var(--seker-seftali)', eylem: 'besle', eylemAd: 'Besle', eylemIkon: '🍽️' },
    { id: 'uyku', ad: 'Enerji', ikon: '💤', renk: 'var(--seker-lavanta)', eylem: 'uyut', eylemAd: 'Uyut', eylemIkon: '💤' },
    { id: 'temizlik', ad: 'Temizlik', ikon: '🫧', renk: 'var(--seker-nane)', eylem: 'yika', eylemAd: 'Yıka', eylemIkon: '🫧' },
    { id: 'eglence', ad: 'Eğlence', ikon: '🎈', renk: 'var(--seker-limon)', eylem: 'oyna', eylemAd: 'Oyna', eylemIkon: '🎈' },
    { id: 'sevgi', ad: 'Sevgi', ikon: '❤️', renk: 'var(--seker-kiraz)', eylem: 'sev', eylemAd: 'Sev', eylemIkon: '❤️' }
  ];
  const ihtiyacBul = (id) => IHTIYACLAR.find(n => n.id === id);
  const eylemIhtiyac = (eylem) => IHTIYACLAR.find(n => n.eylem === eylem);

  /* ------------------------------------------------------------ petler: rol, kişilik, ihtiyaç, sözler */
  const PETLER = [
    {
      id: 'ayi', ev: 'mutfak', rolIkon: '🍳',
      kisilik: 'Evin aşçısı. Fırından kurabiye kokusu geliyorsa o çıkarmıştır; fiyonku hep un içinde.',
      sever: [['🍯', 'Bal'], ['🍪', 'Kurabiye'], ['👩‍🍳', 'Birlikte pişirmek'], ['🎀', 'Fiyonkunun övülmesi']],
      sevmez: ['Aç kalmak', 'Yanmış kek'],
      yemek: [['🍯', 'Bal'], ['🍪', 'Kurabiye'], ['🥞', 'Pankek'], ['🍰', 'Pasta']],
      oyun: { emoji: '🥣', ad: 'Hamur yoğur' },
      azalma: { aclik: 3, uyku: 4, temizlik: 4, eglence: 4, sevgi: 5 },
      soz: {
        selam: ['Cemre! Fırın sıcak.', 'Kurabiye kokusu aldın mı?', 'Önlüğüm yeni, beğendin mi?'],
        besle: ['Aşçı da yer, hehe', 'Mmm, bal!', 'Tarifini alabilir miyim?'],
        yika: ['Un her yerimde…', 'Köpük de bal gibi!', 'Fiyonkum ıslandı, olsun'],
        uyut: ['Hamur mayalansın, ben de…', 'zzz… kurabiye…', 'Sabah pankek yaparım'],
        uyan: ['Günaydın! Fırın hazır.', 'Rüyamda kek vardı'],
        oyna: ['Hamur yoğurmak spordur', 'Birlikte pişirelim!', 'Un savaşı!'],
        sev: ['Ponçik ponçik ♥', 'Kalbim kek gibi kabardı', 'Cemre ♥'],
        doydu: ['Doydum, teşekkürler', 'Karnım fırın kadar dolu'],
        ozledim: ['Seni özledim Cemre', 'Fırın soğudu…', 'Kurabiyeler seni bekledi'],
        bos: ['Kurabiye çıkarayım mı?', 'Bal bitti mi acaba', 'Fiyonkum düz mü?', 'Tarif: bol sevgi']
      }
    },
    {
      id: 'hayalet', ev: 'salon', rolIkon: '🌙',
      kisilik: 'Gece bekçisi. Işık sevmez, mum ışığında huzur bulur; herkes uyuyunca devriyeye çıkar.',
      sever: [['🕯️', 'Mum ışığı'], ['🌙', 'Karanlık'], ['📖', 'Hikâye'], ['👻', 'Buu demek']],
      sevmez: ['Parlak ışık', 'Gündüz gürültüsü'],
      yemek: [['🍬', 'Şeker'], ['🧁', 'Kek'], ['🫐', 'Yaban mersini'], ['🍡', 'Mochi']],
      oyun: { emoji: '👻', ad: 'Saklambaç' },
      azalma: { aclik: 4, uyku: 3, temizlik: 5, eglence: 4, sevgi: 4 },
      ozel: { temizlik: { ad: 'Loşluk', ikon: '🕯️', eylemAd: 'Mum yak', eylemIkon: '🕯️', anim: 'mum' } },
      soz: {
        selam: ['Buu! Şaka şaka', 'Gece nöbetindeyim', 'Işığı kısar mısın?'],
        besle: ['Hayaletler de acıkır', 'Mum ışığında yemek…', 'Hoop, yuttum!'],
        yika: ['Ahh, loşluk…', 'Mum ışığı, en sevdiğim', 'Karanlık = huzur'],
        uyut: ['Hayaletler uyur mu? Evet', 'zzz… buu…', 'Gündüz uyurum ben'],
        uyan: ['Nöbet başlasın', 'Uyandım, herkes güvende'],
        oyna: ['Perde arkasındayım', 'Beni bul!', 'Hihi, buradayım'],
        sev: ['Kalbim şeffaf ama dolu', 'Fiyonkum kızardı', '♥ buu ♥'],
        doydu: ['Yeter, süzülemiyorum', 'Doydum, teşekkür'],
        ozledim: ['Seni bekledim Cemre', 'Gece uzun geçti…'],
        bos: ['Herkes uyudu mu?', 'Işık çok parlak…', 'Buu.', 'Gece en güzel vakit', 'Devriye zamanı']
      }
    },
    {
      id: 'flork', ev: 'salon', rolIkon: '🎭',
      kisilik: 'Dramatik. Her şey ya harika ya felaket; alkış ister, görmezden gelinince "nooo" der.',
      sever: [['👏', 'Alkış'], ['🎤', 'Sahne'], ['☕', 'Dedikodu'], ['🎬', 'Dram']],
      sevmez: ['Görmezden gelinmek', 'Sessizlik'],
      yemek: [['🍕', 'Pizza'], ['🍟', 'Patates'], ['🍩', 'Donut'], ['🧋', 'Boba']],
      oyun: { emoji: '👏', ad: 'Alkışla' },
      azalma: { aclik: 5, uyku: 4, temizlik: 3, eglence: 8, sevgi: 6 },
      soz: {
        selam: ['SONUNDA geldin!', 'Cemre! Hayatım kurtuldu', 'Beni unuttun sandım'],
        besle: ['Dünyanın en iyi yemeği!', 'Ağlayabilirim, o kadar iyi', 'Bir dilim daha? Hayır mı? AH'],
        yika: ['Su! Soğuk! Çok soğuk!', 'Köpük beni yutuyor!', 'Aslında hoşmuş…'],
        uyut: ['Uyuyamam, dram var', 'zzz… ses çıkarma!', 'İyi geceler dünya'],
        uyan: ['Uyandım. Dramatik.', 'Rüyamda alkış vardı'],
        oyna: ['Alkış! ALKIŞ!', 'Sahne benim!', 'Bravo diyebilirsin'],
        sev: ['Ah, kalbim!', 'Beni seviyorsun!', 'Bu an tarihe geçti'],
        doydu: ['Yeter, patlayacağım!', 'Doydum. Dramatik şekilde.'],
        ozledim: ['Nerelerdeydin?!', 'Beni yalnız bıraktın…', 'nooo…'],
        bos: ['!', 'Kimse beni anlamıyor', 'Dedikodu var mı?', 'Salonda sahne kurdum', 'Nooo, gitme']
      }
    },
    {
      id: 'top', ev: 'balkon', rolIkon: '⚽',
      kisilik: 'Sporcu. Yerinde duramaz, balkonu pist sanır; en sevdiği kelime "bir tur daha".',
      sever: [['🏃', 'Koşu'], ['🦘', 'Zıplamak'], ['🏆', 'Rekor'], ['🥤', 'Serin su']],
      sevmez: ['Uzun oturmak', 'Yavaşlık'],
      yemek: [['🍌', 'Muz'], ['🥜', 'Fıstık'], ['🍎', 'Elma'], ['🥤', 'Soğuk su']],
      oyun: { emoji: '⚽', ad: 'Zıpla' },
      azalma: { aclik: 8, uyku: 3, temizlik: 5, eglence: 9, sevgi: 4 },
      soz: {
        selam: ['Zıp zıp! Selam!', 'Antrenman saati!', 'Hazır ol, zıpla!'],
        besle: ['Enerji doldu!', 'Protein! Yani… şeker', 'Yakıt aldım'],
        yika: ['Ter attım, banyo şart', 'Köpükle zıplamak!', 'Parlıyorum!'],
        uyut: ['Sporcu uykusu kısa', 'zzz… zıp…', 'Yarın maraton var'],
        uyan: ['Isınma turu!', 'Kalk kalk kalk!'],
        oyna: ['Daha yükseğe!', 'Rekor kırdım!', 'Bir tur daha!'],
        sev: ['Kalbim zıplıyor!', 'Sarıl, ama hızlı!', '♥ zıp ♥'],
        doydu: ['Doydum, yuvarlanamıyorum', 'Yeter, ağırlaşırım'],
        ozledim: ['Antrenman iptal oldu…', 'Seni bekledim Cemre'],
        bos: ['Zıp!', 'Yerinde sayıyorum', 'Balkon en iyi pist', 'On şınav daha', 'Kim yarışır?']
      }
    },
    {
      id: 'kedi', ev: 'yatak', rolIkon: '😴',
      kisilik: 'Tembel. Güneş lekesi bulur, kutuya girer, sırıtır. Banyoyu sevmez ama tüyü parlayınca kabul eder.',
      sever: [['☀️', 'Güneş lekesi'], ['📦', 'Kutu'], ['🧶', 'Yumak'], ['💤', 'Kestirmek']],
      sevmez: ['Banyo', 'Erken kalkmak'],
      yemek: [['🐟', 'Balık'], ['🥛', 'Süt'], ['🍗', 'Tavuk'], ['🧀', 'Peynir']],
      oyun: { emoji: '🧶', ad: 'Yumak' },
      azalma: { aclik: 5, uyku: 7, temizlik: 2, eglence: 3, sevgi: 4 },
      ozel: { uyku: { eylemAd: 'Kestir', eylemIkon: '💤' } },
      soz: {
        selam: ['mrrr… ne var?', 'Uyandırdın. Sırıtıyorum.', 'Miyav. Geldin.'],
        besle: ['Yatarak yesem?', 'Miyav, güzelmiş', 'Bir tabak daha, sonra uyku'],
        yika: ['hmph, ıslandım', 'Banyo mu? …kısa olsun', 'Tüyüm parlıyor, kabul'],
        uyut: ['En sevdiğim eylem', 'zzz… nihayet', 'Beni uyandırma'],
        uyan: ['mrr… beş dakika daha', 'Uyandım. Yine uyurum.'],
        oyna: ['Kutuya girdim, bitti', 'Yumak… peki, biraz', 'Tembelce oynadım'],
        sev: ['mrrrr…', 'Sırıtışım büyüdü', 'Tamam, sev, ben de sevdim'],
        doydu: ['Doydum, şimdi uyku', 'Karnım dolu, gözüm kapalı'],
        ozledim: ['Uyurken seni özledim', 'Güneş lekesi soğudu…'],
        bos: ['zzz…', 'Güneş lekesi nerede?', 'Kutu var mı?', 'Sırıt.', 'Tembellik bir sanattır']
      }
    },
    {
      id: 'tavsan', ev: 'balkon', rolIkon: '🥕',
      kisilik: 'Bahçıvan. Balkondaki saksılar onun; havuç ekmeyi ve çiçek sulamayı her şeyden çok sever.',
      sever: [['🥕', 'Havuç'], ['🌱', 'Tohum ekmek'], ['💧', 'Çiçek sulamak'], ['🌸', 'Sakura']],
      sevmez: ['Gürültü', 'Kuru toprak'],
      yemek: [['🥕', 'Havuç'], ['🥬', 'Marul'], ['🍓', 'Çilek'], ['🥦', 'Brokoli']],
      oyun: { emoji: '🌱', ad: 'Çiçek sula' },
      azalma: { aclik: 7, uyku: 4, temizlik: 5, eglence: 4, sevgi: 4 },
      ozel: { aclik: { ad: 'Havuç', ikon: '🥕', eylemAd: 'Havuç ver', eylemIkon: '🥕' } },
      soz: {
        selam: ['Havuç? Havuç!', 'Çiçekler seni sordu', 'Toprak kokusu, mükemmel'],
        besle: ['Havuç! Havuç!', 'Çıtır çıtır…', 'Bahçeden taze, en iyisi'],
        yika: ['Toprak çıktı, temizim', 'Kulaklarım ıslak', 'Su çiçeklere de olsun'],
        uyut: ['Kulaklarımı katlayıp…', 'zzz… havuç tarlası…', 'Tohumlar da uyur'],
        uyan: ['Sulama saati!', 'Günaydın çiçekler'],
        oyna: ['Çiçekleri suladık!', 'Bahçede hop hop', 'Toprak kazdım'],
        sev: ['Burnum titredi ♥', 'Kulaklarım pembeleşti', 'Sen benim bahçemsin'],
        doydu: ['Havuç deposu dolu', 'Doydum, teşekkürler'],
        ozledim: ['Çiçekler susadı…', 'Seni bekledim Cemre'],
        bos: ['Havuç ekmeli', 'Tomurcuk açtı!', 'Hop hop', 'Toprak temiz, ben değil', 'Lavanta kokuyor']
      }
    },
    {
      id: 'bibble', ev: 'banyo', rolIkon: '😒',
      kisilik: 'Somurtkan. Köşesini sever, fazla ilgiye "hmph" der; ama sevilince gizlice sevinir.',
      sever: [['🍬', 'Pürtük şeker'], ['🪑', 'Kendi köşesi'], ['🤫', 'Sessizlik'], ['🫧', 'Köpük (itiraf etmez)']],
      sevmez: ['Fazla ilgi (sözde)', 'Yüksek ses'],
      yemek: [['🍬', 'Pürtük şeker'], ['🍫', 'Çikolata'], ['🍪', 'Kurabiye'], ['🍮', 'Puding']],
      oyun: { emoji: '🎲', ad: 'Zar at' },
      azalma: { aclik: 4, uyku: 3, temizlik: 3, eglence: 3, sevgi: 2 },
      soz: {
        selam: ['hmph.', 'Ne var.', '…selam. Sanırım.'],
        besle: ['Pürtük şeker mi? …peki', 'Yerim. Sevdiğimden değil.', 'hmph, lezzetliymiş'],
        yika: ['Islatma beni. …tamam.', 'Köpük saçma. Güzel saçma.', 'hmph, temizim'],
        uyut: ['Zaten uyuyacaktım', 'zzz… hmph…', 'Işık kapansın'],
        uyan: ['Uyandım. Ne olmuş.', 'hmph, sabah'],
        oyna: ['Oyun mu? …bir tur', 'Kazandım. Hep kazanırım.', 'Eğlenmedim. (Eğlendim.)'],
        sev: ['hmph.', 'Yapma. …biraz daha.', 'Kimseye söyleme'],
        doydu: ['Yeter. Doydum.', 'hmph, dolu'],
        ozledim: ['…beklemedim. Bekledim.', 'hmph. Nerelerdeydin.'],
        bos: ['hmph.', 'Köşem rahat', 'pürtük!', 'Bakma bana', 'Sessizlik iyidir']
      }
    },
    {
      id: 'pittiksu', ev: 'yatak', rolIkon: '🍼', gezer: false,
      kisilik: 'Evin misafir bebeği. Süt, kucak ve pembe battaniye; soğuğu hiç sevmez, kısa süre uyanık kalır.',
      sever: [['🍼', 'Süt'], ['🤲', 'Kucak'], ['🧶', 'Pembe battaniye'], ['🪶', 'Tüy kovalamak']],
      sevmez: ['Soğuk', 'Yalnız kalmak'],
      yemek: [['🍼', 'Süt'], ['🥣', 'Yavru maması'], ['🐟', 'Minik balık'], ['🥛', 'Ilık süt']],
      oyun: { emoji: '🪶', ad: 'Tüy' },
      azalma: { aclik: 8, uyku: 6, temizlik: 4, eglence: 4, sevgi: 5 },
      ozel: { aclik: { ad: 'Süt', ikon: '🍼', eylemAd: 'Süt ver', eylemIkon: '🍼' }, temizlik: { ad: 'Sıcaklık', ikon: '🧶', eylemAd: 'Sar', eylemIkon: '🧶', anim: 'sar' } },
      soz: {
        selam: ['miu!', 'Cemre! Benim insanım', 'mırr… geldin'],
        besle: ['Süt! miu miu', 'Bebek mide, koca iştah', 'mırr… doydum mu? hayır'],
        yika: ['Battaniye = krallık', 'Sıcacık… mırr', 'Sardın, uyuyorum bak'],
        uyut: ['zzz… minik horlama', 'Kucakta uyumak en iyisi', 'miu… zzz'],
        uyan: ['Bugün 3 kere esnedim', 'miu! uyandım!'],
        oyna: ['Patim minik ama hızlı', 'Tüy! Yakaladım!', 'miu miu miu!'],
        sev: ['Bu okşama 10/10', 'mırr mırr mırr', 'Cemre benim insanım ♥'],
        doydu: ['Karnım top gibi', 'Doydum, miu'],
        ozledim: ['miu… neredeydin?', 'Battaniye soğudu…'],
        bos: ['miu?', 'Gözlerim mavi-gri, gördün mü?', 'BITCH!', 'Patim minik', 'Esnedim, rekor', 'mırr…', 'Misafirim ama ev benim']
      }
    },
    {
      id: 'barbie', ev: 'salon', rolIkon: '🐶',
      kisilik: 'Evin neşesi. Kapı açılınca ilk o koşar, dili hep dışarıda; en sevdiği yer Cemre’nin kucağı.',
      sever: [['🎾', 'Top getirmek'], ['🤲', 'Kucak'], ['🚶', 'Yürüyüş'], ['🍗', 'Ödül maması']],
      sevmez: ['Yalnız kalmak', 'Süpürge sesi'],
      yemek: [['🍗', 'Ödül maması'], ['🥩', 'Küçük et parçası'], ['🥕', 'Havuç çubuğu'], ['🧀', 'Minik peynir']],
      oyun: { emoji: '🎾', ad: 'Top at, getirsin' },
      azalma: { aclik: 5, uyku: 3, temizlik: 5, eglence: 6, sevgi: 6 },
      soz: {
        selam: ['Hav! Geldin mi?', 'Kuyruğum durmuyor!', 'Seni bekliyordum Cemre'],
        besle: ['Bu benim için mi?', 'Hav hav, teşekkürler!', 'Bir tane daha olur mu'],
        yika: ['Tüylerim köpük köpük', 'Silkeleneceğim, kaç!', 'Kokum mis oldu'],
        uyut: ['Kucakta uyurum ben', 'zzz… top… zzz', 'Rüyamda koştum'],
        uyan: ['Günaydın! Yürüyüşe?', 'Uyandım, hemen kalk'],
        oyna: ['At, at, at!', 'Topu getirdim!', 'Bir daha bir daha'],
        sev: ['Kuyruğum pervane oldu', 'Elini çekme, daha!', 'Cemre ♥'],
        doydu: ['Karnım güzelce doldu', 'Şimdi kestirme vakti'],
        ozledim: ['Kapıda bekledim…', 'Neredeydin, seni özledim', 'Top hep burada duruyor'],
        bos: ['Top atsana', 'Kucak boş mu?', 'Kapıyı dinliyorum', 'Bir yürüyüş iyi giderdi']
      }
    }
  ];
  const petTanim = (id) => PETLER.find(t => t.id === id) || null;
  const petAd = (id) => { const c = (CD.config.PETLER || {})[id]; const s = CD.petVeri ? CD.petVeri(id) : null; return (c && c.AD) || (s && s.name) || id; };
  const petRol = (id) => { const c = (CD.config.PETLER || {})[id]; return (c && c.ROL) || ''; };

  // İki pet karşılaşınca (ziyaret): [ziyaretçi, ev sahibi]
  const KARSILASMA = {
    'ayi|tavsan': [['Havuçlu kek?', 'Havuç benim!'], ['Bal ister misin?', 'Sadece havuç.']],
    'flork|hayalet': [['Buu de bana!', 'Buu.'], ['Sahneye ışık!', 'Işık yok, mum var']],
    'kedi|pittiksu': [['Minik kedi, uyu', 'miu!'], ['Sırıt bakayım', 'miu miu']],
    'top|tavsan': [['Yarışalım!', 'Hop hop, tamam'], ['Zıp!', 'Hop!']],
    'ayi|kedi': [['Kurabiye?', 'Yatarak yerim']],
    'flork|top': [['Alkışla beni!', 'Zıp zıp klap klap']],
    'hayalet|kedi': [['Sen de gece yaşarsın', 'mrrr, evet']],
    'ayi|pittiksu': [['Süt ısıttım', 'miu!']],
    'hayalet|pittiksu': [['Buu… şşt, bebek', 'miu?']],
    'flork|kedi': [['Dinle beni!', 'zzz…']],
    'bibble|flork': [['hmph.', 'Konuş benimle!']],
    'ayi|flork': [['Pasta yaptım', 'HAYATIMIN PASTASI']],
    'top|bibble': [['Koşalım!', 'Hayır.']],
    'tavsan|pittiksu': [['Havuç ister misin?', 'miu… süt?']]
  };
  const KARSILASMA_GENEL = [['♥', '♥'], ['Selam!', 'Selam!'], ['Nasılsın?', 'İyiyim, sen?'], ['Ev güzel değil mi?', 'Cemre yaptı ♥']];
  const EV_SOZLERI = ['Cemre ♥', 'ev tatlı ev', 'komşu kim?', 'hehe', 'burası rahat', '♥', 'zıp!', 'beni fırlat!', 'mırr'];

  const SEVIYELER = [
    { esik: 0, ad: 'Tanışıyoruz' }, { esik: 12, ad: 'Arkadaş' }, { esik: 35, ad: 'Yakın arkadaş' }, { esik: 80, ad: 'Can dostu' }, { esik: 160, ad: 'Aile' }
  ];
  const seviyeHesapla = (puan) => { let s = 0; SEVIYELER.forEach((l, i) => { if (puan >= l.esik) s = i; }); return s; };

  const ROZETLER = [
    { id: 'ilk', ad: 'İlk dokunuş', emoji: '🐾', sart: 'Bir pete ilk kez bak', kontrol: d => d.toplamBakim >= 1 },
    { id: 'asci', ad: 'Aşçı yardımcısı', emoji: '🍪', sart: 'Ponçik Ayı\'yı 5 kez besle', kontrol: d => bakimSayisi(d, 'ayi', 'besle') >= 5 },
    { id: 'mum', ad: 'Mum ışığı', emoji: '🕯️', sart: 'Hayalet için 3 kez mum yak', kontrol: d => bakimSayisi(d, 'hayalet', 'yika') >= 3 },
    { id: 'alkis', ad: 'Ayakta alkış', emoji: '👏', sart: 'Flork ile 5 kez oyna', kontrol: d => bakimSayisi(d, 'flork', 'oyna') >= 5 },
    { id: 'zip', ad: 'Zıp zıp', emoji: '⚽', sart: 'Pembe Top ile 10 kez oyna', kontrol: d => bakimSayisi(d, 'top', 'oyna') >= 10 },
    { id: 'havuc', ad: 'Havuç bahçesi', emoji: '🥕', sart: 'Tavşan\'a 10 havuç ver', kontrol: d => bakimSayisi(d, 'tavsan', 'besle') >= 10 },
    { id: 'kestirme', ad: 'Uyku perisi', emoji: '💤', sart: 'Toplam 10 kez uyut', kontrol: d => toplamEylem(d, 'uyut') >= 10 },
    { id: 'kopuk', ad: 'Köpük ustası', emoji: '🫧', sart: 'Toplam 10 kez yıka', kontrol: d => toplamEylem(d, 'yika') >= 10 },
    { id: 'gizli', ad: 'Gizli kalp', emoji: '💙', sart: 'Bibble ile "Yakın arkadaş" ol', kontrol: d => (d.petler.bibble || {}).seviye >= 2 },
    { id: 'kucak', ad: 'Minik misafir', emoji: '🍼', sart: 'Pıttıksu\'yu 5 kez sev', kontrol: d => bakimSayisi(d, 'pittiksu', 'sev') >= 5 },
    { id: 'mutluev', ad: 'Mutlu ev', emoji: '🏠', sart: 'Herkes aynı anda çok mutlu olsun', kontrol: d => PETLER.every(t => ruhHali(d.petler[t.id]).id === 'mutlu') },
    { id: 'candostu', ad: 'Can dostu', emoji: '💞', sart: 'Bir petle "Can dostu" ol', kontrol: d => PETLER.some(t => (d.petler[t.id] || {}).seviye >= 3) },
    { id: 'aile', ad: 'Koca aile', emoji: '👨‍👩‍👧', sart: 'Herkesle en az "Arkadaş" ol', kontrol: d => PETLER.every(t => (d.petler[t.id] || {}).seviye >= 1) },
    { id: 'yuz', ad: 'Yüz bakım', emoji: '🌟', sart: 'Toplam 100 bakım', kontrol: d => d.toplamBakim >= 100 }
  ];
  function bakimSayisi(d, petId, eylem) { const p = d.petler[petId]; return p && p.bakim ? (p.bakim[eylem] || 0) : 0; }
  function toplamEylem(d, eylem) { return PETLER.reduce((s, t) => s + bakimSayisi(d, t.id, eylem), 0); }

  /* ------------------------------------------------------------ durum */
  let ctx = null, kok = null, d = null;
  const ui = {}, odaEl = {}, motorlar = {}, petRef = {}, mesgul = {};
  const zamanlayicilar = new Set();
  let aralik = 0, io = null, secili = null, aktifOda = 0, sonSeciliOda = -1, seritRaf = 0, gorunurCb = null;

  const rs = (dizi) => CD.rastgele(dizi);
  const zt = (fn, ms) => { const t = setTimeout(() => { zamanlayicilar.delete(t); if (ctx) { try { fn(); } catch (e) { console.warn('[petevi]', e); } } }, ms); zamanlayicilar.add(t); return t; };
  const zi = (t) => { clearTimeout(t); zamanlayicilar.delete(t); };

  function petVarsayilan(t) {
    const r = () => 58 + Math.floor(Math.random() * 30);
    return { oda: t.ev, ihtiyac: { aclik: r(), uyku: r(), temizlik: r(), eglence: r(), sevgi: r() }, puan: 0, seviye: 0, bakim: {}, uyku: null };
  }
  function varsayilan() { return { surum: 1, sonGorulme: Date.now(), ziyaret: 0, toplamBakim: 0, rozetler: [], ipucuGoruldu: false, petler: {} }; }
  function yukle() {
    const v = Object.assign(varsayilan(), ctx.depo.al('durum', {}));
    if (!v.petler || typeof v.petler !== 'object') v.petler = {};
    if (!Array.isArray(v.rozetler)) v.rozetler = [];
    PETLER.forEach(t => {
      const p = Object.assign(petVarsayilan(t), v.petler[t.id] || {});
      if (!p.ihtiyac) p.ihtiyac = petVarsayilan(t).ihtiyac;
      IHTIYACLAR.forEach(n => { p.ihtiyac[n.id] = CD.sinirla(Number(p.ihtiyac[n.id]) || 0, 0, 100); });
      if (!ODALAR.some(o => o.id === p.oda)) p.oda = t.ev;
      if (!p.bakim || typeof p.bakim !== 'object') p.bakim = {};
      p.seviye = seviyeHesapla(p.puan || 0);
      v.petler[t.id] = p;
    });
    return v;
  }
  function kaydet() {
    if (!ctx || !d) return;
    d.sonGorulme = Date.now();
    ctx.depo.yaz('durum', d);
    ctx.depo.yaz('ipucu', ipucuMetni());
  }
  function ipucuMetni() {
    const ozleyen = PETLER.filter(t => ruhHali(d.petler[t.id]).id === 'ozledi');
    if (ozleyen.length) return petAd(ozleyen[0].id) + ' seni özledi 🥺';
    const mutlu = PETLER.filter(t => ruhHali(d.petler[t.id]).id === 'mutlu').length;
    if (mutlu === PETLER.length) return 'Herkes çok mutlu 🏠';
    if (mutlu) return mutlu + ' pet çok mutlu 🏠';
    return 'Ev seni bekliyor 🏠';
  }
  // Gerçek zaman: son görülmeden bu yana geçen saat kadar azalt (en fazla 48 saat; taban 5 — kimse sıfırlanmaz)
  function azalma(simdi) {
    const saat = Math.min(MAKS_SAAT, Math.max(0, (simdi - d.sonGorulme) / 3.6e6));
    d.sonGorulme = simdi;
    if (saat <= 0) return;
    const gece = CD.gece();
    PETLER.forEach(t => {
      const p = d.petler[t.id];
      IHTIYACLAR.forEach(n => {
        if (n.id === 'uyku' && p.uyku) return;
        if (t.id === 'hayalet' && n.id === 'temizlik' && gece) { p.ihtiyac[n.id] = Math.min(100, p.ihtiyac[n.id] + 6 * saat); return; }
        p.ihtiyac[n.id] = Math.max(5, p.ihtiyac[n.id] - (t.azalma[n.id] || 4) * saat);
      });
      if (p.uyku && simdi >= p.uyku.bitis) { p.ihtiyac.uyku = Math.min(100, p.ihtiyac.uyku + UYKU_KAZANC); p.uyku = null; }
    });
  }
  function ortalama(p) { return IHTIYACLAR.reduce((s, n) => s + p.ihtiyac[n.id], 0) / IHTIYACLAR.length; }
  function ruhHali(p) {
    const o = ortalama(p);
    if (o >= 75) return { id: 'mutlu', ad: 'Çok mutlu', emoji: '😄' };
    if (o >= 50) return { id: 'keyifli', ad: 'Keyifli', emoji: '🙂' };
    if (o >= 28) return { id: 'durgun', ad: 'Biraz durgun', emoji: '😶' };
    return { id: 'ozledi', ad: 'Seni özledi', emoji: '🥺' };
  }
  const enDusuk = (p) => IHTIYACLAR.reduce((a, n) => p.ihtiyac[n.id] < p.ihtiyac[a.id] ? n : a, IHTIYACLAR[0]);

  /* ------------------------------------------------------------ yardımcılar: konum, efekt */
  const spriteOlcek = () => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sprite-olcek')); return isNaN(v) ? 3 : v; };
  const zeminYuk = (oda) => { const z = oda.querySelector('.petevi-zemin'); return z ? z.offsetHeight : 44; };
  function petClient(pet, odaId) {
    const m = motorlar[odaId]; if (!m) return { x: innerWidth / 2, y: innerHeight / 2 };
    const r = m.katman.getBoundingClientRect();
    return { x: r.left + pet.x + pet.w / 2, y: r.top + pet.y + pet.h * 0.45 };
  }
  function efektKati(odaId) { return odaEl[odaId] ? odaEl[odaId].querySelector('.petevi-efekt') : null; }
  function emojiKoy(odaId, emoji, x, y, sinif) {
    const kat = efektKati(odaId); if (!kat) return null;
    const e = ctx.el('span.petevi-emoji' + (sinif ? '.' + sinif : ''), { 'aria-hidden': 'true' }, emoji);
    e.style.left = x + 'px'; e.style.top = y + 'px';
    kat.appendChild(e); return e;
  }
  function yukselEmoji(odaId, pet, emoji, n) {
    for (let i = 0; i < (n || 1); i++) zt(() => {
      const e = emojiKoy(odaId, emoji, pet.x + pet.w / 2 + (Math.random() * 30 - 15), pet.y - 6, 'petevi-yuksel');
      if (e) zt(() => e.remove(), 1200);
    }, i * 140);
  }
  function petSoyle(pet, t, tip, ms) { const l = t.soz[tip] || t.soz.bos; pet.soyle(rs(l), ms || 1800); }

  /* ------------------------------------------------------------ pet kurulumu */
  function petOlustur(t, odaId, x, yerde) {
    const sprite = CD.petVeri(t.id); const m = motorlar[odaId]; if (!sprite || !m) return null;
    const oda = odaEl[odaId];
    const sec = { x, ad: petAd(t.id) };
    if (yerde) sec.y = m.katman.clientHeight - zeminYuk(oda) - sprite.frames[0].length * spriteOlcek();
    const pet = m.ekle(sprite, sec); if (!pet) return null;
    pet.el.dataset.ad = petAd(t.id);
    pet.el.setAttribute('aria-label', petAd(t.id));
    pet.el.appendChild(ctx.el('i.petevi-halka', { 'aria-hidden': 'true' }));
    // balon yazısı yön değiştirince aynalanmasın: yönü CSS değişkenine yaz
    const orjCiz = pet.ciz.bind(pet);
    pet.ciz = function (force) { orjCiz(force); if (this._yon !== this.dir) { this._yon = this.dir; this.el.style.setProperty('--petevi-yon', this.dir); } };
    // balon oda kenarından taşmasın: kenara yakınsa balonu içeri kaydır (ok petin üstünde kalır)
    const orjSoyle = pet.soyle.bind(pet);
    pet.soyle = function (text, ms) {
      orjSoyle(text, ms);
      const b = this.el.querySelector('.pet-balon'); if (!b) return;
      const W = m.katman.clientWidth || 320;
      const cx = this.x + this.w / 2, yarim = b.offsetWidth / 2 + 6;
      let kay = 0;
      if (cx - yarim < 0) kay = yarim - cx; else if (cx + yarim > W) kay = W - (cx + yarim);
      this.el.style.setProperty('--petevi-balon-kay', Math.round(kay) + 'px');
    };
    pet.ciz(true);
    if (secili === t.id) pet.el.classList.add('petevi-secili');
    petRef[t.id] = pet;
    const p = d.petler[t.id];
    if (p.uyku && Date.now() < p.uyku.bitis) uykuBaslat(t, pet, p.uyku.bitis - Date.now());
    return pet;
  }
  function motorKur(o) {
    const oda = odaEl[o.id]; const katman = oda.querySelector('.petevi-katman');
    motorlar[o.id] = CD.PetMotor({
      katman, sabit: false, sozler: EV_SOZLERI, tunekSecici: '.petevi-tunek',
      zemin: () => katman.clientHeight - zeminYuk(oda),
      dokununca(pet, cift) {
        const t = petTanim(pet.id); if (!t) return;
        sec(pet.id, false);
        const p = d.petler[pet.id];
        if (Math.random() < 0.6 || !['flork', 'kedi', 'bibble', 'pittiksu'].includes(pet.id)) {
          if (ruhHali(p).id === 'ozledi' && Math.random() < 0.5) petSoyle(pet, t, 'ozledim'); else petSoyle(pet, t, Math.random() < 0.5 ? 'selam' : 'bos');
        }
        if (cift) { ctx.ses.hop(); }
        p.ihtiyac.sevgi = Math.min(100, p.ihtiyac.sevgi + 1);
        if (secili === pet.id) barlariGuncelle();
      },
      tutunca(pet) { ctx.ses.hop(); },
      birakinca(pet, hiz) { if (hiz > 900) { const t = petTanim(pet.id); const p = d.petler[pet.id]; if (t && p) { p.ihtiyac.eglence = Math.min(100, p.ihtiyac.eglence + 2); if (secili === pet.id) barlariGuncelle(); } } },
      bulusunca(a, b) {
        const k = KARSILASMA[a.id + '|' + b.id]; const k2 = KARSILASMA[b.id + '|' + a.id];
        let satir = k ? rs(k) : k2 ? rs(k2).slice().reverse() : rs(KARSILASMA_GENEL);
        a.soyle(satir[0], 1700); zt(() => { if (petRef[b.id] === b) b.soyle(satir[1], 1700); }, 750);
        ctx.ses.tink();
        [a.id, b.id].forEach(id => { const p = d.petler[id]; if (p) p.ihtiyac.eglence = Math.min(100, p.ihtiyac.eglence + 2); });
        if (secili === a.id || secili === b.id) barlariGuncelle();
      }
    });
  }
  function petleriYerlestir() {
    ODALAR.forEach(o => {
      const sakinler = PETLER.filter(t => d.petler[t.id].oda === o.id);
      const W = motorlar[o.id].katman.clientWidth || 320;
      sakinler.forEach((t, i) => {
        const pay = sakinler.length > 1 ? i / (sakinler.length - 1) : 0.5;
        const x = W * (0.18 + 0.64 * pay) - 36;
        zt(() => petOlustur(t, o.id, Math.max(4, x), false), 120 * i);
      });
    });
  }

  /* ------------------------------------------------------------ seçim, kart, altbar */
  function sec(id, kaydir) {
    const eskiPet = secili ? petRef[secili] : null;
    if (eskiPet) eskiPet.el.classList.remove('petevi-secili');
    secili = id;
    const pet = petRef[id]; if (pet) pet.el.classList.add('petevi-secili');
    if (kaydir !== false) odayaGit(d.petler[id].oda, true);
    kartKur(); altbarKur(); rosterGuncelle();
  }
  function altbarKur() {
    const t = secili ? petTanim(secili) : null;
    const uyuyor = !!(t && petRef[t.id] && petRef[t.id].uyuyor);
    ui.altbarUyku = uyuyor;
    ctx.altbar(IHTIYACLAR.map(n => {
      const o = (t && t.ozel && t.ozel[n.id]) || {};
      if (n.id === 'uyku' && uyuyor) return { id: n.eylem, ad: 'Uyandır', ikon: '☀️', tikla() { eylem(n.eylem); } };
      return { id: n.eylem, ad: o.eylemAd || n.eylemAd, ikon: o.eylemIkon || n.eylemIkon, birincil: n.eylem === 'sev', tikla() { eylem(n.eylem); } };
    }));
  }
  function ihtiyacGorunum(t, n) { const o = (t.ozel && t.ozel[n.id]) || {}; return { ad: o.ad || n.ad, ikon: o.ikon || n.ikon, renk: n.renk }; }

  function kartKur() {
    const kart = ui.kart; kart.innerHTML = ''; ui.barlar = {};
    if (!secili) { kart.hidden = true; ui.kartBos.hidden = false; return; }
    const t = petTanim(secili); const p = d.petler[secili]; const sprite = CD.petVeri(t.id);
    kart.hidden = false; ui.kartBos.hidden = true;
    const ikon = ctx.el('div.petevi-kart-ikon', { 'aria-hidden': 'true' }); if (sprite) ikon.appendChild(CD.spriteElemani(sprite, 0, 3));
    ui.ruh = ctx.el('span.rozet.petevi-ruh');
    ui.odaEtiket = ctx.el('span.rozet.gri.petevi-oda-rozet');
    kart.append(
      ctx.el('div.petevi-kart-ust', [
        ikon,
        ctx.el('div.petevi-kart-baslik', [
          ctx.el('div.baslik.baslik-lg', petAd(t.id)),
          ctx.el('div.satir.sar.petevi-etiketler', [ctx.el('span.rozet', t.rolIkon + ' ' + (petRol(t.id) || 'ev halkı')), ui.ruh, ui.odaEtiket]),
          ctx.el('p.sessiz.petevi-kisilik', t.kisilik)
        ])
      ]),
      ctx.el('div.dikey.petevi-barlar', IHTIYACLAR.map(n => {
        const g = ihtiyacGorunum(t, n);
        const dolu = ctx.el('div.bar-dolu'); const yuzde = ctx.el('span.bar-yuzde');
        ui.barlar[n.id] = { dolu, yuzde };
        return ctx.el('div.bar', { title: g.ad, stil: { '--bar-renk': g.renk } }, [ctx.el('span.bar-ikon', { 'aria-label': g.ad }, g.ikon), ctx.el('div.bar-yol', [dolu]), yuzde]);
      })),
      (ui.istek = ctx.el('p.sessiz.petevi-istek', { 'aria-live': 'polite' }))
    );
    ui.kalpler = ctx.el('span.petevi-kalpler', { 'aria-hidden': 'true' });
    ui.seviyeAd = ctx.el('span.kalin');
    ui.seviyeSayi = ctx.el('span.sessiz');
    ui.seviyeDolu = ctx.el('div.bar-dolu');
    kart.append(
      ctx.el('div.petevi-seviye', [
        ctx.el('div.satir.arasi', [ctx.el('div.satir', [ui.kalpler, ui.seviyeAd]), ui.seviyeSayi]),
        ctx.el('div.bar.petevi-seviye-bar', { stil: { '--bar-renk': 'var(--seker-kiraz)' } }, [ctx.el('span.bar-ikon', '🤝'), ctx.el('div.bar-yol', [ui.seviyeDolu]), ctx.el('span.bar-yuzde', '')])
      ]),
      ctx.el('div.satir.sar.petevi-kart-dugmeler', [
        (ui.cagir = ctx.el('button.dugme.kucuk.petevi-cagir', { type: 'button', hidden: true, onclick: () => cagir(t) }, '📍 Bu odaya çağır')),
        ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => sevdikleriSheet(t) }, '💗 Sevdiği şeyler'),
        ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => rozetSheet() }, '🏅 Rozetler')
      ])
    );
    barlariGuncelle();
  }
  function barlariGuncelle() {
    if (!secili || !ui.barlar) return;
    const p = d.petler[secili]; const t = petTanim(secili);
    IHTIYACLAR.forEach(n => { const b = ui.barlar[n.id]; if (!b) return; const v = Math.round(p.ihtiyac[n.id]); b.dolu.style.width = v + '%'; b.yuzde.textContent = v + '%'; });
    const r = ruhHali(p);
    if (ui.ruh) { ui.ruh.textContent = r.emoji + ' ' + r.ad; ui.ruh.className = 'rozet petevi-ruh petevi-ruh-' + r.id; }
    if (ui.odaEtiket) ui.odaEtiket.textContent = odaTanim(p.oda).ikon + ' ' + odaTanim(p.oda).ad;
    if (ui.istek) {
      const dus = enDusuk(p); const g = ihtiyacGorunum(t, dus); const o = (t.ozel && t.ozel[dus.id]) || {};
      ui.istek.textContent = p.ihtiyac[dus.id] >= 70 ? 'Keyfi yerinde; bir sevgi yeter ♥' : 'Şu an en çok bunu istiyor: ' + g.ikon + ' ' + (o.eylemAd || dus.eylemAd);
    }
    cagirGuncelle();
    const s = p.seviye; const sonraki = SEVIYELER[s + 1];
    if (ui.kalpler) ui.kalpler.textContent = '♥'.repeat(s + 1) + '♡'.repeat(Math.max(0, SEVIYELER.length - 1 - s));
    if (ui.seviyeAd) ui.seviyeAd.textContent = SEVIYELER[s].ad;
    if (ui.seviyeSayi) ui.seviyeSayi.textContent = sonraki ? p.puan + ' / ' + sonraki.esik : p.puan + ' kalp puanı';
    if (ui.seviyeDolu) { const bas = SEVIYELER[s].esik; ui.seviyeDolu.style.width = (sonraki ? Math.round(100 * (p.puan - bas) / (sonraki.esik - bas)) : 100) + '%'; }
    // pet kendi kendine uyuduysa/uyandıysa alt çubuktaki "Uyut / Uyandır" etiketi de değişsin
    const pet = petRef[t.id]; const uyuyor = !!(pet && pet.uyuyor);
    if (ui.altbarUyku !== uyuyor) altbarKur();
  }
  function rosterGuncelle() {
    if (!ui.roster) return;
    PETLER.forEach(t => {
      const b = ui.roster.querySelector('[data-pet="' + t.id + '"]'); if (!b) return;
      const r = ruhHali(d.petler[t.id]);
      b.setAttribute('aria-pressed', String(secili === t.id));
      const nokta = b.querySelector('.petevi-ruh-nokta'); if (nokta) { nokta.className = 'petevi-ruh-nokta petevi-ruh-' + r.id; nokta.title = r.ad; }
    });
    ozetGuncelle();
  }
  function ozetGuncelle() {
    if (!ui.ozet) return;
    const mutlu = PETLER.filter(t => ruhHali(d.petler[t.id]).id === 'mutlu').length;
    const ozleyen = PETLER.filter(t => ruhHali(d.petler[t.id]).id === 'ozledi');
    let m = 'Evde ' + PETLER.length + ' pet yaşıyor';
    if (mutlu) m += ' · ' + mutlu + '\'i çok mutlu';
    if (ozleyen.length) m += ' · ' + ozleyen.map(t => petAd(t.id)).join(', ') + ' seni özledi';
    ui.ozet.textContent = m + '.';
    if (ui.rozetSayi) ui.rozetSayi.textContent = d.rozetler.length + ' / ' + ROZETLER.length + ' rozet';
  }

  /* ------------------------------------------------------------ odalar arası kaydırma */
  function odayaGit(odaId, yumusak) {
    const i = odaIndeks(odaId); const serit = ui.serit; if (!serit) return;
    const oda = odaEl[odaId]; if (!oda) return;
    const hedef = oda.offsetLeft;
    const gorunur = hedef >= serit.scrollLeft - 4 && hedef + oda.clientWidth <= serit.scrollLeft + serit.clientWidth + 4;
    if (gorunur) return;
    try { serit.scrollTo({ left: hedef, behavior: (yumusak && !ctx.azHareket) ? 'smooth' : 'auto' }); } catch (e) { serit.scrollLeft = hedef; }
    aktifOda = i; ciplerGuncelle();
  }
  function seritKaydi() {
    if (seritRaf) return;
    seritRaf = requestAnimationFrame(() => {
      seritRaf = 0; const serit = ui.serit; if (!serit) return;
      const w = odaEl.salon ? odaEl.salon.clientWidth : serit.clientWidth; if (!w) return;
      aktifOda = CD.sinirla(Math.round(serit.scrollLeft / w), 0, ODALAR.length - 1);
      ciplerGuncelle();
    });
  }
  function ciplerGuncelle() {
    if (!ui.cipler) return;
    [...ui.cipler.children].forEach((c, i) => c.setAttribute('aria-selected', String(i === aktifOda)));
    if (ui.odaTanim) ui.odaTanim.textContent = ODALAR[aktifOda].tanim;
    cagirGuncelle();
  }
  // "Bu odaya çağır": seçili pet başka odadaysa görünür; Pıttıksu kucakta taşınır
  function cagirGuncelle() {
    if (!ui.cagir || !secili || !d) return;
    const p = d.petler[secili]; const farkli = p.oda !== ODALAR[aktifOda].id;
    ui.cagir.hidden = !farkli;
    if (farkli) ui.cagir.textContent = secili === 'pittiksu' ? '🤲 Kucağına al' : '📍 Bu odaya çağır';
  }
  function cagir(t) {
    const pet = petRef[t.id]; const p = d.petler[t.id]; if (!pet || !p) return;
    const hedef = ODALAR[aktifOda].id;
    if (hedef === p.oda) { odayaGit(p.oda, true); return; }
    if (mesgul[t.id] && !pet.uyuyor) { pet.soyle('bir saniye…', 900); return; }
    if (pet.uyuyor) uyandir(t, pet, true);
    if (pet.held) return;
    const yon = odaIndeks(hedef) > odaIndeks(p.oda) ? 1 : -1;
    ctx.ses.hop();
    pet.kilit(true); mesgul[t.id] = true;
    pet.soyle(t.id === 'pittiksu' ? 'miu! kucak!' : rs(['geliyorum!', 'hoop, geldim', 'çağırdın mı?', 'yoldayım ♥']), 1200);
    pet.dir = yon; pet.ciz(true); pet.mutlu(600);
    zt(() => {
      mesgul[t.id] = false;
      if (petRef[t.id] !== pet) return;
      pet.kilit(false);
      tasi(t, hedef, yon);
      const yeni = petRef[t.id];
      if (yeni) { const c = petClient(yeni, hedef); ctx.efekt.toz(c.x, c.y + 24, 4); ctx.efekt.kalp(c.x, c.y, 3); yeni.mutlu(1000); ctx.ses.tink(); }
      p.ihtiyac.sevgi = Math.min(100, p.ihtiyac.sevgi + 3);
      barlariGuncelle(); rosterGuncelle(); kaydet();
      ctx.toast(petAd(t.id) + ' ' + odaTanim(hedef).e + (t.id === 'pittiksu' ? ' kucakta geldi 🍼' : ' geldi 🐾'), 2200);
    }, ctx.azHareket ? 120 : 700);
  }
  function gorunurPetler(odaId) { return PETLER.filter(t => d.petler[t.id].oda === odaId && petRef[t.id]); }

  /* ------------------------------------------------------------ eylemler */
  function eylem(tip) {
    if (!secili) {
      const adaylar = gorunurPetler(ODALAR[aktifOda].id);
      const t0 = adaylar.length ? adaylar[0] : PETLER[0];
      sec(t0.id, true); ctx.toast(petAd(t0.id) + ' seçildi; bir daha dokun 🐾');
      return;
    }
    const t = petTanim(secili); const pet = petRef[secili]; const p = d.petler[secili];
    if (!t || !pet) return;
    odayaGit(p.oda, false);
    if (pet.uyuyor) {
      if (tip === 'uyut') { uyandir(t, pet, true); return; }   // "Uyandır"
      if (tip === 'sev') { uykudaSev(t, pet); return; }         // uyurken sevmek uyandırmaz
      uyandir(t, pet, true);                                    // diğer bakımlar: nazikçe uyandır, devam et
    }
    if (mesgul[t.id]) { pet.soyle('bir saniye…', 900); return; }
    const n = eylemIhtiyac(tip);
    if (tip !== 'sev' && tip !== 'uyut' && p.ihtiyac[n.id] >= 96) { petSoyle(pet, t, 'doydu'); ctx.ses.blop(); pet.mutlu(600); return; }
    switch (tip) {
      case 'besle': besleSheet(t, pet); break;
      case 'yika': yika(t, pet); break;
      case 'uyut': uyut(t, pet); break;
      case 'oyna': oyna(t, pet); break;
      case 'sev': sev(t, pet); break;
    }
  }
  function bakimTamam(t, tip, miktar, puan) {
    const p = d.petler[t.id]; const n = eylemIhtiyac(tip);
    p.ihtiyac[n.id] = Math.min(100, p.ihtiyac[n.id] + miktar);
    p.bakim[tip] = (p.bakim[tip] || 0) + 1;
    d.toplamBakim++;
    puanEkle(t, puan);
    barlariGuncelle(); rosterGuncelle(); kaydet(); rozetKontrol();
  }
  function puanEkle(t, n) {
    const p = d.petler[t.id]; p.puan += n;
    const yeni = seviyeHesapla(p.puan);
    if (yeni > p.seviye) {
      p.seviye = yeni;
      const pet = petRef[t.id];
      zt(() => {
        ctx.ses.zafer();
        if (pet) { const c = petClient(pet, p.oda); ctx.efekt.konfeti(c.x, c.y, 16); pet.mutlu(1500); pet.soyle(yeni >= 4 ? 'Ailemsin ♥' : yeni === 3 ? 'Can dostum!' : 'Arkadaşız ♥', 2200); }
        ctx.toast(petAd(t.id) + ' ile artık "' + SEVIYELER[yeni].ad + '" ♥', 3000);
      }, 700);
    }
  }
  function rozetKontrol() {
    ROZETLER.forEach(r => {
      if (d.rozetler.includes(r.id)) return;
      let ok = false; try { ok = r.kontrol(d); } catch (e) {}
      if (!ok) return;
      d.rozetler.push(r.id); kaydet();
      zt(() => { ctx.ses.isilti(); ctx.efekt.konfeti(); ctx.toast(r.emoji + ' Rozet: ' + r.ad, 3200); ozetGuncelle(); }, 1200);
    });
  }

  // --- besle: alt sayfadan yiyecek seç → uçar → 3 ısırık → yut
  function besleSheet(t, pet) {
    const kutu = ctx.el('div.dikey', [
      ctx.el('p.sessiz', petAd(t.id) + ' bugün ne yesin? Sevdiklerini sıraladım.'),
      ctx.el('div.izgara-2.petevi-yemekler', t.yemek.map(y => ctx.el('button.dugme-ikincil.petevi-yemek', { type: 'button', onclick: () => { ctx.sheetKapat(); zt(() => besle(t, y), 120); } }, [ctx.el('span.petevi-yemek-emoji', { 'aria-hidden': 'true' }, y[0]), ctx.el('span', y[1])])))
    ]);
    ctx.sheet(kutu, { baslik: (t.ozel && t.ozel.aclik ? t.ozel.aclik.eylemAd : 'Besle') + ' · ' + petAd(t.id) });
  }
  function besle(t, yemek) {
    const pet = petRef[t.id]; const p = d.petler[t.id]; if (!pet || mesgul[t.id]) return;
    const oda = p.oda; const kat = efektKati(oda); if (!kat) return;
    mesgul[t.id] = true; pet.kilit(true); pet.dir = pet.x < kat.clientWidth / 2 ? 1 : -1; pet.ciz(true);
    const hedefX = () => pet.x + pet.w / 2 + pet.dir * pet.w * 0.28, hedefY = () => pet.y + pet.h * 0.58;
    const e = emojiKoy(oda, yemek[0], kat.clientWidth / 2, kat.clientHeight + 20, 'petevi-yemek-ucan');
    const bitir = () => { if (e) e.remove(); pet.kilit(false); mesgul[t.id] = false; };
    if (!e) { bitir(); return; }
    ctx.ses.pop();
    requestAnimationFrame(() => { e.style.left = hedefX() + 'px'; e.style.top = hedefY() + 'px'; });
    const isirik = (k) => {
      ctx.ses.cigne(); pet.ez(1.12, 0.9);
      e.style.transform = 'translate(-50%,-50%) scale(' + (1 - k * 0.3) + ')';
      e.style.left = hedefX() + 'px'; e.style.top = hedefY() + 'px';
    };
    zt(() => isirik(1), ctx.azHareket ? 100 : 560);
    zt(() => isirik(2), ctx.azHareket ? 400 : 960);
    zt(() => isirik(3), ctx.azHareket ? 700 : 1360);
    zt(() => {
      ctx.ses.yut(); e.remove();
      pet.mutlu(1200); petSoyle(pet, t, 'besle', 2000);
      const c = petClient(pet, oda); ctx.efekt.emoji(c.x, c.y - 10, yemek[0], 2); ctx.efekt.kalp(c.x, c.y, 3);
      const favori = t.yemek[0][1] === yemek[1];
      bakimTamam(t, 'besle', favori ? 30 : 24, favori ? 3 : 2);
      bitir();
    }, ctx.azHareket ? 1000 : 1800);
  }
  // --- yıka / mum yak / sar
  function yika(t, pet) {
    const p = d.petler[t.id]; const oda = p.oda; const kat = efektKati(oda); if (!kat) return;
    const anim = t.ozel && t.ozel.temizlik && t.ozel.temizlik.anim;
    mesgul[t.id] = true; pet.kilit(true);
    const bitir = (miktar) => { pet.kilit(false); mesgul[t.id] = false; pet.mutlu(1000); petSoyle(pet, t, 'yika', 2000); bakimTamam(t, 'yika', miktar, 2); };
    const c = petClient(pet, oda);
    if (anim === 'mum') {
      const e = emojiKoy(oda, '🕯️', pet.x + pet.w + 8, pet.y + pet.h - 24, 'petevi-mum');
      odaEl[oda].classList.add('petevi-los'); ctx.ses.tink();
      zt(() => ctx.efekt.yildiz(c.x + 24, c.y, 4), 300);
      zt(() => bitir(32), 1100);
      zt(() => { if (e) e.remove(); odaEl[oda].classList.remove('petevi-los'); }, 7000);
      return;
    }
    if (anim === 'sar') {
      const e = emojiKoy(oda, '🧶', pet.x + pet.w / 2, pet.y + pet.h * 0.7, 'petevi-sargi');
      ctx.ses.tink(); zt(() => ctx.ses.mirrKisa(1400), 400);
      zt(() => ctx.efekt.kalp(c.x, c.y, 4), 500);
      zt(() => { if (e) e.remove(); bitir(30); }, 1500);
      return;
    }
    const s = emojiKoy(oda, '🧽', pet.x + pet.w / 2, pet.y + pet.h * 0.4, 'petevi-sunger');
    ctx.ses.su();
    if (t.id === 'kedi') zt(() => pet.soyle('hmph, ıslandım', 900), 200);
    [0, 450, 900].forEach((ms, i) => zt(() => { ctx.ses.kopuk(); ctx.efekt.kopuk(c.x + (i - 1) * 12, c.y, 4); pet.ez(i % 2 ? 1.08 : 0.94, i % 2 ? 0.94 : 1.06); }, ms + 100));
    zt(() => { if (s) s.remove(); ctx.ses.tink(); ctx.efekt.yildiz(c.x, c.y - 10, 5); bitir(t.id === 'kedi' ? 22 : 30); }, ctx.azHareket ? 800 : 1500);
  }
  // --- uyut: ışık kısılır, uyku barı 18 sn boyunca dolar; dokununca uyanır (ceza yok)
  function uyut(t, pet) {
    const p = d.petler[t.id];
    if (p.ihtiyac.uyku >= 96 && !pet.uyuyor) { pet.soyle(t.id === 'kedi' ? 'yine de uyurum…' : 'Hiç uykum yok!', 1400); if (t.id !== 'kedi') { ctx.ses.blop(); return; } }
    p.uyku = { bitis: Date.now() + UYKU_SURE };
    p.bakim.uyut = (p.bakim.uyut || 0) + 1; d.toplamBakim++; puanEkle(t, 2);
    petSoyle(pet, t, 'uyut', 1600); ctx.ses.blop();
    uykuBaslat(t, pet, UYKU_SURE);
    kaydet(); rozetKontrol();
  }
  function uykuBaslat(t, pet, sure) {
    const p = d.petler[t.id]; const oda = p.oda;
    pet.kilit(true); pet.uyu(); mesgul[t.id] = true;
    odaEl[oda].classList.add('petevi-uyku');
    if (secili === t.id) altbarKur();
    const bitis = Date.now() + sure; const adim = (UYKU_KAZANC / (UYKU_SURE / 1000));
    const tik = () => {
      const canli = petRef[t.id] === pet;
      if (!canli) { mesgul[t.id] = false; return; }
      if (!pet.uyuyor || Date.now() >= bitis) { uyandir(t, pet, !pet.uyuyor); return; }
      p.ihtiyac.uyku = Math.min(100, p.ihtiyac.uyku + adim);
      if (secili === t.id) barlariGuncelle();
      pet._uykuT = zt(tik, 1000);
    };
    pet._uykuT = zt(tik, 1000);
  }
  function uyandir(t, pet, erken) {
    const p = d.petler[t.id];
    if (pet._uykuT) { zi(pet._uykuT); pet._uykuT = 0; }
    if (p.uyku) { if (!erken) p.ihtiyac.uyku = Math.min(100, p.ihtiyac.uyku + 6); p.uyku = null; }
    pet.uyan(); pet.kilit(false); mesgul[t.id] = false;
    if (!PETLER.some(x => x.id !== t.id && d.petler[x.id].oda === p.oda && petRef[x.id] && petRef[x.id].uyuyor)) odaEl[p.oda].classList.remove('petevi-uyku');
    petSoyle(pet, t, 'uyan', 1800); ctx.ses.hop(); pet.zipla(380);
    if (secili === t.id) altbarKur();
    barlariGuncelle(); rosterGuncelle(); kaydet();
  }
  // --- oyna: petin kendi oyuncağı zıplar, pet 3 kez zıplar
  function oyna(t, pet) {
    const p = d.petler[t.id]; const oda = p.oda; const kat = efektKati(oda); if (!kat) return;
    mesgul[t.id] = true; pet.kilit(false);
    const e = emojiKoy(oda, t.oyun.emoji, pet.x + pet.w / 2 + (pet.dir > 0 ? 30 : -30), pet.y - 20, 'petevi-oyuncak');
    const c = petClient(pet, oda);
    const sayi = t.id === 'top' ? 4 : 3;
    for (let i = 0; i < sayi; i++) zt(() => {
      if (petRef[t.id] !== pet) return;
      pet.zipla(t.id === 'top' ? 640 : 460); ctx.ses.hop();
      if (t.id === 'flork') ctx.efekt.emoji(c.x, c.y - 20, '👏', 2);
      if (t.id === 'tavsan') ctx.efekt.emoji(c.x + 20, c.y, '💧', 2);
      if (t.id === 'pittiksu' && i === 1) ctx.ses.minikMiyav();
    }, 150 + i * (ctx.azHareket ? 300 : 520));
    zt(() => {
      if (e) e.remove();
      mesgul[t.id] = false;
      if (petRef[t.id] !== pet) return;
      pet.mutlu(1200); petSoyle(pet, t, 'oyna', 2000); ctx.efekt.yildiz(c.x, c.y - 10, 5); ctx.ses.parilti();
      bakimTamam(t, 'oyna', 26, 3);
    }, 300 + sayi * (ctx.azHareket ? 300 : 520));
  }
  // --- uyurken sev: uyandırmadan, sessizce (kalpler + uykuda gülümseme)
  function uykudaSev(t, pet) {
    const p = d.petler[t.id]; const c = petClient(pet, p.oda);
    ctx.ses.pit(); ctx.efekt.kalp(c.x, c.y, 4);
    if (t.id === 'kedi' || t.id === 'pittiksu') ctx.ses.mirrKisa(1000); else ctx.ses.tink();
    pet.soyle(rs(['zzz… ♥', '(uykuda gülümsedi)', 'mmm… Cemre…', 'zzz… sen misin?']), 1600);
    p.ihtiyac.sevgi = Math.min(100, p.ihtiyac.sevgi + 8);
    p.bakim.sev = (p.bakim.sev || 0) + 1; d.toplamBakim++;
    puanEkle(t, 1);
    barlariGuncelle(); rosterGuncelle(); kaydet(); rozetKontrol();
  }
  // --- sev: kalpler; kediler mırlar; Bibble "hmph" der ama gizlice sevinir
  function sev(t, pet) {
    const p = d.petler[t.id]; const c = petClient(pet, p.oda);
    ctx.ses.pit();
    if (t.id === 'bibble') {
      pet.soyle('hmph.', 900); ctx.ses.hmpf();
      zt(() => { if (petRef[t.id] === pet) { ctx.efekt.kalp(c.x, c.y, 5); pet.mutlu(1000); pet.soyle('…(gizlice sevindi)', 1600); ctx.ses.tink(); } }, 900);
    } else {
      ctx.efekt.kalp(c.x, c.y, 8); pet.mutlu(1300); petSoyle(pet, t, 'sev', 2000);
      if (t.id === 'kedi' || t.id === 'pittiksu') ctx.ses.mirrKisa(1300); else ctx.ses.tink();
    }
    bakimTamam(t, 'sev', 18, t.id === 'bibble' ? 2 : 3);
  }

  /* ------------------------------------------------------------ alt sayfalar */
  function sevdikleriSheet(t) {
    const p = d.petler[t.id];
    const kutu = ctx.el('div.dikey.petevi-sheet', [
      ctx.el('div.satir', [ctx.el('span.rozet', t.rolIkon + ' ' + (petRol(t.id) || 'ev halkı')), ctx.el('span.rozet.gri', 'Evi: ' + odaTanim(t.ev).ad)]),
      ctx.el('p', t.kisilik),
      ctx.el('div.baslik.baslik-lg', 'Sevdiği şeyler'),
      ctx.el('ul.petevi-liste', t.sever.map(s => ctx.el('li', [ctx.el('span.petevi-liste-emoji', { 'aria-hidden': 'true' }, s[0]), s[1]]))),
      ctx.el('div.baslik.baslik-lg', 'Pek sevmediği'),
      ctx.el('ul.petevi-liste.petevi-liste-sevmez', t.sevmez.map(s => ctx.el('li', [ctx.el('span.petevi-liste-emoji', { 'aria-hidden': 'true' }, '✕'), s]))),
      ctx.el('div.baslik.baslik-lg', 'Arkadaşlığımız'),
      ctx.el('p.sessiz', SEVIYELER.map((l, i) => (i <= p.seviye ? '♥ ' : '♡ ') + l.ad).join(' · ')),
      ctx.el('p.sessiz', 'Bakım sayısı: ' + Object.keys(p.bakim).reduce((s, k) => s + p.bakim[k], 0) + ' · Kalp puanı: ' + p.puan)
    ]);
    ctx.sheet(kutu, { baslik: petAd(t.id) });
  }
  function rozetSheet() {
    const kutu = ctx.el('div.dikey.petevi-sheet', [
      ctx.el('p.sessiz', d.rozetler.length ? d.rozetler.length + ' rozet kazandın; ' + (ROZETLER.length - d.rozetler.length) + ' tane daha var.' : 'Henüz rozet yok. Petlere baktıkça gelirler.'),
      ctx.el('div.petevi-rozetler', ROZETLER.map(r => {
        const var_ = d.rozetler.includes(r.id);
        return ctx.el('div.petevi-rozet' + (var_ ? '.acik' : ''), [ctx.el('span.petevi-rozet-emoji', { 'aria-hidden': 'true' }, r.emoji), ctx.el('div', [ctx.el('div.kalin', r.ad), ctx.el('div.sessiz', r.sart)]), ctx.el('span.rozet' + (var_ ? '.inci' : '.kapali'), var_ ? 'kazanıldı' : 'kilitli')]);
      }))
    ]);
    ctx.sheet(kutu, { baslik: 'Ev rozetleri' });
  }

  /* ------------------------------------------------------------ kendi hayatları: gezme, olaylar */
  let gezT = 0, olayT = 0;
  function gezPlanla() { gezT = zt(() => { try { gez(); } catch (e) {} gezPlanla(); }, GEZ_MIN + Math.random() * (GEZ_MAX - GEZ_MIN)); }
  function gez() {
    if (ctx.azHareket || document.hidden || document.body.classList.contains('sheet-acik')) return;
    const adaylar = PETLER.filter(t => { const pet = petRef[t.id]; return t.gezer !== false && pet && !mesgul[t.id] && !pet.held && !pet.uyuyor && pet.onFloor && pet.mode === 'idle' && t.id !== secili; });
    if (!adaylar.length) return;
    const t = rs(adaylar); const p = d.petler[t.id]; const i = odaIndeks(p.oda);
    let hedef;
    if (p.oda !== t.ev && Math.random() < 0.55) hedef = t.ev;
    else { const komsu = [i - 1, i + 1].filter(j => j >= 0 && j < ODALAR.length); hedef = ODALAR[rs(komsu)].id; }
    if (hedef === p.oda) return;
    const yon = odaIndeks(hedef) > i ? 1 : -1; const sonraki = ODALAR[i + yon].id;
    const pet = petRef[t.id]; const m = motorlar[p.oda];
    pet.varinca = () => { if (petRef[t.id] === pet && !pet.held) tasi(t, sonraki, yon); };
    pet.git(yon > 0 ? m.katman.clientWidth - pet.w - 2 : 2);
    if (Math.random() < 0.5) pet.soyle(hedef === t.ev ? 'eve dönüyorum' : 'komşuya gidiyorum', 1500);
  }
  function tasi(t, hedefOda, yon) {
    const p = d.petler[t.id]; const yeni = motorlar[hedefOda]; const eski = motorlar[p.oda]; if (!yeni || !eski) return;
    const pet = petRef[t.id]; if (!pet) return;
    if (pet._uykuT) { zi(pet._uykuT); pet._uykuT = 0; }
    eski.kaldir(t.id); delete petRef[t.id];
    p.oda = hedefOda;
    const W = yeni.katman.clientWidth || 320;
    const yeniPet = petOlustur(t, hedefOda, yon > 0 ? 4 : Math.max(4, W - pet.w - 4), true);
    if (!yeniPet) return;
    yeniPet.dir = yon; yeniPet.ciz(true);
    const hedefX = yon > 0 ? 40 + Math.random() * Math.max(20, W - 140) : Math.max(8, W - 100 - Math.random() * Math.max(20, W - 140));
    zt(() => { if (petRef[t.id] === yeniPet) yeniPet.git(hedefX); }, 80);
    if (Math.random() < 0.6) zt(() => { if (petRef[t.id] === yeniPet) yeniPet.soyle(odaTanim(hedefOda).ad + ' güzelmiş', 1500); }, 1100);
    kaydet(); rosterGuncelle(); if (secili === t.id) barlariGuncelle();
  }
  function olayPlanla() { olayT = zt(() => { try { olay(); } catch (e) {} olayPlanla(); }, OLAY_MIN + Math.random() * (OLAY_MAX - OLAY_MIN)); }
  function olay() {
    if (document.hidden || document.body.classList.contains('sheet-acik')) return;
    const odaId = ODALAR[aktifOda].id;
    const adaylar = gorunurPetler(odaId).filter(t => { const pet = petRef[t.id]; return pet && !mesgul[t.id] && !pet.held && !pet.uyuyor; });
    if (!adaylar.length) return;
    const t = rs(adaylar); const pet = petRef[t.id]; const p = d.petler[t.id];
    if (ruhHali(p).id === 'ozledi' && Math.random() < 0.5) { petSoyle(pet, t, 'ozledim', 2200); return; }
    const satir = rs(t.soz.bos);
    pet.soyle(satir, 2000);
    switch (t.id) {
      case 'ayi': if (odaId === 'mutfak') yukselEmoji(odaId, pet, '🍪', 2); break;
      case 'hayalet': if (CD.gece() && !ctx.azHareket) pet.git(20 + Math.random() * Math.max(20, motorlar[odaId].katman.clientWidth - 100)); break;
      case 'flork': if (!ctx.azHareket) pet.zipla(480); break;
      case 'top': if (!ctx.azHareket) { pet.zipla(680); ctx.ses.hop(); } break;
      case 'tavsan': if (odaId === 'balkon') yukselEmoji(odaId, pet, '🌱', 2); break;
      case 'kedi': if (Math.random() < 0.4 && !ctx.azHareket) { pet.uyu(); zt(() => { if (petRef[t.id] === pet && !p.uyku) pet.uyan(); }, 6000); } break;
      case 'pittiksu': ctx.ses.minikMiyav(); if (satir === 'BITCH!' && !ctx.azHareket) pet.zipla(420); break;
      case 'bibble': ctx.ses.hmpf(); break;
    }
  }
  function canliAzalma() {
    const once = {}; PETLER.forEach(t => { once[t.id] = ruhHali(d.petler[t.id]).id; });
    azalma(Date.now());
    barlariGuncelle(); rosterGuncelle(); kaydet();
  }

  /* ------------------------------------------------------------ karşılama */
  function karsila(saatFarki) {
    const odaId = ODALAR[aktifOda].id;
    const sakinler = gorunurPetler(odaId);
    zt(() => {
      sakinler.forEach((t, i) => zt(() => {
        const pet = petRef[t.id]; if (!pet) return;
        const p = d.petler[t.id];
        if (saatFarki >= 6 && ruhHali(p).id !== 'mutlu') petSoyle(pet, t, 'ozledim', 2400); else petSoyle(pet, t, 'selam', 2200);
      }, i * 900));
    }, 900);
    if (d.ziyaret === 1) ctx.toast('Evdekiler seni bekliyordu. Bir pete dokun 🐾', 3200);
    else if (saatFarki >= 6) { const n = PETLER.filter(t => ruhHali(d.petler[t.id]).id !== 'mutlu').length; if (n) ctx.toast('Ev seni özlemiş: ' + n + ' pet biraz ilgi istiyor 🥺', 3200); }
  }

  /* ------------------------------------------------------------ mount / unmount */
  CD.kaydet({
    id: ID, baslik: 'Pet Evi',
    ikon: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 30 32 12l22 18v22a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="var(--seker-seftali)" stroke="var(--pixel-cizgi)" stroke-width="3" stroke-linejoin="round"/><path d="M6 32 32 9l26 23" fill="none" stroke="var(--pixel-cizgi)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="26" y="38" width="12" height="18" rx="3" fill="var(--burun)" stroke="var(--pixel-cizgi)" stroke-width="3"/><path d="M50 8c-2-3-7-2-7 2 0 3 7 8 7 8s7-5 7-8c0-4-5-5-7-2z" fill="var(--seker-kiraz)" stroke="var(--pixel-cizgi)" stroke-width="2"/></svg>',
    mount(el, c) {
      ctx = c; kok = el; secili = null; aktifOda = 0;
      Object.keys(petRef).forEach(k => delete petRef[k]); Object.keys(mesgul).forEach(k => delete mesgul[k]);
      d = yukle();
      const saatFarki = (Date.now() - d.sonGorulme) / 3.6e6;
      azalma(Date.now()); d.ziyaret++;
      if (!CD.PetMotor || !CD.petVeri) {
        el.appendChild(ctx.el('div.icerik', [ctx.el('div.yama.bos-durum', [ctx.el('div.buyuk', '🏠'), ctx.el('p', 'Petler henüz eve taşınmadı. Sayfayı yenileyip tekrar dener misin?')])]));
        return;
      }
      // --- sahne: yatay kaydırılan odalar
      const sahne = ctx.el('div.sahne.petevi-sahne', { 'data-pati': '' });
      ui.serit = ctx.el('div.petevi-serit', { role: 'group', 'aria-label': 'Evin odaları' });
      ODALAR.forEach(o => {
        const oda = ctx.el('div.petevi-oda.petevi-oda-' + o.id, { data: { oda: o.id }, role: 'group', 'aria-label': o.ad });
        oda.append(
          ctx.el('div.petevi-duvar', { 'aria-hidden': 'true' }),
          ctx.el('div.petevi-mobilya-kat', { 'aria-hidden': 'true', html: MOBILYA[o.id] || '' }),
          ctx.el('div.petevi-zemin', { 'aria-hidden': 'true' }),
          ctx.el('div.petevi-katman'),
          ctx.el('div.petevi-karartma', { 'aria-hidden': 'true' }),
          ctx.el('div.petevi-efekt', { 'aria-hidden': 'true' }),
          ctx.el('span.petevi-oda-etiket', { 'aria-hidden': 'true' }, o.ikon + ' ' + o.ad)
        );
        odaEl[o.id] = oda; ui.serit.appendChild(oda);
      });
      ui.serit.addEventListener('scroll', seritKaydi, { passive: true });
      sahne.appendChild(ui.serit);
      // --- içerik
      const icerik = ctx.el('div.icerik.petevi-icerik');
      ui.cipler = ctx.el('div.cipler.petevi-cipler', { role: 'tablist', 'aria-label': 'Odalar' }, ODALAR.map((o, i) => ctx.el('button.cip', { type: 'button', role: 'tab', 'aria-selected': String(i === 0), onclick: () => { ctx.ses.tik(); odayaGit(o.id, true); aktifOda = i; ciplerGuncelle(); } }, o.ikon + ' ' + o.ad)));
      ui.odaTanim = ctx.el('p.sessiz.petevi-oda-tanim', ODALAR[0].tanim);
      ui.roster = ctx.el('div.petevi-roster', { role: 'group', 'aria-label': 'Ev halkı' }, PETLER.map(t => {
        const sprite = CD.petVeri(t.id);
        const b = ctx.el('button.petevi-roster-pet', { type: 'button', 'aria-pressed': 'false', data: { pet: t.id }, onclick: () => { ctx.ses.tik(); sec(t.id, true); const pet = petRef[t.id]; if (pet && !pet.uyuyor) { petSoyle(pet, t, 'selam', 1800); pet.mutlu(600); } } });
        const ik = ctx.el('span.petevi-roster-ikon', { 'aria-hidden': 'true' }); if (sprite) ik.appendChild(CD.spriteElemani(sprite, 0, 2));
        b.append(ik, ctx.el('span.petevi-roster-ad', petAd(t.id)), ctx.el('i.petevi-ruh-nokta', { 'aria-hidden': 'true' }));
        return b;
      }));
      ui.kartBos = ctx.el('div.yama.bos-durum.petevi-bos', [ctx.el('div.buyuk', { 'aria-hidden': 'true' }, '🏠'), ctx.el('p', 'Bir pete dokun; ona birlikte bakalım.'), ctx.el('p.sessiz', 'Odaları sağa sola kaydırarak gez. Petleri tutup fırlatabilirsin de.')]);
      ui.kart = ctx.el('div.yama.petevi-kart', { hidden: true });
      ui.ozet = ctx.el('p');
      ui.rozetSayi = ctx.el('span.rozet.inci');
      const ozetKart = ctx.el('div.yama.siki.petevi-ozet', [ctx.el('div.satir.arasi', [ctx.el('div.baslik.baslik-lg', 'Ev hali'), ui.rozetSayi]), ui.ozet, ctx.el('div.satir.sar', [ctx.el('button.dugme-ikincil.kucuk', { type: 'button', onclick: () => rozetSheet() }, '🏅 Rozetler'), ctx.el('button.dugme-hayalet', { type: 'button', onclick: () => { ctx.ses.tik(); Object.keys(motorlar).forEach(k => motorlar[k].sevin()); ctx.toast('Herkes sana el salladı 👋'); } }, 'Herkese selam ver')])]);
      icerik.append(ui.cipler, ui.odaTanim, ui.roster, ui.kartBos, ui.kart, ozetKart);
      if (!d.ipucuGoruldu) {
        const ipucu = ctx.el('div.yama.siki.petevi-ipucu', [ctx.el('div.kalin', 'Evin kuralları basit'), ctx.el('p.sessiz', 'Pete dokun → seçilir. Alttaki düğmelerle besle, yıka, uyut, oyna, sev. Barlar zamanla yavaşça iner; kimse üzülmez, en fazla seni özler.'), ctx.el('button.dugme.kucuk', { type: 'button', onclick: () => { ctx.ses.tik(); d.ipucuGoruldu = true; kaydet(); ipucu.remove(); } }, 'Anladım')]);
        icerik.insertBefore(ipucu, ui.kartBos);
      }
      el.append(sahne, icerik);
      altbarKur(); rosterGuncelle();
      // --- motorlar ve petler (ölçüler için bir kare sonra)
      requestAnimationFrame(() => {
        if (!ctx) return;
        ODALAR.forEach(o => motorKur(o));
        petleriYerlestir();
        try {
          io = new IntersectionObserver(girisler => girisler.forEach(g => { const m = motorlar[g.target.dataset.oda]; if (m) m.duraklat(!g.isIntersecting); }), { root: ui.serit, threshold: 0.02 });
          ODALAR.forEach(o => io.observe(odaEl[o.id]));
        } catch (e) { io = null; }
        zt(() => karsila(saatFarki), 500);
      });
      aralik = setInterval(canliAzalma, AZALMA_ARALIK);
      gezPlanla(); olayPlanla();
      gorunurCb = () => { if (document.hidden) kaydet(); else { azalma(Date.now()); barlariGuncelle(); rosterGuncelle(); } };
      document.addEventListener('visibilitychange', gorunurCb);
      kaydet();
    },
    unmount() {
      clearInterval(aralik); aralik = 0;
      zamanlayicilar.forEach(t => clearTimeout(t)); zamanlayicilar.clear(); gezT = 0; olayT = 0;
      if (seritRaf) { cancelAnimationFrame(seritRaf); seritRaf = 0; }
      if (io) { io.disconnect(); io = null; }
      if (gorunurCb) { document.removeEventListener('visibilitychange', gorunurCb); gorunurCb = null; }
      try { kaydet(); } catch (e) {}
      Object.keys(motorlar).forEach(k => { try { motorlar[k].yokEt(); } catch (e) {} delete motorlar[k]; });
      Object.keys(petRef).forEach(k => delete petRef[k]);
      Object.keys(mesgul).forEach(k => delete mesgul[k]);
      Object.keys(odaEl).forEach(k => delete odaEl[k]);
      Object.keys(ui).forEach(k => delete ui[k]);
      if (ctx) ctx.ses.hepsiniDurdur();
      secili = null; d = null; ctx = null; kok = null;
    }
  });
})();
