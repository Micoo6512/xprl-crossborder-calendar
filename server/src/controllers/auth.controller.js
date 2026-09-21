import * as authService from '../services/auth.service.js';
import { success } from '../utils/response.js';

export async function register(req, res, next) {
  try {
    const { account, password } = req.body;
    const result = await authService.register(account, password);
    return success(res, result, '注册成功', 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { account, password } = req.body;
    const result = await authService.login(account, password);
    return success(res, result, '登录成功');
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return success(res, user);
  } catch (error) {
    next(error);
  }
}
