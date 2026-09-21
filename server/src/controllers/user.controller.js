import * as userService from '../services/user.service.js';
import { success } from '../utils/response.js';
import AppError from '../utils/AppError.js';

export async function getProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.id);
    if (!profile) throw AppError.notFound('用户不存在', 'USER_NOT_FOUND');
    return success(res, profile);
  } catch (error) {
    next(error);
  }
}

export async function getOrders(req, res, next) {
  try {
    const orders = await userService.getUserOrders(req.user.id);
    return success(res, orders);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    await userService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
    return success(res, null, '密码修改成功');
  } catch (error) {
    next(error);
  }
}
