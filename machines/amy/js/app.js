(function () {
  "use strict";

  const STATE = {
    IDLE: "idle",
    COIN_INSERTED: "coinInserted",
    ROLLING: "rolling",
    CAPSULE_READY: "capsuleReady",
    OPENING: "opening",
    REVEALED: "revealed"
  };

  let state = STATE.IDLE;
  let crackCount = 0;

  // Keep a collection for guests in this browser and sync the same data to
  // the signed-in universal Kueh Machine account when one is available.
  const COLLECTION_KEY = "amy-kueh-collection";
  let collection;

  try {
    collection = JSON.parse(localStorage.getItem(COLLECTION_KEY) || "{}");
  } catch (error) {
    console.warn("[amy] invalid local collection; starting fresh:", error);
    collection = {};
  }

  function saveCollection() {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  }

  function addToCollection(kuehId) {
    const isNew = !collection[kuehId];
    collection[kuehId] = (collection[kuehId] || 0) + 1;
    saveCollection();
    pushCollectionToServer();
    return isNew;
  }

  function pushCollectionToServer() {
    const user = window.KuehAccount.getUser();
    if (!user) return;

    window.KuehAccount.ready
      .then((client) =>
        client.from("amy_collection").upsert({
          user_id: user.id,
          data: collection,
          updated_at: new Date().toISOString()
        })
      )
      .catch((error) => console.warn("[amy] collection sync failed:", error));
  }

  // Merge by highest reveal count so signing in on either an old or a fresh
  // browser never discards progress from the browser or the account.
  function syncCollectionFromServer() {
    const user = window.KuehAccount.getUser();
    if (!user) return;

    window.KuehAccount.ready
      .then((client) =>
        client
          .from("amy_collection")
          .select("data")
          .eq("user_id", user.id)
          .maybeSingle()
      )
      .then((result) => {
        const serverCollection = (result && result.data && result.data.data) || {};
        let localChanged = false;
        let serverBehind = false;

        Object.keys(serverCollection).forEach((id) => {
          if ((collection[id] || 0) < serverCollection[id]) {
            collection[id] = serverCollection[id];
            localChanged = true;
          }
        });
        Object.keys(collection).forEach((id) => {
          if (collection[id] > (serverCollection[id] || 0)) serverBehind = true;
        });

        if (localChanged) saveCollection();
        if (localChanged || serverBehind) pushCollectionToServer();
      })
      .catch((error) => console.warn("[amy] collection fetch failed:", error));
  }

  window.KuehAccount.ready.then(() => {
    if (window.KuehAccount.getUser()) syncCollectionFromServer();
  });
  window.KuehAccount.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") syncCollectionFromServer();
  });

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const KNOB_DURATION = prefersReducedMotion ? 0 : 1100;
  const SHAKE_DURATION = prefersReducedMotion ? 120 : 500;
  const CAPSULE_OPEN_FRAME_DELAY = prefersReducedMotion ? 30 : 210;

  const CAPSULE_COLORS = ["capsule-blue", "capsule-gold", "capsule-red"];
  const CAPSULE_COLOR_HEX = {
    "capsule-blue": "#758CA3",
    "capsule-gold": "#BCA076",
    "capsule-red": "#DD7B68"
  };
  const CAPSULE_KUEH_SCALE = [0, 0.5, 0.8, 1];
  const KNOB_FRAME_COUNT = 25;

  let currentKueh = null;
  let currentCapsuleColor = CAPSULE_COLORS[0];
  let handsExitTimer = null;
  let holdingCoin = false;
  let coinFallTimer = null;
  let currentKnobFrame = 1;
  let knobTurnTimer = null;
  let turnCount = 0;

  const KNOB_TURN_STAGES = 3;

  let audioCtx = null;

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playKnobTurnSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const clickCount = 4;
    const clickSpacing = 0.055;

    for (let i = 0; i < clickCount; i++) {
      const t = ctx.currentTime + i * clickSpacing;

      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(850 - i * 30, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  function playCoinDropSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    function ting(time, freq, peakGain, duration) {
      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, time);

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 1.5 + 8, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(time);
      osc1.stop(time + duration + 0.02);
      osc2.start(time);
      osc2.stop(time + duration + 0.02);
    }

    const now = ctx.currentTime;
    ting(now, 1600, 0.28, 0.18);
    ting(now + 0.09, 1300, 0.14, 0.14);
    ting(now + 0.17, 1050, 0.08, 0.12);
  }

  function createNoiseBuffer(ctx, duration) {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function playCapsuleShakeSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const rattleCount = 6;

    for (let i = 0; i < rattleCount; i++) {
      const t = now + i * 0.045 + Math.random() * 0.015;
      const duration = 0.03 + Math.random() * 0.02;

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, duration);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1800 + Math.random() * 1200;
      filter.Q.value = 1.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(t);
      noise.stop(t + duration + 0.01);
    }
  }

  // --- Synthesized lofi background music (soft chord pad + tape hiss) ---
  // Kept deliberately quiet so it sits under the coin/knob/capsule sound effects.
  const AMBIENT_CHORDS = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [196.0, 246.94, 293.66, 349.23] // G7
  ];
  const AMBIENT_CHORD_HOLD = 2.6;
  const AMBIENT_NOTE_ATTACK = 0.5;
  const AMBIENT_NOTE_RELEASE = 1.2;
  const AMBIENT_NOTE_PEAK = 0.035;
  const AMBIENT_PAD_FILTER_FREQ = 1400;
  const AMBIENT_HISS_GAIN = 0.01;
  const AMBIENT_HISS_FREQ = 2200;
  const AMBIENT_FADE_IN = 0.8;
  const AMBIENT_FADE_OUT = 0.5;

  let ambientEnabled = true;
  let ambientRunning = false;
  let ambientMasterGain = null;
  let ambientNoiseSource = null;
  let ambientChordTimer = null;
  let ambientChordIndex = 0;

  function playPadChord(freqs) {
    const ctx = audioCtx;
    if (!ctx || !ambientMasterGain) return;

    const t0 = ctx.currentTime;
    const attackEnd = t0 + AMBIENT_NOTE_ATTACK;
    const holdEnd = t0 + AMBIENT_CHORD_HOLD;
    const releaseEnd = holdEnd + AMBIENT_NOTE_RELEASE;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(AMBIENT_PAD_FILTER_FREQ, t0);
    filter.connect(ambientMasterGain);

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t0);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(AMBIENT_NOTE_PEAK, attackEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(t0);
      osc.stop(releaseEnd + 0.05);
    });
  }

  function scheduleNextChord() {
    if (!ambientRunning) return;
    playPadChord(AMBIENT_CHORDS[ambientChordIndex]);
    ambientChordIndex = (ambientChordIndex + 1) % AMBIENT_CHORDS.length;
    ambientChordTimer = window.setTimeout(scheduleNextChord, AMBIENT_CHORD_HOLD * 1000);
  }

  function startAmbient() {
    if (ambientRunning || !ambientEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    ambientRunning = true;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + AMBIENT_FADE_IN);
    masterGain.connect(ctx.destination);
    ambientMasterGain = masterGain;

    const hiss = ctx.createBufferSource();
    hiss.buffer = createNoiseBuffer(ctx, 2);
    hiss.loop = true;

    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = "bandpass";
    hissFilter.frequency.setValueAtTime(AMBIENT_HISS_FREQ, ctx.currentTime);
    hissFilter.Q.value = 0.7;

    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(AMBIENT_HISS_GAIN, ctx.currentTime);

    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(masterGain);
    hiss.start();
    ambientNoiseSource = hiss;

    ambientChordIndex = 0;
    scheduleNextChord();
  }

  function stopAmbient() {
    if (!ambientRunning) return;
    ambientRunning = false;

    if (ambientChordTimer !== null) {
      window.clearTimeout(ambientChordTimer);
      ambientChordTimer = null;
    }

    const ctx = audioCtx;
    const gainNode = ambientMasterGain;
    const noiseSource = ambientNoiseSource;
    ambientMasterGain = null;
    ambientNoiseSource = null;

    if (ctx && gainNode) {
      gainNode.gain.cancelScheduledValues(ctx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + AMBIENT_FADE_OUT);
    }

    window.setTimeout(() => {
      if (noiseSource) {
        try {
          noiseSource.stop();
        } catch (err) {
          /* already stopped */
        }
      }
      if (gainNode) gainNode.disconnect();
    }, AMBIENT_FADE_OUT * 1000 + 50);
  }

  function setAmbientEnabled(enabled) {
    ambientEnabled = enabled;
    soundToggle.setAttribute("aria-pressed", String(enabled));
    soundToggle.setAttribute(
      "aria-label",
      enabled ? "Mute machine sounds" : "Unmute machine sounds"
    );
    if (enabled) {
      startAmbient();
    } else {
      stopAmbient();
    }
  }

  function bootstrapAmbientOnGesture(event) {
    if (soundToggle.contains(event.target)) return;
    if (ambientEnabled) startAmbient();
  }

  const HANDS_AUTO_DISMISS_DELAY = 4000;
  const HANDS_EXIT_DURATION = 500;
  const COIN_SPIN_DURATION = 800;
  const COIN_SPIN_ONCE_DURATION = 400;
  const COIN_BOUNCE_DURATION = 900;
  const COIN_FALL_FRAME_COUNT = 13;
  const COIN_FALL_DURATION = prefersReducedMotion ? 0 : 480;

  const machine = document.getElementById("machine");
  const capsuleBtn = document.getElementById("capsuleBtn");
  const capsuleUse = document.getElementById("capsuleUse");
  const capsuleInnerLayer = document.getElementById("capsuleInnerLayer");
  const capsuleFrontLayer = document.getElementById("capsuleFrontLayer");
  const capsuleKuehWrap = document.getElementById("capsuleKuehWrap");
  const capsuleKuehImg = document.getElementById("capsuleKuehImg");
  const microcopy = document.getElementById("microcopy");
  const coinBtn = document.getElementById("coinBtn");
  const coinBowl = document.getElementById("coinBowl");
  const coinInsert = document.getElementById("coinInsert");
  const coinDrop = document.getElementById("coinDrop");
  const coinDropFrameUse = document.getElementById("coinDropFrameUse");
  const cursorCoin = document.getElementById("cursorCoin");
  const knobBtn = document.getElementById("knobBtn");
  const knobFrameUse = document.getElementById("knobFrameUse");
  const revealView = document.getElementById("revealView");
  const kuehArt = document.getElementById("kuehArt");
  const kuehPlushie = document.getElementById("kuehPlushie");
  const kuehHands = document.getElementById("kuehHands");
  const spinCoinBadge = document.getElementById("spinCoinBadge");
  const coinSpinInner = document.getElementById("coinSpinInner");
  const kuehName = document.getElementById("kuehName");
  const kuehNameZh = document.getElementById("kuehNameZh");
  const kuehNameJa = document.getElementById("kuehNameJa");
  const kuehDesc = document.getElementById("kuehDesc");
  const kuehTaste = document.getElementById("kuehTaste");
  const kuehHistory = document.getElementById("kuehHistory");
  const againBtn = document.getElementById("againBtn");
  const soundToggle = document.getElementById("soundToggle");

  function setMicrocopy(text) {
    microcopy.textContent = text;
  }

  function insertCoin() {
    if (state !== STATE.IDLE) return;
    state = STATE.COIN_INSERTED;
    coinBtn.disabled = true;
    coinBtn.classList.add("inserted");
    knobBtn.disabled = false;
    setMicrocopy("Now turn the knob!");
  }

  function positionCursorCoin(x, y) {
    cursorCoin.style.left = `${x}px`;
    cursorCoin.style.top = `${y}px`;
  }

  function isPointOverCoinInsert(x, y) {
    const rect = coinInsert.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function onCoinDragMove(event) {
    positionCursorCoin(event.clientX, event.clientY);
  }

  function playCoinFallAnimation() {
    if (coinFallTimer !== null) {
      window.clearInterval(coinFallTimer);
      coinFallTimer = null;
    }

    coinDropFrameUse.setAttribute("href", "#coin-fall-frame-1");
    coinDrop.classList.add("show");

    if (prefersReducedMotion) {
      window.setTimeout(() => {
        coinDrop.classList.remove("show");
        coinDropFrameUse.setAttribute("href", "#coin-fall-frame-1");
      }, 200);
      return;
    }

    const frameDuration = COIN_FALL_DURATION / COIN_FALL_FRAME_COUNT;
    let step = 0;

    coinFallTimer = window.setInterval(() => {
      step += 1;

      if (step >= COIN_FALL_FRAME_COUNT) {
        window.clearInterval(coinFallTimer);
        coinFallTimer = null;
        coinDrop.classList.remove("show");
        coinDropFrameUse.setAttribute("href", "#coin-fall-frame-1");
        return;
      }

      coinDropFrameUse.setAttribute("href", `#coin-fall-frame-${step + 1}`);
    }, frameDuration);
  }

  function onCoinDragEnd(event) {
    if (!holdingCoin) return;

    window.removeEventListener("pointermove", onCoinDragMove);
    window.removeEventListener("pointerup", onCoinDragEnd);
    window.removeEventListener("pointercancel", onCoinDragEnd);

    holdingCoin = false;
    document.body.classList.remove("holding-coin");
    cursorCoin.classList.remove("show");
    positionCursorCoin(event.clientX, event.clientY);

    if (isPointOverCoinInsert(event.clientX, event.clientY)) {
      playCoinFallAnimation();
      playCoinDropSound();
      insertCoin();
    } else {
      cursorCoin.classList.add("bounce");
      window.setTimeout(() => {
        cursorCoin.classList.remove("bounce");
      }, COIN_BOUNCE_DURATION);
    }
  }

  function startCoinDrag(event) {
    if (holdingCoin) return;
    event.preventDefault();

    holdingCoin = true;
    document.body.classList.add("holding-coin");
    cursorCoin.classList.remove("bounce");
    cursorCoin.classList.add("show");
    positionCursorCoin(event.clientX, event.clientY);

    window.addEventListener("pointermove", onCoinDragMove);
    window.addEventListener("pointerup", onCoinDragEnd);
    window.addEventListener("pointercancel", onCoinDragEnd);

    if (state === STATE.IDLE) {
      setMicrocopy("Drag it to the slot above the knob!");
    }
  }

  function cancelCoinDrag() {
    holdingCoin = false;
    document.body.classList.remove("holding-coin");
    cursorCoin.classList.remove("show", "bounce");
    window.removeEventListener("pointermove", onCoinDragMove);
    window.removeEventListener("pointerup", onCoinDragEnd);
    window.removeEventListener("pointercancel", onCoinDragEnd);
  }

  function animateKnobFrames(toFrame, onComplete) {
    if (knobTurnTimer !== null) {
      window.clearInterval(knobTurnTimer);
      knobTurnTimer = null;
    }

    if (prefersReducedMotion) {
      currentKnobFrame = toFrame;
      knobFrameUse.setAttribute("href", `#knob-frame-${currentKnobFrame}`);
      onComplete();
      return;
    }

    const frameDuration = KNOB_DURATION / KNOB_FRAME_COUNT;

    knobTurnTimer = window.setInterval(() => {
      currentKnobFrame += 1;
      knobFrameUse.setAttribute("href", `#knob-frame-${currentKnobFrame}`);

      if (currentKnobFrame >= toFrame) {
        window.clearInterval(knobTurnTimer);
        knobTurnTimer = null;
        onComplete();
      }
    }, frameDuration);
  }

  function pullLever() {
    if (state !== STATE.COIN_INSERTED) return;

    turnCount += 1;
    knobBtn.disabled = true;
    setMicrocopy("Turning...");
    playKnobTurnSound();

    if (turnCount < KNOB_TURN_STAGES) {
      const target = Math.round((KNOB_FRAME_COUNT * turnCount) / KNOB_TURN_STAGES);
      animateKnobFrames(target, () => {
        knobBtn.disabled = false;
        setMicrocopy(
          turnCount === 1 ? "Keep turning the knob!" : "One more turn!"
        );
      });
      return;
    }

    state = STATE.ROLLING;
    setMicrocopy("Rolling...");

    animateKnobFrames(KNOB_FRAME_COUNT, () => {
      knobFrameUse.setAttribute("href", "#knob-frame-1");
      currentKnobFrame = 1;
      machine.classList.add("rolling");

      window.setTimeout(() => {
        machine.classList.remove("rolling");
        state = STATE.CAPSULE_READY;
        crackCount = 0;
        const color =
          CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)];
        currentCapsuleColor = color;
        capsuleUse.setAttribute("href", `#${color}`);
        capsuleBtn.hidden = false;
        capsuleBtn.classList.add("drop-in");
        capsuleBtn.focus();
        setMicrocopy("Crack it open — click the capsule!");
      }, SHAKE_DURATION);
    });
  }

  function crackCapsule() {
    if (state !== STATE.CAPSULE_READY) return;
    crackCount += 1;

    if (crackCount === 1) {
      capsuleBtn.classList.add("crack-1-active");
      setMicrocopy("It's cracking...");
      playCapsuleShakeSound();
    } else if (crackCount === 2) {
      capsuleBtn.classList.add("crack-2-active");
      setMicrocopy("Almost there...");
      playCapsuleShakeSound();
    } else {
      openCapsule();
    }
  }

  function recolorCapsuleSvg(svgText) {
    const hex = CAPSULE_COLOR_HEX[currentCapsuleColor];
    return svgText.replace(/#BCA076/gi, hex);
  }

  function renderCapsuleFrame(n) {
    capsuleFrontLayer.innerHTML = recolorCapsuleSvg(CAPSULE_FRAME_SVG["front" + n]);

    if (n === 1) {
      capsuleInnerLayer.innerHTML = "";
      capsuleKuehWrap.style.transform = "translate(-50%, -50%) scale(0)";
    } else {
      capsuleInnerLayer.innerHTML = recolorCapsuleSvg(CAPSULE_FRAME_SVG["inner" + n]);
      capsuleKuehWrap.style.transform = `translate(-50%, -50%) scale(${CAPSULE_KUEH_SCALE[n - 1]})`;
    }
  }

  function openCapsule() {
    state = STATE.OPENING;
    capsuleBtn.classList.add("opening");
    setMicrocopy("Opening!");

    currentKueh = KUEH_DATA[Math.floor(Math.random() * KUEH_DATA.length)];
    capsuleKuehImg.src = currentKueh.image;
    capsuleKuehImg.alt = "";

    const sequence = [1, 2, 3, 4];
    sequence.forEach((frameNum, idx) => {
      window.setTimeout(() => renderCapsuleFrame(frameNum), idx * CAPSULE_OPEN_FRAME_DELAY);
    });

    window.setTimeout(() => {
      revealKueh();
    }, (sequence.length - 1) * CAPSULE_OPEN_FRAME_DELAY + 60);
  }

  function revealKueh() {
    state = STATE.REVEALED;

    const isNew = addToCollection(currentKueh.id);

    kuehArt.src = currentKueh.image;
    kuehArt.alt = `Illustration of ${currentKueh.name}`;
    kuehPlushie.src = currentKueh.plushieImage;
    kuehPlushie.alt = `Plushie of ${currentKueh.name}`;
    kuehName.textContent = isNew ? `${currentKueh.name} · New` : currentKueh.name;
    kuehNameZh.textContent = currentKueh.nameZh;
    kuehNameJa.textContent = currentKueh.nameJa;
    kuehDesc.textContent = currentKueh.description;
    kuehTaste.textContent = currentKueh.taste;
    kuehHistory.textContent = currentKueh.history;

    revealView.hidden = false;
    againBtn.focus();
  }

  function clearHandsExitTimer() {
    if (handsExitTimer !== null) {
      window.clearTimeout(handsExitTimer);
      handsExitTimer = null;
    }
  }

  function showHands() {
    kuehHands.classList.remove("exit");
    kuehHands.classList.add("show");
    clearHandsExitTimer();
    handsExitTimer = window.setTimeout(dismissHands, HANDS_AUTO_DISMISS_DELAY);
  }

  function dismissHands() {
    clearHandsExitTimer();
    if (!kuehHands.classList.contains("show")) return;

    kuehHands.classList.remove("show");
    kuehHands.classList.add("exit");
    window.setTimeout(() => {
      kuehHands.classList.remove("exit");
    }, HANDS_EXIT_DURATION);
  }

  function spinCoin() {
    if (
      coinSpinInner.classList.contains("spinning") ||
      coinSpinInner.classList.contains("spinning-once")
    ) {
      return;
    }

    if (kuehHands.classList.contains("show")) {
      coinSpinInner.classList.add("spinning-once");
      window.setTimeout(() => {
        coinSpinInner.classList.remove("spinning-once");
        dismissHands();
      }, COIN_SPIN_ONCE_DURATION);
      return;
    }

    coinSpinInner.classList.add("spinning");
    window.setTimeout(() => {
      coinSpinInner.classList.remove("spinning");
      showHands();
    }, COIN_SPIN_DURATION);
  }

  function resetToIdle() {
    state = STATE.IDLE;
    crackCount = 0;
    currentKueh = null;

    turnCount = 0;
    currentKnobFrame = 1;
    if (knobTurnTimer !== null) {
      window.clearInterval(knobTurnTimer);
      knobTurnTimer = null;
    }
    knobFrameUse.setAttribute("href", "#knob-frame-1");

    coinBtn.disabled = false;
    coinBtn.classList.remove("inserted");
    knobBtn.disabled = true;
    machine.classList.remove("rolling");
    capsuleBtn.hidden = true;
    capsuleBtn.classList.remove(
      "drop-in",
      "crack-1-active",
      "crack-2-active",
      "opening"
    );
    capsuleFrontLayer.innerHTML = "";
    capsuleInnerLayer.innerHTML = "";
    capsuleKuehWrap.style.transform = "translate(-50%, -50%) scale(0)";
    setMicrocopy("Drag and drop a coin into the gacha");

    revealView.hidden = true;
    coinSpinInner.classList.remove("spinning", "spinning-once");
    clearHandsExitTimer();
    kuehHands.classList.remove("show", "exit");

    cancelCoinDrag();
    if (coinFallTimer !== null) {
      window.clearInterval(coinFallTimer);
      coinFallTimer = null;
    }
    coinDrop.classList.remove("show");
    coinDropFrameUse.setAttribute("href", "#coin-fall-frame-1");

    coinBtn.focus();
  }

  coinBtn.addEventListener("click", insertCoin);
  coinBowl.addEventListener("pointerdown", startCoinDrag);
  knobBtn.addEventListener("click", pullLever);
  capsuleBtn.addEventListener("click", crackCapsule);
  againBtn.addEventListener("click", resetToIdle);
  spinCoinBadge.addEventListener("click", spinCoin);

  soundToggle.addEventListener("click", () => {
    setAmbientEnabled(!ambientEnabled);
  });
  window.addEventListener("pointerdown", bootstrapAmbientOnGesture);
})();
