import "./globals.css"

   export const metadata = {
     title: "siphyshu // jaiyank",
     description: "Personal website of Jaiyank",
   }

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>{children}</body>
       </html>
     )
   }