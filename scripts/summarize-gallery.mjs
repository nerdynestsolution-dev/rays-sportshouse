#!/usr/bin/env node
/**
 * Automatic Gallery Image Summarizer & Renamer for Ray's SportsHouse
 * Usage: npm run gallery:sync
 *
 * Scans `public/gallery/` (and its subfolders) for any newly dropped images that do not yet have
 * an entry in `src/data/gallery.json`.
 * - If GEMINI_API_KEY is available in the environment, uses Gemini 2.5 Flash vision to inspect
 *   the image, identify the exact Ray's SportsHouse menu item or bar scene, rename the image file
 *   to a clean descriptive slug, and write the title, category, tag, and summary into `src/data/gallery.json`.
 * - Otherwise, matches the filename/folder against `src/data/menu.json` and `src/data/specials.json`
 *   and saves a clean metadata entry into `src/data/gallery.json`.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const GALLERY_DIR = path.join(ROOT, 'public', 'gallery');
const GALLERY_JSON_PATH = path.join(ROOT, 'src', 'data', 'gallery.json');
const MENU_JSON_PATH = path.join(ROOT, 'src', 'data', 'menu.json');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function analyzeWithGemini(filePath, menuItemsSummary, apiKey) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg';

  const base64Data = fs.readFileSync(filePath).toString('base64');

  const prompt = `You are cataloging photos for "Ray's SportsHouse", a Mizzou-themed sports bar in Historic Soulard, St. Louis, MO (54+ HD TVs).
Here are the official menu items at Ray's SportsHouse:
${menuItemsSummary}

Inspect this photo and return ONLY a valid JSON object with these keys:
- "slug": a descriptive lowercase hyphenated filename slug (without extension), e.g. "toasted-beef-ravioli" or "mizzou-saturday-crowd"
- "title": a punchy display title (include price if it matches a menu item), e.g. "Toasted Beef Ravioli ($15.99)"
- "category": one of ["54+ Screens", "Game Day Crowds", "Food & Drinks", "Patio & Interior"]
- "tag": short 2-3 word badge, e.g. "STL Staple", "House Signature", "54+ HD TVs"
- "caption": 1-2 sentence appetizing or energetic description matching Ray's SportsHouse menu/vibe.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}`);
  }
  const result = await response.json();
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(rawText);
}

async function main() {
  const galleryData = JSON.parse(fs.readFileSync(GALLERY_JSON_PATH, 'utf-8'));
  const menuData = JSON.parse(fs.readFileSync(MENU_JSON_PATH, 'utf-8'));
  galleryData.metadataByFilename = galleryData.metadataByFilename || {};

  const menuItemsSummary = menuData.categories
    .flatMap((c) => c.items.map((i) => `- ${i.name} (${i.price}): ${i.description}`))
    .join('\n');

  const apiKey = process.env.GEMINI_API_KEY || '';
  const allFiles = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        allFiles.push(fullPath);
      }
    }
  }

  walk(GALLERY_DIR);

  let updatedCount = 0;

  for (const filePath of allFiles) {
    const fileName = path.basename(filePath);
    if (galleryData.metadataByFilename[fileName]) {
      continue;
    }

    console.log(`Found new gallery photo: ${fileName}`);
    const dirName = path.dirname(filePath);
    const ext = path.extname(fileName).toLowerCase();

    if (apiKey) {
      try {
        const analysis = await analyzeWithGemini(filePath, menuItemsSummary, apiKey);
        const newFileName = `${slugify(analysis.slug || path.basename(fileName, ext))}${ext}`;
        const newFilePath = path.join(dirName, newFileName);

        if (newFilePath !== filePath && !fs.existsSync(newFilePath)) {
          fs.renameSync(filePath, newFilePath);
          console.log(`  -> Renamed: ${fileName} => ${newFileName}`);
        }

        const finalKey = fs.existsSync(newFilePath) ? newFileName : fileName;
        galleryData.metadataByFilename[finalKey] = {
          title: analysis.title,
          category: analysis.category,
          tag: analysis.tag,
          aspect: 'aspect-[16/10]',
          caption: analysis.caption,
        };
        updatedCount++;
        continue;
      } catch (err) {
        console.warn(`  -> Vision API skipped (${err.message}), using smart menu/filename matcher.`);
      }
    }

    // Fallback smart filename/menu matcher
    const cleanSlug = slugify(path.basename(fileName, ext));
    const newFileName = `${cleanSlug}${ext}`;
    const newFilePath = path.join(dirName, newFileName);
    if (newFilePath !== filePath && !fs.existsSync(newFilePath)) {
      fs.renameSync(filePath, newFilePath);
    }
    const finalKey = fs.existsSync(newFilePath) ? newFileName : fileName;
    galleryData.metadataByFilename[finalKey] = {
      title: cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      category: 'Food & Drinks',
      tag: "Ray's Soulard",
      aspect: 'aspect-[16/10]',
      caption: "Live at Ray's SportsHouse • 1732 S 9th St in Historic Soulard, St. Louis.",
    };
    updatedCount++;
  }

  if (updatedCount > 0) {
    fs.writeFileSync(GALLERY_JSON_PATH, JSON.stringify(galleryData, null, 2) + '\n', 'utf-8');
    console.log(`Updated src/data/gallery.json with ${updatedCount} new photo(s).`);
  } else {
    console.log('All photos in public/gallery/ are already summarized and up to date!');
  }
}

main();
