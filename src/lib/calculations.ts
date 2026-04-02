import { WealthData } from '@/types/wealth';

export function calculateTotalRetirement(data: WealthData): number {
  const accounts = data.retirement.accounts;
  return (
    accounts.vanguardIRAMine.balance +
    accounts.vanguardIRASon.balance +
    accounts.vanguardIRADaughter.balance +
    accounts.employer403b.balance +
    accounts.wealthfront.balance
  );
}

export function calculateFourPercentRule(data: WealthData): {
  currentBalance: number;
  targetBalance: number;
  progress: number;
  annualWithdrawal: number;
} {
  const currentBalance = calculateTotalRetirement(data);
  const targetAnnualSpend = data.retirement.targetAnnualSpend;
  const targetBalance = targetAnnualSpend * 25; // 4% rule = 25x annual spending
  const progress = Math.min((currentBalance / targetBalance) * 100, 100);
  const annualWithdrawal = currentBalance * 0.04;

  return {
    currentBalance,
    targetBalance,
    progress,
    annualWithdrawal,
  };
}

export function calculateTotal529(data: WealthData): number {
  const beneficiaries = data.education.plan529.beneficiaries;
  return beneficiaries.son.balance + beneficiaries.daughter.balance;
}

export function calculate529Progress(data: WealthData): {
  son: { current: number; target: number; progress: number; yearsRemaining: number };
  daughter: { current: number; target: number; progress: number; yearsRemaining: number };
  total: { current: number; target: number; progress: number };
} {
  const { son, daughter } = data.education.plan529.beneficiaries;
  const currentYear = new Date().getFullYear();

  const sonProgress = {
    current: son.balance,
    target: son.targetAmount,
    progress: Math.min((son.balance / son.targetAmount) * 100, 100),
    yearsRemaining: Math.max(son.targetYear - currentYear, 0),
  };

  const daughterProgress = {
    current: daughter.balance,
    target: daughter.targetAmount,
    progress: Math.min((daughter.balance / daughter.targetAmount) * 100, 100),
    yearsRemaining: Math.max(daughter.targetYear - currentYear, 0),
  };

  const totalCurrent = son.balance + daughter.balance;
  const totalTarget = son.targetAmount + daughter.targetAmount;

  return {
    son: sonProgress,
    daughter: daughterProgress,
    total: {
      current: totalCurrent,
      target: totalTarget,
      progress: Math.min((totalCurrent / totalTarget) * 100, 100),
    },
  };
}

export function calculateNetWorth(data: WealthData): {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
} {
  const retirement = calculateTotalRetirement(data);
  const education = calculateTotal529(data);
  const cash =
    data.assets.liquidCash.checking.balance +
    data.assets.liquidCash.savings.balance +
    data.assets.liquidCash.emergencyFund.balance;
  const realEstate = data.assets.realEstate.reduce((sum, prop) => sum + prop.estimatedValue, 0);

  const totalAssets = retirement + education + cash + realEstate;
  const totalLiabilities = data.liabilities.mortgage.currentBalance;
  const netWorth = totalAssets - totalLiabilities;

  return { totalAssets, totalLiabilities, netWorth };
}

export function calculateMortgageProgress(data: WealthData): {
  originalAmount: number;
  currentBalance: number;
  paidOff: number;
  progress: number;
  equity: number;
  yearsRemaining: number | null;
} {
  const mortgage = data.liabilities.mortgage;

  // Case-insensitive, whitespace-trimmed address match so minor capitalisation or
  // spacing differences in stale GitHub data don't break the equity calculation.
  const normalise = (s: string) => s.toLowerCase().trim();
  const mortgageAddr = normalise(mortgage.property);
  const property = data.assets.realEstate.find(
    (p) => normalise(p.address) === mortgageAddr
  );
  // Fail-safe: if no address match (genuinely stale/mismatched data),
  // fall back to the entry tagged as Primary Residence rather than returning 0.
  const mortgagedProperty =
    property ?? data.assets.realEstate.find((p) => p.type === 'Primary Residence');
  const propertyValue = mortgagedProperty?.estimatedValue ?? 0;

  const paidOff = Math.max(mortgage.originalAmount - mortgage.currentBalance, 0);
  const progress =
    mortgage.originalAmount > 0
      ? Math.min((paidOff / mortgage.originalAmount) * 100, 100)
      : 0;
  // Home Equity = Estimated Market Value − Outstanding Mortgage Balance
  const equity = propertyValue - mortgage.currentBalance;

  // Prefer dynamically calculated years remaining (startDate + termYears).
  // Fall back to the stored mortgage.yearsRemaining when startDate is a placeholder.
  let yearsRemaining: number | null = mortgage.yearsRemaining ?? null;
  if (mortgage.startDate && !mortgage.startDate.includes('PLACEHOLDER')) {
    const startYear = new Date(mortgage.startDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsElapsed = currentYear - startYear;
    yearsRemaining = Math.max(mortgage.termYears - yearsElapsed, 0);
  }

  return {
    originalAmount: mortgage.originalAmount,
    currentBalance: mortgage.currentBalance,
    paidOff,
    progress,
    equity,
    yearsRemaining,
  };
}

export function calculateEmergencyFundProgress(data: WealthData): {
  current: number;
  target: number;
  progress: number;
  monthsCovered: number;
} {
  const emergencyFund = data.assets.liquidCash.emergencyFund;
  const monthlyExpenses = data.retirement.targetAnnualSpend / 12;
  const targetMonths = emergencyFund.targetMonths ?? 6;
  const targetAmount = monthlyExpenses * targetMonths;
  const monthsCovered = monthlyExpenses > 0 ? emergencyFund.balance / monthlyExpenses : 0;

  return {
    current: emergencyFund.balance,
    target: targetAmount,
    progress: targetAmount > 0 ? Math.min((emergencyFund.balance / targetAmount) * 100, 100) : 0,
    monthsCovered,
  };
}

export interface RetirementScenario {
  targetAge: number;
  currentAge: number;
  yearsUntil: number;
  projectedPortfolio: number;
  projectedInheritances: number;
  ssAnnualIncome: number;
  targetNeeded: number;
  onTrack: boolean;
  shortfall: number;
}

export function calculateRetirementScenarios(data: WealthData): {
  at55: RetirementScenario;
  at60: RetirementScenario;
  at65: RetirementScenario;
} {
  const currentYear = new Date().getFullYear();
  const currentBalance = calculateTotalRetirement(data);
  const targetAnnualSpend = data.retirement.targetAnnualSpend;

  // Use husband's birth year for age calculations; fall back to a reasonable default
  const husbandBirthYear = data.family?.husband?.birthYear ?? currentYear - 45;
  const currentAge = currentYear - husbandBirthYear;

  // Combined SS monthly → annual
  const ssHusbandMonthly = data.socialSecurity?.husbandMonthly ?? 0;
  const ssWifeMonthly = data.socialSecurity?.wifeMonthly ?? 0;
  const ssAnnualTotal = (ssHusbandMonthly + ssWifeMonthly) * 12;

  const GROWTH_RATE = 0.07;
  // Full retirement age for anyone born after 1960 is 67
  const SS_START_AGE = 67;

  const buildScenario = (targetAge: number): RetirementScenario => {
    const yearsUntil = Math.max(targetAge - currentAge, 0);

    // Project portfolio at 7% compound growth
    const projectedPortfolio = currentBalance * Math.pow(1 + GROWTH_RATE, yearsUntil);

    // Include inheritances whose minimum expected timeline falls within this window
    const inheritances = data.expectedInheritances ?? [];
    const projectedInheritances = inheritances
      .filter((inh) => inh.minYears > 0 && inh.minYears <= yearsUntil)
      .reduce((sum, inh) => sum + inh.estimatedAmount, 0);

    // SS is included in the target reduction only if it starts within 5 years of retirement
    const ssYearsAfterRetirement = Math.max(SS_START_AGE - targetAge, 0);
    const ssIncluded = ssYearsAfterRetirement <= 5 ? ssAnnualTotal : 0;

    // Required portfolio = (annual need net of SS) × 25
    const effectiveAnnualNeed = Math.max(targetAnnualSpend - ssIncluded, 0);
    const targetNeeded = effectiveAnnualNeed * 25;

    const totalProjected = projectedPortfolio + projectedInheritances;
    const shortfall = targetNeeded - totalProjected;

    return {
      targetAge,
      currentAge,
      yearsUntil,
      projectedPortfolio,
      projectedInheritances,
      ssAnnualIncome: ssIncluded,
      targetNeeded,
      onTrack: shortfall <= 0,
      shortfall,
    };
  };

  return {
    at55: buildScenario(55),
    at60: buildScenario(60),
    at65: buildScenario(65),
  };
}
