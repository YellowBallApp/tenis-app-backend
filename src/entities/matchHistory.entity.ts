import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CommentTextArea } from "./commentTextArea";
import { User } from './user.entity';
import { League } from './league.entity';


@Entity()
export class MatchHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => CommentTextArea, commentTextArea => commentTextArea.matchHistory)
    commentTextAreas?: CommentTextArea[];

    @Column({ type: 'varchar', nullable: true })
    matchHistory: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'winnerId' })
    winner: User;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'loserId' })
    loser: User;

    @Column({ type: 'varchar', nullable: true })
    score: string;

    @Column({ type: 'timestamp', nullable: true })
    matchDate: Date;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;

    @ManyToOne(() => User, { nullable: true })
    user?: User;

    @ManyToOne(() => League, { nullable: true })
    league?: League;
}