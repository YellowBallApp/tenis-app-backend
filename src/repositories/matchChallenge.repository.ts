import { AppDataSource } from '../config/data-source';
import { MatchChallenge, ChallengeStatus } from '../entities/matchChallenge.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { League } from '../entities/league.entity';

class MatchChallengeRepository {
  private repository: Repository<MatchChallenge>;

  constructor() {
    this.repository = AppDataSource.getRepository(MatchChallenge);
  }

  async findAll(): Promise<MatchChallenge[]> {
    return await this.repository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findById(id: number): Promise<MatchChallenge | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['challenger', 'challenged', 'league']
    });
  }

  async findByUserId(userId: string): Promise<MatchChallenge[]> {
    return await this.repository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.challenger', 'challenger')
      .leftJoinAndSelect('challenge.challenged', 'challenged')
      .leftJoinAndSelect('challenge.league', 'league')
      .where('challenger.id = :userId OR challenged.id = :userId', { userId })
      .orderBy('challenge.createdAt', 'DESC')
      .getMany();
  }

  async findPendingByUserId(userId: string): Promise<MatchChallenge[]> {
    return await this.repository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.challenger', 'challenger')
      .leftJoinAndSelect('challenge.challenged', 'challenged')
      .leftJoinAndSelect('challenge.league', 'league')
      .where('challenged.id = :userId', { userId })
      .andWhere('challenge.status = :status', { status: ChallengeStatus.PENDING })
      .andWhere('challenge.expiresAt > :now', { now: new Date() })
      .orderBy('challenge.createdAt', 'DESC')
      .getMany();
  }

  async findSentChallenges(userId: string): Promise<MatchChallenge[]> {
    return await this.repository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.challenger', 'challenger')
      .leftJoinAndSelect('challenge.challenged', 'challenged')
      .leftJoinAndSelect('challenge.league', 'league')
      .where('challenger.id = :userId', { userId })
      .orderBy('challenge.createdAt', 'DESC')
      .getMany();
  }

  async findPendingChallenge(
    challengerId: string,
    challengedId: string,
    leagueId: number
  ): Promise<MatchChallenge | null> {
    return await this.repository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.challenger', 'challenger')
      .leftJoinAndSelect('challenge.challenged', 'challenged')
      .leftJoinAndSelect('challenge.league', 'league')
      .where('challenger.id = :challengerId', { challengerId })
      .andWhere('challenged.id = :challengedId', { challengedId })
      .andWhere('league.id = :leagueId', { leagueId })
      .andWhere('challenge.status = :status', { status: ChallengeStatus.PENDING })
      .getOne();
  }

  async create(data: {
    challengerId: string;
    challengedId: string;
    leagueId: number;
    message?: string;
    proposedDate?: Date;
    expiresAt: Date;
    status: ChallengeStatus;
  }): Promise<MatchChallenge> {
    const challenger = new User();
    challenger.id = data.challengerId;

    const challenged = new User();
    challenged.id = data.challengedId;

    const league = new League();
    league.id = data.leagueId;

    const challenge = this.repository.create({
      challenger,
      challenged,
      league,
      message: data.message,
      proposedDate: data.proposedDate,
      expiresAt: data.expiresAt,
      status: data.status
    });

    return await this.repository.save(challenge);
  }

  async updateStatus(id: number, status: ChallengeStatus): Promise<MatchChallenge> {
    const challenge = await this.findById(id);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    challenge.status = status;
    if (status !== ChallengeStatus.PENDING) {
      challenge.respondedAt = new Date();
    }

    return await this.repository.save(challenge);
  }

  async acceptChallenge(id: number): Promise<MatchChallenge> {
    return await this.updateStatus(id, ChallengeStatus.ACCEPTED);
  }

  async rejectChallenge(id: number): Promise<MatchChallenge> {
    return await this.updateStatus(id, ChallengeStatus.REJECTED);
  }

  async cancelChallenge(id: number): Promise<MatchChallenge> {
    return await this.updateStatus(id, ChallengeStatus.CANCELLED);
  }

  async expireChallenge(id: number): Promise<MatchChallenge> {
    return await this.updateStatus(id, ChallengeStatus.EXPIRED);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findExpiredChallenges(): Promise<MatchChallenge[]> {
    return await this.repository
      .createQueryBuilder('challenge')
      .where('challenge.status = :status', { status: ChallengeStatus.PENDING })
      .andWhere('challenge.expiresAt < :now', { now: new Date() })
      .getMany();
  }

  // Kullanıcının belirli bir ligde aktif (pending) challenge'ı var mı kontrol et
  // Hem gönderdiği hem de aldığı pending challenge'ları kontrol eder
  async hasActiveChallengeInLeague(userId: string, leagueId: number): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.challenger', 'challenger')
      .leftJoinAndSelect('challenge.challenged', 'challenged')
      .leftJoinAndSelect('challenge.league', 'league')
      .where('(challenger.id = :userId OR challenged.id = :userId)', { userId })
      .andWhere('league.id = :leagueId', { leagueId })
      .andWhere('challenge.status = :status', { status: ChallengeStatus.PENDING })
      .andWhere('challenge.expiresAt > :now', { now: new Date() })
      .getCount();
    
    return count > 0;
  }

  // Kullanıcının belirli bir ligde reddettiği challenge sayısını getir
  async countRejectedChallengesByUserInLeague(userId: string, leagueId: number): Promise<number> {
    return await this.repository
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.challenged', 'challenged')
      .leftJoinAndSelect('challenge.league', 'league')
      .where('challenged.id = :userId', { userId })
      .andWhere('league.id = :leagueId', { leagueId })
      .andWhere('challenge.status = :status', { status: ChallengeStatus.REJECTED })
      .getCount();
  }

  // Kullanıcının belirli bir ligdeki reddedilmiş challenge'larını sil
  async deleteRejectedChallengesByUserInLeague(userId: string, leagueId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .from(MatchChallenge)
      .where('challengedId = :userId', { userId })
      .andWhere('leagueId = :leagueId', { leagueId })
      .andWhere('status = :status', { status: ChallengeStatus.REJECTED })
      .execute();
  }
}

export default new MatchChallengeRepository();

