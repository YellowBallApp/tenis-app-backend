import { NotificationType } from '../enums/notificationType.enum';
import { ChallengeStatus } from '../enums/challengeStatus.enum';

export { NotificationType, ChallengeStatus };

export interface User {
  id: string;
  name: string;
  email: string;
  surname?: string;
  title?: string;
  phone?: string;
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
  userType?: 'restricted' | 'standard' | 'admin' | 'coach';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  birthDate?: string;
  phone?: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  errorKey: string;
  errorCode: number;
  message: string;
}

export interface LeagueSettings {
  id: number;
  description: string;
  leagueDescription?: string | null;
  rewards?: string | null;
  leagueStartDate: string;
  leagueEndDate: string;
  registrationFee: number;
  minMatchCountForElimination: number;
  minAge: number | null;
  maxAge: number | null;
  gamesPerSet: number;
  setsCount: number;
  gameTiebreakPoints: number;
  matchTiebreakPoints: number;
  offerResponseDays: number;
  matchCompletionDays: number;
  postMatchCooldownHoursLoser: number;
  postMatchCooldownHoursWinner: number;
  consecutiveWOLimit: number;
  offerLimitsByRank: { range: string; limit: number }[];
}

export interface League {
  id: number;
  name: string;
  code: string;
  description?: string;
  settings?: LeagueSettings;
}

export interface MatchChallenge {
  id: number;
  challenger: User;
  challenged: User;
  league: League;
  status: ChallengeStatus;
  message?: string;
  proposedDate?: string;
  respondedAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeagueStandings {
  id: number;
  description?: string;
  leagueRanking: number;
  user: User;
  league: League;
}

export interface Notification {
  id: number;
  type: NotificationType;
  message?: string;
  isRead: boolean;
  createdAt: string;
  recipient: User;
  relatedEntityId?: number;
  relatedEntityType?: string;
}
