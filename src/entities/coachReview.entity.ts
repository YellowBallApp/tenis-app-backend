import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity('coach_review')
export class CoachReview {
  @PrimaryGeneratedColumn()
  id: number;

  // Coach artık User tablosunda olduğu için sadece coachId column'u tutuyoruz
  // Foreign key constraint olmadan
  @Column({ type: 'uuid' })
  coachId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  rating: number; // 1-5 arası yıldız sayısı

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'boolean', default: false })
  isApproved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

