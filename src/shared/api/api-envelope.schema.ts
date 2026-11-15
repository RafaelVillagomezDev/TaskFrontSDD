import { z } from 'zod';

// Sobre único de TaskApiSDD: toda respuesta se valida en lugar de darla por buena (CONSTITUTION.md IV.2, plan D-5)
export function apiSuccessSchema<T extends z.ZodType>(data: T) {
  return z.object({
    success: z.literal(true),
    status: z.number().int(),
    message: z.string(),
    data,
  });
}

// Página de una lista (API-001 RF-39)
export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
}

export type Page<T> = z.infer<ReturnType<typeof pageSchema<z.ZodType<T>>>>;

export const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  status: z.number().int(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  }),
});
