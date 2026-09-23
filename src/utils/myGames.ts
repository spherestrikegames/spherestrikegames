import { Game } from '../types/game';

const STORAGE_KEY = 'spherestrike_my_created_game_ids';

export function getMyCreatedGameIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.filter(id => id !== 'game-1790122769939-ad7ce');
  } catch (err) {
    console.error('Error reading my created game IDs from storage:', err);
    return [];
  }
}

export function addMyCreatedGameId(gameId: string): void {
  try {
    const current = getMyCreatedGameIds();
    if (!current.includes(gameId)) {
      const updated = [gameId, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error saving created game ID:', err);
  }
}

export function removeMyCreatedGameId(gameId: string): void {
  try {
    const current = getMyCreatedGameIds();
    const updated = current.filter(id => id !== gameId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error removing created game ID:', err);
  }
}

export function isUserCreatedGame(game: Game): boolean {
  if (!game) return false;
  // If explicitly flagged or author is current user
  if ((game as any).isCustom) return true;
  const ids = getMyCreatedGameIds();
  return ids.includes(game.id);
}
