# Checklist Sprint 5 — Evaluación organoléptica

Fuente: RF-M6-01 a RF-M6-12, modelo de datos §8, contrato API §9 y flujo UX §2.6.

## Contrato y dominio

- [x] Contrato Zod para sesiones, correcciones, perfiles y comparación.
- [x] El servidor recibe puntajes 1–5, nunca un umbral enviado por el cliente.
- [x] El servidor resuelve el umbral vigente por tipo de pisco y fecha.
- [x] Un umbral provisional bloquea el guardado definitivo de datos reales.
- [x] La matriz exige todos los atributos sensoriales activos por panelista.
- [x] No existe contrato de promedio, ranking o comparación por panelista.

## API y persistencia

- [x] Alta transaccional de sesión, panelistas y calificaciones.
- [x] Cálculo de promedios por atributo y general.
- [x] Conformidad y no conformidad automática según el umbral aplicado.
- [x] Corrección inmutable: anulación y nueva versión en una transacción.
- [x] Detalle, listado paginado, perfil radial y comparación de perfiles.
- [x] Opciones de usuarios activos para conformar el panel, sin métricas personales.

## Interfaz

- [x] Alta de sesión desde una inspección organoléptica en proceso.
- [x] Panelistas internos o externos y matriz accesible de calificación.
- [x] Promedios por atributo y general en vivo; ninguno por persona.
- [x] Umbral, norma y vigencia visibles como datos de solo lectura.
- [x] Detalle inmutable, corrección con motivo y enlace entre versiones.
- [x] Perfil radial y comparador entre lotes.

## Evidencia de cierre

- [x] Pruebas de escala, matriz completa, promedios y bordes del umbral.
- [x] Pruebas de no conformidad automática y corrección transaccional.
- [x] Pruebas de rutas, permisos y validación de entrada.
- [x] Verificación explícita de ausencia de agregaciones por panelista.
- [x] `lint`, `typecheck`, pruebas, formato y compilación completos.
- [x] Recorrido interactivo de escritorio y revisión de reglas responsivas.

## Resultado del cierre — 31/08/2026

- 163 pruebas aprobadas en 58 archivos: API 105, web 28 y shared 30.
- ESLint, TypeScript estricto, Prettier, builds y OpenAPI aprobados.
- Seed idempotente verificado con una sesión sensorial `DEMO` y una inspección
  organoléptica `DEMO` pendiente de captura.
- Recorrido de alta validado: matriz completa, promedio general en vivo,
  conformidad preliminar y habilitación condicionada del guardado.
- La búsqueda estática no encontró agregaciones, rankings ni comparaciones por
  panelista; los perfiles se agrupan exclusivamente por atributo del producto.
