# 🚨 Hata Loglama Rehberi

Bu rehber, gerçek telefonda görünen `java.lang.String cannot be cast to java.lang.Boolean` hatasını yakalamak ve loglamak için hazırlanmıştır.

## 📋 Eklenen Özellikler

### 1. **ErrorLogger Utility** (`src/utils/ErrorLogger.ts`)
- JavaScript hatalarını yakalar ve loglar
- Boolean casting hatalarını özel olarak tespit eder
- Hataları AsyncStorage'da saklar
- Native hataları da loglar

### 2. **ErrorBoundary Component** (`src/components/ErrorBoundary.tsx`)
- React component hatalarını yakalar
- Kullanıcıya hata ekranı gösterir
- Boolean casting hatalarını özel olarak vurgular

### 3. **Native Exception Handler** (`MainApplication.kt`)
- Android Java/Kotlin hatalarını yakalar
- Boolean casting hatalarını özel olarak loglar
- Detaylı stack trace bilgisi kaydeder

### 4. **Global Error Handler** (`App.tsx`, `index.ts`)
- Uygulama genelinde hataları yakalar
- Otomatik olarak ErrorLogger'a gönderir

## 🔧 Kullanım

### Gerçek Telefonda Hata Yakalama

#### Yöntem 1: Otomatik Script (Önerilen)

1. **Telefonunuzu USB ile bağlayın** ve USB debug modunu açın
2. **Script'i çalıştırın:**

```bash
cd /Users/bariscandemirel/Desktop/tenis_app/frontend
./get-device-logs.sh
```

3. **Uygulamayı telefonunuzda açın** ve hatayı tekrarlayın
4. Script otomatik olarak 30 saniye log kaydedecek
5. Loglar `device_logs_TIMESTAMP.txt` dosyasına kaydedilecek

#### Yöntem 2: Manuel Log Çekme

```bash
# Logları temizle
adb logcat -c

# Uygulamayı aç ve hatayı tekrarlayın, sonra:

# Boolean casting hatalarını ara
adb logcat -d | grep -i "Boolean\|cast"

# Tüm hataları göster
adb logcat -d | grep -E "(FATAL|AndroidRuntime|ERROR)"

# Uygulama özel logları
adb logcat -d | grep "TENIS_APP_ERROR"

# Logları dosyaya kaydet
adb logcat -d > device_logs.txt
```

### Logları Görüntüleme

#### Android Studio Logcat
1. Android Studio'yu açın
2. Logcat sekmesine gidin
3. Filter: `TENIS_APP_ERROR` veya `Boolean`
4. Logları gerçek zamanlı görüntüleyin

#### ADB Komut Satırı
```bash
# Canlı logları izle
adb logcat | grep -E "(TENIS_APP_ERROR|Boolean|FATAL)"

# Sadece hataları göster
adb logcat *:E

# React Native logları
adb logcat | grep ReactNativeJS
```

## 📊 Log Formatı

### JavaScript Hataları
```
🚨 ERROR LOGGED: {
  timestamp: "2024-01-01T12:00:00.000Z",
  error: "Error message",
  stack: "Error stack trace",
  componentStack: "Component stack",
  props: { ... },
  userInfo: {
    platform: "android",
    platformVersion: 33
  }
}
```

### Native Hataları (Java/Kotlin)
```
TENIS_APP_ERROR: 🚨 UNCAUGHT EXCEPTION:
TENIS_APP_ERROR: Thread: main
TENIS_APP_ERROR: Message: java.lang.String cannot be cast to java.lang.Boolean
TENIS_APP_ERROR: ⚠️ BOOLEAN CASTING ERROR DETECTED!
TENIS_APP_ERROR: Error Details:
TENIS_APP_ERROR:   - Message: ...
TENIS_APP_ERROR:   - Exception Type: ...
TENIS_APP_ERROR:   - Full Stack Trace: ...
```

## 🔍 Hata Analizi

### Boolean Casting Hatası Yakalandığında

1. **Log dosyasını kontrol edin:**
   - `TENIS_APP_ERROR` tag'li loglar
   - Stack trace'de boolean/cast geçen yerler
   - Component stack'te hangi component'te hata oluştuğu

2. **Stack trace'i inceleyin:**
   - Hatanın oluştuğu dosya ve satır numarası
   - Hangi prop'un yanlış tipte olduğu
   - Hangi native component'e boolean yerine string gönderildiği

3. **Kodda düzeltme yapın:**
   - Boolean prop'ları `Boolean()` ile wrap edin
   - API'den gelen değerleri normalize edin
   - Component prop'larını kontrol edin

## 📱 Test Etme

### Release Build ile Test

```bash
# Release build oluştur
cd frontend/android
./gradlew assembleRelease

# APK'yı telefona yükle
adb install -r app/build/outputs/apk/release/app-release.apk

# Logları izle
adb logcat -c
adb logcat | grep -E "(TENIS_APP_ERROR|Boolean)"
```

### Debug Build ile Test

```bash
# Debug build ile çalıştır
cd frontend
npm run android

# Logları izle
adb logcat | grep ReactNativeJS
```

## 💡 İpuçları

1. **Logları düzenli olarak temizleyin:**
   ```bash
   adb logcat -c
   ```

2. **Önemli logları filtreleyin:**
   ```bash
   adb logcat -d | grep -E "(TENIS_APP_ERROR|Boolean|FATAL)" > important_logs.txt
   ```

3. **Log dosyalarını yedekleyin:**
   - Önemli hataları bulduğunuzda log dosyasını saklayın
   - Hata analizi için gerekli olabilir

4. **ErrorLogger'dan logları çekmek:**
   ```javascript
   import { errorLogger } from './src/utils/ErrorLogger';
   
   // Tüm logları al
   const logs = await errorLogger.getStoredLogs();
   console.log('Stored errors:', logs);
   
   // Logları string olarak al
   const logsString = await errorLogger.getLogsAsString();
   console.log(logsString);
   ```

## 🐛 Sorun Giderme

### Loglar görünmüyorsa:
1. USB debug modunun açık olduğundan emin olun
2. `adb devices` ile cihazın bağlı olduğunu kontrol edin
3. Uygulamanın çalıştığından emin olun

### Script çalışmıyorsa:
1. Script'in executable olduğundan emin olun: `chmod +x get-device-logs.sh`
2. ADB'nin PATH'de olduğundan emin olun
3. Cihazın bağlı olduğunu kontrol edin

## 📞 Destek

Hata loglarını paylaşırken:
- `device_logs_TIMESTAMP.txt` dosyasını paylaşın
- Hatanın ne zaman oluştuğunu belirtin
- Hangi işlem sırasında oluştuğunu açıklayın

