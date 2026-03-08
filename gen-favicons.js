#!/usr/bin/env node
// Generate 180x180 PNG favicons by parsing logo SVG icon shapes.
// No external dependencies - uses zlib for deflate and manual PNG chunk construction.
//
// For sites with logo.svg: auto-parses circle, line, rect, polygon, path elements and renders them.
// For sites with logo.png (no SVG): uses custom builder if registered.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 180;
const ICON_BOX = 28;       // Logo icon area: x=0..28, y=0..28
const SCALE = SIZE / ICON_BOX;
const AA = 0.12;           // Anti-aliasing edge width in logo-space units

// ============================================================
// Color utilities
// ============================================================

function hexToRGB(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function dist(x, y, cx, cy) {
  return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
}

// ============================================================
// SVG parsing — extract circle, line, rect, polygon, path from logo SVG
// ============================================================

function parseAttrs(str) {
  const attrs = {};
  const re = /([\w-]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(str)) !== null) attrs[m[1]] = m[2];
  return attrs;
}

function parseSvgShapes(svgContent) {
  const shapes = [];
  const tagRe = /<(circle|line|rect|polygon|path)\s+([^>]*?)\/>/g;
  let m;
  while ((m = tagRe.exec(svgContent)) !== null) {
    const tag = m[1];
    const a = parseAttrs(m[2]);

    if (tag === 'circle') {
      const cx = parseFloat(a.cx || 0);
      const cy = parseFloat(a.cy || 0);
      const r = parseFloat(a.r || 0);
      const fill = a.fill || 'none';
      const stroke = a.stroke || 'none';
      const sw = parseFloat(a['stroke-width'] || 0);
      if (fill !== 'none') shapes.push({ type: 'circle', cx, cy, r, color: hexToRGB(fill) });
      if (stroke !== 'none' && sw > 0) shapes.push({ type: 'ring', cx, cy, r, sw, color: hexToRGB(stroke) });
    } else if (tag === 'line') {
      const x1 = parseFloat(a.x1 || 0), y1 = parseFloat(a.y1 || 0);
      const x2 = parseFloat(a.x2 || 0), y2 = parseFloat(a.y2 || 0);
      const stroke = a.stroke || 'none';
      const sw = parseFloat(a['stroke-width'] || 1);
      const linecap = a['stroke-linecap'] || 'butt';
      if (stroke !== 'none') shapes.push({ type: 'line', x1, y1, x2, y2, sw, linecap, color: hexToRGB(stroke) });
    } else if (tag === 'rect') {
      const rx = parseFloat(a.x || 0), ry = parseFloat(a.y || 0);
      const rw = parseFloat(a.width || 0), rh = parseFloat(a.height || 0);
      const cr = parseFloat(a.rx || a.ry || 0);
      const fill = a.fill || 'none';
      const stroke = a.stroke || 'none';
      const sw = parseFloat(a['stroke-width'] || 0);
      if (fill !== 'none') shapes.push({ type: 'rect', rx, ry, rw, rh, cr, color: hexToRGB(fill) });
      if (stroke !== 'none' && sw > 0) shapes.push({ type: 'rect_stroke', rx, ry, rw, rh, cr, sw, color: hexToRGB(stroke) });
    } else if (tag === 'polygon') {
      const pts = a.points.trim().split(/\s+/).map(p => p.split(',').map(Number));
      const fill = a.fill || '#000';
      const stroke = a.stroke || 'none';
      const sw = parseFloat(a['stroke-width'] || 0);
      if (fill !== 'none') shapes.push({ type: 'polygon', pts, color: hexToRGB(fill) });
      if (stroke !== 'none' && sw > 0) shapes.push({ type: 'poly_stroke', pts, sw, color: hexToRGB(stroke) });
    } else if (tag === 'path' && a.d) {
      const fill = a.fill || '#000';
      const stroke = a.stroke || 'none';
      const sw = parseFloat(a['stroke-width'] || 0);
      const polyline = pathToPolyline(a.d);
      if (fill !== 'none') shapes.push({ type: 'path', polyline, color: hexToRGB(fill) });
      if (stroke !== 'none' && sw > 0) shapes.push({ type: 'path_stroke', polyline, sw, color: hexToRGB(stroke) });
    }
  }
  return shapes;
}

// ============================================================
// SVG path → polyline (supports M, A, Z commands)
// ============================================================

function pathToPolyline(d) {
  const pts = [];
  const tokens = d.match(/[MmAaLlZz]|[-+]?\d*\.?\d+/g);
  if (!tokens) return pts;
  let i = 0, cx = 0, cy = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') {
      cx = parseFloat(tokens[i++]); cy = parseFloat(tokens[i++]);
      pts.push([cx, cy]);
    } else if (cmd === 'A') {
      const rx = parseFloat(tokens[i++]);
      parseFloat(tokens[i++]); // ry (unused, assume rx=ry)
      parseFloat(tokens[i++]); // x-rotation
      const la = parseInt(tokens[i++]);
      const sw = parseInt(tokens[i++]);
      const x2 = parseFloat(tokens[i++]);
      const y2 = parseFloat(tokens[i++]);
      pts.push(...arcToSegments(cx, cy, rx, la, sw, x2, y2));
      cx = x2; cy = y2;
    } else if (cmd === 'L') {
      cx = parseFloat(tokens[i++]); cy = parseFloat(tokens[i++]);
      pts.push([cx, cy]);
    } else if (cmd === 'Z' || cmd === 'z') {
      // close path — implicit
    }
  }
  return pts;
}

function arcToSegments(x1, y1, r, largeArc, sweep, x2, y2) {
  const segs = 64;
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const d2 = dx * dx + dy * dy;
  let sq = Math.sqrt(Math.max(0, r * r / d2 - 1));
  if (largeArc === sweep) sq = -sq;
  const acx = sq * dy + (x1 + x2) / 2;
  const acy = -sq * dx + (y1 + y2) / 2;

  let a1 = Math.atan2(y1 - acy, x1 - acx);
  let a2 = Math.atan2(y2 - acy, x2 - acx);
  let da = a2 - a1;
  if (sweep && da < 0) da += 2 * Math.PI;
  if (!sweep && da > 0) da -= 2 * Math.PI;

  const pts = [];
  for (let i = 1; i <= segs; i++) {
    const a = a1 + da * (i / segs);
    pts.push([acx + r * Math.cos(a), acy + r * Math.sin(a)]);
  }
  return pts;
}

// ============================================================
// Pixel-level rendering (logo-space coordinates, scaled to SIZE)
// ============================================================

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function distToPolyEdge(px, py, poly) {
  let minD = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x1, y1] = poly[j], [x2, y2] = poly[i];
    const edx = x2 - x1, edy = y2 - y1;
    const len2 = edx * edx + edy * edy;
    let t = len2 > 0 ? ((px - x1) * edx + (py - y1) * edy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = dist(px, py, x1 + t * edx, y1 + t * edy);
    if (d < minD) minD = d;
  }
  return minD;
}

// Distance from point to line segment
function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(px, py, x1, y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return dist(px, py, x1 + t * dx, y1 + t * dy);
}

// Distance from point to polyline (open path, not closed polygon)
function distToPolylineEdge(px, py, pts) {
  let minD = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSeg(px, py, pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]);
    if (d < minD) minD = d;
  }
  return minD;
}

// Check if point is inside a rounded rectangle
function pointInRoundedRect(px, py, rx, ry, rw, rh, cr) {
  if (px < rx || px > rx + rw || py < ry || py > ry + rh) return false;
  if (cr <= 0) return true;
  // Check corners
  for (const [ccx, ccy] of [[rx+cr, ry+cr], [rx+rw-cr, ry+cr], [rx+cr, ry+rh-cr], [rx+rw-cr, ry+rh-cr]]) {
    if (px >= rx && px <= rx+rw && py >= ry && py <= ry+rh) {
      const inCornerRegion = (px < rx+cr || px > rx+rw-cr) && (py < ry+cr || py > ry+rh-cr);
      if (inCornerRegion && dist(px, py, ccx, ccy) > cr) return false;
    }
  }
  return true;
}

// Compute shape coverage (0..1) at logo-space point (lx, ly)
function shapeCoverage(shape, lx, ly) {
  const aa = AA;
  if (shape.type === 'circle') {
    const d = dist(lx, ly, shape.cx, shape.cy);
    if (d <= shape.r - aa) return 1;
    if (d >= shape.r + aa) return 0;
    return (shape.r + aa - d) / (2 * aa);
  }
  if (shape.type === 'ring') {
    const d = dist(lx, ly, shape.cx, shape.cy);
    const inner = shape.r - shape.sw / 2;
    const outer = shape.r + shape.sw / 2;
    if (d < inner - aa || d > outer + aa) return 0;
    let cov = 1;
    if (d < inner + aa) cov = Math.min(cov, (d - inner + aa) / (2 * aa));
    if (d > outer - aa) cov = Math.min(cov, (outer - d + aa) / (2 * aa));
    return Math.max(0, cov);
  }
  if (shape.type === 'line') {
    const d = distToSeg(lx, ly, shape.x1, shape.y1, shape.x2, shape.y2);
    const halfW = shape.sw / 2;
    // Round linecap: extend with circle at endpoints
    if (shape.linecap === 'round') {
      const dEnd1 = dist(lx, ly, shape.x1, shape.y1);
      const dEnd2 = dist(lx, ly, shape.x2, shape.y2);
      const minD = Math.min(d, dEnd1, dEnd2);
      if (minD <= halfW - aa) return 1;
      if (minD >= halfW + aa) return 0;
      return (halfW + aa - minD) / (2 * aa);
    }
    if (d <= halfW - aa) return 1;
    if (d >= halfW + aa) return 0;
    return (halfW + aa - d) / (2 * aa);
  }
  if (shape.type === 'rect') {
    const inside = pointInRoundedRect(lx, ly, shape.rx, shape.ry, shape.rw, shape.rh, shape.cr);
    if (inside) return 1;
    return 0;
  }
  if (shape.type === 'rect_stroke') {
    // Approximate: render as 4 lines forming a rectangle border
    const { rx, ry, rw, rh, sw } = shape;
    const halfW = sw / 2;
    const lines = [
      [rx, ry, rx+rw, ry], [rx+rw, ry, rx+rw, ry+rh],
      [rx+rw, ry+rh, rx, ry+rh], [rx, ry+rh, rx, ry]
    ];
    let minD = Infinity;
    for (const [x1, y1, x2, y2] of lines) {
      const d = distToSeg(lx, ly, x1, y1, x2, y2);
      if (d < minD) minD = d;
    }
    if (minD <= halfW - aa) return 1;
    if (minD >= halfW + aa) return 0;
    return (halfW + aa - minD) / (2 * aa);
  }
  if (shape.type === 'polygon' || shape.type === 'path') {
    const poly = shape.type === 'polygon' ? shape.pts : shape.polyline;
    const inside = pointInPolygon(lx, ly, poly);
    const ed = distToPolyEdge(lx, ly, poly);
    if (inside) return ed >= aa ? 1 : ed / aa;
    return ed < aa ? 1 - ed / aa : 0;
  }
  if (shape.type === 'poly_stroke') {
    const halfW = shape.sw / 2;
    const d = distToPolyEdge(lx, ly, shape.pts);
    if (d <= halfW - aa) return 1;
    if (d >= halfW + aa) return 0;
    return (halfW + aa - d) / (2 * aa);
  }
  if (shape.type === 'path_stroke') {
    const halfW = shape.sw / 2;
    const d = distToPolylineEdge(lx, ly, shape.polyline);
    if (d <= halfW - aa) return 1;
    if (d >= halfW + aa) return 0;
    return (halfW + aa - d) / (2 * aa);
  }
  return 0;
}

function buildFromSvg(svgPath) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const shapes = parseSvgShapes(svg);
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0; // PNG filter byte
    for (let x = 0; x < SIZE; x++) {
      // Map pixel center to logo-space
      const lx = (x + 0.5) / SCALE;
      const ly = (y + 0.5) / SCALE;
      const pixOff = rowOff + 1 + x * 4;

      // Composite shapes in document order (painter's algorithm)
      let rr = 0, gg = 0, bb = 0, aa = 0;
      for (const s of shapes) {
        const cov = shapeCoverage(s, lx, ly);
        if (cov <= 0) continue;
        const sa = cov;
        const da = aa / 255;
        const oa = sa + da * (1 - sa);
        if (oa > 0) {
          rr = Math.round((s.color[0] * sa + rr * da * (1 - sa)) / oa);
          gg = Math.round((s.color[1] * sa + gg * da * (1 - sa)) / oa);
          bb = Math.round((s.color[2] * sa + bb * da * (1 - sa)) / oa);
          aa = Math.round(oa * 255);
        }
      }
      buf[pixOff] = rr;
      buf[pixOff + 1] = gg;
      buf[pixOff + 2] = bb;
      buf[pixOff + 3] = aa;
    }
  }
  return buf;
}

// ============================================================
// Custom builders (for sites without SVG icon, e.g. PNG logos)
// ============================================================

function buildKfkData() {
  const primary = hexToRGB('#007722');
  const buf = Buffer.alloc(SIZE * (1 + SIZE * 4));
  const pad = 16, cornerR = 28, strokeW = 22;
  const cx = SIZE / 2, cy = SIZE / 2;

  function inRoundedRect(px, py) {
    if (px >= pad + cornerR && px <= SIZE - pad - cornerR && py >= pad && py <= SIZE - pad) return true;
    if (py >= pad + cornerR && py <= SIZE - pad - cornerR && px >= pad && px <= SIZE - pad) return true;
    for (const [ccx, ccy] of [[pad+cornerR,pad+cornerR],[SIZE-pad-cornerR,pad+cornerR],[pad+cornerR,SIZE-pad-cornerR],[SIZE-pad-cornerR,SIZE-pad-cornerR]]) {
      if (dist(px, py, ccx, ccy) <= cornerR) return true;
    }
    return false;
  }

  function distToSeg(px, py, x1, y1, x2, y2) {
    const dx = x2-x1, dy = y2-y1, len2 = dx*dx+dy*dy;
    if (len2 === 0) return dist(px, py, x1, y1);
    const t = Math.max(0, Math.min(1, ((px-x1)*dx+(py-y1)*dy)/len2));
    return dist(px, py, x1+t*dx, y1+t*dy);
  }

  const kLeft = 52, kBarW = strokeW, kMidY = cy;
  const kJoinX = kLeft + kBarW + 4, kTopRight = 132, kBotRight = 132;
  const kTopY = pad + 20, kBotY = SIZE - pad - 20;

  function inK(px, py) {
    if (px >= kLeft && px <= kLeft+kBarW && py >= kTopY && py <= kBotY) return true;
    if (distToSeg(px, py, kJoinX, kMidY, kTopRight, kTopY) <= strokeW/2) return true;
    if (distToSeg(px, py, kJoinX, kMidY, kBotRight, kBotY) <= strokeW/2) return true;
    return false;
  }

  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    buf[rowOff] = 0;
    for (let x = 0; x < SIZE; x++) {
      const px = x+0.5, py = y+0.5, pixOff = rowOff+1+x*4;
      if (!inRoundedRect(px, py)) { buf[pixOff+3] = 0; }
      else if (inK(px, py)) { buf[pixOff]=255; buf[pixOff+1]=255; buf[pixOff+2]=255; buf[pixOff+3]=255; }
      else { buf[pixOff]=primary[0]; buf[pixOff+1]=primary[1]; buf[pixOff+2]=primary[2]; buf[pixOff+3]=255; }
    }
  }
  return buf;
}

const customBuilders = { kfk: buildKfkData };

// ============================================================
// PNG encoding
// ============================================================

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

// ============================================================
// Auto-discover sites and generate
// ============================================================

const baseDir = __dirname;
const dbDir = path.join(baseDir, 'db');
const siteIds = fs.readdirSync(dbDir).filter(d =>
  fs.statSync(path.join(dbDir, d)).isDirectory() &&
  fs.existsSync(path.join(dbDir, d, 'config.json'))
);

for (const siteId of siteIds) {
  const svgPath = path.join(dbDir, siteId, 'img', 'logo.svg');
  const outPath = path.join(dbDir, siteId, 'img', 'favicon.png');

  let data;
  if (fs.existsSync(svgPath) && !customBuilders[siteId]) {
    data = buildFromSvg(svgPath);
    console.log(`${siteId}: parsed logo.svg → ${outPath}`);
  } else if (customBuilders[siteId]) {
    data = customBuilders[siteId]();
    console.log(`${siteId}: custom builder → ${outPath}`);
  } else {
    console.warn(`${siteId}: no logo.svg and no custom builder, skipped`);
    continue;
  }

  const png = encodePNG(data);
  fs.writeFileSync(outPath, png);
  console.log(`  ${png.length} bytes, ${SIZE}x${SIZE}`);
}
console.log('Done.');
