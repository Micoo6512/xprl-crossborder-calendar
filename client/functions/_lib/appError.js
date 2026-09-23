/**
 * 业务异常：携带 HTTP 状态码与业务错误码，由全局错误处理统一输出。
 */
export default class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=400]
   * @param {string} [code='BAD_REQUEST']
   */
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = '未登录或登录已过期', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  static forbidden(message = '无权限执行此操作', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(message = '资源不存在', code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }
}
