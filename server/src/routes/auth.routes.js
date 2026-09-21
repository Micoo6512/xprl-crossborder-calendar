import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/auth.controller.js';
import { authRequired } from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

const accountRules = body('account')
  .isString()
  .trim()
  .isLength({ min: 3, max: 20 })
  .withMessage('账号长度需为 3–20 个字符');

const passwordRules = body('password')
  .isString()
  .isLength({ min: 6, max: 32 })
  .withMessage('密码长度需为 6–32 个字符');

router.post('/register', [accountRules, passwordRules, validateRequest], register);
router.post('/login', [accountRules, passwordRules, validateRequest], login);
router.get('/me', authRequired, me);

export default router;
