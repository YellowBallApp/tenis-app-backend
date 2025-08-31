import { 
    Entity, PrimaryGeneratedColumn, Column,
    UpdateDateColumn, CreateDateColumn, DeleteDateColumn, OneToMany
  } from "typeorm";
  import { MatchHistory } from './matchHistory.entity';
  
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
  
    @Column( {type: "varchar", nullable: true })
    gender: string | null;
  
    @Column()
    password: string;
  
    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
      
    @DeleteDateColumn()
    deletedAt: Date;

    @Column({ type: 'int', nullable: false })
    leagueRanking: number;
    
    //TODO: Temporarly will be used as Role, later need to implement role.entity
    @Column({ type: 'varchar', length: 100, nullable: true })
    title: string;
    
    @OneToMany(() => MatchHistory, matchHistory => matchHistory.user)
    matchHistories?: MatchHistory[];
    
  }
  