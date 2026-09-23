export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  joinedAt: string;
  lastLoginAt?: string;
  gamesPlayed?: number;
  gamesCreatedCount?: number;
  highScores?: Record<string, number>;
  savedProgress?: Record<string, any>;
  favoriteGameIds?: string[];
  createdGameIds?: string[];
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  isFlagged?: boolean;
  flagReason?: string;
  suspiciousScore?: number; // 0 - 100
  aiRiskCategory?: string;
  aiExplanation?: string;
  lastAiAuditAt?: string;
}

export type AuthMode = 'login' | 'signup';
