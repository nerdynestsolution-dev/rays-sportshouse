import fs from 'node:fs';
import path from 'node:path';
import galleryData from '../data/gallery.json';
import menuData from '../data/menu.json';
import specialsData from '../data/specials.json';
import eventsData from '../data/events.json';

export interface GalleryPhoto {
  id: string;
  title: string;
  category: string;
  caption: string;
  image: string;
  aspect: string;
  tag: string;
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

const FOLDER_CATEGORY_MAP: Record<string, { category: string; tag: string; defaultCaption: string }> = {
  screens: {
    category: '54+ Screens',
    tag: '54+ HD TVs',
    defaultCaption:
      "Wall-to-wall HD screens at Ray's SportsHouse in Historic Soulard — every game, every angle, with full stadium broadcast sound.",
  },
  crowds: {
    category: 'Game Day Crowds',
    tag: 'Game Day Live',
    defaultCaption:
      "Packed game day energy at Ray's SportsHouse — the home of Mizzou in St. Louis and Soulard's ultimate watch party destination.",
  },
  'food-drinks': {
    category: 'Food & Drinks',
    tag: 'Kitchen & Bar',
    defaultCaption:
      "Scratch-made game day food and ice-cold drinks served fresh at Ray's SportsHouse at 1732 S 9th St in Soulard.",
  },
  'patio-interior': {
    category: 'Patio & Interior',
    tag: 'Historic Soulard',
    defaultCaption:
      "Inside Ray's SportsHouse on South 9th Street — classic Soulard exposed brick, high-top seating, billiards, and wall-to-wall sports.",
  },
};

const ASPECT_CYCLE = ['aspect-[16/10]', 'aspect-[4/3]', 'aspect-[4/5]', 'aspect-square'];

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'with', 'for', 'our', 'from', 'served'].includes(w));
}

/**
 * Automatically matches a filename against Ray's official menu items, specials, and watch party events
 * so newly dropped photos get rich, accurate titles and descriptions automatically.
 */
function matchFromSiteData(filename: string): {
  title: string;
  category: string;
  tag: string;
  caption: string;
} | null {
  const baseName = path.basename(filename, path.extname(filename));
  const fileTokens = normalizeTokens(baseName);
  if (fileTokens.length === 0) return null;

  // 1. Check Menu Items in src/data/menu.json
  let bestMenuMatch: {
    name: string;
    price: string;
    description: string;
    badge: string | null;
    score: number;
  } | null = null;

  for (const category of menuData.categories) {
    for (const item of category.items) {
      const itemTokens = normalizeTokens(item.name);
      const overlap = fileTokens.filter((t) => itemTokens.some((it) => it.includes(t) || t.includes(it))).length;
      if (overlap > 0 && (!bestMenuMatch || overlap > bestMenuMatch.score)) {
        bestMenuMatch = {
          name: item.name,
          price: item.price,
          description: item.description,
          badge: item.badge,
          score: overlap,
        };
      }
    }
  }

  if (bestMenuMatch && bestMenuMatch.score >= 1) {
    const priceSuffix =
      bestMenuMatch.price && !bestMenuMatch.price.toLowerCase().includes('ask')
        ? ` (${bestMenuMatch.price})`
        : '';
    return {
      title: `${bestMenuMatch.name}${priceSuffix}`,
      category: 'Food & Drinks',
      tag: bestMenuMatch.badge || 'Menu Favorite',
      caption: bestMenuMatch.description,
    };
  }

  // 2. Check Specials in src/data/specials.json
  for (const special of specialsData.gameDaySpecials) {
    const specialTokens = normalizeTokens(`${special.title} ${special.day}`);
    const overlap = fileTokens.filter((t) => specialTokens.includes(t)).length;
    if (overlap >= 2) {
      return {
        title: special.title,
        category: special.id.includes('dinner') || special.id.includes('lunch') ? 'Food & Drinks' : 'Game Day Crowds',
        tag: special.badge,
        caption: `${special.description} (${special.timing})`,
      };
    }
  }

  // 3. Check Watch Party Events in src/data/events.json
  for (const event of eventsData.events) {
    const eventTokens = normalizeTokens(`${event.title} ${event.category} ${event.league}`);
    const overlap = fileTokens.filter((t) => eventTokens.includes(t)).length;
    if (overlap >= 2) {
      return {
        title: event.title,
        category: 'Game Day Crowds',
        tag: event.badge,
        caption: event.description,
      };
    }
  }

  return null;
}

function formatTitleFromFilename(filename: string, folderCategory?: string): string {
  const base = path.basename(filename, path.extname(filename));
  if (/^(img|dsc|pxl|media|photo|image|pic|whatsapp)[_-]?\d+/i.test(base) || /^\d+$/.test(base)) {
    if (folderCategory === 'Food & Drinks') return "Ray's Kitchen & Bar Feature";
    if (folderCategory === '54+ Screens') return "54+ HD Screens at Ray's SportsHouse";
    if (folderCategory === 'Patio & Interior') return "Inside Ray's SportsHouse Soulard";
    return "Game Day at Ray's SportsHouse";
  }
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function inferCategoryFromFilename(filename: string): {
  category: string;
  tag: string;
  defaultCaption: string;
} {
  const lower = filename.toLowerCase();
  if (lower.includes('tv') || lower.includes('screen') || lower.includes('nfl') || lower.includes('redzone')) {
    return FOLDER_CATEGORY_MAP['screens'];
  }
  if (lower.includes('crowd') || lower.includes('mizzou') || lower.includes('ufc') || lower.includes('party') || lower.includes('fans')) {
    return FOLDER_CATEGORY_MAP['crowds'];
  }
  if (
    lower.includes('patio') ||
    lower.includes('interior') ||
    lower.includes('billiards') ||
    lower.includes('pool') ||
    lower.includes('soulard') ||
    lower.includes('outside')
  ) {
    return FOLDER_CATEGORY_MAP['patio-interior'];
  }
  if (
    lower.includes('food') ||
    lower.includes('drink') ||
    lower.includes('wing') ||
    lower.includes('burger') ||
    lower.includes('beer') ||
    lower.includes('cocktail') ||
    lower.includes('ravioli') ||
    lower.includes('fries') ||
    lower.includes('pizza') ||
    lower.includes('pretzel') ||
    lower.includes('reuben') ||
    lower.includes('wrap') ||
    lower.includes('salad') ||
    lower.includes('dip') ||
    lower.includes('tostada') ||
    lower.includes('curds')
  ) {
    return FOLDER_CATEGORY_MAP['food-drinks'];
  }
  return FOLDER_CATEGORY_MAP['crowds'];
}

export function getGalleryPhotos(): GalleryPhoto[] {
  const galleryDir = path.resolve(process.cwd(), 'public', 'gallery');
  const localPhotos: GalleryPhoto[] = [];
  const metadataMap: Record<
    string,
    { title?: string; category?: string; tag?: string; aspect?: string; caption?: string }
  > = (galleryData as any).metadataByFilename || {};

  for (const subfolder of Object.keys(FOLDER_CATEGORY_MAP)) {
    const subDir = path.join(galleryDir, subfolder);
    if (!fs.existsSync(subDir)) {
      try {
        fs.mkdirSync(subDir, { recursive: true });
      } catch {
        // Ignore mkdir errors in read-only environments
      }
    }
  }

  if (fs.existsSync(galleryDir)) {
    const entries = fs.readdirSync(galleryDir, { withFileTypes: true });
    let index = 0;

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(ext)) continue;

        const customMeta = metadataMap[entry.name];
        const autoMatch = !customMeta ? matchFromSiteData(entry.name) : null;
        const inferred = inferCategoryFromFilename(entry.name);

        const category = customMeta?.category || autoMatch?.category || inferred.category;
        localPhotos.push({
          id: `local-${entry.name}`,
          title: customMeta?.title || autoMatch?.title || formatTitleFromFilename(entry.name, category),
          category,
          caption: customMeta?.caption || autoMatch?.caption || inferred.defaultCaption,
          image: `/gallery/${encodeURIComponent(entry.name)}`,
          aspect: customMeta?.aspect || ASPECT_CYCLE[index % ASPECT_CYCLE.length],
          tag: customMeta?.tag || autoMatch?.tag || inferred.tag,
        });
        index++;
      } else if (entry.isDirectory()) {
        const subDirName = entry.name.toLowerCase();
        const subDirPath = path.join(galleryDir, entry.name);
        const subFiles = fs.readdirSync(subDirPath, { withFileTypes: true });
        const folderMeta = FOLDER_CATEGORY_MAP[subDirName];

        for (const subFile of subFiles) {
          if (!subFile.isFile()) continue;
          const ext = path.extname(subFile.name).toLowerCase();
          if (!IMAGE_EXTENSIONS.has(ext)) continue;

          const customMeta = metadataMap[subFile.name];
          const autoMatch = !customMeta ? matchFromSiteData(subFile.name) : null;
          const inferred = folderMeta || inferCategoryFromFilename(subFile.name);

          const category = customMeta?.category || folderMeta?.category || autoMatch?.category || inferred.category;
          localPhotos.push({
            id: `local-${entry.name}-${subFile.name}`,
            title: customMeta?.title || autoMatch?.title || formatTitleFromFilename(subFile.name, category),
            category,
            caption: customMeta?.caption || autoMatch?.caption || inferred.defaultCaption,
            image: `/gallery/${encodeURIComponent(entry.name)}/${encodeURIComponent(subFile.name)}`,
            aspect: customMeta?.aspect || ASPECT_CYCLE[index % ASPECT_CYCLE.length],
            tag: customMeta?.tag || autoMatch?.tag || inferred.tag,
          });
          index++;
        }
      }
    }
  }

  return localPhotos;
}
