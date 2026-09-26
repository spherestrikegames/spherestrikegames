import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Lock, Unlock, KeyRound, Sparkles, 
  Check, AlertTriangle, Trash2, Edit3, Gamepad2, Users, Shield, RotateCcw,
  UserCheck, Search, UserPlus, LogIn
} from 'lucide-react';
import { AdminAccountMonitor } from './AdminAccountMonitor';
import { User } from '../types/user';

interface AdminSecretTerminalProps {
  isAdmin: boolean;
  onUnlockAdmin?: () => void;
  onLockAdmin?: () => void;
  totalGamesCount: number;
  currentUser?: User | null;
  onOpenSignup?: () => void;
  onOpenLogin?: () => void;
}

export const AdminSecretTerminal: React.FC<AdminSecretTerminalProps> = ({
  isAdmin,
  onUnlockAdmin,
  onLockAdmin,
  totalGamesCount,
  currentUser,
  onOpenSignup,
  onOpenLogin,
}) => {
  const [adminTab, setAdminTab] = useState<'security' | 'checker' | 'games'>('security');

  return (
    <section id="admin-terminal-section" className="mt-8 mb-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Glassmorphic Container */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl ${
        isAdmin 
          ? 'bg-slate-900/35 border-emerald-500/30 shadow-emerald-950/20' 
          : 'bg-slate-900/40 border-amber-500/30 shadow-amber-950/20'
      }`}>
        {/* Ambient Specular Glass Halos */}
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isAdmin ? 'bg-emerald-500/15' : 'bg-amber-500/15'
        }`} />
        <div className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isAdmin ? 'bg-cyan-500/10' : 'bg-rose-500/10'
        }`} />

        <div className="relative z-10 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all backdrop-blur-xl ${
                isAdmin
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-lg shadow-emerald-950/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-lg shadow-amber-950/40'
              }`}>
                {isAdmin ? <ShieldCheck className="w-6 h-6 animate-pulse" /> : <Lock className="w-6 h-6 text-amber-300" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-xl font-bold text-white font-['Outfit'] tracking-tight">
                    {isAdmin ? 'Admin Moderation & Security Sentinel' : 'Restricted Administrator Control Panel'}
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border backdrop-blur-md ${
                    isAdmin 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {isAdmin ? 'Admin Account Verified' : 'Registered Admins Only'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {isAdmin 
                    ? `Authenticated as @${currentUser?.username} (${currentUser?.email}). You have full clearance to inspect accounts, run AI security audits, and moderate arcade content.`
                    : 'The Sphere Strike Admin Sentinel is strictly reserved for users who register for an Administrator account.'}
                </p>
              </div>
            </div>

            {isAdmin && onLockAdmin && (
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={onLockAdmin}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/40 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lock Session</span>
                </button>
              </div>
            )}
          </div>

          {!isAdmin ? (
            /* Glassmorphism Guard: Registration Required Prompt */
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-lg font-bold text-white font-['Outfit']">
                  Administrator Registration Required
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Only accounts registered with the <span className="text-amber-400 font-semibold font-mono">admin</span> role have clearance to access this terminal. If you are authorized, register for an admin account with your passkey or sign in to your administrator profile.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenSignup}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-[0.98] text-white text-xs font-bold shadow-xl shadow-amber-950/40 border border-amber-400/30 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register as Administrator</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white text-xs font-semibold border border-white/[0.1] backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-blue-400" />
                  <span>Log In to Admin Account</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unlocked Admin Hub */
            <>
              {/* Mode Switcher Tabs for Admin */}
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAdminTab('security')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md ${
                    adminTab === 'security'
                      ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-950/50 border border-blue-400/40'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-300" />
                  <span>AI Account Monitor & Security</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('checker')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md ${
                    adminTab === 'checker'
                      ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-950/50 border border-purple-400/40'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-purple-300" />
                  <span>Account Checker</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-bold">
                    Direct Lookup
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('games')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md ${
                    adminTab === 'games'
                      ? 'bg-emerald-600/80 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/40'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 text-emerald-300" />
                  <span>Content & Games Moderation ({totalGamesCount})</span>
                </button>
              </div>

              {/* Unlocked Admin Controls Panel */}
              {adminTab === 'security' ? (
                <AdminAccountMonitor initialTab="monitor" />
              ) : adminTab === 'checker' ? (
                <AdminAccountMonitor initialTab="checker" />
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                      <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                        Admin Status
                      </div>
                      <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Authorized Moderator (@{currentUser?.username})
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                        Live Games in Database
                      </div>
                      <div className="text-sm font-bold text-white mt-1 font-mono">
                        {totalGamesCount} Registered
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                      <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                        Moderation Privileges
                      </div>
                      <div className="text-sm font-bold text-slate-200 mt-1">
                        Delete Inappropriate / Edit Any Game
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/25 backdrop-blur-xl flex items-start gap-3 text-xs text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-300">Content Moderation Active: </span>
                      Every game card across the arcade features direct 
                      <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                        <Trash2 className="w-3 h-3" /> Delete Inappropriate
                      </span> 
                      and 
                      <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">
                        <Edit3 className="w-3 h-3" /> Edit Game
                      </span> 
                      controls. You can also delete or edit any game inside the Game Player view.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
