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
| `npm run test`                                              | ✅ 265 pruebas generales aprobadas; 11 de integración se omiten allí porque tienen su comando aislado             |
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

La agenda, las precondiciones y la ficha para registrar esa sesión están
preparadas en `19-GUIA-ONBOARDING-PILOTO.md`. La sesión no se ha realizado; el
piloto continúa condicionado a las aprobaciones metodológicas y a la
confirmación de los datos reales por Tacama.

Estas comprobaciones requieren una sesión manual con las vistas autenticadas;
las pruebas automatizadas actuales no demuestran por sí solas estos criterios.

En la revisión manual del 05/10/2026 se recorrieron por teclado los controles
de ingreso y recuperación de contraseña. Una medición puntual de texto sobre
superficies sólidas obtuvo ratios mínimos de 6.66:1 y 6.94:1 respectivamente;
no cubre gradientes, todos los estados ni el resto de las vistas. En activación
de cuenta se detectó que el enlace inválido no se anunciaba: se añadió
`role="alert"` y una prueba de regresión. También se hizo consistente el anuncio
de los mensajes con clase `form-error` en las vistas de dominio; su contenido y
contexto aún requieren revisión funcional manual. El separador de la barra
lateral se puede ajustar con flechas izquierda/derecha y Home/End, expone sus
límites por ARIA y conserva foco visible; tiene pruebas del componente, pero
esto no reemplaza recorrer todas las pantallas con teclado.

### Pasada manual adicional — formularios públicos (05/10/2026)

Se validó la interfaz local sin iniciar sesión ni enviar correo, cambiar
contraseñas o modificar datos:

| Vista                               | Evidencia observada                                                                                                                                                                                                                                                                                          | Alcance pendiente                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `/login`                            | Tab recorre correo, contraseña, mostrar contraseña, recuperación e ingreso. El foco del campo cambia visualmente (anillo verde). Al intentar enviar vacío, el correo recibe `aria-invalid="true"`, `aria-describedby="email-issue"` y foco; el texto asociado es “Ingrese el correo institucional asignado.” | No se probó respuesta con credenciales válidas/incorrectas para evitar bloqueos sin una cuenta vigente de QA confirmada. |
| `/recuperar-contrasena`             | Tab recorre correo, enviar instrucciones y volver al ingreso.                                                                                                                                                                                                                                                | No se envió una solicitud porque eso genera un correo y requiere una cuenta de prueba designada.                         |
| `/activar-cuenta` sin token         | El mensaje “El enlace no contiene un token válido.” está expuesto como `role="alert"`; el botón de activación permanece deshabilitado.                                                                                                                                                                       | Falta probar el flujo con token de invitación de prueba no expirado.                                                     |
| `/restablecer-contrasena` sin token | El mensaje “El enlace no contiene un token válido.” está expuesto como `role="alert"`; el botón para guardar permanece deshabilitado.                                                                                                                                                                        | Falta probar el flujo con token de recuperación de prueba no expirado.                                                   |

### Corrección de contraste en indicadores de foco (05/10/2026)

La revisión de estilos encontró indicadores translúcidos de solo 1.13:1 en el
campo de autenticación oscuro y hasta 1.77:1 en superficies claras para el
anillo global. Se sustituyeron por el token opaco `--ring` en controles,
formularios de acceso, campos administrativos, selectores, botones y
componentes UI. La regresión automatizada exige 3:1 para el foco frente a seis
superficies y 4.5:1 para 13 combinaciones de texto/estado en ambos temas; las
combinaciones actuales pasan. En navegador se verificó el estilo computado de
foco visible del campo y botones del login y de un campo de activación. Esta
comprobación protege los tokens compartidos, pero no reemplaza medir colores
locales, gradientes, componentes y estados de cada vista.

Esta pasada no completa la aceptación del Sprint 7: las vistas protegidas, sus
estados de carga/vacío/error/éxito y sus contrastes siguen sin revisión manual
integral. La siguiente sesión requiere que Nicolle ejecute el recorrido con una
cuenta de QA vigente en su entorno, o que se habilite una sesión de QA segura;
no se deben compartir contraseñas por el repositorio ni en esta documentación.

### Pasada autenticada en entorno desechable (05/10/2026)

Se levantaron API y web en puertos temporales contra PostgreSQL 16 desechable,
con migraciones y seed DEMO. No se usó ni modificó la base de desarrollo. Al
terminar la revisión se detuvieron los procesos temporales y se eliminó el
contenedor; la instancia local habitual de PostgreSQL, Mailpit y Vite no se
detuvo.

| Recorrido observado              | Resultado                                                                                                                         | Límite de esta evidencia                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login con `ADMIN`                | Acceso al tablero; inicio sin filtro DEMO muestra datos vacíos                                                                    | Cuenta y contraseña eran exclusivas de la base desechable; no guardar ni reutilizar credenciales                                                                                                                                |
| Tablero · Datos DEMO             | El botón activa `aria-pressed`, aparecen indicadores, gráficos y aviso visible de que los datos no sirven como pre-test/post-test | No valida por sí solo todos los filtros, roles ni periodos posibles                                                                                                                                                             |
| Lotes                            | Lista paginada con 5 lotes identificados como “Demostración” y filtros disponibles                                                | No se enviaron formularios ni se cambiaron registros                                                                                                                                                                            |
| Inspecciones                     | Lista con 10 registros, estados y filtros; vistas de listado y calendario disponibles                                             | Se observó el listado; no se recorrió cada detalle ni se cambió una inspección                                                                                                                                                  |
| Organoléptico                    | Una sesión de demostración; la pantalla compara perfiles de producto y no presenta puntajes de panelistas                         | No se inició ni guardó una nueva evaluación                                                                                                                                                                                     |
| Análisis fisicoquímico           | Filtros por parámetro, producto y etapa, y opción separada para incluir demostración                                              | No se ejecutó una consulta analítica                                                                                                                                                                                            |
| No conformidades                 | Dos registros DEMO con estados, severidad, responsables y filtros                                                                 | No se crearon ni editaron incidencias/acciones                                                                                                                                                                                  |
| Reportes                         | Tres formularios Excel muestran filtros y opción explícita de incluir DEMO                                                        | No se descargaron archivos en esta pasada                                                                                                                                                                                       |
| Usuarios · `ADMIN`               | Formulario y listado muestran cuentas, rol, área, verificación y acciones                                                         | No se creó, editó, restableció ni desactivó una cuenta                                                                                                                                                                          |
| Navegación · `OPERARIO`          | Se ocultan Usuarios y opciones de configuración; el tablero marca maestros como restringidos                                      | El acceso directo a `/usuarios` vuelve al tablero en la interfaz. La verificación de autorización del API queda respaldada por pruebas automatizadas, no se afirma que esta prueba de navegador haya ejercitado un `403` de API |
| Cambio de contraseña provisional | El sistema detuvo el primer inicio de Operario y solicitó definir una contraseña propia                                           | Se cerró sesión sin cambiar la contraseña temporal; comportamiento verificado sin completar la operación                                                                                                                        |

La pasada confirma datos de muestra y carga de módulos protegidos en un entorno
aislado, pero no constituye aceptación funcional completa: no se cubrieron todos
los estados por pantalla, contraste de cada componente, flujos de escritura ni
la revisión de Nicolle. La instancia temporal fue eliminada tras la revisión.

## 6. Hallazgos y seguimiento

- [x] Se separó el bundle de entrada: React, UI, íconos y gráficos se cargan en
      fragmentos independientes; el paquete principal pasó de aproximadamente
      762 kB a 218 kB sin comprimir.
- [x] Los listados operativos son paginados en servidor y los índices del
      esquema Prisma cubren filtros y ordenamientos usados.
- [x] Se actualizaron dependencias transitivas compatibles (`fast-uri`,
      `ip-address`, `qs`) y Nodemailer a 10.0.14; el API de producción usa una
      instalación aislada sin Prisma CLI y reportó cero vulnerabilidades npm.
- [x] Deuda del CLI resuelta sin cambio mayor: Prisma 7.9.1 se conserva como
      herramienta de desarrollo en la raíz del monorepo; overrides fijan
      `deepmerge-ts` 8.0.0 y `mysql2` 3.24.5. `npm ls` confirma las versiones
      instaladas y `npm audit` reporta cero vulnerabilidades en este corte.
      `db:validate`, build, pruebas unitarias e integración PostgreSQL aislada
      pasaron con esta resolución. Revalidar dependencias antes del despliegue.

## 7. Pendiente antes del cierre integral/piloto

- [ ] Validar la PWA y las vistas autenticadas en un teléfono real de planta.
- [ ] Ejecutar el piloto con las personas y duración aprobadas por el asesor.
- [ ] Registrar incidencias y retroalimentación sin ampliar el alcance.
- [ ] Configurar producción: secretos distintos, HTTPS, SMTP autorizado,
      respaldo y desactivación de cuentas DEMO innecesarias.
- [ ] Aplicar pre-test, Anexo 4 y post-test según el diseño metodológico.

## 8. Conclusión

La versión es apta para revisión técnica y demostración con datos `DEMO`; lint,
tipos, formato, build, OpenAPI, las 265 pruebas generales y las 11 pruebas de
integración pasaron en este corte. El Sprint 7 **no se declara aceptado ni
cerrado integralmente** hasta completar la revisión manual de accesibilidad,
obtener la conformidad/evidencia de Nicolle y realizar las actividades de piloto
que correspondan. Tampoco debe afirmarse que está desplegado o que el piloto ya
se realizó.
