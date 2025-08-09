import { AppDataSource } from "../config/database"
import { Permission } from "../entity/Permission"
import { Role } from "../entity/Role"
import { RolePermission } from "../entity/RolePermission"

export class PermissionService {
  private permissionRepository = AppDataSource.getRepository(Permission)
  private rolePermissionRepository = AppDataSource.getRepository(RolePermission)

  async createPermission(data: {
    name: string
    module: string
    desc?: string
  }) {
    const permission = new Permission()
    permission.name = data.name
    permission.module = data.module
    permission.desc = data.desc

    return await this.permissionRepository.save(permission)
  }

  async assignPermissionToRole(roleId: number, permissionId: number) {
    const rolePermission = new RolePermission()
    rolePermission.roleId = roleId
    rolePermission.permissionId = permissionId

    return await this.rolePermissionRepository.save(rolePermission)
  }

  async getRolePermissions(roleId: number) {
    return await this.rolePermissionRepository.find({
      where: { roleId },
      relations: {
        permission: true
      }
    })
  }

  async getPermissionsByModule(module: string) {
    return await this.permissionRepository.find({
      where: { module }
    })
  }
}
