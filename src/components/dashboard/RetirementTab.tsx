'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AllocationChart } from '@/components/charts/AllocationChart';
import { useWealthData } from '@/hooks/useWealthData';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  Pencil,
  Check,
  X,
  Building2,
  TrendingUp,
  Wallet,
  Plus,
  LucideIcon,
  Target,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Holding, RetirementAccount } from '@/types/wealth';
import { RetirementScenario } from '@/lib/calculations';

// ─── AccountCard lives OUTSIDE RetirementTab so its reference is stable
// across re-renders and inputs never lose focus mid-type. ──────────────────
interface AccountCardProps {
  accountKey: string;
  account: RetirementAccount;
  icon: LucideIcon;
  iconColor: string;
  badge?: string;
  editingAccount: string | null;
  editBalance: number;
  editHoldings: Holding[];
  onEdit: (accountKey: string, balance: number, holdings?: Holding[]) => void;
  onSave: (accountKey: string) => void;
  onCancel: () => void;
  onBalanceChange: (v: number) => void;
  onAddHolding: () => void;
  onRemoveHolding: (idx: number) => void;
  onUpdateHolding: (idx: number, field: keyof Holding, value: string | number) => void;
}

function AccountCard({
  accountKey,
  account,
  icon: Icon,
  iconColor,
  badge,
  editingAccount,
  editBalance,
  editHoldings,
  onEdit,
  onSave,
  onCancel,
  onBalanceChange,
  onAddHolding,
  onRemoveHolding,
  onUpdateHolding,
}: AccountCardProps) {
  const isEditing = editingAccount === accountKey;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {account.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">
                {badge}
              </span>
            )}
            {!isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(accountKey, account.balance, account.holdings)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onSave(accountKey)}>
                  <Check className="w-4 h-4 text-forest-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onCancel}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            {/* Direct balance input — shown only when no holdings are defined */}
            {editHoldings.length === 0 && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Total Balance</label>
                <Input
                  type="number"
                  value={editBalance}
                  onChange={(e) => onBalanceChange(parseFloat(e.target.value) || 0)}
                  className="text-lg font-bold"
                  autoFocus
                />
              </div>
            )}

            {/* Per-fund holdings table */}
            {editHoldings.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1 text-xs text-slate-500 px-0.5">
                  <span className="w-16">Ticker</span>
                  <span className="flex-1">Fund Name</span>
                  <span className="w-24 text-right pr-1">Value ($)</span>
                  <span className="w-8" />
                </div>
                {editHoldings.map((holding, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <Input
                      className="w-16 h-8 text-xs px-2"
                      placeholder="VTSAX"
                      value={holding.ticker}
                      onChange={(e) =>
                        onUpdateHolding(idx, 'ticker', e.target.value.toUpperCase())
                      }
                    />
                    <Input
                      className="flex-1 h-8 text-xs px-2"
                      placeholder="Fund name"
                      value={holding.name}
                      onChange={(e) => onUpdateHolding(idx, 'name', e.target.value)}
                    />
                    <Input
                      className="w-24 h-8 text-xs px-2"
                      type="number"
                      placeholder="0"
                      value={holding.value || ''}
                      onChange={(e) =>
                        onUpdateHolding(idx, 'value', parseFloat(e.target.value) || 0)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => onRemoveHolding(idx)}
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(editHoldings.reduce((s, h) => s + h.value, 0))}
                  </span>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-forest-400 hover:text-forest-300 h-7 text-xs gap-1 px-2"
              onClick={onAddHolding}
            >
              <Plus className="w-3 h-3" />
              Add Fund
            </Button>
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-white">{formatCurrency(account.balance)}</p>

            {account.holdings && account.holdings.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Index Fund Holdings</p>
                {account.holdings.map((holding) => (
                  <div
                    key={holding.ticker}
                    className="flex justify-between items-center p-2 bg-slate-800/50 rounded"
                  >
                    <div>
                      <span className="font-medium text-slate-200">{holding.ticker}</span>
                      <span className="text-xs text-slate-500 ml-2">{holding.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-300">{formatCurrency(holding.value)}</div>
                      {holding.shares > 0 && (
                        <div className="text-xs text-slate-500">
                          {holding.shares.toFixed(3)} shares
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {'vestingPercent' in account && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Vesting</span>
                  <span className="text-slate-300">{account.vestingPercent}%</span>
                </div>
                <Progress value={account.vestingPercent} />
              </div>
            )}

            {'riskScore' in account && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-slate-400">Risk Score:</span>
                <span className="text-sm font-medium text-slate-200">
                  {account.riskScore}/10
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── RetirementScenarioCard lives OUTSIDE RetirementTab ────────────────────
interface ScenarioCardProps {
  scenario: RetirementScenario;
}

function RetirementScenarioCard({ scenario }: ScenarioCardProps) {
  const { targetAge, yearsUntil, projectedPortfolio, projectedInheritances, ssAnnualIncome, targetNeeded, onTrack, shortfall } = scenario;

  const ageLabel =
    targetAge === 55 ? 'Retire at 55' : targetAge === 60 ? 'Retire at 60' : 'Retire at 65';
  const borderColor = onTrack ? 'border-forest-600/40' : yearsUntil === 0 ? 'border-slate-600/30' : 'border-amber-600/30';
  const badgeColor = onTrack ? 'bg-forest-600/20 text-forest-400' : 'bg-amber-600/20 text-amber-400';
  const badgeText = yearsUntil === 0 ? 'Now' : onTrack ? 'On Track' : 'Needs Work';

  return (
    <Card className={borderColor}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-white">{ageLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {onTrack ? (
              <CheckCircle2 className="w-4 h-4 text-forest-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {badgeText}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-sm">
          {yearsUntil > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">Years Until</span>
              <span className="text-slate-200 font-medium">{yearsUntil} yrs</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Projected Portfolio</span>
            <span className="text-slate-200 font-medium">{formatCurrency(projectedPortfolio)}</span>
          </div>
          {projectedInheritances > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">+ Inheritances</span>
              <span className="text-forest-400 font-medium">+{formatCurrency(projectedInheritances)}</span>
            </div>
          )}
          {ssAnnualIncome > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">SS Reduces Target</span>
              <span className="text-amber-400 font-medium">-{formatCurrency(ssAnnualIncome * 25)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1.5 border-t border-slate-700/50">
            <span className="text-slate-400">Target Needed</span>
            <span className="text-slate-200 font-medium">{formatCurrency(targetNeeded)}</span>
          </div>
        </div>

        <div className="mt-3">
          <Progress
            value={Math.min(((projectedPortfolio + projectedInheritances) / (targetNeeded || 1)) * 100, 100)}
            className="h-2"
            indicatorClassName={onTrack ? 'bg-forest-500' : 'bg-amber-500'}
          />
        </div>

        {!onTrack && targetNeeded > 0 && (
          <p className="text-xs text-amber-400/80 mt-2">
            Gap: {formatCurrency(shortfall)}
          </p>
        )}
        {onTrack && (
          <p className="text-xs text-forest-400/80 mt-2">
            Surplus: {formatCurrency(Math.abs(shortfall))}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main tab component ────────────────────────────────────────────────────
export function RetirementTab() {
  const { data, calculations, setFullData } = useWealthData();
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<number>(0);
  const [editHoldings, setEditHoldings] = useState<Holding[]>([]);

  if (!data || !calculations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading retirement data...</div>
      </div>
    );
  }

  const { retirement, retirementScenarios } = calculations;
  const accounts = data.retirement.accounts;
  const ss = data.socialSecurity;
  const family = data.family;

  const handleEdit = (accountKey: string, currentBalance: number, currentHoldings?: Holding[]) => {
    setEditingAccount(accountKey);
    setEditBalance(currentBalance);
    setEditHoldings(currentHoldings ? [...currentHoldings] : []);
  };

  const handleSave = (accountKey: string) => {
    const newBalance =
      editHoldings.length > 0
        ? editHoldings.reduce((sum, h) => sum + h.value, 0)
        : editBalance;

    setFullData({
      ...data,
      retirement: {
        ...data.retirement,
        accounts: {
          ...data.retirement.accounts,
          [accountKey]: {
            ...data.retirement.accounts[accountKey as keyof typeof accounts],
            balance: newBalance,
            holdings: editHoldings.length > 0 ? editHoldings : undefined,
          },
        },
      },
    });
    setEditingAccount(null);
  };

  const handleCancel = () => {
    setEditingAccount(null);
    setEditBalance(0);
    setEditHoldings([]);
  };

  const addHolding = () => {
    setEditHoldings((prev) => [...prev, { ticker: '', name: '', shares: 0, value: 0 }]);
  };

  const removeHolding = (idx: number) => {
    setEditHoldings((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateHolding = (idx: number, field: keyof Holding, value: string | number) => {
    setEditHoldings((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, [field]: value } : h))
    );
  };

  const allocationData = [
    { name: 'Vanguard IRA — Mine', value: accounts.vanguardIRAMine.balance, color: '#166534' },
    { name: 'Vanguard IRA — Son', value: accounts.vanguardIRASon.balance, color: '#22c55e' },
    { name: 'Vanguard IRA — Daughter', value: accounts.vanguardIRADaughter.balance, color: '#14b8a6' },
    { name: "Wife's 403(b)", value: accounts.employer403b.balance, color: '#3b82f6' },
    { name: 'Wealthfront', value: accounts.wealthfront.balance, color: '#8b5cf6' },
  ];

  // Shared props forwarded to every AccountCard
  const cardProps = {
    editingAccount,
    editBalance,
    editHoldings,
    onEdit: handleEdit,
    onSave: handleSave,
    onCancel: handleCancel,
    onBalanceChange: setEditBalance,
    onAddHolding: addHolding,
    onRemoveHolding: removeHolding,
    onUpdateHolding: updateHolding,
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-forest-600/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-forest-500" />
            Retirement Summary
          </CardTitle>
          <CardDescription>4% Safe Withdrawal Rate Progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-400">Current Balance</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(retirement.currentBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Target (25× Annual Spend)</p>
              <p className="text-3xl font-bold text-slate-300">
                {formatCurrency(retirement.targetBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Progress</p>
              <p className="text-3xl font-bold text-forest-400">
                {formatPercent(retirement.progress)}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Progress value={retirement.progress} className="h-3" />
          </div>
          <div className="mt-3 text-sm text-slate-400 text-center">
            4% annual withdrawal would generate{' '}
            <span className="text-forest-400 font-medium">
              {formatCurrency(retirement.annualWithdrawal)}
            </span>{' '}
            per year
          </div>
        </CardContent>
      </Card>

      {/* Retirement Scenarios */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Target className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            Retirement Scenarios (7% Growth)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RetirementScenarioCard scenario={retirementScenarios.at55} />
          <RetirementScenarioCard scenario={retirementScenarios.at60} />
          <RetirementScenarioCard scenario={retirementScenarios.at65} />
        </div>
        <p className="text-xs text-slate-500 mt-2 px-1">
          Projections assume 7% annual portfolio growth. Inheritances included when expected within
          the retirement window. Social Security reduces target when applicable.
        </p>
      </div>

      {/* Social Security Summary */}
      {ss && (ss.husbandMonthly > 0 || ss.wifeMonthly > 0) && (
        <Card className="border-amber-700/30">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="w-4 h-4 text-amber-400" />
              <span className="font-medium text-amber-300">Social Security at Full Retirement Age (67)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">{family?.husband.name ?? 'Husband'}</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(ss.husbandMonthly)}<span className="text-sm font-normal text-slate-400">/mo</span>
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">{family?.wife.name ?? 'Wife'}</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(ss.wifeMonthly)}<span className="text-sm font-normal text-slate-400">/mo</span>
                </p>
              </div>
              <div className="p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Combined Annual</p>
                <p className="text-xl font-bold text-amber-300">
                  {formatCurrency((ss.husbandMonthly + ss.wifeMonthly) * 12)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Account Allocation</CardTitle>
          <CardDescription>Distribution across all retirement vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <AllocationChart data={allocationData} />
        </CardContent>
      </Card>

      {/* Vanguard IRAs — 3-column row */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3 px-1">
          Vanguard Individual Retirement Accounts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AccountCard
            accountKey="vanguardIRAMine"
            account={accounts.vanguardIRAMine}
            icon={Building2}
            iconColor="text-forest-500"
            badge="Mine"
            {...cardProps}
          />
          <AccountCard
            accountKey="vanguardIRASon"
            account={accounts.vanguardIRASon}
            icon={Building2}
            iconColor="text-green-400"
            badge="Son"
            {...cardProps}
          />
          <AccountCard
            accountKey="vanguardIRADaughter"
            account={accounts.vanguardIRADaughter}
            icon={Building2}
            iconColor="text-teal-400"
            badge="Daughter"
            {...cardProps}
          />
        </div>
      </div>

      {/* 403b + Wealthfront — 2-column row */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3 px-1">
          Additional Retirement Accounts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AccountCard
            accountKey="employer403b"
            account={accounts.employer403b}
            icon={Building2}
            iconColor="text-blue-500"
            {...cardProps}
          />
          <AccountCard
            accountKey="wealthfront"
            account={accounts.wealthfront}
            icon={Wallet}
            iconColor="text-purple-500"
            {...cardProps}
          />
        </div>
      </div>
    </div>
  );
}
