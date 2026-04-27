import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Court } from './court.entity';
import { User } from './user.entity';

/**
 * Bir kortun belirli bir günde bloke edilmiş saatlerini saklar.
 *
 * Her (courtId, date) çifti için tek bir satır tutulur.
 * busyMask: 48-bit BigInt — bit N, günün N*30. dakikasından başlayan
 * 30 dakikalık slotun bloke edildiğini gösterir.
 *
 * Örnek: 09:00–12:00 → bit 18, 19, 20, 21, 22, 23 set.
 */
@Entity('blocked_time_slots')
@Unique(['courtId', 'date'])
export class BlockedTimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  courtId: number;

  @ManyToOne(() => Court, { nullable: false })
  @JoinColumn({ name: 'courtId' })
  court: Court;

  @Column({ type: 'date', nullable: false })
  date: Date; // Bloke edilen gün (YYYY-MM-DD)

  @Column({ type: 'bigint', default: '0' })
  busyMask: string; // 48-bit bitmask — TypeORM BIGINT'i string olarak döner

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  blockedByUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'blockedByUserId' })
  blockedBy?: User;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
