# 13 · CHECKLIST OPERATIVO — SPRINT 4

**Objetivo:** implementar programación de inspecciones y análisis fisicoquímico con estándares vigentes, resultados finales inmutables y generación transaccional de no conformidades.

## 1. Contratos antes del código

- [x] Definir DTO Zod para listado, calendario, alta, edición y detalle de inspección.
- [x] Definir DTO para inicio, reprogramación, cancelación, pendientes, cobertura y plan desde plantilla.
- [x] Definir DTO para prevalidación, registro, corrección, histórico y gráfico de control fisicoquímico.
- [x] Documentar `/inspections`, plantillas y `/physchem` en OpenAPI antes de exponer rutas.
- [x] Mantener `dataOrigin`, estado de conformidad, estándar aplicado y autor técnico fuera de entradas manipulables.

## 2. Programación de inspecciones · M4

- [x] Generar códigos `INS-AAAA-NNNN` con transacción serializable y reintento de colisiones.
- [x] Validar lote accesible y no terminal, etapa, responsable activo, tipo, fecha y parámetros únicos activos.
- [x] Exigir al menos un parámetro en inspecciones fisicoquímicas y conservar la selección esperada.
- [x] Heredar `dataOrigin` del lote sin aceptar ese campo desde HTTP.
- [x] Permitir edición únicamente antes de iniciar y auditar cada cambio.
- [x] Reprogramar creando otra inspección y marcando la original `REPROGRAMADA`, sin sobrescribir la fecha histórica.
- [x] Cancelar solo `PROGRAMADA` o `VENCIDA` y exigir motivo.
- [x] Iniciar `PROGRAMADA` o `VENCIDA`; exigir equipo `OPERATIVO` para tipo fisicoquímico.
- [x] Marcar vencidas mediante una operación idempotente y segura para ejecución programada.
- [x] Crear plantillas versionadas sin solapamiento de vigencia por tipo de pisco.
- [x] Generar el plan completo desde plantilla en una transacción y calcular fechas en `America/Lima`.
- [x] Validar que cada usuario asignado cumpla el rol esperado por la plantilla.
- [x] Aplicar alcance de `OPERARIO` antes de filtros, paginación, calendario y totales.

## 3. Resultados fisicoquímicos · M5

- [x] Resolver el estándar vigente por parámetro, tipo de pisco y **fecha de la inspección**.
- [x] Bloquear con `NO_EFFECTIVE_STANDARD` si falta estándar o si es provisional para un lote `REAL`.
- [x] Comparar decimales exactos contra límites inclusivos, sin redondeo previo.
- [x] Previsualizar conformidad sin guardar ni generar efectos secundarios.
- [x] Registrar solo parámetros esperados de una inspección `EN_PROCESO` y usar equipo `OPERATIVO`.
- [x] Copiar referencia de calibración, estándar aplicado, fecha, analista y origen al resultado final.
- [x] Crear automáticamente una no conformidad por cada resultado `NO_CONFORME` en la misma transacción.
- [x] Completar la inspección solo cuando todos sus parámetros tengan exactamente un resultado final vigente.
- [x] Corregir creando un reemplazo; anular el anterior y ajustar su no conformidad automática transaccionalmente.
- [x] Impedir `PATCH` o cualquier edición directa de valores técnicos finales.
- [x] Implementar histórico paginado excluyendo anulados y `DEMO` por defecto.
- [x] Calcular gráfico de control con media y ±3σ solo desde ocho mediciones comparables o más.

## 4. Backend por capas

- [x] Implementar módulos `inspection-templates`, `inspections` y `physchem` con rutas → controladores → servicios → repositorios → Prisma.
- [x] Proteger cada ruta con autenticación, RBAC, alcance y validación Zod.
- [x] Mantener transaccionales alta de plan, reprogramación, resultados, NC automática y corrección.
- [x] Auditar creación, cambios de estado, reprogramación, cancelación, registro y corrección.
- [ ] Consolidar en el detalle parámetros esperados, estándar aplicable, resultados vigentes e historial.
- [x] Exponer listados paginados y consultas de calendario acotadas por rango.

## 5. Interfaz

- [ ] Habilitar navegación de Inspecciones y el panel “mis inspecciones pendientes”.
- [ ] Crear listado con filtros y calendario mensual/semanal con estado textual además del color.
- [ ] Crear formularios de programación, reprogramación, cancelación y plan desde plantilla.
- [ ] Crear detalle y ejecución optimizados para tableta, con unidad y rango visible por parámetro.
- [ ] Previsualizar conforme/no conforme al salir del campo y conservar el borrador si falta estándar.
- [ ] Mostrar resumen antes de guardar y enlaces a las no conformidades generadas.
- [ ] Crear histórico por parámetro y gráfico de control con aviso de muestra insuficiente.
- [ ] Confirmar explícitamente toda transición o guardado definitivo.

## 6. Calidad y cierre

- [x] Probar transiciones válidas e inválidas, equipo no operativo, vencimiento idempotente y reprogramación inmutable.
- [x] Probar vigencias en los bordes, ausencia de estándar y bloqueo de estándar provisional para `REAL`.
- [x] Probar conformidad en ambos límites con precisión decimal y creación automática de NC.
- [x] Probar corrección inmutable y reemplazo/anulación transaccional de la NC asociada.
- [x] Probar completado por cobertura exacta de parámetros y alcance de `OPERARIO`.
- [x] Probar media, desviación estándar, ±3σ, muestra menor de ocho y exclusión de `DEMO`/anulados.
- [ ] Verificar recorridos HTTP y de navegador sin alterar los cinco lotes `DEMO` del seed.
- [x] Ejecutar formato, lint, tipos, pruebas, builds, Prisma, OpenAPI y verificación del seed.
- [x] Actualizar plan, contrato y estado documental.

**Criterio de cierre:** una inspección puede programarse, iniciarse y completarse con todos sus parámetros; cada resultado queda ligado al estándar vigente de la fecha de inspección, un valor no conforme crea su NC y ninguna corrección destruye el historial.

## Orden de ejecución aprobado

1. Contratos compartidos y OpenAPI.
2. Plantillas e inspecciones en backend, con pruebas de dominio y transacciones.
3. Resultados fisicoquímicos, conformidad, NC automática e inmutabilidad.
4. Listado, calendario, programación y ejecución en frontend.
5. Histórico, gráfico de control y recorrido integral.
