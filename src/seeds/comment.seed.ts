import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { MatchHistory } from '../entities/matchHistory.entity';
import { CommentTextArea } from '../entities/commentTextArea';
import { CommentType } from '../enum/commentEnum';

export const seedComments = async () => {
  const userRepository = AppDataSource.getRepository(User);
  const matchHistoryRepository = AppDataSource.getRepository(MatchHistory);
  const commentRepository = AppDataSource.getRepository(CommentTextArea);

  console.log('💬 Maç yorumları oluşturuluyor...');

  const users = await userRepository.find();
  const matches = await matchHistoryRepository.find({
    relations: ['winners', 'losers'],
    order: { matchDate: 'ASC' },
  });

  if (users.length === 0) {
    console.log('⚠️  Önce kullanıcı seedini çalıştırın');
    return;
  }

  if (matches.length === 0) {
    console.log('⚠️  Önce maç seedini çalıştırın');
    return;
  }

  const matchComments: any[] = [];
  
  // İlk maç yorumları
  if (matches[0] && matches[0].winners.length > 0 && matches[0].losers.length > 0) {
    matchComments.push(
      {
        matchHistory: matches[0],
        user: matches[0].winners[0],
        comment: 'Harika bir maçtı! Rakibim çok iyi oynadı, keyifli bir mücadele oldu. 🎾',
        CommentType: CommentType.MATCH_COMMENT,
      },
      {
        matchHistory: matches[0],
        user: matches[0].losers[0],
        comment: 'Bugün formum yerinde değildi ama güzel bir deneyimdi. Bir dahaki sefere! 💪',
        CommentType: CommentType.MATCH_COMMENT,
      }
    );
  }
  
  // İkinci maç yorumları
  if (matches[1] && matches[1].winners.length > 0 && matches[1].losers.length > 0) {
    matchComments.push(
      {
        matchHistory: matches[1],
        user: matches[1].winners[0],
        comment: 'Zorlu bir maç oldu. İkinci sette biraz zorlandım ama sonunda kazandım.',
        CommentType: CommentType.MATCH_COMMENT,
      },
      {
        matchHistory: matches[1],
        user: matches[1].losers[0],
        comment: 'Rakibim servis oyununda çok iyiydi. Ben de bunun üzerinde çalışacağım.',
        CommentType: CommentType.MATCH_COMMENT,
      }
    );
  }
  
  // Üçüncü maç yorumları
  if (matches[2] && matches[2].winners.length > 0 && matches[2].losers.length > 0) {
    matchComments.push(
      {
        matchHistory: matches[2],
        user: matches[2].winners[0],
        comment: 'Match tiebreak çok heyecanlıydı! Böyle maçlar tenisi güzel yapıyor.',
        CommentType: CommentType.MATCH_COMMENT,
      },
      {
        matchHistory: matches[2],
        user: matches[2].losers[0],
        comment: 'Üçüncü sette çok yaklaştım ama olmadı. Tebrikler rakibime!',
        CommentType: CommentType.MATCH_COMMENT,
      }
    );
  }

  // Dördüncü maça yorum ekle (varsa)
  if (matches.length > 3 && matches[3].winners.length > 0 && matches[3].losers.length > 0) {
    matchComments.push(
      {
        matchHistory: matches[3],
        user: matches[3].winners[0],
        comment: 'Rahat bir galibiyet. Bugün her şey istediğim gibi gitti. ✨',
        CommentType: CommentType.MATCH_COMMENT,
      },
      {
        matchHistory: matches[3],
        user: matches[3].losers[0],
        comment: 'Rakibim bugün çok formda idi. Tebrikler!',
        CommentType: CommentType.MATCH_COMMENT,
      }
    );
  }

  // Beşinci maça (çiftler maçı) yorum ekle (varsa)
  if (matches.length > 4 && matches[4].winners.length >= 2 && matches[4].losers.length > 0) {
    matchComments.push(
      {
        matchHistory: matches[4],
        user: matches[4].winners[0],
        comment: 'Partnerimle harika bir uyum yakaladık. Çiftler maçları çok eğlenceli! 🎾🎾',
        CommentType: CommentType.MATCH_COMMENT,
      },
      {
        matchHistory: matches[4],
        user: matches[4].winners[1],
        comment: 'Takım arkadaşımla birlikte kazanmak çok güzeldi. Harika koordinasyon!',
        CommentType: CommentType.MATCH_COMMENT,
      },
      {
        matchHistory: matches[4],
        user: matches[4].losers[0],
        comment: 'Rakiplerimiz çok iyi oynadı. Biz de çalışacağız ve daha iyisini yapacağız!',
        CommentType: CommentType.MATCH_COMMENT,
      }
    );
  }

  // Eğer yeterli kullanıcı varsa, coach yorumları da ekle
  if (users.length > 4) {
    const coach = users[4]; // 5. kullanıcıyı coach olarak kullan
    
    if (matches.length > 0 && matches[0].winners.length > 0 && matches[0].losers.length > 0) {
      matchComments.push({
        matchHistory: matches[0],
        user: coach,
        comment: 'Güzel bir başlangıç maçı. Her iki oyuncu da teknik olarak iyi bir performans sergiledi. Kazanan oyuncunun servis vuruşları özellikle etkili idi.',
        CommentType: CommentType.COACH_COMMENT,
      });
    }

    if (matches.length > 2 && matches[2].winners.length > 0 && matches[2].losers.length > 0) {
      matchComments.push({
        matchHistory: matches[2],
        user: coach,
        comment: "Match tiebreak'te zihinsel dayanıklılık çok önemliydi. Her iki oyuncu da önemli puanlarda soğukkanlılığını korumaya çalıştı. Kazanan oyuncu kritik anlarda daha kararlı davrandı.",
        CommentType: CommentType.COACH_COMMENT,
      });
    }
  }

  for (const commentData of matchComments) {
    if (!commentData.user || !commentData.matchHistory) {
      console.log('⚠️  Geçersiz yorum verisi atlandı');
      continue;
    }
    
    const comment = commentRepository.create(commentData);
    await commentRepository.save(comment);
    
    const matchInfo = commentData.matchHistory.winners
      .map((w: any) => w?.name || 'Unknown')
      .join(' & ') + 
      ' vs ' + 
      commentData.matchHistory.losers
      .map((l: any) => l?.name || 'Unknown')
      .join(' & ');
    
    console.log(`✅ ${commentData.user.name} - ${matchInfo} (${commentData.CommentType})`);
  }

  console.log(`✅ Toplam ${matchComments.length} maç yorumu oluşturuldu!`);
};

