import { ROUTES } from './routes.constants';

// Origen ficticio para resolver la ruta como lo haría el navegador (plan 004 D-4): si al resolverla cambia de origen,
// no es una ruta de la aplicación
const BASE_URL = 'https://kompitu.invalid';
const BASE_ORIGIN = new URL(BASE_URL).origin;

// Caracteres de control (U+0000 a U+001F y U+007F): un salto de línea en la ruta no es una pantalla de la aplicación
const FIRST_PRINTABLE = 0x20;
const DELETE = 0x7f;

function hasUnsafeCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    // La barra invertida la trata el navegador como «/»: «/\ejemplo.com» sería otro dominio
    if (character === '\\' || code < FIRST_PRINTABLE || code === DELETE) return true;
  }
  return false;
}

// La ruta ya decodificada, para ver lo que esconde «/%5C…» o «/%2F%2F…»; undefined si no se puede decodificar
function decoded(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

// Pantalla a la que volver tras iniciar sesión (spec 004 RF-08, 001 RF-07): solo una ruta de la propia aplicación,
// con su búsqueda y su fragmento. Cualquier otro valor lleva al tablero, para que el enlace de vuelta no pueda mandar
// a otro sitio (redirección abierta)
export function safeReturnTo(value: string | null): string {
  if (value === null || !value.startsWith('/') || value.startsWith('//')) return ROUTES.board;
  const plain = decoded(value);
  if (plain === undefined || plain.startsWith('//') || hasUnsafeCharacter(value) || hasUnsafeCharacter(plain)) {
    return ROUTES.board;
  }
  const url = new URL(value, BASE_URL);
  if (url.origin !== BASE_ORIGIN) return ROUTES.board;
  return `${url.pathname}${url.search}${url.hash}`;
}
