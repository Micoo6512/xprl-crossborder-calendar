/**
 * Cloudflare Pages Functions 统一入口（catch-all 路由 /api/*）。
 * 由原 Node.js + Express 服务迁移而来，路由、鉴权、限流、响应格式保持一致：
 *   成功 → { code: 0, message, data }
 *   失败 → { code, message, data: null }
 */
import { Hono } from 'hono';
import { bindRuntime } from '../_lib/runtime.js';
import { query } from '../_lib/db.js';
import { verifyToken } from '../_lib/jwt.js';
import AppError from '../_lib/appError.js';
import * as authService from '../_lib/services/auth.service.js';
import * as festivalService from '../_lib/services/festival.service.js';
import * as jumpService from '../_lib/services/jump.service.js';
import * as orderService from '../_lib/services/order.service.js';
import * as userService from '../_lib/services/user.service.js';

const app = new Hono();

// ---------- 请求级初始化 ----------
// Cloudflare 的环境变量/密钥通过 env 传入，每个请求先绑定到运行时单例。
app.use('*', async (c, next) => {
  bindRuntime(c.env);
  await next();
});

// ---------- 基础限流：单 IP 每分钟最多 120 次 ----------
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 120;
const rateBuckets = new Map(); // ip → { count, resetAt }

app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  let bucket = rateBuckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }

  bucket.count += 1;
  if (bucket.count > RATE_MAX) {
    return c.json(
      { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试', data: null },
      429,
    );
  }

  await next();
});

// ---------- 鉴权中间件 ----------
function extractToken(c) {
  const header = c.req.header('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** 必须登录：无 Token 或 Token 非法/过期一律 401 */
async function authRequired(c, next) {
  const token = extractToken(c);
  if (!token) throw AppError.unauthorized();

  try {
    c.set('jwtPayload', await verifyToken(token));
  } catch {
    throw AppError.unauthorized();
  }
  await next();
}

/** 可选鉴权：Token 合法则挂载载荷，访客身份继续放行（节日接口可读） */
async function attachUser(c, next) {
  const token = extractToken(c);
  if (token) {
    try {
      c.set('jwtPayload', await verifyToken(token));
    } catch {
      // 非法/过期 Token 按访客处理，不阻断浏览
    }
  }
  await next();
}

// ---------- 参数工具 ----------
/** 解析并校验正整数路径参数，非法时抛 400 */
function parseIdParam(c, name) {
  const value = Number(c.req.param(name));
  if (!Number.isInteger(value) || value < 1) {
    throw AppError.badRequest(`${name} 参数非法`);
  }
  return value;
}

/** 读取 JSON 请求体；非法 JSON 统一转 400 */
async function readJsonBody(c) {
  try {
    return await c.req.json();
  } catch {
    throw AppError.badRequest('请求体格式错误');
  }
}

/** 校验字符串长度（闭区间） */
function assertLength(value, min, max, message) {
  if (typeof value !== 'string' || value.length < min || value.length > max) {
    throw AppError.badRequest(message);
  }
}

// ================= 路由 =================

/* 健康检查（含数据库连通性） */
app.get('/api/health', async (c) => {
  await query('SELECT 1 AS ok');
  return c.json({
    code: 0,
    message: 'ok',
    data: { status: 'up', time: new Date().toISOString() },
  });
});

/* 注册 */
app.post('/api/auth/register', async (c) => {
  const body = await readJsonBody(c);
  assertLength(body.account, 3, 20, '账号长度需为 3–20 个字符');
  assertLength(body.password, 6, 32, '密码长度需为 6–32 个字符');

  const data = await authService.register(body.account.trim(), body.password);
  return c.json({ code: 0, message: '注册成功', data }, 201);
});

/* 登录 */
app.post('/api/auth/login', async (c) => {
  const body = await readJsonBody(c);
  assertLength(body.account, 3, 20, '账号长度需为 3–20 个字符');
  assertLength(body.password, 6, 32, '密码长度需为 6–32 个字符');

  const data = await authService.login(
    typeof body.account === 'string' ? body.account.trim() : body.account,
    body.password,
  );
  return c.json({ code: 0, message: '登录成功', data });
});

/* 当前登录用户 */
app.get('/api/auth/me', authRequired, async (c) => {
  const data = await authService.getCurrentUser(c.get('jwtPayload').id);
  return c.json({ code: 0, message: 'ok', data });
});

/* 节日列表（访客可读，登录身份影响区域与会员权限） */
app.get('/api/festivals', attachUser, async (c) => {
  const data = await festivalService.listFestivals(
    c.req.query(),
    c.get('jwtPayload') || null,
  );
  return c.json({ code: 0, message: 'ok', data });
});

/* 节日详情（含商品列表） */
app.get('/api/festivals/:id', attachUser, async (c) => {
  const id = parseIdParam(c, 'id');
  const data = await festivalService.getFestivalDetail(
    id,
    c.req.query(),
    c.get('jwtPayload') || null,
  );
  return c.json({ code: 0, message: 'ok', data });
});

/* 一键搜索跳转（需登录，免费用户每日 2 次） */
app.post('/api/search-jump', authRequired, async (c) => {
  const body = await readJsonBody(c);
  if (!Number.isInteger(Number(body.goodsId)) || Number(body.goodsId) < 1) {
    throw AppError.badRequest('goodsId 非法');
  }
  if (typeof body.platform !== 'string' || !body.platform) {
    throw AppError.badRequest('platform 不能为空');
  }

  const data = await jumpService.createSearchJump(
    { goodsId: Number(body.goodsId), platform: body.platform },
    c.get('jwtPayload'),
  );
  return c.json({ code: 0, message: 'ok', data });
});

/* 会员方案列表（公开） */
app.get('/api/membership/plans', (c) =>
  c.json({ code: 0, message: 'ok', data: orderService.listPlans() }),
);

/* 创建订单（需登录） */
app.post('/api/orders', authRequired, async (c) => {
  const body = await readJsonBody(c);
  if (!['monthly', 'yearly'].includes(body.planCode)) {
    throw AppError.badRequest('planCode 仅支持 monthly/yearly');
  }

  const data = await orderService.createOrder(c.get('jwtPayload').id, body.planCode);
  return c.json({ code: 0, message: '下单成功', data }, 201);
});

/* 支付订单（模拟网关回调，事务内开通会员） */
app.post('/api/orders/:id/pay', authRequired, async (c) => {
  const id = parseIdParam(c, 'id');
  const data = await orderService.payOrder(c.get('jwtPayload').id, id);
  return c.json({ code: 0, message: '支付成功，会员已开通', data });
});

/* 个人资料 */
app.get('/api/user/profile', authRequired, async (c) => {
  const data = await userService.getProfile(c.get('jwtPayload').id);
  if (!data) throw AppError.notFound('用户不存在', 'USER_NOT_FOUND');
  return c.json({ code: 0, message: 'ok', data });
});

/* 我的订单 */
app.get('/api/user/orders', authRequired, async (c) => {
  const data = await userService.getUserOrders(c.get('jwtPayload').id);
  return c.json({ code: 0, message: 'ok', data });
});

/* 修改密码 */
app.post('/api/user/password', authRequired, async (c) => {
  const body = await readJsonBody(c);
  assertLength(body.oldPassword, 6, 32, '原密码长度需为 6–32 个字符');
  assertLength(body.newPassword, 6, 32, '新密码长度需为 6–32 个字符');

  await userService.changePassword(
    c.get('jwtPayload').id,
    body.oldPassword,
    body.newPassword,
  );
  return c.json({ code: 0, message: '密码修改成功', data: null });
});

// ---------- 兜底与全局错误处理 ----------
app.notFound((c) =>
  c.json({ code: 'NOT_FOUND', message: '接口不存在', data: null }, 404),
);

app.onError((error, c) => {
  if (error instanceof AppError) {
    return c.json(
      { code: error.code, message: error.message, data: null },
      error.statusCode,
    );
  }

  console.error('[onError]', error);
  return c.json(
    { code: 'INTERNAL_ERROR', message: '服务器内部错误', data: null },
    500,
  );
});

// ---------- Pages Functions 入口 ----------
export const onRequest = (context) =>
  app.fetch(context.request, context.env, context);
