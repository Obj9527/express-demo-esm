import BugApiClient from '../clients/BugApiClient';
import { ExternalErrorHandler } from '../utils/externalErrorHandler';

export interface BugListQuery {
  page?: number;
  pageSize?: number;
}

export interface BugResolutionData {
  status: 'resolved' | 'not_a_bug' | 'duplicate';
  comment?: string;
  resolvedBy: string;
  resolvedAt?: string;
}

export interface BatchBugResolutionData extends BugResolutionData {
  bugIds: string[];
}

/**
 * Java主系统Bug业务服务
 * 负责Bug相关的业务逻辑处理
 */
class BugService {
  private client: BugApiClient;

  constructor(client: BugApiClient) {
    this.client = client;
  }

  /**
   * 获取Bug列表
   */
  async getBugs(query: BugListQuery = {}) {
    try {
      const { page = 1, pageSize = 10 } = query;
      
      const data = await this.client.post('/bugs/getbugs', {
        page,
        pageSize,
      });

      return data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: 'Java主系统',
        operation: '获取bugs列表',
        requestData: query
      });
    }
  }

  /**
   * 标记Bug为已解决
   */
  async resolveBug(bugId: string, resolutionData: BugResolutionData) {
    try {
      const data = await this.client.post(
        `/bugs/${bugId}/resolve`,
        resolutionData
      );
      
      return data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: 'Java主系统',
        operation: '标记bug已解决',
        requestData: { bugId, resolutionData }
      });
    }
  }

  /**
   * 批量标记Bug为已解决
   */
  async batchResolveBugs(batchData: BatchBugResolutionData) {
    try {
      const { bugIds, ...resolutionData } = batchData;
      
      const data = await this.client.post('/bugs/batch/resolve', {
        bugIds,
        resolutionData,
      });
      
      return data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: 'Java主系统',
        operation: '批量标记bug已解决',
        requestData: batchData
      });
    }
  }

  /**
   * 获取Bug详情
   */
  async getBugDetail(bugId: string) {
    try {
      const data = await this.client.get(`/bugs/${bugId}`);
      return data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: 'Java主系统',
        operation: '获取bug详情',
        requestData: { bugId }
      });
    }
  }
}

export default BugService;
