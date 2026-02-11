import express from 'express';
import { verifyToken, verifyGovernor } from '../middleware/authUser.js';
import gubernurController from '../controllers/gubernur/gubernurController.js';
import monitoringController from '../controllers/gubernur/monitoringController.js';
import monitoringWilayahController from '../controllers/gubernur/monitoringWilayahController.js';

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

// Monitoring
// Statistik Rekapitulasi
router.get('/monitoring/stats', monitoringController.getMonitoringStats);
// Monitoring Wilayah
router.get('/monitoring/wilayah', monitoringWilayahController.getMonitoringWilayah);

// Monitoring Detail
router.get('/monitoring/beasiswa', monitoringController.getMonitoringBeasiswa);
router.get('/monitoring/bosda', monitoringController.getMonitoringBosda);
router.get('/monitoring/seragam', monitoringController.getMonitoringSeragam);
router.get('/monitoring/pkl', monitoringController.getMonitoringPkl);
router.get('/monitoring/miskin', monitoringController.getMonitoringMiskin);
router.get('/monitoring/guru', monitoringController.getMonitoringGuru);
router.get('/monitoring/digital', monitoringController.getMonitoringDigital);



export default router;