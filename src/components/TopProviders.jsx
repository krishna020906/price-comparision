// src/components/TopProviders.jsx
"use client";

import React from "react";
import AnimationProvider from "@/components/AnimationProvider";

export default function TopProviders({ children }) {
  return <AnimationProvider>{children}</AnimationProvider>;
}