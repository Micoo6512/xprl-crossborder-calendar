import { Router } from 'express';
import { body } from 'express-validator';
import { createSearchJump } from '../controllers/jump.controller.js';
import { authRequired } from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

router.post(
  '/search-jump',
  authRequired,
  [
    body('goodsId').isInt({ min: 1 }).withMessage('goodsId 非法'),
    body('platform').isString().notEmpty().withMessage('platform 不能为空'),
    validateRequest,
  ],
  createSearchJump,
);

export default router;
