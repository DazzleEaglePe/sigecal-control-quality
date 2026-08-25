# 07 · SEGURIDAD Y AUTENTICACIÓN

---

## 1. Esquema de autenticación

**JWT con doble token.**

| Token          | Duración   | Almacenamiento en cliente                                                     | Contenido                   |
| -------------- | ---------- | ----------------------------------------------------------------------------- | --------------------------- |
| `accessToken`  | 15 minutos | Memoria de la aplicación (estado), **nunca** en `localStorage`                | `sub`, `role`, `iat`, `exp` |
| `refreshToken` | 7 días     | Cookie host-only `httpOnly`, `secure`, `sameSite=strict`, ruta `/api/v1/auth` | `sub`, `jti`                |

**Por qué el token de acceso no va en `localStorage`:** cualquier script inyectado podría leerlo. Al mantenerlo en memoria, un cierre de pestaña obliga a renovar mediante la cookie, que el JavaScript no puede leer.

### Flujo

```
1. POST /auth/login  → valida credenciales
                     → genera accessToken + refreshToken
                     → guarda el hash del refreshToken en RefreshToken
                     → devuelve accessToken en el cuerpo y refreshToken en cookie httpOnly

2. Cada petición      → Authorization: Bearer <accessToken>
                     → middleware auth verifica firma y expiración
                     → adjunta { userId, role } a la petición

3. Al expirar (401)   → el cliente llama POST /auth/refresh
                     → se valida el refreshToken contra su hash almacenado
                     → rotación: se revoca el anterior y se emite uno nuevo
                     → se devuelve un accessToken nuevo

4. POST /auth/logout  → marca revokedAt en el refreshToken y limpia la cookie
```

El token de refresco **nunca** se devuelve en JSON, encabezados personalizados, `localStorage`, `sessionStorage` ni IndexedDB. La base conserva un SHA-256 del token de alta entropía, no el valor original. Login, refresh y logout responden `Cache-Control: no-store`.

**Rotación obligatoria.** Cada uso del token de refresco lo revoca y emite uno nuevo. Si llega un token ya revocado, se revocan **todos** los tokens del usuario y se fuerza el reingreso: es la señal de un token robado.

### Reglas de contraseña

- Mínimo 8 caracteres, con al menos una letra y un número.
- Almacenamiento con bcrypt, factor de costo 10.
- Bloqueo de 15 minutos tras 5 intentos fallidos consecutivos (RF-M1-10).
- Los intentos fallidos se reinician al ingresar correctamente.
- La contraseña provisional obliga a cambiarla en el primer ingreso.
- Mientras `mustChangePassword = true`, el servidor solo permite `/auth/me`, `/auth/password` y `/auth/logout`.

---

## 2. Autorización (RBAC)

**La autorización se resuelve siempre en el servidor.** El frontend oculta opciones por comodidad visual, nunca como control de seguridad (RNF-SE-04).

### Middleware

```
authenticate            → verifica el token; adjunta el usuario a la petición
authorize(...roles)     → verifica que el rol esté entre los permitidos
authorizeOwner(...)     → verifica además que el recurso pertenezca al usuario
```

Uso en rutas:

```
router.post('/batches/:id/close',
  authenticate,
  authorize('ADMIN', 'JEFE_CALIDAD'),
  batchController.close
);
```

### Matriz de permisos

Es la misma tabla de `02-REQUERIMIENTOS-FUNCIONALES.md`, sección "Matriz de permisos por rol". Debe implementarse como una constante única en `config/permissions.ts` y consumirse tanto por el middleware como por el extremo `GET /auth/me`, de modo que el frontend reciba los permisos efectivos y no los deduzca por su cuenta.

### Reglas de autorización específicas

| Regla                              | Detalle                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Cierre de no conformidad           | Exclusivo de `JEFE_CALIDAD` y `ADMIN` (RF-M7-14)                                                      |
| Verificación de eficacia           | El verificador **no puede** ser el mismo usuario responsable de la acción                             |
| Corrección de resultados           | `ANALISTA` solo corrige resultados o sesiones que registró; A/J pueden corregir cualquiera con motivo |
| Ejecución de acciones              | `ANALISTA` solo ejecuta acciones donde figura como responsable; A/J conservan supervisión             |
| Cierre de lote                     | Exclusivo de `JEFE_CALIDAD` y `ADMIN`                                                                 |
| Tablero del `OPERARIO`             | Solo ve lotes e inspecciones donde figura como responsable                                            |
| Búsqueda y listados del `OPERARIO` | El alcance por pertenencia se aplica en servidor antes de paginar o calcular totales                  |
| Bitácora de auditoría              | Solo `ADMIN` y `JEFE_CALIDAD`                                                                         |
| Gestión de usuarios                | Exclusivo de `ADMIN`                                                                                  |
| Notificaciones                     | Cada usuario solo consulta o marca sus propias notificaciones                                         |

---

## 3. Validación de entrada

Toda entrada se valida con **Zod** en el middleware, antes de llegar al controlador.

```
validate(schema)  → valida body, params y query
                  → si falla, responde 400 con el detalle por campo
                  → si pasa, reemplaza la entrada por el objeto ya tipado y saneado
```

Reglas obligatorias:

- Ningún controlador recibe datos sin validar.
- Los identificadores se validan como UUID.
- Los valores numéricos se validan por rango (ej. calificación sensorial entre 1 y 5).
- Las fechas se validan como ISO 8601 y se rechazan fechas futuras donde no correspondan (ej. `detectedAt`).
- Los campos de texto libre se limitan en longitud y se sanean para prevenir inyección de HTML.
- Las enumeraciones se validan contra sus valores permitidos; nunca se acepta texto libre donde corresponde una enumeración.

---

## 4. Protecciones aplicadas

| Amenaza                | Medida                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Inyección SQL          | Acceso a datos exclusivamente por Prisma. Prohibida la concatenación de SQL y el uso de `$queryRawUnsafe`     |
| XSS                    | Saneamiento de entradas; React escapa por defecto. Prohibido `dangerouslySetInnerHTML`                        |
| CSRF                   | Cookie del token de refresco con `sameSite=strict`; el token de acceso viaja por cabecera, no por cookie      |
| Fuerza bruta           | Bloqueo de cuenta y limitación de peticiones: 5 intentos por minuto en `/auth/login`                          |
| Exposición de datos    | Los DTO de salida jamás incluyen `passwordHash`, `tokenHash` ni campos internos                               |
| Cabeceras inseguras    | Helmet activo con la configuración por defecto                                                                |
| Origen no autorizado   | CORS restringido al dominio del frontend. Prohibido `origin: '*'`                                             |
| Cargas excesivas       | Límite de tamaño de cuerpo de 1 MB                                                                            |
| Filtración de secretos | Variables de entorno; `.env` en `.gitignore`; `.env.example` sin valores reales                               |
| Errores informativos   | El cliente nunca recibe trazas ni mensajes de la base de datos                                                |
| Caché PWA              | Datos segmentados por usuario, sin tokens; limpieza completa al cerrar sesión                                 |
| Manipulación de reglas | Estándares y umbrales se resuelven en servidor; se rechazan campos equivalentes enviados por rutas operativas |

### Topología de producción

Frontend y API deben compartir el mismo sitio registrable, idealmente con la API detrás de `/api`. Las peticiones de autenticación usan `credentials: 'include'`, CORS acepta únicamente `CORS_ORIGIN` y `Access-Control-Allow-Credentials: true`. En desarrollo local la cookie puede usar `secure=false`; en producción `secure=true` es obligatorio.

---

## 5. Auditoría

El middleware `audit` se aplica a toda ruta que modifique datos operativos.

| Se audita                                                                | No se audita          |
| ------------------------------------------------------------------------ | --------------------- |
| Creación de lotes, inspecciones, resultados, no conformidades y acciones | Consultas de listado  |
| Cambios de estado de cualquier entidad                                   | Consultas de detalle  |
| Modificación de estándares y maestros                                    | Notificaciones leídas |
| Ingreso y salida de sesión                                               |                       |
| Exportación de reportes                                                  |                       |
| Gestión de usuarios y roles                                              |                       |

Cada registro conserva usuario, acción, entidad, identificador, valores anterior y posterior, dirección IP y momento. Los campos sensibles se excluyen del volcado: la contraseña jamás llega a la bitácora, ni siquiera cifrada.

Antes de persistir `before` y `after`, un sanitizador central elimina claves sensibles como `password`, `passwordHash`, `token`, `tokenHash`, secretos y cookies. La auditoría no guarda cuerpos completos de autenticación.

---

## 6. Variables de entorno

```
# Base de datos
DATABASE_URL="postgresql://usuario:clave@localhost:5432/sigecal"

# Autenticación
JWT_ACCESS_SECRET="<cadena aleatoria de 64 caracteres>"
JWT_REFRESH_SECRET="<cadena aleatoria distinta de 64 caracteres>"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"
BCRYPT_ROUNDS=10

# Aplicación
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
API_PREFIX="/api/v1"
COOKIE_SECURE=false
COOKIE_SAME_SITE="strict"
COOKIE_PATH="/api/v1/auth"

# Seguridad
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_MINUTES=15
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=5

# Datos iniciales
SEED_ADMIN_EMAIL="admin@sigecal.pe"
SEED_DEFAULT_PASSWORD="<definir en la instalación>"
```

> Los dos secretos JWT deben ser **distintos entre sí**. Si comparten valor, un token de acceso podría usarse como token de refresco.
> `SEED_DEFAULT_PASSWORD` se define en la instalación y se cambia en el primer ingreso. No se versiona ningún valor real.

---

## 7. Lista de verificación previa al despliegue

- [ ] `NODE_ENV=production`
- [ ] Secretos JWT generados aleatoriamente y distintos entre sí
- [ ] `CORS_ORIGIN` apuntando al dominio real del frontend
- [ ] HTTPS activo
- [ ] Frontend y API cumplen ADR-008 y la cookie se envía en login, refresh y logout
- [ ] Contraseñas del script de datos iniciales cambiadas
- [ ] Ninguna sentencia de depuración en el código
- [ ] `.env` ausente del repositorio
- [ ] Migraciones aplicadas
- [ ] Respaldo de base de datos verificado
- [ ] Cuentas de prueba innecesarias desactivadas
- [ ] Caché de datos verificada como vacía después de cerrar sesión o cambiar de usuario
