import "./globals.css";
import { CurtainProvider } from "@/components/backstage/Curtain";
import Footer from "@/components/ui/Footer";
import GameOfLifeBackground from "@/components/ui/GameOfLifeBackground";
import { getAge } from "@/lib/age";
import { sourceSerif } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  // Resolves every relative URL in metadata (canonical links, OG images)
  // against the real domain. Without it Next falls back to localhost.
  metadataBase: new URL(SITE_URL),
  title: "siphyshu // jaiyank",
  description: `Personal website of Jaiyank aka Siphyshu. ${getAge()}y/o computer science student from India.`,
};

export default function RootLayout({ children }) {
  return (
    // Declares --font-source-serif on <html>, where globals.css makes it the
    // site's --font-serif.
    <html lang="en" className={sourceSerif.variable}>
      {/* <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      </head> */}
      <body className="bg-white text-black">
        {/* Fixed behind everything, mounted once here so it keeps running
            (rather than reseeding) across client-side navigation. */}
        <GameOfLifeBackground />

        {/* Outermost, and specifically in the root layout: a root layout
            survives client-side navigation, so the curtain can close on one
            route and open on the next as one continuous animation. */}
        <CurtainProvider>
          {/* No bg-white here: this wrapper spans the full page height and
              sits in normal stacking order right above the fixed canvas,
              so painting it opaque would hide the texture everywhere.
              body's bg-white underneath is the paper the dots sit on. */}
          <div className="font-serif flex flex-col min-h-screen">
            {/* No width here: each route group sets its own. The site's pages
                sit in one 56rem column; the reader lays out on a grid whose
                breakouts need the whole viewport to reach into. */}
            <main className="flex-grow flex flex-col">{children}</main>
            {/* --site-width follows whichever layout is on screen (see
                globals.css), so the footer's hairline lines up with it. */}
            <div className="max-w-[var(--site-width)] w-full mx-auto px-4 md:px-0">
              <Footer />
            </div>
          </div>
        </CurtainProvider>
      </body>
    </html>
  );
}
