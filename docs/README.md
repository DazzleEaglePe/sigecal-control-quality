# SIGECAL — Documentación de planificación

Sistema de Gestión de Control de Calidad · Viña Tacama S.A., Ica
Plan Completo (COT-2026-VT-001) · 8 módulos · Setiembre–diciembre 2026

**Versión documental:** 1.1 · 24/08/2026

## Índice

| #   | Documento                                                            | Contenido                                                            |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 00  | [Contexto del proyecto](00-CONTEXTO-PROYECTO.md)                     | Alcance, glosario del dominio, roles, restricciones                  |
| 01  | [Análisis de la tesis](01-ANALISIS-TESIS.md)                         | Trazabilidad indicador ↔ módulo, riesgos, inconsistencias detectadas |
| 02  | [Requerimientos funcionales](02-REQUERIMIENTOS-FUNCIONALES.md)       | RF por módulo, matriz de permisos                                    |
| 03  | [Requerimientos no funcionales](03-REQUERIMIENTOS-NO-FUNCIONALES.md) | Mapeados a ISO/IEC 25010                                             |
| 04  | [Arquitectura](04-ARQUITECTURA.md)                                   | Capas, estructura, patrones y decisiones ADR                         |
| 05  | [Modelo de datos](05-MODELO-DATOS.md)                                | Entidades, enumeraciones, índices, seed                              |
| 06  | [Contrato de API](06-API-CONTRACT.md)                                | Extremos REST, DTOs, códigos de error                                |
| 07  | [Seguridad y autenticación](07-SEGURIDAD-AUTH.md)                    | JWT, RBAC, protecciones, variables de entorno                        |
| 08  | [Pantallas y flujos](08-UX-FLUJOS.md)                                | Navegación, pantallas, WCAG 2.2                                      |
| 09  | [Plan de desarrollo](09-PLAN-DESARROLLO.md)                          | 8 sprints quincenales                                                |
| 10  | [Checklist Sprint 1](10-CHECKLIST-SPRINT-1.md)                       | Orden operativo, validaciones y criterio de cierre                   |
| 11  | [Checklist Sprint 2](11-CHECKLIST-SPRINT-2.md)                       | Seguridad, usuarios, maestros y validaciones                         |
| 12  | [Checklist Sprint 3](12-CHECKLIST-SPRINT-3.md)                       | Lotes, secuencia productiva y trazabilidad                           |
| 13  | [Checklist Sprint 4](13-CHECKLIST-SPRINT-4.md)                       | Inspecciones, análisis fisicoquímico e inmutabilidad                 |
| 14  | [Entrega funcional para Nicolle](14-CHECKLIST-ENTREGA-NICOLLE.md)    | Estado verificable, servicios y condiciones de demostración          |
| 15  | [Checklist Sprint 5](15-CHECKLIST-SPRINT-5.md)                       | Evaluación organoléptica, perfiles e inmutabilidad                   |
| 16  | [Checklist Sprint 2.1](16-CHECKLIST-SPRINT-2-1.md)                   | Cuentas internas, invitaciones y recuperación                        |
| —   | [OpenAPI](openapi.yaml)                                              | Contrato ejecutable generado desde los esquemas Zod                  |
| —   | [AGENTS.md](../AGENTS.md)                                            | Reglas para el agente de desarrollo                                  |

## Uso

Cargar `AGENTS.md` y la carpeta `docs/` completa como contexto persistente del agente de desarrollo.
Trabajar un sprint a la vez según `09-PLAN-DESARROLLO.md`.

## Estado

- ✅ Planificación revisada y decisiones críticas cerradas
- ⏳ Correcciones metodológicas de la tesis: tesista + asesor
- ✅ Desarrollo: Sprints 1 a 5 implementados y verificados
- ▶️ Siguiente foco técnico: Sprint 6, no conformidades y reportes
- ⏳ Datos reales de empresa: pendientes; los estándares provisionales solo sirven para `DEMO`
- ⏳ UML, manual de usuario y video demo: add-on **no aprobado**, no generar

## Decisiones vigentes para iniciar

- Stack: Node.js 24 LTS, Express 5, Prisma 7, PostgreSQL 16, React 19.2, Vite 8.1 y Tailwind CSS 4.3.
- Un resultado sin estándar vigente no se declara conforme.
- Los lotes admiten una o varias variedades mediante una relación explícita.
- El token de refresco se transporta exclusivamente en cookie `httpOnly`.
- El pre-test debe realizarse antes de dar acceso al sistema y el post-test después de un piloto real.
