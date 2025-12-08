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
  dayOfWeek: number; // 0 = Pazartesi, 1 = Salı, ..., 6 = Pazar

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
