import SiteShell from "@/components/ui/SiteShell";
import { getArticles, getProjects } from "@/lib/content";

export default async function SiteLayout({ children }) {
  // Read here rather than in each page: the search box lives in the shell, so
  // it needs both collections regardless of which section is showing. The
  // pages read the same functions again for their own rendering — lib/content
  // wraps them in React's cache(), so that is one filesystem pass per render,
  // not two.
  const [projects, articles] = await Promise.all([getProjects(), getArticles()]);

  return (
    <SiteShell projects={projects} articles={articles}>
      {children}
    </SiteShell>
  );
}
