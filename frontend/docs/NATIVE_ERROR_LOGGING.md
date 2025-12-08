# 🔍 Native (Java/Kotlin) Hata Loglama Rehberi

## ⚠️ Önemli: Neden JS Console'da Hata Görünmüyor?

Telefonunuzda gördüğünüz `java.lang.String cannot be cast to java.lang.Boolean` hatası **native tarafında** (Java/Kotlin) oluşuyor. Bu hatalar:

- ❌ **Metro bundler console'unda görünmez**
- ❌ **React Native JS console'unda görünmez**  
- ✅ **Sadece `adb logcat` ile görülebilir**

## 🎯 Çözüm: Native Logları Yakalama

### Yöntem 1: Kapsamlı Log Script (Önerilen)

```bash
cd /Users/bariscandemirel/Desktop/tenis_app/frontend
./get-all-logs.sh
```

Bu script:
1. Tüm native logları kaydeder
2. Boolean casting hatalarını özellikle filtreler
3. AndroidRuntime hatalarını yakalar
4. Logları dosyaya kaydeder

### Yöntem 2: Manuel Canlı Log İzleme

**Ayrı bir terminal açın** (Metro bundler çalışırken):

```bash
# Logları temizle
adb logcat -c

# Canlı logları izle (Boolean hatalarını filtrele)
adb logcat | grep -i -E "(Boolean|cast|AndroidRuntime|FATAL|TENIS_APP_ERROR)"
```

Sonra telefonunuzda uygulamayı açın - hata anında loglar görünecek!

### Yöntem 3: Sadece Hataları Göster

```bash
# Sadece ERROR seviyesi loglar
adb logcat *:E

# Sadece FATAL hatalar (uygulama çökmesi)
adb logcat *:F

# AndroidRuntime hataları (Java/Kotlin hataları)
adb logcat | grep AndroidRuntime
```

### Yöntem 4: Boolean Casting Hatalarını Özellikle Ara

```bash
# Logları temizle
adb logcat -c

# Telefonda uygulamayı açın, sonra:
adb logcat -d | grep -i -E "(Boolean|cast|ClassCastException|String cannot be cast)"
```

## 📊 Log Formatı

Native hatalar şu formatta görünür:

```
E AndroidRuntime: FATAL EXCEPTION: main
E AndroidRuntime: Process: com.tenisapp.frontend, PID: 12345
E AndroidRuntime: java.lang.ClassCastException: java.lang.String cannot be cast to java.lang.Boolean
E AndroidRuntime:     at com.facebook.react.uimanager.ViewPropsManager.getProp(ViewPropsManager.java:123)
E AndroidRuntime:     at ...
```

## 🔍 Hata Yakalama Adımları

### 1. Metro Bundler'ı Çalıştırın (Bir Terminal)
```bash
cd frontend
npm start
```

### 2. Logları İzleyin (Ayrı Bir Terminal)
```bash
adb logcat -c
adb logcat | grep -E "(Boolean|AndroidRuntime|FATAL|TENIS_APP_ERROR)"
```

### 3. Telefonda Uygulamayı Açın

### 4. Hatayı Tekrarlayın

### 5. Logları İnceleyin

Hata anında terminal'de şu tür loglar göreceksiniz:

```
TENIS_APP_ERROR: ⚠️ BOOLEAN CASTING ERROR DETECTED!
TENIS_APP_ERROR: Error Details:
TENIS_APP_ERROR:   - Message: java.lang.String cannot be cast to java.lang.Boolean
E AndroidRuntime: FATAL EXCEPTION: main
E AndroidRuntime: java.lang.ClassCastException: ...
```

## 📱 Android Studio Logcat (Alternatif)

1. Android Studio'yu açın
2. **Logcat** sekmesine gidin (alt panel)
3. Filter kutusuna şunu yazın: `Boolean|AndroidRuntime|FATAL|TENIS_APP_ERROR`
4. Telefonda uygulamayı açın
5. Hataları gerçek zamanlı görün

## 🚨 Yaygın Sorunlar

### Sorun 1: "device not found"
```bash
# Cihazı kontrol et
adb devices

# USB debug modunu açtığınızdan emin olun
# Telefon Ayarları > Geliştirici Seçenekleri > USB Debugging
```

### Sorun 2: "logcat boş"
```bash
# Log buffer'ı artır
adb logcat -G 16M

# Tüm logları göster
adb logcat
```

### Sorun 3: "Çok fazla log var"
```bash
# Sadece uygulama loglarını göster
adb logcat | grep com.tenisapp.frontend

# Sadece hataları göster
adb logcat *:E | grep com.tenisapp.frontend
```

## 💡 İpuçları

1. **Her zaman logları temizleyin başlamadan önce:**
   ```bash
   adb logcat -c
   ```

2. **Logları dosyaya kaydedin:**
   ```bash
   adb logcat > logs.txt
   # Sonra Ctrl+C ile durdurun
   ```

3. **Önemli logları ayrı bir dosyaya kaydedin:**
   ```bash
   adb logcat -d | grep -E "(Boolean|FATAL|AndroidRuntime)" > errors.txt
   ```

4. **Release build'de test edin:**
   - Native hatalar genellikle release build'de ortaya çıkar
   - Debug build'de görünmeyen hatalar release'de görülebilir

## 📝 Örnek Komutlar

### Hızlı Hata Kontrolü
```bash
adb logcat -d | grep -i boolean | tail -20
```

### Tüm Hataları Dosyaya Kaydet
```bash
adb logcat -d > all_logs.txt
grep -i "boolean\|cast\|fatal\|androidruntime" all_logs.txt > errors.txt
```

### Canlı İzleme (Filtreli)
```bash
adb logcat -c
adb logcat | grep --line-buffered -E "(Boolean|cast|FATAL|TENIS_APP_ERROR)"
```

## 🎯 Boolean Casting Hatası Bulunduğunda

Loglarda şunları arayın:

1. **Hata mesajı:** `java.lang.String cannot be cast to java.lang.Boolean`
2. **Stack trace:** Hangi native component'te hata oluştuğu
3. **Prop adı:** Hangi prop'un yanlış tipte olduğu
4. **Component:** Hangi React Native component'i sorunlu

Örnek:
```
E AndroidRuntime: java.lang.ClassCastException: java.lang.String cannot be cast to java.lang.Boolean
E AndroidRuntime:     at com.facebook.react.uimanager.ViewPropsManager.getProp(ViewPropsManager.java:123)
E AndroidRuntime:     at com.facebook.react.uimanager.BaseViewManager.setProperty(BaseViewManager.java:456)
E AndroidRuntime:     at com.facebook.react.uimanager.ViewManager.setProperties(ViewManager.java:123)
```

Bu log, `ViewPropsManager` içinde bir boolean prop'un string olarak geldiğini gösterir.

## 📞 Yardım

Logları aldıktan sonra:
1. `errors.txt` dosyasını kontrol edin
2. Boolean casting hatası içeren satırları bulun
3. Stack trace'i inceleyin
4. Hangi component/prop'un sorunlu olduğunu belirleyin

