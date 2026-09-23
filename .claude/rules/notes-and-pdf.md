---
paths:
  - "notes/**/*"
  - "dist/*.pdf"
---

# Notes and PDF production

Read `content-writing.md` when authoring notes, examples, or solutions. In notes objects the
block-type key is `t`; a worked-example heading uses `hd`, never a second `t`. Duplicate `t` keys
silently remove a block.

Keep `build/` and `notes/` as sibling directories. The notes pipeline writes into `../dist`; do not
edit generated output by hand. Use the commands and gates in `build-pipeline.md`. On this machine
`.venv/` is an arm64 virtual environment; if it must be recreated, use
`/opt/homebrew/bin/python3.12 -m venv .venv` and install numpy, scipy, and sympy only for that
purpose. Never the x86_64 anaconda `python3`.

Before shipping any PDF, run `pdftotext -layout` over every page and fail on a `$...$` pair, a bare
TeX macro, or a nearly empty page. Render every page to an image and inspect it. The automated gates
do not read the PDFs.

`notes/src/notes.css` still carries an earlier palette than the artifact's own tokens; the lecture
notes and the artifact are not guaranteed to read as the same colour until that gap is closed. Do not
assume the two are in step without checking `10_style.css` against `notes/src/notes.css` directly.
