import { PollingSync, defaultSyncConfig } from './PollingSync';
import { WebHookSync, defaultWebHookConfig } from './WebHookSync';
import { IncrementalSync, defaultIncrementalSyncConfig } from './IncrementalSync';
import logger from '../../../utils/logger';

export type SyncStrategy = 'polling' | 'webhook' | 'incremental' | 'hybrid';

export interface SyncManagerConfig {
  strategy: SyncStrategy;
  fallbackStrategy?: SyncStrategy;
  enableFailover: boolean;
  healthCheckIntervalMs: number;
}

export interface SyncStatus {
  strategy: SyncStrategy;
  isHealthy: boolean;
  lastSuccessTime: Date;
  failureCount: number;
  performance: {
    avgResponseTime: number;
    successRate: number;
  };
}

/**
 * 同步策略管理器
 * 统一管理多种同步策略，支持策略切换和故障转移
 */
export class SyncManager {
  private config: SyncManagerConfig;
  private pollingSync: PollingSync;
  private webHookSync: WebHookSync;
  private incrementalSync: IncrementalSync;
  private currentStrategy: SyncStrategy;
  private syncStatus: Map<SyncStrategy, SyncStatus> = new Map();
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: SyncManagerConfig) {
    this.config = config;
    this.currentStrategy = config.strategy;

    // 初始化各种同步器
    this.pollingSync = new PollingSync(defaultSyncConfig);
    this.webHookSync = new WebHookSync(defaultWebHookConfig);
    this.incrementalSync = new IncrementalSync(defaultIncrementalSyncConfig);

    // 初始化状态
    this.initializeSyncStatus();
  }

  /**
   * 启动同步管理器
   */
  async start(): Promise<void> {
    logger.info(`启动同步管理器，当前策略: ${this.currentStrategy}`);

    // 启动当前策略
    await this.startStrategy(this.currentStrategy);

    // 启动健康检查
    if (this.config.enableFailover) {
      this.startHealthCheck();
    }
  }

  /**
   * 停止同步管理器
   */
  async stop(): Promise<void> {
    logger.info('停止同步管理器');

    // 停止所有策略
    this.pollingSync.stop();
    this.incrementalSync.stop();
    // WebHook不需要停止，它是被动接收

    // 停止健康检查
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }

  /**
   * 切换同步策略
   */
  async switchStrategy(newStrategy: SyncStrategy): Promise<void> {
    if (newStrategy === this.currentStrategy) {
      logger.warn(`已经是${newStrategy}策略，无需切换`);
      return;
    }

    logger.info(`切换同步策略: ${this.currentStrategy} -> ${newStrategy}`);

    // 停止当前策略
    await this.stopStrategy(this.currentStrategy);

    // 启动新策略
    await this.startStrategy(newStrategy);

    this.currentStrategy = newStrategy;
  }

  /**
   * 获取WebHook处理器（用于路由注册）
   */
  getWebHookHandler() {
    return this.webHookSync.handleWebHook.bind(this.webHookSync);
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): {
    currentStrategy: SyncStrategy;
    allStrategies: Map<SyncStrategy, SyncStatus>;
    isHealthy: boolean;
  } {
    return {
      currentStrategy: this.currentStrategy,
      allStrategies: this.syncStatus,
      isHealthy: this.syncStatus.get(this.currentStrategy)?.isHealthy || false
    };
  }

  /**
   * 手动触发同步
   */
  async triggerSync(): Promise<void> {
    logger.info('手动触发同步');

    switch (this.currentStrategy) {
      case 'polling':
        // 轮询策略会自动执行，这里可以强制执行一次
        logger.info('轮询策略正在后台运行');
        break;
      case 'incremental':
        // 增量同步会自动执行，这里可以强制执行一次
        logger.info('增量同步正在后台运行');
        break;
      case 'webhook':
        logger.info('WebHook策略等待外部系统推送');
        break;
      case 'hybrid':
        // 混合策略可能需要特殊处理
        await this.triggerHybridSync();
        break;
    }
  }

  /**
   * 启动指定策略
   */
  private async startStrategy(strategy: SyncStrategy): Promise<void> {
    switch (strategy) {
      case 'polling':
        this.pollingSync.start();
        break;
      case 'incremental':
        await this.incrementalSync.start();
        break;
      case 'webhook':
        // WebHook是被动的，不需要启动
        logger.info('WebHook策略已就绪，等待接收推送');
        break;
      case 'hybrid':
        // 混合策略同时启动多个
        this.pollingSync.start();
        await this.incrementalSync.start();
        logger.info('混合策略已启动（轮询 + 增量 + WebHook）');
        break;
    }

    this.updateSyncStatus(strategy, { isHealthy: true, lastSuccessTime: new Date() });
  }

  /**
   * 停止指定策略
   */
  private async stopStrategy(strategy: SyncStrategy): Promise<void> {
    switch (strategy) {
      case 'polling':
        this.pollingSync.stop();
        break;
      case 'incremental':
        this.incrementalSync.stop();
        break;
      case 'webhook':
        // WebHook无需主动停止
        break;
      case 'hybrid':
        this.pollingSync.stop();
        this.incrementalSync.stop();
        break;
    }
  }

  /**
   * 初始化同步状态
   */
  private initializeSyncStatus(): void {
    const strategies: SyncStrategy[] = ['polling', 'webhook', 'incremental', 'hybrid'];
    
    strategies.forEach(strategy => {
      this.syncStatus.set(strategy, {
        strategy,
        isHealthy: false,
        lastSuccessTime: new Date(),
        failureCount: 0,
        performance: {
          avgResponseTime: 0,
          successRate: 100
        }
      });
    });
  }

  /**
   * 更新同步状态
   */
  private updateSyncStatus(strategy: SyncStrategy, updates: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatus.get(strategy);
    if (currentStatus) {
      this.syncStatus.set(strategy, { ...currentStatus, ...updates });
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const currentStatus = this.syncStatus.get(this.currentStrategy);
    
    if (!currentStatus || !currentStatus.isHealthy) {
      logger.warn(`当前策略 ${this.currentStrategy} 不健康，准备故障转移`);
      
      if (this.config.fallbackStrategy) {
        await this.switchStrategy(this.config.fallbackStrategy);
      }
    }
  }

  /**
   * 触发混合同步
   */
  private async triggerHybridSync(): Promise<void> {
    logger.info('触发混合同步');
    // 在混合模式下，可以同时使用多种策略
    // 例如：关键数据用WebHook实时同步，定期用增量同步做完整性检查
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): { [key in SyncStrategy]?: any } {
    const metrics: { [key in SyncStrategy]?: any } = {};

    this.syncStatus.forEach((status, strategy) => {
      metrics[strategy] = {
        successRate: status.performance.successRate,
        avgResponseTime: status.performance.avgResponseTime,
        failureCount: status.failureCount,
        lastSuccessTime: status.lastSuccessTime
      };
    });

    return metrics;
  }
}

/**
 * 默认同步管理器配置
 */
export const defaultSyncManagerConfig: SyncManagerConfig = {
  strategy: 'hybrid',
  fallbackStrategy: 'polling',
  enableFailover: true,
  healthCheckIntervalMs: 60 * 1000 // 1分钟检查一次
};
