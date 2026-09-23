import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Maximize2, Minimize2, RotateCcw, ThumbsUp, Star, 
  Share2, Code, History, MessageSquare, Check, Sparkles, AlertCircle, Eye, ShieldCheck, Play, Heart, ChevronDown, Trash2, ExternalLink, Globe, Cloud, Trophy, Save, Bookmark, CheckCircle2, LogIn, Lock
} from 'lucide-react';
import { Game, GameVersion, GameComment } from '../types/game';
import { User } from '../types/user';
import { GameProgress } from '../types/progress';
import { trackGamePlay, likeGame, addComment } from '../utils/api';
import { 
  getUserGameProgress, saveUserGameProgress, recordHighScore, 
  recordGameSessionPlay, setGuestSessionProgress 
} from '../utils/progress';
import { injectCrashProtection } from '../utils/codeShield';

interface GamePlayerProps {
  game: Game;
  onBack: () => void;
  onUpdateGame: (game: Game) => void;
  onSelectRelatedGame: (game: Game) => void;
  allGames: Game[];
  onDeleteGame?: (gameId: string) => void;
  isAdmin?: boolean;
  currentUser?: User | null;
  onOpenLogin?: () => void;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({
  game,
  onBack,
  onUpdateGame,
  onSelectRelatedGame,
  allGames,
  onDeleteGame,
  isAdmin = false,
  currentUser = null,
  onOpenLogin,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(game.currentVersion);
  const [activeCode, setActiveCode] = useState<string>(game.code);
  const [activeChangelog, setActiveChangelog] = useState<string>('');
  const [isTheater, setIsTheater] = useState<boolean>(false);
  const [likes, setLikes] = useState<number>(game.likes || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [plays, setPlays] = useState<number>(game.plays || 0);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'info' | 'versions' | 'comments'>('info');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Comments state
  const [comments, setComments] = useState<GameComment[]>(game.comments || []);
  const [newCommentAuthor, setNewCommentAuthor] = useState<string>(currentUser?.username || '');
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [newCommentRating, setNewCommentRating] = useState<number>(5);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // User Game Progress & Cloud Save State
  const [progress, setProgress] = useState<GameProgress | null>(() => {
    if (currentUser) {
      return getUserGameProgress(currentUser.id, game.id);
    }
    return null;
  });
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState<boolean>(false);
  const [inputScore, setInputScore] = useState<string>('');
  const [inputLevel, setInputLevel] = useState<string>('1');
  const [inputCheckpoint, setInputCheckpoint] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string>('');

  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reload progress if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProgress(getUserGameProgress(currentUser.id, game.id));
      if (!newCommentAuthor) setNewCommentAuthor(currentUser.username);
    } else {
      setProgress(null);
    }
  }, [currentUser, game.id]);

  // Track session playtime and auto-save for logged in users
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(s => {
        const next = s + 5;
        if (currentUser && next % 15 === 0) {
          recordGameSessionPlay(currentUser.id, game.id, game.title, 15);
          setProgress(getUserGameProgress(currentUser.id, game.id));
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [currentUser, game.id, game.title]);

  // Listen to postMessage from game (high scores or checkpoints)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        const scoreVal = Number(event.data.score ?? event.data.finalScore ?? event.data.points);
        if (!isNaN(scoreVal) && scoreVal > 0) {
          if (currentUser) {
            const res = recordHighScore(currentUser.id, game.id, game.title, scoreVal);
            setProgress(res.progress);
            setSaveToast(res.isNewBest ? `🏆 New Personal Record: ${scoreVal.toLocaleString()} pts!` : `Score saved: ${scoreVal.toLocaleString()} pts`);
            setTimeout(() => setSaveToast(''), 3500);
          } else {
            setGuestSessionProgress(game.id, { highScore: scoreVal, gameTitle: game.title });
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentUser, game.id, game.title]);

  const handleManualSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = Number(inputScore) || 0;
    const levelVal = Number(inputLevel) || 1;

    if (!currentUser) {
      setGuestSessionProgress(game.id, {
        highScore: scoreVal,
        levelReached: levelVal,
        checkpoints: inputCheckpoint.trim() || undefined,
        gameTitle: game.title
      });
      setIsScoreModalOpen(false);
      onOpenLogin?.();
      return;
    }

    const updated = saveUserGameProgress(currentUser.id, game.id, game.title, {
      highScore: Math.max(progress?.highScore || 0, scoreVal),
      levelReached: levelVal,
      checkpoints: inputCheckpoint.trim() || progress?.checkpoints || undefined
    });

    setProgress(updated);
    setIsScoreModalOpen(false);
    setInputScore('');
    setInputCheckpoint('');
    setSaveToast('Progress saved to your cloud account!');
    setTimeout(() => setSaveToast(''), 3500);
  };

  // Sync game code when version is changed
  useEffect(() => {
    const versionObj = game.versions.find(v => v.version === selectedVersion);
    if (versionObj) {
      setActiveCode(versionObj.code);
      setActiveChangelog(versionObj.changelog);
    } else {
      setActiveCode(game.code);
      setActiveChangelog('');
    }
  }, [selectedVersion, game]);

  // Track play count on mount
  useEffect(() => {
    trackGamePlay(game.id).then(newCount => {
      if (newCount) setPlays(newCount);
      else setPlays(prev => prev + 1);
    });
  }, [game.id]);

  const handleRestart = () => {
    if (iframeRef.current) {
      const currentSrcDoc = iframeRef.current.srcdoc;
      iframeRef.current.srcdoc = '';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.srcdoc = currentSrcDoc;
      }, 50);
    }
  };

  const handleToggleFullscreen = () => {
    if (!iframeContainerRef.current) return;
    if (!document.fullscreenElement) {
      iframeContainerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen request failed', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes(prev => prev + 1);
    await likeGame(game.id);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentAuthor.trim() || !newCommentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const updatedComments = await addComment(
        game.id, 
        newCommentAuthor.trim(), 
        newCommentText.trim(), 
        newCommentRating
      );
      if (updatedComments && updatedComments.length > 0) {
        setComments(updatedComments);
      } else {
        const fallbackComment: GameComment = {
          id: 'c-' + Date.now(),
          author: newCommentAuthor.trim(),
          text: newCommentText.trim(),
          rating: newCommentRating,
          createdAt: new Date().toISOString(),
          likes: 0,
        };
        setComments(prev => [fallbackComment, ...prev]);
      }
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Up Next / Related games side rail
  const relatedGames = allGames.filter(g => g.id !== game.id).slice(0, 6);

  return (
    <div className="w-full space-y-6">
      {/* Top Breadcrumb & Back Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Games</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-slate-400">Sphere Strike Arcade</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{game.genre}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-medium truncate max-w-[200px]">{game.title}</span>
        </div>
      </div>

      {/* Main Player Layout: Left/Center Game & Tabs, Right Up Next Rail */}
      <div className={`grid grid-cols-1 ${isTheater ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6`}>
        {/* Left / Main Column (8 or 12 cols in theater mode) */}
        <div className={isTheater ? 'w-full space-y-6' : 'lg:col-span-9 space-y-6'}>
          {/* Sandboxed Game Viewport Container */}
          <div 
            ref={iframeContainerRef}
            className="relative rounded-2xl overflow-hidden glass-panel border border-white/[0.08] bg-black shadow-2xl flex flex-col"
          >
            {/* Top Game Controls Strip */}
            <div className="h-11 px-4 bg-[#0d121f]/95 border-b border-white/[0.08] flex items-center justify-between select-none">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white truncate max-w-[240px] sm:max-w-md">
                  {game.title}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  v{selectedVersion}
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* Safe Sandbox Badge */}
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sandbox Safe</span>
                </div>

                {/* Restart Game */}
                <button
                  onClick={handleRestart}
                  title="Restart Game"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Theater Mode Toggle */}
                <button
                  onClick={() => setIsTheater(!isTheater)}
                  title={isTheater ? 'Exit Theater Mode' : 'Theater Mode'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  {isTheater ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* External Link if linked game */}
                {game.embedUrl && (
                  <a
                    href={game.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open game directly in a new tab"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span className="hidden sm:inline text-blue-300">Open Tab</span>
                  </a>
                )}

                {/* True Fullscreen Toggle */}
                <button
                  onClick={handleToggleFullscreen}
                  title="Fullscreen"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sandboxed Game Frame */}
            <div className="relative w-full aspect-[16/10] sm:aspect-video bg-[#080c16] flex items-center justify-center overflow-hidden">
              {game.embedUrl ? (
                <iframe
                  ref={iframeRef}
                  key={selectedVersion + '-' + game.embedUrl}
                  src={game.embedUrl}
                  title={game.title}
                  sandbox="allow-scripts allow-modals allow-same-origin allow-pointer-lock allow-forms allow-popups allow-fullscreen allow-orientation-lock allow-presentation"
                  className="w-full h-full border-0 block bg-black"
                  allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; screen-wake-lock; xr-spatial-tracking"
                />
              ) : (
                <iframe
                  ref={iframeRef}
                  key={selectedVersion}
                  srcDoc={injectCrashProtection(activeCode)}
                  title={game.title}
                  sandbox="allow-scripts allow-modals allow-pointer-lock allow-forms allow-fullscreen allow-orientation-lock"
                  className="w-full h-full border-0 block"
                  allow="autoplay; fullscreen; gamepad"
                />
              )}
            </div>

            {/* External link status bar if embedded */}
            {game.embedUrl && (
              <div className="px-4 py-2 bg-slate-900/60 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Playing from: <strong className="text-slate-300 font-mono text-[11px]">{game.embedUrl}</strong></span>
                </div>
                <a
                  href={game.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 ml-3 shrink-0"
                >
                  <span>Direct Window</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Toast Notification when progress or score is saved */}
          {saveToast && (
            <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg shadow-emerald-950/60 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveToast}</span>
              </div>
              <button 
                onClick={() => setSaveToast('')} 
                className="text-emerald-400 hover:text-emerald-200 cursor-pointer font-bold px-1.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Cloud Save & Account Progress Status Bar */}
          {currentUser ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c1424] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-['Outfit']">Cloud Progress Saved</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      @{currentUser.username}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400/90 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Auto-syncing
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 font-mono mt-0.5">
                    <span className="text-amber-300 font-semibold flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      Personal Best: {(progress?.highScore || 0).toLocaleString()} pts
                    </span>
                    <span>•</span>
                    <span>Level {progress?.levelReached || 1}</span>
                    <span>•</span>
                    <span>⏱️ Session: {Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s</span>
                    {progress?.checkpoints && (
                      <>
                        <span>•</span>
                        <span className="text-blue-300 flex items-center gap-1">
                          <Bookmark className="w-3 h-3" />
                          {progress.checkpoints}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInputScore(progress?.highScore ? String(progress.highScore) : '');
                  setInputLevel(progress?.levelReached ? String(progress.levelReached) : '1');
                  setInputCheckpoint(progress?.checkpoints || '');
                  setIsScoreModalOpen(true);
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Record / Checkpoint</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-blue-950/30 to-purple-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300 font-['Outfit']">Guest Mode: Progress Won't Save!</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      Unsaved
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>Account Benefit:</strong> When you have an account, your high scores, checkpoints, playtime, and unlocked trophies are permanently saved in the cloud.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenLogin?.()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-950 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Log In to Save Progress</span>
                </button>
              </div>
            </div>
          )}

          {/* Record Score / Save Checkpoint Modal */}
          {isScoreModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="relative w-full max-w-sm bg-[#090e1a] border border-white/[0.12] rounded-3xl p-6 shadow-2xl space-y-4">
                <button
                  type="button"
                  onClick={() => setIsScoreModalOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-['Outfit']">Save Game Progress</h3>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{game.title}</p>
                  </div>
                </div>

                <form onSubmit={handleManualSaveProgress} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      High Score / Points
                    </label>
                    <input
                      type="number"
                      value={inputScore}
                      onChange={(e) => setInputScore(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Stage / Level Reached
                    </label>
                    <input
                      type="number"
                      value={inputLevel}
                      onChange={(e) => setInputLevel(e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Checkpoint Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={inputCheckpoint}
                      onChange={(e) => setInputCheckpoint(e.target.value)}
                      placeholder="e.g. Boss defeated, world 2 unlocked"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{currentUser ? 'Save to Cloud Profile' : 'Save & Log In'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Game Title, Creator & Primary Action Bar */}
          <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-400 font-semibold">{game.genre}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">Created by <strong className="text-slate-200">{game.author}</strong></span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
                  {game.title}
                </h1>
              </div>

              {/* Version Selector Dropdown & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Version Selector */}
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 mr-1">Version:</span>
                  <select
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    className="bg-transparent text-white font-mono font-semibold focus:outline-none cursor-pointer"
                  >
                    {game.versions.map(v => (
                      <option key={v.version} value={v.version} className="bg-slate-900 text-white">
                        v{v.version} {v.version === game.currentVersion ? '(Latest)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={hasLiked}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    hasLiked
                      ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{likes}</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                >
                  {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedShare ? 'Copied Link!' : 'Share'}</span>
                </button>

                {/* Update / Fork Game */}
                <button
                  onClick={() => onUpdateGame(game)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer ${
                    isAdmin 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{isAdmin ? '🛡️ Moderate / Edit' : 'Update / Edit'}</span>
                </button>

                {/* Delete Game */}
                {onDeleteGame && (
                  <button
                    onClick={() => {
                      const msg = isAdmin
                        ? `[ADMIN ACTION] Are you sure you want to delete "${game.title}" as inappropriate? This will permanently remove it.`
                        : `Are you sure you want to remove "${game.title}"?`;
                      if (window.confirm(msg)) {
                        onDeleteGame(game.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isAdmin
                        ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 font-bold shadow-md shadow-rose-950'
                        : 'bg-white/[0.04] hover:bg-rose-950/40 border border-white/[0.08] hover:border-rose-500/40 text-slate-400 hover:text-rose-300'
                    }`}
                    title={isAdmin ? 'Delete inappropriate game as Admin' : 'Delete game'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAdmin ? '🛡️ Delete Inappropriate' : 'Delete'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Release Changelog Banner if this version has notes */}
            {activeChangelog && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-300">
                    What's New in Version {selectedVersion}:
                  </div>
                  <div className="mt-0.5 text-slate-300/90">{activeChangelog}</div>
                </div>
              </div>
            )}
          </div>

          {/* Player Tabs (Info, Version History, Comments) */}
          <div className="space-y-4">
            {/* Tab navigation headers */}
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'info'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview & Controls
              </button>

              <button
                onClick={() => setActiveTab('versions')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'versions'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Version History ({game.versions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'comments'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reviews ({comments.length})</span>
              </button>
            </div>

            {/* TAB 1: INFO & CONTROLS */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 rounded-2xl glass-panel border border-white/[0.08]">
                {/* Left 7 cols: Description & Tags */}
                <div className="md:col-span-7 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    About {game.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {game.description}
                  </p>

                  <div className="pt-2">
                    <span className="text-xs font-mono text-slate-400 block mb-2 font-semibold">
                      CATEGORIES & TAGS
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {game.tags.map(t => (
                        <span 
                          key={t}
                          className="px-2.5 py-1 text-xs rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: Keybindings */}
                <div className="md:col-span-5 space-y-3 md:border-l md:border-white/[0.08] md:pl-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>How to Play</span>
                  </h3>

                  <div className="space-y-2">
                    {game.controls && game.controls.length > 0 ? (
                      game.controls.map((ctrl, i) => (
                        <div 
                          key={i}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                        >
                          <span className="font-mono font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/20">
                            {ctrl.key}
                          </span>
                          <span className="text-slate-300">{ctrl.action}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Mouse and standard arrow keys.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VERSION HISTORY */}
            {activeTab === 'versions' && (
              <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Game Version Changelog
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Track updates or rollback to any previous community version.
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateGame(game)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
                  >
                    Publish New Version
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {game.versions.map((ver, idx) => (
                    <div 
                      key={ver.version}
                      className={`p-4 rounded-xl border transition-all ${
                        ver.version === selectedVersion
                          ? 'bg-blue-950/40 border-blue-500/40'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white">
                            Version {ver.version}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                              Current Live
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedVersion(ver.version)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            ver.version === selectedVersion
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-white/[0.05] text-slate-300 hover:text-white'
                          }`}
                        >
                          {ver.version === selectedVersion ? 'Active Playing' : 'Play This Version'}
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {ver.changelog || 'Routine stability improvements and engine calibration.'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                        <span>By {ver.author}</span>
                        <span>·</span>
                        <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: COMMENTS & REVIEWS */}
            {activeTab === 'comments' && (
              <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Community Reviews & Feedback
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Share your score or feedback directly with the game creator.
                  </p>
                </div>

                {/* Add review form */}
                <form onSubmit={handleAddComment} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Your Nickname</label>
                      <input
                        type="text"
                        value={newCommentAuthor}
                        onChange={(e) => setNewCommentAuthor(e.target.value)}
                        placeholder="Player One"
                        required
                        className="w-full px-3 py-1.5 text-xs bg-slate-900/80 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Rating</label>
                      <div className="flex items-center gap-1 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewCommentRating(star)}
                            className="cursor-pointer text-slate-500 hover:text-amber-400"
                          >
                            <Star className={`w-4 h-4 ${star <= newCommentRating ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Comment / Feedback</label>
                    <textarea
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Share tips, high scores, or suggestions for the next version update..."
                      rows={2}
                      required
                      className="w-full px-3 py-1.5 text-xs bg-slate-900/80 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newCommentText.trim() || !newCommentAuthor.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSubmittingComment ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div 
                      key={comment.id}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{comment.author}</span>
                          {comment.isDev && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                              Developer
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`w-3 h-3 ${s <= comment.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} 
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {comment.text}
                      </p>

                      <div className="text-[10px] font-mono text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Rail: "Up Next / More Like This" Column */}
        {!isTheater && (
          <div className="lg:col-span-3 space-y-4">
            <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Up Next / Similar</span>
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </h3>

              <div className="space-y-2.5">
                {relatedGames.map((relGame) => (
                  <div
                    key={relGame.id}
                    onClick={() => onSelectRelatedGame(relGame)}
                    className="group flex gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-blue-500/30 transition-all cursor-pointer"
                  >
                    {/* Thumbnail Box */}
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center">
                      <div className={`absolute inset-0 bg-gradient-to-br ${relGame.thumbnailGradient} opacity-80`} />
                      <Play className="relative z-10 w-4 h-4 text-white opacity-80 group-hover:scale-110 transition-transform" />
                    </div>

                    {/* Meta */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <h4 className="text-xs font-bold text-white font-['Outfit'] truncate group-hover:text-blue-400 transition-colors">
                        {relGame.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{relGame.genre}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          {relGame.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        v{relGame.currentVersion}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
