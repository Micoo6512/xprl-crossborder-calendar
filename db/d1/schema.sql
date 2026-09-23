-- 跨境选品日历 V1.0 建表脚本（Cloudflare D1 / SQLite 方言）
-- 对应 PostgreSQL 版本见 ../init/01_schema.sql

-- 节日主表（DATE/TIMESTAMP 在 D1 中以 TEXT 存储，格式 YYYY-MM-DD / YYYY-MM-DD HH:MM:SS）
CREATE TABLE IF NOT EXISTS festival (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  en_name TEXT NOT NULL,
  festival_date TEXT NOT NULL,
  year INTEGER NOT NULL,
  regions TEXT NOT NULL,
  intro TEXT NOT NULL DEFAULT '',
  advice TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_festival_date ON festival (festival_date);
CREATE INDEX IF NOT EXISTS idx_year ON festival (year);

-- 节日商品关联表
CREATE TABLE IF NOT EXISTS festival_goods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  festival_id INTEGER NOT NULL,
  goods_name TEXT NOT NULL,
  en_keyword TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'P2',
  sort_order INTEGER NOT NULL DEFAULT 100,
  FOREIGN KEY (festival_id) REFERENCES festival (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_festival_id ON festival_goods (festival_id);

-- 用户会员表
CREATE TABLE IF NOT EXISTS "user" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  register_time TEXT NOT NULL DEFAULT (datetime('now')),
  membership_status TEXT NOT NULL DEFAULT 'free',
  membership_expire TEXT,
  daily_jump_count INTEGER NOT NULL DEFAULT 0,
  jump_count_date TEXT
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_code TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  FOREIGN KEY (user_id) REFERENCES "user" (id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- 同一用户同一方案至多保留一个待支付订单（幂等下单 + 并发兜底）
CREATE UNIQUE INDEX IF NOT EXISTS uniq_orders_pending_per_user_plan
  ON orders (user_id, plan_code) WHERE status = 'pending';
