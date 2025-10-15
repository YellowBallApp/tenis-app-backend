import { Request, Response } from "express";
import { AppError } from "../utils/error/app.error";
import userService from "../services/user.service";

const userController = {
  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await userService.findById(userId);

      return res.status(200).json({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          surname: user.surname,
          gender: user.gender,
          title: user.title,
          createdAt: user.createdAt,
        },
      });
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

  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = await userService.findAll();

      return res.status(200).json({
        data: users.map(user => ({
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          title: user.title,
          createdAt: user.createdAt,
        })),
      });
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

export default userController;
