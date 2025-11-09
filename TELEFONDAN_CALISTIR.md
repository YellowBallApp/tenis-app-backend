# 📱 Tenis App'i Telefonunuzda Çalıştırma Rehberi

## 🎯 Hızlı Başlangıç (5 Dakika)

### Adım 1: Expo Go Uygulamasını İndirin

**Telefonunuzda:**
- **iOS**: [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Play Store - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

### Adım 2: Backend'i Başlatın

**Terminal 1** açın ve şunu çalıştırın:

```bash
cd /Users/bariscandemirel/Desktop/tenis_app
./start-backend.sh
```

**VEYA**

```bash
cd /Users/bariscandemirel/Desktop/tenis_app
npm run dev
```

✅ **Backend çalışıyor** mesajını görünce devam edin.

---

### Adım 3: Frontend'i Başlatın

**Terminal 2** (yeni terminal) açın ve şunu çalıştırın:

```bash
cd /Users/bariscandemirel/Desktop/tenis_app/frontend
./start-dev.sh
```

**VEYA**

```bash
cd /Users/bariscandemirel/Desktop/tenis_app/frontend
npx expo start
```

⏳ Birkaç saniye bekleyin...

---

### Adım 4: QR Kodu Tarayın

Terminal'de **QR kod** görünecek. Şöyle bir şey:

```
› Metro waiting on exp://192.168.1.X:8081
› Scan the QR code above with Expo Go (Android) or...
  
  ▄▄▄▄▄▄▄  ▄  ▄▄▄ ▄▄▄▄▄▄▄
  █ ▄▄▄ █ ▀█▄ ▀▀  █ ▄▄▄ █
  █ ███ █ ▄█ ▀▀█  █ ███ █
  █▄▄▄▄▄█ █ █ █ ▄ █▄▄▄▄▄█
  ...
```

**Telefonunuzda:**
1. **Expo Go** uygulamasını açın
2. **"Scan QR Code"** veya kamera ikonuna tıklayın
3. QR kodu tarayın
4. **Uygulama açılacak!** 🎉

---

## ⚠️ Önemli Notlar

### WiFi Bağlantısı
- ✅ Telefon ve bilgisayar **aynı WiFi ağında** olmalı
- ❌ Telefon mobil veri, bilgisayar WiFi → ÇALIŞMAZ
- ❌ Farklı WiFi ağları → ÇALIŞMAZ

### Backend Çalışıyor Mu?
Terminal'de şunu görmelisiniz:
```
🚀 Server is running on http://localhost:3000
```

---

## 🐛 Sorun Giderme

### QR Kod Görünmüyor
```bash
# Tunnel modu ile deneyin (daha yavaş ama daha kararlı)
cd /Users/bariscandemirel/Desktop/tenis_app/frontend
npx expo start --tunnel
```

### "Unable to connect to Metro" Hatası
1. Backend'in çalıştığından emin olun
2. Terminal'lerde hata var mı kontrol edin
3. Expo'yu yeniden başlatın:
```bash
# Ctrl+C ile durdurun, sonra tekrar:
npx expo start --clear
```

### "Network Error" / API Çağrıları Başarısız
```bash
# Frontend'de API URL'ini kontrol edin
# frontend/src/services/api.ts dosyasında:
# const API_URL = 'http://YOUR_COMPUTER_IP:3000/api';
```

Bilgisayarınızın IP adresini öğrenmek için:
```bash
# Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Sonuç: 192.168.1.X gibi bir IP olmalı
```

---

## 🎨 Karanlık Mod Testi

Uygulamada karanlık mod aktif! Test etmek için:
1. Profil sayfasına gidin
2. "Karanlık Mod" switch'ini açın/kapatın
3. Tüm sayfaların temasının değiştiğini görün

---

## 📦 Gerçek APK Build İçin

Detaylı talimatlar için:
```bash
cat /Users/bariscandemirel/Desktop/tenis_app/frontend/BUILD_INSTRUCTIONS.md
```

**Kısa özet:**
```bash
# 1. Expo'ya giriş yapın
eas login

# 2. Build başlatın
cd /Users/bariscandemirel/Desktop/tenis_app/frontend
eas build --platform android --profile preview

# 3. ~15 dakika bekleyin
# 4. APK linkini alın ve telefonunuza indirin
```

---

## 🆘 Yardım

Bir sorun mu yaşıyorsunuz?

1. ✅ Backend çalışıyor mu? → Terminal 1'i kontrol edin
2. ✅ Frontend çalışıyor mu? → Terminal 2'yi kontrol edin
3. ✅ Aynı WiFi'de misiniz? → Ayarlar > WiFi kontrol edin
4. ✅ Expo Go güncel mi? → App Store/Play Store'da güncelleyin

---

## 🎉 Başarılı! Artık telefonunuzda test edebilirsiniz!

Keyifli kullanımlar! 🎾

