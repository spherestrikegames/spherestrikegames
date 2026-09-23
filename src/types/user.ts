export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
  gamesPlayed?: number;
  gamesCreatedCount?: number;
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
