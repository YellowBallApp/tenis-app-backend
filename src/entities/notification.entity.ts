import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { League } from './league.entity';
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

    @Column({ type: 'varchar', nullable: true })
    message?: string;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    @CreateDateColumn()
    notificationReceivedDate: Date;

    // Notification'ı alan kullanıcı
    @ManyToOne(() => User)
    @JoinColumn()
    recipient: User;

    // Match challenge için: Meydan okuyan kullanıcı
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn()
    challenger?: User;

    // Match challenge için: Hangi ligde
    @ManyToOne(() => League, { nullable: true })
    @JoinColumn()
    league?: League;
}

