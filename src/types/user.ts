export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
  gamesPlayed?: number;
  gamesCreatedCount?: number;
}

export type AuthMode = 'login' | 'signup';
