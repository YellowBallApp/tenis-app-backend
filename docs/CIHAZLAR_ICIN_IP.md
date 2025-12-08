# Çoklu Cihaz Bağlantısı İçin IP Ayarları

## Backend IP Adresi

Backend şu anda şu IP adresinde çalışıyor:
- **IP:** `10.209.250.139`
- **Port:** `3000`
- **Full URL:** `http://10.209.250.139:3000/api`

## Frontend API URL Güncelleme

Eğer IP adresi değişirse, `frontend/src/services/api.ts` dosyasındaki IP'yi güncelleyin:

```typescript
// api.ts dosyasında
return 'http://10.209.250.139:3000/api'; // Buraya güncel IP'yi yazın
```

## IP Adresini Bulma

IP adresinizi bulmak için:

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

## Çoklu Cihaz Bağlantısı

✅ Backend artık **tüm local network IP'lerine** izin veriyor:
- `192.168.x.x` (ev/office ağları)
- `10.x.x.x` (kurumsal ağlar)
- `172.16-31.x.x` (özel ağlar)

✅ Backend `0.0.0.0` adresinde dinliyor, yani tüm network interface'lerinden erişilebilir.

## Arkadaşınızın Telefonundan Bağlanma

1. **Aynı WiFi ağında olduğunuzdan emin olun**
2. **Backend'in çalıştığından emin olun:**
   ```bash
   cd /Users/bariscandemirel/Desktop/tenis_app
   npm run start:backend
   ```
3. **Frontend'de IP'yi güncelleyin** (eğer değiştiyse)
4. **Expo Go'yu başlatın:**
   ```bash
   cd frontend
   npx expo start
   ```
5. **QR kodu paylaşın** - Arkadaşınız kendi telefonundan QR kodu tarayabilir

## Notlar

- Her iki telefon da **aynı WiFi ağında** olmalı
- Backend'in **firewall tarafından engellenmediğinden** emin olun
- IP adresi değişirse, hem backend hem frontend'de güncelleme yapın

