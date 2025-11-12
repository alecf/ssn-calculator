/**
 * Social Security Benefits Calculation Engine
 *
 * This module implements the core SSA benefit calculation logic based on official
 * SSA rules for Full Retirement Age, early retirement reductions, and delayed
 * retirement credits.
 */

import {
  FRA_TABLE,
  EARLY_REDUCTION_RATE_36,
  EARLY_REDUCTION_RATE_BEYOND,
  DELAYED_CREDIT_RATE,
  SPOUSAL_BENEFIT_RATE,
  MIN_CLAIMING_AGE,
  MAX_CLAIMING_AGE,
  MAX_BENEFIT_BY_YEAR,
} from '@/constants/ssaRules';
import type { FRA, BenefitCalculation, SpousalBenefitResult } from '@/types/scenario';

/**
 * Calculate Full Retirement Age based on birth date
 *
 * @param birthDate - The individual's birth date
 * @returns Full Retirement Age in years and months
 */
export function calculateFRA(birthDate: Date): FRA {
  const birthYear = birthDate.getFullYear();

  // For anyone born 1960 or later, FRA is 67
  if (birthYear >= 1960) {
    return { years: 67, months: 0 };
  }

  // For anyone born before 1943, FRA is 66 (though they're likely already retired)
  if (birthYear < 1943) {
    return { years: 66, months: 0 };
  }

  // Look up in the FRA table
  return FRA_TABLE[birthYear] || { years: 67, months: 0 };
}

/**
 * Project the maximum Social Security benefit at a user's Full Retirement Age
 *
 * This accounts for COLA (Cost of Living Adjustment) increases from today
 * until the user reaches their FRA.
 *
 * @param birthDate - The individual's birth date (to determine FRA)
 * @param colaRate - Expected annual COLA rate (e.g., 0.025 for 2.5%)
 * @returns Projected maximum monthly benefit at FRA
 */
export function projectMaxBenefitAtFRA(
  birthDate: Date,
  colaRate: number = 0.025
): number {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Get current maximum benefit
  const currentMaxBenefit = MAX_BENEFIT_BY_YEAR[currentYear] || MAX_BENEFIT_BY_YEAR[2025];

  // Calculate when user will reach FRA
  const fra = calculateFRA(birthDate);
  const fraAge = fra.years + fra.months / 12;

  // Get user's birth year and calculate approximate FRA year
  const birthYear = birthDate.getFullYear();
  const fraYear = birthYear + Math.floor(fraAge);

  // Calculate number of years until FRA
  const yearsUntilFRA = fraYear - currentYear;

  // If FRA is in the past or very soon, don't apply growth
  if (yearsUntilFRA <= 0) {
    return currentMaxBenefit;
  }

  // Project forward using compound COLA growth
  const projectedMaxBenefit = currentMaxBenefit * Math.pow(1 + colaRate, yearsUntilFRA);

  return Math.round(projectedMaxBenefit);
}

/**
 * Convert FRA to total months
 */
function fraToMonths(fra: FRA): number {
  return fra.years * 12 + fra.months;
}

/**
 * Calculate age in years and months
 */
function getAgeInMonths(birthDate: Date, asOfDate: Date = new Date()): number {
  const years = asOfDate.getFullYear() - birthDate.getFullYear();
  const months = asOfDate.getMonth() - birthDate.getMonth();
  return years * 12 + months;
}

/**
 * Calculate the reduction percentage for early claiming
 *
 * Per SSA rules:
 * - First 36 months before FRA: 5/9 of 1% per month (6.67% per year)
 * - Each additional month beyond 36: 5/12 of 1% per month (5% per year)
 *
 * @param claimingAge - Age when claiming benefits (62-70)
 * @param fra - Full Retirement Age
 * @returns Reduction percentage (e.g., -0.25 for 25% reduction)
 */
export function calculateEarlyReductionPercentage(
  claimingAge: number,
  fra: FRA
): number {
  const claimingMonths = claimingAge * 12;
  const fraMonths = fraToMonths(fra);
  const monthsBeforeFRA = fraMonths - claimingMonths;

  if (monthsBeforeFRA <= 0) {
    return 0; // No reduction if claiming at or after FRA
  }

  // Calculate reduction based on SSA rules
  let reductionPercentage = 0;

  if (monthsBeforeFRA <= 36) {
    // First 36 months: 5/9 of 1% per month
    reductionPercentage = monthsBeforeFRA * EARLY_REDUCTION_RATE_36;
  } else {
    // First 36 months at 5/9 rate, remaining months at 5/12 rate
    reductionPercentage =
      36 * EARLY_REDUCTION_RATE_36 +
      (monthsBeforeFRA - 36) * EARLY_REDUCTION_RATE_BEYOND;
  }

  return -reductionPercentage; // Return as negative percentage
}

/**
 * Calculate the delayed retirement credit percentage
 *
 * Per SSA rules:
 * - 2/3 of 1% per month (8% per year) from FRA to age 70
 * - No additional credits after age 70
 *
 * @param claimingAge - Age when claiming benefits (62-70)
 * @param fra - Full Retirement Age
 * @returns Credit percentage (e.g., 0.32 for 32% increase)
 */
export function calculateDelayedCreditPercentage(
  claimingAge: number,
  fra: FRA
): number {
  const claimingMonths = claimingAge * 12;
  const fraMonths = fraToMonths(fra);
  const monthsAfterFRA = claimingMonths - fraMonths;

  if (monthsAfterFRA <= 0) {
    return 0; // No credits if claiming before or at FRA
  }

  // Cap at age 70 (no additional credits after 70)
  const maxMonths = (MAX_CLAIMING_AGE - (fraMonths / 12)) * 12;
  const effectiveMonths = Math.min(monthsAfterFRA, maxMonths);

  // Calculate credit: 2/3 of 1% per month
  const creditPercentage = effectiveMonths * DELAYED_CREDIT_RATE;

  return creditPercentage;
}

/**
 * Calculate monthly benefit at any claiming age
 *
 * @param baseAmount - Monthly benefit at Full Retirement Age (PIA)
 * @param birthDate - Individual's birth date
 * @param claimingAge - Age when claiming benefits (62-70)
 * @returns Complete benefit calculation with adjustments
 */
export function calculateBenefit(
  baseAmount: number,
  birthDate: Date,
  claimingAge: number
): BenefitCalculation {
  // Validate claiming age
  if (claimingAge < MIN_CLAIMING_AGE || claimingAge > MAX_CLAIMING_AGE) {
    throw new Error(
      `Claiming age must be between ${MIN_CLAIMING_AGE} and ${MAX_CLAIMING_AGE}, got ${claimingAge}`
    );
  }

  const fra = calculateFRA(birthDate);
  const fraAge = fra.years + fra.months / 12;

  let adjustmentPercentage = 0;
  let monthlyBenefit = baseAmount;

  if (claimingAge < fraAge) {
    // Early retirement: apply reduction
    adjustmentPercentage = calculateEarlyReductionPercentage(claimingAge, fra);
    monthlyBenefit = baseAmount * (1 + adjustmentPercentage);
  } else if (claimingAge > fraAge) {
    // Delayed retirement: apply credits
    adjustmentPercentage = calculateDelayedCreditPercentage(claimingAge, fra);
    monthlyBenefit = baseAmount * (1 + adjustmentPercentage);
  }

  return {
    monthlyBenefit,
    annualBenefit: monthlyBenefit * 12,
    adjustmentPercentage: adjustmentPercentage * 100, // Convert to percentage for display
    fra,
  };
}

/**
 * Calculate spousal benefit
 *
 * The spouse receives the HIGHER of:
 * - Their own retirement benefit, OR
 * - 50% of the primary earner's Primary Insurance Amount (PIA)
 *
 * If claiming before FRA, the spousal benefit is also reduced.
 *
 * @param ownBaseAmount - Spouse's own benefit at FRA
 * @param partnerBaseAmount - Partner's benefit at FRA
 * @param spouseBirthDate - Spouse's birth date
 * @param spouseClaimingAge - Age when spouse claims benefits
 * @returns Spousal benefit calculation result
 */
export function calculateSpousalBenefit(
  ownBaseAmount: number,
  partnerBaseAmount: number,
  spouseBirthDate: Date,
  spouseClaimingAge: number
): SpousalBenefitResult {
  // Calculate spouse's own benefit at their claiming age
  const ownBenefitCalc = calculateBenefit(
    ownBaseAmount,
    spouseBirthDate,
    spouseClaimingAge
  );

  // Calculate spousal benefit (50% of partner's PIA)
  const spousalBaseBenefit = partnerBaseAmount * SPOUSAL_BENEFIT_RATE;

  // Apply early reduction to spousal benefit if claiming before FRA
  const spouseFRA = calculateFRA(spouseBirthDate);
  const spouseFRAAge = spouseFRA.years + spouseFRA.months / 12;

  let spousalBenefit = spousalBaseBenefit;
  if (spouseClaimingAge < spouseFRAAge) {
    const adjustmentPercentage = calculateEarlyReductionPercentage(
      spouseClaimingAge,
      spouseFRA
    );
    spousalBenefit = spousalBaseBenefit * (1 + adjustmentPercentage);
  }

  // Spouse gets the higher of the two
  const monthlyBenefit = Math.max(ownBenefitCalc.monthlyBenefit, spousalBenefit);
  const source = ownBenefitCalc.monthlyBenefit >= spousalBenefit ? 'own' : 'spousal';

  return {
    monthlyBenefit,
    source,
    ownBenefit: ownBenefitCalc.monthlyBenefit,
    spousalBenefit,
  };
}

/**
 * Validate benefit amount against maximum
 *
 * @param amount - Benefit amount to validate
 * @param maxBenefit - Maximum allowable benefit for the year
 * @returns True if valid, false if exceeds maximum by more than 25%
 */
export function validateBenefitAmount(
  amount: number,
  maxBenefit: number
): boolean {
  return amount <= maxBenefit * 1.25;
}

/**
 * Calculate current age
 *
 * @param birthDate - Birth date
 * @param asOfDate - Date to calculate age as of (defaults to today)
 * @returns Age in years (with decimal for partial years)
 */
export function calculateAge(
  birthDate: Date,
  asOfDate: Date = new Date()
): number {
  const ageInMonths = getAgeInMonths(birthDate, asOfDate);
  return ageInMonths / 12;
}

/**
 * Get FRA as a decimal age (e.g., 66.5 for 66 years 6 months)
 */
export function getFRAAsDecimal(fra: FRA): number {
  return fra.years + fra.months / 12;
}
