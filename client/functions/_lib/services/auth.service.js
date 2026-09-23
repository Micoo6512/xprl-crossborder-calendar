import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/user.repository.js';
import { signToken } from '../jwt.js';
import AppError from '../appError.js';
import { serializeUser } from '../serializers/user.serializer.js';

const SALT_ROUNDS = 10;

export async function register(account, password) {
  const existing = await userRepo.findByAccount(account);
  if (existing) throw AppError.conflict('该账号已被注册，请直接登录', 'ACCOUNT_EXISTS');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { id } = await userRepo.createUser(account, passwordHash);
  const userRow = await userRepo.findById(id);
  const user = serializeUser(userRow);

  const token = await signToken({ id, account });
  return { token, user };
}

export async function login(account, password) {
  const userRow = await userRepo.findByAccount(account);
  if (!userRow) throw AppError.unauthorized('账号或密码不正确', 'INVALID_CREDENTIALS');

  const matched = await bcrypt.compare(password, userRow.password_hash);
  if (!matched) throw AppError.unauthorized('账号或密码不正确', 'INVALID_CREDENTIALS');

  const token = await signToken({ id: userRow.id, account: userRow.account });
  return { token, user: serializeUser(userRow) };
}

export async function getCurrentUser(userId) {
  const userRow = await userRepo.findById(userId);
  if (!userRow) throw AppError.notFound('用户不存在', 'USER_NOT_FOUND');
  return serializeUser(userRow);
}
