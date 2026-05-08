import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  ignorePatterns: [
    "**/dist/**",
    "**/node_modules/**",
    "**/.turbo/**",
    "packages/core/bin/**",
  ],
});
