import { baseApi } from '../../../shared/api/base.api';
import { validatedResult, type ApiResult, type BoundBaseQuery } from '../../../shared/api/validated-result.util';
import { addDays } from '../../../shared/date/day.util';
import type { TaskFormValues } from '../schemas/task-form.schema';
import { taskPageSchema, taskSchema, type Task } from '../schemas/task.schema';
import { FIRST_PAGE, WEEK_LENGTH, WEEK_PAGE_SIZE } from '../schemas/tasks.constants';

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
  }),
});

export const { useGetWeekTasksQuery, useCreateTaskMutation } = tasksApi;
