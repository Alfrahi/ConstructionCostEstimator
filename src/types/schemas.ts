import { z } from "zod";

export const materialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  description: z.string().optional(),
  quantity: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0.01, "Quantity must be greater than 0"),
  ),
  unit: z.string().min(1, "Unit is required"),
  unit_price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0.01, "Unit price must be greater than 0"),
  ),
  group_id: z.string().optional(),
});

export type MaterialFormValues = z.infer<typeof materialSchema>;

export const laborSchema = z.object({
  worker_type: z.string().min(1, "Worker type is required"),
  description: z.string().optional().nullable(),
  number_of_workers: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(1, "Number of workers must be at least 1"),
  ),
  daily_rate: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0.01, "Daily rate must be greater than 0"),
  ),
  total_days: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(1, "Total days must be at least 1"),
  ),
  group_id: z.string().optional(),
});

export type LaborFormValues = z.infer<typeof laborSchema>;

export const equipmentSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  type: z.string().optional(),
  rental_or_purchase: z.string().min(1, "Rental or Purchase is required"),
  quantity: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(1, "Quantity must be at least 1"),
  ),
  cost_per_period: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0.01, "Cost per period must be greater than 0"),
  ),
  period_unit: z.string().min(1, "Period unit is required"),
  usage_duration: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(1, "Usage duration must be at least 1"),
  ),
  maintenance_cost: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional().default(0),
  ),
  fuel_cost: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional().default(0),
  ),
  group_id: z.string().optional(),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export const additionalCostSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0.01, "Amount must be greater than 0"),
  ),
  group_id: z.string().optional(),
});

export type AdditionalCostFormValues = z.infer<typeof additionalCostSchema>;
