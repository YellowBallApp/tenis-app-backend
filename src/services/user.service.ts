import userRepository from "../repositories/user.repository";
import { User } from "../entities/user.entity";
import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { Reservation } from "../entities/reservation.entity";
import { EloService } from "./elo.service";

const userService = {
  create: async (userData: { 
    name: string; 
    email: string; 
    password: string;
    surname?: string;
    phone?: string;
    gender?: string;
    age?: number;
  }): Promise<User> => {
    return await userRepository.create(userData);
  },

  findById: async (id: string): Promise<User> => {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }
    return user;
  },
  findByEmail: async (email: string, relations?: string[]): Promise<User> => {
    const user = await userRepository.findByEmail(email, relations);

    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }
    return user;
  },

  findAll: async (): Promise<User[]> => {
    return await userRepository.findAll();
  },

  // Belirli bir tarih ve saat aralığında rezervasyonu olmayan kullanıcıları getir
  findAvailableUsersForTimeSlot: async (startTime: string, endTime: string): Promise<User[]> => {
    const reservationRepository = AppDataSource.getRepository(Reservation);

    const requestedStart = new Date(startTime);
    const requestedEnd = new Date(endTime);

    // Belirtilen saat aralığında çakışan rezervasyonları bul
    // Çakışma durumu: (requestedStart < reservation.endTime) AND (requestedEnd > reservation.startTime)
    const overlappingReservations = await reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.participants', 'participants')
      .where('reservation.startTime < :requestedEnd', { requestedEnd })
      .andWhere('reservation.endTime > :requestedStart', { requestedStart })
      .getMany();

    // Çakışan rezervasyonlardaki kullanıcı ID'lerini topla
    const busyUserIds = new Set<string>();
    
    overlappingReservations.forEach(reservation => {
      // Rezervasyon yapan kullanıcı
      busyUserIds.add(reservation.user.id);
      
      // Katılımcılar
      if (reservation.participants && reservation.participants.length > 0) {
        reservation.participants.forEach(participant => {
          busyUserIds.add(participant.id);
        });
      }
    });

    // Tüm kullanıcıları getir
    const allUsers = await userRepository.findAll();

    // Meşgul olmayan kullanıcıları filtrele
    const availableUsers = allUsers.filter(user => !busyUserIds.has(user.id));

    return availableUsers;
  },

  // ELO rating decay uygular (6 ay maç yapmayan oyunculara)
  applyEloDecay: async (): Promise<{ affectedUsers: number; message: string }> => {
    try {
      const eloService = new EloService();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // İnaktif kullanıcıları say
      const inactiveUsers = await AppDataSource.getRepository(User)
        .createQueryBuilder('user')
        .where('user.lastMatchDate < :sixMonthsAgo', { sixMonthsAgo })
        .andWhere('user.rankedMatchesPlayed > 0')
        .getCount();

      await eloService.applyRatingDecay();

      return {
        affectedUsers: inactiveUsers,
        message: `${inactiveUsers} oyuncuya ELO decay uygulandı`
      };
    } catch (error) {
      console.error('ELO decay uygulama hatası:', error);
      throw new AppError('UNKNOWN_ERROR');
    }
  },

  // Kullanıcının ELO bilgilerini getirir
  getEloStats: async (userId: string): Promise<{
    currentRating: number;
    peakRating: number;
    starRating: number;
    rankedMatchesPlayed: number;
    confidenceInterval: number;
    percentile: number;
    lastMatchDate: Date | null;
  }> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }

    const eloService = new EloService();
    const percentile = await eloService.getUserPercentile(userId);

    return {
      currentRating: user.eloRating,
      peakRating: user.peakEloRating,
      starRating: user.starRating,
      rankedMatchesPlayed: user.rankedMatchesPlayed,
      confidenceInterval: user.confidenceInterval,
      percentile,
      lastMatchDate: user.lastMatchDate
    };
  },

  updateProfile: async (userId: string, profileData: {
    name?: string;
    surname?: string;
    phone?: string;
    profilePhoto?: string;
  }): Promise<User> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }

    // Sadece gönderilen alanları güncelle
    if (profileData.name !== undefined) user.name = profileData.name;
    if (profileData.surname !== undefined) user.surname = profileData.surname;
    if (profileData.phone !== undefined) user.phone = profileData.phone;
    if (profileData.profilePhoto !== undefined) user.profilePhoto = profileData.profilePhoto;

    const userRepo = AppDataSource.getRepository(User);
    await userRepo.save(user);

    return user;
  }
};

export default userService;