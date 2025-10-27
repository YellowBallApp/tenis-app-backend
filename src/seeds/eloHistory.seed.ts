import { AppDataSource } from "../config/data-source";
import { EloRatingHistory } from "../entities/eloRatingHistory.entity";
import { User } from "../entities/user.entity";

export const seedEloHistory = async () => {
  const eloHistoryRepository = AppDataSource.getRepository(EloRatingHistory);
  const userRepository = AppDataSource.getRepository(User);

  const historyCount = await eloHistoryRepository.count();
  if (historyCount > 0) {
    console.log(`✅ ${historyCount} ELO geçmişi zaten mevcut, seed atlanıyor.`);
    return;
  }

  console.log("📊 ELO rating geçmişi oluşturuluyor...");

  try {
    // Kullanıcıları email'e göre bul
    const admin = await userRepository.findOne({ where: { email: "admin@example.com" } });
    const ahmet = await userRepository.findOne({ where: { email: "ahmet@example.com" } });
    const mehmet = await userRepository.findOne({ where: { email: "mehmet@example.com" } });
    const ayse = await userRepository.findOne({ where: { email: "ayse@example.com" } });
    const fatma = await userRepository.findOne({ where: { email: "fatma@example.com" } });
    const ali = await userRepository.findOne({ where: { email: "ali@example.com" } });
    const zeynep = await userRepository.findOne({ where: { email: "zeynep@example.com" } });
    const can = await userRepository.findOne({ where: { email: "can@example.com" } });

    if (!admin || !ahmet || !mehmet || !ayse || !fatma || !ali || !zeynep || !can) {
      console.log("⚠️ Kullanıcılar bulunamadı, ELO history seed atlanıyor.");
      return;
    }

    const eloHistoryData = [
      // Admin'in ELO geçmişi (Elite seviye - 2250)
      {
        user: admin,
        userId: admin.id,
        previousRating: 1500,
        newRating: 1532,
        ratingChange: 32,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 1,
        confidenceInterval: 150,
        changeReason: 'match_win',
        notes: 'İlk maç kazanımı',
        createdAt: new Date('2025-01-15T10:00:00Z'),
      },
      {
        user: admin,
        userId: admin.id,
        previousRating: 2180,
        newRating: 2210,
        ratingChange: 30,
        previousStarRating: 4.5,
        newStarRating: 5.0,
        matchesPlayedAtTime: 85,
        confidenceInterval: 25,
        changeReason: 'match_win',
        notes: 'Elite seviyeye yükselme',
        createdAt: new Date('2025-10-20T15:30:00Z'),
      },
      {
        user: admin,
        userId: admin.id,
        previousRating: 2210,
        newRating: 2250,
        ratingChange: 40,
        previousStarRating: 5.0,
        newStarRating: 5.0,
        matchesPlayedAtTime: 87,
        confidenceInterval: 25,
        changeReason: 'match_win',
        notes: 'Turnuva finalinde kazanım',
        createdAt: new Date('2025-10-25T18:00:00Z'),
      },

      // Ahmet'in ELO geçmişi (İleri seviye - 2100)
      {
        user: ahmet,
        userId: ahmet.id,
        previousRating: 1500,
        newRating: 1540,
        ratingChange: 40,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 1,
        confidenceInterval: 150,
        changeReason: 'match_win',
        notes: 'İlk maç kazanımı',
        createdAt: new Date('2025-02-10T14:00:00Z'),
      },
      {
        user: ahmet,
        userId: ahmet.id,
        previousRating: 2070,
        newRating: 2100,
        ratingChange: 30,
        previousStarRating: 4.5,
        newStarRating: 4.5,
        matchesPlayedAtTime: 54,
        confidenceInterval: 25,
        changeReason: 'match_win',
        notes: 'Güçlü performans',
        createdAt: new Date('2025-10-26T16:00:00Z'),
      },

      // Mehmet'in ELO geçmişi (Çok iyi - 1980)
      {
        user: mehmet,
        userId: mehmet.id,
        previousRating: 1500,
        newRating: 1524,
        ratingChange: 24,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 1,
        confidenceInterval: 150,
        changeReason: 'match_win',
        createdAt: new Date('2025-03-05T11:00:00Z'),
      },
      {
        user: mehmet,
        userId: mehmet.id,
        previousRating: 1955,
        newRating: 1980,
        ratingChange: 25,
        previousStarRating: 4.0,
        newStarRating: 4.0,
        matchesPlayedAtTime: 42,
        confidenceInterval: 40,
        changeReason: 'match_win',
        createdAt: new Date('2025-10-24T13:30:00Z'),
      },

      // Ayşe'nin ELO geçmişi (İyi - 1820)
      {
        user: ayse,
        userId: ayse.id,
        previousRating: 1500,
        newRating: 1540,
        ratingChange: 40,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 1,
        confidenceInterval: 150,
        changeReason: 'match_win',
        createdAt: new Date('2025-04-12T09:00:00Z'),
      },
      {
        user: ayse,
        userId: ayse.id,
        previousRating: 1790,
        newRating: 1820,
        ratingChange: 30,
        previousStarRating: 3.5,
        newStarRating: 3.5,
        matchesPlayedAtTime: 35,
        confidenceInterval: 40,
        changeReason: 'match_win',
        createdAt: new Date('2025-10-27T14:00:00Z'),
      },

      // Fatma'nın ELO geçmişi (Orta üst - 1680)
      {
        user: fatma,
        userId: fatma.id,
        previousRating: 1500,
        newRating: 1532,
        ratingChange: 32,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 1,
        confidenceInterval: 150,
        changeReason: 'match_win',
        createdAt: new Date('2025-05-20T10:30:00Z'),
      },
      {
        user: fatma,
        userId: fatma.id,
        previousRating: 1655,
        newRating: 1680,
        ratingChange: 25,
        previousStarRating: 3.0,
        newStarRating: 3.0,
        matchesPlayedAtTime: 28,
        confidenceInterval: 60,
        changeReason: 'match_win',
        createdAt: new Date('2025-10-20T11:00:00Z'),
      },

      // Ali'nin ELO geçmişi (Orta - 1520)
      {
        user: ali,
        userId: ali.id,
        previousRating: 1500,
        newRating: 1532,
        ratingChange: 32,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 1,
        confidenceInterval: 150,
        changeReason: 'match_win',
        createdAt: new Date('2025-06-15T15:00:00Z'),
      },
      {
        user: ali,
        userId: ali.id,
        previousRating: 1495,
        newRating: 1520,
        ratingChange: 25,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 18,
        confidenceInterval: 90,
        changeReason: 'match_win',
        createdAt: new Date('2025-10-22T12:00:00Z'),
      },

      // Zeynep'in ELO geçmişi (Orta alt - 1380)
      {
        user: zeynep,
        userId: zeynep.id,
        previousRating: 1500,
        newRating: 1468,
        ratingChange: -32,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 1,
        confidenceInterval: 150,
        changeReason: 'match_loss',
        notes: 'İlk maç kaybı',
        createdAt: new Date('2025-07-10T14:30:00Z'),
      },
      {
        user: zeynep,
        userId: zeynep.id,
        previousRating: 1360,
        newRating: 1380,
        ratingChange: 20,
        previousStarRating: 2.0,
        newStarRating: 2.0,
        matchesPlayedAtTime: 12,
        confidenceInterval: 120,
        changeReason: 'match_win',
        createdAt: new Date('2025-10-15T10:00:00Z'),
      },

      // Can'ın ELO geçmişi (Başlangıç - 1220)
      {
        user: can,
        userId: can.id,
        previousRating: 1500,
        newRating: 1460,
        ratingChange: -40,
        previousStarRating: 2.5,
        newStarRating: 2.5,
        matchesPlayedAtTime: 1,
        confidenceInterval: 150,
        changeReason: 'match_loss',
        notes: 'İlk maç kaybı',
        createdAt: new Date('2025-08-05T16:00:00Z'),
      },
      {
        user: can,
        userId: can.id,
        previousRating: 1200,
        newRating: 1220,
        ratingChange: 20,
        previousStarRating: 1.5,
        newStarRating: 1.5,
        matchesPlayedAtTime: 8,
        confidenceInterval: 150,
        changeReason: 'match_win',
        notes: 'İlk galibiyet',
        createdAt: new Date('2025-10-10T13:00:00Z'),
      },

      // Decay örneği (Fatma - 6 ay maç yapmadı)
      {
        user: fatma,
        userId: fatma.id,
        previousRating: 1700,
        newRating: 1680,
        ratingChange: -20,
        previousStarRating: 3.0,
        newStarRating: 3.0,
        matchesPlayedAtTime: 28,
        confidenceInterval: 60,
        changeReason: 'decay',
        notes: '6 ay aktivite olmadığı için decay uygulandı',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
    ];

    const historyEntities = eloHistoryRepository.create(eloHistoryData);
    await eloHistoryRepository.save(historyEntities);

    console.log(`✅ ${historyEntities.length} ELO rating geçmişi başarıyla seed edildi!`);
    
    // İstatistik göster
    console.log("\n📊 ELO Dağılımı:");
    console.log(`   🌟 5.0 Elite: 1 oyuncu (Admin - 2250)`);
    console.log(`   ⭐ 4.5 İleri: 1 oyuncu (Ahmet - 2100)`);
    console.log(`   ⭐ 4.0 Çok İyi: 1 oyuncu (Mehmet - 1980)`);
    console.log(`   ⭐ 3.5 İyi: 1 oyuncu (Ayşe - 1820)`);
    console.log(`   ⭐ 3.0 Orta Üst: 1 oyuncu (Fatma - 1680)`);
    console.log(`   ⭐ 2.5 Orta: 1 oyuncu (Ali - 1520)`);
    console.log(`   ⭐ 2.0 Orta Alt: 1 oyuncu (Zeynep - 1380)`);
    console.log(`   ⭐ 1.5 Başlangıç: 1 oyuncu (Can - 1220)\n`);
    
  } catch (error) {
    console.error("❌ ELO history seed işlemi sırasında hata:", error);
    throw error;
  }
};

