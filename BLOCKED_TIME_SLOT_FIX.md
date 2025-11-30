# BlockedTimeSlot Entity Düzeltmesi

## Sorun
```
null value in column "courtId" of relation "blocked_time_slots" violates not-null constraint
```

## Çözüm

Entity'ye `courtId` ve `blockedByUserId` sütunları eklendi. Veritabanını güncellemek için:

### Development Modu (Otomatik Güncelleme)

Backend'i yeniden başlatın. Development modunda `synchronize: true` olduğu için tablo otomatik olarak güncellenecek.

```powershell
# Backend'i durdurun (Ctrl+C) ve yeniden başlatın
npm run dev
```

### Production Modu (Migration Gerekli)

Eğer production modunda çalışıyorsanız, migration oluşturmanız gerekir:

```powershell
npm run migration:new
npm run migration:run
```

## Yapılan Değişiklikler

### Entity Düzeltmesi (`src/entities/blockedTimeSlot.entity.ts`)

Eklenen sütunlar:
- `courtId: number` - Kort ID'si (NOT NULL)
- `blockedByUserId?: string` - Bloklamayı yapan admin kullanıcı ID'si (nullable)

Artık entity şu şekilde:
```typescript
@Column({ type: 'int', nullable: false })
courtId: number;

@ManyToOne(() => Court, { nullable: false })
@JoinColumn({ name: 'courtId' })
court: Court;

@Column({ type: 'uuid', nullable: true })
blockedByUserId?: string;

@ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'blockedByUserId' })
blockedBy?: User;
```

## Test

Backend'i yeniden başlattıktan sonra, admin panelinden rezervasyon saatlerini bloke etmeyi deneyin. Artık hata almamalısınız.

