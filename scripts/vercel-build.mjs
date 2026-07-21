import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function clearDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return;
  }

  for (const entry of fs.readdirSync(directoryPath)) {
    fs.rmSync(path.join(directoryPath, entry), { recursive: true, force: true });
  }
}

function copyDirectoryContents(sourceDir, targetDir) {
  for (const entry of fs.readdirSync(sourceDir)) {
    const sourcePath = path.join(sourceDir, entry);
    const targetPath = path.join(targetDir, entry);
    const stats = fs.statSync(sourcePath);

    if (stats.isDirectory()) {
      ensureDirectory(targetPath);
      copyDirectoryContents(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

if (!fs.existsSync(distDir)) {
  throw new Error(`Expected Vite build output at ${distDir}`);
}

ensureDirectory(publicDir);
clearDirectory(publicDir);
copyDirectoryContents(distDir, publicDir);

console.log("[vercel-build] Copied dist/ output into public/ for Vercel static hosting.");
