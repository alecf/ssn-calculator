/**
 * Zod Validation Schemas
 *
 * Runtime validation for all user inputs and stored data.
 */

import { z } from 'zod';
import { MIN_CLAIMING_AGE, MAX_CLAIMING_AGE, getMaxBenefit } from '@/constants/ssaRules';

/**
 * Validate birth date
 * - Must be a valid date
 * - Person must be at least 18 years old
 * - Person must not be born in the future
 */
const birthDateSchema = z.date().refine(
  (date) => {
    const age = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 18 && age < 150;
  },
  { message: 'Birth date must result in age between 18 and 150' }
);

/**
 * Validate claiming age
 * - Must be between 62 and 70 (SSA rules)
 */
const claimingAgeSchema = z
  .number()
  .min(MIN_CLAIMING_AGE, `Claiming age must be at least ${MIN_CLAIMING_AGE}`)
  .max(MAX_CLAIMING_AGE, `Claiming age cannot exceed ${MAX_CLAIMING_AGE}`);

/**
 * Validate benefit amount
 * - Must be positive
 * - Should not exceed 125% of maximum (allows some buffer for typos)
 */
const benefitAmountSchema = z
  .number()
  .positive('Benefit amount must be greater than zero')
  .max(
    getMaxBenefit() * 1.25,
    `Benefit amount seems unrealistic. Maximum for 2025 is $${getMaxBenefit()}/month`
  );

/**
 * Validate percentage rate (e.g., growth, COLA, inflation)
 * - Allow negative for edge cases (deflation, losses)
 * - Cap at 20% to prevent obviously wrong inputs
 */
const percentageRateSchema = z
  .number()
  .min(-5, 'Rate cannot be less than -5%')
  .max(20, 'Rate cannot exceed 20%');

/**
 * Scenario schema for runtime validation
 */
export const ScenarioSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Scenario name is required').max(100, 'Name too long'),
  createdAt: z.date(),
  updatedAt: z.date(),

  // Individual information
  birthDate: birthDateSchema,
  benefitAmount: benefitAmountSchema,
  claimingAge: claimingAgeSchema,

  // Spouse information (optional)
  includeSpouse: z.boolean(),
  spouseBirthDate: birthDateSchema.optional(),
  spouseBenefitAmount: benefitAmountSchema.optional(),
  spouseClaimingAge: claimingAgeSchema.optional(),

  // Financial assumptions
  assumptionPreset: z.enum(['conservative', 'moderate', 'historical', 'custom']),
  investmentGrowthRate: percentageRateSchema,
  colaRate: percentageRateSchema,
  inflationRate: percentageRateSchema,

  // Display preferences
  displayMode: z.enum(['today-dollars', 'future-dollars']),
  includeOpportunityCost: z.boolean(),
  lifetimeAge: z.union([z.literal(85), z.literal(90), z.literal(95), z.literal(100)]),
});

/**
 * Partial scenario schema for updates
 */
export const PartialScenarioSchema = ScenarioSchema.partial().required({ id: true });

/**
 * Input validation for forms
 */
export const FormInputSchema = z.object({
  birthDate: z.string().min(1, 'Birth date is required'),
  benefitAmount: z.string().min(1, 'Benefit amount is required'),
  claimingAge: z.number().min(MIN_CLAIMING_AGE).max(MAX_CLAIMING_AGE),

  includeSpouse: z.boolean().optional(),
  spouseBirthDate: z.string().optional(),
  spouseBenefitAmount: z.string().optional(),
  spouseClaimingAge: z.number().min(MIN_CLAIMING_AGE).max(MAX_CLAIMING_AGE).optional(),

  assumptionPreset: z.enum(['conservative', 'moderate', 'historical', 'custom']),
  investmentGrowthRate: z.number().min(-5).max(20),
  colaRate: z.number().min(0).max(20),
  inflationRate: z.number().min(0).max(20),
});

/**
 * Type inference from schemas
 */
export type ScenarioInput = z.infer<typeof ScenarioSchema>;
export type FormInput = z.infer<typeof FormInputSchema>;
