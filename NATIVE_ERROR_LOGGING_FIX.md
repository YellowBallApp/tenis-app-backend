# 🔧 Native Error Logging Düzeltmesi

## ✅ Yapılan Değişiklikler

### 1. Native Exception Handler Eklendi

**Dosya:** `frontend/android/app/src/main/java/com/tenisapp/frontend/MainApplication.kt`

Native (Java/Kotlin) hataları yakalamak için global exception handler eklendi:

```kotlin
private fun setupGlobalExceptionHandler() {
  // Tüm uncaught exception'ları yakalar
  // Boolean casting hatalarını özel olarak tespit eder
  // Detaylı log kaydeder (TENIS_APP_ERROR tag'i ile)
}
```

**Özellikler:**
- ✅ Tüm uncaught exception'ları yakalar
- ✅ Boolean casting hatalarını özel olarak tespit eder
- ✅ Detaylı stack trace loglar
- ✅ `TENIS_APP_ERROR` tag'i ile özel loglar

### 2. Basit Log Yakalama Script'i

**Dosya:** `frontend/hata-logla.sh`

Canlı log izleme için basit bir script:

```bash
./hata-logla.sh
```

Bu script:
- ✅ Logları temizler
- ✅ Canlı olarak hataları gösterir
- ✅ Boolean casting hatalarını vurgular
- ✅ 60 saniye kayıt yapar

### 3. Gelişmiş Log Yakalama Script'i

**Dosya:** `frontend/capture-native-error.sh`

Daha detaylı log yakalama:

```bash
./capture-native-error.sh
```

## 📋 Kullanım

### Yöntem 1: Basit Canlı Log İzleme

```bash
cd frontend
./hata-logla.sh
```

Sonra telefonunuzda uygulamayı açın - hatalar canlı olarak görünecek!

### Yöntem 2: Gelişmiş Log Yakalama

```bash
cd frontend
./capture-native-error.sh
```

Bu script:
- 60 saniye log kaydeder
- Dosyaya yazar
- Boolean casting hatalarını özel olarak gösterir

### Yöntem 3: Manuel ADB Logcat

```bash
# Logları temizle
adb logcat -c

# Canlı izleme (Boolean hatalarını filtrele)
adb logcat | grep -i -E "(Boolean|cast|AndroidRuntime|FATAL|TENIS_APP_ERROR)"
```

## 🎯 Beklenen Log Formatı

Native exception handler şu formatta log kaydeder:

```
TENIS_APP_ERROR: 🚨 UNCAUGHT EXCEPTION:
TENIS_APP_ERROR: Thread: main
TENIS_APP_ERROR: Message: java.lang.String cannot be cast to java.lang.Boolean
TENIS_APP_ERROR: ⚠️ BOOLEAN CASTING ERROR DETECTED!
TENIS_APP_ERROR: Error Details:
TENIS_APP_ERROR:   - Message: ...
TENIS_APP_ERROR:   - Exception Type: ...
TENIS_APP_ERROR:   - Full Stack Trace:
TENIS_APP_ERROR:     at com.facebook.react.uimanager...
```

## 📱 Test Etme

1. ✅ Yeni build alın (native handler için)
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

2. ✅ APK'yı yükleyin
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

3. ✅ Log script'ini çalıştırın
   ```bash
   cd ../frontend
   ./hata-logla.sh
   ```

4. ✅ Telefonda uygulamayı açın

5. ✅ Hataları gözlemleyin

## 💡 İpuçları

1. **Logları önce temizleyin:**
   ```bash
   adb logcat -c
   ```

2. **Buffer'ı artırın (daha fazla log):**
   ```bash
   adb logcat -G 16M
   ```

3. **Sadece hataları görmek için:**
   ```bash
   adb logcat *:E
   ```

4. **Uygulama özel loglar:**
   ```bash
   adb logcat | grep TENIS_APP_ERROR
   ```

## 🔍 Sorun Devam Ederse

Eğer hala log göremiyorsanız:

1. **Cihaz bağlantısını kontrol edin:**
   ```bash
   adb devices
   ```

2. **USB Debugging açık mı?**
   - Telefon Ayarları > Geliştirici Seçenekleri > USB Debugging

3. **Build'i yenileyin:**
   - Native handler için yeni build gerekli

4. **Logcat buffer'ı kontrol edin:**
   ```bash
   adb logcat -g
   ```

