# 17 · CHECKLIST DE CIERRE TÉCNICO DEL SPRINT 7

**Fecha de corte:** 05/10/2026  
**Rama evaluada:** `feature/sprint-4-ui-foundation`  
**Objetivo:** registrar evidencia técnica de calidad y separar los pendientes
de campo y piloto que no pueden validarse desde el repositorio.

## 1. Dictamen

El Sprint 7 queda **cerrado técnicamente de forma condicionada**. La PWA,
seguridad de caché, rendimiento, accesibilidad del acceso público y recorridos
de dominio están verificados. No se considera cerrado para investigación hasta
que se realice uso real en móvil y el piloto controlado; esas actividades no se
sustituyen con pruebas automatizadas.

## 2. Evidencia ejecutada

| Comprobación                                                | Resultado                                                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm run db:verify-seed`                                    | ✅ `users: 5`, `demoBatches: 5`, `demoResults: 8`, `demoSensorySessions: 1`, `demoSensoryPending: 1`, `demoNC: 2` |
| `npm run openapi:validate`                                  | ✅ Contrato OpenAPI válido                                                                                        |
| `npm run test:integration`                                  | ✅ 11 pruebas PostgreSQL en un contenedor desechable; el entorno de desarrollo no fue modificado                  |
| `npm run test`                                              | ✅ 252 pruebas generales aprobadas; 11 de integración se omiten allí porque tienen su comando aislado             |
| `npm run lint`, `npm run typecheck`, `npm run format:check` | ✅ Sin advertencias, errores ni diferencias de formato                                                            |
| Build web PWA                                               | ✅ Manifiesto, `sw.js`, Workbox y recursos precacheados generados                                                 |
| Lighthouse sobre `http://localhost:5173/login`              | ✅ Accesibilidad **100/100**, sin hallazgos                                                                       |
| Servicios locales                                           | ✅ PostgreSQL, Mailpit, API y web disponibles después de migración y seed idempotente                             |

## 3. Flujos A, B y C

| Flujo               | Resultado esperado                                                                                     | Evidencia automatizada                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| A · Lote a NC       | El resultado no conforme genera NC automática, completa la inspección y conserva la trazabilidad       | `physchem.mutations.test.ts`, `physchem.service.test.ts`, `physchem.rules.test.ts`  |
| B · Ciclo de NC     | Una acción no eficaz bloquea el cierre, exige reemplazo y permite cerrar solo con acciones verificadas | `nonconformities.service.test.ts`, `sprint6-nc.integration.test.ts`                 |
| C · Avance de etapa | Solo se admite la siguiente etapa; se registra línea de tiempo, advertencias y auditoría               | `batches.lifecycle.test.ts`, `batches.mutations.test.ts`, `batches.service.test.ts` |

## 4. PWA, caché y seguridad

- [x] Manifiesto con identidad SIGECAL, modo `standalone` y botón de
      instalación cuando el navegador emite `beforeinstallprompt`.
- [x] Indicador persistente de desconexión; las operaciones de guardado no se
      presentan como disponibles fuera de línea.
- [x] Workbox solo precachea shell y recursos estáticos. Las respuestas de
      `/api` no se almacenan, por lo que no pueden aparecer datos operativos de
      un usuario en la sesión de otro.
- [x] Rutas protegidas, RBAC, JWT en memoria y refresh token `httpOnly` ya
      están cubiertos por pruebas de autenticación e integración.
- [x] No se encontraron usos de SQL concatenado, `dangerouslySetInnerHTML` ni
      tokens de sesión en almacenamiento web.
- [ ] Lista de producción de `07-SEGURIDAD-AUTH.md`: depende de secretos,
      dominio, HTTPS, backup y SMTP productivo del despliegue.

## 5. Hallazgos y seguimiento

- [x] Se separó el bundle de entrada: React, UI, íconos y gráficos se cargan en
      fragmentos independientes; el paquete principal pasó de aproximadamente
      762 kB a 218 kB sin comprimir.
- [x] Los listados operativos son paginados en servidor y los índices del
      esquema Prisma cubren filtros y ordenamientos usados.
- [ ] `npm audit --omit=dev` reporta 5 vulnerabilidades transitivas de Prisma y
      `qs`. La actualización automática propone un cambio mayor de Prisma; se
      tratará como actualización controlada en lugar de aplicarse a ciegas.

## 6. Pendiente externo antes del cierre académico

- [ ] Validar la PWA y las vistas autenticadas en un teléfono real de planta.
- [ ] Ejecutar el piloto con las personas y duración aprobadas por el asesor.
- [ ] Registrar incidencias y retroalimentación sin ampliar el alcance.
- [ ] Configurar producción: secretos distintos, HTTPS, SMTP autorizado,
      respaldo y desactivación de cuentas DEMO innecesarias.
- [ ] Aplicar pre-test, Anexo 4 y post-test según el diseño metodológico.

## 7. Conclusión

La versión es apta para iniciar la preparación del Sprint 8 y una demostración
con datos `DEMO`. No debe afirmarse que está desplegada ni que el piloto ya fue
realizado hasta contar con evidencia de esas actividades.
