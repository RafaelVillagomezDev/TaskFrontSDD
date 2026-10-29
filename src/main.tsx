import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';

// Punto de entrada: el Provider de Redux y el router se montan en T045
const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('index.html no contiene el elemento #root');
}

createRoot(rootElement).render(<StrictMode />);
