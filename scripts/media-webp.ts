// media-webp: convert the PNG screenshots in public/media to WebP (q 85) and point design/media-map.json at them.

import { readdirSync, rmSync } from "node:fs";
import sharp from "sharp";

const dir = "public/media";
for (const f of readdirSync(dir).filter((f) => f.endsWith(".png"))) {
  await sharp(`${dir}/${f}`)
    .webp({ quality: 85 })
    .toFile(`${dir}/${f.replace(/\.png$/, ".webp")}`);
  rmSync(`${dir}/${f}`);
}
const mapFile = "design/media-map.json";
const map = JSON.parse(await Bun.file(mapFile).text());
for (const k of Object.keys(map)) map[k] = map[k].replace(/\.png$/, ".webp");
await Bun.write(mapFile, JSON.stringify(map, null, 2) + "\n");
console.log("done");
