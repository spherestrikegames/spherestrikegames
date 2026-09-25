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
  isAdmin = false,
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
        </div>
      </div>
    </header>
  );
};
