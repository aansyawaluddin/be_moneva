import express from 'express';
import { verifyToken, verifyProgramAccess } from '../middleware/authUser.js';
import kadisController from '../controllers/kadisController.js';

const router = express.Router();

router.use(verifyToken, verifyProgramAccess);

// Jobdesk
router.get('/jobdesk', kadisController.getJobdesk);

// Inbox
router.get('/inbox', kadisController.getInboxVerifikasi);

router.get('/laporan/:id', kadisController.getDetailLaporan);

// Action
router.put('/verifikasi/:id', kadisController.verifikasiLaporan);

export default router;