export interface User {
  id: string;
  name: string;
  email: string;
  surname?: string;
  title?: string;
  phone?: string;
  gender?: string | null;
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
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  errorKey: string;
  errorCode: number;
  message: string;
}

export interface League {
  id: number;
  code: string;
  description?: string;
}

export type ChallengeStatus = 'challengePending' | 'challengeAccepted';

export interface LeagueStandings {
  id: number;
  description?: string;
  leagueRanking: number;
  challengeStatus?: ChallengeStatus;
  challengePendingDate?: string;
  challengeAcceptedDate?: string;
  user: User;
  challengedUser?: User;
  league: League;
}

export type NotificationType = 'pendingMatchRequest' | 'systemNotification';

export interface Notification {
  id: number;
  type: NotificationType;
  message?: string;
  isRead: boolean;
  notificationReceivedDate: string;
  recipient: User;
  challenger?: User;
  league?: League;
}
