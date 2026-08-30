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

  /* Kartın en üstündeki küçük başlık (boş bırakırsan görünmez) */
  NOT_BASLIK: "Ahmet'ten küçük bir not",

  /* Mektubun altındaki imza (boş bırakırsan görünmez) */
  NOT_IMZA: "— Ahmet",

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
     PITTIKSU — Cemre'nin gerçek kedisi
     --------------------------------------------------------------- */
  PITTIKSU: {
    AD: "Pıttıksu",
    /* Doğum tarihi: yıl-ay-gün. Örnek: "2026-08-18"
       Boş bırakırsan site "yaklaşık 10 gün önce" sayar; Cemre içeriden değiştirebilir. */
    DOGUM_TARIHI: "",
    /* Kısa tanım — bakım kartlarında ve sözlerde geçer */
    TANIM: "gri tüylü, mavi-gri gözlü, pembe burunlu minicik yavru kedi"
  },

  /* ---------------------------------------------------------------
     BARBIE — Cemre'nin köpeği (krem Pomeranian)
     --------------------------------------------------------------- */
  BARBIE: {
    AD: "Barbie",
    /* Doğum tarihi / eve geliş: yıl-ay-gün. Örnek: "2023-05-10". Boş bırakabilirsin. */
    DOGUM_TARIHI: "",
    TANIM: "krem tüylü, kara gözlü, dili hep dışarıda minik Pomeranian"
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
     BİZİM KÖŞEMİZ — kişisel alanlar. Hepsini sen dolduracaksın;
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
  BIZIM_FOTOLAR: [
    { dosya: "ikimiz.jpg",  altyazi: "İkimiz 🤍", oneCikan: true },
    { dosya: "cemre-1.jpg", altyazi: "Dünyanın en güzel insanı 💋" },
    { dosya: "cemre-2.jpg", altyazi: "Işık sana yakışıyor ☀️" },
    { dosya: "buket.jpg",   altyazi: "Lilyumlu buket 💐" },
    { dosya: "patrick.jpg", altyazi: "Patrick 🍬" },
    { dosya: "melody.jpg",  altyazi: "My Melody 🎀" },
    { dosya: "kopek.jpg",   altyazi: "Barbie 🐶" },
    { dosya: "barbie-1.jpg", altyazi: "Barbie ✨" },
    { dosya: "barbie-2.jpg", altyazi: "Dili hep dışarıda 🐾" },
    { dosya: "cemre-barbie.jpg", altyazi: "Cemre ve Barbie 💗" }
  ]
};
