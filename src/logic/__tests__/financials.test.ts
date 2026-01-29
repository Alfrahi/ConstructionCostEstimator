import { describe, it, expect } from "vitest";
import { calculateProjectFinancials } from "../financials";

describe("Financial Logic", () => {
  const mockTotals = {
    materialsTotal: 1000,
    laborTotal: 2000,
    equipmentTotal: 500,
    additionalTotal: 500,
  };

  const mockSettings = {
    overhead_percent: 10,
    contingency_percent: 5,
    markup_percent: 20,
    tax_percent: 10,
  };

  it("calculates financials correctly", () => {
    const result = calculateProjectFinancials(mockTotals, mockSettings);

    expect(result.directCosts).toBe(4000);

    expect(result.overheadAmount).toBe(400);

    expect(result.contingencyAmount).toBe(200);

    expect(result.primeCost).toBe(4600);

    expect(result.markupAmount).toBe(920);

    expect(result.bidPrice).toBe(5520);

    expect(result.taxAmount).toBe(552);

    expect(result.grandTotal).toBe(6072);
  });

  it("handles zero values", () => {
    const zeroTotals = {
      materialsTotal: 0,
      laborTotal: 0,
      equipmentTotal: 0,
      additionalTotal: 0,
    };
    const result = calculateProjectFinancials(zeroTotals, mockSettings);
    expect(result.grandTotal).toBe(0);
  });
});
