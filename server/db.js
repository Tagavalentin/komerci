import 'dotenv/config';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'komerci',
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
};

export const pool = mysql.createPool(config);

const TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  google_id VARCHAR(255) NULL,
  account_type VARCHAR(20) NULL,
  phone VARCHAR(60) NULL,
  store_name VARCHAR(255) NULL,
  store_city VARCHAR(120) NULL,
  store_description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_users_google (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS records (
  id CHAR(36) NOT NULL PRIMARY KEY,
  entity VARCHAR(50) NOT NULL,
  data JSON NOT NULL,
  created_by_id CHAR(36) NULL,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_records_entity (entity),
  INDEX idx_records_owner (entity, created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS otp_codes (
  email VARCHAR(255) NOT NULL PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_resets_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export async function initDb() {
  const dbName = config.database;
  delete config.database;
  const bootstrap = await mysql.createConnection({ ...config, multipleStatements: true });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4`);
  await bootstrap.end();
  config.database = dbName;

  const conn = await pool.getConnection();
  try {
    await conn.query(TABLES);
  } finally {
    conn.release();
  }
}

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}
