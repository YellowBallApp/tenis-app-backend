import userController from "../controllers/user.controller";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/profile", authMiddleware, userController.getProfile);

export default router;
