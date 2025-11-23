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
import { Coach } from './coach.entity';

@Entity('coach_review')
export class CoachReview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Coach, { nullable: false })
  @JoinColumn({ name: 'coachId' })
  coach: Coach;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

