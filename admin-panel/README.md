# Admin Panel

## Network Error Çözümü

Eğer "Network Error" alıyorsanız:

1. **Backend'in çalıştığından emin olun:**
   ```powershell
   cd ..
   npm run dev
   ```
   Backend'in `http://localhost:3000` adresinde çalıştığını kontrol edin.

2. **API URL'i kontrol edin:**
   `.env` dosyasında şu satır olmalı:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Tarayıcı konsolunu kontrol edin:**
   - F12 tuşuna basın
   - Console sekmesine gidin
   - Hata mesajlarını kontrol edin

4. **Backend'i yeniden başlatın:**
   - Backend sunucusunu durdurun (Ctrl+C)
   - Tekrar başlatın: `npm run dev`

## Çalıştırma

```powershell
cd admin-panel
npm install
npm run dev
```

## Giriş Bilgileri

- **Email:** admin@example.com
- **Şifre:** password123
