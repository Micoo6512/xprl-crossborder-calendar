import * as orderService from '../services/order.service.js';
import { success } from '../utils/response.js';

export async function listPlans(req, res, next) {
  try {
    return success(res, orderService.listPlans());
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  try {
    const result = await orderService.createOrder(req.user.id, req.body.planCode);
    return success(res, result, '下单成功', 201);
  } catch (error) {
    next(error);
  }
}

export async function payOrder(req, res, next) {
  try {
    const result = await orderService.payOrder(req.user.id, req.params.id);
    return success(res, result, '支付成功，会员已开通');
  } catch (error) {
    next(error);
  }
}
