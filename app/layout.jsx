import "./globals.css";
import { CurtainProvider } from "@/components/backstage/Curtain";
import Footer from "@/components/ui/Footer";
import GameOfLifeBackground from "@/components/ui/GameOfLifeBackground";
import { getAge } from "@/lib/age";

export const metadata = {
  title: "siphyshu // jaiyank",
  description: `Personal website of Jaiyank aka Siphyshu. ${getAge()}y/o computer science student from India.`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
            <main className="flex-grow px-4 flex flex-col items-center">
              <div className="max-w-4xl w-full mx-auto">{children}</div>
            </main>
            <div className="max-w-4xl w-full mx-auto px-4 md:px-0">
              <Footer />
            </div>
          </div>
        </CurtainProvider>
      </body>
    </html>
  );
}
