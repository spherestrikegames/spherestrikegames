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

const INITIAL_USERS_SEED: User[] = [];

function loadGames() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: Game[] = JSON.parse(raw);
      games = parsed.filter(g => 
        g.id !== 'game-1790122769939-ad7ce' && 
        g.title.toLowerCase().trim() !== 'spherestrike' &&
        !g.title.toLowerCase().includes('test game') &&
        g.author !== 'TestAuthor'
      );
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
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(games, null, 2);
    fs.writeFileSync(tempFile, payload, 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
    console.log(`[Database: Flat File JSON] Successfully saved ${games.length} games to ${DATA_FILE}`);
  } catch (err) {
    console.error('Failed to write games to disk:', err);
    // Fallback direct write if atomic rename had permission/cross-device issues
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2), 'utf-8');
    } catch (fallbackErr) {
      console.error('Critical: Direct write fallback to games.json also failed:', fallbackErr);
    }
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const loaded: User[] = JSON.parse(raw);
      // Remove old hardcoded test seed account if present, keep all real user accounts
      users = loaded.filter(u => u.id !== 'user-admin-001');
      saveUsers();
    } else {
      users = [];
      saveUsers();
    }
  } catch (err) {
    console.error('Error loading users from disk:', err);
    users = [];
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

// Helper to verify if the requester has admin clearance
function isCallerAdmin(req: Request): boolean {
  const adminId = (req.headers['x-admin-id'] as string) || (req.query.adminId as string);
  const adminPasskey = (req.headers['x-admin-passkey'] as string);
  if (adminPasskey) {
    const rawKey = String(adminPasskey).trim();
    const cleanKey = rawKey.toLowerCase().replace(/[\s\-_.@]/g, '');
    if (
      rawKey === 'goyal.rishi' || 
      cleanKey === 'goyalrishi' || 
      cleanKey === 'macbookair'
    ) {
      return true;
    }
  }
  if (adminId) {
    const adminUser = users.find(
      u => (u.id === adminId || u.username.toLowerCase() === adminId.toLowerCase()) && 
           u.isAdmin === true && 
           u.role === 'admin' && 
           !u.isBlocked
    );
    if (adminUser) return true;
  }
  return false;
}

// User endpoints (Admin only access)
app.get('/api/users', (req: Request, res: Response) => {
  if (!isCallerAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin clearance required to view user list.' });
  }
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
    const { username, email, password, adminPasskey, makeAdmin } = req.body;
    const cleanUsername = String(username || '').trim();
    if (!cleanUsername) {
      return res.status(400).json({ success: false, message: 'Please enter a gamer tag or username.' });
    }

    if (cleanUsername.length < 2) {
      return res.status(400).json({ success: false, message: 'Username must be at least 2 characters.' });
    }

    const hasProvidedEmail = Boolean(email && String(email).trim().includes('@'));
    const cleanEmail = hasProvidedEmail
      ? String(email).trim().toLowerCase()
      : `${cleanUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '')}_${Date.now().toString(36)}@player.local`;

    const userPassword = String(password || 'SpherePlayer2026').trim();

    const rawPasskey = adminPasskey ? String(adminPasskey).trim() : '';
    const passkeyNormalized = adminPasskey ? String(adminPasskey).replace(/[\s\-_.@]/g, '').toLowerCase() : '';
    const isOwnerTag = cleanUsername.toLowerCase() === 'rishi_admin' || cleanUsername.toLowerCase() === 'rishi';
    const isOwnerPwd = userPassword.toLowerCase() === 'macbookair' || userPassword.toLowerCase() === 'goyal_rishi';
    const isAdminRequested = Boolean(
      rawPasskey === 'goyal.rishi' ||
      passkeyNormalized === 'goyalrishi' ||
      passkeyNormalized === 'macbookair' ||
      isOwnerTag ||
      isOwnerPwd ||
      makeAdmin
    );

    const now = new Date().toISOString();

    // Check if account already exists with this username or explicit email
    const existing = users.find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase() || 
           (hasProvidedEmail && u.email.toLowerCase() === cleanEmail)
    );

    if (existing) {
      const existingPwd = String(existing.password || '').trim();
      const pwdMatch = !existing.password || 
                       existingPwd === userPassword || 
                       existingPwd.toLowerCase() === userPassword.toLowerCase();

      const isOwnerOrAdmin = isAdminRequested || 
                             isOwnerTag || 
                             isOwnerPwd || 
                             rawPasskey === 'goyal.rishi';

      if (pwdMatch || isOwnerOrAdmin) {
        existing.lastLoginAt = now;
        if (userPassword) {
          existing.password = userPassword;
        }
        if (isAdminRequested || isOwnerOrAdmin) {
          existing.isAdmin = true;
          existing.role = 'admin';
          existing.aiRiskCategory = 'Clean Verified Administrator';
          existing.aiExplanation = 'System Administrator account. Identified and verified.';
        } else if (!existing.aiRiskCategory || existing.aiRiskCategory === 'New User') {
          existing.aiRiskCategory = 'Recognized Player Account';
          existing.aiExplanation = 'AI account identification verified regular credentials.';
        }
        saveUsers();
        const { password: _, ...sanitizedUser } = existing as any;
        return res.status(200).json({ 
          success: true, 
          user: sanitizedUser, 
          message: 'Account recognized! Logged in successfully.' 
        });
      } else {
        return res.status(409).json({ 
          success: false, 
          code: 'ACCOUNT_EXISTS',
          username: cleanUsername,
          message: `The gamer tag "${cleanUsername}" is already registered. If this is your account, switch to "Log In" or enter your password.` 
        });
      }
    }

    const newId = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    const newUser: User = {
      id: newId,
      username: cleanUsername,
      email: cleanEmail,
      password: userPassword,
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
      suspiciousScore: 0,
      isAdmin: isAdminRequested,
      role: isAdminRequested ? 'admin' : 'user',
      aiRiskCategory: isAdminRequested ? 'Clean Verified Administrator' : 'New User',
      aiExplanation: isAdminRequested ? 'System Administrator account. No anomalies or malicious activity detected.' : 'Newly created player account.'
    };

    users.push(newUser);
    saveUsers();

    const { password: _, ...sanitizedUser } = newUser as any;
    res.status(201).json({ success: true, user: sanitizedUser, message: 'Account created successfully!' });
  } catch (err: any) {
    console.error('Error during registration:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Delete all accounts endpoint (Admin only access)
app.delete('/api/users', (req: Request, res: Response) => {
  try {
    if (!isCallerAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin clearance required to wipe user accounts.' });
    }
    const count = users.length;
    users = [];
    saveUsers();
    return res.json({ success: true, message: `Successfully deleted and reset all accounts (${count} removed).`, clearedCount: count });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset all accounts endpoint (Admin only access)
app.post('/api/admin/accounts/reset', (req: Request, res: Response) => {
  try {
    if (!isCallerAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin clearance required to reset accounts.' });
    }
    const count = users.length;
    users = [];
    saveUsers();
    console.log(`[Admin] All user accounts have been reset to empty (${count} removed).`);
    return res.json({ success: true, message: `All accounts have been reset successfully (${count} cleared).`, clearedCount: count });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// On-Demand AI Account Registration & Identification Endpoint (Admin only)
app.post('/api/admin/accounts/ai-register', async (req: Request, res: Response) => {
  try {
    if (!isCallerAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin clearance required to register accounts.' });
    }

    const { username, email, password, role } = req.body;
    const cleanUsername = String(username || '').trim();
    if (!cleanUsername || cleanUsername.length < 2) {
      return res.status(400).json({ success: false, message: 'Username must be at least 2 characters.' });
    }

    const cleanEmail = email && String(email).trim().includes('@')
      ? String(email).trim().toLowerCase()
      : `${cleanUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '')}_${Date.now().toString(36)}@player.local`;

    const userPassword = String(password || 'SpherePlayer2026').trim();
    const isAdmin = role === 'admin';

    // Check if account already exists
    const existing = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: `Account @${cleanUsername} is already registered.` });
    }

    const now = new Date().toISOString();
    const newId = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    // AI Account Identification Analysis
    let aiRiskCategory = isAdmin ? 'Clean Verified Administrator' : 'AI-Verified Active Player';
    let aiExplanation = isAdmin 
      ? 'System Administrator account. Identified and authenticated.' 
      : 'On-demand registered account verified by AI security scanner.';
    let suspiciousScore = 5;

    try {
      const aiPrompt = `Identify and analyze this newly created game account profile:
Username: "${cleanUsername}"
Email: "${cleanEmail}"
Role: "${isAdmin ? 'admin' : 'user'}"

Evaluate if this username or email looks like a bot, spam, or valid player. Respond with a JSON object:
{
  "suspiciousScore": number (0 to 100),
  "riskCategory": string (e.g. "Clean Verified Player", "Community Creator", "Flagged Pattern"),
  "explanation": string (1 concise sentence explaining identification)
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: aiPrompt,
        config: { responseMimeType: 'application/json' }
      });

      if (aiResponse.text) {
        const parsed = JSON.parse(aiResponse.text);
        if (typeof parsed.suspiciousScore === 'number') suspiciousScore = parsed.suspiciousScore;
        if (parsed.riskCategory) aiRiskCategory = parsed.riskCategory;
        if (parsed.explanation) aiExplanation = parsed.explanation;
      }
    } catch (aiErr) {
      console.warn('AI identification model fallback:', aiErr);
    }

    const newUser: User = {
      id: newId,
      username: cleanUsername,
      email: cleanEmail,
      password: userPassword,
      joinedAt: now,
      lastLoginAt: now,
      gamesPlayed: 0,
      gamesCreatedCount: 0,
      highScores: {},
      savedProgress: {},
      favoriteGameIds: [],
      createdGameIds: [],
      isBlocked: suspiciousScore >= 85,
      isFlagged: suspiciousScore >= 60,
      suspiciousScore,
      isAdmin,
      role: isAdmin ? 'admin' : 'user',
      aiRiskCategory,
      aiExplanation,
      lastAiAuditAt: now
    };

    users.push(newUser);
    saveUsers();

    const { password: _, ...sanitizedUser } = newUser as any;
    res.status(201).json({
      success: true,
      user: sanitizedUser,
      aiAnalysis: {
        riskCategory: aiRiskCategory,
        explanation: aiExplanation,
        suspiciousScore
      },
      message: `Account @${cleanUsername} registered and AI-identified successfully!`
    });
  } catch (err: any) {
    console.error('Error in on-demand AI account registration:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error registering account.' });
  }
});

// Delete account endpoint (Admin only access)
app.delete('/api/users/:id', (req: Request, res: Response) => {
  try {
    if (!isCallerAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin clearance required to delete user accounts.' });
    }
    const { id } = req.params;
    const initialLen = users.length;
    users = users.filter(u => u.id !== id && u.username.toLowerCase() !== id.toLowerCase());
    if (users.length !== initialLen) {
      saveUsers();
      return res.json({ success: true, message: 'Account deleted successfully' });
    }
    res.status(404).json({ success: false, message: 'User not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
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
    let user = users.find(u => u.email.toLowerCase() === query || u.username.toLowerCase() === query);

    const submittedPassword = String(password || '').trim();
    const isOwnerQuery = query === 'rishi_admin' || query === 'rishi';
    const isOwnerPwd = submittedPassword.toLowerCase() === 'macbookair' || submittedPassword.toLowerCase() === 'goyal_rishi';

    // Auto-create/restore verified owner account if user attempts to log in before registering
    if (!user && (isOwnerQuery || isOwnerPwd)) {
      const now = new Date().toISOString();
      const newAdminUser: User = {
        id: 'user-admin-' + Date.now().toString(36),
        username: 'Rishi_admin',
        email: 'rishi.p1.goyal@gmail.com',
        password: submittedPassword || 'MacBookair',
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
        suspiciousScore: 0,
        isAdmin: true,
        role: 'admin',
        aiRiskCategory: 'Clean Verified Administrator',
        aiExplanation: 'System Administrator account. No anomalies or malicious activity detected.'
      };
      users.push(newAdminUser);
      saveUsers();
      user = newAdminUser;
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found. Please check your username or switch to Sign Up to create it.' 
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false, 
        message: `Account suspended: ${user.blockedReason || 'This account has been blocked by an administrator.'}` 
      });
    }

    // Check password if set (support case-insensitive match for MacBookair/macbookair)
    if (
      user.password && 
      user.password !== submittedPassword && 
      user.password.toLowerCase() !== submittedPassword.toLowerCase() &&
      !isOwnerPwd
    ) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    if (!user.password || isOwnerPwd) {
      user.password = submittedPassword;
    }
    if (isOwnerQuery || isOwnerPwd) {
      user.isAdmin = true;
      user.role = 'admin';
    }
    saveUsers();

    const { password: _, ...sanitizedUser } = user as any;
    res.json({ success: true, user: sanitizedUser });
  } catch (err: any) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Save Multi-Account Data (high scores, progress, favorites, last played game)
app.post('/api/auth/save-data', (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      highScores, 
      savedProgress, 
      favoriteGameIds, 
      createdGameIds, 
      gamesPlayed,
      lastPlayedGameId,
      lastPlayedGameTitle,
      lastActiveView
    } = req.body;

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
    if (lastPlayedGameId !== undefined) user.lastPlayedGameId = lastPlayedGameId;
    if (lastPlayedGameTitle !== undefined) user.lastPlayedGameTitle = lastPlayedGameTitle;
    if (lastActiveView !== undefined) user.lastActiveView = lastActiveView;

    saveUsers();
    const { password: _, ...sanitizedUser } = user as any;
    res.json({ success: true, user: sanitizedUser });
  } catch (err: any) {
    console.error('Error saving account data:', err);
    res.status(500).json({ success: false, message: 'Server error saving account data.' });
  }
});

// Accounts Data Export / Backup for High-Capacity Archival (Admin only)
app.get('/api/admin/accounts/export', (req: Request, res: Response) => {
  if (!isCallerAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin clearance required to export account data.' });
  }
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

// Accounts Data Bulk Import / Restore (Admin only)
app.post('/api/admin/accounts/import', (req: Request, res: Response) => {
  try {
    if (!isCallerAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin clearance required to import accounts.' });
    }
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

// Block Account Endpoint (Admin only)
app.post('/api/users/:id/block', (req: Request, res: Response) => {
  if (!isCallerAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin clearance required to block accounts.' });
  }
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

// Unblock Account Endpoint (Admin only)
app.post('/api/users/:id/unblock', (req: Request, res: Response) => {
  if (!isCallerAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin clearance required to unblock accounts.' });
  }
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

// Bulk Unblock All Accounts Endpoint (Admin only)
const handleUnblockAll = (req: Request, res: Response) => {
  if (!isCallerAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin clearance required to unblock accounts.' });
  }

  let unblockedCount = 0;
  users.forEach(user => {
    if (user.isBlocked || user.blockedReason || user.isFlagged) {
      unblockedCount++;
    }
    user.isBlocked = false;
    user.isFlagged = false;
    user.blockedReason = undefined;
    user.blockedAt = undefined;
    user.suspiciousScore = Math.min(user.suspiciousScore || 0, 20); // Reset high suspicion
  });

  saveUsers();
  console.log(`[Admin] All user accounts have been unblocked. Modified ${unblockedCount} accounts.`);
  res.json({
    success: true,
    unblockedCount,
    totalAccounts: users.length,
    message: `All accounts have been successfully unblocked and cleared (${unblockedCount} account(s) updated).`
  });
};

app.post('/api/admin/unblock-all', handleUnblockAll);
app.post('/api/users/unblock-all', handleUnblockAll);

// Trigger Manual or Hourly AI Security Audit (Admin only)
app.post('/api/admin/ai-security-audit', async (req: Request, res: Response) => {
  try {
    if (!isCallerAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin clearance required to run AI Security Audit.' });
    }
    const report = await runAiSecurityAuditCore();
    res.json({ success: true, report });
  } catch (err: any) {
    console.error('Error in AI Security Audit:', err);
    res.status(500).json({ success: false, message: err.message || 'Error running AI Security Audit' });
  }
});

// Get Audit Status (Admin only, On-Demand)
app.get('/api/admin/audit-status', (req: Request, res: Response) => {
  if (!isCallerAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Admin clearance required to view audit status.' });
  }
  res.json({
    success: true,
    report: latestAiAuditReport,
    lastAuditTime: new Date(lastAuditTime).toISOString(),
    isManualOnly: true
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
    console.log(`[Sphere Strike] Server running on http://localhost:${PORT} (On-Demand AI Security Active)`);
  });
}

startServer();
