"use client";

import { useEffect, useMemo, useState } from "react";
import type { Handprint, HandprintInput } from "@/lib/schemas/handprint";
import { withAges } from "./age";

export function useHandprints() {
  const [handprints, setHandprints] = useState<Handprint[]>([]);
  const [loadError, setLoadError] = useState(false);

  // Oldest-first, each tagged with a normalized age. See ./age — the ordering
  // is what makes newer hands layer over older ones.
  const agedHandprints = useMemo(() => withAges(handprints), [handprints]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/handprints");
        if (!response.ok) throw new Error("Failed to fetch handprints");
        const data: Handprint[] = await response.json();
        if (!cancelled) setHandprints(data);
      } catch (error) {
        console.error("Error fetching handprints:", error);
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * `turnstileToken` is a credential for this one request, not part of the
   * handprint — it's a separate argument rather than a field on the input so
   * it can't be mistaken for something that gets stored. The server strips it
   * before validating, and validation is strict, so a token that leaked into
   * the input object would fail the request outright.
   */
  const addHandprint = async (
    input: HandprintInput,
    turnstileToken?: string | null
  ): Promise<boolean> => {
    // Temporary client-side id so the optimistic print has a stable React key
    // until the next GET replaces it with the real Mongo-derived one. The
    // timestamp is local-only and gets replaced by the server's on the next
    // read — but it has to be set, or withAges() would treat a brand-new
    // handprint as undated and render it as the oldest thing on the wall.
    const optimistic: Handprint = {
      ...input,
      id: `optimistic-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
    };
    setHandprints((prev) => [...prev, optimistic]);

    try {
      const response = await fetch("/api/handprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          turnstileToken ? { ...input, turnstileToken } : input
        ),
      });
      if (!response.ok) throw new Error("Failed to save handprint");
      return true;
    } catch (error) {
      console.error("Error adding handprint:", error);
      setHandprints((prev) => prev.filter((h) => h.id !== optimistic.id));
      return false;
    }
  };

  return { handprints: agedHandprints, loadError, addHandprint };
}
