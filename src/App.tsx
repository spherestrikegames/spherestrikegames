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
import { fetchAllGames, deleteGame } from './utils/api';
import { isUserCreatedGame, removeMyCreatedGameId } from './utils/myGames';
import { getCurrentUser, logoutUser } from './utils/auth';
import { 
  Sparkles, Flame, History, SearchX, Plus, RefreshCw, 
  Gamepad2, Heart, Award, ArrowRight, ChevronRight, Edit3, Grid3X3
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
    logoutUser();
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
  };

  // Admin Mode state (unlocked via secret code "MacBook Air" at bottom of main menu)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('spherestrike_admin_access') === 'true';
    } catch {
      return false;
    }
  });

  const handleUnlockAdmin = () => {
    setIsAdmin(true);
    try {
      localStorage.setItem('spherestrike_admin_access', 'true');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLockAdmin = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('spherestrike_admin_access');
    } catch (err) {
      console.error(err);
    }
  };

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
      return next;
    });
  };

  // Load games from API
  const loadGamesData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllGames();
      setGames(data);
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

              {/* Secret Admin Access Terminal at the bottom of the main menu */}
              <AdminSecretTerminal
                isAdmin={isAdmin}
                onUnlockAdmin={handleUnlockAdmin}
                onLockAdmin={handleLockAdmin}
                totalGamesCount={games.length}
              />
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
