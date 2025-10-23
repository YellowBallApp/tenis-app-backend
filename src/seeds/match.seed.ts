import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { MatchHistory } from '../entities/matchHistory.entity';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { GroundType } from '../enum/groundType.enum';

export const seedMatches = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const matchRepository = AppDataSource.getRepository(MatchHistory);
  const leagueStandingsRepository = AppDataSource.getRepository(LeagueStandings);

  console.log('⚔️  Maç geçmişi oluşturuluyor...');

  const users = await userRepository.find();

  if (users.length < 4) {
    console.log('⚠️  En az 4 kullanıcı gerekli');
    return;
  }

  // Lig standings'leri al
  const leagueStandings = await leagueStandingsRepository.find({
    relations: ['league', 'user'],
  });

  // Örnek maçlar
  const matches = [
    {
      winners: [users[0]],
      losers: [users[1]],
      score: '4-2, 4-3',
      matchDate: new Date('2025-01-15'),
      indoorCourt: false,
      courtGround: GroundType.HARD,
    },
    {
      winners: [users[2]],
      losers: [users[3]],
      score: '4-1, 4-2',
      matchDate: new Date('2025-01-16'),
      indoorCourt: false,
      courtGround: GroundType.CLAY,
    },
    {
      winners: [users[0]],
      losers: [users[2]],
      score: '4-3, 3-4, 10-8',
      matchDate: new Date('2025-01-20'),
      indoorCourt: true,
      courtGround: GroundType.HARD,
    },
    {
      winners: [users[1]],
      losers: [users[3]],
      score: '4-0, 4-1',
      matchDate: new Date('2025-01-22'),
      indoorCourt: false,
      courtGround: GroundType.GRASS,
    },
    // Çiftler maçı örneği
    {
      winners: [users[0], users[1]],
      losers: [users[2], users[3]],
      score: '4-2, 4-1',
      matchDate: new Date('2025-01-25'),
      indoorCourt: true,
      courtGround: GroundType.CLAY,
    },
  ];

  // Lig maçları
  const leagueMatches = [];
  
  // İlk lig için birkaç maç ekle
  if (leagueStandings.length >= 4) {
    const firstLeagueStandings = leagueStandings.filter(ls => ls.league?.id === leagueStandings[0]?.league?.id).slice(0, 4);
    
    if (firstLeagueStandings.length >= 2) {
      leagueMatches.push({
        winners: [firstLeagueStandings[0].user],
        losers: [firstLeagueStandings[1].user],
        score: '6-4, 6-3',
        matchDate: new Date('2025-01-10'),
        indoorCourt: false,
        courtGround: GroundType.HARD,
        leagueStanding: firstLeagueStandings[0],
      });
      
      console.log(`📋 Lig maçı: ${firstLeagueStandings[0].user.name} vs ${firstLeagueStandings[1].user.name} (${firstLeagueStandings[0].league?.name || 'Lig'})`);
    }
    
    if (firstLeagueStandings.length >= 4) {
      leagueMatches.push({
        winners: [firstLeagueStandings[2].user],
        losers: [firstLeagueStandings[3].user],
        score: '6-2, 4-6, 6-4',
        matchDate: new Date('2025-01-12'),
        indoorCourt: true,
        courtGround: GroundType.CLAY,
        leagueStanding: firstLeagueStandings[2],
      });
      
      console.log(`📋 Lig maçı: ${firstLeagueStandings[2].user.name} vs ${firstLeagueStandings[3].user.name} (${firstLeagueStandings[2].league?.name || 'Lig'})`);
      
      leagueMatches.push({
        winners: [firstLeagueStandings[0].user],
        losers: [firstLeagueStandings[2].user],
        score: '7-5, 6-4',
        matchDate: new Date('2025-01-18'),
        indoorCourt: false,
        courtGround: GroundType.GRASS,
        leagueStanding: firstLeagueStandings[0],
      });
      
      console.log(`📋 Lig maçı: ${firstLeagueStandings[0].user.name} vs ${firstLeagueStandings[2].user.name} (${firstLeagueStandings[0].league?.name || 'Lig'})`);
    }
  }
  
  // Tüm maçları kaydet
  const allMatches = [...matches, ...leagueMatches];

  for (const matchData of allMatches) {
    const match = matchRepository.create(matchData);
    await matchRepository.save(match);
    const winnerNames = matchData.winners.map(w => w.name).join(' & ');
    const loserNames = matchData.losers.map(l => l.name).join(' & ');
    const matchType = (matchData as any).leagueStanding ? '🏆 Lig Maçı' : '⚔️ Normal Maç';
    console.log(`✅ ${matchType}: ${winnerNames} vs ${loserNames} (Kazanan: ${winnerNames})`);
  }

  console.log('✅ Maç geçmişi oluşturuldu!');
};

