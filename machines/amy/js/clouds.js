// Ambient background clouds. Driven from JS rather than a CSS @keyframes
// loop because the fade-out has to trigger a fixed 200px from the actual
// viewport edge — a CSS keyframe's stop position is a fixed percentage of
// the animation, which would land at a different pixel distance on every
// screen width. Reading window.innerWidth per frame lets the fade line up
// exactly regardless of viewport size.
//
// Cloud elements are created here (not hardcoded in the HTML) so each one
// can re-roll its own source image, size, height, and speed every time it
// loops back off-screen — otherwise the same five clouds keep replaying
// identically and it reads as copy-pasted instead of a sky.
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const layer = document.getElementById("cloudLayer");
  if (!layer) return;

  const FADE_ZONE = 200; // px from the viewport's right edge where opacity ramps to 0
  const FADE_IN_DISTANCE = 150; // px of travel after entering where opacity ramps to 1
  const INITIAL_FADE_IN_DISTANCE = FADE_IN_DISTANCE * 0.5; // 50% faster fade-in for the first, on-load appearance only
  const RESPAWN_JITTER = 60; // extra random px of hidden travel before a looped cloud reappears
  const CLOUD_COUNT = 9;

  const VARIANTS = [
    { src: "./assets/cloud-1.svg", minWidth: 95, maxWidth: 125 },
    { src: "./assets/cloud-2.svg", minWidth: 65, maxWidth: 105 },
    { src: "./assets/cloud-3.svg", minWidth: 38, maxWidth: 56 }
  ];

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function applyRandomVariant(cloud) {
    const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    const width = randomBetween(variant.minWidth, variant.maxWidth);

    cloud.el.src = variant.src;
    cloud.el.style.width = width + "px";
    cloud.el.style.top = `calc(${randomBetween(2, 26).toFixed(1)}% + 50px)`;

    cloud.width = width;
    cloud.speed = randomBetween(7, 19);
  }

  const clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const img = document.createElement("img");
    img.className = "cloud";
    img.alt = "";
    layer.appendChild(img);
    clouds.push({ el: img });
  }

  function resetCloud(cloud) {
    applyRandomVariant(cloud);
    cloud.offscreen = cloud.width + 40;
    cloud.x = -cloud.offscreen - Math.random() * RESPAWN_JITTER;
    cloud.enterX = cloud.x;
    cloud.fadeInDistance = FADE_IN_DISTANCE;
    cloud.el.style.left = cloud.x + "px";
    cloud.el.style.opacity = "0";
  }

  // On page load, spawn clouds already scattered near the gachapon
  // (roughly the viewport's horizontal middle) and fade them in from
  // there, instead of starting off-screen — otherwise the first clouds
  // take a long, empty while to drift all the way in from the edge
  // before any are ever near the machine. Later loops (once a cloud has
  // crossed off the right edge) re-enter from off-screen left, same as
  // a normal drifting sky.
  function initCloud(cloud) {
    applyRandomVariant(cloud);
    cloud.offscreen = cloud.width + 40;
    const startNear = randomBetween(0.12, 0.88);
    cloud.x = window.innerWidth * startNear - cloud.width / 2 - 100;
    cloud.enterX = cloud.x;
    cloud.fadeInDistance = INITIAL_FADE_IN_DISTANCE;
    cloud.el.style.left = cloud.x + "px";
    cloud.el.style.opacity = "0";
  }

  clouds.forEach(initCloud);

  if (prefersReducedMotion) {
    clouds.forEach((cloud, i) => {
      cloud.el.style.left = 15 + i * 9 + "%";
      cloud.el.style.opacity = "0.7";
    });
    return;
  }

  let lastTime = null;

  function tick(time) {
    if (lastTime === null) lastTime = time;
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    const viewportWidth = window.innerWidth;

    clouds.forEach((cloud) => {
      cloud.x += cloud.speed * dt;

      if (cloud.x >= viewportWidth) {
        resetCloud(cloud);
        return;
      }

      const distanceToEdge = viewportWidth - cloud.x;
      const distanceFromStart = cloud.x - cloud.enterX;

      let opacity = 1;
      if (distanceToEdge <= FADE_ZONE) {
        opacity = Math.max(0, distanceToEdge / FADE_ZONE);
      } else if (distanceFromStart < cloud.fadeInDistance) {
        opacity = Math.max(0, distanceFromStart / cloud.fadeInDistance);
      }

      cloud.el.style.left = cloud.x + "px";
      cloud.el.style.opacity = String(opacity);
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
