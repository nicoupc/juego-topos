# Sistema de logros/medallas — Plan de implementación

## 1. Objetivo

Implementar 3 medallas desbloqueables (Combo x3, Combo x5, Sin Rasguños) con
notificación animada al desbloquear, galería en el overlay de fin de partida, y
persistencia permanente en `localStorage`, sin alterar la mecánica de juego existente.

## 2. Contexto del problema

El juego solo tiene el highscore como objetivo. Se agrega un sistema de logros para dar
metas intermedias ligadas a habilidad (combo) y estilo de juego (sobrevivir sin perder
vidas), aumentando el motivo para rejugar.

## 3. Spec de referencia

[docs/specs/2026-07-11-sistema-de-logros.md](../specs/2026-07-11-sistema-de-logros.md)

## 4. Lista de tareas a implementar, con detalles

### Tarea 1 — Definir estructura de datos y persistencia (`script.js`)

- Agregar constante `ACHIEVEMENTS_KEY = "toposyerizos-achievements"` junto a las demás
  claves de storage (cerca de `STORAGE_KEY`).
- Definir un catálogo de logros como array constante, ej:
  ```js
  const ACHIEVEMENTS = [
    { id: "combo3", label: "Combo x3", icon: "🔥" },
    { id: "combo5", label: "Combo x5", icon: "⚡" },
    { id: "flawless", label: "Sin Rasguños", icon: "🛡️" },
  ];
  ```
- Funciones helper:
  - `getUnlockedAchievements()` → lee de `localStorage`, devuelve `Set` de ids (o array
    vacío si no existe nada aún).
  - `unlockAchievement(id)` → si el id no está en el set guardado, lo agrega, persiste en
    `localStorage`, y devuelve `true` (para saber si hay que disparar la notificación);
    si ya estaba, devuelve `false` y no hace nada más.

### Tarea 2 — Estado de partida en curso (`script.js`)

- Agregar variable de estado por partida `let livesLostThisRun = 0;` junto a `lives`,
  `combo`, `multiplier`.
- Incrementar `livesLostThisRun` en los puntos donde se decrementa `lives` (hit de
  erizo, bloqueo de fork_mole).
- Resetear `livesLostThisRun = 0` en el punto donde se resetea `lives = MAX_LIVES` al
  arrancar partida (`startGame`).

### Tarea 3 — Disparo de desbloqueo por combo (`script.js`)

- En el bloque donde se actualiza `multiplier` tras un hit (donde ya existe
  `if (multiplier > prevMult) { ... showToast(...) }`), agregar:
  - Si `multiplier >= 3`, intentar `unlockAchievement("combo3")`.
  - Si `multiplier >= 5`, intentar `unlockAchievement("combo5")`.
  - Si `unlockAchievement` devuelve `true`, disparar la notificación de logro (Tarea 5).

### Tarea 4 — Disparo de desbloqueo "Sin Rasguños" (`script.js`)

- En `endGame(victory)`, antes de la bifurcación victoria/derrota, chequear
  `if (livesLostThisRun === 0)` y llamar `unlockAchievement("flawless")`.
- No hace falta un toast in-game porque la condición se confirma recién al terminar,
  según el spec — se refleja directamente en la galería del overlay.

### Tarea 5 — Notificación animada de desbloqueo (`index.html`, `style.css`, `script.js`)

- Agregar en `index.html` un contenedor `<div id="achievementToast" class="achievement-toast" hidden>`
  con icono + nombre de la medalla, similar al patrón de `#toast` ya existente.
- En `style.css`, estilos y animación de entrada/salida consistentes con el resto del
  juego (wood/gold palette).
- En `script.js`, función `showAchievementUnlock(id)` que llena el contenido y lo
  muestra/oculta con el mismo patrón de timeout que `showToast`.

### Tarea 6 — Galería de medallas en overlay de fin de partida (`index.html`, `style.css`, `script.js`)

- En `index.html`, dentro del bloque de `endOverlay`, agregar
  `<div id="achievementGallery" class="achievement-gallery"></div>`.
- En `style.css`, estilos para la galería: fila de 3 iconos, clase `.locked` (gris) vs
  `.unlocked` (color pleno).
- En `script.js`, función `renderAchievementGallery()` que lee `getUnlockedAchievements()`
  y genera el HTML de los 3 iconos con la clase correspondiente. Se llama dentro de
  `endGame()`.

### Tarea 7 — Verificación manual

- Cubierta por el skill `verify-after-changes`: levantar el juego, probar los 5 casos
  clave (desbloqueo de cada medalla, notificación, galería, persistencia) directamente
  en el navegador.

## Orden de ejecución sugerido

1 → 2 → 3 y 4 (pueden ir en paralelo, ambas dependen de 1 y 2) → 5 → 6 → verificación.
