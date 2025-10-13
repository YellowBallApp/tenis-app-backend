import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TournamentMatch } from './tournamentMatch.entity';

@Entity('tournament')
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  size: number; // 8, 16, 32

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'varchar', default: 'pending' })
  status: string; // 'pending', 'active', 'completed'

  @OneToMany(() => TournamentMatch, match => match.tournament)
  matches: TournamentMatch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

