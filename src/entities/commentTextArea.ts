import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { CommentType } from '../enum/commentEnum';
import { User } from './user.entity';
import { MatchHistory } from './matchHistory.entity';


@Entity()
export class CommentTextArea {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: CommentType,
    })
    CommentType: CommentType;

    @Column({ type: 'varchar' })
    comment: string;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;

    @ManyToOne(() => User, { nullable: true })
    user?: User;

    @ManyToOne(() => MatchHistory, { nullable: true })
    matchHistory?: MatchHistory;
}