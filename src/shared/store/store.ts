import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '../../modules/auth';
import { baseApi } from '../api/base.api';

// Store único (CONSTITUTION.md V.2): sesión en auth y estado de servidor solo en la caché de RTK Query
export function createAppStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
