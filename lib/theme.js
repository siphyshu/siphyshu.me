// The light switch's one move, shared by the switch itself and the search
// palette's "toggle dark theme" row: flip data-theme on <html> and remember
// the choice. app/theme-script.js reads the same key before first paint.
export const THEME_KEY = "theme";

export function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
        localStorage.setItem(THEME_KEY, next);
    } catch {}
}
