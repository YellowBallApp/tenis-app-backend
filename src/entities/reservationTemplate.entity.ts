import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reservation_templates')
export class ReservationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  dayOfWeek: number; // 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi

  @Column({ type: 'varchar', length: 5 })
  time: string; // Format: "HH:mm" (örn: "08:00", "09:00")

  @Column({ type: 'int', default: 0 })
  order: number; // Sıralama için

  @Column({ default: true })
  isActive: boolean; // Aktif mi pasif mi

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
