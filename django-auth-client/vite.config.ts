import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig, lazyPlugins } from "vite-plus";

// https://vite.dev/config/
export default defineConfig({
  server : {
    host : "localhost",
    port : 5173,
    strictPort : true,
  },
  
  fmt: {},
  lint: {
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  plugins: lazyPlugins(() => [react(), babel({ presets: [reactCompilerPreset()] })]),
});
