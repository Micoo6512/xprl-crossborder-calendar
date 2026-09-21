import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, getOrders, changePassword } from '../controllers/user.controller.js';
import { authRequired } from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

router.get('/user/profile', authRequired, getProfile);
router.get('/user/orders', authRequired, getOrders);

router.post(
  '/user/password',
  authRequired,
  [
    body('oldPassword')
      .isString()
      .isLength({ min: 6, max: 32 })
      .withMessage('原密码长度需为 6–32 个字符'),
    body('newPassword')
      .isString()
      .isLength({ min: 6, max: 32 })
      .withMessage('新密码长度需为 6–32 个字符'),
    validateRequest,
  ],
  changePassword,
);

export default router;
