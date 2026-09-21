import { fail } from '../utils/response.js';
import AppError from '../utils/AppError.js';

/**
 * 全局错误处理：区分业务异常、参数校验异常与未知异常。
 * eslint-disable-next-line no-unused-vars
 */
export default function errorHandler(error, req, res, next) {
  if (error instanceof AppError) {
    return fail(res, error.message, error.code, error.statusCode);
  }

  // express-validator 抛出的数组型校验错误
  if (Array.isArray(error?.errors)) {
    const detail = error.errors[0];
    return fail(res, detail?.msg || '请求参数不合法', 'VALIDATION_ERROR', 422);
  }

  // body-parser 解析失败（非法 JSON 等），其自带 status=400
  if (error?.status === 400 || error?.type === 'entity.parse.failed') {
    return fail(res, error.message || '请求体格式错误', 'BAD_REQUEST', 400);
  }

  console.error('[errorHandler]', error);
  return fail(res, '服务器内部错误', 'INTERNAL_ERROR', 500);
}
