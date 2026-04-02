'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useWealthData } from '@/hooks/useWealthData';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { RealEstateAsset } from '@/types/wealth';
import {
  Home,
  Pencil,
  Check,
  X,
  Wallet,
  Building,
  PiggyBank,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';

// ─── EditableValue (numbers) ───────────────────────────────────────────────
interface EditableValueProps {
  field: string;
  value: number;
  formatter?: (v: number) => string;
  editingField: string | null;
  editValue: number;
  onEdit: (field: string, value: number) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  onValueChange: (v: number) => void;
}

function EditableValue({
  field,
  value,
  formatter = formatCurrency,
  editingField,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onValueChange,
}: EditableValueProps) {
  const isEditing = editingField === field;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="any"
          value={editValue}
          onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
          className="w-32 text-right"
          autoFocus
        />
        <Button variant="ghost" size="icon" onClick={() => onSave(field)}>
          <Check className="w-4 h-4 text-forest-500" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-white">{formatter(value)}</span>
      <Button variant="ghost" size="icon" onClick={() => onEdit(field, value)}>
        <Pencil className="w-3 h-3" />
      </Button>
    </div>
  );
}

// ─── EditableText (strings) ────────────────────────────────────────────────
interface EditableTextProps {
  field: string;
  value: string;
  editingField: string | null;
  editTextValue: string;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  onValueChange: (v: string) => void;
  placeholder?: string;
}

function EditableText({
  field,
  value,
  editingField,
  editTextValue,
  onEdit,
  onSave,
  onCancel,
  onValueChange,
  placeholder,
}: EditableTextProps) {
  const isEditing = editingField === field;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={editTextValue}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-40"
          placeholder={placeholder}
          autoFocus
        />
        <Button variant="ghost" size="icon" onClick={() => onSave(field)}>
          <Check className="w-4 h-4 text-forest-500" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-slate-300">{value && !value.includes('PLACEHOLDER') ? value : '—'}</span>
      <Button variant="ghost" size="icon" onClick={() => onEdit(field, value)}>
        <Pencil className="w-3 h-3" />
      </Button>
    </div>
  );
}

// ─── Add Property inline form ──────────────────────────────────────────────
interface AddPropertyFormProps {
  onAdd: (property: Omit<RealEstateAsset, 'id'>) => void;
  onCancel: () => void;
}

function AddPropertyForm({ onAdd, onCancel }: AddPropertyFormProps) {
  const [address, setAddress] = useState('');
  const [type, setType] = useState('Real Estate');
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);

  const handleSubmit = () => {
    if (!address.trim()) return;
    onAdd({
      address: address.trim(),
      type,
      estimatedValue,
      purchasePrice,
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  return (
    <div className="p-4 bg-slate-700/50 border border-slate-600/50 rounded-lg">
      <h4 className="text-sm font-medium text-white mb-3">Add Real Estate Property</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Address</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Type</label>
          <Input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Primary Residence, Undeveloped Land, etc."
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Estimated Value</label>
          <Input
            type="number"
            value={estimatedValue || ''}
            onChange={(e) => setEstimatedValue(parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Purchase Price</label>
          <Input
            type="number"
            value={purchasePrice || ''}
            onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!address.trim()}>
          <Check className="w-4 h-4 mr-1" /> Add Property
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Main tab component ────────────────────────────────────────────────────
export function AssetsTab() {
  const { data, calculations, setFullData } = useWealthData();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [editTextValue, setEditTextValue] = useState<string>('');
  const [showAddProperty, setShowAddProperty] = useState(false);

  if (!data || !calculations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading assets data...</div>
      </div>
    );
  }

  const { mortgage, emergencyFund, netWorth } = calculations;
  const { liquidCash, realEstate } = data.assets;
  const mortgageData = data.liabilities.mortgage;

  const handleEdit = (field: string, currentValue: number) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleEditText = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditTextValue(currentValue.includes('PLACEHOLDER') ? '' : currentValue);
  };

  const handleSave = (field: string) => {
    const updatedData = { ...data };

    if (field === 'checking') {
      updatedData.assets.liquidCash.checking.balance = editValue;
    } else if (field === 'savings') {
      updatedData.assets.liquidCash.savings.balance = editValue;
    } else if (field === 'emergencyFund') {
      updatedData.assets.liquidCash.emergencyFund.balance = editValue;
    } else if (field.startsWith('propertyValue-')) {
      const idx = parseInt(field.split('-')[1], 10);
      updatedData.assets.realEstate[idx].estimatedValue = editValue;
    } else if (field.startsWith('purchasePrice-')) {
      const idx = parseInt(field.split('-')[1], 10);
      updatedData.assets.realEstate[idx].purchasePrice = editValue;
    } else if (field === 'mortgageBalance') {
      updatedData.liabilities.mortgage.currentBalance = editValue;
    } else if (field === 'mortgageOriginal') {
      updatedData.liabilities.mortgage.originalAmount = editValue;
    } else if (field === 'mortgageRate') {
      updatedData.liabilities.mortgage.interestRate = editValue;
    } else if (field === 'mortgagePayment') {
      updatedData.liabilities.mortgage.monthlyPayment = editValue;
    } else if (field === 'mortgageLender') {
      updatedData.liabilities.mortgage.lender = editTextValue;
    } else if (field === 'mortgageStartYear') {
      // Store as ISO date string; only the year portion is used for calculations
      if (editValue > 1900) {
        updatedData.liabilities.mortgage.startDate = `${editValue}-01-01`;
      }
    }

    setFullData(updatedData);
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue(0);
    setEditTextValue('');
  };

  const handleAddProperty = (propertyData: Omit<RealEstateAsset, 'id'>) => {
    const newProperty: RealEstateAsset = {
      id: `property-${Date.now()}`,
      ...propertyData,
    };
    const updatedData = {
      ...data,
      assets: {
        ...data.assets,
        realEstate: [...data.assets.realEstate, newProperty],
      },
    };
    setFullData(updatedData);
    setShowAddProperty(false);
  };

  // Shared props forwarded to every EditableValue (numeric)
  const editProps = {
    editingField,
    editValue,
    onEdit: handleEdit,
    onSave: handleSave,
    onCancel: handleCancel,
    onValueChange: setEditValue,
  };

  // Shared props forwarded to every EditableText (string)
  const textEditProps = {
    editingField,
    editTextValue,
    onEdit: handleEditText,
    onSave: handleSave,
    onCancel: handleCancel,
    onValueChange: setEditTextValue,
  };

  // Parse mortgage start year for display / editing
  const mortgageStartYear =
    mortgageData.startDate && !mortgageData.startDate.includes('PLACEHOLDER')
      ? new Date(mortgageData.startDate).getFullYear()
      : 0;

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-forest-600/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-forest-600/20 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-forest-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Assets</p>
                <p className="text-2xl font-bold text-forest-400">
                  {formatCurrency(netWorth.totalAssets)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-600/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(netWorth.totalLiabilities)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-600/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Net Worth</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(netWorth.netWorth)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liquid Cash Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-500" />
            Liquid Cash
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Checking */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">{liquidCash.checking.label}</span>
              </div>
              <EditableValue field="checking" value={liquidCash.checking.balance} {...editProps} />
              <p className="text-xs text-slate-500 mt-1">{liquidCash.checking.institution}</p>
            </div>

            {/* Savings */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">{liquidCash.savings.label}</span>
              </div>
              <EditableValue field="savings" value={liquidCash.savings.balance} {...editProps} />
              <p className="text-xs text-slate-500 mt-1">
                {liquidCash.savings.institution} • {liquidCash.savings.apy}% APY
              </p>
            </div>

            {/* Emergency Fund */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-slate-400">{liquidCash.emergencyFund.label}</span>
              </div>
              <EditableValue
                field="emergencyFund"
                value={liquidCash.emergencyFund.balance}
                {...editProps}
              />
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">
                    {emergencyFund.monthsCovered.toFixed(1)} months covered
                  </span>
                  <span className="text-slate-500">
                    Target: {liquidCash.emergencyFund.targetMonths} months
                  </span>
                </div>
                <Progress value={emergencyFund.progress} indicatorClassName="bg-orange-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Estate Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-500" />
              Real Estate
            </CardTitle>
            {!showAddProperty && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddProperty(true)}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Property
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {realEstate.map((property, index) => {
              const isMortgaged = mortgageData.property === property.address;
              // Mortgaged property: equity = market value − outstanding balance
              // Other properties: unrealized gain = market value − purchase price
              const equityValue = isMortgaged
                ? mortgage.equity
                : property.estimatedValue - property.purchasePrice;
              const equityLabel = isMortgaged ? 'Home Equity' : 'Unrealized Gain';
              const equityColor = equityValue >= 0 ? 'text-forest-400' : 'text-red-400';

              return (
                <div key={property.id} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-white">{property.address}</h3>
                      <p className="text-sm text-slate-400">{property.type}</p>
                    </div>
                    {isMortgaged ? (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                        Primary
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs rounded">
                        {property.type}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Estimated Value</p>
                      <EditableValue
                        field={`propertyValue-${index}`}
                        value={property.estimatedValue}
                        {...editProps}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Purchase Price</p>
                      <EditableValue
                        field={`purchasePrice-${index}`}
                        value={property.purchasePrice}
                        {...editProps}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-forest-600/10 border border-forest-600/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">{equityLabel}</span>
                      <span className={`text-lg font-bold ${equityColor}`}>
                        {formatCurrency(equityValue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {showAddProperty && (
              <AddPropertyForm
                onAdd={handleAddProperty}
                onCancel={() => setShowAddProperty(false)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mortgage Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Mortgage
          </CardTitle>
          <CardDescription>{mortgageData.property}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400">Original Amount</p>
              <EditableValue
                field="mortgageOriginal"
                value={mortgageData.originalAmount}
                {...editProps}
              />
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400">Current Balance</p>
              <EditableValue
                field="mortgageBalance"
                value={mortgageData.currentBalance}
                {...editProps}
              />
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400">Interest Rate</p>
              <EditableValue
                field="mortgageRate"
                value={mortgageData.interestRate}
                formatter={formatPercent}
                {...editProps}
              />
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400">Monthly Payment</p>
              <EditableValue
                field="mortgagePayment"
                value={mortgageData.monthlyPayment}
                {...editProps}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Paid Off: {formatCurrency(mortgage.paidOff)}</span>
              <span className="text-slate-400">
                Remaining: {formatCurrency(mortgage.currentBalance)}
              </span>
            </div>
            <Progress value={mortgage.progress} indicatorClassName="bg-forest-500" className="h-3" />
            <p className="text-center text-sm text-slate-400 mt-2">
              {mortgage.progress.toFixed(1)}% paid off
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Lender</p>
              <EditableText
                field="mortgageLender"
                value={mortgageData.lender}
                placeholder="Bank name"
                {...textEditProps}
              />
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Start Year</p>
              <EditableValue
                field="mortgageStartYear"
                value={mortgageStartYear}
                formatter={(v) => (v > 1900 ? String(v) : '—')}
                {...editProps}
              />
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Loan Term</p>
              <span className="text-white font-semibold">{mortgageData.termYears} years</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Years Remaining</p>
              <span className="text-white font-semibold">
                {mortgage.yearsRemaining !== null ? `${mortgage.yearsRemaining} yrs` : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
