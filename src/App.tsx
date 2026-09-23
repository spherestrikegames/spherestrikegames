import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CategoryBar } from './components/CategoryBar';
import { GameCard } from './components/GameCard';
import { EmptySlotCard } from './components/EmptySlotCard';
import { GamePlayer } from './components/GamePlayer';
import { GameUploader } from './components/GameUploader';
import { CreatedGamesSidebar } from './components/CreatedGamesSidebar';
import { AuthModal } from './components/AuthModal';
import { AdminSecretTerminal } from './components/AdminSecretTerminal';
import { UserProfileModal } from './components/UserProfileModal';
import { SphereStrikeLogo } from './components/SphereStrikeLogo';
import { Game, GameGenre } from './types/game';
import { User, AuthMode } from './types/user';
import { fetchAllGames, deleteGame, checkAccountStatus, saveAccountDataApi } from './utils/api';
import { isUserCreatedGame, removeMyCreatedGameId } from './utils/myGames';
import { getCurrentUser, logoutUser } from './utils/auth';
import { hydrateUserProgressFromServer } from './utils/progress';
import { 
  Sparkles, Flame, History, SearchX, Plus, RefreshCw, 
  Gamepad2, Heart, Award, ArrowRight, ChevronRight, Edit3, Grid3X3,
  Ban, ShieldAlert
} from 'lucide-react';

const MAIN_SCREEN_TOTAL_SLOTS = 65;

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'arcade' | 'trending' | 'updated' | 'favorites' | 'studio' | 'player'>('arcade');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameToUpdate, setGameToUpdate] = useState<Game | null>(null);

  // Side mode: My Created Games (View and Edit Info)
  const [isCreatedGamesOpen, setIsCreatedGamesOpen] = useState<boolean>(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);

  // Monitor if active user session was blocked by administrator
  useEffect(() => {
    if (!currentUser) return;
    const verifyStatus = async () => {
      try {
        const res = await checkAccountStatus(currentUser.id);
        if (res.blocked) {
          setBlockedNotice(
            res.blockedReason || 'This account has been suspended by an administrator due to reported suspicious behavior.'
          );
          logoutUser();
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Failed to verify user status:', err);
      }
    };

    verifyStatus();
    const interval = setInterval(verifyStatus, 20000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleOpenLogin = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenSignup = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleOpenProfile = () => {
    setIsProfileModalOpen(true);
  };

  const handleLogout = () => {
    // Save last played state before logging out so account keeps where you left off
    if (currentUser) {
      saveAccountDataApi(currentUser.id, {
        favoriteGameIds: favoriteIds,
        lastPlayedGameId: selectedGame?.id,
        lastPlayedGameTitle: selectedGame?.title,
        lastActiveView: currentView
      }).catch(() => {});
    }
    logoutUser();
    setCurrentUser(null);
    setCurrentView('arcade');
    setSelectedGame(null);
  };

  const handleAuthSuccess = (user: User) => {
    try {
      setCurrentUser(user);
    } catch (e) {
      console.warn('setCurrentUser state error:', e);
    }

    try {
      hydrateUserProgressFromServer(user);
    } catch (e) {
      console.warn('Hydration skipped:', e);
    }

    // Restore favorites from user account
    try {
      if (Array.isArray(user.favoriteGameIds) && user.favoriteGameIds.length > 0) {
        setFavoriteIds(user.favoriteGameIds);
        localStorage.setItem('spherestrike_favs', JSON.stringify(user.favoriteGameIds));
      }
    } catch (e) {
      console.warn('Favorite storage error:', e);
    }

    // Restore exact account state where user left off
    try {
      if (user.lastPlayedGameId) {
        const match = games.find(g => g.id === user.lastPlayedGameId || g.slug === user.lastPlayedGameId);
        if (match) {
          setSelectedGame(match);
          if (user.lastActiveView === 'player' || !user.lastActiveView) {
            setCurrentView('player');
          }
        }
      }
    } catch (e) {
      console.warn('Last played sync error:', e);
    }
  };

  // Strictly server-authenticated Admin access:
  // Non-admin users or guests cannot see admin abilities or use admin abilities
  const isAdmin = Boolean(
    currentUser && 
    currentUser.isAdmin === true && 
    currentUser.role === 'admin' && 
    !currentUser.isBlocked
  );

  const handleUnlockAdmin = () => {
    // Admin access is granted solely via authenticating into an admin account
  };

  const handleLockAdmin = () => {
    if (isAdmin) {
      handleLogout();
    }
  };

  // Restore state when user is loaded on initial startup
  useEffect(() => {
    if (currentUser) {
      hydrateUserProgressFromServer(currentUser);
      if (Array.isArray(currentUser.favoriteGameIds) && currentUser.favoriteGameIds.length > 0) {
        setFavoriteIds(currentUser.favoriteGameIds);
      }
      if (currentUser.lastPlayedGameId && !selectedGame && games.length > 0) {
        const match = games.find(g => g.id === currentUser.lastPlayedGameId || g.slug === currentUser.lastPlayedGameId);
        if (match) {
          setSelectedGame(match);
          if (currentUser.lastActiveView === 'player') {
            setCurrentView('player');
          }
        }
      }
    }
  }, [currentUser?.id, games.length]);

  // Filters
  const [activeGenre, setActiveGenre] = useState<GameGenre>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'trending' | 'plays' | 'rating' | 'updated' | 'newest'>('trending');

  // Favorites in localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('spherestrike_favs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds(prev => {
      const next = prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId];
      localStorage.setItem('spherestrike_favs', JSON.stringify(next));
      if (currentUser) {
        saveAccountDataApi(currentUser.id, { favoriteGameIds: next }).catch(() => {});
      }
      return next;
    });
  };

  // Load games from API and handle direct shared game links
  const loadGamesData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllGames();
      setGames(data);

      // Check if URL contains a shared game link parameter
      const params = new URLSearchParams(window.location.search);
      const sharedTarget = params.get('game') || params.get('play');
      if (sharedTarget && data && data.length > 0) {
        const query = sharedTarget.toLowerCase();
        const matched = data.find(g => g.id.toLowerCase() === query || g.slug.toLowerCase() === query);
        if (matched) {
          setSelectedGame(matched);
          setCurrentView('player');
        }
      }
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGamesData();
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Games that the user made
  const myCreatedGames = useMemo(() => {
    return games.filter(g => isUserCreatedGame(g));
  }, [games]);

  // Recently updated games count
  const updatedGamesCount = useMemo(() => {
    const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
    return games.filter(g => new Date(g.updatedAt).getTime() > tenDaysAgo && g.versions.length > 1).length;
  }, [games]);

  // Filtered and sorted games
  const filteredGames = useMemo(() => {
    let list = [...games];

    // Specific view filters
    if (currentView === 'trending') {
      list = list.filter(g => (g.likes > 150 || g.plays > 4000));
    } else if (currentView === 'updated') {
      list = list.filter(g => g.versions.length > 1 || (Date.now() - new Date(g.updatedAt).getTime() < 10 * 24 * 60 * 60 * 1000));
    } else if (currentView === 'favorites') {
      list = list.filter(g => favoriteIds.includes(g.id));
    }

    // Genre filter
    if (activeGenre !== 'All') {
      list = list.filter(g => g.genre === activeGenre || g.tags.includes(activeGenre));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g => 
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.author.toLowerCase().includes(q) ||
        g.genre.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort order
    switch (sortBy) {
      case 'plays':
        list.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'updated':
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'trending':
      default:
        list.sort((a, b) => ((b.plays || 0) + (b.likes || 0) * 10) - ((a.plays || 0) + (a.likes || 0) * 10));
        break;
    }

    return list;
  }, [games, currentView, activeGenre, searchQuery, sortBy, favoriteIds]);

  // Exact 65 uniform slots for the main screen
  const mainScreenSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < MAIN_SCREEN_TOTAL_SLOTS; i++) {
      slots.push({
        slotNumber: i + 1,
        game: filteredGames[i] || null,
      });
    }
    return slots;
  }, [filteredGames]);

  // Navigation handlers
  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setCurrentView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateGame = (game: Game) => {
    if (!currentUser && !isAdmin) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setGameToUpdate(game);
    setCurrentView('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenUpload = () => {
    if (!currentUser) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setGameToUpdate(null);
    setCurrentView('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRandomGame = () => {
    if (games.length === 0) return;
    const rand = games[Math.floor(Math.random() * games.length)];
    handleSelectGame(rand);
  };

  const handleGameSaved = (savedGame: Game) => {
    setGames(prev => {
      const idx = prev.findIndex(g => g.id === savedGame.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedGame;
        return next;
      }
      return [savedGame, ...prev];
    });
    handleSelectGame(savedGame);
  };

  const handleGameUpdatedFromSide = (updatedGame: Game) => {
    setGames(prev => {
      const idx = prev.findIndex(g => g.id === updatedGame.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedGame;
        return next;
      }
      return [updatedGame, ...prev];
    });
  };

  const handleDeleteGame = async (gameId: string) => {
    await deleteGame(gameId);
    removeMyCreatedGameId(gameId);
    setGames(prev => prev.filter(g => g.id !== gameId));
    if (selectedGame?.id === gameId) {
      setSelectedGame(null);
      setCurrentView('arcade');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sphere Strike Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'studio' && !currentUser) {
            setAuthMode('login');
            setIsAuthModalOpen(true);
            return;
          }
          setCurrentView(view as any);
          if (view !== 'player') setSelectedGame(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeGenre={activeGenre}
        onSelectGenre={(genre) => {
          setActiveGenre(genre);
          setCurrentView('arcade');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenUpload={handleOpenUpload}
        onOpenCreatedGames={() => setIsCreatedGamesOpen(true)}
        updatedGamesCount={updatedGamesCount}
        favoritesCount={favoriteIds.length}
        myCreatedGamesCount={myCreatedGames.length}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onOpenLogin={() => {
          setAuthMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenSignup={() => {
          setAuthMode('signup');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenAdminTerminal={() => {
          if (currentView !== 'arcade') setCurrentView('arcade');
          setTimeout(() => {
            const el = document.getElementById('admin-terminal-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Main Content Area - shifts with sidebar on desktop */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Top Header */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentView !== 'arcade') setCurrentView('arcade');
          }}
          onToggleCreatedGames={() => setIsCreatedGamesOpen(!isCreatedGamesOpen)}
          myCreatedGamesCount={myCreatedGames.length}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onOpenLogin={handleOpenLogin}
          onOpenSignup={handleOpenSignup}
          onLogout={handleLogout}
          onOpenProfile={handleOpenProfile}
        />

        {/* Primary Page Canvas */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* VIEW: GAME PLAYER */}
          {currentView === 'player' && selectedGame && (
            <GamePlayer
              game={selectedGame}
              onBack={() => {
                setCurrentView('arcade');
                setSelectedGame(null);
              }}
              onUpdateGame={handleUpdateGame}
              onSelectRelatedGame={handleSelectGame}
              allGames={games}
              onDeleteGame={handleDeleteGame}
              isAdmin={isAdmin}
              currentUser={currentUser}
              onOpenLogin={handleOpenLogin}
            />
          )}

          {/* VIEW: CREATOR STUDIO */}
          {currentView === 'studio' && (
            <GameUploader
              onClose={() => {
                setCurrentView('arcade');
                setGameToUpdate(null);
              }}
              onGameSaved={handleGameSaved}
              initialGameToUpdate={gameToUpdate}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onRequireAuth={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
            />
          )}

          {/* VIEW: ARCADE / 65 SLOTS DIRECTORY */}
          {(currentView === 'arcade' || currentView === 'trending' || currentView === 'updated' || currentView === 'favorites') && (
            <div className="space-y-6">
              {/* Sphere Strike Hero Banner with Official Logo */}
              {currentView === 'arcade' && !searchQuery.trim() && activeGenre === 'All' && (
                <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] bg-gradient-to-br from-[#0c1424] via-[#080d19] to-[#04060c] p-6 sm:p-8 shadow-2xl">
                  {/* Glowing ambient orbs */}
                  <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Official Sphere Strike Logo (matching image.png) */}
                    <div className="flex items-center justify-center md:justify-start">
                      <SphereStrikeLogo variant="horizontal" size="lg" />
                    </div>

                    {/* Stats & Quick Actions */}
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs">
                      <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                        <span className="text-slate-400">Total Grid Slots: </span>
                        <span className="font-bold font-mono text-cyan-400">65 Uniform Slots</span>
                      </div>

                      <button
                        onClick={() => setIsCreatedGamesOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-all cursor-pointer shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>My Created Games ({myCreatedGames.length})</span>
                      </button>

                      <button
                        onClick={handleOpenUpload}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload Game</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Pills Row Subnav */}
              <CategoryBar
                activeGenre={activeGenre}
                onSelectGenre={(genre) => {
                  setActiveGenre(genre);
                  if (currentView !== 'arcade') setCurrentView('arcade');
                }}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalGamesCount={filteredGames.length}
              />

              {/* Guest Account Invitation Banner */}
              {!currentUser && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900/60 border border-blue-500/25 shadow-lg shadow-blue-950/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">Join Sphere Strike Arcade</p>
                      <p className="text-[11px] text-slate-300">Create your free player account to save game checkpoints, high scores & publish games.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('signup');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950 transition-all cursor-pointer"
                    >
                      Create Free Account
                    </button>
                  </div>
                </div>
              )}

              {/* Logged-In User "Pick Up Where You Left Off" Banner */}
              {currentUser && currentUser.lastPlayedGameId && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900/60 border border-emerald-500/30 shadow-lg shadow-emerald-950/20 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Gamepad2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                        <span>Pick up where you left off</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Saved Session
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Continue playing <span className="text-emerald-300 font-semibold">{currentUser.lastPlayedGameTitle || 'your game'}</span> with your saved progress and checkpoints.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => {
                        const target = games.find(g => g.id === currentUser.lastPlayedGameId || g.slug === currentUser.lastPlayedGameId);
                        if (target) {
                          handleSelectGame(target);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950/50 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>Resume Game</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 65 EQUAL SIZE SLOTS GRID (NO SPOTLIGHT GAMES - ALL SAME SIZE) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                      <Grid3X3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] tracking-tight flex items-center gap-2">
                        <span>
                          {searchQuery
                            ? `Search Results for "${searchQuery}"`
                            : currentView === 'trending'
                            ? 'All Trending Games'
                            : currentView === 'updated'
                            ? 'Recently Updated Versions'
                            : currentView === 'favorites'
                            ? 'My Favorite Games'
                            : activeGenre !== 'All'
                            ? `${activeGenre} Games`
                            : 'Main Screen Arcade'}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/30">
                          65 Slots
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        All games have the exact same size slot · Click any card to play or click empty slots to upload
                      </p>
                    </div>
                  </div>

                  {(searchQuery || activeGenre !== 'All' || currentView !== 'arcade') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveGenre('All');
                        setCurrentView('arcade');
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* The 65 Equal-Sized Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {mainScreenSlots.map((slot) => {
                    return slot.game ? (
                      <GameCard
                        key={`slot-game-${slot.game.id}-${slot.slotNumber}`}
                        game={slot.game}
                        slotNumber={slot.slotNumber}
                        onPlay={handleSelectGame}
                        onUpdate={handleUpdateGame}
                        onDelete={handleDeleteGame}
                        isAdmin={isAdmin}
                        isFavorited={favoriteIds.includes(slot.game.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ) : (
                      <EmptySlotCard
                        key={`empty-slot-${slot.slotNumber}`}
                        slotNumber={slot.slotNumber}
                        onOpenUpload={handleOpenUpload}
                      />
                    );
                  })}
                </div>
              </section>

              {/* Secret Admin Moderation Terminal - strictly visible and accessible to verified admin accounts */}
              {isAdmin && (
                <AdminSecretTerminal
                  isAdmin={isAdmin}
                  onUnlockAdmin={handleUnlockAdmin}
                  onLockAdmin={handleLockAdmin}
                  totalGamesCount={games.length}
                />
              )}
            </div>
          )}
        </main>

        {/* Side Mode: My Created Games (View & Edit Info) */}
        <CreatedGamesSidebar
          isOpen={isCreatedGamesOpen}
          onClose={() => setIsCreatedGamesOpen(false)}
          myGames={myCreatedGames}
          onPlayGame={(game) => {
            setIsCreatedGamesOpen(false);
            handleSelectGame(game);
          }}
          onOpenUpload={() => {
            setIsCreatedGamesOpen(false);
            handleOpenUpload();
          }}
          onGameUpdated={handleGameUpdatedFromSide}
          onGameDeleted={handleDeleteGame}
        />

        {/* User Login & Signup Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />

        {/* User Profile & Saved Progress Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          allGames={games}
          onSelectGame={(game) => {
            handleSelectGame(game);
          }}
          onLogout={handleLogout}
        />

        {/* Account Suspended Alert Modal */}
        {blockedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-[#12080c] border border-rose-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/80 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/90 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-950">
                <Ban className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white font-['Outfit'] tracking-tight">
                  Account Suspended
                </h3>
                <p className="text-xs text-rose-300/90 mt-2 leading-relaxed">
                  {blockedNotice}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setBlockedNotice(null)}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-950 transition-all cursor-pointer"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-white/[0.08] bg-[#090d16] py-8 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SphereStrikeLogo variant="horizontal" size="sm" />
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-slate-400 text-[11px]">
              <span>65 Equal Game Slots</span>
              <span>·</span>
              <span>No Spotlight Games</span>
              <span>·</span>
              <span>Side Edit Mode</span>
              <span>·</span>
              <span>HTML5 Sandbox</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
