import matchHistoryRepository from '../repositories/matchHistory.repository';
import { MatchHistory } from '../entities/matchHistory.entity';
import { AppError } from '../utils/error/app.error';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { LeagueStandings } from '../entities/leagueStandings.entity';
import { GroundType } from '../enum/groundType.enum';
import { EloService } from './elo.service';

export class MatchHistoryService {
  private userRepository;
  private leagueStandingsRepository;
  private eloService: EloService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.leagueStandingsRepository = AppDataSource.getRepository(LeagueStandings);
    this.eloService = new EloService();
  }

  async findAll(): Promise<MatchHistory[]> {
    try {
      return await matchHistoryRepository.findAll();
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findById(id: number): Promise<MatchHistory> {
    try {
      const matchHistory = await matchHistoryRepository.findById(id);
      if (!matchHistory) {
        throw new AppError('MATCH_HISTORY_NOT_FOUND');
      }
      return matchHistory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findByUserId(userId: string): Promise<MatchHistory[]> {
    try {
      return await matchHistoryRepository.findByUserId(userId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async findByLeagueId(leagueId: number): Promise<MatchHistory[]> {
    try {
      return await matchHistoryRepository.findByLeagueId(leagueId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async create(data: {
    winnerIds: string[];
    loserIds: string[];
    score: string;
    matchDate?: Date;
    leagueStandingId?: number;
    indoorCourt?: boolean;
    courtGround?: GroundType;
    affectsEloRating?: boolean;
    isTournament?: boolean;
  }): Promise<MatchHistory> {
    try {
      // Kullanıcıları bul
      const winners = await this.userRepository.findByIds(data.winnerIds);
      const losers = await this.userRepository.findByIds(data.loserIds);

      if (winners.length !== data.winnerIds.length) {
        throw new AppError('USER_NOT_FOUND');
      }
      if (losers.length !== data.loserIds.length) {
        throw new AppError('USER_NOT_FOUND');
      }

      // LeagueStanding bul (varsa)
      let leagueStanding = undefined;
      if (data.leagueStandingId) {
        const foundStanding = await this.leagueStandingsRepository.findOne({
          where: { id: data.leagueStandingId },
        });
        leagueStanding = foundStanding || undefined;
      }

      // Maç geçmişini oluştur
      const matchHistory = await matchHistoryRepository.create({
        winners,
        losers,
        score: data.score,
        matchDate: data.matchDate || new Date(),
        leagueStanding,
        indoorCourt: data.indoorCourt !== undefined ? data.indoorCourt : false,
        courtGround: data.courtGround || GroundType.HARD,
      });

      // ELO hesaplama ve güncelleme (sadece 1v1 için şimdilik)
      const affectsElo = data.affectsEloRating !== false; // Varsayılan true
      
      if (affectsElo && data.winnerIds.length === 1 && data.loserIds.length === 1) {
        try {
          // Set farkını hesapla (score'dan parse et)
          const setDifference = this.calculateSetDifference(data.score);

          // ELO değişimlerini hesapla
          const eloChanges = await this.eloService.calculate1v1Match(
            data.winnerIds[0],
            data.loserIds[0],
            {
              matchId: matchHistory.id,
              isTournament: data.isTournament || false,
              setDifference,
              affectsRating: true
            }
          );

          // ELO değişimlerini uygula
          if (eloChanges.length > 0) {
            await this.eloService.applyEloChanges(
              eloChanges,
              matchHistory.id,
              'match_win'
            );

            // MatchHistory'ye ELO değişimlerini kaydet
            matchHistory.eloChanges = eloChanges.map(c => ({
              userId: c.userId,
              previousRating: c.previousRating,
              newRating: c.newRating,
              change: c.change
            }));
            matchHistory.affectsEloRating = true;

            await matchHistoryRepository.update(matchHistory.id, {
              eloChanges: matchHistory.eloChanges,
              affectsEloRating: true
            });
          }
        } catch (eloError) {
          console.error('ELO hesaplama hatası:', eloError);
          // ELO hatası maç kaydını engellememeli
        }
      } else {
        matchHistory.affectsEloRating = false;
      }

      return matchHistory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  /**
   * Score string'inden set farkını hesaplar
   * Örnek: "6-4, 6-3" -> 2 (kazanan 2 set aldı)
   * Örnek: "6-4, 3-6, 6-2" -> 1 (3 set, kazanan 2 aldı)
   */
  private calculateSetDifference(score: string): number {
    try {
      const sets = score.split(',').map(s => s.trim());
      let winnerSets = 0;
      let loserSets = 0;

      for (const set of sets) {
        const games = set.split('-').map(g => parseInt(g.trim()));
        if (games.length === 2 && !isNaN(games[0]) && !isNaN(games[1])) {
          if (games[0] > games[1]) {
            winnerSets++;
          } else {
            loserSets++;
          }
        }
      }

      return winnerSets - loserSets;
    } catch {
      return 0; // Parse edilemezse 0 döndür
    }
  }

  async update(id: number, data: Partial<MatchHistory>): Promise<MatchHistory> {
    try {
      const matchHistory = await matchHistoryRepository.findById(id);
      if (!matchHistory) {
        throw new AppError('MATCH_HISTORY_NOT_FOUND');
      }
      return await matchHistoryRepository.update(id, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const matchHistory = await matchHistoryRepository.findById(id);
      if (!matchHistory) {
        throw new AppError('MATCH_HISTORY_NOT_FOUND');
      }
      await matchHistoryRepository.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Kullanıcının maç istatistiklerini getir
  async getUserMatchStats(userId: string) {
    try {
      const matches = await matchHistoryRepository.findByUserId(userId);

      const wins = matches.filter((match) =>
        match.winners.some((winner) => winner.id === userId)
      ).length;

      const losses = matches.filter((match) =>
        match.losers.some((loser) => loser.id === userId)
      ).length;

      const totalMatches = wins + losses;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      return {
        totalMatches,
        wins,
        losses,
        winRate,
        recentMatches: matches.slice(0, 10), // Son 10 maç
      };
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }
}

export default new MatchHistoryService();

