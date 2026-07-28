// Relative asset paths, not root-absolute (Vite's default) — this project
// gets served from a subdirectory (/machines/kaixin/, or /kaixin/ via the
// root vercel.json rewrite), not the domain root, same reason every other
// contributor's own project uses relative paths throughout.
export default {
  base: './',
};
