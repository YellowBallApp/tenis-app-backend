import { Request, Response } from "express";
import { AppError } from "../utils/error/app.error";
import { loginSchema, refreshTokenSchema, registerSchema } from "../validations/authJoi.schema";
import authService from "../services/auth.service";
import { CLIENT_RENEG_LIMIT } from "tls";

const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new AppError("VALIDATION_ERROR");
      }

      const { name, userName, email, password, surname, phone, gender, birthDate } = value;

      const tokens = await authService.register(name, userName, password, birthDate, email, surname, phone, gender);

      return res.status(201).json({
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("REGISTRATION_FAILED");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new AppError("VALIDATION_ERROR");
      }

      const { userName, password } = value;
   const ipAddress: string = req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || '';

      const tokens = await authService.login(userName, password, ipAddress, userAgent);

      return res.status(200).json({
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (err) {
      console.log(err);
      const error = err instanceof AppError
        ? err
        : new AppError("INVALID_CREDENTIALS");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  refreshToken: async (req: Request, res: Response) => {
    try {
      const { error, value } = refreshTokenSchema.validate(req.body);
      if (error) {
        throw new AppError("VALIDATION_ERROR");
      }

      const { refreshToken } = value;

      const tokens = await authService.refreshToken(refreshToken);

      return res.status(200).json({
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("INVALID_REFRESH_TOKEN");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },


  logout: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new AppError("VALIDATION_ERROR");

      await authService.logout(refreshToken);

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },
};

export default authController;