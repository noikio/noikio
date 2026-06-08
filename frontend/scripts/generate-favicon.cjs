#!/usr/bin/env node
'use strict';

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'public', 'favicon.svg');
const icoPath = path.join(root, 'public', 'favicon.ico');

const svgData = fs.readFileSync(svgPath, 'utf8');

// Render SVG to PNG at 32×32
const resvg = new Resvg(svgData, { fitTo: { mode: 'width', value: 32 } });
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

// Build ICO wrapping the PNG (modern ICO format with embedded PNG)
// ICONDIR: reserved(2) + type(2) + count(2)
const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0);   // reserved
iconDir.writeUInt16LE(1, 2);   // type: 1 = ICO
iconDir.writeUInt16LE(1, 4);   // image count

// ICONDIRENTRY: width(1) + height(1) + colorCount(1) + reserved(1) + planes(2) + bitCount(2) + bytesInRes(4) + imageOffset(4)
const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(32, 0);                     // width (0 = 256)
dirEntry.writeUInt8(32, 1);                     // height
dirEntry.writeUInt8(0, 2);                      // color count
dirEntry.writeUInt8(0, 3);                      // reserved
dirEntry.writeUInt16LE(1, 4);                   // planes
dirEntry.writeUInt16LE(32, 6);                  // bit count
dirEntry.writeUInt32LE(pngBuffer.length, 8);    // size of image data
dirEntry.writeUInt32LE(6 + 16, 12);             // offset: after ICONDIR + ICONDIRENTRY

const ico = Buffer.concat([iconDir, dirEntry, pngBuffer]);
fs.writeFileSync(icoPath, ico);

console.log(`favicon.ico written (${ico.length} bytes, 32×32 lightning bolt)`);
