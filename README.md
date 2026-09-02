# SIGECAL

Sistema de Gestión de Control de Calidad para el proceso productivo de Viña Tacama S.A. El repositorio contiene una API Express, una aplicación React, contratos compartidos y PostgreSQL administrado con Prisma.

## Requisitos

- Node.js 24 LTS
- npm 11
- Docker con Docker Compose

## Primer arranque

```bash
cp .env.example .env
npm install
npm run dev
```

Antes de iniciar, reemplaza en `.env` los secretos JWT y `SEED_DEFAULT_PASSWORD`. `npm run dev` levanta PostgreSQL, aplica la migración pendiente, ejecuta el seed idempotente y arranca API y web.

Direcciones predeterminadas:

- Web: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`
- Salud: `http://localhost:3000/api/v1/health`
- PostgreSQL: `localhost:5432`
- Mailpit: `http://localhost:8025` (solo desarrollo)

Si alguno de esos puertos está ocupado, cambia conjuntamente `PORT`, `VITE_API_URL` o `POSTGRES_PORT` y `DATABASE_URL` en el `.env` local. El archivo `.env` nunca se versiona.

## Datos iniciales

El seed crea cuatro usuarios técnicos, catálogos base y un conjunto controlado de demostración: cinco lotes, ocho resultados comparables, una sesión sensorial, una inspección organoléptica pendiente y dos no conformidades. Los valores normativos provisionales están identificados y no pueden utilizarse para calificar datos `REAL`.

La contraseña inicial se toma exclusivamente de `SEED_DEFAULT_PASSWORD`; los usuarios técnicos del seed ya figuran con correo verificado y deben cambiarla al primer ingreso. Ejecutar el seed nuevamente no duplica registros.

Las cuentas creadas desde Administración no reciben una contraseña por correo: Mailpit captura una invitación con un enlace temporal para que cada usuario defina la suya. La recuperación funciona del mismo modo y siempre responde de forma genérica para no revelar si un correo existe.

## Estado funcional

Los Sprints 1, 2, 3, 4 y 5 están implementados. Además de autenticación, RBAC,
usuarios y maestros, SIGECAL registra lotes, aplica las reglas de composición
Puro/Acholado, recorre en orden las seis etapas y ofrece QR y trazabilidad
consolidada. También permite programar inspecciones, previsualizar y registrar
resultados fisicoquímicos inmutables, aplicar el estándar vigente y generar una
no conformidad automática ante un resultado fuera de rango.

El módulo organoléptico registra panelistas internos o externos solo para
trazabilidad, captura la matriz completa de atributos, calcula la conformidad,
versiona correcciones sin editar resultados finales y presenta perfiles radiales
comparables entre lotes. No genera promedios ni rankings de personas.

Las mutaciones se autorizan nuevamente en la API, el alcance de `OPERARIO` se aplica antes de paginar y cerrar o rechazar requiere el permiso correspondiente. El tipo, las variedades y la fecha inicial se congelan al avanzar o programar la primera inspección.

Los catálogos se desactivan mediante baja lógica y la API rechaza la operación si el elemento ya tiene dependencias. Hasta recibir los rangos confirmados de la empresa, los valores normativos existentes permanecen marcados como provisionales y no pueden aplicarse a datos `REAL`.

Esta es una entrega funcional de avance. Los Sprints 6 a 8 —ciclo completo de
no conformidades, reportes, PWA, despliegue y entrega formal— continúan
pendientes. El estado verificable para revisión con la tesista está en
`docs/14-CHECKLIST-ENTREGA-NICOLLE.md`.

## Comandos principales

```bash
npm run dev                 # infraestructura, migración, seed, API y web
npm run build               # builds de producción
npm run lint                # reglas estáticas, sin advertencias
npm run typecheck           # TypeScript estricto
npm run test                # pruebas de todos los workspaces
npm run format:check        # formato sin modificar archivos
npm run openapi:validate    # contrato HTTP
npm run db:verify-seed      # cantidades y separación DEMO/REAL
```

Para recrear la base local desde cero usa `npm run db:migrate --workspace @sigecal/api` de manera interactiva o el comando de reset de Prisma únicamente cuando aceptes perder los datos locales.

## Estructura

```text
apps/api/        API Express 5 y esquema Prisma 7
apps/web/        React 19.2, Vite 8.1 y Tailwind CSS 4.3
packages/shared/ contratos Zod y tipos compartidos
docs/            requisitos, arquitectura, modelo y contrato OpenAPI
```

La arquitectura de la API sigue `routes → controller → service → repository → Prisma`. Los resultados de análisis finalizados son inmutables y las correcciones crean una nueva versión. Está prohibido construir rankings o comparaciones de panelistas.

## Solución de problemas

- **PostgreSQL no queda saludable:** revisa `docker compose ps` y confirma que `POSTGRES_PORT` esté libre.
- **La web muestra “No pudimos conectar”:** consulta `/api/v1/health`, verifica `PORT` y comprueba que `VITE_API_URL` use el mismo puerto.
- **Prisma no encuentra la base:** confirma que `DATABASE_URL` coincida con usuario, contraseña, base y puerto de Docker.
- **El puerto 3000 está ocupado:** usa, por ejemplo, `PORT=3001` y `VITE_API_URL=http://localhost:3001/api/v1` en `.env`.
- **No llega una invitación en desarrollo:** confirma que Mailpit esté saludable, que SMTP use `localhost:1025` y abre `http://localhost:8025`.

## Documentación

El índice y el estado vigente están en [docs/README.md](docs/README.md). El contrato ejecutable se encuentra en [docs/openapi.yaml](docs/openapi.yaml). UML, manual de usuario y video formal permanecen fuera de alcance hasta aprobar el add-on correspondiente.
