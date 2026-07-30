const SCREENS = ["screen-title", "screen-intro", "screen-how", "screen-app"];
let currentScreenIndex = 0;
let introTyped = false;

function showScreen(index) {
  SCREENS.forEach((id, i) => {
    document.getElementById(id).classList.toggle("active", i === index);
  });
  document.body.classList.toggle("app-active", SCREENS[index] === "screen-app");
  document.body.classList.toggle("screen-intro-active", SCREENS[index] === "screen-intro");
  document.body.classList.toggle("screen-how-active", SCREENS[index] === "screen-how");
  currentScreenIndex = index;

  if (SCREENS[index] === "screen-intro") runIntroTyping();
  if (SCREENS[index] === "screen-app" && window.map) {
    requestAnimationFrame(() => window.map.invalidateSize());
  }
}

function advanceTo(id) {
  showScreen(SCREENS.indexOf(id));
}

function typeText(el, text, speed) {
  return new Promise((resolve) => {
    el.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

function runIntroTyping() {
  if (introTyped) return;
  introTyped = true;
  typeText(
    document.getElementById("intro-typed"),
    "Welcome to Cat Scan! Singapore's strays, spotted and named by the community. One shared map, built one cat at a time.",
    18
  );
}

document.getElementById("screen-title").addEventListener("click", () => advanceTo("screen-intro"));
document.getElementById("screen-intro").addEventListener("click", () => advanceTo("screen-how"));
document.getElementById("how-advance").addEventListener("click", () => advanceTo("screen-app"));

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && SCREENS[currentScreenIndex] === "screen-how") {
    advanceTo("screen-app");
  }
});
