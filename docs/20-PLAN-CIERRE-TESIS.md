# 20 · PLAN DE CIERRE: TESIS Y SOFTWARE

**Corte:** 01/11/2026

**Fuentes:**

- Clase de Trabajo de Investigación II del 26/10/2026 (semana 10, Ing. Leiva).
- `TESIS_NICOLLE_FINAL.pdf` (129 páginas, exportado el 20/10/2026).
- Rama `feature/sprint-4-ui-foundation` (`2c5c879`), `02-REQUERIMIENTOS-FUNCIONALES.md`, `schema.prisma` y rutas de `apps/web`.

**Propósito:** cruzar lo que pidió el asesor con el documento de tesis y con
SIGECAL, y ordenar el trabajo pendiente en sprints cortos hasta la sustentación.

## 1. Calendario del asesor

Fechas calculadas asumiendo clase los lunes, como el 26/10.

| Semana | Fecha | Entrega                                                                     | Lo que explica el asesor      |
| ------ | ----- | --------------------------------------------------------------------------- | ----------------------------- |
| S11    | 02/11 | Capítulo IV completo según el modelo (UML + capturas)                       | Parte estadística y discusión |
| S12    | 09/11 | Todo completo hasta conclusiones y recomendaciones, incluida la estadística | Anexos                        |
| S13    | 16/11 | Anexos (matrices, encuestas)                                                | —                             |
| S14    | 23/11 | Inicio probable de sustentaciones                                           | —                             |

> ⚠️ El calendario académico va por delante de `09-PLAN-DESARROLLO.md`, que
> ubica el piloto en diciembre (Sprint 7) y el post-test en la segunda quincena
> de diciembre (Sprint 8). Como el desarrollo ya está adelantado, el piloto puede
> empezar en cuanto el asesor lo apruebe.

### Reglas dadas en clase para todos

- Cada módulo lleva: diagrama de caso de uso, tabla de especificación, diagrama de actividades, diagrama de secuencia y unas 2 capturas del sistema.
- Alcance esperado: creación de usuario administrador e inicio de sesión (básicos), más 6 o 7 módulos.
- Base de datos: no colocar todas las tablas, sino unas 8–10.
- Tablas en formato APA 7.
- Actores por función, sin nombres de personas ni distinción de género.
- Pocas viñetas.
- Turnitin lee bien hasta unas 25 000 palabras. El documento se pasa en 2 bloques y los porcentajes se suman, así que no conviene inflarlo.
- Capítulo III: Tabla 1 población y Tabla 2 muestra. Las tablas de encuestas van en el capítulo IV.
- Parte estadística a nivel intermedio: seguir los pasos de SPSS; no se exige alta confiabilidad.

## 2. Hallazgo principal: el capítulo IV describe un sistema distinto al construido

Las capturas salen de SIGECAL. Si el texto y los diagramas del capítulo IV no
coinciden con las pantallas, la diferencia se nota en la revisión y en la
sustentación.

| Tema                             | Tesis (capítulo IV)                                                                                      | SIGECAL                                                                                                                                                                                                                                                   | Acción en la tesis                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Roles                            | 5: Administrador, Jefe de Control de Calidad, Analista, Supervisor de Producción, Catador                | 4: `ADMIN`, `JEFE_CALIDAD`, `ANALISTA`, `OPERARIO` (RF-M1-05)                                                                                                                                                                                             | Usar 4 roles. Supervisor de Producción pasa a Operario; el catador no es usuario del sistema                                 |
| Alta de usuario (CU001)          | Genera contraseña temporal y la envía por correo                                                         | Envía una invitación con enlace temporal de un solo uso; nunca envía contraseñas (RF-M1-13, RF-M1-15). Asocia el usuario a un área (RF-M1-12)                                                                                                             | Reescribir los pasos 11–13 y sus diagramas                                                                                   |
| Inicio de sesión                 | Incluido dentro de CU001                                                                                 | Flujo propio: ingreso, cambio obligatorio de contraseña provisional, bloqueo tras 5 intentos por 15 min, recuperación (RF-M1-01, 10, 11, 14)                                                                                                              | Separarlo en un caso de uso propio                                                                                           |
| Registro de lote (CU003)         | Parcela, peso, °Brix inicial; 4 etapas                                                                   | Una o varias variedades con regla Puro/Acholado, tipo de pisco, fecha, volumen y procedencia; 6 etapas; código `LT-AAAA-NNNN`; QR y línea de tiempo                                                                                                       | Ajustar campos y etapas, agregar el QR. Quitar parcela, peso y °Brix inicial (el °Brix se mide como parámetro de inspección) |
| Planificación (CU002)            | Verifica disponibilidad del personal y calibración del equipo al programar                               | Asigna responsable y equipo; plantillas versionadas; exige equipo `OPERATIVO` al iniciar (RF-M4-13); vencimiento automático; aviso a 48 h                                                                                                                 | Quitar la disponibilidad del personal y mover la verificación del equipo al inicio de la inspección                          |
| Análisis fisicoquímico (CU004)   | Incertidumbre de medición, "zona de riesgo", retención del lote                                          | Conforme o no conforme contra el estándar vigente a la fecha; previsualización; bloqueo sin estándar; resultado inmutable con corrección por versión; NC automática; el lote no cierra con NC abierta                                                     | Quitar incertidumbre y zona de riesgo; agregar inmutabilidad y bloqueo sin estándar                                          |
| Evaluación organoléptica (CU005) | Cada catador inicia sesión y llena su ficha; códigos aleatorios de 3 dígitos; dispersión entre catadores | El analista registra la sesión; los panelistas internos o externos son registros de trazabilidad, no usuarios; matriz 1–5 por atributo; promedios en servidor; umbral vigente; defectos; NC automática; perfil radial. Está prohibido comparar panelistas | Reescribir el caso de uso, sus actores y sus diagramas                                                                       |
| Liberación (CU007)               | Certificado de liberación, reposo mínimo de 3 meses, código de verificación                              | Cierre de lote bloqueado con NC abiertas; rechazo con motivo; reporte de trazabilidad en PDF; tablero de indicadores; reportes en Excel                                                                                                                   | Reorientarlo a "Consultar indicadores y generar reportes" y quitar lo que no existe                                          |
| Base de datos (4.2.3)            | 18 tablas, entre ellas roles, parcelas, liberaciones_lote y detalle_analisis                             | 28 modelos Prisma; el rol es una enumeración; no existen parcelas ni liberaciones                                                                                                                                                                         | Reemplazar por unas 10 tablas reales                                                                                         |
| No conformidades (CU006)         | Coincide en lo esencial                                                                                  | Agrega tiempo de respuesta y de cierre, tipos de acción y la regla de que quien ejecuta una acción no verifica su eficacia (RF-M7-20)                                                                                                                     | Ajustes menores                                                                                                              |
| Arquitectura                     | PostgreSQL, API REST, SPA, JWT, bcrypt                                                                   | Express 5, Prisma 7, PostgreSQL 16, React 19 y Vite, JWT (`jose`), `bcryptjs`                                                                                                                                                                             | Coincide                                                                                                                     |

## 3. Estructura propuesta para 4.2.4: 2 básicos + 6 módulos

| CU   | Nombre                                   | Actor principal     | Módulo | Viene de                | Pantallas a capturar                                                            |
| ---- | ---------------------------------------- | ------------------- | ------ | ----------------------- | ------------------------------------------------------------------------------- |
| CU01 | Registrar usuario                        | Administrador       | M1     | CU001 (parte de alta)   | `/usuarios`: listado y formulario de alta con aviso de invitación               |
| CU02 | Iniciar sesión                           | Usuario del sistema | M1     | CU001 (parte de acceso) | `/login` y `/password` (cambio obligatorio)                                     |
| CU03 | Registrar lote y consultar trazabilidad  | Operario            | M3     | CU003                   | `/lotes/nuevo` y `/lotes/:id` (línea de tiempo y QR)                            |
| CU04 | Programar inspecciones                   | Jefe de calidad     | M4     | CU002                   | `/inspecciones/nueva` y calendario en `/inspecciones`                           |
| CU05 | Registrar análisis fisicoquímico         | Analista            | M5     | CU004                   | `/analisis`: registro con validación en vivo y resultado con gráfico de control |
| CU06 | Registrar evaluación organoléptica       | Analista            | M6     | CU005                   | `/organoleptico/nueva` (matriz) y `/organoleptico/:id` (perfil radial)          |
| CU07 | Gestionar no conformidades y acciones    | Jefe de calidad     | M7     | CU006                   | `/no-conformidades` y `/no-conformidades/:id` (acciones y verificación)         |
| CU08 | Consultar indicadores y generar reportes | Jefe de calidad     | M8     | CU007                   | Tablero de inicio y `/reportes` con el PDF de trazabilidad                      |

Total: 24 diagramas (8 de casos de uso, 8 de actividades y 8 de secuencia),
8 tablas de especificación y unas 16 capturas. M2 (estándares) queda como
séptimo módulo opcional, solo si el límite de palabras lo permite.

## 4. Checklist del documento

### 4.1 Para la clase S11 (02/11): mínimo presentable

- [ ] Insertar las capturas (2 por CU, ya listas en `output/capturas-tesis/`), con la nota: «Captura del sistema SIGECAL con datos de demostración».
- [ ] Separar el inicio de sesión como CU02.
- [ ] Ajustar los roles a 4 en la Tabla 5 (actores), en RF01 de la Tabla 2 y en los textos.
- [ ] Pasar las 12 tablas a APA 7: sin líneas verticales ni sombreado; solo bordes horizontales (arriba, bajo el encabezado y abajo).

### 4.2 Para S12 (09/11): capítulos IV y V completos

- [ ] Reescribir los casos de uso según la sección 2. Prioridad: CU06 organoléptico, CU08 reportes, CU01/CU02 y CU03.
- [ ] Rehacer los diagramas de actividades y secuencia afectados: CU01, CU02 (nuevo), CU03, CU06 y CU08. Ajustes menores en CU04, CU05 y CU07.
- [ ] Ajustar los RF de la Tabla 2 que describen funciones inexistentes: RF02 (contraseña temporal), RF04 (disponibilidad), RF06 (parcela), RF10 (zona de riesgo), RF12 (código aleatorio), RF14 (dispersión), RF17 (reposo de 3 meses) y RF18 (certificado).
- [ ] 4.2.3: dejar unas 10 tablas reales (`User`, `Batch`, `BatchStage`, `Inspection`, `Parameter`, `Standard`, `PhysChemResult`, `SensorySession`, `NonConformity`, `CorrectiveAction`), reducir la Tabla 4 y usar un diagrama general más un máximo de 2 de detalle.
- [ ] Recortar para Turnitin. Hoy hay unas 23 300 palabras (conteo aproximado desde el PDF); la meta es quedar en unas 20 000 antes de agregar estadística, discusión y conclusiones.
  - Capítulo II: de 8 488 a unas 5 000 palabras.
  - Capítulo IV: de 9 164 palabras; acortar las narraciones de flujo.
  - Las capturas no suman palabras.
- [ ] Capítulo III: agregar la Tabla de población (15 colaboradores: 1 jefe y 14 empleados) y la Tabla de muestra (censal); confirmar con el asesor. Corregir la frase inicial, que anuncia población y muestra inexistentes, y quitar "maquinarias agrícolas" e "inventarios" de 3.2.2.
- [ ] Parte estadística: seguir lo que explique el asesor en S11, con SPSS y los datos pareados del pre-test y post-test (ver sección 6).
- [ ] Discusión: contrastar los resultados con los antecedentes del capítulo II.
- [ ] Conclusiones (una por objetivo: general y 3 específicos) y recomendaciones.
- [ ] Introducción: retirar inventarios, mantenimiento de equipos y gestión de personal, y actualizar la cantidad de capítulos.
- [ ] Resumen y abstract en pasado, con resultados.

### 4.3 Para S13–S14 (16/11–23/11)

- [ ] Anexos según lo que indique el asesor en S12: matriz de consistencia, operacionalización e instrumentos (Anexos 4 y 5), con las presentaciones corregidas (inconsistencias 8, 11, 12 y 15 de `01-ANALISIS-TESIS.md`).
- [ ] Inconsistencias de `01-ANALISIS-TESIS.md` que siguen en el PDF:
  - 3: "UML como metodología" en 1.3. UML es un lenguaje; la metodología es Scrum.
  - 4: "maquinarias agrícolas" en 3.2.2.
  - 5: delimitación temporal set. 2025 – ago. 2026.
  - 6: la introducción promete módulos fuera de alcance.
  - 10: la portada dice 2025.
  - La 9 (autor en los metadatos del PDF) ya está corregida.
- [ ] Cambiar las viñetas de precondiciones y postcondiciones por texto corrido.
- [ ] Regenerar los índices de tablas y gráficos; dejar la página del informe antiplagio para el final.
- [ ] Hacer un pre-Turnitin propio por bloques antes de la pasada oficial.
- [ ] Preparar diapositivas y guion de demostración para la sustentación.

## 5. Checklist del software

### 5.1 Para las capturas (S11)

- [x] Levantar el entorno local con `npm run dev` (seed `DEMO`) y recorrer los 8 flujos de la sección 3.
- [x] Capturar en escritorio (1440 px) y con el tema claro, que imprime mejor que el oscuro.
- [x] Usar los usuarios técnicos del seed según el rol de cada CU, sin mostrar secretos ni datos personales reales.
- [x] Generar el PDF de trazabilidad de un lote para CU08 (desde el detalle del lote).

Las 17 capturas y el PDF están en `output/capturas-tesis/` (carpeta sin versionar), con
`LEEME.md` como índice. Los formularios se llenaron con datos de ejemplo y no se enviaron.

### 5.1.1 Hallazgos de la sesión de capturas (01/11/2026)

- [ ] El trabajo sin commit de `InspectionForm.tsx` importa `InspectionFormFields` e `InspectionFormAside`, que no existen: `/inspecciones/nueva` falla con ese árbol de trabajo. Las capturas se tomaron con la versión confirmada.
- [ ] En tema claro, algunas etiquetas casi no se leen: el resumen de la sesión organoléptica (Lote, Inspección, Promedio general…) y el umbral aplicado en la nueva evaluación.
- [ ] El gráfico «Lotes activos por etapa» del tablero corta la etiqueta «Molienda/Despalillado».
- [ ] El PDF de trazabilidad y el selector de responsable muestran códigos internos (`EN PROCESO`, `FISICOQUIMICO`, `EN_PROCESO`, `JEFE_CALIDAD`) en lugar de etiquetas en español.
- [ ] Con el seed actual, el gráfico de control solo reúne 2 mediciones por combinación (mínimo 8); para una captura más representativa harían falta más datos `DEMO`.
- [ ] Entorno local: yallego ocupa 5434, 1025 y 8025. En `.env` (sin versionar) SIGECAL pasó a PostgreSQL 5436 y Mailpit 1026/8026; hay copia previa en `.env.backup-capturas`.
- [ ] Las cuentas técnicas del seed ya cambiaron la contraseña provisional; la nueva está en `.env` como `CAPTURAS_PASSWORD`.

### 5.2 Pendientes de Sprint 7 (`17-CHECKLIST-SPRINT-7.md`)

- [ ] Recorrer todas las vistas con teclado y comprobar orden y foco visible.
- [ ] Medir contraste WCAG AA en todos los estados y pasar Lighthouse.
- [ ] Revisar estados de carga, vacío, error y éxito.
- [ ] Validar la PWA y las vistas autenticadas en un teléfono real de planta.
- [ ] Ejecutar el piloto y registrar incidencias sin ampliar el alcance.
- [ ] Obtener la conformidad de Nicolle y la evidencia breve de aceptación.

### 5.3 Sprint 8 (`18-GUIA-DESPLIEGUE-SPRINT-8.md`)

- [ ] Confirmar dominio, proveedor, SMTP y responsable de operación (solo si la demo de sustentación será en línea).
- [ ] TLS, CORS, cookies, secretos JWT únicos, respaldo y restauración ensayada.
- [ ] Cuentas individuales para el piloto; datos `DEMO` separados de la evidencia académica.

### 5.4 Repositorio y datos

- [ ] Terminar o descartar el trabajo sin commit en `InspectionForm` (1 archivo modificado y 3 nuevos).
- [ ] Integrar a `develop` y `main` los 53 commits que hoy solo están en `feature/sprint-4-ui-foundation` (ya publicados en origin).
- [ ] Obtener de Tacama los parámetros, rangos y umbrales reales. Sin ellos, los datos `REAL` del piloto no se pueden calificar.

### 5.5 Decisión comercial

- [ ] En COT-2026-VT-001, UML, manual y video figuran como add-on no aprobado. Ajustar los diagramas del capítulo IV al software es trabajo de UML: decidir si los rehace Nicolle o si se aprueba el add-on. Las capturas no son UML.

## 6. Ruta crítica de la investigación

El asesor espera la parte estadística para S12 (09/11). El diseño preexperimental
exige este orden (ver `01-ANALISIS-TESIS.md`):

1. [ ] Pre-test (Anexo 5) a los 15 colaboradores **antes** de darles acceso a SIGECAL. Confirmar si ya se aplicó.
2. [ ] Piloto con la duración y los participantes aprobados por el asesor.
3. [ ] Post-test: Anexo 5 y Anexo 4.
4. [ ] Tabulación en SPSS con código seudónimo por participante; prueba para muestras relacionadas definida con el asesor.

> Si no hay tiempo para un piloto real antes del 09/11, hay que plantearlo al
> asesor en S11. Nunca se completan respuestas ni resultados que no se hayan
> recolectado.

## 7. Sprints hasta la sustentación

| Sprint | Fechas   | Documento                                                                                                                                        | Software                                                                                                         |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| T1     | 01–02/11 | Capturas, CU02 de inicio de sesión, 4 roles y tablas APA                                                                                         | Levantar el entorno, recorrer los 8 flujos y capturar                                                            |
| T2     | 03–08/11 | Realinear casos de uso y diagramas; BD de 10 tablas; recorte para Turnitin; capítulo III; estadística, discusión, conclusiones y recomendaciones | Soporte al piloto: cuentas individuales, prueba en teléfono real, registro de incidencias; pedir rangos a Tacama |
| T3     | 09–15/11 | Correcciones del asesor, anexos, inconsistencias restantes, índices y pre-Turnitin                                                               | Integrar a `develop`/`main`; decidir entre demo local estable o despliegue (Sprint 8)                            |
| T4     | 16–22/11 | Versión final, Turnitin en 2 bloques, diapositivas y ensayo                                                                                      | Congelar la versión, preparar datos `DEMO` para la demostración y respaldar                                      |
