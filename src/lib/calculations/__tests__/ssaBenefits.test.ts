import { describe, it, expect } from 'vitest';
import {
  calculateFRA,
  projectMaxBenefitAtFRA,
  calculateBenefit,
  calculateEarlyReductionPercentage,
  calculateDelayedCreditPercentage,
} from '../ssaBenefits';

describe('Social Security Benefits Calculations', () => {
  describe('calculateFRA', () => {
    it('should return 67 for someone born in 1960', () => {
      const birthDate = new Date('1960-01-01');
      const fra = calculateFRA(birthDate);
      expect(fra.years).toBe(67);
      expect(fra.months).toBe(0);
    });

    it('should return 66 for someone born in 1950', () => {
      const birthDate = new Date('1950-01-01');
      const fra = calculateFRA(birthDate);
      expect(fra.years).toBe(66);
      expect(fra.months).toBe(0);
    });

    it('should return 66 years 6 months for someone born in 1958', () => {
      const birthDate = new Date('1958-01-01');
      const fra = calculateFRA(birthDate);
      expect(fra.years).toBe(66);
      expect(fra.months).toBe(6);
    });
  });

  describe('projectMaxBenefitAtFRA', () => {
    it('should not grow benefit if claiming immediately', () => {
      // Someone already at FRA should get current max without growth
      const currentYear = new Date().getFullYear();
      const birthDate = new Date(currentYear - 67, 0, 1); // Born 67 years ago (at FRA now)
      const result = projectMaxBenefitAtFRA(birthDate, 2.5);
      // Should be approximately current max ($4,018 for 2025)
      expect(result).toBeLessThan(5000);
    });

    it('should grow benefit correctly over time with 2.5% COLA', () => {
      // Someone 15 years from FRA with 2.5% COLA
      const currentYear = new Date().getFullYear();
      const birthDate = new Date(currentYear - 52, 0, 1); // FRA at 67 = 15 years from now
      const result = projectMaxBenefitAtFRA(birthDate, 2.5);

      // $4,018 * (1.025 ^ 15) ≈ $5,603
      expect(result).toBeGreaterThan(5500);
      expect(result).toBeLessThan(5800);
    });

    it('should handle percentage conversion correctly', () => {
      // This tests that 2.5 is converted to 0.025, not treated as 2.5x multiplier
      const currentYear = new Date().getFullYear();
      const birthDate = new Date(currentYear - 52, 0, 1);

      const result2_5 = projectMaxBenefitAtFRA(birthDate, 2.5);
      const result3_0 = projectMaxBenefitAtFRA(birthDate, 3.0);

      // 3% COLA should be noticeably higher than 2.5% COLA
      expect(result3_0).toBeGreaterThan(result2_5);
      expect(result3_0 - result2_5).toBeGreaterThan(50); // At least $50 difference
    });

    it('should use 2.5% as default COLA', () => {
      const currentYear = new Date().getFullYear();
      const birthDate = new Date(currentYear - 52, 0, 1);

      const resultDefault = projectMaxBenefitAtFRA(birthDate);
      const result2_5 = projectMaxBenefitAtFRA(birthDate, 2.5);

      expect(resultDefault).toBe(result2_5);
    });
  });

  describe('calculateEarlyReductionPercentage', () => {
    it('should return 0 when claiming at or after FRA', () => {
      const birthDate = new Date('1960-01-01');
      const fra = calculateFRA(birthDate);

      // Claiming at FRA (67)
      let reduction = calculateEarlyReductionPercentage(67, fra);
      expect(reduction).toBe(0);

      // Claiming after FRA (70)
      reduction = calculateEarlyReductionPercentage(70, fra);
      expect(reduction).toBe(0);
    });

    it('should apply reduction for claiming at 62', () => {
      const birthDate = new Date('1960-01-01');
      const fra = calculateFRA(birthDate); // FRA = 67

      // Claiming at 62, 5 years early (60 months)
      const reduction = calculateEarlyReductionPercentage(62, fra);

      // First 36 months: 5/9 of 1% = 0.00556 per month
      // Remaining 24 months: 5/12 of 1% = 0.00417 per month
      // Total: (36 * 0.00556) + (24 * 0.00417) = 0.1999 + 0.1000 = 0.2999 ≈ -30%
      expect(reduction).toBeCloseTo(-0.3, 1);
    });
  });

  describe('calculateDelayedCreditPercentage', () => {
    it('should return 0 when claiming at or before FRA', () => {
      const birthDate = new Date('1960-01-01');
      const fra = calculateFRA(birthDate);

      let credit = calculateDelayedCreditPercentage(67, fra); // At FRA
      expect(credit).toBe(0);

      credit = calculateDelayedCreditPercentage(62, fra); // Before FRA
      expect(credit).toBe(0);
    });

    it('should apply 8% per year for delaying', () => {
      const birthDate = new Date('1960-01-01');
      const fra = calculateFRA(birthDate); // FRA = 67

      // Claiming at 70, 3 years after FRA (36 months)
      const credit = calculateDelayedCreditPercentage(70, fra);

      // 36 months * 2/3 of 1% = 36 * 0.00667 = 0.24 = 24%
      // Which is 8% per year for 3 years
      expect(credit).toBeCloseTo(0.24, 2);
    });
  });

  describe('calculateBenefit', () => {
    it('should return full benefit at FRA', () => {
      const birthDate = new Date('1960-01-01');
      const baseAmount = 3000;
      const fraAge = 67;

      const result = calculateBenefit(baseAmount, birthDate, fraAge);

      expect(result.monthlyBenefit).toBe(baseAmount);
      expect(result.adjustmentPercentage).toBe(0);
    });

    it('should reduce benefit when claiming early at 62', () => {
      const birthDate = new Date('1960-01-01');
      const baseAmount = 3000;

      const result = calculateBenefit(baseAmount, birthDate, 62);

      // Should be reduced by approximately 30%
      expect(result.monthlyBenefit).toBeCloseTo(3000 * 0.7, 0);
      expect(result.adjustmentPercentage).toBeCloseTo(-30, 1);
    });

    it('should increase benefit when claiming at 70', () => {
      const birthDate = new Date('1960-01-01');
      const baseAmount = 3000;

      const result = calculateBenefit(baseAmount, birthDate, 70);

      // Should be increased by 24% (8% per year for 3 years)
      expect(result.monthlyBenefit).toBeCloseTo(3000 * 1.24, 0);
      expect(result.adjustmentPercentage).toBeCloseTo(24, 1);
    });
  });

  describe('Integrated Scenario: User with $4,059 benefit', () => {
    /**
     * This test case validates the specific scenario reported:
     * - User received $4,059 from SSA website at their FRA
     * - Need to ensure this flows correctly through all calculations
     */
    it('should handle $4,059 benefit at FRA correctly', () => {
      // Assuming user is around 50 years old (born ~1974)
      const birthDate = new Date('1974-06-15');
      const expectedBenefitAtFRA = 4059;

      // Calculate FRA
      const fra = calculateFRA(birthDate);
      expect(fra.years).toBe(67);

      // Project max at their FRA (should be higher than current max)
      const projectedMax = projectMaxBenefitAtFRA(birthDate, 2.5);
      // Should be much higher than 4018 due to COLA growth
      expect(projectedMax).toBeGreaterThan(4500);

      // User's benefit as percentage of projected max
      const percentOfMax = (expectedBenefitAtFRA / projectedMax) * 100;
      // Should be reasonable (not 101%)
      expect(percentOfMax).toBeLessThan(100);
      expect(percentOfMax).toBeGreaterThan(50);

      // Calculate benefit at FRA
      const benefitAtFRA = calculateBenefit(expectedBenefitAtFRA, birthDate, 67);
      expect(benefitAtFRA.monthlyBenefit).toBe(expectedBenefitAtFRA);
      expect(benefitAtFRA.adjustmentPercentage).toBe(0);

      // Calculate benefit if claiming at 62
      const benefitAt62 = calculateBenefit(expectedBenefitAtFRA, birthDate, 62);
      expect(benefitAt62.monthlyBenefit).toBeCloseTo(expectedBenefitAtFRA * 0.7, 0);
    });
  });
});
