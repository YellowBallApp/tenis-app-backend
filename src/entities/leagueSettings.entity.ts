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

  @Column({ type: 'text', nullable: true })
  leagueDescription: string | null; // Lig hakkında açıklama (frontend'de gösterilecek)

  @Column({ type: 'text', nullable: true })
  rewards: string | null; // Ödüller bilgisi (JSON string veya plain text)

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

  // === KATILIM BİLGİLERİ ===

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  registrationFee: number;

  @Column('int')
  minMatchCountForElimination: number;

  @Column({ type: 'int', nullable: true })
  minAge: number | null;

  @Column({ type: 'int', nullable: true })
  maxAge: number | null;

  // === ELO RATING KISITLAMALARI ===

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  minStarRating: number | null; // Minimum yıldız seviyesi (örn: 1.5)

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  maxStarRating: number | null; // Maximum yıldız seviyesi (örn: 2.5)

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
  postMatchCooldownHoursLoser: number; // Maç Sonrası Bekleme Süresi Saati (Kaybeden)

  @Column('int')
  postMatchCooldownHoursWinner: number; // Maç Sonrası Bekleme Süresi Saati (Kazanan)

  @Column('int')
  consecutiveWOLimit: number;

  // === SIRA BAZLI TEKLİF LİMİTLERİ ===

  @Column('json')
  offerLimitsByRank: {
    range: string;
    limit: number;
  }[];
}

