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

// Middleware
app.use(cors({ credentials: true, origin: 'http://localhost:3030' }));
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