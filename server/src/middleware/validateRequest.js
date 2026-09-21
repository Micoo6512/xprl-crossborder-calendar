import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

/**
 * 消费 express-validator 校验结果：有错误时中断请求，返回统一 400 响应。
 */
export default function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const detail = errors.array()[0];
  return next(AppError.badRequest(detail?.msg || '请求参数不合法', 'VALIDATION_ERROR'));
}
