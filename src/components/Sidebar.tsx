import React from 'react';
import { 
  Home, Flame, History, Heart, Upload, Code2, 
  Gamepad2, Rocket, Target, Boxes, Compass, Smile, Trophy, Tv, Users,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { GameGenre } from '../types/game';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  activeGenre: GameGenre;
  onSelectGenre: (genre: GameGenre) => void;
  onOpenUpload: () => void;
  updatedGamesCount: number;
  favoritesCount: number;
}

interface CategoryItem {
  id: GameGenre;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryItem[] = [
  { id: '2 Player', label: '2 Player', icon: <Users className="w-4 h-4" /> },
  { id: 'Action', label: 'Action', icon: <Target className="w-4 h-4" /> },
  { id: 'Arcade', label: 'Arcade', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'Shooter', label: 'Shooter', icon: <Rocket className="w-4 h-4" /> },
  { id: 'Puzzle', label: 'Puzzle', icon: <Boxes className="w-4 h-4" /> },
  { id: 'Driving', label: 'Driving', icon: <Compass className="w-4 h-4" /> },
  { id: 'Sports', label: 'Sports', icon: <Trophy className="w-4 h-4" /> },
  { id: 'Casual', label: 'Casual', icon: <Smile className="w-4 h-4" /> },
  { id: 'Retro', label: 'Retro', icon: <Tv className="w-4 h-4" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  currentView,
  onNavigate,
  activeGenre,
  onSelectGenre,
  onOpenUpload,
  updatedGamesCount,
  favoritesCount,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 transition-all duration-300 ease-in-out flex flex-col bg-[#0d121f]/95 backdrop-blur-2xl border-r border-white/[0.08] shadow-2xl ${
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08] shrink-0">
          <button
            onClick={() => {
              onNavigate('arcade');
              onSelectGenre('All');
            }}
            className="flex items-center gap-3 text-left group cursor-pointer overflow-hidden"
          >
            {/* Sphere Strike Emblem */}
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-md shadow-blue-950">
              <div className="w-4 h-4 rounded-full bg-white shadow-inner flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
            </div>

            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-white font-['Outfit'] group-hover:text-blue-400 transition-colors truncate">
                  Sphere Strike
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                  GAMES ARCADE
                </span>
              </div>
            )}
          </button>

          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={onToggle}
            className="hidden md:flex p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* Main Discover Section */}
          <div className="space-y-1">
            {isOpen && (
              <div className="px-3 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Discover
              </div>
            )}

            <button
              onClick={() => {
                onNavigate('arcade');
                onSelectGenre('All');
              }}
              title="Home"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentView === 'arcade' && activeGenre === 'All'
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Home className="w-5 h-5 shrink-0" />
              {isOpen && <span>Home</span>}
            </button>

            <button
              onClick={() => {
                onNavigate('trending');
                onSelectGenre('All');
              }}
              title="Trending Hits"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentView === 'trending'
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Flame className="w-5 h-5 text-amber-400 shrink-0" />
              {isOpen && <span>Trending</span>}
            </button>

            <button
              onClick={() => {
                onNavigate('updated');
                onSelectGenre('All');
              }}
              title="Recently Updated"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentView === 'updated'
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-emerald-400 shrink-0" />
                {isOpen && <span>Updated Games</span>}
              </div>
              {isOpen && updatedGamesCount > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  {updatedGamesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNavigate('favorites');
                onSelectGenre('All');
              }}
              title="Liked Games"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentView === 'favorites'
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-400 shrink-0" />
                {isOpen && <span>My Favorites</span>}
              </div>
              {isOpen && favoritesCount > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>

          {/* Categories Section (CrazyGames Style) */}
          <div className="space-y-1">
            {isOpen && (
              <div className="px-3 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
                <span>Categories</span>
                <span className="text-[10px] text-slate-400">9</span>
              </div>
            )}

            {CATEGORIES.map((cat) => {
              const isCatActive = currentView === 'arcade' && activeGenre === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onNavigate('arcade');
                    onSelectGenre(cat.id);
                  }}
                  title={cat.label}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isCatActive
                      ? 'bg-slate-800 text-blue-400 font-semibold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span className={`${isCatActive ? 'text-blue-400' : 'text-slate-400'} shrink-0`}>
                    {cat.icon}
                  </span>
                  {isOpen && <span className="truncate">{cat.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Creator Tools Section */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            {isOpen && (
              <div className="px-3 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Creator Zone
              </div>
            )}

            <button
              onClick={onOpenUpload}
              title="Upload New Game"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/50 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 shrink-0" />
              {isOpen && <span>Upload Game</span>}
            </button>

            <button
              onClick={() => onNavigate('studio')}
              title="Creator Studio"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentView === 'studio'
                  ? 'bg-slate-800 text-blue-400 font-semibold border border-blue-500/30'
                  : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4 text-slate-400 shrink-0" />
              {isOpen && <span>Sandbox Studio</span>}
            </button>
          </div>
        </div>

        {/* Footer info (when expanded) */}
        {isOpen && (
          <div className="p-4 border-t border-white/[0.08] text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-400">Sphere Strike v2.4</span>
              <span className="text-emerald-400 font-mono">Live</span>
            </div>
            <p className="text-slate-400 text-[10px]">Free HTML5 Community Web Arcade</p>
          </div>
        )}
      </aside>
    </>
  );
};
