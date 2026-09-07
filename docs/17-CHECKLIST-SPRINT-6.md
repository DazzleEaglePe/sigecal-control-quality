# Checklist Sprint 6 — No conformidades y respuesta al feedback

Fecha de corte: 07/09/2026.

## Qué pidió demostrar el ingeniero

- [x] Login completo y navegación protegida.
- [x] Roles diferenciados: `ADMIN`, `JEFE_CALIDAD`, `ANALISTA` y `OPERARIO`.
- [x] Maestros y gestión de usuarios restringidos por permisos del servidor.
- [x] Un módulo elaborado de extremo a extremo: no conformidades y acciones.
- [x] Validaciones de entrada, referencias, estados, responsables y cierre.
- [x] Interfaz responsiva usable desde navegador móvil.

## Observaciones técnicas corregidas

- [x] Separar las opciones mínimas de responsables del directorio exclusivo de `ADMIN`.
- [x] Impedir el cierre sin acciones, con acciones pendientes o con una acción `NO_EFICAZ`.
- [x] Serializar cierre y escrituras de acciones para evitar estados inconsistentes.
- [x] Corregir la validación del lote al editar una no conformidad.
- [x] Revocar access y refresh JWT tras cambios de contraseña, correo, rol o desactivación.
- [x] Invalidar enlaces pendientes tras cambios de credenciales.
- [x] Mantener genérica la recuperación pública aunque falle SMTP.
- [x] Ejecutar pruebas reales en PostgreSQL desechable sin tocar los datos de desarrollo.

## Pendientes para cerrar el Sprint 6 completo

- [x] Registrar la acción que reemplaza a otra declarada no eficaz, conservando ambas en la trazabilidad.
- [x] Notificaciones internas, contador, lectura y tareas idempotentes de aviso.
- [x] KPI calculados en servidor, con exclusión `DEMO` por defecto y pruebas de bordes.
- [x] Reporte PDF de trazabilidad con autorización, auditoría y descarga desde el lote.
- [x] Exportaciones Excel filtradas, auditadas y descargables desde la interfaz.
- [ ] Búsqueda global con permisos y pantalla de consulta de auditoría.
- [ ] Versión piloto y credenciales controladas, después del pre-test y datos reales aprobados.

## Alcance aclarado frente al feedback

La captura desde teléfonos sí se atenderá como web responsiva/PWA en el Sprint 7.
Una aplicación móvil nativa, sincronización automática en tiempo real, tareo y gestión
de personal no pertenecen a los requerimientos aprobados. Incorporarlos ahora cambiaría
el alcance, cronograma y validación de la tesis. Si en campo se requiere actualización
inmediata, la PWA consumirá la misma API cuando exista conexión; el modo sin conexión
se limitará a caché de vistas de consulta según el plan aprobado.

## Evidencia esperada para la siguiente presentación

1. Iniciar sesión con cada rol y mostrar menús diferentes.
2. Intentar abrir una ruta no autorizada y mostrar el `403` del servidor.
3. Crear una no conformidad, iniciar atención y asignar una acción.
4. Ejecutar la acción y demostrar que el responsable no puede verificarla.
5. Marcarla no eficaz y mostrar el retorno a tratamiento.
6. Completar una acción eficaz y demostrar las reglas de cierre.
7. Cambiar una contraseña y comprobar que la sesión anterior deja de funcionar.
8. Asignar una NC o acción, abrir la campana y demostrar contador, enlace y lectura.
9. Filtrar el tablero por periodo, demostrar denominadores vacíos y activar `DEMO`
   con un rol autorizado para comprobar su señalización visible.
10. Descargar los tres reportes Excel, revisar la hoja de filtros y comprobar que
    el rol `ANALISTA` no puede incluir datos `DEMO`.

El login y la seguridad no se consideran únicamente una apariencia visual: la evidencia
debe incluir controles del servidor, persistencia, correo en Mailpit y pruebas automatizadas.

## Evidencia técnica · 07/09/2026

- 239 pruebas unitarias/contrato aprobadas: API 164, web 36 y shared 39.
- 11 pruebas de integración aprobadas contra PostgreSQL 16 desechable.
- ESLint, TypeScript, Prettier, OpenAPI y build de producción aprobados.
- Migraciones aplicadas al entorno local; seed idempotente verificado con 5 usuarios,
  5 lotes DEMO, 8 resultados, 1 sesión sensorial y 2 no conformidades DEMO.
- PostgreSQL y Mailpit saludables; API SIGECAL saludable en el puerto local configurado.
- Tres exportaciones reales verificadas como libros Excel 2007+: inspecciones,
  no conformidades con acciones y resultados fisicoquímicos por parámetro.
