import bytenode from "bytenode";
import fs from "fs";
import v8 from "v8";
import path from "path";
import { app, dialog } from "electron";

const isDev = import.meta.env.DEV;
async function main() {
  let mainJscPath = path.join(process.cwd(), "./main/index.jsc");
  let mainJsPath = path.join(process.cwd(), "./main/index.js");

  let preloadJscPath = path.join(process.cwd(), "./preload/index.jsc");
  let preloadJsPath = path.join(process.cwd(), "./preload/index.js");

  console.log("isDev is ", isDev);
  console.log("app.isPackaged ", app.isPackaged);
  console.log("process.env.VITE_DEV_SERVER_URL ", process.env.VITE_DEV_SERVER_URL);
  if (isDev) {
    console.log("process.cwd() ", process.cwd());
    // TODO replace process.cwd() with __dirname
    mainJscPath = path.join(process.cwd(), "./dist-electron/main/index.jsc");
    mainJsPath = path.join(process.cwd(), "./dist-electron/main/index.js");
    preloadJscPath = path.join(
      process.cwd(),
      "./dist-electron/preload/index.jsc"
    );
    preloadJsPath = path.join(
      process.cwd(),
      "./dist-electron/preload/index.js"
    );

    console.log("main.jsc path dev", mainJscPath);
  } else {
    console.log("process.cwd() ", process.cwd());
    mainJscPath = path.join(process.cwd(), "./resources/app/dist-electron/main/index.jsc"); 
    mainJsPath = path.join(process.cwd(), "./resources/app/dist-electron/main/index.js");
    preloadJscPath = path.join(
      process.cwd(),
      "./dist-electron/preload/index.jsc"
    );
    preloadJsPath = path.join(
      process.cwd(),
      "./dist-electron/preload/index.js"
    );

    console.log("main.jsc path dev", mainJscPath);
  }

  if (!app.isPackaged) {
    console.log("main.jsc path ", mainJscPath);
    v8.setFlagsFromString("--no-lazy");
    v8.setFlagsFromString("--no-flush-bytecode");
    if (fs.existsSync(mainJscPath)) {
      fs.unlinkSync(mainJscPath);
    }
    if (fs.existsSync(preloadJscPath)) {
      fs.unlinkSync(preloadJscPath);
    }

    if (!fs.existsSync(mainJscPath)) {
      const str = await bytenode.compileFile(mainJsPath, mainJscPath);
      console.log("mainJscPath is ", str);
    }

    if (!fs.existsSync(preloadJscPath)) {
      const str = await bytenode.compileFile(preloadJsPath, preloadJscPath);
      console.log("preloadJscPath is ", str);
    }
  }

  try {
    require(mainJscPath);
  } catch (error) {
    if (app.isPackaged) {
      console.log(error);
    }
    // 立即退出应用程序
    dialog.showErrorBox("start error", (error as unknown as Error).message);
    app.exit(0);
  }
}
main();
