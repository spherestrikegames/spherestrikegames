import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Eye, EyeOff, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the admin password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean string check against approved admin passkeys
      const cleanKey = password.trim().toLowerCase().replace(/[\s\-_.@]/g, '');
      const isKnownPasskey = ['goyalrishi', 'rishiadmin', 'macbookair'].includes(cleanKey);

      let isVerified = isKnownPasskey;

      if (!isVerified) {
        // Also query the secret accounts clearance endpoint as fallback verification
        try {
          const res = await fetch('/api/auth/secret-accounts-clearance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passkey: password.trim() })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.valid || data.success) {
              isVerified = true;
            }
          }
        } catch {
          // Fall back to cleanKey validation
        }
      }

      if (isVerified) {
        setSuccessAnim(true);
        setTimeout(() => {
          setSuccessAnim(false);
          setPassword('');
          onSuccess();
        }, 500);
      } else {
        setError('Incorrect admin password. Clearance access denied.');
      }
    } catch {
      setError('Verification service unavailable. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d121f] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-950/50 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-rose-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40">
            {successAnim ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-in zoom-in" />
            ) : (
              <Shield className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
              <span>Admin Clearance</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                Restricted
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter the admin password to access moderation & security tools.
            </p>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Admin Password
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                placeholder="Type admin password..."
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-900/90 border border-white/10 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 text-white text-sm placeholder-slate-500 outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Admin Panel</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
