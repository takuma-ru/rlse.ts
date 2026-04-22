import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cwd } from "node:process";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts", "src/bin.ts"],
  format: ["esm", "cjs"],
  target: "esnext",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  onSuccess: async () => {
    const binDir = path.join(cwd(), "/bin");
    await mkdir(binDir, { recursive: true });

    const filesToCopy = ["dist/bin.cjs", "dist/bin.js"];

    for (const file of filesToCopy) {
      const content = await readFile(file, { encoding: "utf8" });
      const updatedContent = `#!/usr/bin/env node\n${content}`;
      const destPath = path.join(binDir, path.basename(file));
      await writeFile(destPath, updatedContent, {
        encoding: "utf8",
      });
    }
  },
});
