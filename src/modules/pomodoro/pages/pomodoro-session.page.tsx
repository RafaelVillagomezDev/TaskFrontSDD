import { Pencil, Plus } from 'lucide-react';

import { Button } from '@shared/ui/button.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Icon } from '@shared/ui/icon.component';
import { Spinner } from '@shared/ui/spinner.component';
import { ActiveSession } from '../components/active-session.component';
import { AddTasksDialog } from '../components/add-tasks-dialog.component';
import { ConfirmPomodoroDialog } from '../components/confirm-pomodoro-dialog.component';
import { Countdown } from '../components/countdown.component';
import { EditPomodoroTaskDialog } from '../components/edit-pomodoro-task-dialog.component';
import { SessionAnnouncements } from '../components/session-announcements.component';
import { SessionControls } from '../components/session-controls.component';
import { NewAchievementsNotice } from '../components/new-achievements-notice.component';
import { SessionResult } from '../components/session-result.component';
import { SessionTaskActions } from '../components/session-task-actions.component';
import { SessionTaskItem } from '../components/session-task-item.component';
import { SessionTaskList } from '../components/session-task-list.component';
import { StartSessionForm } from '../components/start-session-form.component';
import { WaitingTaskList } from '../components/waiting-task-list.component';
import { WaitingTaskPicker } from '../components/waiting-task-picker.component';
import { usePomodoroSessionPage } from '../hooks/use-pomodoro-session-page.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

// «Sesión» en /pomodoro (RF-04, RF-05, RF-52, RF-71, RF-72): la sesión activa con su cuenta atrás, el resultado de
// la que acaba de terminar o, si no hay ninguna, el formulario para empezar una
export function PomodoroSessionPage() {
  const page = usePomodoroSessionPage();
  const { view, timer, actions, startForm, addForm, waiting, editTask } = page;
  return (
    <>
      {view.kind === 'loading' && <Spinner />}
      {view.kind === 'error' && <ErrorMessage message={view.message} onRetry={page.retry} />}
      {view.kind === 'form' && (
        <StartSessionForm startForm={startForm}>
          <WaitingTaskPicker items={waiting.items} rows={startForm.rows} />
        </StartSessionForm>
      )}
      {view.kind === 'result' && (
        <SessionResult session={view.session} onStartAnother={page.startAnother}>
          <NewAchievementsNotice achievements={page.newAchievements} />
        </SessionResult>
      )}
      {view.kind === 'session' && (
        <ActiveSession session={view.session}>
          <Countdown seconds={timer.seconds} paused={view.session.status === 'paused'} />
          <SessionControls session={view.session} actions={actions} sound={timer.sound} />
          {actions.actionError !== undefined && (
            <ErrorMessage message={actions.actionError} onDismiss={actions.dismissError} />
          )}
          <SessionTaskList count={view.session.tasks.length}>
            {view.session.tasks.map((task) => (
              <SessionTaskItem
                key={task.id}
                task={task}
                saving={actions.savingTaskId === task.id}
                onToggle={(changed) => {
                  void actions.toggleTask(changed);
                }}
              >
                <SessionTaskActions
                  task={task}
                  onRemove={(removed) => {
                    void actions.removeTask(removed);
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={POMODORO_TEXTS.waiting.edit(task.title)}
                    onClick={() => {
                      editTask.open(task);
                    }}
                  >
                    <Icon icon={Pencil} />
                  </Button>
                </SessionTaskActions>
              </SessionTaskItem>
            ))}
          </SessionTaskList>
          {addForm.canOpen && (
            <Button variant="secondary" onClick={addForm.open} className="self-start">
              <Icon icon={Plus} />
              {POMODORO_TEXTS.add.open}
            </Button>
          )}
        </ActiveSession>
      )}
      {view.kind !== 'loading' && view.kind !== 'error' && <WaitingTaskList waiting={waiting} onEdit={editTask.open} />}
      <AddTasksDialog addForm={addForm}>
        <WaitingTaskPicker items={waiting.items} rows={addForm.rows} />
      </AddTasksDialog>
      <EditPomodoroTaskDialog editTask={editTask} />
      <ConfirmPomodoroDialog
        variant="deleteTask"
        open={waiting.pendingDelete !== undefined}
        busy={waiting.isDeleting}
        subject={waiting.pendingDelete?.title}
        onConfirm={() => {
          void waiting.confirmDelete();
        }}
        onCancel={waiting.cancelDelete}
      />
      <ConfirmPomodoroDialog
        variant="finish"
        open={actions.confirmingFinish}
        busy={actions.isChangingStatus}
        onConfirm={() => {
          void actions.confirmFinish();
        }}
        onCancel={actions.cancelFinish}
      />
      <SessionAnnouncements action={timer.announcer.actionMessage} timer={timer.timerMessage} />
    </>
  );
}
