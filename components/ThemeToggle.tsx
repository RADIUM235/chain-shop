"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="w-10 h-10 p-2 flex items-center justify-center border-2 border-transparent" aria-label="Toggle theme">
        <div className="w-5 h-5 bg-transparent" />
      </button>
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="p-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:dark:bg-white hover:text-white hover:dark:text-black transition-colors duration-300 rounded-none flex items-center justify-center relative overflow-hidden group"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
