import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { GroupMember } from './groupMember.entity';

@Entity('group')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string; // "A Grubu", "B Grubu"

  @Column({ type: 'varchar', length: 50 })
  season: string; // "2025 Bahar"

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => GroupMember, member => member.group)
  members: GroupMember[];
}

