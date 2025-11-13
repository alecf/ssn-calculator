/**
 * Breakeven Analysis
 *
 * This module calculates breakeven points between different claiming scenarios.
 * The breakeven age is when the cumulative benefits of two scenarios become equal.
 */

import type { CumulativeBenefit, BreakevenAnalysis, Scenario, YearlyBenefit } from '@/types/scenario';
import { addInvestmentReturns } from './financialProjections';

/**
 * Find the breakeven age between two scenarios
 *
 * The breakeven age is where the cumulative benefits cross over.
 * This tells you at what age one scenario becomes better than another.
 *
 * @param scenario1Data - Cumulative benefits for first scenario
 * @param scenario2Data - Cumulative benefits for second scenario
 * @returns Breakeven age, or null if they never cross
 */
export function findBreakevenAge(
  scenario1Data: CumulativeBenefit[],
  scenario2Data: CumulativeBenefit[]
): number | null {
  // Find common age range
  const minAge = Math.max(
    scenario1Data[0]?.age || 0,
    scenario2Data[0]?.age || 0
  );
  const maxAge = Math.min(
    scenario1Data[scenario1Data.length - 1]?.age || 100,
    scenario2Data[scenario2Data.length - 1]?.age || 100
  );

  // Look for crossover point
  let previousDiff = 0;

  for (let age = minAge; age <= maxAge; age++) {
    const benefit1 = scenario1Data.find((b) => b.age === age);
    const benefit2 = scenario2Data.find((b) => b.age === age);

    if (!benefit1 || !benefit2) continue;

    // Use inflation-adjusted cumulative for fair comparison
    const cumulative1 = benefit1.netValue !== undefined
      ? benefit1.netValue
      : benefit1.cumulativeAdjusted;
    const cumulative2 = benefit2.netValue !== undefined
      ? benefit2.netValue
      : benefit2.cumulativeAdjusted;

    const diff = cumulative1 - cumulative2;

    // Check for crossover (sign change)
    if (age > minAge && previousDiff * diff < 0) {
      // Linear interpolation to find exact crossover point
      const ageDiff = Math.abs(previousDiff / (diff - previousDiff));
      return age - 1 + ageDiff;
    }

    previousDiff = diff;
  }

  // No breakeven found
  return null;
}

/**
 * Calculate all pairwise breakevens for a set of scenarios
 *
 * @param scenarios - Map of scenario ID to cumulative benefits
 * @param scenarioNames - Map of scenario ID to scenario name
 * @returns Matrix of breakeven ages
 */
export function calculateAllBreakevens(
  scenarios: Map<string, CumulativeBenefit[]>,
  scenarioNames: Map<string, string>
): BreakevenAnalysis[] {
  const results: BreakevenAnalysis[] = [];
  const scenarioIds = Array.from(scenarios.keys());

  // Calculate pairwise breakevens
  for (let i = 0; i < scenarioIds.length; i++) {
    for (let j = i + 1; j < scenarioIds.length; j++) {
      const id1 = scenarioIds[i];
      const id2 = scenarioIds[j];
      const data1 = scenarios.get(id1);
      const data2 = scenarios.get(id2);

      if (!data1 || !data2) continue;

      const breakevenAge = findBreakevenAge(data1, data2);
      const name1 = scenarioNames.get(id1) || 'Scenario 1';
      const name2 = scenarioNames.get(id2) || 'Scenario 2';

      let description: string;
      if (breakevenAge === null) {
        // Determine which is always better
        const lastAge1 = data1[data1.length - 1];
        const lastAge2 = data2[data2.length - 1];
        const cumulative1 = lastAge1.netValue ?? lastAge1.cumulativeAdjusted;
        const cumulative2 = lastAge2.netValue ?? lastAge2.cumulativeAdjusted;

        if (cumulative1 > cumulative2) {
          description = `${name1} is always better than ${name2}`;
        } else {
          description = `${name2} is always better than ${name1}`;
        }
      } else {
        description = `${name1} breaks even with ${name2} at age ${Math.round(breakevenAge)}`;
      }

      results.push({
        scenarioId1: id1,
        scenarioId2: id2,
        breakevenAge,
        description,
      });
    }
  }

  return results;
}

/**
 * Determine which scenario is best for different life expectancies
 *
 * @param scenarios - Array of scenarios with their cumulative benefits
 * @param shortTermAge - Age for short-term comparison (e.g., 75)
 * @param mediumTermAge - Age for medium-term comparison (e.g., 85)
 * @param longTermAge - Age for long-term comparison (e.g., 95)
 * @returns IDs of best scenarios for each term
 */
export function findBestScenarios(
  scenarios: Array<{
    id: string;
    name: string;
    cumulativeBenefits: CumulativeBenefit[];
  }>,
  shortTermAge: number = 75,
  mediumTermAge: number = 85,
  longTermAge: number = 95
): {
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
} {
  const getValue = (
    cumulativeBenefits: CumulativeBenefit[],
    targetAge: number
  ): number => {
    const benefit = cumulativeBenefits.find((cb) => cb.age === targetAge);
    return benefit?.netValue ?? benefit?.cumulativeAdjusted ?? 0;
  };

  // Find best for short term
  let bestShortTerm = scenarios[0];
  let maxShortTermValue = getValue(bestShortTerm.cumulativeBenefits, shortTermAge);

  for (const scenario of scenarios) {
    const value = getValue(scenario.cumulativeBenefits, shortTermAge);
    if (value > maxShortTermValue) {
      maxShortTermValue = value;
      bestShortTerm = scenario;
    }
  }

  // Find best for medium term
  let bestMediumTerm = scenarios[0];
  let maxMediumTermValue = getValue(bestMediumTerm.cumulativeBenefits, mediumTermAge);

  for (const scenario of scenarios) {
    const value = getValue(scenario.cumulativeBenefits, mediumTermAge);
    if (value > maxMediumTermValue) {
      maxMediumTermValue = value;
      bestMediumTerm = scenario;
    }
  }

  // Find best for long term
  let bestLongTerm = scenarios[0];
  let maxLongTermValue = getValue(bestLongTerm.cumulativeBenefits, longTermAge);

  for (const scenario of scenarios) {
    const value = getValue(scenario.cumulativeBenefits, longTermAge);
    if (value > maxLongTermValue) {
      maxLongTermValue = value;
      bestLongTerm = scenario;
    }
  }

  return {
    shortTerm: bestShortTerm.id,
    mediumTerm: bestMediumTerm.id,
    longTerm: bestLongTerm.id,
  };
}

/**
 * Calculate simple breakeven age between two scenarios
 * (convenience function for UI)
 *
 * @param scenario1 - First scenario with projections
 * @param scenario2 - Second scenario with projections
 * @returns Breakeven age or null
 */
export function simpleBreakeven(
  scenario1: { cumulativeBenefits: CumulativeBenefit[] },
  scenario2: { cumulativeBenefits: CumulativeBenefit[] }
): number | null {
  return findBreakevenAge(
    scenario1.cumulativeBenefits,
    scenario2.cumulativeBenefits
  );
}

/**
 * Get the display value for a cumulative benefit based on inflation and investment toggles
 *
 * This function applies the same transformation logic as the chart to ensure
 * breakeven calculations use the same values that are displayed.
 *
 * @param benefit - Cumulative benefit data point
 * @param withInflation - Whether to use inflation-adjusted values
 * @param withInvestment - Whether to include investment returns
 * @param yearlyBenefit - Yearly benefit data for context
 * @returns The display value to use for comparison
 */
export function getDisplayValue(
  benefit: CumulativeBenefit,
  withInflation: boolean,
  withInvestment: boolean,
  yearlyBenefit?: { inflationAdjusted: number; monthlyBenefit: number }
): number {
  // Priority order: investment > inflation > nominal
  if (withInvestment && benefit.cumulativeWithInvestment !== undefined) {
    return benefit.cumulativeWithInvestment;
  } else if (withInflation) {
    return benefit.netValue ?? benefit.cumulativeAdjusted;
  } else {
    return benefit.cumulative;
  }
}

/**
 * Find breakeven age considering inflation and investment toggles
 *
 * This recalculates breakeven using the same values displayed in the chart.
 *
 * @param scenario1Data - Cumulative benefits for first scenario
 * @param scenario2Data - Cumulative benefits for second scenario
 * @param withInflation - Whether to use inflation-adjusted values
 * @param withInvestment - Whether to include investment returns
 * @param scenario1Yearly - Yearly benefits for scenario 1
 * @param scenario2Yearly - Yearly benefits for scenario 2
 * @param investmentGrowthRate1 - Investment growth rate for scenario 1 (optional)
 * @param investmentGrowthRate2 - Investment growth rate for scenario 2 (optional)
 * @param investmentRatio - Percentage of benefits to invest (0-100, default 100)
 * @returns Breakeven age, or null if they never cross
 */
export function findBreakevenAgeWithToggles(
  scenario1Data: CumulativeBenefit[],
  scenario2Data: CumulativeBenefit[],
  withInflation: boolean,
  withInvestment: boolean,
  scenario1Yearly?: YearlyBenefit[],
  scenario2Yearly?: YearlyBenefit[],
  investmentGrowthRate1?: number,
  investmentGrowthRate2?: number,
  investmentRatio: number = 100
): number | null {
  // Apply investment returns if needed
  let benefits1 = scenario1Data;
  let benefits2 = scenario2Data;

  if (withInvestment) {
    if (scenario1Yearly && investmentGrowthRate1 !== undefined) {
      benefits1 = addInvestmentReturns(
        scenario1Data,
        scenario1Yearly,
        investmentGrowthRate1,
        investmentRatio
      );
    }
    if (scenario2Yearly && investmentGrowthRate2 !== undefined) {
      benefits2 = addInvestmentReturns(
        scenario2Data,
        scenario2Yearly,
        investmentGrowthRate2,
        investmentRatio
      );
    }
  }

  // Find common age range
  const minAge = Math.max(
    benefits1[0]?.age || 0,
    benefits2[0]?.age || 0
  );
  const maxAge = Math.min(
    benefits1[benefits1.length - 1]?.age || 100,
    benefits2[benefits2.length - 1]?.age || 100
  );

  // Look for crossover point
  let previousDiff = 0;

  for (let age = minAge; age <= maxAge; age++) {
    const benefit1 = benefits1.find((b) => b.age === age);
    const benefit2 = benefits2.find((b) => b.age === age);

    if (!benefit1 || !benefit2) continue;

    // Get yearly benefits for context if provided
    const yearly1 = scenario1Yearly?.find((b) => b.age === age);
    const yearly2 = scenario2Yearly?.find((b) => b.age === age);

    // Use display values based on toggle state
    const cumulative1 = getDisplayValue(benefit1, withInflation, withInvestment, yearly1);
    const cumulative2 = getDisplayValue(benefit2, withInflation, withInvestment, yearly2);

    const diff = cumulative1 - cumulative2;

    // Check for crossover (sign change)
    if (age > minAge && previousDiff * diff < 0) {
      // Linear interpolation to find exact crossover point
      const ageDiff = Math.abs(previousDiff / (diff - previousDiff));
      return age - 1 + ageDiff;
    }

    previousDiff = diff;
  }

  // No breakeven found
  return null;
}
