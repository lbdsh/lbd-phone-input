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

  const esmSource = resolve(root, 'dist/index.js');
  const cjsSource = resolve(root, 'dist/index.cjs');
  const cssSource = resolve(root, 'dist/styles.css');

  cpSync(esmSource, resolve(cdnDest, 'lbd-phone-input.esm.js'));
  cpSync(cjsSource, resolve(cdnDest, 'lbd-phone-input.cjs'));
  cpSync(cssSource, resolve(cdnDest, 'lbd-phone-input.css'));

  cpSync(esmSource, resolve(cdnDest, 'lbd-phone-input.esm.min.js'));
  cpSync(cjsSource, resolve(cdnDest, 'lbd-phone-input.cjs.min.js'));

  cpSync(assetsSrc, resolve(cdnDest, 'assets'), { recursive: true });
}
