import { BrowserWindow } from "electron";
import os from "node:os"
export const setIcon = (mainWindow:BrowserWindow, publicFolder:string) => {
  switch (os.platform()) {
    case 'darwin':
      mainWindow.setIcon(`${publicFolder}/favicon.ico`);
      break;
    case 'win32':
      mainWindow.setIcon(`${publicFolder}/favicon.ico`);
      break;
    default:
      mainWindow.setIcon(`${publicFolder}/favicon.ico`);
      break;
  }
}