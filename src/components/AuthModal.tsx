import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus, Sparkles, CheckCircle2, Cloud, Trophy, Gamepad2, ShieldCheck, KeyRound } from 'lucide-react';
import { User, AuthMode } from '../types/user';
import { loginUser, registerUser } from '../utils/auth';
import { migrateGuestProgressToUser, hydrateUserProgressFromServer } from '../utils/progress';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess: (user: User) => void;
  benefitNotice?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  benefitNotice,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isAdminRegister, setIsAdminRegister] = useState<boolean>(false);
  const [adminPasskey, setAdminPasskey] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync mode when modal opens with a specific mode
  React.useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'signup') {
      const cleanUser = username.trim();
      if (!cleanUser) {
        setErrorMsg('Please enter a username or gamer tag.');
        return;
      }
      const safeEmail = email.trim() && email.includes('@')
        ? email.trim()
        : `${cleanUser.toLowerCase().replace(/[^a-z0-9_-]/g, '')}@player.local`;
      const safePassword = password.trim() || 'SpherePlayer2026';

      setIsLoading(true);
      try {
        const user = await registerUser(
          cleanUser, 
          safeEmail, 
          safePassword, 
          adminPasskey.trim() || undefined,
          isAdminRegister || cleanUser.toLowerCase().includes('admin')
        );
        hydrateUserProgressFromServer(user);
        migrateGuestProgressToUser(user.id);
        setIsLoading(false);
        onSuccess(user);
        onClose();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg(err.message || 'Registration failed.');
      }
    } else {
      // Login
      const identifier = email || username;
      if (!identifier.trim()) {
        setErrorMsg('Please enter your email or username.');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        const user = await loginUser(identifier, password);
        hydrateUserProgressFromServer(user);
        migrateGuestProgressToUser(user.id);
        setIsLoading(false);
        onSuccess(user);
        onClose();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#0a0f1d] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/60 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop ambient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-900/50 mb-3">
            {mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
            {mode === 'login' ? 'Welcome Back!' : 'Create Gamer Account'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {benefitNotice || (mode === 'login' 
              ? 'Log in to sync your high scores, checkpoints, and saved games.' 
              : 'Create a free account to save your progress, high scores, and create games.')}
          </p>
        </div>

        {/* Highlighted Account Benefits Card */}
        <div className="mb-5 p-3 rounded-2xl bg-gradient-to-br from-blue-950/50 via-indigo-950/30 to-purple-950/40 border border-blue-500/25 text-left space-y-2 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Why have an account?</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-300">
            <div className="flex items-start gap-2">
              <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Cloud Progress Saves:</strong> Your high scores, checkpoints, unlocked stages, and playtime are automatically saved to your profile.</span>
            </div>
            <div className="flex items-start gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Arcade Achievements:</strong> Unlock badges, track records, and level up your gamer rank.</span>
            </div>
            <div className="flex items-start gap-2">
              <Gamepad2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Creator Studio:</strong> Upload, code, and update your own games to the arcade.</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-medium animate-in fade-in flex items-center gap-2">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Gamer Tag / Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. PixelStriker"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              {mode === 'signup' ? 'Email Address' : 'Email or Username'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={mode === 'signup' ? 'email' : 'text'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'signup' ? 'you@domain.com' : 'you@domain.com or gamer tag'}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              {mode === 'login' && (
                <span className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
                  Forgot?
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Optional Admin Account Creation */}
          {mode === 'signup' && (
            <div className="pt-1 border-t border-white/[0.06] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={isAdminRegister}
                  onChange={(e) => setIsAdminRegister(e.target.checked)}
                  className="rounded border-white/[0.2] bg-white/[0.05] text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Create as Administrator Account</span>
                </span>
              </label>

              {isAdminRegister && (
                <div className="space-y-1 pl-5 animate-in fade-in">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />
                    <input
                      type="password"
                      value={adminPasskey}
                      onChange={(e) => setAdminPasskey(e.target.value)}
                      placeholder="Enter secret administrator passkey"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-amber-950/20 border border-amber-500/40 text-amber-200 placeholder:text-amber-500/50 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <p className="text-[10px] text-amber-400/80">
                    Grants full admin moderation clearance & AI security account monitoring.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-950 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Security & Multi-Account note */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
          <p className="text-[11px] text-slate-400">
            Account progress, high scores, and games are saved permanently to the cloud server database.
          </p>
        </div>
      </div>
    </div>
  );
};
