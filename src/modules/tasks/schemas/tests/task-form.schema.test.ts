import { createTaskFormSchema } from '../task-form.schema';

const TODAY = '2026-10-29';
const schema = createTaskFormSchema(TODAY);
const VALID = { title: 'Comprar pan', description: '', date: TODAY };

function errorsOf(values: Record<string, string>): Record<string, string | undefined> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}

describe('RF-46: createTaskFormSchema', () => {
  it('acepta un título y una fecha de hoy, sin descripción', () => {
    expect(schema.parse(VALID)).toEqual(VALID);
  });

  it('RF-46: recorta el título y la descripción', () => {
    expect(schema.parse({ ...VALID, title: '  Comprar pan  ', description: '  Integral ' })).toEqual({
      ...VALID,
      description: 'Integral',
    });
  });

  it.each([
    ['vacío', ''],
    ['con solo espacios', '    '],
  ])('RF-46: un título %s es obligatorio', (_case, title) => {
    expect(errorsOf({ ...VALID, title })).toEqual({ title: 'Escribe un título.' });
  });

  it('RF-46: un título de 200 caracteres se acepta y uno de 201 no', () => {
    expect(schema.safeParse({ ...VALID, title: 'a'.repeat(200) }).success).toBe(true);
    expect(errorsOf({ ...VALID, title: 'a'.repeat(201) })).toEqual({
      title: 'El título no puede tener más de 200 caracteres.',
    });
  });

  it('RF-46: el título se mide sin los espacios del principio y del final', () => {
    expect(schema.safeParse({ ...VALID, title: ` ${'a'.repeat(200)} ` }).success).toBe(true);
  });

  it('RF-46: una descripción de 1000 caracteres se acepta y una de 1001 no', () => {
    expect(schema.safeParse({ ...VALID, description: 'a'.repeat(1000) }).success).toBe(true);
    expect(errorsOf({ ...VALID, description: 'a'.repeat(1001) })).toEqual({
      description: 'La descripción no puede tener más de 1000 caracteres.',
    });
  });

  it('RF-16: acepta un día futuro', () => {
    expect(schema.safeParse({ ...VALID, date: '2027-01-15' }).success).toBe(true);
  });

  it.each([
    ['vacía', '', 'Elige una fecha.'],
    ['con otro formato', '29/10/2026', 'Elige una fecha válida.'],
    ['inexistente', '2026-02-30', 'Elige una fecha válida.'],
    ['pasada', '2026-10-28', 'Elige hoy o un día posterior.'],
  ])('RF-16 y RF-46: rechaza una fecha %s con un único error', (_case, date, message) => {
    expect(errorsOf({ ...VALID, date })).toEqual({ date: message });
  });
});
