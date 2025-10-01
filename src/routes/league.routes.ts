import { Router } from 'express';
import { LeagueController } from '../controllers/league.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const leagueController = new LeagueController();

// Tüm rotalar authentication gerektiriyor
router.use(authMiddleware);

// Lig ayarları
router.get('/settings', leagueController.getLeagueSettings);
router.put('/settings', leagueController.updateLeagueSettings);

// Lig sıralaması
router.get('/rankings', leagueController.getLeagueRankings);

// Kullanıcı lig bilgileri
router.get('/user/:userId', leagueController.getUserLeagueInfo);

// Teklif yapılabilecek oyuncular
router.get('/available-opponents/:userId', leagueController.getAvailableOpponents);

// Maç teklifi gönder
router.post('/challenge', leagueController.sendMatchChallenge);

// Maç sonucu kaydet
router.post('/match-result', leagueController.recordMatchResult);

export default router;

