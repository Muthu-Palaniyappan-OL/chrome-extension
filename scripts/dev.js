import { rollup, watch } from "rollup";
import swc from "@rollup/plugin-swc";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import fs from "fs";
import path from "path";

// Shared plugins configuration
const basePlugins = (isReact) => [
  nodeResolve(),
  commonjs(),
  replace({
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
    preventAssignment: true,
  }),
  swc(
    isReact
      ? {
          jsc: {
            parser: { syntax: "typescript", tsx: true },
            transform: {
              react: {
                runtime: "automatic",
                development: process.env.NODE_ENV !== "production",
              },
            },
          },
        }
      : {}
  ),
];

// Watcher and Build Setup
const createWatcher = (input, outputFile, isReact = false) => {
  const config = {
    input,
    output: {
      file: outputFile,
      format: "esm",
      sourcemap: true,
    },
    plugins: basePlugins(isReact),
  };

  // Build and Watch setup
  const watcher = watch(config);
  watcher.on("event", (event) => {
    if (event.code === "BUNDLE_START") console.log(`Building ${outputFile}...`);
    if (event.code === "BUNDLE_END")
      console.log(`Build complete for ${outputFile}`);
    if (event.code === "ERROR") console.error("Build error:", event.error);
    if (event.code === "END")
      console.log(`Watching for changes in ${input}...`);
  });
};

// Copies files on change
const copyFileOnChange = (filePath, distDir) => {
  fs.mkdirSync(distDir, { recursive: true });

  const copyFile = () => {
    const fileName = path.basename(filePath);
    const destPath = path.join(distDir, fileName);
    fs.copyFile(filePath, destPath, (err) => {
      if (err) {
        console.error(`Failed to copy HTML file: ${err}`);
      } else {
        console.log(`Copied HTML file to ${destPath}`);
      }
    });
  };

  copyFile();

  fs.watch(filePath, (eventType) => {
    if (eventType === "change" || eventType === "rename") {
      console.log(`Detected change in ${filePath}`);
      copyFile();
    }
  });
};

// Folder sync
const syncFolder = (srcDir, destDir) => {
  fs.mkdirSync(destDir, { recursive: true });

  const copyDirectory = (src, dest) => {
    fs.readdir(src, (err, files) => {
      if (err) {
        console.error(`Failed to read directory: ${err}`);
        return;
      }

      files.forEach((file) => {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        fs.stat(srcFile, (err, stats) => {
          if (err) {
            console.error(`Failed to get stats for ${srcFile}: ${err}`);
            return;
          }

          if (stats.isDirectory()) {
            copyDirectory(srcFile, destFile);
          } else {
            fs.copyFile(srcFile, destFile, (err) => {
              if (err) {
                console.error(
                  `Failed to copy file ${srcFile} to ${destFile}: ${err}`
                );
              } else {
                console.log(`Copied file to ${destFile}`);
              }
            });
          }
        });
      });
    });
  };

  copyDirectory(srcDir, destDir);

  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (eventType === "rename" || eventType === "change") {
      console.log(`Detected change in ${srcDir}`);
      copyDirectory(srcDir, destDir);
    }
  });
};

// Manifest JSON
copyFileOnChange("./src/manifest.json", "./dist/");

// Options Page
createWatcher(
  "./src/pages/options/app.tsx",
  "./dist/pages/options/main.js",
  true
);
copyFileOnChange("./src/pages/options/index.html", "./dist/pages/options/");

// Popup Page
createWatcher("./src/pages/popup/app.tsx", "./dist/pages/popup/main.js", true);
copyFileOnChange("./src/pages/popup/index.html", "./dist/pages/popup/");

// Background
createWatcher("./src/background/index.ts", "./dist/background/index.js");

// Content
createWatcher("./src/content/index.ts", "./dist/content/index.js");

// public folder
syncFolder("./public", "./dist/public");