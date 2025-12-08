import { Request, Response } from "express";
import { AppError } from "../utils/error/app.error";
import adminService from "../services/admin.service";
import { UserType } from "../enum/userType.enum";
import { calculateAge } from "../utils/age.utils";

const adminController = {
  // Kullanıcı oluştur
  createUser: async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        surname,
        phone,
        gender,
        birthDate,
        userType,
        title,
      } = req.body;

      if (!name || !email || !password || !birthDate) {
        return res.status(400).json({
          success: false,
          message: "İsim, email, şifre ve doğum tarihi gereklidir",
        });
      }

      const user = await adminService.createUser({
        name,
        email,
        password,
        surname,
        phone,
        gender,
        birthDate: new Date(birthDate),
        userType: userType as UserType,
        title,
      });

      return res.status(201).json({
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          surname: user.surname,
          phone: user.phone,
          gender: user.gender,
          age: calculateAge(user.birthDate),
          birthDate: user.birthDate,
          userType: user.userType,
          title: user.title,
          createdAt: user.createdAt,
        },
      });
    } catch (err: any) {
      const error = err instanceof AppError ? err : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        success: false,
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Kullanıcı güncelle
  updateUser: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const {
        name,
        surname,
        phone,
        gender,
        birthDate,
        userType,
        title,
        email,
      } = req.body;

      const user = await adminService.updateUser(userId, {
        name,
        surname,
        phone,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        userType: userType as UserType,
        title,
        email,
      });

      return res.status(200).json({
        success: true,
        message: "Kullanıcı başarıyla güncellendi",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          surname: user.surname,
          phone: user.phone,
          gender: user.gender,
          age: calculateAge(user.birthDate),
          birthDate: user.birthDate,
          userType: user.userType,
          title: user.title,
          updatedAt: user.updatedAt,
        },
      });
    } catch (err: any) {
      const error = err instanceof AppError ? err : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        success: false,
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Kullanıcı şifresini güncelle
  updateUserPassword: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "Yeni şifre gereklidir",
        });
      }

      await adminService.updateUserPassword(userId, newPassword);

      return res.status(200).json({
        success: true,
        message: "Şifre başarıyla güncellendi",
      });
    } catch (err: any) {
      const error = err instanceof AppError ? err : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        success: false,
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Kullanıcı sil
  deleteUser: async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      await adminService.deleteUser(userId);

      return res.status(200).json({
        success: true,
        message: "Kullanıcı başarıyla silindi",
      });
    } catch (err: any) {
      const error = err instanceof AppError ? err : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        success: false,
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Tüm kullanıcıları getir
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = await adminService.getAllUsers();

      return res.status(200).json({
        success: true,
        data: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          surname: user.surname,
          phone: user.phone,
          gender: user.gender,
          age: calculateAge(user.birthDate),
          birthDate: user.birthDate,
          userType: user.userType,
          title: user.title,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      });
    } catch (err: any) {
      const error = err instanceof AppError ? err : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        success: false,
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Blocked time slot oluştur
  createBlockedTimeSlot: async (req: Request, res: Response) => {
    try {
      const adminUserId = req.currentUser.id;
      const { courtId, startTime, endTime, reason } = req.body;

      if (!courtId || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: "Kort ID, başlangıç zamanı ve bitiş zamanı gereklidir",
        });
      }

      const blockedSlot = await adminService.createBlockedTimeSlot(adminUserId, {
        courtId: parseInt(courtId),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reason,
      });

      return res.status(201).json({
        success: true,
        message: "Zaman dilimi başarıyla bloke edildi",
        data: blockedSlot,
      });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({
        success: false,
        message: err.message || "Zaman dilimi bloke edilirken bir hata oluştu",
      });
    }
  },

  // Blocked time slot güncelle
  updateBlockedTimeSlot: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { startTime, endTime, reason, isActive } = req.body;

      const updateData: any = {};
      if (startTime) updateData.startTime = new Date(startTime);
      if (endTime) updateData.endTime = new Date(endTime);
      if (reason !== undefined) updateData.reason = reason;
      if (isActive !== undefined) updateData.isActive = isActive;

      const blockedSlot = await adminService.updateBlockedTimeSlot(id, updateData);

      return res.status(200).json({
        success: true,
        message: "Bloke edilmiş zaman dilimi başarıyla güncellendi",
        data: blockedSlot,
      });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({
        success: false,
        message: err.message || "Zaman dilimi güncellenirken bir hata oluştu",
      });
    }
  },

  // Blocked time slot sil
  deleteBlockedTimeSlot: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      await adminService.deleteBlockedTimeSlot(id);

      return res.status(200).json({
        success: true,
        message: "Bloke edilmiş zaman dilimi başarıyla silindi",
      });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({
        success: false,
        message: err.message || "Zaman dilimi silinirken bir hata oluştu",
      });
    }
  },

  // Tüm blocked time slot'ları getir
  getAllBlockedTimeSlots: async (req: Request, res: Response) => {
    try {
      const { courtId, isActive, startDate, endDate } = req.query;

      const filters: any = {};
      if (courtId) filters.courtId = parseInt(courtId as string);
      if (isActive !== undefined) filters.isActive = isActive === "true";
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const blockedSlots = await adminService.getAllBlockedTimeSlots(filters);

      return res.status(200).json({
        success: true,
        data: blockedSlots,
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: err.message || "Bloke edilmiş zaman dilimleri alınırken bir hata oluştu",
      });
    }
  },

  // Tarih aralığı ve saatlerle toplu bloklama oluştur
  createBulkBlockedTimeSlots: async (req: Request, res: Response) => {
    try {
      const adminUserId = req.currentUser.id;
      const { courtId, startDate, endDate, hours, reason, daysOfWeek } = req.body;

      if (!courtId || !startDate || !endDate || !hours || !Array.isArray(hours) || hours.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Kort ID, başlangıç tarihi, bitiş tarihi ve en az bir saat gereklidir",
        });
      }

      const result = await adminService.createBulkBlockedTimeSlots(adminUserId, {
        courtId: parseInt(courtId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        hours: hours.map((h: any) => parseInt(h)),
        reason,
        daysOfWeek: daysOfWeek && Array.isArray(daysOfWeek) && daysOfWeek.length > 0
          ? daysOfWeek.map((d: any) => parseInt(d))
          : undefined,
      });

      return res.status(201).json({
        success: true,
        message: `${result.created} adet zaman dilimi başarıyla bloke edildi`,
        data: {
          created: result.created,
          slots: result.slots,
        },
      });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({
        success: false,
        message: err.message || "Toplu bloklama oluşturulurken bir hata oluştu",
      });
    }
  },
};

export default adminController;

