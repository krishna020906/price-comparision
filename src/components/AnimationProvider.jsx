// src/components/AnimationProvider.jsx
"use client";

import React, { createContext, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

// Context gives children a register function and the timeline (if needed)
export const AnimationContext = createContext({
  register: () => {},
  tl: null,
});

export default function AnimationProvider({ children, tlConfig = {} }) {
  const tlRef = useRef(gsap.timeline({ paused: true, defaults: { ease: "power3.out" }, ...tlConfig }));
  const registrations = useRef([]);

  const register = useCallback((fn) => {
    registrations.current.push(fn);
    const idx = registrations.current.length - 1;
    return () => { registrations.current[idx] = null; };
  }, []);

  useEffect(() => {
    // Helper: reveal items immediately (fallback)
    const revealAll = (els) => {
      try {
        if (!els || els.length === 0) return;
        // set visible quickly and clear transform/opacity inline props so they look normal
        gsap.set(els, { opacity: 1, y: 0, clearProps: "opacity,transform,willChange" });
      } catch (err) {
        // fallback manual DOM
        (els || []).forEach(el => {
          try {
            el.style.opacity = "1";
            el.style.transform = "none";
            el.style.willChange = "auto";
          } catch (_) {}
        });
      }
    };

    // collect elements (defensive)
    let allItems = [];
    try {
      allItems = gsap.utils.toArray("[data-animate]");
    } catch (e) {
      allItems = [];
    }
    const elements = allItems.filter(el => el && el.nodeType === 1);

    // reduced motion handling
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      if (elements.length) {
        revealAll(elements);
      }
      try { document.documentElement.classList.remove("preload-animations"); } catch (e) {}
      // still call registrations (optional)
      registrations.current.forEach(fn => { try { fn && fn(tlRef.current); } catch (e) {} });
      tlRef.current.play();
      return;
    }

    // Take JS control of initial state so removing CSS won't flash
    if (elements.length) {
      try {
        gsap.set(elements, { opacity: 0, y: -6, clearProps: false });
      } catch (err) {
        // fallback to direct DOM styles
        elements.forEach(el => {
          try {
            el.style.opacity = "0";
            el.style.transform = "translateY(-6px)";
            el.style.willChange = "transform, opacity";
          } catch (_) {}
        });
      }
    }

    // Build timeline: call each registration fn so they attach tweens to tlRef.current
    const created = [];
    try {
      registrations.current.forEach(fn => {
        if (!fn) return;
        try {
          const maybe = fn(tlRef.current);
          if (maybe) {
            if (Array.isArray(maybe)) created.push(...maybe);
            else created.push(maybe);
          }
        } catch (e) {
          console.error("Registration function threw:", e);
        }
      });
    } catch (e) {
      console.error("AnimationProvider build error:", e);
    }

    // Remove preload CSS class now that inline state exists
    try { document.documentElement.classList.remove("preload-animations"); } catch (e) {}

    // DEBUG: show counts — remove in production if you want
    // eslint-disable-next-line no-console
    console.log("AnimationProvider: registered fns:", registrations.current.filter(Boolean).length, "timeline children:", tlRef.current.getChildren().length, "timeline duration:", tlRef.current.duration());

    // If the timeline actually has content, play it. Otherwise reveal immediately.
    const tlHasContent = (() => {
      try {
        // totalDuration may be preferable if nested timelines used
        return tlRef.current.totalDuration && tlRef.current.totalDuration() > 0;
      } catch (e) {
        return tlRef.current.duration && tlRef.current.duration() > 0;
      }
    })();

    if (!tlHasContent) {
      // no timeline content — reveal UI immediately so nothing stays hidden
      revealAll(elements);
      // still play the (empty) timeline to keep state consistent
      try { tlRef.current.play(); } catch (_) {}
      return;
    }

    requestAnimationFrame(() => {
      try {
        tlRef.current.play();
        // When the timeline finishes, ensure everything is visible and clear temporary inline styles.
        tlRef.current.eventCallback("onComplete", () => {
          try {
            const items = gsap.utils.toArray("[data-animate]");
            // make sure final visible state is applied, and remove transform/opacity inline props
            gsap.set(items, { opacity: 1, y: 0, clearProps: "transform,opacity,willChange" });
            // remove any temporary inline display we may have set earlier
            items.forEach(el => {
              try { el.style.removeProperty("display"); } catch (e) {}
            });
          } catch (e) {
            // fallback: iterate safely
            const items = document.querySelectorAll("[data-animate]");
            items.forEach(el => {
              try {
                el.style.opacity = "1";
                el.style.transform = "none";
                el.style.removeProperty("display");
              } catch (_) {}
            });
          }
        });
      } catch (e) {
        console.error("Error playing timeline:", e);
      }
    });


    // cleanup when provider unmounts
    return () => {
      created.forEach(t => t && t.kill && t.kill());
      try { tlRef.current.kill(); } catch (e) {}
    };
    // run once
  }, []);

  return (
    <AnimationContext.Provider value={{ register, tl: tlRef.current }}>
      {children}
    </AnimationContext.Provider>
  );
}
