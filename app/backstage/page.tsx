import Board from "@/components/backstage/Board";
import PasswordGate from "@/components/backstage/PasswordGate";
import { backstageConfigured, isUnlocked } from "@/lib/backstage";
import { ensureSeeded, getBoard } from "@/lib/backstage-store";

// Sits outside both (site) and (reader): no hero, no handprint wall, no
// "← articles". Nothing links here — you type the URL, or you know the code.
export const metadata = {
  title: "backstage",
  // Alongside the password, not instead of it. The password stops people
  // reading the page; noindex keeps the URL itself out of search results if it's
  // ever pasted somewhere public.
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

  // The board is never sent to a locked client, and never even read from the
  // database for one: this check runs before the query does.
  if (!(await isUnlocked())) return <PasswordGate />;

  await ensureSeeded();
  return <Board sections={await getBoard()} />;
}
