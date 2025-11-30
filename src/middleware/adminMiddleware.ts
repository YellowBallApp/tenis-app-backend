import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error/app.error";
import { UserType } from "../enum/userType.enum";
import { authMiddleware } from "./authMiddleware";

/**
 * Admin middleware - Sadece ADMIN rolüne sahip kullanıcıların erişmesine izin verir
 * authMiddleware'den sonra kullanılmalı
 */
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Önce auth middleware kontrolü yapılmış olmalı
  if (!req.currentUser) {
    return next(new AppError("UNAUTHORIZED"));
  }

  // Kullanıcı admin rolüne sahip mi kontrol et
  if (req.currentUser.userType !== UserType.ADMIN) {
    return next(new AppError("FORBIDDEN"));
  }

  next();
};

/**
 * Hem auth hem admin kontrolü yapan kombine middleware
 */
export const requireAdmin = [
  authMiddleware,
  adminMiddleware
];

