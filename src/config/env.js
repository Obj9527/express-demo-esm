import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const baseEnv = path.resolve(process.cwd(), '.env');
const mode = process.env.NODE_ENV || 'dev';
const modeEnv = path.resolve(process.cwd(), `.env.${mode}`);

// 加载 .env 基础配置
dotenv.config({ path: baseEnv });

// 根据环境加载 .env.dev / .env.prod
if (fs.existsSync(modeEnv)) {
  dotenv.config({ path: modeEnv });
  console.log(`[env] 加载完成：.env.${mode}`);
} else {
  console.warn(`[env] 未找到 .env.${mode}，仅使用 .env`);
}
