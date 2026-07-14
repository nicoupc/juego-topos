# Sistema de logros/medallas

## 1. Overview

Topos y Erizos suma un sistema de logros: tres medallas desbloqueables durante el juego que
premian distintos estilos de juego (mantener combos altos, jugar sin recibir daño). Al
cumplirse la condición, se muestra una notificación animada en el momento, y las medallas
ganadas quedan visibles en una galería dentro de la pantalla de fin de partida, con
progreso guardado permanentemente entre partidas.

## 2. Usuarios objetivo

Jugadores de Topos y Erizos (amigos del creador del juego) que ya conocen la mecánica básica
y buscan un motivo extra para volver a jugar y mejorar su desempeño, más allá de superar
el puntaje máximo.

## 3. Contexto del problema

Hoy el único objetivo del juego es el puntaje máximo (highscore). Eso da una sola forma
de "ganar" y no reconoce otros logros de habilidad (como mantener combos altos o jugar
con precisión sin perder vidas). Un sistema de medallas da metas intermedias y variadas,
aumenta la sensación de progreso, y da un motivo para volver a jugar incluso después de
alcanzar el highscore.

## 4. Alcance v1

**Incluye:**
- Tres medallas:
  1. **Combo x3** — alcanzar un multiplicador de combo de x3 en una partida.
  2. **Combo x5** — alcanzar un multiplicador de combo de x5 en una partida.
  3. **Sin Rasguños** — terminar una partida (llegar a game over o completarla) sin haber
     perdido ninguna vida.
- Notificación visual animada en el momento en que se desbloquea una medalla durante la
  partida.
- Galería de medallas visible en el overlay de fin de partida: las tres medallas se
  muestran siempre (bloqueadas en gris si no se ganaron nunca, a color si ya se
  desbloquearon alguna vez).
- El progreso de medallas es histórico y permanente: una vez desbloqueada, una medalla
  queda marcada como ganada para siempre, sin importar el resultado de partidas futuras.

**Queda fuera de v1:**
- Medallas adicionales más allá de las tres definidas.
- Pantalla dedicada exclusivamente a ver la colección de medallas (fuera del overlay de
  fin de partida).
- Compartir medallas individualmente (el compartir de puntaje existente no cambia).
- Cualquier recompensa de juego asociada a una medalla (puntos extra, desbloqueo de
  contenido, etc.) — las medallas son solo reconocimiento visual.

## 5. Comportamiento esperado

- Durante una partida, en el momento exacto en que se cumple la condición de una medalla
  (el combo llega a x3, el combo llega a x5), aparece una notificación animada en
  pantalla indicando qué medalla se acaba de desbloquear. Esto ocurre una sola vez por
  medalla por partida (no se repite si el jugador baja y vuelve a subir el combo dentro
  de la misma partida).
- La medalla "Sin Rasguños" se evalúa al finalizar la partida: si el jugador terminó sin
  haber perdido ninguna vida, se muestra la notificación de desbloqueo en el overlay de
  fin de partida (no durante el juego, ya que la condición solo se confirma al terminar).
- Si una medalla ya fue desbloqueada en una partida anterior, no se vuelve a mostrar la
  notificación de "nuevo logro" al repetirla en partidas futuras — la medalla simplemente
  permanece marcada como ganada.
- Al llegar al overlay de fin de partida, el jugador ve las tres medallas: las que ganó
  alguna vez (en esta partida o en cualquier partida anterior) se muestran a color; las
  que nunca ganó se muestran en gris/bloqueadas.
- Las medallas ganadas persisten aunque el jugador cierre el navegador o vuelva otro día,
  de la misma forma que hoy persiste el highscore.
- Es posible desbloquear más de una medalla nueva en una misma partida (por ejemplo,
  llegar a combo x3 y también terminar sin perder vidas).

## 6. Posibles errores y mitigaciones

- **El jugador borra los datos del navegador (localStorage)**: pierde el progreso de
  medallas, igual que perdería el highscore actual. Se acepta como comportamiento
  consistente con el resto del juego — no requiere mitigación especial en v1.
- **El jugador alcanza combo x5 sin haber "pasado" visualmente por combo x3 en la misma
  partida** (por ejemplo, un salto de multiplicador): ambas medallas (x3 y x5) deben
  desbloquearse igual, ya que x5 implica haber superado el umbral de x3.
- **El jugador pierde la partida justo al momento de alcanzar un combo alto** (por
  ejemplo, el combo llega a x3 con el mismo golpe que agota su última vida): la medalla
  de combo debe desbloquearse igual, ya que la condición de combo se cumple
  independientemente del resultado final de la partida.
- **El jugador ya tiene todas las medallas ganadas**: no se muestran notificaciones de
  "nuevo logro" en partidas futuras, pero la galería del overlay de fin de partida sigue
  mostrando las tres medallas a color con normalidad.
- **Se pierde conexión o se recarga la página en medio de una partida**: al no haber
  guardado de partida en curso, se pierde el progreso de esa partida particular (igual
  que hoy pasa con el puntaje en curso); las medallas ya desbloqueadas en partidas
  previas no se ven afectadas porque están guardadas de forma persistente, no ligadas a
  la partida activa.
