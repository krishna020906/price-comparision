// src/components/AnimationProvider.jsx
"use client";

import React, { createContext, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

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
    // Helper: restore inline display values that we temporarily forced
    const restoreDisplays = (changedList = []) => {
      changedList.forEach(({ el, hadPrev, prevValue }) => {
        try {
          if (hadPrev) el.style.setProperty("display", prevValue);
          else el.style.removeProperty("display");
        } catch (_) {}
      });
    };

    // Helper: reveal (fallback) — ensure visible and clear inline animation props
    const revealFallback = (els = []) => {
      try {
        if ((!els) || els.length === 0) return;
        gsap.set(els, { opacity: 1, y: 0, clearProps: "opacity,transform,willChange" });
      } catch (e) {
        (els || []).forEach(el => {
          try {
            el.style.opacity = "1";
            el.style.transform = "none";
            el.style.removeProperty("will-change");
          } catch (_) {}
        });
      }
    };

    // Choose reasonable display for forced elements
    const chooseDisplay = (el) => {
      const cls = (el.className || "").toString();
      if (/\binline-flex\b/.test(cls)) return "inline-flex";
      if (/\bflex\b/.test(cls)) return "flex";
      if (/\binline-block\b/.test(cls)) return "inline-block";
      const inlineTags = ["SPAN","A","I","EM","STRONG","SVG","BUTTON","LABEL"];
      if (inlineTags.includes(el.tagName)) return "inline-block";
      return "block";
    };

    // Collect elements that we will animate
    let allItems = [];
    try { allItems = gsap.utils.toArray("[data-animate]"); } catch (e) { allItems = []; }
    const elements = allItems.filter(el => el && el.nodeType === 1);

    // reduced motion: reveal and exit early
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      if (elements.length) revealFallback(elements);
      try { document.documentElement.classList.remove("preload-animations"); } catch (e) {}
      // still register functions so they can attach if needed
      registrations.current.forEach(fn => { try { fn && fn(tlRef.current); } catch (_) {} });
      tlRef.current.play();
      return;
    }

    // 1) Temporarily override display:none by forcing a reasonable display on hidden elements.
    //    Keep track of changes to restore later.
    const changed = [];
    elements.forEach(el => {
      try {
        const cs = window.getComputedStyle(el);
        if (cs.display === "none") {
          const prevInline = el.style && el.style.getPropertyValue("display");
          const hadPrev = prevInline !== "";
          const desired = chooseDisplay(el);
          // set inline display as important to reliably override Tailwind's hidden
          el.style.setProperty("display", desired, "important");
          changed.push({ el, hadPrev, prevValue: prevInline });
        }
      } catch (_) {}
    });

    // 2) Set inline hidden state (opacity:0, y:-6) via GSAP so JS fully controls the starting state
    if (elements.length) {
      try {
        gsap.set(elements, { opacity: 0, y: -6, clearProps: false });
      } catch (e) {
        elements.forEach(el => {
          try { el.style.opacity = "0"; el.style.transform = "translateY(-6px)"; el.style.willChange = "transform, opacity"; } catch(_) {}
        });
      }
    }

    // 3) Build timeline by invoking registrations (so they attach tweens to the shared timeline)
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
        } catch (err) {
          console.error("Registration threw:", err);
        }
      });
    } catch (e) {
      console.error("AnimationProvider build error:", e);
    }

    // 4) Remove CSS preload class — CSS no longer forcibly hides elements
    try { document.documentElement.classList.remove("preload-animations"); } catch (e) {}

    // 5) FORCE A LAYOUT / REPAINT so the inline display and inline styles take effect immediately.
    //    This is critical: it ensures the browser applies the inline display and the elements become
    //    renderable before we start the animation. Without this step animation may run while the element
    //    remains non-rendered/hidden.
    elements.forEach(el => {
      try { el.getBoundingClientRect(); } catch (_) {}
    });

    // 6) If timeline has no content, reveal immediately and restore displays
    const tlHasContent = (() => {
      try { return tlRef.current.totalDuration && tlRef.current.totalDuration() > 0; }
      catch (e) { try { return tlRef.current.duration && tlRef.current.duration() > 0; } catch { return false; } }
    })();

    if (!tlHasContent) {
      // nothing to animate — reveal now and restore inline displays
      revealFallback(elements);
      restoreDisplays(changed);
      tlRef.current.play();
      return;
    }

    // 7) Ensure restore happens after the timeline completes (and keep a guard so it's only restored once)
    let restored = false;
    const doRestore = () => {
      if (restored) return;
      restored = true;
      // clear inline transform/opacity props (apply final visible state first)
      try { gsap.set(elements, { opacity: 1, y: 0, clearProps: "transform,opacity,willChange" }); } catch (e) {
        elements.forEach(el => { try { el.style.opacity = "1"; el.style.transform = "none"; } catch(_){} });
      }
      // restore display inline values we temporarily set earlier
      restoreDisplays(changed);
    };

    // attach to timeline completion
    try {
      tlRef.current.eventCallback("onComplete", doRestore);
      // also attach to onInterrupt/kill to ensure restore on unmount or kill
      tlRef.current.eventCallback("onInterrupt", doRestore);
      tlRef.current.eventCallback("onReverseComplete", doRestore);
    } catch (e) {}

    // 8) Give the browser one more frame to apply styles, then play timeline
    requestAnimationFrame(() => {
      try {
        // Play the global timeline now that elements are rendered and styles applied
        tlRef.current.play();
      } catch (e) {
        console.error("Error playing timeline:", e);
        // fallback reveal and restore
        revealFallback(elements);
        doRestore();
      }
    });

    // cleanup on unmount
    return () => {
      created.forEach(t => t && t.kill && t.kill());
      try { tlRef.current.kill(); } catch (e) {}
      // ensure restoration if unmount happens early
      try { doRestore(); } catch (_) {}
    };
  }, []);

  return (
    <AnimationContext.Provider value={{ register, tl: tlRef.current }}>
      {children}
    </AnimationContext.Provider>
  );
}









// // src/components/AnimationProvider.jsx
// "use client";

// import React, { createContext, useRef, useEffect, useCallback } from "react";
// import gsap from "gsap";

// // Context gives children a register function and the timeline (if needed)
// export const AnimationContext = createContext({
//   register: () => {},
//   tl: null,
// });

// export default function AnimationProvider({ children, tlConfig = {} }) {
//   const tlRef = useRef(gsap.timeline({ paused: true, defaults: { ease: "power3.out" }, ...tlConfig }));
//   const registrations = useRef([]);

//   const register = useCallback((fn) => {
//     registrations.current.push(fn);
//     const idx = registrations.current.length - 1;
//     return () => { registrations.current[idx] = null; };
//   }, []);

//   useEffect(() => {
//     // Helper: reveal items immediately (fallback)
//     const revealAll = (els) => {
//       try {
//         if (!els || els.length === 0) return;
//         // set visible quickly and clear transform/opacity inline props so they look normal
//         gsap.set(els, { opacity: 1, y: 0, clearProps: "opacity,transform,willChange" });
//       } catch (err) {
//         // fallback manual DOM
//         (els || []).forEach(el => {
//           try {
//             el.style.opacity = "1";
//             el.style.transform = "none";
//             el.style.willChange = "auto";
//           } catch (_) {}
//         });
//       }
//     };

//     // collect elements (defensive)
//     let allItems = [];
//     try {
//       allItems = gsap.utils.toArray("[data-animate]");
//     } catch (e) {
//       allItems = [];
//     }
//     const elements = allItems.filter(el => el && el.nodeType === 1);

//     // reduced motion handling
//     const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
//     if (prefersReduced) {
//       if (elements.length) {
//         revealAll(elements);
//       }
//       try { document.documentElement.classList.remove("preload-animations"); } catch (e) {}
//       // still call registrations (optional)
//       registrations.current.forEach(fn => { try { fn && fn(tlRef.current); } catch (e) {} });
//       tlRef.current.play();
//       return;
//     }

//     // Take JS control of initial state so removing CSS won't flash
//     if (elements.length) {
//       try {
//         gsap.set(elements, { opacity: 0, y: -6, clearProps: false });
//       } catch (err) {
//         // fallback to direct DOM styles
//         elements.forEach(el => {
//           try {
//             el.style.opacity = "0";
//             el.style.transform = "translateY(-6px)";
//             el.style.willChange = "transform, opacity";
//           } catch (_) {}
//         });
//       }
//     }

//     // Build timeline: call each registration fn so they attach tweens to tlRef.current
//     const created = [];
//     try {
//       registrations.current.forEach(fn => {
//         if (!fn) return;
//         try {
//           const maybe = fn(tlRef.current);
//           if (maybe) {
//             if (Array.isArray(maybe)) created.push(...maybe);
//             else created.push(maybe);
//           }
//         } catch (e) {
//           console.error("Registration function threw:", e);
//         }
//       });
//     } catch (e) {
//       console.error("AnimationProvider build error:", e);
//     }

//     // Remove preload CSS class now that inline state exists
//     try { document.documentElement.classList.remove("preload-animations"); } catch (e) {}

//     // DEBUG: show counts — remove in production if you want
//     // eslint-disable-next-line no-console
//     console.log("AnimationProvider: registered fns:", registrations.current.filter(Boolean).length, "timeline children:", tlRef.current.getChildren().length, "timeline duration:", tlRef.current.duration());

//     // If the timeline actually has content, play it. Otherwise reveal immediately.
//     const tlHasContent = (() => {
//       try {
//         // totalDuration may be preferable if nested timelines used
//         return tlRef.current.totalDuration && tlRef.current.totalDuration() > 0;
//       } catch (e) {
//         return tlRef.current.duration && tlRef.current.duration() > 0;
//       }
//     })();

//     if (!tlHasContent) {
//       // no timeline content — reveal UI immediately so nothing stays hidden
//       revealAll(elements);
//       // still play the (empty) timeline to keep state consistent
//       try { tlRef.current.play(); } catch (_) {}
//       return;
//     }

//     requestAnimationFrame(() => {
//       try {
//         tlRef.current.play();
//         // When the timeline finishes, ensure everything is visible and clear temporary inline styles.
//         tlRef.current.eventCallback("onComplete", () => {
//           try {
//             const items = gsap.utils.toArray("[data-animate]");
//             // make sure final visible state is applied, and remove transform/opacity inline props
//             gsap.set(items, { opacity: 1, y: 0, clearProps: "transform,opacity,willChange" });
//             // remove any temporary inline display we may have set earlier
//             items.forEach(el => {
//               try { el.style.removeProperty("display"); } catch (e) {}
//             });
//           } catch (e) {
//             // fallback: iterate safely
//             const items = document.querySelectorAll("[data-animate]");
//             items.forEach(el => {
//               try {
//                 el.style.opacity = "1";
//                 el.style.transform = "none";
//                 el.style.removeProperty("display");
//               } catch (_) {}
//             });
//           }
//         });
//       } catch (e) {
//         console.error("Error playing timeline:", e);
//       }
//     });


//     // cleanup when provider unmounts
//     return () => {
//       created.forEach(t => t && t.kill && t.kill());
//       try { tlRef.current.kill(); } catch (e) {}
//     };
//     // run once
//   }, []);

//   return (
//     <AnimationContext.Provider value={{ register, tl: tlRef.current }}>
//       {children}
//     </AnimationContext.Provider>
//   );
// }
