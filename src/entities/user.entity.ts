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
  
  @Column( {type: "varchar", nullable: true })
  gender: string | null;

  @Column({ type: "int", nullable: true })
  age: number | null;

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
    
  }
  