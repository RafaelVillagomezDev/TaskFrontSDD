import { createApi } from '@reduxjs/toolkit/query/react';

import { env } from '../config/env';
import { createSessionBaseQuery } from './session-base-query';

// API base única (plan D-2): cada módulo añade sus endpoints con injectEndpoints sobre una sola caché
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: createSessionBaseQuery({ baseUrl: env.apiUrl }),
  tagTypes: ['Task', 'Streak', 'Alert', 'Me'],
  endpoints: () => ({}),
});
