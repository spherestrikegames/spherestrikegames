import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_GAMES } from './src/data/initialGames';
import { Game } from './src/types/game';
import { User } from './src/types/user';
import { AiAuditReport, AiFlaggedUser } from './src/types/admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Gemini Client via @google/genai SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Allow large game uploads (HTML/Canvas bundles up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-memory store with disk persistence fallback
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'games.json');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');

let games: Game[] = [];
let users: User[] = [];
let latestAiAuditReport: AiAuditReport | null = null;
let lastAuditTime = Date.now();
const AUDIT_INTERVAL_MS = 3600000; // 1 Hour

const INITIAL_USERS_SEED: User[] = [
  {
    id: 'user-admin-001',
    username: 'Rishi_admin',
    email: 'rishi.p1.goyal@gmail.com',
    joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    gamesPlayed: 142,
    gamesCreatedCount: 5,
    isBlocked: false,
    isFlagged: false,
    suspiciousScore: 0,
    aiRiskCategory: 'Clean Verified Administrator',
    aiExplanation: 'System Administrator account. No anomalies or malicious activity detected.'
  }
];

function loadGames() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: Game[] = JSON.parse(raw);
      games = parsed.filter(g => g.id !== 'game-1790122769939-ad7ce' && g.title.toLowerCase().trim() !== 'spherestrike');
      if (games.length !== parsed.length) {
        saveGames();
      }
    } else {
      games = [...INITIAL_GAMES];
      saveGames();
    }
  } catch (err) {
    console.error('Error loading games from disk, using initial default:', err);
    games = [...INITIAL_GAMES];
  }
}

function saveGames() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write games to disk:', err);
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const loaded: User[] = JSON.parse(raw);
      // Clean up all sample bot / fake email accounts, keeping only Rishi_admin and real accounts
      users = loaded.filter(u => 
        u.username.toLowerCase() === 'rishi_admin' || 
        u.id === 'user-admin-001'
      );
      if (users.length === 0) {
        users = [...INITIAL_USERS_SEED];
      }
      saveUsers();
    } else {
      users = [...INITIAL_USERS_SEED];
      saveUsers();
    }
  } catch (err) {
    console.error('Error loading users from disk, using seed:', err);
    users = [...INITIAL_USERS_SEED];
    saveUsers();
  }
}

function saveUsers() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write users to disk:', err);
  }
}

// Initialize stores
loadGames();
loadUsers();

// API Routes
app.get('/api/games', (req: Request, res: Response) => {
  // Return summarized list or full list
  res.json({ success: true, games });
});

app.get('/api/games/:id', (req: Request, res: Response) => {
  const game = games.find(g => g.id === req.params.id || g.slug === req.params.id);
  if (!game) {
    return res.status(404).json({ success: false, message: 'Game not found' });
  }
  res.json({ success: true, game });
});

// Upload New Game
app.post('/api/games', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.title || (!body.code && !body.embedUrl)) {
      return res.status(400).json({ success: false, message: 'Game name and either game link or code are required' });
    }

    // Check if author is blocked
    const authorName = (body.author || '').trim().toLowerCase();
    const matchedUser = users.find(u => u.username.toLowerCase() === authorName || u.email.toLowerCase() === authorName || (body.authorId && u.id === body.authorId));
    if (matchedUser && matchedUser.isBlocked) {
      return res.status(403).json({ 
        success: false, 
        message: `Account suspended: ${matchedUser.blockedReason || 'This account has been blocked by an administrator due to reported suspicious behavior.'}` 
      });
    }

    // Update user gamesCreatedCount if user exists
    if (matchedUser) {
      matchedUser.gamesCreatedCount = (matchedUser.gamesCreatedCount || 0) + 1;
      saveUsers();
    }

    const newId = 'game-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const version = body.version || '1.0.0';
    const embedUrl = body.embedUrl ? String(body.embedUrl).trim() : undefined;
    const code = body.code || (embedUrl ? `<iframe src="${embedUrl}" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>` : '');
    const gameType = embedUrl ? 'embed' : (body.type || 'html5');

    const newGame: Game = {
      id: newId,
      title: body.title,
      slug: slug,
      description: body.description || 'A community-created web game.',
      genre: body.genre || 'Action',
      tags: Array.isArray(body.tags) ? body.tags : ['Community', 'Web'],
      author: body.author || 'Anonymous Creator',
      currentVersion: version,
      versions: [
        {
          version: version,
          changelog: body.changelog || 'Initial community upload.',
          code: code,
          createdAt: now,
          author: body.author || 'Anonymous Creator'
        }
      ],
      code: code,
      type: gameType,
      embedUrl: embedUrl,
      coverImage: body.coverImage || undefined,
      badge: body.badge || 'new',
      thumbnailGradient: body.thumbnailGradient || 'from-blue-950 via-slate-900 to-black',
      accentColor: body.accentColor || '#3b82f6',
      iconName: body.iconName || 'Gamepad2',
      likes: 1,
      plays: 0,
      rating: 5.0,
      ratingsCount: 1,
      comments: [
        {
          id: 'welcome-' + Date.now(),
          author: 'Sphere Strike System',
          text: `Welcome to ${body.title}! Try it out, leave a rating, and share feedback with the developer.`,
          rating: 5,
          createdAt: now,
          likes: 0
        }
      ],
      controls: body.controls || [
        { key: 'Mouse & Keyboard', action: 'Standard Game Controls' }
      ],
      featured: false,
      createdAt: now,
      updatedAt: now
    };

    games.unshift(newGame);
    saveGames();

    res.status(201).json({ success: true, game: newGame });
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ success: false, message: 'Server error creating game' });
  }
});

// Update Existing Game (Version Bump & Changelog!)
app.put('/api/games/:id', (req: Request, res: Response) => {
  try {
    const gameIndex = games.findIndex(g => g.id === req.params.id);
    if (gameIndex === -1) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const game = games[gameIndex];
    const body = req.body;
    const now = new Date().toISOString();
    const newVersion = body.version || `1.${game.versions.length}.0`;
    const embedUrl = body.embedUrl !== undefined ? (body.embedUrl ? String(body.embedUrl).trim() : undefined) : game.embedUrl;
    const code = body.code || (embedUrl ? `<iframe src="${embedUrl}" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>` : game.code);

    const versionEntry = {
      version: newVersion,
      changelog: body.changelog || 'Updated gameplay and polish.',
      code: code,
      createdAt: now,
      author: body.author || game.author
    };

    // Update game record
    game.title = body.title || game.title;
    game.description = body.description || game.description;
    game.genre = body.genre || game.genre;
    if (body.tags) game.tags = body.tags;
    if (body.controls) game.controls = body.controls;
    game.currentVersion = newVersion;
    game.code = code;
    game.embedUrl = embedUrl;
    if (body.coverImage !== undefined) game.coverImage = body.coverImage;
    if (body.badge !== undefined) game.badge = body.badge;
    if (embedUrl) game.type = 'embed';
    game.versions.unshift(versionEntry);
    game.updatedAt = now;

    // Add a changelog comment from developer
    game.comments.unshift({
      id: 'changelog-' + Date.now(),
      author: game.author,
      text: `🚀 Version ${newVersion} is now LIVE! Changelog: ${body.changelog || 'General improvements and bug fixes.'}`,
      rating: 5,
      createdAt: now,
      likes: 1,
      isDev: true
    });

    saveGames();

    res.json({ success: true, game });
  } catch (err) {
    console.error('Error updating game:', err);
    res.status(500).json({ success: false, message: 'Server error updating game' });
  }
});

// Increment Play Counter
app.post('/api/games/:id/play', (req: Request, res: Response) => {
  const game = games.find(g => g.id === req.params.id);
  if (game) {
    game.plays = (game.plays || 0) + 1;
    saveGames();
    return res.json({ success: true, plays: game.plays });
  }
  res.status(404).json({ success: false, message: 'Game not found' });
});

// Like Game
app.post('/api/games/:id/like', (req: Request, res: Response) => {
  const game = games.find(g => g.id === req.params.id);
  if (game) {
    game.likes = (game.likes || 0) + 1;
    saveGames();
    return res.json({ success: true, likes: game.likes });
  }
  res.status(404).json({ success: false, message: 'Game not found' });
});

// Rate Game
app.post('/api/games/:id/rate', (req: Request, res: Response) => {
  const game = games.find(g => g.id === req.params.id);
  const rating = Number(req.body.rating);
  if (game && rating >= 1 && rating <= 5) {
    const total = (game.rating * game.ratingsCount) + rating;
    game.ratingsCount += 1;
    game.rating = Number((total / game.ratingsCount).toFixed(1));
    saveGames();
    return res.json({ success: true, rating: game.rating, ratingsCount: game.ratingsCount });
  }
  res.status(400).json({ success: false, message: 'Invalid rating' });
});

// Add Comment / Review
app.post('/api/games/:id/comments', (req: Request, res: Response) => {
  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ success: false, message: 'Game not found' });

  const { author, text, rating, authorId } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'Comment text required' });

  // Check if commenter is blocked
  const commenterName = (author || '').trim().toLowerCase();
  const matchedUser = users.find(u => u.username.toLowerCase() === commenterName || u.email.toLowerCase() === commenterName || (authorId && u.id === authorId));
  if (matchedUser && matchedUser.isBlocked) {
    return res.status(403).json({ 
      success: false, 
      message: `Account suspended: ${matchedUser.blockedReason || 'This account has been blocked by an administrator due to reported suspicious behavior.'}` 
    });
  }

  const newComment = {
    id: 'c-' + Date.now(),
    author: author || 'Player_' + Math.floor(Math.random() * 1000),
    text,
    rating: Number(rating) || 5,
    createdAt: new Date().toISOString(),
    likes: 0
  };

  game.comments.unshift(newComment);
  saveGames();
  res.status(201).json({ success: true, comment: newComment, comments: game.comments });
});

// Delete a specific game
app.delete('/api/games/:id', (req: Request, res: Response) => {
  const index = games.findIndex(g => g.id === req.params.id);
  if (index !== -1) {
    const deleted = games.splice(index, 1)[0];
    saveGames();
    return res.json({ success: true, message: 'Game deleted successfully', game: deleted });
  }
  res.status(404).json({ success: false, message: 'Game not found' });
});

// Clear all games
app.delete('/api/games', (req: Request, res: Response) => {
  games = [];
  saveGames();
  res.json({ success: true, message: 'All games cleared', games: [] });
});

// Reset games to defaults if requested
app.post('/api/games/reset-defaults', (req: Request, res: Response) => {
  games = [...INITIAL_GAMES];
  saveGames();
  res.json({ success: true, games });
});

// ==========================================
// USER MONITORING & AI SECURITY AUDIT SYSTEM
// ==========================================

// Core AI Security Audit Function using Gemini API
async function runAiSecurityAuditCore(): Promise<AiAuditReport> {
  const now = new Date().toISOString();
  lastAuditTime = Date.now();

  const userSummaryList = users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    joinedAt: u.joinedAt,
    gamesPlayed: u.gamesPlayed || 0,
    gamesCreatedCount: u.gamesCreatedCount || 0,
    isBlocked: !!u.isBlocked
  }));

  let report: AiAuditReport;

  try {
    const prompt = `You are an AI Cyber-Security Auditor for Sphere Strike Arcade. Analyze the following account activity records for bot behavior, spam patterns, suspicious email domains, creation floods, and malicious activity:

User Accounts Data:
${JSON.stringify(userSummaryList, null, 2)}

Provide a structured security report evaluating each account. Return JSON matching this exact structure:
{
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "Short paragraph summarizing security posture",
  "flaggedUsers": [
    {
      "userId": "string",
      "username": "string",
      "email": "string",
      "suspiciousScore": number (0 to 100),
      "riskCategory": "string category name",
      "explanation": "string reason for flag",
      "recommendedAction": "Block Account" | "Monitor" | "Dismiss"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const textOutput = response.text || '';
    const parsed = JSON.parse(textOutput);

    const flaggedUsersList: AiFlaggedUser[] = Array.isArray(parsed.flaggedUsers) ? parsed.flaggedUsers : [];

    // Apply AI findings back to user records
    users.forEach(u => {
      const match = flaggedUsersList.find(f => f.userId === u.id || f.username === u.username);
      if (match) {
        u.suspiciousScore = match.suspiciousScore;
        u.aiRiskCategory = match.riskCategory;
        u.aiExplanation = match.explanation;
        u.lastAiAuditAt = now;
        if (match.suspiciousScore >= 60) {
          u.isFlagged = true;
          u.flagReason = match.explanation;
        } else {
          u.isFlagged = false;
        }
      } else {
        u.suspiciousScore = u.suspiciousScore ?? 5;
        u.aiRiskCategory = u.aiRiskCategory || 'Active User';
        u.aiExplanation = u.aiExplanation || 'Regular activity within expected parameters.';
        u.lastAiAuditAt = now;
      }
    });

    saveUsers();

    const blockedCount = users.filter(u => u.isBlocked).length;
    const flaggedCount = users.filter(u => u.isFlagged || (u.suspiciousScore || 0) >= 60).length;

    report = {
      timestamp: now,
      threatLevel: parsed.threatLevel || (flaggedCount > 2 ? 'HIGH' : flaggedCount > 0 ? 'MEDIUM' : 'LOW'),
      summary: parsed.summary || `AI Security Audit scanned ${users.length} accounts. ${flaggedCount} suspicious patterns identified.`,
      accountsScanned: users.length,
      flaggedCount,
      blockedCount,
      flaggedUsers: flaggedUsersList,
      nextScheduledAuditAt: new Date(Date.now() + AUDIT_INTERVAL_MS).toISOString()
    };
  } catch (err) {
    console.warn('Gemini AI call failed, running heuristic AI security inspection:', err);

    // Reliable heuristic fallback analysis
    const flaggedList: AiFlaggedUser[] = [];
    users.forEach(u => {
      let score = 5;
      let reasons: string[] = [];
      let category = 'Clean Profile';

      // Domain inspection
      if (/@(trashmail|tempmail|darknet|dispostable|mailinator)\./i.test(u.email)) {
        score += 45;
        reasons.push('Disposable or suspicious email domain detected');
      }

      // Creation frequency
      const createdCount = u.gamesCreatedCount || 0;
      if (createdCount > 15) {
        score += 40;
        reasons.push(`High upload frequency (${createdCount} games published)`);
        category = 'Creation Flood / Bot Spammer';
      }

      // Bot naming convention
      if (/(bot|spam|hack|1337|temp_user)/i.test(u.username)) {
        score += 25;
        reasons.push('Automated or hostile username pattern');
      }

      score = Math.min(score, 99);
      u.suspiciousScore = score;
      u.lastAiAuditAt = now;

      if (score >= 60) {
        u.isFlagged = true;
        u.flagReason = reasons.join('; ');
        u.aiRiskCategory = category !== 'Clean Profile' ? category : 'Suspicious Behavior';
        u.aiExplanation = reasons.join('. ');

        flaggedList.push({
          userId: u.id,
          username: u.username,
          email: u.email,
          suspiciousScore: score,
          riskCategory: u.aiRiskCategory,
          explanation: u.aiExplanation,
          recommendedAction: score >= 80 ? 'Block Account' : 'Monitor'
        });
      }
    });

    saveUsers();

    report = {
      timestamp: now,
      threatLevel: flaggedList.length >= 2 ? 'HIGH' : flaggedList.length > 0 ? 'MEDIUM' : 'LOW',
      summary: `Automated Hourly AI Security Check scanned ${users.length} registered accounts and identified ${flaggedList.length} suspicious profiles.`,
      accountsScanned: users.length,
      flaggedCount: flaggedList.length,
      blockedCount: users.filter(u => u.isBlocked).length,
      flaggedUsers: flaggedList,
      nextScheduledAuditAt: new Date(Date.now() + AUDIT_INTERVAL_MS).toISOString()
    };
  }

  latestAiAuditReport = report;
  return report;
}

// User endpoints
app.get('/api/users', (req: Request, res: Response) => {
  // Return users with passwords omitted for privacy
  const sanitized = users.map(u => {
    const { password, ...rest } = u as any;
    return rest;
  });
  res.json({ success: true, users: sanitized });
});

// Robust Multi-Account Registration Endpoint
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // Check duplicate
    const exists = users.some(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with that username or email already exists. Please log in or choose a different name.' 
      });
    }

    const newId = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newUser: User = {
      id: newId,
      username: cleanUsername,
      email: cleanEmail,
      password: String(password),
      joinedAt: now,
      lastLoginAt: now,
      gamesPlayed: 0,
      gamesCreatedCount: 0,
      highScores: {},
      savedProgress: {},
      favoriteGameIds: [],
      createdGameIds: [],
      isBlocked: false,
      isFlagged: false,
      suspiciousScore: 0
    };

    users.push(newUser);
    saveUsers();

    const { password: _, ...sanitizedUser } = newUser as any;
    res.status(201).json({ success: true, user: sanitizedUser });
  } catch (err: any) {
    console.error('Error during registration:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Real Account Login Endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/email and password are required.' });
    }

    const query = String(identifier).trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === query || u.username.toLowerCase() === query);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account not found. Please verify your credentials or create a new account.' 
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false, 
        message: `Account suspended: ${user.blockedReason || 'This account has been blocked by an administrator.'}` 
      });
    }

    // Check password if set
    if (user.password && user.password !== String(password)) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    if (!user.password) {
      user.password = String(password); // Set initial password for legacy seeds
    }
    saveUsers();

    const { password: _, ...sanitizedUser } = user as any;
    res.json({ success: true, user: sanitizedUser });
  } catch (err: any) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Save Multi-Account Data (high scores, progress, favorites)
app.post('/api/auth/save-data', (req: Request, res: Response) => {
  try {
    const { userId, highScores, savedProgress, favoriteGameIds, createdGameIds, gamesPlayed } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const user = users.find(u => u.id === userId || u.username.toLowerCase() === userId.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked' });
    }

    if (highScores) user.highScores = { ...user.highScores, ...highScores };
    if (savedProgress) user.savedProgress = { ...user.savedProgress, ...savedProgress };
    if (Array.isArray(favoriteGameIds)) user.favoriteGameIds = favoriteGameIds;
    if (Array.isArray(createdGameIds)) user.createdGameIds = createdGameIds;
    if (typeof gamesPlayed === 'number') user.gamesPlayed = gamesPlayed;

    saveUsers();
    const { password: _, ...sanitizedUser } = user as any;
    res.json({ success: true, user: sanitizedUser });
  } catch (err: any) {
    console.error('Error saving account data:', err);
    res.status(500).json({ success: false, message: 'Server error saving account data.' });
  }
});

// Accounts Data Export / Backup for High-Capacity Archival
app.get('/api/admin/accounts/export', (req: Request, res: Response) => {
  const sanitized = users.map(u => {
    const { password, ...rest } = u as any;
    return rest;
  });
  res.setHeader('Content-Disposition', `attachment; filename="spherestrike_accounts_backup_${Date.now()}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    totalAccounts: sanitized.length,
    users: sanitized
  });
});

// Accounts Data Bulk Import / Restore
app.post('/api/admin/accounts/import', (req: Request, res: Response) => {
  try {
    const importedUsers: User[] = req.body.users || req.body;
    if (!Array.isArray(importedUsers)) {
      return res.status(400).json({ success: false, message: 'Invalid accounts format: expected an array of users' });
    }

    let addedCount = 0;
    let updatedCount = 0;

    importedUsers.forEach(imp => {
      if (!imp.id || !imp.username) return;
      const idx = users.findIndex(u => u.id === imp.id || u.username.toLowerCase() === imp.username.toLowerCase());
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...imp };
        updatedCount++;
      } else {
        users.push({
          ...imp,
          joinedAt: imp.joinedAt || new Date().toISOString(),
          gamesPlayed: imp.gamesPlayed || 0,
          gamesCreatedCount: imp.gamesCreatedCount || 0
        });
        addedCount++;
      }
    });

    saveUsers();
    res.json({ 
      success: true, 
      message: `Successfully imported accounts: ${addedCount} added, ${updatedCount} updated. Total stored: ${users.length}`,
      totalAccounts: users.length 
    });
  } catch (err: any) {
    console.error('Error importing accounts:', err);
    res.status(500).json({ success: false, message: 'Failed to import accounts: ' + err.message });
  }
});

app.post('/api/users', (req: Request, res: Response) => {
  try {
    const body: Partial<User> = req.body;
    if (!body.email || !body.email.includes('@') || !body.username) {
      return res.status(400).json({ success: false, message: 'Real valid email and username are required. No random or placeholder emails permitted.' });
    }

    const email = body.email.toLowerCase().trim();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === email || (u.id && u.id === body.id));

    let userRecord: User;
    if (existingIndex !== -1) {
      userRecord = {
        ...users[existingIndex],
        ...body,
        email,
        username: body.username || users[existingIndex].username
      };
      users[existingIndex] = userRecord;
    } else {
      userRecord = {
        id: body.id || 'user-' + Date.now().toString(36),
        username: body.username,
        email,
        joinedAt: body.joinedAt || new Date().toISOString(),
        gamesPlayed: body.gamesPlayed || 0,
        gamesCreatedCount: body.gamesCreatedCount || 0,
        isBlocked: false,
        isFlagged: false,
        suspiciousScore: 0
      };
      users.push(userRecord);
    }

    saveUsers();
    res.status(201).json({ success: true, user: userRecord });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ success: false, message: 'Server error saving user' });
  }
});

// Block Account Endpoint
app.post('/api/users/:id/block', (req: Request, res: Response) => {
  const userId = req.params.id;
  const reason = req.body.reason || 'Blocked by administrator due to policy violation.';

  const user = users.find(u => u.id === userId || u.username.toLowerCase() === userId.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'User account not found' });
  }

  user.isBlocked = true;
  user.blockedReason = reason;
  user.blockedAt = new Date().toISOString();
  saveUsers();

  res.json({ success: true, message: `Account @${user.username} has been blocked.`, user });
});

// Unblock Account Endpoint
app.post('/api/users/:id/unblock', (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = users.find(u => u.id === userId || u.username.toLowerCase() === userId.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'User account not found' });
  }

  user.isBlocked = false;
  user.blockedReason = undefined;
  user.blockedAt = undefined;
  saveUsers();

  res.json({ success: true, message: `Account @${user.username} has been unblocked.`, user });
});

// Trigger Manual or Hourly AI Security Audit
app.post('/api/admin/ai-security-audit', async (req: Request, res: Response) => {
  try {
    const report = await runAiSecurityAuditCore();
    res.json({ success: true, report });
  } catch (err: any) {
    console.error('Error in AI Security Audit:', err);
    res.status(500).json({ success: false, message: err.message || 'Error running AI Security Audit' });
  }
});

// Get Audit Status & Timer Schedule
app.get('/api/admin/audit-status', (req: Request, res: Response) => {
  const nextScheduledAt = new Date(lastAuditTime + AUDIT_INTERVAL_MS).toISOString();
  res.json({
    success: true,
    report: latestAiAuditReport,
    lastAuditTime: new Date(lastAuditTime).toISOString(),
    nextScheduledAt
  });
});

async function startServer() {
  if (!isProduction) {
    // Mount Vite middlewares for Hot Module Reloading in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Sphere Strike] Server running on http://localhost:${PORT}`);
    
    // Perform initial AI Security Audit scan and start 1-hour background interval
    runAiSecurityAuditCore().then(() => {
      console.log('[Sphere Strike AI Security] Initial AI Security Audit completed.');
    }).catch(err => {
      console.warn('[Sphere Strike AI Security] Initial audit warning:', err);
    });

    setInterval(() => {
      console.log('[Sphere Strike AI Security] Running automated hourly AI Security Audit across all accounts...');
      runAiSecurityAuditCore().catch(err => {
        console.error('[Sphere Strike AI Security] Hourly audit error:', err);
      });
    }, AUDIT_INTERVAL_MS);
  });
}

startServer();
