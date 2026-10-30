// API pública del módulo alerts: lo único que otros módulos y shared/ pueden importar (CONSTITUTION.md VI.4)
export { AlertsPage } from './pages/alerts.page';
export { TodaysAlertBanner } from './components/todays-alert-banner.component';
export { useTodaysAlert } from './hooks/use-todays-alert.hook';
export { alertsApi } from './api/alerts.api';
export { alertSchema, type Alert, type AlertType } from './schemas/alert.schema';
