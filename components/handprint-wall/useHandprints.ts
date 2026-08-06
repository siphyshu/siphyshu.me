"use client";

import { useEffect, useState } from "react";
import type { Handprint, HandprintInput } from "@/lib/schemas/handprint";

export function useHandprints() {
  const [handprints, setHandprints] = useState<Handprint[]>([]);
  const [loadError, setLoadError] = useState(false);

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

  const addHandprint = async (input: HandprintInput): Promise<boolean> => {
    const optimistic: Handprint = { ...input };
    setHandprints((prev) => [...prev, optimistic]);

    try {
      const response = await fetch("/api/handprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to save handprint");
      return true;
    } catch (error) {
      console.error("Error adding handprint:", error);
      setHandprints((prev) => prev.filter((h) => h !== optimistic));
      return false;
    }
  };

  return { handprints, loadError, addHandprint };
}
