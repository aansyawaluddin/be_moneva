import express from 'express';
import { verifyToken, verifyGovernor } from '../middleware/authUser.js';
import gubernurController from '../controllers/gubernur/gubernurController.js';
import monitoringController from '../controllers/gubernur/monitoringController.js';
import monitoringWilayahController from '../controllers/gubernur/monitoringWilayahController.js';
import programKerjaController from '../controllers/gubernur/programKerjaController.js';

const router = express.Router();
router.use(verifyToken, verifyGovernor);

// Program Kerja
router.post('/program', gubernurController.createProgram);

router.get('/program', programKerjaController.getAllPrograms);
router.get('/program/:slug', programKerjaController.getProgramBySlug);

router.get('/program/:id', programKerjaController.getProgramById);
router.put('/program/:id', gubernurController.updateProgram);
router.delete('/program/:id', gubernurController.deleteProgram);

// Sub Program Kerja
router.post('/sub-program', gubernurController.createSubProgram);
router.get('/sub-program', gubernurController.getAllSubPrograms);
router.put('/sub-program/:id', gubernurController.updateSubProgram);
router.delete('/sub-program/:id', gubernurController.deleteSubProgram);

// Statistik Rekapitulasi
router.get('/monitoring/stats', monitoringController.getMonitoringStats);

// Statistik Sebaran Wilayah
router.get('/monitoring/wilayah', monitoringWilayahController.getMonitoringWilayah);

// MONITORING DETAIL
router.get('/program/:programSlug/subProgram/:subProgramSlug', monitoringController.getMonitoringDetail);

export default router;