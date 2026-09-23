import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { HeroBento } from './components/HeroBento';
import { CategoryBar } from './components/CategoryBar';
import { GameCard } from './components/GameCard';
import { GamePlayer } from './components/GamePlayer';
import { GameUploader } from './components/GameUploader';
import { Game, GameGenre } from './types/game';
import { fetchAllGames, deleteGame, clearAllGames } from './utils/api';
import { 
  Sparkles, Flame, History, SearchX, Plus, RefreshCw, 
  Gamepad2, Heart, Award, ArrowRight
} from 'lucide-react';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'arcade' | 'trending' | 'updated' | 'favorites' | 'studio' | 'player'>('arcade');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameToUpdate, setGameToUpdate] = useState<Game | null>(null);

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

  // Load games from API / cache
  const loadGamesData = async () => {
    setIsLoading(true);
    try {
      // Clear legacy cache from older projects
      try {
        localStorage.removeItem('hyperarcade_games_cache');
      } catch {}
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
    // Default sidebar behavior based on screen size
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Recently updated games count
  const updatedGamesCount = useMemo(() => {
    const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
    return games.filter(g => new Date(g.updatedAt).getTime() > tenDaysAgo && g.versions.length > 1).length;
  }, [games]);

  // Primary flagship game (Sphere Strike)
  const primaryFlagshipGame = useMemo(() => {
    return games.find(g => g.id === 'game-sphere-strike') || games[0] || null;
  }, [games]);

  // Secondary bento games
  const secondaryBentoGames = useMemo(() => {
    return games.filter(g => g.id !== primaryFlagshipGame?.id).slice(0, 4);
  }, [games, primaryFlagshipGame]);

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

  // Recently updated curated list
  const recentlyUpdatedGames = useMemo(() => {
    return games
      .filter(g => g.versions.length > 1)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [games]);

  // Trending hits curated list
  const trendingGames = useMemo(() => {
    return [...games]
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 4);
  }, [games]);

  // Navigation handlers
  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setCurrentView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateGame = (game: Game) => {
    setGameToUpdate(game);
    setCurrentView('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenUpload = () => {
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

  const handleDeleteGame = async (gameId: string) => {
    await deleteGame(gameId);
    setGames(prev => prev.filter(g => g.id !== gameId));
    if (selectedGame?.id === gameId) {
      setSelectedGame(null);
      setCurrentView('arcade');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* CrazyGames Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentView={currentView}
        onNavigate={(view) => {
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
        updatedGamesCount={updatedGamesCount}
        favoritesCount={favoriteIds.length}
      />

      {/* Main Content Area - shifts with sidebar on desktop */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* CrazyGames Top Header */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentView !== 'arcade') setCurrentView('arcade');
          }}
          onOpenUpload={handleOpenUpload}
          onRandomGame={handleRandomGame}
          onOpenStudio={() => {
            setGameToUpdate(null);
            setCurrentView('studio');
          }}
          updatedGamesCount={updatedGamesCount}
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
            />
          )}

          {/* VIEW: ARCADE / DIRECTORY (Default CrazyGames layout) */}
          {(currentView === 'arcade' || currentView === 'trending' || currentView === 'updated' || currentView === 'favorites') && (
            <div className="space-y-8">
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

              {/* Show CrazyGames Bento Hero only on clean Home View when games exist */}
              {currentView === 'arcade' && !searchQuery.trim() && activeGenre === 'All' && primaryFlagshipGame && (
                <section aria-label="Featured Bento Section">
                  <HeroBento
                    primaryGame={primaryFlagshipGame}
                    secondaryGames={secondaryBentoGames}
                    onPlayGame={handleSelectGame}
                    onUpdateGame={handleUpdateGame}
                  />
                </section>
              )}

              {/* Curated Section: Recently Updated */}
              {currentView === 'arcade' && !searchQuery.trim() && activeGenre === 'All' && recentlyUpdatedGames.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-base font-bold text-white font-['Outfit'] tracking-tight">
                        Recently Updated Releases
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                        Live Versions
                      </span>
                    </div>

                    <button
                      onClick={() => setCurrentView('updated')}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Updates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recentlyUpdatedGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onPlay={handleSelectGame}
                        onUpdate={handleUpdateGame}
                        isFavorited={favoriteIds.includes(game.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Curated Section: Trending Now */}
              {currentView === 'arcade' && !searchQuery.trim() && activeGenre === 'All' && trendingGames.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <h3 className="text-base font-bold text-white font-['Outfit'] tracking-tight">
                        Trending Community Hits
                      </h3>
                    </div>

                    <button
                      onClick={() => setCurrentView('trending')}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>See More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {trendingGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onPlay={handleSelectGame}
                        onUpdate={handleUpdateGame}
                        isFavorited={favoriteIds.includes(game.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Main Catalog Grid */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Outfit'] tracking-tight">
                      {searchQuery
                        ? `Search Results for "${searchQuery}"`
                        : currentView === 'trending'
                        ? 'All Trending Games'
                        : currentView === 'updated'
                        ? 'Recently Updated Versions'
                        : currentView === 'favorites'
                        ? 'My Favorite Games'
                        : activeGenre === 'All'
                        ? 'All Free Web Games'
                        : `${activeGenre} Games`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Showing {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} available to play instantly
                    </p>
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

                {/* Loading state */}
                {isLoading && (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    <p className="text-sm text-slate-400">Loading Sphere Strike Games catalog...</p>
                  </div>
                )}

                {/* Empty State when entire arcade has no games */}
                {!isLoading && games.length === 0 && (
                  <div className="py-16 px-6 rounded-2xl glass-panel border border-white/[0.08] text-center max-w-xl mx-auto space-y-5 bg-gradient-to-b from-slate-900/40 to-slate-950/70 shadow-xl">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                      <Gamepad2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white font-['Outfit']">
                        No Games in the Arcade Yet
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        All pre-created games have been removed. Sphere Strike Games is clean and ready! Upload an HTML5 game file or launch the Sandbox Studio to create and publish games for everyone to play.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={handleOpenUpload}
                        className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Upload Your First Game</span>
                      </button>

                      <button
                        onClick={() => {
                          setGameToUpdate(null);
                          setCurrentView('studio');
                        }}
                        className="px-5 py-2.5 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 rounded-xl transition-colors cursor-pointer"
                      >
                        Launch Sandbox Studio
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty state when filters/search yield no matches */}
                {!isLoading && games.length > 0 && filteredGames.length === 0 && (
                  <div className="py-16 px-4 rounded-2xl glass-panel border border-white/[0.08] text-center max-w-lg mx-auto space-y-4">
                    <SearchX className="w-12 h-12 text-slate-500 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">No games found</h4>
                      <p className="text-xs text-slate-400">
                        {currentView === 'favorites'
                          ? 'You haven’t added any favorite games yet. Click the heart icon on any game card to bookmark it!'
                          : 'Try changing your search keywords, clearing categories, or upload a game in this genre.'}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setActiveGenre('All');
                          setCurrentView('arcade');
                        }}
                        className="px-4 py-2 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
                      >
                        Browse All Games
                      </button>

                      <button
                        onClick={handleOpenUpload}
                        className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload a Game</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Games Grid (CrazyGames 4-column responsive layout) */}
                {!isLoading && filteredGames.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onPlay={handleSelectGame}
                        onUpdate={handleUpdateGame}
                        isFavorited={favoriteIds.includes(game.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>

        {/* CrazyGames Footer */}
        <footer className="mt-16 border-t border-white/[0.08] bg-[#090d16] py-8 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                SS
              </div>
              <div>
                <span className="font-bold text-white text-sm">Sphere Strike Games</span>
                <p className="text-[11px] text-slate-400">Next-generation community web arcade</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-slate-400 text-[11px]">
              <span>Instant HTML5 Sandbox</span>
              <span>·</span>
              <span>Version Rollbacks</span>
              <span>·</span>
              <span>No Neon Colors</span>
              <span>·</span>
              <span>100% Free to Play</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
