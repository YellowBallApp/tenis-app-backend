# 🔧 Release Build ile Emülatörde Test Etme

Bu rehber, uygulamayı **release build** (production) modunda emülatörde çalıştırmak için hazırlanmıştır. Bu sayede gerçek telefon davranışına yakın test yapabilirsiniz.

## 🎯 Neden Release Build?

- ✅ **Gerçek telefon davranışı**: Release build, gerçek telefonlarda çalışan build ile aynı özelliklere sahiptir
- ✅ **Production optimizasyonları**: Code minification, resource shrinking aktif
- ✅ **Hata tespiti**: Gerçek telefonda görünen hataları emülatörde de görebilirsiniz
- ✅ **Performance test**: Gerçek performansı görebilirsiniz

## 📋 Ön Gereksinimler

1. **Android Studio** yüklü olmalı
2. **Android Emülatör** açık olmalı
3. **Backend** çalışıyor olmalı (localhost:3000)

## 🚀 Hızlı Başlangıç

### Yöntem 1: Otomatik Script (Önerilen)

```bash
cd /Users/bariscandemirel/Desktop/tenis_app
./frontend/run-release-emulator.sh
```

Bu script:
1. Build klasörünü temizler
2. Release build oluşturur
3. APK'yı emülatöre yükler
4. Uygulamayı başlatır

### Yöntem 2: Manuel Adımlar

#### 1. Metro Bundler'ı Durdurun (varsa)

```bash
lsof -ti:8081 | xargs kill -9
```

#### 2. Build Klasörünü Temizleyin

```bash
cd frontend/android
./gradlew clean
```

#### 3. Release Build Oluşturun

```bash
cd frontend
npx expo run:android --variant release
```

veya direkt Gradle ile:

```bash
cd frontend/android
./gradlew assembleRelease
```

#### 4. APK'yı Emülatöre Yükleyin

Eğer Gradle ile build aldıysanız:

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

veya Expo ile:

```bash
cd frontend
npx expo run:android --variant release --device
```

## 🔍 Logları Görüntüleme

Release build'de logları görmek için:

```bash
# Tüm loglar
adb logcat

# Sadece React Native logları
adb logcat | grep ReactNativeJS

# Sadece hatalar
adb logcat *:E

# Java hataları (boolean casting gibi)
adb logcat | grep -i "java.lang"
```

## ⚙️ Build Ayarları

Release build ayarları `frontend/android/gradle.properties` dosyasında:

```properties
# Minification aktif (kod sıkıştırma)
android.enableMinifyInReleaseBuilds=true

# Resource shrinking aktif (kullanılmayan kaynakları kaldır)
android.enableShrinkResourcesInReleaseBuilds=true

# PNG optimizasyonu
android.enablePngCrunchInReleaseBuilds=true
```

Bu ayarlar production build'de otomatik aktif olur.

## 🐛 Hata Ayıklama

### Eğer Build Hata Verirse

1. **Cache temizleyin:**
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

3. **Expo prebuild'i yeniden çalıştırın:**
   ```bash
   cd frontend
   npx expo prebuild --clean --platform android
   ```

### Emülatör Bağlantı Sorunu

Emülatörün açık olduğundan emin olun:

```bash
# Emülatörleri listele
adb devices

# Eğer emülatör görünmüyorsa
emulator -avd <AVD_NAME> &
```

## 📝 Notlar

- Release build, debug build'den **daha yavaş** derlenir (optimizasyonlar nedeniyle)
- İlk build **10-15 dakika** sürebilir
- Sonraki build'ler daha hızlı olur (incremental build)
- Release build'de **hot reload çalışmaz**
- Her değişiklik için **yeniden build** gerekir

## 🔄 Debug Build'e Geri Dönmek

Normal debug build için:

```bash
cd frontend
npx expo run:android
```

veya

```bash
cd frontend
npm start
# Sonra 'a' tuşuna basın
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Boolean Casting Hatası Testi

Gerçek telefonda görünen `java.lang.String cannot be cast to java.lang.Boolean` hatasını emülatörde test etmek için release build kullanın.

### Senaryo 2: Performance Testi

Uygulamanın gerçek performansını görmek için release build kullanın.

### Senaryo 3: Production Hazırlık

Production'a göndermeden önce release build ile test edin.

