# Admin Paneli Başlatma Rehberi

## Hızlı Başlatma

1. **Yeni bir terminal/PowerShell penceresi açın**

2. **Admin panel dizinine gidin:**
   ```powershell
   cd C:\Users\kahra\tenisapp\admin-panel
   ```

3. **Dev server'ı başlatın:**
   ```powershell
   npm run dev
   ```

4. **Tarayıcıda açın:**
   - URL: `http://localhost:5173`
   - Veya terminal çıktısında gösterilen URL'i kullanın

## Sorun Giderme

### Port 5173 zaten kullanılıyorsa:
- Vite otomatik olarak başka bir port seçer (5174, 5175, vb.)
- Terminal çıktısında gösterilen URL'i kullanın

### "npm run dev" çalışmıyorsa:
1. Node modules'ların yüklü olduğundan emin olun:
   ```powershell
   npm install
   ```

2. Backend'in çalıştığından emin olun:
   - Backend: `http://localhost:3000`

3. **API URL yapılandırması (KOLAY TEST):**
   
   `.env` dosyasında tek bir satırı değiştirerek localhost ve production server arasında geçiş yapabilirsiniz:
   
   ```bash
   # Localhost'a bağlanmak için:
   VITE_API_MODE=development
   
   # Production server'a bağlanmak için:
   VITE_API_MODE=production
   ```
   
   **Not:** `.env` dosyasını değiştirdikten sonra dev server'ı yeniden başlatın (`npm run dev`)

## Giriş Bilgileri

- **Email:** admin@example.com
- **Şifre:** password123

Not: Eğer admin kullanıcısı yoksa, backend'de seed çalıştırmanız gerekebilir:
```powershell
cd C:\Users\kahra\tenisapp\tenis-app-backend
npm run seed:run
```

