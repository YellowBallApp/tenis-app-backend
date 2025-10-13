import { AppDataSource } from '../config/data-source';
import { Tournament } from '../entities/tournament.entity';
import { TournamentMatch } from '../entities/tournamentMatch.entity';
import { User } from '../entities/user.entity';

export class TournamentService {
  private tournamentRepository;
  private tournamentMatchRepository;
  private userRepository;

  constructor() {
    this.tournamentRepository = AppDataSource.getRepository(Tournament);
    this.tournamentMatchRepository = AppDataSource.getRepository(TournamentMatch);
    this.userRepository = AppDataSource.getRepository(User);
  }

  // Tüm turnuvaları getir
  async getAllTournaments() {
    try {
      const tournaments = await this.tournamentRepository.find({
        order: { startDate: 'DESC' },
      });

      return tournaments;
    } catch (error) {
      throw new Error('Turnuvalar alınırken bir hata oluştu');
    }
  }

  // Turnuva detayını ve bracket'ı getir
  async getTournamentBracket(tournamentId: number) {
    try {
      const tournament = await this.tournamentRepository.findOne({
        where: { id: tournamentId },
        relations: ['matches', 'matches.player1', 'matches.player2', 'matches.winner'],
      });

      if (!tournament) {
        throw new Error('Turnuva bulunamadı');
      }

      // Maçları round'a göre grupla
      const bracketData = {
        tournament,
        rounds: this.groupMatchesByRound(tournament.matches),
      };

      return bracketData;
    } catch (error: any) {
      throw new Error(error.message || 'Turnuva detayı alınırken bir hata oluştu');
    }
  }

  private groupMatchesByRound(matches: TournamentMatch[]) {
    const rounds: { [key: number]: TournamentMatch[] } = {};
    
    matches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });

    // Her round'u matchNumber'a göre sırala
    Object.keys(rounds).forEach(roundKey => {
      rounds[parseInt(roundKey)].sort((a, b) => a.matchNumber - b.matchNumber);
    });

    return rounds;
  }

  // Yeni turnuva oluştur ve bracket'ı ayarla
  async createTournament(data: {
    name: string;
    size: number;
    startDate: Date;
    playerIds: string[];
  }) {
    try {
      if (![8, 16, 32].includes(data.size)) {
        throw new Error('Turnuva boyutu 8, 16 veya 32 olmalıdır');
      }

      if (data.playerIds.length !== data.size) {
        throw new Error(`${data.size} oyuncu seçilmelidir`);
      }

      const tournament = this.tournamentRepository.create({
        name: data.name,
        size: data.size,
        startDate: data.startDate,
        status: 'pending',
      });

      const savedTournament = await this.tournamentRepository.save(tournament);

      // Bracket oluştur
      await this.generateBracket(savedTournament, data.playerIds);

      return savedTournament;
    } catch (error: any) {
      throw new Error(error.message || 'Turnuva oluşturulurken bir hata oluştu');
    }
  }

  private async generateBracket(tournament: Tournament, playerIds: string[]) {
    const players = await this.userRepository.findByIds(playerIds);
    
    // İlk tur maçlarını oluştur
    const totalRounds = Math.log2(tournament.size);
    const firstRoundMatchCount = tournament.size / 2;

    for (let i = 0; i < firstRoundMatchCount; i++) {
      const match = this.tournamentMatchRepository.create({
        tournament,
        round: 1,
        matchNumber: i + 1,
        player1: players[i * 2],
        player2: players[i * 2 + 1],
        status: 'pending',
      });

      await this.tournamentMatchRepository.save(match);
    }

    // Diğer turların boş maçlarını oluştur
    for (let round = 2; round <= totalRounds; round++) {
      const matchCount = tournament.size / Math.pow(2, round);
      
      for (let i = 0; i < matchCount; i++) {
        const match = this.tournamentMatchRepository.create({
          tournament,
          round,
          matchNumber: i + 1,
          status: 'pending',
        });

        await this.tournamentMatchRepository.save(match);
      }
    }
  }

  // Maç sonucunu gir ve bracket'ı güncelle
  async reportMatchResult(matchId: number, data: {
    winnerId: string;
    score: string;
  }) {
    try {
      const match = await this.tournamentMatchRepository.findOne({
        where: { id: matchId },
        relations: ['tournament', 'player1', 'player2'],
      });

      if (!match) {
        throw new Error('Maç bulunamadı');
      }

      if (!match.player1 || !match.player2) {
        throw new Error('Bu maçın oyuncuları henüz belirlenmemiş');
      }

      const winner = await this.userRepository.findOne({ where: { id: data.winnerId } });

      if (!winner) {
        throw new Error('Kazanan oyuncu bulunamadı');
      }

      match.winner = winner;
      match.score = data.score;
      match.status = 'completed';

      await this.tournamentMatchRepository.save(match);

      // Bir sonraki tur maçına kazananı ekle
      await this.advanceWinner(match);

      return match;
    } catch (error: any) {
      throw new Error(error.message || 'Maç sonucu kaydedilirken bir hata oluştu');
    }
  }

  private async advanceWinner(match: TournamentMatch) {
    const nextRound = match.round + 1;
    const nextMatchNumber = Math.ceil(match.matchNumber / 2);

    const nextMatch = await this.tournamentMatchRepository.findOne({
      where: {
        tournament: { id: match.tournament.id },
        round: nextRound,
        matchNumber: nextMatchNumber,
      },
    });

    if (nextMatch) {
      // Çift numaralı maç ise player1, tek numaralı ise player2
      if (match.matchNumber % 2 === 1) {
        nextMatch.player1 = match.winner;
      } else {
        nextMatch.player2 = match.winner;
      }

      await this.tournamentMatchRepository.save(nextMatch);
    }
  }
}

