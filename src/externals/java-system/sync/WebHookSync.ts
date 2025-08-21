import { Request, Response } from 'express';
import { generateSignature, checkExpired } from '../utils/signature';
import logger from '../../../utils/logger';

export interface WebHookEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  action: 'created' | 'updated' | 'deleted';
  data: any;
  timestamp: string;
}

export interface WebHookConfig {
  secretKey: string;
  allowedEvents: string[];
  maxTimestampDrift: number; // 允许的时间戳偏移（毫秒）
}

/**
 * WebHook同步处理器
 * 接收Java系统推送的数据变更事件
 */
export class WebHookSync {
  private config: WebHookConfig;

  constructor(config: WebHookConfig) {
    this.config = config;
  }

  /**
   * 处理WebHook请求
   */
  async handleWebHook(req: Request, res: Response): Promise<void> {
    try {
      // 1. 验证请求签名
      const isValid = this.verifySignature(req);
      if (!isValid) {
        logger.warn('WebHook签名验证失败', {
          headers: req.headers,
          url: req.url
        });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // 2. 验证时间戳
      const timestamp = req.headers['x-timestamp'] as string;
      if (checkExpired(timestamp)) {
        logger.warn('WebHook请求时间戳过期', { timestamp });
        res.status(400).json({ error: 'Request expired' });
        return;
      }

      // 3. 解析事件数据
      const event: WebHookEvent = req.body;
      
      // 4. 验证事件类型
      if (!this.isEventAllowed(event)) {
        logger.warn('不允许的WebHook事件类型', { eventType: event.eventType });
        res.status(400).json({ error: 'Event type not allowed' });
        return;
      }

      // 5. 处理事件
      await this.processEvent(event);

      // 6. 返回成功响应
      res.status(200).json({ status: 'success', eventId: event.entityId });

    } catch (error) {
      logger.error('WebHook处理失败:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * 验证请求签名
   */
  private verifySignature(req: Request): boolean {
    const receivedSignature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    const method = req.method;
    const path = req.path;
    const body = req.body;

    if (!receivedSignature || !timestamp) {
      return false;
    }

    const expectedSignature = generateSignature({
      method,
      path,
      timestamp,
      body,
      secret: this.config.secretKey
    });

    return receivedSignature === expectedSignature;
  }

  /**
   * 检查事件是否被允许
   */
  private isEventAllowed(event: WebHookEvent): boolean {
    return this.config.allowedEvents.includes(event.eventType);
  }

  /**
   * 处理具体的事件
   */
  private async processEvent(event: WebHookEvent): Promise<void> {
    logger.info('处理WebHook事件', {
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action
    });

    switch (event.entityType) {
      case 'bug':
        await this.processBugEvent(event);
        break;
      case 'user':
        await this.processUserEvent(event);
        break;
      default:
        logger.warn('未知的实体类型:', event.entityType);
    }
  }

  /**
   * 处理Bug相关事件
   */
  private async processBugEvent(event: WebHookEvent): Promise<void> {
    try {
      switch (event.action) {
        case 'created':
          await this.createLocalBug(event.data);
          break;
        case 'updated':
          await this.updateLocalBug(event.entityId, event.data);
          break;
        case 'deleted':
          await this.deleteLocalBug(event.entityId);
          break;
      }
    } catch (error) {
      logger.error(`处理Bug ${event.action} 事件失败:`, error);
      throw error;
    }
  }

  /**
   * 处理用户相关事件
   */
  private async processUserEvent(event: WebHookEvent): Promise<void> {
    // TODO: 实现用户事件处理逻辑
    logger.info('处理用户事件:', event);
  }

  /**
   * 创建本地Bug记录
   */
  private async createLocalBug(bugData: any): Promise<void> {
    // TODO: 实现创建本地Bug的逻辑
    logger.debug('创建本地Bug:', bugData.id);
  }

  /**
   * 更新本地Bug记录
   */
  private async updateLocalBug(bugId: string, bugData: any): Promise<void> {
    // TODO: 实现更新本地Bug的逻辑
    logger.debug('更新本地Bug:', bugId);
  }

  /**
   * 删除本地Bug记录
   */
  private async deleteLocalBug(bugId: string): Promise<void> {
    // TODO: 实现删除本地Bug的逻辑
    logger.debug('删除本地Bug:', bugId);
  }
}

/**
 * 默认WebHook配置
 */
export const defaultWebHookConfig: WebHookConfig = {
  secretKey: process.env.WEBHOOK_SECRET_KEY || '',
  allowedEvents: ['bug.created', 'bug.updated', 'bug.deleted'],
  maxTimestampDrift: 5 * 60 * 1000 // 5分钟
};
