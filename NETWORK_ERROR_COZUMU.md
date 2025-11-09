# 🔧 Network Error Çözümü

## 🎯 Sorun: "Axios Network Error" Hatası

Telefonda login yaparken network error alıyorsanız, backend API'sine bağlantı kurulamıyor demektir.

---

## ✅ Çözüm Adımları (Sırayla Yapın)

### 1️⃣ **Backend'i Yeniden Başlatın**

Backend'in tüm network interface'lerden erişilebilir olması için güncelledik.

```bash
# Backend'i durdurun (Ctrl+C) ve yeniden başlatın:
cd /Users/bariscandemirel/Desktop/tenis_app
npm run dev
```

**Başarılı başlatma görünümü:**
```
🚀 Server running on port 3000
📱 Mobile access: http://192.168.1.104:3000
💻 Local access: http://localhost:3000
```

---

### 2️⃣ **Frontend'i Yeniden Başlatın**

API URL'i güncelledik (192.168.1.104), frontend'in yeniden yüklenmesi gerekiyor.

```bash
# Frontend'i durdurun (Ctrl+C) ve yeniden başlatın:
cd /Users/bariscandemirel/Desktop/tenis_app/frontend
npx expo start --clear
```

---

### 3️⃣ **Expo Go'da Uygulamayı Yeniden Yükleyin**

Telefondaki Expo Go uygulamasında:
1. QR kodu tekrar tarayın VEYA
2. Uygulama açıksa → **Shake** (telefonu sallayın) → **Reload**

---

### 4️⃣ **WiFi Kontrolü**

**ÇOK ÖNEMLİ:** Telefon ve bilgisayar **aynı WiFi ağında** olmalı!

**Kontrol:**
- 📱 Telefon: Ayarlar > WiFi → Hangi ağdasınız?
- 💻 Bilgisayar: WiFi simgesi → Hangi ağdasınız?
- ✅ İkisi de **aynı olmalı**

**❌ Çalışmaz:**
- Telefon: "Misafir WiFi" → Bilgisayar: "Ana WiFi"
- Telefon: "Mobil Veri" → Bilgisayar: WiFi

---

### 5️⃣ **Backend Erişim Testi**

Backend'in telefon tarafından erişilebilir olduğunu test edin:

**Telefon tarayıcısında şu URL'i açın:**
```
http://192.168.1.104:3000/api/health
```

**Beklenen sonuç:**
```json
{
  "status": "OK",
  "timestamp": "2024-..."
}
```

**Eğer hata alırsanız:**
- ❌ Sayfa açılmıyor → Backend çalışmıyor veya firewall engelliyor
- ❌ Timeout → Farklı WiFi ağlarındasınız

---

## 🔍 IP Adresi Değişirse Ne Yapmalı?

Bilgisayarınızın IP adresi her WiFi değişiminde değişebilir.

### **Güncel IP'yi Öğrenin:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'
```

**Örnek çıktı:** `192.168.1.104`

### **Frontend'de IP'yi Güncelleyin:**

**Dosya:** `frontend/src/services/api.ts`

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YENİ_IP_ADRESİ:3000/api'  // Buraya yeni IP'yi yazın
  : 'http://YENİ_IP_ADRESİ:3000/api';
```

**Örnek:**
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.150:3000/api'  // IP değişti
  : 'http://192.168.1.150:3000/api';
```

Sonra frontend'i yeniden başlatın (`npx expo start --clear`)

---

## 🐛 Hala Çalışmıyor mu?

### **Firewall Kontrolü (Mac)**

Firewall backend portunu engelliyor olabilir:

```bash
# Firewall durumunu kontrol edin
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Eğer açıksa, Node.js'e izin verin:
# Sistem Ayarları > Güvenlik ve Gizlilik > Firewall > Firewall Seçenekleri
# "node" veya "npm" için "Gelen bağlantılara izin ver" ✅
```

### **Backend Log Kontrolü**

Backend terminalinde hata var mı kontrol edin:
```bash
# Backend terminalinde görmeli:
✅ Database connection successful
✅ Server running on port 3000

# Hata varsa:
❌ Database connection error
❌ Port already in use
```

### **Frontend Log Kontrolü**

Expo terminalde şunu görmeli:
```
› Metro waiting on exp://192.168.1.104:8081
› Scan the QR code above...
```

### **Console Log'ları**

Expo Go uygulamasında hata detaylarını görmek için:
1. Telefonu sallayın (shake)
2. "Show Dev Menu" → "Debug Remote JS"
3. Tarayıcıda console log'ları görün

---

## 📋 Hızlı Checklist

Sorun devam ediyorsa bu listeyi kontrol edin:

- [ ] Backend çalışıyor mu? (`npm run dev`)
- [ ] Frontend çalışıyor mu? (`npx expo start`)
- [ ] Aynı WiFi'de misiniz? (Telefon ve bilgisayar)
- [ ] Backend 0.0.0.0:3000 üzerinden dinliyor mu?
- [ ] Telefon tarayıcısında `http://192.168.1.104:3000/api/health` açılıyor mu?
- [ ] IP adresi doğru mu? (`ifconfig` ile kontrol)
- [ ] Firewall engellemiyor mu?
- [ ] Frontend cache temizlendi mi? (`--clear` flag)
- [ ] Expo Go güncel mi?

---

## 🎉 Başarılı Bağlantı Görünümü

Her şey doğru çalışırsa:

**Backend Terminal:**
```
🚀 Server running on port 3000
📱 Mobile access: http://192.168.1.104:3000
💻 Local access: http://localhost:3000
Database connection successful
```

**Frontend Terminal:**
```
› Metro waiting on exp://192.168.1.104:8081
› Scan the QR code above with Expo Go
```

**Telefon (Expo Go):**
- Login sayfası açılır
- Email/şifre girersiniz
- ✅ Başarıyla giriş yaparsınız

---

## 💡 İpucu: Production Build için

APK build alırken production backend URL'ini kullanın:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.104:3000/api'  // Development
  : 'https://your-production-api.com/api'; // Production
```

---

Sorununuz devam ediyorsa, hangi adımda takıldığınızı ve aldığınız hata mesajını paylaşın! 🚀

