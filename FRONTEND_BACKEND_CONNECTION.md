# 🔗 Frontend - Backend Bağlantısı

## ✅ Tamamlanan İşlemler

### 1. **HomeScreen - Backend Entegrasyonu**
Mock veriler silindi, gerçek API'lardan veri çekiliyor:

**Önceki Durum:**
```typescript
const upcomingMatches = [
  { id: 1, player1: 'Ahmet Yılmaz', player2: 'Mehmet Demir', ... }
];
```

**Yeni Durum:**
```typescript
const [reservations, setReservations] = useState<any[]>([]);
const [announcements, setAnnouncements] = useState<any[]>([]);

useEffect(() => {
  const reservationsData = await reservationService.getReservationsByDate(today);
  const announcementsData = await announcementService.getAllAnnouncements();
}, []);
```

**Kullanılan API'lar:**
- ✅ `GET /api/reservations?date=YYYY-MM-DD` - Bugünkü rezervasyonlar
- ✅ `GET /api/announcements` - Duyurular

---

### 2. **LigSiralamaScreen - Backend Entegrasyonu**
200+ satır mock data silindi, backend'den canlı veri çekiliyor:

**Önceki Durum:**
```typescript
const players = [
  { id: 1, name: 'Mehmet Demir', points: 2450, ... },
  { id: 2, name: 'Ayşe Özkan', points: 2380, ... },
  // ... 12 oyuncu mock data
];
```

**Yeni Durum:**
```typescript
const [players, setPlayers] = useState<any[]>([]);

useEffect(() => {
  const rankingsData = await leagueService.getLeagueRankings();
  setPlayers(rankingsData);
}, []);
```

**Kullanılan API'lar:**
- ✅ `GET /api/league/rankings` - Lig sıralaması (8 oyuncu)
- ✅ `POST /api/league/challenge` - Meydan okuma gönderme

---

## 📱 Frontend API Servisleri

### Tüm Servisler Hazır
```typescript
// Kimlik Doğrulama
authService.login(credentials)
authService.register(credentials)
authService.logout()
authService.getProfile()

// Lig İşlemleri
leagueService.getLeagueRankings()
leagueService.getUserLeagueInfo(userId)
leagueService.sendMatchChallenge(challengerId, opponentId, message)
leagueService.recordMatchResult(matchId, winnerId, loserId, score)

// Rezervasyonlar
reservationService.getReservationsByDate(date)
reservationService.getMyReservations()
reservationService.createReservation(data)
reservationService.cancelReservation(id)

// Duyurular
announcementService.getAllAnnouncements()
announcementService.createAnnouncement(data)
announcementService.updateAnnouncement(id, data)
announcementService.deleteAnnouncement(id)

// Turnuvalar
tournamentService.getAllTournaments()
tournamentService.getTournamentBracket(id)
tournamentService.createTournament(data)
tournamentService.reportMatchResult(matchId, data)
```

---

## 🎯 Kullanılan Gerçek Veriler

### Backend'den Gelen Veri Örnekleri:

**Rezervasyonlar:**
```json
{
  "id": 1,
  "courtNumber": 1,
  "startTime": "2025-10-13T06:00:00.000Z",
  "endTime": "2025-10-13T07:00:00.000Z",
  "participants": ["Ahmet"],
  "notes": "Defi ligi maçı",
  "user": {
    "id": "60627498-08a6-4904-a9de-9659f2b04d9e",
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

**Lig Sıralaması:**
```json
{
  "position": 1,
  "description": "Admin - 1. sırada",
  "user": {
    "id": "60627498-08a6-4904-a9de-9659f2b04d9e",
    "name": "Admin",
    "email": "admin@example.com"
  }
}
```

**Duyurular:**
```json
{
  "id": 1,
  "title": "Defi Ligi 2025 Sezonu Başladı! 🎾",
  "content": "Yeni sezon heyecanı başladı!...",
  "isPinned": true,
  "author": {
    "name": "Admin"
  }
}
```

---

## 🔐 Authentication

### Token Yönetimi
- ✅ Automatic token refresh mekanizması
- ✅ Request interceptor (Bearer token)
- ✅ Response interceptor (401 handling)
- ✅ AsyncStorage ile token saklama

```typescript
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 📊 Test Verileri

**Kullanıcılar:** 8 adet (Admin + 7 üye)
- Email: admin@example.com, ahmet@example.com, ...
- Şifre (hepsi): password123

**Lig Sıralaması:** 8 kullanıcı sıralı
**Maç Geçmişi:** 4 maç
**Rezervasyonlar:** 3 aktif rezervasyon
**Duyurular:** 3 duyuru

---

## 🚀 Nasıl Çalıştırılır?

### Backend
```bash
cd /Users/ataberk/Documents/GitHub/tenis-app-backend
npm run dev
```

### Frontend (React Native)
```bash
cd /Users/ataberk/Documents/GitHub/tenis-app-backend/frontend
npm start
```

### Expo Seçenekleri:
- **Web:** `w` tuşuna bas
- **Android:** `a` tuşuna bas (Emulator gerekli)
- **iOS:** `i` tuşuna bas (macOS + Xcode gerekli)
- **Expo Go:** QR kodu telefonla tara

---

## ✨ Özellikler

### Ana Sayfa (HomeScreen)
- ✅ Bugünkü rezervasyonlar (Backend'den)
- ✅ Duyurular (Backend'den)
- ✅ Loading state
- ✅ Error handling

### Lig Sıralaması (LigSiralamaScreen)
- ✅ Canlı sıralama (Backend'den)
- ✅ Meydan okuma sistemi (Backend'e gönderim)
- ✅ Defi Lig kuralları (3 sıra yukarı)
- ✅ Loading state
- ✅ Error handling

---

## 📝 Notlar

1. **Mock Data:** Tüm statik mock veriler temizlendi
2. **API Calls:** Tüm API çağrıları gerçek endpoint'lere yapılıyor
3. **Error Handling:** Try-catch blokları ve kullanıcı bildirimleri eklendi
4. **Loading States:** Veri yüklenirken loading göstergesi
5. **Empty States:** Veri yoksa bilgilendirme mesajları

---

## 🎨 UI/UX İyileştirmeleri

- Loading spinner eklendi
- Empty state mesajları eklendi
- Error state handling
- Gerçek kullanıcı verileri gösteriliyor
- Dinamik avatar isimleri (kullanıcı adının ilk harfi)

---

## 🔄 Sonraki Adımlar

### Tamamlanması Gerekenler:
1. ✅ **Login ekranı entegrasyonu** - Kullanıcı girişi
2. ⏳ **Profile ekranı entegrasyonu** - Kullanıcı profili
3. ⏳ **Rezervasyon oluşturma** - Backend'e rezervasyon gönderme
4. ⏳ **Maç sonucu girişi** - Backend'e sonuç kaydetme
5. ⏳ **Turnuva bracket gösterimi** - Turnuva detayları

---

**Son Güncelleme:** 13 Ekim 2025


