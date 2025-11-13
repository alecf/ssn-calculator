/**
 * Default Values and Utilities
 *
 * Provides sensible defaults for creating new scenarios.
 */

import type { Scenario } from '@/types/scenario';
import { ASSUMPTION_PRESETS, getMaxBenefit } from './ssaRules';

/**
 * Create a default scenario with sensible starting values
 *
 * @param overrides - Optional overrides for specific fields
 * @returns A new scenario with default values
 */
export function createDefaultScenario(
  overrides?: Partial<Scenario>
): Scenario {
  const now = new Date();
  const defaultBirthDate = new Date(now.getFullYear() - 62, now.getMonth(), now.getDate());

  return {
    id: crypto.randomUUID(),
    name: 'Untitled Scenario',
    createdAt: now,
    updatedAt: now,

    // Individual - defaults to 62-year-old claiming at FRA
    birthDate: defaultBirthDate,
    benefitAmount: Math.round(getMaxBenefit() * 0.7), // 70% of max is reasonable
    claimingAge: 67, // Assume FRA of 67 for someone born in 1960+

    // Spouse - not included by default
    includeSpouse: false,
    spouseBirthDate: undefined,
    spouseBenefitAmount: undefined,
    spouseClaimingAge: undefined,

    // Financial assumptions - start with moderate preset
    assumptionPreset: 'moderate',
    investmentGrowthRate: ASSUMPTION_PRESETS.moderate.investmentGrowthRate,
    colaRate: ASSUMPTION_PRESETS.moderate.colaRate,
    inflationRate: ASSUMPTION_PRESETS.moderate.inflationRate,

    // Display preferences
    displayMode: 'today-dollars',
    includeOpportunityCost: false,
    lifetimeAge: 90,

    ...overrides,
  };
}

/**
 * Get suggested scenario names based on claiming age and assumptions
 */
export function getSuggestedScenarioName(
  claimingAge: number,
  assumptionPreset: 'conservative' | 'moderate' | 'historical' | 'custom'
): string {
  const presetLabel =
    assumptionPreset === 'conservative'
      ? 'Conservative'
      : assumptionPreset === 'moderate'
        ? 'Moderate'
        : assumptionPreset === 'historical'
          ? 'Historical'
          : 'Custom';

  return `Retire @ ${claimingAge}, ${presetLabel}`;
}

/**
 * Quick scenario templates for common strategies
 */
export const SCENARIO_TEMPLATES = {
  earlyRetirement: {
    name: 'Early Retirement (62)',
    claimingAge: 62,
    description: 'Start benefits as soon as possible',
  },
  fullRetirementAge: {
    name: 'Full Retirement Age (67)',
    claimingAge: 67,
    description: 'Wait until full retirement age for unreduced benefits',
  },
  delayedRetirement: {
    name: 'Delayed Retirement (70)',
    claimingAge: 70,
    description: 'Maximize benefits by delaying until 70',
  },
  splitStrategy: {
    name: 'Split Strategy',
    description: 'One spouse claims early, other delays',
    // This would require custom handling for spouse claiming age
  },
} as const;

/**
 * Validate that claiming age makes sense for birth date
 */
export function getEarliestClaimingDate(birthDate: Date): Date {
  const claimingDate = new Date(birthDate);
  claimingDate.setFullYear(claimingDate.getFullYear() + 62);
  return claimingDate;
}

/**
 * Check if user can currently claim benefits
 */
export function canClaimNow(birthDate: Date): boolean {
  const earliestDate = getEarliestClaimingDate(birthDate);
  return new Date() >= earliestDate;
}
