import { Router } from 'express';
import { BugSyncController } from '../controllers/bugSyncController';

const router = Router();
const bugSyncController = new BugSyncController();

// Bug同步状态查询
router.get('/sync/status', bugSyncController.getBugSyncStatus.bind(bugSyncController));

// 手动触发Bug同步
router.post('/sync/trigger', bugSyncController.triggerBugSync.bind(bugSyncController));

// Bug WebHook接收端点
router.post('/sync/webhook', bugSyncController.handleBugWebHook.bind(bugSyncController));

// 停止Bug同步服务
router.post('/sync/stop', bugSyncController.stopBugSync.bind(bugSyncController));

// 重启Bug同步服务
router.post('/sync/restart', bugSyncController.restartBugSync.bind(bugSyncController));

// Bug同步服务健康检查
router.get('/sync/health', bugSyncController.healthCheck.bind(bugSyncController));

export default router;
