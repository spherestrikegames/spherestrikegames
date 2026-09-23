import { User } from '../types/user';
import { registerAccountApi, loginAccountApi, saveAccountDataApi } from './api';

const SESSION_USER_KEY = 'spherestrike_active_session';
const LEGACY_STORAGE_KEY = 'spherestrike_current_user';

// Always defaults to NO account when a new link or browser is opened
export function getCurrentUser(): User | null {
  try {
    // Clean up any old sticky localStorage so no shared link defaults to an account
    if (typeof window !== 'undefined' && localStorage.getItem(LEGACY_STORAGE_KEY)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    // Only load if explicitly logged in during THIS active browser tab session
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    const user: User = JSON.parse(raw);
    if (user.isBlocked) {
      logoutUser();
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (user) {
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
}

// Real Server Registration for lots of accounts
export async function registerUser(username: string, email: string, password?: string): Promise<User> {
  const pwd = password || 'SphereUser2026!';
  const user = await registerAccountApi(username, email, pwd);
  setCurrentUser(user);
  return user;
}

// Real Server Login with verification
export async function loginUser(emailOrUsername: string, password?: string): Promise<User> {
  const pwd = password || '';
  const user = await loginAccountApi(emailOrUsername, pwd);
  setCurrentUser(user);
  return user;
}

// Sync user account data (high scores, game saves, favorites) to server storage
export async function syncUserAccountData(
  userId: string, 
  data: {
    highScores?: Record<string, number>;
    savedProgress?: Record<string, any>;
    favoriteGameIds?: string[];
    createdGameIds?: string[];
    gamesPlayed?: number;
  }
): Promise<User | null> {
  try {
    const updated = await saveAccountDataApi(userId, data);
    setCurrentUser(updated);
    return updated;
  } catch (err) {
    console.error('Failed to sync account data:', err);
    return null;
  }
}

export function logoutUser(): void {
  setCurrentUser(null);
}

