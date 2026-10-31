import type { ReactNode } from "react";

// The site's column, which the root layout no longer imposes. Always light:
// data-force-light keeps the dark palette off while this is on screen (see
// the theme block in globals.css) — backstage has its own colours and no
// night version yet.
export default function BackstageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="px-4" data-force-light>
      <div className="max-w-4xl w-full mx-auto">{children}</div>
    </div>
  );
}
