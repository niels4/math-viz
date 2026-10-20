# Colors — Sommelier Workspace

New organized layout to avoid overwriting labs/galleries.

```
workspace/colors/
  catalog.json              — canonical palette catalog (9 palettes, mirrored to ../color-catalog.json)
  gallery.html              — short alias to galleries/gallery.html
  galleries/
    gallery.html            — main filterable gallery (all palettes) — also mirrored to ../../color-gallery.html
    index.html              — gallery index
    <custom>.html           — per-collection galleries (create via color-gallery with filename=colors/galleries/<name>.html)
  labs/
    <slug>.html             — per-palette labs, one per palette, no overwrite (e.g. neon-noir.html, fintech-dashes.html)
    index.html              — labs index with links
```

## Why

Previously `workspace/color-lab.html` was single-slot and each `color-lab` call overwrote it. Now `color-lab` defaults to `colors/labs/<slug>.html` per palette when `paletteId` is given, so multiple labs coexist.

Same for galleries: `color-gallery` defaults to `colors/galleries/gallery.html` and mirrors to legacy `workspace/color-gallery.html` for backwards compat.

## Usage

- List palettes: `color_catalog action=list`
- Derive from image: `color_extract gallery=time-series file=media/galleries/time-series/03-dark-smooth-neon.png`
- Add palette: `color_catalog action=add entry={name, colors, ...}`
- Build lab per palette: `color_lab paletteId=neon-noir filename=colors/labs/neon-noir.html sourceFile=...`
- Build gallery: `color_gallery filename=colors/galleries/gallery.html`
- Export theme: `theme_export paletteId=neon-noir vizProject=alpha/viz1`

Serve: `python -m http.server 8787` in `workspace` → http://localhost:8787/colors/labs/neon-noir.html etc.

Legacy paths (`workspace/color-catalog.json`, `workspace/color-gallery.html`, `workspace/color-lab.html`) remain auto-synced for existing workflows.
