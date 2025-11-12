/**
 * Qualitative Feedback System
 *
 * Provides contextual, color-coded feedback for user inputs to help them
 * understand whether their assumptions are realistic, conservative, or aggressive.
 */

export type FeedbackLevel = 'info' | 'success' | 'warning' | 'error';

export interface FeedbackResult {
  level: FeedbackLevel;
  label: string;
  description: string;
  color: string; // Tailwind color classes
}

/**
 * Get qualitative feedback for investment growth rate
 *
 * Helps users understand if their expected returns are realistic.
 */
export function getGrowthRateFeedback(rate: number): FeedbackResult {
  if (rate < 0) {
    return {
      level: 'error',
      label: 'Negative Returns',
      description:
        'Expecting negative returns? That would mean your investments lose value over time. Consider if this is realistic for your scenario.',
      color: 'destructive',
    };
  }

  if (rate >= 0 && rate < 3) {
    return {
      level: 'info',
      label: 'Conservative',
      description:
        'Conservative growth rate similar to high-yield savings or bonds. Safe but may underestimate stock market returns over long periods.',
      color: 'secondary',
    };
  }

  if (rate >= 3 && rate < 7) {
    return {
      level: 'success',
      label: 'Moderate',
      description:
        'Moderate growth rate. A balanced portfolio typically returns 4-7% annually after inflation over long periods.',
      color: 'default',
    };
  }

  if (rate >= 7 && rate <= 10) {
    return {
      level: 'warning',
      label: 'Aggressive',
      description:
        'Aggressive growth rate. The S&P 500 has averaged ~10% nominal returns historically, but this includes significant volatility.',
      color: 'default',
    };
  }

  // rate > 10
  return {
    level: 'error',
    label: 'Unrealistic',
    description:
      'This growth rate is higher than historical stock market averages. Very few investments sustain 10%+ returns over decades. Consider using a more conservative estimate.',
    color: 'destructive',
  };
}

/**
 * Get qualitative feedback for COLA (Cost of Living Adjustment) rate
 *
 * Based on historical Social Security COLA data.
 */
export function getColaFeedback(rate: number): FeedbackResult {
  if (rate < 1) {
    return {
      level: 'info',
      label: 'Very Low',
      description:
        'COLA below 1% is rare. This happened in 2021 (1.3%) and 2017 (0.3%). Consider if you expect prolonged low inflation.',
      color: 'secondary',
    };
  }

  if (rate >= 1 && rate < 2) {
    return {
      level: 'info',
      label: 'Low',
      description:
        'Low COLA rate. This reflects periods of low inflation, which occurred in the 2010s.',
      color: 'secondary',
    };
  }

  if (rate >= 2 && rate <= 3) {
    return {
      level: 'success',
      label: 'Historical Average',
      description:
        'This is close to the 20-year historical average COLA of 2.6%. A reasonable baseline assumption for long-term planning.',
      color: 'default',
    };
  }

  if (rate > 3 && rate <= 5) {
    return {
      level: 'warning',
      label: 'Elevated',
      description:
        'COLA between 3-5% reflects higher inflation periods. The 2024 COLA was 3.2% following pandemic-era inflation.',
      color: 'default',
    };
  }

  // rate > 5
  return {
    level: 'error',
    label: 'Very High',
    description:
      'COLA above 5% is unusual. The 2023 COLA was 8.7% due to exceptional inflation. Sustained high COLA is historically rare. Be cautious with long-term projections at this level.',
    color: 'destructive',
  };
}

/**
 * Get qualitative feedback for inflation rate
 *
 * Helps users understand inflation assumptions for "today's dollars" calculations.
 */
export function getInflationFeedback(rate: number): FeedbackResult {
  if (rate < 1) {
    return {
      level: 'info',
      label: 'Deflationary',
      description:
        'Inflation below 1% is rare in the US. Deflation (negative inflation) has only occurred briefly during severe recessions.',
      color: 'secondary',
    };
  }

  if (rate >= 1 && rate < 2) {
    return {
      level: 'info',
      label: 'Low',
      description:
        'Low inflation rate. The Fed often struggles to achieve its 2% target, sometimes falling short.',
      color: 'secondary',
    };
  }

  if (rate >= 2 && rate <= 3.5) {
    return {
      level: 'success',
      label: 'Target Range',
      description:
        'Within or near the Federal Reserve\'s 2% target. This is considered healthy inflation and a reasonable long-term assumption.',
      color: 'default',
    };
  }

  if (rate > 3.5 && rate <= 5) {
    return {
      level: 'warning',
      label: 'Elevated',
      description:
        'Elevated inflation. This occurred in 2021-2024 following pandemic disruptions. Historically, the Fed acts to bring inflation back to 2%.',
      color: 'default',
    };
  }

  if (rate > 5 && rate <= 8) {
    return {
      level: 'error',
      label: 'High',
      description:
        'High inflation. Sustained inflation at this level is rare in modern US history. The Fed typically raises rates aggressively to combat this.',
      color: 'destructive',
    };
  }

  // rate > 8
  return {
    level: 'error',
    label: 'Extremely High',
    description:
      'Extremely high inflation. This would represent a significant economic crisis. The last time US inflation exceeded 8% for an extended period was the 1970s-80s.',
    color: 'destructive',
  };
}

/**
 * Get qualitative feedback for benefit amount
 *
 * Validates against the maximum possible benefit at FRA.
 *
 * @param amount - The user's entered benefit amount
 * @param maxBenefit - Maximum benefit projected at the user's FRA
 * @param fraYear - Optional: The year the user reaches FRA (for display purposes)
 */
export function getBenefitAmountFeedback(
  amount: number,
  maxBenefit: number,
  fraYear?: number
): FeedbackResult {
  const percentOfMax = (amount / maxBenefit) * 100;

  if (amount <= 0) {
    return {
      level: 'error',
      label: 'Invalid',
      description: 'Benefit amount must be greater than zero.',
      color: 'destructive',
    };
  }

  if (percentOfMax <= 50) {
    return {
      level: 'info',
      label: 'Lower Benefits',
      description:
        'This is less than 50% of the maximum benefit. Typical for lower lifetime earnings or incomplete work history.',
      color: 'secondary',
    };
  }

  if (percentOfMax > 50 && percentOfMax <= 80) {
    return {
      level: 'success',
      label: 'Moderate Benefits',
      description:
        'This is a moderate benefit amount, typical for average to above-average earners.',
      color: 'default',
    };
  }

  if (percentOfMax > 80 && percentOfMax <= 100) {
    return {
      level: 'success',
      label: 'High Benefits',
      description:
        'This is close to the maximum benefit. Requires 35 years of earnings at or above the Social Security wage base.',
      color: 'default',
    };
  }

  if (percentOfMax > 100 && percentOfMax <= 125) {
    const yearText = fraYear ? ` in ${fraYear}` : '';
    return {
      level: 'warning',
      label: 'Above Maximum',
      description: `This exceeds the projected maximum benefit of $${maxBenefit.toLocaleString()}/month at your Full Retirement Age${yearText}. Double-check your numbers. This might be a typo.`,
      color: 'destructive',
    };
  }

  // percentOfMax > 125
  const yearText = fraYear ? ` in ${fraYear}` : '';
  return {
    level: 'error',
    label: 'Invalid Amount',
    description: `This is ${Math.round(percentOfMax)}% of the maximum possible benefit. This seems like an error. The max benefit projected at your Full Retirement Age${yearText} is $${maxBenefit.toLocaleString()}/month.`,
    color: 'destructive',
  };
}

/**
 * Get feedback variant for shadcn badge component
 */
export function getFeedbackVariant(
  level: FeedbackLevel
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level) {
    case 'success':
      return 'default';
    case 'info':
      return 'secondary';
    case 'warning':
      return 'outline';
    case 'error':
      return 'destructive';
    default:
      return 'default';
  }
}
