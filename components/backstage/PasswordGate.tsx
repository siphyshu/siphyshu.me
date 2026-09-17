"use client";

import { useActionState } from "react";
import { unlockAction, type UnlockState } from "@/app/backstage/actions";

const INITIAL: UnlockState = { error: null };

export default function PasswordGate() {
  const [state, formAction, pending] = useActionState(unlockAction, INITIAL);

  return (
    <div className="max-w-md mx-auto pt-24 pb-32">
      <h1 className="text-2xl">backstage</h1>
      <p className="mt-3 text-gray-600 leading-relaxed">
        Nothing here is finished. That's rather the point.
      </p>

      <form action={formAction} className="mt-8">
        <label htmlFor="backstage-password" className="sr-only">
          Password
        </label>
        <input
          id="backstage-password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          placeholder="Password"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "backstage-error" : undefined}
          className={`w-full border px-4 py-2.5 bg-white text-sm focus:outline-none focus:border-black transition-colors ${
            state.error ? "border-red-400" : "border-gray-300"
          }`}
        />

        <button
          type="submit"
          disabled={pending}
          className="mt-3 w-full border border-black px-4 py-2.5 text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
        >
          {pending ? "Checking…" : "Unlock"}
        </button>

        {/* Reserves its own line whether or not there's an error, so the
            button doesn't jump when one appears. */}
        <p
          id="backstage-error"
          role="status"
          aria-live="polite"
          className="mt-3 text-sm text-red-500 min-h-[1.25rem]"
        >
          {state.error}
        </p>
      </form>
    </div>
  );
}
