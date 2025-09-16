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
  // single timeline for the whole app (paused until we call play)
  const tlRef = useRef(gsap.timeline({ paused: true, defaults: { ease: "power3.out" }, ...tlConfig }));
  // registrations array: components push a function here that receives the timeline
  const registrations = useRef([]);

  // components will call register(fn) to add their animation builder
  const register = useCallback((fn) => {
    registrations.current.push(fn);
    const idx = registrations.current.length - 1;
    // return an unregister function (if component unmounts before build)
    return () => { registrations.current[idx] = null; };
  }, []);

  useEffect(() => {
    // 1) Collect candidate items
    let allItems = [];
    try {
      // returns an array (or []), of nodes matching the selector
      allItems = gsap.utils.toArray("[data-animate]");
    } catch (e) {
      allItems = [];
    }

    // Filter only real DOM elements (nodeType === 1)
    const elements = allItems.filter((el) => el && el.nodeType === 1);

    // If user prefers reduced motion: reveal and skip animations entirely.
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      if (elements.length) {
        try {
          gsap.set(elements, { opacity: 1, y: 0, clearProps: "all" });
        } catch (e) {
          // fallback direct DOM style set
          elements.forEach((el) => {
            try {
              el.style.opacity = "1";
              el.style.transform = "none";
            } catch (_) {}
          });
        }
      }
      try { document.documentElement.classList.remove("preload-animations"); } catch (e) {}
      // still call registrations so layout-related tweens can attach if needed
      registrations.current.forEach((fn) => { try { fn && fn(tlRef.current); } catch (err) {} });
      // optionally we can play timeline, but it's fine to leave it paused
      tlRef.current.play();
      return;
    }

    // 2) Ensure inline hidden state is set under JS control (prevents flash when removing CSS class)
    if (elements.length) {
      try {
        gsap.set(elements, { opacity: 0, y: -6, clearProps: false });
      } catch (err) {
        // If GSAP throws (e.g. some unexpected target), fall back to manual inline styles
        elements.forEach((el) => {
          try {
            el.style.opacity = "0";
            // apply transform with the same values as your CSS (translateY(-6px))
            el.style.transform = "translateY(-6px)";
            // keep will-change as a hint
            el.style.willChange = "transform, opacity";
          } catch (_) {}
        });
      }
    }

    // 3) Build timeline by calling all registration functions
    const created = [];
    try {
      registrations.current.forEach((fn) => {
        if (!fn) return;
        const maybe = fn(tlRef.current);
        if (maybe) {
          if (Array.isArray(maybe)) created.push(...maybe);
          else created.push(maybe);
        }
      });
    } catch (e) {
      console.error("AnimationProvider build error:", e);
    }

    // 4) Remove the preload CSS class now that JS owns inline state (prevents FOUC)
    try {
      document.documentElement.classList.remove("preload-animations");
    } catch (e) {
      // ignore
    }

    // 5) Play on the next frame so browser painted and everything is ready
    requestAnimationFrame(() => {
      try {
        tlRef.current.play();
      } catch (e) {
        console.error("Error playing timeline:", e);
      }
    });

    // cleanup when provider unmounts
    return () => {
      created.forEach((t) => t && t.kill && t.kill());
      try { tlRef.current.kill(); } catch (e) {}
    };
    // NOTE: run only once on mount
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
//   // single timeline for the whole app
//   const tlRef = useRef(gsap.timeline({ paused: true, defaults: { ease: "power3.out" }, ...tlConfig }));
//   // registrations array: components push a function here that receives the timeline
//   const registrations = useRef([]);

//   // components will call register(fn) to add their animation builder
//   const register = useCallback((fn) => {
//     registrations.current.push(fn);
//     const idx = registrations.current.length - 1;
//     // return an unregister function (if component unmounts before build)
//     return () => { registrations.current[idx] = null; };
//   }, []);

//   useEffect(() => {
//     // Build timeline by calling all registration functions
//     const created = [];
//     try {
//       registrations.current.forEach((fn) => {
//         if (!fn) return;
//         const maybe = fn(tlRef.current); // registration function builds animations on the shared timeline
//         if (maybe) {
//           if (Array.isArray(maybe)) created.push(...maybe);
//           else created.push(maybe);
//         }
//       });
//       // Play after a frame so browser painted and refs exist
//       requestAnimationFrame(() => tlRef.current.play());
//     } catch (e) {
//       console.error("AnimationProvider build error:", e);
//     }

//     // cleanup when provider unmounts
//     return () => {
//       created.forEach((t) => t && t.kill && t.kill());
//       try { tlRef.current.kill(); } catch (e) {}
//     };
//     // NOTE: run only once on mount
//   }, []);

//   return (
//     <AnimationContext.Provider value={{ register, tl: tlRef.current }}>
//       {children}
//     </AnimationContext.Provider>
//   );
// }
