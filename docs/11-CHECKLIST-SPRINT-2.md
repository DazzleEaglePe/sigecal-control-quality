# 11 · CHECKLIST OPERATIVO — SPRINT 2

**Objetivo:** implementar seguridad, usuarios y maestros sin introducir datos normativos reales no confirmados.

## 1. Contratos y configuración

- [x] Definir DTO Zod de login, refresh, sesión y cambio de contraseña.
- [x] Definir permisos efectivos compartidos sin duplicar la matriz por rol.
- [x] Documentar `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` y `/auth/password` en OpenAPI.
- [x] Validar secretos distintos, duración de tokens, cookies y límites de intentos al arrancar.

## 2. Autenticación backend

- [x] Firmar access token con `sub`, `role`, `iat` y `exp`.
- [x] Firmar refresh token con `sub`, `jti`, `iat` y `exp`.
- [x] Guardar exclusivamente SHA-256 del refresh token.
- [x] Transportar refresh únicamente en cookie `httpOnly` con ruta restringida.
- [x] Implementar login sin permitir enumeración de cuentas.
- [x] Implementar rotación obligatoria y detección de reutilización.
- [x] Implementar logout y revocación.
- [x] Implementar `/auth/me` con permisos calculados en servidor.
- [x] Implementar cambio de contraseña y revocación de sesiones.

## 3. Protecciones

- [x] Bloquear durante 15 minutos después de cinco fallos consecutivos.
- [x] Limitar intentos HTTP de login.
- [x] Implementar `authenticate`, `authorize` y restricción por contraseña provisional.
- [x] Registrar login, logout y cambio de contraseña sin datos sensibles.
- [x] Añadir pruebas de credenciales inválidas, bloqueo, expiración, rotación y reutilización.

## 4. Interfaz

- [x] Crear pantalla de ingreso accesible y responsiva.
- [x] Mantener access token solo en memoria.
- [x] Renovar mediante cookie sin exponer el refresh token.
- [x] Mostrar cambio obligatorio de contraseña antes de habilitar módulos.
- [x] Ocultar navegación según permisos recibidos, sin usarla como control de seguridad.

## 5. Usuarios y maestros

- [x] CRUD con baja lógica de usuarios y áreas.
- [x] CRUD de catálogos e instrumentos con verificación de uso.
- [x] Versionado de estándares y umbrales sin solapamientos.
- [x] Resolver estándar vigente por fecha y prioridad de ámbito.
- [x] Mantener todo rango no confirmado como provisional.

## 6. Cierre

- [x] Lint, tipos, pruebas, OpenAPI y builds pasan.
- [x] Los cuatro roles reciben exactamente los permisos de la matriz única.
- [x] Ningún token, hash, contraseña o cookie aparece en respuestas o auditoría.
- [x] Actualizar README y estado documental.

## 7. Evidencia de cierre — 24/08/2026

- 75 pruebas automatizadas: API 48, web 12 y contratos compartidos 15.
- Formato, ESLint, TypeScript estricto y builds de los tres workspaces aprobados.
- Esquema Prisma válido y seed verificado: 4 usuarios, 5 lotes `DEMO`, 8 resultados `DEMO` y 2 NC `DEMO`.
- OpenAPI regenerado y validado con autenticación, usuarios, áreas, catálogos, estándares y umbrales.
- Recorrido real en navegador: login, navegación protegida, seis catálogos, parámetros, historial de estándares y umbrales.
- Prueba HTTP real de baja protegida: un catálogo en uso devuelve `409 RESOURCE_IN_USE`.
- Los valores provisionales siguen excluidos al resolver estándares o umbrales para datos `REAL`.

**Cierre técnico:** Sprint 2 terminado. La carga de parámetros y rangos confirmados por la empresa continúa pendiente y bloquea el uso con datos `REAL`, no el inicio del Sprint 3.
