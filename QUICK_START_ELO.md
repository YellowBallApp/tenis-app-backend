# ⚡ ELO Sistemi - Hızlı Başlangıç

## 🚀 5 Dakikada Kurulum

### Adım 1: Migration'ı Çalıştır

**Seçenek A - TypeORM (Önerilen)**
```bash
npm run build
npm run migration:run
```

**Seçenek B - Manuel SQL**
```bash
psql -U postgres -d tennis -f src/migrations/manual-migration.sql
```

### Adım 2: Sunucuyu Başlat
```bash
npm start
```

### Adım 3: Test Et
```bash
# Top players
curl http://localhost:3000/api/elo/top-players

# Başarılıysa hazırsınız! ✅
```

---

## 🎮 İlk Maç Kaydı

```bash
curl -X POST http://localhost:3000/api/match-history \
  -H "Content-Type: application/json" \
  -d '{
    "winnerIds": ["winner-user-uuid"],
    "loserIds": ["loser-user-uuid"],
    "score": "6-4, 6-3",
    "affectsEloRating": true
  }'
```

### ELO Değişimini Kontrol Et
```bash
curl http://localhost:3000/api/elo/user/winner-user-uuid/stats
```

Çıktı:
```json
{
  "success": true,
  "data": {
    "currentRating": 1516,
    "peakRating": 1516,
    "starRating": 1.5,
    "rankedMatchesPlayed": 1,
    "confidenceInterval": 150,
    "percentile": 50,
    "lastMatchDate": "2025-10-27T..."
  }
}
```

---

## 📊 Temel Endpoint'ler

### 1. Sıralama Tablosu
```bash
GET /api/elo/top-players?limit=10&minMatches=5
```

### 2. Kullanıcı İstatistikleri
```bash
GET /api/elo/user/:userId/stats
```

### 3. ELO Geçmişi
```bash
GET /api/elo/user/:userId/history?limit=20
```

### 4. Yıldız Bazlı Filtreleme
```bash
GET /api/elo/star/2.5  # 2.5 yıldızlı oyuncular
```

### 5. En Çok Kazananlar
```bash
GET /api/elo/top-gainers?days=30&limit=10
```

### 6. ELO Dağılımı
```bash
GET /api/elo/distribution
```

---

## ⭐ Yıldız Seviyesi Sistemi

| ELO | Yıldız | Seviye |
|-----|--------|--------|
| 1000-1199 | 1.0 ⭐ | Başlangıç |
| 1200-1399 | 1.5 ⭐½ | Orta |
| 1400-1599 | 2.0 ⭐⭐ | İyi |
| 1600-1799 | 2.5 ⭐⭐½ | Çok İyi |
| 1800+ | 3.0 ⭐⭐⭐ | Elit |

---

## 🎯 Lig Yıldız Kısıtlaması

### Lig Oluşturma (Yıldız Filtresi ile)

```typescript
// Backend'de
await leagueSettingsRepository.save({
  ...diğerAyarlar,
  minStarRating: 2.0,  // Minimum 2 yıldız
  maxStarRating: 2.5   // Maximum 2.5 yıldız
});
```

### Kullanıcı Lige Katılım Kontrolü

```typescript
// Otomatik kontrol edilir
await leagueStandingsService.joinLeague(userId, leagueId);
// Eğer yıldız seviyesi uygun değilse:
// Error: USER_STAR_RATING_TOO_LOW veya USER_STAR_RATING_TOO_HIGH
```

---

## 🔧 Ayarlar

### ELO Başlangıç Değerleri
- Yeni kullanıcı ELO: **1500**
- Yıldız seviyesi: **1.5**
- Güven aralığı: **±150**

### K-Faktörü (Otomatik)
- Yeni oyuncular (0-10 maç): **K=40**
- Orta seviye (10-30 maç): **K=32**
- Deneyimli (30+ maç): **K=24**
- Turnuva maçları: **K × 1.5**

### Set Farkı Bonusu
- 2-0 veya 3-0: **%20 ekstra ELO**

---

## 🔄 Otomatik İşlemler

### Rating Decay (Opsiyonel)

6 aydan fazla maç yapmayan oyunculara otomatik rating düşüşü.

**Cron Job Kurulumu:**

1. node-cron yükle:
```bash
npm install node-cron
npm install -D @types/node-cron
```

2. `src/index.ts`'e ekle:
```typescript
import cron from 'node-cron';

// Her ayın 1'inde çalışır
cron.schedule('0 0 1 * *', async () => {
  await userService.applyEloDecay();
});
```

**Manuel Çalıştırma:**
```bash
curl -X POST http://localhost:3000/api/elo/apply-decay \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Sorun Giderme

### Migration Çalışmıyor
```bash
# Mevcut migration'ları kontrol et
npm run migration:show

# Migration'ı geri al
npm run migration:revert

# Tekrar dene
npm run build
npm run migration:run
```

### ELO Güncellenmiyor
- `affectsEloRating: true` olduğundan emin olun
- Maç 1v1 mi kontrol edin (2v2 henüz desteklenmiyor)
- Backend loglarını kontrol edin

### Swagger'da Görünmüyor
```bash
# Build'i tekrar çalıştır
npm run build
npm start

# Swagger: http://localhost:YOUR_PORT/api-docs
```

---

## 📱 Frontend Entegrasyonu

### Yıldız Gösterimi (React Native)

```tsx
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  return (
    <View style={{ flexDirection: 'row' }}>
      {[...Array(fullStars)].map((_, i) => (
        <Icon key={i} name="star" size={16} color="#FFD700" />
      ))}
      {hasHalfStar && (
        <Icon name="star-half" size={16} color="#FFD700" />
      )}
    </View>
  );
};

export default StarRating;
```

### ELO Badge

```tsx
const EloRatingBadge = ({ elo, starRating }: Props) => {
  const getBadgeColor = (star: number) => {
    if (star >= 3.0) return '#FFD700';      // Altın
    if (star >= 2.5) return '#C0C0C0';      // Gümüş
    if (star >= 2.0) return '#CD7F32';      // Bronz
    if (star >= 1.5) return '#4CAF50';      // Yeşil
    return '#9E9E9E';                       // Gri
  };

  return (
    <View style={{
      backgroundColor: getBadgeColor(starRating),
      padding: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center'
    }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
        {elo}
      </Text>
      <StarRating rating={starRating} />
    </View>
  );
};
```

### API Kullanımı

```typescript
// services/eloService.ts
import axios from 'axios';

const API_URL = 'http://your-api-url';

export const eloService = {
  getUserStats: async (userId: string) => {
    const response = await axios.get(`${API_URL}/api/elo/user/${userId}/stats`);
    return response.data.data;
  },

  getTopPlayers: async (limit = 100) => {
    const response = await axios.get(`${API_URL}/api/elo/top-players?limit=${limit}`);
    return response.data.data;
  },

  getUserHistory: async (userId: string, limit = 50) => {
    const response = await axios.get(
      `${API_URL}/api/elo/user/${userId}/history?limit=${limit}`
    );
    return response.data.data;
  },

  getTopGainers: async (days = 30) => {
    const response = await axios.get(
      `${API_URL}/api/elo/top-gainers?days=${days}`
    );
    return response.data.data;
  }
};
```

---

## ✅ Kontrol Listesi

- [ ] Migration çalıştırıldı
- [ ] Sunucu başlatıldı
- [ ] API endpoints test edildi
- [ ] İlk maç kaydedildi
- [ ] ELO güncellenmesi doğrulandı
- [ ] Swagger dokümantasyonu kontrol edildi
- [ ] Frontend entegrasyonu yapıldı

---

## 📚 Daha Fazla Bilgi

- **Detaylı Dokümantasyon:** `ELO_SYSTEM_README.md`
- **Migration Kılavuzu:** `MIGRATION_GUIDE.md`
- **API Dokümantasyonu:** `http://localhost:PORT/api-docs`

---

## 🎉 Hazırsınız!

ELO sistemi artık aktif. Kullanıcılar maç yaptıkça otomatik olarak rating'leri güncellenecek ve yıldız seviyeleri artacak.

**Kolay gelsin! 🎾**

