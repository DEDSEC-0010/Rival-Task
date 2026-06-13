"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="sm" aria-label="Toggle theme" className="w-9 px-0">{" "}</Button>;
  }

  const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const Icon = resolvedTheme === "dark" ? Moon : theme === "system" ? Monitor : Sun;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      className="w-9 px-0"
    >
      <Icon size={18} weight="regular" aria-hidden />
    </Button>
  );
}
