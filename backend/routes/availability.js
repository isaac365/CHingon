import express from 'express';
import pool from '../db.js';
import { body, validationResult } from 'express-validator';
import { AVAILABILITY_STATUS } from '../utils/constants.js';

const router = express.Router();

// GET /availability
router.get('/', async (req, res, next) => {
  const psicologo_id = parseInt(req.query.psicologo_id);
  if (!psicologo_id) {
    return res.status(400).json({ error: 'psicologo_id inválido' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, fecha, inicio, fin, estado
       FROM availability
       WHERE psicologo_id = ?
       ORDER BY fecha, inicio`,
      [psicologo_id]
    );
    const lista = rows.map(r => ({
      id: r.id,
      fecha: r.fecha,
      inicio: r.inicio.slice(0, 5),
      fin: r.fin.slice(0, 5),
      estado: r.estado
    }));
    res.json(lista);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// POST /availability
router.post('/', [
  body('psicologo_id').isInt({ gt: 0 }).withMessage('psicologo_id must be a positive integer.'),
  body('fecha').isISO8601().toDate().withMessage('Fecha must be a valid date in YYYY-MM-DD format.'),
  body('inicio').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('inicio must be in HH:MM format.'),
  body('fin').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('fin must be in HH:MM format.')
    .custom((value, { req }) => {
      if (value <= req.body.inicio) {
        throw new Error('fin must be after inicio.');
      }
      return true;
    })
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { psicologo_id, fecha, inicio, fin } = req.body;
  // Old check can be removed
  // if (!psicologo_id || !fecha || !inicio || !fin) {
  //   return res.status(400).json({ error: 'Datos insuficientes' });
  // }

  try {
    const [result] = await pool.execute(
      `INSERT INTO availability
         (psicologo_id, fecha, inicio, fin, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [psicologo_id, fecha, inicio, fin, AVAILABILITY_STATUS.DISPONIBLE]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

export default router;
