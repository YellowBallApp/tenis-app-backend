# Cron Sistemi Dokümantasyonu

Bu proje için zamanlanmış görevleri (cron jobs) yönetmek üzere `node-cron` paketi kullanılarak bir cron sistemi kurulmuştur.

## 📁 Dosya Yapısı

```
src/
├── cron/
│   ├── cronManager.ts              # Ana cron yöneticisi
│   └── jobs/                       # Cron job dosyaları
│       ├── exampleJob.ts           # Örnek job (test amaçlı)
│       ├── cleanupOldReservations.ts    # Eski rezervasyonları temizleme
│       ├── updateLeagueStandings.ts     # Lig sıralamalarını güncelleme
│       └── sendDailyNotifications.ts    # Günlük bildirimler gönderme
```

## 🚀 Hızlı Başlangıç

### Kurulum

Gerekli paketler zaten yüklenmiştir:
```bash
npm install node-cron @types/node-cron
```

### Sunucuyu Başlatma

Sunucuyu başlattığınızda cron sistemi otomatik olarak devreye girer:

```bash
npm run dev
```

Konsolda şu mesajları göreceksiniz:
```
Database connection successful
🚀 Cron job'ları başlatılıyor...
✅ 4 adet cron job başarıyla yapılandırıldı.
📋 Aktif cron job'ları:
  - Rezervasyon temizleme: Her gün 02:00
  - Lig sıralamaları güncelleme: Her gün 00:00
  - Günlük bildirimler: Her gün 08:00
Server running on port 3000
```

## 📋 Mevcut Cron Job'ları

### 1. Eski Rezervasyonları Temizleme
- **Dosya:** `cleanupOldReservations.ts`
- **Çalışma Zamanı:** Her gün 02:00'da
- **Açıklama:** 90 gün öncesine ait tamamlanmış rezervasyonları temizler
- **Cron İfadesi:** `0 2 * * *`

### 2. Lig Sıralamalarını Güncelleme
- **Dosya:** `updateLeagueStandings.ts`
- **Çalışma Zamanı:** Her gün 00:00'da
- **Açıklama:** Aktif liglerin sıralamalarını günceller
- **Cron İfadesi:** `0 0 * * *`

### 3. Günlük Bildirimler Gönderme
- **Dosya:** `sendDailyNotifications.ts`
- **Çalışma Zamanı:** Her gün 08:00'da
- **Açıklama:** Bugünkü rezervasyonlar için kullanıcılara hatırlatma gönderir
- **Cron İfadesi:** `0 8 * * *`

### 4. Örnek Job (Devre Dışı)
- **Dosya:** `exampleJob.ts`
- **Çalışma Zamanı:** Her 5 dakikada bir (test amaçlı, varsayılan olarak kapalı)
- **Açıklama:** Test amaçlı örnek bir job
- **Cron İfadesi:** `*/5 * * * *`

## 🕐 Cron İfadeleri Rehberi

Cron ifadesi formatı:
```
┌────────────── dakika (0 - 59)
│ ┌──────────── saat (0 - 23)
│ │ ┌────────── ayın günü (1 - 31)
│ │ │ ┌──────── ay (1 - 12)
│ │ │ │ ┌────── haftanın günü (0 - 7) (Pazar=0 veya 7)
│ │ │ │ │
* * * * *
```

### Örnekler:

- `* * * * *` - Her dakika
- `*/5 * * * *` - Her 5 dakikada bir
- `0 * * * *` - Her saatin başında
- `0 0 * * *` - Her gün gece yarısı
- `0 8 * * *` - Her gün sabah 8'de
- `0 0 * * 0` - Her Pazar gece yarısı
- `0 0 1 * *` - Her ayın 1'inde
- `0 0 1 1 *` - Her yılın ilk günü
- `0 */6 * * *` - Her 6 saatte bir
- `0 9-17 * * *` - Her gün 09:00 ile 17:00 arasında her saat

## 🌐 API Endpoints

Cron job'larını HTTP istekleri ile yönetebilirsiniz:

### Job Durumunu Görüntüleme

```bash
GET http://localhost:3000/api/cron/status
```

**Yanıt:**
```json
{
  "success": true,
  "jobs": [
    {
      "name": "cleanupOldReservations",
      "key": "cleanup",
      "schedule": "0 2 * * *",
      "description": "90 gün öncesine ait eski rezervasyonları temizler",
      "nextRun": "Her gün 02:00",
      "timezone": "Europe/Istanbul",
      "active": true
    },
    ...
  ],
  "serverTime": "2025-10-27T10:00:00.000Z",
  "serverTimezone": "Europe/Istanbul"
}
```

### Manuel Job Çalıştırma

```bash
POST http://localhost:3000/api/cron/run/{jobName}
```

**Parametreler:**
- `jobName`: `example`, `cleanup`, `updateStandings`, `dailyNotifications`

**Örnek:**
```bash
curl -X POST http://localhost:3000/api/cron/run/cleanup
```

**Yanıt:**
```json
{
  "success": true,
  "message": "cleanup job'ı başarıyla çalıştırıldı.",
  "timestamp": "2025-10-27T10:00:00.000Z"
}
```

### Swagger Dokümantasyonu

API dokümantasyonunu şu adresten görüntüleyebilirsiniz:
```
http://localhost:3000/api-docs
```

Burada Cron endpoint'lerini test edebilirsiniz.

## 💻 Kullanım

### Sunucu Başlatıldığında Otomatik Başlama

Cron job'ları sunucu başlatıldığında otomatik olarak başlar. `src/index.ts` dosyasında:

```typescript
AppDataSource.initialize()
  .then(() => {
    console.log("Database connection successful");
    
    // Cron job'ları başlat
    initializeCronJobs();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
```

### Yeni Bir Cron Job Ekleme

1. `src/cron/jobs/` klasörüne yeni bir dosya oluşturun:

```typescript
// src/cron/jobs/myNewJob.ts
import { AppDataSource } from "../../config/data-source";

export const myNewJob = async () => {
  try {
    console.log("🔧 Yeni job çalıştırıldı:", new Date().toLocaleString("tr-TR"));
    
    // İşlemlerinizi buraya ekleyin
    
    console.log("✅ İşlem tamamlandı.");
  } catch (error) {
    console.error("❌ Hata:", error);
  }
};
```

2. `src/cron/cronManager.ts` dosyasına job'ı ekleyin:

```typescript
import { myNewJob } from "./jobs/myNewJob";

export const initializeCronJobs = () => {
  // ... diğer job'lar
  
  // Yeni job - Her gün 14:00'da çalışır
  const myTask = cron.schedule(
    "0 14 * * *",
    myNewJob,
    {
      scheduled: true,
      timezone: "Europe/Istanbul"
    }
  );
  cronJobs.push(myTask);
};
```

### Manuel Job Çalıştırma

Bir job'ı manuel olarak çalıştırmak için:

```typescript
import { runJobManually } from "./cron/cronManager";

// Örnek kullanım
await runJobManually("cleanup");
await runJobManually("updateStandings");
await runJobManually("dailyNotifications");
```

### Tüm Job'ları Durdurma

```typescript
import { stopAllCronJobs } from "./cron/cronManager";

stopAllCronJobs();
```

## 🔍 Loglama

Tüm cron job'ları çalıştıklarında konsola log yazdırır:
- 🕐 Job başladı
- ✅ İşlem başarılı
- ❌ Hata oluştu

Logları görmek için sunucu loglarını kontrol edin:
```bash
npm run dev
```

## 🛠️ Konfigürasyon

### Timezone (Saat Dilimi)

Tüm job'lar Türkiye saat dilimiyle çalışır (`Europe/Istanbul`). Değiştirmek için `cronManager.ts` içindeki `timezone` parametresini güncelleyin.

### Job'ı Devre Dışı Bırakma

Bir job'ı geçici olarak devre dışı bırakmak için `scheduled` parametresini `false` yapın:

```typescript
const myTask = cron.schedule(
  "0 14 * * *",
  myNewJob,
  {
    scheduled: false,  // Job devre dışı
    timezone: "Europe/Istanbul"
  }
);
```

## 🧪 Test Etme

Cron job'larınızı test etmek için:

1. **Örnek job'ı aktif edin:**
   - `cronManager.ts` dosyasında `exampleJob` için `scheduled: true` yapın
   - Sunucuyu başlatın
   - Her 5 dakikada bir job çalışacaktır

2. **Manuel test:**
   ```typescript
   import { runJobManually } from "./cron/cronManager";
   await runJobManually("example");
   ```

3. **Kısa süreli test için:**
   - Cron ifadesini `*/1 * * * *` (her dakika) olarak değiştirin
   - Test ettikten sonra orijinal değere geri döndürün

## 📝 En İyi Uygulamalar

1. **Hata Yönetimi:** Tüm job'larda try-catch kullanın
2. **Loglama:** Her işlem için açıklayıcı loglar ekleyin
3. **Performans:** Uzun süren işlemler için timeout ekleyin
4. **Veritabanı:** Her job'da gerekirse transaction kullanın
5. **Test:** Üretim öncesi manuel olarak test edin
6. **Monitoring:** Job başarı/hata oranlarını takip edin

## 🔧 Sorun Giderme

### Job çalışmıyor
- Sunucunun çalıştığından emin olun
- `scheduled: true` olduğunu kontrol edin
- Cron ifadesinin doğru olduğunu kontrol edin
- Timezone ayarlarını kontrol edin

### İstenmeyen zamanlarda çalışıyor
- Timezone ayarını kontrol edin
- Cron ifadesini yeniden kontrol edin
- [Crontab Guru](https://crontab.guru/) kullanarak ifadeyi test edin

### Veritabanı bağlantı hatası
- Job'ın veritabanı bağlantısından sonra çalıştığından emin olun
- AppDataSource'un initialize edildiğini kontrol edin

## 📚 Kaynaklar

- [node-cron NPM](https://www.npmjs.com/package/node-cron)
- [Crontab Guru](https://crontab.guru/) - Cron ifadesi test aracı
- [Cron Expression Generator](https://crontab.cronhub.io/)

## 📞 Yardım

Sorularınız için proje dokümantasyonuna bakın veya geliştirici ekibiyle iletişime geçin.

