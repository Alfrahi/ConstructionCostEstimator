import Decimal from "https://esm.sh/decimal.js@10.4.3";

Decimal.set({ precision: 20 });

export { Decimal };

export type DecimalValue = number | string | Decimal | undefined | null;

export const round = (value: DecimalValue, decimals: number = 2): number => {
  return new Decimal(value || 0).toDecimalPlaces(decimals).toNumber();
};

export const safeAdd = (...args: DecimalValue[]): number => {
  return args
    .reduce<Decimal>(
      (acc, val) => acc.plus(new Decimal(val || 0)),
      new Decimal(0),
    )
    .toDecimalPlaces(2)
    .toNumber();
};

export const safeMult = (...args: DecimalValue[]): number => {
  if (args.length === 0) return 1;
  return args
    .reduce<Decimal>(
      (acc, val) => acc.times(new Decimal(val || 0)),
      new Decimal(1),
    )
    .toDecimalPlaces(2)
    .toNumber();
};

export const safeSub = (
  first: DecimalValue,
  ...args: DecimalValue[]
): number => {
  return args
    .reduce<Decimal>(
      (acc, val) => acc.minus(new Decimal(val || 0)),
      new Decimal(first || 0),
    )
    .toDecimalPlaces(2)
    .toNumber();
};

export const safeDiv = (
  a: DecimalValue,
  b: DecimalValue,
  decimals: number = 2,
): number => {
  const divisor = new Decimal(b || 0);
  if (divisor.isZero()) return 0;
  return new Decimal(a || 0)
    .dividedBy(divisor)
    .toDecimalPlaces(decimals)
    .toNumber();
};

export const PROBABILITY_WEIGHTS: Record<string, number> = {
  low: 0.1,
  medium: 0.3,
  high: 0.5,
};

export function getProbabilityWeight(probability: string): number {
  const p = probability?.toLowerCase() || "";
  if (p.includes("high")) return PROBABILITY_WEIGHTS.high;
  if (p.includes("medium")) return PROBABILITY_WEIGHTS.medium;
  if (p.includes("low")) return PROBABILITY_WEIGHTS.low;
  return 0;
}

export function calculateRiskContingency(
  impact: number,
  probability: string,
): number {
  const weight = getProbabilityWeight(probability);
  return safeMult(impact, new Decimal(weight));
}

export const calculateItemCost = {
  material: (quantity: number, unitPrice: number): number => {
    return safeMult(quantity, unitPrice);
  },

  labor: (
    numberOfWorkers: number,
    dailyRate: number,
    totalDays: number,
  ): number => {
    return safeMult(numberOfWorkers, dailyRate, totalDays);
  },

  equipment: (input: {
    quantity: number;
    costPerPeriod: number;
    usageDuration: number;
    maintenanceCost?: number | null;
    fuelCost?: number | null;
  }): { baseCost: number; totalCost: number } => {
    const baseCost = safeMult(
      input.quantity,
      input.costPerPeriod,
      input.usageDuration,
    );
    const maintenance = input.maintenanceCost || 0;
    const fuel = input.fuelCost || 0;
    const totalCost = safeAdd(baseCost, maintenance, fuel);
    return { baseCost, totalCost };
  },

  additional: (amount: number): number => {
    return amount;
  },

  risk: (impact: number, probabilityWeight: number): number => {
    return safeMult(impact, probabilityWeight);
  },
};

export const calculateCategoryTotal = {
  materials: (
    materials: { quantity: number; unit_price: number }[],
  ): number => {
    return materials.reduce(
      (sum, item) =>
        safeAdd(
          sum,
          calculateItemCost.material(item.quantity, item.unit_price),
        ),
      0,
    );
  },

  labor: (
    laborItems: {
      number_of_workers: number;
      daily_rate: number;
      total_days: number;
    }[],
  ): number => {
    return laborItems.reduce(
      (sum, item) =>
        safeAdd(
          sum,
          calculateItemCost.labor(
            item.number_of_workers,
            item.daily_rate,
            item.total_days,
          ),
        ),
      0,
    );
  },

  equipment: (
    equipmentItems: {
      quantity: number;
      cost_per_period: number;
      usage_duration: number;
      maintenance_cost?: number | null;
      fuel_cost?: number | null;
    }[],
  ): number => {
    return equipmentItems.reduce(
      (sum, item) => safeAdd(sum, calculateItemCost.equipment(item).totalCost),
      0,
    );
  },

  additional: (costs: { amount: number }[]): number => {
    return costs.reduce((sum, item) => safeAdd(sum, item.amount), 0);
  },

  risks: (risks: { contingency_amount: number }[]): number => {
    return risks.reduce((sum, r) => safeAdd(sum, r.contingency_amount), 0);
  },
};

export type FinancialSettings = {
  overhead_percent: number;
  markup_percent: number;
  tax_percent: number;
  contingency_percent: number;
};

export type FinancialSummary = {
  materialsTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  additionalTotal: number;
  directCosts: number;
  overheadAmount: number;
  contingencyAmount: number;
  primeCost: number;
  markupAmount: number;
  bidPrice: number;
  taxAmount: number;
  grandTotal: number;
};

export const calculateFinancials = {
  directCosts: (
    materialsTotal: number,
    laborTotal: number,
    equipmentTotal: number,
    additionalTotal: number,
  ): number => {
    return safeAdd(materialsTotal, laborTotal, equipmentTotal, additionalTotal);
  },

  percentageAmount: (baseAmount: number, percentage: number): number => {
    return safeMult(baseAmount, safeDiv(percentage, 100));
  },

  withOverheadAndContingency: (
    directCosts: number,
    overheadPercent: number,
    contingencyPercent: number,
  ): {
    primeCost: number;
    overheadAmount: number;
    contingencyAmount: number;
  } => {
    const overheadAmount = calculateFinancials.percentageAmount(
      directCosts,
      overheadPercent,
    );
    const contingencyAmount = calculateFinancials.percentageAmount(
      directCosts,
      contingencyPercent,
    );
    const primeCost = safeAdd(directCosts, overheadAmount, contingencyAmount);
    return { primeCost, overheadAmount, contingencyAmount };
  },

  withMarkup: (
    baseAmount: number,
    markupPercent: number,
  ): { bidPrice: number; markupAmount: number } => {
    const markupAmount = calculateFinancials.percentageAmount(
      baseAmount,
      markupPercent,
    );
    const bidPrice = safeAdd(baseAmount, markupAmount);
    return { bidPrice, markupAmount };
  },

  withTax: (
    baseAmount: number,
    taxPercent: number,
  ): { grandTotal: number; taxAmount: number } => {
    const taxAmount = calculateFinancials.percentageAmount(
      baseAmount,
      taxPercent,
    );
    const grandTotal = safeAdd(baseAmount, taxAmount);
    return { grandTotal, taxAmount };
  },

  calculateProjectFinancials: (
    costTotals: {
      materialsTotal: number;
      laborTotal: number;
      equipmentTotal: number;
      additionalTotal: number;
    },
    settings: FinancialSettings,
  ): FinancialSummary => {
    const { materialsTotal, laborTotal, equipmentTotal, additionalTotal } =
      costTotals;
    const {
      overhead_percent,
      markup_percent,
      tax_percent,
      contingency_percent,
    } = settings;

    const directCosts = calculateFinancials.directCosts(
      materialsTotal,
      laborTotal,
      equipmentTotal,
      additionalTotal,
    );

    const { primeCost, overheadAmount, contingencyAmount } =
      calculateFinancials.withOverheadAndContingency(
        directCosts,
        overhead_percent,
        contingency_percent,
      );

    const { bidPrice, markupAmount } = calculateFinancials.withMarkup(
      primeCost,
      markup_percent,
    );
    const { grandTotal, taxAmount } = calculateFinancials.withTax(
      bidPrice,
      tax_percent,
    );

    return {
      materialsTotal,
      laborTotal,
      equipmentTotal,
      additionalTotal,
      directCosts,
      overheadAmount,
      contingencyAmount,
      primeCost,
      markupAmount,
      bidPrice,
      taxAmount,
      grandTotal,
    };
  },
};
