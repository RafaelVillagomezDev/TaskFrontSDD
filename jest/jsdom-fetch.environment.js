import { TestEnvironment } from 'jest-environment-jsdom';

// jsdom sin fetch: RTK Query y los routers de datos de React Router necesitan fetch, Request, Response y Headers.
// Se toman de Node, junto con su AbortController (Request rechaza las señales de otro entorno),
// para que los tests usen el store real con un fetch simulado
export default class JsdomWithFetchEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    Object.assign(this.global, {
      fetch,
      Request,
      Response,
      Headers,
      AbortController,
      AbortSignal,
      TextEncoder,
      TextDecoder,
    });
  }
}
