import { Game, GameComment } from '../types/game';
import { User } from '../types/user';
import { AiAuditReport } from '../types/admin';
import { INITIAL_GAMES } from '../data/initialGames';

const STORAGE_KEY = 'spherestrike_games_cache';
const USERS_STORAGE_KEY = 'spherestrike_registered_users';

export async function fetchAllGames(): Promise<Game[]> {
  try {
    const res = await fetch('/api/games');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.games)) {
        const cleaned = data.games.filter((g: Game) => 
          g.id !== 'game-1790122769939-ad7ce' && 
          g.title.toLowerCase().trim() !== 'spherestrike'
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('Backend fetch failed, reading from local cache', e);
  }

  // Fallback to local storage or initial games
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed: Game[] = JSON.parse(cached);
      const cleaned = parsed.filter(g => 
        g.id !== 'game-1790122769939-ad7ce' && 
        g.title.toLowerCase().trim() !== 'spherestrike'
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
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
        // Update local cache with newly created server game
        const cached = await fetchAllGames();
        const updated = [data.game, ...cached.filter(g => g.id !== data.game.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return data.game;
      }
    } else {
      const errorData = await res.json().catch(() => null);
      console.error('Server failed to create game:', errorData || res.statusText);
      if (errorData?.message) {
        throw new Error(errorData.message);
      }
    }
  } catch (e: any) {
    console.warn('Backend server create call issue, using resilient local store fallback:', e);
    if (e.message && !e.message.includes('fetch')) {
      throw e;
    }
  }

  // Client-side fallback
  const now = new Date().toISOString();
  const version = payload.version || '1.0.0';
  const embedUrl = payload.embedUrl ? payload.embedUrl.trim() : undefined;
  const code = payload.code || (embedUrl ? `<iframe src="${embedUrl}" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>` : '');
  const gameType = embedUrl ? 'embed' : (payload.type || 'html5');

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
        code: code,
        createdAt: now,
        author: payload.author || 'Sphere Creator'
      }
    ],
    code: code,
    type: gameType,
    embedUrl: embedUrl,
    coverImage: payload.coverImage,
    badge: payload.badge || 'new',
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
    code?: string;
    embedUrl?: string;
    coverImage?: string;
    badge?: 'hot' | 'update' | 'new' | 'star' | 'stream' | 'none';
    type?: 'html5' | 'embed';
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
        const cached = await fetchAllGames();
        const updated = cached.map(g => g.id === gameId ? data.game : g);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return data.game;
      }
    } else {
      const errData = await res.json().catch(() => null);
      console.error('Server failed to update game:', errData || res.statusText);
      if (errData?.message) throw new Error(errData.message);
    }
  } catch (e: any) {
    console.warn('Server update failed, falling back locally', e);
    if (e.message && !e.message.includes('fetch')) throw e;
  }

  // Local fallback
  const cached = await fetchAllGames();
  const gameIndex = cached.findIndex(g => g.id === gameId);
  if (gameIndex === -1) throw new Error('Game not found');

  const game = cached[gameIndex];
  const now = new Date().toISOString();
  const embedUrl = payload.embedUrl !== undefined ? (payload.embedUrl ? payload.embedUrl.trim() : undefined) : game.embedUrl;
  const code = payload.code || (embedUrl ? `<iframe src="${embedUrl}" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>` : game.code);

  game.title = payload.title || game.title;
  game.description = payload.description || game.description;
  if (payload.genre) game.genre = payload.genre;
  if (payload.tags) game.tags = payload.tags;
  if (payload.controls) game.controls = payload.controls;
  game.currentVersion = payload.version;
  game.code = code;
  game.embedUrl = embedUrl;
  if (payload.coverImage !== undefined) game.coverImage = payload.coverImage;
  if (payload.badge !== undefined) game.badge = payload.badge;
  if (embedUrl) game.type = 'embed';
  game.updatedAt = now;
  game.versions.unshift({
    version: payload.version,
    changelog: payload.changelog,
    code: code,
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

// Helper to get active admin credentials for protected API operations
function getAdminHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-passkey': 'goyal.rishi'
  };
  try {
    const raw = sessionStorage.getItem('spherestrike_current_user_v2') || localStorage.getItem('spherestrike_saved_account');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.isAdmin && (u.role === 'admin' || u.isAdmin === true)) {
        headers['x-admin-id'] = u.id;
      }
    }
  } catch {}
  return headers;
}

// User Monitoring & AI Security Audit API Helpers
export async function fetchAllUsers(): Promise<User[]> {
  try {
    const res = await fetch('/api/users', {
      headers: getAdminHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data.users));
        return data.users;
      }
    }
  } catch (e) {
    console.warn('Backend fetch users failed, falling back to local storage', e);
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function syncUserToServer(user: User): Promise<User> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        return data.user;
      }
    }
  } catch (e) {
    console.warn('Failed to sync user to backend', e);
  }
  return user;
}

export async function blockUserAccount(userId: string, reason?: string): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await fetch(`/api/users/${userId}/block`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason: reason || 'Blocked by administrator due to policy violation' })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      // Sync local cache
      const users = await fetchAllUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].isBlocked = true;
        users[idx].blockedReason = reason || 'Blocked by administrator';
        users[idx].blockedAt = new Date().toISOString();
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message || 'Failed to block user' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error blocking user' };
  }
}

export async function unblockUserAccount(userId: string): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await fetch(`/api/users/${userId}/unblock`, {
      method: 'POST',
      headers: getAdminHeaders()
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const users = await fetchAllUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].isBlocked = false;
        users[idx].blockedReason = undefined;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message || 'Failed to unblock user' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error unblocking user' };
  }
}

export async function unblockAllUserAccounts(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/users/unblock-all', {
      method: 'POST',
      headers: getAdminHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const users = await fetchAllUsers();
        users.forEach(u => {
          u.isBlocked = false;
          u.blockedReason = undefined;
        });
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        return { success: true, message: data.message || 'Unblocked all user accounts' };
      }
    }
  } catch {}

  // Local storage fallback for static hosting
  try {
    const users = await fetchAllUsers();
    users.forEach(u => {
      u.isBlocked = false;
      u.blockedReason = undefined;
    });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return { success: true, message: 'Unblocked all user accounts.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to unblock user accounts.' };
  }
}

export async function triggerAiSecurityAudit(): Promise<AiAuditReport> {
  const res = await fetch('/api/admin/ai-security-audit', { 
    method: 'POST',
    headers: getAdminHeaders()
  });
  const data = await res.json();
  if (res.ok && data.success && data.report) {
    return data.report;
  }
  throw new Error(data.message || 'Failed to trigger AI Security Audit');
}

export async function fetchAiAuditStatus(): Promise<{ report: AiAuditReport | null; isManualOnly: boolean; lastAuditTime?: string }> {
  try {
    const res = await fetch('/api/admin/audit-status', {
      headers: getAdminHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return {
        report: data.report || null,
        isManualOnly: true,
        lastAuditTime: data.lastAuditTime
      };
    }
  } catch {}
  return {
    report: null,
    isManualOnly: true
  };
}

export async function checkAccountStatus(userId: string): Promise<{ isBlocked: boolean; blocked: boolean; blockedReason?: string }> {
  try {
    const users = await fetchAllUsers();
    const query = userId.toLowerCase();
    const match = users.find(u => u.id === userId || u.username.toLowerCase() === query || u.email.toLowerCase() === query);
    if (match && match.isBlocked) {
      return { isBlocked: true, blocked: true, blockedReason: match.blockedReason || 'Blocked by administrator due to policy violations.' };
    }
  } catch {}
  return { isBlocked: false, blocked: false };
}

async function safeParseResponse(res: Response, defaultError: string): Promise<any> {
  const text = await res.text().catch(() => '');
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Prevents Safari/WebKit DOMException "The string did not match the expected pattern."
      const parseErr: any = new Error(
        res.status >= 500 
          ? 'Game server is currently busy or restarting. Please try again in a moment.'
          : res.status === 404
          ? 'Authentication service not reachable. Please reload the page.'
          : defaultError
      );
      parseErr.status = res.status;
      throw parseErr;
    }
  }
  if (!res.ok || (data && data.success === false)) {
    const errorMsg = data?.message || defaultError;
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.code = data?.code;
    err.username = data?.username;
    throw err;
  }
  return data;
}

export async function registerAccountApi(
  username: string, 
  email: string, 
  password: string,
  adminPasskey?: string,
  makeAdmin?: boolean
): Promise<User> {
  let res: Response | null = null;
  try {
    res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, adminPasskey, makeAdmin })
    });
    if (res.ok) {
      const data = await safeParseResponse(res, 'Registration failed. Please check your credentials.');
      return data.user;
    }
  } catch (netErr: any) {
    if (netErr?.status && netErr?.status !== 404 && netErr?.status !== 502) {
      throw netErr;
    }
  }

  // Fallback for static hosting (e.g. GitHub Pages) where /api/auth/* returns 404
  if (!res || res.status === 404 || res.status === 502 || res.status === 503) {
    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];

    const normUsername = username.trim().toLowerCase();
    const normEmail = email.trim().toLowerCase();

    if (users.some(u => u.username.toLowerCase() === normUsername)) {
      throw new Error('Username is already taken');
    }
    if (users.some(u => u.email.toLowerCase() === normEmail)) {
      throw new Error('Email is already registered');
    }

    const validPasskeys = ['rishi_admin', 'goyal.rishi', 'macbookair'];
    const isAdmin = Boolean(makeAdmin || (adminPasskey && validPasskeys.includes(adminPasskey.trim())));

    const newUser: User = {
      id: 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      role: isAdmin ? 'admin' : 'user',
      isAdmin: isAdmin,
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      highScores: {},
      savedProgress: {},
      favoriteGameIds: [],
      createdGameIds: [],
      gamesPlayed: 0,
      isBlocked: false
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return newUser;
  }

  const data = await safeParseResponse(res, 'Registration failed. Please check your credentials.');
  return data.user;
}

export async function deleteUserAccountApi(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${userId}`, { 
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    if (res.ok) {
      const data = await safeParseResponse(res, 'Failed to delete user.');
      return Boolean(data.success);
    }
  } catch {}

  // Local fallback
  const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
  if (rawUsers) {
    try {
      const users: User[] = JSON.parse(rawUsers);
      const filtered = users.filter(u => u.id !== userId);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch {}
  }
  return false;
}

export async function deleteAllUserAccountsApi(): Promise<boolean> {
  try {
    const res = await fetch('/api/users', { 
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    if (res.ok) {
      const data = await safeParseResponse(res, 'Failed to delete all users.');
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
      return Boolean(data.success);
    }
  } catch {}

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
  return true;
}

export async function resetAllAccountsApi(): Promise<{ success: boolean; message: string; clearedCount?: number }> {
  try {
    const res = await fetch('/api/admin/accounts/reset', { 
      method: 'POST',
      headers: getAdminHeaders()
    });
    if (res.ok) {
      const data = await safeParseResponse(res, 'Failed to reset accounts.');
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
      return { success: true, message: data.message || 'All accounts have been reset.', clearedCount: data.clearedCount };
    }
  } catch {}

  // Fallback to DELETE /api/users
  try {
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    if (res.ok) {
      const data = await safeParseResponse(res, 'Failed to reset accounts.');
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
      return { success: true, message: data.message || 'All accounts have been reset.', clearedCount: data.clearedCount };
    }
  } catch {}

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
  return { success: true, message: 'All accounts storage reset successfully.' };
}

export async function loginAccountApi(identifier: string, password: string): Promise<User> {
  let res: Response | null = null;
  try {
    res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    if (res.ok) {
      const data = await safeParseResponse(res, 'Login failed. Please check your credentials.');
      return data.user;
    }
  } catch (netErr: any) {
    if (netErr?.status && netErr?.status !== 404 && netErr?.status !== 502) {
      throw netErr;
    }
  }

  // Fallback for static hosting (e.g. GitHub Pages) where /api/auth/* returns 404
  if (!res || res.status === 404 || res.status === 502 || res.status === 503) {
    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
    const normId = identifier.trim().toLowerCase();

    const match = users.find(u => u.username.toLowerCase() === normId || u.email.toLowerCase() === normId);
    if (match) {
      if (match.isBlocked) {
        throw new Error(`Account blocked: ${match.blockedReason || 'Policy violation'}`);
      }
      const validPasskeys = ['rishi_admin', 'goyal.rishi', 'macbookair'];
      if (match.password === password || (match.isAdmin && validPasskeys.includes(password))) {
        match.lastLoginAt = new Date().toISOString();
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        return match;
      }
    }

    // Auto-provision admin user for owner passkeys/emails when running on static hosting
    const validPasskeys = ['rishi_admin', 'goyal.rishi', 'macbookair'];
    if (validPasskeys.includes(password) || normId === 'rishi.p1.goyal@gmail.com' || normId === 'admin' || normId === 'rishi_admin') {
      const adminUser: User = {
        id: 'u-admin-local-' + Date.now(),
        username: normId === 'rishi.p1.goyal@gmail.com' ? 'Rishi Goyal' : (identifier.trim() || 'Admin'),
        email: normId.includes('@') ? normId : 'rishi.p1.goyal@gmail.com',
        password: password,
        role: 'admin',
        isAdmin: true,
        joinedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        highScores: {},
        savedProgress: {},
        favoriteGameIds: [],
        createdGameIds: [],
        gamesPlayed: 0,
        isBlocked: false
      };
      users.push(adminUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return adminUser;
    }

    throw new Error('Invalid username/email or password.');
  }

  const data = await safeParseResponse(res, 'Login failed. Please check your credentials.');
  return data.user;
}

export async function saveAccountDataApi(userId: string, accountData: {
  highScores?: Record<string, number>;
  savedProgress?: Record<string, any>;
  favoriteGameIds?: string[];
  createdGameIds?: string[];
  gamesPlayed?: number;
  lastPlayedGameId?: string;
  lastPlayedGameTitle?: string;
  lastActiveView?: string;
}): Promise<User> {
  try {
    const res = await fetch('/api/auth/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...accountData })
    });
    if (res.ok) {
      const data = await safeParseResponse(res, 'Failed to save account data.');
      return data.user;
    }
  } catch {}

  // Fallback to local storage for GitHub Pages
  const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
  const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
  const idx = users.findIndex(u => u.id === userId);

  let targetUser: User;
  if (idx !== -1) {
    targetUser = users[idx];
  } else {
    const rawSaved = localStorage.getItem('spherestrike_saved_account');
    targetUser = rawSaved ? JSON.parse(rawSaved) : {
      id: userId,
      username: 'Player',
      email: 'player@local',
      role: 'user',
      isAdmin: false,
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      highScores: {},
      savedProgress: {},
      favoriteGameIds: [],
      createdGameIds: [],
      gamesPlayed: 0
    };
  }

  if (accountData.highScores) targetUser.highScores = { ...(targetUser.highScores || {}), ...accountData.highScores };
  if (accountData.savedProgress) targetUser.savedProgress = { ...(targetUser.savedProgress || {}), ...accountData.savedProgress };
  if (accountData.favoriteGameIds) targetUser.favoriteGameIds = accountData.favoriteGameIds;
  if (accountData.createdGameIds) targetUser.createdGameIds = accountData.createdGameIds;
  if (accountData.gamesPlayed !== undefined) targetUser.gamesPlayed = accountData.gamesPlayed;
  if (accountData.lastPlayedGameId) targetUser.lastPlayedGameId = accountData.lastPlayedGameId;
  if (accountData.lastPlayedGameTitle) targetUser.lastPlayedGameTitle = accountData.lastPlayedGameTitle;
  if (accountData.lastActiveView) targetUser.lastActiveView = accountData.lastActiveView;

  if (idx !== -1) {
    users[idx] = targetUser;
  } else {
    users.push(targetUser);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem('spherestrike_saved_account', JSON.stringify(targetUser));

  return targetUser;
}

export async function exportAccountsBackupApi(): Promise<any> {
  const res = await fetch('/api/admin/accounts/export', {
    headers: getAdminHeaders()
  });
  return await safeParseResponse(res, 'Failed to export accounts backup.');
}

export async function importAccountsBackupApi(importedData: any): Promise<{ success: boolean; message: string; totalAccounts: number }> {
  const res = await fetch('/api/admin/accounts/import', {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(importedData)
  });
  return await safeParseResponse(res, 'Failed to import accounts backup.');
}

export async function registerAccountWithAiApi(accountData: {
  username: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
}): Promise<{ success: boolean; user: User; aiAnalysis?: any; message: string }> {
  const res = await fetch('/api/admin/accounts/ai-register', {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(accountData)
  });
  return await safeParseResponse(res, 'Failed to register and AI-identify account.');
}


