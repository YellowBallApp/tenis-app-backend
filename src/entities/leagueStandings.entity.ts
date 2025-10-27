import {Entity,
PrimaryGeneratedColumn,
Column,
JoinColumn,
ManyToOne
} from 'typeorm';
import { User } from './user.entity';
import { League } from './league.entity';

@Entity('league_standings')
export class LeagueStandings {
@PrimaryGeneratedColumn()
id: number;

@Column({ type: 'int' })
leagueRanking: number;

@ManyToOne(() => User)
@JoinColumn()
user: User;

@ManyToOne(() => League, league => league.standings)
@JoinColumn()
league: League;

}

