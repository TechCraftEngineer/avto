"use client";

import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import * as React from "react";
import * as z from "zod";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const ThemeModeSchema = z.enum(["light", "dark", "system"]);

export type ThemeMode = z.output<typeof ThemeModeSchema>;
export type ResolvedTheme = "light" | "dark";

const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") return "system";
  try {
    const storedTheme = localStorage.getItem("theme");
    return ThemeModeSchema.parse(storedTheme);
  } catch {
    return "system";
  }
};

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getNextTheme = (current: ThemeMode): ThemeMode => {
  const systemTheme = getSystemTheme();
  const themes: ThemeMode[] =
    systemTheme === "dark"
      ? ["system", "light", "dark"]
      : ["system", "dark", "light"];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return themes[(themes.indexOf(current) + 1) % themes.length]!;
};

interface ThemeContextProps {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = React.createContext<ThemeContextProps | undefined>(
  undefined,
);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [themeMode, setThemeMode] = React.useState<ThemeMode>(getStoredThemeMode);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");

  React.useEffect(() => {
    const resolved = themeMode === "system" ? getSystemTheme() : themeMode;
    setResolvedTheme(resolved);
  }, [themeMode]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
  };

  const toggleMode = () => {
    setTheme(getNextTheme(themeMode));
  };

  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      <ThemeContext
        value={{
          themeMode,
          resolvedTheme,
          setTheme,
          toggleMode,
        }}
      >
        {children}
      </ThemeContext>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = React.use(ThemeContext);
  if (!context) {
    throw new Error("useTheme должен использоваться внутри ThemeProvider");
  }
  return context;
}

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const { resolvedTheme } = useNextTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="[&>svg]:absolute [&>svg]:size-5 [&>svg]:scale-0"
        >
          <SunIcon className="light:scale-100! system:scale-0! dark:scale-0!" />
          <MoonIcon className="system:scale-0! dark:scale-100!" />
          <DesktopIcon className="system:scale-100!" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
