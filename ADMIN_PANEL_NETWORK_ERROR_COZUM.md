# Network Error Çözümü

## Sorun
Admin panelinde "Network Error" hatası alıyorsunuz.

## Çözüm

### 1. Backend Sunucusunun Çalıştığından Emin Olun

Backend çalışmıyor olabilir. Backend'i başlatmak için:

```powershell
# Backend dizinine gidin
cd C:\Users\kahra\tenisapp\tenis-app-backend

# Backend'i başlatın
npm run dev
```

Backend başarıyla çalışıyorsa terminal'de şunu göreceksiniz:
```
🚀 Server running on port 3000
💻 Local access: http://localhost:3000
```

### 2. Backend Çalışıyor Mu Kontrol Edin

Tarayıcıda şu adresi açın:
- http://localhost:3000

Şu mesajı görmelisiniz:
```json
{
  "message": "Tenis App Backend API",
  "version": "1.0.0",
  "documentation": "/api-docs"
}
```

### 3. API Endpoint'ini Test Edin

Tarayıcıda şu adresi açın:
- http://localhost:3000/api-docs

Swagger dokümantasyonunu görmelisiniz.

### 4. Admin Paneli Yeniden Başlatın

Backend çalıştıktan sonra:

1. Admin panel terminal'ini kapatın (Ctrl+C)
2. Yeniden başlatın:
   ```powershell
   cd admin-panel
   npm run dev
   ```

### 5. Hala Çalışmıyorsa

**Port 3000 kullanılıyor hatası alıyorsanız:**

Port 3000'i kullanan process'i bulun ve durdurun:
```powershell
# Port 3000'i kullanan process'i bulun
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Process ID'yi not edin ve durdurun
Stop-Process -Id <PROCESS_ID> -Force
```

**CORS hatası alıyorsanız:**

Backend'i yeniden başlatın. CORS ayarları development modunda tüm localhost'a izin veriyor.

### 6. Giriş Bilgileri

- **Email:** admin@example.com
- **Şifre:** password123

**Not:** Eğer admin kullanıcısı yoksa:
```powershell
cd tenis-app-backend
npm run seed:run
```

Bu komut admin kullanıcısını oluşturur.

