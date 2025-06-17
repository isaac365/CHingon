// backend/db.js
import mysql from 'mysql2/promise';

// Database connection details are loaded from environment variables via dotenv
// (dotenv is configured in server.js, making process.env available here).
//
// Required .env variables for database connection:
// - DB_HOST: Hostname of the database server. Defaults to '127.0.0.1'.
// - DB_USER: Database user. Defaults to 'root'.
// - DB_PASSWORD: Password for the database user. Defaults to '$051513icy3c1' (IMPORTANT: Change this default in your .env file for any real deployment).
// - DB_NAME: Name of the database. Defaults to 'doj_system'.
//
// The code below will use these environment variables or fall back to the specified defaults.
// Warnings are logged to the console if default values are used for any of these.

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '$051513icy3c1';
const dbName = process.env.DB_NAME || 'doj_system';

if (dbHost === '127.0.0.1') {
  console.warn('Warning: DB_HOST is not set in environment variables. Using default value "127.0.0.1". Please set it in your .env file.');
}
if (dbUser === 'root') {
  console.warn('Warning: DB_USER is not set in environment variables. Using default value "root". Please set it in your .env file.');
}
if (dbPassword === '$051513icy3c1') {
  console.warn('Warning: DB_PASSWORD is not set in environment variables. Using default value "$051513icy3c1". Please set it in your .env file.');
}
if (dbName === 'doj_system') {
  console.warn('Warning: DB_NAME is not set in environment variables. Using default value "doj_system". Please set it in your .env file.');
}

const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,      // nombre de la base de datos que ya creaste
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

export default pool;
