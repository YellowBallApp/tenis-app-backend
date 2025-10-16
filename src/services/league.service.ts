import { AppDataSource } from '../config/data-source';
import { LeagueSettings } from '../entities/leagueSettings';
import { LeagueSettingsTemplate } from '../entities/leagueSettingsTemplate';
import { League } from '../entities/league.entity';
import leagueRepository from '../repositories/league.repository';
import { AppError } from '../utils/error/app.error';

export class LeagueService {
  private leagueSettingsRepository;
  private leagueSettingsTemplateRepository;
  private leagueRepository;

  constructor() {
    this.leagueSettingsRepository = AppDataSource.getRepository(LeagueSettings);
    this.leagueSettingsTemplateRepository = AppDataSource.getRepository(LeagueSettingsTemplate);
    this.leagueRepository = leagueRepository;
  }

  // ==================== League Entity CRUD ====================
  
  async createLeague(leagueData: Partial<League>): Promise<League> {
    return await this.leagueRepository.create(leagueData);
  }

  async findLeagueById(id: number): Promise<League> {
    const league = await this.leagueRepository.findById(id);
    if (!league) {
      throw new AppError('LEAGUE_NOT_FOUND');
    }
    return league;
  }

  async findLeagueByCode(code: string): Promise<League> {
    const league = await this.leagueRepository.findByCode(code);
    if (!league) {
      throw new AppError('LEAGUE_NOT_FOUND');
    }
    return league;
  }

  async findAllLeagues(): Promise<League[]> {
    return await this.leagueRepository.findAll();
  }

  async updateLeague(id: number, leagueData: Partial<League>): Promise<League> {
    return await this.leagueRepository.update(id, leagueData);
  }

  async deleteLeague(id: number): Promise<void> {
    await this.leagueRepository.delete(id);
  }

  // Lig ayarlarını getir
  async getLeagueSettings() {
    try {
      const settings = await this.leagueSettingsRepository.find({
        relations: ['leagueSettingsTemplate'],
      });
      
      if (!settings || settings.length === 0) {
        // Varsayılan ayarları oluştur
        return this.createDefaultSettings();
      }
      
      return settings[0];
    } catch (error) {
      throw new Error('Lig ayarları alınırken bir hata oluştu');
    }
  }

  // Varsayılan ayarları oluştur
  private async createDefaultSettings() {
    const defaultSettings = this.leagueSettingsRepository.create({
      code: 'EGEV_DEFI_LEAGUE_2025',
      description: 'EGEV TK Defi Ligi 2025 Sezon Ayarları',
      creator: 'system',
      
      // Lig dönemleri
      leagueStartDate: new Date('2025-02-01'),
      leagueEndDate: new Date('2025-06-05'),
      eliminationStartDate: new Date('2025-06-05'),
      eliminationEndDate: new Date('2025-06-19'),
      finalDate: new Date('2025-06-19'),
      
      // Katılım bilgileri
      registrationFee: 150,
      minMatchCountForElimination: 15,
      
      // Maç formatı
      warmupTimeMinutes: 5,
      gamesPerSet: 4,
      setsCount: 2,
      gameTiebreakPoints: 7,
      matchTiebreakPoints: 10,
      
      // Teklif kuralları
      offerResponseDays: 3,
      matchCompletionDays: 7,
      postMatchCooldownHours: 24,
      reofferCooldownDays: 15,
      consecutiveWOLimit: 3,
      lateArrivalMinutes: 10,
      
      // Sıra bazlı teklif limitleri
      offerLimitsByRank: [
        { range: '1-11', limit: 3 },
        { range: '12-19', limit: 4 },
        { range: '20-27', limit: 5 },
        { range: '28-40', limit: 6 },
        { range: '40+', limit: 10 },
      ],
      
      // Eski alanlar (geriye dönük uyumluluk)
      offerValue: 3,
      offerEverywhere: false,
      shieldIntervalHour: 24,
      userShieldHour: 168,
      userShieldAmount: 3,
      responseTimeHour: 72,
    });

    return await this.leagueSettingsRepository.save(defaultSettings);
  }

  // Lig ayarlarını güncelle
  async updateLeagueSettings(settings: Partial<LeagueSettings>) {
    try {
      const existingSettings = await this.getLeagueSettings();
      
      Object.assign(existingSettings, settings);
      existingSettings.updater = 'admin'; // Bu kısmı authentication'dan alınacak
      
      return await this.leagueSettingsRepository.save(existingSettings);
    } catch (error) {
      throw new Error('Lig ayarları güncellenirken bir hata oluştu');
    }
  }
}

