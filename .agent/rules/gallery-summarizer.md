# Automatic Gallery Picture Summarization & Renaming Rule

Whenever the user drops new pictures into `public/gallery/` (or any of its subfolders `screens/`, `crowds/`, `food-drinks/`, `patio-interior/`) or asks to update/check the gallery:

1. **Inspect Visually**: Use `view_file` on every newly added image in `public/gallery/` that does not yet have a custom entry in `src/data/gallery.json` (`metadataByFilename`).
2. **Cross-Reference Official Data**: Match food, drinks, and atmosphere details against `src/data/menu.json`, `src/data/specials.json`, and `src/data/events.json` (including exact dish names, ingredients, and prices).
3. **Rename with Relevance**: Rename generic filenames (such as `IMG_...`, `food6.jpg`, `Interior4.jpg`) to clean, descriptive, lowercase hyphenated filenames (e.g., `toasted-beef-ravioli.jpg`, `jayhawk-tears-bucket.jpg`).
4. **Save Summary to `src/data/gallery.json`**: Add an entry under `metadataByFilename` with:
   - `title`: Descriptive title (include menu price if applicable)
   - `category`: One of `"54+ Screens"`, `"Game Day Crowds"`, `"Food & Drinks"`, or `"Patio & Interior"`
   - `tag`: Short 2–3 word badge
   - `aspect`: Aspect ratio class (e.g., `"aspect-[16/10]"`, `"aspect-[4/3]"`, `"aspect-[4/5]"`)
   - `caption`: Rich 1–2 sentence summary describing what is in the picture with relevant Ray's SportsHouse context.
