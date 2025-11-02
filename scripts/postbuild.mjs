import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve();
const assetsSrc = resolve(root, "src/assets");
const assetsDest = resolve(root, "dist/assets");

if (existsSync(assetsSrc)) {
  mkdirSync(resolve(root, "dist"), { recursive: true });
  cpSync(assetsSrc, assetsDest, { recursive: true });

  const cdnDest = resolve(root, "dist/cdn");
  mkdirSync(cdnDest, { recursive: true });
  cpSync(resolve(root, 'dist/index.js'), resolve(cdnDest, 'lbd-phone-input.esm.js'));
  cpSync(resolve(root, 'dist/index.cjs'), resolve(cdnDest, 'lbd-phone-input.cjs'));
  cpSync(resolve(root, 'dist/styles.css'), resolve(cdnDest, 'lbd-phone-input.css'));
  cpSync(assetsSrc, resolve(cdnDest, 'assets'), { recursive: true });
}
