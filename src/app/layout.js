// src/app/layout.js
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";

const setThemeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (!t) {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    document.documentElement.classList.add(t === 'light' ? 'theme-light' : 'theme-dark');
  } catch (e) {}
})();
`;

// import { ThemeProvider } from "./theme-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Price Comparator",
  description: "Compare prices across retailers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* runs before React mounts so CSS variables are available immediately */}
        <script dangerouslySetInnerHTML={{ __html: setThemeScript }} />
        
      </head>
      <body className= " min-h-screen antialiased ">
        <ThemeToggle />
       
          <main>{children}</main>
        
      </body>
    </html>
  );
}
