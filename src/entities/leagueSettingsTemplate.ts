import { League } from './league.entity';
import { LeagueSettings } from './leagueSettings';
import {
Entity,
PrimaryGeneratedColumn,
Column,
ManyToOne,
OneToOne,
JoinColumn,
CreateDateColumn,
UpdateDateColumn
} from 'typeorm';

@Entity()
export class LeagueSettingsTemplate {
@PrimaryGeneratedColumn()
id: number;

@Column({ unique: true })
code: string;

@Column({ type: 'text' })
description: string;

@ManyToOne(() => League, league => league.leagueSettingsTemplates)
leagueEntity: League;

@Column({ default: true })
state: boolean;

@OneToOne(() => LeagueSettings)
@JoinColumn()
leagueSettings: LeagueSettings;

@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;

@Column({ type: 'int', nullable: true })
createdById: number;

@Column({ type: 'int', nullable: true })
updatedById: number;
}