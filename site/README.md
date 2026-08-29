# Cemre'nin Dünyası — Ahmet için kullanım kılavuzu

Bu klasör (`site/`) sitenin tamamıdır. Kurulum, program, internet bağlantısı gerekmez:
`index.html` dosyasına çift tıklayınca bile açılır. Asıl kullanım telefondan (Safari / Chrome).

## 1. Ne var, nerede

| Bölüm | Ne yapar |
|---|---|
| Giriş | Karanlık ekran → buket belirir → "Çiçeği al" → beyaz not kartı → "Hadi biraz eğlenelim ~tıkla~" → ana ekran (hub). İlk açılışta tam akış oynar; sonraki açılışlarda hızlı sürüm + "atla". Hub'daki "Buketi tekrar gör" ve "Notu oku" düğmeleriyle istendiğinde yeniden izlenir. |
| Pıttıksu | Okşama (mırlar), rüya oyunları (lazer, tüy, fare, yumak), albüm (fotoğraf ekleme), günlük (mama, kilo, hatırlatıcı), yenidoğan bakım ipuçları, Pıttıksu'nun sözleri. |
| Tırnak Salonu | Ten tonu + el seçimi, şekil, renk, finish (aurora krom dahil), french/ombre/mermer, çıkartmalar, serbest fırça, kaydet / paylaş. "Cemre'nin tırnakları" hazır set. |
| Pet Evi | 7 pixel pet + misafir Pıttıksu; odalar, ihtiyaç barları, besle/yıka/uyut/oyna/sev, rozetler. |
| Angela | Beyaz kedi: mikrofona konuş → tiz sesle tekrar eder; okşa, besle, giydir, makyaj, mini oyunlar, yıldız/seviye. |
| Bahçe | Saksıya tohum ek (lilyum, gül, lale, …), sula, açmasını izle, buket yap. |
| Obur Panda | Yemek sürükle, karnı şişsin, sonra sarılıp uyusun. |
| Öfke Odası | Terlik/çekiç/sopa ile eşya kır, combo, sonunda nefes egzersizi. |
| Bizim Köşemiz | İkimizin albümü, birlikte sayacı, sebepler, şarkımız, anılar — hepsi `config.js`'ten. |

Her şey telefonda kalır (localStorage / IndexedDB). Hiçbir yere veri gönderilmez.

## 2. `config.js` — senin düzenleyeceğin tek dosya

`site/config.js` dosyasını Not Defteri ile aç. Sadece tırnak (`" "`) ya da ters tırnak (`` ` ` ``) içindeki yazıları değiştir; virgülleri ve tırnakları silme. Kaydet, sayfayı yenile.

- **NOT** → giriş ekranındaki beyaz kartta çıkan mektup. Paragrafları boş satırla ayır.
- **NOT_BASLIK / NOT_IMZA** → kartın başlığı ve imzası (boş bırakırsan görünmez).
- **YAPIM_ASAMASINDA** → bu listedeki bölümler ana ekranda "yapım aşamasında" görünür ve açılmaz. Şu an `["pittiksu", "tirnak"]`. Bölümü açmak için adını listeden sil (ör. `[]` hepsini açar). Test için adresin sonuna `?hepsi=1` ekleyince kilit o sekmede kalkar.
- **PITTIKSU.DOGUM_TARIHI** → `"2026-08-18"` biçiminde. Boş bırakırsan site yaklaşık 10 gün önce sayar; Cemre içeriden de değiştirebilir.
- **PETLER** → pet adları ve rolleri.
- **BIZIM** → `BIRLIKTE_TARIH`, `SEBEPLER`, `SARKI`, `SORU`, `ANILAR`. Boş kalan alan sitede "yakında" görünür.
- **BIZIM_FOTOLAR** → albümdeki kareler ve altyazıları. Yeni fotoğraf eklemek için: fotoğrafı `site/assets/bizim/` klasörüne at (web boyutu, ~1400 px), istersen `ad-thumb.jpg` küçüğünü de koy, listeye bir satır ekle.

Dosyayı kaydettikten sonra tarayıcıda bir şey bozulursa (sayfa boş kalırsa) büyük ihtimalle bir tırnak ya da virgül silinmiştir; son değişikliği geri al.

## 3. Bilgisayarda deneme

- En kolayı: `site/index.html`'e çift tıkla.
- Telefon gibi görmek için: Chrome'da sağ tık → "İncele" → cihaz simgesi (iPhone). Ya da `site` klasöründe `python -m http.server 8765` çalıştırıp `http://127.0.0.1:8765/?hepsi=1` adresini aç.

## 4. Yayınlama (GitHub Pages)

Bu depo `main` dalına her gönderimde otomatik yayınlanır (`.github/workflows/pages.yml`, `site` klasörünü yayınlar).

1. Değişikliği yap (`config.js` vb.).
2. `git add -A` → `git commit -m "not güncellendi"` → `git push`.
3. 1–2 dakika sonra GitHub → Settings → Pages'te yazan adreste yeni hali görünür. (Pages'in ilk kez "GitHub Actions" kaynağıyla açık olması gerekir.)

Telefonda güncelleme gelmezse: sayfayı bir kez kapatıp açmak yeter (site önce internetten yeni sürümü çeker, olmazsa önbellekten açılır). Büyük değişikliklerde `sw.js` içindeki `SURUM` yazısını (`cd-v1` → `cd-v2`) değiştirmek eski önbelleği temizler.

## 5. Telefona "uygulama" gibi ekleme

- iPhone: Safari'de aç → Paylaş → "Ana Ekrana Ekle".
- Android: Chrome menüsü → "Ana ekrana ekle".

Ana ekrandaki simge tam ekran açılır, çevrimdışı da çalışır.

## 6. Dosya düzeni (merak edersen)

```
site/
  index.html          sayfa iskeleti (bölümler buraya yüklenir)
  config.js           SENİN ayarların
  tokens.css base.css renkler / ortak stiller
  js/cekirdek.js      ortak çekirdek (ses, efekt, depo, yönlendirme)
  js/giris.js         giriş akışı (buket, not kartı)
  js/hub.js           ana ekran
  js/petler-miras.js  pixel petler
  js/bolum/<ad>.js    her bölümün kodu   css/<ad>.css  her bölümün stili
  assets/             fotoğraflar (pittiksu/, bizim/)
  icons/ manifest.webmanifest sw.js   uygulama simgesi / çevrimdışı
```

Yeni bir şey eklemek istersen `MODUL-SOZLESMESI.md` bölümlerin nasıl yazıldığını anlatır.
