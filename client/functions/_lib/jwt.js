/**
 * JWT（HS256）实现，基于 Web Crypto API，替代 Node 版 jsonwebtoken。
 * 签名算法与 jsonwebtoken 的 HS256 完全一致。
 */
import { getJwtSecret, getJwtExpiresIn } from './runtime.js';

const encoder = new TextEncoder();

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(text) {
  return bytesToBase64Url(encoder.encode(text));
}

function base64UrlToString(base64Url) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return atob(padded);
}

async function hmacSha256(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return new Uint8Array(signature);
}

/** 将 '7d' / '12h' / 数字秒 解析为秒数 */
function parseTimespan(value) {
  if (typeof value === 'number') return value;
  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) return 7 * 24 * 60 * 60;
  const amount = Number(match[1]);
  const unitSeconds = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * unitSeconds[match[2]];
}

/**
 * 签发 token。
 * @param {{id:number, account?:string}} payload
 */
export async function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + parseTimespan(getJwtExpiresIn()),
  };

  const headerPart = stringToBase64Url(JSON.stringify(header));
  const payloadPart = stringToBase64Url(JSON.stringify(fullPayload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const signature = bytesToBase64Url(await hmacSha256(signingInput, getJwtSecret()));

  return `${signingInput}.${signature}`;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/**
 * 校验并解析 token，失败时抛错（过期 / 非法签名 / 格式错误）。
 * @param {string} token
 */
export async function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error('token 格式非法');
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const expectedSignature = bytesToBase64Url(
    await hmacSha256(`${headerPart}.${payloadPart}`, getJwtSecret()),
  );
  if (!timingSafeEqual(expectedSignature, signaturePart)) {
    throw new Error('token 签名无效');
  }

  const payload = JSON.parse(base64UrlToString(payloadPart));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('token 已过期');
  }
  return payload;
}
