# 09 · PLAN DE DESARROLLO

Ocho sprints quincenales, alineados al cronograma comprometido en la propuesta COT-2026-VT-001.

## Puerta de entrada antes del Sprint 1

No es un sprint adicional ni genera funcionalidad. Estas decisiones sí bloquean el inicio del código:

- [x] Stack y decisiones de arquitectura revisados.
- [x] Modelo de variedades, estándares, seguridad y datos de demostración corregido.
- [x] Se autoriza iniciar con datos `DEMO` provisionales, incapaces de evaluar lotes reales.

## Puerta de investigación antes del piloto

Estas tareas no bloquean los primeros sprints, pero sí la entrega de credenciales a los 15 participantes:

- [ ] Tesista y asesor validan las correcciones metodológicas del documento de tesis.
- [ ] Tesista define participantes, prueba estadística, nivel de significancia y duración del piloto.
- [ ] Tesista aplica el pre-test del Anexo 5 y conserva evidencia de fecha.
- [ ] Empresa confirma áreas, parámetros, rangos, umbrales sensoriales e instrumentos reales.

---

## Calendario

| Sprint | Periodo          | Foco             | Entregable de cierre                                    |
| ------ | ---------------- | ---------------- | ------------------------------------------------------- |
| 1      | Set. 1ª quincena | Cimientos        | Proyecto operativo, esquema y datos iniciales           |
| 2      | Set. 2ª quincena | M1 + M2          | Autenticación, usuarios, maestros y estándares          |
| 3      | Oct. 1ª quincena | M3               | Lotes, línea de tiempo y QR                             |
| 4      | Oct. 2ª quincena | M4 + M5          | Inspecciones y análisis fisicoquímico                   |
| 5      | Nov. 1ª quincena | M6               | Evaluación organoléptica                                |
| 6      | Nov. 2ª quincena | M7 + M8          | No conformidades, reportes, tablero y versión piloto    |
| 7      | Dic. 1ª quincena | Calidad + piloto | PWA, accesibilidad, uso controlado y correcciones       |
| 8      | Dic. 2ª quincena | Entrega          | Producción, post-test, datos de demostración y traspaso |

**Hito de pago:** cuotas al inicio y al cierre de los sprints 2, 4 y 8.

---

## Sprint 1 · Cimientos

**Objetivo:** que cualquiera pueda clonar el repositorio y tenerlo funcionando con un comando.

El orden operativo, las comprobaciones y los criterios detallados están en `10-CHECKLIST-SPRINT-1.md`.

- [x] Monorepo con `apps/api`, `apps/web`, `packages/shared`
- [x] Git inicializado con `main` y `develop`; `AGENTS.md` permanece en la raíz
- [x] Node.js 24 LTS, Express 5, Prisma 7, React 19.2, Vite 8.1 y Tailwind CSS 4.3 fijados en el archivo de bloqueo
- [x] TypeScript en modo estricto, ESLint y Prettier en ambas aplicaciones
- [x] `docker-compose.yml` con PostgreSQL 16
- [x] Esquema de Prisma completo según `05-MODELO-DATOS.md`
- [x] Migración inicial aplicada
- [x] Script de datos iniciales: usuarios, maestros, parámetros y estándares provisionales
- [x] Express configurado: Helmet, CORS, límite de cuerpo, manejador de errores, ruta de salud
- [x] Jerarquía de errores y formato uniforme de respuesta
- [x] React con Vite, Tailwind, enrutador y disposición base (barra lateral y superior)
- [x] Cliente HTTP centralizado sobre `fetch`; la renovación de sesión se incorpora en Sprint 2
- [x] Contrato `docs/openapi.yaml` generado desde esquemas Zod para las rutas del sprint
- [x] `.env.example` documentado
- [x] `README.md` con instrucciones de arranque
- [x] Script raíz `npm run dev` que levanta PostgreSQL, API y web desde una sola orden

**Criterio de cierre:** después de copiar `.env.example`, `npm run dev` levanta base, API y web; la base contiene datos iniciales identificados como demostración y el contrato OpenAPI valida.

---

## Sprint 2 · Seguridad y maestros (M1 + M2)

- [x] Ingreso, salida, renovación y consulta de sesión
- [x] Rotación de token de refresco y revocación en cadena
- [x] Bloqueo por intentos fallidos
- [x] Middleware de autenticación, autorización y validación
- [x] Gestión de usuarios (RF-M1-04 a RF-M1-09)
- [x] Cambio obligatorio de contraseña provisional y catálogo mínimo de áreas
- [x] Maestros: variedades, tipos de pisco, etapas, equipos, atributos sensoriales
- [x] Parámetros y estándares con versionado por vigencia
- [x] Umbrales sensoriales versionados y reglas contra solapamiento
- [x] Servicio de resolución de estándar vigente por fecha (RF-M2-06)
- [x] Baja lógica con verificación de uso (RF-M2-12)
- [x] Auditoría transaccional operativa
- [x] Pantallas: ingreso, usuarios, configuración de maestros, parámetros y estándares
- [x] Pruebas unitarias: resolución de estándar vigente, validación de permisos

**Criterio de cierre:** los cuatro roles ingresan y ven exactamente lo que les corresponde; un estándar puede versionarse y el sistema resuelve correctamente cuál aplica a una fecha dada.

### Estabilización Sprint 2.1 · Cuentas internas

El orden y la evidencia se registran en `16-CHECKLIST-SPRINT-2-1.md`.

- [x] Restringir todas las rutas de gestión de usuarios al rol `ADMIN`.
- [x] Completar edición, filtros, paginación y acciones administrativas en la interfaz.
- [x] Incorporar invitación y verificación del correo institucional.
- [x] Incorporar recuperación segura de contraseña por autoservicio y por `ADMIN`.
- [x] Integrar Mailpit como transporte SMTP exclusivo de desarrollo.
- [x] Exponer el cambio voluntario de contraseña desde la sesión.
- [x] Validar tokens de un solo uso, expiración, revocación y no enumeración.

**Criterio de cierre:** el administrador crea una cuenta sin comunicar una
contraseña; el usuario la activa desde el correo, puede recuperar el acceso y
ningún rol distinto de `ADMIN` consulta ni modifica el directorio completo.

---

## Sprint 3 · Lotes y trazabilidad (M3)

- [x] Registro, edición y listado de lotes con filtros y paginación
- [x] Composición de variedades: Puro con una y Acholado con al menos dos
- [x] Generación automática del código `LT-AAAA-NNNN`
- [x] Avance de etapa con validación de secuencia (RF-M3-04)
- [x] Registro de etapas del lote (línea de tiempo)
- [x] Extremo de línea de tiempo consolidada
- [x] Cierre de lote con verificación de no conformidades abiertas
- [x] Generación de QR
- [x] Ficha de trazabilidad
- [x] Pantallas: listado, alta y detalle de lote con sus pestañas
- [x] Componente de línea de tiempo
- [x] Pruebas unitarias: validación de secuencia de etapas, generación de código

**Criterio de cierre:** un lote recorre las 6 etapas y su línea de tiempo refleja fielmente el recorrido.

---

## Sprint 4 · Inspecciones y análisis (M4 + M5)

Sprint más denso. Es el corazón funcional del sistema.

El orden operativo, las comprobaciones y los criterios detallados están en `13-CHECKLIST-SPRINT-4.md`.

- [x] Programación, reprogramación y cancelación de inspecciones con motivo
- [x] Selección de parámetros por inspección
- [x] Plantillas versionadas y generación del plan de inspecciones por lote
- [x] Vistas de calendario y de listado con filtros
- [x] Panel "mis inspecciones pendientes"
- [x] Tarea programada de marcado de vencidas
- [x] Reporte de cobertura por etapa
- [x] Registro de resultados con validación contra estándar
- [x] Bloqueo definitivo cuando falta estándar o cuando es provisional para un lote real
- [x] Extremo de previsualización de conformidad sin guardar
- [x] Generación automática de no conformidad ante resultado no conforme
- [x] Inmutabilidad y anulación con reemplazo (ADR-004)
- [x] Anulación/reemplazo transaccional de la no conformidad automática asociada
- [x] Completado automático de la inspección
- [x] Histórico por parámetro
- [x] Gráfico de control con límites ±3σ
- [x] Pantallas: calendario, programación, ejecución de inspección, gráfico de control
- [x] Pruebas unitarias: conformidad en los bordes del rango, transiciones de estado, cálculo de límites de control

**Criterio de cierre:** un valor fuera de rango genera automáticamente una no conformidad, y el resultado guardado no puede alterarse.

---

## Sprint 5 · Evaluación organoléptica (M6)

- [x] Registro de sesión sensorial con panelistas
- [x] Matriz de calificación por atributo y panelista
- [x] Cálculo de promedios por atributo y general
- [x] Umbral configurable y determinación de conformidad
- [x] Resolución del umbral en servidor; el formulario solo lo consulta
- [x] Generación automática de no conformidad
- [x] Corrección de sesión por nueva versión, sin edición destructiva
- [x] Perfil sensorial en gráfico radial
- [x] Comparación de perfiles entre lotes
- [x] Pantallas: alta y detalle de sesión, comparador
- [x] Pruebas unitarias: cálculo de promedios, aplicación del umbral

**Verificación obligatoria del sprint:** confirmar que no existe ninguna consulta, vista ni extremo que agregue, promedie o compare panelistas entre sí.

**Cierre:** completado el 31/08/2026. Evidencia detallada en
`15-CHECKLIST-SPRINT-5.md`.

---

## Sprint 6 · No conformidades y reportes (M7 + M8)

- [x] Registro manual y automático de no conformidades
- [x] Ciclo completo de estados
- [x] Registro de inicio de atención y cálculo de tiempos
- [x] Acciones correctivas: registro, asignación, ejecución
- [x] Verificación de eficacia con regla de verificador distinto del responsable
- [x] Bloqueo de cierre con acciones sin verificar
- [x] Retorno a tratamiento ante acción no eficaz
- [x] Selectores operativos de responsables sin exponer el directorio ADMIN
- [x] Revocación inmediata de sesiones al cambiar credenciales o permisos
- [x] Pruebas PostgreSQL aisladas de tokens, concurrencia y cierre
- [x] Notificaciones dentro de la aplicación
- [x] Tareas programadas de aviso
- [x] Tablero con todos los indicadores
- [x] Exclusión por defecto de datos `DEMO`
- [x] Reporte de trazabilidad en PDF
- [x] Exportaciones a Excel con filtros configurables
- [x] Pantallas: listado y detalle de no conformidad
- [x] Pantalla: tablero consolidado con filtros y gráficos
- [x] Pantallas: consulta y descarga de reportes
- [ ] Búsqueda global con permisos y alcance por pertenencia
- [ ] Despliegue de una versión piloto estable y entrega controlada de credenciales
- [x] Pruebas unitarias: cálculo de tiempos, reglas de cierre, transiciones
- [x] Pruebas de KPI: denominador cero, exclusión `DEMO`, inspección tardía, NC sin atención y corte mensual en `America/Lima`

**Criterio de cierre:** el ciclo completo funciona de extremo a extremo, incluido el caso de acción no eficaz, y existe una versión piloto estable para iniciar uso real.

---

## Sprint 7 · Calidad

- [ ] Configuración de PWA: manifiesto, service worker, caché de vistas de consulta
- [ ] Validación de uso en campo desde móvil como web responsiva/PWA; no aplicación nativa
- [ ] Indicador de estado sin conexión
- [ ] Auditoría de accesibilidad con Lighthouse y corrección de hallazgos
- [ ] Navegación completa por teclado verificada
- [ ] Revisión de contrastes
- [ ] Revisión de los cuatro estados en todas las vistas
- [ ] Revisión de todos los mensajes de error
- [ ] Índices de base de datos verificados
- [ ] Revisión de rendimiento de listados
- [ ] Lista de verificación de seguridad de `07`
- [ ] Corrección de la deuda técnica acumulada
- [ ] Pruebas de recorrido completo de los flujos A, B y C
- [ ] Sesión breve de onboarding operativo para participantes del piloto
- [ ] Registro de incidencias y retroalimentación del piloto sin cambiar el alcance
- [ ] Verificación de que datos de un usuario no aparecen en la caché de otro

**Criterio de cierre:** Lighthouse con accesibilidad ≥ 90; ninguna advertencia de ESLint; los tres flujos completos sin errores y participantes con uso real registrado.

---

## Sprint 8 · Entrega

- [ ] Despliegue del API y de la base de datos
- [ ] Despliegue del frontend
- [ ] Variables de entorno de producción
- [ ] HTTPS verificado
- [ ] Carga de datos de demostración: 5 lotes en distintas etapas, con historial suficiente para los gráficos de control
- [ ] Contraseñas iniciales cambiadas
- [ ] Respaldo de base de datos
- [ ] Traspaso del repositorio a la tesista
- [ ] Video de avance final
- [ ] Documento de despliegue y credenciales
- [ ] Verificación final contra la lista de los 45 ítems
- [ ] Aplicación del Anexo 4 y post-test del Anexo 5 después del periodo de uso aprobado por el asesor
- [ ] Exportación de evidencia operativa sin mezclar registros `DEMO`

**Criterio de cierre:** el sistema está accesible por enlace, con datos separados por origen, la tesista puede demostrarlo sin asistencia y la recolección post-test está documentada.

---

## Convenciones de trabajo

**Ramas**

```
main                    → estable, desplegable
develop                 → integración
feature/sprint-N-modulo → trabajo del sprint
```

**Mensajes de confirmación**

```
feat(batches): registro de avance de etapa con validación de secuencia
fix(physchem): corregir comparación decimal en el límite del rango
docs(api): documentar extremos de no conformidades
test(nc): pruebas de cálculo de tiempo de respuesta
refactor(masters): extraer resolución de estándar vigente a servicio
```

**Definición de terminado**

Una tarea está terminada cuando funciona de extremo a extremo, pasa ESLint sin advertencias, tiene pruebas si contiene lógica de negocio, respeta la separación de capas, no deja sentencias de depuración, y sus mensajes visibles están en español y son comprensibles.

---

## Verificación final: los 45 ítems

Antes del cierre del Sprint 8, recorrer los Anexos 4 y 5 y confirmar la evidencia definida en `01-ANALISIS-TESIS.md`: pantalla o cálculo para los 35 ítems directos, evidencia de apoyo para los 6 indirectos y responsable externo para los 4 organizacionales.

No se agregan funciones artificiales para “forzar” cobertura. Si un ítem organizacional sigue sin evidencia, se escala a la tesista y al asesor porque su resolución no corresponde al software.

---

## Pendientes fuera del desarrollo

| Tarea                                                                | Responsable             | Estado                                      |
| -------------------------------------------------------------------- | ----------------------- | ------------------------------------------- |
| Entrega de parámetros, rangos, umbrales, áreas e instrumentos reales | Tesista                 | ⏳ Pendiente; bloquea datos `REAL` y piloto |
| Corrección de las 15 inconsistencias del documento de tesis          | Tesista con su asesor   | ⏳ Pendiente                                |
| Decisión sobre el add-on de UML                                      | Tesista                 | ⏳ No aprobado                              |
| Aplicación del pre-test antes de entregar credenciales               | Tesista                 | ⏳ Antes del piloto                         |
| Definición de prueba estadística y duración del piloto               | Tesista con su asesor   | ⏳ Antes de recolectar datos                |
| Onboarding operativo mínimo para el piloto                           | Desarrollador + tesista | ⏳ Sprint 7, incluido como habilitador      |
| Manual y capacitación formal                                         | Add-on, no contratado   | ⏳ No aprobado                              |
