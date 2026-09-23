/**
 * 运行时环境绑定。
 * Cloudflare Workers 的环境变量（secrets）通过请求上下文 env 传入，
 * 而非 process.env。每个 isolate 在首次请求时绑定，之后复用。
 */

let runtimeEnv = null;

export function bindRuntime(env) {
  runtimeEnv = env;
}

export function getEnv() {
  if (!runtimeEnv) throw new Error('运行时环境尚未初始化');
  return runtimeEnv;
}

/** fail-fast：缺密钥或弱密钥时拒绝签发 token，防止伪造 */
export function getJwtSecret() {
  const secret = getEnv().JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET 缺失或长度不足（至少 16 位）');
  }
  return secret;
}

export function getJwtExpiresIn() {
  return getEnv().JWT_EXPIRES_IN || '7d';
}
