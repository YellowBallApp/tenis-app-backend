import {Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    UpdateDateColumn,
    CreateDateColumn
    } from 'typeorm';
    import { LeagueSettingsTemplate } from './leagueSettingsTemplate';
    import { LeagueStandings } from './leagueStandings.entity';
    
    
@Entity('league')
export class League {
@PrimaryGeneratedColumn()
id: number;

@Column({ type: 'text' })
name: string;

@Column({ type: 'varchar', length: 50, unique: true })
code: string;

@Column({ type: 'text', nullable: true })
description?: string;
    
@OneToMany(() => LeagueSettingsTemplate, template => template.leagueEntity)
leagueSettingsTemplates: LeagueSettingsTemplate[];
    
@OneToMany(() => LeagueStandings, standing => standing.league)
standings: LeagueStandings[];
    
@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;
}
    
    