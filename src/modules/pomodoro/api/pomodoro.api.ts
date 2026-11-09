import { z } from 'zod';

import { toApiError, type ApiErrorCode } from '@shared/api/api-error.util';
import type { Page } from '@shared/api/api-envelope.schema';
import { baseApi } from '@shared/api/base.api';
import { validatedResult } from '@shared/api/validated-result.util';
import {
  pomodoroPageSchema,
  pomodoroSchema,
  pomodoroTaskPageSchema,
  pomodoroTaskSchema,
  type Pomodoro,
  type PomodoroStatus,
  type PomodoroTask,
} from '../schemas/pomodoro.schema';

// Tarea nueva de una sesión (API-004 RF-04): la descripción vacía viaja como null
export interface NewPomodoroTask {
  title: string;
  description: string | null;
  date: string;
}

// Cuerpo de POST /pomodoros (API-004 RF-49)
export interface StartPomodoroBody {
  durationMinutes: number;
  newTasks: NewPomodoroTask[];
  waitingTaskIds: string[];
}

export interface ChangePomodoroStatusArgs {
  id: string;
  status: PomodoroStatus;
}

// Cuerpo de POST /pomodoros/{id}/tasks (API-004 RF-51)
export interface AddPomodoroTasksArgs {
  id: string;
  newTasks: NewPomodoroTask[];
  waitingTaskIds: string[];
}

export interface RemovePomodoroTaskArgs {
  id: string;
  taskId: string;
}

// Cambios que acepta PATCH /pomodoro-tasks/{id} (API-004 RF-48, RF-54): nunca la fecha
export interface PomodoroTaskChanges {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

export interface UpdatePomodoroTaskArgs {
  id: string;
  changes: PomodoroTaskChanges;
}

type PomodoroTag = 'Pomodoro' | 'PomodoroTask' | 'PomodoroStreak' | { type: 'Pomodoro'; id: string };

// Lista de sesiones: de ella sale la sesión activa (spec RF-03, plan D-3)
const LIST_TAG: { type: 'Pomodoro'; id: string } = { type: 'Pomodoro', id: 'LIST' };

// Errores que significan que la pantalla muestra algo que ya no es real: se vuelve a pedir la sesión y las
// tareas en espera para enseñar su estado actual (spec RF-46, RF-48)
const STALE_CODES: readonly ApiErrorCode[] = [
  'POMODORO_NOT_FOUND',
  'POMODORO_TASK_NOT_FOUND',
  'POMODORO_ALREADY_ACTIVE',
  'POMODORO_TASK_LIMIT',
  'INVALID_POMODORO_STATE',
  'POMODORO_TASK_IN_SESSION',
  'POMODORO_TASK_NOT_IN_SESSION',
  'POMODORO_TASK_COMPLETED',
];

function staleTags(error: unknown): PomodoroTag[] {
  return STALE_CODES.includes(toApiError(error).code) ? ['Pomodoro', 'PomodoroTask'] : [];
}

// Tras un cambio en la lista de la sesión: la lista de sesiones y las tareas en espera cambian (API-004 RF-26)
function sessionChangeTags(error: unknown): PomodoroTag[] {
  return error === undefined ? [LIST_TAG, 'PomodoroTask'] : staleTags(error);
}

// Terminar deja las pendientes en espera y puede cambiar la racha (API-004 RF-23, RF-38)
function statusChangeTags(error: unknown, status: PomodoroStatus): PomodoroTag[] {
  if (error !== undefined) return staleTags(error);
  return status === 'finished' ? [LIST_TAG, 'PomodoroTask', 'PomodoroStreak'] : [LIST_TAG];
}

// La sesión que devuelve un cambio se guarda en su caché sin volver a pedirla; un rechazo no toca la caché
async function fulfilledData(queryFulfilled: Promise<{ data: Pomodoro }>): Promise<Pomodoro | undefined> {
  return queryFulfilled.then(
    ({ data }) => data,
    () => undefined,
  );
}

// Endpoints del pomodoro sobre la API base única (001 plan D-2); cada respuesta se valida con Zod (001 D-5)
export const pomodoroApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Sesiones de la más reciente a la más antigua (API-004 RF-18); la primera de la página 1 puede ser la activa
    getPomodoros: build.query<Page<Pomodoro>, number>({
      queryFn: async (page, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: '/pomodoros', params: { page } }), pomodoroPageSchema),
      providesTags: [LIST_TAG],
    }),
    getPomodoro: build.query<Pomodoro, string>({
      queryFn: async (id, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery(`/pomodoros/${id}`), pomodoroSchema),
      providesTags: (_result, _error, id) => [{ type: 'Pomodoro', id }],
    }),
    // Empezar espera a la API (plan D-2): la nueva sesión aparece al volver a pedir la lista
    startPomodoro: build.mutation<Pomodoro, StartPomodoroBody>({
      queryFn: async (body, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: '/pomodoros', method: 'POST', body }), pomodoroSchema),
      invalidatesTags: (_result, error) => sessionChangeTags(error),
    }),
    // Pausar, reanudar o terminar (API-004 RF-50): la respuesta se guarda en la caché de esa sesión
    changePomodoroStatus: build.mutation<Pomodoro, ChangePomodoroStatusArgs>({
      queryFn: async ({ id, status }, _api, _extra, baseQuery) =>
        validatedResult(
          await baseQuery({ url: `/pomodoros/${id}`, method: 'PATCH', body: { status } }),
          pomodoroSchema,
        ),
      async onQueryStarted({ id }, api) {
        const saved = await fulfilledData(api.queryFulfilled);
        if (saved !== undefined) await api.dispatch(pomodoroApi.util.upsertQueryData('getPomodoro', id, saved));
      },
      invalidatesTags: (_result, error, { status }) => statusChangeTags(error, status),
    }),
    addPomodoroTasks: build.mutation<Pomodoro, AddPomodoroTasksArgs>({
      queryFn: async ({ id, newTasks, waitingTaskIds }, _api, _extra, baseQuery) =>
        validatedResult(
          await baseQuery({ url: `/pomodoros/${id}/tasks`, method: 'POST', body: { newTasks, waitingTaskIds } }),
          pomodoroSchema,
        ),
      async onQueryStarted({ id }, api) {
        const saved = await fulfilledData(api.queryFulfilled);
        if (saved !== undefined) await api.dispatch(pomodoroApi.util.upsertQueryData('getPomodoro', id, saved));
      },
      invalidatesTags: (_result, error) => sessionChangeTags(error),
    }),
    // Quitar una pendiente la deja en espera (API-004 RF-26)
    removePomodoroTask: build.mutation<Pomodoro, RemovePomodoroTaskArgs>({
      queryFn: async ({ id, taskId }, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: `/pomodoros/${id}/tasks/${taskId}`, method: 'DELETE' }), pomodoroSchema),
      async onQueryStarted({ id }, api) {
        const saved = await fulfilledData(api.queryFulfilled);
        if (saved !== undefined) await api.dispatch(pomodoroApi.util.upsertQueryData('getPomodoro', id, saved));
      },
      invalidatesTags: (_result, error) => sessionChangeTags(error),
    }),
    // Tareas en espera por fecha ascendente (API-004 RF-24)
    getWaitingTasks: build.query<Page<PomodoroTask>, number>({
      queryFn: async (page, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: '/pomodoro-tasks', params: { page } }), pomodoroTaskPageSchema),
      providesTags: ['PomodoroTask'],
    }),
    // Completar, desmarcar o editar (API-004 RF-13, RF-48). Sin cambio optimista (plan D-2): la respuesta cambia
    // completedTasks de la sesión, que se vuelve a pedir
    updatePomodoroTask: build.mutation<PomodoroTask, UpdatePomodoroTaskArgs>({
      queryFn: async ({ id, changes }, _api, _extra, baseQuery) =>
        validatedResult(
          await baseQuery({ url: `/pomodoro-tasks/${id}`, method: 'PATCH', body: changes }),
          pomodoroTaskSchema,
        ),
      invalidatesTags: (_result, error) => (error === undefined ? ['Pomodoro', 'PomodoroTask'] : staleTags(error)),
    }),
    // Borrar solo se permite en espera (API-004 RF-22)
    deleteWaitingTask: build.mutation<null, string>({
      queryFn: async (id, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: `/pomodoro-tasks/${id}`, method: 'DELETE' }), z.null()),
      invalidatesTags: (_result, error) => (error === undefined ? ['PomodoroTask'] : staleTags(error)),
    }),
  }),
});

export const {
  useGetPomodorosQuery,
  useGetPomodoroQuery,
  useStartPomodoroMutation,
  useChangePomodoroStatusMutation,
  useAddPomodoroTasksMutation,
  useRemovePomodoroTaskMutation,
  useGetWaitingTasksQuery,
  useUpdatePomodoroTaskMutation,
  useDeleteWaitingTaskMutation,
} = pomodoroApi;
