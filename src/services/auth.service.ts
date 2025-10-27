import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { AppError } from "../utils/error/app.error";
import dayjs from "dayjs";
import { v4 as uuidv4 } from 'uuid';
import userService from "./user.service";
import { refreshTokenRepo } from "../repositories/refreshToken.repository";

const authService = {
  
  register: async (
    name: string,
    email: string,
    password: string,
    surname?: string,
    phone?: string,
    gender?: string,
    age?: number
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    // Check if user already exists
    const existingUser = await userService.findByEmail(email).catch(() => null);
    if (existingUser) {
      throw new AppError("USER_ALREADY_EXISTS");
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create new user
    const newUser = await userService.create({
      name,
      email,
      password: hashedPassword,
      surname,
      phone,
      gender,
      age,
    });

    // Generate tokens
    const jwtSecret = process.env.JWT_SECRET!;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET!;
    const sessionId = uuidv4();

    const payload = {
      id: newUser.id,
      sessionId,
    };

    const accessToken = sign(payload, jwtSecret, { expiresIn: "1h" });
    const refreshToken = sign(payload, refreshSecret, { expiresIn: "1d" });

    // Save refresh token
    await refreshTokenRepo.save({
      token: refreshToken,
      userId: newUser.id,
      sessionId,
      ipAddress: 'unknown',
      userAgent: 'unknown',
      expiresAt: dayjs().add(1, "day").toDate(),
    });

    return { accessToken, refreshToken };
  },

  login: async (
  email: string,
  password: string,
  ipAddress: string,
  userAgent: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await userService.findByEmail(email);

  const isValidPassword = await compare(password, user.password);
  if (!isValidPassword) throw new AppError("INVALID_CREDENTIALS");

  const jwtSecret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET!;
  const sessionId = uuidv4();

  const payload = {
    id: user.id,
    sessionId,
  };

  const accessToken = sign(payload, jwtSecret, { expiresIn: "1h" });
  const refreshToken = sign(payload, refreshSecret, { expiresIn: "1d" });

  await refreshTokenRepo.delete({ userId: user.id });

  await refreshTokenRepo.save({
    token: refreshToken,
    userId: user.id,
    sessionId,
    ipAddress,
    userAgent,
    expiresAt: dayjs().add(1, "day").toDate(),
  });

  return { accessToken, refreshToken };
},

  refreshToken: async (
  token: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET!;
  const jwtSecret = process.env.JWT_SECRET!;
  const now = dayjs();

  const stored = await refreshTokenRepo.findOne({ where: { token } });
  if (!stored) {
    throw new AppError("INVALID_REFRESH_TOKEN");
  }

  if (now.isAfter(stored.expiresAt)) {
    await refreshTokenRepo.delete({ token });
    throw new AppError("INVALID_REFRESH_TOKEN");
  }

  let decoded: any;
  try {
    decoded = verify(token, refreshSecret);
  } catch (err) {
    throw new AppError("INVALID_REFRESH_TOKEN");
  }

  const { id } = decoded;

  const payload = {
    id,
    sessionId: stored.sessionId, 
  };

  const newAccessToken = sign(payload, jwtSecret, { expiresIn: "1h" });
  const newRefreshToken = sign(payload, refreshSecret, { expiresIn: "1d" });

  // Önce eski token'ı sil
  await refreshTokenRepo.delete({ token });

  // Sonra yeni token'ı kaydet (expiresAt'i güncelle)
  await refreshTokenRepo.save({
    token: newRefreshToken,
    userId: id,
    sessionId: stored.sessionId,
    ipAddress: stored.ipAddress,
    userAgent: stored.userAgent,
    expiresAt: dayjs().add(1, "day").toDate(), 
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
},

  logout: async (token: string): Promise<void> => {
    await refreshTokenRepo.delete({ token });
  },
};

export default authService;
