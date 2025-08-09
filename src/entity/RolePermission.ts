import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from "typeorm"
import { Role } from "./Role"
import { Permission } from "./Permission"

@Entity("role_permissions")
@Unique(["roleId", "permissionId"])
export class RolePermission {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  roleId!: number

  @Column()
  permissionId!: number

  @ManyToOne(() => Role, role => role.permissions, {
    createForeignKeyConstraints: false
  })
  role!: Role

  @ManyToOne(() => Permission, permission => permission.roles, {
    createForeignKeyConstraints: false
  })
  permission!: Permission
}
