import mdx from "@mdx-js/rollup";
import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import remarkGfm from "remark-gfm";
import Fonts from "unplugin-fonts/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { rehypeInlineCodeLang } from "./config/rehypeInlineCodeLang";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin(),
    Fonts({
      google: {
        families: [{ name: "Open Sans", styles: "wght@0,300..800;1,300..800" }],
      },
    }),
    Icons({
      compiler: "jsx",
      jsx: "react",
      autoInstall: true,
    }),
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
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
  optimizeDeps: {
    include: ["react/jsx-runtime"],
  },
});
