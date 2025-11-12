import { describe, it, expect } from 'vitest';
import {
  projectBenefits,
  applyInflation,
  calculateCumulativeBenefits,
} from '../financialProjections';

describe('Financial Projections', () => {
  describe('projectBenefits', () => {
    it('should not apply COLA in the first year', () => {
      const startingBenefit = 3000;
      const claimingAge = 67;
      const endAge = 70;
      const colaRate = 2.5;
      const birthDate = new Date('1960-01-01');

      const benefits = projectBenefits(startingBenefit, claimingAge, endAge, colaRate, birthDate);

      // First year (age 67) should not have COLA applied
      expect(benefits[0].age).toBe(67);
      expect(benefits[0].monthlyBenefit).toBe(startingBenefit);
      expect(benefits[0].colaAdjusted).toBe(startingBenefit);
    });

    it('should apply COLA starting in year 2', () => {
      const startingBenefit = 3000;
      const claimingAge = 67;
      const endAge = 69;
      const colaRate = 2.5;
      const birthDate = new Date('1960-01-01');

      const benefits = projectBenefits(startingBenefit, claimingAge, endAge, colaRate, birthDate);

      // Year 1 (age 67): no COLA
      expect(benefits[0].monthlyBenefit).toBe(3000);

      // Year 2 (age 68): 1 year of COLA applied
      expect(benefits[1].monthlyBenefit).toBeCloseTo(3000 * 1.025, 0);

      // Year 3 (age 69): 2 years of COLA applied
      expect(benefits[2].monthlyBenefit).toBeCloseTo(3000 * 1.025 * 1.025, 0);
    });

    it('should project COLA growth correctly over 30 years', () => {
      const startingBenefit = 3000;
      const claimingAge = 67;
      const endAge = 97;
      const colaRate = 2.5;
      const birthDate = new Date('1960-01-01');

      const benefits = projectBenefits(startingBenefit, claimingAge, endAge, colaRate, birthDate);

      // At age 97 (30 years of COLA)
      const lastBenefit = benefits[benefits.length - 1];
      expect(lastBenefit.age).toBe(97);

      // $3000 * (1.025 ^ 30) ≈ $6,398
      expect(lastBenefit.monthlyBenefit).toBeCloseTo(3000 * Math.pow(1.025, 30), 0);
      expect(lastBenefit.monthlyBenefit).toBeGreaterThan(6000);
    });
  });

  describe('applyInflation', () => {
    it('should not adjust current year values', () => {
      const benefits = [
        {
          age: 67,
          year: 2027,
          monthlyBenefit: 3000,
          annualBenefit: 36000,
          colaAdjusted: 3000,
          inflationAdjusted: 3000,
        },
      ];

      const currentYear = 2027;
      const inflationRate = 3.0;

      const adjusted = applyInflation(benefits, inflationRate, currentYear);

      // Current year should not be inflation-adjusted
      expect(adjusted[0].inflationAdjusted).toBe(3000);
    });

    it('should discount future values with inflation', () => {
      const benefits = [
        {
          age: 67,
          year: 2027,
          monthlyBenefit: 3000,
          annualBenefit: 36000,
          colaAdjusted: 3000,
          inflationAdjusted: 3000,
        },
        {
          age: 68,
          year: 2028,
          monthlyBenefit: 3075, // With 2.5% COLA
          annualBenefit: 36900,
          colaAdjusted: 3075,
          inflationAdjusted: 3075,
        },
      ];

      const currentYear = 2027;
      const inflationRate = 3.0;

      const adjusted = applyInflation(benefits, inflationRate, currentYear);

      // Year 2027 (current): no adjustment
      expect(adjusted[0].inflationAdjusted).toBe(3000);

      // Year 2028 (1 year in future): divide by (1.03^1)
      // $3,075 / 1.03 ≈ $2,985
      expect(adjusted[1].inflationAdjusted).toBeCloseTo(3075 / 1.03, 0);
    });

    it('should show purchasing power erosion over 30 years', () => {
      const benefits = [];
      let monthlyBenefit = 3000;

      for (let i = 0; i <= 30; i++) {
        benefits.push({
          age: 67 + i,
          year: 2027 + i,
          monthlyBenefit,
          annualBenefit: monthlyBenefit * 12,
          colaAdjusted: monthlyBenefit,
          inflationAdjusted: monthlyBenefit,
        });
        monthlyBenefit *= 1.025; // Apply COLA for next year
      }

      const currentYear = 2027;
      const inflationRate = 3.0;

      const adjusted = applyInflation(benefits, inflationRate, currentYear);

      // First year (age 67, year 2027): $3000 in today's dollars
      expect(adjusted[0].inflationAdjusted).toBe(3000);

      // Last year (age 97, year 2057): significant erosion despite COLA
      const lastYear = adjusted[adjusted.length - 1];
      // COLA is 2.5%, but inflation is 3%, so purchasing power decreases
      expect(lastYear.inflationAdjusted).toBeLessThan(lastYear.colaAdjusted);
      // Should be noticeably less than the nominal value
      expect(lastYear.inflationAdjusted).toBeLessThan(4000);
    });
  });

  describe('calculateCumulativeBenefits', () => {
    it('should accumulate annual benefits correctly', () => {
      const benefits = [
        {
          age: 67,
          year: 2027,
          monthlyBenefit: 3000,
          annualBenefit: 36000,
          colaAdjusted: 3000,
          inflationAdjusted: 3000,
        },
        {
          age: 68,
          year: 2028,
          monthlyBenefit: 3075,
          annualBenefit: 36900,
          colaAdjusted: 3075,
          inflationAdjusted: 2985,
        },
      ];

      const cumulative = calculateCumulativeBenefits(benefits);

      // Age 67: first year only
      expect(cumulative[0].cumulative).toBe(36000);
      expect(cumulative[0].cumulativeAdjusted).toBeCloseTo(3000 * 12, 0);

      // Age 68: first + second year
      expect(cumulative[1].cumulative).toBe(36000 + 36900);
      expect(cumulative[1].cumulativeAdjusted).toBeCloseTo(36000 + 2985 * 12, 0);
    });

    it('should show cumulative growth over 30 years', () => {
      const benefits = [];
      let monthlyBenefit = 3000;

      for (let i = 0; i <= 29; i++) {
        benefits.push({
          age: 67 + i,
          year: 2027 + i,
          monthlyBenefit,
          annualBenefit: monthlyBenefit * 12,
          colaAdjusted: monthlyBenefit,
          inflationAdjusted: monthlyBenefit * Math.pow(0.97, i), // Rough inflation adjustment
        });
        monthlyBenefit *= 1.025;
      }

      const cumulative = calculateCumulativeBenefits(benefits);

      // Last entry should be age 96 (30 years of collecting)
      expect(cumulative[cumulative.length - 1].age).toBe(96);

      // Cumulative should be substantial
      expect(cumulative[cumulative.length - 1].cumulative).toBeGreaterThan(1000000);
    });
  });

  describe('Scenario: Early vs Delayed Claiming', () => {
    /**
     * Compare cumulative benefits for someone claiming at 62 vs 70
     * This helps validate the math behind the claiming decision
     */
    it('should show breakeven analysis between claiming ages', () => {
      // Claiming at 62
      const benefitsAt62 = projectBenefits(
        3000 * 0.7, // 30% reduction
        62,
        100,
        2.5,
        new Date('1960-01-01')
      );

      // Claiming at 70
      const benefitsAt70 = projectBenefits(
        3000 * 1.24, // 24% increase
        70,
        100,
        2.5,
        new Date('1960-01-01')
      );

      const cumAt62 = calculateCumulativeBenefits(benefitsAt62);
      const cumAt70 = calculateCumulativeBenefits(benefitsAt70);

      // At age 62: early claiming has more
      expect(cumAt62[0].cumulative).toBeGreaterThan(cumAt70[0].cumulative);

      // Eventually delayed claiming catches up and surpasses
      const lastYear62 = cumAt62[cumAt62.length - 1];
      const lastYear70 = cumAt70[cumAt70.length - 1];

      expect(lastYear70.cumulative).toBeGreaterThan(lastYear62.cumulative);
    });
  });
});
