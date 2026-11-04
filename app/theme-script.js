// Runs in <head> before the first paint (see app/layout.jsx), so the page is
// drawn in the right theme from the start: a visitor who chose dark never sees
// a white flash. Sets data-theme on <html> from the light switch's saved
// choice, else light — the OS preference is deliberately ignored, so a first
// visit always sees the site as it was made. Keeps following other tabs
// flipping the switch for as long as the page is open. The <html> element
// survives client-side navigation, so the listener is registered exactly once.
//
// Hand-written rather than next-themes: its script is rendered from a client
// component, which React 19 warns about on every page.
export const THEME_SCRIPT = `(function () {
  var root = document.documentElement;
  function apply() {
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    root.dataset.theme = saved === "dark" ? "dark" : "light";
  }
  apply();
  addEventListener("storage", function (e) { if (e.key === "theme") apply(); });
})();`;
