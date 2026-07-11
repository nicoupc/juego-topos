(() => {
  "use strict";

  const HOLE_COUNT = 9;
  const MAX_LIVES = 3;
  const STORAGE_KEY = "topofrenzy-highscore";
  const MUTE_KEY = "topofrenzy-muted";
  const RAMP_SCORE = 900;
  const FRENZY_MS = 6000;

  const DIFFICULTIES = {
    facil:   { baseMin: 800, baseMax: 1200, floorMin: 480, floorMax: 720, bombChance: 0.09, goldChance: 0.09, mushroomChance: 0.03 },
    normal:  { baseMin: 650, baseMax: 1000, floorMin: 400, floorMax: 620, bombChance: 0.14, goldChance: 0.10, mushroomChance: 0.035 },
    dificil: { baseMin: 480, baseMax: 780,  floorMin: 300, floorMax: 480, bombChance: 0.19, goldChance: 0.11, mushroomChance: 0.04 },
  };

  const POINTS = { mole: 10, gold: 30, mushroom: 15 };

  const board = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const highscoreEl = document.getElementById("highscore");
  const comboBadge = document.getElementById("comboBadge");
  const frenzyBadge = document.getElementById("frenzyBadge");
  const startOverlay = document.getElementById("startOverlay");
  const endOverlay = document.getElementById("endOverlay");
  const startBtn = document.getElementById("startBtn");
  const retryBtn = document.getElementById("retryBtn");
  const shareBtn = document.getElementById("shareBtn");
  const muteBtn = document.getElementById("muteBtn");
  const finalScoreEl = document.getElementById("finalScore");
  const newRecordEl = document.getElementById("newRecord");
  const endTitleEl = document.getElementById("endTitle");
  const toastEl = document.getElementById("toast");
  const diffChips = document.querySelectorAll(".chip[data-diff]");

  let score = 0;
  let lives = MAX_LIVES;
  let combo = 0;
  let multiplier = 1;
  let frenzyUntil = 0;
  let running = false;
  let difficulty = "facil";
  let holes = [];
  let spawnTimeoutId = null;

  /* ================= AUDIO ================= */

  let actx = null;
  let masterGain = null;
  let muted = localStorage.getItem(MUTE_KEY) === "1";
  let musicTimer = null;
  let musicIndex = 0;
  const MELODY = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
  const NOTE_DUR = 0.26;

  function ensureAudio() {
    if (actx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    actx = new Ctx();
    masterGain = actx.createGain();
    masterGain.gain.value = muted ? 0 : 0.8;
    masterGain.connect(actx.destination);
  }

  function tone(freq, startOffset, dur, type, peak) {
    if (!actx) return;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(masterGain);
    const t0 = actx.currentTime + startOffset;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function noiseBurst(startOffset, dur, peak, freq) {
    if (!actx) return;
    const bufferSize = Math.floor(actx.sampleRate * dur);
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = actx.createBufferSource();
    src.buffer = buffer;
    const filter = actx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq;
    const gain = actx.createGain();
    const t0 = actx.currentTime + startOffset;
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  function sfxPop() {
    tone(440 + Math.random() * 120, 0, 0.12, "triangle", 0.22);
  }
  function sfxGold() {
    tone(660, 0, 0.1, "square", 0.18);
    tone(880, 0.08, 0.1, "square", 0.18);
    tone(1108, 0.16, 0.16, "square", 0.2);
  }
  function sfxBomb() {
    noiseBurst(0, 0.35, 0.5, 700);
    tone(90, 0, 0.3, "sawtooth", 0.25);
  }
  function sfxMushroom() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.06, 0.14, "sine", 0.18));
  }
  function sfxCombo() {
    tone(784, 0, 0.08, "square", 0.15);
    tone(988, 0.06, 0.12, "square", 0.17);
  }
  function sfxGameOver() {
    [392, 349, 294, 220].forEach((f, i) => tone(f, i * 0.15, 0.22, "triangle", 0.2));
  }

  function scheduleMusic() {
    if (!running) { musicTimer = null; return; }
    const freq = MELODY[musicIndex % MELODY.length];
    tone(freq, 0, NOTE_DUR * 0.85, "triangle", 0.05);
    if (musicIndex % 4 === 0) tone(130.81, 0, NOTE_DUR * 1.9, "sine", 0.045);
    else if (musicIndex % 4 === 2) tone(196.0, 0, NOTE_DUR * 1.9, "sine", 0.04);
    musicIndex++;
    musicTimer = setTimeout(scheduleMusic, NOTE_DUR * 1000);
  }

  function startMusic() {
    if (musicTimer) return;
    musicIndex = 0;
    scheduleMusic();
  }

  function stopMusic() {
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
  }

  function applyMuteState() {
    muteBtn.textContent = muted ? "🔇" : "🔊";
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.8;
  }

  muteBtn.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    applyMuteState();
  });
  applyMuteState();

  /* ================= BOARD BUILD ================= */

  function critterMarkup(kind) {
    if (kind === "mushroom") {
      return `<div class="cap"></div><div class="stem"></div>`;
    }
    let extra = "";
    if (kind === "gold") {
      extra = `<div class="sparkle-wrap"><span>✨</span><span>⭐</span><span>✨</span></div>`;
    } else if (kind === "bomb") {
      extra = `<div class="brow l"></div><div class="brow r"></div>
        <div class="spike s1"></div><div class="spike s2"></div><div class="spike s3"></div>`;
    }
    return `<div class="critter-ear l"></div><div class="critter-ear r"></div><div class="critter-face"></div>${extra}`;
  }

  function buildBoard() {
    board.innerHTML = "";
    holes = [];
    for (let i = 0; i < HOLE_COUNT; i++) {
      const hole = document.createElement("div");
      hole.className = "hole";
      hole.dataset.index = String(i);

      const mound = document.createElement("div");
      mound.className = "mound";

      const mask = document.createElement("div");
      mask.className = "hole-mask";

      const critter = document.createElement("div");
      critter.className = "critter";

      mask.appendChild(critter);
      hole.appendChild(mound);
      hole.appendChild(mask);

      hole.addEventListener("pointerdown", onHolePointerDown);
      board.appendChild(hole);
      holes.push({ el: hole, maskEl: mask, critterEl: critter, up: false, kind: null, upToken: 0 });
    }
  }

  function getHighscore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  }
  function setHighscore(v) {
    localStorage.setItem(STORAGE_KEY, String(v));
  }

  function renderLives() {
    let html = "";
    for (let i = 0; i < MAX_LIVES; i++) {
      html += `<span class="heart">${i < lives ? "❤️" : "🤍"}</span>`;
    }
    livesEl.innerHTML = html;
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    highscoreEl.textContent = String(getHighscore());
    renderLives();
    if (multiplier > 1) {
      comboBadge.hidden = false;
      comboBadge.textContent = `x${multiplier}`;
    } else {
      comboBadge.hidden = true;
    }
    const frenzyActive = Date.now() < frenzyUntil;
    frenzyBadge.hidden = !frenzyActive;
  }

  /* ================= SPAWN LOOP ================= */

  function pickKind() {
    const cfg = DIFFICULTIES[difficulty];
    const r = Math.random();
    if (r < cfg.bombChance) return "bomb";
    if (r < cfg.bombChance + cfg.goldChance) return "gold";
    if (r < cfg.bombChance + cfg.goldChance + cfg.mushroomChance) return "mushroom";
    return "mole";
  }

  function randomFreeHoleIndex() {
    const freeIndices = holes.map((h, i) => (h.up ? -1 : i)).filter((i) => i !== -1);
    if (freeIndices.length === 0) return -1;
    return freeIndices[Math.floor(Math.random() * freeIndices.length)];
  }

  function currentSpeedRange() {
    const cfg = DIFFICULTIES[difficulty];
    const factor = Math.max(0, 1 - score / RAMP_SCORE);
    const minUp = cfg.floorMin + (cfg.baseMin - cfg.floorMin) * factor;
    const maxUp = cfg.floorMax + (cfg.baseMax - cfg.floorMax) * factor;
    return { minUp, maxUp };
  }

  function popDown(hole) {
    hole.up = false;
    hole.el.classList.remove("up");
    hole.critterEl.className = "critter";
    hole.critterEl.innerHTML = "";
  }

  function spawnLoop() {
    if (!running) return;
    const { minUp, maxUp } = currentSpeedRange();
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

    hole.critterEl.className = `critter ${kind}`;
    hole.critterEl.innerHTML = critterMarkup(kind);
    hole.el.classList.add("up");
    hole.el.classList.remove("hit");

    const visibleTime = minUp + Math.random() * (maxUp - minUp);
    const upDuration = kind === "bomb" ? visibleTime * 0.75 : visibleTime;

    setTimeout(() => {
      if (hole.up && hole.upToken === myToken) {
        popDown(hole);
      }
    }, upDuration);

    const nextSpawnDelay = minUp * 0.5 + Math.random() * (maxUp * 0.5);
    spawnTimeoutId = setTimeout(spawnLoop, nextSpawnDelay);
  }

  /* ================= FX ================= */

  function showBurst(hole, emojis) {
    const burst = document.createElement("div");
    burst.className = "burst";
    emojis.forEach((emoji) => {
      const span = document.createElement("span");
      span.textContent = emoji;
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 30;
      span.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      span.style.setProperty("--dy", `${Math.sin(angle) * dist - 10}px`);
      span.style.setProperty("--rot", `${(Math.random() * 2 - 1) * 90}deg`);
      burst.appendChild(span);
    });
    hole.el.appendChild(burst);
    setTimeout(() => burst.remove(), 600);
  }

  function showScorePop(hole, text, color) {
    const pop = document.createElement("div");
    pop.className = "score-pop";
    pop.textContent = text;
    if (color) pop.style.color = color;
    hole.el.appendChild(pop);
    setTimeout(() => pop.remove(), 750);
  }

  function showComboFloat(text) {
    const el = document.createElement("div");
    el.className = "combo-float";
    el.textContent = text;
    board.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function shakeBoard() {
    board.classList.remove("shake");
    void board.offsetWidth;
    board.classList.add("shake");
  }

  /* ================= INTERACTION ================= */

  function onHolePointerDown(e) {
    if (!running) return;
    const index = Number(e.currentTarget.dataset.index);
    const hole = holes[index];
    if (!hole.up) return;

    const kind = hole.kind;
    hole.upToken += 1;
    hole.el.classList.add("hit");
    setTimeout(() => hole.el.classList.remove("hit"), 280);

    if (kind === "bomb") {
      combo = 0;
      multiplier = 1;
      lives = Math.max(0, lives - 1);
      shakeBoard();
      showBurst(hole, ["💥", "💢", "💨"]);
      showScorePop(hole, "¡BUM!", "#ff6b6b");
      sfxBomb();
      if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
      popDown(hole);
      updateHud();
      if (lives <= 0) endGame();
      return;
    }

    const frenzyActive = Date.now() < frenzyUntil;
    const frenzyMult = frenzyActive ? 2 : 1;
    const base = POINTS[kind] || POINTS.mole;
    const points = base * multiplier * frenzyMult;
    score += points;

    combo += 1;
    const prevMultiplier = multiplier;
    multiplier = Math.min(5, 1 + Math.floor(combo / 5));

    if (kind === "gold") {
      showBurst(hole, ["⭐", "✨", "💛"]);
      sfxGold();
    } else if (kind === "mushroom") {
      frenzyUntil = Date.now() + FRENZY_MS;
      showBurst(hole, ["🍄", "✨", "💥"]);
      sfxMushroom();
      showComboFloat("🍄 ¡FRENZY x2!");
    } else {
      showBurst(hole, ["💫"]);
      sfxPop();
    }

    showScorePop(hole, `+${points}`, frenzyActive ? "#ffd23c" : "#ffffff");

    if (multiplier > prevMultiplier && kind !== "mushroom") {
      showComboFloat(`¡Combo x${multiplier}!`);
      sfxCombo();
    }

    if (navigator.vibrate) navigator.vibrate(15);

    popDown(hole);
    updateHud();
  }

  /* ================= GAME FLOW ================= */

  function startGame() {
    ensureAudio();
    if (actx && actx.state === "suspended") actx.resume();

    score = 0;
    lives = MAX_LIVES;
    combo = 0;
    multiplier = 1;
    frenzyUntil = 0;
    running = true;

    startOverlay.hidden = true;
    endOverlay.hidden = true;
    buildBoard();
    updateHud();
    startMusic();
    spawnLoop();

    clearInterval(startGame._hudTimer);
    startGame._hudTimer = setInterval(updateHud, 300);
  }

  function endGame() {
    running = false;
    clearTimeout(spawnTimeoutId);
    clearInterval(startGame._hudTimer);
    stopMusic();
    holes.forEach(popDown);

    const best = getHighscore();
    const isRecord = score > best;
    if (isRecord) setHighscore(score);

    sfxGameOver();

    finalScoreEl.textContent = String(score);
    newRecordEl.hidden = !isRecord;
    endTitleEl.textContent = isRecord ? "¡Nuevo récord! 🏆" : "¡Juego terminado!";
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
