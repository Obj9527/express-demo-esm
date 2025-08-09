import { In, Repository } from 'typeorm'
import { AppDataSource } from '../config/database'
import { Role } from '../entity/Role'
import { RolePermission } from '../entity/RolePermission'

export class RoleService {
  private roleRepository: Repository<Role>
  private rolePermissionRepository: Repository<RolePermission>

  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role)
    this.rolePermissionRepository = AppDataSource.getRepository(RolePermission)
  }

  /**
   * 创建角色
   */
  async create(data: { name: string; desc?: string }) {
    // 检查角色名是否已存在
    const existingRole = await this.roleRepository.findOne({
      where: { name: data.name }
    })

    if (existingRole) {
      throw new Error('Role name already exists')
    }

    const role = new Role()
    role.name = data.name
    role.desc = data.desc

    return await this.roleRepository.save(role)
  }

  /**
   * 更新角色
   */
  async update(id: number, data: { name?: string; desc?: string }) {
    const role = await this.roleRepository.findOneBy({ id })
    
    if (!role) {
      throw new Error('Role not found')
    }

    // 如果要更新名称，检查新名称是否与其他角色冲突
    if (data.name && data.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: data.name }
      })

      if (existingRole) {
        throw new Error('Role name already exists')
      }
      role.name = data.name
    }

    if (data.desc !== undefined) {
      role.desc = data.desc
    }

    return await this.roleRepository.save(role)
  }

  /**
   * 删除角色
   */
  async delete(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users', 'permissions']
    })

    if (!role) {
      throw new Error('Role not found')
    }

    // 使用事务确保数据一致性
    await AppDataSource.transaction(async manager => {
      // 先删除关联的权限关系
      await manager.delete(RolePermission, { roleId: id })
      // 再删除角色
      await manager.delete(Role, { id })
    })

    return true
  }

  /**
   * 获取单个角色详情
   */
  async findById(id: number, options?: { withPermissions?: boolean }) {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .where('role.id = :id', { id })

    if (options?.withPermissions) {
      queryBuilder
        .leftJoinAndSelect('role.permissions', 'rolePermission')
        .leftJoinAndSelect('rolePermission.permission', 'permission')
    }

    const role = await queryBuilder.getOne()

    if (!role) {
      throw new Error('Role not found')
    }

    return role
  }

  /**
   * 获取角色列表
   */
  async findAll(options?: {
    page?: number
    pageSize?: number
    withPermissions?: boolean
  }) {
    const page = options?.page || 1
    const pageSize = options?.pageSize || 10

    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .skip((page - 1) * pageSize)
      .take(pageSize)

    if (options?.withPermissions) {
      queryBuilder
        .leftJoinAndSelect('role.permissions', 'rolePermission')
        .leftJoinAndSelect('rolePermission.permission', 'permission')
    }

    const [roles, total] = await queryBuilder.getManyAndCount()

    return {
      items: roles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 根据名称搜索角色
   */
  async search(name: string) {
    return await this.roleRepository
      .createQueryBuilder('role')
      .where('role.name LIKE :name', { name: `%${name}%` })
      .getMany()
  }

  /**
   * 检查角色是否存在
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.roleRepository.countBy({ id })
    return count > 0
  }

  /**
   * 设置角色权限（替换现有的所有权限）
   */
  async assignPermissions(roleId: number, permissionIds: number[]) {
    // 检查角色是否存在
    const role = await this.roleRepository.findOneBy({ id: roleId })
    if (!role) {
      throw new Error('Role not found')
    }

    // 使用事务确保数据一致性
    await AppDataSource.transaction(async manager => {
      // 先删除现有的权限关联
      await manager.delete(RolePermission, { roleId })

      // 创建新的权限关联
      const rolePermissions = permissionIds.map(permissionId => {
        const rp = new RolePermission()
        rp.roleId = roleId
        rp.permissionId = permissionId
        return rp
      })

      await manager.save(RolePermission, rolePermissions)
    })

    return await this.findById(roleId, { withPermissions: true })
  }

  /**
   * 添加角色权限（保留现有权限）
   */
  async addPermissions(roleId: number, permissionIds: number[]) {
    const role = await this.roleRepository.findOneBy({ id: roleId })
    if (!role) {
      throw new Error('Role not found')
    }

    // 获取现有的权限ID列表
    const existingPermissions = await this.rolePermissionRepository.find({
      where: { roleId }
    })
    const existingPermissionIds = existingPermissions.map(rp => rp.permissionId)

    // 过滤出新的权限ID（避免重复添加）
    const newPermissionIds = permissionIds.filter(
      id => !existingPermissionIds.includes(id)
    )

    // 如果有新的权限需要添加
    if (newPermissionIds.length > 0) {
      const rolePermissions = newPermissionIds.map(permissionId => {
        const rp = new RolePermission()
        rp.roleId = roleId
        rp.permissionId = permissionId
        return rp
      })

      await this.rolePermissionRepository.save(rolePermissions)
    }

    return await this.findById(roleId, { withPermissions: true })
  }

  /**
   * 移除角色权限
   */
  async removePermissions(roleId: number, permissionIds: number[]) {
    const role = await this.roleRepository.findOneBy({ id: roleId })
    if (!role) {
      throw new Error('Role not found')
    }

    await this.rolePermissionRepository.delete({
      roleId,
      permissionId: In(permissionIds)
    })

    return await this.findById(roleId, { withPermissions: true })
  }

  /**
   * 获取角色的所有权限
   */
  async getPermissions(roleId: number) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: {
        permissions: {
          permission: true
        }
      }
    })

    if (!role) {
      throw new Error('Role not found')
    }

    return role.permissions.map(rp => rp.permission)
  }
}
