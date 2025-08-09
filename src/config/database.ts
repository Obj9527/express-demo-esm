import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entity/User"
import { Role } from "../entity/Role"
import { UserRole } from "../entity/UserRole"
import { RolePermission } from "../entity/RolePermission"
import { Permission } from "../entity/Permission"

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "express_demo",
  synchronize: process.env.NODE_ENV === "dev", // 仅在开发环境启用自动同步
  logging: process.env.NODE_ENV === "dev",
  entities: [User, Role, UserRole, RolePermission, Permission],
  migrations: [],
  subscribers: [],
})
