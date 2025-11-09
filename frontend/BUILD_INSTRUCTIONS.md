# 📱 Tenis App - Build ve Test Talimatları

## 🎯 Hızlı Test (Önerilen - 5 dakika)

### 1️⃣ Expo Go ile Test

**Telefonunuzda:**
1. App Store (iOS) veya Play Store (Android)'dan **Expo Go** uygulamasını indirin
2. Uygulamayı açın ve hazır olun

**Bilgisayarınızda:**

```bash
# Backend'i başlatın (Terminal 1)
cd /Users/bariscandemirel/Desktop/tenis_app
npm start

# Frontend'i başlatın (Terminal 2)
cd /Users/bariscandemirel/Desktop/tenis_app/frontend
npm start
```

3. Terminal'de çıkan **QR kodu** Expo Go uygulaması ile tarayın
4. Uygulama telefonunuzda açılacak! 🎉

**⚠️ Önemli:** Bilgisayar ve telefon **aynı WiFi ağında** olmalı!

---

## 📦 APK Build Alma (Production)

### Yöntem 1: EAS Build (Bulut - Önerilen)

**Gereksinimler:**
- Expo hesabı (ücretsiz): https://expo.dev/signup

**Adımlar:**

```bash
cd /Users/bariscandemirel/Desktop/tenis_app/frontend

# 1. Expo'ya giriş yapın
eas login

# 2. Build konfigürasyonu oluşturun
eas build:configure

# 3. Android APK build'i başlatın
eas build --platform android --profile preview

# 4. iOS build'i için (Apple Developer hesabı gerekli)
eas build --platform ios --profile preview
```

**Build süresi:** ~10-20 dakika (bulutta yapılır)

Build tamamlandığında size bir **download linki** verilecek, APK'yı telefonunuza indirip kurabilirsiniz.

---

### Yöntem 2: Yerel Android Build (Gradlew)

**Gereksinimler:**
- Android Studio
- JDK 17
- Android SDK

```bash
cd /Users/bariscandemirel/Desktop/tenis_app/frontend

# 1. Expo native dizinlerini oluşturun
npx expo prebuild --platform android

# 2. Android build'i oluşturun
cd android
./gradlew assembleRelease

# 3. APK konumu:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 App.json Konfigürasyonu

Eğer uygulama adı, ikon veya splash screen değiştirmek isterseniz:

```json
{
  "expo": {
    "name": "Tenis Kulübü",
    "slug": "tenis-app",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "backgroundColor": "#4CAF50"
    }
  }
}
```

---

## 📝 Notlar

### Backend URL Ayarı
Production build için backend URL'ini güncelleyin:

**frontend/src/services/api.ts:**
```typescript
const API_URL = 'https://your-production-backend.com/api';
```

### Geliştirme vs Production
- **Geliştirme:** Expo Go kullanın (hızlı test)
- **Production:** EAS Build ile APK/IPA alın (gerçek dağıtım)

---

## 🆘 Sorun Giderme

### QR Kod Çalışmıyor
```bash
# Tunnel modunda başlatın
npx expo start --tunnel
```

### Android APK yüklenmiyor
- Bilinmeyen kaynaklardan yüklemeye izin verin
- Ayarlar > Güvenlik > Bilinmeyen Kaynaklar ✅

### iOS build hatası
- Apple Developer hesabı gereklidir ($99/yıl)
- Sertifika ve provisioning profile ayarları

---

## 📚 Ek Kaynaklar

- [Expo Build Dokümantasyonu](https://docs.expo.dev/build/introduction/)
- [EAS Build Fiyatlandırma](https://expo.dev/pricing) - Aylık 1 ücretsiz build
- [Android Studio Kurulum](https://developer.android.com/studio)

