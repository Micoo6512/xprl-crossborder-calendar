import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { query } from './db/pool.js';
import { success } from './utils/response.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

app.use(cors({
  origin: (process.env.CORS_ORIGIN || '*').split(','),
  credentials: true,
}));
app.use(express.json());

// 基础限流：单 IP 每分钟最多 120 次请求
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试', data: null },
  }),
);

app.get('/api/health', async (req, res, next) => {
  try {
    await query('SELECT 1 AS ok');
    return success(res, { status: 'up', time: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

// 根路径：API 导航首页
app.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>跨境选品日历 — API 服务</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6}
  .wrap{max-width:860px;margin:0 auto;padding:48px 24px 80px}
  h1{font-size:28px;font-weight:700;margin-bottom:8px}
  .sub{color:#64748b;font-size:15px;margin-bottom:32px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;margin-bottom:24px}
  .card h2{font-size:16px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;color:#fff}
  .get{background:#3b82f6}.post{background:#22c55e}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{text-align:left;padding:8px 12px;border-bottom:2px solid #e2e8f0;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
  td{padding:10px 12px;border-bottom:1px solid #f1f5f9}
  td:first-child{font-family:monospace;font-size:13px;white-space:nowrap}
  td:nth-child(2){text-align:center;width:60px}
  td:last-child{color:#64748b}
  tr:hover td{background:#f8fafc}
  .links{display:flex;gap:16px;margin-top:20px;font-size:14px}
  .links a{color:#3b82f6;text-decoration:none;font-weight:500}
  .links a:hover{text-decoration:underline}
  .tag{display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;font-weight:600;background:#fef3c7;color:#92400e;margin-left:6px}
</style>
</head>
<body>
<div class="wrap">
  <h1>跨境选品日历 API</h1>
  <p class="sub">面向跨境电商卖家的节日选品备货工具 — Node.js + Express + MySQL</p>

  <div class="card">
    <h2>🩺 基础</h2>
    <table>
      <thead><tr><th>路径</th><th>方法</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>/api/health</td><td><span class="badge get">GET</span></td><td>健康检查（含数据库连通性）</td></tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>🔐 认证</h2>
    <table>
      <thead><tr><th>路径</th><th>方法</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>/api/auth/register</td><td><span class="badge post">POST</span></td><td>注册（account + password）</td></tr>
        <tr><td>/api/auth/login</td><td><span class="badge post">POST</span></td><td>登录，返回 JWT</td></tr>
        <tr><td>/api/auth/me</td><td><span class="badge get">GET</span></td><td>获取当前登录用户<span class="tag">需登录</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>📅 节日与选品</h2>
    <table>
      <thead><tr><th>路径</th><th>方法</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>/api/festivals</td><td><span class="badge get">GET</span></td><td>节日列表（支持 baseDate、prepDays、region 参数）</td></tr>
        <tr><td>/api/festivals/:id</td><td><span class="badge get">GET</span></td><td>节日详情（含商品列表）</td></tr>
        <tr><td>/api/search-jump</td><td><span class="badge post">POST</span></td><td>一键搜索跳转（goodsId + platform）<span class="tag">需登录</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>👤 用户</h2>
    <table>
      <thead><tr><th>路径</th><th>方法</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>/api/user/profile</td><td><span class="badge get">GET</span></td><td>个人资料<span class="tag">需登录</span></td></tr>
        <tr><td>/api/user/orders</td><td><span class="badge get">GET</span></td><td>订单列表<span class="tag">需登录</span></td></tr>
        <tr><td>/api/user/password</td><td><span class="badge post">POST</span></td><td>修改密码（oldPassword + newPassword）<span class="tag">需登录</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>💳 会员与订单</h2>
    <table>
      <thead><tr><th>路径</th><th>方法</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>/api/membership/plans</td><td><span class="badge get">GET</span></td><td>会员方案列表</td></tr>
        <tr><td>/api/orders</td><td><span class="badge post">POST</span></td><td>创建订单（planCode: monthly/yearly）<span class="tag">需登录</span></td></tr>
        <tr><td>/api/orders/:id/pay</td><td><span class="badge post">POST</span></td><td>支付订单（模拟网关）<span class="tag">需登录</span></td></tr>
      </tbody>
    </table>
  </div>

  <div class="links">
    <a href="/api/health" target="_blank">→ 健康检查</a>
    <a href="http://localhost:5173" target="_blank">→ 前端页面</a>
  </div>
</div>
</body>
</html>`);
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
