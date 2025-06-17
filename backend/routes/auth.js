import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { body, validationResult } from 'express-validator';
import { JWT_EXPIRATION } from '../utils/constants.js';

const router = express.Router();

// POST /auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  // The old manual check can be removed:
  // if (!email || !password) {
  //   return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  // }

  try {
    // 1. Buscar usuario con ese email
    const [rows] = await pool.execute(
      'SELECT id, password_hash, nombre, rol FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const user = rows[0];

    // 2. Verificar contraseña
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar JWT (opcional)
    // JWT_SECRET is read from process.env in server.js and available globally
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET, // Use process.env.JWT_SECRET directly
      { expiresIn: JWT_EXPIRATION }
    );

    // 4. Devolver datos y token
    res.json({
      token,
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
      email
    });
  } catch (error) {
    console.error(error); // Keep logging the specific error context
    next(error); // Pass to global error handler
  }
});

export default router;
