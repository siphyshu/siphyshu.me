import Board from "@/components/backstage/Board";
import PasswordGate from "@/components/backstage/PasswordGate";
import { backstageConfigured, isUnlocked } from "@/lib/backstage";
import { ensureCues, ensureSeeded, getBoard } from "@/lib/backstage-store";

// Sits outside both (site) and (reader): no hero, no handprint wall, no
// "← articles". Nothing links here — you type the URL, or you know the code.
export const metadata = {
  title: "backstage",
  // Alongside the password, not instead of it: keeps the URL out of search
  // results if it's ever pasted somewhere public.
  robots: { index: false, follow: false },
};

export default async function BackstagePage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  if (!backstageConfigured()) {
    // Fails closed. See lib/backstage — a missing password must never mean
    // "let everyone in".
    return (
      <div className="max-w-md mx-auto pt-24 pb-32">
        <h1 className="text-2xl">backstage</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          No password is configured on this deployment. Set{" "}
          <code>BACKSTAGE_PASSWORD</code> and try again.
        </p>
      </div>
    );
  }

  // The list is never sent to a locked client, and never even read from the
  // database for one: this check runs before the query does.
  if (!(await isUnlocked())) return <PasswordGate />;

  await ensureSeeded();
  await ensureCues();
  // A cue page deletes and comes back here with ?deleted=, so undo lives on
  // the list, where the item will reappear.
  const { deleted } = await searchParams;
  return <Board items={await getBoard()} deletedId={deleted ?? null} />;
}
