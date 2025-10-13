import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { MatchHistory } from '../entities/matchHistory.entity';

export const seedMatches = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const matchRepository = AppDataSource.getRepository(MatchHistory);

  console.log('⚔️  Maç geçmişi oluşturuluyor...');

  const users = await userRepository.find();

  if (users.length < 4) {
    console.log('⚠️  En az 4 kullanıcı gerekli');
    return;
  }

  // Örnek maçlar
  const matches = [
    {
      winner: users[0],
      loser: users[1],
      score: '4-2, 4-3',
      matchDate: new Date('2025-01-15'),
    },
    {
      winner: users[2],
      loser: users[3],
      score: '4-1, 4-2',
      matchDate: new Date('2025-01-16'),
    },
    {
      winner: users[0],
      loser: users[2],
      score: '4-3, 3-4, 10-8',
      matchDate: new Date('2025-01-20'),
    },
    {
      winner: users[1],
      loser: users[3],
      score: '4-0, 4-1',
      matchDate: new Date('2025-01-22'),
    },
  ];

  for (const matchData of matches) {
    const match = matchRepository.create(matchData);
    await matchRepository.save(match);
    console.log(`✅ ${matchData.winner.name} vs ${matchData.loser.name} (Kazanan: ${matchData.winner.name})`);
  }

  console.log('✅ Maç geçmişi oluşturuldu!');
};

