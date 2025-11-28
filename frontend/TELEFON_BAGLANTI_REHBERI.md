# 📱 Telefon Bağlantı ve Uygulama Açma Rehberi

## 🚨 Sorun: Telefonda Uygulama Açılmıyor

### 1️⃣ USB Bağlantısını Kontrol Edin

#### Adım 1: USB Debug Modunu Açın

1. **Telefonunuzda:**
   - Ayarlar → Telefon Hakkında
   - **Yapı Numarası**'na 7 kez dokunun (Geliştirici seçeneklerini açar)
   - Ayarlar → Geliştirici Seçenekleri
   - **USB Debugging**'i açın
   - **USB ile yükleme**'yi açın (varsa)

#### Adım 2: Bilgisayarınızda Kontrol

```bash
# Telefon bağlantısını kontrol et
adb devices
```

Eğer cihaz görünmüyorsa:

```bash
# ADB sunucusunu yeniden başlat
adb kill-server
adb start-server
adb devices
```

#### Adım 3: USB Bağlantı Türünü Değiştirin

Telefonunuzda USB bağlantısı bildirimine dokunun ve:
- **Dosya Aktarımı** veya **MTP** seçin
- **USB Debugging** izni verildiğinden emin olun

### 2️⃣ WiFi Üzerinden ADB (Alternatif)

Eğer USB çalışmıyorsa WiFi üzerinden bağlanın:

```bash
# USB ile bağlan (sadece bir kez gerekli)
adb devices

# WiFi IP adresini öğren
adb shell ip addr show wlan0 | grep "inet " | awk '{print $2}' | cut -d/ -f1

# WiFi üzerinden bağlan (IP adresini değiştirin)
adb tcpip 5555
adb connect TELEFON_IP_ADRESI:5555

# Bağlantıyı kontrol et
adb devices
```

### 3️⃣ Uygulamayı Telefona Yükleme

#### Yöntem 1: ADB ile Yükleme (Önerilen)

```bash
cd /Users/bariscandemirel/Desktop/tenis_app/frontend

# Debug APK oluştur
cd android
./gradlew assembleDebug

# APK'yı telefona yükle
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

#### Yöntem 2: Expo Go ile Çalıştırma

```bash
# Telefon ve bilgisayar aynı WiFi'de olmalı
cd frontend
npm start

# QR kodu Expo Go ile tara
```

#### Yöntem 3: Release APK Yükleme

```bash
cd /Users/bariscandemirel/Desktop/tenis_app/frontend/android

# Release APK oluştur
./gradlew assembleRelease

# APK dosyasını telefona kopyalayın
# Telefonda: Ayarlar → Güvenlik → Bilinmeyen Kaynaklardan Uygulama Yükleme'yi açın
# APK dosyasına dokunarak yükleyin
```

### 4️⃣ Uygulamayı Başlatma

#### Manuel Başlatma

```bash
# Uygulamayı başlat
adb shell am start -n com.tenisapp.frontend/.MainActivity

# Veya
adb shell monkey -p com.tenisapp.frontend -c android.intent.category.LAUNCHER 1
```

#### Logları İzleme (Uygulama Açılırken)

```bash
# Logları temizle ve izle
adb logcat -c
adb logcat | grep -E "(com.tenisapp.frontend|AndroidRuntime|FATAL)"
```

### 5️⃣ Uygulama Açılmıyorsa - Sorun Giderme

#### Sorun 1: "Uygulama yüklü değil"

```bash
# Uygulamanın yüklü olup olmadığını kontrol et
adb shell pm list packages | grep tenisapp

# Yüklü değilse yükle
adb install app-debug.apk
```

#### Sorun 2: "Uygulama açılıp kapanıyor"

```bash
# Crash loglarını kontrol et
adb logcat -c
adb logcat | grep -E "(FATAL|AndroidRuntime)"

# Uygulamayı açmaya çalışın, logları görün
```

#### Sorun 3: "Backend'e bağlanamıyor"

Telefon ve bilgisayar **aynı WiFi ağında** olmalı!

```bash
# Bilgisayarınızın IP adresini öğrenin
ifconfig | grep "inet " | grep -v 127.0.0.1

# frontend/src/services/api.ts dosyasında LOCAL_IP'i güncelleyin
# Örnek: const LOCAL_IP = '192.168.1.100';
```

#### Sorun 4: "Permission hatası"

```bash
# Uygulama izinlerini kontrol et
adb shell dumpsys package com.tenisapp.frontend | grep permission

# Gerekli izinleri manuel ver
adb shell pm grant com.tenisapp.frontend android.permission.INTERNET
adb shell pm grant com.tenisapp.frontend android.permission.ACCESS_NETWORK_STATE
```

### 6️⃣ Hata Loglarını Alma

#### Uygulama açılırken hata alıyorsanız:

```bash
# 1. Logları temizle
adb logcat -c

# 2. Uygulamayı açın (telefonunuzda)

# 3. Hataları görüntüle
adb logcat -d | grep -E "(FATAL|AndroidRuntime|Boolean|TENIS_APP_ERROR)" > error_logs.txt

# 4. Logları kontrol et
cat error_logs.txt
```

### 7️⃣ Hızlı Test Komutları

```bash
# Tüm kontrolleri bir arada yap
echo "📱 Cihaz Kontrolü:"
adb devices

echo ""
echo "📦 Uygulama Kontrolü:"
adb shell pm list packages | grep tenisapp

echo ""
echo "🚀 Uygulamayı Başlat:"
adb shell am start -n com.tenisapp.frontend/.MainActivity

echo ""
echo "📝 Son Hataları Göster:"
adb logcat -d | grep -E "(FATAL|AndroidRuntime)" | tail -20
```

### 8️⃣ Alternatif: APK'yı Telefona Kopyalayın

USB çalışmıyorsa:

1. APK dosyasını bulun:
   ```
   frontend/android/app/build/outputs/apk/debug/app-debug.apk
   ```

2. APK'yı telefonunuza kopyalayın:
   - Email ile gönderin
   - Cloud storage (Google Drive, Dropbox) ile paylaşın
   - AirDrop (Mac) kullanın

3. Telefonda:
   - Ayarlar → Güvenlik → Bilinmeyen Kaynaklardan Uygulama Yükleme'yi açın
   - APK dosyasına dokunarak yükleyin

## 💡 Önemli Notlar

1. **USB Debugging** her zaman açık olmalı
2. Telefon ve bilgisayar **aynı WiFi'de** olmalı
3. **Backend çalışıyor olmalı** (localhost:3000)
4. Release build'de test ederken backend IP'sini kontrol edin

## 🐛 Hala Çalışmıyorsa

1. Telefonu yeniden başlatın
2. USB kablosunu değiştirin
3. Farklı bir USB portu deneyin
4. Bilgisayarı yeniden başlatın
5. Android Studio'yu kullanarak bağlantıyı test edin

