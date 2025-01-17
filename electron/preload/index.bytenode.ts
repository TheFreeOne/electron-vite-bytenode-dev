import path from "path";
const bytenode = require("bytenode");

/**
 * https://github.com/bytenode/bytenode/issues/198
 * @returns
 */
function preload() {
  const preloadJscPath = path.join(__dirname, "./preload.jsc");

  try {
    console.log("preloadJscPath");

    require(preloadJscPath);
  } catch (error) {
    console.error(error);
  }
  return true;
}
preload();
