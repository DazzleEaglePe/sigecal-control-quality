# 03 · REQUERIMIENTOS NO FUNCIONALES

> Mapeados a **ISO/IEC 25010**. Esta norma ya está citada en el Anexo 2 de la tesis (Rojas et al., 2025), y las dimensiones "usabilidad" y "funcionalidad" de la variable independiente son características de esa misma norma. Alinearlos hace que la propuesta técnica sea defendible ante el jurado.

---

## 1. Adecuación funcional

| ID        | Requerimiento                                                                                           | Verificación                                    |
| --------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| RNF-AF-01 | Todo RF marcado 🔴 en `02` debe estar implementado y operativo                                          | Checklist de aceptación por sprint              |
| RNF-AF-02 | La validación de resultados contra estándares debe ser exacta, sin redondeos que alteren la conformidad | Casos de prueba en los bordes del rango         |
| RNF-AF-03 | Los cálculos de tiempo de respuesta se expresan en horas con un decimal                                 | Prueba unitaria                                 |
| RNF-AF-04 | Ningún resultado sin estándar vigente se contabiliza como conforme ni se guarda como definitivo         | Prueba de integración y revisión de indicadores |
| RNF-AF-05 | Los datos de demostración se identifican y quedan excluidos por defecto de indicadores operativos       | Prueba de reportes                              |

## 2. Eficiencia de desempeño

| ID        | Requerimiento                                                                   | Verificación         |
| --------- | ------------------------------------------------------------------------------- | -------------------- |
| RNF-EF-01 | Las pantallas de listado responden en menos de 2 segundos con 500 registros     | Medición manual      |
| RNF-EF-02 | Las consultas de la API responden en menos de 500 ms en el percentil 95         | Registro de tiempos  |
| RNF-EF-03 | Todo listado que pueda superar los 50 registros debe estar paginado en servidor | Revisión de código   |
| RNF-EF-04 | La carga inicial de la aplicación no supera los 3 segundos en conexión 4G       | Lighthouse           |
| RNF-EF-05 | Toda consulta filtrada debe apoyarse en un índice de base de datos              | Revisión del esquema |

## 3. Compatibilidad

| ID        | Requerimiento                                                                   |
| --------- | ------------------------------------------------------------------------------- |
| RNF-CO-01 | Funciona en Chrome, Edge y Firefox en sus dos últimas versiones                 |
| RNF-CO-02 | Funciona en pantallas desde 360 px hasta 1920 px de ancho                       |
| RNF-CO-03 | Los archivos exportados abren correctamente en Microsoft Excel y en LibreOffice |

## 4. Usabilidad

_Esta característica es medida directamente por los ítems A4-01 a A4-06. Es la de mayor peso académico._

| ID        | Requerimiento                                                                                                                               | Ítem relacionado |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| RNF-US-01 | Toda etiqueta de la interfaz usa lenguaje del dominio de calidad, no jerga técnica ni nombres de tabla                                      | A4-04            |
| RNF-US-02 | Ninguna tarea principal requiere más de 3 clics desde el tablero                                                                            | A4-01, A4-03     |
| RNF-US-03 | Todo formulario valida en el momento de la digitación y muestra el error junto al campo                                                     | A4-01            |
| RNF-US-04 | Todo mensaje de error indica qué ocurrió y qué debe hacer el usuario; nunca muestra códigos internos ni trazas                              | A4-05            |
| RNF-US-05 | Toda acción destructiva o irreversible pide confirmación explícita                                                                          | A4-05            |
| RNF-US-06 | Toda operación exitosa muestra confirmación visible                                                                                         | A4-05            |
| RNF-US-07 | La navegación principal es idéntica en todas las pantallas y señala la sección activa                                                       | A4-03            |
| RNF-US-08 | Los estados de carga se muestran con indicadores; nunca pantallas en blanco                                                                 | A4-01            |
| RNF-US-09 | Los listados vacíos muestran un mensaje explicativo con la acción sugerida, no una tabla vacía                                              | A4-03            |
| RNF-US-10 | Cumplimiento de **WCAG 2.2 nivel AA**: contraste mínimo 4.5:1, navegación completa por teclado, etiquetas ARIA en formularios, foco visible | A4-01 a A4-06    |
| RNF-US-11 | Toda la interfaz está en español, incluyendo fechas (dd/mm/aaaa) y números (separador decimal coma)                                         | —                |
| RNF-US-12 | Los montos y volúmenes usan el formato peruano                                                                                              | —                |

## 5. Fiabilidad

| ID        | Requerimiento                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RNF-FI-01 | Los errores no controlados no exponen información interna al usuario; se registran en el servidor                                                                        |
| RNF-FI-02 | Toda operación que afecte varias tablas se ejecuta dentro de una transacción                                                                                             |
| RNF-FI-03 | La aplicación conserva su estado ante una desconexión momentánea y reintenta la operación                                                                                |
| RNF-FI-04 | Modo offline básico durante una sesión ya iniciada: las consultas visitadas siguen disponibles; los formularios conservan el borrador y no permiten guardar sin conexión |
| RNF-FI-05 | Respaldo de base de datos previo a cada despliegue                                                                                                                       |
| RNF-FI-06 | Al cerrar sesión se eliminan los datos de API almacenados por la PWA; la caché de un usuario nunca se muestra a otro                                                     |

## 6. Seguridad

_Detalle completo en `07-SEGURIDAD-AUTH.md`._

| ID        | Requerimiento                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| RNF-SE-01 | Las contraseñas se almacenan con bcrypt, factor de costo mínimo 10                                                                |
| RNF-SE-02 | Toda comunicación viaja sobre HTTPS                                                                                               |
| RNF-SE-03 | Toda ruta protegida valida el token de acceso y los permisos del rol en el servidor                                               |
| RNF-SE-04 | La validación de permisos nunca depende únicamente del frontend                                                                   |
| RNF-SE-05 | Toda entrada de usuario se valida y sanea en el servidor con esquemas declarativos                                                |
| RNF-SE-06 | Las consultas usan exclusivamente el ORM o consultas parametrizadas; prohibida la concatenación de SQL                            |
| RNF-SE-07 | Los secretos residen en variables de entorno; prohibido versionarlos                                                              |
| RNF-SE-08 | Los registros de auditoría son de solo lectura desde la aplicación                                                                |
| RNF-SE-09 | Limitación de peticiones en los extremos de autenticación                                                                         |
| RNF-SE-10 | Cabeceras de seguridad activas (Helmet) y CORS restringido al dominio del frontend                                                |
| RNF-SE-11 | El token de refresco se entrega exclusivamente mediante cookie `httpOnly`; nunca aparece en JSON ni es accesible desde JavaScript |
| RNF-SE-12 | Los umbrales y estándares aplicados se resuelven en el servidor y no se aceptan desde formularios operativos                      |

## 7. Mantenibilidad

| ID        | Requerimiento                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-MA-01 | El código sigue los principios SOLID; la lógica de negocio reside en la capa de servicios, nunca en controladores                           |
| RNF-MA-02 | Los controladores no acceden directamente a la base de datos; solo a través de servicios y repositorios                                     |
| RNF-MA-03 | TypeScript en modo estricto, sin uso de `any` salvo justificación comentada                                                                 |
| RNF-MA-04 | Nomenclatura consistente: código, variables y funciones en inglés; contenido visible al usuario en español                                  |
| RNF-MA-05 | Ninguna función supera las 40 líneas; ningún archivo supera las 300                                                                         |
| RNF-MA-06 | Sin números mágicos ni cadenas repetidas: constantes y enumeraciones centralizadas                                                          |
| RNF-MA-07 | ESLint y Prettier configurados; sin advertencias en la rama principal                                                                       |
| RNF-MA-08 | Pruebas unitarias sobre la lógica de negocio crítica: validación contra estándares, cálculo de tiempos de respuesta, transiciones de estado |
| RNF-MA-09 | Toda regla de negocio no evidente lleva un comentario que explique el porqué, no el qué                                                     |
| RNF-MA-10 | Estructura de carpetas por módulo de dominio, no por tipo técnico                                                                           |

## 8. Portabilidad

| ID        | Requerimiento                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-PO-01 | El proyecto arranca en local con un solo comando tras copiar el archivo de variables de entorno                                        |
| RNF-PO-02 | Se incluye `.env.example` con todas las variables documentadas                                                                         |
| RNF-PO-03 | Se incluye `docker-compose.yml` para levantar la base de datos en local                                                                |
| RNF-PO-04 | Las migraciones de base de datos son versionadas y reproducibles                                                                       |
| RNF-PO-05 | Se incluye un script de datos iniciales (usuarios, maestros y estándares de referencia)                                                |
| RNF-PO-06 | El sistema despliega mediante variables de entorno en servicios compatibles con la topología segura del ADR-008, sin cambios de lógica |

---

## Restricciones tecnológicas fijas

Estas decisiones fueron revisadas el 24/08/2026 y quedan fijas durante el desarrollo. Una actualización de versión mayor requiere un ADR:

| Aspecto               | Decisión                                       |
| --------------------- | ---------------------------------------------- |
| Entorno de ejecución  | Node.js 24 LTS                                 |
| Lenguaje              | TypeScript (modo estricto), backend y frontend |
| Framework de API      | Express 5                                      |
| ORM                   | Prisma 7 estable                               |
| Base de datos         | PostgreSQL 16                                  |
| Autenticación         | JWT con token de acceso y token de refresco    |
| Frontend              | React 19.2 + Vite 8.1                          |
| Estilos               | Tailwind CSS 4.3                               |
| Repositorio           | Monorepo                                       |
| Estilo arquitectónico | Monolito modular por capas                     |
| Control de versiones  | Git, con ramas por sprint                      |

El archivo de bloqueo del gestor de paquetes se versiona. Las dependencias de producción se fijan a una versión exacta al iniciar el Sprint 1; no se usa la etiqueta `latest` en instalaciones reproducibles.

## Criterios de aceptación por sprint

Un sprint se considera cerrado únicamente cuando:

1. Todos los RF 🔴 del sprint funcionan de extremo a extremo.
2. No hay errores en la consola del navegador ni en el registro del servidor.
3. El código pasa ESLint sin advertencias.
4. Las pruebas unitarias del sprint pasan.
5. Existe una grabación breve, sin edición, como evidencia funcional del sprint. No equivale al video demostrativo formal del add-on.
6. La tesista dio su conformidad.
