# Admin Panel Rehberi

## Genel Bakış

Bu proje, tenis uygulaması için web tabanlı bir admin panelidir. Admin paneli ile:
- Yeni kullanıcı ekleyebilir ve mevcut kullanıcıları yönetebilirsiniz
- Kullanıcılara rol ve yetkiler verebilirsiniz
- Kort rezervasyon saatlerini düzenleyebilir ve bloke edebilirsiniz

## Özellikler

### 🔐 Güvenlik
- Sadece admin rolüne sahip kullanıcılar panele erişebilir
- JWT token tabanlı kimlik doğrulama
- Otomatik token yenileme

### 👥 Kullanıcı Yönetimi
- Kullanıcı listeleme
- Yeni kullanıcı oluşturma
- Kullanıcı bilgilerini düzenleme
- Kullanıcı rolü ve yetkilerini değiştirme (STANDARD, RESTRICTED, ADMIN)
- Kullanıcı silme

### 📅 Rezervasyon Saatleri Yönetimi
- Belirli kortlar için zaman dilimlerini bloke etme
- Bloke edilmiş saatleri görüntüleme
- Bloklamaları düzenleme ve silme
- Bloklamaları aktif/pasif yapma

## Kurulum

### Backend

Backend'de yapılan değişiklikler:

1. **Admin Rolü Eklendi**
   - `UserType` enum'ına `ADMIN` eklendi
   - `src/enum/userType.enum.ts`

2. **Admin Middleware**
   - `src/middleware/adminMiddleware.ts` - Admin kontrolü için middleware

3. **BlockedTimeSlot Entity**
   - `src/entities/blockedTimeSlot.entity.ts` - Rezervasyon saatlerini bloke etmek için entity

4. **Admin Service ve Controller**
   - `src/services/admin.service.ts` - Admin işlemleri için service
   - `src/controllers/admin.controller.ts` - Admin endpoint'leri için controller

5. **Admin Routes**
   - `src/routes/admin.routes.ts` - Admin route'ları
   - `/api/admin/*` endpoint'leri

### Admin Panel (Frontend)

1. **Proje Konumu**
   ```
   ../admin-panel/
   ```

2. **Bağımlılıkları Yükleyin**
   ```bash
   cd admin-panel
   npm install
   ```

3. **Environment Değişkenlerini Ayarlayın**
   
   `.env` dosyası oluşturun:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Geliştirme Sunucusunu Başlatın**
   ```bash
   npm run dev
   ```

   Admin paneli `http://localhost:5173` adresinde çalışacaktır.

## Kullanım

### İlk Admin Kullanıcısı Oluşturma

1. Backend'de seed dosyasındaki admin kullanıcısı güncellendi:
   - Email: `admin@example.com`
   - Şifre: `password123`
   - Rol: `ADMIN`

2. Veya mevcut bir kullanıcının rolünü admin yapmak için:
   ```sql
   UPDATE "user" SET "userType" = 'admin' WHERE email = 'your-email@example.com';
   ```

### Giriş Yapma

1. Admin paneli sayfasını açın: `http://localhost:5173`
2. Admin email ve şifre ile giriş yapın
3. Dashboard sayfasına yönlendirileceksiniz

### Kullanıcı Yönetimi

1. Sol menüden "Kullanıcılar" sekmesine gidin
2. **Yeni Kullanıcı Ekleme:**
   - "+ Yeni Kullanıcı" butonuna tıklayın
   - Formu doldurun (İsim, Email, Şifre zorunludur)
   - Kullanıcı tipini seçin (STANDARD, RESTRICTED, ADMIN)
   - "Oluştur" butonuna tıklayın

3. **Kullanıcı Düzenleme:**
   - Kullanıcı listesinde "Düzenle" butonuna tıklayın
   - Bilgileri güncelleyin
   - Kullanıcı tipini değiştirebilirsiniz
   - "Güncelle" butonuna tıklayın

4. **Kullanıcı Silme:**
   - Kullanıcı listesinde "Sil" butonuna tıklayın
   - Onaylayın

### Rezervasyon Saatleri Yönetimi

1. Sol menüden "Rezervasyonlar" sekmesine gidin
2. **Saat Bloke Etme:**
   - "+ Saat Bloke Et" butonuna tıklayın
   - Kort seçin
   - Başlangıç ve bitiş zamanlarını seçin
   - İsteğe bağlı olarak neden ekleyin
   - "Oluştur" butonuna tıklayın

3. **Bloklama Düzenleme:**
   - Bloklama listesinde "Düzenle" butonuna tıklayın
   - Bilgileri güncelleyin
   - "Güncelle" butonuna tıklayın

4. **Bloklama Aktif/Pasif Yapma:**
   - "Aktifleştir" veya "Pasifleştir" butonuna tıklayın

5. **Bloklama Silme:**
   - "Sil" butonuna tıklayın ve onaylayın

## API Endpoints

### Admin Endpoints

Tüm admin endpoint'leri `/api/admin/*` altındadır ve admin yetkisi gerektirir.

#### Kullanıcı Yönetimi

- `POST /api/admin/users` - Yeni kullanıcı oluştur
- `GET /api/admin/users` - Tüm kullanıcıları listele
- `PUT /api/admin/users/:id` - Kullanıcı güncelle
- `DELETE /api/admin/users/:id` - Kullanıcı sil
- `PATCH /api/admin/users/:id/password` - Kullanıcı şifresini güncelle

#### Rezervasyon Bloklama

- `POST /api/admin/blocked-time-slots` - Zaman dilimi bloke et
- `GET /api/admin/blocked-time-slots` - Bloke edilmiş zaman dilimlerini listele
- `PUT /api/admin/blocked-time-slots/:id` - Bloklama güncelle
- `DELETE /api/admin/blocked-time-slots/:id` - Bloklama sil

## Teknik Detaylar

### Backend

- **Framework:** Express.js + TypeScript
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Authentication:** JWT

### Frontend

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS

## Notlar

1. **Güvenlik:** Admin paneli sadece admin rolüne sahip kullanıcılar tarafından erişilebilir. Backend'de her istek için admin kontrolü yapılır.

2. **Token Yönetimi:** Access token localStorage'da saklanır. Token süresi dolduğunda otomatik olarak login sayfasına yönlendirilir.

3. **Bloke Edilmiş Saatler:** Admin tarafından bloke edilmiş saatler rezervasyon oluşturulurken kontrol edilir ve rezervasyon yapılamaz.

4. **Kullanıcı Rolleri:**
   - **STANDARD:** Kısıtlama olmadan rezervasyon yapabilir
   - **RESTRICTED:** Hafta içi 9-18, hafta sonu 18-24 saatleri arası rezervasyon yapabilir
   - **ADMIN:** Admin paneli erişimi ve tüm yetkiler

## Sorun Giderme

### Admin panele giriş yapamıyorum
- Kullanıcının rolünün `admin` olduğundan emin olun
- Backend sunucusunun çalıştığını kontrol edin
- API URL'nin doğru olduğunu kontrol edin

### API istekleri başarısız oluyor
- Backend sunucusunun çalıştığını kontrol edin
- CORS ayarlarını kontrol edin
- Token'ın geçerli olduğunu kontrol edin

### Entity hataları
- Database'in güncel olduğundan emin olun
- Development modunda synchronize aktifse otomatik olarak güncellenir
- Production'da migration çalıştırın

