import { useActiveSession } from './use-active-session.hook';
import { useAddTasksForm } from './use-add-tasks-form.hook';
import { useEditPomodoroTask } from './use-edit-pomodoro-task.hook';
import { useSessionActions } from './use-session-actions.hook';
import { useSessionTimer } from './use-session-timer.hook';
import { useStartSessionForm } from './use-start-session-form.hook';
import { useWaitingTasks } from './use-waiting-tasks.hook';

// Estado de /pomodoro (plan §5.2): la vista (formulario, sesión activa o resultado), el temporizador con sus avisos,
// las acciones sobre la sesión, los formularios de empezar y añadir, y las tareas en espera con su edición. Empezar y reanudar preparan el sonido en el gesto del
// usuario (plan D-5) y se anuncian a los lectores de pantalla (RF-63)
export function usePomodoroSessionPage() {
  const active = useActiveSession();
  const timer = useSessionTimer(active);
  const session = active.view.kind === 'session' ? active.view.session : undefined;
  const actions = useSessionActions({
    session,
    primeSound: timer.sound.prime,
    announce: timer.announcer.announceAction,
    showResult: active.showResult,
  });
  const startForm = useStartSessionForm({
    onBeforeSubmit: timer.sound.prime,
    onStarted: (started) => {
      timer.announcer.announceAction('started', started.remainingSeconds);
    },
  });

  const addForm = useAddTasksForm(session);
  const waiting = useWaitingTasks();
  const editTask = useEditPomodoroTask();

  return {
    view: active.view,
    timer,
    actions,
    startForm,
    addForm,
    waiting,
    editTask,
    retry: active.retry,
    startAnother: active.clearResult,
  };
}
