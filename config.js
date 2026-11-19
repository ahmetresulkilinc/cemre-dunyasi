/* =====================================================================
   CEMRE'NİN DÜNYASI — AYARLAR (Ahmet için)

   Bu dosyayı Not Defteri ile açıp sadece tırnak (" ") ya da ters tırnak (` `)
   içindeki yazıları değiştirmen yeter. Virgülleri ve tırnakları silme.
   Kaydet, sayfayı yenile; değişiklik anında görünür.
   ===================================================================== */
window.CD_CONFIG = {

  /* ---------------------------------------------------------------
     MEKTUP — Giriş ekranındaki beyaz not kartında görünen metin.
     Paragrafları boş satırla ayır. Ters tırnaklar (` `) arasına yaz.
     --------------------------------------------------------------- */
  NOT: "",  /* Mektup şifreli: metni gizli-kaynak/not.txt dosyasında düzenle, sonra "node site/tools/gizle.js <kelime>" çalıştır */

  /* ---------------------------------------------------------------
     İSİMLER — sitede geçen iki isim (aşk ölçer, mesajlar…).
     --------------------------------------------------------------- */
  ISIMLER: { BEN: "", O: "" },   /* gerçek değerler: gizli-kaynak/kisisel.json (şifreli) */

  /* Kartın en üstündeki küçük başlık (boş bırakırsan görünmez) */
  NOT_BASLIK: "",

  /* Mektubun altındaki imza (boş bırakırsan görünmez) */
  NOT_IMZA: "",

  /* ---------------------------------------------------------------
     BULUT SENKRONU — açıksa kayıtlar buluta da yazılır; aynı sihirli kelimeyi
     kullanan her cihaz (senin telefonun dahil) aynı dünyayı görür.
     Kurulum: Supabase panelinde site/tools/supabase-kurulum.sql dosyasını çalıştır.
     Kapatmak için URL'yi boş bırak.
     --------------------------------------------------------------- */
  SENK: {
    URL: "https://tfsjzvltwmbmvjfoxmkn.supabase.co",
    ANON: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc2p6dmx0d21ibXZqZm94bWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0Njc5NzYsImV4cCI6MjEwMzA0Mzk3Nn0.GYmK82MH6PO-S-OHg0R3qDZ2a5l7MsGWKtlw2n4BGSw"
  },

  /* ---------------------------------------------------------------
     YAPIM AŞAMASINDA — Buraya yazılan bölümler hub'da "yapım aşamasında"
     rozetiyle kapalı görünür. Bölüm bitince adını listeden sil.
     Bölüm adları: pittiksu, tirnak, petevi, angela, bahce, panda, ofke, bizim
     --------------------------------------------------------------- */
  YAPIM_ASAMASINDA: [],

  /* ---------------------------------------------------------------
     MAHALLE (ana ekran) — AHMET ONAYLAYACAK: aşağıdakiler tasarımcının önerdiği
     yer tutuculardır; doğru değilse değiştir.
     EV: kimin evi hangi bina? Uyku hilali o evin çatısında çıkar, elçi o kapıda bekler.
         Bina adları: pittiksu, barbie, tirnak, petevi, angela, panda, bahce, ofke, xox, bizim
     KISILER: mahalledeki pixel karakterlerin saç (SAC), ten (TEN), üst giysi (UST) ve kot (ALT) rengi.
         Boş bırakırsan tokens.css'teki varsayılan renkler kullanılır.
     MEKTUP_YAZARI: giriş mektubunu kim yazdı? Öbürü okuyunca "mühür kırıldı" postası gider.
     --------------------------------------------------------------- */
  MAHALLE: {
    EV: { cemre: "pittiksu", ahmet: "barbie" },          /* Ahmet onaylayacak */
    KISILER: {   /* fotoğraflardan alındı */
      cemre: { SAC: "#3E2A22", TEN: "#F3D2BC", UST: "#2E2A30", ALT: "#4A6C93" },
      ahmet: { SAC: "#1E1A1A", TEN: "#C99A74", UST: "#2A2A2E", ALT: "#4A6C93" }
    },
    MEKTUP_YAZARI: "ahmet"
  },

  /* ---------------------------------------------------------------
     GÜNÜN SORUSU — Mahalle Panosu'nda her gün bir soru çıkar (iki telefonda aynı).
     Boş bırakırsan sitedeki 160'tan fazla hazır soru sırayla kullanılır (js/sorular.js).
     Kendi sorularını yazmak istersen her satıra bir soru: "Soru?",
     --------------------------------------------------------------- */
  GUNUN_SORULARI: [
    /* "Bugün seni en çok ne güldürdü?", */
  ],

  /* ---------------------------------------------------------------
     PITTIKSU — Cemre'nin gerçek kedisi
     --------------------------------------------------------------- */
  PITTIKSU: {
    AD: "Pıttıksu",
    /* Doğum tarihi: yıl-ay-gün. Örnek: "2026-08-18"
       Boş bırakırsan site "yaklaşık 10 gün önce" sayar; Cemre içeriden değiştirebilir. */
    DOGUM_TARIHI: "",
    /* Kısa tanım — bakım kartlarında ve sözlerde geçer */
    TANIM: ""
  },

  /* ---------------------------------------------------------------
     BARBIE — Cemre'nin köpeği (krem Pomeranian)
     --------------------------------------------------------------- */
  BARBIE: {
    AD: "Barbie",
    /* Doğum tarihi / eve geliş: yıl-ay-gün. Örnek: "2023-05-10". Boş bırakabilirsin. */
    DOGUM_TARIHI: "",
    TANIM: ""
  },

  /* ---------------------------------------------------------------
     ANGELA — beyaz kız kedi bölümü. Cemre içeriden yeniden adlandırabilir.
     --------------------------------------------------------------- */
  ANGELA_ADI: "Angela",

  /* ---------------------------------------------------------------
     PET EVİ — karakterlerin ekranda görünen adı ve rolü.
     (Çizimleri değişmez; sadece isim ve rol yazısı buradan gelir.)
     --------------------------------------------------------------- */
  PETLER: {
    ayi:      { AD: "Ponçik Ayı",       ROL: "aşçı" },
    hayalet:  { AD: "Fiyonklu Hayalet", ROL: "gece bekçisi" },
    flork:    { AD: "Flork",            ROL: "dramatik" },
    top:      { AD: "Pembe Top",        ROL: "sporcu" },
    kedi:     { AD: "Sırıtan Kedi",     ROL: "tembel" },
    tavsan:   { AD: "Tavşan",           ROL: "bahçıvan" },
    bibble:   { AD: "Bibble",           ROL: "somurtkan" },
    pittiksu: { AD: "Pıttıksu",         ROL: "misafir bebek" },
    barbie:   { AD: "Barbie",           ROL: "evin neşesi" }
  },

  /* ---------------------------------------------------------------
     BİZİM KÖŞEMİZ — kişisel alanlar. ŞİFRELİ: gizli-kaynak/kisisel.json içinde düzenle,
     sonra node site/tools/gizle.js ile yeniden şifrele. Buradakiler sadece boş kalıp. Hepsini sen dolduracaksın;
     doldurmadığın alan sitede "yakında" olarak görünür, uydurma bir şey yazılmaz.
     --------------------------------------------------------------- */
  BIZIM: {
    /* Birlikte olduğunuz ilk gün: yıl-ay-gün. Örnek: "2025-02-14". Site "… gündür birlikteyiz" diye sayar. */
    BIRLIKTE_TARIH: "",

    /* Onu sevme sebeplerin — her satır bir sebep. İstediğin kadar ekle; tırnak içine yaz, sonuna virgül koy. */
    SEBEPLER: [
      /* "Gülüşün.", */
      /* "Pıttıksu'ya bakarkenki halin.", */
    ],

    /* Şarkınız: adı ve (istersen) bağlantısı. Bağlantı boşsa sadece ad görünür. */
    SARKI: { AD: "", LINK: "" },

    /* Ona sormak istediğin tek bir soru (sitede tatlı bir kutuda çıkar). */
    SORU: "",

    /* Anılar — her biri { TARIH: "yıl-ay-gün", METIN: "..." }. Tarih boş kalabilir. */
    ANILAR: [
      /* { TARIH: "", METIN: "İlk kahvemiz." }, */
    ]
  },

  /* ---------------------------------------------------------------
     BİZİM KÖŞEMİZ — ALBÜM. Fotoğraflar site/assets/bizim/ klasöründe.
     Her satır bir kare: dosya adı + altındaki yazı (+ istersen tarih "yıl-ay-gün").
     Altyazıyı tırnak içinde değiştir; yeni kare eklemek için klasöre fotoğrafı
     (ve varsa "ad-thumb.jpg" küçüğünü) at, buraya bir satır daha ekle.
     "ikimiz.jpg" duvarın tepesinde büyük görünür (oneCikan: true).
     --------------------------------------------------------------- */
  BIZIM_FOTOLAR: [   /* gerçek liste: gizli-kaynak/kisisel.json (şifreli) */
  ],

  /* ---------------------------------------------------------------
     SAFİR'İN YERİ — fotoğraflar şifreli (gizli/ klasöründe). Sıra burada.
     "alt" fotoğrafın kısa tarifi; boş kalırsa "Safir" yazılır. Ekranda yazı çıkmaz.
     --------------------------------------------------------------- */
  SAFIR: {
    FOTOLAR: [
      { yol: "assets/safir/safir-1.jpg",        alt: "" },
      { yol: "assets/safir/safir-2.jpg",        alt: "" },
      { yol: "assets/safir/safir-pittiksu.jpg", alt: "" },
      { yol: "assets/safir/safir-cemre.jpg",    alt: "" }
    ]
  }
};
