#!/usr/bin/env node
// Generate 180x180 PNG favicons with bullseye pattern using pure Node.js
// No external dependencies - uses zlib for deflate and manual PNG chunk construction.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 180;
const CX = SIZE / 2;
const CY = SIZE / 2;

// Radii for the three concentric circles (bullseye)
const R_OUTER = 80;   // large filled circle
const R_MIDDLE = 50;  // white ring
const R_INNER = 25;   // small filled center

function hexToRGB(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function distSq(x, y) {
  return (x - CX) * (x - CX) + (y - CY) * (y - CY);
}

// Build raw RGBA pixel rows (each row prefixed with filter byte 0 = None)
function buildImageData(primaryHex) {
  const [pr, pg, pb] = hexToRGB(primaryHex);
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4)); // rows * (filterByte + width*RGBA)

  const rOuterSq = R_OUTER * R_OUTER;
  const rMiddleSq = R_MIDDLE * R_MIDDLE;
  const rInnerSq = R_INNER * R_INNER;

  for (let y = 0; y < SIZE; y++) {
    const rowOffset = y * (1 + SIZE * 4);
    buf[rowOffset] = 0; // filter: None
    for (let x = 0; x < SIZE; x++) {
      const d = distSq(x + 0.5, y + 0.5);
      const pixOffset = rowOffset + 1 + x * 4;
      let r, g, b, a;

      if (d <= rInnerSq) {
        // Inner filled circle
        r = pr; g = pg; b = pb; a = 255;
      } else if (d <= rMiddleSq) {
        // White ring
        r = 255; g = 255; b = 255; a = 255;
      } else if (d <= rOuterSq) {
        // Outer filled circle
        r = pr; g = pg; b = pb; a = 255;
      } else {
        // Background - white
        r = 255; g = 255; b = 255; a = 255;
      }

      // Simple anti-aliasing at circle edges
      for (const [radius, inside, outside] of [
        [R_OUTER, [pr, pg, pb], [255, 255, 255]],
        [R_MIDDLE, [255, 255, 255], [pr, pg, pb]],
        [R_INNER, [pr, pg, pb], [255, 255, 255]],
      ]) {
        const rSq = radius * radius;
        const dist = Math.sqrt(d);
        if (Math.abs(dist - radius) < 1.2) {
          const t = Math.max(0, Math.min(1, (radius - dist + 0.6) / 1.2));
          r = Math.round(inside[0] * t + outside[0] * (1 - t));
          g = Math.round(inside[1] * t + outside[1] * (1 - t));
          b = Math.round(inside[2] * t + outside[2] * (1 - t));
          a = 255;
          break;
        }
      }

      buf[pixOffset] = r;
      buf[pixOffset + 1] = g;
      buf[pixOffset + 2] = b;
      buf[pixOffset + 3] = a;
    }
  }
  return buf;
}

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

function buildPNG(primaryHex) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bitDepth=8, colorType=6(RGBA), compression=0, filter=0, interlace=0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT: deflate-compressed image data
  const rawData = buildImageData(primaryHex);
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Sites to generate favicons for
const sites = [
  { name: 'vanga',       color: '#7b4a9e', path: 'db/vanga/img/favicon.png' },
  { name: 'nostradamus', color: '#8b1a1a', path: 'db/nostradamus/img/favicon.png' },
  { name: 'tuibeitu',    color: '#1a3a5c', path: 'db/tuibeitu/img/favicon.png' },
];

const baseDir = __dirname;

for (const site of sites) {
  const png = buildPNG(site.color);
  const outPath = path.join(baseDir, site.path);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${site.name} favicon: ${outPath} (${png.length} bytes, ${SIZE}x${SIZE})`);
}

console.log('Done.');
