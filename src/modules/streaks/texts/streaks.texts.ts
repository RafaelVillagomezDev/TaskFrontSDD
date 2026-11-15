// Textos visibles del módulo de rachas (AGENTS.md §4: nunca escritos directamente en el JSX)
export const STREAKS_TEXTS = {
  panel: {
    region: 'Racha y progreso de hoy',
    current: 'Racha actual',
    best: 'Mejor racha',
    today: 'Hoy',
    days: (days: number): string => (days === 1 ? '1 día' : `${String(days)} días`),
    progress: (done: number, total: number): string => `${String(done)} de ${String(total)} tareas completadas`,
    noTasksToday: 'Sin tareas hoy',
    createTask: 'Crear una tarea',
    atRisk: 'Tu racha está en juego',
    atRiskDetail: 'Si hoy termina sin ninguna tarea completada, la perderás.',
  },
};
