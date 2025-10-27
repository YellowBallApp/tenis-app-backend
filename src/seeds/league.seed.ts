import { AppDataSource } from "../config/data-source";
import { League } from "../entities/league.entity";
import { LeagueSettings } from "../entities/leagueSettings.entity";

export const seedLeagues = async () => {
  const leagueRepository = AppDataSource.getRepository(League);
  const leagueSettingsRepository = AppDataSource.getRepository(LeagueSettings);
  
  const leagueCount = await leagueRepository.count();
  if (leagueCount > 0) {
    console.log(`✅ ${leagueCount} lig zaten mevcut, seed atlanıyor.`);
    return;
  }
  
  console.log("🏆 Ligler ve ayarları oluşturuluyor...");
  
  try {
    // Defi Lig
    const defiLig = leagueRepository.create({
      name: "Defi Lig",
      code: "DL2025",
      description: "EGEV TK Defi Ligi 2025 - Ana Lig",
    });
    await leagueRepository.save(defiLig);

    const defiLigSettings = leagueSettingsRepository.create({
      league: defiLig,
      description: "Defi Lig 2025 Sezon Ayarları",
      creator: "system",
      leagueStartDate: new Date("2025-02-01"),
      leagueEndDate: new Date("2025-06-05"),
      eliminationStartDate: new Date("2025-06-05"),
      eliminationEndDate: new Date("2025-06-19"),
      finalDate: new Date("2025-06-19"),
      registrationFee: 150,
      minMatchCountForElimination: 15,
      minAge: 18,
      maxAge: 65,
      gamesPerSet: 4,
      setsCount: 2,
      gameTiebreakPoints: 7,
      matchTiebreakPoints: 10,
      offerResponseDays: 3,
      matchCompletionDays: 7,
      postMatchCooldownHours: 24,
      reofferCooldownDays: 15,
      consecutiveWOLimit: 3,
      offerLimitsByRank: [
        { range: "1-11", limit: 3 },
        { range: "12-19", limit: 4 },
        { range: "20-27", limit: 5 },
        { range: "28-40", limit: 6 },
        { range: "40+", limit: 10 },
      ],
      responseTimeHour: 72,
    });
    await leagueSettingsRepository.save(defiLigSettings);

    // Yaz Ligi
    const yazLigi = leagueRepository.create({
      name: "Yaz Ligi",
      code: "YL2025",
      description: "EGEV TK Yaz Sezonu Ligi",
    });
    await leagueRepository.save(yazLigi);

    const yazLigiSettings = leagueSettingsRepository.create({
      league: yazLigi,
      description: "Yaz Ligi 2025 Sezon Ayarları",
      creator: "system",
      leagueStartDate: new Date("2025-06-15"),
      leagueEndDate: new Date("2025-09-15"),
      eliminationStartDate: new Date("2025-09-15"),
      eliminationEndDate: new Date("2025-09-30"),
      finalDate: new Date("2025-09-30"),
      registrationFee: 100,
      minMatchCountForElimination: 10,
      minAge: 16,
      maxAge: null,
      gamesPerSet: 4,
      setsCount: 2,
      gameTiebreakPoints: 7,
      matchTiebreakPoints: 10,
      offerResponseDays: 2,
      matchCompletionDays: 5,
      postMatchCooldownHours: 12,
      reofferCooldownDays: 10,
      consecutiveWOLimit: 2,
      offerLimitsByRank: [
        { range: "1-10", limit: 4 },
        { range: "11-20", limit: 5 },
        { range: "20+", limit: 8 },
      ],
      responseTimeHour: 48,
    });
    await leagueSettingsRepository.save(yazLigiSettings);

    // Çiftler Ligi
    const ciftlerLigi = leagueRepository.create({
      name: "Çiftler Ligi",
      code: "CL2025",
      description: "EGEV TK Çiftler Ligi",
    });
    await leagueRepository.save(ciftlerLigi);

    const ciftlerLigiSettings = leagueSettingsRepository.create({
      league: ciftlerLigi,
      description: "Çiftler Ligi 2025 Sezon Ayarları",
      creator: "system",
      leagueStartDate: new Date("2025-03-01"),
      leagueEndDate: new Date("2025-07-01"),
      eliminationStartDate: new Date("2025-07-01"),
      eliminationEndDate: new Date("2025-07-15"),
      finalDate: new Date("2025-07-15"),
      registrationFee: 200,
      minMatchCountForElimination: 12,
      minAge: 18,
      maxAge: null,
      gamesPerSet: 6,
      setsCount: 3,
      gameTiebreakPoints: 7,
      matchTiebreakPoints: 10,
      offerResponseDays: 3,
      matchCompletionDays: 7,
      postMatchCooldownHours: 24,
      reofferCooldownDays: 15,
      consecutiveWOLimit: 3,
      offerLimitsByRank: [
        { range: "1-8", limit: 3 },
        { range: "9-16", limit: 4 },
        { range: "16+", limit: 6 },
      ],
      responseTimeHour: 72,
    });
    await leagueSettingsRepository.save(ciftlerLigiSettings);
    
    console.log(`✅ 3 lig ve ayarları başarıyla oluşturuldu`);
  } catch (error) {
    console.error("❌ Lig oluşturma hatası:", error);
    throw error;
  }
};
