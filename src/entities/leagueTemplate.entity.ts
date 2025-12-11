import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('league_template')
export class LeagueTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string; // Şablon adı

  @Column({ type: 'text', nullable: true })
  description: string | null; // Şablon açıklaması

  @Column({ type: 'text', nullable: true })
  leagueDescription: string | null; // Lig hakkında açıklama (frontend'de gösterilecek)

  @Column({ type: 'text', nullable: true })
  rewards: string | null; // Ödüller bilgisi (JSON string veya plain text)

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'trophy' })
  icon: string | null;

  // === KATILIM BİLGİLERİ ===

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  registrationFee: number | null;

  @Column({ type: 'int', nullable: true })
  minMatchCountForElimination: number | null;

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

  @Column({ type: 'int', nullable: true })
  gamesPerSet: number | null;

  @Column({ type: 'int', nullable: true })
  setsCount: number | null;

  @Column({ type: 'int', nullable: true })
  gameTiebreakPoints: number | null;

  @Column({ type: 'int', nullable: true })
  matchTiebreakPoints: number | null;

  // === TEKLİF KURALLARI ===
  
  @Column({ type: 'int', nullable: true })
  offerResponseDays: number | null;

  @Column({ type: 'int', nullable: true })
  postMatchCooldownHoursLoser: number | null; // Maç Sonrası Bekleme Süresi Saati (Kaybeden)

  @Column({ type: 'int', nullable: true })
  postMatchCooldownHoursWinner: number | null; // Maç Sonrası Bekleme Süresi Saati (Kazanan)

  @Column({ type: 'int', nullable: true })
  consecutiveWOLimit: number | null;

  // === SHIELD SİSTEMİ ===

  @Column({ type: 'boolean', default: false })
  shieldEnabled: boolean; // Shield sistemi aktif mi?

  @Column({ type: 'int', nullable: true })
  shieldDaysTotal: number | null; // Kullanıcıya verilen toplam shield günü (örn: 15)

  // === SIRA BAZLI TEKLİF LİMİTLERİ ===

  @Column({ type: 'json', nullable: true })
  offerLimitsByRank: {
    range: string;
    limit: number;
  }[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

