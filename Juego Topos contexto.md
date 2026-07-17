# Contexto del proyecto: Topos y Erizos

## Qué es

"Topos y Erizos" es un juego web de navegador tipo golpear
topos. El jugador debe golpear los topos que aparecen en un tablero de 9
huecos, evitando golpear a los erizos que aparecen entre ellos. Es un juego
casual de partidas cortas, orientado al puntaje y a la competencia por el
mejor score.

Es un sitio 100% estático (HTML, CSS y JavaScript vanilla, sin frameworks
ni build step), desplegado en Vercel. El audio (música y efectos de sonido)
no usa archivos: se sintetiza en tiempo real con la Web Audio API.

## Por qué existe

Se construyó como un proyecto personal para jugar con amigos: un juego
simple, rápido de entender, pero con suficiente profundidad (dificultad
progresiva, variedad de enemigos, combos, power-ups) para que dé ganas de
volver a jugar y superar el propio puntaje o el de otros en el ranking.

## Para quién es

Amigos del creador del juego, jugadores casuales que quieren partidas
cortas y competitivas. No requiere registro: cada jugador tiene un perfil
local (nombre + avatar) identificado por un ID generado en el navegador, y
puede aparecer en un ranking global compartido con otros jugadores.

## Cómo se juega

- El tablero tiene 9 huecos. De ellos van saliendo criaturas al azar que
  hay que golpear con clic/toque antes de que se escondan de nuevo.
- El jugador empieza con 5 vidas (corazones).
- El juego avanza por **10 fases** de dificultad creciente. Cada fase pide
  una cantidad de golpes válidos para superarla (empieza en 5 golpes en la
  Fase 1 y sube hasta 15 en la Fase 10). A medida que suben las fases,
  las criaturas aparecen más rápido, se quedan menos tiempo arriba, y
  puede haber más criaturas activas a la vez.
- Hay 3 niveles de dificultad seleccionables desde el menú: **fácil**,
  **normal** y **difícil**, que ajustan la velocidad de aparición, cuántas
  criaturas hay activas a la vez, y la probabilidad de que salgan erizos.
- **Combo y multiplicador de puntos:** golpear topos válidos seguidos, sin
  fallar ni golpear un erizo, sube un combo. Cada 5 golpes seguidos el
  multiplicador de puntaje sube (x2 a los 5 combos, x3 a los 10) — fallar
  un golpe o golpear un erizo reinicia el combo a cero.
- **Al final de cada fase ocurre una "horda":** aparece una advertencia y
  luego salen muchas criaturas de golpe, que hay que despejar para pasar
  a la siguiente fase.

### Criaturas

- **Topo normal:** el golpe básico, válido, suma puntos.
- **Erizo:** *no* se debe golpear — si se golpea, el jugador pierde una
  vida y se reinicia el combo.
- **Topo con casco / topo con balde:** necesitan varios golpes (2 y 3
  respectivamente) antes de caer, y muestran grietas/daño progresivo.
- **Topo disfrazado (con máscara de erizo):** parece un erizo pero es
  seguro golpearlo — pone a prueba si el jugador reconoce la diferencia.
- **Topo con tenedor:** alterna entre tenedor arriba (peligroso: golpearlo
  así hace perder una vida, como bloqueo) y abajo (seguro golpearlo);
  hay que esperar el momento correcto.
- **Topo zombie:** aguanta varios golpes rápidos seguidos (el de más
  puntos, 50 por golpe válido) antes de caer.

### Power-ups

- **Burbuja de corazón:** al tocarla, cura y da una vida extra.
- **Burbuja de martillo (mega martillo):** al tocarla, aplasta de golpe a
  todas las criaturas activas en el tablero (menos erizos), sumando
  puntos por cada una.

## Cómo se gana

El jugador gana ("¡Victoria total!") si logra superar las 10 fases
completas, incluyendo las hordas de fin de fase de cada una, sin quedarse
sin vidas antes de terminar la Fase 10.

## Cómo se pierde

El jugador pierde ("Juego terminado") si sus vidas llegan a cero antes de
completar la Fase 10. Se pierde una vida al:
- Golpear un erizo.
- Golpear un topo con tenedor mientras el tenedor está arriba (bloqueo).

En cualquiera de los dos casos (victoria o derrota) termina la partida, se
guarda el puntaje final como highscore local si corresponde, y se
sincroniza con el ranking global.

## Progreso, perfil y competencia

- **Highscores locales:** se guardan los 5 mejores puntajes del jugador en
  ese navegador (localStorage).
- **Ranking global:** los puntajes se sincronizan con un servicio externo
  (API JSON), mostrando una tabla de posiciones con nombre, avatar y
  puntaje de todos los jugadores que hayan puesto un nombre (no anónimo).
- **Perfil de jugador:** nombre editable y avatar a elegir entre los
  distintos personajes del juego (topo, erizo, topo con casco, topo
  disfrazado, topo con balde, topo con tenedor, topo zombie).

## Configuración y otros detalles

- Música y efectos de sonido activables/desactivables por separado, y
  selector de dificultad, todo persistente entre sesiones.
- Pantalla de instrucciones ilustrada (4 páginas) que explica mecánica
  básica, combos, criaturas especiales y power-ups.
- Soporte de pausa/reanudar/reiniciar partida, y versión adaptada para
  móvil (modales de perfil y ranking).