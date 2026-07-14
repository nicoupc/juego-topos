---
name: design-spec
description: Se usa después de tener claridad sobre el problema y lo que se quiere hacer (típicamente luego de brainstorming), para redactar un documento de especificación desde el punto de vista del usuario antes de implementar. Genera docs/specs/YYYY-MM-DD-title.md.
---

# Design Spec

Este skill convierte una idea ya aclarada (problema entendido, alternativa elegida) en un
documento de especificación escrito. Es el paso previo a implementar: deja por escrito
qué se va a construir y por qué, desde la perspectiva del usuario, para que sirva de
referencia durante el desarrollo.

## Cuándo usarlo

- Ya se resolvieron las ambigüedades del pedido (por ejemplo, después de correr el skill
  `brainstorming` y que el usuario eligió una alternativa).
- Se va a encarar un desarrollo con suficiente entidad como para justificar dejarlo
  documentado (una feature, un rediseño, un flujo nuevo).

No lo uses para cambios triviales o mecánicos donde documentar no aporta valor.

## Pasos

1. **No implementar todavía.** Este skill solo produce el documento de especificación,
   no código.

2. **Confirmar el título y la fecha.** Usa la fecha actual en formato `YYYY-MM-DD` y un
   título corto en kebab-case que describa la feature (ej: `2026-07-11-modo-torneo.md`).
   Si el alcance no quedó 100% claro todavía, pregunta lo puntual que falte antes de
   escribir el documento — no asumas silenciosamente.

3. **Crear el archivo en `docs/specs/`** con el nombre `YYYY-MM-DD-titulo.md` (crear la
   carpeta si no existe), con exactamente estas secciones, en este orden:

   1. **Overview** — qué es, en 2-4 líneas. Resume el problema y la solución propuesta.
   2. **Usuarios objetivo** — quién va a usar esto y en qué contexto.
   3. **Contexto del problema** — por qué se necesita, qué dolor o necesidad resuelve.
   4. **Alcance v1** — qué entra y qué explícitamente queda fuera de esta primera versión.
   5. **Comportamiento esperado** — cómo se comporta la feature desde el punto de vista
      del usuario (flujos, casos de uso, reglas de negocio relevantes). Sin detalles de
      implementación técnica (no arquitectura, no nombres de funciones/archivos) — es una
      especificación de producto, no un diseño técnico.
   6. **Posibles errores y mitigaciones** — qué puede salir mal (casos borde, errores de
      usuario, fallas esperables) y cómo se maneja cada uno desde la experiencia del
      usuario.

4. **Presentar un resumen breve** del documento generado y la ruta del archivo. No hace
   falta pegar el contenido completo en el chat si el archivo ya quedó escrito — con
   avisar la ruta y un resumen de 2-3 líneas alcanza.

5. **Approval gate.** No continuar a implementación ni a planificación por cuenta propia.
   Preguntá explícitamente al usuario (con AskUserQuestion) si:
   - **Aprueba el spec** → en ese caso, continuá invocando el skill `design-plan` para
     generar el plan de implementación a partir de este spec.
   - **Quiere iterar** → pedile los cambios puntuales, actualizá el mismo archivo del
     spec (no crear uno nuevo salvo que cambie el alcance de fondo), y volvé a este paso
     de approval gate hasta que apruebe.

   No des por aprobado un spec por silencio o por inferencia — necesitás una confirmación
   explícita del usuario antes de pasar a `design-plan`.

## Notas

- Redacta en el mismo idioma que usa el usuario.
- Mantené el documento enfocado en el punto de vista del usuario/producto, no en cómo se
  va a construir técnicamente — eso es responsabilidad de una etapa posterior.
- Si durante la redacción surge una ambigüedad real (no cosmética), preguntá antes de
  rellenar con supuestos.
- Nunca saltees el approval gate del paso 5, incluso si el spec parece simple.
