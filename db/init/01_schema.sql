-- 跨境选品日历 V1.0 建表脚本（PostgreSQL）

-- 节日主表
CREATE TABLE IF NOT EXISTS festival (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  en_name VARCHAR(150) NOT NULL,
  festival_date DATE NOT NULL,
  year SMALLINT NOT NULL,
  regions VARCHAR(50) NOT NULL,
  intro VARCHAR(2000) NOT NULL DEFAULT '',
  advice VARCHAR(1000) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_festival_date ON festival (festival_date);
CREATE INDEX IF NOT EXISTS idx_year ON festival (year);

-- 节日商品关联表
CREATE TABLE IF NOT EXISTS festival_goods (
  id SERIAL PRIMARY KEY,
  festival_id INTEGER NOT NULL,
  goods_name VARCHAR(150) NOT NULL,
  en_keyword VARCHAR(200) NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'P2',
  sort_order INTEGER NOT NULL DEFAULT 100,
  CONSTRAINT fk_goods_festival FOREIGN KEY (festival_id) REFERENCES festival (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_festival_id ON festival_goods (festival_id);

-- 用户会员表（user 是 pg 保留字，需双引号）
CREATE TABLE IF NOT EXISTS "user" (
  id SERIAL PRIMARY KEY,
  account VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  register_time TIMESTAMP NOT NULL DEFAULT NOW(),
  membership_status VARCHAR(20) NOT NULL DEFAULT 'free',
  membership_expire DATE,
  daily_jump_count INTEGER NOT NULL DEFAULT 0,
  jump_count_date DATE
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_code VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES "user" (id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
