// API pública del módulo tasks: lo único que otros módulos y shared/ pueden importar (CONSTITUTION.md VI.4)
export { BoardPage } from './pages/board.page';
export { tasksApi } from './api/tasks.api';
export { taskSchema, type Task } from './schemas/task.schema';
