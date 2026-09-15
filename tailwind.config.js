/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // The MDX body renderers. `mdx-components.tsx` sits at the repo root by
    // Next's file convention, so none of the globs above reach it, and every
    // class it names would otherwise be purged from the production CSS.
    "./mdx-components.tsx",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      keyframes: {
        // 'slide-up' lived here for the handprint form's entrance. That sheet
        // is now drag-driven and springs via Motion, and keyframes can't be
        // interrupted mid-gesture, so the class went with it.
        'float-z': {
          '0%': { 
            transform: 'translateY(10px)',
            opacity: '0'
          },
          '40%': { 
            transform: 'translateY(-4px)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(-20px)',
            opacity: '0'
          }
        }
      },
      animation: {
        'float-z': 'float-z 3s ease-out forwards'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: "class"
};
