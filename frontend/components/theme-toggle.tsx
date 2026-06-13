"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const reduce = useReducedMotion();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="sm" aria-label="Toggle theme" className="w-9 px-0">{" "}</Button>;
  }

  const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const mode = theme === "system" ? "system" : resolvedTheme === "dark" ? "dark" : "light";
  const Icon = mode === "dark" ? Moon : mode === "system" ? Monitor : Sun;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      className="w-9 px-0 overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mode}
          initial={reduce ? false : { opacity: 0, rotate: -45, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.7 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex"
        >
          <Icon size={18} weight="regular" aria-hidden />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
