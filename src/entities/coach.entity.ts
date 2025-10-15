import { 
  Entity, PrimaryGeneratedColumn, Column,
  UpdateDateColumn, CreateDateColumn, DeleteDateColumn
} from "typeorm";

@Entity("coach")
export class Coach {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  specialty: string;

  @Column()
  experience: string;

  @Column("decimal", { precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column()
  hourlyRate: string;

  @Column()
  availability: string;

  @Column("text")
  bio: string;

  @Column("simple-array")
  languages: string[];

  @Column("simple-array")
  certifications: string[];

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  image: string;

  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
    
  @DeleteDateColumn()
  deletedAt: Date;
}

