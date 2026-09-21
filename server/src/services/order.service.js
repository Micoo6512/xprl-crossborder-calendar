import * as orderRepo from '../repositories/order.repository.js';
import pool, { withTransaction } from '../db/pool.js';
import { PLANS, getPlan } from '../constants/plans.js';
import * as paymentGateway from './paymentGateway.js';
import { activateMembership } from './membership.service.js';
import AppError from '../utils/AppError.js';

export function listPlans() {
  return PLANS;
}

/**
 * 创建订单（幂等）：同方案存在未支付订单则直接复用。
 */
export async function createOrder(userId, planCode) {
  const plan = getPlan(planCode);
  if (!plan) throw AppError.badRequest('方案不存在', 'INVALID_PLAN');

  // 事务内查重 + 插入，避免并发产生重复待支付订单
  const orderRow = await withTransaction(async (conn) => {
    const pending = await orderRepo.findPendingOrder(conn, userId, planCode);
    if (pending) return pending;

    const orderId = await orderRepo.createOrder(conn, userId, planCode, plan.price);
    return orderRepo.findById(conn, orderId);
  });

  const payment = await paymentGateway.createPayment(orderRow);
  return { order: serializeOrder(orderRow), payment };
}

/**
 * 模拟支付成功回调：订单置已支付 + 开通会员，事务保证一致性。
 */
export async function payOrder(userId, orderId) {
  // 快速预检归属，状态复核在事务行锁内完成，防止并发回调重复开通会员
  const preview = await orderRepo.findById(pool, orderId);
  if (!preview) throw AppError.notFound('订单不存在', 'ORDER_NOT_FOUND');
  if (preview.user_id !== userId) throw AppError.forbidden('无权操作该订单', 'ORDER_FORBIDDEN');

  let expireDate;
  await withTransaction(async (conn) => {
    const order = await orderRepo.findByIdForUpdate(conn, orderId);
    if (!order) throw AppError.notFound('订单不存在', 'ORDER_NOT_FOUND');
    if (order.user_id !== userId) throw AppError.forbidden('无权操作该订单', 'ORDER_FORBIDDEN');
    if (order.status === 'paid') {
      throw AppError.conflict('订单已支付，请勿重复操作', 'ORDER_ALREADY_PAID');
    }
    if (order.status !== 'pending') {
      throw AppError.badRequest('订单状态异常', 'ORDER_BAD_STATUS');
    }

    const plan = getPlan(order.plan_code);
    const callback = await paymentGateway.verifyCallback({ order });
    if (!callback.success) throw AppError.badRequest('支付未成功', 'PAYMENT_FAILED');

    const paidResult = await orderRepo.markPaid(conn, orderId);
    if (paidResult.rowCount !== 1) {
      throw AppError.conflict('订单已支付，请勿重复操作', 'ORDER_ALREADY_PAID');
    }
    expireDate = await activateMembership(conn, userId, plan.durationDays);
  });

  return {
    order: serializeOrder(await orderRepo.findById(pool, orderId)),
    membershipExpire: expireDate,
    isMember: true,
  };
}

export function serializeOrder(row) {
  return {
    id: row.id,
    planCode: row.plan_code,
    planName: getPlan(row.plan_code)?.name || row.plan_code,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at || null,
  };
}
