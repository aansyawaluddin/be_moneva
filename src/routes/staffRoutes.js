import express from 'express';
import { verifyToken } from '../middleware/authUser.js';
import upload from '../middleware/upload.js';
import staffController from '../controllers/staffController.js';

const router = express.Router();

router.use(verifyToken);

// Get Kategori sesuai tugas Staff (Untuk Dropdown di Frontend)
router.get('/my-options', staffController.getMyKategoriOptions);

// Upload
router.post('/upload', upload.single('file'), staffController.uploadLaporan);

// History
router.get('/history', staffController.getMyUploads);

export default router;