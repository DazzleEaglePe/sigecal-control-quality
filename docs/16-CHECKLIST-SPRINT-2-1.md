# Checklist Sprint 2.1 — Cuentas internas

Fuente: RF-M1-04 a RF-M1-15, contrato API §3–4, seguridad §1 y UX §2.0.

## Contrato y persistencia

- [x] Documentar invitación, activación y recuperación antes de implementarlas.
- [x] Añadir estado de verificación de correo y tokens de cuenta con hash.
- [x] Mantener tokens de un solo uso, con expiración e invalidación de anteriores.
- [x] Regenerar y validar OpenAPI desde los esquemas Zod.

## API y seguridad

- [x] Restringir listado y detalle de usuarios a `ADMIN`.
- [x] Crear usuarios sin recibir ni enviar contraseñas provisionales.
- [x] Enviar invitación y permitir su reenvío controlado.
- [x] Implementar recuperación sin enumeración de cuentas.
- [x] Revocar sesiones al activar o restablecer contraseña.
- [x] Aplicar límites HTTP a invitación y recuperación.
- [x] Auditar acciones sin almacenar contraseñas ni tokens.

## Correo de desarrollo

- [x] Añadir Mailpit al entorno Docker con SMTP 1025 e interfaz 8025.
- [x] Encapsular Nodemailer detrás de un puerto de correo reemplazable.
- [x] Documentar variables de SMTP y sustitución para producción.
- [x] Verificar mensajes de invitación y recuperación en Mailpit.

## Interfaz

- [x] Listado con búsqueda, filtros y paginación en servidor.
- [x] Alta y edición de identidad, rol, área y cargo.
- [x] Activación o desactivación con confirmación accesible.
- [x] Reenvío de invitación e inicio de recuperación administrativa.
- [x] Pantallas públicas de activación y recuperación.
- [x] Acceso visible a cambio voluntario de contraseña.

## Evidencia de cierre

- [x] Pruebas de permisos para los cuatro roles.
- [x] Pruebas de expiración, reutilización y no enumeración.
- [x] `lint`, tipos, pruebas, formato, build y OpenAPI aprobados.
- [x] Seed idempotente con cuentas técnicas verificadas.
- [x] Recorrido funcional con correo capturado en Mailpit.

## Evidencia de cierre · 02/09/2026

- 197 pruebas aprobadas: API 134, web 30 y contratos compartidos 33.
- 64 archivos de prueba aprobados; ESLint, TypeScript, Prettier y builds en verde.
- Esquema Prisma válido, migración desplegada y seed idempotente verificado.
- OpenAPI regenerado y validado desde los esquemas compartidos.
- PostgreSQL y Mailpit saludables; invitación y recuperación capturadas por SMTP.
- API y web respondieron HTTP 200 en los puertos locales configurados.

## Observaciones no bloqueantes

- Vite mantiene una advertencia por el tamaño del paquete principal; el build termina correctamente y la optimización se prioriza en el Sprint 7.
- `npm audit --omit=dev` informa cuatro alertas altas transitivas del CLI Prisma 7.9.1. Su corrección automática propone retroceder a Prisma 6, por lo que no se aplicó un cambio mayor contrario al stack aprobado; debe reevaluarse al actualizar Prisma.
