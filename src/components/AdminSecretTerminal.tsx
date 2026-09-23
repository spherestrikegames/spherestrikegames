import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Lock, Unlock, KeyRound, Sparkles, 
  Check, AlertTriangle, Trash2, Edit3, Gamepad2, Users, Shield
} from 'lucide-react';
import { AdminAccountMonitor } from './AdminAccountMonitor';

interface AdminSecretTerminalProps {
  isAdmin: boolean;
  onUnlockAdmin: () => void;
  onLockAdmin: () => void;
  totalGamesCount: number;
}

export const AdminSecretTerminal: React.FC<AdminSecretTerminalProps> = ({
  isAdmin,
  onUnlockAdmin,
  onLockAdmin,
  totalGamesCount,
}) => {
  const [code, setCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'security' | 'games'>('security');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Code is 'MacBookAir' (no spaces, case-insensitive)
    if (code.trim().toLowerCase() === 'macbookair') {
      onUnlockAdmin();
      setSuccessNotice(true);
      setCode('');
      setTimeout(() => setSuccessNotice(false), 4000);
    } else {
      setErrorMsg('Incorrect secret code. Access denied.');
    }
  };

  return (
    <section className="mt-14 mb-8 max-w-5xl mx-auto px-4 sm:px-6">
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 p-6 sm:p-8 backdrop-blur-xl ${
        isAdmin 
          ? 'bg-[#0f1a18]/90 border-emerald-500/30 shadow-2xl shadow-emerald-950/40' 
          : 'bg-[#0b101d]/80 border-white/[0.08] shadow-xl'
      }`}>
        {/* Ambient Glow */}
        <div className={`absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isAdmin ? 'bg-emerald-500/20' : 'bg-blue-600/10'
        }`} />
        <div className={`absolute -bottom-20 -left-20 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isAdmin ? 'bg-amber-500/15' : 'bg-indigo-600/10'
        }`} />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                isAdmin
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950'
                  : 'bg-white/[0.05] border border-white/[0.08] text-slate-400'
              }`}>
                {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <KeyRound className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] tracking-tight">
                    {isAdmin ? 'Admin Moderation & AI Security Hub' : 'Secret Access Terminal'}
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    isAdmin 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                      : 'bg-white/[0.05] text-slate-400 border-white/[0.08]'
                  }`}>
                    {isAdmin ? 'Clearance Active' : 'Passkey Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAdmin 
                    ? 'Full moderation controls unlocked: monitor accounts with Gemini AI and delete inappropriate games.'
                    : 'Scroll down terminal: Enter secret clearance code to unlock admin moderation & security controls.'}
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={onLockAdmin}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-white/[0.1] hover:border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock / Exit Admin</span>
              </button>
            )}
          </div>

          {/* Mode Switcher Tabs for Admin */}
          {isAdmin && (
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <button
                type="button"
                onClick={() => setAdminTab('security')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'security'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950 border border-blue-400/30'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-300" />
                <span>AI Account Monitor & Security (Hourly)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('games')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'games'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950 border border-emerald-400/30'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-emerald-300" />
                <span>Content & Games Moderation ({totalGamesCount})</span>
              </button>
            </div>
          )}

          {/* Success Banner when just unlocked */}
          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Admin clearance granted! AI Security Account Monitoring & Content Moderation tools are now active.</span>
            </div>
          )}

          {/* Unlocked Admin Controls Panel */}
          {isAdmin ? (
            adminTab === 'security' ? (
              <AdminAccountMonitor />
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      Admin Status
                    </div>
                    <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Authorized Moderator
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Live Games in Database
                    </div>
                    <div className="text-sm font-bold text-white mt-1 font-mono">
                      {totalGamesCount} Registered
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                      Moderation Privileges
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-1">
                      Delete Inappropriate / Edit Any Game
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 flex items-start gap-3 text-xs text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-300">Content Moderation Active: </span>
                    Every game card across the arcade now features direct 
                    <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[11px] font-semibold">
                      <Trash2 className="w-3 h-3" /> Delete Inappropriate
                    </span> 
                    and 
                    <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40 text-[11px] font-semibold">
                      <Edit3 className="w-3 h-3" /> Edit Game
                    </span> 
                    buttons. You can also delete or edit any game inside the Game Player view.
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Passkey Entry Form */
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Enter secret code..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.09] border border-white/[0.1] focus:border-blue-500 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-950 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Authorize</span>
                </button>
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 font-mono">
                Security clearance level: System Administrator. Grants AI Account Monitoring, Blocking, and Content Moderation.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

