import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { League } from '../entities/league.entity';

export const seedLeagues = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const leagueRepository = AppDataSource.getRepository(League);

  console.log('🎾 Lig verileri oluşturuluyor...');

  // Tüm kullanıcıları al
  const users = await userRepository.find();

  if (users.length === 0) {
    console.log('⚠️  Önce kullanıcı seedini çalıştırın');
    return;
  }

  // Her kullanıcı için lig kaydı oluştur
  for (let i = 0; i < users.length; i++) {
    const existingLeague = await leagueRepository.findOne({
      where: { user: { id: users[i].id } },
    });

    if (!existingLeague) {
      const league = leagueRepository.create({
        user: users[i],
        leagueRanking: i + 1, // Sıralama: 1, 2, 3, ...
        description: `${users[i].name} - ${i + 1}. sırada`,
      });

      await leagueRepository.save(league);
      console.log(`✅ ${users[i].name} -> ${i + 1}. sıra`);
    }
  }

  console.log('✅ Lig verileri oluşturuldu!');
};

