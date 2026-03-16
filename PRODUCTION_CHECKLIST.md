# Production Checklist - Createam Platform

## Fase 0 - Bloqueantes de seguridad (antes de cualquier deploy)

- [ ] Rotar la service account previamente expuesta (Firebase Admin). (manual en GCP/Firebase)
- [ ] Revocar/rotar cualquier credencial publicada en historial, docs o backups. (manual en consola proveedor)
- [x] Confirmar que no existan secretos hardcodeados en codigo fuente versionado.
- [x] Mover secretos a variables de entorno seguras (VPS/CI/CD/hosting).
- [x] Verificar que archivos `.env*` sensibles no se versionen.

## Fase 1 - Control de acceso y permisos

- [ ] Proteger `/admin` con autenticacion real y control de rol.
- [ ] Evitar acciones administrativas directas desde cliente.
- [ ] Crear API server-side para operaciones criticas de tenants.
- [ ] Registrar auditoria basica (quien aprobo, cuando, desde donde).

## Fase 2 - Hardening de aplicacion

- [ ] Aplicar rate limiting en rutas sensibles (`/api/*`, auth, admin).
- [ ] Validar y sanitizar input de formularios y payloads.
- [ ] Validar ownership por tenant en operaciones de datos.
- [ ] Endurecer headers HTTP (CSP, HSTS, Referrer-Policy, etc).
- [ ] Revisar CORS y politicas por entorno.

## Fase 3 - Calidad y release gates

- [ ] Dejar `npm run lint` en verde.
- [ ] Agregar tests minimos (auth, tenant routing, admin actions).
- [ ] Definir pipeline CI/CD con gates (`lint`, `test`, `build`).
- [ ] Bloquear merge/deploy cuando fallen gates.

## Fase 4 - Operacion y observabilidad

- [ ] Integrar error tracking (por ejemplo, Sentry).
- [ ] Implementar logs estructurados y correlacion de request.
- [ ] Definir alertas de uptime, errores 5xx y latencia.
- [ ] Documentar runbook de incidentes y recovery.
- [ ] Probar backup/restore de configuracion critica.

## Fase 5 - Go-live

- [ ] Smoke test de dominio principal y subdominios. (script listo: `npm run smoke:prod -- -BaseUrl https://TU_DOMINIO`)
- [ ] Smoke test de flujo completo de registro y aprobacion.
- [ ] Prueba de tienda activa/inactiva y errores esperados.
- [ ] Prueba de rollback de deploy.
- [ ] Checklist legal/comercial (terminos, privacidad, facturacion).

## Estado de esta iteracion

- [x] Diagnostico tecnico inicial completo.
- [x] Inicio de remediacion implementado en codigo.
- [x] API admin protegida en servidor para listar/actualizar tenants.
- [x] Sesion admin httpOnly + guard server-side en /admin.
- [x] Ownership estricto en alta/edicion de productos tenant-admin.
- [x] Headers HTTP de seguridad reforzados en Next.js.
- [x] Settings tenant-admin migrado a API server-side protegida.
- [x] CRUD de categorias tenant-admin migrado a API server-side protegida.
- [x] CRUD de productos tenant-admin migrado a API server-side protegida.
- [x] Validacion de payload de productos endurecida en backend.
- [x] Auditoria de create/update/delete de productos en backend.
- [x] Validacion de payload de categorias endurecida en backend.
- [x] Auditoria de create/update/delete de categorias en backend.
- [x] Validacion de payload de settings endurecida en backend.
- [x] Auditoria de cambios de settings en backend.
- [x] Endpoint de consulta de auditoria para admin central con filtros.
- [x] Visualizacion de auditoria en panel admin.
- [x] Paginacion por cursor en consulta de auditoria.
- [x] Selector de acciones frecuentes en UI de auditoria.
- [x] Exportacion CSV de resultados de auditoria filtrados.
- [x] Saneamiento de claves hardcodeadas en scripts y documentacion versionada.
- [x] Configuracion ESLint no interactiva para ejecucion en CI.
- [x] Pipeline CI inicial con gates `lint:critical`, `build:ci` y `test --if-present`.
- [x] Despliegue continuo configurado en GitHub Actions hacia VPS con Docker Compose.
- [x] Script de readiness pre-release automatizado (`npm run ready:prod`).
- [x] Script de smoke test post-deploy automatizado (`npm run smoke:prod`).

## Bloqueo actual para salida a produccion

- [ ] Desplegar la version mas reciente (en `https://createam.cloud` el endpoint `/api/admin/audit` responde 404 en smoke test, indicando deploy desactualizado).
- [ ] Ejecutar rotacion/revocacion de credenciales en Firebase/GCP segun `SECURITY_ROTATION_RUNBOOK.md`.
