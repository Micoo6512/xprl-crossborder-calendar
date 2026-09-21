import { fail } from '../utils/response.js';

export default function notFound(req, res) {
  return fail(res, `接口不存在：${req.method} ${req.originalUrl}`, 'NOT_FOUND', 404);
}
