import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { AppError } from "../utils/error/app.error";
import { User } from "../entities/user.entity";
import { refreshTokenRepo } from "../repositories/refreshToken.repository";
import userService from "../services/user.service";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload & {
        sessionId?: string;
      };
      currentUser: User;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError("UNAUTHORIZED"));
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET!;

  if (!jwtSecret) {
    return next(new AppError("UNKNOWN_ERROR"));
  }

  try {
    const decoded = verify(token, jwtSecret) as JwtPayload & { 
      sessionId?: string;
    };

    if (!decoded.id || !decoded.sessionId) {
      return next(new AppError("UNAUTHORIZED"));
    }

    req.user = decoded;

    const sessionInDb = await refreshTokenRepo.findOne({
      where: { userId: decoded.id }
    });

    if (!sessionInDb || sessionInDb.sessionId !== decoded.sessionId) {
      return next(new AppError("UNAUTHORIZED"));
    }

    const user = await userService.findById(decoded.id);
    if (!user) {
      return next(new AppError("USER_NOT_FOUND"));
    }

    req.currentUser = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("INVALID_REFRESH_TOKEN"));
    }

    return next(new AppError("UNAUTHORIZED"));
  }
};
