import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async ({ mode, command, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), "API_PROXY_");
  const fixture = command === "serve" && !isPreview && mode === "fixture";
  const fixtureMiddleware = fixture
    ? (await import("./dev/fixture.ts")).createFixtureMiddleware()
    : null;
  const fixturePlugins = fixture
    ? [
        {
          name: "kbc-development-fixture",
          configureServer: (server: import("vite").ViteDevServer) => {
            server.middlewares.use(fixtureMiddleware!);
          },
        },
      ]
    : [];
  return {
    plugins: [react(), tailwindcss(), ...fixturePlugins],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET || "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
