import { z } from 'zod';

import { apiErrorEnvelopeSchema, apiSuccessSchema, pageSchema } from '../api-envelope.schema';

// Sobre único de TaskApiSDD (API-001 «Sobre de respuesta», RF-39)
describe('apiSuccessSchema', () => {
  const itemSchema = z.object({ id: z.string() });

  it('acepta el sobre de éxito y devuelve data tipado', () => {
    const parsed = apiSuccessSchema(itemSchema).parse({
      success: true,
      status: 200,
      message: 'Operación realizada con éxito',
      data: { id: 'a' },
    });
    expect(parsed.data).toEqual({ id: 'a' });
  });

  it('acepta data null cuando el endpoint no devuelve nada', () => {
    expect(apiSuccessSchema(z.null()).parse({ success: true, status: 200, message: 'ok', data: null }).data).toBeNull();
  });

  it('rechaza una respuesta fuera de contrato', () => {
    expect(apiSuccessSchema(itemSchema).safeParse({ success: true, status: 200, data: { id: 1 } }).success).toBe(false);
  });
});

describe('pageSchema', () => {
  it('acepta una página con items y totales (RF-34)', () => {
    const page = pageSchema(z.object({ id: z.string() })).parse({
      items: [{ id: 'a' }],
      page: 1,
      pageSize: 50,
      totalItems: 1,
      totalPages: 1,
    });
    expect(page.totalItems).toBe(1);
  });
});

describe('apiErrorEnvelopeSchema', () => {
  it('acepta un error con details de validación', () => {
    const parsed = apiErrorEnvelopeSchema.parse({
      success: false,
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La petición no es válida.',
        details: [{ field: 'title', message: 'El título es obligatorio.' }],
      },
    });
    expect(parsed.error.details).toHaveLength(1);
  });

  it('acepta un error sin details', () => {
    expect(
      apiErrorEnvelopeSchema.safeParse({
        success: false,
        status: 404,
        error: { code: 'TASK_NOT_FOUND', message: 'La tarea no existe.' },
      }).success,
    ).toBe(true);
  });
});
