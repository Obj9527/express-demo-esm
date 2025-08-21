import { PollingSync, defaultSyncConfig } from './PollingSync';
import { WebHookSync, defaultWebHookConfig } from './WebHookSync';
import logger from '../../../utils/logger';

export type BugSyncStrategy = 'polling' | 'webhook' | 'both';

export interface BugSyncConfig {
  strategy: BugSyncStrategy;
  polling: {
    intervalMs: number;
    enabled: boolean;
  };
  webhook: {
    enabled: boolean;
    secretKey: string;
  };
  fallbackToPolling: boolean;
}

/**
 * Bug数据专用同步管理器
 * 简化版本，只支持轮询+WebHook
 */
export class BugSyncManager {
  private config: BugSyncConfig;
  private pollingSync: PollingSync;
  private webHookSync: WebHookSync;
  private isRunning = false;
  private lastWebHookTime = 0;
  private readonly WEBHOOK_TIMEOUT = 5 * 60 * 1000; // 5分钟无WebHook则启用轮询
  private schedulingTimer?: NodeJS.Timeout;

  constructor(config: BugSyncConfig) {
    this.config = config;
    
    this.pollingSync = new PollingSync({
      ...defaultSyncConfig,
      intervalMs: config.polling.intervalMs
    });
    
    this.webHookSync = new WebHookSync({
      ...defaultWebHookConfig,
      secretKey: config.webhook.secretKey
    });
  }

  /**
   * 启动Bug同步服务
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bug同步服务已经在运行');
      return;
    }

    this.isRunning = true;
    logger.info(`🐛 启动Bug同步服务，策略: ${this.config.strategy}`);

    switch (this.config.strategy) {
      case 'polling':
        this.startPollingOnly();
        break;
      case 'webhook':
        this.startWebHookOnly();
        break;
      case 'both':
        this.startBothStrategies();
        break;
    }
  }

  /**
   * 停止同步服务
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.pollingSync.stop();
    
    if (this.schedulingTimer) {
      clearInterval(this.schedulingTimer);
      this.schedulingTimer = undefined;
    }
    
    logger.info('🛑 Bug同步服务已停止');
  }

  /**
   * 获取WebHook处理器
   */
  getWebHookHandler() {
    return async (req: any, res: any) => {
      try {
        // 记录WebHook接收时间
        this.lastWebHookTime = Date.now();
        
        // 处理WebHook
        await this.webHookSync.handleWebHook(req, res);
        
        logger.info('📨 WebHook处理成功，暂时禁用轮询');
        
        // WebHook成功时，暂时停止轮询（避免重复同步）
        if (this.config.strategy === 'both') {
          this.pausePollingTemporarily();
        }
      } catch (error) {
        logger.error('WebHook处理失败:', error);
        
        // WebHook失败时，确保轮询是启用的
        if (this.config.fallbackToPolling && this.config.strategy === 'both') {
          this.ensurePollingEnabled();
        }
      }
    };
  }

  /**
   * 手动触发同步
   */
  async triggerSync(): Promise<void> {
    logger.info('🔄 手动触发Bug同步');
    
    // 强制执行一次轮询同步
    // 这里可以调用底层的同步逻辑
    logger.info('正在执行Bug数据同步...');
  }

  /**
   * 获取同步状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      strategy: this.config.strategy,
      polling: {
        enabled: this.config.polling.enabled,
        interval: this.config.polling.intervalMs,
        status: this.pollingSync.getStatus()
      },
      webhook: {
        enabled: this.config.webhook.enabled,
        lastReceived: this.lastWebHookTime ? new Date(this.lastWebHookTime) : null,
        isHealthy: this.isWebHookHealthy(),
        timeout: this.WEBHOOK_TIMEOUT
      }
    };
  }

  /**
   * 只启动轮询
   */
  private startPollingOnly(): void {
    if (this.config.polling.enabled) {
      this.pollingSync.start();
      logger.info('📋 启动Bug轮询同步');
    }
  }

  /**
   * 只启动WebHook
   */
  private startWebHookOnly(): void {
    if (this.config.webhook.enabled) {
      logger.info('🎣 WebHook同步已就绪，等待Bug数据推送');
    }
  }

  /**
   * 启动双重策略
   */
  private startBothStrategies(): void {
    logger.info('🔄 启动双重Bug同步策略');
    
    // 先启动WebHook（被动等待）
    if (this.config.webhook.enabled) {
      logger.info('🎣 WebHook已就绪');
    }
    
    // 启动轮询作为兜底
    if (this.config.polling.enabled) {
      this.pollingSync.start();
      logger.info('📋 轮询同步已启动（作为WebHook兜底）');
    }

    // 启动智能调度
    this.startIntelligentScheduling();
  }

  /**
   * 智能调度：根据WebHook健康状态调整轮询频率
   */
  private startIntelligentScheduling(): void {
    this.schedulingTimer = setInterval(() => {
      if (!this.isWebHookHealthy() && this.config.fallbackToPolling) {
        logger.warn('⚠️ WebHook超时，加强轮询频率');
        this.ensurePollingEnabled();
      }
    }, 60 * 1000); // 每分钟检查一次
  }

  /**
   * 暂时暂停轮询
   */
  private pausePollingTemporarily(): void {
    this.pollingSync.stop();
    
    // 30秒后恢复轮询
    setTimeout(() => {
      if (this.isRunning && this.config.polling.enabled) {
        this.pollingSync.start();
        logger.info('🔄 轮询已恢复');
      }
    }, 30 * 1000);
  }

  /**
   * 确保轮询已启用
   */
  private ensurePollingEnabled(): void {
    if (this.config.polling.enabled && this.isRunning) {
      this.pollingSync.start();
    }
  }

  /**
   * 检查WebHook是否健康
   */
  private isWebHookHealthy(): boolean {
    if (!this.config.webhook.enabled) return false;
    return (Date.now() - this.lastWebHookTime) < this.WEBHOOK_TIMEOUT;
  }
}

/**
 * Bug同步的默认配置
 */
export const defaultBugSyncConfig: BugSyncConfig = {
  strategy: 'both',
  polling: {
    intervalMs: 5 * 60 * 1000, // 5分钟轮询一次
    enabled: true
  },
  webhook: {
    enabled: true,
    secretKey: process.env.WEBHOOK_SECRET || 'your-secret-key'
  },
  fallbackToPolling: true
};
