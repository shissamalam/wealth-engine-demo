'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWealthData } from '@/hooks/useWealthData';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Briefcase,
  MinusCircle,
  GraduationCap,
  Gift,
} from 'lucide-react';
import {
  FamilyMember,
  Dependent,
  SocialSecurityEstimate,
  ExpectedInheritance,
  ExternalEducationGift,
} from '@/types/wealth';

// ─────────────────────────────────────────────────────────────────────────────
// FamilyMemberCard — defined OUTSIDE PeopleTab for stable reference
// ─────────────────────────────────────────────────────────────────────────────
interface FamilyMemberCardProps {
  memberKey: 'husband' | 'wife';
  member: FamilyMember;
  editingMember: string | null;
  editMember: Partial<FamilyMember>;
  onEdit: (key: string, member: FamilyMember) => void;
  onSave: (key: 'husband' | 'wife') => void;
  onCancel: () => void;
  onMemberChange: (member: Partial<FamilyMember>) => void;
}

function FamilyMemberCard({
  memberKey,
  member,
  editingMember,
  editMember,
  onEdit,
  onSave,
  onCancel,
  onMemberChange,
}: FamilyMemberCardProps) {
  const isEditing = editingMember === memberKey;
  const currentYear = new Date().getFullYear();
  const age = currentYear - member.birthYear;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          </CardTitle>
          {!isEditing ? (
            <Button variant="ghost" size="icon" onClick={() => onEdit(memberKey, member)}>
              <Pencil className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onSave(memberKey)}>
                <Check className="w-4 h-4 text-forest-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isEditing ? (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Name</label>
              <Input
                value={editMember.name ?? ''}
                onChange={(e) => onMemberChange({ ...editMember, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Birth Year</label>
              <Input
                type="number"
                value={editMember.birthYear ?? currentYear - 40}
                onChange={(e) =>
                  onMemberChange({ ...editMember, birthYear: parseInt(e.target.value) || 1985 })
                }
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Gross Annual Salary</label>
              <Input
                type="number"
                value={editMember.grossSalary ?? 0}
                onChange={(e) =>
                  onMemberChange({ ...editMember, grossSalary: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-400">Currently Employed?</span>
              <div className="flex gap-2">
                <Button
                  variant={editMember.employed ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onMemberChange({ ...editMember, employed: true })}
                >
                  Yes
                </Button>
                <Button
                  variant={!editMember.employed ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onMemberChange({ ...editMember, employed: false })}
                >
                  No
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-xl font-bold text-white">{member.name}</div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                Age: <span className="text-slate-200 font-medium">{age}</span>
              </span>
              <span className="text-slate-400">
                Born: <span className="text-slate-200 font-medium">{member.birthYear}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {member.employed ? (
                <Briefcase className="w-4 h-4 text-forest-400" />
              ) : (
                <MinusCircle className="w-4 h-4 text-slate-500" />
              )}
              <span className={`text-sm ${member.employed ? 'text-forest-400' : 'text-slate-500'}`}>
                {member.employed ? 'Employed' : 'Not Employed'}
              </span>
            </div>
            {member.grossSalary > 0 && (
              <div className="p-2 bg-slate-800/50 rounded-lg">
                <span className="text-xs text-slate-400">Gross Salary</span>
                <div className="text-lg font-semibold text-white">
                  {formatCurrency(member.grossSalary)}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DependentCard — defined OUTSIDE PeopleTab
// ─────────────────────────────────────────────────────────────────────────────
interface DependentCardProps {
  depKey: 'son' | 'daughter';
  dependent: Dependent;
  editingDep: string | null;
  editDep: Partial<Dependent>;
  onEdit: (key: string, dep: Dependent) => void;
  onSave: (key: 'son' | 'daughter') => void;
  onCancel: () => void;
  onDepChange: (dep: Partial<Dependent>) => void;
}

function DependentCard({
  depKey,
  dependent,
  editingDep,
  editDep,
  onEdit,
  onSave,
  onCancel,
  onDepChange,
}: DependentCardProps) {
  const isEditing = editingDep === depKey;
  const currentYear = new Date().getFullYear();
  const age = currentYear - dependent.birthYear;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-400" />
            {dependent.role.charAt(0).toUpperCase() + dependent.role.slice(1)}
          </CardTitle>
          {!isEditing ? (
            <Button variant="ghost" size="icon" onClick={() => onEdit(depKey, dependent)}>
              <Pencil className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onSave(depKey)}>
                <Check className="w-4 h-4 text-forest-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isEditing ? (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Name</label>
              <Input
                value={editDep.name ?? ''}
                onChange={(e) => onDepChange({ ...editDep, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Birth Year</label>
              <Input
                type="number"
                value={editDep.birthYear ?? currentYear - 10}
                onChange={(e) =>
                  onDepChange({ ...editDep, birthYear: parseInt(e.target.value) || 2010 })
                }
              />
            </div>
          </>
        ) : (
          <>
            <div className="text-xl font-bold text-white">{dependent.name}</div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                Age: <span className="text-slate-200 font-medium">{age}</span>
              </span>
              <span className="text-slate-400">
                Born: <span className="text-slate-200 font-medium">{dependent.birthYear}</span>
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InheritanceRow — defined OUTSIDE PeopleTab
// ─────────────────────────────────────────────────────────────────────────────
interface InheritanceRowProps {
  inheritance: ExpectedInheritance;
  editingId: string | null;
  editInheritance: Partial<ExpectedInheritance>;
  onEdit: (inh: ExpectedInheritance) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onChange: (inh: Partial<ExpectedInheritance>) => void;
}

function InheritanceRow({
  inheritance,
  editingId,
  editInheritance,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onChange,
}: InheritanceRowProps) {
  const isEditing = editingId === inheritance.id;

  if (isEditing) {
    return (
      <div className="p-3 bg-slate-800/70 rounded-lg space-y-2 border border-slate-600/50">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Description</label>
            <Input
              value={editInheritance.description ?? ''}
              onChange={(e) => onChange({ ...editInheritance, description: e.target.value })}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Estimated Amount</label>
            <Input
              type="number"
              value={editInheritance.estimatedAmount ?? 0}
              onChange={(e) =>
                onChange({ ...editInheritance, estimatedAmount: parseFloat(e.target.value) || 0 })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Min Years</label>
            <Input
              type="number"
              value={editInheritance.minYears ?? 0}
              onChange={(e) =>
                onChange({ ...editInheritance, minYears: parseInt(e.target.value) || 0 })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Max Years</label>
            <Input
              type="number"
              value={editInheritance.maxYears ?? 0}
              onChange={(e) =>
                onChange({ ...editInheritance, maxYears: parseInt(e.target.value) || 0 })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Beneficiary</label>
            <select
              value={editInheritance.beneficiary ?? 'joint'}
              onChange={(e) =>
                onChange({
                  ...editInheritance,
                  beneficiary: e.target.value as 'husband' | 'wife' | 'joint',
                })
              }
              className="h-8 w-full rounded-md border border-slate-600 bg-slate-800 text-slate-200 text-sm px-2"
            >
              <option value="husband">Husband</option>
              <option value="wife">Wife</option>
              <option value="joint">Joint</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Notes</label>
          <Input
            value={editInheritance.notes ?? ''}
            onChange={(e) => onChange({ ...editInheritance, notes: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="h-7 text-xs gap-1" onClick={onSave}>
            <Check className="w-3 h-3" /> Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const timelineText =
    inheritance.minYears > 0 && inheritance.maxYears > 0
      ? `${inheritance.minYears}–${inheritance.maxYears} yrs`
      : inheritance.minYears > 0
      ? `${inheritance.minYears}+ yrs`
      : 'Unknown timeline';

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-200 truncate">{inheritance.description}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 capitalize flex-shrink-0">
            {inheritance.beneficiary}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-lg font-semibold text-forest-400">
            {formatCurrency(inheritance.estimatedAmount)}
          </span>
          <span className="text-xs text-slate-500">{timelineText}</span>
        </div>
        {inheritance.notes && (
          <p className="text-xs text-slate-500 mt-0.5">{inheritance.notes}</p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(inheritance)}>
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDelete(inheritance.id)}
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GiftRow — defined OUTSIDE PeopleTab
// ─────────────────────────────────────────────────────────────────────────────
interface GiftRowProps {
  gift: ExternalEducationGift;
  editingId: string | null;
  editGift: Partial<ExternalEducationGift>;
  onEdit: (gift: ExternalEducationGift) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onChange: (gift: Partial<ExternalEducationGift>) => void;
}

function GiftRow({
  gift,
  editingId,
  editGift,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onChange,
}: GiftRowProps) {
  const isEditing = editingId === gift.id;

  if (isEditing) {
    return (
      <div className="p-3 bg-slate-800/70 rounded-lg space-y-2 border border-slate-600/50">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Description</label>
            <Input
              value={editGift.description ?? ''}
              onChange={(e) => onChange({ ...editGift, description: e.target.value })}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Current Balance</label>
            <Input
              type="number"
              value={editGift.balance ?? 0}
              onChange={(e) =>
                onChange({ ...editGift, balance: parseFloat(e.target.value) || 0 })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Beneficiary</label>
            <Input
              value={editGift.beneficiary ?? ''}
              onChange={(e) => onChange({ ...editGift, beneficiary: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Notes</label>
            <Input
              value={editGift.notes ?? ''}
              onChange={(e) => onChange({ ...editGift, notes: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="h-7 text-xs gap-1" onClick={onSave}>
            <Check className="w-3 h-3" /> Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-200 truncate">{gift.description}</span>
          {gift.beneficiary && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 flex-shrink-0">
              {gift.beneficiary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-lg font-semibold text-amber-400">
            {formatCurrency(gift.balance)}
          </span>
        </div>
        {gift.notes && <p className="text-xs text-slate-500 mt-0.5">{gift.notes}</p>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(gift)}>
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDelete(gift.id)}
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main tab component
// ─────────────────────────────────────────────────────────────────────────────
export function PeopleTab() {
  const { data, setFullData } = useWealthData();

  // Family member edit state
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<Partial<FamilyMember>>({});

  // Dependent edit state
  const [editingDep, setEditingDep] = useState<string | null>(null);
  const [editDep, setEditDep] = useState<Partial<Dependent>>({});

  // Social Security edit state
  const [editingSS, setEditingSS] = useState(false);
  const [editSS, setEditSS] = useState<SocialSecurityEstimate>({ husbandMonthly: 0, wifeMonthly: 0 });

  // Inheritance edit state
  const [editingInhId, setEditingInhId] = useState<string | null>(null);
  const [editInheritance, setEditInheritance] = useState<Partial<ExpectedInheritance>>({});

  // Education gift edit state
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [editGift, setEditGift] = useState<Partial<ExternalEducationGift>>({});

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading family data...</div>
      </div>
    );
  }

  const family = data.family ?? {
    husband: { name: 'Husband', birthYear: 1985, employed: true, grossSalary: 0, role: 'husband' as const },
    wife: { name: 'Wife', birthYear: 1986, employed: true, grossSalary: 0, role: 'wife' as const },
    son: { name: 'Son', birthYear: 2014, role: 'son' as const },
    daughter: { name: 'Daughter', birthYear: 2016, role: 'daughter' as const },
  };
  const ss = data.socialSecurity ?? { husbandMonthly: 0, wifeMonthly: 0 };
  const inheritances = data.expectedInheritances ?? [];
  const externalGifts = data.education.externalGifts ?? [];
  const currentYear = new Date().getFullYear();

  // ── Family member handlers ────────────────────────────────────────────────
  const handleEditMember = (key: string, member: FamilyMember) => {
    setEditingMember(key);
    setEditMember({ ...member });
  };

  const handleSaveMember = (key: 'husband' | 'wife') => {
    setFullData({
      ...data,
      family: {
        ...family,
        [key]: { ...family[key], ...editMember },
      },
    });
    setEditingMember(null);
  };

  const handleCancelMember = () => {
    setEditingMember(null);
    setEditMember({});
  };

  // ── Dependent handlers ───────────────────────────────────────────────────
  const handleEditDep = (key: string, dep: Dependent) => {
    setEditingDep(key);
    setEditDep({ ...dep });
  };

  const handleSaveDep = (key: 'son' | 'daughter') => {
    setFullData({
      ...data,
      family: {
        ...family,
        [key]: { ...family[key], ...editDep },
      },
      // Sync name change through to 529 beneficiary record too
      education: {
        ...data.education,
        plan529: {
          ...data.education.plan529,
          beneficiaries: {
            ...data.education.plan529.beneficiaries,
            [key]: {
              ...data.education.plan529.beneficiaries[key],
              name: editDep.name ?? data.education.plan529.beneficiaries[key].name,
            },
          },
        },
      },
    });
    setEditingDep(null);
  };

  const handleCancelDep = () => {
    setEditingDep(null);
    setEditDep({});
  };

  // ── SS handlers ───────────────────────────────────────────────────────────
  const handleEditSS = () => {
    setEditingSS(true);
    setEditSS({ ...ss });
  };

  const handleSaveSS = () => {
    setFullData({ ...data, socialSecurity: editSS });
    setEditingSS(false);
  };

  // ── Inheritance handlers ──────────────────────────────────────────────────
  const handleEditInh = (inh: ExpectedInheritance) => {
    setEditingInhId(inh.id);
    setEditInheritance({ ...inh });
  };

  const handleSaveInh = () => {
    const updated = inheritances.map((inh) =>
      inh.id === editingInhId ? { ...inh, ...editInheritance } as ExpectedInheritance : inh
    );
    setFullData({ ...data, expectedInheritances: updated });
    setEditingInhId(null);
  };

  const handleDeleteInh = (id: string) => {
    setFullData({
      ...data,
      expectedInheritances: inheritances.filter((inh) => inh.id !== id),
    });
  };

  const handleAddInh = () => {
    const newInh: ExpectedInheritance = {
      id: `inheritance-${Date.now()}`,
      description: 'New Inheritance',
      estimatedAmount: 0,
      minYears: 0,
      maxYears: 0,
      beneficiary: 'joint',
      notes: '',
    };
    setFullData({ ...data, expectedInheritances: [...inheritances, newInh] });
    setEditingInhId(newInh.id);
    setEditInheritance({ ...newInh });
  };

  // ── Education gift handlers ───────────────────────────────────────────────
  const handleEditGift = (gift: ExternalEducationGift) => {
    setEditingGiftId(gift.id);
    setEditGift({ ...gift });
  };

  const handleSaveGift = () => {
    const updated = externalGifts.map((g) =>
      g.id === editingGiftId ? { ...g, ...editGift } as ExternalEducationGift : g
    );
    setFullData({
      ...data,
      education: { ...data.education, externalGifts: updated },
    });
    setEditingGiftId(null);
  };

  const handleDeleteGift = (id: string) => {
    setFullData({
      ...data,
      education: {
        ...data.education,
        externalGifts: externalGifts.filter((g) => g.id !== id),
      },
    });
  };

  const handleAddGift = () => {
    const newGift: ExternalEducationGift = {
      id: `gift-${Date.now()}`,
      description: 'New Education Gift',
      balance: 0,
      beneficiary: '',
      notes: '',
    };
    setFullData({
      ...data,
      education: { ...data.education, externalGifts: [...externalGifts, newGift] },
    });
    setEditingGiftId(newGift.id);
    setEditGift({ ...newGift });
  };

  // Shared props
  const memberProps = {
    editingMember,
    editMember,
    onEdit: handleEditMember,
    onSave: handleSaveMember,
    onCancel: handleCancelMember,
    onMemberChange: setEditMember,
  };

  const depProps = {
    editingDep,
    editDep,
    onEdit: handleEditDep,
    onSave: handleSaveDep,
    onCancel: handleCancelDep,
    onDepChange: setEditDep,
  };

  const inhProps = {
    editingId: editingInhId,
    editInheritance,
    onEdit: handleEditInh,
    onSave: handleSaveInh,
    onCancel: () => setEditingInhId(null),
    onDelete: handleDeleteInh,
    onChange: setEditInheritance,
  };

  const giftProps = {
    editingId: editingGiftId,
    editGift,
    onEdit: handleEditGift,
    onSave: handleSaveGift,
    onCancel: () => setEditingGiftId(null),
    onDelete: handleDeleteGift,
    onChange: setEditGift,
  };

  const totalHouseholdIncome = (family.husband.grossSalary ?? 0) + (family.wife.grossSalary ?? 0);

  return (
    <div className="space-y-6">
      {/* Household Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-amber-600/30">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Household Income</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalHouseholdIncome)}</p>
            <p className="text-xs text-slate-500 mt-1">Combined gross salary</p>
          </CardContent>
        </Card>
        <Card className="border-forest-600/30">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Husband's Age</p>
            <p className="text-2xl font-bold text-white">
              {currentYear - family.husband.birthYear}
            </p>
            <p className="text-xs text-slate-500 mt-1">Born {family.husband.birthYear}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-600/30">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Wife's Age</p>
            <p className="text-2xl font-bold text-white">
              {currentYear - family.wife.birthYear}
            </p>
            <p className="text-xs text-slate-500 mt-1">Born {family.wife.birthYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Adults */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3 px-1">
          Adults
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FamilyMemberCard memberKey="husband" member={family.husband} {...memberProps} />
          <FamilyMemberCard memberKey="wife" member={family.wife} {...memberProps} />
        </div>
      </div>

      {/* Dependents */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3 px-1">
          Dependents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DependentCard depKey="son" dependent={family.son} {...depProps} />
          <DependentCard depKey="daughter" dependent={family.daughter} {...depProps} />
        </div>
      </div>

      {/* Social Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-500" />
              Social Security Estimates
            </CardTitle>
            {!editingSS ? (
              <Button variant="ghost" size="icon" onClick={handleEditSS}>
                <Pencil className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleSaveSS}>
                  <Check className="w-4 h-4 text-forest-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditingSS(false)}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-4">
            Monthly benefit at full retirement age (67 for those born after 1960). Check your{' '}
            <span className="text-amber-400">SSA.gov</span> account for estimates.
          </p>
          {editingSS ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  {family.husband.name} — Monthly Benefit
                </label>
                <Input
                  type="number"
                  value={editSS.husbandMonthly}
                  onChange={(e) =>
                    setEditSS({ ...editSS, husbandMonthly: parseFloat(e.target.value) || 0 })
                  }
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  {family.wife.name} — Monthly Benefit
                </label>
                <Input
                  type="number"
                  value={editSS.wifeMonthly}
                  onChange={(e) =>
                    setEditSS({ ...editSS, wifeMonthly: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">{family.husband.name}</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(ss.husbandMonthly)}
                  <span className="text-sm font-normal text-slate-400">/mo</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatCurrency(ss.husbandMonthly * 12)}/yr
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">{family.wife.name}</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(ss.wifeMonthly)}
                  <span className="text-sm font-normal text-slate-400">/mo</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatCurrency(ss.wifeMonthly * 12)}/yr
                </p>
              </div>
            </div>
          )}
          {!editingSS && (ss.husbandMonthly > 0 || ss.wifeMonthly > 0) && (
            <div className="mt-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
              <p className="text-sm text-amber-300">
                Combined:{' '}
                <span className="font-semibold">
                  {formatCurrency((ss.husbandMonthly + ss.wifeMonthly) * 12)}/yr
                </span>{' '}
                at full retirement age
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expected Inheritances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-rose-400" />
              Expected Inheritances
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-forest-400 hover:text-forest-300 gap-1 text-xs h-8"
              onClick={handleAddInh}
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inheritances.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">
              No inheritances recorded. Click Add to add one.
            </p>
          ) : (
            <div className="space-y-2">
              {inheritances.map((inh) => (
                <InheritanceRow key={inh.id} inheritance={inh} {...inhProps} />
              ))}
            </div>
          )}
          {inheritances.length > 0 && (
            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg flex justify-between">
              <span className="text-sm text-slate-400">Total Expected</span>
              <span className="text-lg font-bold text-forest-400">
                {formatCurrency(inheritances.reduce((s, i) => s + i.estimatedAmount, 0))}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Education Gifts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              External Education Accounts
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-forest-400 hover:text-forest-300 gap-1 text-xs h-8"
              onClick={handleAddGift}
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-3">
            Education funds held by family members outside of your own 529 plan.
          </p>
          {externalGifts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">
              No external gifts recorded. Click Add to add one.
            </p>
          ) : (
            <div className="space-y-2">
              {externalGifts.map((gift) => (
                <GiftRow key={gift.id} gift={gift} {...giftProps} />
              ))}
            </div>
          )}
          {externalGifts.length > 0 && (
            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg flex justify-between">
              <span className="text-sm text-slate-400">Total External Education</span>
              <span className="text-lg font-bold text-amber-400">
                {formatCurrency(externalGifts.reduce((s, g) => s + g.balance, 0))}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
