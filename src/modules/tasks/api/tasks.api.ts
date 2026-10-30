import { toApiError, type ApiErrorCode } from '../../../shared/api/api-error.util';
import { baseApi } from '../../../shared/api/base.api';
import { validatedResult, type ApiResult, type BoundBaseQuery } from '../../../shared/api/validated-result.util';
import { addDays } from '../../../shared/date/day.util';
import type { TaskFormValues } from '../schemas/task-form.schema';
import { taskPageSchema, taskSchema, type Task } from '../schemas/task.schema';
import { FIRST_PAGE, WEEK_LENGTH, WEEK_PAGE_SIZE } from '../schemas/tasks.constants';

// Cambios de una tarea que acepta PATCH /tasks/{id} (API-001: title, description y completed)
export interface TaskChanges {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

export interface UpdateTaskArgs {
  id: string;
  changes: TaskChanges;
}

// Errores que significan que el tablero muestra algo que ya no es real: se vuelve a pedir (RF-42, RF-45)
const STALE_BOARD_CODES: readonly ApiErrorCode[] = ['DAY_CLOSED', 'DAY_NOT_STARTED', 'TASK_NOT_FOUND'];

function updateTaskTags(error: unknown, changes: TaskChanges): ('Task' | 'Streak')[] {
  if (error !== undefined) return STALE_BOARD_CODES.includes(toApiError(error).code) ? ['Task'] : [];
  // Completar o desmarcar ya está en la caché (optimista); cambia la racha (D-7)
  return changes.completed === undefined ? ['Task'] : ['Streak'];
}

// Cambio optimista sobre las tareas de una semana en caché (D-7)
function markCompleted(tasks: Task[], id: string, completed: boolean): void {
  const target = tasks.find((task) => task.id === id);
  if (target !== undefined) target.completed = completed;
}

interface WeekRange {
  from: string;
  to: string;
}

function fetchWeekPage(baseQuery: BoundBaseQuery, range: WeekRange, page: number) {
  return Promise.resolve(baseQuery({ url: '/tasks', params: { ...range, page, pageSize: WEEK_PAGE_SIZE } })).then(
    (result) => validatedResult(result, taskPageSchema),
  );
}

// Tareas de los 7 días desde weekStart (plan §5.3). Con más de 100 se piden el resto de páginas y se concatenan
// en el orden de la API (R-4); si falla cualquiera, la semana entera es un error
async function fetchWeekTasks(baseQuery: BoundBaseQuery, weekStart: string): Promise<ApiResult<Task[]>> {
  const range = { from: weekStart, to: addDays(weekStart, WEEK_LENGTH - 1) };
  const first = await fetchWeekPage(baseQuery, range, FIRST_PAGE);
  if (first.error !== undefined) return first;
  const nextPages = Array.from({ length: Math.max(first.data.totalPages - FIRST_PAGE, 0) }, (_, index) =>
    fetchWeekPage(baseQuery, range, FIRST_PAGE + index + 1),
  );
  const rest = await Promise.all(nextPages);
  const failed = rest.find((page) => page.error !== undefined);
  if (failed?.error !== undefined) return { error: failed.error };
  return { data: [first, ...rest].flatMap((page) => page.data?.items ?? []) };
}

// Endpoints de tareas sobre la API base única (plan D-2); cada respuesta se valida con Zod (D-5)
export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWeekTasks: build.query<Task[], string>({
      queryFn: (weekStart, _api, _extra, baseQuery) => fetchWeekTasks(baseQuery, weekStart),
      providesTags: ['Task'],
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
        const weeks = tasksApi.util
          .selectInvalidatedBy(api.getState(), ['Task'])
          .filter((entry) => entry.endpointName === 'getWeekTasks')
          .map((entry): unknown => entry.originalArgs)
          .filter((week): week is string => typeof week === 'string');
        const patches = weeks.map((week) =>
          api.dispatch(
            tasksApi.util.updateQueryData('getWeekTasks', week, (tasks) => {
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
  }),
});

export const { useGetWeekTasksQuery, useCreateTaskMutation, useUpdateTaskMutation } = tasksApi;
