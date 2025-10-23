import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './RolePermission';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column()
  module!: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  desc!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
    {
      createForeignKeyConstraints: false,
    }
  )
  roles!: RolePermission[];
}
