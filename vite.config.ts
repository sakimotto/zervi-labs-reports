import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Manual chunking strategy — group large vendor libs for better long-term caching.
function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  if (id.includes("react-router-dom") || id.includes("/react-dom/") || id.includes("/react/"))
    return "react-vendor";
  if (id.includes("@radix-ui")) return "radix-ui";
  if (id.includes("recharts") || id.includes("d3-")) return "charts";
  if (id.includes("react-markdown") || id.includes("remark") || id.includes("micromark"))
    return "markdown";
  if (id.includes("@tanstack/react-query")) return "query";
  if (id.includes("@supabase")) return "supabase";
  if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("/zod/"))
    return "forms";
  if (id.includes("date-fns") || id.includes("react-day-picker")) return "calendar";
  return undefined;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
}));
