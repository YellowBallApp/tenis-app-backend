import {Entity,
PrimaryGeneratedColumn,
Column,
OneToOne,
JoinColumn,
ManyToOne
} from 'typeorm';
import { User } from './user.entity';
import { League } from './league.entity';



@Entity('league_standings')
export class LeagueStandings {
@PrimaryGeneratedColumn()
id: number;

@Column({ type: 'text', nullable: true })
description?: string;

@Column({ type: 'int' })
leagueRanking: number;

@OneToOne(() => User)
@JoinColumn()
user: User;

@ManyToOne(() => League, league => league.standings)
@JoinColumn()
league: League;

}

