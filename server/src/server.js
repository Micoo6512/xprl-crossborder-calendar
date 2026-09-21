import app from './app.js';
import config from './config/index.js';
import waitForDb from './db/waitForDb.js';

async function bootstrap() {
  console.log('[bootstrap] 正在等待数据库就绪...');
  await waitForDb();
  console.log('[bootstrap] 数据库连接成功');

  app.listen(config.port, () => {
    console.log(`[bootstrap] 服务已启动：http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('[bootstrap] 启动失败：', error);
  process.exit(1);
});
