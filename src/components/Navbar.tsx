import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Edit3, X, LogIn, UserPlus, LogOut, User as UserIcon, ChevronDown, Sparkles, ShieldCheck, Cloud, Trophy } from 'lucide-react';
import { SphereStrikeLogo } from './SphereStrikeLogo';
import { User } from '../types/user';

interface NavbarProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleCreatedGames: () => void;
  myCreatedGamesCount: number;
  currentUser?: User | null;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
  onLogout?: () => void;
  isAdmin?: boolean;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onToggleCreatedGames,
  myCreatedGamesCount,
  currentUser,
  onOpenLogin,
  onOpenSignup,
  onLogout,
  isAdmin = false,
  onOpenProfile,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Logo (visible on mobile / tablet when sidebar collapsed) */}
          <div className="flex items-center md:hidden">
            <SphereStrikeLogo variant="horizontal" size="sm" />
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-xl mx-auto relative">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search 65 arcade games, categories, tags..."
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

        {/* Right Section: Actions & Auth */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Admin Mode Active Badge */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('admin-terminal-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              title="Admin Mode Active — Click to jump to Account Sentinel & Moderation Terminal"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Admin Sentinel</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping hidden md:inline" />
            </button>
          )}

          {/* Side Mode: My Created Games Button */}
          <button
            onClick={onToggleCreatedGames}
            title="View & edit games you made"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/30 hover:border-amber-500/60 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">My Games</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {myCreatedGamesCount}
            </span>
          </button>

          {/* User Account Controls */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-inner overflow-hidden">
                  {(currentUser.avatar || currentUser.avatarUrl) ? (
                    <img src={currentUser.avatar || currentUser.avatarUrl} alt={currentUser.username} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    currentUser.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[100px]">
                    {currentUser.username}
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Lvl {currentUser.stats?.level || 1}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{currentUser.username}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded-lg">
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Trophy className="w-3 h-3" /> {currentUser.stats?.highScore || (currentUser.highScores ? Math.max(0, ...Object.values(currentUser.highScores)) : 0)} pts
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-blue-400 font-medium">
                        {currentUser.gamesCreatedCount || 0} games
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-blue-400" />
                    <span>View Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Log In</span>
              </button>

              <button
                type="button"
                onClick={onOpenSignup}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
