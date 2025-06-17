import express from 'express';
import pool from '../db.js';
import { AVAILABILITY_STATUS } from '../utils/constants.js';

const router = express.Router();

// GET /calendar
router.get('/', async (req, res, next) => {
  const psicologo_id = parseInt(req.query.psicologo_id);
  if (!psicologo_id) {
    return res.status(400).json({ error: 'psicologo_id inválido' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, fecha, inicio, fin, estado
       FROM availability
       WHERE psicologo_id = ?`,
      [psicologo_id]
    );
    const events = rows.map(r => {
      const start = `${r.fecha}T${r.inicio.slice(0, 5)}:00`;
      const end = `${r.fecha}T${r.fin.slice(0, 5)}:00`;
      let className = 'available'; // Default for DISPONIBLE
      if (r.estado === AVAILABILITY_STATUS.PARCIAL) className = 'partially-booked';
      if (r.estado === AVAILABILITY_STATUS.COMPLETO) className = 'fully-booked';
      return {
        id: r.id,
        title: r.estado.charAt(0).toUpperCase() + r.estado.slice(1),
        start,
        end,
        className
      };
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

export default router;
