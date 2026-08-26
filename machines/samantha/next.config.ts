import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The catalogue (songs, eras, memory triggers) is a ~280KB static export
  // bundled straight into the app (see src/data/catalogue.json and
  // scripts/export-static-data.ts) — there's no runtime database, so this
  // app builds to static files like every other machine on the site rather
  // than needing its own Vercel deployment/server. basePath makes every URL
  // this app generates for itself (page routes, _next/static assets) carry
  // the /samantha prefix, so they still resolve once the root vercel.json
  // rewrites /samantha/* to this build's output directory.
  basePath: "/samantha",
  output: "export",
  images: {
    // No server to run the image optimizer against in a static export —
    // next/image just renders a plain <img> with the original src.
    unoptimized: true,
  },
};

export default nextConfig;
