import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, ShieldCheck, Lock, Unlock, RefreshCw, Sparkles, 
  Search, Filter, UserX, UserCheck, AlertTriangle, Clock, 
  Zap, CheckCircle2, AlertOctagon, Info, Database, Download, Upload, HardDrive, Trash2,
  UserPlus, X
} from 'lucide-react';
import { User } from '../types/user';
import { AiAuditReport } from '../types/admin';
import { 
  fetchAllUsers, blockUserAccount, unblockUserAccount, unblockAllUserAccounts,
  triggerAiSecurityAudit, fetchAiAuditStatus, exportAccountsBackupApi, importAccountsBackupApi,
  deleteUserAccountApi, resetAllAccountsApi, registerAccountWithAiApi
} from '../utils/api';

interface AdminAccountMonitorProps {
  initialTab?: 'monitor' | 'checker';
}

export const AdminAccountMonitor: React.FC<AdminAccountMonitorProps> = ({
  initialTab = 'monitor'
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditReport, setAuditReport] = useState<AiAuditReport | null>(null);
  const [lastAuditTime, setLastAuditTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isUnblockingAll, setIsUnblockingAll] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'blocked' | 'active'>('all');
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Account Checker Tool state
  const [activeSubTab, setActiveSubTab] = useState<'monitor' | 'checker'>(initialTab);
  const [checkerQuery, setCheckerQuery] = useState<string>('');
  const [checkedAccount, setCheckedAccount] = useState<User | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState<boolean>(false);
  const [checkerResultMsg, setCheckerResultMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  // On-demand AI account registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'user' | 'admin'>('user');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regError, setRegError] = useState<string>('');

  // Load users & audit report status
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedUsers, auditData] = await Promise.all([
        fetchAllUsers(),
        fetchAiAuditStatus()
      ]);
      setUsers(fetchedUsers);
      setAuditReport(auditData.report);
      if (auditData.lastAuditTime) {
        setLastAuditTime(auditData.lastAuditTime);
      }
    } catch (err) {
      console.error('Failed to load user monitor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Trigger manual AI security audit call
  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    setActionNotice(null);
    try {
      const report = await triggerAiSecurityAudit();
      setAuditReport(report);
      if (report.timestamp) {
        setLastAuditTime(report.timestamp);
      }
      
      // Refresh users
      const updatedUsers = await fetchAllUsers();
      setUsers(updatedUsers);
      
      setActionNotice('✨ Gemini AI Account Identification complete! All user profiles analyzed.');
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      console.error('AI Security Audit failed:', err);
      setActionNotice('⚠️ AI Security Audit error: ' + (err.message || 'Check server connection.'));
    } finally {
      setIsAuditing(false);
    }
  };

  // On-demand AI account registration
  const handleAiRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regUsername.trim()) {
      setRegError('Please enter a username or gamer tag.');
      return;
    }
    setIsRegistering(true);
    try {
      const res = await registerAccountWithAiApi({
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword.trim() || undefined,
        role: regRole
      });
      if (res.success) {
        setIsRegisterModalOpen(false);
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegRole('user');
        setActionNotice(`🤖 ${res.message} AI Identification: "${res.aiAnalysis?.riskCategory || 'Active Player'}"`);
        setTimeout(() => setActionNotice(null), 6000);
        await loadData();
      } else {
        setRegError(res.message || 'Failed to register account.');
      }
    } catch (err: any) {
      setRegError(err.message || 'Error registering account with AI.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Block account
  const handleBlockUser = async (userId: string, username: string) => {
    const reason = customReason.trim() || 'Blocked by administrator due to policy violation.';
    const result = await blockUserAccount(userId, reason);
    if (result.success) {
      setActionNotice(`🔒 Account @${username} has been BLOCKED.`);
      setTimeout(() => setActionNotice(null), 4000);
      setBlockingUserId(null);
      setCustomReason('');
      loadData();
    } else {
      alert('Failed to block account: ' + (result.message || 'Unknown error'));
    }
  };

  // Unblock account
  const handleUnblockUser = async (userId: string, username: string) => {
    const result = await unblockUserAccount(userId);
    if (result.success) {
      setActionNotice(`🔓 Account @${username} has been UNBLOCKED.`);
      setTimeout(() => setActionNotice(null), 4000);
      loadData();
    } else {
      alert('Failed to unblock account: ' + (result.message || 'Unknown error'));
    }
  };

  // Bulk unblock all user accounts on the site
  const handleUnblockAllAccounts = async () => {
    if (!window.confirm('Are you sure you want to unblock ALL user accounts? This will immediately restore full access to every account.')) {
      return;
    }
    setIsUnblockingAll(true);
    try {
      const result = await unblockAllUserAccounts();
      if (result.success) {
        setActionNotice(`🛡️ ${result.message || 'All user accounts have been successfully unblocked!'}`);
        await loadData();
        setTimeout(() => setActionNotice(null), 5000);
      } else {
        alert(result.message || 'Failed to unblock all accounts');
      }
    } catch (err: any) {
      alert('Error unblocking accounts: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUnblockingAll(false);
    }
  };

  // Clear AI flags manually
  const handleClearFlags = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, isFlagged: false, suspiciousScore: 5, flagReason: undefined };
      }
      return u;
    }));
    setActionNotice('Flag dismissed for account.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleDeleteAccount = async (userId: string, username: string) => {
    if (window.confirm(`Permanently delete account @${username}? This action cannot be undone.`)) {
      const ok = await deleteUserAccountApi(userId);
      if (ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setActionNotice(`Account @${username} was deleted.`);
        setTimeout(() => setActionNotice(null), 3500);
      } else {
        setActionNotice(`Failed to delete account @${username}.`);
        setTimeout(() => setActionNotice(null), 3500);
      }
    }
  };

  // Reset and wipe all user accounts
  const handleResetAllAccounts = async () => {
    if (!window.confirm('⚠️ ARE YOU SURE YOU WANT TO RESET ALL ACCOUNTS?\n\nThis will completely wipe and reset all accounts from the database and local storage. This action cannot be undone.')) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await resetAllAccountsApi();
      if (res.success) {
        setUsers([]);
        setActionNotice(`🧹 ${res.message || 'All accounts have been reset successfully.'}`);
        setTimeout(() => setActionNotice(null), 5000);
      } else {
        alert(res.message || 'Failed to reset accounts.');
      }
    } catch (err: any) {
      alert('Error resetting accounts: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
      loadData();
    }
  };

  // Export all accounts JSON backup for saving lots of accounts data
  const handleExportBackup = async () => {
    try {
      const data = await exportAccountsBackupApi();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spherestrike_accounts_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionNotice(`💾 Backup downloaded! Saved ${data.totalAccounts} accounts with all progress & stats.`);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert('Failed to export accounts backup: ' + err.message);
    }
  };

  // Import accounts JSON backup
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const result = await importAccountsBackupApi(parsed);
        setActionNotice(`✅ ${result.message}`);
        setTimeout(() => setActionNotice(null), 6000);
        loadData();
      } catch (err: any) {
        alert('Failed to import backup: ' + (err.message || 'Invalid JSON file format'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered users list
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'flagged') return user.isFlagged || (user.suspiciousScore && user.suspiciousScore >= 60);
    if (statusFilter === 'blocked') return user.isBlocked;
    if (statusFilter === 'active') return !user.isBlocked && !user.isFlagged && (!user.suspiciousScore || user.suspiciousScore < 60);

    return true;
  });

  const totalCount = users.length;
  const flaggedCount = users.filter(u => u.isFlagged || (u.suspiciousScore || 0) >= 60).length;
  const blockedCount = users.filter(u => u.isBlocked).length;
  const activeCount = users.filter(u => !u.isBlocked && !u.isFlagged && (u.suspiciousScore || 0) < 60).length;

  const threatLevel = auditReport?.threatLevel || (flaggedCount > 2 ? 'HIGH' : flaggedCount > 0 ? 'MEDIUM' : 'LOW');

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Threat & Schedule Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Threat Level */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              AI System Threat Level
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-base font-extrabold uppercase font-mono ${
                threatLevel === 'CRITICAL' ? 'text-rose-500 animate-pulse' :
                threatLevel === 'HIGH' ? 'text-orange-400' :
                threatLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {threatLevel} THREAT
              </span>
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${
            threatLevel === 'CRITICAL' || threatLevel === 'HIGH' 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : threatLevel === 'MEDIUM' 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* Total Registered Accounts */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Registered Accounts
            </span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {totalCount} Total
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Flagged / Suspicious Accounts */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Flagged / Suspicious
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono flex items-center gap-2">
              {flaggedCount}
              {flaggedCount > 0 && <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">Action Needed</span>}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Blocked Accounts */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Blocked Accounts
            </span>
            <div className="text-xl font-bold text-rose-400 mt-1 font-mono">
              {blockedCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-navigation switcher within AdminAccountMonitor */}
      <div className="flex items-center gap-2 bg-slate-900/30 p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md ${
            activeSubTab === 'monitor'
              ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-950/40 border border-blue-400/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-blue-300" />
          <span>Live Sentinel & Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('checker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md ${
            activeSubTab === 'checker'
              ? 'bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white shadow-lg shadow-purple-950/40 border border-purple-400/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 text-purple-300" />
          <span>Account Checker Tool</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30">
            Inspector
          </span>
        </button>
      </div>

      {/* Dedicated Interactive Account Checker View */}
      {activeSubTab === 'checker' && (
        <div className="p-6 rounded-3xl bg-slate-900/25 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                  AI Account Checker & Security Inspector
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Lookup any user account across the database to inspect security risk, score patterns, ban status, and creator actions in real-time.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAiAudit}
              disabled={isAuditing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950 border border-purple-400/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing Database...' : 'Run Full AI Audit'}</span>
            </button>
          </div>

          {/* Quick Lookup Form */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-purple-400" />
              <span>Account Search & Verification Query</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={checkerQuery}
                onChange={(e) => {
                  setCheckerQuery(e.target.value);
                  setCheckerResultMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const q = checkerQuery.trim().toLowerCase();
                    const match = users.find(u => 
                      u.username.toLowerCase() === q || 
                      u.email.toLowerCase() === q || 
                      u.id.toLowerCase() === q
                    );
                    if (match) {
                      setCheckedAccount(match);
                      setCheckerResultMsg(`✓ Account found: @${match.username}`);
                    } else {
                      setCheckedAccount(null);
                      setCheckerResultMsg(`No registered account found matching "${checkerQuery}"`);
                    }
                  }
                }}
                placeholder="Enter exact username (e.g. Arcader), email, or User ID..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#070b14] border border-white/[0.1] focus:border-purple-500 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const q = checkerQuery.trim().toLowerCase();
                  if (!q) {
                    setCheckerResultMsg('Please enter a username or email to check.');
                    return;
                  }
                  setIsCheckingAccount(true);
                  setTimeout(() => {
                    const match = users.find(u => 
                      u.username.toLowerCase() === q || 
                      u.email.toLowerCase() === q || 
                      u.id.toLowerCase() === q
                    );
                    if (match) {
                      setCheckedAccount(match);
                      setCheckerResultMsg(`✓ Account verification complete: @${match.username}`);
                    } else {
                      setCheckedAccount(null);
                      setCheckerResultMsg(`No registered account found matching "${checkerQuery}"`);
                    }
                    setIsCheckingAccount(false);
                  }, 200);
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-950 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Check Account</span>
              </button>
            </div>

            {checkerResultMsg && (
              <p className={`text-xs font-mono mt-1 ${checkerResultMsg.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {checkerResultMsg}
              </p>
            )}
          </div>

          {/* Account Inspection Card */}
          {checkedAccount ? (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-purple-500/30 backdrop-blur-2xl space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/80 to-indigo-600/80 flex items-center justify-center text-white font-bold text-base shadow-inner overflow-hidden border border-purple-400/30 backdrop-blur-md">
                    {(checkedAccount.avatar || checkedAccount.avatarUrl) ? (
                      <img src={checkedAccount.avatar || checkedAccount.avatarUrl} alt={checkedAccount.username} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      checkedAccount.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-white font-mono">@{checkedAccount.username}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border backdrop-blur-md ${
                        checkedAccount.isBlocked 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                          : checkedAccount.isFlagged 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {checkedAccount.isBlocked ? 'BLOCKED' : checkedAccount.isFlagged ? 'FLAGGED' : 'ACTIVE / CLEAN'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.1] backdrop-blur-md">
                        Role: {checkedAccount.role || 'user'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{checkedAccount.email} • ID: {checkedAccount.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {checkedAccount.isBlocked ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleUnblockUser(checkedAccount.id, checkedAccount.username);
                        setCheckedAccount({ ...checkedAccount, isBlocked: false });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md backdrop-blur-md flex items-center gap-1.5 border border-emerald-400/30"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unblock Account</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBlockUser(checkedAccount.id, checkedAccount.username)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md backdrop-blur-md flex items-center gap-1.5 border border-rose-400/30"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Block Account</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      await handleDeleteAccount(checkedAccount.id, checkedAccount.username);
                      setCheckedAccount(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </button>
                </div>
              </div>

              {/* Account Details Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Suspicious Score</span>
                  <div className={`text-base font-bold font-mono mt-1 ${
                    (checkedAccount.suspiciousScore || 0) >= 60 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {checkedAccount.suspiciousScore || 5}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Games Created</span>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {checkedAccount.gamesCreatedCount || 0}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
                  <span className="text-[10px] font-mono uppercase text-slate-400">High Score</span>
                  <div className="text-base font-bold font-mono text-amber-400 mt-1">
                    {checkedAccount.stats?.highScore || (checkedAccount.highScores ? Math.max(0, ...Object.values(checkedAccount.highScores)) : 0)} pts
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Member Since</span>
                  <div className="text-xs font-medium text-slate-300 mt-1 truncate">
                    {new Date(checkedAccount.joinedAt || checkedAccount.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {checkedAccount.aiExplanation && (
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 backdrop-blur-md">
                  <span className="font-bold">AI Security Analysis:</span> {checkedAccount.aiExplanation}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.1] backdrop-blur-md text-center text-slate-400 text-xs font-mono">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-purple-400 opacity-60" />
              <p>Type any username or email in the box above to inspect account credentials and security flags.</p>
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400">Quick suggestions:</span>
                {users.slice(0, 4).map(u => (
                  <button
                    key={`quick-${u.id}`}
                    type="button"
                    onClick={() => {
                      setCheckerQuery(u.username);
                      setCheckedAccount(u);
                      setCheckerResultMsg(`✓ Account loaded: @${u.username}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-purple-300 text-[11px] font-mono transition-colors cursor-pointer border border-white/[0.06] backdrop-blur-sm"
                  >
                    @{u.username}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/30 border border-blue-500/25 shadow-xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white font-['Outfit']">
                Multi-Account Cloud Storage & Backup Hub
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
                High-Capacity Ready (10,000+ Accounts)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              All account credentials, high scores, checkpoints, favorites, and creator uploads are permanently saved to disk (<code className="text-blue-300 font-mono">data/users.json</code>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.1] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            title="Import/Restore user accounts from JSON backup file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Restore Backup</span>
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-blue-950 border border-blue-400/30 transition-all cursor-pointer flex items-center gap-1.5"
            title="Download full JSON backup of all registered accounts & progress"
          >
            <Download className="w-3.5 h-3.5 text-blue-200" />
            <span>Download Accounts JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetAllAccounts}
            className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 active:scale-[0.98] text-rose-300 hover:text-white border border-rose-500/40 shadow-lg shadow-rose-950/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Reset and clear all registered accounts from database and storage"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset Accounts</span>
          </button>
        </div>
      </div>

      {/* On-Demand AI Account Identification & Registration Hub */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/40 border border-blue-500/25 shadow-xl backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/80 to-indigo-600/80 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-900/50 backdrop-blur-md border border-blue-400/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white font-['Outfit']">
                On-Demand Gemini AI Account Identification Hub
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase tracking-wider backdrop-blur-md">
                Click-To-Scan / On Demand
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {auditReport?.summary || 'Register new accounts with automatic AI profile identification, or trigger on-demand scans to evaluate accounts, creation patterns, and bot behaviors.'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                Hourly background scans disabled. Trigger registration or AI evaluation with the buttons on the right.
              </span>
              {lastAuditTime && (
                <span>Last scan: {new Date(lastAuditTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsRegisterModalOpen(true);
              setRegError('');
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-emerald-950/40 border border-emerald-400/30 backdrop-blur-md transition-all cursor-pointer flex items-center gap-2"
            title="Register a new user account with immediate Gemini AI profile identification"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Register Account with AI</span>
          </button>

          <button
            type="button"
            onClick={handleRunAiAudit}
            disabled={isAuditing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-blue-950/40 border border-blue-400/30 backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
            <span>{isAuditing ? 'Identifying Accounts...' : 'Run AI Account Identification'}</span>
          </button>
        </div>
      </div>

      {/* On-Demand AI Account Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900/60 border border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-blue-950/60 backdrop-blur-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    Register Account with AI Identification
                  </h3>
                  <p className="text-xs text-slate-400">
                    Creates account & runs immediate Gemini AI profile evaluation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAiRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Gamer Tag / Username
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. CyberNinja, StarLord"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="player@domain.com (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Defaults to SpherePlayer2026 if blank"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('user')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      regRole === 'user'
                        ? 'bg-blue-600 text-white border-blue-400/40 shadow-sm'
                        : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    Active Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      regRole === 'admin'
                        ? 'bg-emerald-600 text-white border-emerald-400/40 shadow-sm'
                        : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-emerald-950 border border-emerald-400/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-amber-300 ${isRegistering ? 'animate-spin' : ''}`} />
                  <span>{isRegistering ? 'Identifying & Registering...' : 'Register & AI-Identify Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* High-Priority: Reported Suspicious Behavior Action Deck */}
      {users.some(u => (u.isFlagged || (u.suspiciousScore || 0) >= 60) && !u.isBlocked) && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-red-950/50 to-amber-950/40 border border-rose-500/50 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <span>🚨 Suspicious Behavior Reported by AI</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/50 font-bold uppercase">
                    Admin Action Required
                  </span>
                </h4>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  The AI security audit detected high-risk activity on the following accounts. You can block them immediately below.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-2">
            {users
              .filter(u => (u.isFlagged || (u.suspiciousScore || 0) >= 60) && !u.isBlocked)
              .map(susUser => (
                <div 
                  key={`sus-alert-${susUser.id}`}
                  className="p-3.5 rounded-xl bg-black/50 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm font-mono">@{susUser.username}</span>
                      <span className="text-xs text-slate-400 font-mono">({susUser.email})</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        Risk: {susUser.suspiciousScore || 85}%
                      </span>
                      {susUser.aiRiskCategory && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {susUser.aiRiskCategory}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rose-200/90 font-mono">
                      <strong>AI Report:</strong> {susUser.aiExplanation || susUser.flagReason || 'Unusual creation frequency or score tampering detected.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleBlockUser(susUser.id, susUser.username)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-rose-950 border border-rose-400/40 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Block Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearFlags(susUser.id)}
                      className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                    >
                      Dismiss Flag
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts by username or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-blue-500 text-white text-xs placeholder-slate-500 focus:outline-none transition-all font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('flagged')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'flagged' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            🚨 Flagged ({flaggedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('blocked')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'blocked' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            🔒 Blocked ({blockedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            ✅ Clean ({activeCount})
          </button>
        </div>
      </div>

      {/* Accounts Monitoring Table / List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
            <p>Loading accounts database and AI security records...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-slate-400 text-xs font-mono">
            No accounts match the current filter criteria.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const risk = user.suspiciousScore || 5;
            const isHighRisk = risk >= 60;
            const isBlocked = !!user.isBlocked;

            return (
              <div 
                key={user.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  isBlocked
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : isHighRisk
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* User Profile Summary */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                      isBlocked
                        ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                        : isHighRisk
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                    }`}>
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm font-['Outfit']">
                          @{user.username}
                        </span>
                        
                        {/* Status Badges */}
                        {isBlocked ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> BLOCKED
                          </span>
                        ) : isHighRisk ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> SUSPICIOUS FLAG
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                            ACTIVE
                          </span>
                        )}

                        {user.aiRiskCategory && (
                          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            {user.aiRiskCategory}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3 font-mono">
                        <span>{user.email}</span>
                        <span>•</span>
                        <span>Joined: {new Date(user.joinedAt).toLocaleDateString()}</span>
                      </div>

                      {/* AI Audit Explanation */}
                      {(user.aiExplanation || user.flagReason || isBlocked) && (
                        <div className={`mt-2 p-2.5 rounded-xl text-xs font-mono border ${
                          isBlocked
                            ? 'bg-rose-950/50 text-rose-200 border-rose-500/30'
                            : isHighRisk
                            ? 'bg-amber-950/40 text-amber-200 border-amber-500/30'
                            : 'bg-black/30 text-slate-300 border-white/[0.05]'
                        }`}>
                          <span className="font-bold text-slate-200">AI Security Evaluation: </span>
                          {isBlocked ? (user.blockedReason || user.aiExplanation || 'Blocked by administrator.') : (user.aiExplanation || user.flagReason)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: AI Risk Meter & Block Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                    {/* Risk Bar */}
                    <div className="w-36 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono font-semibold">
                        <span className="text-slate-400">AI Risk Score</span>
                        <span className={risk >= 60 ? 'text-rose-400 font-bold' : risk >= 30 ? 'text-amber-400' : 'text-emerald-400'}>
                          {risk}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            risk >= 60 ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                            risk >= 30 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${risk}%` }}
                        />
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {isBlocked ? (
                        <button
                          type="button"
                          onClick={() => handleUnblockUser(user.id, user.username)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unblock Account</span>
                        </button>
                      ) : (
                        <>
                          {user.isFlagged && (
                            <button
                              type="button"
                              onClick={() => handleClearFlags(user.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                              title="Clear flags and restore clean status"
                            >
                              Clear Flag
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (blockingUserId === user.id) {
                                setBlockingUserId(null);
                              } else {
                                setBlockingUserId(user.id);
                                setCustomReason(user.aiExplanation || 'Blocked by administrator due to suspicious activity.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Block Account</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(user.id, user.username)}
                            className="p-1.5 rounded-xl bg-red-950/40 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title={`Permanently delete @${user.username}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Block Reason Form Popover */}
                {blockingUserId === user.id && !isBlocked && (
                  <div className="mt-3 pt-3 border-t border-rose-500/30 flex flex-col sm:flex-row gap-2.5 animate-in fade-in">
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Specify block reason for this account..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-rose-500/40 text-white text-xs font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleBlockUser(user.id, user.username)}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Confirm Block
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockingUserId(null)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
