/**
 * Social Security Administration Rules and Constants
 *
 * This file contains official SSA rules for calculating retirement benefits,
 * including Full Retirement Age tables, reduction rates, and credit rates.
 *
 * Sources:
 * - https://www.ssa.gov/benefits/retirement/planner/agereduction.html
 * - https://www.ssa.gov/benefits/retirement/planner/delayret.html
 */

/** Full Retirement Age by birth year */
export const FRA_TABLE: Record<number, { years: number; months: number }> = {
  // Born 1943-1954: FRA is 66
  1943: { years: 66, months: 0 },
  1944: { years: 66, months: 0 },
  1945: { years: 66, months: 0 },
  1946: { years: 66, months: 0 },
  1947: { years: 66, months: 0 },
  1948: { years: 66, months: 0 },
  1949: { years: 66, months: 0 },
  1950: { years: 66, months: 0 },
  1951: { years: 66, months: 0 },
  1952: { years: 66, months: 0 },
  1953: { years: 66, months: 0 },
  1954: { years: 66, months: 0 },

  // Gradual increase from 66 to 67
  1955: { years: 66, months: 2 },
  1956: { years: 66, months: 4 },
  1957: { years: 66, months: 6 },
  1958: { years: 66, months: 8 },
  1959: { years: 66, months: 10 },

  // Born 1960 or later: FRA is 67
  1960: { years: 67, months: 0 },
};

/**
 * Early retirement reduction rates
 *
 * Per SSA rules:
 * - First 36 months before FRA: 5/9 of 1% per month (6.67% per year)
 * - Each additional month beyond 36: 5/12 of 1% per month (5% per year)
 */
export const EARLY_REDUCTION_RATE_36 = (5 / 9) / 100; // 0.00555... per month
export const EARLY_REDUCTION_RATE_BEYOND = (5 / 12) / 100; // 0.00416... per month

/**
 * Delayed retirement credits
 *
 * Per SSA rules:
 * - 2/3 of 1% per month (8% per year) from FRA to age 70
 */
export const DELAYED_CREDIT_RATE = (2 / 3) / 100; // 0.00666... per month
export const DELAYED_CREDIT_RATE_ANNUAL = 8 / 100; // 8% per year

/**
 * Spousal benefit rate
 *
 * Spouse can receive up to 50% of the primary earner's Primary Insurance Amount (PIA)
 */
export const SPOUSAL_BENEFIT_RATE = 0.5; // 50%

/**
 * Claiming age constraints
 */
export const MIN_CLAIMING_AGE = 62;
export const MAX_CLAIMING_AGE = 70;

/**
 * Maximum Social Security benefit amounts by year
 * These are updated annually by the SSA
 */
export const MAX_BENEFIT_BY_YEAR: Record<number, number> = {
  2024: 3822,  // Monthly benefit at FRA for 2024
  2025: 4018,  // Monthly benefit at FRA for 2025
  // Update annually as SSA publishes new maximums
};

/**
 * Get the maximum benefit for the current year or a specific year
 */
export function getMaxBenefit(year?: number): number {
  const targetYear = year || new Date().getFullYear();
  return MAX_BENEFIT_BY_YEAR[targetYear] || MAX_BENEFIT_BY_YEAR[2025];
}

/**
 * Historical COLA (Cost of Living Adjustment) rates
 * Used for reference in setting default assumptions
 */
export const HISTORICAL_COLA = {
  '2020': 1.6,
  '2021': 1.3,
  '2022': 5.9,
  '2023': 8.7,
  '2024': 3.2,
  '2025': 2.5,
  average_10_year: 2.8,
  average_20_year: 2.6,
};

/**
 * Default assumption presets
 */
export const ASSUMPTION_PRESETS = {
  conservative: {
    investmentGrowthRate: 2.0,
    colaRate: 2.5,
    inflationRate: 2.0,
  },
  moderate: {
    investmentGrowthRate: 5.0,
    colaRate: 2.5,
    inflationRate: 3.0,
  },
  historical: {
    investmentGrowthRate: 7.0,
    colaRate: 2.6,
    inflationRate: 3.0,
  },
} as const;

export type AssumptionPreset = keyof typeof ASSUMPTION_PRESETS;
