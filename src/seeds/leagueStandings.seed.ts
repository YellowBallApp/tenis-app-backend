import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { League } from '../entities/league.entity';

export const seedLeagueStandings = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const leagueStandingsRepository = AppDataSource.getRepository(LeagueStandings);
  const leagueRepository = AppDataSource.getRepository(League);

  console.log('🎾 Lig sıralama verileri oluşturuluyor...');

  // İlk ligi al (ana lig)
  const mainLeague = await leagueRepository.findOne({
    where: {},
    order: { id: 'ASC' }
  });

  if (!mainLeague) {
    console.log('⚠️  Önce lig entity seedini çalıştırın');
    return;
  }

  // Tüm kullanıcıları al
  const users = await userRepository.find();

  if (users.length === 0) {
    console.log('⚠️  Önce kullanıcı seedini çalıştırın');
    return;
  }

  // Her kullanıcı için ana ligde sıralama oluştur
  for (let i = 0; i < users.length; i++) {
    const existingStanding = await leagueStandingsRepository.findOne({
      where: { 
        user: { id: users[i].id },
        league: { id: mainLeague.id }
      },
    });

    if (!existingStanding) {
      const standing = leagueStandingsRepository.create({
        user: users[i],
        league: mainLeague,
        leagueRanking: i + 1, // Sıralama: 1, 2, 3, ...
        description: `${users[i].name} - ${i + 1}. sırada`,
      });

      await leagueStandingsRepository.save(standing);
      console.log(`✅ ${users[i].name} -> ${mainLeague.description} - ${i + 1}. sıra`);
    }
  }

  console.log('✅ Lig sıralama verileri oluşturuldu!');
};

