import { historyFiltersSchema } from '../history-filters.schema';

function errorsOf(value: unknown): Record<string, string | undefined> {
  const result = historyFiltersSchema.safeParse(value);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}

describe('historyFiltersSchema (RF-32, RF-33, RF-46)', () => {
  it.each(['all', 'completed', 'pending'])('RF-32: acepta el estado %s', (status) => {
    expect(historyFiltersSchema.parse({ status, from: '', to: '' }).status).toBe(status);
  });

  it('RF-32: rechaza un estado desconocido', () => {
    expect(historyFiltersSchema.safeParse({ status: 'done', from: '', to: '' }).success).toBe(false);
  });

  it('RF-32: «desde» y «hasta» son opcionales y se pueden usar por separado', () => {
    expect(historyFiltersSchema.safeParse({ status: 'all', from: '2026-10-01', to: '' }).success).toBe(true);
    expect(historyFiltersSchema.safeParse({ status: 'all', from: '', to: '2026-10-31' }).success).toBe(true);
  });

  it('RF-32: «desde» igual a «hasta» es un rango válido de un día', () => {
    expect(historyFiltersSchema.safeParse({ status: 'all', from: '2026-10-29', to: '2026-10-29' }).success).toBe(true);
  });

  it('RF-33: «desde» posterior a «hasta» da el error en «desde»', () => {
    expect(errorsOf({ status: 'all', from: '2026-10-30', to: '2026-10-29' })).toEqual({
      from: '«Desde» no puede ser posterior a «Hasta».',
    });
  });

  it('RF-46: una fecha que no es un día válido da su error', () => {
    expect(errorsOf({ status: 'all', from: '2026-02-30', to: '29/10/2026' })).toEqual({
      from: 'Elige una fecha válida.',
      to: 'Elige una fecha válida.',
    });
  });
});
