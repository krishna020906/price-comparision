// src/app/layout.js
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import Script from "next/script";
import TopProviders from "@/components/TopProviders";

const setThemeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (!t) {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    document.documentElement.classList.add(t === 'light' ? 'theme-light' : 'theme-dark');

    // PREVENT FOUC: hide data-animate items until JS takes control
    // we add this class very early so the CSS rule html.preload-animations [data-animate] applies immediately
    document.documentElement.classList.add('preload-animations');
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
        {/* Lottie player CDN (available before interactive scripts) */}
        <Script
          src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className= " min-h-screen antialiased ">
        <ThemeToggle />
       
          <main>
            <TopProviders>
              {children}
            </TopProviders>
            </main>
        
      </body>
    </html>
  );
}
