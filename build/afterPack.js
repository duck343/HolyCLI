// afterPack hook: embed icon into the exe using local rcedit-x64.exe
// This avoids the winCodeSign download that fails due to macOS symlinks on Windows without Developer Mode

const path = require("path");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");

exports.default = async function afterPack(context) {
  if (process.platform !== "win32") return;

  const exePath = path.join(context.appOutDir, "holycli.exe");
  if (!fs.existsSync(exePath)) return;

  // Find rcedit-x64.exe in the pre-seeded cache
  const cacheBase = process.env.ELECTRON_BUILDER_CACHE ||
    path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "electron-builder", "Cache");

  const rceditPath = path.join(cacheBase, "winCodeSign-2.6.0", "rcedit-x64.exe");
  if (!fs.existsSync(rceditPath)) {
    console.warn("[afterPack] rcedit-x64.exe not found, skipping icon embed");
    return;
  }

  const iconPath = path.resolve(__dirname, "..", "assets", "icon.ico");
  if (!fs.existsSync(iconPath)) {
    console.warn("[afterPack] icon.ico not found, skipping icon embed");
    return;
  }

  try {
    execFileSync(rceditPath, [
      exePath,
      "--set-icon", iconPath,
      "--set-version-string", "ProductName", "Holy CLI",
      "--set-version-string", "FileDescription", "Holy CLI",
      "--set-file-version", "1.0.0.0",
      "--set-product-version", "1.0.0.0",
    ]);
    console.log("[afterPack] Icon embedded successfully");
  } catch (e) {
    console.warn("[afterPack] rcedit failed:", e.message);
  }
};
