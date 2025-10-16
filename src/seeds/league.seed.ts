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
        name: "Defi Lig",
        code: "DL2025",
        description: "EGEV TK Defi Ligi 2025 - Ana Lig",
      },
      {
        name: "Yaz Ligi",
        code: "YL2025",
        description: "EGEV TK Yaz Sezonu Ligi",
      },
      {
        name: "Çiftler Ligi",
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

