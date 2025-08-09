import * as Sentry from '@sentry/node';
import logger from '../../../utils/logger';

export interface ExternalError {
  message: string;
  status?: number;
  data?: any;
  url?: string;
  method?: string;
  code?: string;
}

export interface ExternalErrorContext {
  service: string;
  operation: string;
  requestData?: any;
  [key: string]: any;
}

export class ExternalErrorHandler {
  /**
   * 统一处理外部系统错误
   * @param error 原始错误对象
   * @param context 错误上下文信息
   * @returns 标准化的错误响应
   */
  static handle(error: any, context: ExternalErrorContext) {
    const standardError = this.parseError(error);
    
    // 1. 记录详细日志
    this.logError(standardError, context);
    
    // 2. 上报到 Sentry
    this.reportToSentry(standardError, context);
    
    // 3. 返回标准化响应
    return this.createResponse(standardError, context);
  }

  /**
   * 解析不同类型的错误
   */
  private static parseError(error: any): ExternalError {
    // Axios 错误
    if (error.response) {
      return {
        message: error.message || 'HTTP请求失败',
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        code: error.code
      };
    }
    
    // 网络错误
    if (error.code === 'ECONNABORTED') {
      return {
        message: '请求超时',
        code: 'TIMEOUT'
      };
    }
    
    if (error.code === 'ECONNREFUSED') {
      return {
        message: '连接被拒绝',
        code: 'CONNECTION_REFUSED'
      };
    }
    
    // 其他错误
    return {
      message: error.message || '未知错误',
      code: error.code || 'UNKNOWN'
    };
  }

  /**
   * 记录错误日志
   */
  private static logError(error: ExternalError, context: ExternalErrorContext) {
    const logData = {
      service: context.service,
      operation: context.operation,
      error: {
        message: error.message,
        status: error.status,
        code: error.code,
        url: error.url,
        method: error.method
      },
      requestData: context.requestData,
      context: { ...context, requestData: undefined }
    };

    // 根据错误严重程度选择日志级别
    if (error.status && error.status >= 500) {
      logger.error(`外部系统错误 - ${context.service}:${context.operation}`, logData);
    } else if (error.status && error.status >= 400) {
      logger.warn(`外部系统客户端错误 - ${context.service}:${context.operation}`, logData);
    } else {
      logger.error(`外部系统网络错误 - ${context.service}:${context.operation}`, logData);
    }
  }

  /**
   * 上报到 Sentry
   */
  private static reportToSentry(error: ExternalError, context: ExternalErrorContext) {
    // 设置错误标签
    Sentry.setTag('error_type', 'external_system');
    Sentry.setTag('service', context.service);
    Sentry.setTag('operation', context.operation);
    
    // 设置错误上下文
    Sentry.setContext('external_error', {
      service: context.service,
      operation: context.operation,
      status: error.status,
      code: error.code,
      url: error.url,
      method: error.method
    });
    
    // 设置请求数据（脱敏）
    if (context.requestData) {
      Sentry.setContext('request_data', this.sanitizeData(context.requestData));
    }
    
    // 根据错误类型决定是否上报
    if (this.shouldReportToSentry(error)) {
      const sentryError = new Error(`${context.service} ${context.operation} 失败: ${error.message}`);
      sentryError.name = 'ExternalSystemError';
      
      Sentry.captureException(sentryError);
    }
  }

  /**
   * 判断是否需要上报到 Sentry
   */
  private static shouldReportToSentry(error: ExternalError): boolean {
    // 5xx 服务器错误需要上报
    if (error.status && error.status >= 500) {
      return true;
    }
    
    // 网络错误需要上报
    if (['TIMEOUT', 'CONNECTION_REFUSED', 'ENOTFOUND'].includes(error.code || '')) {
      return true;
    }
    
    // 4xx 客户端错误通常不上报（除非是认证问题）
    if (error.status === 401 || error.status === 403) {
      return true;
    }
    
    return false;
  }

  /**
   * 数据脱敏处理
   */
  private static sanitizeData(data: any): any {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***MASKED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }

  /**
   * 创建标准化响应
   */
  private static createResponse(error: ExternalError, context: ExternalErrorContext) {
    return {
      success: false,
      error: `${context.service}${context.operation}失败`,
      code: error.code || 'EXTERNAL_ERROR',
      details: error.data || error.message,
      timestamp: new Date().toISOString()
    };
  }
}
