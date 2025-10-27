import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { NotificationType } from '../enum/notificationType.enum';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    // İlgili kaynağın ID'si (challenge, match, tournament vb.)
    @Column({ type: 'int', nullable: true })
    relatedEntityId?: number;

    // İlgili kaynak tipi
    @Column({ type: 'varchar', nullable: true })
    relatedEntityType?: string; // 'challenge', 'match', 'league', 'tournament' vb.

    @CreateDateColumn()
    createdAt: Date;

    // Notification'ı alan kullanıcı
    @ManyToOne(() => User, { eager: true })
    @JoinColumn()
    recipient: User;
}

