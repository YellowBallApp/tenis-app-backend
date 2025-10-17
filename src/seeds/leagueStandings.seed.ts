import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { League } from '../entities/league.entity';

// Fisher-Yates shuffle algoritması
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const seedLeagueStandings = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const leagueStandingsRepository = AppDataSource.getRepository(LeagueStandings);
  const leagueRepository = AppDataSource.getRepository(League);

  console.log('🎾 Lig sıralama verileri oluşturuluyor...');

  // Tüm ligleri al
  const leagues = await leagueRepository.find({
    order: { id: 'ASC' }
  });

  if (leagues.length === 0) {
    console.log('⚠️  Önce lig entity seedini çalıştırın');
    return;
  }

  // Tüm kullanıcıları al
  const users = await userRepository.find();

  if (users.length === 0) {
    console.log('⚠️  Önce kullanıcı seedini çalıştırın');
    return;
  }

  // Her lig için farklı sıralamalarla ve farklı sayıda kullanıcılar ekle
  for (const league of leagues) {
    console.log(`\n📊 ${league.description} için sıralama oluşturuluyor...`);
    
    // Her lig için kullanıcıları karıştır
    const shuffledUsers = shuffleArray(users);
    
    // Her lig için rastgele bir kullanıcı sayısı belirle (minimum 4, maksimum tüm kullanıcılar)
    const minPlayers = Math.min(4, users.length);
    const maxPlayers = users.length;
    const playerCount = Math.floor(Math.random() * (maxPlayers - minPlayers + 1)) + minPlayers;
    
    // Belirlenen sayıda kullanıcıyı seç
    const selectedUsers = shuffledUsers.slice(0, playerCount);
    
    console.log(`   👥 Bu ligde ${playerCount} oyuncu olacak`);
    
    for (let i = 0; i < selectedUsers.length; i++) {
      const existingStanding = await leagueStandingsRepository.findOne({
        where: { 
          user: { id: selectedUsers[i].id },
          league: { id: league.id }
        },
      });

      if (!existingStanding) {
        const standing = leagueStandingsRepository.create({
          user: selectedUsers[i],
          league: league,
          leagueRanking: i + 1, // Sıralama: 1, 2, 3, ...
        });

        await leagueStandingsRepository.save(standing);
        console.log(`   ✅ ${selectedUsers[i].name} -> ${league.description} - ${i + 1}. sıra`);
      }
    }
  }

  console.log('\n✅ Tüm ligler için sıralama verileri oluşturuldu!');
};

