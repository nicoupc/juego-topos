(() => {
  "use strict";

  // Game Constants
  const HOLE_COUNT = 9;
  const MAX_LIVES = 5;
  const STORAGE_KEY = "toposyerizos-highscores-v2";
  const MUSIC_MUTE_KEY = "toposyerizos-music-muted";
  const SFX_MUTE_KEY = "toposyerizos-sfx-muted";
  const MAX_HIGHSCORES = 5;

  // Dificulty Configurations (Balanced & Playable)
  const DIFFICULTIES = {
    facil: {
      maxActive: 2,       // Maximum active moles at one time (prevents chaos)
      baseMinUp: 1800,    // Min duration mole stays up (ms) - generous reaction time
      baseMaxUp: 2500,    // Max duration mole stays up (ms)
      spawnDelayMin: 1200,// Min delay between spawns (ms)
      spawnDelayMax: 2000,// Max delay between spawns (ms)
      erizoChance: 0.16,   // Increased from 0.12 to spawn more Erizos!
    },
    normal: {
      maxActive: 3,
      baseMinUp: 1300,
      baseMaxUp: 1900,
      spawnDelayMin: 800,
      spawnDelayMax: 1500,
      erizoChance: 0.22,   // Increased from 0.16
    },
    dificil: {
      maxActive: 4,
      baseMinUp: 900,
      baseMaxUp: 1400,
      spawnDelayMin: 500,
      spawnDelayMax: 1000,
      erizoChance: 0.28,   // Increased from 0.20
    }
  };

  // Phase configurations (10 Phases progression)
  const PHASE_GOALS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 15]; // hits needed per phase

  // DOM Elements
  const menuScreen = document.getElementById("menuScreen");
  const gameContainer = document.getElementById("gameContainer");
  
  const btnSettings = document.getElementById("btnSettings");
  const btnPlay = document.getElementById("btnPlay");
  const btnHelp = document.getElementById("btnHelp");
  // Leaderboard toggle elements removed
  
  const livesEl = document.getElementById("lives");
  const phaseIndicator = document.getElementById("phaseIndicator");
  const phaseProgress = document.getElementById("phaseProgress");
  const scoreEl = document.getElementById("score");
  const highscoreEl = document.getElementById("highscore");
  const comboBadge = document.getElementById("comboBadge");
  const btnPause = document.getElementById("btnPause");
  const board = document.getElementById("board");
  const hordeWarning = document.getElementById("hordeWarning");
  const frenzyBadge = document.getElementById("frenzyBadge");
  const hammerCursor = document.getElementById("hammerCursor");

  // Overlays
  const instructionsOverlay = document.getElementById("instructionsOverlay");
  const helpClose = document.getElementById("helpClose");
  const helpPrev = document.getElementById("helpPrev");
  const helpNext = document.getElementById("helpNext");
  const helpPageNum = document.getElementById("helpPageNum");
  const helpPlayBtn = document.getElementById("helpPlayBtn");

  const settingsOverlay = document.getElementById("settingsOverlay");
  const settingsClose = document.getElementById("settingsClose");
  const toggleMusic = document.getElementById("toggleMusic");
  const toggleSFX = document.getElementById("toggleSFX");
  const diffChips = document.querySelectorAll(".chip[data-diff]");

  // Global Leaderboard & Profile elements
  const rankScrollUp = document.getElementById("rankScrollUp");
  const rankScrollDown = document.getElementById("rankScrollDown");
  const profileCard = document.getElementById("profileCard");
  const profileViewMode = document.getElementById("profileViewMode");
  const profileEditMode = document.getElementById("profileEditMode");
  const profileViewName = document.getElementById("profileViewName");
  const profileViewRecord = document.getElementById("profileViewRecord");
  const profileViewAvatar = document.getElementById("profileViewAvatar");
  const btnEditProfile = document.getElementById("btnEditProfile");
  const btnSaveProfile = document.getElementById("btnSaveProfile");
  const inputProfileName = document.getElementById("inputProfileName");
  const avatarPrev = document.getElementById("avatarPrev");
  const avatarNext = document.getElementById("avatarNext");
  const avatarCurrentOption = document.getElementById("avatarCurrentOption");
  const leaderboardList = document.getElementById("leaderboardList");

  const pauseOverlay = document.getElementById("pauseOverlay");
  const btnResume = document.getElementById("btnResume");
  const btnRestart = document.getElementById("btnRestart");
  const btnQuit = document.getElementById("btnQuit");

  const endOverlay = document.getElementById("endOverlay");
  const retryBtn = document.getElementById("retryBtn");
  const endQuitBtn = document.getElementById("endQuitBtn");
  const endTitle = document.getElementById("endTitle");
  const finalScoreEl = document.getElementById("finalScore");
  const newRecordEl = document.getElementById("newRecord");

  const toastEl = document.getElementById("toast");

  // Mobile modal overlay elements
  const mobileProfileBtn = document.getElementById("mobileProfileBtn");
  const mobileRankBtn = document.getElementById("mobileRankBtn");
  const mobileAvatarIcon = document.getElementById("mobileAvatarIcon");
  const btnCloseProfileModal = document.getElementById("btnCloseProfileModal");
  const btnCloseRankModal = document.getElementById("btnCloseRankModal");
  const modalBackdrop = document.getElementById("modalBackdrop");

  // Game State
  let running = false;
  let paused = false;
  let score = 0;
  let lives = MAX_LIVES;
  let combo = 0;
  let multiplier = 1;
  let difficulty = "normal";
  let phase = 1; // 1 to 10
  let phaseHits = 0; // hits in current phase
  let isHorde = false;
  let hordeWarningTimeoutId = null;
  let hordeSpawningIntervalId = null;
  let hordeClearIntervalId = null;
  let hordeSpawnedCount = 0;
  let hordeTotalToSpawn = 0;
  
  let holes = []; // hole objects
  let activeCritterCount = 0;
  let spawnTimeoutId = null;
  let forkIntervalId = null;
  let menuCritterIntervalId = null;
  let menuCritterHideTimeoutId = null;
  let menuCritterKind = null;
  let menuCritterIsHit = false;
  let mutedMusic = localStorage.getItem(MUSIC_MUTE_KEY) === "1";
  let mutedSFX = localStorage.getItem(SFX_MUTE_KEY) === "1";
  
  // Profile & Leaderboard Settings
  const LEADERBOARD_BIN_URL = "https://api.npoint.io/670d03f5f10a160c0d72";
  
  let playerId = localStorage.getItem("toposyerizos-playerid");
  if (!playerId) {
    playerId = "usr_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
    localStorage.setItem("toposyerizos-playerid", playerId);
  }
  
  let playerName = localStorage.getItem("toposyerizos-playername") || "Jugador Anónimo";
  let playerAvatar = localStorage.getItem("toposyerizos-playeravatar") || "mole";
  const AVATAR_LIST = ["mole", "erizo", "helmet_mole", "disguise_mole", "bucket_mole", "fork_mole", "zombie_mole"];
  let selectedAvatarIndex = AVATAR_LIST.indexOf(playerAvatar);
  if (selectedAvatarIndex === -1) selectedAvatarIndex = 0;
  
  let highscores = [];

  // Web Audio Context & Nodes
  let actx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let musicTimer = null;
  let musicStep = 0;
  let currentMusicType = null; // 'menu' or 'game'

  /* =========================================================================
     AUDIO SYNTHESIZER (Web Audio API)
     ========================================================================= */

  function initAudio() {
    if (actx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    actx = new Ctx();

    masterGain = actx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(actx.destination);

    musicGain = actx.createGain();
    musicGain.gain.value = mutedMusic ? 0 : 0.18; // Soft background music
    musicGain.connect(masterGain);

    sfxGain = actx.createGain();
    sfxGain.gain.value = mutedSFX ? 0 : 0.5; // Solid sound effects
    sfxGain.connect(masterGain);
  }

  function playSynthNote(freq, startTime, duration, type, peakVol, destNode, filterFreq = 0) {
    if (!actx) return;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakVol, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    if (filterFreq > 0) {
      const filter = actx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, startTime);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(destNode);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  // Calm Marimba Music Scheduler
  const menuChords = [
    { bass: 65.41, notes: [130.81, 164.81, 196.00, 246.94, 293.66] }, // Cmaj9
    { bass: 55.00, notes: [110.00, 130.81, 164.81, 196.00, 246.94] }, // Am9
    { bass: 43.65, notes: [87.31, 110.00, 130.81, 164.81, 220.00] },  // Fmaj7
    { bass: 49.00, notes: [98.00, 123.47, 146.83, 174.61, 220.00] }   // G13
  ];

  const gameChords = [
    { bass: 130.81, notes: [261.63, 329.63, 392.00, 523.25] }, // C
    { bass: 87.31,  notes: [174.61, 220.00, 261.63, 349.23] }, // F
    { bass: 98.00,  notes: [196.00, 246.94, 293.66, 392.00] }, // G
    { bass: 130.81, notes: [261.63, 329.63, 392.00, 523.25] }  // C
  ];

  function scheduleNextNote() {
    if (!actx || paused) return;

    const now = actx.currentTime;
    
    if (currentMusicType === "menu") {
      // Menu Music: Slow, dreamy marimba lullaby (90 BPM -> 333ms per step)
      const stepDuration = 0.333;
      const chordIdx = Math.floor((musicStep % 32) / 8);
      const chord = menuChords[chordIdx];
      const stepInChord = musicStep % 8;

      if (stepInChord === 0) {
        // Soft bass note
        playSynthNote(chord.bass, now, 0.8, "sine", 0.35, musicGain);
      } else if (stepInChord === 2 || stepInChord === 4 || stepInChord === 6) {
        // Melodic arpeggio pluck
        const noteFreq = chord.notes[stepInChord / 2 - 1];
        playSynthNote(noteFreq, now, 0.4, "triangle", 0.18, musicGain, 1000);
      } else if (stepInChord === 5 || stepInChord === 7) {
        // Higher chime note
        const noteFreq = chord.notes[3 + (stepInChord === 5 ? 0 : 1)] || chord.notes[0];
        playSynthNote(noteFreq, now, 0.3, "sine", 0.1, musicGain);
      }

      musicStep++;
      musicTimer = setTimeout(scheduleNextNote, stepDuration * 1000);

    } else if (currentMusicType === "game") {
      // Game Music: Bouncy but calm folk marimba tune (120 BPM -> 250ms per step)
      const stepDuration = 0.25;
      const chordIdx = Math.floor((musicStep % 16) / 4);
      const chord = gameChords[chordIdx];
      const stepInChord = musicStep % 4;

      if (stepInChord === 0) {
        playSynthNote(chord.bass, now, 0.4, "sine", 0.4, musicGain);
      } else if (stepInChord === 2) {
        playSynthNote(chord.bass * 1.5, now, 0.3, "sine", 0.3, musicGain); // Bass fifth
      } else if (stepInChord === 1 || stepInChord === 3) {
        // Bouncy pluck
        const nIndex = (musicStep % 8) % chord.notes.length;
        const noteFreq = chord.notes[nIndex];
        playSynthNote(noteFreq, now, 0.2, "triangle", 0.16, musicGain, 1200);
      }

      musicStep++;
      musicTimer = setTimeout(scheduleNextNote, stepDuration * 1000);
    }
  }

  function startMusic(type) {
    initAudio();
    if (!actx) return;
    
    if (currentMusicType === type && musicTimer) return;
    
    stopMusic();
    currentMusicType = type;
    musicStep = 0;
    scheduleNextNote();
  }

  function stopMusic() {
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
  }

  function playSFX(type) {
    initAudio();
    if (mutedSFX || !actx) return;
    const now = actx.currentTime;

    if (type === "swing") {
      // White noise sweeps down for hammer swing whoosh
      const duration = 0.12;
      const bufferSize = actx.sampleRate * duration;
      const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = actx.createBufferSource();
      noise.buffer = buffer;

      const filter = actx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + duration);
      filter.Q.value = 2.5;

      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGain);
      noise.start(now);

    } else if (type === "hit_mole") {
      // Rubber/wood thwack sound (Thud)
      const duration = 0.15;
      const osc = actx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + duration);

      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.02);

      // Short high click
      const clickDur = 0.02;
      const click = actx.createOscillator();
      click.type = "triangle";
      click.frequency.setValueAtTime(900, now);
      click.frequency.linearRampToValueAtTime(200, now + clickDur);
      const clickGain = actx.createGain();
      clickGain.gain.setValueAtTime(0.4, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + clickDur);
      click.connect(clickGain);
      clickGain.connect(sfxGain);
      click.start(now);
      click.stop(now + clickDur + 0.01);

    } else if (type === "hit_erizo") {
      // High squeak + dissonant buzzer
      const duration = 0.18;
      const osc = actx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1450, now + duration);

      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.02);

      // Minor buzzer chord
      [220, 261.63, 311.13].forEach(f => {
        const o = actx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        const g = actx.createGain();
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        const filt = actx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 500;
        o.connect(filt);
        filt.connect(g);
        g.connect(sfxGain);
        o.start(now);
        o.stop(now + 0.4);
      });

    } else if (type === "helmet_ting") {
      // Bright metallic bell ring
      [1900, 2300, 2700].forEach((f, i) => {
        const osc = actx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const gain = actx.createGain();
        gain.gain.setValueAtTime(i === 0 ? 0.3 : 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.5);
      });

    } else if (type === "bucket_clonk") {
      // Hollow bucket hit
      const osc = actx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.09);
      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      const filter = actx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 380;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);

    } else if (type === "fork_block") {
      // Metallic scratch / scrape block
      const duration = 0.08;
      const bufferSize = actx.sampleRate * duration;
      const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = actx.createBufferSource();
      noise.buffer = buffer;
      const filter = actx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 3200;
      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGain);
      noise.start(now);

      // High pitch metallic chime
      const osc = actx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 2800;
      const og = actx.createGain();
      og.gain.setValueAtTime(0.12, now);
      og.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(og);
      og.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);

    } else if (type === "bubble_pop") {
      // Bubbly sound
      const osc = actx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(1350, now + 0.14);
      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);

    } else if (type === "victory_chime") {
      // Bubbly major chord arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((f, i) => {
        const osc = actx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = f;
        const gain = actx.createGain();
        const delay = i * 0.07;
        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(0.25, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.45);
      });

    } else if (type === "gameover_chime") {
      // Sad minor fall arpeggio
      const notes = [523.25, 415.30, 349.23, 293.66];
      notes.forEach((f, i) => {
        const osc = actx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = f;
        const gain = actx.createGain();
        const delay = i * 0.11;
        const filter = actx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 450;
        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.55);
      });

    } else if (type === "horde_warning") {
      // Double Alert Horn
      const osc1 = actx.createOscillator();
      const osc2 = actx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.value = 160;
      osc2.type = "sawtooth";
      osc2.frequency.value = 162.5; // Detuned thickness
      
      const filter = actx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 380;
      
      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGain);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    }
  }

  /* =========================================================================
     DYNAMIC VECTOR SVG TEMPLATES (Drawings matching references)
     ========================================================================= */

  function getMoleSVG(eyebrowsType, eyesType) {
    let eyesHTML = "";
    if (eyesType === "sparkle") {
      eyesHTML = `
        <circle class="critter-eye" cx="36" cy="46" r="4.5" fill="#2b1408" style="transform-origin: 36px 46px;"/>
        <circle class="critter-eye" cx="34.5" cy="44.5" r="1.5" fill="#fff" style="transform-origin: 36px 46px;"/>
        <circle class="critter-eye" cx="64" cy="46" r="4.5" fill="#2b1408" style="transform-origin: 64px 46px;"/>
        <circle class="critter-eye" cx="62.5" cy="44.5" r="1.5" fill="#fff" style="transform-origin: 64px 46px;"/>
      `;
    } else if (eyesType === "surprised") {
      eyesHTML = `
        <circle class="critter-eye" cx="36" cy="46" r="6.5" fill="#2b1408" style="transform-origin: 36px 46px;"/>
        <circle class="critter-eye" cx="36" cy="46" r="4" fill="#ffa8a8" style="transform-origin: 36px 46px;"/>
        <circle class="critter-eye" cx="35" cy="45" r="1" fill="#fff" style="transform-origin: 36px 46px;"/>
        <circle class="critter-eye" cx="64" cy="46" r="6.5" fill="#2b1408" style="transform-origin: 64px 46px;"/>
        <circle class="critter-eye" cx="64" cy="46" r="4" fill="#ffa8a8" style="transform-origin: 64px 46px;"/>
        <circle class="critter-eye" cx="63" cy="45" r="1" fill="#fff" style="transform-origin: 64px 46px;"/>
      `;
    } else { // normal
      eyesHTML = `
        <circle class="critter-eye" cx="36" cy="46" r="4.5" fill="#2b1408" style="transform-origin: 36px 46px;"/>
        <circle class="critter-eye" cx="64" cy="46" r="4.5" fill="#2b1408" style="transform-origin: 64px 46px;"/>
      `;
    }

    let eyebrowsHTML = "";
    if (eyebrowsType === "angry") {
      eyebrowsHTML = `
        <path d="M31 40 Q41 33 49 41" stroke="#2b1408" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M69 40 Q59 33 51 41" stroke="#2b1408" stroke-width="5" stroke-linecap="round" fill="none"/>
      `;
    } else if (eyebrowsType === "worried") {
      eyebrowsHTML = `
        <path d="M32 37 Q41 43 47 37" stroke="#2b1408" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <path d="M68 37 Q59 43 53 37" stroke="#2b1408" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      `;
    } else { // normal happy
      eyebrowsHTML = `
        <path d="M31 38 Q39 33 46 37" stroke="#2b1408" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M69 38 Q61 33 54 37" stroke="#2b1408" stroke-width="4" stroke-linecap="round" fill="none"/>
      `;
    }

    return `
      <svg class="critter-svg" viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id="moleGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#ba8258" />
            <stop offset="100%" stop-color="#734222" />
          </radialGradient>
        </defs>
        <!-- Ears -->
        <circle cx="21" cy="31" r="9" fill="#734222" stroke="#4a2711" stroke-width="2.5"/>
        <circle cx="21" cy="31" r="4.5" fill="#ffa8a8"/>
        <circle cx="79" cy="31" r="9" fill="#734222" stroke="#4a2711" stroke-width="2.5"/>
        <circle cx="79" cy="31" r="4.5" fill="#ffa8a8"/>
        <!-- Paws -->
        <path d="M12 75 C8 60 22 55 25 65 C28 75 18 80 12 75 Z" fill="#ffbda8" stroke="#4a2711" stroke-width="2.5"/>
        <path d="M88 75 C92 60 78 55 75 65 C72 75 82 80 88 75 Z" fill="#ffbda8" stroke="#4a2711" stroke-width="2.5"/>
        <!-- Body -->
        <path d="M22 85 C22 25 78 25 78 85 C78 95 22 95 22 85 Z" fill="url(#moleGrad)" stroke="#4a2711" stroke-width="3"/>
        <!-- Hair -->
        <path d="M42 22 L36 17 L40 24" stroke="#4a2711" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M58 22 L64 17 L60 24" stroke="#4a2711" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M50 20 L50 14" stroke="#4a2711" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Eyebrows -->
        ${eyebrowsHTML}
        <!-- Eyes -->
        ${eyesHTML}
        <!-- Snout -->
        <ellipse cx="50" cy="56" rx="14" ry="10" fill="#ffb4a2" stroke="#4a2711" stroke-width="2.5"/>
        <ellipse class="critter-nose-tip" cx="50" cy="52" rx="5" ry="3.5" fill="#e57c73" style="transform-origin: 50px 52px;"/>
        <!-- Mouth & Tooth -->
        <path d="M44 60 Q50 65 56 60" stroke="#4a2711" stroke-width="2.5" fill="none"/>
        <rect x="47.5" y="60.5" width="5" height="4.5" fill="#fff" stroke="#4a2711" stroke-width="1.2" rx="0.5"/>
      </svg>
    `;
  }

  function getErizoSVG() {
    return `
      <svg class="critter-svg" viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id="erizoFace" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff0e0" />
            <stop offset="100%" stop-color="#ffdcb8" />
          </radialGradient>
          <radialGradient id="erizoSpikes" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#805d3f" />
            <stop offset="100%" stop-color="#4d321d" />
          </radialGradient>
        </defs>
        
        <!-- Back Spikes/Quills (Hedgehog spikes) -->
        <path d="M 12,80 
                 L 5,70 L 15,62 L 8,50 L 20,44 L 14,30 L 28,24 L 26,12 L 40,10 L 46,2 
                 L 54,2 L 60,10 L 74,12 L 72,24 L 86,30 L 80,44 L 92,50 L 85,62 L 95,70 L 88,80 Z" 
              fill="url(#erizoSpikes)" stroke="#301e10" stroke-width="2.5"/>
              
        <!-- Extra inner spikes layer -->
        <path d="M 20,75 
                 L 16,65 L 24,58 L 18,48 L 28,40 L 24,32 L 36,28 L 36,18 L 48,18
                 L 52,18 L 64,18 L 64,28 L 76,32 L 72,40 L 82,48 L 76,58 L 84,65 L 80,75 Z" 
            fill="#3d2514" opacity="0.8"/>

        <!-- Paws -->
        <circle cx="22" cy="80" r="6" fill="#ffbda8" stroke="#301e10" stroke-width="2"/>
        <circle cx="78" cy="80" r="6" fill="#ffbda8" stroke="#301e10" stroke-width="2"/>

        <!-- Hedgehog Face/Body (Beige dome) -->
        <path d="M25 85 C25 35 75 35 75 85 C75 92 25 92 25 85 Z" fill="url(#erizoFace)" stroke="#301e10" stroke-width="2.5"/>
        
        <!-- Little Ears -->
        <circle class="erizo-ear" cx="28" cy="46" r="6" fill="#ffdcb8" stroke="#301e10" stroke-width="2" style="transform-origin: 28px 46px;"/>
        <circle class="erizo-ear" cx="28" cy="46" r="3" fill="#ffa8a8" style="transform-origin: 28px 46px;"/>
        <circle class="erizo-ear" cx="72" cy="46" r="6" fill="#ffdcb8" stroke="#301e10" stroke-width="2" style="transform-origin: 72px 46px;"/>
        <circle class="erizo-ear" cx="72" cy="46" r="3" fill="#ffa8a8" style="transform-origin: 72px 46px;"/>

        <!-- Hedgehog Eyes (Sparkles) -->
        <circle class="critter-eye" cx="40" cy="58" r="4.2" fill="#2d1d1d" style="transform-origin: 40px 58px;"/>
        <circle class="critter-eye" cx="38.5" cy="56.5" r="1.5" fill="#fff" style="transform-origin: 40px 58px;"/>
        <circle class="critter-eye" cx="60" cy="58" r="4.2" fill="#2d1d1d" style="transform-origin: 60px 58px;"/>
        <circle class="critter-eye" cx="58.5" cy="56.5" r="1.5" fill="#fff" style="transform-origin: 60px 58px;"/>

        <!-- Blushing Cheeks -->
        <circle cx="34" cy="66" r="4" fill="#ff7675" opacity="0.55"/>
        <circle cx="66" cy="66" r="4" fill="#ff7675" opacity="0.55"/>

        <!-- Cute Nose & Mouth -->
        <ellipse class="erizo-nose" cx="50" cy="65" rx="5" ry="4" fill="#301e10" style="transform-origin: 50px 65px;"/>
        <circle cx="49" cy="63.5" r="1" fill="#fff"/>
        <path d="M47 70 Q50 73 53 70" stroke="#301e10" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `;
  }

  function getDisguisedMoleSVG() {
    return `
      <svg class="critter-svg" viewBox="0 0 100 100" width="100%" height="100%">
        <!-- Hedgehog Spikes of the Suit in background -->
        <path d="M 12,80 
                 L 5,70 L 15,62 L 8,50 L 20,44 L 14,30 L 28,24 L 26,12 L 40,10 L 46,2 
                 L 54,2 L 60,10 L 74,12 L 72,24 L 86,30 L 80,44 L 92,50 L 85,62 L 95,70 L 88,80 Z" 
              fill="url(#erizoSpikes)" stroke="#301e10" stroke-width="2"/>
              
        <!-- Extra inner spikes layer -->
        <path d="M 20,75 
                 L 16,65 L 24,58 L 18,48 L 28,40 L 24,32 L 36,28 L 36,18 L 48,18
                 L 52,18 L 64,18 L 64,28 L 76,32 L 72,40 L 82,48 L 76,58 L 84,65 L 80,75 Z" 
            fill="#3d2514" opacity="0.8"/>

        <!-- Paws -->
        <circle cx="22" cy="80" r="6" fill="#ffbda8" stroke="#301e10" stroke-width="2"/>
        <circle cx="78" cy="80" r="6" fill="#ffbda8" stroke="#301e10" stroke-width="2"/>

        <!-- Hedgehog Face/Body (Beige dome) -->
        <path d="M25 85 C25 35 75 35 75 85 C75 92 25 92 25 85 Z" fill="url(#erizoFace)" stroke="#301e10" stroke-width="2.5"/>
        
        <!-- Big Round Mole Ears sticking out of the suit! -->
        <circle class="erizo-ear" cx="18" cy="38" r="10" fill="#734222" stroke="#2b1408" stroke-width="2.5" style="transform-origin: 18px 38px;"/>
        <circle class="erizo-ear" cx="18" cy="38" r="6" fill="#ffa8a8" stroke="#2b1408" stroke-width="1.5" style="transform-origin: 18px 38px;"/>
        <circle class="erizo-ear" cx="82" cy="38" r="10" fill="#734222" stroke="#2b1408" stroke-width="2.5" style="transform-origin: 82px 38px;"/>
        <circle class="erizo-ear" cx="82" cy="38" r="6" fill="#ffa8a8" stroke="#2b1408" stroke-width="1.5" style="transform-origin: 82px 38px;"/>

        <!-- Open suit face cutout showing the BROWN mole skin face inside instead of beige! -->
        <ellipse cx="50" cy="56" rx="20" ry="17" fill="url(#moleGrad)" stroke="#301e10" stroke-width="2"/>

        <!-- Eyes (Same sparkling eyes as erizo to confuse!) -->
        <circle class="critter-eye" cx="40" cy="54" r="4.2" fill="#2d1d1d" style="transform-origin: 40px 54px;"/>
        <circle class="critter-eye" cx="38.5" cy="52.5" r="1.5" fill="#fff" style="transform-origin: 40px 54px;"/>
        <circle class="critter-eye" cx="60" cy="54" r="4.2" fill="#2d1d1d" style="transform-origin: 60px 54px;"/>
        <circle class="critter-eye" cx="58.5" cy="52.5" r="1.5" fill="#fff" style="transform-origin: 60px 54px;"/>

        <!-- Blushing Cheeks -->
        <circle cx="34" cy="62" r="3.5" fill="#ff7675" opacity="0.6"/>
        <circle cx="66" cy="62" r="3.5" fill="#ff7675" opacity="0.6"/>

        <!-- Zipper Slider on the chest -->
        <line x1="50" y1="73" x2="50" y2="88" stroke="#301e10" stroke-width="2" stroke-dasharray="2,2"/>
        <polygon points="50,73 53,79 47,79" fill="#ffd700" stroke="#301e10" stroke-width="1.2"/>
        <circle cx="50" cy="81" r="2" fill="#ffd700" stroke="#301e10" stroke-width="0.8"/>

        <!-- Mole Snout and Bucktooth -->
        <!-- Pink Snout -->
        <ellipse cx="50" cy="61" rx="7.5" ry="5.5" fill="#ffbda8" stroke="#4a2711" stroke-width="1.8"/>
        <ellipse class="critter-nose-tip" cx="50" cy="58" rx="2.5" ry="1.8" fill="#e57c73" style="transform-origin: 50px 58px;"/>
        <!-- Curved Eyebrows -->
        <path d="M32 45 Q39 40 45 44" stroke="#2b1408" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M68 45 Q61 40 55 44" stroke="#2b1408" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <!-- Mouth & Bucktooth -->
        <path d="M46 64 Q50 67 54 64" stroke="#4a2711" stroke-width="1.8" fill="none"/>
        <rect x="48.5" y="64.5" width="3" height="3" fill="#fff" stroke="#4a2711" stroke-width="1" rx="0.3"/>
      </svg>
    `;
  }

  function getHelmetMoleSVG(state) {
    const showHelmet = state.hp > 1;
    const eyes = showHelmet ? "normal" : "surprised";
    const eyebrows = showHelmet ? "normal" : "worried";
    const baseMole = getMoleSVG(eyebrows, eyes);
    
    if (!showHelmet) return baseMole;

    const helmetHTML = `
      <!-- White construction helmet -->
      <g class="helmet-group" style="transform-origin: 50px 36px;">
        <path d="M15 36 C15 9 85 9 85 36 C85 39 15 39 15 36 Z" fill="#ffffff" stroke="#4a2711" stroke-width="3"/>
        <path d="M8 36 L92 36 C94 36 94 39 92 39 L8 39 C6 39 6 36 8 36 Z" fill="#ffffff" stroke="#4a2711" stroke-width="2.5"/>
        <path d="M50 14 C44 14 44 36 50 36 C56 36 56 14 50 14 Z" fill="#eaeaea" stroke="#4a2711" stroke-width="1.5"/>
        <rect x="46" y="26" width="8" height="8" rx="1.5" fill="#ffbe1a" stroke="#4a2711" stroke-width="1.5"/>
      </g>
      </svg>
    `;
    return baseMole.replace("</svg>", helmetHTML);
  }

  function getBucketMoleSVG(state) {
    const showBucket = state.hp > 1;
    const dentLevel = state.hp;
    const eyes = showBucket ? "normal" : "surprised";
    const baseMole = getMoleSVG("normal", eyes);
    
    if (!showBucket) return baseMole;

    let cracksHTML = "";
    if (dentLevel === 2) {
      cracksHTML = `<path d="M35 15 L42 22 L38 27" stroke="#1c3d52" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    } else if (dentLevel === 1) {
      cracksHTML = `
        <path d="M35 15 L42 22 L38 27" stroke="#1c3d52" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M62 20 L55 28 L60 32" stroke="#1c3d52" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M46 9 L49 17" stroke="#1c3d52" stroke-width="4" stroke-linecap="round"/>
      `;
    }

    const bucketHTML = `
      <g class="bucket-group" style="transform-origin: 50px 36px;">
        <path d="M12 36 C10 18 90 18 88 36" fill="none" stroke="#90caf9" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M22 36 L30 10 L70 10 L78 36 Z" fill="#2980b9" stroke="#1c3d52" stroke-width="3"/>
        <path d="M17 36 L83 36 C86 36 86 40 83 40 L17 40 C14 40 14 36 17 36 Z" fill="#3498db" stroke="#1c3d52" stroke-width="2.5"/>
        ${cracksHTML}
      </g>
      </svg>
    `;
    return baseMole.replace("</svg>", bucketHTML);
  }

  function getForkMoleSVG(state) {
    const baseMole = getMoleSVG("angry", "normal");
    
    const forkHTML = `
      <g class="fork-group">
        <g class="fork-sway-inner" style="transform-origin: 21px 50px;">
          <rect x="18" y="32" width="6" height="38" rx="2" fill="#3498db" stroke="#1c3d52" stroke-width="2"/>
          <path d="M14 32 L28 32 L26 22 L16 22 Z" fill="#3498db" stroke="#1c3d52" stroke-width="2"/>
          <rect x="16" y="12" width="2" height="12" fill="#3498db" stroke="#1c3d52" stroke-width="1.5"/>
          <rect x="20" y="10" width="2" height="14" fill="#3498db" stroke="#1c3d52" stroke-width="1.5"/>
          <rect x="24" y="12" width="2" height="12" fill="#3498db" stroke="#1c3d52" stroke-width="1.5"/>
          <circle cx="21" cy="50" r="7" fill="#ffbda8" stroke="#4a2711" stroke-width="2"/>
          <polygon class="fork-sparkle" points="12,18 15,25 22,22 17,29 23,34 15,32 12,39" fill="#00ffff">
            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="0.6s" repeatCount="indefinite"/>
          </polygon>
        </g>
      </g>
      </svg>
    `;
    return baseMole.replace("</svg>", forkHTML);
  }

  function getZombieMoleSVG(state) {
    const cracksCount = 5 - state.hp;
    let cracksHTML = "";
    if (cracksCount >= 1) cracksHTML += `<path d="M30 52 L36 58" stroke="#111" stroke-width="3"/>`;
    if (cracksCount >= 2) cracksHTML += `<path d="M68 55 L74 49" stroke="#111" stroke-width="3"/>`;
    if (cracksCount >= 3) cracksHTML += `<path d="M45 32 L55 35" stroke="#111" stroke-width="3.5"/>`;
    if (cracksCount >= 4) cracksHTML += `<path d="M42 70 L58 68" stroke="#111" stroke-width="4"/>`;

    const stitchesHTML = `
      <path d="M48 28 L54 36 M51 32 L46 34 M54 30 L49 32" stroke="#222" stroke-width="2" stroke-linecap="round"/>
      <path d="M26 62 L32 72 M27 68 L32 66" stroke="#222" stroke-width="2" stroke-linecap="round"/>
    `;

    return `
      <svg class="critter-svg" viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id="zombieGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#9ea7aa" />
            <stop offset="100%" stop-color="#546e7a" />
          </radialGradient>
        </defs>
        <g class="zombie-group" style="transform-origin: 50px 85px;">
          <circle cx="20" cy="30" r="10" fill="#546e7a" stroke="#29434e" stroke-width="2.5"/>
          <circle cx="20" cy="30" r="5" fill="#cfd8dc"/>
          <circle cx="80" cy="30" r="10" fill="#546e7a" stroke="#29434e" stroke-width="2.5"/>
          <circle cx="80" cy="30" r="5" fill="#cfd8dc"/>
          
          <path d="M12 75 C8 60 22 55 25 65 C28 75 18 80 12 75 Z" fill="#eceff1" stroke="#29434e" stroke-width="2.5"/>
          <path d="M88 75 C92 60 78 55 75 65 C72 75 82 80 88 75 Z" fill="#eceff1" stroke="#29434e" stroke-width="2.5"/>
          
          <path d="M22 85 C22 25 78 25 78 85 C78 95 22 95 22 85 Z" fill="url(#zombieGrad)" stroke="#29434e" stroke-width="3"/>
          
          <!-- X Stitched Eyes -->
          <path d="M32 42 L42 50 M42 42 L32 50" stroke="#111" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M58 42 L68 50 M68 42 L58 50" stroke="#111" stroke-width="4.5" stroke-linecap="round"/>
          
          <ellipse cx="50" cy="56" rx="14" ry="10" fill="#cfd8dc" stroke="#29434e" stroke-width="2.5"/>
          <ellipse cx="50" cy="52" rx="5" ry="3.5" fill="#90a4ae"/>
          <path d="M44 60 Q50 63 56 60" stroke="#29434e" stroke-width="2.5" fill="none"/>
          
          ${stitchesHTML}
          ${cracksHTML}
        </g>
      </svg>
    `;
  }

  function getBubblePowerupSVG(kind) {
    const isHeart = kind === "bubble_heart";
    const innerGraphic = isHeart
      ? `<path d="M50 65 C40 55 32 46 32 37 C32 29 38 23 46 23 C50 23 54 26 56 30 C58 26 62 23 66 23 C74 23 80 29 80 37 C80 46 72 55 62 65 L56 71 Z" fill="#ff3838" stroke="#990000" stroke-width="2"/>`
      : `<g transform="translate(18, 18) scale(0.64)">
           <rect x="42" y="30" width="16" height="60" rx="6" fill="#e67e22" stroke="#5a3212" stroke-width="4"/>
           <path d="M10 20 L90 20 L90 50 L10 50 Z" fill="#e74c3c" stroke="#5a3212" stroke-width="5"/>
           <path d="M10 20 L10 50" stroke="#962d22" stroke-width="5"/>
           <path d="M90 20 L90 50" stroke="#962d22" stroke-width="5"/>
           <polygon points="50,26 52,31 58,32 54,36 55,42 50,39 45,42 46,36" fill="#f1c40f"/>
         </g>`;

    return `
      <svg class="critter-svg" viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id="bubbleGrad" cx="35%" cy="30%" r="60%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
            <stop offset="35%" stop-color="#e3f2fd" stop-opacity="0.5" />
            <stop offset="75%" stop-color="#90caf9" stop-opacity="0.25" />
            <stop offset="95%" stop-color="#42a5f5" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#1e88e5" stop-opacity="0.75" />
          </radialGradient>
        </defs>
        ${innerGraphic}
        <circle cx="50" cy="50" r="41" fill="url(#bubbleGrad)" stroke="#64b5f6" stroke-width="2"/>
        <ellipse cx="32" cy="22" rx="11" ry="5.5" fill="#ffffff" opacity="0.6" transform="rotate(-30, 32, 22)"/>
      </svg>
    `;
  }

  function getCritterHTML(kind, state) {
    if (kind === "mole") return getMoleSVG("normal", "sparkle");
    if (kind === "erizo") return getErizoSVG();
    if (kind === "disguise_mole") return getDisguisedMoleSVG();
    if (kind === "helmet_mole") return getHelmetMoleSVG(state);
    if (kind === "bucket_mole") return getBucketMoleSVG(state);
    if (kind === "fork_mole") return getForkMoleSVG(state);
    if (kind === "zombie_mole") return getZombieMoleSVG(state);
    if (kind === "bubble_heart" || kind === "bubble_hammer") return getBubblePowerupSVG(kind);
    return "";
  }

  // Inject graphics inside Help Page
  function injectHelpGraphics() {
    const graphics = {
      ".graphic-mole-hit": getMoleSVG("worried", "surprised"),
      ".graphic-cuye-hit": getErizoSVG(),
      ".graphic-helmet-mole": getHelmetMoleSVG({ hp: 2 }),
      ".graphic-bucket-mole": getBucketMoleSVG({ hp: 3 }),
      ".graphic-disguise-mole": getDisguisedMoleSVG(),
      ".graphic-fork-mole": getForkMoleSVG({ forkUp: true }),
      ".graphic-zombie-mole": getZombieMoleSVG({ hp: 4 }),
      ".graphic-heart-bubble": getBubblePowerupSVG("bubble_heart"),
      ".graphic-hammer-bubble": getBubblePowerupSVG("bubble_hammer")
    };

    for (let selector in graphics) {
      const el = document.querySelector(selector);
      if (el) el.innerHTML = graphics[selector];
    }
  }

  /* =========================================================================
     BOARD INITIALIZATION
     ========================================================================= */

  function buildBoard() {
    board.innerHTML = "";
    holes = [];
    activeCritterCount = 0;

    for (let i = 0; i < HOLE_COUNT; i++) {
      const container = document.createElement("div");
      container.className = "hole-container";
      container.dataset.index = String(i);

      const back = document.createElement("div");
      back.className = "hole-back";

      const wrapper = document.createElement("div");
      wrapper.className = "critter-wrapper";

      const critter = document.createElement("div");
      critter.className = "critter";

      const front = document.createElement("div");
      front.className = "hole-front";

      wrapper.appendChild(critter);
      container.appendChild(back);
      container.appendChild(wrapper);
      container.appendChild(front);

      container.addEventListener("pointerdown", onHolePointerDown);
      board.appendChild(container);

      holes.push({
        el: container,
        critterEl: critter,
        up: false,
        kind: null,
        hp: 0,
        maxHp: 0,
        upToken: 0,
        state: {}
      });
    }
  }

  /* =========================================================================
     SETTINGS & HIGHSCORES MANAGEMENT
     ========================================================================= */

  function loadSettings() {
    mutedMusic = localStorage.getItem(MUSIC_MUTE_KEY) === "1";
    mutedSFX = localStorage.getItem(SFX_MUTE_KEY) === "1";
    
    toggleMusic.textContent = mutedMusic ? "NO" : "SÍ";
    toggleMusic.classList.toggle("active", !mutedMusic);
    
    toggleSFX.textContent = mutedSFX ? "NO" : "SÍ";
    toggleSFX.classList.toggle("active", !mutedSFX);

    // Dificulty Chips
    difficulty = localStorage.getItem("toposyerizos-difficulty") || "normal";
    diffChips.forEach(chip => {
      const active = chip.dataset.diff === difficulty;
      chip.classList.toggle("active", active);
    });
  }

  function saveDifficulty(diff) {
    difficulty = diff;
    localStorage.setItem("toposyerizos-difficulty", diff);
  }

  function getHighscores() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveHighscore(newScore) {
    let scores = getHighscores();
    scores.push({ score: newScore, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, MAX_HIGHSCORES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    highscores = scores;
  }

  function getAvatarSVG(kind) {
    if (kind === "mole") return getMoleSVG("normal", "normal");
    if (kind === "erizo") return getErizoSVG();
    if (kind === "helmet_mole") return getHelmetMoleSVG({ hp: 2 });
    if (kind === "disguise_mole") return getDisguisedMoleSVG();
    if (kind === "bucket_mole") return getBucketMoleSVG({ hp: 3 });
    if (kind === "fork_mole") return getForkMoleSVG({ forkUp: true });
    if (kind === "zombie_mole") return getZombieMoleSVG({ hp: 5 });
    return getMoleSVG("normal", "normal");
  }

  function getLocalRecord() {
    const scores = getHighscores();
    return scores.length > 0 ? scores[0].score : 0;
  }

  function renderProfileUI() {
    profileViewName.textContent = playerName;
    profileViewAvatar.innerHTML = getAvatarSVG(playerAvatar);
    if (mobileAvatarIcon) {
      mobileAvatarIcon.innerHTML = getAvatarSVG(playerAvatar);
    }
    avatarCurrentOption.innerHTML = getAvatarSVG(AVATAR_LIST[selectedAvatarIndex]);
    inputProfileName.value = playerName;
    
    const record = getLocalRecord();
    profileViewRecord.textContent = record;
  }

  // --- ROBUST LEADERBOARD API WRAPPERS ---
  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 4000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async function fetchWithRetry(url, options = {}, retries = 2, delay = 800) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (!res.ok) {
        if (res.status === 429 && retries > 0) {
          await new Promise(r => setTimeout(r, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
        throw new Error(`HTTP error ${res.status}`);
      }
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw err;
    }
  }

  function renderLeaderboard(entries) {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = "";
    if (!entries || entries.length === 0) {
      leaderboardList.innerHTML = `<div class="leaderboard-empty">Sin puntajes globales aún</div>`;
      return;
    }
    
    const limit = Math.min(entries.length, 50);
    for (let i = 0; i < limit; i++) {
      const entry = entries[i];
      if (!entry || !entry.name) continue;
      const namePart = entry.name;
      const avatarPart = entry.avatar || "mole";
      const isMe = entry.id ? (entry.id === playerId) : (namePart.trim().toLowerCase() === playerName.trim().toLowerCase());
      
      const row = document.createElement("div");
      row.className = `leaderboard-row rank-${i+1} ${isMe ? "my-row" : ""}`;
      
      let rankBadge = i + 1;
      let rankClass = "";
      if (i === 0) {
        rankBadge = "🥇";
        rankClass = "rank-1";
      } else if (i === 1) {
        rankBadge = "🥈";
        rankClass = "rank-2";
      } else if (i === 2) {
        rankBadge = "🥉";
        rankClass = "rank-3";
      }
      
      let crownHTML = "";
      if (i === 0) {
        crownHTML = `<span class="leaderboard-crown">👑</span>`;
      }
      
      row.innerHTML = `
        <div class="leaderboard-rank ${rankClass}">${rankBadge}</div>
        <div class="leaderboard-player">
          <div class="leaderboard-player-avatar">${getAvatarSVG(avatarPart)}</div>
          <span class="leaderboard-player-name" title="${namePart}">${namePart}</span>
          ${crownHTML}
        </div>
        <div class="leaderboard-score">${entry.score}</div>
      `;
      leaderboardList.appendChild(row);
    }
  }

  async function fetchLeaderboard() {
    let cached = null;
    try {
      const cacheData = localStorage.getItem("toposyerizos-leaderboard-cache");
      if (cacheData) {
        cached = JSON.parse(cacheData);
        if (Array.isArray(cached)) {
          renderLeaderboard(cached);
        }
      }
    } catch (e) {
      console.warn("Failed to load leaderboard cache:", e);
    }

    if (!cached && leaderboardList) {
      leaderboardList.innerHTML = `<div class="leaderboard-loading">Cargando ranking...</div>`;
    }

    try {
      const res = await fetchWithRetry(`${LEADERBOARD_BIN_URL}?t=${Date.now()}`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error("Invalid JSON response from server");
      }

      const entries = data.scores || [];
      if (!Array.isArray(entries)) {
        throw new Error("Invalid scores format from server");
      }

      localStorage.setItem("toposyerizos-leaderboard-cache", JSON.stringify(entries));
      renderLeaderboard(entries);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      if (!cached && leaderboardList) {
        leaderboardList.innerHTML = `<div class="leaderboard-loading">Error al conectar ranking</div>`;
      }
    }
  }

  async function submitScoreToLeaderboard(score) {
    if (score <= 0) return;
    try {
      const res = await fetchWithRetry(`${LEADERBOARD_BIN_URL}?t=${Date.now()}`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error("Invalid JSON on fetch before submit");
      }
      
      const scoresList = data.scores || [];
      
      let existingIndex = scoresList.findIndex(s => s.id === playerId);
      if (existingIndex === -1) {
        existingIndex = scoresList.findIndex(s => s.name.trim().toLowerCase() === playerName.trim().toLowerCase() && !s.id);
        if (existingIndex !== -1) {
          scoresList[existingIndex].id = playerId;
        }
      }
      
      if (existingIndex !== -1) {
        if (score > scoresList[existingIndex].score) {
          scoresList[existingIndex].score = score;
          scoresList[existingIndex].avatar = playerAvatar;
          scoresList[existingIndex].date = new Date().toLocaleDateString();
        }
        scoresList[existingIndex].name = playerName.trim();
      } else {
        scoresList.push({
          id: playerId,
          name: playerName.trim(),
          avatar: playerAvatar,
          score: score,
          date: new Date().toLocaleDateString()
        });
      }
      
      scoresList.sort((a, b) => b.score - a.score);
      const topScores = scoresList.slice(0, 50);
      
      localStorage.setItem("toposyerizos-leaderboard-cache", JSON.stringify(topScores));
      renderLeaderboard(topScores);

      await fetchWithRetry(LEADERBOARD_BIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ scores: topScores })
      });
      
      console.log("Submitted score to JSON storage successfully!");
    } catch (err) {
      console.error("Error submitting score:", err);
    }
  }

  async function changeProfile(newName, newAvatar) {
    const oldName = playerName;
    const cleanedNewName = newName.trim();
    if (!cleanedNewName) return;
    
    playerName = cleanedNewName;
    playerAvatar = newAvatar;
    localStorage.setItem("toposyerizos-playername", cleanedNewName);
    localStorage.setItem("toposyerizos-playeravatar", newAvatar);
    
    renderProfileUI();
    
    try {
      const res = await fetchWithRetry(`${LEADERBOARD_BIN_URL}?t=${Date.now()}`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error("Invalid JSON on fetch before profile change");
      }
      
      let scoresList = data.scores || [];
      
      let entryIndex = scoresList.findIndex(s => s.id === playerId);
      if (entryIndex === -1) {
        entryIndex = scoresList.findIndex(s => s.name.trim().toLowerCase() === oldName.trim().toLowerCase() && !s.id);
        if (entryIndex !== -1) {
          scoresList[entryIndex].id = playerId;
        }
      }
      
      let dbScore = 0;
      if (entryIndex !== -1) {
        dbScore = scoresList[entryIndex].score;
        scoresList[entryIndex].name = cleanedNewName;
        scoresList[entryIndex].avatar = newAvatar;
      }
      
      const localRecord = getLocalRecord();
      const finalScore = Math.max(dbScore, localRecord);
      
      if (dbScore > localRecord) {
        saveHighscore(dbScore);
        renderProfileUI();
      }
      
      if (finalScore > 0) {
        if (entryIndex !== -1) {
          scoresList[entryIndex].score = finalScore;
        } else {
          scoresList.push({
            id: playerId,
            name: cleanedNewName,
            avatar: newAvatar,
            score: finalScore,
            date: new Date().toLocaleDateString()
          });
        }
        
        scoresList.sort((a, b) => b.score - a.score);
        const topScores = scoresList.slice(0, 50);
        
        localStorage.setItem("toposyerizos-leaderboard-cache", JSON.stringify(topScores));
        renderLeaderboard(topScores);

        await fetchWithRetry(LEADERBOARD_BIN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ scores: topScores })
        });
      }
    } catch (e) {
      console.error("Error updating profile in JSON storage:", e);
    }
  }

  function updateMainHighscoreLabel() {
    const scores = getHighscores();
    const topScore = scores.length > 0 ? scores[0].score : 0;
    highscoreEl.textContent = String(topScore);
  }

  /* =========================================================================
     GAMEPLAY SPATIAL CALCULATIONS & SELECTION
     ========================================================================= */

  function pickCritterKind(currentPhase) {
    const r = Math.random();
    const cfg = DIFFICULTIES[difficulty];

    // Determine if it should spawn an erizo (hedgehog - obstacle)
    if (r < cfg.erizoChance) {
      return "erizo";
    }

    const roll = Math.random();

    // Spawn ratios scale depending on the Phase (1 to 10)
    if (currentPhase === 1) {
      // Phase 1 has mostly normal moles, but introduces helmet and disguise moles!
      if (roll < 0.20) return "helmet_mole";
      if (roll < 0.25) return "disguise_mole";
      return "mole";
    }
    
    if (currentPhase === 2) {
      // Phase 2 adds bucket moles
      if (roll < 0.10) return "bucket_mole";
      if (roll < 0.20) return "disguise_mole";
      if (roll < 0.45) return "helmet_mole";
      return "mole";
    }
    
    if (currentPhase === 3) {
      // Phase 3 adds fork moles
      if (roll < 0.08) return "fork_mole";
      if (roll < 0.20) return "bucket_mole";
      if (roll < 0.35) return "disguise_mole";
      if (roll < 0.60) return "helmet_mole";
      return "mole";
    }
    
    if (currentPhase === 4) {
      if (roll < 0.15) return "fork_mole";
      if (roll < 0.30) return "disguise_mole";
      if (roll < 0.50) return "bucket_mole";
      if (roll < 0.75) return "helmet_mole";
      return "mole";
    }
    
    if (currentPhase === 5) {
      // 5 kinds present
      if (roll < 0.20) return "fork_mole";
      if (roll < 0.40) return "disguise_mole";
      if (roll < 0.60) return "bucket_mole";
      if (roll < 0.80) return "helmet_mole";
      return "mole";
    }

    if (currentPhase === 6) {
      // 6 kinds present
      if (roll < 0.15) return "zombie_mole";
      if (roll < 0.30) return "fork_mole";
      if (roll < 0.50) return "disguise_mole";
      if (roll < 0.65) return "bucket_mole";
      if (roll < 0.80) return "helmet_mole";
      return "mole";
    }

    // Phases 7 to 10: Includes powerups and all variants
    if (currentPhase >= 7) {
      // 8% chance of powerup bubbles
      if (roll < 0.04) return "bubble_heart";
      if (roll < 0.08) return "bubble_hammer";
      
      const subRoll = Math.random();
      if (subRoll < 0.20) return "zombie_mole";
      if (subRoll < 0.40) return "fork_mole";
      if (subRoll < 0.55) return "disguise_mole";
      if (subRoll < 0.70) return "bucket_mole";
      if (subRoll < 0.85) return "helmet_mole";
      return "mole";
    }

    return "mole";
  }

  function randomFreeHoleIndex() {
    const freeIndices = holes.map((h, i) => (h.up ? -1 : i)).filter(i => i !== -1);
    if (freeIndices.length === 0) return -1;
    return freeIndices[Math.floor(Math.random() * freeIndices.length)];
  }

  function popDown(hole) {
    if (!hole.up) return;
    
    hole.up = false;
    hole.el.classList.remove("up");
    hole.el.classList.remove("fork-up");
    
    if (activeCritterCount > 0) activeCritterCount--;
    
    // Reset contents after transition finishes (wait longer if hit animation is running)
    const delay = hole.el.classList.contains("hit") ? 380 : 250;
    setTimeout(() => {
      if (!hole.up) {
        hole.critterEl.innerHTML = "";
        hole.kind = null;
        hole.el.classList.remove("hit"); // Clear hit class so next spawn is fresh!
      }
    }, delay);
  }

  /* =========================================================================
     SPAWNING LOOPS
     ========================================================================= */

  function spawnSingleCritterAt(hole, cfg) {
    const kind = pickCritterKind(phase);
    hole.kind = kind;
    hole.state = {}; // Reset state

    const myToken = hole.upToken;
    
    // Set HPs
    if (kind === "mole" || kind === "erizo" || kind === "disguise_mole" || kind === "bubble_heart" || kind === "bubble_hammer") {
      hole.maxHp = 1;
    } else if (kind === "helmet_mole") {
      hole.maxHp = 2;
    } else if (kind === "bucket_mole") {
      hole.maxHp = 3;
    } else if (kind === "zombie_mole") {
      hole.maxHp = 5;
    } else if (kind === "fork_mole") {
      hole.maxHp = 1;
      hole.state = { forkUp: true }; // Starts with fork raised
      hole.el.classList.add("fork-up");
    }
    hole.hp = hole.maxHp;

    // Render initial SVG
    hole.critterEl.innerHTML = getCritterHTML(kind, { ...hole.state, hp: hole.hp });

    // Make ~80% of critters blink almost immediately on spawn
    // by using a negative animation-delay to jump into the blink keyframes
    if (kind !== "zombie_mole" && Math.random() < 0.8) {
      const eyes = hole.critterEl.querySelectorAll('.critter-eye');
      // Blink happens at 88-97% of 2.5s cycle = ~2.2s-2.425s
      // A negative delay of -2.15s to -2.25s starts them right at the blink
      const delay = -(2.15 + Math.random() * 0.1);
      eyes.forEach(eye => { eye.style.animationDelay = `${delay.toFixed(2)}s`; });
    }
    
    // Force browser reflow to guarantee CSS transition triggers (crucial when multiple elements render)
    const child = hole.critterEl.firstElementChild;
    if (child) void child.offsetHeight;
    
    // Pop up animation
    hole.el.classList.remove("hit");
    hole.el.classList.add("up");

    // reaction/visible time (slower at the start, accelerates after phase 5)
    let speedOffset = 0;
    if (phase <= 5) {
      speedOffset = 500 - (phase * 60); // Generous buffer that slowly decreases
    } else {
      speedOffset = -(phase - 6) * 60; // Accelerates from phase 6 to 10
    }
    const minUp = cfg.baseMinUp + speedOffset;
    const maxUp = cfg.baseMaxUp + speedOffset;
    const visibleTime = minUp + Math.random() * (maxUp - minUp);

    // Schedule hiding
    setTimeout(() => {
      if (hole.up && hole.upToken === myToken) {
        popDown(hole);
      }
    }, visibleTime);
  }

  function spawnLoop() {
    if (!running || paused || isHorde) return;

    const cfg = DIFFICULTIES[difficulty];

    // Scale maximum active critters on the board based on phase for a smoother learning curve
    const maxActiveForPhase = phase === 1 ? 1 : (phase <= 3 ? Math.min(cfg.maxActive, 2) : cfg.maxActive);

    // Check if we hit the limit of concurrent moles
    if (activeCritterCount >= maxActiveForPhase) {
      // Re-schedule soon
      spawnTimeoutId = setTimeout(spawnLoop, 200);
      return;
    }

    // Determine how many critters to spawn in this tick (1, 2, or 3)
    let amountToSpawn = 1;
    
    // Determine chances based on Phase (more concurrent spawns in later phases)
    let multiSpawnChance = 0.05;
    let tripleSpawnChance = 0;
    
    if (phase === 2) {
      multiSpawnChance = 0.15;
    } else if (phase === 3) {
      multiSpawnChance = 0.25;
      tripleSpawnChance = 0.05;
    } else if (phase === 4) {
      multiSpawnChance = 0.30;
      tripleSpawnChance = 0.08;
    } else if (phase === 5) {
      multiSpawnChance = 0.35;
      tripleSpawnChance = 0.12;
    } else if (phase === 6) {
      multiSpawnChance = 0.40;
      tripleSpawnChance = 0.15;
    } else if (phase >= 7) {
      multiSpawnChance = 0.45;
      tripleSpawnChance = 0.20;
    }
    
    const roll = Math.random();
    if (roll < tripleSpawnChance) {
      amountToSpawn = 3;
    } else if (roll < multiSpawnChance + tripleSpawnChance) {
      amountToSpawn = 2;
    }
    
    // Spawn the determined amount of critters with a small staggered delay
    for (let i = 0; i < amountToSpawn; i++) {
      if (activeCritterCount >= maxActiveForPhase) break;
      
      const idx = randomFreeHoleIndex();
      if (idx === -1) break;
      
      const hole = holes[idx];
      
      // Reserve the hole synchronously
      hole.up = true;
      hole.upToken += 1;
      activeCritterCount++;
      
      // Stagger actual visual spawn (0ms, 180ms, 360ms)
      const staggerDelay = i * 180;
      
      setTimeout(() => {
        if (!running || paused || isHorde) {
          // If the game ended or paused before the timeout fired, release the hole
          if (hole.up) {
            hole.up = false;
            hole.kind = null;
            if (activeCritterCount > 0) activeCritterCount--;
          }
          return;
        }
        
        spawnSingleCritterAt(hole, cfg);
      }, staggerDelay);
    }

    // Schedule next spawn delay
    const delay = cfg.spawnDelayMin + Math.random() * (cfg.spawnDelayMax - cfg.spawnDelayMin);
    spawnTimeoutId = setTimeout(spawnLoop, delay);
  }

  // Fork mole toggle loop
  function startForkMoleLoop() {
    if (forkIntervalId) clearInterval(forkIntervalId);
    
    forkIntervalId = setInterval(() => {
      if (!running || paused) return;
      
      holes.forEach(hole => {
        if (hole.up && hole.kind === "fork_mole" && hole.hp > 0) {
          hole.state.forkUp = !hole.state.forkUp;
          if (hole.state.forkUp) {
            hole.el.classList.add("fork-up");
          } else {
            hole.el.classList.remove("fork-up");
          }
        }
      });
    }, 700);
  }

  /* =========================================================================
     HORDE MECHANIC (End of Phase)
     ========================================================================= */

  function startHorde() {
    isHorde = true;
    clearTimeout(spawnTimeoutId);
    spawnTimeoutId = null;
    
    // Reset horde tracking variables
    hordeSpawnedCount = 0;
    
    // Scale spawn count: increase intensity in later phases (Phase 6+)
    hordeTotalToSpawn = difficulty === "facil" ? 5 : (difficulty === "normal" ? 6 : 8);
    if (phase >= 6) {
      if (difficulty === "facil") hordeTotalToSpawn = 6;
      else if (difficulty === "normal") hordeTotalToSpawn = 8;
      else hordeTotalToSpawn = 9; // Fill the entire board on hard!
    }
    
    // Show banner
    hordeWarning.hidden = false;
    playSFX("horde_warning");

    // Vibration warning
    if (navigator.vibrate) navigator.vibrate([150, 100, 150]);

    if (hordeWarningTimeoutId) clearTimeout(hordeWarningTimeoutId);
    hordeWarningTimeoutId = setTimeout(() => {
      hordeWarning.hidden = true;
      hordeWarningTimeoutId = null;
      if (!running || paused) return;
      
      executeHordeSpawning();
    }, 1800);
  }

  function executeHordeSpawning() {
    if (hordeSpawningIntervalId) clearInterval(hordeSpawningIntervalId);
    
    hordeSpawningIntervalId = setInterval(() => {
      if (!running || paused) {
        clearInterval(hordeSpawningIntervalId);
        hordeSpawningIntervalId = null;
        return;
      }

      if (hordeSpawnedCount >= hordeTotalToSpawn) {
        clearInterval(hordeSpawningIntervalId);
        hordeSpawningIntervalId = null;
        // Wait for all to hide or be hit to resolve phase completion
        checkHordeClear();
        return;
      }

      const idx = randomFreeHoleIndex();
      if (idx !== -1) {
        const hole = holes[idx];
        const kind = pickCritterKind(phase);

        hole.up = true;
        hole.kind = kind;
        hole.upToken += 1;
        hole.state = {}; // Reset state
        
        // Remove left-over fork classes if any
        hole.el.classList.remove("fork-up");

        // Set HPs & state matching normal spawn loop rules
        if (kind === "mole" || kind === "erizo" || kind === "disguise_mole" || kind === "bubble_heart" || kind === "bubble_hammer") {
          hole.maxHp = 1;
        } else if (kind === "helmet_mole") {
          hole.maxHp = 2;
        } else if (kind === "bucket_mole") {
          hole.maxHp = 3;
        } else if (kind === "zombie_mole") {
          hole.maxHp = 5;
        } else if (kind === "fork_mole") {
          hole.maxHp = 1;
          hole.state = { forkUp: true }; // Starts with fork raised
          hole.el.classList.add("fork-up");
        }
        
        hole.hp = hole.maxHp;
        hole.critterEl.innerHTML = getCritterHTML(kind, { ...hole.state, hp: hole.hp });

        // Force browser reflow to guarantee CSS transition triggers (crucial in fast-spawning Horde Mode)
        const child = hole.critterEl.firstElementChild;
        if (child) void child.offsetHeight;

        hole.el.classList.remove("hit");
        hole.el.classList.add("up");

        const myToken = hole.upToken;
        setTimeout(() => {
          if (hole.up && hole.upToken === myToken) {
            popDown(hole);
          }
        }, 2200);

        hordeSpawnedCount++;
      }
    }, 220);
  }

  function checkHordeClear() {
    if (hordeClearIntervalId) clearInterval(hordeClearIntervalId);
    
    hordeClearIntervalId = setInterval(() => {
      if (!running || paused) {
        clearInterval(hordeClearIntervalId);
        hordeClearIntervalId = null;
        return;
      }

      // Check if any holes are still up
      const anyActive = holes.some(h => h.up);
      if (!anyActive) {
        clearInterval(hordeClearIntervalId);
        hordeClearIntervalId = null;
        resolvePhaseClear();
      }
    }, 300);
  }

  function resolvePhaseClear() {
    isHorde = false;
    
    // Play sound
    playSFX("victory_chime");
    
    showToast(`¡Fase ${phase} Superada!`);

    phase++;
    
    if (phase > 10) {
      endGame(true); // Victory!
    } else {
      phaseHits = 0;
      updateHud();
      // Restart normal spawn loop
      spawnLoop();
    }
  }

  /* =========================================================================
     INTERACTION & HIT DETECTION
     ========================================================================= */

  function onHolePointerDown(e) {
    if (!running || paused) return;

    // Trigger cursor swinging/clicking SFX
    playSFX("swing");

    const index = Number(e.currentTarget.dataset.index);
    const hole = holes[index];
    
    if (!hole.up || hole.hp <= 0) {
      // Missed click: resets combo
      resetCombo();
      return;
    }

    const kind = hole.kind;
    const now = Date.now();

    // 1. ERIZO HIT (Obstacle)
    if (kind === "erizo") {
      lives = Math.max(0, lives - 1);
      resetCombo();
      shakeBoard();
      showBurst(hole, ["💢", "💨"]);
      showScorePop(hole, "¡OUCH! -1 Vida", "#ff3838");
      playSFX("hit_erizo");
      if (navigator.vibrate) navigator.vibrate([80, 50, 100]);
      
      popDown(hole);
      updateHud();
      
      if (lives <= 0) endGame(false);
      return;
    }

    // 2. FORK MOLE HIT (Fork block check)
    if (kind === "fork_mole" && hole.state.forkUp) {
      // Blocked!
      lives = Math.max(0, lives - 1);
      resetCombo();
      shakeBoard();
      showBurst(hole, ["💥", "🛡️"]);
      showScorePop(hole, "¡BLOQUEADO! -1 Vida", "#ffa8a8");
      playSFX("fork_block");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      
      updateHud();
      if (lives <= 0) endGame(false);
      return;
    }

    // 3. MULTI-HIT TARGETS HP REDUCTION
    hole.hp--;

    // 4. DAMAGE HIT EFFECTS (Not yet dead)
    if (hole.hp > 0) {
      if (kind === "helmet_mole") {
        showBurst(hole, ["⚙️"]);
        showScorePop(hole, "¡CASCO!", "#ffffff");
        playSFX("helmet_ting");
        hole.critterEl.innerHTML = getCritterHTML(kind, { ...hole.state, hp: hole.hp }); // Renders without helmet
      } 
      else if (kind === "bucket_mole") {
        showBurst(hole, ["💥"]);
        showScorePop(hole, "¡ABOLLADO!", "#ffffff");
        playSFX("bucket_clonk");
        hole.critterEl.innerHTML = getCritterHTML(kind, { ...hole.state, hp: hole.hp }); // Renders dented bucket
      }
      else if (kind === "zombie_mole") {
        showBurst(hole, ["☠️", "💥"]);
        const pointsGained = 10 * multiplier;
        score += pointsGained;
        showScorePop(hole, `+${pointsGained}`, "#cfd8dc");
        playSFX("hit_mole");
        hole.critterEl.innerHTML = getCritterHTML(kind, { ...hole.state, hp: hole.hp }); // More cracks
        updateHud();
      }
      if (navigator.vibrate) navigator.vibrate(15);
      return;
    }

    // 5. DEFEATED CRITTER CODE (HP reached 0)
    hole.upToken += 1; // Block further timers
    hole.el.classList.add("hit");
    
    // Visual Particles Burst
    if (kind === "bubble_heart") {
      showBurst(hole, ["🫧", "❤️", "✨"]);
      lives = Math.min(MAX_LIVES, lives + 1);
      showScorePop(hole, "+1 Vida", "#ff7675");
      playSFX("bubble_pop");
    } 
    else if (kind === "bubble_hammer") {
      showBurst(hole, ["🫧", "🔨", "✨"]);
      playSFX("bubble_pop");
      executeMegaHammer();
    }
    else {
      // Standard Mole defeat
      let basePoints = 10;
      let particleType = ["💫", "💨"];

      if (kind === "disguise_mole") {
        basePoints = 15;
        particleType = ["💥", "🐹"];
      } else if (kind === "helmet_mole") {
        basePoints = 25;
      } else if (kind === "bucket_mole") {
        basePoints = 35;
      } else if (kind === "zombie_mole") {
        basePoints = 50; // Big bonus
        particleType = ["💀", "🌟", "✨"];
      }

      const pointsGained = basePoints * multiplier;
      score += pointsGained;
      showScorePop(hole, `+${pointsGained}`, "#ffd043");
      showBurst(hole, particleType);
      playSFX("hit_mole");

      // Register hit in Phase Goals (only moles count)
      if (!isHorde) {
        phaseHits++;
        const target = PHASE_GOALS[phase - 1] || 15;
        if (phaseHits >= target) {
          // Triggers Horde!
          startHorde();
        }
      }

      // Progress Combo
      combo++;
      const prevMult = multiplier;
      multiplier = Math.min(5, 1 + Math.floor(combo / 5));
      if (multiplier > prevMult) {
        playSFX("victory_chime");
        showToast(`¡Combo x${multiplier}!`);
      }
    }

    if (navigator.vibrate) navigator.vibrate(20);

    popDown(hole);
    updateHud();
  }

  function executeMegaHammer() {
    playSFX("horde_warning"); // heavy sound
    shakeBoard();

    // Iterate board and defeat all active moles
    holes.forEach(hole => {
      if (hole.up && hole.kind !== "erizo" && hole.kind !== "bubble_hammer") {
        // Instantly crush
        hole.hp = 0;
        hole.upToken += 1;
        hole.el.classList.add("hit");
        
        let basePoints = 10;
        if (hole.kind === "disguise_mole") basePoints = 15;
        else if (hole.kind === "helmet_mole") basePoints = 25;
        else if (hole.kind === "bucket_mole") basePoints = 35;
        else if (hole.kind === "zombie_mole") basePoints = 50;

        const points = basePoints * multiplier;
        score += points;

        showScorePop(hole, `+${points}`, "#ffd043");
        showBurst(hole, ["💥", "🔨"]);

        if (!isHorde) {
          phaseHits++;
        }

        popDown(hole);
      }
    });

    const target = PHASE_GOALS[phase - 1] || 15;
    if (!isHorde && phaseHits >= target) {
      startHorde();
    }

    updateHud();
  }

  function resetCombo() {
    combo = 0;
    multiplier = 1;
    updateHud();
  }

  /* =========================================================================
     VISUAL EFFECTS & UI HELPERS
     ========================================================================= */

  function showBurst(hole, emojis) {
    const burst = document.createElement("div");
    burst.className = "burst";
    emojis.forEach(emoji => {
      const span = document.createElement("span");
      span.textContent = emoji;
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 40;
      span.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      span.style.setProperty("--dy", `${Math.sin(angle) * dist - 8}px`);
      span.style.setProperty("--rot", `${(Math.random() * 2 - 1) * 110}deg`);
      burst.appendChild(span);
    });
    hole.el.appendChild(burst);
    setTimeout(() => burst.remove(), 550);
  }

  function showScorePop(hole, text, color) {
    const pop = document.createElement("div");
    pop.className = "score-pop";
    pop.textContent = text;
    if (color) pop.style.color = color;
    hole.el.appendChild(pop);
    setTimeout(() => pop.remove(), 700);
  }

  function shakeBoard() {
    board.classList.remove("shake");
    void board.offsetWidth; // Reflow
    board.classList.add("shake");
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toastEl.hidden = true; }, 2000);
  }

  function renderLives() {
    let html = "";
    // Display hearts
    for (let i = 0; i < MAX_LIVES; i++) {
      html += `<span class="heart">${i < lives ? "❤️" : "🤍"}</span>`;
    }
    livesEl.innerHTML = html;
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    renderLives();
    
    // Progress Bar
    const target = PHASE_GOALS[phase - 1] || 15;
    phaseIndicator.textContent = `Fase ${phase}/10`;
    const pct = Math.min(100, (phaseHits / target) * 100);
    phaseProgress.style.width = `${pct}%`;

    // Multiplier combo
    if (multiplier > 1) {
      comboBadge.hidden = false;
      comboBadge.querySelector("span").textContent = `x${multiplier}`;
    } else {
      comboBadge.hidden = true;
    }
  }

  /* =========================================================================
     GAME STATE CONTROLS
     ========================================================================= */

  function startGame() {
    initAudio();
    if (actx && actx.state === "suspended") actx.resume();

    stopMenuCritterLoop(); // Stop interactive main menu loop

    // Reset game state
    running = true;
    paused = false;
    score = 0;
    lives = MAX_LIVES;
    phase = 1;
    phaseHits = 0;
    isHorde = false;
    
    resetCombo();

    // Hide menus & overlays
    menuScreen.classList.remove("active");
    gameContainer.classList.add("active");
    
    instructionsOverlay.hidden = true;
    settingsOverlay.hidden = true;
    pauseOverlay.hidden = true;
    endOverlay.hidden = true;

    buildBoard();
    updateHud();
    startMusic("game");
    
    // Launch Spawn loops
    spawnLoop();
    startForkMoleLoop();
  }

  function pauseGame() {
    if (!running || paused) return;
    paused = true;
    pauseOverlay.hidden = false;
    stopMusic();
    
    // Clear the active spawn loop timer to prevent duplicate parallel loops on resume
    if (spawnTimeoutId) {
      clearTimeout(spawnTimeoutId);
      spawnTimeoutId = null;
    }

    // Clear horde timers to prevent execution during pause
    if (hordeWarningTimeoutId) {
      clearTimeout(hordeWarningTimeoutId);
      hordeWarningTimeoutId = null;
    }
    if (hordeSpawningIntervalId) {
      clearInterval(hordeSpawningIntervalId);
      hordeSpawningIntervalId = null;
    }
    if (hordeClearIntervalId) {
      clearInterval(hordeClearIntervalId);
      hordeClearIntervalId = null;
    }
    
    // Smoothly pop down all currently visible critters and reset the active count
    holes.forEach(popDown);
    activeCritterCount = 0;
  }

  function resumeGame() {
    if (!running || !paused) return;
    paused = false;
    pauseOverlay.hidden = true;
    startMusic("game");
    
    if (isHorde) {
      hordeWarning.hidden = true; // Ensure banner hides
      
      // Resume horde based on how many have spawned
      if (hordeSpawnedCount < hordeTotalToSpawn) {
        executeHordeSpawning();
      } else {
        checkHordeClear();
      }
    } else {
      // Clean start of the spawn loop
      spawnLoop();
    }
  }

  function quitToMenu() {
    running = false;
    paused = false;
    clearTimeout(spawnTimeoutId);
    spawnTimeoutId = null;
    clearInterval(forkIntervalId);
    forkIntervalId = null;
    stopMusic();

    // Clear horde timers
    if (hordeWarningTimeoutId) {
      clearTimeout(hordeWarningTimeoutId);
      hordeWarningTimeoutId = null;
    }
    if (hordeSpawningIntervalId) {
      clearInterval(hordeSpawningIntervalId);
      hordeSpawningIntervalId = null;
    }
    if (hordeClearIntervalId) {
      clearInterval(hordeClearIntervalId);
      hordeClearIntervalId = null;
    }
    hordeWarning.hidden = true;
    
    holes.forEach(popDown);
    
    gameContainer.classList.remove("active");
    menuScreen.classList.add("active");
    
    pauseOverlay.hidden = true;
    endOverlay.hidden = true;
    
    updateMainHighscoreLabel();
    startMusic("menu");
    startMenuCritterLoop(); // Restart menu interactive loop
  }

  function endGame(victory) {
    running = false;
    paused = false;
    clearTimeout(spawnTimeoutId);
    spawnTimeoutId = null;
    clearInterval(forkIntervalId);
    forkIntervalId = null;
    stopMusic();

    // Clear horde timers
    if (hordeWarningTimeoutId) {
      clearTimeout(hordeWarningTimeoutId);
      hordeWarningTimeoutId = null;
    }
    if (hordeSpawningIntervalId) {
      clearInterval(hordeSpawningIntervalId);
      hordeSpawningIntervalId = null;
    }
    if (hordeClearIntervalId) {
      clearInterval(hordeClearIntervalId);
      hordeClearIntervalId = null;
    }
    hordeWarning.hidden = true;
    
    holes.forEach(popDown);

    // Check highscores
    const scores = getHighscores();
    const isNewRecord = scores.length === 0 || score > scores[0].score;
    
    saveHighscore(score);
    submitScoreToLeaderboard(score);
    updateMainHighscoreLabel();
    renderProfileUI();

    // Chime
    if (victory) {
      playSFX("victory_chime");
      endTitle.textContent = "🏆 ¡VICTORIA TOTAL! 🏆";
      endTitle.style.color = "var(--gold)";
    } else {
      playSFX("gameover_chime");
      endTitle.textContent = "¡Juego terminado!";
      endTitle.style.color = "#ff3838";
    }

    finalScoreEl.textContent = String(score);
    newRecordEl.hidden = !isNewRecord;
    
    endOverlay.hidden = false;
  }

  /* =========================================================================
     INSTRUCTIONS TABLET CAROUSEL NAVIGATION
     ========================================================================= */

  let currentHelpPage = 1;
  const maxHelpPage = 4;

  function showHelpPage(pageNum) {
    currentHelpPage = pageNum;
    
    // Hide all pages
    const pages = document.querySelectorAll(".tablet-page");
    pages.forEach(p => p.classList.remove("active"));

    // Show active page
    const activePage = document.querySelector(`.tablet-page[data-page="${pageNum}"]`);
    if (activePage) activePage.classList.add("active");

    // Nav controls
    helpPrev.disabled = currentHelpPage === 1;
    helpNext.disabled = currentHelpPage === maxHelpPage;
    helpPageNum.textContent = `${currentHelpPage}/${maxHelpPage}`;
  }

  /* =========================================================================
     EVENT LISTENERS & BINDINGS
     ========================================================================= */

  // Mouse move event for custom hammer cursor
  document.addEventListener("mousemove", (e) => {
    hammerCursor.style.left = `${e.clientX}px`;
    hammerCursor.style.top = `${e.clientY}px`;
  });

  document.addEventListener("pointerdown", () => {
    hammerCursor.classList.remove("swinging");
    void hammerCursor.offsetWidth; // Reflow
    hammerCursor.classList.add("swinging");
    
    // Remove class after strike animation completes
    setTimeout(() => hammerCursor.classList.remove("swinging"), 150);
  });

  btnPlay.addEventListener("click", startGame);
  
  btnSettings.addEventListener("click", () => {
    loadSettings();
    settingsOverlay.hidden = false;
  });
  settingsClose.addEventListener("click", () => {
    settingsOverlay.hidden = true;
  });

  btnHelp.addEventListener("click", () => {
    showHelpPage(1);
    instructionsOverlay.hidden = false;
  });
  helpClose.addEventListener("click", () => {
    instructionsOverlay.hidden = true;
  });
  helpPlayBtn.addEventListener("click", startGame);

  helpPrev.addEventListener("click", () => {
    if (currentHelpPage > 1) showHelpPage(currentHelpPage - 1);
  });
  helpNext.addEventListener("click", () => {
    if (currentHelpPage < maxHelpPage) showHelpPage(currentHelpPage + 1);
  });

  if (rankScrollUp && leaderboardList) {
    rankScrollUp.addEventListener("click", () => {
      leaderboardList.scrollBy({ top: -45, behavior: "smooth" });
    });
  }
  if (rankScrollDown && leaderboardList) {
    rankScrollDown.addEventListener("click", () => {
      leaderboardList.scrollBy({ top: 45, behavior: "smooth" });
    });
  }

  // --- MOBILE PORTRAIT MODALS CONTROLLERS ---
  const closeAllModals = () => {
    if (profileCard) profileCard.classList.remove("show-modal");
    if (miniLeaderboardCard) miniLeaderboardCard.classList.remove("show-modal");
    if (modalBackdrop) modalBackdrop.hidden = true;
  };

  if (mobileProfileBtn && profileCard && modalBackdrop) {
    mobileProfileBtn.addEventListener("click", () => {
      profileCard.classList.add("show-modal");
      modalBackdrop.hidden = false;
    });
  }

  if (mobileRankBtn && miniLeaderboardCard && modalBackdrop) {
    mobileRankBtn.addEventListener("click", () => {
      miniLeaderboardCard.classList.add("show-modal");
      modalBackdrop.hidden = false;
      fetchLeaderboard();
    });
  }

  if (btnCloseProfileModal) {
    btnCloseProfileModal.addEventListener("click", closeAllModals);
  }

  if (btnCloseRankModal) {
    btnCloseRankModal.addEventListener("click", closeAllModals);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", closeAllModals);
  }

  btnEditProfile.addEventListener("click", () => {
    profileViewMode.hidden = true;
    profileEditMode.hidden = false;
    inputProfileName.value = playerName;
    selectedAvatarIndex = AVATAR_LIST.indexOf(playerAvatar);
    if (selectedAvatarIndex === -1) selectedAvatarIndex = 0;
    avatarCurrentOption.innerHTML = getAvatarSVG(AVATAR_LIST[selectedAvatarIndex]);
  });

  avatarPrev.addEventListener("click", () => {
    selectedAvatarIndex = (selectedAvatarIndex - 1 + AVATAR_LIST.length) % AVATAR_LIST.length;
    avatarCurrentOption.innerHTML = getAvatarSVG(AVATAR_LIST[selectedAvatarIndex]);
  });
  avatarNext.addEventListener("click", () => {
    selectedAvatarIndex = (selectedAvatarIndex + 1) % AVATAR_LIST.length;
    avatarCurrentOption.innerHTML = getAvatarSVG(AVATAR_LIST[selectedAvatarIndex]);
  });

  btnSaveProfile.addEventListener("click", () => {
    const nameVal = inputProfileName.value.trim();
    if (!nameVal) {
      showToast("¡El nombre no puede estar vacío!");
      return;
    }
    if (nameVal.includes("|") || nameVal.includes("*")) {
      showToast("Caracteres | y * no permitidos.");
      return;
    }
    
    profileEditMode.hidden = true;
    profileViewMode.hidden = false;
    
    changeProfile(nameVal, AVATAR_LIST[selectedAvatarIndex]);
    showToast("Perfil guardado.");
    closeAllModals();
  });

  // Settings Toggles
  toggleMusic.addEventListener("click", () => {
    mutedMusic = !mutedMusic;
    localStorage.setItem(MUSIC_MUTE_KEY, mutedMusic ? "1" : "0");
    toggleMusic.textContent = mutedMusic ? "NO" : "SÍ";
    toggleMusic.classList.toggle("active", !mutedMusic);
    
    if (musicGain) {
      musicGain.gain.setValueAtTime(mutedMusic ? 0 : 0.18, actx.currentTime);
    }
    
    if (!mutedMusic && !musicTimer && actx) {
      startMusic(running ? "game" : "menu");
    }
  });

  toggleSFX.addEventListener("click", () => {
    mutedSFX = !mutedSFX;
    localStorage.setItem(SFX_MUTE_KEY, mutedSFX ? "1" : "0");
    toggleSFX.textContent = mutedSFX ? "NO" : "SÍ";
    toggleSFX.classList.toggle("active", !mutedSFX);
    
    if (sfxGain) {
      sfxGain.gain.setValueAtTime(mutedSFX ? 0 : 0.5, actx.currentTime);
    }
  });

  diffChips.forEach(chip => {
    chip.addEventListener("click", () => {
      diffChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      saveDifficulty(chip.dataset.diff);
    });
  });

  // Pause screen events
  btnPause.addEventListener("click", pauseGame);
  btnResume.addEventListener("click", resumeGame);
  btnRestart.addEventListener("click", startGame);
  btnQuit.addEventListener("click", quitToMenu);

  // Game over events
  retryBtn.addEventListener("click", startGame);
  endQuitBtn.addEventListener("click", quitToMenu);



  /* =========================================================================
     INTERACTIVE MAIN MENU PRACTICE ZONE
     ========================================================================= */

  function startMenuCritterLoop() {
    stopMenuCritterLoop();
    
    // Spawn immediately on start, always forcing a mole variant
    spawnMenuCritter(true);
    
    // Run loop every 4.8 seconds
    menuCritterIntervalId = setInterval(() => {
      if (running || paused) return;
      spawnMenuCritter(false);
    }, 4800);
  }

  function spawnMenuCritter(forceMole) {
    const menuCritter = document.getElementById("menuCritter");
    const menuMoleContainer = document.getElementById("menuMoleContainer");
    if (!menuCritter || !menuMoleContainer) return;
    
    // Determine critter type (forced mole on start, random 30% erizo/70% mole otherwise)
    let kind = "mole";
    if (forceMole) {
      const skins = ["mole", "helmet_mole", "disguise_mole", "bucket_mole", "fork_mole", "zombie_mole"];
      kind = skins[Math.floor(Math.random() * skins.length)];
    } else {
      const roll = Math.random();
      if (roll < 0.30) {
        kind = "erizo";
      } else {
        const skins = ["mole", "helmet_mole", "disguise_mole", "bucket_mole", "fork_mole", "zombie_mole"];
        kind = skins[Math.floor(Math.random() * skins.length)];
      }
    }
    
    menuCritterKind = kind;
    menuCritterIsHit = false;
    
    // Render SVG
    const state = kind === "fork_mole" ? { forkUp: true } : { hp: 1 };
    menuCritter.innerHTML = getCritterHTML(kind, state);
    
    // Clean up classes
    menuMoleContainer.classList.remove("hit");
    menuMoleContainer.classList.remove("shake");
    menuMoleContainer.classList.remove("fork-up");
    if (kind === "fork_mole") menuMoleContainer.classList.add("fork-up");
    
    // Force browser reflow to guarantee popup transition works
    const child = menuCritter.firstElementChild;
    if (child) void child.offsetHeight;
    
    menuMoleContainer.classList.add("up");
    
    // Auto hide after 2.3 seconds
    menuCritterHideTimeoutId = setTimeout(() => {
      menuMoleContainer.classList.remove("up");
      menuMoleContainer.classList.remove("fork-up");
    }, 2300);
  }

  function stopMenuCritterLoop() {
    if (menuCritterIntervalId) clearInterval(menuCritterIntervalId);
    if (menuCritterHideTimeoutId) clearTimeout(menuCritterHideTimeoutId);
    menuCritterIntervalId = null;
    menuCritterHideTimeoutId = null;
    
    const menuMoleContainer = document.getElementById("menuMoleContainer");
    if (menuMoleContainer) {
      menuMoleContainer.classList.remove("up");
      menuMoleContainer.classList.remove("hit");
      menuMoleContainer.classList.remove("shake");
      menuMoleContainer.classList.remove("fork-up");
    }
  }

  function initMenuCritterEvents() {
    const menuCritter = document.getElementById("menuCritter");
    const menuMoleContainer = document.getElementById("menuMoleContainer");
    if (!menuCritter || !menuMoleContainer) return;
    
    menuCritter.addEventListener("pointerdown", (e) => {
      // Only clickable if active/up and not already hit
      if (!menuMoleContainer.classList.contains("up") || menuCritterIsHit) return;
      
      menuCritterIsHit = true;
      clearTimeout(menuCritterHideTimeoutId);
      
      playSFX("swing");
      
      if (menuCritterKind === "erizo") {
        playSFX("hit_erizo");
        menuMoleContainer.classList.add("shake");
        // Show burst particles (mock container with elements)
        showBurst({ el: menuMoleContainer }, ["💢", "💨"]);
      } else {
        playSFX("hit_mole");
        menuMoleContainer.classList.add("hit");
        showBurst({ el: menuMoleContainer }, ["💫", "💨"]);
        showScorePop({ el: menuMoleContainer }, "+10", "#ffd043");
      }
      
      // Force sink
      setTimeout(() => {
        menuMoleContainer.classList.remove("up");
        menuMoleContainer.classList.remove("hit");
        menuMoleContainer.classList.remove("shake");
        menuMoleContainer.classList.remove("fork-up");
      }, 380);
    });
  }

  // Initialization
  injectHelpGraphics();
  buildBoard();
  loadSettings();
  updateMainHighscoreLabel();
  renderProfileUI();
  fetchLeaderboard();
  
  // Interactive Menu Critter
  initMenuCritterEvents();
  startMenuCritterLoop();



  // Autoplay menu music on first click anywhere (Web Audio restriction workaround)
  const autoPlayCallback = () => {
    initAudio();
    if (actx && actx.state === "suspended") actx.resume();
    startMusic("menu");
    document.removeEventListener("pointerdown", autoPlayCallback);
    document.removeEventListener("click", autoPlayCallback);
  };
  document.addEventListener("pointerdown", autoPlayCallback);
  document.addEventListener("click", autoPlayCallback);

})();
