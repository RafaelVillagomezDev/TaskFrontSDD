// Textos visibles del módulo de tareas (AGENTS.md §4: nunca escritos directamente en el JSX)
export const TASKS_TEXTS = {
  board: {
    title: 'Tablero',
    region: 'Tareas de la semana',
  },
  week: {
    previous: 'Semana anterior',
    next: 'Semana siguiente',
    today: 'Hoy',
    range: (from: string, to: string): string => `${from} – ${to}`,
  },
  column: {
    today: 'Hoy',
    closed: 'Día cerrado',
    empty: 'Sin tareas',
    pending: 'Pendientes',
    completed: 'Completadas',
    count: (total: number): string => (total === 1 ? '1 tarea' : `${String(total)} tareas`),
  },
  status: {
    pending: 'Pendiente',
    completed: 'Completada',
  },
};
