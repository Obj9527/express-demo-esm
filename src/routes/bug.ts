import { Router } from 'express';
import { BugController } from '../controllers/bugController';

const router = Router();
const bugController = new BugController();

// Bug列表路由
router.get('/bugs', bugController.getBugs.bind(bugController));

// Bug详情路由
router.get('/bugs/:bugId', bugController.getBugDetail.bind(bugController));

// 标记Bug为已解决
router.post('/bugs/:bugId/resolve', bugController.resolveBug.bind(bugController));

// 批量标记Bug为已解决
router.post('/bugs/batch/resolve', bugController.batchResolveBugs.bind(bugController));

export default router;
