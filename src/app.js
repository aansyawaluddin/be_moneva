import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import gubernurRoutes from './routes/gubernurRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import kadisRoutes from './routes/kadisRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3030;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

BigInt.prototype.toJSON = function () {
  return this.toString();
};

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


const allowedOrigins = [
  'http://localhost:3000',
  'https://simoneva.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy: URL ini tidak diizinkan mengakses API.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gubernur', gubernurRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/kadis', kadisRoutes);


app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});