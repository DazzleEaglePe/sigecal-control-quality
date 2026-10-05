# 18 · GUÍA DE DESPLIEGUE Y CIERRE DEL SPRINT 8

## Estado

El repositorio ya incluye Dockerfiles de producción para API y web, Compose de
producción, proxy del mismo origen para `/api` y una plantilla de variables.
Esto deja reproducible la preparación del despliegue. El sistema todavía no
está publicado: el dominio, proveedor, certificados TLS, SMTP y credenciales de
producción los debe proporcionar la tesista o la organización.

La configuración de correo admite `MAIL_USER` y `MAIL_PASSWORD` como par:
Compose de producción rechaza el arranque si falta uno de los dos. Mailpit
local sigue usando SMTP sin autenticación al omitir ambas variables. La API
bloquea producción sin autenticación y, con `MAIL_SECURE=false`, exige STARTTLS
antes de enviar credenciales o mensajes; use TLS implícito si el proveedor lo
requiere. El envío real debe comprobarse con el SMTP proporcionado por Tacama.

La imagen final de API usa dependencias de ejecución aisladas: `npm ci` de ese
conjunto reportó cero vulnerabilidades conocidas y excluye el CLI de Prisma
(esto no equivale a un escaneo de la imagen base del sistema operativo). El
audit del repositorio sigue señalando cuatro hallazgos altos en Prisma CLI
7.9.1 y sus dependencias, que permanecen en desarrollo y en la imagen temporal
de migraciones; el riesgo se documenta en ADR-003 hasta contar con una
actualización compatible de Prisma. Nodemailer se actualizó a 10.0.14 por sus
avisos de seguridad, según ADR-013.

## Arquitectura de publicación

```text
Internet
   │ HTTPS (certificado y dominio del proveedor/ingress)
   ▼
Proxy TLS del proveedor
   │ HTTP hacia el puerto WEB_PORT del host
   ▼
Nginx / frontend ─────── /api/* ─────── API Express
                                             │
                                             ├── PostgreSQL privado
                                             └── SMTP autorizado
```

Frontend y API comparten el mismo origen registrable. PostgreSQL no publica un
puerto al host. Mailpit no se incluye en Compose de producción. El proxy TLS
externo debe conservar `Host` y enviar `X-Forwarded-Proto: https` al Nginx.

## Preparación en un host de despliegue

Requisitos: Docker Engine con Compose v2, dominio HTTPS terminado por un proxy
TLS gestionado, salida SMTP autorizada y espacio persistente para PostgreSQL.

1. Clonar el repositorio en la revisión aprobada para el despliegue.
2. Copiar `.env.production.example` a `.env.production` y restringir permisos
   del archivo al usuario del servicio.
3. Sustituir todos los valores `replace-*`, usar dos secretos JWT distintos de
   al menos 64 caracteres y establecer los datos SMTP reales. Mantener
   `COOKIE_SECURE=true` y el origen público exacto en `CORS_ORIGIN` y
   `WEB_BASE_URL`. Citar con comillas simples los valores del archivo Compose
   que contengan `$`, `#` o espacios; codificar con percent-encoding los
   caracteres reservados de la contraseña cuando se inserte en `DATABASE_URL`.
4. Configurar el proveedor TLS para dirigir HTTPS a `WEB_PORT` del servidor y
   preservar `Host` y `X-Forwarded-Proto`.
5. Validar la configuración y construir imágenes:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml config
   docker compose --env-file .env.production -f docker-compose.production.yml build
   ```

6. Iniciar PostgreSQL y esperar su estado saludable:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d postgres
   docker compose --env-file .env.production -f docker-compose.production.yml ps
   ```

7. Aplicar migraciones con el servicio temporal. Este comando no ejecuta el
   seed ni crea cuentas de demostración:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml \
     --profile migration run --build --rm migrate
   ```

8. Iniciar API y web:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d api web
   docker compose --env-file .env.production -f docker-compose.production.yml ps
   ```

   Verificar conexión, TLS y autenticación SMTP sin enviar mensajes:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml \
     exec -T api node apps/api/dist/scripts/verify-smtp.js
   ```

9. Comprobar `https://<dominio>/`, `https://<dominio>/api/v1/health`, el
   ingreso, renovación y salida de sesión. Revisar que la cookie de refresh
   aparezca como `Secure`, `HttpOnly`, `SameSite=Strict` y con ruta
   `/api/v1/auth`.
10. Crear o activar las cuentas mediante el flujo administrativo. No usar la
    contraseña compartida del seed para cuentas reales.

### Datos DEMO

El seed local crea cuentas técnicas con una contraseña común y datos
demostrativos. **No ejecutar `db:seed` en producción.** Si la demostración
requiere registros DEMO, cargar un conjunto controlado en un entorno de
demostración separado o preparar un seed de producción aprobado con cuentas
únicas, contraseñas no compartidas y verificación de `dataOrigin=DEMO` antes de
su uso. Los estándares provisionales no sirven para declarar conformes lotes
`REAL`.

## Respaldo y recuperación

Crear un respaldo antes de cada migración y establecer una frecuencia acordada
con la organización. Ejemplo para una copia manual:

```bash
umask 077
docker compose --env-file .env.production -f docker-compose.production.yml \
  exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > sigecal-$(date +%F-%H%M%S).dump
```

Guardar el archivo cifrado fuera del servidor y probar su restauración en una
base aislada antes de aceptar el respaldo como recuperable. La retención,
cifrado y ubicación final los define la organización.

## Reversión de una versión

1. Detener la publicación de tráfico al servicio web.
2. Restaurar las imágenes anteriores mediante su `SIGECAL_IMAGE_TAG` guardado.
3. Si la migración modificó el esquema de forma incompatible, restaurar el
   respaldo en una instancia aislada y ejecutar el procedimiento de recuperación
   aprobado por el DBA/organización. No revertir migraciones destructivas a mano.
4. Verificar salud, login y lectura de trazabilidad antes de volver a publicar.

## Lista de cierre de Sprint 8

- [ ] Dominio, proveedor y responsable de operación confirmados.
- [ ] TLS, CORS, cookies y correo transaccional comprobados en el dominio real.
- [ ] Secretos JWT únicos almacenados por un mecanismo privado y rotables.
- [ ] Migraciones aplicadas; seed de desarrollo no ejecutado en producción.
- [ ] Respaldo externo creado y restauración ensayada.
- [ ] Cuentas, permisos y credenciales entregados de forma individual.
- [ ] Parámetros, rangos, instrumentos y umbrales reales aprobados por Tacama.
- [ ] Datos `DEMO` claramente identificados y separados de evidencia académica.
- [ ] Versión probada con Nicolle y responsable operativo.
- [ ] Anexos, post-test, evidencia y traspaso cerrados con el asesor.

## Dependencias de la tesista y la organización

| Insumo                                                | Responsable                                   |
| ----------------------------------------------------- | --------------------------------------------- |
| Proveedor, dominio y cuenta de despliegue             | Tesista / organización                        |
| Certificado HTTPS y política de respaldo              | Organización / responsable de infraestructura |
| SMTP, remitente y credenciales de servicio            | Organización                                  |
| Parámetros y estándares definitivos                   | Tacama / jefatura de calidad                  |
| Participantes, duración del piloto y plan estadístico | Tesista con asesor                            |
| Pre-test, Anexo 4 y post-test                         | Tesista                                       |
