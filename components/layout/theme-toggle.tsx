"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", dark);
    window.requestAnimationFrame(() => setIsDark(dark));
  }, []);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <Button
      aria-label="Toggle theme"
      title="Toggle theme"
      size="icon"
      variant="secondary"
      onClick={toggle}
      type="button"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </Button>
  );
}
