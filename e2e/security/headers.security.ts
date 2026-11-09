import { existsSync, readFileSync } from 'node:fs';

import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';

// Servidor web de producción (spec 004 RF-09 a RF-25, CE-04, CE-05): pre y pro de docker-compose.dev.yml (perfil
// security). A pro se le envía lo que manda el proxy de Dokploy: el dominio en Host y el protocolo en X-Forwarded-Proto
const PRE = 'http://localhost:8081';
const PRO = 'http://localhost:8082';
const DOMAIN = 'kompitu.yandrydev.cloud';
const VIA_HTTPS = { Host: DOMAIN, 'X-Forwarded-Proto': 'https' };

const HSTS = 'max-age=63072000; includeSubDomains';
const BLOCKED_FEATURES = ['camera', 'microphone', 'geolocation', 'payment', 'usb', 'bluetooth', 'display-capture'];
const BURST = 150;
const TOO_MANY_REQUESTS = 429;
// Registro de accesos de pre en fichero, solo en este entorno (docker-compose.dev.yml, plan D-11)
const ACCESS_LOG = '.nginx-logs/access.log';

function accessLog(): string {
  return existsSync(ACCESS_LOG) ? readFileSync(ACCESS_LOG, 'utf8') : '';
}

// Directivas de la política de contenido: «default-src 'self'; …» → { 'default-src': ["'self'"], … }
function cspDirectives(response: APIResponse): Map<string, string[]> {
  const policy = response.headers()['content-security-policy'] ?? '';
  return new Map(
    policy
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name !== undefined && name !== '')
      .map(([name = '', ...values]) => [name, values]),
  );
}

// Primer fichero JS de la app, para comprobar también las cabeceras de /assets/
async function firstAsset(request: APIRequestContext, base: string, headers = {}): Promise<string> {
  const html = await (await request.get(`${base}/`, { headers })).text();
  const match = /src="(\/assets\/[^"]+\.js)"/.exec(html);
  if (match?.[1] === undefined) throw new Error('index.html no enlaza ningún JS de /assets/');
  return match[1];
}

function expectSecurityHeaders(response: APIResponse, apiOrigin: string): void {
  const headers = response.headers();
  const csp = cspDirectives(response);
  // RF-12: API, Google Fonts, sin iframes en ningún sentido, sin plugins y con Trusted Types
  expect(csp.get('default-src')).toEqual(["'self'"]);
  expect(csp.get('script-src')).toEqual(["'self'"]);
  expect(csp.get('connect-src')).toEqual(["'self'", apiOrigin]);
  expect(csp.get('style-src')).toEqual(["'self'", 'https://fonts.googleapis.com']);
  expect(csp.get('font-src')).toEqual(["'self'", 'https://fonts.gstatic.com']);
  expect(csp.get('frame-src')).toEqual(["'none'"]);
  expect(csp.get('child-src')).toEqual(["'none'"]);
  expect(csp.get('frame-ancestors')).toEqual(["'none'"]);
  expect(csp.get('object-src')).toEqual(["'none'"]);
  expect(csp.get('require-trusted-types-for')).toEqual(["'script'"]);
  // RF-09: capacidades del navegador desactivadas
  for (const feature of BLOCKED_FEATURES) expect(headers['permissions-policy']).toContain(`${feature}=()`);
  // RF-10, RF-11 y RF-15
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['cross-origin-resource-policy']).toBe('same-origin');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-frame-options']).toBe('DENY');
  // RF-13: sin la versión de Nginx
  expect(headers.server).toBe('nginx');
}

test.describe('HU-04 (004): cabeceras de seguridad', () => {
  test('RF-09 a RF-13, RF-15 y RF-18: pre envía todas las cabeceras en la app y en sus recursos, sin HSTS', async ({
    request,
  }) => {
    for (const path of ['/', '/pomodoro/history', await firstAsset(request, PRE)]) {
      const response = await request.get(`${PRE}${path}`);
      expect(response.status(), path).toBe(200);
      expectSecurityHeaders(response, 'http://localhost:3000');
      expect(response.headers()['strict-transport-security'], path).toBeUndefined();
    }
  });

  test('RF-09 a RF-15: pro por HTTPS envía las mismas cabeceras, más HSTS, en la app y en sus recursos', async ({
    request,
  }) => {
    for (const path of ['/', await firstAsset(request, PRO, VIA_HTTPS)]) {
      const response = await request.get(`${PRO}${path}`, { headers: VIA_HTTPS });
      expect(response.status(), path).toBe(200);
      expectSecurityHeaders(response, 'https://apikompitu.yandrydev.cloud');
      expect(response.headers()['strict-transport-security'], path).toBe(HSTS);
    }
  });
});

test.describe('HU-04 (004): solo HTTPS y solo el dominio de la aplicación', () => {
  test('RF-16: lo que llega por HTTP, o sin indicar el protocolo, se redirige a HTTPS con su ruta y su búsqueda', async ({
    request,
  }) => {
    for (const headers of [{ Host: DOMAIN, 'X-Forwarded-Proto': 'http' }, { Host: DOMAIN }]) {
      const response = await request.get(`${PRO}/pomodoro/history?page=2`, { headers, maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(response.headers().location).toBe(`https://${DOMAIN}/pomodoro/history?page=2`);
    }
  });

  test('RF-17: una petición para otro dominio se descarta sin respuesta', async ({ request }) => {
    await expect(
      request.get(`${PRO}/`, { headers: { Host: 'otro.ejemplo.com', 'X-Forwarded-Proto': 'https' } }),
    ).rejects.toThrow();
  });
});

test.describe('HU-04 (004): proxy inverso de la aplicación', () => {
  test('RF-22: un método distinto de GET o HEAD recibe 405', async ({ request }) => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const response = await request.fetch(`${PRE}/`, { method });
      expect(response.status(), method).toBe(405);
    }
    expect((await request.head(`${PRE}/`)).status()).toBe(200);
  });

  test('RF-23: las rutas que buscan los escáneres responden 404 sin servir la aplicación', async ({ request }) => {
    for (const path of ['/.env', '/.git/config', '/wp-login.php', '/backup.sql', '/assets/index.js.map', '/config.yml']) {
      const response = await request.get(`${PRE}${path}`);
      expect(response.status(), path).toBe(404);
      expect(await response.text(), path).not.toContain('<div id="root">');
    }
  });

  test('RF-24: una cabecera desmesurada se rechaza', async ({ request }) => {
    const response = await request.get(`${PRE}/`, { headers: { 'X-Relleno': 'x'.repeat(9000) } });
    expect(response.status()).toBe(400);
  });

  test('RF-19 a RF-21 y CE-05: una ráfaga desde una IP recibe 429 en lo que sobra y otra IP sigue entrando', async ({
    request,
  }) => {
    const asset = await firstAsset(request, PRE);
    // La IP del cliente es la que indica el proxy (X-Forwarded-For), no la de la conexión (RF-19)
    const burst = await Promise.all(
      Array.from({ length: BURST }, () =>
        request.get(`${PRE}${asset}`, { headers: { 'X-Forwarded-For': '192.0.2.50' } }),
      ),
    );
    const statuses = burst.map((response) => response.status());
    expect(statuses).toContain(200);
    expect(statuses).toContain(TOO_MANY_REQUESTS);
    expect(statuses.every((status) => status === 200 || status === TOO_MANY_REQUESTS)).toBe(true);

    const other = await request.get(`${PRE}/`, { headers: { 'X-Forwarded-For': '192.0.2.51' } });
    expect(other.status()).toBe(200);
  });

  test('RF-19 y RF-25: cada petición queda registrada con la IP real del cliente, la ruta, el resultado y el navegador', async ({
    request,
  }) => {
    const path = `/registro-${crypto.randomUUID()}`;
    await request.get(`${PRE}${path}`, {
      headers: { 'X-Forwarded-For': '192.0.2.77', 'User-Agent': 'kompitu-e2e-registro' },
    });
    await expect
      .poll(() => accessLog().split('\n').find((line) => line.includes(path)))
      .toMatch(/^192\.0\.2\.77 \[[^\]]+\] "GET \/registro-[\w-]+ HTTP\/1\.1" 200 \d+ "kompitu-e2e-registro"/);
  });
});
