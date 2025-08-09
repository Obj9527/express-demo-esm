import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { generateSignature } from './utils/signature';
import { ExternalErrorHandler } from './utils/externalErrorHandler';

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

  // 获取 bugs 列表
  async getBugs(page: number = 1, pageSize: number = 10) {
    try {
      const response = await this.client.post('/bugs/getbugs', {
        page: page,
        pageSize: pageSize,
      });

      return response.data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: 'Java主系统',
        operation: '获取bugs',
        requestData: { page, pageSize }
      });
    }
  }

  // 通知Java主系统bug已解决或者标记为非bug
  async resolveBug(bugId: string, resolutionData: any) {
    try {
      const response = await this.client.post(
        `/bugs/${bugId}/resolve`,
        resolutionData
      );
      return response.data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: 'Java主系统',
        operation: '通知bug已解决',
        requestData: { bugId, resolutionData }
      });
    }
  }

  // 批量通知Java主系统bug已解决或者标记为非bug
  async batchResolveBugs(bugIds: string[], resolutionData: any) {
    try {
      const response = await this.client.post(`/bugs/batch/resolve`, {
        bugIds,
        resolutionData,
      });
      return response.data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: 'Java主系统',
        operation: '批量通知bug已解决',
        requestData: { bugIds, resolutionData }
      });
    }
  }
}

export default BugApiClient;
