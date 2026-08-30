# 06 · CONTRATO DE API

Base: `/api/v1` · Formato: JSON · Autenticación: `Authorization: Bearer <accessToken>`

---

## 1. Convenciones

**Respuesta exitosa**

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 137 }
}
```

**Respuesta con error**

```json
{
  "success": false,
  "error": {
    "code": "STRING_CODE",
    "message": "Mensaje en español para el usuario.",
    "details": []
  }
}
```

**Paginación y ordenamiento** — parámetros comunes a todo listado:
`page` (por defecto 1) · `pageSize` (por defecto 20, máximo 100) · `sortBy` · `sortOrder` (`asc` | `desc`) · `search`

**Códigos HTTP:** 200 consulta · 201 creación · 204 sin contenido · 400 formato/validación · 401 sin autenticar · 403 sin permiso · 404 no encontrado · 409 conflicto de estado o unicidad · 422 regla de dominio evaluable · 500 error interno · 503 dependencia no disponible.

**Fechas:** ISO 8601 en la API. El formato peruano se aplica solo en la interfaz.

**Roles** en la columna _Acceso_: `A` = ADMIN · `J` = JEFE_CALIDAD · `N` = ANALISTA · `O` = OPERARIO

**Alcance de datos:** “todos” significa todos los roles autenticados, pero no elimina los filtros de pertenencia. El `OPERARIO` solo recibe lotes e inspecciones donde participa como creador o responsable. La API aplica este alcance antes de paginar y calcular totales.

**Contrato ejecutable:** durante el Sprint 1 se genera `docs/openapi.yaml` a partir de los esquemas Zod compartidos. El archivo OpenAPI y este documento deben actualizarse en el mismo cambio; ninguna ruta se implementa con campos no documentados.

---

## 2. Estado del servicio — `/health`

| Método | Ruta      | Descripción                            | Acceso  |
| ------ | --------- | -------------------------------------- | ------- |
| GET    | `/health` | Comprueba API y conexión de PostgreSQL | público |

```json
200
{ "success": true, "data": { "status": "ok", "database": "connected", "timestamp": "2026-09-01T15:00:00.000Z" } }

503
{ "success": false, "error": { "code": "DATABASE_UNAVAILABLE", "message": "El servicio no está disponible temporalmente.", "details": [] } }
```

No devuelve versiones, credenciales, nombres de host ni cadenas de conexión.

---

## 3. Autenticación — `/auth`

| Método | Ruta             | Descripción                                                                                | Acceso              |
| ------ | ---------------- | ------------------------------------------------------------------------------------------ | ------------------- |
| POST   | `/auth/login`    | Inicia sesión. Devuelve `accessToken` y usuario; establece el refresh en cookie `httpOnly` | público             |
| POST   | `/auth/refresh`  | Renueva el token de acceso                                                                 | público con refresh |
| POST   | `/auth/logout`   | Revoca el token de refresco                                                                | autenticado         |
| GET    | `/auth/me`       | Devuelve el usuario en sesión con sus permisos                                             | autenticado         |
| PATCH  | `/auth/password` | Cambia la contraseña propia                                                                | autenticado         |

```
POST /auth/login
{ "email": "jefe.calidad@tacama.pe", "password": "..." }

200
Set-Cookie: sigecal_refresh=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth

{ "success": true, "data": {
    "accessToken": "...",
    "user": { "id": "...", "firstName": "...", "lastName": "...", "email": "...", "role": "JEFE_CALIDAD", "mustChangePassword": false }
}}
```

El `refreshToken` no aparece jamás en el cuerpo. `/auth/refresh` rota la cookie y devuelve únicamente un nuevo `accessToken`. Login, refresh y logout usan `Cache-Control: no-store`.

---

## 4. Usuarios — `/users`

| Método | Ruta                        | Descripción                                 | Acceso |
| ------ | --------------------------- | ------------------------------------------- | ------ |
| GET    | `/users`                    | Lista paginada. Filtros: `role`, `isActive` | A      |
| GET    | `/users/:id`                | Detalle                                     | A      |
| POST   | `/users`                    | Crea usuario                                | A      |
| PATCH  | `/users/:id`                | Actualiza datos y rol                       | A      |
| PATCH  | `/users/:id/status`         | Activa o desactiva                          | A      |
| POST   | `/users/:id/reset-password` | Restablece contraseña                       | A      |

Crear o restablecer contraseña establece `mustChangePassword: true`. Mientras esté activo, el usuario solo puede consultar `/auth/me`, cambiar su contraseña o cerrar sesión.

---

## 5. Maestros — `/masters`

| Método | Ruta                                                | Descripción                    | Acceso                      |
| ------ | --------------------------------------------------- | ------------------------------ | --------------------------- |
| GET    | `/masters/varieties` · POST · PATCH `/:id`          | Variedades de uva              | GET: todos · escritura: A J |
| GET    | `/masters/pisco-types` · POST · PATCH `/:id`        | Tipos de pisco                 | ídem                        |
| GET    | `/masters/stages` · POST · PATCH `/:id`             | Etapas del proceso             | ídem                        |
| GET    | `/masters/equipment` · POST · PATCH `/:id`          | Instrumentos                   | ídem                        |
| GET    | `/masters/sensory-attributes` · POST · PATCH `/:id` | Atributos sensoriales          | ídem                        |
| GET    | `/masters/areas` · POST · PATCH `/:id`              | Áreas organizacionales mínimas | GET: todos · escritura: A J |

> `DELETE` no existe en maestros. La baja es lógica vía `PATCH /:id` con `isActive: false` (RF-M2-12).

### Parámetros y estándares

| Método | Ruta                                | Descripción                                                                                                 | Acceso |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| GET    | `/masters/parameters`               | Lista. Filtros: `type`, `isActive`                                                                          | todos  |
| POST   | `/masters/parameters`               | Crea parámetro                                                                                              | A J    |
| PATCH  | `/masters/parameters/:id`           | Actualiza parámetro                                                                                         | A J    |
| GET    | `/masters/parameters/:id/standards` | Estándares del parámetro, incluyendo históricos                                                             | todos  |
| POST   | `/masters/standards`                | Crea estándar. Cierra la vigencia del anterior                                                              | A J    |
| PATCH  | `/masters/standards/:id`            | Actualiza estándar no aplicado aún                                                                          | A J    |
| GET    | `/masters/standards/effective`      | Estándar vigente. Query: `parameterId`, `piscoTypeId`, `stageId`, `date`, `dataOrigin` (`REAL` por defecto) | todos  |

`POST /masters/standards` rechaza intervalos superpuestos y valida límites. Para datos `REAL`, `/effective` ignora estándares provisionales.

### Umbrales sensoriales

| Método | Ruta                                    | Descripción                                                  | Acceso |
| ------ | --------------------------------------- | ------------------------------------------------------------ | ------ |
| GET    | `/masters/sensory-thresholds`           | Historial. Filtros: `piscoTypeId`, `isActive`                | todos  |
| POST   | `/masters/sensory-thresholds`           | Crea una versión y cierra la anterior del mismo ámbito       | A J    |
| GET    | `/masters/sensory-thresholds/effective` | Resuelve por tipo, fecha y `dataOrigin` (`REAL` por defecto) | todos  |

### Plantillas de inspección

| Método | Ruta                                           | Descripción                                                        | Acceso |
| ------ | ---------------------------------------------- | ------------------------------------------------------------------ | ------ |
| GET    | `/masters/inspection-templates`                | Lista e historial por tipo de pisco                                | A J    |
| POST   | `/masters/inspection-templates`                | Crea plantilla versionada con etapas, desplazamientos y parámetros | A J    |
| POST   | `/masters/inspection-templates/:id/deactivate` | Desactiva sin eliminar historial                                   | A J    |

---

## 6. Lotes — `/batches`

| Método | Ruta                         | Descripción                                                                                         | Acceso |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| GET    | `/batches`                   | Lista. Filtros: `status`, `varietyId`, `piscoTypeId`, `stageId`, `dataOrigin`, `dateFrom`, `dateTo` | todos  |
| GET    | `/batches/:id`               | Detalle                                                                                             | todos  |
| POST   | `/batches`                   | Crea lote. El código se genera automáticamente                                                      | A J O  |
| PATCH  | `/batches/:id`               | Actualiza datos generales                                                                           | A J O  |
| GET    | `/batches/:id/timeline`      | Línea de tiempo: etapas, inspecciones y no conformidades                                            | todos  |
| POST   | `/batches/:id/advance-stage` | Avanza a la etapa siguiente                                                                         | A J O  |
| POST   | `/batches/:id/close`         | Cierra el lote                                                                                      | A J    |
| POST   | `/batches/:id/reject`        | Rechaza el lote. Requiere `reason`                                                                  | A J    |
| GET    | `/batches/:id/qr`            | Devuelve el QR del lote en PNG o SVG                                                                | todos  |
| GET    | `/batches/:id/traceability`  | Ficha completa de trazabilidad                                                                      | todos  |

```json
POST /batches
{
  "piscoTypeId": "uuid",
  "varieties": [
    { "varietyId": "uuid", "percentage": 60 },
    { "varietyId": "uuid", "percentage": 40 }
  ],
  "startDate": "2026-09-02",
  "volumeLiters": 1200,
  "harvestOrigin": "Parcela 3",
  "notes": null
}
```

El cliente no envía `dataOrigin`: las rutas operativas crean `REAL`; únicamente el seed controlado puede crear `DEMO`. `Puro` exige una variedad y `Acholado` al menos dos.

`PATCH /batches/:id` acepta `volumeLiters`, `harvestOrigin` y `notes` mientras el lote esté abierto. `piscoTypeId`, `varieties` y `startDate` solo son modificables antes de programar la primera inspección y antes de avanzar de la etapa inicial.

```
POST /batches/:id/advance-stage
{ "responsibleId": "uuid", "observations": "..." }

El servidor resuelve exclusivamente la etapa activa de secuencia inmediata. Si
el lote ya está en la última etapa responde `409 LAST_STAGE_REACHED`. La
respuesta incluye alertas no bloqueantes por inspecciones pendientes o no
conformidades abiertas en la etapa cerrada.

POST /batches/:id/close
409 si existen no conformidades abiertas
→ { "code": "OPEN_NONCONFORMITIES" }
```

---

## 7. Inspecciones — `/inspections`

| Método | Ruta                               | Descripción                                                                                   | Acceso      |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------------- | ----------- |
| GET    | `/inspections`                     | Lista. Filtros: `batchId`, `status`, `type`, `responsibleId`, `stageId`, `dateFrom`, `dateTo` | todos       |
| GET    | `/inspections/calendar`            | Vista de calendario. Query: `month`, `year` o `dateFrom`/`dateTo`                             | todos       |
| GET    | `/inspections/my-pending`          | Inspecciones pendientes del usuario en sesión                                                 | autenticado |
| GET    | `/inspections/:id`                 | Detalle consolidado con parámetros, estándar aplicable, resultado vigente e historial         | todos       |
| POST   | `/inspections`                     | Programa inspección                                                                           | A J         |
| PATCH  | `/inspections/:id`                 | Actualiza datos previos a la ejecución                                                        | A J         |
| POST   | `/inspections/:id/reschedule`      | Reprograma. Requiere `newDate` y `reason`                                                     | A J         |
| POST   | `/inspections/:id/cancel`          | Cancela. Requiere `reason`                                                                    | A J         |
| POST   | `/inspections/:id/start`           | Marca `EN_PROCESO`                                                                            | A J N       |
| GET    | `/inspections/coverage`            | Cobertura por etapa. Query: `batchId`                                                         | A J         |
| POST   | `/inspections/plans/from-template` | Genera el plan de un lote desde una plantilla vigente                                         | A J         |

```
POST /inspections
{
  "batchId": "uuid", "stageId": "uuid", "type": "FISICOQUIMICO",
  "scheduledDate": "2026-09-15T09:00:00Z", "responsibleId": "uuid",
  "equipmentId": "uuid", "parameterIds": ["uuid", "uuid"], "notes": "..."
}
```

Reprogramar no sobrescribe la fecha original: marca la inspección como `REPROGRAMADA` y crea otra `PROGRAMADA`, enlazada mediante `rescheduledFromId`.

`POST /inspections/:id/start` responde 422 `EQUIPMENT_NOT_OPERATIONAL` si una inspección fisicoquímica no tiene equipo o este no está operativo.

El detalle de una inspección fisicoquímica agrega `parameterDetails`. Cada
elemento contiene el parámetro esperado, el estándar aplicable resuelto con la
fecha programada, el resultado final vigente y el historial completo de
versiones —incluidos los anulados— ordenado del más reciente al más antiguo. Si
no existe un estándar definitivo aplicable, `applicableStandard` es `null`; la
consulta del detalle sigue disponible, pero el guardado definitivo permanece
bloqueado por `NO_EFFECTIVE_STANDARD`.

```json
POST /inspections/plans/from-template
{
  "batchId": "uuid",
  "templateId": "uuid",
  "responsibleByRole": { "ANALISTA": "uuid", "JEFE_CALIDAD": "uuid" }
}
```

El servidor calcula cada fecha desde `Batch.startDate`, el desplazamiento en días y la hora local `America/Lima`; comprueba que los usuarios tengan el rol esperado y crea todo el plan en una transacción. Un error no deja inspecciones parciales.

---

## 8. Resultados fisicoquímicos — `/physchem`

| Método | Ruta                            | Descripción                                                                                                                 | Acceso |
| ------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| GET    | `/physchem/results`             | Lista. Filtros: `inspectionId`, `parameterId`, `batchId`, `status`                                                          | todos  |
| POST   | `/physchem/results`             | Registra uno o varios resultados de una inspección                                                                          | A J N  |
| POST   | `/physchem/results/validate`    | **Previsualiza** la conformidad sin guardar (RF-M5-03)                                                                      | A J N  |
| POST   | `/physchem/results/:id/correct` | Anula un resultado y registra su reemplazo en una sola transacción                                                          | A J N  |
| GET    | `/physchem/history`             | Histórico paginado. Query: `parameterId`, `piscoTypeId?`, `page`, `pageSize`                                                | todos  |
| GET    | `/physchem/control-chart`       | Datos comparables. Query obligatoria: `parameterId`, `piscoTypeId`, `stageId`; opcional: `standardId`, `dateFrom`, `dateTo` | todos  |

```
POST /physchem/results/validate
{ "inspectionId": "uuid", "results": [ { "parameterId": "uuid", "value": 41.5 } ] }

200 si todos los parámetros tienen estándar vigente
{ "success": true, "data": [ {
    "parameterId": "uuid", "value": 41.5, "status": "CONFORME",
    "standard": { "minValue": 38, "maxValue": 48, "referenceNorm": "NTP 211.001:2020" }
}]}
```

Si falta un estándar aplicable, la respuesta es 422 `NO_EFFECTIVE_STANDARD`; ese elemento no recibe estado `CONFORME` y el extremo de guardado rechaza toda la operación.

```json
POST /physchem/results/:id/correct
{
  "reason": "Error de transcripción",
  "value": 40.8,
  "observation": "Valor verificado en hoja de laboratorio",
  "equipmentId": "uuid"
}
```

La respuesta incluye el resultado anterior anulado, el reemplazo y la NC automática anulada o creada, según corresponda.

```
GET /physchem/control-chart?parameterId=uuid&piscoTypeId=uuid&stageId=uuid

200
{ "success": true, "data": {
    "points": [ { "date": "2026-09-01", "value": 41.5, "batchCode": "LT-2026-0001", "outOfControl": false } ],
    "centerLine": 41.2, "upperControlLimit": 44.8, "lowerControlLimit": 37.6,
    "sampleSize": 12, "sufficientData": true
}}
```

> Con menos de 8 mediciones: `sufficientData: false`, sin límites calculados. Se excluyen resultados anulados y datos `DEMO` salvo `includeDemo=true`, permitido solo para A/J y claramente indicado en la respuesta.

**Al guardar un resultado `NO_CONFORME`, el servicio crea automáticamente la no conformidad** (RF-M5-04) y la devuelve en la respuesta.

---

## 9. Evaluación organoléptica — `/sensory`

| Método | Ruta                            | Descripción                                              | Acceso |
| ------ | ------------------------------- | -------------------------------------------------------- | ------ |
| GET    | `/sensory/sessions`             | Lista. Filtros: `batchId`, `inspectionId`, `status`      | todos  |
| GET    | `/sensory/sessions/:id`         | Detalle con panelistas y calificaciones                  | todos  |
| POST   | `/sensory/sessions`             | Registra la sesión completa                              | A J N  |
| POST   | `/sensory/sessions/:id/correct` | Crea una versión corregida y anula la anterior           | A J N  |
| GET    | `/sensory/sessions/:id/profile` | Perfil sensorial promedio para gráfico radial            | todos  |
| GET    | `/sensory/compare`              | Compara perfiles. Query: `sessionIds` separados por coma | todos  |

```
POST /sensory/sessions
{
  "inspectionId": "uuid", "sessionDate": "2026-11-10",
  "panelists": [
    { "userId": "uuid", "scores": [ { "attributeId": "uuid", "score": 4, "descriptor": "frutal" } ] },
    { "externalName": "Panelista externo", "scores": [ ... ] }
  ],
  "defectsFound": null, "notes": "..."
}
```

> El servidor resuelve y conserva el umbral vigente, calcula el promedio y devuelve `appliedThreshold`. Si no existe umbral aplicable responde 422 `NO_EFFECTIVE_SENSORY_THRESHOLD`. Si el promedio es inferior, genera automáticamente la no conformidad con la severidad configurada.
> 🚫 No existe ningún extremo que agregue, promedie o compare panelistas entre sí. No se debe crear.

---

## 10. No conformidades — `/nonconformities`

| Método | Ruta                                         | Descripción                                                                                                                  | Acceso  |
| ------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| GET    | `/nonconformities`                           | Lista. Filtros: `status`, `severity`, `batchId`, `stageId`, `origin`, `assignedToId`, `assignedAreaId`, `dateFrom`, `dateTo` | todos   |
| GET    | `/nonconformities/:id`                       | Detalle con acciones y tiempos calculados                                                                                    | todos   |
| POST   | `/nonconformities`                           | Registra manualmente                                                                                                         | A J N O |
| PATCH  | `/nonconformities/:id`                       | Actualiza descripción, severidad, causa raíz, responsable y área responsable                                                 | A J N   |
| POST   | `/nonconformities/:id/start-attention`       | Registra el inicio de atención                                                                                               | A J N   |
| POST   | `/nonconformities/:id/close`                 | Cierra la no conformidad                                                                                                     | A J     |
| GET    | `/nonconformities/:id/actions`               | Acciones de la no conformidad                                                                                                | todos   |
| POST   | `/nonconformities/:id/actions`               | Registra una acción                                                                                                          | A J N   |
| PATCH  | `/nonconformities/actions/:actionId`         | Actualiza la acción                                                                                                          | A J N   |
| POST   | `/nonconformities/actions/:actionId/execute` | Registra la ejecución                                                                                                        | A J N   |
| POST   | `/nonconformities/actions/:actionId/verify`  | Verifica la eficacia                                                                                                         | A J     |

```
GET /nonconformities/:id
200
{ "success": true, "data": {
    "code": "NC-2026-0007", "severity": "MODERADA", "status": "EN_VERIFICACION",
    "detectedAt": "2026-10-02T08:30:00Z",
    "attentionStartedAt": "2026-10-02T11:00:00Z",
    "responseTimeHours": 2.5,
    "closureTimeHours": null,
    "actions": [ { "type": "CORRECTIVA", "status": "EJECUTADA", "isEffective": null } ]
}}

POST /nonconformities/:id/close
409 si alguna acción no está VERIFICADA
→ { "code": "NC_HAS_UNVERIFIED_ACTIONS" }

POST /nonconformities/actions/:actionId/verify
{ "isEffective": false, "verificationComment": "..." }
→ La no conformidad regresa a EN_TRATAMIENTO
```

---

## 11. Reportes e indicadores — `/reports`

| Método | Ruta                                 | Descripción                                                       | Acceso |
| ------ | ------------------------------------ | ----------------------------------------------------------------- | ------ |
| GET    | `/reports/dashboard`                 | Indicadores. Query: `dateFrom`, `dateTo`; `includeDemo` solo A/J  | todos  |
| GET    | `/reports/conformity-rate`           | Porcentaje de conformidad, con desglose                           | A J N  |
| GET    | `/reports/schedule-compliance`       | Cumplimiento de la programación                                   | A J N  |
| GET    | `/reports/response-time`             | Tiempo promedio de respuesta ante no conformidades                | A J N  |
| GET    | `/reports/nc-by-stage`               | No conformidades por etapa                                        | A J N  |
| GET    | `/reports/conformity-trend`          | Evolución mensual de la conformidad                               | A J N  |
| GET    | `/reports/traceability/:batchId/pdf` | Reporte de trazabilidad en PDF                                    | A J N  |
| GET    | `/reports/inspections/excel`         | Inspecciones en Excel. Acepta todos los filtros de `/inspections` | A J N  |
| GET    | `/reports/nonconformities/excel`     | No conformidades y acciones en Excel                              | A J N  |
| GET    | `/reports/results/excel`             | Resultados por parámetro en Excel                                 | A J N  |

```
GET /reports/dashboard?dateFrom=2026-09-01&dateTo=2026-12-31
200
{ "success": true, "data": {
    "conformityRate": { "value": 92.4, "conforming": 85, "total": 92, "physchem": 93.1, "sensory": 88.9 },
    "scheduleCompliance": { "value": 87.5, "onTime": 21, "due": 24, "late": 2, "overdue": 1 },
    "avgResponseTime": { "hours": 3.2, "attended": 8, "unattended": 1, "oldestUnattendedHours": 9.4 },
    "openNonConformities": { "LEVE": 2, "MODERADA": 1, "CRITICA": 0 },
    "activeBatchesByStage": [ { "stageName": "Fermentación", "count": 3 } ],
    "ncByStage": [ ... ],
    "conformityTrend": [ { "month": "2026-09", "rate": 90.1 } ]
}}
```

Cada KPI sigue exactamente la fórmula de `02-REQUERIMIENTOS-FUNCIONALES.md`. Una serie temporal incluye `sampleSize`; los valores sin denominador se devuelven como `null`.

> Todo extremo de reporte acepta los filtros aplicables de `RF-M8-13`. Las exportaciones devuelven el archivo binario con la cabecera `Content-Disposition` correspondiente y registran un evento de auditoría de tipo `EXPORT`. `dataOrigin=DEMO` queda excluido por defecto.

---

## 12. Auditoría, notificaciones y búsqueda

| Método | Ruta                          | Descripción                                                                       | Acceso      |
| ------ | ----------------------------- | --------------------------------------------------------------------------------- | ----------- |
| GET    | `/audit`                      | Bitácora. Filtros: `userId`, `entity`, `entityId`, `action`, `dateFrom`, `dateTo` | A J         |
| GET    | `/notifications`              | Notificaciones del usuario en sesión. Filtro: `isRead`                            | autenticado |
| PATCH  | `/notifications/:id/read`     | Marca como leída                                                                  | autenticado |
| PATCH  | `/notifications/read-all`     | Marca todas como leídas                                                           | autenticado |
| GET    | `/notifications/unread-count` | Contador de no leídas                                                             | autenticado |
| GET    | `/search`                     | Busca lotes, inspecciones y NC. Query: `q`, `types?`, `limitPerType?`             | autenticado |

> La bitácora no expone `POST`, `PATCH` ni `DELETE`. Solo lectura (RF-AUD-04).

---

## 13. Catálogo de códigos de error de negocio

| Código                               | Situación                                                             |
| ------------------------------------ | --------------------------------------------------------------------- |
| `INVALID_CREDENTIALS`                | Correo o contraseña incorrectos                                       |
| `ACCOUNT_LOCKED`                     | Cuenta bloqueada por intentos fallidos                                |
| `TOKEN_EXPIRED`                      | Token de acceso vencido                                               |
| `INSUFFICIENT_PERMISSIONS`           | El rol no autoriza la operación                                       |
| `LAST_STAGE_REACHED`                 | El lote ya se encuentra en la última etapa                            |
| `BATCH_STAGE_ALREADY_CLOSED`         | La etapa actual fue cerrada por otra operación                        |
| `BATCH_NOT_MUTABLE`                  | El lote está cerrado, rechazado o cambió simultáneamente              |
| `BATCH_IDENTITY_FROZEN`              | Tipo, variedades o fecha inicial ya no pueden modificarse             |
| `OPEN_NONCONFORMITIES`               | No se puede cerrar el lote con no conformidades abiertas              |
| `INVALID_PISCO_COMPOSITION`          | La composición no corresponde al tipo Puro o Acholado                 |
| `BATCH_CODE_EXHAUSTED`               | Se agotó la secuencia anual `LT-AAAA-NNNN`                            |
| `INSPECTION_ALREADY_COMPLETED`       | La inspección ya fue completada                                       |
| `INSPECTION_NOT_STARTED`             | No se puede registrar resultados de una inspección no iniciada        |
| `RESULT_ALREADY_ANNULLED`            | El resultado ya fue anulado                                           |
| `RESULT_IMMUTABLE`                   | Intento de modificar un resultado guardado                            |
| `NO_EFFECTIVE_STANDARD`              | No hay estándar vigente para el parámetro en esa fecha                |
| `NO_EFFECTIVE_SENSORY_THRESHOLD`     | No hay umbral sensorial vigente para el tipo y fecha                  |
| `PROVISIONAL_STANDARD_FOR_REAL_DATA` | Un estándar provisional no puede evaluar un lote real                 |
| `OVERLAPPING_VALIDITY`               | El intervalo se superpone con otra versión del mismo ámbito           |
| `BATCH_IDENTIFICATION_LOCKED`        | Tipo, variedades o fecha ya no pueden cambiarse por existir actividad |
| `EQUIPMENT_NOT_OPERATIONAL`          | El equipo debe reemplazarse antes de iniciar la inspección            |
| `NC_HAS_UNVERIFIED_ACTIONS`          | No se puede cerrar la no conformidad                                  |
| `NC_ALREADY_CLOSED`                  | La no conformidad ya está cerrada                                     |
| `ACTION_NOT_EXECUTED`                | No se puede verificar una acción no ejecutada                         |
| `VERIFIER_SAME_AS_RESPONSIBLE`       | La misma persona no puede ejecutar y verificar la acción              |
| `MASTER_IN_USE`                      | El maestro tiene registros asociados; solo admite baja lógica         |
| `DUPLICATE_CODE`                     | El código ya existe                                                   |
| `INSUFFICIENT_DATA`                  | Datos insuficientes para el gráfico de control                        |
| `DATABASE_UNAVAILABLE`               | PostgreSQL no respondió a la comprobación de salud                    |
