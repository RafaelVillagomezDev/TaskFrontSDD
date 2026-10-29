// Textos visibles del módulo de tareas (AGENTS.md §4: nunca escritos directamente en el JSX)
export const TASKS_TEXTS = {
  board: {
    title: 'Tablero',
    region: 'Tareas de la semana',
    newTask: 'Nueva tarea',
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
    addTask: 'Añadir tarea',
    // Nombre accesible que distingue el botón de cada columna; empieza por el texto visible
    addTaskFor: (dayLong: string): string => `Añadir tarea el ${dayLong}`,
  },
  form: {
    createTitle: 'Nueva tarea',
    title: 'Título',
    description: 'Descripción (opcional)',
    date: 'Fecha',
    counter: (length: number, max: number): string => `${String(length)}/${String(max)} caracteres`,
    create: 'Crear tarea',
    creating: 'Creando…',
    createdOutsideWeek: (dayLong: string): string => `Tarea creada para el ${dayLong}.`,
  },
  validation: {
    titleRequired: 'Escribe un título.',
    titleTooLong: 'El título no puede tener más de 200 caracteres.',
    descriptionTooLong: 'La descripción no puede tener más de 1000 caracteres.',
    dateRequired: 'Elige una fecha.',
    dateInvalid: 'Elige una fecha válida.',
    datePast: 'Elige hoy o un día posterior.',
  },
  status: {
    pending: 'Pendiente',
    completed: 'Completada',
  },
};
