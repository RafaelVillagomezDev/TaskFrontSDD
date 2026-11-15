import type { AlertType } from '../schemas/alert.schema';

// Textos visibles del módulo de avisos (AGENTS.md §4: nunca escritos directamente en el JSX)
export const ALERTS_TEXTS = {
  page: {
    title: 'Avisos',
    list: 'Lista de avisos',
    empty: 'Todavía no tienes avisos.',
    emptyDetail: 'A las 22:00, si te quedan tareas pendientes, aquí aparecerá un aviso con ellas.',
    total: (total: number): string => (total === 1 ? '1 aviso' : `${String(total)} avisos`),
  },
  type: {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
  } satisfies Record<AlertType, string>,
  item: {
    period: (from: string, to: string): string => `Del ${from} al ${to}`,
    createdAt: (day: string, time: string): string => `Generado el ${day} a las ${time}`,
    tasks: 'Tareas pendientes al generarse',
    tasksCount: (count: number): string => (count === 1 ? '1 tarea' : `${String(count)} tareas`),
    // RF-36: copia del momento del aviso
    snapshotNote: 'Así estaban al generarse el aviso: puede que las hayas completado o cambiado desde entonces.',
  },
  banner: {
    region: 'Aviso de hoy',
    title: (type: string): string => `Aviso ${type.toLowerCase()} de hoy`,
    tasks: (count: number): string => (count === 1 ? '1 tarea pendiente' : `${String(count)} tareas pendientes`),
    open: 'Ver aviso',
  },
};
