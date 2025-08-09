import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique } from "typeorm"
import { User } from "./User"
import { Role } from "./Role"

@Entity("user_roles")
@Unique(["userId", "roleId"])
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  roleId!: number

  @ManyToOne(() => User, user => user.roles, {
    createForeignKeyConstraints: false  // 禁用外键约束
  })
  user!: User

  @ManyToOne(() => Role, role => role.users, {
    createForeignKeyConstraints: false  // 禁用外键约束
  })
  role!: Role
}
