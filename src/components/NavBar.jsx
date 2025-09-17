// src/components/Navbar.jsx
"use client";

import React, { useState } from 'react';
import { CiHome, CiSearch } from 'react-icons/ci';
import { useRef } from 'react';
import { useRegisterAnimation } from "@/lib/useRegisterAnimation";
import gsap from 'gsap';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useRegisterAnimation((tl) => {
      // Find only elements inside this nav component that have data-animate
  const items = gsap.utils.toArray(navRef.current.querySelectorAll('[data-animate]'));
    // animate nav sliding down slightly, timed relative to global timeline
    // You can position it at a label or absolute time: "start" or e.g. 0
    // Here we animate it near the start
  tl.fromTo(items, { opacity: 0, y: -12 }, { opacity: 1, y: 0, stagger: 0.5, duration: 3 });
  }, []); // no deps, ref is stable

  return (
    <header   ref={navRef} className="w-full shadow-lg" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Home */}
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-3" aria-label="Price Compare home">
              <span data-animate
                className="inline-flex items-center justify-center w-10 h-10 rounded-full"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(11,99,255,0.15)'
                }}
              >
                <strong>PC</strong>
              </span>

              <span data-animate className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                Price Compare
              </span>
            </a>

            <a
              href="/"
              className=" lg:flex items-center gap-2 text-sm rounded-full px-3 py-2 hover-theme-bg"
            >
              <CiHome data-animate className="text-xl" style={{ color: 'var(--accent)' }} />
              <span data-animate >Home</span>
            </a>
          </div>

          {/* Middle: Search (centered on md+). Wide, rounded, search icon button. */}
          <div data-animate className="flex-1 mx-4  md:flex justify-center">
            <div className="w-full max-w-2xl">
              <label htmlFor="site-search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <input
                  id="site-search"
                  type="search"
                  placeholder="Search products, prices, stores..."
                  className="w-full pl-4 pr-12 py-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-sm"
                  style={{ borderColor: 'var(--border-soft)', background: 'transparent', color: 'var(--fg)' }}
                />

                <button
                  aria-label="Search"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 px-4 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  <CiSearch className="text-xl" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Links + mobile toggle */}
          <div className="flex items-center space-x-2">
            <nav className=" md:flex items-center space-x-4">
              <a data-animate href="#how" className="text-sm px-3 py-2 rounded-full hover-theme-bg">
                How it works
              </a>
              <button data-animate
                className=" lg:inline-flex items-center px-4 py-2 rounded-full border"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                Sign in
              </button>
            </nav>

            <div className="">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                className="p-2 rounded-md focus:outline-none focus:ring-2"
                style={{ color: 'var(--accent)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      mobileOpen
                        ? 'M6 18L18 6M6 6l12 12'
                        : 'M4 6h16M4 12h16M4 18h16'
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className=" px-4 pb-4">
          <div className="space-y-3">
            <a href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover-theme-bg">
              <CiHome className="text-2xl" style={{ color: 'var(--accent)' }} /> Home
            </a>

            <a href="#how" className="block px-3 py-2 rounded-lg hover-theme-bg">
              How it works
            </a>

            <div>
              <label htmlFor="mobile-search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <input
                  id="mobile-search"
                  className="w-full pl-4 pr-12 py-3 rounded-full border focus:outline-none"
                  placeholder="Search products..."
                  style={{ borderColor: 'var(--border-soft)', background: 'transparent', color: 'var(--fg)' }}
                />
                <button
                  aria-label="Search"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 px-4 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  <CiSearch className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

