
"use client";

import React, { useEffect, useState } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import { useRef } from 'react';
import { useRegisterAnimation } from "@/lib/useRegisterAnimation";
import gsap from "gsap";

/**
 * src/components/Hero.jsx
 * Uses @lottiefiles/react-lottie-player (client component) to avoid <lottie-player> race issues.
 * Expects JSON at: /animations/digital-marketing/digital-marketing.json
 */


export default function Hero() {
  const heroRef = useRef(null);
  useRegisterAnimation((tl) => {
    // find our items inside this hero
    const headline = heroRef.current.querySelector("[data-animate='hero-headline']");
    const sub = heroRef.current.querySelector("[data-animate='hero-sub']");
    const ctaButtons = gsap.utils.toArray(heroRef.current.querySelectorAll("[data-animate='hero-cta']"));
    const lottieWrap = heroRef.current.querySelector("[data-animate='hero-lottie']");

    // safety: build an ordered array for text elements
    const textItems = [headline, sub].filter(Boolean);

    // animate text items first (stagger)
    if (textItems.length) {
      tl.fromTo(
        textItems,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 1.5, stagger: 0.5, ease: "power2.out" },
        // no position param -> appended to timeline in registration order
      );
    }

    // then animate CTAs (buttons)
    if (ctaButtons.length) {
      tl.fromTo(
        ctaButtons,
        { opacity: 0, y: 40, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.3, ease: "back.out(1.1)" },
        // appended after previous
      );
    }

    // finally bring in the lottie illustration (slightly later)
    if (lottieWrap) {
      tl.fromTo(
        lottieWrap,
        { opacity: 0, x: 40, scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "power2.out" },
      );
    }

    // returning nothing is fine — this builds into the shared timeline
  }, []); // no deps


  const jsonUrl = "/animations/digital-marketing/abc.json";
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // sanity-check the JSON exists before rendering the Player (avoids silent failures)
  useEffect(() => {
    let cancelled = false;
    fetch(jsonUrl, { method: "GET" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(() => {
        if (!cancelled) setIsLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Failed to load animation");
      });
    return () => { cancelled = true; };
  }, [jsonUrl]);

  return (
    <section ref={heroRef} className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* LEFT: Text */}
          <div className="space-y-6">
            <h1 data-animate="hero-headline" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
              TIRED OF MANUAL PRICE CHECKS?
            </h1>

            <p data-animate="hero-sub" className="text-md sm:text-lg max-w-xl" style={{ color: "var(--text-muted)" }}>
              from different e-commerce websites — don’t worry, we’ll do the hard work for you. Get fast price comparisons
              across stores so you always get the best deal.
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              <a data-animate="hero-cta" href="#get-started" className="ecom-btn inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm shadow-sm" role="button" aria-label="Get started">
                Get started
              </a>

              <a data-animate="hero-cta" href="#learn-more" className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm border"
                 style={{ borderColor: "var(--border-soft)", color: "var(--text-primary)", background: "transparent" }} aria-label="Learn more">
                Learn more
              </a>
            </div>

            <div data-animate="hero-cta" className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
              No sign-up required to try — we respect your privacy.
            </div>
          </div>

          {/* RIGHT: React Lottie Player */}
          <div  className="flex items-center justify-center">
            <div data-animate="hero-lottie" className="w-full max-w-md lg:max-w-lg" style={{ background: "transparent" }}>
              {loadError ? (
                <div className="p-6 text-center" style={{ color: "var(--text-muted)" }}>
                  Animation failed to load: {loadError}
                </div>
              ) : !isLoaded ? (
                <div className="h-64 flex items-center justify-center rounded-lg" style={{ background: "var(--card-surface)", border: "1px solid var(--border-soft)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Loading animation…</span>
                </div>
              ) : (
                <Player
                  src={jsonUrl}
                  autoplay
                  loop
                  keepLastFrame={false}
                  speed={1}
                  style={{ width: "100%", maxWidth: 500 }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}










// // import React from 'react';

// // export default function Hero() {
// //   return (
// //     <section className="w-full">
// //       <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
// //           {/* LEFT: Text */}
// //           <div className="space-y-6">
// //             <h1
// //               className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight"
// //               style={{ color: 'var(--text-primary)' }}
// //             >
// //               TIRED OF MANUAL PRICE CHECKS?
// //             </h1>

// //             <p className="text-md sm:text-lg max-w-xl" style={{ color: 'var(--text-muted)' }}>
// //               from different e‑commerce websites — don’t worry, we’ll do the hard work for you. Get fast price comparisons
// //               across stores so you always get the best deal.
// //             </p>

// //             <div className="flex flex-wrap gap-3 mt-4">
// //               <a
// //                 href="#get-started"
// //                 className="ecom-btn inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm shadow-sm"
// //                 role="button"
// //                 aria-label="Get started"
// //               >
// //                 Get started
// //               </a>

// //               <a
// //                 href="#learn-more"
// //                 className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm border"
// //                 style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)', background: 'transparent' }}
// //                 aria-label="Learn more"
// //               >
// //                 Learn more
// //               </a>
// //             </div>

// //             <div className="mt-6 text-sm text-muted" style={{ color: 'var(--text-muted)' }}>
// //               No sign-up required to try — we respect your privacy.
// //             </div>
// //           </div>

// //           {/* RIGHT: Lottie animation */}
// //           <div className="flex items-center justify-center">
// //             <div className="w-full max-w-md lg:max-w-lg">
// //               <lottie-player
// //                 src="/animations/Digital-Marketing.lottie"
// //                 background="transparent"
// //                 speed="1"
// //                 style={{ width: '100%', maxWidth: '500px' }}
// //                 loop
// //                 autoplay
// //               ></lottie-player>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </section>
// //   );
// // }
