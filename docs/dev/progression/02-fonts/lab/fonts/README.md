# Fonts — Sommelier Workspace

```
workspace/fonts/
  catalog.json            — canonical font catalog (23 fonts)
  gallery.html            — short alias → galleries/gallery.html
  galleries/
    gallery.html          — main gallery (all fonts, editable specimen)
    index.html
    <custom>.html         — per-collection galleries via font-gallery filename=fonts/galleries/<name>.html
  labs/
    <slug>.html           — per-font labs (23 labs, e.g. inter.html, bebas-neue.html), no overwrite
    index.html
```

Legacy `workspace/font-catalog.json`, `workspace/font-gallery.html`, `workspace/font-lab.html` removed — use `workspace/fonts/*` only.

All labs via `font-lab filename=fonts/labs/<slug>.html`. Gallery via `font-gallery filename=fonts/galleries/gallery.html`.

Exports still at `workspace/themes/fonts/<slug>/` + `alpha/viz1/src/style/fonts/<slug>/`.
