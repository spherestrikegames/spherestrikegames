export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  avatar?: string;
  isAdmin?: boolean;
  role?: 'admin' | 'user';
  joinedAt: string;
  createdAt?: string;
  lastLoginAt?: string;
  gamesPlayed?: number;
  gamesCreatedCount?: number;
  highScores?: Record<string, number>;
  savedProgress?: Record<string, any>;
  favoriteGameIds?: string[];
  createdGameIds?: string[];
  stats?: {
    level?: number;
    highScore?: number;
    gamesPlayed?: number;
    hoursPlayed?: number;
  };
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  isFlagged?: boolean;
  flagReason?: string;
  suspiciousScore?: number; // 0 - 100
  aiRiskCategory?: string;
  aiExplanation?: string;
  lastAiAuditAt?: string;
  lastPlayedGameId?: string;
  lastPlayedGameTitle?: string;
  lastActiveView?: string;
}

export type AuthMode = 'login' | 'signup';
