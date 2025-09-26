







// src/components/ProcessFlowSplit.jsx
"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);


// add this (temporary; remove after debugging)
if (typeof window !== "undefined") window._ScrollTrigger = ScrollTrigger;

/**
 * Defensive, debug-friendly version of the split flow.
 * - LineSection draws a path and reveals compare-step labels at 0%,25%,50%,75%
 * - BucketsSection animates when it enters view (thumbnails fly into buckets)
 *
 * If you want debug visuals for triggers set DEBUG_MARKERS=true below.
 */
const DEBUG_MARKERS = false;

export function LineSection({
  compFractions = [0, 0.25, 0.5, 0.75],
  compSteps = [
    "Data sent to server",
    "Data received by server",
    "Server comparing results",
    "Comparison complete"
  ]
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const moverRef = useRef(null);
  const compLabelRefs = useRef([]);

  // position compare labels on the path (deferred to allow layout to settle)
  useEffect(() => {
    function compute() {
      const svg = svgRef.current;
      const path = pathRef.current;
      if (!svg || !path) return;
      const rect = svg.getBoundingClientRect();
      const viewBox = svg.getAttribute("viewBox") || "0 0 1000 400";
      const [vbX, vbY, vbW, vbH] = viewBox.split(/\s+|,/).map(Number);
      let len;
      try { len = path.getTotalLength(); } catch (e) { len = 0; }

      compFractions.forEach((f, i) => {
        const pct = Math.min(Math.max(f, 0), 1);
        if (!len) return;
        const pt = path.getPointAtLength(len * pct);
        const pageX = rect.left + (pt.x * rect.width / vbW);
        const pageY = rect.top + (pt.y * rect.height / vbH);
        const el = compLabelRefs.current[i];
        if (el) {
          const dir = i % 2 === 0 ? -1 : 1;
          el.style.position = "absolute";
          el.style.left = `${Math.round(pageX + dir * 24)}px`;
          el.style.top = `${Math.round(pageY - 56)}px`;
        }
      });
    }

    // ensure compute runs after images/fonts/layout settle
    requestAnimationFrame(() => {
      compute();
      requestAnimationFrame(compute);
    });

    let tid;
    const onResize = () => {
      clearTimeout(tid);
      tid = setTimeout(() => compute(), 90);
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onResize, { passive: true });
    return () => {
      clearTimeout(tid);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [compFractions]);

  // build / run animations
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const mover = moverRef.current;
    if (!wrap || !svg || !path || !mover) {
      console.warn("LineSection: missing refs", { wrap, svg, path, mover });
      return;
    }

    // wait a frame to ensure the browser has measured the SVG (prevents weird 0 length)
    requestAnimationFrame(() => {
      let len = 0;
      try { len = path.getTotalLength(); } catch (e) { len = 0; }
      if (!len) {
        // fallback: make the path visible even if length can't be read
        path.style.opacity = "1";
        console.warn("LineSection: path.getTotalLength() returned 0 — forcing visible stroke");
      }

      const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        compLabelRefs.current.forEach(el => { if (el) el.style.opacity = 1; });
        return;
      }

      // defensive sets only if nodes exist
      gsap.set(path, { strokeDasharray: len || 1, strokeDashoffset: len || 0 });
      gsap.set(mover, { opacity: 0, scale: 0.96 });
      gsap.set(compLabelRefs.current.filter(Boolean), { opacity: 0, y: 10 });

      // matchMedia pinned timeline
      ScrollTrigger.matchMedia({
        "(min-width: 1024px)": () => buildTimeline({ pin: true, endExtra: 1400 }),
        "(max-width: 1023px)": () => buildTimeline({ pin: false, endExtra: 900 })
      });

      function buildTimeline({ pin = true, endExtra = 1000 }) {
        // clear previous triggers for this wrap
        ScrollTrigger.getAll().forEach(s => { if (s.trigger === wrap) s.kill(); });

        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: `+=${endExtra}`,
            scrub: 0.6,
            pin,
            anticipatePin: 1,
            markers: DEBUG_MARKERS
          }
        });

        // draw path & move along it (normalized 0..1)
        tl.to(path, { strokeDashoffset: 0, duration: 1, ease: "none" }, 0);
        tl.to(mover, {
          duration: 1,
          ease: "none",
          motionPath: {
            path,
            align: path,
            autoRotate: false,
            alignOrigin: [0.5, 0.5]
          },
          opacity: 1,
          scale: 1
        }, 0);

        // show compare labels at fractions
        compFractions.forEach((f, i) => {
          const tPos = Math.min(Math.max(f, 0), 0.995);
          const el = compLabelRefs.current[i];
          if (el) tl.to(el, { opacity: 1, y: 0, duration: 0.45 }, tPos);
        });

        return tl;
      }
    });

    // cleanup
    return () => {
      try { ScrollTrigger.getAll().forEach(s => s.kill()); } catch (_) {}
    };
  }, [compFractions, compSteps]);

  return (
    <section ref={wrapRef} className="relative w-full min-h-screen h-screen flex items-center justify-center" style={{ overflow: "hidden" }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg ref={svgRef} viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet" className="w-full max-w-screen-xl">
          <path
            ref={pathRef}
            d="M40,320 C220,40 420,40 580,120 C760,220 880,220 960,140"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.98 }}
          />
          <g ref={moverRef} style={{ pointerEvents: "none", opacity: 0 }}>
            <circle r="9" fill="var(--accent)" stroke="#fff" strokeWidth="1.4" />
          </g>
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {compSteps.map((txt, i) => (
          <div
            key={i}
            ref={el => (compLabelRefs.current[i] = el)}
            style={{ position: "absolute", transform: "translate(-50%,-50%)", opacity: 0 }}
          >
            <div style={{ background: "var(--card-surface)", color: "var(--text-primary)", border: "1px solid var(--border-soft)", padding: "8px 10px", borderRadius: 8 }}>
              <strong style={{ display: "block" }}>{txt}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Replace your BucketsSection with this implementation
// Replace your BucketsSection with this function (copy-paste)
export function BucketsSection({
  thumbs = ["/image_0.jpeg", "/image_1.jpeg", "/image_2.jpeg", "/image_1.jpeg"],
  labels = ["Amazon", "Flipkart", "Myntra", "BestPrice"]
}) {
  const wrapRef = useRef(null);
  const bucketRefs = useRef([]);
  const thumbPlaceholders = useRef([]);
  const bodyFlightLayer = useRef(null);

  // ensure an image has intrinsic size (same helper as before)
  const ensureImageReady = (imgEl) => {
    return new Promise((resolve) => {
      if (!imgEl) return resolve(false);
      if (imgEl.complete && imgEl.naturalWidth) return resolve(true);
      const onLoad = () => { cleanup(); resolve(true); };
      const onErr = () => { cleanup(); resolve(false); };
      const cleanup = () => { imgEl.removeEventListener("load", onLoad); imgEl.removeEventListener("error", onErr); };
      imgEl.addEventListener("load", onLoad);
      imgEl.addEventListener("error", onErr);
      setTimeout(() => { cleanup(); resolve(!!(imgEl.complete && imgEl.naturalWidth)); }, 1000);
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    // create a flight layer attached to document.body to avoid clipping / transforms
    const flight = document.createElement("div");
    flight.style.position = "fixed";
    flight.style.left = "0";
    flight.style.top = "0";
    flight.style.width = "100%";
    flight.style.height = "100%";
    flight.style.pointerEvents = "none";
    flight.style.zIndex = "2147483646";
    document.body.appendChild(flight);
    bodyFlightLayer.current = flight;

    let revealed = false;
    let seenInitial = false;
    let waitingForExit = false;

    const revealBuckets = async () => {
      if (revealed) return;
      revealed = true;
      console.info("[Buckets] revealBuckets() triggered");

      const buckets = bucketRefs.current.filter(Boolean);
      gsap.fromTo(
        buckets,
        { y: 18, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.09, duration: 0.7, ease: "power3.out" }
      );

      await new Promise(r => requestAnimationFrame(r));

      await Promise.all(thumbPlaceholders.current.map(async (ph, idx) => {
        if (!ph) return false;
        const img = ph.querySelector("img");
        const ok = await ensureImageReady(img);
        console.info(`[Buckets] thumb ${idx} image ready:`, ok, img && img.naturalWidth);
        return ok;
      }));

      setTimeout(() => {
        thumbPlaceholders.current.forEach((ph, i) => {
          try {
            if (!ph) return;
            const phRect = ph.getBoundingClientRect();
            const bucket = bucketRefs.current[i];
            if (!bucket) return;
            const bucketRect = bucket.getBoundingClientRect();

            const clone = ph.cloneNode(true);
            clone.style.position = "absolute";
            clone.style.left = `${phRect.left}px`;
            clone.style.top = `${phRect.top}px`;
            clone.style.width = `${phRect.width}px`;
            clone.style.height = `${phRect.height}px`;
            clone.style.margin = "0";
            clone.style.zIndex = 2147483647;
            clone.style.pointerEvents = "none";
            clone.style.border = "2px solid rgba(255,255,255,0.08)";
            clone.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)";
            clone.style.borderRadius = getComputedStyle(ph).borderRadius || "8px";
            flight.appendChild(clone);

            const targetX = bucketRect.left + bucketRect.width / 2 - phRect.width / 2;
            const targetY = bucketRect.top + bucketRect.height / 2 - phRect.height / 2;

            gsap.to(clone, {
              duration: 0.95,
              x: targetX - phRect.left,
              y: targetY - phRect.top,
              scale: 0.8,
              ease: "power3.inOut",
              onComplete: () => {
                try {
                  let content = bucket.querySelector(".bucket-content");
                  if (!content) {
                    content = document.createElement("div");
                    content.className = "bucket-content";
                    content.style.display = "flex";
                    content.style.gap = "8px";
                    content.style.alignItems = "center";
                    content.style.marginTop = "10px";
                    bucket.appendChild(content);
                  }
                  const img = document.createElement("img");
                  const srcImg = clone.querySelector("img");
                  img.src = srcImg ? srcImg.src : "";
                  img.style.width = "64px";
                  img.style.height = "64px";
                  img.style.objectFit = "cover";
                  img.style.borderRadius = "8px";
                  content.appendChild(img);
                } catch (e) { console.warn("append to bucket failed", e); }
                clone.remove();
                console.info(`[Buckets] thumb ${i} flight complete`);
              }
            });
          } catch (e) {
            console.warn("fly-thumb error for index", i, e);
          }
        });
      }, 520);
    };

    // expose for manual testing (optional)
    if (typeof window !== "undefined") window.__revealBuckets = revealBuckets;

    // IntersectionObserver that ignores the initial "already-in-view" callback:
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!seenInitial) {
          // first callback: mark we've seen the initial state and decide behavior
          seenInitial = true;
          if (entry.isIntersecting) {
            // section is already in view at mount — wait for an exit+reenter
            waitingForExit = true;
            console.info("[Buckets IO] initially in view — waiting for exit then re-enter to reveal");
          } else {
            // not in view initially — reveal when it enters
            console.info("[Buckets IO] initially out of view — will reveal on first intersection");
            if (entry.isIntersecting) revealBuckets();
          }
          continue;
        }

        // subsequent observations:
        if (waitingForExit) {
          if (!entry.isIntersecting) {
            // user scrolled away — now next enter will trigger reveal
            waitingForExit = false;
            console.info("[Buckets IO] left view — now will reveal on next enter");
          }
        } else {
          if (entry.isIntersecting) {
            // normal enter
            revealBuckets();
          }
        }
      }
    }, { threshold: 0.25 });

    io.observe(wrap);

    // cleanup
    return () => {
      try { io.disconnect(); } catch (_) {}
      if (typeof window !== "undefined" && window.__revealBuckets) delete window.__revealBuckets;
      try { if (bodyFlightLayer.current) { bodyFlightLayer.current.remove(); bodyFlightLayer.current = null; } } catch (_) {}
    };
  }, []);

  return (
    <section
      ref={wrapRef}
      className="relative w-full min-h-screen h-screen flex items-center justify-center bg-transparent"
      style={{ overflow: "hidden" }}
    >
      <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-3xl font-bold mb-3">How we find the best price</h3>
          <p className="text-muted mb-6">Buckets collect products — cheapest pops out after comparison.</p>

          <div className="grid grid-cols-2 gap-4">
            {[0,1,2,3].map(i => (
              <div
                key={i}
                ref={el => (bucketRefs.current[i] = el)}
                className="bucket p-4 rounded-xl"
                style={{
                  background: "var(--card-surface)",
                  border: "1px solid var(--border-soft)",
                  boxShadow: "var(--card-shadow)",
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  opacity: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),#0b63ff88)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                    B{i+1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{labels[i]}</div>
                    <div className="text-sm text-muted">Products collected</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex gap-4 mb-6" style={{ alignItems: "center" }}>
            {thumbs.map((src, i) => (
              <div
                key={i}
                ref={el => (thumbPlaceholders.current[i] = el)}
                style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", background: "var(--card-surface)", border: "1px solid var(--border-soft)", boxShadow: "var(--card-shadow)" }}
              >
                <img src={src} alt={`thumb-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>

          <div className="text-sm text-muted">Scroll to watch the comparison. Buckets animate when this section enters view.</div>
        </div>
      </div>
    </section>
  );
}



/* Combined default export */
export default function ProcessFlowSplit(props) {
  return (
    <div >
      <LineSection />
      <BucketsSection />
    </div>
  );
}















// // src/components/ProcessFlow.jsx
// "use client";

// import React, { useRef, useEffect } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { MotionPathPlugin } from "gsap/MotionPathPlugin";

// gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// export default function ProcessFlow() {
//   const containerRef = useRef(null);
//   const svgPathRef = useRef(null);
//   const moverRef = useRef(null);
//   const nodesRef = useRef([]);
//   const labelsRef = useRef([]);

//   useEffect(() => {
//     // safety: bail if no window (shouldn't happen in client component)
//     if (typeof window === "undefined") return;

//     // reduced motion support
//     const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
//     if (prefersReduced) {
//       // reveal final state without scroll-driven motion
//       const path = svgPathRef.current;
//       if (path) {
//         path.style.strokeDashoffset = "0";
//       }
//       nodesRef.current.forEach((n) => {
//         if (n) n.style.opacity = "1";
//       });
//       labelsRef.current.forEach(l => { if (l) l.style.opacity = "1"; });
//       return;
//     }

//     const pathEl = svgPathRef.current;
//     if (!pathEl) return;

//     // path length for stroke-draw technique
//     const pathLen = pathEl.getTotalLength();
//     gsap.set(pathEl, { strokeDasharray: pathLen, strokeDashoffset: pathLen });

//     // ensure the mover and nodes start hidden/off-state (provider will also do FOUC prevention)
//     gsap.set(moverRef.current, { opacity: 0, scale: 0.9 });
//     gsap.set(nodesRef.current, { opacity: 0, scale: 0.92 });
//     gsap.set(labelsRef.current, { opacity: 0, y: 8 });

//     const tl = gsap.timeline({
//       defaults: { ease: "power2.out" },
//       scrollTrigger: {
//         trigger: containerRef.current,
//         start: "top center",
//         end: "bottom+=60% center",
//         scrub: 0.7,   // smooth scrub — increases feel, tune as desired
//         pin: true,    // pins the section while the animation plays
//         anticipatePin: 1,
//       },
//     });

//     // 1) draw the path progressively
//     tl.to(pathEl, { strokeDashoffset: 0, duration: 1, ease: "none" }, 0);

//     // 2) move the "collector" dot along the path while the path draws
//     tl.to(moverRef.current, {
//       duration: 1,
//       ease: "none",
//       motionPath: {
//         path: pathEl,
//         align: pathEl,
//         autoRotate: false,
//         alignOrigin: [0.5, 0.5],
//       },
//       opacity: 1,
//       scale: 1,
//     }, 0);

//     // 3) when the dot reaches some point, reveal site nodes (diffusion / branching)
//     //    stagger the nodes so they "pop" as data points are discovered
//     tl.to(nodesRef.current, {
//       opacity: 1,
//       scale: 1,
//       duration: 0.6,
//       stagger: 0.12,
//       ease: "back.out(1.1)",
//     }, 0.6);

//     // 4) diffuse effect: small ripple circles (we'll use CSS pseudo elements or inline elements — here we animate small SVG circles)
//     //    We'll animate a small scale/alpha pulse inside each node to give feeling of data spreading
//     nodesRef.current.forEach((node, i) => {
//       const pulse = node.querySelector(".pulse");
//       if (pulse) {
//         tl.fromTo(pulse, { opacity: 0.45, scale: 0.2 }, {
//           opacity: 0,
//           scale: 2.6,
//           duration: 1.2,
//           repeat: 0,
//           ease: "power1.out",
//         }, 0.8 + i * 0.06);
//       }
//     });

//     // 5) show textual steps explaining backend process (crawl -> normalize -> compare -> return)
//     tl.to(labelsRef.current[0], { opacity: 1, y: 0, duration: 0.45 }, 1.1);
//     tl.to(labelsRef.current[1], { opacity: 1, y: 0, duration: 0.45 }, 1.25);
//     tl.to(labelsRef.current[2], { opacity: 1, y: 0, duration: 0.45 }, 1.35);
//     tl.to(labelsRef.current[3], { opacity: 1, y: 0, duration: 0.45 }, 1.45);

//     // 6) highlight the "best price" result node at the end
//     tl.to(nodesRef.current, { filter: "grayscale(0.0) drop-shadow(0 8px 24px rgba(0,0,0,0.14))", duration: 0.6 }, 1.6);
//     tl.to(nodesRef.current[nodesRef.current.length - 1], { scale: 1.14, duration: 0.55, ease: "elastic.out(1,0.6)" }, 1.6);

//     // cleanup on unmount
//     return () => {
//       try {
//         if (tl) tl.kill();
//         ScrollTrigger.getAll().forEach(st => st.kill());
//       } catch (e) {}
//     };
//   }, []);

//   // helper to map refs for nodes and labels
//   const setNodeRef = (el, idx) => { nodesRef.current[idx] = el; };
//   const setLabelRef = (el, idx) => { labelsRef.current[idx] = el; };

//   return (
//     <section ref={containerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
//         {/* Left: explanation and labels (these animate in) */}
//         <div className="space-y-6">
//           <h2 className="text-3xl font-bold">How Price Compare Works</h2>
//           <p className="text-muted max-w-xl">
//             We search many stores, standardize the results and pick the best price for you.
//             Scroll to see the system in action.
//           </p>

//           <div className="mt-6 space-y-4">
//             <div ref={(el) => setLabelRef(el, 0)} className="opacity-0">
//               <strong>1. Crawl</strong> — fetch product listings from stores.
//             </div>
//             <div ref={(el) => setLabelRef(el, 1)} className="opacity-0">
//               <strong>2. Normalize</strong> — unify titles, SKUs and convert currencies.
//             </div>
//             <div ref={(el) => setLabelRef(el, 2)} className="opacity-0">
//               <strong>3. Compare</strong> — align variants and compare prices.
//             </div>
//             <div ref={(el) => setLabelRef(el, 3)} className="opacity-0">
//               <strong>4. Return</strong> — show you the lowest price and where to buy.
//             </div>
//           </div>
//         </div>

//         {/* Right: visual SVG flow */}
//         <div className="order-first lg:order-last flex justify-center">
//           <svg viewBox="0 0 800 480" preserveAspectRatio="xMidYMid meet" className="w-full max-w-xl">
//             {/* curved path */}
//             <path
//               ref={svgPathRef}
//               d="M60,60 C210,20 420,20 560,80 C660,120 720,200 740,300"
//               fill="none"
//               stroke="var(--accent)"
//               strokeWidth="3"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               style={{ opacity: 0.95 }}
//             />

//             {/* site nodes placed manually along the displayed layout */}
//             {/* node 0 */}
//             <g transform="translate(150,70)">
//               <circle className="node" r="14" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2" ref={(el) => setNodeRef(el, 0)} aria-hidden="true">
//               </circle>
//               <circle className="pulse" r="10" fill="var(--accent)" opacity="0.1" transform="scale(0.2)"></circle>
//             </g>

//             {/* node 1 */}
//             <g transform="translate(330,60)">
//               <circle className="node" r="14" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2" ref={(el) => setNodeRef(el, 1)} aria-hidden="true"></circle>
//               <circle className="pulse" r="10" fill="var(--accent)" opacity="0.1" transform="scale(0.2)"></circle>
//             </g>

//             {/* node 2 */}
//             <g transform="translate(510,110)">
//               <circle className="node" r="14" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2" ref={(el) => setNodeRef(el, 2)} aria-hidden="true"></circle>
//               <circle className="pulse" r="10" fill="var(--accent)" opacity="0.1" transform="scale(0.2)"></circle>
//             </g>

//             {/* node 3 (final best price) */}
//             <g transform="translate(680,260)">
//               <circle className="node" r="16" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" ref={(el) => setNodeRef(el, 3)} aria-hidden="true"></circle>
//               <circle className="pulse" r="14" fill="var(--accent)" opacity="0.08" transform="scale(0.2)"></circle>
//             </g>

//             {/* moving dot (collector) */}
//             <g ref={moverRef} transform="translate(0,0)" style={{ pointerEvents: "none", opacity: 0 }}>
//               <circle r="8" fill="var(--accent)" stroke="#fff" strokeWidth="1.5" />
//             </g>
//           </svg>
//         </div>
//       </div>
//     </section>
//   );
// }
