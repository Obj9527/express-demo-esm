import { Request, Response } from 'express';
import { BugSyncManager, defaultBugSyncConfig } from '../externals/java-system/sync/BugSyncManager';
import logger from '../utils/logger';

/**
 * Bug同步专用控制器
 * 专门处理Bug数据同步相关的HTTP请求
 */
export class BugSyncController {
  private bugSyncManager: BugSyncManager;

  constructor() {
    // 从环境变量读取配置
    const config = {
      ...defaultBugSyncConfig,
      webhook: {
        ...defaultBugSyncConfig.webhook,
        secretKey: process.env.BUG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || 'your-secret-key'
      },
      polling: {
        ...defaultBugSyncConfig.polling,
        intervalMs: Number(process.env.BUG_SYNC_INTERVAL) || defaultBugSyncConfig.polling.intervalMs
      }
    };

    this.bugSyncManager = new BugSyncManager(config);
    this.initializeBugSyncManager();
  }

  /**
   * 初始化Bug同步管理器
   */
  private async initializeBugSyncManager(): Promise<void> {
    try {
      await this.bugSyncManager.start();
      logger.info('🐛 Bug同步管理器初始化完成');
    } catch (error) {
      logger.error('❌ Bug同步管理器初始化失败:', error);
    }
  }

  /**
   * 获取Bug同步状态
   * GET /api/bugs/sync/status
   */
  async getBugSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.bugSyncManager.getStatus();
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取Bug同步状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取Bug同步状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 手动触发Bug同步
   * POST /api/bugs/sync/trigger
   */
  async triggerBugSync(req: Request, res: Response): Promise<void> {
    try {
      await this.bugSyncManager.triggerSync();
      
      res.json({
        success: true,
        message: 'Bug同步已触发',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('触发Bug同步失败:', error);
      res.status(500).json({
        success: false,
        message: '触发Bug同步失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 处理Bug WebHook请求
   * POST /api/bugs/sync/webhook
   */
  async handleBugWebHook(req: Request, res: Response): Promise<void> {
    try {
      const webHookHandler = this.bugSyncManager.getWebHookHandler();
      await webHookHandler(req, res);
    } catch (error) {
      logger.error('Bug WebHook处理失败:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Bug WebHook处理失败',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
  }

  /**
   * 停止Bug同步服务
   * POST /api/bugs/sync/stop
   */
  async stopBugSync(req: Request, res: Response): Promise<void> {
    try {
      this.bugSyncManager.stop();
      
      res.json({
        success: true,
        message: 'Bug同步服务已停止',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('停止Bug同步失败:', error);
      res.status(500).json({
        success: false,
        message: '停止Bug同步失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 重启Bug同步服务
   * POST /api/bugs/sync/restart
   */
  async restartBugSync(req: Request, res: Response): Promise<void> {
    try {
      this.bugSyncManager.stop();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      await this.bugSyncManager.start();
      
      res.json({
        success: true,
        message: 'Bug同步服务已重启',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('重启Bug同步失败:', error);
      res.status(500).json({
        success: false,
        message: '重启Bug同步失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 健康检查
   * GET /api/bugs/sync/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const status = this.bugSyncManager.getStatus();
      const isHealthy = status.isRunning && (
        status.webhook.isHealthy || status.polling.enabled
      );

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? 'healthy' : 'unhealthy',
        data: {
          isRunning: status.isRunning,
          webhookHealthy: status.webhook.isHealthy,
          pollingEnabled: status.polling.enabled
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Bug同步健康检查失败:', error);
      res.status(503).json({
        success: false,
        status: 'error',
        message: '健康检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取Bug同步管理器实例（用于其他地方调用）
   */
  getBugSyncManager(): BugSyncManager {
    return this.bugSyncManager;
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      this.bugSyncManager.stop();
      logger.info('🧹 Bug同步控制器清理完成');
    } catch (error) {
      logger.error('Bug同步控制器清理失败:', error);
    }
  }
}
