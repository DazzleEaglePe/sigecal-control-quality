# 00 · CONTEXTO DEL PROYECTO — SIGECAL

> **Documento base.** Todo agente de desarrollo debe leer este archivo antes de escribir una sola línea de código.

---

## 1. Identificación

| Campo                    | Valor                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| **Nombre del sistema**   | SIGECAL — Sistema de Gestión de Control de Calidad                     |
| **Cliente final**        | Viña Tacama S.A. — Av. Camino Real 390, La Tinguiña, Ica, Perú         |
| **Contratante**          | Genesis Nicolle Jesus Siguas Hernandez (tesista)                       |
| **Desarrollador**        | Bruno Velasques - DazzleEagle                                          |
| **Origen**               | Producto de software asociado a tesis de Ingeniería de Sistemas, UPSJB |
| **Plan contratado**      | COMPLETO (S/ 1,600) — 8 módulos                                        |
| **Ventana de ejecución** | 1 de setiembre de 2026 → 31 de diciembre de 2026 (8 quincenas)         |
| **Documento comercial**  | COT-2026-VT-001                                                        |

## 2. Por qué existe este sistema

Viña Tacama S.A. ejecuta su control de calidad de pisco con registros dispersos (cuadernos de laboratorio, hojas de cálculo sueltas, formatos en papel). Esto produce tres problemas concretos, que son exactamente las tres dimensiones que la tesis mide:

1. **Planificación deficiente** — las inspecciones no se programan de forma estructurada; se hacen cuando alguien se acuerda.
2. **Control tardío** — las desviaciones de parámetros se detectan después de que el lote avanzó de etapa, cuando corregir ya cuesta caro.
3. **Organización fragmentada** — no hay responsabilidades claras ni documentación consultable; las áreas no se coordinan.

SIGECAL centraliza la planificación de inspecciones, el registro de análisis fisicoquímicos y organolépticos, la trazabilidad por lote y el ciclo de no conformidades y acciones correctivas.

## 3. Restricción metodológica NO NEGOCIABLE

La variable independiente de la tesis está declarada literalmente como **"Sistema Web"** en la matriz de consistencia (Anexo 1) y en el cuadro de operacionalización (Anexo 2).

> ❌ **Prohibido** proponer o construir aplicación móvil nativa, aplicación de escritorio, o cualquier cosa que no sea una aplicación web.
> ✅ **Permitido y deseado:** aplicación web responsiva instalable como PWA. Sigue siendo un sistema web; el marco teórico de la propia tesis (sección 2.3.1, citando a Biorn-Hansen et al., 2020) sustenta explícitamente las PWA.

### Secuencia obligatoria de la intervención

El software y la investigación tienen calendarios relacionados, pero distintos:

1. **Pre-test:** aplicar el Anexo 5 antes de que los participantes accedan a SIGECAL.
2. **Desarrollo y validación:** construir el sistema y probarlo con datos de demostración separados de los datos reales.
3. **Piloto:** habilitar una versión estable para uso real controlado al cierre del Sprint 6.
4. **Post-test:** aplicar los anexos 4 y 5 después del periodo de uso que la tesista acuerde con su asesor.

No se cargan respuestas de las encuestas dentro de SIGECAL. Su captura y análisis en SPSS pertenecen al proceso de investigación, no al producto de software.

## 4. Perfiles de usuario

La empresa tiene **15 colaboradores** (1 jefe de área + 14 empleados, según Tabla 1 de la tesis). El sistema define 4 roles:

| Rol            | Quién es                  | Qué hace                                                                           |
| -------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `ADMIN`        | Soporte técnico / tesista | Configura el sistema, gestiona usuarios y maestros                                 |
| `JEFE_CALIDAD` | Jefe del área de calidad  | Programa inspecciones, aprueba cierres de no conformidad, ve todos los indicadores |
| `ANALISTA`     | Personal de laboratorio   | Registra resultados fisicoquímicos y evaluaciones organolépticas                   |
| `OPERARIO`     | Personal de planta        | Registra lotes, avanza etapas, reporta desviaciones                                |

El rol controla permisos; el área identifica la unidad organizacional. Cada usuario puede asociarse a un área mediante un catálogo mínimo para asignaciones y trazabilidad. Esto no convierte SIGECAL en un sistema de recursos humanos.

## 5. Glosario del dominio

El agente de desarrollo probablemente no conoce el dominio del pisco. Estos términos aparecen en el código y en la interfaz:

| Término                                                                          | Significado                                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Lote**                                                                         | Volumen de producción identificable que recorre todo el proceso. Unidad central de trazabilidad. |
| **Mosto**                                                                        | Jugo de uva antes o durante la fermentación.                                                     |
| **Quebranta, Italia, Torontel, Moscatel, Albilla, Negra Criolla, Uvina, Mollar** | Las 8 variedades de uva pisquera autorizadas por la Denominación de Origen.                      |
| **Pisco Puro**                                                                   | Elaborado con una sola variedad de uva.                                                          |
| **Pisco Acholado**                                                               | Mezcla de dos o más variedades.                                                                  |
| **Pisco Mosto Verde**                                                            | Destilado de mosto con fermentación interrumpida.                                                |
| **Análisis fisicoquímico**                                                       | Medición instrumental: grado alcohólico, acidez volátil, metanol, ésteres, furfural, congéneres. |
| **Análisis organoléptico**                                                       | Evaluación sensorial por panel humano: aroma, sabor, cuerpo, persistencia.                       |
| **Parámetro**                                                                    | Variable medible (ej. "grado alcohólico").                                                       |
| **Estándar**                                                                     | Rango de aceptación de un parámetro (ej. 38–48 % vol.).                                          |
| **No conformidad (NC)**                                                          | Resultado fuera del rango del estándar, o desviación de procedimiento.                           |
| **Acción correctiva**                                                            | Medida para eliminar la causa de una NC y evitar que se repita.                                  |
| **Corrección**                                                                   | Medida inmediata sobre el efecto (distinta de la acción correctiva).                             |
| **Trazabilidad**                                                                 | Capacidad de reconstruir el recorrido completo de un lote y todo lo que se le hizo.              |
| **NTP 211.001**                                                                  | Norma Técnica Peruana que fija los requisitos del pisco. Referencia normativa de los estándares. |

## 6. Etapas del proceso productivo

El lote avanza secuencialmente. La programación de inspecciones se ancla a estas etapas:

```
1. Recepción de uva     → control de °Brix, sanidad, variedad
2. Molienda/Despalillado → rendimiento, separación de raspón
3. Fermentación          → °Brix, temperatura, densidad, duración
4. Destilación           → grado alcohólico, puntos de corte (cabeza/cuerpo/cola)
5. Reposo                → tiempo mínimo, condiciones ambientales
6. Embotellado           → grado alcohólico final, volumen, análisis organoléptico
```

## 7. Alcance del Plan Completo

### ✅ Dentro del alcance

| Cód. | Módulo                                                              |
| ---- | ------------------------------------------------------------------- |
| M1   | Seguridad, usuarios y roles (4 perfiles, RBAC)                      |
| M2   | Estándares y parámetros de calidad                                  |
| M3   | Lotes y trazabilidad (con QR y línea de tiempo)                     |
| M4   | Programación de inspecciones (calendario y recordatorios)           |
| M5   | Análisis fisicoquímico (con gráficos de control)                    |
| M6   | Análisis organoléptico (panel sensorial)                            |
| M7   | No conformidades y acciones correctivas (con tiempos de respuesta)  |
| M8   | Reportes y tablero de indicadores                                   |
| —    | Bitácora de auditoría (transversal)                                 |
| —    | Catálogo mínimo de áreas y asociación de usuarios para coordinación |
| —    | Búsqueda global de lotes, inspecciones y no conformidades           |
| —    | PWA instalable con modo offline básico                              |
| —    | Accesibilidad WCAG 2.2 nivel AA                                     |

### ❌ Fuera del alcance

Estos temas aparecen mencionados en la **Introducción** de la tesis pero **no tienen ningún indicador que los mida** en los Anexos 2, 3, 4 ni 5. No se construyen:

- Gestión de personal / RRHH
- Control de inventarios de insumos
- Mantenimiento de equipamiento de laboratorio
- "Gestión de maquinarias agrícolas" (texto arrastrado de otra investigación; no aplica)
- Integración con instrumentos de laboratorio
- Facturación, ventas, compras
- Blockchain (aparece en el marco teórico como estado del arte, no como requerimiento)
- Machine learning / analítica predictiva (ídem)

> ⚠️ Si el agente detecta una petición que cae en esta lista, **no la implementa**: la reporta como cambio de alcance.

### 📌 Pendiente de aprobación (add-on, NO desarrollar aún)

- Diagramas UML (casos de uso, clases, secuencia, entidad-relación) y diagrama de arquitectura
- Manual de usuario formal
- Video demostrativo para sustentación

## 8. Modo de trabajo con el agente de desarrollo

1. **La documentación manda.** Estos markdowns son la fuente de verdad. Si el código contradice el documento, el código está mal.
2. **No inventar requerimientos.** Si algo no está en `02-REQUERIMIENTOS-FUNCIONALES.md`, no se construye.
3. **No inventar datos del dominio.** Los estándares de calidad son configurables por el usuario; el agente no debe hardcodear valores normativos que no estén explícitos en `05-MODELO-DATOS.md`.
4. **Ante ambigüedad, preguntar.** Es preferible una pregunta a una suposición que después hay que deshacer.
5. **Un dato no evaluable no es conforme.** La ausencia de estándar vigente bloquea el guardado definitivo del resultado.

## 9. Orden de lectura de los documentos

```
00-CONTEXTO-PROYECTO.md        ← estás aquí
01-ANALISIS-TESIS.md           ← por qué cada módulo existe
02-REQUERIMIENTOS-FUNCIONALES.md
03-REQUERIMIENTOS-NO-FUNCIONALES.md
04-ARQUITECTURA.md
05-MODELO-DATOS.md
06-API-CONTRACT.md
07-SEGURIDAD-AUTH.md
08-UX-FLUJOS.md
09-PLAN-DESARROLLO.md
AGENTS.md                      ← reglas de comportamiento del agente
```
