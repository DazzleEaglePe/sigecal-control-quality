# 13 · CHECKLIST OPERATIVO — SPRINT 4

**Objetivo:** implementar programación de inspecciones y análisis fisicoquímico con estándares vigentes, resultados finales inmutables y generación transaccional de no conformidades.

## 1. Contratos antes del código

- [ ] Definir DTO Zod para listado, calendario, alta, edición y detalle de inspección.
- [ ] Definir DTO para inicio, reprogramación, cancelación, pendientes, cobertura y plan desde plantilla.
- [ ] Definir DTO para prevalidación, registro, corrección, histórico y gráfico de control fisicoquímico.
- [ ] Documentar `/inspections`, plantillas y `/physchem` en OpenAPI antes de exponer rutas.
- [ ] Mantener `dataOrigin`, estado de conformidad, estándar aplicado y autor técnico fuera de entradas manipulables.

## 2. Programación de inspecciones · M4

- [ ] Generar códigos `INS-AAAA-NNNN` con transacción serializable y reintento de colisiones.
- [ ] Validar lote accesible y no terminal, etapa, responsable activo, tipo, fecha y parámetros únicos activos.
- [ ] Exigir al menos un parámetro en inspecciones fisicoquímicas y conservar la selección esperada.
- [ ] Heredar `dataOrigin` del lote sin aceptar ese campo desde HTTP.
- [ ] Permitir edición únicamente antes de iniciar y auditar cada cambio.
- [ ] Reprogramar creando otra inspección y marcando la original `REPROGRAMADA`, sin sobrescribir la fecha histórica.
- [ ] Cancelar solo `PROGRAMADA` o `VENCIDA` y exigir motivo.
- [ ] Iniciar `PROGRAMADA` o `VENCIDA`; exigir equipo `OPERATIVO` para tipo fisicoquímico.
- [ ] Marcar vencidas mediante una operación idempotente y segura para ejecución programada.
- [ ] Crear plantillas versionadas sin solapamiento de vigencia por tipo de pisco.
- [ ] Generar el plan completo desde plantilla en una transacción y calcular fechas en `America/Lima`.
- [ ] Validar que cada usuario asignado cumpla el rol esperado por la plantilla.
- [ ] Aplicar alcance de `OPERARIO` antes de filtros, paginación, calendario y totales.

## 3. Resultados fisicoquímicos · M5

- [ ] Resolver el estándar vigente por parámetro, tipo de pisco y **fecha de la inspección**.
- [ ] Bloquear con `NO_EFFECTIVE_STANDARD` si falta estándar o si es provisional para un lote `REAL`.
- [ ] Comparar decimales exactos contra límites inclusivos, sin redondeo previo.
- [ ] Previsualizar conformidad sin guardar ni generar efectos secundarios.
- [ ] Registrar solo parámetros esperados de una inspección `EN_PROCESO` y usar equipo `OPERATIVO`.
- [ ] Copiar referencia de calibración, estándar aplicado, fecha, analista y origen al resultado final.
- [ ] Crear automáticamente una no conformidad por cada resultado `NO_CONFORME` en la misma transacción.
- [ ] Completar la inspección solo cuando todos sus parámetros tengan exactamente un resultado final vigente.
- [ ] Corregir creando un reemplazo; anular el anterior y ajustar su no conformidad automática transaccionalmente.
- [ ] Impedir `PATCH` o cualquier edición directa de valores técnicos finales.
- [ ] Implementar histórico paginado excluyendo anulados y `DEMO` por defecto.
- [ ] Calcular gráfico de control con media y ±3σ solo desde ocho mediciones comparables o más.

## 4. Backend por capas

- [ ] Implementar módulos `inspection-templates`, `inspections` y `physchem` con rutas → controladores → servicios → repositorios → Prisma.
- [ ] Proteger cada ruta con autenticación, RBAC, alcance y validación Zod.
- [ ] Mantener transaccionales alta de plan, reprogramación, resultados, NC automática y corrección.
- [ ] Auditar creación, cambios de estado, reprogramación, cancelación, registro y corrección.
- [ ] Consolidar en el detalle parámetros esperados, estándar aplicable, resultados vigentes e historial.
- [ ] Exponer listados paginados y consultas de calendario acotadas por rango.

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

- [ ] Probar transiciones válidas e inválidas, equipo no operativo, vencimiento idempotente y reprogramación inmutable.
- [ ] Probar vigencias en los bordes, ausencia de estándar y bloqueo de estándar provisional para `REAL`.
- [ ] Probar conformidad en ambos límites con precisión decimal y creación automática de NC.
- [ ] Probar corrección inmutable y reemplazo/anulación transaccional de la NC asociada.
- [ ] Probar completado por cobertura exacta de parámetros y alcance de `OPERARIO`.
- [ ] Probar media, desviación estándar, ±3σ, muestra menor de ocho y exclusión de `DEMO`/anulados.
- [ ] Verificar recorridos HTTP y de navegador sin alterar los cinco lotes `DEMO` del seed.
- [ ] Ejecutar formato, lint, tipos, pruebas, builds, Prisma, OpenAPI y verificación del seed.
- [ ] Actualizar plan, contrato y estado documental.

**Criterio de cierre:** una inspección puede programarse, iniciarse y completarse con todos sus parámetros; cada resultado queda ligado al estándar vigente de la fecha de inspección, un valor no conforme crea su NC y ninguna corrección destruye el historial.

## Orden de ejecución aprobado

1. Contratos compartidos y OpenAPI.
2. Plantillas e inspecciones en backend, con pruebas de dominio y transacciones.
3. Resultados fisicoquímicos, conformidad, NC automática e inmutabilidad.
4. Listado, calendario, programación y ejecución en frontend.
5. Histórico, gráfico de control y recorrido integral.
