declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withAuth, AuthenticatedUser, corsHeaders } from "../_shared/auth.ts";
import {
  Decimal,
  safeAdd,
  safeMult,
  getProbabilityWeight,
  calculateItemCost,
  calculateCategoryTotal,
  calculateFinancials,
  FinancialSettings,
  FinancialSummary,
} from "../_shared/calculations.ts";

async function simulateProjectScenarioHandler(
  user: AuthenticatedUser,
  req: Request,
): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      },
    );

    const { project_id, scenario } = await req.json();

    if (!project_id || !scenario || !scenario.impact_rules) {
      return new Response(
        JSON.stringify({ error: "Missing project_id or scenario definition" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: projectData, error: projectError } = await supabaseClient
      .from("projects")
      .select("currency, financial_settings")
      .eq("id", project_id)
      .single();
    if (projectError) throw projectError;

    const { data: materialsData, error: materialsError } = await supabaseClient
      .from("materials")
      .select("*")
      .eq("project_id", project_id);
    if (materialsError) throw materialsError;

    const { data: laborData, error: laborError } = await supabaseClient
      .from("labor_items")
      .select("*")
      .eq("project_id", project_id);
    if (laborError) throw laborError;

    const { data: equipmentData, error: equipmentError } = await supabaseClient
      .from("equipment_items")
      .select("*")
      .eq("project_id", project_id);
    if (equipmentError) throw equipmentError;

    const { data: additionalData, error: additionalError } =
      await supabaseClient
        .from("additional_costs")
        .select("*")
        .eq("project_id", project_id);
    if (additionalError) throw additionalError;

    const { data: risksData, error: risksError } = await supabaseClient
      .from("risks")
      .select("*")
      .eq("project_id", project_id);
    if (risksError) throw risksError;

    let simulatedMaterials = JSON.parse(JSON.stringify(materialsData));
    let simulatedLabor = JSON.parse(JSON.stringify(laborData));
    let simulatedEquipment = JSON.parse(JSON.stringify(equipmentData));
    let simulatedAdditional = JSON.parse(JSON.stringify(additionalData));
    let simulatedRisks = JSON.parse(JSON.stringify(risksData));
    let simulatedFinancialSettings: FinancialSettings = JSON.parse(
      JSON.stringify(projectData.financial_settings),
    );

    for (const rule of scenario.impact_rules) {
      const { item_type, field, adjustment_type, value, filter } = rule;
      const adjustmentValue = new Decimal(value || 0);

      switch (item_type) {
        case "materials":
          simulatedMaterials = simulatedMaterials.map((item: any) => {
            if (
              filter &&
              filter.name_contains &&
              !item.name
                .toLowerCase()
                .includes(filter.name_contains.toLowerCase())
            ) {
              return item;
            }
            if (field === "unit_price") {
              let newPrice = new Decimal(item.unit_price || 0);
              if (adjustment_type === "percentage_increase") {
                newPrice = newPrice.times(
                  Decimal.sum(1, adjustmentValue.div(100)),
                );
              } else if (adjustment_type === "fixed_increase") {
                newPrice = newPrice.plus(adjustmentValue);
              }
              return { ...item, unit_price: newPrice.toNumber() };
            }
            return item;
          });
          break;
        case "labor":
          simulatedLabor = simulatedLabor.map((item: any) => {
            if (
              filter &&
              filter.worker_type_contains &&
              !item.worker_type
                .toLowerCase()
                .includes(filter.worker_type_contains.toLowerCase())
            ) {
              return item;
            }
            if (field === "daily_rate") {
              let newRate = new Decimal(item.daily_rate || 0);
              if (adjustment_type === "percentage_increase") {
                newRate = newRate.times(
                  Decimal.sum(1, adjustmentValue.div(100)),
                );
              } else if (adjustment_type === "fixed_increase") {
                newRate = newRate.plus(adjustmentValue);
              }
              return { ...item, daily_rate: newRate.toNumber() };
            } else if (
              field === "total_days" &&
              adjustment_type === "fixed_increase"
            ) {
              return {
                ...item,
                total_days: new Decimal(item.total_days || 0)
                  .plus(adjustmentValue)
                  .toNumber(),
              };
            }
            return item;
          });
          break;
        case "equipment":
          simulatedEquipment = simulatedEquipment.map((item: any) => {
            if (
              filter &&
              filter.name_contains &&
              !item.name
                .toLowerCase()
                .includes(filter.name_contains.toLowerCase())
            ) {
              return item;
            }
            let newItem = { ...item };
            if (field === "cost_per_period") {
              let newCost = new Decimal(item.cost_per_period || 0);
              if (adjustment_type === "percentage_increase") {
                newCost = newCost.times(
                  Decimal.sum(1, adjustmentValue.div(100)),
                );
              } else if (adjustment_type === "fixed_increase") {
                newCost = newCost.plus(adjustmentValue);
              }
              newItem.cost_per_period = newCost.toNumber();
            } else if (field === "maintenance_cost") {
              let newCost = new Decimal(item.maintenance_cost || 0);
              if (adjustment_type === "percentage_increase") {
                newCost = newCost.times(
                  Decimal.sum(1, adjustmentValue.div(100)),
                );
              } else if (adjustment_type === "fixed_increase") {
                newCost = newCost.plus(adjustmentValue);
              }
              newItem.maintenance_cost = newCost.toNumber();
            } else if (field === "fuel_cost") {
              let newCost = new Decimal(item.fuel_cost || 0);
              if (adjustment_type === "percentage_increase") {
                newCost = newCost.times(
                  Decimal.sum(1, adjustmentValue.div(100)),
                );
              } else if (adjustment_type === "fixed_increase") {
                newCost = newCost.plus(adjustmentValue);
              }
              newItem.fuel_cost = newCost.toNumber();
            } else if (
              field === "usage_duration" &&
              adjustment_type === "fixed_increase"
            ) {
              newItem.usage_duration = new Decimal(item.usage_duration || 0)
                .plus(adjustmentValue)
                .toNumber();
            }
            return newItem;
          });
          break;
        case "additional":
          simulatedAdditional = simulatedAdditional.map((item: any) => {
            if (
              filter &&
              filter.category_is &&
              item.category !== filter.category_is
            ) {
              return item;
            }
            if (field === "amount") {
              let newAmount = new Decimal(item.amount || 0);
              if (adjustment_type === "percentage_increase") {
                newAmount = newAmount.times(
                  Decimal.sum(1, adjustmentValue.div(100)),
                );
              } else if (adjustment_type === "fixed_increase") {
                newAmount = newAmount.plus(adjustmentValue);
              }
              return { ...item, amount: newAmount.toNumber() };
            }
            return item;
          });
          break;
        case "risks":
          if (field === "realize_risk_impact" && adjustment_type === "by_id") {
            const riskToRealize = simulatedRisks.find(
              (r: any) => r.id === value,
            );
            if (riskToRealize) {
              simulatedAdditional.push({
                id: crypto.randomUUID(),
                project_id: project_id,
                user_id: null,
                category: "Simulated Risk Impact",
                description: `Impact of risk: ${riskToRealize.description}`,
                amount: riskToRealize.impact_amount,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
          break;
        case "financial_settings":
          if (
            field === "overhead_percent" &&
            adjustment_type === "fixed_increase"
          ) {
            simulatedFinancialSettings.overhead_percent = new Decimal(
              simulatedFinancialSettings.overhead_percent || 0,
            )
              .plus(adjustmentValue)
              .toNumber();
          } else if (
            field === "markup_percent" &&
            adjustment_type === "fixed_increase"
          ) {
            simulatedFinancialSettings.markup_percent = new Decimal(
              simulatedFinancialSettings.markup_percent || 0,
            )
              .plus(adjustmentValue)
              .toNumber();
          } else if (
            field === "tax_percent" &&
            adjustment_type === "fixed_increase"
          ) {
            simulatedFinancialSettings.tax_percent = new Decimal(
              simulatedFinancialSettings.tax_percent || 0,
            )
              .plus(adjustmentValue)
              .toNumber();
          } else if (
            field === "contingency_percent" &&
            adjustment_type === "fixed_increase"
          ) {
            simulatedFinancialSettings.contingency_percent = new Decimal(
              simulatedFinancialSettings.contingency_percent || 0,
            )
              .plus(adjustmentValue)
              .toNumber();
          }
          break;
      }
    }

    const simulatedMaterialsTotal =
      calculateCategoryTotal.materials(simulatedMaterials);
    const simulatedLaborTotal = calculateCategoryTotal.labor(simulatedLabor);
    const simulatedEquipmentTotal =
      calculateCategoryTotal.equipment(simulatedEquipment);
    const simulatedAdditionalTotal =
      calculateCategoryTotal.additional(simulatedAdditional);

    const originalMaterialsTotal =
      calculateCategoryTotal.materials(materialsData);
    const originalLaborTotal = calculateCategoryTotal.labor(laborData);
    const originalEquipmentTotal =
      calculateCategoryTotal.equipment(equipmentData);
    const originalAdditionalTotal =
      calculateCategoryTotal.additional(additionalData);

    const originalFinancials = calculateFinancials.calculateProjectFinancials(
      {
        materialsTotal: originalMaterialsTotal,
        laborTotal: originalLaborTotal,
        equipmentTotal: originalEquipmentTotal,
        additionalTotal: originalAdditionalTotal,
      },
      projectData.financial_settings,
    );

    const simulatedFinancials = calculateFinancials.calculateProjectFinancials(
      {
        materialsTotal: simulatedMaterialsTotal,
        laborTotal: simulatedLaborTotal,
        equipmentTotal: simulatedEquipmentTotal,
        additionalTotal: simulatedAdditionalTotal,
      },
      simulatedFinancialSettings,
    );

    return new Response(
      JSON.stringify({
        original: {
          currency: projectData.currency,
          financials: originalFinancials,
          materials: materialsData,
          labor: laborData,
          equipment: equipmentData,
          additional: additionalData,
          risks: risksData,
          financial_settings: projectData.financial_settings,
        },
        simulated: {
          currency: projectData.currency,
          financials: simulatedFinancials,
          materials: simulatedMaterials,
          labor: simulatedLabor,
          equipment: simulatedEquipment,
          additional: simulatedAdditional,
          risks: simulatedRisks,
          financial_settings: simulatedFinancialSettings,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

export default withAuth(simulateProjectScenarioHandler);
