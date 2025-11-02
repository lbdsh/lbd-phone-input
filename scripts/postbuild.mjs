import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve();
const assetsSrc = resolve(root, "src/assets");
const assetsDest = resolve(root, "dist/assets");

if (existsSync(assetsSrc)) {
  mkdirSync(resolve(root, "dist"), { recursive: true });
  cpSync(assetsSrc, assetsDest, { recursive: true });
}
