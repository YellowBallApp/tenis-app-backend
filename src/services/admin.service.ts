import userRepository from "../repositories/user.repository";
import blockedTimeSlotRepository from "../repositories/blockedTimeSlot.repository";
import { User } from "../entities/user.entity";
import { BlockedTimeSlot } from "../entities/blockedTimeSlot.entity";
import { AppError } from "../utils/error/app.error";
import { UserType } from "../enum/userType.enum";
import { hash } from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { Court } from "../entities/court.entity";

const adminService = {
  // Kullanıcı oluştur
  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    surname?: string;
    phone?: string;
    gender?: string;
    age?: number;
    userType?: UserType;
    title?: string;
  }): Promise<User> => {
    // Email kontrolü
    try {
      await userRepository.findByEmail(userData.email);
      throw new AppError("USER_ALREADY_EXISTS");
    } catch (error: any) {
      if (error.errorKey === "USER_ALREADY_EXISTS") {
        throw error;
      }
      // USER_NOT_FOUND ise devam et, kullanıcı yok demektir
    }

    const hashedPassword = await hash(userData.password, 10);
    
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // UserType varsa güncelle
    if (userData.userType) {
      const userRepo = AppDataSource.getRepository(User);
      user.userType = userData.userType;
      await userRepo.save(user);
    }

    // Title varsa güncelle
    if (userData.title) {
      const userRepo = AppDataSource.getRepository(User);
      user.title = userData.title;
      await userRepo.save(user);
    }

    return user;
  },

  // Kullanıcı güncelle
  updateUser: async (
    userId: string,
    updateData: {
      name?: string;
      surname?: string;
      phone?: string;
      gender?: string;
      age?: number;
      userType?: UserType;
      title?: string;
      email?: string;
    }
  ): Promise<User> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    // Email değişiyorsa kontrol et
    if (updateData.email && updateData.email !== user.email) {
      try {
        await userRepository.findByEmail(updateData.email);
        throw new AppError("USER_ALREADY_EXISTS");
      } catch (error: any) {
        if (error.errorKey === "USER_ALREADY_EXISTS") {
          throw error;
        }
      }
      user.email = updateData.email;
    }

    // Diğer alanları güncelle
    if (updateData.name !== undefined) user.name = updateData.name;
    if (updateData.surname !== undefined) user.surname = updateData.surname;
    if (updateData.phone !== undefined) user.phone = updateData.phone;
    if (updateData.gender !== undefined) user.gender = updateData.gender;
    if (updateData.age !== undefined) user.age = updateData.age;
    if (updateData.userType !== undefined) user.userType = updateData.userType;
    if (updateData.title !== undefined) user.title = updateData.title;

    const userRepo = AppDataSource.getRepository(User);
    await userRepo.save(user);

    return user;
  },

  // Kullanıcı şifresini güncelle
  updateUserPassword: async (
    userId: string,
    newPassword: string
  ): Promise<void> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    const hashedPassword = await hash(newPassword, 10);
    const userRepo = AppDataSource.getRepository(User);
    user.password = hashedPassword;
    await userRepo.save(user);
  },

  // Kullanıcı sil (soft delete)
  deleteUser: async (userId: string): Promise<void> => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    const userRepo = AppDataSource.getRepository(User);
    await userRepo.softRemove(user);
  },

  // Tüm kullanıcıları getir
  getAllUsers: async (): Promise<User[]> => {
    return await userRepository.findAll();
  },

  // Blocked time slot oluştur
  createBlockedTimeSlot: async (
    adminUserId: string,
    data: {
      courtId: number;
      startTime: Date;
      endTime: Date;
      reason?: string;
    }
  ): Promise<BlockedTimeSlot> => {
    // Kort kontrolü
    const courtRepo = AppDataSource.getRepository(Court);
    const court = await courtRepo.findOne({ where: { id: data.courtId } });
    if (!court) {
      throw new Error("Kort bulunamadı");
    }

    // Çakışan rezervasyonlar var mı kontrol et (gelecekte eklenebilir)
    // Şimdilik sadece bloklamayı oluşturuyoruz

    return await blockedTimeSlotRepository.create({
      courtId: data.courtId,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      blockedByUserId: adminUserId,
      isActive: true,
    });
  },

  // Blocked time slot güncelle
  updateBlockedTimeSlot: async (
    id: number,
    updateData: {
      startTime?: Date;
      endTime?: Date;
      reason?: string;
      isActive?: boolean;
    }
  ): Promise<BlockedTimeSlot> => {
    const blockedSlot = await blockedTimeSlotRepository.findById(id);
    if (!blockedSlot) {
      throw new Error("Bloke edilmiş zaman dilimi bulunamadı");
    }

    return await blockedTimeSlotRepository.update(id, updateData);
  },

  // Blocked time slot sil
  deleteBlockedTimeSlot: async (id: number): Promise<void> => {
    const blockedSlot = await blockedTimeSlotRepository.findById(id);
    if (!blockedSlot) {
      throw new Error("Bloke edilmiş zaman dilimi bulunamadı");
    }

    await blockedTimeSlotRepository.delete(id);
  },

  // Tüm blocked time slot'ları getir
  getAllBlockedTimeSlots: async (filters?: {
    courtId?: number;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BlockedTimeSlot[]> => {
    return await blockedTimeSlotRepository.findAll(filters);
  },

  // Tarih aralığı ve saatlerle toplu bloklama oluştur
  createBulkBlockedTimeSlots: async (
    adminUserId: string,
    data: {
      courtId: number;
      startDate: Date; // Başlangıç tarihi
      endDate: Date; // Bitiş tarihi
      hours: number[]; // Bloke edilecek saatler (örn: [13, 14, 15])
      reason?: string;
    }
  ): Promise<{ created: number; slots: BlockedTimeSlot[] }> => {
    // Kort kontrolü
    const courtRepo = AppDataSource.getRepository(Court);
    const court = await courtRepo.findOne({ where: { id: data.courtId } });
    if (!court) {
      throw new Error("Kort bulunamadı");
    }

    if (data.hours.length === 0) {
      throw new Error("En az bir saat seçilmelidir");
    }

    if (data.startDate >= data.endDate) {
      throw new Error("Bitiş tarihi başlangıç tarihinden sonra olmalıdır");
    }

    const slots: BlockedTimeSlot[] = [];
    const startDate = new Date(data.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(data.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Her gün için döngü
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Her seçilen saat için bloklama oluştur
      for (const hour of data.hours) {
        if (hour < 0 || hour > 23) {
          continue; // Geçersiz saatleri atla
        }

        // Her saat için 1 saatlik blok oluştur (örn: 13:00-14:00)
        const startTime = new Date(currentDate);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(currentDate);
        endTime.setHours(hour + 1, 0, 0, 0);

        // Bloklama oluştur
        const slot = await blockedTimeSlotRepository.create({
          courtId: data.courtId,
          startTime,
          endTime,
          reason: data.reason || `Toplu bloklama - ${hour}:00-${hour + 1}:00`,
          blockedByUserId: adminUserId,
          isActive: true,
        });

        slots.push(slot);
      }

      // Bir sonraki güne geç
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      created: slots.length,
      slots,
    };
  },
};

export default adminService;

