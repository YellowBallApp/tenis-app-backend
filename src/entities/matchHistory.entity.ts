import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { CommentTextArea } from "./commentTextArea";
import { User } from './user.entity';
import { League } from './league.entity';


@Entity()
export class MatchHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => CommentTextArea, commentTextArea => commentTextArea.matchHistory)
    commentTextAreas?: CommentTextArea[];

    @Column({ type: 'varchar' })
    matchHistory: string;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;

    @ManyToOne(() => User, { nullable: true })
    user?: User;

    @ManyToOne(() => League, { nullable: true })
    league?: League;
}