import { z } from "zod";

export const createHumorFlavorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const updateHumorFlavorSchema = createHumorFlavorSchema;

/** New display name for a duplicated flavor (must be unique in your DB). */
export const duplicateHumorFlavorSchema = z.object({
  name: z.string().min(1, "Name is required").max(500),
});

export const createHumorFlavorStepSchema = z.object({
  humor_flavor_id: z.number().positive(),
  order_by: z.number().int().min(0),
  description: z.string().optional(),
  llm_system_prompt: z.string().optional(),
  llm_user_prompt: z.string().optional(),
  llm_temperature: z.number().min(0).max(2).optional(),
  llm_model_id: z.number().positive(),
  llm_input_type_id: z.number().positive(),
  llm_output_type_id: z.number().positive(),
  humor_flavor_step_type_id: z.number().positive(),
});

export const updateHumorFlavorStepSchema = createHumorFlavorStepSchema.partial();

export const reorderStepSchema = z.object({
  from_order: z.number().int().min(0),
  to_order: z.number().int().min(0),
});

export type CreateHumorFlavorInput = z.infer<typeof createHumorFlavorSchema>;
export type UpdateHumorFlavorInput = z.infer<typeof updateHumorFlavorSchema>;
export type DuplicateHumorFlavorInput = z.infer<typeof duplicateHumorFlavorSchema>;
export type CreateHumorFlavorStepInput = z.infer<typeof createHumorFlavorStepSchema>;
export type UpdateHumorFlavorStepInput = z.infer<typeof updateHumorFlavorStepSchema>;
export type ReorderStepInput = z.infer<typeof reorderStepSchema>;
