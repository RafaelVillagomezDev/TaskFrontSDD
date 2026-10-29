import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter } from 'react-router';

import './index.css';
import { AppRoot } from './shared/router/app-root.component';
import { APP_ROUTES } from './shared/router/router';
import { store } from './shared/store/store';

// Punto de entrada (plan §6.1): el Provider de Redux y el router con las rutas de la aplicación
const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('index.html no contiene el elemento #root');
}

const router = createBrowserRouter(APP_ROUTES);

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <AppRoot router={router} />
    </Provider>
  </StrictMode>,
);
