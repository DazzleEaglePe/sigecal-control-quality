# AGENTS.md — SIGECAL

Reglas de trabajo para cualquier agente que modifique este proyecto. Léelas completas antes de escribir código.

---

## Qué es esto

**SIGECAL** — Sistema de Gestión de Control de Calidad para la elaboración de pisco en Viña Tacama S.A., Ica, Perú.
Producto de software asociado a una tesis de Ingeniería de Sistemas. La documentación en `docs/` es la fuente de verdad.

## Descubrimiento del código

Este proyecto usa `codebase-memory-mcp` para mantener un grafo de conocimiento. Cuando sus herramientas estén disponibles, prioriza:

1. `search_graph` para localizar funciones, clases, rutas y variables.
2. `trace_path` para rastrear llamadas entrantes o salientes.
3. `get_code_snippet` para leer implementaciones concretas.
4. `query_graph` para consultas complejas.
5. `get_architecture` para obtener la vista general.

Usa `rg` para literales, mensajes, configuración, documentación o cuando el grafo no alcance.

## Orden de lectura obligatorio

```text
docs/00-CONTEXTO-PROYECTO.md
docs/01-ANALISIS-TESIS.md
docs/02-REQUERIMIENTOS-FUNCIONALES.md
docs/03-REQUERIMIENTOS-NO-FUNCIONALES.md
docs/04-ARQUITECTURA.md
docs/05-MODELO-DATOS.md
docs/06-API-CONTRACT.md
docs/07-SEGURIDAD-AUTH.md
docs/08-UX-FLUJOS.md
docs/09-PLAN-DESARROLLO.md
docs/10-CHECKLIST-SPRINT-1.md
```

## Stack aprobado

Node.js 24 LTS · TypeScript estricto · Express 5 · Prisma 7 · PostgreSQL 16 · JWT · React 19.2 + Vite 8.1 · Tailwind CSS 4.3 · Monorepo · Monolito modular por capas.

No cambies una versión mayor sin registrar antes la decisión en `docs/04-ARQUITECTURA.md` y verificar compatibilidad.

---

## Reglas absolutas

### 1. No inventar requerimientos

Si no está en `docs/02-REQUERIMIENTOS-FUNCIONALES.md`, no se construye. Si crees que falta algo, repórtalo antes de implementarlo.

### 2. No inventar datos del dominio

No hardcodees rangos ni límites normativos no confirmados. Los estándares son configurables. Un resultado sin estándar vigente **no puede declararse conforme ni guardarse como resultado definitivo**.

### 3. Respetar la separación de capas

```text
routes → controllers → services → repositories → prisma
```

El controlador no importa Prisma. El servicio no recibe `Request` ni `Response`. El repositorio no llama a servicios.

### 4. Respetar el contrato de API

Los extremos, DTO, parámetros, permisos y errores están en `docs/06-API-CONTRACT.md`. Un extremo nuevo requiere actualizar primero el contrato.

### 5. Es un sistema web

No propongas aplicación móvil nativa ni de escritorio. PWA responsiva sí; aplicación nativa no.

### 6. Sin rankings ni puntajes de personas

Las calificaciones sensoriales evalúan el producto. Está prohibido agregar, promediar, comparar o clasificar panelistas.

### 7. Los resultados finales son inmutables

No se modifican valores ni datos técnicos de un resultado final. Una corrección crea otro registro y agrega al anterior únicamente metadatos controlados de anulación. La corrección y sus efectos sobre no conformidades se ejecutan en una transacción.

### 8. La autorización se resuelve en el servidor

El frontend puede ocultar opciones por usabilidad, nunca como control de seguridad. Toda ruta protegida valida rol, alcance y pertenencia en el servidor.

### 9. Español en la interfaz, inglés en el código

Variables, funciones, tablas y columnas en inglés. Todo texto visible al usuario en español.

### 10. Sin SQL concatenado

Acceso mediante Prisma. Se prohíben `$queryRawUnsafe` y la concatenación de SQL.

### 11. Sin umbrales manipulables desde operaciones

Los estándares y umbrales sensoriales se administran y versionan por usuarios autorizados. Un analista no los envía ni modifica al registrar resultados.

### 12. Datos de demostración identificables

Los datos de demostración deben estar marcados y no se mezclan con datos reales ni con la evidencia del pre-test/post-test.

---

## Fuera de alcance

Gestión de personal · Inventarios · Mantenimiento de equipos de laboratorio · Maquinaria agrícola · Integración con instrumentos · Facturación · Blockchain · Machine learning · Microservicios · Aplicación móvil nativa · Sincronización automática de operaciones offline.

El catálogo mínimo de áreas y la asociación de un usuario con su área **no** constituyen gestión de personal; existen únicamente para permisos, asignación y trazabilidad entre áreas.

## Pendiente de aprobación — no generar aún

Diagramas UML · Diagrama formal de arquitectura · Manual de usuario · Video demostrativo formal.

Las grabaciones breves de evidencia para aceptar un sprint no equivalen al video demostrativo formal.

---

## Estilo de código

- TypeScript estricto. Sin `any` salvo justificación comentada.
- Funciones de máximo 40 líneas. Archivos de código de máximo 300 líneas, salvo esquemas o configuración generada justificadamente.
- Sin números mágicos ni cadenas repetidas.
- Estructura por módulo de dominio.
- Cada módulo del API contiene `routes`, `controller`, `service`, `repository`, `schema`, `types` y pruebas de servicio.
- Los comentarios explican el porqué.
- Toda entrada se valida con Zod antes del controlador.
- Toda operación sobre varias tablas usa una transacción.
- Todo listado potencialmente mayor de 50 registros se pagina en servidor.

## Formato de la API

```json
{ "success": true, "data": {}, "meta": { "page": 1, "pageSize": 20, "total": 137 } }
{ "success": false, "error": { "code": "CODIGO", "message": "Mensaje en español.", "details": [] } }
```

## Mensajes de commit

```text
feat(modulo): descripción en presente
fix(modulo): descripción del arreglo
test(modulo): descripción de la prueba
docs(modulo): descripción
refactor(modulo): descripción
```

## Cómo trabajar

1. Sigue el orden de `docs/09-PLAN-DESARROLLO.md`.
2. Antes de codificar un módulo, relee sus RF, modelo y contrato.
3. Ante ambigüedad que cambie alcance o reglas de negocio, pregunta.
4. Verifica cada tarea de extremo a extremo, con lint, tipos y pruebas.
5. No refactorices trabajo ajeno sin necesidad ni aviso.

Cuando el contexto crezca, vuelve a leer este archivo. Las reglas 1, 2, 6, 7 y 11 son las más sensibles.
