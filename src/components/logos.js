// Optical logo sizing, computed at build time.
//
// Every logo file has its own canvas (padding, aspect ratio), so a fixed CSS height makes
// some logos look far bigger than others. Here we measure the visible part of each logo
// (non-transparent pixels) and give it a height so that all logos in a row cover roughly
// the same visual area: wide wordmarks get shorter, compact/square marks get taller.
//
// sizeLogo(src, ref) -> number K. Use it as  height: calc(K * var(--logo-u)), where --logo-u is
// about 1px on desktop and shrinks on small screens. `ref` is the height (in --u) that a
// logo with a 4:1 aspect ratio should get; it sets the size of a tier.
import fs from 'node:fs';
import path from 'node:path';

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { sharp = null; }

const cache = new Map();

async function measure(src) {
  if (cache.has(src)) return cache.get(src);
  let m = null;
  try {
    const file = path.join(process.cwd(), 'public', decodeURIComponent(src));
    if (sharp && fs.existsSync(file)) {
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const { width: W, height: H, channels: C } = info;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (data[(y * W + x) * C + 3] > 24) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      if (x1 >= x0 && y1 >= y0) m = { W, H, cw: x1 - x0 + 1, ch: y1 - y0 + 1 };
    }
  } catch { m = null; }
  cache.set(src, m);
  return m;
}

export async function sizeLogo(src, ref, { min = 0.5, max = 1.4, maxW = 5.2 } = {}) {
  const m = await measure(src);
  if (!m) return ref; // unknown: fall back to the tier height
  const ratio = m.cw / m.ch;                       // aspect ratio of the visible logo
  let contentH = ref * Math.sqrt(4 / ratio);       // equal visual area as a 4:1 logo of height `ref`
  contentH = Math.min(Math.max(contentH, ref * min), ref * max);
  contentH = Math.min(contentH, (ref * maxW * 2) / ratio); // cap very wide logos
  const imgH = contentH * (m.H / m.ch);            // add back the file's own padding
  return Math.round(imgH * 10) / 10;
}
