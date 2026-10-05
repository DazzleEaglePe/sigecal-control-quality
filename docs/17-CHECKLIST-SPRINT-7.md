# 17 · CHECKLIST DE CIERRE TÉCNICO DEL SPRINT 7

**Fecha de corte:** 05/10/2026  
**Rama evaluada:** `feature/sprint-4-ui-foundation`  
**Objetivo:** registrar evidencia técnica de calidad y separar los pendientes
de campo y piloto que no pueden validarse desde el repositorio.

## 1. Dictamen

El Sprint 7 queda **apto para demostración y revisión técnica, con cierre
condicionado**. La implementación de PWA, aislamiento de caché, rendimiento de
listados y los recorridos de dominio tienen evidencia automatizada. El acceso
público obtuvo Lighthouse 100/100, pero eso no acredita WCAG AA de todas las
vistas. Aún falta la revisión manual integral de accesibilidad, la conformidad de
Nicolle y la evidencia breve de aceptación que exige la definición de terminado.

El piloto y el uso desde un teléfono de planta son validaciones posteriores con
personas reales; no pueden sustituirse por pruebas del repositorio ni declararse
realizadas desde este entorno.

## 2. Evidencia ejecutada

| Comprobación                                                | Resultado                                                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm run db:verify-seed`                                    | ✅ `users: 5`, `demoBatches: 5`, `demoResults: 8`, `demoSensorySessions: 1`, `demoSensoryPending: 1`, `demoNC: 2` |
| `npm run openapi:validate`                                  | ✅ Contrato OpenAPI válido                                                                                        |
| `npm run test:integration`                                  | ✅ 11 pruebas PostgreSQL en un contenedor desechable; el entorno de desarrollo no fue modificado                  |
| `npm run test`                                              | ✅ 258 pruebas generales aprobadas; 11 de integración se omiten allí porque tienen su comando aislado             |
| `npm run lint`, `npm run typecheck`, `npm run format:check` | ✅ Sin advertencias, errores ni diferencias de formato                                                            |
| `npm run build`                                             | ✅ API y frontend de producción compilados; PWA genera manifest, service worker y Workbox                         |
| `npm run openapi:validate`                                  | ✅ Contrato OpenAPI válido                                                                                        |
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
- [x] Rutas protegidas, RBAC, JWT en memoria y refresh token `httpOnly` están
      cubiertos por pruebas de autenticación e integración.
- [x] No se encontraron usos de SQL concatenado, `dangerouslySetInnerHTML` ni
      tokens de sesión en almacenamiento web.
- [ ] Lista de producción de `07-SEGURIDAD-AUTH.md`: corresponde al Sprint 8 y
      depende de secretos, dominio, HTTPS, backup y SMTP productivo. No se
      presenta como una verificación ya realizada.

## 5. Revisión manual pendiente para aceptación

- [ ] Recorrer todas las vistas con teclado y comprobar orden/foco visible.
- [ ] Medir contraste WCAG AA en todos los estados y componentes; Lighthouse
      100/100 solo cubrió el acceso público indicado arriba.
- [ ] Revisar estados de carga, vacío, error y éxito, y mensajes de error en
      cada flujo operativo.
- [ ] Nicolle confirma conformidad y registra la evidencia breve de aceptación.

Estas comprobaciones requieren una sesión manual con las vistas autenticadas;
las pruebas automatizadas actuales no demuestran por sí solas estos criterios.

## 6. Hallazgos y seguimiento

- [x] Se separó el bundle de entrada: React, UI, íconos y gráficos se cargan en
      fragmentos independientes; el paquete principal pasó de aproximadamente
      762 kB a 218 kB sin comprimir.
- [x] Los listados operativos son paginados en servidor y los índices del
      esquema Prisma cubren filtros y ordenamientos usados.
- [x] Se actualizaron dependencias transitivas compatibles (`fast-uri`,
      `ip-address`, `qs`) y Nodemailer a 10.0.14; el API de producción usa una
      instalación aislada sin Prisma CLI y reportó cero vulnerabilidades npm.
- [ ] `npm audit` del repositorio reporta cuatro hallazgos altos en Prisma CLI
      y dependencias transitivas (`@prisma/config`, `deepmerge-ts`, `mysql2`,
      `prisma`). La solución automática propone bajar a Prisma 6.19.3, un cambio
      mayor incompatible con el stack aprobado; no se aplicó. El CLI se excluye
      de la imagen API, pero sigue en desarrollo y en la imagen temporal de
      migraciones. Requiere seguimiento de dependencias antes del despliegue.

## 7. Pendiente antes del cierre integral/piloto

- [ ] Validar la PWA y las vistas autenticadas en un teléfono real de planta.
- [ ] Ejecutar el piloto con las personas y duración aprobadas por el asesor.
- [ ] Registrar incidencias y retroalimentación sin ampliar el alcance.
- [ ] Configurar producción: secretos distintos, HTTPS, SMTP autorizado,
      respaldo y desactivación de cuentas DEMO innecesarias.
- [ ] Aplicar pre-test, Anexo 4 y post-test según el diseño metodológico.

## 8. Conclusión

La versión es apta para revisión técnica y demostración con datos `DEMO`; lint,
tipos, formato, build, OpenAPI, las 258 pruebas generales y las 11 pruebas de
integración pasaron en este corte. El Sprint 7 **no se declara aceptado ni
cerrado integralmente** hasta completar la revisión manual de accesibilidad,
obtener la conformidad/evidencia de Nicolle y realizar las actividades de piloto
que correspondan. Tampoco debe afirmarse que está desplegado o que el piloto ya
se realizó.
