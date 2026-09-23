import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_GAMES } from './src/data/initialGames';
import { Game } from './src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Allow large game uploads (HTML/Canvas bundles up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-memory store with disk persistence fallback
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'games.json');

let games: Game[] = [];

function loadGames() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      games = JSON.parse(raw);
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

// Initialize games
loadGames();

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

  const { author, text, rating } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'Comment text required' });

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
  });
}

startServer();
