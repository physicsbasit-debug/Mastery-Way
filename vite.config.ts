import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildCodespacesHmrConfig() {
  const codespaceName = process.env.CODESPACE_NAME;
  const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  const port = Number(process.env.PORT || 5173);

  if (!codespaceName || !forwardingDomain) {
    return undefined;
  }

  return {
    protocol: "wss",
    host: `${codespaceName}-${port}.${forwardingDomain}`,
    clientPort: 443,
  };
}


function resolveBasePath() {
  const explicitBase = process.env.VITE_BASE_PATH?.trim();

  if (explicitBase) {
    return explicitBase.endsWith("/") ? explicitBase : `${explicitBase}/`;
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").pop();

  if (process.env.GITHUB_ACTIONS === "true" && repositoryName) {
    return repositoryName.endsWith(".github.io") ? "/" : `/${repositoryName}/`;
  }

  return "/";
}

function resolveManualChunk(id: string) {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (
    id.includes("/react/") ||
    id.includes("/react-dom/") ||
    id.includes("/scheduler/")
  ) {
    return "react-vendor";
  }

  if (
    id.includes("/recharts/") ||
    id.includes("/d3-") ||
    id.includes("/internmap/")
  ) {
    return "charts";
  }

  if (id.includes("/framer-motion/") || id.includes("/lucide-react/")) {
    return "ui-vendor";
  }

  if (
    id.includes("/@radix-ui/") ||
    id.includes("/class-variance-authority/") ||
    id.includes("/clsx/") ||
    id.includes("/tailwind-merge/")
  ) {
    return "ui-core";
  }

  return "vendor";
}

export default defineConfig(() => {
  const port = Number(process.env.PORT || 5173);
  const hmr = buildCodespacesHmrConfig();
    
 return {
    base: resolveBasePath(),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      host: "0.0.0.0",
      port,
      strictPort: true,
      hmr,
      origin: hmr ? `https://${hmr.host}` : undefined,
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      strictPort: true,
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunk,
        },
      },
    },
  };
});
