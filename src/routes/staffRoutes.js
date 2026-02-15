import express from 'express';
import { verifyToken } from '../middleware/authUser.js';
import upload from '../middleware/upload.js';
import staffController from '../controllers/staffController.js';

const router = express.Router();

router.use(verifyToken);

// Get Jobdesk
router.get('/jobdesk', staffController.getJobdesk);

// Upload
router.post('/upload', upload.single('file'), staffController.uploadLaporan);

// History
router.get('/jobdesk/:slug', staffController.getMyUploads);

router.get('/jobdesk/:slug/:id', staffController.getDetailLaporan)

export default router;