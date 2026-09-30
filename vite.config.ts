import { fileURLToPath } from "node:url";
import { readdir, unlink } from "node:fs/promises";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));
export default defineConfig(({ mode }) => ({
  root: path("./web"),
  publicDir: path("./public"),
  plugins: [
    react(),
    ...(mode === "client"
      ? [
          {
            name: "client-compressed-models",
            async closeBundle() {
              const directory = path("./dist-client/models");
              for (const filename of await readdir(directory)) {
                if (filename.endsWith(".bin")) await unlink(`${directory}/${filename}`);
              }
            },
          },
        ]
      : []),
  ],
  resolve: { alias: { "@": path("./") } },
  css: { postcss: { plugins: [tailwindcss()] } },
  server: { host: "127.0.0.1", port: 3016, strictPort: true },
  build: { outDir: path(mode === "client" ? "./dist-client" : "./dist"), emptyOutDir: true },
}));
