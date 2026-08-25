# 12 · CHECKLIST OPERATIVO — SPRINT 3

**Objetivo:** implementar lotes y trazabilidad preservando la secuencia productiva, el alcance por usuario y la separación `REAL`/`DEMO`.

## 1. Contratos

- [x] Definir DTO Zod para listado paginado, alta, edición y detalle de lote.
- [x] Definir DTO para avance de etapa, cierre, rechazo, línea de tiempo y ficha de trazabilidad.
- [x] Documentar todas las rutas `/batches` en OpenAPI antes de exponerlas.
- [x] Mantener `dataOrigin` fuera de formularios operativos; toda alta HTTP crea datos `REAL`.

## 2. Reglas de dominio

- [x] Generar códigos `LT-AAAA-NNNN` sin colisiones y dentro de una transacción.
- [x] Exigir una variedad para Puro y al menos dos para Acholado.
- [x] Validar variedades únicas, activas y porcentajes que sumen 100 cuando se informan.
- [x] Abrir automáticamente la etapa de secuencia 1 al crear el lote.
- [x] Impedir saltos de etapa y mantener una única etapa abierta.
- [x] Congelar tipo, variedades y fecha inicial después de avanzar o programar una inspección.
- [x] Impedir mutaciones productivas en lotes cerrados o rechazados.
- [x] Impedir el cierre con no conformidades abiertas.
- [x] Restringir rechazo y cierre a `ADMIN` o `JEFE_CALIDAD`.

## 3. Backend por capas

- [x] Implementar repositorio transaccional con auditoría.
- [x] Implementar servicio sin dependencias de Express ni Prisma.
- [x] Implementar controlador y rutas con autenticación, RBAC y validación.
- [x] Aplicar alcance: `OPERARIO` solo consulta lotes donde es creador o responsable de etapa/inspección.
- [x] Implementar filtros y paginación antes de calcular totales.
- [x] Consolidar etapas, inspecciones y no conformidades en la línea de tiempo.
- [x] Implementar ficha de trazabilidad en una única respuesta.
- [x] Generar QR que enlace a la ficha del lote.

## 4. Interfaz

- [x] Habilitar navegación de Lotes solo para usuarios con permiso operativo o de consulta.
- [x] Crear listado con búsqueda, filtros, estados y paginación.
- [x] Crear alta con composición varietal y suma de porcentajes visible.
- [x] Crear detalle con datos generales, QR y acciones autorizadas.
- [x] Crear línea de tiempo de seis etapas con etapa actual y pendientes.
- [x] Mostrar conteos de inspecciones y no conformidades por etapa sin inventar resultados.
- [x] Confirmar explícitamente avance, cierre y rechazo antes de mutar estado.

## 5. Calidad y cierre

- [x] Probar composición Puro/Acholado y suma de porcentajes.
- [x] Probar generación concurrente de código y secuencia de etapas.
- [x] Probar congelamiento, terminalidad, cierre con NC y alcance de `OPERARIO`.
- [x] Verificar recorrido real de creación, avance y consulta de línea de tiempo.
- [x] Ejecutar formato, lint, tipos, pruebas, builds, Prisma y OpenAPI.
- [x] Actualizar el plan y el estado documental.

**Criterio de cierre:** un lote puede registrarse y recorrer en orden las seis etapas; su detalle y línea de tiempo conservan responsables, fechas, inspecciones y no conformidades, sin exponer a un `OPERARIO` lotes ajenos.

## Evidencia de cierre · 24/08/2026

- Recorrido HTTP real validado: creación `REAL`, avance, congelamiento de identidad, línea de tiempo de seis etapas, QR, cierre y rechazo bloqueado después del cierre.
- Interfaz validada en navegador: listado, filtros, alta responsiva, detalle, QR y pestañas de línea de tiempo, inspecciones y no conformidades sin errores de consola.
- Pruebas de regresión específicas para contrato de línea de tiempo, colisiones de código, terminalidad, cierre con no conformidades y alcance de `OPERARIO`.
- Verificación integral superada: 90 pruebas en 32 archivos, lint, TypeScript estricto, builds de producción, Prisma, OpenAPI y seed controlado.
- Datos temporales del recorrido eliminados; la bitácora de auditoría permanece inmutable por diseño.
