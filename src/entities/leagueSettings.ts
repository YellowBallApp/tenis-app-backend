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

    // maks yapılabilecek sıra teklifi
    @Column('int')
    offerValue: number;

    // Lig default olarak sadece yukarı teklif edilebilir.
    @Column('boolean')
    offerEverywhere: boolean;

    // Maç sonrası alınan koruma süresi, saat cinsinden
    @Column('int')
    shieldIntervalHour: number;

    // Kullanıcıya verilen kendini koruma (mazeret izni) süresi, saat cinsinden
    @Column('int')
    userShieldHour: number;

    // Kullanıcının sahip olabileceği toplam koruma (mazeret izni) sayısı
    @Column('int')
    userShieldAmount: number;

    // Maç teklif edildiği sırada, teklifin kabul edilmesi için son süre, saat cinsinden
    @Column('int')
    responseTimeHour: number;

    @OneToOne(() => LeagueSettingsTemplate)
    @JoinColumn()
    leagueSettingsTemplate: LeagueSettingsTemplate;
}