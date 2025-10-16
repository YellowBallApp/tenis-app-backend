import { AppDataSource } from "../config/data-source";
import { League } from "../entities/league.entity";

export const seedLeagues = async () => {
  const leagueRepository = AppDataSource.getRepository(League);
  
  const leagueCount = await leagueRepository.count();
  if (leagueCount > 0) {
    console.log(`✅ ${leagueCount} lig zaten mevcut, seed atlanıyor.`);
    return;
  }
  
  console.log("🏆 Ligler oluşturuluyor...");
  
  try {
    const leaguesData = [
      {
        code: "DL2025",
        description: "EGEV TK Defi Ligi 2025 - Ana Lig",
      },
      {
        code: "YL2025",
        description: "EGEV TK Yaz Sezonu Ligi",
      },
      {
        code: "CL2025",
        description: "EGEV TK Çiftler Ligi",
      },
    ];

    const leagues = leagueRepository.create(leaguesData);
    await leagueRepository.save(leagues);
    
    console.log(`✅ ${leagues.length} lig oluşturuldu`);
  } catch (error) {
    console.error("❌ Lig oluşturma hatası:", error);
    throw error;
  }
};

