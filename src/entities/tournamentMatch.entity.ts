import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from './user.entity';

@Entity('tournament_match')
export class TournamentMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tournament, tournament => tournament.matches, { nullable: false })
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @Column({ type: 'int' })
  round: number; // 1, 2, 3, 4 (1=İlk Tur, 2=Çeyrek, 3=Yarı, 4=Final)

  @Column({ type: 'int' })
  matchNumber: number; // Turun içindeki maç sırası

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'player1Id' })
  player1: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'player2Id' })
  player2: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'winnerId' })
  winner: User;

  @Column({ type: 'varchar', nullable: true })
  score: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string; // 'pending', 'completed'
}

