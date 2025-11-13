/**
 * Calculations Hook
 *
 * Memoized scenario calculations for performance.
 */

'use client';

import { useMemo } from 'react';
import type { Scenario, ScenarioResults } from '@/types/scenario';
import { calculateBenefit, calculateSpousalBenefit } from '@/lib/calculations/ssaBenefits';
import { projectScenario } from '@/lib/calculations/financialProjections';

export function useCalculations(scenario: Scenario): ScenarioResults {
  return useMemo(() => {
    // Calculate individual benefit
    const individualBenefit = calculateBenefit(
      scenario.benefitAmount,
      scenario.birthDate,
      scenario.claimingAge
    );

    // Calculate spousal benefit if applicable
    let spousalBenefit;
    if (
      scenario.includeSpouse &&
      scenario.spouseBirthDate &&
      scenario.spouseBenefitAmount !== undefined &&
      scenario.spouseClaimingAge !== undefined
    ) {
      spousalBenefit = calculateSpousalBenefit(
        scenario.spouseBenefitAmount,
        scenario.benefitAmount,
        scenario.spouseBirthDate,
        scenario.spouseClaimingAge
      );
    }

    // Project benefits over time
    const { yearlyBenefits, cumulativeBenefits } = projectScenario(scenario);

    // Calculate total lifetime benefit
    const lifetimeBenefit = cumulativeBenefits.find(
      (cb) => cb.age === scenario.lifetimeAge
    );
    const totalLifetimeBenefit = lifetimeBenefit
      ? lifetimeBenefit.cumulativeAdjusted
      : 0;

    return {
      scenario,
      individualBenefit,
      spousalBenefit,
      yearlyBenefits,
      cumulativeBenefits,
      totalLifetimeBenefit,
    };
  }, [scenario]);
}

/**
 * Calculate results for multiple scenarios
 */
export function useMultipleCalculations(
  scenarios: Scenario[]
): ScenarioResults[] {
  return useMemo(() => {
    return scenarios.map((scenario) => {
      const individualBenefit = calculateBenefit(
        scenario.benefitAmount,
        scenario.birthDate,
        scenario.claimingAge
      );

      let spousalBenefit;
      if (
        scenario.includeSpouse &&
        scenario.spouseBirthDate &&
        scenario.spouseBenefitAmount !== undefined &&
        scenario.spouseClaimingAge !== undefined
      ) {
        spousalBenefit = calculateSpousalBenefit(
          scenario.spouseBenefitAmount,
          scenario.benefitAmount,
          scenario.spouseBirthDate,
          scenario.spouseClaimingAge
        );
      }

      const { yearlyBenefits, cumulativeBenefits } = projectScenario(scenario);

      const lifetimeBenefit = cumulativeBenefits.find(
        (cb) => cb.age === scenario.lifetimeAge
      );
      const totalLifetimeBenefit = lifetimeBenefit
        ? lifetimeBenefit.cumulativeAdjusted
        : 0;

      return {
        scenario,
        individualBenefit,
        spousalBenefit,
        yearlyBenefits,
        cumulativeBenefits,
        totalLifetimeBenefit,
      };
    });
  }, [scenarios]);
}
