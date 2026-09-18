"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Split in two so that registering a toolbar (which only ever needs the
// setter) doesn't also subscribe the page to the *value* — a page's own
// registration effect would otherwise re-fire every time the value it just
// set changes, which is every time it runs, forever. Only NavBar needs the
// value; setActions from useState is referentially stable across renders,
// so pages consuming only this context never re-render because of it.
const SetActionsContext = createContext(() => {});
const ActionsValueContext = createContext(null);

export function NavActionsProvider({ children }) {
    const [actions, setActions] = useState(null);
    return (
        <SetActionsContext.Provider value={setActions}>
            <ActionsValueContext.Provider value={actions}>
                {children}
            </ActionsValueContext.Provider>
        </SetActionsContext.Provider>
    );
}

/**
 * Registers a page's per-section toolbar into the shared NavBar. NavBar lives
 * in the shared layout, above whichever page is currently rendering, so a
 * page can't just hand it a prop — this is the bridge. No dependency array:
 * it needs to re-register on every render so the toolbar shown always
 * reflects the page's latest filter state, and it clears on unmount so
 * navigating away never leaves a stale toolbar showing on another section.
 */
export function useNavActions(node) {
    const setActions = useContext(SetActionsContext);
    useEffect(() => {
        setActions(node);
        return () => setActions(null);
    });
}

export function useNavActionsValue() {
    return useContext(ActionsValueContext);
}
