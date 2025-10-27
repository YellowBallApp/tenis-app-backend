import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './user.entity';
import { MatchHistory } from './matchHistory.entity';

@Entity('elo_rating_history')
export class EloRatingHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => MatchHistory, { nullable: true })
  @JoinColumn({ name: 'matchId' })
  match: MatchHistory | null;

  @Column({ type: 'int', nullable: true })
  matchId: number | null;

  @Column({ type: 'int' })
  previousRating: number;

  @Column({ type: 'int' })
  newRating: number;

  @Column({ type: 'int' })
  ratingChange: number; // Pozitif veya negatif değişim

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  previousStarRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  newStarRating: number;

  @Column({ type: 'int' })
  matchesPlayedAtTime: number; // O andaki toplam maç sayısı

  @Column({ type: 'int' })
  confidenceInterval: number; // O andaki güven aralığı

  @Column({ type: 'varchar', length: 50 })
  changeReason: string; // 'match_win', 'match_loss', 'decay', 'manual_adjustment'

  @Column({ type: 'text', nullable: true })
  notes: string | null; // Ek bilgiler

  @CreateDateColumn()
  createdAt: Date;
}

