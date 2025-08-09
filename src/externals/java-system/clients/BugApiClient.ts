import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { generateSignature } from '../utils/signature';

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
