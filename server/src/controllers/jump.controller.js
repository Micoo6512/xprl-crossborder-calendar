import * as jumpService from '../services/jump.service.js';
import { success } from '../utils/response.js';

export async function createSearchJump(req, res, next) {
  try {
    const result = await jumpService.createSearchJump(req.body, req.user);
    return success(res, result);
  } catch (error) {
    next(error);
  }
}
