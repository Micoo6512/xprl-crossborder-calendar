import dotenv from 'dotenv';

dotenv.config();

// fail-fast：缺密钥或弱密钥时拒绝启动，防止部署漏配导致 token 可被伪造
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 16) {
  throw new Error('JWT_SECRET 缺失或长度不足（至少 16 位），请在 server/.env 中配置随机强密钥');
}

const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'xprl',
    password: process.env.DB_PASSWORD || 'xprl123456',
    database: process.env.DB_NAME || 'xprl',
    ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1',
  },
};

export default config;
