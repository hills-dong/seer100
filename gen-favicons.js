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

// Helper: write pixel with RGBA
function setPx(buf, pixOff, r, g, b, a) {
  buf[pixOff] = r; buf[pixOff + 1] = g; buf[pixOff + 2] = b; buf[pixOff + 3] = a;
}

// --- Vanga: Concentric circles (matching logo SVG) ---
// Logo: outer circle #7b4a9e, white ring #fff, inner pupil #5c2d82
function buildVangaData() {
  const primary = hexToRGB('#7b4a9e');
  const dark = hexToRGB('#5c2d82');
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));

  const outerR = 78;
  const whiteR = 36;
  const pupilR = 18;

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0;
    for (let x = 0; x < SIZE; x++) {
      const px = x + 0.5, py = y + 0.5;
      const d = dist(px, py, CX, CY);
      const pixOff = rowOff + 1 + x * 4;

      if (d > outerR + 0.8) {
        setPx(buf, pixOff, 0, 0, 0, 0); // transparent
      } else if (d > outerR - 0.8) {
        const a = Math.round(Math.max(0, Math.min(1, (outerR - d + 0.8) / 1.6)) * 255);
        setPx(buf, pixOff, primary[0], primary[1], primary[2], a);
      } else if (d <= pupilR) {
        setPx(buf, pixOff, dark[0], dark[1], dark[2], 255);
      } else if (d <= pupilR + 0.8) {
        const [r, g, b] = blend(dark, [255, 255, 255], Math.max(0, Math.min(1, (pupilR - d + 0.8) / 1.6)));
        setPx(buf, pixOff, r, g, b, 255);
      } else if (d <= whiteR) {
        setPx(buf, pixOff, 255, 255, 255, 255);
      } else if (d <= whiteR + 0.8) {
        const [r, g, b] = blend([255, 255, 255], primary, Math.max(0, Math.min(1, (whiteR - d + 0.8) / 1.6)));
        setPx(buf, pixOff, r, g, b, 255);
      } else {
        setPx(buf, pixOff, primary[0], primary[1], primary[2], 255);
      }
    }
  }
  return buf;
}

// --- Nostradamus: Sharp 5-pointed star with center circles (matching logo SVG) ---
// Logo: polygon star #8b1a1a, inner circle r=4 #f5f0e8, dot r=2 #8b1a1a
function buildNostradamusData() {
  const primary = hexToRGB('#8b1a1a');
  const bg = hexToRGB('#f5f0e8');
  const white = [255, 255, 255];
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));

  // Build star polygon matching logo: points="14,2 17.5,10 26,10 19.5,15.5 22,24 14,19 6,24 8.5,15.5 2,10 10.5,10"
  // Scale from logo coords (center 14,14, range ~2-26) to 180x180 (center 90,90)
  const scale = 180 / 28;
  const logoPoints = [
    [14,2], [17.5,10], [26,10], [19.5,15.5], [22,24],
    [14,19], [6,24], [8.5,15.5], [2,10], [10.5,10]
  ];
  const starPoly = logoPoints.map(([lx, ly]) => [lx * scale, ly * scale]);

  const innerCircleR = 4 * scale;   // ~25.7
  const dotR = 2 * scale;           // ~12.9

  function pointInPolygon(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Distance from point to polygon edge (for anti-aliasing)
  function distToPolygonEdge(px, py, poly) {
    let minD = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [x1, y1] = poly[j], [x2, y2] = poly[i];
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      let t = len2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const cx = x1 + t * dx, cy = y1 + t * dy;
      const d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
      if (d < minD) minD = d;
    }
    return minD;
  }

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0;
    for (let x = 0; x < SIZE; x++) {
      const px = x + 0.5, py = y + 0.5;
      const pixOff = rowOff + 1 + x * 4;
      const d = dist(px, py, CX, CY);

      // Center dot (primary)
      if (d <= dotR) {
        setPx(buf, pixOff, primary[0], primary[1], primary[2], 255);
      } else if (d <= dotR + 0.8) {
        const [r, g, b] = blend(primary, bg, Math.max(0, Math.min(1, (dotR - d + 0.8) / 1.6)));
        setPx(buf, pixOff, r, g, b, 255);
      }
      // Inner circle (bg color)
      else if (d <= innerCircleR) {
        setPx(buf, pixOff, bg[0], bg[1], bg[2], 255);
      } else if (d <= innerCircleR + 0.8) {
        const [r, g, b] = blend(bg, primary, Math.max(0, Math.min(1, (innerCircleR - d + 0.8) / 1.6)));
        setPx(buf, pixOff, r, g, b, 255);
      }
      // Star polygon
      else {
        const inStar = pointInPolygon(px, py, starPoly);
        const edgeDist = distToPolygonEdge(px, py, starPoly);
        if (inStar) {
          if (edgeDist < 1.2) {
            const a = Math.round(Math.max(0, Math.min(1, edgeDist / 1.2)) * 255);
            setPx(buf, pixOff, primary[0], primary[1], primary[2], a);
          } else {
            setPx(buf, pixOff, primary[0], primary[1], primary[2], 255);
          }
        } else {
          if (edgeDist < 1.2) {
            const a = Math.round(Math.max(0, Math.min(1, 1 - edgeDist / 1.2)) * 255);
            setPx(buf, pixOff, primary[0], primary[1], primary[2], a);
          } else {
            setPx(buf, pixOff, 0, 0, 0, 0); // transparent
          }
        }
      }
    }
  }
  return buf;
}

// --- Tui Bei Tu: Yin-Yang / Taijitu icon (matching logo SVG) ---
// Logo: dark=#1a3a5c fills full circle, light=#f0ece4 is the right-side fish via S-curve path,
// light dot at top (cy=8), dark dot at bottom (cy=20), outer ring stroke
function buildTuibeituData() {
  const dark = hexToRGB('#1a3a5c');
  const light = hexToRGB('#f0ece4');
  const white = [255, 255, 255];
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));

  // Logo: center (14,14), outer r=12, dots at (14,8) r=2.2 and (14,20) r=2.2
  // Scale: 180/28 ≈ 6.43
  const R = 78;            // 12 * 6.5
  const smallR = R / 2;    // half-circle radius for S-curve
  // Dots: at (14,8) and (14,20) in logo → offset ±6 from center → ±39 in 180px
  const dotOffY = 39;
  const dotR = 14;         // 2.2 * 6.43 ≈ 14

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0;
    for (let x = 0; x < SIZE; x++) {
      const px = x + 0.5, py = y + 0.5;
      const pixOff = rowOff + 1 + x * 4;
      const d = dist(px, py, CX, CY);
      let r, g, b;

      if (d > R + 0.8) {
        setPx(buf, pixOff, 0, 0, 0, 0); // transparent
      } else {
        const dx = px - CX;

        const dTop = dist(px, py, CX, CY - smallR);
        const dBot = dist(px, py, CX, CY + smallR);

        let isLight;
        if (dTop <= smallR) {
          isLight = true;
        } else if (dBot <= smallR) {
          isLight = false;
        } else {
          isLight = dx >= 0;
        }

        // Small dots (opposing color)
        const dotTopD = dist(px, py, CX, CY - dotOffY);
        const dotBotD = dist(px, py, CX, CY + dotOffY);
        let r, g, b;

        if (dotTopD <= dotR + 0.8 && dotTopD > dotR - 0.8) {
          const t = Math.max(0, Math.min(1, (dotR - dotTopD + 0.8) / 1.6));
          [r, g, b] = blend(light, dark, t);
        } else if (dotTopD <= dotR) {
          r = light[0]; g = light[1]; b = light[2];
        } else if (dotBotD <= dotR + 0.8 && dotBotD > dotR - 0.8) {
          const t = Math.max(0, Math.min(1, (dotR - dotBotD + 0.8) / 1.6));
          [r, g, b] = blend(dark, light, t);
        } else if (dotBotD <= dotR) {
          r = dark[0]; g = dark[1]; b = dark[2];
        } else if (isLight) {
          r = light[0]; g = light[1]; b = light[2];
        } else {
          r = dark[0]; g = dark[1]; b = dark[2];
        }

        // Anti-alias outer edge with alpha
        if (d > R - 0.8) {
          const a = Math.round(Math.max(0, Math.min(1, (R - d + 0.8) / 1.6)) * 255);
          setPx(buf, pixOff, r, g, b, a);
        } else {
          setPx(buf, pixOff, r, g, b, 255);
        }
      }
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

// --- KFK: Bold "K" letter with time-circle motif (matching green text logo) ---
// Logo: "KFK 2060" text in #007722 green
function buildKfkData() {
  const primary = hexToRGB('#007722');
  const dark = hexToRGB('#005518');
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));

  // Draw a rounded-square background with the letter "K"
  const pad = 16;        // padding from edge
  const cornerR = 28;    // corner radius
  const strokeW = 22;    // stroke width for the K
  const cx = CX, cy = CY;

  // Helper: is point inside rounded rect
  function inRoundedRect(px, py) {
    if (px >= pad + cornerR && px <= SIZE - pad - cornerR) {
      if (py >= pad && py <= SIZE - pad) return true;
    }
    if (py >= pad + cornerR && py <= SIZE - pad - cornerR) {
      if (px >= pad && px <= SIZE - pad) return true;
    }
    // Corners
    const corners = [
      [pad + cornerR, pad + cornerR],
      [SIZE - pad - cornerR, pad + cornerR],
      [pad + cornerR, SIZE - pad - cornerR],
      [SIZE - pad - cornerR, SIZE - pad - cornerR],
    ];
    for (const [ccx, ccy] of corners) {
      if (dist(px, py, ccx, ccy) <= cornerR) return true;
    }
    return false;
  }

  // "K" shape: vertical bar on left, two diagonals meeting at center-left
  const kLeft = 52;          // left edge of vertical bar
  const kBarW = strokeW;     // vertical bar width
  const kMidY = cy;          // where diagonals meet
  const kJoinX = kLeft + kBarW + 4; // where diagonals join the vertical
  const kTopRight = 132;     // right end of upper diagonal
  const kBotRight = 132;     // right end of lower diagonal
  const kTopY = pad + 20;    // top of K
  const kBotY = SIZE - pad - 20; // bottom of K

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return dist(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return dist(px, py, x1 + t * dx, y1 + t * dy);
  }

  function inK(px, py) {
    // Vertical bar
    if (px >= kLeft && px <= kLeft + kBarW && py >= kTopY && py <= kBotY) return true;
    // Upper diagonal: from (kJoinX, kMidY) to (kTopRight, kTopY)
    const d1 = distToSegment(px, py, kJoinX, kMidY, kTopRight, kTopY);
    if (d1 <= strokeW / 2) return true;
    // Lower diagonal: from (kJoinX, kMidY) to (kBotRight, kBotY)
    const d2 = distToSegment(px, py, kJoinX, kMidY, kBotRight, kBotY);
    if (d2 <= strokeW / 2) return true;
    return false;
  }

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0;
    for (let x = 0; x < SIZE; x++) {
      const px = x + 0.5, py = y + 0.5;
      const pixOff = rowOff + 1 + x * 4;

      if (!inRoundedRect(px, py)) {
        setPx(buf, pixOff, 0, 0, 0, 0);
      } else if (inK(px, py)) {
        setPx(buf, pixOff, 255, 255, 255, 255);
      } else {
        setPx(buf, pixOff, primary[0], primary[1], primary[2], 255);
      }
    }
  }
  return buf;
}

// --- Generate ---
const baseDir = __dirname;
const sites = [
  { name: 'kfk', builder: buildKfkData, out: 'db/kfk/img/favicon.png' },
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
