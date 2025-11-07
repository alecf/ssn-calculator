/**
 * Individual Inputs Component
 *
 * Primary user's information: birth date, benefit amount, claiming age.
 * Features a visual age slider with FRA indicator.
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
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
} from '@/lib/calculations/ssaBenefits';
import { getMaxBenefit } from '@/constants/ssaRules';
import { getBenefitAmountFeedback, getFeedbackVariant } from '@/lib/validation/feedback';

interface IndividualInputsProps {
  birthDate: Date;
  benefitAmount: number;
  claimingAge: number;
  onBirthDateChange: (date: Date) => void;
  onBenefitAmountChange: (amount: number) => void;
  onClaimingAgeChange: (age: number) => void;
}

export function IndividualInputs({
  birthDate,
  benefitAmount,
  claimingAge,
  onBirthDateChange,
  onBenefitAmountChange,
  onClaimingAgeChange,
}: IndividualInputsProps) {
  const [benefitInputMode, setBenefitInputMode] = useState<'dollar' | 'percent'>('dollar');

  const fra = calculateFRA(birthDate);
  const fraAge = getFRAAsDecimal(fra);
  const maxBenefit = getMaxBenefit();
  const benefitPercent = Math.round((benefitAmount / maxBenefit) * 100);
  const feedback = getBenefitAmountFeedback(benefitAmount, maxBenefit);

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onBirthDateChange(newDate);
    }
  };

  const handleBenefitDollarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      onBenefitAmountChange(value);
    }
  };

  const handleBenefitPercentChange = (value: number[]) => {
    const percent = value[0];
    const newAmount = Math.round((maxBenefit * percent) / 100);
    onBenefitAmountChange(newAmount);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">👤</span>
        <h3 className="text-lg font-semibold">Your Information</h3>
      </div>

      {/* Birth Date */}
      <div className="space-y-2">
        <Label htmlFor="birthDate">Birth Date</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate.toISOString().split('T')[0]}
          onChange={handleBirthDateChange}
          max={new Date().toISOString().split('T')[0]}
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Full Retirement Age:</span>
          <Badge variant="outline" className="font-mono">
            {fra.years} years
            {fra.months > 0 && `, ${fra.months} months`}
          </Badge>
        </div>
      </div>

      {/* Benefit Amount */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Expected Monthly Benefit at FRA</Label>
          <div className="flex gap-1">
            <button
              onClick={() => setBenefitInputMode('dollar')}
              className={`px-2 py-1 text-xs rounded ${
                benefitInputMode === 'dollar'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              $
            </button>
            <button
              onClick={() => setBenefitInputMode('percent')}
              className={`px-2 py-1 text-xs rounded ${
                benefitInputMode === 'percent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              %
            </button>
          </div>
        </div>

        {benefitInputMode === 'dollar' ? (
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
              max={maxBenefit * 1.25}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Slider
              value={[benefitPercent]}
              onValueChange={handleBenefitPercentChange}
              min={0}
              max={100}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-semibold">{benefitPercent}% of max</span>
              <span>100%</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            ${benefitAmount.toLocaleString()}/month
            {benefitInputMode === 'percent' && ` (${benefitPercent}% of $${maxBenefit.toLocaleString()})`}
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
      </div>

      {/* Claiming Age Slider */}
      <div className="space-y-3">
        <Label>When will you start claiming benefits?</Label>

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
            <span>62<br/>(Early)</span>
            <span className="text-center">
              <span className="font-bold text-lg text-foreground block">{claimingAge}</span>
              {claimingAge === Math.floor(fraAge) && 'Full Benefits'}
              {claimingAge < fraAge && `${Math.abs(Math.round(calculateEarlyReductionPercentage(claimingAge, fra) * 100))}% reduced`}
              {claimingAge > fraAge && `+${Math.round(calculateDelayedCreditPercentage(claimingAge, fra) * 100)}% bonus`}
            </span>
            <span>70<br/>(Max)</span>
          </div>
        </div>

        {claimingAge < fraAge && (
          <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
            ⚠️ Claiming early permanently reduces your monthly benefit. Consider if you really need the money now.
          </div>
        )}
        {claimingAge === 70 && (
          <div className="text-xs text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
            ✓ Maximum monthly benefit! But remember: you won't collect anything until age 70.
          </div>
        )}
      </div>
    </Card>
  );
}
