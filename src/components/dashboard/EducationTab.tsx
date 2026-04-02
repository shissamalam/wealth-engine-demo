'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useWealthData } from '@/hooks/useWealthData';
import { formatCurrency } from '@/lib/utils';
import { GraduationCap, Pencil, Check, X, User, Calendar, Gift } from 'lucide-react';
import { Beneficiary, ExternalEducationGift } from '@/types/wealth';

interface BeneficiaryProgress {
  current: number;
  target: number;
  progress: number;
  yearsRemaining: number;
}

interface BeneficiaryEdit {
  balance: number;
  targetYear: number;
}

// ─── BeneficiaryCard lives OUTSIDE EducationTab so its reference is stable
// across re-renders and inputs never lose focus mid-type. ──────────────────
interface BeneficiaryCardProps {
  beneficiaryKey: 'son' | 'daughter';
  label: string;
  beneficiary: Beneficiary;
  progress: BeneficiaryProgress;
  editingBeneficiary: string | null;
  editValues: Record<string, BeneficiaryEdit>;
  onEdit: (key: string, balance: number, targetYear: number) => void;
  onSave: (key: 'son' | 'daughter') => void;
  onCancel: () => void;
  onValuesChange: (values: Record<string, BeneficiaryEdit>) => void;
}

function BeneficiaryCard({
  beneficiaryKey,
  label,
  beneficiary,
  progress,
  editingBeneficiary,
  editValues,
  onEdit,
  onSave,
  onCancel,
  onValuesChange,
}: BeneficiaryCardProps) {
  const isEditing = editingBeneficiary === beneficiaryKey;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            {label}
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(beneficiaryKey, beneficiary.balance, beneficiary.targetYear)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onSave(beneficiaryKey)}>
                <Check className="w-4 h-4 text-forest-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
        <CardDescription>{beneficiary.name}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex justify-center mb-6">
          <GaugeChart
            value={progress.progress}
            label={formatCurrency(progress.current)}
            sublabel={`of ${formatCurrency(progress.target)}`}
            color="#3b82f6"
            size="sm"
          />
        </div>

        {isEditing && (
          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-1">Current Balance</label>
            <Input
              type="number"
              value={editValues[beneficiaryKey]?.balance ?? 0}
              onChange={(e) =>
                onValuesChange({
                  ...editValues,
                  [beneficiaryKey]: {
                    ...editValues[beneficiaryKey],
                    balance: parseFloat(e.target.value) || 0,
                  },
                })
              }
              autoFocus
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-400">Target Year</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={editValues[beneficiaryKey]?.targetYear ?? beneficiary.targetYear}
                onChange={(e) =>
                  onValuesChange({
                    ...editValues,
                    [beneficiaryKey]: {
                      ...editValues[beneficiaryKey],
                      targetYear: parseInt(e.target.value) || beneficiary.targetYear,
                    },
                  })
                }
                className="w-24 h-8 text-right text-sm"
              />
            ) : (
              <span className="font-medium text-slate-200">{beneficiary.targetYear}</span>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-sm text-slate-400">Years Remaining</span>
            <span className="font-medium text-slate-200">{progress.yearsRemaining}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-sm text-slate-400">Funding Gap</span>
            <span className="font-medium text-red-400">
              {formatCurrency(Math.max(progress.target - progress.current, 0))}
            </span>
          </div>

          {progress.yearsRemaining > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-400">Monthly Contribution Needed</span>
              <span className="font-medium text-blue-400">
                {formatCurrency(
                  Math.max(progress.target - progress.current, 0) /
                    (progress.yearsRemaining * 12)
                )}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-300">{progress.progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress.progress} indicatorClassName="bg-blue-500" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ExternalGiftCard lives OUTSIDE EducationTab ──────────────────────────
interface ExternalGiftCardProps {
  gift: ExternalEducationGift;
  editingGiftId: string | null;
  editGift: Partial<ExternalEducationGift>;
  onEdit: (gift: ExternalEducationGift) => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (gift: Partial<ExternalEducationGift>) => void;
}

function ExternalGiftCard({
  gift,
  editingGiftId,
  editGift,
  onEdit,
  onSave,
  onCancel,
  onChange,
}: ExternalGiftCardProps) {
  const isEditing = editingGiftId === gift.id;

  return (
    <div className="p-4 bg-slate-800/50 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-medium text-slate-200">{gift.description}</span>
          {gift.beneficiary && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400">
              {gift.beneficiary}
            </span>
          )}
        </div>
        {!isEditing ? (
          <button
            className="text-slate-500 hover:text-slate-300 transition-colors"
            onClick={() => onEdit(gift)}
          >
            <Pencil className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button className="text-forest-500 hover:text-forest-400" onClick={onSave}>
              <Check className="w-4 h-4" />
            </button>
            <button className="text-red-500 hover:text-red-400" onClick={onCancel}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Current Balance</label>
            <input
              type="number"
              value={editGift.balance ?? 0}
              onChange={(e) => onChange({ ...editGift, balance: parseFloat(e.target.value) || 0 })}
              className="w-full h-9 rounded-md border border-slate-600 bg-slate-800/80 text-white text-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Notes</label>
            <input
              type="text"
              value={editGift.notes ?? ''}
              onChange={(e) => onChange({ ...editGift, notes: e.target.value })}
              className="w-full h-9 rounded-md border border-slate-600 bg-slate-800/80 text-white text-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-blue-400">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(gift.balance)}
          </div>
          {gift.notes && <p className="text-xs text-slate-500 mt-1">{gift.notes}</p>}
        </>
      )}
    </div>
  );
}

// ─── Main tab component ────────────────────────────────────────────────────
export function EducationTab() {
  const { data, calculations, setFullData } = useWealthData();
  const [editingBeneficiary, setEditingBeneficiary] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, BeneficiaryEdit>>({});
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [editGift, setEditGift] = useState<Partial<ExternalEducationGift>>({});

  if (!data || !calculations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading education data...</div>
      </div>
    );
  }

  const { education } = calculations;
  const plan529 = data.education.plan529;

  const handleEdit = (key: string, currentBalance: number, currentTargetYear: number) => {
    setEditingBeneficiary(key);
    setEditValues({ [key]: { balance: currentBalance, targetYear: currentTargetYear } });
  };

  const handleSave = (key: 'son' | 'daughter') => {
    const { balance: newBalance, targetYear: newTargetYear } = editValues[key] ?? {
      balance: plan529.beneficiaries[key].balance,
      targetYear: plan529.beneficiaries[key].targetYear,
    };

    setFullData({
      ...data,
      education: {
        plan529: {
          ...plan529,
          beneficiaries: {
            ...plan529.beneficiaries,
            [key]: {
              ...plan529.beneficiaries[key],
              balance: newBalance,
              targetYear: newTargetYear,
            },
          },
        },
      },
    });
    setEditingBeneficiary(null);
  };

  const handleCancel = () => {
    setEditingBeneficiary(null);
    setEditValues({});
  };

  const externalGifts = data.education.externalGifts ?? [];

  const handleEditGift = (gift: ExternalEducationGift) => {
    setEditingGiftId(gift.id);
    setEditGift({ ...gift });
  };

  const handleSaveGift = () => {
    const updated = externalGifts.map((g) =>
      g.id === editingGiftId ? { ...g, ...editGift } as ExternalEducationGift : g
    );
    setFullData({ ...data, education: { ...data.education, externalGifts: updated } });
    setEditingGiftId(null);
  };

  const handleCancelGift = () => setEditingGiftId(null);

  const giftCardProps = {
    editingGiftId,
    editGift,
    onEdit: handleEditGift,
    onSave: handleSaveGift,
    onCancel: handleCancelGift,
    onChange: setEditGift,
  };

  // Shared props forwarded to every BeneficiaryCard
  const cardProps = {
    editingBeneficiary,
    editValues,
    onEdit: handleEdit,
    onSave: handleSave,
    onCancel: handleCancel,
    onValuesChange: setEditValues,
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-blue-600/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            529 Education Plan
          </CardTitle>
          <CardDescription>{plan529.provider}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-400">Total Funded</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(education.total.current)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Combined Target</p>
              <p className="text-3xl font-bold text-slate-300">
                {formatCurrency(education.total.target)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Overall Progress</p>
              <p className="text-3xl font-bold text-blue-400">
                {education.total.progress.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Progress
              value={education.total.progress}
              className="h-3"
              indicatorClassName="bg-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BeneficiaryCard
          beneficiaryKey="son"
          label="Son's 529"
          beneficiary={plan529.beneficiaries.son}
          progress={education.son}
          {...cardProps}
        />
        <BeneficiaryCard
          beneficiaryKey="daughter"
          label="Daughter's 529"
          beneficiary={plan529.beneficiaries.daughter}
          progress={education.daughter}
          {...cardProps}
        />
      </div>

      {/* External Education Gifts */}
      {externalGifts.length > 0 && (
        <Card className="border-blue-700/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-400" />
              External Education Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">
              Education funds held by family members outside your own 529 plan.
            </p>
            <div className="space-y-3">
              {externalGifts.map((gift) => (
                <ExternalGiftCard key={gift.id} gift={gift} {...giftCardProps} />
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg flex justify-between">
              <span className="text-sm text-slate-400">Total External Education</span>
              <span className="text-lg font-bold text-blue-400">
                {formatCurrency(externalGifts.reduce((s, g) => s + g.balance, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax Benefits Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">529 Tax Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-forest-500">•</span>
              Tax-free growth on investments
            </li>
            <li className="flex items-start gap-2">
              <span className="text-forest-500">•</span>
              Tax-free withdrawals for qualified education expenses
            </li>
            <li className="flex items-start gap-2">
              <span className="text-forest-500">•</span>
              State tax deduction may be available (check your state)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-forest-500">•</span>
              Can be used for K-12 tuition (up to $10,000/year)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-forest-500">•</span>
              Unused funds can be rolled to Roth IRA (2024+ rules)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
