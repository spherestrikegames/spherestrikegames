/**
 * IndexedDB Game Storage Engine
 * 
 * Provides virtually unlimited browser storage (hundreds of megabytes to gigabytes)
 * for private, offline, single-file HTML5/JS arcade games without hitting
 * the strict 5MB localStorage quota limit.
 */

import { Game } from '../types/game';

const DB_NAME = 'SphereStrike_GameVault_DB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_games';

function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open game storage database'));
    };
  });
}

export async function saveGameToIndexedDB(game: Game): Promise<void> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        ...game,
        savedAtTimestamp: Date.now()
      });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to write game data to IndexedDB'));
      };
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB:', err);
    throw err;
  }
}

export async function getGameFromIndexedDB(id: string): Promise<Game | null> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as Game) || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function getAllGamesFromIndexedDB(): Promise<Game[]> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as Game[]) || [];
        resolve(results);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

export async function deleteGameFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Failed to delete game from IndexedDB'));
    });
  } catch (err) {
    console.warn('Error deleting game from IndexedDB:', err);
  }
}
