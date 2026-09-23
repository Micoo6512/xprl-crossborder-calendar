import * as orderRepo from '../repositories/order.repository.js';
import { query } from '../db.js';
import { PLANS, getPlan } from '../constants/plans.js';
import { parseDate, formatDate } from '../dateUtils.js';
import * as paymentGateway from './paymentGateway.js';
import AppError from '../appError.js';

export function listPlans() {
  return PLANS;
}

/** 读取用户当前会员到期日（YYYY-MM-DD），无则 null。 */
async function readMembershipExpire(userId) {
  const rows = await query('SELECT membership_expire FROM "user" WHERE id = ?', [userId]);
  const current = rows[0]?.membership_expire;
  return current ? formatDate(parseDate(current)) : null;
}

/** 组装「已支付」结果（供首次成功、重复支付、并发命中各分支统一返回）。 */
async function buildPaidResult(orderRow, userId) {
  return {
    order: serializeOrder(orderRow),
    membershipExpire: await readMembershipExpire(userId),
    isMember: true,
  };
}

/**
 * 创建订单（幂等）：同方案已有未支付订单则直接复用。
 */
export async function createOrder(userId, planCode) {
  const plan = getPlan(planCode);
  if (!plan) throw AppError.badRequest('方案不存在', 'INVALID_PLAN');

  let orderRow = await orderRepo.findPending(userId, planCode);

  if (!orderRow) {
    try {
      const orderId = await orderRepo.insertOrder(userId, planCode, plan.price);
      orderRow = await orderRepo.findById(orderId);
    } catch (error) {
      // 并发双击/并发请求：部分唯一索引拒绝重复 pending（23505），回查复用即可
      if (error?.code === '23505') {
        orderRow = await orderRepo.findPending(userId, planCode);
      } else {
        throw error;
      }
    }
  }

  const payment = await paymentGateway.createPayment(orderRow);
  return { order: serializeOrder(orderRow), payment };
}

/**
 * 模拟支付成功回调：订单置已支付 + 开通会员（单条可写 CTE 原子完成）。
 */
export async function payOrder(userId, orderId) {
  // 预检：归属与状态（HTTP 读）；并发状态复核由 CTE 的条件更新兜底
  const preview = await orderRepo.findById(orderId);
  if (!preview) throw AppError.notFound('订单不存在', 'ORDER_NOT_FOUND');
  if (preview.user_id !== userId) throw AppError.forbidden('无权操作该订单', 'ORDER_FORBIDDEN');

  // 幂等：重复点击/并发回调时订单已支付 → 直接返回成功，不再重复开通
  if (preview.status === 'paid') {
    return buildPaidResult(preview, userId);
  }
  if (preview.status !== 'pending') {
    throw AppError.badRequest('订单状态异常', 'ORDER_BAD_STATUS');
  }

  const callback = await paymentGateway.verifyCallback({ order: preview });
  if (!callback.success) throw AppError.badRequest('支付未成功', 'PAYMENT_FAILED');

  const plan = getPlan(preview.plan_code);
  // 支付时间戳（'YYYY-MM-DD HH:MM:SS'，UTC，与 D1 datetime('now') 格式一致），
  // 由两语句共享以建立「本次支付」关联，防止重复开通
  const paidAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const granted = await orderRepo.payAndGrant(orderId, userId, plan.durationDays, paidAt);

  // 预检后、写入前被并发请求抢先置为 paid → 条件更新命中 0 行，幂等返回最新状态
  if (granted.length === 0) {
    const current = await orderRepo.findById(orderId);
    return buildPaidResult(current, userId);
  }

  const finalOrder = await orderRepo.findById(orderId);
  return {
    order: serializeOrder(finalOrder),
    membershipExpire: formatDate(parseDate(granted[0].expire)),
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
