import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFile,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { cwd } from "node:process";
import { promisify } from "node:util";
import consola from "consola";
import type { RlseConfig } from "../types/RlseConfig";

const promisifyReadFile = promisify(readFile);
const configFiles = [
  "rlse.config.ts",
  "rlse.config.js",
  "rlse.config.mjs",
  "rlse.config.cjs",
  "rlse.config.json",
];

export const loadRlseConfig = async () => {
  for (const file of configFiles) {
    const filePath = resolve(cwd(), file);
    if (existsSync(filePath)) {
      const ext = extname(file);
      switch (ext) {
        case ".ts": {
          return await importTypeScriptConfig(filePath);
        }
        case ".js":
        case ".mjs":
        case ".cjs": {
          const config = await import(filePath);

          return config.default as RlseConfig;
        }
        case ".json": {
          const content = await promisifyReadFile(filePath, "utf-8");

          return JSON.parse(content) as RlseConfig;
        }
        default: {
          throw new Error(`Unsupported file extension: ${ext}`);
        }
      }
    }
  }
  throw new Error("No configuration file found");
};

const importTypeScriptConfig = async (filePath: string) => {
  const tempDir = resolve(cwd(), ".temp");
  const tempFilePath = resolve(tempDir, "rlse.config.js");
  const customTsConfigPath = resolve(tempDir, "tsconfig.json");

  // 一時ディレクトリが存在しない場合は作成する
  try {
    mkdirSync(tempDir, { recursive: true });
  } catch (error) {
    consola.error("Error creating temporary directory:", error);
    throw error;
  }

  // カスタムのtsconfig.jsonを作成
  writeFileSync(
    customTsConfigPath,
    JSON.stringify({
      compilerOptions: {
        target: "ESNext",
        useDefineForClassFields: true,
        module: "esnext",
        lib: ["ESNext"],
        skipLibCheck: true,
        noErrorTruncation: true,
        noEmit: false,
        // outFile: tempFilePath,
        outDir: tempDir,
        rootDir: dirname(filePath),
        strict: true,
        noImplicitAny: false,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        paths: {
          "@takuma-ru/rlse": [
            resolve(cwd(), "node_modules/@takuma-ru/rlse/dist/main.js"),
          ],
        },
      },
      exclude: ["node_modules"],
      include: [filePath],
    }),
  );

  try {
    execSync(`tsc --project ${customTsConfigPath}`, {
      stdio: "inherit",
    });
    const config = await import(tempFilePath);

    return config.default as RlseConfig;
  } catch (error) {
    consola.error("Error compiling TypeScript file:", error);

    throw error;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};
