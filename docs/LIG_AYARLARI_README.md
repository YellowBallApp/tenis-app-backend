# Lig Ayarları Sistemi

## 🎯 Genel Bakış

EGEV Tenis Kulübü Defi Ligi için kapsamlı bir ayarlar yönetim sistemi. Tüm lig kuralları, tarihler ve parametreler backend'de tutulur ve frontend'den dinamik olarak yönetilir.

## 📊 Backend Entity Yapısı

### LeagueSettings Entity

```typescript
// Lig Dönemleri
leagueStartDate: Date           // 01.02.2025
leagueEndDate: Date             // 05.06.2025
eliminationStartDate: Date      // 05.06.2025
eliminationEndDate: Date        // 19.06.2025
finalDate: Date                 // 19.06.2025

// Katılım Bilgileri
registrationFee: number         // 150 TL
minMatchCountForElimination: number  // 15 maç

// Maç Formatı
warmupTimeMinutes: number       // 5 dakika
gamesPerSet: number            // 4 oyun
setsCount: number              // 2 set
gameTiebreakPoints: number     // 7 puan
matchTiebreakPoints: number    // 10 puan

// Teklif Kuralları
offerResponseDays: number       // 3 gün
matchCompletionDays: number     // 7 gün
postMatchCooldownHours: number  // 24 saat
reofferCooldownDays: number     // 15 gün
consecutiveWOLimit: number      // 3 kez
lateArrivalMinutes: number      // 10 dakika

// Sıra Bazlı Teklif Limitleri
offerLimitsByRank: [
  { range: '1-11', limit: 3 },
  { range: '12-19', limit: 4 },
  { range: '20-27', limit: 5 },
  { range: '28-40', limit: 6 },
  { range: '40+', limit: 10 }
]
```

## 🔌 API Endpoints

### GET /api/league/settings
Lig ayarlarını getirir. İlk çağrıda varsayılan ayarlar oluşturulur.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "EGEV_DEFI_LEAGUE_2025",
    "leagueStartDate": "2025-02-01",
    "registrationFee": 150,
    "offerLimitsByRank": [...]
  }
}
```

### PUT /api/league/settings
Lig ayarlarını günceller.

**Request Body:**
```json
{
  "registrationFee": 150,
  "minMatchCountForElimination": 15,
  "warmupTimeMinutes": 5,
  "offerLimitsByRank": [...]
}
```

### GET /api/league/rankings
Lig sıralamasını getirir.

### GET /api/league/user/:userId
Kullanıcının lig bilgilerini getirir (sıralama, maç istatistikleri).

### GET /api/league/available-opponents/:userId
Kullanıcının meydan okuyabileceği oyuncuları getirir.

### POST /api/league/challenge
Maç teklifi gönderir. Sıra bazlı limit kontrolü yapar.

### POST /api/league/match-result
Maç sonucunu kaydeder ve sıralamayı otomatik günceller.

## 📱 Frontend Kullanımı

### Ayarları Yükleme

```typescript
import { leagueService } from '../services/api';

const loadSettings = async () => {
  const settings = await leagueService.getLeagueSettings();
  // settings otomatik olarak state'e yüklenir
};
```

### Ayarları Güncelleme

```typescript
const saveSettings = async () => {
  const updatedSettings = {
    registrationFee: parseFloat(registrationFee),
    minMatchCountForElimination: parseInt(minMatchCount),
    // ... diğer alanlar
  };
  
  await leagueService.updateLeagueSettings(updatedSettings);
};
```

## 🎮 Ekran Kullanımı

### Lig Ayarları Ekranı

**Navigasyon:**
```typescript
navigation.navigate('LigAyarlari');
```

**Erişim:**
- Defi Lig ekranında sağ üst köşedeki ayarlar (⚙️) butonu
- `MainTabNavigator` içinde kayıtlı

**Özellikler:**
- ✅ Backend'den dinamik veri yükleme
- ✅ Loading state ile kullanıcı deneyimi
- ✅ Hata yönetimi
- ✅ Kaydetme sırasında buton disable
- ✅ "Yeniden Yükle" butonu ile ayarları sıfırlama

## 📋 24 Lig Kuralı

Tüm kurallar sisteme entegre edilmiştir:

1. ✅ **Lig Tarihleri**: 01.02.2025 - 19.06.2025
2. ✅ **Katılım Ücreti**: 150 TL
3. ✅ **Erişim**: Web ve mobil uygulama
4. ✅ **Kura**: Sistem tarafından yönetilir
5. ✅ **Sonradan Katılım**: Liste sonundan başlama
6. ✅ **Maç Formatı**: 4 oyunluk 2 set, karar puanlı
7. ✅ **Top Temini**: Teklif aşamasında anlaşma
8. ✅ **Teklif Süresi**: 3 gün yanıt süresi
9. ✅ **WO Cezası**: 3 kez üst üste = en alta düşme
10. ✅ **Maç Tamamlama**: 7 gün içinde
11. ✅ **Kort Rezervasyonu**: Yönetim desteği
12. ✅ **Skor Bildirimi**: Kazanan bildirir
13. ✅ **Kazanan Sırası**: Mağlubun sırasını alır
14. ✅ **Kaybeden Sırası**: 1 sıra düşer
15. ✅ **Koruma Süresi**: 24 saat maç sonrası
16. ✅ **Tekrar Teklif**: 15 gün bekleme
17. ✅ **Sıra Limitleri**: Dinamik 5 aşamalı sistem
18. ✅ **Geç Kalma**: 10 dakika = W/O
19. ✅ **Sakatlık**: Karşı taraf kazanır
20. ✅ **Hava Muhalefeti**: Skordan devam
21. ✅ **Hakem Talebi**: Kulüp idaresi
22. ✅ **Minimum Maç**: 15 maç elemeye katılım için
23. ✅ **Spor Komitesi**: Oyuncu çıkarma yetkisi
24. ✅ **Nihai Karar**: Spor Komitesi yetkili

## 🔐 Güvenlik

- ✅ Tüm endpoint'ler `authMiddleware` ile korunuyor
- ✅ Sadece yetkili kullanıcılar ayarları değiştirebilir
- ✅ Validation ve hata yönetimi

## 🚀 Kullanıma Alma

### 1. Backend Başlatma

```bash
cd /Users/bariscandemirel/Desktop/tenis_app
npm run dev
```

### 2. Veritabanı

Entity değişiklikleri otomatik olarak sync edilir (development modunda).

### 3. İlk Veri Yükleme

İlk API çağrısında varsayılan ayarlar otomatik oluşturulur.

## 🧪 Test Senaryoları

1. **Ayarları Görüntüleme**
   - Lig Ayarları ekranını açın
   - Tüm değerlerin backend'den yüklendiğini kontrol edin

2. **Ayarları Güncelleme**
   - Herhangi bir değeri değiştirin
   - "Ayarları Kaydet" butonuna basın
   - Başarı mesajını kontrol edin

3. **Yeniden Yükleme**
   - Değişiklik yapın (kaydetmeyin)
   - "Yeniden Yükle" butonuna basın
   - Orijinal değerlerin geri geldiğini kontrol edin

## 📝 Notlar

- Tarih formatı: `DD.MM.YYYY`
- Para birimi: TL
- Tüm süreler dakika/saat/gün cinsinden
- JSON format sıra limitleri için kullanılıyor

## 🎨 UI/UX

- 📅 Lig Dönemleri: Yeşil renkli ikonlar
- 💰 Katılım: Para ikonu
- 🎾 Maç Formatı: Tenis ikonu
- ⏱️ Kurallar: Saat ikonu
- 📊 Limitler: Chip'ler ile gösterim
- ⚠️ Cezalar: Kırmızı uyarı ikonları
- 🌤️ Özel Durumlar: Mavi bilgi ikonları

## 🔄 Gelecek Geliştirmeler

- [ ] Tarih seçici (date picker) ekle
- [ ] Ayar geçmişi tut
- [ ] Admin panel entegrasyonu
- [ ] Bulk ayar import/export
- [ ] Sezon arşivleme

---

**Geliştirici:** EGEV TK Yazılım Ekibi
**Son Güncelleme:** 01.10.2025
**Versiyon:** 1.0.0

