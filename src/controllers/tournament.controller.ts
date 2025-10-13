import { Request, Response } from 'express';
import { TournamentService } from '../services/tournament.service';

export class TournamentController {
  private tournamentService: TournamentService;

  constructor() {
    this.tournamentService = new TournamentService();
  }

  // Tüm turnuvaları getir
  getAllTournaments = async (req: Request, res: Response) => {
    try {
      const tournaments = await this.tournamentService.getAllTournaments();
      
      return res.status(200).json({
        success: true,
        data: tournaments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Turnuvalar alınırken bir hata oluştu',
      });
    }
  };

  // Turnuva bracket'ını getir
  getTournamentBracket = async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      
      const bracket = await this.tournamentService.getTournamentBracket(tournamentId);
      
      return res.status(200).json({
        success: true,
        data: bracket,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Turnuva detayı alınırken bir hata oluştu',
      });
    }
  };

  // Yeni turnuva oluştur (Admin)
  createTournament = async (req: Request, res: Response) => {
    try {
      const { name, size, startDate, playerIds } = req.body;

      const tournament = await this.tournamentService.createTournament({
        name,
        size,
        startDate: new Date(startDate),
        playerIds,
      });

      return res.status(201).json({
        success: true,
        message: 'Turnuva başarıyla oluşturuldu',
        data: tournament,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Turnuva oluşturulurken bir hata oluştu',
      });
    }
  };

  // Maç sonucunu kaydet
  reportMatchResult = async (req: Request, res: Response) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const { winnerId, score } = req.body;

      const match = await this.tournamentService.reportMatchResult(matchId, {
        winnerId,
        score,
      });

      return res.status(200).json({
        success: true,
        message: 'Maç sonucu kaydedildi',
        data: match,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Maç sonucu kaydedilirken bir hata oluştu',
      });
    }
  };
}

