// Matchers de DOM de Testing Library (toBeInTheDocument, toHaveAccessibleName…) en todos los tests
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// jsdom no trae TextEncoder ni TextDecoder, que React Router necesita; se toman de Node
Object.assign(globalThis, { TextEncoder, TextDecoder });
