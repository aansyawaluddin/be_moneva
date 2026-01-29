import express from 'express';
import { verifyToken, verifyGovernor } from '../middleware/authUser.js'; 
import gubernurController from '../controllers/gubernurController.js';

const router = express.Router();

router.use(verifyToken, verifyGovernor);

// Program
router.post('/program', gubernurController.createProgram);
router.get('/program', gubernurController.getAllPrograms);
router.put('/program/:id', gubernurController.updateProgram);
router.delete('/program/:id', gubernurController.deleteProgram);

// Sub Program
router.post('/sub-program', gubernurController.createSubProgram);
router.get('/sub-program', gubernurController.getAllSubPrograms);
router.put('/sub-program/:id', gubernurController.updateSubProgram);
router.delete('/sub-program/:id', gubernurController.deleteSubProgram);

// Kategori
router.post('/kategori', gubernurController.createKategori);
router.delete('/kategori/:id', gubernurController.deleteKategori);

router.get('/monitoring/stats', gubernurController.getMonitoringStats);
router.get('/monitoring/penerima', gubernurController.getAllRealisasiDetail);

export default router;