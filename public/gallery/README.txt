HOW TO ADD PHOTOS TO THE RAY'S SPORTSHOUSE GALLERY
===================================================

Simply drag and drop your image files (.jpg, .jpeg, .png, .webp, .avif, .gif) into this folder:
  public/gallery/

1. AUTOMATIC DISPLAY:
   Every image placed in `public/gallery/` (or any of its subfolders) will automatically appear on the Photo Gallery page (`/gallery`) and Home page preview when the site runs or builds.

2. OPTIONAL CATEGORY FOLDERS:
   If you want your photos to automatically filter into categories on the Gallery page, you can drop them into these subfolders inside `public/gallery/`:
   - `public/gallery/screens/`        -> "54+ Screens"
   - `public/gallery/crowds/`         -> "Game Day Crowds"
   - `public/gallery/food-drinks/`    -> "Food & Drinks"
   - `public/gallery/patio-interior/` -> "Patio & Interior"

   (Any photos dropped directly into `public/gallery/` without a subfolder will still show up automatically!)

3. AUTOMATIC PICTURE SUMMARIZATION & RENAMING (3 WAYS):

   A) Ask Antigravity in Chat (Visual Inspection & Renaming):
      - A workspace rule (`.agent/rules/gallery-summarizer.md`) is configured so that anytime you drop new pictures into `public/gallery/` and say "Summarize the new pictures" (or "Update the gallery"), the assistant will visually inspect each new image, match it to your Ray's SportsHouse menu/specials/atmosphere, rename the file to a clean descriptive name, and save the title, category, tag, and summary into `src/data/gallery.json`.

   B) Automatic Menu & Specials Keyword Matcher (`src/utils/getGalleryPhotos.ts`):
      - If you name a file after a menu item, drink, or special (e.g., `toasted-beef-ravioli.jpg`, `jayhawk-tears.jpg`, `sarti-spritz.jpg`, `girl-dinner.jpg`, or `white-bean-dip.jpg`), the site automatically cross-references `src/data/menu.json`, `src/data/specials.json`, and `src/data/events.json` at build/dev time to pull the official item title, price, badge tag, and full menu description!
      - Camera filenames like `IMG_4021.jpg` or `DSC0012.jpg` are automatically given clean category-specific titles and captions based on their folder.

   C) One-Command CLI Sync (`npm run gallery:sync`):
      - Run `npm run gallery:sync` in the terminal (executes `scripts/summarize-gallery.mjs`) to scan `public/gallery/` for any newly dropped files not yet in `src/data/gallery.json`.
      - If `GEMINI_API_KEY` is set in your environment, `npm run gallery:sync` will use Gemini Vision to visually identify the dish or bar scene, rename the file to a clean slug, and write the custom title, category, tag, and caption to `src/data/gallery.json`.
      - Without an API key, it normalizes the filename slug and adds a clean entry into `src/data/gallery.json` that you can customize anytime.
