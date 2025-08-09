import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { UserRole } from "./UserRole"

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  username!: string

  @Column()
  password!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @OneToMany(() => UserRole, userRole => userRole.user, {
    createForeignKeyConstraints: false
  })
  roles!: UserRole[]
}
