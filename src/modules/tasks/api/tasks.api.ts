import { z } from 'zod';

import { toApiError, type ApiErrorCode } from '../../../shared/api/api-error.util';
import { baseApi } from '../../../shared/api/base.api';
import { validatedResult, type ApiResult, type BoundBaseQuery } from '../../../shared/api/validated-result.util';
import { addDays } from '../../../shared/date/day.util';
import type { TaskFormValues } from '../schemas/task-form.schema';
import type { Page } from '../../../shared/api/api-envelope.schema';
import type { HistoryStatus } from '../schemas/history-filters.schema';
import { taskPageSchema, taskSchema, type Task } from '../schemas/task.schema';
import { FIRST_PAGE, HISTORY_PAGE_SIZE, WEEK_LENGTH, WEEK_PAGE_SIZE } from '../schemas/tasks.constants';

// Cambios de una tarea que acepta PATCH /tasks/{id} (API-001: title, description y completed)
export interface TaskChanges {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

// Consulta del historial (plan §5.6): estado, rango opcional (cadena vacía = sin límite) y página
export interface HistoryQuery {
  status: HistoryStatus;
  from: string;
  to: string;
  page: number;
}

// Solo los parámetros con valor: la API no acepta fechas vacías
function historyParams({ status, from, to, page }: HistoryQuery) {
  return {
    status,
    ...(from === '' ? {} : { from }),
    ...(to === '' ? {} : { to }),
    page,
    pageSize: HISTORY_PAGE_SIZE,
  };
}

export interface UpdateTaskArgs {
  id: string;
  changes: TaskChanges;
}

// Errores que significan que el tablero muestra algo que ya no es real: se vuelve a pedir (RF-42, RF-45)
const STALE_BOARD_CODES: readonly ApiErrorCode[] = ['DAY_CLOSED', 'DAY_NOT_STARTED', 'TASK_NOT_FOUND'];

// Tras un rechazo, la semana solo se vuelve a pedir si lo que muestra ya no es real
function staleBoardTags(error: unknown): 'Task'[] {
  return STALE_BOARD_CODES.includes(toApiError(error).code) ? ['Task'] : [];
}

// Etiqueta propia del historial, además de la general 'Task' (que lo invalida junto al resto). El historial no recibe
// el cambio optimista de completar: con un filtro de estado la tarea tendría que salir o entrar en la lista
const HISTORY_TAG: { type: 'Task'; id: string } = { type: 'Task', id: 'HISTORY' };

type TaskTag = 'Task' | 'Streak' | typeof HISTORY_TAG;

function updateTaskTags(error: unknown, changes: TaskChanges): TaskTag[] {
  if (error !== undefined) return staleBoardTags(error);
  // Completar o desmarcar ya está en las semanas y días en caché (optimista): cambian la racha y el historial,
  // que se vuelven a pedir (D-7, T116)
  return changes.completed === undefined ? ['Task'] : ['Streak', HISTORY_TAG];
}

// Cambio optimista sobre una lista de tareas en caché (D-7)
function markCompleted(tasks: Task[], id: string, completed: boolean): void {
  const target = tasks.find((task) => task.id === id);
  if (target !== undefined) target.completed = completed;
}

// Consultas en caché que guardan una lista de tareas, a las que se aplica el cambio optimista
interface TaskListCache {
  endpointName: 'getWeekTasks' | 'getDayTasks';
  arg: string;
}

function isTaskListCache(entry: { endpointName: string; arg: unknown }): entry is TaskListCache {
  const isTaskList = entry.endpointName === 'getWeekTasks' || entry.endpointName === 'getDayTasks';
  return isTaskList && typeof entry.arg === 'string';
}

// Filtro de GET /tasks: un día (date) o un rango de días (from/to), sin combinarlos (API-001 RF-43)
type TaskFilter = { date: string } | { from: string; to: string };

function fetchTaskPage(baseQuery: BoundBaseQuery, filter: TaskFilter, page: number) {
  return Promise.resolve(baseQuery({ url: '/tasks', params: { ...filter, page, pageSize: WEEK_PAGE_SIZE } })).then(
    (result) => validatedResult(result, taskPageSchema),
  );
}

// Todas las tareas del filtro: con más de 100 se piden el resto de páginas y se concatenan en el orden de la
// API (R-4); si falla cualquiera, el conjunto entero es un error
async function fetchAllTasks(baseQuery: BoundBaseQuery, filter: TaskFilter): Promise<ApiResult<Task[]>> {
  const first = await fetchTaskPage(baseQuery, filter, FIRST_PAGE);
  if (first.error !== undefined) return first;
  const nextPages = Array.from({ length: Math.max(first.data.totalPages - FIRST_PAGE, 0) }, (_, index) =>
    fetchTaskPage(baseQuery, filter, FIRST_PAGE + index + 1),
  );
  const rest = await Promise.all(nextPages);
  const failed = rest.find((page) => page.error !== undefined);
  if (failed?.error !== undefined) return { error: failed.error };
  return { data: [first, ...rest].flatMap((page) => page.data?.items ?? []) };
}

// Endpoints de tareas sobre la API base única (plan D-2); cada respuesta se valida con Zod (D-5)
export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Tareas de los 7 días desde weekStart (plan §5.3)
    getWeekTasks: build.query<Task[], string>({
      queryFn: (weekStart, _api, _extra, baseQuery) =>
        fetchAllTasks(baseQuery, { from: weekStart, to: addDays(weekStart, WEEK_LENGTH - 1) }),
      providesTags: ['Task'],
    }),
    // Tareas de un solo día: el progreso de hoy cuando la semana visible no incluye hoy (plan §5.5)
    getDayTasks: build.query<Task[], string>({
      queryFn: (day, _api, _extra, baseQuery) => fetchAllTasks(baseQuery, { date: day }),
      providesTags: ['Task'],
    }),
    // Una página del historial (RF-31, RF-32, RF-34), en el orden de la API: fecha y creación (API-001 RF-41)
    getTasks: build.query<Page<Task>, HistoryQuery>({
      queryFn: async (query, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: '/tasks', params: historyParams(query) }), taskPageSchema),
      providesTags: [HISTORY_TAG],
    }),
    // Crear espera a la API e invalida la semana y la racha (plan D-7); la descripción vacía se guarda como null
    createTask: build.mutation<Task, TaskFormValues>({
      queryFn: async ({ title, description, date }, _api, _extra, baseQuery) => {
        const body = { title, description: description === '' ? null : description, date };
        return validatedResult(await baseQuery({ url: '/tasks', method: 'POST', body }), taskSchema);
      },
      invalidatesTags: (_result, error) => (error === undefined ? ['Task', 'Streak'] : []),
    }),
    // Completar y desmarcar son optimistas (D-7): la tarea cambia en las semanas en caché al instante y, si la
    // API rechaza, se deshace
    updateTask: build.mutation<Task, UpdateTaskArgs>({
      queryFn: async ({ id, changes }, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: `/tasks/${id}`, method: 'PATCH', body: changes }), taskSchema),
      async onQueryStarted({ id, changes }, api) {
        const { completed } = changes;
        if (completed === undefined) return;
        // Semanas y días en caché: el progreso de hoy también sale de la consulta de un día (plan §5.5)
        const cached = tasksApi.util
          .selectInvalidatedBy(api.getState(), ['Task'])
          .map((entry): { endpointName: string; arg: unknown } => ({
            endpointName: entry.endpointName,
            arg: entry.originalArgs,
          }))
          .filter(isTaskListCache);
        const patches = cached.map(({ endpointName, arg }) =>
          api.dispatch(
            tasksApi.util.updateQueryData(endpointName, arg, (tasks) => {
              markCompleted(tasks, id, completed);
            }),
          ),
        );
        const saved = await api.queryFulfilled.then(
          () => true,
          () => false,
        );
        if (!saved) for (const patch of patches) patch.undo();
      },
      invalidatesTags: (_result, error, { changes }) => updateTaskTags(error, changes),
    }),
    // Eliminar espera a la API (D-7): al acertar, la tarea sale del tablero y la racha se recalcula (RF-24)
    deleteTask: build.mutation<null, string>({
      queryFn: async (id, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: `/tasks/${id}`, method: 'DELETE' }), z.null()),
      invalidatesTags: (_result, error) => (error === undefined ? ['Task', 'Streak'] : staleBoardTags(error)),
    }),
  }),
});

export const {
  useGetWeekTasksQuery,
  useGetDayTasksQuery,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;
