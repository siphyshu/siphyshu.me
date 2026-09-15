"use client";

import { useRef, useState, type FormEvent } from "react";
import { validateLink } from "@/lib/schemas/link";

export interface HandprintFormSubmitData {
  name: string;
  link: string;
}

/**
 * Everything the handprint form does that isn't layout.
 *
 * The sheet and the in-frame panel arrange the same four controls very
 * differently — stacked full-width on a phone, paired inside a 245px frame on
 * a desktop — so they don't share markup. They do share every rule about what
 * happens when you submit, which lives here so the two can't drift.
 */
export function useHandprintForm(
  onSubmit: (data: HandprintFormSubmitData) => void | Promise<void>
) {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");

  // Validated on submit rather than on every keystroke, so the field doesn't
  // scold you for a half-typed domain.
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Bumped on every failed validation, including the same failure twice in a
   * row. The message alone can't drive a reaction — resubmitting an unchanged
   * bad link sets identical state, so nothing re-renders and the field would
   * sit there looking ignored. A counter always changes.
   */
  const [linkErrorAt, setLinkErrorAt] = useState(0);

  // A ref, not the isSubmitting state, is what actually blocks a double
  // submit: state updates are async, so two clicks landing in the same tick
  // would both read isSubmitting as false and both fire a POST. The database
  // has several handprints stored 2-4 times at identical coordinates from
  // exactly this. The disabled attribute is the visible half; this is the
  // half that's race-free.
  const submittingRef = useRef(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (link.trim()) {
      const result = validateLink(link);
      if (!result.ok) {
        setLinkError(result.reason);
        setLinkErrorAt((n) => n + 1);
        return;
      }
    }

    setLinkError(null);
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({ name, link });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const changeLink = (value: string) => {
    setLink(value);
    if (linkError) setLinkError(null);
  };

  return {
    name,
    setName,
    link,
    changeLink,
    linkError,
    linkErrorAt,
    isSubmitting,
    handleSubmit,
  };
}
