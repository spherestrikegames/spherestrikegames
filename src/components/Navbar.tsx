import React from 'react';
import { Menu, Search, Upload, Dices, History, Code2, Sparkles, X } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenUpload: () => void;
  onRandomGame: () => void;
  onOpenStudio: () => void;
  updatedGamesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onRandomGame,
  onOpenStudio,
  updatedGamesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/[0.08] bg-[#0d121f]/90 backdrop-blur-xl h-16">
      <div className="w-full px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Left Section: Sidebar Toggle & Mobile Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Wordmark (visible on mobile / tablet when sidebar collapsed) */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
              SS
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white font-['Outfit']">
              Sphere Strike
            </span>
          </div>
        </div>

        {/* Center Section: Search Bar (CrazyGames Style Omnibar) */}
        <div className="flex-1 max-w-xl mx-auto relative">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games, categories, creators (e.g. Strike, Space, Snake)..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-400 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/[0.08] rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Random Game / Surprise Me (CrazyGames Signature!) */}
          <button
            onClick={onRandomGame}
            title="Surprise Me (Play Random Game)"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all cursor-pointer"
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Random Game</span>
          </button>

          {/* Sandbox Studio */}
          <button
            onClick={onOpenStudio}
            title="Open Sandbox Studio"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-slate-400" />
            <span>Studio</span>
          </button>

          {/* Upload Game (Prominent Action) */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-950 transition-all cursor-pointer shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Game</span>
          </button>
        </div>
      </div>
    </header>
  );
};
