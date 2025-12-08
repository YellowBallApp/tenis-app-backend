import { Router } from 'express';
import { LeagueApplicationController } from '../controllers/leagueApplication.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();
const controller = new LeagueApplicationController();

// Kullanıcı başvuru yapabilir
router.post('/', authMiddleware, controller.createApplication);

// Kullanıcı kendi başvurularını görebilir
router.get('/my-applications', authMiddleware, controller.getUserApplications);

// Admin rotaları
router.get('/', authMiddleware, adminMiddleware, controller.getAllApplications);
router.get('/league/:leagueId', authMiddleware, adminMiddleware, controller.getApplicationsByLeague);
router.post('/:id/approve', authMiddleware, adminMiddleware, controller.approveApplication);
router.post('/:id/reject', authMiddleware, adminMiddleware, controller.rejectApplication);
router.get('/pending/count', authMiddleware, adminMiddleware, controller.getPendingCount);

export default router;

