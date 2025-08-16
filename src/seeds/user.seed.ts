import { hash } from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";

export const seedUsers = async () => {
  const userRepository = AppDataSource.getRepository(User);
  
  const userCount = await userRepository.count();
  if (userCount > 0) {
    return;
  }
  
  console.log("Kullanıcılar seedi başladı..");
  
  try {
    const hashedPassword = await hash("password123", 10);

    const usersData = [
      {
        email: "admin@example.com",
        name: "Admin",
        surname: "Admin",
        phone: "1234567890",
        password: hashedPassword,
        address: "Admin adres",
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