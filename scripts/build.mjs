import { build } from "esbuild";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const output = resolve(root, "dist");
if (dirname(output) !== root || basename(output) !== "dist") throw new Error("Invalid build output path");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ["src/index.ts"],
  bundle: true,
  splitting: true,
  outdir: "dist",
  outExtension: { ".js": ".ts" },
  chunkNames: "chunks/[name]-[hash]",
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["@earendil-works/*", "typebox", "typebox/*"],
  banner: { js: "// Generated from src; rebuild with npm run build.\n// @ts-nocheck" },
});
async function rewrite(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) await rewrite(path);
    else if (item.name.endsWith(".ts")) {
      const text = await readFile(path, "utf8");
      // Pi's Jiti loader accepts .ts, and split chunks must use the same suffix.
      await writeFile(path, text.replace(/(["'])((?:\.\.?\/)[^"']+)\.js\1/g, "$1$2.ts$1"));
    }
  }
}
await rewrite(resolve(root, "dist"));
console.log("Built pi-goal-retry (10 retries by default).");
