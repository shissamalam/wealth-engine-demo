export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  value: number;
}

export interface RetirementAccount {
  label: string;
  balance: number;
  holdings?: Holding[];
  employer?: string;
  vestingPercent?: number;
  riskScore?: number;
}

export interface Beneficiary {
  name: string;
  balance: number;
  targetYear: number;
  targetAmount: number;
}

export interface Plan529 {
  provider: string;
  beneficiaries: {
    son: Beneficiary;
    daughter: Beneficiary;
  };
}

export interface ExternalEducationGift {
  id: string;
  description: string;
  balance: number;
  beneficiary: string;
  notes: string;
}

export interface CashAccount {
  label: string;
  balance: number;
  institution: string;
  apy?: number;
  targetMonths?: number;
}

export interface RealEstateAsset {
  id: string;
  address: string;
  type: string;
  purchasePrice: number;
  purchaseDate: string;
  estimatedValue: number;
  notes: string;
}

export interface Mortgage {
  property: string;
  lender: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  termYears: number;
  yearsRemaining?: number;
}

export interface StrategyInsight {
  id: string;
  date: string;
  category: 'tax' | 'allocation' | 'risk' | 'opportunity';
  title: string;
  summary: string;
  priority: 'low' | 'medium' | 'high';
}

export interface FamilyMember {
  name: string;
  birthYear: number;
  employed: boolean;
  grossSalary: number;
  role: 'husband' | 'wife';
}

export interface Dependent {
  name: string;
  birthYear: number;
  role: 'son' | 'daughter';
}

export interface SocialSecurityEstimate {
  husbandMonthly: number;
  wifeMonthly: number;
}

export interface ExpectedInheritance {
  id: string;
  description: string;
  estimatedAmount: number;
  minYears: number;
  maxYears: number;
  beneficiary: 'husband' | 'wife' | 'joint';
  notes: string;
}

export interface WealthData {
  meta: {
    lastUpdated: string;
    version: string;
  };
  family?: {
    husband: FamilyMember;
    wife: FamilyMember;
    son: Dependent;
    daughter: Dependent;
  };
  socialSecurity?: SocialSecurityEstimate;
  expectedInheritances?: ExpectedInheritance[];
  retirement: {
    targetAnnualSpend: number;
    accounts: {
      vanguardIRAMine: RetirementAccount;
      vanguardIRASon: RetirementAccount;
      vanguardIRADaughter: RetirementAccount;
      employer403b: RetirementAccount;
      wealthfront: RetirementAccount;
    };
  };
  education: {
    plan529: Plan529;
    externalGifts?: ExternalEducationGift[];
  };
  assets: {
    liquidCash: {
      checking: CashAccount;
      savings: CashAccount;
      emergencyFund: CashAccount;
    };
    realEstate: RealEstateAsset[];
  };
  liabilities: {
    mortgage: Mortgage;
  };
  strategyFeed: {
    insights: StrategyInsight[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
