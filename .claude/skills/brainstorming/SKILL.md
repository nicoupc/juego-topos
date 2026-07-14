---
name: brainstorming
description: Se usa siempre que se empieza un desarrollo nuevo (una feature, un rediseño, una idea desde cero). Aclara ambigüedades con preguntas antes de escribir código, y termina proponiendo 2-3 alternativas concretas de implementación para elegir antes de arrancar.
---

# Brainstorming

Este skill se activa antes de empezar cualquier desarrollo nuevo — no para bugs pequeños,
typos, o tareas donde el camino ya es obvio. Es para cuando el usuario pide algo con
espacio de interpretación: una feature nueva, un rediseño, una idea que apenas está
tomando forma.

El objetivo es NO escribir código todavía. Primero entender bien qué se quiere, y
después dar opciones concretas para elegir.

## Cuándo usarlo

- El usuario describe una idea o feature nueva sin especificar todos los detalles.
- Hay más de una forma razonable de resolver el pedido (distintos stacks, distintos
  alcances, distintos niveles de esfuerzo).
- El costo de adivinar mal es alto (reescribir después, o no era lo que el usuario quería).

No lo uses si el usuario ya fue explícito y específico sobre qué construir y cómo, o si
es un cambio trivial/mecánico.

## Pasos

1. **Preguntar antes de asumir.** Identifica los puntos ambiguos del pedido (alcance,
   público, plataforma, restricciones técnicas, estética, prioridades) y pregúntalos
   usando AskUserQuestion con opciones concretas cuando sea posible, en vez de preguntas
   abiertas genéricas. No hagas más preguntas de las necesarias — apunta a las que
   realmente cambian el camino a seguir.

2. **No implementar todavía.** Mientras dure el brainstorming, no escribas ni edites
   código. Es una fase de exploración y alineación, no de ejecución.

3. **Proponer 2-3 alternativas.** Con las respuestas del usuario, arma entre 2 y 3
   caminos distintos para arrancar el desarrollo. Cada alternativa debe incluir:
   - Un nombre corto para identificarla.
   - En qué consiste (enfoque, stack, alcance).
   - Su principal trade-off (qué gana y qué sacrifica frente a las otras).

4. **Esperar la elección del usuario.** Preséntalas de forma breve y clara, y espera a
   que el usuario elija una (o pida ajustes) antes de empezar a implementar.

## Notas

- Mantén las preguntas y las alternativas en el mismo idioma que usa el usuario.
- Sé conciso: el objetivo es alinear rápido, no producir un documento largo.
