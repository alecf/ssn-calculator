/**
 * Cumulative Benefits Chart Component
 *
 * Line chart showing total accumulated benefits over time.
 * Primary visualization for comparing retirement scenarios.
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
} from 'recharts';
import { Button } from '@/components/ui/button';
import type { CumulativeBenefit, YearlyBenefit } from '@/types/scenario';

interface CumulativeBenefitsChartProps {
  data: Array<{
    name: string;
    benefits: CumulativeBenefit[];
    yearlyBenefits: YearlyBenefit[];
    color: string;
    claimingAge: number;
  }>;
  displayMode: 'today-dollars' | 'future-dollars';
  onDisplayModeChange: (mode: 'today-dollars' | 'future-dollars') => void;
  chartType?: 'cumulative' | 'monthly';
  onChartTypeChange?: (type: 'cumulative' | 'monthly') => void;
  currentAge?: number;
  breakevens?: Array<{
    age: number;
    scenario1: string;
    scenario2: string;
  }>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: number;
  scenarioData: Array<{
    name: string;
    yearlyBenefits: YearlyBenefit[];
    color: string;
  }>;
  displayMode: 'today-dollars' | 'future-dollars';
}

const CustomTooltip = ({
  active,
  payload,
  label,
  scenarioData,
  displayMode,
}: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const age = label as number;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold mb-2">Age {age}</p>
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const scenarioName = entry.name;
          const cumulativeValue = entry.value as number;

          // Find the corresponding yearly benefit for monthly amount
          const scenario = scenarioData.find(s => s.name === scenarioName);
          const yearlyBenefit = scenario?.yearlyBenefits.find(yb => yb.age === age);
          const monthlyBenefit = yearlyBenefit
            ? (displayMode === 'today-dollars'
                ? yearlyBenefit.inflationAdjusted
                : yearlyBenefit.monthlyBenefit)
            : 0;

          return (
            <div key={`tooltip-${index}`} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{scenarioName}</span>
              </div>
              <div className="ml-5 text-xs space-y-0.5">
                <div className="text-muted-foreground">
                  Monthly: <span className="text-foreground font-medium">{formatCurrency(monthlyBenefit)}</span>
                </div>
                <div className="text-muted-foreground">
                  Cumulative: <span className="text-foreground font-medium">{formatCurrency(cumulativeValue)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
];

export function CumulativeBenefitsChart({
  data,
  displayMode,
  onDisplayModeChange,
  chartType = 'cumulative',
  onChartTypeChange,
  currentAge,
  breakevens = [],
}: CumulativeBenefitsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg">📊 No scenarios to display</p>
          <p className="text-sm">Create a scenario to see projections</p>
        </div>
      </div>
    );
  }

  // Merge all scenario data into a single dataset for the chart
  const chartData: Array<{
    age: number;
    [key: string]: number;
  }> = [];

  // Get all unique ages from all scenarios
  const allAges = new Set<number>();
  data.forEach((scenario) => {
    scenario.yearlyBenefits.forEach((b) => allAges.add(b.age));
  });

  // Sort ages
  const sortedAges = Array.from(allAges).sort((a, b) => a - b);

  // Build chart data based on chart type
  sortedAges.forEach((age) => {
    const dataPoint: { age: number; [key: string]: number } = { age };

    data.forEach((scenario) => {
      if (chartType === 'monthly') {
        // Show monthly benefits from yearlyBenefits
        const yearlyBenefit = scenario.yearlyBenefits.find((b) => b.age === age);
        if (yearlyBenefit) {
          const value =
            displayMode === 'today-dollars'
              ? yearlyBenefit.inflationAdjusted
              : yearlyBenefit.monthlyBenefit;
          dataPoint[scenario.name] = Math.round(value);
        }
      } else {
        // Show cumulative benefits (original behavior)
        const benefit = scenario.benefits.find((b) => b.age === age);
        if (benefit) {
          const value =
            displayMode === 'today-dollars'
              ? benefit.netValue ?? benefit.cumulativeAdjusted
              : benefit.cumulative;
          dataPoint[scenario.name] = Math.round(value);
        }
      }
    });

    chartData.push(dataPoint);
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const chartTitle = chartType === 'cumulative'
    ? 'Cumulative Benefits Over Time'
    : 'Monthly Benefits Over Time';
  const yAxisLabel = chartType === 'cumulative' ? 'Total Benefits' : 'Monthly Benefit';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{chartTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {displayMode === 'today-dollars' ? "Today's Dollars" : 'Future Dollars'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="text-xs font-semibold text-muted-foreground">Type:</span>
            <Button
              variant={chartType === 'cumulative' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onChartTypeChange?.('cumulative')}
            >
              Total
            </Button>
            <Button
              variant={chartType === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onChartTypeChange?.('monthly')}
            >
              Monthly
            </Button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="text-xs font-semibold text-muted-foreground">Display:</span>
            <Button
              variant={displayMode === 'today-dollars' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onDisplayModeChange('today-dollars')}
            >
              Today's $
            </Button>
            <Button
              variant={displayMode === 'future-dollars' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onDisplayModeChange('future-dollars')}
            >
              Future $
            </Button>
          </div>
        </div>

        {breakevens.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">Breakeven points:</span>{' '}
            {breakevens.map((b, i) => (
              <span key={i}>
                age {b.age}
                {i < breakevens.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="age"
            label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
            className="text-xs"
            domain={currentAge ? [currentAge, 90] : ['auto', 'auto']}
            type="number"
          />
          <YAxis
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
            }}
            tickFormatter={formatCurrency}
            className="text-xs"
          />
          <Tooltip
            content={
              <CustomTooltip
                scenarioData={data.map(s => ({
                  name: s.name,
                  yearlyBenefits: s.yearlyBenefits,
                  color: s.color,
                }))}
                displayMode={displayMode}
              />
            }
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Breakeven reference lines */}
          {breakevens.map((breakeven, i) => (
            <ReferenceLine
              key={i}
              x={breakeven.age}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{
                value: `Breakeven`,
                position: 'top',
                fill: '#f59e0b',
                fontSize: 12,
              }}
            />
          ))}

          {/* Lines for each scenario */}
          {data.map((scenario, index) => (
            <Line
              key={`${scenario.name}-${index}`}
              type="monotone"
              dataKey={scenario.name}
              stroke={scenario.color || COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend for claiming ages */}
      <div className="flex flex-wrap gap-4 pt-2 border-t">
        {data.map((scenario, index) => (
          <div key={`${scenario.name}-${index}`} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: scenario.color || COLORS[index % COLORS.length] }}
            />
            <span className="font-medium">{scenario.name}</span>
            <span className="text-muted-foreground">
              (claim at {scenario.claimingAge})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
