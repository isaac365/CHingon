// backend/db.js
import mysql from 'mysql2/promise';

// Ajusta estos datos según tu instalación local de MySQL:
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '$051513icy3c1',
  database: 'doj_system',      // nombre de la base de datos que ya creaste
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

export default pool;
