import { useEffect, useRef, useState } from 'react';

import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { baseApi } from '../../../shared/api/base.api';
import { addDays, compareDays, dayRange } from '../../../shared/date/day.util';
import { useCurrentDay } from '../../../shared/date/use-current-day.hook';
import { useAppDispatch } from '../../../shared/store/hooks';
import type { TodayProgress } from '../../streaks';
import { useGetDayTasksQuery, useGetWeekTasksQuery } from '../api/tasks.api';
import type { Task } from '../schemas/task.schema';
import { WEEK_LENGTH } from '../schemas/tasks.constants';

// Pasado: solo lectura (RF-13); hoy: editable y se completa; futuro: editable sin completar (RF-22)
export type DayKind = 'past' | 'today' | 'future';

export interface DayColumnModel {
  day: string;
  kind: DayKind;
  pending: Task[];
  completed: Task[];
  total: number;
}

export type WeekBoardStatus = 'loading' | 'error' | 'ready';

const NO_TASKS: Task[] = [];

function dayKind(day: string, today: string): DayKind {
  const order = compareDays(day, today);
  if (order < 0) return 'past';
  return order === 0 ? 'today' : 'future';
}

// Una columna por día; cada una separa pendientes y completadas sin cambiar el orden de la API (RF-10)
function buildColumns(weekStart: string, today: string, tasks: Task[]): DayColumnModel[] {
  return dayRange(weekStart, WEEK_LENGTH).map((day) => {
    const ofDay = tasks.filter((task) => task.date === day);
    return {
      day,
      kind: dayKind(day, today),
      pending: ofDay.filter((task) => !task.completed),
      completed: ofDay.filter((task) => task.completed),
      total: ofDay.length,
    };
  });
}

// Al cambiar el día del dispositivo, las tareas y la racha de la caché ya no son las de hoy (RF-14, plan §5.3)
function useInvalidateOnDayChange(today: string): void {
  const dispatch = useAppDispatch();
  const previousDay = useRef(today);
  useEffect(() => {
    if (previousDay.current === today) return;
    previousDay.current = today;
    dispatch(baseApi.util.invalidateTags(['Task', 'Streak']));
  }, [today, dispatch]);
}

function progressOf(tasks: Task[]): TodayProgress {
  return { done: tasks.filter((task) => task.completed).length, total: tasks.length };
}

// Progreso de hoy para el panel de rachas (plan §5.5, RF-26). Si la semana visible empieza hoy, sale de su
// caché, que ya refleja al instante completar o desmarcar (CE-02); si no, se piden solo las tareas de hoy
function useTodayProgress(today: string, weekTasks: Task[] | undefined, isCurrentWeek: boolean) {
  const { currentData: dayTasks } = useGetDayTasksQuery(today, { skip: isCurrentWeek });
  const todayTasks = isCurrentWeek ? weekTasks?.filter((task) => task.date === today) : dayTasks;
  return todayTasks === undefined ? undefined : progressOf(todayTasks);
}

// Tablero semanal (plan §5.3): 7 días desde hoy y navegación de 7 en 7 (RF-09 a RF-14, RF-47, S-02).
// El estado es la distancia en semanas a hoy: al cambiar el día, el tablero sigue a hoy (casos límite de RF-14)
export function useWeekBoard() {
  const today = useCurrentDay();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(today, weekOffset * WEEK_LENGTH);
  useInvalidateOnDayChange(today);

  // currentData: solo las tareas de la semana pedida, nunca las de la anterior mientras carga (RF-40)
  const { currentData, error, isError, refetch } = useGetWeekTasksQuery(weekStart);
  const tasks = currentData ?? NO_TASKS;
  const isCurrentWeek = weekOffset === 0;
  const todayProgress = useTodayProgress(today, currentData, isCurrentWeek);
  let status: WeekBoardStatus = 'loading';
  if (currentData !== undefined) status = 'ready';
  else if (isError) status = 'error';

  return {
    today,
    weekStart,
    weekEnd: addDays(weekStart, WEEK_LENGTH - 1),
    isCurrentWeek,
    columns: buildColumns(weekStart, today, tasks),
    todayProgress,
    status,
    errorMessage: status === 'error' ? errorMessage(toApiError(error).code) : undefined,
    // El resultado del reintento llega por la propia consulta (status y columnas)
    retry: () => {
      void (async () => {
        await refetch();
      })();
    },
    goToPreviousWeek: () => {
      setWeekOffset((offset) => offset - 1);
    },
    goToNextWeek: () => {
      setWeekOffset((offset) => offset + 1);
    },
    // «Hoy» vuelve a la semana que empieza hoy (RF-47)
    goToToday: () => {
      setWeekOffset(0);
    },
  };
}
