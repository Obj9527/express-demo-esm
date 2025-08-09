import { Request, Response } from 'express';
import { JavaSystemIntegration } from '../externals/java-system';
import { BugListQuery, BugResolutionData } from '../externals/java-system/services/BugService';

// 扩展Request类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

/**
 * Bug管理控制器
 * 处理来自前端的Bug相关请求
 */
export class BugController {
  
  /**
   * 获取Bug列表
   */
  async getBugs(req: Request, res: Response) {
    try {
      const query: BugListQuery = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
      };

      const bugService = JavaSystemIntegration.getInstance().getBugService();
      const result = await bugService.getBugs(query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取Bug列表失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 获取Bug详情
   */
  async getBugDetail(req: Request, res: Response) {
    try {
      const { bugId } = req.params;
      
      const bugService = JavaSystemIntegration.getInstance().getBugService();
      const result = await bugService.getBugDetail(bugId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取Bug详情失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 标记Bug为已解决
   */
  async resolveBug(req: AuthenticatedRequest, res: Response) {
    try {
      const { bugId } = req.params;
      const resolutionData: BugResolutionData = {
        status: req.body.status,
        comment: req.body.comment,
        resolvedBy: req.body.resolvedBy || req.user?.id || 'unknown',
        resolvedAt: new Date().toISOString(),
      };

      const bugService = JavaSystemIntegration.getInstance().getBugService();
      const result = await bugService.resolveBug(bugId, resolutionData);

      res.json({
        success: true,
        data: result,
        message: 'Bug已标记为解决',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '标记Bug解决失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 批量标记Bug为已解决
   */
  async batchResolveBugs(req: AuthenticatedRequest, res: Response) {
    try {
      const { bugIds, status, comment } = req.body;
      
      const batchData = {
        bugIds,
        status,
        comment,
        resolvedBy: req.user?.id || 'unknown',
        resolvedAt: new Date().toISOString(),
      };

      const bugService = JavaSystemIntegration.getInstance().getBugService();
      const result = await bugService.batchResolveBugs(batchData);

      res.json({
        success: true,
        data: result,
        message: `已批量标记 ${bugIds.length} 个Bug为解决`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '批量标记Bug解决失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
}
