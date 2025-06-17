import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /recursos
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, titulo, descripcion, enlace
       FROM recursos
       ORDER BY creado_en DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

export default router;
