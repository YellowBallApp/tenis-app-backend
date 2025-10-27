import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  UpdateDateColumn,
  CreateDateColumn
} from 'typeorm';
import { LeagueSettings } from './leagueSettings.entity';
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
  
  @OneToOne(() => LeagueSettings, settings => settings.league, { nullable: false })
  settings: LeagueSettings;
  
  @OneToMany(() => LeagueStandings, standing => standing.league)
  standings: LeagueStandings[];
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
