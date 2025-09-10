import React from 'react';

export default function Hero() {
  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* LEFT: Text */}
          <div className="space-y-6">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              TIRED OF MANUAL PRICE CHECKS?
            </h1>

            <p className="text-md sm:text-lg max-w-xl" style={{ color: 'var(--text-muted)' }}>
              from different e‑commerce websites — don’t worry, we’ll do the hard work for you. Get fast price comparisons
              across stores so you always get the best deal.
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="#get-started"
                className="ecom-btn inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm shadow-sm"
                role="button"
                aria-label="Get started"
              >
                Get started
              </a>

              <a
                href="#learn-more"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm border"
                style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)', background: 'transparent' }}
                aria-label="Learn more"
              >
                Learn more
              </a>
            </div>

            <div className="mt-6 text-sm text-muted" style={{ color: 'var(--text-muted)' }}>
              No sign-up required to try — we respect your privacy.
            </div>
          </div>

          {/* RIGHT: Lottie animation */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md lg:max-w-lg">
              <lottie-player
                src="/animations/Digital-Marketing.lottie"
                background="transparent"
                speed="1"
                style={{ width: '100%', maxWidth: '500px' }}
                loop
                autoplay
              ></lottie-player>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
