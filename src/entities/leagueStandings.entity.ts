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

@Column({ type: 'boolean', default: false })
challengePending: boolean;

@Column({ type: 'timestamp', nullable: true })
challengeDate?: Date;

@OneToOne(() => User)
@JoinColumn()
user: User;

@ManyToOne(() => User, { nullable: true })
@JoinColumn()
challengedUser?: User;

@ManyToOne(() => League, league => league.standings)
@JoinColumn()
league: League;

}

