import commentRepository from '../repositories/comment.repository';
import matchHistoryRepository from '../repositories/matchHistory.repository';
import { CommentTextArea } from '../entities/commentTextArea';
import { AppError } from '../utils/error/app.error';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { CommentType } from '../enum/commentEnum';

export class CommentService {
  private userRepository;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  // Maça ait tüm yorumları getir
  async getMatchComments(matchHistoryId: number): Promise<CommentTextArea[]> {
    try {
      // Match'in varlığını kontrol et
      const match = await matchHistoryRepository.findById(matchHistoryId);
      if (!match) {
        throw new AppError('MATCH_HISTORY_NOT_FOUND');
      }

      return await commentRepository.findByMatchHistoryId(matchHistoryId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Kullanıcının bir maça dahil olup olmadığını kontrol et
  async isUserInMatch(matchHistoryId: number, userId: string): Promise<boolean> {
    try {
      const match = await matchHistoryRepository.findById(matchHistoryId);
      if (!match) {
        return false;
      }

      const isWinner = match.winners.some(winner => winner.id === userId);
      const isLoser = match.losers.some(loser => loser.id === userId);

      return isWinner || isLoser;
    } catch (error) {
      return false;
    }
  }

  // Yorum oluştur
  async createComment(data: {
    matchHistoryId: number;
    userId: string;
    comment: string;
    commentType?: CommentType;
  }): Promise<CommentTextArea> {
    try {
      // Kullanıcıyı bul
      const user = await this.userRepository.findOne({ where: { id: data.userId } });
      if (!user) {
        throw new AppError('USER_NOT_FOUND');
      }

      // Match'i bul
      const match = await matchHistoryRepository.findById(data.matchHistoryId);
      if (!match) {
        throw new AppError('MATCH_HISTORY_NOT_FOUND');
      }

      // Kullanıcının maça dahil olup olmadığını kontrol et
      const isInMatch = await this.isUserInMatch(data.matchHistoryId, data.userId);
      if (!isInMatch) {
        throw new AppError('USER_NOT_IN_MATCH');
      }

      // Yorum oluştur
      const comment = await commentRepository.create({
        comment: data.comment,
        CommentType: data.commentType || CommentType.MATCH_COMMENT,
        user,
        matchHistory: match,
      });

      return comment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Yorum güncelle
  async updateComment(
    commentId: number,
    userId: string,
    commentText: string
  ): Promise<CommentTextArea> {
    try {
      const comment = await commentRepository.findById(commentId);
      if (!comment) {
        throw new AppError('COMMENT_NOT_FOUND');
      }

      // Sadece yorumun sahibi güncelleyebilir
      if (comment.user.id !== userId) {
        throw new AppError('UNAUTHORIZED_COMMENT_UPDATE');
      }

      return await commentRepository.update(commentId, {
        comment: commentText,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Yorum sil
  async deleteComment(commentId: number, userId: string): Promise<void> {
    try {
      const comment = await commentRepository.findById(commentId);
      if (!comment) {
        throw new AppError('COMMENT_NOT_FOUND');
      }

      // Sadece yorumun sahibi silebilir
      if (comment.user.id !== userId) {
        throw new AppError('UNAUTHORIZED_COMMENT_DELETE');
      }

      await commentRepository.delete(commentId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Bir maçın yorum sayısını getir
  async getCommentCount(matchHistoryId: number): Promise<number> {
    try {
      return await commentRepository.countByMatchHistoryId(matchHistoryId);
    } catch (error) {
      throw new AppError('UNKNOWN_ERROR');
    }
  }

  // Belirli bir yorumu ID ile getir
  async getCommentById(commentId: number): Promise<CommentTextArea> {
    try {
      const comment = await commentRepository.findById(commentId);
      if (!comment) {
        throw new AppError('COMMENT_NOT_FOUND');
      }
      return comment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('UNKNOWN_ERROR');
    }
  }
}

export default new CommentService();

