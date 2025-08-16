import { RefreshToken } from "../entities/refreshToken.entity";
import { AppDataSource } from "../config/data-source";

export const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
