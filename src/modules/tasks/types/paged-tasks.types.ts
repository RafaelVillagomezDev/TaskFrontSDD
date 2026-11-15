import type { Task } from '../schemas/task.schema';

export type PagedTasksStatus = 'loading' | 'error' | 'ready';

// Modelo de una lista paginada de tareas en solo lectura (plan 002 D-2): lo devuelven useHistory y useTaskDay
export interface PagedTasks {
  status: PagedTasksStatus;
  tasks: Task[];
  page: number;
  totalPages: number;
  totalItems: number;
  goToPage: (page: number) => void;
  errorMessage: string | undefined;
  retry: () => void;
}
