import express from 'express';
import { verifyToken, verifyProgramAccess } from '../middleware/authUser.js';
import kadisController from '../controllers/kadisController.js';

const router = express.Router();

router.use(verifyToken, verifyProgramAccess);

// Inbox
router.get('/inbox', kadisController.getInboxVerifikasi);

// Action
router.put('/verifikasi/:id', kadisController.verifikasiLaporan);

export default router;