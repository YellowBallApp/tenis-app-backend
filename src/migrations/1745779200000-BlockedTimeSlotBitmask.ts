import { MigrationInterface, QueryRunner } from 'typeorm';
import { buildMaskFromDates, serializeMask } from '../utils/timeSlotMask.utils';

/**
 * blocked_time_slots tablosunu bitmask mimarisine geçirir.
 *
 * Eski yapı  : her zaman aralığı için ayrı satır (start_time, end_time: TIMESTAMP)
 * Yeni yapı  : her (court_id, date) çifti için tek satır (date: DATE, busy_mask: BIGINT)
 *
 * busy_mask  : 48-bit — bit N, günün N*30. dakikasından başlayan slotun bloke olduğunu gösterir.
 */
export class BlockedTimeSlotBitmask1745779200000 implements MigrationInterface {
  name = 'BlockedTimeSlotBitmask1745779200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Yeni kolonları ekle (önce nullable, veri göçünden sonra NOT NULL yapılacak) ──
    await queryRunner.query(`
      ALTER TABLE "blocked_time_slots"
        ADD COLUMN IF NOT EXISTS "date"      DATE,
        ADD COLUMN IF NOT EXISTS "busy_mask" BIGINT NOT NULL DEFAULT 0
    `);

    // ── 2. Mevcut satırları oku ──
    const rows: Array<{
      id: number;
      courtId: number;
      startTime: Date;
      endTime: Date;
      reason: string | null;
      blockedByUserId: string | null;
      isActive: boolean;
    }> = await queryRunner.query(`
      SELECT
        id,
        court_id          AS "courtId",
        start_time        AS "startTime",
        end_time          AS "endTime",
        reason,
        blocked_by_user_id AS "blockedByUserId",
        is_active         AS "isActive"
      FROM "blocked_time_slots"
    `);

    // ── 3. Aynı (courtId, date) çiftlerini birleştirerek mask hesapla ──
    const grouped = new Map<
      string,
      { ids: number[]; mask: bigint; date: string }
    >();

    for (const row of rows) {
      const startTime = new Date(row.startTime);
      const endTime   = new Date(row.endTime);
      const dateStr   = startTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const key       = `${row.courtId}_${dateStr}`;
      const rowMask   = buildMaskFromDates(startTime, endTime);

      if (grouped.has(key)) {
        const g = grouped.get(key)!;
        g.mask |= rowMask;
        g.ids.push(row.id);
      } else {
        grouped.set(key, { ids: [row.id], mask: rowMask, date: dateStr });
      }
    }

    // ── 4. İlk satırı güncelle, gruptaki diğerlerini sil ──
    for (const group of grouped.values()) {
      const [keepId, ...deleteIds] = group.ids;

      await queryRunner.query(
        `UPDATE "blocked_time_slots"
            SET "date" = $1, "busy_mask" = $2
          WHERE id = $3`,
        [group.date, serializeMask(group.mask), keepId],
      );

      if (deleteIds.length > 0) {
        await queryRunner.query(
          `DELETE FROM "blocked_time_slots" WHERE id = ANY($1::int[])`,
          [deleteIds],
        );
      }
    }

    // ── 5. Tarihi olmayan (dönüştürülemeyen) satırları temizle ──
    await queryRunner.query(
      `DELETE FROM "blocked_time_slots" WHERE "date" IS NULL`,
    );

    // ── 6. date NOT NULL yap ──
    await queryRunner.query(`
      ALTER TABLE "blocked_time_slots"
        ALTER COLUMN "date" SET NOT NULL
    `);

    // ── 7. (court_id, date) üzerine UNIQUE kısıtı ekle ──
    await queryRunner.query(`
      ALTER TABLE "blocked_time_slots"
        ADD CONSTRAINT "UQ_blocked_time_slots_court_date" UNIQUE ("court_id", "date")
    `);

    // ── 8. Artık kullanılmayan eski kolonları düşür ──
    await queryRunner.query(`
      ALTER TABLE "blocked_time_slots"
        DROP COLUMN IF EXISTS "start_time",
        DROP COLUMN IF EXISTS "end_time"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── 1. UNIQUE kısıtını kaldır ──
    await queryRunner.query(`
      ALTER TABLE "blocked_time_slots"
        DROP CONSTRAINT IF EXISTS "UQ_blocked_time_slots_court_date"
    `);

    // ── 2. Eski kolonları geri ekle (nullable, veri geri yüklenince NOT NULL yapılacak) ──
    await queryRunner.query(`
      ALTER TABLE "blocked_time_slots"
        ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "end_time"   TIMESTAMP
    `);

    // ── 3. busy_mask'ten start_time / end_time'ı en iyi çabayla geri türet ──
    //    Not: Birden fazla bitişik olmayan aralık tek satırda birleştirilmişse
    //         yalnızca [ilk_set_bit, son_set_bit+1] aralığı yazılır. Bu kayıplı bir geri döndürmedir.
    const rows: Array<{ id: number; date: string; busyMask: string }> =
      await queryRunner.query(`
        SELECT id, date, busy_mask AS "busyMask"
        FROM "blocked_time_slots"
      `);

    for (const row of rows) {
      const mask = BigInt(row.busyMask);
      let firstSlot = -1;
      let lastSlot  = -1;

      for (let s = 0; s < 48; s++) {
        if ((mask >> BigInt(s)) & 1n) {
          if (firstSlot === -1) firstSlot = s;
          lastSlot = s;
        }
      }

      const toTime = (slot: number) => {
        const mins = slot * 30;
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        return `${h}:${m}:00`;
      };

      const startSlot = firstSlot === -1 ? 0 : firstSlot;
      const endSlot   = firstSlot === -1 ? 1 : lastSlot + 1;

      await queryRunner.query(
        `UPDATE "blocked_time_slots"
            SET "start_time" = $1, "end_time" = $2
          WHERE id = $3`,
        [
          `${row.date} ${toTime(startSlot)}`,
          `${row.date} ${toTime(endSlot)}`,
          row.id,
        ],
      );
    }

    // ── 4. NOT NULL yap ──
    await queryRunner.query(`
      ALTER TABLE "blocked_time_slots"
        ALTER COLUMN "start_time" SET NOT NULL,
        ALTER COLUMN "end_time"   SET NOT NULL
    `);

    // ── 5. Yeni kolonları düşür ──
    await queryRunner.query(`
      ALTER TABLE "blocked_time_slots"
        DROP COLUMN IF EXISTS "date",
        DROP COLUMN IF EXISTS "busy_mask"
    `);
  }
}
