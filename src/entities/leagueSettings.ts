import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OneToOne, JoinColumn } from 'typeorm';
import { LeagueSettingsTemplate } from './leagueSettingsTemplate';

@Entity()
export class LeagueSettings {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;

    @Column()
    creator: string;

    @Column({ nullable: true })
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

    // === MAÇ FORMATI ===
    @Column('int')
    warmupTimeMinutes: number;

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

    @Column('int')
    lateArrivalMinutes: number;

    // === SIRA BAZLI TEKLİF LİMİTLERİ ===
    @Column('json')
    offerLimitsByRank: {
        range: string;
        limit: number;
    }[];

    // === ESKİ ALANLAR (Geriye Dönük Uyumluluk) ===
    @Column('int')
    offerValue: number;

    @Column('boolean')
    offerEverywhere: boolean;

    @Column('int')
    shieldIntervalHour: number;

    @Column('int')
    userShieldHour: number;

    @Column('int')
    userShieldAmount: number;

    @Column('int')
    responseTimeHour: number;

    @OneToOne(() => LeagueSettingsTemplate)
    @JoinColumn()
    leagueSettingsTemplate: LeagueSettingsTemplate;
}