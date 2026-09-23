export interface GameProgress {
  gameId: string;
  gameTitle: string;
  highScore: number;
  levelReached: number;
  totalPlayTimeSeconds: number;
  sessionsCount: number;
  lastPlayedAt: string;
  checkpoints?: string;
  savedData?: string;
}

export interface UserArcadeStats {
  totalPlayTimeSeconds: number;
  totalGamesPlayed: number;
  highestScoreOverall: number;
  achievements: ArcadeAchievement[];
}

export interface ArcadeAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}
