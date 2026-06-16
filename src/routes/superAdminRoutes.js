import express from 'express';
import { verifyToken, verifySuperAdmin } from '../middleware/authUser.js';
import indikator9Controller from '../controllers/superAdminController.js';

const router = express.Router();

router.use(verifyToken, verifySuperAdmin);

router.get('/program', indikator9Controller.getAllPrograms);
router.get('/program/:programSlug/indikator', indikator9Controller.getIndikatorByProgram);

router.post(
    '/program/:programSlug/indikator/:indikatorId/capaian',
    indikator9Controller.createCapaian
);
router.put(
    '/program/:programSlug/indikator/:indikatorId/capaian/:tahun',
    indikator9Controller.updateCapaian
);
router.get(
    '/program/:programSlug/indikator/:indikatorId/capaian',
    indikator9Controller.getRiwayatCapaian
);
router.delete(
    '/program/:programSlug/indikator/:indikatorId/capaian/:tahun',
    indikator9Controller.deleteCapaian
);

export default router;