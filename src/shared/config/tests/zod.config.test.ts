import { z } from 'zod';

import '../zod.config';

describe('zod.config', () => {
  it('spec 004 RNF-01: Zod no prueba Function(), que la política de contenido y Trusted Types bloquean', () => {
    expect(z.config().jitless).toBe(true);
  });
});
