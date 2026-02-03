import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Reservation } from './reservation.entity';
import { User } from './user.entity';
import { ParticipantRole } from '../enum/participantResponse.enum';
import { AcceptanceStatus } from '../enum/participantResponse.enum';

@Entity('reservation_participant_response')
export class ReservationParticipantResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
  })
  role: ParticipantRole;

  @Column({
    type: 'enum',
    enum: AcceptanceStatus,
  })
  acceptanceStatus: AcceptanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
