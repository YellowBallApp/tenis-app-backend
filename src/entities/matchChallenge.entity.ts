import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { League } from './league.entity';

export enum ChallengeStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}

@Entity('match_challenges')
export class MatchChallenge {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn()
    challenger: User; // Teklif eden

    @ManyToOne(() => User, { eager: true })
    @JoinColumn()
    challenged: User; // Teklif edilen

    @ManyToOne(() => League, { eager: true })
    @JoinColumn()
    league: League;

    @Column({
        type: 'enum',
        enum: ChallengeStatus,
        default: ChallengeStatus.PENDING
    })
    status: ChallengeStatus;

    @Column({ type: 'text', nullable: true })
    message?: string; // Teklif mesajı

    @Column({ type: 'timestamp', nullable: true })
    proposedDate?: Date; // Önerilen tarih (opsiyonel)

    @Column({ type: 'timestamp', nullable: true })
    respondedAt?: Date; // Yanıt tarihi

    @Column({ type: 'timestamp' })
    expiresAt: Date; // Teklifin geçerlilik süresi

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

