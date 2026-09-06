# 02 · REQUERIMIENTOS FUNCIONALES

> Fuente de verdad del alcance. **Si no está aquí, no se construye.**
> Nomenclatura: `RF-<módulo>-<n>`. Prioridad: 🔴 crítico (bloquea la tesis) · 🟡 importante · 🟢 deseable.

---

## M1 · SEGURIDAD, USUARIOS Y ROLES

| ID        | Requerimiento                                                                                                            | Prioridad |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | --------- |
| RF-M1-01  | Iniciar sesión con correo y contraseña, devolviendo token de acceso y token de refresco                                  | 🔴        |
| RF-M1-02  | Cerrar sesión invalidando el token de refresco                                                                           | 🔴        |
| RF-M1-03  | Renovar el token de acceso mediante el token de refresco                                                                 | 🔴        |
| RF-M1-04  | Registrar, editar, activar y desactivar usuarios (solo `ADMIN`)                                                          | 🔴        |
| RF-M1-04a | Consultar opciones mínimas de responsables activos desde los módulos operativos, sin acceso al directorio administrativo | 🔴        |
| RF-M1-05  | Asignar exactamente un rol por usuario entre `ADMIN`, `JEFE_CALIDAD`, `ANALISTA`, `OPERARIO`                             | 🔴        |
| RF-M1-06  | Restringir cada operación del sistema según los permisos del rol                                                         | 🔴        |
| RF-M1-07  | Permitir al usuario cambiar su propia contraseña                                                                         | 🟡        |
| RF-M1-08  | Permitir al `ADMIN` restablecer la contraseña de otro usuario                                                            | 🟡        |
| RF-M1-09  | Registrar el último acceso de cada usuario                                                                               | 🟢        |
| RF-M1-10  | Bloquear la cuenta tras 5 intentos fallidos consecutivos durante 15 minutos                                              | 🟡        |
| RF-M1-11  | Obligar a cambiar la contraseña provisional en el primer ingreso o después de un restablecimiento                        | 🔴        |
| RF-M1-12  | Gestionar un catálogo mínimo de áreas y asociar cada usuario con un área activa                                          | 🟡        |
| RF-M1-13  | Activar una cuenta interna mediante una invitación de correo con token temporal de un solo uso                           | 🟡        |
| RF-M1-14  | Solicitar y completar la recuperación de contraseña sin revelar si el correo existe                                      | 🟡        |
| RF-M1-15  | Permitir al `ADMIN` reenviar una invitación o iniciar la recuperación sin comunicar contraseñas                          | 🟡        |

**Nunca se elimina un usuario físicamente** — se desactiva. Los registros históricos deben conservar la referencia a su autor.

No existe auto-registro público. El `ADMIN` crea la cuenta y el usuario define
su contraseña mediante la invitación. En desarrollo los mensajes se capturan
en Mailpit; producción requiere un transporte SMTP autorizado por la empresa.

---

## M2 · ESTÁNDARES Y PARÁMETROS DE CALIDAD

_Sustenta: Planificación → Definición de objetivos de calidad (ítems A5-01 a A5-03)_

| ID       | Requerimiento                                                                                             | Prioridad |
| -------- | --------------------------------------------------------------------------------------------------------- | --------- |
| RF-M2-01 | Gestionar el catálogo de parámetros de calidad (código, nombre, unidad de medida, método de ensayo, tipo) | 🔴        |
| RF-M2-02 | Definir estándares con valor mínimo, valor máximo y valor objetivo por parámetro                          | 🔴        |
| RF-M2-03 | Asociar un estándar a un tipo de pisco y/o a una etapa del proceso                                        | 🔴        |
| RF-M2-04 | Registrar la norma de referencia del estándar (texto libre, ej. "NTP 211.001:2020")                       | 🔴        |
| RF-M2-05 | Versionar estándares mediante fecha de vigencia, sin borrar los anteriores                                | 🔴        |
| RF-M2-06 | Al validar un resultado, aplicar el estándar vigente **a la fecha de la inspección**, no el actual        | 🔴        |
| RF-M2-07 | Gestionar el catálogo de variedades de uva pisquera                                                       | 🟡        |
| RF-M2-08 | Gestionar el catálogo de tipos de pisco (Puro, Acholado, Mosto Verde)                                     | 🟡        |
| RF-M2-09 | Gestionar el catálogo de etapas del proceso productivo, con orden secuencial                              | 🔴        |
| RF-M2-10 | Gestionar el catálogo de instrumentos/equipos de laboratorio (código, nombre, estado)                     | 🟡        |
| RF-M2-11 | Gestionar el catálogo de atributos sensoriales para evaluación organoléptica                              | 🔴        |
| RF-M2-12 | Impedir la eliminación de un maestro que tenga registros asociados; permitir desactivarlo                 | 🔴        |
| RF-M2-13 | Rechazar intervalos de vigencia superpuestos para el mismo parámetro y ámbito de aplicación               | 🔴        |
| RF-M2-14 | Resolver estándares por prioridad explícita: tipo+etapa, tipo, etapa y finalmente general                 | 🔴        |
| RF-M2-15 | Configurar y versionar el umbral sensorial por tipo de pisco; solo `ADMIN` y `JEFE_CALIDAD`               | 🔴        |

---

## M3 · LOTES Y TRAZABILIDAD

_Sustenta: Trazabilidad completa (ítems A4-13 a A4-16) y Documentación (A5-22 a A5-24)_

| ID       | Requerimiento                                                                                                              | Prioridad |
| -------- | -------------------------------------------------------------------------------------------------------------------------- | --------- |
| RF-M3-01 | Registrar un lote con código único, una o varias variedades, tipo de pisco, fecha de inicio y volumen                      | 🔴        |
| RF-M3-02 | Generar automáticamente el código de lote con formato `LT-AAAA-NNNN`                                                       | 🟡        |
| RF-M3-03 | Avanzar el lote a la siguiente etapa del proceso, registrando fecha y responsable                                          | 🔴        |
| RF-M3-04 | Impedir el salto de etapas: solo se avanza a la etapa inmediatamente siguiente                                             | 🔴        |
| RF-M3-05 | Mostrar la línea de tiempo del lote con todas las etapas, sus fechas y sus responsables                                    | 🔴        |
| RF-M3-06 | Mostrar en la línea de tiempo las inspecciones y no conformidades asociadas a cada etapa                                   | 🔴        |
| RF-M3-07 | Generar un código QR por lote que enlace a su ficha de trazabilidad                                                        | 🟡        |
| RF-M3-08 | Consultar la ficha de trazabilidad completa de un lote en una sola vista                                                   | 🔴        |
| RF-M3-09 | Buscar y filtrar lotes por código, variedad, tipo, etapa actual, estado y rango de fechas                                  | 🔴        |
| RF-M3-10 | Cerrar un lote, impidiendo nuevos registros salvo consulta                                                                 | 🟡        |
| RF-M3-11 | Impedir el cierre de un lote con no conformidades abiertas                                                                 | 🟡        |
| RF-M3-12 | Registrar observaciones por etapa                                                                                          | 🟢        |
| RF-M3-13 | Para un pisco Acholado exigir al menos dos variedades; para Puro exigir exactamente una                                    | 🔴        |
| RF-M3-14 | Rechazar un lote registrando motivo, fecha y responsable; solo `ADMIN` o `JEFE_CALIDAD`                                    | 🟡        |
| RF-M3-15 | Impedir cambiar tipo, composición varietal o fecha de inicio después de programar la primera inspección o avanzar de etapa | 🔴        |

Estados del lote: `EN_PROCESO` · `EN_OBSERVACION` · `CERRADO` · `RECHAZADO`

---

## M4 · PROGRAMACIÓN DE INSPECCIONES

_Sustenta: Planificación → Programación (A5-04 a A5-06) y Asignación de recursos (A5-07 a A5-09)_

| ID       | Requerimiento                                                                                             | Prioridad |
| -------- | --------------------------------------------------------------------------------------------------------- | --------- |
| RF-M4-01 | Programar una inspección indicando lote, etapa, tipo, fecha prevista y responsable                        | 🔴        |
| RF-M4-02 | Asignar el instrumento/equipo previsto para la inspección                                                 | 🟡        |
| RF-M4-03 | Seleccionar los parámetros a medir en la inspección                                                       | 🔴        |
| RF-M4-04 | Visualizar las inspecciones en calendario mensual y semanal                                               | 🔴        |
| RF-M4-05 | Visualizar las inspecciones en listado con filtros por estado, responsable, lote y fecha                  | 🔴        |
| RF-M4-06 | Reprogramar una inspección registrando el motivo del cambio                                               | 🟡        |
| RF-M4-07 | Cancelar una inspección registrando el motivo                                                             | 🟡        |
| RF-M4-08 | Marcar automáticamente como `VENCIDA` toda inspección no ejecutada tras su fecha prevista                 | 🔴        |
| RF-M4-09 | Notificar al responsable cuando su inspección esté próxima (48 h) o vencida                               | 🟡        |
| RF-M4-10 | Crear un plan de inspecciones para un lote a partir de una plantilla versionada por tipo de pisco y etapa | 🔴        |
| RF-M4-11 | Mostrar el panel "mis inspecciones pendientes" al iniciar sesión                                          | 🟡        |
| RF-M4-12 | Reportar cobertura: etapas del lote con y sin inspección programada                                       | 🟡        |
| RF-M4-13 | Impedir iniciar una inspección con un equipo que no esté `OPERATIVO`; exigir reasignación                 | 🔴        |

Estados: `PROGRAMADA` · `EN_PROCESO` · `COMPLETADA` · `VENCIDA` · `CANCELADA` · `REPROGRAMADA`

---

## M5 · ANÁLISIS FISICOQUÍMICO

_Sustenta: Control → Detección de no conformidades (A5-10 a A5-12) y Efectividad operativa (A4-11, A4-12)_

| ID       | Requerimiento                                                                                                                                   | Prioridad |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RF-M5-01 | Registrar el valor medido de cada parámetro de una inspección                                                                                   | 🔴        |
| RF-M5-02 | Validar automáticamente cada valor contra el estándar vigente y marcarlo conforme o no conforme                                                 | 🔴        |
| RF-M5-03 | Mostrar la validación en tiempo real mientras el analista digita, antes de guardar                                                              | 🔴        |
| RF-M5-04 | Al guardar un resultado no conforme, **crear automáticamente una no conformidad** vinculada                                                     | 🔴        |
| RF-M5-05 | Registrar fecha, hora, analista e instrumento utilizado en cada medición                                                                        | 🔴        |
| RF-M5-06 | Permitir observaciones por parámetro medido                                                                                                     | 🟡        |
| RF-M5-07 | Impedir la modificación de un resultado ya guardado; permitir su corrección mediante un nuevo registro que anule el anterior, conservando ambos | 🔴        |
| RF-M5-08 | Cambiar el estado de la inspección a `COMPLETADA` cuando todos sus parámetros estén registrados                                                 | 🔴        |
| RF-M5-09 | Consultar el histórico de resultados de un parámetro a lo largo de varios lotes                                                                 | 🟡        |
| RF-M5-10 | Generar gráfico de control con línea central y límites de control ±3σ sobre resultados históricos                                               | 🟡        |
| RF-M5-11 | Señalar en el gráfico de control los puntos fuera de límites                                                                                    | 🟡        |
| RF-M5-12 | Adjuntar la referencia del certificado de calibración del instrumento (texto)                                                                   | 🟢        |
| RF-M5-13 | Impedir el guardado definitivo cuando no exista estándar vigente; responder `NO_EFFECTIVE_STANDARD` sin declarar conformidad                    | 🔴        |
| RF-M5-14 | Al corregir un resultado, anular o reemplazar transaccionalmente la no conformidad automática asociada según la conformidad del nuevo resultado | 🔴        |

> **Sobre RF-M5-10:** el gráfico de control es lo que conecta el sistema con la sección 2.2.2 del marco teórico (Montgomery, 2020). Requiere un mínimo de 8 mediciones históricas del mismo parámetro; con menos, mostrar el gráfico sin límites y un aviso de datos insuficientes.

---

## M6 · ANÁLISIS ORGANOLÉPTICO

_Sustenta: Cumplimiento de requisitos (A4-07, A4-08). Módulo exclusivo del Plan Completo._

| ID       | Requerimiento                                                                                                          | Prioridad |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| RF-M6-01 | Registrar una sesión de evaluación sensorial asociada a una inspección de tipo organoléptico                           | 🔴        |
| RF-M6-02 | Registrar los panelistas participantes de la sesión                                                                    | 🔴        |
| RF-M6-03 | Registrar la calificación de cada atributo sensorial por panelista, en escala de 1 a 5                                 | 🔴        |
| RF-M6-04 | Calcular el promedio por atributo y el promedio general de la sesión                                                   | 🔴        |
| RF-M6-05 | Registrar descriptores y observaciones en texto libre por panelista                                                    | 🟡        |
| RF-M6-06 | Registrar la presencia de defectos sensoriales identificados                                                           | 🟡        |
| RF-M6-07 | Marcar la sesión como no conforme si el promedio general es inferior al umbral vigente resuelto por el servidor        | 🔴        |
| RF-M6-08 | Crear automáticamente una no conformidad cuando la sesión resulte no conforme                                          | 🔴        |
| RF-M6-09 | Mostrar el perfil sensorial de la sesión en gráfico radial                                                             | 🟡        |
| RF-M6-10 | Comparar el perfil sensorial de dos o más lotes                                                                        | 🟢        |
| RF-M6-11 | Impedir la modificación de una sesión finalizada; una corrección crea una nueva versión y anula la anterior con motivo | 🔴        |
| RF-M6-12 | Impedir que quien registra la sesión envíe o altere el umbral utilizado para determinar conformidad                    | 🔴        |

> ⚠️ **Restricción de diseño obligatoria:** las calificaciones evalúan **el producto**, nunca al panelista. Está prohibido construir rankings, promedios de desempeño, comparativas o puntajes de los panelistas. El nombre del panelista se registra por trazabilidad del panel, no para evaluarlo.

---

## M7 · NO CONFORMIDADES Y ACCIONES CORRECTIVAS

_Sustenta: Control → Tiempo de respuesta (A5-13 a A5-15) y Seguimiento de acciones correctivas (A5-16 a A5-18)_

| ID       | Requerimiento                                                                                                                     | Prioridad |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RF-M7-01 | Registrar una no conformidad manualmente, indicando lote, etapa, descripción y severidad                                          | 🔴        |
| RF-M7-02 | Recibir no conformidades generadas automáticamente desde M5 y M6                                                                  | 🔴        |
| RF-M7-03 | Registrar fecha y hora de detección y el usuario que la detectó                                                                   | 🔴        |
| RF-M7-04 | Registrar fecha y hora del inicio de atención                                                                                     | 🔴        |
| RF-M7-05 | **Calcular y mostrar el tiempo de respuesta** (detección → inicio de atención) en horas                                           | 🔴        |
| RF-M7-06 | **Calcular y mostrar el tiempo de cierre** (detección → cierre) en horas                                                          | 🔴        |
| RF-M7-07 | Clasificar la severidad en `LEVE`, `MODERADA`, `CRITICA`                                                                          | 🔴        |
| RF-M7-08 | Registrar el análisis de causa raíz en texto libre                                                                                | 🟡        |
| RF-M7-09 | Registrar una o varias acciones, tipificadas como `CORRECCION`, `CORRECTIVA` o `PREVENTIVA`                                       | 🔴        |
| RF-M7-10 | Asignar responsable y fecha comprometida a cada acción                                                                            | 🔴        |
| RF-M7-11 | Registrar la ejecución de una acción con su fecha real                                                                            | 🔴        |
| RF-M7-12 | **Verificar la eficacia** de cada acción ejecutada: resultado (eficaz / no eficaz), verificador, fecha y comentario               | 🔴        |
| RF-M7-13 | Impedir el cierre sin acciones o mientras exista alguna acción sin verificar como eficaz                                          | 🔴        |
| RF-M7-14 | Restringir el cierre de la no conformidad al rol `JEFE_CALIDAD`                                                                   | 🔴        |
| RF-M7-15 | Notificar al responsable la asignación de una acción y su vencimiento próximo                                                     | 🟡        |
| RF-M7-16 | Listar y filtrar no conformidades por estado, severidad, lote, etapa y responsable                                                | 🔴        |
| RF-M7-17 | Alertar visualmente las acciones con fecha comprometida vencida                                                                   | 🟡        |
| RF-M7-18 | Asignar la no conformidad a un responsable y registrar el área responsable para coordinación y trazabilidad                       | 🟡        |
| RF-M7-19 | Permitir anular una no conformidad automática solo cuando su resultado de origen haya sido anulado, conservando el motivo y autor | 🔴        |
| RF-M7-20 | Impedir que el responsable de ejecutar una acción sea quien verifique su eficacia                                                 | 🔴        |

Estados de la NC: `ABIERTA` → `EN_ANALISIS` → `EN_TRATAMIENTO` → `EN_VERIFICACION` → `CERRADA` (o `ANULADA`)

---

## M8 · REPORTES Y TABLERO DE INDICADORES

_Sustenta: Generación de reportes (A4-17, A4-18) y Coordinación (A5-25 a A5-27)_

| ID       | Requerimiento                                                                                                                                      | Prioridad |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RF-M8-01 | Tablero con indicadores del periodo seleccionado                                                                                                   | 🔴        |
| RF-M8-02 | Indicador: porcentaje de conformidad de resultados                                                                                                 | 🔴        |
| RF-M8-03 | Indicador: cumplimiento de la programación de inspecciones                                                                                         | 🔴        |
| RF-M8-04 | Indicador: tiempo promedio de respuesta ante no conformidades                                                                                      | 🔴        |
| RF-M8-05 | Indicador: no conformidades abiertas por severidad                                                                                                 | 🔴        |
| RF-M8-06 | Indicador: lotes activos por etapa del proceso                                                                                                     | 🟡        |
| RF-M8-07 | Gráfico: no conformidades por etapa del proceso                                                                                                    | 🟡        |
| RF-M8-08 | Gráfico: evolución del porcentaje de conformidad por mes                                                                                           | 🟡        |
| RF-M8-09 | Reporte de trazabilidad completa de un lote, exportable a PDF                                                                                      | 🔴        |
| RF-M8-10 | Reporte de inspecciones por periodo, exportable a Excel                                                                                            | 🔴        |
| RF-M8-11 | Reporte de no conformidades y acciones correctivas, exportable a Excel                                                                             | 🔴        |
| RF-M8-12 | Reporte de resultados por parámetro, exportable a Excel                                                                                            | 🟡        |
| RF-M8-13 | Permitir al usuario configurar los filtros de cada reporte (rango de fechas, lote, etapa, responsable, estado)                                     | 🔴        |
| RF-M8-14 | Incluir en los PDF el encabezado con nombre de la empresa, fecha de emisión y usuario que lo generó                                                | 🟡        |
| RF-M8-15 | Excluir por defecto los datos de demostración de los indicadores y reportes operativos; permitir incluirlos solo con un filtro explícito y visible | 🔴        |

> **RF-M8-13 no es opcional.** El ítem A4-18 pregunta literalmente por la capacidad de _personalizar_ reportes. Reportes de filtros fijos dejan ese ítem sin respaldo.

### Definiciones canónicas de KPI

Todos los cálculos usan zona horaria `America/Lima`, excluyen `dataOrigin = DEMO` y registros `ANULADO`. Si el denominador es cero, devuelven `null` y “Sin datos”, nunca 0 %.

| KPI                              | Fórmula y periodo                                                                                                                                                                  | Fuente                         | Guardarraíl                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| Conformidad (%)                  | 100 × resultados finales `CONFORME` / (`CONFORME` + `NO_CONFORME`) registrados en el periodo. Incluye mediciones fisicoquímicas y sesiones sensoriales; devuelve desglose por tipo | PhysChemResult, SensorySession | Mostrar numerador, denominador y cobertura de estándares                                    |
| Cumplimiento de programación (%) | 100 × inspecciones completadas hasta su `scheduledDate` / inspecciones que vencían en el periodo. Excluye canceladas y originales reprogramadas                                    | Inspection                     | Mostrar completadas tarde y vencidas por separado                                           |
| Tiempo promedio de respuesta (h) | Promedio de `attentionStartedAt - detectedAt` para NC detectadas en el periodo que ya iniciaron atención                                                                           | NonConformity                  | Mostrar además cantidad y antigüedad de NC aún sin atención para evitar un promedio sesgado |
| NC abiertas por severidad        | Conteo de NC no cerradas ni anuladas existentes al cierre de `dateTo`, agrupadas por severidad                                                                                     | NonConformity                  | Incluye NC anteriores a `dateFrom` si seguían abiertas al cierre                            |
| Lotes activos por etapa          | Lotes `EN_PROCESO` o `EN_OBSERVACION` en cada etapa al cierre de `dateTo`                                                                                                          | Batch, BatchStage              | Separar lotes en observación                                                                |
| NC por etapa                     | NC detectadas durante el periodo, agrupadas por etapa de origen                                                                                                                    | NonConformity                  | Mostrar “Sin etapa” cuando corresponda; no descartarlas                                     |
| Evolución de conformidad         | Misma fórmula de conformidad, agrupada por mes de registro                                                                                                                         | PhysChemResult, SensorySession | Cada punto incluye tamaño de muestra                                                        |

No se fijan metas numéricas hasta obtener línea base y aprobación de la empresa. Cambiar una fórmula requiere actualizar este documento, el contrato de API y sus pruebas.

---

## TRANSVERSAL · BITÁCORA DE AUDITORÍA

| ID        | Requerimiento                                                                                                    | Prioridad |
| --------- | ---------------------------------------------------------------------------------------------------------------- | --------- |
| RF-AUD-01 | Registrar toda operación de creación, modificación y cambio de estado sobre entidades operativas                 | 🔴        |
| RF-AUD-02 | Almacenar usuario, fecha y hora, entidad afectada, acción y valores anterior y posterior                         | 🔴        |
| RF-AUD-03 | Consultar la bitácora con filtros por usuario, entidad, acción y rango de fechas (solo `ADMIN` y `JEFE_CALIDAD`) | 🟡        |
| RF-AUD-04 | Impedir la modificación o eliminación de registros de la bitácora desde la aplicación                            | 🔴        |

---

## TRANSVERSAL · NOTIFICACIONES

| ID        | Requerimiento                                                                                                                                      | Prioridad |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RF-NOT-01 | Generar notificaciones dentro de la aplicación para inspecciones próximas, inspecciones vencidas, no conformidades asignadas y acciones por vencer | 🟡        |
| RF-NOT-02 | Marcar notificaciones como leídas                                                                                                                  | 🟡        |
| RF-NOT-03 | Mostrar el contador de notificaciones no leídas en la barra superior                                                                               | 🟡        |

---

## TRANSVERSAL · BÚSQUEDA GLOBAL

| ID         | Requerimiento                                                                               | Prioridad |
| ---------- | ------------------------------------------------------------------------------------------- | --------- |
| RF-SRCH-01 | Buscar por código o texto en lotes, inspecciones y no conformidades desde la barra superior | 🟡        |
| RF-SRCH-02 | Respetar en los resultados de búsqueda los permisos y el alcance de datos del usuario       | 🔴        |

---

## Matriz de permisos por rol

| Operación                                  | ADMIN | JEFE_CALIDAD | ANALISTA |                 OPERARIO                  |
| ------------------------------------------ | :---: | :----------: | :------: | :---------------------------------------: |
| Gestionar usuarios y roles                 |  ✅   |      —       |    —     |                     —                     |
| Gestionar áreas                            |  ✅   |      ✅      |    —     |                     —                     |
| Gestionar maestros y estándares            |  ✅   |      ✅      |    —     |                     —                     |
| Registrar y avanzar lotes                  |  ✅   |      ✅      |    —     |                    ✅                     |
| Cerrar lotes                               |  ✅   |      ✅      |    —     |                     —                     |
| Rechazar lotes                             |  ✅   |      ✅      |    —     |                     —                     |
| Programar y reprogramar inspecciones       |  ✅   |      ✅      |    —     |                     —                     |
| Registrar resultados fisicoquímicos        |  ✅   |      ✅      |    ✅    |                     —                     |
| Registrar evaluación organoléptica         |  ✅   |      ✅      |    ✅    |                     —                     |
| Registrar no conformidad                   |  ✅   |      ✅      |    ✅    |                    ✅                     |
| Registrar y ejecutar acciones correctivas  |  ✅   |      ✅      |    ✅    |                     —                     |
| Verificar eficacia y cerrar no conformidad |  ✅   |      ✅      |    —     |                     —                     |
| Ver tablero e indicadores                  |  ✅   |      ✅      |    ✅    | Solo lotes e inspecciones donde participa |
| Generar y exportar reportes                |  ✅   |      ✅      |    ✅    |                     —                     |
| Consultar bitácora de auditoría            |  ✅   |      ✅      |    —     |                     —                     |
