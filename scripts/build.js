#!/usr/bin/env node

/**
 * Build script for packaging the chat app into dist/.
 * The script copies the runtime assets and installs production dependencies
 * so that dist/ can be deployed as-is.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const skipInstall = process.env.SKIP_BUILD_INSTALL === "true";

const alwaysCopyFiles = new Set([
  "Chat.config.example",
  "package.json",
  "package-lock.json",
  "install.sh",
  "run",
]);
const directoriesToCopy = ["server", "web", "save"];

function cleanDist() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDirectory(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath);
    }
  }
}

function gatherFilesToCopy() {
  const files = new Set(alwaysCopyFiles);
  const localConfigPath = path.join(projectRoot, "Chat.config");
  if (fs.existsSync(localConfigPath)) {
    files.add("Chat.config");
  }
  return [...files];
}

function copyStaticFiles(files) {
  files.forEach((file) => {
    const from = path.join(projectRoot, file);
    if (!fs.existsSync(from)) return;
    const to = path.join(distDir, file);
    copyFile(from, to);
  });
}

function copyDirectories() {
  directoriesToCopy.forEach((dir) => {
    const from = path.join(projectRoot, dir);
    if (!fs.existsSync(from)) return;
    const to = path.join(distDir, dir);
    copyDirectory(from, to);
  });
}

function installDependencies() {
  if (skipInstall) {
    console.warn(
      "Skipping npm install step because SKIP_BUILD_INSTALL=true is set."
    );
    return;
  }
  try {
    execSync("npm install --omit=dev", {
      cwd: distDir,
      stdio: "inherit",
    });
  } catch (err) {
    console.error("\nFailed to install production dependencies.");
    throw err;
  }
}

function run() {
  console.log("Building Benno111 Chat...");
  cleanDist();
  const files = gatherFilesToCopy();
  console.log(`Copying ${files.length} files into dist/`);
  copyStaticFiles(files);
  console.log("Copying asset directories...");
  copyDirectories();
  console.log("Installing production dependencies...");
  installDependencies();
  console.log("Build complete! Output available in dist/");
}

run();
