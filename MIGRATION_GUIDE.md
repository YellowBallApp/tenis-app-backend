# Migration Kılavuzu - ELO Rating Sistemi

## 🎯 Genel Bakış

Bu kılavuz, ELO rating sistemini veritabanınıza eklemek için gerekli migration işlemlerini açıklar.

## 📋 Seçenekler

### Seçenek 1: TypeORM Migration (Önerilen)

TypeORM migration sistemi kullanarak otomatik migration.

#### Adımlar:

1. **Migration dosyası hazır**: `src/migrations/1730000000000-AddEloRatingSystem.ts`

2. **package.json'a migration scriptleri ekleyin**:
```json
{
  "scripts": {
    "migration:run": "typeorm migration:run -d src/config/data-source.ts",
    "migration:revert": "typeorm migration:revert -d src/config/data-source.ts",
    "migration:show": "typeorm migration:show -d src/config/data-source.ts",
    "migration:create": "typeorm migration:create"
  }
}
```

3. **Build projeyi**:
```bash
npm run build
```

4. **Migration'ı çalıştır**:
```bash
npm run migration:run
```

5. **Kontrol et**:
```bash
npm run migration:show
```

#### Migration'ı Geri Al:
```bash
npm run migration:revert
```

---

### Seçenek 2: Manuel SQL Script

Doğrudan SQL çalıştırarak migration yapma.

#### Adımlar:

1. **SQL dosyası hazır**: `src/migrations/manual-migration.sql`

2. **PostgreSQL'e bağlan**:

**Yöntem A - psql komut satırı**:
```bash
psql -U postgres -d tennis -f src/migrations/manual-migration.sql
```

**Yöntem B - pgAdmin**:
- pgAdmin'i aç
- Database'e sağ tıkla → Query Tool
- SQL dosyasını aç ve çalıştır (F5)

**Yöntem C - DBeaver**:
- DBeaver'ı aç
- SQL Editor'ı aç (SQL Script → New SQL Script)
- SQL dosyasını yapıştır ve çalıştır (Ctrl+Enter)

**Yöntem D - VSCode PostgreSQL Extension**:
- PostgreSQL extension'ı kur
- Database'e bağlan
- SQL dosyasını aç
- "Execute Query" yap

---

### Seçenek 3: TypeORM Synchronize (Development Only)

⚠️ **SADECE DEVELOPMENT ORTAMINDA KULLANIN**

TypeORM'in otomatik synchronization özelliği.

#### data-source.ts'de zaten aktif:
```typescript
synchronize: process.env.NODE_ENV === "development"
```

Bu durumda:
- Sunucuyu başlattığınızda otomatik olarak tablolar güncellenir
- **Production'da asla kullanmayın!**

---

## 🔍 Migration Sonrası Kontroller

### 1. Tabloları Kontrol Et

```sql
-- User tablosunu kontrol et
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user' 
  AND column_name IN ('eloRating', 'starRating', 'peakEloRating', 'rankedMatchesPlayed', 'lastMatchDate', 'confidenceInterval');

-- ELO history tablosunu kontrol et
SELECT * FROM information_schema.tables WHERE table_name = 'elo_rating_history';

-- League settings'i kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'league_settings' 
  AND column_name IN ('minStarRating', 'maxStarRating');

-- Match history'yi kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'match_history' 
  AND column_name IN ('affectsEloRating', 'eloChanges');
```

### 2. Index'leri Kontrol Et

```sql
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename IN ('user', 'elo_rating_history', 'match_history')
  AND indexname LIKE '%ELO%' OR indexname LIKE '%STAR%';
```

### 3. Kullanıcı Verilerini Kontrol Et

```sql
-- Tüm kullanıcıların başlangıç değerlerini kontrol et
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN "eloRating" = 1500 THEN 1 END) as default_elo_count,
    COUNT(CASE WHEN "starRating" = 1.5 THEN 1 END) as default_star_count
FROM "user";

-- Yıldız dağılımı
SELECT 
    "starRating",
    COUNT(*) as count
FROM "user"
GROUP BY "starRating"
ORDER BY "starRating";
```

### 4. View'leri Kontrol Et (Manuel SQL kullandıysanız)

```sql
-- View'lerin oluşturulduğunu kontrol et
SELECT viewname 
FROM pg_views 
WHERE viewname LIKE 'vw_elo%';

-- Leaderboard'u test et
SELECT * FROM "vw_elo_leaderboard" LIMIT 10;
```

---

## ⚠️ Önemli Notlar

### Production Migration İçin:

1. **Yedek Alın!**
```bash
pg_dump -U postgres -d tennis > backup_before_elo_migration.sql
```

2. **Önce Test Ortamında Deneyin**
   - Staging database'de migration'ı çalıştırın
   - Tüm kontrolleri yapın
   - Sorun yoksa production'a geçin

3. **Downtime Planlayın**
   - Migration büyük tablolarda uzun sürebilir
   - Kullanıcı sayısına göre 1-5 dakika arasında

4. **Production'da synchronize: false**
```typescript
// data-source.ts
synchronize: false, // PRODUCTION'da mutlaka false olmalı!
```

---

## 🐛 Sorun Giderme

### Hata: "column already exists"

Migration zaten çalışmış olabilir:
```sql
-- Kontrol et
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user' AND column_name = 'eloRating';

-- Varsa migration'ı atlayabilirsiniz
```

### Hata: "relation does not exist"

Tablo adları farklı olabilir (büyük/küçük harf):
```sql
-- Tablo adlarını kontrol et
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user', 'match_history', 'league_settings');
```

### Migration Geri Alınamıyor

Manuel olarak geri al:
```sql
-- ELO history tablosunu sil
DROP TABLE IF EXISTS "elo_rating_history" CASCADE;

-- User kolonlarını kaldır
ALTER TABLE "user" 
DROP COLUMN IF EXISTS "eloRating",
DROP COLUMN IF EXISTS "peakEloRating",
DROP COLUMN IF EXISTS "starRating",
DROP COLUMN IF EXISTS "rankedMatchesPlayed",
DROP COLUMN IF EXISTS "lastMatchDate",
DROP COLUMN IF EXISTS "confidenceInterval";

-- League settings kolonlarını kaldır
ALTER TABLE "league_settings"
DROP COLUMN IF EXISTS "minStarRating",
DROP COLUMN IF EXISTS "maxStarRating";

-- Match history kolonlarını kaldır
ALTER TABLE "match_history"
DROP COLUMN IF EXISTS "affectsEloRating",
DROP COLUMN IF EXISTS "eloChanges";
```

---

## 📊 Migration Sonrası İşlemler

### 1. Sunucuyu Yeniden Başlat

```bash
npm run build
npm start
```

### 2. API Endpoints'i Test Et

```bash
# Top players
curl http://localhost:3000/api/elo/top-players

# User stats (kendi user ID'nizi kullanın)
curl http://localhost:3000/api/elo/user/YOUR-UUID/stats

# Distribution
curl http://localhost:3000/api/elo/distribution
```

### 3. İlk Maçı Kaydet

```bash
curl -X POST http://localhost:3000/api/match-history \
  -H "Content-Type: application/json" \
  -d '{
    "winnerIds": ["user-uuid-1"],
    "loserIds": ["user-uuid-2"],
    "score": "6-4, 6-3",
    "affectsEloRating": true
  }'
```

ELO'nun güncellendiğini kontrol edin:
```bash
curl http://localhost:3000/api/elo/user/user-uuid-1/stats
```

### 4. Swagger Dokümantasyonunu Kontrol Et

```
http://localhost:YOUR-PORT/api-docs
```

"ELO" tag'i altında yeni endpoint'leri görebilmelisiniz.

---

## 🔧 Opsiyonel: Cron Job Kurulumu

Rating decay için otomatik job:

### 1. node-cron Yükle

```bash
npm install node-cron
npm install -D @types/node-cron
```

### 2. Cron Job Ekle

`src/index.ts` dosyasına:

```typescript
import cron from 'node-cron';
import userService from './services/user.service';

// Her ayın 1'inde saat 00:00'da çalış
cron.schedule('0 0 1 * *', async () => {
  console.log('ELO decay job başladı...');
  try {
    const result = await userService.applyEloDecay();
    console.log(`ELO decay tamamlandı: ${result.affectedUsers} oyuncu etkilendi`);
  } catch (error) {
    console.error('ELO decay hatası:', error);
  }
});
```

---

## ✅ Checklist

Migration öncesi:
- [ ] Veritabanı yedeği alındı
- [ ] Test ortamında denendi
- [ ] Downtime planlandı
- [ ] Tüm ekip bilgilendirildi

Migration sırasında:
- [ ] Migration başarıyla çalıştı
- [ ] Hata mesajı yok
- [ ] Tablolar oluşturuldu
- [ ] Index'ler eklendi

Migration sonrası:
- [ ] Tablo kontrolleri yapıldı
- [ ] Kullanıcı verileri güncellendi
- [ ] API endpoints test edildi
- [ ] İlk maç kaydedildi
- [ ] ELO hesaplaması çalışıyor
- [ ] View'ler çalışıyor (opsiyonel)
- [ ] Swagger dokümantasyonu güncellendi

---

## 📞 Destek

Sorun yaşarsanız:
1. `backend.log` dosyasını kontrol edin
2. PostgreSQL loglarını kontrol edin
3. GitHub Issues'a sorun açın

---

**Son Güncelleme:** Ekim 2025  
**Versiyon:** 1.0.0

