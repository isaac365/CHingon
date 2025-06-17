import express from 'express';
import pool from '../db.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// GET /appointments
router.get('/', async (req, res, next) => {
  const estudiante_id = parseInt(req.query.estudiante_id);
  if (!estudiante_id) {
    return res.status(400).json({ error: 'estudiante_id inválido' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT
         a.id,
         a.fecha,
         a.hora_inicio,
         a.hora_fin,
         a.estado,
         a.tipo_cita,
         u.nombre AS psicologo_nombre
       FROM appointments a
       JOIN users u ON a.psicologo_id = u.id
       WHERE a.estudiante_id = ?
       ORDER BY a.fecha DESC, a.hora_inicio DESC`,
      [estudiante_id]
    );

    const citas = rows.map(row => ({
      id: row.id,
      fecha: row.fecha,
      hora_inicio: row.hora_inicio.slice(0, 5),
      hora_fin: row.hora_fin.slice(0, 5),
      estado: row.estado,
      tipo_cita: row.tipo_cita,
      psicologo_nombre: row.psicologo_nombre
    }));
    res.json(citas);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// POST /appointments
router.post('/', [
  body('estudiante_id').isInt({ gt: 0 }).withMessage('estudiante_id must be a positive integer.'),
  body('psicologo_id').isInt({ gt: 0 }).withMessage('psicologo_id must be a positive integer.'),
  body('fecha').isISO8601().toDate().withMessage('Fecha must be a valid date in YYYY-MM-DD format.'),
  body('hora_inicio').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_inicio must be in HH:MM format.'),
  body('hora_fin').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_fin must be in HH:MM format.')
    .custom((value, { req }) => {
      if (value <= req.body.hora_inicio) {
        throw new Error('hora_fin must be after hora_inicio.');
      }
      return true;
    }),
  body('tipo_cita').notEmpty().withMessage('tipo_cita is required.').trim().escape(),
  body('motivo').optional({ checkFalsy: true }).trim().escape() // motivo is optional
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    estudiante_id,
    psicologo_id,
    fecha,
    hora_inicio,
    hora_fin,
    tipo_cita,
    motivo
  } = req.body;
  // Old check can be removed
  // if (!estudiante_id || !psicologo_id || !fecha || !hora_inicio || !hora_fin) {
  //   return res.status(400).json({ error: 'Datos insuficientes para agendar cita' });
  // }

  try {
    const [result] = await pool.execute(
      `INSERT INTO appointments
         (estudiante_id, psicologo_id, fecha, hora_inicio, hora_fin, tipo_cita, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [estudiante_id, psicologo_id, fecha, hora_inicio, hora_fin, tipo_cita, motivo]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

export default router;
