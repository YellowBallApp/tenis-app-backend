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
        email: "admin@example.com",
        name: "Admin",
        surname: "Yönetici",
        phone: "5551234567",
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
        email: "ahmet@example.com",
        name: "Ahmet",
        surname: "Yılmaz",
        phone: "5551234568",
        password: hashedPassword,
        gender: "MALE",
        birthDate: getBirthDateFromAge(28),
        title: "Üye",
        userType: UserType.RESTRICTED,
        // ELO: İleri seviye
        eloRating: 2100,
        peakEloRating: 2120,
        starRating: 4.5,
        rankedMatchesPlayed: 54,
        confidenceInterval: 25,
        lastMatchDate: new Date('2025-10-26'),
      },
      {
        email: "mehmet@example.com",
        name: "Mehmet",
        surname: "Kaya",
        phone: "5551234569",
        password: hashedPassword,
        gender: "MALE",
        birthDate: getBirthDateFromAge(32),
        title: "Üye",
        userType: UserType.RESTRICTED,
        // ELO: Çok iyi
        eloRating: 1980,
        peakEloRating: 2000,
        starRating: 4.0,
        rankedMatchesPlayed: 42,
        confidenceInterval: 40,
        lastMatchDate: new Date('2025-10-24'),
      },
      {
        email: "ayse@example.com",
        name: "Ayşe",
        surname: "Demir",
        phone: "5551234570",
        password: hashedPassword,
        gender: "FEMALE",
        birthDate: getBirthDateFromAge(26),
        title: "Üye",
        userType: UserType.STANDARD,
        // ELO: İyi
        eloRating: 1820,
        peakEloRating: 1850,
        starRating: 3.5,
        rankedMatchesPlayed: 35,
        confidenceInterval: 40,
        lastMatchDate: new Date('2025-10-27'),
      },
      {
        email: "fatma@example.com",
        name: "Fatma",
        surname: "Çelik",
        phone: "5551234571",
        password: hashedPassword,
        gender: "FEMALE",
        birthDate: getBirthDateFromAge(35),
        title: "Üye",
        userType: UserType.STANDARD,
        // ELO: Orta üst
        eloRating: 1680,
        peakEloRating: 1700,
        starRating: 3.0,
        rankedMatchesPlayed: 28,
        confidenceInterval: 60,
        lastMatchDate: new Date('2025-10-20'),
      },
      {
        email: "ali@example.com",
        name: "Ali",
        surname: "Şahin",
        phone: "5551234572",
        password: hashedPassword,
        gender: "MALE",
        birthDate: getBirthDateFromAge(29),
        title: "Üye",
        userType: UserType.RESTRICTED,
        // ELO: Orta
        eloRating: 1520,
        peakEloRating: 1550,
        starRating: 2.5,
        rankedMatchesPlayed: 18,
        confidenceInterval: 90,
        lastMatchDate: new Date('2025-10-22'),
      },
      {
        email: "zeynep@example.com",
        name: "Zeynep",
        surname: "Yıldız",
        phone: "5551234573",
        password: hashedPassword,
        gender: "FEMALE",
        birthDate: getBirthDateFromAge(24),
        title: "Üye",
        userType: UserType.STANDARD,
        // ELO: Orta alt
        eloRating: 1380,
        peakEloRating: 1400,
        starRating: 2.0,
        rankedMatchesPlayed: 12,
        confidenceInterval: 120,
        lastMatchDate: new Date('2025-10-15'),
      },
      {
        email: "can@example.com",
        name: "Can",
        surname: "Aydın",
        phone: "5551234574",
        password: hashedPassword,
        gender: "MALE",
        birthDate: getBirthDateFromAge(31),
        title: "Üye",
        userType: UserType.STANDARD,
        // ELO: Başlangıç
        eloRating: 1220,
        peakEloRating: 1250,
        starRating: 1.5,
        rankedMatchesPlayed: 8,
        confidenceInterval: 150,
        lastMatchDate: new Date('2025-10-10'),
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