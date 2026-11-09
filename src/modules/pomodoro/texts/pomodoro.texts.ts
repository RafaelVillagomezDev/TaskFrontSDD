import { MINUTES_PER_HOUR, SECONDS_PER_MINUTE } from '../schemas/pomodoro.constants';

// Duración de concentración: «45 min» o «1 h 5 min» (minutos enteros hacia abajo, como API-004 RF-65)
export function focusDuration(seconds: number): string {
  const totalMinutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return hours === 0 ? `${String(minutes)} min` : `${String(hours)} h ${String(minutes)} min`;
}

// «Queda 1 minuto» o «Quedan N minutos», con el verbo concordando (redondeado hacia arriba: con 30 s, 1 minuto)
function remainingText(minutes: number): string {
  return minutes === 1 ? 'Queda 1 minuto' : `Quedan ${String(minutes)} minutos`;
}

// Textos visibles del pomodoro (spec 003; 001 RNF-01: siempre en español)
export const POMODORO_TEXTS = {
  layout: {
    title: 'Pomodoro',
    // Subnavegación de la sección (RF-51)
    sections: 'Secciones del pomodoro',
    session: 'Sesión',
  },
  // Formulario de empezar una sesión (RF-06 a RF-14)
  start: {
    title: 'Nueva sesión',
    form: 'Empezar una sesión',
    duration: 'Duración',
    preset: (minutes: number): string => `${String(minutes)} min`,
    custom: 'Otra',
    customMinutes: 'Minutos',
    customHelp: 'Entre 1 y 120 minutos.',
    tasks: 'Tareas de la sesión',
    tasksHelp: 'Opcional. Puedes empezar sin tareas y añadirlas después.',
    submit: 'Empezar sesión',
    submitting: 'Empezando…',
  },
  // Filas de tareas nuevas, al empezar y al añadir (RF-08 a RF-13)
  newTask: {
    legend: (position: number): string => `Tarea ${String(position)}`,
    title: 'Título',
    description: 'Descripción (opcional)',
    date: 'Fecha',
    add: 'Añadir tarea',
    remove: (position: number): string => `Quitar la tarea ${String(position)}`,
    limitReached: 'Has llegado al máximo de 20 tareas por sesión.',
  },
  // Sesión activa (RF-05, RF-20, RF-21)
  session: {
    region: 'Sesión en marcha',
    running: 'Sesión en curso',
    paused: 'Sesión en pausa',
    summary: (done: number, total: number): string => `${String(done)} de ${String(total)} tareas hechas`,
    tasks: 'Tareas de la sesión',
    noTasks: 'Esta sesión no tiene tareas.',
    timeLeft: 'Tiempo restante',
    mute: 'Silenciar el aviso de fin',
    controls: 'Controles de la sesión',
    pause: 'Pausar',
    resume: 'Reanudar',
    finish: 'Terminar',
    complete: (title: string): string => `Completar «${title}»`,
  },
  // Añadir y quitar tareas de la sesión activa (RF-29 a RF-31)
  add: {
    open: 'Añadir tareas',
    title: 'Añadir tareas a la sesión',
    submit: 'Añadir',
    submitting: 'Añadiendo…',
    remove: (title: string): string => `Quitar «${title}» de la sesión`,
  },
  // Tareas en espera (RF-12, RF-32 a RF-37)
  waiting: {
    title: 'Tareas en espera',
    list: 'Tareas en espera',
    help: 'Las tareas que no terminaste en una sesión. Puedes incluirlas en otra, corregirlas o borrarlas.',
    pick: 'Incluir tareas en espera',
    date: (day: string): string => `Para el ${day}`,
    takesToday: 'Tomará la fecha de hoy',
    edit: (title: string): string => `Editar «${title}»`,
    delete: (title: string): string => `Borrar «${title}»`,
    total: (count: number): string => (count === 1 ? '1 tarea en espera' : `${String(count)} tareas en espera`),
  },
  // Editar una tarea (RF-35, RF-36)
  edit: {
    title: 'Editar tarea',
    taskTitle: 'Título',
    description: 'Descripción (opcional)',
    dateFixed: 'La fecha de una tarea del pomodoro no se puede cambiar.',
    save: 'Guardar',
    saving: 'Guardando…',
  },
  // Resultado de una sesión terminada (RF-27, RF-28, RF-71)
  result: {
    region: 'Resultado de la sesión',
    title: 'Sesión terminada',
    byTime: 'Terminada por tiempo',
    manual: 'Terminada a mano',
    focus: (duration: string): string => `${duration} de concentración`,
    completed: 'Completadas',
    pending: 'Pendientes',
    pendingMoved: 'Han pasado a tus tareas en espera: puedes incluirlas en otra sesión.',
    startAnother: 'Empezar otra sesión',
    loading: 'Cargando el resultado…',
  },
  // Confirmaciones (RF-26, RF-33)
  confirm: {
    finish: {
      title: '¿Terminar la sesión?',
      body: (): string =>
        'La sesión se cerrará ahora. Las tareas que no hayas completado pasarán a tus tareas en espera.',
      confirm: 'Terminar sesión',
    },
    deleteTask: {
      title: '¿Borrar la tarea?',
      body: (title: string): string => `Se borrará «${title}» de tus tareas en espera. No se puede deshacer.`,
      confirm: 'Borrar tarea',
    },
  },
  // Título de la pestaña (RF-57 a RF-59)
  tabTitle: {
    running: (clock: string): string => `${clock} · Pomodoro`,
    paused: (clock: string): string => `En pausa ${clock} · Pomodoro`,
    ended: '¡Sesión terminada! · Pomodoro',
  },
  // Anuncios para lectores de pantalla (RF-63 a RF-66, RNF-02)
  announce: {
    started: (minutes: number): string => `Sesión empezada. ${remainingText(minutes)}.`,
    paused: (minutes: number): string => `Sesión en pausa. ${remainingText(minutes)}.`,
    resumed: (minutes: number): string => `Sesión reanudada. ${remainingText(minutes)}.`,
    fiveMinutes: 'Quedan 5 minutos.',
    oneMinute: 'Queda 1 minuto.',
    ended: 'La sesión ha terminado.',
  },
  // Errores bajo los campos (RF-07, RF-13); los de título, descripción y fecha son los de la 001
  validation: {
    durationRequired: 'Elige una duración.',
    minutesRequired: 'Escribe los minutos.',
    minutesInteger: 'Escribe un número entero de minutos.',
    minutesRange: 'Elige entre 1 y 120 minutos.',
    tooManyTasks: 'Una sesión puede tener como máximo 20 tareas.',
    atLeastOneTask: 'Añade al menos una tarea.',
  },
};
