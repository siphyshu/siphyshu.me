import "./globals.css";
import { SearchProvider } from "@/components/search/SearchContext";
import Footer from "@/components/ui/Footer";

export const metadata = {
  title: "siphyshu // jaiyank",
  description:
    "Personal website of Jaiyank aka Siphyshu. 20y/o computer science student from India.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      </head> */}
      <body className="bg-white text-black">
        <SearchProvider>
          <div className="bg-white font-serif flex flex-col min-h-screen">
            <main className="flex-grow px-4 flex flex-col items-center">
              <div className="max-w-4xl w-full mx-auto">{children}</div>
            </main>
            <div className="max-w-4xl w-full mx-auto">
              <Footer />
            </div>
          </div>
        </SearchProvider>
      </body>
    </html>
  );
}
