/**
 * Type definitions for Social Security calculator scenarios
 */

export interface Scenario {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // Individual information
  birthDate: Date;
  benefitAmount: number;
  claimingAge: number;

  // Spouse information (optional)
  includeSpouse: boolean;
  spouseBirthDate?: Date;
  spouseBenefitAmount?: number;
  spouseClaimingAge?: number;

  // Financial assumptions
  assumptionPreset: 'conservative' | 'moderate' | 'historical' | 'custom';
  investmentGrowthRate: number;  // Percentage (e.g., 5.0 for 5%)
  colaRate: number;               // Percentage (e.g., 2.5 for 2.5%)
  inflationRate: number;          // Percentage (e.g., 3.0 for 3%)

  // Display preferences
  displayMode: 'today-dollars' | 'future-dollars';
  includeOpportunityCost: boolean;
  lifetimeAge: 85 | 90 | 95 | 100;
}

/**
 * Full Retirement Age
 */
export interface FRA {
  years: number;
  months: number;
}

/**
 * Benefit calculation result for an individual
 */
export interface BenefitCalculation {
  monthlyBenefit: number;
  annualBenefit: number;
  adjustmentPercentage: number;  // e.g., -25 for 25% reduction, +32 for 32% increase
  fra: FRA;
}

/**
 * Spousal benefit calculation result
 */
export interface SpousalBenefitResult {
  monthlyBenefit: number;
  source: 'own' | 'spousal';  // Which benefit they're receiving
  ownBenefit: number;
  spousalBenefit: number;
}

/**
 * Yearly benefit projection
 */
export interface YearlyBenefit {
  age: number;
  year: number;
  monthlyBenefit: number;
  annualBenefit: number;
  colaAdjusted: number;
  inflationAdjusted: number;
  spouseMonthlyBenefit?: number;
  spouseAnnualBenefit?: number;
  householdAnnualBenefit?: number;
}

/**
 * Cumulative benefit over time
 */
export interface CumulativeBenefit {
  age: number;
  year: number;
  cumulative: number;
  cumulativeAdjusted: number;  // Inflation-adjusted
  opportunityCost?: number;
  netValue?: number;  // cumulative - opportunityCost
  spouseCumulative?: number;
  householdCumulative?: number;
  // Investment-related fields (calculated if withInvestment is enabled)
  investmentPrincipal?: number;  // Total principal invested (at investmentRatio)
  investedValue?: number;  // Principal + accumulated investment returns
  cumulativeWithInvestment?: number;  // cumulative + investedValue (total net worth)
}

/**
 * Complete scenario calculation results
 */
export interface ScenarioResults {
  scenario: Scenario;
  individualBenefit: BenefitCalculation;
  spousalBenefit?: SpousalBenefitResult;
  yearlyBenefits: YearlyBenefit[];
  cumulativeBenefits: CumulativeBenefit[];
  totalLifetimeBenefit: number;
  breakevens?: Record<string, number | null>;  // Breakeven ages vs other scenarios
}

/**
 * Breakeven analysis between two scenarios
 */
export interface BreakevenAnalysis {
  scenarioId1: string;
  scenarioId2: string;
  breakevenAge: number | null;  // Age where cumulative benefits are equal, null if never
  description: string;  // e.g., "Scenario A breaks even with Scenario B at age 78"
}

/**
 * Comparison of multiple scenarios
 */
export interface ScenarioComparison {
  scenarios: ScenarioResults[];
  breakevens: BreakevenAnalysis[];
  bestScenarios: {
    shortTerm: string;   // Best if you die young (e.g., before 75)
    mediumTerm: string;  // Best for average life expectancy (e.g., 75-85)
    longTerm: string;    // Best if you live long (e.g., 85+)
  };
}
