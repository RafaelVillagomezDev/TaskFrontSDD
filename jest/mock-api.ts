import { jest } from '@jest/globals';

// Respuestas con el sobre de TaskApiSDD para simular la API en los tests (fetch real de Node, sin red)
export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

export function apiOk(data: unknown, status = 200): Response {
  return jsonResponse(status, { success: true, status, message: 'ok', data });
}

export function apiFail(status: number, code: string, details?: { field: string; message: string }[]): Response {
  return jsonResponse(status, {
    success: false,
    status,
    error: { code, message: 'x', ...(details === undefined ? {} : { details }) },
  });
}

type Handler = (request: Request) => Response | Promise<Response>;

export interface MockedApi {
  requests: Request[];
  // Cuerpo JSON de la petición n-ésima a una ruta («POST /auth/login»)
  bodyOf: (route: string, index?: number) => Promise<unknown>;
}

function routeOf(request: Request): string {
  return `${request.method} ${new URL(request.url).pathname}`;
}

// Simula las rutas indicadas («GET /auth/csrf»: handler); el resto responde 404 ROUTE_NOT_FOUND
export function mockApi(handlers: Record<string, Handler>): MockedApi {
  const requests: Request[] = [];
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    requests.push(request.clone());
    const handler = handlers[routeOf(request)];
    return handler === undefined ? apiFail(404, 'ROUTE_NOT_FOUND') : handler(request);
  });
  return {
    requests,
    bodyOf: async (route, index = 0) => {
      const request = requests.filter((candidate) => routeOf(candidate) === route)[index];
      if (request === undefined) throw new Error(`No hubo petición ${route} número ${String(index)}`);
      const body: unknown = await request.json();
      return body;
    },
  };
}
