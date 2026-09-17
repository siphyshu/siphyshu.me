import { notFound } from "next/navigation";
import CuePage from "@/components/backstage/CuePage";
import PasswordGate from "@/components/backstage/PasswordGate";
import { backstageConfigured, isUnlocked } from "@/lib/backstage";
import { ensureCues, getCue } from "@/lib/backstage-store";
import { itemIdSchema } from "@/lib/schemas/backstage";

export const metadata = {
  title: "backstage",
  robots: { index: false, follow: false },
};

export default async function Cue({ params }: { params: Promise<{ id: string }> }) {
  if (!backstageConfigured()) notFound();
  // Same order as the board: the gate is checked before anything is read.
  if (!(await isUnlocked())) return <PasswordGate />;

  const { id } = await params;
  if (!itemIdSchema.safeParse(id).success) notFound();

  await ensureCues();
  const found = await getCue(id);
  if (!found) notFound();

  return <CuePage cue={found} />;
}
