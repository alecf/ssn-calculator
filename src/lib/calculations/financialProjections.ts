/**
 * Financial Projections Engine
 *
 * This module handles year-by-year benefit projections with COLA adjustments,
 * inflation adjustments, and opportunity cost calculations.
 */

import type {
  Scenario,
  YearlyBenefit,
  CumulativeBenefit,
  BenefitCalculation,
  SpousalBenefitResult,
} from '@/types/scenario';
import { calculateBenefit, calculateSpousalBenefit, calculateAge } from './ssaBenefits';

/**
 * Project benefits year by year with COLA adjustments
 *
 * @param startingBenefit - Monthly benefit at claiming age
 * @param claimingAge - Age when benefits start
 * @param endAge - Age to project to (e.g., 100)
 * @param colaRate - Annual COLA rate (e.g., 2.5 for 2.5%)
 * @param birthDate - Birth date for calculating years
 * @returns Array of yearly benefits with COLA applied
 */
export function projectBenefits(
  startingBenefit: number,
  claimingAge: number,
  endAge: number,
  colaRate: number,
  birthDate: Date,
  inflationRate: number = colaRate  // Default: assume inflation = COLA
): YearlyBenefit[] {
  const benefits: YearlyBenefit[] = [];
  const currentYear = new Date().getFullYear();
  const birthYear = birthDate.getFullYear();

  for (let age = Math.ceil(claimingAge); age <= endAge; age++) {
    const year = birthYear + age;
    const yearsFromClaiming = age - Math.ceil(claimingAge);

    // Benefit in today's dollars grows by the net of (COLA - inflation)
    // COLA increases the nominal benefit, inflation decreases purchasing power
    // Net effect: benefit grows if COLA > inflation, shrinks if COLA < inflation
    const realGrowthRate = colaRate - inflationRate;
    const monthlyBenefitTodaysDollars = startingBenefit * Math.pow(1 + realGrowthRate / 100, yearsFromClaiming);

    // Nominal benefit grows by COLA rate from the starting benefit
    // This is what Social Security actually pays out
    const nominalMonthlyBenefit = startingBenefit * Math.pow(1 + colaRate / 100, yearsFromClaiming);

    benefits.push({
      age,
      year,
      monthlyBenefit: nominalMonthlyBenefit,  // Nominal dollars (with COLA growth)
      annualBenefit: nominalMonthlyBenefit * 12,
      colaAdjusted: nominalMonthlyBenefit,    // Same as monthlyBenefit
      inflationAdjusted: monthlyBenefitTodaysDollars, // Today's dollars (grows/shrinks by real growth rate)
    });
  }

  return benefits;
}

/**
 * Apply inflation adjustment to convert to "today's dollars"
 *
 * @param benefits - Array of yearly benefits
 * @param inflationRate - Annual inflation rate (e.g., 3.0 for 3%)
 * @param baseYear - Base year for inflation adjustment (default: current year)
 * @returns Benefits array with inflation-adjusted values
 */
export function applyInflation(
  benefits: YearlyBenefit[],
  inflationRate: number,
  baseYear: number = new Date().getFullYear()
): YearlyBenefit[] {
  return benefits.map((benefit) => {
    const yearsFromBase = benefit.year - baseYear;
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromBase);
    const inflationAdjusted = benefit.colaAdjusted / inflationFactor;

    return {
      ...benefit,
      inflationAdjusted,
    };
  });
}

/**
 * Calculate cumulative benefits over time
 *
 * @param benefits - Array of yearly benefits
 * @param useTodaysDollars - Whether to use inflation-adjusted values
 * @returns Array of cumulative benefits by age
 */
export function calculateCumulativeBenefits(
  benefits: YearlyBenefit[],
  useTodaysDollars: boolean = true
): CumulativeBenefit[] {
  const cumulative: CumulativeBenefit[] = [];
  let runningTotal = 0;
  let runningAdjustedTotal = 0;

  for (const benefit of benefits) {
    runningTotal += benefit.annualBenefit;
    runningAdjustedTotal += benefit.inflationAdjusted * 12; // Annual amount

    cumulative.push({
      age: benefit.age,
      year: benefit.year,
      cumulative: runningTotal,
      cumulativeAdjusted: runningAdjustedTotal,
    });
  }

  return cumulative;
}

/**
 * Calculate opportunity cost of delayed claiming
 *
 * If you claim early, you get money sooner which could be invested.
 * This calculates the value of early benefits if invested at a given growth rate.
 *
 * @param earlyClaimingAge - Age for early claiming scenario
 * @param earlyBenefit - Annual benefit for early claiming
 * @param delayedClaimingAge - Age for delayed claiming scenario
 * @param currentAge - Current age in projection
 * @param growthRate - Investment growth rate (e.g., 5.0 for 5%)
 * @returns Accumulated value of early benefits that could have been invested
 */
export function calculateOpportunityCost(
  earlyClaimingAge: number,
  earlyBenefit: number,
  delayedClaimingAge: number,
  currentAge: number,
  growthRate: number
): number {
  // No opportunity cost before delayed claiming age
  if (currentAge < delayedClaimingAge) {
    return 0;
  }

  // Calculate the value of early benefits invested from early age to current age
  let opportunityValue = 0;
  const yearsOfEarlyBenefits = delayedClaimingAge - earlyClaimingAge;

  // For each year of early benefits, calculate its future value at current age
  for (let i = 0; i < yearsOfEarlyBenefits; i++) {
    const yearsOfGrowth = currentAge - (earlyClaimingAge + i);
    const futureValue = earlyBenefit * Math.pow(1 + growthRate / 100, yearsOfGrowth);
    opportunityValue += futureValue;
  }

  return opportunityValue;
}

/**
 * Project complete scenario including individual and spousal benefits
 *
 * @param scenario - Complete scenario configuration
 * @returns Complete projection with yearly and cumulative benefits
 */
export function projectScenario(scenario: Scenario): {
  yearlyBenefits: YearlyBenefit[];
  cumulativeBenefits: CumulativeBenefit[];
} {
  // Calculate individual benefit
  // benefitAmount is in today's dollars, and calculateBenefit returns it in today's dollars too
  const individualBenefit = calculateBenefit(
    scenario.benefitAmount,
    scenario.birthDate,
    scenario.claimingAge
  );

  // Project individual benefits (all calculations in today's dollars)
  let yearlyBenefits = projectBenefits(
    individualBenefit.monthlyBenefit,
    scenario.claimingAge,
    scenario.lifetimeAge,
    scenario.colaRate,
    scenario.birthDate,
    scenario.inflationRate
  );

  // Add spousal benefits if applicable
  if (
    scenario.includeSpouse &&
    scenario.spouseBirthDate &&
    scenario.spouseBenefitAmount !== undefined &&
    scenario.spouseClaimingAge !== undefined
  ) {
    const spousalBenefit = calculateSpousalBenefit(
      scenario.spouseBenefitAmount,
      scenario.benefitAmount,
      scenario.spouseBirthDate,
      scenario.spouseClaimingAge
    );

    // Project spousal benefits (all calculations in today's dollars)
    const spouseBenefits = projectBenefits(
      spousalBenefit.monthlyBenefit,
      scenario.spouseClaimingAge,
      scenario.lifetimeAge,
      scenario.colaRate,
      scenario.spouseBirthDate,
      scenario.inflationRate
    );

    // Merge individual and spousal benefits by age
    yearlyBenefits = yearlyBenefits.map((benefit) => {
      const spouseBenefit = spouseBenefits.find((sb) => sb.age === benefit.age);

      return {
        ...benefit,
        spouseMonthlyBenefit: spouseBenefit?.monthlyBenefit,
        spouseAnnualBenefit: spouseBenefit?.annualBenefit,
        householdAnnualBenefit:
          benefit.annualBenefit + (spouseBenefit?.annualBenefit || 0),
      };
    });
  }

  // All values are now in today's dollars (inflationAdjusted) and nominal dollars (monthlyBenefit)
  // Calculate cumulative benefits (always include both nominal and adjusted)
  const cumulativeBenefits = calculateCumulativeBenefits(yearlyBenefits, true);

  // Add household cumulative if spouse is included
  if (scenario.includeSpouse) {
    let householdCumulative = 0;
    cumulativeBenefits.forEach((cb, index) => {
      const yearly = yearlyBenefits[index];
      householdCumulative += yearly.householdAnnualBenefit || yearly.annualBenefit;

      cb.householdCumulative = householdCumulative;
    });
  }

  return {
    yearlyBenefits,
    cumulativeBenefits,
  };
}

/**
 * Calculate total lifetime benefits up to a specific age
 *
 * @param cumulativeBenefits - Array of cumulative benefits
 * @param endAge - Age to calculate total up to
 * @returns Total lifetime benefit amount
 */
export function getTotalLifetimeBenefit(
  cumulativeBenefits: CumulativeBenefit[],
  endAge: number
): number {
  const benefitAtAge = cumulativeBenefits.find((cb) => cb.age === endAge);
  return benefitAtAge?.cumulativeAdjusted || 0;
}

/**
 * Compare two scenarios for opportunity cost analysis
 *
 * @param earlyScenario - Scenario with earlier claiming age
 * @param delayedScenario - Scenario with later claiming age
 * @param growthRate - Investment growth rate for opportunity cost
 * @returns Cumulative benefits for delayed scenario adjusted for opportunity cost
 */
export function compareWithOpportunityCost(
  earlyScenario: Scenario,
  delayedScenario: Scenario,
  growthRate: number
): CumulativeBenefit[] {
  const earlyProjection = projectScenario(earlyScenario);
  const delayedProjection = projectScenario(delayedScenario);

  // Calculate opportunity cost for each age in delayed scenario
  const earlyAnnualBenefit = earlyProjection.yearlyBenefits[0]?.annualBenefit || 0;

  return delayedProjection.cumulativeBenefits.map((cb) => {
    const opportunityCost = calculateOpportunityCost(
      earlyScenario.claimingAge,
      earlyAnnualBenefit,
      delayedScenario.claimingAge,
      cb.age,
      growthRate
    );

    return {
      ...cb,
      opportunityCost,
      netValue: cb.cumulativeAdjusted - opportunityCost,
    };
  });
}
