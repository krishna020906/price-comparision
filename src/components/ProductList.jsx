// ProductList.react.jsx
// Single-file React component using Tailwind CSS.
// Usage:
// 1. Ensure Tailwind CSS is configured in your project.
// 2. Copy this file into your components folder and import it in a page.
// 3. By default it references a local image path `/Product-List-5.jpg` (the image provided in the container).
//    - If you don't have that image, replace image URLs in the `products` array with your own URLs.

import React from "react";

export default function ProductList() {
  const products = [
    {
      id: 1,
      title: "Light Cream Skin Care",
      category: "Skin Care",
      price: 199.0,
      discount: 30,
      bullets: [
        "Prevent acne & Treat wrinkles",
        "Reduce visible pores",
        "Skin tone serum",
      ],
      // local image path: place Product-List-5.jpg in your public/ root or replace with an external URL
      image: "/Product-List-5.jpg",
      rating: 4.8,
    },
    {
      id: 2,
      title: "Garderica Floral Skin Serum",
      category: "Skin Care",
      price: 199.0,
      discount: 30,
      bullets: [
        "Prevent acne & Treat wrinkles",
        "Reduce visible pores",
        "Skin tone serum",
      ],
      image:
        "https://images.unsplash.com/photo-1600180758891-0e3f3d9f5a7f?auto=format&fit=crop&w=1200&q=60",
      rating: 4.8,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-10">Skin Care</h1>

        <div className="space-y-10">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-sm p-6 grid grid-cols-12 gap-6 items-center"
            >
              {/* Image column */}
              <div className="col-span-12 md:col-span-4">
                <div className="rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-56 object-cover md:h-64 rounded-xl"
                  />
                </div>
              </div>

              {/* Content column */}
              <div className="col-span-12 md:col-span-5">
                <h3 className="text-2xl md:text-2xl font-semibold text-gray-900">{p.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{p.category}</p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-900">${p.price.toFixed(2)}</div>
                  <div className="text-sm font-medium text-indigo-600">{p.discount}% off</div>
                </div>

                <ul className="mt-6 space-y-3">
                  {p.bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50">
                          {/* check icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 text-indigo-600"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </span>

                      <span className="text-gray-700">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right column: actions */}
              <div className="col-span-12 md:col-span-3 flex flex-col items-center md:items-end gap-4">
                <button
                  aria-label="favorite"
                  className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center"
                >
                  {/* heart outline */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.172 7.172a4 4 0 015.656 0L12 10.343l3.172-3.171a4 4 0 015.656 5.656L12 21.657 3.172 12.828a4 4 0 010-5.656z"
                    />
                  </svg>
                </button>

                <div className="mt-4 md:mt-0">
                  <div className="inline-flex items-center gap-2 bg-amber-400 text-white text-sm font-medium px-3 py-1 rounded-md shadow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.375 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.375 2.455c-.784.57-1.84-.197-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.633 9.393c-.783-.57-.38-1.81.588-1.81h4.173a1 1 0 00.95-.69L9.05 2.927z" />
                    </svg>
                    <span>{p.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-400 mt-8 text-sm">
          Tip: change the image paths in the `products` array to use your own sample images or place
          <code className="mx-1 px-1 py-0.5 rounded bg-gray-100 text-xs">Product-List-5.jpg</code> in your
          public folder.
        </p>
      </div>
    </div>
  );
}
