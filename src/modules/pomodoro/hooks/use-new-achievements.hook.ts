import { useCallback } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';

import { useAppDispatch } from '@shared/store/hooks';
import { pomodoroApi, useGetPomodoroAchievementsQuery } from '../api/pomodoro.api';
import type { Achievement } from '../schemas/pomodoro.schema';
import type { SessionView } from './use-active-session.hook';

// Entrada de caché con los logros del inicio de la sesión (plan D-11)
const BASELINE_REF = 'baseline';

const NONE: Achievement[] = [];

// Logros que han pasado a conseguidos durante la sesión (RF-45, RF-68 a RF-70, plan §4.6). La referencia se toma al
// empezar o al abrir la sección con la sesión activa, y se mantiene mientras se ve el resultado: nada invalida
// PomodoroAchievement durante la sesión. Al terminar se piden los logros con el id de la sesión como otra entrada y
// se comparan por código. Si esa consulta falla, no hay aviso ni error (RF-70)
export function useNewAchievements(view: SessionView) {
  const dispatch = useAppDispatch();
  const tracking = view.kind === 'session' || view.kind === 'result';
  const baseline = useGetPomodoroAchievementsQuery(tracking ? BASELINE_REF : skipToken);
  const atEnd = useGetPomodoroAchievementsQuery(view.kind === 'result' ? view.id : skipToken);

  const before = baseline.data;
  const after = atEnd.data;
  const unlocked =
    before === undefined || after === undefined
      ? NONE
      : after.filter(
          (achievement) =>
            achievement.unlocked && !before.some((previous) => previous.code === achievement.code && previous.unlocked),
        );

  // Al cerrar el resultado, «Logros» y la próxima referencia se vuelven a pedir (RF-68)
  const close = useCallback(() => {
    dispatch(pomodoroApi.util.invalidateTags(['PomodoroAchievement']));
  }, [dispatch]);

  return { unlocked, close };
}

export type NewAchievements = ReturnType<typeof useNewAchievements>;
