import { Request, Response } from "express";
import { AppError } from "../utils/error/app.error";
import userService from "../services/user.service";
import leagueStandingsRepository from "../repositories/leagueStandings.repository";

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
          age: user.age,
          title: user.title,
          userType: user.userType,
          profilePhoto: user.profilePhoto,
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

      // Her kullanıcı için currentRank'i hesapla
      const usersWithRank = await Promise.all(
        users.map(async (user) => {
          let currentRank = 0;
          try {
            const standings = await leagueStandingsRepository.findByUserId(user.id);
            if (standings && standings.length > 0) {
              // En yüksek rank'i bul (en küçük sayı = en yüksek rank)
              const ranks = standings.map((s) => s.leagueRanking).filter((r: number) => r > 0);
              if (ranks.length > 0) {
                currentRank = Math.min(...ranks);
              }
            }
          } catch (err) {
            // League standings bulunamazsa currentRank 0 kalır
            console.log('League standings not found for user:', user.id);
          }

          return {
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            age: user.age,
            title: user.title,
            userType: user.userType,
            createdAt: user.createdAt,
            currentRank: currentRank,
          };
        })
      );

      return res.status(200).json({
        data: usersWithRank,
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
      const user = await userService.findById(id);

      // currentRank için league standings'den en yüksek rank'i al
      let currentRank = 0;
      try {
        const standings = await leagueStandingsRepository.findByUserId(id);
        if (standings && standings.length > 0) {
          // En yüksek rank'i bul (en küçük sayı = en yüksek rank)
          const ranks = standings.map((s) => s.leagueRanking).filter((r: number) => r > 0);
          if (ranks.length > 0) {
            currentRank = Math.min(...ranks);
          }
        }
      } catch (err) {
        // League standings bulunamazsa currentRank 0 kalır
        console.log('League standings not found for user:', id);
      }

      return res.status(200).json({
        data: {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          age: user.age,
          title: user.title,
          userType: user.userType,
          profilePhoto: user.profilePhoto,
          createdAt: user.createdAt,
          currentRank: currentRank,
          starRating: user.starRating,
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

  getAvailableUsersForDate: async (req: Request, res: Response) => {
    try {
      const { startTime, endTime } = req.query;

      if (!startTime || typeof startTime !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'startTime parametresi gereklidir (ISO 8601 formatında)',
        });
      }

      if (!endTime || typeof endTime !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'endTime parametresi gereklidir (ISO 8601 formatında)',
        });
      }

      const availableUsers = await userService.findAvailableUsersForTimeSlot(startTime, endTime);
      
      return res.status(200).json({
        success: true,
        data: availableUsers.map(user => ({
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          age: user.age,
          title: user.title,
          userType: user.userType,
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

  updateProfile: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { name, surname, phone, profilePhoto, age } = req.body;

      const updatedUser = await userService.updateProfile(userId, {
        name,
        surname,
        phone,
        profilePhoto,
        age,
      });

      return res.status(200).json({
        success: true,
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          surname: updatedUser.surname,
          profilePhoto: updatedUser.profilePhoto,
          age: updatedUser.age,
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
