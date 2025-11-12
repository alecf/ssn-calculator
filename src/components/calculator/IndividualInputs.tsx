/**
 * Individual Inputs Component
 *
 * Primary user's information: birth date, benefit amount, claiming age.
 * Features a visual age slider with FRA indicator.
 */

'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  calculateFRA,
  getFRAAsDecimal,
  calculateEarlyReductionPercentage,
  calculateDelayedCreditPercentage,
  calculateBenefit,
  projectMaxBenefitAtFRA,
} from '@/lib/calculations/ssaBenefits';
import { getBenefitAmountFeedback, getFeedbackVariant } from '@/lib/validation/feedback';

interface IndividualInputsProps {
  birthDate: Date;
  benefitAmount: number;  // The calculated expected benefit (projectedMax × percentage)
  desiredPercentage: number;  // The percentage of max the user wants (0-100)
  projectedMaxBenefit: number;  // The projected max at FRA
  claimingAge: number;
  colaRate: number;
  onBirthDateChange: (date: Date) => void;
  onBenefitAmountChange: (amount: number) => void;  // Called when user enters dollar amount
  onBenefitPercentageChange: (percentage: number) => void;  // Called when user changes percentage slider
  onClaimingAgeChange: (age: number) => void;
  onReset?: () => void;
}

export function IndividualInputs({
  birthDate,
  benefitAmount,
  desiredPercentage,
  projectedMaxBenefit,
  claimingAge,
  colaRate,
  onBirthDateChange,
  onBenefitAmountChange,
  onBenefitPercentageChange,
  onClaimingAgeChange,
  onReset,
}: IndividualInputsProps) {
  const fra = calculateFRA(birthDate);
  const fraAge = getFRAAsDecimal(fra);

  // Calculate FRA year for feedback display
  const birthYear = birthDate.getFullYear();
  const fraYear = birthYear + Math.floor(fraAge);

  const feedback = getBenefitAmountFeedback(benefitAmount, projectedMaxBenefit, fraYear);

  // Calculate COLA-adjusted benefit at claiming age
  // The benefitAmount is at FRA, so we need to project it forward to claiming age
  const currentYear = new Date().getFullYear();
  const claimingYear = birthDate.getFullYear() + claimingAge;
  const yearsFromFRAToToday = currentYear - fraYear;
  const yearsFromTodayToClaiming = claimingYear - currentYear;

  // Apply COLA from today to claiming year
  const colaAdjustedBenefit = benefitAmount * Math.pow(1 + colaRate / 100, yearsFromTodayToClaiming);

  // Then apply SSA reduction/credit based on claiming age vs FRA
  const benefitCalc = calculateBenefit(colaAdjustedBenefit, birthDate, claimingAge);
  const displayedMonthlyBenefit = benefitCalc.monthlyBenefit;

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onBirthDateChange(newDate);
    }
  };

  // Validate birth date
  const today = new Date();
  const isFutureBirthDate = birthDate > today;
  const minValidAge = 18;
  const minBirthDate = new Date(
    today.getFullYear() - minValidAge,
    today.getMonth(),
    today.getDate()
  );
  const isTooYoung = birthDate > minBirthDate;

  const handleBenefitDollarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      onBenefitAmountChange(value);
    }
  };

  const handleBenefitPercentChange = (value: number[]) => {
    const percent = value[0];
    // When the slider changes, call the percentage change handler
    // The benefit amount will be recalculated in the parent component
    onBenefitPercentageChange(percent);
  };

  // Calculate the year for a given age
  const getYearForAge = (age: number): number => {
    return birthDate.getFullYear() + age;
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Reset Button */}
      {onReset && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
          >
            ↻ Reset to defaults
          </Button>
        </div>
      )}

      {/* Claiming Age Slider */}
      <div className="space-y-3">
        <Label>When will you start claiming benefits?</Label>
        <div className="text-sm text-muted-foreground">
          Projected monthly benefit: <span className="font-semibold text-foreground">${Math.round(displayedMonthlyBenefit).toLocaleString()}</span>
          {yearsFromTodayToClaiming !== 0 && (
            <span className="text-xs ml-2">
              (nominal dollars in {claimingYear})
            </span>
          )}
        </div>

        <div className="relative py-8">
          {/* FRA Indicator */}
          <div
            className="absolute top-0 w-0.5 h-6 bg-primary/40"
            style={{
              left: `${((fraAge - 62) / 8) * 100}%`,
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-primary">
              FRA
            </div>
          </div>

          <Slider
            value={[claimingAge]}
            onValueChange={(value) => onClaimingAgeChange(value[0])}
            min={62}
            max={70}
            step={1}
            className="py-4"
          />

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>62 ({getYearForAge(62)})<br/>(Early)</span>
            <span className="text-center">
              <span className="font-bold text-lg text-foreground block">{claimingAge} ({getYearForAge(claimingAge)})</span>
              {claimingAge === Math.floor(fraAge) && 'Full Benefits'}
              {claimingAge < fraAge && `${Math.abs(Math.round(calculateEarlyReductionPercentage(claimingAge, fra) * 100))}% reduced`}
              {claimingAge > fraAge && `+${Math.round(calculateDelayedCreditPercentage(claimingAge, fra) * 100)}% bonus`}
            </span>
            <span>70 ({getYearForAge(70)})<br/>(Max)</span>
          </div>
        </div>

        {claimingAge < fraAge && (
          <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
            ⚠️ Claiming at age {claimingAge} ({getYearForAge(claimingAge)}) permanently reduces your monthly benefit. Consider if you really need the money now.
          </div>
        )}
        {claimingAge === 70 && (
          <div className="text-xs text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
            ✓ Maximum monthly benefit! But remember: you won't collect anything until age 70 ({getYearForAge(70)}).
          </div>
        )}
      </div>

      {/* Benefit Amount */}
      <div className="space-y-3">
        <Label>Expected Monthly Benefit at FRA <span className="text-xs text-muted-foreground">(in today's dollars)</span></Label>

        {/* Dollar Input */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Dollar Amount</div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={benefitAmount}
              onChange={handleBenefitDollarChange}
              className="pl-7"
              min={0}
              max={projectedMaxBenefit * 1.25}
            />
          </div>
        </div>

        {/* Percent Slider */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Percentage of Maximum Benefit</div>
          <Slider
            value={[desiredPercentage]}
            onValueChange={handleBenefitPercentChange}
            min={0}
            max={100}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-semibold">{desiredPercentage}% of max (${projectedMaxBenefit.toLocaleString()})</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            ${benefitAmount.toLocaleString()}/month = {desiredPercentage}% of projected maximum
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={getFeedbackVariant(feedback.level)} className="cursor-help">
                  {feedback.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{feedback.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {feedback.level === 'error' && (
          <div className="text-xs text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
            ⚠️ {feedback.description}
          </div>
        )}
      </div>

      {/* Full Retirement Age Info */}
      <div className="space-y-2 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Full Retirement Age</span>
          <Badge variant="outline" className="font-mono">
            {fra.years} years
            {fra.months > 0 && `, ${fra.months} months`}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          You'll reach full retirement age in {new Date(birthDate.getFullYear() + fra.years, birthDate.getMonth() + fra.months, birthDate.getDate()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <p className="text-xs text-muted-foreground">
          💡 Change your birth date in Settings (top right) if needed.
        </p>
      </div>
    </Card>
  );
}
