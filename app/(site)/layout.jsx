import SiteShell from "@/components/ui/SiteShell";
import { getHandprints } from "@/lib/handprints";

export default async function SiteLayout({ children }) {
  // Read here, on the server, so the wall is in the prerendered HTML rather
  // than fetched after hydration. A failed read must not take the whole site
  // down with it — null hands the job back to the client, which fetches the
  // API itself and reports the failure on the wall if that fails too.
  const handprints = await getHandprints().catch((error) => {
    console.error("Failed to prerender handprints:", error);
    return null;
  });

  return (
    <div className="px-4">
      <div className="max-w-4xl w-full mx-auto">
        <SiteShell initialHandprints={handprints}>{children}</SiteShell>
      </div>
    </div>
  );
}
