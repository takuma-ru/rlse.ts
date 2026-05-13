import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFile,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { cwd } from "node:process";
import { promisify } from "node:util";
import consola from "consola";
import type { RlseConfig } from "../types/RlseConfig";

const require = createRequire(import.meta.url);
const promisifyReadFile = promisify(readFile);
const configFiles = [
  "rlse.config.ts",
  "rlse.config.js",
  "rlse.config.mjs",
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
        case ".mjs": {
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
  const nodeTypesRoot = getNodeTypesRoot();

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
        module: "ESNext",
        moduleResolution: "bundler",
        esModuleInterop: true,
        lib: ["ESNext"],
        ...(nodeTypesRoot
          ? { types: ["node"], typeRoots: [nodeTypesRoot] }
          : {}),
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
          "rlse.ts": [resolve(cwd(), "node_modules/rlse.ts/dist/main.js")],
        },
      },
      exclude: ["node_modules"],
      include: [filePath],
    }),
  );
  writeFileSync(
    resolve(tempDir, "package.json"),
    JSON.stringify({ type: "module" }),
  );

  try {
    execSync(`tsc --project ${customTsConfigPath}`, {
      stdio: "inherit",
    });
    addJsExtensionsToRelativeImports(tempDir);
    const config = await import(tempFilePath);

    return (config.default.default ?? config.default) as RlseConfig;
  } catch (error) {
    consola.error("Error compiling TypeScript file:", error);

    throw error;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

const getNodeTypesRoot = () => {
  try {
    return dirname(dirname(require.resolve("@types/node/package.json")));
  } catch {
    return undefined;
  }
};

const addJsExtensionsToRelativeImports = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    const filePath = join(dir, entry);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      addJsExtensionsToRelativeImports(filePath);
      continue;
    }

    if (extname(filePath) !== ".js") {
      continue;
    }

    const content = readFileSync(filePath, "utf-8");
    const updatedContent = content.replace(
      /(from\s+["']|import\s*\(\s*["'])(\.{1,2}\/[^"']+)(["'])/g,
      (match, prefix: string, importPath: string, suffix: string) => {
        if (
          extname(importPath) ||
          !existsSync(resolve(dirname(filePath), `${importPath}.js`))
        ) {
          return match;
        }

        return `${prefix}${importPath}.js${suffix}`;
      },
    );

    if (updatedContent !== content) {
      writeFileSync(filePath, updatedContent);
    }
  }
};
