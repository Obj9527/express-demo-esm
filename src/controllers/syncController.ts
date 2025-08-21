import { Request, Response } from 'express';
import { SyncManager, defaultSyncManagerConfig, SyncStrategy } from '../externals/java-system/sync/SyncManager';
import logger from '../utils/logger';

/**
 * 同步控制器
 * 处理同步相关的HTTP请求
 */
export class SyncController {
  private syncManager: SyncManager;

  constructor() {
    this.syncManager = new SyncManager(defaultSyncManagerConfig);
    this.initializeSyncManager();
  }

  /**
   * 初始化同步管理器
   */
  private async initializeSyncManager(): Promise<void> {
    try {
      await this.syncManager.start();
      logger.info('同步管理器初始化完成');
    } catch (error) {
      logger.error('同步管理器初始化失败:', error);
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.syncManager.getSyncStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('获取同步状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取同步状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取同步历史
   */
  async getSyncHistory(req: Request, res: Response): Promise<void> {
    try {
      const { tableName, limit = 100 } = req.query;
      
      // TODO: 实现从数据库查询同步历史的逻辑
      const history: any[] = [];

      res.json({
        success: true,
        data: {
          history,
          total: history.length,
          tableName: tableName || 'all',
          limit: Number(limit)
        }
      });
    } catch (error) {
      logger.error('获取同步历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取同步历史失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 手动触发同步
   */
  async triggerSync(req: Request, res: Response): Promise<void> {
    try {
      await this.syncManager.triggerSync();
      
      res.json({
        success: true,
        message: '同步已触发',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('触发同步失败:', error);
      res.status(500).json({
        success: false,
        message: '触发同步失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 切换同步策略
   */
  async switchStrategy(req: Request, res: Response): Promise<void> {
    try {
      const { strategy } = req.body;
      
      // 验证策略参数
      const validStrategies: SyncStrategy[] = ['polling', 'webhook', 'incremental', 'hybrid'];
      if (!validStrategies.includes(strategy)) {
        res.status(400).json({
          success: false,
          message: '无效的同步策略',
          validStrategies
        });
        return;
      }

      await this.syncManager.switchStrategy(strategy);
      
      res.json({
        success: true,
        message: `同步策略已切换为: ${strategy}`,
        newStrategy: strategy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('切换同步策略失败:', error);
      res.status(500).json({
        success: false,
        message: '切换同步策略失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 处理WebHook请求
   */
  async handleWebHook(req: Request, res: Response): Promise<void> {
    try {
      // 获取WebHook处理器并调用
      const webHookHandler = this.syncManager.getWebHookHandler();
      await webHookHandler(req, res);
    } catch (error) {
      logger.error('WebHook处理失败:', error);
      res.status(500).json({
        success: false,
        message: 'WebHook处理失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 获取性能指标
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.syncManager.getPerformanceMetrics();
      
      res.json({
        success: true,
        data: {
          metrics,
          timestamp: new Date().toISOString(),
          summary: this.calculateMetricsSummary(metrics)
        }
      });
    } catch (error) {
      logger.error('获取性能指标失败:', error);
      res.status(500).json({
        success: false,
        message: '获取性能指标失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 计算指标摘要
   */
  private calculateMetricsSummary(metrics: any): any {
    const strategies = Object.keys(metrics);
    
    if (strategies.length === 0) {
      return {
        totalStrategies: 0,
        averageSuccessRate: 0,
        averageResponseTime: 0,
        totalFailures: 0
      };
    }

    const successRates = strategies.map(s => metrics[s].successRate || 0);
    const responseTimes = strategies.map(s => metrics[s].avgResponseTime || 0);
    const failures = strategies.map(s => metrics[s].failureCount || 0);

    return {
      totalStrategies: strategies.length,
      averageSuccessRate: successRates.reduce((a, b) => a + b, 0) / strategies.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / strategies.length,
      totalFailures: failures.reduce((a, b) => a + b, 0)
    };
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      await this.syncManager.stop();
      logger.info('同步控制器清理完成');
    } catch (error) {
      logger.error('同步控制器清理失败:', error);
    }
  }
}
