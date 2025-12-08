import { Request, Response } from 'express';
import leagueApplicationService from '../services/leagueApplication.service';
import { AppError } from '../utils/error/app.error';
import { calculateAge } from '../utils/age.utils';

export class LeagueApplicationController {
  // Kullanıcı lige başvur
  createApplication = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED");
      }

      const { leagueId, notes } = req.body;
      if (!leagueId) {
        throw new AppError("VALIDATION_ERROR");
      }

      const application = await leagueApplicationService.createApplication(userId, leagueId, notes);
      return res.status(201).json({
        success: true,
        message: 'Lig başvurunuz yapılmıştır',
        data: application,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Tüm başvuruları getir (admin)
  getAllApplications = async (req: Request, res: Response) => {
    try {
      const applications = await leagueApplicationService.findAll();
      const applicationsWithAge = applications.map(app => ({
        ...app,
        user: {
          ...app.user,
          age: calculateAge(app.user.birthDate),
        }
      }));
      return res.status(200).json({
        success: true,
        data: applicationsWithAge,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Belirli bir lige ait başvuruları getir (admin)
  getApplicationsByLeague = async (req: Request, res: Response) => {
    try {
      const leagueId = parseInt(req.params.leagueId);
      const status = req.query.status as any;
      const applications = await leagueApplicationService.findByLeagueId(leagueId, status);
      const applicationsWithAge = applications.map(app => ({
        ...app,
        user: {
          ...app.user,
          age: calculateAge(app.user.birthDate),
        }
      }));
      return res.status(200).json({
        success: true,
        data: applicationsWithAge,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Kullanıcının başvurularını getir
  getUserApplications = async (req: Request, res: Response) => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED");
      }

      const applications = await leagueApplicationService.findByUserId(userId);
      return res.status(200).json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Başvuruyu onayla (admin)
  approveApplication = async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await leagueApplicationService.approveApplication(applicationId);
      return res.status(200).json({
        success: true,
        message: 'Başvuru onaylandı ve kullanıcı lige eklendi',
        data: application,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Başvuruyu reddet (admin)
  rejectApplication = async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { notes } = req.body;
      const application = await leagueApplicationService.rejectApplication(applicationId, notes);
      return res.status(200).json({
        success: true,
        message: 'Başvuru reddedildi',
        data: application,
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };

  // Bekleyen başvuru sayısını getir (admin)
  getPendingCount = async (req: Request, res: Response) => {
    try {
      const count = await leagueApplicationService.getPendingCount();
      return res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      const appError = error instanceof AppError
        ? error
        : new AppError("UNKNOWN_ERROR");
      
      return res.status(appError.status).json({
        success: false,
        errorKey: appError.errorKey,
        errorCode: appError.errorCode,
        message: appError.message,
      });
    }
  };
}

