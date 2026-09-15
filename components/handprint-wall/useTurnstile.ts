"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** render=explicit so nothing is drawn until we ask — the widget has to be
 *  mounted into a container we control, at a moment we choose. */
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Ceiling on how long a submission waits for a token.
 *
 * Without it, a widget that never calls back leaves the submit button disabled
 * forever with no explanation — the worst possible failure, because it looks
 * like the site is broken rather than like something needs retrying. 20s is
 * long enough for a slow interactive challenge on a bad connection.
 */
const TOKEN_TIMEOUT_MS = 20_000;

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads the Turnstile script once per page, however many callers ask. */
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Cleared so a later attempt can retry. Blocked by an extension or a
      // flaky network are both plausible here and both are worth retrying.
      scriptPromise = null;
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export interface UseTurnstile {
  /** Attach to an empty element. The widget renders into it, and stays at zero
   *  size unless Cloudflare decides a human needs to do something. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** True while an interactive challenge is on screen, so the caller can put a
   *  backdrop behind it — the widget is otherwise a small unexplained box
   *  floating over the page. */
  challenging: boolean;
  /** Whether a site key is configured at all. False means every getToken()
   *  resolves null and the server is expected to be equally unconfigured. */
  enabled: boolean;
  /** Runs the challenge and resolves with a token, or null if one couldn't be
   *  obtained for any reason. Never rejects: the server is the only thing that
   *  decides whether a tokenless submission is acceptable. */
  getToken: () => Promise<string | null>;
}

/**
 * Cloudflare Turnstile, run on demand at submit time.
 *
 * Two configuration choices do most of the work here:
 *
 *   - `execution: "execute"` means rendering the widget does not start a
 *     challenge. Nothing runs until getToken() is called. Tokens expire after
 *     five minutes, so minting one when the form opens would routinely hand
 *     the server a stale token from someone who paused to think about what to
 *     type.
 *
 *   - `appearance: "interaction-only"` means the widget occupies no space and
 *     shows nothing in the overwhelmingly common case where Cloudflare can
 *     decide from passive signals alone. It only becomes visible when a human
 *     actually has to click something.
 *
 * Together they keep the form exactly as it is for almost every visitor, which
 * matters more than usual here: the desktop panel lives inside a 245px-tall
 * picture frame with no room for a 65px widget, and permanently reserving that
 * space for a control that is almost never shown would have meant redesigning
 * the form around an anti-spam measure.
 */
export function useTurnstile(): UseTurnstile {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [challenging, setChallenging] = useState(false);

  /**
   * The in-flight getToken() call, if any. Turnstile reports its outcome
   * through callbacks registered at render time rather than by returning
   * anything from execute(), so the promise has to be parked somewhere those
   * callbacks can reach. A ref rather than state: settling it must not depend
   * on a re-render having happened.
   */
  const pendingRef = useRef<((token: string | null) => void) | null>(null);

  const settle = useCallback((token: string | null) => {
    const resolve = pendingRef.current;
    pendingRef.current = null;
    setChallenging(false);
    resolve?.(token);
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return;

    let cancelled = false;

    loadScript()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container || !window.turnstile) return;
        if (widgetIdRef.current !== null) return;

        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: SITE_KEY,
          execution: "execute",
          appearance: "interaction-only",
          // Shows up in the Cloudflare dashboard's analytics, so solve rates
          // for this widget can be read separately from any future one.
          action: "handprint",
          callback: (token: string) => settle(token),
          // A challenge failing and a challenge expiring before it was used are
          // different events with the same consequence here: no usable token.
          // The server decides what that means; this only has to not hang.
          "error-callback": () => {
            settle(null);
            return true;
          },
          "expired-callback": () => settle(null),
          "timeout-callback": () => settle(null),
          "before-interactive-callback": () => setChallenging(true),
          "after-interactive-callback": () => setChallenging(false),
        });
      })
      .catch((error) => {
        console.error("Turnstile unavailable:", error);
      });

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      // Leaving the widget behind leaks its iframe and its timers. The form
      // mounts and unmounts on every placement, so this is not a rare path.
      if (id !== null && window.turnstile) window.turnstile.remove(id);
    };
  }, [settle]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!SITE_KEY) return null;

    const id = widgetIdRef.current;
    if (id === null || !window.turnstile) return null;

    // A previous attempt may have left a consumed or expired token in the
    // widget. Tokens are single-use, so reset before every run rather than
    // trying to track whether the last one was spent.
    window.turnstile.reset(id);

    return new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => {
        // settle() goes through pendingRef, so this is a no-op if a callback
        // already fired and cleared it.
        if (pendingRef.current) settle(null);
      }, TOKEN_TIMEOUT_MS);

      pendingRef.current = (token) => {
        clearTimeout(timer);
        resolve(token);
      };

      window.turnstile!.execute(id);
    });
  }, [settle]);

  return { containerRef, challenging, enabled: Boolean(SITE_KEY), getToken };
}
