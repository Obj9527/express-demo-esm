import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './UserRole';
import { RolePermission } from './RolePermission';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  desc!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.role, {
    createForeignKeyConstraints: false,
  })
  users!: UserRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role, {
    createForeignKeyConstraints: false,
  })
  permissions!: RolePermission[];
}
