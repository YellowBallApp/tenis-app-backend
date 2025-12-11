import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { League } from '../entities/league.entity';
import { AppError } from '../utils/error/app.error';

export class ShieldService {
  private userRepository = AppDataSource.getRepository(User);
  private leagueRepository = AppDataSource.getRepository(League);

  /**
   * Kullanıcının shield'ini aktif eder
   * @param userId Kullanıcı ID
   * @param leagueId Lig ID
   * @param days Kullanılacak gün sayısı
   */
  async activateShield(userId: string, leagueId: number, days: number): Promise<User> {
    // Kullanıcıyı bul
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }

    // Ligi bul ve ayarlarını kontrol et
    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['settings']
    });

    if (!league || !league.settings) {
      throw new AppError('LEAGUE_NOT_FOUND');
    }

    const settings = league.settings;

    // Koruma gün hakkı belirlenmiş mi? (Boş bırakılırsa koruma hakkı yok)
    if (!settings.shieldDaysTotal || settings.shieldDaysTotal <= 0) {
      throw new AppError('SHIELD_NOT_ENABLED');
    }

    // League shields objesini başlat (yoksa)
    if (!user.leagueShields) {
      user.leagueShields = {};
    }

    const leagueShield = user.leagueShields[leagueId] || {
      shieldActive: false,
      shieldExpiresAt: null,
      shieldDaysRemaining: 0
    };

    // Zaten aktif bir shield var mı?
    if (leagueShield.shieldActive && leagueShield.shieldExpiresAt) {
      const now = new Date();
      const expiresAt = typeof leagueShield.shieldExpiresAt === 'string'
        ? new Date(leagueShield.shieldExpiresAt)
        : new Date(leagueShield.shieldExpiresAt);
      if (now < expiresAt) {
        throw new AppError('SHIELD_ALREADY_ACTIVE');
      } else {
        // Süresi dolmuş, pasif yap
        leagueShield.shieldActive = false;
      }
    }

    // Kalan shield günü yeterli mi?
    if (leagueShield.shieldDaysRemaining < days) {
      throw new AppError('SHIELD_DAYS_INSUFFICIENT');
    }

    // Shield'i aktif et
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + days);

    leagueShield.shieldActive = true;
    leagueShield.shieldExpiresAt = expiresAt.toISOString() as any; // JSON field için ISO string
    leagueShield.shieldDaysRemaining = leagueShield.shieldDaysRemaining - days;

    user.leagueShields[leagueId] = leagueShield;
    await this.userRepository.save(user);

    return user;
  }

  /**
   * Kullanıcının shield durumunu getirir
   */
  async getShieldStatus(userId: string, leagueId: number): Promise<{
    shieldActive: boolean;
    shieldDaysRemaining: number;
    shieldExpiresAt: string | null; // ISO string
    shieldDaysTotal: number | null;
    shieldEnabled: boolean;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }

    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['settings']
    });

    if (!league || !league.settings) {
      throw new AppError('LEAGUE_NOT_FOUND');
    }

    const settings = league.settings;

    // League shields objesini başlat (yoksa)
    if (!user.leagueShields) {
      user.leagueShields = {};
    }

    const leagueShield = user.leagueShields[leagueId] || {
      shieldActive: false,
      shieldExpiresAt: null,
      shieldDaysRemaining: 0
    };

    // Süresi dolmuş shield'i pasif yap
    if (leagueShield.shieldActive && leagueShield.shieldExpiresAt) {
      const now = new Date();
      const expiresAt = typeof leagueShield.shieldExpiresAt === 'string' 
        ? new Date(leagueShield.shieldExpiresAt)
        : new Date(leagueShield.shieldExpiresAt);
      if (now >= expiresAt) {
        leagueShield.shieldActive = false;
        user.leagueShields[leagueId] = leagueShield;
        await this.userRepository.save(user);
      }
    }

    return {
      shieldActive: leagueShield.shieldActive || false,
      shieldDaysRemaining: leagueShield.shieldDaysRemaining,
      shieldExpiresAt: leagueShield.shieldExpiresAt, // ISO string olarak döndür
      shieldDaysTotal: settings.shieldDaysTotal,
      shieldEnabled: settings.shieldDaysTotal ? (settings.shieldDaysTotal > 0) : false
    };
  }

  /**
   * Kullanıcıya lig başlangıcında shield günlerini verir
   * Bu fonksiyon lig başladığında veya kullanıcı lige katıldığında çağrılmalı
   */
  async initializeShieldDays(userId: string, leagueId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }

    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['settings']
    });

    if (!league || !league.settings) {
      return; // Lig ayarları yoksa işlem yapma
    }

    const settings = league.settings;

    // Koruma gün hakkı belirlenmemişse işlem yapma (Boş bırakılırsa koruma hakkı yok)
    if (!settings.shieldDaysTotal || settings.shieldDaysTotal <= 0) {
      return;
    }

    // League shields objesini başlat (yoksa)
    if (!user.leagueShields) {
      user.leagueShields = {};
    }

    // Bu lig için shield bilgisi yoksa, her zaman en üst limitten başla (admin panelinden belirlenen değer)
    // Kullanıcı lige katıldığında her zaman en üst limitten başlamalı
    const leagueShield = user.leagueShields[leagueId];
    if (!leagueShield) {
      // İlk kez lige katılıyorsa, en üst limitten başla
      user.leagueShields[leagueId] = {
        shieldActive: false,
        shieldExpiresAt: null,
        shieldDaysRemaining: settings.shieldDaysTotal
      };
      await this.userRepository.save(user);
    } else {
      // Eğer shield bilgisi varsa ama kalan gün toplam günden az ise, toplam güne eşitle
      // (Kullanıcı lige katıldığında her zaman en üst limitten başlamalı)
      // NOT: Bu sadece initializeShieldDays çağrıldığında çalışır (lig başvurusu onaylandığında)
      if (leagueShield.shieldDaysRemaining < settings.shieldDaysTotal) {
        // Aktif koruma varsa ve süresi dolmuşsa pasif yap
        if (leagueShield.shieldActive && leagueShield.shieldExpiresAt) {
          const now = new Date();
          const expiresAt = typeof leagueShield.shieldExpiresAt === 'string'
            ? new Date(leagueShield.shieldExpiresAt)
            : new Date(leagueShield.shieldExpiresAt);
          if (now >= expiresAt) {
            leagueShield.shieldActive = false;
            leagueShield.shieldExpiresAt = null;
          }
        }
        // Kalan günü toplam güne eşitle (en üst limitten başla)
        leagueShield.shieldDaysRemaining = settings.shieldDaysTotal;
        user.leagueShields[leagueId] = leagueShield;
        await this.userRepository.save(user);
      }
    }
  }
}

export default new ShieldService();

