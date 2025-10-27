import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { League } from './league.entity';

@Entity('league_settings')
export class LeagueSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  description: string;

  @OneToOne(() => League, league => league.settings)
  @JoinColumn()
  league: League;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  creator: string;

  @Column({ type: 'varchar', nullable: true })
  updater: string;

  // === LİG DÖNEMLERİ ===

  @Column({ type: 'date' })
  leagueStartDate: Date;

  @Column({ type: 'date' })
  leagueEndDate: Date;

  @Column({ type: 'date' })
  eliminationStartDate: Date;

  @Column({ type: 'date' })
  eliminationEndDate: Date;

  @Column({ type: 'date' })
  finalDate: Date;

  // === KATILIM BİLGİLERİ ===

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  registrationFee: number;

  @Column('int')
  minMatchCountForElimination: number;

  @Column({ type: 'int', nullable: true })
  minAge: number | null;

  @Column({ type: 'int', nullable: true })
  maxAge: number | null;

  // === MAÇ FORMATI ===

  @Column('int')
  gamesPerSet: number;

  @Column('int')
  setsCount: number;

  @Column('int')
  gameTiebreakPoints: number;

  @Column('int')
  matchTiebreakPoints: number;

  // === TEKLİF KURALLARI ===
  
  @Column('int')
  offerResponseDays: number;

  @Column('int')
  matchCompletionDays: number;

  @Column('int')
  postMatchCooldownHours: number;

  @Column('int')
  reofferCooldownDays: number;

  @Column('int')
  consecutiveWOLimit: number;

  // === SIRA BAZLI TEKLİF LİMİTLERİ ===

  @Column('json')
  offerLimitsByRank: {
    range: string;
    limit: number;
  }[];

  @Column('int')
  responseTimeHour: number;
}

