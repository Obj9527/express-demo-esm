import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import { Role } from '../entity/Role';
import { UserRole } from '../entity/UserRole';
import { RolePermission } from '../entity/RolePermission';
import { Permission } from '../entity/Permission';
import mongoose from 'mongoose';
import logger from "../utils/logger";
import * as process from "node:process";

class DatabaseManager {
  private appDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypass',
    database: process.env.DB_NAME || 'myapp',
    synchronize: process.env.NODE_ENV === 'dev', // 仅在开发环境启用自动同步
    logging: process.env.NODE_ENV === 'dev',
    entities: [User, Role, UserRole, RolePermission, Permission],
    migrations: [],
    subscribers: [],
  });
  private readonly DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/my-app';
  private isAllInitialized = false;

  private async connectMysqlDB(): Promise<boolean> {
    try {
      await this.appDataSource.initialize();
      logger.info('[db] ✅PG数据库 连接成功');
      return true;
    } catch (err: any) {
      console.error('[db] PG数据库 连接失败:', err.message);
      return false;
    }
  }

  private async connectMongoDB(): Promise<boolean> {
    try {
      await mongoose.connect(this.DB_URL);
      console.log('[db] MongoDB 连接成功');
      return true;
    } catch (err: any) {
      console.error('[db] MongoDB 连接失败:', err.message);
      return false;
    }
  }

  public async connect() {
    const connectMysqlSuccess = await this.connectMysqlDB();
    const connectMongoSuccess = await this.connectMongoDB();
    if (connectMysqlSuccess && connectMongoSuccess) {
      this.isAllInitialized = true;
    }
    if (!this.isAllInitialized) {
      process.exit(1)
    }
  }

  public async close() {
    await this.appDataSource.destroy()
  }

  public isInitialized() {
    return this.isAllInitialized;
  }

  public getMysqlInstance() {
    return this.appDataSource;
  }
}

export const databaseManager = new DatabaseManager();


