import {Entity,
PrimaryGeneratedColumn,
Column,
JoinColumn,
ManyToOne
} from 'typeorm';
import { User } from './user.entity';
import { League } from './league.entity';
import { ChallengeStatus } from '../enum/challengeStatus.enum';



@Entity('league_standings')
export class LeagueStandings {
@PrimaryGeneratedColumn()
id: number;

@Column({ type: 'int' })
leagueRanking: number;

@Column({ type: 'enum', enum: ChallengeStatus, nullable: true })
challengeStatus?: ChallengeStatus | null;

@Column({ type: 'timestamp', nullable: true })
challengePendingDate?: Date | null;

@Column({ type: 'timestamp', nullable: true })
challengeAcceptedDate?: Date | null;

@ManyToOne(() => User)
@JoinColumn()
user: User;

@ManyToOne(() => User, { nullable: true })
@JoinColumn()
challengedUser?: User | null;

@ManyToOne(() => League, league => league.standings)
@JoinColumn()
league: League;

}

