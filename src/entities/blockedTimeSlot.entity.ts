import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Court } from './court.entity';
import { User } from './user.entity';

@Entity('blocked_time_slots')
export class BlockedTimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  courtId: number;

  @ManyToOne(() => Court, { nullable: false })
  @JoinColumn({ name: 'courtId' })
  court: Court;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'text', nullable: true })
  reason: string; // Bloklama nedeni

  @Column({ type: 'uuid', nullable: true })
  blockedByUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'blockedByUserId' })
  blockedBy?: User; // Hangi admin tarafından bloke edildi

  @Column({ default: true })
  isActive: boolean; // Aktif mi pasif mi

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

