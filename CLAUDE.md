# Digital Communications — operating instructions

This file is authoritative for routine work. `AGENTS.md` links to it so Codex and Claude share one
root contract. This file, `DESIGN.md`, `PRODUCT.md`, and selected `.claude/` instruction files are
tracked. Working plans, reports, source material, and other local records remain outside git and must
be backed up with the working copy. The full pre-migration instructions are in
`.claude/reference/archive/CLAUDE-2026-09.md`.

## Communication and authority

- Be exact about what was verified. Do not invent source content, references, results, or gate
  outcomes.
- The build pipeline, content schema, and sections of `DESIGN.md` marked LOCKED are locked. If a
  requested change needs one of them to change, report the issue before modifying it.
- Use `TODO.md` for current work and release state. Older `.claude/plans/` and `.claude/sdd/` files
  are historical when their status conflicts with `TODO.md` or a later report.
- Read `DESIGN.md` before editing a scene, figure, or style; read `PRODUCT.md` before design work.
  Read `.claude/reference/history.md` when the reason for a decision is unclear.
- When a design question is not settled by `DESIGN.md`, `.claude/rules/` or Module 1, take the answer
  from the sibling repository `~/Documents/GitHub/signals-and-systems` (its `DESIGN.md`, source and
  built output) rather than inventing one. Read it only; never edit that repository from here.

## Facts

- The artifact is `dist/Digital_Communications.html`, built by `build/build.js` from `build/src/*`.
- Seven modules, M0–M7 as declared in `build/src/80_content_core.js` (`CONTENT.MODULES`); addresses,
  sections and textbook anchors are declared once in `build/src/89_sections.js`.
- **Module 1 is converted to the slide design and is the reference.** Modules 2–6 are not yet
  converted and keep their pre-slide look; convert them from `DESIGN.md` and `.claude/rules/`, with
  no design decision of their own, the same way Signals and Systems converted its own Module 1.

## Task-specific rules

Claude Code loads path-scoped `.claude/rules/` files automatically when it reads matching files.
Codex must read the relevant rule files before making the corresponding change:

| Task | Read |
| --- | --- |
| Student-facing content, examples, questions, mathematics | `.claude/rules/content-writing.md` |
| Scenes, figures, plotting, styles, KaTeX | `.claude/rules/figures-and-math.md` and `DESIGN.md` |
| Notes or PDF production | `.claude/rules/notes-and-pdf.md` |
| Source-based authoring or correction | `.claude/rules/source-audit.md` |
| Build, verification, site, or generated output | `.claude/rules/build-pipeline.md` |

Read all applicable rows. These files hold the detailed editorial rules R1–R10, fixed mathematical
and content decisions, commands, and known implementation traps. Keep them as the single source of
those details; do not duplicate their full text here.

## Repository and working loop

- `build/src/` holds the interactive artifact; `notes/src/` holds lecture notes; `web/` builds the
  public page; `verify/` holds numerical checks; `dist/` is generated output. `source/` contains
  private reference material; never reproduce or redistribute it.
- The one place for chapter, section, address, and textbook anchors is `build/src/89_sections.js`.
  Scene order is assembled in `build/src/99_tail.html`.
- Run `git status` before writing generated output. Preserve unrelated changes in this shared tree.
  Stage only task-owned paths and state what a commit contains beyond your own work.
- Never hand-edit `dist/`, run `npm install`, or fetch dependencies from the network. Do not run
  blanket search-and-replace across `build/src/*.js`.
- `.claude/settings.json` and `.codex/hooks.json` call one repository guard: `agent_guard.py` blocks
  common `npm install` calls and direct agent edits to `dist/` before a tool runs. `stop_guard.py` is
  not wired to a hook and can be run by hand. Codex requires review and trust of new hook definitions
  before it runs them. These agent hooks are not CI gates.
- For routine source changes (styling, wording, a single figure), rebuild and inspect a screenshot;
  that is the whole loop. Run the full gate chain only before a release, after a change to
  mathematics or laboratory logic, or when the owner asks. Report actual gate numbers; do not
  substitute old baseline counts.
- Commit rebuilt tracked `dist/` files with the sources that produced them. For implementation work,
  commit and push to `main` unless the current task or active plan explicitly holds publication for
  review. No pull requests or AI attribution in commits.
- If work spans hours or is interrupted, update `TODO.md` and append durable context to
  `.claude/reference/history.md` before ending.
