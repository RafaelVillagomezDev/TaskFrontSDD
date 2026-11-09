import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '@modules/auth';
import { baseApi } from '@shared/api/base.api';
import { createSessionCleanup } from './session-cleanup.listener';

// Store único (CONSTITUTION.md V.2): sesión en auth y estado de servidor solo en la caché de RTK Query, que se borra
// al terminar la sesión (spec 004 RF-01)
export function createAppStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(createSessionCleanup()).concat(baseApi.middleware),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
