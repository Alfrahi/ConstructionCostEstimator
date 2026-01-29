import { describe, it, expect } from "vitest";
import { getProbabilityWeight, calculateRiskContingency } from "../risk";
import { calculateCategoryTotal } from "../shared";

describe("Risk Logic", () => {
  describe("getProbabilityWeight", () => {
    it("returns correct weights", () => {
      expect(getProbabilityWeight("low")).toBe(0.1);
      expect(getProbabilityWeight("medium")).toBe(0.3);
      expect(getProbabilityWeight("high")).toBe(0.5);
    });

    it("is case insensitive", () => {
      expect(getProbabilityWeight("High")).toBe(0.5);
    });

    it("returns 0 for unknown probability", () => {
      expect(getProbabilityWeight("unknown")).toBe(0);
    });
  });

  describe("calculateRiskContingency", () => {
    it("calculates contingency based on impact and probability", () => {
      expect(calculateRiskContingency(1000, "high")).toBe(500);
      expect(calculateRiskContingency(1000, "medium")).toBe(300);
      expect(calculateRiskContingency(1000, "low")).toBe(100);
    });
  });

  describe("calculateTotalRiskContingency", () => {
    it("sums up contingency amounts", () => {
      const risks = [
        { contingency_amount: 100 },
        { contingency_amount: 200 },
        { contingency_amount: 50 },
      ];
      expect(calculateCategoryTotal.risks(risks as any)).toBe(350);
    });

    it("handles empty array", () => {
      expect(calculateCategoryTotal.risks([])).toBe(0);
    });
  });
});
