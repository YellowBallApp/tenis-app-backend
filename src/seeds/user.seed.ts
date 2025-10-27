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

    const usersData = [
      {
        email: "admin@example.com",
        name: "Admin",
        surname: "Yönetici",
        phone: "5551234567",
        password: hashedPassword,
        gender: "MALE",
        age: 45,
        title: "Kulüp Yöneticisi",
        userType: UserType.STANDARD, // Admin kısıtsız
      },
      {
        email: "ahmet@example.com",
        name: "Ahmet",
        surname: "Yılmaz",
        phone: "5551234568",
        password: hashedPassword,
        gender: "MALE",
        age: 28,
        title: "Üye",
        userType: UserType.RESTRICTED, // Kısıtlı kullanıcı
      },
      {
        email: "mehmet@example.com",
        name: "Mehmet",
        surname: "Kaya",
        phone: "5551234569",
        password: hashedPassword,
        gender: "MALE",
        age: 32,
        title: "Üye",
        userType: UserType.RESTRICTED, // Kısıtlı kullanıcı
      },
      {
        email: "ayse@example.com",
        name: "Ayşe",
        surname: "Demir",
        phone: "5551234570",
        password: hashedPassword,
        gender: "FEMALE",
        age: 26,
        title: "Üye",
        userType: UserType.STANDARD, // Standart kullanıcı
      },
      {
        email: "fatma@example.com",
        name: "Fatma",
        surname: "Çelik",
        phone: "5551234571",
        password: hashedPassword,
        gender: "FEMALE",
        age: 35,
        title: "Üye",
        userType: UserType.STANDARD, // Standart kullanıcı
      },
      {
        email: "ali@example.com",
        name: "Ali",
        surname: "Şahin",
        phone: "5551234572",
        password: hashedPassword,
        gender: "MALE",
        age: 29,
        title: "Üye",
        userType: UserType.RESTRICTED, // Kısıtlı kullanıcı
      },
      {
        email: "zeynep@example.com",
        name: "Zeynep",
        surname: "Yıldız",
        phone: "5551234573",
        password: hashedPassword,
        gender: "FEMALE",
        age: 24,
        title: "Üye",
        userType: UserType.STANDARD, // Standart kullanıcı
      },
      {
        email: "can@example.com",
        name: "Can",
        surname: "Aydın",
        phone: "5551234574",
        password: hashedPassword,
        gender: "MALE",
        age: 31,
        title: "Üye",
        userType: UserType.STANDARD, // Standart kullanıcı
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