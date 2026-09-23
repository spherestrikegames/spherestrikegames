import { User } from '../types/user';
import { registerAccountApi, loginAccountApi, saveAccountDataApi } from './api';

const SESSION_USER_KEY = 'spherestrike_current_user_v2';
const SAVED_ACCOUNT_KEY = 'spherestrike_saved_account';
const LAST_USERNAME_KEY = 'spherestrike_last_username';

// Restores user account where they left off
export function getCurrentUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY) || localStorage.getItem(SAVED_ACCOUNT_KEY);
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
      localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(user));
      localStorage.setItem(LAST_USERNAME_KEY, user.username);
    } else {
      sessionStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SAVED_ACCOUNT_KEY);
      localStorage.removeItem('spherestrike_admin_access');
    }
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
}

// Real Server Registration for accounts
export async function registerUser(
  username: string, 
  email: string, 
  password?: string,
  adminPasskey?: string,
  makeAdmin?: boolean
): Promise<User> {
  const pwd = password || 'SphereUser2026!';
  const user = await registerAccountApi(username, email, pwd, adminPasskey, makeAdmin);
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

// Sync user account data (high scores, game saves, favorites, last played) to server storage
export async function syncUserAccountData(
  userId: string, 
  data: {
    highScores?: Record<string, number>;
    savedProgress?: Record<string, any>;
    favoriteGameIds?: string[];
    createdGameIds?: string[];
    gamesPlayed?: number;
    lastPlayedGameId?: string;
    lastPlayedGameTitle?: string;
    lastActiveView?: string;
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

