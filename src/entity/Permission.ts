import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm"
import { RolePermission } from "./RolePermission"

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  name!: string

  @Column()
  module!: string

  @Column({ nullable: true })
  desc!: string | null | undefined

  @CreateDateColumn()
  createdAt!: Date

  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission, {
    createForeignKeyConstraints: false
  })
  roles!: RolePermission[]
}
