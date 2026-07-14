---
name: design-plan
description: Se usa luego de que el usuario aprueba el spec (ver design-spec), para generar el plan de implementación técnica. Genera docs/plans/YYYY-MM-DD-title.md a partir del spec de referencia.
---

# Design Plan

Este skill convierte un spec ya aprobado por el usuario en un plan de implementación
concreto: la lista de tareas técnicas a ejecutar para cumplir ese spec.

## Cuándo usarlo

- El usuario ya aprobó un spec (normalmente generado con el skill `design-spec`, tras
  pasar por su approval gate).
- Se necesita bajar ese spec a tareas técnicas concretas antes de empezar a programar.

No lo uses sin un spec aprobado de referencia — si no existe o no fue aprobado todavía,
primero corré `design-spec` (y su approval gate) o consultá con el usuario cuál es el
spec de referencia.

## Pasos

1. **Ubicar el spec de referencia.** Confirmá qué archivo de `docs/specs/` es el que fue
   aprobado. Si hay dudas sobre cuál es, preguntá antes de continuar.

2. **No implementar todavía.** Este skill solo produce el plan, no código.

3. **Crear el archivo en `docs/plans/`** con el nombre `YYYY-MM-DD-titulo.md` (misma
   fecha/título que el spec si aplica, crear la carpeta si no existe), con exactamente
   estas secciones, en este orden:

   1. **Objetivo** — qué se busca lograr con esta implementación, en 2-4 líneas.
   2. **Contexto del problema** — resumen breve de por qué se hace esto (tomado/alineado
      con el spec, no repetido palabra por palabra).
   3. **Spec de referencia** — link/ruta al archivo del spec en `docs/specs/` usado como
      base.
   4. **Lista de tareas a implementar, con detalles** — desglose de las tareas técnicas
      concretas necesarias para cumplir el spec. Cada tarea debe incluir el detalle
      suficiente para ejecutarla sin ambigüedad: qué archivos/áreas toca, qué cambia, y
      cualquier dependencia u orden entre tareas. Puede incluir decisiones técnicas
      (arquitectura, stack, estructura de datos) que en el spec se dejaron fuera a
      propósito.

4. **Presentar un resumen breve** del plan generado y la ruta del archivo, listando las
   tareas principales para que el usuario pueda revisarlas antes de que arranque la
   implementación.

## Notas

- Redacta en el mismo idioma que usa el usuario.
- El plan es técnico (a diferencia del spec, que es de producto/usuario) — acá sí van
  detalles de implementación, archivos, funciones, estructura.
- Si el spec tiene ambigüedades que impiden planificar con precisión, señalalas y
  preguntá antes de rellenar con supuestos.
