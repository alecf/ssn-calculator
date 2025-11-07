# Technical Plan: Social Security Benefits Calculator

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                         │
│                   (Static Export)                       │
├─────────────────────────────────────────────────────────┤
│  UI Layer (React Components)                            │
│  ├─ Input Forms (shadcn/ui)                             │
│  ├─ Charts (Recharts)                                   │
│  └─ Scenario Management UI                              │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                   │
│  ├─ SS Benefit Calculator Engine                        │
│  ├─ Financial Projections Engine                        │
│  └─ Validation & Feedback Logic                         │
├─────────────────────────────────────────────────────────┤
│  State Management (React Context/Hooks)                 │
│  ├─ Current Scenario State                              │
│  ├─ Saved Scenarios State                               │
│  └─ Display Preferences State                           │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                              │
│  └─ IndexedDB (via idb-keyval)                          │
└─────────────────────────────────────────────────────────┘
```

### Deployment Model
- **Build**: Next.js static export (`next build && next export`)
- **Hosting**: CDN-servable (Vercel, Netlify, CloudFront, etc.)
- **Data**: 100% client-side (no backend required)
- **Updates**: Rebuild and redeploy entire site

## Technology Stack

### Core Framework
- **Next.js 15+** with App Router
- **React 19** with Server Components where beneficial
- **TypeScript 5+** for type safety

### UI & Styling
- **shadcn/ui** - Component library built on Radix UI primitives
  - Pre-built accessible components
  - Customizable via Tailwind CSS
  - Components to use:
    - `Form` - Form handling with validation
    - `Input`, `Select`, `Slider` - Form controls
    - `Card` - Scenario cards
    - `Tabs` - View switching
    - `Tooltip` - Contextual help
    - `Badge` - Qualitative feedback
    - `Button`, `Dialog`, `Alert` - Standard UI elements
- **Tailwind CSS 3.4+** - Utility-first styling
- **Radix Colors** - Accessible color system (already in shadcn/ui)

### Data Visualization
- **Recharts 2.x** - React charting library
  - LineChart for cumulative benefits
  - BarChart for annual benefits
  - ComposedChart for complex scenarios
  - Responsive and accessible

### Data Persistence
- **idb-keyval** - Simple IndexedDB wrapper
  - Minimal API surface (`get`, `set`, `del`, `keys`)
  - Promise-based
  - 2KB gzipped
  - TypeScript support

### Development Tools
- **ESLint** - Linting
- **Prettier** - Code formatting (to be added)
- **TypeScript** - Type checking
- **Zod** - Runtime validation for data structures

## Project Structure

```
ssn-calculator/
├── src/
│   └── app/
│       ├── layout.tsx           # Root layout
│       ├── page.tsx             # Main calculator page
│       ├── globals.css          # Global styles
│       └── fonts/               # Custom fonts (if needed)
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── slider.tsx
│   │   ├── tooltip.tsx
│   │   ├── badge.tsx
│   │   └── ... (other shadcn components)
│   ├── calculator/              # Feature components
│   │   ├── IndividualInputs.tsx
│   │   ├── SpouseInputs.tsx
│   │   ├── AssumptionInputs.tsx
│   │   ├── AssumptionBadge.tsx
│   │   └── ScenarioForm.tsx
│   ├── scenarios/
│   │   ├── ScenarioCard.tsx
│   │   ├── ScenarioList.tsx
│   │   └── ScenarioComparison.tsx
│   └── charts/
│       ├── CumulativeBenefitsChart.tsx
│       ├── AnnualBenefitsChart.tsx
│       └── BreakevenIndicator.tsx
├── lib/
│   ├── calculations/
│   │   ├── ssaBenefits.ts       # Core SS calculation logic
│   │   ├── financialProjections.ts
│   │   └── breakeven.ts
│   ├── validation/
│   │   ├── schemas.ts           # Zod schemas
│   │   └── feedback.ts          # Qualitative feedback logic
│   ├── storage/
│   │   └── scenarios.ts         # IndexedDB operations
│   └── utils.ts                 # Utility functions
├── hooks/
│   ├── useScenarios.ts          # Scenario CRUD operations
│   ├── useCalculations.ts       # Memoized calculation results
│   └── useChartData.ts          # Transform data for charts
├── types/
│   ├── scenario.ts              # TypeScript types
│   ├── calculations.ts
│   └── chart.ts
├── constants/
│   ├── ssaRules.ts              # FRA tables, reduction rates, etc.
│   └── defaults.ts              # Default values and presets
└── public/
    └── ... (static assets)
```

## Core Modules

### 1. SSA Benefits Calculator (`lib/calculations/ssaBenefits.ts`)

#### Functions

```typescript
// Calculate Full Retirement Age based on birth year
function calculateFRA(birthDate: Date): { years: number; months: number }

// Calculate monthly benefit at any claiming age
function calculateBenefit(
  baseAmount: number,  // Benefit at FRA
  birthDate: Date,
  claimingAge: number  // Age when claiming (62-70)
): number

// Calculate reduction percentage for early claiming
function calculateEarlyReductionPercentage(
  claimingAge: number,
  fra: { years: number; months: number }
): number

// Calculate delayed retirement credit percentage
function calculateDelayedCreditPercentage(
  claimingAge: number,
  fra: { years: number; months: number }
): number

// Calculate spousal benefit
function calculateSpousalBenefit(
  ownBenefit: number,
  partnerBaseAmount: number,  // Partner's benefit at FRA
  claimingAge: number,
  fra: { years: number; months: number }
): {
  benefit: number;
  source: 'own' | 'spousal';
}
```

#### Constants

```typescript
const FRA_TABLE: Record<number, { years: number; months: number }> = {
  1943: { years: 66, months: 0 },
  1955: { years: 66, months: 2 },
  1960: { years: 67, months: 0 },
  // ... full table
};

const EARLY_REDUCTION_RATE_36 = 5/9 / 100;  // Per month for first 36 months
const EARLY_REDUCTION_RATE_BEYOND = 5/12 / 100;  // Per month beyond 36
const DELAYED_CREDIT_RATE = 8 / 100;  // Per year
const SPOUSAL_BENEFIT_RATE = 0.5;  // 50% of partner's PIA
```

### 2. Financial Projections (`lib/calculations/financialProjections.ts`)

#### Functions

```typescript
// Calculate year-by-year benefits with COLA
function projectBenefits(
  startingBenefit: number,
  claimingAge: number,
  endAge: number,
  colaRate: number
): YearlyBenefit[]

// Adjust for inflation
function applyInflation(
  benefits: YearlyBenefit[],
  inflationRate: number,
  baseYear: number
): YearlyBenefit[]

// Calculate opportunity cost of delayed claiming
function calculateOpportunityCost(
  scenario1: Scenario,  // e.g., claim at 62
  scenario2: Scenario,  // e.g., claim at 67
  growthRate: number
): OpportunityCostResult

// Calculate cumulative benefits over time
function calculateCumulativeBenefits(
  benefits: YearlyBenefit[],
  includeOpportunityCost: boolean,
  growthRate?: number
): CumulativeBenefit[]

interface YearlyBenefit {
  age: number;
  year: number;
  monthlyBenefit: number;
  annualBenefit: number;
  inflationAdjusted: number;
}

interface CumulativeBenefit {
  age: number;
  cumulative: number;
  cumulativeAdjusted: number;
}
```

### 3. Breakeven Analysis (`lib/calculations/breakeven.ts`)

```typescript
// Find breakeven age between two scenarios
function findBreakevenAge(
  scenario1: CumulativeBenefit[],
  scenario2: CumulativeBenefit[]
): number | null

// Calculate all pairwise breakevens
function calculateAllBreakevens(
  scenarios: Map<string, CumulativeBenefit[]>
): BreakevenMatrix

interface BreakevenMatrix {
  [scenarioId: string]: {
    [compareId: string]: number | null;
  }
}
```

### 4. Validation & Feedback (`lib/validation/`)

#### Schemas (Zod)

```typescript
const ScenarioSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  birthDate: z.date(),
  benefitAmount: z.number().min(0).max(MAX_BENEFIT * 1.25),
  claimingAge: z.number().min(62).max(70),
  includeSpouse: z.boolean(),
  // ... rest of fields
});

const AssumptionSchema = z.object({
  investmentGrowthRate: z.number().min(-5).max(20),
  colaRate: z.number().min(0).max(15),
  inflationRate: z.number().min(0).max(20),
});
```

#### Qualitative Feedback

```typescript
type FeedbackLevel = 'info' | 'success' | 'warning' | 'error';

interface FeedbackResult {
  level: FeedbackLevel;
  label: string;
  description: string;
  color: string;  // Tailwind color class
}

function getGrowthRateFeedback(rate: number): FeedbackResult
function getColaFeedback(rate: number): FeedbackResult
function getInflationFeedback(rate: number): FeedbackResult
function getBenefitAmountFeedback(amount: number, maxBenefit: number): FeedbackResult
```

### 5. Storage Layer (`lib/storage/scenarios.ts`)

```typescript
import { get, set, del, keys } from 'idb-keyval';

const SCENARIOS_KEY = 'scenarios';

async function saveScenario(scenario: Scenario): Promise<void>
async function getScenario(id: string): Promise<Scenario | null>
async function getAllScenarios(): Promise<Scenario[]>
async function deleteScenario(id: string): Promise<void>
async function updateScenario(id: string, updates: Partial<Scenario>): Promise<void>
```

## State Management Strategy

### Approach: React Context + Hooks
- Lightweight state management without external libraries
- Context for sharing state across components
- Custom hooks for encapsulating logic

### Context Structure

```typescript
// Current scenario being edited
interface CalculatorContextType {
  currentScenario: Scenario;
  updateScenario: (updates: Partial<Scenario>) => void;
  resetScenario: () => void;
}

// Saved scenarios
interface ScenariosContextType {
  scenarios: Scenario[];
  saveScenario: (scenario: Scenario) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  loadScenarios: () => Promise<void>;
}

// Display preferences
interface DisplayContextType {
  displayMode: 'today-dollars' | 'future-dollars';
  includeOpportunityCost: boolean;
  lifetimeAge: 85 | 90 | 95 | 100;
  selectedScenarios: string[];  // IDs for comparison
  setDisplayMode: (mode: 'today-dollars' | 'future-dollars') => void;
  toggleOpportunityCost: () => void;
  setLifetimeAge: (age: 85 | 90 | 95 | 100) => void;
  toggleScenarioSelection: (id: string) => void;
}
```

### Custom Hooks

```typescript
// Memoized calculation results
function useCalculations(scenario: Scenario): CalculationResults

// Chart data transformation
function useChartData(
  scenarios: Scenario[],
  displayPreferences: DisplayPreferences
): ChartData

// Scenarios CRUD with optimistic updates
function useScenarios(): {
  scenarios: Scenario[];
  save: (scenario: Scenario) => Promise<void>;
  delete: (id: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}
```

## Component Design Patterns

### Input Components with Validation

```typescript
// Example: AssumptionInput with feedback badge
interface AssumptionInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  getFeedback: (value: number) => FeedbackResult;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

function AssumptionInput({
  label,
  value,
  onChange,
  getFeedback,
  ...props
}: AssumptionInputProps) {
  const feedback = getFeedback(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant={feedback.level}>
              {feedback.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {feedback.description}
          </TooltipContent>
        </Tooltip>
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        {...props}
      />
    </div>
  );
}
```

### Chart Components

```typescript
interface CumulativeBenefitsChartProps {
  data: CumulativeBenefit[][];  // Array of scenarios
  scenarioNames: string[];
  displayMode: 'today-dollars' | 'future-dollars';
  breakevens?: BreakevenMatrix;
}

function CumulativeBenefitsChart({
  data,
  scenarioNames,
  displayMode,
  breakevens
}: CumulativeBenefitsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="age"
          label={{ value: 'Age', position: 'insideBottom' }}
        />
        <YAxis
          label={{
            value: displayMode === 'today-dollars'
              ? "Cumulative Benefits (Today's $)"
              : 'Cumulative Benefits (Future $)',
            angle: -90,
            position: 'insideLeft'
          }}
        />
        <Tooltip />
        <Legend />
        {data.map((scenarioData, idx) => (
          <Line
            key={idx}
            data={scenarioData}
            dataKey="cumulative"
            name={scenarioNames[idx]}
            stroke={CHART_COLORS[idx]}
            strokeWidth={2}
          />
        ))}
        {/* Render breakeven indicators */}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Data Flow

### Typical User Flow

1. **Initial Load**
   ```
   App loads → Load saved scenarios from IndexedDB
   → Initialize with default scenario
   → Render form with defaults
   ```

2. **User Edits Inputs**
   ```
   User changes input → Update current scenario state
   → Trigger recalculation (memoized)
   → Update chart in real-time
   ```

3. **User Saves Scenario**
   ```
   User clicks "Save" → Validate scenario
   → Prompt for name → Save to IndexedDB
   → Update scenarios list → Show confirmation
   ```

4. **User Compares Scenarios**
   ```
   User selects 2+ scenarios → Calculate pairwise breakevens
   → Transform data for charts → Render comparison view
   → Highlight breakeven points
   ```

## Performance Optimizations

### Calculation Caching
- Use `useMemo` for expensive calculations
- Cache FRA lookups
- Memoize chart data transformations

### Rendering Optimizations
- Use `React.memo` for pure components
- Virtualize long scenario lists (if >50 scenarios)
- Debounce input changes (300ms) before recalculating

### Bundle Optimizations
- Code split by route (though single-page app)
- Tree-shake unused shadcn components
- Lazy load charts (if below fold)

## Testing Strategy

### Unit Tests
- Test all calculation functions with known values
- Validate against SSA's official examples
- Test edge cases (age 62, 70, FRA boundaries)

### Integration Tests
- Test full calculation pipeline
- Test scenario CRUD operations
- Test chart data transformations

### E2E Tests (Optional Phase 2)
- Test complete user workflows
- Test scenario comparison
- Test data persistence across sessions

## Build & Deployment

### Next.js Configuration

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',  // Static export
  images: {
    unoptimized: true,  // Required for static export
  },
  // Enable static optimization
  reactStrictMode: true,
};
```

### Build Process

```bash
# Development
npm run dev

# Production build
npm run build
# Outputs to `out/` directory

# Deploy `out/` to CDN
```

### Environment Variables
None required (all client-side)

## Security Considerations

### Data Privacy
- All data stays in browser (IndexedDB)
- No server communication
- No analytics or tracking (unless explicitly added)
- Users can clear data via browser tools

### Input Validation
- All inputs validated client-side
- Zod schemas enforce type safety
- Prevent injection attacks (no eval, no innerHTML)

### Dependencies
- Regular updates for security patches
- Audit with `npm audit`
- Pin major versions in package.json

## Accessibility Plan

### WCAG 2.1 AA Compliance
- All interactive elements keyboard accessible
- Focus indicators visible
- Color contrast meets 4.5:1 ratio
- Form labels properly associated
- Error messages descriptive

### Screen Reader Support
- ARIA labels for charts
- Descriptive button text
- Status announcements for calculations
- Landmark regions for navigation

### Testing Tools
- axe DevTools for automated checks
- Manual keyboard navigation testing
- Screen reader testing (NVDA/JAWS/VoiceOver)

## Future Enhancements (Phase 2+)

### Technical Improvements
- Add PWA support (offline capability)
- Add print stylesheet for scenarios
- Export scenarios to JSON/CSV
- Import SSA benefit statements (PDF parsing)

### Feature Additions
- WEP/GPO calculations
- Tax implications estimator
- Monte Carlo simulations
- Life expectancy calculator integration

## Development Guidelines

See CLAUDE.md for:
- Coding standards
- Commit message format
- How to update this plan
- Development workflow

## Open Technical Questions

1. **Chart library**: Recharts vs D3.js vs Chart.js?
   - **Decision**: Recharts (React-friendly, good defaults)

2. **Form library**: React Hook Form vs plain state?
   - **Decision**: Plain state (simple form, no complex validation needs)

3. **Testing library**: Jest + RTL vs Vitest?
   - **Decision**: Vitest (faster, better Vite integration)

4. **Date handling**: date-fns vs Day.js vs native?
   - **Decision**: Native Date + Intl API (zero dependencies)

## Updates & Revision History

**Version 1.0** - Initial Technical Plan (2025-11-06)
- Architecture defined
- Tech stack selected
- Component structure outlined
- State management approach decided

---

**Note**: This technical plan should be updated as implementation progresses and technical decisions are made. See CLAUDE.md for update guidelines.
