# Tenis App - React Native Frontend

Bu proje, Tenis App'in React Native + Expo ile geliştirilmiş mobil uygulamasıdır.

## Teknolojiler

- **React Native** + **Expo**
- **React Navigation** (Stack Navigator)
- **Axios** (Backend API çağrıları için)
- **AsyncStorage** (JWT token saklamak için)
- **React Native Paper** (Modern UI bileşenleri)

## Kurulum

1. Gerekli paketleri yükleyin:
```bash
npm install
```

2. Uygulamayı çalıştırın:
```bash
# iOS Simulator için
npm run ios

# Android Emulator için
npm run android

# Web için
npm run web
```

## Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
├── navigation/          # Navigation yapısı
├── screens/            # Ekran bileşenleri
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # API servisleri
├── types/              # TypeScript type tanımları
└── utils/              # Yardımcı fonksiyonlar
```

## Ekranlar

### 1. Login Ekranı
- Email ve Password inputları
- Backend API'ye login isteği (`POST /api/auth/login`)
- Başarılı girişte JWT token AsyncStorage'a kaydedilir
- Profile ekranına yönlendirme

### 2. Register Ekranı
- Name, Email, Password inputları
- Backend API'ye kayıt isteği (`POST /api/auth/register`)
- Başarılı kayıt sonrası Profile ekranına yönlendirme

### 3. Profile Ekranı
- Backend'den kullanıcı bilgileri (`GET /api/user/profile`)
- Kullanıcı adı ve email görüntüleme
- Logout butonu ile token temizleme ve Login ekranına yönlendirme

## API Endpoints

- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/refresh-token` - Token yenileme
- `POST /api/auth/logout` - Çıkış yapma
- `GET /api/user/profile` - Kullanıcı profili

## Özellikler

- **JWT Token Yönetimi**: Access ve Refresh token'lar ile güvenli kimlik doğrulama
- **Otomatik Token Yenileme**: Access token süresi dolduğunda otomatik yenileme
- **Hata Yönetimi**: Kapsamlı hata yakalama ve kullanıcı dostu mesajlar
- **Modern UI**: React Native Paper ile güzel ve tutarlı arayüz
- **TypeScript**: Tip güvenliği ve daha iyi geliştirici deneyimi

## Geliştirme

### Backend Bağlantısı
Backend'in çalıştığından ve `http://localhost:3000` adresinde erişilebilir olduğundan emin olun.

### Environment Variables
Gerekirse `.env` dosyası oluşturarak API URL'ini yapılandırabilirsiniz.

## Lisans

MIT
