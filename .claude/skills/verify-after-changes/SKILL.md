---
name: verify-after-changes
description: Se usa cuando se considera que ya terminó la implementación de un plan. Levanta el servidor, prueba 5 casos importantes directamente en el navegador, compara el resultado contra el plan/spec, y arregla lo que falle o da luz verde para terminar.
---

# Verify After Changes

Este skill es el cierre de un ciclo de desarrollo: se corre cuando el código de la
implementación ya está escrito y se cree que cumple el plan. Su trabajo es verificar eso
de forma real (en navegador), no solo revisar que el código compile o que los tests
pasen.

## Cuándo usarlo

- Se terminó de implementar un plan (o una feature) y hace falta confirmar que funciona
  como se pensó.
- Existe un plan y, si corresponde, un spec (`docs/specs/*.md`) contra los cuales
  comparar el comportamiento real.

No lo uses para verificar cambios triviales sin UI/comportamiento observable, ni como
sustituto de escribir tests automatizados si el proyecto los requiere.

## Pasos

1. **Levantar el servidor.** Iniciá el servidor de desarrollo del proyecto (dev server,
   preview, etc.) para poder interactuar con la app real, no solo leer código.

2. **Elegir 5 casos de prueba importantes.** Antes de tocar el navegador, definí
   explícitamente 5 casos de prueba que cubran lo más importante del cambio: el camino
   feliz principal, algún caso borde relevante, y cualquier comportamiento mencionado
   específicamente en el plan o el spec. Enumeralos antes de ejecutar nada.

3. **Probar cada caso en el navegador.** Ejecutá los 5 casos directamente interactuando
   con la app (clicks, inputs, flujos) usando las herramientas de navegador disponibles.
   Observá el resultado real (UI, consola, network) para cada uno — no asumas que un
   caso pasó sin haberlo visto.

4. **Recoger feedback.** Por cada caso, registrá si pasó, falló, o quedó parcial, con el
   detalle concreto de qué se observó.

5. **Comparar contra el plan y el spec.** Contrastá los resultados obtenidos con lo que
   el plan de implementación y el spec (si existe, en `docs/specs/`) decían que debía
   pasar. Identificá desvíos: funcionalidad faltante, comportamiento distinto al
   esperado, o casos del spec no cubiertos por la implementación.

6. **Decidir según el resultado:**
   - Si algo falla o no alcanza el objetivo del plan/spec: arreglalo, y volvé a probar el
     caso afectado (no hace falta repetir los 5 casos si el fix es acotado, pero sí
     revalidar el que falló).
   - Si todo pasa y coincide con el plan/spec: dar luz verde explícita — resumir qué se
     probó y confirmar que la implementación está lista, sin abrir trabajo nuevo no
     solicitado.

## Notas

- Preferí evidencia directa (capturas, texto de la página, estado del DOM) por sobre
  suposiciones — si una herramienta de navegador falla, reintentá o buscá una forma
  alternativa de confirmar el comportamiento antes de darlo por bueno.
- Sé conciso al reportar: qué se probó, qué pasó, qué se arregló (si algo), y el
  veredicto final.
