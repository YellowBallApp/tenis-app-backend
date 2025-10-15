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
      winners: [users[0]],
      losers: [users[1]],
      score: '4-2, 4-3',
      matchDate: new Date('2025-01-15'),
    },
    {
      winners: [users[2]],
      losers: [users[3]],
      score: '4-1, 4-2',
      matchDate: new Date('2025-01-16'),
    },
    {
      winners: [users[0]],
      losers: [users[2]],
      score: '4-3, 3-4, 10-8',
      matchDate: new Date('2025-01-20'),
    },
    {
      winners: [users[1]],
      losers: [users[3]],
      score: '4-0, 4-1',
      matchDate: new Date('2025-01-22'),
    },
    // Çiftler maçı örneği
    {
      winners: [users[0], users[1]],
      losers: [users[2], users[3]],
      score: '4-2, 4-1',
      matchDate: new Date('2025-01-25'),
    },
  ];

  for (const matchData of matches) {
    const match = matchRepository.create(matchData);
    await matchRepository.save(match);
    const winnerNames = matchData.winners.map(w => w.name).join(' & ');
    const loserNames = matchData.losers.map(l => l.name).join(' & ');
    console.log(`✅ ${winnerNames} vs ${loserNames} (Kazanan: ${winnerNames})`);
  }

  console.log('✅ Maç geçmişi oluşturuldu!');
};

