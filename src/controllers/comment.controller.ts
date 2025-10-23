import { Request, Response } from 'express';
import commentService from '../services/comment.service';
import { AppError } from '../utils/error/app.error';

export const commentController = {
  // Maça ait tüm yorumları getir
  getMatchComments: async (req: Request, res: Response) => {
    try {
      const { matchHistoryId } = req.params;
      const comments = await commentService.getMatchComments(Number(matchHistoryId));
      return res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Maçın yorum sayısını getir
  getCommentCount: async (req: Request, res: Response) => {
    try {
      const { matchHistoryId } = req.params;
      const count = await commentService.getCommentCount(Number(matchHistoryId));
      return res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Yeni yorum oluştur
  createComment: async (req: Request, res: Response) => {
    try {
      const { matchHistoryId, comment, commentType } = req.body;
      const userId = (req as any).user.id; // authMiddleware'den gelen kullanıcı ID'si

      if (!matchHistoryId || !comment) {
        throw new AppError('VALIDATION_ERROR');
      }

      const newComment = await commentService.createComment({
        matchHistoryId: Number(matchHistoryId),
        userId,
        comment,
        commentType,
      });

      return res.status(201).json({
        success: true,
        data: newComment,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Yorum güncelle
  updateComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = (req as any).user.id;

      if (!comment) {
        throw new AppError('VALIDATION_ERROR');
      }

      const updatedComment = await commentService.updateComment(
        Number(id),
        userId,
        comment
      );

      return res.status(200).json({
        success: true,
        data: updatedComment,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Yorum sil
  deleteComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await commentService.deleteComment(Number(id), userId);

      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  // Belirli bir yorumu getir
  getCommentById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const comment = await commentService.getCommentById(Number(id));
      return res.status(200).json({
        success: true,
        data: comment,
      });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('UNKNOWN_ERROR');
      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },
};

