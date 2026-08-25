# 04 · ARQUITECTURA

---

## 1. Vista general

```
┌─────────────────────────────────────────────────────────┐
│  NAVEGADOR (PC de oficina · tableta en planta)          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  SPA React 19.2 + Vite 8.1 · PWA instalable       │  │
│  │  Páginas → Componentes → Hooks → Servicios HTTP   │  │
│  └───────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS · JSON · JWT
┌───────────────────────────▼─────────────────────────────┐
│  API REST — Node 24 LTS + Express 5 + TypeScript        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ MIDDLEWARE  auth · rbac · validate · audit · error  │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ ROUTES        define rutas, sin lógica              │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ CONTROLLERS   traduce HTTP ⇄ dominio, sin reglas    │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ SERVICES      ⭐ TODA la lógica de negocio          │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ REPOSITORIES  único punto de acceso a datos         │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ Prisma 7
┌───────────────────────────▼─────────────────────────────┐
│  PostgreSQL 16                                           │
└──────────────────────────────────────────────────────────┘
```

## 2. Estructura del monorepo

```
sigecal/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── config/          # env, constantes, cliente prisma
│   │       ├── middleware/      # auth, rbac, validate, audit, error
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── masters/     # parámetros, estándares, variedades, etapas, equipos
│   │       │   ├── batches/     # lotes y trazabilidad
│   │       │   ├── inspections/
│   │       │   ├── physicochemical/
│   │       │   ├── sensory/
│   │       │   ├── nonconformities/
│   │       │   ├── reports/
│   │       │   ├── audit/
│   │       │   ├── search/
│   │       │   └── notifications/
│   │       ├── shared/          # errores, utilidades, tipos, paginación
│   │       ├── jobs/            # tareas programadas
│   │       ├── app.ts
│   │       └── server.ts
│   └── web/
│       └── src/
│           ├── app/             # router, layout, providers
│           ├── features/        # un directorio por módulo, espejo del API
│           ├── components/      # ui/ (átomos) y common/ (compuestos)
│           ├── hooks/
│           ├── lib/             # cliente http, formateadores, validadores
│           └── styles/
├── packages/
│   └── shared/                  # tipos, enumeraciones y esquemas compartidos
├── docs/
├── docker-compose.yml
└── package.json
```

**Cada módulo del API contiene exactamente:**

```
<modulo>/
├── <modulo>.routes.ts       # rutas + middleware
├── <modulo>.controller.ts   # req/res, sin reglas de negocio
├── <modulo>.service.ts      # reglas de negocio
├── <modulo>.repository.ts   # acceso a datos vía Prisma
├── <modulo>.schema.ts       # validación de entrada (Zod)
├── <modulo>.types.ts        # DTOs
└── <modulo>.service.test.ts # pruebas unitarias
```

## 3. Reglas de dependencia entre capas

```
routes → controllers → services → repositories → prisma
```

- Cada capa solo conoce la siguiente. **Nunca se salta una capa.**
- Un servicio puede llamar a otro servicio; un repositorio **nunca** llama a un servicio.
- El controlador jamás importa Prisma.
- El servicio jamás recibe ni devuelve objetos `Request` o `Response`.
- Los tipos compartidos entre API y web viven en `packages/shared`.

## 4. Patrones de diseño aplicados

| Patrón               | Dónde                                                  | Por qué                                                                  |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Repository**       | Capa de repositorios                                   | Aísla Prisma; permite probar servicios sin base de datos                 |
| **Service Layer**    | Capa de servicios                                      | Centraliza reglas de negocio; evita lógica duplicada en controladores    |
| **DTO**              | `types.ts` de cada módulo                              | Contrato explícito de entrada y salida; nunca se expone la entidad cruda |
| **Middleware Chain** | Express                                                | Autenticación, autorización, validación y auditoría de forma transversal |
| **Strategy**         | Validación de resultados                               | La regla de conformidad varía según tipo de parámetro                    |
| **State**            | Lote, inspección, no conformidad                       | Transiciones de estado controladas y validadas                           |
| **Factory**          | Generación de códigos (`LT-AAAA-NNNN`, `NC-AAAA-NNNN`) | Centraliza el formato                                                    |
| **Observer**         | Notificaciones                                         | Los eventos de dominio disparan notificaciones sin acoplar módulos       |

## 5. Aplicación de SOLID

| Principio                         | Cómo se aplica                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| **S** — Responsabilidad única     | Un módulo por dominio; un archivo por capa; controladores solo traducen HTTP          |
| **O** — Abierto/cerrado           | Nuevas estrategias de validación se agregan sin modificar el validador existente      |
| **L** — Sustitución de Liskov     | Los repositorios cumplen una interfaz común; se pueden sustituir por dobles de prueba |
| **I** — Segregación de interfaces | Interfaces pequeñas y específicas por caso de uso, no interfaces genéricas gigantes   |
| **D** — Inversión de dependencias | Los servicios dependen de interfaces de repositorio, no de Prisma directamente        |

## 6. Manejo de errores

Jerarquía única de errores de aplicación, capturada por un middleware final:

| Clase                     | Código HTTP | Uso                                                                    |
| ------------------------- | ----------- | ---------------------------------------------------------------------- |
| `ValidationError`         | 400         | Entrada inválida                                                       |
| `UnauthorizedError`       | 401         | Sin token o token inválido                                             |
| `ForbiddenError`          | 403         | Rol sin permiso                                                        |
| `NotFoundError`           | 404         | Recurso inexistente                                                    |
| `ConflictError`           | 409         | Violación de regla de negocio (ej. cerrar lote con NC abiertas)        |
| `DomainError`             | 422         | Regla evaluable que impide procesar el dato (ej. sin estándar vigente) |
| `ServiceUnavailableError` | 503         | Dependencia requerida no disponible (ej. base de datos)                |
| `AppError`                | 500         | Error interno                                                          |

Formato uniforme de respuesta de error:

```json
{
  "success": false,
  "error": {
    "code": "BATCH_HAS_OPEN_NC",
    "message": "No se puede cerrar el lote porque tiene no conformidades abiertas.",
    "details": []
  }
}
```

Formato uniforme de respuesta exitosa:

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 137 }
}
```

## 7. Tareas programadas

| Tarea                           | Frecuencia    | Efecto                                                                |
| ------------------------------- | ------------- | --------------------------------------------------------------------- |
| Marcar inspecciones vencidas    | Diaria, 00:15 | `PROGRAMADA` → `VENCIDA` si la fecha prevista ya pasó                 |
| Notificar inspecciones próximas | Diaria, 07:00 | Notificación a los responsables con inspección en 48 h                |
| Notificar acciones por vencer   | Diaria, 07:00 | Notificación de acciones correctivas próximas a su fecha comprometida |

Implementadas con `node-cron` dentro del mismo proceso y zona horaria `America/Lima`. No se introduce una cola de mensajes: el volumen no lo justifica. Cada trabajo es idempotente y usa una clave única para evitar notificaciones duplicadas.

---

# DECISIONES DE ARQUITECTURA (ADR)

## ADR-001 · Monolito modular en lugar de microservicios

**Estado:** Aceptada

**Contexto.** La sección 2.2.6 del marco teórico desarrolla en profundidad la arquitectura de microservicios, citando a Waseem et al. (2020). Existe entonces la expectativa implícita de aplicarla.

**Decisión.** Se construye un **monolito modular**: un único despliegue, con módulos de dominio internamente desacoplados y separación estricta por capas.

**Justificación.**

1. La población de usuarios es de 15 personas en una sola sede. Los beneficios de los microservicios —escalabilidad granular, despliegue independiente, autonomía de equipos— no aplican a este contexto.
2. El propio Waseem et al. (2020) condiciona los microservicios a la existencia de equipos autónomos y pequeños. Aquí el equipo es una sola persona.
3. Richards y Ford (2020), también citado en la tesis (2.2.6), plantean que las decisiones arquitectónicas son un ejercicio de compensaciones: optimizar escalabilidad incrementa complejidad. En este caso la complejidad operativa no está justificada.
4. La modularidad interna preserva la vía de migración: cada módulo puede extraerse a un servicio independiente si el contexto cambia.

**Consecuencias.** Un solo despliegue y depuración sencilla. A cambio, no hay escalado por módulo — irrelevante a esta escala. **Esta justificación debe llegar a la sustentación**; es la respuesta a "¿por qué no aplicó lo que teorizó?".

---

## ADR-002 · React + Vite como framework de frontend

**Estado:** Aceptada y cerrada el 24/08/2026

**Contexto.** La sección 2.3.1 menciona React, Vue y Angular como opciones válidas para una SPA. La tesista deberá defender el código ante el jurado.

**Decisión.** React 19.2 con Vite 8.1 y Tailwind CSS 4.3.

**Justificación.** Menor curva de lectura para quien deba explicar el código; ecosistema amplio de bibliotecas de calendario y gráficos; arranque de desarrollo más veloz, lo que importa en una ventana de 4 meses.

**Alternativa considerada.** Angular. Se descarta para evitar un cambio de paradigma y estructura justo antes del Sprint 1. La defensa se apoyará en componentes, hooks, servicios HTTP y separación por características de dominio.

---

## ADR-003 · Prisma como ORM

**Estado:** Aceptada

**Decisión.** Prisma 7 estable sobre PostgreSQL 16. Prisma 8 no se adopta mientras no sea una versión estable de disponibilidad general.

**Justificación.** Genera tipos de TypeScript a partir del esquema, lo que elimina desalineaciones entre base de datos y código. Sus migraciones son versionadas y reproducibles (RNF-PO-04). Impide por diseño la concatenación de SQL (RNF-SE-06). El esquema declarativo sirve además como insumo directo para el diagrama entidad-relación del add-on de UML.

**Seguimiento de dependencias (24/08/2026).** El CLI de Prisma 7.9.1 fija transitivamente `deepmerge-ts` 7.1.5, afectado por [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). El escenario requiere que esa biblioteca procese grafos recursivos construidos por un atacante; en SIGECAL solo forma parte del CLI de desarrollo y procesa configuración versionada y confiable, no entradas HTTP. `npm audit` propone bajar a Prisma 6, lo que contradice este ADR, y el override hacia 8.0.2 no es respetado por la dependencia exacta de Prisma. Se acepta temporalmente el riesgo residual, se excluye el CLI de la imagen de producción y se revisará al actualizar Prisma. No se ocultará la alerta ni se forzará una combinación no soportada.

---

## ADR-004 · Inmutabilidad de los resultados de análisis

**Estado:** Aceptada

**Contexto.** RF-M5-07 impide modificar un resultado ya guardado.

**Decisión.** Los resultados no se actualizan ni se eliminan. Una corrección genera un nuevo registro que marca el anterior como anulado, conservando ambos con su motivo.

**Justificación.** En control de calidad, la posibilidad de alterar un resultado histórico destruye la confiabilidad de la trazabilidad. Es además coherente con la teoría de trazabilidad desarrollada en 2.2.4 y con el principio de registros inalterables que la tesis discute a propósito de blockchain, sin necesidad de introducir esa tecnología.

---

## ADR-005 · PWA en lugar de aplicación móvil nativa

**Estado:** Aceptada

**Contexto.** La captura de datos ocurre en planta, donde una tableta es más práctica que una computadora.

**Decisión.** Aplicación web responsiva instalable como PWA, con almacenamiento en caché de las vistas de consulta.

**Justificación.** Preserva la coherencia con la variable independiente declarada ("Sistema Web") y se sustenta en el marco teórico de la propia tesis (2.3.1, Biorn-Hansen et al., 2020). Una aplicación nativa contradiría la operacionalización de la variable.

---

## ADR-006 · Sin integración con instrumentos de laboratorio

**Estado:** Aceptada

**Decisión.** El ingreso de resultados es manual. No se implementa lectura automática desde equipos.

**Justificación.** Está fuera del alcance contratado y ningún indicador de la tesis lo mide. Se registra el instrumento utilizado como dato (RF-M5-05), lo que sí respalda el ítem A5-08.

---

## ADR-007 · Ausencia de estándar vigente

**Estado:** Aceptada

**Contexto.** Declarar conforme una medición que no tiene rango aplicable produce una aprobación falsa y distorsiona los indicadores.

**Decisión.** La previsualización devuelve `NO_EFFECTIVE_STANDARD` para el parámetro afectado y el servidor bloquea el guardado definitivo. El analista puede conservar un borrador local, pero no existe un resultado operativo `CONFORME` sin estándar.

**Consecuencia.** Los parámetros y rangos confirmados son prerrequisito para utilizar M5 en producción.

---

## ADR-008 · Despliegue compatible con cookie segura

**Estado:** Aceptada

**Decisión.** En producción, frontend y API operan bajo el mismo sitio registrable, preferentemente con la API publicada detrás de `/api`. El token de refresco es una cookie host-only `httpOnly`, `secure` y `sameSite=strict`; nunca se devuelve en JSON. El cliente envía credenciales únicamente al origen configurado.

**Consecuencia.** No se aprueba un despliegue que coloque frontend y API en sitios incompatibles con esta cookie, salvo un ADR nuevo que documente un proxy del mismo sitio o protección CSRF equivalente.

---

## ADR-009 · Cohorte de los gráficos de control

**Estado:** Aceptada

**Decisión.** Un gráfico agrupa únicamente resultados finales, no anulados, no demostrativos y comparables por parámetro, tipo de pisco, etapa y versión de estándar. La línea central es la media aritmética y los límites preliminares son media ±3 desviaciones estándar muestrales.

El mínimo de 8 observaciones es una regla operativa de SIGECAL, no una afirmación de suficiencia estadística universal. Con menos observaciones se muestran los puntos y una advertencia, sin límites.

**Consecuencia.** No se mezclan procesos o especificaciones diferentes. La sustentación debe distinguir límites de control de límites de especificación.

---

## ADR-010 · Datos de demostración separados

**Estado:** Aceptada

**Decisión.** Lotes, inspecciones y resultados de demostración llevan `dataOrigin = DEMO`; los registros reales llevan `dataOrigin = REAL`. Los reportes e indicadores excluyen `DEMO` por defecto.

**Consecuencia.** La demostración conserva suficiente historial visual sin contaminar la operación ni la evidencia académica.

---

## ADR-011 · Caché PWA y cambio de usuario

**Estado:** Aceptada

**Decisión.** El modo offline de consulta funciona solo durante una sesión previamente iniciada. Las respuestas de API se segmentan por usuario y se eliminan al cerrar sesión. No se almacenan tokens en Cache Storage, IndexedDB ni `localStorage`.

**Consecuencia.** Al abrir la aplicación sin conexión y sin una sesión en memoria, se muestra el shell y un mensaje de conexión requerida, pero no datos operativos.
