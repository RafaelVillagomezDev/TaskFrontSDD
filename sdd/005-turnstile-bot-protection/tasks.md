# Tasks: Protección frente a bots con Cloudflare Turnstile en el acceso
Spec: `spec.md` (Implementada) · Plan: `plan.md` (Aprobado) · Fecha: 2026-11-15

- **Formato:** `- [ ] T### Descripción — archivo(s) (RF-xx)`.
- **Verificación de cada tarea con código:** `$DC exec web pnpm lint && $DC exec web pnpm typecheck && $DC exec web pnpm test`.
- **Al final:** E2E en los 6 proyectos y la suite `security` (T014, T015).

## Base

- [x] T001 Cambio de 004 RF-12 en su spec, aprobado por el usuario: script y marco de `https://challenges.cloudflare.com` — `sdd/004-front-security-hardening/spec.md` (RF-09)
- [x] T002 `VITE_TURNSTILE_SITE_KEY` obligatoria en la configuración, con la clave de prueba en el stub de Jest — `src/shared/config/env.schema.ts`, `jest/env.stub.ts` y sus tests (RF-11, RF-12)
- [x] T003 Códigos `TURNSTILE_FAILED` y `TURNSTILE_UNAVAILABLE` con sus mensajes, y `turnstileErrorMessage` — `src/shared/api/api-error.util.ts`, `src/shared/texts/errors.texts.ts`, `src/modules/auth/hooks/turnstile-error.util.ts` y tests (RF-08, RF-13, RF-14)
- [x] T004 Tipos de la API de Turnstile y de las peticiones de acceso — `src/modules/auth/types/turnstile.types.ts`, `src/modules/auth/types/auth-request.types.ts`, `src/modules/auth/api/auth.api.ts` (RF-01, RF-02, RF-07)

## Widget

- [x] T005 `isTurnstileApi` y `whenTurnstileReady` cancelable — `src/modules/auth/hooks/turnstile-api.util.ts` y test (RF-01, RF-06)
- [x] T006 Hook `useTurnstile(action)`: render, token, caducidad, error, `reset` y limpieza — `src/modules/auth/hooks/use-turnstile.hook.ts` y test, con el doble de Turnstile en `jest/fake-turnstile.ts` (RF-01 a RF-06, RNF-01, RNF-04)
- [x] T007 Componente `TurnstileField` y textos del widget — `src/modules/auth/components/turnstile-field.component.tsx`, `src/modules/auth/texts/auth.texts.ts` y test (RF-01, RF-03, RF-06, RNF-01, RNF-02)
- [x] T008 Script de Turnstile en `index.html` y widget en las páginas de acceso — `index.html`, `login.page.tsx`, `register.page.tsx` y sus tests (RF-01)

## Formularios

- [x] T009 `useLoginForm`: sin token no envía, `turnstileToken` en el cuerpo, `reset` tras cada envío y errores de Turnstile — `use-login-form.hook.ts` y test (RF-03, RF-05, RF-07, RF-08, RF-13 a RF-15)
- [x] T010 `useRegisterForm`: lo mismo — `use-register-form.hook.ts` y test (RF-03, RF-05, RF-07, RF-08, RF-13 a RF-15)

## E2E, servidor web y despliegue

- [x] T011 Token ficticio en los logins y registros por API de las fixtures, `waitForVerification()` en los page objects y specs de acceso actualizadas — `e2e/fixtures/api-client.ts`, `e2e/global-setup.ts`, `e2e/pages/login.po.ts`, `e2e/pages/register.po.ts`, specs de acceso (CE-02)
- [x] T012 CSP con `challenges.cloudflare.com` en `script-src`, `frame-src` y `child-src` — `nginx/security-headers.conf`, `e2e/security/headers.security.ts` (RF-09)
- [x] T013 Site key en el build y en los entornos, y README — `Dockerfile.prod`, `docker-compose.prod.yml`, `docker-compose.dev.yml`, `README.md` (RF-11, RF-12)
- [x] T014 Spec E2E de Turnstile en los 6 proyectos y consola sin infracciones en `pre` — `e2e/specs/turnstile.e2e.ts`, `e2e/security/csp-console.security.ts` (RF-01 a RF-10, RF-13 a RF-15, RNF-01, RNF-02)
- [x] T015 Cierre: suite completa (Jest, E2E en Chromium y Firefox, `security`), quality gate, cada RF con su test y spec a *Implementada* — `spec.md`, `README.md` (todos)

## Registro de cambios

- **2026-11-15** — Tareas T001 a T015 hechas. Ajustes durante la implementación, sin cambio de comportamiento:
  - `whenTurnstileReady` espera como máximo 10 s (`TURNSTILE_LOAD_TIMEOUT_MS`), para detectar un script asíncrono que falló antes de que la aplicación lo escuchara (RF-06).
  - El widget se pinta en el acto si la API ya está cargada.
  - Los page objects abren el acceso esperando a `domcontentloaded`, no a `load`.
  - `csp-console.security.ts` espera a `load` y a las fuentes en vez de `networkidle`, porque Turnstile mantiene sus propias peticiones.
