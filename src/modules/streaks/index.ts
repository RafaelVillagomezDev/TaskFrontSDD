// API pública del módulo streaks: lo único que otros módulos y shared/ pueden importar (CONSTITUTION.md VI.4)
export { StreakPanel } from './components/streak-panel.component';
export { useStreakPanel } from './hooks/use-streak-panel.hook';
export { streaksApi } from './api/streaks.api';
export { streakSchema, type Streak } from './schemas/streak.schema';
export type { TodayProgress } from './types/streak.types';
