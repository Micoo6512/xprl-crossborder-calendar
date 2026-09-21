import { Router } from 'express';
import { listFestivals, getFestivalDetail } from '../controllers/festival.controller.js';
import { attachUser } from '../middleware/auth.js';

const router = Router();

// 访客可读，attachUser 用于识别登录身份与会员权限
router.get('/', attachUser, listFestivals);
router.get('/:id', attachUser, getFestivalDetail);

export default router;
