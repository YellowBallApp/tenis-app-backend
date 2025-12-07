import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('reservation_time_slots')
export class ReservationTimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 5, unique: true })
  time: string; // HH:mm formatında (örn: "09:00")

  @Column({ type: 'int' })
  order: number; // Sıralama için (örn: 1, 2, 3...)

  @Column({ default: true })
  isActive: boolean; // Aktif mi pasif mi

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
