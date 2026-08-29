# Cemre'nin Dünyası 🌷

Cemre için yapılmış küçük, kişisel bir site. Telefondan açılır; "Ana ekrana ekle" ile uygulama gibi durur.

**Canlı:** https://ahmetresulkilinc.github.io/cemre-dunyasi/ — açılışta *sihirli kelime* sorar; kelime bir kez yazılınca o cihazda hatırlanır.

## Klasörler

| Yer | Ne |
|---|---|
| `site/` | sitenin kendisi (düz HTML/CSS/JS, kurulum gerekmez) |
| `site/config.js` | ayarlar: isimler, albüm altyazıları, "Bizim Köşemiz" alanları |
| `site/gizli/` | **şifreli** fotoğraflar + mektup (`tools/gizle.js` üretir) |
| `gizli-kaynak/` | şifresiz fotoğraflar + `not.txt` (mektup) — **depoya girmez** |

## Fotoğraf ya da mektup değiştirmek

1. Fotoğrafı `gizli-kaynak/bizim/` (ya da `gizli-kaynak/pittiksu/`) içine at; mektubu `gizli-kaynak/not.txt` içinde düzenle.
2. Albüm altyazısı için `site/config.js` → `BIZIM_FOTOLAR` listesine bir satır ekle.
3. Yeniden şifrele (kelime aynı kalsın ki Cemre'nin telefonu tekrar sormasın):
   ```powershell
   node site/tools/gizle.js <sihirli-kelime>
   ```

## Yayınlamak (GitHub Pages, `gh-pages` dalı = `site/` klasörü)

```powershell
cd "c:\Users\LENOVO\OneDrive\Masaüstü\ödrm"
git add -A
git commit -m "güncelleme"
git push
git branch -D gh-pages 2>$null; git subtree split --prefix=site -b gh-pages
git push -f origin gh-pages
```

1–2 dakika sonra site güncellenir. (Pages kaynağı: `gh-pages` dalı, kök `/`.)

## Yerelde denemek

```powershell
cd "c:\Users\LENOVO\OneDrive\Masaüstü\ödrm\site"
python -m http.server 8765
```
Tarayıcıda `http://127.0.0.1:8765/` — kapı burada da çıkar, aynı kelime açar.
