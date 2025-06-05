// backend/server.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'TU_SECRETO_MUY_SEGURO'; // Cámbialo por una cadena fuerte

// Middleware
app.use(cors({
  origin: 'http://localhost:5500', // Si tu front corre en Live Server (puerto 5500)
  credentials: true
}));
app.use(express.json()); // Para parsear JSON en el body

// ------------------------------
// RUTA DE PRUEBA
// ------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'API de Citas Psicológicas operativa' });
});

// ------------------------------
// 1) LOGIN (POST /auth/login)
// ------------------------------
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

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
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '2h' }
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
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor al hacer login' });
  }
});

// --------------------------------------------------
// 2) OBTENER CITAS DE UN ESTUDIANTE (GET /appointments)
// --------------------------------------------------
app.get('/appointments', async (req, res) => {
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
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// --------------------------------------------------
// 3) AGENDAR CITA (POST /appointments)
// --------------------------------------------------
app.post('/appointments', async (req, res) => {
  const {
    estudiante_id,
    psicologo_id,
    fecha,
    hora_inicio,
    hora_fin,
    tipo_cita,
    motivo
  } = req.body;

  if (!estudiante_id || !psicologo_id || !fecha || !hora_inicio || !hora_fin) {
    return res.status(400).json({ error: 'Datos insuficientes para agendar cita' });
  }

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
    res.status(500).json({ error: 'No se pudo agendar la cita' });
  }
});

// --------------------------------------------------
// 4) OBTENER DISPONIBILIDAD (GET /availability)
// --------------------------------------------------
app.get('/availability', async (req, res) => {
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
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
});

// --------------------------------------------------
// 5) AGREGAR DISPONIBILIDAD (POST /availability)
// --------------------------------------------------
app.post('/availability', async (req, res) => {
  const { psicologo_id, fecha, inicio, fin } = req.body;
  if (!psicologo_id || !fecha || !inicio || !fin) {
    return res.status(400).json({ error: 'Datos insuficientes' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO availability
         (psicologo_id, fecha, inicio, fin, estado)
       VALUES (?, ?, ?, ?, 'disponible')`,
      [psicologo_id, fecha, inicio, fin]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar disponibilidad' });
  }
});

// --------------------------------------------------
// 6) OBTENER EVENTOS PARA CALENDARIO PSICÓLOGO (GET /calendar)
// --------------------------------------------------
app.get('/calendar', async (req, res) => {
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
      let className = 'available';
      if (r.estado === 'parcial') className = 'partially-booked';
      if (r.estado === 'completo') className = 'fully-booked';
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
    res.status(500).json({ error: 'Error al obtener eventos del calendario' });
  }
});

// --------------------------------------------------
// 7) OBTENER NOTAS DE SESIÓN (GET /session-notes)
// --------------------------------------------------
app.get('/session-notes', async (req, res) => {
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
    res.status(500).json({ error: 'Error al obtener notas de sesión' });
  }
});

// --------------------------------------------------
// 8) GUARDAR NOTA DE SESIÓN (POST /session-notes)
// --------------------------------------------------
app.post('/session-notes', async (req, res) => {
  const { cita_id, fecha_sesion, tipo_sesion, notas, plan_terapeutico } = req.body;
  if (!cita_id || !fecha_sesion || !tipo_sesion || !notas) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

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
    res.status(500).json({ error: 'No se pudo guardar la nota' });
  }
});

// --------------------------------------------------
// 9) OBTENER RECURSOS (GET /recursos)
// --------------------------------------------------
app.get('/recursos', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, titulo, descripcion, enlace
       FROM recursos
       ORDER BY creado_en DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener recursos' });
  }
});

// --------------------------------------------------
// Iniciar servidor
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
