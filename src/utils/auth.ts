import { User } from '../types/user';

const CURRENT_USER_KEY = 'spherestrike_current_user';
const USERS_LIST_KEY = 'spherestrike_registered_users';

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
}

export function registerUser(username: string, email: string): User {
  const newUser: User = {
    id: 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    joinedAt: new Date().toISOString(),
    gamesPlayed: 0,
    gamesCreatedCount: 0,
  };

  setCurrentUser(newUser);

  try {
    const listRaw = localStorage.getItem(USERS_LIST_KEY);
    const list = listRaw ? JSON.parse(listRaw) : [];
    list.push(newUser);
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  return newUser;
}

export function loginUser(emailOrUsername: string): User {
  const query = emailOrUsername.trim().toLowerCase();
  let foundUser: User | null = null;

  try {
    const listRaw = localStorage.getItem(USERS_LIST_KEY);
    const list: User[] = listRaw ? JSON.parse(listRaw) : [];
    foundUser = list.find(u => u.email.toLowerCase() === query || u.username.toLowerCase() === query) || null;
  } catch {
    // ignore
  }

  if (!foundUser) {
    // If not found in previous local storage list, create or log in as valid session user
    const username = emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername;
    foundUser = {
      id: 'user-' + Date.now().toString(36),
      username: username,
      email: emailOrUsername.includes('@') ? emailOrUsername : `${username}@spherestrike.games`,
      joinedAt: new Date().toISOString(),
      gamesPlayed: 1,
      gamesCreatedCount: 0,
    };
  }

  setCurrentUser(foundUser);
  return foundUser;
}

export function logoutUser(): void {
  setCurrentUser(null);
}
