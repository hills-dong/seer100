#!/usr/bin/env node
// Generate 180x180 PNG favicons with unique designs matching each site's logo.
// No external dependencies - uses zlib for deflate and manual PNG chunk construction.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 180;
const CX = SIZE / 2;
const CY = SIZE / 2;

function hexToRGB(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function dist(x, y, cx, cy) {
  return Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
}

function blend(c1, c2, t) {
  return [
    Math.round(c1[0] * t + c2[0] * (1 - t)),
    Math.round(c1[1] * t + c2[1] * (1 - t)),
    Math.round(c1[2] * t + c2[2] * (1 - t)),
  ];
}

// --- Vanga: Eye icon (matching logo) ---
// Outer colored circle with white iris and colored pupil
function buildVangaData() {
  const [pr, pg, pb] = hexToRGB('#7b4a9e');
  const dark = hexToRGB('#5c2d82');
  const white = [255, 255, 255];
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));

  const R = 78; // outer circle
  const eyeW = 70; // eye-shaped white area half-width
  const eyeH = 40; // eye-shaped white area half-height
  const irisR = 28; // iris radius
  const pupilR = 14; // pupil radius

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0;
    for (let x = 0; x < SIZE; x++) {
      const px = x + 0.5, py = y + 0.5;
      const d = dist(px, py, CX, CY);
      const pixOff = rowOff + 1 + x * 4;
      let r, g, b;

      // Eye shape: elliptical with pointed ends
      const nx = (px - CX) / eyeW;
      const ny = (py - CY) / eyeH;
      const eyeDist = nx * nx + ny * ny;

      if (d > R + 0.8) {
        r = 255; g = 255; b = 255; // background
      } else if (d > R - 0.8) {
        const t = Math.max(0, Math.min(1, (R - d + 0.8) / 1.6));
        [r, g, b] = blend([pr, pg, pb], white, t);
      } else if (d <= pupilR + 0.8 && d > pupilR - 0.8) {
        const t = Math.max(0, Math.min(1, (pupilR - d + 0.8) / 1.6));
        [r, g, b] = blend(dark, white, t);
      } else if (d <= pupilR) {
        r = dark[0]; g = dark[1]; b = dark[2];
      } else if (d <= irisR + 0.8 && d > irisR - 0.8 && eyeDist < 1.2) {
        const t = Math.max(0, Math.min(1, (irisR - d + 0.8) / 1.6));
        [r, g, b] = blend(white, [pr, pg, pb], t);
      } else if (d <= irisR && eyeDist < 1.0) {
        r = 255; g = 255; b = 255;
      } else if (eyeDist < 1.05 && eyeDist > 0.95) {
        const t = Math.max(0, Math.min(1, (1.0 - eyeDist) / 0.1 + 0.5));
        [r, g, b] = blend(white, [pr, pg, pb], t);
      } else if (eyeDist < 1.0) {
        r = 255; g = 255; b = 255;
      } else {
        r = pr; g = pg; b = pb;
      }

      buf[pixOff] = r; buf[pixOff + 1] = g; buf[pixOff + 2] = b; buf[pixOff + 3] = 255;
    }
  }
  return buf;
}

// --- Nostradamus: Star icon (matching logo's star polygon) ---
function buildNostradamusData() {
  const primary = hexToRGB('#8b1a1a');
  const bg = hexToRGB('#f5f0e8');
  const white = [255, 255, 255];
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));

  // 5-pointed star using polar coordinates
  const R_OUTER_STAR = 75;
  const R_INNER_STAR = 30;
  const innerCircleR = 22;
  const dotR = 12;

  function isInStar(px, py) {
    const dx = px - CX, dy = py - CY;
    const angle = Math.atan2(dy, dx);
    const r = Math.sqrt(dx * dx + dy * dy);
    // 5-pointed star: alternating outer/inner radii every 36 degrees
    const a = ((angle + Math.PI * 2.5) % (Math.PI * 2)); // rotate so top point is up
    const sector = a / (Math.PI * 2) * 10; // 0-10 for 10 sectors
    const sectorAngle = (sector % 2) < 1 ? (sector % 2) : (2 - (sector % 2)); // 0->1->0 triangle wave
    const edgeR = R_INNER_STAR + (R_OUTER_STAR - R_INNER_STAR) * (1 - sectorAngle);
    return r <= edgeR ? edgeR - r : -(r - edgeR);
  }

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0;
    for (let x = 0; x < SIZE; x++) {
      const px = x + 0.5, py = y + 0.5;
      const pixOff = rowOff + 1 + x * 4;
      const d = dist(px, py, CX, CY);
      let r, g, b;

      const starDist = isInStar(px, py);

      if (d <= dotR + 0.8 && d > dotR - 0.8) {
        const t = Math.max(0, Math.min(1, (dotR - d + 0.8) / 1.6));
        [r, g, b] = blend(primary, bg, t);
      } else if (d <= dotR) {
        r = primary[0]; g = primary[1]; b = primary[2];
      } else if (d <= innerCircleR + 0.8 && d > innerCircleR - 0.8) {
        const t = Math.max(0, Math.min(1, (innerCircleR - d + 0.8) / 1.6));
        [r, g, b] = blend(bg, primary, t);
      } else if (d <= innerCircleR) {
        r = bg[0]; g = bg[1]; b = bg[2];
      } else if (starDist > -1.2 && starDist < 1.2) {
        const t = Math.max(0, Math.min(1, (starDist + 1.2) / 2.4));
        [r, g, b] = blend(primary, white, t);
      } else if (starDist >= 1.2) {
        r = primary[0]; g = primary[1]; b = primary[2];
      } else {
        r = 255; g = 255; b = 255;
      }

      buf[pixOff] = r; buf[pixOff + 1] = g; buf[pixOff + 2] = b; buf[pixOff + 3] = 255;
    }
  }
  return buf;
}

// --- Tui Bei Tu: Yin-Yang / Taijitu icon (matching logo) ---
function buildTuibeituData() {
  const dark = hexToRGB('#1a3a5c');
  const light = hexToRGB('#f0ece4');
  const white = [255, 255, 255];
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));

  const R = 78;
  const smallR = R / 2;   // radius of the S-curve semicircles
  const dotR = R / 6;     // small dots

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0;
    for (let x = 0; x < SIZE; x++) {
      const px = x + 0.5, py = y + 0.5;
      const pixOff = rowOff + 1 + x * 4;
      const d = dist(px, py, CX, CY);
      let r, g, b;

      if (d > R + 0.8) {
        // Background
        r = 255; g = 255; b = 255;
      } else {
        // Inside the main circle - determine yin or yang side
        const dx = px - CX, dy = py - CY;

        // Top small semicircle center (dark side contains light dot)
        const topCY = CY - smallR;
        const dTop = dist(px, py, CX, topCY);

        // Bottom small semicircle center (light side contains dark dot)
        const botCY = CY + smallR;
        const dBot = dist(px, py, CX, botCY);

        // Determine which half: S-curve divides the circle
        // Right half = dark (yang), left half = light (yin)
        // But top semicircle bulges right, bottom bulges left
        let isDark;
        if (dTop <= smallR) {
          isDark = true;  // top bulge is dark
        } else if (dBot <= smallR) {
          isDark = false;  // bottom bulge is light
        } else {
          isDark = dx >= 0; // right = dark, left = light
        }

        // Small dots (opposing color)
        const dotTopD = dist(px, py, CX, topCY);
        const dotBotD = dist(px, py, CX, botCY);

        if (dotTopD <= dotR + 0.8 && dotTopD > dotR - 0.8) {
          const t = Math.max(0, Math.min(1, (dotR - dotTopD + 0.8) / 1.6));
          [r, g, b] = blend(light, dark, t);
        } else if (dotTopD <= dotR) {
          // Light dot in dark area
          r = light[0]; g = light[1]; b = light[2];
        } else if (dotBotD <= dotR + 0.8 && dotBotD > dotR - 0.8) {
          const t = Math.max(0, Math.min(1, (dotR - dotBotD + 0.8) / 1.6));
          [r, g, b] = blend(dark, light, t);
        } else if (dotBotD <= dotR) {
          // Dark dot in light area
          r = dark[0]; g = dark[1]; b = dark[2];
        } else if (isDark) {
          r = dark[0]; g = dark[1]; b = dark[2];
        } else {
          r = light[0]; g = light[1]; b = light[2];
        }

        // Anti-alias outer edge
        if (d > R - 0.8) {
          const t = Math.max(0, Math.min(1, (R - d + 0.8) / 1.6));
          const inner = [r, g, b];
          [r, g, b] = blend(inner, white, t);
        }
      }

      buf[pixOff] = r; buf[pixOff + 1] = g; buf[pixOff + 2] = b; buf[pixOff + 3] = 255;
    }
  }
  return buf;
}

// --- PNG encoding (reusable) ---
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

function encodePNG(imageData) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const compressed = zlib.deflateSync(imageData, { level: 9 });
  return Buffer.concat([sig, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
}

// --- Generate ---
const baseDir = __dirname;
const sites = [
  { name: 'vanga', builder: buildVangaData, out: 'db/vanga/img/favicon.png' },
  { name: 'nostradamus', builder: buildNostradamusData, out: 'db/nostradamus/img/favicon.png' },
  { name: 'tuibeitu', builder: buildTuibeituData, out: 'db/tuibeitu/img/favicon.png' },
];

for (const site of sites) {
  const data = site.builder();
  const png = encodePNG(data);
  const outPath = path.join(baseDir, site.out);
  fs.writeFileSync(outPath, png);
  console.log(`${site.name}: ${outPath} (${png.length} bytes, ${SIZE}x${SIZE})`);
}
console.log('Done.');
