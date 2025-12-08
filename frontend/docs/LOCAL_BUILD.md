# Lokal Android APK Build Rehberi

## Build Komutları

### Release APK Build (Production)

```bash
cd frontend/android
./gradlew assembleRelease
```

APK dosyası şu konumda oluşur:
```
frontend/android/app/build/outputs/apk/release/app-release.apk
```

### Debug APK Build (Test İçin)

```bash
cd frontend/android
./gradlew assembleDebug
```

APK dosyası şu konumda oluşur:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## Build Öncesi Kontrol Listesi

- [ ] Backend URL'i production için ayarlandı mı? (`frontend/src/services/api.ts`)
- [ ] `app.json` dosyasındaki versiyon numarası güncel mi?
- [ ] Icon ve splash screen dosyaları mevcut mu?

## Build Sonrası

### APK'yı Telefona Yükleme

**Yöntem 1: ADB ile (USB bağlantısı)**
```bash
adb install frontend/android/app/build/outputs/apk/release/app-release.apk
```

**Yöntem 2: Manuel Yükleme**
1. APK dosyasını telefonunuza kopyalayın (USB, email, cloud storage)
2. Telefonda "Bilinmeyen kaynaklardan uygulama yükleme" iznini açın
3. APK dosyasına dokunarak yükleyin

## Build Hızlandırma

Eğer build çok yavaşsa:

```bash
# Gradle daemon'ı durdur
cd frontend/android
./gradlew --stop

# Cache'i temizle
./gradlew clean

# Yeniden build
./gradlew assembleRelease
```

## Sorun Giderme

### Build Hatası Alırsanız

1. **Gradle cache'i temizleyin:**
   ```bash
   cd frontend/android
   ./gradlew clean
   rm -rf .gradle
   ```

2. **Node modules'ü yeniden yükleyin:**
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

3. **Prebuild'i yeniden çalıştırın:**
   ```bash
   cd frontend
   npx expo prebuild --clean
   ```

## APK Boyutu Optimizasyonu

APK boyutunu küçültmek için:

1. **ProGuard/R8 kullanın** (zaten aktif)
2. **Gereksiz asset'leri kaldırın**
3. **Split APK oluşturun** (farklı mimariler için)

```bash
# Split APK (her mimari için ayrı APK)
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

