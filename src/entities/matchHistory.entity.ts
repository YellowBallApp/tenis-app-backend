import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { CommentTextArea } from "./commentTextArea";
import { User } from './user.entity';
import { LeagueStandings } from './leagueStandings.entity';
import { GroundType } from '../enum/groundType.enum';


@Entity()
export class MatchHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => CommentTextArea, commentTextArea => commentTextArea.matchHistory)
    commentTextAreas?: CommentTextArea[];

    @ManyToMany(() => User)
    @JoinTable({
        name: "match_history_winners",
        joinColumn: {
            name: "matchHistoryId",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "userId",
            referencedColumnName: "id"
        }
    })
    winners: User[];

    @ManyToMany(() => User)
    @JoinTable({
        name: "match_history_losers",
        joinColumn: {
            name: "matchHistoryId",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "userId",
            referencedColumnName: "id"
        }
    })
    losers: User[];

    @Column({ type: 'varchar', nullable: true })
    score: string;

    @Column({ type: 'timestamp', nullable: true })
    matchDate: Date;

    @Column({ type: 'boolean', default: false })
    indoorCourt: boolean;

    @Column({ type: 'enum', enum: GroundType, default: GroundType.HARD })
    courtGround: GroundType;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;

    @ManyToOne(() => LeagueStandings, { nullable: true })
    leagueStanding?: LeagueStandings;

    // === ELO RATING DEĞIŞIMLERI ===
    
    @Column({ type: 'boolean', default: true })
    affectsEloRating: boolean; // Bu maç ELO'yu etkiler mi?

    @Column({ type: 'json', nullable: true })
    eloChanges: {
        userId: string;
        previousRating: number;
        newRating: number;
        change: number;
    }[] | null; // Her oyuncunun ELO değişimi
}