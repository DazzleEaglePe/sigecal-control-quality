# 14 · CHECKLIST DE ENTREGA FUNCIONAL PARA NICOLLE

**Corte verificado:** 31/08/2026

**Rama evaluada:** `feature/sprint-4-ui-foundation`

**Propósito:** entregar una versión de avance demostrable y precisar qué parte
del alcance total ya está aprobada técnicamente.

## 1. Dictamen de entrega

SIGECAL está listo para una **revisión funcional de los Sprints 1 a 5**. La
versión incluye cimientos, seguridad y maestros, lotes y trazabilidad,
programación de inspecciones, análisis fisicoquímico y evaluación
organoléptica.

No corresponde presentarla aún como entrega final ni iniciar el piloto con datos
reales: los Sprints 6 a 8 siguen pendientes y los parámetros, rangos y umbrales
definitivos deben ser entregados y aprobados por la empresa.

## 2. Estado por sprint

| Sprint | Alcance                                                     | Estado                  | Apto para Nicolle                                                                             |
| ------ | ----------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| 1      | Monorepo, PostgreSQL, Prisma, API base, frontend y OpenAPI  | ✅ Cerrado técnicamente | Sí; queda pendiente únicamente la grabación breve de evidencia                                |
| 2      | Autenticación, RBAC, usuarios, áreas, maestros y estándares | ✅ Cerrado              | Sí, usando usuarios y datos de demostración                                                   |
| 3      | Lotes, seis etapas, QR y trazabilidad                       | ✅ Cerrado              | Sí; flujo funcional respaldado por pruebas y evidencia previa                                 |
| 4      | Inspecciones, estándares y resultados fisicoquímicos        | ✅ Cerrado              | Sí; flujo funcional respaldado por pruebas y evidencia previa                                 |
| 5      | Evaluación organoléptica                                    | ✅ Cerrado              | Sí; sesión, corrección inmutable, perfiles y comparación respaldados por pruebas              |
| 6      | Ciclo completo de NC, acciones, indicadores y reportes      | ⏳ Pendiente            | Solo existe la generación automática de NC desde M5 y su consulta en la trazabilidad del lote |
| 7      | PWA, accesibilidad, seguridad, rendimiento y piloto         | ⏳ Pendiente            | No disponible                                                                                 |
| 8      | Despliegue, post-test y entrega formal                      | ⏳ Pendiente            | No disponible                                                                                 |

## 3. Funcionalidades aceptadas

### Sprint 1 · Cimientos

- [x] El monorepo instala, compila y ejecuta API, web y contratos compartidos.
- [x] PostgreSQL 16 está saludable y Prisma valida el modelo.
- [x] La API aplica Helmet, CORS, límite de cuerpo y errores uniformes.
- [x] El frontend es responsivo, está en español y protege las rutas privadas.
- [x] OpenAPI valida y coincide con los contratos Zod.
- [x] El seed es idempotente y separa registros `DEMO` de `REAL`.
- [ ] Grabar la evidencia breve del sprint; no equivale al video formal del add-on.

### Sprint 2 · Seguridad y maestros

- [x] Ingreso, renovación, salida y consulta de sesión.
- [x] Cambio obligatorio de contraseña provisional.
- [x] Rotación y revocación del token de refresco.
- [x] Bloqueo por intentos fallidos y autorización por rol en el servidor.
- [x] Gestión de usuarios y catálogo mínimo de áreas.
- [x] Maestros, equipos, parámetros, estándares y umbrales versionados.
- [x] Baja lógica con bloqueo de elementos que ya tienen dependencias.
- [x] Auditoría sin contraseñas, tokens ni hashes.

### Sprint 3 · Lotes y trazabilidad

- [x] Listado, búsqueda, filtros y paginación.
- [x] Alta y edición de lote con reglas Puro/Acholado y suma porcentual.
- [x] Código automático `LT-AAAA-NNNN` sin colisiones.
- [x] Avance ordenado por las seis etapas, sin saltos.
- [x] Congelamiento de identidad del lote después de iniciar el recorrido.
- [x] Cierre bloqueado cuando existen no conformidades abiertas.
- [x] Rechazo y cierre restringidos a los roles autorizados.
- [x] Detalle, QR, línea de tiempo y ficha de trazabilidad.
- [x] Alcance de `OPERARIO` aplicado antes de paginar y contar.

### Sprint 4 · Inspecciones y análisis fisicoquímico

- [x] Programación, edición previa, inicio, reprogramación y cancelación.
- [x] Plantillas versionadas y plan completo de inspecciones por lote.
- [x] Listado, calendario, pendientes y cobertura por etapa.
- [x] Equipo operativo obligatorio antes de iniciar el análisis.
- [x] Resolución del estándar por parámetro, tipo, etapa y fecha programada.
- [x] Bloqueo de datos `REAL` sin estándar definitivo aplicable.
- [x] Previsualización de conformidad sin efectos secundarios.
- [x] Resumen explícito antes del guardado definitivo.
- [x] Resultados finales inmutables y corrección mediante nueva versión.
- [x] Generación transaccional de NC ante un resultado no conforme.
- [x] Enlace desde el resultado hacia la NC en la trazabilidad del lote.
- [x] Detalle consolidado con estándar, resultado vigente e historial.
- [x] Histórico por parámetro y gráfico de control con regla mínima de ocho mediciones.

### Sprint 5 · Evaluación organoléptica

- [x] Registro de sesiones desde inspecciones organolépticas en proceso.
- [x] Panelistas internos o externos conservados únicamente para trazabilidad.
- [x] Matriz completa de calificaciones de 1 a 5 por atributo del producto.
- [x] Promedios por atributo y general calculados en servidor y mostrados en vivo.
- [x] Umbral vigente resuelto en servidor; los provisionales bloquean datos `REAL`.
- [x] Generación transaccional de NC para sesiones no conformes.
- [x] Sesiones finales inmutables y corrección mediante una nueva versión enlazada.
- [x] Perfil radial y comparación de perfiles entre lotes.
- [x] Ausencia verificada de rankings, promedios o comparaciones de panelistas.

## 4. Evaluación funcional del corte actual

| Evaluación             | Resultado                                                   |
| ---------------------- | ----------------------------------------------------------- |
| Formato Prettier       | ✅ Sin diferencias                                          |
| ESLint                 | ✅ API, web y shared sin errores ni advertencias            |
| TypeScript estricto    | ✅ Tres workspaces aprobados                                |
| Pruebas automatizadas  | ✅ 163/163: API 105, web 28, shared 30                      |
| Archivos de prueba     | ✅ 58/58 aprobados                                          |
| Builds de producción   | ✅ API, web y shared generados                              |
| Modelo Prisma          | ✅ Formateado y válido                                      |
| Contrato OpenAPI       | ✅ Válido                                                   |
| Integridad del seed    | ✅ Incluye sesión y captura organoléptica pendientes `DEMO` |
| Salud de API           | ✅ HTTP 200 y base conectada                                |
| Frontend local         | ✅ HTTP 200                                                 |
| Login responsivo       | ✅ 1440 px, 1024 px y 390 px, sin desbordamiento horizontal |
| Protección de rutas    | ✅ `/inspecciones` redirige a `/login` sin sesión           |
| Consola del navegador  | ✅ Sin errores ni advertencias en el acceso                 |
| Login HTTP y sesión    | ✅ `ANALISTA` autenticado y `/auth/me` responde 200         |
| Contraseña provisional | ✅ Las rutas operativas quedan bloqueadas hasta cambiarla   |

Los recorridos que mutan lotes e inspecciones no se repitieron en este corte para
no alterar los cinco lotes del seed. Sus evidencias de aceptación están
registradas en `12-CHECKLIST-SPRINT-3.md` y `13-CHECKLIST-SPRINT-4.md`; la batería
automatizada completa sí se repitió después del rediseño visual. El recorrido
interactivo del Sprint 5 se registró en `15-CHECKLIST-SPRINT-5.md`.

## 5. Servicios verificados

| Servicio   | Dirección local del entorno evaluado | Estado                  |
| ---------- | ------------------------------------ | ----------------------- |
| Web        | `http://localhost:5173`              | ✅ Disponible           |
| API        | `http://localhost:3002/api/v1`       | ✅ Disponible           |
| PostgreSQL | `localhost:5434`                     | ✅ Contenedor saludable |

Los puertos 3000 y 3001 pertenecen a otros proyectos locales y no deben
detenerse. En una instalación limpia se pueden usar los puertos predeterminados
de `.env.example`.

## 6. Mejoras de interfaz incorporadas

- [x] Componentes base de shadcn/ui y Lucide.
- [x] Confirmaciones accesibles para acciones irreversibles con Radix Alert Dialog.
- [x] Avisos breves de éxito, advertencia y error con Sonner.
- [x] Campos, selectores y tablas reutilizables con foco visible.
- [x] Estados vacíos explicativos en listados de lotes e inspecciones.
- [x] Gráficos responsivos de lotes activos por etapa e inspecciones por estado.
- [x] Agregación paginada completa para que los gráficos no se limiten a los primeros 50 registros.
- [x] Tema monocromo oscuro con contraste y estados textuales.
- [x] Barra lateral colapsable y ajustable.
- [x] Menú de sesión funcional.
- [x] Paleta de búsqueda y navegación global.
- [x] Pantalla de ajustes de apariencia.
- [x] Vistas de calidad adaptadas a escritorio, tableta y móvil.

Estas mejoras no sustituyen funcionalidades pendientes de los Sprints 6 a 8.
Las alertas anteriores corresponden a retroalimentación de interfaz; el centro
de notificaciones operativas de RF-NOT-01 a RF-NOT-03 continúa pendiente dentro
del Sprint 6.

## 7. Condiciones antes de la demostración

- [ ] Nicolle cambia personalmente la contraseña provisional de su usuario.
- [ ] No se comparte el archivo `.env` ni sus secretos.
- [ ] La demostración usa datos `DEMO` hasta recibir rangos definitivos.
- [ ] Se explica que resultados y sesiones finales no se editan: se versionan.
- [ ] Se explica que las evaluaciones sensoriales califican el producto, nunca a los panelistas.
- [ ] Se comunica que UML, manual formal y video formal continúan fuera del alcance aprobado.
- [ ] Se confirma que la revisión es de Sprints 1–5, no la entrega final del sistema.

## 8. Prioridad inmediata

1. Sprint 6: ciclo completo de no conformidades, acciones, tablero y reportes.
2. Sprint 7: PWA, accesibilidad, seguridad, rendimiento y piloto.
3. Sprint 8: despliegue, evidencia, post-test y traspaso formal.

Los rangos reales de la empresa y las correcciones metodológicas de la tesis
continúan como dependencias externas; no deben resolverse inventando datos ni
modificando el software fuera de los requisitos aprobados.
