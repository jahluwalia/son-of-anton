#!/usr/bin/env node

import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import asciify from 'asciify-image';
import jimp from 'jimp';

const Jimp = jimp.default || jimp;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_IMAGE = join(__dirname, '../assets/gilfoyle.png');
const OUTPUT_ANSI = join(__dirname, '../assets/gilfoyle-ansi.txt');
const TEMP_CROPPED = join(__dirname, '../assets/gilfoyle-cropped.png');

async function generateAnsiArt() {
  try {
    console.log('Loading image...');
    const image = await Jimp.read(INPUT_IMAGE);

    // Get dimensions - image is 825x413
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    console.log(`Original dimensions: ${width}x${height}`);

    // Crop to square (413x413) by removing equal amounts from left and right
    const targetSize = height; // 413
    const cropX = Math.floor((width - targetSize) / 2); // (825 - 413) / 2 = 206

    console.log(`Cropping to square: ${targetSize}x${targetSize}, starting at x=${cropX}`);
    image.crop(cropX, 0, targetSize, targetSize);

    // Save cropped image
    await image.writeAsync(TEMP_CROPPED);
    console.log('Cropped image saved.');

    // Convert to ANSI art using asciify-image
    // This gives better color representation in terminals
    const ansiArt = await asciify(TEMP_CROPPED, {
      fit: 'box',
      width: 35,
      height: 35,
      format: 'string',
      color: true
    });

    // Save ANSI art to file
    await writeFile(OUTPUT_ANSI, ansiArt, 'utf-8');

    console.log(`✅ ANSI art generated successfully!`);
    console.log(`   Output: ${OUTPUT_ANSI}`);
    console.log(`   Cropped image: ${TEMP_CROPPED}`);

  } catch (err) {
    console.error('❌ Error generating ANSI art:', err.message);
    process.exit(1);
  }
}

generateAnsiArt();
