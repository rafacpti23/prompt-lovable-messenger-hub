
import * as React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
  forcedTheme?: "light" | "dark" | undefined;
  attribute?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  forcedTheme,
  attribute = "class",
}: ThemeProviderProps) {
  React.useEffect(() => {
    if (forcedTheme) {
      document.documentElement.setAttribute(attribute, forcedTheme);
    } else {
      document.documentElement.setAttribute(
        attribute,
        defaultTheme ?? "light"
      );
    }
  }, [forcedTheme, defaultTheme, attribute]);

  return <>{children}</>;
}
