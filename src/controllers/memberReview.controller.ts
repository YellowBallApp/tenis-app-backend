import { Request, Response } from "express";
import { AppError } from "../utils/error/app.error";
import memberReviewService from "../services/memberReview.service";

const memberReviewController = {
  create: async (req: Request, res: Response) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        throw new AppError("UNAUTHORIZED");
      }
      
      const userId = currentUser.id;
      const { memberId, rating, comment } = req.body;

      if (!memberId || !rating || !comment) {
        throw new AppError("VALIDATION_ERROR");
      }

      const review = await memberReviewService.create({
        memberId,
        userId,
        rating: parseInt(rating),
        comment
      });

      return res.status(201).json({
        data: review,
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  getByMemberId: async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const onlyApproved = req.query.onlyApproved !== 'false'; // Default true
      const reviews = await memberReviewService.getByMemberId(memberId, onlyApproved);

      return res.status(200).json({
        data: reviews,
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const onlyApproved = req.query.onlyApproved === 'true' 
        ? true 
        : req.query.onlyApproved === 'false' 
        ? false 
        : undefined;
      
      const reviews = await memberReviewService.getAll(onlyApproved);

      return res.status(200).json({
        data: reviews,
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  getPending: async (req: Request, res: Response) => {
    try {
      const reviews = await memberReviewService.getPendingReviews();

      return res.status(200).json({
        data: reviews,
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  getPendingCount: async (req: Request, res: Response) => {
    try {
      const count = await memberReviewService.getPendingCount();

      return res.status(200).json({
        data: { count },
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  approve: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const review = await memberReviewService.approveReview(parseInt(id));

      return res.status(200).json({
        data: review,
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  getByUserId: async (req: Request, res: Response) => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        throw new AppError("UNAUTHORIZED");
      }
      
      const reviews = await memberReviewService.getByUserId(currentUser.id);

      return res.status(200).json({
        data: reviews,
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const currentUser = req.currentUser;
      
      if (!currentUser) {
        throw new AppError("UNAUTHORIZED");
      }

      // Admin ise direkt güncelleyebilir, değilse sadece kendi yorumunu güncelleyebilir
      if (currentUser.userType !== 'admin') {
        // Review'ın kullanıcıya ait olduğunu kontrol et
        const review = await memberReviewService.getByUserId(currentUser.id);
        const userReview = review.find(r => r.id === parseInt(id));
        
        if (!userReview) {
          throw new AppError("UNAUTHORIZED");
        }
      }

      const updateData: any = {};
      if (rating !== undefined) updateData.rating = parseInt(rating);
      if (comment !== undefined) updateData.comment = comment;

      const updatedReview = await memberReviewService.update(parseInt(id), updateData);

      return res.status(200).json({
        data: updatedReview,
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const currentUser = req.currentUser;
      
      if (!currentUser) {
        throw new AppError("UNAUTHORIZED");
      }

      // Admin ise direkt silebilir, değilse sadece kendi yorumunu silebilir
      if (currentUser.userType !== 'admin') {
        // Review'ın kullanıcıya ait olduğunu kontrol et
        const review = await memberReviewService.getByUserId(currentUser.id);
        const userReview = review.find(r => r.id === parseInt(id));
        
        if (!userReview) {
          throw new AppError("UNAUTHORIZED");
        }
      }

      await memberReviewService.delete(parseInt(id));

      return res.status(200).json({
        message: "Review deleted successfully",
      });
    } catch (err) {
      const error = err instanceof AppError
        ? err
        : new AppError("UNKNOWN_ERROR");

      console.error(err);
      return res.status(error.status).json({
        errorKey: error.errorKey,
        errorCode: error.errorCode,
        message: error.message,
      });
    }
  },
};

export default memberReviewController;

