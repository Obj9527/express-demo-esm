import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from './config/database';
import bugSyncRoutes from './routes/bugSync';
import bugRoutes from './routes/bug';
import { BugSyncController } from './controllers/bugSyncController';
import logger from './utils/logger';
import { httpLogger } from './utils/httpLogger';
import userRoutes from './routes/user';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandlerMiddleware';
import { connectMongoDB } from './db';

const app = express();
// 放在所有中间件最前面，记录所有请求日志
app.use(httpLogger);
// 解析json数据
app.use(express.json());
// 解析表单
app.use(express.urlencoded({ extended: true }));
// 注册路由
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/bugs', bugSyncRoutes); // Bug同步路由：/api/bugs/sync/status 等
// 健康检查根路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 异常处理中间件
app.use(errorHandler);

// 初始化应用
async function initApp() {
  try {
    // 1. 初始化数据库连接
    await connectMongoDB();
    await AppDataSource.initialize();
    logger.info('✅ pg数据库连接成功');

    const PORT = process.env.PORT || 3000;

    // 2. 启动服务器
    app.listen(PORT, () => {
      logger.info(`🚀 服务器运行在 http://localhost:${PORT}`);
      logger.info(
        `📊 Bug同步状态: http://localhost:${PORT}/api/bugs/sync/status`
      );
      logger.info(
        `🎣 Bug WebHook端点: http://localhost:${PORT}/api/bugs/sync/webhook`
      );
    });

    // 3. Bug同步服务会在BugSyncController构造函数中自动启动
    logger.info('🐛 Bug数据同步服务已就绪');
  } catch (error) {
    logger.error('❌ 应用初始化失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGTERM', async () => {
  logger.info('📴 接收到终止信号，开始优雅关闭...');

  try {
    // 停止Bug同步服务
    // await bugSyncController.cleanup();

    // 关闭数据库连接
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('🔌 数据库连接已关闭');
    }

    logger.info('✅ 应用已优雅关闭');
    process.exit(0);
  } catch (error) {
    logger.error('❌ 优雅关闭失败:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('🛑 接收到中断信号，开始关闭应用...');
  process.emit('SIGTERM');
});

// 启动应用
initApp();
