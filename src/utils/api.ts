import { Game, GameComment } from '../types/game';
import { INITIAL_GAMES } from '../data/initialGames';

const STORAGE_KEY = 'spherestrike_games_cache';

export async function fetchAllGames(): Promise<Game[]> {
  try {
    const res = await fetch('/api/games');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.games)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.games));
        return data.games;
      }
    }
  } catch (e) {
    console.warn('Backend fetch failed, reading from local cache', e);
  }

  // Fallback to local storage or initial games
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return INITIAL_GAMES;
}

export async function createGame(payload: Partial<Game> & { version?: string; changelog?: string }): Promise<Game> {
  try {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.game) {
        return data.game;
      }
    }
  } catch (e) {
    console.warn('Server create failed, saving locally', e);
  }

  // Client-side fallback
  const now = new Date().toISOString();
  const version = payload.version || '1.0.0';
  const newGame: Game = {
    id: 'game-' + Date.now(),
    title: payload.title || 'Untitled Game',
    slug: (payload.title || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36),
    description: payload.description || 'Community web game.',
    genre: payload.genre || 'Arcade',
    tags: payload.tags || ['Indie', 'HTML5'],
    author: payload.author || 'Sphere Creator',
    currentVersion: version,
    versions: [
      {
        version: version,
        changelog: payload.changelog || 'Initial community upload.',
        code: payload.code || '',
        createdAt: now,
        author: payload.author || 'Sphere Creator'
      }
    ],
    code: payload.code || '',
    type: payload.type || 'html5',
    thumbnailGradient: payload.thumbnailGradient || 'from-blue-950 via-slate-900 to-black',
    accentColor: payload.accentColor || '#3b82f6',
    iconName: payload.iconName || 'Gamepad2',
    likes: 1,
    plays: 0,
    rating: 5.0,
    ratingsCount: 1,
    comments: [],
    controls: payload.controls || [{ key: 'Mouse / Keys', action: 'Play Game' }],
    createdAt: now,
    updatedAt: now
  };

  const cached = await fetchAllGames();
  const updated = [newGame, ...cached];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newGame;
}

export async function updateGame(
  gameId: string, 
  payload: {
    title?: string;
    description?: string;
    genre?: any;
    tags?: string[];
    version: string;
    changelog: string;
    code: string;
    author?: string;
    controls?: { key: string; action: string }[];
  }
): Promise<Game> {
  try {
    const res = await fetch(`/api/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.game) {
        return data.game;
      }
    }
  } catch (e) {
    console.warn('Server update failed, saving locally', e);
  }

  // Local fallback
  const cached = await fetchAllGames();
  const gameIndex = cached.findIndex(g => g.id === gameId);
  if (gameIndex === -1) throw new Error('Game not found');

  const game = cached[gameIndex];
  const now = new Date().toISOString();
  game.title = payload.title || game.title;
  game.description = payload.description || game.description;
  if (payload.genre) game.genre = payload.genre;
  if (payload.tags) game.tags = payload.tags;
  if (payload.controls) game.controls = payload.controls;
  game.currentVersion = payload.version;
  game.code = payload.code;
  game.updatedAt = now;
  game.versions.unshift({
    version: payload.version,
    changelog: payload.changelog,
    code: payload.code,
    createdAt: now,
    author: payload.author || game.author
  });

  game.comments.unshift({
    id: 'c-' + Date.now(),
    author: game.author,
    text: `Version ${payload.version} updated: ${payload.changelog}`,
    rating: 5,
    createdAt: now,
    likes: 0,
    isDev: true
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  return game;
}

export async function trackGamePlay(gameId: string): Promise<number> {
  try {
    const res = await fetch(`/api/games/${gameId}/play`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return data.plays;
    }
  } catch {}
  return 0;
}

export async function likeGame(gameId: string): Promise<number> {
  try {
    const res = await fetch(`/api/games/${gameId}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return data.likes;
    }
  } catch {}
  return 0;
}

export async function addComment(gameId: string, author: string, text: string, rating: number): Promise<GameComment[]> {
  try {
    const res = await fetch(`/api/games/${gameId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text, rating })
    });
    if (res.ok) {
      const data = await res.json();
      return data.comments;
    }
  } catch {}
  return [];
}

export async function deleteGame(gameId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
    if (res.ok) {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const list: Game[] = JSON.parse(cached);
          const filtered = list.filter(g => g.id !== gameId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch {}
      }
      return true;
    }
  } catch (e) {
    console.error('Failed to delete game on server', e);
  }

  // Local fallback
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const list: Game[] = JSON.parse(cached);
      const filtered = list.filter(g => g.id !== gameId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch {}
  }
  return false;
}

export async function clearAllGames(): Promise<boolean> {
  try {
    await fetch('/api/games', { method: 'DELETE' });
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  try {
    localStorage.removeItem('hyperarcade_games_cache');
  } catch {}
  return true;
}

