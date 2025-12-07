import { Router } from 'express';
import { ReservationTemplateController } from '../controllers/reservationTemplate.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const templateController = new ReservationTemplateController();

// Public endpoint - Belirli bir gün için aktif saat dilimlerini getir
router.get('/day/:dayOfWeek/active', templateController.getActiveTimeSlotsForDay);

// Admin endpoints - Auth middleware gerekli
router.get('/', authMiddleware, templateController.getAllTemplates);
router.get('/day/:dayOfWeek', authMiddleware, templateController.getTemplatesByDay);
router.post('/', authMiddleware, templateController.createTemplate);
router.post('/initialize', authMiddleware, templateController.initializeDefaultTemplates);
router.post('/update-orders', authMiddleware, templateController.updateAllTemplateOrders);
router.put('/:id', authMiddleware, templateController.updateTemplate);
router.delete('/:id', authMiddleware, templateController.deleteTemplate);
router.put('/bulk/update', authMiddleware, templateController.bulkUpdateTemplates);

export default router;
