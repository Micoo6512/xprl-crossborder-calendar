import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/user.repository.js';
import * as orderRepo from '../repositories/order.repository.js';
import pool from '../db/pool.js';
import { serializeUser } from '../serializers/user.serializer.js';
import { serializeOrder } from './order.service.js';
import AppError from '../utils/AppError.js';

const SALT_ROUNDS = 10;

export async function getProfile(userId) {
  const userRow = await userRepo.findById(userId);
  if (!userRow) return null;
  return serializeUser(userRow);
}

export async function getUserOrders(userId) {
  const rows = await orderRepo.listByUser(pool, userId);
  return rows.map(serializeOrder);
}

/**
 * 修改密码：校验原密码后更新为新密码。
 * 密码长度（6–32）由路由层校验，此处只做业务校验。
 * @param {number} userId
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export async function changePassword(userId, oldPassword, newPassword) {
  const userRow = await userRepo.findById(userId);
  if (!userRow) throw AppError.notFound('用户不存在', 'USER_NOT_FOUND');

  const matched = await bcrypt.compare(oldPassword, userRow.password_hash);
  if (!matched) throw AppError.badRequest('原密码不正确', 'INVALID_PASSWORD');

  if (oldPassword === newPassword) {
    throw AppError.badRequest('新密码不能与原密码相同', 'SAME_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepo.updatePassword(userId, passwordHash);
}
