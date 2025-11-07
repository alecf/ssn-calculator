/**
 * Spouse Inputs Component
 *
 * Optional spousal information with smart defaults.
 */

'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { calculateFRA, getFRAAsDecimal, calculateSpousalBenefit } from '@/lib/calculations/ssaBenefits';
import { getMaxBenefit } from '@/constants/ssaRules';

interface SpouseInputsProps {
  spouseBirthDate: Date;
  spouseBenefitAmount: number;
  spouseClaimingAge: number;
  partnerBenefitAmount: number; // To calculate spousal benefit
  onBirthDateChange: (date: Date) => void;
  onBenefitAmountChange: (amount: number) => void;
  onClaimingAgeChange: (age: number) => void;
}

export function SpouseInputs({
  spouseBirthDate,
  spouseBenefitAmount,
  spouseClaimingAge,
  partnerBenefitAmount,
  onBirthDateChange,
  onBenefitAmountChange,
  onClaimingAgeChange,
}: SpouseInputsProps) {
  const fra = calculateFRA(spouseBirthDate);
  const fraAge = getFRAAsDecimal(fra);
  const maxBenefit = getMaxBenefit();
  const benefitPercent = Math.round((spouseBenefitAmount / maxBenefit) * 100);

  // Calculate which benefit the spouse will actually receive
  const spousalCalc = calculateSpousalBenefit(
    spouseBenefitAmount,
    partnerBenefitAmount,
    spouseBirthDate,
    spouseClaimingAge
  );

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onBirthDateChange(newDate);
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
        <span className="text-2xl">💑</span>
        <h3 className="text-lg font-semibold">Spouse Information</h3>
      </div>

      {/* Birth Date */}
      <div className="space-y-2">
        <Label htmlFor="spouseBirthDate">Spouse Birth Date</Label>
        <Input
          id="spouseBirthDate"
          type="date"
          value={spouseBirthDate.toISOString().split('T')[0]}
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

      {/* Spouse's Own Benefit Amount */}
      <div className="space-y-3">
        <Label>Spouse's Own Monthly Benefit at FRA</Label>
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
        <div className="text-sm text-muted-foreground">
          ${spouseBenefitAmount.toLocaleString()}/month
        </div>
      </div>

      {/* Claiming Age */}
      <div className="space-y-3">
        <Label>Spouse Claiming Age</Label>
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
            value={[spouseClaimingAge]}
            onValueChange={(value) => onClaimingAgeChange(value[0])}
            min={62}
            max={70}
            step={1}
            className="py-4"
          />

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>62</span>
            <span className="font-bold text-lg text-foreground">{spouseClaimingAge}</span>
            <span>70</span>
          </div>
        </div>
      </div>

      {/* Spousal Benefit Explanation */}
      <Alert>
        <AlertDescription className="text-sm">
          {spousalCalc.source === 'own' ? (
            <div className="space-y-1">
              <div className="font-semibold text-foreground">
                ✓ Receiving own benefit
              </div>
              <div>
                Your spouse will receive their own benefit of{' '}
                <span className="font-semibold">
                  ${Math.round(spousalCalc.ownBenefit).toLocaleString()}/month
                </span>{' '}
                because it's higher than the spousal benefit of{' '}
                ${Math.round(spousalCalc.spousalBenefit).toLocaleString()}/month
                (50% of your benefit).
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-semibold text-foreground">
                → Receiving spousal benefit
              </div>
              <div>
                Your spouse will receive the spousal benefit of{' '}
                <span className="font-semibold">
                  ${Math.round(spousalCalc.spousalBenefit).toLocaleString()}/month
                </span>{' '}
                (50% of your benefit) because it's higher than their own benefit of{' '}
                ${Math.round(spousalCalc.ownBenefit).toLocaleString()}/month.
              </div>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </Card>
  );
}
