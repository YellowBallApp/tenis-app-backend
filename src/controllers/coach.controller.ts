import { Request, Response } from "express";
import { AppError } from "../utils/error/app.error";
import coachService from "../services/coach.service";

const coachController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const coaches = await coachService.findAll();

      return res.status(200).json({
        data: coaches.map(coach => ({
          ...coach,
          rating: coach.starRating || 0,
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

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const coach = await coachService.findById(id);

      return res.status(200).json({
        data: {
          ...coach,
          rating: coach.starRating || 0,
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

export default coachController;

