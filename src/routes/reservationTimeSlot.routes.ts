import { Router } from 'express';
import { ReservationTimeSlotController } from '../controllers/reservationTimeSlot.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();
const timeSlotController = new ReservationTimeSlotController();

// Public endpoint - Aktif saat dilimlerini getir (auth gerektirmez)
router.get('/active', (req, res) => {
  req.query.isActive = 'true';
  return timeSlotController.getAllTimeSlots(req, res);
});

// Admin endpoints - Auth ve Admin middleware gerekli
router.get('/', authMiddleware, adminMiddleware, timeSlotController.getAllTimeSlots);
router.post('/', authMiddleware, adminMiddleware, timeSlotController.createTimeSlot);
router.put('/:id', authMiddleware, adminMiddleware, timeSlotController.updateTimeSlot);
router.delete('/:id', authMiddleware, adminMiddleware, timeSlotController.deleteTimeSlot);
router.put('/bulk/update', authMiddleware, adminMiddleware, timeSlotController.bulkUpdateTimeSlots);

export default router;
