import { createGlobalThemeContract } from "@vanilla-extract/css";

interface NestedObject {
  [key: string]: string | NestedObject;
}

type GlobalColorTheme = {
  background: {
    primary: string;
    secondary: string;
  };
  text: {
    primary: string;
    secondary: string;
    highlight: string;
  };
};

export const colorLightTokens = {
  background: {
    primary: "#eeeeee",
    secondary: "#f6f6f6",
  },
  text: {
    primary: "#1d1d1d",
    secondary: "#bfbfbf",
    highlight: "#c66d00ff",
  },
} as const satisfies GlobalColorTheme;

export const colorDarkTokens = {
  background: {
    primary: "#1d1d1d",
    secondary: "#2C2C2C",
  },
  text: {
    primary: "#f6f6f6",
    secondary: "#9b9b9b",
    highlight: "#ffa332ff",
  },
} as const satisfies GlobalColorTheme;

export const genThemeContract = (
  obj: NestedObject,
  baseKey?: string,
): GlobalColorTheme => {
  const themeContract: NestedObject = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      themeContract[key] = baseKey ? `${baseKey}-${key}` : key;
    } else {
      themeContract[key] = genThemeContract(value, key);
    }
  }

  return themeContract as GlobalColorTheme;
};

export const colors = createGlobalThemeContract(
  genThemeContract(colorLightTokens),
);
