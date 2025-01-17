import { rmSync } from "node:fs";
import path, { resolve, join } from "node:path";
// import { defineConfig } from 'vite'
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";

import fs, { readFileSync } from "fs";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import * as glob from "glob";
import legacy from "@vitejs/plugin-legacy";

function deleteFolderRecursive(path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

deleteFolderRecursive(path.join(process.cwd(), "dist-electron"));

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    build: {
      outDir: resolve(process.cwd(), "dist"),
      sourcemap: false,
      chunkSizeWarningLimit: 2048,
      assetsDir: "static",
      minify: "esbuild",
      cssCodeSplit: false,
      assetsInlineLimit: 1024 * 10,
      // rollupOptions: {
      //   input: {
      //     // index: join(process.cwd(), "src/pages/index/main.tsx"),
      //     index: join(process.cwd(), "index.html"),
      //   },
      //   output: {
      //     // inlineDynamicImports: true,
      //   },
      //   // build.rollupOptions.external
      //   external: ["electron", "process"],
      // },
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        "@": path.join(process.cwd(), "src"),
      },
    },
    plugins: [
      react(),
      // electron({
      //   main: {
      //     // Shortcut of `build.lib.entry`
      //     entry: 'electron/main/index.ts',
      //     onstart(args) {
      //       if (process.env.VSCODE_DEBUG) {
      //         console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
      //       } else {
      //         args.startup()
      //       }
      //     },
      //     vite: {
      //       build: {
      //         sourcemap,
      //         minify: isBuild,
      //         outDir: 'dist-electron/main',
      //         rollupOptions: {
      //           external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
      //         },
      //       },
      //     },
      //   },
      //   preload: {
      //     // Shortcut of `build.rollupOptions.input`.
      //     // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
      //     input: 'electron/preload/index.ts',
      //     vite: {
      //       build: {
      //         sourcemap: sourcemap ? 'inline' : undefined, // #332
      //         minify: isBuild,
      //         outDir: 'dist-electron/preload',
      //         rollupOptions: {
      //           external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
      //         },
      //       },
      //     },
      //   },
      //   // Ployfill the Electron and Node.js API for Renderer process.
      //   // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      //   // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      //   renderer: {},
      // }),
      // legacy({
      //   renderLegacyChunks: false,
      //   modernPolyfills: true,
      //   targets: ["defaults", "not IE 11", "chromeAndroid>=52, iOS>=13.1"],
      // }),
      electron([
        {
          entry: join(process.cwd(), "electron/main/index.bytenode.ts"),
          vite: {
            build: {
              outDir: join(process.cwd(), "dist-electron/main"),
              minify: false,
              sourcemap: false,
              rollupOptions: {
                // input: [path.join(process.cwd(), 'src-electron/main.bytenode.ts')],
                output: {
                  inlineDynamicImports: false,
                  manualChunks: undefined,
                },
                external: ["bytenode"],
              },
            },
          },
        },
        {
          entry: join(process.cwd(), "electron/preload/index.bytenode.ts"),
          vite: {
            build: {
              outDir: join(process.cwd(), "dist-electron/preload"),
              minify: false,
              sourcemap: false,
              rollupOptions: {
                input: [
                  path.join(
                    process.cwd(),
                    "electron/preload/index.bytenode.ts"
                  ),
                ],
                output: {
                  inlineDynamicImports: false,
                  manualChunks: undefined,
                },
              },
            },
          },
        },
        {
          entry: join(process.cwd(), "electron/main/index.ts"),
          vite: {
            build: {
              outDir: join(process.cwd(), "dist-electron/main"),
              minify: false,
              sourcemap: false,
              rollupOptions: {
                input: [
                  // path.join(process.cwd(), 'electron/main.bytenode.js'),
                  path.join(process.cwd(), "electron/main/index.ts"),
                  // path.join(process.cwd(), "electron/preload/index.ts"),
                ],
                output: {
                  inlineDynamicImports: true,
                  manualChunks: undefined,
                },

                external: [],
              },
            },
          },
        },
        {
          entry: join(process.cwd(), "electron/preload/index.ts"),
          vite: {
            build: {
              outDir: join(process.cwd(), "dist-electron/preload"),
              minify: false,
              sourcemap: false,
              rollupOptions: {
                input: [
                  // path.join(process.cwd(), 'electron/main.bytenode.js'),
                  path.join(process.cwd(), "electron/preload/index.ts"),
                  // path.join(process.cwd(), "electron/preload/index.ts"),
                ],
                output: {
                  inlineDynamicImports: true,
                  manualChunks: undefined,
                },

                external: [],
              },
            },
          },
        },
      ]),
      renderer(),
    ],
    // test: {
    //   globals: true,
    //   environment: "jsdom",
    //   setupFiles: "src/setupTests",
    //   mockReset: true,
    // },
    server:
      process.env.VSCODE_DEBUG &&
      (() => {
        const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
        return {
          host: url.hostname,
          port: +url.port,
        };
      })(),
    clearScreen: false,
  };
});
