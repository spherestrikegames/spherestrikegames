import React, { useState, useEffect } from 'react';
import { 
  X, Cloud, Trophy, Play, Clock, Award, Star, Flame, 
  CheckCircle2, Sparkles, User as UserIcon, LogOut, ArrowRight, ShieldCheck
} from 'lucide-react';
import { User } from '../types/user';
import { Game } from '../types/game';
import { GameProgress, UserArcadeStats } from '../types/progress';
import { getAllUserProgress, calculateUserArcadeStats } from '../utils/progress';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allGames: Game[];
  onSelectGame: (game: Game) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allGames,
  onSelectGame,
  onLogout,
}) => {
  const [progressList, setProgressList] = useState<GameProgress[]>([]);
  const [stats, setStats] = useState<UserArcadeStats | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'achievements'>('progress');

  useEffect(() => {
    if (currentUser && isOpen) {
      const list = getAllUserProgress(currentUser.id);
      setProgressList(list);
      setStats(calculateUserArcadeStats(currentUser.id));
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ${seconds % 60}s`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#090e1a] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/50 flex flex-col max-h-[90vh] font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-950">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-['Outfit']">{currentUser.username}</h2>
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" />
                  Cloud Saves Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-300 bg-white/[0.03] hover:bg-rose-950/40 border border-white/[0.08] hover:border-rose-500/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Account Benefit Highlight Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Account Benefit Active:</strong> Your game scores, checkpoints, and records are safely saved to the cloud!
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
            Auto-Sync ON
          </span>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Games Saved</span>
            <span className="text-lg sm:text-xl font-extrabold text-white font-['Outfit'] mt-0.5 block">
              {progressList.length}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Highest Score</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-400 font-['Outfit'] mt-0.5 block">
              {stats?.highestScoreOverall ? stats.highestScoreOverall.toLocaleString() : '0'}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Playtime</span>
            <span className="text-lg sm:text-xl font-extrabold text-cyan-400 font-['Outfit'] mt-0.5 block">
              {formatTime(stats?.totalPlayTimeSeconds || 0)}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 mb-3">
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Saved Game Progress ({progressList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Arcade Badges ({stats?.achievements.filter(a => a.unlockedAt).length || 0})</span>
          </button>
        </div>

        {/* Tab Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {activeTab === 'progress' ? (
            progressList.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mx-auto">
                  <Cloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No game progress saved yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Play any game in the arcade! Your high scores, checkpoints, and playtime will be automatically saved here.
                  </p>
                </div>
              </div>
            ) : (
              progressList.map(prog => {
                const gameMatch = allGames.find(g => g.id === prog.gameId);
                return (
                  <div
                    key={prog.gameId}
                    className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate font-['Outfit']">
                          {prog.gameTitle}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          Saved
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="text-amber-300 font-semibold">
                          🏆 Best: {prog.highScore.toLocaleString()} pts
                        </span>
                        <span>•</span>
                        <span>Level {prog.levelReached || 1}</span>
                        <span>•</span>
                        <span>⏱️ {formatTime(prog.totalPlayTimeSeconds)}</span>
                        {prog.checkpoints && (
                          <>
                            <span>•</span>
                            <span className="text-blue-300">💾 {prog.checkpoints}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {gameMatch && (
                      <button
                        onClick={() => {
                          onSelectGame(gameMatch);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950 shrink-0 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                    )}
                  </div>
                );
              })
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats?.achievements.map(ach => {
                const isUnlocked = Boolean(ach.unlockedAt);
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isUnlocked
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-white/[0.02] border-white/[0.05] opacity-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.04] text-slate-500'
                    }`}>
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className={`text-xs font-bold truncate ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                          {ach.title}
                        </h5>
                        {isUnlocked && (
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {ach.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
