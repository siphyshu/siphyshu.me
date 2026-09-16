import PasswordGate from "@/components/backstage/PasswordGate";
import Roadmap from "@/components/backstage/Roadmap";
import { backstageConfigured, isUnlocked } from "@/lib/backstage";

// Sits outside both (site) and (reader): no hero, no handprint wall, no
// "← articles". It is not part of the site's navigation and nothing links to
// it — you get here by typing the URL.
export const metadata = {
  title: "backstage",
  // Belt and braces alongside the password. A noindex header is what keeps the
  // URL out of search results if it is ever pasted somewhere public — the
  // password stops people reading the page, not crawlers recording that it
  // exists.
  robots: { index: false, follow: false },
};

export default async function BackstagePage() {
  if (!backstageConfigured()) {
    // Fails closed. See lib/backstage — a missing password must never mean
    // "let everyone in".
    return (
      <div className="max-w-md mx-auto pt-24 pb-32">
        <h1 className="text-2xl">backstage</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          No password is configured on this deployment, so there is nothing to
          unlock. Set <code>BACKSTAGE_PASSWORD</code> and try again.
        </p>
      </div>
    );
  }

  // The roadmap is never sent to a locked client: this is a server component,
  // so the branch not taken is not in the payload at all. A client-side check
  // would ship the whole thing and merely decline to display it.
  if (!(await isUnlocked())) return <PasswordGate />;

  return <Roadmap />;
}
