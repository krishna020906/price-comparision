// src/lib/useRegisterAnimation.js
"use client";

import { useContext, useLayoutEffect } from "react";
import { AnimationContext } from "@/components/AnimationProvider";

/**
 * useRegisterAnimation(registerFn, deps)
 * - registerFn: (tl) => { build tweens on tl; optionally return tween(s) }
 * - deps: optional dependencies (like refs)
 */
export function useRegisterAnimation(registerFn, deps = []) {
  const ctx = useContext(AnimationContext);

  useLayoutEffect(() => {
    if (!ctx || typeof ctx.register !== "function") return;
    const unregister = ctx.register(registerFn);
    return () => {
      if (unregister) unregister();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
