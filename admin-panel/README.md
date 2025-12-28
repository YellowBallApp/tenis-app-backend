# Admin Panel

## Network Error Çözümü

Eğer "Network Error" alıyorsanız:

1. **Backend'in çalıştığından emin olun:**
   ```powershell
   cd ..
   npm run dev
   ```
   Backend'in `http://localhost:3000` adresinde çalıştığını kontrol edin.

2. **API URL yapılandırması (KOLAY TEST):**
   
   `.env` dosyasında tek bir satırı değiştirerek localhost ve production server arasında geçiş yapabilirsiniz:
   
   ```bash
   # Localhost'a bağlanmak için (development):
   VITE_API_MODE=development
   
   # Production server'a bağlanmak için:
   VITE_API_MODE=production
   ```
   
   **Alternatif seçenekler:**
   - `VITE_API_MODE=local` → localhost:3000/api
   - `VITE_API_MODE=server` → production IP:3000/api
   - `VITE_API_URL=http://localhost:3000/api` → Tam URL (en yüksek öncelik)
   - `VITE_NGROK_URL=https://abc123.ngrok-free.app` → Ngrok URL

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

**Not:** `.env` dosyası otomatik olarak oluşturulmuştur. İsterseniz `.env.example` dosyasını referans alarak kendi ayarlarınızı yapabilirsiniz.

## Giriş Bilgileri

- **Email:** admin@example.com
- **Şifre:** password123
