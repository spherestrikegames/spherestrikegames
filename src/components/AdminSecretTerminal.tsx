import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Lock, Unlock, KeyRound, Sparkles, 
  Check, AlertTriangle, Trash2, Edit3, Gamepad2, Users, Shield, RotateCcw
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
  const [adminTab, setAdminTab] = useState<'security' | 'games'>('security');
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const raw = passcode.trim();
    const clean = raw.toLowerCase().replace(/[\s\-_.@]/g, '');

    // Recognized admin clearance passkeys: 'goyal.rishi', 'rishi_admin', 'macbookair'
    if (
      raw === 'goyal.rishi' || 
      clean === 'goyalrishi' || 
      clean === 'rishiadmin' || 
      clean === 'macbookair'
    ) {
      setSuccessMsg('Access Granted! Clearance authenticated.');
      localStorage.setItem('spherestrike_admin_unlocked', 'true');
      localStorage.setItem('spherestrike_admin_passkey', raw);
      setTimeout(() => {
        onUnlockAdmin();
        setPasscode('');
        setSuccessMsg('');
      }, 500);
    } else {
      setErrorMsg('Invalid clearance passkey. Access denied.');
    }
  };

  const handleRestartCode = () => {
    setPasscode('');
    setErrorMsg('');
    setSuccessMsg('');
    localStorage.removeItem('spherestrike_admin_unlocked');
    localStorage.removeItem('spherestrike_admin_passkey');
    if (isAdmin) {
      onLockAdmin();
    }
  };

  return (
    <section id="admin-terminal-section" className="mt-14 mb-8 max-w-5xl mx-auto px-4 sm:px-6">
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 p-6 sm:p-8 backdrop-blur-xl ${
        isAdmin 
          ? 'bg-[#0f1a18]/90 border-emerald-500/30 shadow-2xl shadow-emerald-950/40' 
          : 'bg-[#0b101d]/90 border-blue-500/25 shadow-xl shadow-blue-950/30'
      }`}>
        {/* Ambient Glow */}
        <div className={`absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isAdmin ? 'bg-emerald-500/20' : 'bg-blue-600/15'
        }`} />
        <div className={`absolute -bottom-20 -left-20 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isAdmin ? 'bg-amber-500/15' : 'bg-indigo-600/15'
        }`} />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                isAdmin
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950'
                  : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950 border border-blue-400/30'
              }`}>
                {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <KeyRound className="w-5 h-5 text-amber-300" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] tracking-tight">
                    {isAdmin ? 'Admin Moderation & AI Security Hub' : 'Secret Accounts Clearance Terminal'}
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    isAdmin 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {isAdmin ? 'Clearance Active' : 'Passkey Protected'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAdmin 
                    ? 'Full moderation controls unlocked: monitor accounts with Gemini AI, reset accounts, and delete inappropriate content.'
                    : 'Enter the secret access passkey to authenticate admin clearance and unlock moderation controls.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleRestartCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.1] text-xs font-semibold transition-all cursor-pointer"
                title="Restart passkey code session and clear inputs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Restart Code</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={onLockAdmin}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lock Terminal</span>
                </button>
              )}
            </div>
          </div>

          {!isAdmin ? (
            /* Locked State: Code Input Form */
            <div className="p-6 rounded-2xl bg-[#090e1a]/80 border border-white/[0.06] space-y-4">
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      Enter Accounts Clearance Code
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono font-normal">Passkey Clearance</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="password"
                        value={passcode}
                        onChange={(e) => {
                          setPasscode(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Enter admin clearance passkey..."
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/[0.1] focus:border-blue-500 text-white text-xs sm:text-sm font-mono placeholder-slate-500 focus:outline-none transition-all"
                        autoComplete="off"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-950 border border-blue-400/30 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      <Unlock className="w-4 h-4 text-amber-300" />
                      <span>Unlock Clearance</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRestartCode}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </form>
            </div>
          ) : (
            /* Unlocked Admin Hub */
            <>
              {/* Mode Switcher Tabs for Admin */}
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
                  <span>AI Account Monitor & Security</span>
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

              {/* Unlocked Admin Controls Panel */}
              {adminTab === 'security' ? (
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
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
