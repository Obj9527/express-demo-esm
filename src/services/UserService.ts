import { AppDataSource } from "../config/database"
import { User } from "../entity/User"
import { Role } from "../entity/Role"
import { UserRole } from "../entity/UserRole"
import bcrypt from "bcrypt"

export class UserService {
  private userRepository = AppDataSource.getRepository(User)
  private roleRepository = AppDataSource.getRepository(Role)
  private userRoleRepository = AppDataSource.getRepository(UserRole)

  // 新建用户默认为普通角色
  async createUser(username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, process.env.SALT_ROUNDS || '10')
    
    const user = new User()
    user.username = username
    user.password = hashedPassword
    
    return await this.userRepository.save(user)
  }

  async findByUsername(username: string) {
    return await this.userRepository.findOne({
      where: { username },
      relations: { roles: { role: true } }
    })
  }

  async assignRole(userId: number, roleId: number) {
    const userRole = new UserRole()
    userRole.userId = userId
    userRole.roleId = roleId
    
    return await this.userRoleRepository.save(userRole)
  }
}
