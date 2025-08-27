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
};

export default userController;
