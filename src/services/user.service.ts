import userRepository from "../repositories/user.repository";
import { User } from "../entities/user.entity";
import { AppError } from "../utils/error/app.error";
import { AppDataSource } from "../config/data-source";
import { Reservation } from "../entities/reservation.entity";

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
};

export default userService;