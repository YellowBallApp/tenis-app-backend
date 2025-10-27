import { AppDataSource } from '../config/data-source';
import { LeagueSettings } from '../entities/leagueSettings.entity';
import { League } from '../entities/league.entity';
import leagueRepository from '../repositories/league.repository';
import { AppError } from '../utils/error/app.error';

export class LeagueService {
  private leagueSettingsRepository;
  private leagueRepository;

  constructor() {
    this.leagueSettingsRepository = AppDataSource.getRepository(LeagueSettings);
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

  // Lig ayarlarını getir (leagueId'ye göre)
  async getLeagueSettings(leagueId?: number) {
    try {
      if (leagueId) {
        const settings = await this.leagueSettingsRepository.findOne({
          where: { league: { id: leagueId } },
          relations: ['league'],
        });
        
        if (!settings) {
          throw new AppError('LEAGUE_NOT_FOUND');
        }
        
        return settings;
      }
      
      // LeagueId verilmemişse ilk settings'i döndür
      const settings = await this.leagueSettingsRepository.find({
        relations: ['league'],
      });
      
      if (!settings || settings.length === 0) {
        throw new AppError('LEAGUE_NOT_FOUND');
      }
      
      return settings[0];
    } catch (error) {
      throw error;
    }
  }

  // Lig ayarlarını güncelle
  async updateLeagueSettings(leagueId: number, settingsData: Partial<LeagueSettings>) {
    try {
      const existingSettings = await this.getLeagueSettings(leagueId);
      
      Object.assign(existingSettings, settingsData);
      existingSettings.updater = 'admin'; // Bu kısmı authentication'dan alınacak
      
      return await this.leagueSettingsRepository.save(existingSettings);
    } catch (error) {
      throw new Error('Lig ayarları güncellenirken bir hata oluştu');
    }
  }

  // Yeni lig settings oluştur
  async createLeagueSettings(league: League, settingsData?: Partial<LeagueSettings>): Promise<LeagueSettings> {
    const defaultData = {
      description: `${league.name} Sezon Ayarları`,
      creator: 'system',
      league: league,
      
      // Lig dönemleri
      leagueStartDate: new Date('2025-02-01'),
      leagueEndDate: new Date('2025-06-05'),
      eliminationStartDate: new Date('2025-06-05'),
      eliminationEndDate: new Date('2025-06-19'),
      finalDate: new Date('2025-06-19'),
      
      // Katılım bilgileri
      registrationFee: 150,
      minMatchCountForElimination: 15,
      minAge: 18,
      maxAge: 65,
      
      // Maç formatı
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
      
      // Sıra bazlı teklif limitleri
      offerLimitsByRank: [
        { range: '1-11', limit: 3 },
        { range: '12-19', limit: 4 },
        { range: '20-27', limit: 5 },
        { range: '28-40', limit: 6 },
        { range: '40+', limit: 10 },
      ],
      
      responseTimeHour: 72,
      ...settingsData,
    };

    const settings = this.leagueSettingsRepository.create(defaultData);
    return await this.leagueSettingsRepository.save(settings);
  }
}

