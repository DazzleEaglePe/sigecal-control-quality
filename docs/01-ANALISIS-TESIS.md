# 01 · ANÁLISIS DE LA TESIS Y TRAZABILIDAD

> Este documento explica **por qué existe cada módulo**. Es la defensa académica del sistema. Si un módulo no aparece acá, no debería existir; si un indicador de la tesis no tiene módulo, la tesis queda sin respaldo.

---

## 1. Diseño de la investigación

| Elemento                   | Valor declarado                       |
| -------------------------- | ------------------------------------- |
| Tipo                       | Aplicada                              |
| Enfoque                    | Cuantitativo                          |
| Diseño                     | **Preexperimental** (G — O₁ — X — O₂) |
| Población                  | 15 colaboradores (censo, no muestreo) |
| Instrumento                | Cuestionario, escala Likert 1–5       |
| Variable independiente (X) | **Sistema Web** → SIGECAL             |
| Variable dependiente (O)   | **Proceso de Control de Calidad**     |
| Procesamiento              | SPSS Statistics 26                    |

**Implicancia directa para el desarrollo:** el diseño preexperimental exige una medición **antes** (O₁) y otra **después** (O₂) de implantar el sistema. Por tanto:

- El **Anexo 5** (variable dependiente) se aplica en pre-test y post-test.
- El **Anexo 4** (variable independiente) solo puede aplicarse en post-test, porque pregunta por la experiencia de uso de un sistema que en el pre-test no existe.
- El Anexo 5 se aplica como pre-test **antes de entregar credenciales o realizar el piloto**.
- El sistema debe quedar funcional al cierre del Sprint 6 para disponer de una ventana real de uso durante los sprints 7 y 8.
- El Anexo 4 y el post-test del Anexo 5 se aplican después del piloto, en la fecha y con la duración de exposición aprobadas por el asesor.
- Las respuestas deben poder emparejarse por participante mediante un código seudónimo; SIGECAL no almacena encuestas ni conoce esa correspondencia.

> La tesis todavía debe definir con el asesor la prueba estadística, el nivel de significancia, la validación del instrumento y el criterio de aceptación de las hipótesis. El software no sustituye ese protocolo.

## 2. Operacionalización → módulos

### 2.1 Variable independiente: Sistema Web

| Dimensión         | Indicador                  | Módulo responsable   | Ítems del Anexo 4 |
| ----------------- | -------------------------- | -------------------- | ----------------- |
| **Usabilidad**    | Facilidad de uso           | Transversal (UX)     | 01, 02            |
|                   | Interfaz intuitiva         | Transversal (UX)     | 03, 04            |
|                   | Satisfacción del usuario   | Transversal (UX)     | 05, 06            |
| **Funcionalidad** | Cumplimiento de requisitos | M2, M4, M5, M6       | 07, 08            |
|                   | Integración de procesos    | M3, M4, M5, M7       | 09, 10            |
|                   | Efectividad operativa      | M5, M7               | 11, 12            |
| **Trazabilidad**  | Registro de actividades    | M3, Auditoría        | 13, 14            |
|                   | Seguimiento de procesos    | M3 (línea de tiempo) | 15, 16            |
|                   | Generación de reportes     | M8                   | 17, 18            |

### 2.2 Variable dependiente: Proceso de Control de Calidad

| Dimensión         | Indicador                           | Módulo responsable                     | Ítems del Anexo 5 |
| ----------------- | ----------------------------------- | -------------------------------------- | ----------------- |
| **Planificación** | Definición de objetivos de calidad  | M2 — Estándares y parámetros           | 01, 02, 03        |
|                   | Programación de inspecciones        | M4 — Calendario de inspecciones        | 04, 05, 06        |
|                   | Asignación de recursos              | M4 — Responsable + instrumento         | 07, 08, 09        |
| **Control**       | Detección de no conformidades       | M5 — Validación automática vs estándar | 10, 11, 12        |
|                   | Tiempo de respuesta ante problemas  | M7 — Cálculo detección→atención        | 13, 14, 15        |
|                   | Seguimiento de acciones correctivas | M7 — Ciclo CAPA con verificación       | 16, 17, 18        |
| **Organización**  | Distribución de responsabilidades   | M1 — Roles y permisos                  | 19, 20, 21        |
|                   | Documentación de procesos           | M3 + Auditoría                         | 22, 23, 24        |
|                   | Coordinación entre áreas            | M4 + Notificaciones                    | 25, 26, 27        |

### 2.3 Nivel real de cobertura

Los 45 ítems son trazables, pero no todos pueden ser garantizados por software:

| Tipo de respaldo | Cantidad | Interpretación                                                                           |
| ---------------- | -------: | ---------------------------------------------------------------------------------------- |
| Directo          |       35 | Existe una función o evidencia objetiva de SIGECAL                                       |
| Indirecto        |        6 | SIGECAL facilita el resultado, pero intervienen personas o recursos físicos              |
| Organizacional   |        4 | Depende principalmente de decisiones de la empresa o de la intervención de investigación |

Ítems indirectos: A5-08, A5-09, A5-15, A5-20, A5-25 y A5-26. Ítems organizacionales: A5-07, A5-18, A5-22 y A5-27.

**Conclusión correcta:** 45/45 ítems analizados y trazados; 35/45 con respaldo funcional directo. No se debe afirmar que el software garantiza suficiencia de personal, mantenimiento físico de equipos, actualización de procedimientos o trabajo en equipo.

## 3. Requisitos derivados de ítems específicos

Algunos ítems del cuestionario exigen comportamientos muy concretos. Se listan porque son fáciles de omitir:

| Ítem     | Texto (resumido)                                                        | Exigencia técnica                                                                                                          |
| -------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| A4-04    | "encontrar funciones sin necesidad de ayuda o capacitación"             | Navegación autoexplicativa, etiquetas en lenguaje del dominio, no jerga técnica                                            |
| A4-09    | "conectar y coordinar las diferentes etapas del proceso"                | El lote debe atravesar visiblemente las 6 etapas; no módulos aislados                                                      |
| A4-14    | "consultar fácilmente el historial de inspecciones"                     | Búsqueda y filtrado sobre inspecciones históricas                                                                          |
| A4-16    | "rastrear etapas completadas y pendientes **en tiempo real**"           | Estado de etapa visible y actualizado, sin recarga manual                                                                  |
| A4-18    | "crear y **personalizar** reportes"                                     | Reportes con filtros configurables por el usuario, no fijos                                                                |
| A5-06    | "cronograma permite detectar problemas de forma **temprana**"           | Alertas de inspección próxima y vencida                                                                                    |
| A5-07    | "recursos humanos... suficientes"                                       | El sistema muestra carga y asignaciones; la suficiencia de personal es una decisión organizacional                         |
| A5-08    | "equipos e instrumentos... en óptimas condiciones"                      | Registro del estado y del instrumento usado; SIGECAL no realiza mantenimiento físico                                       |
| A5-09    | "tiempo destinado... apropiado"                                         | Fechas planificadas y reales permiten observar cumplimiento; la disponibilidad la decide la empresa                        |
| A5-14    | "tiempo transcurrido entre detección y corrección es mínimo"            | El sistema debe **calcular y mostrar** ese intervalo. Es un dato, no una percepción                                        |
| A5-17    | "seguimiento permite **verificar** que las acciones son efectivas"      | El ciclo CAPA debe tener un paso explícito de verificación de eficacia                                                     |
| A5-21    | "distribución de tareas permite cobertura completa de todas las etapas" | Reporte de cobertura: etapas con y sin inspección programada                                                               |
| A5-22    | "documentación... completa y actualizada"                               | Dependencia organizacional; SIGECAL conserva registros, no sustituye la gestión formal de procedimientos                   |
| A5-24    | "documentación de fácil acceso y consulta"                              | Búsqueda global de registros y exportación                                                                                 |
| A5-25–27 | coordinación y trabajo entre áreas                                      | Área del usuario, asignaciones, notificaciones y auditoría aportan evidencia indirecta; la conducta humana no se garantiza |

## 4. Consistencia con el marco teórico

El marco teórico compromete al sistema con ciertas ideas. El jurado puede preguntar por ellas:

| Sección | Teoría desarrollada                       | Cómo la honra el sistema                                                   |
| ------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| 2.2.1   | Sistemas de información                   | Arquitectura por capas, datos centralizados                                |
| 2.2.2   | **Control estadístico de procesos**       | M5 incluye gráficos de control con límites ±3σ sobre resultados históricos |
| 2.2.3   | Gestión de Calidad Total                  | El ciclo CAPA de M7 implementa el PDCA aplicado a no conformidades         |
| 2.2.4   | Trazabilidad agroalimentaria              | M3 con identificador único por lote y QR                                   |
| 2.2.5   | Metodologías ágiles                       | Desarrollo por sprints quincenales con entrega funcional                   |
| 2.2.6   | Arquitecturas orientadas a servicios      | Ver ADR-001 en `04-ARQUITECTURA.md` — se justifica el monolito modular     |
| 2.3.1   | PWA y SPA                                 | Frontend SPA + PWA instalable                                              |
| Anexo 2 | ISO/IEC 25010 (cita a Rojas et al., 2025) | Los RNF están mapeados a esta norma                                        |

> ⚠️ **2.2.6 es una trampa.** El marco teórico desarrolla microservicios en profundidad. Si el sistema es un monolito y no hay justificación escrita, el jurado puede preguntar "¿por qué no aplicó lo que teorizó?". La respuesta está en el ADR-001 y **debe** llegar a la sustentación.

## 5. Inconsistencias detectadas en el documento de tesis

No afectan al desarrollo, pero **sí a la sustentación**. Entregar esta lista a la tesista para que las corrija con su asesor.

| #   | Ubicación                        | Problema                                                                                                                          | Corrección sugerida                                                                                                   |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | 4.1.1 y 4.1.2                    | Declaran investigación "correlacional" / "descriptivo-correlacional", pero el Gráfico 2 y el Anexo 1 declaran **preexperimental** | Unificar en preexperimental. Reescribir ambas secciones                                                               |
| 2   | 4.2.2                            | "enfoque **probabilístico** por conveniencia"                                                                                     | Contradicción: por conveniencia es no probabilístico. Además, con 15 sujetos es **censo**, no muestra                 |
| 3   | 1.3 (Justificación metodológica) | "UML como **metodología** principal"                                                                                              | UML es un lenguaje de modelado. La metodología es Scrum (ya desarrollada en 2.2.5); UML es la herramienta de modelado |
| 4   | 3.2.2                            | Menciona "gestionar **maquinarias agrícolas**"                                                                                    | Texto ajeno al objeto de estudio. Reemplazar por parámetros fisicoquímicos, organolépticos y lotes                    |
| 5   | 1.4.2 vs Gráfico 3               | Delimitación temporal dice "set. 2025 – ago. 2026"; el cronograma dice "agosto – diciembre"                                       | Unificar con la ventana real de ejecución                                                                             |
| 6   | Introducción (p. viii)           | Promete inventarios, mantenimiento de equipos y gestión de personal                                                               | Ninguno tiene indicador. Retirar de la redacción o declararlos como trabajo futuro                                    |
| 7   | 5.3, Tabla 5                     | La tabla de presupuesto no está numerada; "Tinta S/1,00.00"                                                                       | Numerar la tabla y corregir el monto                                                                                  |
| 8   | Anexo 4                          | Pregunta por la experiencia de uso del sistema                                                                                    | Aclarar en 4.4 que este instrumento es exclusivamente post-test                                                       |
| 9   | Metadatos del PDF                | El campo Autor contiene “VALERY MASSIEL POMA FLORES”                                                                              | Corregir propiedades del archivo antes de entregar                                                                    |
| 10  | Portada                          | Indica 2025, pero la ejecución y sustentación se extienden a 2026                                                                 | Actualizar el año según la fecha oficial de presentación                                                              |
| 11  | Presentación del Anexo 5         | Habla de una “tarjeta” para evaluar mano de obra y recursos                                                                       | Reescribirla para el proceso de control de calidad del pisco                                                          |
| 12  | Anexo 4                          | Se presenta como herramienta para recopilar requisitos, aunque sus ítems evalúan un sistema ya usado                              | Reescribir la presentación como evaluación post-implementación                                                        |
| 13  | 4.5                              | No define prueba de hipótesis, nivel de significancia, emparejamiento pre/post ni confiabilidad                                   | Completar el plan estadístico con el asesor antes de recolectar datos                                                 |
| 14  | 4.3 vs población                 | Menciona trabajadores de producción, mientras la población se describe de forma genérica                                          | Definir exactamente quiénes participan y por qué                                                                      |
| 15  | Anexo 4, ítem 06                 | Pregunta si se recomendaría a “otros supervisores”, aunque la mayoría de participantes son empleados                              | Usar “otros usuarios involucrados en el control de calidad”                                                           |

## 6. Riesgos del proyecto

| Riesgo                                                 | Impacto                                            | Mitigación                                                                                                         |
| ------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| La empresa no entrega sus parámetros y rangos reales   | Alto — no se pueden guardar resultados definitivos | Solicitar antes del Sprint 2. Los valores provisionales sirven solo para demostración y deben quedar identificados |
| El asesor cambia el alcance a mitad de camino          | Alto                                               | Toda solicitud nueva pasa por cotización previa (cláusula 10 de la propuesta)                                      |
| El pre-test se aplica después de dar acceso al sistema | Alto — contamina la línea base                     | Aplicarlo antes del piloto y conservar evidencia de fecha                                                          |
| El personal no usa el sistema antes del post-test      | Alto — invalida la medición                        | Habilitar piloto al cierre del Sprint 6 y acordar con el asesor la duración mínima de uso                          |
| Demora en aprobación de entregas parciales             | Medio                                              | Plazo de 5 días hábiles pactado en la propuesta                                                                    |
| Add-on UML no se aprueba y el asesor lo exige          | Medio                                              | Ya cotizado (S/ 450). El modelo de datos de `05` sirve de insumo directo                                           |
| Datos de demostración se mezclan con datos reales      | Alto — distorsiona indicadores y evidencia         | Marcar el origen del dato y excluir demostraciones de reportes académicos                                          |
