import type { ReactNode } from "react";

// The site's column, which the root layout no longer imposes.
export default function BackstageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="px-4">
      <div className="max-w-4xl w-full mx-auto">{children}</div>
    </div>
  );
}
