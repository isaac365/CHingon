import express from 'express';
import pool from '../db.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// GET /session-notes
router.get('/', async (req, res, next) => {
  const cita_id = parseInt(req.query.cita_id);
  if (!cita_id) {
    return res.status(400).json({ error: 'cita_id inválido' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT fecha_sesion, tipo_sesion, notas, plan_terapeutico
       FROM session_notes
       WHERE cita_id = ?
       ORDER BY fecha_sesion DESC`,
      [cita_id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// POST /session-notes
router.post('/', [
  body('cita_id').isInt({ gt: 0 }).withMessage('cita_id must be a positive integer.'),
  body('fecha_sesion').isISO8601().toDate().withMessage('fecha_sesion must be a valid date in YYYY-MM-DD format.'),
  body('tipo_sesion').notEmpty().withMessage('tipo_sesion is required.').trim().escape(),
  body('notas').notEmpty().withMessage('notas is required.').trim().escape(),
  body('plan_terapeutico').optional({ checkFalsy: true }).trim().escape()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { cita_id, fecha_sesion, tipo_sesion, notas, plan_terapeutico } = req.body;
  // Old check can be removed
  // if (!cita_id || !fecha_sesion || !tipo_sesion || !notas) {
  //   return res.status(400).json({ error: 'Datos incompletos' });
  // }

  try {
    const [result] = await pool.execute(
      `INSERT INTO session_notes
         (cita_id, fecha_sesion, tipo_sesion, notas, plan_terapeutico)
       VALUES (?, ?, ?, ?, ?)`,
      [cita_id, fecha_sesion, tipo_sesion, notas, plan_terapeutico]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

export default router;
