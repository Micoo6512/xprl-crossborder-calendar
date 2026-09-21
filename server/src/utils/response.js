/**
 * 统一成功响应：{ code: 0, message: 'ok', data }
 */
export function success(res, data = null, message = 'ok', statusCode = 200) {
  return res.status(statusCode).json({ code: 0, message, data });
}

/**
 * 统一失败响应：{ code, message, data: null }
 */
export function fail(res, message = 'error', code = 'BAD_REQUEST', statusCode = 400) {
  return res.status(statusCode).json({ code, message, data: null });
}
