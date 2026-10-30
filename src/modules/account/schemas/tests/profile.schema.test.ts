import { profileSchema } from '../profile.schema';

describe('profileSchema (RF-38, RF-46)', () => {
  it('el nombre es opcional: vacío es válido', () => {
    expect(profileSchema.parse({ name: '' })).toEqual({ name: '' });
  });

  it('recorta los espacios de los extremos y acepta 100 caracteres', () => {
    expect(profileSchema.parse({ name: `  ${'n'.repeat(100)}  ` }).name).toHaveLength(100);
    expect(profileSchema.parse({ name: '   ' }).name).toBe('');
  });

  it('rechaza 101 caracteres con su mensaje', () => {
    const result = profileSchema.safeParse({ name: 'n'.repeat(101) });
    expect(result.error?.issues[0]?.message).toBe('El nombre no puede tener más de 100 caracteres.');
  });
});
