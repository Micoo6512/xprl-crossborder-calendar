import { verifyToken } from '../utils/token.js';
import AppError from '../utils/AppError.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** 必须登录：无 Token 或 Token 非法一律 401 */
export function authRequired(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw AppError.unauthorized();
    req.user = verifyToken(token);
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(AppError.unauthorized());
  }
}

/**
 * 可选鉴权：Token 合法则挂载 req.user，访客身份继续放行。
 * 用于免费/访客均可读的节日接口。
 */
export function attachUser(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  }
  next();
}
