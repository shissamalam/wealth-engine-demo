'use client';

import { Button } from '@/components/ui/button';
import { useWealthData } from '@/hooks/useWealthData';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { clearSession } from '@/lib/crypto';
import { formatDate } from '@/lib/utils';
import {
  Save,
  LogOut,
  Github,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  KeyRound,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';

// ── Hardcoded repo identity ──────────────────────────────────────────────────
const DEFAULT_OWNER = 'demo';
const DEFAULT_REPO  = 'wealth-engine-demo';

interface HeaderProps {
  onLogout: () => void;
}

type TestResult =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'ok';   login: string; repoAccess: boolean }
  | { status: 'fail'; message: string };

export function Header({ onLogout }: HeaderProps) {
  const { saveData, isSaving, hasUnsavedChanges, lastSaved, error, reloadData } = useWealthData();
  const { isConfigured, owner, repo, configure, disconnect } = useGitHubSync();

  const [configOpen, setConfigOpen]   = useState(false);
  const [token, setToken]             = useState('');
  const [showToken, setShowToken]     = useState(false);
  const [formError, setFormError]     = useState('');
  const [testResult, setTestResult]   = useState<TestResult>({ status: 'idle' });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncError, setSyncError]     = useState('');
  const prevLastSaved                 = useRef<Date | null>(null);

  // Reset form state each time the modal opens
  useEffect(() => {
    if (configOpen) {
      setToken('');
      setFormError('');
      setShowToken(false);
      setTestResult({ status: 'idle' });
    }
  }, [configOpen]);

  // Flash green for 3 s after a successful save
  useEffect(() => {
    if (lastSaved && lastSaved !== prevLastSaved.current) {
      prevLastSaved.current = lastSaved;
      setSaveSuccess(true);
      setSyncError('');
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  // ── Test connection ────────────────────────────────────────────────────────
  const handleTestConnection = async () => {
    const t = token.trim();
    if (!t) {
      setFormError('Paste your token first, then click Test.');
      return;
    }
    setFormError('');
    setTestResult({ status: 'testing' });

    try {
      // Step 1: verify the token authenticates at all
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${t}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (userRes.status === 401) {
        const body = await userRes.json().catch(() => ({}));
        setTestResult({
          status: 'fail',
          message: `Token rejected (401): ${body.message ?? 'Bad credentials'}. The token may be expired, revoked, or was copied incorrectly.`,
        });
        return;
      }

      if (!userRes.ok) {
        setTestResult({
          status: 'fail',
          message: `GitHub API error ${userRes.status}: ${userRes.statusText}`,
        });
        return;
      }

      const user = await userRes.json();
      const login: string = user.login ?? '(unknown)';

      // Step 2: check the token can read the target repo
      const repoRes = await fetch(
        `https://api.github.com/repos/${DEFAULT_OWNER}/${DEFAULT_REPO}`,
        {
          headers: {
            Authorization: `Bearer ${t}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (repoRes.status === 404) {
        setTestResult({
          status: 'fail',
          message: `Token is valid (authenticated as "${login}") but cannot see repo "${DEFAULT_OWNER}/${DEFAULT_REPO}". Make sure: (1) the repo exists and is spelled correctly, or (2) the token has the "repo" scope for private repos.`,
        });
        return;
      }

      setTestResult({ status: 'ok', login, repoAccess: repoRes.ok });
    } catch (err) {
      setTestResult({
        status: 'fail',
        message: `Network error — could not reach api.github.com. Check your internet connection.`,
      });
    }
  };

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isConfigured) {
      setSyncError('GitHub not configured — click ⚙ Settings and paste your Personal Access Token.');
      return;
    }
    setSyncError('');
    await saveData();
  };

  const handleLogout = () => {
    clearSession();
    onLogout();
  };

  // ── Config form submit ─────────────────────────────────────────────────────
  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!token.trim()) {
      setFormError('Personal Access Token is required.');
      return;
    }

    configure(DEFAULT_OWNER, DEFAULT_REPO, token.trim());
    setSyncError('');
    setConfigOpen(false);
    // Pull fresh data from GitHub immediately now that a token is available.
    // Without this, the dashboard keeps showing local placeholder data because
    // state.data is already populated from the initial no-token fallback load.
    reloadData();
  };

  const handleDisconnect = () => {
    disconnect();
    setConfigOpen(false);
  };

  // ── Save button state ──────────────────────────────────────────────────────
  const getSaveButton = () => {
    if (isSaving) {
      return { extraClass: '', disabled: true, icon: <Loader2 className="w-4 h-4 mr-2 animate-spin" />, label: 'Saving…' };
    }
    if (saveSuccess) {
      return { extraClass: 'bg-green-600 hover:bg-green-700 border-green-600', disabled: false, icon: <CheckCircle className="w-4 h-4 mr-2" />, label: 'Saved!' };
    }
    if (!isConfigured) {
      return { extraClass: 'opacity-70', disabled: false, icon: <Save className="w-4 h-4 mr-2" />, label: 'Sync with GitHub' };
    }
    return { extraClass: '', disabled: !hasUnsavedChanges, icon: <Save className="w-4 h-4 mr-2" />, label: 'Sync with GitHub' };
  };

  const btn = getSaveButton();

  return (
    <header className="bg-navy-950 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">

        {/* Brand */}
        <div>
          <h1 className="text-xl font-bold text-white">Henderson Family</h1>
          <p className="text-sm text-forest-400">Wealth Architecture & Strategy Engine</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">

          {/* Status text */}
          <div className="flex items-center gap-2 text-sm">
            {syncError && (
              <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {syncError}
              </span>
            )}
            {!syncError && hasUnsavedChanges && !saveSuccess && (
              <span className="text-yellow-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </span>
            )}
            {!syncError && lastSaved && !hasUnsavedChanges && !saveSuccess && (
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-forest-500" />
                Saved {formatDate(lastSaved)}
              </span>
            )}
            {error && !saveSuccess && (
              <span className="text-red-400 flex items-center gap-1 max-w-xs" title={error}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{error}</span>
              </span>
            )}
          </div>

          {/* Sync button */}
          <Button
            variant="default"
            onClick={handleSave}
            disabled={btn.disabled}
            className={`transition-all duration-300 ${btn.extraClass}`}
          >
            {btn.icon}
            {btn.label}
          </Button>

          {/* Settings dialog */}
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={`flex items-center gap-2 px-3 ${
                  isConfigured
                    ? 'border-forest-600/60 text-forest-400 hover:border-forest-500 hover:text-forest-300'
                    : 'border-amber-600/60 text-amber-400 hover:border-amber-500 hover:text-amber-300'
                }`}
                title="GitHub Configuration"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
                {isConfigured && <Github className="w-3.5 h-3.5 ml-0.5 text-forest-500" />}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  GitHub Sync Configuration
                </DialogTitle>
                <DialogDescription>
                  Commits{' '}
                  <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">data.json</code>{' '}
                  to your repo via the GitHub REST API. Token stored in{' '}
                  <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">localStorage</code> only.
                </DialogDescription>
              </DialogHeader>

              {/* Connection badge */}
              {isConfigured ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-forest-600/10 border border-forest-600/30 text-sm">
                  <CheckCircle className="w-4 h-4 text-forest-500 flex-shrink-0" />
                  <span className="text-forest-300">
                    Connected to{' '}
                    <span className="font-mono font-medium text-white">
                      {owner || DEFAULT_OWNER}/{repo || DEFAULT_REPO}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600/10 border border-amber-600/30 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-amber-300">Not connected — paste your token below.</span>
                </div>
              )}

              {/* Repo info (read-only) */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Target Repository</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Owner</p>
                    <p className="font-mono text-slate-200 bg-slate-900/60 px-2 py-1 rounded">{DEFAULT_OWNER}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Repository</p>
                    <p className="font-mono text-slate-200 bg-slate-900/60 px-2 py-1 rounded">{DEFAULT_REPO}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Branch: <span className="font-mono text-slate-400">main</span> &nbsp;·&nbsp; File:{' '}
                  <span className="font-mono text-slate-400">data.json</span>
                </p>
              </div>

              {/* Token input */}
              <form onSubmit={handleConfigSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Personal Access Token <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      onChange={(e) => { setToken(e.target.value); setTestResult({ status: 'idle' }); }}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="pr-10 font-mono text-sm"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Generate at{' '}
                    <span className="font-mono text-slate-400">github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)</span>.
                    {' '}Select the <code className="bg-slate-800 px-1 rounded">repo</code> scope.
                  </p>
                </div>

                {/* Test Connection button + result */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={testResult.status === 'testing'}
                    className="w-full border-slate-600 text-slate-300 hover:text-white"
                  >
                    {testResult.status === 'testing' ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Testing…</>
                    ) : (
                      <><Wifi className="w-3.5 h-3.5 mr-2" />Test Connection</>
                    )}
                  </Button>

                  {testResult.status === 'ok' && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Token is valid ✓</p>
                        <p className="text-xs text-green-500/80 mt-0.5">
                          Authenticated as <span className="font-mono">{testResult.login}</span>
                          {testResult.repoAccess
                            ? ` · repo "${DEFAULT_OWNER}/${DEFAULT_REPO}" is accessible`
                            : ` · ⚠ but cannot read repo "${DEFAULT_OWNER}/${DEFAULT_REPO}" — check the "repo" scope`}
                        </p>
                      </div>
                    </div>
                  )}

                  {testResult.status === 'fail' && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                      <WifiOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Connection failed</p>
                        <p className="text-xs text-red-400/80 mt-0.5">{testResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form-level error */}
                {formError && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {formError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    {isConfigured ? 'Update Token' : 'Connect to GitHub'}
                  </Button>
                  {isConfigured && (
                    <Button type="button" variant="destructive" onClick={handleDisconnect} className="px-4">
                      Disconnect
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Logout */}
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
