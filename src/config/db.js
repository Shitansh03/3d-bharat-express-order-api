const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();


let sslConfig;
if (process.env.DB_SSL_CA) {
  sslConfig = { ca: fs.readFileSync(process.env.DB_SSL_CA) };
} else if (process.env.DB_SSL === 'true') {
  sslConfig = { rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'orders_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true,
  ...(sslConfig ? { ssl: sslConfig } : {})
});

module.exports = pool;