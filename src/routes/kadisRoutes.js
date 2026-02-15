import express from 'express';
import { verifyToken, verifyProgramAccess } from '../middleware/authUser.js';
import kadisController from '../controllers/kadisController.js';

const router = express.Router();

router.use(verifyToken, verifyProgramAccess);

// Jobdesk
router.get('/jobdesk', kadisController.getJobdesk);
router.get('/jobdesk/:slug', kadisController.getDataBySubProgram);

// Inbox
router.get('/inbox', kadisController.getInboxVerifikasi);

router.get('/inbox/:id', kadisController.getDetailLaporan);

// Action
router.put('/verifikasi/approve/:id', kadisController.approveLaporan);
router.put('/verifikasi/reject/:id', kadisController.rejectLaporan);

export default router;