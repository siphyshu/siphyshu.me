import "./globals.css";

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
      <body className="bg-white text-black">{children}</body>
    </html>
  );
}
