import { Request, Response } from 'express';
import { ReservationTimeSlotService } from '../services/reservationTimeSlot.service';

export class ReservationTimeSlotController {
  private reservationTimeSlotService: ReservationTimeSlotService;

  constructor() {
    this.reservationTimeSlotService = new ReservationTimeSlotService();
  }

  getAllTimeSlots = async (req: Request, res: Response) => {
    try {
      const { isActive } = req.query;
      const filters = isActive !== undefined ? { isActive: isActive === 'true' } : undefined;
      const timeSlots = await this.reservationTimeSlotService.getAllTimeSlots(filters);
      return res.status(200).json({ success: true, data: timeSlots });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  createTimeSlot = async (req: Request, res: Response) => {
    try {
      const { time, order, isActive } = req.body;
      const timeSlot = await this.reservationTimeSlotService.createTimeSlot({ time, order, isActive });
      return res.status(201).json({ success: true, data: timeSlot });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  updateTimeSlot = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { time, order, isActive } = req.body;
      const timeSlot = await this.reservationTimeSlotService.updateTimeSlot(parseInt(id), { time, order, isActive });
      return res.status(200).json({ success: true, data: timeSlot });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteTimeSlot = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.reservationTimeSlotService.deleteTimeSlot(parseInt(id));
      return res.status(204).json({ success: true, message: 'Saat dilimi başarıyla silindi' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  bulkUpdateTimeSlots = async (req: Request, res: Response) => {
    try {
      const updates = req.body; // Array of { id, time?, order?, isActive? }
      const updatedSlots = await this.reservationTimeSlotService.bulkUpdateTimeSlots(updates);
      return res.status(200).json({ success: true, data: updatedSlots });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}
