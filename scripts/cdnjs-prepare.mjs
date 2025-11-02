import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const targetRepo = process.argv[2];
if (!targetRepo) {
  console.error("Usage: node scripts/cdnjs-prepare.mjs <cdnjs-packages path>");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const metadata = {
  name: pkg.name,
  description: pkg.description,
  repository: pkg.repository,
  author: pkg.author,
  license: pkg.license,
  npmName: pkg.name,
  filename: "lbd-phone-input.esm.min.js",
  autoupdate: {
    source: "npm",
    target: pkg.name,
    fileMap: [
      {
        basePath: "dist/cdn",
        files: [
          "lbd-phone-input.esm.js",
          "lbd-phone-input.esm.min.js",
          "lbd-phone-input.cjs",
          "lbd-phone-input.cjs.min.js",
          "lbd-phone-input.css",
          "assets/*"
        ]
      }
    ]
  }
};

const packageDir = resolve(targetRepo, "packages", pkg.name);
mkdirSync(packageDir, { recursive: true });
writeFileSync(resolve(packageDir, "package.json"), JSON.stringify(metadata, null, 2) + "\n");
