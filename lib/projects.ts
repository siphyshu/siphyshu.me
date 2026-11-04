import { allProjects } from "content-collections";

// Client-safe: card data only. The write-ups are in allProjectBodies, which
// only the server-rendered project page imports.

const sorted = [...allProjects].sort((a, b) => a.order - b.order);

/** In the order /projects shows them: the `order` in each file's frontmatter. */
export const projects = sorted.filter((p) => !p.archived);

/** Kept but not shown anywhere yet, for a future archive section. */
export const archivedProjects = sorted.filter((p) => p.archived);
