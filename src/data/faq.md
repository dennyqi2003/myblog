<!--
  This file is the FAQ page. Edit it freely — anything you put here is rendered
  with the same markdown pipeline as your notes (GFM tables, LaTeX, syntax
  highlighted code, raw HTML).

  It is re-read on every `npm run build`, so you can update it straight from the
  server without touching any Vue code.
-->

### What is this site?

A personal notebook. Everything under [Post](/), [Archive](/archive/) and
[Tag](/tags/) is generated from a folder of markdown files — one file per note.
Publishing is nothing more than adding a `.md` file and rebuilding.

### How do I search?

Open [Search](/search/) and type. The index covers the full text of every note
and is fetched the first time you search, then kept in memory. Maths is excluded
from the index, so search for prose rather than for symbols.

### How are notes organised?

Each note opens with five metadata lines, then a blank line, then the writing
itself:

```
[^Date]: 2025.12.16
[^ERT ]: 11min
[^Author]: DennyQi
[^Title]: 01 Representing and Manipulating Information
[^Tag]: Informatics, Computer Systems, Computer Architecture
```

The tags are ordered and drive the [Tag](/tags/) tree — `A, B, C` files a note
under `A/B/C`. The file name and the folder it sits in are just a way to find
the file; they carry no meaning to the site.

### Why do some notes look different from the others?

Older notes were written in different tools and carry their own inline styling.
Raw HTML is preserved rather than thrown away, so a centred figure or an
underline looks the way it did when it was written.
