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
    // Validation: name ve code zorunlu alanlar
    if (!leagueData.name || !leagueData.code) {
      throw new AppError('MISSING_REQUIRED_FIELDS');
    }

    // Code'un unique olduğunu kontrol et
    const existingLeague = await this.leagueRepository.findByCode(leagueData.code);
    if (existingLeague) {
      throw new AppError('LEAGUE_CODE_ALREADY_EXISTS');
    }

    try {
      // Icon varsayılan değeri
      if (!leagueData.icon) {
        leagueData.icon = 'trophy';
      }
      
      // League'i oluştur (settings admin panelinden oluşturulacak)
      const league = await this.leagueRepository.create(leagueData);
      
      // League'i döndür
      return await this.leagueRepository.findById(league.id);
    } catch (error: any) {
      // TypeORM unique constraint violation hatası
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        throw new AppError('LEAGUE_CODE_ALREADY_EXISTS');
      }
      
      // Diğer hataları tekrar fırlat
      throw error;
    }
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
        // Önce league'in var olup olmadığını kontrol et
        const league = await this.leagueRepository.findById(leagueId);
        if (!league) {
          throw new AppError('LEAGUE_NOT_FOUND');
        }

        // Settings'i bul
        const settings = await this.leagueSettingsRepository.findOne({
          where: { league: { id: leagueId } },
          relations: ['league'],
        });
        
        // Settings yoksa null döndür (admin panelinden oluşturulmalı)
        if (!settings) {
          return null;
        }
        
        return settings;
      }
      
      // LeagueId verilmemişse ilk settings'i döndür
      const settings = await this.leagueSettingsRepository.find({
        relations: ['league'],
      });
      
      if (!settings || settings.length === 0) {
        return null;
      }
      
      return settings[0];
    } catch (error) {
      // AppError ise direkt fırlat
      if (error instanceof AppError) {
        throw error;
      }
      // Diğer hataları tekrar fırlat
      throw error;
    }
  }

  // Lig ayarlarını güncelle
  async updateLeagueSettings(leagueId: number, settingsData: Partial<LeagueSettings>) {
    try {
      // Önce league'in var olup olmadığını kontrol et
      const league = await this.leagueRepository.findById(leagueId);
      if (!league) {
        throw new AppError('LEAGUE_NOT_FOUND');
      }
      
      // offerLimitsByRank zorunluluk kontrolü (eğer gönderilmişse)
      if (settingsData.offerLimitsByRank !== undefined) {
        if (!Array.isArray(settingsData.offerLimitsByRank) || settingsData.offerLimitsByRank.length === 0) {
          throw new AppError('OFFER_LIMITS_BY_RANK_REQUIRED');
        }
      }

      // Mevcut settings'i bul
      let existingSettings = await this.leagueSettingsRepository.findOne({
        where: { league: { id: leagueId } },
        relations: ['league'],
      });
      
      // Settings yoksa yeni oluştur (admin panelinden güncelleme yapılırken)
      if (!existingSettings) {
        existingSettings = await this.createLeagueSettings(league, settingsData);
        return existingSettings;
      }
      
      // Mevcut settings'i güncelle
      Object.assign(existingSettings, settingsData);
      existingSettings.updater = 'admin'; // Bu kısmı authentication'dan alınacak
      
      return await this.leagueSettingsRepository.save(existingSettings);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error('Lig ayarları güncellenirken bir hata oluştu');
    }
  }

  // Yeni lig settings oluştur
  async createLeagueSettings(league: League, settingsData?: Partial<LeagueSettings>): Promise<LeagueSettings> {
    // offerLimitsByRank zorunluluk kontrolü
    if (!settingsData?.offerLimitsByRank || !Array.isArray(settingsData.offerLimitsByRank) || settingsData.offerLimitsByRank.length === 0) {
      throw new AppError('OFFER_LIMITS_BY_RANK_REQUIRED');
    }
    
    const defaultData: Partial<LeagueSettings> = {
      description: `${league.name} Sezon Ayarları`,
      league: league,
      
      // Zorunlu olmayan alanlar (nullable) - null olarak sıfırlanıyor
      leagueDescription: null as any,
      rewards: null as any,
      creator: null as any,
      updater: null as any,
      minAge: null,
      maxAge: null,
      minStarRating: null,
      maxStarRating: null,
      
      // Lig dönemleri
      leagueStartDate: new Date('2025-02-01'),
      leagueEndDate: new Date('2025-06-05'),
      
      // Katılım bilgileri
      registrationFee: null,
      minMatchCountForElimination: 15,
      
      // Maç formatı
      gamesPerSet: 4,
      setsCount: 2,
      gameTiebreakPoints: 7,
      matchTiebreakPoints: 10,
      
      // Teklif kuralları
      offerResponseDays: 3,
      postMatchCooldownHoursLoser: 24,
      postMatchCooldownHoursWinner: 12,
      consecutiveWOLimit: 3,
      
      // Shield sistemi
      shieldEnabled: false,
      shieldDaysTotal: null,
      
      // Sıra bazlı teklif limitleri (zorunlu - settingsData'dan gelmeli)
      // offerLimitsByRank zorunlu bir alan olduğu için settingsData'dan gelmelidir
      ...settingsData,
    };

    const settings = this.leagueSettingsRepository.create(defaultData);
    return await this.leagueSettingsRepository.save(settings);
  }
}

