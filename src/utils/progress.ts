import { GameProgress, UserArcadeStats, ArcadeAchievement } from '../types/progress';
import { User } from '../types/user';

const PROGRESS_STORAGE_PREFIX = 'spherestrike_progress_';
const GUEST_TEMP_STORAGE = 'spherestrike_guest_temp_progress';

const DEFAULT_ACHIEVEMENTS: ArcadeAchievement[] = [
  {
    id: 'first-save',
    title: 'Cloud Cadet',
    description: 'Saved your first game progress to your gamer account',
    icon: 'Cloud'
  },
  {
    id: 'score-100',
    title: 'Triple Digit Club',
    description: 'Recorded a score of 100 or higher in any arcade game',
    icon: 'Trophy'
  },
  {
    id: 'score-1000',
    title: 'High Roller',
    description: 'Recorded a score of 1,000 or higher in any arcade game',
    icon: 'Crown'
  },
  {
    id: 'multi-game',
    title: 'Arcade Explorer',
    description: 'Played and saved progress across 3 or more different games',
    icon: 'Compass'
  },
  {
    id: 'veteran-time',
    title: 'Endurance Gamer',
    description: 'Clocked over 10 minutes of active arcade playtime',
    icon: 'Flame'
  }
];

function getUserProgressKey(userId: string): string {
  return `${PROGRESS_STORAGE_PREFIX}${userId}`;
}

export function getAllUserProgress(userId: string): GameProgress[] {
  try {
    const raw = localStorage.getItem(getUserProgressKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load user progress:', err);
    return [];
  }
}

export function getUserGameProgress(userId: string, gameId: string): GameProgress | null {
  const all = getAllUserProgress(userId);
  return all.find(p => p.gameId === gameId) || null;
}

export function saveUserGameProgress(
  userId: string,
  gameId: string,
  gameTitle: string,
  updates: Partial<GameProgress>
): GameProgress {
  const all = getAllUserProgress(userId);
  const existingIdx = all.findIndex(p => p.gameId === gameId);
  const now = new Date().toISOString();

  let target: GameProgress;

  if (existingIdx >= 0) {
    target = {
      ...all[existingIdx],
      ...updates,
      gameTitle: updates.gameTitle || gameTitle || all[existingIdx].gameTitle,
      lastPlayedAt: now
    };
    all[existingIdx] = target;
  } else {
    target = {
      gameId,
      gameTitle,
      highScore: updates.highScore || 0,
      levelReached: updates.levelReached || 1,
      totalPlayTimeSeconds: updates.totalPlayTimeSeconds || 0,
      sessionsCount: updates.sessionsCount || 1,
      lastPlayedAt: now,
      checkpoints: updates.checkpoints,
      savedData: updates.savedData
    };
    all.unshift(target);
  }

  try {
    localStorage.setItem(getUserProgressKey(userId), JSON.stringify(all));

    // Also sync to server account cloud database
    fetch('/api/auth/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        lastPlayedGameId: gameId,
        lastPlayedGameTitle: target.gameTitle,
        highScores: updates.highScore !== undefined ? { [gameId]: updates.highScore } : undefined,
        savedProgress: {
          [gameId]: {
            levelReached: target.levelReached,
            highScore: target.highScore,
            totalPlayTimeSeconds: target.totalPlayTimeSeconds,
            checkpoints: target.checkpoints,
            savedData: target.savedData,
            lastPlayedAt: now
          }
        }
      })
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to save progress to localStorage:', err);
  }

  return target;
}

export function recordGameSessionPlay(
  userId: string,
  gameId: string,
  gameTitle: string,
  additionalSeconds: number
): GameProgress {
  const existing = getUserGameProgress(userId, gameId);
  const currentSeconds = existing?.totalPlayTimeSeconds || 0;
  const currentSessions = existing?.sessionsCount || 0;

  return saveUserGameProgress(userId, gameId, gameTitle, {
    totalPlayTimeSeconds: currentSeconds + additionalSeconds,
    sessionsCount: currentSessions + 1
  });
}

export function recordHighScore(
  userId: string,
  gameId: string,
  gameTitle: string,
  score: number
): { isNewBest: boolean; progress: GameProgress } {
  const existing = getUserGameProgress(userId, gameId);
  const previousHigh = existing?.highScore || 0;
  const isNewBest = score > previousHigh;

  const newHigh = Math.max(previousHigh, score);
  const progress = saveUserGameProgress(userId, gameId, gameTitle, {
    highScore: newHigh
  });

  return { isNewBest, progress };
}

// Temporary guest session state
export function setGuestSessionProgress(gameId: string, data: Partial<GameProgress>): void {
  try {
    const raw = sessionStorage.getItem(GUEST_TEMP_STORAGE);
    const map = raw ? JSON.parse(raw) : {};
    map[gameId] = {
      ...(map[gameId] || {}),
      ...data,
      lastUpdated: Date.now()
    };
    sessionStorage.setItem(GUEST_TEMP_STORAGE, JSON.stringify(map));
  } catch {}
}

export function getGuestSessionProgress(gameId: string): Partial<GameProgress> | null {
  try {
    const raw = sessionStorage.getItem(GUEST_TEMP_STORAGE);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[gameId] || null;
  } catch {
    return null;
  }
}

export function migrateGuestProgressToUser(userId: string): number {
  try {
    const raw = sessionStorage.getItem(GUEST_TEMP_STORAGE);
    if (!raw) return 0;
    const map: Record<string, Partial<GameProgress> & { lastUpdated?: number }> = JSON.parse(raw);
    let count = 0;

    for (const [gameId, guestData] of Object.entries(map)) {
      if (guestData) {
        saveUserGameProgress(userId, gameId, guestData.gameTitle || 'Arcade Game', {
          highScore: guestData.highScore || 0,
          levelReached: guestData.levelReached || 1,
          totalPlayTimeSeconds: guestData.totalPlayTimeSeconds || 0,
          checkpoints: guestData.checkpoints
        });
        count++;
      }
    }

    sessionStorage.removeItem(GUEST_TEMP_STORAGE);
    return count;
  } catch (err) {
    console.error('Failed to migrate guest progress:', err);
    return 0;
  }
}

export function calculateUserArcadeStats(userId: string): UserArcadeStats {
  const allProgress = getAllUserProgress(userId);

  const totalPlayTimeSeconds = allProgress.reduce((acc, curr) => acc + (curr.totalPlayTimeSeconds || 0), 0);
  const totalGamesPlayed = allProgress.length;
  const highestScoreOverall = allProgress.reduce((max, curr) => Math.max(max, curr.highScore || 0), 0);

  const achievements = DEFAULT_ACHIEVEMENTS.map(ach => {
    let unlocked = false;
    let unlockedAt = undefined;

    if (ach.id === 'first-save' && totalGamesPlayed >= 1) {
      unlocked = true;
    } else if (ach.id === 'score-100' && highestScoreOverall >= 100) {
      unlocked = true;
    } else if (ach.id === 'score-1000' && highestScoreOverall >= 1000) {
      unlocked = true;
    } else if (ach.id === 'multi-game' && totalGamesPlayed >= 3) {
      unlocked = true;
    } else if (ach.id === 'veteran-time' && totalPlayTimeSeconds >= 600) {
      unlocked = true;
    }

    return {
      ...ach,
      unlockedAt: unlocked ? new Date().toISOString() : undefined
    };
  });

  return {
    totalPlayTimeSeconds,
    totalGamesPlayed,
    highestScoreOverall,
    achievements
  };
}

export function hydrateUserProgressFromServer(user: User): void {
  if (!user || !user.id) return;
  try {
    const existing = getAllUserProgress(user.id);
    const existingMap = new Map(existing.map(p => [p.gameId, p]));
    let modified = false;

    if (user.savedProgress && typeof user.savedProgress === 'object') {
      for (const [gameId, progressData] of Object.entries(user.savedProgress)) {
        if (!existingMap.has(gameId)) {
          existingMap.set(gameId, {
            gameId,
            gameTitle: progressData.gameTitle || 'Arcade Game',
            highScore: Number(progressData.highScore || (user.highScores?.[gameId] || 0)),
            levelReached: Number(progressData.levelReached || 1),
            totalPlayTimeSeconds: Number(progressData.totalPlayTimeSeconds || 0),
            sessionsCount: Number(progressData.sessionsCount || 1),
            lastPlayedAt: progressData.lastPlayedAt || new Date().toISOString(),
            checkpoints: progressData.checkpoints,
            savedData: progressData.savedData
          });
          modified = true;
        } else {
          const curr = existingMap.get(gameId)!;
          if (progressData.highScore && Number(progressData.highScore) > curr.highScore) {
            curr.highScore = Number(progressData.highScore);
            modified = true;
          }
          if (progressData.levelReached && Number(progressData.levelReached) > curr.levelReached) {
            curr.levelReached = Number(progressData.levelReached);
            modified = true;
          }
          if (progressData.checkpoints && progressData.checkpoints !== curr.checkpoints) {
            curr.checkpoints = progressData.checkpoints;
            modified = true;
          }
          if (progressData.savedData && typeof progressData.savedData === 'object') {
            curr.savedData = { 
              ...(curr.savedData && typeof curr.savedData === 'object' ? curr.savedData : {}), 
              ...progressData.savedData 
            };
            modified = true;
          }
          if (progressData.totalPlayTimeSeconds && Number(progressData.totalPlayTimeSeconds) > curr.totalPlayTimeSeconds) {
            curr.totalPlayTimeSeconds = Number(progressData.totalPlayTimeSeconds);
            modified = true;
          }
        }
      }
    }

    if (user.highScores && typeof user.highScores === 'object') {
      for (const [gameId, score] of Object.entries(user.highScores)) {
        const numScore = Number(score);
        if (existingMap.has(gameId)) {
          const curr = existingMap.get(gameId)!;
          if (numScore > curr.highScore) {
            curr.highScore = numScore;
            modified = true;
          }
        } else {
          existingMap.set(gameId, {
            gameId,
            gameTitle: 'Arcade Game',
            highScore: numScore,
            levelReached: 1,
            totalPlayTimeSeconds: 0,
            sessionsCount: 1,
            lastPlayedAt: new Date().toISOString()
          });
          modified = true;
        }
      }
    }

    if (modified || existingMap.size > 0) {
      localStorage.setItem(getUserProgressKey(user.id), JSON.stringify(Array.from(existingMap.values())));
    }
  } catch (err) {
    console.error('Failed to hydrate progress from server:', err);
  }
}

