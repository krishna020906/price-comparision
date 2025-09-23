// src/components/ProcessFlowBuckets.jsx
"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export default function ProcessFlowBuckets({
  fractions = [0.18, 0.42, 0.66, 0.88],
  labels = ["Amazon", "Flipkart", "eBay", "Others"],
  thumbs = [
    "/image_0.jpeg", // place your images in public/images/
    "/image_1.jpeg",
    "/image_2.jpeg",
    "/image_3.jpeg",
  ],
  // prices mapped to thumbs (same order). pick realistic MacBook-like prices:
  prices = [2399, 2199, 1999, 2499],
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const moverRef = useRef(null);
  const thumbRefs = useRef([]);
  const labelRefs = useRef([]);
  const bucketRefs = useRef([]);
  const bucketContents = useRef([]); // store appended thumbnails per bucket
  const flightLayerRef = useRef(null);
  const compareTextRefs = useRef([]);
  const winnerTagRef = useRef(null);

  // position thumbs & labels over SVG points
  useEffect(() => {
    const computePositions = () => {
      const path = pathRef.current;
      const svg = svgRef.current;
      if (!path || !svg) return;
      const svgRect = svg.getBoundingClientRect();
      const viewBox = svg.getAttribute("viewBox") || "0 0 1000 400";
      const [vbX, vbY, vbW, vbH] = viewBox.split(/\s+|,/).map(Number);
      const pathLen = path.getTotalLength();

      fractions.forEach((f, i) => {
        const pct = Math.min(Math.max(f, 0), 1);
        const pt = path.getPointAtLength(pathLen * pct);
        const scaleX = svgRect.width / vbW;
        const scaleY = svgRect.height / vbH;
        const pageX = svgRect.left + pt.x * scaleX;
        const pageY = svgRect.top + pt.y * scaleY;

        const thumb = thumbRefs.current[i];
        const label = labelRefs.current[i];
        if (thumb) {
          // center the thumbnail on the path point
          thumb.style.position = "absolute";
          thumb.style.left = `${Math.round(pageX - thumb.offsetWidth / 2)}px`;
          thumb.style.top = `${Math.round(pageY - thumb.offsetHeight / 2)}px`;
        }
        if (label) {
          const dir = i % 2 === 0 ? -1 : 1;
          const offsetX = 36 * dir;
          label.style.position = "absolute";
          label.style.left = `${Math.round(pageX + offsetX)}px`;
          label.style.top = `${Math.round(pageY - 46)}px`;
        }
      });

      // position buckets too (they are in the layout; but we ensure nothing crazy)
      // bucket positions are their DOM layout positions (no change needed)
    };

    computePositions();
    let t;
    const handle = () => {
      clearTimeout(t);
      t = setTimeout(computePositions, 100);
    };
    window.addEventListener("resize", handle);
    // also compute on scroll because bounding boxes may change with layout
    window.addEventListener("scroll", handle, { passive: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle);
    };
  }, [fractions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const mover = moverRef.current;
    const flightLayer = flightLayerRef.current;

    if (!wrap || !svg || !path || !mover || !flightLayer) return;

    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // reveal final state
      thumbRefs.current.forEach(t => { if (t) t.style.opacity = 1; });
      compareTextRefs.current.forEach(t => { if (t) t.style.opacity = 1; });
      return;
    }

    // prepare drawing
    const pathLen = path.getTotalLength();
    gsap.set(path, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
    gsap.set(mover, { opacity: 0, scale: 0.96 });
    gsap.set(thumbRefs.current, { opacity: 0, y: 8, scale: 0.97 });
    gsap.set(labelRefs.current, { opacity: 0, y: 8 });

    // clear any stored bucket content
    bucketContents.current = bucketRefs.current.map(() => []);

    // pick matchMedia behavior: pin on large screens only
    const mm = ScrollTrigger.matchMedia({
      "(min-width: 1024px)": function() {
        buildTimeline({ pin: true, endExtra: 1600 });
      },
      "(max-width: 1023px)": function() {
        buildTimeline({ pin: false, endExtra: 900 });
      }
    });

    function buildTimeline({ pin = true, endExtra = 1200 }) {
      // remove any existing triggers attached to this wrap
      ScrollTrigger.getAll().forEach(s => { if (s.trigger === wrap) s.kill(); });

      // create timeline normalized 0..1
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: `+=${endExtra}`,
          scrub: 0.6,
          pin,
          anticipatePin: 1,
        }
      });

      // draw path (0..1)
      tl.to(path, { strokeDashoffset: 0, duration: 1, ease: "none" }, 0);
      // mover follows path
      tl.to(mover, {
        duration: 1,
        ease: "none",
        motionPath: {
          path,
          align: path,
          autoRotate: false,
          alignOrigin: [0.5, 0.5],
        },
        opacity: 1,
        scale: 1,
      }, 0);

      // schedule thumbnails to appear and fly into their buckets
      fractions.forEach((f, i) => {
        const appearTime = Math.min(Math.max(f, 0.01), 0.99);
        const direction = i % 2 === 0 ? -1 : 1;
        const startX = 80 * direction;

        // thumbnail slide-in / pop near path
        tl.fromTo(thumbRefs.current[i],
          { opacity: 0, x: startX, y: 6, scale: 0.95 },
          { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.1)" },
          appearTime
        );

        // label fades in after
        tl.to(labelRefs.current[i], { opacity: 1, y: 0, duration: 0.36 }, appearTime + 0.04);

        // schedule the flying to bucket a touch later
        tl.call(() => {
          flyThumbToBucket(i);
        }, null, appearTime + 0.2);
      });

      // After the path finishes (near end), animate buckets forward and run comparison narration
      // We'll append bucket animation at 1.02 .. 1.30 normalized timeline
      const bucketStart = 1.02;
      // buckets pop forward (stagger)
      tl.to(bucketRefs.current, {
        scale: 1.06,
        y: -8,
        boxShadow: "0 18px 50px rgba(2,6,23,0.12)",
        duration: 0.6,
        stagger: 0.08,
        ease: "elastic.out(1,0.6)"
      }, bucketStart);

      // then the compare text sequence (example timings)
      const textBase = bucketStart + 0.5;
      const steps = [
        "Data sent to server",
        "Server received data",
        "Server working hard to compare",
        "Comparison complete"
      ];
      steps.forEach((txt, idx) => {
        tl.to(compareTextRefs.current[idx], { opacity: 1, y: 0, duration: 0.45 }, textBase + idx * 0.45);
      });

      // after comparison, reveal winner (lowest price)
      tl.call(() => {
        revealWinner();
      }, null, textBase + steps.length * 0.45 + 0.12);

      return tl;
    }

    // fly a thumbnail into its bucket (clone technique)
    function flyThumbToBucket(i) {
      try {
        const thumb = thumbRefs.current[i];
        const bucket = bucketRefs.current[i];
        if (!thumb || !bucket) return;

        const rect = thumb.getBoundingClientRect();
        const bucketRect = bucket.getBoundingClientRect();

        // clone and animate in flight layer
        const clone = thumb.cloneNode(true);
        clone.style.position = "absolute";
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.margin = "0";
        clone.style.zIndex = 99999;
        clone.style.pointerEvents = "none";
        flightLayerRef.current.appendChild(clone);

        const targetX = bucketRect.left + bucketRect.width / 2 - rect.width / 2;
        const targetY = bucketRect.top + bucketRect.height / 2 - rect.height / 2;

        gsap.to(clone, {
          duration: 0.95,
          x: targetX - rect.left,
          y: targetY - rect.top,
          scale: 0.8,
          ease: "power3.inOut",
          onComplete: () => {
            // create a permanent thumbnail inside bucket (so we can later pop it)
            const img = document.createElement("img");
            img.src = (thumb.querySelector("img") && thumb.querySelector("img").src) || "";
            img.alt = labels[i] || `product-${i+1}`;
            img.style.width = "64px";
            img.style.height = "64px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "8px";
            img.style.marginRight = "8px";
            // attach price data attribute for later
            img.dataset.price = String(prices[i] || 0);
            // append to bucket's content area (we create container inside bucket)
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
            content.appendChild(img);
            // store reference
            if (!bucketContents.current[i]) bucketContents.current[i] = [];
            bucketContents.current[i].push(img);
            // remove the flying clone from DOM
            clone.remove();
          }
        });
      } catch (e) {
        // ignore
      }
    }

    // find minimal price and animate pop-out of that bucket's item with price tag
    function revealWinner() {
      try {
        // compute bucket prices using first item inside each bucket (if present)
        const values = bucketContents.current.map((arr, i) => {
          if (!arr || arr.length === 0) return Infinity;
          // parse price from dataset if set
          const p = Number(arr[0].dataset.price || prices[i] || Infinity);
          return p;
        });

        const minPrice = Math.min(...values);
        const winnerIndex = values.indexOf(minPrice);
        if (winnerIndex < 0) return;

        // pick the first image element in that bucket
        const imgEl = bucketContents.current[winnerIndex] && bucketContents.current[winnerIndex][0];
        const bucket = bucketRefs.current[winnerIndex];
        if (!imgEl || !bucket) return;

        // compute positions
        const imgRect = imgEl.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        const flightLayer = flightLayerRef.current;

        // create clone for pop-out
        const pop = imgEl.cloneNode(true);
        pop.style.position = "absolute";
        pop.style.left = `${imgRect.left}px`;
        pop.style.top = `${imgRect.top}px`;
        pop.style.width = `${imgRect.width}px`;
        pop.style.height = `${imgRect.height}px`;
        pop.style.zIndex = 100000;
        pop.style.pointerEvents = "none";
        flightLayer.appendChild(pop);

        // price tag element
        const tag = document.createElement("div");
        tag.className = "price-tag";
        tag.textContent = `$${minPrice.toLocaleString()}`;
        tag.style.position = "absolute";
        tag.style.left = `${imgRect.left + imgRect.width + 8}px`;
        tag.style.top = `${imgRect.top - 6}px`;
        tag.style.zIndex = 100001;
        tag.style.background = "var(--card-surface)";
        tag.style.border = "1px solid var(--border-soft)";
        tag.style.padding = "6px 10px";
        tag.style.borderRadius = "8px";
        tag.style.boxShadow = "var(--card-shadow)";
        flightLayer.appendChild(tag);

        // animate pop outward (little up & scale)
        gsap.timeline({
          defaults: { ease: "power3.out" }
        }).to(pop, {
          y: -40,
          scale: 1.08,
          duration: 0.55
        }).to(pop, {
          y: -70,
          scale: 1.18,
          duration: 0.45
        }, "+=0.04").to(tag, { x: "-=6", y: -16, opacity: 1, duration: 0.45 }, "<");

        // give it a little bounce then fade
        gsap.to(pop, { opacity: 0, duration: 1.2, delay: 2, onComplete: () => pop.remove() });
        gsap.to(tag, { opacity: 0, duration: 1.2, delay: 2, onComplete: () => tag.remove() });

        // small bucket highlight
        gsap.fromTo(bucket, { scale: 1 }, { scale: 1.06, boxShadow: "0 26px 60px rgba(2,6,23,0.14)", duration: 0.5, yoyo: true, repeat: 1 });
      } catch (e) {
        // swallow
      }
    }

    // clean up on unmount
    return () => {
      try {
        ScrollTrigger.getAll().forEach(s => s.kill());
      } catch (e) {}
    };
  }, [fractions, thumbs, prices, labels]);

  // render
  return (
    <section ref={wrapRef} className="relative w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-28">
      {/* fixed flight layer for clones */}
      <div ref={flightLayerRef} style={{ position: "fixed", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: buckets + compare text */}
        <div className="relative z-20">
          <h3 className="text-3xl font-bold mb-3">How we find the best price</h3>
          <p className="text-muted mb-6">As the line scans stores, thumbnails appear and fly into the buckets. We then compare and present the cheapest option.</p>

          <div className="grid grid-cols-2 gap-4">
            {[0,1,2,3].map(i => (
              <div
                key={i}
                ref={(el) => (bucketRefs.current[i] = el)}
                className="bucket p-4 rounded-xl"
                style={{
                  background: "var(--card-surface)",
                  border: "1px solid var(--border-soft)",
                  boxShadow: "var(--card-shadow)",
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
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

                {/* bucket-content will be appended by JS (persistent thumbnails) */}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {["Data sent to server", "Data received by server", "Server comparing results", "Comparison complete"].map((txt, idx) => (
              <div
                ref={el => (compareTextRefs.current[idx] = el)}
                key={idx}
                className="compare-step opacity-0"
                style={{ transform: "translateY(6px)" }}
              >
                <strong>{idx+1}.</strong> {txt}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: SVG path and thumbnails */}
        <div className="relative">
          <svg ref={svgRef} viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet" className="w-full">
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

          {/* absolutely positioned thumbnails + labels */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {fractions.map((f, i) => (
              <div
                key={i}
                ref={el => (thumbRefs.current[i] = el)}
                style={{
                  position: "absolute",
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "var(--card-surface)",
                  border: "1px solid var(--border-soft)",
                  boxShadow: "var(--card-shadow)",
                  transform: "translate(-50%,-50%)",
                  pointerEvents: "auto",
                }}
              >
                {thumbs[i] ? (
                  <img src={thumbs[i]} alt={labels[i]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>{labels[i]}</div>
                )}
              </div>
            ))}

            {fractions.map((f, i) => (
              <div key={"lab"+i} ref={el => (labelRefs.current[i] = el)} style={{ position: "absolute", pointerEvents: "none", transform: "translate(-50%,-50%)" }}>
                <div style={{ background: "var(--card-surface)", color: "var(--text-primary)", border: "1px solid var(--border-soft)", padding: "6px 10px", borderRadius: 8 }}>
                  <strong style={{ display: "block" }}>{labels[i]}</strong>
                  <small style={{ color: "var(--text-muted)" }}>Data discovered</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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
