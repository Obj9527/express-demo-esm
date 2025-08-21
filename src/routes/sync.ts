import { Router } from 'express';
import { SyncController } from '../controllers/syncController';

const router = Router();
const syncController = new SyncController();

// 同步状态查询
router.get('/sync/status', syncController.getSyncStatus.bind(syncController));

// 同步历史查询
router.get('/sync/history', syncController.getSyncHistory.bind(syncController));

// 手动触发同步
router.post('/sync/trigger', syncController.triggerSync.bind(syncController));

// 切换同步策略
router.post('/sync/strategy', syncController.switchStrategy.bind(syncController));

// WebHook接收端点
router.post('/sync/webhook', syncController.handleWebHook.bind(syncController));

// 性能指标
router.get('/sync/metrics', syncController.getMetrics.bind(syncController));

export default router;
