import { 
    Entity, PrimaryGeneratedColumn, Column,
    UpdateDateColumn, CreateDateColumn, DeleteDateColumn
  } from "typeorm";
  import { UserType } from "../enum/userType.enum";
  
  @Entity("user")
  export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column({ nullable: true })
    phone: string;
  
    @Column()
    name: string;
  
  @Column({ nullable: true })
  surname: string;

  @Column({ type: "text", nullable: true })
  profilePhoto: string | null; // Base64 encoded image or URL

  @Column( {type: "varchar", nullable: true })
  gender: string | null;

  @Column({ type: "date", nullable: true })
  birthDate: Date | null;

  @Column()
  password: string;
  
    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
      
    @DeleteDateColumn()
    deletedAt: Date;
    
    //TODO: Temporarly will be used as Role, later need to implement role.entity
    @Column({ type: 'varchar', length: 100, nullable: true })
    title: string;
    
  @Column({ 
    type: 'enum',
    enum: UserType,
    default: UserType.STANDARD
  })
  userType: UserType;

  // === ELO RATING SYSTEM ===
  
  @Column({ type: 'int', default: 1500 })
  eloRating: number;

  @Column({ type: 'int', default: 1500 })
  peakEloRating: number;

  @Column({ type: 'int', default: 0 })
  rankedMatchesPlayed: number;

  @Column({ type: 'timestamp', nullable: true })
  lastMatchDate: Date | null;

  @Column({ type: 'int', default: 150 })
  confidenceInterval: number; // Az maç yapanlar için ±150 gibi

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 2.5 })
  starRating: number; // 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0
  
}
  