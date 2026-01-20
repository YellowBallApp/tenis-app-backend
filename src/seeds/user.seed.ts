import { hash } from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";
import { UserType } from "../enum/userType.enum";

export const seedUsers = async () => {
  const userRepository = AppDataSource.getRepository(User);
  
  const userCount = await userRepository.count();
  if (userCount > 0) {
    console.log(`✅ ${userCount} kullanıcı zaten mevcut, seed atlanıyor.`);
    return;
  }
  
  console.log("👤 Kullanıcılar oluşturuluyor...");
  
  try {
    const hashedPassword = await hash("password123", 10);

    // Helper function to calculate birth date from age
    const getBirthDateFromAge = (age: number): Date => {
      const today = new Date();
      const birthYear = today.getFullYear() - age;
      return new Date(birthYear, today.getMonth(), today.getDate());
    };

    const usersData = [
      {
        userName: "admin",
        email: "admin@example.com",
        name: "Admin",
        surname: "Yönetici",
        phone: "+905551234567",
        password: hashedPassword,
        gender: "MALE",
        birthDate: getBirthDateFromAge(45),
        title: "Kulüp Yöneticisi",
        userType: UserType.ADMIN,
        // ELO: Elite seviye
        eloRating: 2250,
        peakEloRating: 2300,
        starRating: 5.0,
        rankedMatchesPlayed: 87,
        confidenceInterval: 25,
        lastMatchDate: new Date('2025-10-25'),
      },
      {
        userName: "testuser",
        email: "test@example.com",
        name: "Test",
        surname: "Kullanıcı",
        phone: "+905551234568",
        password: hashedPassword,
        gender: "MALE",
        birthDate: getBirthDateFromAge(30),
        title: "Üye",
        userType: UserType.STANDARD,
        // ELO: Başlangıç değerleri
        eloRating: 1500,
        peakEloRating: 1500,
        starRating: 2.5,
        rankedMatchesPlayed: 0,
        confidenceInterval: 150,
        lastMatchDate: null,
      },
    ];

    const userEntities = userRepository.create(usersData);
    await userRepository.save(userEntities);

    console.log(`${userEntities.length} kullanıcı başarıyla seed edildi!`);
  } catch (error) {
    console.error("Kullanıcı seed işlemi sırasında hata:", error);
    throw error;
  }
};