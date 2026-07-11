(() => {
  "use strict";

  const HOLE_COUNT = 9;
  const GAME_TIME = 30;
  const STORAGE_KEY = "topofrenzy-highscore";

  const DIFFICULTIES = {
    facil:   { minUp: 750, maxUp: 1150, bombChance: 0.12, goldChance: 0.08 },
    normal:  { minUp: 550, maxUp: 900,  bombChance: 0.18, goldChance: 0.09 },
    dificil: { minUp: 380, maxUp: 650,  bombChance: 0.24, goldChance: 0.10 },
  };

  const CRITTERS = {
    mole: { emoji: "🐹", points: 10 },
    gold: { emoji: "🌟", points: 30 },
    bomb: { emoji: "💣", points: -15 },
  };

  const board = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const highscoreEl = document.getElementById("highscore");
  const startOverlay = document.getElementById("startOverlay");
  const endOverlay = document.getElementById("endOverlay");
  const startBtn = document.getElementById("startBtn");
  const retryBtn = document.getElementById("retryBtn");
  const shareBtn = document.getElementById("shareBtn");
  const finalScoreEl = document.getElementById("finalScore");
  const newRecordEl = document.getElementById("newRecord");
  const endTitleEl = document.getElementById("endTitle");
  const toastEl = document.getElementById("toast");
  const diffChips = document.querySelectorAll(".chip[data-diff]");

  let score = 0;
  let timeLeft = GAME_TIME;
  let timerId = null;
  let spawnTimeoutId = null;
  let running = false;
  let difficulty = "facil";
  let holes = [];
  let activeHoleIndex = -1;

  function buildBoard() {
    board.innerHTML = "";
    holes = [];
    for (let i = 0; i < HOLE_COUNT; i++) {
      const hole = document.createElement("div");
      hole.className = "hole";
      hole.dataset.index = String(i);

      const critter = document.createElement("div");
      critter.className = "critter";
      hole.appendChild(critter);

      hole.addEventListener("pointerdown", onHolePointerDown);
      board.appendChild(hole);
      holes.push({ el: hole, critterEl: critter, up: false, kind: null, upToken: 0 });
    }
  }

  function getHighscore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  }

  function setHighscore(v) {
    localStorage.setItem(STORAGE_KEY, String(v));
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    timeEl.textContent = String(timeLeft);
    highscoreEl.textContent = String(getHighscore());
  }

  function pickKind() {
    const cfg = DIFFICULTIES[difficulty];
    const r = Math.random();
    if (r < cfg.bombChance) return "bomb";
    if (r < cfg.bombChance + cfg.goldChance) return "gold";
    return "mole";
  }

  function randomFreeHoleIndex() {
    const freeIndices = holes
      .map((h, i) => (h.up ? -1 : i))
      .filter((i) => i !== -1);
    if (freeIndices.length === 0) return -1;
    return freeIndices[Math.floor(Math.random() * freeIndices.length)];
  }

  function showScorePop(hole, text, positive) {
    const pop = document.createElement("div");
    pop.className = "score-pop";
    pop.textContent = text;
    pop.style.color = positive ? "#ffe066" : "#ff8787";
    hole.el.appendChild(pop);
    setTimeout(() => pop.remove(), 700);
  }

  function popDown(hole) {
    hole.up = false;
    hole.el.classList.remove("up");
    hole.critterEl.textContent = "";
  }

  function spawnLoop() {
    if (!running) return;
    const cfg = DIFFICULTIES[difficulty];
    const idx = randomFreeHoleIndex();

    if (idx === -1) {
      spawnTimeoutId = setTimeout(spawnLoop, 150);
      return;
    }

    const hole = holes[idx];
    const kind = pickKind();
    hole.up = true;
    hole.kind = kind;
    hole.upToken += 1;
    const myToken = hole.upToken;
    hole.critterEl.textContent = CRITTERS[kind].emoji;
    hole.el.classList.add("up");
    hole.el.classList.remove("hit");

    const visibleTime = cfg.minUp + Math.random() * (cfg.maxUp - cfg.minUp);
    const upDuration = kind === "bomb" ? visibleTime * 0.8 : visibleTime;

    setTimeout(() => {
      if (hole.up && hole.upToken === myToken) {
        popDown(hole);
      }
    }, upDuration);

    const nextSpawnDelay = cfg.minUp * 0.55 + Math.random() * (cfg.maxUp * 0.55);
    spawnTimeoutId = setTimeout(spawnLoop, nextSpawnDelay);
  }

  function onHolePointerDown(e) {
    if (!running) return;
    const index = Number(e.currentTarget.dataset.index);
    const hole = holes[index];
    if (!hole.up) return;

    const kind = hole.kind;
    const points = CRITTERS[kind].points;
    hole.upToken += 1;

    hole.el.classList.add("hit");
    setTimeout(() => hole.el.classList.remove("hit"), 250);

    score = Math.max(0, score + points);
    showScorePop(hole, points > 0 ? `+${points}` : `${points}`, points > 0);
    popDown(hole);
    updateHud();

    if (navigator.vibrate) {
      navigator.vibrate(kind === "bomb" ? 60 : 20);
    }
  }

  function startGame() {
    score = 0;
    timeLeft = GAME_TIME;
    running = true;
    startOverlay.hidden = true;
    endOverlay.hidden = true;
    buildBoard();
    updateHud();

    timerId = setInterval(() => {
      timeLeft -= 1;
      updateHud();
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);

    spawnLoop();
  }

  function endGame() {
    running = false;
    clearInterval(timerId);
    clearTimeout(spawnTimeoutId);
    holes.forEach(popDown);

    const best = getHighscore();
    const isRecord = score > best;
    if (isRecord) setHighscore(score);

    finalScoreEl.textContent = String(score);
    newRecordEl.hidden = !isRecord;
    endTitleEl.textContent = isRecord ? "¡Nuevo récord! 🏆" : "¡Se acabó el tiempo!";
    endOverlay.hidden = false;
    updateHud();
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toastEl.hidden = true; }, 2200);
  }

  async function shareScore() {
    const text = `¡Saqué ${score} puntos en Topo Frenzy! 🐹 ¿Puedes superarme?`;
    const shareData = { title: "Topo Frenzy", text, url: location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_) { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${location.href}`);
        showToast("¡Copiado! Pégalo donde quieras compartirlo.");
      } catch (_) {
        showToast(text);
      }
    }
  }

  diffChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      diffChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      difficulty = chip.dataset.diff;
    });
  });

  startBtn.addEventListener("click", startGame);
  retryBtn.addEventListener("click", startGame);
  shareBtn.addEventListener("click", shareScore);

  buildBoard();
  updateHud();
})();
