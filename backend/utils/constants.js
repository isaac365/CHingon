// backend/utils/constants.js
export const AVAILABILITY_STATUS = {
  DISPONIBLE: 'disponible',
  PARCIAL: 'parcial', // As used in calendar route: 'partially-booked' class from 'parcial'
  COMPLETO: 'completo', // As used in calendar route: 'fully-booked' class from 'completo'
};

export const APPOINTMENT_TYPES = {
  // Example: if you have specific types, define them here
  // CONSULTA: 'consulta',
  // SEGUIMIENTO: 'seguimiento',
};

export const JWT_EXPIRATION = '2h';

// Add other constants as identified
