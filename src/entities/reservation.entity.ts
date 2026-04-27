import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Court } from './court.entity';
import { ReservationStatus } from '../enum/reservationStatus.enum';

@Entity('reservation')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Court, { nullable: false, eager: true })
  @JoinColumn({ name: 'courtId' })
  court: Court;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.CONFIRMED,
  })
  status: ReservationStatus;

  @ManyToMany(() => User, { nullable: true })
  @JoinTable({
    name: 'reservation_participants',
    joinColumn: { name: 'reservationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  participants: User[]; // Diğer katılımcılar (User array)

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}

