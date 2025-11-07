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
} from 'recharts';
import type { CumulativeBenefit } from '@/types/scenario';

interface CumulativeBenefitsChartProps {
  data: Array<{
    name: string;
    benefits: CumulativeBenefit[];
    color: string;
    claimingAge: number;
  }>;
  displayMode: 'today-dollars' | 'future-dollars';
  breakevens?: Array<{
    age: number;
    scenario1: string;
    scenario2: string;
  }>;
}

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
    scenario.benefits.forEach((b) => allAges.add(b.age));
  });

  // Sort ages
  const sortedAges = Array.from(allAges).sort((a, b) => a - b);

  // Build chart data
  sortedAges.forEach((age) => {
    const dataPoint: { age: number; [key: string]: number } = { age };

    data.forEach((scenario) => {
      const benefit = scenario.benefits.find((b) => b.age === age);
      if (benefit) {
        const value =
          displayMode === 'today-dollars'
            ? benefit.netValue ?? benefit.cumulativeAdjusted
            : benefit.cumulative;
        dataPoint[scenario.name] = Math.round(value);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cumulative Benefits Over Time</h3>
          <p className="text-sm text-muted-foreground">
            {displayMode === 'today-dollars' ? "Today's Dollars" : 'Future Dollars'}
          </p>
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
          />
          <YAxis
            label={{
              value: 'Total Benefits',
              angle: -90,
              position: 'insideLeft',
            }}
            tickFormatter={formatCurrency}
            className="text-xs"
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Age ${label}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
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
