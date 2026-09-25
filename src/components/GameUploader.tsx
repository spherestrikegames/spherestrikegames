import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle2, Globe, Link as LinkIcon, 
  Code2, Sliders, ChevronDown, ChevronUp, RefreshCw, 
  Sparkles, Flame, Star, Tv, Zap, ExternalLink, Play,
  AlertCircle, Image as ImageIcon, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { Game, GameGenre } from '../types/game';
import { User } from '../types/user';
import { createGame, updateGame } from '../utils/api';
import { addMyCreatedGameId } from '../utils/myGames';
import { FrontPageCover, FRONT_PAGE_THEMES } from './FrontPageCover';
import { LogIn, UserPlus, Lock } from 'lucide-react';
import { validateGameCode, escapeHtml } from '../utils/codeShield';

interface GameUploaderProps {
  onClose: () => void;
  onGameSaved: (game: Game) => void;
  initialGameToUpdate?: Game | null;
  currentUser?: User | null;
  isAdmin?: boolean;
  onRequireAuth?: () => void;
}

const GAME_TEMPLATES = [
  {
    id: 'retro-dodge',
    name: 'Cosmic Dodge',
    genre: 'Arcade' as GameGenre,
    description: 'Dodge descending asteroids using arrow keys. Survive as long as you can!',
    defaultControls: [
      { key: 'Arrow Left / Right', action: 'Move Spaceship' },
      { key: 'Spacebar', action: 'Hyperspeed Boost' }
    ],
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #030712; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: #fff; }
    canvas { background: #0b0f19; border: 1px solid #1e293b; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  </style>
</head>
<body>
  <canvas id="c" width="480" height="400"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let shipX = 220;
    let score = 0;
    let gameOver = false;
    let meteors = [];
    const keys = {};

    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);

    function spawnMeteor() {
      meteors.push({ x: Math.random() * 450, y: -20, r: 12 + Math.random() * 10, speed: 2 + Math.random() * 3 });
    }
    setInterval(spawnMeteor, 600);

    function loop() {
      if (!gameOver) {
        if (keys['ArrowLeft'] && shipX > 20) shipX -= 5;
        if (keys['ArrowRight'] && shipX < 440) shipX += 5;

        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 480, 400);

        // Player ship
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(shipX, 360);
        ctx.lineTo(shipX - 15, 385);
        ctx.lineTo(shipX + 15, 385);
        ctx.closePath();
        ctx.fill();

        // Meteors
        ctx.fillStyle = '#ef4444';
        for (let i = 0; i < meteors.length; i++) {
          let m = meteors[i];
          m.y += m.speed;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();

          // Collision
          let dist = Math.hypot(m.x - shipX, m.y - 370);
          if (dist < m.r + 12) {
            gameOver = true;
          }
        }
        meteors = meteors.filter(m => m.y < 420);
        score++;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText('SCORE: ' + score, 15, 25);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, 480, 400);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 240, 190);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('Final Score: ' + score, 240, 220);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Press SPACE to restart', 240, 250);
        if (keys['Space']) {
          gameOver = false;
          score = 0;
          meteors = [];
          shipX = 220;
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`
  },
  {
    id: 'brick-breaker',
    name: 'Neon Breaker',
    genre: 'Arcade' as GameGenre,
    description: 'Bounce the sphere and shatter all blocks with precision paddle reflexes.',
    defaultControls: [
      { key: 'Mouse Movement', action: 'Control Paddle' },
      { key: 'Click', action: 'Launch Ball' }
    ],
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #030712; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
    canvas { background: #0f172a; border: 1px solid #334155; border-radius: 8px; }
  </style>
</head>
<body>
  <canvas id="b" width="480" height="400"></canvas>
  <script>
    const canvas = document.getElementById('b');
    const ctx = canvas.getContext('2d');
    let paddleX = 190;
    let ballX = 240, ballY = 300, dx = 3, dy = -3;
    let bricks = [];
    const rows = 4, cols = 7;
    for(let r=0; r<rows; r++){
      for(let c=0; c<cols; c++){
        bricks.push({ x: 35 + c*60, y: 40 + r*25, w: 50, h: 18, alive: true });
      }
    }
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      paddleX = e.clientX - rect.left - 45;
    });

    function draw() {
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0,0,480,400);

      // Paddle
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(paddleX, 370, 90, 10);

      // Ball
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 7, 0, Math.PI*2);
      ctx.fill();

      ballX += dx; ballY += dy;
      if(ballX < 7 || ballX > 473) dx = -dx;
      if(ballY < 7) dy = -dy;
      if(ballY > 363 && ballX > paddleX && ballX < paddleX + 90) dy = -Math.abs(dy);
      if(ballY > 400) { ballX = 240; ballY = 250; dy = -3; }

      // Bricks
      let anyLeft = false;
      for(let b of bricks){
        if(b.alive){
          anyLeft = true;
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(b.x, b.y, b.w, b.h);
          if(ballX > b.x && ballX < b.x + b.w && ballY > b.y && ballY < b.y + b.h){
            b.alive = false;
            dy = -dy;
          }
        }
      }
      if(!anyLeft){
        ctx.fillStyle = '#22c55e';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEARED!', 240, 200);
      }
      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>`
  },
  {
    id: 'pure-js-particles',
    name: 'Neon Kinetic Sparks (Pure JS)',
    genre: 'Action' as GameGenre,
    description: 'Interactive magnetic particle physics engine built using pure JavaScript.',
    defaultControls: [
      { key: 'Mouse Move', action: 'Gravitational Pull' },
      { key: 'Mouse Click / Hold', action: 'Energy Implosion' }
    ],
    code: `// Pure JavaScript Game Code (Automatically runs on canvas)
var particles = [];
for (var i = 0; i < 90; i++) {
  particles.push({
    x: Math.random() * 800,
    y: Math.random() * 600,
    vx: (Math.random() - 0.5) * 3,
    vy: (Math.random() - 0.5) * 3,
    color: 'hsl(' + (Math.random() * 360) + ', 90%, 65%)'
  });
}

var mouse = { x: 400, y: 300, down: false };
canvas.addEventListener('mousemove', function(e) {
  var r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (800 / r.width);
  mouse.y = (e.clientY - r.top) * (600 / r.height);
});
canvas.addEventListener('mousedown', function() { mouse.down = true; });
canvas.addEventListener('mouseup', function() { mouse.down = false; });

function loop() {
  ctx.fillStyle = 'rgba(9, 13, 22, 0.22)';
  ctx.fillRect(0, 0, 800, 600);

  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > 800) p.vx = -p.vx;
    if (p.y < 0 || p.y > 600) p.vy = -p.vy;

    var dx = mouse.x - p.x;
    var dy = mouse.y - p.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 220 && dist > 2) {
      var force = (mouse.down ? 5.5 : 1.2) / dist;
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;
    }

    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, mouse.down ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#38bdf8';
  ctx.font = '14px sans-serif';
  ctx.fillText('MOVE MOUSE TO PULL • CLICK TO IMPLODE', 20, 32);

  requestAnimationFrame(loop);
}
loop();`
  }
];

export const GameUploader: React.FC<GameUploaderProps> = ({
  onClose,
  onGameSaved,
  initialGameToUpdate,
  currentUser,
  isAdmin = false,
  onRequireAuth,
}) => {
  const isUpdating = Boolean(initialGameToUpdate);

  // Upload Method State
  const [method, setMethod] = useState<'link' | 'file' | 'code'>(() => {
    if (initialGameToUpdate?.embedUrl) return 'link';
    if (initialGameToUpdate && !initialGameToUpdate.embedUrl) return 'code';
    return 'link';
  });

  // Core Game Fields
  const [title, setTitle] = useState<string>(initialGameToUpdate?.title || '');
  const [description, setDescription] = useState<string>(initialGameToUpdate?.description || '');
  const [gameLink, setGameLink] = useState<string>(initialGameToUpdate?.embedUrl || '');
  const [genre, setGenre] = useState<GameGenre>(initialGameToUpdate?.genre || 'Action');
  const [author, setAuthor] = useState<string>(initialGameToUpdate?.author || currentUser?.username || '');
  const [version, setVersion] = useState<string>(
    initialGameToUpdate 
      ? `1.${initialGameToUpdate.versions.length}.0`
      : '1.0.0'
  );
  const [changelog, setChangelog] = useState<string>('');

  // Front Page / Cover Artwork State
  const [coverMode, setCoverMode] = useState<'upload' | 'url' | 'designer'>(
    initialGameToUpdate?.coverImage ? 'url' : 'upload'
  );
  const [coverImage, setCoverImage] = useState<string>(initialGameToUpdate?.coverImage || '');
  const [selectedBadge, setSelectedBadge] = useState<'hot' | 'update' | 'new' | 'star' | 'stream' | 'none'>(
    initialGameToUpdate?.badge || 'new'
  );
  const [selectedTheme, setSelectedTheme] = useState<string>('sky-rush');
  const [selectedIcon, setSelectedIcon] = useState<string>('Gamepad2');

  // Preview Mode in Right Column
  const [previewTab, setPreviewTab] = useState<'frontpage' | 'sandbox'>('frontpage');

  // Sandbox generated message & code editor toggle
  const [sandboxGeneratedMsg, setSandboxGeneratedMsg] = useState<string>('');
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(true);

  // Advanced fields
  const [tagsInput, setTagsInput] = useState<string>(
    initialGameToUpdate?.tags.join(', ') || 'Web, Indie, HTML5'
  );
  const [controlsInput, setControlsInput] = useState<string>(
    initialGameToUpdate?.controls.map(c => `${c.key}:${c.action}`).join('\n') || 
    'Mouse / Arrow Keys:Move & Aim\nSpace / Left Click:Action'
  );
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Code / File state for secondary modes
  const [gameCode, setGameCode] = useState<string>(
    initialGameToUpdate?.code || GAME_TEMPLATES[0].code
  );
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Real-time pure code validation & crash shield analysis
  const codeSafety = useMemo(() => {
    if (method !== 'code') return null;
    return validateGameCode(gameCode);
  }, [method, gameCode]);

  // Clean URL helper
  const cleanUrl = (input: string): string => {
    let raw = input.trim();
    if (!raw) return '';
    const iframeMatch = raw.match(/src=["']([^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) {
      raw = iframeMatch[1].trim();
    }
    if (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('//')) {
      raw = 'https://' + raw;
    }
    return raw;
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanUrl(e.target.value);
    setGameLink(cleaned);
  };

  // Image file handler
  const handleImageFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCoverImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle HTML file upload and auto-generate sandbox
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setGameCode(content);
        if (!title) {
          const match = content.match(/<title>([^<]+)<\/title>/i);
          if (match && match[1]) setTitle(match[1]);
          else setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
        if (!description) {
          setDescription('Playable browser game generated in Sphere Strike Sandbox.');
        }
        setPreviewTab('sandbox');
        setPreviewKey(prev => prev + 1);
        setSandboxGeneratedMsg(`⚡ "${file.name}" uploaded and generated in Sandbox!`);
      }
    };
    reader.readAsText(file);
  };

  // Handle template selection and generate sandbox
  const handleSelectTemplate = (templateId: string) => {
    const tmpl = GAME_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setGameCode(tmpl.code);
      if (!title) setTitle(tmpl.name);
      if (!description) setDescription(tmpl.description);
      setGenre(tmpl.genre);
      setControlsInput(tmpl.defaultControls.map(c => `${c.key}:${c.action}`).join('\n'));
      setPreviewTab('sandbox');
      setPreviewKey(prev => prev + 1);
      setSandboxGeneratedMsg(`⚡ Template "${tmpl.name}" generated in Sandbox!`);
    }
  };

  // Sample links
  const sampleLinks = [
    { name: 'Itch.io HTML5 Game', url: 'https://v6p9d9t4.ssl.hwcdn.net/html/10129759/index.html' },
    { name: 'Canvas Asteroids', url: 'https://dougmcinnes.com/html-5-asteroids/' },
    { name: '2048 Web Game', url: 'https://play2048.co/' }
  ];

  // Submit and Publish
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (!title.trim()) {
      alert('Please enter a name for your game.');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a short description for your game.');
      return;
    }

    if (method === 'link' && !gameLink.trim()) {
      alert('Please provide a valid game link or URL.');
      return;
    }

    if (method !== 'link' && !gameCode.trim()) {
      alert('Please enter or upload your game code.');
      return;
    }

    let preparedCode = gameCode;
    if (method === 'code') {
      const safetyResult = validateGameCode(gameCode);
      if (!safetyResult.isValid) {
        alert('Cannot publish game: Crash Shield Hazard Detected\n\n' + safetyResult.errors.join('\n\n') + '\n\nPlease fix the infinite loop or hazardous pattern before publishing so players can enjoy your game without freezing.');
        return;
      }
      preparedCode = safetyResult.preparedCode;
    }

    if (!coverImage || !coverImage.trim()) {
      alert('Please upload your game front cover image before publishing.');
      return;
    }

    setIsSubmitting(true);

    const parsedControls = controlsInput
      .split('\n')
      .map(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          return { key: parts[0].trim(), action: parts.slice(1).join(':').trim() };
        }
        return { key: 'Key', action: line.trim() };
      })
      .filter(c => c.action);

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const effectiveEmbedUrl = method === 'link' ? cleanUrl(gameLink) : undefined;
    const effectiveCode = effectiveEmbedUrl 
      ? `<iframe src="${effectiveEmbedUrl}" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>`
      : preparedCode;

    // Use uploaded image, or image URL, or leave blank to use designed front page
    const effectiveCoverImage = coverImage.trim() || undefined;

    try {
      if (isUpdating && initialGameToUpdate) {
        const updated = await updateGame(initialGameToUpdate.id, {
          title: title.trim(),
          description: description.trim() || 'A community web game.',
          genre,
          tags: parsedTags,
          version,
          changelog: changelog || 'Updated version uploaded.',
          code: effectiveCode,
          embedUrl: effectiveEmbedUrl,
          coverImage: effectiveCoverImage,
          badge: selectedBadge,
          type: effectiveEmbedUrl ? 'embed' : 'html5',
          author: author.trim() || initialGameToUpdate.author,
          controls: parsedControls.length > 0 ? parsedControls : initialGameToUpdate.controls,
        });
        addMyCreatedGameId(updated.id);
        onGameSaved(updated);
      } else {
        const created = await createGame({
          title: title.trim(),
          description: description.trim() || 'A community-crafted web game.',
          genre,
          tags: parsedTags.length > 0 ? parsedTags : ['Indie', 'Web'],
          author: author.trim() || currentUser?.username || 'Sphere Creator',
          version: version || '1.0.0',
          changelog: changelog || 'Initial public release.',
          code: effectiveCode,
          embedUrl: effectiveEmbedUrl,
          coverImage: effectiveCoverImage,
          badge: selectedBadge,
          type: effectiveEmbedUrl ? 'embed' : 'html5',
          thumbnailGradient: 'from-blue-950 via-slate-900 to-black',
          accentColor: '#3b82f6',
          iconName: selectedIcon,
          controls: parsedControls.length > 0 ? parsedControls : [{ key: 'Mouse & Keys', action: 'Standard Game Controls' }],
        });
        addMyCreatedGameId(created.id);
        onGameSaved(created);
      }
    } catch (err) {
      console.error('Failed to save game', err);
      alert('Failed to upload game. Please check your inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>{isUpdating ? `Update Game: ${initialGameToUpdate?.title}` : 'Upload & Publish Game'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set up your game's name, description, link, and front page cover art to publish it to the arcade!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white border border-white/[0.06] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || (method === 'link' && !gameLink.trim())}
            className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-950 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isUpdating ? 'Publish Update' : 'Publish & Play Now'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Method Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] w-fit">
        <button
          type="button"
          onClick={() => setMethod('link')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            method === 'link'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Game Link (URL)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMethod('code');
            setPreviewTab('sandbox');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            method === 'code'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Pure Code (HTML5 / JS)</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl glass-panel border border-white/[0.08] space-y-5">
            {/* Primary Field 1: Game Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Game Name</span>
                <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Roller Coaster Rush, Space Odyssey, Pixel Dungeon..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-blue-500 focus:bg-white/[0.07] text-white text-sm focus:outline-none transition-all font-['Outfit'] font-semibold"
                required
              />
            </div>

            {/* Primary Field 2: Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Game Description</span>
                <span className="text-blue-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe gameplay, controls, story, and why players will love your game..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-blue-500 focus:bg-white/[0.07] text-white text-xs focus:outline-none transition-all leading-relaxed"
                required
              />
            </div>

            {/* Primary Field 3: Link to your game (Method: LINK) */}
            {method === 'link' && (
              <div className="space-y-2 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Link to Your Game (URL)</span>
                    <span className="text-blue-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Embed or direct web URL</span>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={gameLink}
                    onChange={handleLinkChange}
                    placeholder="https://itch.io/embed/... or https://your-game.vercel.app"
                    className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-black/40 border border-white/[0.12] focus:border-blue-500 text-white text-xs font-mono focus:outline-none transition-all"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  
                  {gameLink && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewKey(prev => prev + 1);
                        setPreviewTab('sandbox');
                      }}
                      className="absolute right-2 top-1.5 px-2.5 py-1 text-[11px] font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      Test Game
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <p>
                    Paste any link to your playable game. When published, clicking your game card opens and plays it instantly!
                  </p>
                  
                  {/* Quick test sample links */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-slate-400">Try sample game link:</span>
                    {sampleLinks.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => {
                          setGameLink(s.url);
                          if (!title) setTitle(s.name);
                          if (!description) setDescription('High-octane free browser game.');
                          setPreviewKey(prev => prev + 1);
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30 cursor-pointer"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Method: PURE CODE & SANDBOX (Write or paste code with crash protection) */}
            {method === 'code' && (
              <div className="space-y-4 p-5 rounded-2xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span>Pure Code Game Engine (HTML5 / Pure JavaScript)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Input your pure game code. Full HTML5 documents or raw JavaScript canvas scripts are automatically compiled into responsive playable games.
                    </p>
                  </div>
                  {codeSafety?.isValid ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Crash Shield: Safe</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Crash Hazard Detected</span>
                    </span>
                  )}
                </div>

                {/* Real-time Crash Shield Hazard Alert Banner */}
                {codeSafety && !codeSafety.isValid && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2 text-rose-200">
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-400">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>Crash Protection Alert — Publishing Blocked</span>
                    </div>
                    <ul className="text-xs list-disc list-inside space-y-1 text-rose-300/90 font-mono">
                      {codeSafety.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-lg border border-white/[0.06] leading-relaxed">
                      💡 <strong>Safe Coding Tip:</strong> Browser games must yield control to the browser each frame. Replace synchronous loops like <code className="text-rose-300 font-mono">while(true)</code> with <code className="text-emerald-300 font-mono">requestAnimationFrame(gameLoop)</code> so your game runs at 60 FPS smoothly without freezing the browser!
                    </p>
                  </div>
                )}

                {/* Status banner when generated or loaded */}
                {sandboxGeneratedMsg && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{sandboxGeneratedMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewTab('sandbox');
                        setPreviewKey(prev => prev + 1);
                      }}
                      className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      View Live Game
                    </button>
                  </div>
                )}

                {/* Direct Pure Code Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>Source Code</span>
                      <span className="text-[10px] text-slate-400 font-mono">HTML5 / JavaScript</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTab('sandbox');
                          setPreviewKey(prev => prev + 1);
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run & Test Code</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={gameCode}
                    onChange={(e) => {
                      setGameCode(e.target.value);
                      setPreviewKey(prev => prev + 1);
                    }}
                    rows={11}
                    className="w-full p-3 font-mono text-xs bg-slate-950 border border-white/[0.1] rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed tracking-wide"
                    placeholder="Enter or paste pure HTML5 or pure JavaScript (e.g. canvas drawing, event listeners, requestAnimationFrame game loops)..."
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Type or paste pure code. Code edits compile to the live preview automatically.</span>
                    <span>{gameCode.length.toLocaleString()} characters</span>
                  </div>
                </div>

                {/* Preset Templates */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Load Preset Template:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GAME_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl.id)}
                        className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-blue-500/40 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-blue-300">
                            ⚡ {tmpl.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
                            {tmpl.genre}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {tmpl.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or Upload Code File (.html, .htm, .js, .txt) */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`p-4 border border-dashed rounded-xl text-center space-y-2 transition-all ${
                    dragOver 
                      ? 'border-blue-400 bg-blue-950/40' 
                      : 'border-white/[0.1] bg-black/30 hover:border-white/[0.2]'
                  }`}
                >
                  <p className="text-xs text-slate-300">
                    Prefer uploading a file? Drop or select any <code className="text-blue-400 font-mono">.html</code> or <code className="text-blue-400 font-mono">.js</code> code file.
                  </p>
                  <div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-semibold text-xs rounded-lg cursor-pointer transition-colors border border-white/[0.08]">
                      <Upload className="w-3 h-3 text-blue-400" />
                      <span>Select Code File</span>
                      <input
                        type="file"
                        accept=".html,.htm,.js,.txt"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Field 4: Game Front Cover Poster (MANDATORY) */}
            <div className="space-y-3 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Game Front Cover Poster</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono text-amber-300 bg-amber-950/80 border border-amber-500/40 rounded-full font-bold">
                      REQUIRED
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    You must upload your game's front cover poster. It is displayed on all main screen cards and player headers.
                  </p>
                </div>
                {coverImage && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cover Ready
                  </span>
                )}
              </div>

              {/* Requirement reminder banner if not yet provided */}
              {!coverImage && (
                <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Front cover is required to publish. Please upload your game front cover poster below.</span>
                </div>
              )}

              {/* Cover Mode Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.06] text-xs w-fit">
                <button
                  type="button"
                  onClick={() => setCoverMode('upload')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    coverMode === 'upload' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload Cover File
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode('url')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    coverMode === 'url' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paste Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode('designer')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    coverMode === 'designer' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Front Page Studio
                </button>
              </div>

              {/* Front Page Mode: UPLOAD (Primary & Required) */}
              {coverMode === 'upload' && (
                <div className="space-y-3 pt-1">
                  <div className="p-5 border-2 border-dashed border-white/[0.14] hover:border-blue-500/50 rounded-xl bg-black/40 text-center space-y-2.5 transition-colors">
                    <ImageIcon className="w-7 h-7 text-blue-400 mx-auto" />
                    <div>
                      <p className="text-xs font-semibold text-white">Upload your game's front cover poster</p>
                      <p className="text-[11px] text-slate-400">PNG, JPG, or WebP. 16:9 or 16:10 aspect ratio recommended.</p>
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-md">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{coverImage ? 'Replace Cover Poster' : 'Browse Front Cover Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {coverImage && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={coverImage} 
                          alt="Cover thumbnail" 
                          className="w-12 h-8 rounded-lg object-cover border border-emerald-500/40" 
                        />
                        <span className="font-medium">Front cover uploaded & ready for publishing!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Front Page Mode: URL */}
              {coverMode === 'url' && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... or https://i.imgur.com/your-poster.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.12] focus:border-blue-500 text-white text-xs font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Paste any public image URL for your game poster.
                  </p>
                </div>
              )}

              {/* Front Page Mode: DESIGNER */}
              {coverMode === 'designer' && (
                <div className="space-y-3 pt-1">
                  {/* Themes */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Front Page Backdrop Theme
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FRONT_PAGE_THEMES.map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => {
                            setSelectedTheme(th.id);
                            // Also set a placeholder cover image to satisfy requirement
                            setCoverImage(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="375"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="50%" font-family="sans-serif" font-size="28" font-weight="bold" fill="%2338bdf8" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(title || 'Front Page')}</text></svg>`);
                          }}
                          className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                            selectedTheme === th.id
                              ? 'border-blue-500 bg-blue-950/40 text-white shadow-md'
                              : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className={`w-full h-5 rounded-lg bg-gradient-to-r ${th.gradient} mb-1.5 shadow-sm`} />
                          <span className="text-xs font-semibold block truncate">{th.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Emblem */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Hero Emblem / Mascot
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['Gamepad2', 'Rocket', 'Target', 'Car', 'Ghost', 'Sword', 'Trophy'].map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(ic);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                            selectedIcon === ic
                              ? 'border-blue-500 bg-blue-950/60 text-white shadow-sm'
                              : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Top Corner Badge Selection */}
              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  Top Corner Badge
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'hot', label: '🔥 HOT' },
                    { id: 'update', label: '🔄 UPDATED' },
                    { id: 'new', label: '⚡ NEW' },
                    { id: 'star', label: '🌟 TOP PICK' },
                    { id: 'stream', label: '📺 STREAM' },
                    { id: 'none', label: 'None' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBadge(b.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                        selectedBadge === b.id
                          ? 'border-blue-500 bg-blue-950/80 text-white shadow-sm'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Collapsible Metadata Section */}
            <div className="border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white py-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Category, Creator & Release Details</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 pt-3 border-t border-white/[0.04]">
                  {/* Genre & Author */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Category / Genre</label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value as GameGenre)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Action" className="bg-slate-900">Action</option>
                        <option value="Arcade" className="bg-slate-900">Arcade</option>
                        <option value="Educational" className="bg-slate-900">Educational</option>
                        <option value="Shooter" className="bg-slate-900">Shooter</option>
                        <option value="Puzzle" className="bg-slate-900">Puzzle</option>
                        <option value="2 Player" className="bg-slate-900">2 Player</option>
                        <option value="Driving" className="bg-slate-900">Driving</option>
                        <option value="Sports" className="bg-slate-900">Sports</option>
                        <option value="Casual" className="bg-slate-900">Casual</option>
                        <option value="Retro" className="bg-slate-900">Retro</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Creator / Developer Name</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Your Studio or Username"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Version & Changelog */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Version</label>
                      <input
                        type="text"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="1.0.0"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-medium text-slate-400">Release Notes / Changelog</label>
                      <input
                        type="text"
                        value={changelog}
                        onChange={(e) => setChangelog(e.target.value)}
                        placeholder="What's new in this release?"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Controls Instructions */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Controls (One per line: Key:Action)</label>
                    <textarea
                      value={controlsInput}
                      onChange={(e) => setControlsInput(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Front Page & Sandbox Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] space-y-4 sticky top-24">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab('frontpage')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    previewTab === 'frontpage'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Front Page Preview
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab('sandbox')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    previewTab === 'sandbox'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Playable Game
                </button>
              </div>

              {previewTab === 'sandbox' && (
                <button
                  type="button"
                  onClick={() => setPreviewKey(prev => prev + 1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Reload preview"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* TAB 1: FRONT PAGE PREVIEW */}
            {previewTab === 'frontpage' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Main Screen Card (16:10 Front Page)
                  </span>
                  <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden glass-card border border-white/[0.12] shadow-xl">
                    <FrontPageCover
                      title={title || 'Game Title Preview'}
                      genre={genre}
                      author={author || 'Your Name'}
                      coverImage={coverImage}
                      badge={selectedBadge}
                      accentTheme={selectedTheme}
                      iconName={selectedIcon}
                      showHoverOverlay={true}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    Hover to see the instant Play button. Clicking this on the main screen immediately launches your game!
                  </p>
                </div>

                {/* Squircle Preview */}
                <div className="pt-2 border-t border-white/[0.06] space-y-1">
                  <span className="text-[11px] font-semibold text-slate-300">
                    "Continue Playing" Squircle Preview
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden glass-card border border-white/[0.12] shadow-md shrink-0">
                      <FrontPageCover
                        title={title || 'Game'}
                        genre={genre}
                        author={author || 'You'}
                        coverImage={coverImage}
                        badge={selectedBadge}
                        accentTheme={selectedTheme}
                        iconName={selectedIcon}
                        aspect="square"
                        showHoverOverlay={true}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <p className="font-semibold text-slate-200">Home Bar App Icon</p>
                      <p>Renders at the top of the main screen in the "Continue playing" tray.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PLAYABLE GAME RUNNER */}
            {previewTab === 'sandbox' && (
              <div className="space-y-2">
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/[0.1] bg-black relative">
                  {method === 'link' ? (
                    gameLink ? (
                      <iframe
                        key={`preview-link-${previewKey}`}
                        src={cleanUrl(gameLink)}
                        title="Link Preview"
                        className="w-full h-full border-none"
                        allow="autoplay; fullscreen; gamepad"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                        <Globe className="w-8 h-8 text-slate-600" />
                        <span className="text-xs">Enter a valid URL in the left form to preview game.</span>
                      </div>
                    )
                  ) : (
                    <iframe
                      key={`preview-code-${previewKey}`}
                      srcDoc={codeSafety?.isValid ? codeSafety.preparedCode : `<!DOCTYPE html><html><body style="background:#090d16;color:#f87171;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;padding:24px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;">🛡️</div><h3 style="margin:0 0 6px;font-size:15px;color:#fca5a5;">Preview Paused by Crash Shield</h3><p style="margin:0 0 10px;font-size:11px;color:#94a3b8;max-width:320px;">Execution is paused to protect your browser from freezing. Fix the hazardous loop or pattern in the editor to re-enable live testing.</p><div style="background:#1e293b;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:11px;color:#fda4af;">${escapeHtml(codeSafety?.errors[0] || 'Crash hazard')}</div></body></html>`}
                      title="Code Preview"
                      className="w-full h-full border-none"
                      sandbox="allow-scripts allow-modals allow-pointer-lock"
                    />
                  )}
                </div>

                {method === 'link' && gameLink && (
                  <a
                    href={cleanUrl(gameLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
