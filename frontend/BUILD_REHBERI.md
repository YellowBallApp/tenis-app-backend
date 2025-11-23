# Android APK Build Alma Rehberi

## Yöntem 1: EAS Build (Önerilen - Cloud Build)

### 1. EAS CLI ile Giriş Yapın

```bash
cd frontend
eas login
```

### 2. EAS Build Yapılandırması

`eas.json` dosyası zaten oluşturuldu. Şimdi build alabilirsiniz.

### 3. Preview Build (APK - Test İçin)

```bash
eas build --platform android --profile preview
```

Bu komut:
- APK dosyası oluşturur
- Expo'nun cloud servisinde build yapar
- Build tamamlandığında indirme linki verir

### 4. Production Build (APK - Yayın İçin)

```bash
eas build --platform android --profile production
```

## Yöntem 2: Lokal Build (Kendi Bilgisayarınızda)

### 1. Android Build Klasörünü Temizleyin

```bash
cd frontend/android
./gradlew clean
```

### 2. APK Build Alın

```bash
cd frontend
npx expo run:android --variant release
```

Veya direkt Gradle ile:

```bash
cd frontend/android
./gradlew assembleRelease
```

APK dosyası şu konumda olacak:
```
frontend/android/app/build/outputs/apk/release/app-release.apk
```

## Önemli: Production Build İçin API URL Ayarlama

Production build için backend URL'inizi ayarlamanız gerekiyor:

### Seçenek 1: Environment Variable Kullan

`.env` dosyası oluşturun:
```bash
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

### Seçenek 2: Doğrudan Kodda Ayarlayın

`frontend/src/services/api.ts` dosyasında:
```typescript
// Production için backend URL'inizi buraya yazın
return 'https://your-backend-url.com/api';
```

### Seçenek 3: Ngrok URL Kullan (Geçici)

Eğer ngrok kullanıyorsanız:
```typescript
const NGROK_URL = 'https://your-ngrok-url.ngrok-free.app';
```

## Build Öncesi Kontrol Listesi

- [ ] Backend URL'i production için ayarlandı mı?
- [ ] `app.json` dosyasındaki versiyon numarası güncel mi?
- [ ] Icon ve splash screen dosyaları mevcut mu?
- [ ] Android package name doğru mu? (`com.tenisapp.frontend`)

## Build Sonrası

APK dosyasını telefonunuza yükleyip test edin:
```bash
adb install app-release.apk
```

Veya APK dosyasını telefonunuza kopyalayıp manuel olarak yükleyin.

## Notlar

- **EAS Build**: Ücretsiz plan sınırlı build sayısına sahip
- **Lokal Build**: Daha hızlı ama bilgisayarınızda Android SDK gerektirir
- **Production URL**: Backend'inizi cloud'a deploy etmeniz önerilir (Railway, Render, Heroku)

