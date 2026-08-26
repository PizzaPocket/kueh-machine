// Shape, Paint, Shine: place all fruits, paint each with two colours,
// then drag the glaze brush across it three times.
window.KG = window.KG || {};
window.KG.minigames = window.KG.minigames || {};

(function () {
  const DIR = "assets/minigames/luk-chup-shape-paint-shine";
  const PLATE = `${DIR}/work-plate-v2.webp`;
  const BRUSH = `${DIR}/glaze-brush-v1.webp`;
  const SPARKLES = "assets/effects/minigame-success-sparkles-v1.png";
  const PASSES = 5;
  const FRUITS = [
    { id: "mango", blank: `${DIR}/unpainted-mango-v2.webp`, matte: `${DIR}/painted-mango-matte-v1.webp`, glossy: `${DIR}/finished-mango-v2.webp`, colors: ["yellow", "green"], target: [51, 29], w: 36, h: 31 },
    { id: "mangosteen", blank: `${DIR}/unpainted-mangosteen-v2.webp`, matte: `${DIR}/painted-mangosteen-matte-v1.webp`, glossy: `${DIR}/finished-mangosteen-v2.webp`, colors: ["magenta", "green"], target: [34, 63], w: 31, h: 31 },
    { id: "orange", blank: `${DIR}/unpainted-orange-v2.webp`, matte: `${DIR}/painted-orange-matte-v1.webp`, glossy: `${DIR}/finished-orange-v2.webp`, colors: ["orange", "green"], target: [67, 63], w: 31, h: 31 }
  ];
  const SWATCHES = [
    { id: "yellow", color: "#fcce03" }, { id: "magenta", color: "#9d124f" },
    { id: "orange", color: "#fa5301" }, { id: "green", color: "#78a05a" }
  ];

  function shuffle(values) {
    const copy = values.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function fruit(id) { return FRUITS.find((item) => item.id === id); }
  function label(id) { return id.charAt(0).toUpperCase() + id.slice(1); }

  function start(container, config, onResult) {
    const saved = (config.savedState && config.savedState.fruitStates) || {};
    const state = { fruitStates: {}, order: shuffle(FRUITS.map((f) => f.id)), active: null, placement: null, colors: [], wobble: false, glossReveal: null, done: false };
    FRUITS.forEach((f) => {
      const old = saved[f.id] || {};
      state.fruitStates[f.id] = { placed: !!old.placed, colorStep: Math.min(old.colorStep || 0, 2), shineTaps: Math.min(old.shineTaps || 0, PASSES), done: !!old.done };
    });

    const fs = (id) => state.fruitStates[id];
    const allPlaced = () => FRUITS.every((f) => fs(f.id).placed);
    const doneCount = () => FRUITS.filter((f) => fs(f.id).done).length;
    const needsPaint = (id) => fs(id).placed && !fs(id).done && fs(id).colorStep < 2;
    const needsShine = (id) => fs(id).placed && !fs(id).done && !needsPaint(id);

    function persist() {
      if (!config.onProgress) return;
      const fruitStates = {};
      FRUITS.forEach((f) => { fruitStates[f.id] = Object.assign({}, fs(f.id)); });
      config.onProgress({ fruitStates });
    }
    function instruction() {
      if (!allPlaced()) return "Place all three unpainted fruits onto their matching spaces.";
      if (!state.active) return "Choose a fruit to paint.";
      if (needsPaint(state.active)) return "Choose both colours, then paint the fruit.";
      return "Hold the brush and sweep it over the fruit until it is all shiny.";
    }

    function plateItem(f) {
      const st = fs(f.id);
      const style = `left:${f.target[0]}%;top:${f.target[1]}%;width:${f.w}%;height:${f.h}%`;
      if (!st.placed) return `<button type="button" class="spshine-well-target" style="${style}" data-drop="${f.id}" aria-label="${label(f.id)} space"></button>`;
      const src = st.done ? f.glossy : st.colorStep >= 2 ? f.matte : f.blank;
      return `<button type="button" class="spshine-plate-fruit ${st.done ? "is-done" : ""} ${allPlaced() && !st.done ? "is-ready" : ""}" style="${style}" ${allPlaced() && !st.done ? 'data-open="' + f.id + '"' : ""} aria-label="${label(f.id)} sweet"><img src="${src}" alt="" class="spshine-plate-fruit-img" draggable="false"></button>`;
    }
    function picker() {
      const ids = state.order.filter((id) => !fs(id).placed);
      if (!ids.length) return "";
      return `<div class="spshine-picker-row">${ids.map((id) => `<button type="button" class="spshine-unpainted-btn ${state.placement === id ? "is-selected" : ""}" data-fruit="${id}" aria-label="Place ${label(id)}"><img src="${fruit(id).blank}" alt="" class="spshine-unpainted-img" draggable="false"></button>`).join("")}</div><p class="spshine-hint">Drag each fruit to its outline, or tap a fruit and then its space.</p>`;
    }
    function paintControls() {
      return `<div class="spshine-picker" role="group" aria-label="Paint colours">${SWATCHES.map((s) => {
        const order = state.colors.indexOf(s.id);
        return `<button type="button" class="spshine-swatch-btn ${order >= 0 ? "is-selected" : ""}" data-swatch="${s.id}" style="background:${s.color}" aria-label="${s.id} paint">${order >= 0 ? `<span>${order + 1}</span>` : ""}</button>`;
      }).join("")}</div><button type="button" class="primary-btn spshine-paint-btn" data-action="paint" ${state.colors.length === 2 ? "" : "disabled"}>Paint with these colours</button><p class="spshine-hint" aria-live="polite">${state.colors.length}/2 colours selected</p>`;
    }

    function renderPlate() {
      container.innerHTML = `<div class="spshine-game"><p class="spshine-instruction">${instruction()}</p><p class="spshine-progress">Fruit sweets: ${doneCount()} of 3</p><div class="spshine-board"><img src="${PLATE}" alt="" class="spshine-plate-img" draggable="false">${FRUITS.map(plateItem).join("")}</div>${picker()}<button type="button" class="memory-dev-skip" data-action="skip">complete for me</button></div>`;
      bindFruitDrag();
    }
    function renderFocus() {
      const f = fruit(state.active);
      const st = fs(f.id);
      const painted = st.colorStep >= 2;
      const revealing = state.glossReveal === f.id;
      const source = revealing ? f.glossy : painted ? f.matte : f.blank;
      container.innerHTML = `<div class="spshine-game"><p class="spshine-instruction" data-gloss-instruction>${revealing ? "Gloss complete!" : instruction()}</p><p class="spshine-progress" data-gloss-progress>${label(f.id)} · ${revealing ? "Shining!" : painted ? `Gloss ${st.shineTaps} of ${PASSES}` : "Paint"}</p><div class="spshine-focus"><div class="spshine-focus-stage ${state.wobble ? "is-wobble" : ""} ${revealing ? "is-gloss-reveal" : ""}" data-shine-target><img src="${source}" alt="${label(f.id)}" class="spshine-focus-img" draggable="false">${revealing ? '<span class="spshine-gloss-burst" aria-hidden="true">✦</span>' : ""}</div>${needsPaint(f.id) ? paintControls() : revealing ? '<p class="spshine-gloss-complete">Beautifully glazed!</p>' : `<div class="spshine-brush-area"><img src="${BRUSH}" alt="Hold and drag the glaze brush over the fruit five times" class="spshine-brush-tool" data-brush draggable="false"><span>Hold and brush back and forth without letting go</span></div>`}</div><button type="button" class="memory-dev-skip" data-action="skip">complete for me</button></div>`;
      if (needsShine(f.id) && !revealing) bindBrush();
    }
    function render() { state.active && (!fs(state.active).done || state.glossReveal === state.active) ? renderFocus() : renderPlate(); }

    function place(id, slot) {
      if (id !== slot || fs(id).placed) return false;
      fs(id).placed = true; state.placement = null; persist(); render(); return true;
    }
    function applyPaint() {
      if (!state.active || state.colors.length !== 2) return;
      const f = fruit(state.active);
      if (state.colors.slice().sort().join("|") === f.colors.slice().sort().join("|")) {
        fs(f.id).colorStep = 2; state.colors = []; persist(); render();
      } else {
        state.wobble = true; render(); setTimeout(() => { state.wobble = false; render(); }, 450);
      }
    }
    function shinePass(shouldRender) {
      const st = fs(state.active);
      st.shineTaps = Math.min(PASSES, st.shineTaps + 1);
      if (st.shineTaps === PASSES) {
        const completedId = state.active;
        st.done = true;
        state.glossReveal = completedId;
        persist();
        render();
        setTimeout(() => {
          state.glossReveal = null;
          state.active = null;
          render();
          checkDone();
        }, 1000);
        return;
      }
      persist();
      if (shouldRender !== false) render();
    }

    function bindFruitDrag() {
      container.querySelectorAll("[data-fruit]").forEach((button) => button.addEventListener("pointerdown", (down) => {
        down.preventDefault();
        const id = button.dataset.fruit;
        const ghost = document.createElement("img");
        ghost.src = fruit(id).blank; ghost.className = "spshine-drag-ghost"; ghost.style.width = `${button.offsetWidth * 1.4}px`; document.body.appendChild(ghost);
        const startX = down.clientX, startY = down.clientY;
        let moved = false;
        function move(e) {
          moved = moved || Math.hypot(e.clientX - startX, e.clientY - startY) > 5;
          ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`; ghost.style.display = "none";
          const under = document.elementFromPoint(e.clientX, e.clientY); ghost.style.display = "";
          const target = under && under.closest("[data-drop]");
          container.querySelectorAll("[data-drop]").forEach((well) => well.classList.toggle("is-hover", well === target));
        }
        function up(e) {
          ghost.style.display = "none"; const under = document.elementFromPoint(e.clientX, e.clientY); const target = under && under.closest("[data-drop]");
          cleanup();
          if (target) place(id, target.dataset.drop); else if (!moved) { state.placement = state.placement === id ? null : id; render(); } else render();
        }
        function cleanup() {
          ghost.remove();
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", cancel);
          window.removeEventListener("blur", cancel);
        }
        function cancel() { cleanup(); render(); }
        move(down);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", cancel);
        window.addEventListener("blur", cancel);
      }));
    }

    function bindBrush() {
      const brush = container.querySelector("[data-brush]");
      brush.addEventListener("pointerdown", (down) => {
        down.preventDefault(); brush.setPointerCapture(down.pointerId); brush.classList.add("is-dragging");
        const startX = down.clientX, startY = down.clientY;
        let previousX = down.clientX, previousY = down.clientY;
        let distanceOnFruit = 0;
        let completedDuringDrag = 0;
        const target = container.querySelector("[data-shine-target]");
        const targetBox = target.getBoundingClientRect();
        const passDistance = Math.max(70, targetBox.width * 0.55);

        function updateGlossFeedback() {
          const st = fs(state.active);
          const progress = container.querySelector("[data-gloss-progress]");
          const instructionEl = container.querySelector("[data-gloss-instruction]");
          if (progress) progress.textContent = `${label(state.active)} · Gloss ${st.shineTaps} of ${PASSES}`;
          if (instructionEl) {
            const left = PASSES - st.shineTaps;
            instructionEl.textContent = `Keep holding and brush over the fruit ${left} more ${left === 1 ? "time" : "times"}.`;
          }
          // Keep the matte art unchanged during all five passes. The asset
          // swaps to the true glossy version only after pass five.
        }

        function move(e) {
          const dx = e.clientX - startX, dy = e.clientY - startY;
          brush.style.transform = `translate(${dx}px, ${dy}px) rotate(-34deg)`;
          const a = brush.getBoundingClientRect();
          const intersects = a.left < targetBox.right && a.right > targetBox.left && a.top < targetBox.bottom && a.bottom > targetBox.top;
          const travelled = Math.hypot(e.clientX - previousX, e.clientY - previousY);
          previousX = e.clientX; previousY = e.clientY;
          if (!intersects || travelled > 80) return;
          distanceOnFruit += travelled;
          while (distanceOnFruit >= passDistance && fs(state.active).shineTaps < PASSES) {
            distanceOnFruit -= passDistance;
            completedDuringDrag += 1;
            shinePass(false);
            if (!state.active || state.glossReveal) return;
            updateGlossFeedback();
          }
        }
        function up() {
          brush.removeEventListener("pointermove", move); brush.removeEventListener("pointerup", up); brush.removeEventListener("pointercancel", up);
          if (state.active) {
            brush.classList.remove("is-dragging"); brush.style.transform = "";
            if (completedDuringDrag) persist();
          }
        }
        brush.addEventListener("pointermove", move); brush.addEventListener("pointerup", up); brush.addEventListener("pointercancel", up);
      });
    }

    function showSuccess() {
      const frame = document.getElementById("trayStageFrame");
      if (frame) {
        const overlay = document.createElement("div"); overlay.className = "memory-success-overlay"; overlay.setAttribute("role", "status");
        overlay.innerHTML = `<div class="memory-success-stack"><img src="${SPARKLES}" alt="" class="memory-success-sparkles">${config.successPortrait ? `<img src="${config.successPortrait}" alt="" class="memory-success-kueh">` : ""}</div><p class="memory-success-text">Three bright shapes, one sweet beginning!</p>`; frame.appendChild(overlay);
      }
      setTimeout(() => onResult({ completed: true }), 2200);
    }
    function checkDone() {
      if (doneCount() !== 3 || state.done) return;
      state.done = true; state.active = null; render(); setTimeout(showSuccess, 700);
    }
    function click(e) {
      if (state.done) return;
      if (e.target.closest('[data-action="skip"]')) {
        FRUITS.forEach((f) => { state.fruitStates[f.id] = { placed: true, colorStep: 2, shineTaps: PASSES, done: true }; }); state.active = null; persist(); render(); checkDone(); return;
      }
      const well = e.target.closest("[data-drop]");
      if (well && state.placement) { place(state.placement, well.dataset.drop); return; }
      const open = e.target.closest("[data-open]");
      if (open && allPlaced()) { state.active = open.dataset.open; state.colors = []; render(); return; }
      if (e.target.closest('[data-action="back"]')) { state.active = null; state.colors = []; render(); return; }
      const swatch = e.target.closest("[data-swatch]");
      if (swatch) {
        const id = swatch.dataset.swatch, at = state.colors.indexOf(id);
        if (at >= 0) state.colors.splice(at, 1); else if (state.colors.length < 2) state.colors.push(id);
        render(); return;
      }
      if (e.target.closest('[data-action="paint"]')) applyPaint();
    }

    container.addEventListener("click", click);
    render(); checkDone();
  }
  window.KG.minigames.shapePaintShine = { start };
})();
