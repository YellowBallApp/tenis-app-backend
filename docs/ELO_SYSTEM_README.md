# ELO Rating Sistemi - Dokümantasyon

## 📊 Genel Bakış

Tenis App Backend'e profesyonel bir ELO rating sistemi entegre edilmiştir. Bu sistem, oyuncuların yetenek seviyelerini objektif bir şekilde ölçer ve lig katılımlarını düzenler.

## ⭐ Yıldız Rating Sistemi

Oyuncular ELO puanlarına göre yıldız seviyeleri alırlar:

| ELO Aralığı | Yıldız | Seviye |
|------------|--------|---------|
| 1000-1199  | ⭐ (1.0) | Başlangıç |
| 1200-1399  | ⭐½ (1.5) | Orta |
| 1400-1599  | ⭐⭐ (2.0) | İyi |
| 1600-1799  | ⭐⭐½ (2.5) | Çok İyi |
| 1800+      | ⭐⭐⭐ (3.0) | Elit |

## 🎯 Özellikler

### 1. Otomatik ELO Hesaplama
- **1v1 Maçlar**: Her maç sonucu otomatik olarak ELO'yu etkiler
- **Set Farkı Bonusu**: 2-0 veya 3-0 gibi net sonuçlar %20 daha fazla ELO değişimi
- **Turnuva Maçları**: K-faktörü %50 artırılır (daha fazla ELO kazanma/kaybetme)

### 2. Dinamik K-Faktörü
```
Yeni Oyuncular (0-10 maç): K = 40
Orta Seviye (10-30 maç): K = 32
Deneyimli (30+ maç): K = 24
```

### 3. Güven Aralığı (Confidence Interval)
Az maç yapmış oyunculara daha yüksek güven aralığı verilir:
```
< 5 maç: ±150
5-10 maç: ±120
10-20 maç: ±90
20-30 maç: ±60
30-50 maç: ±40
50+ maç: ±25
```

### 4. Rating Decay (Çürüme)
6 aydan fazla maç yapmayan oyuncular için otomatik rating düşüşü:
- Her ay %2 düşüş (maksimum %12)
- Minimum ELO: 1000

### 5. Lig Yıldız Kısıtlamaları
Ligler artık minimum ve maksimum yıldız seviyesi belirleyebilir:
```typescript
// Örnek: Sadece 1.5-2.5 yıldız arası oyuncular katılabilir
leagueSettings.minStarRating = 1.5;
leagueSettings.maxStarRating = 2.5;
```

## 🗄️ Database Değişiklikleri

### Yeni Tablolar

#### `elo_rating_history`
```sql
- id: number (PK)
- userId: string (FK -> user.id)
- matchId: number (FK -> match_history.id, nullable)
- previousRating: number
- newRating: number
- ratingChange: number
- previousStarRating: decimal(3,1)
- newStarRating: decimal(3,1)
- matchesPlayedAtTime: number
- confidenceInterval: number
- changeReason: string
- notes: text (nullable)
- createdAt: timestamp
```

### Güncellenen Tablolar

#### `user`
Yeni alanlar:
```sql
- eloRating: number (default: 1500)
- peakEloRating: number (default: 1500)
- rankedMatchesPlayed: number (default: 0)
- lastMatchDate: timestamp (nullable)
- confidenceInterval: number (default: 150)
- starRating: decimal(3,1) (default: 1.5)
```

#### `league_settings`
Yeni alanlar:
```sql
- minStarRating: decimal(3,1) (nullable)
- maxStarRating: decimal(3,1) (nullable)
```

#### `match_history`
Yeni alanlar:
```sql
- affectsEloRating: boolean (default: true)
- eloChanges: json (nullable)
  Format: [{ userId, previousRating, newRating, change }]
```

## 🔌 API Endpoints

### ELO Bilgileri

#### `GET /api/elo/top-players`
En yüksek ELO'ya sahip oyuncuları getirir.
```
Query Params:
- limit (default: 100)
- minMatches (default: 5)
```

#### `GET /api/elo/distribution`
ELO dağılımını yıldız seviyesine göre getirir.

#### `GET /api/elo/top-gainers`
Son N gündeki en çok ELO kazanan oyuncuları getirir.
```
Query Params:
- days (default: 30)
- limit (default: 10)
```

#### `GET /api/elo/star/:starRating`
Belirli yıldız seviyesindeki oyuncuları getirir.
```
Path Params:
- starRating: 1.0, 1.5, 2.0, 2.5, 3.0

Query Params:
- limit (optional)
```

### Kullanıcı ELO Bilgileri

#### `GET /api/elo/user/:userId/stats`
Kullanıcının detaylı ELO istatistiklerini getirir.
```json
{
  "currentRating": 1650,
  "peakRating": 1720,
  "starRating": 2.5,
  "rankedMatchesPlayed": 45,
  "confidenceInterval": 40,
  "percentile": 75,
  "lastMatchDate": "2025-10-20T10:30:00Z"
}
```

#### `GET /api/elo/user/:userId/history`
Kullanıcının ELO geçmişini getirir.
```
Query Params:
- limit (default: 50)
```

#### `GET /api/elo/user/:userId/history/range`
Belirli tarih aralığındaki ELO geçmişini getirir.
```
Query Params:
- startDate (required)
- endDate (required)
```

#### `GET /api/elo/user/:userId/total-change`
Kullanıcının toplam ELO değişimini getirir.

### Admin Endpoints

#### `POST /api/elo/apply-decay` 🔒
ELO decay işlemini manuel olarak uygular.
```
Requires: Authentication
```

#### `GET /api/elo/inactive-players` 🔒
İnaktif oyuncuları getirir.
```
Query Params:
- months (default: 6)

Requires: Authentication
```

## 💻 Kullanım Örnekleri

### Maç Sonucu Ekleme (ELO ile)
```typescript
// Otomatik ELO güncellemesi
await matchHistoryService.create({
  winnerIds: ['user-uuid-1'],
  loserIds: ['user-uuid-2'],
  score: '6-4, 6-3',
  affectsEloRating: true, // varsayılan: true
  isTournament: false
});
```

### Lig Oluşturma (Yıldız Kısıtlaması ile)
```typescript
// Sadece 2.0-2.5 yıldız arası oyuncular katılabilir
await leagueSettingsRepository.create({
  ...otherSettings,
  minStarRating: 2.0,
  maxStarRating: 2.5
});
```

### Kullanıcı ELO İstatistikleri
```typescript
const stats = await userService.getEloStats(userId);
console.log(`Rating: ${stats.currentRating} (Top ${stats.percentile}%)`);
```

## 🔄 Otomatik İşlemler

### Rating Decay
Önerilen: Ayda bir kez çalıştırılmalı (cron job ile)
```typescript
// Cron job örneği (her ayın 1'inde)
cron.schedule('0 0 1 * *', async () => {
  await userService.applyEloDecay();
});
```

## 📈 Frontend Entegrasyonu

### Yıldız Gösterimi
```tsx
// React Native örneği
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  return (
    <View>
      {[...Array(fullStars)].map((_, i) => <StarIcon key={i} />)}
      {hasHalfStar && <HalfStarIcon />}
    </View>
  );
};
```

### ELO Badge
```tsx
const EloRatingBadge = ({ elo, starRating }: Props) => {
  const getRatingColor = (star: number) => {
    if (star >= 3.0) return '#FFD700'; // Gold
    if (star >= 2.5) return '#C0C0C0'; // Silver
    if (star >= 2.0) return '#CD7F32'; // Bronze
    return '#808080'; // Gray
  };
  
  return (
    <View style={{ backgroundColor: getRatingColor(starRating) }}>
      <Text>{elo}</Text>
      <StarRating rating={starRating} />
    </View>
  );
};
```

## 🎮 ELO Formülü

```typescript
// Beklenen skor
E_A = 1 / (1 + 10^((R_B - R_A) / 400))

// Yeni rating
R_A_new = R_A + K * SetMultiplier * (S_A - E_A)

// S_A: Gerçek skor (1 = kazandı, 0 = kaybetti)
// K: K-faktörü (tecrübeye göre)
// SetMultiplier: Set farkı çarpanı (1.0 veya 1.2)
```

## 🚀 Gelecek Özellikler (2v2 İçin)

Sistem 2v2 maçlar için hazır değil ama genişletilebilir yapıda tasarlandı:

```typescript
// Gelecekte eklenecek
async calculate2v2Match(
  team1PlayerIds: [string, string],
  team2PlayerIds: [string, string],
  options: EloUpdateOptions
): Promise<EloCalculationResult[]>
```

## 🐛 Sorun Giderme

### ELO Güncellenmiyor
1. `affectsEloRating` parametresinin `true` olduğundan emin olun
2. Maçın 1v1 olduğunu kontrol edin (2v2 henüz desteklenmiyor)
3. Kullanıcıların valid olduğunu kontrol edin

### Lig Katılım Hatası
```
Error: USER_STAR_RATING_TOO_LOW / USER_STAR_RATING_TOO_HIGH
```
Kullanıcının yıldız seviyesi ligin kısıtlamalarına uymuyor.

## 📝 Migration

Database migration'ı çalıştırmak için:
```bash
npm run build
# Manuel olarak yeni kolonları ekleyin veya TypeORM migration kullanın
```

## 🎯 Best Practices

1. **Maç sonuçlarını hemen kaydedin** - ELO hesaplamaları otomatik yapılır
2. **Turnuva maçlarını işaretleyin** - `isTournament: true` parametresi ile
3. **Aylık decay çalıştırın** - Cron job ile otomatikleştirin
4. **Yıldız kısıtlamalarını kullanın** - Dengeli ligler için

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Backend Team

---

**Version:** 1.0.0  
**Last Updated:** October 2025

