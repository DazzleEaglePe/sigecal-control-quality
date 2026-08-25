# 10 · CHECKLIST OPERATIVO — SPRINT 1

**Periodo:** primera quincena de setiembre de 2026
**Objetivo:** disponer de un monorepo reproducible con PostgreSQL, esquema Prisma, API base y shell web conectados y verificables con una sola orden.

---

## 1. Decisión de orden: backend primero por contrato

No se desarrollará todo el backend antes del frontend. El orden será:

```text
Repositorio y herramientas
        ↓
Contrato compartido + base de datos
        ↓
API mínima (/health)
        ↓
Shell frontend conectado a la API
        ↓
Validación integral del entorno
```

La base de datos y el contrato van primero porque determinan tipos, validaciones y respuestas. El frontend empieza en el mismo sprint para comprobar integración, accesibilidad y estructura visual antes de acumular lógica.

## 2. Fuera de este sprint

No implementar todavía:

- inicio de sesión real, JWT o RBAC;
- CRUD de usuarios o maestros;
- lotes, inspecciones, análisis, NC o reportes;
- PWA y modo offline;
- datos normativos reales no confirmados;
- UML, manual o video demostrativo formal.

El Sprint 1 prepara estos módulos; no los simula con funciones incompletas.

---

## 3. Preflight del equipo

- [x] Node.js 24 LTS disponible: `v24.19.0`.
- [x] npm disponible: `11.17.0`.
- [x] Docker disponible: `29.6.2`.
- [x] Docker Compose disponible: `5.3.1`.
- [x] Git disponible: `2.50.1`.
- [x] Documentación v1.1 validada.
- [x] Verificar que los puertos 3000, 5173 y 5432 estén libres antes del primer arranque. El 24/08/2026, `3000` estaba ocupado por un servidor Next.js ajeno y `5432` pasó a estar ocupado por otro PostgreSQL ajeno a SIGECAL. No se detuvieron: el entorno local de SIGECAL usa temporalmente `PORT=3001`, `VITE_API_URL` concordante y PostgreSQL en `5433`; `.env.example` conserva los puertos predeterminados para un clon limpio.

---

## 4. Checkpoint A — Repositorio y monorepo

### Git y archivos raíz

- [x] Inicializar Git en la raíz de `agro-project`.
- [x] Crear la rama inicial `main`.
- [x] Crear la rama `develop` después del primer commit.
- [x] Conservar `AGENTS.md` en la raíz.
- [x] Crear `.gitignore` para Node, variables de entorno, builds, cobertura, logs y archivos del sistema.
- [x] Crear `.nvmrc` con Node 24.
- [x] Crear `.editorconfig`.
- [x] Crear `.env.example` sin secretos reales.
- [x] Crear `package.json` raíz con `private: true` y npm workspaces.
- [x] Versionar `package-lock.json`.

### Estructura

- [x] Crear `apps/api`.
- [x] Crear `apps/web`.
- [x] Crear `packages/shared`.
- [x] Crear `apps/api/prisma/migrations`.
- [x] Mantener `docs/` sin mover ni renombrar sus archivos.

### Scripts raíz

- [x] Declarar `npm run dev` para levantar PostgreSQL, API y web cuando existan los tres componentes.
- [x] Declarar `npm run build` para compilar todos los workspaces.
- [x] Declarar `npm run lint` para revisar todos los workspaces sin advertencias.
- [x] Declarar `npm run typecheck` para validar TypeScript sin emitir archivos.
- [x] Declarar `npm run test` para ejecutar todas las pruebas.
- [x] Declarar `npm run format:check` para verificar formato.
- [x] Declarar `npm run db:validate` para validar y formatear Prisma.
- [x] Declarar `npm run db:migrate` para aplicar migraciones de desarrollo.
- [x] Declarar `npm run db:seed` para cargar datos iniciales.

**Salida del checkpoint:** estructura instalada con una única versión de TypeScript y herramientas compartidas.

---

## 5. Checkpoint B — Calidad y contrato compartido

### TypeScript y formato

- [x] Configurar TypeScript estricto en raíz, API, web y shared.
- [x] Prohibir `any` implícito y accesos inseguros.
- [x] Configurar ESLint y Prettier de forma común.
- [x] Configurar alias de importación y límites entre workspaces para impedir dependencias circulares entre aplicaciones.

### `packages/shared`

- [x] Definir las enumeraciones descritas en `05-MODELO-DATOS.md`.
- [x] Definir los tipos `ApiSuccess`, `ApiError` y metadatos de paginación.
- [x] Definir esquemas Zod compartibles sin importar Express ni Prisma.
- [x] Crear pruebas que validen el formato uniforme de respuesta.

### Contrato OpenAPI

- [x] Crear `docs/openapi.yaml` con información general, servidores y formato común de errores.
- [x] Documentar `GET /api/v1/health`.
- [x] Validar sintácticamente el contrato.
- [x] Dejar documentado que cada nueva ruta requiere actualizar Zod y OpenAPI en el mismo cambio.

**Salida del checkpoint:** web y API pueden consumir los mismos tipos sin duplicarlos.

---

## 6. Checkpoint C — PostgreSQL y Prisma

### Contenedor local

- [x] Crear `docker-compose.yml` con PostgreSQL 16.
- [x] Usar volumen nombrado y comprobación de salud.
- [x] Leer usuario, contraseña, puerto y base desde variables de entorno.
- [x] No publicar credenciales reales en el repositorio.

### Esquema

- [x] Configurar Prisma 7.
- [x] Implementar todas las enumeraciones del documento `05`.
- [x] Implementar usuarios, áreas, tokens, auditoría y notificaciones.
- [x] Implementar maestros, estándares, umbrales y plantillas.
- [x] Implementar lotes, composición varietal y etapas.
- [x] Implementar inspecciones y parámetros esperados.
- [x] Implementar resultados fisicoquímicos y sesiones sensoriales versionables.
- [x] Implementar NC y acciones correctivas.
- [x] Crear relaciones, índices y restricciones únicas documentadas.
- [x] Representar `DataOrigin.REAL/DEMO` donde corresponda.
- [x] No incluir valores normativos no confirmados como datos reales.

### Migración y seed

- [x] Ejecutar `prisma format` y `prisma validate`.
- [x] Crear una única migración inicial legible.
- [x] Probar la migración desde una base vacía.
- [x] Crear seed idempotente.
- [x] Cargar cuatro usuarios técnicos con cambio de contraseña obligatorio.
- [x] Cargar catálogos base y valores provisionales identificados.
- [x] Cargar cinco lotes `DEMO`, ocho resultados comparables y dos NC.
- [x] Comprobar que ejecutar el seed dos veces no duplica registros.

**Salida del checkpoint:** una base vacía puede recrearse y poblarse de forma reproducible.

---

## 7. Checkpoint D — API base

### Arranque

- [x] Crear `app.ts` sin abrir puerto y `server.ts` como punto de entrada.
- [x] Validar variables de entorno con Zod antes de iniciar.
- [x] Crear una única instancia de Prisma.
- [x] Implementar apagado ordenado y desconexión de Prisma.

### Middleware transversal

- [x] Activar Helmet.
- [x] Configurar CORS con origen exacto y credenciales.
- [x] Limitar cuerpos JSON a 1 MB.
- [x] Implementar validación Zod reutilizable.
- [x] Implementar jerarquía de errores 400/401/403/404/409/422/500.
- [x] Implementar middleware final que no exponga trazas.
- [x] Implementar respuesta 404 uniforme.

### Primera ruta

- [x] Implementar `GET /api/v1/health`.
- [x] Responder estado de aplicación y conectividad de base sin revelar secretos.
- [x] Probar caso saludable.
- [x] Probar respuesta uniforme ante ruta inexistente.
- [x] Probar fallo controlado cuando la base no está disponible.

**Salida del checkpoint:** API ejecutable, segura por defecto y con prueba de conectividad real.

---

## 8. Checkpoint E — Shell frontend

### Base técnica

- [x] Crear React 19.2 con Vite 8.1 y TypeScript estricto.
- [x] Integrar Tailwind CSS 4.3 mediante su plugin oficial de Vite.
- [x] Configurar React Router.
- [x] Crear cliente HTTP centralizado sobre `fetch`, sin tokens ni lógica de refresh todavía.
- [x] Configurar URL de API mediante variable de entorno.

### Disposición visual

- [x] Crear layout con barra lateral y barra superior.
- [x] Crear comportamiento responsivo desde 360 px.
- [x] Crear foco visible y navegación básica por teclado.
- [x] Usar textos visibles en español.
- [x] Crear página de inicio estructural con estado vacío honesto.
- [x] Crear página 404 accesible.
- [x] No mostrar cifras, módulos activos ni usuarios ficticios como si fueran reales.

### Integración mínima

- [x] Consultar `/api/v1/health` al iniciar el entorno de desarrollo.
- [x] Representar cargando, disponible y error sin mostrar detalles técnicos.
- [x] Incorporar un botón de reintento.
- [x] Probar la integración con API disponible y detenida.

**Salida del checkpoint:** navegador, API y PostgreSQL participan en un recorrido verificable.

---

## 9. Checkpoint F — Verificación y entrega interna

- [x] `npm install` funciona desde la raíz.
- [x] `npm run dev` levanta los tres componentes sin pasos manuales adicionales.
- [x] `npm run lint` termina sin errores ni advertencias.
- [x] `npm run typecheck` termina correctamente.
- [x] `npm run test` termina correctamente.
- [x] `npm run build` genera API y web de producción.
- [x] `npm run format:check` termina correctamente.
- [x] La migración funciona desde una base nueva.
- [x] El seed es idempotente y separa `DEMO` de `REAL`.
- [x] No hay secretos, contraseñas ni archivos `.env` versionados.
- [x] `README.md` raíz explica instalación, arranque, pruebas y solución de problemas comunes.
- [x] OpenAPI y `/health` coinciden.
- [ ] Realizar una grabación breve de evidencia; no es el video formal del add-on.

---

## 10. Criterios para declarar cerrado el Sprint 1

El sprint solo se cierra si se cumplen simultáneamente:

1. Un clon limpio arranca con `.env.example` y `npm run dev`.
2. PostgreSQL pasa su comprobación de salud y Prisma conecta.
3. `/api/v1/health` responde con el formato acordado.
4. El frontend consume la API y maneja disponibilidad y error.
5. Migración y seed funcionan desde cero y no mezclan `DEMO` con `REAL`.
6. Lint, tipos, pruebas, formato y builds pasan.
7. No se implementó funcionalidad de sprints posteriores.

## 11. Orden de commits recomendado

```text
chore(repo): inicializar monorepo y herramientas compartidas
feat(database): definir esquema inicial y datos de demostración
feat(api): crear servidor base y ruta de salud
feat(web): crear shell responsivo e integración de salud
test(core): verificar arranque migración y recorrido integral
docs(setup): documentar instalación y validación del sprint
```

## 12. Dependencias externas que no bloquean este sprint

- Correcciones metodológicas de la tesis por la tesista y su asesor.
- Parámetros y rangos reales, requeridos antes del Sprint 2.
- Pre-test, obligatorio antes del piloto y antes de entregar credenciales.
- Aprobación del add-on UML, manual y video formal.
