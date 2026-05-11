import mdx from "@mdx-js/rollup";
import build from "@hono/vite-build/cloudflare-workers";
import devServer from "@hono/vite-dev-server";
import cloudflareAdapter from "@hono/vite-dev-server/cloudflare";
import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import remarkGfm from "remark-gfm";
import Fonts from "unplugin-fonts/vite";
import { defineConfig } from "vite";
import { rehypeInlineCodeLang } from "./config/rehypeInlineCodeLang";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const commonPlugins = [
    vanillaExtractPlugin(),
    Fonts({
      google: {
        families: [{ name: "Open Sans", styles: "wght@0,300..800;1,300..800" }],
      },
    }),
  ];

  if (mode === "client") {
    return {
      plugins: commonPlugins,
      build: {
        copyPublicDir: false,
        rollupOptions: {
          input: "src/style-entry.ts",
          output: {
            dir: "dist/client/static",
            entryFileNames: "style.js",
            assetFileNames: "style.css",
          },
        },
      },
    };
  }

  return {
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "hono/jsx",
    },
    plugins: [
      devServer({
        entry: "src/index.tsx",
        adapter: cloudflareAdapter,
      }),
      build({
        entry: "src/index.tsx",
        outputDir: "dist/worker",
      }),
      ...commonPlugins,
      {
        enforce: "pre",
        ...mdx({
          jsxImportSource: "hono/jsx",
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeInlineCodeLang,
            [
              rehypeShiki,
              {
                themes: {
                  light: "github-light",
                  dark: "github-dark",
                },
                transformers: [
                  {
                    name: "rehype-add-lang-to-pre",
                    preprocess: (code, option) => {
                      option.transformers?.find((transformer) => {
                        if (transformer.name === "rehype-add-lang-to-pre") {
                          transformer.pre = (node) => {
                            node.properties.lang = option.lang;

                            return node;
                          };
                        }
                      });
                      return code;
                    },
                  },
                ],
                parseMetaString: (metaString, _node, _tree) => {
                  const meta = metaString.split(",").reduce(
                    (acc, str) => {
                      if (!str) return acc;

                      const [key, value] = str.split("=");
                      acc[`data-${key}`] = value;
                      return acc;
                    },
                    {} as Record<string, string>,
                  );

                  return meta;
                },
              } as RehypeShikiOptions,
            ],
          ],
        }),
      },
    ],
  };
});
