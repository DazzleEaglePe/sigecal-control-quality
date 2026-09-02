# 08 · PANTALLAS, FLUJOS Y ACCESIBILIDAD

> La usabilidad no es un detalle estético en este proyecto: los ítems A4-01 a A4-06 del instrumento la miden directamente. Una interfaz confusa baja las calificaciones de la tesis.

---

## 1. Mapa de navegación

```
/login

/  (tablero)
├── /buscar                           → resultados globales según permisos
├── /lotes
│   ├── /lotes/nuevo
│   └── /lotes/:id                 → pestañas: Datos · Línea de tiempo · Inspecciones · No conformidades
├── /inspecciones
│   ├── /inspecciones/calendario
│   ├── /inspecciones/nueva
│   └── /inspecciones/:id          → ejecución y registro de resultados
├── /analisis
│   ├── /analisis/historico
│   └── /analisis/grafico-control
├── /organoleptico
│   ├── /organoleptico/nueva
│   └── /organoleptico/:id
├── /no-conformidades
│   ├── /no-conformidades/nueva
│   └── /no-conformidades/:id      → ciclo completo con acciones
├── /reportes
├── /configuracion                 → ADMIN · JEFE_CALIDAD
│   ├── /configuracion/parametros
│   ├── /configuracion/estandares
│   ├── /configuracion/umbrales-sensoriales
│   ├── /configuracion/plantillas-inspeccion
│   ├── /configuracion/maestros
│   ├── /configuracion/areas
│   └── /configuracion/equipos
├── /usuarios                      → ADMIN
├── /activar-cuenta                → público con token
├── /recuperar-contrasena          → público
├── /restablecer-contrasena        → público con token
└── /auditoria                     → ADMIN · JEFE_CALIDAD
```

**Estructura permanente:** barra lateral con la navegación (colapsable en pantallas angostas) + barra superior con búsqueda global, nombre del usuario, contador de notificaciones y cierre de sesión. La sección activa siempre está señalada (RNF-US-07).

---

## 2. Pantallas

### 2.0 Acceso y administración de cuentas

- El acceso incluye “Olvidé mi contraseña”, siempre con confirmación genérica.
- La invitación permite definir y confirmar la primera contraseña; no muestra
  ni solicita una clave provisional enviada por correo.
- La recuperación valida el token temporal y solicita contraseña y confirmación.
- `/usuarios` ofrece búsqueda, filtros, paginación, alta, edición, cambio de
  estado, reenvío de invitación e inicio de recuperación administrativa.
- “Cambiar mi contraseña” permanece disponible desde el menú de sesión para
  cualquier usuario autenticado.

### 2.1 Tablero `/`

Es la primera impresión del sistema y lo que el jurado verá primero.

| Zona                       | Contenido                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Fila de indicadores        | 4 tarjetas: conformidad (%), cumplimiento de programación (%), tiempo promedio de respuesta (h), no conformidades abiertas |
| Mis pendientes             | Inspecciones asignadas al usuario, ordenadas por fecha. Las vencidas se destacan                                           |
| Lotes por etapa            | Barras horizontales con la cantidad de lotes en cada etapa                                                                 |
| No conformidades por etapa | Gráfico de barras                                                                                                          |
| Evolución de conformidad   | Gráfico de líneas por mes                                                                                                  |
| Alertas                    | Acciones correctivas con fecha comprometida vencida                                                                        |

Filtro global de rango de fechas en la parte superior.

Los datos de demostración están excluidos por defecto. `ADMIN` y `JEFE_CALIDAD` pueden activar “Incluir demostración”; al hacerlo, el tablero muestra una franja visible para evitar confundir esos indicadores con la operación real.

### 2.2 Listado de lotes `/lotes`

Tabla con: código, variedad, tipo, etapa actual, estado, fecha de inicio, volumen, indicador de no conformidades abiertas.
Filtros visibles: búsqueda por código, estado, variedad, etapa, rango de fechas. Botón "Nuevo lote". Paginación en servidor.

El formulario admite una o varias variedades. Si el tipo es Acholado exige al menos dos y permite indicar porcentajes; si se informan, muestra suma acumulada y exige 100 %. Para Puro permite exactamente una variedad.

### 2.3 Detalle de lote `/lotes/:id`

Encabezado con el código, el estado y los botones de acción disponibles según el estado y el rol.

**Pestaña Línea de tiempo** — la pantalla más importante para el ítem A4-16. Muestra verticalmente las 6 etapas del proceso:

```
✅ Recepción de uva      02/09/2026 · Resp. J. Ramos
   └ 1 inspección · 0 no conformidades
✅ Molienda              04/09/2026 · Resp. M. Quispe
   └ 1 inspección · 0 no conformidades
🔵 Fermentación          08/09/2026 · Resp. M. Quispe     ← ETAPA ACTUAL
   └ 2 inspecciones · ⚠ 1 no conformidad abierta
⚪ Destilación           pendiente
⚪ Reposo                pendiente
⚪ Embotellado           pendiente
```

Cada etapa completada es expandible para ver sus inspecciones, resultados y no conformidades. La etapa actual ofrece el botón "Avanzar a la siguiente etapa".

**Pestañas restantes:** Datos generales (con el QR descargable), Inspecciones del lote, No conformidades del lote.

### 2.4 Calendario de inspecciones `/inspecciones/calendario`

Vista mensual con conmutador a vista semanal. Cada inspección se representa como un elemento coloreado por estado:

| Estado     | Color |
| ---------- | ----- |
| Programada | Azul  |
| En proceso | Ámbar |
| Completada | Verde |
| Vencida    | Rojo  |
| Cancelada  | Gris  |

Al hacer clic se abre un panel lateral con el detalle y las acciones. Filtros por responsable, lote y tipo.

> El color **nunca** es el único portador de información: cada elemento incluye además una etiqueta de texto con el estado (WCAG 1.4.1).

### 2.5 Ejecución de inspección `/inspecciones/:id`

Pantalla optimizada para tableta, porque se usa en planta.

- Encabezado: lote, etapa, tipo, responsable, instrumento.
- Un campo por cada parámetro a medir, con su unidad visible y el rango del estándar mostrado como referencia.
- **Validación en el momento de digitar** (RF-M5-03): al salir del campo, aparece de inmediato el resultado.

```
Grado alcohólico  [ 41.5 ] % vol.
                  Rango: 38.0 – 48.0     ✅ Conforme

Acidez volátil    [ 1.85 ] g/L
                  Rango: 0.00 – 1.50     ⚠ No conforme
                  Al guardar se generará una no conformidad.
```

- Campos numéricos amplios, aptos para uso táctil.
- Antes de guardar, resumen de cuántos parámetros resultan conformes y cuántos no.
- Al guardar, confirmación con enlace directo a las no conformidades generadas.
- Si falta un estándar vigente, el campo muestra “Sin estándar aplicable” y bloquea el guardado definitivo. Nunca muestra “Conforme”. El borrador digitado se conserva mientras un usuario autorizado configura el estándar.

### 2.6 Evaluación organoléptica `/organoleptico/nueva`

- Selección de la inspección de tipo organoléptico.
- Agregado de panelistas (usuarios del sistema o nombre externo).
- Matriz de calificación: filas de atributos, columnas de panelistas, escala 1–5.
- Cálculo del promedio por atributo y general, mostrado en vivo.
- Umbral vigente mostrado como dato de solo lectura, con su norma y fecha de vigencia.
- Campo de defectos detectados y observaciones.
- Al guardar, gráfico radial del perfil sensorial.

> 🚫 En ninguna vista se muestran promedios, comparativas ni clasificaciones **por panelista**. Los promedios se calculan por atributo y por sesión, nunca por persona.

Una sesión finalizada no muestra “Editar”. La acción “Corregir sesión” solicita motivo, crea una nueva versión y conserva enlace a la anterior.

### 2.7 Detalle de no conformidad `/no-conformidades/:id`

Estructura en tres bloques verticales que reflejan el ciclo:

**Bloque 1 — Detección.** Origen, lote, etapa, descripción, severidad, quién y cuándo detectó. Si proviene de un resultado, enlace directo a él.

**Bloque 2 — Tiempos.** Presentación destacada, porque es el respaldo de los ítems A5-13 a A5-15:

```
Detección          02/10/2026 08:30
Inicio de atención 02/10/2026 11:00
Tiempo de respuesta                2.5 horas
Cierre             —
```

**Bloque 3 — Acciones correctivas.** Tarjeta por acción con tipo, descripción, responsable, fecha comprometida, fecha de ejecución y estado de verificación. Las acciones vencidas se destacan. El botón "Cerrar no conformidad" permanece deshabilitado con una explicación visible mientras existan acciones sin verificar — no se oculta, se explica.

### 2.8 Gráfico de control `/analisis/grafico-control`

Selector de parámetro y de rango de fechas. Gráfico de líneas con la línea central, los límites superior e inferior de control y los puntos de medición. Los puntos fuera de límites se marcan y se listan debajo con su lote de origen. Con menos de 8 mediciones se muestra un aviso claro de datos insuficientes en lugar de un gráfico engañoso.

### 2.9 Reportes `/reportes`

Una tarjeta por reporte disponible. Al elegir uno se despliega su panel de filtros (rango de fechas, lote, etapa, responsable, estado) y los botones de exportación. Vista previa en pantalla antes de exportar.

### 2.10 Búsqueda global `/buscar`

La barra superior busca por código o texto y agrupa resultados en lotes, inspecciones y no conformidades. Cada resultado muestra tipo, código, estado y contexto. Si el usuario no tiene acceso al registro, el resultado no aparece; no se muestra una tarjeta que luego termine en `403`.

### 2.11 Notificaciones

El contador abre un panel con título, fecha, estado de lectura y enlace al registro relacionado. Incluye “Marcar todas como leídas”. Las inspecciones y acciones vencidas conservan texto e ícono, no solo color.

---

## 3. Flujos principales

### Flujo A — Del lote a la no conformidad

```
OPERARIO registra el lote
   → JEFE_CALIDAD programa las inspecciones del lote
   → El sistema notifica al ANALISTA responsable
   → ANALISTA ejecuta la inspección y registra los resultados
   → El sistema valida contra el estándar vigente
   → Un resultado no conforme genera automáticamente la no conformidad
   → El sistema notifica al JEFE_CALIDAD
```

### Flujo B — Ciclo de la no conformidad

```
NC creada (ABIERTA)
   → Alguien inicia la atención        → EN_ANALISIS  [se calcula el tiempo de respuesta]
   → Se registra la causa raíz
   → Se registran las acciones          → EN_TRATAMIENTO
   → Se ejecutan las acciones
   → JEFE_CALIDAD verifica la eficacia  → EN_VERIFICACION
        ├── eficaz     → todas verificadas → habilita el cierre → CERRADA
        └── no eficaz  → regresa a EN_TRATAMIENTO, exige nueva acción
```

### Flujo C — Avance de etapa

```
Usuario solicita avanzar el lote
   → El sistema verifica que la etapa destino sea la inmediatamente siguiente
   → Advierte si la etapa actual tiene inspecciones pendientes o no conformidades abiertas
        (advertencia, no bloqueo — la decisión es del usuario, y queda auditada)
   → Cierra la etapa actual y abre la siguiente
   → Registra el movimiento en la línea de tiempo y en la bitácora
```

---

## 4. Accesibilidad — WCAG 2.2 nivel AA

| Criterio                        | Aplicación                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1.1.1 Contenido no textual      | Todo ícono con significado lleva texto alternativo o etiqueta accesible                            |
| 1.3.1 Información y relaciones  | Encabezados jerárquicos correctos; tablas con `<th>` y `scope`; formularios con `<label>` asociado |
| 1.4.1 Uso del color             | El estado nunca se comunica solo por color: siempre acompaña un texto o un ícono                   |
| 1.4.3 Contraste                 | Mínimo 4.5:1 en texto normal, 3:1 en texto grande. Verificado con Lighthouse                       |
| 1.4.11 Contraste no textual     | Bordes de campos e íconos con contraste mínimo 3:1                                                 |
| 2.1.1 Teclado                   | Toda función operable por teclado, incluidos el calendario y la matriz sensorial                   |
| 2.4.3 Orden del foco            | Orden de tabulación lógico y coincidente con el orden visual                                       |
| 2.4.7 Foco visible              | Anillo de foco claramente visible; prohibido `outline: none` sin reemplazo                         |
| 2.5.8 Tamaño del objetivo       | Objetivos táctiles de 24×24 píxeles como mínimo; en las pantallas de planta, 44×44                 |
| 3.2.2 Al recibir entrada        | Ningún cambio de contexto automático al escribir o seleccionar                                     |
| 3.3.1 Identificación de errores | El error se describe en texto junto al campo, no solo con color                                    |
| 3.3.2 Etiquetas e instrucciones | Todo campo tiene etiqueta permanente. Prohibido usar solo texto de marcador de posición            |
| 4.1.2 Nombre, función, valor    | Componentes personalizados con los roles y estados ARIA correspondientes                           |
| 4.1.3 Mensajes de estado        | Confirmaciones y errores anunciados mediante `aria-live`                                           |

---

## 5. Lenguaje de la interfaz

Todo el contenido visible está en español y usa el vocabulario del dominio (RNF-US-01, ítem A4-04).

| ❌ No usar     | ✅ Usar                                               |
| -------------- | ----------------------------------------------------- |
| Batch          | Lote                                                  |
| Non-conformity | No conformidad                                        |
| Submit         | Guardar                                               |
| Delete         | Eliminar / Desactivar                                 |
| ID             | Código                                                |
| Timestamp      | Fecha y hora                                          |
| Error 500      | No se pudo completar la operación. Intente nuevamente |
| Invalid input  | El grado alcohólico debe estar entre 0 y 100          |
| Dashboard      | Tablero                                               |
| Log            | Bitácora                                              |

**Formatos:** fechas en `dd/mm/aaaa`, horas en formato 24 h, decimales con coma, miles con punto.

---

## 6. Estados de la interfaz

Toda vista que consulte datos contempla cuatro estados. Ninguno puede omitirse:

| Estado        | Comportamiento                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Cargando**  | Esqueleto de contenido o indicador. Nunca pantalla en blanco (RNF-US-08)                                                            |
| **Con datos** | Contenido normal                                                                                                                    |
| **Vacío**     | Mensaje explicativo con la acción sugerida. Ej: "Este lote aún no tiene inspecciones programadas. Programar la primera" (RNF-US-09) |
| **Error**     | Mensaje comprensible y botón de reintento. Nunca un código técnico (RNF-US-04)                                                      |

## 7. Actualización sin recarga manual

Para respaldar el seguimiento “en tiempo real” del Anexo 4 sin introducir WebSockets:

- el cliente invalida y vuelve a consultar los datos después de cada mutación;
- tablero, línea de tiempo y notificaciones se actualizan cada 15 segundos mientras la pestaña está visible;
- al recuperar foco se solicita inmediatamente la versión actual;
- la interfaz muestra “Actualizado hace …” y un botón de actualización manual como respaldo.

---

## 8. Comportamiento sin conexión

| Situación                              | Comportamiento                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Pérdida de conexión                    | Aviso permanente en la barra superior: "Sin conexión. Los datos mostrados pueden estar desactualizados" |
| Consulta de vistas ya visitadas        | Disponibles desde la caché solo durante la sesión previamente iniciada                                  |
| Formulario en curso                    | Los datos digitados se conservan; el botón de guardar se deshabilita con explicación                    |
| Recuperación de la conexión            | Aviso de reconexión y opción de reintentar el guardado                                                  |
| Cierre de sesión                       | Elimina respuestas de API, borradores y datos asociados al usuario                                      |
| Apertura offline sin sesión en memoria | Muestra el shell y solicita conexión; no revela datos operativos                                        |

No se implementa sincronización automática de operaciones pendientes: excede el alcance contratado y añade un riesgo de duplicación de registros que no compensa a esta escala.
