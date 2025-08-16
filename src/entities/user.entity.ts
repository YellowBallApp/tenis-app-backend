import { 
    Entity, PrimaryGeneratedColumn, Column,
    UpdateDateColumn, CreateDateColumn, DeleteDateColumn, 
  } from "typeorm";
  
  @Entity("Users")
  export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column({ nullable: true })
    phone: string;
  
    @Column()
    name: string;
  
    @Column()
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
    
  }
  