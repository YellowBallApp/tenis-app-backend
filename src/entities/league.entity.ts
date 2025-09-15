import {Entity,
PrimaryGeneratedColumn,
Column,
OneToOne,
JoinColumn,
OneToMany
} from 'typeorm';
import { User } from './user.entity';
import { MatchHistory } from './matchHistory.entity';



@Entity()
export class League {
@PrimaryGeneratedColumn()
id: number;

@Column({ type: 'text', nullable: true })
description?: string;

@Column({ type: 'int' })
leagueRanking: number;

@OneToOne(() => User)
@JoinColumn()
user: User;

}