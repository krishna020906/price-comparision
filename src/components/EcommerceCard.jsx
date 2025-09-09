// src/components/Ecommercecard.jsx
"use client";



import React from "react";
import Image from "next/image";

/**
 * EcommerceCard
 *
 * Props:
 * - image (string): image URL
 * - title (string)
 * - price (number|string)
 * - description (string)
 * - onClick (fn) -> Buy / details action
 * - onCompare (fn) -> Compare action
 * - onFavorite (fn) -> toggle favorite
 * - favorited (bool)
 *
 * Notes:
 * - Grid spacing: use `gap-8` on the parent grid for more breathing room.
 * - This component uses the CSS variables and helper classes defined in globals.css:
 *   --accent, --border-soft, .ecom-card, .card-body, .ecom-btn, .text-muted
 */

export default function EcommerceCard({
  image,
  title,
  price,
  description,
  onClick = () => {},
  onCompare = () => {},
  onFavorite = () => {},
  favorited = false,
}) {
  // Format price for rupees (no decimals)
  const formattedPrice =
    typeof price === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(price)
      : `₹${price}`;

  return (
    <article className="w-72 ecom-card flex flex-col relative">
      {/* Image area with favorite overlay */}
      <div className="relative h-56 overflow-hidden">
        {/* <img
          src={image}
          alt={title}
          className="h-full w-full object-cover object-center"
          style={{ objectPosition: "centre" }} 
        /> */}
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, 288px"
            quality={80}
            priority={false} // set true for above-the-fold if needed
          />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
            No Image 
          </div>
        )}
        {/* Favorite heart overlay (absolute) */}
        <button
          type="button"
          aria-pressed={favorited}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          onClick={onFavorite}
          className="absolute right-3 top-3 z-10 flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          {/* Heart icon (svg) */}
          {favorited ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 20s-7-4.534-9.028-7.093C.797 10.98 3.686 6.5 7.5 6.5c2.04 0 3.246 1.073 4.5 2.393C12.754 7.573 13.96 6.5 16 6.5c3.814 0 6.703 4.48 4.528 6.407C19 15.466 12 20 12 20z"
                fill="var(--accent)"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12.1 21.3l-1.1-.96C5 15.36 2 12.68 2 9.27 2 6.18 4.24 4 7.25 4c1.9 0 3.4.98 4.35 2.1.46.56 1.08.56 1.54 0C13.35 4.98 14.86 4 16.75 4 19.76 4 22 6.18 22 9.27c0 3.41-3 6.09-8.95 11.07l-1.95 1.03z"
                stroke="var(--text-primary)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-5 card-body flex-1">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium leading-snug text-[var(--text-primary)] line-clamp-2 ">
              {title}
            </p>
            {description && (
              <p className="text-xs text-muted mt-2 line-clamp-3" style={{ color: "var(--text-muted)" }}>
                {description}
              </p>
            )}
          </div>

          <div className="ml-4 text-right">
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {formattedPrice}
            </p>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-5 pt-0 flex gap-3">
        <button
          onClick={onClick}
          className="flex-1 ecom-btn"
          aria-label="Buy now"
          type="button"
        >
          Buy Now
        </button>

        <button
          onClick={onCompare}
          className="px-4 py-2 rounded-md border text-sm"
          style={{
            borderColor: "var(--border-soft)",
            color: "var(--text-muted)",
            background: "transparent",
          }}
          type="button"
        >
          Compare
        </button>
      </div>
    </article>
  );
}










// src/components/EcommerceCard.js

// export default function EcommerceCard({ image, title, price, description, onClick }) {
//   return (
//     <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 shadow-md w-72 dark:bg-gray-800 dark:text-gray-200">
//       <div className="relative bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden h-56">
//         <img src={image} alt={title} className="h-full w-full object-cover" />
//       </div>

//       <div className="p-6">
//         <div className="mb-2 flex items-center justify-between">
//           <p className="block font-sans text-gray-900 font-medium text-sm dark:text-gray-100">
//             {title}
//           </p>
//           <p className="block font-sans text-gray-900 font-medium text-sm dark:text-gray-100">
//             ₹{price}
//           </p>
//         </div>

//         {description && (
//           <p className="block font-sans text-gray-700 font-normal opacity-75 text-xs dark:text-gray-300">
//             {description}
//           </p>
//         )}
//       </div>

//       <div className="p-6 pt-0">
//         <button
//           onClick={onClick}
//           className="w-full block text-xs py-3 px-6 rounded-lg font-bold uppercase transition-transform transform hover:scale-105 bg-gray-100 text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
//           type="button"
//         >
//           Details
//         </button>
//       </div>
//     </div>
//   );
// }





// import React, { useState } from "react";


// export default function EcommerceCard({ image, title, price, description, onClick }) {
//   const [isCompared, setIsCompared] = useState(false);

//   return (
//     <div className="relative w-80 rounded-2xl shadow-xl overflow-hidden bg-gray-900 text-gray-100">
//       {/* Image */}
//       <div className="relative h-64 w-full bg-gray-800">
//         <button
//           aria-label="favorite"
//           className="absolute top-3 right-3 z-20 inline-flex items-center justify-center rounded-full p-2 bg-gray-800/60 ring-1 ring-gray-700 hover:scale-105 transition"
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
//             <path d="M12 21s-6.716-4.432-9.243-7.06C.96 12.25 1 7.998 4.343 5.656 6.792 3.207 9.708 4 12 6.293 14.292 4 17.208 3.207 19.657 5.656 23 7.998 23.04 12.25 21.243 13.94 18.716 16.568 12 21 12 21z" />
//           </svg>
//         </button>

//         {/* use the image prop directly */}
//         <img src={image} alt={title} className="h-full w-full object-cover object-center" />
//       </div>

//       {/* Content */}
//       <div className="p-5">
//         <div className="flex items-start justify-between gap-4">
//           <div>
//             <h3 className="text-lg font-semibold leading-tight">{title}</h3>
//             {description && <p className="mt-1 text-sm text-gray-300">{description}</p>}
//           </div>

//           <div className="text-right">
//             <div className="text-lg font-bold">
//               {/* show price as provided */}
//               {typeof price === "number" ? `₹${price.toFixed(2)}` : price}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Actions */}
//       <div className="p-5 pt-0">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={onClick}
//             type="button"
//             className="flex-1 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide shadow hover:bg-indigo-600 active:scale-95 transition"
//           >
//             Buy Now
//           </button>

//           <button
//             onClick={() => setIsCompared((s) => !s)}
//             type="button"
//             aria-pressed={isCompared}
//             className={`inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-transparent px-3 py-3 text-sm font-medium text-gray-100 hover:bg-gray-800/60 active:scale-95 transition ${
//               isCompared ? "ring-2 ring-indigo-500/40" : ""
//             }`}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h4l3.6 7.59a2 2 0 001.79 1.41H19a2 2 0 001.95-1.57l1.1-6.59H6" />
//             </svg>
//             Compare
//             {isCompared && <span className="ml-1 text-xs font-medium text-indigo-300">✓</span>}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }