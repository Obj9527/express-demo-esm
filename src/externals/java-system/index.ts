import BugApiClient from './clients/BugApiClient';
import BugService from './services/BugService';

/**
 * Java主系统集成配置和初始化
 */
export class JavaSystemIntegration {
  private static instance: JavaSystemIntegration;
  private bugApiClient: BugApiClient;
  private bugService: BugService;

  private constructor(baseURL: string, apiKey: string, secretKey: string) {
    // 初始化客户端
    this.bugApiClient = new BugApiClient(baseURL, apiKey, secretKey);
    // 初始化服务
    this.bugService = new BugService(this.bugApiClient);
  }

  public static getInstance(baseURL?: string, apiKey?: string, secretKey?: string): JavaSystemIntegration {
    if (!JavaSystemIntegration.instance) {
      if (!baseURL || !apiKey || !secretKey) {
        throw new Error('Java系统集成未初始化，请提供必要的配置参数');
      }
      JavaSystemIntegration.instance = new JavaSystemIntegration(baseURL, apiKey, secretKey);
    }
    return JavaSystemIntegration.instance;
  }

  /**
   * 获取Bug服务实例
   */
  public getBugService(): BugService {
    return this.bugService;
  }

  /**
   * 获取底层API客户端（一般不建议直接使用）
   */
  public getBugApiClient(): BugApiClient {
    return this.bugApiClient;
  }
}

// 导出便捷的服务获取函数
export const getJavaBugService = () => {
  return JavaSystemIntegration.getInstance().getBugService();
};

// 导出类型
export * from './services/BugService';
export { default as BugService } from './services/BugService';
export { default as BugApiClient } from './clients/BugApiClient';
