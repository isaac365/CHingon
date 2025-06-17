// backend/server.js
// Load environment variables from .env file
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// pool, bcrypt and jwt are moved to route files or not used directly in server.js anymore

// Import routers
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import availabilityRoutes from './routes/availability.js';
import calendarRoutes from './routes/calendar.js';
import sessionNoteRoutes from './routes/sessionNotes.js';
import recursoRoutes from './routes/recursos.js';

const app = express();
// PORT configuration - Loads from PORT in .env. Default is 3000.
const PORT = process.env.PORT || 3000;

// JWT_SECRET setup. This ensures process.env.JWT_SECRET is set for other modules (like auth.js) if not provided externally via .env.
// auth.js directly uses process.env.JWT_SECRET.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'TU_SECRETO_MUY_SEGURO'; // Fallback secret
  console.warn('Warning: JWT_SECRET is not set in environment variables. Using default secret. Please set a strong secret in your .env file for production.');
}

// CORS Configuration - Loads from CORS_ALLOWED_ORIGINS in .env
// Default is 'http://localhost:5500' if not set.
// Example .env: CORS_ALLOWED_ORIGINS=http://localhost:5500,https://yourfrontend.com
const corsAllowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS;
let corsOptions;
const defaultCorsOrigin = 'http://localhost:5500';

if (corsAllowedOriginsEnv) {
  const allowedOrigins = corsAllowedOriginsEnv.split(',').map(origin => origin.trim());
  corsOptions = {
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };
  console.log(`CORS configured for origins: ${allowedOrigins.join(', ')}`);
} else {
  corsOptions = {
    origin: defaultCorsOrigin,
    credentials: true
  };
  console.warn(`Warning: CORS_ALLOWED_ORIGINS environment variable is not set. Defaulting to ${defaultCorsOrigin}. Set this in your .env file for production or other environments.`);
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Para parsear JSON en el body

// ------------------------------
// RUTA DE PRUEBA
// ------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'API de Citas Psicológicas operativa' });
});

// Mount routers
app.use('/auth', authRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/availability', availabilityRoutes);
app.use('/calendar', calendarRoutes);
app.use('/session-notes', sessionNoteRoutes);
app.use('/recursos', recursoRoutes);

// Global Error Handler
// --------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the full error stack
  // If the error has a status, use it, otherwise default to 500
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message });
});

// --------------------------------------------------
// Iniciar servidor
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
