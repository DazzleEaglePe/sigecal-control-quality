# 19 · GUION DE ONBOARDING OPERATIVO PARA EL PILOTO

**Estado:** material de preparación; la sesión todavía debe coordinarse y
realizarse con Nicolle y los participantes aprobados.

Este guion organiza una sesión inicial breve para el piloto de SIGECAL. No es
el manual formal de usuario del add-on pendiente de aprobación, no reemplaza la
capacitación de la empresa y no autoriza iniciar la recolección académica.

## 1. Precondiciones obligatorias

- [ ] Nicolle y su asesor aprobaron participantes, duración y alcance del piloto.
- [ ] Se aplicó y fechó el pre-test del Anexo 5 antes de entregar credenciales.
- [ ] Tacama confirmó áreas, parámetros, rangos, umbrales e instrumentos reales.
- [ ] Se eligió un entorno de demostración o piloto y se comprobó qué origen de
      datos está activo. Los registros `DEMO` no se presentan como operación real.
- [ ] Las cuentas individuales tienen roles y áreas revisados; no se comparten
      contraseñas ni archivos `.env`.
- [ ] Se acordó quién recibe incidentes y dónde registrarlos sin incluir
      contraseñas, tokens, datos personales innecesarios ni respuestas de encuesta.
- [ ] La demostración de escritura se realiza con registros `DEMO` o en un
      entorno desechable; nunca se alteran datos reales para la capacitación.

Si falta una precondición, la sesión puede limitarse a una demostración técnica
con datos `DEMO`; no debe comenzar el piloto ni registrarse evidencia como uso
real.

## 2. Agenda sugerida — 30 minutos

| Tiempo    | Actividad                                                                    | Criterio observable                                                                                                               |
| --------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 0–3 min   | Explicar propósito, ambiente y diferencia entre registros `DEMO` y `REAL`.   | Cada participante sabe en qué entorno está y qué datos puede registrar.                                                           |
| 3–7 min   | Iniciar sesión con cuenta individual y reconocer su rol.                     | La persona ingresa sin compartir credenciales y ve las opciones autorizadas.                                                      |
| 7–11 min  | Recorrer navegación, búsqueda y notificaciones visibles para el rol.         | Identifica cómo volver al tablero y localizar sus tareas.                                                                         |
| 11–17 min | Consultar un lote `DEMO`, sus etapas y la línea de tiempo.                   | Ubica etapa actual, inspecciones e historial del lote.                                                                            |
| 17–22 min | Mostrar una inspección y dónde aparecen sus parámetros, estado y resultados. | Distingue una referencia provisional `DEMO` de un estándar aprobado para datos reales.                                            |
| 22–26 min | Revisar una no conformidad `DEMO`, sus tiempos y acciones.                   | Comprende el flujo de atención/verificación y que el cierre exige acciones eficaces.                                              |
| 26–28 min | Explicar límites de la PWA y desconexión.                                    | Sabe que puede ver el aviso de conexión y que guardar requiere volver a estar en línea; no hay sincronización offline automática. |
| 28–30 min | Recoger dudas e indicar el canal de incidencias.                             | Las dudas e incidencias quedan asignadas; no se capturan encuestas dentro de SIGECAL.                                             |

La agenda se adapta por rol. No se pide a un participante ejecutar operaciones
fuera de sus permisos ni se evalúa su desempeño individual.

## 3. Puntos que el facilitador debe recalcar

- El rol determina permisos en el servidor; el área aporta asignación y
  trazabilidad, no es un módulo de gestión de personal.
- Un estándar provisional solo sirve para demostraciones `DEMO`. No registrar
  resultados `REAL` hasta contar con los rangos confirmados.
- Un resultado o sesión final no se edita: una corrección crea una versión
  nueva y conserva la anterior con su motivo.
- La evaluación organoléptica califica el producto. No se compara ni puntúa a
  los panelistas.
- La PWA es web responsiva; estar sin conexión no habilita guardar ni sincroniza
  operaciones pendientes.
- Las encuestas de los anexos pertenecen al proceso de investigación y se
  aplican en el momento definido con el asesor; no se ingresan al sistema.

## 4. Registro de realización y aceptación

Completar al terminar la sesión, sin contraseñas ni secretos:

| Campo                                                 | Registro |
| ----------------------------------------------------- | -------- |
| Fecha, hora y duración                                |          |
| Facilitador y responsable de Tacama                   |          |
| Participantes/roles (usar identificadores acordados)  |          |
| Commit o versión demostrada                           |          |
| Entorno y origen de datos confirmado                  |          |
| Dispositivo, navegador y tamaño de pantalla           |          |
| Flujos recorridos y resultado (conforme / incidencia) |          |
| Incidencias, responsable y seguimiento                |          |
| Conformidad de Nicolle y evidencia breve autorizada   |          |

No marcar conforme si hubo errores de autorización, pérdida de trazabilidad,
guardado offline aparente, mezcla de datos `DEMO`/`REAL` o bloqueo que impidió
completar un flujo. Escalarlo y registrar el resultado observado.

La conformidad de Nicolle sobre esta sesión no reemplaza la revisión manual de
accesibilidad completa, la aprobación metodológica, el piloto acordado ni la
aceptación final del Sprint 7.
