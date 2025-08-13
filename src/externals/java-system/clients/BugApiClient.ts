import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { generateSignature } from '../utils/signature';
import { ExternalErrorHandler } from '../utils/externalErrorHandler';

/**
 * Java主系统Bug API客户端
 * 负责底层HTTP通信和认证
 */
class BugApiClient {
  private baseURL: string;
  private apiKey: string;
  private secret: string;
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey: string, secretKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.secret = secretKey;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });

    // 添加请求拦截器，自动添加签名头
    this.setupRequestInterceptor();
    // 添加响应拦截器，统一处理错误
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const timestamp = Date.now().toString();
        const method = config.method?.toUpperCase() || 'GET';
        const path = config.url || '';

        // 获取请求体，GET 请求没有 body
        let body = '';
        if (config.data) {
          body =
            typeof config.data === 'string'
              ? config.data
              : JSON.stringify(config.data);
        }

        // 生成签名
        const signature = generateSignature({
          method,
          path,
          timestamp,
          body,
          secret: this.secret,
        });

        // 添加必需的头部
        config.headers.set('x-api-key', this.apiKey);
        config.headers.set('x-timestamp', timestamp);
        config.headers.set('x-signature', signature);
        config.headers.set('Content-Type', 'application/json');

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptor() {
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // 成功响应直接返回
        return response;
      },
      (error: AxiosError) => {
        // 根据请求路径和方法确定操作类型
        const operation = this.getOperationFromRequest(error.config);
        
        // 统一处理错误
        const standardizedError = ExternalErrorHandler.handle(error, {
          service: 'Java主系统',
          operation,
          requestData: error.config?.data
        });
        
        // 返回Promise.reject，让上层能够捕获到标准化的错误
        return Promise.reject(standardizedError);
      }
    );
  }

  /**
   * 根据请求配置确定操作类型
   */
  private getOperationFromRequest(config?: InternalAxiosRequestConfig): string {
    if (!config) return '未知操作';
    
    const method = config.method?.toUpperCase();
    const url = config.url || '';
    
    // 根据URL和方法确定具体操作
    if (url.includes('/bugs/getbugs')) {
      return '获取bugs列表';
    } else if (url.includes('/bugs/batch/resolve')) {
      return '批量标记bug已解决';
    } else if (url.match(/\/bugs\/[^/]+\/resolve$/)) {
      return '标记bug已解决';
    } else if (url.match(/\/bugs\/[^/]+$/)) {
      if (method === 'GET') {
        return '获取bug详情';
      }
    }
    
    // 默认根据方法返回通用操作名
    switch (method) {
      case 'GET':
        return '获取数据';
      case 'POST':
        return '创建/提交数据';
      case 'PUT':
        return '更新数据';
      case 'DELETE':
        return '删除数据';
      default:
        return '执行操作';
    }
  }

  /**
   * 发送POST请求到bugs相关接口
   */
  async post(url: string, data?: any) {
    const response = await this.client.post(url, data);
    return response.data;
  }

  /**
   * 发送GET请求到bugs相关接口
   */
  async get(url: string) {
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * 发送PUT请求到bugs相关接口
   */
  async put(url: string, data?: any) {
    const response = await this.client.put(url, data);
    return response.data;
  }

  /**
   * 发送DELETE请求到bugs相关接口
   */
  async delete(url: string) {
    const response = await this.client.delete(url);
    return response.data;
  }
}

export default BugApiClient;
