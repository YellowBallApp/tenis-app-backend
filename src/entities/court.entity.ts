import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { GroundType } from '../enum/groundType.enum';

@Entity('courts')
export class Court {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  indoors: boolean;

  @Column({
    type: 'enum',
    enum: GroundType,
    default: GroundType.HARD,
  })
  groundType: GroundType;

  @Column({ default: false })
  closed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

