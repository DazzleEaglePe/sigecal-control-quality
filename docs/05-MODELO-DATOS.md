# 05 · MODELO DE DATOS

> Base para el esquema de Prisma. También es el insumo del diagrama entidad-relación del add-on de UML (aún no aprobado).
> Convención: tablas y columnas en inglés, en `snake_case`; modelos de Prisma en `PascalCase`.

---

## 1. Mapa de entidades

```
                    ┌──────────┐
                    │   User   │──── role: Role
                    └────┬─────┘
                         │ registra / es responsable
     ┌───────────────────┼────────────────────┐
     │                   │                    │
┌────▼─────┐      ┌──────▼──────┐     ┌───────▼────────┐
│  Batch   │◄─────┤ Inspection  │────►│ NonConformity  │
│  (lote)  │      └──────┬──────┘     └───────┬────────┘
└────┬─────┘             │                    │
     │              ┌────┴────┐          ┌────▼──────────┐
┌────▼──────┐  ┌────▼───┐ ┌───▼──────┐   │CorrectiveAct. │
│BatchStage │  │PhysChem│ │ Sensory  │   └───────────────┘
│(timeline) │  │ Result │ │ Session  │
└───────────┘  └───┬────┘ └────┬─────┘
                   │           │
             ┌─────▼─────┐ ┌───▼──────────┐
             │ Parameter │ │SensoryScore  │
             │ Standard  │ └──────────────┘
             └───────────┘
```

---

## 2. Enumeraciones

```
Role                 ADMIN · JEFE_CALIDAD · ANALISTA · OPERARIO
AccountTokenType     ACTIVATION · PASSWORD_RESET
BatchStatus          EN_PROCESO · EN_OBSERVACION · CERRADO · RECHAZADO
InspectionType       FISICOQUIMICO · ORGANOLEPTICO
InspectionStatus     PROGRAMADA · EN_PROCESO · COMPLETADA · VENCIDA · CANCELADA · REPROGRAMADA
ParameterType        FISICOQUIMICO · SENSORIAL
ResultStatus         CONFORME · NO_CONFORME · ANULADO
NCStatus             ABIERTA · EN_ANALISIS · EN_TRATAMIENTO · EN_VERIFICACION · CERRADA · ANULADA
NCSeverity           LEVE · MODERADA · CRITICA
NCOrigin             AUTOMATICA_FISICOQUIMICA · AUTOMATICA_SENSORIAL · MANUAL
ActionType           CORRECCION · CORRECTIVA · PREVENTIVA
ActionStatus         PENDIENTE · EN_EJECUCION · EJECUTADA · VERIFICADA · NO_EFICAZ
AuditAction          CREATE · UPDATE · STATE_CHANGE · LOGIN · LOGOUT · EXPORT
EquipmentStatus      OPERATIVO · EN_MANTENIMIENTO · FUERA_DE_SERVICIO
DataOrigin           REAL · DEMO
```

---

## 3. Seguridad y usuarios

### `User`

| Campo                     | Tipo      | Notas                                             |
| ------------------------- | --------- | ------------------------------------------------- |
| `id`                      | uuid      | PK                                                |
| `firstName`               | string    |                                                   |
| `lastName`                | string    |                                                   |
| `email`                   | string    | único                                             |
| `passwordHash`            | string    | bcrypt                                            |
| `role`                    | Role      |                                                   |
| `areaId`                  | → Area?   | unidad organizacional; no implica gestión de RRHH |
| `position`                | string?   | cargo en la empresa                               |
| `isActive`                | boolean   | por defecto `true`                                |
| `mustChangePassword`      | boolean   | `true` para claves provisionales o restablecidas  |
| `emailVerifiedAt`         | datetime? | nulo hasta completar la invitación                |
| `failedAttempts`          | int       | por defecto 0                                     |
| `lockedUntil`             | datetime? | bloqueo temporal                                  |
| `lastLoginAt`             | datetime? |                                                   |
| `createdAt` / `updatedAt` | datetime  |                                                   |

> Nunca se elimina físicamente. RF-M1-04.

### `Area`

`id` · `code` (único) · `name` · `isActive` · `isProvisional` · `createdAt` · `updatedAt`

> Catálogo mínimo para asignación, filtrado y evidencia de coordinación. No almacena nómina, salario, asistencia ni evaluaciones.

### `RefreshToken`

`id` · `userId` → User · `tokenHash` · `expiresAt` · `revokedAt?` · `createdAt`

### `AccountToken`

`id` · `userId` → User · `type` (AccountTokenType) · `tokenHash` (único) ·
`expiresAt` · `usedAt?` · `createdAt`

Solo se persiste el SHA-256 del token. Al emitir uno nuevo se invalidan los
anteriores sin usar del mismo tipo y usuario. Activación y recuperación se
consumen una sola vez y revocan todas las sesiones activas del usuario.

### `AuditLog`

`id` · `userId?` → User · `action` (AuditAction) · `entity` (string) · `entityId` (string) · `before` (json?) · `after` (json?) · `ipAddress?` · `createdAt`

> Solo inserción. Sin actualización ni eliminación desde la aplicación. RF-AUD-04.

### `Notification`

`id` · `userId` → User · `type` · `title` · `message` · `entityType?` · `entityId?` · `isRead` · `createdAt`

---

## 4. Maestros

### `GrapeVariety`

`id` · `code` · `name` · `isActive`

> Datos iniciales: Quebranta, Italia, Torontel, Moscatel, Albilla, Negra Criolla, Uvina, Mollar.

### `PiscoType`

`id` · `code` · `name` · `description?` · `isActive`

> Datos iniciales: Puro, Acholado, Mosto Verde.

### `ProcessStage`

`id` · `code` · `name` · `sequence` (int, único) · `description?` · `isActive`

> Datos iniciales, en orden: Recepción de uva (1), Molienda/Despalillado (2), Fermentación (3), Destilación (4), Reposo (5), Embotellado (6).

### `Parameter`

| Campo        | Tipo          | Notas                               |
| ------------ | ------------- | ----------------------------------- |
| `id`         | uuid          |                                     |
| `code`       | string        | único, ej. `GRAD_ALC`               |
| `name`       | string        | ej. "Grado alcohólico"              |
| `unit`       | string        | ej. "% vol."                        |
| `type`       | ParameterType |                                     |
| `testMethod` | string?       | ej. "Densimetría"                   |
| `decimals`   | int           | precisión de captura, por defecto 2 |
| `isActive`   | boolean       |                                     |

> ⚠️ El agente **no debe inventar** valores normativos. Los parámetros y sus rangos son configurables por el usuario. El script de datos iniciales carga solo los parámetros de referencia de la NTP 211.001 que la tesista confirme; mientras no los confirme, se cargan con rangos marcados como provisionales.

### `Standard`

| Campo             | Tipo            | Notas                                                       |
| ----------------- | --------------- | ----------------------------------------------------------- |
| `id`              | uuid            |                                                             |
| `parameterId`     | → Parameter     |                                                             |
| `piscoTypeId`     | → PiscoType?    | nulo = aplica a todos                                       |
| `stageId`         | → ProcessStage? | nulo = aplica a todas                                       |
| `minValue`        | decimal?        |                                                             |
| `maxValue`        | decimal?        |                                                             |
| `targetValue`     | decimal?        |                                                             |
| `referenceNorm`   | string?         | ej. "NTP 211.001:2020"                                      |
| `defaultSeverity` | NCSeverity      | severidad de la NC automática                               |
| `isProvisional`   | boolean         | `true` hasta confirmación; solo utilizable con datos `DEMO` |
| `validFrom`       | date            |                                                             |
| `validTo`         | date?           | nulo = vigente                                              |
| `isActive`        | boolean         |                                                             |

> **Regla crítica (RF-M2-06):** al validar un resultado se busca el estándar cuya vigencia contenga la fecha de la inspección, no el estándar actual. El resultado guarda el `standardId` aplicado.

**Invariantes de vigencia:**

- `validFrom <= validTo` cuando existe `validTo`.
- No se permiten intervalos superpuestos para el mismo parámetro y el mismo ámbito (`piscoTypeId`, `stageId`).
- Si existen varios ámbitos aplicables, la prioridad es: tipo+etapa → tipo → etapa → general.
- Los límites deben cumplir `minValue <= targetValue <= maxValue` para los valores presentes.
- Un estándar provisional no se aplica a un lote `REAL`.

### `SensoryThreshold`

`id` · `piscoTypeId` → PiscoType? · `minAverage` (decimal 1–5) · `defaultSeverity` (NCSeverity) · `referenceNorm?` · `validFrom` · `validTo?` · `isActive` · `isProvisional`

> Se administra por `ADMIN` y `JEFE_CALIDAD`. La sesión guarda el identificador aplicado; el analista nunca envía el umbral.

### `SensoryAttribute`

`id` · `code` · `name` · `description?` · `sequence` · `isActive`

> Datos iniciales: Intensidad aromática, Calidad aromática, Sabor, Cuerpo, Persistencia, Armonía.

### `Equipment`

`id` · `code` · `name` · `status` (EquipmentStatus) · `lastCalibrationRef?` · `isActive`

> Registro ligero. **No** es un módulo de mantenimiento (fuera de alcance); existe solo para respaldar el ítem A5-08.

---

## 5. Lotes y trazabilidad

### `Batch`

| Campo                     | Tipo           | Notas                                              |
| ------------------------- | -------------- | -------------------------------------------------- |
| `id`                      | uuid           |                                                    |
| `code`                    | string         | único, formato `LT-AAAA-NNNN`                      |
| `piscoTypeId`             | → PiscoType    |                                                    |
| `currentStageId`          | → ProcessStage |                                                    |
| `status`                  | BatchStatus    |                                                    |
| `startDate`               | date           |                                                    |
| `closeDate`               | date?          |                                                    |
| `rejectedAt`              | datetime?      |                                                    |
| `rejectedById`            | → User?        | solo `ADMIN` o `JEFE_CALIDAD`                      |
| `rejectionReason`         | string?        | obligatorio al rechazar                            |
| `volumeLiters`            | decimal        |                                                    |
| `harvestOrigin`           | string?        | parcela o proveedor                                |
| `notes`                   | string?        |                                                    |
| `createdById`             | → User         |                                                    |
| `dataOrigin`              | DataOrigin     | `REAL` por defecto; `DEMO` solo en seed autorizado |
| `createdAt` / `updatedAt` | datetime       |                                                    |

### `BatchGrapeVariety`

`id` · `batchId` → Batch · `varietyId` → GrapeVariety · `percentage?` (decimal) · restricción única `(batchId, varietyId)`

> `Puro` exige exactamente una variedad. `Acholado` exige al menos dos. Si se informan porcentajes, deben sumar 100. La validación se realiza transaccionalmente.

### Transiciones de `Batch`

```text
EN_PROCESO ──NC abierta──> EN_OBSERVACION
EN_OBSERVACION ──última NC cerrada/anulada──> EN_PROCESO
EN_PROCESO ──cierre sin NC abiertas──> CERRADO
EN_PROCESO | EN_OBSERVACION ──rechazo con motivo──> RECHAZADO
```

`CERRADO` y `RECHAZADO` son terminales para datos productivos. Las NC y acciones ya existentes pueden continuar consultándose y, en un lote rechazado, completar su tratamiento.

El tipo de pisco, la composición varietal y la fecha de inicio quedan congelados cuando existe la primera inspección o el lote avanza de la etapa inicial. Volumen, origen y notas permanecen editables mientras el lote no sea terminal; todo cambio queda auditado.

### `BatchStage` _(línea de tiempo)_

`id` · `batchId` → Batch · `stageId` → ProcessStage · `startedAt` · `finishedAt?` · `responsibleId` → User · `observations?`

> Un registro por cada etapa que el lote atraviesa. Es la fuente de la línea de tiempo (RF-M3-05) y la evidencia del ítem A4-16.
> **Restricción:** solo puede abrirse una etapa cuya `sequence` sea exactamente la del `currentStage` + 1 (RF-M3-04).
> Al crear el lote se abre la etapa de secuencia 1. Solo puede existir un `BatchStage` sin `finishedAt` por lote.

---

## 6. Inspecciones

### `Inspection`

| Campo               | Tipo             | Notas                                  |
| ------------------- | ---------------- | -------------------------------------- |
| `id`                | uuid             |                                        |
| `code`              | string           | único, `INS-AAAA-NNNN`                 |
| `batchId`           | → Batch          |                                        |
| `stageId`           | → ProcessStage   |                                        |
| `type`              | InspectionType   |                                        |
| `status`            | InspectionStatus |                                        |
| `scheduledDate`     | datetime         | fecha prevista                         |
| `executedAt`        | datetime?        | fecha real                             |
| `responsibleId`     | → User           |                                        |
| `equipmentId`       | → Equipment?     |                                        |
| `rescheduledFromId` | → Inspection?    | trazabilidad de reprogramaciones       |
| `changeReason`      | string?          | motivo de reprogramación o cancelación |
| `notes`             | string?          |                                        |
| `createdById`       | → User           |                                        |
| `dataOrigin`        | DataOrigin       | heredado del lote; no puede cambiar    |

### `InspectionParameter`

`id` · `inspectionId` → Inspection · `parameterId` → Parameter

> Parámetros que la inspección debe medir (RF-M4-03). Define cuándo la inspección está completa (RF-M5-08).
> Una inspección se completa cuando cada parámetro esperado tiene exactamente un resultado final no anulado. Los registros anulados no cuentan.

**Reprogramación:** la inspección original pasa a `REPROGRAMADA` y se crea otra `PROGRAMADA` con `rescheduledFromId`. La fecha original nunca se sobrescribe.

### Transiciones de `Inspection`

```text
PROGRAMADA → EN_PROCESO | VENCIDA | CANCELADA | REPROGRAMADA
VENCIDA → EN_PROCESO | CANCELADA | REPROGRAMADA
EN_PROCESO → COMPLETADA
COMPLETADA | CANCELADA | REPROGRAMADA → terminal
```

Una inspección fisicoquímica no pasa a `EN_PROCESO` sin equipo asignado ni cuando el equipo no está `OPERATIVO`. Para una inspección organoléptica el equipo puede ser nulo.

### `InspectionTemplate`

`id` · `code` · `name` · `piscoTypeId` → PiscoType · `validFrom` · `validTo?` · `isActive` · `createdById` → User

### `InspectionTemplateItem`

`id` · `templateId` → InspectionTemplate · `stageId` → ProcessStage · `type` (InspectionType) · `offsetDaysFromBatchStart` (int ≥ 0) · `scheduledLocalTime` (time) · `responsibleRole` (Role) · `equipmentId?` → Equipment

### `InspectionTemplateParameter`

`id` · `templateItemId` → InspectionTemplateItem · `parameterId` → Parameter

> Estas entidades respaldan la frecuencia por etapa y la creación reproducible del plan de inspecciones (RF-M4-10 y A5-05).

---

## 7. Resultados fisicoquímicos

### `PhysChemResult`

| Campo            | Tipo              | Notas                                               |
| ---------------- | ----------------- | --------------------------------------------------- |
| `id`             | uuid              |                                                     |
| `inspectionId`   | → Inspection      |                                                     |
| `parameterId`    | → Parameter       |                                                     |
| `standardId`     | → Standard        | estándar aplicado al momento; obligatorio           |
| `value`          | decimal           |                                                     |
| `status`         | ResultStatus      | calculado por el sistema                            |
| `observation`    | string?           |                                                     |
| `equipmentId`    | → Equipment       | instrumento efectivamente utilizado                 |
| `calibrationRef` | string?           | copia de la referencia vigente al medir             |
| `recordedById`   | → User            |                                                     |
| `recordedAt`     | datetime          |                                                     |
| `dataOrigin`     | DataOrigin        | heredado del lote y almacenado para filtrado seguro |
| `annulledById`   | → User?           | quien lo anuló                                      |
| `annulledAt`     | datetime?         |                                                     |
| `annulReason`    | string?           |                                                     |
| `replacesId`     | → PhysChemResult? | resultado que corrige                               |

> **Inmutable (ADR-004).** Nunca se actualizan `value`, `parameterId`, `standardId`, `equipmentId`, `calibrationRef`, autor ni fecha técnica. Una corrección crea un registro nuevo con `replacesId`; al anterior solo se le agregan `status = ANULADO` y metadatos de anulación. Todo ocurre en una transacción.

**Regla de conformidad:**

```
si standard.minValue existe y value < minValue  → NO_CONFORME
si standard.maxValue existe y value > maxValue  → NO_CONFORME
si no existe estándar vigente                   → ERROR NO_EFFECTIVE_STANDARD; no guardar
en otro caso                                     → CONFORME
```

Comparación con precisión decimal exacta, sin redondeo previo (RNF-AF-02).

Si el resultado anulado originó una no conformidad automática, la misma transacción la anula. Si el reemplazo también es no conforme, se crea una nueva NC enlazada al reemplazo y con la severidad configurada en el estándar.

---

## 8. Evaluación organoléptica

### `SensorySession`

`id` · `inspectionId` → Inspection · `sessionDate` · `overallAverage` (decimal, calculado) · `sensoryThresholdId` → SensoryThreshold · `appliedThreshold` (decimal, copia inmutable) · `status` (ResultStatus) · `defectsFound` (string?) · `notes?` · `recordedById` → User · `recordedAt` · `dataOrigin` (DataOrigin) · `annulledById?` → User · `annulledAt?` · `annulReason?` · `replacesId?` → SensorySession

> La sesión finalizada es inmutable. Una corrección crea otra sesión, anula la anterior y aplica el umbral vigente a la fecha de la inspección. La NC sensorial automática sigue la misma regla transaccional de anulación/reemplazo que los resultados fisicoquímicos.

### `SensoryPanelist`

`id` · `sessionId` → SensorySession · `userId` → User? · `externalName` (string?)

> Un panelista puede ser un usuario del sistema o una persona externa registrada solo por nombre.

### `SensoryScore`

`id` · `sessionId` → SensorySession · `panelistId` → SensoryPanelist · `attributeId` → SensoryAttribute · `score` (int, 1–5) · `descriptor` (string?)

> 🚫 **Restricción de diseño obligatoria.** Estas calificaciones evalúan el producto. Está **prohibido** construir consultas, vistas, reportes o indicadores que agreguen, promedien, comparen o clasifiquen a los panelistas entre sí. No existe ni existirá un ranking de panelistas.

---

## 9. No conformidades y acciones correctivas

### `NonConformity`

| Campo                | Tipo              | Notas                                           |
| -------------------- | ----------------- | ----------------------------------------------- |
| `id`                 | uuid              |                                                 |
| `code`               | string            | único, `NC-AAAA-NNNN`                           |
| `batchId`            | → Batch           |                                                 |
| `stageId`            | → ProcessStage?   |                                                 |
| `inspectionId`       | → Inspection?     | si proviene de una inspección                   |
| `physChemResultId`   | → PhysChemResult? | si proviene de un resultado                     |
| `sensorySessionId`   | → SensorySession? | si proviene de una sesión sensorial             |
| `origin`             | NCOrigin          |                                                 |
| `severity`           | NCSeverity        |                                                 |
| `status`             | NCStatus          |                                                 |
| `description`        | text              |                                                 |
| `rootCause`          | text?             |                                                 |
| `detectedAt`         | datetime          | **fecha de detección**                          |
| `detectedById`       | → User            |                                                 |
| `assignedToId`       | → User?           | responsable actual de la atención               |
| `assignedAreaId`     | → Area?           | área responsable para trazabilidad              |
| `attentionStartedAt` | datetime?         | **inicio de atención**                          |
| `closedAt`           | datetime?         |                                                 |
| `closedById`         | → User?           | solo `JEFE_CALIDAD`                             |
| `closeComment`       | text?             |                                                 |
| `annulledAt`         | datetime?         | solo para NC automática cuyo origen fue anulado |
| `annulledById`       | → User?           |                                                 |
| `annulReason`        | text?             |                                                 |
| `dataOrigin`         | DataOrigin        | heredado del lote                               |

**Campos calculados (no se almacenan; se derivan):**

```
responseTimeHours = attentionStartedAt − detectedAt        → RF-M7-05
closureTimeHours  = closedAt − detectedAt                  → RF-M7-06
```

### `CorrectiveAction`

| Campo                 | Tipo            | Notas                        |
| --------------------- | --------------- | ---------------------------- |
| `id`                  | uuid            |                              |
| `nonConformityId`     | → NonConformity |                              |
| `type`                | ActionType      |                              |
| `description`         | text            |                              |
| `responsibleId`       | → User          |                              |
| `committedDate`       | date            | fecha comprometida           |
| `executedAt`          | datetime?       |                              |
| `status`              | ActionStatus    |                              |
| `isEffective`         | boolean?        | resultado de la verificación |
| `verifiedById`        | → User?         |                              |
| `verifiedAt`          | datetime?       |                              |
| `verificationComment` | text?           |                              |

> **RF-M7-13:** la no conformidad no puede pasar a `CERRADA` mientras exista alguna acción cuyo `status` no sea `VERIFICADA`. Si una acción resulta `NO_EFICAZ`, la no conformidad regresa a `EN_TRATAMIENTO` y debe registrarse una nueva acción.

### Transiciones de NC y acciones

```text
NC: ABIERTA → EN_ANALISIS → EN_TRATAMIENTO → EN_VERIFICACION → CERRADA
                                      ↑              │
                                      └── acción NO_EFICAZ

Acción: PENDIENTE → EN_EJECUCION → EJECUTADA → VERIFICADA | NO_EFICAZ
```

`ANULADA` solo aplica a una NC automática cuyo resultado o sesión de origen fue anulado. No es una acción manual independiente.

El verificador de eficacia debe ser distinto de `CorrectiveAction.responsibleId`.

---

## 10. Índices requeridos

Para cumplir RNF-EF-05:

```
Batch              → code (único), status, currentStageId, startDate
BatchGrapeVariety  → (batchId, varietyId) único
BatchStage         → (batchId, stageId), startedAt
Inspection         → code (único), batchId, status, scheduledDate, responsibleId
InspectionParameter→ (inspectionId, parameterId) único
PhysChemResult     → inspectionId, parameterId, recordedAt, status
Standard           → (parameterId, validFrom, validTo)
SensoryThreshold   → (piscoTypeId, validFrom, validTo)
InspectionTemplate → (piscoTypeId, validFrom, validTo)
NonConformity      → code (único), batchId, status, severity, detectedAt
CorrectiveAction   → nonConformityId, responsibleId, committedDate, status
AuditLog           → (entity, entityId), userId, createdAt
Notification       → (userId, isRead)
User               → email (único)
Area               → code (único), isActive
```

## 11. Datos iniciales (seed)

| Conjunto              | Contenido                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Usuarios              | Uno por cada rol y área de demostración, con contraseña definida mediante variable de entorno y cambio obligatorio          |
| Áreas                 | Calidad, Laboratorio y Producción, activas pero `isProvisional=true` hasta confirmar los nombres reales                     |
| Variedades            | Las 8 variedades pisqueras                                                                                                  |
| Tipos de pisco        | Puro, Acholado, Mosto Verde                                                                                                 |
| Etapas                | Las 6 etapas del proceso, en orden                                                                                          |
| Atributos sensoriales | Los 6 atributos listados                                                                                                    |
| Parámetros            | Grado alcohólico, acidez volátil, metanol, ésteres, furfural, °Brix, temperatura, pH                                        |
| Estándares y umbrales | Valores de demostración marcados como **provisionales**; no habilitan operación real hasta confirmación                     |
| Equipos               | 3 instrumentos de ejemplo inactivos para operación real                                                                     |
| Lotes de demostración | 5 lotes `DEMO` en distintas etapas, con al menos 8 resultados comparables para un mismo gráfico y 2 NC en distintos estados |

> Los lotes de demostración no son opcionales: sin datos, el sistema no puede mostrarse en la sustentación ni permite generar los gráficos de control, que requieren un mínimo de 8 mediciones históricas.
