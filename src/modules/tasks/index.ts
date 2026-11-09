// API pública del módulo tasks: lo único que otros módulos y shared/ pueden importar (CONSTITUTION.md VI.4)
export { BoardPage } from './pages/board.page';
export { HistoryPage } from './pages/history.page';
export { TaskDayPage } from './pages/task-day.page';
export { tasksApi } from './api/tasks.api';
export { taskSchema, type Task } from './schemas/task.schema';
// Reglas de una tarea nueva (001 RF-46): el pomodoro las reutiliza porque API-004 RF-06 exige las mismas (003 plan D-9)
export { createTaskFormSchema, type TaskFormValues } from './schemas/task-form.schema';
export { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from './schemas/tasks.constants';
