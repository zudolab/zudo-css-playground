import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    }),
  ],
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
