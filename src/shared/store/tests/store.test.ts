import { sessionStarted } from '../../../modules/auth';
import { createAppStore } from '../store';

describe('createAppStore', () => {
  it('combina el slice auth y la caché de RTK Query', () => {
    const store = createAppStore();
    const state = store.getState();
    expect(state.auth.status).toBe('unknown');
    expect(state.api).toBeDefined();
  });

  it('cada llamada crea un store independiente (aislamiento entre tests)', () => {
    const first = createAppStore();
    const second = createAppStore();
    first.dispatch(sessionStarted({ user: { id: 'u1', email: 'a@b.c', name: null, createdAt: 'x' }, csrfToken: 'c' }));
    expect(first.getState().auth.status).toBe('authenticated');
    expect(second.getState().auth.status).toBe('unknown');
  });
});
