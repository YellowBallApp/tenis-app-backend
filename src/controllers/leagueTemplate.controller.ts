import { Request, Response } from 'express';
import leagueTemplateService from '../services/leagueTemplate.service';
import { AppError } from '../utils/error/app.error';

export class LeagueTemplateController {
  // Tüm şablonları getir
  getAllTemplates = async (req: Request, res: Response) => {
    try {
      const templates = await leagueTemplateService.findAllTemplates();
      return res.status(200).json({
        success: true,
        data: templates,
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

  // Belirli bir şablonu getir
  getTemplateById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await leagueTemplateService.findTemplateById(id);
      return res.status(200).json({
        success: true,
        data: template,
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

  // Yeni şablon oluştur
  createTemplate = async (req: Request, res: Response) => {
    try {
      const template = await leagueTemplateService.createTemplate(req.body);
      return res.status(201).json({
        success: true,
        message: 'Lig şablonu başarıyla oluşturuldu',
        data: template,
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

  // Şablon güncelle
  updateTemplate = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await leagueTemplateService.updateTemplate(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Lig şablonu başarıyla güncellendi',
        data: template,
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

  // Şablon sil
  deleteTemplate = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await leagueTemplateService.deleteTemplate(id);
      return res.status(200).json({
        success: true,
        message: 'Lig şablonu başarıyla silindi',
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

export default new LeagueTemplateController();

